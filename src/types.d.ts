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

// Interfaz para la respuesta de la API de clima actual
export interface CurrentWeatherResponse {
    location: Location;
    current: Current;
  }
  
  // Interfaz para la información de ubicación
  export interface Location {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  }
  
  // Interfaz para la información del clima actual
  export interface Current {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: Condition;
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
    // ... otros campos que desees incluir ...
  }
  
  // Interfaz para la condición del clima
  export interface Condition {
    text: string;
    icon: string;
    code: number;
  }
  // Interfaz genérica para errores de la API
export interface WeatherAPIError {
    code: number;
    message: string;
  }
  
  // Errores específicos
  export interface UnauthorizedError extends WeatherAPIError {
    code: 1002 | 2006; 
  }
  
  export interface BadRequestError extends WeatherAPIError {
    code: 1003 | 1005 | 1006 | 9000 | 9001;
  }
  
  export interface ForbiddenError extends WeatherAPIError {
    code: 2007 | 2008 | 2009;
  }
  
  export interface InternalServerError extends WeatherAPIError {
    code: 9999;
  }