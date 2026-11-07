/* Cookster - dirty vessels.
   A vessel that held food and is now empty (or that burnt) shows its DIRTY picture on top of the clean one, under the food.
   The dirt is a canvas: the sponge (hold the left button and rub) erases it fast, and the clean picture under it shows. Washing in the sink cleans it too.
   Only vessels that have a dirty picture (DIRTY_ART) get dirty. The functions that rub are in game.js (beginCleaning / updateCleaning). */
(function(){
'use strict';
if(window.CooksterVesselDirt)return;
var DIRTY_ART={
  serpa_velika:'assets/new_props/serpa_velika_prljava.webp?v=1'
  /* every new dirty picture (same size and shape as the clean one): 'vessel_id':'assets/new_props/...webp' */
};
var W=512,imgCache={};
// the dirty picture is a hair smaller than the clean one (it was a millimetre too big): 1 = same size
var SHRINK={def:.988};
// frying pans get no drawn dirty picture: grease stains are made on the spot, and ONLY after meat has been fried in the pan (el.dataset.meatFat)
var PROC={
  tiganj_veliki:{aspect:343/365,poly:[[21.6,54],[21.1,46.7],[24.4,34.9],[32.7,25.8],[41.6,20.6],[54.4,18.2],[66.1,20.1],[76.5,24.3],[83.4,31.7],[88,41.5],[87.8,51.3],[84.7,58.9],[80.3,63.2],[66.9,69.6],[55.3,71],[40.5,69.2],[30.5,64.7],[23.9,59.7]]},
  tiganj_mali:{aspect:313/284,ell:[50,42,30,20]}
};
function artFor(el){
  var id=typeof el==='string'?el:(el&&el.dataset&&el.dataset.itemId);
  if(DIRTY_ART[id])return DIRTY_ART[id];
  if(PROC[id]&&el&&el.dataset&&el.dataset.meatFat==='1')return 'proc:'+id;
  return null;
}
function art(id){return artFor(id);}
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function hashStr(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
// grease stains: brown blotches and flecks inside the floor of the pan
function procCanvas(id,seed){
  var P=PROC[id],w=W,h=Math.round(W*P.aspect),c=document.createElement('canvas');c.width=w;c.height=h;
  var g=c.getContext('2d'),r=rng(seed);
  var region=new Path2D();
  if(P.poly)P.poly.forEach(function(p,i){var x=p[0]/100*w,y=p[1]/100*h;if(i)region.lineTo(x,y);else region.moveTo(x,y);});
  else region.ellipse(P.ell[0]/100*w,P.ell[1]/100*h,P.ell[2]/100*w,P.ell[3]/100*h,0,0,Math.PI*2);
  region.closePath();
  var x0=w,y0=h,x1=0,y1=0;
  (P.poly||[[P.ell[0]-P.ell[2],P.ell[1]-P.ell[3]],[P.ell[0]+P.ell[2],P.ell[1]+P.ell[3]]]).forEach(function(p){x0=Math.min(x0,p[0]/100*w);x1=Math.max(x1,p[0]/100*w);y0=Math.min(y0,p[1]/100*h);y1=Math.max(y1,p[1]/100*h);});
  function pick(){for(var k=0;k<40;k++){var x=x0+r()*(x1-x0),y=y0+r()*(y1-y0);if(g.isPointInPath(region,x,y))return [x,y];}return [(x0+x1)/2,(y0+y1)/2];}
  g.save();g.clip(region);
  function blob(x,y,rad,a,col){
    for(var j=0;j<4;j++){
      var bx=x+(r()-.5)*rad*.9,by=y+(r()-.5)*rad*.6,br=rad*(.45+r()*.55);
      var gr=g.createRadialGradient(bx,by,0,bx,by,br);
      gr.addColorStop(0,'rgba('+col+','+a+')');gr.addColorStop(.55,'rgba('+col+','+(a*.55)+')');gr.addColorStop(1,'rgba('+col+',0)');
      g.fillStyle=gr;g.beginPath();g.ellipse(bx,by,br,br*.75,r()*Math.PI,0,Math.PI*2);g.fill();
    }
  }
  for(var i=0;i<10;i++){var p=pick();blob(p[0],p[1],w*(.06+r()*.07),.38+r()*.2,'176,134,78');}      // a film of fat (lighter than the dark pan)
  for(var i=0;i<14;i++){var p=pick();blob(p[0],p[1],w*(.02+r()*.03),.55+r()*.3,'214,184,134');}      // shiny spatters
  for(var i=0;i<22;i++){var p=pick();blob(p[0],p[1],w*(.02+r()*.04),.7+r()*.25,'22,12,6');}      // burnt black residue
  for(var i=0;i<46;i++){var p=pick(),rr=1.6+r()*4;g.fillStyle='rgba('+(r()<.5?'18,10,5':'205,172,118')+','+(.6+r()*.35)+')';g.beginPath();g.arc(p[0],p[1],rr,0,Math.PI*2);g.fill();}      // small flecks
  g.restore();
  return c;
}
function loadArt(src,cb){
  var e=imgCache[src];
  if(e&&e.ready){cb(e.img);return;}
  if(!e){e=imgCache[src]={img:new Image(),ready:false,cbs:[]};e.img.onload=function(){e.ready=true;e.cbs.splice(0).forEach(function(f){f(e.img)})};e.img.src=src;}
  e.cbs.push(cb);
}
function remaining(c){
  var d=c.getContext('2d').getImageData(0,0,c._w,c._h).data,s=0;
  for(var i=3;i<d.length;i+=4)s+=d[i];
  return c._initial?Math.min(1,s/c._initial):0;
}
function ensureCanvas(el){
  var id=el.dataset.itemId,src=artFor(el);
  if(!src)return null;
  var c=el._dirtCanvas;
  if(c&&c.isConnected)return c;
  c=document.createElement('canvas');c.className='vessel-dirt';c._ready=false;
  c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;transform:scale('+(SHRINK[id]||SHRINK.def)+');transform-origin:50% 50%';
  if(el.dataset.greaseLevel)c.style.opacity=el.dataset.greaseLevel;
  el.appendChild(c);el._dirtCanvas=c;
  var load=src.indexOf('proc:')===0?function(cb){cb(procCanvas(id,hashStr(id+(el.dataset.instanceId||el.dataset.itemInstance||'')+(el.dataset.greaseSeed||(el.dataset.greaseSeed=String(Math.floor(Math.random()*1e9)))))));}:function(cb){loadArt(src,cb);};
  load(function(img){
    if(!c.isConnected)return;
    c._w=W;c._h=Math.round(W*(img.naturalHeight||img.height)/(img.naturalWidth||img.width));c.width=c._w;c.height=c._h;
    var g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,c._w,c._h);g.drawImage(img,0,0,c._w,c._h);
    var d=g.getImageData(0,0,c._w,c._h).data,s=0;for(var i=3;i<d.length;i+=4)s+=d[i];
    c._initial=s;c._ready=true;
  });
  return c;
}
function makeDirty(el){
  if(!artFor(el)||el.dataset.dirt==='1')return;
  el.dataset.dirt='1';ensureCanvas(el);
}
function clean(el){
  delete el.dataset.dirt;delete el.dataset.hadFood;delete el.dataset.meatFat;delete el.dataset.greaseLevel;el._grease=0;
  var c=el._dirtCanvas;if(c){c.style.transition='opacity .3s ease';c.style.opacity='0';setTimeout(function(){c.remove()},320);}
  el._dirtCanvas=null;
}
// called after every redraw of the contents of a vessel
function update(el,total,burnt){
  if(!el||!el.dataset||(!artFor(el)&&el.dataset.dirt!=='1'))return;
  if(total>0)el.dataset.hadFood='1';
  if(PROC[el.dataset.itemId]){if(el.dataset.dirt==='1')ensureCanvas(el);return;}      // pans: the stains come only from frying meat (grease())
  if(el.dataset.dirt!=='1'&&((el.dataset.hadFood==='1'&&total<=0)||burnt))makeDirty(el);
  else if(el.dataset.dirt==='1')ensureCanvas(el);   // (after loading a saved game the canvas has to be made again)
}
// a dirty vessel under the mouse (only where the dirt really is)
function at(x,y,items){
  for(var k=items.length-1;k>=0;k--){
    var el=items[k],c=el&&el._dirtCanvas;
    if(!c||!c._ready||el.dataset.dirt!=='1'||!c.isConnected)continue;
    var r=c.getBoundingClientRect();
    if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
    var px=Math.floor((x-r.left)/r.width*c._w),py=Math.floor((y-r.top)/r.height*c._h);
    // some slop: the sponge is big
    for(var dy=-14;dy<=14;dy+=7)for(var dx=-14;dx<=14;dx+=7){
      var qx=px+dx,qy=py+dy;if(qx<0||qy<0||qx>=c._w||qy>=c._h)continue;
      if(c.getContext('2d').getImageData(qx,qy,1,1).data[3]>40)return c;
    }
  }
  return null;
}
function local(c,e){var r=c.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*c._w,y:(e.clientY-r.top)/r.height*c._h};}
// the sponge takes off the dirt much faster than in the tavern: a big brush and a strong touch
function erase(c,px,py){
  // GRADUALLY: every touch takes off only a little (like in the tavern, but a bit stronger), so one pass leaves a thin film and a few passes are needed
  var g=c.getContext('2d'),R=Math.round(c._w*.115),A=.045;
  g.save();g.globalCompositeOperation='destination-out';
  var gr=g.createRadialGradient(px,py,0,px,py,R);gr.addColorStop(0,'rgba(0,0,0,'+A+')');gr.addColorStop(.75,'rgba(0,0,0,'+(A*.8)+')');gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr;g.beginPath();g.arc(px,py,R,0,Math.PI*2);g.fill();g.restore();
}
// meat is frying in a pan: grease stains appear little by little (level 0..1 = how far the meat is cooked); they stay when the meat is taken out, until the pan is washed
function grease(el,level){
  if(!el||!el.dataset||!PROC[el.dataset.itemId])return;
  el.dataset.meatFat='1';
  if(!(level>0)&&el.dataset.dirt!=='1')return;
  var lv=Math.max(el._grease||0,+el.dataset.greaseLevel||0,Math.min(1,level||0));el._grease=lv;
  if(el.dataset.dirt!=='1')makeDirty(el);
  var c=ensureCanvas(el);
  if(c){c.style.transition='opacity .8s ease';c.style.opacity=String(Math.max(.12,lv));}
  el.dataset.greaseLevel=lv.toFixed(2);
}
window.CooksterVesselDirt={grease:grease,update:update,at:at,local:local,erase:erase,remaining:remaining,clean:clean,makeDirty:makeDirty,has:art,ensureCanvas:ensureCanvas};
})();
