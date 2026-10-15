/* The cloth in the hand (kal_krpa): a net of points that have weight. The top of the cloth follows the mouse, the rest hangs, lags behind and sways (a simple Verlet simulation:
   gravity, sticks between the neighbouring points, a weak pull back to the picture so the cloth stays readable). The picture is drawn on a canvas over the net, triangle by triangle.
   It runs only while the cloth is in the hand (and in the short animation when the cloth is laid over the trough). The picture of the cloth in the hand that the game draws is hidden meanwhile. */
(function(){
'use strict';
if(window.CooksterCloth)return;
var ID='kal_krpa',SRC='assets/calibration_props/krpa/krpa_ruka.webp?v=1',NX=8,NY=12,AX=.53,AR=361/640;      // AX: where the tip of the cloth is in the picture (0..1); AR: width / height
var img=new Image();img.src=SRC;
var css=document.createElement('style');css.textContent='body.krpa-held .placement-ghost{clip-path:inset(50%)!important}#clothLayer{position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147482000}';
document.head.appendChild(css);
var mx=innerWidth/2,my=innerHeight/2,cv=null,cx=null,P=null,H=0,last=0,anim=null,lastMX=0,lastMY=0,on=false;
window.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;},true);
function held(){return typeof holding!=='undefined'&&holding&&holding.dataset&&holding.dataset.itemId===ID?holding:null;}
function sizeNow(){
  var g=document.querySelector('.ghost-item-copy img[src*="krpa"]'),r=g&&g.getBoundingClientRect();
  if(r&&r.height>20)return r.height;
  var h=held(),q=h&&h.getBoundingClientRect();return q&&q.height>20?q.height:106;
}
function build(ax,ay,h){
  H=h;var Wc=h*AR,pts=[],i,j;
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){var rx=(i/(NX-1)-AX)*Wc,ry=j/(NY-1)*h;pts.push({x:ax+rx,y:ay+ry,px:ax+rx,py:ay+ry,rx:rx,ry:ry,pin:j===0});}
  var st=[];function add(a,b){var A=pts[a],B=pts[b];st.push([a,b,Math.hypot(A.rx-B.rx,A.ry-B.ry)]);}
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){var k=j*NX+i;if(i<NX-1)add(k,k+1);if(j<NY-1)add(k,k+NX);if(i<NX-1&&j<NY-1){add(k,k+NX+1);add(k+1,k+NX);}if(i<NX-2)add(k,k+2);if(j<NY-2)add(k,k+2*NX);}
  P={pts:pts,st:st};
}
function layer(){
  if(cv&&cv.isConnected)return;
  cv=document.createElement('canvas');cv.id='clothLayer';cv.width=innerWidth;cv.height=innerHeight;document.body.appendChild(cv);cx=cv.getContext('2d');
}
function step(ax,ay,dt){
  var pts=P.pts,k,g=2600*dt*dt,i;
  for(k=0;k<pts.length;k++){var p=pts[k],v=k<NX?0:k/NX/(NY-1);
    if(p.pin){p.px=p.x;p.py=p.y;p.x=ax+p.rx;p.y=ay+p.ry;continue;}
    var vx=(p.x-p.px)*.985,vy=(p.y-p.py)*.985;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+g;
    var pull=.045*(1-v*.75);p.x+=(ax+p.rx-p.x)*pull;p.y+=(ay+p.ry-p.y)*pull*.5;      // a weak pull back to the picture (stronger near the hand)
  }
  for(i=0;i<5;i++)for(k=0;k<P.st.length;k++){
    var s=P.st[k],A=pts[s[0]],B=pts[s[1]],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||.0001,wa=A.pin?0:1,wb=B.pin?0:1,sm=wa+wb;
    if(!sm)continue;var cr=(d-s[2])/d/sm;
    A.x+=dx*cr*wa;A.y+=dy*cr*wa;B.x-=dx*cr*wb;B.y-=dy*cr*wb;
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
  if(!on){on=true;layer();build(ax,ay,anim?anim.H:sizeNow()*2.4);document.body.classList.add('krpa-held');}
  if(!cv||!cv.isConnected){layer();}
  if(cv.width!==innerWidth||cv.height!==innerHeight){cv.width=innerWidth;cv.height=innerHeight;}
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
window.CooksterCloth={_P:function(){return P;},dropOver:dropOver,active:function(){return on;}};
})();
