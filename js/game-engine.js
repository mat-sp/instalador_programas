/* Arcane Survivors: motor original 2D sin dependencias, WebGL ni recursos de terceros. */
const SURVIVOR_CLASSES={
 guardian:{name:'Guardián',icon:'⚔',color:'#e3b766',hp:150,speed:139,damage:20,cooldown:.72,description:'Barrido de espada y mayor resistencia.'},
 mage:{name:'Maga',icon:'✦',color:'#a5a5ff',hp:105,speed:151,damage:16,cooldown:.62,description:'Proyectiles arcanos que atraviesan enemigos.'},
 ranger:{name:'Exploradora',icon:'➶',color:'#80d6a1',hp:115,speed:164,damage:18,cooldown:.47,description:'Flechas rápidas y gran movilidad.'}
};
const SURVIVOR_ZONES=[
 {name:'Bosque del Alba',floor:['#233f36','#29483b','#254337'],accent:'#93c688',enemy:'#86b274',boss:'Guardián de las raíces',difficulty:1},
 {name:'Ruinas de Ámbar',floor:['#524331','#594a36','#4c4031'],accent:'#dfbb72',enemy:'#d6ac6b',boss:'Coloso de ámbar',difficulty:1.12},
 {name:'Valle de Escarcha',floor:['#334b60','#3b5265','#374e65'],accent:'#9cdce5',enemy:'#92c3dc',boss:'Titán de hielo',difficulty:1.24},
 {name:'Cenizas del Sur',floor:['#49343a','#51363b','#433037'],accent:'#f49168',enemy:'#de8c74',boss:'Centinela de ceniza',difficulty:1.36},
 {name:'Ciudad de las Estrellas',floor:['#302f52','#37335a','#2d304d'],accent:'#c5a2ef',enemy:'#b99bdd',boss:'Heraldo del eclipse',difficulty:1.5}
];
const SURVIVOR_UPGRADES={
 power:{name:'Poder ancestral',icon:'⚔',description:'+22 % de daño.',max:6},
 haste:{name:'Pulso acelerado',icon:'»',description:'Ataques un 13 % más rápidos.',max:5},
 speed:{name:'Botas del viento',icon:'➶',description:'+12 % de velocidad de movimiento.',max:4},
 vitality:{name:'Corazón de roble',icon:'♥',description:'+25 de vida máxima y cura 35.',max:5},
 multishot:{name:'Eco de combate',icon:'✧',description:'Una flecha/orbe extra o mayor barrido.',max:3},
 orbit:{name:'Runas orbitales',icon:'◈',description:'Runas que giran y dañan al tocar.',max:4},
 storm:{name:'Llamada de la tormenta',icon:'ϟ',description:'Rayos automáticos sobre enemigos cercanos.',max:4},
 nova:{name:'Onda arcana',icon:'◎',description:'Explosiones periódicas alrededor del héroe.',max:4},
 regeneration:{name:'Fuente de vida',icon:'✚',description:'Recupera 0,7 de vida por segundo.',max:4},
 magnet:{name:'Imán de cristales',icon:'◇',description:'+35 de alcance para recoger experiencia.',max:4}
};
function survivorProfile(raw){
 if(raw?.kind==='survivor'&&raw.version===1)return raw;
 return {kind:'survivor',version:1,shards:0,unlockedZone:1,talents:{power:0,vitality:0,wisdom:0},runs:0,victories:0,bestLevel:1,results:[],checkpoint:null};
}
function survivorTalentCost(rank){return 20*(rank+1)}
class SurvivorGame {
 constructor(options={}){
  this.version=1;this.seed=(options.seed??Date.now())>>>0||12345;this.zone=Math.max(1,Math.min(5,options.zone||1));this.mode=options.mode===2?2:1;this.time=0;this.state='playing';this.level=1;this.xp=0;this.nextXp=20;this.kills=0;this.bossKills=0;this.hits=0;this.spawnClock=.6;this.nextId=1;this.enemyCap=150;this.bossStages=[];this.finalBossDefeated=false;this.enemies=[];this.shots=[];this.gems=[];this.effects=[];this.choices=[];this.pendingPlayers=[];
  const talents=options.talents||{};
  this.players=Array.from({length:this.mode},(_,i)=>{
   const classId=Object.hasOwn(SURVIVOR_CLASSES,options.classes?.[i])?options.classes[i]:(i?'ranger':'mage'),a=SURVIVOR_CLASSES[classId],hp=a.hp+Number(talents.vitality||0)*8;
   return {classId,index:i,x:480+(i?35:-35),y:300,hp,maxHp:hp,damage:a.damage*(1+Number(talents.power||0)*.05),speed:a.speed,cooldown:a.cooldown,attackClock:.1,novaClock:2,stormClock:1.5,invulnerable:0,pickup:65+Number(talents.wisdom||0)*8,upgrades:{},deadTime:0};
  });
 }
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
 nearest(p,range=420){let best=null,d=range;for(const e of this.enemies){if(e.hp<=0)continue;const n=this.distance(p,e);if(n<d){d=n;best=e}}return best}
 spawn(type){
  if(this.enemies.length>=this.enemyCap&&!['elite','boss'].includes(type))return null;
  const t=this.time,zone=SURVIVOR_ZONES[this.zone-1],side=Math.floor(this.random()*4);let x,y;
  if(side<2){x=side?952:8;y=20+this.random()*560}else{x=20+this.random()*920;y=side===2?8:592}
  const stats={slime:[15,37,8,2,12],bat:[11,69,6,2,10],brute:[57,26,14,6,18],shade:[26,48,11,4,12],elite:[360+this.zone*70,31,18,30,27],boss:[720+this.zone*170,28,23,65,35]}[type]||[15,37,8,2,12];
  const scale=zone.difficulty*(1+t/520),multi=this.mode===2?1.6:1,hp=stats[0]*scale*multi;
  const enemy={id:this.nextId++,type,x,y,hp,maxHp:hp,speed:stats[1]*(1+Math.min(.45,t/600)),damage:stats[2],xp:stats[3],r:stats[4],orbitClock:0,chargeClock:3,charge:0,dx:0,dy:0,flash:0};
  this.enemies.push(enemy);return enemy;
 }
 addEffect(kind,x,y,r=20,color='#ddcb94'){if(this.effects.length<75)this.effects.push({kind,x,y,r,color,ttl:kind==='slash'?.22:.38,max:kind==='slash'?.22:.38})}
 hurt(e,damage){if(e.hp<=0)return;e.hp-=damage;e.flash=.08;if(e.hp>0)return;this.kills++;this.dropGem(e.x,e.y,e.xp);if(e.type==='elite'||e.type==='boss'){this.bossKills++;this.gems.push({x:e.x,y:e.y,value:15,kind:'chest'});this.addEffect('nova',e.x,e.y,75,'#f6d77c');if(e.type==='boss')this.finalBossDefeated=true;}}
 dropGem(x,y,value){
  if(this.gems.length<110){this.gems.push({x,y,value,kind:'xp'});return}
  let closest=this.gems[0];for(const g of this.gems)if(g.kind==='xp'&&this.distance({x,y},g)<this.distance({x,y},closest))closest=g;closest.value+=value;
 }
 addXP(value){this.xp+=value;this.checkLevel()}
 checkLevel(){if(this.choices.length||this.state!=='playing')return;if(this.xp>=this.nextXp){this.xp-=this.nextXp;this.level++;this.nextXp=10+this.level*8+this.level*this.level*2;this.pendingPlayers=this.players.map((_,i)=>i);this.offerChoices()}}
 offerChoices(){
  const p=this.players[this.pendingPlayers[0]],pool=Object.keys(SURVIVOR_UPGRADES).filter(id=>(p.upgrades[id]||0)<SURVIVOR_UPGRADES[id].max);this.choices=[];
  while(pool.length&&this.choices.length<3)this.choices.push(pool.splice(Math.floor(this.random()*pool.length),1)[0]);
  if(!this.choices.length){p.hp=p.maxHp;this.pendingPlayers.shift();if(this.pendingPlayers.length)this.offerChoices();}
 }
 choose(index){
  const id=this.choices[index];if(!id)return false;const p=this.players[this.pendingPlayers[0]];p.upgrades[id]=(p.upgrades[id]||0)+1;
  if(id==='power')p.damage*=1.22;if(id==='haste')p.cooldown*=.87;if(id==='speed')p.speed*=1.12;if(id==='vitality'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+35)}if(id==='magnet')p.pickup+=35;
  this.pendingPlayers.shift();this.choices=[];if(this.pendingPlayers.length)this.offerChoices();else this.checkLevel();return {id,player:p.index,rank:p.upgrades[id]};
 }
 attack(p){
  const target=this.nearest(p,p.classId==='guardian'?90:440);if(!target)return;
  const multi=p.upgrades.multishot||0;
  if(p.classId==='guardian'){
   const radius=65+multi*11;this.addEffect('slash',p.x,p.y,radius,SURVIVOR_CLASSES.guardian.color);for(const e of this.enemies)if(this.distance(p,e)<radius+e.r)this.hurt(e,p.damage*(1+multi*.12));return;
  }
  const angle=Math.atan2(target.y-p.y,target.x-p.x),count=1+multi;
  for(let n=0;n<count;n++){if(this.shots.length>=100)break;const a=angle+(n-(count-1)/2)*.16;this.shots.push({x:p.x,y:p.y,dx:Math.cos(a)*420,dy:Math.sin(a)*420,damage:p.damage,life:1.8,pierce:p.classId==='mage'?2:1,hit:[],classId:p.classId});}
 }
 step(dt,keys=new Set()){
  if(this.state!=='playing'||this.choices.length)return;dt=Math.min(.04,Math.max(0,dt));if(!dt)return;this.time+=dt;
  for(const [at,type] of [[60,'elite'],[120,'elite'],[180,'boss']])if(this.time>=at&&!this.bossStages.includes(at)){this.bossStages.push(at);this.spawn(type);}
  this.spawnClock-=dt;if(this.spawnClock<=0){const rate=(1+Math.min(3.6,this.time/45))*(this.mode===2?1.35:1)*(this.time>180?.55:1);this.spawnClock=1/rate;const roll=this.random();this.spawn(this.time>75&&roll<.14?'brute':this.time>30&&roll<.36?'shade':roll>.78?'bat':'slime');}
  const controls=[['a','d','w','s'],['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']];
  for(const p of this.players){
   p.invulnerable=Math.max(0,p.invulnerable-dt);
   if(p.hp<=0){p.deadTime+=dt;const partner=this.players.find(q=>q!==p&&q.hp>0);if(partner&&this.distance(p,partner)<60&&p.deadTime>2){p.hp=p.maxHp*.4;p.invulnerable=2;p.deadTime=0;this.addEffect('nova',p.x,p.y,55,'#8ef1ac')}continue}
   const k=controls[p.index],dx=Number(keys.has(k[1]))-Number(keys.has(k[0])),dy=Number(keys.has(k[3]))-Number(keys.has(k[2])),len=Math.hypot(dx,dy)||1;
   p.x=Math.max(20,Math.min(940,p.x+dx/len*p.speed*dt));p.y=Math.max(20,Math.min(580,p.y+dy/len*p.speed*dt));p.hp=Math.min(p.maxHp,p.hp+dt*.7*(p.upgrades.regeneration||0));
   p.attackClock-=dt;if(p.attackClock<=0){p.attackClock+=p.cooldown;this.attack(p)}
   const orbit=p.upgrades.orbit||0;for(let i=0;i<orbit;i++){const a=this.time*3+i*Math.PI*2/orbit,orb={x:p.x+Math.cos(a)*53,y:p.y+Math.sin(a)*53};for(const e of this.enemies)if(e.orbitClock<=0&&this.distance(orb,e)<e.r+10){this.hurt(e,p.damage*.65);e.orbitClock=.3;}}
   if(p.upgrades.nova){p.novaClock-=dt;if(p.novaClock<=0){p.novaClock=3.5/(1+p.upgrades.nova*.12);const radius=90+p.upgrades.nova*12;this.addEffect('nova',p.x,p.y,radius,'#a2c4ff');for(const e of this.enemies)if(this.distance(p,e)<radius+e.r)this.hurt(e,p.damage*(1+p.upgrades.nova*.25));}}
   if(p.upgrades.storm){p.stormClock-=dt;if(p.stormClock<=0){p.stormClock=2.8;for(let n=0;n<p.upgrades.storm;n++){const e=this.nearest(p,600);if(e){this.addEffect('lightning',e.x,e.y,45,'#c1eaff');this.hurt(e,p.damage*2);}}}}
  }
  const live=this.players.filter(p=>p.hp>0);if(!live.length){this.state='lost';return}
  for(const e of this.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.orbitClock-=dt;let target=live[0];for(const p of live)if(this.distance(e,p)<this.distance(e,target))target=p;
   let dx=target.x-e.x,dy=target.y-e.y,len=Math.hypot(dx,dy)||1,speed=e.speed;
   if(e.type==='boss'||e.type==='elite'){e.chargeClock-=dt;if(e.chargeClock<=0){e.chargeClock=e.type==='boss'?4.5:6;e.charge=.55;e.dx=dx/len;e.dy=dy/len;this.addEffect('warn',e.x,e.y,60,'#ff8975')}if(e.charge>0){e.charge-=dt;dx=e.dx;dy=e.dy;len=1;speed*=3.4;}}
   e.x+=dx/len*speed*dt;e.y+=dy/len*speed*dt;
   for(const p of live)if(p.invulnerable<=0&&this.distance(e,p)<e.r+12){const damage=e.damage*(p.classId==='guardian'?.72:1);p.hp=Math.max(0,p.hp-damage);p.invulnerable=.75;this.hits++;this.addEffect('hit',p.x,p.y,22,'#ff9090')}
  }
  // Rejilla espacial: las flechas comprueban solo los enemigos de su celda y las contiguas.
  const grid=new Map();for(const e of this.enemies){if(e.hp<=0)continue;const key=(Math.floor(e.x/80))+','+Math.floor(e.y/80);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e)}
  for(const shot of this.shots){shot.x+=shot.dx*dt;shot.y+=shot.dy*dt;shot.life-=dt;if(shot.life<=0)continue;const gx=Math.floor(shot.x/80),gy=Math.floor(shot.y/80);for(let x=gx-1;x<=gx+1&&shot.life>0;x++)for(let y=gy-1;y<=gy+1&&shot.life>0;y++)for(const e of grid.get(x+','+y)||[]){if(e.hp<=0||shot.hit.includes(e.id))continue;if(this.distance(shot,e)<e.r+6){shot.hit.push(e.id);this.hurt(e,shot.damage);shot.pierce--;if(shot.pierce<=0){shot.life=0;break}}}}
  this.shots=this.shots.filter(s=>s.life>0&&s.x>-30&&s.x<990&&s.y>-30&&s.y<630);this.enemies=this.enemies.filter(e=>e.hp>0);
  let gained=0;this.gems=this.gems.filter(g=>{let p=live[0];for(const q of live)if(this.distance(g,q)<this.distance(g,p))p=q;const dist=this.distance(g,p);if(dist<p.pickup){const speed=dist<25?0:Math.max(180,dist*5);g.x+=(p.x-g.x)/Math.max(1,dist)*speed*dt;g.y+=(p.y-g.y)/Math.max(1,dist)*speed*dt;}if(dist<23){gained+=g.value;if(g.kind==='chest')for(const q of live)q.hp=Math.min(q.maxHp,q.hp+35);return false}return true});
  for(const e of this.effects)e.ttl-=dt;this.effects=this.effects.filter(e=>e.ttl>0);if(this.finalBossDefeated){this.state='won';this.choices=[];this.pendingPlayers=[];return}if(gained)this.addXP(gained);
 }
 reward(){return Math.max(1,Math.floor(this.kills/9)+this.bossKills*8+(this.state==='won'?35:0))}
 snapshot(){const data={};for(const key of ['version','seed','zone','mode','time','state','level','xp','nextXp','kills','bossKills','hits','spawnClock','nextId','enemyCap','bossStages','finalBossDefeated','players','enemies','shots','gems','effects','choices','pendingPlayers'])data[key]=structuredClone(this[key]);return data}
 static validate(s){
  if(!s||s.version!==1||!Number.isInteger(s.zone)||s.zone<1||s.zone>5||![1,2].includes(s.mode)||!['playing','won','lost'].includes(s.state)||!Number.isFinite(s.time)||s.time<0||s.time>86400)throw Error('Partida no válida.');
  const limits={players:2,enemies:155,shots:100,gems:115,effects:75,choices:3,pendingPlayers:2,bossStages:3};for(const [key,max]of Object.entries(limits))if(!Array.isArray(s[key])||s[key].length>max)throw Error('Partida demasiado grande.');
  for(const key of ['seed','level','xp','nextXp','kills','bossKills','hits','spawnClock','nextId','enemyCap'])if(!Number.isFinite(s[key]))throw Error('Contador de partida no válido.');
  if(s.enemyCap!==150||s.level<1||s.nextXp<=0)throw Error('Límites de partida no válidos.');
  if(s.players.length!==s.mode||s.players.some((p,i)=>!Object.hasOwn(SURVIVOR_CLASSES,p.classId)||p.index!==i||!p.upgrades||Object.keys(p.upgrades).some(k=>!Object.hasOwn(SURVIVOR_UPGRADES,k))))throw Error('Héroe no válido.');
  for(const p of s.players){for(const k of ['hp','maxHp','damage','speed','cooldown','attackClock','novaClock','stormClock','invulnerable','pickup','deadTime'])if(!Number.isFinite(p[k]))throw Error('Estadística del héroe no válida.');if(p.maxHp<=0||p.cooldown<=0||Object.entries(p.upgrades).some(([id,rank])=>!Number.isInteger(rank)||rank<1||rank>SURVIVOR_UPGRADES[id].max))throw Error('Mejora del héroe no válida.');}
  for(const id of s.choices)if(!Object.hasOwn(SURVIVOR_UPGRADES,id))throw Error('Mejora no válida.');
  for(const i of s.pendingPlayers)if(!Number.isInteger(i)||i<0||i>=s.mode)throw Error('Turno no válido.');
  const walk=(v,depth=0)=>{if(depth>7)throw Error('Partida no válida.');if(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>1e12))throw Error('Valor de partida no válido.');if(v&&typeof v==='object')for(const x of Object.values(v))walk(x,depth+1)};walk(s);
  for(const list of [s.players,s.enemies,s.shots,s.gems,s.effects])for(const item of list)if(!Number.isFinite(item.x)||!Number.isFinite(item.y))throw Error('Posición no válida.');
  if(s.enemies.some(e=>!['slime','bat','brute','shade','elite','boss'].includes(e.type))||s.shots.some(s=>!Object.hasOwn(SURVIVOR_CLASSES,s.classId)||!Array.isArray(s.hit)||s.hit.length>5))throw Error('Combate no válido.');
  return s;
 }
 static restore(snapshot){const data=this.validate(structuredClone(snapshot)),g=new SurvivorGame({zone:data.zone,mode:data.mode});for(const key of Object.keys(g.snapshot()))g[key]=data[key];return g}
}
