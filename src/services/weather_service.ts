import axios from 'axios';
import connectToRedis from '../redisdb';
import { CurrentWeatherResponse, WeatherAPIError, BadRequestError, UnauthorizedError, ForbiddenError, InternalServerError } from '../types';
import https from 'https';
import retry from 'retry';


export const getWeatherFromAPI = async (lat: number, lon: number): Promise<CurrentWeatherResponse['current']> => {
  const operation = retry.operation({
    retries: 5,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 60000,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const redisClient = await connectToRedis();
        const cacheKey = `weather:${lat},${lon}`;
        const cachedWeather = await redisClient.get(cacheKey);

        if (cachedWeather) {
          console.log(`Acierto de cache para: ${cacheKey}`);
          return resolve(JSON.parse(cachedWeather));
        }

        console.log(`Fallo de cache para: ${cacheKey}`);

        const response = await axios.get<CurrentWeatherResponse>(
          'http://api.weatherapi.com/v1/current.json',
          {
            params: {
              key: '0345cb230f4944b0975172841241910',
              q: `${lat},${lon}`,
            },
            httpsAgent: new https.Agent({ keepAlive: true, family: 4 }),
          }
        );

        const weatherData = response.data.current;
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(weatherData));

        resolve(weatherData);
      } catch (error: any) {
        console.error("Error completo:", error);
        if (axios.isAxiosError(error) && error.response) {
          const apiError: WeatherAPIError = error.response.data;
          switch (apiError.code) {
            case 1002:
            case 2006:
              console.error('Error de autenticación:', (apiError as UnauthorizedError).message);
              reject(apiError as UnauthorizedError); // Reject with specific error type
              break;
            case 1003:
            case 1005:
            case 1006:
            case 9000:
            case 9001:
              console.error('Error en la solicitud:', (apiError as BadRequestError).message);
              reject(apiError as BadRequestError); // Reject with specific error type
              break;
            case 2007:
            case 2008:
            case 2009:
              console.error('Error de acceso:', (apiError as ForbiddenError).message);
              reject(apiError as ForbiddenError); // Reject with specific error type
              break;
            case 9999:
              console.error('Error interno del servidor:', (apiError as InternalServerError).message);
              reject(apiError as InternalServerError); // Reject with specific error type
              break;
            default:
              if (error.response.status === 503 || error.response.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
                console.log(`Intento ${currentAttempt} fallido. Reintentando en ${retryDelay / 1000} segundos...`);
                if (operation.retry(error)) {
                  return;
                }
              }
              console.error('Error desconocido:', apiError);
          }
        } else {
          console.error('Error no relacionado con Axios', error);
        }
        reject(error);
      }
    });
  });
};
