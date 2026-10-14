/* Signposts (putokazi): wooden arrow signs placed anywhere in the scene.
   Tool "🪧 Putokazi": add as many signs as you want (kitchen, tavern, sink, grill), drag them, rotate them,
   tilt them front-back and left-right (perspective), resize, mirror. Saved in this browser (cookster.signposts.v1);
   "Kopiraj sve (JSON)" gives the list that can be built into the game (SIGN_DEF). */
(function(){
'use strict';
if(window.CooksterSignposts)return;
var KEY='cookster.signposts.v1';
var TYPES={kuhinja:'Kuhinja',kafana:'Kafana',sudopera:'Sudopera',rostilj:'Roštilj'};
var SIGN_DEF=[];
var signs=[],sel=null,open=false,uid=0;
try{var raw=JSON.parse(localStorage.getItem(KEY)||'null');signs=Array.isArray(raw)?raw:JSON.parse(JSON.stringify(SIGN_DEF));}catch(e){signs=JSON.parse(JSON.stringify(SIGN_DEF));}
signs=signs.filter(function(s){return s&&TYPES[s.type];});signs.forEach(function(s){delete s._el;});
signs.forEach(function(s){s.id=s.id||('s'+(++uid));var n=+String(s.id).slice(1);if(n>uid)uid=n;});
function save(){try{localStorage.setItem(KEY,JSON.stringify(signs,function(k,v){return k==='_el'?undefined:v;}));}catch(e){}}
function scn(){return document.getElementById('scene');}
function pic(t){return 'assets/signs/'+t+'.webp?v=1';}
var css=document.createElement('style');
css.textContent='.cookster-sign{position:absolute;pointer-events:none;transform-origin:50% 50%;-webkit-user-drag:none;user-select:none}'+
 '.cookster-sign img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}'+
 'body.sign-tool .cookster-sign{pointer-events:auto;cursor:move}body.sign-tool .cookster-sign.sel{outline:2px dashed #42d6e8;outline-offset:2px}'+
 '#signTool{position:fixed;right:12px;top:60px;z-index:21000;width:280px;max-height:calc(100vh - 80px);overflow:auto;display:none;background:rgba(36,22,10,.94);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px}#signTool.open{display:block}'+
 '#signTool button,#signTool select{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:2px 4px 2px 0;cursor:pointer}#signTool select{width:100%;font-weight:600}'+
 '#signTool label{display:block;margin:7px 0}#signTool input[type=range]{width:100%}#signTool label b{display:inline;margin-left:6px}#signTool small{display:block;color:#d9c69c;margin:5px 0}#signTool hr{border:0;border-top:1px solid #7a5428;margin:8px 0}';
document.head.appendChild(css);

function apply(s){
  var el=s._el;if(!el)return;
  el.style.left=s.x+'px';el.style.top=s.y+'px';el.style.width=s.w+'px';
  el.style.zIndex=s.front?'9000':'3';
  el.style.transform='translate(-50%,-50%) perspective('+(s.p||900)+'px) rotateX('+(s.rx||0)+'deg) rotateY('+(s.ry||0)+'deg) rotateZ('+(s.rz||0)+'deg) scaleX('+(s.flip?-1:1)+')';
  el.classList.toggle('sel',s===sel);
}
function build(s){
  var host=scn();if(!host)return;
  if(s._el)s._el.remove();
  var el=document.createElement('div');el.className='cookster-sign';el.dataset.signId=s.id;
  var im=document.createElement('img');im.alt='';im.draggable=false;im.src=pic(s.type);el.appendChild(im);
  el.addEventListener('pointerdown',function(e){
    if(!open||e.button!==0)return;e.stopPropagation();e.preventDefault();select(s);
    var sc=(typeof scale==='number'&&scale)||1,sx=e.clientX,sy=e.clientY,ox=s.x,oy=s.y;el.setPointerCapture(e.pointerId);
    function mv(ev){s.x=Math.round(ox+(ev.clientX-sx)/sc);s.y=Math.round(oy+(ev.clientY-sy)/sc);apply(s);}
    function up(){el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);save();}
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);
  });
  el.addEventListener('wheel',function(e){if(!open)return;e.preventDefault();e.stopPropagation();select(s);s.w=Math.max(40,Math.min(900,Math.round(s.w*(e.deltaY<0?1.06:1/1.06))));apply(s);fillSliders();save();},{passive:false});
  host.appendChild(el);s._el=el;apply(s);
}
function sceneCenter(){
  var sc=(typeof scale==='number'&&scale)||1,ox=typeof offsetX==='number'?offsetX:0,oy=typeof offsetY==='number'?offsetY:0,cx=typeof cameraX==='number'?cameraX:0;
  return {x:Math.round((innerWidth/2-ox)/sc+cx),y:Math.round((innerHeight/2-oy)/sc)};
}
function add(type,from){
  var c=sceneCenter(),s=from?JSON.parse(JSON.stringify(from)):{type:type,x:c.x,y:c.y,w:220,rz:0,rx:0,ry:0,p:900,flip:0,front:1};
  delete s._el;s.id='s'+(++uid);if(from){s.x+=30;s.y+=30;}
  signs.push(s);build(s);select(s);save();return s;
}
function remove(s){if(!s)return;if(s._el)s._el.remove();signs=signs.filter(function(x){return x!==s;});if(sel===s)sel=signs[signs.length-1]||null;save();refresh();}
function select(s){sel=s;signs.forEach(apply);refresh();}

/* the tool */
var panel,listEl,R={};
function label(s){var n=0,i;for(i=0;i<signs.length;i++){if(signs[i].type===s.type)n++;if(signs[i]===s)break;}return TYPES[s.type]+' #'+n;}
function refresh(){
  if(!panel)return;
  listEl.innerHTML='';signs.forEach(function(s){var o=document.createElement('option');o.value=s.id;o.textContent=label(s);if(s===sel)o.selected=true;listEl.appendChild(o);});
  fillSliders();
}
function fillSliders(){
  var on=!!sel;panel.querySelector('#sgBox').style.display=on?'block':'none';if(!on)return;
  [['w','sgW',0],['rz','sgRz',0],['rx','sgRx',0],['ry','sgRy',0],['p','sgP',900]].forEach(function(r){var v=sel[r[0]]!=null?sel[r[0]]:r[2];panel.querySelector('#'+r[1]).value=v;panel.querySelector('#'+r[1]+'N').textContent=Math.round(v);});
  panel.querySelector('#sgFlip').checked=!!sel.flip;panel.querySelector('#sgFront').checked=!!sel.front;
}
function setOpen(on){open=on;document.body.classList.toggle('sign-tool',on);panel.classList.toggle('open',on);if(!on)sel=null,signs.forEach(apply);else if(!sel)sel=signs[signs.length-1]||null;signs.forEach(apply);refresh();}
function tool(){
  var hud=document.getElementById('hud');if(!hud||document.getElementById('signToolBtn'))return;
  var btn=document.createElement('button');btn.id='signToolBtn';btn.type='button';btn.textContent='🪧 Putokazi';btn.title='Postavi putokaze bilo gde u sceni';hud.appendChild(btn);
  panel=document.createElement('div');panel.id='signTool';panel.setAttribute('data-tool-ui','1');
  var add4=Object.keys(TYPES).map(function(t){return '<button data-add="'+t+'">+ '+TYPES[t]+'</button>';}).join('');
  panel.innerHTML='<b style="font-size:15px">🪧 Putokazi</b><button id="sgClose" style="float:right">×</button>'+
   '<small>Dodaj koliko hoćeš. Prevuci putokaz u sceni da ga pomeriš; točak miša na njemu menja veličinu.</small><div>'+add4+'</div><hr>'+
   '<label>Putokaz <select id="sgList"></select></label>'+
   '<div id="sgBox"><label>Veličina <input id="sgW" type="range" min="40" max="900" step="1"><b id="sgWN"></b></label>'+
   '<label>Rotacija (okreni u krug) <input id="sgRz" type="range" min="-180" max="180" step="1"><b id="sgRzN"></b></label>'+
   '<label>Nagib napred-nazad <input id="sgRx" type="range" min="-80" max="80" step="1"><b id="sgRxN"></b></label>'+
   '<label>Nagib levo-desno <input id="sgRy" type="range" min="-80" max="80" step="1"><b id="sgRyN"></b></label>'+
   '<label>Jačina perspektive (manje = jače) <input id="sgP" type="range" min="250" max="2500" step="10"><b id="sgPN"></b></label>'+
   '<label><input id="sgFlip" type="checkbox"> Okreni strelicu na drugu stranu (ogledalo)</label>'+
   '<label><input id="sgFront" type="checkbox"> Ispred predmeta (inače je iza njih)</label>'+
   '<div><button id="sgDup">Duplikat</button><button id="sgDel">Obriši</button></div></div><hr>'+
   '<div><button id="sgCopy">Kopiraj sve (JSON)</button></div><div id="sgStatus" style="color:#d9c69c"></div>';
  document.body.appendChild(panel);listEl=panel.querySelector('#sgList');
  btn.addEventListener('click',function(){setOpen(!open);});
  panel.querySelector('#sgClose').addEventListener('click',function(){setOpen(false);});
  panel.querySelectorAll('[data-add]').forEach(function(b){b.addEventListener('click',function(){add(b.dataset.add);});});
  listEl.addEventListener('change',function(){var s=signs.find(function(x){return x.id===listEl.value;});if(s)select(s);});
  [['w','sgW'],['rz','sgRz'],['rx','sgRx'],['ry','sgRy'],['p','sgP']].forEach(function(r){panel.querySelector('#'+r[1]).addEventListener('input',function(e){if(!sel)return;sel[r[0]]=+e.target.value;panel.querySelector('#'+r[1]+'N').textContent=Math.round(+e.target.value);apply(sel);save();});});
  panel.querySelector('#sgFlip').addEventListener('change',function(e){if(sel){sel.flip=e.target.checked?1:0;apply(sel);save();}});
  panel.querySelector('#sgFront').addEventListener('change',function(e){if(sel){sel.front=e.target.checked?1:0;apply(sel);save();}});
  panel.querySelector('#sgDup').addEventListener('click',function(){if(sel)add(sel.type,sel);});
  panel.querySelector('#sgDel').addEventListener('click',function(){remove(sel);});
  panel.querySelector('#sgCopy').addEventListener('click',function(){
    var t=JSON.stringify(signs.map(function(s){var c=Object.assign({},s);delete c._el;return c;}),null,2),st=panel.querySelector('#sgStatus');
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(function(){st.textContent='JSON je kopiran: nalepi ga ovde u chat.';},function(){st.textContent='Ne mogu da kopiram.';});else st.textContent='Kopiranje nije dostupno u ovom pregledaču.';
  });
  refresh();
}
function init(){signs.forEach(build);tool();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.CooksterSignposts={list:function(){return signs.map(function(s){var c=Object.assign({},s);delete c._el;return c;});},add:add,open:setOpen};
})();
