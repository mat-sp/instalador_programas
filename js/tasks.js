function taskDone(t){return t.complete!==undefined?t.complete:t.events.every(e=>engine.s.events.includes(e))}
function renderTasks(){
 if(!engine.s)return;
 const panel=$('#tasks');if(!panel)return;
 panel.hidden=false;
 const tasks=getPracticeTasks(engine.s),current=tasks.find(t=>!taskDone(t)),complete=tasks.filter(taskDone).length;
 const ordered=[...tasks.filter(t=>!taskDone(t)),...tasks.filter(taskDone)],collapsed=!!engine.s.preferences?.tasksCollapsed,f=PracticeFlow.ensure(engine.s);
 panel.classList.toggle('collapsed',collapsed);
 panel.innerHTML=`<div class="split-heading"><h2>Tareas <span class="badge">${complete}/${tasks.length}</span></h2><button id="collapse-tasks" aria-label="${collapsed?'Desplegar':'Plegar'} tareas">${collapsed?'＋':'−'}</button></div><div class="practice-buttons"><button id="save-progress">Guardar</button><button id="load-progress">Cargar</button><button id="generate-pdf">Generar PDF</button></div><div class="tasks-details"><div class="task-list">${ordered.map(t=>`<div class="task ${taskDone(t)?'done':''}" data-task="${t.id}"><span class="check">${taskDone(t)?'✓':tasks.indexOf(t)+1}</span><b>${esc(t.title)}</b></div>`).join('')}</div>${f.pdfGenerated?`<label class="classroom-confirmation"><input id="classroom-confirm" type="checkbox" ${f.classroomConfirmed?'checked disabled':''}> Confirmo que he subido el PDF a Classroom</label><small>Entrega confirmada por el alumno; se realiza fuera del simulador.</small>`:''}${current?'<button id="help" class="primary">Necesito ayuda</button><div id="hint-area"></div>':'<p class="hint">Práctica completada. Puedes guardar una copia del progreso.</p>'}<small>El juego de la Store es opcional.</small></div>`;
 $('#save-progress').onclick=saveProgress;$('#load-progress').onclick=loadProgress;$('#generate-pdf').onclick=generateReport;
 $('#collapse-tasks').onclick=()=>{(engine.s.preferences||={}).tasksCollapsed=!collapsed;engine.save();renderTasks()};
 if($('#classroom-confirm'))$('#classroom-confirm').onchange=e=>{if(e.target.checked)engine.event('classroom-confirmed',{confirmation:'alumno'})};
 if(current){const hintKey=current.id+((current.id==='gimp-space'&&f.gimpSpace)||(current.id==='gimp-remove'&&f.gimpBlocked)?'-recovery':'');const show=()=>{const n=engine.s.hints[hintKey]||0;$('#hint-area').innerHTML=n?'<div class="hint">'+current.hints.slice(0,n).map(h=>'<p>'+esc(h)+'</p>').join('')+'</div>':'';$('#help').disabled=n>=current.hints.length};show();$('#help').onclick=()=>{engine.s.hints[hintKey]=(engine.s.hints[hintKey]||0)+1;engine.log('hint',{task:current.id,level:engine.s.hints[hintKey]});show()};}
}
engine.onChange=()=>{clearTimeout(renderTasks.timer);renderTasks.timer=setTimeout(renderTasks,0)};
