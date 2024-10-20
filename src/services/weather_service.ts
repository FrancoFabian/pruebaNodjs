import axios from 'axios';
import connectToRedis from '../redisdb';
import { CurrentWeatherResponse, WeatherAPIError, BadRequestError, UnauthorizedError, ForbiddenError, Ticket } from '../types';
import https from 'https';
import weatherQueue from './weatherQueue';
import async from 'async';
import { processTicketsPool } from '../db';
import retry from 'retry'; // Importar retry
import pgp from 'pg-promise'; 

// Cola para las inserciones en la base de datos
export const insertionQueue = async.queue(async (task: { ticket: Ticket; originWeather: any; destinationWeather: any; callback: (err: any) => void }) => {
  const { ticket, originWeather, destinationWeather, callback } = task;

  try {
    await processTicketsPool.query(
      `INSERT INTO weather_reports (ticket_id, origin_temperature, origin_description, destination_temperature, destination_description) 
           VALUES ($1, $2, $3, $4, $5)`,
      [
        ticket.id,
        originWeather.temp_c,
        originWeather.condition.text,
        destinationWeather.temp_c,
        destinationWeather.condition.text,
      ]
    );
    callback(null);
  } catch (error) {
    console.error(`Error al insertar datos del ticket ${ticket.id} en la base de datos:`, error);
    callback(error); 
  }}, 100); // Concurrencia de 100 para las inserciones

export const getWeather = async (lat: number, lon: number, ticket: Ticket): Promise<CurrentWeatherResponse['current']> => {
  return new Promise((resolve, reject) => {
    weatherQueue.push({
      lat, lon, callback: (err, result) => {
        if (err) {
          reject(err);
        } else {
          // Agregar la tarea a la cola de inserciones después de obtener los datos del clima
          insertionQueue.push({ ticket, originWeather: result, destinationWeather: result, callback: (err) => {
            if (err) {
              console.error('Error en la cola de inserciones:', err);
            } 
          }});
          resolve(result);
        }
      }
    });
  });
};

export const getWeatherFromAPI = async (lat: number, lon: number): Promise<CurrentWeatherResponse['current']> => {

  const operation = retry.operation({
    retries: 5, // Número máximo de reintentos
    factor: 2, // Factor de retraso exponencial
    minTimeout: 1000, // Tiempo mínimo de espera entre reintentos (1 segundo)
    maxTimeout: 60000, // Tiempo máximo de espera entre reintentos (1 minuto)
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const redisClient = await connectToRedis();
        const cacheKey = `weather:${lat},${lon}`;
        const cachedWeather = await redisClient.get(cacheKey);

        if (cachedWeather) {
          console.log(`Cache hit for ${cacheKey}`);
          return resolve(JSON.parse(cachedWeather)); // Resolver la promesa si hay caché
        }

        console.log(`Cache miss for ${cacheKey}`);

        const response = await axios.get<CurrentWeatherResponse>(
          'http://api.weatherapi.com/v1/current.json',
          {
            params: {
              key: '0345cb230f4944b0975172841241910', //API key de WeatherAPI
              q: `${lat},${lon}`,
            },
            httpsAgent: new https.Agent({ keepAlive: true, family: 4 }),
          }
        );

        const weatherData = response.data.current;

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(weatherData));

        resolve(weatherData); // Resolver la promesa con los datos del clima
      } catch (error: any) {
        console.error("Error completo:", error);
        if (axios.isAxiosError(error) && error.response) {
          // Manejo de errores de la API de WeatherAPI
          const apiError: WeatherAPIError = error.response.data;
          switch (apiError.code) {
            case 1002:
            case 2006:
              console.error('Error de autenticación:', (apiError as UnauthorizedError).message);
              break;
            case 1003:
            case 1005:
            case 1006:
            case 9000:
            case 9001:
              console.error('Error en la solicitud:', (apiError as BadRequestError).message);
              break;
            case 2007:
            case 2008:
            case 2009:
              console.error('Error de acceso:', (apiError as ForbiddenError).message);
              break;
            case 9999:
              console.error('Error interno del servidor:', apiError.message);
              break;
            default:
              // Reintentar si el error es 503 (Service Unavailable)
              if (error.response.status === 503) {
                console.log(`Intento ${currentAttempt} fallido. Reintentando...`);
                if (operation.retry(error)) {
                  return; // Salir del intento actual y esperar el reintento
                }
              }
              console.error('Error desconocido:', apiError);
          }
        } else {
          console.error('Error no relacionado con Axios', error);
        }
        reject(error); // Rechazar la promesa si hay un error no recuperable
      }
    });
  });
};