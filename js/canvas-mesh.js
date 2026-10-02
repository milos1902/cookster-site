(function(){'use strict';
 const states=new WeakMap(); let gesture={x:0,y:0,speed:0,angle:0,radius:0,active:false};
 window.CooksterCanvasMesh={setGesture(v){gesture={...gesture,...v};}};
 function hashSeed(text){let h=2166136261>>>0;for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
 function rng(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967295;};}
 function holesFor(im){
  const seed=im.dataset.maskSeed||'';if(!seed)return[];
  const rand=rng(hashSeed(seed));const top=im.dataset.topChoppedLayer==='1';
  const count=(top?10:7)+Math.floor(rand()*(top?4:3));
  const cells=[[22,22],[50,22],[78,22],[22,50],[50,50],[78,50],[22,78],[50,78],[78,78]];
  const holes=[];
  for(let i=0;i<count;i++){
   const cell=cells[i%cells.length];
   const hw=(top?8.5:7)+rand()*(top?5:4),hh=(top?8:6.5)+rand()*(top?4.5:3.5);
   const x=Math.max(5,Math.min(95-hw,cell[0]+(rand()-.5)*16-hw/2));
   const y=Math.max(5,Math.min(95-hh,cell[1]+(rand()-.5)*16-hh/2));
   holes.push({x,y,w:hw,h:hh});
  }
  return holes;
 }
 function clipSlice(g,iw,sliceH,fullH,row,n,holes){
  if(!holes.length)return;
  const path=new Path2D();path.rect(-iw/2,-sliceH/2,iw,sliceH);
  const rowTop=row/n*fullH,rowBottom=(row+1)/n*fullH;
  for(const q of holes){
   const holeTop=q.y/100*fullH,holeBottom=(q.y+q.h)/100*fullH;
   const top=Math.max(rowTop,holeTop),bottom=Math.min(rowBottom,holeBottom);
   if(bottom<=top)continue;
   const x=-iw/2+q.x/100*iw,w=q.w/100*iw;
   const y=-sliceH/2+(top-rowTop)/(rowBottom-rowTop)*sliceH;
   const h=(bottom-top)/(rowBottom-rowTop)*sliceH;
   path.rect(x,y,w,h);
  }
  try{g.clip(path,'evenodd');}catch(_){/* old canvas fallback keeps full pixels */}
 }
 function mount(root){if(states.has(root))return;const c=document.createElement('canvas');c.className='cookster-mesh-renderer';root.appendChild(c);states.set(root,{canvas:c,phase:0,speed:0});}
 function draw(root,s){const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;const d=devicePixelRatio||1,c=s.canvas;c.width=w*d;c.height=h*d;c.style.width=w+'px';c.style.height=h+'px';const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  const engaged=!!gesture.active||s.speed>.05;
  const inputSpeed=Math.min(8,Math.max(0,gesture.speed));
  s.speed+=(inputSpeed-s.speed)*(gesture.active?.06:.018);
  const rect=root.getBoundingClientRect();
  const gx=(gesture.x-rect.left)/Math.max(1,rect.width)*w;
  const gy=(gesture.y-rect.top)/Math.max(1,rect.height)*h;
  const pointerAngle=Number.isFinite(+gesture.angle)?+gesture.angle:Math.atan2(gy-h/2,gx-w/2);
  const pointerRadius=Math.hypot(gx-w/2,gy-h/2);
  const reach=Math.min(1.35,Math.max(.55,pointerRadius/Math.max(1,Math.min(w,h)*.46)));
  const amp=engaged?Math.min(11,(.7+s.speed*.34)*reach):0;
  root.querySelectorAll('.exact-chopped-rotor:not(.trail-ghost-rotor) > img').forEach((im,i)=>{if(!im.complete||!im.naturalWidth)return;const x=(parseFloat(im.style.left)||50)*w/100,y=(parseFloat(im.style.top)||50)*h/100,iw=(parseFloat(im.style.width)||40)*w/100,ih=im.clientHeight||h*.35,n=12,holes=holesFor(im);for(let r=0;r<n;r++){const phase=pointerAngle+s.phase+r*.55+i*.4;const offX=amp*Math.sin(phase);const offY=amp*.72*Math.cos(phase);const sliceH=ih/n+1;let cx=x+offX,cy=y+offY+ih*(r/n-.5);const rx=Math.max(2,w*.47-iw*.18),ry=Math.max(2,h*.46-sliceH*.22);const nx=(cx-w/2)/rx,ny=(cy-h/2)/ry;const edge=Math.hypot(nx,ny);if(edge>1){cx=w/2+(cx-w/2)/edge*rx;cy=h/2+(cy-h/2)/edge*ry;}const rot=(amp/Math.max(1,Math.min(w,h)))*Math.sin(phase)*.40;const sy=im.naturalHeight*r/n,sh=im.naturalHeight/n;g.save();g.translate(cx,cy);g.rotate(rot);clipSlice(g,iw,sliceH,ih,r,n,holes);g.drawImage(im,0,sy,im.naturalWidth,sh,-iw/2,-sliceH/2,iw,sliceH);g.restore();}});c.style.opacity='1';s.phase=engaged?s.phase+Math.min(.045,s.speed*.004):s.phase*.92;}
 function loop(){document.querySelectorAll('.exact-chopped-stack').forEach(r=>{mount(r);draw(r,states.get(r));});requestAnimationFrame(loop)}
 requestAnimationFrame(loop);
})();
