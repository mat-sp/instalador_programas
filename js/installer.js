function installer(id, file = null) {
  const fraudulent = !!file?.fraudulent;
  const a = CONFIG.apps[id];
  if (!fraudulent && engine.s.installed[id] && !engine.isBroken(id)) {
    message(
      a.name + " ya está instalado",
      "Puedes abrirlo desde Inicio o el escritorio.",
    );
    return;
  }
  const w = makeWindow("install-" + (fraudulent ? "ad-" : "") + id, "Instalación de " + a.name, "📦", {
    step: 0,
    fraudulent,
    sourceFile: file?.id,
    path: "C:\\Program Files\\" + a.name,
    shortcut: true,
    associate: true,
  });
  const cancel = () => {
    if (w.data.step === 4) {
      closeWindow(w.id);
      return;
    }
    w.data.cancelling = true;
    $("#dialog").addEventListener(
      "close",
      () => {
        w.data.cancelling = false;
      },
      { once: true },
    );
    message(
      "Cancelar instalación",
      "Si sales ahora, el programa no se instalará.",
      [
        ["Continuar instalación", () => {}],
        ["Salir", () => {engine.log("cancel-install",{app:id,step:w.data.step});closeWindow(w.id)}],
      ],
    );
  };
  $(".close", w.el).onclick = cancel;
  w.cleanup = () => clearInterval(w.timer);
  drawInstaller(w, id);
  return w;
}
function drawInstaller(w, id) {
  const a = CONFIG.apps[id],
    d = w.data;
  const steps = [
    "Bienvenida",
    "Destino",
    "Opciones",
    "Instalando",
    "Completado",
  ];
  w.body.innerHTML = `<div class="installer-layout"><aside><span class="icon">${a.icon}</span><h2>${a.name}</h2>${steps.map((s, i) => `<p class="${d.step === i ? "current" : ""}">${i + 1}. ${s}</p>`).join("")}</aside><div class="installer-main"><div class="installer-screen"></div><footer><button id="install-back" ${d.step === 0 || d.step >= 3 ? "disabled" : ""}>Atrás</button><button class="primary" id="install-next">${d.step === 2 ? "Instalar" : d.step === 4 ? "Finalizar" : "Siguiente"}</button></footer></div></div>`;
  const area = $(".installer-screen", w.body);
  if (d.step === 0)
    area.innerHTML = `<h2>Bienvenido al asistente</h2><p>Este asistente instalará ${a.name} en tu equipo.</p><p>Editor: ${d.fraudulent ? "Quick Download" : a.publisher}</p><small>Instalador de práctica. No modifica tu ordenador real.</small>`;
  if (d.step === 1)
    area.innerHTML = `<h2>Carpeta de destino</h2><p>Selecciona dónde se instalará el programa.</p><label for="install-path">Ruta de instalación</label><input id="install-path" value="${esc(d.path)}"><p>Espacio necesario: <strong>${a.size} MB</strong><br>Espacio disponible: <strong>${engine.free()} MB</strong></p>`;
  if (d.step === 2)
    area.innerHTML = `<h2>Opciones de instalación</h2><label class="option"><input id="shortcut" type="checkbox" ${d.shortcut ? "checked" : ""}> Crear un acceso directo en el escritorio</label><label class="option"><input id="associate" type="checkbox" ${d.associate ? "checked" : ""}> Usar por defecto para archivos .${a.extensions.join(", .")}</label><p>Destino: ${esc(d.path)}</p><p>Se ocuparán ${a.size} MB.</p>`;
  if (d.step === 3) {
    area.innerHTML =
      '<h2>Instalando…</h2><p>Copiando archivos del programa</p><progress max="100" value="0"></progress><p id="install-percent">0 %</p>';
    $("#install-next", w.body).disabled = true;
  }
  if (d.step === 4)
    area.innerHTML = `<h2>Instalación completada</h2><p>${a.name} ya está disponible en tu equipo.</p><label class="option"><input id="launch-now" type="checkbox" checked> Abrir ${a.name} al finalizar</label>`;
  const retain = () => {
    if (d.step === 1) d.path = $("#install-path", w.body).value.trim();
    if (d.step === 2) {
      d.shortcut = $("#shortcut", w.body).checked;
      d.associate = $("#associate", w.body).checked;
    }
  };
  $("#install-back", w.body).onclick = () => {
    retain();
    d.step--;
    drawInstaller(w, id);
  };
  $("#install-next", w.body).onclick = () => {
    retain();
    if (d.step === 1 && !/^C:\\[^<>"|?*]+$/.test(d.path)) {
      message(
        "Ruta no válida",
        "Usa una ruta del disco C:, por ejemplo C:\\Program Files\\" + a.name,
      );
      return;
    }
    if (d.step === 4) {
      const launch = $("#launch-now", w.body).checked;
      closeWindow(w.id);
      if (launch) openApp(id);
      return;
    }
    if (d.step === 2) {
      if(d.fraudulent){
        saveWindows();
        engine.beginFraud(d.sourceFile);
        closeWindow(w.id);
        showFraudIncident();
        return;
      }
      if (!engine.folderExists("Archivos de Programa")) {
        message("No se puede instalar", "No se encuentra Archivos de Programa. Restaura la carpeta o reinicia la práctica.");
        return;
      }
      if (engine.free() < engine.installRequired(id)) {
        engine.event("space-error",{app:id,required:engine.installRequired(id),free:engine.free(),sourceFile:d.sourceFile||null});
        if (typeof renderTasks === "function") renderTasks();
        message(
          "Espacio insuficiente",
          `No se puede instalar ${a.name}.\nNecesitas ${a.size} MB. Disponibles: ${engine.free()} MB.\nLibera espacio y vuelve a intentarlo.`,
        );
        return;
      }
      d.step = 3;
      drawInstaller(w, id);
      let n = 0;
      w.timer = setInterval(() => {
        if (d.cancelling || engine.s.fraudIncident) return;
        n += 10;
        $("progress", w.body).value = n;
        $("#install-percent", w.body).textContent = n + " %";
        if (n >= 100) {
          clearInterval(w.timer);
          try {
            engine.install(id, d);
            d.step = 4;
            drawInstaller(w, id);
            refresh();
          } catch (e) {
            d.step = 2;
            drawInstaller(w, id);
            message("No se puede completar la instalación", e.message);
          }
        }
      }, 400);
      return;
    }
    d.step++;
    drawInstaller(w, id);
  };
}
