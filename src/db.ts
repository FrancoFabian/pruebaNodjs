import pg from 'pg';

export const pool = new pg.Pool({
    user: 'franckdev',
    host: 'localhost',
    database: 'airlines_DB',
    password: 'prueb@sd3Desarrollo',
    port: 5432,
});
export const processTicketsPool = new pg.Pool({ 
    user: 'franckdev',
    host: 'localhost',
    database: 'airlines_DB',
    password: 'prueb@sd3Desarrollo',
    port: 5432,
  });
