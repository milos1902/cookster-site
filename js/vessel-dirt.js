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
function art(id){return DIRTY_ART[id]||null;}
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
  var id=el.dataset.itemId,src=art(id);
  if(!src)return null;
  var c=el._dirtCanvas;
  if(c&&c.isConnected)return c;
  c=document.createElement('canvas');c.className='vessel-dirt';c._ready=false;
  c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3;transform:scale('+(SHRINK[id]||SHRINK.def)+');transform-origin:50% 50%';
  el.appendChild(c);el._dirtCanvas=c;
  loadArt(src,function(img){
    if(!c.isConnected)return;
    c._w=W;c._h=Math.round(W*img.naturalHeight/img.naturalWidth);c.width=c._w;c.height=c._h;
    var g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,c._w,c._h);g.drawImage(img,0,0,c._w,c._h);
    var d=g.getImageData(0,0,c._w,c._h).data,s=0;for(var i=3;i<d.length;i+=4)s+=d[i];
    c._initial=s;c._ready=true;
  });
  return c;
}
function makeDirty(el){
  if(!art(el.dataset.itemId)||el.dataset.dirt==='1')return;
  el.dataset.dirt='1';ensureCanvas(el);
}
function clean(el){
  delete el.dataset.dirt;delete el.dataset.hadFood;
  var c=el._dirtCanvas;if(c){c.style.transition='opacity .3s ease';c.style.opacity='0';setTimeout(function(){c.remove()},320);}
  el._dirtCanvas=null;
}
// called after every redraw of the contents of a vessel
function update(el,total,burnt){
  if(!el||!el.dataset||!art(el.dataset.itemId))return;
  if(total>0)el.dataset.hadFood='1';
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
window.CooksterVesselDirt={update:update,at:at,local:local,erase:erase,remaining:remaining,clean:clean,makeDirty:makeDirty,has:art,ensureCanvas:ensureCanvas};
})();
