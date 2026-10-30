const {chromium}=require('playwright');const fs=require('fs');
const SITE='/tmp/claude-0/w/site';
const F=['l','on','strip','label','type','stripe','shape','tsign','cross','ind'];
function key(s){const str=F.map(k=>s[k]||'').join('~');let h=5381;for(let i=0;i<str.length;i++)h=((h*33)^str.charCodeAt(i))>>>0;return h.toString(36);}
const specs={};
for(const f of fs.readdirSync(SITE).filter(f=>f.endsWith('.html'))){
  const t=fs.readFileSync(SITE+'/'+f,'utf8');
  for(const m of t.matchAll(/<span class="sr"([^>]*)>/g)){const s={};for(const a of m[1].matchAll(/data-([a-z]+)="([^"]*)"/g))s[a[1]]=a[2];specs[key(s)]=s;}
}
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://127.0.0.1:8765/render.html');await p.waitForFunction(()=>window.ready,{timeout:60000});
let n=0;
for(const [k,s] of Object.entries(specs)){
  const blink=/b/.test(s.on||'')||s.strip==='b';
  const jobs=[[k,s]];if(blink)jobs.push([k+'-b',{...s,blinkOff:true}]);
  for(const [name,sp] of jobs){const r=await p.evaluate(s=>window.renderSignal(s),sp);fs.writeFileSync('/tmp/claude-0/r3d/png/'+name+'.png',Buffer.from(r.url.split(',')[1],'base64'));n++;}
}
console.log('specs',Object.keys(specs).length,'images',n);await b.close()})()
