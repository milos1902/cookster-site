
(function(){
  const marketScene=document.getElementById('marketScene');
  const marketNotice=document.getElementById('marketNotice');
  const piles=Array.from(document.querySelectorAll('#marketHoverLayer .market-pile'));

  const panel=document.getElementById('marketBargainPanel');
  const productEl=document.getElementById('marketBargainProduct');
  const sellerPriceEl=document.getElementById('marketSellerPrice');
  const offerValueEl=document.getElementById('marketOfferValue');
  const slider=document.getElementById('marketOfferSlider');
  const minEl=document.getElementById('marketOfferMin');
  const maxEl=document.getElementById('marketOfferMax');
  const haggleBtn=document.getElementById('marketHaggleBtn');
  const acceptBtn=document.getElementById('marketAcceptBtn');
  const closeBtn=document.getElementById('marketBargainClose');
  const roundEl=document.getElementById('marketRoundInfo');
  const quantityStep=document.getElementById('marketQuantityStep');
  const quantityButtons=Array.from(document.querySelectorAll('#marketQuantityStep [data-kg]'));
  const haggleStep=document.getElementById('marketHaggleStep');
  const sellerAskWrap=document.getElementById('marketSellerAskWrap');
  const bubble=document.getElementById('marketSellerBubble');
  const sellerText=document.getElementById('marketSellerText');
  const sellerBubblePrice=document.getElementById('marketSellerBubblePrice');
  const marketBagShelf=document.getElementById('marketBagShelf');
  const marketBagRow=document.getElementById('marketBagRow');
  const marketCollectBags=document.getElementById('marketCollectBags');
  const cartEl=document.getElementById('marketCart');
  const cartItems=document.getElementById('marketCartItems');
  const cartCount=document.getElementById('marketCartCount');
  const cartTotal=document.getElementById('marketCartTotal');
  const cartBuy=document.getElementById('marketCartBuy');

  if(!marketScene||!marketNotice||!piles.length||!panel||!slider)return;

  const PRODUCTS=Object.freeze({
    paradajz:      {label:'Парадајз',       price:300, floor:.72, unit:'kg', avgWeightG:125},
    krastavac:     {label:'Краставац',      price:280, floor:.74, unit:'kg', avgWeightG:200},
    paprika_crvena:{label:'Црвена паприка', price:350, floor:.76, unit:'kg', avgWeightG:150},
    paprika_zelena:{label:'Зелена паприка', price:320, floor:.75, unit:'kg', avgWeightG:150},
    luk:           {label:'Црни лук',       price:200, floor:.70, unit:'kg', avgWeightG:100},
    beli_luk:      {label:'Бели лук',       price:260, floor:.78, unit:'kg', avgWeightG:50},
    sargarepa:     {label:'Шаргарепа',      price:160, floor:.70, unit:'kg', avgWeightG:100},
    zelena_salata: {label:'Зелена салата',  price:150, floor:.72, unit:'kg', avgWeightG:300},
    kupus:         {label:'Купус',          price:180, floor:.70, unit:'kg', avgWeightG:1000},
    patlidzan:     {label:'Патлиџан',       price:260, floor:.74, unit:'kg', avgWeightG:300},
    tikvice:       {label:'Тиквице',        price:220, floor:.72, unit:'kg', avgWeightG:250},
    rotkvice:      {label:'Ротквице',       price:140, floor:.68, unit:'kg', avgWeightG:25},
    persun:        {label:'Першун',          price:120, floor:.65, unit:'bunch'}
  });

  const OPENING_LINES=[
    'Е, домаћине, добро си око бацио. Свежа роба, јутрос стигла.',
    'Узимај слободно, боље данас на пијаци нећеш наћи.',
    'Е, то ти је добра роба. Није пластика из маркета.',
    'Види, пријатељу, лепо си изабрао.',
    'Ааа, знаш шта ваља. Ово ми прво оде свако јутро.',
    'Приђи, домаћине, немој да се стидиш. За доброг купца увек има договора.',
    'Е, ово ти је право домаће. Нема ту много приче.',
    'Добар избор. Само немој одмах да кренеш да ме обараш с ценом.',
    'Хајде, да видимо можемо ли да се договоримо као људи.',
    'Узми, брате, пробрана роба. А за цену… е, ту ћемо мало да се надмудрујемо.'
  ];

  const LOW_LINES=[
    'Пријатељу, за те паре могу само да ти дам кесу.',
    'Немој ме нервираш од раног јутра, лепо те молим.',
    'Јеси дошао да купиш или да ме тераш да затворим тезгу?',
    'Е, домаћине, није ово хуманитарна организација.',
    'Ајде, немој да се брукамо обојица. Дај нешто озбиљније.',
    'За те паре ни комшији не бих дао, а он ми дугује услугу.',
    'Па брате, и ја морам нешто да однесем кући.',
    'Немој ме за срце хваташ с том понудом.',
    'Е, ако ти то прође код неког другог, зови и мене да купујем.',
    'Ајде, ајде… видим ја да си ти професионалац за ценкање.',
    'Ти би да купиш, а ја да плачем после. Не иде тако.',
    'Ма може ценкање, али немој баш да ме сахраниш с ценом.',
    'Лепо ти мене тераш да радим за џабе, а?',
    'Добро, немој одмах да ми рушиш кућни буџет.',
    'Е, сад си ме већ наљутио. Подигни то мало па да причамо као људи.'
  ];

  const COUNTER_LINES=[
    'Е, не може баш тако. Ајде да се нађемо негде на пола пута.',
    'Добро, спустио сам ти мало. Немој сад и душу да ми узмеш.',
    'Ајде, идем ти у сусрет, али и ти мораш мени.',
    'Видим ја да си ти дошао спреман. Ево ти моја нова понуда.',
    'Добро, попуштам мало. Више од овога тешко.',
    'Е, ово је већ ближе договору. Шта кажеш?',
    'Можемо ми ово да завршимо као људи.',
    'Ти мало горе, ја мало доле — па да пружимо руку.'
  ];

  const ACCEPT_LINES=[
    'Е, то је већ поштена цена. Договорено.',
    'Ајде, може. Да се не гањамо више око ситниша.',
    'Важи, домаћине. Пружамо руку.',
    'Е, сад причамо као људи. Нека буде.',
    'Добро, сломио си ме. Твоје је.',
    'Може, брате. За тебе по тој цени.',
    'Ајде, нека ти буде. Само немој свима да причаш колико сам спустио.',
    'Е, добро си се ценкао. Договорено.',
    'Важи. Ти задовољан, ја задовољан — тако треба.',
    'Ајде, носи док се нисам предомислио.'
  ];

  const KICKOUT_LINES=[
    'Е, доста је било, домаћине. Нећемо се више ценкати.',
    'Ајде, продужи даље. Од ове трговине данас нема ништа.',
    'Три пута ти спуштам, а ти опет по свом. Завршили смо.',
    'Немој ме више нервираш, брате. Нећу ти продам.',
    'Ма не иде. Иди мало прошетај па се врати кад се предомислиш.',
    'Е, сад си претерао. И да ми даш више, из ината ти не дам.',
    'Доста смо се ми надмудривали за данас. Следећи!',
    'Иди бре код Жике Паприке, он има живаца за овакве муштерије.',
    'Пробај код Милета Купусара, можда ти он да за те паре.',
    'Чеда Кромпир је две тезге ниже, па њему руши цену.',
    'Иди код Пере Краставца, он воли да се ценка до подне.',
    'Раде Ротквица је преко пута, па њему дижи притисак.',
    'Љуба Луковац можда ће да ти попусти, ја више нећу.',
    'Бора Парадајз је млад, има још живаца. Иди код њега.',
    'Мома Першун је тамо на крају реда — можда он воли овакве преговоре.'
  ];

  const SOLD_LINES=[
    'Жив био, пријатељу. Добра куповина!',
    'Договор је договор. Нека те лепо служи.',
    'Е, тако се тргује на пијаци!',
    'Хвала, домаћине. Наврати опет.'
  ];

  const round5=v=>Math.max(5,Math.round(v/5)*5);
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)]||'';
  const fmt=v=>`${Math.round(v)} дин`;
  const defaultText='Пређи мишем преко производа';

  const kgLabel=kg=>{
    const n=+kg||0;
    if(n===0.5)return '500 г';
    if(n===1)return '1 кг';
    if(n===1.5)return '1,5 кг';
    if(n===2)return '2 кг';
    return `${String(n).replace('.',',')} кг`;
  };
  const bunchLabel=n=>{
    const v=Math.max(1,Math.round(+n||1));
    return `${v} ${v===1?'везица':'везице'}`;
  };
  const quantityLabel=(mode,value)=>mode==='bunch'?bunchLabel(value):kgLabel(value);
  const quantityPrice=(basePrice,value)=>round5((+basePrice||0)*(+value||0));

  function quantitySpecsFor(key){
    if(key==='kupus')return [
      {value:1,mode:'kg',label:'1 кг'},
      {value:2,mode:'kg',label:'2 кг'}
    ];
    if(key==='persun')return [
      {value:1,mode:'bunch',label:'1 везица'},
      {value:2,mode:'bunch',label:'2 везице'},
      {value:3,mode:'bunch',label:'3 везице'},
      {value:4,mode:'bunch',label:'4 везице'}
    ];
    return [
      {value:.5,mode:'kg',label:'500 г'},
      {value:1,mode:'kg',label:'1 кг'},
      {value:1.5,mode:'kg',label:'1,5 кг'},
      {value:2,mode:'kg',label:'2 кг'}
    ];
  }

  function configureQuantityButtons(key){
    const specs=quantitySpecsFor(key);
    quantityButtons.forEach((btn,i)=>{
      const spec=specs[i];
      const show=!!spec;
      btn.hidden=!show;
      btn.disabled=!show;
      btn.classList.remove('selected');
      if(spec){
        btn.dataset.quantityValue=String(spec.value);
        btn.dataset.quantityMode=spec.mode;
        btn.textContent=spec.label;
      }else{
        delete btn.dataset.quantityValue;
        delete btn.dataset.quantityMode;
      }
    });
  }

  // Seller patience is continuous rather than a fixed round count.
  // Gentle offers consume little patience and can reach 5 rounds.
  // Aggressive offers consume much more and can end bargaining immediately.
  function patienceCost(offer,ask,initial){
    const a=Math.max(1,+ask||1),i=Math.max(1,+initial||a),o=Math.max(0,+offer||0);
    const askRatio=o/a;
    const initialRatio=o/i;
    if(initialRatio<0.58 || askRatio<0.58)return 5.2;  // insulting: can end after first try
    if(askRatio<0.66)return 3.2;
    if(askRatio<0.74)return 2.25;
    if(askRatio<0.82)return 1.45;
    if(askRatio<0.90)return 1.00;
    return .68;
  }

  let selected=null;
  let session=null;
  let bubbleTimer=null;
  const cart=new Map();

  function cartStep(key){return key==='persun'||key==='kupus'?1:.5;}
  function cartMode(key){return key==='persun'?'bunch':'kg';}
  function cartEntries(){return [...cart].map(([key,value])=>({key,value,mode:cartMode(key),product:PRODUCTS[key]}));}
  function cartPrice(){return round5(cartEntries().reduce((total,item)=>total+item.product.price*item.value,0));}
  function renderCart(){
    if(!cartItems||!cartBuy)return;
    cartItems.replaceChildren();
    const entries=cartEntries();
    if(!entries.length)cartItems.textContent='Изабери поврће са тезге.';
    for(const item of entries){
      const row=document.createElement('div');row.className='market-cart-row';
      const name=document.createElement('span');name.textContent=item.product.label;
      const qty=document.createElement('small');qty.textContent=quantityLabel(item.mode,item.value);
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label',`Смањи: ${item.product.label}`);
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label',`Повећај: ${item.product.label}`);
      minus.onclick=()=>changeCart(item.key,-cartStep(item.key));
      plus.onclick=()=>changeCart(item.key,cartStep(item.key));
      row.append(name,qty,minus,plus);cartItems.appendChild(row);
    }
    cartCount.textContent=String(entries.length);
    cartTotal.textContent=entries.length?`Укупно пре ценкања: ${fmt(cartPrice())}`:'';
    cartBuy.disabled=!entries.length;
    piles.forEach(btn=>btn.classList.toggle('market-selected',cart.has(btn.dataset.key)));
  }
  function changeCart(key,delta){
    if(!PRODUCTS[key]||session||(delta>0&&isRefusedToday(key)))return;
    const value=Math.round(((cart.get(key)||0)+delta)*100)/100;
    if(value<=0)cart.delete(key);else cart.set(key,value);
    renderCart();
    setNotice(cart.size?`${cart.size} производа у корпи · ${fmt(cartPrice())}`:defaultText);
  }

  function setNotice(text){
    marketNotice.textContent=text||defaultText;
  }
  function setBubble(text,sticky=true,price=null){
    clearTimeout(bubbleTimer);
    sellerText.textContent=text||'';
    if(sellerBubblePrice){
      const hasPrice=price!==null&&price!==undefined&&Number.isFinite(+price);
      sellerBubblePrice.textContent=hasPrice?fmt(+price):'';
      sellerBubblePrice.classList.toggle('show',hasPrice);
      sellerBubblePrice.setAttribute('aria-hidden',hasPrice?'false':'true');
    }
    bubble.classList.toggle('show',!!text);
    bubble.setAttribute('aria-hidden',text?'false':'true');
    if(text&&!sticky){
      bubbleTimer=setTimeout(()=>hideBubble(),2200);
    }
  }
  function hideBubble(){
    clearTimeout(bubbleTimer);
    bubble.classList.remove('show');
    bubble.setAttribute('aria-hidden','true');
    if(sellerBubblePrice){
      sellerBubblePrice.textContent='';
      sellerBubblePrice.classList.remove('show');
      sellerBubblePrice.setAttribute('aria-hidden','true');
    }
  }

  function currentGameDay(){
    return Math.max(1,Math.round(+window.CooksterState?.player?.day||1));
  }
  function refusalMap(){
    window.CooksterState.market??={};
    window.CooksterState.market.refusedDayByProduct??={};
    return window.CooksterState.market.refusedDayByProduct;
  }
  function isRefusedToday(key){
    return +refusalMap()[key]===currentGameDay();
  }
  function refuseForToday(key){
    refusalMap()[key]=currentGameDay();
    window.CooksterSave?.schedule?.();
  }

  function syncProductAvailability(){
    piles.forEach(btn=>{
      const blocked=isRefusedToday(btn.dataset.key);
      btn.disabled=blocked;
      btn.classList.toggle('market-unavailable',blocked);
      btn.setAttribute('aria-disabled',blocked?'true':'false');
      if(blocked)btn.classList.remove('market-selected');
    });
  }

  function renderMarketBagShelf(){
    if(!marketBagShelf||!marketBagRow||!marketCollectBags)return;
    const bags=window.CooksterMarketTrade?.getPendingBags?.()||[];
    marketBagRow.innerHTML='';
    bags.forEach((bag,i)=>{
      const card=document.createElement('div');
      card.className='market-mini-bag';
      const mode=bag.quantityMode||'kg';
      const value=mode==='bunch'?(+bag.quantityBunches||+bag.quantityValue||1):(+bag.quantityKg||+bag.quantityValue||1);
      const qty=quantityLabel(mode,value);
      const image=document.createElement('img');
      image.src='assets/market_paper_bag.png';image.alt='';
      const label=document.createElement('span');
      label.textContent=bag.label||'Намирница';
      const quantity=document.createElement('small');
      quantity.textContent=qty;
      card.append(image,label,quantity);
      marketBagRow.appendChild(card);
    });
    marketBagShelf.classList.toggle('show',bags.length>0);
    marketCollectBags.style.display=bags.length?'inline-flex':'none';
    marketCollectBags.textContent=bags.length===1?'ПОКУПИ КЕСУ':`ПОКУПИ СВЕ КЕСЕ (${bags.length})`;
  }
  function clearSelection(){
    piles.forEach(btn=>btn.classList.remove('market-selected'));
    selected=null;
  }
  function selectPile(btn){
    clearSelection();
    selected=btn;
    btn.classList.add('market-selected');
  }
  function closeBargain(keepSelection=false){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    marketScene.classList.remove('bargaining-open');
    session=null;
    hideBubble();
    quantityButtons.forEach(b=>{
      b.classList.remove('selected');
      b.hidden=false;
      b.disabled=false;
      delete b.dataset.quantityValue;
      delete b.dataset.quantityMode;
    });
    quantityStep?.classList.remove('hidden');
    haggleStep?.classList.remove('active');
    haggleStep?.setAttribute('aria-hidden','true');
    sellerAskWrap?.classList.add('hidden');
    if(!keepSelection)clearSelection();
    renderCart();
    setNotice(defaultText);
  }

  function sliderGradient(){
    const min=+slider.min||0,max=+slider.max||1,val=+slider.value||0;
    const pct=Math.max(0,Math.min(100,((val-min)/Math.max(1,max-min))*100));
    slider.style.setProperty('--offer-pct',pct.toFixed(2)+'%');
  }

  function updatePanel(){
    if(!session||!session.quantityValue)return;
    const {product,sellerAsk,minOffer}=session;
    productEl.textContent=session.basket?`Цела корпа · ${session.items.length} производа`:`${product.label} · ${quantityLabel(session.quantityMode,session.quantityValue)}`;
    sellerPriceEl.textContent=fmt(sellerAsk);
    slider.min=String(minOffer);
    slider.max=String(sellerAsk);
    slider.step='5';

    let current=round5(+slider.value||round5(session.initialPrice*.82));
    current=Math.max(minOffer,Math.min(sellerAsk,current));
    slider.value=String(current);

    offerValueEl.textContent=fmt(current);
    minEl.textContent=fmt(minOffer);
    maxEl.textContent=fmt(sellerAsk);
    acceptBtn.textContent=`ПРИХВАТИ ${fmt(sellerAsk)}`;
    roundEl.textContent=`Ценкање ${Math.min(5,session.attempts+1)}/5`;
    sliderGradient();
  }

  function startBargain(btn){
    if(!marketScene.classList.contains('open'))return;
    const key=btn.dataset.key;
    const product=PRODUCTS[key];
    if(!product)return;

    selectPile(btn);

    if(isRefusedToday(key)){
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden','true');
      marketScene.classList.remove('bargaining-open');
      session=null;
      setNotice(`${product.label} — данас нема трговине`);
      setBubble(pick(KICKOUT_LINES));
      return;
    }

    session={
      key,
      product,
      quantityValue:null,
      quantityMode:null,
      initialPrice:0,
      sellerAsk:0,
      floorPrice:0,
      minOffer:0,
      attempts:0,
      patience:5.0,
      lowballs:0
    };

    productEl.textContent=product.label;
    configureQuantityButtons(key);
    quantityStep?.classList.remove('hidden');
    haggleStep?.classList.remove('active');
    haggleStep?.setAttribute('aria-hidden','true');
    sellerAskWrap?.classList.add('hidden');

    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    marketScene.classList.add('bargaining-open');
    hideBubble();
    setNotice(`${product.label} — прво изабери количину`);
  }

  function startCartBargain(){
    if(!marketScene.classList.contains('open')||session||!cart.size)return;
    const items=cartEntries().filter(item=>!isRefusedToday(item.key));
    if(!items.length){setNotice('Ништа из корпе данас није доступно.');return;}
    const total=round5(items.reduce((sum,item)=>sum+item.product.price*item.value,0));
    const floor=round5(items.reduce((sum,item)=>sum+item.product.price*item.value*item.product.floor,0));
    session={basket:true,items,key:null,product:{label:'Цела корпа'},quantityValue:1,quantityMode:'basket',
      initialPrice:total,sellerAsk:total,floorPrice:floor,minOffer:round5(total*.45),
      attempts:0,patience:5.0,lowballs:0};
    slider.value=String(round5(total*.82));
    quantityStep?.classList.add('hidden');
    haggleStep?.classList.add('active');haggleStep?.setAttribute('aria-hidden','false');
    sellerAskWrap?.classList.remove('hidden');
    haggleBtn.disabled=false;acceptBtn.disabled=false;slider.disabled=false;
    panel.classList.add('open');panel.setAttribute('aria-hidden','false');
    marketScene.classList.add('bargaining-open');
    updatePanel();setBubble(pick(OPENING_LINES),true,total);
    setNotice(`Цела корпа · ${items.length} производа — ценкање`);
  }

  function chooseQuantity(btn){
    if(!session)return;
    const value=+btn.dataset.quantityValue;
    const mode=btn.dataset.quantityMode||'kg';
    const valid=quantitySpecsFor(session.key).some(spec=>spec.value===value&&spec.mode===mode);
    if(!valid)return;

    quantityButtons.forEach(b=>b.classList.toggle('selected',b===btn));
    const total=quantityPrice(session.product.price,value);

    session.quantityValue=value;
    session.quantityMode=mode;
    session.initialPrice=total;
    session.sellerAsk=total;
    session.floorPrice=round5(total*session.product.floor);
    session.minOffer=round5(total*.45);
    session.attempts=0;
    session.patience=5.0;
    session.lowballs=0;

    slider.value=String(round5(total*.82));
    sellerAskWrap?.classList.remove('hidden');
    quantityStep?.classList.add('hidden');
    haggleStep?.classList.add('active');
    haggleStep?.setAttribute('aria-hidden','false');

    haggleBtn.disabled=false;
    acceptBtn.disabled=false;
    slider.disabled=false;

    updatePanel();
    setNotice(`${session.product.label} · ${quantityLabel(mode,value)} — ценкање`);
    setBubble(pick(OPENING_LINES),true,total);
  }

  function offerChanged(){
    if(!session)return;
    offerValueEl.textContent=fmt(+slider.value||0);
    sliderGradient();
  }

  function sellerCounterFor(offer){
    const s=session;
    const ask=Math.max(5,+s.sellerAsk||5);
    const floor=Math.max(5,+s.floorPrice||5);

    if(offer<floor*.80){
      s.lowballs++;
      const drop=Math.max(5,round5((ask-floor)*.08));
      return Math.max(floor,ask-drop);
    }
    if(offer<floor){
      s.lowballs++;
      const drop=Math.max(5,round5((ask-floor)*.14));
      return Math.max(floor,ask-drop);
    }

    // v198.5.15.1: v198.5.15 removed `round` from the session model but this
    // calculation still referenced s.round, producing NaN after the first
    // successful press of "ЦЕНКАЈ СЕ". Use the real attempt counter instead.
    const attempt=Math.max(1,Math.min(5,+s.attempts||1));
    const gap=Math.max(0,ask-offer);
    const concession=round5(gap*(.32+.04*attempt));
    const counter=Math.max(floor,ask-Math.max(5,concession));
    return Number.isFinite(counter)?counter:Math.max(floor,ask-5);
  }

  function kickOut(){
    if(!session)return;
    const s=session;
    if(s.basket)s.items.forEach(item=>refuseForToday(item.key));
    else refuseForToday(s.key);
    syncProductAvailability();
    haggleBtn.disabled=true;
    acceptBtn.disabled=true;
    slider.disabled=true;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    marketScene.classList.remove('bargaining-open');
    setNotice(`${s.product.label} — продавац данас више не продаје`);
    setBubble(pick(KICKOUT_LINES));
    session=null;
  }

  function haggle(){
    if(!session||!session.quantityValue)return;
    const s=session;

    // Absolute ceiling: never more than 5 attempts.
    if(s.attempts>=5){
      kickOut();
      return;
    }

    const offer=round5(+slider.value||0);
    const gap=s.sellerAsk-offer;

    s.attempts+=1;
    s.patience-=patienceCost(offer,s.sellerAsk,s.initialPrice);

    // A very insulting first offer can end the deal immediately.
    if(s.patience<=0){
      kickOut();
      return;
    }

    // Fair/high offer can be accepted before reaching any limit.
    if(offer>=s.sellerAsk){
      s.sellerAsk=offer;
      setBubble(pick(ACCEPT_LINES),true,s.sellerAsk);
      updatePanel();
      haggleBtn.disabled=true;
      return;
    }

    if(offer>=s.floorPrice && (gap<=10 || (s.attempts>=2 && offer>=s.floorPrice*1.04))){
      s.sellerAsk=offer;
      setBubble(pick(ACCEPT_LINES),true,s.sellerAsk);
      updatePanel();
      haggleBtn.disabled=true;
      return;
    }

    // Five gentle attempts is the hard maximum.
    if(s.attempts>=5){
      kickOut();
      return;
    }

    const counter=sellerCounterFor(offer);
    if(!Number.isFinite(counter)){
      setBubble('Чекај мало, нешто сам се прерачунао. Ајде поново.');
      return;
    }
    s.sellerAsk=counter;

    if(offer<s.floorPrice){
      setBubble(pick(LOW_LINES),true,counter);
    }else{
      setBubble(pick(COUNTER_LINES),true,counter);
    }

    slider.value=String(round5(Math.min(counter,offer+Math.max(5,(counter-offer)*.35))));
    updatePanel();
  }

  function accept(){
    if(!session)return;
    const s=session;
    const price=round5(s.sellerAsk);
    const trade=window.CooksterMarketTrade;
    const wallet=trade?.getMoney?.()??Infinity;

    if(wallet<price){
      setBubble(`Е, пријатељу, фали ти још ${fmt(price-wallet)}.`);
      return;
    }

    const result=s.basket
      ?trade?.purchaseBasket?.(s.items.map(item=>({key:item.key,label:item.product.label,value:item.value,mode:item.mode,basePrice:item.product.price*item.value})),price)
      :trade?.purchase?.(s.key,s.product.label,price,s.quantityValue,s.quantityMode);
    renderMarketBagShelf();
    if(!result?.ok){
      setBubble('Нешто није у реду са куповином. Пробај поново.');
      return;
    }

    if(s.basket){s.items.forEach(item=>cart.delete(item.key));renderCart();}
    const soldLine=pick(SOLD_LINES);
    setBubble(soldLine);
    acceptBtn.disabled=true;
    haggleBtn.disabled=true;
    slider.disabled=true;
    setNotice(`${s.basket?'Цела корпа':s.product.label} — купљено за ${fmt(price)}`);

    setTimeout(()=>{
      acceptBtn.disabled=false;
      haggleBtn.disabled=false;
      slider.disabled=false;
      closeBargain(false);
    },1350);
  }

  piles.forEach(btn=>{
    const product=btn.dataset.product||btn.getAttribute('aria-label')||'Производ';

    btn.addEventListener('pointerenter',()=>{
      if(!session)setNotice(product);
    });
    btn.addEventListener('pointerleave',()=>{
      if(!session)setNotice(defaultText);
    });
    btn.addEventListener('focus',()=>{
      if(!session)setNotice(product);
    });
    btn.addEventListener('blur',()=>{
      if(!session)setNotice(defaultText);
    });
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      if(btn.disabled||btn.classList.contains('market-unavailable'))return;
      changeCart(btn.dataset.key,cartStep(btn.dataset.key)*2);
    });
  });

  quantityButtons.forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();chooseQuantity(btn);}));
  slider.addEventListener('input',offerChanged);
  haggleBtn.addEventListener('click',e=>{e.stopPropagation();haggle();});
  acceptBtn.addEventListener('click',e=>{e.stopPropagation();accept();});
  closeBtn.addEventListener('click',e=>{e.stopPropagation();closeBargain(false);});
  cartBuy?.addEventListener('click',e=>{e.stopPropagation();startCartBargain();});

  // v198.5.13.1:
  // Do NOT observe marketScene.class. Bargaining itself changes that class
  // ("bargaining-open"), so a class observer can fight the interaction.
  const marketBtn=document.getElementById('marketBtn');
  marketBtn?.addEventListener('click',()=>{
    // game.js opens the market first; this listener only resets market sub-UI.
    closeBargain(false);
    syncProductAvailability();
    renderMarketBagShelf();
    setNotice(defaultText);
  });

  marketCollectBags?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    const result=window.CooksterMarketTrade?.collectPendingBags?.();
    if(result?.ok){
      renderMarketBagShelf();
      closeBargain(false);
    }
  });
  window.addEventListener('cookster:market-bags-changed',renderMarketBagShelf);

  // Initial state also matters after explicit LOAD.
  syncProductAvailability();
  renderMarketBagShelf();
  renderCart();

  const marketBack=document.getElementById('marketBack');
  marketBack?.addEventListener('click',()=>{
    closeBargain(false);
  });

  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&panel.classList.contains('open')){
      e.stopPropagation();
      closeBargain(false);
    }
  },true);
})();
