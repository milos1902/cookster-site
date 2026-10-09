/* Alat „Svetlo i senke": sam nameštaš svetlost u kafani, kao u 3D programima.
   Za svaku lampu: upaljena/ugašena, gde svetlo pada na pod (prevuci žutu tačku na sceni), domet, visina lampe (niža lampa = duža i kosa senka), jačina senke,
   toplina svetla (hladno plavo ... toplo narandžasto) i jačina sjaja. Posebno za konobara i goste: senka ispod stopala i senke od lampi (jačina, dužina).
   Senke likova se pomeraju čim se lampa upali / ugasi / pomeri. Podaci: lampe u cookster.light-shadows.v1, likovi u cookster.table-items.v1. Izvezi / Uvezi JSON. */
(function(){
'use strict';
var T=window.CooksterTavern,C=window.CooksterTavernClean,LS=window.CooksterLampShadows,room=document.getElementById('tavernScene');
if(!T||!C||!LS||!room||window.CooksterLightTool||!T.tableItems)return;
var LSL=[['r','Domet svetla',100,900,10],['hh','Visina lampe (u visinama čoveka)',1.2,5,.05],['k','Jačina senke',0,2,.01],['warm','Toplina (−1 hladno, +1 toplo)',-1,1,.01],['gl','Jačina sjaja',0,1,.01],['gx','Gde pada svetlo — levo/desno',0,T.size.w,1],['gy','Gde pada svetlo — gore/dole',0,T.size.h,1]];
var KS=[['konobar','Konobar'],['gosti','Gosti']];
var PSL=[['sho','Meka senka ispod stopala',0,1.5,.01],['shw','Širina',.2,3,.01],['shh','Debljina',.05,1.2,.01],['shb','Mekoća ivice',0,20,1],['lm','Senka od lampi — jačina',0,2.5,.01],['ll','Senka od lampi — dužina',.3,2.5,.01]];
var PD={sho:T.tableItems.peoDef.sho,shw:1,shh:T.tableItems.peoDef.shh,shb:3,lm:1,ll:1};
var built=false,lamp=null,kind='konobar',ui={},dots={},dragId=null;
function data(){return T.tableItems.get()}
function pcur(){var d=data(),it=d.items&&d.items[kind],r=Object.assign({},PD);if(it&&it.def)for(var k in PD)if(it.def[k]!=null)r[k]=it.def[k];return r}
function pset(k,v){var d=data();if(!d.items)d.items={};var it=d.items[kind]||(d.items[kind]={def:{},seat:{}});if(!it.def)it.def={};if(!it.seat)it.seat={};it.def[k]=v;T.tableItems.set(d)}
function fmt(v,s){return(+v).toFixed(s<1?2:0)}
function sliders(list,pre){return list.map(function(s){return '<label class="sl">'+s[1]+' <b id="'+pre+'V_'+s[0]+'"></b><input type="range" id="'+pre+'S_'+s[0]+'" min="'+s[2]+'" max="'+s[3]+'" step="'+s[4]+'"></label>'}).join('')}
function refresh(){
  ensure();
  var L=LS.ids();if(!lamp&&L.length)lamp=L[0].id;
  ui.root.querySelectorAll('[data-lamp]').forEach(function(b){b.classList.toggle('on',b.dataset.lamp===lamp)});
  ui.root.querySelectorAll('[data-kind]').forEach(function(b){b.classList.toggle('on',b.dataset.kind===kind)});
  var c=LS.get(lamp);LSL.forEach(function(s){ui.root.querySelector('#lsS_'+s[0]).value=c[s[0]];ui.root.querySelector('#lsV_'+s[0]).textContent=fmt(c[s[0]],s[4])});
  ui.root.querySelector('#lsLit').textContent=LS.lit(lamp)?'💡 Upaljena (klik = ugasi)':'⚫ Ugašena (klik = upali)';
  var p=pcur();PSL.forEach(function(s){ui.root.querySelector('#psS_'+s[0]).value=p[s[0]];ui.root.querySelector('#psV_'+s[0]).textContent=fmt(p[s[0]],s[4])});
  placeDots();
}
function placeDots(){
  LS.ids().forEach(function(l){var c=LS.get(l.id),d=dots[l.id];if(!d)return;d.style.left=(c.gx/T.size.w*100)+'%';d.style.top=(c.gy/T.size.h*100)+'%';d.style.outline=l.id===lamp?'3px solid #fff':'none';d.style.opacity=LS.lit(l.id)?1:.45});
}
function ensure(){
  var L=LS.ids();if(built||!L.length)return;built=true;
  ui.root.querySelector('#lsLamps').innerHTML=L.map(function(l,i){return '<button class="b" data-lamp="'+l.id+'">'+(i+1)+' · '+l.label+'</button>'}).join('');
  ui.root.querySelectorAll('[data-lamp]').forEach(function(b){b.addEventListener('click',function(){lamp=b.dataset.lamp;refresh()})});
  LS.ids().forEach(function(l,i){var d=document.createElement('div');d.className='lsDot';d.setAttribute('data-tool-ui','');d.textContent=i+1;d.title=l.label;room.appendChild(d);dots[l.id]=d;
    d.addEventListener('pointerdown',function(e){e.stopPropagation();e.preventDefault();dragId=l.id;lamp=l.id;d.setPointerCapture(e.pointerId);refresh()});
    d.addEventListener('pointermove',function(e){if(dragId!==l.id)return;var r=room.getBoundingClientRect();LS.set(l.id,'gx',Math.max(0,Math.min(T.size.w,Math.round((e.clientX-r.left)/r.width*T.size.w))));LS.set(l.id,'gy',Math.max(0,Math.min(T.size.h,Math.round((e.clientY-r.top)/r.height*T.size.h))));refresh()});
    d.addEventListener('pointerup',function(){dragId=null});
    ['click','mousedown','contextmenu'].forEach(function(n){d.addEventListener(n,function(e){e.stopPropagation()})});
  });
}
function build(){
  var css=document.createElement('style');
  css.textContent='#lsBtn{position:absolute;left:640px;bottom:14px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 14px/1 system-ui,sans-serif;padding:7px 14px;cursor:pointer;opacity:.85}#lsBtn:hover{opacity:1}'+
  '#lsTool{position:fixed;top:0;right:0;bottom:0;width:310px;z-index:2147483200;display:none;overflow:auto;padding:12px 14px;background:rgba(32,20,9,.96);color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;border-left:1px solid #5b3d1e}#lsTool.open{display:block}'+
  '#lsTool h2{margin:0 0 6px;font-size:16px}#lsTool h3{margin:12px 0 4px;font-size:14px;color:#ffd98a}#lsTool .row{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}'+
  '#lsTool button.b{padding:6px 9px;border:1px solid #7a5428;border-radius:6px;background:#3a2410;color:#f3e3c2;cursor:pointer;font:inherit}#lsTool button.b.on{background:#a8651b}'+
  '#lsTool label.sl{display:block;margin:6px 0 1px;color:#d9c69c}#lsTool label.sl b{float:right;color:#f3e3c2}#lsTool label.sl input{width:100%}'+
  '#lsTool .help{margin:6px 0;padding:8px;border-radius:7px;background:#2c1b0c;color:#d9c69c}#lsTool textarea{width:100%;height:80px;background:#140d08;color:#f3e3c2;border:1px solid #7a5428;border-radius:6px}'+
  '.lsDot{position:absolute;z-index:65;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#ffd23f;border:2px solid #351b0d;box-shadow:0 0 12px #ffd23f;cursor:grab;display:none;touch-action:none;font:700 11px/18px system-ui;text-align:center;color:#351b0d}.lsOn .lsDot{display:block}';
  document.head.appendChild(css);
  var btn=document.createElement('button');btn.id='lsBtn';btn.setAttribute('data-tool-ui','');btn.type='button';btn.textContent='💡 svetlo i senke';room.appendChild(btn);
  ui.root=document.createElement('div');ui.root.id='lsTool';ui.root.setAttribute('data-tool-ui','');
  ui.root.innerHTML='<h2>Svetlo i senke</h2><div class="help">Izaberi lampu, upali/ugasi je, prevuci žutu tačku na sceni (tu svetlo pada na pod) i podesi klizače. Senke konobara i gostiju prate upaljene lampe, a toplina menja boju svetla i senke.</div>'+
    '<div class="row" id="lsLamps"></div>'+
    '<div class="row"><button class="b" id="lsLit" style="width:100%"></button></div>'+sliders(LSL,'ls')+
    '<div class="row"><button class="b" id="lsReset">Vrati početno za ovu lampu</button></div>'+
    '<h3>Senke likova</h3><div class="row">'+KS.map(function(k){return '<button class="b" data-kind="'+k[0]+'">'+k[1]+'</button>'}).join('')+'</div>'+sliders(PSL,'ps')+
    '<div class="row"><button class="b" id="psReset">Vrati početno za ovaj lik</button></div>'+
    '<div class="row"><button class="b" id="lsExport">Izvezi JSON</button><button class="b" id="lsImport">Uvezi JSON</button></div>'+
    '<div id="lsBox" style="display:none"><textarea id="lsText"></textarea><div class="row"><button class="b" id="lsDoImport">Primeni</button></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="b" id="lsClose" style="width:100%">Zatvori alat</button></div>';
  document.body.appendChild(ui.root);
  ui.root.querySelectorAll('[data-kind]').forEach(function(b){b.addEventListener('click',function(){kind=b.dataset.kind;refresh()})});
  LSL.forEach(function(s){ui.root.querySelector('#lsS_'+s[0]).addEventListener('input',function(e){LS.set(lamp,s[0],+e.target.value);refresh()})});
  PSL.forEach(function(s){ui.root.querySelector('#psS_'+s[0]).addEventListener('input',function(e){pset(s[0],+e.target.value);refresh()})});
  ui.root.querySelector('#lsLit').addEventListener('click',function(){LS.toggle(lamp);refresh()});
  ui.root.querySelector('#lsReset').addEventListener('click',function(){LS.reset(lamp);refresh()});
  ui.root.querySelector('#psReset').addEventListener('click',function(){var d=data();if(d.items&&d.items[kind]){delete d.items[kind];T.tableItems.set(d)}refresh()});
  ui.root.querySelector('#lsExport').addEventListener('click',function(){
    var d=data(),o={format:'cookster-light-shadow',exportedAt:new Date().toISOString(),lamps:LS.all(),items:{}};KS.forEach(function(k){if(d.items&&d.items[k[0]])o.items[k[0]]=d.items[k[0]]});
    var txt=JSON.stringify(o,null,1),ta=ui.root.querySelector('#lsText');ui.root.querySelector('#lsBox').style.display='block';ta.value=txt;ta.focus();ta.select();
    try{var bl=new Blob([txt],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='cookster_svetlo_senke.json';document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},500)}catch(e){}
  });
  ui.root.querySelector('#lsImport').addEventListener('click',function(){var b=ui.root.querySelector('#lsBox');b.style.display=b.style.display==='none'?'block':'none'});
  ui.root.querySelector('#lsDoImport').addEventListener('click',function(){try{var o=JSON.parse(ui.root.querySelector('#lsText').value);if(!o.lamps&&!o.items)throw 0;if(o.lamps)LS.setAll(o.lamps);if(o.items){var d=data();if(!d.items)d.items={};KS.forEach(function(k){if(o.items[k[0]])d.items[k[0]]=o.items[k[0]]});T.tableItems.set(d)}refresh()}catch(e){alert('Ne valja JSON.')}});
  ui.root.querySelector('#lsClose').addEventListener('click',close);
  ['keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','click','wheel','contextmenu'].forEach(function(n){ui.root.addEventListener(n,function(e){e.stopPropagation()})});
  btn.addEventListener('click',function(e){e.stopPropagation();open()});
}
function open(){ui.root.classList.add('open');room.classList.add('lsOn');refresh()}
function close(){ui.root.classList.remove('open');room.classList.remove('lsOn')}
build();
window.CooksterLightTool={open:open,close:close};
})();
