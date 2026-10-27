// Regression checks for the actual inline application, using a deterministic
// clock and a minimal DOM/canvas host. Run with: node --test tests/wheel.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');

function app(saved = {}, options = {}) {
  let now = 0, next = 1;
  const timers = new Map(), frames = new Map(), elements = new Map();
  const gradient = {addColorStop(){}};
  const context = new Proxy({}, {get:(_, key)=>key === 'createRadialGradient' ? ()=>gradient : key === 'measureText' ? text=>({width:Array.from(String(text)).length*9}) : ()=>{}});
  function element(id='') {
    const classes = new Set();
    return {id,tagName:'DIV',value:'',textContent:'',innerHTML:'',dataset:{},style:{},children:[],disabled:false,isConnected:true,attributes:{},listeners:{},
      classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}},
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k];},
      addEventListener(k,v){this.listeners[k]=v;},appendChild(v){this.children.push(v);},insertAdjacentHTML(){},remove(){},focus(){document.activeElement=this;},blur(){document.activeElement=document.body;},
      click(){if(!this.disabled)this.listeners.click?.({target:this,preventDefault(){}});},
      querySelectorAll(){return[];},getBoundingClientRect(){return{width:440,height:440};},getContext(){return context;}};
  }
  const document={body:element(),documentElement:element(),activeElement:null,
    getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},
    createElement(){return element();},querySelector(){return element();},querySelectorAll(){return[];}};
  document.activeElement=document.body;
  const storage=new Map(Object.entries(saved));
  const sandbox={document,console,URL,Blob,Uint32Array,performance:{now:()=>now},
    localStorage:{getItem(k){if(options.noStorage)throw Error('blocked');return storage.get(k)||null;},setItem(k,v){if(options.noStorage)throw Error('blocked');storage.set(k,v);}},
    setTimeout(fn,delay){const id=next++;timers.set(id,{fn,at:now+delay});return id;},clearTimeout(id){timers.delete(id);},
    requestAnimationFrame(fn){const id=next++;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},
    navigator:{},history:{replaceState(){}},location:{hash:options.hash||'',protocol:'http:',pathname:'/',search:'',href:'http://localhost/'},
    atob:v=>Buffer.from(v,'base64').toString('binary'),btoa:v=>Buffer.from(v,'binary').toString('base64'),prompt:()=>null,alert(){},confirm:()=>true};
  sandbox.window={crypto:webcrypto,devicePixelRatio:1,innerWidth:1440,innerHeight:1000,location:sandbox.location,matchMedia:()=>({matches:!!options.reducedMotion}),addEventListener(){}};
  const ctx=vm.createContext(sandbox);
  vm.runInContext(source,ctx);
  return {run:code=>vm.runInContext(code,ctx),elements,storage,timers,frames,
    advance(ms){now+=ms;const pending=[...timers];for(const[id,t]of pending)if(t.at<=now){timers.delete(id);t.fn();}},
    frame(ms){now+=ms;const pending=[...frames];frames.clear();for(const[,fn]of pending)fn(now);}};
}

test('the single HTML file boots and escapes HTML and attributes correctly',()=>{
  const a=app();
  assert.equal(a.run('getActiveItems().length'),6);
  assert.equal(a.run(`escapeHtml(${JSON.stringify('<img src="x"> & \'quoted\'')})`),'&lt;img src=&quot;x&quot;&gt; &amp; &#39;quoted&#39;');
  assert.ok(a.storage.has('picker_studio_pro_v3_state'));
});
test('migrates original site entries, scores, settings, and zero volume',()=>{
  const a=app({pickerStudioUltraData:JSON.stringify({items:[{id:8,text:'Old choice',count:7}],theme:'light',soundEnabled:false,duration:6})});
  assert.equal(a.run('getActiveItems()[0].name'),'Old choice');
  assert.equal(a.run('getActiveItems()[0].wins'),7);
  assert.equal(a.run('state.theme'),'light');
  assert.equal(a.run('state.muted'),true);
  assert.equal(a.run('getActiveWs().spinDuration'),6);
  const b=app({picker_studio_pro_v3_state:JSON.stringify({volume:0,workspaces:[{id:'a',items:[]}]})});
  assert.equal(b.run('state.volume'),0);
});
test('corrupt saved state and blocked storage still allow spinning without audio',()=>{
  const a=app({picker_studio_pro_v3_state:'{"workspaces":[{}]}'});
  assert.equal(a.run('getActiveItems().length'),6);
  const b=app({}, {noStorage:true});
  b.run('triggerSpin()');b.frame(5000);
  assert.equal(b.run('getActiveWs().history.length'),1);
  assert.match(b.elements.get('saveStatus').textContent,/Not saved/);
});
test('weighted slices cover the wheel and the pointer selects the visible slice',()=>{
  const a=app();
  a.run(`getActiveWs().weighted=true;getActiveWs().items=normalizeWorkspace({items:[{name:'A',weight:1},{name:'B',weight:3},{name:'Paused',weight:99,active:false}]}).items`);
  assert.equal(a.run('getSliceAngles().length'),2);
  assert.equal(a.run('getSliceAngles()[0].arc'),Math.PI/2);
  assert.equal(a.run('getSliceAngles()[1].arc'),3*Math.PI/2);
  assert.equal(a.run('getSliceUnderPointer(-Math.PI/4).item.name'),'A');
  assert.equal(a.run('getSliceUnderPointer(-Math.PI).item.name'),'B');
  assert.equal(a.run('getSliceAngles()[1].color'),a.run('PALETTES.cyber[1]'));
});
test('equal mode gives three entries identical sizes and tickets regardless of stored weights',()=>{
  const a=app();
  a.run(`getActiveWs().weighted=false;getActiveWs().items=normalizeWorkspace({items:[{name:'A',weight:1},{name:'B',weight:2},{name:'C',weight:99}]}).items`);
  assert.equal(a.run('getSliceAngles().every(s=>s.arc === Math.PI*2/3)'),true);
  assert.equal(a.run('getSliceAngles().every(s=>s.odds === "33.3")'),true);
  a.run(`globalThis.word=0;window.crypto={getRandomValues:a=>{a[0]=word++;return a;}}`);
  assert.equal(a.run('chooseRandomSlice(getSliceAngles()).item.name'),'A');
  assert.equal(a.run('chooseRandomSlice(getSliceAngles()).item.name'),'B');
  assert.equal(a.run('chooseRandomSlice(getSliceAngles()).item.name'),'C');
});
test('cryptographic integer selection rejects the biased tail and weighted tickets match displayed odds',()=>{
  const a=app();
  a.run(`globalThis.words=[4294967295,2];window.crypto={getRandomValues:a=>{a[0]=words.shift();return a;}}`);
  assert.equal(a.run('cryptoRandomInt(3)'),2);
  assert.equal(a.run('words.length'),0);
  assert.throws(()=>a.run('cryptoRandomInt(0)'));
  a.run(`getActiveWs().weighted=true;getActiveWs().items=normalizeWorkspace({items:[{name:'A',weight:2},{name:'B',weight:1},{name:'C',weight:1}]}).items;globalThis.word=0;window.crypto={getRandomValues:a=>{a[0]=word++;return a;}}`);
  assert.equal(a.run('Array.from({length:4},()=>chooseRandomSlice(getSliceAngles()).item.name).join(",")'),'A,A,B,C');
  assert.equal(a.run('getSliceAngles().map(s=>s.odds).join(",")'),'50.0,25.0,25.0');
});
test('the animated landing, highlighted slice and awarded winner agree across repeated spins',()=>{
  const a=app({}, {reducedMotion:true});
  a.run(`getActiveWs().items=normalizeWorkspace({items:['A','B','C']}).items;getActiveWs().showModal=false`);
  for(let n=0;n<40;n++) {
    a.run('triggerSpin()');a.frame(200);
    assert.equal(a.run('getSliceUnderPointer().item.id'),a.run('lastWonItemId'));
  }
  assert.equal(a.run('getActiveWs().items.reduce((n,i)=>n+i.wins,0)'),40);
});
test('normalization bounds weights and duration and strips untrusted identifiers',()=>{
  const a=app();
  a.run(`globalThis.imported=normalizeWorkspace({spinDuration:Infinity,targetScore:-8,items:[{id:'bad" onclick="bad',name:'A',weight:-4},{id:'same',name:'B',weight:Infinity},{id:'same',name:'C',weight:1000},null]})`);
  assert.equal(a.run('imported.items.length'),3);
  assert.equal(a.run('imported.items[0].weight'),1);
  assert.equal(a.run('imported.items[1].weight'),1);
  assert.equal(a.run('imported.items[2].weight'),99);
  assert.equal(a.run('new Set(imported.items.map(i=>i.id)).size'),3);
  assert.equal(a.run('imported.spinDuration'),4);
});
test('CSV round trip preserves commas, double quotes, newlines and flags',()=>{
  const a=app();
  a.run(String.raw`globalThis.csvRows=[['Name','Weight','Wins','Active','Mystery'],['Pizza, pasta',3,2,false,true],['Say "hello"\nagain',1,0,true,false]];globalThis.csv=csvRows.map(r=>r.map(csvEscape).join(',')).join('\r\n');importContent(csv,'roundtrip.CSV')`);
  assert.equal(a.run('state.workspaces.length'),2);
  assert.equal(a.run('getActiveWs().items[0].name'),'Pizza, pasta');
  assert.equal(a.run('getActiveWs().items[0].active'),false);
  assert.equal(a.run('getActiveWs().items[0].mystery'),true);
  assert.equal(a.run('getActiveWs().items[0].wins'),2);
  assert.equal(a.run('getActiveWs().items[1].name'),'Say "hello"\nagain');
  assert.throws(()=>a.run(`parseCsv('"unclosed')`));
});
test('backup imports preserve existing wheels and reject invalid backups atomically',()=>{
  const a=app();
  const oldId=a.run('getActiveWs().id');
  a.run(`importContent(JSON.stringify(state),'backup.json')`);
  assert.equal(a.run('state.workspaces.length'),2);
  assert.equal(a.run('state.workspaces[0].id'),oldId);
  assert.notEqual(a.run('state.workspaces[1].id'),oldId);
  assert.throws(()=>a.run(`importContent(' {"workspaces":[]}','bad.json')`));
  assert.equal(a.run('state.workspaces.length'),2);
});
test('plain text imports retain commas; shared Unicode wheels load correctly',()=>{
  const a=app();a.run(String.raw`importContent('Tea, please\nCoffee','choices.txt')`);
  assert.equal(a.run('getActiveWs().items[0].name'),'Tea, please');
  const payload=Buffer.from(encodeURIComponent(JSON.stringify({name:'বাংলা 🎉',items:['চা','Coffee ☕']})),'binary').toString('base64');
  const b=app({}, {hash:'#wheel='+payload});
  assert.equal(b.run('getActiveWs().name'),'বাংলা 🎉 (Shared)');
  assert.equal(b.run('getActiveItems()[0].name'),'চা');
});
test('a spin awards exactly one win, records history and auto-eliminates',()=>{
  const a=app();a.run('getActiveWs().autoRemove=true;getActiveWs().showModal=false;triggerSpin();triggerSpin()');
  assert.equal(a.frames.size,1);
  a.frame(5000);
  assert.equal(a.run('getActiveWs().items.reduce((n,i)=>n+i.wins,0)'),1);
  assert.equal(a.run('getActiveWs().history.length'),1);
  assert.equal(a.run('getActiveItems().length'),5);
  assert.equal(a.run('isSpinning'),false);
});
test('paused races cancel pending spins, including a stop/start in the inter-spin gap',()=>{
  const a=app();a.run('getActiveWs().targetScore=100;toggleAutoRace()');a.frame(5000);
  assert.equal(a.run('isAutoRacing'),true);
  assert.equal(a.run('raceTimer !== null'),true);
  a.run('stopSpinImmediately();toggleAutoRace()');
  a.advance(1000);
  assert.equal(a.frames.size,2); // current spin and celebration, no old race spin
  assert.equal(a.run('getActiveWs().history.length'),1);
  a.run('stopSpinImmediately()');a.advance(2000);
  assert.equal(a.run('isSpinning'),false);
});
test('race completion and progressive mystery reveal are recorded once',()=>{
  const a=app();a.run(`getActiveWs().items=normalizeWorkspace({items:['Only winner']}).items;getActiveWs().mysteryMode=true;getActiveWs().targetScore=1;toggleAutoRace()`);a.frame(5000);
  assert.equal(a.run('isAutoRacing'),false);
  assert.equal(a.run('getActiveWs().items[0].revealed'),true);
  assert.equal(a.run('getActiveWs().history[0].wasMystery'),true);
  assert.equal(a.run('raceTimer'),null);
  assert.equal(a.elements.get('modalBadgeText').textContent,'GRAND RACE CHAMPION!');
});
test('target 7 repeats spins automatically until the first entry reaches 7 points',()=>{
  const a=app();
  a.run(`getActiveWs().items=normalizeWorkspace({items:['A','B','C']}).items;getActiveWs().targetScore=7;toggleAutoRace()`);
  for (let n=0;n<19 && a.run('isAutoRacing');n++) {
    a.frame(5000);
    if (a.run('isAutoRacing')) a.advance(900);
  }
  assert.equal(a.run('isAutoRacing'),false);
  assert.equal(a.run('Math.max(...getActiveWs().items.map(i=>i.wins))'),7);
  assert.equal(a.run('getActiveWs().items.filter(i=>i.wins===7).length'),1);
  assert.equal(a.run('raceTimer'),null);
  assert.equal(a.elements.get('modalBadgeText').textContent,'GRAND RACE CHAMPION!');
  const spins=a.run('getActiveWs().history.length');
  a.advance(2000);a.frame(5000);
  assert.equal(a.run('getActiveWs().history.length'),spins);
});
test('undo restores an edit, and reduced motion avoids celebration animation',()=>{
  const a=app({}, {reducedMotion:true});
  a.run(`rememberEdit();getActiveWs().items=[];updateButtonsState();document.getElementById('undoBtn').click()`);
  assert.equal(a.run('getActiveItems().length'),6);
  a.run('getActiveWs().showModal=false;triggerSpin()');a.frame(200);
  assert.equal(a.run('isSpinning'),false);
  assert.equal(a.run('particles.length'),0);
});
test('bulk editing in equal mode never re-enables hidden custom weights',()=>{
  const a=app();
  a.run(`getActiveWs().items=normalizeWorkspace({items:[{name:'A',weight:2},{name:'B',weight:1}]}).items;getActiveWs().weighted=false;renderAll();document.getElementById('bulkToggleBtn').click()`);
  assert.equal(a.elements.get('bulkTextarea').value,'A\nB');
  a.run(`document.getElementById('applyBulkBtn').click()`);
  assert.equal(a.run('getActiveWs().weighted'),false);
  assert.equal(a.run('getSliceAngles().every(s=>s.odds==="50.0")'),true);
});
test('bulk drafts stay with their own wheel when switching workspaces',()=>{
  const a=app();
  a.run(`globalThis.originalWs=getActiveWs();document.getElementById('bulkToggleBtn').click();document.getElementById('bulkTextarea').value='Draft for first wheel';globalThis.secondWs=normalizeWorkspace({name:'Second',items:['Second choice']});state.workspaces.push(secondWs);state.activeWorkspaceId=secondWs.id;renderAll();document.getElementById('bulkToggleBtn').click()`);
  assert.equal(a.elements.get('bulkTextarea').value,'Second choice');
  a.run(`document.getElementById('applyBulkBtn').click();state.activeWorkspaceId=originalWs.id;renderAll();document.getElementById('bulkToggleBtn').click()`);
  assert.equal(a.elements.get('bulkTextarea').value,'Draft for first wheel');
  assert.equal(a.run('secondWs.items[0].name'),'Second choice');
  assert.equal(a.run('originalWs.items[0].name'),'Deep Work Sprint');
});
test('unchanged bulk lines preserve names containing the optional suffix syntax',()=>{
  const a=app();
  a.run(`getActiveWs().items=normalizeWorkspace({items:['Prize * 3','What now ?','Duplicate','Duplicate']}).items;renderAll();document.getElementById('bulkToggleBtn').click();document.getElementById('applyBulkBtn').click()`);
  assert.equal(a.run('getActiveWs().items.map(i=>i.name).join("|")'),'Prize * 3|What now ?|Duplicate|Duplicate');
  assert.equal(a.run('getActiveWs().weighted'),false);
  assert.equal(a.run('new Set(getActiveWs().items.map(i=>i.id)).size'),4);
});
test('the brighter appearance migrates once without losing choices, points or later theme preferences',()=>{
  const a=app({picker_studio_pro_v3_state:JSON.stringify({theme:'dark',workspaces:[{id:'old',items:[{name:'Saved choice',wins:6}]}]})});
  assert.equal(a.run('state.theme'),'light');
  assert.equal(a.run('getActiveWs().items[0].wins'),6);
  assert.equal(a.run('getActiveWs().items[0].name'),'Saved choice');
  a.run(`document.getElementById('themeBtn').click()`);
  const b=app(Object.fromEntries(a.storage));
  assert.equal(b.run('state.theme'),'dark');
  assert.equal(b.run('getActiveWs().items[0].wins'),6);
});
test('the default wheel text exceeds 4.5 to 1 contrast on every bright slice',()=>{
  const a=app();
  assert.equal(a.run(`PALETTES.cyber.every(color=>{
    const a=colorLuminance(color),b=colorLuminance(wheelLabelColor(color));
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= 4.5;
  })`),true);
});
test('long wheel labels wrap at measured widths and truncate with an ellipsis instead of compressing',()=>{
  const a=app();
  a.run(`globalThis.wrapped=wrapWheelLabel('Deep Work Sprint',90,2);globalThis.longLabel=wrapWheelLabel('Supercalifragilisticexpialidocious another long choice',90,2)`);
  assert.equal(a.run('wrapped.join("|")'),'Deep Work|Sprint');
  assert.equal(a.run('longLabel.length'),2);
  assert.equal(a.run('longLabel.at(-1).endsWith("…")'),true);
  assert.equal(a.run('longLabel.every(line=>line.length*9<=90)'),true);
});
