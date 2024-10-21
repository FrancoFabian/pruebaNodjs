# Abordando el Desafío de las 3000 Peticiones a la API del Clima

Al abordar este proyecto, el primer paso fue comprender el problema: se me pidió realizar aproximadamente 3,000 peticiones a una API de clima para cada ticket de vuelo, con el objetivo de reportar el clima tanto en el origen como en el destino de cada uno. Para lograrlo, comencé revisando el dataset y explorando los campos disponibles, donde noté que se proporcionaban las coordenadas de latitud y longitud tanto del origen como del destino.

Con esta información, investigué qué APIs de clima aceptaban coordenadas (incluyendo decimales y decimales negativos). Inicialmente, encontré la API de Meteosource y revisé su documentación para entender tanto las respuestas como los tipos de error que podía manejar. Sin embargo, debido a su límite de 10 peticiones por minuto, su uso resultaba insuficiente, por lo que busqué una alternativa que ofreciera una mayor capacidad de solicitudes. Finalmente, elegí otra API que permitía hasta 60 peticiones gratuitas por minuto.

En lugar de procesar el archivo CSV directamente, decidí migrar el dataset a una base de datos PostgreSQL, dado que me resulta más eficiente conectarme a una base de datos para manejar grandes volúmenes de información. Utilicé un delimitador de coma (",") para preparar el archivo CSV y un comando en PostgreSQL para cargar los datos en una tabla.

Luego, pensé en cómo manejar de manera eficiente tantas peticiones. Sabía que Redis podría ser útil para almacenar las respuestas de las peticiones repetidas en una caché y así mejorar el rendimiento. Encontré un tutorial en YouTube que explicaba cómo usar Redis con Node.js y lo utilicé como referencia para implementar esta solución. La idea era que, antes de hacer una petición a la API, primero consultara la caché para ver si los datos ya estaban almacenados y, de ser así, utilizarlos en lugar de realizar una nueva petición.

Con la estructura en mente, opté por TypeScript como el lenguaje de implementación y utilicé Node.js y Express para desarrollar el sistema, ya que estaba familiarizado con estas herramientas. Configuré el proyecto para que se conectara tanto a Redis como a PostgreSQL, y creé una tabla para almacenar los datos del clima asociados a cada ticket.

Inicialmente, creí que usando \`async\`, \`await\` y \`Promise.all\` sería suficiente para manejar la concurrencia. Pero pronto noté que al extraer todos los tickets y realizar las peticiones, la API se saturaba debido al límite de peticiones por minuto. Entonces, cambié de API, lo que implicó también adaptar mis interfaces para las nuevas respuestas.

Luego, exploré técnicas de concurrencia más avanzadas, como el uso de colas de tareas. Primero intenté con \`Queue\`, pero descubrí que la librería \`async\` ofrecía una cola más robusta con su método \`queue\`. Sin embargo, aún me encontré con errores al exceder el límite de peticiones de la API, lo que me llevó a utilizar la librería \`retry\` para manejar estos casos, extrayendo de las cabeceras de las respuestas el tiempo de espera antes de poder reintentar.

Otro reto fue el manejo de las conexiones IP, ya que la API a veces no respondía a través de IPv6, lo que me llevó a probar con IPv4 para estabilizar las conexiones.

Finalmente, me encontré con un cuello de botella en las inserciones en la base de datos. Para resolverlo, investigué cómo agrupar las inserciones y encontré la librería \`pg-promise\`, que me permitió mejorar el manejo concurrente de las inserciones en PostgreSQL. Para no saturar el sistema, dividí los tickets en lotes de 400, lo que me permitió hacer las inserciones de manera eficiente y, al final, logré procesar los 3,000 registros de forma concurrente y optimizada.
