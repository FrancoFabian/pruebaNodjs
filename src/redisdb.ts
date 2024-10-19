import { createClient } from 'redis';

const connectToRedis = async () => { 
  const redisClient = createClient({
    socket: {
      host: 'localhost',
      port: 6379,
    },
    password: process.env.REDIS_PASSWORD // O usa process.env.REDIS_PASSWORD
  });

  redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
  });

  await redisClient.connect(); 
  return redisClient;
};

export default connectToRedis;