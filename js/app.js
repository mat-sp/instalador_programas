"use strict";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const engine = new Engine(CONFIG, localStorage);
let windows = new Map(),
  z = 10,
  restoring = false;
const builtins = {
  explorer: ["📁", "Explorador de archivos"],
  browser: ["🌈", "Google Chrome"],
  settings: ["⚙", "Panel de control"],
  store: ["🛍", "Microsoft Store"],
};
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").style.display = "none"), 4300);
}
function message(title, text, actions = [["Aceptar", () => {}]]) {
  const d = $("#dialog");
  d.innerHTML = `<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="dialog-actions"></div>`;
  for (const [label, fn] of actions) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => {
      d.close();
      fn();
    };
    $(".dialog-actions", d).append(b);
  }
  if (!d.open) d.showModal();
}
function saveWindows() {
  if (!engine.s || restoring) return;
  engine.s.windows = [...windows.values()]
    .filter((w) => !w.id.startsWith("install-"))
    .map((w) => ({
      id: w.id,
      data: w.data,
      left: w.el.style.left,
      top: w.el.style.top,
      width: w.el.style.width,
      height: w.el.style.height,
      min: w.el.hidden,
      max: w.el.classList.contains("maximized"),
    }));
  try {
    engine.save();
  } catch (e) {
    toast(
      "No se pudo guardar el progreso. El almacenamiento del navegador puede estar lleno.",
    );
  }
}
function focusWindow(w) {
  $$(".window").forEach((e) => e.classList.remove("focused"));
  w.el.classList.add("focused");
  w.el.style.zIndex = ++z;
}
function closeWindow(id) {
  const w = windows.get(id);
  if (!w) return;
  if (w.cleanup) w.cleanup();
  w.observer?.disconnect();
  clearTimeout(w.resizeTimer);
  w.el.remove();
  windows.delete(id);
  saveWindows();
  renderTaskbar();
}
function makeWindow(id, title, icon, data = {}) {
  if (windows.has(id)) {
    const w = windows.get(id);
    w.el.hidden = false;
    focusWindow(w);
    return w;
  }
  const el = document.createElement("section");
  el.className = "window";
  el.dataset.window = id;
  el.setAttribute("aria-label", title);
  el.style.left = Math.max(8,Math.min(120+(windows.size%4)*24,innerWidth-1030))+"px";
  el.style.top = 40 + (windows.size % 4) * 28 + "px";
  el.innerHTML = `<header class="titlebar"><strong>${icon} ${esc(title)}</strong><div class="controls"><button aria-label="Minimizar">−</button><button aria-label="Maximizar">□</button><button class="close" aria-label="Cerrar">×</button></div></header><div class="window-body"></div>`;
  $("#windows").append(el);
  const w = { id, el, body: $(".window-body", el), data };
  windows.set(id, w);
  el.addEventListener("pointerdown", () => focusWindow(w));
  const controls = $$(".controls button", el);
  controls[0].onclick = () => {
    el.hidden = true;
    saveWindows();
  };
  controls[1].onclick = () => {
    el.classList.toggle("maximized");
    saveWindows();
  };
  controls[2].onclick = () => closeWindow(id);
  const bar = $(".titlebar", el);
  bar.ondblclick = (e) => {
    if (!e.target.closest("button")) controls[1].click();
  };
  bar.onpointerdown = (e) => {
    if (e.target.closest("button") || el.classList.contains("maximized"))
      return;
    const r = el.getBoundingClientRect(),
      dx = e.clientX - r.left,
      dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    bar.onpointermove = (ev) => {
      el.style.left =
        Math.max(0, Math.min(innerWidth - 120, ev.clientX - dx)) + "px";
      el.style.top =
        Math.max(0, Math.min(innerHeight - 100, ev.clientY - dy)) + "px";
    };
    bar.onpointerup = () => {
      bar.onpointermove = null;
      saveWindows();
    };
  };
  w.observer = new ResizeObserver(() => {
    clearTimeout(w.resizeTimer);
    w.resizeTimer = setTimeout(saveWindows, 250);
  });
  w.observer.observe(el);
  focusWindow(w);
  renderTaskbar();
  saveWindows();
  return w;
}
function storageHTML() {
  return `<div class="storage"><strong>Disco local (C:)</strong><progress value="${engine.used()}" max="${CONFIG.capacity}"></progress><p>${engine.free()} MB disponibles de ${CONFIG.capacity} MB</p></div>`;
}
function renderDesktop() {
  $("#desktop-icons").innerHTML = "";
  for (const [id, [icon, name]] of Object.entries({
    ...builtins,
    ...Object.fromEntries(
      Object.keys(engine.s.installed)
        .filter((id) => engine.s.installed[id].shortcut !== false)
        .map((id) => [id, [CONFIG.apps[id].icon, CONFIG.apps[id].name]]),
    ),
  })) {
    const b = document.createElement("button");
    b.className = "desktop-icon";
    b.innerHTML = `<span class="icon">${icon}</span>${esc(name)}`;
    b.ondblclick = () => openApp(id);
    b.onclick = () => b.focus();
    b.onkeydown = (e) => {
      if (e.key === "Enter") openApp(id);
    };
    $("#desktop-icons").append(b);
  }
  renderTaskbar();
}
function renderTaskbar() {
  if (!engine.s) return;
  $("#taskbar").innerHTML =
    '<span class="taskbar-brand">AULA PC · Entorno simulado</span><button aria-label="Inicio" title="Inicio">▦</button><button aria-label="Explorador" title="Explorador">📁</button><button aria-label="Google Chrome" title="Google Chrome">🌐</button><span class="clock">' +
    new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !!engine.s.preferences?.hour12,
    }) +
    "<br>" +
    new Date().toLocaleDateString("es-ES") +
    "</span>";
  const b = $$("#taskbar button");
  b[0].onclick = toggleStart;
  b[1].onclick = () => openApp("explorer");
  b[2].onclick = () => openApp("browser");
  for (const w of windows.values()) {
    const btn = document.createElement("button");
    btn.className = "running";
    btn.title = $("strong", w.el).textContent;
    btn.setAttribute("aria-label", "Restaurar " + btn.title);
    btn.textContent = builtins[w.id]?.[0] || CONFIG.apps[w.id]?.icon || "▣";
    btn.onclick = () => {
      w.el.hidden = false;
      focusWindow(w);
      saveWindows();
    };
    $("#taskbar").insertBefore(btn, $(".clock"));
  }
}
function toggleStart() {
  const s = $("#start");
  s.hidden = !s.hidden;
  if (s.hidden) return;
  s.innerHTML =
    '<h3>Aplicaciones</h3><div class="start-grid"></div><div class="start-footer"><span>' +
    esc(engine.email) +
    '</span><button id="logout">Cerrar sesión</button></div>';
  for (const id of [
    ...Object.keys(builtins),
    ...Object.keys(engine.s.installed),
  ]) {
    const item = builtins[id] || [CONFIG.apps[id].icon, CONFIG.apps[id].name];
    const b = document.createElement("button");
    b.innerHTML = `<span class="icon">${item[0]}</span>${esc(item[1])}`;
    b.onclick = () => {
      s.hidden = true;
      openApp(id);
    };
    $(".start-grid", s).append(b);
  }
  $("#logout").onclick = () => {
    saveWindows();
    restoring = true;
    for (const id of [...windows.keys()]) closeWindow(id);
    restoring = false;
    s.hidden = true;
    $("#login").hidden = false;
    $("#tasks").hidden = true;
  };
}
function openApp(id, data = {}) {
  if (id === "store") return store(data);
  if (id === "explorer") return explorer(data.folder || "Documentos");
  if (id === "settings") return settings(data.section || "home");
  if (id === "browser" && typeof browser === "function") return browser(data);
  if (
    CONFIG.apps[id] &&
    engine.s.installed[id] &&
    typeof program === "function"
  )
    return program(id, data.file);
}
function contextMenu(event, items) {
  event.preventDefault();
  document.querySelector('.context-menu')?.remove();
  const menu = document.createElement('div');
  menu.className = 'context-menu'; menu.setAttribute('role','menu');
  for (const [label, action] of items) {
    const b=document.createElement('button'); b.textContent=label; b.setAttribute('role','menuitem');
    b.onclick=()=>{menu.remove();action()}; menu.append(b);
  }
  document.body.append(menu);
  menu.style.left=Math.max(0,Math.min(event.clientX,innerWidth-menu.offsetWidth-8))+'px';
  menu.style.top=Math.max(0,Math.min(event.clientY,innerHeight-menu.offsetHeight-8))+'px';
  menu.querySelector('button')?.focus();
  menu.onkeydown=e=>{if(e.key==='Escape')menu.remove();if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...menu.children];items[(items.indexOf(document.activeElement)+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus()}};
}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.context-menu'))document.querySelector('.context-menu')?.remove()});
function explorer(folder = 'Documentos') {
  if(!engine.folderExists(folder)){message('Ubicación no disponible','No se encuentra '+folder+'. La carpeta se ha eliminado.');folder='Windows (C:)';}
  const w=makeWindow('explorer','Explorador de archivos','📁',{folder});w.data.folder=folder;
  const path=folder.startsWith('Archivos de Programa')?['Este equipo','Windows (C:)','Archivos de Programa',...(folder.includes('/')?[CONFIG.apps[folder.split('/')[1]]?.name||folder.split('/')[1],...folder.split('/').slice(2)]:[])]:folder==='Windows (C:)'?['Este equipo','Windows (C:)']:['Este equipo',...folder.split('/')];
  w.body.innerHTML=`<div class="explorer"><nav class="sidebar">${['Este equipo','Escritorio','Descargas','Documentos'].filter(x=>engine.folderExists(x)).map(x=>`<button data-folder="${x}" class="${folder===x?'active':''}">${x==='Este equipo'?'🖥':'📁'} ${x}</button>`).join('')}</nav><div class="files-main"><div class="toolbar">${path.map((x,i)=>`<button data-path="${esc(i>=3&&folder.startsWith('Archivos de Programa/')?folder.split('/').slice(0,i-1).join('/'):x==='Materiales'?'Documentos/Materiales':x)}">${esc(x)}</button>${i<path.length-1?' › ':''}`).join('')}</div><div class="file-list"></div></div></div>`;
  $$('[data-folder]',w.body).forEach(b=>{b.onclick=()=>explorer(b.dataset.folder);if(b.dataset.folder!=='Este equipo')b.oncontextmenu=e=>contextMenu(e,[['Abrir',()=>explorer(b.dataset.folder)],['Eliminar',()=>deleteFolder(b.dataset.folder)]])});
  $$('[data-path]',w.body).forEach(b=>b.onclick=()=>explorer(b.dataset.path));
  let files;
  if(folder==='Este equipo')files=[{id:'drive-c',name:'Windows (C:)',icon:'💽',target:'Windows (C:)'}];
  else if(folder==='Windows (C:)')files=['Archivos de Programa','Documentos','Descargas','Escritorio'].filter(x=>engine.folderExists(x)).map(name=>({id:'dir-'+name,name,icon:'📁',target:name}));
  else if(folder==='Archivos de Programa')files=Object.keys(engine.s.installed).filter(id=>engine.folderExists('Archivos de Programa/'+id)).map(id=>({id:'dir-'+id,name:CONFIG.apps[id].name,icon:'📁',target:'Archivos de Programa/'+id}));
  else if(folder.startsWith('Archivos de Programa/')){
    const id=folder.split('/')[1], entries=engine.s.installed[id]?engine.programFiles(id).filter(f=>engine.folderExists(f.path)&&f.path.startsWith(folder+'/')):[];
    const dirs=[...new Set(entries.map(f=>f.path.slice(folder.length+1)).filter(x=>x.includes('/')).map(x=>x.split('/')[0]))];
    files=[...dirs.map(name=>({id:'dir-'+name,name,icon:'📁',target:folder+'/'+name})),...entries.filter(f=>!f.path.slice(folder.length+1).includes('/')).map(f=>({...f,id:f.path,icon:f.launch?CONFIG.apps[id].icon:'📄',systemFile:true}))];
  }
  else {files=engine.s.files.filter(f=>f.folder===folder);const subs=[...new Set(engine.s.files.map(f=>f.folder).filter(x=>x.startsWith(folder+'/')).map(x=>x.slice(folder.length+1).split('/')[0]))];files=[...subs.map(name=>({id:'dir-'+name,name,icon:'📁',target:folder+'/'+name})),...files];}
  const list=$('.file-list',w.body);
  if(!files.length)list.innerHTML='<p class="empty">Esta carpeta está vacía.</p>';
  for(const f of files){const b=document.createElement('button');b.className='file-row';b.dataset.file=f.id;b.innerHTML=`<span class="icon">${f.icon||'📄'}</span><span class="name">${esc(f.name)}</span><small>${f.size===undefined?'':f.size+' MB'}</small>`;
    const select=()=>{$$('.file-row',w.body).forEach(x=>x.classList.remove('selected'));b.classList.add('selected')};
    const open=()=>f.target?explorer(f.target):f.launch?openApp(f.launch):f.systemFile?message('Archivo de instalación',f.name+' es un componente del programa. No es un documento que puedas abrir directamente.'):f.ext==='exe'?openFile(f):openWith(f);
    b.onclick=select;b.ondblclick=open;b.onkeydown=e=>{if(e.key==='Enter')open()};
    b.oncontextmenu=e=>{select();contextMenu(e,f.target?[['Abrir',open],...(f.target==='Windows (C:)'?[]:[['Eliminar',()=>deleteFolder(f.target)]])]:f.systemFile?[['Abrir',open],['Eliminar',()=>deleteProgramFile(f)]]:[['Abrir con…',()=>f.ext==='exe'?openFile(f):openWith(f)],['Eliminar',()=>deleteFile(f)]])};list.append(b);
  }
  saveWindows();return w;
}
function folderDeletionWarning(){
  if(!engine.s.folderUndo)return;
  const path=engine.s.folderUndo.path;
  message(engine.s.folderUndo.type==='program-file'?'Archivo eliminado':'Carpeta eliminada', (engine.s.folderUndo.type==='program-file'?'El archivo ':'La carpeta ')+path+' no se puede recuperar desde la Papelera de este simulador. Su eliminación puede impedir que el ordenador o sus programas funcionen correctamente. Puedes deshacer esta acción ahora.',[
    ['Aceptar',()=>engine.acceptFolderDeletion()],
    ['Deshacer acción',()=>{engine.undoFolder();refresh();explorer(path)}]
  ]);
}
function deleteFolder(path){
  message('Eliminar carpeta','¿Quieres eliminar '+path+' y todo su contenido?',[
    ['Cancelar',()=>{}],['Eliminar',()=>{
      engine.deleteFolder(path);
      for(const id of [...windows.keys()]){if(CONFIG.apps[id]&&engine.isBroken(id))closeWindow(id);}
      explorer(path.includes('/')?path.slice(0,path.lastIndexOf('/')):'Windows (C:)');
      refresh();folderDeletionWarning();
    }]
  ]);
}
function deleteFile(f) {
  message(
    "Eliminar archivo",
    "¿Quieres eliminar " +
      f.name +
      "?",
    [
      ["Cancelar", () => {}],
      [
        "Eliminar",
        () => {
          engine.s.files = engine.s.files.filter((x) => x.id !== f.id);
          engine.log("delete-file",{name:f.name});
          explorer(f.folder);
        },
      ],
    ],
  );
}
function refresh() {
  const hidden = [...windows.values()]
    .filter((w) => w.el.hidden)
    .map((w) => w.id);
  const active = $(".window.focused")?.dataset.window;
  renderDesktop();
  if(typeof renderTasks === "function")renderTasks();
  if (windows.has("explorer")) explorer(windows.get("explorer").data.folder);
  if (windows.has("settings")) settings(windows.get("settings").data.section);
  for (const id of hidden)
    if (windows.has(id)) windows.get(id).el.hidden = true;
  if (active && windows.has(active)) focusWindow(windows.get(active));
  saveWindows();
}
$("#login-form").onsubmit = (e) => {
  e.preventDefault();
  try {
    engine.login($("#email").value);
    applyPreferences();
    $("#login").hidden = true;
    renderDesktop();
    renderTasks();
    restoring = true;
    const saved = structuredClone(engine.s.windows);
    for (const v of saved) {
      const w = openApp(v.id, v.data);
      if (w) {
        Object.assign(w.el.style, {
          left: v.left,
          top: v.top,
          width: v.width,
          height: v.height,
        });
        w.el.hidden = v.min;
        w.el.classList.toggle("maximized", v.max);
      }
    }
    restoring = false;
    if(engine.s.fraudIncident)showFraudIncident();
    else if(engine.s.folderUndo)folderDeletionWarning();
  } catch (err) {
    $("#login-error").textContent =
      "No se ha podido recuperar o guardar el progreso. Comprueba que el navegador permite almacenamiento local.";
  }
};
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#start") && !e.target.closest("#taskbar"))
    $("#start").hidden = true;
});
window.addEventListener("beforeunload", saveWindows);

function applyPreferences(){document.body.dataset.contrast=engine.s?.preferences?.contrast||'standard';renderTaskbar()}
setInterval(()=>{if(engine.s){const c=$('.clock');if(c)c.innerHTML=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hour12:!!engine.s.preferences?.hour12})+'<br>'+new Date().toLocaleDateString('es-ES')}},1000);

function deleteProgramFile(f){
 message('Eliminar archivo','¿Quieres eliminar '+f.name+' de la instalación?',[['Cancelar',()=>{}],['Eliminar',()=>{
  try{engine.deleteProgramFile(f.path);for(const id of [...windows.keys()])if(CONFIG.apps[id]&&engine.isBroken(id))closeWindow(id);refresh();toast('Archivo eliminado.');}
  catch(e){message('No se puede eliminar',e.message)}
 }]]);
}
