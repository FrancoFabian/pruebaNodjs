
## Cambiar delimitador de ' " '  a  ',' en archivo CSV
### Lo ejecute en un entorno linux Fedora
```
sed -i 's/"//g' ~/Documentos/airlines_db.csv
```
## Este comando permite entrar a la consola de postgres
```
sudo docker exec -it postgres_container bash
```
## Este comando es para acceder a la base de datos
```
psql -U franckdev -d airlines_DB

```
##  Insertar datos del archivo CSV en la base de datos
> [!NOTE] 
> Previamente tuve que mover manualmente el csv a esta ruta Documentos/postgresDB/Documentos/postgresDB/ , donde Documentos/postgresDB es la ruta donde se encuentra el docker-compose.yml
```sql
\copy tickets(origin, destination, airline, flight_num, origin_iata_code, origin_name, origin_latitude, origin_longitude, destination_iata_code, destination_name, destination_latitude, destination_longitude) FROM '/var/lib/postgresql/data/airlines_db.csv' DELIMITER ',' CSV HEADER;

```
### Instalar dependencias
```
npm install
```

> [!IMPORTANT]
> Arrancar aplicacion de nodejs con variables de entorno
```
 PORT=3000 PORT_REDIS=6379 REDIS_PASSWORD="prueb@red15" npm run dev
 ```
## Modelado del reto
### [Como aborde el problema?](docs/comolleguealasolucion.md)

## Documentación

### [Explicacion de la funcion getWeatherFromAPI](docs/getWeatherFromAPI.md)
### [Explicacion de la funcion insertionQueue](docs/insertionQueue.md)
### [Explicacion de la funcion processTicket](docs/processTicket.md)

## Investigar solución
### [Recurso para aprender un poco de redis Faztcode](https://youtu.be/QUmM8jdviLg?si=DcpHYT0O4_HT5EEA)
### [Recurso para aprender async.queue](https://youtu.be/WXF8RxqhP_c?si=31XxyJ0SiWC4peoO)
### [Recurso para aprender como funcionan las colas ](https://youtu.be/VP61sxajsgo?si=VsCEagX2CHpjC7sJ)
### [Recurso para aprender a usar retry](https://youtu.be/fYZfFdbr8mc?si=GL7rs1_P_GL0aLAz)
### [Recurso para aprender a usar pg-promise](https://www.npmjs.com/package/pg-promise#documentation)
