/* Signposts (putokazi): wooden arrow signs placed anywhere, in every view: the kitchen, the sink close-up, the grill close-up and the tavern.
   Tool "🪧 Putokazi": add as many signs as you want (kitchen, tavern, sink, grill), drag them, rotate them,
   tilt them front-back and left-right (perspective), resize, mirror. Every sign belongs to the view in which it was placed (the tool shows the signs of the view you are in).
   Position and width are percents of the picture of the view. Saved in this browser (cookster.signposts.v1);
   "Kopiraj sve (JSON)" gives the list that can be built into the game (SIGN_DEF). */
(function(){
'use strict';
if(window.CooksterSignposts)return;
var KEY='cookster.signposts.v1';
var TYPES={kuhinja:'Kuhinja →',kafana:'Kafana →',sudopera:'Sudopera →',rostilj:'Roštilj →',spajz:'Špajz →',basta:'Bašta ←',kafana_l:'Kafana ←',rostilj_l:'Roštilj ←'};   /* the arrow in the name: where the sign points */
var VIEWS={kitchen:'kuhinja',sink:'sudopera (krupan plan)',grill:'roštilj (krupan plan)',tavern:'kafana'};
var SIGN_DEF=[];
var signs=[],sel=null,open=false,uid=0;
try{var raw=JSON.parse(localStorage.getItem(KEY)||'null');signs=Array.isArray(raw)?raw:JSON.parse(JSON.stringify(SIGN_DEF));}catch(e){signs=JSON.parse(JSON.stringify(SIGN_DEF));}
signs=signs.filter(function(s){return s&&TYPES[s.type];});
signs.forEach(function(s){
  delete s._el;
  if(!s.view)s.view='kitchen';
  if(!s.u){s.u=1;if(s.view==='kitchen'){s.x=+(s.x/1672*100).toFixed(2);s.y=+(s.y/941*100).toFixed(2);s.w=+(s.w/1672*100).toFixed(2);}}   /* the first version stored pixels of the kitchen picture */
  s.id=s.id||('s'+(++uid));var n=+String(s.id).slice(1);if(n>uid)uid=n;
});
function save(){try{localStorage.setItem(KEY,JSON.stringify(signs,function(k,v){return k==='_el'?undefined:v;}));}catch(e){}}
function pic(t){return 'assets/signs/'+t+'.webp?v=2';}
var css=document.createElement('style');
css.textContent='.cookster-sign{position:absolute;pointer-events:none;transform-origin:50% 50%;-webkit-user-drag:none;user-select:none}'+
 '.cookster-sign img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none}'+
 'body.sign-tool .cookster-sign{pointer-events:auto;cursor:move}body.sign-tool .cookster-sign.sel{outline:2px dashed #42d6e8;outline-offset:2px}'+
 '.sign-host{position:absolute;pointer-events:none;z-index:4}'+
 '#signToolBtn2{position:fixed;right:12px;bottom:12px;z-index:2147483500;display:none;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:9px 12px;cursor:pointer}'+
 '#signTool{position:fixed;right:12px;top:60px;z-index:2147483600;width:280px;max-height:calc(100vh - 80px);overflow:auto;display:none;background:rgba(36,22,10,.94);border:2px solid #7a5428;border-radius:10px;color:#f3e3c2;font:13px/1.35 system-ui,sans-serif;padding:10px}#signTool.open{display:block}'+
 '#signTool button,#signTool select{border:1px solid #351b0d;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 12px/1 system-ui,sans-serif;padding:7px 9px;margin:2px 4px 2px 0;cursor:pointer}#signTool select{width:100%;font-weight:600}'+
 '#signTool label{display:block;margin:7px 0}#signTool input[type=range]{width:100%}#signTool label b{display:inline;margin-left:6px}#signTool small{display:block;color:#d9c69c;margin:5px 0}#signTool hr{border:0;border-top:1px solid #7a5428;margin:8px 0}';
document.head.appendChild(css);

/* the views: where the signs of a view live */
function activeView(){
  var t=document.getElementById('tavernScene');if(t&&t.classList.contains('is-active'))return 'tavern';
  if(document.getElementById('grillZoom'))return 'grill';
  var sz=document.getElementById('sinkZoom');if(sz&&getComputedStyle(sz).display!=='none')return 'sink';
  return 'kitchen';
}
var tavHost=null;
function hostFor(view){
  if(view==='kitchen')return document.getElementById('scene');
  if(view==='sink')return document.querySelector('#sinkZoom .sz-stage');
  if(view==='grill')return document.getElementById('grillZoom');
  if(view==='tavern'){
    var room=document.getElementById('tavernScene');if(!room)return null;
    if(!tavHost||tavHost.parentNode!==room){tavHost=document.createElement('div');tavHost.className='sign-host';room.appendChild(tavHost);}
    // the tavern picture is shown "contain": the layer is exactly as big as the picture
    var art=room.querySelector('.ps-art'),rw=room.clientWidth,rh=room.clientHeight,nw=art&&art.naturalWidth||16,nh=art&&art.naturalHeight||9,k=Math.min(rw/nw,rh/nh),w=nw*k,h=nh*k;
    tavHost.style.left=((rw-w)/2)+'px';tavHost.style.top=((rh-h)/2)+'px';tavHost.style.width=w+'px';tavHost.style.height=h+'px';
    return tavHost;
  }
  return null;
}
function apply(s){
  var el=s._el;if(!el)return;
  el.style.left=s.x+'%';el.style.top=s.y+'%';el.style.width=s.w+'%';
  el.style.zIndex=s.view==='kitchen'?(s.front?'9000':'3'):(s.front?'9000':'3');
  el.style.containerType='inline-size';
  var im=el.firstChild;if(im&&im.style)im.style.filter=s.sh>0?'drop-shadow('+(s.shx||0)+'cqw '+(s.shy==null?3:s.shy)+'cqw '+(s.shb==null?3:s.shb)+'cqw rgba(15,6,0,'+s.sh+'))':'none';
  el.style.transform='translate(-50%,-50%) perspective('+(s.p||900)+'px) rotateX('+(s.rx||0)+'deg) rotateY('+(s.ry||0)+'deg) rotateZ('+(s.rz||0)+'deg) scaleX('+(s.flip?-1:1)+')';
  el.classList.toggle('sel',s===sel);
}
function build(s,host){
  if(s._el)s._el.remove();
  var el=document.createElement('div');el.className='cookster-sign';el.dataset.signId=s.id;
  var im=document.createElement('img');im.alt='';im.draggable=false;im.src=pic(s.type);el.appendChild(im);
  ['click','dblclick','contextmenu','mousedown','mouseup'].forEach(function(n){el.addEventListener(n,function(e){if(open)e.stopPropagation();});});
  el.addEventListener('pointerdown',function(e){
    if(!open||e.button!==0)return;e.stopPropagation();e.preventDefault();select(s);
    var hr=el.parentNode.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,ox=s.x,oy=s.y;el.setPointerCapture(e.pointerId);
    function mv(ev){s.x=+(ox+(ev.clientX-sx)/hr.width*100).toFixed(2);s.y=+(oy+(ev.clientY-sy)/hr.height*100).toFixed(2);apply(s);}
    function up(){el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);save();}
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);
  });
  el.addEventListener('wheel',function(e){if(!open)return;e.preventDefault();e.stopPropagation();select(s);s.w=Math.max(2,Math.min(80,+(s.w*(e.deltaY<0?1.06:1/1.06)).toFixed(2)));apply(s);fillSliders();save();},{passive:false});
  host.appendChild(el);s._el=el;apply(s);
}
/* every 250 ms: signs go to the host of their view (the grill close-up is created again every time it opens) */
var curView='kitchen';
function sweep(){
  var v=activeView();
  signs.forEach(function(s){
    var h=hostFor(s.view);
    if(!h){if(s._el&&!s._el.isConnected)s._el=null;return;}
    if(!s._el||s._el.parentNode!==h)build(s,h);
  });
  if(v!==curView){curView=v;if(sel&&sel.view!==v)sel=null;if(btn2)btn2.style.display=v==='kitchen'?'none':'block';if(panel)refresh();}
}
function center(){
  var v=activeView();
  if(v!=='kitchen')return {x:50,y:50};
  var sc=(typeof scale==='number'&&scale)||1,ox=typeof offsetX==='number'?offsetX:0,oy=typeof offsetY==='number'?offsetY:0,cx=typeof cameraX==='number'?cameraX:0;
  return {x:+(((innerWidth/2-ox)/sc+cx)/1672*100).toFixed(2),y:+(((innerHeight/2-oy)/sc)/941*100).toFixed(2)};
}
function add(type,from){
  var v=activeView(),c=center(),s=from?JSON.parse(JSON.stringify(from)):{type:type,view:v,u:1,x:c.x,y:c.y,w:v==='kitchen'?13:14,rz:0,rx:0,ry:0,p:900,flip:0,front:1};
  delete s._el;s.id='s'+(++uid);if(from){s.x+=2;s.y+=3;}
  signs.push(s);var h=hostFor(s.view);if(h)build(s,h);select(s);save();return s;
}
function remove(s){if(!s)return;if(s._el)s._el.remove();signs=signs.filter(function(x){return x!==s;});if(sel===s)sel=null;save();refresh();}
function select(s){sel=s;signs.forEach(apply);refresh();}

/* the tool */
var panel,listEl,btn2=null;
function mine(){var v=activeView();return signs.filter(function(s){return s.view===v;});}
function label(s){var n=0,i,L=mine();for(i=0;i<L.length;i++){if(L[i].type===s.type)n++;if(L[i]===s)break;}return TYPES[s.type]+' #'+n;}
function refresh(){
  if(!panel)return;
  var L=mine();if(sel&&sel.view!==activeView())sel=null;if(!sel&&open)sel=L[L.length-1]||null;
  listEl.innerHTML='';L.forEach(function(s){var o=document.createElement('option');o.value=s.id;o.textContent=label(s);if(s===sel)o.selected=true;listEl.appendChild(o);});
  panel.querySelector('#sgView').textContent='Pogled: '+VIEWS[activeView()]+' (putokazi se postavljaju u ovom pogledu)';
  signs.forEach(apply);fillSliders();
}
function fillSliders(){
  var on=!!sel;panel.querySelector('#sgBox').style.display=on?'block':'none';if(!on)return;
  [['w','sgW',0],['rz','sgRz',0],['rx','sgRx',0],['ry','sgRy',0],['p','sgP',900]].forEach(function(r){var v=sel[r[0]]!=null?sel[r[0]]:r[2];panel.querySelector('#'+r[1]).value=v;panel.querySelector('#'+r[1]+'N').textContent=r[0]==='w'?(+v).toFixed(1)+'%':Math.round(v);});
  [['sh','sgSh',0],['shb','sgShb',3],['shx','sgShx',0],['shy','sgShy',3]].forEach(function(r){var v=sel[r[0]]!=null?sel[r[0]]:r[2];panel.querySelector('#'+r[1]).value=v;panel.querySelector('#'+r[1]+'N').textContent=(+v).toFixed(2).replace(/\.?0+$/,'')||'0';});
  panel.querySelector('#sgFlip').checked=!!sel.flip;panel.querySelector('#sgFront').checked=!!sel.front;
}
function setOpen(on){open=on;document.body.classList.toggle('sign-tool',on);panel.classList.toggle('open',on);if(!on){sel=null;}refresh();}
function tool(){
  var hud=document.getElementById('hud');if(document.getElementById('signTool'))return;
  var btn=document.createElement('button');btn.id='signToolBtn';btn.type='button';btn.textContent='🪧 Putokazi';btn.title='Postavi putokaze bilo gde';if(hud)hud.appendChild(btn);
  btn2=document.createElement('button');btn2.id='signToolBtn2';btn2.type='button';btn2.textContent='🪧 Putokazi';btn2.setAttribute('data-tool-ui','1');document.body.appendChild(btn2);
  panel=document.createElement('div');panel.id='signTool';panel.setAttribute('data-tool-ui','1');
  var add4=Object.keys(TYPES).map(function(t){return '<button data-add="'+t+'">+ '+TYPES[t]+'</button>';}).join('');
  panel.innerHTML='<b id="sgHead" title="Prevuci da pomeriš alat" style="font-size:15px;cursor:move;user-select:none">⠿ 🪧 Putokazi</b><button id="sgSide" title="Prebaci alat na drugu stranu ekrana" style="float:right">⇄</button><button id="sgClose" style="float:right">×</button>'+
   '<small id="sgView"></small><small>Dodaj koliko hoćeš. Prevuci putokaz da ga pomeriš; točak miša na njemu menja veličinu. Radi u kuhinji, sudoperi, na roštilju i u kafani.</small><div>'+add4+'</div><hr>'+
   '<label>Putokaz <select id="sgList"></select></label>'+
   '<div id="sgBox"><label>Veličina <input id="sgW" type="range" min="2" max="80" step="0.1"><b id="sgWN"></b></label>'+
   '<label>Rotacija (okreni u krug) <input id="sgRz" type="range" min="-180" max="180" step="1"><b id="sgRzN"></b></label>'+
   '<label>Nagib napred-nazad <input id="sgRx" type="range" min="-80" max="80" step="1"><b id="sgRxN"></b></label>'+
   '<label>Nagib levo-desno <input id="sgRy" type="range" min="-80" max="80" step="1"><b id="sgRyN"></b></label>'+
   '<label>Jačina perspektive (manje = jače) <input id="sgP" type="range" min="250" max="2500" step="10"><b id="sgPN"></b></label>'+
   '<label>Senka: jačina <input id="sgSh" type="range" min="0" max="1" step="0.02"><b id="sgShN"></b></label>'+
   '<label>Senka: razmazanost <input id="sgShb" type="range" min="0" max="15" step="0.2"><b id="sgShbN"></b></label>'+
   '<label>Senka: pomak levo-desno <input id="sgShx" type="range" min="-15" max="15" step="0.2"><b id="sgShxN"></b></label>'+
   '<label>Senka: pomak gore-dole <input id="sgShy" type="range" min="-15" max="15" step="0.2"><b id="sgShyN"></b></label>'+
   '<label><input id="sgFlip" type="checkbox"> Okreni strelicu na drugu stranu (ogledalo)</label>'+
   '<label><input id="sgFront" type="checkbox"> Ispred predmeta (inače je iza njih)</label>'+
   '<div><button id="sgDup">Duplikat</button><button id="sgDel">Obriši</button></div></div><hr>'+
   '<div><button id="sgCopy">Kopiraj sve (JSON)</button></div><div id="sgStatus" style="color:#d9c69c"></div>';
  document.body.appendChild(panel);listEl=panel.querySelector('#sgList');
  function toggle(){setOpen(!open);}
  btn.addEventListener('click',toggle);btn2.addEventListener('click',toggle);
  ['pointerdown','mousedown','click','wheel','contextmenu'].forEach(function(n){panel.addEventListener(n,function(e){e.stopPropagation();});btn2.addEventListener(n,function(e){e.stopPropagation();});});
  // the tool can be moved over the screen (by its title) or thrown to the other side (⇄), so it does not cover what is being placed
  var PK='cookster.signtool-pos.v1';
  function place(x,y){x=Math.max(0,Math.min(innerWidth-120,x));y=Math.max(0,Math.min(innerHeight-60,y));panel.style.left=x+'px';panel.style.top=y+'px';panel.style.right='auto';}
  try{var pp=JSON.parse(localStorage.getItem(PK)||'null');if(pp)place(pp.x,pp.y);}catch(e){}
  function savePos(){try{localStorage.setItem(PK,JSON.stringify({x:panel.offsetLeft,y:panel.offsetTop}));}catch(e){}}
  panel.querySelector('#sgHead').addEventListener('pointerdown',function(e){
    if(e.button!==0)return;e.preventDefault();var h=e.currentTarget,ox=e.clientX-panel.offsetLeft,oy=e.clientY-panel.offsetTop;h.setPointerCapture(e.pointerId);
    function mv(ev){place(ev.clientX-ox,ev.clientY-oy);}
    function up(){h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);savePos();}
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);
  });
  panel.querySelector('#sgSide').addEventListener('click',function(){place(panel.offsetLeft<innerWidth/2?innerWidth-panel.offsetWidth-12:12,panel.offsetTop);savePos();});
  panel.querySelector('#sgClose').addEventListener('click',function(){setOpen(false);});
  panel.querySelectorAll('[data-add]').forEach(function(b){b.addEventListener('click',function(){add(b.dataset.add);});});
  listEl.addEventListener('change',function(){var s=signs.find(function(x){return x.id===listEl.value;});if(s)select(s);});
  [['w','sgW'],['rz','sgRz'],['rx','sgRx'],['ry','sgRy'],['p','sgP']].forEach(function(r){panel.querySelector('#'+r[1]).addEventListener('input',function(e){if(!sel)return;sel[r[0]]=+e.target.value;panel.querySelector('#'+r[1]+'N').textContent=r[0]==='w'?(+e.target.value).toFixed(1)+'%':Math.round(+e.target.value);apply(sel);save();});});
  [['sh','sgSh'],['shb','sgShb'],['shx','sgShx'],['shy','sgShy']].forEach(function(r){panel.querySelector('#'+r[1]).addEventListener('input',function(e){if(!sel)return;sel[r[0]]=+e.target.value;panel.querySelector('#'+r[1]+'N').textContent=String(+e.target.value);apply(sel);save();});});
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
function init(){tool();sweep();setInterval(sweep,250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.CooksterSignposts={list:function(){return signs.map(function(s){var c=Object.assign({},s);delete c._el;return c;});},add:add,open:function(on){setOpen(on);},view:activeView};
})();
