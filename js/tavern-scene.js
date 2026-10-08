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
// the people are painted in a neutral light, the tavern in the warm light of the lamps and the stove: every picture of a guest and of the waiter is
// tinted once, when it is loaded (a multiply with a warm colour and a little orange on top), so they belong to the room. timgs holds the tinted ones.
var timgs={},TINT_MUL='rgb(236,204,166)',TINT_GLOW='rgba(255,138,48,.10)';
function tint(im){
  try{
    var c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
    var x=c.getContext('2d');x.drawImage(im,0,0);
    x.globalCompositeOperation='multiply';x.fillStyle=TINT_MUL;x.fillRect(0,0,c.width,c.height);
    x.globalCompositeOperation='source-atop';x.fillStyle=TINT_GLOW;x.fillRect(0,0,c.width,c.height);
    x.globalCompositeOperation='destination-in';x.drawImage(im,0,0);
    return c;
  }catch(_){return null}
}
function store(key,im){imgs[key]=im;if(im)timgs[key]=tint(im)}
function loadImg(src){return new Promise(function(res){var im=new Image();im.onload=function(){res(im)};im.onerror=function(){res(null)};im.src=src})}
function preload(){
  if(loaded)return Promise.resolve(true);
  if(loading)return loading;
  var jobs=[];
  for(var c=1;c<=CHARS;c++)POSES.forEach(function(p){
    var key='g'+(c<10?'0':'')+c+'_'+p;
    jobs.push(loadImg(GUESTS+key+'.webp?v='+IMGV).then(function(im){store(key,im)}));
  });
  // walking toward the camera: right leg forward, legs together, left leg forward (then together again)
  // (the same three pictures seen from behind, 'walku', when walking away from the camera)
  for(var c2=1;c2<=CHARS;c2++)for(var f=1;f<=3;f++)['walkd','walku'].forEach(function(w){(function(key){
    jobs.push(loadImg(GUESTS+key+'.webp?v='+IMGV).then(function(im){store(key,im)}));
  })('g'+(c2<10?'0':'')+c2+'_'+w+f)});
  // the waiter: three pictures of a step toward the camera (walkd), away from it (walku) and from the side (walks, looking right)
  ['walkd','walku','walks','writes','foods','drinks'].forEach(function(w){for(var f2=1;f2<=3;f2++)(function(key){
    jobs.push(loadImg(WAITER+'waiter_'+key+'.webp?v=4').then(function(im){store('w_'+key,im)}));
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
var CAL_KEY='cookster.tavern-calibration.v3',CAL_FILE='assets/tavern/calibration_cista.json?v=5';
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
  cal.serve=(found.serve&&typeof found.serve==='object')?{seat:found.serve.seat||{},table:found.serve.table||{}}:{seat:{},table:{}};
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
function makeGuest(seat,grp,wait){
  seat.taken=true;
  var used={};guests.forEach(function(o){used[o.ch]=1});
  var pool=[];for(var c=1;c<=CHARS;c++)if(!used[c])pool.push(c);
  var ch=pool.length?pool[Math.floor(Math.random()*pool.length)]:1+Math.floor(Math.random()*CHARS);
  var g={id:++UID,ch:ch,seat:seat,x:DOOR.x+(Math.random()*30-15),y:DOOR.y,
    mode:'in',path:findPath(DOOR,{x:seat.ax,y:seat.ay}),pi:1,phase:Math.random()*2,face:'dole',flip:false,
    sitT:0,sitFor:grp?grp.sitFor:90+Math.random()*70,orderDelay:14+Math.random()*14,fade:0,from:null,speed:78+Math.random()*16,mood:'ok',grp:grp||null,wait:wait||0,rounds:0};
  guests.push(g);return g;
}
// one guest (a free seat at a table that is clean)
function spawn(){
  var seat=pickSeat();if(!seat)return null;
  return makeGuest(seat,null,0);
}
// a company: 1-4 guests come together to an empty clean table; a big one sometimes stays long and keeps ordering
function cleanTables(){var cl=window.CooksterTavernClean&&window.CooksterTavernClean.cleaned?window.CooksterTavernClean.cleaned():null;return cl}
function spawnGroup(){
  var r=Math.random(),size=r<.38?1:r<.62?2:r<.84?3:4;
  if(size===1)return spawn();
  var cl=cleanTables(),tables=[];
  for(var t=0;t<TABLES.length;t++){
    if(cl&&!cl[t])continue;
    var seats=SEATS.filter(function(s){return s.table===t&&seatReachable(s)});
    if(seats.length>=size&&!SEATS.some(function(s){return s.table===t&&s.taken}))tables.push(seats);
  }
  if(!tables.length)return spawn();
  var seats=tables[Math.floor(Math.random()*tables.length)].slice();
  seats.sort(function(){return Math.random()-.5});seats=seats.slice(0,size);
  var long=size>=3&&Math.random()<.55;
  var grp={id:++UID,size:size,long:long,sitFor:long?260+Math.random()*180:120+Math.random()*80};
  seats.forEach(function(st,i){makeGuest(st,grp,i*.9+Math.random()*.4)});
  return true;
}
function chKey(g,pose){return 'g'+(g.ch<10?'0':'')+g.ch+'_'+pose}
function step(dt){
  clock+=dt;
  if(GUESTS_ON&&clock>=nextArrival){nextArrival=clock+28+Math.random()*32;if(guests.length>=14||!spawnGroup())nextArrival=clock+4}      // no free clean table: look again in a moment
  if(GUESTS_ON)stepWaiter(dt);
  tickDishes(dt);tickMess(dt);
  for(var i=guests.length-1;i>=0;i--){
    var g=guests[i];
    if(g.mode==='in'&&g.wait>0){g.wait-=dt;continue}
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
      if(g.reorderAt&&g.sitT>g.reorderAt){g.reorderAt=0;g.ordered=false;g.orders=null}      // a long company orders again
      if(g.grp){if(!g.grp.until)g.grp.until=clock+g.grp.sitFor;if(clock>g.grp.until){g.mode='rising';g.fade=0}}
      else if(g.sitT>g.sitFor){g.mode='rising';g.fade=0}
    }else if(g.mode==='rising'){
      g.fade=Math.min(1,g.fade+dt/.55);
      if(g.fade>=1){g.x=g.seat.ax;g.y=g.seat.ay;g.mode='out';g.path=findPath({x:g.x,y:g.y},DOOR);g.pi=1}
    }
  }
}
// ---------- the mess ----------
// the longer and the more they drink and smoke, the dirtier: the ashtray fills, the table gets dirty again, the floor too; a table that was used must be cleaned
var ash=[0,0,0],ASH=[{x:437,y:447},{x:886,y:660},{x:1377,y:503}],tableUsed=[0,0,0],floorT=0,idleT=0;
function addDirt(table,units){
  tableUsed[table]=(tableUsed[table]||0)+units;
  try{if(window.CooksterTavernClean)window.CooksterTavernClean.dirty(table,Math.round(units*2))}catch(e){}
}
function tickMess(dt){
  var seatedAt=[0,0,0],cl=cleanTables();
  guests.forEach(function(g){if(g.mode==='seated')seatedAt[g.seat.table]=(seatedAt[g.seat.table]||0)+1});
  // also without guests the hall slowly gets dirty again, one thing at a time: now a table, now a piece of the floor
  idleT+=dt;
  if(idleT>75){idleT=0;
    if(Math.random()<.5){var rt=Math.floor(Math.random()*TABLES.length);if(!guests.some(function(g){return g.seat.table===rt})){try{window.CooksterTavernClean.dirty(rt,2);window.CooksterTavernClean.markDirty(rt)}catch(e){}}}
    else{try{window.CooksterTavernClean.floorDirt(1)}catch(e){}}
  }
  floorT+=dt*Math.max(0,guests.length);
  if(floorT>40){floorT=0;try{window.CooksterTavernClean.floorDirt(1+Math.floor(guests.length/4))}catch(e){}}
  for(var t=0;t<TABLES.length;t++){
    ash[t]=Math.min(1,(ash[t]||0)+(seatedAt[t]||0)*dt/260);                     // 4 guests fill the ashtray in about a minute
    var present=guests.some(function(g){return g.seat.table===t});
    if(!present&&tableUsed[t]>0){
      tableUsed[t]=0;try{window.CooksterTavernClean.markDirty(t)}catch(e){}                // the company left: the table has to be cleaned
    }
    if(cl&&cl[t]&&!present){ash[t]=0;for(var i=dishes.length-1;i>=0;i--)if(dishes[i].table===t)dishes.splice(i,1)}   // cleaned: ashtray emptied, glasses taken away
  }
}
function drawAsh(ctx,t){
  var l=ash[t]||0,a=ASH[t];if(!a||l<.04)return;
  var sc=scaleAt(a.y)/.34,n=Math.round(l*14);
  ctx.save();ctx.translate(a.x,a.y);
  ctx.fillStyle='rgba(120,116,110,.9)';ctx.beginPath();ctx.ellipse(0,0,15*sc*l*.8+4*sc,6*sc*l*.8+2*sc,0,0,Math.PI*2);ctx.fill();
  for(var i=0;i<n;i++){
    var ang=i*2.399,rr=(4+(i%5)*2.4)*sc,x=Math.cos(ang)*rr,y=Math.sin(ang)*rr*.45-1.5*sc;
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);
    ctx.fillStyle=i%3?'#e8e2d4':'#c8b79a';ctx.fillRect(-2.8*sc,-.8*sc,5.6*sc,1.7*sc);
    ctx.fillStyle='#b5692c';ctx.fillRect(1.9*sc,-.8*sc,1.9*sc,1.7*sc);
    ctx.restore();
  }
  ctx.restore();
}
// ---------- the waiter ----------
// he waits at his home place, walks (along his route) to a table where a guest sits who has not ordered yet, stands at the spot drawn for that table,
// takes the order, and walks home. The pictures: toward the camera (walkd), away from it (walku), from the side (walks, looking right; flipped for left).
var waiter=null,WSPEED=92;
var deliveries=[],reactions=[],dishes=[],DISH_SRC={plain:'assets/calibration_props/posuda_za_kupus/posuda_kupus.webp',paprika:'assets/calibration_props/posuda_za_kupus/posuda_kupus_paprika.webp'},DISH_SECS=25;
DISH_SRC.dirty='assets/calibration_props/posuda_za_kupus/posuda_prljava.webp';
var dishImgs={},EAT_SECS=18,DRINK_SECS=14,EAT_DELAY=1.5;['plain','paprika','dirty'].forEach(function(k){var im=new Image();im.src=DISH_SRC[k];dishImgs[k]=im});
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
var WOMEN={2:1,5:1,8:1,10:1};                        // which of the ten characters are women (they order wine by the glass, men "kilo na kilo")
function pickOrderKeys(g){                            // what one guest orders: one thing, or a dish together with a drink (every combination can happen)
  var r=Math.random(),w=!!WOMEN[g.ch],drink=w?(Math.random()<.5?'crno_casa':'belo_casa'):(Math.random()<.6?'kilo':(Math.random()<.5?'belo_flasa':'crno_flasa'));
  if(r<.3)return ['kupus'];
  if(r<.62)return [drink];
  return ['kupus',drink];
}
function guestOrders(g){
  if(!g.orders){var O=window.CooksterOrders;g.orders=O&&O.make?pickOrderKeys(g).map(function(k){return O.make(k,!!WOMEN[g.ch])}):[]}
  return g.orders;
}
function orderText(g){var o=guestOrders(g);return{l1:o.map(function(x){return x.name}).join(' + '),l2:o.map(function(x){return x.extra}).filter(Boolean).join(' · ')}}
function seatedCount(t){var n=0;guests.forEach(function(g){if(g.seat.table===t&&g.mode==='seated'&&!g.ordered)n++});return n}
function guestReady(g){                              // he has sat long enough to know what he wants, and his company is all there
  if(g.mode!=='seated'||g.ordered||g.sitT<g.orderDelay)return false;
  if(g.grp&&guests.some(function(o){return o.grp===g.grp&&(o.mode==='in'||o.mode==='sitting')}))return false;
  return true;
}
function waitingGuest(){                              // the ready guest that has waited longest
  var best=null;
  guests.forEach(function(g){if(guestReady(g)&&(!best||g.sitT>best.sitT))best=g});
  return best;
}
function waitingTable(){var g=waitingGuest();return g?g.seat.table:-1}
function carrySet(w){return(w.carry&&w.carry.kind==='drink'&&imgs['w_drinks2'])?'drinks':'foods'}           // the waiter with drinks, if the pictures exist, else with the tray of food
function waiterGo(to){
  var w=ensureWaiter();
  w.path=waiterPath({x:w.x,y:w.y},{x:to.x,y:to.y});w.pi=1;
}
function stepWaiter(dt){
  var w=ensureWaiter(),home=waiterSpot('home')||{x:DOOR.x,y:DOOR.y,dir:90};
  if(w.replan){w.replan=false;if(w.mode==='go'||w.mode==='back')waiterGo(w.mode==='go'?waiterSpot(w.table)||home:home);else if(w.mode==='idle'){w.x=home.x;w.y=home.y}}
  if(w.mode==='idle'&&window.CooksterOrders&&window.CooksterOrders.busy()){w.hidden=true;return}    // he is in the kitchen with an order
  if(w.hidden){w.hidden=false;w.x=home.x;w.y=home.y}
  if(w.mode==='idle'){
    var tb=waitingTable();
    if(deliveries.length&&waiterSpot(deliveries[0].table)){var dl=deliveries.shift();w.carry=dl;w.table=dl.table;w.mode='go';w.set=carrySet(w);waiterGo(waiterSpot(dl.table))}
    else if(tb>=0&&waiterSpot(tb)){w.table=tb;w.guest=waitingGuest();w.mode='go';waiterGo(waiterSpot(tb))}
    else{var f0=dirFace(home.dir);w.set=f0.set;w.flip=f0.flip}
  }else if(w.mode==='go'||w.mode==='back'){
    var tgt=w.path&&w.path[w.pi];
    if(!tgt){
      if(w.mode==='go'&&w.carry){w.mode='give';w.t=0;var sg=waiterSpot(w.table),fg=dirFace(sg?sg.dir:90);w.flip=fg.flip;w.set=carrySet(w)}
      else if(w.mode==='go'){w.mode='serve';w.t=0;var sp=waiterSpot(w.table),fs=dirFace(sp?sp.dir:90);w.set=fs.set;w.flip=fs.flip}
      else{w.mode='idle'}
    }else{
      var dx=tgt.x-w.x,dy=tgt.y-w.y,d=Math.hypot(dx,dy),spd=WSPEED*scaleAt(w.y)/.34*dt;
      if(d<=spd){w.x=tgt.x;w.y=tgt.y;w.pi++}
      else{
        w.x+=dx/d*spd;w.y+=dy/d*spd;
        var s2=w.carry?carrySet(w):waiterFace(dx,dy);if(s2!==w.set){w.set=s2}
        if(s2==='walks'||s2==='foods'||s2==='drinks'){if(Math.abs(dx)>.3)w.flip=dx<0}else w.flip=false;
        w.phase+=spd/(40*scaleAt(w.y)/.34);
      }
    }
  }else if(w.mode==='give'){
    w.t+=dt;
    if(w.t>1.1){
      try{if(window.CooksterSound)window.CooksterSound.play('waiter','serve')}catch(e){}
      var isDrink=w.carry.kind==='drink',sv=serveSpot(w.table,isDrink?'pice':'jelo',w.carry.seatId);
      var eatSeat=w.carry.seatId!=null&&w.carry.seatId>=0?w.carry.seatId:-1,secs=isDrink?DRINK_SECS:EAT_SECS;
      if(eatSeat<0)guests.forEach(function(g){if(g.seat.table===w.table&&g.mode==='seated'&&(eatSeat<0||g.seat.id<eatSeat))eatSeat=g.seat.id});
      guests.forEach(function(g){if(g.seat.id===eatSeat){g.sitFor=Math.max(g.sitFor,g.sitT+EAT_DELAY+secs+8);if(g.grp)g.grp.until=Math.max(g.grp.until||0,clock+EAT_DELAY+secs+10)}});
      addDirt(w.table,isDrink?1:2);
      guests.forEach(function(g){if(g.seat.id===eatSeat){g.rounds=(g.rounds||0)+1;if(g.grp&&g.grp.long&&g.rounds<4)g.reorderAt=g.sitT+secs+30+Math.random()*30}});
      dishes.push({table:w.table,kind:w.carry.kind||'plain',items:w.carry.items||null,secs:secs,t:0,eatT:0,bite:0,phase:'eating',seatId:eatSeat,x:sv?sv.x:null,y:sv?sv.y:null});
      var ev=w.carry.ev||null,rep=ev&&window.CooksterQuality?window.CooksterQuality.addReputation(ev.score):null;
      reactions.push({table:w.table,t:0,ev:ev,rep:rep,delta:ev?ev.score:0});
      w.carry=null;w.mode='back';waiterGo(home);
    }
  }else if(w.mode==='serve'){
    w.t+=dt;
    if(w.t>3.4+.7*seatedCount(w.table)){
      var table=w.table;
      var all=[];
      guests.forEach(function(og){
        if(og.seat.table!==table||og.mode!=='seated'||og.ordered)return;
        og.ordered=true;
        guestOrders(og).forEach(function(od){all.push({ord:od,seatId:og.seat.id})});
        og.orders=null;
      });
      if(all.length&&window.CooksterOrders)window.CooksterOrders.add(table+1,all);          // ONE paper with the whole order of the table goes to the kitchen
      w.mode='back';waiterGo(home);
    }
  }
}
// what the guest says to the waiter: the dish he orders
function drawBubble(ctx,x,y,l1,l2){
  ctx.save();ctx.font='700 17px system-ui,sans-serif';
  var w=Math.max(ctx.measureText(l1).width,(ctx.font='600 13px system-ui,sans-serif',ctx.measureText(l2).width))+26,h=l2?50:32,bx=x-w/2,by=y-h-12;
  ctx.fillStyle='rgba(250,238,206,.96)';ctx.strokeStyle='#5b3d1e';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,w,h,10):ctx.rect(bx,by,w,h);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-8,by+h);ctx.lineTo(x,by+h+12);ctx.lineTo(x+8,by+h);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#3a2410';ctx.textAlign='center';
  ctx.font='700 17px system-ui,sans-serif';ctx.fillText(l1,x,by+(l2?21:21));
  if(l2){ctx.font='600 13px system-ui,sans-serif';ctx.fillText(l2,x,by+40)}
  ctx.restore();
}
// where a dish / drink goes (marked in the tool "Kalibracija kafane", layer "Posluženje"): the spot of the guest who sits there, or the table's common spot
function serveSpot(table,kind,seatId){
  var sv=(CAL&&CAL.serve)||{seat:{},table:{}};
  if(kind==='sto')return sv.table[table]||null;
  var best=null;
  guests.forEach(function(g){if(g.seat.table===table&&g.mode==='seated'&&(!best||g.seat.id<best.seat.id))best=g});
  var order=seatId!=null&&seatId>=0?[seatId]:[];if(best&&order.indexOf(best.seat.id)<0)order.push(best.seat.id);SEATS.forEach(function(st){if(st.table===table&&order.indexOf(st.id)<0)order.push(st.id)});
  for(var i=0;i<order.length;i++){var d=sv.seat[order[i]];if(d&&d[kind])return d[kind]}
  return sv.table[table]||null;
}
function tickDishes(dt){
  for(var i=dishes.length-1;i>=0;i--){
    var d=dishes[i];d.t+=dt;
    if(d.phase==='eating'){
      if(d.t>EAT_DELAY){
        d.eatT+=dt;d.bite+=dt;
        if(d.bite>1.15){d.bite=0;try{if(window.CooksterSound)window.CooksterSound.play('waiter','eat')}catch(e){}}
        if(d.eatT>=(d.secs||EAT_SECS)){d.phase='dirty';d.dirtyT=0}
      }
    }else d.dirtyT=(d.dirtyT||0)+dt;
    if(!TABLES[d.table]||false)dishes.splice(i,1);
  }
}
var drinkImgs={};
function drinkImg(id){
  if(drinkImgs[id]!==undefined)return drinkImgs[id];
  var def=null;try{def=kitchenEquipmentDef(id)}catch(e){}
  var im=null;if(def&&def.src){im=new Image();im.src=def.src}
  drinkImgs[id]=im;return im;
}
// ---------- the things on the tables, calibrated in the tool "Predmeti na stolu" (js/table-items-tool.js) ----------
// TI.items[key]={def:{s,rot,h,sat,b,c},seat:{<seatId>:{x,y,s,rot,h,sat,b,c}}}; key: 'dish' (the bowl) or the id of a drink (pice_*)
var TI_KEY='cookster.table-items.v1',TI={items:{}};
try{var tiRaw=JSON.parse(localStorage.getItem(TI_KEY));if(tiRaw&&tiRaw.items)TI=tiRaw}catch(e){}
// the file assets/tavern/table_items.json is the default (what Milos calibrated); the browser's own saved settings win over it
if(!TI.items||!Object.keys(TI.items).length){try{fetch('assets/tavern/table_items.json?v=2').then(function(r){return r.json()}).then(function(j){if(j&&j.items&&!Object.keys(TI.items).length)TI=j}).catch(function(){})}catch(e){}}
function tiCal(key,seatId){
  var it=TI.items[key];if(!it)return null;
  var d=it.def||{},o=(it.seat&&it.seat[seatId])||null;if(!o&&!it.def)return null;
  var r={},k;for(k in d)r[k]=d[k];if(o)for(k in o)r[k]=o[k];return r;
}
function tiFilter(c){
  if(!c)return 'none';
  var h=+c.h||0,sat=c.sat==null?1:+c.sat,b=c.b==null?1:+c.b,ct=c.c==null?1:+c.c;
  if(!h&&sat===1&&b===1&&ct===1)return 'none';
  return 'hue-rotate('+h+'deg) saturate('+sat+') brightness('+b+') contrast('+ct+')';
}
// "svetli tonovi": the light parts of the picture are made lighter (hl>0) or darker (hl<0)
var tiCache={},tiCount=0;
function tiImg(im,c){
  if(!im||!im.naturalWidth||!c)return im;
  var f=tiFilter(c),hl=c.hl?Math.round(c.hl*20)/20:0;if(f==='none'&&!hl)return im;
  var k=im.src+'|'+f+'|'+hl;if(tiCache[k])return tiCache[k];
  if(tiCount>120){tiCache={};tiCount=0}
  var cv2=document.createElement('canvas');cv2.width=im.naturalWidth;cv2.height=im.naturalHeight;var x=cv2.getContext('2d');
  x.filter=f;x.drawImage(im,0,0);x.filter='none';
  if(hl){
    try{
      var d=x.getImageData(0,0,cv2.width,cv2.height),a=d.data;
      for(var i=0;i<a.length;i+=4){var l=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)/255;if(l>.45){var t=Math.min(1,(l-.45)/.55),ff=1+hl*t;a[i]=Math.max(0,Math.min(255,a[i]*ff));a[i+1]=Math.max(0,Math.min(255,a[i+1]*ff));a[i+2]=Math.max(0,Math.min(255,a[i+2]*ff))}}
      x.putImageData(d,0,0);
    }catch(e){}
  }
  tiCache[k]=cv2;tiCount++;return cv2;
}
// the lean (rotation) and the skew of a thing on the table
function tiPose(ctx,cx,cy,c){
  ctx.translate(cx,cy);
  if(c&&c.rot)ctx.rotate(c.rot*Math.PI/180);
  if(c&&c.sk)ctx.transform(1,0,Math.tan(c.sk*Math.PI/180),1,0,0);
}
// "nagib ka stolu": the thing is laid back towards the table (or stands up): the top gets farther away, so it looks shorter and a little narrower (drawn in thin strips)
function tiDraw(ctx,im,x,y,w,h,c){
  var t=(c&&c.tilt)?c.tilt*Math.PI/180:0;
  if(!t){ctx.drawImage(im,x,y,w,h);return}
  var N=28,cs=Math.cos(t),sn=Math.sin(t),D=h*5,sw=im.naturalWidth||im.width,sh=im.naturalHeight||im.height,cx=x+w/2,bottom=y+h;
  for(var i=N-1;i>=0;i--){
    var up0=(N-1-i)/N*h,up1=(N-i)/N*h;                       // distance of this strip above the bottom edge
    function pj(u){var z=u*sn,k=D/(D+z);return{y:bottom-u*cs*k,k:k}}
    var a=pj(up0),b=pj(up1),dh=a.y-b.y;if(dh<=0)continue;
    ctx.drawImage(im,0,i*sh/N,sw,sh/N+1,cx-w/2*b.k,b.y,w*b.k,dh+.6);
  }
}
// the soft shadow under a thing on the table (strength, shift, width, height, blur are calibrated in the tool)
var TI_SH={sho:.38,shx:0,shy:.01,shw:1,shh:.28,shb:5};
function tiShadow(ctx,cx,bottom,w,c){
  var o=c&&c.sho!=null?+c.sho:TI_SH.sho;if(o<=0.01)return;
  var sx=c&&c.shx!=null?+c.shx:TI_SH.shx,sy=c&&c.shy!=null?+c.shy:TI_SH.shy,sw=c&&c.shw!=null?+c.shw:TI_SH.shw,sh=c&&c.shh!=null?+c.shh:TI_SH.shh,b=c&&c.shb!=null?+c.shb:TI_SH.shb;
  var rx=Math.max(1,w*sw/2),ry=Math.max(1,w*sh/2),soft=Math.min(.95,b/20+.15),g=ctx.createRadialGradient(0,0,0,0,0,1);     // soft edge without a blur filter (the filter was slow)
  g.addColorStop(0,'rgba(8,4,0,'+Math.min(1,o)+')');g.addColorStop(Math.max(0,1-soft),'rgba(8,4,0,'+Math.min(1,o)*.8+')');g.addColorStop(1,'rgba(8,4,0,0)');
  ctx.save();ctx.translate(cx+sx*w,bottom+sy*w);ctx.scale(rx,ry);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
function tiBase(key,y){return scaleAt(y)*(key==='dish'?.2:.19)}
function tiSrc(key){if(key==='dish')return dishImgs.plain&&dishImgs.plain.src;var im=drinkImg(key);return im&&im.src}
function tiApply(data){TI=data&&data.items?data:{items:{}}}
// the drinks of one guest stand side by side on his "piće" spot (the spot is the middle of the group); a drink that was calibrated stands where it was put
function drinkLayout(d){
  var tb=TABLES[d.table];if(!tb)return null;
  var dx=d.x!=null?d.x:tb.x,dy=d.y!=null?d.y:tb.y+8,out=[],tw=0,i;
  for(i=0;i<d.items.length;i++){
    var im=drinkImg(d.items[i]);if(!im||!im.naturalWidth)return null;
    var c=tiCal(d.items[i],d.seatId),sc=tiBase(d.items[i],dy)*((c&&c.s)||1),w=im.naturalWidth*sc,h=im.naturalHeight*sc;
    out.push({im:im,w:w,h:h,cal:c});tw+=w;
  }
  var x=dx-tw/2-(out.length-1)*3;
  out.forEach(function(o,i){
    if(o.cal&&o.cal.x!=null){o.x=o.cal.x-o.w/2;o.y=o.cal.y-o.h/2}
    else{o.x=x;o.y=dy-o.h/2}
    x+=o.w+6;
  });
  return out;
}
function dishRect(d){
  var tb=TABLES[d.table];if(!tb)return null;
  if(d.items&&d.items.length){
    var L=drinkLayout(d);if(!L||!L.length)return null;
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;L.forEach(function(o){x0=Math.min(x0,o.x);y0=Math.min(y0,o.y);x1=Math.max(x1,o.x+o.w);y1=Math.max(y1,o.y+o.h)});
    return{x:x0,y:y0,w:x1-x0,h:y1-y0};
  }
  var im=dishImgs.dirty;if(!im||!im.naturalWidth)return null;
  var c=tiCal('dish',d.seatId),dx=(c&&c.x!=null)?c.x:(d.x!=null?d.x:tb.x),dy=(c&&c.y!=null)?c.y:(d.y!=null?d.y:tb.y+8),sc=tiBase('dish',dy)*((c&&c.s)||1),w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  return{x:dx-w/2,y:dy-h/2,w:w,h:h,cal:c};                          // the spot is the middle of the dish
}
function drawDish(ctx,d){
  if(d.items&&d.items.length){
    var L=drinkLayout(d);if(!L)return;
    ctx.save();ctx.globalAlpha=d.phase==='eating'?Math.min(1,d.t/.3):1;
    L.forEach(function(o){tiShadow(ctx,o.x+o.w/2,o.y+o.h,o.w,o.cal)});
    L.forEach(function(o){ctx.save();tiPose(ctx,o.x+o.w/2,o.y+o.h/2,o.cal);tiDraw(ctx,tiImg(o.im,o.cal),-o.w/2,-o.h/2,o.w,o.h,o.cal);ctx.restore()});
    ctx.restore();return;
  }
  var r=dishRect(d);if(!r)return;
  var full=dishImgs[d.kind]||dishImgs.plain,dirty=dishImgs.dirty;
  var a=d.phase==='eating'?Math.min(1,d.t/.3):1;
  ctx.save();ctx.globalAlpha=a;tiShadow(ctx,r.x+r.w/2,r.y+r.h,r.w,r.cal);
  if(r.cal&&(r.cal.rot||r.cal.sk)){tiPose(ctx,r.x+r.w/2,r.y+r.h/2,r.cal);ctx.translate(-(r.x+r.w/2),-(r.y+r.h/2))}
  if(r.cal){full=tiImg(full,r.cal);dirty=tiImg(dirty,r.cal)}
  if(r.cal&&r.cal.tilt){var tb2=r.y+r.h,tcx=r.x+r.w/2;ctx.translate(tcx,tb2);ctx.scale(1,Math.max(.25,Math.cos(r.cal.tilt*Math.PI/180)));ctx.translate(-tcx,-tb2)}
  if(d.phase==='eating'){
    ctx.drawImage(dirty,r.x,r.y,r.w,r.h);                                  // the bowl underneath (it gets dirty while the food goes)
    var frac=Math.max(0,1-d.eatT/EAT_SECS),cut=r.h*.72*(1-frac);               // the food goes down from the top
    if(full&&full.naturalWidth){ctx.beginPath();ctx.rect(r.x-2,r.y+cut,r.w+4,r.h-cut+2);ctx.clip();ctx.drawImage(full,r.x,r.y,r.w,r.h)}
  }else ctx.drawImage(dirty,r.x,r.y,r.w,r.h);
  ctx.restore();
}
// the empty dirty bowl is cleared away with a click on it
function clearDirtyDishAt(sx,sy){
  for(var i=dishes.length-1;i>=0;i--){
    var d=dishes[i];if(d.phase!=='dirty')continue;
    var r=dishRect(d);if(r&&sx>=r.x&&sx<=r.x+r.w&&sy>=r.y&&sy<=r.y+r.h){dishes.splice(i,1);return true}
  }
  return false;
}
room.addEventListener('pointerdown',function(e){
  if(state!=='tavern'||e.button!==0)return;
  var rc=cv.getBoundingClientRect();if(!rc.width)return;
  if(clearDirtyDishAt((e.clientX-rc.left)/rc.width*W,(e.clientY-rc.top)/rc.height*H)){e.preventDefault();e.stopImmediatePropagation()}
},true);
function eatingGuest(g){
  for(var i=0;i<dishes.length;i++){var d=dishes[i];if(d.phase==='eating'&&d.t>EAT_DELAY&&d.seatId===g.seat.id)return d}
  return null;
}
// the guest tells what he thinks of the dish: too little / too much / something that should not be there (see js/quality.js)
function drawReactions(ctx,dt){
  for(var i=reactions.length-1;i>=0;i--){
    var r=reactions[i];r.t+=dt;
    if(r.t>7){reactions.splice(i,1);continue}
    if(r.t<1.4)continue;
    var g=null;guests.forEach(function(o){if(!g&&o.seat.table===r.table&&(o.mode==='seated'||o.ordered))g=o});
    if(!g)continue;
    var sp=seatPos(g),im=imgs[chKey(g,sitPose(g))],hh=im?im.naturalHeight*scaleAt(sp.y)*SIT_K:300;
    var iss=r.ev?r.ev.issues:[],l1=iss.length?iss[0]:'Odlično! Baš kako treba.',l2=iss.length>1?iss[1]:(r.delta>0?'Ugled kafane +'+r.delta:(r.delta<0?'Ugled kafane '+r.delta:''));
    drawBubble(ctx,sp.x,sp.y-hh,l1,l2);
  }
}
function drawOrderBubble(ctx){
  var w=waiter;if(!w||w.mode!=='serve'||w.t<.8)return;
  guests.forEach(function(g){
    if(g.seat.table!==w.table||g.mode!=='seated'||g.ordered)return;
    var t=orderText(g),sp=seatPos(g),im=imgs[chKey(g,sitPose(g))],hh=im?im.naturalHeight*scaleAt(sp.y)*SIT_K:300;
    drawBubble(ctx,sp.x,sp.y-hh,t.l1,t.l2);
  });
}
function drawWaiter(ctx){
  var w=waiter;if(!w||w.hidden)return;
  var sc=scaleAt(w.y),moving=(w.mode==='go'||w.mode==='back')&&w.path&&w.path[w.pi];
  drawShadow(ctx,w.x,w.y,sc);
  if(!moving){
    // taking the order (seen from the side): writes, now and then looks up at the guest; the other views only stand until their pictures exist
    if(w.mode==='serve'&&w.set==='walks'){
      var SEQW=[[1,.5],[2,.6],[3,.5],[2,.6]],tt=w.t%2.2,acc=0,wi=0;
      for(;wi<SEQW.length-1&&tt>=acc+SEQW[wi][1];wi++)acc+=SEQW[wi][1];
      var fw=(tt-acc)/SEQW[wi][1],nx=SEQW[(wi+1)%SEQW.length][0],fa=Math.max(0,Math.min(1,(fw-.7)/.3));
      drawSprite(ctx,'w_writes'+SEQW[wi][0],w.x,w.y,sc,w.flip,0,1);
      if(fa>0)drawSprite(ctx,'w_writes'+nx,w.x,w.y,sc,w.flip,0,fa);
      return;
    }
    drawSprite(ctx,'w_'+w.set+'2',w.x,w.y,sc,w.flip,0,1);return;
  }
  var ph=Math.abs(Math.sin(w.phase*Math.PI)),bob=ph*3.2*sc/.3;
  // walking. From the front and from behind the two pictures with a leg forward (1 and 3) are enough, one after the other. From the side
  // they look almost the same (a leg forward), so there the step has the middle picture (legs together, 2) too: 1, 2, 3, 2.
  // From the front and from behind the next picture fades in over the end of the step.
  var side=w.set==='walks'||w.set==='foods'||w.set==='drinks',SEQ=side?[1,2,3,2]:[1,3],NS=SEQ.length;
  var q=side?w.phase*2:w.phase,qi=Math.floor(q),fr=q-qi,f0=.3,f1=.9;
  // from the side the pictures differ in height (legs apart, legs together), so a blend would show two heads: there they just follow each other
  var fade=side?0:Math.max(0,Math.min(1,(fr-f0)/(f1-f0)));fade=fade*fade*(3-2*fade);
  drawSprite(ctx,'w_'+w.set+SEQ[qi%NS],w.x,w.y-bob,sc,w.flip,0,1);
  if(fade>0)drawSprite(ctx,'w_'+w.set+SEQ[(qi+1)%NS],w.x,w.y-bob,sc,w.flip,0,fade);
}
function seatPos(g){return{x:g.seat.x,y:g.seat.y}}
// the chairs on the right side of a table: the guest looks to the left, towards the others
function sitPose(g){return 'sedi_'+(g.seat.pose||'lice')}
function drawSprite(ctx,key,x,y,sc,flip,rot,alpha){
  var im=timgs[key]||imgs[key];if(!im)return;
  var w=(im.naturalWidth||im.width)*sc,h=(im.naturalHeight||im.height)*sc;
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
      var ed=eatingGuest(g),dip=0,tilt=0;
      if(ed){var ph=Math.max(0,Math.sin(ed.eatT*Math.PI/1.15*1)),dr=dishRect(ed);dip=ph*5*ssc/.3;tilt=ph*.035*((dr&&dr.x+dr.w/2<sp.x)?-1:1)}      // leans toward the bowl at every bite
      drawSprite(ctx,chKey(g,sitPose(g)),sp.x,sp.y+br+dip,ssc,false,Math.sin((clock+g.id)*.5)*.006+tilt,1);
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
  var list=guests.filter(function(g){return !(g.mode==='in'&&g.wait>0)}).map(function(g){return{y:guestSortY(g),g:g}});
  for(var at=0;at<TABLES.length;at++)(function(t){var my=TABLEMASKY[t];list.push({y:(my!=null?my:TABLES[t].y)+.02,ash:t})})(at);
  MASKS.forEach(function(m){list.push({y:m.y,m:m})});
  if(waiter)list.push({y:waiter.y,w:true});
  // a dish lies on the table: right above the cloth (and above the guests behind the table), but a guest who sits in front of the table covers it
  dishes.forEach(function(d){
    var tb=TABLES[d.table],dx=d.x!=null?d.x:(tb?tb.x:0),dy=d.y!=null?d.y:(tb?tb.y:0),my=-1e9;
    MASKS.forEach(function(m){if(pip(m.poly,dx,dy-4))my=Math.max(my,m.y)});            // the cloth (mask) of the table the dish stands on
    if(my<-1e8)my=TABLEMASKY[d.table]!=null?TABLEMASKY[d.table]:(tb?tb.y:0);
    list.push({y:my+.01,dish:d});
  });
  // a chair covers whoever walks behind it, but only while nobody sits on it
  WALKMASKS.forEach(function(m){
    var busy=guests.some(function(g){return g.seat.id===m.seat&&(g.mode==='sitting'||g.mode==='seated'||g.mode==='rising')});
    if(!busy)list.push({y:m.y,m:m});
  });
  list.sort(function(a,b){return a.y-b.y});
  list.forEach(function(o){if(o.g)drawGuest(ctx,o.g);else if(o.w)drawWaiter(ctx);else if(o.dish)drawDish(ctx,o.dish);else if(o.ash!==undefined)drawAsh(ctx,o.ash);else drawPolyFromPicture(ctx,o.m.poly)});
  drawReactions(ctx,.016);drawOrderBubble(ctx);
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
// the hall goes on also while the player is in the kitchen (guests come to the cleaned tables, the waiter takes the orders and walks to the kitchen):
// the picture is not drawn then, only the guests and the waiter are moved
var bgT=performance.now();
setInterval(function(){
  var now=performance.now(),el=Math.min(.5,(now-bgT)/1000);bgT=now;
  if(state!=='kitchen'||!GUESTS_ON)return;
  while(el>0){var d=Math.min(.05,el);step(d);el-=d}
},50);
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
  deliver:function(table,kind,ev,seatId,items){deliveries.push({table:table,kind:kind||'plain',ev:ev||null,seatId:seatId==null?-1:seatId,items:items||null})},
  reactions:function(){return reactions.slice()},serveSpot:serveSpot,
  tableItems:{get:function(){return TI},set:function(d){tiApply(d);try{localStorage.setItem(TI_KEY,JSON.stringify(TI))}catch(e){}},base:tiBase,src:tiSrc,filter:tiFilter,img:tiImg,pose:tiPose,draw:tiDraw,shadow:tiShadow,shDef:TI_SH},
  get isOpen(){return state==='tavern'},get busy(){return busy},
  debug:function(){return{dishes:dishes.map(function(d){return d.phase+':'+d.table+':'+Math.round(d.t)+':'+Math.round(d.eatT)}),deliveries:deliveries.length,waiter:waiter&&{mode:waiter.mode,x:Math.round(waiter.x),y:Math.round(waiter.y),set:waiter.set,table:waiter.table},guests:guests.map(function(g){return{id:g.id,ch:g.ch,mode:g.mode,x:Math.round(g.x),y:Math.round(g.y),seat:g.seat.id}}),seats:SEATS.length,free:SEATS.filter(function(s){return !s.taken}).length}},
  seats:SEATS,tables:TABLES,door:DOOR,roomSrc:ROOM,size:{w:W,h:H},
  seatReach:function(){return SEATS.map(seatReachable)},poseFromDir:poseFromDir,seatScale:function(y){return scaleAt(y)*SIT_K},
  poseInfo:function(pose){var im=imgs['g01_sedi_'+pose];return im?{src:im.src,w:im.naturalWidth,h:im.naturalHeight}:null},
  defaults:fileCal,spongeAt:spongeAt,idw:idw,spongeImg:SPONGE_IMG,spongeRadius:SPONGE_RADIUS,calibration:function(){return CAL},applyCalibration:function(c){applyCal(c)},calKey:CAL_KEY,waiterPath:waiterPath,waiterAutoRoute:waiterAutoRoute,waiterSpot:waiterSpot,waiterWalkable:waiterWalkable,
  fit:function(){fit();draw()},isOpenScene:function(){return state!=='kitchen'}
};
})();
