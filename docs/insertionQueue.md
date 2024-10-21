# insertionQueue

Esta funcion implementa una cola de inserciones usando la librería \`async.queue\`, para procesar eficientemente lotes de tickets y sus datos meteorológicos, almacenándolos en la base de datos PostgreSQL.

## 1. Librerías Importadas

*   **\`async\`:**  Maneja la cola de tareas de forma asíncrona.
*   **\`pg-promise\`:**  Interactúa con PostgreSQL, proporcionando una API para consultas SQL, transacciones y ejecución de consultas.

## 2. Conexión a la Base de Datos

```javascript
const pgp = pgPromise();

const connectionDetails = {
  user: 'franckdev',
  host: 'localhost',
  database: 'airlines_DB',
  password: 'prueb@sd3Desarrollo',
  port: 5432,
};

const db = pgp(connectionDetails);
```

*   **\`pgPromise()\`:** Inicializa pg-promise.
*   **\`connectionDetails\`:** Define los detalles de conexión a la base de datos (usuario, host, etc.).
*   **\`db\`:** Objeto que representa la conexión a la base de datos.

## 3. \`insertionQueue\`

La cola de inserción (\`insertionQueue\`) procesa tickets y datos meteorológicos en lotes.

```javascript
export const insertionQueue = async.queue(async (task, callback) => {
  // ... (código de la función) ...
}, 10);
```

*   **\`async.queue\`:** Crea una cola que ejecuta un número limitado de tareas en paralelo (límite: 10).
*   **\`task\`:** Conjunto de tickets y datos meteorológicos.
*   **\`callback\`:** Función que se invoca al finalizar la tarea.

## 4. Procesamiento de Tickets

```typescript
const records = tickets.map((ticket, index) => {
  // ...
});
```

*   **\`tickets.map\`:** Itera sobre los tickets para construir los registros a insertar.
*   **\`originWeather\` y \`destinationWeather\`:** Datos meteorológicos del origen y destino.

    Cada registro incluye:

    *   \`ticket_id\`
    *   \`origin_temperature\`
    *   \`origin_description\`
    *   \`destination_temperature\`
    *   \`destination_description\`

## 5. División en Lotes (Batching)

```javascript
const batchSize = 500;
const chunks = [];
for (let i = 0; i < records.length; i += batchSize) {
  chunks.push(records.slice(i, i + batchSize));
}
```

*   **\`batchSize\`:** Tamaño del lote (500 registros).
*   **División en lotes:** Se divide el arreglo de registros en lotes para evitar operaciones de inserción demasiado grandes.

## 6. Inserción de Datos

```javascript
for (const chunk of chunks) {
  const cs = new pgp.helpers.ColumnSet([
    'ticket_id',
    'origin_temperature',
    'origin_description',
    'destination_temperature',
    'destination_description'
  ], { table: 'weather_reports' });

  const query = pgp.helpers.insert(chunk, cs);
  await db.none(query);
}
```

*   **\`pgp.helpers.ColumnSet\`:** Define las columnas a insertar en la tabla \`weather_reports\`.
*   **\`pgp.helpers.insert\`:** Crea una consulta de inserción masiva.
*   **\`await db.none(query)\`:** Ejecuta la consulta.

## 7. Manejo de Errores y Callback

```javascript
try {
  // ...
  console.log(\`Tickets insertados correctamente: \${tickets.map(ticket => ticket.id).join(', ')}\`);
  callback(null);
} catch (error) {
  console.error(\`Error al insertar datos en la base de datos: \`, error);
  callback(error);
}
```

*   Si la inserción es exitosa, se invoca el callback con \`null\`.
*   Si ocurre un error, se captura y se llama al callback con el error.

## 8. Paralelismo

```javascript
}, 10);
```

*   El número 10 indica que se permiten hasta 10 tareas de inserción en paralelo.
