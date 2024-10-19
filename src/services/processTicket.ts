import {pool} from '../db';
import { getWeather } from './weather_service';
import { Ticket } from '../types';
export const processTickets = async () => {
    try {
      // Conexión a la base de datos y obtención de los tickets
      const { rows: tickets } = await pool.query('SELECT * FROM tickets');
  
      // Creación de promesas para obtener el clima y actualizar la base de datos
      const weatherPromises = tickets.map(async (ticket: Ticket) => {
        try {
          const originWeather = await getWeather(ticket.origin_latitude, ticket.origin_longitude);
          const destinationWeather = await getWeather(ticket.destination_latitude, ticket.destination_longitude);
  
          // Inserción de los datos del clima en la base de datos
          await pool.query(
            `INSERT INTO weather_reports (ticket_id, origin_temperature, origin_description, destination_temperature, destination_description)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                ticket.id,
                originWeather.temperature,
                originWeather.summary, // Cambiado a summary
                destinationWeather.temperature,
                destinationWeather.summary // Cambiado a summary
            ]
          );
        } catch (err) {
          console.error(`Error processing ticket with ID ${ticket.id}:`, err);
        }
      });
  
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(weatherPromises);
      console.log('All tickets processed successfully.');
    } catch (err) {
      console.error('Error processing tickets:', err);
    } finally {
      // Cerrar la conexión a la base de datos
      await pool.end();
    }
  };