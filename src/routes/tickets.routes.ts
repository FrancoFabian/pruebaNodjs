import { Router } from 'express';
import {pool} from '../db';
import { getWeather } from '../services/weather_service';
import connectToRedis from '../redisdb';
const router = Router();

router.get('/', async(_req, res) => {
    const {rows} = await pool.query('SELECT * FROM tickets LIMIT 10');
  res.json(rows);
});
router.get('/test-weather', async (_req, res) => {
  try {
    const lat = 19.3371;
    const lon = -99.566;

    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: 'Latitud y longitud son requeridos y deben ser números.' });
    }

    const weather = await getWeather(lat, lon);
    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el clima' });
  }
});

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

export default router;