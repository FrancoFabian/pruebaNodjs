import async from 'async';
import pgPromise from 'pg-promise';
import { Ticket } from '../types';

const pgp = pgPromise();

const connectionDetails = {
    user: 'franckdev',
    host: 'localhost',
    database: 'airlines_DB',
    password: 'prueb@sd3Desarrollo',
    port: 5432,
};

const db = pgp(connectionDetails);

export const insertionQueue = async.queue(async (task: { tickets: Ticket[]; originWeather: any[]; destinationWeather: any[]; callback: (err: any) => void }) => {
    const { tickets, originWeather, destinationWeather, callback } = task;

    try {
        console.log(`Procesando ${tickets.length} tickets en la cola de inserciones`);
        console.log(`IDs de tickets: ${tickets.map(ticket => ticket.id).join(', ')}`);

        const records = tickets.map((ticket, index) => {
            console.log(`Insertando ticket ${ticket.id}`);
            return {
                ticket_id: ticket.id,
                origin_temperature: originWeather[index].temp_c,
                origin_description: originWeather[index].condition.text,
                destination_temperature: destinationWeather[index].temp_c,
                destination_description: destinationWeather[index].condition.text,
            }
        });

        const batchSize = 500;
        const chunks = [];
        for (let i = 0; i < records.length; i += batchSize) {
            chunks.push(records.slice(i, i + batchSize));
        }

        for (const chunk of chunks) {
            const cs = new pgp.helpers.ColumnSet([
                'ticket_id',
                'origin_temperature',
                'origin_description',
                'destination_temperature',
                'destination_description'
            ], { table: 'weather_reports' });

            const query = pgp.helpers.insert(chunk, cs);
            await db.none(query);
        }

        console.log(`Tickets insertados correctamente: ${tickets.map(ticket => ticket.id).join(', ')}`);
        callback(null);
    } catch (error) {
        console.error(`Error al insertar datos en la base de datos:`, error);
        callback(error);
    }
}, 10);