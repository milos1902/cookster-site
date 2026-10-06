const BASE_W=1672, BASE_H=941, PAN_W=1672, CENTER_OFFSET=0;
const CAMERA_Y_MULT=1;
const scene=document.getElementById('scene'),cursor=document.getElementById('cursor'),label=document.getElementById('label'),leftArrow=document.getElementById('leftArrow'),rightArrow=document.getElementById('rightArrow'),
modalShade=document.getElementById('modalShade'),marketRows=document.getElementById('marketRows'),moneyEl=document.getElementById('money'),toast=document.getElementById('toast'),waterStream=document.getElementById('waterStream'),waterSplash=document.getElementById('waterSplash'),marketScene=document.getElementById('marketScene'),marketMoneyLive=document.getElementById('marketMoneyLive'),marketNotice=document.getElementById('marketNotice'),marketQtyTomato=document.getElementById('marketQtyTomato'),marketQtyPepper=document.getElementById('marketQtyPepper'),marketMinusTomato=document.getElementById('marketMinusTomato'),marketPlusTomato=document.getElementById('marketPlusTomato'),marketMinusPepper=document.getElementById('marketMinusPepper'),marketPlusPepper=document.getElementById('marketPlusPepper'),fireboxHotspot=document.getElementById('fireboxHotspot'),ovenHotspot=document.getElementById('ovenHotspot'),fireTimerBar=document.getElementById('fireTimerBar');

// v1.41: long legacy cast shadows stay disabled. Compact contact shadows are
// enabled again and are calculated from each item's own silhouette.
const contactShadowStyle=document.createElement('style');
contactShadowStyle.textContent='.contact-shadow-sprite{display:block;position:absolute!important;pointer-events:none;transition:opacity .08s ease-out}.contact-shadow-sprite>img{display:block;width:100%;height:100%;object-fit:contain;filter:brightness(0) saturate(100%);opacity:.72;pointer-events:none}';
document.head.appendChild(contactShadowStyle);

const dayLightStyle=document.createElement('style');
dayLightStyle.textContent=`
@keyframes cooksterDustFloat{0%{transform:translate3d(0,16px,0) scale(.72);opacity:0}18%{opacity:var(--dust-a,.55)}72%{opacity:.32}100%{transform:translate3d(var(--dust-x,24px),-54px,0) scale(1.08);opacity:0}}
.cookster-dust{position:absolute;width:5px;height:5px;border-radius:50%;background:rgba(255,244,190,.96);box-shadow:0 0 8px rgba(255,226,133,.95);animation:cooksterDustFloat var(--dust-t,5s) linear infinite;animation-delay:var(--dust-d,0s)}
`;
document.head.appendChild(dayLightStyle);
const dayTint=document.createElement('div');
const roomGlow=document.createElement('div');
const sunBeam=document.createElement('div');
const directionalGradient=document.createElement('div');
const radialLightLayer=document.createElement('div');
const lightBrushCanvas=document.createElement('canvas');
const darkBrushCanvas=document.createElement('canvas');
const morningParticles=document.createElement('div');
const lensFlare=document.createElement('div');
dayTint.id='cooksterDayTint';roomGlow.id='cooksterRoomGlow';sunBeam.id='cooksterSunBeam';directionalGradient.id='cooksterDirectionalGradient';radialLightLayer.id='cooksterRadialLights';lightBrushCanvas.id='cooksterLightBrush';darkBrushCanvas.id='cooksterDarkBrush';morningParticles.id='cooksterMorningParticles';lensFlare.id='cooksterLensFlare';
for(const layer of [dayTint,roomGlow,sunBeam,directionalGradient,radialLightLayer,lightBrushCanvas,darkBrushCanvas,morningParticles,lensFlare]){layer.setAttribute('aria-hidden','true');Object.assign(layer.style,{position:'absolute',pointerEvents:'none',zIndex:'8800'});}
Object.assign(dayTint.style,{inset:'0',mixBlendMode:'multiply',transition:'background 120ms linear'});
Object.assign(roomGlow.style,{inset:'0',mixBlendMode:'screen',transition:'background 120ms linear'});
Object.assign(sunBeam.style,{left:'7%',top:'4%',width:'54%',height:'92%',clipPath:'polygon(0 0,38% 0,100% 100%,24% 100%)',background:'linear-gradient(112deg,rgba(255,249,211,.72),rgba(255,211,120,.28) 54%,rgba(255,190,92,0) 100%)',filter:'blur(7px)',mixBlendMode:'screen',transformOrigin:'12% 8%'});
Object.assign(directionalGradient.style,{left:'18%',top:'24%',width:'42%',height:'220px',transformOrigin:'0 50%',mixBlendMode:'screen'});
Object.assign(radialLightLayer.style,{inset:'0',mixBlendMode:'screen'});
for(const canvas of [lightBrushCanvas,darkBrushCanvas]){canvas.width=BASE_W;canvas.height=BASE_H;Object.assign(canvas.style,{inset:'0',width:'100%',height:'100%'});}lightBrushCanvas.style.mixBlendMode='screen';darkBrushCanvas.style.mixBlendMode='multiply';
Object.assign(morningParticles.style,{left:'8%',top:'8%',width:'53%',height:'78%',overflow:'hidden',clipPath:'polygon(0 0,42% 0,100% 100%,18% 100%)'});
Object.assign(lensFlare.style,{left:'9%',top:'10%',width:'48%',height:'42%',background:'radial-gradient(circle at 12% 16%,rgba(255,255,235,.98) 0 1.2%,rgba(255,224,148,.40) 2.5%,transparent 8%),radial-gradient(circle at 42% 48%,rgba(255,190,110,.25) 0 3%,transparent 8%),radial-gradient(circle at 67% 69%,rgba(255,245,195,.18) 0 2%,transparent 6%)',filter:'blur(.35px)',mixBlendMode:'screen'});
for(let i=0;i<24;i++){
 const d=document.createElement('i');d.className='cookster-dust';
 d.style.left=(8+((i*37)%84))+'%';d.style.top=(10+((i*53)%82))+'%';d.style.setProperty('--dust-x',(-16+(i*19)%45)+'px');d.style.setProperty('--dust-t',(4.1+(i%7)*.48)+'s');d.style.setProperty('--dust-d',(-i*.31)+'s');d.style.setProperty('--dust-a',(.30+(i%5)*.08).toFixed(2));morningParticles.appendChild(d);
}
// Cloud lighting overlays removed from gameplay.
for(const n of [dayTint,roomGlow,sunBeam,directionalGradient,radialLightLayer,lightBrushCanvas,darkBrushCanvas,morningParticles,lensFlare]){try{n.remove();}catch(_){}}

const CLOUD_LIGHT_SHADOWS_DISABLED=true;
const LIGHT_TOOL_KEY='cookster.light-tool.v1';
try{localStorage.removeItem(LIGHT_TOOL_KEY);}catch(_){}
const CONTACT_TOOL_KEY='cookster.contact-shadows.v1';
try{
 localStorage.removeItem('cookster.light-studio.ui.v1');
 localStorage.removeItem('cookster.light-studio.snapshots.v1');
}catch(_){}
const LIGHT_DEFAULTS={morningColor:'#ffd59b',noonColor:'#fff4dc',eveningColor:'#ff9b57',nightColor:'#192b52',morningLight:.13,noonLight:.08,eveningLight:.10,nightLight:0,morningDark:.08,noonDark:.03,eveningDark:.15,nightDark:.48,beamX:7,beamY:4,beamWidth:54,beamHeight:92,beamAngle:0,beamStrength:1,beamOpacity:1,beamBlur:14,dustOpacity:.88,flareOpacity:.62,sunShadowLength:1,gradientX1:16,gradientY1:20,gradientX2:64,gradientY2:66,gradientThickness:260,gradientOpacity:.42,gradientBlur:12,gradientColor:'#ffd98d',radialColor:'#ffe0a0',radialOpacity:.55,radialBlur:12,radialSoftness:82,radialLights:[],brushMode:'light',brushColor:'#ffd08a',brushSize:120,brushOpacity:.3,brushStrength:1,brushBlur:10,brushSoftness:70,brushStrokes:[],contactOverrides:{},sunShadowShapes:{},itemShadowProfiles:{},shadowVisibility:{},itemShadowHeight:120,produceShadowHeightScale:.38,sunShapeColor:'#2b211c',sunShapeOpacity:.3,sunShapeBlur:4,sunShapeGradient:.65,keyframes:[]};
let lightTool={...LIGHT_DEFAULTS};
let gameClockPaused=false;
let lightingEditorPreviewOverride=false;
let selectedRadial=-1;
let selectedShadowItem=null;
const toolControlInputs={};
try{lightTool={...LIGHT_DEFAULTS,...JSON.parse(localStorage.getItem(LIGHT_TOOL_KEY)||'{}')};}catch(_){}
// Keep the legacy key available for older exports; the active master is
// restored from CONTACT_SHADOW_MASTER_KEY below.
let lightPersistTimer=0;
function persistLightTool(immediate=false){clearTimeout(lightPersistTimer);const write=()=>{try{localStorage.setItem(LIGHT_TOOL_KEY,JSON.stringify(lightTool));if(typeof lsMarkSaved==='function')lsMarkSaved();}catch(_){}};if(immediate)write();else lightPersistTimer=setTimeout(write,220);}
function persistContactOverrides(){return false;}
/* ==========================================================================
   Cookster · Svetlo i senke (v2.27 light studio)
   Replaces the old long "Svetlost i senke" <details> panel. The saved data
   format (cookster.light-tool.v1 + cookster.contact-shadows.v1) is unchanged,
   so every older backup JSON still imports.
   ========================================================================== */
let brushRenderSource=null,brushRenderDirty=true;
function shadowItemKey(el){return el?.dataset?.instanceId||el?.dataset?.itemId||'';}
function scenePercent(clientX,clientY){const p=screenToScene(clientX,clientY);return{x:Math.max(-20,Math.min(120,p.x/BASE_W*100)),y:Math.max(-20,Math.min(120,p.y/BASE_H*100))};}
const contactFields={x:0,y:0,width:.86,height:.16,opacity:.52,blur:1.2,angle:0};

const CONTACT_SHADOW_MASTER_KEY='cookster.contact-shadow-master.v1';
const CONTACT_SHADOW_CALIBRATION_LOCKED=false;
const MASTER_CONTACT_SHADOW_CALIBRATION={"tikva_za_vodu":{"itemId":"tikva_za_vodu","label":"Издубљена тиква","shadow":{"shadowX":-2,"shadowY":-14,"width":0.6,"height":0.095,"blur":13.8,"opacity":1,"angle":0}},"serpa_velika":{"itemId":"serpa_velika","label":"Velika šerpa","shadow":{"shadowX":0,"shadowY":2,"width":0.915,"height":0.625,"blur":2.4,"opacity":0.86,"angle":0.6}},"daska":{"itemId":"daska","label":"daska","points":{"table":[{"x":773.147,"y":564.002,"shadowX":2,"shadowY":-36,"width":0.525,"height":0.755,"blur":2.4,"opacity":0.75,"angle":-0.8}],"stove":[{"x":1426.356,"y":367.471,"shadowX":6,"shadowY":-34,"width":0.485,"height":0.595,"blur":2.9,"opacity":0.48,"angle":0}],"floor":[{"x":863.859,"y":835.954,"shadowX":2,"shadowY":-21,"width":0.5,"height":0.575,"blur":1.2,"opacity":0.75,"angle":-0.1}]}},"kal_02_cinija_velika":{"itemId":"kal_02_cinija_velika","label":"Velika činija","shadow":{"shadowX":0,"shadowY":0,"width":0.6,"height":0.15,"blur":9.5,"opacity":0.8,"angle":0.6}},"kal_01_solja_kafe":{"itemId":"kal_01_solja_kafe","label":"Šolja kafe","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.255,"blur":2.9,"opacity":0.7,"angle":0.6}},"kal_02_tanjir_ravni":{"itemId":"kal_02_tanjir_ravni","label":"Ravni tanjir","shadow":{"shadowX":0,"shadowY":1,"width":0.95,"height":0.71,"blur":1.7,"opacity":0.67,"angle":0.6}},"kal_01_pravougaoni_pleh":{"itemId":"kal_01_pravougaoni_pleh","label":"Pravougaoni pleh","shadow":{"shadowX":0,"shadowY":2,"width":0.915,"height":0.945,"blur":1.4,"opacity":0.83,"angle":0.6}},"kal_01_okrugli_pleh":{"itemId":"kal_01_okrugli_pleh","label":"Okrugli pleh","shadow":{"shadowX":0,"shadowY":3,"width":0.935,"height":0.815,"blur":2.9,"opacity":1,"angle":0.6}},"tiganj_mali":{"itemId":"tiganj_mali","label":"Mali tiganj","shadow":{"shadowX":0,"shadowY":-1,"width":0.875,"height":0.815,"blur":1.7,"opacity":0.79,"angle":0.6}},"vangla_mala":{"itemId":"vangla_mala","label":"Mala vangla","shadow":{"shadowX":0,"shadowY":-2,"width":0.86,"height":0.31,"blur":5,"opacity":0.73,"angle":0.6}},"kal_01_tegla_mala":{"itemId":"kal_01_tegla_mala","label":"Mala tegla","shadow":{"shadowX":0,"shadowY":0,"width":0.875,"height":0.295,"blur":3.3,"opacity":0.81,"angle":0.6}},"kal_02_cinija_mala":{"itemId":"kal_02_cinija_mala","label":"Mala činija","shadow":{"shadowX":-1,"shadowY":1,"width":0.635,"height":0.265,"blur":4,"opacity":0.71,"angle":0.6}},"kal_01_hleb":{"itemId":"kal_01_hleb","label":"Hleb","shadow":{"shadowX":0,"shadowY":2,"width":0.91,"height":0.69,"blur":2.4,"opacity":0.78,"angle":0.6}},"kal_01_flasa_ulja":{"itemId":"kal_01_flasa_ulja","label":"Flaša ulja","shadow":{"shadowX":0,"shadowY":0,"width":0.84,"height":0.295,"blur":3.6,"opacity":0.74,"angle":0.6}},"kal_01_dzezva":{"itemId":"kal_01_dzezva","label":"Džezva","shadow":{"shadowX":-1,"shadowY":2,"width":0.875,"height":0.66,"blur":2.1,"opacity":0.74,"angle":0.6}},"kal_01_dzak_brasna":{"itemId":"kal_01_dzak_brasna","label":"Džak brašna","shadow":{"shadowX":0,"shadowY":1,"width":1.01,"height":0.615,"blur":2.4,"opacity":0.78,"angle":0.6}},"kal_02_duboki_tanjir":{"itemId":"kal_02_duboki_tanjir","label":"Duboki tanjir","shadow":{"shadowX":-1,"shadowY":4,"width":0.805,"height":0.54,"blur":6.7,"opacity":0.88,"angle":0.6}},"kal_02_drvena_kasika":{"itemId":"kal_02_drvena_kasika","label":"Drvena kašika","shadow":{"shadowX":0,"shadowY":0,"width":1.01,"height":0.985,"blur":1.1,"opacity":0.65,"angle":0.6}},"kasika_mesanje":{"itemId":"kasika_mesanje","label":"drvena kašika","shadow":{"shadowX":0,"shadowY":2,"width":1.045,"height":1,"blur":1.9,"opacity":0.68,"angle":0.6}},"hoklica":{"itemId":"hoklica","label":"Drvena hoklica","shadow":{"shadowX":0,"shadowY":-9,"width":1.045,"height":0.565,"blur":5.5,"opacity":0.6,"angle":0}},"tiganj_veliki":{"itemId":"tiganj_veliki","label":"Veliki liveni tiganj","shadow":{"shadowX":1,"shadowY":0,"width":0.935,"height":0.88,"blur":1.7,"opacity":0.89,"angle":0.6}},"zalivka":{"itemId":"zalivka","label":"Zalivka","shadow":{"shadowX":0,"shadowY":2,"width":0.97,"height":0.71,"blur":1.4,"opacity":0.56,"angle":0}},"lavor_emajl_veliki":{"itemId":"lavor_emajl_veliki","label":"Veliki emajlirani lavor","shadow":{"shadowX":-2,"shadowY":0,"width":0.97,"height":0.54,"blur":6.4,"opacity":0.67,"angle":0.6}},"vangla_velika":{"itemId":"vangla_velika","label":"Velika vangla","shadow":{"shadowX":0,"shadowY":3,"width":0.86,"height":0.69,"blur":3.1,"opacity":0.79,"angle":0.6}},"kal_01_tegla_velika":{"itemId":"kal_01_tegla_velika","label":"Velika tegla","shadow":{"shadowX":0,"shadowY":2,"width":0.82,"height":0.21,"blur":3.1,"opacity":0.67,"angle":0.6}},"kal_02_cediljka":{"itemId":"kal_02_cediljka","label":"Cediljka","shadow":{"shadowX":0,"shadowY":3,"width":0.745,"height":0.305,"blur":7.6,"opacity":0.75,"angle":0.6}},"lampa_stona":{"itemId":"lampa_stona","label":"Stona lampa","shadow":{"shadowX":0,"shadowY":0,"width":0.875,"height":0.395,"blur":1.9,"opacity":0.52,"angle":0}},"vangla_srednja":{"itemId":"vangla_srednja","label":"Srednja vangla","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.21,"blur":8.6,"opacity":0.82,"angle":0.6}},"opanci":{"itemId":"opanci","label":"Opanci","shadow":{"shadowX":0,"shadowY":0,"width":0.875,"height":0.415,"blur":6,"opacity":0.72,"angle":0.6}},"kal_02_oklagija":{"itemId":"kal_02_oklagija","label":"Oklagija","shadow":{"shadowX":0,"shadowY":0,"width":0.935,"height":0.18,"blur":0.5,"opacity":0.52,"angle":0.6}},"metla":{"itemId":"metla","label":"Metla","shadow":{"shadowX":0,"shadowY":0,"width":1.01,"height":0.105,"blur":4.8,"opacity":0.52,"angle":0.6}},"kal_01_kvasac":{"itemId":"kal_01_kvasac","label":"Kvasac","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.69,"blur":0,"opacity":0.52,"angle":0.6}},"kanta_set":{"itemId":"kanta_set","label":"Kanta za otpatke — set","shadow":{"shadowX":0,"shadowY":0,"width":0.915,"height":0.775,"blur":1.2,"opacity":0.52,"angle":0.6}},"kal_01_jaje":{"itemId":"kal_01_jaje","label":"Jaje","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.16,"blur":5.2,"opacity":0.75,"angle":0.6}},"img_mu8oj061":{"itemId":"img_mu8oj061","label":"grinder_body.png","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.115,"blur":6.4,"opacity":0.52,"angle":0.6}},"cutura_srbija":{"itemId":"cutura_srbija","label":"Čutura Srbija","shadow":{"shadowX":0,"shadowY":2,"width":0.915,"height":0.18,"blur":14,"opacity":0.65,"angle":0.6}},"bokal_stari":{"itemId":"bokal_stari","label":"Старински бокал","shadow":{"shadowX":0,"shadowY":-14,"width":0.69,"height":0.2,"blur":8.3,"opacity":0.85,"angle":0.6}},"mlin_za_mesо":{"itemId":"mlin_za_mesо","label":"Машина за млевење","shadow":{"shadowX":0,"shadowY":0,"width":0.655,"height":0.68,"blur":5.5,"opacity":0,"angle":0.6}}};
const IMPORTED_CONTACT_SHADOW_CALIBRATION={
 "market_bag":{"itemId":"market_bag","label":"Kesa sa pijace","shadow":{"shadowX":0,"shadowY":0,"width":0.935,"height":0.82,"blur":1.2,"opacity":0.66,"angle":0.6}},
 "paprika_parna_kesa":{"itemId":"paprika_parna_kesa","label":"Kesa za potparivanje paprika","shadow":{"shadowX":0,"shadowY":-12,"width":0.895,"height":0.065,"blur":22.4,"opacity":0.48,"angle":0.6}},
 "produce_beli_luk":{"itemId":"produce_beli_luk","label":"Povrće — Beli luk","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.18,"blur":9.8,"opacity":0.72,"angle":0.6}},
 "produce_zelena_salata":{"itemId":"produce_zelena_salata","label":"Povrće — Zelena salata","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.19,"blur":6.2,"opacity":0.52,"angle":0.6}},
 "produce_paprika_zelena":{"itemId":"produce_paprika_zelena","label":"Povrće — Zelena paprika","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.16,"blur":3.6,"opacity":0.52,"angle":0.6}},
 "produce_tikvice":{"itemId":"produce_tikvice","label":"Povrće — Tikvica","shadow":{"shadowX":0,"shadowY":0,"width":0.765,"height":0.19,"blur":6.7,"opacity":0.6,"angle":0.6}},
 "produce_sargarepa":{"itemId":"produce_sargarepa","label":"Povrće — Šargarepa","shadow":{"shadowX":-9,"shadowY":0,"width":0.785,"height":0.56,"blur":3.3,"opacity":0.72,"angle":0.6}},
 "produce_rotkvice":{"itemId":"produce_rotkvice","label":"Povrće — Rotkvica","shadow":{"shadowX":0,"shadowY":0,"width":0.805,"height":0.435,"blur":2.6,"opacity":0.52,"angle":0.6}},
 "produce_persun":{"itemId":"produce_persun","label":"Povrće — Peršun","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.52,"blur":1.7,"opacity":0.52,"angle":0.6}},
 "produce_patlidzan":{"itemId":"produce_patlidzan","label":"Povrće — Patlidžan","shadow":{"shadowX":0,"shadowY":0,"width":0.785,"height":0.295,"blur":3.1,"opacity":0.63,"angle":0.6}},
 "produce_paradajz":{"itemId":"produce_paradajz","label":"Povrće — Paradajz","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.275,"blur":5,"opacity":0.7,"angle":0.6}},
 "produce_paprika":{"itemId":"produce_paprika","label":"Povrće — Paprika","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.38,"blur":5.5,"opacity":0.62,"angle":0.6}},
 "produce_paprika_plotna":{"itemId":"produce_paprika_plotna","label":"Paprika — položena na plotnu","shadow":{"shadowX":0,"shadowY":-2,"width":0.95,"height":0.16,"blur":3.6,"opacity":0.64,"angle":0.6}},
 "produce_paprika_zelena_plotna":{"itemId":"produce_paprika_zelena_plotna","label":"Zelena paprika — položena na plotnu","shadow":{"shadowX":0,"shadowY":-2,"width":0.95,"height":0.14,"blur":3.6,"opacity":0.62,"angle":0.6}},
 "produce_luk":{"itemId":"produce_luk","label":"Povrće — Luk","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.35,"blur":6.4,"opacity":0.75,"angle":0.6}},
 "produce_kupus":{"itemId":"produce_kupus","label":"Povrće — Kupus","shadow":{"shadowX":0,"shadowY":0,"width":0.82,"height":0.2,"blur":5.7,"opacity":0.71,"angle":0.6}},
 "produce_krastavac":{"itemId":"produce_krastavac","label":"Povrće — Krastavac","shadow":{"shadowX":0,"shadowY":0,"width":0.72,"height":0.265,"blur":4.5,"opacity":0.73,"angle":0.6}}
};
const CONTACT_SHADOW_PRODUCE_KEYS=['paradajz','krastavac','paprika','paprika_zelena','luk','beli_luk','sargarepa','zelena_salata','kupus','patlidzan','tikvice','rotkvice','persun'];
const CHOPPED_CONTACT_SHADOW_CALIBRATION=Object.fromEntries(CONTACT_SHADOW_PRODUCE_KEYS.flatMap(key=>[
 [`produce_${key}_sliced`,{itemId:`produce_${key}_sliced`,label:`Isečeno povrće — ${key}`,shadow:{shadowX:0,shadowY:0,width:.88,height:.14,blur:3.4,opacity:.58,angle:.6}}],
 [`produce_${key}_diced`,{itemId:`produce_${key}_diced`,label:`Sitno seckano povrće — ${key}`,shadow:{shadowX:0,shadowY:0,width:.84,height:.18,blur:3.8,opacity:.6,angle:.6}}]
]));
const ROASTED_CHOPPED_CONTACT_SHADOW_CALIBRATION={
 'produce_paprika_pecena_seckana_neoljustena':{itemId:'produce_paprika_pecena_seckana_neoljustena',label:'Pečena paprika — seckana neoljuštena',shadow:{shadowX:0,shadowY:0,width:.86,height:.18,blur:4.2,opacity:.62,angle:.6}},
 'produce_paprika_pecena_seckana_oljustena':{itemId:'produce_paprika_pecena_seckana_oljustena',label:'Pečena paprika — seckana oljuštena',shadow:{shadowX:0,shadowY:0,width:.84,height:.16,blur:3.8,opacity:.58,angle:.6}}
};
const ADDITIONAL_MOVABLE_CONTACT_SHADOW_CALIBRATION={
 'produce_paprika_pecena_cela':{itemId:'produce_paprika_pecena_cela',label:'Pečena paprika — cela',shadow:{shadowX:0,shadowY:0,width:.82,height:.22,blur:4.2,opacity:.62,angle:.6}},
 'produce_paprika_pecena_oljustena':{itemId:'produce_paprika_pecena_oljustena',label:'Pečena paprika — cela oljuštena',shadow:{shadowX:0,shadowY:0,width:.8,height:.18,blur:3.8,opacity:.58,angle:.6}},
 'produce_crate':{itemId:'produce_crate',label:'Gajbica sa povrćem',shadow:{shadowX:0,shadowY:0,width:.92,height:.24,blur:3.2,opacity:.58,angle:.6}},
 'noz':{itemId:'noz',label:'Nož',shadow:{shadowX:0,shadowY:0,width:1.05,height:.08,blur:1.2,opacity:.48,angle:.6}}
};
const LATEST_CONTACT_SHADOW_CALIBRATION={
 'kal_02_drvena_kasika':{itemId:'kal_02_drvena_kasika',label:'Drvena kašika',shadow:{shadowX:0,shadowY:0,width:1.01,height:.985,blur:1.1,opacity:0,angle:.6}},
 'kasika_mesanje':{itemId:'kasika_mesanje',label:'drvena kašika',shadow:{shadowX:0,shadowY:2,width:1.045,height:1,blur:1.9,opacity:0,angle:.6}},
 'produce_paprika':{itemId:'produce_paprika',label:'Povrće — Paprika',shadow:{shadowX:0,shadowY:-1,width:.805,height:.595,blur:2.9,opacity:.71,angle:.6}},
 'produce_paprika_plotna':{itemId:'produce_paprika_plotna',label:'Paprika — položena na plotnu',shadow:{shadowX:0,shadowY:-2,width:.805,height:.5,blur:3.3,opacity:.9,angle:.6}},
 'produce_paradajz_diced':{itemId:'produce_paradajz_diced',label:'Sitno seckano povrće — Paradajz',shadow:{shadowX:0,shadowY:0,width:.84,height:.84,blur:1.7,opacity:.65,angle:.6}},
 'produce_krastavac_diced':{itemId:'produce_krastavac_diced',label:'Sitno seckano povrće — Krastavac',shadow:{shadowX:0,shadowY:0,width:.84,height:.975,blur:1.2,opacity:.83,angle:.6}},
 'produce_paprika_diced':{itemId:'produce_paprika_diced',label:'Sitno seckano povrće — Paprika',shadow:{shadowX:0,shadowY:0,width:.84,height:.905,blur:1,opacity:.74,angle:.6}},
 'produce_paprika_zelena_diced':{itemId:'produce_paprika_zelena_diced',label:'Sitno seckano povrće — Zelena paprika',shadow:{shadowX:0,shadowY:0,width:.84,height:.71,blur:1.7,opacity:.6,angle:.6}},
 'produce_luk_diced':{itemId:'produce_luk_diced',label:'Sitno seckano povrće — Luk',shadow:{shadowX:0,shadowY:0,width:.84,height:.935,blur:1.9,opacity:.79,angle:.6}},
 'produce_beli_luk_diced':{itemId:'produce_beli_luk_diced',label:'Sitno seckano povrće — Beli luk',shadow:{shadowX:0,shadowY:0,width:.84,height:.83,blur:1.9,opacity:.82,angle:.6}},
 'produce_sargarepa_diced':{itemId:'produce_sargarepa_diced',label:'Sitno seckano povrće — Šargarepa',shadow:{shadowX:0,shadowY:0,width:.84,height:.635,blur:2.1,opacity:.78,angle:.6}},
 'produce_zelena_salata_diced':{itemId:'produce_zelena_salata_diced',label:'Sitno seckano povrće — Zelena salata',shadow:{shadowX:0,shadowY:0,width:.84,height:.71,blur:1.2,opacity:.71,angle:.6}},
 'produce_kupus_diced':{itemId:'produce_kupus_diced',label:'Sitno seckano povrće — Kupus',shadow:{shadowX:0,shadowY:0,width:.84,height:.925,blur:2.1,opacity:.84,angle:.6}},
 'produce_patlidzan_diced':{itemId:'produce_patlidzan_diced',label:'Sitno seckano povrće — Patlidžan',shadow:{shadowX:0,shadowY:0,width:.84,height:.66,blur:1.2,opacity:.75,angle:.6}},
 'produce_tikvice_diced':{itemId:'produce_tikvice_diced',label:'Sitno seckano povrće — Tikvica',shadow:{shadowX:0,shadowY:0,width:.84,height:.785,blur:1.7,opacity:.6,angle:.6}},
 'produce_rotkvice_diced':{itemId:'produce_rotkvice_diced',label:'Sitno seckano povrće — Rotkvica',shadow:{shadowX:0,shadowY:0,width:.84,height:.87,blur:1.7,opacity:.74,angle:.6}},
 'produce_persun_diced':{itemId:'produce_persun_diced',label:'Sitno seckano povrće — Peršun',shadow:{shadowX:0,shadowY:0,width:.84,height:.71,blur:1.7,opacity:.71,angle:.6}},
 'produce_paprika_pecena_seckana_neoljustena':{itemId:'produce_paprika_pecena_seckana_neoljustena',label:'Pečena paprika — seckana neoljuštena',shadow:{shadowX:0,shadowY:0,width:.915,height:.89,blur:1.3,opacity:.62,angle:.6}},
 'produce_paprika_pecena_seckana_oljustena':{itemId:'produce_paprika_pecena_seckana_oljustena',label:'Pečena paprika — seckana oljuštena',shadow:{shadowX:0,shadowY:-4,width:.895,height:.645,blur:1.8,opacity:.58,angle:.6}},
 'produce_paprika_pecena_cela':{itemId:'produce_paprika_pecena_cela',label:'Pečena paprika — cela',shadow:{shadowX:0,shadowY:0,width:.895,height:.88,blur:1.2,opacity:.86,angle:.6}},
 'produce_paprika_pecena_oljustena':{itemId:'produce_paprika_pecena_oljustena',label:'Pečena paprika — cela oljuštena',shadow:{shadowX:0,shadowY:0,width:.86,height:.86,blur:1.5,opacity:.7,angle:.6}},
 'noz':{itemId:'noz',label:'nož',shadow:{shadowX:0,shadowY:0,width:.95,height:.805,blur:5.2,opacity:.79,angle:.6}},
 'so':{itemId:'so',label:'So',shadow:{shadowX:0,shadowY:-3,width:.935,height:.265,blur:3.6,opacity:.93,angle:.6}},
 'veg_paprika_1790124308385':{itemId:'veg_paprika_1790124308385',label:'Paprika',shadow:{shadowX:0,shadowY:0,width:.86,height:.9,blur:1.4,opacity:.52,angle:.6}},
 // sauerkraut barrel: the calibration of the empty one is used for the closed one too
 'kaca_prazna':{itemId:'kaca_prazna',label:'Bačva za kiseljenje — prazna',shadow:{shadowX:26,shadowY:3,width:.785,height:.635,blur:7.6,opacity:.91,angle:-5.7}},
 'kaca_sa_poklopcem':{itemId:'kaca_sa_poklopcem',label:'Bačva za kiseljenje — sa poklopcem',shadow:{shadowX:26,shadowY:3,width:.785,height:.635,blur:7.6,opacity:.91,angle:-5.7}}
};
const RED_POINTED_PEPPER_STOVE_CONTACT_SHADOW={
 'produce_paprika_plotna_silja':{itemId:'produce_paprika_plotna_silja',label:'Crvena šilja — vodoravno na plotni',shadow:{shadowX:0,shadowY:-1,width:.94,height:.86,blur:1.2,opacity:.55,angle:0}}
};
let contactShadowMaster={
 version:1,
 tool:'cookster-contact-shadow-global-master',
 items:{
   ...JSON.parse(JSON.stringify(MASTER_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(IMPORTED_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(CHOPPED_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(ROASTED_CHOPPED_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(ADDITIONAL_MOVABLE_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(LATEST_CONTACT_SHADOW_CALIBRATION)),
   ...JSON.parse(JSON.stringify(RED_POINTED_PEPPER_STOVE_CONTACT_SHADOW))
 }
};
// The baked profiles remain the defaults, while the unlocked lab can restore
// the latest applied master after a refresh.
try{
 const saved=JSON.parse(localStorage.getItem(CONTACT_SHADOW_MASTER_KEY)||'null');
 if(saved?.items&&typeof saved.items==='object'){
   contactShadowMaster={
     ...contactShadowMaster,
     ...saved,
     items:{...contactShadowMaster.items,...saved.items}
   };
 }
}catch(_){}
// Master 2 changed these profiles. Keep an older browser session from
// re-applying the previous calibration over the newly supplied values.
for(const key of ['produce_paprika','produce_paprika_plotna_silja','veg_paprika_1790124308385','kaca_prazna','kaca_sa_poklopcem']){
  const authoritative=LATEST_CONTACT_SHADOW_CALIBRATION[key]||RED_POINTED_PEPPER_STOVE_CONTACT_SHADOW[key];
  if(authoritative)contactShadowMaster.items[key]=JSON.parse(JSON.stringify(authoritative));
}
// Scene-specific profiles use the latest supplied indoor and outdoor exports.
const WOOD_BASKET_INDOOR_SHADOW_DEFAULT={
 shadowX:6,shadowY:-29,width:.58,height:.17,blur:17.9,opacity:1,angle:0
};
const WOOD_BASKET_OUTDOOR_SHADOW_DEFAULT={
 shadowX:4,shadowY:-66,width:.58,height:.255,blur:1,opacity:.62,angle:.1
};
const WOOD_BASKET_OUTDOOR_SHADOW_ID='korpa_drva_napolju';
const WOOD_BASKET_SHADOW_SPLIT_KEY='cookster.basket-shadow-split.v2.89';
const WOOD_BASKET_OUTDOOR_UPDATE_KEY='cookster.basket-outdoor-calibration.v2.90';
const WOOD_BASKET_INDOOR_UPDATE_KEY='cookster.basket-indoor-calibration.v2.92';
let installBasketShadowSplit=true;
try{installBasketShadowSplit=localStorage.getItem(WOOD_BASKET_SHADOW_SPLIT_KEY)!=='done';}catch(_){}
for(const [id,label,shadow] of [
 ['korpa_drva','Korpa sa drvima — u sobi',WOOD_BASKET_INDOOR_SHADOW_DEFAULT],
 [WOOD_BASKET_OUTDOOR_SHADOW_ID,'Korpa sa drvima — napolju',WOOD_BASKET_OUTDOOR_SHADOW_DEFAULT]
]){
 if(installBasketShadowSplit||!contactShadowMaster.items[id])
  contactShadowMaster.items[id]={itemId:id,label,shadow:{...shadow}};
}
if(installBasketShadowSplit){
 try{
  localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));
  localStorage.setItem(WOOD_BASKET_SHADOW_SPLIT_KEY,'done');
 }catch(_){}
}
// Install the new supplied outdoor calibration once; never overwrite later user adjustments.
try{
 if(localStorage.getItem(WOOD_BASKET_OUTDOOR_UPDATE_KEY)!=='done'){
  contactShadowMaster.items[WOOD_BASKET_OUTDOOR_SHADOW_ID]={
   itemId:WOOD_BASKET_OUTDOOR_SHADOW_ID,
   label:'Korpa sa drvima — napolju',
   shadow:{...WOOD_BASKET_OUTDOOR_SHADOW_DEFAULT}
  };
  localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));
  localStorage.setItem(WOOD_BASKET_OUTDOOR_UPDATE_KEY,'done');
 }
}catch(_){}
// Replace the old indoor calibration once, leaving the outdoor profile untouched.
try{
 if(localStorage.getItem(WOOD_BASKET_INDOOR_UPDATE_KEY)!=='done'){
  contactShadowMaster.items.korpa_drva={
   itemId:'korpa_drva',
   label:'Korpa sa drvima — u sobi',
   shadow:{...WOOD_BASKET_INDOOR_SHADOW_DEFAULT}
  };
  localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));
  localStorage.setItem(WOOD_BASKET_INDOOR_UPDATE_KEY,'done');
 }
}catch(_){}

function contactShadowProfileKeyFor(el){
 const id=el?.dataset?.itemId||'';
 if(el?.dataset?.marketBag==='1')return 'market_bag';
 if(el?.dataset?.crate==='1'||id.startsWith('crate_'))return 'produce_crate';
 if(id==='paprika_parna_kesa'||el?.dataset?.vesselSubtype==='paprika_steam_bag')return 'paprika_parna_kesa';
 if(el?.dataset?.vegetable==='1'||el?.dataset?.fruit==='1'){
   const key=el.dataset.vegKey||el.dataset.fruitKey||'';
   if(el.dataset.vegetable==='1'&&el.dataset.cutState==='diced'){
     if(key==='paprika'&&el.dataset.choppedRoastedPepper==='1'){
       return el.dataset.peeled==='1'
         ?'produce_paprika_pecena_seckana_oljustena'
         :'produce_paprika_pecena_seckana_neoljustena';
     }
     if(key)return `produce_${key}_diced`;
   }
   if(el.dataset.vegetable==='1'&&el.dataset.cutState==='sliced'&&key)return `produce_${key}_sliced`;
   if(el.dataset.onStoveTop==='1'&&key==='paprika')return 'produce_paprika_plotna_silja';
   if(el.dataset.onStoveTop==='1'&&key==='patlidzan')return 'produce_patlidzan_plotna';
   if(el.dataset.onStoveTop==='1'&&key==='paprika_zelena')return 'produce_paprika_zelena_plotna';
   if(key==='paprika'&&((+el.dataset.roastProgress||0)>0||(+el.dataset.roastPhase||0)>=2)){
     return el.dataset.peeled==='1'
       ?'produce_paprika_pecena_oljustena'
       :'produce_paprika_pecena_cela';
   }
   if(key==='patlidzan'&&(+el.dataset.roastPhase||0)>=3)return 'produce_patlidzan_pecen';
   if(key)return `produce_${key}`;
 }
 return id;
}

function contactShadowSurfaceFor(el){
 const x=+el?.dataset?.cx||0,y=+el?.dataset?.by||0;
 const p={x,y};
 try{
   // Use the same effective scene geometry used by placement/calibration.
   if(typeof stoveTopPlacementHit==='function'&&stoveTopPlacementHit(p))return 'stove';
   if(typeof tableFrontEdgeVisualZone==='function'&&tableFrontEdgeVisualZone(p))return 'table';
   const floorPoly=placementGeometry?.SURFACES?.floorPoly;
   if(Array.isArray(floorPoly)&&floorPoly.length>2&&pointInPoly(x,y,floorPoly))return 'floor';
 }catch(_){}
 const z=el?.dataset?.surfaceZone||'';
 if(z==='stove'||z==='floor'||z==='table')return z;
 return 'table';
}
function contactShadowCalibrationFor(el,surfaceOverride=null){
 const id=contactShadowProfileKeyFor(el);
 const entry=contactShadowMaster.items?.[id];
 if(!entry)return null;

 const toCfg=p=>p&&typeof p==='object'?{
   x:Number.isFinite(+p.shadowX)?+p.shadowX:(Number.isFinite(+p.x)?+p.x:0),
   y:Number.isFinite(+p.shadowY)?+p.shadowY:(Number.isFinite(+p.y)?+p.y:0),
   width:Number.isFinite(+p.width)?+p.width:.72,
   height:Number.isFinite(+p.height)?+p.height:.07,
   opacity:Number.isFinite(+p.opacity)?+p.opacity:.52,
   blur:Number.isFinite(+p.blur)?+p.blur:.8,
   angle:Number.isFinite(+p.angle)?+p.angle:0
 }:null;

 // Daska only: table / stove / floor profiles. During dragging,
 // surfaceOverride is the same live zone used by the perspective ghost.
 if(id==='daska'){
   const surface=(surfaceOverride==='table'||surfaceOverride==='stove'||surfaceOverride==='floor')
     ?surfaceOverride
     :contactShadowSurfaceFor(el);
   const p=entry?.points?.[surface]?.[0]
     ||entry.shadow||entry.profile
     ||entry?.points?.table?.[0]
     ||entry?.points?.stove?.[0]
     ||entry?.points?.floor?.[0];
   return toCfg(p);
 }

 // Every other item keeps one global profile everywhere.
 const p=entry.shadow||entry.profile
   ||entry?.points?.table?.[0]
   ||entry?.points?.stove?.[0]
   ||entry?.points?.floor?.[0];
 return toCfg(p);
}
const contactShadowAlphaBoundsCache=new Map();
function contactShadowAlphaBoundsFor(img){
 const src=img?.currentSrc||img?.src||'';
 return contactShadowAlphaBoundsCache.get(src)||null;
}
function prepareContactShadowAlphaBounds(contact,img){
 if(!contact||!img)return;
 const src=img.currentSrc||img.src||'';
 const apply=b=>{
   contact._alphaBounds=b||{l:0,t:0,r:1,b:1};
   try{contact._onAlphaBoundsReady?.();}catch(_){}
 };
 if(src&&contactShadowAlphaBoundsCache.has(src)){apply(contactShadowAlphaBoundsCache.get(src));return;}
 const scan=()=>{
   try{
     const nw=img.naturalWidth||0,nh=img.naturalHeight||0;
     if(!nw||!nh){apply({l:0,t:0,r:1,b:1});return;}
     const canvas=document.createElement('canvas');canvas.width=nw;canvas.height=nh;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.clearRect(0,0,nw,nh);ctx.drawImage(img,0,0,nw,nh);
     const data=ctx.getImageData(0,0,nw,nh).data;
     let minX=nw,minY=nh,maxX=-1,maxY=-1;
     for(let y=0;y<nh;y++){
       for(let x=0;x<nw;x++){
         if(data[(y*nw+x)*4+3]>8){
           if(x<minX)minX=x;if(x>maxX)maxX=x;
           if(y<minY)minY=y;if(y>maxY)maxY=y;
         }
       }
     }
     const b=maxX>=minX&&maxY>=minY
       ?{l:minX/nw,t:minY/nh,r:(maxX+1)/nw,b:(maxY+1)/nh}
       :{l:0,t:0,r:1,b:1};
     if(src)contactShadowAlphaBoundsCache.set(src,b);
     apply(b);
   }catch(_){apply({l:0,t:0,r:1,b:1});}
 };
 if(img.complete&&img.naturalWidth)scan();
 else img.addEventListener('load',scan,{once:true});
}
function styleCalibratedContactShadow(contact,cfg,w,h,cx,by,ang,held=false){
 if(!contact||!cfg)return false;
 const sy=Math.max(.01,+cfg.height||.07),sx=Math.max(.05,+cfg.width||.72);
 const b=contact._alphaBounds||contactShadowAlphaBoundsFor(contact.querySelector('img'))||{l:0,t:0,r:1,b:1};
 const bw=Math.max(.01,b.r-b.l),bh=Math.max(.01,b.b-b.t);
 const cropW=w*bw,cropH=h*bh;
 const x0=cx-w/2+w*b.l+(+cfg.x||0);
 const shadowBottom=by+(+cfg.y||0);

 contact.style.display='block';
 contact.style.overflow='hidden';
 contact.style.width=cropW+'px';
 contact.style.height=cropH+'px';
 contact.style.left=x0+'px';
 contact.style.top=(shadowBottom-cropH)+'px';
 contact.style.transformOrigin='50% 100%';
 contact.style.opacity=Math.max(0,Math.min(1,+cfg.opacity||0)).toFixed(3);
 contact.style.filter=`blur(${Math.max(0,+cfg.blur||0)}px)`;
 contact.style.transform=`rotate(${ang+(+cfg.angle||0)}deg) scaleX(${sx}) scaleY(${sy})`;

 const img=contact.querySelector(':scope > img');
 if(img){
   img.style.position='absolute';
   img.style.width=w+'px';
   img.style.height=h+'px';
   img.style.left=(-w*b.l)+'px';
   img.style.top=(-h*b.t)+'px';
   img.style.maxWidth='none';
   img.style.maxHeight='none';
 }
 return true;
}
function styleBoardContactShadow(contact,cfg,w,h,cx,by,ang,held=false){
 if(!contact||!cfg)return false;
 const sx=Math.max(.05,+cfg.width||.72);
 const sy=Math.max(.01,+cfg.height||.07);
 const shadowW=Math.max(8,w*sx);
 const shadowH=Math.max(3,h*sy);
 const x=cx-shadowW/2+(+cfg.x||0);
 const y=by-shadowH*.58+(+cfg.y||0);

 contact.style.display='block';
 contact.style.overflow='visible';
 contact.style.width=shadowW+'px';
 contact.style.height=shadowH+'px';
 contact.style.left=x+'px';
 contact.style.top=y+'px';
 contact.style.transformOrigin='50% 50%';
 contact.style.opacity=Math.max(0,Math.min(1,+cfg.opacity||0)).toFixed(3);
 contact.style.filter=`blur(${Math.max(0,+cfg.blur||0)}px)`;
 contact.style.transform=`rotate(${ang+(+cfg.angle||0)}deg)`;
 contact.style.background='rgba(0,0,0,.72)';
 contact.style.borderRadius='0';

 const img=contact.querySelector('img');
 if(img)img.style.display='none';
 return true;
}

function applyCalibratedContactShadow(el,contact,w,h,cx,by,ang,held){
 const cfg=contactShadowCalibrationFor(el);
 return styleCalibratedContactShadow(contact,cfg,w,h,cx,by,ang,held);
}
window.CooksterDebugContactShadow=(itemId='serpa_velika')=>{
 const el=(items||[]).find(x=>x.dataset.itemId===itemId);
 if(!el)return null;
 const persisted=null;
 const surface=contactShadowSurfaceFor(el);
 return {
   itemId,
   datasetSurface:el.dataset.surfaceZone||null,
   resolvedShadowSurface:surface,
   pose:{cx:+el.dataset.cx||0,by:+el.dataset.by||0,vis:+el.dataset.vis||1},
   calibration:contactShadowCalibrationFor(el),
   persisted:persisted?.items?.[itemId]||null,
   css:el._contactShadow?{
     left:el._contactShadow.style.left,
     top:el._contactShadow.style.top,
     width:el._contactShadow.style.width,
     height:el._contactShadow.style.height,
     transform:el._contactShadow.style.transform,
     filter:el._contactShadow.style.filter,
     opacity:el._contactShadow.style.opacity
   }:null
 };
};


function defaultContactFieldsFor(el){
 const isPot=(el?.dataset?.itemId||'').includes('serpa');
 return isPot?{x:0,y:0,width:1.10,height:.70,opacity:.52,blur:.8,angle:.6}:{...contactFields,height:el?.dataset?.itemId==='daska'?.14:.16};
}
function applyContactEditorPreview(){return false;}

// Legacy keys that were never read by any renderer.
for(const k of ['shadowX','shadowY','shadowWidth','shadowHeight','shadowOpacity','shadowBlur','shadowAngle'])delete lightTool[k];

const LS_UI_KEY='cookster.light-studio.ui.v1';
const LS_SNAP_KEY='cookster.light-studio.snapshots.v1';
const LS_ITEM_DATA_KEYS=['keyframes','contactOverrides','sunShadowShapes','itemShadowProfiles','shadowVisibility'];
const LS_PHASES=[['night','Noć',0],['morning','Jutro',7],['noon','Podne',12],['evening','Veče',19]];
const lsState={open:false,tab:'atmosfera',side:'right',collapsed:false,boost:true,handles:true,sections:{},hidden:{},mode:'',editing:false,editBase:null,dirtyKeys:new Set(),frameSel:null,query:'',savedAt:0};
try{const ui=JSON.parse(localStorage.getItem(LS_UI_KEY)||'{}');for(const k of ['tab','side','collapsed','boost','handles','sections'])if(ui[k]!==undefined)lsState[k]=ui[k];}catch(_){}
function lsSaveUi(){try{localStorage.setItem(LS_UI_KEY,JSON.stringify({tab:lsState.tab,side:lsState.side,collapsed:lsState.collapsed,boost:lsState.boost,handles:lsState.handles,sections:lsState.sections}));}catch(_){}}
function lsBoost(){return !!(lsState.open&&lsState.boost);}
function lsScale(){try{return Math.max(.15,scale||1);}catch(_){return 1;}}
function lsClamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lsClone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function lsFmt(m){m=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function lsFrames(){return Array.isArray(lightTool.keyframes)?lightTool.keyframes:[];}
function lsFrameNear(m){return lsFrames().find(f=>{const d=Math.abs(f.minute-m);return Math.min(d,1440-d)<5;})||null;}
function snapshotLightSettings(){const s={};for(const [k,v] of Object.entries(lightTool))if(!LS_ITEM_DATA_KEYS.includes(k))s[k]=lsClone(v);return s;}
function lsMarkSaved(){lsState.savedAt=Date.now();lsRenderSaved?.();}

/* ---------- DOM helpers ---------- */
function lsEl(tag,attrs,...kids){
 const n=document.createElement(tag);
 for(const [k,v] of Object.entries(attrs||{})){
  if(v==null||v===false)continue;
  if(k==='class')n.className=v;
  else if(k==='html')n.innerHTML=v;
  else if(k==='dataset')Object.assign(n.dataset,v);
  else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);
  else n.setAttribute(k,v===true?'':v);
 }
 for(const kid of kids.flat())if(kid!=null&&kid!==false)n.append(kid.nodeType?kid:document.createTextNode(String(kid)));
 return n;
}
const LS_ICON={
 undo:'<path d="M4.5 6.5h6a3.5 3.5 0 010 7H8"/><path d="M7 3.8L4.2 6.5 7 9.2"/>',
 redo:'<path d="M11.5 6.5h-6a3.5 3.5 0 000 7H8"/><path d="M9 3.8l2.8 2.7L9 9.2"/>',
 peek:'<path d="M1.6 8S4 3.6 8 3.6 14.4 8 14.4 8 12 12.4 8 12.4 1.6 8 1.6 8z"/><circle cx="8" cy="8" r="2.1"/>',
 hidden:'<path d="M2.2 2.2l11.6 11.6"/><path d="M6.4 3.9A6.7 6.7 0 018 3.6C12 3.6 14.4 8 14.4 8a12 12 0 01-1.9 2.4M10.1 11.9A5.6 5.6 0 018 12.4C4 12.4 1.6 8 1.6 8a11.6 11.6 0 012.5-3"/>',
 side:'<rect x="2" y="3" width="12" height="10" rx="1.6"/><path d="M10 3v10"/>',
 min:'<path d="M4 10l4-4 4 4"/>',max:'<path d="M4 6l4 4 4-4"/>',
 close:'<path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6"/>',
 play:'<path d="M5.2 3.4v9.2L12.4 8z" fill="currentColor" stroke="none"/>',
 pause:'<rect x="4.2" y="3.6" width="2.6" height="8.8" rx=".6" fill="currentColor" stroke="none"/><rect x="9.2" y="3.6" width="2.6" height="8.8" rx=".6" fill="currentColor" stroke="none"/>',
 prev:'<path d="M9.8 4L5.8 8l4 4"/>',next:'<path d="M6.2 4l4 4-4 4"/>',
 plus:'<path d="M8 3.2v9.6M3.2 8h9.6"/>',
 pick:'<circle cx="8" cy="8" r="4.6"/><path d="M8 1.2v3M8 11.8v3M1.2 8h3M11.8 8h3"/>',
 trash:'<path d="M3 4.6h10M6.4 4.6V3h3.2v1.6M4.6 4.6l.6 8.4h5.6l.6-8.4"/>',
 dup:'<rect x="5.4" y="5.4" width="7.6" height="7.6" rx="1.2"/><path d="M3 10.4V4.2A1.2 1.2 0 014.2 3h6.2"/>',
 chev:'<path d="M5.5 4l4 4-4 4"/>',
 brush:'<path d="M13.4 2.6L7.2 8.8"/><path d="M6.6 9.4c-1.8 0-3 1.2-3 2.8 0 .8-.6 1.3-1.2 1.4 2.8.8 5.8-.2 5.8-2.8z"/>',
 wand:'<path d="M3 13l7.4-7.4M9.2 4.4l1.2-1.2M12.6 6.8l1.2-1.2M11.6 3.2V1.6M13.8 4.4h1.6"/>'
};
function lsIcon(name){return `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LS_ICON[name]||''}</svg>`;}
function lsIconBtn(name,title,onclick,cls=''){return lsEl('button',{type:'button',class:'ls-ib '+cls,title,'aria-label':title,html:lsIcon(name),onclick});}
function lsBtn(label,onclick,opts={}){const b=lsEl('button',{type:'button',class:'ls-btn '+(opts.cls||''),title:opts.title||null,onclick});b.innerHTML=(opts.icon?lsIcon(opts.icon):'')+`<span>${label}</span>`;return b;}
function lsSetBtnLabel(b,label){const s=b.querySelector('span');if(s)s.textContent=label;else b.textContent=label;}
// Destructive buttons ask once, inline, instead of a browser dialog.
function lsConfirmBtn(label,confirmLabel,action,opts={}){
 let armed=0;const b=lsBtn(label,()=>{if(!armed){armed=setTimeout(()=>{armed=0;lsSetBtnLabel(b,label);b.classList.remove('is-armed');},2600);lsSetBtnLabel(b,confirmLabel);b.classList.add('is-armed');return;}clearTimeout(armed);armed=0;lsSetBtnLabel(b,label);b.classList.remove('is-armed');action();},{cls:'ls-danger '+(opts.cls||''),icon:opts.icon});
 return b;
}
const lsControls=[];
function lsSyncAll(){for(const s of lsControls)try{s();}catch(_){}}

function lsAttachDrag(range,min,max,step,commit){
 // Gameplay listens to window pointer events, so ranges own their gesture.
 const digits=(String(step).split('.')[1]||'').length;
 const fromX=x=>{const r=range.getBoundingClientRect(),t=lsClamp((x-r.left)/Math.max(1,r.width),0,1),raw=min+t*(max-min);return +lsClamp(Math.round((raw-min)/step)*step+min,min,max).toFixed(digits);};
 let drag=false;
 range.addEventListener('pointerdown',e=>{if(range.disabled)return;e.preventDefault();drag=true;range.setPointerCapture?.(e.pointerId);range.classList.add('is-drag');commit(fromX(e.clientX));});
 range.addEventListener('pointermove',e=>{if(drag)commit(fromX(e.clientX));});
 const end=e=>{if(!drag)return;drag=false;range.classList.remove('is-drag');range.releasePointerCapture?.(e.pointerId);lsAfterGesture();};
 range.addEventListener('pointerup',end);range.addEventListener('pointercancel',end);
}
function lsSlider(label,o){
 const {min,max,step}=o,digits=(String(step).split('.')[1]||'').length;
 const row=lsEl('div',{class:'ls-row ls-slider',dataset:{domain:o.domain||'sun'}});
 const name=lsEl('label',{class:'ls-lab',title:o.hint?o.hint+' · dvoklik vraća početnu vrednost':'Dvoklik vraća početnu vrednost'},label);
 const range=lsEl('input',{type:'range',min,max,step,'aria-label':label});
 const num=lsEl('input',{type:'number',min,max,step,class:'ls-num','aria-label':label});
 const paint=v=>range.style.setProperty('--p',lsClamp((v-min)/(max-min)*100,0,100)+'%');
 const commit=v=>{range.value=v;num.value=(+v).toFixed(digits);paint(v);o.set(v);};
 const sync=()=>{const v=o.get(),off=(o.disabled&&o.disabled())||v==null||!Number.isFinite(+v);row.classList.toggle('is-off',off);range.disabled=num.disabled=off;if(off)return;if(!range.classList.contains('is-drag'))range.value=v;if(document.activeElement!==num)num.value=(+v).toFixed(digits);paint(+v);};
 lsAttachDrag(range,min,max,step,commit);
 range.addEventListener('input',()=>commit(+range.value));
 range.addEventListener('change',lsAfterGesture);
 num.addEventListener('change',()=>{const v=+num.value;if(Number.isFinite(v))commit(lsClamp(v,min,max));lsAfterGesture();sync();});
 name.addEventListener('dblclick',()=>{if(range.disabled||o.def==null)return;commit(typeof o.def==='function'?o.def():o.def);lsAfterGesture();sync();});
 row.append(name,range,num);lsControls.push(sync);return row;
}
function lsColor(label,o){
 const row=lsEl('div',{class:'ls-row ls-color'});
 const input=lsEl('input',{type:'color','aria-label':label});
 const hex=lsEl('input',{type:'text',class:'ls-hex',maxlength:7,spellcheck:'false','aria-label':label+' hex'});
 const sync=()=>{const v=o.get(),off=(o.disabled&&o.disabled())||!v;row.classList.toggle('is-off',off);input.disabled=hex.disabled=off;if(off)return;input.value=v;if(document.activeElement!==hex)hex.value=v;};
 input.addEventListener('input',()=>{hex.value=input.value;o.set(input.value);});
 input.addEventListener('change',lsAfterGesture);
 hex.addEventListener('change',()=>{let v=hex.value.trim();if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-f]{6}$/i.test(v)){o.set(v.toLowerCase());lsAfterGesture();}sync();});
 row.append(lsEl('label',{class:'ls-lab'},label),lsEl('span',{class:'ls-swatch'},input),hex);lsControls.push(sync);return row;
}
function lsSwitch(label,o){
 const b=lsEl('button',{type:'button',role:'switch',class:'ls-switch'});
 b.innerHTML=`<span class="ls-switch-t"><i></i></span><span class="ls-switch-l">${label}</span>`;
 b.onclick=()=>{if(b.disabled)return;o.set(!o.get());sync();};
 const sync=()=>{const on=!!o.get(),off=o.disabled&&o.disabled();b.setAttribute('aria-checked',on?'true':'false');b.disabled=!!off;};
 lsControls.push(sync);return b;
}
function lsSegment(options,o){
 const wrap=lsEl('div',{class:'ls-seg',role:'group'});
 const btns=options.map(([value,label,title])=>{const b=lsEl('button',{type:'button',title:title||null},label);b.onclick=()=>{o.set(value);sync();};wrap.appendChild(b);return [value,b];});
 const sync=()=>{const v=o.get();for(const [value,b] of btns)b.setAttribute('aria-pressed',value===v?'true':'false');};
 lsControls.push(sync);return wrap;
}
function lsSection(id,title,domain,...kids){
 const open=lsState.sections[id]!==false;
 const sec=lsEl('section',{class:'ls-sec'+(open?' is-open':''),dataset:{domain}});
 const head=lsEl('button',{type:'button',class:'ls-sec-h','aria-expanded':open?'true':'false'});
 head.innerHTML=`<span class="ls-sec-mark"></span><span class="ls-sec-t">${title}</span>${lsIcon('chev')}`;
 head.onclick=()=>{const now=!sec.classList.contains('is-open');sec.classList.toggle('is-open',now);head.setAttribute('aria-expanded',now?'true':'false');lsState.sections[id]=now;lsSaveUi();};
 sec.append(head,lsEl('div',{class:'ls-sec-b'},...kids));return sec;
}
function lsNote(text,cls=''){return lsEl('p',{class:'ls-note '+cls},text);}
function lsLive(fn,cls='ls-note'){const n=lsEl('p',{class:cls});lsControls.push(()=>{const v=fn();n.textContent=v||'';n.hidden=!v;});return n;}

/* ---------- styles ---------- */
const lsStyle=document.createElement('style');
lsStyle.textContent=`
.ls{--bg:#221e27;--surface:#2b2631;--raise:#363040;--line:rgba(239,230,218,.09);--line2:rgba(239,230,218,.16);--text:#efe6da;--mute:#a69fae;--faint:#77707f;--sun:#f2b441;--sun-d:rgba(242,180,65,.16);--shade:#9aa5ff;--shade-d:rgba(154,165,255,.16);--danger:#ff8574;--ok:#86d7a8;
 position:fixed;top:52px;bottom:12px;right:12px;width:348px;max-width:calc(100vw - 24px);z-index:13000;color:var(--text);
 font:400 12px/1.35 Bahnschrift,"DIN Alternate","Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.005em}
.ls[data-side="left"]{right:auto;left:12px}
.ls *{box-sizing:border-box}
.ls-root{display:flex;flex-direction:column;height:100%;background:var(--bg);border:1px solid var(--line2);border-radius:14px;box-shadow:0 18px 48px rgba(8,5,12,.5),0 1px 0 rgba(255,255,255,.04) inset;overflow:hidden}
.ls.is-collapsed{bottom:auto}
.ls.is-collapsed .ls-tabs,.ls.is-collapsed .ls-body{display:none}
.ls button{font:inherit;color:inherit}
.ls-head{display:flex;align-items:center;gap:2px;padding:8px 8px 6px 14px}
.ls-title{flex:1;font-size:14px;font-weight:600;letter-spacing:.01em;display:flex;align-items:center;gap:8px;white-space:nowrap}
.ls-glyph{width:14px;height:14px;border-radius:50%;background:conic-gradient(from 200deg,var(--sun) 0 50%,#2d2a52 50% 100%);box-shadow:0 0 0 1.5px rgba(239,230,218,.25)}
.ls-ib{display:inline-grid;place-items:center;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--mute);cursor:pointer}
.ls-ib:hover:not(:disabled){background:var(--raise);color:var(--text)}
.ls-ib:disabled{opacity:.35;cursor:default}
.ls-ib.is-on{background:var(--sun-d);color:var(--sun)}
.ls :focus-visible{outline:2px solid var(--sun);outline-offset:1px}
/* day strip — the one loud element */
.ls-day{padding:2px 12px 10px;border-bottom:1px solid var(--line)}
.ls-strip{position:relative;height:46px;border-radius:9px;overflow:visible;cursor:ew-resize;touch-action:none}
.ls-strip canvas{display:block;width:100%;height:100%;border-radius:9px;box-shadow:0 0 0 1px var(--line2) inset}
.ls-play{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:#fff;border-radius:2px;box-shadow:0 0 0 1px rgba(20,12,24,.55),0 0 10px rgba(255,255,255,.5);pointer-events:none}
.ls-play b{position:absolute;top:-19px;left:50%;transform:translateX(-50%);padding:1px 5px;border-radius:5px;background:#fff;color:#1d1822;font-size:10.5px;font-weight:600;white-space:nowrap}
.ls-pin{position:absolute;bottom:-7px;width:13px;height:13px;margin-left:-6.5px;transform:rotate(45deg);background:var(--bg);border:2px solid var(--sun);border-radius:3px;cursor:grab;padding:0;touch-action:none}
.ls-pin:hover,.ls-pin.is-sel{background:var(--sun)}
.ls-pin.is-drag{cursor:grabbing;box-shadow:0 0 0 4px var(--sun-d)}
.ls-ticks{position:relative;height:20px;margin:9px 0 0}
.ls-ticks button{position:absolute;top:0;transform:translateX(-50%);border:0;background:none;padding:2px 4px;white-space:nowrap;border-radius:5px;color:var(--mute);font-size:11px;cursor:pointer}
.ls-ticks button:hover{color:var(--text);background:var(--raise)}
.ls-ticks button[aria-current="true"]{color:var(--sun)}
.ls-transport{display:flex;align-items:center;gap:4px;margin-top:8px;min-width:0}
.ls-transport .ls-btn{flex:none}
.ls-clock{font-size:20px;font-weight:600;letter-spacing:.02em;min-width:62px;margin:0 2px 0 2px}
.ls-chip{min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:11px;padding:3px 8px;border-radius:99px;background:var(--raise);color:var(--mute);white-space:nowrap}
.ls-chip[data-k="live"]{color:var(--ok)}
.ls-chip[data-k="edit"]{background:var(--sun-d);color:var(--sun)}
.ls-sp{flex:1}
.ls-bar{margin-top:9px;padding:8px 9px;border-radius:9px;background:var(--surface);border:1px solid var(--line)}
.ls-bar[data-tone="edit"]{border-color:rgba(242,180,65,.35);background:linear-gradient(180deg,rgba(242,180,65,.10),rgba(242,180,65,.03))}
.ls-bar p{margin:0 0 7px;color:var(--mute)}
.ls-bar p strong{color:var(--text);font-weight:600}
.ls-bar .ls-btns{margin:0}
.ls-bar.is-nudge{animation:lsNudge .38s}
@keyframes lsNudge{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
/* tabs */
.ls-tabs{display:flex;gap:2px;padding:6px 8px 0;border-bottom:1px solid var(--line)}
.ls-tabs button{flex:1;border:0;background:none;padding:7px 2px 8px;white-space:nowrap;color:var(--mute);cursor:pointer;border-bottom:2px solid transparent;font-weight:500}
.ls-tabs button:hover{color:var(--text)}
.ls-tabs button[aria-selected="true"]{color:var(--text);border-bottom-color:var(--text)}
.ls-tabs button i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;vertical-align:1px;background:var(--faint)}
.ls-tabs button[data-domain="sun"] i{background:var(--sun)}
.ls-tabs button[data-domain="shade"] i{background:var(--shade)}
.ls-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 0 14px;scrollbar-width:thin;scrollbar-color:var(--raise) transparent}
.ls-pane[hidden]{display:none}
.ls-sec{border-bottom:1px solid var(--line)}
.ls-sec-h{display:flex;align-items:center;gap:8px;width:100%;padding:11px 14px 9px;border:0;background:none;cursor:pointer;text-align:left}
.ls-sec-mark{width:3px;height:12px;border-radius:2px;background:var(--faint)}
.ls-sec[data-domain="sun"] .ls-sec-mark{background:var(--sun)}
.ls-sec[data-domain="shade"] .ls-sec-mark{background:var(--shade)}
.ls-sec-t{flex:1;font-size:12.5px;font-weight:600}
.ls-sec-h svg{color:var(--faint);transition:transform .15s}
.ls-sec.is-open .ls-sec-h svg{transform:rotate(90deg)}
.ls-sec-b{display:none;padding:0 14px 12px}
.ls-sec.is-open .ls-sec-b{display:block}
.ls-sub{margin:10px 0 2px;color:var(--mute);font-size:11px}
.ls-row{display:grid;grid-template-columns:96px 1fr 50px;gap:8px;align-items:center;min-height:28px}
.ls-row.is-off{opacity:.38}
.ls-lab{color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:default;user-select:none}
.ls-row:hover .ls-lab{color:var(--text)}
.ls input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:20px;background:transparent;cursor:ew-resize;touch-action:none;margin:0;--p:50%;--acc:var(--sun)}
.ls-slider[data-domain="shade"] input[type=range]{--acc:var(--shade)}
.ls input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:3px;background:linear-gradient(90deg,var(--acc) var(--p),var(--raise) var(--p))}
.ls input[type=range]::-moz-range-track{height:3px;border-radius:3px;background:linear-gradient(90deg,var(--acc) var(--p),var(--raise) var(--p))}
.ls input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;margin-top:-5px;border-radius:50%;background:var(--text);border:0;box-shadow:0 0 0 3px var(--bg)}
.ls input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:var(--text);border:0;box-shadow:0 0 0 3px var(--bg)}
.ls input[type=range].is-drag::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--sun-d)}
.ls-num,.ls-hex,.ls-input{width:100%;height:24px;padding:0 6px;border:1px solid transparent;border-radius:6px;background:var(--surface);color:var(--text);font:inherit;text-align:right;-moz-appearance:textfield}
.ls-num::-webkit-inner-spin-button{display:none}
.ls-num:hover,.ls-hex:hover,.ls-input:hover{border-color:var(--line2)}
.ls-num:focus,.ls-hex:focus,.ls-input:focus{outline:0;border-color:var(--sun)}
.ls-input{text-align:left;height:28px;padding:0 9px}
.ls-color .ls-hex{text-align:left;text-transform:lowercase}
.ls-color{grid-template-columns:96px 1fr 72px}
.ls-swatch{position:relative;height:22px;border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px var(--line2) inset}
.ls-swatch input{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);border:0;padding:0;cursor:pointer;background:none}
.ls-seg{display:flex;padding:2px;border-radius:8px;background:var(--surface);gap:2px;margin:4px 0 8px}
.ls-seg button{flex:1;border:0;border-radius:6px;background:none;padding:5px 4px;color:var(--mute);cursor:pointer}
.ls-seg button:hover{color:var(--text)}
.ls-seg button[aria-pressed="true"]{background:var(--raise);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,.3)}
.ls-btns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px}
.ls-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:1px solid var(--line2);border-radius:8px;background:var(--surface);color:var(--text);cursor:pointer;white-space:nowrap}
.ls-btn svg{flex:none;color:var(--mute)}
.ls-btn:hover:not(:disabled){background:var(--raise)}
.ls-btn:disabled{opacity:.4;cursor:default}
.ls-btn.ls-primary{background:var(--text);color:#1d1822;border-color:var(--text);font-weight:600}
.ls-btn.ls-primary svg{color:#1d1822}
.ls-btn.ls-primary:hover:not(:disabled){background:#fff}
.ls-btn.is-on{background:var(--sun-d);border-color:rgba(242,180,65,.55);color:var(--sun)}
.ls-btn.is-on svg{color:var(--sun)}
.ls-btn.ls-danger{color:var(--danger)}
.ls-btn.ls-danger svg{color:var(--danger)}
.ls-btn.is-armed{background:var(--danger);color:#1d1822;border-color:var(--danger)}
.ls-btn.is-armed svg{color:#1d1822}
.ls-btn.ls-ghost{border-color:transparent;background:none;color:var(--mute)}
.ls-btn.ls-ghost:hover{color:var(--text)}
.ls-note{margin:6px 0 4px;color:var(--mute);font-size:11.5px;line-height:1.45;max-width:60ch}
.ls-note.is-warn{color:var(--sun)}
.ls-empty{padding:12px;border:1px dashed var(--line2);border-radius:9px;color:var(--mute);line-height:1.45;margin:4px 0 8px}
.ls-meter{display:flex;align-items:center;gap:8px;margin:0 0 6px;color:var(--mute)}
.ls-meter span{flex:1;height:4px;border-radius:4px;background:var(--raise);overflow:hidden}
.ls-meter span i{display:block;height:100%;background:var(--sun);border-radius:4px}
.ls-list{display:flex;flex-direction:column;gap:2px;margin:4px 0 8px;max-height:196px;overflow:auto}
.ls-item{display:flex;align-items:center;gap:8px;min-height:32px;padding:3px 4px 3px 8px;border-radius:8px;cursor:pointer;border:1px solid transparent}
.ls-item:hover{background:var(--surface)}
.ls-item.is-sel{background:var(--raise);border-color:var(--line2)}
.ls-item.is-muted .ls-item-n{opacity:.45;text-decoration:line-through}
.ls-dot{flex:none;width:14px;height:14px;border-radius:50%;box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 8px var(--glow,transparent)}
.ls-item-n{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls-item-m{color:var(--faint);font-size:11px;white-space:nowrap}
.ls-tags{display:flex;gap:3px}
.ls-tag{font-size:10px;padding:1px 5px;border-radius:5px;background:var(--surface);color:var(--mute);white-space:nowrap}
.ls-tag[data-k="obris"]{background:var(--shade-d);color:var(--shade)}
.ls-tag[data-k="stara"]{background:rgba(255,133,116,.14);color:var(--danger)}
.ls-tag[data-k="skrivena"]{background:transparent;box-shadow:0 0 0 1px var(--line2) inset}
.ls-card{padding:10px;border-radius:10px;background:var(--surface);margin:2px 0 8px}
.ls-card h4{margin:0 0 2px;font-size:13px;font-weight:600}
.ls-card small{color:var(--faint)}
.ls-chips{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0 8px}
.ls-chipbtn{border:1px solid var(--line2);background:none;border-radius:99px;padding:3px 9px 3px 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:var(--mute)}
.ls-chipbtn:hover{color:var(--text);background:var(--surface)}
.ls-chipbtn i{width:9px;height:9px;border-radius:50%}
.ls-chipbtn[aria-pressed="false"]{opacity:.5;text-decoration:line-through}
.ls-switch{display:flex;align-items:center;gap:9px;width:100%;min-height:30px;border:0;background:none;padding:0;cursor:pointer;text-align:left}
.ls-switch:disabled{opacity:.38;cursor:default}
.ls-switch-t{flex:none;width:28px;height:16px;border-radius:9px;background:var(--raise);position:relative;transition:background .15s}
.ls-switch-t i{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--mute);transition:transform .15s,background .15s}
.ls-switch[aria-checked="true"] .ls-switch-t{background:var(--sun)}
.ls-switch[aria-checked="true"] .ls-switch-t i{transform:translateX(12px);background:#1d1822}
.ls-switch-l{color:var(--text)}
.ls-foot{display:flex;align-items:center;gap:8px;min-height:32px;padding:6px 14px;border-top:1px solid var(--line);background:var(--surface);color:var(--mute);font-size:11.5px}
.ls-foot .ls-hint{flex:1;line-height:1.35}
.ls-foot .ls-hint b{color:var(--text);font-weight:600}
.ls-foot kbd{font:inherit;font-size:10.5px;padding:0 4px;border-radius:4px;border:1px solid var(--line2);color:var(--text)}
.ls-saved{white-space:nowrap}
.ls-saved.is-fresh{color:var(--ok)}
.ls-snap{display:grid;grid-template-columns:1fr auto auto;gap:4px;align-items:center;padding:5px 4px 5px 9px;border-radius:8px}
.ls-snap:hover{background:var(--surface)}
.ls-snap small{display:block;color:var(--faint)}
/* scene overlay */
.ls-ov{position:absolute;inset:0;pointer-events:none;z-index:15001}
.ls-ov svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ls-h-sun{fill:#f2b441;stroke:#fff}
.ls-h-dot{fill:#fff;stroke:#221e27}
.ls-h-line{stroke:#fff;stroke-dasharray:6 5;fill:none;opacity:.85}
.ls-h-ring{fill:none;stroke:#fff;stroke-dasharray:5 5;opacity:.7}
.ls-h-ring.is-sel{stroke:#f2b441;opacity:1;stroke-dasharray:none}
.ls-h-label{fill:#fff;font:600 11px Bahnschrift,"Segoe UI",sans-serif;paint-order:stroke;stroke:#221e27;stroke-width:3px}
.ls-h-box{fill:none;stroke:#9aa5ff;stroke-dasharray:6 4}
.ls-h-box.is-flash{animation:lsFlash .7s ease-out}
@keyframes lsFlash{from{stroke-width:6;opacity:.2}to{opacity:1}}
.ls-h-poly{fill:rgba(154,165,255,.16);stroke:#9aa5ff}
.ls-h-pt{fill:#fff;stroke:#3b3fa8}
.ls-h-pt.is-act{fill:#9aa5ff;stroke:#fff}
.ls-h-base{fill:rgba(242,180,65,.14);stroke:#f2b441;stroke-dasharray:4 3}
.ls-h-brush{fill:none;stroke:#fff;opacity:.9}
.ls-h-brush.is-shadow{stroke:#9aa5ff}
body.ls-mode-pick #scene,body.ls-mode-pick #scene *{cursor:crosshair!important}
body.ls-mode-light #scene,body.ls-mode-light #scene *{cursor:crosshair!important}
body.ls-mode-brush #scene,body.ls-mode-brush #scene *{cursor:none!important}
body.ls-mode-profile #scene,body.ls-mode-profile #scene *{cursor:copy!important}
body.ls-peek #cooksterDayTint,body.ls-peek #cooksterRoomGlow,body.ls-peek #cooksterSunBeam,body.ls-peek #cooksterDirectionalGradient,body.ls-peek #cooksterRadialLights,body.ls-peek #cooksterLightBrush,body.ls-peek #cooksterDarkBrush,body.ls-peek #cooksterMorningParticles,body.ls-peek #cooksterLensFlare,body.ls-peek .cookster-auto-item-shadow,body.ls-peek .cookster-drawn-sun-shadow,body.ls-peek .cookster-auto-room-shadow,body.ls-peek .ls-ov{visibility:hidden!important}
body.ls-hide-tone #cooksterDayTint,body.ls-hide-tone #cooksterRoomGlow{visibility:hidden!important}
body.ls-hide-beam #cooksterSunBeam,body.ls-hide-beam #cooksterMorningParticles,body.ls-hide-beam #cooksterLensFlare{visibility:hidden!important}
body.ls-hide-band #cooksterDirectionalGradient{visibility:hidden!important}
body.ls-hide-lights #cooksterRadialLights{visibility:hidden!important}
body.ls-hide-brush #cooksterLightBrush,body.ls-hide-brush #cooksterDarkBrush{visibility:hidden!important}
body.ls-hide-items .cookster-auto-item-shadow,body.ls-hide-items .cookster-drawn-sun-shadow,body.ls-hide-items .contact-shadow-sprite{visibility:hidden!important}
body.ls-hide-room .cookster-auto-room-shadow{visibility:hidden!important}
@media (prefers-reduced-motion:reduce){.ls *{transition:none!important;animation:none!important}}
@media (max-width:520px){.ls{top:auto;height:62vh;left:8px;right:8px;width:auto;bottom:8px}}
`;
document.head.appendChild(lsStyle);

/* ---------- panel shell ---------- */
const lightPanel=lsEl('div',{class:'ls',role:'dialog','aria-label':'Svetlo i senke'});
lightPanel.dataset.disabled='1';
lightPanel.hidden=true;
lightPanel.style.setProperty('display','none','important');
lightPanel.style.display='none';
const lsRoot=lsEl('div',{class:'ls-root'});lightPanel.appendChild(lsRoot);
Object.defineProperty(lightPanel,'open',{configurable:true,get(){return false;},set(v){v=false;lightPanel.style.setProperty('display','none','important');if(v===lsState.open)return;lsState.open=v;if(v){lightPanel.style.display='block';lsOnOpen();}else lsOnClose();}});

const lsUndoBtn=lsIconBtn('undo','Poništi (Ctrl+Z)',()=>lsUndo());
const lsRedoBtn=lsIconBtn('redo','Vrati (Ctrl+Shift+Z)',()=>lsRedo());
const lsPeekBtn=lsIconBtn('peek','Drži da vidiš scenu bez svetla i senki',null);
const lsSideBtn=lsIconBtn('side','Prebaci panel na drugu stranu',()=>{lsState.side=lsState.side==='right'?'left':'right';lsApplyShell();lsSaveUi();});
const lsMinBtn=lsIconBtn('min','Skupi panel',()=>{lsState.collapsed=!lsState.collapsed;lsApplyShell();lsSaveUi();});
const lsCloseBtn=lsIconBtn('close','Zatvori',()=>{lightPanel.open=false;});
for(const t of ['pointerdown'])lsPeekBtn.addEventListener(t,e=>{e.preventDefault();document.body.classList.add('ls-peek');lsPeekBtn.classList.add('is-on');});
for(const t of ['pointerup','pointerleave','pointercancel','blur'])lsPeekBtn.addEventListener(t,()=>{document.body.classList.remove('ls-peek');lsPeekBtn.classList.remove('is-on');});
lsRoot.appendChild(lsEl('header',{class:'ls-head'},lsEl('div',{class:'ls-title'},lsEl('span',{class:'ls-glyph'}),'Svetlo i senke'),lsUndoBtn,lsRedoBtn,lsPeekBtn,lsSideBtn,lsMinBtn,lsCloseBtn));
function lsApplyShell(){lightPanel.dataset.side=lsState.side;lightPanel.classList.toggle('is-collapsed',!!lsState.collapsed);lsMinBtn.innerHTML=lsIcon(lsState.collapsed?'max':'min');lsMinBtn.title=lsState.collapsed?'Raširi panel':'Skupi panel';}

/* ---------- day strip + transport ---------- */
const lsCanvas=lsEl('canvas',{width:640,height:92});
const lsPlayhead=lsEl('div',{class:'ls-play'},lsEl('b',{}));
const lsPins=lsEl('div',{});
const lsStrip=lsEl('div',{class:'ls-strip',title:'Prevuci da promeniš vreme'},lsCanvas,lsPins,lsPlayhead);
const lsTicks=lsEl('div',{class:'ls-ticks'});
const lsTickBtns=LS_PHASES.map(([k,label,h])=>{const minute=h*60;const b=lsEl('button',{type:'button',title:`Idi na ${lsFmt(minute)} — ${label.toLowerCase()}`},`${label} ${String(h).padStart(2,'0')}`);b.style.left=(minute/1440*100)+'%';if(!h)b.style.transform='none';b.onclick=()=>lsSetTime(minute);lsTicks.appendChild(b);return [k,minute,b];});
const lsPlayBtn=lsIconBtn('pause','Zaustavi vreme',()=>lsTogglePlay());
const lsClock=lsEl('span',{class:'ls-clock'},'--:--');
const lsChip=lsEl('span',{class:'ls-chip'},'');
const lsPrevBtn=lsIconBtn('prev','Prethodna tačka',()=>lsJumpFrame(-1));
const lsNextBtn=lsIconBtn('next','Sledeća tačka',()=>lsJumpFrame(1));
const lsAddFrameBtn=lsBtn('Tačka',()=>lsSaveFrameHere(),{icon:'plus',title:'Sačuvaj trenutni izgled kao tačku dana'});
const lsEditBar=lsEl('div',{class:'ls-bar',dataset:{tone:'edit'},hidden:true});
const lsFrameBar=lsEl('div',{class:'ls-bar',hidden:true});
const lsDayHint=lsEl('p',{class:'ls-note',hidden:true});
lsRoot.appendChild(lsEl('section',{class:'ls-day'},lsEl('div',{style:'height:18px'}),lsStrip,lsTicks,lsEl('div',{class:'ls-transport'},lsPlayBtn,lsClock,lsChip,lsEl('span',{class:'ls-sp'}),lsPrevBtn,lsNextBtn,lsAddFrameBtn),lsDayHint,lsEditBar,lsFrameBar));

function lsSampleDay(m){
 let cfg;try{cfg=resolvedLightSettings(m);}catch(_){cfg=lightTool;}
 const h=m/60,day=clamp01(Math.min((h-5)/2,(21-h)/2)),dawn=bell(h,5,7.2,10.5),eve=bell(h,16.5,19,21.5);
 const col=phaseMix(h,'Color',cfg),li=+phaseMix(h,'Light',cfg)||0,dk=+phaseMix(h,'Dark',cfg)||0;
 const sky=[22,20,40],mix=.28+.72*day,base=col.map((v,i)=>sky[i]+(v-sky[i])*mix);
 const out=base.map(v=>lsClamp(v*(1-dk*.55)+255*li*.35,0,255));
 const beam=clamp01((dawn*.92+day*.12+eve*.34)*(+cfg.beamStrength||0));
 return {rgb:out,beam};
}
let lsStripDirty=true;
function lsDrawStrip(){
 lsStripDirty=false;
 const ctx=lsCanvas.getContext('2d'),W=lsCanvas.width,H=lsCanvas.height,N=96;
 ctx.clearRect(0,0,W,H);
 const samples=[];for(let i=0;i<=N;i++)samples.push(lsSampleDay(i/N*1440));
 const g=ctx.createLinearGradient(0,0,W,0);
 samples.forEach((s,i)=>g.addColorStop(i/N,`rgb(${s.rgb.map(Math.round).join(',')})`));
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(255,255,255,.10)');shade.addColorStop(.55,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(10,6,16,.35)');
 ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=1;
 for(let hr=3;hr<24;hr+=3){const x=Math.round(hr/24*W)+.5;ctx.beginPath();ctx.moveTo(x,H-(hr%6?8:14));ctx.lineTo(x,H);ctx.stroke();}
 ctx.beginPath();samples.forEach((s,i)=>{const x=i/N*W,y=H-8-s.beam*(H-22);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
 ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fillStyle='rgba(242,180,65,.18)';ctx.fill();
 ctx.beginPath();samples.forEach((s,i)=>{const x=i/N*W,y=H-8-s.beam*(H-22);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
 ctx.strokeStyle='rgba(255,214,120,.95)';ctx.lineWidth=2;ctx.stroke();
}
let lsPinSig='',lsPinDrag=false;
function lsRenderPins(force){
 if(lsPinDrag)return;
 const fr=lsFrames(),sig=fr.map(f=>f.minute+(f===lsState.frameSel?'*':'')).join(',');
 if(!force&&sig===lsPinSig)return;lsPinSig=sig;
 lsPins.replaceChildren();
 lsFrames().slice().sort((a,b)=>a.minute-b.minute).forEach(f=>{
  const pin=lsEl('button',{type:'button',class:'ls-pin'+(lsState.frameSel===f?' is-sel':''),title:`Tačka ${lsFmt(f.minute)} · prevuci da pomeriš`,'aria-label':`Tačka ${lsFmt(f.minute)}`});
  pin.style.left=(f.minute/1440*100)+'%';
  let start=null,moved=false;
  pin.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();start=e.clientX;moved=false;lsPinDrag=true;pin.setPointerCapture?.(e.pointerId);});
  pin.addEventListener('pointermove',e=>{if(start==null)return;if(!moved&&Math.abs(e.clientX-start)<4)return;if(!moved){lsCheckpoint(true);moved=true;pin.classList.add('is-drag');}const r=lsStrip.getBoundingClientRect(),m=Math.round(lsClamp((e.clientX-r.left)/r.width,0,1)*1440/5)*5%1440;if(!lsFrames().some(o=>o!==f&&Math.abs(o.minute-m)<5)){f.minute=m;pin.style.left=(m/1440*100)+'%';pin.title=`Tačka ${lsFmt(m)}`;lsStripDirty=true;}});
  pin.addEventListener('pointercancel',()=>{start=null;lsPinDrag=false;pin.classList.remove('is-drag');});
  pin.addEventListener('pointerup',e=>{if(start==null)return;start=null;lsPinDrag=false;pin.classList.remove('is-drag');if(moved){lightTool.keyframes.sort((a,b)=>a.minute-b.minute);persistLightTool(true);lsState.frameSel=f;lsRefreshLighting();lsRenderDay();}else{lsState.frameSel=f;if(lsSetTime(f.minute))lsRenderDay();}});
  lsPins.appendChild(pin);
 });
}
let lsStripDrag=false;
lsStrip.addEventListener('pointerdown',e=>{if(e.target.closest('.ls-pin'))return;e.preventDefault();lsStripDrag=true;lsStrip.setPointerCapture?.(e.pointerId);lsStripTo(e.clientX);});
lsStrip.addEventListener('pointermove',e=>{if(lsStripDrag)lsStripTo(e.clientX);});
for(const t of ['pointerup','pointercancel'])lsStrip.addEventListener(t,()=>{lsStripDrag=false;});
function lsStripTo(x){const r=lsStrip.getBoundingClientRect(),m=Math.round(lsClamp((x-r.left)/r.width,0,.9993)*1440/5)*5;lsState.frameSel=lsFrameNear(m);lsSetTime(m);}

function lsSaveClock(){try{localStorage.setItem(GAME_CLOCK_KEY,JSON.stringify({anchorReal:gameClockAnchorReal,anchorMinute:gameClockAnchorMinute}));}catch(_){}}
function lsPauseAt(m){gameClockAnchorMinute=((m%1440)+1440)%1440;gameClockAnchorReal=Date.now();gameClockPaused=true;lsSaveClock();}
function lsHasUnsaved(){return lsState.editing&&lsState.dirtyKeys.size>0&&lsFrames().length>=2;}
function lsNudge(){lsEditBar.classList.remove('is-nudge');void lsEditBar.offsetWidth;lsEditBar.classList.add('is-nudge');}
function lsSetTime(m){
 if(lsHasUnsaved()){lsNudge();return false;}
 lsEndEdit();lsPauseAt(m);lightingEditorPreviewOverride=false;
 updateGameClock();lsRenderDay();lsSyncAll();lsRenderOverlay();return true;
}
function lsTogglePlay(){
 if(gameClockPaused){
  if(lsHasUnsaved()){lsNudge();return;}
  lsEndEdit();gameClockAnchorReal=Date.now();gameClockPaused=false;lightingEditorPreviewOverride=false;lsSaveClock();
 }else lsPauseAt(currentGameMinute());
 updateGameClock();lsRenderDay();
}
function lsJumpFrame(dir){
 const fr=lsFrames().slice().sort((a,b)=>a.minute-b.minute);if(!fr.length)return;
 const m=currentGameMinute();let t;
 if(dir>0)t=fr.find(f=>f.minute>m+.5)||fr[0];else t=[...fr].reverse().find(f=>f.minute<m-.5)||fr[fr.length-1];
 lsState.frameSel=t;lsSetTime(t.minute);
}
function lsSaveFrameHere(){
 lsCheckpoint(true);
 const minute=Math.round(currentGameMinute()),frame={minute,settings:snapshotLightSettings()},frames=lsFrames(),old=lsFrameNear(minute);
 if(old){old.settings=frame.settings;lsState.frameSel=old;}else{frames.push(frame);lsState.frameSel=frame;}
 lightTool.keyframes=frames.sort((a,b)=>a.minute-b.minute);
 lsEndEdit();lightingEditorPreviewOverride=false;persistLightTool(true);lsRefreshLighting();lsRenderDay();
 lsFlashHint(old?`Tačka ${lsFmt(old.minute)} je ažurirana.`:`Dodata tačka ${lsFmt(minute)}.`);
}
function lsApplyToAllFrames(){
 const keys=[...lsState.dirtyKeys];if(!keys.length)return;
 lsCheckpoint(true);
 for(const f of lsFrames())for(const k of keys)f.settings[k]=lsClone(lightTool[k]);
 lsEndEdit();lightingEditorPreviewOverride=false;persistLightTool(true);lsRefreshLighting();lsRenderDay();
 lsFlashHint(`Izmena je upisana u ${lsFrames().length} tačaka.`);
}
function lsDiscardEdit(){
 if(!lsState.editing)return;
 if(lsState.editBase){lsCheckpoint(true);const base=JSON.parse(lsState.editBase);for(const k of Object.keys(base))if(!LS_ITEM_DATA_KEYS.includes(k))lightTool[k]=base[k];brushRenderDirty=true;persistLightTool(true);}
 lsEndEdit();lightingEditorPreviewOverride=false;lsRefreshLighting();lsRenderDay();lsSyncAll();lsRenderLists();
}
function lsDeleteFrame(f){lsCheckpoint(true);lightTool.keyframes=lsFrames().filter(x=>x!==f);if(lsState.frameSel===f)lsState.frameSel=null;persistLightTool(true);lsRefreshLighting();lsRenderDay();}
function lsOverwriteFrame(f){lsCheckpoint(true);f.settings=snapshotLightSettings();lsEndEdit();lightingEditorPreviewOverride=false;persistLightTool(true);lsRefreshLighting();lsRenderDay();lsFlashHint(`Tačka ${lsFmt(f.minute)} je ažurirana.`);}

function lsRenderDay(){
 const m=currentGameMinute(),frames=lsFrames(),near=lsFrameNear(m);
 lsPlayhead.style.left=(m/1440*100)+'%';lsPlayhead.firstChild.textContent=lsFmt(m);
 lsClock.textContent=lsFmt(m);
 lsPlayBtn.innerHTML=lsIcon(gameClockPaused?'play':'pause');lsPlayBtn.title=gameClockPaused?'Pusti vreme':'Zaustavi vreme';
 let k='live',t='Teče';
 if(lsState.editing){k='edit';t='Uređuješ';}
 else if(gameClockPaused){k='pause';t=near?`Na tački ${lsFmt(near.minute)}`:'Pauza';}
 lsChip.dataset.k=k;lsChip.textContent=t;
 lsPrevBtn.disabled=lsNextBtn.disabled=!frames.length;
 lsSetBtnLabel(lsAddFrameBtn,near?'Upiši':'Tačka');lsAddFrameBtn.title=near?`Upiši trenutni izgled u tačku ${lsFmt(near.minute)}`:`Sačuvaj trenutni izgled kao tačku ${lsFmt(m)}`;
 const phaseNow=lsPhaseFor(m);
 for(const [key,minute,b] of lsTickBtns)b.setAttribute('aria-current',(key===phaseNow&&Math.abs(minute-m)<1)?'true':'false');
 lsDayHint.hidden=frames.length!==1;
 lsDayHint.textContent='Imaš jednu tačku. Dodaj bar još jednu da bi se svetlo menjalo tokom dana.';
 // edit bar
 const unsaved=lsState.editing&&lsState.dirtyKeys.size>0;
 lsEditBar.hidden=!unsaved;
 const editSig=unsaved?[frames.length,near?.minute,Math.round(m),[...lsState.dirtyKeys].join()].join('|'):'';
 if(unsaved&&editSig!==lsEditSig){lsEditSig=editSig;
  lsEditBar.replaceChildren();
  if(frames.length>=2){
   lsEditBar.append(lsEl('p',{},lsEl('strong',{},`Izmene važe samo za ${lsFmt(m)}.`),' Sačuvaj ih u tačku ili ih upiši u sve tačke dana.'));
   lsEditBar.append(lsEl('div',{class:'ls-btns'},lsBtn(near?`Upiši u ${lsFmt(near.minute)}`:`Nova tačka ${lsFmt(m)}`,()=>lsSaveFrameHere(),{cls:'ls-primary'}),lsBtn(`U sve tačke (${frames.length})`,()=>lsApplyToAllFrames(),{title:'Menja samo ono što si sad promenio: '+[...lsState.dirtyKeys].map(lsKeyName).join(', ')}),lsBtn('Odbaci',()=>lsDiscardEdit(),{cls:'ls-ghost'})));
  }else{
   lsEditBar.dataset.tone='';
   lsEditBar.append(lsEl('p',{},lsEl('strong',{},'Izmene se čuvaju automatski.'),' Ovo je osnovni izgled — važi za ceo dan dok ne postoje bar dve tačke.'));
   lsEditBar.append(lsEl('div',{class:'ls-btns'},lsBtn(near?`Upiši u ${lsFmt(near.minute)}`:`Sačuvaj kao tačku ${lsFmt(m)}`,()=>lsSaveFrameHere()),lsBtn('Gotovo',()=>{lsEndEdit();lsRenderDay();},{cls:'ls-ghost'})));
  }
  if(frames.length>=2)lsEditBar.dataset.tone='edit';
 }
 if(!unsaved)lsEditSig='';
 // frame bar
 const f=lsState.frameSel&&frames.includes(lsState.frameSel)?lsState.frameSel:null;
 lsFrameBar.hidden=!f||unsaved;
 const frameSig=f&&!unsaved?[f.minute,Math.abs(f.minute-m)<5,frames.length].join('|'):'';
 if(frameSig!==lsFrameSig&&f&&!unsaved){
  lsFrameBar.replaceChildren(lsEl('p',{},lsEl('strong',{},`Tačka ${lsFmt(f.minute)}`),Math.abs(f.minute-m)<5?' · prikazuje se sada':''),
   lsEl('div',{class:'ls-btns'},Math.abs(f.minute-m)>=5?lsBtn('Idi na nju',()=>lsSetTime(f.minute)):null,lsBtn('Upiši trenutni izgled',()=>lsOverwriteFrame(f)),lsConfirmBtn('Obriši','Sigurno?',()=>lsDeleteFrame(f),{icon:'trash'}),lsIconBtn('close','Zatvori',()=>{lsState.frameSel=null;lsRenderDay();})));
 }
 lsFrameSig=frameSig;
 if(lsStripDirty)lsDrawStrip();
 lsRenderPins();
}
let lsEditSig='',lsFrameSig='';

/* ---------- editing session + history ---------- */
const lsHist={undo:[],redo:[],last:0};
function lsCheckpoint(force){
 const now=performance.now();
 if(!force&&now-lsHist.last<700){lsHist.last=now;return;}
 lsHist.last=force?0:now;
 lsHist.undo.push(JSON.stringify(lightTool));if(lsHist.undo.length>60)lsHist.undo.shift();
 lsHist.redo.length=0;lsUpdateHist();
}
function lsAfterGesture(){lsHist.last=0;}
function lsUpdateHist(){lsUndoBtn.disabled=!lsHist.undo.length;lsRedoBtn.disabled=!lsHist.redo.length;}
function lsUndo(){if(!lsHist.undo.length)return;lsHist.redo.push(JSON.stringify(lightTool));lsRestore(lsHist.undo.pop());lsFlashHint('Poništeno.');}
function lsRedo(){if(!lsHist.redo.length)return;lsHist.undo.push(JSON.stringify(lightTool));lsRestore(lsHist.redo.pop());lsFlashHint('Vraćeno.');}
function lsItemSig(t,el){const k=shadowItemKey(el);return JSON.stringify([t.contactOverrides?.[k],t.sunShadowShapes?.[k],t.itemShadowProfiles?.[el.dataset.itemId],t.shadowVisibility?.[k]]);}
function lsRestore(json,opts={}){
 const before=lightTool,next={...LIGHT_DEFAULTS,...JSON.parse(json)};
 for(const k of ['contactOverrides','sunShadowShapes','itemShadowProfiles','shadowVisibility'])if(!next[k]||typeof next[k]!=='object')next[k]={};
 if(!Array.isArray(next.keyframes))next.keyframes=[];
 const changed=[...scene.querySelectorAll('.item')].filter(el=>lsItemSig(before,el)!==lsItemSig(next,el));
 lightTool=next;lsState.frameSel=null;
 if(selectedRadial>=(lightTool.radialLights||[]).length)selectedRadial=(lightTool.radialLights||[]).length-1;
 brushRenderDirty=true;lsHist.last=0;
 persistContactOverrides();persistLightTool(true);
 lsRefreshLighting();
 for(const el of changed)lsRefreshItem(el);
 lsStripDirty=true;lsUpdateHist();lsSyncAll();lsRenderLists();lsRenderDay();lsRenderOverlay();
}
function lsRefreshItem(el){
 if(!el?.isConnected||el.classList.contains('held'))return;
 if(Number.isFinite(+el.dataset.cx)&&Number.isFinite(+el.dataset.by)){
   try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);}catch(_){}
 }
}
let lsPreviewFrame=0;
function lsRefreshLighting(){return;}
function lsSchedulePreview(){return;}
function lsEnterEdit(){
 if(lightingEditorPreviewOverride&&lsState.editing)return;
 const m=currentGameMinute();
 lsPauseAt(m);
 lsState.editBase=JSON.stringify(lightTool);
 if(lsFrames().length>=2){
  const r=resolvedLightSettings(m);
  for(const k of Object.keys(r))if(!LS_ITEM_DATA_KEYS.includes(k))lightTool[k]=lsClone(r[k]);
  brushRenderDirty=true;
 }
 lightingEditorPreviewOverride=true;lsState.editing=true;lsState.dirtyKeys.clear();
 lsSyncAll();lsRenderLists();
}
function lsEndEdit(){lsState.editing=false;lsState.dirtyKeys.clear();lsState.editBase=null;}
// Every look change goes through here: undo checkpoint, "what you see is what you edit", autosave.
function lsLook(key,mutate){
 lsCheckpoint();
 lsEnterEdit();
 mutate();
 lsState.dirtyKeys.add(key);
 persistLightTool();lsSchedulePreview();
 if(lsEditBar.hidden!==(lsState.dirtyKeys.size===0))lsRenderDay();
}
function lsBind(key){return {get:()=>lightTool[key],set:v=>lsLook(key,()=>{lightTool[key]=v;}),def:()=>LIGHT_DEFAULTS[key]};}
const LS_KEY_NAMES={radialLights:'svetla',brushStrokes:'četkica',beamX:'položaj sunca',beamY:'položaj sunca',beamAngle:'ugao zraka',beamStrength:'jačina sunca',beamOpacity:'providnost zraka',beamBlur:'mekoća zraka',beamWidth:'širina zraka',beamHeight:'visina zraka',sunShadowLength:'dužina senki',dustOpacity:'prašina',flareOpacity:'odsjaj',gradientColor:'boja pojasa',gradientThickness:'širina pojasa',gradientOpacity:'providnost pojasa',gradientBlur:'mekoća pojasa',gradientX1:'položaj pojasa',gradientY1:'položaj pojasa',gradientX2:'položaj pojasa',gradientY2:'položaj pojasa',sunShapeColor:'boja senki',sunShapeOpacity:'providnost senki',sunShapeBlur:'mekoća senki',sunShapeGradient:'prelaz senki',produceShadowHeightScale:'senka povrća'};
function lsKeyName(k){if(LS_KEY_NAMES[k])return LS_KEY_NAMES[k];const p=LS_PHASES.find(([id])=>k.startsWith(id));if(p){const s=k.slice(p[0].length);return `${p[1].toLowerCase()} ${s==='Color'?'boja':s==='Light'?'svetlina':'zatamnjenje'}`;}return k;}

/* ---------- hint footer ---------- */
const lsHint=lsEl('span',{class:'ls-hint'});
const lsSaved=lsEl('span',{class:'ls-saved'});
lsRoot.appendChild(lsEl('footer',{class:'ls-foot'},lsHint,lsSaved));
let lsFlashTimer=0;
function lsFlashHint(text){lsHint.textContent=text;clearTimeout(lsFlashTimer);lsFlashTimer=setTimeout(lsRenderHint,2200);}
const LS_MODE_HINTS={
 pick:'<b>Klikni predmet</b> na sceni. Ostaje uključeno dok ne pritisneš <kbd>Esc</kbd>.',
 light:'<b>Klikni i povuci</b> na sceni da nacrtaš krug svetla. <kbd>Esc</kbd> otkazuje.',
 brush:'<b>Četkaj po sceni.</b> <kbd>[</kbd> <kbd>]</kbd> menjaju veličinu, <kbd>Esc</kbd> završava.',
 profile:'<b>Klik</b> dodaje tačku, klik na liniju ubacuje, <b>desni klik</b> briše. Žuta elipsa je dodir sa podlogom. <kbd>Enter</kbd> čuva.'
};
function lsRenderHint(){
 if(lsState.mode){lsHint.innerHTML=LS_MODE_HINTS[lsState.mode]||'';return;}
 const tips={atmosfera:'Žutu tačku (sunce) i krajeve pojasa pomeraš direktno na sceni.',svetla:'Klikni krug na sceni da ga izabereš, prevuci centar da ga pomeriš.',senke:'Izaberi predmet iz liste ili nišanom na sceni.',cuvanje:'Sve se čuva automatski u ovom pregledaču.'};
 lsHint.textContent=tips[lsState.tab]||'';
}
function lsRenderSaved(){
 if(!lsState.savedAt){lsSaved.textContent='';return;}
 const s=Math.round((Date.now()-lsState.savedAt)/1000);
 lsSaved.textContent=s<3?'Sačuvano':s<60?`Sačuvano pre ${s}s`:`Sačuvano ${new Date(lsState.savedAt).toLocaleTimeString('sr-RS',{hour:'2-digit',minute:'2-digit'})}`;
 lsSaved.classList.toggle('is-fresh',s<3);
}

/* ---------- tabs ---------- */
const LS_TABS=[['atmosfera','Atmosfera','sun'],['svetla','Svetla','sun'],['senke','Senke','shade'],['cuvanje','Čuvanje','']];
const lsTabBar=lsEl('nav',{class:'ls-tabs',role:'tablist'});
const lsBody=lsEl('div',{class:'ls-body'});
const lsPanes={};
for(const [id,label,domain] of LS_TABS){
 const b=lsEl('button',{type:'button',role:'tab',dataset:{tab:id,domain}},lsEl('i',{}),label);
 b.onclick=()=>lsSetTab(id);lsTabBar.appendChild(b);
 lsPanes[id]=lsEl('div',{class:'ls-pane',role:'tabpanel',hidden:true});lsBody.appendChild(lsPanes[id]);
}
lsRoot.insertBefore(lsTabBar,lsRoot.querySelector('.ls-foot'));
lsRoot.insertBefore(lsBody,lsRoot.querySelector('.ls-foot'));
function lsSetTab(id){
 if(lsState.tab!==id)lsSetMode('');
 lsState.tab=id;lsSaveUi();
 for(const b of lsTabBar.children)b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false');
 for(const [k,p] of Object.entries(lsPanes))p.hidden=k!==id;
 lsRenderLists();lsSyncAll();lsRenderHint();lsRenderOverlay();
}

/* ---------- tab: Atmosfera ---------- */
function lsPhaseFor(m){const h=m/60;let best='night',bd=99;for(const [id,,hr] of LS_PHASES){for(const x of [hr,hr+24]){const d=Math.abs(h-x);if(d<bd){bd=d;best=id;}}}return best;}
function lsPhase(){return lsPhaseFor(currentGameMinute());}
const lsPhaseSeg=lsSegment(LS_PHASES.map(([id,label,hr])=>[id,label,`Ton oko ${String(hr).padStart(2,'0')}:00`]),{get:lsPhase,set:v=>{const p=LS_PHASES.find(x=>x[0]===v);lsSetTime(p[2]*60);}});
function lsPhaseBind(suffix){return {get:()=>lightTool[lsPhase()+suffix],set:v=>{const k=lsPhase()+suffix;lsLook(k,()=>{lightTool[k]=v;});},def:()=>LIGHT_DEFAULTS[lsPhase()+suffix]};}
const lsSunMeter=lsEl('div',{class:'ls-meter'},'Sunce sada',lsEl('span',{},lsEl('i',{})),lsEl('b',{},'0%'));
lsControls.push(()=>{const b=window.CooksterGameLighting?.beam||0;lsSunMeter.querySelector('i').style.width=Math.round(b*100)+'%';lsSunMeter.querySelector('b').textContent=Math.round(b*100)+'%';});
const lsLayerChips=lsEl('div',{class:'ls-chips'});
for(const [k,label,color] of [['tone','Ton','#c9a27a'],['beam','Zrak','#f2b441'],['band','Pojas','#fcbc3b'],['lights','Svetla','#ffe0a0'],['brush','Četkica','#e7d2ff'],['items','Senke predmeta','#9aa5ff'],['room','Senke nameštaja','#6f79c9']]){
 const b=lsEl('button',{type:'button',class:'ls-chipbtn',title:'Samo za pregled — ne menja sačuvani izgled'},lsEl('i',{style:`background:${color}`}),label);
 b.onclick=()=>{lsState.hidden[k]=!lsState.hidden[k];document.body.classList.toggle('ls-hide-'+k,!!lsState.hidden[k]);sync();};
 const sync=()=>b.setAttribute('aria-pressed',lsState.hidden[k]?'false':'true');lsControls.push(sync);lsLayerChips.appendChild(b);
}
lsPanes.atmosfera.append(
 lsSection('tone','Ton prostorije','sun',
  lsPhaseSeg,
  lsLive(()=>{const p=LS_PHASES.find(x=>x[0]===lsPhase());return `Podešavaš ${p[1].toLowerCase()} (${String(p[2]).padStart(2,'0')}:00). Između faza se boje same pretapaju.`;}),
  lsColor('Boja',lsPhaseBind('Color')),
  lsSlider('Svetlina',{...lsPhaseBind('Light'),min:0,max:.8,step:.01,hint:'Koliko boja prosvetljava scenu'}),
  lsSlider('Zatamnjenje',{...lsPhaseBind('Dark'),min:0,max:.8,step:.01,domain:'shade',hint:'Koliko boja zatamnjuje scenu'})
 ),
 lsSection('beam','Sunčev zrak','sun',
  lsSunMeter,
  lsSlider('Jačina',{...lsBind('beamStrength'),min:0,max:2,step:.05,hint:'Pojačava zrak i topli pojas'}),
  lsSlider('Providnost',{...lsBind('beamOpacity'),min:0,max:1,step:.02}),
  lsSlider('Mekoća ivica',{...lsBind('beamBlur'),min:0,max:50,step:1}),
  lsSlider('Ugao',{...lsBind('beamAngle'),min:-60,max:60,step:1}),
  lsSlider('Dužina senki',{...lsBind('sunShadowLength'),min:.25,max:2.5,step:.05,domain:'shade',hint:'Senke nameštaja; predmeti imaju svoju granicu'}),
  lsEl('div',{class:'ls-sub'},'Oblik i efekti'),
  lsSlider('Širina',{...lsBind('beamWidth'),min:10,max:140,step:1}),
  lsSlider('Visina',{...lsBind('beamHeight'),min:10,max:140,step:1}),
  lsSlider('Prašina',{...lsBind('dustOpacity'),min:0,max:1,step:.02,hint:'Samo ujutru'}),
  lsSlider('Odsjaj sočiva',{...lsBind('flareOpacity'),min:0,max:1,step:.02,hint:'Samo ujutru'})
 ),
 lsSection('band','Topli pojas','sun',
  lsNote('Širok mek pojas svetla preko scene. Krajeve pomeraš na sceni.'),
  lsColor('Boja',lsBind('gradientColor')),
  lsSlider('Širina',{...lsBind('gradientThickness'),min:20,max:800,step:5}),
  lsSlider('Providnost',{...lsBind('gradientOpacity'),min:0,max:1,step:.02}),
  lsSlider('Mekoća',{...lsBind('gradientBlur'),min:0,max:60,step:1})
 ),
 lsSection('view','Prikaz dok uređuješ','',
  lsSwitch('Ručke na sceni',{get:()=>lsState.handles,set:v=>{lsState.handles=v;lsSaveUi();lsRenderOverlay();}}),
  lsSwitch('Senke punom jačinom (i noću)',{get:()=>lsState.boost,set:v=>{lsState.boost=v;lsSaveUi();lsRefreshLighting();lsRefreshItem(selectedShadowItem);}}),
  lsEl('div',{class:'ls-sub'},'Slojevi — klikni da sakriješ'),
  lsLayerChips
 )
);

/* ---------- tab: Svetla ---------- */
const LS_LIGHT_PRESETS=[['Vatra','#ff9a3c',{opacity:.7,softness:72,blur:18,flicker:.55,fireLinked:true}],['Sveća','#ffc46b',{opacity:.6,softness:65,blur:10,flicker:.35,fireLinked:false}],['Lampa','#ffe0a0',{opacity:.55,softness:82,blur:12,flicker:0,fireLinked:false}],['Mesečina','#9fb6ff',{opacity:.35,softness:90,blur:24,flicker:0,fireLinked:false}]];
// What the scene shows right now: base lights while editing (or with <2 day points), otherwise the blended day.
function lsLights(){
 if(!lsState.editing&&!lightingEditorPreviewOverride&&lsFrames().length>=2){try{const r=resolvedLightSettings(currentGameMinute()).radialLights;return Array.isArray(r)?r:[];}catch(_){}}
 if(!Array.isArray(lightTool.radialLights))lightTool.radialLights=[];
 return lightTool.radialLights;
}
function lsSelLight(){return lsLights()[selectedRadial]||null;}
function lsLightBind(prop,fallback){return {get:()=>{const l=lsSelLight();return l?(l[prop]??fallback):null;},set:v=>lsLook('radialLights',()=>{const l=lsSelLight();if(l)l[prop]=v;}),disabled:()=>!lsSelLight(),def:fallback};}
const lsLightList=lsEl('div',{class:'ls-list'});
const lsLightEmpty=lsEl('div',{class:'ls-empty'},'Nema tačkastih svetala. Dodaj jedno i povuci krug na sceni — dobro stoji uz ložište ili prozor.');
const lsAddLightBtn=lsBtn('Dodaj svetlo',()=>lsSetMode(lsState.mode==='light'?'':'light'),{icon:'plus'});
const lsLightInspector=lsEl('div',{});
const lsLightName=lsEl('input',{type:'text',class:'ls-input',placeholder:'Naziv svetla','aria-label':'Naziv svetla'});
lsLightName.addEventListener('change',()=>{const l=lsSelLight();if(!l)return;lsCheckpoint(true);l.name=lsLightName.value.trim();persistLightTool();lsRenderLists();});
lsControls.push(()=>{const l=lsSelLight();lsLightInspector.hidden=!l;if(l&&document.activeElement!==lsLightName)lsLightName.value=l.name||'';});
const lsPresetChips=lsEl('div',{class:'ls-chips'},LS_LIGHT_PRESETS.map(([name,color,p])=>{const b=lsEl('button',{type:'button',class:'ls-chipbtn',title:`Primeni izgled: ${name}`},lsEl('i',{style:`background:${color};box-shadow:0 0 6px ${color}`}),name);b.onclick=()=>lsLook('radialLights',()=>{const l=lsSelLight();if(!l)return;Object.assign(l,{color},p);if(!l.name)l.name=name;});b.addEventListener('click',()=>{lsSyncAll();lsRenderLists();});return b;}));
lsLightInspector.append(
 lsEl('div',{class:'ls-sub'},'Izabrano svetlo'),lsLightName,
 lsPresetChips,
 lsColor('Boja',lsLightBind('color','#ffe0a0')),
 lsSlider('Providnost',{...lsLightBind('opacity',.55),min:0,max:1,step:.02}),
 lsSlider('Poluprečnik',{...lsLightBind('radius',80),min:8,max:700,step:1}),
 lsSlider('Mekoća ivice',{...lsLightBind('softness',82),min:30,max:100,step:1}),
 lsSlider('Zamućenje',{...lsLightBind('blur',12),min:0,max:60,step:1}),
 lsSlider('Treperenje',{...lsLightBind('flicker',0),min:0,max:1,step:.02,hint:'Živa vatra ili sveća'}),
 lsSwitch('Svetli samo dok gori vatra',{get:()=>!!lsSelLight()?.fireLinked,set:v=>lsLook('radialLights',()=>{const l=lsSelLight();if(l)l.fireLinked=v;}),disabled:()=>!lsSelLight()}),
 lsEl('div',{class:'ls-btns'},
  lsBtn('Dupliraj',()=>{if(!lsSelLight())return;lsLook('radialLights',()=>{const l=lsSelLight();const c={...lsClone(l),x:l.x+2,y:l.y+2,name:(l.name||'Svetlo')+' kopija'};lightTool.radialLights.splice(selectedRadial+1,0,c);selectedRadial++;});lsRenderLists();lsSyncAll();},{icon:'dup'}),
  lsBtn('Obriši',()=>lsDeleteLight(selectedRadial),{icon:'trash',cls:'ls-danger'})
 )
);
function lsDeleteLight(i){if(!lsLights()[i])return;lsLook('radialLights',()=>{lsLights().splice(i,1);});selectedRadial=Math.min(i,lsLights().length-1);lsRenderLists();lsSyncAll();}
function lsSelectLight(i){selectedRadial=i;lsRenderLists();lsSyncAll();lsRenderOverlay();}

const lsBrushCount=lsEl('span',{class:'ls-item-m'});
const lsBrushBtn=lsBtn('Četkaj',()=>lsSetMode(lsState.mode==='brush'?'':'brush'),{icon:'brush'});
lsControls.push(()=>{lsBrushBtn.classList.toggle('is-on',lsState.mode==='brush');lsSetBtnLabel(lsBrushBtn,lsState.mode==='brush'?'Završi četkanje':'Četkaj');const n=(lightTool.brushStrokes||[]).length;lsBrushCount.textContent=n?`${n} ${n===1?'potez':n<5?'poteza':'poteza'}`:'Nema poteza';});
lsPanes.svetla.append(
 lsSection('lights','Tačkasta svetla','sun',lsLightEmpty,lsLightList,lsEl('div',{class:'ls-btns'},lsAddLightBtn),lsLightInspector),
 lsSection('brush','Četkica svetla i senke','sun',
  lsSegment([['light','Svetlo'],['shadow','Senka']],{get:()=>lightTool.brushMode,set:v=>{lightTool.brushMode=v;persistLightTool();lsSyncAll();lsRenderOverlay();}}),
  lsColor('Boja',{get:()=>lightTool.brushColor,set:v=>{lightTool.brushColor=v;persistLightTool();}}),
  lsSlider('Veličina',{get:()=>lightTool.brushSize,set:v=>{lightTool.brushSize=v;persistLightTool();lsRenderOverlay();},min:10,max:500,step:5,def:120}),
  lsSlider('Providnost',{get:()=>lightTool.brushOpacity,set:v=>{lightTool.brushOpacity=v;persistLightTool();},min:0,max:1,step:.02,def:.3}),
  lsSlider('Mekoća',{get:()=>lightTool.brushSoftness,set:v=>{lightTool.brushSoftness=v;persistLightTool();},min:10,max:100,step:1,def:70}),
  lsSlider('Zamućenje',{get:()=>lightTool.brushBlur,set:v=>{lightTool.brushBlur=v;persistLightTool();},min:0,max:60,step:1,def:10}),
  lsEl('div',{class:'ls-btns'},lsBrushBtn,
   lsBtn('Poništi potez',()=>{if(!(lightTool.brushStrokes||[]).length)return;lsLook('brushStrokes',()=>{lightTool.brushStrokes.pop();brushRenderDirty=true;});lsSyncAll();}),
   lsConfirmBtn('Obriši sve','Obriši sve poteze?',()=>{lsLook('brushStrokes',()=>{lightTool.brushStrokes=[];brushRenderDirty=true;});lsSyncAll();},{icon:'trash'})),
  lsEl('p',{class:'ls-note'},lsBrushCount)
 )
);
function lsRenderLightList(){
 const lights=lsLights();lsLightEmpty.hidden=!!lights.length;lsLightList.hidden=!lights.length;
 lsLightList.replaceChildren(...lights.map((l,i)=>{
  const row=lsEl('div',{class:'ls-item'+(i===selectedRadial?' is-sel':'')+(l.hidden?' is-muted':''),role:'button',tabindex:0});
  const dot=lsEl('span',{class:'ls-dot',style:`background:${l.color||'#ffe0a0'};--glow:${l.color||'#ffe0a0'}`});
  const eye=lsIconBtn(l.hidden?'hidden':'peek',l.hidden?'Uključi svetlo':'Isključi svetlo',e=>{e.stopPropagation();lsLook('radialLights',()=>{const x=lsLights()[i];if(x)x.hidden=!x.hidden;});lsRenderLists();});
  const del=lsIconBtn('trash','Obriši svetlo',e=>{e.stopPropagation();lsDeleteLight(i);});
  const tags=lsEl('span',{class:'ls-tags'},l.fireLinked?lsEl('span',{class:'ls-tag'},'vatra'):null,(+l.flicker||0)>0?lsEl('span',{class:'ls-tag'},'treperi'):null);
  row.append(dot,lsEl('span',{class:'ls-item-n'},l.name||`Svetlo ${i+1}`),tags,lsEl('span',{class:'ls-item-m'},Math.round(+l.radius||0)+' px'),eye,del);
  row.onclick=()=>lsSelectLight(i);row.onkeydown=e=>{if(e.key==='Enter')lsSelectLight(i);};
  return row;
 }));
}

/* ---------- tab: Senke ---------- */
const lsPickBtn=lsBtn('Nišani',()=>lsSetMode(lsState.mode==='pick'?'':'pick'),{icon:'pick',title:'Izaberi predmet klikom na sceni'});
const lsSearch=lsEl('input',{type:'search',class:'ls-input',placeholder:'Traži predmet…','aria-label':'Traži predmet'});
lsSearch.addEventListener('input',()=>{lsState.query=lsSearch.value.trim().toLowerCase();lsRenderItemList();});
const lsItemList=lsEl('div',{class:'ls-list'});
const lsItemCard=lsEl('div',{class:'ls-card'});
const lsItemInspector=lsEl('div',{});
function lsSel(){return selectedShadowItem?.isConnected?selectedShadowItem:null;}
function lsItemLabel(el){return el?.dataset?.label||el?.dataset?.itemId||'Predmet';}
function lsItemTags(el){
 const k=shadowItemKey(el),t=[];
 if(lightTool.itemShadowProfiles?.[el.dataset.itemId])t.push(['obris','obris']);
 else if(lightTool.sunShadowShapes?.[k])t.push(['stara','stara senka']);
 if(lightTool.contactOverrides?.[k])t.push(['kontakt','kontakt']);
 if(lightTool.shadowVisibility?.[k]===false)t.push(['skrivena','skrivena']);
 return t;
}
function lsSceneItems(){return [...scene.querySelectorAll('.item')].filter(el=>el.dataset.itemId&&el.style.display!=='none'&&el.offsetWidth>0);}
function lsSelectItem(el,flash=true){
 if(lsState.mode==='profile')lsSetMode('');
 selectedShadowItem=el;lsItemFlash=flash?performance.now():0;
 lsRenderLists();lsSyncAll();lsRenderOverlay();
 if(el){const row=lsItemList.querySelector('.is-sel');row?.scrollIntoView?.({block:'nearest'});}
}
let lsItemFlash=0,lsItemCount=-1;
function lsRenderItemList(){
 const all=lsSceneItems(),q=lsState.query,sel=lsSel();lsItemCount=all.length;
 const rows=all.filter(el=>!q||lsItemLabel(el).toLowerCase().includes(q)||el.dataset.itemId.toLowerCase().includes(q)).sort((a,b)=>lsItemLabel(a).localeCompare(lsItemLabel(b),'sr'));
 if(!rows.length){lsItemList.replaceChildren(lsEl('div',{class:'ls-empty'},q?`Nijedan predmet ne odgovara „${lsSearch.value}“.`:'Na sceni nema predmeta.'));return;}
 lsItemList.replaceChildren(...rows.map(el=>{
  const tags=lsItemTags(el);
  const row=lsEl('div',{class:'ls-item'+(el===sel?' is-sel':''),role:'button',tabindex:0},lsEl('span',{class:'ls-item-n'},lsItemLabel(el)),lsEl('span',{class:'ls-tags'},tags.map(([k,l])=>lsEl('span',{class:'ls-tag',dataset:{k}},l))));
  row.onclick=()=>lsSelectItem(el);row.onkeydown=e=>{if(e.key==='Enter')lsSelectItem(el);};
  return row;
 }));
}
function lsRenderItemCard(){
 const el=lsSel();lsItemInspector.hidden=!el;
 if(!el){lsItemCard.replaceChildren(lsEl('small',{},'Nijedan predmet nije izabran.'));return;}
 const same=lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).length;
 lsItemCard.replaceChildren(lsEl('h4',{},lsItemLabel(el)),lsEl('small',{},same>1?`${same} ovakvih na sceni`:'Jedini ovakav na sceni'));
}
function lsContactBind(){return {get:()=>null,set:()=>{},disabled:()=>true,def:0};}
let lsItemPersistTimer=0;
function lsPersistItemData(){clearTimeout(lsItemPersistTimer);lsItemPersistTimer=setTimeout(()=>{persistContactOverrides();persistLightTool(true);lsRenderItemList();},250);}
function lsSetShadowVisible(){return false;}
const lsSunStatus=lsEl('p',{class:'ls-note'});
const lsProfileEdit=lsBtn('Uredi obris',()=>lsSetMode(lsState.mode==='profile'?'':'profile'),{icon:'pick'});
const lsProfileAuto=lsBtn('Auto obris',()=>lsAutoProfile(),{icon:'wand',title:'Napravi obris iz slike predmeta'});
const lsProfileSave=lsBtn('Sačuvaj obris',()=>lsSaveProfile(),{cls:'ls-primary'});
const lsProfileCancel=lsBtn('Otkaži',()=>lsSetMode(''),{cls:'ls-ghost'});
const lsProfileDelete=lsConfirmBtn('Obriši obris','Obriši za sve iste?',()=>{const el=lsSel();if(!el)return;lsCheckpoint(true);delete lightTool.itemShadowProfiles[el.dataset.itemId];persistLightTool(true);lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).forEach(lsRefreshItem);lsRenderLists();lsSyncAll();},{icon:'trash'});
const lsLegacyDelete=lsConfirmBtn('Obriši staru senku','Sigurno?',()=>{const el=lsSel();if(!el)return;lsCheckpoint(true);delete lightTool.sunShadowShapes[shadowItemKey(el)];persistLightTool(true);lsRefreshItem(el);lsRenderLists();lsSyncAll();},{icon:'trash'});
lsControls.push(()=>{
 const el=lsSel(),editing=lsState.mode==='profile';
 const prof=el&&lightTool.itemShadowProfiles?.[el.dataset.itemId],legacy=el&&lightTool.sunShadowShapes?.[shadowItemKey(el)];
 const same=el?lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).length:0;
 lsSunStatus.className='ls-note';
 if(!el)lsSunStatus.textContent='';
 else if(editing)lsSunStatus.textContent=`Obris važi za svaki predmet „${lsItemLabel(el)}“${same>1?` (${same} na sceni)`:''}.`;
 else if(prof)lsSunStatus.textContent=`Ima obris (${prof.points.length} tačaka) — senka prati sunce${same>1?` · važi za svih ${same}`:''}.`;
 else if(legacy){lsSunStatus.textContent='Koristi staru ručno crtanu senku. Napravi obris da je zameniš — obris ima prednost.';lsSunStatus.classList.add('is-warn');}
 else lsSunStatus.textContent='Nema obris, pa nema ni senku od sunca. Klikni „Auto obris“ za brz početak.';
 lsProfileEdit.hidden=editing;lsProfileAuto.hidden=false;lsProfileSave.hidden=lsProfileCancel.hidden=!editing;
 lsProfileDelete.hidden=editing||!prof;lsLegacyDelete.hidden=editing||!legacy;
 lsSetBtnLabel(lsProfileEdit,prof?'Uredi obris':'Nacrtaj obris');
});
const lsContactSame=lsBtn('Na sve iste',()=>{const el=lsSel();if(!el)return;lsCheckpoint(true);const src=lightTool.contactOverrides?.[shadowItemKey(el)]||defaultContactFieldsFor(el);let n=0;for(const x of lsSceneItems())if(x.dataset.itemId===el.dataset.itemId&&x!==el){lightTool.contactOverrides[shadowItemKey(x)]={...src};applyContactEditorPreview(x);n++;}lightTool.contactOverrides[shadowItemKey(el)]={...src};lsPersistItemData();lsFlashHint(n?`Kontaktna senka kopirana na još ${n}.`:'Nema drugih istih predmeta.');},{icon:'dup',title:'Kopiraj ovu kontaktnu senku na sve iste predmete'});
lsControls.push(()=>{const el=lsSel();const n=el?lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).length-1:0;lsContactSame.disabled=n<1;lsSetBtnLabel(lsContactSame,n>0?`Na sve iste (${n})`:'Na sve iste');});
lsItemInspector.append(
 lsSwitch('Senka vidljiva',{get:()=>{const el=lsSel();return el?lightTool.shadowVisibility?.[shadowItemKey(el)]!==false:false;},set:v=>lsSetShadowVisible(v),disabled:()=>!lsSel()}),
 lsEl('div',{class:'ls-sub'},'Kontaktna senka — tamni trag ispod predmeta'),
 lsSlider('Pomeri X',{...lsContactBind('x'),min:-180,max:180,step:1,domain:'shade'}),
 lsSlider('Pomeri Y',{...lsContactBind('y'),min:-320,max:160,step:1,domain:'shade'}),
 lsSlider('Širina',{...lsContactBind('width'),min:.1,max:1.6,step:.02,domain:'shade'}),
 lsSlider('Visina',{...lsContactBind('height'),min:.05,max:1.4,step:.01,domain:'shade'}),
 lsSlider('Providnost',{...lsContactBind('opacity'),min:0,max:1,step:.02,domain:'shade'}),
 lsSlider('Mekoća',{...lsContactBind('blur'),min:0,max:30,step:.5,domain:'shade'}),
 lsSlider('Ugao',{...lsContactBind('angle'),min:-180,max:180,step:1,domain:'shade'}),
 lsEl('div',{class:'ls-btns'},lsContactSame,lsBtn('Početno',()=>{const el=lsSel();if(!el)return;lsCheckpoint(true);delete lightTool.contactOverrides[shadowItemKey(el)];persistContactOverrides();persistLightTool(true);lsRefreshItem(el);lsSyncAll();lsRenderItemList();},{cls:'ls-ghost',title:'Vrati kontaktnu senku na početnu'})),
 lsEl('div',{class:'ls-sub'},'Senka od sunca'),
 lsSunStatus,
 lsSlider('Visina predmeta',{get:()=>{const el=lsSel();if(!el)return null;return lightTool.itemShadowProfiles?.[el.dataset.itemId]?.height??lsProf.height??lightTool.itemShadowHeight??120;},set:v=>{const el=lsSel();if(!el)return;const p=lightTool.itemShadowProfiles?.[el.dataset.itemId];lsProf.height=v;lightTool.itemShadowHeight=v;if(p){lsCheckpoint();p.height=v;lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).forEach(lsRefreshItem);}persistLightTool();},min:20,max:400,step:5,domain:'shade',disabled:()=>!lsSel(),hint:'Viši predmet baca dužu senku',def:120}),
 lsEl('div',{class:'ls-btns'},lsProfileEdit,lsProfileAuto,lsProfileSave,lsProfileCancel,lsProfileDelete,lsLegacyDelete)
);
lsPanes.senke.append(
 lsSection('pickitem','Predmet','shade',
  lsEl('div',{style:'display:grid;grid-template-columns:1fr auto;gap:6px;margin:2px 0 4px'},lsSearch,lsPickBtn),
  lsItemList,lsItemCard,lsItemInspector
 ),
 lsSection('shadowstyle','Izgled svih senki od sunca','shade',
  lsColor('Boja',lsBind('sunShapeColor')),
  lsSlider('Providnost',{...lsBind('sunShapeOpacity'),min:0,max:1,step:.02,domain:'shade'}),
  lsSlider('Mekoća',{...lsBind('sunShapeBlur'),min:0,max:40,step:.5,domain:'shade'}),
  lsSlider('Prelaz',{...lsBind('sunShapeGradient'),min:0,max:1,step:.02,domain:'shade',hint:'Koliko senka bledi ka kraju'}),
  lsSlider('Senka povrća',{...lsBind('produceShadowHeightScale'),min:.05,max:.28,step:.01,domain:'shade',hint:'Povrće baca kratku senku'}),
  lsNote('Ovo je deo izgleda dana — sa tačkama važi isto pravilo kao za boje.')
 )
);
lsControls.push(()=>{lsPickBtn.classList.toggle('is-on',lsState.mode==='pick');lsAddLightBtn.classList.toggle('is-on',lsState.mode==='light');lsSetBtnLabel(lsAddLightBtn,lsState.mode==='light'?'Povuci krug na sceni…':'Dodaj svetlo');lsProfileEdit.classList.toggle('is-on',lsState.mode==='profile');});

/* profile (obris) editing */
const lsProf={points:[],base:null,active:-1,height:null};
function lsItemGeom(el){return {cx:+el.dataset.cx||0,by:+el.dataset.by||0,w:Math.max(1,el.offsetWidth||1),h:Math.max(1,el.offsetHeight||1)};}
function lsOpenProfile(el){
 const g=lsItemGeom(el),p=lightTool.itemShadowProfiles?.[el.dataset.itemId];
 lsProf.points=p?.points?.length?p.points.map(([x,y])=>[g.cx+x*g.w,g.by+y*g.h]):[];
 lsProf.base=p?.base?{cx:g.cx+p.base.cx*g.w,cy:g.by+p.base.cy*g.h,rx:Math.max(3,p.base.rx*g.w),ry:Math.max(2,p.base.ry*g.h),angle:+p.base.angle||0}:{cx:g.cx,cy:g.by-g.h*.09,rx:g.w*.22,ry:g.h*.055,angle:0};
 lsProf.height=p?.height??lightTool.itemShadowHeight??120;lsProf.active=-1;lsProf.el=el;
}
function lsSaveProfile(){
 const el=lsSel();if(!el||lsState.mode!=='profile')return;
 if(lsProf.points.length<3){lsFlashHint('Obris mora imati bar 3 tačke.');return;}
 lsCheckpoint(true);
 const g=lsItemGeom(el),b=lsProf.base;
 lightTool.itemShadowProfiles=lightTool.itemShadowProfiles||{};
 lightTool.itemShadowProfiles[el.dataset.itemId]={points:lsProf.points.map(([x,y])=>[(x-g.cx)/g.w,(y-g.by)/g.h]),base:{cx:(b.cx-g.cx)/g.w,cy:(b.cy-g.by)/g.h,rx:b.rx/g.w,ry:b.ry/g.h,angle:+b.angle||0},height:Math.max(20,+lsProf.height||120)};
 persistLightTool(true);lsSetMode('');
 lsSceneItems().filter(x=>x.dataset.itemId===el.dataset.itemId).forEach(lsRefreshItem);
 lsRefreshLighting();lsRenderLists();lsSyncAll();lsFlashHint(`Obris sačuvan za „${lsItemLabel(el)}“.`);
}
function lsSimplify(pts,max){
 const p=pts.slice(),area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]));
 while(p.length>max){let mi=0,mv=Infinity;for(let i=0;i<p.length;i++){const v=area(p[(i-1+p.length)%p.length],p[i],p[(i+1)%p.length]);if(v<mv){mv=v;mi=i;}}p.splice(mi,1);}
 return p;
}
function lsTraceItem(el){
 const img=el.querySelector('img.body')||el.querySelector('img');
 if(!img||!img.naturalWidth)throw new Error('Slika predmeta još nije učitana.');
 const g=lsItemGeom(el),cw=120,ch=Math.max(12,Math.round(cw*g.h/g.w)),kx=cw/g.w,ky=ch/g.h;
 const c=document.createElement('canvas');c.width=cw;c.height=ch;const ctx=c.getContext('2d',{willReadFrequently:true});
 let bx=0,by=0,bw=g.w,bh=g.h;if(img.offsetParent===el||img.parentElement===el){bx=img.offsetLeft;by=img.offsetTop;bw=img.offsetWidth||g.w;bh=img.offsetHeight||g.h;}
 let dx=bx*kx,dy=by*ky,dw=bw*kx,dh=bh*ky;
 const fit=getComputedStyle(img).objectFit;
 if(fit==='contain'||fit==='scale-down'){const r=Math.min(dw/img.naturalWidth,dh/img.naturalHeight),nw=img.naturalWidth*r,nh=img.naturalHeight*r;dx+=(dw-nw)/2;dy+=(dh-nh)/2;dw=nw;dh=nh;}
 ctx.drawImage(img,dx,dy,dw,dh);
 let data;try{data=ctx.getImageData(0,0,cw,ch).data;}catch(_){throw new Error('Pregledač ne dozvoljava čitanje slike kad se igra otvara kao fajl. Pokreni je preko lokalnog servera ili nacrtaj obris ručno.');}
 const A=(x,y)=>data[(y*cw+x)*4+3]>40,pts=[];let maxY=-1;
 for(let x=0;x<cw;x++){let t=-1,b=-1;for(let y=0;y<ch;y++)if(A(x,y)){if(t<0)t=y;b=y;}if(t>=0){pts.push([x+.5,t],[x+.5,b+1]);if(b>maxY)maxY=b;}}
 if(pts.length<6)throw new Error('Slika predmeta je prazna.');
 const hull=lsSimplify(itemShadowHull(pts),16);
 const band=Math.max(2,Math.round(ch*.07));let minX=cw,maxX=-1;
 for(let y=Math.max(0,maxY-band);y<=maxY;y++)for(let x=0;x<cw;x++)if(A(x,y)){if(x<minX)minX=x;if(x>maxX)maxX=x;}
 const toScene=([x,y])=>[g.cx-g.w/2+x/kx,g.by-g.h+y/ky];
 const rx=Math.max(3,(maxX-minX+1)/kx/2*.92),ry=Math.max(2,Math.min(rx*.24,g.h*.08));
 return {points:hull.map(toScene),base:{cx:g.cx-g.w/2+((minX+maxX+1)/2)/kx,cy:g.by-g.h+(maxY+1)/ky-ry*.55,rx,ry,angle:0}};
}
function lsAutoProfile(){
 const el=lsSel();if(!el)return;
 try{const t=lsTraceItem(el);if(lsState.mode!=='profile')lsSetMode('profile');lsProf.points=t.points;lsProf.base=t.base;lsProf.active=-1;lsRenderOverlay();lsFlashHint('Obris je napravljen iz slike. Doteraj tačke pa sačuvaj (Enter).');}
 catch(err){lsFlashHint(err.message||'Auto obris nije uspeo.');}
}

/* ---------- tab: Čuvanje ---------- */
function lsSnaps(){try{const s=JSON.parse(localStorage.getItem(LS_SNAP_KEY)||'[]');return Array.isArray(s)?s:[];}catch(_){return[];}}
function lsWriteSnaps(list){try{localStorage.setItem(LS_SNAP_KEY,JSON.stringify(list));return true;}catch(_){lsFlashHint('Nema mesta za još jednu verziju. Obriši neku staru ili izvezi JSON.');return false;}}
function lsAddSnap(name,auto=false){const list=lsSnaps();list.unshift({id:Date.now().toString(36),name,auto,at:Date.now(),data:JSON.stringify(lightTool)});let trimmed=list.filter(s=>!s.auto).slice(0,12).concat(list.filter(s=>s.auto).slice(0,4)).sort((a,b)=>b.at-a.at);const ok=lsWriteSnaps(trimmed);lsRenderSnaps();return ok;}
const lsSnapName=lsEl('input',{type:'text',class:'ls-input',placeholder:'npr. Toplo jutro, pre izmena…','aria-label':'Naziv verzije'});
const lsSnapList=lsEl('div',{class:'ls-list',style:'max-height:260px'});
function lsRenderSnaps(){
 const list=lsSnaps();
 if(!list.length){lsSnapList.replaceChildren(lsEl('div',{class:'ls-empty'},'Još nema sačuvanih verzija. Sačuvaj jednu pre većih izmena — vraćanje je jedan klik.'));return;}
 lsSnapList.replaceChildren(...list.map(s=>lsEl('div',{class:'ls-snap'},
  lsEl('div',{},s.name,lsEl('small',{},(s.auto?'Automatski · ':'')+new Date(s.at).toLocaleString('sr-RS',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}))),
  lsConfirmBtn('Vrati','Zameni trenutno?',()=>{lsAddSnap('Pre vraćanja verzije',true);lsHist.undo.push(JSON.stringify(lightTool));lsRestore(s.data,{all:true});lsFlashHint(`Vraćena verzija „${s.name}“.`);},{cls:'',}),
  lsIconBtn('trash','Obriši verziju',()=>{lsWriteSnaps(lsSnaps().filter(x=>x.id!==s.id));lsRenderSnaps();})
 )));
 for(const b of lsSnapList.querySelectorAll('.ls-btn.ls-danger'))b.classList.remove('ls-danger');
}
const lsImportInput=lsEl('input',{type:'file',accept:'.json,application/json,text/plain',hidden:true});
lsImportInput.onchange=()=>{const file=lsImportInput.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(String(r.result||''));if(!data||typeof data!=='object'||Array.isArray(data)||!('morningColor' in data||'keyframes' in data||'radialLights' in data))throw new Error('x');lsAddSnap('Pre uvoza '+file.name,true);lsHist.undo.push(JSON.stringify(lightTool));lsEndEdit();lightingEditorPreviewOverride=false;lsRestore(JSON.stringify({...LIGHT_DEFAULTS,...data}),{all:true});lsFlashHint(`Učitano: ${file.name}`);}catch(_){lsFlashHint('Taj fajl nije podešavanje svetla iz Cookstera.');}};r.readAsText(file);};
lsPanes.cuvanje.append(
 lsSection('versions','Verzije','',
  lsNote('Sve izmene se već čuvaju automatski. Verzija je tvoja tačka za povratak.'),
  lsEl('div',{style:'display:grid;grid-template-columns:1fr auto;gap:6px;margin:6px 0'},lsSnapName,lsBtn('Sačuvaj',()=>{const name=lsSnapName.value.trim()||('Verzija '+new Date().toLocaleString('sr-RS',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}));if(lsAddSnap(name)){lsSnapName.value='';lsFlashHint(`Sačuvana verzija „${name}“.`);}},{cls:'ls-primary'})),
  lsSnapList
 ),
 lsSection('files','Fajl','',
  lsNote('Izvezi JSON za rezervnu kopiju ili da ga ubaciš u assets. Uvoz ne osvežava stranicu.'),
  lsEl('div',{class:'ls-btns'},
   lsBtn('Izvezi JSON',()=>{const blob=new Blob([JSON.stringify(lightTool,null,2)],{type:'application/json'}),a=document.createElement('a'),d=new Date();a.href=URL.createObjectURL(blob);a.download=`cookster-light-settings-${d.toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);lsFlashHint('JSON je izvezen.');}),
   lsBtn('Uvezi JSON',()=>{lsImportInput.value='';lsImportInput.click();}),lsImportInput)
 ),
 lsSection('danger','Brisanje','',
  lsNote('Pre brisanja se automatski pravi verzija, pa se sve može vratiti.'),
  lsEl('div',{class:'ls-btns'},
   lsConfirmBtn('Obriši sve tačke dana','Obriši sve tačke?',()=>{lsAddSnap('Pre brisanja tačaka',true);lsCheckpoint(true);lightTool.keyframes=[];lsState.frameSel=null;lsEndEdit();persistLightTool(true);lsRefreshLighting();lsRenderDay();lsFlashHint('Sve tačke su obrisane.');},{icon:'trash'}),
   lsConfirmBtn('Vrati sve na početno','Sigurno? Briše sve.',()=>{lsAddSnap('Pre vraćanja na početno',true);lsHist.undo.push(JSON.stringify(lightTool));lsEndEdit();lightingEditorPreviewOverride=false;lsRestore(JSON.stringify(LIGHT_DEFAULTS),{all:true});lsFlashHint('Sve je vraćeno na početno.');},{icon:'trash'}))
 )
);

function lsRenderLists(){
 if(!lsState.open)return;
 if(lsState.tab==='svetla')lsRenderLightList();
 if(lsState.tab==='senke'){lsRenderItemList();lsRenderItemCard();}
 if(lsState.tab==='cuvanje')lsRenderSnaps();
}

/* ---------- modes ---------- */
function lsSetMode(mode){
 const prev=lsState.mode;
 if(mode==='profile'){const el=lsSel();if(!el){lsFlashHint('Prvo izaberi predmet.');return;}lsOpenProfile(el);}
 if(prev==='brush'&&lsBrushStroke)lsBrushStroke=null;
 lsState.mode=mode;lsDrag=null;
 for(const m of ['pick','light','brush','profile'])document.body.classList.toggle('ls-mode-'+m,mode===m);
 lsSyncAll();lsRenderHint();lsRenderOverlay();
}

/* ---------- scene overlay (handles) ---------- */
const LS_SVG='http://www.w3.org/2000/svg';
const lsOverlay=lsEl('div',{class:'ls-ov','aria-hidden':'true'});
const lsSvg=document.createElementNS(LS_SVG,'svg');lsSvg.setAttribute('viewBox',`0 0 ${BASE_W} ${BASE_H}`);lsSvg.setAttribute('preserveAspectRatio','none');
lsOverlay.appendChild(lsSvg);scene.appendChild(lsOverlay);
let lsCursor=null;
function lsS(tag,attrs){const n=document.createElementNS(LS_SVG,tag);for(const [k,v] of Object.entries(attrs))if(v!=null)n.setAttribute(k,v);return n;}
function lsRenderOverlay(){
 const show=lsState.open&&lightPanel.style.display!=='none';
 lsOverlay.style.display=show?'block':'none';
 if(!show)return;
 const s=lsScale(),sw=1.5/s,r=7/s,frag=document.createDocumentFragment();
 const P=(xp,yp)=>[xp/100*BASE_W,yp/100*BASE_H];
 if(lsState.handles&&lsState.tab==='atmosfera'){
  const cfg=lightTool;
  const [ax,ay]=P(cfg.gradientX1,cfg.gradientY1),[bx,by]=P(cfg.gradientX2,cfg.gradientY2);
  frag.append(lsS('line',{x1:ax,y1:ay,x2:bx,y2:by,class:'ls-h-line','stroke-width':sw,'stroke-dasharray':`${6/s} ${5/s}`}));
  frag.append(lsS('circle',{cx:ax,cy:ay,r:r*.8,class:'ls-h-dot','stroke-width':sw}),lsS('circle',{cx:bx,cy:by,r:r*.55,class:'ls-h-dot','stroke-width':sw}));
  const lab=lsS('text',{x:ax+r*1.4,y:ay-r*.8,class:'ls-h-label','font-size':11/s,'stroke-width':3/s});lab.textContent='Pojas';frag.append(lab);
  const [sx,sy]=P(cfg.beamX,cfg.beamY),vx=lsClamp(sx,8/s,BASE_W-8/s),vy=lsClamp(sy,8/s,BASE_H-8/s);
  frag.append(lsS('circle',{cx:vx,cy:vy,r:r*1.25,class:'ls-h-sun','stroke-width':sw*1.3}));
  const sl=lsS('text',{x:vx+r*1.8,y:vy+r*.45,class:'ls-h-label','font-size':11/s,'stroke-width':3/s});sl.textContent=(sx!==vx||sy!==vy)?'Sunce (van kadra)':'Sunce';frag.append(sl);
 }
 if(lsState.tab==='svetla'){
  if(lsState.handles)lsLights().forEach((l,i)=>{
   const [x,y]=P(l.x,l.y),rad=Math.max(4,+l.radius||8),sel=i===selectedRadial;
   frag.append(lsS('circle',{cx:x,cy:y,r:rad,class:'ls-h-ring'+(sel?' is-sel':''),'stroke-width':sw,'stroke-dasharray':sel?null:`${5/s} ${5/s}`,opacity:l.hidden?.35:null}));
   const dot=lsS('circle',{cx:x,cy:y,r:r*(sel?.9:.6),class:'ls-h-dot','stroke-width':sw});if(sel)dot.style.fill='#f2b441';frag.append(dot);
   if(sel)frag.append(lsS('circle',{cx:x+rad,cy:y,r:r*.6,class:'ls-h-dot','stroke-width':sw}));
  });
  if(lsState.mode==='brush'&&lsCursor){frag.append(lsS('circle',{cx:lsCursor.x,cy:lsCursor.y,r:Math.max(2,lightTool.brushSize/2),class:'ls-h-brush'+(lightTool.brushMode==='shadow'?' is-shadow':''),'stroke-width':sw}),lsS('circle',{cx:lsCursor.x,cy:lsCursor.y,r:1.5/s,fill:'#fff'}));}
 }
 if(lsState.tab==='senke'){
  const el=lsSel();
  if(el&&lsState.mode!=='profile'){
   const x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0,w=el.offsetWidth,h=el.offsetHeight,pad=4/s;
   const box=lsS('rect',{x:x-pad,y:y-pad,width:w+pad*2,height:h+pad*2,rx:4/s,class:'ls-h-box','stroke-width':sw,'stroke-dasharray':`${6/s} ${4/s}`});
   if(lsItemFlash&&performance.now()-lsItemFlash<100)box.classList.add('is-flash');
   frag.append(box);
  }
  if(lsState.mode==='profile'){
   const pts=lsProf.points;
   if(pts.length)frag.append(lsS(pts.length>=3?'polygon':'polyline',{points:pts.map(p=>p.join(',')).join(' '),class:'ls-h-poly','stroke-width':sw}));
   const b=lsProf.base;
   if(b){
    const a=(+b.angle||0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),pt=(x,y)=>[b.cx+x*cs-y*sn,b.cy+x*sn+y*cs];
    frag.append(lsS('ellipse',{cx:b.cx,cy:b.cy,rx:Math.max(2,b.rx),ry:Math.max(2,b.ry),transform:`rotate(${b.angle||0} ${b.cx} ${b.cy})`,class:'ls-h-base','stroke-width':sw,'stroke-dasharray':`${4/s} ${3/s}`}));
    for(const [name,[x,y],fill] of [['center',[b.cx,b.cy],'#f2b441'],['width',pt(b.rx,0),'#fff'],['height',pt(0,-b.ry),'#fff'],['rotate',pt(0,-b.ry-14/s),'#9aa5ff']])frag.append(lsS('circle',{cx:x,cy:y,r:r*.6,fill,stroke:'#221e27','stroke-width':sw}));
   }
   pts.forEach(([x,y],i)=>frag.append(lsS('circle',{cx:x,cy:y,r:r*.55,class:'ls-h-pt'+(i===lsProf.active?' is-act':''),'stroke-width':sw})));
  }
 }
 lsSvg.replaceChildren(frag);
}

/* ---------- pointer routing (capture, before gameplay) ---------- */
let lsDrag=null,lsBrushStroke=null;
function lsActive(){return lsState.open&&lightPanel.style.display!=='none';}
function lsIgnoreTarget(t){if(!t||lightPanel.contains(t)||t.closest?.('#gameClock,[aria-label="Алати"],#hud,#modal,#modalShade,#quickToolWheel,.edge-arrow')||t===toolsToggleRef())return true;return !scene.contains(t)&&!!t.closest?.('button,input,select,textarea,a');}
function toolsToggleRef(){return document.querySelector('button[title="Отвори или затвори листу свих алата"]');}
function lsDist(p,x,y){return Math.hypot(p.x-x,p.y-y);}
function lsSegDist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;if(l2<1e-4)return Math.hypot(p.x-a[0],p.y-a[1]);const t=lsClamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/l2,0,1);return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t);}
function lsHit(p,e){
 const lsLightsNow=lsLights;
 const s=lsScale(),R=11/s,P=(xp,yp)=>[xp/100*BASE_W,yp/100*BASE_H];
 const mode=lsState.mode;
 if(mode==='pick'){const el=e.target?.closest?.('.item');return {down:()=>{if(el)lsSelectItem(el);}};}
 if(mode==='light'){
  return {down:()=>{lsLook('radialLights',()=>{const q=scenePercent(e.clientX,e.clientY);lsLights().push({x:q.x,y:q.y,radius:8,color:lightTool.radialColor||'#ffe0a0',opacity:lightTool.radialOpacity??.55,blur:lightTool.radialBlur??12,softness:lightTool.radialSoftness??82,flicker:0,name:`Svetlo ${lightTool.radialLights.length+1}`});selectedRadial=lightTool.radialLights.length-1;});},
   move:q=>{const l=lsSelLight();if(!l)return;const [x,y]=P(l.x,l.y);l.radius=Math.max(8,Math.hypot(q.x-x,q.y-y));lsSchedulePreview();},
   up:()=>{const l=lsSelLight();if(l&&l.radius<12)l.radius=80;persistLightTool();lsSetMode('');lsRenderLists();lsSyncAll();lsSchedulePreview();}};
 }
 if(mode==='brush'){
  return {down:q=>{lsLook('brushStrokes',()=>{lsBrushStroke={mode:lightTool.brushMode,color:lightTool.brushColor,size:lightTool.brushSize,opacity:lightTool.brushOpacity,strength:1,blur:lightTool.brushBlur,softness:lightTool.brushSoftness,points:[[q.x,q.y]]};lightTool.brushStrokes=Array.isArray(lightTool.brushStrokes)?lightTool.brushStrokes:[];lightTool.brushStrokes.push(lsBrushStroke);brushRenderDirty=true;});},
   move:q=>{if(!lsBrushStroke)return;const last=lsBrushStroke.points[lsBrushStroke.points.length-1];if(Math.hypot(q.x-last[0],q.y-last[1])>=Math.max(3,lsBrushStroke.size*.08)){lsBrushStroke.points.push([q.x,q.y]);brushRenderDirty=true;renderBrushStrokes(lightTool);}},
   up:()=>{lsBrushStroke=null;persistLightTool();lsSyncAll();}};
 }
 if(mode==='profile'){
  const b=lsProf.base;
  if(e.button===2){let idx=-1,bd=R;lsProf.points.forEach(([x,y],i)=>{const d=lsDist(p,x,y);if(d<bd){bd=d;idx=i;}});return {down:()=>{if(idx>=0){lsProf.points.splice(idx,1);lsProf.active=-1;lsRenderOverlay();}}};}
  if(b){
   const a=(+b.angle||0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),pt=(x,y)=>[b.cx+x*cs-y*sn,b.cy+x*sn+y*cs];
   const handles=[['center',b.cx,b.cy],['width',...pt(b.rx,0)],['height',...pt(0,-b.ry)],['rotate',...pt(0,-b.ry-14/s)]];
   for(const [name,x,y] of handles)if(lsDist(p,x,y)<R){
    return {move:q=>{const dx=q.x-b.cx,dy=q.y-b.cy,lx=dx*Math.cos(a)+dy*Math.sin(a),ly=-dx*Math.sin(a)+dy*Math.cos(a);if(name==='center'){b.cx=q.x;b.cy=q.y;}else if(name==='width')b.rx=Math.max(3,Math.abs(lx));else if(name==='height')b.ry=Math.max(2,Math.abs(ly));else b.angle=Math.atan2(dy,dx)*180/Math.PI+90;lsRenderOverlay();}};
   }
  }
  let idx=-1,bd=R;lsProf.points.forEach(([x,y],i)=>{const d=lsDist(p,x,y);if(d<bd){bd=d;idx=i;}});
  if(idx<0){
   const pts=lsProf.points;let ed=-1,edd=6/s;
   if(pts.length>=3)for(let i=0;i<pts.length;i++){const d=lsSegDist(p,pts[i],pts[(i+1)%pts.length]);if(d<edd){edd=d;ed=i;}}
   if(ed>=0){pts.splice(ed+1,0,[p.x,p.y]);idx=ed+1;}else{pts.push([p.x,p.y]);idx=pts.length-1;}
  }
  lsProf.active=idx;
  return {down:()=>lsRenderOverlay(),move:q=>{lsProf.points[idx]=[q.x,q.y];lsRenderOverlay();}};
 }
 if(!lsState.handles)return null;
 if(lsState.tab==='atmosfera'){
  const cfg=lightTool,[sx,sy]=P(cfg.beamX,cfg.beamY),vx=lsClamp(sx,8/s,BASE_W-8/s),vy=lsClamp(sy,8/s,BASE_H-8/s);
  if(lsDist(p,vx,vy)<R*1.4)return {move:(q,ev)=>{const k=scenePercent(ev.clientX,ev.clientY);lsLook('beamX',()=>{lightTool.beamX=+k.x.toFixed(2);lightTool.beamY=+k.y.toFixed(2);});lsState.dirtyKeys.add('beamY');lsSyncAll();}};
  for(const [kx,ky] of [['gradientX1','gradientY1'],['gradientX2','gradientY2']]){const [x,y]=P(cfg[kx],cfg[ky]);if(lsDist(p,x,y)<R)return {move:(q,ev)=>{const k=scenePercent(ev.clientX,ev.clientY);lsLook(kx,()=>{lightTool[kx]=+k.x.toFixed(2);lightTool[ky]=+k.y.toFixed(2);});lsState.dirtyKeys.add(ky);}};}
 }
 if(lsState.tab==='svetla'){
  const lights=lsLights(),sel=lsSelLight();
  if(sel){const [x,y]=P(sel.x,sel.y),rad=Math.max(4,+sel.radius||8),si=selectedRadial;if(lsDist(p,x+rad,y)<R)return {move:q=>lsLook('radialLights',()=>{const t=lsLights()[si];if(t)t.radius=Math.max(8,Math.round(Math.hypot(q.x-x,q.y-y)));})};}
  let best=-1,bd=Infinity;lights.forEach((l,i)=>{const [x,y]=P(l.x,l.y),d=lsDist(p,x,y);if(d<Math.max(R*1.3,Math.min(40/s,(+l.radius||8)*.35))&&d<bd){bd=d;best=i;}});
  if(best>=0){const l=lights[best],[x0,y0]=P(l.x,l.y),off=[p.x-x0,p.y-y0];return {down:()=>lsSelectLight(best),move:q=>lsLook('radialLights',()=>{const t=lsLights()[best];if(t){t.x=+((q.x-off[0])/BASE_W*100).toFixed(2);t.y=+((q.y-off[1])/BASE_H*100).toFixed(2);}})};}
 }
 return null;
}
window.addEventListener('pointerdown',e=>{
 if(!lsActive()||lsIgnoreTarget(e.target))return;
 const p=screenToScene(e.clientX,e.clientY),hit=lsHit(p,e);
 if(!hit)return;
 e.preventDefault();e.stopImmediatePropagation();
 lsDrag={...hit,id:e.pointerId};hit.down?.(p,e);lsRenderOverlay();
},{capture:true});
window.addEventListener('pointermove',e=>{
 if(!lsActive())return;
 if(lsState.mode==='brush'){const p=screenToScene(e.clientX,e.clientY);lsCursor=p;if(!lsDrag)lsRenderOverlay();}
 if(!lsDrag||e.pointerId!==lsDrag.id)return;
 e.preventDefault();e.stopImmediatePropagation();
 lsDrag.move?.(screenToScene(e.clientX,e.clientY),e);lsRenderOverlay();
},{capture:true});
const lsEndPointer=e=>{if(!lsDrag||(e.pointerId!=null&&e.pointerId!==lsDrag.id))return;e.preventDefault?.();e.stopImmediatePropagation?.();const d=lsDrag;lsDrag=null;d.up?.();lsAfterGesture();persistLightTool();lsRenderOverlay();};
window.addEventListener('pointerup',lsEndPointer,{capture:true});
window.addEventListener('pointercancel',lsEndPointer,{capture:true});
window.addEventListener('contextmenu',e=>{if(lsActive()&&lsState.mode==='profile'&&!lightPanel.contains(e.target))e.preventDefault();},{capture:true});
window.addEventListener('keydown',e=>{
 if(!lsActive())return;
 const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')&&!['range','color'].includes(e.target.type);
 const stop=()=>{e.preventDefault();e.stopImmediatePropagation();};
 if(e.key==='Escape'){if(lsState.mode){stop();lsSetMode('');}else if(lsState.frameSel){stop();lsState.frameSel=null;lsRenderDay();}return;}
 if(typing)return;
 const mod=e.ctrlKey||e.metaKey;
 if(mod&&(e.key==='z'||e.key==='Z')){stop();if(e.shiftKey)lsRedo();else lsUndo();return;}
 if(mod&&(e.key==='y'||e.key==='Y')){stop();lsRedo();return;}
 if(lsState.mode==='profile'){
  if(e.key==='Enter'){stop();lsSaveProfile();return;}
  if((e.key==='Backspace'||e.key==='Delete')&&lsProf.points.length){stop();const i=lsProf.active>=0?lsProf.active:lsProf.points.length-1;lsProf.points.splice(i,1);lsProf.active=Math.min(i,lsProf.points.length-1);lsRenderOverlay();return;}
 }
 if(lsState.mode==='brush'&&(e.key==='['||e.key===']')){stop();lightTool.brushSize=lsClamp(lightTool.brushSize+(e.key===']'?15:-15),10,500);persistLightTool();lsSyncAll();lsRenderOverlay();return;}
 if(!lsState.mode&&lsState.tab==='svetla'&&(e.key==='Delete'||e.key==='Backspace')&&lsSelLight()){stop();lsDeleteLight(selectedRadial);}
},{capture:true});
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','wheel','keydown'])lightPanel.addEventListener(type,e=>e.stopPropagation());
lightPanel.style.display='none';

/* ---------- radial light animation (flicker + fire link) ---------- */
let lsLightAnim=0,lsFireMix=null;
function lsFireOn(){try{return !!stoveState.fireOn&&(+stoveState.fireLevel||0)>0;}catch(_){return false;}}
function lsAnimateLights(){return;}
function lsKickLightAnim(){return;}

/* ---------- lifecycle ---------- */
function lsOnOpen(){
 lsApplyShell();lsSetTab(lsState.tab);lsUpdateHist();lsStripDirty=true;lsRenderDay();lsRenderSaved();
 for(const [k,v] of Object.entries(lsState.hidden))document.body.classList.toggle('ls-hide-'+k,!!v);
 lsRefreshLighting();lsRenderOverlay();
}
function lsOnClose(){
 lsSetMode('');lsDrag=null;document.body.classList.remove('ls-peek');
 for(const k of Object.keys(lsState.hidden))document.body.classList.remove('ls-hide-'+k);
 lsRenderOverlay();lsRefreshLighting();
 if(selectedShadowItem)lsRefreshItem(selectedShadowItem);
}
/* ========================= end light studio ========================= */
function hexRgb(hex){const n=parseInt(String(hex).replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbHex(rgb){return'#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function renderRadialLights(cfg){
 const lights=Array.isArray(cfg.radialLights)?cfg.radialLights:[];
 while(radialLightLayer.children.length<lights.length)radialLightLayer.appendChild(document.createElement('div'));
 while(radialLightLayer.children.length>lights.length)radialLightLayer.lastChild.remove();
 let animated=false;const fireMix=lsFireMix==null?(lsFireOn()?1:0):lsFireMix;
 lights.forEach((l,i)=>{
  const node=radialLightLayer.children[i],r=Math.max(4,+l.radius||8),soft=Math.max(30,Math.min(100,+l.softness||82)),base=l.hidden?0:Math.max(0,Math.min(1,+l.opacity||0)),flicker=l.hidden?0:Math.max(0,Math.min(1,+l.flicker||0)),fire=!l.hidden&&!!l.fireLinked;
  node._lsBase=base;node._lsFlicker=flicker;node._lsFire=fire;if(flicker||fire)animated=true;
  Object.assign(node.style,{position:'absolute',left:(+l.x||0)+'%',top:(+l.y||0)+'%',width:(r*2)+'px',height:(r*2)+'px',borderRadius:'50%',background:`radial-gradient(circle,${l.color||'#ffe0a0'} 0%,${l.color||'#ffe0a0'} 14%,transparent ${soft}%)`,filter:`blur(${Math.max(0,+l.blur||0)}px)`});
  if(!flicker&&!fire){node.style.opacity=String(base);node.style.transform='translate(-50%,-50%)';}
  else if(!node.style.transform)node.style.transform='translate(-50%,-50%)';
  if(fire&&!flicker&&!lsLightAnim)node.style.opacity=String(base*fireMix);
 });
 if(animated)lsKickLightAnim();
}
function sunShadowDirection(cx,by,cfg){const sx=(Number.isFinite(+cfg?.beamX)?+cfg.beamX:7)/100*BASE_W,sy=(Number.isFinite(+cfg?.beamY)?+cfg.beamY:4)/100*BASE_H,targetX=BASE_W*.5,targetY=BASE_H*.56;return Math.atan2(targetY-sy,targetX-sx);}
function roomShadowGeometry(){
 if(window.__COOKSTER_SCENE_VOLUMES__)return window.__COOKSTER_SCENE_VOLUMES__;
 if(roomShadowGeometryCache)return roomShadowGeometryCache;
 try{roomShadowGeometryCache=JSON.parse(localStorage.getItem('cookster.scene-volumes.v3')||'null');}catch(_){roomShadowGeometryCache=null;}
 if(!roomShadowGeometryCache)try{const request=new XMLHttpRequest();request.open('GET','assets/scene-calibration.json',false);request.send(null);if(request.status>=200&&request.status<300)roomShadowGeometryCache=JSON.parse(request.responseText);}catch(_){roomShadowGeometryCache=null;}
 return roomShadowGeometryCache||{};
}
function lowestPolygonEdge(points){
 let best=null,bestY=-Infinity;for(let i=0;i<points.length;i++){const j=(i+1)%points.length,a=points[i],b=points[j],averageY=(a[1]+b[1])/2;if(averageY>bestY){bestY=averageY;best=[a,b];}}return best;
}

function itemShadowHull(points){const pts=points.map(p=>[+p[0],+p[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(pts.length<3)return pts;const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lower=[],upper=[];for(const p of pts){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}lower.pop();upper.pop();return lower.concat(upper);}

function inferSunShadowAnchorIndices(points){
 const pts=Array.isArray(points)?points:[];if(pts.length<2)return pts.map((_,i)=>i);
 const boundaryDistance=([x,y])=>{const inside=x>=-.5&&x<=.5&&y>=-1&&y<=0,ox=Math.max(-.5-x,0,x-.5),oy=Math.max(-1-y,0,y);return inside?Math.min(x+.5,.5-x,y+1,-y):Math.hypot(ox,oy);};
 let best=[0,1],bestScore=Infinity;
 for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length,a=pts[i],b=pts[j],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],score=boundaryDistance(mid)*2+boundaryDistance(a)+boundaryDistance(b);if(score<bestScore){bestScore=score;best=[i,j];}}
 return best;
}

function renderBrushStrokes(cfg){const strokes=Array.isArray(cfg.brushStrokes)?cfg.brushStrokes:[];if(!brushRenderDirty&&brushRenderSource===strokes)return;brushRenderDirty=false;brushRenderSource=strokes;const lightCtx=lightBrushCanvas.getContext('2d'),darkCtx=darkBrushCanvas.getContext('2d');lightCtx.clearRect(0,0,BASE_W,BASE_H);darkCtx.clearRect(0,0,BASE_W,BASE_H);for(const stroke of strokes){const ctx=stroke.mode==='shadow'?darkCtx:lightCtx,r=Math.max(2,(+stroke.size||20)/2),soft=Math.max(.05,Math.min(.98,(+stroke.softness||70)/100)),rgb=hexRgb(stroke.color||'#ffffff'),alpha=Math.max(0,Math.min(1,(+stroke.opacity||0)*(+stroke.strength||1)));ctx.save();ctx.filter=`blur(${Math.max(0,+stroke.blur||0)}px)`;for(const [x,y] of stroke.points||[]){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);g.addColorStop(soft,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha*.38})`);g.addColorStop(1,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);ctx.fillStyle=g;ctx.fillRect(x-r*1.4,y-r*1.4,r*2.8,r*2.8);}ctx.restore();}}
function resolvedLightSettings(minute){
 const frames=Array.isArray(lightTool.keyframes)?lightTool.keyframes:[];
 if(frames.length<2)return lightTool;
 const sorted=frames.slice().sort((a,b)=>a.minute-b.minute);
 let before=sorted[sorted.length-1],after=sorted[0],m=minute;
 if(m<sorted[0].minute)m+=1440;
 for(let i=0;i<sorted.length;i++){
   const a=sorted[i],b=sorted[(i+1)%sorted.length],bm=b.minute+(i===sorted.length-1?1440:0);
   if(m>=a.minute&&m<=bm){before=a;after={...b,minute:bm};break;}
 }
 const span=Math.max(1,after.minute-before.minute),t=(m-before.minute)/span,out={...lightTool};
 const interpolateRadials=(a,b,mix)=>{const aa=Array.isArray(a)?a:[],bb=Array.isArray(b)?b:[],count=Math.max(aa.length,bb.length),result=[];for(let i=0;i<count;i++){const av=aa[i]||{...bb[i],opacity:0},bv=bb[i]||{...aa[i],opacity:0};if(!av&&!bv)continue;const light={};for(const key of new Set([...Object.keys(av||{}),...Object.keys(bv||{})])){const x=av?.[key],y=bv?.[key];if(typeof x==='number'&&typeof y==='number')light[key]=x+(y-x)*mix;else if(typeof x==='string'&&x.startsWith('#')&&typeof y==='string'&&y.startsWith('#')){const ca=hexRgb(x),cb=hexRgb(y);light[key]=rgbHex(ca.map((v,j)=>v+(cb[j]-v)*mix));}else light[key]=mix<.5?x:y;}result.push(light);}return result;};
 for(const key of Object.keys(before.settings)){
   const av=before.settings[key],bv=after.settings[key];
   if(typeof av==='number'&&typeof bv==='number')out[key]=av+(bv-av)*t;
   else if(typeof av==='string'&&av.startsWith('#')&&typeof bv==='string'){
     const ca=hexRgb(av),cb=hexRgb(bv);out[key]=rgbHex(ca.map((v,i)=>v+(cb[i]-v)*t));
   }else if(key==='radialLights')out[key]=interpolateRadials(av,bv,t);
   else out[key]=t<.5?av:bv;
 }
 // Item-authored shadows are global scene data, not lighting keyframe data.
 // Keeping them live prevents an older morning/noon/night snapshot from
 // replacing a shadow that the player has just drawn or edited.
 out.contactOverrides=lightTool.contactOverrides;
 out.sunShadowShapes=lightTool.sunShadowShapes;
 out.itemShadowProfiles=lightTool.itemShadowProfiles;
 return out;
}
function phaseMix(hour,keySuffix,cfg=lightTool){const points=[[0,'night'],[7,'morning'],[12,'noon'],[19,'evening'],[24,'night']];let a=points[0],b=points[1];for(let i=0;i<points.length-1;i++)if(hour>=points[i][0]&&hour<=points[i+1][0]){a=points[i];b=points[i+1];break;}const t=(hour-a[0])/(b[0]-a[0]);if(keySuffix==='Color'){const ca=hexRgb(cfg[a[1].concat(keySuffix)]),cb=hexRgb(cfg[b[1].concat(keySuffix)]);return ca.map((v,i)=>Math.round(v+(cb[i]-v)*t));}const va=cfg[a[1].concat(keySuffix)],vb=cfg[b[1].concat(keySuffix)];return va+(vb-va)*t;}
function clamp01(v){return Math.max(0,Math.min(1,v));}
function bell(hour,start,peak,end){return hour<=start||hour>=end?0:hour<peak?(hour-start)/(peak-start):(end-hour)/(end-peak);}
function applyGameTimeLighting(){return null;}

// One real minute equals one in-game hour. The clock is independent from the
// future lighting renderer, so sun colour and direction can be added safely in
// the next step without changing the time progression.
// Cloud time-of-day runtime removed. Scene lighting is static.
const GAME_CLOCK_KEY='cookster.game-clock.v1';
gameClockPaused=true;
function currentGameMinute(){return 720;}
function gameDayPart(){return 'Podne';}
function updateGameClock(){return;}
try{localStorage.removeItem(GAME_CLOCK_KEY);}catch(_){}


/* Legacy Cloud time/light system permanently disabled. */
const LEGACY_CLOUD_LIGHT_IDS=[
 'cooksterDayTint','cooksterRoomGlow','cooksterSunBeam','cooksterDirectionalGradient',
 'cooksterRadialLights','cooksterLightBrush','cooksterDarkBrush',
 'cooksterMorningParticles','cooksterLensFlare','gameClock'
];
function purgeLegacyCloudLighting(){
 for(const id of LEGACY_CLOUD_LIGHT_IDS){
   const n=document.getElementById(id);
   if(n)n.remove();
 }
 const p=document.querySelector('.ls[aria-label="Svetlo i senke"]');
 if(p)p.remove();
}
const legacyCloudLightingGuard=document.createElement('style');
legacyCloudLightingGuard.id='cookster-remove-legacy-cloud-lighting';
legacyCloudLightingGuard.textContent=`
#cooksterDayTint,#cooksterRoomGlow,#cooksterSunBeam,#cooksterDirectionalGradient,
#cooksterRadialLights,#cooksterLightBrush,#cooksterDarkBrush,#cooksterMorningParticles,
#cooksterLensFlare,#gameClock,.ls[aria-label="Svetlo i senke"]{
 display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;
}`;
document.head.appendChild(legacyCloudLightingGuard);
try{
 localStorage.removeItem('cookster.light-tool.v1');
 localStorage.removeItem('cookster.game-clock.v1');
 localStorage.removeItem('cookster.light-studio.ui.v1');
 localStorage.removeItem('cookster.light-studio.snapshots.v1');
}catch(_){}
purgeLegacyCloudLighting();
new MutationObserver(purgeLegacyCloudLighting).observe(document.documentElement,{childList:true,subtree:true});

const SCENE_BACKGROUNDS={
 fireOnClosed:'assets/stove_states/fire_on_closed.png',
 fireboxOpenOff:'assets/stove_states/firebox_open_off.png',
 fireboxOpenFire:'assets/stove_states/firebox_open_fire.png',
 ovenOpen:'assets/stove_states/oven_open.png',
 fireOffClosed:'assets/stove_states/fire_off_closed.png'
};
const DOOR_OVERLAYS={open:'assets/stove_states/firebox_door_open.png',close:'assets/stove_states/firebox_door_closed.png'};
const FIREBOX_BASE_NO_DOOR='assets/stove_states/firebox_base_no_door.png';
// Decode door layers before the first click so the old frame never lingers
// while the browser fetches the PNG.
Object.values({...SCENE_BACKGROUNDS,...DOOR_OVERLAYS}).forEach(src=>{const im=new Image();im.src=src;});
const COOKSTOVE_HOTSPOTS={
 firebox:{left:1258,right:1410,top:428,bottom:618},
 oven:{left:1394,right:1579,top:450,bottom:630}
};
const WOOD_BASKET_ID='korpa_drva';
const WOOD_BASKET_MAX_LOGS=9;
const WOOD_BASKET_ASSETS=[
 {name:'full',src:'assets/wood_basket/basket-full.png?v=2.86'},
 {name:'medium',src:'assets/wood_basket/basket-medium.png?v=2.86'},
 {name:'low',src:'assets/wood_basket/basket-low.png?v=2.86'},
 {name:'empty',src:'assets/wood_basket/basket-empty.png?v=2.86'}
];
const stoveState=CooksterState.stove;
// One fuel item should provide a meaningful cooking session instead of
// burning out during a single short interaction.
const FIRE_MAX_LEVEL=3, FIRE_BURN_MS=90000;
const FIRE_AUDIO_SRC='assets/sfx/fire_crackling.mp3';
const FIREBOX_FIRE_GIF_SRC='assets/effects/firebox_fire.gif';
const FIREBOX_FIRE_STATIC_SRC='assets/effects/firebox_fire_static.png';
const FIRE_AUDIO_MAX_VOLUME=.42;
const FIRE_AUDIO_FADE_MS=5000;
let fireAudio=null;
function ensureFireAudio(){
 if(fireAudio)return fireAudio;
 fireAudio=new Audio(FIRE_AUDIO_SRC);
 fireAudio.preload='auto';
 fireAudio.loop=true;
 fireAudio.volume=FIRE_AUDIO_MAX_VOLUME;
 return fireAudio;
}
function restartFireAudio(){
 const a=ensureFireAudio();
 try{a.pause();a.currentTime=0;a.volume=FIRE_AUDIO_MAX_VOLUME;a.play().catch(()=>{});}catch(_){}
}
function stopFireAudio(){
 if(!fireAudio)return;
 try{fireAudio.pause();fireAudio.currentTime=0;fireAudio.volume=0;}catch(_){}
}
function syncFireAudio(totalRemainingMs){
 if(!stoveState.fireOn||(+stoveState.fireLevel||0)<=0||totalRemainingMs<=0){stopFireAudio();return;}
 if(!fireAudio)return;
 const fade=totalRemainingMs<=FIRE_AUDIO_FADE_MS?totalRemainingMs/FIRE_AUDIO_FADE_MS:1;
 fireAudio.volume=Math.max(0,Math.min(FIRE_AUDIO_MAX_VOLUME,FIRE_AUDIO_MAX_VOLUME*fade));
}
function pointInSceneRect(pt,r){return pt.x>=r.left&&pt.x<=r.right&&pt.y>=r.top&&pt.y<=r.bottom}
function cookstoveHotspotAt(x,y){
 const p=screenToScene(x,y);
 if(pointInSceneRect(p,COOKSTOVE_HOTSPOTS.firebox))return 'firebox';
 if(pointInSceneRect(p,COOKSTOVE_HOTSPOTS.oven))return 'oven';
 return null;
}
let sceneBackgroundSrc='';
let sceneTransitionToken=0;
let fireboxDoorLayerState=null;
const FIREBOX_HINGE_ORIGIN={x:1387,y:497};
function ensureSceneTransitionLayer(){
 let layer=document.getElementById('sceneStateTransition');
 if(layer)return layer;
 layer=document.createElement('div');
 layer.id='sceneStateTransition';
 layer.setAttribute('aria-hidden','true');
 layer.style.cssText='position:absolute;inset:0;background-repeat:no-repeat;background-position:center;background-size:cover;pointer-events:none;z-index:1200;display:none;opacity:0;';
 scene.prepend(layer);
 return layer;
}
function ensureFireboxDoorLayer(){
 let layer=document.getElementById('fireboxDoorPersistent');
 if(layer)return layer;
 layer=document.createElement('div');
 layer.id='fireboxDoorPersistent';
 layer.setAttribute('aria-hidden','true');
 layer.style.cssText=`position:absolute;inset:0;background-repeat:no-repeat;background-position:center;background-size:cover;pointer-events:none;z-index:1201;display:none;opacity:1;transform:none;transform-origin:${FIREBOX_HINGE_ORIGIN.x}px ${FIREBOX_HINGE_ORIGIN.y}px;`;
 scene.prepend(layer);
 return layer;
}
function syncFireboxDoorLayer(open,visible=true){
 const layer=ensureFireboxDoorLayer();
 fireboxDoorLayerState=!!open;
 layer.style.backgroundImage=`url("${new URL(DOOR_OVERLAYS[open?'open':'close'],document.baseURI).href}")`;
 layer.style.display=visible?'block':'none';
 layer.style.opacity=visible?'1':'0';
 layer.style.transform='none';
 layer.style.transformOrigin=`${FIREBOX_HINGE_ORIGIN.x}px ${FIREBOX_HINGE_ORIGIN.y}px`;
}
function applySceneBackground(src,transition='none'){
 const resolved=new URL(src,document.baseURI).href;
 const previous=sceneBackgroundSrc||getComputedStyle(scene).backgroundImage;
 sceneBackgroundSrc=resolved;

 // Initial load/save restore is immediate. Interactive stove changes use tweening.
 if(transition==='none'||!previous||previous==='none'){
   document.documentElement.style.setProperty('--scene-bg',`url("${resolved}")`);
   scene.style.backgroundImage=`url("${resolved}")`;
   const layer=document.getElementById('sceneStateTransition');
   if(layer){layer.style.display='none';layer.getAnimations?.().forEach(a=>a.cancel());}
   return;
 }

 const token=++sceneTransitionToken;
 const layer=ensureSceneTransitionLayer();
 layer.getAnimations?.().forEach(a=>a.cancel());
 layer.style.display='block';
 layer.style.backgroundImage=`url("${resolved}")`;
 layer.style.opacity='0';
 layer.style.transform='none';
 layer.style.clipPath='none';
 layer.style.transformOrigin='50% 50%';

 // The permanent background is switched underneath; the overlay then reveals it.
 document.documentElement.style.setProperty('--scene-bg',`url("${resolved}")`);
 scene.style.backgroundImage=`url("${resolved}")`;

 const finish=()=>{
   if(token!==sceneTransitionToken)return;
   layer.style.display='none';
   layer.style.opacity='0';
   layer.style.transform='none';
   layer.style.clipPath='none';
 };

 // 0.35 s sits between the requested 0.3 and 0.4 s.
 const duration=350;
 let frames=[
   {opacity:0},
   {opacity:.55,offset:.48},
   {opacity:1}
 ];

 // Door transitions get a subtle hinge-like tween in addition to the fade.
 // It is intentionally small: the final artwork remains pixel-aligned.
 if(transition==='fireboxOpen'||transition==='fireboxClose'
   ||transition==='ovenOpen'||transition==='ovenClose'){
   // v168.2: doors do not move/scale. Only the short state-image fade remains.
   layer.style.clipPath='none';
   layer.style.transformOrigin='50% 50%';
   frames=[
     {opacity:0},
     {opacity:.55,offset:.48},
     {opacity:1}
   ];
 }else if(transition==='ignite'){
   // Fire appears progressively instead of popping on.
   layer.style.clipPath='inset(44% 18.5% 39% 75.5%)';
   frames=[
     {opacity:0,filter:'brightness(.55) saturate(.65)'},
     {opacity:.28,filter:'brightness(.85) saturate(.85)',offset:.30},
     {opacity:.68,filter:'brightness(1.12) saturate(1.08)',offset:.72},
     {opacity:1,filter:'brightness(1) saturate(1)'}
   ];
 }

 if(layer.animate){
   const anim=layer.animate(frames,{duration,easing:'cubic-bezier(.22,.72,.22,1)',fill:'forwards'});
   anim.onfinish=finish;
   anim.oncancel=()=>{};
 }else{
   layer.style.transition=`opacity ${duration}ms ease`;
   requestAnimationFrame(()=>layer.style.opacity='1');
   setTimeout(finish,duration+20);
 }
}
function applyFireboxDoorTransition(opening){
 const layer=ensureFireboxDoorLayer();
 layer.getAnimations?.().forEach(a=>a.cancel());
 scene.style.backgroundImage=`url("${new URL(FIREBOX_BASE_NO_DOOR,document.baseURI).href}")`;
 layer.style.backgroundImage=`url("${new URL(DOOR_OVERLAYS[opening?'open':'close'],document.baseURI).href}")`;
 layer.style.display='block';layer.style.opacity='1';layer.style.transform='none';
 layer.style.transformOrigin=`${FIREBOX_HINGE_ORIGIN.x}px ${FIREBOX_HINGE_ORIGIN.y}px`;
 fireboxDoorLayerState=!!opening;
 // Keep the hinge side fixed. Only the opposite side stretches and settles.
 layer.animate?.([
   {transform:'scaleX(1) scaleY(1)'},
   {transform:'scaleX(1.09) scaleY(1.018)',offset:.18},
   {transform:'scaleX(.988) scaleY(.996)',offset:.62},
   {transform:'scaleX(1.014) scaleY(1.004)',offset:.80},
   {transform:'scaleX(1) scaleY(1)'}
 ],{duration:1000,easing:'cubic-bezier(.22,.78,.25,1)',fill:'none'});
 refreshCookstoveHeating(false);updateFireboxEffects();
}
function clearFireBurnTimer(){
 if(stoveState.burnTimer){clearTimeout(stoveState.burnTimer);stoveState.burnTimer=0;}
}
function updateFireTimerBar(){
 const on=!!stoveState.fireOn&&(+stoveState.fireLevel||0)>0;
 if(!on){
   syncFireAudio(0);
   if(fireTimerBar){fireTimerBar.classList.remove('visible');const fill=fireTimerBar.querySelector('i');if(fill)fill.style.width='0%';}
   return;
 }
 const now=Date.now();
 const segmentRemaining=Math.max(0,(+stoveState.burnEndsAt||now)-now);
 const level=Math.max(1,Math.min(FIRE_MAX_LEVEL,+stoveState.fireLevel||1));
 const totalRemaining=segmentRemaining+(level-1)*FIRE_BURN_MS;
 syncFireAudio(totalRemaining);
 if(!fireTimerBar)return;
 fireTimerBar.classList.add('visible');
 const pct=Math.max(0,Math.min(1,totalRemaining/(FIRE_MAX_LEVEL*FIRE_BURN_MS)));
 const fill=fireTimerBar.querySelector('i');if(fill)fill.style.width=`${pct*100}%`;
}
function scheduleFireBurn(resetSegment=true){
 clearFireBurnTimer();
 if(!stoveState.fireOn||stoveState.fireLevel<=0){
   stoveState.burnEndsAt=0;
   updateFireTimerBar();
   return;
 }
 const now=Date.now();
 if(resetSegment||!stoveState.burnEndsAt||stoveState.burnEndsAt<=now){
   stoveState.burnEndsAt=now+FIRE_BURN_MS;
 }
 const delay=Math.max(1,stoveState.burnEndsAt-now);
 stoveState.burnTimer=setTimeout(()=>{
   stoveState.fireLevel=Math.max(0,stoveState.fireLevel-1);
   if(stoveState.fireLevel<=0){
     stoveState.fireOn=false;
     stoveState.fireLevel=0;
     stoveState.burnEndsAt=0;
     stopFireAudio();
     applyCookstoveState();
     refreshCookstoveHeating(true);
     updateFireTimerBar();
     showToast('Vatra se ugasila — dodaj novo drvo.');
     return;
   }
   stoveState.burnEndsAt=Date.now()+FIRE_BURN_MS;
   applyCookstoveState();
   scheduleFireBurn(false);
   showToast(stoveState.fireLevel===1?'Vatra slabi.':'Vatra polako sagoreva.');
 },delay);
 updateFireTimerBar();
}
function refreshCookstoveHeating(announce=false){
 let warmed=0,cooled=0,active=0;
 for(const vessel of items){
   if(!isHeatableCookwareItem(vessel))continue;
   const wasHeating=vessel.dataset.onStove==='1';
   const physically=vesselIsPhysicallyOnStove(vessel);
   if(!physically){
     if(wasHeating){cooled++;syncCookwareHeatFlags(vessel);updateCookingStatus(vessel);}
     continue;
   }
   const heating=syncCookwareHeatFlags(vessel);
   if(heating)active++;
   if(heating&&!wasHeating)warmed++;
   if(!heating&&wasHeating)cooled++;
   updateCookingStatus(vessel);
 }
 if(announce){
   if(stoveState.fireOn&&warmed)showToast(`Vatra gori — zagreva se ${active} ${active===1?'posuda':'posude'}.`);
   else if(!stoveState.fireOn&&cooled)showToast('Vatra je ugašena — sve posude su prestale da se zagrevaju.');
 }
}
function ensureFireboxEffects(){
  let staticFire=document.getElementById('fireboxStaticFire');
  if(!staticFire){
    staticFire=document.createElement('div');
    staticFire.id='fireboxStaticFire';
    staticFire.setAttribute('aria-hidden','true');
    Object.assign(staticFire.style,{
      position:'absolute',inset:'0',pointerEvents:'none',zIndex:'1198',
      opacity:'0',transition:'opacity 180ms ease-out',
      clipPath:'polygon(1285.246px 444.038px,1359.308px 445.600px,1352.121px 534.975px,1281.183px 536.225px)'
    });
    const bed=document.createElement('img');
    bed.alt='';
    bed.src=FIREBOX_FIRE_STATIC_SRC;
    Object.assign(bed.style,{
      position:'absolute',left:'1232px',top:'414px',width:'180px',height:'auto',
      pointerEvents:'none',filter:'brightness(.72) saturate(1.12)',opacity:'.92'
    });
    staticFire.appendChild(bed);
    scene.appendChild(staticFire);
  }
  let animatedFire=document.getElementById('fireboxAnimatedFire');
  if(!animatedFire){
    animatedFire=document.createElement('div');
    animatedFire.id='fireboxAnimatedFire';
    animatedFire.setAttribute('aria-hidden','true');
    Object.assign(animatedFire.style,{
      position:'absolute',inset:'0',pointerEvents:'none',zIndex:'1199',
      opacity:'0',transition:'opacity 180ms ease-out',
      clipPath:'polygon(1285.246px 444.038px,1359.308px 445.600px,1352.121px 534.975px,1281.183px 536.225px)'
    });
    const flame=document.createElement('img');
    flame.alt='';
    flame.dataset.baseSrc=FIREBOX_FIRE_GIF_SRC;
    flame.src=FIREBOX_FIRE_GIF_SRC;
    Object.assign(flame.style,{
      position:'absolute',left:'1195px',top:'396px',width:'250px',height:'auto',
      pointerEvents:'none',filter:'brightness(.84) saturate(1.08)',opacity:'.94'
    });
    animatedFire.appendChild(flame);
    scene.appendChild(animatedFire);
  }
  let glassFire=document.getElementById('fireboxGlassFire');
  if(!glassFire){
    glassFire=document.createElement('div');
    glassFire.id='fireboxGlassFire';
    glassFire.setAttribute('aria-hidden','true');
    Object.assign(glassFire.style,{
      position:'absolute',inset:'0',pointerEvents:'none',zIndex:'1202',
      opacity:'0',transition:'opacity 220ms ease-out',
      clipPath:'polygon(1299.860px 460.257px,1362.048px 459.945px,1358.923px 508.070px,1298.610px 507.445px)'
    });
    const glassBed=document.createElement('img');
    glassBed.alt='';
    glassBed.src=FIREBOX_FIRE_STATIC_SRC;
    Object.assign(glassBed.style,{
      position:'absolute',left:'1232px',top:'414px',width:'180px',height:'auto',
      pointerEvents:'none',filter:'brightness(.48) saturate(.9)',opacity:'.72'
    });
    const glassFlame=document.createElement('img');
    glassFlame.alt='';
    glassFlame.dataset.baseSrc=FIREBOX_FIRE_GIF_SRC;
    glassFlame.src=FIREBOX_FIRE_GIF_SRC;
    Object.assign(glassFlame.style,{
      position:'absolute',left:'1195px',top:'396px',width:'250px',height:'auto',
      pointerEvents:'none',filter:'brightness(.56) saturate(.9)',opacity:'.66'
    });
    glassFire.append(glassBed,glassFlame);
    scene.appendChild(glassFire);
  }
  let glow=document.getElementById('fireboxGlow');
  if(!glow){
    glow=document.createElement('div');
    glow.id='fireboxGlow';
    scene.appendChild(glow);
  }
  let spark=document.getElementById('fireboxSparkles');
  if(!spark){
    spark=document.createElement('div');
    spark.id='fireboxSparkles';
    const spots=[[18,78],[29,66],[42,58],[58,62],[71,72],[37,84],[63,84],[49,70]];
    spots.forEach((spot,i)=>{
      const dot=document.createElement('span');
      dot.style.left=spot[0]+'%';
      dot.style.top=spot[1]+'%';
      dot.style.animationDelay=(i*0.18).toFixed(2)+'s';
      dot.style.animationDuration=(1.15+(i%3)*0.22).toFixed(2)+'s';
      spark.appendChild(dot);
    });
    scene.appendChild(spark);
  }
  return {staticFire,animatedFire,glassFire,glow,spark};
}
function restartFireboxGif(){
  const fx=ensureFireboxEffects();
  const flames=[fx.animatedFire.querySelector('img'),fx.glassFire.querySelector('img[data-base-src]')].filter(Boolean);
  const stamp=Date.now();
  flames.forEach(flame=>{flame.src='';});
  requestAnimationFrame(()=>flames.forEach(flame=>{const src=flame.dataset.baseSrc||FIREBOX_FIRE_GIF_SRC;flame.src=`${src}?restart=${stamp}`;}));
}
function updateFireboxEffects(){
  const fx=ensureFireboxEffects();
  const live=!!(stoveState.fireOn && (stoveState.fireLevel||0)>0);
  fx.staticFire.style.opacity=live?'1':'0';
  fx.animatedFire.style.opacity=live?'1':'0';
  fx.glassFire.style.opacity=live&&!stoveState.fireboxOpen&&!stoveState.ovenOpen?'1':'0';
  fx.glow.classList.toggle('live',live);
  fx.spark.classList.toggle('live',live);
}

function applyCookstoveState(transition='none'){
 CooksterSave.schedule();
 if(!stoveState.ovenOpen){
   applySceneBackground(FIREBOX_BASE_NO_DOOR,'none');
   syncFireboxDoorLayer(!!stoveState.fireboxOpen,true);
   refreshCookstoveHeating(false);
   updateFireboxEffects();
   return;
 }
 syncFireboxDoorLayer(false,false);
 let bg=stoveState.fireOn?SCENE_BACKGROUNDS.fireOnClosed:SCENE_BACKGROUNDS.fireOffClosed;
 if(stoveState.fireboxOpen){
   // Open + no fire stays dark until the player actually inserts a log.
   // Only then do we switch to the open-fire artwork.
   bg=stoveState.fireOn?SCENE_BACKGROUNDS.fireboxOpenFire:SCENE_BACKGROUNDS.fireboxOpenOff;
 }else if(stoveState.ovenOpen){
   bg=SCENE_BACKGROUNDS.ovenOpen;
 }
 applySceneBackground(bg,transition);
 refreshCookstoveHeating(false);
 updateFireboxEffects();
}
function toggleCookstoveFirebox(){
 const opening=!stoveState.fireboxOpen;
 stoveState.fireboxOpen=opening;
 if(stoveState.fireboxOpen)stoveState.ovenOpen=false;
 applyFireboxDoorTransition(opening);
 // Keep the current full-scene background until the door-only animation
 // finishes; switching it here would make the animation visually identical.
 refreshCookstoveHeating(false);updateFireboxEffects();
 showToast(stoveState.fireboxOpen?'Ložište je otvoreno.':'Ložište je zatvoreno.');
}
function toggleCookstoveOven(){
 const opening=!stoveState.ovenOpen;
 stoveState.ovenOpen=opening;
 if(stoveState.ovenOpen)stoveState.fireboxOpen=false;
 // Never fade the entire scene: that old transition temporarily hid every
 // placed object. The oven state switches directly, while the firebox uses
 // its dedicated door-only overlay.
 applyCookstoveState();
 showToast(stoveState.ovenOpen?'Rerna je otvorena.':'Rerna je zatvorena.');
}
function isDisposableMarketPackaging(el){
 return !!el&&(el.dataset.marketBag==='1'||el.dataset.crate==='1');
}
function packagingIsEmpty(el){
 return isDisposableMarketPackaging(el)&&Math.max(0,+el.dataset.count||0)<=0;
}
function fuelFireWithRemovedItem(el,kind='fuel'){
 if(!el)return false;
 removeItem(el);
 holding=null;
 hidePlacementGhost();hideOriginGhost();clearHover();

 const wasOn=stoveState.fireOn;
 stoveState.fireOn=true;
 stoveState.fireLevel=Math.min(FIRE_MAX_LEVEL,(stoveState.fireLevel||0)+1);
 // Vrata ložišta ostaju otvorena dok ih igrač ručno ne zatvori.
 applyCookstoveState(!wasOn?'ignite':'fade');
 refreshCookstoveHeating(true);
 scheduleFireBurn(!wasOn);
 restartFireAudio();
 if(!wasOn)restartFireboxGif();
 popArtPuff(1306,552,.55);
 if(kind==='log')playImpactSound(firewoodSoundTarget,'insert');
 else playSfxVariant('boardPlace',.40);

 if(kind==='bag'){
   showToast(!wasOn
     ? 'Prazna papirnata kesa je ubačena — vatra je upaljena.'
     : 'Prazna papirnata kesa je izgorela u ložištu.');
 }else if(kind==='crate'){
   showToast(!wasOn
     ? 'Prazna gajbica je ubačena — vatra je upaljena.'
     : 'Prazna gajbica je ubačena u vatru.');
  }else if(kind==='log'){
    showToast(!wasOn
      ? 'Drvo je ubačeno — vatra je upaljena.'
      : (stoveState.fireLevel>=FIRE_MAX_LEVEL?'Vatra je pojačana do maksimuma.':'Dodao si drvo — plamen je jači.'));
 }
 return true;
}
function insertHeldPackagingIntoFirebox(){
 if(!holding||!isDisposableMarketPackaging(holding))return false;
 const item=holding;
 const isBag=item.dataset.marketBag==='1';
 if(!packagingIsEmpty(item)){
   showToast(isBag?'Prvo isprazni kesu.':'Prvo isprazni gajbicu.');
   return true;
 }
 if(!stoveState.fireboxOpen){
   showToast('Prvo otvori vrata ložišta.');
   return true;
 }
 return fuelFireWithRemovedItem(item,isBag?'bag':'crate');
}
function isWoodBasket(el){
 return !!el&&(el.dataset.woodBasket==='1'||el.dataset.itemId===WOOD_BASKET_ID);
}
function woodBasketRemaining(el){
 if(!el||el.dataset.woodRemaining==null)return WOOD_BASKET_MAX_LOGS;
 return Math.max(0,Math.min(WOOD_BASKET_MAX_LOGS,Math.floor(+el.dataset.woodRemaining||0)));
}
function woodBasketStageIndex(remaining){
 return Math.min(WOOD_BASKET_ASSETS.length-1,Math.floor((WOOD_BASKET_MAX_LOGS-remaining)/3));
}
function renderWoodBasket(el){
 if(!isWoodBasket(el))return null;
 el.dataset.woodBasket='1';
 const remaining=woodBasketRemaining(el);
 el.dataset.woodRemaining=String(remaining);
 const stage=WOOD_BASKET_ASSETS[woodBasketStageIndex(remaining)];
 el.dataset.woodStage=stage.name;
 const body=el.querySelector('.body');
 if(body&&body.getAttribute('src')!==stage.src)body.src=stage.src;
 const shadowImage=el._contactShadow?.querySelector('img');
 if(shadowImage&&shadowImage.getAttribute('src')!==stage.src)shadowImage.src=stage.src;
 return stage;
}
function ensureWoodBasket(){
 let basket=items.find(isWoodBasket);
 if(!basket){
   basket=makeItem({
     id:WOOD_BASKET_ID,instanceId:'wood-basket-main',label:'Korpa sa drvima',
     src:WOOD_BASKET_ASSETS[0].src,x:1425,y:532,w:236,h:236,z:++zCounter,
     snapProfile:'flat',shadowProfile:'tiny'
   });
 }
 if(!basket)return null;
 basket.dataset.woodBasket='1';
 if(basket.dataset.woodRemaining==null)basket.dataset.woodRemaining=String(WOOD_BASKET_MAX_LOGS);
 basket.dataset.surfaceZone=basket.dataset.surfaceZone||'floor';
 basket.dataset.collisionProfile=basket.dataset.collisionProfile||'flat';
 const body=basket.querySelector('.body');
 if(body)body.draggable=false;
 setPose(basket,+basket.dataset.cx||1543,+basket.dataset.by||768,+basket.dataset.vis||1);
 return renderWoodBasket(basket)?basket:null;
}
function isBasketWoodLog(el){
 return !!el&&el.dataset.basketWoodLog==='1';
}
function spawnHeldWoodBasketLog(basket,pointerEvent=null){
 if(!isWoodBasket(basket)||holding||picking||placing)return false;
 const remaining=woodBasketRemaining(basket);
 if(remaining<=0)return false;
 const cx=+basket.dataset.cx||1543,by=+basket.dataset.by||768;
 const logW=112,logH=66;
 const clickPoint=pointerEvent&&Number.isFinite(pointerEvent.clientX)&&Number.isFinite(pointerEvent.clientY)
   ?screenToScene(pointerEvent.clientX,pointerEvent.clientY):null;
 const spawnCx=clickPoint?.x??cx;
 const spawnCenterY=clickPoint?.y??(by-(+basket.dataset.baseH||236)*.62);
 const spawnBy=spawnCenterY+logH/2;
 const loose=makeItem({
   id:'drvo',instanceId:nextItemInstanceId('drvo'),label:'Cjepanica',
   src:'assets/wood_basket/individual-log.png',
   x:spawnCx-logW/2-CENTER_OFFSET,y:spawnBy-logH,w:logW,h:logH,z:++zCounter,
   shadowProfile:'tiny',snapProfile:'produce'
 });
 if(!loose)return false;
 loose.dataset.firewood='1';
 loose.dataset.basketWoodLog='1';
 loose.dataset.collisionProfile='flat';
 basket.dataset.woodRemaining=String(remaining-1);
 renderWoodBasket(basket);
 startHolding(loose,pointerEvent);
 showToast('Uzeo si cjepanicu — ubaci je u ložište.');
 return true;
}
function isFirewoodLog(el){
 return isBasketWoodLog(el);
}
function insertHeldLogIntoFirebox(){
 if(!holding||!isFirewoodLog(holding))return false;
 if(!stoveState.fireboxOpen){showToast('Prvo otvori vrata ložišta.');return true;}
 return fuelFireWithRemovedItem(holding,'log');
}
let woodBasketActionMenu=null;
function closeWoodBasketActionMenu(){
 if(woodBasketActionMenu){woodBasketActionMenu.remove();woodBasketActionMenu=null;}
}
function requestWoodBasketFill(basket){
 closeWoodBasketActionMenu();
 window.dispatchEvent(new CustomEvent('cookster:wood-basket-fill-request',{
   detail:{instanceId:basket?.dataset?.instanceId||'',remaining:woodBasketRemaining(basket)}
 }));
}
function openWoodBasketActionMenu(basket,x,y){
 closeWoodBasketActionMenu();
 const menu=document.createElement('div');
 menu.className='wood-basket-action-menu';
 Object.assign(menu.style,{
   position:'fixed',left:'0px',top:'0px',zIndex:'30000',display:'flex',
   flexDirection:'column',gap:'5px',padding:'7px',
   background:'rgba(39,28,19,.96)',border:'1px solid rgba(255,220,150,.75)',
   borderRadius:'7px',boxShadow:'0 5px 18px rgba(0,0,0,.45)',color:'#fff',
   font:'600 13px/1.2 system-ui,sans-serif'
 });
 menu.addEventListener('pointerdown',e=>e.stopPropagation());
 const title=document.createElement('strong');
 title.textContent='Korpa je prazna';
 title.style.padding='2px 5px 4px';
 menu.appendChild(title);
 const button=document.createElement('button');
 button.type='button';
 button.textContent='Napuni korpu';
 Object.assign(button.style,{
   border:'0',borderRadius:'5px',padding:'7px 10px',cursor:'pointer',
   background:'#f0c36a',color:'#2a1a0e',font:'700 13px system-ui'
 });
 button.addEventListener('click',e=>{e.stopPropagation();requestWoodBasketFill(basket);});
 menu.appendChild(button);
 document.body.appendChild(menu);
 woodBasketActionMenu=menu;
 const mw=menu.offsetWidth||160,mh=menu.offsetHeight||60;
 menu.style.left=Math.max(8,Math.min(innerWidth-mw-8,x+4))+'px';
 menu.style.top=Math.max(8,Math.min(innerHeight-mh-8,y+4))+'px';
 setTimeout(()=>document.addEventListener('pointerdown',e=>{
   if(!menu.contains(e.target))closeWoodBasketActionMenu();
 },{once:true}),0);
}
window.CooksterWoodBasket={
 get(){return items.find(isWoodBasket)||null;},
 snapshot(){
   const basket=items.find(isWoodBasket);
   if(!basket)return null;
   const record=serializeWorldItem(basket);
   return{
     remaining:woodBasketRemaining(basket),stage:basket.dataset.woodStage||'',
     cx:record.cx,by:record.by,instanceId:record.instanceId,src:record.src
   };
 },
  setRemaining(value){
    const basket=items.find(isWoodBasket);
    if(!basket)return false;
    const remaining=Math.max(0,Math.min(WOOD_BASKET_MAX_LOGS,Math.floor(+value||0)));
    basket.dataset.woodRemaining=String(remaining);
    renderWoodBasket(basket);
    CooksterSave.schedule();
    return true;
  },
 requestFill(){const basket=items.find(isWoodBasket);if(!basket)return false;requestWoodBasketFill(basket);return true;}
};

// v79: samo pažljivo odabrani gameplay zvukovi. Stari generički SFX ostaju ugašeni.
const SFX={
 tomatoChop:'assets/sfx/game/tomatoChop_1.wav',
 boardPlace:'assets/sfx/game/boardPlace_1.wav',
 tableDropSoft:'assets/sfx/game/tableDropSoft_1.wav',
 tableDropBright:'assets/sfx/game/tableDropBright_1.wav',
 tableDropMediumA:'assets/sfx/game/tableDropMediumA_1.wav',
 tableDropMediumB:'assets/sfx/game/tableDropMediumB_1.wav',
 tableDropHeavy:'assets/sfx/game/tableDropHeavy_1.wav',
 tableDropGlass:'assets/sfx/game/tableDropGlass_1.wav',
 uiClick:'assets/sfx/game/uiClick_1.wav',
 pickup:'assets/sfx/game/pickup_1.wav',
 woodDrop:'assets/sfx/game/woodDrop_1.wav',
 metalDrop:'assets/sfx/game/metalDrop_1.wav',
 lidOpen:'assets/sfx/game/lidOpen_1.wav',
 lidClose:'assets/sfx/game/lidClose_1.wav',
 stoveDoorOpen:'assets/sfx/game/stoveDoorOpen_1.wav',
 stoveDoorClose:'assets/sfx/game/stoveDoorClose_1.wav',
 oilSizzle:'assets/sfx/game/oilSizzle_1.wav',
 panPlace:'assets/sfx/game/panPlace_1.wav',
};
const SFX_VARIANTS={
 tableDropSoft:['assets/sfx/game/tableDropSoft_1.wav','assets/sfx/game/tableDropSoft_2.wav','assets/sfx/game/tableDropSoft_3.wav'],
 tableDropBright:['assets/sfx/game/tableDropBright_1.wav','assets/sfx/game/tableDropBright_2.wav','assets/sfx/game/tableDropBright_3.wav'],
 tableDropMediumA:['assets/sfx/game/tableDropMediumA_1.wav','assets/sfx/game/tableDropMediumA_2.wav','assets/sfx/game/tableDropMediumA_3.wav'],
 tableDropMediumB:['assets/sfx/game/tableDropMediumB_1.wav','assets/sfx/game/tableDropMediumB_2.wav','assets/sfx/game/tableDropMediumB_3.wav'],
 tableDropHeavy:['assets/sfx/game/tableDropHeavy_1.wav','assets/sfx/game/tableDropHeavy_2.wav','assets/sfx/game/tableDropHeavy_3.wav'],
 tableDropGlass:['assets/sfx/game/tableDropGlass_1.wav','assets/sfx/game/tableDropGlass_2.wav','assets/sfx/game/tableDropGlass_3.wav'],
 tomatoChop:['assets/sfx/game/tomatoChop_1.wav','assets/sfx/game/tomatoChop_2.wav','assets/sfx/game/tomatoChop_3.wav'],
 boardPlace:['assets/sfx/game/boardPlace_1.wav','assets/sfx/game/boardPlace_2.wav','assets/sfx/game/boardPlace_3.wav'],
 pickup:['assets/sfx/game/pickup_1.wav','assets/sfx/game/pickup_2.wav','assets/sfx/game/pickup_3.wav'],
 uiClick:['assets/sfx/game/uiClick_1.wav','assets/sfx/game/uiClick_2.wav','assets/sfx/game/uiClick_3.wav'],
 stoveDoorOpen:['assets/sfx/game/stoveDoorOpen_1.wav','assets/sfx/game/stoveDoorOpen_2.wav'],
 stoveDoorClose:['assets/sfx/game/stoveDoorClose_1.wav','assets/sfx/game/stoveDoorClose_2.wav','assets/sfx/game/stoveDoorClose_3.wav'],
 oilSizzle:['assets/sfx/game/oilSizzle_1.wav','assets/sfx/game/oilSizzle_2.wav'],
 panPlace:['assets/sfx/game/panPlace_1.wav','assets/sfx/game/panPlace_2.wav'],
 woodDrop:['assets/sfx/game/woodDrop_1.wav','assets/sfx/game/woodDrop_2.wav','assets/sfx/game/woodDrop_3.wav'],
 metalDrop:['assets/sfx/game/metalDrop_1.wav','assets/sfx/game/metalDrop_2.wav','assets/sfx/game/metalDrop_3.wav'],
 lidOpen:['assets/sfx/game/lidOpen_1.wav','assets/sfx/game/lidOpen_2.wav'],
 lidClose:['assets/sfx/game/lidClose_1.wav','assets/sfx/game/lidClose_2.wav'],
};

const sfxShuffleBags={};
function playSfxVariant(key,volume=1,force=false){
 if(isLibrarySoundDeleted(key))return;
 const variants=SFX_VARIANTS[key];
 if(!variants||!variants.length)return playSfx(key,volume,force);
 let bag=sfxShuffleBags[key];
 if(!bag||!bag.length){bag=[...Array(variants.length).keys()];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}sfxShuffleBags[key]=bag;}
 const idx=bag.shift();const src=variants[idx];
 try{let base=sfxCache[src];if(!base){base=new Audio(src);base.preload='auto';sfxCache[src]=base;}const a=base.cloneNode();a.volume=Math.max(0,Math.min(1,volume));a.play().catch(()=>{});return a;}catch(_){}
}
const sfxCache={};
let activeSoundPreview=null;
const AUDIO_LIBRARY_KEY='cookster.audio-library.v1';
let importedAudio={};
try{importedAudio=JSON.parse(localStorage.getItem(AUDIO_LIBRARY_KEY)||'{}')||{};}catch(_){importedAudio={};}
const SOUND_LIBRARY_DELETED_KEY='cookster.deleted-sounds.v1';
let deletedLibrarySounds=new Set();
try{
 const saved=JSON.parse(localStorage.getItem(SOUND_LIBRARY_DELETED_KEY)||'[]');
 if(Array.isArray(saved))deletedLibrarySounds=new Set(saved.filter(key=>typeof key==='string'&&Object.hasOwn(SFX,key)));
}catch(_){}
function isLibrarySoundDeleted(key){
 return deletedLibrarySounds.has(key)||(key?.startsWith('custom:')&&!importedAudio[key.slice(7)]);
}
function persistDeletedLibrarySounds(){
 try{localStorage.setItem(SOUND_LIBRARY_DELETED_KEY,JSON.stringify([...deletedLibrarySounds]));}catch(_){}
}
const DEFAULT_GAME_SFX_ENABLED=true;
function playSfx(key,volume=1,force=false){
 if(isLibrarySoundDeleted(key))return;
 if(!force&&!DEFAULT_GAME_SFX_ENABLED)return;
 const stored=key?.startsWith('custom:')?importedAudio[key.slice(7)]:null,src=key?.startsWith('custom:')?(typeof stored==='string'?stored:stored?.src):SFX[key];if(!src)return;
 try{
   let base=sfxCache[key];
   if(!base){base=new Audio(src);base.preload='auto';sfxCache[key]=base;}
   const a=base.cloneNode();a.volume=Math.max(0,Math.min(1,volume));a.play().catch(()=>{});return a;
 }catch(_){/* audio ne sme da prekine gameplay */}
}
function previewSfx(key,volume=1){if(activeSoundPreview){activeSoundPreview.pause();activeSoundPreview.currentTime=0;}activeSoundPreview=playSfx(key,volume,true)||null;if(activeSoundPreview)activeSoundPreview.addEventListener('ended',()=>{activeSoundPreview=null},{once:true});}
function dropSfxForItem(el){
 const id=el?.dataset?.itemId||'';
 if(id==='daska')return 'tableDropSoft';
 if(id.startsWith('tegla_')||id.includes('jar'))return 'tableDropGlass';
 if(id.includes('tiganj')||id.includes('vangla_metalna')||id.includes('__lid'))return 'tableDropBright';
 if(id.includes('serpa'))return 'tableDropHeavy';
 if(id.includes('vangla_bela')||id.includes('tanjir')||id.includes('cinija'))return 'tableDropMediumA';
 let hash=0;for(let i=0;i<id.length;i++)hash=(hash*31+id.charCodeAt(i))|0;
 return Math.abs(hash)%2?'tableDropMediumA':'tableDropMediumB';
}
// Compact per-object impact sound editor. Settings are kept separately from
// lighting so changing a sound never rewrites the shadow/time configuration.
const SOUND_TOOL_KEY='cookster.impact-sounds.v1';
const SOUND_DEFAULTS={sound:'',volume:.58,delay:0,cooldown:.15};
let impactSounds={};
try{impactSounds=JSON.parse(localStorage.getItem(SOUND_TOOL_KEY)||'{}')||{};}catch(_){impactSounds={};}
let selectingSoundItem=false,soundToolActive=false,selectedSoundItem=null,selectedSoundAction='drop',soundDraftVariants=[];
const soundShuffleBags={};
const soundLastPlayed={};
function makeSoundTarget(key,label,action){
 const el=document.createElement('span');el.hidden=true;
 el.dataset.soundTarget=key;el.dataset.label=label;el.dataset.soundAction=action;
 document.body.appendChild(el);return el;
}
const buttonSoundTarget=makeSoundTarget('__ui_buttons','Dugmići — klik i prelaz mišem','click');
buttonSoundTarget.dataset.soundActions='click,hover';
const firewoodSoundTarget=makeSoundTarget('__firewood_insert','Cepanica — ubacivanje u šporet','insert');
const bookSoundTarget=makeSoundTarget('__recipe_book','Bakina knjiga — otvaranje/zatvaranje','');
bookSoundTarget.dataset.soundActions='open,close,pageTurn';
const faucetSoundTarget=makeSoundTarget('__faucet','Česma — voda','water');
const peelSoundTarget=makeSoundTarget('__peel_button','Dugme „Očisti luk“ — čišćenje','peel');
peelSoundTarget.dataset.soundActions='peel';
// one virtual sound target per vegetable/fruit type: cutting and putting into a vessel share it
const produceSoundTargets={};
function produceSoundTarget(isFruit,key,label){
 const id=(isFruit?'fruit_':'veg_')+key;
 if(!produceSoundTargets[id]){
  const t=makeSoundTarget(id,`${isFruit?'Voće':'Povrće'} — ${label||key}`,'');
  t.dataset.soundActions='cut,putIn';t.dataset.soundGroup='produce';
  produceSoundTargets[id]=t;
 }
 return produceSoundTargets[id];
}
function vegSoundTarget(el){
 const isFruit=el?.dataset?.fruit==='1';
 const key=el?.dataset?.vegKey||el?.dataset?.fruitKey||'';
 if(!key)return el;
 const def=(isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES)[key]||{};
 return produceSoundTarget(isFruit,key,def.label);
}
[fireboxHotspot,ovenHotspot].forEach(el=>{
 if(!el)return;
 el.dataset.soundTarget=el.dataset.soundTarget||el.id;
 el.dataset.soundActions='open,close';
 el.dataset.label=el.dataset.label||(el===fireboxHotspot?'Šporet — vrata ložišta':'Šporet — vrata rerne');
});
function soundKey(el){return el?.dataset?.soundTarget||el?.dataset?.itemId||el?.dataset?.instanceId||'';}
function persistImpactSounds(){try{localStorage.setItem(SOUND_TOOL_KEY,JSON.stringify(impactSounds));}catch(_){} }
function ensureSoundActionRecord(key){const old=impactSounds[key];if(old?.actions)return old;const record={actions:{}};if(old){record.actions.drop={...SOUND_DEFAULTS,...old,variants:old.variants||[old.sound].filter(Boolean)};}impactSounds[key]=record;return record;}
function resolvedImpactConfig(el,action='drop'){
 const record=impactSounds[soundKey(el)];
 let config=record?.actions?.[action];
 // Older "Spuštanje" choices remain the fallback for each surface. An
 // explicitly empty surface choice is silent, not a request for fallback.
 if(!config&&(action==='dropTable'||action==='dropStove'))config=record?.actions?.drop;
 if(!config&&['drop','dropTable','dropStove'].includes(action)&&record&&!record.actions)config=record;
 if(config)return{...SOUND_DEFAULTS,...config,variants:(config.variants||[config.sound].filter(Boolean)).filter(key=>!isLibrarySoundDeleted(key))};
 const isItem=el?.classList?.contains('item');
 let sound='',volume=SOUND_DEFAULTS.volume;
 if(action==='drop'||action==='dropTable')sound=isItem?dropSfxForItem(el):'';
 else if(action==='dropStove')sound=isItem?(isHeatableCookwareItem(el)?'panPlace':'metalDrop'):'';
 else if(action==='pickup'&&isItem){sound='pickup';volume=.18;}
 else if(action==='click'){sound='uiClick';volume=.22;}
 else if(action==='insert'){sound='woodDrop';volume=.40;}
 else if(action==='hover'){sound='';volume=.25;}
 else if(action==='cut'){sound='tomatoChop';volume=.78;}
 else if(action==='putIn'){sound='metalDrop';volume=.18;}
 else if(action==='peel'){sound='pickup';volume=.35;}
 else if(action==='open'||action==='close'){
   const door=el===fireboxHotspot||el===ovenHotspot;
   if(door)sound=action==='open'?'stoveDoorOpen':'stoveDoorClose';
   else if(el?._lidMeta||isAjvarJar(el))sound=action==='open'?'lidOpen':'lidClose';
   volume=action==='open'?.50:.52;
 }
 return{...SOUND_DEFAULTS,volume,cooldown:action==='click'?.04:action==='hover'?.05:action==='cut'?.06:SOUND_DEFAULTS.cooldown,variants:sound&&!isLibrarySoundDeleted(sound)?[sound]:[]};
}
function removeSoundReferences(key){
 let used=0;
 for(const record of Object.values(impactSounds)){
  for(const cfg of record?.actions?Object.values(record.actions):[record]){
   if(!cfg||typeof cfg!=='object')continue;
   const variants=cfg.variants||[cfg.sound].filter(Boolean);
   if(!variants.includes(key)&&cfg.sound!==key)continue;
   cfg.variants=variants.filter(v=>v!==key);
   if(cfg.sound===key)cfg.sound='';
   used++;
  }
 }
 delete sfxCache[key];
 for(const bag of Object.keys(soundShuffleBags))delete soundShuffleBags[bag];
 return used;
}
function commitLibraryRemoval(keys){
 const storageKeys=[AUDIO_LIBRARY_KEY,SOUND_TOOL_KEY,SOUND_LIBRARY_DELETED_KEY];
 let stored;
 try{stored=storageKeys.map(key=>localStorage.getItem(key));}catch(_){return null;}
 const oldAudio={...importedAudio},oldImpact=JSON.parse(JSON.stringify(impactSounds)),oldDeleted=new Set(deletedLibrarySounds);
 let used=0;
 for(const key of keys){
  used+=removeSoundReferences(key);
  if(key.startsWith('custom:'))delete importedAudio[key.slice(7)];
  else if(Object.hasOwn(SFX,key))deletedLibrarySounds.add(key);
 }
 try{
  localStorage.setItem(AUDIO_LIBRARY_KEY,JSON.stringify(importedAudio));
  localStorage.setItem(SOUND_TOOL_KEY,JSON.stringify(impactSounds));
  localStorage.setItem(SOUND_LIBRARY_DELETED_KEY,JSON.stringify([...deletedLibrarySounds]));
 }catch(_){
  importedAudio=oldAudio;impactSounds=oldImpact;deletedLibrarySounds=oldDeleted;
  // Restore metadata first so there is space for the original audio payload.
  for(let i=storageKeys.length-1;i>=0;i--){
   try{if(stored[i]===null)localStorage.removeItem(storageKeys[i]);else localStorage.setItem(storageKeys[i],stored[i]);}catch(_){}
  }
  return null;
 }
 if(keys.includes(ssPlayingKey))ssStop();
 return {used};
}
function pickActionSound(el,action,cfg){const list=(cfg.variants||[cfg.sound]).filter(Boolean);if(!list.length)return'';const bagKey=soundKey(el)+'|'+action;let bag=soundShuffleBags[bagKey];if(!bag?.length){bag=list.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}}const index=bag.shift();soundShuffleBags[bagKey]=bag;return list[index]||list[0];}
function playImpactSound(el,action='drop'){
 const cfg=resolvedImpactConfig(el,action),sound=pickActionSound(el,action,cfg);if(!sound)return false;
 const now=performance.now(),key=soundKey(el)+'|'+action;
 if(soundLastPlayed[key]!==undefined&&now-soundLastPlayed[key]<Math.max(0,+cfg.cooldown||0)*1000)return true;
 soundLastPlayed[key]=now;const wait=Math.max(0,+cfg.delay||0)*1000;
 const play=()=>playSfx(sound,Math.max(0,Math.min(1,+cfg.volume||0)),true);
 if(wait) setTimeout(play,wait);else play();return true;
}
function scheduleEarlyImpactSound(el,contactMs,action='drop'){const cfg=resolvedImpactConfig(el,action),sound=pickActionSound(el,action,cfg);if(!sound||(+cfg.delay||0)>=0)return false;const now=performance.now(),key=soundKey(el)+'|'+action;if(soundLastPlayed[key]!==undefined&&now-soundLastPlayed[key]<Math.max(0,+cfg.cooldown||0)*1000)return true;soundLastPlayed[key]=now;setTimeout(()=>playSfx(sound,Math.max(0,Math.min(1,+cfg.volume||0)),true),Math.max(0,contactMs+(+cfg.delay||0)*1000));return true;}
window.addEventListener('click',e=>{
 const button=e.target?.closest?.('button,[role="button"],input[type="button"],input[type="submit"]');
 if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||
    button.closest('.item,#fireboxHotspot,#ovenHotspot,.ss-preview-btn,[data-sound-preview]')||
    /preslu[sš]aj|pauziraj/i.test((button.title||'')+' '+(button.getAttribute('aria-label')||'')))return;
 playImpactSound(buttonSoundTarget,'click');
},true);
// Hover over a button: plays the sound chosen under "Dugmići — Prelaz mišem" (silent until one is added).
let lastHoverButton=null;
window.addEventListener('pointerover',e=>{
 if(e.pointerType&&e.pointerType!=='mouse')return;
 const button=e.target?.closest?.('button,[role="button"],input[type="button"],input[type="submit"]');
 if(!button){lastHoverButton=null;return;}
 if(button===lastHoverButton)return;
 lastHoverButton=button;
 if(button.disabled||button.getAttribute('aria-disabled')==='true'||
    button.closest('.item,#fireboxHotspot,#ovenHotspot,.ss-preview-btn,[data-sound-preview]'))return;
 playImpactSound(buttonSoundTarget,'hover');
},true);
/* ==========================================================================
   Cookster · Zvuk studio (v2.28)
   Replaces the old "Zvukovi kontakta" <details> panel.
   Data format (cookster.impact-sounds.v1, cookster.audio-library.v1) unchanged.
   Reuses the .ls CSS from light-studio with a few additions.
   ========================================================================== */

/* --- extra styles (appended, not replacing .ls) --- */
const ssStyle=document.createElement('style');
ssStyle.textContent=`
.ss-wave{position:relative;height:42px;border-radius:8px;background:var(--surface);overflow:hidden;cursor:pointer}
.ss-wave canvas{display:block;width:100%;height:100%;border-radius:8px}
.ss-wave .ss-play-line{position:absolute;top:0;bottom:0;width:2px;background:var(--sun);display:none}
.ss-wave:hover .ss-play-line{display:block}
.ss-wave.is-playing{box-shadow:0 0 0 2px var(--sun) inset}
.ss-drag-over{box-shadow:0 0 0 2px var(--sun) inset!important;background:var(--sun-d)!important}
.ss-variant{display:grid;grid-template-columns:1fr auto auto auto;gap:6px;align-items:center;min-height:36px;padding:5px 6px;border-radius:9px;border:1px solid transparent}
.ss-variant:hover{background:var(--surface)}
.ss-variant.is-playing{border-color:var(--sun)}
.ss-variant .ls-item-n{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ss-lib-row{display:grid;grid-template-columns:1fr 32px auto;gap:4px;align-items:center;min-height:32px;padding:3px 6px;border-radius:8px;cursor:pointer}
.ss-lib-row:hover{background:var(--raise)}
.ss-lib-row.is-sel{background:var(--sun-d)}
.ss-lib-row span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ss-drop{border:2px dashed var(--line2);border-radius:10px;padding:18px 14px;text-align:center;color:var(--mute);cursor:pointer;transition:border-color .15s,background .15s}
.ss-drop:hover,.ss-drop.ss-drag-over{border-color:var(--sun);background:var(--sun-d);color:var(--text)}
.ss-meter-row{display:grid;grid-template-columns:96px 1fr 26px;gap:8px;align-items:center;min-height:26px}
.ss-meter-row .ls-lab{font-size:11.5px}
.ss-meter-bar{height:4px;border-radius:4px;background:var(--raise);overflow:hidden}
.ss-meter-fill{height:100%;border-radius:4px;background:var(--sun);transition:width .12s}
.ss-action-tabs{display:flex;flex-wrap:wrap;gap:2px;margin:4px 0 8px;padding:2px;border-radius:8px;background:var(--surface)}
.ss-action-tabs button{flex:1;border:0;border-radius:6px;background:none;padding:5px 3px;color:var(--mute);cursor:pointer;font-size:11.5px;white-space:nowrap}
.ss-action-tabs button:hover{color:var(--text)}
.ss-action-tabs button[aria-pressed="true"]{background:var(--raise);color:var(--text);box-shadow:0 1px 2px rgba(0,0,0,.3)}
.ss-action-tabs button .ss-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;vertical-align:1px;background:var(--faint)}
.ss-action-tabs button[data-has="true"] .ss-dot{background:var(--sun)}
.ss-obj-tags{display:flex;gap:3px;flex:0 1 auto;flex-wrap:wrap;justify-content:flex-end;max-width:65%}
.ss-obj-tag{font-size:10px;padding:1px 5px;border-radius:5px;background:var(--surface);color:var(--mute)}
.ss-preview-btn{width:32px;height:32px;border-radius:50%;border:0;background:var(--raise);color:var(--text);cursor:pointer;display:grid;place-items:center;flex:none}
.ss-preview-btn:hover{background:var(--sun-d);color:var(--sun)}
.ss-preview-btn.is-playing{background:var(--sun);color:#1d1822}
.ss-storage{margin:6px 0;padding:8px 10px;border-radius:9px;background:var(--surface)}
.ss-storage small{color:var(--faint)}
`;
document.head.appendChild(ssStyle);

/* --- state --- */
const SS_ACTIONS=[['drop','Opšte spuštanje'],['dropTable','Na sto'],['dropStove','Na šporet'],['pickup','Podizanje'],['open','Otvaranje'],['close','Zatvaranje'],['slide','Klizanje'],['hit','Udarac'],['click','Klik dugmeta'],['insert','Ubacivanje cepanice'],['cut','Sečenje'],['peel','Čišćenje luka'],['putIn','Stavljanje u posudu'],['pageTurn','Okretanje stranice'],['water','Voda iz česme'],['hover','Prelaz mišem preko dugmeta']];
const ssState={open:false,tab:'objekti',action:'drop',query:'',libQuery:'',libOpen:false};

/* --- helpers (reuse ls* from light-studio) --- */
function ssEl(tag,attrs,...kids){return lsEl(tag,attrs,...kids);}
function ssFmt(v,d=2){return Number.isFinite(v)?(+v).toFixed(d):String(v);}
function ssAudioName(key){
 if(!key)return 'Bez zvuka';
 if(key.startsWith('custom:')){const id=key.slice(7),v=importedAudio[id];return typeof v==='object'&&v.name?v.name:id;}
 return key;
}
function ssObjLabel(el){return el?.dataset?.label||el?.dataset?.itemId||el?.id||'?';}
function ssObjKey(el){return soundKey(el);}
function ssObjActions(el){
 const key=ssObjKey(el),record=impactSounds[key];
 if(!record)return [];
 if(record.actions){return Object.keys(record.actions).filter(a=>{const c=record.actions[a];return c&&(c.variants||[]).filter(Boolean).length>0;});}
 if(record.sound||record.variants?.length)return ['drop'];
 return [];
}
function ssHasAnySound(el){return ssObjActions(el).length>0;}
function ssVariants(el,action){
 const cfg=resolvedImpactConfig(el,action);
 return (cfg.variants||[cfg.sound]).filter(Boolean);
}
function ssConfig(el,action){return resolvedImpactConfig(el,action);}

/* --- waveform drawing --- */
function ssDrawWave(canvas,key,color='#f2b441'){
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);
 if(!key)return;
 const src=key.startsWith('custom:')?
  (()=>{const id=key.slice(7),v=importedAudio[id];return typeof v==='string'?v:v?.src;})():
  SFX[key];
 if(!src)return;
 // Simple visual: draw bars from hash of key
 ctx.fillStyle=color;
 let hash=0;for(let i=0;i<key.length;i++)hash=(hash*31+key.charCodeAt(i))|0;
 const bars=Math.max(16,Math.min(64,W/4));
 for(let i=0;i<bars;i++){
  const seed=(hash*7+i*13)&0x7fffffff;
  const h=Math.max(3,((seed%100)/100)*.85*H);
  const x=i/bars*W, w=Math.max(1,W/bars-1);
  ctx.globalAlpha=.5+.5*((seed%50)/50);
  ctx.fillRect(x,H/2-h/2,w,h);
 }
 ctx.globalAlpha=1;
}

/* --- preview playback --- */
let ssPlaying=null,ssPlayingKey='';
function ssPreview(key,volume=.6){
 ssStop();
 if(!key)return;
 const a=playSfx(key,volume,true);
 if(!a)return;
 ssPlaying=a;ssPlayingKey=key;
 a.addEventListener('ended',()=>{if(ssPlaying===a){ssPlaying=null;ssPlayingKey='';ssSync();}},{once:true});
 ssSync();
}
function ssStop(){if(ssPlaying){ssPlaying.pause();ssPlaying.currentTime=0;ssPlaying=null;ssPlayingKey='';}}
function ssIsPlaying(key){return !!ssPlaying&&ssPlayingKey===key&&!ssPlaying.paused;}

/* --- panel shell (mirrors light studio) --- */
const soundPanel=ssEl('div',{class:'ls',role:'dialog','aria-label':'Zvuk studio'});
soundPanel.style.display='none';
soundPanel.id='soundPanel';
const ssRoot=ssEl('div',{class:'ls-root'});soundPanel.appendChild(ssRoot);
Object.defineProperty(soundPanel,'open',{configurable:true,get(){return ssState.open;},set(v){v=!!v;if(!v)soundPanel.style.display='none';if(v===ssState.open)return;ssState.open=v;if(v){soundPanel.style.display='block';ssOnOpen();}else ssOnClose();}});

const ssCloseBtn=lsIconBtn('close','Zatvori',()=>{soundPanel.open=false;});
const ssSideBtn=lsIconBtn('side','Prebaci na drugu stranu',()=>{soundPanel.dataset.side=soundPanel.dataset.side==='left'?'right':'left';});
soundPanel.dataset.side='right';
ssRoot.appendChild(ssEl('header',{class:'ls-head'},ssEl('div',{class:'ls-title'},ssEl('span',{class:'ls-glyph',style:'background:conic-gradient(from 120deg,#f2b441 0 50%,#7c6a3a 50% 100%)'}),'Zvuk'),ssSideBtn,ssCloseBtn));

/* --- tabs --- */
const SS_TABS=[['objekti','Objekti'],['biblioteka','Biblioteka']];
const ssTabBar=ssEl('nav',{class:'ls-tabs',role:'tablist'});
const ssBody=ssEl('div',{class:'ls-body'});
const ssPanes={};
for(const [id,label] of SS_TABS){
 const b=ssEl('button',{type:'button',role:'tab',dataset:{tab:id}},label);
 b.onclick=()=>ssSetTab(id);ssTabBar.appendChild(b);
 ssPanes[id]=ssEl('div',{class:'ls-pane',role:'tabpanel',hidden:true});ssBody.appendChild(ssPanes[id]);
}
ssRoot.append(ssTabBar,ssBody);

const ssHint=ssEl('span',{class:'ls-hint'});
const ssSaved=ssEl('span',{class:'ls-saved'});
ssRoot.appendChild(ssEl('footer',{class:'ls-foot'},ssHint,ssSaved));
let ssFlashTimer=0;
function ssFlash(text){ssHint.textContent=text;clearTimeout(ssFlashTimer);ssFlashTimer=setTimeout(()=>{ssHint.textContent='Klikni predmet na sceni ili ga izaberi iz liste.';},2500);}

function ssSetTab(id){
 ssState.tab=id;
 for(const b of ssTabBar.children)b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false');
 for(const [k,p] of Object.entries(ssPanes))p.hidden=k!==id;
 ssRender();
}

/* --- sync controls --- */
const ssControls=[];
function ssSync(){for(const fn of ssControls)try{fn();}catch(_){}}

/* --- tab: Objekti --- */
const ssPickBtn=lsBtn('Nišani',()=>{selectingSoundItem=true;soundToolActive=true;ssFlash('Klikni na predmet na sceni…');ssSync();},{icon:'pick'});
ssControls.push(()=>{ssPickBtn.classList.toggle('is-on',!!soundToolActive);lsSetBtnLabel(ssPickBtn,soundToolActive?'Klikni predmet…':'Nišani');});
const ssSearch=ssEl('input',{type:'search',class:'ls-input',placeholder:'Traži…','aria-label':'Traži predmet'});
ssSearch.addEventListener('input',()=>{ssState.query=ssSearch.value.trim().toLowerCase();ssRenderObjList();});
const ssObjList=ssEl('div',{class:'ls-list'});
ssObjList.style.maxHeight='40vh';
const ssObjCard=ssEl('div',{class:'ls-card'});
const ssInspector=ssEl('div',{});

function ssSel(){return selectedSoundItem?.isConnected?selectedSoundItem:null;}
function ssSceneItems(){
 const items=[...scene.querySelectorAll('.item')].filter(el=>el.dataset.itemId&&el.style.display!=='none'&&el.offsetWidth>0);
 const hotspots=[fireboxHotspot,ovenHotspot].filter(el=>el?.isConnected);
 hotspots.forEach(el=>{if(!el.dataset.soundTarget)el.dataset.soundTarget=el.id;if(!el.dataset.label)el.dataset.label=el.id;});
 // every object that exists in the game, even when it is not on the scene right now
 const present=new Set(items.map(el=>el.dataset.itemId));
 const catalogProps=[];
 try{
  for(const def of KITCHEN_EQUIPMENT){
   if(!def?.id||present.has(def.id))continue;
   if(!ssCatalogTargets[def.id]){ssCatalogTargets[def.id]=makeSoundTarget(def.id,def.label||def.id,'');ssCatalogTargets[def.id].dataset.soundGroup='props';}
   catalogProps.push(ssCatalogTargets[def.id]);
  }
 }catch(_){}
 const produce=[];
 try{
  for(const [key,def] of Object.entries(VEGETABLES))produce.push(produceSoundTarget(false,key,def.label));
  for(const [key,def] of Object.entries(CooksterCatalog.FRUITS||{}))produce.push(produceSoundTarget(true,key,def.label));
 }catch(_){}
 return [buttonSoundTarget,firewoodSoundTarget,bookSoundTarget,faucetSoundTarget,peelSoundTarget,...items,...catalogProps,...hotspots,...produce];
}
const ssCatalogTargets={};

function ssSelectItem(el){
 selectedSoundItem=el;
 selectingSoundItem=false;soundToolActive=false;
 ssState.action=el.dataset.soundAction||el.dataset.soundActions?.split(',')[0]||'dropTable';
 ssRender();
}

let ssObjCount=-1;
function ssRenderObjList(){
 const all=ssSceneItems(),sel=ssSel();ssObjCount=all.length;
 const byName=(a,b)=>ssObjLabel(a).localeCompare(ssObjLabel(b),'sr');
 const groups=[
  ['Zvuci igre',all.filter(el=>String(el.dataset.soundTarget||'').startsWith('__'))],
  ['Predmeti',all.filter(el=>el.dataset.soundGroup!=='produce'&&!String(el.dataset.soundTarget||'').startsWith('__'))],
  ['Povrće i voće',all.filter(el=>el.dataset.soundGroup==='produce')]
 ];
 const rowFor=el=>{
  const acts=ssObjActions(el);
  const tags=ssEl('span',{class:'ss-obj-tags'},acts.length?acts.map(a=>{const label=SS_ACTIONS.find(x=>x[0]===a)?.[1]||a;return ssEl('span',{class:'ss-obj-tag'},label);}):null);
  const row=ssEl('div',{class:'ls-item'+(el===sel?' is-sel':''),role:'button',tabindex:0},ssEl('span',{class:'ls-item-n'},ssObjLabel(el)),tags);
  row.onclick=()=>ssSelectItem(el);
  return row;
 };
 const out=[];
 for(const [title,list] of groups){
  if(!list.length)continue;
  out.push(ssEl('small',{style:'display:block;padding:8px 6px 2px;color:var(--faint);text-transform:uppercase;letter-spacing:.04em'},title));
  out.push(...list.sort(byName).map(rowFor));
 }
 if(!out.length){ssObjList.replaceChildren(ssEl('div',{class:'ls-empty'},'Nema predmeta.'));return;}
 ssObjList.replaceChildren(...out);
}

function ssRenderObjCard(){
 const el=ssSel();
 ssInspector.hidden=!el;
 if(!el){ssObjCard.replaceChildren(ssEl('small',{},'Nijedan predmet nije izabran.'));return;}
 ssObjCard.replaceChildren(ssEl('h4',{},ssObjLabel(el)),ssEl('small',{},ssObjKey(el)));
}

/* action tabs */
const ssActionBar=ssEl('div',{class:'ss-action-tabs',role:'group'});
const ssActionBtns=SS_ACTIONS.map(([value,label])=>{
 const b=ssEl('button',{type:'button'},ssEl('span',{class:'ss-dot'}),' '+label);
 b.onclick=()=>{ssState.action=value;ssSync();ssRenderVariants();};
 ssActionBar.appendChild(b);
 return [value,b];
});
ssControls.push(()=>{
 const el=ssSel(),acts=el?ssObjActions(el):[];
 for(const [v,b] of ssActionBtns){
  const supported=el?.dataset?.soundActions?.split(',');
  b.hidden=supported?!supported.includes(v):el?.dataset?.soundAction?v!==el.dataset.soundAction:(['click','insert','cut','peel','putIn','pageTurn','water','hover'].includes(v));
  b.setAttribute('aria-pressed',v===ssState.action?'true':'false');
  b.dataset.has=acts.includes(v)?'true':'false';
 }
});

/* variant list */
const ssVariantList=ssEl('div',{});
const ssVariantEmpty=ssEl('div',{class:'ls-empty'},'Nema zvukova za ovu radnju. Dodaj jedan iz biblioteke ili prevuci audio fajl ovde.');
function ssRenderVariants(){
 const el=ssSel();
 if(!el){ssVariantList.replaceChildren(ssVariantEmpty);return;}
 const vars=ssVariants(el,ssState.action);
 if(!vars.length){ssVariantList.replaceChildren(ssVariantEmpty);return;}
 ssVariantList.replaceChildren(...vars.map((key,i)=>{
  const row=ssEl('div',{class:'ss-variant'+(ssIsPlaying(key)?' is-playing':'')});
  const name=ssEl('span',{class:'ls-item-n'},ssAudioName(key));
  const play=ssEl('button',{type:'button',class:'ss-preview-btn'+(ssIsPlaying(key)?' is-playing':''),title:'Preslusaj','aria-label':'Preslusaj '+ssAudioName(key),html:lsIcon(ssIsPlaying(key)?'pause':'play')});
  play.onclick=()=>{if(ssIsPlaying(key))ssStop();else ssPreview(key,ssVolume());ssSync();ssRenderVariants();};
  const del=lsIconBtn('trash','Ukloni zvuk',()=>{ssRemoveVariant(i);});
  row.append(name,play,del);
  return row;
 }));
}

/* add/remove variants */
function ssAddVariant(key){
 if(!key||isLibrarySoundDeleted(key))return;
 const el=ssSel();if(!el)return;
 const k=ssObjKey(el),record=ensureSoundActionRecord(k);
 const draft=record.actions[ssState.action]||{...ssConfig(el,ssState.action),variants:[...ssVariants(el,ssState.action)]};
 if(!draft.variants)draft.variants=[];
 if(!draft.variants.includes(key))draft.variants.push(key);
 record.actions[ssState.action]=draft;
 impactSounds[k]=record;
 persistImpactSounds();
 ssRenderVariants();ssRenderObjList();ssSync();
 ssFlash(`Dodat: ${ssAudioName(key)}`);
}
function ssRemoveVariant(index){
 const el=ssSel();if(!el)return;
 const k=ssObjKey(el),record=ensureSoundActionRecord(k);
 const draft=record.actions[ssState.action]||{...ssConfig(el,ssState.action),variants:[...ssVariants(el,ssState.action)]};
 record.actions[ssState.action]=draft;
 draft.variants.splice(index,1);
 impactSounds[k]=record;
 persistImpactSounds();
 ssRenderVariants();ssRenderObjList();ssSync();
}
function ssClearAllSounds(){
 const el=ssSel();if(!el)return;
 delete impactSounds[ssObjKey(el)];
 persistImpactSounds();
 ssRenderVariants();ssRenderObjList();ssSync();
 ssFlash('Svi zvukovi su obrisani za ovaj predmet.');
}
function ssCopyToSame(){
 const el=ssSel();if(!el?.dataset.itemId)return;
 const src=impactSounds[ssObjKey(el)];if(!src)return;
 const same=ssSceneItems().filter(x=>x!==el&&x.dataset.itemId===el.dataset.itemId);
 let n=0;
 for(const x of same){impactSounds[ssObjKey(x)]=JSON.parse(JSON.stringify(src));n++;}
 persistImpactSounds();ssRenderObjList();
 ssFlash(n?`Kopirano na ${n} istih.`:'Nema drugih istih predmeta.');
}

/* volume/delay/cooldown */
function ssVolume(){
 const el=ssSel();if(!el)return .58;
 return +(ssConfig(el,ssState.action).volume??.58);
}
const ssSliders={};
for(const [label,key,min,max,step,hint] of [
 ['Jačina','volume',0,1,.02,'Glasnoća zvuka pri kontaktu'],
 ['Kašnjenje','delay',-.5,.5,.01,'Negativno = pre kontakta, pozitivno = posle'],
 ['Min. razmak','cooldown',0,1,.01,'Najkraće vreme između dva zvuka (sek)']
]){
 const slider=lsSlider(label,{
  get:()=>{const el=ssSel();if(!el)return null;return ssConfig(el,ssState.action)[key];},
  set:v=>{const el=ssSel();if(!el)return;const k=ssObjKey(el),record=ensureSoundActionRecord(k);const draft=record.actions[ssState.action]||{...ssConfig(el,ssState.action),variants:[...ssVariants(el,ssState.action)]};draft[key]=v;record.actions[ssState.action]=draft;impactSounds[k]=record;persistImpactSounds();},
  min,max,step,def:SOUND_DEFAULTS[key],
  disabled:()=>!ssSel()||!ssVariants(ssSel(),ssState.action).length,
  hint,domain:'sun'
 });
 ssSliders[key]=slider;
}

/* add from library button */
const ssAddBtn=lsBtn('Dodaj zvuk',()=>{ssState.libOpen=!ssState.libOpen;ssRenderLibInline();ssSync();},{icon:'plus'});
ssControls.push(()=>{ssAddBtn.classList.toggle('is-on',ssState.libOpen);lsSetBtnLabel(ssAddBtn,ssState.libOpen?'Zatvori listu':'Dodaj zvuk');});
const ssLibInline=ssEl('div',{});
function ssRenderLibInline(){
 if(!ssState.libOpen){ssLibInline.replaceChildren();return;}
 const allKeys=[...Object.keys(SFX),...Object.keys(importedAudio).map(id=>'custom:'+id)].filter(key=>!isLibrarySoundDeleted(key));
 const existing=ssSel()?ssVariants(ssSel(),ssState.action):[];
 ssLibInline.replaceChildren(...allKeys.filter(k=>!existing.includes(k)).map(key=>{
  const row=ssEl('div',{class:'ss-lib-row'});
  const name=ssEl('span',{},ssAudioName(key));
  const play=ssEl('button',{type:'button',class:'ss-preview-btn',title:'Preslusaj',html:lsIcon('play')});
  play.onclick=e=>{e.stopPropagation();ssPreview(key,.6);};
  row.onclick=()=>{ssAddVariant(key);ssState.libOpen=false;ssRenderLibInline();ssSync();};
  row.append(name,play);
  return row;
 }),allKeys.length<=existing.length?ssEl('p',{class:'ls-note'},'Svi zvukovi su već dodati.'):null);
}

/* drop zone for variants */
const ssDropZone=ssEl('div',{class:'ss-drop'},'Prevuci audio fajl ovde ili klikni da uvezej');
const ssDropInput=ssEl('input',{type:'file',accept:'audio/*',multiple:true,hidden:true});
ssDropZone.onclick=()=>ssDropInput.click();
ssDropZone.addEventListener('dragover',e=>{e.preventDefault();ssDropZone.classList.add('ss-drag-over');});
ssDropZone.addEventListener('dragleave',()=>ssDropZone.classList.remove('ss-drag-over'));
ssDropZone.addEventListener('drop',e=>{e.preventDefault();ssDropZone.classList.remove('ss-drag-over');ssImportFiles(e.dataTransfer.files);});
ssDropInput.addEventListener('change',()=>{ssImportFiles(ssDropInput.files);ssDropInput.value='';});

async function ssImportFiles(fileList){
 const files=[...(fileList||[])];if(!files.length)return;
 let added=0;
 for(const file of files){
  const src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||''));r.onerror=()=>rej();r.readAsDataURL(file);});
  const id='snd_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
  importedAudio[id]={name:file.name.replace(/\.[^.]+$/,''),src};
  try{localStorage.setItem(AUDIO_LIBRARY_KEY,JSON.stringify(importedAudio));added++;}
  catch(_){delete importedAudio[id];ssFlash('Nema mesta u pregledaču. Obriši stare zvukove.');break;}
  if(ssSel())ssAddVariant('custom:'+id);
 }
 ssRenderLibTab();ssRenderObjList();ssSync();
 if(added)ssFlash(`Uvezeno ${added} ${added===1?'zvuk':added<5?'zvuka':'zvukova'}.`);
}

/* delete button */
const ssDeleteBtn=lsConfirmBtn('Obriši sve zvukove','Sigurno?',()=>ssClearAllSounds(),{icon:'trash'});
ssControls.push(()=>{ssDeleteBtn.disabled=!ssSel()||!ssHasAnySound(ssSel());});
const ssCopyBtn=lsBtn('Na sve iste',()=>ssCopyToSame(),{icon:'dup'});
ssControls.push(()=>{const el=ssSel();const n=el?.dataset.itemId?ssSceneItems().filter(x=>x!==el&&x.dataset.itemId===el.dataset.itemId).length:0;ssCopyBtn.disabled=n<1||!ssHasAnySound(el);lsSetBtnLabel(ssCopyBtn,n>0?`Na sve iste (${n})`:'Na sve iste');});

/* preview all button */
const ssPreviewAll=lsBtn('Preslusaj',()=>{const el=ssSel();if(!el)return;playImpactSound(el,ssState.action);ssSync();ssRenderVariants();},{icon:'play'});
ssPreviewAll.dataset.soundPreview='1';
ssControls.push(()=>{ssPreviewAll.disabled=!ssSel()||!ssVariants(ssSel(),ssState.action).length;});

/* assemble inspector */
ssInspector.append(
 ssActionBar,
 ssVariantList,
 ssEl('div',{class:'ls-btns',style:'margin:4px 0'},ssAddBtn,ssPreviewAll),
 ssLibInline,
 ssDropZone,
 ssEl('div',{class:'ls-sub'},'Podešavanja'),
 ssSliders.volume,ssSliders.delay,ssSliders.cooldown,
 ssEl('div',{class:'ls-btns',style:'margin:10px 0 4px'},ssCopyBtn,ssDeleteBtn)
);

ssPanes.objekti.append(
 lsSection('ssobjlist','Predmeti','sun',
  ssEl('div',{style:'display:grid;grid-template-columns:1fr;gap:6px;margin:2px 0 4px'},ssPickBtn),
  ssObjList,ssObjCard,ssInspector
 )
);

/* --- tab: Biblioteka --- */
const ssLibSearch=ssEl('input',{type:'search',class:'ls-input',placeholder:'Traži zvuk…','aria-label':'Traži zvuk'});
ssLibSearch.addEventListener('input',()=>{ssState.libQuery=ssLibSearch.value.trim().toLowerCase();ssRenderLibTab();});
const ssLibList=ssEl('div',{class:'ls-list',style:'max-height:360px'});
const ssLibDrop=ssEl('div',{class:'ss-drop'},'Prevuci audio fajl ovde ili klikni');
const ssLibInput=ssEl('input',{type:'file',accept:'audio/*',multiple:true,hidden:true});
ssLibDrop.onclick=()=>ssLibInput.click();
ssLibDrop.addEventListener('dragover',e=>{e.preventDefault();ssLibDrop.classList.add('ss-drag-over');});
ssLibDrop.addEventListener('dragleave',()=>ssLibDrop.classList.remove('ss-drag-over'));
ssLibDrop.addEventListener('drop',e=>{e.preventDefault();ssLibDrop.classList.remove('ss-drag-over');ssImportFiles(e.dataTransfer.files);});
ssLibInput.addEventListener('change',()=>{ssImportFiles(ssLibInput.files);ssLibInput.value='';});

const ssStorageInfo=ssEl('div',{class:'ss-storage'});
function ssRenderStorage(){
 try{
  const total=JSON.stringify(importedAudio).length;
  const count=Object.keys(importedAudio).length;
  const kb=Math.round(total/1024);
  ssStorageInfo.innerHTML=`<small>${count} ${count===1?'uvezeni zvuk':count<5?'uvezena zvuka':'uvezenih zvukova'} · ${kb} KB u pregledaču</small>`;
 }catch(_){ssStorageInfo.innerHTML='<small>Greška pri čitanju.</small>';}
}

function ssRenderLibTab(){
 const q=ssState.libQuery;
 const builtIn=Object.keys(SFX).filter(k=>!isLibrarySoundDeleted(k)).map(k=>({key:k,name:k,custom:false}));
 const custom=Object.keys(importedAudio).map(id=>({key:'custom:'+id,name:ssAudioName('custom:'+id),custom:true,id}));
 const all=[...builtIn,...custom].filter(x=>!q||x.name.toLowerCase().includes(q));
 ssLibList.replaceChildren(...all.map(item=>{
  const row=ssEl('div',{class:'ss-lib-row'});
  const name=ssEl('span',{},item.name+(item.custom?' ✦':''));
  const play=ssEl('button',{type:'button',class:'ss-preview-btn'+(ssIsPlaying(item.key)?' is-playing':''),title:'Preslusaj',html:lsIcon(ssIsPlaying(item.key)?'pause':'play')});
  play.onclick=e=>{e.stopPropagation();if(ssIsPlaying(item.key))ssStop();else ssPreview(item.key,.6);ssSync();ssRenderLibTab();};
  row.append(name,play);
  const del=lsConfirmBtn('Obriši','Potvrdi',()=>ssDeleteFromLib(item.key),{icon:'trash'});
  del.title='Briše zvuk iz biblioteke i uklanja ga iz svih radnji koje ga koriste.';
  del.setAttribute('aria-label','Obriši zvuk '+item.name+' iz biblioteke');
  del.addEventListener('click',e=>e.stopPropagation());
  row.appendChild(del);
  if(ssSel()){
   row.style.cursor='pointer';
   row.onclick=()=>{ssAddVariant(item.key);ssFlash(`Dodat "${item.name}" za ${ssObjLabel(ssSel())} → ${SS_ACTIONS.find(a=>a[0]===ssState.action)?.[1]||ssState.action}.`);};
  }
  return row;
 }),all.length===0?ssEl('p',{class:'ls-note'},q?'Nema rezultata.':'Biblioteka je prazna.'):null);
 ssRenderStorage();
}

function ssDeleteFromLib(key){
 const result=commitLibraryRemoval([key]);
 if(!result){ssFlash('Brisanje nije sačuvano. Zvuk nije obrisan. Proveri prostor/dozvole pregledača.');return;}
 const used=result.used;
 ssRenderLibTab();ssRenderLibInline();ssRenderObjList();ssRenderVariants();ssSync();
 ssFlash(used?`Zvuk obrisan i uklonjen iz ${used} radnji.`:'Zvuk obrisan iz biblioteke.');
}

const ssExportBtn=lsBtn('Izvezi sve zvukove',()=>{
 const data={impactSounds,importedAudio,deletedSounds:[...deletedLibrarySounds]};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download=`cookster-sounds-${new Date().toISOString().slice(0,10)}.json`;a.click();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 ssFlash('JSON je izvezen.');
});
const ssImportBtn=lsBtn('Uvezi JSON',()=>ssImportJsonInput.click());
const ssImportJsonInput=ssEl('input',{type:'file',accept:'.json',hidden:true});
ssImportJsonInput.addEventListener('change',()=>{
 const file=ssImportJsonInput.files?.[0];if(!file)return;
 const r=new FileReader();r.onload=()=>{
  try{
   const data=JSON.parse(String(r.result||''));
   if(data.importedAudio&&typeof data.importedAudio==='object'){
    let n=0;
    for(const [id,v] of Object.entries(data.importedAudio)){if(!importedAudio[id]){importedAudio[id]=v;n++;}}
    try{localStorage.setItem(AUDIO_LIBRARY_KEY,JSON.stringify(importedAudio));}catch(_){}
    ssFlash(`Uvezeno ${n} novih zvukova.`);
   }
   if(data.impactSounds&&typeof data.impactSounds==='object'){
    let n=0;
    for(const [key,record] of Object.entries(data.impactSounds)){
     if(!impactSounds[key]){impactSounds[key]=record;n++;}
    }
    persistImpactSounds();
    ssFlash(`Podešeno ${n} predmeta.`);
   }
   if(Array.isArray(data.deletedSounds)){
    for(const key of data.deletedSounds){
     if(typeof key!=='string'||!Object.hasOwn(SFX,key))continue;
     deletedLibrarySounds.add(key);removeSoundReferences(key);
    }
    persistDeletedLibrarySounds();persistImpactSounds();
   }
  }catch(_){ssFlash('Neispravan JSON fajl.');}
  ssRenderLibTab();ssRenderLibInline();ssRenderObjList();ssRenderVariants();ssSync();
 };r.readAsText(file);
});

const ssClearLib=lsConfirmBtn('Obriši sve uvezene','Sigurno? Briše sve custom zvukove.',()=>{
 const result=commitLibraryRemoval(Object.keys(importedAudio).map(id=>'custom:'+id));
 if(!result){ssFlash('Brisanje nije sačuvano. Zvukovi nisu obrisani.');return;}
 ssRenderLibTab();ssRenderLibInline();ssRenderObjList();ssRenderVariants();ssSync();
 ssFlash('Svi uvezeni zvukovi su obrisani.');
},{icon:'trash'});

ssPanes.biblioteka.append(
 lsSection('sslib','Svi zvukovi','sun',
  ssLibSearch,ssLibList,ssLibDrop,ssEl('div',{class:'ls-btns',style:'margin:8px 0'},ssExportBtn,ssImportBtn,ssImportJsonInput,ssClearLib),
  ssStorageInfo
 )
);

/* --- render orchestration --- */
function ssRender(){
 if(!ssState.open)return;
 ssRenderObjList();ssRenderObjCard();ssRenderVariants();ssSync();
 if(ssState.tab==='biblioteka')ssRenderLibTab();
}

/* --- external hook: when gameplay clicks an item --- */
const _origLoadSoundEditor=typeof loadSoundEditor==='function'?loadSoundEditor:null;
function loadSoundEditor(el,clientX,clientY){
 ssSelectItem(el);
}

/* --- lifecycle --- */
function ssOnOpen(){ssSetTab(ssState.tab);ssRender();}
function ssOnClose(){ssStop();selectingSoundItem=false;soundToolActive=false;}

setInterval(()=>{
 if(!ssState.open)return;
 if(ssState.tab==='objekti'&&ssSceneItems().length!==ssObjCount)ssRenderObjList();
},600);

/* event isolation */
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','wheel'])soundPanel.addEventListener(type,e=>e.stopPropagation());
document.body.appendChild(soundPanel);
/* ========================= end sound studio ========================= */
const elementImportPanel=document.createElement('details');Object.assign(elementImportPanel.style,{position:'fixed',right:'122px',top:'50%',transform:'translateY(-50%)',zIndex:'13000',width:'340px',maxWidth:'calc(100vw - 28px)',maxHeight:'64vh',overflow:'auto',padding:'12px 14px',borderRadius:'14px',background:'#fff4db',border:'3px solid #3b241a',boxShadow:'5px 7px 0 #3b241a',color:'#442819',font:'700 13px/1.35 system-ui,sans-serif'});
elementImportPanel.className='cookster-editor-panel';elementImportPanel.id='elementImportPanel';
const elementImportSummary=document.createElement('summary');elementImportSummary.textContent='🧩 UI elementi';elementImportSummary.style.cssText='cursor:pointer;font-weight:950;font-size:16px;user-select:none;color:#442819';elementImportPanel.appendChild(elementImportSummary);
let uiPanelDrag=null,uiPanelDragged=false;
elementImportSummary.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 const r=elementImportPanel.getBoundingClientRect();
 uiPanelDrag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,left:r.left,top:r.top};
 elementImportSummary.setPointerCapture(e.pointerId);
});
elementImportSummary.addEventListener('pointermove',e=>{
 if(!uiPanelDrag||e.pointerId!==uiPanelDrag.pointerId)return;
 const dx=e.clientX-uiPanelDrag.startX,dy=e.clientY-uiPanelDrag.startY;
 if(Math.hypot(dx,dy)<4&&!uiPanelDragged)return;
 uiPanelDragged=true;e.preventDefault();e.stopPropagation();
 elementImportPanel.style.right='auto';elementImportPanel.style.transform='none';
 elementImportPanel.style.left=Math.max(0,Math.min(innerWidth-elementImportPanel.offsetWidth,uiPanelDrag.left+dx))+'px';
 elementImportPanel.style.top=Math.max(0,Math.min(innerHeight-32,uiPanelDrag.top+dy))+'px';
});
const finishUiPanelDrag=e=>{if(uiPanelDrag?.pointerId===e.pointerId)uiPanelDrag=null;};
elementImportSummary.addEventListener('pointerup',finishUiPanelDrag);
elementImportSummary.addEventListener('pointercancel',finishUiPanelDrag);
elementImportSummary.addEventListener('click',e=>{
 if(!uiPanelDragged)return;
 e.preventDefault();e.stopPropagation();uiPanelDragged=false;
},true);
const elementImportIntro=document.createElement('p');elementImportIntro.textContent='Zaseban UI sloj: prevuci element za pomeranje i poravnaj ga po linijama. Desni klik menja redosled layera; Alt pri prevlačenju isključuje lepljenje.';elementImportIntro.style.cssText='margin:8px 0 10px;color:#694331;font-weight:600';elementImportPanel.appendChild(elementImportIntro);
const elementImportStatus=document.createElement('div');elementImportStatus.style.cssText='margin:8px 0;padding:8px;border-radius:8px;background:#f4dbab;color:#442819;font-weight:800';elementImportPanel.appendChild(elementImportStatus);
function elementImportButton(label,primary=false){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText=`padding:9px 11px;border:2px solid #3b241a;border-radius:9px;background:${primary?'#e8b94f':'#f4dbab'};color:#442819;cursor:pointer;font-weight:900;box-shadow:0 2px 0 #3b241a`;return b;}
const elementImportList=document.createElement('div');elementImportList.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:9px 0';elementImportPanel.appendChild(elementImportList);
const elementInstanceList=document.createElement('div');elementInstanceList.style.cssText='display:flex;flex-wrap:wrap;gap:5px;margin:8px 0';elementImportPanel.appendChild(elementInstanceList);
let selectedImportedElementId='';
// These images are screen-space overlays. They never enter scene/items,
// kitchen equipment, surface placement, collision or perspective pipelines.
const uiElementLayer=document.createElement('div');
uiElementLayer.id='uiElementLayer';
uiElementLayer.style.cssText='position:fixed;left:0;top:0;width:1672px;height:941px;transform-origin:0 0;pointer-events:none;z-index:11000;overflow:hidden';
const uiGuideLayer=document.createElement('div');
uiGuideLayer.id='uiGuideLayer';
uiGuideLayer.style.cssText='position:absolute;inset:0;pointer-events:none;display:none;z-index:10000';
const uiGuides=[
 ...[.25,.5,.75].map((fraction,i)=>({axis:'x',value:BASE_W*fraction,label:['¼','CENTAR','¾'][i]})),
 {axis:'y',value:BASE_H/2,label:'SREDINA VISINE'}
];
for(const guide of uiGuides){
 const line=document.createElement('div');line.className='ui-alignment-guide';
 line.dataset.axis=guide.axis;line.dataset.value=String(guide.value);
 line.style.cssText=`position:absolute;${guide.axis==='x'?`left:${guide.value}px;top:0;width:1px;height:100%`:`top:${guide.value}px;left:0;height:1px;width:100%`};background:rgba(42,243,230,.48);pointer-events:none`;
 const tag=document.createElement('span');tag.textContent=guide.label;
 tag.style.cssText=`position:absolute;${guide.axis==='x'?'top:12px;left:4px':'top:4px;left:12px'};white-space:nowrap;padding:2px 5px;border-radius:3px;background:#104c4d;color:white;font:700 12px system-ui`;
 line.appendChild(tag);guide.line=line;uiGuideLayer.appendChild(line);
}
uiElementLayer.appendChild(uiGuideLayer);document.body.appendChild(uiElementLayer);
let uiElementDrag=null;
const uiLayerMenu=document.createElement('div');
uiLayerMenu.id='uiLayerMenu';
uiLayerMenu.style.cssText='display:none;position:fixed;z-index:15000;padding:5px;background:#fff5df;border:2px solid #3b241a;border-radius:9px;box-shadow:0 5px 16px #0007;min-width:135px';
document.body.appendChild(uiLayerMenu);
function closeUiLayerMenu(){uiLayerMenu.style.display='none';}
document.addEventListener('pointerdown',e=>{if(!uiLayerMenu.contains(e.target))closeUiLayerMenu();},true);
function updateUiOverlayViewport(){
 const s=Math.min(innerWidth/BASE_W,innerHeight/BASE_H);
 uiElementLayer.style.left=((innerWidth-BASE_W*s)/2)+'px';
 uiElementLayer.style.top=((innerHeight-BASE_H*s)/2)+'px';
 uiElementLayer.style.transform=`scale(${s})`;
}
function uiElementPoint(e){
 const r=uiElementLayer.getBoundingClientRect();
 return {x:(e.clientX-r.left)/r.width*BASE_W,y:(e.clientY-r.top)/r.height*BASE_H};
}
function updateUiTransformFields(record){
 if(selectedImportedElementId!==record.id)return;
 for(const [key,field] of Object.entries(elementTransformFields)){
  field.range.value=String(record[key]);field.number.value=String(Math.round(record[key]*100)/100);
 }
}
function changeUiLayer(record,direction){
 const visible=importedElements.filter(x=>x.visible).sort((a,b)=>(+a.z||0)-(+b.z||0));
 const index=visible.indexOf(record),other=visible[index+direction];
 if(!other)return;
 const z=record.z;record.z=other.z;other.z=z;
 renderUiElement(record);renderUiElement(other);persistImportedElements();renderElementImportList();
}
function openUiLayerMenu(e,record){
 e.preventDefault();e.stopPropagation();selectedImportedElementId=record.id;
 renderElementImportList();syncImportedElementTransform();uiLayerMenu.replaceChildren();
 for(const [label,direction] of [['Layer ispred',1],['Layer iza',-1]]){
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.style.cssText='display:block;width:100%;text-align:left;padding:8px;border:0;border-radius:5px;background:transparent;color:#3b241a;font:700 13px system-ui;cursor:pointer';
  b.onclick=event=>{event.preventDefault();event.stopPropagation();changeUiLayer(record,direction);closeUiLayerMenu();};
  uiLayerMenu.appendChild(b);
 }
 uiLayerMenu.style.left=Math.min(e.clientX,innerWidth-155)+'px';
 uiLayerMenu.style.top=Math.min(e.clientY,innerHeight-95)+'px';
 uiLayerMenu.style.display='block';
}
function renderUiElement(record){
 let el=uiElementLayer.querySelector(`[data-ui-element-id="${record.id}"]`);
 if(!record.visible){el?.remove();return null;}
  const lockedBottomTray=isLockedBottomTray(record);
 if(!el){
  el=document.createElement('img');el.className='ui-overlay-element';el.dataset.uiElementId=record.id;
  el.src=record.src;el.alt=record.label;el.draggable=false;
    el.style.cssText='position:absolute;display:block;object-fit:contain;pointer-events:auto;touch-action:none;user-select:none;cursor:grab;transform-origin:50% 100%;filter:none;box-shadow:none';
  for(const type of ['mousedown','mousemove','mouseup','click','dblclick'])
   el.addEventListener(type,e=>e.stopPropagation());
  el.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();},{passive:false});
  el.addEventListener('pointerdown',e=>{
    if(isLockedBottomTray(record)){e.preventDefault();e.stopPropagation();return;}
   e.stopPropagation();if(e.button!==0)return;
   e.preventDefault();closeUiLayerMenu();selectedImportedElementId=record.id;
   renderElementImportList();syncImportedElementTransform();
   const p=uiElementPoint(e);
   uiElementDrag={id:record.id,pointerId:e.pointerId,dx:record.x-p.x,dy:record.y-p.y};
   el.setPointerCapture(e.pointerId);el.style.cursor='grabbing';uiGuideLayer.style.display='block';
  });
  el.addEventListener('pointermove',e=>{
   e.stopPropagation();
   if(!uiElementDrag||uiElementDrag.id!==record.id||uiElementDrag.pointerId!==e.pointerId)return;
   e.preventDefault();
   const p=uiElementPoint(e),threshold=14;
   let x=p.x+uiElementDrag.dx,y=p.y+uiElementDrag.dy;
   const nearX=uiGuides.filter(g=>g.axis==='x').find(g=>Math.abs(x-g.value)<=threshold);
   const centerY=y-(+record.h||140)/2;
   const nearY=uiGuides.find(g=>g.axis==='y'&&Math.abs(centerY-g.value)<=threshold);
   for(const guide of uiGuides){
    const active=!e.altKey&&(guide===nearX||guide===nearY);
    guide.line.style.background=active?'#27ffed':'rgba(42,243,230,.48)';
    guide.line.style.boxShadow=active?'0 0 0 1px #103a43,0 0 7px #27ffed':'none';
   }
   if(!e.altKey){if(nearX)x=nearX.value;if(nearY)y=nearY.value+(+record.h||140)/2;}
    // Keep a part of even an oversized element reachable at every screen edge.
    // x is its center and y its bottom anchor, so the allowed range expands
    // with the element instead of being locked to the base scene dimensions.
    const w=+record.w||180,h=+record.h||140;
    record.x=Math.round(Math.max(-w/2,Math.min(BASE_W+w/2,x)));
    record.y=Math.round(Math.max(0,Math.min(BASE_H+h,y)));
   renderUiElement(record);updateUiTransformFields(record);persistImportedElements();
  });
  const finish=e=>{
   e.stopPropagation();
   if(!uiElementDrag||uiElementDrag.pointerId!==e.pointerId)return;
   e.preventDefault();uiElementDrag=null;uiGuideLayer.style.display='none';el.style.cursor='grab';
   persistImportedElements();
  };
  el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);
  el.addEventListener('contextmenu',e=>openUiLayerMenu(e,record));
  uiElementLayer.insertBefore(el,uiGuideLayer);
 }
  el.dataset.lockedBottomTray=lockedBottomTray?'true':'false';
  el.style.pointerEvents=lockedBottomTray?'none':'auto';
  el.style.cursor=lockedBottomTray?'default':'grab';
 el.style.left=((+record.x||0)-(+record.w||180)/2)+'px';
 el.style.top=((+record.y||0)-(+record.h||140))+'px';
 el.style.width=(+record.w||180)+'px';el.style.height=(+record.h||140)+'px';
 el.style.transform=`rotate(${+record.angle||0}deg)`;
 el.style.zIndex=String(+record.z||1);
 return el;
}
const elementTransform=document.createElement('section');elementTransform.style.cssText='display:none;margin-top:12px;padding:10px;border:2px solid #b99562;border-radius:10px;background:#fffaf0';
const elementTransformTitle=document.createElement('strong');elementTransformTitle.textContent='Transformacija elementa';
const elementTransformHint=document.createElement('div');elementTransformHint.style.cssText='margin:5px 0 8px;color:#694331;font-weight:600;font-size:12px';
const elementTransformRows=document.createElement('div');const elementTransformFields={};
function selectedImportedElement(){return (typeof importedElements!=='undefined'?importedElements:[]).find(x=>x.id===selectedImportedElementId)||null;}
function liveImportedElement(id){return uiElementLayer.querySelector(`[data-ui-element-id="${id}"]`);}
function elementTransformRow(label,key,min,max,step){
 const row=document.createElement('label');row.style.cssText='display:grid;grid-template-columns:74px 1fr 62px;gap:6px;align-items:center;margin:6px 0';
 const text=document.createElement('span');text.textContent=label;
 const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.step=step;
 const number=document.createElement('input');number.type='number';number.min=min;number.max=max;number.step=step;number.style.cssText='width:58px;padding:4px;box-sizing:border-box';
 const commit=raw=>{const value=Math.max(+min,Math.min(+max,+raw||0));range.value=String(value);number.value=String(Math.round(value*100)/100);applyImportedElementTransform(key,value);};
 range.oninput=()=>commit(range.value);number.oninput=()=>commit(number.value);
 row.append(text,range,number);elementTransformRows.appendChild(row);elementTransformFields[key]={range,number};return row;
}
 elementTransformRow('Širina','w',20,1200,1);elementTransformRow('Visina','h',20,1000,1);elementTransformRow('Rotacija','angle',-180,180,1);
function persistImportedElements(){
 try{
  const layout=importedElements.map(({id,typeId,x,y,w,h,angle,z,legacyInstanceId})=>({id,typeId,x,y,w,h,angle,z,legacyInstanceId}));
  localStorage.setItem(IMPORTED_ELEMENT_KEY,JSON.stringify(layout));
  return true;
 }
 catch(error){elementImportStatus.textContent='Položaj nije mogao da se sačuva u browseru.';return false;}
}
function syncImportedElementTransform(){
 const record=selectedImportedElement();if(!record){elementTransform.style.display='none';return;}
 const el=liveImportedElement(record.id);
 updateUiTransformFields(record);
 elementTransform.style.display='block';elementTransformHint.textContent=el?'Menjaš samo ovu kopiju na ekranu.':'Izaberi kopiju iz liste.';
 persistImportedElements();
}
function applyImportedElementTransform(key,value){
 const record=selectedImportedElement();if(!record)return;record[key]=value;
 renderUiElement(record);persistImportedElements();
}
const placeImportedElement=elementImportButton('Dodaj još jednu kopiju',true),removeImportedElement=elementImportButton('Ukloni ovu kopiju'),shrinkImportedElement=elementImportButton('−10%'),growImportedElement=elementImportButton('+10%'),resetImportedElement=elementImportButton('Vrati veličinu');
function placeUiElement(def,pose={}){
 if(!def)return null;
 const copies=importedElements.filter(x=>x.typeId===def.id).length;
 const record={id:'ui_instance_'+crypto.randomUUID(),typeId:def.id,label:def.label,src:def.src,
  originalW:def.w,originalH:def.h,x:pose.x??(BASE_W/2+copies*24),y:pose.y??(BASE_H/2+def.h/2+copies*24),
  w:pose.w??def.w,h:pose.h??def.h,angle:pose.angle??0,
  z:Math.max(0,...importedElements.map(x=>+x.z||0))+1,visible:true,
  legacyInstanceId:pose.legacyInstanceId||''};
 importedElements.push(record);selectedImportedElementId=record.id;
 renderUiElement(record);persistImportedElements();renderElementImportList();syncImportedElementTransform();return record;
}
placeImportedElement.onclick=()=>{const record=selectedImportedElement();if(!record)return;placeUiElement(BUILTIN_UI_ELEMENT_DEFS.find(x=>x.id===record.typeId));elementImportStatus.textContent='Dodata je još jedna nezavisna kopija.';};
removeImportedElement.onclick=()=>{const record=selectedImportedElement();if(!record)return;if(uiElementDrag?.id===record.id){uiElementDrag=null;uiGuideLayer.style.display='none';}record.visible=false;renderUiElement(record);importedElements.splice(importedElements.indexOf(record),1);selectedImportedElementId='';persistImportedElements();syncImportedElementTransform();renderElementImportList();elementImportStatus.textContent='Uklonjena je samo ova kopija.';};
function scaleImportedElement(factor){const record=selectedImportedElement();if(!record)return;record.w=Math.max(20,Math.min(1200,(+record.w||180)*factor));record.h=Math.max(20,Math.min(1000,(+record.h||140)*factor));applyImportedElementTransform('w',record.w);applyImportedElementTransform('h',record.h);syncImportedElementTransform();}
shrinkImportedElement.onclick=()=>scaleImportedElement(.9);growImportedElement.onclick=()=>scaleImportedElement(1.1);resetImportedElement.onclick=()=>{const record=selectedImportedElement();if(!record)return;record.w=+record.originalW||180;record.h=+record.originalH||140;record.angle=0;applyImportedElementTransform('w',record.w);applyImportedElementTransform('h',record.h);applyImportedElementTransform('angle',0);syncImportedElementTransform();};
const elementTransformButtons=document.createElement('div');elementTransformButtons.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:8px';elementTransformButtons.append(placeImportedElement,removeImportedElement,shrinkImportedElement,growImportedElement,resetImportedElement);
elementTransform.append(elementTransformTitle,elementTransformHint,elementTransformRows,elementTransformButtons);elementImportPanel.appendChild(elementTransform);
const exportImportedElements=elementImportButton('Izvezi JSON',true);const elementJsonOutput=document.createElement('textarea');elementJsonOutput.readOnly=true;elementJsonOutput.placeholder='Ovde će se prikazati koordinate i dimenzije.';elementJsonOutput.style.cssText='display:none;width:100%;height:150px;margin-top:8px;padding:7px;box-sizing:border-box;resize:vertical;border:2px solid #b99562;border-radius:8px;background:#fff;color:#332117;font:12px/1.35 monospace';
exportImportedElements.onclick=()=>{
 const payload={version:2,coordinateSystem:{width:BASE_W,height:BASE_H,origin:'top-left',position:'x=center, y=bottom',space:'screen'},elements:importedElements.map(record=>({id:record.id,typeId:record.typeId,label:record.label,x:Math.round(+record.x||0),y:Math.round(+record.y||0),width:Math.round(+record.w||180),height:Math.round(+record.h||140),rotation:+record.angle||0,layer:+record.z||1}))};
 const json=JSON.stringify(payload,null,2);elementJsonOutput.value=json;elementJsonOutput.style.display='block';
 const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cookster-elementi-koordinate.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);elementImportStatus.textContent='JSON je izvezen i prikazan ispod dugmeta.';
};
elementImportPanel.append(exportImportedElements,elementJsonOutput);
function renderElementImportList(){
 const records=BUILTIN_UI_ELEMENT_DEFS;
 elementImportList.replaceChildren();
 records.forEach(record=>{
  const card=document.createElement('button');card.type='button';card.style.cssText='display:grid;grid-template-rows:72px auto;gap:5px;align-items:center;width:100%;min-width:0;padding:7px;background:#f4dbab;border:2px solid #b99562;border-radius:9px;cursor:pointer';
  const preview=document.createElement('span');preview.style.cssText='position:relative;display:grid;place-items:center;width:100%;height:72px;overflow:hidden;border-radius:6px;background:#fffaf0';
  const thumb=document.createElement('img');thumb.src=record.src;thumb.alt='';thumb.style.cssText='display:block;max-width:100%;max-height:68px;object-fit:contain';
  const onScene=document.createElement('i');onScene.textContent='+ DODAJ';onScene.style.cssText='position:absolute;right:3px;bottom:3px;padding:2px 5px;border-radius:4px;background:#3b241a;color:#fff;font:800 9px system-ui;font-style:normal';
  const label=document.createElement('span');label.textContent=record.label;label.style.cssText='display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;font:800 11px/1.2 system-ui;color:#442819';
  preview.append(thumb,onScene);card.append(preview,label);card.onclick=()=>{
   placeUiElement(record);
   elementImportStatus.textContent=`Dodata kopija: ${record.label}.`;
  };elementImportList.appendChild(card);
 });
 elementInstanceList.replaceChildren();
 const title=document.createElement('strong');title.textContent=`Na ekranu: ${importedElements.length} · izaberi kopiju`;title.style.cssText='width:100%';elementInstanceList.appendChild(title);
 importedElements.forEach((record,i)=>{
  const b=elementImportButton(`${i+1}. ${record.label} · layer ${record.z}`);
   if(isLockedBottomTray(record)){
    b.disabled=true;
    b.title='Ova donja traka je fiksirana na mestu.';
   }
  if(record.id===selectedImportedElementId)b.style.background='#ffe18a';
  b.style.cssText+=';font-size:11px;padding:5px';
  b.onclick=()=>{selectedImportedElementId=record.id;renderElementImportList();syncImportedElementTransform();};
  elementInstanceList.appendChild(b);
 });
}
for(const type of ['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','wheel'])elementImportPanel.addEventListener(type,e=>e.stopPropagation());document.body.appendChild(elementImportPanel);elementImportPanel.style.display='none';
function toggleToolPanel(panel){
 const opening=panel.style.display==='none'||!panel.open;
 for(const other of (window.__cooksterToolPanels||[lightPanel,soundPanel,elementImportPanel]))if(other!==panel){other.open=false;if(other!==sceneCalibrationPanel)other.style.display='none';}
 panel.style.display=opening?'block':'none';
 panel.open=opening;
 if(opening&&panel===elementImportPanel){elementImportStatus.textContent='Izaberi jedan od 8 ugrađenih UI elemenata.';renderElementImportList();syncImportedElementTransform();}
}
function makeUtilityPanel(title,bodyText){const p=document.createElement('details');Object.assign(p.style,{position:'fixed',right:'122px',top:'50%',transform:'translateY(-50%)',zIndex:'13000',width:'300px',maxWidth:'calc(100vw - 28px)',maxHeight:'45vh',overflow:'auto',padding:'9px 11px',borderRadius:'12px',background:'rgba(38,23,14,.93)',border:'1px solid rgba(255,237,195,.48)',boxShadow:'0 5px 18px rgba(20,10,4,.34)',color:'#fff3d0',font:'600 12px/1.2 system-ui,sans-serif'});const s=document.createElement('summary');s.textContent=title;s.style.cssText='cursor:pointer;font-weight:800;font-size:14px';p.append(s,document.createTextNode(bodyText));document.body.appendChild(p);return p;}
const sceneCalibrationPanel=makeUtilityPanel('Калибрација сцена','Овде се подешавају површине и зоне сцене. Користи постојећи режим калибрације; зумирање је доступно скролом.');sceneCalibrationPanel.id='sceneCalibrationPanel';sceneCalibrationPanel.style.display='none';
Object.assign(sceneCalibrationPanel.style,{top:'92px',transform:'none'});
/* Perspective Calibration Tool v1 — editor is input-isolated.
   It selects item TYPES from a dropdown; it never captures gameplay scene clicks. */
const PERSPECTIVE_MASTER_KEY='cookster.object-perspective-master.v1';
const PERSPECTIVE_MASTER_IMPORT_KEY='cookster.object-perspective-import.v1';
const PERSPECTIVE_CORR_DEFAULT=Object.freeze({
 tableScale:1,tableAngle:0,tableTilt:0,
 stoveScale:1,stoveAngle:0,stoveTilt:0,
 floorScale:1,floorAngle:0,floorTilt:0
});

const perspectiveCorrections={};
const MASTER_PERSPECTIVE_CALIBRATION={"daska":{"points":{"table":[{"x":843.225,"y":558.431,"scale":1,"angle":0.4,"tilt":19.7},{"x":483.2,"y":568.302,"scale":1,"angle":-2.6,"tilt":22.3},{"x":1152.299,"y":558.927,"scale":1,"angle":2.6,"tilt":24.7},{"x":848.998,"y":323.672,"scale":0.95,"angle":0,"tilt":27.8},{"x":1134.201,"y":324.427,"scale":0.95,"angle":4.2,"tilt":27.8}],"stove":[{"x":1505.538,"y":380.675,"scale":1,"angle":8,"tilt":36.8},{"x":1315.684,"y":338.887,"scale":1,"angle":4.8,"tilt":37}],"floor":[{"x":290.002,"y":433.564,"scale":0.805,"angle":-1.6,"tilt":35.4},{"x":352.364,"y":871.898,"scale":0.83,"angle":-1.6,"tilt":5.5},{"x":839.138,"y":823.02,"scale":0.83,"angle":0,"tilt":5.5},{"x":1528.495,"y":858.214,"scale":0.83,"angle":7.3,"tilt":5.5}]}},"kal_02_duboki_tanjir":{"points":{"table":[{"x":532.125,"y":321.925,"scale":1,"angle":-2.6,"tilt":8.7},{"x":1153.617,"y":555.651,"scale":1,"angle":1.2,"tilt":2.6},{"x":854.367,"y":487.527,"scale":1,"angle":-0.8,"tilt":2.6},{"x":487.252,"y":569.315,"scale":1,"angle":-2.8,"tilt":2.6}],"stove":[{"x":1498.412,"y":386.969,"scale":0.94,"angle":3.5,"tilt":22.8},{"x":1306.532,"y":319.859,"scale":0.94,"angle":3.5,"tilt":22.8}],"floor":[{"x":282.203,"y":452.571,"scale":0.845,"angle":-2.3,"tilt":8.7},{"x":364.823,"y":897.996,"scale":0.94,"angle":-2.3,"tilt":-0.8},{"x":1514.045,"y":909.893,"scale":0.94,"angle":0.9,"tilt":-0.8}]}},"tiganj_mali":{"points":{"table":[{"x":831.948,"y":586.297,"scale":1,"angle":8,"tilt":21.3},{"x":461.794,"y":602.245,"scale":1,"angle":3.9,"tilt":21.3},{"x":517.066,"y":356.861,"scale":0.92,"angle":3.9,"tilt":26.4},{"x":1148.687,"y":340.396,"scale":0.92,"angle":13.1,"tilt":26.4},{"x":1159.39,"y":560.953,"scale":1,"angle":13.1,"tilt":21.5},{"x":851.767,"y":354.08,"scale":0.92,"angle":8,"tilt":21.3}],"stove":[{"x":1478.019,"y":407.744,"scale":1,"angle":20.9,"tilt":27.6},{"x":1320.578,"y":389.254,"scale":1,"angle":19.8,"tilt":27.6}],"floor":[{"x":298.105,"y":481.171,"scale":0.765,"angle":1.6,"tilt":-2.4},{"x":302.731,"y":897.221,"scale":0.765,"angle":1.6,"tilt":-2.4},{"x":1517.792,"y":873.666,"scale":0.765,"angle":17.5,"tilt":-2.4}]}},"kanta_otvorena":{"points":{"table":[],"stove":[],"floor":[{"x":173.552,"y":452.592,"scale":2.225,"angle":-5.7,"tilt":22.8},{"x":1546.629,"y":901.056,"scale":1.915,"angle":4.1,"tilt":16.5}]}},"kal_01_flasa_ulja":{"points":{"table":[{"x":869.426,"y":563,"scale":1.43,"angle":0,"tilt":-0.8},{"x":1004.718,"y":280.137,"scale":1.155,"angle":0,"tilt":-0.8},{"x":441.097,"y":566.535,"scale":1.43,"angle":-1.1,"tilt":-0.8},{"x":1199.333,"y":564.25,"scale":1.43,"angle":2,"tilt":-0.8}],"stove":[{"x":1621.28,"y":367.486,"scale":1.325,"angle":4.1,"tilt":-0.8},{"x":1263.281,"y":290.246,"scale":1.185,"angle":4.1,"tilt":-0.8}],"floor":[]}},"kal_01_dzezva":{"points":{"table":[{"x":841.065,"y":556.922,"scale":1,"angle":0.5,"tilt":0},{"x":1208.314,"y":549.573,"scale":1,"angle":2.4,"tilt":0},{"x":1180.526,"y":285.957,"scale":0.855,"angle":2.4,"tilt":0},{"x":497.381,"y":283.672,"scale":0.855,"angle":-0.8,"tilt":0},{"x":463.516,"y":554.876,"scale":0.975,"angle":-0.8,"tilt":0}],"stove":[{"x":1507.394,"y":361.15,"scale":0.925,"angle":4.8,"tilt":0},{"x":1357.043,"y":334.556,"scale":0.9,"angle":4.7,"tilt":0}],"floor":[{"x":290.002,"y":429.512,"scale":0.78,"angle":0.8,"tilt":0},{"x":273.356,"y":889.118,"scale":0.78,"angle":0,"tilt":0},{"x":1562.361,"y":828.085,"scale":0.78,"angle":5,"tilt":0}]}},"kal_01_dzak_brasna":{"points":{"table":[{"x":836,"y":554.896,"scale":1,"angle":0,"tilt":0},{"x":875.065,"y":312.551,"scale":0.865,"angle":0,"tilt":0},{"x":1145.074,"y":294.06,"scale":0.865,"angle":2.4,"tilt":0},{"x":1176.036,"y":549.057,"scale":0.995,"angle":2.4,"tilt":0},{"x":466.554,"y":562.979,"scale":0.995,"angle":0.7,"tilt":0},{"x":514.735,"y":293.285,"scale":0.845,"angle":0.7,"tilt":0}],"stove":[{"x":1591.735,"y":375.311,"scale":0.85,"angle":2.5,"tilt":0}],"floor":[{"x":209.408,"y":421.667,"scale":0.845,"angle":0,"tilt":0},{"x":274.808,"y":876.208,"scale":0.845,"angle":0,"tilt":0},{"x":1541.529,"y":876.963,"scale":0.845,"angle":1.7,"tilt":0}]}},"kal_01_hleb":{"points":{"table":[{"x":820.806,"y":554.896,"scale":1,"angle":0,"tilt":0},{"x":1120.191,"y":322.68,"scale":0.84,"angle":1,"tilt":0},{"x":524.156,"y":311.279,"scale":0.84,"angle":-1.8,"tilt":0},{"x":466.994,"y":561.212,"scale":0.925,"angle":-1.8,"tilt":0},{"x":1170.532,"y":558.927,"scale":0.925,"angle":1.6,"tilt":0}],"stove":[{"x":1521.575,"y":378.37,"scale":0.865,"angle":4.5,"tilt":0},{"x":1321.591,"y":317.337,"scale":0.77,"angle":2.6,"tilt":0}],"floor":[{"x":257.589,"y":420.396,"scale":0.715,"angle":-1.9,"tilt":0},{"x":289.563,"y":887.092,"scale":0.755,"angle":0.1,"tilt":0},{"x":1553.244,"y":869.614,"scale":0.785,"angle":2.8,"tilt":0}]}},"lavor_emajl_veliki":{"points":{"table":[{"x":833.974,"y":558.948,"scale":0.87,"angle":0,"tilt":0.8},{"x":836.574,"y":338.887,"scale":0.73,"angle":0,"tilt":0.8},{"x":516.053,"y":313.305,"scale":0.73,"angle":-2,"tilt":0.8},{"x":472.058,"y":567.289,"scale":0.83,"angle":-2,"tilt":0.8},{"x":1156.351,"y":563.992,"scale":0.83,"angle":0.6,"tilt":0.8},{"x":1139.705,"y":329.75,"scale":0.735,"angle":0.6,"tilt":0.8}],"stove":[{"x":1506.955,"y":382.163,"scale":0.735,"angle":2.3,"tilt":2.4},{"x":1333.307,"y":317.078,"scale":0.65,"angle":1.6,"tilt":2.4}],"floor":[{"x":262.214,"y":440.396,"scale":0.65,"angle":-2.3,"tilt":2.4},{"x":302.292,"y":898.989,"scale":0.715,"angle":-1.8,"tilt":-21.3},{"x":1539.637,"y":884.55,"scale":0.715,"angle":1.2,"tilt":-21.3}]}},"serpa_velika":{"points":{"table":[{"x":1133.932,"y":310.267,"scale":0.9,"angle":5,"tilt":18.1},{"x":515.614,"y":307.982,"scale":0.9,"angle":-0.4,"tilt":18.1},{"x":480.735,"y":568.044,"scale":1.035,"angle":-0.4,"tilt":18.1},{"x":832.791,"y":570.824,"scale":1.035,"angle":0,"tilt":18.1},{"x":1167.628,"y":558.411,"scale":1.035,"angle":1.8,"tilt":18.1}],"stove":[{"x":1483.254,"y":387.765,"scale":1,"angle":5.5,"tilt":18.1},{"x":1336.955,"y":356.106,"scale":1,"angle":5.5,"tilt":18.1}],"floor":[{"x":1545.006,"y":799.227,"scale":1.035,"angle":3.8,"tilt":-2.4},{"x":855.784,"y":796.943,"scale":1.035,"angle":1.1,"tilt":-2.4},{"x":274.943,"y":867.588,"scale":1.035,"angle":-1.4,"tilt":-2.4},{"x":255.258,"y":442.918,"scale":0.765,"angle":-2.5,"tilt":-2.4}]}},"kal_02_cinija_velika":{"points":{"table":[{"x":836,"y":545.78,"scale":1,"angle":0,"tilt":-2.4},{"x":484.079,"y":550.586,"scale":1,"angle":0,"tilt":-2.4},{"x":522.13,"y":295.073,"scale":0.87,"angle":-0.7,"tilt":-2.4},{"x":1145.648,"y":307.982,"scale":0.87,"angle":1.7,"tilt":-2.4},{"x":1173.571,"y":543.734,"scale":0.98,"angle":1.7,"tilt":-2.4}],"stove":[{"x":1515.193,"y":376.582,"scale":0.87,"angle":1.5,"tilt":-2.4},{"x":1328.377,"y":334.794,"scale":0.835,"angle":1.5,"tilt":-2.4}],"floor":[{"x":253.403,"y":434.08,"scale":0.83,"angle":-1.2,"tilt":-2.4},{"x":279.299,"y":904.828,"scale":0.87,"angle":0,"tilt":-2.4},{"x":1543.994,"y":865.066,"scale":0.87,"angle":1.6,"tilt":-2.4}]}},"kal_01_solja_kafe":{"points":{"table":[{"x":836,"y":545.78,"scale":1,"angle":0,"tilt":0},{"x":847.716,"y":294.318,"scale":0.91,"angle":0,"tilt":0},{"x":497.82,"y":282.918,"scale":0.91,"angle":-1.6,"tilt":0},{"x":1171.984,"y":289.75,"scale":0.91,"angle":2.5,"tilt":0},{"x":1199.906,"y":553.863,"scale":1,"angle":2.5,"tilt":0},{"x":441.805,"y":562.721,"scale":1,"angle":-1.4,"tilt":0}],"stove":[],"floor":[]}},"kal_01_pravougaoni_pleh":{"points":{"table":[{"x":831.948,"y":561.987,"scale":1,"angle":0,"tilt":0},{"x":850.755,"y":322.68,"scale":0.9,"angle":0,"tilt":0},{"x":519.091,"y":308.241,"scale":0.9,"angle":-2.9,"tilt":0},{"x":1136.532,"y":317.099,"scale":0.9,"angle":2,"tilt":0},{"x":1155.338,"y":565.005,"scale":1,"angle":2,"tilt":0},{"x":485.361,"y":576.902,"scale":1,"angle":-2.1,"tilt":0}],"stove":[{"x":1524.174,"y":398.37,"scale":0.955,"angle":8.7,"tilt":0},{"x":1334.32,"y":329.233,"scale":0.895,"angle":8.7,"tilt":0},{"x":256.925,"y":447.711,"scale":0.835,"angle":-4.8,"tilt":0},{"x":287.088,"y":893.597,"scale":1.015,"angle":-4.8,"tilt":0},{"x":1539.913,"y":894.413,"scale":1.015,"angle":4.1,"tilt":0}],"floor":[]}},"tiganj_veliki":{"points":{"table":[{"x":808.36,"y":583.973,"scale":1,"angle":0,"tilt":13.4},{"x":810.651,"y":356.642,"scale":0.855,"angle":0,"tilt":13.4},{"x":1141.66,"y":350.218,"scale":0.855,"angle":0,"tilt":16.8},{"x":508.711,"y":348.021,"scale":0.855,"angle":-6.8,"tilt":16.8},{"x":470.837,"y":588.928,"scale":0.965,"angle":-6.8,"tilt":16.8},{"x":1165.444,"y":586.732,"scale":0.965,"angle":1.6,"tilt":16.8}],"stove":[{"x":1492.226,"y":414.363,"scale":0.93,"angle":8.9,"tilt":22.8},{"x":1326.458,"y":385.742,"scale":0.93,"angle":5,"tilt":22.8}],"floor":[{"x":272.834,"y":460.705,"scale":0.825,"angle":-8,"tilt":19.7},{"x":294.15,"y":900.323,"scale":0.825,"angle":-8.8,"tilt":-5.5},{"x":1555.295,"y":899.183,"scale":0.825,"angle":1.6,"tilt":-5.5}]}},"lampa_stona":{"points":{"table":[{"x":814.702,"y":560.72,"scale":1.035,"angle":1.1,"tilt":0},{"x":455.509,"y":561.695,"scale":1.035,"angle":0.4,"tilt":0},{"x":1199.794,"y":562.669,"scale":1.035,"angle":1.7,"tilt":0},{"x":1172.489,"y":283.546,"scale":0.895,"angle":2.6,"tilt":0},{"x":493.033,"y":276.065,"scale":0.895,"angle":0.3,"tilt":0}],"stove":[],"floor":[]}},"metla":{"points":{"table":[],"stove":[],"floor":[{"x":298.9,"y":422.257,"scale":1.43,"angle":0,"tilt":0},{"x":299.077,"y":912.609,"scale":1.625,"angle":0,"tilt":0},{"x":1529.569,"y":900.9,"scale":1.625,"angle":2.8,"tilt":0},{"x":877.594,"y":916.672,"scale":1.625,"angle":2.8,"tilt":0}]}},"kal_01_okrugli_pleh":{"points":{"table":[{"x":814.702,"y":566.005,"scale":1,"angle":0,"tilt":0},{"x":827.563,"y":329.161,"scale":0.865,"angle":0,"tilt":0},{"x":524.389,"y":322.737,"scale":0.865,"angle":-1.8,"tilt":0},{"x":471.717,"y":569.985,"scale":0.965,"angle":-1.8,"tilt":0},{"x":1145.185,"y":563.561,"scale":0.965,"angle":2.9,"tilt":0},{"x":1135.849,"y":327.774,"scale":0.865,"angle":2.9,"tilt":0}],"stove":[{"x":1497.51,"y":393.224,"scale":0.865,"angle":4.1,"tilt":0}],"floor":[{"x":242.005,"y":460.787,"scale":0.78,"angle":-1.7,"tilt":0},{"x":290.803,"y":913.089,"scale":0.84,"angle":-1.7,"tilt":-2.4},{"x":1542.434,"y":896.095,"scale":0.84,"angle":2.5,"tilt":-2.4}]}},"kal_02_oklagija":{"points":{"table":[{"x":839.013,"y":551.207,"scale":1.205,"angle":0,"tilt":0},{"x":842.36,"y":282.654,"scale":1.045,"angle":0,"tilt":0}],"stove":[],"floor":[{"x":249.576,"y":453.801,"scale":1.045,"angle":-1.6,"tilt":11.8}]}},"kal_02_tanjir_ravni":{"points":{"table":[{"x":815.759,"y":553.321,"scale":1,"angle":-0.3,"tilt":0},{"x":832.848,"y":312.249,"scale":0.905,"angle":-0.3,"tilt":0},{"x":528.617,"y":311.11,"scale":0.905,"angle":-2.2,"tilt":0},{"x":1145.008,"y":305.742,"scale":0.905,"angle":2,"tilt":0},{"x":1165.267,"y":552.991,"scale":1,"angle":2,"tilt":0},{"x":471.014,"y":565.593,"scale":1,"angle":-2.1,"tilt":0}],"stove":[{"x":1509.668,"y":384.521,"scale":0.975,"angle":3.2,"tilt":13.4},{"x":1326.989,"y":330.533,"scale":0.975,"angle":3.2,"tilt":13.4}],"floor":[{"x":259.797,"y":435.503,"scale":0.86,"angle":-2.7,"tilt":0},{"x":286.398,"y":906.83,"scale":0.975,"angle":-2.7,"tilt":-0.8},{"x":1562.339,"y":889.836,"scale":0.975,"angle":1.1,"tilt":-0.8}]}},"vangla_srednja":{"points":{"table":[{"x":819.987,"y":553.321,"scale":1,"angle":0,"tilt":7.1},{"x":823.335,"y":312.249,"scale":0.88,"angle":0,"tilt":7.1},{"x":1156.458,"y":306.882,"scale":0.88,"angle":2.6,"tilt":7.1},{"x":507.654,"y":304.686,"scale":0.88,"angle":-3,"tilt":7.1},{"x":458.153,"y":563.561,"scale":0.995,"angle":-3,"tilt":7.1},{"x":1174.957,"y":553.966,"scale":0.995,"angle":1.6,"tilt":7.1}],"stove":[{"x":1514.422,"y":380.54,"scale":0.995,"angle":5.1,"tilt":7.1},{"x":1326.458,"y":333.951,"scale":0.95,"angle":4.5,"tilt":7.1}],"floor":[{"x":258.036,"y":440.623,"scale":0.81,"angle":-3.4,"tilt":7.1},{"x":260.327,"y":904.551,"scale":0.915,"angle":-3.4,"tilt":-1.3},{"x":1577.491,"y":894.955,"scale":0.915,"angle":1.6,"tilt":-1.3}]}},"kal_01_tegla_velika":{"points":{"table":[],"stove":[],"floor":[{"x":160.437,"y":391.605,"scale":0.84,"angle":-2,"tilt":15},{"x":252.57,"y":877.729,"scale":0.87,"angle":-2,"tilt":7.1},{"x":1569.734,"y":861.792,"scale":0.855,"angle":1,"tilt":7.1}]}},"kal_01_tegla_mala":{"points":{"table":[],"stove":[],"floor":[{"x":153.038,"y":394.776,"scale":0.855,"angle":-0.9,"tilt":15},{"x":251.513,"y":895.698,"scale":0.9,"angle":-1.2,"tilt":0.8},{"x":1591.93,"y":903.014,"scale":0.9,"angle":1.3,"tilt":0.8}]}},"bokal_stari":{"points":{"table":[{"x":837.956,"y":579.746,"scale":1,"angle":-0.6,"tilt":1.4},{"x":915.291,"y":302.737,"scale":0.86,"angle":-0.6,"tilt":1.4},{"x":501.135,"y":310.053,"scale":0.86,"angle":-2.8,"tilt":1.4},{"x":1177.774,"y":308.913,"scale":0.86,"angle":0.2,"tilt":1.4},{"x":1196.977,"y":581.53,"scale":0.97,"angle":-0.4,"tilt":1.4},{"x":459.387,"y":584.618,"scale":0.97,"angle":-2.2,"tilt":1.4}],"stove":[],"floor":[{"x":264.024,"y":438.674,"scale":0.85,"angle":-2.2,"tilt":0.8},{"x":278.999,"y":906.83,"scale":0.875,"angle":-2.2,"tilt":-3.9},{"x":1560.226,"y":914.146,"scale":0.875,"angle":-0.4,"tilt":-3.9}]}},"hoklica":{"points":{"table":[],"stove":[],"floor":[{"x":269.305,"y":448.681,"scale":0.935,"angle":-2.9,"tilt":0},{"x":1532.563,"y":815.368,"scale":1.045,"angle":0.2,"tilt":0},{"x":292.912,"y":916.755,"scale":1.035,"angle":-2.9,"tilt":-8.7}]}}};
// Embedded profiles are defaults; saved editor calibrations override them.
const importedPerspectiveMaster=window.__COOKSTER_OBJECT_PERSPECTIVE_MASTER__;
const importedPerspectiveItems=importedPerspectiveMaster?.items&&typeof importedPerspectiveMaster.items==='object'
 ? importedPerspectiveMaster.items : {};
const importedPerspectiveOverrides={};
for(const [id,entry] of Object.entries(importedPerspectiveItems)){
 const embedded=MASTER_PERSPECTIVE_CALIBRATION[id]?.points;
 if(!embedded||JSON.stringify(entry?.points||{})!==JSON.stringify(embedded))
  importedPerspectiveOverrides[id]=entry;
}
const perspectiveMasterDefaults={...MASTER_PERSPECTIVE_CALIBRATION,...importedPerspectiveOverrides};
const effectiveMasterItems={};
for(const [id,cfg] of Object.entries(perspectiveMasterDefaults)){
 effectiveMasterItems[id]={
   itemId:id,
   label:id,
   points:{
     table:Array.isArray(cfg?.points?.table)?cfg.points.table:[],
     stove:Array.isArray(cfg?.points?.stove)?cfg.points.stove:[],
     floor:Array.isArray(cfg?.points?.floor)?cfg.points.floor:[]
   }
 };
}
try{
 const saved=JSON.parse(localStorage.getItem(PERSPECTIVE_MASTER_KEY)||'null');
 if(saved?.items&&typeof saved.items==='object'){
  for(const [id,entry] of Object.entries(saved.items)){
   if(!id||!entry||typeof entry!=='object')continue;
   const base=effectiveMasterItems[id]?.points||{table:[],stove:[],floor:[]};
   const points={};
   for(const surface of ['table','stove','floor']){
    const incoming=entry.points?.[surface];
    const source=Array.isArray(incoming)?incoming:(base[surface]||[]);
    points[surface]=source.filter(p=>
      p&&p.x!==null&&p.x!==undefined&&p.y!==null&&p.y!==undefined&&
      Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))
    ).map(p=>({
      x:Number(p.x),
      y:Number(p.y),
      scale:Number.isFinite(Number(p.scale))?Math.max(.3,Math.min(2.5,Number(p.scale))):1,
      angle:Number.isFinite(Number(p.angle))?Math.max(-180,Math.min(180,Number(p.angle))):0,
      tilt:Number.isFinite(Number(p.tilt))?Math.max(-89,Math.min(89,Number(p.tilt))):0
    }));
   }
   effectiveMasterItems[id]={
     itemId:id,
     label:String(entry.label||effectiveMasterItems[id]?.label||id),
     points
   };
  }
 }
}catch(error){
 console.warn('Could not load saved object perspective calibration.',error);
}
try{
 if(Object.keys(importedPerspectiveOverrides).length&&localStorage.getItem(PERSPECTIVE_MASTER_IMPORT_KEY)!=='done'){
  for(const [id,entry] of Object.entries(importedPerspectiveOverrides)){
   if(!id||!entry||typeof entry!=='object')continue;
   const points={};
   for(const surface of ['table','stove','floor']){
    const incoming=entry.points?.[surface];
    points[surface]=(Array.isArray(incoming)?incoming:[]).filter(p=>
      p&&p.x!==null&&p.x!==undefined&&p.y!==null&&p.y!==undefined&&
      Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))
    ).map(p=>({
      x:Number(p.x),
      y:Number(p.y),
      scale:Number.isFinite(Number(p.scale))?Math.max(.3,Math.min(2.5,Number(p.scale))):1,
      angle:Number.isFinite(Number(p.angle))?Math.max(-180,Math.min(180,Number(p.angle))):0,
      tilt:Number.isFinite(Number(p.tilt))?Math.max(-89,Math.min(89,Number(p.tilt))):0
    }));
   }
   effectiveMasterItems[id]={itemId:id,label:String(entry.label||id),points};
  }
  localStorage.setItem(PERSPECTIVE_MASTER_KEY,JSON.stringify({
    version:1,tool:'cookster-object-perspective-calibration',exportedAt:new Date().toISOString(),
    count:Object.keys(effectiveMasterItems).length,items:effectiveMasterItems
  }));
  localStorage.setItem(PERSPECTIVE_MASTER_IMPORT_KEY,'done');
 }
}catch(error){
 console.warn('Could not import supplied object perspective calibration.',error);
}
for(const [id,data] of Object.entries(effectiveMasterItems)){
 perspectiveCorrections[id]={
   ...PERSPECTIVE_CORR_DEFAULT,
   ...(perspectiveCorrections[id]||{}),
   points:data.points
 };
}


function perspectiveCorrectionRaw(el,zone){
 const z=zone==='board'?'table':zone;
 const id=el?.dataset?.itemId||'';
 const cfg={...PERSPECTIVE_CORR_DEFAULT,...(perspectiveCorrections[id]||{})};
 const prefix=z==='stove'?'stove':z==='floor'?'floor':'table';
 const base={scale:+cfg[prefix+'Scale']||1,angle:+cfg[prefix+'Angle']||0,tilt:+cfg[prefix+'Tilt']||0};
 const pts=Array.isArray(cfg.points?.[prefix])?cfg.points[prefix]:[];
 if(!pts.length)return base;
 // The calibrated points give a SMOOTH tilt of the surface (a plane fitted through them), not a pull towards each point:
 // an item that is carried over the scene changes size and angle gradually, with no jumps near the points.
 const f=perspectivePlane(pts);
 const x=+el?.dataset?.cx||0,y=+el?.dataset?.by||0;
 return {scale:f.scale(x,y),angle:f.angle(x,y),tilt:f.tilt(x,y)};
}
const perspectivePlaneCache=new WeakMap();
function perspectivePlane(pts){
 const cached=perspectivePlaneCache.get(pts);
 if(cached&&cached.n===pts.length)return cached;
 const def={scale:1,angle:0,tilt:0},n=pts.length,keys=['scale','angle','tilt'],fit={n};
 for(const k of keys){
  const vs=pts.map(p=>{const v=+p[k];return Number.isFinite(v)&&(k!=='scale'||v>0)?v:def[k];});
  const mean=vs.reduce((a,b)=>a+b,0)/n,lo=Math.min(...vs),hi=Math.max(...vs),span=hi-lo;
  // least squares plane v = mean + b*(u-mu) + c*(w-mw), u,w = position / (520, 360); slopes are pulled slightly towards 0
  let sU=0,sW=0,sUU=0,sUW=0,sWW=0,sUV=0,sWV=0;
  for(let i=0;i<n;i++){
   const u=(+pts[i].x||0)/520,w=(+pts[i].y||0)/360,v=vs[i];
   sU+=u;sW+=w;sUU+=u*u;sUW+=u*w;sWW+=w*w;sUV+=u*v;sWV+=w*v;
  }
  const mu=sU/n,mw=sW/n,ridge=.08*n;
  const cUU=sUU-n*mu*mu+ridge,cUW=sUW-n*mu*mw,cWW=sWW-n*mw*mw+ridge,cUV=sUV-n*mu*mean,cWV=sWV-n*mw*mean;
  const det=cUU*cWW-cUW*cUW;
  let b=0,c=0;
  if(n>=3&&Math.abs(det)>1e-9){b=(cUV*cWW-cUW*cWV)/det;c=(cUU*cWV-cUW*cUV)/det;}
  const min=lo-span*.12,max=hi+span*.12;
  fit[k]=(x,y)=>Math.max(min,Math.min(max,mean+b*(x/520-mu)+c*(y/360-mw)));
 }
 perspectivePlaneCache.set(pts,fit);
 return fit;
}

lightPanel.style.display='none';
window.__cooksterToolPanels=[lightPanel,soundPanel,elementImportPanel,sceneCalibrationPanel];
for(const p of window.__cooksterToolPanels)p.open=false;
// Remove the old top HUD controls that were occupying the empty margins.
document.getElementById('day')?.parentElement?.style && (document.getElementById('day').parentElement.style.display='none');
for(const node of document.querySelectorAll('button,div')){const t=(node.textContent||'').trim();if((t==='Zone'||/^Dan\s*\d+/.test(t))&&!node.closest('details')&&!node.closest('[aria-label="Алати"]'))node.style.display='none';}
// One compact launcher contains every editor tool and keeps the scene clear.
const toolDock=document.createElement('div');toolDock.setAttribute('aria-label','Алати');Object.assign(toolDock.style,{position:'fixed',left:'50%',top:'48px',transform:'translateX(-50%)',display:'none',flexDirection:'column',gap:'4px',width:'210px',padding:'7px',border:'1px solid #777',borderRadius:'3px',background:'#f2f2f2',boxShadow:'0 5px 18px rgba(0,0,0,.28)',pointerEvents:'auto',zIndex:'13000'});
function dockButton(label,tip,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=tip;b.style.cssText='pointer-events:auto;min-width:118px;height:28px;padding:2px 10px;border-radius:2px;border:1px solid #8a8a8a;background:#f3f3f3;color:#1d1d1d;font:400 12px "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:none;text-align:left';b.onclick=action;return b;}
const soundDockButton=dockButton('звук','Звук студио',()=>toggleToolPanel(soundPanel));
const elementImportDockButton=dockButton('UI elementi','Izaberi i namesti ugrađene UI elemente',()=>toggleToolPanel(elementImportPanel));
// v24: Cloud "Svetlost i senke" editor disabled by request.
const lightDockButton=document.createElement('button');
lightDockButton.type='button';
lightDockButton.style.display='none';
lightDockButton.hidden=true;
const sceneDockButton=dockButton('калибрација сцене','Површине, препреке и зоне сцене',()=>{const toggle=document.getElementById('sceneCalibrationToggleBtn');if(toggle&&!document.body.classList.contains('scene-zone-calibration-active'))toggle.click();const b=document.getElementById('sceneZoneCalibrationBtn');if(b)b.click();const r=document.getElementById('sceneZoneCalibration');if(r){r.style.display='block';r.classList.add('open');}sceneCalibrationPanel.style.display='block';sceneCalibrationPanel.open=true;window.CooksterCalibrationView?.reset?.();});

/* ==========================================================================
   Object Perspective Calibration Lab v2
   Lazy-created on first open so gameplay constants and equipment definitions
   are fully initialized before the editor touches them.
   ========================================================================== */
let perspectiveLabV2=null;
const PERSPECTIVE_CALIBRATION_LOCKED=false;
function openPerspectiveLabV2(){
  if(PERSPECTIVE_CALIBRATION_LOCKED)return false;
  if(!perspectiveLabV2)perspectiveLabV2=createPerspectiveLabV2();
  perspectiveLabV2.open();
  return true;
}
function createPerspectiveLabV2(){
  const state={
    copies:[],selected:null,seq:0,itemId:'',surface:'table',
    applied:JSON.parse(JSON.stringify(typeof effectiveMasterItems!=='undefined'?effectiveMasterItems:{}))
  };

  const panel=document.createElement('div');
  panel.id='perspectiveLabV2';
  panel.className='cookster-editor-panel';
  Object.assign(panel.style,{
    position:'fixed',left:'10px',bottom:'10px',right:'auto',top:'auto',zIndex:'13150',width:'305px',
    maxHeight:'46vh',overflow:'auto',display:'none',
    padding:'8px',pointerEvents:'auto'
  });

  const title=document.createElement('div');
  title.textContent='Калибрација предмета';
  title.style.cssText='font-weight:700;font-size:14px;margin-bottom:8px';

  const itemSel=document.createElement('select');
  itemSel.style.cssText='width:100%;height:30px;margin-bottom:6px';

  const surfaceSel=document.createElement('select');
  surfaceSel.style.cssText='width:100%;height:30px;margin-bottom:7px';
  [['table','Сто'],['stove','Шпорет'],['floor','Под']].forEach(([v,t])=>{
    const o=document.createElement('option');o.value=v;o.textContent=t;surfaceSel.appendChild(o);
  });

  const status=document.createElement('div');
  status.style.cssText='font-size:11px;line-height:1.35;padding:6px;background:#fff;border:1px solid #aaa;margin-bottom:7px';

  const rows={};
  function makeRow(label,key,min,max,step){
    const row=document.createElement('label');
    row.style.cssText='display:grid;grid-template-columns:90px 1fr 64px;gap:6px;align-items:center;margin:6px 0';
    const n=document.createElement('span');n.textContent=label;
    const range=document.createElement('input');
    range.type='range';range.min=min;range.max=max;range.step=step;
    const num=document.createElement('input');
    num.type='number';num.min=min;num.max=max;num.step=step;
    num.style.cssText='width:60px;box-sizing:border-box';
    const commit=raw=>{
      const c=state.selected;if(!c)return;
      const v=Math.max(+min,Math.min(+max,Number(raw)));
      if(!Number.isFinite(v))return;
      c[key]=v;range.value=String(v);num.value=String(v);
      renderCopy(c);syncStatus();
    };
    range.oninput=()=>commit(range.value);
    num.oninput=()=>commit(num.value);
    row.append(n,range,num);
    rows[key]={range,num};
    return row;
  }

  const scaleRow=makeRow('Величина','scale',0.30,2.50,0.005);
  const angleRow=makeRow('Ротација','angle',-180,180,0.1);
  const tiltRow=makeRow('Нагиб','tilt',-89,89,0.1);

  const pointList=document.createElement('div');
  pointList.style.cssText='display:flex;flex-wrap:wrap;gap:4px;max-height:100px;overflow:auto;padding:5px;border:1px solid #bbb;background:#fafafa;margin:7px 0';

  const buttonGrid=document.createElement('div');
  buttonGrid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:5px';
  const mkBtn=t=>{const b=document.createElement('button');b.type='button';b.textContent=t;return b;};
  const copyBtn=mkBtn('Копирај');
  const delBtn=mkBtn('Обриши копију');
  const clearBtn=mkBtn('Обриши све');
  const resetItemBtn=mkBtn('Ресетуј предмет');
  const applyBtn=mkBtn('Примени у игру');
  const exportBtn=mkBtn('Извези JSON');
  const closeBtn=mkBtn('Затвори');
  buttonGrid.append(copyBtn,delBtn,clearBtn,resetItemBtn,applyBtn,exportBtn,closeBtn);

  const output=document.createElement('textarea');
  output.spellcheck=false;
  output.placeholder='JSON ће се појавити овде.';
  output.style.cssText='width:100%;height:120px;resize:vertical;margin-top:7px;font:11px/1.3 monospace;box-sizing:border-box';

  const hint=document.createElement('div');
  hint.style.cssText='font-size:11px;color:#555!important;border-top:1px solid #bbb;margin-top:7px;padding-top:7px;line-height:1.35';
  hint.textContent='Тул аутоматски препознаје сто, шпорет или под. При избору предмета учитава све његове постојеће master тачке. „Ресетуј предмет“ брише само тај предмет. „Примени у игру“ чува измену трајно; „Извези JSON“ прави финални master.';

  panel.append(title,itemSel,surfaceSel,status,scaleRow,angleRow,tiltRow,pointList,buttonGrid,output,hint);
  document.body.appendChild(panel);

  for(const type of ['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','click','dblclick','contextmenu','wheel'])
    panel.addEventListener(type,e=>e.stopPropagation());

  function defs(){
    const list=(typeof KITCHEN_EQUIPMENT!=='undefined'&&Array.isArray(KITCHEN_EQUIPMENT))
      ? KITCHEN_EQUIPMENT.slice()
      : [];

    const calibrationOnly=(typeof CooksterCatalog!=='undefined'&&Array.isArray(CooksterCatalog.CALIBRATION_ONLY_ITEMS))
      ? CooksterCatalog.CALIBRATION_ONLY_ITEMS
      : [];
    list.push(...calibrationOnly);

    // Daska is a core scene item rather than a KITCHEN_EQUIPMENT entry.
    // Derive a calibration definition from the live board so it appears in this tool.
    const boardEl=(typeof items!=='undefined'&&Array.isArray(items))
      ? items.find(el=>el?.dataset?.itemId==='daska')
      : null;
    if(boardEl&&!list.some(d=>d?.id==='daska')){
      const body=boardEl.querySelector?.('img.body,img');
      list.push({
        id:'daska',
        label:boardEl.dataset.label||'Daska',
        src:body?.getAttribute?.('src')||body?.src||'',
        w:+boardEl.dataset.baseW||boardEl.offsetWidth||220,
        h:+boardEl.dataset.baseH||boardEl.offsetHeight||120,
        angle:+boardEl.dataset.angle||0,
        tilt:+boardEl.dataset.tilt||0,
        snapProfile:boardEl.dataset.snapProfile||'board',
        shadowProfile:boardEl.dataset.shadowProfile||''
      });
    }

    // Any other object that is in the scene (a new thing that is not in the catalog yet) is listed too, so every new item can be calibrated.
    // Vegetables and fruit have a new id every time, they are calibrated through their catalog entries instead.
    if(typeof items!=='undefined'&&Array.isArray(items)){
      for(const el of items){
        const id=el?.dataset?.itemId;
        if(!id||list.some(d=>d?.id===id))continue;
        if(el.dataset.vegetable==='1'||el.dataset.fruit==='1'||el.dataset.calibrationCopy==='1'||/^(veg|fruit|produce)_/.test(id))continue;
        const body=el.querySelector?.('img.body,img');
        list.push({id,label:el.dataset.label||id,src:body?.getAttribute?.('src')||body?.src||'',
          w:+el.dataset.baseW||el.offsetWidth||120,h:+el.dataset.baseH||el.offsetHeight||100,
          snapProfile:el.dataset.snapProfile||'flat',shadowProfile:el.dataset.shadowProfile||''});
      }
    }

    return list.filter(d=>d&&d.id&&d.src&&Number.isFinite(+d.w)&&Number.isFinite(+d.h))
      .slice().sort((a,b)=>String(a.label||a.id).localeCompare(String(b.label||b.id),'sr'));
  }
  function defFor(id){return defs().find(d=>d.id===id)||null;}
  function autoSurfaceForPoint(x,y,current='table'){
    const p={x:+x||0,y:+y||0};
    try{
      // Stove wins over table because it visually sits on top of the work surface.
      if(typeof stoveTopPlacementHit==='function'&&stoveTopPlacementHit(p))return 'stove';

      // Use the same corrected visual front edge that gameplay uses.
      if(typeof tableFrontEdgeVisualZone==='function'&&tableFrontEdgeVisualZone(p))return 'table';

      const floorPoly=placementGeometry?.SURFACES?.floorPoly;
      if(Array.isArray(floorPoly)&&floorPoly.length>2&&pointInPoly(p.x,p.y,floorPoly))return 'floor';

      const zone=window.CooksterSceneSurfaces?.zoneAt?.(p.x,p.y)||'';
      if(zone==='stove')return 'stove';
      if(zone==='table'||zone==='board')return 'table';
      if(zone==='floor')return 'floor';
    }catch(_){}
    return current||'table';
  }
  function populate(){
    const cur=itemSel.value||state.itemId;
    itemSel.innerHTML='<option value=""></option>';
    for(const d of defs()){
      const o=document.createElement('option');o.value=d.id;o.textContent=`${d.label||d.id} [${d.id}]`;itemSel.appendChild(o);
    }
    if(cur&&[...itemSel.options].some(o=>o.value===cur))itemSel.value=cur;
    else if(state.itemId&&[...itemSel.options].some(o=>o.value===state.itemId))itemSel.value=state.itemId;
    else if([...itemSel.options].some(o=>o.value==='serpa_velika'))itemSel.value='serpa_velika';
    else itemSel.value=[...itemSel.options].find(o=>o.value)?.value||'';
    state.itemId=itemSel.value||'';
  }
  function proxyFor(c){
    const d=defFor(c.itemId)||{};
    const ds={
      itemId:c.itemId,snapProfile:d.snapProfile||'',vesselSubtype:d.subtype||'',
      subtype:d.subtype||'',cx:String(c.x),by:String(c.y),surfaceZone:c.surface,
      baseW:String(d.w||120),baseH:String(d.h||100),angle:String(d.angle||0),tilt:String(d.tilt||0),
      vis:String(Math.max(.05,+c.scale||1)),
      calibrationCopy:'1'
    };
    return {dataset:ds};
  }
  function renderCopy(c){
    if(!c?.el)return;
    const d=defFor(c.itemId);if(!d)return;
    const proxy=proxyFor(c);

    // Calibration preview must use exactly the same authored scale semantics
    // as gameplay: c.scale is the final calibrated visual scale for this point.
    const vis=Math.max(.05,+c.scale||1);
    const w=(+d.w||120)*vis,h=(+d.h||100)*vis;

    let flatten=1;
    try{flatten=surfaceFlattenFor(proxy,c.surface,c.y);}catch(_){}

    c.el.style.width=w+'px';c.el.style.height=h+'px';
    c.el.style.left=(c.x-w/2)+'px';c.el.style.top=(c.y-h)+'px';

    // Match runtime setPose() transform origin exactly.
    const pr=typeof snapProfileFor==='function'?snapProfileFor(proxy):null;
    if(c.surface==='floor')c.el.style.transformOrigin='50% 100%';
    else if(pr)c.el.style.transformOrigin=`50% ${Math.round(pr.anchorY*100)}%`;
    else c.el.style.transformOrigin='50% 50%';

    c.el.style.transform=itemPoseTransform(
      proxy,
      (+d.angle||0)+(+c.angle||0),
      flatten,
      (+d.tilt||0)+(+c.tilt||0)
    );
    c.el.style.zIndex=String(12000+Math.max(0,Math.min(900,Math.floor(c.y))));
    c.badge.textContent=`${c.index} · ${c.surface==='table'?'сто':c.surface==='stove'?'шпорет':'под'}`;
    c.badge.style.left=c.x+'px';c.badge.style.top=(c.y-h-4)+'px';
  }
  function syncControls(){
    const c=state.selected;
    for(const [key,r] of Object.entries(rows)){
      const v=c?c[key]:(key==='scale'?1:0);
      r.range.disabled=r.num.disabled=!c;
      r.range.value=String(v);r.num.value=String(v);
    }
    surfaceSel.disabled=!c;
    if(c)surfaceSel.value=c.surface;
  }
  function syncStatus(){
    const c=state.selected,d=defFor(state.itemId);
    if(c){
      status.textContent=`${d?.label||c.itemId} · тачка ${c.index} · X ${c.x.toFixed(1)} · Y ${c.y.toFixed(1)} · ${c.surface} · величина ${(+c.scale).toFixed(3)} · ротација ${(+c.angle).toFixed(1)}° · нагиб ${(+c.tilt).toFixed(1)}°`;
    }else{
      const pts=state.copies.filter(q=>q.itemId===state.itemId);
      status.textContent=`${d?.label||state.itemId||'Предмет'} · калибрационих тачака: ${pts.length}`;
    }
  }
  function renderList(){
    pointList.innerHTML='';
    const pts=state.copies.filter(c=>c.itemId===state.itemId);
    if(!pts.length){
      const s=document.createElement('span');s.textContent='Нема калибрационих тачака.';s.style.fontSize='11px';pointList.appendChild(s);return;
    }
    for(const c of pts){
      const b=document.createElement('button');b.type='button';
      b.textContent=`${c.index}:${c.surface==='table'?'сто':c.surface==='stove'?'шп':'под'}`;
      b.style.cssText='font-size:10px;padding:3px 5px!important;margin:0!important';
      if(c===state.selected)b.style.outline='2px solid #2e78c7';
      b.onclick=()=>select(c);
      pointList.appendChild(b);
    }
  }
  function select(c){
    state.selected=c||null;
    for(const q of state.copies)q.el.style.outline='';
    syncControls();renderList();syncStatus();
  }
  function remove(c){
    if(!c)return;
    c.el?.remove();c.badge?.remove();
    state.copies=state.copies.filter(q=>q!==c);
    if(state.selected===c)state.selected=null;
    select(state.copies.filter(q=>q.itemId===state.itemId).at(-1)||null);
  }
  function clearCurrent(){
    for(const c of [...state.copies])if(c.itemId===state.itemId)remove(c);
    select(null);
  }

  function loadAppliedCopies(itemId,{force=false}={}){
    if(!itemId)return 0;
    const existing=state.copies.filter(c=>c.itemId===itemId);
    if(existing.length&&!force)return existing.length;
    if(force){
      for(const c of [...existing])remove(c);
    }
    const saved=state.applied[itemId];
    const points=saved?.points||{};
    let count=0;
    for(const surface of ['table','stove','floor']){
      const list=Array.isArray(points[surface])?points[surface]:[];
      for(const p of list){
        createCopy({
          itemId,
          surface,
          x:+p.x,
          y:+p.y,
          scale:Number.isFinite(+p.scale)?+p.scale:1,
          angle:Number.isFinite(+p.angle)?+p.angle:0,
          tilt:Number.isFinite(+p.tilt)?+p.tilt:0
        });
        count++;
      }
    }
    return count;
  }

  function resetCurrentItemCalibration(){
    const itemId=state.itemId||itemSel.value;
    if(!itemId)return;
    clearCurrent();

    const d=defFor(itemId)||{};
    const empty={
      version:2,
      tool:'cookster-object-perspective-calibration',
      itemId,
      label:d.label||itemId,
      points:{table:[],stove:[],floor:[]}
    };
    state.applied[itemId]=JSON.parse(JSON.stringify(empty));

    const cfg={...PERSPECTIVE_CORR_DEFAULT,...(perspectiveCorrections[itemId]||{})};
    cfg.points={table:[],stove:[],floor:[]};
    perspectiveCorrections[itemId]=cfg;
    const savedMaster=savePersistentMaster();

    const c=createCopy({itemId,surface:'table',scale:1,angle:0,tilt:0});
    if(c)select(c);
    output.value=JSON.stringify(savedMaster.data,null,2);
    status.textContent=savedMaster.persisted
      ?`Ресетован предмет: ${d.label||itemId}. Остале калибрације нису промењене.`
      :`Ресет је примењен у овој сесији, али чување у прегледачу није успело. Извези JSON да сачуваш master.`;
    showToast(savedMaster.persisted
      ?`Ресетована калибрација: ${d.label||itemId}.`
      :'Чување калибрације није успело; извези JSON као резерву.');
  }
  function createCopy(seed=null){
    const itemId=seed?.itemId||state.itemId||itemSel.value;
    const d=defFor(itemId);if(!d)return null;
    const p=screenToScene(innerWidth*.50,innerHeight*.58);
    const same=state.copies.filter(q=>q.itemId===itemId);
    const startX=Number.isFinite(+seed?.x)?+seed.x:p.x+same.length*24;
    const startY=Number.isFinite(+seed?.y)?+seed.y:p.y+same.length*16;
    const c={
      uid:++state.seq,index:same.length+1,itemId,
      surface:seed?.surface||autoSurfaceForPoint(startX,startY,surfaceSel.value||'table'),
      x:startX,
      y:startY,
      scale:Number.isFinite(+seed?.scale)?+seed.scale:1,
      angle:Number.isFinite(+seed?.angle)?+seed.angle:0,
      tilt:Number.isFinite(+seed?.tilt)?+seed.tilt:0
    };
    const el=document.createElement('div');
    el.className='perspective-lab-copy-v2';
    el.dataset.calibrationCopy='1';
    Object.assign(el.style,{position:'absolute',pointerEvents:'auto',cursor:'move',userSelect:'none',touchAction:'none',filter:'drop-shadow(0 5px 5px rgba(0,0,0,.3))'});
    const img=document.createElement('img');
    img.src=d.src;img.alt='';img.draggable=false;
    Object.assign(img.style,{display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
    el.appendChild(img);
    const badge=document.createElement('div');
    Object.assign(badge.style,{position:'absolute',transform:'translate(-50%,-100%)',zIndex:'14060',padding:'2px 5px',borderRadius:'4px',background:'rgba(20,20,22,.88)',color:'#fff',font:'700 10px/1.2 system-ui,sans-serif',pointerEvents:'none',whiteSpace:'nowrap'});
    scene.append(el,badge);
    c.el=el;c.badge=badge;state.copies.push(c);

    let drag=null;
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();select(c);
      const p0=screenToScene(e.clientX,e.clientY);
      drag={id:e.pointerId,px:p0.x,py:p0.y,x:c.x,y:c.y};
      try{el.setPointerCapture(e.pointerId)}catch(_){}
    });
    el.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      e.preventDefault();e.stopPropagation();
      const p1=screenToScene(e.clientX,e.clientY);
      c.x=drag.x+(p1.x-drag.px);c.y=drag.y+(p1.y-drag.py);
      const nextSurface=autoSurfaceForPoint(c.x,c.y,c.surface);
      if(nextSurface!==c.surface){
        c.surface=nextSurface;
        surfaceSel.value=c.surface;
        renderList();
      }
      renderCopy(c);syncStatus();
    });
    const end=e=>{if(drag&&drag.id===e.pointerId)drag=null;};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
    el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select(c);});
    renderCopy(c);select(c);return c;
  }
  function payload(itemId=state.itemId){
    const d=defFor(itemId);
    const points={table:[],stove:[],floor:[]};
    for(const c of state.copies.filter(q=>q.itemId===itemId)){
      points[c.surface].push({
        x:+c.x.toFixed(3),y:+c.y.toFixed(3),
        scale:+c.scale.toFixed(4),angle:+c.angle.toFixed(3),tilt:+c.tilt.toFixed(3)
      });
    }
    return {
      version:2,
      tool:'cookster-object-perspective-calibration',
      itemId,
      label:d?.label||itemId,
      points
    };
  }

  function masterPayload(){
    const masterItems={};
    for(const [id,data] of Object.entries(state.applied)){
      masterItems[id]={
        itemId:data.itemId,
        label:data.label,
        points:{
          table:Array.isArray(data.points?.table)?data.points.table:[],
          stove:Array.isArray(data.points?.stove)?data.points.stove:[],
          floor:Array.isArray(data.points?.floor)?data.points.floor:[]
        }
      };
    }
    return {
      version:1,
      tool:'cookster-object-perspective-calibration-master',
      exportedAt:new Date().toISOString(),
      count:Object.keys(masterItems).length,
      items:masterItems
    };
  }
  function savePersistentMaster(){
    const data=masterPayload();
    try{
      localStorage.setItem(PERSPECTIVE_MASTER_KEY,JSON.stringify(data));
      return {data,persisted:true};
    }catch(error){
      console.warn('Could not save object perspective calibration.',error);
      return {data,persisted:false};
    }
  }

  function apply(){
    const data=payload();
    if(!data.itemId)return;

    const cfg={...PERSPECTIVE_CORR_DEFAULT,...(perspectiveCorrections[data.itemId]||{})};
    cfg.points={
      ...(cfg.points||{}),
      table:data.points.table,
      stove:data.points.stove,
      floor:data.points.floor
    };
    perspectiveCorrections[data.itemId]=cfg;

    // Save a deep copy in this calibration session. Re-applying the same item
    // replaces its previous entry instead of duplicating it.
    state.applied[data.itemId]=JSON.parse(JSON.stringify(data));
    const savedMaster=savePersistentMaster();

    for(const el of items){
      if(el.dataset.itemId!==data.itemId||el.classList.contains('held'))continue;
      const zone=el.dataset.surfaceZone||'table';
      const vis=surfaceScaleFor(el,zone,+el.dataset.by||GP_TABLE_REF_Y);
      setPose(el,+el.dataset.cx||0,+el.dataset.by||0,vis);
    }

    output.value=JSON.stringify(savedMaster.data,null,2);
    status.textContent=savedMaster.persisted
      ?`Примењено и сачувано: ${data.label}. Master: ${savedMaster.data.count} предмета. Refresh ће задржати измену.`
      :`Примењено у овој сесији, али чување није успело. Извези JSON да сачуваш измену.`;
    showToast(savedMaster.persisted
      ?`Калибрација примењена: ${data.label}.`
      :'Чување није успело; извези JSON као резерву.');
  }

  function exportJson(){
    const data=masterPayload();
    output.value=JSON.stringify(data,null,2);

    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='cookster-perspective-master.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  copyBtn.onclick=()=>{
    const s=state.selected;
    createCopy(s?{itemId:s.itemId,surface:s.surface,x:s.x+34,y:s.y+20,scale:s.scale,angle:s.angle,tilt:s.tilt}:{itemId:state.itemId,surface:surfaceSel.value});
  };
  delBtn.onclick=()=>remove(state.selected);
  clearBtn.onclick=clearCurrent;
  resetItemBtn.onclick=resetCurrentItemCalibration;
  applyBtn.onclick=apply;
  exportBtn.onclick=exportJson;
  closeBtn.onclick=()=>api.close();
  surfaceSel.onchange=()=>{
    const c=state.selected;if(!c)return;
    c.surface=surfaceSel.value;
    renderCopy(c);renderList();syncStatus();
  };
  itemSel.onchange=()=>{
    state.itemId=itemSel.value;
    let same=state.copies.filter(c=>c.itemId===state.itemId);
    if(!same.length)loadAppliedCopies(state.itemId);
    same=state.copies.filter(c=>c.itemId===state.itemId);
    if(same.length)select(same.at(-1));
    else createCopy({itemId:state.itemId,surface:'table'});
  };


  function selectItemTypeFromScene(el){
    if(!el||!el.dataset?.itemId)return false;
    const id=el.dataset.itemId;
    if(!defFor(id))return false;
    state.itemId=id;
    populate();
    itemSel.value=id;
    let existing=state.copies.filter(c=>c.itemId===id);
    if(!existing.length)loadAppliedCopies(id);
    existing=state.copies.filter(c=>c.itemId===id);
    if(existing.length){
      select(existing.at(-1));
    }else{
      createCopy({
        itemId:id,
        surface:(el.dataset.surfaceZone==='stove'?'stove':el.dataset.surfaceZone==='floor'?'floor':'table'),
        x:Number.isFinite(+el.dataset.cx)?+el.dataset.cx:undefined,
        y:Number.isFinite(+el.dataset.by)?+el.dataset.by:undefined,
        scale:1,angle:0,tilt:0
      });
    }
    syncStatus();
    return true;
  }


  const api={
    open(){
      populate();
      panel.style.display='block';
      for(const c of state.copies){
        if(c.el)c.el.style.display='block';
        if(c.badge)c.badge.style.display='block';
      }
      if(state.itemId){
        let same=state.copies.filter(c=>c.itemId===state.itemId);
        if(!same.length)loadAppliedCopies(state.itemId);
        same=state.copies.filter(c=>c.itemId===state.itemId);
        if(same.length)select(same.at(-1));
        else createCopy({itemId:state.itemId,surface:'table'});
      }else{
        select(null);
        status.textContent='Изабери предмет из падајућег менија.';
      }
    },
    close(){
      panel.style.display='none';
      for(const c of state.copies){
        if(c.el)c.el.style.display='none';
        if(c.badge)c.badge.style.display='none';
      }
    },
    panel,
    export:payload
  };
  return api;
}


/* ==========================================================================
   Contact Drop Shadow Calibration Lab
   Photoshop-like per-item contact-shadow tuning across table / stove / floor.
   ========================================================================== */
let contactShadowLab=null;
function openContactShadowLab(){
 if(CONTACT_SHADOW_CALIBRATION_LOCKED)return false;
 if(!contactShadowLab)contactShadowLab=createContactShadowLab();
 contactShadowLab.open();
 return true;
}
function createContactShadowLab(){
 const state={copies:[],selected:null,seq:0,itemId:'',
   applied:JSON.parse(JSON.stringify(contactShadowMaster.items||{}))};

 const panel=document.createElement('div');
 panel.id='contactShadowLab';
 panel.className='cookster-editor-panel';
 Object.assign(panel.style,{
   position:'fixed',left:'10px',bottom:'10px',zIndex:'13160',width:'330px',
   maxHeight:'60vh',overflow:'auto',display:'none',padding:'8px',pointerEvents:'auto'
 });

 const title=document.createElement('div');
 title.textContent='Drop Shadow Lab — контактне сенке';
 title.style.cssText='font-weight:700;font-size:14px;margin-bottom:8px';

 const itemSel=document.createElement('select');
 itemSel.style.cssText='width:100%;height:30px;margin-bottom:6px';

 const surfaceSel=document.createElement('select');
 surfaceSel.style.cssText='width:100%;height:30px;margin-bottom:7px;display:none';
 [['table','Сто'],['stove','Шпорет'],['floor','Под']].forEach(([v,t])=>{
   const o=document.createElement('option');o.value=v;o.textContent=t;surfaceSel.appendChild(o);
 });
 surfaceSel.value='table';

 function syncSurfaceSelector(){
   const isBoard=(state.itemId||itemSel.value)==='daska';
   surfaceSel.style.display=isBoard?'block':'none';
   if(isBoard&&state.selected)surfaceSel.value=state.selected.surface||'table';
 }

 const status=document.createElement('div');
 status.style.cssText='font-size:11px;line-height:1.35;padding:6px;background:#fff;border:1px solid #aaa;margin-bottom:7px';

 const rows={};
 function makeRow(label,key,min,max,step){
   const row=document.createElement('label');
   row.style.cssText='display:grid;grid-template-columns:92px 1fr 62px;gap:6px;align-items:center;margin:5px 0';
   const n=document.createElement('span');n.textContent=label;
   const range=document.createElement('input');range.type='range';range.min=min;range.max=max;range.step=step;
   const num=document.createElement('input');num.type='number';num.min=min;num.max=max;num.step=step;num.style.width='58px';
   const commit=raw=>{
     const c=state.selected;if(!c)return;
     const v=Math.max(+min,Math.min(+max,Number(raw)));if(!Number.isFinite(v))return;
     c[key]=v;range.value=String(v);num.value=String(v);renderCopy(c);syncStatus();
   };
   range.oninput=()=>commit(range.value);num.oninput=()=>commit(num.value);
   row.append(n,range,num);rows[key]={range,num};return row;
 }

 const rowX=makeRow('X offset','shadowX',-180,180,1);
 const rowY=makeRow('Y offset','shadowY',-180,180,1);
 const rowW=makeRow('Ширина','width',.15,2.5,.005);
 const rowH=makeRow('Висина','height',.01,1.2,.005);
 const rowBlur=makeRow('Blur','blur',0,30,.1);
 const rowOpacity=makeRow('Opacity','opacity',0,1,.01);
 const rowAngle=makeRow('Rotation','angle',-180,180,.1);

 const actions=document.createElement('div');
 actions.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:8px';
 function btn(t,fn){const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=fn;actions.appendChild(b);return b;}
 const addBtn=btn('Нови preview',()=>{clearItemCopies(state.itemId);createCopy({itemId:state.itemId});});
 const dupBtn=btn('Центрирај preview',()=>{const c=state.selected;if(c){c.x=840;c.y=540;c.surface=surfaceForPoint(c.x,c.y,'table');renderCopy(c);syncStatus();}});
 const delBtn=btn('Обриши preview',()=>state.selected&&removeCopy(state.selected));
 const applyBtn=btn('Примени у игру',applyCurrentItem);
 const resetBtn=btn('Ресетуј предмет',resetCurrentItem);
 const exportBtn=btn('Извези master JSON',exportMaster);
  function exportBasketShadow(id,sceneName){
    const profile=contactShadowMaster.items[id];
    if(!profile)return;
    const data={version:2,tool:'cookster-wood-basket-shadow',itemId:'korpa_drva',
      scene:sceneName,shadow:{...profile.shadow}};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`cookster-wood-basket-shadow-${sceneName}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    status.textContent=`Izvezena senka korpe: ${sceneName==='indoor'?'u sobi':'napolju'}.`;
  }
  btn('Izvezi senku u sobi',()=>exportBasketShadow('korpa_drva','indoor'));
  btn('Izvezi senku napolju',()=>exportBasketShadow(WOOD_BASKET_OUTDOOR_SHADOW_ID,'outdoor'));
 const closeBtn=btn('Затвори',()=>panel.style.display='none');

 const pointList=document.createElement('div');
 pointList.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin:7px 0';

 panel.append(title,itemSel,surfaceSel,status,rowX,rowY,rowW,rowH,rowBlur,rowOpacity,rowAngle,pointList,actions);
 document.body.appendChild(panel);

 function defs(){
   const src=Array.isArray(KITCHEN_EQUIPMENT)?KITCHEN_EQUIPMENT:[];
   const map=new Map();
   for(const d of src)if(d?.id)map.set(d.id,d);
    // Include movable tools and staples even when they are not currently
    // spawned in the scene. The lab should describe the whole movable set,
    // not only the objects visible in this save.
    for(const d of (CooksterCatalog.ITEMS||[]))if(d?.id)map.set(d.id,d);
    for(const d of Object.values(CooksterCatalog.STAPLES||{}))if(d?.id)map.set(d.id,d);
    // Dynamic produce items use unique instance ids in the scene. Give the
    // shadow lab stable calibration entries that the runtime can map back to
    // through produce_<vegKey>.
    for(const [key,d] of Object.entries(VEGETABLES||{})){
      if(!d?.src)continue;
      map.set(`produce_${key}`,{
        id:`produce_${key}`,
        label:`Povrće — ${d.label||key}`,
        src:d.src,
        w:+d.w||70,h:+d.h||70,
        snapProfile:'produce',shadowProfile:'tiny',category:'produce-shadow'
      });
      if(d.slicedSrc){
        map.set(`produce_${key}_sliced`,{
          id:`produce_${key}_sliced`,
          label:`Isečeno povrće — ${d.label||key}`,
          src:d.slicedSrc,w:+d.slicedW||+d.w||70,h:+d.slicedH||+d.h||70,
          snapProfile:'produce',shadowProfile:'tiny',category:'sliced-produce-shadow'
        });
      }
      if(d.dicedSrc){
        map.set(`produce_${key}_diced`,{
          id:`produce_${key}_diced`,
          label:`Sitno seckano povrće — ${d.label||key}`,
          src:d.dicedSrc,w:+d.dicedW||+d.w||70,h:+d.dicedH||+d.h||70,
          snapProfile:'produce',shadowProfile:'tiny',category:'diced-produce-shadow'
        });
      }
      if(key==='paprika'||key==='paprika_zelena'||key==='patlidzan'){
        const stoveId=key==='paprika'?'produce_paprika_plotna_silja'
          :key==='patlidzan'?'produce_patlidzan_plotna':'produce_paprika_zelena_plotna';
        map.set(stoveId,{
          id:stoveId,
          label:key==='paprika'?'Crvena šilja — vodoravno na plotni'
            :key==='patlidzan'?'Patlidžan — na plotni':'Zelena paprika — položena na plotnu',
          src:key==='paprika'?PAPRIKA_ROAST_ASSETS[0]
            :key==='patlidzan'?PATLIDZAN_ROAST_ASSETS[0]:d.src,
          w:+d.w||70,h:+d.h||70,
          snapProfile:'produce',shadowProfile:'tiny',category:'stove-produce-shadow'
        });
      }
    }
    map.set('produce_patlidzan_pecen',{
      id:'produce_patlidzan_pecen',label:'Pečen patlidžan',
      src:PATLIDZAN_ROAST_ASSETS[2],
      w:+VEGETABLES.patlidzan?.w||70,h:+VEGETABLES.patlidzan?.h||70,
      snapProfile:'produce',shadowProfile:'tiny',category:'roasted-produce-shadow'
    });
    map.set('produce_paprika_pecena_cela',{
      id:'produce_paprika_pecena_cela',label:'Pečena paprika — cela',
      src:PAPRIKA_ROAST_ASSETS[3],w:+VEGETABLES.paprika?.w||70,h:+VEGETABLES.paprika?.h||70,
      snapProfile:'produce',shadowProfile:'tiny',category:'roasted-produce-shadow'
    });
    map.set('produce_paprika_pecena_oljustena',{
      id:'produce_paprika_pecena_oljustena',label:'Pečena paprika — cela oljuštena',
      src:PAPRIKA_PEEL_ASSETS.peeled,w:+VEGETABLES.paprika?.w||70,h:+VEGETABLES.paprika?.h||70,
      snapProfile:'produce',shadowProfile:'tiny',category:'roasted-produce-shadow'
    });
    map.set('produce_paprika_pecena_seckana_neoljustena',{
      id:'produce_paprika_pecena_seckana_neoljustena',
      label:'Pečena paprika — seckana neoljuštena',
      src:PAPRIKA_ROAST_CHOPPED_ASSETS.unpeeled,w:96,h:76,
      snapProfile:'produce',shadowProfile:'tiny',category:'roasted-chopped-produce-shadow'
    });
    map.set('produce_paprika_pecena_seckana_oljustena',{
      id:'produce_paprika_pecena_seckana_oljustena',
      label:'Pečena paprika — seckana oljuštena',
      src:PAPRIKA_ROAST_CHOPPED_ASSETS.peeled,w:96,h:76,
      snapProfile:'produce',shadowProfile:'tiny',category:'roasted-chopped-produce-shadow'
    });
    map.set('market_bag',{
      id:'market_bag',label:'Kesa sa pijace',src:MARKET_BAG_ASSET,
      w:112,h:112,snapProfile:'flat',shadowProfile:'tiny',category:'market-bag'
    });
    map.set('produce_crate',{
      id:'produce_crate',label:'Gajbica sa povrćem',src:CRATE_STAGE_ASSETS.paradajz.full,
      w:340,h:257,snapProfile:'crate',shadowProfile:'crate',category:'produce-crate'
    });
    map.set('korpa_drva',{
      id:'korpa_drva',label:'Korpa sa drvima — u sobi',src:WOOD_BASKET_ASSETS[0].src,
      w:236,h:236,snapProfile:'flat',shadowProfile:'tiny',category:'wood-basket'
    });
    map.set(WOOD_BASKET_OUTDOOR_SHADOW_ID,{
      id:WOOD_BASKET_OUTDOOR_SHADOW_ID,label:'Korpa sa drvima — napolju',src:WOOD_BASKET_ASSETS[0].src,
      w:236,h:236,snapProfile:'flat',shadowProfile:'tiny',category:'wood-basket'
    });
   for(const el of items||[]){
     const id=el?.dataset?.itemId;if(!id||map.has(id))continue;
     map.set(id,{id,label:el.dataset.label||id,src:el.querySelector('.body')?.src||'',w:+el.dataset.baseW||120,h:+el.dataset.baseH||100});
   }
   return [...map.values()].filter(d=>d?.id&&d?.src).sort((a,b)=>String(a.label||a.id).localeCompare(String(b.label||b.id),'sr'));
 }
 function defFor(id){return defs().find(d=>d.id===id)||null;}
 function populate(){
   const cur=itemSel.value||state.itemId;
   itemSel.innerHTML='<option value=""></option>';
   for(const d of defs()){const o=document.createElement('option');o.value=d.id;o.textContent=`${d.label||d.id} [${d.id}]`;itemSel.appendChild(o);}
   if(cur&&[...itemSel.options].some(o=>o.value===cur))itemSel.value=cur;
   else itemSel.value=[...itemSel.options].find(o=>o.value)?.value||'';
   state.itemId=itemSel.value||'';
 }
 function surfaceForPoint(x,y,current='table'){
   const p={x:+x||0,y:+y||0};
   try{
     if(typeof stoveTopPlacementHit==='function'&&stoveTopPlacementHit(p))return 'stove';
     if(typeof tableFrontEdgeVisualZone==='function'&&tableFrontEdgeVisualZone(p))return 'table';
     const floorPoly=placementGeometry?.SURFACES?.floorPoly;
     if(Array.isArray(floorPoly)&&floorPoly.length>2&&pointInPoly(p.x,p.y,floorPoly))return 'floor';
   }catch(_){}
   return current||'table';
 }
 function defaultCfgFor(itemId){
   if(itemId==='korpa_drva')return {...WOOD_BASKET_INDOOR_SHADOW_DEFAULT};
   if(itemId===WOOD_BASKET_OUTDOOR_SHADOW_ID)return {...WOOD_BASKET_OUTDOOR_SHADOW_DEFAULT};
   const pot=String(itemId).includes('serpa');
   return pot
    ?{shadowX:0,shadowY:0,width:1.10,height:.70,opacity:.52,blur:.8,angle:.6}
    :{shadowX:0,shadowY:0,width:.72,height:.07,opacity:.52,blur:.8,angle:.6};
 }
 function select(c){
   state.selected=c||null;
   for(const x of state.copies)x.el?.classList.toggle('selected',x===c);
   if(!c){syncStatus();return;}
   state.itemId=c.itemId;itemSel.value=c.itemId;
   syncSurfaceSelector();
   if(c.itemId==='daska')surfaceSel.value=c.surface||'table';
   for(const [k,r] of Object.entries(rows)){r.range.value=String(c[k]);r.num.value=String(c[k]);}
   syncStatus();
 }
 function syncStatus(){
   syncSurfaceSelector();
   const c=state.selected;
   if(c){
     status.textContent=c.itemId===WOOD_BASKET_OUTDOOR_SHADOW_ID
       ?'Korpa sa drvima · senka napolju · promene se vide u drvarnici'
       :c.itemId==='korpa_drva'
       ?'Korpa sa drvima · senka u sobi · ne menja senku napolju'
       :c.itemId==='daska'
       ?`${defFor(c.itemId)?.label||c.itemId} · сенка за ${c.surface} · x ${c.x.toFixed(1)} / y ${c.y.toFixed(1)}`
       :`${defFor(c.itemId)?.label||c.itemId} · глобална сенка · preview: ${c.surface} · x ${c.x.toFixed(1)} / y ${c.y.toFixed(1)}`;
   }else{
     status.textContent=state.itemId==='daska'
       ?'Даска има посебну сенку за сто, шпорет и под.'
       :'Изабери предмет. Сенка важи исто на столу, шпорету и поду.';
   }
   pointList.innerHTML='';
   for(const c2 of state.copies.filter(x=>x.itemId===state.itemId)){
     const b=document.createElement('button');b.type='button';
     b.textContent=c2.itemId==='daska'
       ?({table:'Сто',stove:'Шпорет',floor:'Под'}[c2.surface]||c2.surface)
       :'Глобални preview';
     b.onclick=()=>select(c2);pointList.appendChild(b);
   }
 }
 function renderCopy(c){
   if(c?.itemId==='korpa_drva'||c?.itemId===WOOD_BASKET_OUTDOOR_SHADOW_ID){
     const shadow={shadowX:c.shadowX,shadowY:c.shadowY,width:c.width,height:c.height,
       blur:c.blur,opacity:c.opacity,angle:c.angle};
     const id=c.itemId;
     const profile={itemId:id,label:id==='korpa_drva'
       ?'Korpa sa drvima — u sobi':'Korpa sa drvima — napolju',shadow};
     contactShadowMaster.items[id]=profile;
     state.applied[id]=JSON.parse(JSON.stringify(profile));
     try{localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));}catch(_){}
     if(id===WOOD_BASKET_OUTDOOR_SHADOW_ID)window.CooksterWoodRefill?.setShadow?.(shadow);
     else for(const el of items||[]){
       if(el.dataset.itemId===id&&Number.isFinite(+el.dataset.cx))
         setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);
     }
   }
   if(!c?.el)return;
   const d=defFor(c.itemId);if(!d)return;

   // Shadow calibration must preview the exact same locked perspective pose
   // that gameplay uses at this position/surface.
   const proxy={
     dataset:{
       itemId:c.itemId,
       snapProfile:d.snapProfile||'',
       vesselSubtype:d.subtype||'',
       subtype:d.subtype||'',
       cx:String(c.x),by:String(c.y),
       surfaceZone:c.surface,
       baseW:String(d.w||120),baseH:String(d.h||100),
       angle:String(d.angle||0),tilt:String(d.tilt||0),
       vis:'1',
       calibrationCopy:'1'
     }
   };

   const vis=surfaceScaleFor(proxy,c.surface,c.y);
   const corr=typeof perspectiveCorrectionFor==='function'
     ?perspectiveCorrectionFor(proxy,c.surface)
     :{angle:0,tilt:0};

   const baseW=Math.max(30,+d.w||120),baseH=Math.max(30,+d.h||100);
   const w=baseW*vis,h=baseH*vis;
   const finalAngle=(+d.angle||0)+(+corr.angle||0);
   const finalTilt=itemTiltValue(proxy,(+d.tilt||0)+(+corr.tilt||0));
   const flatten=surfaceFlattenFor(proxy,c.surface,c.y);

   c.el.style.width=w+'px';
   c.el.style.height=h+'px';
   c.el.style.left=(c.x-w/2)+'px';
   c.el.style.top=(c.y-h)+'px';
   c.el.style.zIndex='13080';

   const pr=typeof snapProfileFor==='function'?snapProfileFor(proxy):null;
   if(c.surface==='floor')c.el.style.transformOrigin='50% 100%';
   else if(pr)c.el.style.transformOrigin=`50% ${Math.round(pr.anchorY*100)}%`;
   else c.el.style.transformOrigin='50% 50%';

   c.el.style.transform=`perspective(1200px) rotateX(${finalTilt}deg) rotateZ(${finalAngle}deg) scaleY(${flatten})`;

   const sh=c.shadowEl;
   const shadowCfg={
     x:+c.shadowX||0,
     y:+c.shadowY||0,
     width:+c.width||.72,
     height:+c.height||.07,
     blur:+c.blur||0,
     opacity:Number.isFinite(+c.opacity)?+c.opacity:.52,
     angle:+c.angle||0
   };
   if(c.itemId==='daska'){
     styleBoardContactShadow(sh,shadowCfg,w,h,c.x,c.y,finalAngle,false);
   }else{
     const simg=sh.querySelector('img');if(simg)simg.style.display='block';
     sh.style.background='';sh.style.borderRadius='';
     styleCalibratedContactShadow(sh,shadowCfg,w,h,c.x,c.y,finalAngle,false);
   }
   sh.style.zIndex='13079';
 }
 function createCopy(seed={}){
   const itemId=seed.itemId||state.itemId||itemSel.value;if(!itemId)return null;
   const requestedSurface=seed.surface||surfaceSel.value||'table';
   for(const existing of [...state.copies]){
     if(existing.itemId!==itemId)continue;
     if(itemId!=='daska'||existing.surface===requestedSurface)removeCopy(existing);
   }
   const d=defFor(itemId);if(!d)return null;
   const cfg={...defaultCfgFor(itemId),...seed};
   const c={id:++state.seq,itemId,surface:itemId==='daska'?requestedSurface:(seed.surface||surfaceForPoint(Number.isFinite(+seed.x)?+seed.x:840,Number.isFinite(+seed.y)?+seed.y:540,'table')),
     x:Number.isFinite(+seed.x)?+seed.x:840,y:Number.isFinite(+seed.y)?+seed.y:540,
     shadowX:+cfg.shadowX||0,shadowY:+cfg.shadowY||0,width:+cfg.width||.72,height:+cfg.height||.07,
     blur:+cfg.blur||0,opacity:Number.isFinite(+cfg.opacity)?+cfg.opacity:.52,angle:+cfg.angle||0};

   const sh=document.createElement('div');
   sh.className='contact-shadow-sprite silhouette shadow-lab-contact-preview';
   sh.style.setProperty('position','absolute','important');
   sh.style.pointerEvents='none';
   sh.style.transformOrigin='50% 50%';
   const shImg=document.createElement('img');
   shImg.src=d.src;shImg.alt='';shImg.draggable=false;
   Object.assign(shImg.style,{display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
   sh.appendChild(shImg);
   scene.appendChild(sh);c.shadowEl=sh;
   prepareContactShadowAlphaBounds(sh,shImg);
   sh._onAlphaBoundsReady=()=>{if(c.el?.isConnected)renderCopy(c);};

   const el=document.createElement('div');
   el.className='shadow-lab-copy';
   el.dataset.calibrationCopy='1';
   Object.assign(el.style,{position:'absolute',cursor:'move',userSelect:'none',touchAction:'none'});
   const img=document.createElement('img');img.src=d.src;img.alt='';img.draggable=false;
   Object.assign(img.style,{width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
   el.appendChild(img);scene.appendChild(el);c.el=el;

   let drag=null;
   el.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();select(c);drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:c.x,cy:c.y};el.setPointerCapture?.(e.pointerId);});
   el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const a=screenToScene(drag.x,drag.y),b=screenToScene(e.clientX,e.clientY);c.x=drag.cx+(b.x-a.x);c.y=drag.cy+(b.y-a.y);if(c.itemId!=='daska')c.surface=surfaceForPoint(c.x,c.y,c.surface);renderCopy(c);syncStatus();});
   const up=e=>{if(drag&&drag.id===e.pointerId)drag=null;};
   el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);

   state.copies.push(c);renderCopy(c);select(c);return c;
 }
 function removeCopy(c){
   c?.el?.remove();c?.shadowEl?.remove();state.copies=state.copies.filter(x=>x!==c);
   select(state.copies.filter(x=>x.itemId===state.itemId).at(-1)||null);
 }
 function clearItemCopies(itemId){for(const c of [...state.copies])if(c.itemId===itemId)removeCopy(c);}
 function payloadFor(itemId){
   const d=defFor(itemId)||{};
   const base=defaultCfgFor(itemId);
   if(itemId==='daska'){
     const points={table:[],stove:[],floor:[]};
     for(const c of state.copies.filter(x=>x.itemId===itemId)){
       points[c.surface]=[{
         x:+c.x.toFixed(3),y:+c.y.toFixed(3),
         shadowX:+c.shadowX,shadowY:+c.shadowY,
         width:+c.width,height:+c.height,blur:+c.blur,
         opacity:+c.opacity,angle:+c.angle
       }];
     }
     return {itemId,label:d.label||itemId,points};
   }
   const c=state.copies.find(x=>x.itemId===itemId);
   const p=c||base;
   return {
     itemId,label:d.label||itemId,
     shadow:{
       shadowX:Number.isFinite(+p.shadowX)?+p.shadowX:0,
       shadowY:Number.isFinite(+p.shadowY)?+p.shadowY:0,
       width:Number.isFinite(+p.width)?+p.width:base.width,
       height:Number.isFinite(+p.height)?+p.height:base.height,
       blur:Number.isFinite(+p.blur)?+p.blur:base.blur,
       opacity:Number.isFinite(+p.opacity)?+p.opacity:base.opacity,
       angle:Number.isFinite(+p.angle)?+p.angle:base.angle
     }
   };
 }
 function applyCurrentItem(){
   if(CONTACT_SHADOW_CALIBRATION_LOCKED)return false;
   const id=state.itemId||itemSel.value;if(!id)return;
   const payload=payloadFor(id);
   state.applied[id]=JSON.parse(JSON.stringify(payload));
   contactShadowMaster.items=contactShadowMaster.items||{};
   contactShadowMaster.items[id]=JSON.parse(JSON.stringify(payload));
   contactShadowMaster.version=1;
   contactShadowMaster.tool='cookster-contact-shadow-calibration-master';
   try{
     localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));
     const saved=JSON.parse(localStorage.getItem(CONTACT_SHADOW_MASTER_KEY)||'null');
     if(saved?.items)contactShadowMaster=saved;
   }catch(_){}
   for(const el of items||[]){
     if(el.dataset.itemId!==id||!Number.isFinite(+el.dataset.cx))continue;
     setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);
   }
   status.textContent=`Примењено и сачувано: ${defFor(id)?.label||id} · refresh користи исти master`;
 }
 function resetCurrentItem(){
   if(CONTACT_SHADOW_CALIBRATION_LOCKED)return false;
   const id=state.itemId||itemSel.value;if(!id)return;
   clearItemCopies(id);delete state.applied[id];
   contactShadowMaster={version:1,tool:'cookster-contact-shadow-global-master',items:JSON.parse(JSON.stringify(state.applied))};
   try{localStorage.setItem(CONTACT_SHADOW_MASTER_KEY,JSON.stringify(contactShadowMaster));}catch(_){}
   if(id==='daska'){
     const base=defaultCfgFor(id);
     state.applied[id]={itemId:id,label:defFor(id)?.label||id,shadow:{...base}};
     loadApplied(id);
   }else createCopy({itemId:id});
   status.textContent=`Ресетована сенка: ${defFor(id)?.label||id}`;
 }
 function loadApplied(itemId){
   clearItemCopies(itemId);
   const e=state.applied[itemId];
   if(!e)return 0;

   if(itemId==='daska'){
     const global=e.shadow||e.profile||e?.points?.table?.[0]||e?.points?.stove?.[0]||e?.points?.floor?.[0]||defaultCfgFor(itemId);
     const previewPos={
       table:{x:840,y:540},
       stove:{x:1415,y:350},
       floor:{x:850,y:800}
     };
     let n=0;
     for(const surface of ['table','stove','floor']){
       const p=e?.points?.[surface]?.[0]||global;
       createCopy({itemId,surface,...previewPos[surface],...p});
       n++;
     }
     select(state.copies.find(c=>c.itemId===itemId&&c.surface===(surfaceSel.value||'table'))
       ||state.copies.find(c=>c.itemId===itemId));
     return n;
   }

   let p=e.shadow||e.profile||null;
   if(!p)p=e?.points?.table?.[0]||e?.points?.stove?.[0]||e?.points?.floor?.[0]||null;
   if(!p)return 0;
   createCopy({itemId,...p,x:840,y:540});
   return 1;
 }
 function exportMaster(){
   for(const id of new Set(state.copies.map(c=>c.itemId)))state.applied[id]=payloadFor(id);
   const data={version:1,tool:'cookster-contact-shadow-global-master',exportedAt:new Date().toISOString(),count:Object.keys(state.applied).length,items:state.applied};
   const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='cookster-contact-shadow-global-master.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
   status.textContent=`Извезен master JSON · ${data.count} предмета`;
 }
 itemSel.onchange=()=>{
   state.itemId=itemSel.value||'';
   syncSurfaceSelector();
   const n=loadApplied(state.itemId);
   if(!n&&state.itemId)createCopy({itemId:state.itemId,surface:state.itemId==='daska'?(surfaceSel.value||'table'):undefined});
   syncStatus();
 };
 surfaceSel.onchange=()=>{
   if((state.itemId||itemSel.value)!=='daska')return;
   const surface=surfaceSel.value||'table';
   let c=state.copies.find(x=>x.itemId==='daska'&&x.surface===surface);
   if(!c){
     const pos=surface==='stove'?{x:1415,y:350}:surface==='floor'?{x:850,y:800}:{x:840,y:540};
     c=createCopy({itemId:'daska',surface,...pos});
   }
   select(c);
 };

 return {
   open(){
     populate();panel.style.display='block';
     if(state.itemId){
       const n=loadApplied(state.itemId);
       if(!n)createCopy({itemId:state.itemId});
     }
     syncStatus();
   },
   close(){panel.style.display='none';for(const c of state.copies){c.el?.remove();c.shadowEl?.remove();}state.copies=[];state.selected=null;},
   selectItem(itemId){populate();itemSel.value=itemId;itemSel.onchange();},
   panel
 };
}
window.CooksterWoodBasketShadow={
 get(){return {...WOOD_BASKET_OUTDOOR_SHADOW_DEFAULT,
   ...contactShadowMaster.items[WOOD_BASKET_OUTDOOR_SHADOW_ID]?.shadow};},
 open(){if(!openContactShadowLab())return false;
   contactShadowLab.selectItem(WOOD_BASKET_OUTDOOR_SHADOW_ID);return true;}
};
const contactShadowLabDockButton=document.createElement('button');
contactShadowLabDockButton.type='button';
contactShadowLabDockButton.textContent='senke';
contactShadowLabDockButton.title='Kalibracija kontaktnih senki';
contactShadowLabDockButton.style.cssText='pointer-events:auto;min-width:118px;height:28px;padding:2px 10px;border-radius:2px;border:1px solid #8a8a8a;background:#f3f3f3;color:#1d1d1d;font:400 12px "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:none;text-align:left';
contactShadowLabDockButton.onclick=()=>openContactShadowLab();
contactShadowLabDockButton.hidden=false;
contactShadowLabDockButton.style.display='';
contactShadowLabDockButton.dataset.calibrationLocked='0';

const perspectiveLabDockButton=document.createElement('button');
perspectiveLabDockButton.type='button';
perspectiveLabDockButton.textContent='предмети';
perspectiveLabDockButton.title='Kalibracija položaja, veličine i orijentacije predmeta po površini';
perspectiveLabDockButton.style.cssText='pointer-events:auto;min-width:118px;height:28px;padding:2px 10px;border-radius:2px;border:1px solid #8a8a8a;background:#f3f3f3;color:#1d1d1d;font:400 12px "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:none;text-align:left';
perspectiveLabDockButton.onclick=()=>openPerspectiveLabV2();
perspectiveLabDockButton.hidden=false;
perspectiveLabDockButton.style.display='';
perspectiveLabDockButton.dataset.calibrationLocked='0';
// Remove legacy floating controls; the compact dock is now the only tool entry point.
for(const node of document.querySelectorAll('body *')){if(node===sceneCalibrationPanel||node.closest?.('#gameClock,[aria-label="Алати"]'))continue;const t=(node.textContent||'').trim().toLowerCase();if(t==='калибрација објеката'||t==='светлост и сенке'||t==='🔊 звучни контакта'||t==='звучни контакта'||t==='калибрација објава')node.style.display='none';}
toolDock.append(soundDockButton,elementImportDockButton,sceneDockButton,contactShadowLabDockButton,perspectiveLabDockButton);document.body.appendChild(toolDock);
const toolsToggle=dockButton('тулови','Otvori ili zatvori listu svih alata',()=>{const on=toolDock.style.display==='none';toolDock.style.display=on?'flex':'none';if(!on){soundToolActive=false;selectingSoundItem=false;soundDockButton.textContent='звук';[soundPanel,elementImportPanel,sceneCalibrationPanel].forEach(p=>{if(p){p.open=false;p.style.display='none';}});const sr=document.getElementById('sceneZoneCalibration');if(sr){sr.classList.remove('open');sr.style.display='none';}document.body.classList.remove('scene-zone-calibration-active');perspectiveLabV2?.close?.();contactShadowLab?.close?.();}});
Object.assign(toolsToggle.style,{position:'fixed',left:'50%',top:'10px',transform:'translateX(-50%)',zIndex:'13001',minWidth:'150px',height:'32px'});document.body.appendChild(toolsToggle);
const editorUiStyle=document.createElement('style');editorUiStyle.textContent=`
.cookster-editor-panel{background:#f2f2f2!important;color:#202020!important;border:1px solid #777!important;border-radius:3px!important;box-shadow:0 5px 18px rgba(0,0,0,.28)!important;font:400 12px/1.35 "Segoe UI",Arial,sans-serif!important;padding:8px!important}
.cookster-editor-panel summary{font:600 13px "Segoe UI",Arial,sans-serif!important;color:#111!important;padding:3px 2px 7px!important}
.cookster-editor-panel button{background:#e9e9e9!important;color:#111!important;border:1px solid #8b8b8b!important;border-radius:2px!important;padding:5px 9px!important;font:400 12px "Segoe UI",Arial,sans-serif!important;margin:2px!important}
.cookster-editor-panel button:hover{background:#dcecff!important;border-color:#3979b9!important}
.cookster-editor-panel select,.cookster-editor-panel input{font:400 12px "Segoe UI",Arial,sans-serif!important}
.cookster-editor-panel select{background:#fff!important;color:#111!important;border:1px solid #888!important;border-radius:1px!important}
.cookster-editor-panel output,.cookster-editor-panel div{color:#202020!important}
`;document.head.appendChild(editorUiStyle);
const hideLegacyToolLayers=()=>{if(toolDock.style.display!=='flex'){for(const id of ['sceneCalibrationToggleBtn','sceneZoneCalibrationBtn','sceneZoneCalibration','sceneCalibrationPanel','lightPanel','soundPanel']){const n=document.getElementById(id);if(n)n.style.display='none';}}};hideLegacyToolLayers();setInterval(hideLegacyToolLayers,300);
// The old decorative side images/arrows are removed from the visual layer;
// camera movement remains available through the existing scene controls.
if(leftArrow)leftArrow.remove();if(rightArrow)rightArrow.remove();
window.addEventListener('pointerdown',e=>{if((!selectingSoundItem&&!soundToolActive)||soundPanel.contains(e.target))return;let el=e.target?.closest?.('.item,[data-sound-target],#fireboxHotspot,#ovenHotspot');if(!el)return;e.preventDefault();e.stopImmediatePropagation();if(!el.classList.contains('item')){el.dataset.soundTarget=el.dataset.soundTarget||el.id||'hotspot';el.dataset.label=el.dataset.label||el.id;}selectedSoundItem=el;loadSoundEditor(el,e.clientX,e.clientY);},{capture:true});
let lastChop=0;function playChop(){playSfxVariant('tomatoChop',.78)}


const LID_JAR={x:.08,y:.00,w:.84,h:.29,type:'jar'};
const LID_POT={x:.05,y:.00,w:.90,h:.43,type:'pot'};

const VEGETABLES=CooksterCatalog.VEGETABLES;
const catalogKitchenEquipment=CooksterCatalog.KITCHEN_EQUIPMENT||[];
const IMPORTED_ELEMENT_KEY='cookster.ui-overlay-instances.v2';
try{
 // v2.30: image bytes are now bundled with the game. Remove obsolete
 // data-URL stores so an earlier failed import cannot keep localStorage full.
 localStorage.removeItem('cookster.imported-elements.v1');
 localStorage.removeItem('cookster.imported-images.v1');
 localStorage.removeItem('cookster.imported-element-poses.v1');
}catch(_){}
const BUILTIN_UI_ELEMENT_DEFS=[
 {id:'ui_drvena_traka_pet_polja',label:'Drvena traka — pet polja',src:'assets/ui/custom_elements/drvena_traka_pet_polja.png',w:240,h:180},
 {id:'ui_drvena_traka_sest_polja',label:'Drvena traka — šest polja',src:'assets/ui/custom_elements/drvena_traka_sest_polja.png',w:300,h:169},
 {id:'ui_kvadratni_drveni_okvir',label:'Kvadratni drveni okvir',src:'assets/ui/custom_elements/kvadratni_drveni_okvir.png',w:180,h:225},
 {id:'ui_osvetljeni_kvadratni_panel',label:'Osvetljeni kvadratni panel',src:'assets/ui/custom_elements/osvetljeni_kvadratni_panel.png',w:180,h:225},
 {id:'ui_drvena_traka_krug',label:'Drvena traka — kružno polje',src:'assets/ui/custom_elements/drvena_traka_krug.png',w:300,h:200},
 {id:'ui_drvena_traka_dva_polja',label:'Drvena traka — dva polja',src:'assets/ui/custom_elements/drvena_traka_dva_polja.png',w:300,h:200},
 {id:'ui_drvena_traka_mala_dva_polja',label:'Mala drvena traka — dva polja',src:'assets/ui/custom_elements/drvena_traka_mala_dva_polja.png',w:300,h:200},
 {id:'ui_kvadratna_drvena_tabla',label:'Kvadratna drvena tabla',src:'assets/ui/custom_elements/kvadratna_drvena_tabla.png',w:220,h:220}
];
const BUILTIN_UI_ELEMENT_IDS=new Set(BUILTIN_UI_ELEMENT_DEFS.map(def=>def.id));
const REMOVED_SIDE_BOTTOM_UI_INSTANCE_IDS=new Set([
  'ui_instance_495250cc-56a3-4f23-a727-9169564f7000',
  'ui_instance_e288bf45-35f1-45f3-a42a-4cac8c62b193',
  'ui_instance_25de8a40-6f61-4edd-a5d1-decdcc61eeb1',
  'ui_instance_253e0a9d-e98b-43f6-b126-db58708442b4'
]);
// First-run fallback only. Once saved, each user's exact pose is authoritative.
const DEFAULT_UI_LAYOUT=[
  {id:'ui_instance_6c8fb386-e40c-4f14-9760-6f71e685bf7f',typeId:'ui_drvena_traka_krug',x:213,y:110,w:197,h:131,angle:0,z:5},
  {id:'ui_instance_6fdf77f7-5896-487b-81b8-aecd80f185f2',typeId:'ui_drvena_traka_dva_polja',x:418,y:123,w:238,h:159,angle:0,z:6},
  {id:'ui_instance_f9d9eb81-3763-4fdd-bab5-e273264ffbbc',typeId:'ui_drvena_traka_sest_polja',x:836,y:996,w:516,h:291,angle:0,z:7},
  {id:'ui_instance_e4bd577d-8559-4cf0-b494-77cdcafb4a70',typeId:'ui_osvetljeni_kvadratni_panel',x:796,y:917,w:96,h:120,angle:0,z:13},
 ].filter(record=>!REMOVED_SIDE_BOTTOM_UI_INSTANCE_IDS.has(record.id));
const LOCKED_BOTTOM_TRAY_INSTANCE_IDS=new Set(
  DEFAULT_UI_LAYOUT.filter(record=>record.y>BASE_H).map(record=>record.id)
);
function isLockedBottomTray(record){return LOCKED_BOTTOM_TRAY_INSTANCE_IDS.has(record?.id);}
let savedUiInstances=[];
try{
  const stored=localStorage.getItem(IMPORTED_ELEMENT_KEY);
  savedUiInstances=stored?JSON.parse(stored):DEFAULT_UI_LAYOUT;
}catch(_){savedUiInstances=DEFAULT_UI_LAYOUT;}
if(!Array.isArray(savedUiInstances))savedUiInstances=[...DEFAULT_UI_LAYOUT];
savedUiInstances=savedUiInstances.filter(record=>
 !REMOVED_SIDE_BOTTOM_UI_INSTANCE_IDS.has(record?.id)
);
let importedElements=savedUiInstances.flatMap(saved=>{
 const def=BUILTIN_UI_ELEMENT_DEFS.find(x=>x.id===saved.typeId);
 if(!def||typeof saved.id!=='string'||!/^ui_instance_[\w-]+$/.test(saved.id))return [];
 return [{...def,...saved,originalW:def.w,originalH:def.h,src:def.src,label:def.label,visible:true}];
});
let migratedUiIds=new Set();
try{migratedUiIds=new Set(JSON.parse(localStorage.getItem('cookster.ui-overlay-migrated.v2')||'[]'));}catch(_){}
importedElements.forEach(renderUiElement);
persistImportedElements();
// v1.83: water-vessel props created for the water-pouring test. Keep these as
// ordinary Kitchen Elements so they can later receive their own pour targets.
const WATER_VESSEL_PROPS=[
 {id:'bokal_stari',label:'Старински бокал',src:'assets/antique_water_pitcher.png',x:0,y:0,w:150,h:180,z:24,starter:true,placement:['table','floor'],shadowProfile:'tiny',snapProfile:'flat',category:'water-vessel'},
 {id:'tikva_za_vodu',label:'Издубљена тиква',src:'assets/hollowed_water_gourd.png',x:0,y:0,w:145,h:180,z:25,starter:true,placement:['table','floor'],shadowProfile:'tiny',snapProfile:'flat',category:'water-vessel'}
];
const PAPRIKA_STEAM_BAG_ID='paprika_parna_kesa';
const PAPRIKA_STEAM_DURATION_MS=10*1000;
const PAPRIKA_STEAM_BAG_ASSETS=[
  'assets/paprika_steam_bag/empty.png',
  'assets/paprika_steam_bag/fill_1.png',
  'assets/paprika_steam_bag/fill_2.png',
  'assets/paprika_steam_bag/fill_3.png',
  'assets/paprika_steam_bag/fill_4.png',
];
const PAPRIKA_STEAM_BAG_CLOSED_ASSETS=[
  'assets/paprika_steam_bag/closed_1.png',
  'assets/paprika_steam_bag/closed_2.png',
  'assets/paprika_steam_bag/closed_3.png',
  'assets/paprika_steam_bag/closed_4.png',
  'assets/paprika_steam_bag/closed_5.png',
  'assets/paprika_steam_bag/closed_6.png'
];
const PAPRIKA_STEAM_BAG_DEF={
  id:PAPRIKA_STEAM_BAG_ID,
  type:'prop',
  subtype:'paprika_steam_bag',
  label:'Kesa za potparivanje paprika',
  src:PAPRIKA_STEAM_BAG_ASSETS[0],
  x:0,y:0,w:156,h:156,z:46,
  starter:true,placement:['table','floor'],
  shadowProfile:'tiny',snapProfile:'flat',category:'paprika-steam-bag'
};
const FIXED_GRINDER_DEF={
 id:'mlin_za_mesо',label:'Машина за млевење',
 src:'assets/items/grinder_fixed/grinder_body.png',
 x:0,y:0,w:158,h:286,z:95,starter:true,
 placement:['table'],shadowProfile:'tiny',snapProfile:'flat',
 category:'fixed-kitchen-machine',fixedMount:'table-left'
};
const KITCHEN_EQUIPMENT=[...catalogKitchenEquipment,PAPRIKA_STEAM_BAG_DEF,...WATER_VESSEL_PROPS,FIXED_GRINDER_DEF].filter((prop,i,arr)=>arr.findIndex(x=>x.id===prop.id)===i);
const CRATE_ZONE_ASSETS={
 table:'assets/crate_table.png',
 under:'assets/crate_under.png',
 floor:'assets/crate_floor.png'
};
const CRATE_STAGE_ASSETS={
 paradajz:{full:'assets/crate_states/full.png',medium:'assets/crate_states/medium.png',low:'assets/crate_states/low.png',empty:'assets/crate_states/empty.png'},
 paprika:{full:'assets/crate_states_paprika/full.png',medium:'assets/crate_states_paprika/medium.png',low:'assets/crate_states_paprika/low.png',empty:'assets/crate_states_paprika/empty.png'},
 luk:{full:'assets/crate_states_luk/full.png',medium:'assets/crate_states_luk/medium.png',low:'assets/crate_states_luk/low.png',empty:'assets/crate_states_luk/empty.png'},
 krastavac:{full:'assets/crate_states_cucumber/full.png',medium:'assets/crate_states_cucumber/medium.png',low:'assets/crate_states_cucumber/low.png',empty:'assets/crate_states_cucumber/empty.png'}
};
function getCrateStageSrc(count,vegKey='paradajz'){
 const c=Math.max(0,Math.min(10,+count||0)),set=CRATE_STAGE_ASSETS[vegKey]||CRATE_STAGE_ASSETS.paradajz;
 if(c<=0)return set.empty;
 if(c<=4)return set.low;
 if(c<=7)return set.medium;
 return set.full;
}
function updateCrateVisual(crate){
 if(!crate||crate.dataset.crate!=='1')return;
 const img=crate.querySelector('.body');
 if(!img)return;
 img.src=getCrateStageSrc(+crate.dataset.count||0,crate.dataset.vegKey||'paradajz');
}
const CRATE_ZONE_SIZES={
 table:{w:340,h:257},
 under:{w:340,h:257},
 floor:{w:340,h:257}
};
const CRATE_ZONE_FLATTEN={
 table:null,
 under:1.04,
 floor:1.10
};
let crateSpawnIndex=0;

const itemsData=CooksterCatalog.ITEMS;
const QUICK_TOOL_ITEM_IDS=new Set(['noz','sundjer','metla','rakija','opanci']);
const QUICK_TOOL_SLOTS=Object.freeze([
 {id:'hand',label:'Ruka',enabled:true},
 {id:'metla',label:'Metla',enabled:true},
 {id:'noz',label:'Nož',enabled:true},
 {id:'sundjer',label:'Sunđer',enabled:true},
 {id:'rakija',label:'Rakija',enabled:false},
 {id:'opanci',label:'Opanci',enabled:false},
 {id:'locked_top',label:'Zaključano',enabled:false},
 {id:'locked_bottom',label:'Zaključano',enabled:false}
]);

const COOKSTER_BUILD=window.CooksterBuild?.id||'unknown';
const OBJECT_CALIBRATION_MODE=window.__COOKSTER_OBJECT_CALIBRATION__===true;
let itemInstanceCounter=0;
function nextItemInstanceId(base='item'){
  itemInstanceCounter+=1;
  const safe=String(base||'item').replace(/[^a-zA-Z0-9_-]+/g,'_');
  return `${safe}__${Date.now().toString(36)}_${itemInstanceCounter.toString(36)}`;
}

const FREE_MODE=true;   // while the game is being built everything is free: money never goes down
let scale=1,fitScale=1,offsetX=0,offsetY=0,money=Math.max(CooksterState.player.money,FREE_MODE?99999:0),zCounter=80,toastTimer=null;
let quickWheelOpen=false,quickWheelPointerId=null,quickWheelActiveId=null,quickWheelCenter={x:0,y:0},quickWheelLastToolId='noz',quickWheelOpenTimeout=0;
let mouse={x:innerWidth/2,y:innerHeight/2},items=[],holding=null,hoverItem=null,rotating=null,rotateStartX=0,rotateStartY=0,rotateStartAngle=0,rotateStartTilt=0,placementGhost=null,placementState=null,originGhost=null,originState=null,placing=false,picking=false;
const BACKPACK_SLOT_COUNT=5;
const backpackContents=Array(BACKPACK_SLOT_COUNT).fill(null);
const backpackBusySlots=new Set(),backpackPendingStore=new Set();
let heldGrabState=null;
let backpackHeldPreview=null;
// Keep the live item collection available to scene helpers.
Object.defineProperty(window,'items',{get:()=>items,configurable:true});
// v198.5.106 — scroll-to-select quantity when hovering a market bag (later
// crates too). Scrolling up while over a bag increases how many items a
// left-click will take out at once, shown as a number badge by the cursor.
let bagPickTarget=null,bagPickQty=1,bagQtyBadge=null;
let pourTarget=null,pourBlockedTarget=null,pouring=false;
let isCutting=false,cutProgressEl=null;
let lastSpillAt=0;
let cleaning=false,cleanStainEl=null,cleanPointerId=null,cleanLastX=0,cleanLastY=0;
let stirring=false,stirVessel=null,stirPointerId=null,stirLastAngle=null,stirDirection=0,stirArc=0,stirLastTime=0,stirLastMixBucket=-1;
// v198.5.84 — cumulative absolute rotation (degrees) since this stir session
// began, used to delay the deep-stir vortex/blur until 2-3 full turns in.
let stirTotalRotation=0,stirDeepActive=false;
// v198.5.87 — angular momentum: the visual spin now has real inertia
// (deg/sec), smoothed toward the live gesture while stirring and left to
// coast/decay on its own (via a dedicated RAF loop) once the spoon is let go.
let stirAngularVelocity=0,stirMomentumFrame=null,stirMomentumWrap=null;
let stirLastRippleAt=0;
let stirReadyVessel=null,stirLastX=0,stirLastY=0,stirVisualTurn=0,stirScreenRect=null,currentContainerTarget=null;
let stirPendingEffort=0,stirPendingActive=0,stirLastApplyAt=0;
let faucetOn=false,panWashing=false,washPan=null,washPointerId=null,washLastAngle=null,washArc=0,washActiveTime=0,washLastTime=0,washDirection=0,washProgress=0;
let sinkProduceLayer=null,sinkWashTimer=0,sinkActiveDrops=0;
const sinkQueuedDropIds=new Set();
const SINK_PRODUCE_CAPACITY=30;
// Fill from the annotated bottom zone upward. The first ten positions all sit
// on the basin floor; only after those are occupied do later layers rise.
const SINK_PRODUCE_SLOTS=[
  // Dno: razbacane tačke, ne jedan horizontalni red.
  {u:.50,v:.81},{u:.28,v:.78},{u:.72,v:.78},{u:.12,v:.80},{u:.88,v:.80},
  {u:.39,v:.68},{u:.61,v:.68},{u:.19,v:.67},{u:.81,v:.67},{u:.50,v:.63},
  // Srednji sloj počinje tek kada je dno popunjeno.
  {u:.50,v:.56},{u:.28,v:.55},{u:.72,v:.55},{u:.13,v:.53},{u:.87,v:.53},
  {u:.39,v:.44},{u:.61,v:.44},{u:.20,v:.42},{u:.80,v:.42},{u:.50,v:.38},
  // Gornji sloj ostaje unutar prethodno označene ivice sudopere.
  {u:.50,v:.31},{u:.29,v:.30},{u:.71,v:.30},{u:.14,v:.28},{u:.86,v:.28},
  {u:.39,v:.20},{u:.61,v:.20},{u:.22,v:.17},{u:.78,v:.17},{u:.50,v:.12}
];
let simLast=performance.now();
const COOK_SIM_INTERVAL=.050; // 20 Hz thermal model; rendering remains rAF-driven where needed.
const marketQty=CooksterState.market;
const KNIFE_PARK={relX:0.22,relY:0.27,relAngle:-18};
let cameraIndex=0;
let cameraX=CENTER_OFFSET;

function getCameraX(){return 0;}
function applyCamera(){cameraX=getCameraX();const tx=offsetX-cameraX*scale;scene.style.transform=`translate(${tx}px,${offsetY}px) scale(${scale})`;updateArrowVisibility();}
function fitScene(){
 scale=Math.min(innerWidth/BASE_W,innerHeight/BASE_H);
 fitScale=scale;
 const sw=BASE_W*scale,sh=BASE_H*scale;
 offsetX=(innerWidth-sw)/2;offsetY=(innerHeight-sh)/2;
 // Side shelves sit only in the letterbox area. The playable scene and every
 // calibrated interaction coordinate stay exactly where they were.
 document.documentElement.style.setProperty('--ambient-side-gap','0px');
 applyCamera();
 updateUiOverlayViewport();
}
function screenToScene(x,y){return{x:((x-offsetX)/scale)+cameraX,y:(y-offsetY)/scale}}
function pointInRect(p,r){return !!p&&!!r&&p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom}
function sceneToScreen(x,y){return{x:(x-cameraX)*scale+offsetX,y:y*scale+offsetY}}
// Calibration editor view controls: zoom the complete scene around the cursor
// while preserving the same scene-space coordinate under the mouse.
window.CooksterCalibrationView={
 zoomAt(clientX,clientY,direction){
  const before=screenToScene(clientX,clientY),factor=direction>0?1.12:.8928571429;
  scale=Math.max(.55,Math.min(3.2,scale*factor));
  offsetX=clientX-(before.x-cameraX)*scale;
  offsetY=clientY-before.y*scale;
  applyCamera();
 },
 reset(){fitScene()}
};
function zoomGameAt(clientX,clientY,direction){
 const before=screenToScene(clientX,clientY),factor=direction>0?1.10:1/1.10;
 scale=Math.max(fitScale*.72,Math.min(fitScale*2.5,scale*factor));
 offsetX=clientX-(before.x-cameraX)*scale;
 offsetY=clientY-before.y*scale;
 applyCamera();
 if(holding&&!picking){moveHeld();updatePlacementGhost();}
}
window.addEventListener('wheel',e=>{
 if(document.body.classList.contains('scene-zone-calibration-active'))return;
 if(lightPanel.contains(e.target)||e.target.closest?.('#hud,#modal,#quickToolWheel,.edge-arrow'))return;
 const wheelItem=hoverItem||itemAt(e.clientX,e.clientY);
 if(wheelItem?.dataset?.marketBag==='1')return;
 e.preventDefault();
 zoomGameAt(e.clientX,e.clientY,e.deltaY<0?1:-1);
},{passive:false});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='0'){e.preventDefault();fitScene();}});
function faucetHit(x,y){const p=screenToScene(x,y);return p.x>=1426&&p.x<=1498&&p.y>=22&&p.y<=122}
function calibratedSinkGeometry(){
  const sink=window.CooksterSceneSurfaces?.calibratedZone?.('sink');
  if(sink?.top?.length>=4&&sink?.bottom?.length>=4)return sink;
  const top=(window.CooksterSceneSurfaces?.polygons?.sinkBasin||[
    {x:1370,y:55},{x:1572,y:55},{x:1580,y:166},{x:1391,y:166}
  ]).map(p=>({x:+p.x,y:+p.y}));
  const depth=46;
  return {kind:'volume',depth,top,bottom:top.map(p=>({x:p.x,y:p.y+depth})),vertices:top.concat(top.map(p=>({x:p.x,y:p.y+depth})))};
}
function sinkGeometryBounds(points=calibratedSinkGeometry().vertices){
  return points.reduce((b,p)=>({
    left:Math.min(b.left,p.x),right:Math.max(b.right,p.x),
    top:Math.min(b.top,p.y),bottom:Math.max(b.bottom,p.y)
  }),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
}
function sinkBasinBounds(){return sinkGeometryBounds(calibratedSinkGeometry().top)}
function calibratedSinkVisiblePolygon(g=calibratedSinkGeometry()){
  // The faucet occupies a U-shaped bite in the rear edge. Keeping it in the
  // mask prevents food from appearing behind the user's orange boundary.
  const uv=[
    [0,0],[.54,0],[.54,.08],[.53,.22],[.55,.29],[.61,.29],
    [.63,.24],[.64,0],[.91,0],[.97,.08],[1,.25],[1,1],[0,1]
  ];
  return uv.map(([u,v])=>sinkQuadPoint(g.top,u,v));
}
function sinkHit(x,y){
  const p=screenToScene(x,y),g=calibratedSinkGeometry();
  return pointInPoly(p.x,p.y,calibratedSinkVisiblePolygon(g));
}
function sinkQuadPoint(quad,u,v){
  const q=quad?.length>=4?quad:calibratedSinkGeometry().top;
  const top={x:q[0].x+(q[1].x-q[0].x)*u,y:q[0].y+(q[1].y-q[0].y)*u};
  const bottom={x:q[3].x+(q[2].x-q[3].x)*u,y:q[3].y+(q[2].y-q[3].y)*u};
  return {x:top.x+(bottom.x-top.x)*v,y:top.y+(bottom.y-top.y)*v};
}
function sinkProduceList(){
  CooksterState.kitchen??={};
  CooksterState.kitchen.sinkProduce??=[];
  return CooksterState.kitchen.sinkProduce;
}
function ensureSinkProduceLayer(){
  if(sinkProduceLayer?.isConnected)return sinkProduceLayer;
  sinkProduceLayer=document.createElement('div');
  sinkProduceLayer.id='sinkProduceLayer';
  sinkProduceLayer.setAttribute('aria-label','Voće i povrće u sudoperi');
  scene.appendChild(sinkProduceLayer);
  return sinkProduceLayer;
}
function renderSinkProduce(){
  const layer=ensureSinkProduceLayer();
  const list=sinkProduceList().slice(0,SINK_PRODUCE_CAPACITY);
  const geometry=calibratedSinkGeometry();
  const bounds=sinkGeometryBounds(geometry.vertices);
  const bw=Math.max(1,bounds.right-bounds.left),bh=Math.max(1,bounds.bottom-bounds.top);
  layer.style.left=bounds.left+'px';
  layer.style.top=bounds.top+'px';
  layer.style.width=bw+'px';
  layer.style.height=bh+'px';
  // No scene-wide mask here. Keep the vegetables visible while they are in
  // the sink; the failed front-wall mask used to cover the stove as well.
  layer.style.clipPath='none';
  layer.classList.toggle('washing',!!faucetOn&&list.length>0);
  layer.replaceChildren();
  list.forEach((entry,index)=>{
    const slot=SINK_PRODUCE_SLOTS[index]||SINK_PRODUCE_SLOTS[index%SINK_PRODUCE_SLOTS.length];
    const noiseX=(deterministicUnitNoise(`sink:${entry.id||index}`,index,12)-.5)*.018;
    const noiseY=(deterministicUnitNoise(`sink:${entry.id||index}`,index,18)-.5)*.018;
    const u=Math.max(.045,Math.min(.945,slot.u+noiseX));
    const v=Math.max(.075,Math.min(.825,slot.v+noiseY));
    // The calibrated depth still controls perspective shrink, but positions
    // remain on the visible opening plane so no pixels cross the orange edge.
    const fillBand=Math.floor(index/10);
    const depthT=Math.max(.42,.88-fillBand*.20);
    const position=sinkQuadPoint(geometry.top,u,v);
    const depthStrength=Math.max(.10,Math.min(.18,(+geometry.depth||46)/300));
    const visibleScale=1-depthT*depthStrength+v*.02;
    const img=document.createElement('img');
    img.className='sink-produce-piece';
    img.src=entry.src||'';
    img.alt=entry.label||'';
    img.draggable=false;
    img.dataset.sinkIndex=String(index);
    img.dataset.sinkId=entry.id||'';
    img.dataset.washed=entry.washed?'1':'0';
    if(sinkQueuedDropIds.has(entry.id))img.classList.add('drop-queued');
    img.style.left=(position.x-bounds.left).toFixed(2)+'px';
    img.style.top=(position.y-bounds.top).toFixed(2)+'px';
    img.style.width='48px';
    img.style.height='46px';
    img.style.setProperty('--sink-scale',visibleScale.toFixed(3));
    img.style.setProperty('--sink-scale-x',visibleScale.toFixed(3));
    img.style.setProperty('--sink-scale-y',visibleScale.toFixed(3));
    img.style.setProperty('--sink-rot',((deterministicUnitNoise(`sink-rot:${entry.id||index}`,index,22)-.5)*16).toFixed(2)+'deg');
    img.style.setProperty('--sink-drop-y','0px');
    img.style.setProperty('--sink-drop-r','0deg');
    img.style.zIndex=String(10+Math.round(position.y)*10+index);
    img.title=entry.washed?'Узми опрано поврће':'Подигни воду да опереш';
    img.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(entry.washed)takeSinkProduce(index);
      else showToast('Пусти воду да опереш намирнице.');
    });
    layer.appendChild(img);
  });
}
function beginSinkDropPhysics(entryId){
  const layer=ensureSinkProduceLayer();
  const img=[...layer.querySelectorAll('.sink-produce-piece')]
    .find(node=>node.dataset.sinkId===String(entryId));
  if(!img)return;
  const entry=sinkProduceList().find(item=>item.id===entryId)||{};
  const mass=Math.max(.68,Math.min(1.45,+entry.mass||1));
  const baseScale=Math.max(.1,parseFloat(img.style.getPropertyValue('--sink-scale'))||1);
  const gravity=2600/mass;
  const restitution=Math.max(.20,Math.min(.36,.30-(mass-1)*.05));
  const startY=-Math.max(76,Math.min(108,88+mass*7));
  let y=startY,velocity=0,last=performance.now(),elapsed=0,bounces=0,impact=0;
  let finished=false;
  const finish=()=>{
    if(finished)return;finished=true;
    sinkActiveDrops=Math.max(0,sinkActiveDrops-1);
    if(!sinkActiveDrops)layer.classList.remove('drop-physics-active');
  };
  sinkActiveDrops++;
  layer.classList.add('drop-physics-active');
  sinkQueuedDropIds.delete(entryId);
  img.classList.remove('drop-queued');
  img.classList.add('physics-dropping');
  img.style.pointerEvents='none';
  img.style.setProperty('--sink-drop-y',`${y.toFixed(2)}px`);
  const frame=now=>{
    if(!img.isConnected){finish();return;}
    const dt=Math.min(.032,Math.max(.001,(now-last)/1000));last=now;elapsed+=dt;
    velocity+=gravity*dt;y+=velocity*dt;
    if(y>=0){
      y=0;
      impact=Math.min(1,Math.abs(velocity)/900);
      bounces++;
      velocity=-Math.abs(velocity)*restitution;
      // The impact compresses the vegetable briefly before it springs back.
      img.style.setProperty('--sink-scale-x',(baseScale*(1+impact*.13)).toFixed(3));
      img.style.setProperty('--sink-scale-y',(baseScale*(1-impact*.20)).toFixed(3));
    }else{
      const relax=Math.min(1,dt*14);
      impact+=(0-impact)*relax;
      img.style.setProperty('--sink-scale-x',(baseScale*(1+impact*.13)).toFixed(3));
      img.style.setProperty('--sink-scale-y',(baseScale*(1-impact*.20)).toFixed(3));
    }
    img.style.setProperty('--sink-drop-y',`${y.toFixed(2)}px`);
    img.style.setProperty('--sink-drop-r',`${(velocity*.006).toFixed(2)}deg`);
    const settled=(bounces>=2&&Math.abs(velocity)<42&&y===0)||elapsed>1.15;
    if(settled){
      img.style.setProperty('--sink-drop-y','0px');
      img.style.setProperty('--sink-drop-r','0deg');
      img.style.setProperty('--sink-scale-x',baseScale.toFixed(3));
      img.style.setProperty('--sink-scale-y',baseScale.toFixed(3));
      img.classList.remove('physics-dropping');
      img.style.pointerEvents='auto';
      finish();
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function makeSinkProduceEntry(meta,amount=1){
  return {
    id:`sink_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    key:meta.key,baseKey:meta.baseKey||meta.key,type:meta.type,
    form:meta.form||'',cutState:meta.cutState||'whole',
    label:meta.label||meta.key,src:meta.src||'',washed:false,
    amount:Math.max(1,Math.round(+amount||1)),
    mass:meta.type==='fruit'?.84:(meta.baseKey==='luk'?1.12:(meta.baseKey==='paprika'?.92:1))
  };
}
function addProduceToSink(item){
  const meta=ingredientVisualMeta(item);
  if(!meta||!['fruit','vegetable'].includes(meta.type))return false;
  const list=sinkProduceList();
  if(list.length>=SINK_PRODUCE_CAPACITY){
    showToast('Sudopera je puna — izvadi oprane namirnice.');
    return true;
  }
  const entry=makeSinkProduceEntry(meta,1);
  list.push(entry);
  removeItem(item);
  holding=null;
  hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();
  renderSinkProduce();
  CooksterSave.schedule();
  showToast(`${entry.label} je stavljeno u sudoperu.`);
  if(faucetOn)startSinkProduceWash();
  // startSinkProduceWash re-renders once more when the faucet is open.
  // Start physics only after the final DOM representation exists.
  beginSinkDropPhysics(entry.id);
  return true;
}
function pourMarketBagIntoSink(bag){
  if(!bag||bag.dataset.marketBag!=='1')return false;
  const count=Math.max(0,Math.round(+bag.dataset.count||0));
  if(count<=0){showToast('Kesa je prazna.');return true;}
  const key=bag.dataset.vegKey||bag.dataset.marketProductKey||'';
  const def=VEGETABLES[key];
  if(!def){showToast('Sadržaj ove kese ne može u sudoperu.');return true;}
  const list=sinkProduceList();
  const free=Math.max(0,SINK_PRODUCE_CAPACITY-list.length);
  if(free<=0){showToast('Sudopera je puna — prvo izvadi oprane namirnice.');return true;}

  // Every unit leaves the bag. When a very large bag contains more units than
  // visual slots, a slot stores a small pile through its amount value.
  const visualCount=Math.min(count,free);
  const baseAmount=Math.floor(count/visualCount);
  const remainder=count%visualCount;
  const entries=[];
  for(let i=0;i<visualCount;i++){
    const amount=baseAmount+(i<remainder?1:0);
    const entry=makeSinkProduceEntry({
      key:`${key}_celo`,baseKey:key,type:'vegetable',form:'whole',cutState:'whole',
      label:def.label||bag.dataset.marketProductLabel||key,src:def.src||''
    },amount);
    sinkQueuedDropIds.add(entry.id);
    entries.push(entry);
    list.push(entry);
  }

  bag.dataset.count='0';
  renderMarketBag(bag);
  const oldAngle=+bag.dataset.angle||0;
  bag.dataset.sinkPouring='1';
  bag.dataset.angle=String(oldAngle+68);
  updatePlacementGhost();
  renderSinkProduce();
  if(faucetOn)startSinkProduceWash();
  entries.forEach((entry,index)=>{
    setTimeout(()=>beginSinkDropPhysics(entry.id),index*32);
  });
  setTimeout(()=>{
    if(bag?.isConnected){
      bag.dataset.angle=String(oldAngle);
      delete bag.dataset.sinkPouring;
      updatePlacementGhost();
    }
  },Math.max(420,entries.length*32+120));
  playSfxVariant('pickup',.16);
  CooksterSave.schedule();
  showToast(`${def.label} × ${count} — sadržaj kese se sipa u sudoperu.`);
  return true;
}
function takeSinkProduce(index){
  const list=sinkProduceList();
  const entry=list[index];
  if(!entry||!entry.washed)return false;
  const amount=Math.max(1,Math.round(+entry.amount||1));
  if(amount>1)entry.amount=amount-1;
  else list.splice(index,1);
  renderSinkProduce();
  const base=entry.baseKey||String(entry.key||'').replace(/_(?:diced|celo)$/,'');
  const isFruit=entry.type==='fruit';
  const def=(isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES)[base]||{};
  const cut=entry.cutState||'whole';
  // Sink artwork is deliberately smaller because of the recessed depth.
  // Once a piece leaves the sink, restore the canonical table dimensions
  // instead of leaking the 48px sink fallback into the held item.
  const displayW=cut==='diced'?(+def.dicedW||+def.w||52)
    :cut==='sliced'?(+def.slicedW||+def.w||52):(+def.w||52);
  const displayH=cut==='diced'?(+def.dicedH||+def.h||52)
    :cut==='sliced'?(+def.slicedH||+def.h||52):(+def.h||52);
  const el=makeItem({
    id:`sink_taken_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    label:entry.label,src:entry.src,x:1484,y:205,
    w:displayW,h:displayH,z:++zCounter,snapProfile:'produce'
  });
  if(isFruit)el.dataset.fruit='1';else el.dataset.vegetable='1';
  el.dataset[isFruit?'fruitKey':'vegKey']=base;
  el.dataset.cutState=entry.cutState||'whole';
  if(entry.washed)el.dataset.washed='1';
  if(entry.key?.startsWith('paprika_pecena'))el.dataset.vegKey='paprika';
  setPose(el,1484,205,1);
  startHolding(el);
  CooksterSave.schedule();
  showToast(`${entry.label} je izвађeno iz sudopere.`);
  return true;
}
function startSinkProduceWash(){
  const list=sinkProduceList();
  if(!list.length)return;
  list.forEach(entry=>{entry.washing=true;});
  renderSinkProduce();
  if(sinkWashTimer)clearTimeout(sinkWashTimer);
  sinkWashTimer=setTimeout(()=>{
    sinkWashTimer=0;
    if(!faucetOn)return;
    sinkProduceList().forEach(entry=>{
      entry.washed=true;
      delete entry.washing;
    });
    renderSinkProduce();
    CooksterSave.schedule();
    showToast('Voće i povrće je oprano — klikni na namirnicu u sudoperi da je uzmeš.');
  },2600);
}
function normalizeAngleDelta(rad){
 while(rad>Math.PI)rad-=Math.PI*2;
 while(rad<-Math.PI)rad+=Math.PI*2;
 return rad;
}
function isStirSpoon(el){return !!el&&el.dataset.itemId==='kasika_mesanje';}
function slicedIngredientKinds(vessel){
 if(!vessel||!isHeatableCookwareItem(vessel))return [];
 const counts=CooksterPan.counts(vessel);
 return Object.keys(counts).filter(key=>{
   if((+counts[key]||0)<=0)return false;
    if(key.endsWith('_celo'))return false;
     const roastedPepper=isRoastedChoppedPepperKey(key);
     const roastedEggplant=isRoastedUnpeeledEggplantKey(key);
     const roastedChopped=roastedPepper||roastedEggplant;
     if(key.startsWith('paprika_pecena')&&!roastedPepper)return false;
    const diced=key.endsWith('_diced')||roastedChopped;
     const base=roastedPepper?'paprika':(roastedEggplant?'patlidzan':(diced?key.slice(0,-6):key));
     const def=VEGETABLES[base]||CooksterCatalog.FRUITS?.[base];
   return diced?!!(def?.dicedSrc||def?.slicedSrc):!!def?.slicedSrc;
 });
}
// Stirring works in every vessel: pans and pots keep their cooking model, bowls use the container model (mix only).
function stirTotal(vessel){return isHeatableCookwareItem(vessel)?CooksterPan.total(vessel):CooksterContainer.total(vessel);}
function stirModelFor(vessel){
 if(isHeatableCookwareItem(vessel))return CooksterPan.read(vessel);
 const m=CooksterContainer.read(vessel),ingredients={};
 for(const [k,e] of Object.entries(m.items||{}))if(e.type!=='staple')ingredients[k]=Math.max(0,+e.count||0);
 return {ingredients,burnt:false,mix:+m.transfer?.mix||0,batches:m.transfer?.batches||[],heat:0};
}
function stirMetaFor(vessel){return isHeatableCookwareItem(vessel)?readPanIngredientMeta(vessel):CooksterContainer.read(vessel).items;}
function stirEligible(vessel){
 if(!vessel||!isContainerItem(vessel))return false;
 if(stirTotal(vessel)<=0)return false;
 if(isHeatableCookwareItem(vessel)&&CooksterPan.read(vessel).burnt)return false;
 return true;
}
function stirVesselAt(x,y,proximity=true){
 let best=null,bestScore=Infinity;
 for(const v of items){
   if(v===holding||!stirEligible(v))continue;
   // v198.5.115 — this used to check only the small inner food-visible
   // area, so hovering "generally over the pot" often fell just outside
   // it (you had to find the narrow strip near its edge instead). Use the
   // WHOLE vessel's own bounding box instead — bring the spoon anywhere
   // over the pot and it's ready to stir immediately.
   const r=v.getBoundingClientRect();
   const cx=r.left+r.width*.50,cy=r.top+r.height*.52;
   const rx=Math.max(30,r.width*(proximity?.60:.42));
   const ry=Math.max(26,r.height*(proximity?.62:.44));
   const nx=(x-cx)/rx,ny=(y-cy)/ry;
   const score=nx*nx+ny*ny;
   if(score<=1&&score<bestScore){best=v;bestScore=score;}
 }
 return best;
}
function clearStirReady(){
 if(stirReadyVessel)stirReadyVessel.classList.remove('stir-ready-target');
 stirReadyVessel=null;
 if(holding&&isStirSpoon(holding))holding.classList.remove('stir-ready-tool');
}
function updateStirReady(){
 if(stirring)return stirVessel;
 clearStirReady();
 if(!holding||!isStirSpoon(holding)||picking||placing)return null;
 const vessel=stirVesselAt(mouse.x,mouse.y,true);
 if(!vessel)return null;
 stirReadyVessel=vessel;
 vessel.classList.add('stir-ready-target');
 holding.classList.add('stir-ready-tool');
 // When the spoon has a valid cooking target, the target glow replaces the
 // ordinary placement ghost. This makes the interaction read as "use tool here".
 hidePlacementGhost();
 return vessel;
}
function stirCenterScreen(vessel){
 const content=isPanItem(vessel)?vessel._panContent:vessel._vesselContent;
 const r=(stirring&&vessel===stirVessel&&stirScreenRect)
   ? stirScreenRect
   : (content||vessel).getBoundingClientRect();
 return {x:r.left+r.width*.50,y:r.top+r.height*.52};
}
let stirDipEl=null;
function ensureStirDipOverlay(){
  if(!stirDipEl){
    stirDipEl=document.createElement('div');
    stirDipEl.id='stirDipOverlay';
    scene.appendChild(stirDipEl);
  }
  return stirDipEl;
}
function captureStirOrbitAnchor(el,index=0){
  if(!el)return;
  const x=parseFloat(el.style.left),y=parseFloat(el.style.top);
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  const dx=x-50,dy=y-50;
  const radius=Math.max(3,Math.hypot(dx,dy));
  const seeded=deterministicUnitNoise(el.dataset.calibrationRef||'piece',index,79)*Math.PI*2-Math.PI;
  el.dataset.orbitRadius=radius.toFixed(3);
  el.dataset.orbitAngle0=(Math.hypot(dx,dy)>3?Math.atan2(dy,dx):seeded).toFixed(5);
  el.dataset.orbitPhase='0';
  el.dataset.orbitVelocity='0';
}
function captureStirOrbitAnchors(wrap){
  if(!wrap)return;
  wrap.querySelectorAll('.exact-chopped-rotor:not(.stir-coverage-rotor) .exact-chopped-sprite')
    .forEach((el,index)=>captureStirOrbitAnchor(el,index));
}
function resetStirPieceDeformation(wrap){
  if(!wrap)return;
  wrap.querySelectorAll('.exact-chopped-rotor:not(.stir-coverage-rotor):not(.trail-ghost-rotor) .exact-chopped-sprite').forEach(el=>{
    if(Number.isFinite(+el.dataset.juggleLeft))el.style.left=(+el.dataset.juggleLeft).toFixed(3)+'%';
    if(Number.isFinite(+el.dataset.juggleTop))el.style.top=(+el.dataset.juggleTop).toFixed(3)+'%';
    el.dataset.orbitVelocity='0';
    el.style.setProperty('--stir-lift','0%');
    el.style.setProperty('--stir-squash-x','1');
    el.style.setProperty('--stir-squash-y','1');
    el.style.setProperty('--wobble-rot','0deg');
  });
}
// v198.5.121 — per-piece tangential "force": each chopped piece eases its
// OWN angle toward the shared target angle (derived from stirVisualTurn),
// at its own speed (heavier "mass" = slower to catch up). No single rigid
// rotation of the whole tray — many independently-lagging pieces reads as
// a real loose/dense mixture being dragged around, not a spinning image.
function applyOrbitPhysics(wrap,targetAngleRad,dt){
  if(!wrap)return;
  const vessel=wrap.closest?.('.item');
  const pieces=wrap.querySelectorAll(
    '.exact-chopped-rotor:not(.stir-coverage-rotor):not(.trail-ghost-rotor) .exact-chopped-sprite[data-orbit-radius]'
  );
  const energy=Math.max(0,Math.min(1,Math.abs(stirAngularVelocity)/48));
  for(const el of pieces){
    const radius=+el.dataset.orbitRadius||0;
    if(radius<=0)continue;
    const angle0=+el.dataset.orbitAngle0||0;
    const mass=Math.max(.3,+el.dataset.orbitMass||1);
    let phase=+el.dataset.orbitPhase||0;
    let velocity=+el.dataset.orbitVelocity||0;

    // Bone-like spring attachment: the spoon pulls every piece toward the
    // shared orbit, but each piece has its own mass, lag and small overshoot.
    // This reads as a loose mixture being dragged through itself rather than
    // one flat image rotating around its centre.
    const spring=9.5/mass;
    const damping=4.6+mass*.55;
    velocity+=(targetAngleRad-phase)*spring*dt;
    velocity*=Math.exp(-damping*dt);
    velocity=Math.max(-4.2,Math.min(4.2,velocity));
    phase+=velocity*dt;
    el.dataset.orbitPhase=phase.toFixed(5);
    el.dataset.orbitVelocity=velocity.toFixed(5);
    const finalAngle=angle0+phase;
    const radialFlex=1+Math.sin(finalAngle*2+mass)*.045*energy;
    const liveRadius=radius*radialFlex;
    el.style.left=(50+Math.cos(finalAngle)*liveRadius).toFixed(3)+'%';
    el.style.top=(50+Math.sin(finalAngle)*liveRadius).toFixed(3)+'%';
    el.style.setProperty('--stir-lift',(-Math.abs(Math.sin(finalAngle))*2.4*energy).toFixed(2)+'%');
    el.style.setProperty('--stir-squash-x',(1+Math.cos(finalAngle)*.035*energy).toFixed(4));
    el.style.setProperty('--stir-squash-y',(1-Math.cos(finalAngle)*.025*energy).toFixed(4));
    el.style.setProperty('--wobble-rot',Math.max(-8,Math.min(8,velocity*6.5)).toFixed(2)+'deg');
  }
}
// v198.5.121 — animate the swirl-distortion noise (see index.html's SVG
// filter) so it reads as living/flowing rather than a static warp. Only
// costs anything while the filter is actually visible (gated by CSS to
// .stir-deep), but the tiny attribute nudge itself is cheap enough to just
// always run.
let cooksterSwirlPhase=0;
setInterval(()=>{
  const noise=document.getElementById('cooksterSwirlNoise');
  if(!noise)return;
  cooksterSwirlPhase+=0.02;
  const fx=(0.012+Math.sin(cooksterSwirlPhase)*0.004).toFixed(4);
  const fy=(0.03+Math.cos(cooksterSwirlPhase*.8)*0.008).toFixed(4);
  noise.setAttribute('baseFrequency',`${fx} ${fy}`);
},110);
function positionStirSpoon(e){
 if(!stirring||!holding||!isStirSpoon(holding)||!stirVessel)return;
 const p=screenToScene(e.clientX,e.clientY);
 const vis=Math.max(.72,Math.min(.98,(+stirVessel.dataset.vis||1)*.88));
 const bw=+holding.dataset.baseW||holding.offsetWidth||70;
 const bh=+holding.dataset.baseH||holding.offsetHeight||120;
 const w=bw*vis,h=bh*vis;

 // During stirring the spoon moves at pointer-event frequency. Moving left/top
 // through setPose forced layout repeatedly. Keep size fixed and move on the
 // compositor with translate3d instead.
 if(holding._stirTransformVis!==vis){
   holding._stirTransformVis=vis;
   holding.style.width=w+'px';
   holding.style.height=h+'px';
   holding.style.left='0px';
   holding.style.top='0px';
   holding.style.transformOrigin='50% 50%';
   holding.style.willChange='transform';
 }
 // Lower the spoon into the dish so its bowl sits below the food surface.
 holding.style.transform=`translate3d(${(p.x-w/2).toFixed(2)}px,${(p.y-h*.82).toFixed(2)}px,0) perspective(1200px) rotateX(7deg) rotateZ(180deg)`;
 holding.style.zIndex=String(Math.max(11000,(parseInt(stirVessel.style.zIndex||0,10)||0)+160));
 if(holding._contactShadow)holding._contactShadow.style.opacity='0';
 // v198.5.114 — "the spoon actually dips into the food": a small soft blob,
 // tinted to the current dish's own blended color, sits ON TOP of the
 // spoon's tip (roughly where it meets the food, near p.x/p.y — the anchor
 // point the spoon transform is built from) at a slightly higher z-index
 // than the spoon itself. It reads as food covering/wrapping the last bit
 // of the spoon, instead of the spoon always floating flatly above
 // everything. Cheap trick — no need to actually crop/mask the spoon
 // sprite or the food layer.
 const dip=ensureStirDipOverlay();
 const model=stirModelFor(stirVessel);
 const mix=allSlicedIngredientMix(model.ingredients||{},stirMetaFor(stirVessel));
 if(false&&mix.length){
   const [dr,dg,db]=ingredientMixBaseColor(mix,1);
   dip.style.background=`radial-gradient(circle at 42% 38%,rgba(${dr},${dg},${db},.62) 0%,rgba(${dr},${dg},${db},.30) 55%,transparent 78%)`;
   // Cover the spoon bowl with the dish surface; only the handle should read
   // above the food while stirring.
   const dw=w*.92,dh=w*.68;
   dip.style.width=dw+'px';
   dip.style.height=dh+'px';
   dip.style.left=(p.x-dw/2).toFixed(2)+'px';
   dip.style.top=(p.y-dh*.35).toFixed(2)+'px';
   dip.style.zIndex=String(Math.max(11001,(parseInt(stirVessel.style.zIndex||0,10)||0)+161));
   dip.style.display='block';
 }else{
   dip.style.display='none';
 }
}

function commitPendingStir(force=false){
 if(!stirVessel||stirPendingEffort<=0)return null;
 const now=performance.now();
 if(!force&&now-stirLastApplyAt<34)return null; // ~30 Hz expensive state/DOM commits

 const effort=Math.min(.9,stirPendingEffort);
 const activeSeconds=Math.min(.12,stirPendingActive);
 stirPendingEffort=0;
 stirPendingActive=0;
 stirLastApplyAt=now;

 if(!isHeatableCookwareItem(stirVessel)){
   // bowl / basin: no cooking, only the mixing level changes
   const cm=CooksterContainer.read(stirVessel),beforeMix=+cm.transfer.mix||0;
   cm.transfer.mix=Math.min(1,beforeMix+(activeSeconds>0?activeSeconds/2.0:effort/(Math.PI*2*1.55)));
   CooksterContainer.write(stirVessel,cm);
   renderVesselContents(stirVessel);
   if(beforeMix<.995&&cm.transfer.mix>=.995){
     stirVessel.classList.add('stir-mixed-pop');
     setTimeout(()=>stirVessel?.classList.remove('stir-mixed-pop'),360);
     showToast('Sastojci su potpuno izmešani.');
   }
   stirLastMixBucket=Math.floor(cm.transfer.mix*20);
   stirVessel.dataset.lastStirAt=String(Date.now());
   stirVessel.dataset.lastStirArc=String(stirArc);
   return cm;
 }
 const before=CooksterPan.read(stirVessel);
 const beforeState=window.CooksterFoodStateMachine?.vesselState(before);
 const beforeMixed=(+before.mix||0)>=.995;

 const after=CooksterPan.stir(stirVessel,effort,activeSeconds);
 const afterState=window.CooksterFoodStateMachine?.vesselState(after);
 const afterMixed=(+after.mix||0)>=.995;
 const count=panModelTotal(after);

 renderCookwareContents(stirVessel,after,afterState);
 updateCookingStatus(stirVessel,after,afterState,count,vesselIsHeating(stirVessel));

 if(!beforeMixed&&afterMixed){
   stirVessel.classList.add('stir-mixed-pop');
   setTimeout(()=>stirVessel?.classList.remove('stir-mixed-pop'),360);
   showToast('Sastojci su potpuno izmešani.');
 }

 stirLastMixBucket=Math.floor((+after.mix||0)*20);
 stirVessel._panStatus?.classList.add('stirring');
 stirVessel.dataset.lastStirAt=String(Date.now());
 stirVessel.dataset.lastStirArc=String(stirArc);

 if(beforeState&&afterState&&afterState.progress<beforeState.progress)
   stirVessel.dataset.stirCooling='1';
 else delete stirVessel.dataset.stirCooling;

 return after;
}
function beginStirring(vessel,e){
 if(!holding||!isStirSpoon(holding)||!vessel||!isContainerItem(vessel))return false;

 if(stirTotal(vessel)<=0){
   showToast('Posuđe je prazno — nema šta da se meša.');
   return true;
 }
 const model=stirModelFor(vessel);
 if(model.burnt){
   showToast('Hrana je već izgorela — mešanje je više ne može spasiti.');
   return true;
 }

 stirring=true;
 stirVessel=vessel;
 stirPointerId=e.pointerId;
 stirDirection=0;
 stirArc=0;
 stirLastTime=performance.now();
 stirLastApplyAt=stirLastTime;
 stirPendingEffort=0;
 stirPendingActive=0;
 stirLastMixBucket=Math.floor((+model.mix||0)*20);
 // A new gesture always starts from rest.  Carrying stale momentum across
 // sessions caused the second stir to stall and then jump to high speed.
 if(stirMomentumFrame){cancelAnimationFrame(stirMomentumFrame);stirMomentumFrame=null;}
 stirMomentumWrap=null;
 stirAngularVelocity=0;
 stirLastX=e.clientX;stirLastY=e.clientY;
 stirTotalRotation=0;stirDeepActive=false;
  stirVisualTurn=0;

 const content=isPanItem(vessel)?vessel._panContent:vessel._vesselContent;
  if(content){
    content.style.setProperty('--stir-turn','0deg');
    captureStirOrbitAnchors(content);
  }
 const rawRect=(content||vessel).getBoundingClientRect();
 stirScreenRect={left:rawRect.left,top:rawRect.top,width:rawRect.width,height:rawRect.height};
 const c=stirCenterScreen(vessel);
 stirLastAngle=Math.atan2(e.clientY-c.y,e.clientX-c.x);
 window.CooksterCanvasMesh?.setGesture?.({x:e.clientX,y:e.clientY,speed:0,angle:stirLastAngle,radius:Math.hypot(e.clientX-c.x,e.clientY-c.y),active:true});

 clearStirReady();
 hidePlacementGhost();hideOriginGhost();clearHeldPlacementState(holding);
 holding.classList.add('stirring-tool');
 vessel.classList.add('stirring-vessel');
 positionStirSpoon(e);

 return true;
}
function updateStirring(e){
 if(!stirring||!stirVessel||!holding||!isStirSpoon(holding))return;
 positionStirSpoon(e);

 const c=stirCenterScreen(stirVessel);
 const rx=e.clientX-c.x,ry=e.clientY-c.y;
 const radius=Math.max(1,Math.hypot(rx,ry));
 const vr=stirScreenRect||stirVessel.getBoundingClientRect();
 const minR=Math.max(8,Math.min(vr.width,vr.height)*.07);
 // v198.5.116 — no more outer limit: mešanje se sad registruje i van
 // granica šerpe, ne samo unutar nje. Samo mala minimalna udaljenost od
 // centra ostaje (da izbegnemo šum tačno na sredini gde je pravac nejasan).

 const moveX=e.clientX-stirLastX,moveY=e.clientY-stirLastY;
 stirLastX=e.clientX;stirLastY=e.clientY;
 const moveLen=Math.hypot(moveX,moveY);
 if(moveLen>0)window.CooksterPieceSim?.stir(stirVessel,e.clientX,e.clientY,moveX,moveY);
 const angleNow=Math.atan2(ry,rx);
 window.CooksterCanvasMesh?.setGesture?.({x:e.clientX,y:e.clientY,speed:moveLen,angle:angleNow,radius,active:true});
 let angleDelta=angleNow-stirLastAngle;
 while(angleDelta>Math.PI)angleDelta-=Math.PI*2;
 while(angleDelta<-Math.PI)angleDelta+=Math.PI*2;
 stirLastAngle=angleNow;
 if(moveLen<1.2||radius<minR)return;
 if(Math.abs(angleDelta)<.002)return;

 const now=performance.now();
 const dt=Math.max(.008,Math.min(.08,(now-stirLastTime)/1000||.016));
 stirLastTime=now;

 // Do not amplify motion near the centre: using the tiny pointer radius as a
 // divisor made the same hand movement snap into fast lateral-looking jumps.
 const signedArc=Math.max(-dt*2.2,Math.min(dt*2.2,angleDelta));
 const effort=Math.abs(signedArc)*.72;
 if(effort<=.002)return;

 const nextDirection=Math.sign(signedArc)||stirDirection;
 const directionChanged=nextDirection!==stirDirection;
 stirDirection=nextDirection;
 stirArc+=effort;
 // v198.5.87 — angular momentum: don't snap the visual angle straight to the
 // gesture. Ease the VELOCITY toward what this gesture implies, then
 // integrate that velocity into the angle. Starting to stir (or reversing
 // direction) now visibly ramps up instead of jumping to full speed.
 // Mouse speed is only a steering input. Cap the dish's actual angular speed
 // so even frantic hand motion still feels like a heavy, thick mixture.
 const impliedVelocity=Math.max(-48,Math.min(48,(signedArc*180/Math.PI*1.20)/dt)); // deg/sec
 // v198.5.116 — "teško, kao da je nešto veliko i teško da se pomeri":
 // mnogo sporije uvlačenje ka trenutnoj brzini gesta, bez obzira koliko
 // brzo fizički mešaš mišem — uvek isto sporo ubrzava do pune brzine.
 stirAngularVelocity+=(impliedVelocity-stirAngularVelocity)*Math.min(1,dt*1.15);
 const turnDeltaDeg=stirAngularVelocity*dt;
 stirVisualTurn+=turnDeltaDeg;
 stirTotalRotation+=Math.abs(turnDeltaDeg);

 // Rotation is compositor-only and remains pointer-smooth even though thermal
 // state commits are deliberately batched to ~30 Hz below.
 const wrap=isPanItem(stirVessel)?stirVessel._panContent:stirVessel._vesselContent;
 if(wrap){
   wrap.style.setProperty('--stir-turn',stirVisualTurn.toFixed(2)+'deg');
   applyOrbitPhysics(wrap,stirVisualTurn*Math.PI/180,dt);
   if(directionChanged)wrap.dataset.stirDirection=stirDirection>0?'right':'left';
   // v198.5.84 — the vortex/radial-blur only kicks in after ~2.5 full turns
   // of real stirring, so it feels earned rather than instant.
   // v198.5.108 — deep-stir effects (jiggle, radial blur, per-piece wobble)
   // are pot-only now, per request — pans never get them.
   if(!stirDeepActive&&stirTotalRotation>=900&&!isPanItem(stirVessel)){
     stirDeepActive=true;
     stirVessel.classList.add('stir-deep');
   }
   // v198.5.82 — comet-trail ghosts trail a fixed number of degrees BEHIND
   // the current spoon direction (opposite sign of stirDirection), so the
   // smear always stretches away from where the food is actually heading.
   const dir=stirDirection||1;
   const nearGhost=wrap.querySelector('.trail-ghost-near');
   const farGhost=wrap.querySelector('.trail-ghost-far');
   if(nearGhost)nearGhost.style.setProperty('--stir-turn',(stirVisualTurn-dir*10).toFixed(2)+'deg');
   if(farGhost)farGhost.style.setProperty('--stir-turn',(stirVisualTurn-dir*20).toFixed(2)+'deg');

   // v198.5.104 — spawn a ripple ring at the spoon's current position,
   // throttled so it reads as a steady pulse rather than a solid smear.
   const rippleNow=performance.now();
   if(rippleNow-stirLastRippleAt>190&&stirScreenRect){
     stirLastRippleAt=rippleNow;
     const pool=stirVessel._stirRipples;
     if(pool){
       const rings=pool.children;
       const cursor=stirVessel._stirRippleCursor||0;
       const ring=rings[cursor%rings.length];
       stirVessel._stirRippleCursor=cursor+1;
       const localX=((e.clientX-stirScreenRect.left)/Math.max(1,stirScreenRect.width))*100;
       const localY=((e.clientY-stirScreenRect.top)/Math.max(1,stirScreenRect.height))*100;
       ring.style.left=localX.toFixed(2)+'%';
       ring.style.top=localY.toFixed(2)+'%';
       // Force the animation to restart even if it's already running.
       ring.classList.remove('active');
       void ring.offsetWidth;
       ring.classList.add('active');
     }
   }
 }

 stirPendingEffort+=effort;
 stirPendingActive+=dt;
 commitPendingStir(false);
}
function endStirring(finished=false,message=''){
 if(!stirring)return;
 commitPendingStir(true);
 const vessel=stirVessel;
 const wrap=vessel?(isPanItem(vessel)?vessel._panContent:vessel._vesselContent):null;
 if(vessel){
   vessel.classList.remove('stirring-vessel');
   // v198.5.87 — stir-deep (vortex/radial-blur) is intentionally left ON
   // here; it's removed once the momentum coast-down below actually
   // finishes, so those effects fade out together with the physical
   // stop instead of snapping off while the pile is still visibly spinning.
   vessel._panStatus?.classList.remove('stirring');
   delete vessel.dataset.stirCooling;
   renderCookwareContents(vessel);
   updateCookingStatus(vessel);
 }
 if(holding){
   holding.classList.remove('stirring-tool');
   delete holding._stirTransformVis;
   holding.style.willChange='';
   const preview=heldPreviewPoseFor(holding);
   setPose(holding,preview.cx,preview.by,preview.vis);
   holding.style.transformOrigin='50% 50%';
   holding.style.transform=`perspective(1200px) rotateX(${itemTiltValue(holding,holding.dataset.tilt||0)*.45}deg) rotateZ(${+(holding.dataset.angle||0)+preview.carryAngle}deg)`;
   holding.style.zIndex='9999';
 }
 stirring=false;stirVessel=null;stirPointerId=null;stirLastAngle=null;stirDirection=0;stirArc=0;stirLastTime=0;stirLastMixBucket=-1;
 if(stirDipEl)stirDipEl.style.display='none';
 stirLastX=0;stirLastY=0;stirScreenRect=null;
 stirPendingEffort=0;stirPendingActive=0;stirLastApplyAt=0;
 window.CooksterCanvasMesh?.setGesture?.({active:false,speed:0});
 // v198.5.87 — let the spin coast/decay on its own instead of freezing.
 if(wrap&&Math.abs(stirAngularVelocity)>1){
   startStirMomentumDecay(wrap,vessel);
 }else{
   stirAngularVelocity=0;
   vessel?.classList.remove('stir-deep');
   resetStirPieceDeformation(wrap);
 }
 if(message)showToast(message);
 CooksterSave.schedule();
 if(holding)updatePlacementGhost();
 updateHover();
 updateStirReady();
}

// v198.5.87 — momentum coast-down: keeps spinning the pile at a decaying
// angular velocity after the spoon is released, until it's slow enough to
// just stop. Runs as its own RAF loop, independent of the main pointer/
// thermal update paths, so it keeps going even though `stirring` is false.
function startStirMomentumDecay(wrap,vessel){
 if(stirMomentumFrame)cancelAnimationFrame(stirMomentumFrame);
 stirMomentumWrap=wrap;
 let last=performance.now();
 function tick(now){
   const dt=Math.min(.05,(now-last)/1000||.016);
   last=now;
   // Exponential damping — loses the majority of its speed within a couple
   // of seconds, reading as "slowly winds down" rather than an abrupt stop.
   // v198.5.116 — sporije usporavanje kad pustiš kašiku, u skladu sa
   // "teškim" ubrzanjem — nastavlja da se okreće duže pre nego stane.
   stirAngularVelocity*=Math.pow(.55,dt);
   stirVisualTurn+=stirAngularVelocity*dt;
   if(wrap.isConnected){
     wrap.style.setProperty('--stir-turn',stirVisualTurn.toFixed(2)+'deg');
     applyOrbitPhysics(wrap,stirVisualTurn*Math.PI/180,dt);
     const dir=Math.sign(stirAngularVelocity)||stirDirection||1;
     const nearGhost=wrap.querySelector('.trail-ghost-near');
     const farGhost=wrap.querySelector('.trail-ghost-far');
     if(nearGhost)nearGhost.style.setProperty('--stir-turn',(stirVisualTurn-dir*10).toFixed(2)+'deg');
     if(farGhost)farGhost.style.setProperty('--stir-turn',(stirVisualTurn-dir*20).toFixed(2)+'deg');
   }
   if(Math.abs(stirAngularVelocity)>1&&wrap.isConnected&&!stirring){
     stirMomentumFrame=requestAnimationFrame(tick);
   }else{
     stirAngularVelocity=0;
     stirMomentumFrame=null;
     stirMomentumWrap=null;
     vessel?.classList.remove('stir-deep');
      resetStirPieceDeformation(wrap);
   }
 }
 stirMomentumFrame=requestAnimationFrame(tick);
}

function washCenterScreen(){return sceneToScreen(1484,158)}
let faucetWaterAudio=null;
function setFaucet(on){
  faucetOn=!!on;CooksterState.kitchen.faucetOn=faucetOn;waterStream.classList.toggle('on',faucetOn);if(waterSplash)waterSplash.classList.toggle('on',faucetOn);
 if(!faucetOn&&panWashing)endPanWashing();
  if(!faucetOn&&sinkWashTimer){clearTimeout(sinkWashTimer);sinkWashTimer=0;}
  renderSinkProduce();
  if(faucetOn)startSinkProduceWash();
 if(faucetWaterAudio){try{faucetWaterAudio.pause();}catch(_){}faucetWaterAudio=null;}
 if(faucetOn){
  const cfg=resolvedImpactConfig(faucetSoundTarget,'water'),snd=pickActionSound(faucetSoundTarget,'water',cfg);
  if(snd){faucetWaterAudio=playSfx(snd,Math.max(0,Math.min(1,+cfg.volume||0)),true)||null;if(faucetWaterAudio)faucetWaterAudio.loop=true;}
 }
 showToast(faucetOn?'Voda je puštena.':'Voda je zatvorena.');
}
function perspectiveAt(by){const top=245,bottom=705,min=.88,max=1.18,t=Math.max(0,Math.min(1,(by-top)/(bottom-top)));return min+t*(max-min)}
const SNAP_PROFILES={
 board:{topScale:.78,bottomScale:1.05,anchorY:.92,footW:.78,footH:.18,flattenTop:1.07,flattenBottom:1.01},
 pot:{topScale:.76,bottomScale:1.06,anchorY:.90,footW:.58,footH:.20,flattenTop:1.03,flattenBottom:1.00},
 pan:{topScale:.78,bottomScale:1.08,anchorY:.86,footW:.64,footH:.18,flattenTop:1.07,flattenBottom:1.01},
 flat:{topScale:.80,bottomScale:1.06,anchorY:.90,footW:.72,footH:.12,flattenTop:1.05,flattenBottom:1.01},
 produce:{topScale:.80,bottomScale:1.06,anchorY:.90,footW:.68,footH:.22,flattenTop:1.03,flattenBottom:1.00},
 crate:{topScale:.72,bottomScale:1.00,anchorY:.92,footW:.76,footH:.24,flattenTop:1.08,flattenBottom:1.02}
};
function tableDepthT(y){const b=tableSurfaceBounds();return Math.max(0,Math.min(1,(y-b.top)/(b.bottom-b.top)))}
function lerp(a,b,t){return a+(b-a)*t}
function snapProfileFor(el){return SNAP_PROFILES[el?.dataset?.snapProfile]||null}
function surfaceFlattenFor(el,zone,by){
 const pr=snapProfileFor(el);

 // Table / board / stove keep their existing work-surface perspective.
 if(zone==='table'||zone==='board'||zone==='stove')
   return pr?profiledFlattenAt(el,by):1;

 // The sink has two invisible planes: the rim and the recessed basin.
 // Cookware is intentionally flatter and smaller in the basin.
 if(zone==='sink-basin'||zone==='sink-rim'||zone==='back')return pr?profiledFlattenAt(el,by):1;   // same as the table: no jump at the border

 // FLOOR: keep the floor perspective, but much less compressed than v165.
 if(zone==='floor'){
   if(el?.dataset?.itemId==='kamera_stativ')return 1;
   const fb=placementGeometry?.SURFACES?.floor||{top:710,bottom:920};
   const t=Math.max(0,Math.min(1,(by-fb.top)/(fb.bottom-fb.top)));
   const id=el?.dataset?.itemId||'';
   const subtype=el?.dataset?.vesselSubtype||el?.dataset?.subtype||'';
   // v177: perspective is category-driven, never tied to old item names.
   // Every current/future Cookster container (pot, bowl, pan, basin, etc.)
   // automatically receives cookware floor perspective.
   const cookware=isContainerItem(el)||isPanItem(el)||subtype==='pot'||subtype==='bowl';

   // Back of floor = a bit flatter, front = a bit more upright.
   let floorFlat;
   if(el?.dataset?.crate==='1')floorFlat=lerp(.84,.91,t);
   else if(cookware)floorFlat=lerp(.86,.93,t);
   else floorFlat=lerp(.87,.94,t);
   // Far from the front of the room (behind the table, beside the stove) the floor blends smoothly into the same flattening
   // as everywhere else, so a carried item does not change its height at the border of the floor polygon.
   const tableLike=pr?profiledFlattenAt(el,by):1,k=Math.max(0,Math.min(1,(by-560)/160)),sm=k*k*(3-2*k);
   return lerp(tableLike,floorFlat,sm);
 }

 return pr?profiledFlattenAt(el,by):1;
}
function profiledScaleAt(el,anchorY){
 const pr=snapProfileFor(el); if(!pr)return null;
 const t=tableDepthT(anchorY);
 return lerp(pr.topScale,pr.bottomScale,t);
}
function profiledFlattenAt(el,anchorY){
 const pr=snapProfileFor(el); if(!pr)return 1;
 const t=tableDepthT(anchorY);
 return lerp(pr.flattenTop,pr.flattenBottom,t);
}

// v2.28 recovery: scale is a property of the CURRENT surface/position.
// It must never depend on the surface where the item originally spawned.

/* ================= GEOMETRY-DRIVEN PERSPECTIVE ENGINE v1 =================
   Generated from the user's Copy all geometries export.
   Scene geometry is the authority for depth scaling; item spawn/origin is irrelevant.
*/
const COOKSTER_SCENE_GEOMETRY_PERSPECTIVE={
 table:[[452.1044133476857,232.9709364908504],[1205.714747039828,231.95801937567276],[1256.3606027987082,579.3885898815931],[376.13562970936493,576.3498385360602]],
 stove:[[1232.0505920344456,250.19052744886974],[1532.8869752421958,251.20344456404737],[1576.442411194833,393.0118406889128],[1257.373519913886,389.97308934337997]],
 floor:[[125.94510226049516,324.13347685683533],[430.8331539289559,330.210979547901],[454.1302475780409,225.8805166846071],[639.4940796555436,227.90635091496233],[650.6361679224973,146.8729817007535],[720.4394430595355,148.89626503805894],[721.5403659849301,175.2346609257266],[751.9278794402584,176.2475780409042],[753.9537136706135,145.86006458557588],[1177.3506445820367,146.8729759035458],[1179.37890204521,176.2475780409042],[1207.740581270183,177.26049515608182],[1209.7664155005382,150.92465016146394],[1267.502691065662,150.92465016146394],[1284.7222820236814,233.983853606028],[1672,238.03552206673842],[1670,940],[137.08719052744888,941],[154.30678148546824,883.2637244348763],[170.51345532831002,882.2508073196987],[179.6297093649085,857.940796555436],[100.62217438105489,633.0731969860065],[25.66630785791173,632.0602798708288],[76.31216361679225,522.6652314316469],[68.20882669537137,493.29063509149626],[56.05382131324004,489.2389666307858]]
};
function gpClamp01(v){return Math.max(0,Math.min(1,v));}
function gpXAtY(a,b,y){
 const dy=b[1]-a[1];if(Math.abs(dy)<1e-6)return (a[0]+b[0])*.5;
 const t=(y-a[1])/dy;return a[0]+(b[0]-a[0])*t;
}
function gpQuadWidthAtY(q,y){
 const y0=(q[0][1]+q[1][1])*.5,y1=(q[2][1]+q[3][1])*.5;
 const yy=Math.max(Math.min(y0,y1),Math.min(Math.max(y0,y1),y));
 const lx=gpXAtY(q[0],q[3],yy),rx=gpXAtY(q[1],q[2],yy);
 return Math.max(1,Math.abs(rx-lx));
}
function gpQuadDepthT(q,y){
 const y0=(q[0][1]+q[1][1])*.5,y1=(q[2][1]+q[3][1])*.5;
 return gpClamp01((y-y0)/Math.max(1,y1-y0));
}
const GP_TABLE_REF_Y=405.166846;
const GP_TABLE_REF_W=gpQuadWidthAtY(COOKSTER_SCENE_GEOMETRY_PERSPECTIVE.table,GP_TABLE_REF_Y);
const GP_STOVE_REF_Y=321.094726;
const GP_STOVE_REF_W=gpQuadWidthAtY(COOKSTER_SCENE_GEOMETRY_PERSPECTIVE.stove,GP_STOVE_REF_Y);

// The table side edges define the scene's perspective convergence. Continue that
// same projection onto the floor instead of inventing a second floor formula.
const GP_VANISH_Y=-1820.801007640928;
function gpProjectedDepthFactor(y,refY){
 return Math.max(.45,Math.min(1.55,(y-GP_VANISH_Y)/(refY-GP_VANISH_Y)));
}
function geometryPerspectiveScaleRaw(el,zone,by){
 const y=Number.isFinite(+by)?+by:GP_TABLE_REF_Y;
 const z=zone==='board'?'table':(zone||'table');
 const pr=snapProfileFor(el);

 // Item profile supplies ONLY its base physical size. Geometry supplies depth change.
 // Reference scale is sampled at the middle of the table so existing authored sizes
 // remain recognizable while old top/bottom perspective curves no longer compete.
 const base=pr?lerp(pr.topScale,pr.bottomScale,.5):1;

 if(z==='table'){
   const q=COOKSTER_SCENE_GEOMETRY_PERSPECTIVE.table;
   return base*(gpQuadWidthAtY(q,y)/GP_TABLE_REF_W);
 }
 if(z==='stove'){
   const q=COOKSTER_SCENE_GEOMETRY_PERSPECTIVE.stove;
   return base*(gpQuadWidthAtY(q,y)/GP_STOVE_REF_W);
 }
 if(z==='floor'){
   return base*gpProjectedDepthFactor(y,GP_TABLE_REF_Y);
 }
 // sink and the area behind the table continue the table's perspective, so a carried item does not jump in size at their borders
 if(z==='sink-basin'||z==='sink-rim'||z==='sink'||z==='back'){
   return base*(gpQuadWidthAtY(COOKSTER_SCENE_GEOMETRY_PERSPECTIVE.table,y)/GP_TABLE_REF_W);
 }
 return base*gpProjectedDepthFactor(y,GP_TABLE_REF_Y);
}
/* ================= END GEOMETRY PERSPECTIVE ENGINE ================= */
// Behind the table / beside the stove the 'floor' surface blends smoothly into the table's perspective (full floor values only
// near the front of the room), so a carried item never changes size, tilt or angle at the odd border of the floor polygon.
function floorBlendAt(by){const k=Math.max(0,Math.min(1,((+by||0)-560)/160));return k*k*(3-2*k);}
function perspectiveCorrectionFor(el,zone){
 if(zone!=='floor')return perspectiveCorrectionRaw(el,zone);
 const sm=floorBlendAt(+el?.dataset?.by);
 const f=perspectiveCorrectionRaw(el,'floor');
 if(sm>=1||(hasPerspectiveCalibrationPoints(el,'floor')&&!hasPerspectiveCalibrationPoints(el,'table')))return f;   // floor-only items keep their floor values
 const t=perspectiveCorrectionRaw(el,'table');
 return {...f,scale:lerp(t.scale,f.scale,sm),angle:lerp(t.angle,f.angle,sm),tilt:lerp(t.tilt,f.tilt,sm)};
}
function geometryPerspectiveScale(el,zone,by){
 if(zone!=='floor')return geometryPerspectiveScaleRaw(el,zone,by);
 const sm=floorBlendAt(by),f=geometryPerspectiveScaleRaw(el,'floor',by);
 return sm>=1?f:lerp(geometryPerspectiveScaleRaw(el,'table',by),f,sm);
}


function hasPerspectiveCalibrationPoints(el,zone){
 const id=el?.dataset?.itemId||'';
 const z=zone==='board'?'table':(zone||'table');
 const prefix=z==='stove'?'stove':z==='floor'?'floor':'table';
 const pts=perspectiveCorrections?.[id]?.points?.[prefix];
 return Array.isArray(pts)&&pts.length>0;
}
function surfaceScaleFor(el,zone,by){
 const corr=typeof perspectiveCorrectionFor==='function'?perspectiveCorrectionFor(el,zone):{scale:1};
 // For calibrated items the user's JSON scale is the single authority.
 // Do not multiply it by the old geometry depth curve as well.
 if(hasPerspectiveCalibrationPoints(el,zone)){
   return Number.isFinite(+corr.scale)?+corr.scale:1;
 }
 const base=geometryPerspectiveScale(el,zone,by);
 return base*(Number.isFinite(+corr.scale)?+corr.scale:1);
}

function setCrateZone(crate,zone){
 if(!crate||crate.dataset.crate!=='1')return;
 const safe=zone||crate.dataset.surfaceZone||'table';
 crate.dataset.surfaceZone=safe;
 updateCrateVisual(crate);
 const sz=CRATE_ZONE_SIZES[safe]||CRATE_ZONE_SIZES.table;
 crate.dataset.baseW=sz.w;
 crate.dataset.baseH=sz.h;
 crate.dataset.shadowProfile=(safe==='table'?'crate':'tiny');
 if(crate.dataset.cx&&crate.dataset.by&&crate.dataset.vis){
   setPose(crate,+crate.dataset.cx,+crate.dataset.by,+crate.dataset.vis);
   renderCrateFill(crate);
 }
}
function heldCarryAngleFor(el){
 const id=el?.dataset?.itemId||'';
 // Blaga "u ruci" poza za alat i posuđe.
 // preuzima njenu orijentaciju kada glava kasike udje u tiganj.
 if(id==='kasika_mesanje')return -10;
 if(id==='noz')return 9;
 if(id==='sundjer')return -12;
 if(id==='daska')return 7;
 if(isPanItem(el))return -11;
 if(el?.dataset?.crate==='1')return 7;
 return -8;
}
function heldPreviewPoseFor(el){
 const id=el?.dataset?.itemId||'';
 const isBoard=id==='daska';
 const isPan=isPanItem(el);
 const isCrate=el?.dataset?.crate==='1';
 const isLongTool=id==='kasika_mesanje'||id==='noz';
 const isSmallTool=id==='sundjer';
 const isQuickWheelHand=id==='noz'||id==='sundjer'||id==='metla';
 const sx=innerWidth*(id==='sundjer'?0.835:(isQuickWheelHand?0.845:(isLongTool?0.88:(isSmallTool?0.88:0.845))));
 const sy=innerHeight*(id==='sundjer'?0.735:(isQuickWheelHand?0.72:(isLongTool?0.91:(isSmallTool?0.90:0.895))));
 const p=screenToScene(sx,sy);
 const bw=Math.max(1,+el.dataset.baseW||60),bh=Math.max(1,+el.dataset.baseH||60);
 let targetScreenW=innerWidth*0.22;
 let targetScreenH=innerHeight*0.24;
 if(isPan)targetScreenW=innerWidth*0.25;
 else if(isBoard||isCrate)targetScreenW=innerWidth*0.24;
 else if(id==='noz'){targetScreenW=innerWidth*0.136;targetScreenH=innerHeight*0.056;}
 else if(isLongTool){targetScreenW=innerWidth*0.10;targetScreenH=innerHeight*0.30;}
 else if(isSmallTool){targetScreenW=innerWidth*0.105;targetScreenH=innerHeight*0.10;}
 const visByW=(targetScreenW/Math.max(.001,scale))/bw;
 const visByH=(targetScreenH/Math.max(.001,scale))/bh;
 let vis=isLongTool||isSmallTool?Math.min(visByW,visByH):visByW;
 const base=+el.dataset.basePerspective||1;
 const sceneVis=perspectiveAt(p.y)/base;
 vis=Math.max(vis,sceneVis*1.55,sceneVis+.38);
 return {cx:p.x,by:p.y,vis,carryAngle:heldCarryAngleFor(el)};
}
function updateCursor(){cursor.style.left=mouse.x+'px';cursor.style.top=mouse.y+'px'}
function showToast(t){return}
function setMoney(v){if(FREE_MODE&&v<money)v=money;money=v;CooksterState.player.money=v;moneyEl.textContent=FREE_MODE?'Sve je besplatno':`Novac: ${money} дин`;if(marketMoneyLive)marketMoneyLive.textContent=FREE_MODE?'besplatno':`${money} дин`;CooksterSave.schedule()}
if(FREE_MODE)setMoney(money);
function updateDayUI(){const el=document.getElementById('day');if(el)el.textContent=`Dan ${CooksterState.player.day||1}`}
function activeRecipe(){
 const recipes=CooksterCatalog.RECIPES||{};
 return recipes[CooksterState.progression.activeRecipe]||null;
}
function initRecipeChooser(){
 const recipes=Object.values(CooksterCatalog.RECIPES||{});
 const hud=document.getElementById('hud'),serve=document.getElementById('serveBtn');
 if(!recipes.length||!hud||document.getElementById('recipeBtn'))return;
 const button=document.createElement('button');
 button.id='recipeBtn';button.type='button';
 const refresh=()=>{button.textContent=activeRecipe()?`📖 Pravim: ${activeRecipe().name}`:'📖 Izaberi recept';};
 const menu=document.createElement('div');menu.id='recipeChooser';
 Object.assign(menu.style,{display:'none',position:'fixed',zIndex:'29000',minWidth:'195px',
   padding:'7px',borderRadius:'12px',background:'#fff4db',border:'3px solid #3b241a',
   boxShadow:'4px 5px 0 #3b241a',font:'700 13px system-ui,sans-serif'});
 menu.addEventListener('pointerdown',e=>e.stopPropagation());
 const choose=(id)=>{
   CooksterState.progression.activeRecipe=id;
   menu.style.display='none';refresh();CooksterSave.schedule();
 };
 for(const recipe of recipes){
   const option=document.createElement('button');option.type='button';
   option.textContent=recipe.name;
   Object.assign(option.style,{display:'block',width:'100%',margin:'2px 0',padding:'9px 12px',
     textAlign:'left',border:'0',borderRadius:'7px',background:'#f4dbab',
     color:'#442819',cursor:'pointer',font:'700 13px system-ui,sans-serif'});
   option.addEventListener('click',()=>choose(recipe.id));menu.appendChild(option);
 }
 const free=document.createElement('button');free.type='button';free.textContent='Slobodno kuvanje';
 Object.assign(free.style,{display:'block',width:'100%',padding:'9px 12px',
   border:'0',borderRadius:'7px',background:'#e8e1d4',color:'#442819',
   cursor:'pointer',font:'700 13px system-ui,sans-serif'});
 free.addEventListener('click',()=>choose(null));menu.appendChild(free);
 button.addEventListener('click',()=>{
   if(menu.style.display==='block'){menu.style.display='none';return;}
   const r=button.getBoundingClientRect();
   menu.style.left=`${Math.max(8,Math.min(innerWidth-210,r.left))}px`;
   menu.style.top=`${Math.min(innerHeight-190,r.bottom+8)}px`;
   menu.style.display='block';
 });
 refresh();hud.insertBefore(button,serve);document.body.appendChild(menu);
}
function showDishReport(result){
 const wrap=document.getElementById('dishReport'),body=document.getElementById('dishReportBody');if(!wrap||!body||!result)return;
 const S=CooksterRecipes.stars;
 const statusText={
   missing:'nedostaje',
   too_low:'premalo',
   acceptable_low:'dobro, malo ispod idealnog',
   ideal:'idealno',
   acceptable_high:'dobro, malo iznad idealnog',
   too_high:'previše',
   far_too_high:'mnogo previše'
 };
 const balance=result.ingredientBalance;
 const balanceRows=balance?Object.entries(balance.details).map(([key,d])=>{
   const label=CooksterCatalog.VEGETABLES?.[key]?.label||key;
   return `<div class="dish-ingredient-row"><span>${label}: ${d.count} kom.</span><b>${statusText[d.status]||d.status}</b></div>`;
 }).join(''):'';
 const balanceHtml=balance?`<div class="dish-balance"><div class="dish-balance-title">Odnos sastojaka: ${balance.percent}%</div>${balanceRows}</div>`:'';
 const processHtml=result.processQuality===null||result.processQuality===undefined?'':`<div class="dish-balance-title">Fizička priprema: ${Math.round(result.processQuality*100)}%</div>`;
 const recognitionHtml=`<div class="dish-balance-title">${result.recognized?'Prepoznat recept':'Sandbox kombinacija'}</div>`;
 body.innerHTML=`<h2>${result.name}</h2>
 ${recognitionHtml}
 <div class="dish-score"><span>Ukus</span><b>${S(result.scores.taste)}</b></div>
 <div class="dish-score"><span>Priprema</span><b>${S(result.scores.preparation)}</b></div>
 <div class="dish-score"><span>Pečenje</span><b>${S(result.scores.cooking)}</b></div>
 <div class="dish-score"><span>Higijena</span><b>${S(result.scores.hygiene)}</b></div>
 ${balanceHtml}
 ${processHtml}
 <div class="dish-total">Ukupno: ${S(result.stars)}</div>
 <div class="dish-reward">Zarada: ${result.reward} дин</div>`;
 if(result.recipeProgress&&!result.recipeProgress.ready){
   const info=document.createElement('section');info.className='dish-balance';
   const heading=document.createElement('div');heading.className='dish-balance-title';
   heading.textContent=`Za originalni ${result.recipeProgress.name} nedostaje:`;
   info.appendChild(heading);
   for(const step of result.recipeProgress.steps.filter(s=>!s.done)){
     const row=document.createElement('div');row.className='dish-ingredient-row';
     const name=document.createElement('span');name.textContent=step.label;
     const reason=document.createElement('b');reason.textContent=step.detail;
     row.append(name,reason);info.appendChild(row);
   }
   body.appendChild(info);
 }
 wrap.classList.add('open');wrap.setAttribute('aria-hidden','false');
}
function serveDish(){
 const vessel=CooksterRecipes.findBestCookware();if(!vessel){showToast('Nema jela u posuđu za ocenjivanje.');return}
 const model=CooksterPan.read(vessel);
 if(model.served){showToast('Ovo jelo je već ocenjeno.');return}
 if(CooksterPan.total(vessel)<=0){showToast('Posuđe je prazno — prvo pripremi jelo.');return}
 const recipe=activeRecipe(),progress=recipe?CooksterRecipes.recipeProgress(vessel,recipe):null;
 const result=progress?.ready
   ?CooksterRecipes.scorePan(vessel,recipe)
   :CooksterRecipes.scorePan(vessel,null,true);
 if(!result)return;
 if(recipe&&progress)result.recipeProgress={...progress,name:recipe.name};
 const wasBurnt=!!model.burnt;
 model.served=true;CooksterPan.write(vessel,model);
 setMoney(money+result.reward);CooksterState.player.day=(CooksterState.player.day||1)+1;updateDayUI();showDishReport(result);
 if(!wasBurnt){
   CooksterPan.reset(vessel);delete vessel.dataset.readyAnnounced;delete vessel.dataset.renderBucket;delete vessel.dataset.panVegKey;
   renderCookwareContents(vessel);if(isHeatableCookwareItem(vessel))updateCookingStatus(vessel);
 }
}
function ajvarJarNotice(message){
 let note=document.getElementById('ajvarJarNotice');
 if(!note){
   note=document.createElement('div');note.id='ajvarJarNotice';
   Object.assign(note.style,{position:'fixed',left:'50%',bottom:'20%',transform:'translateX(-50%)',
     zIndex:'32000',padding:'12px 18px',borderRadius:'8px',maxWidth:'min(440px,90vw)',
     background:'rgba(45,28,17,.95)',color:'#fff2d9',textAlign:'center',
     font:'600 14px/1.4 system-ui,sans-serif',pointerEvents:'none'});
   document.body.appendChild(note);
 }
 note.textContent=message;
 clearTimeout(note._timer);
 note._timer=setTimeout(()=>note.remove(),3200);
}
function isAjvarJar(item){
 return !!item&&['kal_01_tegla_mala','kal_01_tegla_velika'].includes(item.dataset.itemId);
}
function isAjvarLadle(item){return !!item&&item.dataset.itemId==='kutlaca_ajvar';}
const AJVAR_BATCH_YIELD_ML=CooksterCatalog.AJVAR.batchYieldMl;
const AJVAR_MIN_JAR_CAPACITY_ML=Math.min(...['kal_01_tegla_mala','kal_01_tegla_velika'].map(id=>
 Number(CooksterCatalog.KITCHEN_EQUIPMENT?.find(def=>def.id===id)?.capacityMl
  ??itemsData.find(def=>def.id===id)?.capacityMl)));
function ajvarJarDefinition(jar){
 return CooksterCatalog.KITCHEN_EQUIPMENT?.find(def=>def.id===jar?.dataset.itemId)
  ||itemsData.find(def=>def.id===jar?.dataset.itemId)||null;
}
function ajvarJarCapacityMl(jar){
 const capacity=Number(ajvarJarDefinition(jar)?.capacityMl);
 return Number.isFinite(capacity)&&capacity>0?Math.round(capacity):0;
}
function ajvarJarFilledMl(jar){
 if(!isAjvarJar(jar))return 0;
 const capacity=ajvarJarCapacityMl(jar);
 if(!capacity)return 0;
 const saved=jar.dataset.ajvarMl;
 if(saved!==undefined&&saved!==''){
  const amount=Number(saved);
  if(Number.isFinite(amount))return Math.max(0,Math.min(capacity,Math.round(amount)));
 }
 const legacy=Number.parseInt(jar.dataset.ajvarFill,10);
 const fill=Number.isFinite(legacy)?Math.max(0,Math.min(3,legacy)):
  (jar.dataset.ajvarJar==='1'||!!jar.dataset.jarredDish?3:0);
 return Math.round(capacity*fill/3);
}
function ajvarJarFillCount(jar){
 if(!isAjvarJar(jar))return 0;
 const capacity=ajvarJarCapacityMl(jar);
 return capacity?Math.max(0,Math.min(3,Math.round(ajvarJarFilledMl(jar)*3/capacity))):0;
}
function renderAjvarJar(jar){
 const def=ajvarJarDefinition(jar),body=jar?.querySelector('.body');
 if(!def||!body)return;
 const fill=ajvarJarFillCount(jar);
 const filledMl=ajvarJarFilledMl(jar);
 jar.dataset.ajvarFill=String(fill);
 jar.dataset.ajvarMl=String(filledMl);
 const fillName=['empty','low','medium','full'][fill];
 const src=jar.dataset.ajvarClosed==='1'?(def.closedSrc||def.src):def.fillStates?.[fillName];
 if(src)body.src=src;
 jar.dataset.label=jar.dataset.label||def.label;
}
function renderAjvarLadle(ladle){
 if(!isAjvarLadle(ladle))return;
 let scoop=ladle.querySelector('.ajvar-ladle-scoop');
 if(!scoop){
  scoop=document.createElement('span');
  scoop.className='ajvar-ladle-scoop';
  Object.assign(scoop.style,{
   position:'absolute',left:'27%',top:'29%',width:'42%',height:'26%',
   borderRadius:'48% 50% 54% 46%',transform:'rotate(-16deg)',
   background:'radial-gradient(ellipse at 38% 30%,#f1783e 0%,#cf3520 58%,#8f1e17 100%)',
   border:'1px solid rgba(255,207,116,.9)',boxShadow:'0 1px 3px rgba(45,14,5,.7)',
   zIndex:'5',pointerEvents:'none',display:'none'
  });
  ladle.appendChild(scoop);
 }
 scoop.style.display=ladle.dataset.ajvarLadleFull==='1'?'block':'none';
}
function ajvarLadleSource(ladle){
 const instanceId=ladle?.dataset.ajvarSourceInstanceId||'';
 return instanceId?items.find(item=>item.dataset.instanceId===instanceId)||null:null;
}
function ajvarSourceRemainingMl(vessel){
 if(vessel?.dataset?.ajvarBatchMl===undefined)return AJVAR_BATCH_YIELD_ML;
 const amount=Number(vessel.dataset.ajvarBatchMl);
 return Number.isFinite(amount)?Math.max(0,Math.min(AJVAR_BATCH_YIELD_ML,Math.floor(amount))):0;
}
function ajvarReservedMl(vessel,exceptJar=null){
 const sourceId=vessel?.dataset?.instanceId||'';
 if(!sourceId)return 0;
 return items.reduce((total,jar)=>{
  if(jar===exceptJar||!isAjvarJar(jar)||jar.dataset.ajvarSourceInstanceId!==sourceId)return total;
  const filled=ajvarJarFilledMl(jar),capacity=ajvarJarCapacityMl(jar);
  return filled>0&&filled<capacity?total+capacity-filled:total;
 },0);
}
function ajvarHasPartialJar(vessel){
 const sourceId=vessel?.dataset?.instanceId||'';
 if(!sourceId)return false;
 return items.some(jar=>isAjvarJar(jar)&&jar.dataset.ajvarSourceInstanceId===sourceId
  &&ajvarJarFilledMl(jar)>0&&ajvarJarFillCount(jar)<3);
}
function ajvarSourceIsCooked(vessel){
 const model=CooksterPan.read(vessel);
 if(model.burnt||(model.batches||[]).some(batch=>batch.burnt))return false;
 return CooksterRecipes.batchCookingScore(model,[.72,.98])>=.72;
}
function finishAjvarBatch(vessel){
 if(!vessel||CooksterPan.total(vessel)<=0)return false;
 const recipe=CooksterCatalog.RECIPES?.ajvar||null;
 const progress=recipe&&typeof CooksterRecipes.recipeProgress==='function'
  ?CooksterRecipes.recipeProgress(vessel,recipe):null;
 const original=!!recipe&&activeRecipe()?.id==='ajvar'&&!!progress?.ready;
  const result=original?CooksterRecipes.scorePan(vessel,recipe):CooksterRecipes.scorePan(vessel,null,true);
  if(!result)return false;
 if(recipe&&activeRecipe()?.id==='ajvar'&&progress)result.recipeProgress={...progress,name:recipe.name};
 CooksterPan.reset(vessel);
 delete vessel.dataset.ajvarBatchMl;delete vessel.dataset.readyAnnounced;
 delete vessel.dataset.renderBucket;delete vessel.dataset.panVegKey;
 renderCookwareContents(vessel);updateCookingStatus(vessel);
 setMoney(money+result.reward);
 CooksterState.player.day=(CooksterState.player.day||1)+1;updateDayUI();
 showDishReport(result);CooksterSave.schedule();
 return true;
}
function scoopAjvarLadle(ladle,vessel){
 if(!isAjvarLadle(ladle)||!vessel||!isHeatableCookwareItem(vessel))return false;
 if(ladle.dataset.ajvarLadleFull==='1'){ajvarJarNotice('Kutlača već nosi jednu meru ajvara.');return true;}
 if(CooksterPan.total(vessel)<=0){ajvarJarNotice('Šerpa je prazna.');return true;}
 if(!ajvarSourceIsCooked(vessel)){ajvarJarNotice('Ajvar mora prvo da se skuva i ne sme da zagori.');return true;}
 if(vessel.dataset.ajvarBatchMl===undefined)
  vessel.dataset.ajvarBatchMl=String(AJVAR_BATCH_YIELD_ML);
 const remaining=ajvarSourceRemainingMl(vessel);
 if(remaining<AJVAR_MIN_JAR_CAPACITY_ML&&!ajvarHasPartialJar(vessel)){
  finishAjvarBatch(vessel);
  ajvarJarNotice('Nema dovoljno ajvara za još jednu teglu.');
  return true;
 }
 ladle.dataset.ajvarLadleFull='1';
 ladle.dataset.ajvarSourceInstanceId=vessel.dataset.instanceId||'';
 renderAjvarLadle(ladle);
 ajvarJarNotice(`Kutlača je napunjena. U šerpi je ${remaining} ml ajvara.`);
 CooksterSave.schedule();
 return true;
}
function fillAjvarJar(jar,ladle){
 if(!isAjvarJar(jar)||!isAjvarLadle(ladle))return false;
 if(jar.dataset.ajvarClosed==='1'){ajvarJarNotice('Ova tegla je već zatvorena.');return true;}
 if(ladle.dataset.ajvarLadleFull!=='1'){ajvarJarNotice('Prvo napuni kutlaču ajvarom iz šerpe.');return true;}
 const vessel=ajvarLadleSource(ladle);
 if(!vessel||!isHeatableCookwareItem(vessel)||CooksterPan.total(vessel)<=0||!ajvarSourceIsCooked(vessel)){
  delete ladle.dataset.ajvarLadleFull;delete ladle.dataset.ajvarSourceInstanceId;
  renderAjvarLadle(ladle);
  ajvarJarNotice('Ajvar više nije dostupan u izabranoj šerpi.');return true;
 }
 const capacity=ajvarJarCapacityMl(jar);
 if(!capacity){ajvarJarNotice('Zapremina tegle nije podešena.');return true;}
 const current=ajvarJarFillCount(jar);
 if(current>=3){ajvarJarNotice('Tegla je puna. Desni klik za zatvaranje.');return true;}
 const sourceId=vessel.dataset.instanceId||'';
 const existingSource=jar.dataset.ajvarSourceInstanceId||'';
 if(ajvarJarFilledMl(jar)>0&&existingSource&&existingSource!==sourceId){
  ajvarJarNotice('Dovrši teglu ajvarom iz iste šerpe.');return true;
 }
 const available=ajvarSourceRemainingMl(vessel);
 const currentMl=ajvarJarFilledMl(jar);
 const nextFillMl=Math.round(capacity*(current+1)/3);
 const pouredMl=nextFillMl-currentMl;
 const neededForJar=capacity-currentMl;
 const reservedElsewhere=ajvarReservedMl(vessel,jar);
 if(available<neededForJar+reservedElsewhere){
  ajvarJarNotice(`U šerpi nema dovoljno ajvara za ovu teglu. Preostalo je ${available} ml.`);
  return true;
 }
 jar.dataset.ajvarSourceInstanceId=sourceId;
 jar.dataset.ajvarMl=String(nextFillMl);
 jar.dataset.ajvarFill=String(current+1);
 vessel.dataset.ajvarBatchMl=String(available-pouredMl);
 delete ladle.dataset.ajvarLadleFull;delete ladle.dataset.ajvarSourceInstanceId;
 renderAjvarLadle(ladle);renderAjvarJar(jar);CooksterSave.schedule();
 if(current+1===3){
  jar.dataset.ajvarJar='1';jar.dataset.jarredDish='ajvar';jar.dataset.label='Tegla ajvara';
 }
 const remaining=available-pouredMl;
 if(remaining<AJVAR_MIN_JAR_CAPACITY_ML&&!ajvarHasPartialJar(vessel)){
  finishAjvarBatch(vessel);
  ajvarJarNotice('Tegla je puna, a iz šerpe je iskorišćen sav ajvar za tegle.');
  return true;
 }
 if(current+1<3){
  ajvarJarNotice(`Ajvar je sipan: ${current+1}/3 mere (${remaining} ml ostalo).`);
  return true;
 }
 ajvarJarNotice(`Tegla je puna ajvara. Desni klik za zatvaranje. U šerpi je ostalo ${remaining} ml.`);
 return true;
}
let ajvarJarMenuOutsideHandler=null,ajvarJarMenuEscapeHandler=null;
function closeAjvarJarActionMenu(){
 const menu=document.getElementById('ajvarJarActionMenu');
 menu?.remove();
 if(ajvarJarMenuOutsideHandler)window.removeEventListener('pointerdown',ajvarJarMenuOutsideHandler,true);
 if(ajvarJarMenuEscapeHandler)window.removeEventListener('keydown',ajvarJarMenuEscapeHandler,true);
 ajvarJarMenuOutsideHandler=null;ajvarJarMenuEscapeHandler=null;
}
function closeAjvarJar(jar){
 if(!isAjvarJar(jar))return false;
 if(jar.dataset.ajvarClosed==='1'){ajvarJarNotice('Ova tegla je već zatvorena.');return true;}
 if(ajvarJarFillCount(jar)<3){ajvarJarNotice('Tegla mora da bude puna pre zatvaranja.');return true;}
 jar.dataset.ajvarClosed='1';
 renderAjvarJar(jar);CooksterSave.schedule();
 playImpactSound(jar,'close');
 ajvarJarNotice('Tegla je zatvorena.');
 return true;
}
function openAjvarJarActionMenu(jar,x,y){
 if(!isAjvarJar(jar))return false;
 closeAjvarJarActionMenu();
 const menu=document.createElement('div');
 menu.id='ajvarJarActionMenu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Radnje za teglu ajvara');
 Object.assign(menu.style,{
  position:'fixed',left:'0px',top:'0px',zIndex:'32001',minWidth:'190px',
  padding:'6px',border:'1px solid rgba(255,232,194,.3)',borderRadius:'8px',
  background:'rgba(47,29,19,.97)',boxShadow:'0 8px 28px rgba(0,0,0,.38)'
 });
 const button=document.createElement('button');
 button.type='button';button.setAttribute('role','menuitem');
 button.textContent=jar.dataset.ajvarClosed==='1'?'Tegla je već zatvorena':'Zatvori teglu';
 Object.assign(button.style,{
  display:'block',width:'100%',padding:'10px 12px',border:'0',borderRadius:'5px',
  background:'transparent',color:'#fff2d9',textAlign:'left',font:'600 14px system-ui,sans-serif',
  cursor:jar.dataset.ajvarClosed==='1'?'default':'pointer'
 });
 button.addEventListener('click',event=>{
  event.stopPropagation();
  closeAjvarJarActionMenu();
  closeAjvarJar(jar);
 });
 menu.appendChild(button);
 menu.addEventListener('pointerdown',event=>event.stopPropagation());
 menu.addEventListener('click',event=>event.stopPropagation());
 document.body.appendChild(menu);
 const width=menu.offsetWidth||202,height=menu.offsetHeight||46;
 menu.style.left=`${Math.max(8,Math.min(Number(x)||0,window.innerWidth-width-8))}px`;
 menu.style.top=`${Math.max(8,Math.min(Number(y)||0,window.innerHeight-height-8))}px`;
 ajvarJarMenuOutsideHandler=event=>{if(!menu.contains(event.target))closeAjvarJarActionMenu();};
 ajvarJarMenuEscapeHandler=event=>{if(event.key==='Escape')closeAjvarJarActionMenu();};
 setTimeout(()=>{
  if(!menu.isConnected)return;
  window.addEventListener('pointerdown',ajvarJarMenuOutsideHandler,true);
  window.addEventListener('keydown',ajvarJarMenuEscapeHandler,true);
 },0);
 button.focus({preventScroll:true});
 return true;
}
function getBoardEl(){return items.find(i=>i.dataset.itemId==='daska')||null}
function getKnifeEl(){return items.find(i=>i.dataset.itemId==='noz')||null}

function isBoardCuttableItem(el){
 if(!el||(el.dataset.vegetable!=='1'&&el.dataset.fruit!=='1'))return false;
 const isFruit=el.dataset.fruit==='1';
 const key=el.dataset.vegKey||el.dataset.fruitKey||'';
 const def=(isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES)[key]||{};
 const cutState=el.dataset.cutState||'whole';
 if(cutState==='whole')return def.canSlice!==false&&!!(def.slicedSrc||def.src);
 if(cutState==='sliced')return !!def.dicedSrc;
 return false;
}

function boardCenterSnapCandidate(el,cand){
 if(!cand?.board||!isBoardCuttableItem(el))return cand;
 const board=cand.board;
 const bw=Math.max(1,board.offsetWidth),bh=Math.max(1,board.offsetHeight);
 const bcx=+board.dataset.cx||0;
 const btop=parseFloat(board.style.top)||((+board.dataset.by||0)-bh);
 const bcy=btop+bh/2;
 let vis=surfaceScaleFor(el,'board',bcy);
 if(el.dataset.vegetable==='1'&&el.dataset.vegKey==='paradajz')vis*=1.15;
 if(el.dataset.vegetable==='1'&&el.dataset.vegKey==='paprika'&&el.dataset.cutState!=='sliced')vis*=1.10;
 const w=Math.max(1,+el.dataset.baseW||el.offsetWidth||60)*vis;
 const h=Math.max(1,+el.dataset.baseH||el.offsetHeight||60)*vis;
 // Bottom-anchor is moved down by roughly half the visual ingredient height,
 // so the ingredient itself (not its anchor) lands in the board center.
 const localY=Math.min(bh*.31,Math.max(8,h*.46));
 const a=(+board.dataset.angle||0)*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a);
 const cx=bcx-(localY*sn);
 const by=bcy+(localY*cs);
 return {
   ...cand,boardSnap:true,cx,by,vis,w,h,
   left:cx-w/2,top:by-h,right:cx+w/2,bottom:by
 };
}

function setBoardSnapIndicator(on){
 const board=getBoardEl();
 if(board)board.classList.toggle('cut-snap-active',!!on);
}

function mountKnifeAsBoardChild(board=getBoardEl()){
 if(!board)return false;
 const knife=getKnifeEl();
 if(!knife)return false;

 const bw=Math.max(1,+board.dataset.baseW||board.offsetWidth||1);
 const bh=Math.max(1,+board.dataset.baseH||board.offsetHeight||1);
 const kw=Math.max(1,+knife.dataset.baseW||knife.offsetWidth||1);
 const kh=Math.max(1,+knife.dataset.baseH||knife.offsetHeight||1);

 knife.dataset.boardRelX=String(KNIFE_PARK.relX);
 knife.dataset.boardRelY=String(KNIFE_PARK.relY);
 knife.dataset.boardRelAngle=String(KNIFE_PARK.relAngle);
 knife.dataset.attachedToBoard='1';
 knife.dataset.lockedToBoard='1';
 knife.dataset.surfaceZone='board';
 delete knife.dataset.embeddedKnife;
 delete knife.dataset.held;

 knife.classList.remove('held','valid','invalid','hovered');
 knife.style.removeProperty('--held-z');
 knife.style.transition='none';

 // This is the important part: the REAL knife DOM node is physically inside
 // the board. It now inherits every board movement/rotation/perspective with
 // zero coordinate synchronization.
 if(knife.parentNode!==board)board.appendChild(knife);

 knife.style.position='absolute';
 knife.style.width=(kw/bw*100)+'%';
 knife.style.height=(kh/bh*100)+'%';
 knife.style.left=((.5+KNIFE_PARK.relX)*100)+'%';
 knife.style.top=(KNIFE_PARK.relY*100)+'%';
 knife.style.transformOrigin='50% 100%';
 knife.style.transform=`translate(-50%,-100%) rotate(${KNIFE_PARK.relAngle}deg)`;
 knife.style.zIndex='30';
 knife.style.visibility='';
 knife.style.pointerEvents='none';

 if(knife._contactShadow){
   knife._contactShadow.style.display='none';
   knife._contactShadow.style.visibility='hidden';
   knife._contactShadow.style.opacity='0';
 }
 return true;
}

function releaseKnifeFromBoardForCut(board=getBoardEl()){
 const knife=getKnifeEl();
 if(!knife)return null;

 // Cutting is the only time the knife becomes a scene-level animated object.
 if(knife.parentNode!==scene)scene.appendChild(knife);
 delete knife.dataset.attachedToBoard;
 knife.dataset.surfaceZone=board?.dataset?.surfaceZone||'table';
 knife.style.position='absolute';
 knife.style.pointerEvents='none';
 knife.style.visibility='';
 knife.style.width='';
 knife.style.height='';
 knife.style.left='';
 knife.style.top='';
 knife.style.transform='';
 knife.style.transformOrigin='';
 knife.style.zIndex='11050';
 if(knife._contactShadow){
   knife._contactShadow.style.display='none';
   knife._contactShadow.style.visibility='hidden';
   knife._contactShadow.style.opacity='0';
 }
 return knife;
}

function parkKnifeOnBoard(board){return mountKnifeAsBoardChild(board);}

function ensureKnifeAlwaysOnBoard(board=getBoardEl()){
 if(!board)return false;
 const knife=getKnifeEl();
 if(!knife)return false;

 if(holding===knife){
   hidePlacementGhost();
   hideOriginGhost();
   holding=null;
 }
 return mountKnifeAsBoardChild(board);
}

// Top working surface: used for snapping ingredients onto the board.
function getBoardPoly(board){if(!board)return null;const w=board.offsetWidth,h=board.offsetHeight,left=parseFloat(board.style.left),top=parseFloat(board.style.top);return[{x:left+w*.13,y:top+h*.33},{x:left+w*.87,y:top+h*.20},{x:left+w*.84,y:top+h*.72},{x:left+w*.16,y:top+h*.86}]}
// Pixel-perfect board selection: transparent PNG pixels are never selectable.
function prepareBoardAlphaHit(board){
 if(!board||board._alphaReady)return;
 const img=board.querySelector('.body'); if(!img)return;
 const build=()=>{
   try{
     const c=document.createElement('canvas');
     c.width=img.naturalWidth||1;c.height=img.naturalHeight||1;
     const ctx=c.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(img,0,0);
     board._alphaW=c.width;board._alphaH=c.height;
     board._alphaData=ctx.getImageData(0,0,c.width,c.height).data;
     board._alphaReady=true;
   }catch(e){}
 };
 if(img.complete&&img.naturalWidth)build(); else img.addEventListener('load',build,{once:true});
}
function pointOnVisibleBoard(board,x,y){
 if(!board)return false;
 // v176: the board becomes selectable as soon as the cursor enters its visible item bounds.
 // This removes the old alpha/center-only hover dead zone around the board edges.
 const w=board.offsetWidth,h=board.offsetHeight,left=parseFloat(board.style.left),top=parseFloat(board.style.top);
 const pivotX=left+w/2,pivotY=top+h*.72;
 const a=-(+(board.dataset.angle||0))*Math.PI/180,dx=x-pivotX,dy=y-pivotY;
 const rx=dx*Math.cos(a)-dy*Math.sin(a),ry=dx*Math.sin(a)+dy*Math.cos(a);
 const lx=(pivotX+rx-left)/w,ly=(pivotY+ry-top)/h;
 return lx>=0&&lx<=1&&ly>=0&&ly<=1;
}
function pointInPoly(x,y,p){if(!p)return false;let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if(((p[i].y>y)!=(p[j].y>y))&&(x<(p[j].x-p[i].x)*(y-p[i].y)/(p[j].y-p[i].y)+p[i].x))c=!c}return c}


function ghostKeyFor(el){
 const food=el._panContent||el._vesselContent;
 // A cooling temperature is model state, not a new rendered food tree.
 // Rebuild the carry copy only when the visible contents actually change.
 const renderedContents=food?JSON.stringify([
   food.dataset.foodStage||'',
   food.dataset.foodCounts||'',
   food.dataset.fillRatio||'',
   food.style.getPropertyValue('--stir-mix')||'',
   el._oilSurface?.dataset.oilAmount||''
 ]):null;
 return (el.dataset.detachedLid==='1'?'lid:':'body:')+[
   el.dataset.itemId||'',
   el.querySelector('.body')?.getAttribute('src')||'',
   el.dataset.cutState||'',
   el.dataset.count||'',
   renderedContents??(el.dataset.panContents||''),
   renderedContents??(el.dataset.containerContents||''),
   el.classList.contains('open')?'open':'closed'
 ].join(':');
}

// cloneNode() does not copy what is painted on a <canvas>, so the piece simulation's canvases are copied by hand
function copyCanvasContents(src,dst){
  if(!src||!dst)return;
  const from=src.querySelectorAll('canvas'),to=dst.querySelectorAll('canvas');
  from.forEach((c,i)=>{
    const d=to[i];if(!d||!c.width||!c.height)return;
    d.width=c.width;d.height=c.height;
    try{d.getContext('2d').drawImage(c,0,0);}catch(_){}
  });
}
function fillGhostContainer(container,el){
  container.innerHTML='';
  const copy=el.cloneNode(true);
  copyCanvasContents(el,copy);
  copy.removeAttribute('id');
  copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  copy.classList.remove(
    'held','hovered','valid','invalid','pour-target-ready','pour-target-blocked',
    'pouring-source','pouring-receiver','stir-ready-target','stirring-vessel'
  );
  copy.classList.add('ghost-item-copy');
  copy.style.left='0';copy.style.top='0';
  copy.style.width='100%';copy.style.height='100%';
  copy.style.visibility='visible';copy.style.opacity='1';
  copy.style.transform='none';copy.style.transformOrigin='50% 90%';
  copy.style.zIndex='1';copy.style.pointerEvents='none';
  copy.querySelectorAll('.pan-status,.wash-foam,.pan-smoke,.lid-hit').forEach(n=>n.remove());
  container.appendChild(copy);
}
function ensurePlacementGhostFor(el){
 if(!placementGhost){placementGhost=document.createElement('div');placementGhost.className='placement-ghost';scene.appendChild(placementGhost)}
 const key=ghostKeyFor(el);
 if(placementGhost._key!==key){fillGhostContainer(placementGhost,el);placementGhost._key=key}
 return placementGhost;
}
function ensureOriginGhostFor(el){
 if(!originGhost){originGhost=document.createElement('div');originGhost.className='placement-ghost source';scene.appendChild(originGhost)}
 const key=ghostKeyFor(el);
 if(originGhost._key!==key){fillGhostContainer(originGhost,el);originGhost._key=key}
 return originGhost;
}
function tweenItemPickup(el){
 const body=el?.querySelector?.('.body');
 if(!body||!window.CooksterTween)return;
 CooksterTween.pulse(body,[
   {transform:'scale(1)',filter:'brightness(1)'},
   {transform:'scale(1.035)',filter:'brightness(1.055)',offset:.55},
   {transform:'scale(1)',filter:'brightness(1)'}
 ],{key:'pickup',duration:180,easing:'cubic-bezier(.18,.78,.20,1)'});
}
function tweenItemDrop(el){
 const body=el?.querySelector?.('.body');
 if(!body||!window.CooksterTween)return;
 // The board uses only the physical straight-down landing on its parent.
 // No extra pulse/squash is applied to the image itself.
 if(el.dataset.itemId==='daska')return;
 CooksterTween.pulse(body,[
   {transform:'scale(1.018) translateY(-2px)'},
   {transform:'scale(.992) translateY(1px)',offset:.58},
   {transform:'scale(1) translateY(0)'}
 ],{key:'drop',duration:150,easing:'cubic-bezier(.22,.76,.28,1)'});
}
function showPlacementGhostTween(ghost){
 if(!ghost)return;
 if(window.CooksterTween)CooksterTween.cancel(ghost,'ghostOpacity');
 ghost.style.display='block';
 ghost.style.setProperty('opacity','1','important');
}
function hidePlacementGhost(){
 placementState=null;
 resetPlacementGhostMotion();
 hideBackpackHeldPreview();
 if(!placementGhost)return;
 if(window.CooksterTween)CooksterTween.cancel(placementGhost,'ghostOpacity');
 placementGhost.style.display='none';
 placementGhost.style.opacity='.30';
}
function hideOriginGhost(){originState=null;if(originGhost)originGhost.style.display='none'}
function setHeldPlacementState(el,blocked){
 if(!el)return;
 el.classList.remove('valid','invalid');
 if(el.classList.contains('held'))el.classList.add(blocked?'invalid':'valid');
}
function clearHeldPlacementState(el){
 if(!el)return;
 el.classList.remove('valid','invalid');
}
function showOriginGhost(el){hideOriginGhost();}
function placementRectFor(cand,el=null){return CooksterCollision.candidateRectFor(cand,el,snapProfileFor(el))}
// v132: placement geometry is isolated in js/core/placement-geometry.js.
const placementGeometry=CooksterPlacementGeometry.create({
  mouse,
  screenToScene,
  perspectiveAt,
  profiledScaleAt,
  surfaceScaleFor,
  snapProfileFor,
  getBoardEl,
  getBoardPoly,
  pointInPoly,
  isPanItem:el=>!!el&&(el.dataset.itemId==='tiganj_veliki'||el.dataset.itemId==='tiganj_mali'),
  isSponge
});
const tableSurfaceBounds=placementGeometry.tableBounds;
const floorStorageBounds=placementGeometry.floorBounds;
const stoveTopBounds=placementGeometry.stoveBounds;
const sinkSurfaceBounds=placementGeometry.sinkBounds;
const floorStorageCandidate=placementGeometry.floor;
const freePlacementCandidate=placementGeometry.table;
const sinkPlacementCandidate=placementGeometry.sink;
const backPlacementCandidate=placementGeometry.back;
const boardPlacementCandidate=placementGeometry.board;
const stovePlacementCandidate=placementGeometry.stoveItem;
const spongeStovePlacementCandidate=placementGeometry.stoveSponge;
const produceStovePlacementCandidate=placementGeometry.stoveProduce;

// v165 SurfaceCast: the cursor asks one centralized system which physical
// surface is underneath it. Placement then only computes the pose for that surface.
window.CooksterPlacementPoint=()=>screenToScene(mouse.x,mouse.y);
const __rectHit=(p,b)=>p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom;
function stoveTopPlacementHit(p){
 const b=stoveTopBounds();
 return __rectHit(p,b);
}

if(window.CooksterSurfaceCast){
  CooksterSurfaceCast.register('board',p=>{
    const board=getBoardEl();
    if(!board)return false;
    return pointInPoly(p.x,p.y,getBoardPoly(board))
      ? {object:board,kind:'board'}
      : false;
  },90);

  CooksterSurfaceCast.register('stove',p=>
    stoveTopPlacementHit(p)?{kind:'stove'}:false
  ,80);

  CooksterSurfaceCast.register('table',p=>
    window.CooksterSceneSurfaces?.contains(p.x,p.y,placementGeometry.SURFACES.tablePoly)
      ?{kind:'table'}:false
  ,70);

  CooksterSurfaceCast.register('sink',p=>
    window.CooksterSceneSurfaces?.zoneAt(p.x,p.y)?.startsWith('sink-')
      ?{kind:'sink'}:false
  ,85);

  CooksterSurfaceCast.register('back',p=>
    window.CooksterSceneSurfaces?.contains(p.x,p.y,placementGeometry.SURFACES.backPoly)
      ?{kind:'back'}:false
  ,75);

  CooksterSurfaceCast.register('floor',p=>
    (placementGeometry.SURFACES.floorPoly
      ? pointInPoly(p.x,p.y,placementGeometry.SURFACES.floorPoly)
      : __rectHit(p,floorStorageBounds()))?{kind:'floor'}:false
  ,50);
}

function rectsOverlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function isPanItem(el){return !!el&&(el.dataset.itemId==='tiganj_veliki'||el.dataset.itemId==='tiganj_mali')}

const PAPRIKA_ROAST_ASSETS=[
 'assets/ingredients/paprika_roast/phase_1.png',
 'assets/ingredients/paprika_roast/phase_2.png',
 'assets/ingredients/paprika_roast/phase_3.png',
 'assets/ingredients/paprika_roast/phase_4.png'
];
const PATLIDZAN_ROAST_ASSETS=[
 'assets/ingredients/patlidzan_roast/phase_1.png',
 'assets/ingredients/patlidzan_roast/phase_2.png',
 'assets/ingredients/patlidzan_roast/phase_3.png'
];
const PAPRIKA_ROAST_CHOPPED_ASSETS={
  peeled:'assets/ingredients/paprika_roast_chopped/paprika_pecena_seckana_oljustena.png',
  unpeeled:'assets/ingredients/paprika_roast_chopped/paprika_pecena_seckana_neoljustena.png'
};
function roastedChoppedPepperKey(peeled){
  return peeled
    ?'paprika_pecena_seckana_oljustena'
    :'paprika_pecena_seckana_neoljustena';
}
function roastedChoppedPepperSrc(key){
  return key==='paprika_pecena_seckana_oljustena'
    ?PAPRIKA_ROAST_CHOPPED_ASSETS.peeled
    :key==='paprika_pecena_seckana_neoljustena'
      ?PAPRIKA_ROAST_CHOPPED_ASSETS.unpeeled
      :'';
}
function isRoastedChoppedPepperKey(key){
  return key==='paprika_pecena_seckana_oljustena'||key==='paprika_pecena_seckana_neoljustena';
}
const ROASTED_UNPEELED_EGGPLANT_KEY='patlidzan_pecen_seckan_neoljusten';
function isRoastedUnpeeledEggplantKey(key){
  return String(key||'')===ROASTED_UNPEELED_EGGPLANT_KEY;
}
const PAPRIKA_PEEL_ASSETS={
  partial:'assets/ingredients/paprika_peel/partial.png',
  peeled:'assets/ingredients/paprika_peel/peeled.png'
};
const PATLIDZAN_PEEL_ASSETS={
  partial:'assets/ingredients/patlidzan_peel/partial.png',
  peeled:'assets/ingredients/patlidzan_peel/peeled.png'
};
function isWholePaprika(el){return !!el&&el.dataset.vegetable==='1'&&el.dataset.vegKey==='paprika'&&el.dataset.cutState==='whole';}
function isWholePatlidzan(el){return !!el&&el.dataset.vegetable==='1'&&el.dataset.vegKey==='patlidzan'&&(el.dataset.cutState||'whole')==='whole';}
function isWholeStoveRoast(el){return isWholePaprika(el)||isWholePatlidzan(el);}
function isProduceItem(el){return !!el&&(el.dataset.vegetable==='1'||el.dataset.fruit==='1');}
function renderDirectProduceHeat(el){
 if(!isProduceItem(el)||isWholeStoveRoast(el))return;
 const body=el.querySelector('.body');if(!body)return;
 const progress=Math.max(0,+el.dataset.directHeatProgress||0);
 let filter='',suffix='';
 if(progress>=1.08){filter='brightness(.38) saturate(.55) sepia(.48)';suffix=' · izgorelo';}
 else if(progress>=.78){filter='brightness(.68) saturate(.82) sepia(.24)';suffix=' · jako zapečeno';}
 else if(progress>=.48){filter='brightness(.84) saturate(.92) sepia(.10)';suffix=' · zapečeno';}
 else if(progress>=.20){filter='brightness(.94) saturate(.97)';suffix=' · zagreva se';}
 body.style.filter=filter;
 const base=el.dataset.baseProduceLabel||String(el.dataset.label||'Namirnica').replace(/ · .*/,'');
 el.dataset.baseProduceLabel=base;
 el.dataset.label=base+suffix;
}
function setProduceOnStove(el,on){
 if(!isProduceItem(el))return;
 if(isWholeStoveRoast(el)){setPaprikaOnStove(el,on);return;}
 if(on){
  el.dataset.onStoveTop='1';
  if(el.dataset.directHeatProgress===undefined)el.dataset.directHeatProgress='0';
  renderDirectProduceHeat(el);
 }else{
  delete el.dataset.onStoveTop;
 }
}

function paprikaRoastPhase(el){return Math.max(1,Math.min(4,+el.dataset.roastPhase||1));}
function renderPaprikaRoast(el){
 if(!isWholeStoveRoast(el))return;
 const eggplant=isWholePatlidzan(el);
 if(eggplant&&(el.dataset.peeled==='1'||(+el.dataset.peelHits||0)>0)){
   renderPaprikaPeelState(el);return;
 }
 const phase=paprikaRoastPhase(el),body=el.querySelector('.body');
 if(body){
   body.src=eggplant?PATLIDZAN_ROAST_ASSETS[Math.min(3,phase)-1]:PAPRIKA_ROAST_ASSETS[phase-1];
   body.style.filter=(+el.dataset.roastProgress||0)>=1.08
     ?'brightness(.38) saturate(.55) sepia(.45)':'';
 }
 el.dataset.label=eggplant
   ?(phase>=3?'Pečen patlidžan':(phase>=2?'Patlidžan se peče':'Patlidžan'))
   :(phase>=4?'Pečena paprika':(phase>=2?'Paprika se peče':'Paprika'));
 if((+el.dataset.roastProgress||0)>=1.08)el.dataset.label=eggplant?'Patlidžan · izgoreo':'Paprika · izgorela';
}
function setPaprikaOnStove(el,on){
 if(!isWholeStoveRoast(el))return;
 if(on){
   el.dataset.onStoveTop='1';
   if(el.dataset.roastProgress===undefined)el.dataset.roastProgress='0';
   if(el.dataset.roastPhase===undefined)el.dataset.roastPhase='1';
   renderPaprikaRoast(el);
   const name=isWholePatlidzan(el)?'Patlidžan':'Paprika';
   showToast(stoveState.fireOn?`${name} je na vreloj plotni — počinje da se peče.`:`${name} je na plotni, ali vatra je ugašena.`);
 }else{
   delete el.dataset.onStoveTop;
   if(isWholePatlidzan(el)&&(+el.dataset.roastProgress||0)>=.75&&
      (+el.dataset.roastProgress||0)<1.08&&el.dataset.peeled!=='1'){
     el.dataset.readyToPeel='1';
     renderPaprikaPeelState(el);
   }
 }
}

function stopPanSizzle(pan){
 if(!pan)return;
 pan.classList.remove('sizzling');
}
function startPanSizzle(pan){
 if(!pan)return;
 // Vizuelno krčkanje ostaje, ali nema audio reprodukcije.
 pan.classList.add('sizzling');
}
function isVesselHeld(vessel){
 return !!vessel&&(holding===vessel||vessel.classList?.contains('held'));
}
function cookwareHeatPoint(vessel){
 if(!vessel)return null;

 // Prefer the actual bowl/food area. This avoids frying-pan handles skewing the
 // centre far away from the burner even though the pan bowl is visibly on it.
 const content=isPanItem(vessel)?vessel._panContent:vessel._vesselContent;
 const r=content?.getBoundingClientRect?.();
 if(r&&r.width>2&&r.height>2){
   const p=screenToScene(r.left+r.width*.5,r.top+r.height*.52);
   if(Number.isFinite(+p.x)&&Number.isFinite(+p.y))return p;
 }

 // Fallback: derive the calibrated vessel-food centre from the item pose.
 const vr=vessel.getBoundingClientRect?.();
 const preset=vesselVisualPreset?.(vessel);
 if(vr&&vr.width>2&&vr.height>2&&preset){
   const sx=vr.left+vr.width*((preset.left+preset.width*.5)/100);
   const sy=vr.top+vr.height*((preset.top+preset.height*.52)/100);
   const p=screenToScene(sx,sy);
   if(Number.isFinite(+p.x)&&Number.isFinite(+p.y))return p;
 }

 // Last resort for unusual cookware.
 const vis=Math.max(.01,+vessel.dataset.vis||1);
 const h=Math.max(1,(+vessel.dataset.baseH||vessel.offsetHeight||80)*vis);
 return {x:+vessel.dataset.cx||0,y:(+vessel.dataset.by||0)-h*.50};
}

function ensureVesselStoveZone(vessel){
 if(!vessel||vessel.dataset.surfaceZone!=='stove'||!window.CooksterStoveZones)return null;

 // Burner rings detect heat only. They never snap, reserve, or reposition cookware.
 const p=cookwareHeatPoint(vessel);
 const zones=CooksterStoveZones.ZONES||[];
 let best=null,bestD=Infinity;

 for(const z of zones){
   if(!z)continue;
   const dx=(p.x-z.cx)/Math.max(1,z.rx);
   const dy=(p.y-z.cy)/Math.max(1,z.ry);
   const d2=dx*dx+dy*dy;

   // Small tolerance accounts for perspective and the visible pan bottom
   // extending beyond the painted ring; still requires the bowl itself to be on it.
   if(d2<=1.18*1.18 && d2<bestD){
     best=z;
     bestD=d2;
   }
 }

 if(best)vessel.dataset.stoveZone=best.id;
 else delete vessel.dataset.stoveZone;
 return best;
}
function vesselIsPhysicallyOnStove(vessel){
 if(!vessel||!isHeatableCookwareItem(vessel)||isVesselHeld(vessel))return false;
 if(vessel.dataset.surfaceZone!=='stove')return false;
 if(window.CooksterStoveZones)return !!ensureVesselStoveZone(vessel);
 return true;
}
function vesselIsHeating(vessel){
 return vesselIsPhysicallyOnStove(vessel)&&!!stoveState.fireOn&&(+stoveState.fireLevel||0)>0;
}
function syncCookwareHeatFlags(vessel){
 if(!vessel||!isHeatableCookwareItem(vessel))return false;
 const heating=vesselIsHeating(vessel);
 if(vesselIsPhysicallyOnStove(vessel))vessel.dataset.onCookstove='1';
 else delete vessel.dataset.onCookstove;
 if(heating){
   vessel.dataset.onStove='1';
   vessel.classList.add('sizzling');
   if(isPanItem(vessel))startPanSizzle(vessel);
 }else{
   delete vessel.dataset.onStove;
   vessel.classList.remove('sizzling');
   if(isPanItem(vessel))stopPanSizzle(vessel);
 }
 return heating;
}
function setCookwareOnStove(vessel,on){
 if(!isContainerItem(vessel))return false;

 if(!isHeatableCookwareItem(vessel)){
   delete vessel.dataset.onCookstove;delete vessel.dataset.onStove;delete vessel.dataset.stoveZone;
   vessel.classList.remove('sizzling');
   updateCookingStatus(vessel);
   return false;
 }

 if(!on){
   delete vessel.dataset.onCookstove;
   delete vessel.dataset.onStove;
   delete vessel.dataset.stoveZone;
   vessel.classList.remove('sizzling');
   if(isPanItem(vessel))stopPanSizzle(vessel);
   updateCookingStatus(vessel);
   return false;
 }

 vessel.dataset.surfaceZone='stove';
 const zone=ensureVesselStoveZone(vessel);
 const heating=syncCookwareHeatFlags(vessel);
 updateCookingStatus(vessel);

 if(!zone){
   showToast(`${vessel.dataset.label||'Posuđe'} je na šporetu, ali nije iznad ringle.`);
   return false;
 }

 showToast(stoveState.fireOn
   ? `${vessel.dataset.label||'Posuđe'} je iznad ${zone.label} — počinje da se zagreva.`
   : `${vessel.dataset.label||'Posuđe'} je iznad ${zone.label}, ali vatra je ugašena.`);
 return heating;
}
function setPanOnStove(pan,on){return setCookwareOnStove(pan,on);}

CooksterPlacement.register('floor',floorStorageCandidate,50);
CooksterPlacement.register('stove',el=>isSponge(el)?spongeStovePlacementCandidate(el):stovePlacementCandidate(el),45);
CooksterPlacement.register('board',boardPlacementCandidate,30);
CooksterPlacement.register('table',freePlacementCandidate,10);
CooksterPlacement.register('sink',sinkPlacementCandidate,85);
CooksterPlacement.register('back',backPlacementCandidate,75);


function smoothProduceDepthScale(by){
 // One continuous curve for loose vegetables/fruits:
 // back worktop ≈ 0.80, front floor ≈ 1.18.
 // No grid, no discrete step and no surface-specific size jump.
 const t=Math.max(0,Math.min(1,((+by||0)-236)/(920-236)));
 return lerp(.80,1.18,t);
}
function tableFrontEdgeVisualZone(p){
 const poly=placementGeometry?.SURFACES?.tablePoly;
 if(!Array.isArray(poly)||poly.length<3||!p)return false;
 if(pointInPoly(p.x,p.y,poly))return true;

 // The authored table polygon ends a little before the visible front lip.
 // Extend only the lowest/front vertices downward, preserving the side perspective.
 let maxY=-Infinity,minY=Infinity;
 for(const q of poly){maxY=Math.max(maxY,+q.y||0);minY=Math.min(minY,+q.y||0);}
 const depth=Math.max(1,maxY-minY);
 const frontBand=Math.max(28,depth*.16);
 const extension=74; // 44 + 30px: visual front edge extended downward
 const extended=poly.map(q=>{
   const y=+q.y||0;
   const t=Math.max(0,Math.min(1,(y-(maxY-frontBand))/frontBand));
   return {x:+q.x||0,y:y+extension*t};
 });
 return pointInPoly(p.x,p.y,extended);
}
function keepTableUntilVisibleFrontEdge(el,cand,p){
 if(!cand||!p||cand.zone!=='floor')return cand;
 if(!tableFrontEdgeVisualZone(p))return cand;
 // Preserve all candidate geometry, but keep the object on the table perspective
 // until its anchor really passes the visible lower/front edge.
 return {...cand,zone:'table',surface:'table',inSurface:true,stoveZone:null};
}

function continuousPointerCandidate(el,cand){
 if(!cand)return cand;
 // Outside every surface the ghost is placed exactly like on a surface (the item's centre follows the pointer), so it
 // does not jump by half of its height when the pointer crosses the border of a surface.
 const outside=cand.inSurface===false;
 if(!outside&&cand.boardSnap)return cand;

 const p=screenToScene(mouse.x,mouse.y);
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return cand;

 if(!outside)cand=keepTableUntilVisibleFrontEdge(el,cand,p);

 let vis=+cand.vis||1;
 if(isProduceItem(el))vis=smoothProduceDepthScale(p.y);

 const bw=Math.max(1,+el.dataset.baseW||el.offsetWidth||60);
 const bh=Math.max(1,+el.dataset.baseH||el.offsetHeight||60);
 const w=bw*vis,h=bh*vis;

 // Preserve the exact point where the user grabbed the object.
 // No recentering occurs on pointerdown; movement begins only after the
 // pointer itself moves, keeping the clicked point under the cursor.
 const g=(holding===el)?heldGrabState:null;
 let centerX=p.x,centerY=p.y;
 if(g&&g.active){
   const dx=p.x-g.pointerStartX,dy=p.y-g.pointerStartY;
   if(!g.moved&&Math.hypot(dx,dy)>=1.5)g.moved=true;
   if(!g.moved){
     centerX=g.centerStartX;
     centerY=g.centerStartY;
   }else{
     centerX=p.x+g.offsetX;
     centerY=p.y+g.offsetY;
   }
 }

 const cx=centerX,by=centerY+h*.5;
 return {
   ...cand,cx,by,vis,w,h,
   grabPreserved:!!(g&&g.active),
   pointerCx:centerX,pointerCy:centerY,
   left:cx-w/2,top:by-h,right:cx+w/2,bottom:by,
   smoothPointer:true
 };
}

const FIXED_GRINDER_MOUNT=Object.freeze({cx:430,by:505,w:158,h:286,zone:'table'});
function fixedGrinderPointerNearTarget(){
 const p=screenToScene(mouse.x,mouse.y),m=FIXED_GRINDER_MOUNT;
 return Math.hypot(p.x-m.cx,p.y-(m.by-m.h*.45))<=150;
}
function fixedGrinderCandidate(el){
 const m=FIXED_GRINDER_MOUNT;
 return {
   zone:'table',inSurface:true,cx:m.cx,by:m.by,vis:1,w:m.w,h:m.h,
   left:m.cx-m.w/2,top:m.by-m.h,right:m.cx+m.w/2,bottom:m.by,
   angle:0,tilt:0,fixedGrinderMount:true
 };
}
let fixedGrinderMountGhost=null;
function ensureFixedGrinderMountGhost(){
 if(fixedGrinderMountGhost)return fixedGrinderMountGhost;
 const g=document.createElement('div');
 g.className='fixed-grinder-mount-ghost';
 Object.assign(g.style,{position:'absolute',pointerEvents:'none',zIndex:'7449',display:'none',
   width:FIXED_GRINDER_MOUNT.w+'px',height:FIXED_GRINDER_MOUNT.h+'px',
   left:(FIXED_GRINDER_MOUNT.cx-FIXED_GRINDER_MOUNT.w/2)+'px',
   top:(FIXED_GRINDER_MOUNT.by-FIXED_GRINDER_MOUNT.h)+'px',
   background:'none',border:'none',boxShadow:'none'});
 const im=document.createElement('img');im.src='assets/items/grinder_fixed/grinder_body.png';im.alt='';
 Object.assign(im.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',
   opacity:'.12',filter:'none',pointerEvents:'none'});
 g.appendChild(im);scene.appendChild(g);fixedGrinderMountGhost=g;return g;
}
function showFixedGrinderMountGhost(on){
 const g=ensureFixedGrinderMountGhost();g.style.display=on?'block':'none';
}
const GRINDER_HANDLE_RX_KEYFRAMES=Object.freeze([
 {phase:0/6,   rx:0},
 {phase:1/6,   rx:66},
 {phase:2/6,   rx:133},
 {phase:3/6,   rx:180},
 {phase:4/6,   rx:247},   // user's -113° unwrapped
 {phase:5/6,   rx:294},   // user's -66° unwrapped
 {phase:1,     rx:360}
]);
function grinderHandleRxAtPhase(t){
 t=((t%1)+1)%1;
 for(let i=0;i<GRINDER_HANDLE_RX_KEYFRAMES.length-1;i++){
   const a=GRINDER_HANDLE_RX_KEYFRAMES[i],b=GRINDER_HANDLE_RX_KEYFRAMES[i+1];
   if(t>=a.phase&&t<=b.phase){
     const u=(t-a.phase)/Math.max(.0001,b.phase-a.phase);
     // smoothstep prevents a visible kink between photographed/calibrated poses
     const q=u*u*(3-2*u);
     return a.rx+(b.rx-a.rx)*q;
   }
 }
 return 0;
}
function setFixedGrinderHandleAngle(el,degrees){
 if(!el||el.dataset.fixedGrinder!=='1'||!el._grinderHandle)return;
 const a=Number.isFinite(+degrees)?+degrees:0;
 const phase=(((a%360)+360)%360)/360;
 const rx=grinderHandleRxAtPhase(phase);
 el.dataset.grinderHandleAngle=String(a);

 const h=el._grinderHandle;

 // Exact calibration supplied by the user:
 // first pose used px 80.7, all rotating poses converge on px 68.2.
 // Blend into that mechanical pivot only at the very start/end of the cycle.
 const edge=Math.min(1,phase*12,(1-phase)*12);
 const pivotX=80.7+(68.2-80.7)*edge;
 h.style.transformOrigin=`${pivotX.toFixed(3)}% 85.4%`;

 // This is the motion the calibration tool demonstrated:
 // no 2D swing across the grinder; only a full rotateX perspective cycle.
 h.style.transform=`perspective(900px) rotateX(${rx.toFixed(3)}deg)`;

 // Keep the mechanical joint visually welded to the shaft for the whole turn.
 // Do NOT swap the entire handle behind/in front of the grinder: that made the
 // centre joint pop in and out at the shaft in the recorded test.
 h.style.zIndex='27';
}
window.CooksterGrinder={
 get:()=>items.find(el=>el.dataset.fixedGrinder==='1')||null,
 setHandleAngle(deg){const el=this.get();if(el)setFixedGrinderHandleAngle(el,deg);}
};


const GRINDER_CAPACITY=3;
const GROUND_PEPPER_RAW_ASSET='assets/ingredients/paprika_mlevena_raw.png';
// The archive's first nine pictures follow the requested vegetable order.
// Pumpkin (#10), cabbage and lettuce intentionally have no grinder entry.
const GROUND_VEGETABLES=Object.freeze({
 paprika:{key:'paprika_mlevena',src:GROUND_PEPPER_RAW_ASSET,art:[39,98,1221,1160]},
 paprika_pecena_oljustena:{key:'paprika_pecena_oljustena_mlevena',src:GROUND_PEPPER_RAW_ASSET,art:[39,98,1221,1160],base:'paprika'},
 paradajz:{key:'paradajz_mleveno',src:'assets/ingredients/paradajz_mleveno_raw.png',art:[36,108,1226,1172]},
 krastavac:{key:'krastavac_mleveno',src:'assets/ingredients/krastavac_mleveno_raw.png',art:[33,90,1220,1172]},
 paprika_zelena:{key:'paprika_zelena_mleveno',src:'assets/ingredients/paprika_zelena_mleveno_raw.png',art:[32,96,1233,1189]},
 luk:{key:'luk_mleveno',src:'assets/ingredients/luk_mleveno_raw.png',art:[46,121,1232,1165]},
 beli_luk:{key:'beli_luk_mleveno',src:'assets/ingredients/beli_luk_mleveno_raw.png',art:[38,97,1218,1174]},
 sargarepa:{key:'sargarepa_mleveno',src:'assets/ingredients/sargarepa_mleveno_raw.png',art:[33,95,1234,1169]},
 patlidzan:{key:'patlidzan_mleveno',src:'assets/ingredients/patlidzan_mleveno_raw.png',art:[36,100,1224,1162]},
 patlidzan_pecen_oljusten:{key:'patlidzan_pecen_oljusten_mleveno',src:'assets/ingredients/patlidzan_mleveno_raw.png',art:[36,100,1224,1162],base:'patlidzan'},
 tikvice:{key:'tikvice_mleveno',src:'assets/ingredients/tikvice_mleveno_raw.png',art:[35,102,1219,1170]},
 rotkvice:{key:'rotkvice_mleveno',src:'assets/ingredients/rotkvice_mleveno_raw.png',art:[45,105,1221,1157]}
});
const GROUND_VEGETABLE_BY_KEY=Object.fromEntries(
 Object.entries(GROUND_VEGETABLES).map(([base,def])=>[def.key,{...def,base}])
);
function grinderQueued(el){return Math.max(0,+el?.dataset?.grinderQueued||0);}
function grinderProgress(el){return Math.max(0,+el?.dataset?.grinderProgress||0);}
function grinderQueue(el){
 let list=[];
 try{const raw=JSON.parse(el?.dataset?.grinderQueue||'[]');if(Array.isArray(raw))list=raw.filter(k=>GROUND_VEGETABLES[k]);}catch{}
 // Saves made before vegetable queues had only grinderQueued (red pepper).
 const legacyCount=Math.min(GRINDER_CAPACITY,Math.floor(grinderQueued(el)));
 while(list.length<legacyCount)list.push('paprika');
 return list.slice(0,GRINDER_CAPACITY);
}
function setGrinderQueue(el,list){
 const clean=list.filter(k=>GROUND_VEGETABLES[k]).slice(0,GRINDER_CAPACITY);
 el.dataset.grinderQueue=JSON.stringify(clean);
 el.dataset.grinderQueued=String(clean.length);
}
function grinderInputPoint(el){
 const r=el?.getBoundingClientRect?.();if(!r)return null;
 return {x:r.left+r.width*.50,y:r.top+r.height*.08};
}
function grinderOutputPoint(el){
 const r=el?.getBoundingClientRect?.();if(!r)return null;
  // The outlet is the round front plate on the right side of the body asset.
  // Keep the emission origin on that opening, not below the grinder.
  return {x:r.left+r.width*.84,y:r.top+r.height*.48};
}
function grinderVesselStillAtOutput(vessel,p){
 if(!vessel||!p||vessel===holding||!vessel.isConnected||
    !isContainerItem(vessel))return false;
 const style=getComputedStyle(vessel);
 if(style.display==='none'||style.visibility==='hidden'||
    (vessel.offsetParent===null&&style.position!=='fixed'))return false;
 const opening=typeof vesselOpeningScreenRect==='function'
   ?vesselOpeningScreenRect(vessel):null;
 const r=vessel.getBoundingClientRect?.();
 if(!r||r.width<2||r.height<2)return false;
 // The outlet can sit just above the calibrated opening while the food falls
 // into it. Keep this corridor narrow enough that a pan moved beside the
 // grinder cannot remain the target merely because it is still nearby.
 const target=opening||r;
 const padX=Math.max(12,target.width*.16);
 const padTop=Math.max(36,target.height*.85);
 const padBottom=Math.max(18,target.height*.24);
 return p.x>=target.left-padX&&p.x<=target.right+padX&&
   p.y>=target.top-padTop&&p.y<=target.bottom+padBottom;
}
function grinderSnapCandidate(el,cand){
 if(!el||!cand||!isContainerItem(el)||cand.zone!=='table'||cand.inSurface===false||
    cand.board||holding?.dataset.fixedGrinder==='1')return cand;
 const grinder=window.CooksterGrinder?.get?.();
 if(!grinder||!grinder.isConnected||grinder===holding||grinder.dataset.surfaceZone==='held')return cand;
 const out=grinderOutputPoint(grinder);
 if(!out)return cand;
 const frame=vesselVisualPreset(el);
 const fx=(frame.left+frame.width*.5)/100;
 const fy=(frame.top+frame.height*.5)/100;
 const natural=sceneToScreen(cand.cx+(fx-.5)*cand.w,cand.by-(1-fy)*cand.h);
 const target={x:out.x,y:out.y+Math.max(18,Math.min(42,cand.h*scale*.22))};
 if(Math.hypot(natural.x-target.x,natural.y-target.y)>82)return cand;
 const dx=(target.x-natural.x)/scale,dy=(target.y-natural.y)/scale;
 return {...cand,cx:cand.cx+dx,by:cand.by+dy,
   left:cand.left+dx,right:cand.right+dx,top:cand.top+dy,bottom:cand.bottom+dy,
   grinderVesselSnap:true};
}
function grinderCanAcceptPepper(item){
 if(!item||item.dataset.vegetable!=='1'||!GROUND_VEGETABLES[item.dataset.vegKey]||
    (item.dataset.cutState||'whole')!=='whole')return false;
 // The grinder accepts a raw pepper too; the recipe judge later sees its
 // unprepared ingredient key and does NOT mistake it for roasted/peeled food.
 return true;
}
function grinderInputHit(el,x,y){
 if(!el)return false;
 const r=el.getBoundingClientRect?.();if(!r)return false;
 // The visual hopper is small, so use a generous rectangular intake zone
 // around the whole upper part of the grinder. This makes dropping a held
 // roasted pepper reliable instead of requiring a pixel-perfect click.
 const left=r.left-r.width*.35;
 const right=r.right+r.width*.35;
 const top=r.top-r.height*.30;
 const bottom=r.top+r.height*.42;
 return x>=left&&x<=right&&y>=top&&y<=bottom;
}
function grinderOutputVessel(el){
 const p=grinderOutputPoint(el);if(!p)return null;
  // A vessel explicitly snapped under the grinder owns the output until moved.
  // Its physical position is rechecked on every crank, so old bindings cannot
  // redirect a new load to a pan that has been taken away.
  if(grinderVesselStillAtOutput(el._grinderOutputVessel,p)&&
     el._grinderOutputVessel.dataset.grinderSnapped==='1')
    return el._grinderOutputVessel;
  if(el._grinderOutputVessel&&!grinderVesselStillAtOutput(el._grinderOutputVessel,p))
    el._grinderOutputVessel=null;
  const direct=containerAt(p.x,p.y);
  if(direct&&grinderVesselStillAtOutput(direct,p)){
    el._grinderOutputVessel=direct;return direct;
  }
  if(grinderVesselStillAtOutput(el._grinderOutputVessel,p))
    return el._grinderOutputVessel;
  const allItems=Array.isArray(items)?items:(window.items||[]);
  const pool=allItems.filter(v=>{
    return v!==el&&grinderVesselStillAtOutput(v,p);
 });
  if(!pool.length){el._grinderOutputVessel=null;return null;}
 pool.sort((a,b)=>{
   const ca=vesselOpeningScreenRect(a),cb=vesselOpeningScreenRect(b);
   const da=Math.hypot((ca?.cx??0)-p.x,(ca?.cy??0)-p.y);
   const db=Math.hypot((cb?.cx??0)-p.x,(cb?.cy??0)-p.y);
   return da-db;
 });
  el._grinderOutputVessel=pool[0];
  return pool[0];
}
function updateGrinderFeedVisual(el){
 if(!el)return;
 let wrap=el.querySelector(':scope > .grinder-feed-visual');
 if(!wrap){
   wrap=document.createElement('div');wrap.className='grinder-feed-visual';
   Object.assign(wrap.style,{position:'absolute',left:'25%',top:'-3%',width:'50%',height:'31%',
     pointerEvents:'none',zIndex:'4',overflow:'visible'});
   el.appendChild(wrap);
 }
  // The actual intake animation is the only pepper image shown above the
  // hopper. Keeping queued sprites here made an old pepper appear to hover
  // over the machine after the drop had already finished.
  wrap.innerHTML='';
  wrap.style.display='none';
  return;
  /*
 wrap.innerHTML='';
 const q=grinderQueued(el),prog=grinderProgress(el);
 for(let i=0;i<q;i++){
   const im=document.createElement('img');
   im.src=PAPRIKA_ROAST_ASSETS[3];im.alt='';
   const active=i===0;
   const sink=active?Math.min(1,prog)*34:0;
   Object.assign(im.style,{position:'absolute',width:'76%',height:'auto',left:(12+(i%2)*5)+'%',
     top:(-6+i*12+sink)+'%',transform:`rotate(${i%2?8:-7}deg) scale(${active?(1-.22*Math.min(1,prog)):1})`,
     transformOrigin:'50% 75%',opacity:String(active?(1-.42*Math.min(1,prog)):1)});
   wrap.appendChild(im);
 }
  */
}
function putRoastedPepperInGrinder(item,el){
 if(!grinderCanAcceptPepper(item)||!el||el.dataset.fixedGrinder!=='1')return false;
  const wasEmpty=grinderQueued(el)<=0;
  if(grinderQueued(el)>=GRINDER_CAPACITY){showToast('Машина је пуна — прво самељи поврће које је унутра.');return true;}
 if(item.dataset.grinderAnimating==='1')return true;
 item.dataset.grinderAnimating='1';
  // A new load always starts a clean grind cycle. This prevents stale
  // progress/pending values from an interrupted or previously completed load
  // from producing output indefinitely.
  if(wasEmpty){
    el.dataset.grinderProgress='0';
    el.dataset.grinderPendingOutput='0';
  }
 const finish=()=>{
   const key=item.dataset.vegKey;
   const progress=+item.dataset.roastProgress||0;
   const prepared=item.dataset.peeled==='1'&&progress>=.75&&progress<1.08
     ?(key==='patlidzan'?'patlidzan_pecen_oljusten'
       :key==='paprika'?'paprika_pecena_oljustena':key)
     :key;
   setGrinderQueue(el,[...grinderQueue(el),prepared]);
   if(!el.dataset.grinderProgress)el.dataset.grinderProgress='0';
   updateGrinderFeedVisual(el);updateHover();CooksterSave.schedule();
   showToast(`${VEGETABLES[item.dataset.vegKey]?.label||'Поврће'} је у машини (${grinderQueued(el)}/${GRINDER_CAPACITY}).`);
 };
 removeItem(item);holding=null;hidePlacementGhost();hideOriginGhost();
 animatePepperIntoGrinder(item,el,finish);
 return true;
}
function animatePepperIntoGrinder(item,grinder,done){
 const body=item?.querySelector?.('.body');
 const src=body?.currentSrc||body?.src||'';
 const r=grinder?.getBoundingClientRect?.();
 if(!src||!r){done?.();return;}
 const input=grinderInputPoint(grinder);
 if(!input){done?.();return;}
 const pepper=document.createElement('img');
 pepper.className='grinder-incoming-pepper';
 pepper.src=src;pepper.alt='';
 const w=Math.max(28,Math.min(104,(+item.dataset.baseW||item.offsetWidth||70)*.72));
 const h=Math.max(24,Math.min(104,(+item.dataset.baseH||item.offsetHeight||70)*.72));
 const startX=input.x,startY=input.y-Math.max(74,h*1.7);
 const endY=input.y+h*.16;
 Object.assign(pepper.style,{
   position:'fixed',left:(startX-w/2)+'px',top:(startY-h/2)+'px',
   width:w+'px',height:h+'px',objectFit:'contain',pointerEvents:'none',
   zIndex:'15000',filter:'drop-shadow(0 3px 3px rgba(45,18,8,.28))',
   transformOrigin:'50% 72%'
 });
 document.body.appendChild(pepper);
  let settled=false;
  const finish=()=>{
    if(settled)return;
    settled=true;
   pepper.remove();
   done?.();
 };
 if(typeof pepper.animate!=='function'){finish();return;}
 const anim=pepper.animate([
   {transform:'translateY(0) rotate(-7deg) scale(1)',opacity:1,offset:0},
   {transform:`translateY(${(endY-startY)*.58}px) rotate(4deg) scale(.94)`,opacity:1,offset:.58},
   {transform:`translateY(${endY-startY}px) rotate(0deg) scale(.68)`,opacity:.25,offset:.92},
   {transform:`translateY(${endY-startY+Math.max(10,h*.16)}px) rotate(0deg) scale(.34)`,opacity:0,offset:1}
 ],{duration:560,easing:'cubic-bezier(.18,.72,.28,1)',fill:'forwards'});
  anim.onfinish=finish;
  anim.oncancel=finish;
  setTimeout(finish,700);
}
function updateGroundPepperMassVisual(vessel){
 // The food layer is the sole source of the ground-pepper image. A second
 // fallback layer could sit above it and leave a stale central circle visible.
 const host=vessel?._panContent||vessel?._vesselContent;
 host?.querySelector?.(':scope > .grinder-live-ground-pepper')?.remove();
}
 function setGroundPepperGrinding(vessel,active){
  if(!vessel)return;
  const host=vessel._panContent||vessel._vesselContent||vessel;
  const img=host?.querySelector?.('.ground-pepper-single-mass');
  if(img)img.classList.toggle('ground-pepper-grinding',!!active);
 }
function addGroundPepperToVessel(vessel,amount=.1,produceKey='paprika'){
 const def=GROUND_VEGETABLES[produceKey];
 if(!def)return;
 const base=def.base||produceKey;
 const meta={key:def.key,baseKey:base,type:'vegetable',form:'ground',
   cutState:'ground',label:produceKey==='paprika_pecena_oljustena'?'Mlevena oljuštena pečena paprika':
     produceKey==='patlidzan_pecen_oljusten'?'Mleven oljušten pečen patlidžan':
     produceKey==='paprika'?'Млевена печена паприка':
     `Млевено поврће: ${VEGETABLES[base]?.label||base}`,src:def.src};
 if(isHeatableCookwareItem(vessel)){
   CooksterPan.addIngredient(vessel,meta.key,amount);
   rememberPanIngredientMeta(vessel,meta);
   renderCookwareContents(vessel);updateCookingStatus(vessel);
 }else{
   CooksterContainer.add(vessel,meta.key,meta,amount);
   renderCookwareContents(vessel);
 }
 updateGroundPepperMassVisual(vessel);
 CooksterSave.schedule();
}
function emitGroundPepper(el,vessel,amount=.1){
 if(!vessel)return false;
 addGroundPepperToVessel(vessel,amount);
 const out=grinderOutputPoint(el);
 if(out){
   const bit=document.createElement('div');
   Object.assign(bit.style,{position:'fixed',left:(out.x-5)+'px',top:(out.y-5)+'px',width:'12px',height:'9px',
     borderRadius:'48%',background:'#8f291c',zIndex:'14000',pointerEvents:'none',
     boxShadow:'0 0 0 1px rgba(75,20,13,.30)'});
   document.body.appendChild(bit);
   const vr=vessel.getBoundingClientRect(),tx=(vr.left+vr.width*.5)-out.x,ty=(vr.top+vr.height*.38)-out.y;
   const anim=bit.animate([
     {transform:'translate(0,0) scale(1)',opacity:1},
     {transform:`translate(${tx*.55}px,${ty*.55}px) scale(.85)`,opacity:.9,offset:.55},
     {transform:`translate(${tx}px,${ty}px) scale(.55)`,opacity:.45}
   ],{duration:330,easing:'ease-in',fill:'forwards'});
   anim.onfinish=()=>bit.remove();
 }
 return true;
}
function spawnGroundPepperOutput(el,vessel=null){
  // The vessel owns the single growing PNG. Do not create falling/output
  // sprites here: repeated outlet sprites were the visible endless red stream
  // during a crank drag.
  return !!vessel;
}
function grindByDegrees(el,degrees){
  if(!el||degrees<=0)return;
  if(grinderQueued(el)<=0){
    // Close any stale tail from an old save/interrupt before accepting a new
    // load. With no queued pepper there must be no output state left.
    el.dataset.grinderProgress='0';
    el.dataset.grinderPendingOutput='0';
    return;
  }
  let prog=grinderProgress(el);
  // One full crank revolution completes one pepper. Add the matching fraction
  // immediately instead of waiting for .10 chunks, so the single mound grows
  // on every real handle movement.
  let remaining=Math.max(0,degrees/360);
  while(remaining>0&&grinderQueued(el)>0){
    const portion=Math.min(remaining,Math.max(.000001,1-prog));
    const vessel=grinderOutputVessel(el);
    const current=grinderQueue(el)[0]||'paprika';
    if(vessel){
      addGroundPepperToVessel(vessel,portion,current);
      setGroundPepperGrinding(vessel,true);
    }
    prog+=portion;
    remaining-=portion;
    if(prog>=.999999){
      setGrinderQueue(el,grinderQueue(el).slice(1));
      prog=0;
    }
  }
  if(grinderQueued(el)<=0){
     // The final fraction belongs to the pepper just completed; never carry it
     // into a future drag.
    prog=0;
  }
 el.dataset.grinderProgress=String(Math.max(0,prog));
  el.dataset.grinderPendingOutput='0';
 updateGrinderFeedVisual(el);CooksterSave.schedule();
}
let grinderCrankDrag=null;
function grinderCrankPivot(el){
 if(!el)return null;
 const r=el.getBoundingClientRect?.();if(!r)return null;
 // Fixed center of the left shaft on the grinder body asset.
 // Crucially this does not move when the handle itself transforms.
 return {x:r.left+r.width*.147,y:r.top+r.height*.463};
}
function grinderCrankPointerAngleFromPivot(p,clientX,clientY){
 return Math.atan2(clientY-p.y,clientX-p.x)*180/Math.PI;
}
function grinderAngleDelta(a,b){
 let d=a-b;
 while(d>180)d-=360;
 while(d<-180)d+=360;
 return d;
}
function beginGrinderCrankDrag(e,el){
 if(!el||el.dataset.fixedGrinder!=='1'||holding===el||placing||picking)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const h=el._grinderHandle,pivot=grinderCrankPivot(el);if(!h||!pivot)return;
 const dx=e.clientX-pivot.x,dy=e.clientY-pivot.y;
 const current=+(el.dataset.grinderHandleAngle||0);
 grinderCrankDrag={
   el,pointerId:e.pointerId,pivot,
   lastPointer:grinderCrankPointerAngleFromPivot(pivot,e.clientX,e.clientY),
   angle:current,
    // Keep the photographed crank motion 1:1 with the pointer. The previous
    // gain made the handle race ahead while the mound was still tiny.
    gain:1,
   deadRadius:14
 };
 h.style.cursor='grabbing';
 try{h.setPointerCapture(e.pointerId);}catch(_){}
}
function moveGrinderCrankDrag(e){
 const d=grinderCrankDrag;if(!d||e.pointerId!==d.pointerId)return;
 e.preventDefault();e.stopPropagation();
 const dx=e.clientX-d.pivot.x,dy=e.clientY-d.pivot.y;
 const radius=Math.hypot(dx,dy);
 // atan2 becomes unstable almost exactly on the axle. Freeze only this tiny
 // centre zone instead of letting the crank jump/flicker.
 if(radius<d.deadRadius)return;
 const now=grinderCrankPointerAngleFromPivot(d.pivot,e.clientX,e.clientY);
 const delta=grinderAngleDelta(now,d.lastPointer);
 // Reject impossible one-frame spikes; normal circular movement stays smooth.
 if(Math.abs(delta)<=75){
   const driven=delta*d.gain;
   d.angle+=driven;
   setFixedGrinderHandleAngle(d.el,d.angle);
   grindByDegrees(d.el,Math.abs(driven));
 }
 d.lastPointer=now;
}
function endGrinderCrankDrag(e){
 const d=grinderCrankDrag;if(!d||e.pointerId!==d.pointerId)return;
 e.preventDefault();e.stopPropagation();
 if(d.el?._grinderHandle)d.el._grinderHandle.style.cursor='grab';
  if(d.el)setGroundPepperGrinding(grinderOutputVessel(d.el),false);
 grinderCrankDrag=null;
}
window.addEventListener('pointerdown',e=>{
 const h=e.target?.closest?.('.grinder-fixed-handle');
 if(!h)return;
 const el=h.closest('.item');
 beginGrinderCrankDrag(e,el);
},{capture:true});
window.addEventListener('pointermove',moveGrinderCrankDrag,{capture:true});
window.addEventListener('pointerup',endGrinderCrankDrag,{capture:true});
window.addEventListener('pointercancel',endGrinderCrankDrag,{capture:true});

function placementCandidate(el){
 if(el?.dataset?.fixedGrinder==='1'){
   if(fixedGrinderPointerNearTarget())return fixedGrinderCandidate(el);
   const p=screenToScene(mouse.x,mouse.y);
   const vis=.5;
   const bw=Math.max(1,+el.dataset.baseW||105),bh=Math.max(1,+el.dataset.baseH||190);
   return {zone:'grinder-carry',inSurface:true,cx:p.x,by:p.y,vis,w:bw*vis,h:bh*vis,
     left:p.x-bw*vis/2,top:p.y-bh*vis,right:p.x+bw*vis/2,bottom:p.y,
     angle:0,tilt:0,grinderCarry:true};
 }
 let cand=CooksterPlacement.resolve(el);
 if(!cand)return cand;

 // Stove placement is fully free. Burner geometry is used only later for heat
 // detection; it must never alter candidate pose, collision or ownership.
 if(cand.zone==='stove'&&isContainerItem(el)&&isHeatableCookwareItem(el)){
   delete cand.stoveZone;
   delete cand.stoveZoneLabel;
   delete cand.burnerSnap;
 }

 if(cand.zone==='board'&&cand.board&&isBoardCuttableItem(el)){
   cand=boardCenterSnapCandidate(el,cand);
 }
 cand=continuousPointerCandidate(el,cand);
 // Geometry-driven engine is now the single scale authority.
 // Legacy per-item PerspectiveCalibration must not mutate candidate scale/pose here.
 if(cand){
   const z=cand.inSurface===false?'back':(cand.zone||el.dataset.surfaceZone||'table');   // outside: the table's perspective continues
   const bw=Math.max(1,+el.dataset.baseW||el.offsetWidth||60);
   const bh=Math.max(1,+el.dataset.baseH||el.offsetHeight||60);

   // Scale depends on depth (`by`). For direct dragging, settle that depth while
   // keeping the pointer locked to the rendered centre.
   if(Number.isFinite(+cand.pointerCy)&&Number.isFinite(+cand.pointerCx)){
     cand.cx=+cand.pointerCx;
     for(let i=0;i<2;i++){
       const probe0={dataset:{...el.dataset,cx:String(cand.cx),by:String(cand.by),surfaceZone:z}};
       cand.vis=surfaceScaleFor(probe0,z,cand.by);
       cand.w=bw*cand.vis;cand.h=bh*cand.vis;
       cand.by=(+cand.pointerCy)+cand.h*.5;
     }
   }

   const probe={dataset:{...el.dataset,cx:String(cand.cx),by:String(cand.by),surfaceZone:z}};
   cand.vis=surfaceScaleFor(probe,z,cand.by);
   const corr=typeof perspectiveCorrectionFor==='function'?perspectiveCorrectionFor(probe,z):{angle:0,tilt:0};
   cand.angle=(+el.dataset.angle||0)+(+corr.angle||0);
   cand.tilt=itemTiltValue(el,(+el.dataset.tilt||0)+(+corr.tilt||0));
   cand.flatten=surfaceFlattenFor(probe,z,cand.by);
   cand.w=bw*cand.vis;cand.h=bh*cand.vis;

   // Final exact lock after the last scale sample.
   if(Number.isFinite(+cand.pointerCy)&&Number.isFinite(+cand.pointerCx)){
     cand.cx=+cand.pointerCx;
     cand.by=(+cand.pointerCy)+cand.h*.5;
   }

   cand.left=cand.cx-cand.w/2;cand.top=cand.by-cand.h;
   cand.right=cand.cx+cand.w/2;cand.bottom=cand.by;
 }
 return grinderSnapCandidate(el,cand);
}
function occupiedRectFor(other){return CooksterCollision.occupiedRectFor(other)}
function placementBlocked(el,cand){
 if(!cand)return true;
 if(el?.dataset?.fixedGrinder==='1'&&(cand.fixedGrinderMount||cand.grinderCarry))return false;
 if(cand.inSurface===false)return true;

 // Stove collision is ordinary scene collision only.
 // Burner rings do not reserve or reposition cookware.


 const test=placementRectFor(cand,el);
 const movingBoard=el.dataset.itemId==='daska';

 if(cand.boardSnap){
   for(const other of items){
     if(other===el||other===cand.board)continue;
     if(other.dataset.attachedToBoard==='1'&&(other.dataset.vegetable==='1'||other.dataset.fruit==='1')){
       return true;
     }
   }
 }

 for(const other of items){
   if(other===el)continue;
   // A receiver is intentionally positioned beneath the fixed grinder.
   // The grinder's large collision sprite must not reject that exact snap.
   if(cand.grinderVesselSnap&&other.dataset.fixedGrinder==='1')continue;
   if(cand.board&&other===cand.board)continue;
   if(cand.boardSnap&&other.dataset.itemId==='noz'&&other.dataset.attachedToBoard==='1')continue;
   if(movingBoard&&other.dataset.attachedToBoard==='1')continue;
   if(cand.storage&&other.dataset.crate!=='1')continue;
   const orc=occupiedRectFor(other);
   if(!orc)continue;
   if(rectsOverlap(test,orc))return true;
 }
 return false;
}

let placementGhostMotion=null;
let surfaceTrailCanvas=null,surfaceTrailCtx=null,surfaceTrailLast=null,surfaceTrailFadeRaf=0,surfaceTrailLastPaint=0;
function ensureSurfaceTrailCanvas(){
 if(surfaceTrailCanvas)return surfaceTrailCanvas;
 surfaceTrailCanvas=document.createElement('canvas');
 surfaceTrailCanvas.width=BASE_W;surfaceTrailCanvas.height=BASE_H;
 surfaceTrailCanvas.className='cookster-surface-motion-trail';
 surfaceTrailCanvas.setAttribute('aria-hidden','true');
 Object.assign(surfaceTrailCanvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'18',mixBlendMode:'multiply'});
 scene.appendChild(surfaceTrailCanvas);
 surfaceTrailCtx=surfaceTrailCanvas.getContext('2d');
 return surfaceTrailCanvas;
}
function fadeSurfaceMotionTrail(){
 if(!surfaceTrailCtx){surfaceTrailFadeRaf=0;return;}
 const age=performance.now()-surfaceTrailLastPaint;
 surfaceTrailCtx.save();
 surfaceTrailCtx.globalCompositeOperation='destination-out';
 // A soft ~0.55 s disappearance, without a hard final cut.
 surfaceTrailCtx.fillStyle=age>650?'rgba(0,0,0,.14)':'rgba(0,0,0,.045)';
 surfaceTrailCtx.fillRect(0,0,BASE_W,BASE_H);
 surfaceTrailCtx.restore();
 if(age<1200)surfaceTrailFadeRaf=requestAnimationFrame(fadeSurfaceMotionTrail);
 else{surfaceTrailCtx.clearRect(0,0,BASE_W,BASE_H);surfaceTrailFadeRaf=0;}
}
function updateSurfaceMotionTrail(el,pose,zone){
 // v1.79: surface trails were too subtle behind the scene's shadow layers.
 // The experiment is disabled; held objects use one animated contact shadow.
 surfaceTrailLast=null;return;
 const point={x:+pose.cx,y:+pose.by-2,w:+pose.w||120};
 if(!surfaceTrailLast){surfaceTrailLast=point;return;}
 const dx=point.x-surfaceTrailLast.x,dy=point.y-surfaceTrailLast.y,dist=Math.hypot(dx,dy);
 if(dist<1.1)return;
 ensureSurfaceTrailCanvas();
 const ctx=surfaceTrailCtx,poly=placementGeometry.SURFACES.tablePoly;
 ctx.save();
 if(Array.isArray(poly)&&poly.length>2){ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.clip();}
 const speedStrength=Math.min(1,dist/11),width=Math.max(14,Math.min(42,point.w*.19));
 // Two soft strokes read as a surface smear, not smoke or a duplicate object.
 ctx.globalCompositeOperation='source-over';
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.filter='blur(7px)';ctx.strokeStyle=`rgba(65,39,22,${(.085+speedStrength*.075).toFixed(3)})`;ctx.lineWidth=width*1.75;
 ctx.beginPath();ctx.moveTo(surfaceTrailLast.x,surfaceTrailLast.y);ctx.quadraticCurveTo((surfaceTrailLast.x+point.x)/2,(surfaceTrailLast.y+point.y)/2,point.x,point.y);ctx.stroke();
 ctx.filter='blur(3px)';ctx.strokeStyle=`rgba(48,30,18,${(.055+speedStrength*.055).toFixed(3)})`;ctx.lineWidth=width*.76;
 ctx.beginPath();ctx.moveTo(surfaceTrailLast.x,surfaceTrailLast.y);ctx.lineTo(point.x,point.y);ctx.stroke();
 ctx.restore();
 surfaceTrailLast=point;surfaceTrailLastPaint=performance.now();
 if(!surfaceTrailFadeRaf)surfaceTrailFadeRaf=requestAnimationFrame(fadeSurfaceMotionTrail);
}


function resetPlacementGhostMotion(){
 if(placementGhostMotion?.raf)cancelAnimationFrame(placementGhostMotion.raf);
 placementGhostMotion=null;
 if(placementGhost)placementGhost.classList.remove('placement-smooth');
}
function setGhostPoseStyles(ghost,pose){
 ghost.style.width=pose.w+'px';
 ghost.style.height=pose.h+'px';
 ghost.style.left=(pose.cx-pose.w/2)+'px';
 ghost.style.top=(pose.by-pose.h)+'px';
 ghost.style.transformOrigin='50% 90%';
 ghost.style.transform=`perspective(1200px) rotateX(${pose.tilt}deg) rotateZ(${pose.angle}deg) scaleY(${Number.isFinite(+pose.flatten)?+pose.flatten:1})`;
 ghost.style.zIndex=String(pose.z);
 syncBackpackHeldPreview(ghost);
}

function updateHeldContactShadowFromPose(el,pose,surfaceOverride=null){
 if(!el?._contactShadow||!pose)return;
 const cfg=contactShadowCalibrationFor(el,surfaceOverride)
   ||{x:0,y:0,width:.72,height:.07,opacity:.52,blur:.8,angle:.6};
 const w=Math.max(1,+pose.w||(+el.dataset.baseW||60)*(+el.dataset.vis||1));
 const h=Math.max(1,+pose.h||(+el.dataset.baseH||60)*(+el.dataset.vis||1));
 const cx=Number.isFinite(+pose.cx)?+pose.cx:(+el.dataset.cx||0);
 const by=Number.isFinite(+pose.by)?+pose.by:(+el.dataset.by||0);
 const ang=Number.isFinite(+pose.angle)?+pose.angle:(+el.dataset.angle||0);
 el._contactShadow.style.visibility='';
 if(el.dataset.itemId==='daska'){
  styleBoardContactShadow(el._contactShadow,cfg,w,h,cx,by,ang,false);
 }else{
  const img=el._contactShadow.querySelector('img');
  if(img)img.style.display='block';
  el._contactShadow.style.background='';
  el._contactShadow.style.borderRadius='';
  styleCalibratedContactShadow(el._contactShadow,cfg,w,h,cx,by,ang,false);
 }
 el._contactShadow.style.zIndex=String(Math.max(1,(Number.isFinite(+pose.z)?+pose.z:20)-1));
}
function isSmoothTestPot(el){return !!el&&(el.dataset.itemId||'').includes('serpa')}
// One fixed drag weight for every item, regardless of type, contents or heat.
function heldMovementMass(){return .375;}
function heldMovementResponseMs(el){return (64+heldMovementMass(el)*24)*.9;}
function playSmoothPotPickupGhost(ghost){
 const body=ghost?.querySelector?.('.body');
 if(!body)return;
 body.getAnimations?.().forEach(a=>a.cancel());
 body.animate([
   {opacity:.78,filter:'brightness(1.045)',transform:'scale(.975)'},
   {opacity:1,filter:'brightness(1.015)',transform:'scale(1.006)',offset:.72},
   {opacity:1,filter:'brightness(1)',transform:'scale(1)'}
 ],{duration:220,easing:'cubic-bezier(.20,.70,.24,1)'});
}
function updateSmoothPlacementGhost(ghost,el,cand){
 // Momentum belongs to this physical item, never to its changing heat/food data.
 const key=el;
 const landingLift=el?.dataset?.itemId==='daska'
   ? Math.max(6,Math.min(10,(cand.h||70)*.055))
   : 0;
 const target={
   cx:+cand.cx,by:+cand.by-landingLift,w:+cand.w,h:+cand.h,
   angle:Number.isFinite(+cand.angle)?+cand.angle:+(el.dataset.angle||0),
   tilt:Number.isFinite(+cand.tilt)?itemTiltValue(el,cand.tilt):itemTiltValue(el,el.dataset.tilt||0),
   flatten:Number.isFinite(+cand.flatten)?+cand.flatten:1,
   zone:(cand.zone==='stove'||cand.zone==='floor'||cand.zone==='table')?cand.zone:'table',
   z:cand.storage?31:Math.max(20,(cand.board?parseInt(cand.board.style.zIndex||cand.board.dataset.zBase||1,10):Math.floor(cand.by))+135)
 };

 if(!placementGhostMotion||placementGhostMotion.key!==key){
   resetPlacementGhostMotion();
   placementGhostMotion={key,target:{...target},pose:{...target},last:performance.now(),raf:0};
   ghost.classList.add('placement-smooth');
   setGhostPoseStyles(ghost,placementGhostMotion.pose);
   updateHeldContactShadowFromPose(el,placementGhostMotion.pose,placementGhostMotion.target.zone);
   return;
 }

 placementGhostMotion.target={...target};
 ghost.classList.add('placement-smooth');

 if(placementGhostMotion.raf)return;
 const step=(now)=>{
   const m=placementGhostMotion;
   if(!m||m.key!==key||holding!==el||ghost.style.display==='none'){
     resetPlacementGhostMotion();
     return;
   }

   const dt=Math.max(1,Math.min(34,now-(m.last||now)));
   m.last=now;
    const mass=heldMovementMass(el),responseMs=heldMovementResponseMs(el);
   const a=1-Math.exp(-dt/responseMs);
   const p=m.pose,t=m.target;
   p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;
   const stiffness=.00034/mass,damping=.028/Math.sqrt(mass);
   p.vx=(p.vx+(t.cx-p.cx)*stiffness*dt)*Math.exp(-damping*dt);
   p.vy=(p.vy+(t.by-p.by)*stiffness*dt)*Math.exp(-damping*dt);
   p.cx+=p.vx*dt;p.by+=p.vy*dt;
   p.w=lerp(p.w,t.w,a);
   p.h=lerp(p.h,t.h,a);
   p.angle=lerp(p.angle,t.angle,a);
   p.tilt=lerp(p.tilt,t.tilt,a);
   p.flatten=lerp(Number.isFinite(+p.flatten)?+p.flatten:1,Number.isFinite(+t.flatten)?+t.flatten:1,a);
   p.zone=t.zone;
   p.z=t.z;
   setGhostPoseStyles(ghost,p);
   updateHeldContactShadowFromPose(el,p,t.zone);
   updateSurfaceMotionTrail(el,p,cand.zone);

   const moving=
     Math.abs(p.cx-t.cx)>.12||
     Math.abs(p.by-t.by)>.12||
     Math.abs(p.w-t.w)>.08||
     Math.abs(p.h-t.h)>.08||
     Math.abs(p.angle-t.angle)>.03||
     Math.abs(p.tilt-t.tilt)>.03||Math.abs(p.vx)>.006||Math.abs(p.vy)>.006;
   if(moving){
     m.raf=requestAnimationFrame(step);
   }else{
     m.pose={...t,vx:0,vy:0};
     setGhostPoseStyles(ghost,m.pose);
     updateHeldContactShadowFromPose(el,m.pose,m.target.zone);
     m.raf=0;
   }
 };
 placementGhostMotion.raf=requestAnimationFrame(step);
}

function updatePlacementGhost(){
 hideOriginGhost();
 setBoardSnapIndicator(false);
 showFixedGrinderMountGhost(!!holding&&holding.dataset.fixedGrinder==='1');
 if(!holding||rotating||isCutting||placing||picking){
   if(holding&&!placing&&!picking)clearHeldPlacementState(holding);
   hidePlacementGhost();
   return;
 }

 // Normal kitchen objects use only the live placement-candidate pose.
 // Quick hand tools keep their special carry pose.
 if(holding.dataset.fixedGrinder==='1'){
   const p=screenToScene(mouse.x,mouse.y);
   setPose(holding,p.x,p.y,.5);
 }else if(isQuickToolItem(holding)){
   const preview=heldPreviewPoseFor(holding);
   setPose(holding,preview.cx,preview.by,preview.vis);
   holding.style.transformOrigin='50% 50%';
   holding.style.transform=`perspective(1200px) rotateX(${itemTiltValue(holding,holding.dataset.tilt||0)*.45}deg) rotateZ(${+(holding.dataset.angle||0)+preview.carryAngle}deg)`;
 }
 holding.style.zIndex='9999';
 if(holding.dataset.itemId==='daska'){
   for(const el of items){
     if(el!==holding&&el.dataset.attachedToBoard==='1'&&el.dataset.itemId!=='noz'){
       syncOneBoardAttachment(el,holding);
     }
   }
 }
 clearHeldPlacementState(holding);

  let cand;
  if(holding.dataset.marketBag==='1'&&sinkHit(mouse.x,mouse.y)){
    const p=screenToScene(mouse.x,mouse.y);
    const vis=.72,w=(+holding.dataset.baseW||112)*vis,h=(+holding.dataset.baseH||112)*vis;
    cand={zone:'sink-pour',sinkPour:true,inSurface:true,cx:p.x,by:p.y,vis,w,h,
      left:p.x-w/2,top:p.y-h,right:p.x+w/2,bottom:p.y,
      angle:holding.dataset.sinkPouring==='1'?(+holding.dataset.angle||0):(+holding.dataset.angle||0)+58,tilt:0};
  }else cand=placementCandidate(holding);
 if(cand&&cand.inSurface===false&&Number.isFinite(cand.cx)&&Number.isFinite(cand.by)){
   placementState={candidate:cand,blocked:true};
   cand={...cand,zone:'outside'};
 }else if(!cand||cand.inSurface===false||!Number.isFinite(cand.cx)||!Number.isFinite(cand.by)){
   placementState=cand?{candidate:cand,blocked:true}:null;
   const p=screenToScene(mouse.x,mouse.y);
   const vis=surfaceScaleFor(holding,'floor',p.y);
   const w=(+holding.dataset.baseW||60)*vis,h=(+holding.dataset.baseH||60)*vis;
   cand={zone:'outside',inSurface:false,cx:p.x,by:p.y,vis,w,h,left:p.x-w/2,top:p.y-h,right:p.x+w/2,bottom:p.y,angle:+holding.dataset.angle||0};
 }
  const blocked=cand.inSurface===false||(!cand.sinkPour&&placementBlocked(holding,cand));
 placementState={candidate:cand,blocked};
 if(cand.boardSnap)setBoardSnapIndicator(!blocked);


 // The carried item is represented by the true-colour placement ghost, but
 // its sunlight shadow is an independent scene canvas. Render that canvas at
 // the ghost/cursor pose (not at the hidden legacy hand pose).
const ghost=ensurePlacementGhostFor(holding);
 ghost.classList.toggle('grinder-placement-ghost',holding.dataset.fixedGrinder==='1');
 ghost.classList.remove('ok','blocked','source');
 ghost.classList.add(blocked?'blocked':'ok');
 showPlacementGhostTween(ghost);
 if(isSmoothTestPot(holding)&&holding._smoothPickupPending){
   holding._smoothPickupPending=false;
   playSmoothPotPickupGhost(ghost);
 }

 // v198.5.24: every held object uses the same rAF-smoothed true-color ghost.
 updateSmoothPlacementGhost(ghost,holding,cand);
 if(placementGhostMotion?.pose)updateSurfaceMotionTrail(holding,placementGhostMotion.pose,cand.zone);
 return;
}


function tryPlaceHeldAtCandidate(el){
 let cand=(placementState&&holding===el?placementState.candidate:null)||placementCandidate(el);
 if(!cand)return false;
 if(placementBlocked(el,cand)){
   updatePlacementGhost();
   showToast('Ovde nema mesta — pomeri predmet na slobodan deo površine.');
   return false;
 }

 placing=true;
 surfaceTrailLast=null;
 hidePlacementGhost();hideOriginGhost();
 el.style.visibility='';
 
 if(el._contactShadow)el._contactShadow.style.visibility='';
 el.classList.remove('held');
 heldGrabState=null;
 clearHeldPlacementState(el);
 el.style.removeProperty('--held-z');

 const oldTransition=el.style.transition||'';
 const targetZone=cand.zone||'table';

 // v165.2: adopt the FINAL surface state at mouse release, not ~250 ms later.
 // This makes floor/table perspective instantaneous and prevents the visible
 // "then it suddenly flattens" change after the item has already landed.
 el.style.transition='none';
 el.dataset.surfaceZone=targetZone;
 delete el.dataset.pickupSurfaceZone;
 if(isContainerItem(el)){
   if(cand.grinderVesselSnap){
     const grinder=window.CooksterGrinder?.get?.();
     if(grinder&&grinder!==el){
       if(grinder._grinderOutputVessel&&grinder._grinderOutputVessel!==el)
         delete grinder._grinderOutputVessel.dataset.grinderSnapped;
       grinder._grinderOutputVessel=el;
       el.dataset.grinderSnapped='1';
     }
   }else delete el.dataset.grinderSnapped;
 }
 if(targetZone==='stove'&&isContainerItem(el)&&isHeatableCookwareItem(el)){
   // Free placement on the stove: no burner snapping / centering.
   window.CooksterStoveZones?.release(el);
 }else{
   // Ceramic/service bowls can sit on the stove as ordinary objects, but never
   // own a burner. Leaving the stove also clears any stale burner assignment.
   window.CooksterStoveZones?.release(el);
 }

 if(el.dataset.crate==='1'){
   const zone=(targetZone==='table'?'table':(targetZone==='floor'?'floor':'table'));
   setCrateZone(el,zone);
   // Re-resolve after crate zone metadata has been updated.
   const refreshed=placementCandidate(el);
   if(refreshed&&refreshed.inSurface!==false&&!placementBlocked(el,refreshed))cand=refreshed;
 }

 if(el.dataset.preHeldTransformOrigin!==undefined){
   delete el.dataset.preHeldTransformOrigin;
 }


 // Apply only the final surface transform NOW, while keeping the held position.
 const currentAngle=+(el.dataset.angle||0);
 const currentBy=+el.dataset.by||cand.by;
 const finalFlatten=surfaceFlattenFor(el,targetZone,currentBy);
 const pr=snapProfileFor(el);
 if(targetZone==='floor'){
   el.style.transformOrigin='50% 100%';
 }else if(pr){
   el.style.transformOrigin=`50% ${Math.round(pr.anchorY*100)}%`;
 }
 el.style.transform=itemPoseTransform(el,currentAngle,finalFlatten);
 // Force the transform to commit before positional animation begins.
 void el.offsetWidth;

 
 if(el._contactShadow)el._contactShadow.style.opacity='0';

 // Direct placement: the visible proxy already follows the cursor. On release,
 // reveal the real item at that exact X position, only a few pixels above the
 // surface, then let it settle straight down. Never fly in from the retired
 // hand/carry position.
 const dropLift=Math.max(6,Math.min(10,(cand.h||70)*.055));
 const dropMs=125;
 const impactAction=cand.zone==='table'?'dropTable':cand.zone==='stove'?'dropStove':'drop';
 const earlyImpactScheduled=scheduleEarlyImpactSound(el,dropMs,impactAction);
 const isTableImpact=cand.zone==='table';
 const isPotTableImpact=isTableImpact&&(el.dataset.itemId||'').includes('serpa');
 let tableImpactPlayed=false;
 const playTableImpact=()=>{
   if(!isTableImpact||tableImpactPlayed)return;
   tableImpactPlayed=true;
   if(el.dataset.itemId==='daska')popArtPuffForBoard(el);
   else if(isHeatableCookwareItem(el))popArtPuffForCookware(el);
   else popArtPuff(+el.dataset.cx,+el.dataset.by,Math.max(.55,(+el.dataset.vis||1)*.72));
   if(!earlyImpactScheduled)playImpactSound(el,impactAction);
 };
 const silentPose=(cx,by,vis)=>{
   setPose(el,cx,by,vis);
   
   if(el._contactShadow)el._contactShadow.style.opacity='0';
 };

 const finish=()=>{
   el.style.transition=oldTransition;

   if(cand.board){
     setPose(el,cand.cx,cand.by,cand.vis);
     attachToBoard(el,cand.board,'relative');
     syncOneBoardAttachment(el,cand.board);
   }else{
     setPose(el,cand.cx,cand.by,cand.vis);
   }

   if(cand.storage||cand.zone==='floor'){
     delete el.dataset.underTable;
     el.style.zIndex= cand.zone==='floor' ? String(Math.max(16,Math.floor(cand.by)+12)) : '20';
if(el._contactShadow)el._contactShadow.style.zIndex= cand.zone==='floor' ? String(Math.max(15,Math.floor(cand.by)+11)) : '19';
   }else{
     delete el.dataset.underTable;
   }

   if(isContainerItem(el)){
     setCookwareOnStove(el,cand.zone==='stove');
     // Rebuild the visual food tree from persisted model state after movement.
     // This guarantees that contents stay attached to the vessel after pickup/drop.
     renderCookwareContents(el);
     if(isHeatableCookwareItem(el))updateCookingStatus(el);
   }
   if(isProduceItem(el))setProduceOnStove(el,cand.zone==='stove');
   if(el.dataset.itemId==='daska'){
     ensureKnifeAlwaysOnBoard(el);
   }

   // Same surfaceZone is already active, so this cannot cause a late perspective jump.
   setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||cand.vis);
   // Re-assert board attachment after the final pose so the item cannot end
   // the drop animation underneath the cutting board.
   if(cand.board&&el.dataset.attachedToBoard==='1')syncOneBoardAttachment(el,cand.board);
   const cx=+el.dataset.cx,by=+el.dataset.by,vis=+el.dataset.vis||1;
   if(isTableImpact){
     // Table feedback already starts just before visual contact to compensate
     // for media/audio startup latency. This fallback only covers interruption.
     playTableImpact();
   }else if(isHeatableCookwareItem(el)&&cand.zone==='table'){
     popArtPuffForCookware(el);
   }else{
     popArtPuff(cx,by,Math.max(.55,vis*.72));
   }
   if(!isTableImpact&&!earlyImpactScheduled)playImpactSound(el,impactAction);
   holding=null;placing=false;showFixedGrinderMountGhost(false);clearPourTarget();hidePlacementGhost();hideOriginGhost();updateHover();
   CooksterSave.schedule();

   // v165.2: no delayed auto-tuck. The object stays exactly where it was dropped.
 };

 // First pose is already at the cursor/ghost location, so no old hand origin
 // can leak into the landing animation.
 el.style.transition='none';
 silentPose(cand.cx,cand.by-dropLift,cand.vis);
 void el.offsetWidth;
 el.style.transition=`top ${dropMs}ms cubic-bezier(.18,.78,.24,1)`;
 requestAnimationFrame(()=>{
   silentPose(cand.cx,cand.by,cand.vis);
 });

 // Start both cues together 40 ms before the CSS settle completes. In the
 // rendered result their first visible/audible transient lands on contact.
 // The contact cue is fired in finish(), at the same moment the final pose is
 // committed, so there is no early/default sound during dragging.
 if(isPotTableImpact)setTimeout(()=>playPotTableImpactVisual(el),dropMs);
 setTimeout(finish,dropMs+18);
 return true;
}

function makeCrop(imgSrc,lidMeta){
 const crop=document.createElement('div');crop.className='lid-hit';
 crop.style.left=(lidMeta.x*100)+'%';crop.style.top=(lidMeta.y*100)+'%';crop.style.width=(lidMeta.w*100)+'%';crop.style.height=(lidMeta.h*100)+'%';
 const im=document.createElement('img');im.className='lid-crop';im.src=imgSrc;
 im.style.width=(100/lidMeta.w)+'%';im.style.height=(100/lidMeta.h)+'%';
 im.style.left=(-lidMeta.x/lidMeta.w*100)+'%';im.style.top=(-lidMeta.y/lidMeta.h*100)+'%';
 crop.appendChild(im); return crop;
}

function makeInterior(d){
 const m=d.lid, inside=d.inside||['#d6a064','#99602f','#5b3519'];
 const el=document.createElement('div');el.className='interior '+(m.type==='jar'?'jar':'pot');
 const x=m.type==='jar'?m.x+.06:m.x+.03, y=m.type==='jar'?m.y+.09:m.y+.07, w=m.type==='jar'?m.w-.12:m.w-.06, h=m.type==='jar'?m.h*.70:m.h*.78;
 el.style.left=(x*100)+'%';el.style.top=(y*100)+'%';el.style.width=(w*100)+'%';el.style.height=(h*100)+'%';
 el.style.setProperty('--inside-hi',inside[0]);el.style.setProperty('--inside',inside[1]);el.style.setProperty('--inside-dark',inside[2]);return el;
}

function clampItemTilt(v){
 const n=Number.isFinite(+v)?+v:0;
 return Math.max(-60,Math.min(60,n));
}
function itemTiltValue(el,v){
 const n=Number.isFinite(+v)?+v:0;
 return el?.dataset?.calibrationCopy==='1'?n:clampItemTilt(n);
}
function itemPoseTransform(el,ang,flatten=1,tiltOverride=null){
 const tilt=itemTiltValue(el,tiltOverride===null?(el?.dataset?.tilt||0):tiltOverride);
 // Small CSS 3D pitch only. Perspective is intentionally long so sprites
 // foreshorten subtly instead of bending/skewing like the rejected v199 pass.
 return `perspective(1200px) rotateX(${tilt}deg) rotateZ(${ang}deg) scaleY(${flatten})`;
}

function setPose(el,cx,by,vis){
 el.dataset.cx=cx;el.dataset.by=by;
 const surfaceZone=el.dataset.surfaceZone||'table';
 if(hasPerspectiveCalibrationPoints(el,surfaceZone)){
   vis=surfaceScaleFor(el,surfaceZone,by);
 }
 const bw=+el.dataset.baseW,bh=+el.dataset.baseH,w=bw*vis,h=bh*vis;
 el.dataset.vis=vis;
 el.style.width=w+'px';el.style.height=h+'px';el.style.left=(cx-w/2)+'px';el.style.top=(by-h)+'px';
 const pc=typeof perspectiveCorrectionFor==='function'?perspectiveCorrectionFor(el,el.dataset.surfaceZone||'table'):{angle:0,tilt:0};
 // IMPORTANT: corrections are derived from the immutable gameplay pose on every
 // render. Never write the corrected value back into dataset, otherwise moving
 // a slider repeatedly accumulates the correction until the sprite collapses.
 const baseAng=+(el.dataset.angle||0);
 const baseTilt=itemTiltValue(el,el.dataset.tilt||0);
 const ang=baseAng+(+pc.angle||0);
 const tilt=itemTiltValue(el,baseTilt+(+pc.tilt||0));
 const pr=snapProfileFor(el);
 const flatten=surfaceFlattenFor(el,surfaceZone,by);
 if(surfaceZone==='floor'){
   el.style.transformOrigin='50% 100%';
 }else if(pr){
   el.style.transformOrigin=`50% ${Math.round(pr.anchorY*100)}%`;
 }
 el.style.transform=itemPoseTransform(el,ang,flatten,tilt);
 let z=Math.max(+el.dataset.zBase||1,Math.floor(by));
 const board=getBoardEl();
 const attachedToBoard=el.dataset.itemId!=='daska'&&board&&el.dataset.attachedToBoard==='1';
 const onBoard=el.dataset.itemId!=='daska'&&board&&pointInPoly(cx,by,getBoardPoly(board));

 // v198.5.32: snapped/attached items must always render over the board.
 if(attachedToBoard){
   const boardZ=parseFloat(board.style.zIndex)||Math.floor(+board.dataset.by||0)||1;
   z=board.classList.contains('held')?7600:boardZ+300;
 }else if(onBoard){
   z=(parseFloat(board.style.zIndex)||Math.floor(+board.dataset.by||0))+6;
 }
 // Invisible depth masks redraw only the baked pixels inside a leg or sink
 // front polygon, allowing recessed objects to remain visible everywhere else.
 if(window.CooksterSceneSurfaces?.applyToItem){
   z=window.CooksterSceneSurfaces.applyToItem(el,z,cx,by);
 }
 el.style.zIndex=z;
 const depth=Math.max(0,Math.min(1,(by-530)/(900-530)));
 const onTable=by>=520;
 const held=el.classList.contains('held');
 const isBoard=el.dataset.itemId==='daska';
 const isKnife=el.dataset.itemId==='noz';
 const isStirSpoon=false;


 const isMicroShadow=false;


 const contact=el._contactShadow;
 if(contact){
   if(el.dataset.itemId==='kasika_mesanje'){
     contact.style.display='none';
     contact.style.opacity='0';
   }else{
     const calibrated=contactShadowCalibrationFor(el);
     const cfg=calibrated||{x:0,y:0,width:.72,height:.07,opacity:.52,blur:.8,angle:.6};
     if(el.dataset.itemId==='daska'){
       styleBoardContactShadow(contact,cfg,w,h,cx,by,ang,held);
     }else{
       const img=contact.querySelector('img');
       if(img)img.style.display='block';
       contact.style.background='';
       contact.style.borderRadius='';
       styleCalibratedContactShadow(contact,cfg,w,h,cx,by,ang,held);
     }
     contact.style.zIndex=Math.max(1,z-1);
   }
 }
 if(isBoard){syncBoardAttachments(el);ensureKnifeAlwaysOnBoard(el);}
 if(el._panStatus?.classList?.contains('visible'))positionCookingHud(el);
}



function kitchenDefForId(id){return (KITCHEN_EQUIPMENT||[]).find(x=>x.id===id)||null;}
function vesselSubtypeFor(elOrDef){
 const id=elOrDef?.dataset?.itemId||elOrDef?.id||'',def=kitchenDefForId(id)||elOrDef;
 return def?.dataset?.vesselSubtype||def?.subtype||'';
}
function isContainerDef(d){
 const def=kitchenDefForId(d?.id)||d;
 return !!def&&(def.type==='cookware'||def.type==='container'||def.vessel===true||['pan','pot','bowl'].includes(def.subtype));
}
function isContainerItem(el){
 if(!el)return false;
 if(el.dataset.container==='1')return true;
 const def=kitchenDefForId(el.dataset.itemId||'');
 return !!def&&(def.type==='cookware'||def.type==='container'||def.vessel===true||['pan','pot','bowl'].includes(def.subtype));
}
function cookingDefFor(elOrDef){
 const id=elOrDef?.dataset?.itemId||elOrDef?.id||'';
 const def=kitchenDefForId(id)||elOrDef||{};
 return def.cooking||{};
}
function isHeatableCookwareItem(el){
 return !!el&&isContainerItem(el)&&(window.CooksterCooking?.isHeatable(el)??(cookingDefFor(el).canHeat===true));
}
function containerCapacity(el){
 return window.CooksterCooking?.capacity(el)??Math.max(1,+cookingDefFor(el).capacity||999);
}
function panModelTotal(model){
 return Object.values(model?.ingredients||{}).reduce((s,v)=>s+(+v||0),0);
}
function containerTotal(el){
 if(!el)return 0;
 return isHeatableCookwareItem(el)?CooksterPan.total(el):CooksterContainer.total(el);
}
function isSceneOilBottle(item){
  return !!item&&item.dataset?.itemId==='kal_01_flasa_ulja';
}

function ensureSceneOilBottleMeta(item){
  if(!isSceneOilBottle(item))return item;
  item.dataset.staple='1';
  item.dataset.stapleKey='ulje';
  if(!item.hasAttribute('data-uses')){
    const def=CooksterCatalog.STAPLES?.ulje||{};
    item.dataset.uses=String(Math.max(1,+def.uses||12));
  }
  return item;
}

// Custom "piles": the heap of pieces the player cut is baked into a small PNG (data URL).
// A vessel remembers up to 4 of them for one ingredient, joined with '|'.
const CooksterPiles=window.CooksterPiles={
 is:s=>typeof s==='string'&&/^data:image\/(png|webp);base64,/.test(s),
 split:s=>String(s||'').split('|').filter(x=>/^data:image\/(png|webp);base64,/.test(x)),
 join(a,b){const list=this.split(a);for(const x of this.split(b))if(!list.includes(x))list.push(x);return list.slice(-3).join('|');}
};
function ingredientVisualMeta(item){
  if(isSceneOilBottle(item))ensureSceneOilBottleMeta(item);
  if(item&&(item.dataset?.vegetable==='1'||item.dataset?.fruit==='1')){
    const isFruit=item.dataset.fruit==='1';
    const key=item.dataset.vegKey||item.dataset.fruitKey||item.dataset.ingredientKey||'produce';
    const catalog=isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES;
    const def=catalog[key]||{};
    const cutState=item.dataset.cutState||'whole';

    const roastPhase=!isFruit&&(key==='paprika'||key==='patlidzan')?paprikaRoastPhase(item):1;
    if(!isFruit&&key==='patlidzan'&&cutState==='whole'&&roastPhase>=2){
      return {
        key:`patlidzan_pecen_${Math.min(3,roastPhase)}`,baseKey:key,type:'vegetable',
        form:'whole_roasted',cutState:'whole',roastPhase,
        roastProgress:Math.max(0,+item.dataset.roastProgress||0),
        label:roastPhase>=3?'Pečen patlidžan':'Patlidžan se peče',
        src:PATLIDZAN_ROAST_ASSETS[Math.min(3,roastPhase)-1]
      };
    }
    if(!isFruit&&key==='paprika'&&cutState==='whole'&&roastPhase>=2){
      return {
        key:`paprika_pecena_${roastPhase}`,
        baseKey:key,
        type:'vegetable',
        form:'whole_roasted',
        cutState:'whole',
        roastPhase,
        roastProgress:Math.max(0,+item.dataset.roastProgress||0),
        label:roastPhase>=4?'Pečena paprika':'Zapečena paprika',
        src:PAPRIKA_ROAST_ASSETS[roastPhase-1]
      };
    }

    // a sour cabbage is a different ingredient from a fresh one (its own key and its own pale picture), so the two do not blend into one pile
    const sourCabbage=!isFruit&&key==='kupus'&&item.dataset.fermentPhase==='3';
    if(cutState==='diced'){
      const roastedChopped=key==='paprika'&&item.dataset.choppedRoastedPepper==='1';
      const roastedUnpeeledEggplant=key==='patlidzan'&&item.dataset.choppedRoastedUnpeeledEggplant==='1';
      const roastedKey=roastedChopped
        ?roastedChoppedPepperKey(item.dataset.peeled==='1')
        :roastedUnpeeledEggplant?ROASTED_UNPEELED_EGGPLANT_KEY:(sourCabbage?'kupus_diced_kiseli':`${key}_diced`);
      const visualLabel=roastedChopped
        ?(item.dataset.peeled==='1'
          ?'Seckana pečena oljuštena paprika'
          :'Seckana pečena neljuštena paprika')
        :roastedUnpeeledEggplant
          ?'Seckan pečen neoljušten patlidžan'
          :(sourCabbage?'Sitno seckan kiseli kupus':(def.dicedLabel||item.dataset.label||key));
      const bodySrc=item.querySelector('.body')?.getAttribute('src')||'';
      const visualSrc=roastedChopped
        ?roastedChoppedPepperSrc(roastedKey)
        :roastedUnpeeledEggplant
          ?(def.roastedUnpeeledDicedSrc||def.dicedSrc||'')
          :(sourCabbage&&def.dicedSrcSour?def.dicedSrcSour:item.dataset.pieceAtlas&&CooksterPiles.is(item.dataset.pieceAtlas)?item.dataset.pieceAtlas:CooksterPiles.is(bodySrc)?bodySrc:(def.dicedSrc||def.slicedSrc||bodySrc||def.src||''));
      return {
        key:roastedKey,
        baseKey:key,
        type:isFruit?'fruit':'vegetable',
        form:'diced',
        cutState:'diced',
        label:visualLabel,
        src:visualSrc
      };
    }

    if(cutState==='sliced'){
      return {
        key:sourCabbage?'kupus_kiseli':key,
        baseKey:key,
        type:isFruit?'fruit':'vegetable',
        form:'sliced',
        cutState:'sliced',
        label:sourCabbage?'Isečen kiseli kupus':(def.slicedLabel||def.label||item.dataset.label||key),
        src:(sourCabbage&&def.slicedSrcSour)||def.slicedSrc||item.querySelector('.body')?.getAttribute('src')||def.src||''
      };
    }

    return {
      key:`${key}_celo`,
      baseKey:key,
      type:isFruit?'fruit':'vegetable',
      form:'whole',
      cutState:'whole',
      label:def.label||item.dataset.label||key,
      src:item.querySelector('.body')?.getAttribute('src')||def.src||''
    };
  }
  if(item?.dataset?.staple==='1'){
    const key=item.dataset.stapleKey||'',def=CooksterCatalog.STAPLES?.[key]||{};
    return {key,type:'staple',label:def.label||item.dataset.label||key,src:def.contentSrc||def.src||item.querySelector('.body')?.getAttribute('src')||''};
  }
  if(item?.dataset?.ingredient==='1'){
    const key=item.dataset.ingredientKey||item.dataset.itemId||'ingredient';
    return {key,type:'ingredient',label:item.dataset.label||key,src:item.dataset.contentSrc||item.querySelector('.body')?.getAttribute('src')||''};
  }
  return null;
}
function isIngredientItem(item){return !!ingredientVisualMeta(item);}

function readPanIngredientMeta(vessel){
  if(!vessel)return {};
  try{
    const raw=vessel.dataset.panIngredientMeta||'{}';
    const obj=JSON.parse(raw);
    return obj&&typeof obj==='object'?obj:{};
  }catch(_){return {};}
}
function rememberPanIngredientMeta(vessel,meta){
  if(!vessel||!meta?.key)return;
  const all=readPanIngredientMeta(vessel);
  const prevMeta=all[meta.key];
  all[meta.key]={
    key:String(meta.key||''),
    baseKey:String(meta.baseKey||''),
    type:String(meta.type||'ingredient'),
    form:String(meta.form||''),
    cutState:String(meta.cutState||''),
    label:String(meta.label||meta.key||''),
    src:(CooksterPiles.is(meta.src)||CooksterPiles.is(prevMeta?.src))
      ?CooksterPiles.join(prevMeta?.src,meta.src)
      :String(meta.src||'')
  };
  try{vessel.dataset.panIngredientMeta=JSON.stringify(all);}catch(_){}
}


const VESSEL_VISUAL_PRESETS=Object.freeze({});
window.CooksterVesselVisualPresets=VESSEL_VISUAL_PRESETS;


// The imported JSON profile is the only vessel-food calibration source.
function vesselFoodProfile(){return null;}
function depthProgressForInsertion(vessel,n){
  const imported=window.CooksterVesselFoodCalibration?.depthProgress?.(vessel,n);
  if(imported)return imported;
  // Vessels without an imported bottom/top calibration keep their existing
  // stable renderer until they receive their own depth points.
  return {step:0,t:0};
}
function depthFillProgressForCount(count,vessel=null){
  if((+count||0)<=0)return 0;
  return depthProgressForInsertion(vessel,count).t;
}
function vesselVisualPreset(el){
 return window.CooksterVesselFoodCalibration?.frame?.(el)||{
   left:0,top:0,width:100,height:100,clipX:50,clipY:50,frontTop:50,roastBottom:66
 };
}
function vesselOilSurfacePreset(el){
 const p=vesselVisualPreset(el);
 // A pot's calibrated food zone includes the visible front/depth wall.
 // Oil belongs on the horizontal bottom plane only, never on that wall.
 if(vesselSubtypeFor(el)==='pot'){
   return {
     ...p,
     top:p.top+p.height*.42,
     height:p.height*.42,
     clipY:Math.min(42,p.clipY||42)
   };
 }
 return p;
}
 function applyVesselVisualPreset(el){
 if(!el||!isContainerItem(el))return;
 const p=vesselVisualPreset(el);
 el.style.setProperty('--vessel-food-left',p.left+'%');
 el.style.setProperty('--vessel-food-top',p.top+'%');
 el.style.setProperty('--vessel-food-width',p.width+'%');
 el.style.setProperty('--vessel-food-height',p.height+'%');
 el.style.setProperty('--vessel-clip-x',p.clipX+'%');
 el.style.setProperty('--vessel-clip-y',p.clipY+'%');
 el.style.setProperty('--vessel-front-top',p.frontTop+'%');
 el.style.setProperty('--roasted-bottom',(p.roastBottom??66)+'%');
 window.CooksterVesselFoodCalibration?.applyToVessel?.(el,null,el._vesselFrontMask,p);
}
function ensureVesselFrontMask(el,src){
 if(!el||isPanItem(el)||!isContainerItem(el))return null;
 if(el._vesselFrontMask)return el._vesselFrontMask;
 const img=document.createElement('img');
 img.className='vessel-front-mask';
 img.src=src||el.querySelector('.body')?.getAttribute('src')||'';
 img.alt='';
 img.draggable=false;
 el.appendChild(img);
 el._vesselFrontMask=img;
 window.CooksterVesselFoodCalibration?.applyToVessel?.(el,el._vesselContent,img,vesselVisualPreset(el));
 return img;
}

function ensureVesselContent(el){
 if(!el||isPanItem(el)||!isContainerItem(el))return null;
 if(el._vesselContent)return el._vesselContent;
 const wrap=document.createElement('div');wrap.className='vessel-content vessel-content-'+(vesselSubtypeFor(el)||'generic');
 el.appendChild(wrap);el._vesselContent=wrap;
 window.CooksterVesselFoodCalibration?.applyToVessel?.(el,wrap,el._vesselFrontMask,vesselVisualPreset(el));
 return wrap;
}

function vesselPanEquivalentFill(el,count){
 const p=vesselVisualPreset(el);
 // Canonical large frying-pan geometry: 170x160 item, 69.5%x56.8% food zone.
 // We preserve the SAME absolute food footprint for the same ingredient count.
 const panZoneW=170*.695;
 const panZoneH=160*.568;
 const itemW=parseFloat(el?.style?.width)||el?.offsetWidth||170;
 const itemH=parseFloat(el?.style?.height)||el?.offsetHeight||160;
 const vesselZoneW=Math.max(1,itemW*(p.width/100));
 const vesselZoneH=Math.max(1,itemH*(p.height/100));
 const panScale=panFillScale(count);
 return {
   x:Math.min(1,(panZoneW/vesselZoneW)*panScale),
   y:Math.min(1,(panZoneH/vesselZoneH)*panScale)
 };
}


// ---- Oil: one reusable bottle can pour into every open Cookster container. ----
const oilVisualStyle=document.createElement('style');
oilVisualStyle.textContent=`
.cookster-oil-surface{
  position:absolute;
  pointer-events:none;
  z-index:2;
  transform-origin:50% 50%;
  opacity:0;
  transition:opacity .14s ease-out;
  overflow:visible;
  /* Important: the alpha shape comes from the PNG. Do not draw a CSS disc. */
  background:none!important;
  border-radius:0!important;
  box-shadow:none!important;
}
.cookster-oil-surface > img{
  position:absolute;
  left:0;
  top:0;
  display:block;
  width:100%;
  height:100%;
  object-fit:fill;
  pointer-events:none;
  user-select:none;
  -webkit-user-drag:none;
  transform-origin:50% 58%;
  /* Generated frames are top-down. Flatten them into the 2.5D vessel opening. */
  transform:scaleY(1) scaleX(1);
   transition:transform .18s ease-out,filter .18s ease-out,opacity .18s ease-out;
  opacity:.88;
  mix-blend-mode:normal;
  filter:saturate(.96) brightness(.98) contrast(1.03);
}
.cookster-oil-surface > img.oil-static-frame{z-index:1;opacity:.88}
.cookster-oil-surface > img.oil-motion-frame{z-index:2;opacity:0}
.cookster-oil-surface.oil-pour-hit{
  animation:cooksterOilRipple .34s ease-out;
}
@keyframes cooksterOilRipple{
  0%{filter:brightness(1.42);scale:.90}
  55%{filter:brightness(1.10);scale:1.05}
  100%{filter:brightness(1);scale:1}
}
.cookster-oil-stream-svg{
  display:none!important;
  position:fixed;
  inset:0;
  width:100vw;
  height:100vh;
  overflow:visible;
  pointer-events:none;
  z-index:16080;
  opacity:0;
  transition:opacity .08s ease-out;
}
.cookster-oil-stream-svg.active{opacity:1}
.cookster-oil-stream-svg .oil-stream-shadow{
  fill:none;
  stroke:rgba(128,76,5,.24);
  stroke-width:7;
  stroke-linecap:round;
  filter:blur(2px);
}
.cookster-oil-stream-svg .oil-stream-main{
  fill:none;
  stroke:rgba(224,168,39,.88);
  stroke-width:4.6;
  stroke-linecap:round;
}
.cookster-oil-stream-svg .oil-stream-glint{
  fill:none;
  stroke:rgba(255,247,183,.88);
  stroke-width:1.5;
  stroke-linecap:round;
}
.cookster-oil-drop-sprite{
  position:fixed;
  z-index:16081;
  display:block;
  width:24px;
  height:24px;
  object-fit:fill;
  pointer-events:none;
  user-select:none;
  -webkit-user-drag:none;
  opacity:0;
  transform:translate(-50%,-50%) scale(.76);
  transform-origin:50% 50%;
  mix-blend-mode:multiply;
  filter:saturate(1.12) brightness(1.04) contrast(1.06);
  transition:opacity .10s ease-out,transform .12s ease-out;
}
.cookster-oil-drop-sprite.active{
  opacity:.86;
  transform:translate(-50%,-50%) scale(1);
}
.placement-ghost.oil-pouring-ghost .ghost-item-copy{
  transform-origin:52% 36%!important;
  transform:translate(-3%,1%) rotate(-54deg)!important;
  transition:transform .16s cubic-bezier(.2,.75,.2,1)!important;
}
.item.oil-pour-target{
  outline:2px solid rgba(245,196,75,.68);
  outline-offset:3px;
}
.cookster-oil-surface.oil-hot > img{
  filter:saturate(1.02) brightness(1.04) contrast(1.04);
}
.cookster-oil-impact-ring{
  display:none!important;
  position:absolute;
  left:50%;
  top:53%;
  width:18%;
  height:22%;
  border:1.5px solid rgba(255,244,183,.72);
  border-radius:50%;
  transform:translate(-50%,-50%) scale(.35);
  opacity:0;
  pointer-events:none;
}
.cookster-oil-impact-ring.hit{
  animation:cooksterOilImpact .34s ease-out;
}
@keyframes cooksterOilImpact{
  0%{opacity:.85;transform:translate(-50%,-50%) scale(.28)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(2.35)}
}`;
document.head.appendChild(oilVisualStyle);


const COOKSTER_OIL_IDLE_FRAMES=[
  'assets/vfx/oil/oil_idle_01.png',
  'assets/vfx/oil/oil_idle_02.png',
  'assets/vfx/oil/oil_idle_03.png',
  'assets/vfx/oil/oil_idle_04.png',
  'assets/vfx/oil/oil_idle_05.png',
  'assets/vfx/oil/oil_idle_06.png',
  'assets/vfx/oil/oil_idle_07.png',
  'assets/vfx/oil/oil_idle_08.png',
  'assets/vfx/oil/oil_idle_09.png',
  'assets/vfx/oil/oil_idle_10.png',
  'assets/vfx/oil/oil_idle_11.png',
  'assets/vfx/oil/oil_idle_12.png'
];
const COOKSTER_OIL_IDLE_FPS=7;
const COOKSTER_OIL_SETTLE_MS=5000;
// The supplied 12-frame PNG loop is the canonical oil surface in every open
// vessel. Heating changes the shimmer/brightness, not the source artwork.
const COOKSTER_OIL_HOT_FRAMES=COOKSTER_OIL_IDLE_FRAMES;

function ensureOilAnimation(surface){
  if(!surface||surface._oilAnimReady)return;
  let calm=surface.querySelector(':scope > img.oil-static-frame');
  let img=surface.querySelector(':scope > img.oil-motion-frame');
  if(!calm){
    calm=document.createElement('img');
    calm.className='oil-static-frame';
    calm.alt='';
    calm.draggable=false;
    surface.appendChild(calm);
  }
  if(!img){
    img=document.createElement('img');
    img.className='oil-motion-frame';
    img.alt='';
    img.draggable=false;
    surface.appendChild(img);
  }

  surface._oilAnimReady=true;
  surface._oilFrame=0;
  surface._oilFrameFloat=0;
  surface._oilPouring=false;
  surface._oilSettleStartedAt=0;
  surface._oilSettleEndsAt=0;
  calm.src=COOKSTER_OIL_IDLE_FRAMES[0];
  img.src=COOKSTER_OIL_IDLE_FRAMES[0];

  // One lightweight timer per vessel. It destroys itself if the vessel disappears.
  surface._oilTimer=setInterval(()=>{
    if(!surface.isConnected){
      clearInterval(surface._oilTimer);
      surface._oilTimer=null;
      surface._oilAnimReady=false;
      return;
    }
    const visible=surface.style.opacity!==''&&parseFloat(surface.style.opacity)>0.01;
    if(!visible)return;
    const now=performance.now();
    let motion=0;
    if(surface._oilPouring){
      motion=1;
    }else if(surface._oilSettleEndsAt>now){
      const t=Math.max(0,Math.min(1,(now-surface._oilSettleStartedAt)/COOKSTER_OIL_SETTLE_MS));
      // Smoothstep leaves the oil lively at first, then eases gently into rest.
      motion=1-(t*t*(3-2*t));
    }
    if(motion<=.001){
      calm.style.opacity='.88';
      img.style.opacity='0';
      img.style.transform='translate(0px,0px) scaleX(1) scaleY(1)';
      return;
    }

    calm.style.opacity=String((.88*(1-motion)).toFixed(3));
    img.style.opacity=String((.88*motion).toFixed(3));
    surface._oilFrameFloat=(surface._oilFrameFloat||0)+Math.max(.10,motion);
    surface._oilFrame=Math.floor(surface._oilFrameFloat)%COOKSTER_OIL_IDLE_FRAMES.length;
    img.src=COOKSTER_OIL_IDLE_FRAMES[surface._oilFrame];
    const phase=surface._oilFrameFloat/COOKSTER_OIL_IDLE_FRAMES.length*Math.PI*2;
    const sx=1+Math.sin(phase)*.008*motion;
    const sy=1+Math.cos(phase*1.15)*.006*motion;
    const tx=Math.sin(phase*.85)*.6*motion;
    const ty=Math.cos(phase*.72)*.35*motion;
    img.style.transform=`translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scaleX(${sx.toFixed(3)}) scaleY(${sy.toFixed(3)})`;
  },Math.round(1000/COOKSTER_OIL_IDLE_FPS));
}

function setOilSurfacePouring(vessel,pouring){
  const surface=ensureVesselOilSurface(vessel);
  if(!surface)return;
  const now=performance.now();
  surface._oilPouring=!!pouring;
  if(pouring){
    surface._oilSettleStartedAt=0;
    surface._oilSettleEndsAt=0;
  }else{
    surface._oilSettleStartedAt=now;
    surface._oilSettleEndsAt=now+COOKSTER_OIL_SETTLE_MS;
  }
}

function vesselOilAmount(vessel){
  if(!vessel||!isContainerItem(vessel))return 0;
  if(isHeatableCookwareItem(vessel)){
    const model=CooksterPan.read(vessel);
    return Math.max(0,+model?.staples?.oil||0);
  }
  const model=CooksterContainer.read(vessel);
  const itemOil=Math.max(0,+model?.items?.ulje?.count||0);
  const transferOil=Math.max(0,+model?.transfer?.staples?.oil||0);
  return Math.max(itemOil,transferOil);
}

function ensureVesselOilSurface(vessel){
  if(!vessel||!isContainerItem(vessel))return null;
  if(vessel._oilSurface?.isConnected){
    vessel._oilSurface._oilVessel=vessel;
    ensureOilAnimation(vessel._oilSurface);
    return vessel._oilSurface;
  }

  const surface=document.createElement('div');
  surface.className='cookster-oil-surface';

  const foodWrap=isPanItem(vessel)?vessel._panContent:vessel._vesselContent;
  if(foodWrap&&foodWrap.parentNode===vessel)vessel.insertBefore(surface,foodWrap);
  else vessel.appendChild(surface);

  vessel._oilSurface=surface;
  surface._oilVessel=vessel;
  ensureOilAnimation(surface);
  return surface;
}

function updateVesselOilVisual(vessel,pulse=false){
  if(!vessel||!isContainerItem(vessel))return;
  const amount=vesselOilAmount(vessel);
  const surface=ensureVesselOilSurface(vessel);
  if(!surface)return;

  if(amount<=0){
    surface.style.opacity='0';
    return;
  }

   const p=vesselOilSurfacePreset(vessel)||{left:22,top:30,width:56,height:34};
  // Keep the oil inside the visual opening; food sprites are rendered above it.
  // The PNG itself contains the irregular puddle alpha. The layer is aligned
  // to the calibrated cookware opening, then flattened by the child image.
   // The supplied PNG already contains the irregular oil silhouette. Give it
   // the complete calibrated filling zone instead of shrinking it to a disc in
   // the middle; the vessel's own clip ellipse keeps it inside the opening.
   surface.style.left=p.left+'%';
   surface.style.top=p.top+'%';
   surface.style.width=p.width+'%';
   surface.style.height=p.height+'%';
   surface.style.clipPath=`ellipse(${p.clipX??49}% ${p.clipY??48}% at 50% 50%)`;
   surface.style.webkitClipPath=surface.style.clipPath;
   surface.style.opacity=String(Math.min(.82,.34+amount*.055));
  surface.style.transform=`rotate(${Math.max(-2,Math.min(2,+vessel.dataset.angle||0))*.08}deg)`;
  surface.dataset.oilAmount=String(amount);

  if(pulse){
    surface.classList.remove('oil-pour-hit');
    void surface.offsetWidth;
    surface.classList.add('oil-pour-hit');
    setTimeout(()=>surface.classList.remove('oil-pour-hit'),380);
  }
}

const OIL_POUR_RATE=1.25;       // "measures" per second at full tilt
const OIL_VESSEL_MAX=8;
let oilPouring=false,oilPourBottle=null,oilPourTarget=null,oilPourPointerId=null;
let oilPourLastTime=0,oilPourRaf=0,oilPourSaveAt=0,oilPourImpactAt=0;
let oilStreamSvg=null,oilStreamPath=null,oilStreamGlint=null,oilStreamShadow=null;
let oilDropSprites=[];

function ensureOilStreamSvg(){
  if(oilStreamSvg?.isConnected)return oilStreamSvg;
  oilStreamSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  oilStreamSvg.setAttribute('class','cookster-oil-stream-svg');
  oilStreamSvg.setAttribute('aria-hidden','true');
  oilStreamShadow=document.createElementNS('http://www.w3.org/2000/svg','path');
  oilStreamShadow.setAttribute('class','oil-stream-shadow');
  oilStreamPath=document.createElementNS('http://www.w3.org/2000/svg','path');
  oilStreamPath.setAttribute('class','oil-stream-main');
  oilStreamGlint=document.createElementNS('http://www.w3.org/2000/svg','path');
  oilStreamGlint.setAttribute('class','oil-stream-glint');
  oilStreamSvg.append(oilStreamShadow,oilStreamPath,oilStreamGlint);
  document.body.appendChild(oilStreamSvg);
  oilDropSprites=[0,1].map(()=> {
    const drop=document.createElement('img');
    drop.className='cookster-oil-drop-sprite';
    drop.alt='';
    drop.draggable=false;
    drop.setAttribute('aria-hidden','true');
    drop.src=COOKSTER_OIL_IDLE_FRAMES[0];
    document.body.appendChild(drop);
    return drop;
  });
  return oilStreamSvg;
}

function oilVisibleBottleRect(bottle){
  if(holding===bottle&&placementGhost?.style.display!=='none'){
    const r=placementGhost.getBoundingClientRect?.();
    if(r&&r.width>2&&r.height>2)return r;
  }
  const r=bottle?.getBoundingClientRect?.();
  return r&&r.width>2&&r.height>2?r:null;
}

function updateOilStreamGeometry(bottle,vessel){
  const svg=ensureOilStreamSvg();
  const br=oilVisibleBottleRect(bottle);
  const vr=vesselOpeningScreenRect(vessel)||vessel?.getBoundingClientRect?.();
  if(!br||!vr){
    svg.classList.remove('active');
    oilDropSprites.forEach(drop=>drop.classList.remove('active'));
    return;
  }
  // Spout position tuned to the tilted placement ghost, not the hidden original item.
  const sx=br.left+br.width*.28;
  const sy=br.top+br.height*.42;
  const tx=vr.cx??(vr.left+vr.width*.5);
  const ty=vr.cy??(vr.top+vr.height*.5);
  const dx=tx-sx,dy=ty-sy;
  const sag=Math.max(10,Math.min(42,Math.hypot(dx,dy)*.12));
  const c1x=sx+dx*.28,c1y=sy+dy*.22+sag;
  const c2x=sx+dx*.72,c2y=sy+dy*.70+sag*.55;
  const d=`M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`;
  oilStreamShadow.setAttribute('d',d);
  oilStreamPath.setAttribute('d',d);
  oilStreamGlint.setAttribute('d',d);
  svg.classList.add('active');
  // Keep the path calculation only as a guide. The path itself is hidden:
  // the visible effect is made from two staggered PNG drops.
  const now=performance.now();
  const cycle=900;
  const dropSize=Math.max(13,Math.min(25,Math.min(vr.width,vr.height)*.22));
  oilDropSprites.forEach((drop,index)=>{
    const u=((now/cycle)+(index*.47))%1;
    const curve=4*u*(1-u);
    const x=sx+dx*u;
    const y=sy+dy*u+sag*curve;
    const visibility=.22+.78*Math.sin(Math.PI*u);
    const frame=Math.floor((now/145)+index*3)%COOKSTER_OIL_IDLE_FRAMES.length;
    drop.src=COOKSTER_OIL_IDLE_FRAMES[frame];
    drop.style.left=`${x.toFixed(1)}px`;
    drop.style.top=`${y.toFixed(1)}px`;
    drop.style.width=`${dropSize.toFixed(1)}px`;
    drop.style.height=`${dropSize.toFixed(1)}px`;
    drop.style.opacity=visibility.toFixed(3);
    drop.style.transform=`translate(-50%,-50%) scale(${(.62+.28*Math.sin(Math.PI*u)).toFixed(3)})`;
    drop.classList.add('active');
  });
}

function oilBottleRemaining(bottle){
  return Math.max(0,+bottle?.dataset?.uses||0);
}

function setOilBottleRemaining(bottle,value){
  if(!bottle)return;
  bottle.dataset.uses=String(Math.max(0,value));
}

function addOilAmountToVessel(vessel,amount){
  amount=Math.max(0,+amount||0);
  if(!vessel||amount<=0||!isContainerItem(vessel))return 0;
  if(vesselHasClosedLid(vessel))return 0;
  if(isHeatableCookwareItem(vessel)&&CooksterPan.read(vessel).burnt)return 0;

  const room=Math.max(0,OIL_VESSEL_MAX-vesselOilAmount(vessel));
  const add=Math.min(room,amount);
  if(add<=0)return 0;

  if(isHeatableCookwareItem(vessel)){
    const model=CooksterPan.read(vessel);
    model.staples??={oil:0,salt:0};
    model.staples.oil=Math.max(0,+model.staples.oil||0)+add;
    CooksterPan.write(vessel,model);
    updateCookingStatus(vessel);
  }else{
    const model=CooksterContainer.read(vessel);
    const def=CooksterCatalog.STAPLES?.ulje||{};
    const prev=model.items?.ulje||{
      count:0,type:'staple',label:def.label||'Ulje',
      src:def.contentSrc||def.src||'',form:'',baseKey:'',cutState:''
    };
    model.items??={};
    model.items.ulje={...prev,count:Math.max(0,+prev.count||0)+add,type:'staple'};
    CooksterContainer.write(vessel,model);
  }

  updateVesselOilVisual(vessel);
  return add;
}

function validOilPourTargetAt(x,y,bottle=oilPourBottle||holding){
  if(!bottle||!isSceneOilBottle(bottle))return null;
  const vessel=resolveIngredientVesselTarget(bottle,x,y);
  if(!vessel||vesselHasClosedLid(vessel))return null;
  if(isHeatableCookwareItem(vessel)&&CooksterPan.read(vessel).burnt)return null;
  return vessel;
}

function setOilPourTarget(next){
  if(oilPourTarget===next)return;
  if(oilPourTarget){
    oilPourTarget.classList.remove('oil-pour-target');
    if(oilPouring)setOilSurfacePouring(oilPourTarget,false);
  }
  oilPourTarget=next||null;
  if(oilPourTarget){
    oilPourTarget.classList.add('oil-pour-target');
    if(oilPouring)setOilSurfacePouring(oilPourTarget,true);
  }
}

function beginOilPour(bottle,vessel,pointerId=null){
  if(oilPouring||!bottle||holding!==bottle||!isSceneOilBottle(bottle)||!vessel)return false;
  ensureSceneOilBottleMeta(bottle);
  if(oilBottleRemaining(bottle)<=0){showToast('Флаша је празна.');return true;}
  if(vesselOilAmount(vessel)>=OIL_VESSEL_MAX){showToast('У посуди већ има довољно уља.');return true;}

  oilPouring=true;
  oilPourBottle=bottle;
  oilPourPointerId=pointerId;
  oilPourLastTime=performance.now();
  oilPourSaveAt=oilPourLastTime;
  oilPourImpactAt=0;
  setOilPourTarget(vessel);

  updatePlacementGhost();
  if(placementGhost)placementGhost.classList.add('oil-pouring-ghost');
  ensureOilStreamSvg().classList.add('active');
  updateOilStreamGeometry(bottle,vessel);

  // Immediate small response so a quick tap still adds a visible splash.
  const first=Math.min(.10,oilBottleRemaining(bottle));
  const accepted=addOilAmountToVessel(vessel,first);
  if(accepted>0){
    setOilBottleRemaining(bottle,oilBottleRemaining(bottle)-accepted);
    if(isHeatableCookwareItem(vessel)&&vesselIsHeating(vessel))playSfxVariant('oilSizzle',.15);
  }

  const tick=now=>{
    if(!oilPouring||oilPourBottle!==bottle)return;
    const dt=Math.max(0,Math.min(.05,(now-oilPourLastTime)/1000));
    oilPourLastTime=now;

    // Keep the visible bottle/stream attached to the cursor and allow the player
    // to move from one open vessel to another without dropping the bottle.
    if(holding===bottle){
      moveHeld();
      const target=validOilPourTargetAt(mouse.x,mouse.y,bottle);
      setOilPourTarget(target);
    }

    if(oilPourTarget){
      updateOilStreamGeometry(bottle,oilPourTarget);
      const remaining=oilBottleRemaining(bottle);
      if(remaining<=0){
        endOilPour(true);
        return;
      }
      const requested=Math.min(remaining,OIL_POUR_RATE*dt);
      const accepted=addOilAmountToVessel(oilPourTarget,requested);
      if(accepted>0){
        setOilBottleRemaining(bottle,remaining-accepted);
        if(now-oilPourImpactAt>270){
          oilPourImpactAt=now;
        }
        if(now-oilPourSaveAt>420){
          CooksterSave.schedule();
          oilPourSaveAt=now;
        }
      }else if(vesselOilAmount(oilPourTarget)>=OIL_VESSEL_MAX){
        // Keep the bottle in hand; only pause flow into a full vessel.
        ensureOilStreamSvg().classList.remove('active');
      }
    }else{
      ensureOilStreamSvg().classList.remove('active');
    }

    oilPourRaf=requestAnimationFrame(tick);
  };
  oilPourRaf=requestAnimationFrame(tick);
  return true;
}

function endOilPour(empty=false){
  if(!oilPouring)return false;
  const settledVessel=oilPourTarget;
  oilPouring=false;
  if(oilPourRaf)cancelAnimationFrame(oilPourRaf);
  oilPourRaf=0;
  if(oilStreamSvg)oilStreamSvg.classList.remove('active');
  oilDropSprites.forEach(drop=>drop.classList.remove('active'));
  if(placementGhost)placementGhost.classList.remove('oil-pouring-ghost');
  if(settledVessel)setOilSurfacePouring(settledVessel,false);
  setOilPourTarget(null);
  const bottle=oilPourBottle;
  oilPourBottle=null;
  oilPourPointerId=null;
  CooksterSave.schedule();
  updatePlacementGhost();
  updateHover();
  if(empty||oilBottleRemaining(bottle)<=0)showToast('Флаша је празна.');
  return true;
}

// Compatibility one-shot hook used by old code paths.
function playOilPourFx(bottle,vessel){
  if(!bottle||!vessel)return;
  setOilSurfacePouring(vessel,false);
  if(isHeatableCookwareItem(vessel)&&vesselIsHeating(vessel))
    playSfxVariant('oilSizzle',.16);
}

function renderCookwareContents(el,modelOverride=null,stateOverride=null){
 if(!el||!isContainerItem(el))return;
 if(isPanItem(el)){
   renderPanTomatoes(el,modelOverride,stateOverride);
   updateVesselOilVisual(el);
   return;
 }
 renderVesselContents(el,modelOverride,stateOverride);
 updateVesselOilVisual(el);
}

function renderVesselContents(el,modelOverride=null,stateOverride=null){
  if(!el||isPanItem(el)||!isContainerItem(el))return;
  const wrap=ensureVesselContent(el);
  if(!wrap)return;

  if(isHeatableCookwareItem(el)){
    const model=modelOverride||CooksterPan.read(el);
    const stage=stateOverride?.visualStage||window.CooksterFoodStateMachine?.vesselState(model)?.visualStage||panTextureStage(Math.max(0,+model.doneness||0),!!model.burnt);
    renderFoodContents(wrap,{...model.ingredients},stage,readPanIngredientMeta(el),model.batches||[],model.heat||0,model.mix||0,el);
    return;
  }

  const model=CooksterContainer.read(el);
  const counts={};
  for(const [key,entry] of Object.entries(model.items||{})){
    counts[key]=Math.max(0,+entry.count||0);
  }
  const transfer=model.transfer||{};

  // v198.5.23: a non-heatable bowl must render the actual transferred thermal
  // state, never an unconditional RAW stage. Batch state is authoritative.
  const thermal=window.CooksterTransferThermal?.visualState
    ? window.CooksterTransferThermal.visualState(transfer.batches||[],transfer.heat||0)
    : window.CooksterFoodStateMachine?.vesselState({
        batches:transfer.batches||[],
        heat:transfer.heat||0,
        doneness:(transfer.batches||[]).reduce((s,b)=>s+(+b.doneness||0)*(+b.count||0),0)/
          Math.max(1,(transfer.batches||[]).reduce((s,b)=>s+(+b.count||0),0))
      });

  const visualStage=Math.max(1,Math.min(7,+thermal?.visualStage||1));
  wrap.dataset.thermalPhase=thermal?.phase?.id||'raw';
  wrap.dataset.thermalVisualStage=String(visualStage);

  renderFoodContents(
    wrap,counts,visualStage,model.items||{},
    transfer.batches||[],
    transfer.heat||0,
    transfer.mix||0,
    el
  );
}
function containerAt(x,y){
 const nodes=document.elementsFromPoint(x,y);
 for(const n of nodes){const it=n.closest?.('.item');if(it&&it!==holding&&isContainerItem(it))return it;}
 // Food layers and calibration overlays can cover the visual centre of a
 // cookware item.  Fall back to its actual inner food area so dropping a new
 // ingredient works over the whole opening, not only its exposed rim.
 const candidates=(window.items||[]).filter(it=>{
   if(!it||it===holding||!isContainerItem(it))return false;
   const wrap=isPanItem(it)?it._panContent:it._vesselContent;
   const r=(wrap||it).getBoundingClientRect?.();
   return !!r&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
 });
 if(candidates.length){
   candidates.sort((a,b)=>(+b.style.zIndex||0)-(+a.style.zIndex||0));
   return candidates[0];
 }
 return null;
}

function rectOverlapArea(a,b){
  if(!a||!b)return 0;
  const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
  const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  return w*h;
}

function heldIngredientScreenRect(item=holding){
  if(!item)return null;

  // The placement ghost is the thing the player actually sees while dragging.
  if(holding===item&&placementGhost&&placementGhost.style.display!=='none'){
    const r=placementGhost.getBoundingClientRect?.();
    if(r&&r.width>2&&r.height>2){
      return {
        left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        width:r.width,height:r.height,
        cx:r.left+r.width*.5,cy:r.top+r.height*.5
      };
    }
  }

  // Fallback to the smooth scene pose, converted explicitly into SCREEN space.
  const p=(placementGhostMotion&&holding===item)?placementGhostMotion.pose:null;
  if(p&&Number.isFinite(+p.cx)&&Number.isFinite(+p.by)&&Number.isFinite(+p.w)&&Number.isFinite(+p.h)){
    const tl=sceneToScreen(+p.cx-(+p.w)/2,+p.by-(+p.h));
    const br=sceneToScreen(+p.cx+(+p.w)/2,+p.by);
    const left=Math.min(tl.x,br.x),right=Math.max(tl.x,br.x);
    const top=Math.min(tl.y,br.y),bottom=Math.max(tl.y,br.y);
    return {
      left,right,top,bottom,
      width:right-left,height:bottom-top,
      cx:(left+right)/2,cy:(top+bottom)/2
    };
  }

  const r=item.getBoundingClientRect?.();
  if(!r||r.width<2||r.height<2)return null;
  return {
    left:r.left,right:r.right,top:r.top,bottom:r.bottom,
    width:r.width,height:r.height,
    cx:r.left+r.width*.5,cy:r.top+r.height*.5
  };
}

function vesselOpeningScreenRect(vessel){
  if(!vessel||!isContainerItem(vessel)||vessel.offsetParent===null)return null;
  const vr=vessel.getBoundingClientRect?.();
  if(!vr||vr.width<2||vr.height<2)return null;

  const p=vesselVisualPreset(vessel);
  if(p){
    const left=vr.left+vr.width*(p.left/100);
    const top=vr.top+vr.height*(p.top/100);
    const width=vr.width*(p.width/100);
    const height=vr.height*(p.height/100);

    // Forgiving around the physical rim, but still based on the calibrated
    // food opening rather than the pan handle / whole PNG rectangle.
    const padX=Math.max(6,width*.18);
    const padY=Math.max(5,height*.20);
    return {
      left:left-padX,right:left+width+padX,
      top:top-padY,bottom:top+height+padY,
      width:width+padX*2,height:height+padY*2,
      cx:left+width*.5,cy:top+height*.5
    };
  }

  const padX=vr.width*.15,padY=vr.height*.15;
  return {
    left:vr.left+padX,right:vr.right-padX,
    top:vr.top+padY,bottom:vr.bottom-padY,
    width:Math.max(1,vr.width-padX*2),height:Math.max(1,vr.height-padY*2),
    cx:vr.left+vr.width*.5,cy:vr.top+vr.height*.5
  };
}

function resolveIngredientVesselTarget(item=holding,clientX=mouse.x,clientY=mouse.y){
  if(!item||!isIngredientItem(item))return null;

  const ir=heldIngredientScreenRect(item);
  const vessels=(window.items||items||[]).filter(v=>{
    if(!v||v===item||!isContainerItem(v)||v.offsetParent===null||vesselHasClosedLid(v))return false;
    const r=v.getBoundingClientRect?.();
    return !!r&&r.width>2&&r.height>2;
  });

  let best=null,bestScore=-Infinity;
  for(const vessel of vessels){
    const r=vessel.getBoundingClientRect();

    // Same robust principle as grinderOutputVessel(): the complete visible
    // cookware rectangle is a valid receiving footprint. Shrink only a tiny
    // edge margin so merely brushing a handle/corner does not consume food.
    const mx=Math.max(3,Math.min(10,r.width*.035));
    const my=Math.max(3,Math.min(10,r.height*.035));
    const target={
      left:r.left+mx,right:r.right-mx,
      top:r.top+my,bottom:r.bottom-my,
      width:Math.max(1,r.width-mx*2),height:Math.max(1,r.height-my*2),
      cx:r.left+r.width*.5,cy:r.top+r.height*.48
    };

    const overlap=ir?rectOverlapArea(ir,target):0;
    const pointerInside=
      Number.isFinite(+clientX)&&Number.isFinite(+clientY)&&
      clientX>=target.left&&clientX<=target.right&&
      clientY>=target.top&&clientY<=target.bottom;
    const centreInside=!!ir&&
      ir.cx>=target.left&&ir.cx<=target.right&&
      ir.cy>=target.top&&ir.cy<=target.bottom;

    const ingredientArea=ir?Math.max(1,ir.width*ir.height):1;
    const minOverlap=Math.max(12,ingredientArea*.02);
    if(!pointerInside&&!centreInside&&overlap<minOverlap)continue;

    const px=ir?.cx??clientX,py=ir?.cy??clientY;
    const dist=Math.hypot(px-target.cx,py-target.cy);
    const z=+vessel.style.zIndex||0;

    // Pointer and visible ingredient centre dominate; overlap/distance break ties.
    const score=
      (pointerInside?1_000_000:0)+
      (centreInside?500_000:0)+
      overlap*100+
      z*.01-
      dist;

    if(score>bestScore){best=vessel;bestScore=score;}
  }
  return best;
}

// Compatibility names now route to the SAME resolver.
function ingredientContainerAt(x,y,item=holding){
  return resolveIngredientVesselTarget(item,x,y);
}
function ingredientContainerForVisiblePose(item=holding,clientX=mouse.x,clientY=mouse.y){
  return resolveIngredientVesselTarget(item,clientX,clientY);
}


function vesselHasClosedLid(vessel){
  return !!vessel?._lidMeta&&!vessel.classList.contains('open');
}
function vesselFoodCount(vessel){
  if(!vessel||!isContainerItem(vessel))return 0;
  if(isHeatableCookwareItem(vessel))return CooksterPan.total(vessel);
  const model=CooksterContainer.read(vessel);
  return Object.values(model.items||{}).reduce((s,e)=>s+(e?.type==='staple'?0:Math.max(0,+e?.count||0)),0);
}
function vesselTransferAmount(vessel){
  if(!vessel||!isContainerItem(vessel))return 0;
  if(isHeatableCookwareItem(vessel)){
    const m=CooksterPan.read(vessel);
    return CooksterPan.total(vessel)+Math.max(0,+m.staples?.oil||0)+Math.max(0,+m.staples?.salt||0);
  }
  return CooksterContainer.total(vessel);
}
function transferMetaForPanKey(key,rememberedMeta=null){
  key=String(key||'ingredient');
  const rememberedRoastedEggplant=
    isRoastedUnpeeledEggplantKey(key)
    ||(key==='patlidzan_diced'
      &&rememberedMeta?.src===VEGETABLES.patlidzan?.roastedUnpeeledDicedSrc);
  if(rememberedRoastedEggplant){
    return {
      count:0,type:'vegetable',
      label:'Seckan pečen neoljušten patlidžan',
      src:rememberedMeta?.src||VEGETABLES.patlidzan?.roastedUnpeeledDicedSrc||'',
      form:'diced',baseKey:'patlidzan',cutState:'diced'
    };
  }
  if(isRoastedChoppedPepperKey(key)){
    return {
      count:0,type:'vegetable',
      label:key.endsWith('_oljustena')
        ?'Seckana pečena oljuštena paprika'
        :'Seckana pečena neljuštena paprika',
      src:roastedChoppedPepperSrc(key),
      form:'diced',baseKey:'paprika',cutState:'diced'
    };
  }
  if(key.startsWith('paprika_pecena')){
    const phase=Math.max(2,Math.min(4,+(key.match(/_(\d+)$/)?.[1]||4)));
    return {
      count:0,type:'vegetable',label:phase>=4?'Pečena paprika':'Zapečena paprika',
      src:PAPRIKA_ROAST_ASSETS[phase-1]||VEGETABLES.paprika?.src||'',
      form:'whole_roasted',baseKey:'paprika',cutState:'whole'
    };
  }
  const whole=key.endsWith('_celo');
  const diced=key.endsWith('_diced');
  const base=whole?key.slice(0,-5):(diced?key.slice(0,-6):key);
  const def=VEGETABLES[base]||CooksterCatalog.FRUITS?.[base]||{};
  const form=whole?'whole':(diced?'diced':'sliced');
  return {
    count:0,
    type:CooksterCatalog.FRUITS?.[base]?'fruit':'vegetable',
    label:diced?(def.dicedLabel||def.label||base):(def.label||base),
    src:whole?(def.src||''):(diced?(def.dicedSrc||def.slicedSrc||def.src||''):(def.slicedSrc||def.src||'')),
    form,baseKey:base,cutState:form
  };
}
function stapleContainerMeta(modelKey,count){
  const catalogKey=modelKey==='oil'?'ulje':modelKey==='salt'?'so':modelKey;
  const def=CooksterCatalog.STAPLES?.[catalogKey]||{};
  return {
    key:catalogKey,
    entry:{
      count:Math.max(0,+count||0),
      type:'staple',
      label:def.label||catalogKey,
      src:def.contentSrc||def.src||'',
      form:'',
      baseKey:'',
      cutState:''
    }
  };
}
function vesselTransferPayload(source){
  if(!source||!isContainerItem(source))return null;

  if(isHeatableCookwareItem(source)){
    const model=CooksterPan.read(source);
    const rememberedMeta=readPanIngredientMeta(source);
    const items={};
    for(const [key,countRaw] of Object.entries(model.ingredients||{})){
      const count=Math.max(0,+countRaw||0);if(count<=0)continue;
      items[key]={...transferMetaForPanKey(key,rememberedMeta[key]),count};
    }
    for(const stapleKey of ['oil','salt']){
      const count=Math.max(0,+model.staples?.[stapleKey]||0);
      if(count<=0)continue;
      const s=stapleContainerMeta(stapleKey,count);
      items[s.key]=s.entry;
    }
    return {
      items,
      batches:window.CooksterTransferThermal?.cloneBatches
        ? window.CooksterTransferThermal.cloneBatches(model.batches||[])
        : JSON.parse(JSON.stringify(model.batches||[])),
      mix:Math.max(0,Math.min(1,+model.mix||0)),
      heat:Math.max(0,+model.heat||0),
      staples:{
        oil:Math.max(0,+model.staples?.oil||0),
        salt:Math.max(0,+model.staples?.salt||0)
      },
      foodCount:CooksterPan.total(source),
      thermalVisual:window.CooksterTransferThermal?.visualState
        ? window.CooksterTransferThermal.visualState(model.batches||[],model.heat||0)
        : null
    };
  }

  const model=CooksterContainer.read(source);
  const items=JSON.parse(JSON.stringify(model.items||{}));
  const transfer=model.transfer||{};
  const itemOil=Math.max(0,+items.ulje?.count||0);
  const itemSalt=Math.max(0,+items.so?.count||0);
  return {
    items,
    batches:window.CooksterTransferThermal?.cloneBatches
      ? window.CooksterTransferThermal.cloneBatches(transfer.batches||[])
      : JSON.parse(JSON.stringify(transfer.batches||[])),
    mix:Math.max(0,Math.min(1,+transfer.mix||0)),
    heat:Math.max(0,+transfer.heat||0),
    staples:{
      oil:Math.max(Math.max(0,+transfer.staples?.oil||0),itemOil),
      salt:Math.max(Math.max(0,+transfer.staples?.salt||0),itemSalt)
    },
    foodCount:Object.values(items).reduce((s,e)=>s+(e?.type==='staple'?0:Math.max(0,+e?.count||0)),0),
    thermalVisual:window.CooksterTransferThermal?.visualState
      ? window.CooksterTransferThermal.visualState(transfer.batches||[],transfer.heat||0)
      : null
  };
}
function sourceIngredientKeys(payload){
  return Object.entries(payload?.items||{})
    .filter(([,e])=>e?.type!=='staple'&&(+e?.count||0)>0)
    .map(([k])=>k)
    .sort();
}
function canPourInto(source,target){
  if(!source||!target||source===target||!isContainerItem(source)||!isContainerItem(target))
    return {ok:false,reason:'invalid'};
  if(vesselTransferAmount(source)<=0)return {ok:false,reason:'empty'};
  if(vesselHasClosedLid(source))
    return {ok:false,reason:'Скини поклопац са посуде коју пресипаш.'};
  if(vesselHasClosedLid(target))
    return {ok:false,reason:'Скини поклопац са посуде у коју пресипаш.'};
  if(isHeatableCookwareItem(target)&&CooksterPan.read(target).burnt)
    return {ok:false,reason:'Посуда је загорела — прво је опери.'};

  const payload=vesselTransferPayload(source);
  const incomingFood=Math.max(0,+payload?.foodCount||0);
  const room=Math.max(0,containerCapacity(target)-containerTotal(target));
  if(incomingFood>room)
    return {ok:false,reason:`Нема места за све — слободно је још ${Math.floor(room)}.`};

  return {ok:true,payload};
}
function pourCandidateAt(x,y,source=holding){
  if(!source||!isContainerItem(source)||vesselTransferAmount(source)<=0)return null;
  const target=containerAt(x,y);
  if(!target||target===source)return null;
  const verdict=canPourInto(source,target);
  return {target,...verdict};
}
function clearPourTarget(){
  if(pourTarget)pourTarget.classList.remove('pour-target-ready');
  if(pourBlockedTarget)pourBlockedTarget.classList.remove('pour-target-blocked');
  if(holding)holding.classList.remove('pour-source-ready');
  pourTarget=null;pourBlockedTarget=null;
}
function updatePourTarget(){
  if(pouring||!holding||picking||placing||!isContainerItem(holding)||vesselTransferAmount(holding)<=0){
    clearPourTarget();return null;
  }
  const candidate=pourCandidateAt(mouse.x,mouse.y,holding);
  const nextReady=candidate?.ok?candidate.target:null;
  const nextBlocked=candidate&&!candidate.ok?candidate.target:null;

  if(pourTarget&&pourTarget!==nextReady)pourTarget.classList.remove('pour-target-ready');
  if(pourBlockedTarget&&pourBlockedTarget!==nextBlocked)pourBlockedTarget.classList.remove('pour-target-blocked');

  pourTarget=nextReady;
  pourBlockedTarget=nextBlocked;

  if(pourTarget){
    pourTarget.classList.add('pour-target-ready');
    holding.classList.add('pour-source-ready');
  }else{
    holding.classList.remove('pour-source-ready');
  }
  if(pourBlockedTarget){
    pourBlockedTarget.classList.add('pour-target-blocked');
  }
  return candidate;
}
function mergePayloadIntoHeatable(target,payload){
  const dest=CooksterPan.read(target);
  const destFoodBefore=Object.values(dest.ingredients||{}).reduce((s,v)=>s+(+v||0),0);
  const incomingFood=Math.max(0,+payload.foodCount||0);
  const sourceKeys=sourceIngredientKeys(payload);

  for(const [key,entry] of Object.entries(payload.items||{})){
    if(entry?.type==='staple')continue;
    const count=Math.max(0,+entry?.count||0);if(count<=0)continue;
    dest.ingredients[key]=Math.max(0,(+dest.ingredients[key]||0)+count);
  }
  dest.staples??={oil:0,salt:0};
  dest.staples.oil=Math.max(0,(+dest.staples.oil||0)+Math.max(0,+payload.staples?.oil||0));
  dest.staples.salt=Math.max(0,(+dest.staples.salt||0)+Math.max(0,+payload.staples?.salt||0));

  if(Array.isArray(payload.batches)&&payload.batches.length)
    dest.batches=[
      ...(dest.batches||[]),
      ...(window.CooksterTransferThermal?.cloneBatches
        ? window.CooksterTransferThermal.cloneBatches(payload.batches)
        : JSON.parse(JSON.stringify(payload.batches)))
    ];

  if(destFoodBefore<=0)dest.mix=Math.max(0,Math.min(1,+payload.mix||0));
  else if(incomingFood>0)dest.mix=0;

  if(destFoodBefore<=0&&incomingFood>0)
    dest.heat=Math.max(+dest.heat||0,Math.max(0,+payload.heat||0)*.72);

  dest.served=false;
  const written=CooksterPan.write(target,dest);
  const present=Object.entries(written.ingredients||{}).filter(([,v])=>(+v||0)>0).map(([k])=>k);
  target.dataset.panVegKey=present.length>1?'mix':(present[0]||'');
  delete target.dataset.readyAnnounced;
}
function mergePayloadIntoContainer(target,payload){
  const dest=CooksterContainer.read(target);
  const destFoodBefore=Object.values(dest.items||{}).reduce((s,e)=>s+(e?.type==='staple'?0:Math.max(0,+e?.count||0)),0);
  const incomingFood=Math.max(0,+payload.foodCount||0);

  for(const [key,entry] of Object.entries(payload.items||{})){
    const count=Math.max(0,+entry?.count||0);if(count<=0)continue;
    const prev=dest.items[key]||{count:0,type:entry.type||'ingredient',label:entry.label||key,src:entry.src||'',form:entry.form||'',baseKey:entry.baseKey||'',cutState:entry.cutState||''};
    dest.items[key]={
      count:(+prev.count||0)+count,
      type:String(entry.type||prev.type||'ingredient'),
      label:String(entry.label||prev.label||key),
      src:String(entry.src||prev.src||''),
      form:String(entry.form||prev.form||''),
      baseKey:String(entry.baseKey||prev.baseKey||''),
      cutState:String(entry.cutState||prev.cutState||'')
    };
  }

  dest.transfer??={mix:0,heat:0,staples:{oil:0,salt:0},batches:[]};
  dest.transfer.staples??={oil:0,salt:0};
  dest.transfer.batches??=[];
  dest.transfer.staples.oil=Math.max(0,(+dest.transfer.staples.oil||0)+Math.max(0,+payload.staples?.oil||0));
  dest.transfer.staples.salt=Math.max(0,(+dest.transfer.staples.salt||0)+Math.max(0,+payload.staples?.salt||0));
  if(Array.isArray(payload.batches)&&payload.batches.length)
    dest.transfer.batches.push(
      ...(window.CooksterTransferThermal?.cloneBatches
        ? window.CooksterTransferThermal.cloneBatches(payload.batches)
        : JSON.parse(JSON.stringify(payload.batches)))
    );

  if(destFoodBefore<=0)dest.transfer.mix=Math.max(0,Math.min(1,+payload.mix||0));
  else if(incomingFood>0)dest.transfer.mix=0;

  if(destFoodBefore<=0&&incomingFood>0)
    dest.transfer.heat=Math.max(+dest.transfer.heat||0,Math.max(0,+payload.heat||0)*.78);

  CooksterContainer.write(target,dest);
}
function clearVesselAfterPour(source){
  if(isHeatableCookwareItem(source)){
    CooksterPan.reset(source);
    delete source.dataset.readyAnnounced;
    delete source.dataset.panVegKey;
  }else{
    CooksterContainer.write(source,CooksterContainer.empty());
  }
}
function applyVesselTransfer(source,target,payload){
  if(!source||!target||!payload)return false;
  if(isHeatableCookwareItem(target))mergePayloadIntoHeatable(target,payload);
  else mergePayloadIntoContainer(target,payload);

  clearVesselAfterPour(source);
  renderCookwareContents(source);
  renderCookwareContents(target);
  if(isHeatableCookwareItem(source))updateCookingStatus(source);
  if(isHeatableCookwareItem(target))updateCookingStatus(target);
  CooksterSave.schedule();
  return true;
}
function pourParticleSources(payload){
  const list=[];
  for(const [key,entry] of Object.entries(payload?.items||{})){
    if(entry?.type==='staple')continue;
    const count=Math.max(0,+entry?.count||0);if(count<=0||!entry.src)continue;
    const n=Math.max(1,Math.min(5,Math.round(Math.sqrt(count)+1)));
    for(let i=0;i<n;i++)list.push({src:entry.src,key});
  }
  return list;
}
function spawnPourParticles(source,target,payload){
  const choices=pourParticleSources(payload);
  if(!choices.length)return;
  const sx=+source.dataset.cx||0;
  const sy=(+source.dataset.by||0)-(+source.dataset.baseH||100)*(+source.dataset.vis||1)*.48;
  const tx=+target.dataset.cx||0;
  const ty=(+target.dataset.by||0)-(+target.dataset.baseH||100)*(+target.dataset.vis||1)*.46;
  const pieces=Math.min(10,Math.max(6,choices.length));
  for(let i=0;i<pieces;i++){
    const choice=choices[i%choices.length];
    const img=document.createElement('img');
    img.className='pour-particle';
    img.src=choice.src;img.alt='';img.draggable=false;
    img.style.left=sx+'px';img.style.top=sy+'px';
    img.style.width=(30+((i*7)%18))+'px';
    img.style.zIndex='12050';
    scene.appendChild(img);

    const dx=(tx-sx)+((i%3)-1)*12;
    const dy=(ty-sy)+((i%2)?5:-7);
    const arc=-38-(i%4)*9;
    try{
      const anim=img.animate([
        {transform:'translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1)',opacity:0},
        {transform:`translate(-50%,-50%) translate(${dx*.38}px,${dy*.28+arc}px) rotate(${35+i*13}deg) scale(.95)`,opacity:1,offset:.36},
        {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${100+i*19}deg) scale(.72)`,opacity:.15}
      ],{
        duration:430+i*18,
        delay:i*24,
        easing:'cubic-bezier(.18,.58,.28,1)',
        fill:'forwards'
      });
      anim.onfinish=()=>img.remove();
    }catch{
      setTimeout(()=>img.remove(),560+i*20);
    }
  }
}
function beginPourTransfer(source,target){
  if(pouring||!source||!target)return false;
  const verdict=canPourInto(source,target);
  if(!verdict.ok){
    if(verdict.reason&&verdict.reason!=='invalid'&&verdict.reason!=='empty')showToast(verdict.reason);
    return verdict.reason!=='invalid';
  }

  const payload=verdict.payload;
  pouring=true;
  clearPourTarget();
  hidePlacementGhost();hideOriginGhost();

 // While dragging, the real vessel stays hidden and the placement ghost follows
 // the cursor. Reveal the real vessel at that same cursor pose before starting
 // the pour. Revealing it at its old hand pose made the source disappear near
 // the receiver and then pop in from the bottom of the screen.
 const ghostPose=placementState?.candidate;
 const sourceStart=ghostPose&&Number.isFinite(+ghostPose.cx)&&Number.isFinite(+ghostPose.by)
   ? ghostPose
   : {cx:+source.dataset.cx||0,by:+source.dataset.by||0,vis:+source.dataset.vis||1};
 setPose(source,sourceStart.cx,sourceStart.by,sourceStart.vis||1);
 source.style.transformOrigin='50% 50%';
 source.style.transform=`perspective(1200px) rotateX(${itemTiltValue(source,source.dataset.tilt||0)*.45}deg) rotateZ(${+(sourceStart.angle??source.dataset.angle??0)}deg)`;
 source.style.visibility='visible';
  source.classList.add('pouring-source');
  target.classList.add('pouring-receiver');

  const oldTransition=source.style.transition||'';
  const baseAngle=+(source.dataset.angle||0);
  const carryAngle=Number.isFinite(+sourceStart.carryAngle)?+sourceStart.carryAngle:0;
  const targetVis=+target.dataset.vis||1;
  const targetW=(+target.dataset.baseW||120)*targetVis;
  const targetH=(+target.dataset.baseH||100)*targetVis;
  const pourVis=Math.max(.72,Math.min((+sourceStart.vis||1)*.92,targetVis*1.22));

  // v198.5.21.1: source vessel ALWAYS pours from the receiver's RIGHT side.
  // Its left/pouring edge enters only the receiver's right half, while most of
  // the source body stays outside the receiver silhouette. This prevents the
  // held pot/pan from visually covering the destination during the pour.
  const sourceW=(+source.dataset.baseW||120)*pourVis;
  const sourceH=(+source.dataset.baseH||100)*pourVis;
  const targetCx=+target.dataset.cx||0;
  const targetBy=+target.dataset.by||0;
  const targetCenterY=targetBy-targetH*.50;

  // Put the source's LEFT edge about 1/4 of the receiver width to the right
  // of receiver center. In other words: lip is over the right half, body is right.
  const sourceLeftAt=targetCx+targetW*.24;
  const pourCx=sourceLeftAt+sourceW*.50;

  // Vertically align vessel centers, with a tiny lift so the lip reads as "above".
  const pourBy=targetCenterY+sourceH*.50-targetH*.035;

  // Negative Z angle tips the right-side source toward the LEFT receiver.
  const pourAngle=-38;

  source.style.transformOrigin='50% 58%';
  source.style.transition='left 280ms cubic-bezier(.18,.72,.22,1), top 280ms cubic-bezier(.18,.72,.22,1), width 280ms ease-out, height 280ms ease-out, transform 230ms cubic-bezier(.18,.72,.22,1)';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    setPose(source,pourCx,pourBy,pourVis);
    source.style.transform=`perspective(1200px) rotateX(8deg) rotateZ(${baseAngle+carryAngle+pourAngle}deg)`;
  }));

  setTimeout(()=>{
    spawnPourParticles(source,target,payload);
    playSfxVariant('metalDrop',.16);
  },245);

  setTimeout(()=>{
    applyVesselTransfer(source,target,payload);
    popArtPuff(+target.dataset.cx||0,(+target.dataset.by||0)-18*(+target.dataset.vis||1),Math.max(.48,(+target.dataset.vis||1)*.60));
  },500);

  setTimeout(()=>{
    source.style.transition='left 270ms cubic-bezier(.18,.72,.22,1), top 270ms cubic-bezier(.18,.72,.22,1), width 270ms ease-out, height 270ms ease-out, transform 270ms ease-out';
    const returnPose=placementState?.candidate||sourceStart;
    setPose(source,returnPose.cx,returnPose.by,returnPose.vis||1);
    source.style.transformOrigin='50% 50%';
    source.style.transform=`perspective(1200px) rotateX(${itemTiltValue(source,source.dataset.tilt||0)*.45}deg) rotateZ(${+(returnPose.angle??baseAngle+carryAngle)}deg)`;
  },610);

  setTimeout(()=>{
    source.style.transition=oldTransition;
    source.classList.remove('pouring-source');
    target.classList.remove('pouring-receiver');
    pouring=false;

    // Return to the normal held-item model: real item hidden, placement ghost visible.
    // If the source is no longer the held item for any reason, leave it visible.
    if(holding===source)source.style.visibility='';

    updatePlacementGhost();
    if(holding===source)source.style.visibility='hidden';

    updatePourTarget();
    updateHover();
    showToast(`Пресипано у: ${target.dataset.label||'посуду'}.`);
  },910);
  return true;
}

function roastedPepperEntry(vessel){
 if(!vessel||!isContainerItem(vessel))return null;
 const phases=[4,3,2]; // take the most roasted visible pepper first
 if(isHeatableCookwareItem(vessel)){
   const model=CooksterPan.read(vessel);
   for(const phase of phases){
     const key=`paprika_pecena_${phase}`;
     if((+model.ingredients?.[key]||0)>0)return {phase,key,count:+model.ingredients[key]};
   }
   if((+model.ingredients?.paprika_pecena||0)>0)return {phase:4,key:'paprika_pecena',count:+model.ingredients.paprika_pecena};
   return null;
 }
 const model=CooksterContainer.read(vessel);
 for(const phase of phases){
   const key=`paprika_pecena_${phase}`;
   if((+model.items?.[key]?.count||0)>0)return {phase,key,count:+model.items[key].count};
 }
 if((+model.items?.paprika_pecena?.count||0)>0)return {phase:4,key:'paprika_pecena',count:+model.items.paprika_pecena.count};
 return null;
}
function roastedPepperVesselAt(x,y){
 // Food sprites inside vessels deliberately use pointer-events:none so the
 // vessel can normally be dragged. elementsFromPoint() therefore cannot be
 // trusted for ingredient pickup. Hit-test the rendered pepper rectangles
 // explicitly, from visually topmost to bottommost.
 const peppers=[...scene.querySelectorAll('.whole-roasted-pepper')];
 for(let i=peppers.length-1;i>=0;i--){
   const pepper=peppers[i];
   if(!pepper.isConnected||pepper.offsetParent===null)continue;
   const r=pepper.getBoundingClientRect();
   if(x<r.left||x>r.right||y<r.top||y>r.bottom)continue;
   const vessel=pepper.closest?.('.item');
   if(vessel&&vessel!==holding&&roastedPepperEntry(vessel))return vessel;
 }
 return null;
}
function takeRoastedPepperFromVessel(vessel){
 const entry=roastedPepperEntry(vessel);
 if(!entry)return false;

 if(isHeatableCookwareItem(vessel)){
   CooksterPan.removeIngredient(vessel,entry.key,1);
 }else{
   const model=CooksterContainer.read(vessel);
   if(!model.items?.[entry.key])return false;
   model.items[entry.key].count=Math.max(0,(+model.items[entry.key].count||0)-1);
   if(model.items[entry.key].count<=0)delete model.items[entry.key];
   CooksterContainer.write(vessel,model);
 }
 renderCookwareContents(vessel);
 if(isHeatableCookwareItem(vessel))updateCookingStatus(vessel);

 const veg=VEGETABLES.paprika;
 const cx=+vessel.dataset.cx||850,by=+vessel.dataset.by||450;
 const phase=entry.phase;
 const loose=makeItem({
   id:'veg_paprika_roasted_'+Date.now(),
   label:phase>=4?'Pečena paprika':'Zapečena paprika',
   src:PAPRIKA_ROAST_ASSETS[phase-1],
   x:cx-(veg.w/2),y:by-veg.h,
   w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'
 });
 loose.dataset.vegetable='1';
 loose.dataset.collisionProfile='vegetable';
 loose.dataset.vegKey='paprika';
 loose.dataset.cutState='whole';
 loose.dataset.roastPhase=String(phase);
 // Put it safely inside the matching phase interval so its state survives pickup/save.
 loose.dataset.roastProgress=String(phase===2?.30:(phase===3?.55:.80));
 setPose(loose,cx,by-24,+vessel.dataset.vis||1);
 startHolding(loose);
 CooksterSave.schedule();
 showToast((phase>=4?'Pečena':'Zapečena')+' paprika je izvađena — možeš dalje da je obrađuješ.');
 return true;
}

function addIngredientToContainer(item,vessel){
 if(!item||!vessel||!isContainerItem(vessel))return false;
 const meta=ingredientVisualMeta(item);if(!meta)return false;
 // Oil bottle uses the continuous press-and-hold pour system, never the
 // legacy one-click "1 measure" staple path.
 if(isSceneOilBottle(item)){
   return beginOilPour(item,vessel,null);
 }
 const heatable=isHeatableCookwareItem(vessel);
 if(heatable&&CooksterPan.read(vessel).burnt){
   showToast('Posuđe je zagorelo — operi ga pre nove ture.');
   return true;
 }

 if(meta.type!=='staple'&&containerTotal(vessel)>=containerCapacity(vessel)){
   showToast(`${vessel.dataset.label} je pun — kapacitet je ${containerCapacity(vessel)}.`);
   return true;
 }

 if(heatable){
   if(meta.type==='staple'){
     const uses=+item.dataset.uses||0;if(uses<=0){showToast('Pakovanje je prazno.');return true}
     const modelKey=meta.key==='ulje'?'oil':meta.key==='so'?'salt':meta.key;
     CooksterPan.addStaple(vessel,modelKey,1);item.dataset.uses=String(uses-1);
     if(meta.key==='ulje'){updateVesselOilVisual(vessel);playOilPourFx(item,vessel);}
     if(isHeatableCookwareItem(vessel))updateCookingStatus(vessel);
     CooksterSave.schedule();
     showToast(`${meta.label}: dodata 1 mera u ${vessel.dataset.label}.`);return true;
   }
   CooksterPan.addIngredient(vessel,meta.key,1);
   rememberPanIngredientMeta(vessel,meta);
   delete vessel.dataset.readyAnnounced;
   const counts=CooksterPan.counts(vessel),present=Object.entries(counts).filter(([,v])=>(+v||0)>0).map(([k])=>k);
   vessel.dataset.panVegKey=present.length>1?'mix':(present[0]||meta.key);
   renderCookwareContents(vessel);if(isHeatableCookwareItem(vessel))updateCookingStatus(vessel);
 }else{
   if(meta.type==='staple'){
     const uses=+item.dataset.uses||0;if(uses<=0){showToast('Pakovanje je prazno.');return true}
     CooksterContainer.add(vessel,meta.key,meta,1);item.dataset.uses=String(uses-1);renderVesselContents(vessel);
     if(meta.key==='ulje'){updateVesselOilVisual(vessel);playOilPourFx(item,vessel);}
     CooksterSave.schedule();
     showToast(`${meta.label}: dodata 1 mera u ${vessel.dataset.label}.`);return true;
   }
   CooksterContainer.add(vessel,meta.key,meta,1);renderCookwareContents(vessel);
 }
 const cx=+vessel.dataset.cx,by=+vessel.dataset.by,vis=+vessel.dataset.vis||1;
 popArtPuff(cx,by-16*vis,Math.max(.52,vis*.65));playImpactSound(vegSoundTarget(item),'putIn');
 removeItem(item);holding=null;hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();CooksterSave.schedule();
 showToast(`${meta.label} je stavljen u ${vessel.dataset.label}.`);return true;
}

function commitHeldIngredientToVessel(item=holding,clientX=mouse.x,clientY=mouse.y){
  if(!item||item!==holding||!isIngredientItem(item))return false;
   if(sinkHit(clientX,clientY)){
     const meta=ingredientVisualMeta(item);
     if(meta?.type==='fruit'||meta?.type==='vegetable')return addProduceToSink(item);
   }
  const vessel=resolveIngredientVesselTarget(item,clientX,clientY);
  if(!vessel)return false;
  return !!addIngredientToContainer(item,vessel);
}




// v198.5.141 — screen-space cooking HUD.
// The old status node lived inside transformed cookware, so perspective/rotateZ
// tilted the bar with the pan. This HUD lives on document.body and remains flat.
const cookingHudStyle=document.createElement('style');
cookingHudStyle.textContent=`
.item > .pan-status,.item > .cooking-status{display:none!important}
.cookster-cooking-hud{
  position:fixed;
  display:none;
  width:184px;
  pointer-events:none;
  z-index:15050;
  transform:translate(-50%,-100%);
  font:800 12px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;
  color:#fff;
  text-align:center;
  filter:none!important;
}
.cookster-cooking-hud.visible{display:block}
.cookster-cooking-hud .cook-state-label{
  display:inline-block;
  margin-bottom:5px;
  padding:3px 8px;
  border-radius:8px;
  background:rgba(29,18,11,.84);
  box-shadow:0 1px 0 rgba(255,255,255,.15) inset,0 2px 5px rgba(0,0,0,.28);
}
.cookster-cooking-hud .cook-progress-bar{
  position:relative;
  width:184px;
  height:12px;
  overflow:hidden;
  border:2px solid rgba(42,24,13,.95);
  border-radius:3px;
  background:rgba(246,229,191,.92);
  box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 2px 6px rgba(0,0,0,.30);
}
.cookster-cooking-hud .cook-progress-bar>i{
  position:absolute;left:0;top:0;bottom:0;width:0%;
  display:block;background:linear-gradient(90deg,#f0b43b,#e66f27);
}
.cookster-cooking-hud.ready .cook-progress-bar>i{background:linear-gradient(90deg,#73c55b,#3f9b45)}
.cookster-cooking-hud.browned .cook-progress-bar>i{background:linear-gradient(90deg,#b56d34,#714021)}
.cookster-cooking-hud.burnt .cook-progress-bar>i{background:linear-gradient(90deg,#5f4638,#251b16)}
.cookster-cooking-hud .cook-safe-mark{
  position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;
  background:rgba(255,255,255,.82);box-shadow:0 0 0 1px rgba(65,37,20,.35)
}
`;
document.head.appendChild(cookingHudStyle);

function positionCookingHud(vessel){
 const hud=vessel?._panStatus;
 if(!vessel||!hud||!hud.classList.contains('cookster-cooking-hud'))return;
 const r=vessel.getBoundingClientRect?.();
 if(!r||r.width<2||r.height<2){hud.style.display='none';return;}
 hud.style.left=(r.left+r.width*.5)+'px';
 hud.style.top=(r.top-Math.max(8,Math.min(22,r.height*.10)))+'px';
}

function ensureCookingEffects(vessel){
  if(!vessel||!isHeatableCookwareItem(vessel))return;
  if(!vessel._panStatus||!vessel._panStatus.isConnected||!vessel._panStatus.classList.contains('cookster-cooking-hud')){
    // Remove legacy transformed status if one still exists on an older runtime item.
    vessel.querySelectorAll?.(':scope > .pan-status,:scope > .cooking-status').forEach(n=>n.remove());
    const status=document.createElement('div');
    status.className='cookster-cooking-hud';
    status.innerHTML='<div class="cook-state-label">Sirovo</div><div class="cook-progress-bar"><i></i><b class="cook-safe-mark"></b></div>';
    document.body.appendChild(status);vessel._panStatus=status;
    vessel._cookStateLabel=status.querySelector('.cook-state-label');
    vessel._cookProgressFill=status.querySelector('.cook-progress-bar>i');
  }
  if(vessel._panStatus){
    vessel._cookStateLabel??=vessel._panStatus.querySelector('.cook-state-label');
    vessel._cookProgressFill??=vessel._panStatus.querySelector('.cook-progress-bar>i');
  }
  if(!vessel._panSmoke){
    const smoke=document.createElement('div');smoke.className='pan-smoke';
    smoke.innerHTML='<span></span><span></span><span></span>';
    vessel.appendChild(smoke);vessel._panSmoke=smoke;
  }
  if(!vessel._washFoam){
    const foam=document.createElement('div');foam.className='wash-foam';
    vessel.appendChild(foam);vessel._washFoam=foam;
  }
  // v198.5.108 — vortex removed again (final decision: gone for good).
  if(!vessel._stirSparkles){
    const sparkles=document.createElement('div');
    sparkles.className='stir-sparkles';
    const spots=[[32,38],[61,30],[46,52],[71,58],[26,60],[54,44],[40,24],[66,48],[36,66],[58,62]];
    spots.forEach((spot,i)=>{
      const dot=document.createElement('span');
      dot.style.left=spot[0]+'%';
      dot.style.top=spot[1]+'%';
      dot.style.animationDelay=(deterministicUnitNoise('sparkle',i,3)*1.6).toFixed(2)+'s';
      dot.style.animationDuration=(1.3+deterministicUnitNoise('sparkle',i,9)*0.9).toFixed(2)+'s';
      sparkles.appendChild(dot);
    });
    vessel.appendChild(sparkles);
    vessel._stirSparkles=sparkles;
  }
  // v198.5.83 — small translucent bubbles while stirring (separate from the
  // golden sizzle bubbles, which only show while actively heating).
  if(!vessel._stirBubbles){
    const bubbles=document.createElement('div');
    bubbles.className='stir-bubbles';
    const spots=[[35,55],[58,40],[44,62],[68,48],[29,42],[52,58],[63,32],[40,36]];
    spots.forEach((spot,i)=>{
      const b=document.createElement('span');
      b.style.left=spot[0]+'%';
      b.style.top=spot[1]+'%';
      b.style.animationDelay=(deterministicUnitNoise('bubble',i,5)*1.4).toFixed(2)+'s';
      b.style.animationDuration=(1.1+deterministicUnitNoise('bubble',i,17)*0.8).toFixed(2)+'s';
      bubbles.appendChild(b);
    });
    vessel.appendChild(bubbles);
    vessel._stirBubbles=bubbles;
  }
  if(!vessel._stirRadialBlur){
    const rb=document.createElement('div');
    rb.className='stir-radial-blur';
    vessel.appendChild(rb);
    vessel._stirRadialBlur=rb;
  }
  // v198.5.104 — a small reusable pool of ripple rings, spawned from the
  // spoon's current position while stirring (see updateStirring). Reusing
  // a fixed pool (instead of creating/removing elements every ripple) keeps
  // this essentially free performance-wise even during long stirring.
  if(!vessel._stirRipples){
    const ripples=document.createElement('div');
    ripples.className='stir-ripples';
    for(let i=0;i<4;i++){
      const ring=document.createElement('span');
      ring.className='stir-ripple';
      ripples.appendChild(ring);
    }
    vessel.appendChild(ripples);
    vessel._stirRipples=ripples;
    vessel._stirRippleCursor=0;
  }
}





function ensureGrinderFrontOcclusionMask(el){
  if(!el||el.dataset?.fixedGrinder!=='1')return null;
  if(el._grinderFrontOcclusion)return el._grinderFrontOcclusion;

  // Hard foreground redraw on document.body, not inside the scene tree.
  // This makes the ENTIRE grinder reliably sit above every gameplay prop.
  const wrap=document.createElement('div');
  wrap.className='grinder-front-occlusion-wrap';
  Object.assign(wrap.style,{
    position:'fixed',
    left:'0px',
    top:'0px',
    width:'0px',
    height:'0px',
    pointerEvents:'none',
    userSelect:'none',
    zIndex:'2147483000',
    display:'none'
  });

  const body=document.createElement('img');
  body.className='grinder-front-occlusion-body';
  body.src=el.querySelector('.body')?.getAttribute('src')||'assets/items/grinder_fixed/grinder_body.png';
  body.alt='';
  body.draggable=false;
  Object.assign(body.style,{
    position:'absolute',
    inset:'0',
    width:'100%',
    height:'100%',
    objectFit:'contain',
    objectPosition:'center bottom',
    zIndex:'1',
    pointerEvents:'none'
  });
  wrap.appendChild(body);

  const handle=document.createElement('img');
  handle.className='grinder-front-occlusion-handle';
  handle.src='assets/items/grinder_fixed/grinder_handle.png';
  handle.alt='';
  handle.draggable=false;
  Object.assign(handle.style,{
    position:'absolute',
    left:'-32.9%',
    top:'20.6%',
    width:'62%',
    height:'auto',
    transformOrigin:'80.7% 85.4%',
    zIndex:'2',
    pointerEvents:'none'
  });
  wrap.appendChild(handle);

  const hub=document.createElement('span');
  hub.className='grinder-front-occlusion-hub-cap';
  Object.assign(hub.style,{
    position:'absolute',
    left:'11.5%',
    top:'42.7%',
    width:'7.0%',
    aspectRatio:'1',
    borderRadius:'50%',
    zIndex:'3',
    pointerEvents:'none',
    background:'radial-gradient(circle at 38% 35%,#f2eee5 0%,#bdb4a5 31%,#6d6962 58%,#242422 74%,#aaa398 78% 88%,#35322e 100%)',
    boxShadow:'0 0 0 1px rgba(20,20,18,.72), inset 1px 1px 1px rgba(255,255,255,.55)'
  });
  wrap.appendChild(hub);

  document.body.appendChild(wrap);
  el._grinderFrontOcclusion=wrap;
  el._grinderFrontOcclusionBody=body;
  el._grinderFrontOcclusionHandle=handle;
  el._grinderFrontOcclusionHub=hub;
  return wrap;
}
function syncGrinderFrontOcclusionMask(el){
  const wrap=ensureGrinderFrontOcclusionMask(el);if(!wrap)return;

  const hiddenBecauseInteractive=
    !el ||
    el.offsetParent===null ||
    holding===el ||
    el.classList?.contains('held') ||
    el.classList?.contains('dragging');

  // IMPORTANT:
  // Do NOT hide the grinder mask just because some OTHER item is being picked
  // or placed. That was the bug: the mask disappeared exactly while moving
  // props, so those props popped in front of the grinder.
  // The mask should disappear only while the grinder itself is being moved.

  if(hiddenBecauseInteractive){
    wrap.style.display='none';
    return;
  }

  const r=el.getBoundingClientRect?.();
  if(!r||r.width<2||r.height<2){
    wrap.style.display='none';
    return;
  }

  wrap.style.left=r.left+'px';
  wrap.style.top=r.top+'px';
  wrap.style.width=r.width+'px';
  wrap.style.height=r.height+'px';
  wrap.style.display='block';
  wrap.style.zIndex='2147483000';

  const ang=+(el.dataset.grinderHandleAngle||0);
  if(el._grinderFrontOcclusionHandle){
    const rx=Math.sin((ang*Math.PI)/180)*74;
    el._grinderFrontOcclusionHandle.style.transform=`perspective(900px) rotateX(${rx.toFixed(3)}deg)`;
  }
}




function isPaprikaSteamBag(el){
  return !!el&&el.dataset?.itemId===PAPRIKA_STEAM_BAG_ID;
}
function paprikaSteamBagCount(el){
  return Math.max(0,Math.min(10,Math.round(+el?.dataset?.bagCount||0)));
}
function paprikaSteamBagClosed(el){
  return el?.dataset?.bagClosed==='1';
}
function paprikaSteamBagReadyToOpen(el){
  if(!paprikaSteamBagClosed(el))return false;
  const closedAt=+el.dataset.bagClosedAt||0;
  return closedAt>0&&Date.now()-closedAt>=PAPRIKA_STEAM_DURATION_MS;
}
function paprikaSteamBagStage(el){
  return Math.min(4,Math.floor(paprikaSteamBagCount(el)/2));
}
function paprikaSteamBagClosedStage(el){
  // The six supplied closed sprites represent one through six-or-more
  // peppers. This keeps distinct visuals for closing after three or five.
  return Math.min(5,Math.max(0,paprikaSteamBagCount(el)-1));
}
function renderPaprikaSteamBag(el){
  if(!isPaprikaSteamBag(el))return;
  const src=paprikaSteamBagClosed(el)
    ?(PAPRIKA_STEAM_BAG_CLOSED_ASSETS[paprikaSteamBagClosedStage(el)]||PAPRIKA_STEAM_BAG_CLOSED_ASSETS[5])
    :PAPRIKA_STEAM_BAG_ASSETS[paprikaSteamBagStage(el)]||PAPRIKA_STEAM_BAG_ASSETS[0];
  const body=el.querySelector('.body');
  const shadow=el._contactShadow?.querySelector('img');
  if(body)body.src=src;
  if(shadow)shadow.src=src;
  const count=paprikaSteamBagCount(el);
  const state=paprikaSteamBagClosed(el)?'zatvorena':'otvorena';
  el.dataset.label=`Kesa za potparivanje paprika · ${count}/10 · ${state}`;
}
function isRoastedPepperForSteamBag(el){
  if(!el||el.dataset.vegetable!=='1'||el.dataset.vegKey!=='paprika'||el.dataset.cutState!=='whole')return false;
  const progress=+el.dataset.roastProgress||0;
  return paprikaRoastPhase(el)>=4&&progress>=.75&&progress<1.08&&el.dataset.steamedPepper!=='1';
}
function addRoastedPepperToSteamBag(bag,pepper){
  if(!isPaprikaSteamBag(bag)||!isRoastedPepperForSteamBag(pepper))return false;
  if(paprikaSteamBagClosed(bag)){showToast('Kesa je zatvorena. Prvo je otvori posle parenja.');return true;}
  const count=paprikaSteamBagCount(bag);
  if(count>=10){showToast('Kesa je puna — zatvori je da se paprike potpare.');return true;}
  bag.dataset.bagCount=String(count+1);
  removeItem(pepper);holding=null;
  hidePlacementGhost();hideOriginGhost();clearPanTargets();updateHover();
  renderPaprikaSteamBag(bag);CooksterSave.schedule();
  showToast(`Pečena paprika je u kesi (${count+1}/10).`);
  return true;
}
function steamedPepperFromBag(bag){
  if(!isPaprikaSteamBag(bag))return false;
  if(paprikaSteamBagClosed(bag)){
    if(!paprikaSteamBagReadyToOpen(bag)){
      const remaining=Math.max(0,PAPRIKA_STEAM_DURATION_MS-(Date.now()-(+bag.dataset.bagClosedAt||Date.now())));
      showToast(`Kesa se pari još ${Math.ceil(remaining/60000)} min.`);
    }else showToast('Desni klik na kesu i izaberi „Otvori kesu“.');
    return true;
  }
  const count=paprikaSteamBagCount(bag);
  if(count<=0){showToast('Kesa je prazna.');return true;}
  const veg=VEGETABLES.paprika, cx=+bag.dataset.cx||850, by=+bag.dataset.by||540;
  bag.dataset.bagCount=String(count-1);
  const loose=makeItem({id:'paprika_potparena_'+Date.now(),label:'Potparena paprika',src:PAPRIKA_ROAST_ASSETS[3],x:cx-(veg.w/2),y:by-veg.h,w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'});
  loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey='paprika';loose.dataset.cutState='whole';
  loose.dataset.roastPhase='4';loose.dataset.roastProgress='.80';loose.dataset.steamedPepper='1';loose.dataset.readyToPeel='1';loose.dataset.peelHits='0';
  renderPaprikaPeelState(loose);
  setPose(loose,cx,by-24,1);renderPaprikaSteamBag(bag);startHolding(loose);CooksterSave.schedule();
  showToast(`Uzeo si potparenu papriku (${count-1} u kesi).`);
  return true;
}
function paprikaPeelHits(el){return Math.max(0,Math.min(2,Math.round(+el?.dataset?.peelHits||0)));}
function renderPaprikaPeelState(el){
  if(!el)return;
  const eggplant=isWholePatlidzan(el);
  if(!eggplant&&el.dataset.steamedPepper!=='1')return;
  const body=el.querySelector('.body'),shadow=el._contactShadow?.querySelector('img');
  const peeled=el.dataset.peeled==='1',partial=paprikaPeelHits(el)>=1;
  const src=eggplant
    ?(peeled?PATLIDZAN_PEEL_ASSETS.peeled:partial?PATLIDZAN_PEEL_ASSETS.partial:PATLIDZAN_ROAST_ASSETS[2])
    :(peeled?PAPRIKA_PEEL_ASSETS.peeled:partial?PAPRIKA_PEEL_ASSETS.partial:PAPRIKA_ROAST_ASSETS[3]);
  if(body)body.src=src;
  if(shadow)shadow.src=src;
  el.dataset.label=eggplant
    ?(peeled?'Oljušten pečen patlidžan':partial?'Patlidžan — ljuštenje u toku':'Pečen patlidžan')
    :(peeled?'Oljuštena paprika':partial?'Paprika — ljuštenje u toku':'Potparena paprika');
}
let paprikaPeelGame=null;
let paprikaPeelCameraSnapshot=null;
function focusPaprikaPeelBoard(pepper){
  if(paprikaPeelCameraSnapshot)return;
  paprikaPeelCameraSnapshot={scale,offsetX,offsetY,cameraX};
  const cx=+pepper?.dataset?.cx||0;
  const by=+pepper?.dataset?.by||0;
  const h=Math.max(1,+pepper?.dataset?.baseH||pepper?.offsetHeight||72);
  const board=getBoardEl();
  const boardWidth=Math.max(1,+board?.dataset?.baseW||291);
  const targetScale=Math.min(2.5,Math.max(fitScale,innerWidth*.72/boardWidth));
  scale=Math.max(fitScale,targetScale);
  offsetX=innerWidth*.50-cx*scale;
  offsetY=innerHeight*.54-(by-h*.52)*scale;
  applyCamera();
}
function restorePaprikaPeelCamera(){
  if(!paprikaPeelCameraSnapshot)return;
  ({scale,offsetX,offsetY,cameraX}=paprikaPeelCameraSnapshot);
  paprikaPeelCameraSnapshot=null;
  applyCamera();updateHover();
}
function closePaprikaPeelGame(){
  if(!paprikaPeelGame)return;
  cancelAnimationFrame(paprikaPeelGame.raf);
  paprikaPeelGame.keyHandler&&window.removeEventListener('keydown',paprikaPeelGame.keyHandler);
  paprikaPeelGame.root.remove();
  paprikaPeelGame=null;
  restorePaprikaPeelCamera();
}
function startPaprikaPeeling(el){
  if(!el||el.dataset.readyToPeel!=='1'||el.dataset.peeled==='1')return false;
  const eggplant=isWholePatlidzan(el);
  if(el.dataset.attachedToBoard!=='1'&&el.dataset.surfaceZone!=='board'){
    showToast(`Prvo stavi ${eggplant?'patlidžan':'papriku'} na dasku.`);
    return true;
  }
  if(paprikaPeelGame){showToast('Završi trenutno ljuštenje.');return true;}
  focusPaprikaPeelBoard(el);
  const root=document.createElement('div');
  Object.assign(root.style,{position:'fixed',inset:'0',zIndex:'32000',display:'grid',placeItems:'end center',padding:'0 16px 34px',background:'rgba(18,10,6,.18)',font:'600 14px/1.25 system-ui,sans-serif',color:'#fff'});
  const card=document.createElement('div');
  Object.assign(card.style,{width:'min(440px,calc(100vw - 32px))',padding:'14px 16px 16px',borderRadius:'12px',border:'1px solid rgba(255,225,165,.65)',background:'rgba(48,29,18,.97)',boxShadow:'0 10px 35px rgba(0,0,0,.42)',textAlign:'center'});
  const heading=document.createElement('strong');heading.textContent=`Oljušti ${eggplant?'patlidžan':'papriku'}`;heading.style.display='block';heading.style.fontSize='17px';
  const hint=document.createElement('div');hint.textContent='Klikni kada tačkica bude u zelenom polju.';hint.style.margin='5px 0 11px';hint.style.opacity='.86';
  const track=document.createElement('div');
  Object.assign(track.style,{position:'relative',height:'28px',borderRadius:'15px',background:'linear-gradient(180deg,#191511,#33251b)',border:'2px solid rgba(255,255,255,.32)',cursor:'pointer',touchAction:'none',overflow:'hidden'});
  const target=document.createElement('div');
  Object.assign(target.style,{position:'absolute',top:'2px',bottom:'2px',width:'23%',borderRadius:'10px',background:'#58d66d',boxShadow:'0 0 12px rgba(88,214,109,.9)',pointerEvents:'none'});
  const marker=document.createElement('div');
  Object.assign(marker.style,{position:'absolute',top:'-2px',width:'7px',height:'28px',borderRadius:'5px',background:'#ffe08a',boxShadow:'0 0 8px rgba(255,224,138,.95)',pointerEvents:'none'});
  track.append(target,marker);
  const status=document.createElement('div');status.style.marginTop='9px';status.style.minHeight='18px';
  card.append(heading,hint,track,status);root.appendChild(card);document.body.appendChild(root);
  const state={root,raf:0,pos:0,dir:1,target:.28,hit:paprikaPeelHits(el),last:performance.now()};
  paprikaPeelGame=state;
  const setTarget=()=>{
    state.target=state.hit===0?.28:.67;
    target.style.left=(state.target*100)+'%';
    status.textContent=`Uspešni klikovi: ${state.hit}/2`;
  };
  setTarget();
  const loop=now=>{
    if(paprikaPeelGame!==state)return;
    const dt=Math.min(.04,(now-state.last)/1000);state.last=now;
    state.pos+=state.dir*dt*(state.hit?1.28:1.05);
    if(state.pos>=1){state.pos=1;state.dir=-1;}
    if(state.pos<=0){state.pos=0;state.dir=1;}
    marker.style.left=`calc(${state.pos*100}% - 3.5px)`;
    state.raf=requestAnimationFrame(loop);
  };
  state.raf=requestAnimationFrame(loop);
  const attempt=e=>{
    e.preventDefault();e.stopPropagation();
    const targetRect=target.getBoundingClientRect();
    const success=e.clientX>=targetRect.left&&e.clientX<=targetRect.right;
    if(!success){status.textContent='Promašaj — sačekaj sledeći prolaz.';return;}
    state.hit++;
    el.dataset.peelHits=String(state.hit);renderPaprikaPeelState(el);CooksterSave.schedule();
    if(state.hit>=2){
      el.dataset.peeled='1';el.dataset.readyToPeel='0';renderPaprikaPeelState(el);CooksterSave.schedule();
      status.textContent=`Uspeh — ${eggplant?'patlidžan je potpuno oljušten':'paprika je potpuno oljuštena'}.`;
      setTimeout(()=>{closePaprikaPeelGame();showToast(`${eggplant?'Patlidžan je oljušten':'Paprika je oljuštena'} — spreman za mlevenje.`);},420);
      return;
    }
    state.pos=0;state.dir=1;setTarget();status.textContent='Prvi pogodak! Još jedan uspešan klik.';
  };
  track.addEventListener('pointerdown',attempt);
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  state.keyHandler=e=>{
    if(e.key==='Escape'){e.preventDefault();closePaprikaPeelGame();return;}
    if(e.code==='Space'){e.preventDefault();attempt({preventDefault(){},stopPropagation(){},clientX:track.getBoundingClientRect().left+state.pos*track.offsetWidth});}
  };
  window.addEventListener('keydown',state.keyHandler);
  return true;
}
function peelSteamedPepper(el){return startPaprikaPeeling(el);}
let paprikaBagActionMenu=null;
let paprikaBagPointerDrag=null;
let paprikaBagCountdownTimer=null;
function closePaprikaBagActionMenu(){
  if(paprikaBagCountdownTimer){clearInterval(paprikaBagCountdownTimer);paprikaBagCountdownTimer=null;}
  if(paprikaBagActionMenu){paprikaBagActionMenu.remove();paprikaBagActionMenu=null;}
}
function openPaprikaBagActionMenu(target,x,y){
  closePaprikaBagActionMenu();
  const menu=document.createElement('div');menu.className='paprika-bag-action-menu';
  Object.assign(menu.style,{position:'fixed',left:'0px',top:'0px',zIndex:'30000',display:'flex',flexDirection:'column',gap:'5px',padding:'7px',background:'rgba(39,28,19,.96)',border:'1px solid rgba(255,220,150,.75)',borderRadius:'7px',boxShadow:'0 5px 18px rgba(0,0,0,.45)',color:'#fff',font:'600 13px/1.2 system-ui,sans-serif'});
  menu.addEventListener('pointerdown',e=>e.stopPropagation());
  const title=document.createElement('strong');title.textContent=isPaprikaSteamBag(target)?`Kesa · ${paprikaSteamBagCount(target)}/10`:isWholePatlidzan(target)?'Pečen patlidžan':'Potparena paprika';title.style.padding='2px 5px 4px';menu.appendChild(title);
  const addAction=(label,disabled,fn)=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=!!disabled;
    Object.assign(button.style,{border:'0',borderRadius:'5px',padding:'7px 10px',cursor:disabled?'not-allowed':'pointer',background:disabled?'rgba(255,255,255,.14)':'#f0c36a',color:disabled?'rgba(255,255,255,.55)':'#2a1a0e',font:'700 13px system-ui'});
    button.addEventListener('click',e=>{e.stopPropagation();closePaprikaBagActionMenu();if(!button.disabled)fn();});menu.appendChild(button);
    return button;
  };
  if(isPaprikaSteamBag(target)){
    if(paprikaSteamBagClosed(target)){
      const ready=paprikaSteamBagReadyToOpen(target);
      const openButton=addAction(ready?'Otvori kesu':`Parenje u toku · ${Math.ceil(Math.max(0,PAPRIKA_STEAM_DURATION_MS-(Date.now()-(+target.dataset.bagClosedAt||Date.now())))/1000)}`,!ready,()=>{
        delete target.dataset.bagClosed;delete target.dataset.bagClosedAt;target.dataset.bagSteamed='1';renderPaprikaSteamBag(target);CooksterSave.schedule();showToast('Kesa je otvorena — izvadi potparene paprike.');
      });
      const updateCountdown=()=>{
        if(!target.isConnected||!paprikaBagActionMenu||!openButton.isConnected){
          closePaprikaBagActionMenu();return;
        }
        const remaining=Math.max(0,PAPRIKA_STEAM_DURATION_MS-(Date.now()-(+target.dataset.bagClosedAt||Date.now())));
        if(remaining<=0){
          openButton.disabled=false;openButton.textContent='Otvori kesu';
          openButton.style.cursor='pointer';openButton.style.background='#f0c36a';openButton.style.color='#2a1a0e';
          if(paprikaBagCountdownTimer){clearInterval(paprikaBagCountdownTimer);paprikaBagCountdownTimer=null;}
        }else{
          openButton.disabled=true;
          openButton.textContent=`Parenje u toku · ${Math.ceil(remaining/1000)}`;
        }
      };
      if(!ready){paprikaBagCountdownTimer=setInterval(updateCountdown,250);updateCountdown();}
    }else{
      const count=paprikaSteamBagCount(target);
      addAction('Zatvori kesu',count<=0,()=>{target.dataset.bagClosed='1';target.dataset.bagClosedAt=String(Date.now());renderPaprikaSteamBag(target);CooksterSave.schedule();showToast('Kesa je zatvorena. Paprike se pare 10 sekundi.');});
    }
  }else if(target.dataset.readyToPeel==='1'&&target.dataset.peeled!=='1')addAction(isWholePatlidzan(target)?'Oljušti patlidžan':'Oljušti papriku',false,()=>peelSteamedPepper(target));
  document.body.appendChild(menu);paprikaBagActionMenu=menu;
  const mw=menu.offsetWidth||180,mh=menu.offsetHeight||60;
  menu.style.left=Math.max(8,Math.min(innerWidth-mw-8,x+4))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-mh-8,y+4))+'px';
  setTimeout(()=>document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))closePaprikaBagActionMenu();},{once:true}),0);
}

function makeItem(d){
 if(BUILTIN_UI_ELEMENT_IDS.has(d.id))return null; // never create a physical item for UI art
 const ch=document.createElement('div');ch.className='contact-shadow-sprite '+(d.contactMode||((d.id||'')==='daska'?'front-edge':'silhouette'));scene.appendChild(ch);
 ch.style.setProperty('position','absolute','important');
 const chImg=document.createElement('img');chImg.src=d.src;chImg.alt='';ch.appendChild(chImg);
 const el=document.createElement('div');el.className='item';el.dataset.itemId=d.id||'';el.dataset.instanceId=d.instanceId||nextItemInstanceId(d.id||'item');el.dataset.label=d.label;el.dataset.baseW=d.w;el.dataset.baseH=d.h;el.dataset.zBase=d.z||1;el.dataset.angle=d.angle||0;el.dataset.tilt=String(clampItemTilt(d.tilt||0));el.dataset.shadowProfile=d.shadowProfile||'';el.dataset.snapProfile=d.snapProfile||'';if(d.staple){el.dataset.staple='1';el.dataset.stapleKey=d.staple;el.dataset.uses=String(d.uses||1);}el._contactShadow=ch;el._lidMeta=d.lid||null;el._parentVessel=d.parentVessel||null;
 const body=document.createElement('img');body.className='body';body.src=d.src;body.alt=d.label;el.appendChild(body);
 prepareContactShadowAlphaBounds(ch,chImg);
 ch._onAlphaBoundsReady=()=>{
   if(!el.isConnected||!Number.isFinite(+el.dataset.cx)||!Number.isFinite(+el.dataset.by))return;
   try{setPose(el,+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);}catch(_){}
 };
 if(d.id==='mlin_za_mesо'){
   el.dataset.fixedGrinder='1';
   const crank=document.createElement('img');
   crank.className='grinder-fixed-handle';
   crank.src='assets/items/grinder_fixed/grinder_handle.png';
   crank.alt='';
   Object.assign(crank.style,{
     position:'absolute',left:'-32.9%',top:'20.6%',width:'62%',height:'auto',
     zIndex:'26',display:'block',visibility:'visible',opacity:'1',
     pointerEvents:'auto',userSelect:'none',cursor:'grab',touchAction:'none',
     transformOrigin:'80.7% 85.4%',transform:'rotate(0deg)'
   });
   el.appendChild(crank);
   el._grinderHandle=crank;
   el.dataset.grinderHandleAngle=el.dataset.grinderHandleAngle||'0';

   // Fixed bearing cap: masks tiny perspective changes at the rotating PNG joint.
   // It is anchored to the grinder body, not to the transformed handle.
   const hub=document.createElement('span');
   hub.className='grinder-fixed-hub-cap';
   Object.assign(hub.style,{
     position:'absolute',left:'11.5%',top:'42.7%',width:'7.0%',aspectRatio:'1',
     borderRadius:'50%',zIndex:'29',pointerEvents:'none',
     background:'radial-gradient(circle at 38% 35%,#f2eee5 0 16%,#b7b0a5 31%,#6d6962 58%,#242422 74%,#aaa398 78% 88%,#35322e 100%)',
     boxShadow:'0 0 0 1px rgba(20,20,18,.72), inset 1px 1px 1px rgba(255,255,255,.55)'
   });
   el.appendChild(hub);
   el._grinderHubCap=hub;
   ensureGrinderFrontOcclusionMask(el);
 }
 if(isContainerDef(d)){el.dataset.container='1';el.dataset.vesselSubtype=d.subtype||kitchenDefForId(d.id)?.subtype||'';el.classList.add('vessel','vessel-'+(el.dataset.vesselSubtype||'generic'));applyVesselVisualPreset(el);}
 if(isContainerDef(d)&&cookingDefFor(d).canHeat===true)CooksterPan.reset(el);
 if((d.id||'').startsWith('tiganj_')){
   const pc=document.createElement('div');pc.className='pan-content';el.appendChild(pc);el._panContent=pc;
 }
 if(isContainerDef(d)&&cookingDefFor(d).canHeat===true){
   ensureCookingEffects(el);
   renderCookwareContents(el);
   updateCookingStatus(el);
 }
 if(d.id==='noz')el.style.transformOrigin='76% 62%';
 if(d.id==='daska')prepareBoardAlphaHit(el);
 if(d.lid){
   const interior=makeInterior(d);el.appendChild(interior);el._interior=interior;
   const lid=makeCrop(d.src,d.lid);el.appendChild(lid);el._lidHit=lid;
 }
 if(isContainerDef(d)&&!(d.id||'').startsWith('tiganj_')){ensureVesselContent(el);if(!['serpa_plava','vangla_mala'].includes(d.id))ensureVesselFrontMask(el,d.src);}
  const by=d.y+d.h;el.dataset.basePerspective=perspectiveAt(by);setPose(el,(d.x+d.w/2)+CENTER_OFFSET,by,1);scene.appendChild(el);items.push(el);
  if(isPaprikaSteamBag(el))renderPaprikaSteamBag(el);
  if(d.id==='kaca_prazna'&&window.CooksterKaca)CooksterKaca.attach(el);
  return el;
}

let kitchenSpawnIndex=0;
function kitchenEquipmentDef(id){
 const def=KITCHEN_EQUIPMENT.find(x=>x.id===id)||null;
 if(!def)return null;
 // Kitchen Elements inherit table/floor placement while retaining extra surfaces.
 const placement=Array.from(new Set([...(Array.isArray(def.placement)?def.placement:[]),'table','floor']));
 return {...def,placement};
}
function ownedKitchenEquipment(){
 if(OBJECT_CALIBRATION_MODE)return KITCHEN_EQUIPMENT.map(def=>def.id);
 const owned=CooksterState.progression.kitchenEquipment;
  return Array.from(new Set([...(Array.isArray(owned)?owned:[]),'mlin_za_mesо',PAPRIKA_STEAM_BAG_ID,'kaca_prazna','kaca_poklopac']));
}
function equipmentCountInKitchen(id){
 return items.filter(el=>el.dataset.itemId===id).length+
  backpackContents.filter(el=>el?.dataset?.itemId===id).length;
}
function equipmentIsInKitchen(id){return equipmentCountInKitchen(id)>0;}

function spawnKitchenEquipment(id){
 const def=kitchenEquipmentDef(id);
 if(!def||(!OBJECT_CALIBRATION_MODE&&!ownedKitchenEquipment().includes(id)))return false;
 if(!OBJECT_CALIBRATION_MODE&&equipmentIsInKitchen(id)){
   showToast(def.label+' je već u kuhinji.');
   return false;
 }
 const slots=[
   {cx:360,by:590},{cx:530,by:610},{cx:700,by:590},
   {cx:870,by:610},{cx:1040,by:590},{cx:1180,by:610}
 ];
 const slot=slots[kitchenSpawnIndex++%slots.length];
 const el=makeItem({
   ...def,
   instanceId:nextItemInstanceId(def.id||'calibration_prop'),
   x:slot.cx-def.w/2-CENTER_OFFSET,
   y:slot.by-def.h,
   z:++zCounter
 });
 el.dataset.surfaceZone='table';
 if(OBJECT_CALIBRATION_MODE){
   el.dataset.calibrationCopy='1';
   el.dataset.calibrationTemplate=def.id;
 }

 // Current master calibration is applied by setPose()/surfaceScaleFor().
 setPose(el,slot.cx,slot.by,1);

 dropBounce(el);
 popArtPuff(slot.cx,slot.by-10,1);
 playSfxVariant('woodDrop',.18);
 startHolding(el);
 return true;
}
function closeKitchenElements(){
 const sceneEl=document.getElementById('kitchenElementsScene');
 if(!sceneEl)return;
 sceneEl.classList.remove('open');
 sceneEl.setAttribute('aria-hidden','true');
 document.body.classList.remove('kitchen-elements-open');
}
function kitchenEquipmentCard(def,mode){
 const button=document.createElement('button');
 button.type='button';
 button.className='ke-card';
 const onTable=equipmentIsInKitchen(def.id);
 const owned=ownedKitchenEquipment().includes(def.id);
 const img=document.createElement('img');img.src=def.src;img.alt='';
 const text=document.createElement('div');
 const title=document.createElement('strong');title.textContent=def.label;
 text.appendChild(title);

 if(mode==='owned'){
   const info=document.createElement('small');
   const state=document.createElement('span');
   state.className='ke-state';
   if(OBJECT_CALIBRATION_MODE){
     info.textContent='Klik pravi novu nezavisnu kopiju';
     state.textContent='∞ NEOGRANIČENO';
     button.classList.add('calibration-template-card');
   }else{
     info.textContent=onTable?'Već je na radnoj površini':'Klikni da ga izvučeš iz elemenata';
     state.textContent=onTable?'NA STOLU':'U ELEMENTIMA';
     if(onTable){
       button.disabled=true;
       button.classList.add('owned-on-table');
     }
   }
   text.append(info,state);
   button.addEventListener('click',()=>{
     if(spawnKitchenEquipment(def.id)){
       closeKitchenElements();
       updateHover();
     }
   });
 }else{
   const info=document.createElement('small');
   info.textContent=owned?'Kupljeno':'Dodaj trajno u Moju kuhinju';
   const price=document.createElement('div');
   price.className='ke-price';
   price.textContent=owned?'KUPLJENO':(FREE_MODE?'BESPLATNO':`${def.price||0} дин`);
   text.append(info,price);
   if(owned)button.disabled=true;
   button.addEventListener('click',()=>{
     if(ownedKitchenEquipment().includes(def.id))return;
     const price=+def.price||0;
     if(money<price){showToast('Nema dovoljno novca.');return;}
     setMoney(money-price);
     CooksterState.progression.kitchenEquipment.push(def.id);
     showToast('Kupljeno: '+def.label+'.');
     renderKitchenElements();
   });
 }
 button.append(img,text);
 return button;
}
function renderKitchenElements(){
 const ownedGrid=document.getElementById('kitchenOwnedGrid');
 const shopGrid=document.getElementById('kitchenShopGrid');
 const moneyEl=document.getElementById('kitchenShopMoney');
 if(!ownedGrid||!shopGrid)return;
 ownedGrid.innerHTML='';shopGrid.innerHTML='';

 const ownedIds=ownedKitchenEquipment();
 const ownedDefs=KITCHEN_EQUIPMENT.filter(d=>ownedIds.includes(d.id));
 for(const def of ownedDefs)ownedGrid.appendChild(kitchenEquipmentCard(def,'owned'));

 const shopDefs=OBJECT_CALIBRATION_MODE?[]:KITCHEN_EQUIPMENT.filter(d=>!d.starter);
 for(const def of shopDefs)shopGrid.appendChild(kitchenEquipmentCard(def,'shop'));

 if(!ownedDefs.length)ownedGrid.innerHTML='<div class="ke-empty">Nema kuhinjskih elemenata.</div>';
 if(OBJECT_CALIBRATION_MODE){
   shopGrid.innerHTML='<div class="ke-empty">Calibration build: svi elementi su gore i mogu da se stvaraju neograničeno.</div>';
 }else if(!shopDefs.length){
   shopGrid.innerHTML='<div class="ke-empty">Prodavnica je prazna.</div>';
 }
 if(moneyEl)moneyEl.textContent=OBJECT_CALIBRATION_MODE?'∞ KALIBRACIJA':`${money} дин`;
}

function ensureKitchenElementsScroll(){
 const sceneEl=document.getElementById('kitchenElementsScene');
 const columns=sceneEl?.querySelector('.kitchen-elements-columns');
 if(!sceneEl||!columns)return;
 Object.assign(columns.style,{
   overflowY:'scroll',overflowX:'hidden',minHeight:'0',maxHeight:'calc(90vh - 112px)',
   overscrollBehavior:'contain',scrollbarGutter:'stable'
 });
 if(sceneEl.dataset.wheelIsolated!=='1'){
   sceneEl.dataset.wheelIsolated='1';
   sceneEl.addEventListener('wheel',e=>{
     if(!sceneEl.classList.contains('open'))return;
     e.preventDefault();
     e.stopPropagation();
     e.stopImmediatePropagation();
     columns.scrollTop+=e.deltaY;
   },{capture:true,passive:false});
 }
}
function openKitchenElements(){
 ensureKitchenElementsScroll();
 if(document.body.classList.contains('market-open'))return;
 const sceneEl=document.getElementById('kitchenElementsScene');
 if(!sceneEl)return;
 renderKitchenElements();
 sceneEl.classList.add('open');
 sceneEl.setAttribute('aria-hidden','false');
 document.body.classList.add('kitchen-elements-open');
}

function serializeWorldItem(el){
 const body=el.querySelector('.body');
  const keep=['kupusHalf','kacaHalf','spikeN','spikeHang','plateFill','kacaT0','kacaPh','kacaWater','kacaN','kacaLid','kacaP','kacaDay0','kacaRuined','fermentPhase','pieceAtlas','crate','vegKey','count','vegetable','cutState','attachedToBoard','boardRelX','boardRelY','boardRelAngle','embeddedKnife','surfaceZone','stoveZone','onCookstove','onStove','readyAnnounced','renderBucket','panContents','panIngredientMeta','staple','stapleKey','uses','quickTool','panVegKey','collisionProfile','collisionCandidateProfile','onStoveTop','roastProgress','roastPhase','directHeatProgress','baseProduceLabel','container','vesselSubtype','containerContents','marketBag','marketProductKey','marketProductLabel','quantityKg','quantityMode','quantityValue','quantityBunches','cameraYaw','creatorShelfSlot','calibrationBag','bagCount','bagClosed','bagClosedAt','bagSteamed','steamedPepper','readyToPeel','peelHits','peeled','choppedRoastedUnpeeledEggplant','ajvarJar','jarredDish','ajvarFill','ajvarClosed','ajvarLadleFull','ajvarSourceInstanceId','grinderQueue','grinderQueued','grinderProgress','backpackIconScale','woodBasket','woodRemaining','basketWoodLog','firewood'];
 const data={};
 for(const k of keep)if(el.dataset[k]!==undefined)data[k]=el.dataset[k];
 for(const k of ['ajvarMl','ajvarBatchMl'])if(el.dataset[k]!==undefined)data[k]=el.dataset[k];
 return {
    id:el.dataset.itemId||'',instanceId:el.dataset.instanceId||'',label:el.dataset.label||'',src:body?.getAttribute('src')||'',
   calibrationCopy:el.dataset.calibrationCopy==='1',calibrationTemplate:el.dataset.calibrationTemplate||'',
   baseW:+el.dataset.baseW||el.offsetWidth||60,baseH:+el.dataset.baseH||el.offsetHeight||60,
   cx:+el.dataset.cx||0,by:+el.dataset.by||0,vis:+el.dataset.vis||1,angle:+el.dataset.angle||0,tilt:itemTiltValue(el,el.dataset.tilt||0),
   zBase:+el.dataset.zBase||1,shadowProfile:el.dataset.shadowProfile||'',snapProfile:el.dataset.snapProfile||'',
   data
 };
}
function restoreWorldItem(saved){
 // v198.5.31: creator camera was removed from the gameplay build.
 if(saved?.id==='kamera_stativ')return null;
 // the blue pot with a lid was removed from the game; old saves may still contain it
 if(saved?.id==='serpa_plava')return null;
 // The knife is now a physical item and can live in the backpack.
 // Only the remaining legacy quick-wheel tools must be skipped.
 if(saved?.id==='sundjer'||saved?.id==='metla')return null;
  // Remove firewood objects left in older local saves; the old stove-side
  // pile and log pickup are no longer part of gameplay.
   if((saved?.id==='drvo'||String(saved?.id||'').startsWith('drvo_')||saved?.data?.firewood==='1')&&saved?.data?.basketWoodLog!=='1')return null;
 // Migrate old scene objects into the independent overlay; never restore them
 // into gameplay items. The old vis factor must NOT shrink the UI art.
 if(BUILTIN_UI_ELEMENT_IDS.has(saved?.id)){
  const def=BUILTIN_UI_ELEMENT_DEFS.find(x=>x.id===saved.id);
  const legacyInstanceId=saved.instanceId||`legacy_${saved.id}_${saved.cx}_${saved.by}`;
  if(def&&!migratedUiIds.has(legacyInstanceId)&&!importedElements.some(x=>x.legacyInstanceId===legacyInstanceId)){
   placeUiElement(def,{x:Number.isFinite(+saved.cx)?+saved.cx:BASE_W/2,y:Number.isFinite(+saved.by)?+saved.by:BASE_H/2+def.h/2,w:+saved.baseW||def.w,h:+saved.baseH||def.h,angle:+saved.angle||0,legacyInstanceId});
   migratedUiIds.add(legacyInstanceId);
   try{localStorage.setItem('cookster.ui-overlay-migrated.v2',JSON.stringify([...migratedUiIds]));}catch(_){}
  }
  return null;
 }
 let el=saved.instanceId?items.find(x=>x.dataset.instanceId===saved.instanceId):null;
 if(!el&&!saved.instanceId)el=items.find(x=>x.dataset.itemId===saved.id);
 if(!el){
   const x=(saved.cx||0)-(saved.baseW||60)/2,y=(saved.by||0)-(saved.baseH||60);
    const imported=importedElements.find(record=>record.id===saved.id);
    el=makeItem({id:saved.id,instanceId:saved.instanceId||nextItemInstanceId(saved.id||'item'),label:saved.label||saved.id,src:imported?.src||saved.src,x,y,w:saved.baseW||60,h:saved.baseH||60,z:saved.zBase||++zCounter,angle:saved.angle||0,tilt:clampItemTilt(saved.tilt||0),shadowProfile:saved.shadowProfile||'',snapProfile:saved.snapProfile||''});
 }
 if(saved.calibrationCopy)el.dataset.calibrationCopy='1';
 if(saved.calibrationTemplate)el.dataset.calibrationTemplate=String(saved.calibrationTemplate);
 Object.entries(saved.data||{}).forEach(([k,v])=>el.dataset[k]=String(v));
  if(el.dataset.itemId==='kaca_prazna'&&window.CooksterKaca)CooksterKaca.refresh(el);
  if(isAjvarJar(el))renderAjvarJar(el);
  if(isAjvarLadle(el))renderAjvarLadle(el);
  if(isWoodBasket(el)){
    el.dataset.woodBasket='1';
    if(el.dataset.woodRemaining==null)el.dataset.woodRemaining=String(WOOD_BASKET_MAX_LOGS);
    renderWoodBasket(el);
  }
 if(isPaprikaSteamBag(el))renderPaprikaSteamBag(el);
 if(el.dataset.steamedPepper==='1'||(isWholePatlidzan(el)&&el.dataset.peeled==='1'))renderPaprikaPeelState(el);
 if(el.dataset.creatorShelfSlot)delete el.dataset.creatorShelfSlot;
 if(!el.dataset.collisionProfile){
   if(el.dataset.crate==='1')el.dataset.collisionProfile='crate';
   else if(el.dataset.vegetable==='1')el.dataset.collisionProfile='vegetable';
   else if(el.dataset.detachedLid==='1')el.dataset.collisionProfile='detachedLid';
 }
 el.dataset.angle=String(saved.angle||0);
 el.dataset.tilt=String(itemTiltValue(el,saved.tilt||0));
 setPose(el,+saved.cx||0,+saved.by||0,+saved.vis||1);

 // v198.1: old v198 saves remember the burner id but their snap Y was lower.
 // Re-seat only vessels that already own a burner; freely parked cookware stays
 // exactly where the player left it.
 if(el.dataset.surfaceZone==='stove'&&isHeatableCookwareItem(el)&&window.CooksterStoveZones){
   const zone=CooksterStoveZones.get(el.dataset.stoveZone)||CooksterStoveZones.migrate(el);
   if(zone){
     const vis=+el.dataset.vis||1;
     const cand={
       zone:'stove',cx:+el.dataset.cx||0,by:+el.dataset.by||0,vis,
       w:(+el.dataset.baseW||80)*vis,h:(+el.dataset.baseH||80)*vis,
       inSurface:true
     };
     const reseated=CooksterStoveZones.snapToZone(cand,el,zone.id);
     if(reseated)setPose(el,reseated.cx,reseated.by,reseated.vis||vis);
   }
 }

 if(el.dataset.crate==='1'){
   el.classList.add('produce-crate');
   if(!el._crateFill){const fill=document.createElement('div');fill.className='crate-fill';el.appendChild(fill);el._crateFill=fill;}
   renderCrateFill(el);
 }
 if(el.dataset.marketBag==='1'){
   el.classList.add('market-bag-item');
   if(!el.dataset.collisionProfile||el.dataset.collisionProfile==='marketBag')el.dataset.collisionProfile='flat';
   renderMarketBag(el);
 }
 if(isPanItem(el)){CooksterPan.write(el,CooksterPan.read(el));ensureCookingEffects(el);renderPanTomatoes(el);updateCookingStatus(el);}
 if(isContainerItem(el)&&!isPanItem(el)){
   el.dataset.container='1';applyVesselVisualPreset(el);ensureVesselContent(el);
   if(!['serpa_plava','vangla_mala'].includes(el.dataset.itemId))ensureVesselFrontMask(el,el.querySelector('.body')?.getAttribute('src')||'');
   if(isHeatableCookwareItem(el)){CooksterPan.write(el,CooksterPan.read(el));ensureCookingEffects(el);}
   renderVesselContents(el);
   if(isHeatableCookwareItem(el))updateCookingStatus(el);
 }
 if(isWholeStoveRoast(el)&&(el.dataset.onStoveTop==='1'||(+el.dataset.roastProgress||0)>0))renderPaprikaRoast(el);
 if(isProduceItem(el)&&!isWholeStoveRoast(el)&&(+el.dataset.directHeatProgress||0)>0)renderDirectProduceHeat(el);
 return el;
}

function backpackItemRecord(item){
 if(!item?.dataset)return null;
 const body=item.querySelector('.body')||item.querySelector('img');
 const src=body?.getAttribute('src')||'';
 if(!src)return null;
 return{
  itemId:item.dataset.itemId||'',
  label:item.dataset.label||item.dataset.itemId||'Predmet',
  src,
  iconScale:Math.max(.05,Math.min(1,+item.dataset.backpackIconScale||1))
 };
}
function syncBackpackUi(){
 const records=backpackContents.map((item,index)=>
  backpackPendingStore.has(index)?null:backpackItemRecord(item)
 );
 window.__COOKSTER_BOTTOM_BUTTONS__?.setBackpackItems?.(records);
}
function backpackButtonAt(index){
 return window.__COOKSTER_BOTTOM_BUTTONS__?.buttons?.find(button=>
  button.dataset.group==='right'&&+button.dataset.slot===index+1
 )||null;
}
function backpackSlotNearPointer(clientX,clientY){
 if(!Number.isFinite(clientX)||!Number.isFinite(clientY))return null;
 const candidates=[];
 for(const button of window.__COOKSTER_BOTTOM_BUTTONS__?.buttons||[]){
  if(button.dataset.group!=='right')continue;
  const rect=button.getBoundingClientRect();
  const padX=Math.max(5,Math.min(12,rect.width*.14));
  const padY=Math.max(5,Math.min(12,rect.height*.14));
  if(clientX<rect.left-padX||clientX>rect.right+padX||
    clientY<rect.top-padY||clientY>rect.bottom+padY)continue;
  const dx=clientX-(rect.left+rect.width/2),dy=clientY-(rect.top+rect.height/2);
  candidates.push({button,index:+button.dataset.slot-1,distance:dx*dx+dy*dy});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 return candidates[0]||null;
}
function hideBackpackHeldPreview(){
 if(backpackHeldPreview){
  backpackHeldPreview.remove();
  backpackHeldPreview=null;
 }
}
function syncBackpackHeldPreview(source=placementGhost){
 if(!holding||!source||!source.isConnected||getComputedStyle(source).display==='none'){
  hideBackpackHeldPreview();
  return null;
 }
 const key=source._key||'';
 if(!backpackHeldPreview||backpackHeldPreview.dataset.sourceKey!==key){
  hideBackpackHeldPreview();
  backpackHeldPreview=source.cloneNode(true);
  copyCanvasContents(source,backpackHeldPreview);
  backpackHeldPreview.removeAttribute('id');
  backpackHeldPreview.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  backpackHeldPreview.dataset.sourceKey=key;
  backpackHeldPreview.dataset.backpackHeldPreview='true';
  backpackHeldPreview.setAttribute('aria-hidden','true');
  document.body.appendChild(backpackHeldPreview);
 }
 const preview=backpackHeldPreview;
 preview.className=`${source.className} cookster-backpack-held-preview`;
 const sceneRect=scene.getBoundingClientRect();
 const left=sceneRect.left+(Number.isFinite(source.offsetLeft)?source.offsetLeft:0)*scale;
 const top=sceneRect.top+(Number.isFinite(source.offsetTop)?source.offsetTop:0)*scale;
 const width=parseFloat(source.style.width)||source.offsetWidth||1;
 const height=parseFloat(source.style.height)||source.offsetHeight||1;
 const sourceTransform=getComputedStyle(source).transform;
 const overlayTransform=`scale(${scale})${sourceTransform&&sourceTransform!=='none'?' '+sourceTransform:''}`;
 preview.style.setProperty('position','fixed','important');
 preview.style.setProperty('left',`${left}px`,'important');
 preview.style.setProperty('top',`${top}px`,'important');
 preview.style.setProperty('width',`${width}px`,'important');
 preview.style.setProperty('height',`${height}px`,'important');
 preview.style.setProperty('z-index','2147483647','important');
 preview.style.setProperty('display','block','important');
 preview.style.setProperty('visibility','visible','important');
 preview.style.setProperty('opacity','1','important');
 preview.style.setProperty('pointer-events','none','important');
 preview.style.setProperty('transform-origin',getComputedStyle(source).transformOrigin,'important');
 preview.style.setProperty('transform',overlayTransform,'important');
 preview.style.setProperty('transition','none','important');
 preview.style.setProperty('overflow','visible','important');
 const sourceRect=source.getBoundingClientRect();
 const previewRect=preview.getBoundingClientRect();
 preview.style.setProperty('left',`${left+sourceRect.left-previewRect.left}px`,'important');
 preview.style.setProperty('top',`${top+sourceRect.top-previewRect.top}px`,'important');
 return preview;
}
function updateBackpackDropTarget(clientX=mouse.x,clientY=mouse.y){
 const target=holding&&!placing&&!picking&&!pouring&&!oilPouring
  ?backpackSlotNearPointer(clientX,clientY):null;
 for(const button of window.__COOKSTER_BOTTOM_BUTTONS__?.buttons||[]){
  if(button.dataset.group!=='right')continue;
  const index=+button.dataset.slot-1;
  const isTarget=target?.button===button;
  button.classList.toggle('is-backpack-drop-target',isTarget&&!backpackContents[index]
   &&!backpackBusySlots.has(index));
  button.classList.toggle('is-backpack-target-full',isTarget&&!!backpackContents[index]);
 }
 return target;
}
function backpackAspectRect(box,aspect){
 const safeAspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
 const width=Math.max(1,Math.min(box.width,box.height*safeAspect));
 const height=width/safeAspect;
 const cx=box.left+box.width/2,cy=box.top+box.height/2;
 return{left:cx-width/2,top:cy-height/2,width,height};
}
function animateBackpackTransfer(item,button,direction,event,onFinish){
 const buttonRect=button?.getBoundingClientRect?.();
 if(!item||!buttonRect){onFinish?.();return;}
 const iconRect=button.querySelector('.cookster-inventory-icon')?.getBoundingClientRect?.();
 const apertureRect=iconRect?.width>0&&iconRect?.height>0?iconRect:{
  left:buttonRect.left+buttonRect.width*.11,
  top:buttonRect.top+buttonRect.height*.11,
  width:buttonRect.width*.78,
  height:buttonRect.height*.78
 };
 const ghostRect=direction==='store'&&placementGhost&&placementGhost.isConnected
  &&getComputedStyle(placementGhost).display!=='none'
  ?placementGhost.getBoundingClientRect():null;
 const heldPreviewRect=direction==='store'&&backpackHeldPreview?.isConnected
  ?backpackHeldPreview.getBoundingClientRect():null;
 const candidate=direction==='store'
  ?(heldPreviewRect?.width>0&&heldPreviewRect?.height>0
    ?heldPreviewRect:(ghostRect?.width>0&&ghostRect?.height>0?ghostRect:buttonRect))
  :(iconRect?.width>0&&iconRect?.height>0?iconRect:buttonRect);
 const aspectWidth=Math.max(1,+item.dataset.baseW||item.offsetWidth||80);
 const aspectHeight=Math.max(1,+item.dataset.baseH||item.offsetHeight||80);
 const itemAspect=aspectWidth/aspectHeight;
 const body=item.querySelector('.body');
 const bodyAspect=body?.naturalWidth>0&&body?.naturalHeight>0
  ?body.naturalWidth/body.naturalHeight:itemAspect;
 const from=backpackAspectRect(candidate,direction==='take'?bodyAspect:itemAspect);
 const sceneRect=scene.getBoundingClientRect();
 const itemVis=Math.max(.12,+item.dataset.vis||1);
 const targetW=Math.max(buttonRect.width,Math.min(innerWidth*.82,
  Math.max(36,(+item.dataset.baseW||80)*itemVis*sceneRect.width/BASE_W)));
 const targetH=Math.max(buttonRect.height,Math.min(innerHeight*.76,
  Math.max(36,(+item.dataset.baseH||80)*itemVis*sceneRect.height/BASE_H)));
 let targetContent;
 if(direction==='store'){
    targetContent=backpackAspectRect(apertureRect,bodyAspect);
 }else{
   const candidatePose=placementCandidate(item);
   if(candidatePose&&candidatePose.inSurface!==false&&Number.isFinite(candidatePose.cx)
     &&Number.isFinite(candidatePose.by)&&candidatePose.w>0&&candidatePose.h>0){
    const scaleX=sceneRect.width/BASE_W,scaleY=sceneRect.height/BASE_H;
    const worldRect={
     left:sceneRect.left+(candidatePose.cx-candidatePose.w/2)*scaleX,
     top:sceneRect.top+(candidatePose.by-candidatePose.h)*scaleY,
     width:candidatePose.w*scaleX,height:candidatePose.h*scaleY
    };
    targetContent=backpackAspectRect(worldRect,bodyAspect);
   }else{
    const cx=Number.isFinite(event?.clientX)?event.clientX:buttonRect.left+buttonRect.width/2;
    const cy=Number.isFinite(event?.clientY)?event.clientY:buttonRect.top+buttonRect.height/2;
    const targetCenterY=cy-Math.min(28,targetH*.12);
    targetContent=backpackAspectRect({left:cx-targetW/2,top:targetCenterY-targetH/2,
     width:targetW,height:targetH},bodyAspect);
   }
 }
 const flyer=item.cloneNode(true);
 copyCanvasContents(item,flyer);
 flyer.classList.remove('held','hovered','valid','invalid','pour-target-ready',
  'pour-target-blocked','pouring-source','pouring-receiver','stir-ready-target','stirring-vessel');
 flyer.classList.add('cookster-backpack-flight');
  const aperture=document.createElement('div');
  aperture.className='cookster-backpack-aperture';
  aperture.setAttribute('aria-hidden','true');
  Object.assign(aperture.style,{
   position:'fixed',left:apertureRect.left+'px',top:apertureRect.top+'px',
   width:apertureRect.width+'px',height:apertureRect.height+'px',
   overflow:'hidden',pointerEvents:'none',zIndex:'2147483647',contain:'paint'
  });
  flyer.style.setProperty('position','absolute','important');
  flyer.style.setProperty('left',(from.left-apertureRect.left)+'px','important');
  flyer.style.setProperty('top',(from.top-apertureRect.top)+'px','important');
 flyer.style.setProperty('width',from.width+'px','important');
 flyer.style.setProperty('height',from.height+'px','important');
 flyer.style.setProperty('z-index','2147483647','important');
 flyer.style.setProperty('visibility','visible','important');
 flyer.style.setProperty('display','block','important');
 flyer.style.setProperty('opacity','1','important');
 flyer.style.setProperty('pointer-events','none','important');
 flyer.dataset.backpackTransferDirection=direction;
 flyer.style.transform='none';
 flyer.style.transformOrigin='0 0';
 flyer.style.setProperty('transition','none','important');
 flyer.style.setProperty('margin','0','important');
 flyer.style.setProperty('overflow','visible','important');
  document.body.appendChild(aperture);
  aperture.appendChild(flyer);
   const sourceContent=backpackAspectRect(from,bodyAspect);
   const requestedScale=Math.min(targetContent.width/Math.max(1,sourceContent.width),
    targetContent.height/Math.max(1,sourceContent.height));
   const uniformScale=direction==='store'?Math.min(1,requestedScale):Math.max(1,requestedScale);
   if(direction==='store'){
    const fittedScale=Math.max(.05,Math.min(1,
     sourceContent.width*uniformScale/Math.max(1,targetContent.width)));
    item.dataset.backpackIconScale=String(fittedScale);
   }
   const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:100;
   const finalWidth=from.width*uniformScale,finalHeight=from.height*uniformScale;
   const targetLeft=targetContent.left+targetContent.width/2-finalWidth/2;
   const targetTop=targetContent.top+targetContent.height/2-finalHeight/2;
   const dx=targetLeft-from.left,dy=targetTop-from.top;
   const apertureShiftX=direction==='take'?targetContent.left-apertureRect.left:0;
   const apertureShiftY=direction==='take'?targetContent.top-apertureRect.top:0;
   const flightTransformAt=progress=>{
    const moveScale=1+(uniformScale-1)*progress;
    const moveX=(dx-apertureShiftX)*progress;
    const moveY=(dy-apertureShiftY)*progress;
    return`translate3d(${moveX}px,${moveY}px,0) scale(${moveScale},${moveScale})`;
   };
  const keyframes=[
   {transform:'translate3d(0px,0px,0px) scale(1,1)',opacity:1,offset:0},
   {transform:flightTransformAt(1),opacity:1,offset:1}
  ];
 let finished=false;
  const finish=()=>{
  if(finished)return;
  finished=true;
   if(direction==='take'){
    const endRect=flyer.getBoundingClientRect();
    flyer.getAnimations?.().forEach(animation=>animation.cancel());
    aperture.remove();
    flyer.classList.remove('cookster-backpack-flight');
    flyer.classList.add('ghost-item-copy');
    Object.assign(flyer.style,{
     position:'absolute',left:'0',top:'0',width:'100%',height:'100%',
     zIndex:'1',visibility:'visible',display:'block',opacity:'1',
     pointerEvents:'none',transform:'none',transformOrigin:'50% 90%',
     transition:'none',margin:'0'
    });
    const preview=document.createElement('div');
    preview.className='placement-ghost cookster-backpack-held-preview';
    preview.dataset.backpackHeldPreview='true';
    preview.dataset.sourceKey=ghostKeyFor(item);
    preview.setAttribute('aria-hidden','true');
    Object.assign(preview.style,{
     position:'fixed',left:endRect.left+'px',top:endRect.top+'px',
     width:endRect.width+'px',height:endRect.height+'px',zIndex:'2147483647',
     visibility:'visible',display:'block',opacity:'1',pointerEvents:'none',
     transform:'none',transformOrigin:'50% 90%',transition:'none',margin:'0'
    });
    preview.appendChild(flyer);
    document.body.appendChild(preview);
    backpackHeldPreview=preview;
   }else{
    flyer.remove();
    aperture.remove();
   }
   onFinish?.(flyer);
 };
 try{
   const animation=flyer.animate(keyframes,{
     duration,delay:0,easing:'linear',fill:'forwards'
   });
   if(direction==='take'){
    aperture.animate([
     {left:apertureRect.left+'px',top:apertureRect.top+'px',
      width:apertureRect.width+'px',height:apertureRect.height+'px',offset:0},
     {left:targetContent.left+'px',top:targetContent.top+'px',
      width:targetContent.width+'px',height:targetContent.height+'px',offset:1}
    ],{duration,delay:0,easing:'linear',fill:'forwards'});
   }
  animation.onfinish=finish;
  animation.oncancel=finish;
  setTimeout(finish,duration+160);
 }catch(_){
  setTimeout(finish,duration);
 }
}
function detachItemIntoBackpack(item,index){
 backpackContents[index]=item;
 if(holding===item){
  if(stirring)endStirring();
  if(cleaning)endCleaning();
  if(panWashing)endPanWashing();
  if(oilPouring)endOilPour();
  holding=null;
  heldGrabState=null;
  clearHeldPlacementState(item);
  hidePlacementGhost();hideOriginGhost();
  clearPourTarget();
 }
 item.classList.remove('held','hovered','valid','invalid');
 item.style.removeProperty('--held-z');
 item.style.visibility='';
 delete item.dataset.held;
 if(item.dataset.quickTool==='1')quickWheelLastToolId=item.dataset.itemId||quickWheelLastToolId;
 removeItem(item);
 updateBackpackDropTarget();
 updateHover();
}
function restoreBackpackItemToScene(item){
 if(!item)return false;
 item.classList.remove('held','hovered','valid','invalid');
 item.style.removeProperty('--held-z');
 item.style.visibility='';
 delete item.dataset.held;
 if(item.dataset.preHeldTransformOrigin!==undefined){
  item.style.transformOrigin=item.dataset.preHeldTransformOrigin;
  delete item.dataset.preHeldTransformOrigin;
 }
 if(item._contactShadow){
  item._contactShadow.style.display='';
  item._contactShadow.style.visibility='';
  item._contactShadow.style.opacity='';
  if(item._contactShadow.parentNode!==scene)scene.appendChild(item._contactShadow);
 }
 if(item.parentNode!==scene)scene.appendChild(item);
 if(!items.includes(item))items.push(item);
 if(item.dataset.fixedGrinder==='1')ensureGrinderFrontOcclusionMask(item);
 if(isPanItem(item)){
  ensureCookingEffects(item);renderPanTomatoes(item);updateCookingStatus(item);
 }
 if(item.dataset.itemId==='daska'){
  syncBoardAttachments(item);ensureKnifeAlwaysOnBoard(item);
 }
 return true;
}
function storeHeldItemInBackpack(index,button,event){
 if(!Number.isInteger(index)||index<0||index>=BACKPACK_SLOT_COUNT||!holding)return false;
 if(backpackContents[index]){showToast('To polje ranca je već zauzeto.');return true;}
 if(placing||picking||pouring||oilPouring){showToast('Sačekaj da se trenutna radnja završi.');return true;}
 const item=holding,record=backpackItemRecord(item);
 if(!record){showToast('Ovaj predmet trenutno ne može da se spakuje.');return true;}
 const targetButton=button||backpackButtonAt(index);
 playImpactSound(item,'drop');
 backpackBusySlots.add(index);
 backpackPendingStore.add(index);
 backpackContents[index]=item;
 syncBackpackUi();
 animateBackpackTransfer(item,targetButton,'store',event,()=>{
  backpackPendingStore.delete(index);
  backpackBusySlots.delete(index);
  syncBackpackUi();
 });
 detachItemIntoBackpack(item,index);
 CooksterSave.schedule();
 showToast(`${record.label} je spakovan u ranac.`);
 return true;
}
function takeBackpackItem(index,button,event){
 if(!Number.isInteger(index)||index<0||index>=BACKPACK_SLOT_COUNT)return false;
 const item=backpackContents[index];
 if(!item)return true;
 const targetButton=button||backpackButtonAt(index);
 backpackBusySlots.add(index);
 targetButton?.classList.add('is-backpack-pulling');
 animateBackpackTransfer(item,targetButton,'take',event,()=>{
  backpackBusySlots.delete(index);
  targetButton?.classList.remove('is-backpack-pulling');
  syncBackpackUi();
  restoreBackpackItemToScene(item);
  if(item.dataset.quickTool==='1')startHoldingQuickToolDirect(item);
  else startHolding(item);
  updateHover();
  CooksterSave.schedule();
 });
 backpackContents[index]=null;
 syncBackpackUi();
 return true;
}
function activateBackpackSlot(index,button,event){
 if(!Number.isInteger(index)||index<0||index>=BACKPACK_SLOT_COUNT)return false;
 if(backpackBusySlots.has(index))return true;
 if(Number.isFinite(event?.clientX)){mouse.x=event.clientX;mouse.y=event.clientY;}
 if(holding)return storeHeldItemInBackpack(index,button,event);
 return takeBackpackItem(index,button,event);
}
function dropHeldItemAtBackpack(clientX,clientY,event){
 if(!holding)return false;
 const target=backpackSlotNearPointer(clientX,clientY);
 if(!target)return false;
 if(backpackBusySlots.has(target.index))return true;
 return storeHeldItemInBackpack(target.index,target.button,event);
}
window.CooksterBackpackController={
 slotCount:BACKPACK_SLOT_COUNT,
 activateSlot:activateBackpackSlot,
 updateDropTarget:updateBackpackDropTarget,
 dropHeldItemAt:dropHeldItemAtBackpack,
 refreshUi:syncBackpackUi,
 getSlots:()=>backpackContents.map(backpackItemRecord),
 getStoredCount:()=>backpackContents.filter(Boolean).length,
 hasHeldItem:()=>!!holding
};

window.CooksterWorld={
 snapshot(){return {version:4,items:items.map(serializeWorldItem),
  backpack:backpackContents.map(item=>item?serializeWorldItem(item):null)};},
 restore(world){
   if(!world||!Array.isArray(world.items))return false;
   (world.items||[]).forEach(restoreWorldItem);
   if(Array.isArray(world.backpack)){
    world.backpack.slice(0,BACKPACK_SLOT_COUNT).forEach((saved,index)=>{
     if(!saved)return;
     const item=restoreWorldItem(saved);
     if(!item)return;
     backpackContents[index]=item;
     item.classList.remove('held','hovered','valid','invalid');
     item.style.removeProperty('--held-z');
     item.style.visibility='';
     delete item.dataset.held;
     removeItem(item);
    });
   }
   syncBackpackUi();
   const board=getBoardEl();if(board){syncBoardAttachments(board);if(!isCutting)ensureKnifeAlwaysOnBoard(board);}   // the knife always lies on the board, also right after loading a save
   return true;
 },
 exportHeldCrateToGarden(){
   if(!holding||holding.dataset.crate!=='1')return null;
   const crate=holding;
   const data={
     id:crate.dataset.itemId||`crate_transfer_${Date.now()}`,
     crop:crate.dataset.vegKey||null,
     count:Math.max(0,Math.min(10,+crate.dataset.count||0))
   };
   holding=null;
   clearHeldPlacementState(crate);hidePlacementGhost();hideOriginGhost();clearPanTargets();
   removeItem(crate);updateHover();
   return data;
 },
 importGardenCrate(data){
   if(!data||typeof data!=='object')return null;
   const count=Math.max(0,Math.min(10,+data.count||0));
   const crop=VEGETABLES[data.crop]?data.crop:'';
   const crate=makeProduceCrate(crop,count,{id:data.id||undefined,animate:false});
   if(crate){
     startHolding(crate);
     showToast('Gajbica je doneta iz bašte u kuhinju — držiš je u ruci.');
   }
   return crate;
 }
};

function removeItem(el){if(el?._panStatus?.classList?.contains('cookster-cooking-hud')){el._panStatus.remove();el._panStatus=null;}if(el?._grinderFrontOcclusion){el._grinderFrontOcclusion.remove();el._grinderFrontOcclusion=null;el._grinderFrontOcclusionBody=null;el._grinderFrontOcclusionHandle=null;el._grinderFrontOcclusionHub=null;el._grinderFrontOcclusionImg=null;el._grinderFrontOcclusionZone=null;}if(!el)return;if(el._contactShadow?.parentNode)el._contactShadow.remove();if(el.parentNode)el.remove();items=items.filter(x=>x!==el);CooksterSave.schedule()}




function isQuickToolItem(el){return !!el&&el.dataset.quickTool==='1'}
function quickToolSlotDef(id){return QUICK_TOOL_SLOTS.find(s=>s.id===id)||null}
function quickToolItemDef(id){
 if(id==='metla')return {id:'metla',type:'tool',subtype:'mop',label:'metla',src:'assets/ui/metla.png',x:1180,y:330,w:88,h:190,snapProfile:'flat',shadowProfile:'tiny',placement:['table','floor']};
 const def=itemsData.find(d=>d.id===id)||null;
 return def?{...def}:null;
}
function findLooseQuickToolInstance(id){
 for(const el of items){
  if((el?.dataset?.itemId||'')!==id)continue;
  if(el===holding&&el.dataset.quickTool==='1')return el;
  if(el.dataset.quickTool==='1')return el;
 }
 return null;
}

function cleanupQuickToolSceneClutter(){
 items.slice().forEach(el=>{
  const id=el?.dataset?.itemId||'';

  // Knife is now a permanent board tool, never disposable quick-wheel clutter.
  if(id==='noz')return;

  if(!['sundjer','metla'].includes(id))return;
  if(el===holding&&el.dataset.quickTool==='1')return;
  if(el.dataset.quickTool==='1'&&(el.dataset.surfaceZone==='held'||el.dataset.held==='1'))return;
  removeItem(el);
 });
}

function renderQuickToolWheel(){
 const wheel=document.getElementById('quickToolWheel');
 if(!wheel||wheel.dataset.ready==='1')return;
 wheel.querySelectorAll('[data-wheel-tool]').forEach(btn=>{
   btn.addEventListener('mouseenter',()=>setQuickToolWheelActive(btn.dataset.wheelTool||null));
 });
 wheel.dataset.ready='1';
}
function setQuickToolWheelActive(toolId){
 quickWheelActiveId=toolId||null;
 const wheel=document.getElementById('quickToolWheel');
 if(!wheel)return;
 wheel.querySelectorAll('[data-wheel-tool]').forEach(el=>el.classList.toggle('active',el.dataset.wheelTool===quickWheelActiveId));
}
function updateQuickToolWheelHover(x,y){
 if(!quickWheelOpen)return;
 const hit=document.elementFromPoint(x,y)?.closest?.('#quickToolWheel [data-wheel-tool]');
 setQuickToolWheelActive(hit?.dataset?.wheelTool||null);
}
function openQuickToolWheel(x,y){
 cleanupQuickToolSceneClutter();
 const wheel=document.getElementById('quickToolWheel');
 if(!wheel)return false;
 renderQuickToolWheel();
 const size=Math.min(520,Math.max(300,Math.min(innerWidth,innerHeight)*.72));
 const pad=size*.52;
 const px=Math.max(pad,Math.min(innerWidth-pad,x));
 const py=Math.max(pad,Math.min(innerHeight-pad,y));
 quickWheelCenter={x:px,y:py};
 quickWheelOpen=true;
 wheel.style.left=px+'px';
 wheel.style.top=py+'px';
 wheel.hidden=false;
 wheel.setAttribute('aria-hidden','false');
 wheel.classList.remove('open','opening','closing','select-pulse');
 void wheel.offsetWidth;
 wheel.classList.add('opening');
 document.body.classList.add('quick-tool-wheel-open');
 setQuickToolWheelActive(null);
 if(quickWheelOpenTimeout){clearTimeout(quickWheelOpenTimeout);quickWheelOpenTimeout=0;}
 quickWheelOpenTimeout=setTimeout(()=>{
   if(!quickWheelOpen||wheel.classList.contains('closing'))return;
   wheel.classList.remove('opening');
   wheel.classList.add('open');
   quickWheelOpenTimeout=0;
 },430);
 return true;
}
function finishQuickToolWheelClose(){
 const wheel=document.getElementById('quickToolWheel');
 if(!wheel)return;
 if(quickWheelOpenTimeout){clearTimeout(quickWheelOpenTimeout);quickWheelOpenTimeout=0;}
 quickWheelOpen=false;
 wheel.classList.remove('open','opening','closing','select-pulse');
 wheel.hidden=true;
 wheel.setAttribute('aria-hidden','true');
 document.body.classList.remove('quick-tool-wheel-open');
 setQuickToolWheelActive(null);
}
function closeQuickToolWheel(selected=false){
 const wheel=document.getElementById('quickToolWheel');
 if(!wheel||!quickWheelOpen)return;
 if(quickWheelOpenTimeout){clearTimeout(quickWheelOpenTimeout);quickWheelOpenTimeout=0;}
 if(selected){
   wheel.classList.add('select-pulse');
   setTimeout(()=>{
     wheel.classList.remove('open','opening','select-pulse');
     wheel.classList.add('closing');
     setTimeout(finishQuickToolWheelClose,120);
   },85);
 }else{
   wheel.classList.remove('open','opening');
   wheel.classList.add('closing');
   setTimeout(finishQuickToolWheelClose,120);
 }
}
function selectQuickToolWheelSlot(id){
 if(!id||id.startsWith('locked_'))return false;
 if(id==='rakija'||id==='opanci')return false;

 const wheel=document.getElementById('quickToolWheel');
 const slot=wheel?.querySelector(`[data-wheel-tool="${id}"]`)||null;
 setQuickToolWheelActive(id);

 if(id==='hand'){
  stowCurrentQuickTool();
  closeQuickToolWheel(true);
  return true;
 }

 if(holding&&isQuickToolItem(holding)&&(holding.dataset.itemId||'')===id){
  closeQuickToolWheel(true);
  return true;
 }

 const heldEl=prepareQuickToolInHand(id);
 if(!heldEl)return false;

 const animated=slot&&spawnQuickToolFlyerFromSlot(slot,id,heldEl);
 if(!animated)revealPreparedQuickTool(heldEl);

 closeQuickToolWheel(true);
 return true;
}
function stowCurrentQuickTool(){
 if(!holding||!isQuickToolItem(holding))return false;
 if(stirring)endStirring();
 if(cleaning)endCleaning();
 if(panWashing)endPanWashing();
 quickWheelLastToolId=holding.dataset.itemId||quickWheelLastToolId;
 removeItem(holding);
 holding=null;
 hidePlacementGhost();
 hideOriginGhost();
 clearPourTarget();
 updateHover();
 return true;
}

function startHoldingQuickToolDirect(el,{deferReveal=false}={}){
 if(!el||placing||pouring)return false;
 clearPourTarget();
 clearStirReady();

 holding=el;
 playImpactSound(el,'pickup');
 picking=false;
 clearHover();
 hidePlacementGhost();
 hideOriginGhost();

 el.dataset.quickTool='1';
 el.dataset.surfaceZone='held';
 el.dataset.held='1';
 delete el.dataset.attachedToBoard;
 delete el.dataset.boardRelX;
 delete el.dataset.boardRelY;
 delete el.dataset.boardRelAngle;

 el.dataset.preHeldTransformOrigin=el.style.transformOrigin||'';
 el.classList.add('held');
 el.style.setProperty('--held-z','9999');
 if(el._contactShadow){el._contactShadow.style.visibility='';}

 const preview=heldPreviewPoseFor(el);
 const baseAngle=+(el.dataset.angle||0);
 const carryAngle=preview.carryAngle||0;

 el.style.transition='none';
 el.style.visibility='hidden';
 setPose(el,preview.cx,preview.by,preview.vis);
 el.style.transformOrigin='50% 50%';
 el.style.transform=`perspective(1200px) rotateX(${itemTiltValue(el,el.dataset.tilt||0)*.45}deg) rotateZ(${baseAngle+carryAngle}deg)`;
 el.style.zIndex='9999';

 if(!deferReveal){
  requestAnimationFrame(()=>{
   if(holding===el){
    el.style.visibility='';
    
    if(el._contactShadow)el._contactShadow.style.visibility='';
    updatePlacementGhost();
    updateHover();
   }
  });
 }
 return true;
}


function prepareQuickToolInHand(id){
 if(id==='noz')return null;
 const slot=quickToolSlotDef(id);
 if(!slot||slot.enabled!==true)return null;
 if(holding&&!isQuickToolItem(holding))return null;

 if(holding&&isQuickToolItem(holding)){
  if((holding.dataset.itemId||'')===id)return holding;
  stowCurrentQuickTool();
 }

 let el=findLooseQuickToolInstance(id);
 if(!el){
  const def=quickToolItemDef(id);
  if(!def)return null;
  el=makeItem(def);
 }
 el.dataset.quickTool='1';
 if(!startHoldingQuickToolDirect(el,{deferReveal:true}))return null;
 return el;
}
function revealPreparedQuickTool(el){
 if(!el||holding!==el)return false;
 el.style.transition='none';
 el.style.visibility='';
 
 if(el._contactShadow)el._contactShadow.style.visibility='';
 updatePlacementGhost();
 updateHover();
 return true;
}
function getQuickToolFlyAsset(id){
 if(id==='noz')return 'assets/noz.png';
 if(id==='sundjer')return 'assets/new_props/sundjer.svg';
 if(id==='metla')return 'assets/ui/metla.png';
 return '';
}
function spawnQuickToolFlyerFromSlot(slotEl,id,heldEl){
 const src=getQuickToolFlyAsset(id);
 if(!src||!slotEl||!heldEl)return false;

 const sourceRect=slotEl.getBoundingClientRect();
 const targetRect=heldEl.getBoundingClientRect();
 if(!targetRect.width||!targetRect.height)return false;

 const startX=sourceRect.left+sourceRect.width/2;
 const startY=sourceRect.top+sourceRect.height/2;
 const targetX=targetRect.left+targetRect.width/2;
 const targetY=targetRect.top+targetRect.height/2;
 const targetRot=heldCarryAngleFor(heldEl)||0;

 const flyer=document.createElement('div');
 flyer.className=id==='sundjer'?'quick-tool-flyer-sponge':'quick-tool-flyer-clean';
 flyer.style.left=startX+'px';
 flyer.style.top=startY+'px';
 flyer.style.width=Math.max(18,sourceRect.width)+'px';
 flyer.style.height=Math.max(18,sourceRect.height)+'px';
 flyer.style.setProperty('--fly-dx',(targetX-startX)+'px');
 flyer.style.setProperty('--fly-dy',(targetY-startY)+'px');
 flyer.style.setProperty('--fly-scale-x',String(targetRect.width/Math.max(18,sourceRect.width)));
 flyer.style.setProperty('--fly-scale-y',String(targetRect.height/Math.max(18,sourceRect.height)));
 flyer.style.setProperty('--fly-rot',targetRot+'deg');

 const img=document.createElement('img');
 img.src=src;
 img.alt='';
 flyer.appendChild(img);
 document.body.appendChild(flyer);

 const dur=id==='sundjer'?185:220;
 setTimeout(()=>{
  revealPreparedQuickTool(heldEl);
  if(id==='sundjer'){
   heldEl.classList.add('sponge-arrive-jiggle');
   setTimeout(()=>heldEl.classList.remove('sponge-arrive-jiggle'),150);
  }
  flyer.remove();
 },dur);
 return true;
}


function equipQuickTool(id){
 if(id==='noz')return false;
 const el=prepareQuickToolInHand(id);
 if(!el)return false;
 return revealPreparedQuickTool(el);
}
function applyQuickToolWheelSelection(){return selectQuickToolWheelSlot(quickWheelActiveId)}
function toggleQuickToolHand(){
 if(holding&&isQuickToolItem(holding))return stowCurrentQuickTool();
 if(!holding&&quickWheelLastToolId)return equipQuickTool(quickWheelLastToolId);
 return false;
}
function shouldOpenQuickToolWheel(e,it){
 return !it&&(!holding||isQuickToolItem(holding));
}

const MARKET_BAG_ASSET='assets/market_paper_bag.png';
const MARKET_PRODUCT_TO_VEG=Object.freeze({
  paradajz:'paradajz',
  krastavac:'krastavac',
  paprika_crvena:'paprika',
  paprika_zelena:'paprika_zelena',
  luk:'luk',
  beli_luk:'beli_luk',
  sargarepa:'sargarepa',
  zelena_salata:'zelena_salata',
  kupus:'kupus',
  patlidzan:'patlidzan',
  tikvice:'tikvice',
  rotkvice:'rotkvice',
  persun:'persun'
});
let marketBagSpawnCounter=0;

const MARKET_AVG_WEIGHT_G=Object.freeze({
  paradajz:125,
  krastavac:200,
  paprika_crvena:150,
  paprika_zelena:150,
  luk:100,
  beli_luk:50,
  sargarepa:100,
  zelena_salata:300,
  kupus:1000,
  patlidzan:300,
  tikvice:250,
  rotkvice:25
});
function marketBagUnitCount(productKey,quantityValue,quantityMode='kg'){
  const value=Math.max(1e-6,+quantityValue||1);

  // Peršun se prodaje po vezici, ne na kilogram.
  if(productKey==='persun'||quantityMode==='bunch'){
    return Math.max(1,Math.round(value));
  }

  // Kupus: samo cele glavice, 1 kg = 1, 2 kg = 2.
  if(productKey==='kupus'){
    return value>=2?2:1;
  }

  // Matematička procena broja komada iz prosečne težine jednog komada.
  const avgG=MARKET_AVG_WEIGHT_G[productKey]||100;
  const totalG=value*1000;
  return Math.max(1,Math.round(totalG/avgG));
}
function renderMarketBag(bag){
  if(!bag||bag.dataset.marketBag!=='1')return;
  let tag=bag.querySelector('.market-bag-tag');
  if(!tag){
    tag=document.createElement('div');
    tag.className='market-bag-tag';
    bag.appendChild(tag);
  }
  const label=bag.dataset.marketProductLabel||bag.dataset.label||'Намирница';
  const count=Math.max(0,+bag.dataset.count||0);
  const mode=bag.dataset.quantityMode||'kg';
  const value=mode==='bunch'
    ? (+bag.dataset.quantityBunches||+bag.dataset.quantityValue||1)
    : (+bag.dataset.quantityKg||+bag.dataset.quantityValue||1);
  const qtyText=mode==='bunch'
    ? `${Math.round(value)} ${Math.round(value)===1?'везица':'везице'}`
    : (value===.5?'500 г':value===1?'1 кг':value===1.5?'1,5 кг':value===2?'2 кг':`${String(value).replace('.',',')} кг`);
  let countText=`${count} ком.`;
  if(bag.dataset.marketProductKey==='kupus')countText=`${count} ${count===1?'главица':'главице'}`;
  if(bag.dataset.marketProductKey==='persun')countText=`${count} ${count===1?'везица':'везице'}`;
  const nameNode=document.createElement('strong');
  nameNode.textContent=label;
  const quantityNode=document.createElement('small');
  quantityNode.textContent=`${qtyText} · ${countText}`;
  tag.replaceChildren(nameNode,quantityNode);
  bag.classList.toggle('empty',count<=0);
}
function makeMarketBag(record,index=0){
  if(!record)return null;
  const key=String(record.productKey||'');
  const label=String(record.label||key||'Намирница');
  const mode=record.quantityMode||'kg';
  const value=mode==='bunch'
    ? Math.max(1,+record.quantityBunches||+record.quantityValue||1)
    : Math.max(.5,+record.quantityKg||+record.quantityValue||1);
  const count=Math.max(0,Number.isFinite(+record.count)?+record.count:marketBagUnitCount(key,value,mode));
  // Purchased bags live in a compact row beneath the front-left edge of the
  // work table, matching the in-game storage layout instead of occupying the
  // active cooking surface. Additional bags wrap to a second row below it.
  const cols=5;
  const col=index%cols,row=Math.floor(index/cols);
  const pos={x:160+col*118,y:590+row*92};
  const id=record.id||`market_bag_${Date.now()}_${++marketBagSpawnCounter}`;
  const el=makeItem({
    id,label:`Кеса — ${label}`,src:MARKET_BAG_ASSET,
    x:pos.x,y:pos.y,w:112,h:112,z:++zCounter,
    snapProfile:'flat',shadowProfile:'tiny'
  });
  el.classList.add('market-bag-item');
  el.dataset.marketBag='1';
  el.dataset.marketProductKey=key;
  el.dataset.marketProductLabel=label;
  el.dataset.quantityMode=mode;
  el.dataset.quantityValue=String(value);
  if(mode==='bunch'){
    el.dataset.quantityBunches=String(value);
    delete el.dataset.quantityKg;
  }else{
    el.dataset.quantityKg=String(value);
    delete el.dataset.quantityBunches;
  }
  el.dataset.count=String(count);
  const vegKey=MARKET_PRODUCT_TO_VEG[key]||(VEGETABLES[key]?key:'');
  if(vegKey)el.dataset.vegKey=vegKey;
  el.dataset.collisionProfile='flat';
  renderMarketBag(el);
  setPose(el,pos.x+56,pos.y+112,1);
  setTimeout(()=>dropBounce(el),30+index*25);
  return el;
}
function ensureBagQtyBadge(){
  if(!bagQtyBadge){
    bagQtyBadge=document.createElement('div');
    bagQtyBadge.id='bagQtyBadge';
    document.body.appendChild(bagQtyBadge);
  }
  return bagQtyBadge;
}
function updateBagQtyBadge(){
  const badge=ensureBagQtyBadge();
  if(bagPickTarget&&hoverItem===bagPickTarget){
    badge.textContent=String(bagPickQty);
    badge.style.left=mouse.x+'px';
    badge.style.top=(mouse.y-34)+'px';
    badge.style.display='flex';
  }else{
    badge.style.display='none';
  }
}
function resetBagPickIfTargetChanged(){
  if(bagPickTarget&&hoverItem!==bagPickTarget){
    bagPickTarget=null;
    bagPickQty=1;
    updateBagQtyBadge();
  }
}
function takeManyFromMarketBagToBoard(bag,qty){
  if(!bag||bag.dataset.marketBag!=='1')return false;
  const board=getBoardEl();
  if(!board){showToast('Prvo stavi dasku na sto.');return true;}
  const available=Math.max(0,+bag.dataset.count||0);
  if(available<=0){showToast('Kesa je prazna.');return true;}
  const take=Math.max(1,Math.min(Math.round(+qty||1),available));
  const vegKey=bag.dataset.vegKey||'';
  const veg=VEGETABLES[vegKey];
  if(!veg){
    showToast(`${bag.dataset.marketProductLabel||'Ova namirnica'} još nema svoj kuhinjski sprite.`);
    return true;
  }
  bag.dataset.count=String(available-take);
  renderMarketBag(bag);
  for(let i=0;i<take;i++){
    const loose=makeItem({
      id:'veg_'+vegKey+'_'+Date.now()+'_'+i,
      label:veg.label,src:veg.src,
      x:0,y:0,
      w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'
    });
    loose.dataset.vegetable='1';
    loose.dataset.collisionProfile='vegetable';
    loose.dataset.vegKey=vegKey;
    loose.dataset.cutState='whole';
    attachToBoard(loose,board,'center');
    // Spread multiple pieces left-to-right along the board instead of
    // stacking them all on the exact same spot.
    const spread=(i-(take-1)/2)*0.16;
    loose.dataset.boardRelX=String(spread);
    loose.dataset.boardRelAngle=String(Math.round(Math.random()*16-8));
    syncOneBoardAttachment(loose,board);
  }
  playSfxVariant('pickup',.18);
  showToast(`${veg.label} × ${take} — stavljeno na dasku.`);
  bagPickTarget=null;
  bagPickQty=1;
  updateBagQtyBadge();
  CooksterSave.schedule();
  return true;
}
function takeOneFromMarketBag(bag){
  if(!bag||bag.dataset.marketBag!=='1')return false;
  const count=Math.max(0,+bag.dataset.count||0);
  if(count<=0){showToast('Кеса је празна.');return true}
  const vegKey=bag.dataset.vegKey||'';
  const veg=VEGETABLES[vegKey];
  if(!veg){
    showToast(`${bag.dataset.marketProductLabel||'Ова намирница'} још нема свој кухињски sprite.`);
    return true;
  }
  bag.dataset.count=String(count-1);
  renderMarketBag(bag);
  const cx=+bag.dataset.cx||(+bag.style.left.replace('px','')+56);
  const by=+bag.dataset.by||(+bag.style.top.replace('px','')+112);
  const loose=makeItem({
    id:'veg_'+vegKey+'_'+Date.now(),
    label:veg.label,src:veg.src,
    x:cx-(veg.w/2),y:by-28-veg.h,
    w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'
  });
  loose.dataset.vegetable='1';
  loose.dataset.collisionProfile='vegetable';
  loose.dataset.vegKey=vegKey;
  loose.dataset.cutState='whole';
  setPose(loose,cx,by-28,+bag.dataset.vis||1);
  startHolding(loose);
  showToast(`${veg.label} — извађен из кесе.`);
  CooksterSave.schedule();
  return true;
}
function spawnCollectedMarketBags(records){
  const list=Array.isArray(records)?records:[];
  const made=[];
  list.forEach((record,i)=>{
    const bag=makeMarketBag(record,i);
    if(bag)made.push(bag);
  });
  if(made.length)showToast(`${made.length===1?'Кеса је':'Кесе су'} распоређене на столу.`);
  return made;
}

function renderCrateFill(crate){
 const count=Math.max(0,Math.min(10,+crate.dataset.count||0));
 const vegKey=crate.dataset.vegKey||'';
 const veg=VEGETABLES[vegKey]||null;
 updateCrateVisual(crate);
 const fill=crate._crateFill;
 if(fill)fill.innerHTML='';
 crate.classList.toggle('empty',count<=0);
 crate.dataset.label=veg
   ? ((count>0?'Gajbica — ':'Prazna gajbica — ')+veg.label)
   : 'Prazna gajbica';
}

function makeProduceCrate(vegKey='',count=10,options={}){
 const assigned=VEGETABLES[vegKey]?vegKey:'';
 const n=Math.max(0,Math.min(10,+count||0));
 if(n>0&&!assigned)return null;
 const veg=VEGETABLES[assigned]||null;
 const positions=[{x:780,y:424},{x:960,y:440},{x:1140,y:456}];
 const pos=options.position||positions[crateSpawnIndex++%positions.length];
 const id=options.id||`crate_${assigned||'empty'}_${Date.now()}_${crateSpawnIndex}`;
 const src=assigned?getCrateStageSrc(n,assigned):CRATE_STAGE_ASSETS.paradajz.empty;
 const d={id,label:veg?`Gajbica — ${veg.label}`:'Prazna gajbica',src,x:pos.x,y:pos.y,w:340,h:257,z:++zCounter,shadowProfile:'crate',snapProfile:'crate'};
 const el=makeItem(d);
 el.classList.add('produce-crate');
 el.dataset.crate='1';el.dataset.collisionProfile='crate';
 el.dataset.vegKey=assigned;
 el.dataset.count=String(n);
 setCrateZone(el,'table');
 setPose(el,+el.dataset.cx||pos.x+(d.w/2),+el.dataset.by||pos.y+d.h,+el.dataset.vis||1);
 const fill=document.createElement('div');fill.className='crate-fill';el.appendChild(fill);el._crateFill=fill;
 renderCrateFill(el);
 if(options.animate!==false)setTimeout(()=>{dropBounce(el);popArtPuff(+el.dataset.cx,+el.dataset.by,+el.dataset.vis||1);playSfxVariant('woodDrop',.35)},30);
 return el;
}

function takeOneFromCrate(crate){
 if(!crate||crate.dataset.crate!=='1')return;
 const count=+crate.dataset.count||0;
 if(count<=0){showToast('Gajbica je prazna.');return}
 const vegKey=crate.dataset.vegKey,veg=VEGETABLES[vegKey];
 if(!veg){showToast('Gajbica nema dodeljenu kulturu.');return}
 crate.dataset.count=String(count-1);renderCrateFill(crate);
 const cx=+crate.dataset.cx,by=+crate.dataset.by;
 const baseX=(cx-CENTER_OFFSET)-(veg.w/2);
 const baseY=(by-36)-veg.h;
 const loose=makeItem({id:'veg_'+vegKey+'_'+Date.now(),label:veg.label,src:veg.src,x:baseX,y:baseY,w:veg.w,h:veg.h,z:++zCounter,snapProfile:'produce'});
 loose.dataset.vegetable='1';loose.dataset.collisionProfile='vegetable';loose.dataset.vegKey=vegKey;
 loose.dataset.cutState='whole';
 setPose(loose,cx,by-28,+crate.dataset.vis||1);
 startHolding(loose);
 showToast(veg.label+' — uzet 1 komad');
}

function findCutTargetOnBoard(){
 for(const el of items){
   if(el.dataset.attachedToBoard!=='1')continue;
   if(!isBoardCuttableItem(el))continue;
   return el;
 }
 return null;
}
function getPanCounts(pan){ return CooksterPan.counts(pan); }
function getPanTotalCount(pan){ return CooksterPan.total(pan); }
function panIngredientAsset(kind,doneness=0,burnt=false){
 const v=VEGETABLES[kind]||VEGETABLES.paradajz;
 if(kind==='luk'){
   if(burnt||doneness>=1.02)return 'assets/ingredients/luk_pan_burnt.png';
   if(doneness>=.72)return 'assets/ingredients/luk_pan_golden.png';
   if(doneness>=.32)return 'assets/ingredients/luk_pan_soft.png';
   return 'assets/ingredients/luk_pan_fresh.png';
 }
 return v.slicedSrc||v.src;
}
function panTextureStage(doneness,burnt=false){
 if(burnt||doneness>=1.02)return 7;
 if(doneness>=.86)return 6;
 if(doneness>=.70)return 5;
 if(doneness>=.54)return 4;
 if(doneness>=.36)return 3;
 if(doneness>=.18)return 2;
 return 1;
}
function panFillScale(count){
 const c=Math.max(0,+count||0);
 if(c<=0)return 0;
 // Legacy-compatible fallback when no vessel is known.
 return Math.min(1,.58+.42*Math.sqrt(Math.min(1,c/6)));
}

function vesselFillScale(count){
 const c=Math.max(0,+count||0);
 if(c<=0)return 0;
 return Math.min(1,.56+.44*Math.sqrt(Math.min(1,c/8)));
}

// v198.5.22 — 2.5D "dynamic visual mesh stacking" without real 3D meshes.
// Each cookware shape gets a filling personality: pans spread outward,
// pots rise vertically, bowls do a balanced version of both.
const VESSEL_FILL_PROFILES=Object.freeze({
  tiganj_mali:        {minX:.58,maxX:.98,minY:.64,maxY:.94,maxRise:3.5,maxLayers:2,pieceBudget:12,stackGap:3.0},
  tiganj_veliki:      {minX:.54,maxX:1.00,minY:.61,maxY:.96,maxRise:4.5,maxLayers:2,pieceBudget:16,stackGap:3.2},
  serpa_velika:       {minX:.55,maxX:.94,minY:.58,maxY:.98,maxRise:15.5,maxLayers:4,pieceBudget:18,stackGap:4.1},
  serpa_plava:        {minX:.50,maxX:1.00,minY:.48,maxY:1.00,maxRise:18.5,maxLayers:5,pieceBudget:18,stackGap:4.5},
  vangla_mala:        {minX:.60,maxX:.98,minY:.62,maxY:.98,maxRise:9.0,maxLayers:3,pieceBudget:12,stackGap:3.4},
  vangla_srednja:     {minX:.56,maxX:1.00,minY:.60,maxY:1.00,maxRise:11.5,maxLayers:3,pieceBudget:16,stackGap:3.7},
  vangla_velika:      {minX:.54,maxX:1.00,minY:.57,maxY:1.00,maxRise:13.5,maxLayers:4,pieceBudget:18,stackGap:4.0},
  lavor_emajl_veliki: {minX:.50,maxX:1.00,minY:.56,maxY:.98,maxRise:10.0,maxLayers:4,pieceBudget:22,stackGap:3.5}
});
function vesselFillProfile(vessel){
 const id=vessel?.dataset?.itemId||'';
 if(VESSEL_FILL_PROFILES[id])return VESSEL_FILL_PROFILES[id];
 const subtype=vessel?.dataset?.vesselSubtype||'';
 if(subtype==='pan')return {minX:.56,maxX:1,minY:.62,maxY:.96,maxRise:4,maxLayers:2,pieceBudget:14,stackGap:3};
 if(subtype==='pot')return {minX:.56,maxX:.95,minY:.59,maxY:.98,maxRise:13,maxLayers:4,pieceBudget:17,stackGap:4};
 return {minX:.57,maxX:1,minY:.60,maxY:1,maxRise:10,maxLayers:3,pieceBudget:16,stackGap:3.6};
}
function vesselFillState(vessel,foodCount){
 const count=Math.max(0,+foodCount||0);
 const capacity=Math.max(1,containerCapacity(vessel));
 const ratio=count>0?1:0;
 const p=vesselFillProfile(vessel);
 // sqrt curve makes the first ingredient readable without making half-full look full.
 const spreadT=ratio;
 const scaleX=lerp(p.minX,p.maxX,spreadT);
 const scaleY=lerp(p.minY,p.maxY,Math.pow(ratio,.62));
 const rise=0;
 const layers=ratio<=0?0:1;
 const fillLevel=ratio<=0?0:1;
 const anchorSpread=.68+.32*spreadT;
 const rotorScale=Math.min(1,.58+.42*spreadT);
 const legacyScale=Math.min(1,.56+.44*spreadT);
 return {
   count,capacity,ratio,fillLevel,scaleX,scaleY,rise,layers,
   anchorSpread,rotorScale,legacyScale,
    pieceBudget:p.pieceBudget||16,
    stackGap:p.stackGap||3.6
 };
}
function applyVesselFillState(wrap,state){
 if(!wrap||!state)return;
 wrap.dataset.fillLevel=String(state.fillLevel);
 wrap.dataset.fillRatio=state.ratio.toFixed(3);
 wrap.style.setProperty('--fill-ratio',state.ratio.toFixed(4));
 wrap.style.setProperty('--fill-scale-x',state.scaleX.toFixed(4));
 wrap.style.setProperty('--fill-scale-y',state.scaleY.toFixed(4));
 wrap.style.setProperty('--fill-rotor-scale',state.rotorScale.toFixed(4));
 wrap.style.setProperty('--fill-rise',state.rise.toFixed(2)+'%');
 wrap.style.setProperty('--fill-stack-gap',state.stackGap.toFixed(2)+'%');
 wrap.style.setProperty('--food-fill',state.legacyScale.toFixed(4));
 wrap.dataset.stackUnits=String(Math.max(0,Math.round(+state.count||0)));

  delete wrap.dataset.depthGeometry;
  delete wrap.dataset.depthProgress;
  const vessel=wrap.closest?.('.item');
  const imported=window.CooksterVesselFoodCalibration?.get?.(vessel);
  if(imported){
    window.CooksterVesselFoodCalibration.applyToVessel(
      vessel,wrap,vessel?._vesselFrontMask,vesselVisualPreset(vessel)
    );
  }else{
    wrap.style.removeProperty('clip-path');
    wrap.style.removeProperty('-webkit-clip-path');
    wrap.style.removeProperty('border-radius');
  }
  wrap.style.removeProperty('overflow');
}

function panIngredientMix(counts){
 const keys=['luk','paprika','paradajz','krastavac'];
 const total=keys.reduce((s,k)=>s+(+counts[k]||0),0);
 if(total<=0)return [];
 return keys
   .map(k=>({kind:k,count:+counts[k]||0,ratio:(+counts[k]||0)/total}))
   .filter(x=>x.count>0);
}
function panMixBaseColor(mix,stage){
 const base={
   luk:[225,190,112],
   paprika:[86,132,50],
   paradajz:[214,58,32],
   krastavac:[96,156,72]
 };
 let r=0,g=0,b=0;
 for(const x of mix){
   const c=base[x.kind];
   r+=c[0]*x.ratio;g+=c[1]*x.ratio;b+=c[2]*x.ratio;
 }
 const dark=[1,.98,.94,.88,.78,.66,.40][Math.max(0,Math.min(6,stage-1))];
 return [Math.round(r*dark),Math.round(g*dark),Math.round(b*dark)];
}

function wholeProduceSource(baseKey,meta=null){
  if(meta?.src)return meta.src;
  const veg=VEGETABLES?.[baseKey];
  const fruit=CooksterCatalog.FRUITS?.[baseKey];
  return veg?.src||fruit?.src||'';
}
function appendWholeProduce(layer,entries,stage=1,fillState=null){
  if(!layer||!entries?.length)return;
  const fs=fillState||{ratio:0,scaleX:1,scaleY:1,rise:0,layers:1,stackGap:3};
  const expanded=[];
  for(const entry of entries){
    const n=Math.max(0,Math.min(10,Math.round(+entry.count||0)));
    for(let i=0;i<n;i++)expanded.push(entry);
  }
  if(!expanded.length)return;

  const layouts={
    1:[[50,50,-3,62]],
    2:[[41,50,-8,52],[59,50,7,52]],
    3:[[50,42,-2,47],[39,59,-9,46],[61,59,8,46]],
    4:[[40,42,-8,42],[60,42,7,42],[40,60,6,41],[60,60,-5,41]],
    5:[[50,37,-2,38],[35,49,-9,38],[65,49,8,38],[41,65,6,37],[59,65,-5,37]],
    6:[[39,38,-9,35],[61,38,8,35],[32,54,-7,34],[68,54,7,34],[42,67,6,34],[58,67,-5,34]],
    7:[[50,34,-2,33],[35,42,-9,33],[65,42,8,33],[29,56,-7,32],[71,56,7,32],[40,69,6,32],[60,69,-5,32]],
    8:[[39,35,-9,31],[61,35,8,31],[28,47,-7,31],[72,47,7,31],[31,62,5,30],[69,62,-5,30],[43,70,6,30],[57,70,-5,30]]
  };
  const stageFilters=['','brightness(.97) saturate(.98)','brightness(.93) saturate(.96)','brightness(.88) saturate(.92) sepia(.05)','brightness(.80) saturate(.87) sepia(.10)','brightness(.68) saturate(.78) sepia(.20)',''];
  const visible=Math.min((+stage||1)>=7?6:10,expanded.length);
  const pose=layouts[Math.min(8,visible)]||layouts[8];

  for(let i=0;i<visible;i++){
    const entry=expanded[i];
    let x,y,rot,w;
    if(i<pose.length){
      [x,y,rot,w]=pose[i];
    }else{
      // 9th/10th pieces form a small upper stack instead of disappearing.
      const j=i-pose.length;
      x=43+j*14;y=42-j*2;rot=j?-7:7;w=29;
    }
    const stackLevel=Math.min(Math.max(0,fs.layers-1),Math.floor(i/3));
    x=50+(x-50)*fs.scaleX;
    y=50+(y-50)*fs.scaleY-fs.rise*.56-stackLevel*fs.stackGap*.58;
    w*=.88+.12*Math.sqrt(Math.max(.05,fs.ratio||.05));

    const src=wholeProduceSource(entry.baseKey,entry.meta);
    if(!src)continue;
    const img=document.createElement('img');
    img.className='whole-produce-piece';
    img.dataset.stackLevel=String(stackLevel);
    img.src=src;img.alt='';img.draggable=false;
    img.style.left=x.toFixed(2)+'%';
    img.style.top=y.toFixed(2)+'%';
    img.style.width=w.toFixed(2)+'%';
    img.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;
    img.style.zIndex=String(22+i+stackLevel*5);
    img.style.filter=stageFilters[Math.max(0,Math.min(6,stage-1))];
    layer.appendChild(img);
  }
}
function wholeProduceEntries(counts,metaItems={}){
  const out=[];
  for(const [key,val] of Object.entries(counts||{})){
    const count=Math.max(0,+val||0);if(count<=0)continue;
    const meta=metaItems?.[key]||null;
    const isWholeKey=key.endsWith('_celo');
    const isWholeMeta=meta?.form==='whole';
    if(!isWholeKey&&!isWholeMeta)continue;
    const baseKey=meta?.baseKey||(isWholeKey?key.slice(0,-5):key);
    out.push({key,baseKey,count,meta});
  }
  return out;
}
function appendWholeRoastedPeppers(layer,count,phase=4){
 const n=Math.max(0,Math.min(8,Math.round(+count||0)));
 if(!layer||n<=0)return;

 // v174: roasted peppers follow the same centered composition logic as chopped food:
 // first piece appears in the middle of the calibrated food zone, then the group
 // expands outward around that center as quantity increases.
 const layouts={
   1:[[50,50,-4,72]],
   2:[[42,50,-9,61],[58,50,8,61]],
   3:[[50,43,-4,55],[39,58,-10,54],[61,58,8,54]],
   4:[[40,42,-10,49],[60,42,8,49],[40,59,7,48],[60,59,-6,48]],
   5:[[50,38,-4,45],[35,49,-10,44],[65,49,8,44],[41,64,7,43],[59,64,-6,43]],
   6:[[39,38,-10,41],[61,38,8,41],[32,53,-8,40],[68,53,7,40],[42,66,6,40],[58,66,-6,40]],
   7:[[50,35,-4,38],[35,42,-10,38],[65,42,8,38],[29,56,-7,37],[71,56,7,37],[40,68,6,37],[60,68,-6,37]],
   8:[[39,35,-10,36],[61,35,8,36],[28,47,-7,36],[72,47,7,36],[31,62,5,35],[69,62,-5,35],[43,69,6,35],[57,69,-6,35]]
 };
 const pose=layouts[n]||layouts[8];

 for(let i=0;i<pose.length;i++){
   const [x,y,rot,w]=pose[i];
   const img=document.createElement('img');
   img.className='whole-roasted-pepper';
   img.src=PAPRIKA_ROAST_ASSETS[Math.max(1,Math.min(4,+phase||4))-1];
   img.alt='';
   img.draggable=false;
   img.style.left=x+'%';
   img.style.top=y+'%';
   img.style.width=w+'%';
   img.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;
   img.style.zIndex=String(30+i);
   layer.appendChild(img);
 }
}


const LEGACY_PAN_SLICE_KEYS=new Set(['luk','paprika','paradajz','krastavac']);


const COOKSTER_TEXTURED_FOOD_SRC_CACHE=new Map();
function isPaprikaVisualPart(part){
  const raw=`${part?.storageKey||''}|${part?.kind||''}|${part?.src||''}|${part?.def?.src||''}`.toLowerCase();
  return raw.includes('paprika')||raw.includes('pepper');
}
function paprikaTextureProfile(part,stage=1){
  const raw=`${part?.storageKey||''}|${part?.kind||''}|${part?.src||''}|${part?.def?.src||''}`.toLowerCase();
  const green=raw.includes('zelena')||raw.includes('green');
  const cooked=Math.max(1,Math.min(7,+stage||1));
  if(green){
    if(cooked>=6){
      return {
        light:'#c8b16a', mid:'#7c7a3d', dark:'#4f4422',
        rib:'rgba(244,232,178,0.34)', gloss:'rgba(255,255,255,0.18)',
        char:'rgba(62,28,14,0.16)'
      };
    }
    if(cooked>=4){
      return {
        light:'#a4ca4d', mid:'#5f8d2e', dark:'#36561c',
        rib:'rgba(231,255,182,0.28)', gloss:'rgba(255,255,255,0.18)',
        char:'rgba(80,32,14,0.10)'
      };
    }
    return {
      light:'#bfe46d', mid:'#74b63c', dark:'#3d7125',
      rib:'rgba(236,255,196,0.30)', gloss:'rgba(255,255,255,0.20)',
      char:'rgba(54,90,20,0.08)'
    };
  }
  if(cooked>=6){
    return {
      light:'#d78f58', mid:'#934728', dark:'#5b2415',
      rib:'rgba(255,208,148,0.34)', gloss:'rgba(255,255,255,0.18)',
      char:'rgba(50,18,12,0.18)'
    };
  }
  if(cooked>=4){
    return {
      light:'#f06738', mid:'#bf3122', dark:'#7a1914',
      rib:'rgba(255,201,150,0.24)', gloss:'rgba(255,255,255,0.18)',
      char:'rgba(72,18,12,0.12)'
    };
  }
  return {
    light:'#ff7a55', mid:'#df2d22', dark:'#961613',
    rib:'rgba(255,214,184,0.26)', gloss:'rgba(255,255,255,0.22)',
    char:'rgba(96,20,14,0.08)'
  };
}
function texturedFoodSpriteSrc(part,src,stage=1,variantSeed=0){
  if(!src||!isPaprikaVisualPart(part))return src||'';
  // All paprika PNGs already contain their correct transparent artwork. The
  // synthetic SVG texture layer caused fresh red/green pepper to become a
  // gray cloud in the vessel, while roasted pepper happened to bypass it.
  // Keep the exact source for every pepper and let friedVariantSrc() choose
  // the cooked PNG before this function is called.
  return src;
}


function allSlicedIngredientMix(counts,metaItems={}){
  const entries=[];
  let total=0;
  for(const [key,val] of Object.entries(counts||{})){
    const count=Math.max(0,+val||0);
    if(count<=0)continue;
    if(GROUND_VEGETABLE_BY_KEY[key]||key.endsWith('_celo'))continue;
    const roastedPepper=isRoastedChoppedPepperKey(key);
    const roastedEggplant=isRoastedUnpeeledEggplantKey(key)
      ||(key==='patlidzan_diced'
        &&metaItems?.[key]?.src===VEGETABLES.patlidzan?.roastedUnpeeledDicedSrc);
    const roastedChopped=roastedPepper||roastedEggplant;
    if(key.startsWith('paprika_pecena')&&!roastedPepper)continue;
    const diced=key.endsWith('_diced')||roastedChopped;
    const base=roastedPepper?'paprika':(roastedEggplant?'patlidzan':(diced?key.slice(0,-6):key));
    const def=VEGETABLES[base]||CooksterCatalog.FRUITS?.[base];
    if(!def?.slicedSrc&&!def?.dicedSrc)continue;
    const allPiles=(diced&&!roastedChopped)?CooksterPiles.split(metaItems?.[key]?.src):[];
    const atlas=allPiles.filter(x=>x.includes('#'));   // per-piece atlases are drawn by CooksterPieceSim
    const piles=atlas.length?[]:allPiles;
    entries.push({
      kind:base,
      storageKey:key,
      cutState:diced?'diced':'sliced',
      count,
      // a player-cut pile replaces the stock diced art (and its fried variants, so the generic cook tint applies)
      def:piles.length?{...def,dicedSrc:piles[0],friedDicedSrc:undefined,wellDoneDicedSrc:undefined}:def,
      piles:piles.length?piles:null,
      atlas:atlas.length?atlas:null,
      src:atlas.length?(def.dicedSrc||def.slicedSrc||def.src):piles.length?piles[0]:roastedPepper
        ?roastedChoppedPepperSrc(key)
        :roastedEggplant
          ?(metaItems?.[key]?.src||def.roastedUnpeeledDicedSrc||def.dicedSrc||def.slicedSrc||def.src)
        :(diced?(def.dicedSrc||def.slicedSrc):(def.slicedSrc||def.src)),
      roastedChopped,
      legacy:!diced&&LEGACY_PAN_SLICE_KEYS.has(base)
    });
    total+=count;
  }
  if(total<=0)return [];
  return entries.map(e=>({...e,ratio:e.count/total}));
}
function ingredientMixBaseColor(mix,stage){
  const colors={
    luk:[225,190,112],
    paprika:[176,60,36],
    paradajz:[214,58,32],
    krastavac:[96,156,72],
    paprika_zelena:[91,145,46],
    beli_luk:[230,214,171],
    sargarepa:[224,111,25],
    zelena_salata:[114,164,61],
    kupus:[151,184,91],
    patlidzan:[113,67,103],
    tikvice:[102,147,61],
    rotkvice:[200,74,86],
    persun:[67,126,49]
  };
  let r=0,g=0,b=0,weight=0;
  for(const part of mix){
    const c=colors[part.kind]||[150,125,75];
    const w=Math.max(0,+part.ratio||0);
    r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;weight+=w;
  }
  if(weight<=0)return [150,125,75];
  r/=weight;g/=weight;b/=weight;
  const dark=[1,.985,.95,.90,.82,.69,.43][Math.max(0,Math.min(6,(+stage||1)-1))];
  return [Math.round(r*dark),Math.round(g*dark),Math.round(b*dark)];
}

function pileWidthForIngredient(key){
  if(key==='luk'||key==='beli_luk')return 27;
  if(key==='paprika'||key==='paprika_zelena')return 30;
  if(key==='krastavac'||key==='tikvice')return 29;
  if(key==='persun'||key==='zelena_salata'||key==='kupus')return 33;
  return 31;
}


function choppedCompositionSignature(mix){
  return (mix||[]).map(p=>`${p.storageKey||p.kind}:${Math.max(0,+p.count||0)}`).join('|');
}
function exactChoppedPose(){
  // Individual ingredient pose calibration was part of the retired renderer.
  // The imported vessel JSON now owns the only calibration surface.
  return {offsetX:0,offsetY:0,scale:1,rotation:0,tilt:0};
}
function choppedFoodSizeScale(vessel){
  // Keep the large-pot size adjustment local so upcoming vessel calibrations
  // remain independent. Restore the previous 30%-larger chopped-vegetable
  // size requested for the full bottom layer.
  return vessel?.dataset?.itemId==='serpa_velika' ? .8 : 1;
}
function appendExactChoppedSprite(layer,part,stage,vessel,fillState,compositionSig,zIndex=20,stackIndex=0,isTopLayer=false,depthT=0,depthStep=0,floorSpreadX=0,floorSpreadY=0){
  if(!layer||!part)return null;
  // v198.5.76: same reasoning as the floor — prefer diced art so a sliced
  // (ring/thin) cut doesn't look inconsistently sparse next to solid cubes.
  const rawSrc=part.piles?.length
    ?part.piles[Math.abs((+part.insertionIndex||stackIndex+1)-1)%part.piles.length]
    :part.roastedChopped
    ?part.src
    :(part.def?.dicedSrc||part.src||part.def?.slicedSrc||part.def?.src);
  if(!rawSrc)return null;
  const friedSrc=part.roastedChopped?null:friedVariantSrc(part,stage);
  const src=friedSrc||rawSrc;
  const displaySrc=texturedFoodSpriteSrc(part,src,stage,stackIndex);

  const pose=exactChoppedPose(vessel,part);
  const ratio=Math.max(0,Math.min(1,+fillState?.ratio||0));
  const sizeProfile=vesselFoodProfile(vessel);
  let baseWidth;
  if(sizeProfile?.geometry){
    // v198.5.72: constant piece size (±5%) per your request — every inserted
    // ingredient reads as the same size regardless of how much is already in
    // the pot, instead of growing simply because total fill ratio is higher.
    // 58% keeps pieces clearly visible (not the old 34% floor).
    const sizeNoise=deterministicUnitNoise(part.storageKey||part.kind||'ingredient',stackIndex,31);
    baseWidth=58*(0.95+sizeNoise*0.10)*vegSizeCompensation(part);
  }else{
    // v198.5.119 — reverted the "first N always 100% wide" floor forcing
    // (and the bottom-anchoring that went with it) back to plain per-piece
    // ratio-based sizing — same as the pan, no special floor-only case.
    const spread=.40+.64*Math.pow(ratio,.58); // 40% -> 104% of food-zone width
    baseWidth=Math.max(34,Math.min(104,spread*100))*vegSizeCompensation(part);
  }
  baseWidth*=choppedFoodSizeScale(vessel);

  const img=document.createElement('img');
  img.className='exact-chopped-sprite food-calibration-target';
  img.src=displaySrc||src;
  img.alt='';
  img.draggable=false;
  img.dataset.vesselId=vessel?.dataset?.itemId||'vessel';
  img.dataset.ingredientKey=part.storageKey||part.kind||'ingredient';
  img.dataset.ingredientBase=part.kind||'ingredient';
  img.dataset.cutState=part.cutState||'sliced';
  img.dataset.calibrationRef=`${img.dataset.vesselId}|${img.dataset.ingredientKey}`;
  img.dataset.stackIndex=String(stackIndex);
  img.dataset.insertionIndex=String(Math.max(1,stackIndex+1));
  img.dataset.topChoppedLayer=isTopLayer?'1':'0';
  img.dataset.baseWidth=String(baseWidth);
  img.dataset.geometryLegacyBaseWidth=String(baseWidth);
  const profile=vesselFoodProfile(vessel);
  const normalizedDepthT=Math.max(0,Math.min(1,+depthT||0));
  // Pans do not have a custom profile, but still need visible vertical fill.
  const risePercent=Number.isFinite(+profile?.legacyRisePercent)
    ? +profile.legacyRisePercent
    : (isPanItem(vessel)?18:14);
  const legacyPotRise=Math.max(0,risePercent*normalizedDepthT);

  img.dataset.depthStep=String(Math.max(0,+depthStep||0));
  img.dataset.depthT=normalizedDepthT.toFixed(4);
  img.dataset.depthRise=legacyPotRise.toFixed(3);

  {
    // Per-ingredient positions are generic renderer positions. The only
    // vessel calibration is the imported JSON mask/visible-area/depth profile.
    // on top of their own calibrated spot, so the first several insertions
    // physically spread across different areas of the pot instead of all
    // sitting stacked on the same calibrated point — job #1 for the floor
    // is covering the whole bottom with no gaps; free placement comes after.
    img.style.left=(50+(+pose.offsetX||0)+floorSpreadX)+'%';
    img.style.top=(50+(+pose.offsetY||0)-legacyPotRise+floorSpreadY)+'%';
    // v198.5.92 — BUG FOUND: this used to multiply in pose.scale, a value
    // saved by the calibration tool into localStorage during earlier manual
    // tuning sessions. That leftover per-vegetable scale (e.g. a small
    // saved value for zelena paprika) was silently overriding every size
    // change made in code — explains why edits to baseWidth/compensation
    // "did nothing" visually. baseWidth (with vegSizeCompensation) is now
    // the sole authority on width for this fallback path; old calibrated
    // scale is ignored here so future size tuning actually takes effect.
    // v198.5.93 — restored per your request: you want to hand-tune each
    // ingredient's size via the calibration tool again. pose.scale now
    // multiplies on top of the already-reasonable vegSizeCompensation base
    // (not the old, much-too-small raw base), so calibrating from here on
    // is a small nudge, not a fight against a tiny starting point.
    img.style.width=(baseWidth*Math.max(.2,+pose.scale||1)).toFixed(3)+'%';
  }
  // v198.5.121 — capture this piece's polar position (radius/angle from the
  // rotor centre) once, at render time. During stirring, each piece then
  // orbits by easing its OWN angle toward the shared target (with its own
  // "mass"/lag), instead of the whole rotor rigidly rotating as one image.
  {
    const bx=parseFloat(img.style.left),by=parseFloat(img.style.top);
    if(Number.isFinite(bx)&&Number.isFinite(by)){
      const dx=bx-50,dy=by-50;
      const rawRadius=Math.hypot(dx,dy);
      const orbitRadius=Math.max(3,rawRadius);
      if(orbitRadius>0){
        img.dataset.orbitRadius=orbitRadius.toFixed(3);
        const seededAngle=rawRadius>3?Math.atan2(dy,dx):(deterministicUnitNoise(img.dataset.calibrationRef||'piece',stackIndex,79)*Math.PI*2-Math.PI);
        img.dataset.orbitAngle0=seededAngle.toFixed(5);
        img.dataset.orbitPhase='0';
        const massNoise=deterministicUnitNoise(img.dataset.calibrationRef||'piece',stackIndex,71);
        img.dataset.orbitMass=(0.7+massNoise*0.9).toFixed(3);
   // Large-pot stirring uses constrained juggling instead of an orbit.
   // Preserve the calibrated rest anchor so the piece can settle back.
   img.dataset.juggleLeft=bx.toFixed(3);
   img.dataset.juggleTop=by.toFixed(3);
   img.dataset.jugglePhase=(deterministicUnitNoise(img.dataset.calibrationRef||'piece',stackIndex,83)*Math.PI*2).toFixed(5);
      }
    }
  }
  img.style.height='auto';
  img.style.zIndex=String(zIndex);
  img.style.setProperty('--chopped-rot',`${+(pose.rotation||0)}deg`);
  img.style.setProperty('--chopped-tilt',`${+(pose.tilt||0)}deg`);
  img.style.filter=foodPieceFilter(stage,!!friedSrc);
  // v198.5.71: staggered per-piece jostle timing (see .static-mix-rotor CSS)
  // — this vessel no longer rotates the whole rotor to look "mixed".
  const jostleNoise=deterministicUnitNoise(img.dataset.calibrationRef,stackIndex,13);
  img.style.animationDelay=(jostleNoise*1.6).toFixed(2)+'s';
  img.style.animationDuration=(0.9+jostleNoise*0.9).toFixed(2)+'s';

  layer.appendChild(img);
  return img;
}



function expandChoppedUnits(mix,maxUnits=24,batches=[]){
  const out=[];
  const cap=Math.max(1,Math.round(+maxUnits||24));
  const parts=new Map();
  const remaining=new Map();

  for(const part of (mix||[])){
    const key=part?.storageKey||part?.kind||'';
    const count=Math.max(0,Math.round(+part?.count||0));
    if(!key||count<=0)continue;
    parts.set(key,part);
    remaining.set(key,(remaining.get(key)||0)+count);
  }

  const pushUnits=(key,count)=>{
    const part=parts.get(key);
    let left=Math.min(Math.max(0,Math.round(+count||0)),remaining.get(key)||0);
    while(part&&left>0&&out.length<cap){
      out.push({...part,count:1,insertionIndex:out.length+1});
      left--;
      remaining.set(key,Math.max(0,(remaining.get(key)||0)-1));
    }
  };

  // Batch order is authoritative: this is the actual order in which food entered
  // the vessel and survives save/load and vessel-to-vessel transfers.
  for(const batch of (Array.isArray(batches)?batches:[])){
    pushUnits(String(batch?.key||''),batch?.count);
    if(out.length>=cap)break;
  }

  // Old saves may not have complete batches. Append only the unmatched remainder
  // in the legacy mix order so rendering stays backwards-compatible.
  if(out.length<cap){
    for(const part of (mix||[])){
      const key=part?.storageKey||part?.kind||'';
      pushUnits(key,remaining.get(key)||0);
      if(out.length>=cap)break;
    }
  }

  const total=Math.max(1,out.length);
  out.forEach((unit,index)=>{
    unit.insertionIndex=index+1;
    unit.ratio=1/total;
  });
  return out;
}

function deterministicUnitNoise(signature,index,salt=0){
  let h=2166136261>>>0;
  const str=`${signature}|${index}|${salt}`;
  for(let i=0;i<str.length;i++){
    h^=str.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  h^=h<<13;h^=h>>>17;h^=h<<5;
  return (h>>>0)/4294967295;
}

// v198.5.109 — cleanup: appendBottomCoverageFoundation and
// applyUpperLayerJitter (the old calibrated-polygon floor system's helper
// functions) removed — nothing calls them anymore.


function geometryProgressForInsertion(n,vessel=null){
  return depthProgressForInsertion(vessel,n);
}

const PAN_SLOTS=Object.freeze({
  tiganj_veliki:Object.freeze([
    {x:50,y:66,scale:1.00},{x:50,y:59,scale:.96},{x:50,y:52,scale:.92},
    {x:50,y:45,scale:.88},{x:50,y:38,scale:.84}
  ]),
  tiganj_mali:Object.freeze([
    {x:50,y:66,scale:.96},{x:50,y:59,scale:.92},{x:50,y:52,scale:.88},
    {x:50,y:45,scale:.84},{x:50,y:38,scale:.80}
  ])
});
function vesselFoodFitSlot(vesselId,index,total){
  const slots=PAN_SLOTS[vesselId];
  if(total<=5&&slots)return slots[Math.min(slots.length-1,index)];

  // Once the vessel contains more than the authored five hero positions,
  // switch to a compact deterministic grid instead of piling every later
  // piece on the last slot. This keeps the complete chopped batch visible.
  const cols=total<=8?4:5;
  const rows=Math.max(1,Math.ceil(total/cols));
  const col=index%cols;
  const row=Math.floor(index/cols);
  const x=28+(cols===1?0:44*col/(cols-1));
  const y=(vesselId==='serpa_velika'||vesselId.startsWith('serpa_'))
    ?48+(rows===1?0:22*row/(rows-1))
    :40+(rows===1?0:28*row/(rows-1));
  return {x,y,scale:Math.max(.62,Math.min(.92,4.7/Math.max(1,total)))};
}
const LARGE_POT_BOTTOM_ROW=9;
const LARGE_POT_MAX_ROWS=4;
const LARGE_POT_BOTTOM_FILL_COUNT=2;
function largePotStackPosition(vessel,index){
  const normalizedIndex=Math.max(0,index);
  // The first two insertions cover the complete calibrated floor. The third
  // insertion starts the next depth layer.
  const row=normalizedIndex<LARGE_POT_BOTTOM_FILL_COUNT
    ? 0
    : 1+Math.floor((normalizedIndex-LARGE_POT_BOTTOM_FILL_COUNT)/LARGE_POT_BOTTOM_ROW);
  const slot=normalizedIndex<LARGE_POT_BOTTOM_FILL_COUNT
    ? normalizedIndex
    : (normalizedIndex-LARGE_POT_BOTTOM_FILL_COUNT)%LARGE_POT_BOTTOM_ROW;
  const t=Math.min(1,row/Math.max(1,LARGE_POT_MAX_ROWS-1));
  const range=window.CooksterVesselFoodCalibration?.horizontalRangeAtDepth?.(
    vessel,t
  );
  if(!range)return null;
  if(row===0&&slot<LARGE_POT_BOTTOM_FILL_COUNT){
    const drawnFloor=window.CooksterVesselFoodCalibration?.bottomSlots?.(
      vessel,LARGE_POT_BOTTOM_FILL_COUNT
    );
    if(drawnFloor?.[slot]){
      return {
        t:0,
        x:drawnFloor[slot].x,
        y:drawnFloor[slot].y
      };
    }
    // Fallback for an older profile without a bottom polygon.
    const fractions=[.25,.75];
    return {
      t:0,
      x:range.left+(range.right-range.left)*(fractions[slot]??.5),
      y:range.y
    };
  }
  // Breadth-first across each row: center, left/right, then farther
  // left/right until the calibrated visible bottom is covered.
  const step=slot===0?0:Math.ceil(slot/2)*(slot%2?-1:1);
  const normalized=step/Math.floor(LARGE_POT_BOTTOM_ROW/2);
  return {
    t,
    x:((range.left+range.right)/2)+
      normalized*((range.right-range.left)/2),
    y:range.y
  };
}



// v198.5.139 — chopped-food visibility safety.
// The old canvas-mesh experiment hides the real PNG rotor with
// `.exact-chopped-stack > .exact-chopped-rotor{opacity:0!important}`.
// If the optional mesh renderer is unavailable (or has not mounted yet),
// that made chopped vegetables appear to vanish after being put in a vessel.
// Keep the DOM sprites visible by default; a mounted mesh canvas may opt back
// into hiding only after it is actually present and connected.
const choppedFoodVisibilityGuard=document.createElement('style');
choppedFoodVisibilityGuard.textContent=`
/* v198.5.140 — authoritative chopped-food renderer.
   The real DOM PNG sprites are always visible. The old canvas mesh is disabled
   because hiding the source rotor made food vanish whenever that optional
   renderer failed to paint. */
.exact-chopped-stack > .exact-chopped-rotor:not(.trail-ghost-rotor){
  opacity:1!important;
  display:block!important;
}
.exact-chopped-stack > .cookster-mesh-renderer{
  display:none!important;
  opacity:0!important;
}
`;
document.head.appendChild(choppedFoodVisibilityGuard);

function syncChoppedMeshVisibility(root){
  if(!root)return;
  root.classList.remove('mesh-renderer-active');
}
function appendCenteredChoppedStack(layer,mix,stage,fillState=null,vessel=null,batches=[]){
  if(!layer||!mix?.length)return;

  const root=document.createElement('div');
  // v198.5.62: no longer paired with a "mixed" fallback layer, so this must
  // NOT carry .stir-pile-layer's opacity:calc(1 - var(--stir-mix)) rule —
  // that rule existed to fade this out in favor of a replacement that no
  // longer exists. This disc IS the mixed look now; it stays fully visible
  // and simply rotates.
  root.className='exact-chopped-stack';
  const rotor=document.createElement('div');
  // v198.5.102 — reverted per your request: rotation + light blur are back
  // (you have your own idea for the gap problem to try next).
  rotor.className='exact-chopped-rotor';
  root.appendChild(rotor);

  // Render physical instances rather than one sprite per ingredient type.
  // Keep enough units visible for larger recipes while retaining a static bed.
  const orderedUnits=expandChoppedUnits(mix,30,batches);
  // The first physical insertion is the static bottom layer. Reuse its
  // exact ingredient PNG; later insertions are the moving ingredients above it.
  // Do not route through the legacy generic pan textures: they collapse red
  // and green peppers into one mixed art and make onion disagree with its
  // actual diced sprite.
  const bedPart=orderedUnits[0]||mix[0];
  const bedSrc=bedPart?.roastedChopped
    ?bedPart?.src
    :(friedVariantSrc(bedPart,stage)||bedPart?.def?.dicedSrc||bedPart?.src||bedPart?.def?.slicedSrc||bedPart?.def?.src||'');
  const bedDisplaySrc=texturedFoodSpriteSrc(bedPart,bedSrc,stage,0);
  const bed=document.createElement('img');
  const bedPose=exactChoppedPose(vessel,bedPart);
  bed.className='vessel-food-bed food-calibration-target';
  bed.src=bedDisplaySrc||bedSrc;bed.alt='';bed.draggable=false;
  bed.dataset.vesselId=vessel?.dataset?.itemId||'vessel';
  bed.dataset.ingredientKey=bedPart?.storageKey||bedPart?.kind||'ingredient';
  bed.dataset.ingredientBase=bedPart?.kind||bed.dataset.ingredientKey;
  bed.dataset.cutState=bedPart?.cutState||'sliced';
  bed.dataset.calibrationRef=`${bed.dataset.vesselId}|${bed.dataset.ingredientKey}`;
  bed.style.setProperty('--bed-offset-x',`${+bedPose.offsetX||0}%`);
  bed.style.setProperty('--bed-offset-y',`${+bedPose.offsetY||0}%`);
  bed.style.setProperty('--bed-scale',String(+bedPose.scale||1));
  bed.style.setProperty('--bed-rotation',`${+bedPose.rotation||0}deg`);
  bed.style.setProperty('--bed-tilt',`${+bedPose.tilt||0}deg`);
  root.insertBefore(bed,rotor);
  const orderSig=orderedUnits.map(p=>p.storageKey||p.kind||'ingredient').join('>');
  const sig=`${choppedCompositionSignature(mix)}|order:${orderSig}`;

  // v198.5.109 — cleanup: this used to branch between a custom calibrated-
  // polygon floor system (appendBottomCoverageFoundation + per-piece
  // jostle) and this simple per-ingredient-pose renderer, selected by
  // whether the vessel profile had a `geometry` field. No vessel profile
  // sets `geometry` anymore (that whole system was retired in favor of
  // this one, matching the pan), so the branch could never be taken —
  // removed entirely rather than leaving dead code that looks live.
  //
  // v198.5.91 — BUG FIX: this used to render ONE sprite per distinct
  // vegetable TYPE, with its depth computed from the CUMULATIVE unit
  // count up through that type (mix.forEach + insertionCursor). That
  // silently breaks "first N insertions stay on the floor" the moment any
  // single vegetable has more than 1 piece: e.g. 3 tomato + 1 green
  // pepper already sums to 4 units before the pepper is even reached, so
  // the pepper (though only the 2nd DISTINCT thing you dropped in) got
  // treated as insertion #4-5 and started rising — or worse, everything
  // past the first type immediately "rose", exactly what was reported.
  // Fix: iterate the real physical units in true chronological order
  // (orderedUnits, already built above from the authoritative batch
  // history) — one sprite per actual piece, each keeping its own real
  // insertionIndex, regardless of how many pieces any one vegetable has.
  if(!orderedUnits.length)return;
  // v198.5.99 — reverted the floor-spread nudge per your direct request:
  // "just use the same system as the big pan, it already works
  // perfectly there." The pan gets good coverage purely from each
  // ingredient's own calibrated position/size — no programmatic nudging
  // — so this vessel now does exactly that too, nothing pot-specific.
  const sameTypeSeen={};
  const vesselId=vessel?.dataset?.itemId||'';
   const fitVessel=vesselId==='serpa_velika'
     || vesselSubtypeFor(vessel)==='pot'
     || !!PAN_SLOTS[vesselId];
   const renderUnits=fitVessel
    ? orderedUnits
    : orderedUnits.slice(1);
  renderUnits.forEach((part,index)=>{
    const renderIndex=index+((vesselId==='serpa_velika'||PAN_SLOTS[vesselId])?0:1);
    const insertionIndex=Math.max(1,+part.insertionIndex||renderIndex+1);
    const depth=geometryProgressForInsertion(insertionIndex,vessel);
    const img=appendExactChoppedSprite(
      rotor,
      part,
      stage,
      vessel,
      fillState,
      sig,
      20+renderIndex,
      insertionIndex-1,
      renderIndex===orderedUnits.length-1,
      depth.t,
      depth.step
    );
    // v198.5.107 — calibration stores ONE pose per ingredient TYPE, so
    // without this, 5 tomatoes would render as 5 sprites in the exact
    // same spot (looks like "nothing changed" as you add more of the
    // same thing). Give repeats of the same type a small deterministic
    // nudge off their calibrated "home" position — first one of a kind
    // stays exactly where it was calibrated, later ones fan out a bit.
    if(img){
       if(vesselId==='serpa_velika'){
         const point=largePotStackPosition(vessel,index);
         if(point){
           img.style.left=point.x.toFixed(3)+'%';
           img.style.top=point.y.toFixed(3)+'%';
           img.dataset.depthT=point.t.toFixed(4);
           img.dataset.depthStep=String(
             Math.round(point.t*(LARGE_POT_MAX_ROWS-1))
           );
           img.style.height='auto';
           img.style.objectFit='contain';
           img.style.zIndex=String(40+index);
         }
       }else if(fitVessel){
         const slot=vesselFoodFitSlot(vesselId,index,renderUnits.length);
        img.style.left=slot.x+'%';
        img.style.top=slot.y+'%';
          img.style.width=(parseFloat(img.style.width||'40')*slot.scale*1.15).toFixed(3)+'%';
          img.style.height=(52*slot.scale).toFixed(3)+'%';
        img.style.objectFit='fill';
        img.style.zIndex=String(30+index);
      }
      const typeKey=part.storageKey||part.kind||'ingredient';
      sameTypeSeen[typeKey]=(sameTypeSeen[typeKey]||0)+1;
      const dupIndex=sameTypeSeen[typeKey]-1;
       if(dupIndex>0&&!fitVessel){
        const nx=(deterministicUnitNoise(typeKey,dupIndex,53)-0.5)*16;
        const ny=(deterministicUnitNoise(typeKey,dupIndex,67)-0.5)*11;
        const curLeft=parseFloat(img.style.left);
        const curTop=parseFloat(img.style.top);
        if(Number.isFinite(curLeft))img.style.left=(curLeft+nx).toFixed(3)+'%';
        if(Number.isFinite(curTop))img.style.top=(curTop+ny).toFixed(3)+'%';
      }
       // The final fitted/calibrated position is the spring's rest anchor.
       // Capturing earlier made pieces jump back to a pre-layout position as
       // soon as stirring began.
       captureStirOrbitAnchor(img,insertionIndex-1);
    }
    });

  // v198.5.82 — comet-trail while stirring: two faded, blurred copies of the
  // whole rotor sit just behind the real one. updateStirring keeps them a
  // fixed number of degrees BEHIND the live spoon direction (not literally
  // last frame's angle — that would need per-frame cloning, which is too
  // expensive here), so they read as a trailing smear stretching away from
  // the direction of motion, like a comet's tail, at near-zero extra cost
  // since only their rotation angle is touched per tick.
   if(vesselId==='serpa_velika'){
     const coverage=rotor.cloneNode(true);
     coverage.className='stir-coverage-rotor';
     coverage.setAttribute('aria-hidden','true');
     // This copy stays at the calibrated rest positions. It is the visual food
     // bed underneath the moving mass, so a stir can never reveal an empty hole.
     root.insertBefore(coverage,rotor);
   }

   const ghostFar=rotor.cloneNode(true);
  ghostFar.className=rotor.className+' trail-ghost-rotor trail-ghost-far';
  const ghostNear=rotor.cloneNode(true);
  ghostNear.className=rotor.className+' trail-ghost-rotor trail-ghost-near';
  root.appendChild(ghostFar);
  root.appendChild(ghostNear);
  root.appendChild(rotor);
  layer.appendChild(root);

  // The optional canvas renderer mounts asynchronously in its own rAF loop.
  // Until a real non-zero canvas exists, the source PNG rotor remains visible.
  syncChoppedMeshVisibility(root);
  requestAnimationFrame(()=>syncChoppedMeshVisibility(root));
  setTimeout(()=>syncChoppedMeshVisibility(root),80);
}

function appendSeparatedIngredientPiles(layer,mix,fillState=null,stage=1){
  if(!layer||!mix?.length)return;
  const fs=fillState||{ratio:0,anchorSpread:1,layers:1,pieceBudget:12,stackGap:3,scaleX:1,scaleY:1};
  const pileRoot=document.createElement('div');
  pileRoot.className='stir-pile-layer';
  const pileRotor=document.createElement('div');
  pileRotor.className='stir-pile-rotor';
  pileRoot.appendChild(pileRotor);

  // Separate ingredient islands remain visible until real spoon mixing.
  // Fill ratio only makes each island wider/taller; it never merges them by itself.
  const anchors=[
    {x:27,y:43},{x:72,y:42},{x:47,y:69},{x:51,y:25},
    {x:30,y:65},{x:72,y:64},{x:35,y:28},{x:67,y:28}
  ];

  const burntLite=(+stage||1)>=7;
  const totalBudget=burntLite
    ? Math.max(mix.length,Math.min(16,mix.length+5))
    : Math.max(mix.length*2,Math.min(28,18+mix.length));
  let remainingBudget=totalBudget;

  mix.forEach((part,partIndex)=>{
    const raw=anchors[partIndex%anchors.length];
    const a={
      x:50+(raw.x-50)*fs.anchorSpread,
      y:50+(raw.y-50)*(.78+.22*fs.scaleY)
    };
    const src=part.src||part.def?.slicedSrc||part.def?.src;
    if(!src)return;

    if(!burntLite){
      const shadow=document.createElement('i');
      shadow.className='ingredient-pile-shadow';
      shadow.style.left=a.x.toFixed(2)+'%';
      shadow.style.top=(a.y+5).toFixed(2)+'%';
      shadow.style.width=(17+part.ratio*18+fs.ratio*8).toFixed(2)+'%';
      shadow.style.opacity=(.08+.15*fs.ratio).toFixed(3);
      pileRotor.appendChild(shadow);
    }

    const desired=Math.max(
      burntLite?1:2,
      Math.min(7,Math.round(2+Math.sqrt(Math.max(1,part.count))*.75+part.ratio*fs.pieceBudget*.38))
    );
    const partsLeft=mix.length-partIndex-1;
    const minPerFuture=burntLite?1:2;
    const maxNow=Math.max(minPerFuture,remainingBudget-partsLeft*minPerFuture);
    const pieces=Math.max(minPerFuture,Math.min(desired,maxNow));
    remainingBudget=Math.max(0,remainingBudget-pieces);
    const baseW=pileWidthForIngredient(part.kind);
    for(let i=0;i<pieces;i++){
      const img=document.createElement('img');
      img.className=`stir-pile-piece stir-pile-${part.kind}`;
      img.src=src;img.alt='';img.draggable=false;

      const stackLevel=Math.min(Math.max(0,fs.layers-1),Math.floor(i/2));
      const ring=i===0?0:Math.ceil((i+1)/2);
      const side=i%2?-1:1;
      const px=a.x+side*ring*(3.8+fs.ratio*1.4)+((partIndex%3)-1)*.7+stackLevel*(side*.65);
      const py=a.y+(i%3-1)*3.2+ring*.65-stackLevel*fs.stackGap*.72;
      const width=(baseW+Math.min(5,part.ratio*8))*(.88+.12*Math.sqrt(Math.max(.05,fs.ratio||.05)));

      img.dataset.stackLevel=String(stackLevel);
      img.style.left=px.toFixed(2)+'%';
      img.style.top=py.toFixed(2)+'%';
      img.style.width=width.toFixed(2)+'%';
      img.style.setProperty('--pile-rot',`${((partIndex*17+i*13)%42)-21}deg`);
      img.style.zIndex=String(12+partIndex*8+i+stackLevel*5);
      pileRotor.appendChild(img);
    }
  });
  layer.appendChild(pileRoot);
}
function appendLegacyWeightedTexture(mixedRoot,mix,stage){
  const legacy=mix.filter(x=>x.legacy);
  if(!legacy.length)return;

  const legacyShare=legacy.reduce((s,x)=>s+x.ratio,0);
  const norm=legacy.map(x=>({...x,ratio:x.ratio/Math.max(.0001,legacyShare)}));
  const [mixR,mixG,mixB]=ingredientMixBaseColor(mix,stage);

  const base=document.createElement('div');
  base.className='stir-old-mix-fill';
  base.style.setProperty('--old-mix-light',`${Math.min(255,mixR+24)},${Math.min(255,mixG+20)},${Math.min(255,mixB+14)}`);
  base.style.setProperty('--old-mix-color',`${mixR},${mixG},${mixB}`);
  base.style.setProperty('--old-mix-dark',`${Math.round(mixR*.64)},${Math.round(mixG*.64)},${Math.round(mixB*.64)}`);
  mixedRoot.appendChild(base);

  const rotor=document.createElement('div');
  rotor.className='stir-old-mix-rotor';
  rotor.style.opacity=String(Math.max(.34,Math.min(1,.30+legacyShare*.78)));
  mixedRoot.appendChild(rotor);

  const pose={
    luk:{x:-2.6,y:-1.3,rot:-4},
    paprika:{x:2.8,y:1.1,rot:5},
    paradajz:{x:.5,y:2.2,rot:-1},
    krastavac:{x:1.4,y:.4,rot:3}
  };
  for(const part of norm){
    const q=pose[part.kind];
    if(!q)continue;
    const img=document.createElement('img');
    img.className='pan-ingredient-layer pan-layer-'+part.kind;
    img.src=part.kind==='krastavac'
      ? (VEGETABLES.krastavac.slicedSrc||VEGETABLES.krastavac.src)
      : `assets/pan_textures/${part.kind}_${stage}.png`;
    img.alt='';img.draggable=false;
    img.style.setProperty('--layer-x',q.x+'%');
    img.style.setProperty('--layer-y',q.y+'%');
    img.style.setProperty('--layer-rot',q.rot+'deg');
    img.style.setProperty('--layer-opacity',String(Math.min(1,.22+.78*Math.pow(part.ratio,.72))));
    img.style.setProperty('--layer-scale',String(.82+.18*Math.sqrt(part.ratio)));
    img.style.zIndex=String(10+Math.round(part.ratio*20));
    rotor.appendChild(img);
  }
}

function appendMixedIngredientPieces(mixedRoot,mix,stage,fillState=null){
  const nonLegacy=mix.filter(x=>!x.legacy);
  if(!nonLegacy.length)return;
  const fs=fillState||{ratio:0,scaleX:1,scaleY:1,rise:0,layers:1,pieceBudget:18,stackGap:3};

  const rotor=document.createElement('div');
  rotor.className='stir-combined-piece-rotor';
  mixedRoot.appendChild(rotor);

  const normalMaxPieces=Math.max(8,Math.min(16,Math.round(7+fs.ratio*(fs.pieceBudget||18))));
  const maxPieces=(+stage||1)>=7?Math.min(8,normalMaxPieces):normalMaxPieces;
  const slots=[];
  nonLegacy.forEach(entry=>{
    const n=Math.max(1,Math.round(entry.ratio*maxPieces));
    for(let i=0;i<n;i++)slots.push(entry);
  });
  while(slots.length>maxPieces)slots.pop();
  while(slots.length<Math.min(maxPieces,nonLegacy.length*3)){
    slots.push(nonLegacy[slots.length%nonLegacy.length]);
  }

  const n=Math.max(1,slots.length);
  // v198.5.60: once real stirring is happening, the pot is never "half full"
  // visually — the scattered mix should always reach close to the pot wall,
  // not shrink to the vessel's raw fill-ratio scale (that made the mixed
  // layer look smaller/clumped right after the full pre-mix stack fades out).
  const scatterScaleX=Math.max(.90,+fs.scaleX||0);
  const scatterScaleY=Math.max(.86,+fs.scaleY||0);
  slots.forEach((entry,i)=>{
    const phi=(i*137.508+entry.kind.length*19)*Math.PI/180;
    const radius=Math.sqrt((i+.55)/n);
    const stackLevel=Math.min(Math.max(0,fs.layers-1),Math.floor(i/6));
    const x=50+Math.cos(phi)*42*radius*scatterScaleX;
    const y=50+Math.sin(phi)*33*radius*scatterScaleY-stackLevel*fs.stackGap*.52;
    const img=document.createElement('img');
    img.className=`stir-combined-piece stir-combined-${entry.kind}`;
    img.dataset.stackLevel=String(stackLevel);
    img.src=entry.src||entry.def.dicedSrc||entry.def.slicedSrc;img.alt='';img.draggable=false;
    img.style.left=x.toFixed(2)+'%';
    img.style.top=y.toFixed(2)+'%';
    img.style.width=(21+Math.min(9,entry.ratio*18)+fs.ratio*2.2).toFixed(2)+'%';
    img.style.transform=`translate(-50%,-50%) rotate(${((i*29)%70)-35}deg) scaleY(.88)`;
    img.style.filter=genericCookFilter(stage);
    img.style.zIndex=String(32+i+stackLevel*5);
    rotor.appendChild(img);
  });
}
function appendMixedFood(layer,mix,stage,fillState=null){
  if(!layer||!mix?.length)return;
  const root=document.createElement('div');
  root.className='stir-old-mix-layer stir-combined-layer';

  // The stationary ellipse is always the vessel bottom; only inner rotors move.
  // This preserves the old Cookster "full bottom" silhouette.
  const [r,g,b]=ingredientMixBaseColor(mix,stage);
  const fill=document.createElement('div');
  fill.className='stir-combined-base';
  fill.style.setProperty('--combined-light',`${Math.min(255,r+23)},${Math.min(255,g+19)},${Math.min(255,b+14)}`);
  fill.style.setProperty('--combined-color',`${r},${g},${b}`);
  fill.style.setProperty('--combined-dark',`${Math.round(r*.62)},${Math.round(g*.62)},${Math.round(b*.62)}`);
  root.appendChild(fill);

  appendLegacyWeightedTexture(root,mix,stage);
  appendMixedIngredientPieces(root,mix,stage,fillState);
  layer.appendChild(root);
}

function appendSingleSlicedIngredient(layer,part,stage,fillState=null){
  if(!layer||!part)return;
  const fs=fillState||{ratio:0,scaleX:1,scaleY:1,rise:0,layers:1,pieceBudget:10,stackGap:3};

  if(part.legacy){
    const pose={
      luk:{x:-2.6,y:-1.3,rot:-4},
      paprika:{x:2.8,y:1.1,rot:5},
      paradajz:{x:.5,y:2.2,rot:-1},
      krastavac:{x:1.4,y:.4,rot:3}
    };
    const q=pose[part.kind];
    if(!q)return;
    const img=document.createElement('img');
    img.className='pan-ingredient-layer pan-layer-'+part.kind;
    img.src=part.kind==='krastavac'
      ? (VEGETABLES.krastavac.slicedSrc||VEGETABLES.krastavac.src)
      : `assets/pan_textures/${part.kind}_${stage}.png`;
    img.alt='';img.draggable=false;
    img.style.setProperty('--layer-x',q.x+'%');
    img.style.setProperty('--layer-y',q.y+'%');
    img.style.setProperty('--layer-rot',q.rot+'deg');
    img.style.setProperty('--layer-opacity','1');
    img.style.setProperty('--layer-scale','1');
    layer.appendChild(img);
    return;
  }

  const root=document.createElement('div');
  root.className='single-sliced-pile';
  const src=part.src||part.def.dicedSrc||part.def.slicedSrc;
  const normalPieces=Math.max(3,Math.min(10,Math.round(3+fs.ratio*(fs.pieceBudget||10))));
  const pieces=(+stage||1)>=7?Math.min(6,normalPieces):normalPieces;
  for(let i=0;i<pieces;i++){
    const img=document.createElement('img');
    img.className='single-sliced-piece';
    img.src=src;img.alt='';img.draggable=false;
    const angle=i*137.508*Math.PI/180;
    const rad=Math.sqrt((i+.4)/pieces);
    const stackLevel=Math.min(Math.max(0,fs.layers-1),Math.floor(i/4));
    img.dataset.stackLevel=String(stackLevel);
    img.style.left=(50+Math.cos(angle)*27*rad*fs.scaleX).toFixed(2)+'%';
    img.style.top=(50+Math.sin(angle)*20*rad*fs.scaleY-fs.rise*.42-stackLevel*fs.stackGap*.65).toFixed(2)+'%';
    img.style.width=(28+Math.min(6,part.count)+fs.ratio*3).toFixed(2)+'%';
    img.style.transform=`translate(-50%,-50%) rotate(${((i*27)%56)-28}deg) scaleY(.88)`;
    img.style.filter=genericCookFilter(stage);
    img.style.zIndex=String(18+i+stackLevel*5);
    root.appendChild(img);
  }
  layer.appendChild(root);
}
function genericCookFilter(stage){
  const s=Math.max(1,Math.min(7,+stage||1));
  return [
    'none',
    'brightness(1.03) saturate(1.10) contrast(1.02)',
    'brightness(1.00) saturate(1.06) sepia(.06) hue-rotate(-4deg) contrast(1.04)',
    'brightness(.95) saturate(1.02) sepia(.15) hue-rotate(-6deg) contrast(1.06)',
    'brightness(.88) saturate(.96) sepia(.26) hue-rotate(-8deg) contrast(1.09)',
    'brightness(.76) saturate(.86) sepia(.38) hue-rotate(-10deg) contrast(1.12)',
    // v198.5.26: burnt tint is applied once to the complete food layer.
    // Per-piece stage-7 filters were a major GPU/paint hotspot.
    'none'
  ][s-1];
}

// v198.5.74 — real "fried" and "well-done" photography for the 13 chopped
// vegetables (see VEGETABLES.*.friedDicedSrc/wellDoneDicedSrc). Once a piece
// crosses into a cooked-enough stage, swap its actual source image instead
// of only tinting the raw PNG — the existing stage-change crossfade in
// renderFoodContents (fadeFoodLayers) already handles the transition
// smoothly, so raw -> fried -> well-done happens as a natural dissolve,
// including while the jostle-mixing animation is playing.
// v198.5.97 — REMOVED per-vegetable "smart" compensation entirely. It was
// calculated to offset your OLD saved calibration scale values (which were
// wildly inconsistent, 0.28–1.0) — the moment you normalized those old
// scales back to 1, this table's multipliers (up to 1.65x) applied to the
// FULL size instead of the shrunk one, blowing things up. Two systems both
// trying to fix the same problem at once = compounding errors. One source
// of truth now: baseWidth alone (uniform for everyone), and the
// calibration tool's own `scale` field (now reset to 1 for every _diced
// entry) is the ONLY per-ingredient size lever from here on.
const VEG_SIZE_COMPENSATION=Object.freeze({
  beli_luk:1,krastavac:1,kupus:1,luk:1,paprika:1,
  paprika_zelena:1,paradajz:1,patlidzan:1,persun:1,
  rotkvice:1,sargarepa:1,tikvice:1,zelena_salata:1
});
function vegSizeCompensation(part){
  const key=part?.kind||part?.baseKey||part?.storageKey||'';
  return VEG_SIZE_COMPENSATION[key]||1;
}
function friedVariantSrc(part,stage){
  const s=Math.max(1,Math.min(7,+stage||1));
  const def=part?.def||{};
  if(s>=6&&def.wellDoneDicedSrc)return def.wellDoneDicedSrc;
  if(s>=4&&def.friedDicedSrc)return def.friedDicedSrc;
  return null;
}
// When real cooked art is being shown, the art already carries its own char
// and color — a light touch only (or none once well-done). The heavier
// synthetic tint stays reserved for vegetables that don't have real fried
// art yet, so raw PNGs still visibly cook.
function foodPieceFilter(stage,usedVariant){
  if(!usedVariant)return genericCookFilter(stage);
  const s=Math.max(1,Math.min(7,+stage||1));
  return s>=6?'none':'brightness(1.01) saturate(1.03)';
}


// v198.5.109 — cleanup: appendFillBase (unused "fill mask" experiment,
// reverted per feedback) removed entirely.

// v198.5.119 — see call site in buildFoodStageLayer for the reasoning.
// v198.5.120 — appendKetchupBase removed (reverted).

// v198.5.122 — the pot bottom should NEVER be visible once anything is in
// it, per direct request: lay the base down IMMEDIATELY (not once pieces
// happen to cover it), matching the vessel's OWN clip shape exactly (so it
// can never mismatch/float as a separate blob), and let it deepen in
// richness (opacity) with quantity rather than grow in size — reads as a
// thin film of oil/sauce coating the floor from the very first ingredient,
// getting richer as more goes in, instead of a shape "growing" over an
// empty area.
// v198.5.124 — appendSauceBase removed for good.



function appendGroundPepperMass(layer,count,stage=1,fillState=null,vessel=null,def=null){
  const amount=Math.max(0,+count||0);
  if(!layer||amount<=0)return null;

  const mass=document.createElement('div');
  mass.className='ground-pepper-mass';
  mass.dataset.ingredientKey=def?.key||'paprika_mlevena';
  mass.dataset.foodForm='ground';
  Object.assign(mass.style,{
    position:'absolute',
    left:'0',top:'0',width:'100%',height:'100%',
    pointerEvents:'none',
    zIndex:'24',
    opacity:'1',overflow:'visible'
  });
  layer.appendChild(mass);
  renderGroundPepperScatter(mass,amount,vessel,def);
  return mass;
}

function groundPepperGeometry(vessel){
  const calibrated=window.CooksterVesselFoodCalibration;
  const profile=calibrated?.get?.(vessel);
  const frame=calibrated?.frame?.(vessel);
  const toLocal=points=>{
    if(!Array.isArray(points)||!frame)return [];
    return points.map(([x,y])=>[
      (x-frame.left)/frame.width*100,
      (y-frame.top)/frame.height*100
    ]);
  };
  const bounds=points=>{
    if(!points.length)return null;
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    return {left:Math.min(...xs),right:Math.max(...xs),
      top:Math.min(...ys),bottom:Math.max(...ys)};
  };
  const bottomPoints=toLocal(profile?.bottom);
  const visiblePoints=toLocal(profile?.foodVisible);
  const bottom=bounds(bottomPoints)||{left:20,right:80,top:48,bottom:82};
  const visible=bounds(visiblePoints)||{left:8,right:92,top:10,bottom:94};
  // Use each vessel's blue-bottom polygon to place the full PNG. Do not
  // inherit the large pan's position or dimensions for the other vessels.
  const areaCenter=points=>{
    let area=0,x=0,y=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],cross=a[0]*b[1]-b[0]*a[1];
      area+=cross;x+=(a[0]+b[0])*cross;y+=(a[1]+b[1])*cross;
    }
    return Math.abs(area)>1e-8?{x:x/(3*area),y:y/(3*area)}:null;
  };
  const center=areaCenter(bottomPoints)||{
    x:(bottom.left+bottom.right)/2,y:(bottom.top+bottom.bottom)/2
  };
  return {
    bottom,visible,center,bottomPoints,visiblePoints,
    bottomClip:bottomPoints.length>=3
      ?`polygon(${bottomPoints.map(([x,y])=>`${x}% ${y}%`).join(',')})`
      :'none',
    visibleClip:visiblePoints.length>=3
      ?`polygon(${visiblePoints.map(([x,y])=>`${x}% ${y}%`).join(',')})`
      :'none'
  };
}

function renderGroundPepperScatter(host,amount,vessel=null,def=null){
  if(!host)return;
  const total=Math.max(0,+amount||0);
  const g=groundPepperGeometry(vessel);
  host.dataset.groundPepperCalibration=
    g.bottomPoints.length>=3&&g.visiblePoints.length>=3?'blue-to-green':'uncalibrated';
  // Scale the WHOLE bitmap, never reveal a fixed oversized one through an
  // expanding mask. Three peppers fill this vessel's blue floor; the next
  // seven raise the mound to its green visible-food boundary. Grinding is
  // fractional and the grinder can be reloaded after each batch of three.
  const floorT=Math.min(1,total/3);
  const riseT=Math.max(0,Math.min(1,(total-3)/7));
  host.style.clipPath='none';
  host.style.webkitClipPath='none';
  host.style.transition='none';
  let img=host.querySelector(':scope > .ground-pepper-single-mass');
  if(!img){
    host.innerHTML='';
    img=document.createElement('img');
    img.className='ground-pepper-single-mass';
    img.src=def?.src||GROUND_PEPPER_RAW_ASSET;
    img.alt='';img.draggable=false;
    host.appendChild(img);
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  const blueWidth=g.bottom.right-g.bottom.left;
  const blueHeight=g.bottom.bottom-g.bottom.top;
  const blueCenterX=(g.bottom.left+g.bottom.right)/2;
  const blueCenterY=(g.bottom.top+g.bottom.bottom)/2;
  const floorWidth=blueWidth*floorT,floorHeight=blueHeight*floorT;
  const floorLeft=blueCenterX-floorWidth/2;
  const floorTop=blueCenterY-floorHeight/2;
  // From the fourth through tenth pepper the lower edge follows this vessel's
  // green boundary while its top and sides reach the visible-food zone.
  const targetLeft=lerp(floorLeft,g.visible.left,riseT);
  const targetRight=lerp(floorLeft+floorWidth,g.visible.right,riseT);
  const targetTop=lerp(floorTop,g.visible.top,riseT);
  const targetBottom=lerp(floorTop+floorHeight,g.visible.bottom,riseT);
  // Opaque art bounds (alpha >= 50%) measured in the 1254×1254 PNG. Align
  // those bounds, not its transparent square canvas, to the calibration.
  const [ax,ay,bx,by]=def?.art||[39,98,1221,1160];
  const art={left:ax/1254,right:bx/1254,top:ay/1254,bottom:by/1254};
  const imageWidth=(targetRight-targetLeft)/(art.right-art.left);
  const imageHeight=(targetBottom-targetTop)/(art.bottom-art.top);
  const imageLeft=targetLeft-art.left*imageWidth;
  const imageTop=targetTop-art.top*imageHeight;
  Object.assign(img.style,{
    position:'absolute',
    left:`${imageLeft.toFixed(3)}%`,
    top:`${imageTop.toFixed(3)}%`,
    width:`${Math.max(1,imageWidth).toFixed(3)}%`,
    height:`${Math.max(1,imageHeight).toFixed(3)}%`,
    transform:'none',
    transition:'left 120ms linear, top 120ms linear, width 120ms linear, height 120ms linear',
    objectFit:'fill',
    clipPath:'none',
    webkitClipPath:'none',
    transformOrigin:'50% 50%',
    pointerEvents:'none',
    zIndex:'24',
    filter:'drop-shadow(0 1px 2px rgba(70,15,8,.18))'
  });
  host.appendChild(img);
}


const SOUR_PILE_WIDTH=120;
function buildFoodStageLayer(counts,stage,metaItems={},batches=[],heat=0,mixLevel=0,fillState=null,vessel=null){
  const roastedByPhase={
    2:+counts.paprika_pecena_2||0,
    3:+counts.paprika_pecena_3||0,
    4:(+counts.paprika_pecena_4||0)+(+counts.paprika_pecena||0)
  };
  const layer=document.createElement('div');
  layer.className='food-stage-layer';
  layer.dataset.foodStage=String(stage);
  if((+stage||1)>=7)layer.classList.add('burnt-lite-layer');

  const mixAmount=Math.max(0,Math.min(1,+mixLevel||0));
  layer.style.setProperty('--stir-mix',mixAmount.toFixed(4));

  const allMixRaw=allSlicedIngredientMix(counts,metaItems);
  const simParts=allMixRaw.filter(p=>p.atlas?.length);
  const allMix=allMixRaw.filter(p=>!p.atlas?.length);
  // v198.5.124 — sauce base removed for good. Back to just the pieces you
  // actually add, nothing extra underneath — no more vessel floor
  // experiments for now.
  if(allMix.length>=1){
    // v198.5.33: exact canonical sliced/diced PNGs stay centered in the vessel.
    // Fill growth expands them toward the food-zone edge. Layers remain visible
    // through deterministic transparent holes instead of being flattened.
    // v198.5.62: the floor is now a genuinely solid, gapless circular pack of
    // real vegetable pieces (see appendBottomCoverageFoundation), so stirring
    // no longer needs a second "mixed" layer to fade into — rotating this one
    // solid disc via --stir-turn already looks fully mixed, with no crossfade,
    // no risk of the food disappearing mid-stir, and no separate hole-patching
    // scatter layer to keep in sync.
    appendCenteredChoppedStack(layer,allMix,stage,fillState,vessel,batches);
  }
  if(simParts.length&&window.CooksterPieceSim)CooksterPieceSim.append(layer,simParts,stage,vessel,fillState);

  // Ground vegetables use their own complete transparent PNG and the same
  // vessel geometry. Keep them separate from sliced/whole produce rendering.
  for(const def of Object.values(GROUND_VEGETABLES))
    appendGroundPepperMass(layer,counts[def.key],stage,fillState,vessel,def);

  // Generic ingredient fallback: if the model has a visual source but the key is
  // neither chopped produce nor a dedicated special form, render it instead of
  // silently dropping it from the vessel.
  for(const [key,val] of Object.entries(counts||{})){
    const count=Math.max(0,+val||0);
    if(count<=0)continue;
    if(GROUND_VEGETABLE_BY_KEY[key]||key.endsWith('_celo')||key.endsWith('_diced')
      ||key.startsWith('paprika_pecena')||isRoastedUnpeeledEggplantKey(key))continue;
    if(allMix.some(p=>p.storageKey===key))continue;
    const meta=metaItems?.[key];
    if(!meta?.src)continue;
    const n=Math.min(8,Math.max(1,Math.round(count)));
    for(let i=0;i<n;i++){
      const img=document.createElement('img');
      img.className='whole-produce-piece generic-vessel-ingredient';
      img.src=meta.src;img.alt='';img.draggable=false;
      const ring=i%4, row=Math.floor(i/4);
      let x=50+[-18,18,-8,10][ring]*(row?0.72:1);
      let y=50+[-10,-8,12,13][ring]-row*11;
      let wd=n===1?58:Math.max(28,48-n*2);
      // chopped sour cabbage is half a head: one big heap filling the calibrated food zone up to the brim
      if(key==='kupus_diced_kiseli'){x=50;y=50;wd=SOUR_PILE_WIDTH;}
      img.style.left=x+'%';
      img.style.top=y+'%';
      img.style.width=wd+'%';
      img.style.transform=`translate(-50%,-50%) rotate(${[-7,8,4,-5][ring]}deg)`;
      img.style.zIndex=String(20+i);
      layer.appendChild(img);
    }
  }

  // Whole raw produce remains whole in every pan/pot/bowl.
  appendWholeProduce(layer,wholeProduceEntries(counts,metaItems),stage,fillState);

  // Whole roasted peppers retain their dedicated phase art.
  appendWholeRoastedPeppers(layer,roastedByPhase[2],2);
  appendWholeRoastedPeppers(layer,roastedByPhase[3],3);
  appendWholeRoastedPeppers(layer,roastedByPhase[4],4);
  return layer;
}


const FOOD_STAGE_FADE_MS=1600;
const FOOD_FILL_FADE_MS=220;

function foodStageLayers(wrap){
  return wrap?Array.from(wrap.children).filter(n=>n.classList?.contains('food-stage-layer')):[];
}
function cancelFoodLayerTransition(wrap){
  if(!wrap)return;
  if(wrap._foodFadeTimer){
    clearTimeout(wrap._foodFadeTimer);
    wrap._foodFadeTimer=null;
  }
  for(const layer of foodStageLayers(wrap)){
    if(window.CooksterTween)CooksterTween.cancel(layer,'foodStageOpacity');
    layer.style.transition='';
  }
}
function pruneFoodLayers(wrap,keep=null){
  const layers=foodStageLayers(wrap);
  for(const layer of layers){
    if(layer!==keep)layer.remove();
  }
}
function enforceFoodLayerBudget(wrap,maxLayers=2){
  const layers=foodStageLayers(wrap);
  if(layers.length<=maxLayers)return;
  // Keep newest visual layers only. Older layers are stale transition leftovers.
  for(let i=0;i<layers.length-maxLayers;i++)layers[i].remove();
}
function fadeFoodLayers(wrap,oldLayer,nextLayer,duration){
  if(!wrap||!nextLayer)return;
  const ms=Math.max(80,+duration||FOOD_STAGE_FADE_MS);
  nextLayer.style.opacity='0';
  nextLayer.style.transition='';
  if(oldLayer)oldLayer.style.transition='';

  // Dataset is updated BEFORE animation work. Even if a browser animation API
  // fails, the renderer cannot enter an infinite retry/append loop.
  if(window.CooksterTween?.opacity){
    CooksterTween.opacity(nextLayer,1,ms,{key:'foodStageOpacity',ease:'linear'});
    if(oldLayer)CooksterTween.opacity(oldLayer,0,ms,{key:'foodStageOpacity',ease:'linear'});
  }else{
    nextLayer.style.transition=`opacity ${ms}ms linear`;
    if(oldLayer)oldLayer.style.transition=`opacity ${ms}ms linear`;
    requestAnimationFrame(()=>{
      nextLayer.style.opacity='1';
      if(oldLayer)oldLayer.style.opacity='0';
    });
  }

  wrap._foodFadeTimer=setTimeout(()=>{
    pruneFoodLayers(wrap,nextLayer);
    nextLayer.style.opacity='1';
    nextLayer.style.transition='';
    wrap._foodFadeTimer=null;
  },ms+40);
}
function renderFoodContents(wrap,counts,stage=1,metaItems={},batches=[],heat=0,mixLevel=0,vesselArg=null){
  if(!wrap)return;
  const groundItems=Object.values(GROUND_VEGETABLES)
    .filter(def=>(+counts?.[def.key]||0)>0);
  const groundKey=groundItems.map(def=>`${def.key}:${+counts[def.key]}`).join('|');

  // Safety net against any stale transition nodes from old saves/runtime paths.
  enforceFoodLayerBudget(wrap,2);

  const keys=Object.keys(counts||{}).filter(key=>(+counts[key]||0)>0).sort();
  const count=keys.reduce((sum,key)=>sum+(+counts[key]||0),0);
  const foodCount=keys.reduce((sum,key)=>{
    const meta=metaItems?.[key];
    return meta?.type==='staple'?sum:sum+(+counts[key]||0);
  },0);
  const vessel=vesselArg||wrap.closest?.('.item')||null;
  const fillState=vesselFillState(vessel,foodCount);
  const stirMix=Math.max(0,Math.min(1,+mixLevel||0));
  wrap.style.filter='';
  wrap.style.setProperty('--stir-mix',stirMix.toFixed(4));
  applyVesselFillState(wrap,fillState);

  if(count<=0){
    cancelFoodLayerTransition(wrap);
    wrap.innerHTML='';
    wrap.classList.remove('visible');
    wrap.style.removeProperty('--food-fill');
    wrap.dataset.fillLevel='0';
    wrap.dataset.fillRatio='0';
    delete wrap.dataset.foodStage;
    delete wrap.dataset.foodCounts;
    return;
  }

  wrap.classList.add('visible');

  const stageKey=String(stage);
  const batchOrderKey=(Array.isArray(batches)?batches:[])
    .filter(b=>(+b?.count||0)>0)
    .map(b=>`${String(b.key||'ingredient')}:${Math.max(0,+b.count||0)}:${String(b.id||'')}`)
    .join('>');
  const countKey=`${keys.map(key=>`${key}:${Math.max(0,+counts[key]||0)}`).join('|')}||order:${batchOrderKey}`;
  const nonGroundOrderKey=(Array.isArray(batches)?batches:[])
    .filter(b=>(+b?.count||0)>0&&!GROUND_VEGETABLE_BY_KEY[String(b.key||'')])
    .map(b=>`${String(b.key||'ingredient')}:${Math.max(0,+b.count||0)}:${String(b.id||'')}`)
    .join('>');
  const groundStaticKey=`${keys.filter(key=>!GROUND_VEGETABLE_BY_KEY[key])
    .map(key=>`${key}:${Math.max(0,+counts[key]||0)}`).join('|')}||order:${nonGroundOrderKey}||stage:${stageKey}`;
  let layers=foodStageLayers(wrap);
  let current=layers[layers.length-1]||null;
  if(current)current.style.setProperty('--stir-mix',stirMix.toFixed(4));

  if(!current){
    wrap.innerHTML='';
    const first=buildFoodStageLayer(counts,stage,metaItems,batches,heat,stirMix,fillState,vessel);
    first.style.opacity='1';
    wrap.appendChild(first);
    wrap.dataset.foodStage=stageKey;
    wrap.dataset.foodCounts=countKey;
    wrap._groundPepperStaticKey=groundStaticKey;
    wrap._groundVegetableRenderedKey=groundKey;
    return;
  }

  // Update existing ground images in place during grinding. A newly added or
  // removed vegetable needs a rebuilt layer; otherwise no crossfade per tick.
  const groundMasses=[...current.querySelectorAll('.ground-pepper-mass')];
  const sameGroundSet=groundMasses.length===groundItems.length&&
    groundItems.every(def=>groundMasses.some(m=>m.dataset.ingredientKey===def.key));
  if(groundItems.length&&sameGroundSet&&
     wrap._groundPepperStaticKey===groundStaticKey&&
     wrap._groundVegetableRenderedKey!==groundKey){
    for(const def of groundItems){
      const mass=groundMasses.find(m=>m.dataset.ingredientKey===def.key);
      renderGroundPepperScatter(mass,counts[def.key],vessel,def);
    }
    wrap._groundVegetableRenderedKey=groundKey;
    wrap.dataset.foodCounts=countKey;
    return;
  }

  const compositionChanged=wrap.dataset.foodCounts!==countKey;
  const stageChanged=wrap.dataset.foodStage!==stageKey;
  if(!compositionChanged&&!stageChanged)return;

  // IMPORTANT: collapse any in-progress transition before starting another.
  // Browned -> burnt occurs faster than the old 3 second fade, so failing to
  // collapse here left hidden full food trees alive forever.
  cancelFoodLayerTransition(wrap);
  layers=foodStageLayers(wrap);
  current=layers[layers.length-1]||current;
  pruneFoodLayers(wrap,current);

  const next=buildFoodStageLayer(counts,stage,metaItems,batches,heat,stirMix,fillState,vessel);
  wrap.appendChild(next);

  // Commit renderer state before any visual animation call.
  wrap.dataset.foodStage=stageKey;
  wrap.dataset.foodCounts=countKey;
  wrap._groundPepperStaticKey=groundStaticKey;
  wrap._groundVegetableRenderedKey=groundKey;

  if((+stage||1)>=7){
    // Burnt is a terminal visual phase: one tree only, no doubled crossfade.
    pruneFoodLayers(wrap,next);
    next.style.opacity='1';
    return;
  }

  fadeFoodLayers(
    wrap,
    current,
    next,
    compositionChanged?FOOD_FILL_FADE_MS:FOOD_STAGE_FADE_MS
  );
}
function renderPanTomatoes(pan,modelOverride=null,stateOverride=null){
 if(!pan||!pan._panContent)return;
 const model=modelOverride||CooksterPan.read(pan);
 const counts={...model.ingredients};
 const stage=stateOverride?.visualStage||window.CooksterFoodStateMachine?.vesselState(model)?.visualStage||panTextureStage(Math.max(0,+model.doneness||0),!!model.burnt);
  renderFoodContents(pan._panContent,counts,stage,readPanIngredientMeta(pan),model.batches||[],model.heat||0,model.mix||0,pan);
}

function getPanIngredientLabel(pan){
 const c=getPanCounts(pan),present=Object.entries(c).filter(([,v])=>(+v||0)>0).map(([k])=>k);
 if(present.length>1)return 'mešavina';
 const raw=present[0]||'';
  const key=isRoastedChoppedPepperKey(raw)?'paprika':
    isRoastedUnpeeledEggplantKey(raw)?'patlidzan':
    (raw.endsWith('_celo')?raw.slice(0,-5):(raw.endsWith('_diced')?raw.slice(0,-6):raw));
 return VEGETABLES[key]?.label?.toLowerCase?.()||'sastojci';
}

function updateCookingStatus(vessel,modelOverride=null,stateOverride=null,countOverride=null,heatingOverride=null){
  if(!vessel||!isHeatableCookwareItem(vessel))return;
  ensureCookingEffects(vessel);
  if(!vessel._panStatus)return;

  const model=modelOverride||CooksterPan.read(vessel);
  const hasCountOverride=countOverride!==null&&countOverride!==undefined&&Number.isFinite(+countOverride);
  const count=hasCountOverride?+countOverride:panModelTotal(model);
  const state=stateOverride||window.CooksterFoodStateMachine?.vesselState(model)||{
    phase:{id:model.burnt?'burnt':((+model.doneness||0)>=1?'cooked':'heating'),label:model.burnt?'Izgorelo':'Kuva se'},
    progress:Math.max(0,Math.min(1,+model.doneness||0))
  };
  const heating=typeof heatingOverride==='boolean'?heatingOverride:vesselIsHeating(vessel);
  const progress=Math.max(0,Math.min(1,+state.progress||0));
  const phase=state.phase?.id||'raw';
  const isBurnt=phase==='burnt'||!!model.burnt;
  const visible=count>0&&heating;
  const labelText=state.phase?.label||'Kuva se';
  const strongSmoke=phase==='browned'||phase==='burnt';
  // v198.5.56: stirring hot food kicks up visible steam immediately instead of
  // waiting for cook progress to cross the old 42% threshold.
  // v198.5.88: steam now starts exactly when the cook progress bar crosses
  // its halfway point, per request — simple and matches what the player
  // sees on the bar, instead of a separate stirring-based early trigger.
  const smokeVisible=count>0&&progress>=.12&&(heating||(+model.heat||0)>.1);   // also while the pan cools off the fire

  const uiKey=`${visible?1:0}|${phase}|${isBurnt?1:0}|${heating?1:0}|${strongSmoke?1:0}|${smokeVisible?1:0}|${labelText}`;
  if(vessel._cookUiKey!==uiKey){
    vessel._cookUiKey=uiKey;
    vessel._panStatus.classList.toggle('visible',visible);
    vessel._panStatus.dataset.phase=phase;
    if(!visible)vessel._panStatus.style.display='';
    vessel.dataset.foodState=phase;
    if(vessel._cookStateLabel)vessel._cookStateLabel.textContent=labelText;
    vessel._panStatus.classList.toggle('ready',phase==='cooked');
    vessel._panStatus.classList.toggle('browned',phase==='browned');
    vessel._panStatus.classList.toggle('burnt',isBurnt);
    vessel.classList.toggle('food-burnt',isBurnt);
    if(vessel._panSmoke){
      vessel._panSmoke.classList.toggle('visible',smokeVisible);
      vessel._panSmoke.classList.toggle('strong',strongSmoke);
    }
  }

  const progressBucket=Math.round(progress*200); // 0.5% visual resolution
  if(vessel._cookProgressBucket!==progressBucket){
    vessel._cookProgressBucket=progressBucket;
    if(vessel._cookProgressFill)
      vessel._cookProgressFill.style.width=`${(progressBucket/2).toFixed(1)}%`;
  }
  positionCookingHud(vessel);
}
function updatePanStatus(pan){updateCookingStatus(pan);}
function resetPanToClean(pan){
 if(!pan)return;
 setCookwareOnStove(pan,false);
 delete pan.dataset.readyAnnounced;delete pan.dataset.renderBucket;delete pan.dataset.panVegKey;
 pan._terminalBurntRaw='';pan._terminalBurntModel=null;pan._terminalBurntState=null;pan._terminalBurntCount=0;
 pan._cookUiKey='';pan._cookProgressBucket=-1;
 CooksterPan.reset(pan);
 if(pan._panContent){pan._panContent.style.opacity='1';pan._panContent.style.filter='';}
 if(pan._washFoam)pan._washFoam.style.opacity='0';
 pan.classList.remove('pan-washing','sizzling','stirring-vessel','food-burnt');
 renderCookwareContents(pan);if(isHeatableCookwareItem(pan))updateCookingStatus(pan);
}
function positionPanInSink(e){
 if(!panWashing||!washPan)return;
 const p=screenToScene(e.clientX,e.clientY),b=sinkBasinBounds();
 const vis=surfaceScaleFor(washPan,'sink-basin',p.y);
 const bw=(+washPan.dataset.baseW||170)*vis,bh=(+washPan.dataset.baseH||160)*vis;
 const cx=Math.max(b.left+bw*.34,Math.min(b.right-bw*.34,p.x));
 const centerY=Math.max(b.top+bh*.34,Math.min(b.bottom-bh*.28,p.y));
 const by=centerY+bh*.50;
 setPose(washPan,cx,by,vis);
 washPan.style.transformOrigin='50% 50%';
 washPan.style.transform=`rotate(${+(washPan.dataset.angle||0)-12}deg)`;
 washPan.style.zIndex='10010';
 if(washPan._contactShadow)washPan._contactShadow.style.opacity='0';
}
function beginPanWashing(pan,e){
 if(!pan||!isHeatableCookwareItem(pan))return false;
 if(!faucetOn){showToast('Prvo klikni na slavinu da pustiš vodu.');return true;}
 if(!CooksterPan.read(pan).burnt){showToast('Posuđe nije zagorelo — nema šta da se pere.');return true;}
 panWashing=true;washPan=pan;washPointerId=e.pointerId;washArc=0;washActiveTime=0;washDirection=0;washProgress=0;washLastTime=performance.now();
 const c=washCenterScreen();washLastAngle=Math.atan2(e.clientY-c.y,e.clientX-c.x);
 pan.classList.add('pan-washing');hidePlacementGhost();hideOriginGhost();clearHeldPlacementState(pan);
 if(pan._washFoam)pan._washFoam.style.opacity='.28';
 positionPanInSink(e);
 showToast('Drži levi klik i kružno pomeraj posuđe pod vodom.');
 return true;
}
function updatePanWashing(e){
 if(!panWashing||!washPan)return;
 positionPanInSink(e);
 const c=washCenterScreen(),dx=e.clientX-c.x,dy=e.clientY-c.y,r=Math.hypot(dx,dy);
 const a=Math.atan2(dy,dx),now=performance.now(),dt=Math.max(.008,Math.min(.08,(now-washLastTime)/1000||.016));washLastTime=now;
 if(r<Math.max(15,20*scale)||r>Math.max(115,135*scale)){washLastAngle=a;washDirection=0;return;}
 const d=normalizeAngleDelta(a-washLastAngle);washLastAngle=a;
 if(Math.abs(d)>.82)return;
 const dir=Math.sign(d);
 if(Math.abs(d)>.012){
   if(washDirection&&dir&&dir!==washDirection){washDirection=dir;}else if(dir)washDirection=dir;
   washArc+=Math.abs(d);
   washActiveTime+=dt;
 }
 const arcProgress=Math.min(1,washArc/(Math.PI*2*2.35));
 const timeProgress=Math.min(1,washActiveTime/2.4);
 washProgress=Math.min(arcProgress,timeProgress);
 if(washPan._washFoam)washPan._washFoam.style.opacity=String(.26+washProgress*.68);
 if(washPan._panContent)washPan._panContent.style.opacity=String(Math.max(.22,1-washProgress*.72));
 if(washProgress>=.999){
   const done=washPan;
   resetPanToClean(done);
   showToast('Posuđe je oprano — opet je kao novo.');
   endPanWashing(true);
 }
}
function endPanWashing(finished=false){
 if(!panWashing)return;
 const pan=washPan;
 if(pan){
   pan.classList.remove('pan-washing');
   if(pan._washFoam)pan._washFoam.style.opacity='0';
   if(pan._panContent&&!finished)pan._panContent.style.opacity='1';
 }
 panWashing=false;washPan=null;washPointerId=null;washLastAngle=null;washArc=0;washActiveTime=0;washLastTime=0;washDirection=0;washProgress=0;
 if(holding&&!finished){updatePlacementGhost();}
 else if(holding&&finished){updatePlacementGhost();}
 updateHover();
}
function stainAt(x,y){
 for(const n of document.elementsFromPoint(x,y)){const st=n.closest?.('.spill-stain,.floor-stain');if(st)return st;}return null;
}
function isSponge(el){return !!el&&el.dataset.itemId==='sundjer'}
// v198.5.127 — mop for floor stains, separate tool from the counter sponge.
// NOTE: using 'dzoger' as a placeholder item id — tell me if you want a
// different id to match your catalog/asset naming and I'll rename this.
function isMop(el){return !!el&&(el.dataset.itemId==='metla'||el.dataset.itemId==='dzoger')}
function isCleaningTool(el){return isSponge(el)||isMop(el)}
// A tool only cleans ITS OWN kind of stain — sponge<->counter, mop<->floor.
function toolMatchesStain(tool,stain){
 if(!tool||!stain)return false;
 if(stain.classList.contains('floor-stain'))return isMop(tool);
 if(stain.classList.contains('spill-stain'))return isSponge(tool);
 return false;
}
let lastFloorSpillAt=0;
// v198.5.128 — canvas-based stains: each stain is a real erasable surface.
// The cleaning tool punches transparent holes exactly where it passes over
// it (destination-out compositing), so what gets clean is determined by
// where you actually wiped, not an abstract stroke/reversal counter.
const STAIN_W=110,STAIN_H=78;
// v198.5.129 — real stain art (your extracted PNGs) instead of vector
// placeholders. One shared pool used for both counter and floor stains
// (pick whichever fits once you've calibrated them — nothing stops you
// from limiting a specific one to counter-only or floor-only later).
const STAIN_ASSET_NAMES=[
  'chocolate_blob','chocolate_splatter','coffee_ring','egg_shell_cracking',
  'egg_shell_mess','egg_yolk_broken','flour_pile','hot_sauce_splat',
  'ketchup_chunky_splat','ketchup_squeeze','milk_splat','oil_puddle',
  'pesto_splat','stew_puddle',
  'chocolate_splat_toon_big',
  'cream_splat_toon_small','cream_splat_toon_big',
  'ketchup_splat_toon_small','ketchup_splat_toon_big',
  'mustard_splat_toon_big',
  'fried_egg_toon','pesto_splat_toon_big'
];
const STAIN_IMAGE_CACHE={};
function stainImage(name){
  if(!STAIN_IMAGE_CACHE[name]){
    const img=new Image();
    img.src=`assets/stains/${name}.png`;
    STAIN_IMAGE_CACHE[name]=img;
  }
  return STAIN_IMAGE_CACHE[name];
}
const STAIN_POSE_STORAGE_KEY='cookster.stain-calibration.v1';
// v198.5.138 — baked-in defaults from your calibration pass, so this
// persists in the actual game files (not just your browser's localStorage).
// The three unavailable assets were removed from the active stain pool:
// wine_jam_smear, chocolate_splat_toon_small, mustard_splat_toon_small.
const STAIN_POSE_DEFAULTS=Object.freeze({
  egg_shell_cracking:{offsetX:8.581818181818182,offsetY:-12.102564102564102,scale:0.8200000000000001,rotation:8.259999999999998,tilt:28.7},
  fried_egg_toon:{offsetX:-13.945454545454545,offsetY:-22.692307692307693,scale:0.4600000000000002,rotation:0,tilt:0},
  cream_splat_toon_big:{offsetX:-15.018181818181816,offsetY:-10.58974358974359,scale:0.2,rotation:-7.08,tilt:15.579999999999998},
  stew_puddle:{offsetX:-7.509090909090908,offsetY:4.538461538461538,scale:1,rotation:0,tilt:0},
  coffee_ring:{offsetX:-1.0727272727272728,offsetY:15.128205128205128,scale:0.6400000000000001,rotation:173.45999999999998,tilt:36.9},
  egg_shell_mess:{offsetX:0,offsetY:0,scale:1,rotation:-2.36,tilt:13.94},
  ketchup_squeeze:{offsetX:0,offsetY:0,scale:0.7300000000000001,rotation:4.719999999999983,tilt:4.099999999999984},
  ketchup_chunky_splat:{offsetX:0,offsetY:0,scale:1,rotation:-2.36,tilt:42.64},
  cream_splat_toon_small:{offsetX:0,offsetY:0,scale:0.91,rotation:0,tilt:0},
  pesto_splat_toon_big:{offsetX:0,offsetY:0,scale:1,rotation:-5.900000000000001,tilt:45.92},
  pesto_splat:{offsetX:0,offsetY:0,scale:1,rotation:-7.08,tilt:29.52},
  ketchup_splat_toon_small:{offsetX:0,offsetY:0,scale:1,rotation:0,tilt:6.56},
  hot_sauce_splat:{offsetX:0,offsetY:0,scale:0.7300000000000001,rotation:20.060000000000002,tilt:33.62},
  mustard_splat_toon_big:{offsetX:0,offsetY:0,scale:0.7300000000000001,rotation:0,tilt:0},
  flour_pile:{offsetX:0,offsetY:0,scale:1,rotation:-2.36,tilt:14.76},
  chocolate_splat_toon_big:{offsetX:0,offsetY:0,scale:1,rotation:-529.8199999999998,tilt:30.799999999999997},
  chocolate_splatter:{offsetX:0,offsetY:0,scale:1,rotation:330.4,tilt:3.280000000000009},
  milk_splat:{offsetX:0,offsetY:0,scale:1,rotation:15.34,tilt:16.4},
  egg_yolk_broken:{offsetX:0,offsetY:0,scale:1,rotation:-3.54,tilt:0.82},
  chocolate_blob:{offsetX:0,offsetY:0,scale:0.91,rotation:-2.3600000000000003,tilt:4.099999999999998},
  ketchup_splat_toon_big:{offsetX:0,offsetY:0,scale:1,rotation:8.26,tilt:41.00000000000001},
  oil_puddle:{offsetX:0,offsetY:0,scale:0.7300000000000001,rotation:369.3399999999999,tilt:-7.84}
});
let STAIN_POSES={...STAIN_POSE_DEFAULTS};
try{
  const savedStainPoses=JSON.parse(localStorage.getItem(STAIN_POSE_STORAGE_KEY)||'{}')||{};
  STAIN_POSES={...STAIN_POSE_DEFAULTS,...savedStainPoses};
}catch(_){}
function stainPose(name){
  return STAIN_POSES[name]||{offsetX:0,offsetY:0,scale:1,rotation:0,tilt:0};
}
window.CooksterStainCalibration={
  assetNames:STAIN_ASSET_NAMES,
  getPose:stainPose,
  setPose(name,pose){
    STAIN_POSES[name]={
      offsetX:+pose.offsetX||0,offsetY:+pose.offsetY||0,
      scale:Math.max(.1,+pose.scale||1),rotation:+pose.rotation||0,
      tilt:Math.max(-80,Math.min(80,+pose.tilt||0))
    };
    try{localStorage.setItem(STAIN_POSE_STORAGE_KEY,JSON.stringify(STAIN_POSES));}catch(_){}
  },
  preview(canvas,name){paintStainAsset(canvas.getContext('2d'),canvas.width,canvas.height,name);},
  previewPose(canvas,name,pose){paintStainAsset(canvas.getContext('2d'),canvas.width,canvas.height,name,pose);},
  exportAll(){return {...STAIN_POSES};}
};
function paintPlaceholderStain(ctx,w,h,brown){
  ctx.clearRect(0,0,w,h);
  const cx=w*.46,cy=h*.46,rx=w*.46,ry=h*.40;
  const base=brown?['rgba(58,44,30,.90)','rgba(74,56,36,.80)','rgba(40,30,20,.60)']
                  :['rgba(168,42,25,.92)','rgba(203,58,31,.84)','rgba(141,31,20,.64)'];
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
  g.addColorStop(0,base[0]);g.addColorStop(.5,base[1]);g.addColorStop(1,base[2]);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();
  const speckle=brown?'#4a3822':'#b53722';
  ctx.fillStyle=speckle;
  ctx.beginPath();ctx.arc(w*.18,h*.30,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(w*.80,h*.68,3,0,Math.PI*2);ctx.fill();
}
function paintStainAsset(ctx,w,h,name,poseOverride){
  ctx.clearRect(0,0,w,h);
  const img=stainImage(name);
  const pose=poseOverride||stainPose(name);
  const draw=()=>{
    ctx.clearRect(0,0,w,h);
    const iw=img.naturalWidth||1,ih=img.naturalHeight||1;
    const fit=Math.min(w/iw,h/ih)*Math.max(.2,pose.scale);
    const dw=iw*fit,dh=ih*fit;
    const cx=w/2+(pose.offsetX/100)*w, cy=h/2+(pose.offsetY/100)*h;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(pose.rotation*Math.PI/180);
    // v198.5.136 — "pitch"/tilt around the X axis. Canvas 2D has no real 3D,
    // so this is simulated the same way a CSS rotateX() reads visually: the
    // image compresses vertically (foreshortening) as it tilts away from you.
    const tiltRad=((pose.tilt||0)*Math.PI)/180;
    ctx.scale(1,Math.max(.12,Math.cos(tiltRad)));
    ctx.drawImage(img,-dw/2,-dh/2,dw,dh);
    ctx.restore();
  };
  if(img.complete&&img.naturalWidth){draw();}
  else{
    paintPlaceholderStain(ctx,w,h,true);
    img.addEventListener('load',()=>{
      // Only redraw with the real art if nothing has erased this stain yet
      // (avoid resurrecting an already-cleaned canvas after a slow image load).
      if((+ctx.canvas._remaining||1)>=0.999)draw();
    },{once:true});
  }
}
function makeStainCanvas(className,assetName){
  const st=document.createElement('canvas');
  st.className=className;
  st.width=STAIN_W;st.height=STAIN_H;
  st._w=STAIN_W;st._h=STAIN_H;
  st._remaining=1;
  st.dataset.stainAsset=assetName;
  // v198.5.130 — each stain instance gets its own random opacity (50%-100%)
  // for variety, instead of every stain looking identically "fresh".
  st.style.opacity=(0.5+Math.random()*0.5).toFixed(2);
  const ctx=st.getContext('2d');
  paintStainAsset(ctx,STAIN_W,STAIN_H,assetName);
  return st;
}
// v198.5.139 — stain "appearance logic": which splat can show up depends on
// what you're actually working with, not pure chance across the active pool.
// Egg/chocolate/milk/flour/coffee stains are LOCKED to their matching
// ingredient and never appear otherwise; everything else (ketchup, mustard,
// pesto, hot sauce, oil, stew) is free to appear at random always.
const STAIN_CATEGORIES=Object.freeze({
  egg:['egg_shell_cracking','egg_shell_mess','egg_yolk_broken','fried_egg_toon'],
  chocolate:['chocolate_blob','chocolate_splatter','chocolate_splat_toon_big'],
  milk:['milk_splat','cream_splat_toon_small','cream_splat_toon_big'],
  flour:['flour_pile'],
  coffee:['coffee_ring'],
  generic:['ketchup_chunky_splat','ketchup_squeeze','ketchup_splat_toon_small','ketchup_splat_toon_big',
           'mustard_splat_toon_big','pesto_splat','pesto_splat_toon_big',
           'hot_sauce_splat','oil_puddle','stew_puddle']
});
// NOTE: eggs/chocolate/milk/flour/coffee don't exist as real ingredients in
// the game yet (per our conversation, you're planning to add them soon).
// These are PLACEHOLDER ingredient keys — once you add the real ones, tell
// me the actual keys and I'll update this list to match (until then, these
// categories simply never trigger, which is correct/expected for now).
const STAIN_CATEGORY_TRIGGER_KEYS=Object.freeze({
  egg:['jaje'],
  chocolate:['cokolada','čokolada'],
  milk:['mleko'],
  flour:['brasno','brašno'],
  coffee:['kafa']
});
function pickFrom(pool){return pool[Math.floor(Math.random()*pool.length)];}
function stainAssetForIngredientKeys(keys){
  const keySet=new Set((Array.isArray(keys)?keys:[]).map(k=>String(k||'').toLowerCase()));
  for(const [cat,triggerKeys] of Object.entries(STAIN_CATEGORY_TRIGGER_KEYS)){
    if(triggerKeys.some(k=>keySet.has(k)))return pickFrom(STAIN_CATEGORIES[cat]);
  }
  return pickFrom(STAIN_CATEGORIES.generic);
}
// v198.5.139 — randomStainAsset() retired: createSpill/createFloorSpill now
// call stainAssetForIngredientKeys() instead, so the splat that appears
// actually matches what you're working with.
// v198.5.131 — calibration helpers: lay every stain asset out on the table
// at once (so you can calibrate them all in one pass against the real
// surface, not one at a time), and hide/show market bags out of the way.
function layoutAllStainsOnSurface(zoneName){
  document.querySelectorAll('.stain-calib-layout').forEach(el=>el.remove());
  const b=placementGeometry.SURFACES[zoneName]||placementGeometry.SURFACES.table;
  const cols=5,rows=Math.ceil(STAIN_ASSET_NAMES.length/cols);
  const cellW=(b.right-b.left)/cols, cellH=(b.bottom-b.top)/rows;
  STAIN_ASSET_NAMES.forEach((name,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    const x=b.left+cellW*(col+.5), y=b.top+cellH*(row+.5);
    const st=makeStainCanvas('spill-stain stain-calib-layout',name);
    st.style.left=x+'px';st.style.top=y+'px';
    st.style.opacity='1';
    st.style.zIndex='9500';
    scene.appendChild(st);
  });
  return STAIN_ASSET_NAMES.length;
}
function clearStainLayout(){
  const n=document.querySelectorAll('.stain-calib-layout').length;
  document.querySelectorAll('.stain-calib-layout').forEach(el=>el.remove());
  return n;
}
function setBagsHidden(hidden){
  const list=document.querySelectorAll('.market-bag-item');
  list.forEach(el=>{
    el.style.display=hidden?'none':'';
    if(el._contactShadow)el._contactShadow.style.display=hidden?'none':'';
  });
  return list.length;
}
window.CooksterStainCalibration.layoutOnTable=()=>layoutAllStainsOnSurface('table');
window.CooksterStainCalibration.layoutOnFloor=()=>layoutAllStainsOnSurface('floor');
window.CooksterStainCalibration.clearLayout=clearStainLayout;
window.CooksterStainCalibration.setBagsHidden=setBagsHidden;
function createFloorSpill(ingredientKey){
 // v198.5.127 — occasional floor mess while chopping/preparing, separate
 // from the counter-splash-while-stirring trigger.
 const now=performance.now();if(now-lastFloorSpillAt<4000)return;lastFloorSpillAt=now;
 const b=placementGeometry.SURFACES.floor;
 const x=b.left+20+Math.random()*(b.right-b.left-40);
 const y=b.top+14+Math.random()*(b.bottom-b.top-28);
 const st=makeStainCanvas('floor-stain',stainAssetForIngredientKeys([ingredientKey]));
 st.style.left=x+'px';st.style.top=y+'px';
 st.style.setProperty('--r',((Math.random()*50)-25)+'deg');
 scene.appendChild(st);
 popArtPuff(x,y,.4);
}
function createSpill(pan){
 const now=performance.now();if(now-lastSpillAt<1200)return;lastSpillAt=now;
 const cx=+pan.dataset.cx,by=+pan.dataset.by,w=pan.offsetWidth,h=pan.offsetHeight;
 const side=Math.random()<.5?-1:1;
 const x=cx+side*(w*.42+28+Math.random()*24), y=by-h*.24+(Math.random()-.5)*36;
 const panIngredientKeys=Object.keys(window.CooksterPan?.read?.(pan)?.ingredients||{});
 const st=makeStainCanvas('spill-stain',stainAssetForIngredientKeys(panIngredientKeys));
 st.style.left=x+'px';st.style.top=y+'px';st.style.setProperty('--r',((Math.random()*50)-25)+'deg');
 scene.appendChild(st);
 const label=getPanIngredientLabel(pan)==='mešavina'?'mešavina':getPanIngredientLabel(pan);
 popArtPuff(x,y,.45);showToast('Baš brzo mešaš — '+label+' je isprskao površinu!');
}
function stainLocalPoint(stain,sceneX,sceneY){
 const ccx=parseFloat(stain.style.left)||0,ccy=parseFloat(stain.style.top)||0;
 const rDeg=parseFloat(stain.style.getPropertyValue('--r'))||0;
 const rad=-rDeg*Math.PI/180;
 const dx=sceneX-ccx,dy=sceneY-ccy;
 const cos=Math.cos(rad),sin=Math.sin(rad);
 const lx=dx*cos-dy*sin,ly=dx*sin+dy*cos;
 return {x:lx+stain._w/2,y:ly+stain._h/2};
}
function eraseStainAt(stain,px,py,radius){
 const ctx=stain.getContext('2d');
 ctx.save();
 ctx.globalCompositeOperation='destination-out';
 const grad=ctx.createRadialGradient(px,py,0,px,py,radius);
 grad.addColorStop(0,'rgba(0,0,0,.95)');
 grad.addColorStop(.7,'rgba(0,0,0,.7)');
 grad.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=grad;
 ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function stainRemainingOpacity(stain){
 const ctx=stain.getContext('2d');
 const data=ctx.getImageData(0,0,stain._w,stain._h).data;
 let sum=0;
 for(let i=3;i<data.length;i+=4)sum+=data[i];
 return sum/(255*stain._w*stain._h);
}
function beginCleaning(stain,e){
 if(!isCleaningTool(holding)||!stain||!toolMatchesStain(holding,stain))return false;
 cleaning=true;cleanStainEl=stain;cleanPointerId=e.pointerId;cleanLastX=e.clientX;cleanLastY=e.clientY;
 const p=screenToScene(e.clientX,e.clientY);
 stain._lastLocal=stainLocalPoint(stain,p.x,p.y);
 stain.classList.add('scrubbing');holding.classList.add('cleaning-tool');hidePlacementGhost();hideOriginGhost();
 positionCleaningSponge(e);
 showToast(isMop(holding)?'Drži levi klik i gura džoger preko mrlje.':'Drži levi klik i trljaj sunđerom preko mrlje.');
 return true;
}
function positionCleaningSponge(e){
 if(!holding||!isCleaningTool(holding))return;
 const p=screenToScene(e.clientX,e.clientY);
 const vis=Math.max(.92,Math.min(1.12,perspectiveAt(p.y)));
 const w=(+holding.dataset.baseW||74)*vis,h=(+holding.dataset.baseH||45)*vis;
 holding.dataset.cx=String(p.x);holding.dataset.by=String(p.y+h*.35);holding.dataset.vis=String(vis);
 holding.style.width=w+'px';holding.style.height=h+'px';
 holding.style.left=(p.x-w*.50)+'px';holding.style.top=(p.y-h*.52)+'px';
 holding.style.transformOrigin='50% 50%';holding.style.transform=`rotate(${+(holding.dataset.angle||-8)}deg)`;
 holding.style.zIndex='12050';
 if(holding._contactShadow)holding._contactShadow.style.opacity='0';
}
function updateCleaning(e){
 if(!cleaning||!cleanStainEl||!holding||!isCleaningTool(holding))return;
 positionCleaningSponge(e);
 if(!cleanStainEl.isConnected){endCleaning();return;}
 const stain=cleanStainEl;
 const p=screenToScene(e.clientX,e.clientY);
 const local=stainLocalPoint(stain,p.x,p.y);
 // Only erase while the tool is actually reasonably over the stain's own
 // canvas area (a little slop beyond the edge so grazing strokes still count).
 const margin=18;
 const overStain=local.x>-margin&&local.x<stain._w+margin&&local.y>-margin&&local.y<stain._h+margin;
 if(overStain){
   const prev=stain._lastLocal||local;
   const dist=Math.hypot(local.x-prev.x,local.y-prev.y);
   const steps=Math.max(1,Math.ceil(dist/6));
   const brushR=isMop(holding)?26:20;
   for(let i=1;i<=steps;i++){
     const t=i/steps;
     eraseStainAt(stain,prev.x+(local.x-prev.x)*t,prev.y+(local.y-prev.y)*t,brushR);
   }
   stain._remaining=stainRemainingOpacity(stain);
   stain.dataset.cleanProgress=String(1-stain._remaining);
   if(stain._remaining<=.08){
     stain.classList.remove('scrubbing');
     stain.style.transition='opacity .25s ease';
     stain.style.opacity='0';
     setTimeout(()=>stain.remove(),260);
     playSfxVariant('woodDrop',.10);showToast('Mrlja je obrisana.');
     endCleaning(true);
     return;
   }
 }
 stain._lastLocal=local;
}
function endCleaning(finished=false){
 if(cleanStainEl&&cleanStainEl.isConnected)cleanStainEl.classList.remove('scrubbing');
 if(holding)holding.classList.remove('cleaning-tool');
 cleaning=false;cleanStainEl=null;cleanPointerId=null;
 updatePlacementGhost();updateHover();
}
let simulationFrameId=0;
const simulationErrorLog=new Map();
function reportSimulationError(scope,err){
 const key=String(scope||'simulation');
 const now=Date.now(),last=simulationErrorLog.get(key)||0;
 if(now-last<1500)return;
 simulationErrorLog.set(key,now);
 console.error(`[Cookster v198] ${key} error:`,err);
}
function simulateDirectProduceItem(produce,dt){
 if(!isProduceItem(produce)||produce.dataset.onStoveTop!=='1'||!stoveState.fireOn)return;
 const fireLevel=Math.max(1,Math.min(3,+stoveState.fireLevel||1));

 if(isWholeStoveRoast(produce)){
   const eggplant=isWholePatlidzan(produce);
   let progress=Math.max(0,+produce.dataset.roastProgress||0);
   const roastSeconds=fireLevel===1?42:(fireLevel===2?32:24);
   const roastCfg=VEGETABLES[eggplant?'patlidzan':'paprika']?.cooking||{};
   const roastSpeed=progress<.75?(+roastCfg.cookSpeed||1):(+roastCfg.burnSpeed||1);
   progress=Math.min(1.22,progress+(dt/roastSeconds)*roastSpeed);
   produce.dataset.roastProgress=String(progress);
   const phase=eggplant?(progress>=.75?3:(progress>=.25?2:1))
     :(progress>=.75?4:(progress>=.50?3:(progress>=.25?2:1)));
   if(+produce.dataset.roastPhase!==phase){
    produce.dataset.roastPhase=String(phase);
    renderPaprikaRoast(produce);
    if(phase===(eggplant?3:4))showToast(`${eggplant?'Patlidžan':'Paprika'} je ${eggplant?'pečen':'pečena'} — ako ostane na vatri, izgoreće.`);
   }
   if(progress>=1.08){
    const body=produce.querySelector('.body');
    if(body)body.style.filter='brightness(.38) saturate(.55) sepia(.45)';
    produce.dataset.label=eggplant?'Patlidžan · izgoreo':'Paprika · izgorela';
   }
   return;
 }

 let progress=Math.max(0,+produce.dataset.directHeatProgress||0);
 const burnSeconds=fireLevel===1?50:(fireLevel===2?38:28);
 const produceKey=produce.dataset.vegKey||produce.dataset.fruitKey||'';
 const heatCfg=VEGETABLES[produceKey]?.cooking||CooksterCatalog.FRUITS?.[produceKey]?.cooking||{};
 const heatSpeed=progress<.78?(+heatCfg.cookSpeed||1):(+heatCfg.burnSpeed||1);
 progress=Math.min(1.20,progress+(dt/burnSeconds)*heatSpeed);
 produce.dataset.directHeatProgress=String(progress);
 const visualBucket=progress>=1.08?4:(progress>=.78?3:(progress>=.48?2:(progress>=.20?1:0)));
 if(+produce.dataset.directHeatVisualBucket!==visualBucket){
   produce.dataset.directHeatVisualBucket=String(visualBucket);
   renderDirectProduceHeat(produce);
 }
}
function simulateCookingVessel(vessel,dt,now){
 if(!isHeatableCookwareItem(vessel))return;

 const rawContents=vessel.dataset.panContents||'';
 const isHeating=vesselIsHeating(vessel);

 // Terminal fast path: all active food batches are burnt and cannot evolve
 // further. Only react if the physical heat source changes or contents mutate.
 if(vessel._terminalBurntRaw&&vessel._terminalBurntRaw===rawContents){
   if(vessel._terminalBurntHeating!==isHeating){
     syncCookwareHeatFlags(vessel);
     vessel._terminalBurntHeating=isHeating;
     updateCookingStatus(
       vessel,
       vessel._terminalBurntModel,
       vessel._terminalBurntState,
       vessel._terminalBurntCount,
       isHeating
     );
   }
   return;
 }
 if(vessel._terminalBurntRaw&&vessel._terminalBurntRaw!==rawContents){
   vessel._terminalBurntRaw='';
   vessel._terminalBurntModel=null;
   vessel._terminalBurntState=null;
   vessel._terminalBurntCount=0;
 }

 vessel._cookAccum=Math.min(.20,(+vessel._cookAccum||0)+Math.max(0,+dt||0));
 if(vessel._cookAccum<COOK_SIM_INTERVAL)return;
 const stepDt=vessel._cookAccum;
 vessel._cookAccum=0;

 syncCookwareHeatFlags(vessel);
 const fireLevel=Math.max(1,Math.min(3,+stoveState.fireLevel||1));
 const thermal=CooksterCooking.step(vessel,{dt:stepDt,fireLevel,heating:isHeating});
 if(!thermal)return;
 const {model,count}=thermal;

 updateCookingStatus(vessel,model,thermal.state,count,isHeating);

 if(thermal.ready&&vessel.dataset.readyAnnounced!=='1'){
   vessel.dataset.readyAnnounced='1';
   showToast(`${vessel.dataset.label||'Jelo'} je gotovo — skloni posuđe sa vatre!`);
 }
 if(thermal.becameBurnt){
   showToast(`${vessel.dataset.label||'Jelo'} je ostalo predugo na vatri i deo hrane je zagoreo!`);
 }
 if(count<=0)delete vessel.dataset.readyAnnounced;

 const counts=model.ingredients||{};
 const visualStage=thermal.state?.visualStage||panTextureStage(model.doneness,!!model.burnt);
 const ingredientFingerprint=Object.keys(counts).sort().map(k=>`${k}:${+counts[k]||0}`).join('|');
 const bucket=`${visualStage}:${model.burnt?1:0}:${count}:${ingredientFingerprint}`;
 if(vessel.dataset.renderBucket!==bucket && now>=(+vessel._renderRetryAt||0)){
   try{
     renderCookwareContents(vessel,model,thermal.state);
     vessel.dataset.renderBucket=bucket;
     vessel._renderRetryAt=0;
   }catch(err){
     vessel._renderRetryAt=now+650;
     reportSimulationError(`food-render:${vessel.dataset.itemId||'vessel'}`,err);
   }
 }

 if(thermal.allBurnt){
   vessel._terminalBurntRaw=vessel.dataset.panContents||'';
   vessel._terminalBurntModel=model;
   vessel._terminalBurntState=thermal.state;
   vessel._terminalBurntCount=count;
   vessel._terminalBurntHeating=isHeating;
 }
}
function simulationTick(now){
 const dt=Math.min(.05,Math.max(0,(now-simLast)/1000));simLast=now;
 try{
   updateFireTimerBar();
   // One item pass per frame instead of two full passes.
   for(const item of items){
     if(isProduceItem(item)&&item.dataset.onStoveTop==='1'){
       try{simulateDirectProduceItem(item,dt);}
       catch(err){reportSimulationError(`direct-heat:${item?.dataset?.itemId||'produce'}`,err);}
     }
     if(isHeatableCookwareItem(item)){
       try{simulateCookingVessel(item,dt,now);}
       catch(err){reportSimulationError(`cooking:${item?.dataset?.itemId||'vessel'}`,err);}
     }
   }
 }catch(err){
   reportSimulationError('frame',err);
 }finally{
   simulationFrameId=requestAnimationFrame(simulationTick);
 }
}
simulationFrameId=requestAnimationFrame(simulationTick);

function setVegetableSliced(el){
  if(!el)return;
  const isFruit=el.dataset.fruit==='1';
  const key=el.dataset.vegKey||el.dataset.fruitKey||'paradajz';
  const def=(isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES)[key]||VEGETABLES.paradajz;
  if(def.canSlice===false){
    return `${def.label||key} se ne seče na ovaj način.`;
  }

  const legacy=!isFruit&&['paradajz','paprika','luk','krastavac'].includes(key);
  const legacyLabel=key==='paprika'?'isečena paprika':key==='luk'?'isečen luk':key==='krastavac'?'isečen krastavac':'isečen paradajz';
  const legacyW=key==='paradajz'?143:(key==='paprika'?70:(key==='krastavac'?(def.slicedW||92):120));
  const legacyH=key==='paradajz'?83:(key==='paprika'?66:(key==='krastavac'?(def.slicedH||60):76));
  const legacyMsg=key==='paprika'?'Paprika je isečena na kolutove.':key==='luk'?'Luk je isečen.':key==='krastavac'?'Krastavac je isečen na kolutove.':'Paradajz je isečen na kolutove.';

  const sourCut=key==='kupus'&&el.dataset.fermentPhase==='3'&&!!def.slicedSrcSour;       // a sour cabbage cut up is pale, not green
  const cfg={
    label:sourCut?'isečen kiseli kupus':def.slicedLabel||(legacy?legacyLabel:`isečen ${def.label||key}`),
    src:sourCut?def.slicedSrcSour:def.slicedSrc||def.src||el.querySelector('.body')?.getAttribute('src')||'',
    w:def.slicedW||(legacy?legacyW:(def.w||+el.dataset.baseW||70)),
    h:def.slicedH||(legacy?legacyH:(def.h||+el.dataset.baseH||70)),
    msg:def.sliceMessage||(legacy?legacyMsg:`${def.label||key} je isečen.`)
  };
  el.dataset.cutState='sliced';
  el.dataset.label=cfg.label;
  const img=el.querySelector('.body');if(img)img.src=cfg.src;
  const shadowImg=el._contactShadow?.querySelector('img');if(shadowImg)shadowImg.src=cfg.src;
  el.dataset.baseW=String(cfg.w);el.dataset.baseH=String(cfg.h);
  const by=+el.dataset.by,cx=+el.dataset.cx;
  setPose(el,cx,by,surfaceScaleFor(el,el.dataset.surfaceZone||'table',by));
  CooksterSave.schedule();
  return cfg.msg;
}
function setVegetableDiced(el){
  if(!el)return 'Nema sastojka za sitno seckanje.';
  const isFruit=el.dataset.fruit==='1';
  const key=el.dataset.vegKey||el.dataset.fruitKey||'';
  const def=(isFruit?(CooksterCatalog.FRUITS||{}):VEGETABLES)[key]||{};
  if(!def.dicedSrc)return `${def.label||key} nema drugu fazu sečenja.`;
  const roastedPepper=key==='paprika'&&(
    el.dataset.steamedPepper==='1'
    ||(+el.dataset.roastProgress||0)>0
    ||(+el.dataset.roastPhase||0)>=2
  );
  const roastedUnpeeledEggplant=key==='patlidzan'
    &&(
      (+el.dataset.roastProgress||0)>0
      ||(+el.dataset.roastPhase||0)>=2
      ||el.dataset.readyToPeel==='1'
    )
    &&el.dataset.peeled!=='1'
    &&(+el.dataset.peelHits||0)===0
    &&!!def.roastedUnpeeledDicedSrc;
  const choppedPepperSrc=roastedPepper
    ?(el.dataset.peeled==='1'
      ?PAPRIKA_ROAST_CHOPPED_ASSETS.peeled
      :PAPRIKA_ROAST_CHOPPED_ASSETS.unpeeled)
    :roastedUnpeeledEggplant
      ?def.roastedUnpeeledDicedSrc
      :(key==='kupus'&&el.dataset.fermentPhase==='3'&&def.dicedSrcSour?def.dicedSrcSour:def.dicedSrc);

  el.dataset.cutState='diced';
  el.dataset.choppedRoastedPepper=roastedPepper?'1':'0';
  el.dataset.choppedRoastedUnpeeledEggplant=roastedUnpeeledEggplant?'1':'0';
  if(roastedUnpeeledEggplant)el.dataset.readyToPeel='0';
  el.dataset.label=roastedPepper
    ?(el.dataset.peeled==='1'
      ?'Seckana pečena oljuštena paprika'
      :'Seckana pečena neljuštena paprika')
    :roastedUnpeeledEggplant
      ?'Seckan pečen neoljušten patlidžan'
      :(key==='kupus'&&el.dataset.fermentPhase==='3'?'sitno seckan kiseli kupus':def.dicedLabel||`sitno seckan ${def.label||key}`);
  const img=el.querySelector('.body');if(img)img.src=choppedPepperSrc;
  const shadowImg=el._contactShadow?.querySelector('img');if(shadowImg)shadowImg.src=choppedPepperSrc;

  const roastedChopped=roastedPepper||roastedUnpeeledEggplant;
  el.dataset.baseW=String(roastedChopped
    ?Math.max(76,+def.dicedW||+def.slicedW||+def.w||+el.dataset.baseW||96)
    :Math.max(48,+def.dicedW||+def.slicedW||+def.w||+el.dataset.baseW||76));
  el.dataset.baseH=String(roastedChopped
    ?Math.max(58,+def.dicedH||+def.slicedH||+def.h||+el.dataset.baseH||76)
    :Math.max(42,+def.dicedH||+def.slicedH||+def.h||+el.dataset.baseH||64));

  const by=+el.dataset.by,cx=+el.dataset.cx;
  setPose(el,cx,by,surfaceScaleFor(el,el.dataset.surfaceZone||'table',by));
  CooksterSave.schedule();
  return roastedUnpeeledEggplant
    ?'Pečeni, neoljušteni patlidžan je isečen.'
    :def.diceMessage||`${def.label||key} je iseckan na sitne kockice.`;
}
function animateCutTargetCompression(target,impact){
  const body=target?.querySelector?.('.body');if(!body)return;
  const t=Math.max(0,Math.min(1,+impact||0));
  body.style.transformOrigin='50% 86%';
  body.style.transform=`translateY(${(t*2.2).toFixed(2)}px) scale(${(1+t*.028).toFixed(4)},${(1-t*.075).toFixed(4)})`;
}
function releaseCutTargetBounce(target){
  const body=target?.querySelector?.('.body');if(!body)return;
  body.style.transform='';body.style.transformOrigin='';
  try{
    body.animate([
      {transform:'translateY(1.8px) scale(1.025,.945)',offset:0},
      {transform:'translateY(-4.2px) scale(.992,1.028)',offset:.42},
      {transform:'translateY(.9px) scale(1.008,.992)',offset:.76},
      {transform:'translateY(0) scale(1,1)',offset:1}
    ],{duration:235,easing:'cubic-bezier(.20,.72,.26,1)'});
  }catch(_){}
}

function destroyCutProgress(){if(cutProgressEl){cutProgressEl.remove();cutProgressEl=null;}}
function ensureCutProgress(cx,cy){
 destroyCutProgress();
 const wrap=document.createElement('div');wrap.className='cut-progress';
 wrap.innerHTML='<div class="ring"></div><div class="txt">SEČENJE</div>';
 wrap.style.left=cx+'px';wrap.style.top=cy+'px';
 scene.appendChild(wrap);cutProgressEl=wrap;return wrap;
}
function updateCutProgress(progress,cx,cy){
 if(!cutProgressEl)return;
 cutProgressEl.style.left=cx+'px';cutProgressEl.style.top=cy+'px';
 cutProgressEl.querySelector('.ring').style.setProperty('--p',String(Math.max(0,Math.min(100,progress*100))));
}
// cutting a whole sour head: one half stays whole (back into the barrel), the other half is chopped
function spawnSourHalf(target){
 const d=target?.dataset;
 if(!d||d.vegKey!=='kupus'||d.fermentPhase!=='3'||d.kupusHalf==='1')return;
 const veg=VEGETABLES.kupus;
 const w=Math.round(veg.w*.8),h=Math.round(veg.h*.7);
 const x=(+d.cx||0)+veg.w*.75,y=(+d.by||0)-h;
 const half=makeItem({id:'veg_kupus_pola_'+Date.now(),label:'Pola kiselog kupusa',src:'assets/market_veg/kupus_pola_kiseli.webp',x,y,w,h,z:++zCounter,snapProfile:'produce'});
 if(!half)return;
 half.dataset.vegetable='1';half.dataset.collisionProfile='vegetable';half.dataset.vegKey='kupus';half.dataset.cutState='whole';
 half.dataset.fermentPhase='3';half.dataset.kupusHalf='1';
 setPose(half,x+w/2,(+d.by||0),+d.vis||1);
}
function beginCutAction(){
 if(isCutting)return;
 const board=getBoardEl();
 const knife=getKnifeEl();
 const target=findCutTargetOnBoard();
 if(!board||!knife||!target){showToast('Stavi sastojak na dasku.');return;}
 if(window.CooksterTomatoCut?.supports(target)){
   const def=VEGETABLES[target.dataset.vegKey]||{};
   if(def.src&&def.slicedSrc){
     const cutCallbacks={board,onCutSound(){playImpactSound(vegSoundTarget(target),'cut');},onPeelSound(){playImpactSound(peelSoundTarget,'peel');},onDone(src,atlas){
       spawnSourHalf(target);
       showToast(setVegetableDiced(target));
       if(atlas)target.dataset.pieceAtlas=atlas;
       const body=target.querySelector('.body');if(body)body.src=src;
       const shadowImg=target._contactShadow?.querySelector('img');if(shadowImg)shadowImg.src=src;
       CooksterSave.schedule();updateHover();
     }};
     // the tomato is cut as a real 3D solid; if WebGL is not available the flat 2D cutting is used instead
     if(window.CooksterTomatoCut3D?.supports(target)){
       CooksterTomatoCut3D.start(target,def,cutCallbacks).then(ok=>{if(ok===false)CooksterTomatoCut.start(target,def,cutCallbacks);}).catch(()=>CooksterTomatoCut.start(target,def,cutCallbacks));
       return;
     }
     CooksterTomatoCut.start(target,def,cutCallbacks);
     return;
   }
 }
 isCutting=true;document.body.classList.add('cutting-active');clearHover();
 releaseKnifeFromBoardForCut(board);
 const tCx=+target.dataset.cx, tBy=+target.dataset.by, tVis=+target.dataset.vis||1;
 const baseAngle=-22;
 // Centar ostrice (leva strana PNG-a) postavljamo direktno preko paradajza.
 // Noz pocinje malo iznad njega, a chop animacija zatim prolazi kroz sam plod.
 const targetCx=tCx+27*tVis, targetBy=tBy-24*tVis, knifeVis=Math.max(.96,tVis*1.06);
 knife.dataset.angle=String(baseAngle);
 setPose(knife,targetCx,targetBy,knifeVis);
 knife.style.zIndex='11050';
 if(knife._contactShadow)knife._contactShadow.style.opacity='0';
 const progY=(parseFloat(target.style.top)-46*tVis);
 ensureCutProgress(tCx,progY);
 const targetKey=target.dataset.vegKey||target.dataset.fruitKey||'';
 const targetDef=VEGETABLES[targetKey]||CooksterCatalog.FRUITS?.[targetKey]||{};
 const secondPass=target.dataset.cutState==='sliced';
 // v198.5.78: one cut now goes straight whole -> diced (no more intermediate
 // "sliced into rounds" stage) for every vegetable that has diced art — which
 // is all of them in the current catalog. Use the dicing rhythm/timing for
 // that single pass so it doesn't feel rushed. Vegetables without dicedSrc
 // (if any are ever added) still fall back to the old single "sliced" cut.
 const willDice=secondPass||!!targetDef.dicedSrc;
 const chopCount=Math.max(1,Math.round(willDice?(+targetDef.diceChopCount||+targetDef.chopCount||5):(+targetDef.chopCount||4)));
 const duration=Math.max(760,chopCount*(willDice?205:225)), start=performance.now();
 // Broj fizičkih poteza dolazi iz catalog-a, pa svaka namirnica može imati svoj ritam sečenja.
 playImpactSound(vegSoundTarget(target),'cut');
 // v198.5.127 — occasionally a bit of mess ends up on the floor while
 // chopping (separate from the counter splash trigger while stirring).
 if(Math.random()<0.18)createFloorSpill(targetKey);
 function step(now){
   const p=Math.max(0,Math.min(1,(now-start)/duration));
   const cycle=Math.min(chopCount-1,Math.floor(p*chopCount));
   const within=(p*chopCount)-cycle;
   const chopWave=Math.sin(within*Math.PI);
   const drop=30*chopWave;
   const lift=14*(1-chopWave);
   const slide=-1.5*chopWave;
   knife.style.transform=`rotate(${baseAngle}deg) translateY(${(-lift+drop).toFixed(1)}px) translateX(${slide.toFixed(1)}px)`;
   animateCutTargetCompression(target,Math.pow(Math.max(0,chopWave),2.7));
   updateCutProgress(p,tCx,progY);
   const newStrike=Math.floor(p*chopCount*1.0001);
   if(knife._lastStrike!==newStrike && newStrike<chopCount){knife._lastStrike=newStrike;}
   if(p<1){requestAnimationFrame(step);return;}
   knife._lastStrike=-1;
   knife.style.transform=`rotate(${baseAngle}deg)`;
   const beforeState=target.dataset.cutState||'whole';
   if(beforeState==='whole'){
     // v198.5.78: skip the intermediate "sliced" stage when the vegetable
     // has diced art (all 13 currently do) — one cut, straight to kockice.
     showToast(targetDef.dicedSrc?setVegetableDiced(target):setVegetableSliced(target));
   }else if(beforeState==='sliced'){
     // Still supported so any vegetable/save that predates this change (or
     // has no diced art) can finish the old two-step path.
     showToast(setVegetableDiced(target));
   }
   releaseCutTargetBounce(target);
   mountKnifeAsBoardChild(board);
   destroyCutProgress();
   isCutting=false;document.body.classList.remove('cutting-active');
   updateHover();
 }
 requestAnimationFrame(step);
}

function lidAt(x,y){
 const nodes=document.elementsFromPoint(x,y);
 const lid=nodes.find(n=>n.classList?.contains('lid-hit'));
 if(!lid)return null;const item=lid.closest('.item');if(!item||item===holding||item.classList.contains('open'))return null;return {item,lid};
}
function attachToBoard(el,board,mode='relative'){
 if(!el||!board||el===board)return false;
 const bw=board.offsetWidth,bh=board.offsetHeight;
 const bcx=+board.dataset.cx,btop=parseFloat(board.style.top),bcy=btop+bh/2;
 const angle=+(board.dataset.angle||0);
 if(mode==='center'){
   el.dataset.boardRelX='0';
   el.dataset.boardRelY='0.54';
 }else{
   // Save local position relative to the board. Undo current board rotation first.
   const dx=(+el.dataset.cx)-bcx,dy=(+el.dataset.by)-bcy;
   const rad=-angle*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad);
   const lx=dx*cs-dy*sn,ly=dx*sn+dy*cs;
   el.dataset.boardRelX=String(lx/Math.max(1,bw));
   el.dataset.boardRelY=String((ly+bh/2)/Math.max(1,bh));
 }
 el.dataset.boardRelAngle=String((+(el.dataset.angle||0))-angle);
 el.dataset.attachedToBoard='1';
 syncOneBoardAttachment(el,board);
 return true;
}
function detachFromBoard(el){if(!el)return;delete el.dataset.attachedToBoard;delete el.dataset.boardRelX;delete el.dataset.boardRelY;delete el.dataset.boardRelAngle}
function syncOneBoardAttachment(el,board){
 if(!el||!board||el.dataset.attachedToBoard!=='1')return;
 const bw=board.offsetWidth,bh=board.offsetHeight,bcx=+board.dataset.cx,btop=parseFloat(board.style.top),bcy=btop+bh/2;
 const rx=+(el.dataset.boardRelX||0),ry=+(el.dataset.boardRelY||.55);
 const lx=rx*bw,ly=(ry-.5)*bh;
 const a=+(board.dataset.angle||0),rad=a*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad);
 const cx=bcx+(lx*cs-ly*sn),by=bcy+(lx*sn+ly*cs);
 el.dataset.angle=String(a+(+(el.dataset.boardRelAngle||0)));
 let vis=surfaceScaleFor(el,'board',by);
 // Paradajz na dasci je namerno 15% veci da bude citljiviji i prijatniji za secenje.
 if(el.dataset.vegetable==='1'&&el.dataset.vegKey==='paradajz')vis*=1.15;
 if(el.dataset.vegetable==='1'&&el.dataset.vegKey==='paprika'&&el.dataset.cutState!=='sliced')vis*=1.10;
 setPose(el,cx,by,vis);

 // Board attachments must ALWAYS render above the board, including while the board is moving.
 const boardIsHeld=board.classList.contains('held');
 const boardZ=boardIsHeld?7000:parseInt(board.style.zIndex||board.dataset.zBase||1,10);
 const topZ=boardIsHeld?7600:boardZ+300;
 el.style.zIndex=String(topZ);
 if(el._contactShadow){
   el._contactShadow.style.zIndex=String(Math.max(boardZ+2,topZ-1));
 }
}
function syncBoardAttachments(board){
 if(!board)return;
 for(const el of items){
   if(el===board||el.dataset.attachedToBoard!=='1')continue;
   if(el.dataset.itemId==='noz'){
     if(!isCutting)mountKnifeAsBoardChild(board);
     continue;
   }
   syncOneBoardAttachment(el,board);
 }
}


function snapVegetableToBoard(el,board){
 if(!el||(el.dataset.vegetable!=='1'&&el.dataset.fruit!=='1')||!board)return false;
 attachToBoard(el,board,'center');
 syncOneBoardAttachment(el,board);
 const cx=+el.dataset.cx,by=+el.dataset.by,vis=+el.dataset.vis||1;
 popArtPuff(cx,by,Math.max(.55,vis*.72));playSfxVariant('woodDrop',.24);
 showToast(el.dataset.label+' je snepovan na sredinu daske.');
 holding=null;updateHover();return true;
}
function snapKnifeToBoard(el,board){return false;}
function isSlicedVegetable(el){return !!el&&el.dataset.vegetable==='1'&&el.dataset.cutState==='sliced'}
function panAt(x,y){const c=containerAt(x,y);return c&&isPanItem(c)?c:null;}
function clearPanTargets(){
 if(currentContainerTarget){
   currentContainerTarget.classList.remove('pan-target','container-target');
   currentContainerTarget=null;
 }
}
function updatePanTarget(){
 clearPanTargets();
 if(isStirSpoon(holding)){
   const vessel=updateStirReady();
   if(vessel)return vessel;
 }
 if(isIngredientItem(holding)){
   clearStirReady();
   const vessel=resolveIngredientVesselTarget(holding,mouse.x,mouse.y);
   if(vessel){
     currentContainerTarget=vessel;
     vessel.classList.add('container-target');
     if(isPanItem(vessel))vessel.classList.add('pan-target');
     return vessel;
   }
 }
 if(!holding||!isStirSpoon(holding))clearStirReady();
 return null;
}
function addSlicedVegetableToPan(item,pan){return addIngredientToContainer(item,pan);}

function pointOnCrateBody(crate,x,y){
 if(!crate||crate.dataset.crate!=='1')return false;
 const w=crate.offsetWidth,h=crate.offsetHeight;
 const left=parseFloat(crate.style.left),top=parseFloat(crate.style.top);
 if(!w||!h||!Number.isFinite(left)||!Number.isFinite(top))return false;
 const pr=snapProfileFor(crate)||{anchorY:.92};
 const anchorY=pr.anchorY??.92;
 const ox=left+w*.5,oy=top+h*anchorY;
 const ang=-(+(crate.dataset.angle||0))*Math.PI/180;
 const dx=x-ox,dy=y-oy;
 const rx=dx*Math.cos(ang)-dy*Math.sin(ang);
 const ry=dx*Math.sin(ang)+dy*Math.cos(ang);
 const zone=crate.dataset.surfaceZone||'table';
 const flatten=Math.max(.001,surfaceFlattenFor(crate,zone,+crate.dataset.by||top+h));
 const lx=(ox+rx-left)/w;
 const ly=(oy+ry/flatten-top)/h;
 return lx>=.10&&lx<=.90&&ly>=.40&&ly<=.98;
}
function itemAt(x,y){
 const nodes=document.elementsFromPoint(x,y),sp=screenToScene(x,y);
 for(const n of nodes){
  const it=n.closest?.('.item');
  if(!it||it===holding)continue;
  if(it.dataset.itemId==='daska'&&!pointOnVisibleBoard(it,sp.x,sp.y))continue;
  if(it.dataset.crate==='1'&&!pointOnCrateBody(it,sp.x,sp.y))continue;
  return it;
 }
 return null;
}

function crateAt(x,y,vegKey=null){
 const nodes=document.elementsFromPoint(x,y),sp=screenToScene(x,y);
 for(const n of nodes){
  const it=n.closest?.('.item');
  if(it&&it!==holding&&it.dataset.crate==='1'&&(!vegKey||!it.dataset.vegKey||it.dataset.vegKey===vegKey)){
   if(!pointOnCrateBody(it,sp.x,sp.y))continue;
   return it;
  }
 }
 return null;
}

function returnVegetableToCrate(vegItem,crate){
 if(!vegItem||vegItem.dataset.vegetable!=='1'||!crate||crate.dataset.crate!=='1')return false;
 const current=+crate.dataset.count||0;
 if(current>=10){showToast('Gajbica je puna.');return true;}
 if(!crate.dataset.vegKey&&current<=0)crate.dataset.vegKey=vegItem.dataset.vegKey;
 if(crate.dataset.vegKey!==vegItem.dataset.vegKey){
   showToast('Ovaj sastojak ne ide u tu gajbicu.');
   return false;
 }
 crate.dataset.count=String(Math.min(10,current+1));
 renderCrateFill(crate);
 const cx=+crate.dataset.cx,by=+crate.dataset.by,vis=+crate.dataset.vis||1;
 popArtPuff(cx,by,Math.max(.7,vis*.95));
 playSfxVariant('woodDrop',.28);
 showToast('Vraćeno u gajbicu: '+vegItem.dataset.label);
 removeItem(vegItem);
 holding=null;
 hidePlacementGhost();
 hideOriginGhost();
 updateHover();
 return true;
}
function clearHover(){if(hoverItem){hoverItem.classList.remove('hovered');hoverItem._lidHit?.classList.remove('hover-lid')}hoverItem=null;label.style.display='none';resetBagPickIfTargetChanged();}
function updateHover(){
 updatePanTarget();
 if(holding||rotating){label.style.display='none';updateBagQtyBadge();return}
 const cookstoveHot=cookstoveHotspotAt(mouse.x,mouse.y);
 if(cookstoveHot){
   clearHover();
    label.textContent=cookstoveHot==='firebox'?(stoveState.fireboxOpen?'ložište — klik za zatvaranje':'ložište — klik za otvaranje'):(stoveState.ovenOpen?'rerna — klik za zatvaranje':'rerna — klik za otvaranje');
   label.style.left=mouse.x+'px';label.style.top=(mouse.y-12)+'px';label.style.display='block';return;
 }
 if(faucetHit(mouse.x,mouse.y)){clearHover();label.textContent=faucetOn?'slavina — klik za zatvaranje vode':'slavina — klik za puštanje vode';label.style.left=mouse.x+'px';label.style.top=(mouse.y-12)+'px';label.style.display='block';return;}
 const lh=lidAt(mouse.x,mouse.y);
 if(lh){if(hoverItem!==lh.item){clearHover();hoverItem=lh.item}lh.lid.classList.add('hover-lid');hoverItem.classList.remove('hovered');label.textContent='poklopac — '+lh.item.dataset.label}
  else{const it=itemAt(mouse.x,mouse.y);if(it!==hoverItem){clearHover();hoverItem=it;if(it){it.classList.add('hovered')}}if(it)label.textContent=isWoodBasket(it)?(woodBasketRemaining(it)>0?'Korpa sa drvima · L: uzmi cjepanicu · fiksirana pozicija':'Prazna korpa · D: Napuni korpu · fiksirana pozicija'):it.dataset.crate==='1'?it.dataset.label+' · L: 1 komad · D: cela gajba':(it.dataset.detachedLid==='1'?'poklopac':it.dataset.label)}
 if(hoverItem){label.style.left=mouse.x+'px';label.style.top=(mouse.y-12)+'px';label.style.display='block'}
 resetBagPickIfTargetChanged();
 updateBagQtyBadge();
}

function createDetachedLid(vessel){
 const m=vessel._lidMeta;if(!m)return null;
 const vLeft=parseFloat(vessel.style.left),vTop=parseFloat(vessel.style.top),vW=vessel.offsetWidth,vH=vessel.offsetHeight;
 const fullSrc=vessel.querySelector('.body').src;
 const lidBoxW=vW*m.w,lidBoxH=vH*m.h,lidLeft=vLeft+vW*m.x,lidTop=vTop+vH*m.y;
 const ch=document.createElement('div');ch.className='contact-shadow-sprite silhouette';ch.style.setProperty('position','absolute','important');scene.appendChild(ch);
 const chCrop=document.createElement('div');chCrop.className='lid-crop';chCrop.style.inset='0';chCrop.style.width='100%';chCrop.style.height='100%';
 const chImg=document.createElement('img');chImg.className='lid-crop';chImg.src=fullSrc;chImg.style.width=(100/m.w)+'%';chImg.style.height=(100/m.h)+'%';chImg.style.left=(-m.x/m.w*100)+'%';chImg.style.top=(-m.y/m.h*100)+'%';chCrop.appendChild(chImg);ch.appendChild(chCrop);
 const el=document.createElement('div');el.className='item detached-lid';el.dataset.itemId=vessel.dataset.itemId+'__lid';el.dataset.label='poklopac';el.dataset.detachedLid='1';el.dataset.collisionProfile='detachedLid';
 el.dataset.baseW=(+vessel.dataset.baseW*m.w);el.dataset.baseH=(+vessel.dataset.baseH*m.h);el.dataset.zBase=++zCounter;el.dataset.angle='-8';el._contactShadow=ch;el._parentVessel=vessel;
 const crop=document.createElement('div');crop.className='lid-hit';crop.style.inset='0';crop.style.width='100%';crop.style.height='100%';
 const im=document.createElement('img');im.className='lid-crop';im.src=fullSrc;im.style.width=(100/m.w)+'%';im.style.height=(100/m.h)+'%';im.style.left=(-m.x/m.w*100)+'%';im.style.top=(-m.y/m.h*100)+'%';crop.appendChild(im);el.appendChild(crop);
 el.dataset.basePerspective=perspectiveAt(lidTop+lidBoxH);
 setPose(el,lidLeft+lidBoxW/2,lidTop+lidBoxH,+vessel.dataset.vis||1);scene.appendChild(el);items.push(el);return el;
}

function detachLid(vessel){
 if(!vessel._lidMeta||vessel.classList.contains('open'))return;
 clearHover();vessel.classList.add('open');
 const detached=createDetachedLid(vessel);vessel._detachedLidItem=detached;
 playImpactSound(vessel,'open');showToast('Poklopac skinut: '+vessel.dataset.label);
 if(detached)startHolding(detached);
}
function lidSnapRect(vessel){
 const m=vessel._lidMeta;if(!m)return null;const left=parseFloat(vessel.style.left),top=parseFloat(vessel.style.top),w=vessel.offsetWidth,h=vessel.offsetHeight;
 const x=left+w*m.x,y=top+h*m.y,rw=w*m.w,rh=h*m.h;return{left:x,top:y,right:x+rw,bottom:y+rh,cx:x+rw/2,cy:y+rh/2};
}
function trySnapLid(detached){
 if(detached.dataset.detachedLid!=='1'||!detached._parentVessel)return false;
 const v=detached._parentVessel,r=lidSnapRect(v),p=screenToScene(mouse.x,mouse.y);
 const px=Math.max(24,(r.right-r.left)*.40),py=Math.max(18,(r.bottom-r.top)*.60);
 if(p.x<r.left-px||p.x>r.right+px||p.y<r.top-py||p.y>r.bottom+py)return false;
 v.classList.remove('open');v._detachedLidItem=null;removeItem(detached);holding=null;hidePlacementGhost();playImpactSound(v,'close');showToast('Poklopac vraćen: '+v.dataset.label);return true;
}

function startHolding(el,pointerEvent=null){
 if(el?.dataset?.itemId==='noz'&&getBoardEl())el=getBoardEl();
 if(isWoodBasket(el))return;
 if(!el||picking||placing||pouring)return;

 // Capture the pickup relation before any held-state mutation.
 // This guarantees zero visual displacement at the instant of left click.
 if(pointerEvent&&Number.isFinite(pointerEvent.clientX)&&Number.isFinite(pointerEvent.clientY)){
   const p=screenToScene(pointerEvent.clientX,pointerEvent.clientY);
   const vis=Math.max(.01,+el.dataset.vis||1);
   const bw=Math.max(1,+el.dataset.baseW||el.offsetWidth||60);
   const bh=Math.max(1,+el.dataset.baseH||el.offsetHeight||60);
   const h=bh*vis;
   const centerX=+el.dataset.cx||0;
   const centerY=(+el.dataset.by||0)-h*.5;
   heldGrabState={
     active:true,moved:false,
     pointerStartX:p.x,pointerStartY:p.y,
     centerStartX:centerX,centerStartY:centerY,
     offsetX:centerX-p.x,offsetY:centerY-p.y
   };
 }else{
   heldGrabState=null;
 }
 clearPourTarget();
 if(isContainerItem(el)){
   delete el.dataset.grinderSnapped;
   const grinder=window.CooksterGrinder?.get?.();
   if(grinder?._grinderOutputVessel===el)grinder._grinderOutputVessel=null;
 }
 const wasStoveSurface=el.dataset.surfaceZone==='stove';
 if(wasStoveSurface){
   el.dataset.pickupSurfaceZone='stove';
   el.dataset.surfaceZone='held';
   window.CooksterStoveZones?.release(el);
 }
 if(isContainerItem(el)&&(wasStoveSurface||el.dataset.onStove==='1'||el.dataset.onCookstove==='1')){
   setCookwareOnStove(el,false);
   // Contents stay in the model; only thermal contact stops while held.
   renderCookwareContents(el);
 }
 if(isProduceItem(el)&&el.dataset.onStoveTop==='1')setProduceOnStove(el,false);
 if(el.dataset.underTable==='1')delete el.dataset.underTable;
  if(el.dataset.itemId==='noz'&&el.dataset.attachedToBoard==='1'){
    // Knife stays permanently attached to the board.
    const board=getBoardEl();
    if(board)ensureKnifeAlwaysOnBoard(board);
  }else if(el.dataset.attachedToBoard==='1')detachFromBoard(el);

 // Direct manipulation: only one fully visible representation follows the
 // cursor. The original element is hidden while its identical placement copy
 // is shown, so there is no separate object in the player's hand.
 clearStirReady();
 holding=el;picking=false;clearHover();hidePlacementGhost();hideOriginGhost();
 playImpactSound(el,'pickup');
 surfaceTrailLast=null;
 if(isSmoothTestPot(el))el._smoothPickupPending=true;
 el.dataset.preHeldTransformOrigin=el.style.transformOrigin||'';
 el.classList.add('held');
 el.style.setProperty('--held-z','9999');
 el.style.visibility=el.dataset.fixedGrinder==='1'?'':'hidden';
 
 if(el._contactShadow){el._contactShadow.style.visibility='';}
 if(el.dataset.itemId==='daska'){
   syncBoardAttachments(el);
   ensureKnifeAlwaysOnBoard(el);
 }
 updatePlacementGhost();
 updateHover();
}

function popArtPuff(cx,by,vis=1,opacity=.96,rot=0){
  // One transparent WebM contains the synchronized left/right impact puffs.
  const p=document.createElement('video');
  p.className='pop-puff-img';
  p.src='assets/effects/puff_impact.webm';
  p.muted=true;
  p.playsInline=true;
  p.preload='auto';
  p.style.left=cx+'px';
  p.style.top=(by+1)+'px';
  const width=Math.max(145,Math.min(250,190*Math.max(.55,vis)));
  p.style.width=width+'px';
  p.style.height=(width*9/16)+'px';
  p.style.objectFit='contain';
  p.style.pointerEvents='none';
  p.style.opacity=String(Math.max(0,Math.min(1,opacity)));
  p.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;
  scene.appendChild(p);
  p.addEventListener('ended',()=>p.remove(),{once:true});
  p.play().catch(()=>p.remove());
  setTimeout(()=>p.remove(),900);
  return p;
}
function popArtPuffForBoard(el){
  if(!el)return;
  const cx=+el.dataset.cx||0, by=+el.dataset.by||0, vis=+el.dataset.vis||1;
  const h=el.offsetHeight||110;
  const y=by-Math.max(6,h*.03);
  popArtPuff(cx,y,Math.max(.72,vis*.92),.82,0);
}
function popArtPuffForCookware(el){
  if(!el)return;
  const cx=+el.dataset.cx||0, by=+el.dataset.by||0, vis=+el.dataset.vis||1;
  const h=el.offsetHeight||120;
  const y=by-h*.05;
  const puff=popArtPuff(cx,y,Math.max(.66,vis*.82),.76,0);
  if(puff&&(el.dataset.itemId||'').includes('serpa')){
    puff.animate([
      {transform:'translate(-50%,-50%) scaleX(.80) scaleY(.68)',opacity:.92,offset:0},
      {transform:'translate(-50%,-50%) scaleX(1.08) scaleY(1.03)',opacity:.82,offset:.18},
      {transform:'translate(-50%,-58%) scaleX(1.18) scaleY(1.10)',opacity:.68,offset:.64},
      {transform:'translate(-50%,-70%) scaleX(1.28) scaleY(1.18)',opacity:0,offset:1}
    ],{duration:900,easing:'cubic-bezier(.18,.72,.22,1)',fill:'forwards'});
  }
}

function playPotTableImpactVisual(el){
 if(!el)return;
 const body=el.querySelector?.('.body');
 if(body){
   body.getAnimations?.().forEach(a=>a.cancel());
   body.animate([
     {transform:'scaleX(1) scaleY(1)',offset:0},
     {transform:'scaleX(1.035) scaleY(.96)',offset:.30},
     {transform:'scaleX(.998) scaleY(1.006)',offset:.72},
     {transform:'scaleX(1) scaleY(1)',offset:1}
   ],{duration:240,easing:'cubic-bezier(.20,.70,.24,1)'});
 }
 const cx=+el.dataset.cx||0,by=+el.dataset.by||0;
 const w=Math.max(72,(+el.offsetWidth||180)*.68);
 const snap=document.createElement('div');
 snap.setAttribute('aria-hidden','true');
 Object.assign(snap.style,{position:'absolute',left:`${cx}px`,top:`${by-3}px`,width:`${w}px`,height:'14px',border:'3px solid rgba(255,255,255,.92)',borderRadius:'50%',pointerEvents:'none',zIndex:String(Math.max(1,(+el.style.zIndex||1)-1)),transform:'translate(-50%,-50%) scale(.74)',boxShadow:'0 1px 0 rgba(45,25,14,.55)'});
 scene.appendChild(snap);
 const anim=snap.animate([
   {opacity:0,transform:'translate(-50%,-50%) scale(.68)'},
   {opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.24},
   {opacity:0,transform:'translate(-50%,-50%) scale(1.16)'}
 ],{duration:95,easing:'ease-out'});
 anim.onfinish=()=>snap.remove();
 setTimeout(()=>snap.remove(),140);
}
function dropBounce(el){
 if(snapProfileFor(el))return;
 const a=+(el.dataset.angle||0);
 const zone=el.dataset.surfaceZone||'table';
 const by=+el.dataset.by||0;
 const flatten=surfaceFlattenFor(el,zone,by);
 const base=`rotate(${a}deg) scaleY(${flatten})`;
 try{
   el.animate([
     {transform:`${base} translateY(-12px)`,offset:0},
     {transform:`${base} translateY(2px)`,offset:.72},
     {transform:`${base} translateY(0px)`,offset:1}
   ],{
     duration:210,
     easing:'cubic-bezier(.18,.72,.24,1)'
   });
 }catch{}
}
function dropHolding(){
 if(!holding||placing||picking||pouring||oilPouring)return;

 // The sauerkraut barrel takes whole cabbages and its own lid.
 if(window.CooksterKaca&&CooksterKaca.tryDrop(holding))return;
 // One authoritative ingredient -> vessel path.
 if(isIngredientItem(holding)&&commitHeldIngredientToVessel(holding,mouse.x,mouse.y))return;

 if(holding.dataset.fixedGrinder==='1'&&!fixedGrinderPointerNearTarget()){
   showToast('Машина може да се закачи само на означено зелено место.');
   return;
 }
 setBoardSnapIndicator(false);
 clearStirReady();
 clearPourTarget();
 const d=holding;
 if(placementState&&placementState.blocked){
   setHeldPlacementState(d,true);
   showToast('Ovde nema mesta — pomeri predmet na slobodan deo površine.');
   return;
 }
 if(trySnapLid(d)){clearHeldPlacementState(d);updateHover();return}
 const board=getBoardEl();
 if(d.dataset.vegetable==='1'){
   const targetCrate=crateAt(mouse.x,mouse.y,d.dataset.vegKey);
   if(targetCrate&&returnVegetableToCrate(d,targetCrate)){clearHeldPlacementState(d);return;}
 }
 
 if(tryPlaceHeldAtCandidate(d))return;
}

function moveHeld(){
 if(!holding||placing||picking||pouring)return;
 if(holding.dataset.itemId==='daska'){
   holding.style.setProperty('--held-z','7000');
   if(holding._contactShadow)holding._contactShadow.style.zIndex='6999';
 }else{
   holding.style.setProperty('--held-z','9999');
 }
 updatePlacementGhost();
 updatePourTarget();
  updateBackpackDropTarget(mouse.x,mouse.y);
}



Object.entries(VEGETABLES).forEach(([key,veg])=>{
 const tr=document.createElement('tr');
 tr.innerHTML=`<td style="display:flex;align-items:center;gap:10px"><img src="${veg.src}" alt="" style="width:44px;height:44px;object-fit:contain"><b>${veg.label}</b></td><td>${veg.price} дин</td><td><button class='buy'>Kupi gajbicu (10)</button></td>`;
 tr.querySelector('.buy').onclick=()=>buyProduceCrate(key,true);
 marketRows.appendChild(tr);
});
let marketNoticeTimer=null;
function showMarketNotice(msg){
 if(!marketNotice)return;
 marketNotice.textContent=msg;marketNotice.classList.add('show');
 clearTimeout(marketNoticeTimer);marketNoticeTimer=setTimeout(()=>marketNotice.classList.remove('show'),1450);
}
function clampMarketQty(v){return Math.max(0,Math.min(9,Math.round(v||0)))}
function updateMarketQtyUI(){
 if(marketQtyTomato)marketQtyTomato.textContent=marketQty.paradajz>0?String(marketQty.paradajz):'';
 if(marketQtyPepper)marketQtyPepper.textContent=marketQty.paprika>0?String(marketQty.paprika):'';
}
function adjustMarketQty(key,delta){
 if(!(key in marketQty))return;
 marketQty[key]=clampMarketQty(marketQty[key]+delta);
 updateMarketQtyUI();
 playSfx('ui',.18);
}
function buyProduceCrate(key,closeAfter=false){
 const veg=VEGETABLES[key];if(!veg)return false;
 const qty=clampMarketQty(marketQty[key]||0);
 if(qty<1){showMarketNotice('Prvo izaberi količinu.');showToast('Prvo izaberi količinu.');return false}
 const total=veg.price*qty;
 if(money<total){showMarketNotice('Nemaš dovoljno novca.');showToast('Nemaš dovoljno novca.');return false}
 setMoney(money-total);
 for(let i=0;i<qty;i++)makeProduceCrate(key);
 const msg=qty===1
   ? `Kupljena je gajbica ${key==='paprika'?'paprika':'paradajza'}.`
   : `Kupljeno je ${qty} gajbica ${key==='paprika'?'paprika':'paradajza'}.`;
 marketQty[key]=0;updateMarketQtyUI();
 showMarketNotice(msg);showToast(msg);
 if(closeAfter){modalShade.style.display='none'}
 return true;
}

// v198.5.13 — public bridge used by the full-screen market bargaining UI.
// Existing Cookster vegetables become real kitchen crates; future market goods
// are persisted in the market basket until their kitchen assets are introduced.
window.CooksterMarketTrade=Object.freeze({
 getMoney(){return +money||0;},
 getPendingBags(){
   CooksterState.market??={};
   CooksterState.market.pendingBags??=[];
   return CooksterState.market.pendingBags.map(x=>({...x}));
 },
 purchase(productKey,label,price,quantityValue=1,quantityMode='kg'){
   const cost=Math.max(0,Math.round(+price||0));
   if(cost<=0)return {ok:false,reason:'invalid_price',money:+money||0};
   if((+money||0)<cost)return {ok:false,reason:'not_enough_money',money:+money||0};

   setMoney((+money||0)-cost);

   CooksterState.market??={};
   CooksterState.market.basket??={};
   CooksterState.market.pendingBags??=[];

   const mode=quantityMode==='bunch'?'bunch':'kg';
   const value=mode==='bunch'
     ? Math.max(1,+quantityValue||1)
     : Math.max(.5,+quantityValue||1);

   const entry=CooksterState.market.basket[productKey]||{count:0,spent:0,totalKg:0,totalBunches:0,label:label||productKey};
   entry.count=(+entry.count||0)+1;
   entry.spent=(+entry.spent||0)+cost;
   if(mode==='bunch')entry.totalBunches=(+entry.totalBunches||0)+value;
   else entry.totalKg=(+entry.totalKg||0)+value;
   entry.label=label||entry.label||productKey;
   CooksterState.market.basket[productKey]=entry;

   const bag={
     id:`market_bag_pending_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
     productKey,
     label:label||productKey,
     quantityMode:mode,
     quantityValue:value,
     ...(mode==='bunch'?{quantityBunches:value}:{quantityKg:value}),
     count:marketBagUnitCount(productKey,value,mode),
     paid:cost
   };
   CooksterState.market.pendingBags.push(bag);

   CooksterSave.schedule();
   window.dispatchEvent(new CustomEvent('cookster:market-bags-changed',{detail:{bag:{...bag}}}));
   showToast(`Купљено: ${label||productKey} — ${cost} дин. Кеса те чека на пијаци.`);
   return {ok:true,physical:false,money:+money||0,basket:{...entry},bag:{...bag}};
 },
  purchaseBasket(items,totalPrice){
    if(!Array.isArray(items)||!items.length){
      return {ok:false,reason:'empty_basket',money:+money||0};
    }
    const cost=Math.max(0,Math.round(+totalPrice||0));
    if(cost<=0)return {ok:false,reason:'invalid_price',money:+money||0};
    if((+money||0)<cost)return {ok:false,reason:'not_enough_money',money:+money||0};

    CooksterState.market??={};
    CooksterState.market.basket??={};
    CooksterState.market.pendingBags??=[];
    const baseTotal=items.reduce((sum,item)=>sum+Math.max(0,+item.basePrice||0),0);
    let allocated=0;
    const bags=[];

    for(const [index,item] of items.entries()){
      const productKey=String(item?.key||'');
      if(!productKey)continue;
      const label=item?.label||productKey;
      const mode=item?.mode==='bunch'?'bunch':'kg';
      const value=mode==='bunch'
        ?Math.max(1,+item?.value||1)
        :Math.max(.5,+item?.value||1);
      const share=index===items.length-1
        ?Math.max(0,cost-allocated)
        :Math.round(cost*(baseTotal>0?Math.max(0,+item?.basePrice||0)/baseTotal:1/items.length));
      allocated+=share;

      const entry=CooksterState.market.basket[productKey]||{
        count:0,spent:0,totalKg:0,totalBunches:0,label
      };
      entry.count=(+entry.count||0)+1;
      entry.spent=(+entry.spent||0)+share;
      if(mode==='bunch')entry.totalBunches=(+entry.totalBunches||0)+value;
      else entry.totalKg=(+entry.totalKg||0)+value;
      entry.label=label||entry.label||productKey;
      CooksterState.market.basket[productKey]=entry;

      const bag={
        id:`market_bag_pending_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        productKey,label,quantityMode:mode,quantityValue:value,
        ...(mode==='bunch'?{quantityBunches:value}:{quantityKg:value}),
        count:marketBagUnitCount(productKey,value,mode),
        paid:share
      };
      CooksterState.market.pendingBags.push(bag);
      bags.push(bag);
    }
    if(!bags.length)return {ok:false,reason:'empty_basket',money:+money||0};

    setMoney((+money||0)-cost);
    CooksterSave.schedule();
    window.dispatchEvent(new CustomEvent('cookster:market-bags-changed',{detail:{bags:bags.map(x=>({...x}))}}));
    showToast(`Купљена је корпа — ${cost} дин. Кесе те чекају на пијаци.`);
    return {ok:true,physical:false,money:+money||0,bags};
  },
 collectPendingBags(){
   CooksterState.market??={};
   CooksterState.market.pendingBags??=[];
   if(!CooksterState.market.pendingBags.length)return {ok:false,count:0};
   const records=CooksterState.market.pendingBags.map(x=>({...x}));
   CooksterState.market.pendingBags.length=0;
   closeMarket();
   const made=spawnCollectedMarketBags(records);
   CooksterSave.schedule();
   window.dispatchEvent(new CustomEvent('cookster:market-bags-changed',{detail:{collected:true}}));
   return {ok:true,count:made.length};
 }
});

function openMarket(){
 marketScene.classList.add('open');marketScene.setAttribute('aria-hidden','false');document.body.classList.add('market-open');
 if(marketMoneyLive)marketMoneyLive.textContent=`${money} дин`;
 marketQty.paradajz=0;marketQty.paprika=0;
 marketQty.paradajz=0;marketQty.paprika=0;
 updateMarketQtyUI();
  updateSeedMarketUI();
}
function closeMarket(){
 marketScene.classList.remove('open');marketScene.setAttribute('aria-hidden','true');document.body.classList.remove('market-open');
}
function marketPress(el){
 if(!el)return;
 el.classList.remove('market-press');
 void el.offsetWidth;
 el.classList.add('market-press');
 setTimeout(()=>el.classList.remove('market-press'),150);
}

function spawnStaple(key){
 const def=CooksterCatalog.STAPLES?.[key];if(!def)return null;
 const sceneBottle=key==='ulje'
   ?itemsData.find(item=>item.id==='kal_01_flasa_ulja')
   :null;
 const itemDef=sceneBottle||def;
 const x=key==='ulje'?860:940,y=390;
 const el=makeItem({
   id:sceneBottle?.id||`staple_${key}_${Date.now()}`,
   label:def.label,src:itemDef.src,x,y,w:itemDef.w,h:itemDef.h,z:++zCounter,
   snapProfile:itemDef.snapProfile||'flat',
   shadowProfile:itemDef.shadowProfile||'tiny',
   staple:key,uses:def.uses
 });
 el.dataset.staple='1';el.dataset.stapleKey=key;el.dataset.uses=String(def.uses||1);
 if(sceneBottle)ensureSceneOilBottleMeta(el);
 if(key==='so')setPose(el,+el.dataset.cx||x+(def.w/2),+el.dataset.by||y+def.h,+el.dataset.vis||1);
 CooksterSave.schedule();dropBounce(el);return el;
}
function buyStaple(key){
 const def=CooksterCatalog.STAPLES?.[key];if(!def)return false;
 if(money<def.price){showMarketNotice('Nemaš dovoljno novca.');showToast('Nemaš dovoljno novca.');return false}
 setMoney(money-def.price);spawnStaple(key);
 const msg=`Kupljeno: ${def.label}.`;showMarketNotice(msg);showToast(msg);return true;
}
function buyOnionCrate(){
 const def=VEGETABLES.luk;if(!def)return false;
 if(money<def.price){showMarketNotice('Nemaš dovoljno novca.');showToast('Nemaš dovoljno novca.');return false}
 setMoney(money-def.price);makeProduceCrate('luk');
 const msg='Kupljena je gajbica luka.';showMarketNotice(msg);showToast(msg);return true;
}

const SEED_PRICES=Object.freeze({paradajz:45,krastavac:40});
function ensureGardenSeedState(){
  CooksterState.garden??={};
  CooksterState.garden.seeds??={paradajz:0,krastavac:0};
  CooksterState.garden.seeds.paradajz=+CooksterState.garden.seeds.paradajz||0;
  CooksterState.garden.seeds.krastavac=+CooksterState.garden.seeds.krastavac||0;
  return CooksterState.garden.seeds;
}
function updateSeedMarketUI(){
  const seeds=ensureGardenSeedState();
  const t=document.getElementById('seedTomatoCount');
  const c=document.getElementById('seedCucumberCount');
  if(t)t.textContent=String(seeds.paradajz);
  if(c)c.textContent=String(seeds.krastavac);
}
function buySeedPacket(key){
  const price=SEED_PRICES[key];
  if(!price)return false;
  if(money<price){
    showMarketNotice('Немаш довољно новца.');
    showToast('Немаш довољно новца.');
    return false;
  }
  setMoney(money-price);
  const seeds=ensureGardenSeedState();
  seeds[key]=(seeds[key]||0)+1;
  updateSeedMarketUI();
  const label=key==='paradajz'?'парадајза':'краставца';
  const msg=`Купљено семе ${label}. Имаш ${seeds[key]} пак.`;
  showMarketNotice(msg);showToast(msg);
  CooksterSave.schedule();
  return true;
}

function addStapleToPan(item,pan){return addIngredientToContainer(item,pan);}
document.getElementById('marketBuyOnion')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(buyOnionCrate,70)});
 document.getElementById('marketBuyCucumber')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>{
   const def=VEGETABLES.krastavac;
   if(money<def.price){showMarketNotice('Nemaš dovoljno novca.');showToast('Nemaš dovoljno novca.');return;}
   setMoney(money-def.price);makeProduceCrate('krastavac',10);showMarketNotice('Kupljena je gajbica krastavaca.');showToast('Kupljena je gajbica krastavaca.');
 },70)});
document.getElementById('marketBuyOil')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buyStaple('ulje'),70)});
document.getElementById('marketBuySalt')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buyStaple('so'),70)});
document.getElementById('marketBuyTomatoSeeds')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buySeedPacket('paradajz'),70)});
document.getElementById('marketBuyCucumberSeeds')?.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buySeedPacket('krastavac'),70)});
updateSeedMarketUI();

document.getElementById('marketBuyTomato').addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buyProduceCrate('paradajz'),70)});
document.getElementById('marketBuyPepper').addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(()=>buyProduceCrate('paprika'),70)});
document.getElementById('marketBack').addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);setTimeout(closeMarket,95)});
marketMinusTomato.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);adjustMarketQty('paradajz',-1)});
marketPlusTomato.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);adjustMarketQty('paradajz',1)});
marketMinusPepper.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);adjustMarketQty('paprika',-1)});
marketPlusPepper.addEventListener('click',e=>{e.stopPropagation();marketPress(e.currentTarget);adjustMarketQty('paprika',1)});

function updateArrowVisibility(){
 const edge=70;
 const maxIndex=2;
 leftArrow.classList.toggle('show',mouse.x<=edge && cameraIndex>0 && !holding && !rotating);
 rightArrow.classList.toggle('show',mouse.x>=innerWidth-edge && cameraIndex<maxIndex && !holding && !rotating);
}
function moveCamera(dir){cameraIndex=Math.max(0,Math.min(2,cameraIndex+dir));playSfx('camera',.22);applyCamera();showToast(cameraIndex===0?'Levo: Smederevac':cameraIndex===2?'Desno: Roštilj':'Glavna radna površina');}
leftArrow.addEventListener('click',e=>{e.stopPropagation();moveCamera(-1)});
rightArrow.addEventListener('click',e=>{e.stopPropagation();moveCamera(1)});
window.CooksterDebugSurfaceAt=(screenX,screenY)=>{
 const p=screenToScene(screenX,screenY);
 return CooksterSurfaceCast?.cast(p)||{hit:false,surface:null,point:p};
};

window.addEventListener('resize',fitScene);
window.addEventListener('pointermove',e=>{
 mouse.x=e.clientX;mouse.y=e.clientY;updateCursor();
  if(paprikaBagPointerDrag&&e.pointerId===paprikaBagPointerDrag.pointerId&&
     (e.buttons&1)&&!holding){
    const dx=e.clientX-paprikaBagPointerDrag.x,dy=e.clientY-paprikaBagPointerDrag.y;
    if(Math.hypot(dx,dy)>5){
      const bag=paprikaBagPointerDrag.item;
      paprikaBagPointerDrag=null;
      startHolding(bag,e);
      return;
    }
  }
 if(quickWheelOpen){updateQuickToolWheelHover(e.clientX,e.clientY);return;}
 if(oilPouring){
   // The rAF pour loop performs amount updates; pointermove only refreshes
   // cursor coordinates immediately for target/stream responsiveness.
   updateOilStreamGeometry(oilPourBottle,oilPourTarget);
   updateHover();updateArrowVisibility();
   return;
 }
 if(pouring){updateHover();updateArrowVisibility();return}
 if(stirring){
   updateStirring(e);
   label.style.display='none';
   return;
 }
 if(panWashing){updatePanWashing(e);updateHover();updateArrowVisibility();return}
 if(cleaning){updateCleaning(e);updateHover();updateArrowVisibility();return}
 if(rotating){
   const dx=e.clientX-rotateStartX,dy=e.clientY-rotateStartY;
   rotating.dataset.angle=String(rotateStartAngle+dx*.7);
   // Vertical right-drag is deliberately much less sensitive than Z rotation.
   // Drag down = tilt top slightly backward; drag up = tilt it forward.
   rotating.dataset.tilt=String(itemTiltValue(rotating,rotateStartTilt+dy*.08));
   if(holding&&rotating===holding){
     const preview=heldPreviewPoseFor(rotating);
     setPose(rotating,preview.cx,preview.by,preview.vis);
     updatePlacementGhost();
   }else{
     setPose(rotating,+rotating.dataset.cx,+rotating.dataset.by,+rotating.dataset.vis);
   }
   return
 }
 if(isCutting){updateHover();updateArrowVisibility();return}
 if(holding&&!picking){
   moveHeld();
 }
 updateHover();updateArrowVisibility();
});
window.addEventListener('dblclick',e=>{const it=itemAt(e.clientX,e.clientY);if(it&&it.dataset.itemId==='noz')playChop();});
// v198.5.106 — scroll over a market bag to pick how many to take at once.
window.addEventListener('wheel',e=>{
  if(holding||rotating)return;
  const it=hoverItem||itemAt(e.clientX,e.clientY);
  if(!it||it.dataset.marketBag!=='1')return;
  e.preventDefault();
  const available=Math.max(1,+it.dataset.count||1);
  const maxQty=Math.min(8,available);
  if(bagPickTarget!==it){bagPickTarget=it;bagPickQty=1;}
  const dir=e.deltaY<0?1:-1;
  bagPickQty=Math.max(1,Math.min(maxQty,bagPickQty+dir));
  updateBagQtyBadge();
},{passive:false});
window.addEventListener('pointerdown',e=>{
 if(quickWheelOpen){
   if(e.button===0){
     e.preventDefault();
     const slot=e.target.closest?.('#quickToolWheel [data-wheel-tool]');
     if(slot){
       const id=slot.dataset.wheelTool||'';
       if(selectQuickToolWheelSlot(id))return;
       // Future/locked slot: keep wheel open.
       return;
     }
     closeQuickToolWheel(false);
     return;
   }
   if(e.button===2){e.preventDefault();return;}
 }
  const placingIngredient=!!holding&&isIngredientItem(holding);
 if(isCutting)return;
 if(e.button===1){e.preventDefault();if(toggleQuickToolHand())return;}
  if(e.target.closest('#savkaBookRoot')||e.target.closest('#gardenScene')||e.target.closest('.garden-window-hotspot')||e.target.closest('#marketScene')||e.target.closest('#kitchenElementsScene')||e.target.closest('#hud')||e.target.closest('#modal')||e.target.closest('.edge-arrow'))return;
  // The basket occupies part of the oven hotspot visually. Resolve its visible
  // top layer first so taking a log never toggles the oven underneath it.
  if(e.button===0&&!holding){
    const basketAtPointer=itemAt(e.clientX,e.clientY);
    if(isWoodBasket(basketAtPointer)){
      if(woodBasketRemaining(basketAtPointer)>0)spawnHeldWoodBasketLog(basketAtPointer,e);
      else showToast('Korpa je fiksirana. Desni klik za punjenje.');
      return;
    }
  }
 const cookstoveHot=cookstoveHotspotAt(e.clientX,e.clientY);
 if(e.button===0&&holding&&isFirewoodLog(holding)&&cookstoveHot==='firebox'){if(insertHeldLogIntoFirebox())return;}
 if(e.button===0&&holding&&isDisposableMarketPackaging(holding)&&cookstoveHot==='firebox'){if(insertHeldPackagingIntoFirebox())return;}
if(e.button===0&&!holding&&cookstoveHot==='firebox'){const action=stoveState.fireboxOpen?'close':'open';toggleCookstoveFirebox();playImpactSound(fireboxHotspot,action);return;}
if(e.button===0&&!holding&&cookstoveHot==='oven'){const action=stoveState.ovenOpen?'close':'open';toggleCookstoveOven();playImpactSound(ovenHotspot,action);return;}
 if(e.button===0&&faucetHit(e.clientX,e.clientY)){setFaucet(!faucetOn);return;}
 if(e.button===0&&holding&&isHeatableCookwareItem(holding)&&sinkHit(e.clientX,e.clientY)){if(beginPanWashing(holding,e))return;}
 if(e.button===0&&holding&&isStirSpoon(holding)){
   const stirTarget=stirReadyVessel||stirVesselAt(e.clientX,e.clientY,true);
   if(stirTarget&&beginStirring(stirTarget,e))return;
 }
 const lh=lidAt(e.clientX,e.clientY),rawIt=itemAt(e.clientX,e.clientY);
 const it=(rawIt&&rawIt.dataset.itemId==='noz'&&rawIt.dataset.attachedToBoard==='1'&&getBoardEl())?getBoardEl():rawIt;
 if(e.button===2){
     if(it&&isAjvarJar(it)){
       e.preventDefault();
       openAjvarJarActionMenu(it,e.clientX,e.clientY);
       return;
     }
    if(holding&&isWoodBasket(holding)){e.preventDefault();dropHolding();return}
    if(it&&isWoodBasket(it)){
      e.preventDefault();
      if(woodBasketRemaining(it)<=0)openWoodBasketActionMenu(it,e.clientX,e.clientY);
      else showToast('Korpa je fiksirana. Levi klik za cjepanicu.');
      return;
    }
    if(it&&isPaprikaSteamBag(it)){e.preventDefault();openPaprikaBagActionMenu(it,e.clientX,e.clientY);return}
    if(it&&it.dataset.readyToPeel==='1'&&it.dataset.peeled!=='1'){e.preventDefault();openPaprikaBagActionMenu(it,e.clientX,e.clientY);return}
   // Market paper bags use the same physical right-click pickup/drop language as crates.
   if(holding&&holding.dataset.marketBag==='1'){dropHolding();return}
   if(it&&it.dataset.marketBag==='1'){
     startHolding(it,e);
     showToast('Кеса је у руци. Леви клик на зелени положај да је спустиш — или десни клик поново.');
     return;
   }
   // v198.5.6: classic crate handling restored.
   // Right click picks up the whole crate; right click again places it.
   if(holding&&holding.dataset.crate==='1'&&holding.dataset.calibrationCopy!=='1'){dropHolding();return}
   if(it&&it.dataset.crate==='1'&&it.dataset.calibrationCopy!=='1'){
     startHolding(it,e);
     showToast('Cela gajbica je u ruci. Desni klik ponovo da je spustiš.');
     return;
   }
    if(shouldOpenQuickToolWheel(e,it)){e.preventDefault();openQuickToolWheel(e.clientX,e.clientY);return;}
   // Other placed items retain right-drag angle/tilt adjustment.
   if(it){
     rotating=it;
     rotateStartX=e.clientX;rotateStartY=e.clientY;
     rotateStartAngle=+(it.dataset.angle||0);
     rotateStartTilt=itemTiltValue(it,it.dataset.tilt||0);
     clearHover();
   }
   return
 }
 if(e.button!==0)return;
  if(!holding&&it&&isPaprikaSteamBag(it)){
    e.preventDefault();
    paprikaBagPointerDrag={item:it,pointerId:e.pointerId,x:e.clientX,y:e.clientY};
    return;
  }
 if(!holding){
    if(it&&isWoodBasket(it)){
      if(woodBasketRemaining(it)>0)spawnHeldWoodBasketLog(it,e);
      else showToast('Korpa je fiksirana. Desni klik za punjenje.');
      return;
    }
   const pepperVessel=roastedPepperVesselAt(e.clientX,e.clientY);
   if(pepperVessel&&takeRoastedPepperFromVessel(pepperVessel))return;
 }
 if(holding){
   if(picking||pouring||oilPouring)return;
    if(isAjvarLadle(holding)){
      if(it&&isAjvarJar(it)){fillAjvarJar(it,holding);return;}
      if(it&&isHeatableCookwareItem(it)){scoopAjvarLadle(holding,it);return;}
    }
    if(isRoastedPepperForSteamBag(holding)&&it&&isPaprikaSteamBag(it)){
      if(addRoastedPepperToSteamBag(it,holding))return;
    }
    if(holding.dataset.marketBag==='1'&&sinkHit(e.clientX,e.clientY)){
      if(pourMarketBagIntoSink(holding))return;
    }
   if(isSceneOilBottle(holding)){
     const oilTarget=validOilPourTargetAt(e.clientX,e.clientY,holding);
     if(oilTarget){
       if(beginOilPour(holding,oilTarget,e.pointerId))return;
     }
   }
   const grinder=window.CooksterGrinder?.get?.();
   if(grinder&&grinderCanAcceptPepper(holding)&&grinderInputHit(grinder,e.clientX,e.clientY)){
     if(putRoastedPepperInGrinder(holding,grinder))return;
   }
   if(isContainerItem(holding)&&vesselTransferAmount(holding)>0){
     const candidate=pourCandidateAt(e.clientX,e.clientY,holding);
     if(candidate?.target){
       if(!candidate.ok){showToast(candidate.reason||'Не може да се пресипа овде.');return;}
       if(beginPourTransfer(holding,candidate.target))return;
     }
   }
   if(isCleaningTool(holding)){const stain=stainAt(e.clientX,e.clientY);if(stain&&beginCleaning(stain,e))return;}
   if(isIngredientItem(holding)&&commitHeldIngredientToVessel(holding,e.clientX,e.clientY))return;
   if(holding.dataset.vegetable==='1'){
     const targetCrate=crateAt(e.clientX,e.clientY,holding.dataset.vegKey);
     if(targetCrate&&returnVegetableToCrate(holding,targetCrate))return;
   }
   dropHolding();
   return;
 }
 if(lh){detachLid(lh.item);return}
 if(it&&it.dataset.marketBag==='1'){
   if(bagPickTarget===it&&bagPickQty>1){
     takeManyFromMarketBagToBoard(it,bagPickQty);
   }else{
     takeOneFromMarketBag(it);
   }
   return;
 }
 if(it&&it.dataset.crate==='1'){
   takeOneFromCrate(it);
   return;
 }
  if(it&&isPaprikaSteamBag(it)){steamedPepperFromBag(it);return;}
 if(it)startHolding(it,e);
});
window.addEventListener('pointerup',e=>{
  if(e.button===0&&window.CooksterBackpackController?.dropHeldItemAt?.(
    e.clientX,e.clientY,e
  ))return;
  if(paprikaBagPointerDrag&&e.pointerId===paprikaBagPointerDrag.pointerId){
    const bag=paprikaBagPointerDrag.item;
    paprikaBagPointerDrag=null;
    if(!holding&&bag?.isConnected){steamedPepperFromBag(bag);}
    return;
  }
 if(oilPouring&&(oilPourPointerId==null||e.pointerId===oilPourPointerId)){endOilPour();return}
 if(stirring&&e.pointerId===stirPointerId){endStirring();return}
 if(panWashing&&e.pointerId===washPointerId){endPanWashing();return}
 if(cleaning&&e.pointerId===cleanPointerId){endCleaning();return}
 if(e.button===2&&rotating){rotating=null;CooksterSave.schedule();updateHover()}
});
window.addEventListener('pointercancel',e=>{
  if(paprikaBagPointerDrag&&e.pointerId===paprikaBagPointerDrag.pointerId)paprikaBagPointerDrag=null;
 if(oilPouring)endOilPour();
 if(quickWheelOpen)closeQuickToolWheel(false);
 rotating=null;if(stirring)endStirring();if(panWashing)endPanWashing();if(cleaning)endCleaning()
});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
document.getElementById('marketBtn').onclick=()=>{openMarket()};
document.getElementById('kitchenElementsBtn')?.addEventListener('click',openKitchenElements);
document.getElementById('kitchenElementsClose')?.addEventListener('click',closeKitchenElements);
document.getElementById('kitchenElementsScene')?.addEventListener('pointerdown',e=>{if(e.target.id==='kitchenElementsScene')closeKitchenElements();});
document.getElementById('serveBtn').onclick=serveDish;
document.getElementById('saveBtn')?.addEventListener('click',()=>{
 const ok=CooksterSave.save();
 showToast(ok?'Igra je ručno sačuvana.':'Čuvanje nije uspelo.');
});
document.getElementById('loadBtn')?.addEventListener('click',()=>{
 if(!CooksterSave.load()){showToast('Nema ručno sačuvane igre.');return;}
 showToast('Učitavam sačuvanu igru...');
 setTimeout(()=>CooksterSave.requestLoad(),120);
});
document.getElementById('dishClose').onclick=()=>{const r=document.getElementById('dishReport');r.classList.remove('open');r.setAttribute('aria-hidden','true')};
initRecipeChooser();
document.getElementById('closeModal').onclick=()=>{playSfx('ui',.22);modalShade.style.display='none'};
modalShade.addEventListener('pointerdown',e=>{if(e.target===modalShade)modalShade.style.display='none'});


window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&quickWheelOpen){closeQuickToolWheel(false);return;}
 if(e.key==='Escape'&&document.body.classList.contains('kitchen-elements-open')){closeKitchenElements();return;}
  if(e.key==='Escape'&&document.body.classList.contains('market-open')){closeMarket();return;}
 if(document.body.classList.contains('market-open'))return;
 if((e.key==='q'||e.key==='Q')&&!e.repeat){if(toggleQuickToolHand()){e.preventDefault();return;}}
 if((e.key==='e'||e.key==='E')&&!e.repeat){
   if(isCutting){e.preventDefault();return;}
   const target=findCutTargetOnBoard();
   if(target){e.preventDefault();beginCutAction();}
 }
});

const __hasSavedWorld=Array.isArray(CooksterState.world?.items);
if(!__hasSavedWorld){
 itemsData.filter(def=>!QUICK_TOOL_ITEM_IDS.has(def.id)).forEach(makeItem);
}
const __worldRestored=CooksterWorld.restore(CooksterState.world);
ensureWoodBasket();
// The stirring spoon is a physical kitchen tool, not a quick-wheel tool. Older
// saves could be missing it, so restore one only when there is no scene instance.
let __starterSpoon=items.find(el=>el.dataset.itemId==='kasika_mesanje')||
 backpackContents.find(el=>el?.dataset?.itemId==='kasika_mesanje')||null;
if(!__starterSpoon){
 const __stirSpoonDef=itemsData.find(def=>def.id==='kasika_mesanje');
 if(__stirSpoonDef){
  __starterSpoon=makeItem(__stirSpoonDef);
  __starterSpoon.dataset.surfaceZone='decor';
  __starterSpoon.dataset.angle='178';
  setPose(__starterSpoon,+__starterSpoon.dataset.cx,+__starterSpoon.dataset.by,1);
 }
}
// A new kitchen begins with the spoon hanging on the right table leg. Saved
// placements are intentionally left untouched.
if(!__hasSavedWorld&&__starterSpoon){
 __starterSpoon.dataset.surfaceZone='decor';
 __starterSpoon.dataset.angle='178';
 setPose(__starterSpoon,+__starterSpoon.dataset.cx,+__starterSpoon.dataset.by,1);
}
cleanupQuickToolSceneClutter();
setTimeout(cleanupQuickToolSceneClutter,50);
setTimeout(cleanupQuickToolSceneClutter,350);
setTimeout(cleanupQuickToolSceneClutter,1200);
// v198.5.4: migrate both fresh and legacy world items onto the final per-item
// calibration profiles without touching uncalibrated item types/surfaces.
// Geometry engine owns perspective. Re-pose restored items from their current
// position only; never from spawn/origin calibration.
items.forEach(el=>{
 const zone=el.dataset.surfaceZone||'table';
 const vis=geometryPerspectiveScale(el,zone,+el.dataset.by||GP_TABLE_REF_Y);
 setPose(el,+el.dataset.cx||0,+el.dataset.by||0,vis);
});
// Final shadow reconciliation after world restore.
// Contact-shadow surface is geometry-derived, so stale/missing surfaceZone values
// cannot force a fallback shadow after refresh.
for(const el of items){
 if(!el?._contactShadow||!Number.isFinite(+el.dataset.cx)||!Number.isFinite(+el.dataset.by))continue;
 const zone=contactShadowSurfaceFor(el);
 const vis=surfaceScaleFor(el,zone,+el.dataset.by||GP_TABLE_REF_Y);
 setPose(el,+el.dataset.cx,+el.dataset.by,vis);
}

// Restore oil visuals from the saved vessel models after every world restore.
for(const el of items){
 if(isContainerItem(el))updateVesselOilVisual(el);
}

setMoney(CooksterState.player.money);
updateDayUI();
fitScene();
const __board=getBoardEl();
let __knife=items.find(i=>i.dataset.itemId==='noz')||null;
const __packedKnife=backpackContents.find(i=>i?.dataset?.itemId==='noz')||null;

if(__board){
 prepareBoardAlphaHit(__board);

 // `noz` is excluded from the normal startup item loop because it used to be
 // a quick-wheel tool. Create exactly one permanent scene knife here instead.
  if(!__knife&&!__packedKnife){
   const __knifeDef=itemsData.find(def=>def.id==='noz')||quickToolItemDef('noz');
   if(__knifeDef)__knife=makeItem({...__knifeDef});
 }

 if(__knife){
   delete __knife.dataset.quickTool;
   delete __knife.dataset.held;
   __knife.classList.remove('held');
   ensureKnifeAlwaysOnBoard(__board);
 }
}

// once everything has loaded (a restored save may have put the knife on the floor) the knife goes onto the board
for(const ms of [0,400,1500])setTimeout(()=>{const bd=getBoardEl(),kn=getKnifeEl();if(bd&&kn&&!isCutting&&holding!==kn&&kn.dataset.heldByHand!=='1'&&!(kn.parentNode===bd&&kn.style.left.endsWith('%')))ensureKnifeAlwaysOnBoard(bd);},ms);
applyCookstoveState();
if(stoveState.fireOn&&stoveState.fireLevel>0) scheduleFireBurn(false);
else updateFireTimerBar();
renderSinkProduce();
if(CooksterState.kitchen.faucetOn)setFaucet(true);
updateCursor();updateHover();updateArrowVisibility();
showToast(window.__COOKSTER_EXPLICIT_LOAD__?'Sačuvana igra je učitana.':'Nova igra — napredak se čuva samo kada klikneš SAVE.');



/* v15: old generic scroll fallback removed; modal wheel is isolated directly. */








/* ==========================================================================
   Baba Savkina knjiga recepata — enlarged left-side recipe book UI with
   animated opening/closing, click navigation and drag-corner page flipping.
   ========================================================================== */
(function(){
  const SAVKA_BOOK_PAGES=[
    {id:'title',label:'Naslovna',src:'assets/ui/savka_book/page_00_title.png'},
    {id:'ajvar-1',label:'Ajvar — sastojci',src:'assets/ui/savka_book/page_01_ajvar_ingredients.png'},
    {id:'ajvar-2',label:'Ajvar — priprema',src:'assets/ui/savka_book/page_02_ajvar_preparation.png'},
    {id:'notes',label:'Moje beleške',src:'assets/ui/savka_book/page_03_notes.png'}
  ];
  const SAVKA_BOOK_COVER='assets/ui/savka_book/cover_closed.png';
  let savkaBook=null,savkaBookOpen=false,savkaPageIndex=0,savkaTurning=false,savkaTurn=null,savkaTurnRaf=0;

  function savkaBookUiActive(){ return !!savkaBookOpen; }
  function savkaStop(e){
    if(!e)return;
    e.preventDefault?.();
    e.stopPropagation?.();
    e.stopImmediatePropagation?.();
  }

  function initSavkaRecipeBookUI(){
    if(savkaBook?.root?.isConnected)return savkaBook.root;

    const style=document.createElement('style');
    style.id='savkaBookUiStyle';
    style.textContent=`
    #savkaBookRoot,#savkaBookRoot *{box-sizing:border-box}
    #savkaBookRoot{
      position:fixed; left:0; top:84px; width:500px; height:760px; z-index:16520;
      pointer-events:none; user-select:none; -webkit-user-select:none;
      font-family:Georgia,"Times New Roman",serif;
    }
    #savkaBookRoot.savka-open{pointer-events:auto}
    #savkaBookRoot .savka-side-fade{
      position:absolute; inset:0 auto 0 0; width:148px;
      background:linear-gradient(90deg,rgba(37,22,14,.88),rgba(37,22,14,.58) 52%,rgba(37,22,14,0) 100%);
      border-radius:0 24px 24px 0; opacity:.9; pointer-events:none;
    }
     #savkaBookRoot.savka-open .savka-side-fade,
     #savkaBookRoot.savka-open .savka-header-label,
     #savkaBookRoot.savka-open .savka-book-controls,
     #savkaBookRoot.savka-open .savka-close,
     #savkaBookRoot.savka-open .savka-page-hotspot,
     #savkaBookRoot.savka-open .savka-corner-grab{display:none!important}
    #savkaBookRoot .savka-book-tab{
      position:absolute; left:10px; top:88px; width:132px; height:170px;
      border:none; background:none; padding:0; margin:0; cursor:pointer; pointer-events:auto;
      transition:transform .28s cubic-bezier(.22,.75,.2,1),opacity .18s ease,filter .18s ease;
      filter:drop-shadow(0 14px 18px rgba(0,0,0,.35));
    }
    #savkaBookRoot .savka-book-tab:hover{transform:translateY(-2px) scale(1.02)}
    #savkaBookRoot.savka-open .savka-book-tab{
      transform:translateX(-30px) scale(.94); opacity:0; pointer-events:none;
      filter:drop-shadow(0 8px 12px rgba(0,0,0,.2));
    }
    #savkaBookRoot .savka-book-tab img{width:100%;height:100%;object-fit:contain;object-position:left center;display:block}

    #savkaBookRoot .savka-book-shell{
      position:absolute; left:18px; top:122px; width:455px; height:650px;
      opacity:0; transform:translateX(-108%) scale(.92); transform-origin:left center;
      transition:transform .34s cubic-bezier(.2,.82,.22,1), opacity .24s ease;
      pointer-events:none;
    }
    #savkaBookRoot.savka-open .savka-book-shell{opacity:1; transform:translateX(0) scale(1); pointer-events:auto}
    #savkaBookRoot .savka-book-panel{
      position:absolute; inset:0; border-radius:28px;
       background:transparent;
       box-shadow:none;
       backdrop-filter:none;
      overflow:visible;
    }
    #savkaBookRoot .savka-book-stage{
      position:absolute; left:10px; top:16px; width:412px; height:560px;
      perspective:1400px; pointer-events:auto;
    }

    #savkaBookRoot .savka-book-page,
    #savkaBookRoot .savka-book-flip{
      position:absolute; inset:0; width:100%; height:100%; border:none; display:block;
      object-fit:contain; object-position:left top;
       filter:none;
       border-radius:0;
      transform-style:preserve-3d; backface-visibility:hidden;
      will-change:transform,opacity;
      pointer-events:none;
    }
    #savkaBookRoot .savka-book-flip{
      opacity:0;
      transform:rotateY(0deg) translateX(0);
      transition:transform .22s ease, opacity .22s ease;
    }
    #savkaBookRoot .savka-page-fold-shadow{
      position:absolute; top:1.5%; bottom:2.5%; left:96%; width:34px;
      z-index:1; opacity:0; pointer-events:none;
      transform:translateX(-50%);
      background:linear-gradient(90deg,
        rgba(48,25,10,0) 0%,
        rgba(48,25,10,.24) 34%,
        rgba(255,244,207,.30) 52%,
        rgba(48,25,10,.10) 70%,
        rgba(48,25,10,0) 100%);
      filter:blur(1.2px);
      will-change:left,width,opacity,transform;
    }
    #savkaBookRoot .savka-page-curl{
      position:absolute; right:0; bottom:0; width:62px; height:62px;
      z-index:3; opacity:0; pointer-events:none;
      transform-origin:100% 100%;
      clip-path:polygon(100% 0,0 100%,100% 100%);
      background:linear-gradient(135deg,#f9edc9 2%,#dfc897 54%,#9f6e38 100%);
      box-shadow:-5px -5px 12px rgba(65,35,14,.20);
      will-change:transform,opacity;
    }

    #savkaBookRoot .savka-page-hotspot{
      position:absolute; top:26px; bottom:72px; width:44%;
      border:none; background:transparent; cursor:pointer; z-index:2;
    }
    #savkaBookRoot .savka-page-hotspot.left{left:6px}
    #savkaBookRoot .savka-page-hotspot.right{right:10px}
    #savkaBookRoot .savka-page-hotspot:hover{background:linear-gradient(90deg,rgba(255,235,178,.05),rgba(255,235,178,0))}
    #savkaBookRoot .savka-page-hotspot.right:hover{background:linear-gradient(270deg,rgba(255,235,178,.06),rgba(255,235,178,0))}
    #savkaBookRoot.savka-dragging .savka-page-hotspot{pointer-events:none}

    #savkaBookRoot .savka-corner-grab{
      position:absolute; bottom:20px; width:88px; height:88px; z-index:4;
      border:none; background:transparent; cursor:grab; padding:0;
    }
    #savkaBookRoot .savka-corner-grab:active{cursor:grabbing}
    #savkaBookRoot .savka-corner-grab.left{left:0}
    #savkaBookRoot .savka-corner-grab.right{right:0}
    #savkaBookRoot .savka-corner-grab::before{
      content:""; position:absolute; inset:auto 0 0 auto;
      width:52px; height:52px; opacity:.44;
      background:linear-gradient(135deg,rgba(255,246,214,.0) 48%,rgba(245,228,184,.86) 49%,rgba(233,210,159,.94) 72%,rgba(189,142,79,.78) 100%);
      box-shadow:-2px -2px 8px rgba(83,48,21,.12);
      border-radius:0 0 12px 0;
      pointer-events:none;
    }
    #savkaBookRoot .savka-corner-grab.left::before{
      left:0; right:auto;
      transform:scaleX(-1);
      border-radius:0 0 0 12px;
      box-shadow:2px -2px 8px rgba(83,48,21,.12);
    }
    #savkaBookRoot.savka-dragging .savka-corner-grab{opacity:.35}

    #savkaBookRoot .savka-book-controls{
      position:absolute; left:0; right:0; bottom:0; height:66px;
      display:flex; align-items:center; justify-content:space-between; gap:8px;
      padding:0 10px 10px 10px; z-index:3;
    }
    #savkaBookRoot .savka-btn-group{display:flex; align-items:center; gap:8px}
    #savkaBookRoot .savka-btn,
    #savkaBookRoot .savka-page-chip{
      appearance:none; border:none; cursor:pointer; min-height:40px; border-radius:999px;
      padding:9px 16px; background:rgba(74,44,22,.94); color:#f6e7c5;
      font-weight:700; font-size:16px; box-shadow:0 3px 8px rgba(0,0,0,.18);
    }
    #savkaBookRoot .savka-btn:hover{transform:translateY(-1px)}
    #savkaBookRoot .savka-btn:disabled{opacity:.45; cursor:default; transform:none}
    #savkaBookRoot .savka-page-chip{
      cursor:default; background:rgba(103,58,30,.84); font-size:15px;
      padding:9px 14px; min-width:76px; text-align:center;
    }
    #savkaBookRoot .savka-close{
      position:absolute; right:8px; top:8px; width:36px; height:36px; padding:0;
      border-radius:999px; font-size:18px; line-height:36px; text-align:center;
      background:rgba(78,42,22,.96); color:#f8ebd1; z-index:4;
    }
    #savkaBookRoot .savka-header-label{
      position:absolute; left:14px; right:54px; top:-14px;
      display:flex; justify-content:flex-start; z-index:4;
    }
    #savkaBookRoot .savka-header-label span{
      display:inline-block; padding:9px 16px; border-radius:999px;
      background:rgba(108,63,33,.96); color:#f7e4bf;
      font-weight:700; font-size:16px; box-shadow:0 3px 8px rgba(0,0,0,.16);
      max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }`;

    document.head.appendChild(style);

    const root=document.createElement('div');
    root.id='savkaBookRoot';
    root.innerHTML=`
      <div class="savka-side-fade" aria-hidden="true"></div>
      <button class="savka-book-tab" type="button" aria-label="Otvori Baba Savkinu knjigu recepata" title="Baba Savkina knjiga recepata">
        <img class="savka-tab-cover" src="${SAVKA_BOOK_COVER}" alt="Baba Savkina knjiga recepata">
      </button>
      <div class="savka-book-shell" aria-hidden="true">
        <div class="savka-book-panel">
          <div class="savka-header-label"><span></span></div>
          <button class="savka-btn savka-close" type="button" aria-label="Zatvori knjigu">×</button>
          <div class="savka-book-stage">
            <img class="savka-book-page" alt="Stranica knjige">
            <img class="savka-book-flip" alt="">
            <div class="savka-page-fold-shadow" aria-hidden="true"></div>
            <div class="savka-page-curl" aria-hidden="true"></div>
            <button class="savka-page-hotspot left" type="button" aria-label="Prethodna stranica" title="Prethodna stranica"></button>
            <button class="savka-page-hotspot right" type="button" aria-label="Sledeća stranica" title="Sledeća stranica"></button>
            <button class="savka-corner-grab left" type="button" aria-label="Prevuci ugao za prethodnu stranicu" title="Prevuci ugao"></button>
            <button class="savka-corner-grab right" type="button" aria-label="Prevuci ugao za sledeću stranicu" title="Prevuci ugao"></button>
          </div>
          <div class="savka-book-controls">
            <div class="savka-btn-group">
              <button class="savka-btn savka-prev" type="button">‹ Prethodna</button>
              <button class="savka-btn savka-next" type="button">Sledeća ›</button>
            </div>
            <div class="savka-page-chip"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','dblclick','wheel','contextmenu','touchstart','touchmove','touchend'].forEach(type=>{
      root.addEventListener(type,e=>{
        if(!savkaBookUiActive())return;
        e.stopPropagation();
      },false);
    });

    savkaBook={
      root,
      tab:root.querySelector('.savka-book-tab'),
      shell:root.querySelector('.savka-book-shell'),
      stage:root.querySelector('.savka-book-stage'),
      page:root.querySelector('.savka-book-page'),
      flip:root.querySelector('.savka-book-flip'),
      foldShadow:root.querySelector('.savka-page-fold-shadow'),
      curl:root.querySelector('.savka-page-curl'),
      prev:root.querySelector('.savka-prev'),
      next:root.querySelector('.savka-next'),
      close:root.querySelector('.savka-close'),
      chip:root.querySelector('.savka-page-chip'),
      header:root.querySelector('.savka-header-label span'),
      hotPrev:root.querySelector('.savka-page-hotspot.left'),
      hotNext:root.querySelector('.savka-page-hotspot.right'),
      cornerPrev:root.querySelector('.savka-corner-grab.left'),
      cornerNext:root.querySelector('.savka-corner-grab.right')
    };

    const onClickBtn=(el,fn)=>{
      if(!el)return;
      el.addEventListener('click',e=>{ savkaStop(e); fn(); });
    };
    onClickBtn(savkaBook.tab,()=>openSavkaBook());
    onClickBtn(savkaBook.close,()=>closeSavkaBook());
    onClickBtn(savkaBook.prev,()=>turnSavkaPageTo(savkaPageIndex-1));
    onClickBtn(savkaBook.next,()=>turnSavkaPageTo(savkaPageIndex+1));
    onClickBtn(savkaBook.hotPrev,()=>turnSavkaPageTo(savkaPageIndex-1));
    onClickBtn(savkaBook.hotNext,()=>turnSavkaPageTo(savkaPageIndex+1));
     savkaBook.stage.addEventListener('click',e=>{
       if(!savkaBookOpen||savkaTurning||e.target.closest('button'))return;
       const rect=savkaBook.stage.getBoundingClientRect();
       const dir=e.clientX-rect.left>=rect.width/2?'next':'prev';
       savkaStop(e);turnSavkaPageTo(savkaPageIndex+(dir==='next'?1:-1));
     });

    savkaBook.cornerNext.addEventListener('pointerdown',e=>beginSavkaTurn('next',e));
    savkaBook.cornerPrev.addEventListener('pointerdown',e=>beginSavkaTurn('prev',e));
    const onLostCornerCapture=e=>{
      if(savkaTurn?.dragging&&e.pointerId===savkaTurn.pointerId)cancelSavkaTurn(false);
    };
    savkaBook.cornerNext.addEventListener('lostpointercapture',onLostCornerCapture);
    savkaBook.cornerPrev.addEventListener('lostpointercapture',onLostCornerCapture);

    renderSavkaBookPage(savkaPageIndex);
    return root;
  }

  function renderSavkaBookPage(index){
    if(!savkaBook)return;
    index=Number.isFinite(+index)?Math.trunc(+index):0;
    index=Math.max(0,Math.min(SAVKA_BOOK_PAGES.length-1,index));
    const page=SAVKA_BOOK_PAGES[index]||SAVKA_BOOK_PAGES[0];
    savkaPageIndex=index;
    savkaBook.page.src=page.src;
    savkaBook.page.alt=page.label;
    savkaBook.header.textContent='Baba Savkina knjiga — '+page.label;
    savkaBook.chip.textContent=`${index+1} / ${SAVKA_BOOK_PAGES.length}`;
    savkaBook.prev.disabled=index<=0;
    savkaBook.next.disabled=index>=SAVKA_BOOK_PAGES.length-1;
    if(savkaBook.hotPrev)savkaBook.hotPrev.style.display=index<=0?'none':'block';
    if(savkaBook.hotNext)savkaBook.hotNext.style.display=index>=SAVKA_BOOK_PAGES.length-1?'none':'block';
    if(savkaBook.cornerPrev)savkaBook.cornerPrev.style.display=index<=0?'none':'block';
    if(savkaBook.cornerNext)savkaBook.cornerNext.style.display=index>=SAVKA_BOOK_PAGES.length-1?'none':'block';
  }

  function openSavkaBook(pageIndex=savkaPageIndex){
    if(!document.body){
      document.addEventListener('DOMContentLoaded',()=>openSavkaBook(pageIndex),{once:true});
      return null;
    }
    initSavkaRecipeBookUI();
    renderSavkaBookPage(pageIndex);
    if(!savkaBookOpen)playImpactSound(bookSoundTarget,'open');
    savkaBookOpen=true;
    savkaBook.root.classList.add('savka-open');
    savkaBook.shell.setAttribute('aria-hidden','false');
  }

  function closeSavkaBook(){
    if(!savkaBook||!savkaBookOpen)return;
    if(savkaTurn)cancelSavkaTurn(true);
    playImpactSound(bookSoundTarget,'close');
    savkaBookOpen=false;
    savkaBook.root.classList.remove('savka-open');
    savkaBook.shell.setAttribute('aria-hidden','true');
  }

  function clampSavka01(value){return Math.max(0,Math.min(1,+value||0));}

  function resetSavkaTurnVisual(){
    if(!savkaBook)return;
    const flip=savkaBook.flip;
    flip.style.opacity='0';
    flip.style.transform='';
    flip.style.transformOrigin='';
    flip.style.filter='';
    flip.style.transition='none';
    if(savkaBook.foldShadow){
      savkaBook.foldShadow.style.opacity='0';
      savkaBook.foldShadow.style.left='96%';
      savkaBook.foldShadow.style.width='34px';
      savkaBook.foldShadow.style.transform='translateX(-50%)';
    }
    if(savkaBook.curl){
      savkaBook.curl.style.opacity='0';
      savkaBook.curl.style.transform='';
    }
  }

  function drawSavkaTurn(progress){
    if(!savkaBook||!savkaTurn)return;
    const p=clampSavka01(progress);
    const dir=savkaTurn.dir;
    const vertical=Math.max(-1,Math.min(1,+savkaTurn.vertical||0));
    const bend=Math.sin(Math.PI*p);
    const signed=dir==='next'?-1:1;
    const angle=signed*(8*p+102*p*p);
    const lift=bend*26;
    const twist=signed*vertical*bend*5.5;
    const foldX=dir==='next'?100-p*93:p*93;
    const flip=savkaBook.flip;
    savkaTurn.progress=p;
    flip.style.opacity='1';
    flip.style.transformOrigin=dir==='next'?'left center':'right center';
    flip.style.transform=`translateZ(${lift.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg) rotateZ(${twist.toFixed(2)}deg) translateX(${(signed*12*p).toFixed(2)}px)`;
    flip.style.filter=`drop-shadow(${(-signed*8*bend).toFixed(1)}px ${(7+12*bend).toFixed(1)}px ${(10+13*bend).toFixed(1)}px rgba(42,20,7,${(.14+.24*bend).toFixed(3)})) brightness(${(1-.09*bend).toFixed(3)})`;
    if(savkaBook.foldShadow){
      savkaBook.foldShadow.style.left=foldX.toFixed(2)+'%';
      savkaBook.foldShadow.style.width=(22+64*bend).toFixed(1)+'px';
      savkaBook.foldShadow.style.opacity=(Math.min(.84,.08+p*.44+bend*.36)).toFixed(3);
      savkaBook.foldShadow.style.transform=`translateX(-50%) skewY(${(vertical*8*bend).toFixed(2)}deg)`;
    }
    if(savkaBook.curl){
      const show=dir==='next'?Math.min(.9,p*2.1)*(1-p*.68):0;
      const scale=.35+1.6*Math.min(1,p/.42);
      savkaBook.curl.style.opacity=show.toFixed(3);
      savkaBook.curl.style.transform=`translate(${(-p*78).toFixed(1)}px,${(-Math.abs(vertical)*12*bend).toFixed(1)}px) rotate(${(-10-vertical*12).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }
  }

  function prepareSavkaTurn(dir,pointerEvent=null){
    if(!savkaBookOpen||!savkaBook||savkaTurning)return false;
    const from=savkaPageIndex;
    const target=dir==='next'?from+1:from-1;
    if(target<0||target>=SAVKA_BOOK_PAGES.length)return false;
    if(savkaTurnRaf){cancelAnimationFrame(savkaTurnRaf);savkaTurnRaf=0;}
    savkaTurning=true;
    playImpactSound(bookSoundTarget,'pageTurn');
    savkaTurn={
      dir,from,target,
      pointerId:pointerEvent?.pointerId??null,
      captureEl:pointerEvent?.currentTarget??null,
      startX:pointerEvent?.clientX??0,
      startY:pointerEvent?.clientY??0,
      lastX:pointerEvent?.clientX??0,
      lastTime:performance.now(),
      velocity:0,progress:0,vertical:0,dragging:!!pointerEvent
    };
    savkaBook.root.classList.add('savka-dragging');
    savkaBook.flip.src=SAVKA_BOOK_PAGES[from].src;
    savkaBook.flip.alt='';
    savkaBook.flip.style.transition='none';
    // Show the destination below the turning leaf without changing the active
    // page index or hiding the captured corner button mid-drag.
    savkaBook.page.src=SAVKA_BOOK_PAGES[target].src;
    savkaBook.page.alt=SAVKA_BOOK_PAGES[target].label;
    drawSavkaTurn(.001);
    return true;
  }

  function beginSavkaTurn(dir,e){
    if(!prepareSavkaTurn(dir,e))return;
    savkaStop(e);
    try{e.currentTarget?.setPointerCapture?.(e.pointerId);}catch(_){}
  }

  function moveSavkaTurn(e){
    if(!savkaTurn?.dragging||e.pointerId!==savkaTurn.pointerId)return;
    savkaStop(e);
    const rect=savkaBook.stage.getBoundingClientRect();
    const travel=Math.max(180,rect.width*.72);
    const delta=savkaTurn.dir==='next'
      ? savkaTurn.startX-e.clientX
      : e.clientX-savkaTurn.startX;
    const p=clampSavka01(delta/travel);
    const now=performance.now();
    const dt=Math.max(8,now-savkaTurn.lastTime);
    const signedDx=savkaTurn.dir==='next'
      ? savkaTurn.lastX-e.clientX
      : e.clientX-savkaTurn.lastX;
    const instantVelocity=signedDx/dt;
    savkaTurn.velocity=savkaTurn.velocity*.68+instantVelocity*.32;
    savkaTurn.lastX=e.clientX;
    savkaTurn.lastTime=now;
    savkaTurn.vertical=Math.max(-1,Math.min(1,(e.clientY-savkaTurn.startY)/(rect.height*.28)));
    drawSavkaTurn(p);
  }

  function finalizeSavkaTurn(commit){
    if(!savkaTurn)return;
    const finished=savkaTurn;
    finished.dragging=false;
    try{
      if(finished.captureEl?.hasPointerCapture?.(finished.pointerId))
        finished.captureEl.releasePointerCapture(finished.pointerId);
    }catch(_){}
    renderSavkaBookPage(commit?finished.target:finished.from);
    resetSavkaTurnVisual();
    savkaBook.root.classList.remove('savka-dragging');
    savkaTurn=null;
    savkaTurning=false;
    savkaTurnRaf=0;
  }

  function animateSavkaTurn(destination){
    if(!savkaTurn)return;
    const from=savkaTurn.progress;
    const to=clampSavka01(destination);
    const commit=to===1;
    const started=performance.now();
    const duration=150+Math.abs(to-from)*190;
    savkaTurn.dragging=false;
    const frame=now=>{
      if(!savkaTurn)return;
      const t=clampSavka01((now-started)/duration);
      const eased=1-Math.pow(1-t,3);
      drawSavkaTurn(from+(to-from)*eased);
      if(t<1)savkaTurnRaf=requestAnimationFrame(frame);
      else finalizeSavkaTurn(commit);
    };
    savkaTurnRaf=requestAnimationFrame(frame);
  }

  function releaseSavkaTurn(e,cancel=false){
    if(!savkaTurn?.dragging||e.pointerId!==savkaTurn.pointerId)return;
    savkaStop(e);
    const commit=!cancel&&(savkaTurn.progress>=.42||savkaTurn.velocity>.72);
    animateSavkaTurn(commit?1:0);
  }

  function cancelSavkaTurn(instant=false){
    if(!savkaTurn)return;
    if(instant){finalizeSavkaTurn(false);return;}
    animateSavkaTurn(0);
  }

  function turnSavkaPageTo(nextIndex){
    if(!savkaBook||savkaTurning)return;
    nextIndex=Math.max(0,Math.min(SAVKA_BOOK_PAGES.length-1,nextIndex));
    if(nextIndex===savkaPageIndex)return;
    const dir=nextIndex>savkaPageIndex?'next':'prev';
    if(prepareSavkaTurn(dir,null))animateSavkaTurn(1);
  }

  window.addEventListener('pointermove',moveSavkaTurn,true);
  window.addEventListener('pointerup',e=>releaseSavkaTurn(e,false),true);
  window.addEventListener('pointercancel',e=>releaseSavkaTurn(e,true),true);

  window.addEventListener('keydown',e=>{
    if(!savkaBookOpen){
      if((e.key==='r'||e.key==='R')&&!e.repeat && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||'')){
        openSavkaBook(); e.preventDefault();
      }
      return;
    }
    if(savkaTurn?.dragging)return;
    if(e.key==='Escape'){ closeSavkaBook(); return; }
    if(e.key==='ArrowRight'){ turnSavkaPageTo(savkaPageIndex+1); e.preventDefault(); return; }
    if(e.key==='ArrowLeft'){ turnSavkaPageTo(savkaPageIndex-1); e.preventDefault(); return; }
  });

  window.CooksterSavkaBook={
    open:openSavkaBook,
    close:closeSavkaBook,
    next:()=>turnSavkaPageTo(savkaPageIndex+1),
    prev:()=>turnSavkaPageTo(savkaPageIndex-1),
    page:(i)=>openSavkaBook(i),
    getState:()=>({open:savkaBookOpen,index:savkaPageIndex,pages:SAVKA_BOOK_PAGES.map(p=>p.id)})
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSavkaRecipeBookUI,{once:true});
  else initSavkaRecipeBookUI();
})();
