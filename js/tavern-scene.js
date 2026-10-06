/* Cookster - the tavern ("kafana"): a separate scene, reached from the kitchen with the button on the left edge (the camera turns
   to the left, like it turns to the right for the pantry).
   Guests come in through the door, walk to a free chair, sit, and after a while get up and leave. They are pictures
   (assets/tavern/guests/gNN_<pose>.webp, 10 characters x 5 poses) drawn on a canvas over the picture of the hall.
   Guests only walk toward or away from the camera (three pictures of a step each); going sideways they lean a little. */
(function(){
'use strict';
var ROOM='assets/tavern/kafana_cista.webp',GUESTS='assets/tavern/guests/',WAITER='assets/tavern/waiter/';
var W=1672,H=941;                                   // the picture of the hall
var GUESTS_ON=true,IMGV=4,DUR=700,CHARS=10,POSES=['dole','dole2','gore','gore2','sedi_lice','sedi_ledja','sedi_ledja_l'];
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
    jobs.push(loadImg(GUESTS+key+'.webp?v='+IMGV).then(function(im){imgs[key]=im}));
  });
  // walking toward the camera: right leg forward, legs together, left leg forward (then together again)
  // (the same three pictures seen from behind, 'walku', when walking away from the camera)
  for(var c2=1;c2<=CHARS;c2++)for(var f=1;f<=3;f++)['walkd','walku'].forEach(function(w){(function(key){
    jobs.push(loadImg(GUESTS+key+'.webp?v='+IMGV).then(function(im){imgs[key]=im}));
  })('g'+(c2<10?'0':'')+c2+'_'+w+f)});
  // the waiter: three pictures of a step toward the camera (walkd), away from it (walku) and from the side (walks, looking right)
  ['walkd','walku','walks'].forEach(function(w){for(var f2=1;f2<=3;f2++)(function(key){
    jobs.push(loadImg(WAITER+'waiter_'+key+'.webp?v=3').then(function(im){imgs['w_'+key]=im}));
  })(w+f2)});
  var roomJob=loadImg(ROOM).then(function(im){if(im){art.src=ROOM;backdrop.style.backgroundImage='url("'+ROOM+'")'}return !!im});
  loading=Promise.all([roomJob].concat(jobs)).then(function(r){loaded=!!r[0];loading=null;return loaded});
  return loading;
}

// ---------- the hall: tables, chairs, floor ----------
// every table: the centre, and the outline of its cloth (with the bottle and candles). The outline is the MASK of the table:
// guests behind the table are hidden by it, and nobody walks over it.
// the three tables of the new hall (the centre of each one; the shapes come from the tool "Kalibracija kafane")
var TABLES=[{x:419,y:416,poly:[],block:[]},{x:829,y:622,poly:[],block:[]},{x:1424,y:456,poly:[],block:[]}];
// the chairs: where the guest sits (x,y: the chair), where he stands before he sits (ax,ay: on the floor beside the chair),
// k: back (behind the table, he faces us) or front (he sits with his back to us), pose: which picture of a seated guest
var SEAT_DEF=[
  [{x:340,y:372,ax:335,ay:332,k:'back',pose:'lice'},{x:565,y:388,ax:632,ay:395,k:'back',pose:'lice'},
   {x:268,y:540,ax:205,ay:548,k:'front',pose:'ledja'},{x:500,y:620,ax:520,ay:728,k:'front',pose:'ledja_l'}],
  [{x:752,y:556,ax:715,ay:522,k:'back',pose:'lice'},{x:955,y:548,ax:962,ay:496,k:'back',pose:'lice'},
   {x:690,y:790,ax:560,ay:800,k:'front',pose:'ledja'},{x:975,y:800,ax:1115,ay:800,k:'front',pose:'ledja_l'}],
  [{x:1262,y:410,ax:1160,ay:520,k:'back',pose:'lice'},{x:1505,y:398,ax:1650,ay:540,k:'back',pose:'lice'},
   {x:1300,y:660,ax:1200,ay:705,k:'front',pose:'ledja'},{x:1520,y:652,ax:1640,ay:705,k:'front',pose:'ledja_l'}]
];
var GUEST_K=1.7;                                              // the new hall has bigger tables and chairs, so the guests are bigger than in the old one
var SEATS=[];
TABLES.forEach(function(t,ti){
  SEAT_DEF[ti].forEach(function(d,oi){
    SEATS.push({id:ti*4+oi,table:ti,k:d.k,pose:d.pose,x:d.x,y:d.y,ax:d.ax,ay:d.ay,taken:false});
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
var DOOR0={x:262,y:352},DOOR={x:262,y:352};
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
//   chairWalk  {"seatId": [polygons]}: the part of a chair that covers a guest walking behind it (only while nobody sits on it)
//   seats  [{id,x,y,ax,ay,dir}]: for every chair: where the guest sits (x,y: the bottom of his picture), where he stands before he sits (ax,ay),
//          and the direction he looks, in degrees (0 right, 90 down = toward us, 180 left): it decides which picture of a seated guest is used
//   cleanExclude  polygons: what the cleaning sponge never touches (the tables with their chairs)
//   surfaces  [{id,name,kind:'h'|'v',img,polys,points}]: what the sponge cleans (floor, walls, the bar...). kind: horizontal (the sponge lies)
//             or vertical (the sponge is held upright); img: which picture of the sponge; points: how the sponge sits at some places,
//             [{x,y,scale,flat,angle,skew,lift,shadow}], blended between them. A later surface lies on top of an earlier one.
var CAL_KEY='cookster.tavern-calibration.v3',CAL_FILE='assets/tavern/calibration_cista.json';
// the pictures of the sponge: lezeci lies on a horizontal surface (dry, soapy, dirty), uspravni1/2 are held against a wall
var SPONGE_IMG={
  lezeci:{src:'assets/tavern/sundjer_suv.webp?v=1',w:112,ratio:212/440,ax:.5,ay:.66,flat:.58,
          states:{suv:'assets/tavern/sundjer_suv.webp?v=1',sapun:'assets/tavern/sundjer_sapun.webp?v=1',prljav:'assets/tavern/sundjer_prljav.webp?v=1'}},
  uspravni1:{src:'assets/tavern/sundjer_uspravni1.webp?v=1',w:84,ratio:551/360,ax:.46,ay:.5,flat:1},
  uspravni2:{src:'assets/tavern/sundjer_uspravni2.webp?v=1',w:100,ratio:480/360,ax:.46,ay:.5,flat:1}
};
var SPONGE_RADIUS=46;
var SPONGE_KEYS=['scale','flat','angle','skew','lift','shadow'];
function defaultSponge(){
  function q(x,y,sc){return{x:x,y:y,scale:sc,flat:1,angle:0,skew:0,lift:15,shadow:.55}}
  return[q(250,420,.78),q(1500,420,.78),q(300,900,1.25),q(1500,900,1.25)];
}
function defaultSurfaces(){return[{id:'pod',name:'Pod',kind:'h',img:'lezeci',polys:[],points:defaultSponge()}]}
function okSponge(a){return Array.isArray(a)&&a.length>0&&a.every(function(q){return q&&['x','y','scale','flat','angle','lift','shadow'].every(function(k){return isFinite(q[k])})})}
function okSurfaces(a){
  return Array.isArray(a)&&a.length>0&&a.every(function(f){return f&&typeof f.id==='string'&&(f.kind==='h'||f.kind==='v')&&SPONGE_IMG[f.img]&&okPolys(f.polys)&&okSponge(f.points)});
}
// blends the sponge points of one surface by the distance (inverse distance weighting)
function idw(pts,x,y){
  var sw=0,r={};SPONGE_KEYS.forEach(function(k){r[k]=0});
  for(var i=0;i<pts.length;i++){
    var q=pts[i],d2=(q.x-x)*(q.x-x)+(q.y-y)*(q.y-y);
    if(d2<1){SPONGE_KEYS.forEach(function(k){r[k]=q[k]||0});return r}
    var w=1/d2;sw+=w;SPONGE_KEYS.forEach(function(k){r[k]+=(q[k]||0)*w});
  }
  SPONGE_KEYS.forEach(function(k){r[k]/=sw});
  return r;
}
// the top-most surface that holds this place (the floor lies under everything)
function surfaceAt(x,y){
  var list=(CAL&&okSurfaces(CAL.surfaces))?CAL.surfaces:defaultSurfaces();
  for(var i=list.length-1;i>=0;i--)for(var j=0;j<list[i].polys.length;j++)if(list[i].polys[j].length>=3&&pip(list[i].polys[j],x,y))return list[i];
  return list[0];
}
function spongeAt(x,y){
  var f=surfaceAt(x,y),r=idw(f.points,x,y);
  r.img=f.img;r.kind=f.kind;r.surface=f.id;r.name=f.name;
  return r;
}
function poseFromDir(deg){
  var t=((deg%360)+540)%360-180;                       // -180..180
  if(t>35&&t<145)return 'lice';                        // looks down, toward us
  return Math.cos(t*Math.PI/180)>=0?'ledja':'ledja_l'; // back to us, looking to the right / to the left
}
function defaultSeats(){
  var out=[],DIR={lice:90,ledja:-20,ledja_l:-160};
  SEAT_DEF.forEach(function(row,ti){row.forEach(function(d,oi){
    out.push({id:ti*4+oi,x:d.x,y:Math.round(d.y+(d.k==='back'?32:14)*GUEST_K),ax:d.ax,ay:d.ay,dir:DIR[d.pose]});
  })});
  return out;
}
function okSeats(a){return Array.isArray(a)&&a.length>0&&a.every(function(q){return q&&['id','x','y','ax','ay','dir'].every(function(k){return isFinite(q[k])})})}
function clonePoly(p){return p.map(function(q){return[q[0],q[1]]})}
// the waiter: where he may walk (a copy of the floor to start with), where he stands at every table to take an order (and where he looks),
// and the route he follows (open lines; empty = he finds his own way on the floor)
function defaultWaiterSpots(){
  var out=[{id:'home',x:DOOR0.x,y:DOOR0.y,dir:90}];
  SEAT_DEF.forEach(function(row,ti){out.push({id:ti,x:row[0].ax,y:row[0].ay,dir:90})});
  return out;
}
function okWaiterSpots(a){return Array.isArray(a)&&a.length>0&&a.every(function(q){return q&&(q.id==='home'||isFinite(q.id))&&['x','y','dir'].every(function(k){return isFinite(q[k])})})}
function defaultCal(){
  var cal={version:1,floor:[clonePoly(FLOOR)],blocked:[],tableMask:[],chairMask:{},chairWalk:{},cleanExclude:[],surfaces:defaultSurfaces(),seats:defaultSeats(),
    waiterFloor:[clonePoly(FLOOR)],waiterRoute:[],waiterSpots:defaultWaiterSpots()};
  BLOCKS.forEach(function(b){cal.blocked.push([[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]])});
  TABLES.forEach(function(t){cal.blocked.push(clonePoly(t.block));cal.tableMask.push(clonePoly(t.poly))});
  cal.cleanExclude=[];cal.surfaces=defaultSurfaces();cal.surfaces[0].polys=cal.floor;
  return cal;
}
function okPolys(a){return Array.isArray(a)&&a.every(function(p){return Array.isArray(p)&&p.every(function(q){return Array.isArray(q)&&isFinite(q[0])&&isFinite(q[1])})})}
function normCal(found){
  var d=defaultCal();
  if(!found||typeof found!=='object')return d;
  var cal={version:1,floor:okPolys(found.floor)?found.floor:d.floor,blocked:okPolys(found.blocked)?found.blocked:d.blocked,
    tableMask:okPolys(found.tableMask)?found.tableMask:d.tableMask,chairMask:{},chairWalk:{}};
  cal.seats=okSeats(found.seats)?found.seats:defaultSeats();
  // what the sponge cleans: older saved states keep their floor and their sponge points, the rest comes from the file
  if(okSurfaces(found.surfaces)){
    cal.surfaces=found.surfaces;
    cal.cleanExclude=okPolys(found.cleanExclude)?found.cleanExclude:[];
  }else{
    var base=fileJson(),bs=base&&okSurfaces(base.surfaces)?JSON.parse(JSON.stringify(base.surfaces)):defaultSurfaces();
    if(okPolys(found.cleanFloor)&&found.cleanFloor.length&&bs[0].id==='pod')bs[0].polys=found.cleanFloor;
    if(okSponge(found.spongeCal)&&bs[0].id==='pod')bs[0].points=found.spongeCal;
    cal.surfaces=bs;
    // only the tables with their chairs are left out, the other things (bar, stove...) are surfaces now
    var tm=cal.tableMask.filter(function(p){return p.length>=3}),old=okPolys(found.cleanExclude)?found.cleanExclude:cal.blocked;
    var tables=old.filter(function(b){return b.length>=3&&tm.some(function(z){var cx=0,cy=0;z.forEach(function(q){cx+=q[0];cy+=q[1]});return pip(b,cx/z.length,cy/z.length)})});
    cal.cleanExclude=tables.length?tables:(base&&okPolys(base.cleanExclude)?base.cleanExclude:[]);
  }
  ['chairMask','chairWalk'].forEach(function(n){
    if(found[n]&&typeof found[n]==='object')Object.keys(found[n]).forEach(function(k){if(okPolys(found[n][k]))cal[n][k]=found[n][k]});
  });
  cal.waiterFloor=okPolys(found.waiterFloor)?found.waiterFloor:cal.floor.map(clonePoly);
  cal.waiterRoute=okPolys(found.waiterRoute)?found.waiterRoute:[];
  cal.waiterSpots=okWaiterSpots(found.waiterSpots)?found.waiterSpots:defaultWaiterSpots();
  return cal;
}
function fileJson(){
  try{var x=new XMLHttpRequest();x.open('GET',CAL_FILE,false);x.send(null);if(x.status>=200&&x.status<300)return JSON.parse(x.responseText)}catch(_){}
  return null;
}
function readCal(){
  var found=null;
  try{var raw=localStorage.getItem(CAL_KEY);if(raw)found=JSON.parse(raw)}catch(_){}
  if(!found)found=fileJson();
  return normCal(found);
}
function fileCal(){return normCal(fileJson())}          // what the tool restores with "Vrati početno"
var CAL=null,MASKS=[],WALKMASKS=[],TABLEMASKY={};
// the nearest place where a guest may stand (the drawn floor and the blocked shapes can change at any time)
function nearestWalk(x,y){
  if(walkable(x,y))return{x:x,y:y};
  for(var r=8;r<=420;r+=8)for(var a=0;a<360;a+=15){
    var px=x+Math.cos(a*Math.PI/180)*r,py=y+Math.sin(a*Math.PI/180)*r;
    if(walkable(px,py))return{x:Math.round(px),y:Math.round(py)};
  }
  return{x:x,y:y};
}
var REACH=null;                                        // which grid cells can be reached from the door
function seatCfg(id){var l=(CAL&&okSeats(CAL.seats))?CAL.seats:defaultSeats();for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null}
function fixPlaces(){
  var q=nearestWalk(DOOR0.x,DOOR0.y);DOOR.x=q.x;DOOR.y=q.y;
  SEATS.forEach(function(s){
    var d=seatCfg(s.id)||defaultSeats()[s.id],p=nearestWalk(d.ax,d.ay);
    s.x=d.x;s.y=d.y;s.dir=d.dir;s.pose=poseFromDir(d.dir);s.k=s.pose==='lice'?'back':'front';
    s.ax=p.x;s.ay=p.y;
  });
  // which chairs a guest can walk to from the door (the shapes in "Zabrana" may close a passage)
  if(!GRID)buildGrid();
  REACH=new Uint8Array(GW*GH);
  var st=nearestFree(DOOR.x,DOOR.y),queue=[st],qi=0;REACH[st[1]*GW+st[0]]=1;
  while(qi<queue.length){
    var c=queue[qi++];
    for(var dj=-1;dj<=1;dj++)for(var di=-1;di<=1;di++){
      if(!di&&!dj)continue;var ni=c[0]+di,nj=c[1]+dj;
      if(ni<0||nj<0||ni>=GW||nj>=GH||!GRID[nj*GW+ni]||REACH[nj*GW+ni])continue;
      if(di&&dj&&(!GRID[c[1]*GW+ni]||!GRID[nj*GW+c[0]]))continue;
      REACH[nj*GW+ni]=1;queue.push([ni,nj]);
    }
  }
}
function seatReachable(s){if(!REACH)return true;var c=nearestFree(s.ax,s.ay);return !!REACH[c[1]*GW+c[0]]}
function applyCal(cal){
  CAL=cal||readCal();
  MASKS=CAL.tableMask.filter(function(p){return p.length>=3}).map(function(p){
    var by=-1e9,cx=0,cy=0;p.forEach(function(q){by=Math.max(by,q[1]);cx+=q[0];cy+=q[1]});return{poly:p,y:by-4,cx:cx/p.length,cy:cy/p.length};
  });
  // which mask belongs to which table (the nearest one): whoever sits at a table is drawn above that table's mask
  TABLEMASKY={};
  TABLES.forEach(function(t,ti){
    var best=null;
    MASKS.forEach(function(m){var d=Math.hypot(m.cx-t.x,m.cy-t.y);if(!best||d<best.d)best={d:d,y:m.y}});
    if(best&&best.d<200)TABLEMASKY[ti]=best.y;
  });
  WALKMASKS=[];
  Object.keys(CAL.chairWalk||{}).forEach(function(k){
    CAL.chairWalk[k].forEach(function(p){
      if(p.length<3)return;
      var by=-1e9;p.forEach(function(q){by=Math.max(by,q[1])});
      WALKMASKS.push({poly:p,y:by-4,seat:+k});
    });
  });
  GRID=null;WGRID=null;WGRAPH=null;
  if(typeof waiter!=='undefined'&&waiter)waiter.replan=true;
  fixPlaces();
}
function walkable(x,y){
  var ok=false,i;
  for(i=0;i<CAL.floor.length;i++)if(CAL.floor[i].length>=3&&pip(CAL.floor[i],x,y)){ok=true;break}
  if(!ok)return false;
  for(i=0;i<CAL.blocked.length;i++)if(CAL.blocked[i].length>=3&&pip(CAL.blocked[i],x,y))return false;
  return true;
}
function buildGrid(){GRID=new Uint8Array(GW*GH);for(var j=0;j<GH;j++)for(var i=0;i<GW;i++)GRID[j*GW+i]=walkable(i*CELL+CELL/2,j*CELL+CELL/2)?1:0}
function nearestFree(x,y,G){
  G=G||GRID;
  var ci=Math.max(0,Math.min(GW-1,Math.floor(x/CELL))),cj=Math.max(0,Math.min(GH-1,Math.floor(y/CELL)));
  if(G[cj*GW+ci])return[ci,cj];
  for(var r=1;r<20;r++)for(var dj=-r;dj<=r;dj++)for(var di=-r;di<=r;di++){
    if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;
    var i=ci+di,j=cj+dj;if(i>=0&&j>=0&&i<GW&&j<GH&&G[j*GW+i])return[i,j];
  }
  return[ci,cj];
}
function lineFree(a,b,walk){
  walk=walk||walkable;
  var n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/10);
  for(var i=0;i<=n;i++){var x=a.x+(b.x-a.x)*i/n,y=a.y+(b.y-a.y)*i/n;if(!walk(x,y))return false}
  return true;
}
function findPath(from,to,G,walk){                   // A* on the grid, then straightened (G, walk: another grid, e.g. the waiter's)
  if(!G){if(!GRID)buildGrid();G=GRID}
  var s=nearestFree(from.x,from.y,G),g=nearestFree(to.x,to.y,G);
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
      if(ni<0||nj<0||ni>=GW||nj>=GH||!G[nj*GW+ni])continue;
      if(di&&dj&&(!G[cur[1]*GW+ni]||!G[nj*GW+cur[0]]))continue;
      var nk=key(ni,nj),nc=cost[ck]+(di&&dj?1.414:1);
      if(cost[nk]===undefined||nc<cost[nk]){cost[nk]=nc;came[nk]=ck;open.push([ni,nj])}
    }
  }
  var pts=[];
  if(found){var k2=key(g[0],g[1]);while(k2!==undefined){pts.push({x:(k2%GW)*CELL+CELL/2,y:Math.floor(k2/GW)*CELL+CELL/2});k2=came[k2]}pts.reverse()}
  pts.unshift({x:from.x,y:from.y});pts.push({x:to.x,y:to.y});
  var out=[pts[0]],i=0;                              // skip the points that can be passed by in a straight line
  while(i<pts.length-1){var j=pts.length-1;while(j>i+1&&!lineFree(pts[i],pts[j],walk))j--;out.push(pts[j]);i=j}
  return out;
}

// ---------- the waiter: where he may walk and the route he follows ----------
// he walks on the "waiterFloor" shapes minus the blocked shapes (tables); if he has a route (open lines), he follows it
var WGRID=null,WGRAPH=null;
function waiterWalkable(x,y){
  var i,ok=false,fl=(CAL.waiterFloor&&CAL.waiterFloor.some(function(p){return p.length>=3}))?CAL.waiterFloor:CAL.floor;
  for(i=0;i<fl.length;i++)if(fl[i].length>=3&&pip(fl[i],x,y)){ok=true;break}
  if(!ok)return false;
  for(i=0;i<CAL.blocked.length;i++)if(CAL.blocked[i].length>=3&&pip(CAL.blocked[i],x,y))return false;
  return true;
}
function buildWGrid(){WGRID=new Uint8Array(GW*GH);for(var j=0;j<GH;j++)for(var i=0;i<GW;i++)WGRID[j*GW+i]=waiterWalkable(i*CELL+CELL/2,j*CELL+CELL/2)?1:0}
// the nodes of the route: the points of the lines; points closer than 10 px are one node, so lines that meet are joined
function buildWGraph(){
  var nodes=[],adj=[];
  function node(p){
    for(var i=0;i<nodes.length;i++)if(Math.hypot(nodes[i].x-p[0],nodes[i].y-p[1])<10)return i;
    nodes.push({x:p[0],y:p[1]});adj.push([]);return nodes.length-1;
  }
  (CAL.waiterRoute||[]).forEach(function(line){
    var prev=-1;
    line.forEach(function(p){
      var n=node(p);
      if(prev>=0&&prev!==n){
        var d=Math.hypot(nodes[n].x-nodes[prev].x,nodes[n].y-nodes[prev].y);
        adj[prev].push([n,d]);adj[n].push([prev,d]);
      }
      prev=n;
    });
  });
  WGRAPH={nodes:nodes,adj:adj};
}
// the path of the waiter from one place to another: along the route if there is one, else straight over the floor (A*)
function waiterPath(from,to){
  if(!WGRID)buildWGrid();
  if(!WGRAPH)buildWGraph();
  var N=WGRAPH.nodes,adj=WGRAPH.adj;
  if(N.length){
    var total=N.length,S=total,E=total+1,dist=[],prev=[],done=[],i;
    var links=[];                                           // virtual links from the start and to the end to the nodes seen from them
    function seen(p){var l=[];N.forEach(function(n,k){var d=Math.hypot(n.x-p.x,n.y-p.y);if(lineFree(p,n,waiterWalkable))l.push([k,d])});l.sort(function(a,b){return a[1]-b[1]});return l.slice(0,6)}
    var ls=seen(from),le=seen(to);
    if(ls.length&&le.length){
      for(i=0;i<total+2;i++){dist[i]=1e9;prev[i]=-1;done[i]=false}
      dist[S]=0;
      var endCost={};le.forEach(function(e){endCost[e[0]]=e[1]});
      for(var guard=0;guard<total+3;guard++){
        var u=-1,best=1e9;for(i=0;i<total+2;i++)if(!done[i]&&dist[i]<best){best=dist[i];u=i}
        if(u<0)break;done[u]=true;if(u===E)break;
        var edges=u===S?ls:(adj[u].concat(endCost[u]!==undefined?[[E,endCost[u]]]:[]));
        edges.forEach(function(e){var nd=dist[u]+e[1];if(nd<dist[e[0]]){dist[e[0]]=nd;prev[e[0]]=u}});
      }
      if(dist[E]<1e9){
        var out=[{x:to.x,y:to.y}],c=prev[E];
        while(c>=0&&c!==S){out.push({x:N[c].x,y:N[c].y});c=prev[c]}
        out.push({x:from.x,y:from.y});out.reverse();return out;
      }
    }
  }
  return findPath(from,to,WGRID,waiterWalkable);
}
function waiterSpot(id){
  var l=(CAL&&okWaiterSpots(CAL.waiterSpots))?CAL.waiterSpots:defaultWaiterSpots();
  for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];
  return null;
}
// the route made by itself: from the home place to every table spot, over the floor of the waiter
function waiterAutoRoute(){
  if(!WGRID)buildWGrid();
  var home=waiterSpot('home'),lines=[];
  if(!home)return lines;
  TABLES.forEach(function(t,ti){
    var sp=waiterSpot(ti);if(!sp)return;
    var a=nearestFree(home.x,home.y,WGRID),b=nearestFree(sp.x,sp.y,WGRID);
    var p=findPath({x:a[0]*CELL+CELL/2,y:a[1]*CELL+CELL/2},{x:b[0]*CELL+CELL/2,y:b[1]*CELL+CELL/2},WGRID,waiterWalkable);
    lines.push(p.map(function(q){return[Math.round(q.x),Math.round(q.y)]}));
  });
  return lines;
}

applyCal();
// ---------- guests ----------
var guests=[],nextArrival=2,clock=0,UID=0;
var SCALE0=.31*GUEST_K,SCALE_K=.00012*GUEST_K,SIT_K=.78;      // size of a picture at height y of the hall
function scaleAt(y){return SCALE0+SCALE_K*y}
function pickSeat(){
  // a guest sits only at a table that has been cleaned
  var cl=window.CooksterTavernClean&&window.CooksterTavernClean.cleaned?window.CooksterTavernClean.cleaned():null;
  var free=SEATS.filter(function(s){return !s.taken&&(!cl||cl[s.table])&&seatReachable(s)});
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
function chKey(g,pose){return 'g'+(g.ch<10?'0':'')+g.ch+'_'+pose}
function step(dt){
  clock+=dt;
  if(GUESTS_ON&&clock>=nextArrival){nextArrival=clock+7+Math.random()*9;if(guests.length<14)spawn()}
  if(GUESTS_ON)stepWaiter(dt);
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
          // guests only walk forward or backward; going sideways they keep their face and lean a little to that side
          if(Math.abs(dy)>.25)g.face=dy>0?'dole':'gore';
          g.lean=Math.max(-1,Math.min(1,dx/(Math.abs(dy)+Math.abs(dx)+1e-6)));
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
// ---------- the waiter ----------
// he waits at his home place, walks (along his route) to a table where a guest sits who has not ordered yet, stands at the spot drawn for that table,
// takes the order, and walks home. The pictures: toward the camera (walkd), away from it (walku), from the side (walks, looking right; flipped for left).
var waiter=null,WSPEED=92;
function waiterFace(dx,dy){                           // which set of pictures for this direction of walking
  if(Math.abs(dx)>1.2*Math.abs(dy))return 'walks';
  return dy>0?'walkd':'walku';
}
function dirFace(deg){                                 // the same for the direction he looks when he stands (0 right, 90 down = toward us)
  var t=((deg%360)+540)%360-180;
  if(t>35&&t<145)return{set:'walkd',flip:false};
  if(t<-35&&t>-145)return{set:'walku',flip:false};
  return{set:'walks',flip:Math.cos(t*Math.PI/180)<0};
}
function ensureWaiter(){
  if(waiter)return waiter;
  var h=waiterSpot('home')||{x:DOOR.x,y:DOOR.y,dir:90};
  waiter={x:h.x,y:h.y,mode:'idle',path:null,pi:1,phase:0,set:dirFace(h.dir).set,flip:dirFace(h.dir).flip,table:-1,t:0,face:h.dir};
  return waiter;
}
function waitingTable(){                              // the table with the guest that has waited longest and has not ordered yet
  var best=-1,bt=-1;
  guests.forEach(function(g){
    if(g.mode==='seated'&&!g.ordered&&g.sitT>bt){bt=g.sitT;best=g.seat.table}
  });
  return best;
}
function waiterGo(to){
  var w=ensureWaiter();
  w.path=waiterPath({x:w.x,y:w.y},{x:to.x,y:to.y});w.pi=1;
}
function stepWaiter(dt){
  var w=ensureWaiter(),home=waiterSpot('home')||{x:DOOR.x,y:DOOR.y,dir:90};
  if(w.replan){w.replan=false;if(w.mode==='go'||w.mode==='back')waiterGo(w.mode==='go'?waiterSpot(w.table)||home:home);else if(w.mode==='idle'){w.x=home.x;w.y=home.y}}
  if(w.mode==='idle'){
    var tb=waitingTable();
    if(tb>=0&&waiterSpot(tb)){w.table=tb;w.mode='go';waiterGo(waiterSpot(tb))}
    else{var f0=dirFace(home.dir);w.set=f0.set;w.flip=f0.flip}
  }else if(w.mode==='go'||w.mode==='back'){
    var tgt=w.path&&w.path[w.pi];
    if(!tgt){
      if(w.mode==='go'){w.mode='serve';w.t=0;var sp=waiterSpot(w.table),fs=dirFace(sp?sp.dir:90);w.set=fs.set;w.flip=fs.flip}
      else{w.mode='idle'}
    }else{
      var dx=tgt.x-w.x,dy=tgt.y-w.y,d=Math.hypot(dx,dy),spd=WSPEED*scaleAt(w.y)/.34*dt;
      if(d<=spd){w.x=tgt.x;w.y=tgt.y;w.pi++}
      else{
        w.x+=dx/d*spd;w.y+=dy/d*spd;
        var s2=waiterFace(dx,dy);if(s2!==w.set){w.set=s2}
        w.flip=s2==='walks'&&dx<0;
        w.phase+=spd/(40*scaleAt(w.y)/.34);
      }
    }
  }else if(w.mode==='serve'){
    w.t+=dt;
    if(w.t>3.2){
      guests.forEach(function(g){if(g.seat.table===w.table&&g.mode==='seated')g.ordered=true});
      w.mode='back';waiterGo(home);
    }
  }
}
function drawWaiter(ctx){
  var w=waiter;if(!w)return;
  var sc=scaleAt(w.y),moving=(w.mode==='go'||w.mode==='back')&&w.path&&w.path[w.pi];
  drawShadow(ctx,w.x,w.y,sc);
  if(!moving){drawSprite(ctx,'w_'+w.set+'2',w.x,w.y,sc,w.flip,0,1);return}
  var ph=Math.abs(Math.sin(w.phase*Math.PI)),bob=ph*3.2*sc/.3;
  // walking: only the two pictures with a leg forward (1 and 3), one after the other; the picture with the legs together (2) is only for standing.
  // The next picture fades in over the current one
  var q=w.phase,qi=Math.floor(q),fr=q-qi,SEQ=[1,3];
  // from behind the two pictures are alike, so they blend over most of the step; from the front and the side they differ more (the lean of the body,
  // the swing of the arms), a long blend would show two bodies at once, so the change is short
  var f0=w.set==='walku'?.25:.62,f1=w.set==='walku'?.9:.95;
  var fade=Math.max(0,Math.min(1,(fr-f0)/(f1-f0)));fade=fade*fade*(3-2*fade);
  drawSprite(ctx,'w_'+w.set+SEQ[qi%2],w.x,w.y-bob,sc,w.flip,0,1);
  if(fade>0)drawSprite(ctx,'w_'+w.set+SEQ[(qi+1)%2],w.x,w.y-bob,sc,w.flip,0,fade);
}
function seatPos(g){return{x:g.seat.x,y:g.seat.y}}
// the chairs on the right side of a table: the guest looks to the left, towards the others
function sitPose(g){return 'sedi_'+(g.seat.pose||'lice')}
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
function guestSortY(g){
  if(g.mode!=='seated'&&g.mode!=='sitting'&&g.mode!=='rising')return g.y;
  var y=seatPos(g).y,my=TABLEMASKY[g.seat.table];
  // a guest at the far side of the table sits above the cloth: his arms lie on the table, the table must not cover him
  if(g.seat.k==='back'&&my!==undefined)y=Math.max(y,my+1);
  return y;
}
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
    var rot=Math.sin(g.phase*Math.PI)*.012+(g.lean||0)*.09;
    {
      var wk=g.face==='dole'?'walkd':'walku';
      // the next picture of the step fades in over the current one, so the legs flow instead of jumping
      var q=g.phase*2,qi=Math.floor(q),fr=q-qi,SEQ=[1,2,3,2];
      var fade=Math.max(0,Math.min(1,(fr-.25)/.65));fade=fade*fade*(3-2*fade);
      drawSprite(ctx,chKey(g,wk+SEQ[qi%4]),g.x,g.y-bob,sc,false,rot,1);
      if(fade>0)drawSprite(ctx,chKey(g,wk+SEQ[(qi+1)%4]),g.x,g.y-bob,sc,false,rot,fade);
    }
  }else{
    var sp=seatPos(g),ssc=scaleAt(sp.y)*SIT_K;
    if(g.mode==='sitting'||g.mode==='rising'){
      var t=g.mode==='sitting'?g.fade:1-g.fade,e=t*t*(3-2*t);
      var fx=g.seat.ax+(sp.x-g.seat.ax)*e,fy=g.seat.ay+(sp.y-g.seat.ay)*e;
      drawSprite(ctx,chKey(g,g.from?g.from.face:'dole'),fx,fy,scaleAt(fy),false,0,1-e);
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
  // what is redrawn is what the player sees: the clean picture with the dirt that is still on it
  ctx.closePath();ctx.clip();ctx.drawImage(art,0,0,W,H);var dc=window.CooksterTavern&&window.CooksterTavern.dirtCanvas;if(dc)ctx.drawImage(dc,0,0,W,H);ctx.restore();
}
function draw(){
  var ctx=cv.getContext('2d'),k=cv.width/W;
  ctx.setTransform(k,0,0,k,0,0);ctx.clearRect(0,0,W,H);
  if(!GUESTS_ON)return;          // the cleaning room: no guests, and the table masks must not paint the clean picture over the dirt
  var list=guests.map(function(g){return{y:guestSortY(g),g:g}});
  MASKS.forEach(function(m){list.push({y:m.y,m:m})});
  if(waiter)list.push({y:waiter.y,w:true});
  // a chair covers whoever walks behind it, but only while nobody sits on it
  WALKMASKS.forEach(function(m){
    var busy=guests.some(function(g){return g.seat.id===m.seat&&(g.mode==='sitting'||g.mode==='seated'||g.mode==='rising')});
    if(!busy)list.push({y:m.y,m:m});
  });
  list.sort(function(a,b){return a.y-b.y});
  list.forEach(function(o){if(o.g)drawGuest(ctx,o.g);else if(o.w)drawWaiter(ctx);else drawPolyFromPicture(ctx,o.m.poly)});
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
  debug:function(){return{waiter:waiter&&{mode:waiter.mode,x:Math.round(waiter.x),y:Math.round(waiter.y),set:waiter.set,table:waiter.table},guests:guests.map(function(g){return{id:g.id,ch:g.ch,mode:g.mode,x:Math.round(g.x),y:Math.round(g.y),seat:g.seat.id}}),seats:SEATS.length,free:SEATS.filter(function(s){return !s.taken}).length}},
  seats:SEATS,tables:TABLES,door:DOOR,roomSrc:ROOM,size:{w:W,h:H},
  seatReach:function(){return SEATS.map(seatReachable)},poseFromDir:poseFromDir,seatScale:function(y){return scaleAt(y)*SIT_K},
  poseInfo:function(pose){var im=imgs['g01_sedi_'+pose];return im?{src:im.src,w:im.naturalWidth,h:im.naturalHeight}:null},
  defaults:fileCal,spongeAt:spongeAt,idw:idw,spongeImg:SPONGE_IMG,spongeRadius:SPONGE_RADIUS,calibration:function(){return CAL},applyCalibration:function(c){applyCal(c)},calKey:CAL_KEY,waiterPath:waiterPath,waiterAutoRoute:waiterAutoRoute,waiterSpot:waiterSpot,waiterWalkable:waiterWalkable,
  fit:function(){fit();draw()},isOpenScene:function(){return state!=='kitchen'}
};
})();
