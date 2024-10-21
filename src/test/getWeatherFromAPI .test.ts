import axios from 'axios';
import { getWeatherFromAPI } from '../services/weather_service';
import connectToRedis from '../redisdb';
import https from 'https';
jest.mock('axios');
jest.mock('../redisdb');

describe('getWeatherFromAPI', () => {
  const mockRedisClient = {
    get: jest.fn(),
    setEx: jest.fn(),
  };

  (connectToRedis as jest.Mock).mockResolvedValue(mockRedisClient);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debería devolver datos meteorológicos almacenados en caché si están disponibles', async () => {
    const lat = 19.4326;
    const lon = -99.1332;
    const cachedWeather = {
      temp_c: 25,
      condition: { text: 'Soleado' },
      // ... other weather data
    };
    (mockRedisClient.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedWeather));

    const weather = await getWeatherFromAPI(lat, lon);

    expect(mockRedisClient.get).toHaveBeenCalledWith(`weather:${lat},${lon}`);
    expect(axios.get).not.toHaveBeenCalled();
    expect(weather).toEqual(cachedWeather);
  });

  it('Debería obtener datos meteorológicos de la API si no están almacenados en caché', async () => {
    const lat = 19.4326;
    const lon = -99.1332;
    const weatherData = {
      temp_c: 25,
      condition: { text: 'Soleado' },
      // ... other weather data
    };
    (mockRedisClient.get as jest.Mock).mockResolvedValueOnce(null);
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { current: weatherData },
    });

    const weather = await getWeatherFromAPI(lat, lon);

    expect(mockRedisClient.get).toHaveBeenCalledWith(`weather:${lat},${lon}`);
    expect(axios.get).toHaveBeenCalledWith(
      'http://api.weatherapi.com/v1/current.json',
      {
        params: {
          key: '0345cb230f4944b0975172841241910',
          q: `${lat},${lon}`,
        },
        httpsAgent: expect.any(https.Agent),
      }
    );
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      `weather:${lat},${lon}`,
      1800,
      JSON.stringify(weatherData)
    );
    expect(weather).toEqual(weatherData);
  });

});