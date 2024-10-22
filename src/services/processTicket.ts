import { processTicketsPool } from '../db';
import { getWeatherFromAPI} from './weather_service';
import { Ticket } from '../types';
import { insertionQueue } from './insertion_service';

export const processTickets = async () => {
  try {
    const { rows: tickets } = await processTicketsPool.query('SELECT * FROM tickets');

    // Dividir los tickets en lotes de 400
    const batchSize = 400;
    const ticketChunks = [];
    for (let i = 0; i < tickets.length; i += batchSize) {
      // Verificar si quedan suficientes elementos para un lote completo
      if (i + batchSize <= tickets.length) {
        ticketChunks.push(tickets.slice(i, i + batchSize));
      } else {
        // Crear un lote con los elementos restantes
        ticketChunks.push(tickets.slice(i));
      }
    }

    // Procesar cada lote de tickets
    for (const ticketChunk of ticketChunks) {
      const weatherPromises = ticketChunk.map(async (ticket: Ticket) => {
        const originWeather = await getWeatherFromAPI(ticket.origin_latitude, ticket.origin_longitude);
        const destinationWeather = await getWeatherFromAPI(ticket.destination_latitude, ticket.destination_longitude);

        return { originWeather, destinationWeather };
      });

      try {
        const weatherResults = await Promise.all(weatherPromises);

        // Extraer los datos del clima de las promesas
        const originWeatherData = weatherResults.map(result => result.originWeather);
        const destinationWeatherData = weatherResults.map(result => result.destinationWeather);

        // Agregar la tarea a la cola de inserciones
        insertionQueue.push({
          tickets: ticketChunk,
          originWeather: originWeatherData,
          destinationWeather: destinationWeatherData,
          callback: (err) => {
            if (err) {
              console.error('Error en la cola de inserciones:', err);
            }
          }
        });

      } catch (error) {
        console.error('Error en Promise.all:', error);
        // Detener el procesamiento si hay un error
        break;
      }
    }

    console.log('Todos los lotes de tickets procesados.');

  } catch (err) {
    console.error('Error processing tickets:', err);
  } finally {
    // Esperar a que la cola insertionQueue se vacíe
    insertionQueue.drain(() => {
      console.log('Cola de inserciones vaciada.');
      processTicketsPool.end(); // Cerrar la conexión a la base de datos
    });
  }
};