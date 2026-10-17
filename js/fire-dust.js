/* Cookster: at night little golden specks of dust float in the light of the fire (the stove with the fire in the firebox; a few over the grill when it burns).
   They are born in the soft pool of light (more near its middle), drift slowly up and sideways, twinkle and fade. Everything is one canvas over the dark layer, only when it is dark and a fire burns. */
(function(){
if(window.CooksterFireDust)return;
var W=1672,H=941,cv=null,cx=null,P=[],last=0,run=false,
    ZONES=[{k:'stove',x:1334,y:560,rx:200,ry:150,max:46},{k:'grill',x:497,y:92,rx:230,ry:36,max:16}];
function lvl(k){try{if(k==='stove')return CooksterDay.stoveLight();return CooksterGrill.level();}catch(e){return 0;}}
function night(){try{var d=CooksterDay.phase().dark;return Math.max(0,Math.min(1,d/.3));}catch(e){return 0;}}
function build(){var sc=document.getElementById('scene');if(!sc)return false;if(cv&&cv.parentNode===sc)return true;
  cv=document.createElement('canvas');cv.id='fireDust';cv.width=W;cv.height=H;cv.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:90002;mix-blend-mode:screen';
  sc.appendChild(cv);cx=cv.getContext('2d');return true;}
function randn(){return (Math.random()+Math.random()+Math.random()-1.5)/1.5;}
function spawn(z){P.push({z:z.k,x:z.x+randn()*z.rx*.8,y:z.y+randn()*z.ry*.8,vx:(Math.random()-.5)*5,vy:-(2+Math.random()*6),r:.7+Math.random()*1.4,life:0,max:4+Math.random()*5,ph:Math.random()*6.28,f:1.5+Math.random()*3});}
function frame(now){
  var dt=Math.min(.05,(now-last)/1000||.016);last=now;
  var n=night(),any=false;
  cx.clearRect(0,0,W,H);
  ZONES.forEach(function(z){var l=lvl(z.k)*n,want=Math.round(z.max*l),have=0;P.forEach(function(p){if(p.z===z.k)have++;});
    if(l>.03)any=true;if(have<want&&Math.random()<dt*want*.35)spawn(z);});
  for(var i=P.length-1;i>=0;i--){var p=P[i];p.life+=dt;if(p.life>=p.max){P.splice(i,1);continue;}any=true;
    p.x+=(p.vx+Math.sin(p.life*.9+p.ph)*4)*dt;p.y+=p.vy*dt;
    var f=p.life/p.max,a=Math.sin(Math.min(1,f*4)*Math.PI/2)*(1-f)*(.55+.45*Math.sin(now/1000*p.f+p.ph));
    var zl=lvl(p.z)*n;a*=Math.min(1,zl*2);if(a<=.01)continue;
    var g=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);g.addColorStop(0,'rgba(255,226,140,'+(a*.95).toFixed(3)+')');g.addColorStop(.35,'rgba(255,190,90,'+(a*.45).toFixed(3)+')');g.addColorStop(1,'rgba(255,170,60,0)');
    cx.fillStyle=g;cx.beginPath();cx.arc(p.x,p.y,p.r*3,0,6.2832);cx.fill();}
  if(any)requestAnimationFrame(frame);else run=false;
}
function kick(){if(!run&&build()){run=true;last=performance.now();requestAnimationFrame(frame);}}
setInterval(function(){if(night()>.03&&(lvl('stove')>0||lvl('grill')>0))kick();},500);
window.CooksterFireDust={kick:kick};
})();
