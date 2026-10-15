/* The things that hang from the hand (the cloth kal_krpa and the risen dough kal_testo_naraslo): a net of points that have weight. The top of the cloth follows the mouse, the rest hangs, lags behind and sways (a simple Verlet simulation:
   gravity, sticks between the neighbouring points, a weak pull back to the picture so the cloth stays readable). The picture is drawn on a canvas over the net, triangle by triangle.
   It runs only while the cloth is in the hand (and in the short animation when the cloth is laid over the trough). The picture of the cloth in the hand that the game draws is hidden meanwhile. */
(function(){
'use strict';
if(window.CooksterCloth)return;
/* AX: where the hand holds the picture (0..1 across); AR: width / height; size: how many times the picture of the item in the game; pins: the columns of the top row that are held by the hand (null = the whole row);
   grav: gravity; damp: how much movement is kept in one step (1 = never stops); pull: the pull back to the picture; mass: how much heavier the bottom is than the top; flutter: the strength of the air; grow: how fast the dough stretches */
var KINDS={
  krpa:{id:'kal_krpa',src:'assets/calibration_props/krpa/krpa_ruka.webp?v=1',key:'krpa',nx:12,ny:18,ax:.53,ar:361/640,size:1,pins:null,grav:4200,damp:.988,pull:.012,mass:2.4,flutter:.45,grow:0,iters:8,bend:.78,sep:.75,follow:11},
  testo:{id:'kal_testo_naraslo',src:'assets/flour/testo_kugla.webp?v=2',key:'testo_kugla',nx:8,ny:8,ax:.5,ar:1,size:1.15,pins:[3,4],grav:3400,damp:.985,pull:.0015,mass:2.2,flutter:0,grow:.085,iters:6,bend:0,sep:0,follow:0}
};
var NX=12,NY=18,K=KINDS.krpa,AX=.53,AR=361/640,ID=K.id,img=new Image(),imgs={};
Object.keys(KINDS).forEach(function(k){var i=new Image();i.src=KINDS[k].src;imgs[k]=i;});img=imgs.krpa;
var css=document.createElement('style');css.textContent='body.krpa-held .placement-ghost{clip-path:inset(50%)!important}#clothLayer{position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147482000}';
document.head.appendChild(css);
var mx=innerWidth/2,my=innerHeight/2,cv=null,cx=null,P=null,H=0,last=0,anim=null,lastMX=0,lastMY=0,on=false,kname='krpa',age=0,spd=0,tm=0,warned=false,sax=0,say=0,sepN=0;
window.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;},true);
function held(){
  if(typeof holding==='undefined'||!holding||!holding.dataset)return null;
  for(var k in KINDS)if(KINDS[k].id===holding.dataset.itemId){if(k!==kname&&on)stop();kname=k;K=KINDS[k];NX=K.nx;NY=K.ny;AX=K.ax;AR=K.ar;img=imgs[k];return holding;}
  return null;
}
function sizeNow(){
  var g=document.querySelector('.ghost-item-copy img[src*="'+K.key+'"]'),r=g&&g.getBoundingClientRect();
  if(r&&r.height>20)return r.height;
  var h=held(),q=h&&h.getBoundingClientRect();return q&&q.height>20?q.height:(kname==='krpa'?106:90);
}
function build(ax,ay,h){
  H=h;var Wc=h*AR,pts=[],i,j;
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){var rx=(i/(NX-1)-AX)*Wc,ry=j/(NY-1)*h,vv=j/(NY-1);pts.push({x:ax+rx,y:ay+ry,px:ax+rx,py:ay+ry,rx:rx,ry:ry,pin:j===0&&(!K.pins||K.pins.indexOf(i)>=0),m:1+K.mass*vv*vv,col:i,row:j});}
  age=0;warned=false;
  var st=[];function add(a,b,t){var A=pts[a],B=pts[b];st.push([a,b,Math.hypot(A.rx-B.rx,A.ry-B.ry),B.rx-A.rx,B.ry-A.ry,t||0]);}
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){var k=j*NX+i;if(i<NX-1)add(k,k+1);if(j<NY-1)add(k,k+NX);if(i<NX-1&&j<NY-1){add(k,k+NX+1);add(k+1,k+NX);}if(i<NX-2)add(k,k+2,1);if(j<NY-2)add(k,k+2*NX,1);if(i<NX-3)add(k,k+3,1);if(j<NY-3)add(k,k+3*NX,1);}
  P={pts:pts,st:st,cell:Math.min(Wc/(NX-1),h/(NY-1))};sax=ax;say=ay;
}
function layer(){
  if(cv&&cv.isConnected)return;
  cv=document.createElement('canvas');cv.id='clothLayer';cv.width=innerWidth;cv.height=innerHeight;document.body.appendChild(cv);cx=cv.getContext('2d');
}
function step(ax,ay,dt){
  var pts=P.pts,k,g=K.grav*dt*dt,i,sc=1+Math.min(1.3,age*K.grow),sq=1/Math.sqrt(sc),wind=K.flutter*(260+Math.min(1400,spd)*.9)*dt*dt;
  for(k=0;k<pts.length;k++){var p=pts[k],v=p.row/(NY-1);
    if(p.pin){p.px=p.x;p.py=p.y;p.x=ax+p.rx;p.y=ay+p.ry;continue;}
    var vx=(p.x-p.px)*K.damp,vy=(p.y-p.py)*K.damp,vm=Math.hypot(vx,vy),vc=P.cell*1.4;if(vm>vc){vx*=vc/vm;vy*=vc/vm;}      // no point runs more than a little in one step
    p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+g*(1+1.6*v);      // gravity: the lower part of the cloth is pulled harder
    if(wind){var ph=tm*3.3+p.col*.75+p.row*.55;p.x+=Math.sin(ph)*wind*v;p.y-=Math.cos(ph*.8+1)*wind*.35*v;}      // the air: the cloth flutters, more when it is moved fast
    var pull=K.pull*(1-v*.75);p.x+=(ax+p.rx-p.x)*pull;if(!K.grow)p.y+=(ay+p.ry-p.y)*pull*.5;      // a weak pull back to the picture (stronger near the hand)
  }
  for(i=0;i<K.iters;i++)for(k=0;k<P.st.length;k++){
    var s=P.st[k],A=pts[s[0]],B=pts[s[1]],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||.0001,wa=A.pin?0:1/A.m,wb=B.pin?0:1/B.m,sm=wa+wb,L=s[2];
    if(!sm)continue;
    if(K.grow)L=Math.hypot(s[3]*sq,s[4]*sc);      // the dough is pulled by its own weight: it gets longer and thinner (the volume stays)
    if(s[5]&&K.bend&&d>=L*K.bend)continue;      // a bend stick only stops the cloth from folding too sharply (it does not hold it stretched)
    var cr=(s[5]&&K.bend?(d-L*K.bend):(d-L))/d/sm;
    A.x+=dx*cr*wa;A.y+=dy*cr*wa;B.x-=dx*cr*wb;B.y-=dy*cr*wb;
  }
  if(K.sep&&(sepN++&1)){      // (every second step is enough) the points that are not neighbours do not go into each other: the cloth folds in soft layers, it does not crumple into a knot
    var md=P.cell*K.sep,n=pts.length,a,b;
    for(a=0;a<n;a++){var A2=pts[a];for(b=a+1;b<n;b++){var B2=pts[b];
      if(Math.abs(A2.col-B2.col)<=2&&Math.abs(A2.row-B2.row)<=2)continue;
      var ddx=B2.x-A2.x;if(ddx>md||ddx<-md)continue;var ddy=B2.y-A2.y;if(ddy>md||ddy<-md)continue;
      var dd=Math.hypot(ddx,ddy);if(dd>=md||dd<.0001)continue;
      var w1=A2.pin?0:1/A2.m,w2=B2.pin?0:1/B2.m,ws=w1+w2;if(!ws)continue;var pc=(md-dd)/dd*.5/ws;
      A2.x-=ddx*pc*w1;A2.y-=ddy*pc*w1;B2.x+=ddx*pc*w2;B2.y+=ddy*pc*w2;}}
  }
}
function tri(c,x0,y0,x1,y1,x2,y2,u0,v0,u1,v1,u2,v2){
  var mxc=(x0+x1+x2)/3,myc=(y0+y1+y2)/3,e=.8;function ex(x,y){var dx=x-mxc,dy=y-myc,l=Math.hypot(dx,dy)||1;return [x+dx/l*e,y+dy/l*e];}
  var a=ex(x0,y0),b=ex(x1,y1),d=ex(x2,y2);
  c.save();c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(d[0],d[1]);c.closePath();c.clip();
  var den=u0*(v2-v1)-u1*v2+u2*v1+(u1-u2)*v0;if(Math.abs(den)<1e-6){c.restore();return;}
  var m11=-(v0*(x2-x1)-v1*x2+v2*x1+(v1-v2)*x0)/den,m12=(v1*y2+v0*(y1-y2)-v2*y1+(v2-v1)*y0)/den,
      m21=(u0*(x2-x1)-u1*x2+u2*x1+(u1-u2)*x0)/den,m22=-(u1*y2+u0*(y1-y2)-u2*y1+(u2-u1)*y0)/den,
      dx=(u0*(v2*x1-v1*x2)+v0*(u1*x2-u2*x1)+(u2*v1-u1*v2)*x0)/den,dy=(u0*(v2*y1-v1*y2)+v0*(u1*y2-u2*y1)+(u2*v1-u1*v2)*y0)/den;
  c.setTransform(m11,m12,m21,m22,dx,dy);c.drawImage(img,0,0);c.restore();
}
function draw(alpha){
  cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);
  if(!img.complete||!img.naturalWidth)return;
  var iw=img.naturalWidth,ih=img.naturalHeight,pts=P.pts,i,j;
  cx.globalAlpha=alpha;
  for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){
    var a=pts[j*NX+i],b=pts[j*NX+i+1],c2=pts[(j+1)*NX+i],d=pts[(j+1)*NX+i+1],
        u0=i/(NX-1)*iw,u1=(i+1)/(NX-1)*iw,v0=j/(NY-1)*ih,v1=(j+1)/(NY-1)*ih;
    tri(cx,a.x,a.y,b.x,b.y,c2.x,c2.y,u0,v0,u1,v0,u0,v1);
    tri(cx,b.x,b.y,d.x,d.y,c2.x,c2.y,u1,v0,u1,v1,u0,v1);
  }
  cx.globalAlpha=1;
}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function stop(){
  on=false;P=null;if(cv){cv.remove();cv=null;}document.body.classList.remove('krpa-held');
}
function tick(now){
  requestAnimationFrame(tick);
  var h=held(),ax=mx,ay=my,alpha=1;
  if(!h&&!anim){if(on)stop();return;}
  var dt=Math.min(.033,(now-last)/1000||.016);last=now;
  if(anim){
    var t=(now-anim.t0)/1000,T1=.5,T2=.5;
    if(t<T1){var k=ease(t/T1);ax=anim.x0+(anim.tx-anim.x0)*k;ay=anim.y0+(anim.ty1-anim.y0)*k;}
    else{var k2=Math.min(1,(t-T1)/T2);ax=anim.tx;ay=anim.ty1+(anim.ty2-anim.ty1)*ease(k2);alpha=1-Math.max(0,(k2-.3)/.7);
      if(!anim.fired){anim.fired=true;try{anim.cb&&anim.cb();}catch(e){}}
      if(k2>=1){anim=null;stop();return;}}
  }
  if(!on){on=true;layer();build(ax,ay,anim?anim.H:sizeNow()*K.size);document.body.classList.add('krpa-held');}
  if(!cv||!cv.isConnected){layer();}
  if(cv.width!==innerWidth||cv.height!==innerHeight){cv.width=innerWidth;cv.height=innerHeight;}
  spd=spd*.85+Math.hypot(ax-lastMX,ay-lastMY)/Math.max(.008,dt)*.15;lastMX=ax;lastMY=ay;tm+=dt;age+=dt;
  if(K.grow&&!warned&&age>5){warned=true;try{showToast('Testo se razvlači, spusti ga na sto!');}catch(e){}}
  if(K.follow&&!anim){sax+=(ax-sax)*Math.min(1,dt*K.follow);say+=(ay-say)*Math.min(1,dt*K.follow);ax=sax;ay=say;}      // the hand pulls the cloth softly, a quick flick of the mouse does not whip it
  else{sax=ax;say=ay;}
  step(ax,ay,1/120);step(ax,ay,1/120);
  draw(alpha);
}
requestAnimationFrame(tick);
/* the cloth is laid over a trough: it flies over it, sinks and melts into the picture of the covered trough (cb is called when it starts to melt) */
function dropOver(tr,cb){
  if(anim||!P)return false;
  var r=tr.getBoundingClientRect();
  anim={t0:performance.now(),x0:mx,y0:my,tx:r.left+r.width/2+(AX-.5)*0+0,ty1:r.top-H*.25,ty2:r.top+r.height*.12,H:H,cb:cb,fired:false};
  return true;
}
/* the cloth hangs on the rail at the stove (next to the old towel) and is taken from there; when it is in the hand, on the table or over a trough, it is not on the rail */
var HOOK={x:1608,y:457,h:254},hook=null,hookA=null;
function hookEl(){
  if(hook&&hook.isConnected)return hook;
  var sc=document.getElementById('scene');if(!sc)return null;
  hook=document.createElement('img');hook.src=KINDS.krpa.src;hook.draggable=false;hook.className='krpa-hook';
  var w=HOOK.h*KINDS.krpa.ar;
  hook.style.cssText='position:absolute;left:'+(HOOK.x-KINDS.krpa.ax*w)+'px;top:'+HOOK.y+'px;height:'+HOOK.h+'px;width:'+w+'px;pointer-events:none;z-index:40;transform-origin:'+(KINDS.krpa.ax*100)+'% 0;animation:krpaSway 5s ease-in-out infinite;user-select:none';
  sc.appendChild(hook);
  var cs=document.createElement('canvas'),im=imgs.krpa;cs.width=64;cs.height=112;
  var draw=function(){try{cs.getContext('2d').drawImage(im,0,0,64,112);hookA=cs.getContext('2d').getImageData(0,0,64,112).data;}catch(e){hookA=null;}};
  if(im.complete&&im.naturalWidth)draw();else im.addEventListener('load',draw);
  return hook;
}
(function(){var st=document.createElement('style');st.textContent='@keyframes krpaSway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}';document.head.appendChild(st);})();
function krpaGone(){
  if(typeof holding!=='undefined'&&holding&&holding.dataset&&holding.dataset.itemId===ID)return true;
  if(anim||on&&kname==='krpa')return true;
  var l=(typeof items!=='undefined'?items:[]);
  for(var i=0;i<l.length;i++){var e=l[i];if(e&&e.dataset&&(e.dataset.itemId===ID||(e.dataset.itemId==='nacve'&&e.dataset.inCloth==='1')))return true;}
  return false;
}
setInterval(function(){var h=hookEl();if(h)h.style.display=krpaGone()?'none':'';},300);
function overHook(x,y){
  if(!hook||!hook.isConnected||hook.style.display==='none'||!hookA)return false;
  var r=hook.getBoundingClientRect(),u=(x-r.left)/r.width,v=(y-r.top)/r.height;
  if(u<0||u>1||v<0||v>1)return false;
  var px=Math.min(63,Math.floor(u*64)),py=Math.min(111,Math.floor(v*112)),a=0;
  for(var dx=-2;dx<=2;dx++)for(var dy=-2;dy<=2;dy++){var X=Math.max(0,Math.min(63,px+dx)),Y=Math.max(0,Math.min(111,py+dy));a=Math.max(a,hookA[(Y*64+X)*4+3]);}
  return a>40;
}
function give(){
  var d;try{d=kitchenEquipmentDef(ID);}catch(e){}
  if(!d||(typeof holding!=='undefined'&&holding))return false;
  var el=makeItem({...d,instanceId:nextItemInstanceId(d.id),x:700-d.w/2,y:560-d.h,z:++zCounter});if(!el)return false;
  el.dataset.surfaceZone='table';setPose(el,700,560,surfaceScaleFor(el,'table',560));el.dataset.noFlash='1';el.style.visibility='hidden';setTimeout(function(){delete el.dataset.noFlash;},1500);
  startHolding(el);try{CooksterSave.schedule();}catch(e){}return true;
}
window.addEventListener('pointerdown',function(e){
  if(e.button!==0||(typeof holding!=='undefined'&&holding))return;
  if(e.target&&e.target.closest&&e.target.closest('#hud,[data-tool-ui],.cookster-ctx,#toolDock'))return;
  if(!overHook(e.clientX,e.clientY))return;
  if(give()){e.stopImmediatePropagation();e.preventDefault();}
},true);
window.addEventListener('pointermove',function(e){
  if(typeof holding!=='undefined'&&holding)return;
  if(overHook(e.clientX,e.clientY)){hook.style.filter='drop-shadow(0 0 1px #46d45c) drop-shadow(0 0 1px #46d45c)';}else if(hook)hook.style.filter='';
},true);
window.CooksterCloth={_P:function(){return P;},dropOver:dropOver,give:give,active:function(){return on;}};
})();
