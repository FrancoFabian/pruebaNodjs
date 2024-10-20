import async from 'async';
import axios from 'axios';
import { getWeatherFromAPI } from './weather_service';

const weatherQueue = async.queue(async (task: { lat: number; lon: number; callback: (err: any, result: any) => void }) => {
  const { lat, lon, callback } = task;

  try {
    const weather = await getWeatherFromAPI(lat, lon);
    callback(null, weather);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;

      console.log(`Too many requests, reintentando en ${retryDelay / 1000} segundos...`);
      setTimeout(() => {
        weatherQueue.push(task);
      }, retryDelay);
    } else {
      callback(error, null);
    }
  }
}, 100);

export default weatherQueue;
