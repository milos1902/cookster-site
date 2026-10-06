/* Količine, šta sme i šta ne sme, i ugled.
   INGREDIENTS: svaki dodatak (začin, ulje...) ima svoje rečenice kad ga ima premalo, previše, ili nikako ne treba da bude u jelu.
   RECIPES: za svako jelo, koliko čega ide (lo..hi je "taman"); dodatak koji nije nabrojan u jelu NE SME da bude u njemu.
   Gost primeti: premalo, previše, ili nešto što ne treba. To menja ugled kafane (localStorage cookster.reputation.v1).
   Novo jelo = novi unos u RECIPES; novi dodatak = unos u INGREDIENTS (i u amountsOf, odakle se čita količina iz posude). */
(function(){
  'use strict';
  const KEY='cookster.reputation.v1';
  const INGREDIENTS={
    paprika:{label:'paprika',none:'Gde je paprika?!',few:'Fali malo paprike.',many:'Previše paprike!',lots:'Jedva se jede od paprike!',forbid:'Zašto ima paprike u ovome?'},
    ulje:{label:'ulje',none:'Zašto nema ulja?',few:'Moglo bi malo više ulja.',many:'Ima previše ulja.',lots:'Pliva u ulju!',forbid:'Zašto ima ulja u ovome?'},
    biber:{label:'biber',none:'Fali malo bibera.',few:'Fali malo bibera.',many:'Previše bibera!',lots:'Pun je bibera, ne može da se jede!',forbid:'Ko je stavio biber u ovo?'},
    so:{label:'so',none:'Fali soli.',few:'Fali malo soli.',many:'Preslano je!',lots:'Neukusno preslano!',forbid:'Preslano je!'},
    secer:{label:'šećer',none:'Fali šećera.',few:'Moglo bi malo slađe.',many:'Previše je slatko!',lots:'Slatko kao sirup!',forbid:'Zašto je slatko?'},
    lovor:{label:'lovor',none:'Fali lovora.',few:'Fali malo lovora.',many:'Previše lovora!',lots:'Sve smrdi na lovor!',forbid:'Zašto ima lovora u ovome?'}
  };
  // lo..hi: the amount that is right (mouse swings for a spice, "measures" for oil). Everything not listed is forbidden in that dish.
  const RECIPES={
    kiseli_kupus:{label:'Kiseli kupus',parts:{paprika:{lo:2,hi:2},ulje:{lo:1.4,hi:2.6}}}
  };
  // how much of everything is in a bowl
  function amountsOf(bowl){
    const out={paprika:0,ulje:0,biber:0,so:0,secer:0,lovor:0};
    try{
      const sp=JSON.parse(bowl.dataset.spices||'{}');
      out.paprika=(+sp.tucana||0)+(+sp.paprika||0);
      for(const k of ['biber','so','secer','lovor'])out[k]=+sp[k]||0;
    }catch(_){}
    try{out.ulje=+(CooksterContainer.read(bowl).items?.ulje?.count)||0;}catch(_){}
    return out;
  }
  function judge(ing,part,v){
    if(!part){                                    // not allowed in this dish at all
      if(v<=0)return{level:0,text:''};
      return{level:v>1?2:1,text:ing.forbid};
    }
    if(v<=0)return{level:-2,text:ing.none};
    if(v<part.lo)return v<part.lo*.5?{level:-2,text:ing.none}:{level:-1,text:ing.few};
    if(v>part.hi)return v>part.hi*1.8?{level:2,text:ing.lots}:{level:1,text:ing.many};
    return{level:0,text:''};
  }
  function evaluate(bowl,dish){
    const r=RECIPES[dish||'kiseli_kupus'];if(!r)return{score:0,issues:[],perfect:true,amounts:{}};
    const am=amountsOf(bowl),issues=[];let score=0;
    for(const [k,ing] of Object.entries(INGREDIENTS)){
      const j=judge(ing,r.parts[k],am[k]||0);
      if(j.level!==0){issues.push(j.text);score-=Math.abs(j.level)>1?3:1;}
    }
    if(!issues.length)score=2;
    return{score,issues,perfect:!issues.length,amounts:am};
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY))||{score:0,served:0};}catch(_){return{score:0,served:0};}}
  function addReputation(d){
    const s=read();s.score=Math.max(-100,Math.min(100,(s.score||0)+d));s.served=(s.served||0)+1;
    try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}
    return s;
  }
  window.CooksterQuality={INGREDIENTS,RECIPES,evaluate,amountsOf,addReputation,reputation:()=>read().score||0,read};
})();
