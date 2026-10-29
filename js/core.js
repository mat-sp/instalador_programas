/* Motor de estado independiente de la interfaz. */
globalThis.Engine = class {
  constructor(config, storage) {
    this.c = config;
    this.storage = storage;
    this.email = "";
    this.s = null;
  }
  login(email) {
    this.email = email.trim().toLowerCase();
    const raw = this.storage.getItem("aulapc:v1:" + this.email);
    this.s = raw
      ? JSON.parse(raw)
      : {
          version: 1,
          installed: {},
          files: structuredClone(this.c.files),
          events: [],
          hints: {},
          associations: {},
          windows: [],
        };
    if (this.s.version !== 1 || !Array.isArray(this.s.files))
      throw Error("No se puede leer este progreso.");
    this.s.events ||= [];
    this.s.activity ||= [];
    this.s.hints ||= {};
    this.s.createdAt ||= new Date().toISOString();
    // Migración de la antigua suite: sus documentos se conservan en Word.
    if(this.s.installed.office){this.s.installed.text ||= this.s.installed.office;delete this.s.installed.office;}
    for(const ext of Object.keys(this.s.associations||{}))if(this.s.associations[ext]==='office')this.s.associations[ext]='text';
    this.s.windows=(this.s.windows||[]).filter(w=>w.id!=='office');
    const archive = this.s.files.find(f => f.id === "archive");
    if (archive) archive.children = structuredClone(this.c.files.find(f => f.id === "archive").children);
    this.log('session','Sesión iniciada');
    return this.s;
  }
  beginFraud(fileId, now = Date.now()) {
    if(this.s.fraudIncident)return;
    const file=this.s.files.find(f=>f.id===fileId&&f.fraudulent);
    if(!file)throw Error('No se encuentra el instalador descargado.');
    this.log('fraud-install',{file:file.name,app:file.app,source:file.source});
    this.s.fraudIncident={fileId,name:file.name,app:file.app,until:now+6000,snapshot:structuredClone(this.s)};
    this.save();
  }
  recoverFraud() {
    if(!this.s.fraudIncident)return null;
    const name=this.s.fraudIncident.name;
    this.s=structuredClone(this.s.fraudIncident.snapshot);
    this.event('fraud-recovered',{file:name});
    return name;
  }
  reset() {
    this.s = {version:1, installed:{}, files:structuredClone(this.c.files), events:[], activity:[], createdAt:new Date().toISOString(), hints:{}, associations:{}, windows:[], preferences:{contrast:"standard",hour12:false}};
    this.save();
  }
  save() {
    this.storage.setItem("aulapc:v1:" + this.email, JSON.stringify(this.s));
  }
  used() {
    return (
      this.c.systemSize +
      Object.keys(this.s.installed).reduce(
        (n, id) => n + this.programUsed(id),
        0,
      ) +
      this.s.files.reduce((n, f) => n + f.size, 0)
    );
  }
  free() {
    return this.c.capacity - this.used();
  }
  log(action, detail = {}) {
    if(typeof PracticeFlow!=="undefined")PracticeFlow.observe(this.s,action,detail);
    (this.s.activity ||= []).push({time:new Date().toISOString(),action,detail:structuredClone(detail)});
    this.save();
    if(this.onChange)this.onChange();
  }
  event(name, detail = {}) {
    if (!this.s.events.includes(name)) this.s.events.push(name);
    this.log(name,detail);
    if(this.onChange)this.onChange();
  }
  addFile(file) {
    if (!this.folderExists(file.folder || "Descargas")) throw Error("No se encuentra la carpeta de destino. Se ha eliminado del equipo.");
    if (this.s.files.some((f) => f.id === file.id)) return false;
    if (this.free() < file.size)
      throw Error("No hay espacio suficiente para guardar el archivo.");
    this.s.files.push(structuredClone(file));
    this.log('file-added',{name:file.name,source:file.source||'',fraudulent:!!file.fraudulent,size:file.size});
    return true;
  }
  install(id, options = {}) {
    if(!this.c.apps[id])throw Error('Aplicación desconocida.');
    if(options.source==='store' && !['text','duo','game'].includes(id))throw Error('La instalación de esta aplicación está bloqueada en la Store de la práctica.');
    if (!this.folderExists("Archivos de Programa")) throw Error("No se encuentra Archivos de Programa. Restaura la carpeta antes de instalar.");
    if (this.s.installed[id] && !this.isBroken(id)) return;
    if (this.free() < this.installRequired(id)) {
      this.event("space-error",{app:id,required:this.installRequired(id),free:this.free(),sourceFile:options.sourceFile||null});
      throw Error(
        "Espacio insuficiente. Necesitas " +
          this.c.apps[id].size +
          " MB y solo tienes " +
          this.free() +
          " MB disponibles.",
      );
    }
    this.s.deletedFolders = (this.s.deletedFolders || []).filter(p => !this.within(p, "Archivos de Programa/" + id));
    this.s.installed[id] = {
      path: options.path || "C:\\Program Files\\" + this.c.apps[id].name,
      shortcut: options.shortcut !== false,
      source: options.source || 'web',
      installedAt: new Date().toISOString(),
    };
    if (options.associate !== false)
      for (const ext of this.c.apps[id].extensions)
        this.s.associations[ext] = id;
    this.event("install-" + id,{app:id,size:this.c.apps[id].size,source:options.source||'web',sourceFile:options.sourceFile||null});
    if(options.source==='store')this.event('store-install-'+id,{app:id});
  }
  extract(file) {
    if (!this.folderExists("Documentos")) throw Error("No se encuentra Documentos. Restaura la carpeta antes de extraer.");
    this.s.deletedFolders=(this.s.deletedFolders||[]).filter(p=>!this.within(p,"Documentos/Materiales"));
    const items = file.children
      .map((id) => this.c.contents[id])
      .filter((f) => !this.s.files.some((x) => x.id === f.id));
    const size = items.reduce((n, f) => n + f.size, 0);
    if (this.free() < size)
      throw Error("No hay espacio suficiente para extraer el contenido.");
    this.s.files.push(...structuredClone(items));
    this.event("extract",{archive:file.name,files:items.map(f=>f.name)});
    return items.length;
  }
  within(path, parent) { return path === parent || path.startsWith(parent + "/"); }
  folderExists(path) { return !(this.s.deletedFolders || []).some(parent => this.within(path, parent)); }
  programFiles(id) {
    const names = this.c.apps[id].installationFiles || [this.c.apps[id].name+'.exe','uninstall.exe','runtime.dll','settings.ini','LICENSE.txt','README.txt','data/resources.dat','data/defaults.dat','plugins/core.dll','plugins/formats.dll','locale/es/messages.ini','locale/en/messages.ini','icons/application.ico','help/index.html'];
    const size=this.c.apps[id].size, chunk=Math.floor(size/names.length);
    return names.map((name,i)=>({path:'Archivos de Programa/'+id+'/'+name,name:name.split('/').at(-1),size:i===names.length-1?size-chunk*(names.length-1):chunk,launch:i===0?id:null}));
  }
  programUsed(id) { return this.s.installed[id] ? this.programFiles(id).filter(f=>this.folderExists(f.path)).reduce((n,f)=>n+f.size,0) : 0; }
  isBroken(id) { return !!this.s.installed[id] && this.programFiles(id).some(f=>!this.folderExists(f.path)); }
  checkLaunch(id) {
    if(!this.s.installed[id])return false;
    if(this.isBroken(id)){this.event("launch-error",{app:id});return false;}
    return true;
  }
  installRequired(id) { return this.c.apps[id].size - this.programUsed(id); }
  deleteProgramFile(path) {
    const id=path.split("/")[1];
    if(!this.s.installed[id]||!this.programFiles(id).some(f=>f.path===path))throw Error("No se encuentra el archivo del programa.");
    this.deleteFolder(path,"program-file");
  }
  deleteFolder(path,type="folder") {
    if (!this.folderExists(path)) return;
    const snapshot=structuredClone({files:this.s.files,deletedFolders:this.s.deletedFolders||[]});
    this.s.files=this.s.files.filter(f=>!this.within(f.folder,path));
    this.s.deletedFolders=[...(this.s.deletedFolders||[]),path];
    this.s.folderUndo={path,type,snapshot};
    this.log(type==='program-file'?'delete-program-file':'delete-folder',{path});
  }
  undoFolder() {
    if(!this.s.folderUndo)return;
    this.s.files=this.s.folderUndo.snapshot.files;
    this.s.deletedFolders=this.s.folderUndo.snapshot.deletedFolders;
    const path=this.s.folderUndo.path;delete this.s.folderUndo;this.log('restore-folder',{path});
  }
  acceptFolderDeletion(){delete this.s.folderUndo;this.save();}
  uninstall(id, running) {
    if (running) {
      this.event("running-error",{app:id});
      throw Error(
        this.c.apps[id].name +
          " está en ejecución. Cierra el programa antes de desinstalarlo. Minimizarlo no lo cierra.",
      );
    }
    if (!this.s.installed[id]) return;
    const recovered=this.programUsed(id);
    delete this.s.installed[id];
    this.s.deletedFolders=(this.s.deletedFolders||[]).filter(p=>!this.within(p,"Archivos de Programa/"+id));
    for (const ext of Object.keys(this.s.associations))
      if (this.s.associations[ext] === id) delete this.s.associations[ext];
    this.event("uninstall",{app:id,recovered});
    if (this.s.events.includes("space-error")) this.event("free-space");
  }
};
