import { processTicketsPool } from '../db';
import { getWeather, insertionQueue } from './weather_service';
import { Ticket } from '../types';

export const processTickets = async () => {
  try {
    const { rows: tickets } = await processTicketsPool.query('SELECT * FROM tickets'); // Obtener todos los tickets

    const weatherPromises = tickets.map(async (ticket: Ticket) => {
      try {
        await getWeather(ticket.origin_latitude, ticket.origin_longitude, ticket);
        await getWeather(ticket.destination_latitude, ticket.destination_longitude, ticket);
      } catch (err) {
        console.error(`Error processing ticket with ID ${ticket.id}:`, err);
      }
    });

    try {
      await Promise.all(weatherPromises); // Esperar a que se completen todas las promesas
      console.log('All tickets processed successfully.');
    } catch (error) {
      console.error('Error en Promise.all:', error);
    } finally {
      // Esperar a que la cola insertionQueue se vacíe
      insertionQueue.drain(() => {
        console.log('Cola de inserciones vaciada.');
        processTicketsPool.end(); // Cerrar la conexión a la base de datos
      });
    }

  } catch (err) {
    console.error('Error processing tickets:', err);
  } 
};