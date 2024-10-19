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

// Interfaces para la respuesta de la API de MeteoSource
export interface WeatherDescription {
    description: string;
}

export interface CurrentWeather {
    icon: string;
    icon_num: number;
    summary: string;
    temperature: number;
    wind: {
        speed: number;
        angle: number;
        dir: string;
    };
    precipitation: {
        total: number;
        type: string;
    };
    cloud_cover: number;
}
export interface MeteosourceResponse {
    current: CurrentWeather;
}

// Interfaces para las respuestas de error
export interface ErrorResponse {
    detail: string | { loc: (string | number)[], msg: string, type: string }[];
}

export interface Error400Response extends ErrorResponse {
    detail: string;
}

export interface Error402Response extends ErrorResponse {
    detail: string;
}

export interface Error403Response extends ErrorResponse {
    detail: string;
}

export interface Error422Response extends ErrorResponse {
    detail: { loc: (string | number)[], msg: string, type: string }[];
}

export interface Error429Response extends ErrorResponse {
    detail: string;
}
