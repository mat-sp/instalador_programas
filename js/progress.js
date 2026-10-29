/* Copias portables: validación antes de sustituir el estado. */
function validateProgressState(s, depth=0) {
  if(!s||s.version!==1||!Array.isArray(s.files)||!s.installed||!Array.isArray(s.events))throw Error('El archivo no contiene un progreso compatible.');
  if(s.files.length>300||s.events.length>1000||(s.activity||[]).length>30000)throw Error('El progreso supera los límites admitidos.');
  const ids=new Set();
  for(const f of s.files){
    if(!f||typeof f.id!=='string'||ids.has(f.id)||typeof f.name!=='string'||typeof f.folder!=='string'||!['Escritorio','Descargas','Documentos'].some(p=>f.folder===p||f.folder.startsWith(p+'/'))||f.folder.includes('..')||!Number.isFinite(f.size)||f.size<0||f.size>CONFIG.capacity)throw Error('Hay un archivo inválido en la copia.');
    if(!['zip','mp4','png','jpg','txt','docx','exe','ggb'].includes(f.ext)||f.id.length>120||f.name.length>255||f.folder.length>255)throw Error('Tipo de archivo no válido.');
    f.icon=({zip:'🗜',mp4:'🎬',png:'🖼',jpg:'🖼',txt:'📄',docx:'🟦',exe:'📦',ggb:'📐'})[f.ext];
    ids.add(f.id);
    if(f.app&&!Object.hasOwn(CONFIG.apps,f.app))throw Error('Aplicación desconocida en una descarga.');
    if(f.asset&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(f.asset)&&!['assets/practica.mp4','assets/cartel.png'].includes(f.asset))throw Error('Recurso de archivo no válido.');
    if(f.children&&(!Array.isArray(f.children)||f.children.some(id=>!CONFIG.contents[id])))throw Error('Material comprimido no válido.');
    if(f.html&&typeof sanitizeRichHTML==='function')f.html=sanitizeRichHTML(f.html);
  }
  for(const [id,v] of Object.entries(s.installed))if(!Object.hasOwn(CONFIG.apps,id)||!v||typeof v!=='object')throw Error('Instalación desconocida en la copia.');
  for(const id of Object.values(s.associations||{}))if(!Object.hasOwn(CONFIG.apps,id))throw Error('Asociación de archivo no válida.');
  if(s.deletedFolders&&(!Array.isArray(s.deletedFolders)||s.deletedFolders.some(p=>typeof p!=='string'||p.includes('..')||p.length>300)))throw Error('Carpetas no válidas.');
  if(s.events.some(v=>typeof v!=='string')||(s.activity||[]).some(v=>!v||typeof v.action!=='string'||!Number.isFinite(Date.parse(v.time))))throw Error('Historial no válido.');
  for(const g of [s.geo,...s.files.map(f=>f.construction)].filter(Boolean)){if(!Array.isArray(g.expressions)||g.expressions.length>12||g.expressions.some(v=>typeof v!=='string'||v.length>150)||!Array.isArray(g.points)||g.points.length>60||g.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))||!Array.isArray(g.shapes)||g.shapes.length>100||g.shapes.some(p=>!['segment','circle','triangle'].includes(p.kind)||!Array.isArray(p.points)||p.points.length!==(p.kind==='triangle'?3:2)||p.points.some(i=>!Number.isInteger(i)||i<0||i>=g.points.length)))throw Error('Construcción geométrica no válida.');g.scale=Math.max(15,Math.min(90,Number(g.scale)||35));}
  if(s.duo&&(!Number.isInteger(s.duo.index)||s.duo.index<0||s.duo.index>10||!Array.isArray(s.duo.answers)||s.duo.answers.length>5000||s.duo.answers.some(a=>!a||typeof a.answer!=='string'||typeof a.correct!=='boolean'||!Number.isInteger(a.activity))))throw Error('Lección no válida.');
  if(s.practiceFlow){if(s.practiceFlow.version!==7)delete s.practiceFlow;else{for(const key of ['gimpSpace','gimpFreed','gimpRetried','gimpInstalledAfterError','gimpEdited','gimpBlocked','gimpRemoved','geoUsed','geoDeleted','geoLaunchFailed','pdfGenerated','classroomConfirmed'])if(s.practiceFlow[key]!==undefined&&typeof s.practiceFlow[key]!=='boolean')throw Error('Secuencia de tareas no válida.');if(s.practiceFlow.gimpInstaller!=null&&typeof s.practiceFlow.gimpInstaller!=='string')throw Error('Instalador no válido.');}}
  if(s.game?.kind==='survivor'){
   const g=s.game;if(g.version!==1||!Number.isInteger(g.shards)||g.shards<0||g.shards>10000000||!Number.isInteger(g.unlockedZone)||g.unlockedZone<1||g.unlockedZone>5||!g.talents||['power','vitality','wisdom'].some(k=>!Number.isInteger(g.talents[k])||g.talents[k]<0||g.talents[k]>5)||!Array.isArray(g.results)||g.results.length>20||g.results.some(r=>!r||!Number.isInteger(r.zone)||r.zone<1||r.zone>5||typeof r.won!=='boolean'||!Number.isFinite(r.seconds)||r.seconds<0))throw Error('Progreso del juego no válido.');
   for(const key of ['runs','victories','bestLevel'])if(!Number.isInteger(g[key])||g[key]<0)throw Error('Estadística de juego no válida.');
   if(g.checkpoint){if(g.checkpoint.state!=='playing')throw Error('La partida guardada no está en curso.');if(typeof SurvivorGame==='undefined')throw Error('El motor del juego no está disponible.');SurvivorGame.validate(g.checkpoint);}
  }else if(s.game){if(s.game.currentLevel!==undefined&&(!Number.isInteger(s.game.currentLevel)||s.game.currentLevel<1||s.game.currentLevel>5))throw Error('Nivel de juego no válido.');if(s.game.results&&(!Array.isArray(s.game.results)||s.game.results.length>5||s.game.results.some(r=>!r||!Number.isInteger(r.level)||r.level<1||r.level>5||!Number.isFinite(r.seconds)||r.seconds<0||!Number.isInteger(r.hits)||r.hits<0)))throw Error('Progreso del juego no válido.');}
  s.windows=[];s.activity ||= [];s.hints ||= {};s.associations ||= {};
  if(s.fraudIncident){if(depth||!Number.isFinite(s.fraudIncident.until))throw Error('Incidente no válido.');validateProgressState(s.fraudIncident.snapshot,depth+1);}
  if(s.folderUndo){if(depth>2||!s.folderUndo.snapshot)throw Error('Restauración inválida.');validateProgressState({...s,folderUndo:null,fraudIncident:null,files:s.folderUndo.snapshot.files,deletedFolders:s.folderUndo.snapshot.deletedFolders},depth+1);}
  return s;
}
Engine.prototype.exportProgress=function(){return JSON.stringify({format:'AulaPC-progress',version:2,email:this.email,exportedAt:new Date().toISOString(),state:this.s},null,2)};
Engine.prototype.importProgress=function(raw){
  if(typeof raw!=='string'||raw.length>24000000)throw Error('El archivo de progreso es demasiado grande.');
  const copy=JSON.parse(raw);
  if(copy.format!=='AulaPC-progress'||copy.version!==2||typeof copy.email!=='string')throw Error('Selecciona un archivo de progreso de Aula PC.');
  const next=validateProgressState(copy.state),previous=this.s;this.s=next;
  try{this.log('load-progress',{originalEmail:copy.email,exportedAt:copy.exportedAt})}catch(e){this.s=previous;try{this.save()}catch{}throw Error('No hay espacio en este navegador para cargar la copia.');}
};
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000)}
function saveProgress(){
  if(engine.s.fraudIncident)return;
  for(const w of windows.values())if(w.flush&&w.flush()===false)return;
  saveWindows();engine.log('save-progress',{email:engine.email});
  downloadBlob(new Blob([engine.exportProgress()],{type:'application/json'}),'AulaPC_'+engine.email.replace(/[^a-z0-9]/gi,'_')+'.json');
  toast('Copia descargada. Consérvala para continuar en otro equipo.');
}
function loadProgress(){
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.onchange=async()=>{const f=input.files[0];if(!f)return;if(f.size>24000000)return message('No se puede cargar','El archivo es demasiado grande.');
    try{const raw=await f.text();const probe=JSON.parse(raw);validateProgressState(structuredClone(probe.state));
      message('Cargar progreso','Se sustituirá la práctica actual por la copia de '+String(probe.email||'usuario')+'. Guarda antes tu progreso si quieres conservarlo.',[['Cancelar',()=>{}],['Cargar',()=>{
        try{engine.importProgress(raw);restoring=true;for(const id of [...windows.keys()])closeWindow(id);restoring=false;applyPreferences();refresh();renderTasks();if(engine.s.fraudIncident)showFraudIncident();else if(engine.s.folderUndo)folderDeletionWarning();toast('Progreso cargado.');}
        catch(e){message('No se puede cargar',e.message)}
      }]]);
    }catch(e){message('No se puede cargar',e.message)}
  };input.click();
}
