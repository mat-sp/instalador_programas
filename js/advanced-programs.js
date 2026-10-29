/* Herramientas educativas locales, con interfaces inspiradas en las aplicaciones. */
function sanitizeRichHTML(html){
 const t=document.createElement('template');t.innerHTML=String(html);
 const tags=new Set(['B','STRONG','I','EM','U','S','P','DIV','BR','SPAN','FONT','H1','H2','H3','UL','OL','LI','BLOCKQUOTE']);
 for(const el of [...t.content.querySelectorAll('*')]){
  if(!tags.has(el.tagName)){el.replaceWith(document.createTextNode(el.textContent));continue;}
  const saved={};for(const k of ['color','backgroundColor','fontFamily','fontSize','fontWeight','fontStyle','textDecoration','textAlign'])if(el.style[k]&&!/url|expression|var\(/i.test(el.style[k]))saved[k]=el.style[k];
  const color=el.getAttribute('color'),face=el.getAttribute('face'),size=el.getAttribute('size');
  for(const a of [...el.attributes])el.removeAttribute(a.name);
  Object.assign(el.style,saved);
  if(el.tagName==='FONT'){if(color&&/^#[0-9a-f]{3,8}$/i.test(color))el.setAttribute('color',color);if(face&&/^[a-z ,'-]{1,50}$/i.test(face))el.setAttribute('face',face);if(size&&/^[1-7]$/.test(size))el.setAttribute('size',size);}
 }return t.innerHTML;
}
function makePracticeFile(id,name,ext,extra={}){
 const existing=engine.s.files.find(f=>f.id===id);if(existing)return existing;
 const f={id,name,ext,folder:'Documentos',size:1,icon:ext==='ggb'?'📐':'📄',...extra};engine.addFile(f);return engine.s.files.find(f=>f.id===id);
}
function renderAdvancedProgram(w,id,f){
 if(id==='text'){renderWord(w,f);return true}
 if(id==='image'){renderGimp(w,f);return true}
 if(id==='geo'){renderGeometry(w);return true}
 if(id==='duo'){renderDuo(w);return true}
 if(id==='game'){renderGame(w);return true}
 return false;
}
function renderWord(w,f){
 if(!f){w.body.innerHTML='<div class="word-welcome"><h1>Word</h1><p>Documentos recientes</p><button id="word-new">＋ Documento en blanco</button><button id="word-open">Abrir documento…</button></div>';$('#word-open',w.body).onclick=()=>filePicker('text');$('#word-new',w.body).onclick=()=>{try{const n=Date.now();const f=makePracticeFile('word-'+n,'Documento_'+n+'.docx','docx',{text:''});program('text',f.id)}catch(e){message('No se puede crear',e.message)}};return}
 w.body.innerHTML=`<div class="word-app"><div class="word-tabs"><b>W</b> Archivo &nbsp; <strong>Inicio</strong> &nbsp; Insertar &nbsp; Diseño &nbsp; Revisar <span>${esc(f.name)}</span></div><div class="word-ribbon"><button id="word-open">Abrir</button><button id="word-save">Guardar</button><select id="word-font" aria-label="Fuente"><option>Calibri</option><option>Arial</option><option>Georgia</option><option>Times New Roman</option><option>Courier New</option></select><select id="word-size" aria-label="Tamaño de fuente">${[10,12,14,18,24,36].map(v=>`<option ${v===14?'selected':''}>${v}</option>`).join('')}</select><button data-command="bold" title="Negrita"><b>N</b></button><button data-command="italic" title="Cursiva"><i>K</i></button><button data-command="underline" title="Subrayado"><u>S</u></button><label>Color <input type="color" id="word-color" value="#17283c"></label><button data-command="justifyLeft" title="Alinear izquierda">≡←</button><button data-command="justifyCenter" title="Centrar">≡</button><button data-command="insertUnorderedList" title="Lista">• Lista</button></div><div class="word-page-wrap"><article contenteditable="true" class="word-page" id="word-editor" role="textbox" aria-label="Documento de Word" aria-multiline="true" spellcheck="true"></article></div><footer class="app-status"><span id="word-status">Guardado</span><span id="word-count"></span></footer></div>`;
 const ed=$('#word-editor',w.body);ed.innerHTML=f.html?sanitizeRichHTML(f.html):esc(f.text||'').replace(/\n/g,'<br>');
 let dirty=false,selection=null,edited=!!f.edited;const initialText=ed.innerText||ed.textContent;
 const count=()=>$('#word-count',w.body).textContent=(ed.innerText||ed.textContent).trim().split(/\s+/).filter(Boolean).length+' palabras';count();
 const retain=()=>{const s=window.getSelection();if(s.rangeCount&&ed.contains(s.anchorNode))selection=s.getRangeAt(0).cloneRange()};
 ed.addEventListener('keyup',retain);ed.addEventListener('mouseup',retain);ed.addEventListener('input',()=>{dirty=true;if((ed.innerText||ed.textContent)!==initialText)edited=true;$('#word-status',w.body).textContent='Cambios sin guardar';retain();count()});
 function command(name,value){ed.focus();if(selection){const s=window.getSelection();s.removeAllRanges();s.addRange(selection)}document.execCommand(name,false,value);retain();dirty=true;$('#word-status',w.body).textContent='Cambios sin guardar';w.wordFormatted=true;count()}
 $$('[data-command]',w.body).forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>command(b.dataset.command)});
 $('#word-font',w.body).onchange=e=>command('fontName',e.target.value);
 $('#word-size',w.body).onchange=e=>{const sizes={10:1,12:2,14:3,18:4,24:5,36:6};command('fontSize',sizes[e.target.value])};
 $('#word-color',w.body).oninput=e=>command('foreColor',e.target.value);
 const save=()=>{try{f.html=sanitizeRichHTML(ed.innerHTML);f.text=ed.innerText||ed.textContent;f.modifiedAt=new Date().toISOString();f.formatted=!!w.wordFormatted||!!f.formatted;f.edited=edited;engine.log('document-saved',{file:f.name,characters:f.text.length});if(f.id==='text'&&edited)engine.event('save-text',{file:f.name,characters:f.text.length});if(f.id==='text'&&f.formatted)engine.event('format-text',{file:f.name});dirty=false;$('#word-status',w.body).textContent='Guardado';toast('Documento guardado.')}catch(e){message('No se puede guardar',e.message)}};
 w.flush=()=>{if(dirty)save();return !dirty};
 $('#word-save',w.body).onclick=save;$('#word-open',w.body).onclick=()=>filePicker('text');
 ed.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}};
 ed.onpaste=e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))};
 $('.close',w.el).onclick=()=>{if(dirty)message('Guardar documento','Hay cambios sin guardar en '+f.name+'.',[['Cancelar',()=>{}],['No guardar',()=>closeWindow(w.id)],['Guardar',()=>{save();if(!dirty)closeWindow(w.id)}]]);else closeWindow(w.id)};
 engine.event('read-text',{file:f.name});
}
function renderGimp(w,f){
 if(!f){w.body.innerHTML='<div class="gimp-home"><h1>GIMP</h1><p>Editor de imágenes</p><button id="gimp-open">Abrir imagen…</button><button id="gimp-new">Crear imagen</button></div>';$('#gimp-open',w.body).onclick=()=>filePicker('image');$('#gimp-new',w.body).onclick=()=>{try{const f=makePracticeFile('drawing-'+Date.now(),'Dibujo.png','png',{icon:'🖼'});program('image',f.id)}catch(e){message('No se puede crear',e.message)}};return}
 w.body.innerHTML=`<div class="gimp-app"><div class="gimp-menu">Archivo &nbsp; Editar &nbsp; Seleccionar &nbsp; Ver &nbsp; Imagen &nbsp; Colores &nbsp; Herramientas</div><div class="gimp-bar"><button id="gimp-open">Abrir</button><button id="gimp-save">Guardar imagen</button><button id="gimp-undo">Deshacer</button><button id="gimp-redo">Rehacer</button><button id="gimp-resize">Escalar imagen</button><button id="gimp-rotate">Girar 90°</button><button id="gimp-invert">Invertir colores</button></div><div class="gimp-workspace"><aside><b>Herramientas</b><button data-tool="brush" class="active">🖌 Pincel</button><button data-tool="eraser">▱ Goma</button><button data-tool="line">╱ Línea</button><button data-tool="text">A Texto</button><label>Color<input type="color" id="gimp-color" value="#ed174c"></label><label>Tamaño<input type="range" id="gimp-brush" min="1" max="80" value="12"></label></aside><div class="gimp-canvas-wrap"><canvas id="gimp-canvas" width="700" height="450" aria-label="Lienzo de imagen editable"></canvas></div></div><footer class="app-status"><span id="gimp-status">Cargando imagen…</span><span>${esc(f.name)} · RGB</span></footer></div>`;
 const c=$('#gimp-canvas',w.body),ctx=c.getContext('2d',{willReadFrequently:true});let tool='brush',drawing=false,start=null,undo=[],redo=[],dirty=false,painted=false,resized=false,ready=false;
 const status=()=>$('#gimp-status',w.body).textContent=c.width+' × '+c.height+' px'+(dirty?' · Cambios sin guardar':' · Guardado');
 function checkpoint(){undo.push({w:c.width,h:c.height,data:ctx.getImageData(0,0,c.width,c.height)});if(undo.length>12)undo.shift();redo=[]}
 function restore(stack,other){if(!stack.length||!ready)return;other.push({w:c.width,h:c.height,data:ctx.getImageData(0,0,c.width,c.height)});const s=stack.pop();c.width=s.w;c.height=s.h;ctx.putImageData(s.data,0,0);dirty=true;status()}
 function change(){dirty=true;status()}
 function point(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
 function stroke(a,b){ctx.strokeStyle=tool==='eraser'?'#ffffff':$('#gimp-color',w.body).value;ctx.lineWidth=Number($('#gimp-brush',w.body).value);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 c.onpointerdown=e=>{if(!ready)return;e.preventDefault();checkpoint();start=point(e);if(tool==='text'){const d=$('#dialog');d.innerHTML='<h2>Añadir texto</h2><input id="image-text" aria-label="Texto para la imagen"><div class="dialog-actions"><button id="cancel-image-text">Cancelar</button><button id="add-image-text">Añadir</button></div>';$('#cancel-image-text').onclick=()=>d.close();$('#add-image-text').onclick=()=>{ctx.fillStyle=$('#gimp-color',w.body).value;ctx.font=Math.max(16,Number($('#gimp-brush',w.body).value)*3)+'px Arial';ctx.fillText($('#image-text').value,start.x,start.y);painted=true;change();d.close()};d.showModal();return}drawing=true;c.setPointerCapture(e.pointerId);if(tool!=='line'){stroke(start,{x:start.x+.1,y:start.y});painted=true;change()}};
 c.onpointermove=e=>{if(!drawing||tool==='line')return;const p=point(e);stroke(start,p);start=p;change()};
 c.onpointerup=e=>{if(!drawing)return;if(tool==='line'){stroke(start,point(e));painted=true;change()}drawing=false};c.onpointercancel=()=>drawing=false;
 $$('[data-tool]',w.body).forEach(b=>b.onclick=()=>{tool=b.dataset.tool;$$('[data-tool]',w.body).forEach(x=>x.classList.toggle('active',x===b))});
 $('#gimp-undo',w.body).onclick=()=>restore(undo,redo);$('#gimp-redo',w.body).onclick=()=>restore(redo,undo);
 $('#gimp-open',w.body).onclick=()=>filePicker('image');
 $('#gimp-resize',w.body).onclick=()=>{if(!ready)return;const d=$('#dialog');d.innerHTML=`<h2>Escalar imagen</h2><label>Ancho (px) <input id="image-width" type="number" min="32" max="1600" value="${c.width}"></label><label>Alto (px) <input id="image-height" type="number" min="32" max="1600" value="${c.height}"></label><div class="dialog-actions"><button id="cancel-resize">Cancelar</button><button id="apply-resize">Escalar</button></div>`;$('#cancel-resize').onclick=()=>d.close();$('#apply-resize').onclick=()=>{const x=Number($('#image-width').value),y=Number($('#image-height').value);if(!Number.isInteger(x)||!Number.isInteger(y)||x<32||y<32||x>1600||y>1600||x*y>1600000)return toast('Dimensiones permitidas: 32 a 1.600 px; máximo 1,6 millones de píxeles.');checkpoint();const temp=document.createElement('canvas');temp.width=c.width;temp.height=c.height;temp.getContext('2d').drawImage(c,0,0);c.width=x;c.height=y;ctx.drawImage(temp,0,0,x,y);resized=true;change();d.close()};d.showModal()};
 $('#gimp-rotate',w.body).onclick=()=>{if(!ready)return;checkpoint();const temp=document.createElement('canvas');temp.width=c.width;temp.height=c.height;temp.getContext('2d').drawImage(c,0,0);c.width=temp.height;c.height=temp.width;ctx.save();ctx.translate(c.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(temp,0,0);ctx.restore();change()};
 $('#gimp-invert',w.body).onclick=()=>{if(!ready)return;checkpoint();const data=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<data.data.length;i+=4)for(let j=0;j<3;j++)data.data[i+j]=255-data.data[i+j];ctx.putImageData(data,0,0);change()};
 const save=()=>{if(!ready)return;const previous=f.asset;try{f.asset=c.toDataURL('image/png');f.imageEdit={width:c.width,height:c.height,painted:painted||!!f.imageEdit?.painted,resized:resized||!!f.imageEdit?.resized};f.modifiedAt=new Date().toISOString();engine.save();if(f.id==='image'&&f.imageEdit.painted)engine.event('paint-image',{file:f.name});if(f.id==='image'&&f.imageEdit.resized)engine.event('resize-image',{file:f.name,width:c.width,height:c.height});engine.event('save-image',{file:f.name,width:c.width,height:c.height});dirty=false;status();toast('Imagen guardada.')}catch(e){f.asset=previous;message('No se puede guardar','No hay espacio suficiente en el navegador para guardar esta imagen. Reduce sus dimensiones.')}};
 w.flush=()=>{if(dirty)save();return !dirty};
 $('#gimp-save',w.body).onclick=save;
 $('.close',w.el).onclick=()=>{if(dirty)message('Guardar imagen','Hay cambios sin guardar en '+f.name+'.',[['Cancelar',()=>{}],['No guardar',()=>closeWindow(w.id)],['Guardar',()=>{save();if(!dirty)closeWindow(w.id)}]]);else closeWindow(w.id)};
 const image=new Image();image.onload=()=>{if(!windows.has(w.id))return;const scale=Math.min(1,1200/Math.max(image.width,image.height));c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);ctx.drawImage(image,0,0,c.width,c.height);ready=true;status();engine.event('view-image',{file:f.name})};image.onerror=()=>{ready=true;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);status();toast('No se pudo cargar la imagen original. Se ha abierto un lienzo vacío.')};if(f.asset)image.src=f.asset;else{ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ready=true;status()}
 w.cleanup=()=>{image.onload=null;image.onerror=null};
}
function renderGeometry(w){
 const sourceFile=engine.s.files.find(f=>f.id===w.data.file&&f.ext==='ggb');
 const model=structuredClone(sourceFile?.construction||engine.s.geo||{expressions:[],points:[],shapes:[],scale:35});model.scale ||=35;
 w.body.innerHTML=`<div class="geo-app"><div class="geo-tools"><strong>GeoGebra</strong><button data-geo-tool="move">↖ Mover</button><button data-geo-tool="point">• Punto</button><button data-geo-tool="segment">╱ Segmento</button><button data-geo-tool="circle">◯ Circunferencia</button><button data-geo-tool="triangle">△ Triángulo</button><button id="geo-save">Guardar</button><button id="geo-clear">Borrar todo</button></div><div class="geo-layout"><aside><form id="geo-form"><label for="geo-expression">Entrada algebraica</label><input id="geo-expression" placeholder="y = x^2 - 2" autocomplete="off"><button>Añadir función</button></form><small>x, +, −, *, /, ^, sin, cos, tan, sqrt, abs, ln, log, pi. Trigonometría en radianes.</small><div id="geo-list"></div><p id="geo-message" role="status">Elige una herramienta o escribe una función.</p><button id="geo-minus">−</button><button id="geo-plus">＋</button></aside><div class="geo-canvas-wrap"><canvas id="geo-canvas" width="800" height="490" aria-label="Plano cartesiano interactivo"></canvas></div></div></div>`;
 const c=$('#geo-canvas',w.body),ctx=c.getContext('2d');let tool='move',pending=[],drag=-1;
 const colors=['#2266d2','#ce274a','#009879','#ab4bdd'];
 const world=p=>({x:(p.x-c.width/2)/model.scale,y:(c.height/2-p.y)/model.scale});
 const pixel=p=>({x:c.width/2+p.x*model.scale,y:c.height/2-p.y*model.scale});
 const clickPoint=e=>{const r=c.getBoundingClientRect();return world({x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height})};
 function draw(){ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);const step=model.scale;ctx.font='11px Arial';
  for(let x=-Math.ceil(c.width/2/step);x<=c.width/2/step;x++){const p=pixel({x,y:0});ctx.strokeStyle=x?'#e2e7ee':'#566276';ctx.lineWidth=x?1:1.5;ctx.beginPath();ctx.moveTo(p.x,0);ctx.lineTo(p.x,c.height);ctx.stroke();if(x){ctx.fillStyle='#64748b';ctx.fillText(x,p.x+3,p.y+14)}}
  for(let y=-Math.ceil(c.height/2/step);y<=c.height/2/step;y++){const p=pixel({x:0,y});ctx.strokeStyle=y?'#e2e7ee':'#566276';ctx.lineWidth=y?1:1.5;ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(c.width,p.y);ctx.stroke();if(y){ctx.fillStyle='#64748b';ctx.fillText(y,p.x+4,p.y-3)}}
  model.expressions.forEach((s,i)=>{let fn;try{fn=compileExpression(s)}catch{return}ctx.beginPath();ctx.strokeStyle=colors[i%4];ctx.lineWidth=2.5;let last=null;for(let px=0;px<c.width;px++){const x=(px-c.width/2)/step,y=fn(x),py=c.height/2-y*step;if(!Number.isFinite(py)||Math.abs(py)>c.height*4){last=null;continue}if(last===null||Math.abs(last-py)>c.height)ctx.moveTo(px,py);else ctx.lineTo(px,py);last=py}ctx.stroke()});
  for(const s of model.shapes){const ps=s.points.map(i=>pixel(model.points[i]));ctx.strokeStyle='#8955d6';ctx.lineWidth=2.5;ctx.beginPath();if(s.kind==='circle'){const r=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);ctx.arc(ps[0].x,ps[0].y,r,0,Math.PI*2)}else{ctx.moveTo(ps[0].x,ps[0].y);for(const p of ps.slice(1))ctx.lineTo(p.x,p.y);if(s.kind==='triangle'){ctx.closePath();ctx.fillStyle='#9955dd22';ctx.fill()}}ctx.stroke()}
  model.points.forEach((p,i)=>{const a=pixel(p);ctx.fillStyle=pending.includes(i)?'#e39400':'#205eaf';ctx.beginPath();ctx.arc(a.x,a.y,5,0,7);ctx.fill();ctx.fillText(String.fromCharCode(65+i%26),a.x+7,a.y-7)});
 }
 function list(){$('#geo-list',w.body).innerHTML=model.expressions.map((s,i)=>`<p style="color:${colors[i%4]}"><b>f${i+1}(x) = ${esc(s)}</b> <button data-delete-function="${i}" aria-label="Eliminar función ${i+1}">×</button></p>`).join('')+model.points.map((p,i)=>'<p>'+String.fromCharCode(65+i%26)+' = ('+p.x.toFixed(2)+', '+p.y.toFixed(2)+')</p>').join('');$$('[data-delete-function]',w.body).forEach(b=>b.onclick=()=>{model.expressions.splice(Number(b.dataset.deleteFunction),1);list();draw()})}
 $('#geo-form',w.body).onsubmit=e=>{e.preventDefault();const s=$('#geo-expression',w.body).value;try{compileExpression(s);if(model.expressions.length>=12)throw Error('Máximo 12 funciones por construcción.');model.expressions.push(s);$('#geo-expression',w.body).value='';$('#geo-message',w.body).textContent='Función representada.';list();draw()}catch(error){$('#geo-message',w.body).textContent=error.message}};
 $$('[data-geo-tool]',w.body).forEach(b=>b.onclick=()=>{tool=b.dataset.geoTool;pending=[];$$('[data-geo-tool]',w.body).forEach(x=>x.classList.toggle('active',x===b));$('#geo-message',w.body).textContent={move:'Arrastra un punto para modificar la construcción.',point:'Haz clic para crear un punto.',segment:'Selecciona dos puntos en el plano.',circle:'Selecciona el centro y un punto de la circunferencia.',triangle:'Selecciona tres vértices.'}[tool]});
 c.onpointerdown=e=>{e.preventDefault();const p=clickPoint(e),near=model.points.findIndex(q=>Math.hypot(p.x-q.x,p.y-q.y)*model.scale<12);if(tool==='move'){drag=near;if(drag>=0)c.setPointerCapture(e.pointerId);return}if(model.points.length>=60)return;const index=near>=0?near:model.points.push(p)-1;if(tool!=='point'&&!pending.includes(index)){pending.push(index);const required=tool==='triangle'?3:2;if(pending.length===required){model.shapes.push({kind:tool,points:[...pending]});pending=[]}}list();draw()};
 c.onpointermove=e=>{if(drag<0)return;model.points[drag]=clickPoint(e);list();draw()};c.onpointerup=()=>drag=-1;c.onpointercancel=()=>drag=-1;
 $('#geo-minus',w.body).onclick=()=>{model.scale=Math.max(15,model.scale-10);draw()};$('#geo-plus',w.body).onclick=()=>{model.scale=Math.min(90,model.scale+10);draw()};
 $('#geo-clear',w.body).onclick=()=>message('Borrar construcción','¿Quieres borrar todas las funciones y figuras?',[['Cancelar',()=>{}],['Borrar',()=>{model.expressions=[];model.points=[];model.shapes=[];list();draw()}]]);
 $('#geo-save',w.body).onclick=()=>{try{const f=sourceFile||makePracticeFile('geogebra-work','Construccion.ggb','ggb',{icon:'📐'});f.construction=structuredClone(model);f.modifiedAt=new Date().toISOString();engine.s.geo=structuredClone(model);if(model.expressions.length)engine.event('plot-function',{expressions:model.expressions});if(model.shapes.length)engine.event('geometry-shape',{shapes:model.shapes.length,points:model.points.length});engine.event('save-geo',{file:f.name});toast('Construcción guardada en Documentos.')}catch(e){message('No se puede guardar',e.message)}};
 w.flush=()=>{if(model.expressions.length||model.points.length)$('#geo-save',w.body).click();return true};
 list();draw();
}
const ENGLISH_LESSON=[
 {prompt:'Elige la traducción de «carpeta».',options:['Folder','File','Screen'],answer:'Folder'},
 {prompt:'Completa: I ___ a student.',options:['is','am','are'],answer:'am'},
 {prompt:'Traduce: «Guardar el archivo».',options:['Delete the file','Save the file','Close the folder'],answer:'Save the file'},
 {prompt:'Escribe en inglés: «ordenador» (una palabra).',answer:['computer']},
 {prompt:'Completa: She ___ English every day.',options:['study','studies','studying'],answer:'studies'},
 {prompt:'¿Qué significa «Download the installer»?',options:['Descarga el instalador','Borra el programa','Reinicia el ordenador'],answer:'Descarga el instalador'},
 {prompt:'Escribe en inglés: «contraseña» (una palabra).',answer:['password']},
 {prompt:'Completa: There ___ two files in this folder.',options:['is','are','am'],answer:'are'},
 {prompt:'Traduce: «No abras ese enlace».',options:['Do not open that link','Open this window','Do not save this file'],answer:'Do not open that link'},
 {prompt:'Escribe la palabra que falta: I use a mouse and a ___. (teclado)',answer:['keyboard']}
];
function renderDuo(w){
 w.duoNext=false;const state=engine.s.duo||={index:0,attempts:0,errors:0,answers:[]};
 if(state.index>=ENGLISH_LESSON.length){w.body.innerHTML=`<div class="duo-app"><div class="duo-mascot">🦉</div><h1>¡Lección completada!</h1><p>Has practicado vocabulario digital, traducción y gramática.</p><p>${ENGLISH_LESSON.length} actividades · ${state.attempts} intentos · ${state.errors} errores corregidos</p><button id="duo-again">Practicar otra vez</button></div>`;$('#duo-again',w.body).onclick=()=>{engine.s.duo={index:0,attempts:0,errors:0,answers:[]};engine.save();renderDuo(w)};return}
 const item=ENGLISH_LESSON[state.index];let choice=null;
 w.body.innerHTML=`<div class="duo-app"><header><strong>🦉 Duolingo</strong><progress max="${ENGLISH_LESSON.length}" value="${state.index}"></progress><small>${state.index+1} / ${ENGLISH_LESSON.length}</small></header><h2>${esc(item.prompt)}</h2><form id="duo-form">${item.options?'<div class="duo-options">'+item.options.map((v,i)=>`<button type="button" data-duo-option="${i}">${esc(v)}</button>`).join('')+'</div>':'<input id="duo-answer" aria-label="Respuesta en inglés" autocomplete="off" placeholder="Escribe tu respuesta">'}<p id="duo-feedback" role="status"></p><button class="primary" id="duo-check">Comprobar</button></form></div>`;
 $$('[data-duo-option]',w.body).forEach(b=>b.onclick=()=>{choice=item.options[Number(b.dataset.duoOption)];$$('[data-duo-option]',w.body).forEach(x=>x.classList.toggle('active',x===b))});
 $('#duo-form',w.body).onsubmit=e=>{e.preventDefault();if(w.duoNext){w.duoNext=false;renderDuo(w);return}const answer=item.options?choice:$('#duo-answer',w.body).value.trim().toLowerCase();if(!answer)return;state.attempts++;const correct=(Array.isArray(item.answer)?item.answer:[item.answer]).some(a=>a.toLowerCase()===answer.toLowerCase());state.answers.push({activity:state.index+1,answer,correct});if(correct){state.index++;$('#duo-feedback',w.body).textContent='¡Correcto!';$('#duo-check',w.body).textContent='Continuar';w.duoNext=true;if(state.index===ENGLISH_LESSON.length)engine.event('duo-lesson',{activities:state.index,attempts:state.attempts,errors:state.errors})}else{state.errors++;$('#duo-feedback',w.body).textContent='Todavía no. Revisa la frase y vuelve a intentarlo.'}engine.save()};
}
