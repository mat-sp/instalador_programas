/* Gráficos originales dibujados en Canvas 2D. El fondo se prepara una sola vez. */
class SurvivorRenderer {
 constructor(ctx,makeCanvas){this.ctx=ctx;this.makeCanvas=makeCanvas||(()=>document.createElement('canvas'));this.background=null;this.zone=0}
 prepare(zone){
  this.zone=zone;const c=this.makeCanvas();c.width=960;c.height=600;const x=c.getContext('2d'),a=SURVIVOR_ZONES[zone-1];
  let seed=zone*7654321;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let y=0;y<600;y+=40)for(let p=0;p<960;p+=40){x.fillStyle=a.floor[Math.floor(rand()*3)];x.fillRect(p,y,40,40);x.fillStyle='#ffffff05';x.fillRect(p+rand()*28,y+rand()*28,rand()*12+3,2)}
  // Camino y plaza de runas centrales: decoración sin obstáculos invisibles.
  x.strokeStyle=zone===3?'#81959e22':'#c1bda21a';x.lineWidth=85;x.beginPath();x.moveTo(0,410);x.bezierCurveTo(330,410,380,190,960,190);x.stroke();
  x.strokeStyle=a.accent+'35';x.lineWidth=2;for(const r of [45,70,86]){x.beginPath();x.arc(480,300,r,0,Math.PI*2);x.stroke()}
  for(let i=0;i<8;i++){const t=i*Math.PI/4;x.fillStyle=a.accent+'80';x.save();x.translate(480+Math.cos(t)*83,300+Math.sin(t)*83);x.rotate(t);x.fillRect(-4,-4,8,8);x.restore()}
  for(let i=0;i<45;i++){const p=20+rand()*920,y=20+rand()*560;if(Math.hypot(p-480,y-300)<110)continue;if(zone===1){x.strokeStyle='#74975c55';x.beginPath();x.moveTo(p,y+5);x.lineTo(p-4,y-3);x.moveTo(p,y+5);x.lineTo(p+4,y-6);x.stroke()}else{x.fillStyle=a.accent+'30';x.fillRect(p,y,8+rand()*14,5+rand()*8)}}
  // Árboles y pilares se mantienen en el borde para que toda la arena sea transitable.
  for(let i=0;i<26;i++){const p=i<13?i*80:(i-13)*80,y=i<13?0:580;if(zone===1){x.fillStyle='#182d29';x.fillRect(p+15,y,8,24);x.fillStyle='#345844';x.beginPath();x.moveTo(p-4,y+4);x.lineTo(p+18,y-30);x.lineTo(p+42,y+4);x.fill();x.fillStyle='#426b4d';x.beginPath();x.moveTo(p+2,y-8);x.lineTo(p+19,y-40);x.lineTo(p+36,y-8);x.fill()}else{x.fillStyle=a.accent+'50';x.fillRect(p+10,y,24,22);x.fillStyle='#00000025';x.fillRect(p+27,y,7,22)}}
  const shade=x.createRadialGradient(480,300,160,480,300,570);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#02071480');x.fillStyle=shade;x.fillRect(0,0,960,600);this.background=c;
 }
 hero(p,t){
  const x=this.ctx,a=SURVIVOR_CLASSES[p.classId],bob=Math.sin(t*8+p.index)*1.2;
  x.save();x.translate(p.x,p.y);x.fillStyle='#0005';x.beginPath();x.ellipse(0,9,13,6,0,0,7);x.fill();
  if(p.hp<=0){x.strokeStyle='#a6b7c6';x.lineWidth=3;x.beginPath();x.moveTo(-8,-8);x.lineTo(8,8);x.moveTo(8,-8);x.lineTo(-8,8);x.stroke();x.fillStyle='#fff';x.font='9px sans-serif';x.textAlign='center';x.fillText('Acércate para revivir',0,-17);x.restore();return}
  if(p.invulnerable>0&&Math.floor(t*12)%2)x.globalAlpha=.48;
  x.translate(0,bob);x.fillStyle=p.index?'#94e7ff':a.color;x.beginPath();x.moveTo(-11,-6);x.lineTo(-16,14);x.lineTo(12,12);x.lineTo(10,-8);x.fill();
  x.fillStyle='#202b37';x.fillRect(-7,4,6,12);x.fillRect(3,4,6,12);x.fillStyle=a.color;x.fillRect(-9,-9,19,17);x.fillStyle='#f1cba6';x.fillRect(-5,-17,11,10);x.fillStyle='#322b36';x.fillRect(-2,-12,2,2);x.fillRect(4,-12,2,2);
  if(p.classId==='mage'){x.fillStyle='#7c72be';x.beginPath();x.moveTo(-12,-17);x.lineTo(0,-36);x.lineTo(12,-17);x.fill();x.fillStyle='#b6a2f1';x.fillRect(-15,-18,29,4);x.fillStyle='#98794f';x.fillRect(16,-19,3,35);x.fillStyle='#a6edff';x.beginPath();x.arc(17,-24,5,0,7);x.fill()}
  if(p.classId==='guardian'){x.fillStyle='#b1c2c8';x.fillRect(-8,-21,17,8);x.fillStyle='#e3b766';x.fillRect(-2,-24,5,15);x.fillStyle='#9fb6c0';x.fillRect(16,-20,4,29);x.fillStyle='#e5d39b';x.fillRect(10,3,17,4);x.fillStyle='#90633d';x.fillRect(-19,-7,10,18);x.strokeStyle='#dec67c';x.strokeRect(-19,-7,10,18)}
  if(p.classId==='ranger'){x.fillStyle='#40765a';x.beginPath();x.moveTo(-11,-17);x.lineTo(-6,-28);x.lineTo(8,-25);x.lineTo(12,-16);x.fill();x.strokeStyle='#c7a56b';x.lineWidth=3;x.beginPath();x.arc(9,-2,18,-1.3,1.3);x.stroke();x.strokeStyle='#ded5b6';x.lineWidth=1;x.beginPath();x.moveTo(14,-19);x.lineTo(14,15);x.stroke()}
  x.fillStyle=p.index?'#9fefff':'#f4e3b6';x.font='bold 10px sans-serif';x.textAlign='center';x.fillText('P'+(p.index+1),0,29);x.restore();
 }
 enemy(e,t,zone){
  const x=this.ctx,bob=Math.sin(t*6+e.id)*1.4,z=SURVIVOR_ZONES[zone-1];x.save();x.translate(e.x,e.y);x.fillStyle='#0005';x.beginPath();x.ellipse(0,e.r*.7,e.r,e.r*.4,0,0,7);x.fill();x.translate(0,bob);
  x.fillStyle=e.flash>0?'#fff':z.enemy;
  if(e.type==='slime'){x.beginPath();x.ellipse(0,0,13,11,0,Math.PI,Math.PI*2);x.lineTo(13,8);x.lineTo(-13,8);x.fill();x.fillStyle='#d8ecb6';x.fillRect(-9,1,18,7)}
  else if(e.type==='bat'){x.beginPath();x.moveTo(-3,2);x.lineTo(-23,-9+Math.sin(t*18)*5);x.lineTo(-17,7);x.lineTo(-5,10);x.lineTo(5,10);x.lineTo(17,7);x.lineTo(23,-9+Math.sin(t*18)*5);x.lineTo(3,2);x.fill();x.fillRect(-5,-7,10,18)}
  else if(e.type==='shade'){x.fillStyle=e.flash>0?'#fff':'#75658e';x.beginPath();x.moveTo(0,-18);x.lineTo(15,16);x.lineTo(0,10);x.lineTo(-14,16);x.fill();x.fillStyle='#282536';x.fillRect(-5,-6,11,9)}
  else{const r=e.r;x.fillStyle=e.flash>0?'#fff':e.type==='boss'?'#a887b0':e.type==='elite'?'#a69775':z.enemy;x.fillRect(-r*.7,-r*.7,r*1.4,r*1.5);x.fillStyle='#24343b';x.fillRect(-r*.45,-r*.45,r*.9,r*.45);x.fillStyle=z.accent;x.fillRect(-r*.75,-r,r*1.5,r*.25);x.fillRect(-r*.12,-r*.2,r*.24,r*.8);x.strokeStyle=z.accent;x.lineWidth=4;x.beginPath();x.moveTo(-r*.5,-r*.6);x.lineTo(-r,-r*1.3);x.moveTo(r*.5,-r*.6);x.lineTo(r,-r*1.3);x.stroke()}
  x.fillStyle=e.type==='boss'?'#ffe5aa':'#18252b';x.fillRect(-5,-3,3,3);x.fillRect(3,-3,3,3);
  if(e.type==='elite'||e.type==='boss'){x.fillStyle='#19232b';x.fillRect(-29,-e.r-14,58,5);x.fillStyle=e.type==='boss'?'#dd86ad':'#e5bf7a';x.fillRect(-29,-e.r-14,58*Math.max(0,e.hp/e.maxHp),5)}
  x.restore();
 }
 draw(g){
  const x=this.ctx;if(this.zone!==g.zone)this.prepare(g.zone);x.clearRect(0,0,960,600);x.drawImage(this.background,0,0);
  for(const gem of g.gems){x.fillStyle=gem.kind==='chest'?'#eac36d':'#72cfe4';if(gem.kind==='chest'){x.fillRect(gem.x-10,gem.y-7,20,15);x.fillStyle='#7e512f';x.fillRect(gem.x-10,gem.y-1,20,3);x.fillStyle='#ffec9d';x.fillRect(gem.x-2,gem.y-2,4,7)}else{x.beginPath();x.moveTo(gem.x,gem.y-5);x.lineTo(gem.x+4,gem.y);x.lineTo(gem.x,gem.y+5);x.lineTo(gem.x-4,gem.y);x.closePath();x.fill()}}
  const entities=[...g.enemies.map(e=>({y:e.y,e})),...g.players.map(p=>({y:p.y,p}))].sort((a,b)=>a.y-b.y);for(const item of entities)if(item.e)this.enemy(item.e,g.time,g.zone);else this.hero(item.p,g.time);
  for(const p of g.players){if(p.hp<=0)continue;const count=p.upgrades.orbit||0;for(let i=0;i<count;i++){const a=g.time*3+i*Math.PI*2/count,px=p.x+Math.cos(a)*53,py=p.y+Math.sin(a)*53;x.strokeStyle='#b2e9ff';x.lineWidth=2;x.save();x.translate(px,py);x.rotate(a);x.strokeRect(-6,-6,12,12);x.fillStyle='#99cfff';x.fillRect(-3,-3,6,6);x.restore()}}
  for(const shot of g.shots){x.strokeStyle=shot.classId==='mage'?'#baafff':'#e9d093';x.lineWidth=shot.classId==='mage'?5:3;const a=Math.atan2(shot.dy,shot.dx);x.beginPath();x.moveTo(shot.x,shot.y);x.lineTo(shot.x-Math.cos(a)*15,shot.y-Math.sin(a)*15);x.stroke();if(shot.classId==='mage'){x.fillStyle='#fff';x.fillRect(shot.x-2,shot.y-2,4,4)}}
  for(const effect of g.effects){const f=1-effect.ttl/effect.max;x.save();x.globalAlpha=1-f;x.strokeStyle=effect.color;x.lineWidth=effect.kind==='slash'?10:3;if(effect.kind==='lightning'){x.beginPath();x.moveTo(effect.x+10,effect.y-100);x.lineTo(effect.x-7,effect.y-42);x.lineTo(effect.x+12,effect.y-50);x.lineTo(effect.x,effect.y);x.stroke()}else{x.beginPath();x.arc(effect.x,effect.y,effect.r*(.3+f*.7),effect.kind==='slash'?-2.8:0,effect.kind==='slash'?1.5:Math.PI*2);x.stroke()}x.restore()}
 }
}
