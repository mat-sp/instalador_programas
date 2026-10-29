/* Ampliación de práctica: tamaños didácticos, catálogo y objetivos editables. */
Object.assign(CONFIG.apps.zip,{size:210,channel:'web'});
Object.assign(CONFIG.apps.vlc,{size:240,channel:'web'});
Object.assign(CONFIG.apps.text,{size:230,channel:'store'});
Object.assign(CONFIG.apps.image,{size:270,channel:'web'});
delete CONFIG.apps.office; // Word es la aplicación ofimática de esta práctica.
CONFIG.apps.geo={name:'GeoGebra',icon:'📐',size:120,downloadSize:20,domain:'geogebra.org',publisher:'GeoGebra',description:'Gráficas de funciones y geometría dinámica',extensions:['ggb'],kind:'geometry',filename:'GeoGebra-setup.exe',channel:'web'};
CONFIG.apps.duo={name:'Duolingo',icon:'🦉',size:55,downloadSize:0,domain:'duolingo.com',publisher:'Duolingo',description:'Actividades de inglés',extensions:[],kind:'language',channel:'store',filename:'duolingo-setup.exe'};
CONFIG.apps.game={name:'Arcane Survivors',icon:'🎮',size:30,downloadSize:0,publisher:'Aula PC',description:'Supervivencia de fantasía: héroes, oleadas, mejoras y jefes. Individual o cooperativo local.',extensions:[],kind:'game',channel:'store'};
CONFIG.storeCatalog=[
 {id:'text',category:'Productividad',color:'#185abd',rating:'4,7'},
 {id:'duo',category:'Educación',color:'#58a700',rating:'4,8'},
 {id:'game',category:'Juegos',color:'#7135cc',rating:'4,9'},
 {id:'vlc',category:'Multimedia',color:'#ed8500',rating:'4,6',locked:true},
 {id:'zip',category:'Utilidades',color:'#525e70',rating:'4,5',locked:true},
 {id:'image',category:'Creatividad',color:'#534c44',rating:'4,6',locked:true},
 {id:'geo',category:'Educación',color:'#635ee5',rating:'4,7',locked:true},
 {id:'spotify',name:'Spotify',icon:'♫',publisher:'Spotify',description:'Música y podcasts',category:'Multimedia',color:'#158747',rating:'4,6',locked:true},
 {id:'whatsapp',name:'WhatsApp',icon:'◉',publisher:'WhatsApp',description:'Mensajería',category:'Social',color:'#16823e',rating:'4,7',locked:true},
 {id:'paint',name:'Paint',icon:'🎨',publisher:'Microsoft',description:'Dibujo y creatividad',category:'Creatividad',color:'#327eb8',rating:'4,5',locked:true},
 {id:'minecraft',name:'Minecraft',icon:'▦',publisher:'Mojang',description:'Construcción y aventuras',category:'Juegos',color:'#567f32',rating:'4,8',locked:true},
 {id:'netflix',name:'Netflix',icon:'N',publisher:'Netflix',description:'Entretenimiento',category:'Multimedia',color:'#a90c21',rating:'4,4',locked:true}
];
const task=(id,title,events,hints)=>({id,title,events,hints});
CONFIG.tasks=[
 task('zip','Busca e instala 7-Zip desde su web oficial.',['install-zip'],['Usa el navegador y comprueba el dominio.','El programa de extracción se llama 7-Zip.','El archivo descargado se guarda en Descargas.']),
 task('extract','Extrae Materiales.zip en Documentos.',['extract'],['El ZIP contiene los materiales de la práctica.','Necesitas una aplicación de archivos comprimidos.','Abre el ZIP con 7-Zip.']),
 task('vlc','Busca e instala VLC desde su web oficial.',['install-vlc'],['Busca el reproductor multimedia.','Comprueba quién distribuye el instalador.','VideoLAN es el proyecto de VLC.']),
 task('video','Reproduce el vídeo; después páusalo y detenlo.',['play-video','pause-video','stop-video'],['El vídeo está en la carpeta extraída.','Los controles de VLC incluyen reproducción y pausa.','Detener vuelve al principio del vídeo.']),
 task('word','Instala Microsoft Word desde Microsoft Store.',['store-install-text'],['Hay otra forma de obtener aplicaciones.','Busca la tienda en Inicio.','Consulta la ficha de Word en Microsoft Store.']),
 task('edit-text','Edita Notas.txt en Word, aplica formato y guarda.',['save-text','format-text'],['Escribe una recomendación para descargar con seguridad.','Selecciona texto para cambiar su aspecto.','Guarda el documento al terminar.']),
 task('with','Abre un material usando «Abrir con».',['open-with'],['Las extensiones orientan sobre el programa necesario.','Consulta las opciones del archivo.','Elige una aplicación compatible.']),
 task('geo-install','Busca e instala GeoGebra desde su web oficial.',['install-geo'],['Algunos programas solo están disponibles desde su web en esta práctica.','Comprueba el origen de la descarga.','Puedes liberar más espacio si hace falta.']),
 task('geo-use','Representa una función y construye una figura geométrica en GeoGebra.',['plot-function','geometry-shape','save-geo'],['Introduce una expresión como x^2.','Selecciona una herramienta de geometría.','Guarda la construcción cuando termines.']),
 task('duo-install','Instala Duolingo desde Microsoft Store.',['store-install-duo'],['Consulta las aplicaciones de educación de la tienda.','Busca Duolingo.','Abre su ficha e instálalo.']),
 task('duo-use','Completa una lección de inglés en Duolingo.',['duo-lesson'],['Cada actividad tiene una respuesta correcta.','Puedes volver a intentarlo después de un error.','Completa todas las actividades de una lección.'])
];
CONFIG.contents.text.text='MI EQUIPO DE PRÁCTICA\n\nUn archivo y un programa no son lo mismo. La extensión orienta sobre el tipo de contenido.\n\nEscribe tu nombre, explica cómo identificas una descarga oficial y añade dos recomendaciones de seguridad. Da formato al título y guarda los cambios.\n';
