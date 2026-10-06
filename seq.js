const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1700,height:1000}});
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.CooksterTavernClean.cleaned=()=>[true,true,true];document.getElementById('tavernOpenBtn').click()});await p.waitForTimeout(2500);
await p.evaluate(()=>{CooksterTavern.spawn()});
const want={walks:0,walkd:0};let n=0;
for(let i=0;i<200&&(want.walks<10||want.walkd<10);i++){
 await p.waitForTimeout(110);
 const d=await p.evaluate(()=>CooksterTavern.debug().waiter);
 if(d.mode==='go'||d.mode==='back'){const k=d.set;if(want[k]!==undefined&&want[k]<10){await p.screenshot({path:'/tmp/claude-0/-home-user-cookster-site/74076901-e8e4-5583-b78c-bcb72f08cc1d/scratchpad/seq_'+k+'_'+want[k]+'.png',clip:{x:Math.max(0,d.x*1.0167-150),y:Math.max(0,d.y*1.0167+21-330),width:300,height:350}});want[k]++}}
}
console.log(want);await b.close()})();
