import express from 'express';
import ticketsRoutes from './routes/tickets.routes';
import connectToRedis from './redisdb';

const app = express();
const port = 3000;

app.get('/', (_req, res) => {
  res.send('¡Hola desde mi nuevo proyecto con TypeScript!');
});
app.use('/tickets', ticketsRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

let isRedisTested = false; 

const testRedisConnection = async () => {
  if (isRedisTested) {
    return; // Salir si ya se ejecutó la prueba
  }

  try {
    const redisClient = await connectToRedis();
    const response = await redisClient.ping();
    if (response === 'PONG') {
      console.log('Conexión a Redis exitosa');
    } else {
      console.error('Error al conectar a Redis');
    }
  } catch (error) {
    console.error('Error al probar la conexión a Redis:', error);
  } finally {
    isRedisTested = true; // Marcar la prueba como ejecutada
  }
};

testRedisConnection();