/* Secuencia adaptativa compartida por el escritorio, las copias y el informe. */
const PracticeFlow={
 ensure(s){
  if(s.practiceFlow?.version===7)return s.practiceFlow;
  const flow=s.practiceFlow={version:7};
  // Reconstruye solo evidencias específicas, sin aprovechar errores de otros programas.
  for(const entry of s.activity||[])this.reduce(flow,s,entry.action,entry.detail||{});
  return flow;
 },
 observe(s,action,detail){this.reduce(this.ensure(s),s,action,detail||{})},
 reduce(f,s,action,d){
  if(action==='space-error'&&d.app==='image'&&!f.gimpRetried){f.gimpSpace=true;f.gimpInstaller ||= d.sourceFile||null;}
  if(action==='uninstall'&&['text','vlc'].includes(d.app)&&f.gimpSpace&&!f.gimpRetried){f.gimpFreed=true;if(f.gimpInstalledAfterError)f.gimpRetried=true;}
  if(action==='install-image'&&f.gimpSpace&&(!f.gimpInstaller||d.sourceFile===f.gimpInstaller)){f.gimpInstalledAfterError=true;if(f.gimpFreed)f.gimpRetried=true;}
  if(action==='save-image'&&d.file==='Cartel.png'&&['paint-image','resize-image'].every(v=>s.events.includes(v)))f.gimpEdited=true;
  if(action==='running-error'&&d.app==='image'&&f.gimpEdited)f.gimpBlocked=true;
  if(action==='uninstall'&&d.app==='image'&&f.gimpBlocked)f.gimpRemoved=true;
  if(action==='save-geo'&&['plot-function','geometry-shape'].every(v=>s.events.includes(v)))f.geoUsed=true;
  if(['delete-folder','delete-program-file'].includes(action)&&typeof d.path==='string'&&(d.path==='Archivos de Programa/geo'||d.path.startsWith('Archivos de Programa/geo/'))&&f.geoUsed)f.geoDeleted=true;
  if(action==='launch-error'&&d.app==='geo'&&f.geoDeleted)f.geoLaunchFailed=true;
  if(action==='pdf-generated')f.pdfGenerated=true;
  if(action==='classroom-confirmed'&&f.pdfGenerated)f.classroomConfirmed=true;
 }
};
function getPracticeTasks(s){
 const f=PracticeFlow.ensure(s),has=e=>s.events.includes(e),base=CONFIG.tasks.slice(0,7).map(t=>({...t,complete:t.events.every(has)}));
 const add=(id,title,complete,hints)=>base.push({id,title,complete,events:[],hints});
 add('gimp-space',f.gimpSpace?'Desinstala Word o VLC.':'Instala GIMP.',f.gimpSpace?!!f.gimpFreed:has('install-image'),f.gimpSpace?['Cerrar una aplicación no elimina su instalación.','Abre Programas y características en el Panel de control.','Si sigue abierta, ciérrala antes de desinstalar.']:['Busca la web oficial de GIMP.','El instalador se guardará en Descargas.','Abre el instalador y sigue su asistente.']);
 if(f.gimpSpace)add('gimp-retry','Vuelve a instalar GIMP desde el instalador que descargaste antes.',!!f.gimpRetried,['No es necesario descargarlo otra vez.','El instalador continúa en Descargas.','Ejecuta el archivo oficial que descargaste para GIMP.']);
 add('gimp-edit','Edita Cartel.png con GIMP: pinta, cambia su tamaño y guarda.',!!f.gimpEdited,['El cartel está entre los materiales extraídos.','Utiliza un pincel de color y cambia las dimensiones.','Guarda los cambios y mantén GIMP abierto.']);
 add('gimp-remove',f.gimpBlocked?'Cierra GIMP y desinstálalo.':'Mantén GIMP abierto e intenta desinstalarlo.',!!f.gimpRemoved,f.gimpBlocked?['Minimizar mantiene una aplicación en ejecución.','Cierra la ventana de GIMP.','Vuelve a desinstalarlo desde el Panel de control.']:['Realiza esta tarea después de guardar el cartel.','Mantén abierta la ventana de GIMP.','Busca GIMP en Programas y características.']);
 for(const id of ['geo-install','geo-use']){const t=CONFIG.tasks.find(t=>t.id===id);base.push({...t,complete:id==='geo-use'?!!f.geoUsed:t.events.every(has)});}
 add('geo-damage','Borra los archivos de GeoGebra de su carpeta de instalación e intenta abrirlo de nuevo.',!!f.geoLaunchFailed,['Primero guarda tu construcción.','Las instalaciones están en Este equipo → Windows (C:) → Archivos de Programa.','Elimina un componente de GeoGebra o su carpeta y prueba a abrir el programa desde Inicio o su acceso directo.']);
 for(const id of ['duo-install','duo-use']){const t=CONFIG.tasks.find(t=>t.id===id);base.push({...t,complete:t.events.every(has)});}
 add('classroom','Genera el PDF y súbelo a Classroom',!!f.pdfGenerated&&!!f.classroomConfirmed,['Utiliza el botón Generar PDF de este panel.','Adjunta el PDF descargado a la tarea de Classroom.','Después de entregarlo, confirma la entrega en este panel.']);
 return base;
}
