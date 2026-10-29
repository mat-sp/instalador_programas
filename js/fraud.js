/* Incidente didáctico: solo bloquea la interfaz del simulador, nunca el navegador. */
function showFraudIncident() {
  const incident = engine.s.fraudIncident;
  if (!incident || document.querySelector('#fraud-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'fraud-dialog';
  dialog.setAttribute('aria-labelledby', 'fraud-title');
  dialog.setAttribute('aria-describedby', 'fraud-description');
  dialog.addEventListener('cancel', event => event.preventDefault());
  document.body.append(dialog);
  document.querySelector('#desktop').inert = true;
  document.querySelector('#dialog').close();
  document.querySelector('.context-menu')?.remove();
  dialog.showModal();
  let timer;
  const recover = () => {
    clearInterval(timer);
    restoring = true;
    for (const id of [...windows.keys()]) closeWindow(id);
    const name = engine.recoverFraud();
    const saved = structuredClone(engine.s.windows);
    dialog.close();dialog.remove();
    document.querySelector('#desktop').inert = false;
    applyPreferences();renderDesktop();renderTasks();
    for (const v of saved) {
      const w = openApp(v.id, v.data);
      if (!w) continue;
      Object.assign(w.el.style,{left:v.left,top:v.top,width:v.width,height:v.height});
      w.el.hidden=v.min;
      w.el.classList.toggle('maximized',v.max);
    }
    restoring = false;
    saveWindows();
    message('Estado anterior restaurado', 'Borra '+name+' de Descargas. Después busca el programa de nuevo y descarga su instalador desde la web oficial, evitando los anuncios.', [
      ['Abrir Descargas',()=>explorer('Descargas')]
    ]);
  };
  const draw = () => {
    const remaining=Math.max(0,incident.until-Date.now());
    if (remaining > 0) {
      const phase=remaining>4000?'Instalando componentes…':remaining>2000?'El Explorador de archivos no responde':'Error al iniciar los servicios del sistema';
      dialog.className='fraud-freeze';
      dialog.innerHTML=`<div class="failure-icon">!</div><h1 id="fraud-title">${phase}</h1><p id="fraud-description">El equipo no responde. Esperando recuperación…</p><div class="failure-lines"><p>Aplicaciones: sin respuesta</p><p>Escritorio: bloqueado</p></div><progress aria-label="Recuperación del escritorio"></progress><small>Entorno de práctica · incidencia simulada</small>`;
      return;
    }
    clearInterval(timer);
    dialog.className='fraud-recovery';
    dialog.innerHTML=`<div class="failure-icon">!</div><h1 id="fraud-title">El programa instalado era fraudulento</h1><p id="fraud-description">El instalador procedía de un anuncio o de una página ajena a la web oficial. Ha provocado fallos y ha bloqueado el ordenador simulado.</p><p><strong>${esc(incident.name)}</strong></p><p>Vuelve al estado anterior a la instalación. Después, borra este instalador de Descargas y descarga el programa de nuevo desde el enlace oficial. Comprueba la dirección de la web y el editor.</p><button class="primary" id="fraud-restore">Volver al estado anterior a la instalación</button><small>Tu ordenador real no se ha modificado.</small>`;
    $('#fraud-restore',dialog).onclick=recover;
    $('#fraud-restore',dialog).focus();
  };
  timer=setInterval(draw,500);
  draw();
}
