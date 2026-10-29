function store(data={}){
  const w=makeWindow('store','Microsoft Store','🛍',data);if(data.app)w.data.app=data.app;
  const category=w.data.category||'Inicio',q=(w.data.query||'').toLowerCase();
  const entry=w.data.app&&CONFIG.storeCatalog.find(x=>x.id===w.data.app);
  const app=e=>({...e,...CONFIG.apps[e.id]});
  w.body.innerHTML=`<div class="store-shell"><aside><h2>▦</h2>${['Inicio','Aplicaciones','Educación','Juegos','Biblioteca'].map(c=>`<button data-store-category="${c}" class="${category===c?'active':''}">${c}</button>`).join('')}</aside><main><form id="store-search"><input aria-label="Buscar en Microsoft Store" placeholder="Buscar aplicaciones, juegos y mucho más" value="${esc(w.data.query||'')}"><button>Buscar</button></form><div class="store-content"></div></main></div>`;
  $('#store-search',w.body).onsubmit=e=>{e.preventDefault();w.data.query=$('#store-search input',w.body).value;delete w.data.app;store()};
  $$('[data-store-category]',w.body).forEach(b=>b.onclick=()=>{w.data.category=b.dataset.storeCategory;w.data.query='';delete w.data.app;store()});
  const area=$('.store-content',w.body);
  if(entry){const a=app(entry),installed=!!engine.s.installed[a.id]&&!engine.isBroken(a.id);
    area.innerHTML=`<button id="store-back">← Volver</button><article class="store-detail"><div class="store-app-icon" style="background:${a.color}">${a.icon}</div><div><h1>${esc(a.name)}</h1><p>${esc(a.publisher)}</p><p>★ ${a.rating} &nbsp; ${a.category} &nbsp; ${CONFIG.apps[a.id]?.size||'-'} MB</p><button class="primary" id="store-install" ${a.locked?'disabled':''}>${a.locked?'No disponible en esta práctica':installed?'Abrir':'Obtener'}</button><p id="store-status" role="status"></p></div></article><h2>Descripción</h2><p>${esc(a.description)}</p>${a.locked?'<p>La ficha se puede consultar. Para los programas de la tarea que no se obtienen aquí, busca su web oficial en Chrome.</p>':''}<div class="store-preview" style="border-color:${a.color}"><strong>${esc(a.name)}</strong><p>${a.id==='text'?'Escribe, da formato y guarda tus documentos.':a.id==='duo'?'Traduce, completa y practica inglés a tu ritmo.':'Elige tu héroe, sobrevive a las oleadas y mejora tus poderes. Cinco zonas, tres clases y modo cooperativo local.'}</p></div><small>Ficha educativa simulada. No incluye una licencia comercial ni instala software en el equipo real.</small>`;
    $('#store-back',area).onclick=()=>{delete w.data.app;store()};
    $('#store-install',area).onclick=()=>{if(a.locked)return;if(installed)return openApp(a.id);startStoreInstall(w,a.id)};
  }else{
    const entries=CONFIG.storeCatalog.filter(e=>{const a=app(e);return(!q||(a.name+' '+a.description).toLowerCase().includes(q))&&(category==='Biblioteca'?!!engine.s.installed[e.id]:['Educación','Juegos'].includes(category)?a.category===category:true)});
    area.innerHTML=`${category==='Inicio'&&!q?'<div class="store-hero"><small>DESCUBRE · CREA · APRENDE</small><h1>Tu próxima idea empieza aquí.</h1><p>Aplicaciones para aprender y trabajar en tu ordenador.</p></div>':''}<h2>${q?'Resultados de búsqueda':category}</h2><div class="store-grid">${entries.map(e=>{const a=app(e);return `<button class="store-card" data-store-app="${e.id}"><span class="store-app-icon" style="background:${a.color}">${a.icon}</span><strong>${esc(a.name)}</strong><small>${a.category} · ★ ${a.rating}</small><span>${a.locked?'Consultar':engine.s.installed[e.id]?'Instalado':'Obtener'}</span></button>`}).join('')}</div>${entries.length?'':'<p>No se han encontrado aplicaciones.</p>'}`;
    $$('[data-store-app]',area).forEach(b=>b.onclick=()=>store({app:b.dataset.storeApp}));
  }saveWindows();return w;
}
function startStoreInstall(w,id){
  if(w.installing)return;
  const entry=CONFIG.storeCatalog.find(e=>e.id===id);
  if(!entry||entry.locked||!['text','duo','game'].includes(id))return;
  try{
    if(!engine.folderExists('Archivos de Programa'))throw Error('No se encuentra Archivos de Programa. Restaura la carpeta.');
    if(engine.free()<engine.installRequired(id)){engine.event('space-error',{app:id,free:engine.free(),required:engine.installRequired(id)});throw Error('Espacio insuficiente. Necesitas '+CONFIG.apps[id].size+' MB y tienes '+engine.free()+' MB disponibles.');}
    w.installing=true;const session=engine.email;const b=$('#store-install',w.body);b.disabled=true;b.textContent='Instalando…';let n=0;
    const timer=setInterval(()=>{if(windows.get('store')!==w||engine.email!==session){clearInterval(timer);w.installing=false;return}if(engine.s.fraudIncident)return;n+=20;const status=$('#store-status',w.body);if(status)status.textContent='Instalando… '+n+' %';if(n>=100){clearInterval(timer);w.installing=false;try{engine.install(id,{source:'store'});refresh();if(windows.get('store')===w)store({app:id});toast(CONFIG.apps[id].name+' está instalado.')}catch(e){store({app:id});message('No se puede instalar',e.message)}}},350);
    w.cleanup=()=>{clearInterval(timer);w.installing=false};
  }catch(e){message('No se puede instalar',e.message)}
}
