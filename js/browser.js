function browser(data) {
  const w = makeWindow(
    "browser",
    "Google Chrome",
    "🌈",
    data?.history ? data : { history: [{ type: "home" }], pos: 0 },
  );
  if (!w.data.history) {
    w.data.history = [{ type: "home" }];
    w.data.pos = 0;
  }
  renderBrowser(w);
  return w;
}
function navigateSim(w, view) {
  engine.log("web-visit",{type:view.type,query:view.query||"",app:view.app||"",resource:view.index??null});
  w.data.history = w.data.history.slice(0, w.data.pos + 1);
  w.data.history.push(view);
  w.data.pos++;
  renderBrowser(w);
  saveWindows();
}
function renderBrowser(w) {
  const v = w.data.history[w.data.pos];
  const address =
    v.type === "page"
      ? "https://www." + CONFIG.apps[v.app].domain + "/download"
      : v.type === "article"
        ? "https://"+WEB_CONTENT[v.app].results[v.index][1]
      : v.type === "ad"
        ? "https://descarga-rapida.example/oferta"
        : v.type === "search"
          ? v.query
          : "";
  w.body.innerHTML = `<form class="toolbar" id="search-form"><button type="button" id="browser-back" aria-label="Atrás" ${w.data.pos ? "" : "disabled"}>←</button><button type="button" id="browser-home" aria-label="Inicio del navegador">⌂</button><input id="search" aria-label="Buscar o escribir dirección" placeholder="Buscar o escribir dirección" value="${esc(address)}"><button class="primary">Buscar</button><button type="button" id="downloads" aria-label="Descargas del navegador">↓</button></form><div class="sim-web"></div>`;
  $("#browser-back", w.body).onclick = () => {
    w.data.pos--;
    renderBrowser(w);
    saveWindows();
  };
  $("#browser-home", w.body).onclick = () => navigateSim(w, { type: "home" });
  $("#downloads", w.body).onclick = () => navigateSim(w, { type: "downloads" });
  $("#search-form", w.body).onsubmit = (e) => {
    e.preventDefault();
    const query = $("#search", w.body).value.trim();
    if (query) navigateSim(w, { type: "search", query });
  };
  const area = $(".sim-web", w.body);
  if (v.type === "home") {
    area.innerHTML =
      '<div class="search-home"><span class="web-mark">🌐</span><h1>Buscar en la web</h1><p>¿Qué quieres encontrar hoy?</p><p class="muted">Internet de práctica · Todas las páginas son simuladas</p></div>';
  }
  if (v.type === "search") {
    const q = v.query.toLowerCase();
    const ids = Object.keys(CONFIG.apps).filter((id) => {
      const a = CONFIG.apps[id];
      return !!a.filename && (
        q.includes(a.name.toLowerCase()) ||
        q.includes(a.domain) ||
        (id === "zip" && /7[- ]?zip/.test(q)) ||
        (id === "image" && /imagen|foto|gimp/.test(q)) ||
        (id === "text" && /texto|editor|word/.test(q)) ||
        (id === "vlc" && /video|vídeo/.test(q)) ||
        (id === "office" && /office|ofimática|365/.test(q))
      );
    });
    const id=ids[0];
    if(!id){area.innerHTML=`<div class="search-results"><h2>No se han encontrado resultados para «${esc(v.query)}»</h2><p>Prueba con VLC, 7-Zip, Word, GIMP, GeoGebra o Duolingo.</p></div>`;return;}
    const app=CONFIG.apps[id], resources=WEB_CONTENT[id].results;
    const results=[{title:app.name+' — '+app.publisher,url:'www.'+app.domain,text:app.description+'. Descargas, documentación y novedades.',kind:'page'},...resources.map((r,i)=>({title:r[0],url:r[1],text:r[2],kind:'article',index:i}))];
    results.splice(0,0,{title:app.name+' para Windows — Descargar ahora',url:'descarga-rapida.example/'+id,text:'Instalación rápida con nuestro gestor de descargas.',kind:'ad'});
    area.innerHTML=`<div class="search-results"><h2 class="google-word">Google</h2><p class="search-categories">Todo &nbsp; Imágenes &nbsp; Vídeos &nbsp; Noticias</p><p class="muted">Resultados para «${esc(v.query)}»</p>${results.map((r,i)=>`<div class="search-result"><small>${esc(r.url)}</small><button class="link-button" data-search-result="${i}">${esc(r.title)}</button><p>${esc(r.text)}</p></div>`).join('')}</div>`;
    $$('[data-search-result]',area).forEach(b=>b.onclick=()=>{const r=results[Number(b.dataset.searchResult)];navigateSim(w,{type:r.kind,app:id,index:r.index,autoDownload:r.kind==='ad'})});
  }
  if(v.type==='article'){
    const a=CONFIG.apps[v.app], r=WEB_CONTENT[v.app].results[v.index];
    area.innerHTML=`<article class="resource-page"><small>${esc(r[1])}</small><h1>${esc(r[0])}</h1><p class="lead">${esc(r[2])}</p><h2>${WEB_CONTENT[v.app].featureTitle}</h2><p>${WEB_CONTENT[v.app].example}</p><h2>Compatibilidad y archivos</h2><p>${a.name} trabaja con archivos ${a.extensions.map(x=>'.'+x).join(', ')}. El documento se conserva al cerrar o desinstalar el programa.</p><h2>Descargas y versiones</h2><p>Consulta las versiones publicadas y los requisitos en la página del proyecto.</p><button id="resource-official">Visitar ${a.domain}</button></article>`;
    $('#resource-official',area).onclick=()=>navigateSim(w,{type:'page',app:v.app});
  }
  if (v.type === "ad") {
    const id = CONFIG.apps[v.app] ? v.app : 'vlc';
    const a = CONFIG.apps[id];
    area.innerHTML = `<div class="ad-download-page"><span class="badge">Windows · Instalación rápida</span><h1>${a.name} para tu PC</h1><p>Tu descarga está preparada.</p><button class="primary" id="real-download">Descargar instalador</button><p>${a.filename.replace('.exe','-online.exe')} · ${a.downloadSize} MB</p><div id="download-status" role="status"></div><small>Distribuido por Quick Download</small></div>`;
    $('#real-download', area).onclick = () => downloadApp(w, id, true);
    if(v.autoDownload){delete v.autoDownload;saveWindows();downloadApp(w,id,true);}
  }
  if (v.type === "page") {
    const a = CONFIG.apps[v.app];
    area.innerHTML = vendorPage(v.app);
    $$('[data-vendor-section]',area).forEach(b=>b.onclick=()=>$('#'+b.dataset.vendorSection,area)?.scrollIntoView({block:'nearest',behavior:'smooth'}));
    $("#fake-download", area).onclick = () => navigateSim(w, { type: "ad", app:v.app, autoDownload:true });
    $("#real-download", area).onclick = () => a.channel === "store" ? openApp("store",{app:v.app}) : downloadApp(w, v.app);
    if(a.channel === "store")$("#real-download",area).textContent="Obtener en Microsoft Store";
  }
  if (v.type === "downloads") {
    const files = engine.s.files.filter((f) => f.ext === "exe");
    area.innerHTML =
      '<div class="pad"><h2>Descargas</h2>' +
      files
        .map(
          (f) =>
            `<div class="app-list-row"><div><strong>${esc(f.name)}</strong><small>Completada · ${f.size} MB</small></div><button data-open-download="${f.id}">Abrir archivo</button></div>`,
        )
        .join("") +
      (files.length ? "" : "<p>No hay descargas.</p>") +
      '<button id="show-downloads">Mostrar en carpeta</button></div>';
    $$("[data-open-download]", area).forEach(
      (b) =>
        (b.onclick = () =>
          openFile(
            engine.s.files.find((f) => f.id === b.dataset.openDownload),
          )),
    );
    $("#show-downloads", area).onclick = () => explorer("Descargas");
  }
}
function downloadApp(w, id, fraudulent = false) {
  if(!fraudulent && CONFIG.apps[id].channel === "store")return openApp("store",{app:id});
  const fileId = (fraudulent ? "setup-ad-" : "setup-") + id;
  const a = CONFIG.apps[id];
  if (engine.s.files.some((f) => f.id === fileId)) {
    toast("Este instalador ya está en Descargas.");
    return;
  }
  const b = $("#real-download", w.body);
  b.disabled = true;
  $("#download-status", w.body).innerHTML =
    '<p>Descargando…</p><progress max="100" value="0"></progress>';
  let n = 0;
  const session = engine.email;
  const timer = setInterval(() => {
    if (engine.email !== session || windows.get("browser") !== w) {
      clearInterval(timer);
      return;
    }
    if (engine.s.fraudIncident) return;
    n += 25;
    const p = $("#download-status progress", w.body);
    if (p) p.value = n;
    if (n < 100) return;
    clearInterval(timer);
    try {
      engine.addFile({
        id: fileId,
        name: fraudulent ? a.filename.replace(".exe", "-online.exe") : a.filename,
        fraudulent,
        source: fraudulent ? "descarga-rapida.example" : a.domain,
        folder: "Descargas",
        ext: "exe",
        size: a.downloadSize,
        icon: "📦",
        app: id,
      });
      engine.event("download",{app:id,fraudulent,source:fraudulent?"descarga-rapida.example":a.domain});
      if ($("#download-status", w.body))
        $("#download-status", w.body).innerHTML =
          '<p>✓ Descarga completada. Guardada en Descargas.</p><button id="download-folder">Mostrar en carpeta</button>';
      if ($("#download-folder", w.body))
        $("#download-folder", w.body).onclick = () => explorer("Descargas");
      toast("Descarga completada: " + (fraudulent ? a.filename.replace(".exe", "-online.exe") : a.filename));
      refresh();
    } catch (e) {
      message("No se puede descargar", e.message);
      if (b.isConnected) b.disabled = false;
    }
  }, 200);
}
