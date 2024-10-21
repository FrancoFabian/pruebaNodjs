# getWeatherFromAPI

## Descripción

Es la función asíncrona que obtiene información del clima a través de una API y maneja diferentes escenarios, incluyendo reintentos en caso de errores y almacenamiento en caché para optimizar el acceso a los datos.

## Inicio de la función \`getWeatherFromAPI\`

```typescript
export const getWeatherFromAPI = async (lat: number, lon: number): Promise<CurrentWeatherResponse['current']> => {
  // ...
};
```

Esta es una función que toma dos argumentos:

*   \`lat\` (latitud) y \`lon\` (longitud): Las coordenadas geográficas para las que se desea obtener el clima.

Retorna una promesa que contiene el objeto \`CurrentWeatherResponse['current']\`, el cual representa la respuesta actual del clima obtenida de la API.


## Configuración de la operación de reintentos

```typescript
const operation = retry.operation({
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 60000,
});
```

Se configura el módulo de reintentos (\`retry\`) para manejar fallos temporales al realizar solicitudes a la API.

Aquí está la lógica:

*   \`retries: 5\`: Se reintentará un máximo de 5 veces si ocurre un error.
*   \`factor: 2\`: El tiempo de espera entre reintentos se duplica después de cada fallo.
*   \`minTimeout: 1000\`: El tiempo mínimo de espera entre reintentos es de 1 segundo.
*   \`maxTimeout: 60000\`: El tiempo máximo de espera entre reintentos es de 60 segundos.

Esto asegura que, en caso de fallos, las solicitudes se reintenten de manera controlada, aumentando gradualmente el tiempo de espera.


## Inicio de la promesa principal:

```typescript
return new Promise((resolve, reject) => {
  operation.attempt(async (currentAttempt) => {
    // ...
  });
});
```

La función devuelve una promesa. Dentro de la promesa, se inicia el primer intento de la operación, y si esta falla, se manejarán los reintentos gracias a \`operation.attempt\`.


## Uso de Redis para caché:

```typescript
const redisClient = await connectToRedis();
const cacheKey = \`weather:\${lat},\${lon}\`;
const cachedWeather = await redisClient.get(cacheKey);

if (cachedWeather) {
  console.log(\`Acierto de cache para: \${cacheKey}\`);
  return resolve(JSON.parse(cachedWeather));
}

console.log(\`Fallo de cache para: \${cacheKey}\`);
```

Se conecta al cliente de Redis, que es una base de datos en memoria, utilizada aquí para almacenar datos en caché.

*   Se genera una clave de caché (\`cacheKey\`) basada en las coordenadas geográficas (\`lat\`, \`lon\`).
*   Si los datos del clima ya están en la caché (\`cachedWeather\`), se resuelve la promesa con los datos cacheados sin hacer otra solicitud a la API.
*   Si los datos no están en la caché, continúa con la solicitud a la API.

> **¿Por qué se usa la caché?**

> Utilizar una caché en Redis evita realizar solicitudes repetitivas a la API para las mismas coordenadas, mejorando el rendimiento y reduciendo costos.


## Solicitar los datos del clima desde la API:

```typescript
const response = await axios.get<CurrentWeatherResponse>(
  'http://api.weatherapi.com/v1/current.json',
  {
    params: {
      key: '0345cb230f4944b0975172841241910',
      q: \`\${lat},\${lon}\`,
    },
    httpsAgent: new https.Agent({ keepAlive: true, family: 4 }),
  }
);
```

Si no se encuentran datos en la caché, se realiza una solicitud HTTP a la API del clima usando Axios. Se envían las coordenadas y la clave de API como parámetros de la solicitud.


## Guardar los resultados en la caché:

```typescript
const weatherData = response.data.current;
await redisClient.setEx(cacheKey, 1800, JSON.stringify(weatherData));
```

Una vez obtenida la respuesta de la API, se guarda el resultado en la caché Redis con una duración de 30 minutos (1800 segundos). Esto garantiza que las solicitudes para las mismas coordenadas, dentro de ese período, no se realizarán nuevamente a la API.


## Manejo de errores y reintentos:

```typescript
} catch (error: any) {
  if (axios.isAxiosError(error) && error.response) {
    const apiError: WeatherAPIError = error.response.data;
    switch (apiError.code) {
      // Manejo de errores específicos
    }
  } else {
    console.error('Error no relacionado con Axios', error);
  }
  reject(error);
}
```

Si la solicitud falla, el bloque \`catch\` maneja los errores:

*   Si el error es específico de Axios (error en la solicitud HTTP), se identifican y manejan varios códigos de error según la respuesta de la API.
*   Los errores 429 (demasiadas solicitudes) y 503 (servicio no disponible) activan el reintento con un retraso controlado por \`retry-after\`.


## Reintentos automáticos:

```typescript
if (error.response.status === 503 || error.response.status === 429) {
  const retryAfter = error.response.headers['retry-after'];
  const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
  console.log(\`Intento \${currentAttempt} fallido. Reintentando en \${retryDelay / 1000} segundos...\`);
  if (operation.retry(error)) {
    return;
  }
}
```

En el caso de errores temporales como el 429 o 503, el código espera el tiempo especificado en la cabecera \`retry-after\` antes de volver a intentar la solicitud. El reintento se gestiona con la operación configurada de \`retry\`, evitando así que los fallos temporales detengan el proceso.
