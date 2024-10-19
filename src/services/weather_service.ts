import axios from 'axios';
import connectToRedis from '../redisdb';
import { MeteosourceResponse, Error400Response, Error402Response, Error403Response, Error422Response, Error429Response } from '../types';
import https from 'https';
export const getWeather = async (lat: number, lon: number) => {
  try {
    const httpsAgent = new https.Agent({ 
        keepAlive: true, 
        family: 4  // Forzar IPv4 si es necesario
      });
    // Conectar a Redis
    const redisClient = await connectToRedis();

    // Generar la clave de caché
    const cacheKey = `weather:${lat},${lon}`;

    // Buscar la respuesta en la caché
    const cachedWeather = await redisClient.get(cacheKey);

    // Si la respuesta está en caché, devolverla
    if (cachedWeather) {
      console.log(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedWeather) as MeteosourceResponse['current'];
    }

    // Si no está en caché, obtenerla de la API
    console.log(`Cache miss for ${cacheKey}`);
    //https://www.meteosource.com/api/v1/free/point
    const response = await axios.get<MeteosourceResponse>(`https://www.meteosource.com/api/v1/free/point`, {
        params: {
          lat: lat,
          lon: `${Math.abs(lon)}W`, // Corrección aquí
          sections: 'current',
          timezone: 'auto',
          key: 'y3bvqt8lboi69mfcnz2r5vk6s46rhy9xe4bxtrjv' 
        },
        httpsAgent: httpsAgent
      });

    // Extraer los datos de la respuesta
    const weatherData = response.data.current;

    // Guardar la respuesta en la caché (caché por 1 hora)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(weatherData));

    // Devolver la respuesta
    return weatherData;

  } catch (error: any) {
    console.error("Error completo:", error);
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;

      switch (statusCode) {
        case 400:
          console.error('Error 400: Bad Request', errorData as Error400Response);
          break;
        case 402:
          console.error('Error 402: Payment Required', errorData as Error402Response);
          break;
        case 403:
          console.error('Error 403: Forbidden', errorData as Error403Response);
          break;
        case 422:
          console.error('Error 422: Unprocessable Entity', errorData as Error422Response);
          break;
        case 429:
          console.error('Error 429: Too Many Requests', errorData as Error429Response);
          break;
        default:
          console.error('Error desconocido', errorData);
      }
    } else {
      console.error('Error no relacionado con Axios', error);
    }
    throw error; // Relanzar el error
  }
};
