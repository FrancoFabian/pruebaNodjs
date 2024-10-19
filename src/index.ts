import express from 'express';
import ticketsRoutes from './routes/tickets.routes';

const app = express();
const port = 3000;

app.get('/', (_req, res) => {
  res.send('¡Hola desde mi nuevo proyecto con TypeScript!');
});
app.use('/tickets', ticketsRoutes);

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});