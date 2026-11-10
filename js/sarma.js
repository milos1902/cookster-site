/* Cookster: rolling a sarma (prototype). A cabbage leaf ("List kupusa" in the Kitchen elements) lies on the table with a heap of the filling on it.
   The mouse WHEEL over the leaf rolls it (the wheel does not zoom the scene while the cursor is over the leaf): forward (up) = about 12 clicks wind the leaf into a roll,
   back (down) = it unrolls. The leaf is drawn on a canvas: the rolled part is a cylinder (the strips of the leaf picture wound round it), the rest of the leaf lies flat;
   in the middle of the rolling the sides tuck in. One of three leaf pictures (assets/ingredients/list_kiseli_kupus_1..3.webp) is taken for every leaf.
   When the roll is finished the item gets data-sarma-rolled="1" (a picture of a finished sarma will replace the drawing later). */
(function(){
'use strict';
if(window.CooksterSarma)return;
var ID='kal_01_list_kupusa',STEP=.085;      // one notch of the wheel = 8.5 % of the rolling
var SH=[1,2,3].map(function(n){var i=new Image();i.src='assets/ingredients/list_kiseli_kupus_'+n+'.webp?v=1';return i;});
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
function sm(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function rnd(seed){var s=seed>>>0||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function setup(el){
  if(el._sm)return;var st=el._sm={shape:hash(el.dataset.instanceId||'x')%3,p:0,sx:0};
  var w=+el.dataset.baseW||170,h=+el.dataset.baseH||140,k=2;
  var cv=document.createElement('canvas');cv.width=w*k;cv.height=h*k;cv.className='sarma-cv';cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';
  el.appendChild(cv);st.cv=cv;st.k=k;
  var body=el.querySelector('.body');if(body)body.style.visibility='hidden';
  var f=rnd(hash(el.dataset.instanceId||'x'));st.grains=[];for(var i=0;i<26;i++)st.grains.push([f(),f(),f()*3.14]);
  draw(el);
}
function draw(el){
  var st=el._sm,cv=st.cv,g=cv.getContext('2d'),W=cv.width,H=cv.height,img=SH[st.shape];if(!img.complete||!img.naturalWidth){setTimeout(function(){draw(el);},120);return;}
  g.clearRect(0,0,W,H);var p=st.p;
  // the picture of the leaf: fitted into the box, the stem at the bottom, a little flattened (the view from above at an angle)
  var iw=img.naturalWidth,ih=img.naturalHeight,lw=W*.92,lh=lw*ih/iw*.8;if(lh>H*.9){lh=H*.9;lw=lh/(ih/iw*.8);}
  var ox=(W-lw)/2,oy=H-lh-H*.04,cx=ox+lw/2;
  var L=p*lh,Rf=lw*.15,t=Math.PI*Rf*Rf/lh,rf=lw*.055,v0=lh*.3,dv=lh*.1;
  var cons=sm((L-(v0-dv))/(2*dv)),R=Math.sqrt(L*t/Math.PI+(lw*.012)*(lw*.012))+rf*cons,yf=oy+lh-L,yc=yf-R;
  var wf=1-.36*sm((p-.3)/.32),rw=lw*wf;
  // shadow under everything
  g.fillStyle='rgba(20,10,0,.28)';g.beginPath();g.ellipse(cx,yf+3,lw*(.36+.1*(1-p)),lh*.05,0,0,6.3);g.fill();
  // the flat part of the leaf (from the tip down to the front of the roll)
  var fh=lh-L;if(fh>1)g.drawImage(img,0,0,iw,ih*(1-L/lh),ox,oy,lw,fh);
  // the filling lying on the leaf, until the roll takes it
  if(L<v0+dv){var fy=oy+lh-v0,a=Math.max(0,Math.min(1,(v0+dv-L)/dv));
    g.save();g.beginPath();g.rect(0,0,W,yf);g.clip();g.globalAlpha=Math.min(1,a+.2);
    var gr=g.createRadialGradient(cx,fy-3,2,cx,fy,lw*.3);gr.addColorStop(0,'#a8654a');gr.addColorStop(1,'#80442f');
    g.fillStyle=gr;g.beginPath();g.ellipse(cx,fy,lw*.3,lw*.085,0,0,6.3);g.fill();
    g.fillStyle='rgba(248,240,215,.9)';st.grains.forEach(function(q){var gx=cx+(q[0]-.5)*lw*.54,gy=fy+(q[1]-.5)*lw*.12;g.save();g.translate(gx,gy);g.rotate(q[2]);g.beginPath();g.ellipse(0,0,lw*.014,lw*.005,0,0,6.3);g.fill();g.restore();});
    g.restore();}
  // the roll: the outer wrap of the leaf (rows L .. L-pi*R) seen on the front half of a cylinder
  if(L>2){
    var psiMax=Math.min(Math.PI,L/R),N=48;
    for(var i=0;i<N;i++){
      var a0=psiMax*i/N,a1=psiMax*(i+1)/N,y0=yc+R*Math.cos(a0),y1=yc+R*Math.cos(a1),v_0=L-R*a0,v_1=L-R*a1;
      var sy=ih*(1-v_0/lh),sh=Math.max(1,ih*(v_0-v_1)/lh);
      var top=Math.min(y0,y1),hh=Math.abs(y1-y0)+1.2;
      g.drawImage(img,0,Math.max(0,sy-sh),iw,sh,cx-rw/2,top,rw,hh);
      var sh_=.46*(1-Math.sin((a0+a1)/2))+.02;g.fillStyle='rgba(40,48,0,'+sh_.toFixed(3)+')';g.fillRect(cx-rw/2,top,rw,hh);
    }
    g.fillStyle='rgba(255,255,225,.13)';g.fillRect(cx-rw/2,yc-R*.35,rw,R*.22);      // a soft highlight along the top of the roll
    // the ends of the roll (the spiral of the leaf)
    [cx-rw/2,cx+rw/2].forEach(function(ex,ix){
      g.fillStyle='#d9d48a';g.beginPath();g.ellipse(ex,yc,R*.28,R,0,0,6.3);g.fill();
      g.strokeStyle='rgba(120,110,30,.55)';g.lineWidth=1.2;for(var q=.25;q<1;q+=.25){g.beginPath();g.ellipse(ex,yc,R*.28*q,R*q,0,0,6.3);g.stroke();}
      g.strokeStyle='rgba(90,85,10,.6)';g.lineWidth=1.4;g.beginPath();g.ellipse(ex,yc,R*.28,R,0,0,6.3);g.stroke();});
  }
  el.dataset.sarmaRolled=p>=.995?'1':'';
}
function over(e){var it=(typeof itemAt==='function')?itemAt(e.clientX,e.clientY):null;return it&&it.dataset&&it.dataset.itemId===ID?it:null;}
window.addEventListener('wheel',function(e){
  try{if(typeof holding!=='undefined'&&holding)return;}catch(x){}
  var it=over(e);if(!it)return;setup(it);
  e.preventDefault();e.stopImmediatePropagation();
  var dy=e.deltaMode===1?e.deltaY*33:e.deltaY,st=it._sm;
  st.p=Math.max(0,Math.min(1,st.p+(-dy/100)*STEP));draw(it);
},{capture:true,passive:false});
setInterval(function(){try{items.forEach(function(el){if(el.dataset&&el.dataset.itemId===ID&&!el._sm)setup(el);});}catch(e){}},500);
window.CooksterSarma={set:function(el,p){setup(el);el._sm.p=p;draw(el);},ID:ID};
})();
