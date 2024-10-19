
# Cambiar delimitador de ' " '  a  ',' en archivo CSV
## Lo ejecute en un entorno linux Fedora
```
sed -i 's/"//g' ~/Documentos/airlines_db.csv
```
# Este comando permite entrar a la consola de postgres
```
sudo docker exec -it postgres_container bash
```
# Este comando es para acceder a la base de datos
```
psql -U franckdev -d airlines_DB

```
# insertar datos del archivo CSV en la base de datos
### previamente tuve que m mover manualmente el csv a esta ruta Documentos/postgresDB/Documentos/postgresDB/

### donde Documentos/postgresDB es la ruta donde se encuentra el docker-compose.yml
```
\copy tickets(origin, destination, airline, flight_num, origin_iata_code, origin_name, origin_latitude, origin_longitude, destination_iata_code, destination_name, destination_latitude, destination_longitude) FROM '/var/lib/postgresql/data/airlines_db.csv' DELIMITER ',' CSV HEADER;

```
# Configurando archivo .env
```
 PORT=3000 PORT_REDIS=6379 REDIS_PASSWORD="prueb@red15" npm run dev
 ```
 