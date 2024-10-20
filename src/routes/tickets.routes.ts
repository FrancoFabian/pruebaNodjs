import { Router } from 'express';
import { pool } from '../db';
//import { getWeather } from '../services/weather_service';
import connectToRedis from '../redisdb';
import { processTickets } from '../services/processTicket';
const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM tickets WHERE flight_num = '104'");
  res.json(rows);
});
router.get('/table-weather', async (_req, res) => {
  const { rows } = await pool.query('DELETE FROM weather_reports');
  res.json(rows);

});
// router.get('/test-weather', async (_req, res) => {
//   try {
//     const lat = 19.3371;
//     const lon = -99.566;

//     if (isNaN(lat) || isNaN(lon)) {
//       res.status(400).json({ error: 'Latitud y longitud son requeridos y deben ser números.' });
//     }

//     const weather = await getWeather(lat, lon);
//     res.json(weather);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al obtener el clima' });
//   }
// });

router.delete('/clear-cache', async (_req, res) => {
  try {
    const redisClient = await connectToRedis();

    // Obtener todas las claves
    const keys = await redisClient.keys('*');

    // Eliminar todas las claves
    if (keys.length > 0) {
      const result = await redisClient.del(keys);
      res.send(`Cleared ${result} keys from cache`);
    } else {
      res.status(404).send('No keys found in cache');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).send('Error clearing cache');
  }
});
router.get('/cache-contents', async (_req, res) => {
  try {
    const redisClient = await connectToRedis();

    // Obtener todas las claves
    const keys = await redisClient.keys('*');

    if (keys.length > 0) {
      // Obtener todos los valores
      const values = await redisClient.mGet(keys);

      // Crear un objeto JSON con las claves y valores
      const cacheContents: { [key: string]: any } = keys.reduce((acc: { [key: string]: any }, key: string, index: number) => {
        acc[key] = values[index];
        return acc;
      }, {});

      res.json(cacheContents);
    } else {
      res.status(404).send('No keys found in cache');
    }
  } catch (error) {
    console.error('Error retrieving cache contents:', error);
    res.status(500).send('Error retrieving cache contents');
  }
});

router.get('/process-tickets', async (_req, res) => {
  try {
    await processTickets();
    res.send('Tickets processed successfully');
  } catch (error) {
    console.error('Error processing tickets:', error);
    res.status(500).send('Error processing tickets');
  }
});
router.get('/tickets-weather/:page', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1; // Obtener el número de página de los parámetros de la solicitud
    const limit = 30; // Número de elementos por página
    const offset = (page - 1) * limit; // Calcular el desplazamiento para la consulta

    const query = `
      SELECT 
        t.id AS ticket_id, 
        t.origin, 
        t.destination, 
        t.airline, 
        t.flight_num,
        wr.origin_temperature, 
        wr.origin_description, 
        wr.destination_temperature, 
        wr.destination_description
      FROM tickets t
      JOIN weather_reports wr ON t.id = wr.ticket_id
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(query, [limit, offset]);

    // Obtener el número total de tickets para calcular el número total de páginas
    const countQuery = `
      SELECT COUNT(*) 
      FROM tickets t
      JOIN weather_reports wr ON t.id = wr.ticket_id
    `;
    const countResult = await pool.query(countQuery);
    const totalTickets = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTickets / limit);

    res.json({
      page,
      totalPages,
      tickets: rows,
    });
  } catch (error) {
    console.error('Error al obtener los tickets con clima:', error);
    res.status(500).send('Error al obtener los tickets con clima');
  }
});


export default router;