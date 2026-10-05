/* Cookster - the tavern ("kafana"): a separate scene, reached from the kitchen with the button on the left edge (the camera turns
   to the left, like it turns to the right for the pantry).
   Guests come in through the door, walk to a free chair, sit, and after a while get up and leave. They are pictures
   (assets/tavern/guests/gNN_<pose>.webp, 10 characters x 5 poses) drawn on a canvas over the picture of the hall.
   Walking is "faked" with a bob and a sway, and the left-right step is made by flipping the picture. */
(function(){
'use strict';
var ROOM='assets/tavern/kafana.webp',GUESTS='assets/tavern/guests/';
var W=1672,H=941;                                   // the picture of the hall
var DUR=700,CHARS=10,POSES=['dole','dole2','gore','gore2','bok','sedi_lice','sedi_ledja','sedi_ledja_l'];
var viewport=document.getElementById('viewport'),scene=document.getElementById('scene');
if(!viewport||!scene||window.CooksterTavern)return;

var state='kitchen',busy=false,loaded=false,loading=null,lastFocus=null,saved=null,animations=[];
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}
function navBtn(label,dir){
  var b=mk('button','pantry-nav');b.type='button';
  var t=mk('span');t.textContent=label;
  var a=mk('span','pn-arrow '+(dir==='r'?'r':'l'));a.setAttribute('aria-hidden','true');
  a.textContent=dir==='r'?'→':'←';
  if(dir==='r'){b.appendChild(t);b.appendChild(a)}else{b.appendChild(a);b.appendChild(t)}
  return b;
}

// the button in the kitchen, on the left edge
var openBtn=navBtn('kafana','l');openBtn.id='tavernOpenBtn';
openBtn.style.left='14px';openBtn.style.top='530px';
openBtn.setAttribute('aria-label','Kafana, levo');
scene.appendChild(openBtn);

// the tavern: backdrop, the picture, the canvas with the guests, the way back
var room=mk('div');room.id='tavernScene';
room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','Kafana');room.setAttribute('aria-hidden','true');
var backdrop=mk('div','ps-backdrop');
var art=mk('img','ps-art');art.alt='Kafana';art.draggable=false;
var cv=mk('canvas','ts-guests');
var backBtn=navBtn('Kuhinja','r');backBtn.setAttribute('aria-label','Kuhinja, nazad desno');
var addBtn=mk('button','ts-add');addBtn.type='button';addBtn.textContent='+ gost';addBtn.title='Dovedi gosta (za probu)';
room.appendChild(backdrop);room.appendChild(art);room.appendChild(cv);room.appendChild(backBtn);room.appendChild(addBtn);
document.body.appendChild(room);

var status=mk('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
openBtn.appendChild(status);
function say(msg){openBtn.title=msg||'';status.textContent=msg||'';if(msg)openBtn.setAttribute('data-blocked','1');else openBtn.removeAttribute('data-blocked')}

['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','contextmenu','touchstart','touchmove','touchend','touchcancel','wheel'].forEach(function(n){
  room.addEventListener(n,function(e){e.stopPropagation()},{passive:true});
  openBtn.addEventListener(n,function(e){e.stopPropagation()},{passive:true});
});

// ---------- pictures ----------
var imgs={};                                        // 'g01_dole' -> Image
function loadImg(src){return new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=src})}
function preload(){
  if(loaded)return Promise.resolve(true);
  if(loading)return loading;
  var jobs=[];
  for(var c=1;c<=CHARS;c++)POSES.forEach(function(p){
    var key='g'+(c<10?'0':'')+c+'_'+p;
    jobs.push(loadImg(GUESTS+key+'.webp').then(function(im){imgs[key]=im}));
  });
  ['w_dole','w_dole2','w_gore','w_gore2','w_bok1','w_bok2','w_bok3','w_bokl1','w_bokl2','w_bokl3'].forEach(function(k){
    jobs.push(loadImg(GUESTS+k+'.webp').then(function(im){imgs[k]=im}));
  });
  var roomJob=loadImg(ROOM).then(function(im){if(im){art.src=ROOM;backdrop.style.backgroundImage='url("'+ROOM+'")'}return !!im});
  loading=Promise.all([roomJob].concat(jobs)).then(function(r){loaded=!!r[0];loading=null;return loaded});
  return loading;
}

// ---------- the hall: tables, chairs, floor ----------
// every table: the centre, and the outline of its cloth (with the bottle and candles). The outline is the MASK of the table:
// guests behind the table are hidden by it, and nobody walks over it.
var TABLES=[{"x":530,"y":275,"poly":[[437,267],[440,263],[441,262],[508,197],[552,197],[619,259],[623,268],[535,337],[529,341],[524,339],[518,336],[439,273],[437,270]]},{"x":840,"y":280,"poly":[[744,271],[748,263],[750,260],[818,194],[862,194],[925,261],[927,264],[928,266],[844,343],[834,341],[831,339],[745,273]]},{"x":1145,"y":280,"poly":[[1051,267],[1057,259],[1123,202],[1167,202],[1230,260],[1232,262],[1232,267],[1151,340],[1141,342],[1051,269]]},{"x":385,"y":470,"poly":[[288,466],[292,458],[363,387],[407,387],[481,453],[484,459],[485,463],[392,558],[390,559],[381,558],[377,556],[289,471]]},{"x":700,"y":470,"poly":[[606,468],[608,462],[612,457],[678,389],[722,389],[793,453],[799,465],[799,466],[709,561],[699,560],[608,470]]},{"x":1000,"y":470,"poly":[[902,470],[908,457],[911,454],[978,392],[1022,392],[1089,457],[1091,459],[1099,471],[1006,560],[996,559],[992,556]]},{"x":1305,"y":465,"poly":[[1206,471],[1210,459],[1283,390],[1327,390],[1389,449],[1395,455],[1409,473],[1315,561],[1305,559],[1301,556]]},{"x":525,"y":700,"poly":[[423,676],[503,599],[547,599],[624,668],[628,674],[628,678],[530,766],[518,766],[424,685],[423,683]]},{"x":865,"y":700,"poly":[[759,679],[765,671],[843,598],[887,598],[966,659],[968,672],[968,674],[874,766],[862,768],[759,682]]},{"x":1195,"y":690,"poly":[[1090,680],[1093,674],[1173,599],[1217,599],[1298,670],[1299,671],[1302,676],[1207,781],[1195,780]]}];
var SEAT_OFF=[{dx:-57,dy:-60,k:'back'},{dx:60,dy:-58,k:'back'},{dx:-62,dy:60,k:'front'},{dx:60,dy:60,k:'front'}];
var SEATS=[];
function grow(poly,cx,cy,f){return poly.map(function(p){return[cx+(p[0]-cx)*f,cy+(p[1]-cy)*f]})}
TABLES.forEach(function(t,ti){
  // where nobody may walk: the cloth and the chairs around it, with a margin
  var pts=t.poly.slice();
  SEAT_OFF.forEach(function(o){pts.push([t.x+o.dx*1.45,t.y+o.dy*1.2],[t.x+o.dx*1.45+26,t.y+o.dy*1.2],[t.x+o.dx*1.45-26,t.y+o.dy*1.2])});
  t.block=hullPts(pts);
  SEAT_OFF.forEach(function(o,oi){
    var s={id:ti*4+oi,table:ti,k:o.k,x:t.x+o.dx,y:t.y+o.dy,taken:false};
    // the place right beside the chair where the guest stands before he sits
    var l=Math.hypot(o.dx,o.dy)||1;
    s.ax=s.x+o.dx/l*58;s.ay=s.y+o.dy/l*50;
    SEATS.push(s);
  });
});
function hullPts(p){
  p=p.slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});
  function cr(o,a,b){return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])}
  var lo=[],up=[],i;
  for(i=0;i<p.length;i++){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p[i])<=0)lo.pop();lo.push(p[i])}
  for(i=p.length-1;i>=0;i--){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p[i])<=0)up.pop();up.push(p[i])}
  lo.pop();up.pop();return lo.concat(up);
}
var DOOR={x:808,y:222};
var FLOOR=[[215,215],[1325,215],[1305,455],[1480,560],[1585,600],[1590,830],[430,838],[110,720],[150,560],[185,330]];
var BLOCKS=[{x0:185,y0:180,x1:460,y1:300},{x0:150,y0:250,x1:260,y1:400}];   // the stove and the bench
function pip(poly,x,y){var ins=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ins=!ins}return ins}
// walkable grid for the paths
var CELL=22,GW=Math.ceil(W/CELL),GH=Math.ceil(H/CELL),GRID=null;
// ---------- calibration: what the user drew in the tool "Kalibracija kafane" (or the defaults made from the picture) ----------
//   floor      polygons: where guests may walk
//   blocked    polygons: tables and edges that guests may not cross
//   tableMask  polygons: parts of the tables that cover a guest walking behind them
//   chairMask  {"seatId": [polygons]}: the part of a chair that covers the guest sitting on it
var CAL_KEY='cookster.tavern-calibration.v1',CAL_FILE='assets/tavern/calibration.json';
function clonePoly(p){return p.map(function(q){return[q[0],q[1]]})}
function defaultCal(){
  var cal={version:1,floor:[clonePoly(FLOOR)],blocked:[],tableMask:[],chairMask:{}};
  BLOCKS.forEach(function(b){cal.blocked.push([[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]])});
  TABLES.forEach(function(t){cal.blocked.push(clonePoly(t.block));cal.tableMask.push(clonePoly(t.poly))});
  return cal;
}
function okPolys(a){return Array.isArray(a)&&a.every(function(p){return Array.isArray(p)&&p.every(function(q){return Array.isArray(q)&&isFinite(q[0])&&isFinite(q[1])})})}
function readCal(){
  var found=null;
  try{var raw=localStorage.getItem(CAL_KEY);if(raw)found=JSON.parse(raw)}catch(_){}
  if(!found){try{var x=new XMLHttpRequest();x.open('GET',CAL_FILE,false);x.send(null);if(x.status>=200&&x.status<300)found=JSON.parse(x.responseText)}catch(_){}}
  var d=defaultCal();
  if(!found||typeof found!=='object')return d;
  var cal={version:1,floor:okPolys(found.floor)?found.floor:d.floor,blocked:okPolys(found.blocked)?found.blocked:d.blocked,
    tableMask:okPolys(found.tableMask)?found.tableMask:d.tableMask,chairMask:{}};
  if(found.chairMask&&typeof found.chairMask==='object')Object.keys(found.chairMask).forEach(function(k){if(okPolys(found.chairMask[k]))cal.chairMask[k]=found.chairMask[k]});
  return cal;
}
var CAL=null,MASKS=[];
function applyCal(cal){
  CAL=cal||readCal();
  MASKS=CAL.tableMask.filter(function(p){return p.length>=3}).map(function(p){
    var by=-1e9;p.forEach(function(q){by=Math.max(by,q[1])});return{poly:p,y:by-4};
  });
  GRID=null;
}
function walkable(x,y){
  var ok=false,i;
  for(i=0;i<CAL.floor.length;i++)if(CAL.floor[i].length>=3&&pip(CAL.floor[i],x,y)){ok=true;break}
  if(!ok)return false;
  for(i=0;i<CAL.blocked.length;i++)if(CAL.blocked[i].length>=3&&pip(CAL.blocked[i],x,y))return false;
  return true;
}
function buildGrid(){GRID=new Uint8Array(GW*GH);for(var j=0;j<GH;j++)for(var i=0;i<GW;i++)GRID[j*GW+i]=walkable(i*CELL+CELL/2,j*CELL+CELL/2)?1:0}
function nearestFree(x,y){
  var ci=Math.max(0,Math.min(GW-1,Math.floor(x/CELL))),cj=Math.max(0,Math.min(GH-1,Math.floor(y/CELL)));
  if(GRID[cj*GW+ci])return[ci,cj];
  for(var r=1;r<20;r++)for(var dj=-r;dj<=r;dj++)for(var di=-r;di<=r;di++){
    if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;
    var i=ci+di,j=cj+dj;if(i>=0&&j>=0&&i<GW&&j<GH&&GRID[j*GW+i])return[i,j];
  }
  return[ci,cj];
}
function lineFree(a,b){
  var n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10);
  for(var i=0;i<=n;i++){var x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(!walkable(x,y))return false}
  return true;
}
function findPath(from,to){                          // A* on the grid, then straightened
  if(!GRID)buildGrid();
  var s=nearestFree(from.x,from.y),g=nearestFree(to.x,to.y);
  var open=[[s[0],s[1]]],came={},cost={},key=function(i,j){return j*GW+i};
  cost[key(s[0],s[1])]=0;var closed={};
  var h=function(i,j){return Math.hypot(i-g[0],j-g[1])};
  var found=false,guard=0;
  while(open.length&&guard++<8000){
    var bi=0,bf=1e9;
    for(var k=0;k<open.length;k++){var f=cost[key(open[k][0],open[k][1])]+h(open[k][0],open[k][1]);if(f<bf){bf=f;bi=k}}
    var cur=open.splice(bi,1)[0],ck=key(cur[0],cur[1]);
    if(closed[ck])continue;closed[ck]=1;
    if(cur[0]===g[0]&&cur[1]===g[1]){found=true;break}
    for(var dj=-1;dj<=1;dj++)for(var di=-1;di<=1;di++){
      if(!di&&!dj)continue;
      var ni=cur[0]+di,nj=cur[1]+dj;
      if(ni<0||nj<0||ni>=GW||nj>=GH||!GRID[nj*GW+ni])continue;
      if(di&&dj&&(!GRID[cur[1]*GW+ni]||!GRID[nj*GW+cur[0]]))continue;
      var nk=key(ni,nj),nc=cost[ck]+(di&&dj?1.414:1);
      if(cost[nk]===undefined||nc<cost[nk]){cost[nk]=nc;came[nk]=ck;open.push([ni,nj])}
    }
  }
  var pts=[];
  if(found){var k2=key(g[0],g[1]);while(k2!==undefined){pts.push({x:(k2%GW)*CELL+CELL/2,y:Math.floor(k2/GW)*CELL+CELL/2});k2=came[k2]}pts.reverse()}
  pts.unshift({x:from.x,y:from.y});pts.push({x:to.x,y:to.y});
  var out=[pts[0]],i=0;                              // skip the points that can be passed by in a straight line
  while(i<pts.length-1){var j=pts.length-1;while(j>i+1&&!lineFree(pts[i],pts[j]))j--;out.push(pts[j]);i=j}
  return out;
}

applyCal();
// ---------- guests ----------
var guests=[],nextArrival=2,clock=0,UID=0;
var SCALE0=.31,SCALE_K=.00012,SIT_K=.78;                      // size of a picture at height y of the hall
function scaleAt(y){return SCALE0+SCALE_K*y}
function pickSeat(){
  var free=SEATS.filter(function(s){return !s.taken});
  if(!free.length)return null;
  // fill the tables that already have guests first, as real guests do
  var busy=free.filter(function(s){return SEATS.some(function(o){return o.taken&&o.table===s.table})});
  var from=(busy.length&&Math.random()<.6)?busy:free;
  return from[Math.floor(Math.random()*from.length)];
}
function spawn(){
  var seat=pickSeat();if(!seat)return null;
  seat.taken=true;
  // a character that is not in the hall yet, if there is one
  var used={};guests.forEach(function(o){used[o.ch]=1});
  var pool=[];for(var c=1;c<=CHARS;c++)if(!used[c])pool.push(c);
  var ch=pool.length?pool[Math.floor(Math.random()*pool.length)]:1+Math.floor(Math.random()*CHARS);
  var g={id:++UID,ch:ch,seat:seat,x:DOOR.x+(Math.random()*30-15),y:DOOR.y,
    mode:'in',path:findPath(DOOR,{x:seat.ax,y:seat.ay}),pi:1,phase:Math.random()*2,face:'dole',flip:false,
    sitT:0,sitFor:30+Math.random()*40,fade:0,from:null,speed:78+Math.random()*16,mood:'ok'};
  guests.push(g);return g;
}
// the waiter: walks about the hall from table to table (later he will carry what was ordered)
var waiter=null;
function waiterGoal(){
  var s=SEATS[Math.floor(Math.random()*SEATS.length)];
  return{x:s.ax+(Math.random()*30-15),y:s.ay+(Math.random()*20-10)};
}
function waiterNew(){
  waiter={x:DOOR.x+10,y:DOOR.y+30,path:null,pi:1,wait:0,phase:0,face:'dole',dir:1,speed:92};
  waiter.path=findPath(waiter,waiterGoal());
}
function waiterStep(dt){
  var w=waiter;if(!w)return;
  if(w.wait>0){w.wait-=dt;return}
  var tgt=w.path&&w.path[w.pi];
  if(!tgt){
    w.wait=1+Math.random()*3;w.path=findPath({x:w.x,y:w.y},waiterGoal());w.pi=1;return;
  }
  var dx=tgt.x-w.x,dy=tgt.y-w.y,d=Math.hypot(dx,dy),sp=w.speed*scaleAt(w.y)/.34*dt;
  if(d<=sp){w.x=tgt.x;w.y=tgt.y;w.pi++}
  else{w.x+=dx/d*sp;w.y+=dy/d*sp;
    var vert=Math.abs(dy)>Math.abs(dx)*(w.face==='bok'?1.5:.7);
    w.face=vert?(dy>0?'dole':'gore'):'bok';
    if(w.face==='bok')w.dir=dx<0?-1:1;
  }
  w.phase+=sp/(46*scaleAt(w.y)/.34);
}
function waiterKey(w){
  if(w.wait>0)return w.face==='bok'?(w.dir<0?'w_bokl2':'w_bok2'):(w.face==='gore'?'w_gore':'w_dole');
  var n=Math.floor(w.phase);
  if(w.face==='bok')return (w.dir<0?'w_bokl':'w_bok')+(n%3+1);
  return 'w_'+w.face+(n%2?'2':'');
}
function drawWaiter(ctx){
  var w=waiter;if(!w)return;
  var sc=scaleAt(w.y),moving=w.wait<=0;
  drawShadow(ctx,w.x,w.y,sc);
  var bob=moving?Math.abs(Math.sin(w.phase*Math.PI))*2.4*sc/.3:0;
  drawSprite(ctx,waiterKey(w),w.x,w.y-bob,sc,false,0,1);
}
function chKey(g,pose){return 'g'+(g.ch<10?'0':'')+g.ch+'_'+pose}
function step(dt){
  clock+=dt;
  if(!waiter)waiterNew();
  waiterStep(dt);
  if(clock>=nextArrival){nextArrival=clock+7+Math.random()*9;if(guests.length<14)spawn()}
  for(var i=guests.length-1;i>=0;i--){
    var g=guests[i];
    if(g.mode==='in'||g.mode==='out'){
      var tgt=g.path[g.pi];
      if(!tgt){
        if(g.mode==='in'){g.mode='sitting';g.from={x:g.x,y:g.y,face:g.face};g.fade=0;g.sitT=0}
        else{guests.splice(i,1);g.seat.taken=false;continue}
      }else{
        var dx=tgt.x-g.x,dy=tgt.y-g.y,d=Math.hypot(dx,dy),sp=g.speed*scaleAt(g.y)/.34*dt;
        if(d<=sp){g.x=tgt.x;g.y=tgt.y;g.pi++}
        else{g.x+=dx/d*sp;g.y+=dy/d*sp;
          var vert=Math.abs(dy)>Math.abs(dx)*(g.face==='bok'?1.5:.7);
          g.face=vert?(dy>0?'dole':'gore'):'bok';
          if(g.face==='bok')g.flip=dx<0;
        }
        g.phase+=sp/(40*scaleAt(g.y)/.34);
      }
    }else if(g.mode==='sitting'){
      // he steps from the place beside the table onto the chair
      g.fade=Math.min(1,g.fade+dt/.55);
      if(g.fade>=1){g.mode='seated';g.sitT=0}
    }else if(g.mode==='seated'){
      g.sitT+=dt;
      if(g.sitT>g.sitFor){g.mode='rising';g.fade=0}
    }else if(g.mode==='rising'){
      g.fade=Math.min(1,g.fade+dt/.55);
      if(g.fade>=1){g.x=g.seat.ax;g.y=g.seat.ay;g.mode='out';g.path=findPath({x:g.x,y:g.y},DOOR);g.pi=1}
    }
  }
}
function seatPos(g){return{x:g.seat.x,y:g.seat.y+(g.seat.k==='back'?32:14)}}
// the chairs on the right side of a table: the guest looks to the left, towards the others
function sitPose(g){return g.seat.k==='back'?'sedi_lice':(g.seat.id%4===3?'sedi_ledja_l':'sedi_ledja')}
function drawSprite(ctx,key,x,y,sc,flip,rot,alpha){
  var im=imgs[key];if(!im)return;
  var w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.translate(x,y);if(rot)ctx.rotate(rot);if(flip)ctx.scale(-1,1);
  ctx.drawImage(im,-w/2,-h,w,h);
  ctx.restore();
}
function drawShadow(ctx,x,y,sc){
  ctx.save();ctx.fillStyle='rgba(20,8,2,.32)';ctx.beginPath();ctx.ellipse(x,y+2,34*sc/.3,9*sc/.3,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function guestSortY(g){return(g.mode==='seated'||g.mode==='sitting'||g.mode==='rising')?seatPos(g).y:g.y}
function drawGuest(ctx,g){
  drawGuestBody(ctx,g);
  if(g.mode==='seated'||g.mode==='sitting'||g.mode==='rising'){
    var cm=CAL.chairMask[g.seat.id];
    if(cm)cm.forEach(function(p){drawPolyFromPicture(ctx,p)});
  }
}
function drawGuestBody(ctx,g){
  var walk=(g.mode==='in'||g.mode==='out');
  if(walk){
    var sc=scaleAt(g.y),ph=Math.abs(Math.sin(g.phase*Math.PI)),bob=ph*3.2*sc/.3;
    drawShadow(ctx,g.x,g.y,sc);
    // the two pictures of a step: the left leg and the right arm forward, then the right leg and the left arm forward
    var pose=g.face;
    if(g.face==='dole'||g.face==='gore')pose=(Math.floor(g.phase)%2===0)?g.face:g.face+'2';
    drawSprite(ctx,chKey(g,pose),g.x,g.y-bob,sc,g.face==='bok'&&g.flip,Math.sin(g.phase*Math.PI)*(g.face==='bok'?.03:.012),1);
  }else{
    var sp=seatPos(g),ssc=scaleAt(sp.y)*SIT_K;
    if(g.mode==='sitting'||g.mode==='rising'){
      var t=g.mode==='sitting'?g.fade:1-g.fade,e=t*t*(3-2*t);
      var fx=g.seat.ax+(sp.x-g.seat.ax)*e,fy=g.seat.ay+(sp.y-g.seat.ay)*e;
      drawSprite(ctx,chKey(g,g.from?g.from.face:'dole'),fx,fy,scaleAt(fy),g.from&&g.from.face==='bok'&&g.flip,0,1-e);
      drawSprite(ctx,chKey(g,sitPose(g)),fx,fy,ssc,false,0,e);
    }else{
      // seated: a slow breath, now and then a nod
      var br=Math.sin((clock+g.id*1.7)*1.6)*.6;
      drawSprite(ctx,chKey(g,sitPose(g)),sp.x,sp.y+br,ssc,false,Math.sin((clock+g.id)*.5)*.006,1);
    }
  }
}
// a part of the picture of the hall (a table, a chair) is drawn again on top of whoever is behind it
function drawPolyFromPicture(ctx,poly){
  if(!art.complete||!art.naturalWidth||poly.length<3)return;
  ctx.save();ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);
  for(var i=1;i<poly.length;i++)ctx.lineTo(poly[i][0],poly[i][1]);
  ctx.closePath();ctx.clip();ctx.drawImage(art,0,0,W,H);ctx.restore();
}
function draw(){
  var ctx=cv.getContext('2d'),k=cv.width/W;
  ctx.setTransform(k,0,0,k,0,0);ctx.clearRect(0,0,W,H);
  var list=guests.map(function(g){return{y:guestSortY(g),g:g}});
  if(waiter)list.push({y:waiter.y,w:1});
  MASKS.forEach(function(m){list.push({y:m.y,m:m})});
  list.sort(function(a,b){return a.y-b.y});
  list.forEach(function(o){if(o.w)drawWaiter(ctx);else if(o.g)drawGuest(ctx,o.g);else drawPolyFromPicture(ctx,o.m.poly)});
}

// ---------- the canvas follows the picture ----------
function fit(){
  var vw=room.clientWidth||innerWidth,vh=room.clientHeight||innerHeight,s=Math.min(vw/W,vh/H),w=W*s,h=H*s;
  cv.style.width=w+'px';cv.style.height=h+'px';cv.style.left=((vw-w)/2)+'px';cv.style.top=((vh-h)/2)+'px';
  var d=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(w*d);cv.height=Math.round(h*d);
}
var raf=0,lastT=0;
function loop(t){
  raf=0;if(state==='kitchen')return;
  var dt=Math.min(.05,(t-lastT)/1000||.016);lastT=t;
  if(state==='tavern')step(dt);
  draw();
  raf=requestAnimationFrame(loop);
}
function startLoop(){if(!raf){lastT=performance.now();raf=requestAnimationFrame(loop)}}
addEventListener('resize',function(){if(state!=='kitchen'){fit();draw()}});
addBtn.addEventListener('click',function(e){e.stopPropagation();spawn()});

// ---------- going in and out (like the pantry) ----------
function held(){try{return !!(window.CooksterBackpackController&&window.CooksterBackpackController.hasHeldItem&&window.CooksterBackpackController.hasHeldItem())}catch(_){return true}}
function run(el,fr){
  if(typeof el.animate!=='function')return Promise.resolve();
  var a=el.animate(fr,{duration:(reduce&&reduce.matches)?220:DUR,easing:'cubic-bezier(.45,.05,.25,1)',fill:'both'});
  animations.push(a);return a.finished;
}
function turnCamera(direction){
  if(reduce&&reduce.matches){
    var outgoing=direction===1?viewport:room,incoming=direction===1?room:viewport;
    return Promise.all([run(outgoing,[{opacity:1},{opacity:0}]),run(incoming,[{opacity:0},{opacity:1}])]);
  }
  if(!window.CooksterPantryCamera)throw new Error('Panoramic camera module is missing');
  var animation=window.CooksterPantryCamera.turn({kitchen:viewport,pantry:room,direction:direction,duration:DUR,side:-1});
  animations.push(animation);return animation.finished;
}
function setInert(el,v){try{el.inert=v}catch(_){}if(v)el.setAttribute('inert','');else el.removeAttribute('inert')}
function cancelAnimations(){animations.forEach(function(a){a.cancel()});animations=[]}
function restoreKitchen(){
  room.classList.remove('is-active');room.setAttribute('aria-hidden','true');room.style.opacity='';
  if(saved){
    viewport.style.visibility=saved.vis;viewport.style.pointerEvents=saved.pe;setInert(viewport,saved.hadInert);
    if(saved.cursorEl)saved.cursorEl.style.display=saved.cur;
    if(saved.labEl)saved.labEl.style.display=saved.lab;
  }
  document.body.classList.remove('pantry-open');
  saved=null;state='kitchen';busy=false;cancelAnimations();
}
function open(){
  if(busy||state==='tavern')return Promise.resolve(false);
  if(held()){say('Prvo spusti predmet iz ruke.');return Promise.resolve(false)}
  if(window.CooksterPantry&&window.CooksterPantry.isOpen)return Promise.resolve(false);
  busy=true;say('');
  return preload().then(function(ok){
    if(!ok){say('Slika kafane nije učitana.');busy=false;return false}
    if(held()){say('Prvo spusti predmet iz ruke.');busy=false;return false}
    lastFocus=document.activeElement;
    var cur=document.getElementById('cursor'),lab=document.getElementById('label');
    saved={vis:viewport.style.visibility,pe:viewport.style.pointerEvents,cur:cur&&cur.style.display,lab:lab&&lab.style.display,
      hadInert:viewport.hasAttribute('inert'),cursorEl:cur,labEl:lab};
    if(cur)cur.style.display='none';if(lab)lab.style.display='none';
    viewport.style.pointerEvents='none';setInert(viewport,true);
    document.body.classList.add('pantry-open');
    room.classList.add('is-active');room.setAttribute('aria-hidden','false');room.style.opacity='0';
    fit();draw();
    state='opening';
    return turnCamera(1).then(function(){
      viewport.style.visibility='hidden';room.style.opacity='';
      state='tavern';busy=false;cancelAnimations();
      backBtn.focus({preventScroll:true});startLoop();
      return true;
    });
  }).catch(function(){restoreKitchen();say('Prelaz nije uspeo. Pokušaj ponovo.');return false});
}
function close(){
  if(busy||state!=='tavern')return Promise.resolve(false);
  busy=true;state='closing';
  viewport.style.visibility=saved?saved.vis:'';
  var movement;
  try{movement=turnCamera(-1)}catch(error){restoreKitchen();say('Prelaz nije uspeo. Kuhinja je ponovo dostupna.');return Promise.resolve(false)}
  return movement.then(function(){
    restoreKitchen();
    var f=lastFocus&&document.contains(lastFocus)?lastFocus:openBtn;
    try{f.focus({preventScroll:true})}catch(_){}
    return true;
  }).catch(function(){restoreKitchen();say('Prelaz je prekinut. Kuhinja je ponovo dostupna.');return false});
}
openBtn.addEventListener('click',function(e){e.stopPropagation();open()});
backBtn.addEventListener('click',function(e){e.stopPropagation();close()});
function onKey(e){
  if(state==='kitchen'||window.__tavernEditor)return;
  if(e.type==='keydown'){
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();close();return}
    if(e.key==='Tab'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(state==='tavern')backBtn.focus({preventScroll:true});return}
  }
  e.stopPropagation();e.stopImmediatePropagation();
}
window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);window.addEventListener('keypress',onKey,true);

window.CooksterTavern={
  open:open,close:close,spawn:spawn,
  get isOpen(){return state==='tavern'},get busy(){return busy},
  debug:function(){return{guests:guests.map(function(g){return{id:g.id,ch:g.ch,mode:g.mode,x:Math.round(g.x),y:Math.round(g.y),seat:g.seat.id}}),seats:SEATS.length,free:SEATS.filter(function(s){return !s.taken}).length}},
  seats:SEATS,tables:TABLES,door:DOOR,roomSrc:ROOM,size:{w:W,h:H},
  defaults:defaultCal,calibration:function(){return CAL},applyCalibration:function(c){applyCal(c)},calKey:CAL_KEY,
  fit:function(){fit();draw()},isOpenScene:function(){return state!=='kitchen'}
};
})();
