function openFile(f) {
  if (f.ext === "exe") return installer(f.app, f);
  const app = engine.s.associations[f.ext];
  if (app && engine.s.installed[app]) return program(app, f.id);
  openWith(f);
}
function openWith(f) {
  const d = $("#dialog");
  d.innerHTML = `<h2>¿Cómo quieres abrir este archivo?</h2><p>${esc(f.name)} · Archivo .${f.ext}</p><label for="app-choice">Selecciona una aplicación</label><select id="app-choice"><option value="">Elegir aplicación…</option>${Object.keys(
    engine.s.installed,
  )
    .map((id) => `<option value="${id}">${CONFIG.apps[id].name}</option>`)
    .join(
      "",
    )}</select><label class="option" style="margin-top:18px"><input type="checkbox" id="always-use"> Usar siempre para archivos .${f.ext}</label>${Object.keys(engine.s.installed).length ? "" : "<p>No hay aplicaciones instaladas. Busca un programa compatible en el navegador.</p>"}<div class="dialog-actions"><button id="cancel-with">Cancelar</button><button class="primary" id="confirm-with">Abrir</button></div>`;
  $("#cancel-with").onclick = () => d.close();
  $("#confirm-with").onclick = () => {
    const id = $("#app-choice").value;
    if (!id) return;
    if (!CONFIG.apps[id].extensions.includes(f.ext)) {
      d.close();
      engine.event("wrong-app");
      message(
        "Formato no compatible",
        `${CONFIG.apps[id].name} no puede abrir archivos .${f.ext}. El archivo no se ha modificado. Prueba con otra aplicación.`,
      );
      return;
    }
    if ($("#always-use").checked) engine.s.associations[f.ext] = id;
    engine.event("open-with",{file:f.name,app:id});
    d.close();
    program(id, f.id);
    if (typeof renderTasks === "function") renderTasks();
  };
  if (!d.open) d.showModal();
}
function program(id, fileId) {
  if (!engine.s.installed[id]) return;
  if(!engine.checkLaunch(id)){message("No se puede iniciar el programa", CONFIG.apps[id].name+" no encuentra sus archivos de instalación. Vuelve a ejecutar el instalador para repararlo.");return;}
  if(!restoring)engine.log("program-open",{app:id,file:fileId||null});
  const existing=windows.get(id);if(existing?.flush&&existing.flush()===false)return existing;
  const a = CONFIG.apps[id],
    w = makeWindow(id, a.name, a.icon, { file: fileId });
  if (fileId) w.data.file = fileId;
  const f = engine.s.files.find((x) => x.id === w.data.file);
  if (f && !a.extensions.includes(f.ext)) {
    message("Formato no compatible", a.name + " no puede abrir este archivo.");
    return w;
  }
  if(w.cleanup){w.cleanup();w.cleanup=null;}
  delete w.flush;
  $(".close",w.el).onclick=()=>closeWindow(w.id);
  if(typeof renderAdvancedProgram === "function" && renderAdvancedProgram(w,id,f)){saveWindows();return w;}
  w.body.innerHTML = `<div class="toolbar"><button id="app-open">Abrir archivo…</button><span>${f ? esc(f.name) : "Ningún archivo abierto"}</span></div><div class="program-content"></div>`;
  $("#app-open", w.body).onclick = () => filePicker(id);
  const area = $(".program-content", w.body);
  if (!f) {
    area.innerHTML = `<div class="empty"><span class="icon">${a.icon}</span><h2 style="margin-top:16px">${a.name}</h2><p>Abre un archivo para empezar.</p><small>Formatos compatibles: .${a.extensions.join(", .")}</small></div>`;
    saveWindows();
    return w;
  }
  if (a.kind === "video") {
    area.innerHTML = `<div class="video-stage"><video controls preload="metadata" src="${f.asset}" aria-label="Vídeo de práctica"></video></div><div class="toolbar"><button id="play-video">▶ Reproducir</button><button id="pause-video">Pausar</button><button id="stop-video">■ Detener</button><span id="video-status">Preparado</span></div>`;
    const v = $("video", area);
    v.onplaying = () => {
      engine.event("play-video");
      $("#video-status", area).textContent = "Reproduciendo";
      if (typeof renderTasks === "function") renderTasks();
    };
    v.onpause = () => {
      if(v.currentTime>0)engine.event("pause-video",{file:f.name});
      $("#video-status", area).textContent = "En pausa";
    };
    v.onerror = () =>
      message(
        "No se puede reproducir",
        "No se ha podido cargar el vídeo de práctica. Comprueba que la carpeta assets está junto a la web.",
      );
    $("#play-video", area).onclick = () =>
      v
        .play()
        .catch(() => toast("Utiliza el control de reproducción del vídeo."));
    $("#pause-video", area).onclick = () => v.pause();
    $("#stop-video", area).onclick = () => {v.pause();v.currentTime=0;$("#video-status",area).textContent="Detenido";engine.event("stop-video",{file:f.name})};
    w.cleanup=()=>{v.pause();v.removeAttribute("src");v.load()};
  }
  if (a.kind === "archive") {
    area.innerHTML = `<div class="pad"><h2>${esc(f.name)}</h2><p>${f.children.length} archivos dentro del comprimido</p><div class="archive-files">${f.children.map((cid) => `<p>${CONFIG.contents[cid].icon} ${CONFIG.contents[cid].name} <small>· ${CONFIG.contents[cid].size} MB</small></p>`).join("")}</div><p>Destino: Documentos / Materiales</p><button class="primary" id="extract-all">Extraer todo</button><p id="extract-status" role="status"></p></div>`;
    $("#extract-all", area).onclick = () => {
      try {
        const count = engine.extract(f);
        closeWindow(w.id);
        toast(count ? "Extracción completada." : "Los archivos ya están extraídos.");
        explorer("Documentos/Materiales");
        refresh();
      } catch (e) {
        message("No se puede extraer", e.message);
      }
    };
  }
  if (a.kind === "text") {
    area.innerHTML = `<div class="office-ribbon"><strong>Archivo</strong><strong>Inicio</strong><strong>Insertar</strong><strong>Diseño</strong><strong>Revisar</strong><button id="save-text">Guardar</button><span id="text-status">Guardado</span></div><textarea id="text-editor" aria-label="Contenido del documento" spellcheck="false">${esc(f.text)}</textarea>`;
    const editor = $("#text-editor", area);
    editor.oninput = () => {
      $("#text-status", area).textContent = "Cambios sin guardar";
    };
    const save = () => {
      f.text = editor.value;
      engine.save();
      $("#text-status", area).textContent = "Guardado";
      engine.event("save-text");
    };
    $("#save-text", area).onclick = save;
    editor.onkeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    engine.event("read-text");
  }
  if (a.kind === "office") {
    if (f && f.ext === 'docx') {
      area.innerHTML = `<div class="office-ribbon"><strong>Archivo</strong><strong>Inicio</strong><strong>Insertar</strong><strong>Diseño</strong><strong>Revisar</strong><button id="save-office-text">Guardar</button><span id="office-text-status">Guardado</span></div><textarea id="office-editor" aria-label="Documento de Word" spellcheck="false">${esc(f.text || '')}</textarea>`;
      const editor = $('#office-editor', area); $('#save-office-text', area).onclick = () => { f.text = editor.value; engine.save(); $('#office-text-status', area).textContent = 'Guardado'; };
    } else {
      area.innerHTML = `<div class="office-home"><div class="office-brand"><span>▦</span><div><h1>Microsoft Office</h1><p>Aplicaciones de productividad</p></div></div><div class="office-apps"><button id="open-word"><span>🟦</span><strong>Word</strong><small>Procesador de textos</small></button><button><span>🟩</span><strong>Excel</strong><small>Hojas de cálculo</small></button><button><span>🟧</span><strong>PowerPoint</strong><small>Presentaciones</small></button></div><p class="muted">Elige una aplicación para abrir un documento compatible.</p></div>`;
      $('#open-word', area).onclick = () => filePicker(id);
    }
  }
  if (a.kind === "image") {
    area.innerHTML = `<div class="gimp-menu"><strong>Archivo</strong><strong>Editar</strong><strong>Seleccionar</strong><strong>Ver</strong><strong>Imagen</strong><strong>Colores</strong><strong>Filtros</strong></div><div class="toolbar"><button id="zoom-out" aria-label="Alejar imagen">−</button><span id="zoom-label">100 %</span><button id="zoom-in" aria-label="Acercar imagen">+</button><button id="rotate-image">Girar 90°</button><span class="badge">GIMP · RGB · 8 bits</span></div><div class="image-stage"><img src="${f.asset}" alt="Cartel de Digitalización: extensiones mp4, zip, txt y png"></div>`;
    let zoom = 100,
      angle = 0;
    const update = () => {
      $("img", area).style.transform =
        `scale(${zoom / 100}) rotate(${angle}deg)`;
      $("#zoom-label", area).textContent = zoom + " %";
    };
    $("#zoom-in", area).onclick = () => {
      zoom = Math.min(200, zoom + 25);
      update();
    };
    $("#zoom-out", area).onclick = () => {
      zoom = Math.max(25, zoom - 25);
      update();
    };
    $("#rotate-image", area).onclick = () => {
      angle += 90;
      update();
    };
    $("img", area).onload = () => {
      engine.event("view-image");
      if (typeof renderTasks === "function") renderTasks();
    };
  }
  saveWindows();
  if (typeof renderTasks === "function") renderTasks();
  return w;
}
function filePicker(id) {
  const a = CONFIG.apps[id],
    d = $("#dialog");
  d.innerHTML = `<h2>Abrir archivo · ${a.name}</h2><label for="file-choice">Archivos del equipo</label><select id="file-choice"><option value="">Seleccionar…</option>${engine.s.files
    .filter((f) => f.ext !== "exe")
    .map(
      (f) =>
        `<option value="${f.id}">${esc(f.folder + " / " + f.name)}</option>`,
    )
    .join(
      "",
    )}</select><div class="dialog-actions"><button id="cancel-picker">Cancelar</button><button id="accept-picker" class="primary">Abrir</button></div>`;
  $("#cancel-picker").onclick = () => d.close();
  $("#accept-picker").onclick = () => {
    const f = engine.s.files.find((x) => x.id === $("#file-choice").value);
    if (!f) return;
    d.close();
    if (!a.extensions.includes(f.ext)) {
      engine.event("wrong-app");
      message(
        "Formato no compatible",
        a.name + " no puede abrir archivos ." + f.ext + ".",
      );
      return;
    }
    program(id, f.id);
  };
  if (!d.open) d.showModal();
}
