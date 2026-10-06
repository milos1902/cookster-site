/* Cookster - cleaning the tavern.
   The tavern shows the DIRTY picture on top of the CLEAN one. The dirt is a canvas: whatever is rubbed off it shows the clean picture below.
     - the sponge (hold the left mouse button and rub) cleans everything except the tables, slowly: a few passes are needed.
       It lies flat on the floor and the bar top, and is held upright against the walls and the front of the bar.
     - the tables are not cleaned with the sponge: right click on a table, then "Očisti sto"
   What the sponge cleans, and how it sits there, is taken from the tool "Kalibracija kafane":
     Sunđer: površine   - the surfaces (floor, walls, bar...) with the way the sponge sits on them
     Sunđer NE čisti    - the tables with their chairs
     Maska stola        - one shape per table, the table that is cleaned with the menu */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterTavernClean)return;
var W=T.size.w,H=T.size.h,DIRTY='assets/tavern/kafana_prljava.webp?v=1';
var IMG=T.spongeImg;                                  // the pictures of the sponge (size and the point where it touches the surface)
var RADIUS=46,SPACING=9,STRENGTH=.06;               // sponge: size, distance between two touches, how much one touch removes
var cv=room.querySelector('.ts-guests');
if(!cv)return;

function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}
var css=document.createElement('style');
css.textContent=
'#tavernScene{cursor:none}#tavernScene button,#tavernScene .tc-menu{cursor:pointer}'+
'#tavernScene .ts-add{display:none!important}'+
'#tavernScene .tc-dirt,#tavernScene .tc-fx{position:absolute;pointer-events:none}'+
'#tavernScene .tc-sponge{position:fixed;left:0;top:0;pointer-events:none;z-index:60;display:none;will-change:transform}'+
'#tavernScene .tc-sponge img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;-webkit-user-drag:none}'+
'#tavernScene .tc-sponge .tc-shadow{position:absolute;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.6),rgba(0,0,0,0) 70%)}'+
'#tavernScene .tc-info{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:70;padding:6px 14px;border-radius:9px;background:rgba(32,20,9,.82);border:1px solid #7a5428;color:#f3e3c2;font:600 14px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap}'+
'#tavernScene .tc-hint{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);z-index:70;padding:5px 12px;border-radius:8px;background:rgba(32,20,9,.7);color:#d9c69c;font:12px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap;transition:opacity .6s}'+
'#tavernScene .tc-reset{position:absolute;right:14px;top:12px;z-index:70;border:2px solid #351b0d;border-radius:9px;background:#e8c27a;color:#351b0d;font:700 13px/1 system-ui,sans-serif;padding:7px 12px;opacity:.85}'+
'#tavernScene .tc-reset:hover{opacity:1}'+
'#tavernScene .tc-menu{position:fixed;z-index:80;min-width:150px;padding:6px;border-radius:10px;background:#2a1a0b;border:1px solid #e8c27a;box-shadow:0 8px 24px rgba(0,0,0,.55);display:none}'+
'#tavernScene .tc-menu b{display:block;margin:2px 6px 6px;color:#d9c69c;font:600 12px system-ui,sans-serif}'+
'#tavernScene .tc-menu button{display:block;width:100%;padding:9px 12px;border:0;border-radius:7px;background:#e8c27a;color:#351b0d;font:700 14px system-ui,sans-serif;text-align:left}'+
'#tavernScene .tc-menu button:hover:not(:disabled){background:#ffd88a}'+
'#tavernScene .tc-menu button:disabled{opacity:.55;cursor:default}';
document.head.appendChild(css);

// ---------- the layers ----------
var dirt=mk('canvas','tc-dirt'),fx=mk('canvas','tc-fx');
dirt.width=W;dirt.height=H;fx.width=W;fx.height=H;
cv.parentNode.insertBefore(dirt,cv);cv.parentNode.insertBefore(fx,cv.nextSibling);
var D=dirt.getContext('2d'),X=fx.getContext('2d');
T.dirtCanvas=dirt;                                    // the scene redraws parts of the picture over the guests, with the dirt that is still on it
var dirtyImg=new Image(),dirtyOk=false;
function paintDirt(){
  D.globalCompositeOperation='source-over';D.clearRect(0,0,W,H);
  if(dirtyOk)D.drawImage(dirtyImg,0,0,W,H);
}
dirtyImg.onload=function(){dirtyOk=true;paintDirt();refreshInfo()};
dirtyImg.src=DIRTY;
var cleanImg=new Image();cleanImg.src=T.roomSrc;           // the clean picture: the difference to the dirty one is what lies on the tables
// the dirt and the effects lie exactly over the picture, wherever the scene puts it
function sync(){
  ['left','top','width','height'].forEach(function(k){dirt.style[k]=cv.style[k];fx.style[k]=cv.style[k]});
}
new MutationObserver(sync).observe(cv,{attributes:true,attributeFilter:['style']});
addEventListener('resize',sync);sync();

// ---------- what may be cleaned ----------
var calRef=null,floorMask=null,zones=[],areas=[],cleaned=[];
function polyPath(c,p){c.beginPath();p.forEach(function(q,i){if(i)c.lineTo(q[0],q[1]);else c.moveTo(q[0],q[1])});c.closePath()}
function pip(p,x,y){var ins=false;for(var i=0,j=p.length-1;i<p.length;j=i++){var a=p[i],b=p[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))ins=!ins}return ins}
function prepare(){
  var cal=T.calibration();if(!cal||cal===calRef)return;
  calRef=cal;
  floorMask=mk('canvas');floorMask.width=W;floorMask.height=H;
  var f=floorMask.getContext('2d');
  f.fillStyle='#fff';(cal.surfaces||[]).forEach(function(sf){sf.polys.forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}})});
  f.globalCompositeOperation='destination-out';
  (cal.cleanExclude||[]).forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}});
  zones=cal.tableMask.filter(function(p){return p.length>=3});
  // "Očisti sto" also cleans what is under and around the table: every blocked shape (table with its chairs) that holds the table
  areas=zones.map(function(z){
    var c=center(z),list=[z];
    (cal.cleanExclude||[]).forEach(function(b){if(b.length>=3&&pip(b,c[0],c[1]))list.push(b)});
    return list;
  });
  while(cleaned.length<zones.length)cleaned.push(false);
  cleaned.length=zones.length;
  small=null;
}

// ---------- the sponge ----------
var scratch=mk('canvas');
// the sponge lies flat on the floor: seen from above at an angle its footprint is a flattened ellipse, and it is smaller farther away.
// Held against a wall it touches in a round patch.
function flatOf(q){return IMG[q.img].flat*q.flat}
function sp(x,y){return T.spongeAt(Math.max(0,Math.min(W,x)),Math.max(0,Math.min(H,y)))}      // size, flatness ... at that place (from the tool)
function depthK(x,y){return sp(x,y).scale}
function stamp(x,y){
  var q=sp(x,y),k=q.scale,rx=Math.round(RADIUS*k),ry=Math.max(2,Math.round(rx*flatOf(q))),sc=scratch.getContext('2d');
  scratch.width=rx*2;scratch.height=ry*2;
  sc.setTransform(1,0,0,ry/rx,rx,ry);
  var g=sc.createRadialGradient(0,0,0,0,0,rx);
  g.addColorStop(0,'rgba(0,0,0,'+STRENGTH+')');g.addColorStop(.6,'rgba(0,0,0,'+STRENGTH*.7+')');g.addColorStop(1,'rgba(0,0,0,0)');
  sc.fillStyle=g;sc.fillRect(-rx,-rx,rx*2,rx*2);
  sc.setTransform(1,0,0,1,0,0);
  sc.globalCompositeOperation='destination-in';           // only where the floor is
  sc.drawImage(floorMask,-(x-rx),-(y-ry));
  D.globalCompositeOperation='destination-out';
  D.drawImage(scratch,x-rx,y-ry);
  D.globalCompositeOperation='source-over';
}
function rubTo(x,y){
  prepare();
  if(!last){last={x:x,y:y};stamp(x,y);return}
  var step=SPACING*depthK(x,y),dx=x-last.x,dy=y-last.y,d=Math.hypot(dx,dy),n=Math.floor(d/step);
  if(n>0){
    rubbed+=n*step;
    var ux=dx/d,uy=dy/d;
    for(var i=1;i<=n;i++)stamp(last.x+ux*step*i,last.y+uy*step*i);
    last={x:last.x+ux*step*n,y:last.y+uy*step*n};
  }
  if(now()-lastBubble>45&&d>2){lastBubble=now();bubble(x,y,1)}
}

// ---------- soap bubbles ----------
var parts=[],loop=false,lastBubble=0;
function now(){return performance.now()}
function bubble(x,y,n){
  for(var i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*RADIUS*1.2,y:y+(Math.random()-.5)*RADIUS*.8,r:3+Math.random()*7,vy:-8-Math.random()*14,vx:(Math.random()-.5)*10,t:0,life:.7+Math.random()*.7});
  if(!loop){loop=true;requestAnimationFrame(frame)}
}
var prevT=0;
function frame(t){
  var dt=Math.min(.05,(t-prevT)/1000||.016);prevT=t;
  X.clearRect(0,0,W,H);
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i];p.t+=dt;if(p.t>=p.life){parts.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    var a=1-p.t/p.life;
    X.beginPath();X.arc(p.x,p.y,p.r,0,Math.PI*2);X.fillStyle='rgba(255,255,255,'+(.22*a)+')';X.fill();
    X.lineWidth=1.2;X.strokeStyle='rgba(255,255,255,'+(.7*a)+')';X.stroke();
    X.beginPath();X.arc(p.x-p.r*.35,p.y-p.r*.35,p.r*.25,0,Math.PI*2);X.fillStyle='rgba(255,255,255,'+(.9*a)+')';X.fill();
  }
  if(parts.length)requestAnimationFrame(frame);else{loop=false;X.clearRect(0,0,W,H)}
}

// ---------- the table ----------
// what sticks up above a table (the tops of the bottles, the jug...) is outside its shape, so it is found by comparing the two pictures:
// inside a band above the table, whatever differs between the dirty and the clean picture is cleaned together with the table
var RISE=170;
function riseMask(poly){
  if(!cleanImg.complete||!cleanImg.naturalWidth||!dirtyOk)return null;
  var band=mk('canvas');band.width=W;band.height=H;var b=band.getContext('2d');
  b.fillStyle='#fff';
  for(var dy=0;dy<=RISE;dy+=5){b.save();b.translate(0,-dy);polyPath(b,poly);b.fill();b.restore()}
  var ca=mk('canvas');ca.width=W;ca.height=H;var cc=ca.getContext('2d',{willReadFrequently:true});cc.drawImage(cleanImg,0,0,W,H);
  var da=mk('canvas');da.width=W;da.height=H;var dc=da.getContext('2d',{willReadFrequently:true});dc.drawImage(dirtyImg,0,0,W,H);
  var A=cc.getImageData(0,0,W,H).data,B=dc.getImageData(0,0,W,H).data,M=b.getImageData(0,0,W,H),m=M.data;
  for(var i=0;i<m.length;i+=4){
    if(m[i+3]<128){m[i+3]=0;continue}
    var d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]);
    m[i]=m[i+1]=m[i+2]=0;m[i+3]=d>70?255:0;
  }
  b.putImageData(M,0,0);
  // grow it a little, so the edges of the bottles are cleaned too
  var out=mk('canvas');out.width=W;out.height=H;var o=out.getContext('2d');
  for(var ox=-3;ox<=3;ox+=3)for(var oy=-3;oy<=3;oy+=3)o.drawImage(band,ox,oy);
  return out;
}
function cleanZone(i){
  var poly=zones[i];if(!poly||cleaned[i]||cleaning[i])return;
  cleaning[i]=true;
  var N=16,k=0,rise=riseMask(poly);
  (function step(){
    var a=1/(N-k);                                      // the last step takes whatever is left
    D.globalCompositeOperation='destination-out';D.fillStyle='rgba(0,0,0,'+a+')';
    (areas[i]||[poly]).forEach(function(ar){polyPath(D,ar);D.fill()});
    if(rise){D.globalAlpha=a;D.drawImage(rise,0,0);D.globalAlpha=1}
    D.globalCompositeOperation='source-over';
    if(k%3===0){var q=poly[Math.floor(Math.random()*poly.length)],c=center(poly);bubble(c[0]+(q[0]-c[0])*Math.random()*.8,c[1]+(q[1]-c[1])*Math.random()*.8,2)}
    if(++k<N)setTimeout(step,45);else{cleaned[i]=true;cleaning[i]=false;refreshInfo()}
  })();
}
var cleaning={};
function center(p){var x=0,y=0;p.forEach(function(q){x+=q[0];y+=q[1]});return[x/p.length,y/p.length]}

// ---------- the numbers ----------
var info=mk('div','tc-info'),hint=mk('div','tc-hint'),reset=mk('button','tc-reset'),sponge=mk('div','tc-sponge'),menu=mk('div','tc-menu');
reset.type='button';reset.textContent='↺ zaprljaj opet';
hint.textContent='Drži levi klik i trljaj (pod, zidove, šank...) · Desni klik na sto → „Očisti sto“ (čisti i pod ispod stola)';
// the sponge: lying (three pictures: dry, soapy while it is pressed, dirty after a lot of cleaning) or upright (one picture, tinted when it is dirty)
sponge.innerHTML='<div class="tc-shadow"></div><img alt="" draggable="false" src="'+IMG.lezeci.states.suv+'">';
var spImg=sponge.querySelector('img'),spShadow=sponge.querySelector('.tc-shadow'),spKey='lezeci',spState='suv';
Object.keys(IMG).forEach(function(k){var c=IMG[k];[c.src].concat(c.states?Object.keys(c.states).map(function(n){return c.states[n]}):[]).forEach(function(u){var i=new Image();i.src=u})});
var rubbed=0,DIRTY_AFTER=3500;                         // how far the sponge has been rubbed (scene pixels); after that it is dirty
var TINT={suv:'none',sapun:'brightness(1.08) saturate(.9)',prljav:'brightness(.78) sepia(.55) saturate(.85)'};
function spongeLook(key){
  var st=down?'sapun':(rubbed>DIRTY_AFTER?'prljav':'suv'),c=IMG[key],src=c.states?c.states[st]:c.src;
  if(key!==spKey||st!==spState){
    spKey=key;spState=st;
    if(spImg.getAttribute('src')!==src)spImg.src=src;
    spImg.style.filter=c.states?'none':TINT[st];
  }
}
menu.innerHTML='<b></b><button type="button"></button>';
room.appendChild(info);room.appendChild(hint);room.appendChild(reset);room.appendChild(sponge);room.appendChild(menu);

var small=null;
function floorPercent(){
  prepare();if(!floorMask||!dirtyOk)return 0;
  var w=Math.round(W/6),h=Math.round(H/6);
  if(!small){
    var fm=mk('canvas');fm.width=w;fm.height=h;fm.getContext('2d').drawImage(floorMask,0,0,w,h);
    small={cv:mk('canvas'),mask:fm.getContext('2d').getImageData(0,0,w,h).data,w:w,h:h};small.cv.width=w;small.cv.height=h;
  }
  var sc=small.cv.getContext('2d');sc.clearRect(0,0,w,h);sc.drawImage(dirt,0,0,w,h);
  var d=sc.getImageData(0,0,w,h).data,m=small.mask,tot=0,rem=0;
  for(var i=3;i<d.length;i+=4){if(m[i]>128){tot++;rem+=d[i]/255}}
  return tot?Math.round((1-rem/tot)*100):0;
}
function refreshInfo(){
  prepare();
  var n=cleaned.filter(Boolean).length;
  info.textContent='Kafana: '+floorPercent()+'% čista  ·  Stolovi: '+n+' / '+zones.length+' čisti';
}
setInterval(function(){if(T.isOpen)refreshInfo()},500);

// ---------- the mouse ----------
var down=false,last=null,lastPos=null;
function toScene(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
function overUi(e){return !!(e.target.closest&&e.target.closest('button,.tc-menu'))}
function moveSponge(e){
  var over=overUi(e);
  sponge.style.display=over||!T.isOpen?'none':'block';
  room.style.cursor=over?'pointer':'none';
  var p=toScene(e),q=sp(p.x,p.y),c=IMG[q.img],r=cv.getBoundingClientRect(),ss=r.width/W;
  var w=c.w,h=Math.round(c.w*c.ratio),ax=Math.round(c.ax*w),ay=Math.round(c.ay*h),lying=q.kind==='h';
  var vx=lastPos?e.clientX-lastPos.x:0;lastPos={x:e.clientX,y:e.clientY};
  // it slides: it leans a little in the direction it is pushed; a lying sponge is lifted when it does not touch the surface
  var sk=down?Math.max(-12,Math.min(12,vx*.5)):0,lift=lying?(down?2:q.lift):0;
  sponge.style.width=w+'px';sponge.style.height=h+'px';sponge.style.transformOrigin=ax+'px '+ay+'px';
  sponge.style.left=(e.clientX-ax)+'px';sponge.style.top=(e.clientY-ay)+'px';
  sponge.style.transform='scale('+(q.scale*ss)+','+(q.scale*ss*q.flat)+') rotate('+q.angle+'deg) skewX('+(q.skew-sk)+'deg)';
  spImg.style.transform='translateY('+(-lift)+'px)';
  spShadow.style.display=lying?'block':'none';
  spShadow.style.left=(ax-w*.6)+'px';spShadow.style.top=(ay-w*.17)+'px';spShadow.style.width=(w*1.2)+'px';spShadow.style.height=(w*.34)+'px';
  spShadow.style.opacity=down?Math.min(1,q.shadow*1.8):q.shadow;
  spongeLook(q.img);
}
function hideMenu(){menu.style.display='none'}
room.addEventListener('pointerdown',function(e){
  if(e.button!==0||overUi(e)){if(e.button===0&&!e.target.closest('.tc-menu'))hideMenu();return}
  hideMenu();
  down=true;sponge.classList.add('down');last=null;
  try{room.setPointerCapture(e.pointerId)}catch(_){}
  var p=toScene(e);rubTo(p.x,p.y);moveSponge(e);
});
room.addEventListener('pointermove',function(e){
  moveSponge(e);
  if(down){var p=toScene(e);rubTo(p.x,p.y)}
});
function release(e){
  if(!down)return;down=false;last=null;sponge.classList.remove('down');
  try{room.releasePointerCapture(e.pointerId)}catch(_){}
  refreshInfo();moveSponge(e);
}
room.addEventListener('pointerup',release);room.addEventListener('pointercancel',release);
room.addEventListener('pointerleave',function(){if(!down)sponge.style.display='none'});
room.addEventListener('contextmenu',function(e){
  e.preventDefault();
  if(overUi(e))return;
  prepare();
  var p=toScene(e),zi=-1;
  for(var i=0;i<zones.length;i++)if(pip(zones[i],p.x,p.y)){zi=i;break}
  if(zi<0){hideMenu();return}
  var btn=menu.querySelector('button');
  menu.querySelector('b').textContent='Sto '+(zi+1);
  btn.textContent=cleaned[zi]?'✓ Sto je čist':'Očisti sto (i pod ispod)';btn.disabled=!!cleaned[zi];
  btn.onclick=function(ev){ev.stopPropagation();hideMenu();cleanZone(zi)};
  menu.style.left=Math.min(e.clientX,innerWidth-170)+'px';menu.style.top=Math.min(e.clientY,innerHeight-90)+'px';menu.style.display='block';
  sponge.style.display='none';
});
reset.addEventListener('click',function(e){
  e.stopPropagation();rubbed=0;paintDirt();cleaned=zones.map(function(){return false});cleaning={};hideMenu();refreshInfo();
});
// the hint fades once the player has started cleaning
var hinted=false;
room.addEventListener('pointerdown',function(){if(!hinted){hinted=true;setTimeout(function(){hint.style.opacity='0'},4000)}},true);

window.CooksterTavernClean={reset:function(){reset.click()},floorPercent:floorPercent,zones:function(){return zones.length},cleaned:function(){return cleaned.slice()}};
})();
