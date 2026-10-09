/* Ashtrays ("piksle") of the tavern.
   - A pile of clean ashtrays lies on the bar. Click one: it is in your hand; click a table: it stands there (two places on every table). Click the bar: it goes on the pile.
   - Guests smoke: the ashtray of their table slowly fills (three pictures: empty, half, full). A table without an ashtray and a full ashtray make the guests ask for one (Zoki, daj pikslu!).
   - Change: take the dirty one from the table and put a clean one there (or the other way round); put the dirty ones on the bar, right click on the bar -> "Očisti pepeljare": they are empty again.
   The state is kept in localStorage (cookster.ashtrays.v1). Drawn by tavern-scene.js (drawTable / drawBar), clicks come from the room of the tavern. */
(function(){
var T=window.CooksterTavern,C=window.CooksterTavernClean;
if(!T||!C)return;
var KEY='cookster.ashtrays.v1',BASE='assets/tavern/ashtray/',NAMES=['prazna','srednja','puna'];
var IMG=NAMES.map(function(n){var im=new Image();im.src=BASE+n+'.webp?v=1';return im});
var ASHC=[{x:437,y:447},{x:886,y:660},{x:1377,y:503}];              // the middle of every table (where the old ashtray stood)
var SLOTS=ASHC.map(function(a){return[{x:a.x-58,y:a.y+8},{x:a.x+58,y:a.y-8}]});     // two places on every table
var BAR={x:800,y:226,rect:[735,190,880,258],max:8};               // the pile on the bar: where the lowest one stands, the place that can be clicked
var room=document.getElementById('tavernScene');

var items=[];
function load(){
  try{var a=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(a)&&a.length){items=a.filter(function(i){return i&&(i.loc==='bar'||i.loc==='table')&&isFinite(i.fill)});}}catch(e){}
  if(!items.length){
    for(var k=0;k<3;k++)items.push({id:k+1,loc:'bar',fill:0});
    for(var t=0;t<3;t++)items.push({id:4+t,loc:'table',t:t,s:0,fill:0});
  }
  items.forEach(function(i,k){if(!i.id)i.id=k+1});
}
var saveT=0;
function save(){clearTimeout(saveT);saveT=setTimeout(function(){try{localStorage.setItem(KEY,JSON.stringify(items.filter(function(i){return i.loc!=='hand'})))}catch(e){}},300)}
load();
var nextId=items.reduce(function(m,i){return Math.max(m,i.id)},0)+1;

function lvl(i){return i.fill<.34?0:i.fill<.72?1:2}
function sc(y){return T.scaleAt?T.scaleAt(y):.6}
function wAt(y){return 104*sc(y)}                                    // the width of an ashtray at height y
function drawOne(ctx,i,x,y,alpha){
  var im=IMG[lvl(i)];if(!im||!im.naturalWidth)return;
  var w=wAt(y),h=w*im.naturalHeight/im.naturalWidth;
  ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
  ctx.fillStyle='rgba(20,8,2,.28)';ctx.beginPath();ctx.ellipse(x+w*.04,y-h*.02,w*.5,h*.2,0,0,Math.PI*2);ctx.fill();      // a little shadow on the table
  ctx.drawImage(im,x-w/2,y-h*.9,w,h);ctx.restore();
}
function barItems(){return items.filter(function(i){return i.loc==='bar'})}
function tableItems(t){return items.filter(function(i){return i.loc==='table'&&i.t===t})}
function drawTable(ctx,t){tableItems(t).forEach(function(i){var s=SLOTS[t][i.s||0];drawOne(ctx,i,s.x,s.y)})}
function drawBar(ctx){barItems().forEach(function(i,k){drawOne(ctx,i,BAR.x+(k%2)*3,BAR.y-k*9)})}      // one over another

// ---- the ashtray in the hand
var hand=null,handEl=document.createElement('div');
handEl.style.cssText='position:fixed;left:0;top:0;z-index:70;pointer-events:none;display:none;will-change:transform';
handEl.innerHTML='<img alt="" draggable="false" style="display:block;width:100%;filter:drop-shadow(0 8px 6px rgba(0,0,0,.5))">';
if(room)room.appendChild(handEl);
function showHand(e){
  if(!hand){handEl.style.display='none';if(room)room.style.cursor='';return}
  var img=handEl.firstChild,im=IMG[lvl(hand)];img.src=im.src;
  var r=room.getBoundingClientRect(),w=wAt(480)*r.width/1672*1.15;
  handEl.style.width=w+'px';handEl.style.display='block';
  if(e)handEl.style.transform='translate('+(e.clientX-w/2)+'px,'+(e.clientY-w*.55)+'px)';
}
function pos(e){return C.toScene(e)}
function pip(poly,x,y){var inside=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside}return inside}
function inBar(p){var r=BAR.rect;return p.x>=r[0]&&p.x<=r[2]&&p.y>=r[1]&&p.y<=r[3]}
function tableAt(p){var q=T.tableQuads||[];for(var i=0;i<q.length;i++)if(pip(q[i],p.x,p.y))return i;return -1}
function putBack(){                                                  // right click / Esc: the ashtray goes where it came from (or on the bar)
  if(!hand)return;var h=hand;hand=null;
  if(h.from&&h.from.loc==='table'&&!tableItems(h.from.t).some(function(o){return(o.s||0)===h.from.s})){h.loc='table';h.t=h.from.t;h.s=h.from.s}
  else{h.loc='bar'}
  showHand();save();
}
function onDown(e){
  if(e.button!==0||!T.isOpen||(C.tool&&C.tool()==='sponge'))return;
  if(e.target.closest&&e.target.closest('button,.tc-menu'))return;
  var p=pos(e),k,take=null;
  if(hand){
    var t=tableAt(p);
    if(t>=0){
      var used=tableItems(t).map(function(o){return o.s||0}),free=[0,1].filter(function(s){return used.indexOf(s)<0});
      if(!free.length){C.msg('Na stolu već stoje dve pepeljare.');e.stopPropagation();e.preventDefault();return}
      var s=free.length===1?free[0]:(Math.hypot(p.x-SLOTS[t][0].x,p.y-SLOTS[t][0].y)<=Math.hypot(p.x-SLOTS[t][1].x,p.y-SLOTS[t][1].y)?0:1);
      hand.loc='table';hand.t=t;hand.s=s;hand.from=null;hand=null;showHand();save();
      e.stopPropagation();e.preventDefault();return;
    }
    if(inBar(p)){
      if(barItems().length>=BAR.max){C.msg('Na šanku nema mesta za još jednu pepeljaru.')}
      else{hand.loc='bar';hand.from=null;hand=null;showHand();save()}
      e.stopPropagation();e.preventDefault();return;
    }
    return;
  }
  if(inBar(p)){var b=barItems();if(b.length)take=b[b.length-1]}
  if(!take){
    for(k=0;k<items.length;k++){var i=items[k];if(i.loc!=='table')continue;var sl=SLOTS[i.t][i.s||0],w=wAt(sl.y);
      if(Math.abs(p.x-sl.x)<w*.55&&p.y>sl.y-w*.7&&p.y<sl.y+w*.25){take=i;break}}
  }
  if(take){
    take.from=take.loc==='table'?{loc:'table',t:take.t,s:take.s||0}:{loc:'bar'};
    take.loc='hand';hand=take;showHand(e);save();
    e.stopPropagation();e.preventDefault();
  }
}
function onMove(e){if(hand)showHand(e)}
if(room){
  room.addEventListener('pointerdown',onDown,true);
  window.addEventListener('pointermove',onMove,true);
  room.addEventListener('contextmenu',function(e){if(hand){e.preventDefault();e.stopImmediatePropagation();putBack()}},true);
  window.addEventListener('keydown',function(e){if(e.key==='Escape')putBack()});
}

// ---- right click on the bar: clean the dirty ashtrays that lie there
function cleanBar(){
  var dirty=barItems().filter(function(i){return i.fill>.05});
  dirty.forEach(function(i){
    setTimeout(function(){i.fill=Math.min(i.fill,.5)},350);
    setTimeout(function(){i.fill=0;save()},800);
  });
  C.msg(dirty.length?'Pepeljare se čiste...':'Na šanku nema prljavih pepeljara.');
}
T.menuHooks=T.menuHooks||[];
T.menuHooks.push(function(p,opts){
  if(!inBar(p))return;
  var any=barItems().some(function(i){return i.fill>.05});
  opts.push({ic:'🧼',t:'Očisti pepeljare',off:!any,fn:cleanBar});
});

// ---- the guests smoke and ask
var ASK=['Zoki, daj pikslu!','Zorane, zaboravio si pikslu!','Majstore, gde je piksla?','Daj pikslu, bre, kud ću sa pepelom?','Zoki, ima li piksle na ovom svetu?','Zorane, kako da pušim bez piksle?','Daj pikslu, ne dam pepeo na sto!','Piksla! Kraljevstvo za pikslu!','Zoki, donesi pikslu, gori mi među prstima!','Šta je ovo, kafana bez piksle?'];
var FULL=['Zoki, daj drugu pikslu!','Zorane, ova je puna do vrha!','Piksla se prelila, daj drugu!','Ovo više nije piksla nego planina!','Zoki, zameni pikslu, ne mogu da ugasim cigaretu.','Majstore, u piksli ima više opušaka nego ja zuba!','Daj čistu pikslu, ova je za muzej!','Zorane, ovu pikslu treba staviti pod zaštitu države.','Zameni pikslu, pre nego što se upali kafana!','Zoki, ovo je piksla ili deponija?'];
var THANKS=['Hvala, majstore, sad može!','Eto, to je to!','E, tako se radi!','Sad je red!','Bravo, Zoki, piksla k’o nova!'];
var FUNNY=['Dobra piksla, samo da ne kreće da puši sama.','Ova piksla je skupila više opušaka nego moj ujak prijatelja.','Piksla je kao kafana: što je duže ostaviš, to je punija.','Zorane, vidi pikslu, pravo malo smetlište!','Kad se piksla napuni, pitaj se ko puši više: ja ili peć.'];
var TS=[0,1,2].map(function(){return{noT:0,asked:false,fullT:0,askedFull:false,complained:false,funnyT:30+Math.random()*60,hadFull:false,hadNone:false}});
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function seatedAt(t){return(T.guestsList?T.guestsList():[]).filter(function(g){return g.mode==='seated'&&!g.leftAngry&&g.seat&&g.seat.table===t})}
function tick(dt){
  var changed=false;
  for(var t=0;t<3;t++){
    var gs=seatedAt(t),ts=TS[t],its=tableItems(t);
    if(!gs.length){ts.noT=0;ts.asked=false;ts.fullT=0;ts.askedFull=false;ts.complained=false;continue}
    // smoking: the least full ashtray of the table gets the ash
    var open=its.filter(function(i){return i.fill<1}).sort(function(a,b){return a.fill-b.fill});
    if(open.length){open[0].fill=Math.min(1,open[0].fill+gs.length*dt/260);changed=true}
    var g=pick(gs);
    if(!its.length){                                                 // no ashtray on the table
      ts.noT+=dt;ts.hadNone=true;
      if(!ts.asked&&ts.noT>10+(t*3)){ts.asked=true;T.say(g,pick(ASK),0)}
      else if(ts.asked&&!ts.complained&&ts.noT>75){ts.complained=true;T.say(g,'Nema piksle, nema ni velikog bakšiša!',-1)}
    }else{
      if(ts.hadNone){ts.hadNone=false;ts.noT=0;ts.asked=false;ts.complained=false;T.say(g,pick(THANKS),1)}
      var allFull=its.every(function(i){return i.fill>=.8});
      if(allFull){
        ts.fullT+=dt;ts.hadFull=true;
        if(!ts.askedFull&&ts.fullT>5){ts.askedFull=true;T.say(g,pick(FULL),0)}
        else if(ts.askedFull&&!ts.complained&&ts.fullT>85){ts.complained=true;T.say(g,'Ova piksla je gotova, a ja s njom!',-1)}
      }else if(ts.hadFull){ts.hadFull=false;ts.fullT=0;ts.askedFull=false;ts.complained=false;T.say(g,pick(THANKS),1)}
      ts.funnyT-=dt;
      if(ts.funnyT<=0){ts.funnyT=70+Math.random()*90;if(its.some(function(i){return i.fill>.3})&&Math.random()<.6)T.say(g,pick(FUNNY),0)}
    }
  }
  if(changed)save();
}
window.CooksterAshtrays={drawTable:drawTable,drawBar:drawBar,tick:tick,items:function(){return items},state:function(){return TS},reset:function(){try{localStorage.removeItem(KEY)}catch(e){}items.length=0;load()}};
})();
