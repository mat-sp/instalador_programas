/* PDF real generado localmente con pdf-lib (MIT), sin impresión ni servidor. */
const ACTIVITY_NAMES={'launch-error':'Programa no iniciado: faltan archivos','delete-program-file':'Componente del programa eliminado','classroom-confirmed':'Entrega en Classroom confirmada por el alumno','web-visit':'Página o búsqueda consultada','program-open':'Programa abierto','cancel-install':'Instalación cancelada','preference':'Preferencia cambiada','fraud-install':'Instalador fraudulento ejecutado',session:'Inicio de sesión','document-saved':'Documento guardado','file-added':'Archivo añadido',download:'Descarga completada','space-error':'Falta de espacio','running-error':'Desinstalación bloqueada por programa abierto',uninstall:'Programa desinstalado','free-space':'Espacio recuperado',extract:'Archivo comprimido extraído','open-with':'Abrir con','wrong-app':'Aplicación incompatible','play-video':'Vídeo reproducido','pause-video':'Vídeo en pausa','stop-video':'Vídeo detenido','save-text':'Documento guardado','format-text':'Formato de texto aplicado','read-text':'Documento abierto','view-image':'Imagen abierta','paint-image':'Imagen pintada','resize-image':'Imagen escalada','save-image':'Imagen guardada','plot-function':'Función representada','geometry-shape':'Figura geométrica construida','save-geo':'Construcción guardada','duo-lesson':'Lección de inglés completada','delete-file':'Archivo eliminado','delete-folder':'Carpeta eliminada','restore-folder':'Carpeta restaurada','fraud-recovered':'Recuperación tras instalación fraudulenta','save-progress':'Copia de progreso guardada','load-progress':'Copia de progreso cargada',hint:'Pista consultada','game-start':'Juego iniciado','game-complete':'Zona de juego completada','game-defeat':'Partida de supervivencia terminada','game-resume':'Partida reanudada','game-upgrade':'Mejora del héroe elegida','game-talent':'Talento permanente adquirido','pdf-generated':'Informe PDF generado'};
function activityLabel(action){if(action.startsWith('store-install-'))return 'Instalación desde Store: '+(CONFIG.apps[action.slice(14)]?.name||action);if(action.startsWith('install-'))return 'Instalación: '+(CONFIG.apps[action.slice(8)]?.name||action);return ACTIVITY_NAMES[action]||action}
async function buildPracticePDF(e){
 const {PDFDocument,StandardFonts,rgb}=PDFLib;
 const pdf=await PDFDocument.create();
 async function embeddedFont(name,base){
  const font=await pdf.embedFont(base),meta=REPORT_FONTS[name],response=await fetch('assets/fonts/'+name+'.ttf');if(!response.ok)throw Error('No se puede cargar la fuente del informe.');const bytes=new Uint8Array(await response.arrayBuffer());
  font.embedder.widthOfTextAtSize=(text,size)=>Array.from(text).reduce((sum,ch)=>{const code=font.embedder.encoding.encodeUnicodeCodePoint(ch.codePointAt(0)).code;return sum+(meta.widths[code-32]||600)},0)*size/1000;
  font.embedder.embedIntoContext=(context,ref)=>{const file=context.register(context.flateStream(bytes,{Length1:bytes.length}));const desc=context.register(context.obj({Type:'FontDescriptor',FontName:name,Flags:32,FontBBox:meta.bbox,ItalicAngle:0,Ascent:meta.ascent,Descent:meta.descent,CapHeight:meta.ascent,StemV:80,FontFile2:file}));context.assign(ref,context.obj({Type:'Font',Subtype:'TrueType',BaseFont:name,FirstChar:32,LastChar:255,Widths:meta.widths,FontDescriptor:desc,Encoding:'WinAnsiEncoding'}));return ref};return font;
 }
 const font=await embeddedFont('DejaVuSans',StandardFonts.Helvetica),bold=await embeddedFont('DejaVuSans-Bold',StandardFonts.HelveticaBold);
 pdf.setTitle('Informe de práctica - Aula PC');pdf.setAuthor('Aula PC');
 const clean=value=>String(value??'').replace(/[\u0000-\u0008]/g,'').replace(/[^\u0020-\u007e\u00a0-\u00ff\n\r\t]/g,'?');
 const blue=rgb(.08,.22,.41),grey=rgb(.32,.37,.43),line=rgb(.85,.89,.93);let page,y;
 const date=s=>new Date(s).toLocaleString('es-ES',{timeZone:'Europe/Madrid'});
 function newPage(){page=pdf.addPage([595.28,841.89]);y=768;page.drawText('AULA PC  /  DIGITALIZACION 4.º ESO',{x:44,y:807,size:9,font:bold,color:blue});page.drawLine({start:{x:44,y:797},end:{x:551,y:797},color:line,thickness:1})}
 function ensure(height=20){if(!page||y-height<52)newPage()}
 function text(value,{size=10,strong=false,color=grey,indent=0,after=5}={}){
  const selected=strong?bold:font,width=507-indent;
  for(const paragraph of clean(value).split('\n')){let row='';for(const word of paragraph.split(/\s+/)){if(!word)continue;let parts=[word];if(selected.widthOfTextAtSize(word,size)>width){parts=[];let chunk='';for(const ch of word){if(selected.widthOfTextAtSize(chunk+ch,size)>width){parts.push(chunk);chunk=''}chunk+=ch}parts.push(chunk)}for(const part of parts){if(row&&selected.widthOfTextAtSize(row+' '+part,size)>width){ensure(size+4);page.drawText(row,{x:44+indent,y,size,font:selected,color});y-=size+4;row=part}else row+=(row?' ':'')+part}}ensure(size+4);if(row)page.drawText(row,{x:44+indent,y,size,font:selected,color});y-=size+4;}y-=after;
 }
 function heading(title){ensure(48);y-=9;text(title,{size:15,strong:true,color:blue,after:9})}
 newPage();text('Informe de la práctica',{size:24,strong:true,color:blue,after:14});text('Alumno/a: '+e.email,{size:12,strong:true});text('Generado: '+date(Date.now()));text('Inicio del registro: '+(e.s.createdAt?date(e.s.createdAt):'No registrado'));
 const tasks=getPracticeTasks(e.s),done=tasks.filter(t=>t.complete).length;
 text('Tareas completadas: '+done+' de '+tasks.length+'  |  Sin calificación numérica.',{strong:true});
 heading('Lista de tareas');
 tasks.forEach((t,i)=>{const complete=t.complete;text((complete?'[HECHA] ':'[PENDIENTE] ')+(i+1)+'. '+t.title,{strong:complete,color:complete?rgb(.08,.4,.3):grey});const hints=(e.s.hints[t.id]||0)+(e.s.hints[t.id+'-recovery']||0);if(hints)text('Pistas consultadas: '+hints,{size:9,indent:16})});
 const flow=PracticeFlow.ensure(e.s);text('PDF: '+(flow.pdfGenerated?'Generado':'Pendiente')+'. Entrega en Classroom: '+(flow.classroomConfirmed?'Confirmada por el alumno (confirmación manual).':'Pendiente de confirmación del alumno.'),{size:9});
 heading('Equipo, aplicaciones y almacenamiento');text('Disco: '+CONFIG.capacity+' MB. Usado: '+e.used()+' MB. Libre: '+e.free()+' MB. Sistema: '+CONFIG.systemSize+' MB.');
 for(const [id,v] of Object.entries(e.s.installed))text(CONFIG.apps[id].name+' | '+e.programUsed(id)+' MB | '+(e.isBroken(id)?'Instalación dañada':'Operativo')+' | Origen: '+(v.source==='store'?'Microsoft Store':'Web / versión anterior')+' | '+(v.path||'C:\\Program Files'));
 if(!Object.keys(e.s.installed).length)text('No hay aplicaciones instaladas.');
 text('Preferencias: contraste '+(e.s.preferences?.contrast||'standard')+'; reloj '+(e.s.preferences?.hour12?'12':'24')+' horas.');
 if(e.s.deletedFolders?.length)text('Carpetas eliminadas: '+e.s.deletedFolders.join(', '));
 heading('Archivos actuales');for(const f of e.s.files)text(f.folder+' / '+f.name+' | '+f.size+' MB'+(f.fraudulent?' | Instalador de anuncio':'')+(f.source?' | Origen: '+f.source:''),{size:9});
 for(const f of e.s.files.filter(f=>f.text!==undefined)){heading('Documento: '+f.name);text('Última modificación: '+(f.modifiedAt?date(f.modifiedAt):'Sin cambios guardados')+' | Formato aplicado: '+(f.formatted?'Sí':'No'));text(f.text||'(Documento vacío)',{size:10});}
 for(const f of e.s.files.filter(f=>f.ext==='png')){heading('Imagen: '+f.name);text(f.imageEdit?'Dimensiones: '+f.imageEdit.width+' × '+f.imageEdit.height+' px. Pincel/texto: '+(f.imageEdit.painted?'Sí':'No')+'. Escalada: '+(f.imageEdit.resized?'Sí':'No')+'.':'Sin edición guardada.');try{const bytes=f.asset?.startsWith('data:')?f.asset:await fetch(f.asset).then(r=>{if(!r.ok)throw Error();return r.arrayBuffer()});const image=await pdf.embedPng(bytes);const scale=Math.min(500/image.width,245/image.height);ensure(image.height*scale+15);page.drawImage(image,{x:44,y:y-image.height*scale,width:image.width*scale,height:image.height*scale});y-=image.height*scale+15}catch{text('Vista previa no disponible.')}}
 if(e.s.geo){heading('GeoGebra: construcción guardada');for(const s of e.s.geo.expressions)text('y = '+s);for(const [i,p] of e.s.geo.points.entries())text(String.fromCharCode(65+i%26)+' = ('+p.x.toFixed(3)+', '+p.y.toFixed(3)+')',{size:9});for(const s of e.s.geo.shapes)text(s.kind+': '+s.points.map(i=>String.fromCharCode(65+i%26)).join(', '),{size:9});}
 if(e.s.duo){heading('Inglés: registro de Duolingo');text('Actividades completadas: '+e.s.duo.index+'/'+ENGLISH_LESSON.length+'. Intentos: '+e.s.duo.attempts+'. Errores corregidos: '+e.s.duo.errors+'.');for(const a of e.s.duo.answers||[])text('Actividad '+a.activity+': '+a.answer+' - '+(a.correct?'Correcta':'Reintento'),{size:9});}
 if(e.s.game){heading('Juego opcional');const g=e.s.game;if(g.kind==='survivor'){text('Arcane Survivors | Zonas desbloqueadas: '+g.unlockedZone+'/5. Partidas: '+g.runs+'. Victorias: '+g.victories+'. Mejor nivel: '+g.bestLevel+'. Esquirlas: '+g.shards+'.');text('Talentos: '+JSON.stringify(g.talents),{size:9});if(g.checkpoint)text('Partida guardada: zona '+g.checkpoint.zone+', nivel '+g.checkpoint.level+', '+Math.floor(g.checkpoint.time)+' s.',{size:9});for(const r of g.results)text('Zona '+r.zone+' | '+(r.won?'Victoria':'Derrota')+' | '+r.seconds+' s | Nivel '+r.level+' | Enemigos: '+r.kills+' | Jugadores: '+r.mode,{size:9});}else text('Registro del juego anterior: '+(g.levelsCompleted??0)+' niveles completados.');}
 heading('Historial de acciones');text('Se registran acciones y resultados, no cada pulsación. Las versiones anteriores no disponían de historial detallado.',{size:9});
 for(const item of e.s.activity||[]){let detail=typeof item.detail==='string'?item.detail:JSON.stringify(item.detail||{});text(date(item.time)+' | '+activityLabel(item.action)+(detail&&detail!=='{}'?' | '+detail:''),{size:8.5,after:3});}
 if(e.s.fraudIncident)text('Incidente de instalación fraudulenta pendiente de recuperación.',{strong:true});
 const pages=pdf.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:44,y:40},end:{x:551,y:40},color:line});p.drawText('Aula PC - '+clean(e.email),{x:44,y:26,size:8,font,color:grey});p.drawText((i+1)+' / '+pages.length,{x:515,y:26,size:8,font,color:grey})});
 return pdf.save();
}
async function generateReport(){
 if(generateReport.busy)return;generateReport.busy=true;
 try{
  toast('Generando informe PDF…');for(const w of windows.values())if(w.flush&&w.flush()===false)return;saveWindows();
  const originalState=engine.s,snapshot=new Engine(CONFIG,{getItem:()=>null,setItem:()=>{}});snapshot.email=engine.email;snapshot.s=structuredClone(engine.s);PracticeFlow.observe(snapshot.s,'pdf-generated',{});
  const bytes=await buildPracticePDF(snapshot);
  downloadBlob(new Blob([bytes],{type:'application/pdf'}),'Informe_AulaPC_'+snapshot.email.replace(/[^a-z0-9]/gi,'_')+'.pdf');
  if(engine.s===originalState)engine.event('pdf-generated',{tasks:getPracticeTasks(engine.s).filter(t=>t.complete).length});
  toast('Informe PDF descargado. Súbelo a Classroom y confirma la entrega en Tareas.');
 }catch(e){message('No se puede generar el PDF',e.message)}finally{generateReport.busy=false}
}
