/* Cookster - cleaning the tavern.
   The tavern shows the DIRTY picture on top of the CLEAN one. The dirt is a canvas: whatever is rubbed off it shows the clean picture below.
     - the sponge (hold the left mouse button and rub) cleans the FLOOR only, slowly: a few passes are needed
     - the tables are not cleaned with the sponge: right click on a table, then "Očisti sto"
   Where the floor is, and where the tables are, is taken from the tool "Kalibracija kafane":
     Pod (floor) minus Zabrana (blocked)   - what the sponge cleans
     Maska stola (table mask)               - one shape per table, the table that is cleaned with the menu */
(function(){
'use strict';
var T=window.CooksterTavern,room=document.getElementById('tavernScene');
if(!T||!room||window.CooksterTavernClean)return;
var W=T.size.w,H=T.size.h,DIRTY='assets/tavern/kafana_prljava.webp?v=1';
var RADIUS=46,SPACING=9,STRENGTH=.06;               // sponge: size, distance between two touches, how much one touch removes
var cv=room.querySelector('.ts-guests');
if(!cv)return;

function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e}
var css=document.createElement('style');
css.textContent=
'#tavernScene{cursor:none}#tavernScene button,#tavernScene .tc-menu{cursor:pointer}'+
'#tavernScene .ts-add{display:none!important}'+
'#tavernScene .tc-dirt,#tavernScene .tc-fx{position:absolute;pointer-events:none}'+
'#tavernScene .tc-sponge{position:fixed;left:0;top:0;width:120px;height:84px;transform-origin:60px 62px;pointer-events:none;z-index:60;display:none;will-change:transform}'+
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
var dirtyImg=new Image(),dirtyOk=false;
function paintDirt(){
  D.globalCompositeOperation='source-over';D.clearRect(0,0,W,H);
  if(dirtyOk)D.drawImage(dirtyImg,0,0,W,H);
}
dirtyImg.onload=function(){dirtyOk=true;paintDirt();refreshInfo()};
dirtyImg.src=DIRTY;
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
  f.fillStyle='#fff';cal.floor.forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}});
  f.globalCompositeOperation='destination-out';
  cal.blocked.forEach(function(p){if(p.length>=3){polyPath(f,p);f.fill()}});
  zones=cal.tableMask.filter(function(p){return p.length>=3});
  // "Očisti sto" also cleans what is under and around the table: every blocked shape (table with its chairs) that holds the table
  areas=zones.map(function(z){
    var c=center(z),list=[z];
    cal.blocked.forEach(function(b){if(b.length>=3&&pip(b,c[0],c[1]))list.push(b)});
    return list;
  });
  while(cleaned.length<zones.length)cleaned.push(false);
  cleaned.length=zones.length;
  small=null;
}

// ---------- the sponge ----------
var scratch=mk('canvas');
// the sponge lies flat on the floor: seen from above at an angle its footprint is a flattened ellipse, and it is smaller farther away
var FLAT=.58;
function depthK(y){return .75+.45*Math.max(0,Math.min(1,(y-300)/640))}
function stamp(x,y){
  var k=depthK(y),rx=Math.round(RADIUS*k),ry=Math.max(2,Math.round(rx*FLAT)),sc=scratch.getContext('2d');
  scratch.width=rx*2;scratch.height=ry*2;
  sc.setTransform(1,0,0,FLAT,rx,ry);
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
  var sp=SPACING*depthK(y),dx=x-last.x,dy=y-last.y,d=Math.hypot(dx,dy),n=Math.floor(d/sp);
  if(n>0){
    var ux=dx/d,uy=dy/d;
    for(var i=1;i<=n;i++)stamp(last.x+ux*sp*i,last.y+uy*sp*i);
    last={x:last.x+ux*sp*n,y:last.y+uy*sp*n};
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
function cleanZone(i){
  var poly=zones[i];if(!poly||cleaned[i]||cleaning[i])return;
  cleaning[i]=true;
  var N=16,k=0;
  (function step(){
    var a=1/(N-k);                                      // the last step takes whatever is left
    D.globalCompositeOperation='destination-out';D.fillStyle='rgba(0,0,0,'+a+')';
    (areas[i]||[poly]).forEach(function(ar){polyPath(D,ar);D.fill()});
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
hint.textContent='Drži levi klik i trljaj pod · Desni klik na sto → „Očisti sto“ (čisti i pod ispod stola)';
sponge.innerHTML='<svg viewBox="0 0 120 84" width="120" height="84"><defs>'+
  '<radialGradient id="tcSh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'+
  '<linearGradient id="tcTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe66d"/><stop offset="1" stop-color="#e9c13a"/></linearGradient></defs>'+
  '<ellipse cx="60" cy="63" rx="56" ry="19" fill="url(#tcSh)"/>'+
  '<g id="tcBody">'+
  '<rect x="14" y="38" width="92" height="30" rx="13" fill="#c9a02a" stroke="#8d6d12" stroke-width="1.5"/>'+
  '<rect x="14" y="56" width="92" height="14" rx="7" fill="#3fa05a" stroke="#256b38" stroke-width="1.5"/>'+
  '<rect x="14" y="20" width="92" height="38" rx="14" fill="url(#tcTop)" stroke="#9c7a14" stroke-width="1.5"/>'+
  '<g fill="#b8921c" opacity=".7"><ellipse cx="32" cy="34" rx="5" ry="3"/><ellipse cx="52" cy="28" rx="4" ry="2.4"/><ellipse cx="74" cy="36" rx="6" ry="3.2"/><ellipse cx="44" cy="45" rx="4" ry="2.4"/><ellipse cx="90" cy="31" rx="3.5" ry="2.2"/><ellipse cx="66" cy="47" rx="5" ry="2.8"/></g>'+
  '<ellipse cx="38" cy="26" rx="14" ry="3" fill="#fff" opacity=".35"/></g></svg>';
var spBody=sponge.querySelector('#tcBody');
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
  info.textContent='Pod: '+floorPercent()+'% čist  ·  Stolovi: '+n+' / '+zones.length+' čisti';
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
  var p=toScene(e),r=cv.getBoundingClientRect(),k=depthK(Math.max(0,Math.min(H,p.y)))*(r.width/W);
  var vx=lastPos?e.clientX-lastPos.x:0;lastPos={x:e.clientX,y:e.clientY};
  // it slides on the floor: it leans a little in the direction it is pushed, and it is lifted when it does not touch the floor
  var sk=down?Math.max(-12,Math.min(12,vx*.5)):0,lift=down?2:15;
  sponge.style.left=(e.clientX-60)+'px';sponge.style.top=(e.clientY-62)+'px';
  sponge.style.transform='scale('+k+') skewX('+(-sk)+'deg)';
  if(spBody)spBody.setAttribute('transform','translate(0,'+(-lift)+')');
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
  e.stopPropagation();paintDirt();cleaned=zones.map(function(){return false});cleaning={};hideMenu();refreshInfo();
});
// the hint fades once the player has started cleaning
var hinted=false;
room.addEventListener('pointerdown',function(){if(!hinted){hinted=true;setTimeout(function(){hint.style.opacity='0'},4000)}},true);

window.CooksterTavernClean={reset:function(){reset.click()},floorPercent:floorPercent,zones:function(){return zones.length},cleaned:function(){return cleaned.slice()}};
})();
