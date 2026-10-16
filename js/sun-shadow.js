/* Cookster: shadows of the things cast by the sun (the kitchen only).
   A thing of its own: it has nothing to do with the contact shadows (el._contactShadow, they stay as they are, they only show the touch with the surface).
   Every item gets a dark flattened copy of its picture in a layer of its own (.sun-shadow in #scene), leaned away from the window, toward the place where the shaft lands.
   The length, strength, softness and flatness are set in the tool "Vreme i svetlo" (cfg.sh in js/day-light.js). */
(function(){
if(window.CooksterSunShadow)return;
var GID=0,map=new Map(),META=null,BAKED_URL='assets/shadows/meta.json?v=1';
/* the baked shadows (assets/shadows, made by tools/bake_sun_shadows.py): for the things that have them, three pictures (Jutro / Podne / Veče) are laid one over another and cross-faded by the time of the day */
try{fetch(BAKED_URL).then(function(r){return r.json();}).then(function(j){META=j;}).catch(function(){});}catch(e){}
function keyWeights(cfg,m){      // weights of the three baked pictures at the minute m
  var T={};cfg.keys.forEach(function(k){T[k.name]=k.t;});var tj=T['Jutro']||360,tp=T['Podne']||720,tv=T['Veče']||1140,w={jutro:0,podne:0,vece:0};
  if(m<=tj)w.jutro=1;else if(m<tp){var t=(m-tj)/(tp-tj);w.jutro=1-t;w.podne=t;}else if(m<tv){var t2=(m-tp)/(tv-tp);w.podne=1-t2;w.vece=t2;}else w.vece=1;
  return w;
}
function sceneEl(){return document.getElementById('scene');}
function make(el,scene){
  var d=document.createElement('div');d.className='sun-shadow';
  d.style.cssText='position:absolute;pointer-events:none;transform-origin:50% 100%;display:none';
  var im=document.createElement('img');im.alt='';im.draggable=false;im.style.cssText='display:block;width:100%;height:100%;filter:brightness(0)';
  d.appendChild(im);
  d._baked={};['jutro','podne','vece'].forEach(function(k){var b=document.createElement('img');b.alt='';b.draggable=false;b.style.cssText='position:absolute;display:none;pointer-events:none;max-width:none';b.dataset.k=k;d.appendChild(b);d._baked[k]=b;});
  var NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('style','position:absolute;left:0;top:0;overflow:visible;display:none;pointer-events:none');
  var pa=document.createElementNS(NS,'path'),df=document.createElementNS(NS,'defs'),lg=document.createElementNS(NS,'linearGradient'),gid='ssg'+(++GID);
  lg.setAttribute('id',gid);lg.setAttribute('gradientUnits','userSpaceOnUse');
  [[0,1],[.45,.62],[1,0]].forEach(function(st){var sp=document.createElementNS(NS,'stop');sp.setAttribute('offset',st[0]);sp.setAttribute('stop-color','#000');sp.setAttribute('stop-opacity',st[1]);lg.appendChild(sp);});      // dark near the thing, melts into transparency toward the far end
  df.appendChild(lg);sv.appendChild(df);pa.setAttribute('fill','url(#'+gid+')');sv.appendChild(pa);d.appendChild(sv);d._svg=sv;d._path=pa;d._grad=lg;
  scene.appendChild(d);return d;
}
/* the shadow drawn by the player: ~20 points round the thing; the left half of them are fixed to the thing (they never move), the right side has 5 handles that can be moved (js/shadow-editor.js);
   the handles are kept for every key of the day (jutro / podne / vece) and flow between the keys with the clock. cfg.shPoly[itemId][key] = [[u,v] x5], u,v = the place in the box of the thing (0..1, may go out of it) */
var OUTL={};
function getOutline(el,body){
  var id=el.dataset.itemId||'';if(OUTL[id])return OUTL[id];
  if(!body||!body.complete||!body.naturalWidth)return null;
  try{
    var nw=body.naturalWidth,nh=body.naturalHeight,cw=96,ch=Math.max(8,Math.round(96*nh/nw)),c=document.createElement('canvas');c.width=cw;c.height=ch;var g=c.getContext('2d');g.drawImage(body,0,0,cw,ch);
    var d=g.getImageData(0,0,cw,ch).data,A=function(x,y){x=Math.round(x);y=Math.round(y);return(x<0||y<0||x>=cw||y>=ch)?0:d[(y*cw+x)*4+3];},sx=0,sy=0,n=0;
    for(var y=0;y<ch;y++)for(var x=0;x<cw;x++)if(A(x,y)>40){sx+=x;sy+=y;n++;}
    if(!n)return null;var cx=sx/n,cy=sy/n,N=24,R=Math.hypot(cw,ch),pts=[];
    for(var i=0;i<N;i++){var a=i*2*Math.PI/N,r,px=cx,py=cy;for(r=R;r>0;r-=.5){var qx=cx+r*Math.cos(a),qy=cy+r*Math.sin(a);if(A(qx,qy)>40){px=qx;py=qy;break;}}pts.push([px/cw,py/ch]);}
    var cxn=cx/cw,fixed=[],right=[];
    for(var j=N/4;j<=3*N/4;j++){if(pts[j][0]<=cxn+.005)fixed.push(pts[j]);else right.push(pts[j]);}      // from the bottom, over the left side, to the top: fixed
    var rr=[];for(var k=3*N/4+1;k<N;k++)rr.push(pts[k]);for(var m=0;m<N/4;m++)rr.push(pts[m]);right=rr.concat([]);      // from the top, over the right side, to the bottom: here the handles start
    var hs=[];for(var q=0;q<5;q++)hs.push(right[Math.min(right.length-1,Math.round((q+.5)*right.length/5-.5))]);
    return OUTL[id]={fixed:fixed,right:hs,ar:nw/nh};
  }catch(e){return null;}
}
var KN={jutro:'Jutro',podne:'Podne',vece:'Veče'};
function handlesFor(cfg,id,key,o,el){      // the handles of one key: drawn by the player, or (till he draws) the right side of the outline pushed away by the shadow of that key
  var sp=cfg.shPoly&&cfg.shPoly[id]&&cfg.shPoly[id][key];if(sp&&sp.length===5)return sp;
  var kk=null;cfg.keys.forEach(function(k){if(k.name===KN[key])kk=k;});kk=kk||{shx:20,shy:8};
  var w=el.offsetWidth||1,h=el.offsetHeight||1,dx=((kk.shx||0)+((o&&o.x)||0)+(kk.shl||1)*14)/w,dy=((kk.shy||0)+((o&&o.y)||0)+(kk.shl||1)*5)/h;
  return OUTL[id].right.map(function(p){return [p[0]+dx,p[1]+dy];});
}
function smoothPath(P){      // closed smooth curve through the points (Catmull-Rom → Bézier)
  var n=P.length,d='M'+P[0][0].toFixed(1)+' '+P[0][1].toFixed(1);
  for(var i=0;i<n;i++){var p0=P[(i-1+n)%n],p1=P[i],p2=P[(i+1)%n],p3=P[(i+2)%n];
    d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);}
  return d+'Z';
}
function polyPoints(cfg,el,body,wts,o){      // the points (px in the box of the thing) of the shadow now: {fixed:[], handles:[]}
  var id=el.dataset.itemId||'',ol=getOutline(el,body);if(!ol)return null;
  var w=el.offsetWidth,h=el.offsetHeight,hs=[[0,0],[0,0],[0,0],[0,0],[0,0]],tw=0;
  ['jutro','podne','vece'].forEach(function(k){var wk=wts[k];if(wk<.001)return;var H=handlesFor(cfg,id,k,o,el);for(var i=0;i<5;i++){hs[i][0]+=H[i][0]*wk;hs[i][1]+=H[i][1]*wk;}tw+=wk;});
  if(tw<=0)return null;
  return {fixed:ol.fixed.map(function(p){return [p[0]*w,p[1]*h];}),handles:hs.map(function(p){return [p[0]/tw*w,p[1]/tw*h];})};
}
function tick(){
  var D=window.CooksterDay,scene=sceneEl();if(!D||!scene)return;
  var cfg=D.config(),sh=cfg.sh||{},P=D.phase(),list=(typeof items!=='undefined'&&items)||[],hold=(typeof holding!=='undefined')?holding:null;
  var w=cfg.win,mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,dx=P.lx-mx,dy=P.ly-my,L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  var str=sh.on?1:0,seen=new Set();
  list.forEach(function(el){
    if(!el||!el.isConnected)return;
    var rec=map.get(el),body=el.querySelector(':scope>img.body');
    var vis=str>.02&&P.sho>.01&&el!==hold&&body&&el.offsetWidth>0&&el.style.display!=='none'&&el.style.visibility!=='hidden'&&!el.classList.contains('in-oven');
    if(!vis){if(rec)rec.style.display='none';return;}
    if(!rec){rec=make(el,scene);map.set(el,rec);}
    seen.add(el);
    var im=rec.firstChild,bm=META&&sh.baked!==0?META[el.dataset.itemId||'']:null,iid=el.dataset.itemId||'';
    if(cfg.shPoly&&cfg.shPoly[iid]){      // drawn by the player (points): this wins over the baked and the live shadow
      var wts0=keyWeights(cfg,D.minute()%1440),o0=D.itemSh(iid)||{},pp=polyPoints(cfg,el,body,wts0,o0);
      if(pp){
        im.style.display='none';Object.keys(rec._baked).forEach(function(k){rec._baked[k].style.display='none';});
        rec._svg.style.display='block';rec._svg.setAttribute('width',el.offsetWidth);rec._svg.setAttribute('height',el.offsetHeight);
        rec._path.setAttribute('d',smoothPath(pp.fixed.concat(pp.handles)));
        var fx=0,fy=0,hx=0,hy=0;pp.fixed.forEach(function(q){fx+=q[0];fy+=q[1];});pp.handles.forEach(function(q){hx+=q[0];hy+=q[1];});fx/=pp.fixed.length;fy/=pp.fixed.length;hx/=5;hy/=5;
        var gx=el.offsetWidth/2,gy=el.offsetHeight/2;      // the gradient goes from the middle of the thing to the middle of the handles
        rec._grad.setAttribute('x1',gx.toFixed(1));rec._grad.setAttribute('y1',gy.toFixed(1));rec._grad.setAttribute('x2',(gx+(hx-gx)*1.5).toFixed(1));rec._grad.setAttribute('y2',(gy+(hy-gy)*1.5).toFixed(1));
        rec._svg.style.filter='blur('+Math.max(0,P.shb+(o0.b==null?0:+o0.b)).toFixed(1)+'px)';
        rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
        rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));rec.style.transform='none';
        rec.style.opacity=Math.min(1,P.sho*1.7*(o0.o==null?1:+o0.o)*str).toFixed(3);rec.style.display='block';return;      // the gradient already makes it lighter toward the far end, so the strength is higher than that of the other kinds
      }
    }
    rec._svg.style.display='none';
    if(bm){      // the baked shadow: no live shear, only the pictures (the position is that of the thing)
      var kk=el.offsetWidth/bm.sw,wts=keyWeights(cfg,D.minute()%1440),oo=D.itemSh(el.dataset.itemId||'')||{};
      im.style.display='none';
      ['jutro','podne','vece'].forEach(function(k){var b=rec._baked[k],m=bm.keys[k],wk=wts[k];
        if(!m||wk<.01){b.style.display='none';return;}
        if(b.getAttribute('src')!==m.file)b.src=m.file;
        b.style.display='block';b.style.left=(-m.ox*kk)+'px';b.style.top=(-m.oy*kk)+'px';b.style.width=(m.w*kk)+'px';b.style.height=(m.h*kk)+'px';b.style.opacity=wk.toFixed(3);});
      rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
      rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));rec.style.transform='none';
      rec.style.opacity=(P.sho*(oo.o==null?1:+oo.o)*str).toFixed(3);rec.style.display='block';return;
    }
    Object.keys(rec._baked).forEach(function(k){rec._baked[k].style.display='none';});im.style.display='block';
    if(im.getAttribute('src')!==body.getAttribute('src'))im.src=body.getAttribute('src');
    var o=D.itemSh(el.dataset.itemId||'')||{},def=function(v,d){return v==null?d:+v;},
        len=P.shl*def(o.l,1),ar=(P.sha+def(o.a,0))*Math.PI/180,sx=Math.cos(ar)*len,sy=Math.max(.15,Math.sin(ar))*len*.7*P.shh*def(o.h,1);      // every key of the day has its own length, strength and direction; between the keys it flows with the clock
    rec.style.left=el.offsetLeft+'px';rec.style.top=el.offsetTop+'px';rec.style.width=el.offsetWidth+'px';rec.style.height=el.offsetHeight+'px';
    rec.style.zIndex=String(Math.max(1,(parseInt(el.style.zIndex,10)||20)-2));
    rec.style.transform='translate('+(P.shx+def(o.x,0)).toFixed(1)+'px,'+(P.shy+def(o.y,0)).toFixed(1)+'px) rotate('+(P.shr+def(o.r,0)).toFixed(1)+'deg) scaleX('+(P.shw*def(o.w,1)).toFixed(3)+') matrix(1,0,'+(-sx*(1-P.shk)).toFixed(3)+','+(-sy*(1-P.shk)+P.shk).toFixed(3)+',0,0)';
    rec.style.opacity=(P.sho*def(o.o,1)*str).toFixed(3);
    im.style.filter='brightness(0) blur('+Math.max(0,P.shb+def(o.b,0)).toFixed(1)+'px)';
    rec.style.display='block';
  });
  map.forEach(function(rec,el){if(!el.isConnected){rec.remove();map.delete(el);}else if(!seen.has(el))rec.style.display='none';});
}
setInterval(tick,100);
window.CooksterSunShadow={tick:tick,keyWeights:keyWeights,
  /* for the editor: the item, its fixed points and the handles of a key (in px of the box of the thing) */
  geom:function(el,key){var body=el.querySelector(':scope>img.body'),D=window.CooksterDay,cfg=D.config(),ol=getOutline(el,body);if(!ol)return null;var o=D.itemSh(el.dataset.itemId||'')||{},w=el.offsetWidth,h=el.offsetHeight,H=handlesFor(cfg,el.dataset.itemId||'',key,o,el);
    return {fixed:ol.fixed.map(function(p){return [p[0]*w,p[1]*h];}),handles:H.map(function(p){return [p[0]*w,p[1]*h];}),w:w,h:h};},
  setHandle:function(el,key,i,u,v){var D=window.CooksterDay,cfg=D.config(),id=el.dataset.itemId||'',body=el.querySelector(':scope>img.body');getOutline(el,body);cfg.shPoly=cfg.shPoly||{};
    var rec=cfg.shPoly[id]=cfg.shPoly[id]||{};['jutro','podne','vece'].forEach(function(k){if(!rec[k]||rec[k].length!==5)rec[k]=handlesFor(cfg,id,k,D.itemSh(id)||{},el).map(function(p){return [p[0],p[1]];});});
    rec[key][i]=[u,v];D.saveCfg();tick();},
  reset:function(id,key){var D=window.CooksterDay,cfg=D.config();if(!cfg.shPoly||!cfg.shPoly[id])return;if(key)delete cfg.shPoly[id][key];if(!key||!Object.keys(cfg.shPoly[id]).length)delete cfg.shPoly[id];D.saveCfg();tick();}};
})();
