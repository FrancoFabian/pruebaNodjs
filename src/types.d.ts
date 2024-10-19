// CREATE TABLE tickets (
//     id SERIAL PRIMARY KEY,
//     origin VARCHAR(3),
//     destination VARCHAR(3),
//     airline VARCHAR(3),
//     flight_num VARCHAR(10),
//     origin_iata_code VARCHAR(3),
//     origin_name VARCHAR(255),
//     origin_latitude FLOAT,
//     origin_longitude FLOAT,
//     destination_iata_code VARCHAR(3),
//     destination_name VARCHAR(255),
//     destination_latitude FLOAT,
//     destination_longitude FLOAT
// );



// CREATE TABLE weather_reports (
//     id SERIAL PRIMARY KEY,
//     ticket_id INT,
//     origin_temperature FLOAT,
//     origin_description VARCHAR(255),
//     destination_temperature FLOAT,
//     destination_description VARCHAR(255),
//     FOREIGN KEY (ticket_id) REFERENCES tickets (id)
// );


export interface Ticket {
    id: number;
    origin: string;
    destination: string;
    airline: string;
    flight_num: string;
    origin_iata_code: string;
    origin_name: string;
    origin_latitude: number;
    origin_longitude: number;
    destination_iata_code: string;
    destination_name: string;
    destination_latitude: number;
    destination_longitude: number;
}
export interface WeatherReport {
    id: number;
    ticket_id: number;
    origin_temperature: number;
    origin_description: string;
    destination_temperature: number;
    destination_description: string;
}