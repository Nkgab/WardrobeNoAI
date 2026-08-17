(function(){
  // ---------------------------------------------------------------------
  // Compatibility shim: window.storage is an Anthropic-artifact-only API.
  // Outside Claude, this falls back to localStorage so the app still
  // persists data. Note: this is per-browser only (no cross-device sync,
  // no "shared" data support) — swap this out for a real backend if you
  // need that.
  // ---------------------------------------------------------------------
  if (typeof window.storage === 'undefined') {
    window.storage = {
      async get(key){
        const raw = localStorage.getItem('wr_' + key);
        if (raw === null) throw new Error('Key not found: ' + key);
        return { key, value: raw, shared: false };
      },
      async set(key, value){
        localStorage.setItem('wr_' + key, value);
        return { key, value, shared: false };
      },
      async delete(key){
        localStorage.removeItem('wr_' + key);
        return { key, deleted: true, shared: false };
      },
      async list(prefix){
        const p = 'wr_' + (prefix || '');
        const keys = Object.keys(localStorage).filter(k => k.startsWith(p)).map(k => k.slice(3));
        return { keys, prefix, shared: false };
      }
    };
  }

  const CATS = ["T-Shirts","Shirts","Tops","Trousers","Jeans","Shorts","Skirts","Dresses","Jackets","Hoodies","Shoes","Bags","Accessories"];
  const SWATCHES = ["#D8CDBA","#40342A","#B06B44","#8B9670","#C98F72","#4E5D6C","#C2AF8E","#E9DCC4","#5B4636","#8E3B2E","#6B7A8F","#D8B4A0"];
  const SEASONS = ["All Seasons","Spring","Summer","Autumn","Winter"];
  const CAT_TINTS = {
    "T-Shirts":"#C2AF8E","Shirts":"#8B9670","Tops":"#D8B4A0","Trousers":"#40342A","Jeans":"#4E5D6C",
    "Shorts":"#C98F72","Skirts":"#B06B44","Dresses":"#8E3B2E","Jackets":"#5B4636","Hoodies":"#6B7A8F",
    "Shoes":"#3E352B","Bags":"#7A6A56","Accessories":"#D8CDBA"
  };
  const TOP_GROUP = ["T-Shirts","Shirts","Tops","Hoodies"];
  const BOTTOM_GROUP = ["Trousers","Jeans","Shorts","Skirts"];
  const DRESS_GROUP = ["Dresses"];
  const SHOES_GROUP = ["Shoes"];
  const JACKET_GROUP = ["Jackets"];
  const ACCESSORY_GROUP = ["Bags","Accessories"];

  // ---------- ICON SYSTEM ----------
  // A single consistent line-icon set (stroke=currentColor) replacing mixed emoji/text glyphs.
  const ICON_PATHS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10"/><path d="M10 20.5v-6h4v6"/>',
    hanger: '<circle cx="12" cy="5" r="1.6"/><path d="M12 6.6v1.9"/><path d="M3 20l9-6 9 6"/><path d="M2.5 20h19"/>',
    shuffle: '<path d="M4 7h4l7 10h5"/><path d="M17 6l3 1.5L17 9"/><path d="M4 17h4l2.6-3.7"/><path d="M13.4 9.7 15 7.3"/><path d="M17 15l3 1.5L17 18"/>',
    heart: '<path d="M12 20.2s-7.2-4.4-9.6-8.7C.8 8 2.3 4.4 5.9 4.4c2 0 3.4 1.2 4.1 2.3.7-1.1 2.1-2.3 4.1-2.3 3.6 0 5.1 3.6 3.5 7.1C19.2 15.8 12 20.2 12 20.2z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17"/><path d="M8 3.2v3.6"/><path d="M16 3.2v3.6"/>',
    luggage: '<rect x="4" y="8" width="16" height="12.5" rx="2.2"/><path d="M9 8V6.3a1.2 1.2 0 0 1 1.2-1.2h3.6A1.2 1.2 0 0 1 15 6.3V8"/><path d="M9.3 12v4.3"/><path d="M14.7 12v4.3"/>',
    sparkles: '<path d="M12 3.2l1.35 4.05L17.4 8.6l-4.05 1.35L12 14l-1.35-4.05L6.6 8.6l4.05-1.35L12 3.2z"/><path d="M19 13.5l.65 1.95 1.95.65-1.95.65-.65 1.95-.65-1.95-1.95-.65 1.95-.65.65-1.95z"/>',
    palette: '<path d="M12 3.2A8.8 8.8 0 1 0 12 20.8c1.05 0 1.9-.85 1.9-1.9 0-.5-.2-.95-.5-1.28-.3-.35-.48-.78-.48-1.24 0-1.05.85-1.9 1.9-1.9h1.45c1.9 0 3.43-1.55 3.43-3.44 0-4.2-3.35-7.94-7.7-7.94z"/><circle cx="7.6" cy="10.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.1" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
    shirt: '<path d="M8.5 4 12 5.6 15.5 4 19 7l-2.3 2.3-1.7-1.1V20H8.5V8.2L6.8 9.3 4.5 7z"/>',
    dress: '<path d="M9.5 3.5h5L16 8l2.5 11.5a1 1 0 0 1-1 1.2H6.5a1 1 0 0 1-1-1.2L8 8z"/><path d="M9.5 3.5c0 1.6 1.1 2.8 2.5 2.8s2.5-1.2 2.5-2.8"/>',
    chevronLeft: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
    chevronRight: '<path d="M9 5.5 15.5 12 9 18.5"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    plus: '<path d="M12 4.5v15"/><path d="M4.5 12h15"/>',
    sliders: '<path d="M4 6h9"/><path d="M17 6h3"/><circle cx="14" cy="6" r="2.2"/><path d="M4 12h3"/><path d="M11 12h9"/><circle cx="8" cy="12" r="2.2"/><path d="M4 18h9"/><path d="M17 18h3"/><circle cx="14" cy="18" r="2.2"/>',
    loader: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" opacity="0.9"/>',
    thumbsUp: '<path d="M7 11v9H4v-9zM7 11l3-7a2 2 0 0 1 2 2v4h5.2a2 2 0 0 1 1.95 2.44l-1.4 6A2 2 0 0 1 15.8 20H7"/>',
    thumbsDown: '<path d="M17 13V4h3v9zM17 13l-3 7a2 2 0 0 1-2-2v-4H6.8a2 2 0 0 1-1.95-2.44l1.4-6A2 2 0 0 1 8.2 4H17"/>'
  };
  function icon(name, size, opts){
    opts = opts || {};
    size = size || 18;
    const spin = opts.spin ? ' style="animation:wrSpin .8s linear infinite;"' : '';
    const fill = opts.filled ? 'currentColor' : 'none';
    const stroke = opts.filled ? 'none' : 'currentColor';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${spin}>${ICON_PATHS[name] || ''}</svg>`;
  }


  let state = {
    loaded: false,
    items: [],
    outfits: [],
    aiFeedbackLog: [],
    screen: 'home',
    wardrobe: { activeCat: 'All', filterOpen: false, color: null, season: null, favOnly: false, matchingId: null },
    modalOpen: false,
    confirmDelete: null,
    draft: { name:"", category:"T-Shirts", image:null, color: SWATCHES[0], colorName:"", season: "All Seasons", cropping:false, rawImage:null, rect:null, tagging:false, cutoutLoading:false, aiTagged:false, tagFeedback:{rating:null,note:"",submitted:false}, editingId:null },
    builder: {
      mode: null, // 'topbottom' | 'dress'
      step: 0,
      useJacket: false, useAccessories: false,
      idx: { top:0, bottom:0, dress:0, shoes:0, jacket:0, accessories:0 },
      previewing: false, outfitName: "",
      occasionText: "", suggesting: false,
      aiPieces: null, aiNote: "", aiTheory: "",
      feedback: "", feedbackLoading: false,
      noteFeedback: {rating:null,note:"",submitted:false},
      styleFeedback: {rating:null,note:"",submitted:false}
    },
    calendarEntries: {},
    calendarView: (() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; })(),
    calendarModal: null, // { dateKey, selectedIds: [] }
    trips: [],
    activeTripId: null,
    tripNameModal: null // { name: "" }
  };

  const root = document.getElementById('wardrobe-root');
  function uid(){ return 'i' + Math.random().toString(36).slice(2,10); }

  // ---------- CLAUDE API HELPER ----------
  // IMPORTANT: This worked with no API key inside Claude's artifact sandbox because
  // Anthropic's infrastructure handled auth behind the scenes. Outside that sandbox,
  // this fetch will fail (no key, likely CORS issues) — and you should NEVER put an
  // Anthropic API key directly in client-side code shipped to users, since anyone
  // could extract it. To make the AI features (auto-tag, outfit suggestions, colour
  // match, style feedback) work in a real deployment, point this fetch at your own
  // small backend/proxy that holds the API key server-side and forwards the request.
  // AI services are intentionally disabled in the standalone/free version.
  // All "smart" wardrobe features below use local browser logic instead.
  async function callClaude(){
    throw new Error("AI services are disabled in this offline version.");
  }
  function parseAIJSON(text){
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if(start === -1 || end === -1) throw new Error("No JSON found");
    return JSON.parse(cleaned.slice(start, end+1));
  }
  function renderFeedbackWidget(prefix, fb){
    if(fb.submitted){
      return `<div class="wr-fbdone">Thanks for the feedback${fb.rating==='up'?' 🙌':fb.rating==='down'?' — noted 🙏':''}</div>`;
    }
    return `<div class="wr-fbwidget">
      <div class="wr-fbrow">
        <span class="wr-fbhint">Was this helpful?</span>
        <button class="wr-fbthumb ${fb.rating==='up'?'active':''}" data-fbup="${prefix}">${icon('thumbsUp',15)}</button>
        <button class="wr-fbthumb ${fb.rating==='down'?'active':''}" data-fbdown="${prefix}">${icon('thumbsDown',15)}</button>
      </div>
      ${fb.rating ? `<input class="wr-input wr-fbnote" data-fbnoteinput="${prefix}" placeholder="Anything to add? (optional)" value="${escapeHTML(fb.note)}">
      <button class="wr-fbsubmit" data-fbsubmit="${prefix}">Send feedback</button>` : ''}
    </div>`;
  }

  function nearestSwatch(hex){
    if(!hex) return SWATCHES[0];
    const h = hex.toUpperCase();
    if(SWATCHES.includes(h)) return h;
    const toRgb = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
    let best = SWATCHES[0], bestDist = Infinity;
    try {
      const target = toRgb(h);
      SWATCHES.forEach(s => {
        const rgb = toRgb(s);
        const dist = Math.pow(rgb[0]-target[0],2) + Math.pow(rgb[1]-target[1],2) + Math.pow(rgb[2]-target[2],2);
        if(dist < bestDist){ bestDist = dist; best = s; }
      });
    } catch(e){ /* fall through to default */ }
    return best;
  }

  // Crops to an AI-given bounding box, then paints anything close to the corner
  // (background) colour white, so the garment sits on a clean white background.
  function cutoutOnWhite(dataUrl, bbox){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const nw = img.naturalWidth, nh = img.naturalHeight;
          const pad = 0.04;
          let left = Math.max(0, bbox.left - pad), top = Math.max(0, bbox.top - pad);
          let right = Math.min(1, bbox.right + pad), bottom = Math.min(1, bbox.bottom + pad);
          if(right <= left){ left = 0; right = 1; }
          if(bottom <= top){ top = 0; bottom = 1; }

          const sx = Math.round(left * nw), sy = Math.round(top * nh);
          const sw = Math.max(1, Math.round((right - left) * nw));
          const sh = Math.max(1, Math.round((bottom - top) * nh));

          const work = document.createElement('canvas');
          work.width = sw; work.height = sh;
          const wctx = work.getContext('2d');
          wctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          const imageData = wctx.getImageData(0, 0, sw, sh);
          const data = imageData.data;

          // Estimate the background colour from the four corners of the crop
          const patch = Math.max(2, Math.round(Math.min(sw, sh) * 0.05));
          const corners = [[0,0],[sw-patch,0],[0,sh-patch],[sw-patch,sh-patch]];
          let rSum=0, gSum=0, bSum=0, count=0;
          corners.forEach(([cx,cy]) => {
            for(let y=Math.max(0,cy); y<Math.min(sh,cy+patch); y++){
              for(let x=Math.max(0,cx); x<Math.min(sw,cx+patch); x++){
                const idx = (y*sw+x)*4;
                rSum += data[idx]; gSum += data[idx+1]; bSum += data[idx+2]; count++;
              }
            }
          });
          const bgR = count ? rSum/count : 255, bgG = count ? gSum/count : 255, bgB = count ? bSum/count : 255;

          const T1 = 26, T2 = 55; // pixels within T1 of bg become white; T1–T2 blend; beyond T2 untouched
          for(let i=0; i<data.length; i+=4){
            const dr = data[i]-bgR, dg = data[i+1]-bgG, db = data[i+2]-bgB;
            const dist = Math.sqrt(dr*dr+dg*dg+db*db);
            if(dist <= T1){
              data[i]=255; data[i+1]=255; data[i+2]=255;
            } else if(dist < T2){
              const t = (dist - T1) / (T2 - T1);
              data[i]   = Math.round(255*(1-t) + data[i]*t);
              data[i+1] = Math.round(255*(1-t) + data[i+1]*t);
              data[i+2] = Math.round(255*(1-t) + data[i+2]*t);
            }
          }
          wctx.putImageData(imageData, 0, 0);

          const maxW = 500;
          const scale = Math.min(1, maxW / sw);
          const outW = Math.max(1, Math.round(sw*scale)), outH = Math.max(1, Math.round(sh*scale));
          const outCanvas = document.createElement('canvas');
          outCanvas.width = outW; outCanvas.height = outH;
          const octx = outCanvas.getContext('2d');
          octx.fillStyle = '#FFFFFF';
          octx.fillRect(0, 0, outW, outH);
          octx.drawImage(work, 0, 0, outW, outH);
          resolve(outCanvas.toDataURL('image/jpeg', 0.85));
        } catch(err){ reject(err); }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // ---------- LOCAL / NO-AI SMART FEATURES ----------
  function hexRgb(hex){
    const h = String(hex || '').replace('#','');
    if(!/^[0-9a-fA-F]{6}$/.test(h)) return [128,128,128];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function rgbHex(r,g,b){
    return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0').toUpperCase()).join('');
  }
  function colorDistance(a,b){
    const A=hexRgb(a), B=hexRgb(b);
    return Math.sqrt((A[0]-B[0])**2+(A[1]-B[1])**2+(A[2]-B[2])**2);
  }
  function colorNameFromHex(hex){
    const [r,g,b]=hexRgb(hex);
    const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
    if(max < 45) return 'Black';
    if(min > 225) return 'White';
    if(d < 18){
      if(max < 90) return 'Charcoal';
      if(max < 170) return 'Gray';
      return 'Off-white';
    }
    let h=0;
    if(d){
      if(max===r) h=((g-b)/d)%6;
      else if(max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h=Math.round(h*60); if(h<0) h+=360;
    }
    const l=(max+min)/2;
    if(l<70) return h<25||h>=345?'Deep red':h<55?'Brown':h<85?'Olive':h<170?'Dark green':h<260?'Navy':'Plum';
    if(h<15||h>=345) return l>190?'Blush':'Red';
    if(h<45) return l>180?'Peach':'Orange';
    if(h<70) return l>180?'Mustard':'Gold';
    if(h<165) return l>185?'Sage green':'Green';
    if(h<205) return l>185?'Sky blue':'Teal';
    if(h<260) return l>180?'Periwinkle':'Blue';
    if(h<310) return l>180?'Lavender':'Purple';
    return l>180?'Rose':'Pink';
  }
  function dominantImageColor(dataUrl){
    return new Promise((resolve)=>{
      const img=new Image();
      img.onload=()=>{
        try{
          const c=document.createElement('canvas'), max=60;
          const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          c.width=Math.max(1,Math.round(img.naturalWidth*scale));
          c.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=c.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(img,0,0,c.width,c.height);
          const d=ctx.getImageData(0,0,c.width,c.height).data;
          let r=0,g=0,b=0,n=0;
          for(let i=0;i<d.length;i+=16){
            const R=d[i],G=d[i+1],B=d[i+2];
            const mx=Math.max(R,G,B), mn=Math.min(R,G,B);
            // Ignore near-white/near-black pixels that are likely background.
            if(mx>245 && mn>235) continue;
            if(mx<20 && mn<20) continue;
            r+=R;g+=G;b+=B;n++;
          }
          resolve(n ? rgbHex(r/n,g/n,b/n) : SWATCHES[0]);
        }catch(e){ resolve(SWATCHES[0]); }
      };
      img.onerror=()=>resolve(SWATCHES[0]);
      img.src=dataUrl;
    });
  }

  async function runAICutout(){
    // Kept as a compatibility stub so older event bindings never make a network request.
    toast("Background cleanup needs AI; use Trim & continue instead");
  }

  async function runAutoTag(){
    const d=state.draft;
    if(!d.image || d.tagging) return;
    d.tagging=true; render();
    try{
      const inferred=await dominantImageColor(d.image);
      const filename=(d.name||'').toLowerCase();
      const categoryHints=[
        ['dress','Dresses'],['jean','Jeans'],['trouser','Trousers'],['pant','Trousers'],
        ['short','Shorts'],['skirt','Skirts'],['hood','Hoodies'],['jacket','Jackets'],
        ['shoe','Shoes'],['sneaker','Shoes'],['bag','Bags'],['shirt','Shirts'],
        ['tee','T-Shirts'],['top','Tops']
      ];
      const hint=categoryHints.find(([word])=>filename.includes(word));
      if(hint) d.category=hint[1];
      d.color=inferred;
      d.colorName=colorNameFromHex(inferred);
      if(!d.name) d.name=`${d.colorName} ${d.category.replace(/s$/,'')}`;
      d.aiTagged=true;
      d.tagFeedback={rating:null,note:"",submitted:false};
      toast("Suggested colour and tags locally");
    }catch(e){
      toast("Couldn't analyse the photo locally");
    }finally{
      d.tagging=false; render();
    }
  }

  function occasionScore(item, occasion){
    const o=(occasion||'').toLowerCase();
    let s=0;
    const n=(item.name||'').toLowerCase();
    const c=item.category;
    if(/work|office|interview|professional/.test(o) && /shirt|trouser|jacket|dress/.test(c.toLowerCase())) s+=10;
    if(/gym|sport|workout|active/.test(o) && /short|t-shirt|hoodie|shoe/.test(c.toLowerCase())) s+=8;
    if(/formal|wedding|party|date/.test(o) && /dress|shirt|jacket|shoe/.test(c.toLowerCase())) s+=8;
    if(/beach|summer|hot/.test(o) && /short|dress|t-shirt|skirt/.test(c.toLowerCase())) s+=7;
    if(/rain|cold|winter/.test(o) && /jacket|hoodie|jean|trouser/.test(c.toLowerCase())) s+=7;
    if(/black|white|blue|green|red|pink|brown/.test(o) && n.includes(o.match(/black|white|blue|green|red|pink|brown/)[0])) s+=3;
    return s;
  }
  function harmonyScore(a,b){
    if(!a||!b) return 0;
    const [ar,ag,ab]=hexRgb(a), [br,bg,bb]=hexRgb(b);
    const dist=colorDistance(a,b);
    const neutral=(x)=>{ const [r,g,bl]=hexRgb(x); return Math.max(r,g,bl)-Math.min(r,g,bl)<28 || (r+g+bl>620); };
    if(neutral(a)||neutral(b)) return 34;
    const avg=(ar+ag+ab+br+bg+bb)/6;
    return Math.max(0, 34 - Math.min(34, dist/8) + (avg>150?3:0));
  }

  async function runAISuggest(){
    const b=state.builder;
    if(b.suggesting) return;
    if(state.items.length===0){ toast("Add some pieces to your closet first"); return; }
    b.suggesting=true; render();
    try{
      const occasion=b.occasionText.trim();
      const tops=itemsByCats(TOP_GROUP), bottoms=itemsByCats(BOTTOM_GROUP), dresses=itemsByCats(DRESS_GROUP);
      const shoes=itemsByCats(SHOES_GROUP), jackets=itemsByCats(JACKET_GROUP), accessories=itemsByCats(ACCESSORY_GROUP);
      let best=null;
      if(dresses.length){
        dresses.forEach(d=>{
          const shoe=shoes.length ? shoes.slice().sort((x,y)=>harmonyScore(d.color,y.color)-harmonyScore(d.color,x.color))[0] : null;
          const score=occasionScore(d,occasion)+(shoe?harmonyScore(d.color,shoe.color):0);
          if(!best||score>best.score) best={score,pieces:{dress:d,shoes:shoe}};
        });
      }
      tops.forEach(t=>bottoms.forEach(bt=>{
        const shoe=shoes.length ? shoes.slice().sort((x,y)=>
          (harmonyScore(t.color,y.color)+harmonyScore(bt.color,y.color))-
          (harmonyScore(t.color,x.color)+harmonyScore(bt.color,x.color)))[0] : null;
        const score=occasionScore(t,occasion)+occasionScore(bt,occasion)+harmonyScore(t.color,bt.color)+(shoe?(harmonyScore(t.color,shoe.color)+harmonyScore(bt.color,shoe.color))/2:0);
        if(!best||score>best.score) best={score,pieces:{top:t,bottom:bt,shoes:shoe}};
      }));
      if(!best){ toast("Add a top/bottom or dress first"); return; }
      const base=best.pieces.dress||best.pieces.top;
      if(jackets.length) best.pieces.jacket=jackets.slice().sort((x,y)=>harmonyScore(base.color,y.color)-harmonyScore(base.color,x.color))[0];
      if(accessories.length) best.pieces.accessories=accessories.slice().sort((x,y)=>harmonyScore(base.color,y.color)-harmonyScore(base.color,x.color))[0];
      state.builder.mode=best.pieces.dress?'dress':'topbottom';
      state.builder.useJacket=!!best.pieces.jacket;
      state.builder.useAccessories=!!best.pieces.accessories;
      state.builder.aiPieces=best.pieces;
      state.builder.aiTheory="Local colour match";
      state.builder.aiNote=occasion ? `A local smart pick for ${occasion}.` : "A locally matched combination from your wardrobe.";
      state.builder.noteFeedback={rating:null,note:"",submitted:false};
      state.builder.previewing=true;
    }finally{
      b.suggesting=false; render();
    }
  }

  async function runColourMatch(itemId){
    if(state.wardrobe.matchingId) return;
    const baseItem=state.items.find(i=>i.id===itemId);
    if(!baseItem) return;
    const baseSlot=slotForCategory(baseItem.category);
    if(!baseSlot){ toast("Can't build an outfit around this piece"); return; }
    state.wardrobe.matchingId=itemId; render();
    try{
      const others=state.items.filter(i=>i.id!==itemId);
      const neededOpposite=baseSlot==='top'?'bottom':baseSlot==='bottom'?'top':null;
      const choose=(arr)=>arr.slice().sort((a,b)=>harmonyScore(baseItem.color,b.color)-harmonyScore(baseItem.color,a.color))[0]||null;
      const pieces={}; pieces[baseSlot]=baseItem;
      if(neededOpposite) pieces[neededOpposite]=choose(itemsByCats(neededOpposite==='bottom'?BOTTOM_GROUP:TOP_GROUP).filter(i=>i.id!==itemId));
      pieces.shoes=choose(itemsByCats(SHOES_GROUP).filter(i=>i.id!==itemId));
      pieces.jacket=choose(itemsByCats(JACKET_GROUP).filter(i=>i.id!==itemId));
      pieces.accessories=choose(itemsByCats(ACCESSORY_GROUP).filter(i=>i.id!==itemId));
      Object.keys(pieces).forEach(k=>{ if(!pieces[k]) delete pieces[k]; });
      state.builder.mode=baseSlot==='dress'?'dress':'topbottom';
      state.builder.useJacket=!!pieces.jacket;
      state.builder.useAccessories=!!pieces.accessories;
      state.builder.aiPieces=pieces;
      state.builder.aiTheory="Local colour match";
      state.builder.aiNote=`Colours were matched locally using your wardrobe and the anchor piece.`;
      state.builder.noteFeedback={rating:null,note:"",submitted:false};
      state.builder.previewing=true;
      state.screen='builder';
    }finally{
      state.wardrobe.matchingId=null; render();
    }
  }

  async function runAIFeedback(){
    const b=state.builder;
    if(b.feedbackLoading) return;
    const pieces=currentBuilderPieces();
    if(Object.keys(pieces).length===0){ toast("Add some pieces first"); return; }
    b.feedbackLoading=true; render();
    try{
      const count=Object.keys(pieces).length;
      const colors=Object.values(pieces).map(i=>i.colorName||colorNameFromHex(i.color)).filter(Boolean);
      const unique=[...new Set(colors)];
      if(count>=4) b.feedback="This outfit has a nicely layered feel. The pieces give you a complete look without needing to add much more.";
      else if(count===3) b.feedback="This is a clean, balanced combination. If you want a little more structure, try a jacket or accessory.";
      else b.feedback="The foundation works well. Adding shoes or one simple layer can make the outfit feel more finished.";
      if(unique.length>1) b.feedback += ` The palette brings together ${unique.slice(0,3).join(', ')}.`;
      b.styleFeedback={rating:null,note:"",submitted:false};
    }finally{
      b.feedbackLoading=false; render();
    }
  }

  function slotForCategory(cat){
    if(TOP_GROUP.includes(cat)) return 'top';
    if(BOTTOM_GROUP.includes(cat)) return 'bottom';
    if(DRESS_GROUP.includes(cat)) return 'dress';
    if(SHOES_GROUP.includes(cat)) return 'shoes';
    if(JACKET_GROUP.includes(cat)) return 'jacket';
    if(ACCESSORY_GROUP.includes(cat)) return 'accessories';
    return null;
  }

  async function runColourMatch(itemId){
    if(state.wardrobe.matchingId) return;
    const baseItem = state.items.find(i => i.id === itemId);
    if(!baseItem) return;
    const baseSlot = slotForCategory(baseItem.category);
    if(!baseSlot){ toast("Can't build an outfit around this piece"); return; }

    state.wardrobe.matchingId = itemId; render();
    try {
      const others = state.items.filter(i => i.id !== itemId)
        .map(i => ({ id: i.id, name: i.name, category: i.category, color: i.color, season: i.season }));
      if(others.length === 0){ toast("Add a few more pieces to find matches"); state.wardrobe.matchingId = null; render(); return; }

      const isDressAnchor = baseSlot === 'dress';
      const neededOpposite = baseSlot === 'top' ? 'bottom' : baseSlot === 'bottom' ? 'top' : null;

      const prompt = `You are a stylist applying real colour theory (complementary, analogous, triadic, monochromatic, or neutral-pairing) to build an outfit around one anchor item.

Anchor item: ${JSON.stringify({ name: baseItem.name, category: baseItem.category, color: baseItem.color })}.
Rest of the wardrobe to choose from (id, name, category, color, season): ${JSON.stringify(others)}.

Rules:
- The anchor item's colour (a hex code) is the starting point. Use actual colour theory reasoning about that hex value to decide what other colours pair well with it.
- ${isDressAnchor ? 'The anchor is a dress, so do not pick a top or bottom.' : neededOpposite ? `The anchor is a ${baseSlot}, so pick one ${neededOpposite} (category from ${neededOpposite === 'bottom' ? BOTTOM_GROUP.join('/') : TOP_GROUP.join('/')}) that pairs well by colour.` : ''}
- Optionally also choose shoes (category "Shoes"), a jacket (category "Jackets"), and/or an accessory (category "Bags" or "Accessories") if their colour works with the anchor.
- Only use item ids from the "rest of wardrobe" list above. Leave a slot null if nothing suitable exists.
- Respond with ONLY valid JSON, no markdown, no code fences, in exactly this shape:
{"${neededOpposite || 'extra'}": id or null, "shoes": id or null, "jacket": id or null, "accessories": id or null, "theory": "Complementary" or "Analogous" or "Triadic" or "Monochromatic" or "Neutral", "note": "one short sentence naming the actual colours and why they work together"}`;

      const text = await callClaude([{ type: "text", text: prompt }], 500);
      const result = parseAIJSON(text);
      const findItem = (id) => state.items.find(i => i.id === id) || null;

      const pieces = {};
      pieces[baseSlot] = baseItem;
      if(neededOpposite && result[neededOpposite] && findItem(result[neededOpposite])) pieces[neededOpposite] = findItem(result[neededOpposite]);
      if(result.shoes && findItem(result.shoes)) pieces.shoes = findItem(result.shoes);
      if(result.jacket && findItem(result.jacket)) pieces.jacket = findItem(result.jacket);
      if(result.accessories && findItem(result.accessories)) pieces.accessories = findItem(result.accessories);

      state.builder.mode = pieces.dress ? 'dress' : 'topbottom';
      state.builder.useJacket = !!pieces.jacket;
      state.builder.useAccessories = !!pieces.accessories;
      state.builder.aiPieces = pieces;
      state.builder.aiNote = typeof result.note === 'string' ? result.note.slice(0, 220) : "";
      state.builder.aiTheory = typeof result.theory === 'string' ? result.theory.slice(0, 40) : "";
      state.builder.noteFeedback = { rating:null, note:"", submitted:false };
      state.builder.previewing = true;
      state.screen = 'builder';
    } catch(e){
      toast("Couldn't find a colour match right now — try again");
    } finally {
      state.wardrobe.matchingId = null; render();
    }
  }

  async function runAIFeedback(){
    const b = state.builder;
    if(b.feedbackLoading) return;
    const pieces = currentBuilderPieces();
    if(Object.keys(pieces).length === 0){ toast("Add some pieces first"); return; }
    b.feedbackLoading = true; render();
    try {
      const desc = Object.entries(pieces).map(([slot, item]) => `${slot}: ${item.name} (${item.category}${item.season && item.season !== 'All Seasons' ? ', ' + item.season : ''})`).join('; ');
      const prompt = `You are a friendly, encouraging personal stylist. Someone put together this outfit: ${desc}.
Give a short, warm 2-3 sentence style comment: what works well, and one light suggestion if relevant. Keep it conversational, no headers, no lists, no markdown.`;
      const text = await callClaude([{ type: "text", text: prompt }], 300);
      b.feedback = text.trim().slice(0, 500);
      b.styleFeedback = { rating:null, note:"", submitted:false };
    } catch(e){
      toast("Couldn't get feedback right now — try again in a bit");
    } finally {
      b.feedbackLoading = false; render();
    }
  }

  async function loadData(){
    try { const r = await window.storage.get('wardrobe-items-v2'); state.items = r ? JSON.parse(r.value) : []; }
    catch(e){ state.items = []; }
    try { const r = await window.storage.get('wardrobe-outfits-v2'); state.outfits = r ? JSON.parse(r.value) : []; }
    catch(e){ state.outfits = []; }
    try { const r = await window.storage.get('wardrobe-ai-feedback-v2'); state.aiFeedbackLog = r ? JSON.parse(r.value) : []; }
    catch(e){ state.aiFeedbackLog = []; }
    try { const r = await window.storage.get('wardrobe-calendar-v2'); state.calendarEntries = r ? JSON.parse(r.value) : {}; }
    catch(e){ state.calendarEntries = {}; }
    try { const r = await window.storage.get('wardrobe-trips-v2'); state.trips = r ? JSON.parse(r.value) : []; }
    catch(e){ state.trips = []; }
    state.loaded = true;
    render();
  }
  async function saveItems(){ try { await window.storage.set('wardrobe-items-v2', JSON.stringify(state.items)); } catch(e){} }
  async function saveOutfits(){ try { await window.storage.set('wardrobe-outfits-v2', JSON.stringify(state.outfits)); } catch(e){} }
  async function saveFeedbackLog(){ try { await window.storage.set('wardrobe-ai-feedback-v2', JSON.stringify(state.aiFeedbackLog)); } catch(e){} }
  async function saveCalendar(){ try { await window.storage.set('wardrobe-calendar-v2', JSON.stringify(state.calendarEntries)); } catch(e){} }
  async function saveTrips(){ try { await window.storage.set('wardrobe-trips-v2', JSON.stringify(state.trips)); } catch(e){} }

  function openEditModal(id){
    const item = state.items.find(i => i.id === id);
    if(!item) return;
    state.draft = {
      name: item.name, category: item.category, image: item.image || null,
      color: item.color, colorName: item.colorName || "", season: item.season || "All Seasons",
      cropping: false, rawImage: null, rect: null, tagging: false, cutoutLoading: false,
      aiTagged: !!item.colorName, tagFeedback: { rating:null, note:"", submitted:false },
      editingId: item.id
    };
    state.modalOpen = true;
    render();
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'wr-toast'; t.textContent = msg;
    root.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, 1500);
  }

  function compressImage(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const maxW = 500;
          const scale = Math.min(1, maxW / img.width);
          const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject; img.src = e.target.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  function readAsDataURL(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Takes a raw (uncropped) data URL and an optional cropSpec { scaleX, scaleY, rect:{x,y,w,h} }
  // describing a selection made on the *displayed* image, and returns a compressed, optionally
  // cropped data URL sized for storage.
  function compressDataURL(dataUrl, cropSpec){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if(cropSpec){
          sx = Math.round(cropSpec.rect.x * cropSpec.scaleX);
          sy = Math.round(cropSpec.rect.y * cropSpec.scaleY);
          sw = Math.round(cropSpec.rect.w * cropSpec.scaleX);
          sh = Math.round(cropSpec.rect.h * cropSpec.scaleY);
        }
        const maxW = 500;
        const scale = Math.min(1, maxW / sw);
        const outW = Math.max(1, Math.round(sw * scale));
        const outH = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = outW; canvas.height = outH;
        canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function greetingWord(){
    const h = new Date().getHours();
    if(h < 12) return "Good morning";
    if(h < 17) return "Good afternoon";
    return "Good evening";
  }

  function filteredWardrobeItems(){
    const w = state.wardrobe;
    return state.items.filter(i => {
      if(w.activeCat !== 'All' && i.category !== w.activeCat) return false;
      if(w.color && nearestSwatch(i.color) !== w.color) return false;
      if(w.season && i.season !== w.season && i.season !== 'All Seasons') return false;
      if(w.favOnly && !i.favorite) return false;
      return true;
    });
  }
  function itemsByCats(cats){ return state.items.filter(i => cats.includes(i.category)); }

  function attachSwipe(el, onLeft, onRight){
    let sx=0, sy=0, dragging=false;
    el.addEventListener('pointerdown', e => { sx=e.clientX; sy=e.clientY; dragging=true; });
    el.addEventListener('pointerup', e => {
      if(!dragging) return; dragging=false;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){ if(dx<0) onRight(); else onLeft(); }
    });
  }

  function cardHTML(item, big){
    if(!item) return '';
    const tint = CAT_TINTS[item.category] || '#C2AF8E';
    if(item.image) return `<img src="${item.image}" alt="${escapeHTML(item.name)}">`;
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${item.color||tint};font-family:'Unbounded',sans-serif;font-size:${big?32:24}px;color:rgba(255,255,255,0.9);">${(item.name||'?').charAt(0).toUpperCase()}</div>`;
  }

  function escapeHTML(s){
    return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- RENDER ----------
  function render(){
    if(!state.loaded){
      root.innerHTML = `<div class="wr-shell"><div style="text-align:center;padding:90px 0;color:#6E6B78;font-size:13px;">Opening your closet…</div></div>`;
      return;
    }
    let inner = '';
    if(state.screen === 'home') inner = renderHome();
    else if(state.screen === 'wardrobe') inner = renderWardrobeScreen();
    else if(state.screen === 'builder') inner = renderBuilderScreen();
    else if(state.screen === 'saved') inner = renderSavedScreen();
    else if(state.screen === 'calendar') inner = renderCalendarScreen();
    else if(state.screen === 'packing') inner = renderPackingScreen();

    root.innerHTML = `<div class="wr-shell wr-fade">${inner}</div>${renderNav()}${state.modalOpen ? renderModal() : ''}${state.confirmDelete ? renderConfirmModal() : ''}${state.calendarModal ? renderCalendarDayModal() : ''}${state.tripNameModal ? renderTripNameModal() : ''}`;
    bindEvents();
  }

  function renderNav(){
    const items = [
      {id:'home', icon:'home', label:'Home'},
      {id:'wardrobe', icon:'hanger', label:'Wardrobe'},
      {id:'builder', icon:'shuffle', label:'Build'},
      {id:'saved', icon:'heart', label:'Saved'}
    ];
    return `<div class="wr-navbar"><div class="wr-navinner">
      ${items.map(i => `<div class="wr-navitem ${state.screen===i.id?'active':''}" data-nav="${i.id}">
        <span class="wr-navicon">${icon(i.icon, 20)}</span>${i.label}
      </div>`).join('')}
    </div></div>`;
  }

  function renderHome(){
    const favCount = state.outfits.filter(o=>o.favorite).length;
    return `
      <div class="wr-greeting-wrap">
        <div class="wr-hi">${greetingWord()}</div>
        <h1 class="wr-greet-title">What are we wearing today?</h1>
        <div class="wr-greet-sub">Let's find something you'll love.</div>
      </div>

      <div class="wr-homecard" data-nav="builder">
        <div class="wr-homecard-icon" style="background:var(--cinnamon-soft);color:var(--cinnamon);">${icon("shuffle",24)}</div>
        <div>
          <div class="wr-homecard-title">Build an Outfit</div>
          <div class="wr-homecard-sub">Swipe through tops, bottoms &amp; more</div>
        </div>
      </div>
      <div class="wr-homecard" data-nav="wardrobe">
        <div class="wr-homecard-icon" style="background:#E6E1FF;color:var(--sage);">${icon("hanger",24)}</div>
        <div>
          <div class="wr-homecard-title">My Wardrobe</div>
          <div class="wr-homecard-sub">Browse and add clothing</div>
        </div>
      </div>
      <div class="wr-homecard" data-nav="saved">
        <div class="wr-homecard-icon" style="background:#F1F9C7;color:#7A9A00;">${icon("heart",24,{filled:true})}</div>
        <div>
          <div class="wr-homecard-title">Saved Outfits</div>
          <div class="wr-homecard-sub">Your go-to combinations</div>
        </div>
      </div>
      <div class="wr-homecard" data-nav="calendar">
        <div class="wr-homecard-icon" style="background:#DCEBFF;color:#2563EB;">${icon("calendar",24)}</div>
        <div>
          <div class="wr-homecard-title">Outfit Calendar</div>
          <div class="wr-homecard-sub">See what you wore, day by day</div>
        </div>
      </div>
      <div class="wr-homecard" data-nav="packing">
        <div class="wr-homecard-icon" style="background:#FFE8CC;color:#C2650A;">${icon("luggage",24)}</div>
        <div>
          <div class="wr-homecard-title">Packing List</div>
          <div class="wr-homecard-sub">Build a list for your next trip</div>
        </div>
      </div>

      <div class="wr-homestats">
        <div class="wr-stat"><div class="wr-stat-num">${state.items.length}</div><div class="wr-stat-label">PIECES</div></div>
        <div class="wr-stat"><div class="wr-stat-num">${state.outfits.length}</div><div class="wr-stat-label">OUTFITS</div></div>
        <div class="wr-stat"><div class="wr-stat-num">${favCount}</div><div class="wr-stat-label">FAVOURITES</div></div>
      </div>
    `;
  }

  function renderWardrobeScreen(){
    const w = state.wardrobe;
    const cats = ["All", ...CATS];
    let h = `<div class="wr-topbar"><div class="wr-topbar-title">My Wardrobe</div></div>`;

    h += `<div class="wr-searchrow">
      <div class="wr-pills" style="flex:1;margin-bottom:0;">
        ${cats.map(c => `<div class="wr-pill ${w.activeCat===c?'active':''}" data-pill="${c}">${c}</div>`).join('')}
      </div>
      <div class="wr-filterbtn ${w.filterOpen?'active':''}" id="wr-filter-toggle">${icon('sliders',16)}</div>
    </div>`;

    if(w.filterOpen){
      h += `<div class="wr-filterpanel">
        <div class="wr-filtergroup-label">Colour</div>
        <div class="wr-swatches">
          <div class="wr-pill ${!w.color?'active':''}" data-color="">Any</div>
          ${SWATCHES.map(s => `<div class="wr-swatch ${w.color===s?'active':''}" style="background:${s}" data-color="${s}"></div>`).join('')}
        </div>
        <div class="wr-filtergroup-label">Season</div>
        <div class="wr-pills" style="margin-bottom:0;">
          <div class="wr-pill ${!w.season?'active':''}" data-season="">Any</div>
          ${SEASONS.map(s => `<div class="wr-pill ${w.season===s?'active':''}" data-season="${s}">${s}</div>`).join('')}
        </div>
        <div class="wr-filtergroup-label">&nbsp;</div>
        <div class="wr-favtoggle ${w.favOnly?'active':''}" id="wr-favonly">${icon('heart',14,{filled:w.favOnly})} Favourites only</div>
      </div>`;
    }

    const filtered = filteredWardrobeItems();
    if(filtered.length === 0){
      h += `<div class="wr-empty">
        <div class="wr-empty-title">Nothing here yet</div>
        ${state.items.length === 0 ? "Add your first piece and start building your closet." : "Try adjusting your filters."}
        ${state.items.length === 0 ? `<div><span class="wr-empty-btn" id="wr-empty-add">${icon('plus',13)} Add a piece</span></div>` : ''}
      </div>`;
    } else {
      h += `<div class="wr-grid">`;
      filtered.forEach(item => {
        const isMatching = state.wardrobe.matchingId === item.id;
        h += `<div class="wr-card" data-open-item="${item.id}">
          <button class="wr-heartbtn" data-fav="${item.id}">${icon('heart',14,{filled:item.favorite})}</button>
          <button class="wr-del" data-del="${item.id}">${icon('x',15)}</button>
          <div class="wr-card-img">${cardHTML(item, false)}</div>
          <div class="wr-card-name">${escapeHTML(item.name)}</div>
          <div class="wr-card-cat">${item.category}${item.colorName ? ' · '+escapeHTML(item.colorName) : ''}${item.season && item.season!=='All Seasons' ? ' · '+item.season : ''}</div>
          <button class="wr-matchbtn" data-colormatch="${item.id}" title="Find local colour matches" ${isMatching?'disabled':''}>${isMatching?icon('loader',14,{spin:true}):icon('palette',14)}</button>
        </div>`;
      });
      h += `</div>`;
    }

    h += `<button class="wr-fab" id="wr-add-btn">${icon('plus',24)}</button>`;
    return h;
  }

  // ---------- BUILDER ----------
  function builderGroupFor(stepKey){
    switch(stepKey){
      case 'top': return TOP_GROUP;
      case 'bottom': return BOTTOM_GROUP;
      case 'dress': return DRESS_GROUP;
      case 'shoes': return SHOES_GROUP;
      case 'jacket': return JACKET_GROUP;
      case 'accessories': return ACCESSORY_GROUP;
    }
  }
  function builderSteps(){
    const b = state.builder;
    let steps = b.mode === 'dress' ? ['dress'] : ['top','bottom'];
    steps.push('shoes');
    if(b.useJacket) steps.push('jacket');
    if(b.useAccessories) steps.push('accessories');
    return steps;
  }
  function stepLabel(key){
    return { top:'Pick a top', bottom:'Pick a bottom', dress:'Pick a dress', shoes:'Pick your shoes', jacket:'Layer a jacket', accessories:'Add an accessory' }[key];
  }

  function renderBuilderScreen(){
    const b = state.builder;

    if(b.mode === null){
      return `
        <div class="wr-topbar"><div class="wr-topbar-title">Build an Outfit</div></div>

        <div class="wr-ai-occasion-row">
          <input class="wr-input" id="wr-occasion-input" placeholder="e.g. casual dinner, rainy commute…" value="${escapeHTML(b.occasionText)}">
        </div>
        <button class="wr-ai-btn" id="wr-smart-suggest" ${b.suggesting?'disabled':''}>
          ${b.suggesting ? icon('loader',14,{spin:true}) + ' Finding a good combination…' : icon('sparkles',14) + ' Let Smart Pick choose'}
        </button>

        <div class="wr-ai-divider">or choose yourself</div>

        <div class="wr-startchoice">
          <div class="wr-choicecard" data-startmode="topbottom">
            <div class="wr-choicecard-emoji">${icon('shirt',28)}</div>
            <div class="wr-choicecard-label">Top + Bottom</div>
          </div>
          <div class="wr-choicecard" data-startmode="dress">
            <div class="wr-choicecard-emoji">${icon('dress',28)}</div>
            <div class="wr-choicecard-label">A Dress</div>
          </div>
        </div>
      `;
    }

    if(b.previewing){
      return renderPreview();
    }

    const steps = builderSteps();
    const key = steps[b.step];
    const group = builderGroupFor(key);
    const list = itemsByCats(group);
    const canSkip = key === 'jacket' || key === 'accessories';

    let h = `<div class="wr-topbar">
      <div class="wr-back" id="wr-builder-back">${icon('chevronLeft',16)}</div>
      <div class="wr-topbar-title">Build an Outfit</div>
    </div>`;

    h += `<div class="wr-progress">
      ${steps.map((s,i) => `<div class="wr-progress-dot ${i<b.step?'done':''} ${i===b.step?'now':''}"></div>`).join('')}
    </div>`;

    h += `<div class="wr-stepwrap">
      <div class="wr-step-label">${stepLabel(key)}</div>
      <div class="wr-step-sub">Swipe or tap the arrows to browse</div>`;

    if(list.length === 0){
      h += `<div class="wr-bigcard"><div class="wr-bigcard-empty">No pieces in this category yet.<br>${canSkip ? 'You can skip this step.' : 'Add some in My Wardrobe.'}</div></div>`;
    } else {
      const i = ((b.idx[key] % list.length) + list.length) % list.length;
      const item = list[i];
      h += `<div class="wr-swiperow">
        <div class="wr-arrow" data-stepprev="${key}:${list.length}">${icon('chevronLeft',17)}</div>
        <div class="wr-bigcard" data-stepswipe="${key}:${list.length}">
          ${cardHTML(item, true)}
          <div class="wr-bigcard-name">${escapeHTML(item.name)}</div>
        </div>
        <div class="wr-arrow" data-stepnext="${key}:${list.length}">${icon('chevronRight',17)}</div>
      </div>
      <div class="wr-dotcount">${i+1} / ${list.length}</div>`;
    }
    h += `</div>`;

    h += `<div class="wr-builder-nav">
      ${b.step > 0 ? `<button class="wr-btn wr-btn-ghost" id="wr-step-back">Back</button>` : `<button class="wr-btn wr-btn-ghost" id="wr-step-restart">Start over</button>`}
      ${canSkip && list.length === 0 ? `<button class="wr-btn wr-btn-ghost" id="wr-step-skip">Skip</button>` : ''}
      <button class="wr-btn wr-btn-primary" id="wr-step-next">${b.step === steps.length-1 ? 'Preview outfit' : 'Next'}</button>
    </div>`;

    if(key === 'shoes' && !b.useJacket && !b.useAccessories){
      h += `<div class="wr-optionalrow">
        <div class="wr-optbtn" data-toggleopt="jacket">${icon('plus',12)} Jacket</div>
        <div class="wr-optbtn" data-toggleopt="accessories">${icon('plus',12)} Accessory</div>
      </div>`;
    }

    return h;
  }

  function currentBuilderPieces(){
    const b = state.builder;
    if(b.aiPieces) return b.aiPieces;
    const pieces = {};
    const consider = (key, group) => {
      const list = itemsByCats(group);
      if(list.length){ pieces[key] = list[((b.idx[key]%list.length)+list.length)%list.length]; }
    };
    if(b.mode === 'dress') consider('dress', DRESS_GROUP);
    else { consider('top', TOP_GROUP); consider('bottom', BOTTOM_GROUP); }
    consider('shoes', SHOES_GROUP);
    if(b.useJacket) consider('jacket', JACKET_GROUP);
    if(b.useAccessories) consider('accessories', ACCESSORY_GROUP);
    return pieces;
  }

  function renderPreview(){
    const b = state.builder;
    const pieces = currentBuilderPieces();
    const order = ['dress','top','bottom','shoes','jacket','accessories'];
    const present = order.filter(k => pieces[k]);
    const solo = present.length <= 1;

    let h = `<div class="wr-topbar">
      <div class="wr-back" id="wr-preview-back">${icon('chevronLeft',16)}</div>
      <div class="wr-topbar-title">Your Outfit</div>
    </div>`;

    if(b.aiNote){
      const label = b.aiTheory ? `${icon('palette',13)} Colour match · ${escapeHTML(b.aiTheory)}` : `${icon('sparkles',13)} Smart pick`;
      h += `<div class="wr-ai-note"><span class="wr-ai-note-label">${label}</span>${escapeHTML(b.aiNote)}</div>`;
      h += renderFeedbackWidget('note', b.noteFeedback);
    }

    h += `<div class="wr-previewgrid ${solo?'solo':''}">
      ${present.map(k => `<div class="wr-previewpiece">${cardHTML(pieces[k], true)}<div class="wr-previewpiece-tag">${escapeHTML(pieces[k].name)}</div></div>`).join('')}
    </div>`;

    h += `<button class="wr-ai-btn" id="wr-smart-feedback" ${b.feedbackLoading?'disabled':''}>
      ${b.feedbackLoading ? icon('loader',14,{spin:true}) + ' Getting a second opinion…' : icon('sparkles',14) + ' Get smart style feedback'}
    </button>`;
    if(b.feedback){
      h += `<div class="wr-ai-note"><span class="wr-ai-note-label">${icon('sparkles',13)} Style feedback</span>${escapeHTML(b.feedback)}</div>`;
      h += renderFeedbackWidget('style', b.styleFeedback);
    }

    h += `<div class="wr-field">
      <label class="wr-label">Name this outfit</label>
      <input class="wr-input" id="wr-outfit-name-input" placeholder="e.g. Sunday brunch" value="${escapeHTML(state.builder.outfitName)}">
    </div>`;

    h += `<div class="wr-builder-nav">
      <button class="wr-btn wr-btn-ghost" id="wr-preview-reshuffle">Keep swiping</button>
      <button class="wr-btn wr-btn-primary" id="wr-preview-save">Save outfit</button>
    </div>`;

    return h;
  }

  function renderSavedScreen(){
    let h = `<div class="wr-topbar"><div class="wr-topbar-title">Saved Outfits</div></div>`;
    if(state.outfits.length === 0){
      h += `<div class="wr-empty">
        <div class="wr-empty-title">No outfits saved yet</div>
        Build one and save it to see it here.
        <div><span class="wr-empty-btn" id="wr-empty-build">${icon('shuffle',13)} Build an outfit</span></div>
      </div>`;
      return h;
    }
    const order = ['dress','top','bottom','shoes','jacket','accessories'];
    state.outfits.forEach((o, idx) => {
      const present = order.filter(k => o.pieces[k]);
      h += `<div class="wr-outfitcard">
        <div class="wr-outfitcard-top">
          <input class="wr-outfitname-input" data-rename="${idx}" value="${escapeHTML(o.name)}">
          <div class="wr-outfit-icons">
            <button class="wr-icon-btn ${o.favorite?'fav-active':''}" data-outfitfav="${idx}">${icon('heart',13,{filled:o.favorite})}</button>
            <button class="wr-icon-btn" data-outfitdel="${idx}">${icon('x',13)}</button>
          </div>
        </div>
        <div class="wr-outfit-pieces">
          ${present.map(k => `<div class="wr-outfit-piece">${cardHTML(o.pieces[k], false)}</div>`).join('')}
        </div>
      </div>`;
    });
    return h;
  }

  // ---------- CALENDAR ----------
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW_LABELS = ["S","M","T","W","T","F","S"];
  function pad2(n){ return String(n).padStart(2,'0'); }
  function dateKey(y,m,d){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
  function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
  function firstWeekday(y,m){ return new Date(y, m, 1).getDay(); }
  function prettyDate(key){
    const [y,m,d] = key.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    const dowNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return `${dowNames[dt.getDay()]}, ${MONTH_NAMES[m-1]} ${d}`;
  }

  function renderCalendarScreen(){
    const { year, month } = state.calendarView;
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const dim = daysInMonth(year, month);
    const fw = firstWeekday(year, month);

    let h = `<div class="wr-topbar"><div class="wr-topbar-title">Outfit Calendar</div></div>`;
    h += `<div class="wr-cal-header">
      <div class="wr-cal-navbtn" data-calnav="prev">${icon('chevronLeft',16)}</div>
      <div class="wr-cal-monthlabel">${MONTH_NAMES[month]} ${year}</div>
      <div class="wr-cal-navbtn" data-calnav="next">${icon('chevronRight',16)}</div>
    </div>`;
    h += `<div class="wr-cal-dowrow">${DOW_LABELS.map(d => `<div class="wr-cal-dow">${d}</div>`).join('')}</div>`;

    h += `<div class="wr-cal-grid">`;
    for(let i=0; i<fw; i++) h += `<div class="wr-cal-day empty"></div>`;
    for(let d=1; d<=dim; d++){
      const key = dateKey(year, month, d);
      const entry = state.calendarEntries[key];
      const hasEntry = entry && entry.itemIds && entry.itemIds.length > 0;
      const dots = hasEntry ? entry.itemIds.slice(0,3).map(id => {
        const it = state.items.find(i => i.id === id);
        return it ? it.color : '#B7B4C0';
      }) : [];
      h += `<div class="wr-cal-day ${key===todayKey?'today':''} ${hasEntry?'logged':''}" data-calday="${key}">
        ${d}
        ${dots.length ? `<div class="wr-cal-dots">${dots.map(c => `<span class="wr-cal-dot" style="background:${c};"></span>`).join('')}</div>` : ''}
      </div>`;
    }
    h += `</div>`;
    h += `<div class="wr-cal-hint">Tap any day to log what you wore</div>`;
    return h;
  }

  function renderCalendarDayModal(){
    const cm = state.calendarModal;
    const selected = cm.selectedIds;
    let h = `<div class="wr-modal-bg" id="wr-modal-bg"><div class="wr-modal" id="wr-modal">
      <div class="wr-modal-title">What did you wear?</div>
      <div class="wr-cal-modal-sub">${prettyDate(cm.dateKey)}</div>`;

    if(state.outfits.length){
      const order = ['dress','top','bottom','shoes','jacket','accessories'];
      h += `<div class="wr-section-label">Quick pick from saved outfits</div>
      <div class="wr-cal-outfitrow">`;
      state.outfits.forEach((o, idx) => {
        const present = order.filter(k => o.pieces[k]).slice(0,2);
        h += `<div class="wr-cal-outfitchip" data-caloutfitpick="${idx}">
          <div class="wr-cal-outfitchip-imgs">
            ${present.map(k => `<div>${cardHTML(o.pieces[k], false)}</div>`).join('')}
          </div>
          <div class="wr-cal-outfitchip-name">${escapeHTML(o.name)}</div>
        </div>`;
      });
      h += `</div>`;
    }

    h += `<div class="wr-section-label">Or select individual pieces</div>`;
    if(state.items.length === 0){
      h += `<div class="wr-empty" style="padding:24px;">Add some pieces to your closet first.</div>`;
    } else {
      h += `<div class="wr-selectgrid">`;
      state.items.forEach(item => {
        const isOn = selected.includes(item.id);
        h += `<div class="wr-selectcard ${isOn?'active':''}" data-calitemtoggle="${item.id}">
          ${item.image ? `<img src="${item.image}">` : `<div class="wr-selectcard-fallback" style="background:${item.color};">${item.name.charAt(0).toUpperCase()}</div>`}
          ${isOn ? `<div class="wr-selectcard-check">✓</div>` : ''}
          <div class="wr-selectcard-label">${escapeHTML(item.name)}</div>
        </div>`;
      });
      h += `</div>`;
    }

    h += `<div class="wr-actions">
      <button class="wr-btn wr-btn-ghost" id="wr-cal-clear">Clear day</button>
      <button class="wr-btn wr-btn-ghost" id="wr-cal-cancel">Cancel</button>
      <button class="wr-btn wr-btn-primary" id="wr-cal-save">Save</button>
    </div></div></div>`;
    return h;
  }

  // ---------- PACKING ----------
  function tripProgress(trip){
    const total = trip.itemIds.length;
    const packed = trip.itemIds.filter(id => trip.packedIds.includes(id)).length;
    return { total, packed };
  }

  function renderPackingScreen(){
    if(!state.activeTripId){
      let h = `<div class="wr-topbar"><div class="wr-topbar-title">Packing Lists</div></div>`;
      if(state.trips.length === 0){
        h += `<div class="wr-empty">
          <div class="wr-empty-title">No trips yet</div>
          Start a packing list for your next trip.
          <div><span class="wr-empty-btn" id="wr-new-trip">${icon('luggage',13)} New trip</span></div>
        </div>`;
        return h;
      }
      state.trips.forEach(trip => {
        const { total, packed } = tripProgress(trip);
        h += `<div class="wr-tripcard" data-tripopen="${trip.id}">
          <div>
            <div class="wr-tripcard-name">${escapeHTML(trip.name)}</div>
            <div class="wr-tripcard-sub">${total} item${total===1?'':'s'} ${total ? `· ${packed}/${total} packed` : ''}</div>
          </div>
          <button class="wr-tripcard-del" data-tripdel="${trip.id}">${icon('x',13)}</button>
        </div>`;
      });
      h += `<button class="wr-fab" id="wr-new-trip" style="position:static;transform:none;width:100%;border-radius:14px;font-size:14px;margin-top:8px;">${icon('plus',16)} New Trip</button>`;
      return h;
    }

    const trip = state.trips.find(t => t.id === state.activeTripId);
    if(!trip){ state.activeTripId = null; return renderPackingScreen(); }
    const { total, packed } = tripProgress(trip);
    const pct = total ? Math.round((packed/total) * 100) : 0;
    const remainingItems = state.items.filter(i => !trip.itemIds.includes(i.id));

    let h = `<div class="wr-topbar">
      <div class="wr-back" id="wr-trip-back">${icon('chevronLeft',16)}</div>
      <div class="wr-topbar-title">${escapeHTML(trip.name)}</div>
    </div>`;

    if(total){
      h += `<div class="wr-progress-bar-wrap"><div class="wr-progress-bar-fill" style="width:${pct}%;"></div></div>
      <div class="wr-progress-text">${packed} of ${total} packed</div>`;
    }

    h += `<div class="wr-section-label">Your packing list</div>`;
    if(trip.itemIds.length === 0){
      h += `<div class="wr-empty" style="padding:24px;">Nothing added yet — pick some pieces below.</div>`;
    } else {
      trip.itemIds.forEach(id => {
        const item = state.items.find(i => i.id === id);
        if(!item) return;
        const isChecked = trip.packedIds.includes(id);
        h += `<div class="wr-packitem">
          <div class="wr-packitem-check ${isChecked?'checked':''}" data-packtoggle="${id}">${isChecked?'✓':''}</div>
          <div class="wr-packitem-thumb">${cardHTML(item, false)}</div>
          <div class="wr-packitem-name ${isChecked?'checked-text':''}">${escapeHTML(item.name)}</div>
          <button class="wr-packitem-remove" data-packremove="${id}">${icon('x',12)}</button>
        </div>`;
      });
    }

    h += `<div class="wr-section-label">Add from your wardrobe</div>`;
    if(remainingItems.length === 0){
      h += `<div class="wr-empty" style="padding:20px;font-size:12.5px;">${state.items.length === 0 ? "Add some pieces to your closet first." : "Everything's already on this list."}</div>`;
    } else {
      h += `<div class="wr-selectgrid">`;
      remainingItems.forEach(item => {
        h += `<div class="wr-selectcard" data-packadd="${item.id}">
          ${item.image ? `<img src="${item.image}">` : `<div class="wr-selectcard-fallback" style="background:${item.color};">${item.name.charAt(0).toUpperCase()}</div>`}
          <div class="wr-selectcard-label">${escapeHTML(item.name)}</div>
        </div>`;
      });
      h += `</div>`;
    }

    return h;
  }

  function renderTripNameModal(){
    return `<div class="wr-modal-bg" id="wr-modal-bg"><div class="wr-modal" id="wr-modal">
      <div class="wr-modal-title">Name your trip</div>
      <div class="wr-field">
        <input class="wr-input" id="wr-tripname-input" placeholder="e.g. Lisbon weekend" value="${escapeHTML(state.tripNameModal.name)}">
      </div>
      <div class="wr-actions">
        <button class="wr-btn wr-btn-ghost" id="wr-tripname-cancel">Cancel</button>
        <button class="wr-btn wr-btn-primary" id="wr-tripname-create">Create</button>
      </div>
    </div></div>`;
  }

  function renderCropModal(){
    const d = state.draft;
    return `<div class="wr-modal-bg" id="wr-modal-bg"><div class="wr-modal" id="wr-modal">
      <div class="wr-modal-title">Trim the photo</div>
      <div class="wr-crop-sub">Drag on the photo to draw a box around just the item</div>
      <div class="wr-cropstage" id="wr-cropstage">
        <img id="wr-crop-img" src="${d.rawImage}">
        <div class="wr-croprect" id="wr-croprect" style="display:none;"></div>
      </div>
      <div class="wr-crop-hint" id="wr-reset-hint" style="display:none;">Drag again to redraw the box</div>
      <div class="wr-crop-actions">
        <button class="wr-btn wr-btn-ghost" id="wr-crop-skip">Use full photo</button>
        <button class="wr-btn wr-btn-primary" id="wr-crop-confirm">Trim &amp; continue</button>
      </div>
      <div class="wr-crop-hint">Works best with a plain background (bed, table, wall)</div>
    </div></div>`;
  }

  function renderConfirmModal(){
    const c = state.confirmDelete;
    let label = "this";
    let sub = "This can't be undone.";
    if(c.type === 'item'){
      const item = state.items.find(i => i.id === c.id);
      if(item) label = `"${escapeHTML(item.name)}"`;
      sub = "It'll be removed from My Wardrobe. This can't be undone.";
    } else if(c.type === 'outfit'){
      const outfit = state.outfits[c.idx];
      if(outfit) label = `"${escapeHTML(outfit.name)}"`;
      sub = "This saved outfit will be deleted. This can't be undone.";
    } else if(c.type === 'trip'){
      const trip = state.trips.find(t => t.id === c.id);
      if(trip) label = `"${escapeHTML(trip.name)}"`;
      sub = "This packing list will be deleted. This can't be undone.";
    }
    return `<div class="wr-modal-bg" id="wr-confirm-bg">
      <div class="wr-confirm-modal">
        <div class="wr-confirm-title">Remove ${label}?</div>
        <div class="wr-confirm-sub">${sub}</div>
        <div class="wr-actions" style="margin-top:0;">
          <button class="wr-btn wr-btn-ghost" id="wr-confirmdel-cancel">Cancel</button>
          <button class="wr-btn wr-btn-danger" id="wr-confirmdel-yes">Remove</button>
        </div>
      </div>
    </div>`;
  }

  function renderModal(){
    const d = state.draft;
    if(d.cropping) return renderCropModal();
    return `<div class="wr-modal-bg" id="wr-modal-bg"><div class="wr-modal" id="wr-modal">
      <div class="wr-modal-title">${d.editingId ? 'Edit piece' : 'Add a piece'}</div>

      <div class="wr-field">
        <label class="wr-label">Photo (optional)</label>
        ${d.image
          ? `<img class="wr-preview" src="${d.image}"/><div class="wr-remove-photo" id="wr-remove-photo">Remove photo</div>`
          : `<div class="wr-upload" id="wr-upload-trigger">Tap to upload a photo<br/>or skip and just tag a colour</div>`
        }
        <input type="file" accept="image/*" id="wr-file-input" style="display:none;">
      </div>

      <div class="wr-field">
        <label class="wr-label">Name</label>
        <input class="wr-input" id="wr-name-input" placeholder="e.g. Linen blazer" value="${escapeHTML(d.name)}">
      </div>

      <div class="wr-field">
        <label class="wr-label">Category</label>
        <div class="wr-catgrid">
          ${CATS.map(c => `<div class="wr-catopt ${d.category===c?'active':''}" data-cat="${c}">${c}</div>`).join('')}
        </div>
      </div>

      <div class="wr-field">
        <label class="wr-label">Colour</label>
        ${d.aiTagged && d.colorName ? `<div class="wr-detected-color">
          <span class="wr-detected-swatch" style="background:${d.color};"></span>
          Detected: ${escapeHTML(d.colorName)} <span class="wr-detected-hex">(${d.color})</span>
        </div>` : ''}
        <div class="wr-swatches">
          ${SWATCHES.map(s => `<div class="wr-swatch ${d.color===s?'active':''}" style="background:${s}" data-swatch="${s}"></div>`).join('')}
        </div>
        <div class="wr-swatch-hint">${d.aiTagged && d.colorName ? "Tap a dot below only if you'd rather override it" : "Tap the closest colour, or auto-tag a photo for an exact match"}</div>
      </div>

      <div class="wr-field">
        <label class="wr-label">Season (optional)</label>
        <div class="wr-pills" style="margin-bottom:0;">
          ${SEASONS.map(s => `<div class="wr-pill ${d.season===s?'active':''}" data-season-draft="${s}">${s}</div>`).join('')}
        </div>
      </div>

      <div class="wr-actions">
        <button class="wr-btn wr-btn-ghost" id="wr-cancel">Cancel</button>
        <button class="wr-btn wr-btn-primary" id="wr-save">${d.editingId ? 'Save changes' : 'Add to closet'}</button>
      </div>
    </div></div>`;
  }

  // ---------- EVENTS ----------
  function getFbState(prefix){
    if(prefix === 'tag') return state.draft.tagFeedback;
    if(prefix === 'note') return state.builder.noteFeedback;
    if(prefix === 'style') return state.builder.styleFeedback;
    return null;
  }
  function fbContext(prefix){
    if(prefix === 'tag') return { feature: 'smart-tag', detail: `${state.draft.name} (${state.draft.category})` };
    if(prefix === 'note') return { feature: state.builder.aiTheory ? 'colour-match' : 'outfit-suggestion', detail: state.builder.aiNote };
    if(prefix === 'style') return { feature: 'smart-style-feedback', detail: state.builder.feedback };
    return { feature: 'unknown', detail: '' };
  }

  function bindEvents(){
    root.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => {
      state.screen = el.dataset.nav;
      if(state.screen === 'builder'){ /* keep builder state as-is so people can resume */ }
      render();
    }));

    // Wardrobe
    root.querySelectorAll('[data-pill]').forEach(el => el.addEventListener('click', () => {
      state.wardrobe.activeCat = el.dataset.pill; render();
    }));
    const filterToggle = document.getElementById('wr-filter-toggle');
    if(filterToggle) filterToggle.addEventListener('click', () => { state.wardrobe.filterOpen = !state.wardrobe.filterOpen; render(); });
    root.querySelectorAll('[data-color]').forEach(el => el.addEventListener('click', () => {
      state.wardrobe.color = el.dataset.color || null; render();
    }));
    root.querySelectorAll('[data-season]').forEach(el => el.addEventListener('click', () => {
      state.wardrobe.season = el.dataset.season || null; render();
    }));
    const favOnly = document.getElementById('wr-favonly');
    if(favOnly) favOnly.addEventListener('click', () => { state.wardrobe.favOnly = !state.wardrobe.favOnly; render(); });

    root.querySelectorAll('[data-fav]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = state.items.find(i => i.id === el.dataset.fav);
      if(item){ item.favorite = !item.favorite; saveItems(); render(); }
    }));
    root.querySelectorAll('[data-del]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      state.confirmDelete = { type: 'item', id: el.dataset.del };
      render();
    }));
    root.querySelectorAll('[data-colormatch]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      runColourMatch(el.dataset.colormatch);
    }));
    root.querySelectorAll('[data-open-item]').forEach(el => el.addEventListener('click', () => {
      openEditModal(el.dataset.openItem);
    }));

    const addBtn = document.getElementById('wr-add-btn');
    const emptyAdd = document.getElementById('wr-empty-add');
    const openModal = () => {
      state.draft = { name:"", category: state.wardrobe.activeCat !== 'All' ? state.wardrobe.activeCat : "T-Shirts", image:null, color: SWATCHES[0], colorName:"", season: "All Seasons", cropping:false, rawImage:null, rect:null, tagging:false, cutoutLoading:false, aiTagged:false, tagFeedback:{rating:null,note:"",submitted:false}, editingId:null };
      state.modalOpen = true; render();
    };
    if(addBtn) addBtn.addEventListener('click', openModal);
    if(emptyAdd) emptyAdd.addEventListener('click', openModal);

    const emptyBuild = document.getElementById('wr-empty-build');
    if(emptyBuild) emptyBuild.addEventListener('click', () => { state.screen = 'builder'; render(); });

    const cancelBtn = document.getElementById('wr-cancel');
    if(cancelBtn) cancelBtn.addEventListener('click', () => { state.modalOpen = false; render(); });
    const bg = document.getElementById('wr-modal-bg');
    if(bg) bg.addEventListener('click', (e) => { if(e.target.id === 'wr-modal-bg'){ state.modalOpen = false; render(); } });

    const nameInput = document.getElementById('wr-name-input');
    if(nameInput){ nameInput.addEventListener('input', () => { state.draft.name = nameInput.value; }); nameInput.focus(); }

    root.querySelectorAll('[data-cat]').forEach(el => el.addEventListener('click', () => {
      const keepName = state.draft.name;
      state.draft.category = el.dataset.cat; render();
      setTimeout(()=>{ const ni=document.getElementById('wr-name-input'); if(ni){ ni.value = keepName; ni.focus(); ni.setSelectionRange(keepName.length,keepName.length);} },0);
    }));
    root.querySelectorAll('[data-swatch]').forEach(el => el.addEventListener('click', () => { state.draft.color = el.dataset.swatch; state.draft.colorName = ""; render(); }));
    root.querySelectorAll('[data-season-draft]').forEach(el => el.addEventListener('click', () => { state.draft.season = el.dataset.seasonDraft; render(); }));

    const uploadTrigger = document.getElementById('wr-upload-trigger');
    const fileInput = document.getElementById('wr-file-input');
    if(uploadTrigger && fileInput){
      uploadTrigger.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0]; if(!file) return;
        try {
          const dataUrl = await readAsDataURL(file);
          state.draft.rawImage = dataUrl;
          state.draft.rect = null;
          state.draft.cropping = true;
          render();
        }
        catch(e){ toast("Couldn't read that photo"); }
      });
    }
    const removePhoto = document.getElementById('wr-remove-photo');
    if(removePhoto) removePhoto.addEventListener('click', () => { state.draft.image = null; render(); });
    // No external AI event handlers in the offline version.

    // Crop screen
    const cropImg = document.getElementById('wr-crop-img');
    const cropStage = document.getElementById('wr-cropstage');
    const cropRectEl = document.getElementById('wr-croprect');
    if(cropImg && cropStage && cropRectEl){
      let dragStart = null;
      const getPos = (e) => {
        const r = cropStage.getBoundingClientRect();
        return { x: Math.min(Math.max(e.clientX - r.left, 0), r.width), y: Math.min(Math.max(e.clientY - r.top, 0), r.height) };
      };
      const drawRect = (x1,y1,x2,y2) => {
        const x = Math.min(x1,x2), y = Math.min(y1,y2), w = Math.abs(x2-x1), h = Math.abs(y2-y1);
        cropRectEl.style.display = 'block';
        cropRectEl.style.left = x+'px'; cropRectEl.style.top = y+'px';
        cropRectEl.style.width = w+'px'; cropRectEl.style.height = h+'px';
        state.draft.rect = { x, y, w, h };
        const hint = document.getElementById('wr-reset-hint');
        if(hint) hint.style.display = (w>10 && h>10) ? 'block' : 'none';
      };
      cropStage.addEventListener('pointerdown', (e) => { dragStart = getPos(e); });
      cropStage.addEventListener('pointermove', (e) => {
        if(!dragStart) return;
        const p = getPos(e);
        drawRect(dragStart.x, dragStart.y, p.x, p.y);
      });
      const endDrag = () => { dragStart = null; };
      cropStage.addEventListener('pointerup', endDrag);
      cropStage.addEventListener('pointerleave', endDrag);
    }
    const cropSkip = document.getElementById('wr-crop-skip');
    if(cropSkip) cropSkip.addEventListener('click', async () => {
      try {
        state.draft.image = await compressDataURL(state.draft.rawImage, null);
        state.draft.cropping = false; state.draft.rawImage = null; state.draft.rect = null;
        render();
      } catch(e){ toast("Couldn't process that photo"); }
    });
    const cropConfirm = document.getElementById('wr-crop-confirm');
    if(cropConfirm) cropConfirm.addEventListener('click', async () => {
      const d = state.draft;
      const img = document.getElementById('wr-crop-img');
      let rect = d.rect;
      if(!rect || rect.w < 10 || rect.h < 10){
        // no meaningful selection drawn — use the whole photo
        rect = null;
      }
      try {
        const cropSpec = rect && img ? {
          scaleX: img.naturalWidth / img.clientWidth,
          scaleY: img.naturalHeight / img.clientHeight,
          rect
        } : null;
        state.draft.image = await compressDataURL(state.draft.rawImage, cropSpec);
        state.draft.cropping = false; state.draft.rawImage = null; state.draft.rect = null;
        render();
      } catch(e){ toast("Couldn't process that photo"); }
    });
    // Background cleanup is manual in the offline version.

    const saveBtn = document.getElementById('wr-save');
    if(saveBtn) saveBtn.addEventListener('click', () => {
      const d = state.draft;
      if(!d.name.trim()){ toast("Give it a name first"); return; }
      if(d.editingId){
        const item = state.items.find(i => i.id === d.editingId);
        if(item){
          item.name = d.name.trim(); item.category = d.category; item.image = d.image;
          item.color = d.color; item.colorName = d.colorName; item.season = d.season;
        }
        toast("Changes saved");
      } else {
        state.items.push({ id: uid(), name: d.name.trim(), category: d.category, image: d.image, color: d.color, colorName: d.colorName, season: d.season, favorite: false });
        toast("Added to your closet");
      }
      state.modalOpen = false; saveItems(); render();
    });

    // Builder
    root.querySelectorAll('[data-startmode]').forEach(el => el.addEventListener('click', () => {
      state.builder = { mode: el.dataset.startmode, step: 0, useJacket:false, useAccessories:false,
        idx:{top:0,bottom:0,dress:0,shoes:0,jacket:0,accessories:0}, previewing:false, outfitName:"",
        occasionText: state.builder.occasionText, suggesting:false, aiPieces:null, aiNote:"", aiTheory:"",
        feedback:"", feedbackLoading:false,
        noteFeedback:{rating:null,note:"",submitted:false}, styleFeedback:{rating:null,note:"",submitted:false} };
      render();
    }));
    const builderBack = document.getElementById('wr-builder-back');
    if(builderBack) builderBack.addEventListener('click', () => { state.builder.mode = null; render(); });

    const occasionInput = document.getElementById('wr-occasion-input');
    if(occasionInput){ occasionInput.addEventListener('input', () => { state.builder.occasionText = occasionInput.value; }); }
    const suggestBtn = document.getElementById('wr-smart-suggest');
    if(suggestBtn) suggestBtn.addEventListener('click', () => runAISuggest());

    root.querySelectorAll('[data-stepprev]').forEach(el => el.addEventListener('click', () => {
      const [key] = el.dataset.stepprev.split(':'); state.builder.idx[key]--; render();
    }));
    root.querySelectorAll('[data-stepnext]').forEach(el => el.addEventListener('click', () => {
      const [key] = el.dataset.stepnext.split(':'); state.builder.idx[key]++; render();
    }));
    root.querySelectorAll('[data-stepswipe]').forEach(el => {
      const [key] = el.dataset.stepswipe.split(':');
      attachSwipe(el, () => { state.builder.idx[key]--; render(); }, () => { state.builder.idx[key]++; render(); });
    });

    root.querySelectorAll('[data-toggleopt]').forEach(el => el.addEventListener('click', () => {
      const which = el.dataset.toggleopt;
      if(which === 'jacket') state.builder.useJacket = true; else state.builder.useAccessories = true;
      render();
    }));

    const stepBack = document.getElementById('wr-step-back');
    if(stepBack) stepBack.addEventListener('click', () => { state.builder.step--; render(); });
    const stepRestart = document.getElementById('wr-step-restart');
    if(stepRestart) stepRestart.addEventListener('click', () => { state.builder.mode = null; render(); });
    const stepSkip = document.getElementById('wr-step-skip');
    if(stepSkip) stepSkip.addEventListener('click', () => { advanceStep(); });
    const stepNext = document.getElementById('wr-step-next');
    if(stepNext) stepNext.addEventListener('click', () => { advanceStep(); });

    function advanceStep(){
      const steps = builderSteps();
      if(state.builder.step === steps.length - 1){ state.builder.previewing = true; }
      else { state.builder.step++; }
      render();
    }

    const previewBack = document.getElementById('wr-preview-back');
    if(previewBack) previewBack.addEventListener('click', () => { state.builder.previewing = false; state.builder.aiPieces = null; state.builder.aiNote = ""; state.builder.aiTheory = ""; state.builder.feedback = ""; state.builder.noteFeedback = {rating:null,note:"",submitted:false}; state.builder.styleFeedback = {rating:null,note:"",submitted:false}; render(); });
    const reshuffle = document.getElementById('wr-preview-reshuffle');
    if(reshuffle) reshuffle.addEventListener('click', () => { state.builder.previewing = false; state.builder.aiPieces = null; state.builder.aiNote = ""; state.builder.aiTheory = ""; state.builder.feedback = ""; state.builder.noteFeedback = {rating:null,note:"",submitted:false}; state.builder.styleFeedback = {rating:null,note:"",submitted:false}; render(); });
    const outfitNameInput = document.getElementById('wr-outfit-name-input');
    if(outfitNameInput){ outfitNameInput.addEventListener('input', () => { state.builder.outfitName = outfitNameInput.value; }); }
    const previewSave = document.getElementById('wr-preview-save');
    if(previewSave) previewSave.addEventListener('click', () => {
      const pieces = currentBuilderPieces();
      if(Object.keys(pieces).length === 0){ toast("Add some pieces first"); return; }
      const name = state.builder.outfitName.trim() || "Untitled outfit";
      state.outfits.unshift({ id: uid(), name, favorite:false, pieces });
      saveOutfits();
      state.builder = { mode:null, step:0, useJacket:false, useAccessories:false, idx:{top:0,bottom:0,dress:0,shoes:0,jacket:0,accessories:0}, previewing:false, outfitName:"", occasionText:"", suggesting:false, aiPieces:null, aiNote:"", aiTheory:"", feedback:"", feedbackLoading:false, noteFeedback:{rating:null,note:"",submitted:false}, styleFeedback:{rating:null,note:"",submitted:false} };
      state.screen = 'saved';
      render();
      toast("Outfit saved");
    });

    // Saved
    root.querySelectorAll('[data-rename]').forEach(el => {
      el.addEventListener('input', () => { state.outfits[Number(el.dataset.rename)].name = el.value; });
      el.addEventListener('blur', () => { saveOutfits(); });
    });
    root.querySelectorAll('[data-outfitfav]').forEach(el => el.addEventListener('click', () => {
      const o = state.outfits[Number(el.dataset.outfitfav)]; o.favorite = !o.favorite; saveOutfits(); render();
    }));
    root.querySelectorAll('[data-outfitdel]').forEach(el => el.addEventListener('click', () => {
      state.confirmDelete = { type: 'outfit', idx: Number(el.dataset.outfitdel) };
      render();
    }));

    // Delete confirmation
    const confirmBg = document.getElementById('wr-confirm-bg');
    if(confirmBg) confirmBg.addEventListener('click', (e) => { if(e.target.id === 'wr-confirm-bg'){ state.confirmDelete = null; render(); } });
    const confirmCancel = document.getElementById('wr-confirmdel-cancel');
    if(confirmCancel) confirmCancel.addEventListener('click', () => { state.confirmDelete = null; render(); });
    const confirmYes = document.getElementById('wr-confirmdel-yes');
    if(confirmYes) confirmYes.addEventListener('click', () => {
      const c = state.confirmDelete;
      if(c.type === 'item'){
        state.items = state.items.filter(i => i.id !== c.id);
        saveItems();
        toast("Removed from your closet");
      } else if(c.type === 'outfit'){
        state.outfits.splice(c.idx, 1);
        saveOutfits();
        toast("Outfit removed");
      } else if(c.type === 'trip'){
        state.trips = state.trips.filter(t => t.id !== c.id);
        if(state.activeTripId === c.id) state.activeTripId = null;
        saveTrips();
        toast("Trip removed");
      }
      state.confirmDelete = null;
      render();
    });

    // AI feedback widgets
    root.querySelectorAll('[data-fbup]').forEach(el => el.addEventListener('click', () => {
      const fb = getFbState(el.dataset.fbup); if(!fb) return;
      fb.rating = fb.rating === 'up' ? null : 'up'; render();
    }));
    root.querySelectorAll('[data-fbdown]').forEach(el => el.addEventListener('click', () => {
      const fb = getFbState(el.dataset.fbdown); if(!fb) return;
      fb.rating = fb.rating === 'down' ? null : 'down'; render();
    }));
    root.querySelectorAll('[data-fbnoteinput]').forEach(el => el.addEventListener('input', () => {
      const fb = getFbState(el.dataset.fbnoteinput); if(!fb) return;
      fb.note = el.value;
    }));
    root.querySelectorAll('[data-fbsubmit]').forEach(el => el.addEventListener('click', () => {
      const prefix = el.dataset.fbsubmit;
      const fb = getFbState(prefix); if(!fb) return;
      const ctx = fbContext(prefix);
      state.aiFeedbackLog.push({ id: uid(), time: Date.now(), feature: ctx.feature, rating: fb.rating, note: fb.note, detail: ctx.detail });
      saveFeedbackLog();
      fb.submitted = true;
      render();
      toast("Feedback sent — thank you");
    }));

    // Calendar
    root.querySelectorAll('[data-calnav]').forEach(el => el.addEventListener('click', () => {
      let { year, month } = state.calendarView;
      if(el.dataset.calnav === 'prev'){ month--; if(month < 0){ month = 11; year--; } }
      else { month++; if(month > 11){ month = 0; year++; } }
      state.calendarView = { year, month };
      render();
    }));
    root.querySelectorAll('[data-calday]').forEach(el => el.addEventListener('click', () => {
      const key = el.dataset.calday;
      const entry = state.calendarEntries[key];
      state.calendarModal = { dateKey: key, selectedIds: entry ? [...entry.itemIds] : [] };
      render();
    }));
    root.querySelectorAll('[data-caloutfitpick]').forEach(el => el.addEventListener('click', () => {
      const outfit = state.outfits[Number(el.dataset.caloutfitpick)];
      if(!outfit || !state.calendarModal) return;
      const ids = Object.values(outfit.pieces).filter(Boolean).map(p => p.id);
      state.calendarModal.selectedIds = ids;
      render();
    }));
    root.querySelectorAll('[data-calitemtoggle]').forEach(el => el.addEventListener('click', () => {
      if(!state.calendarModal) return;
      const id = el.dataset.calitemtoggle;
      const sel = state.calendarModal.selectedIds;
      const i = sel.indexOf(id);
      if(i >= 0) sel.splice(i, 1); else sel.push(id);
      render();
    }));
    const calCancel = document.getElementById('wr-cal-cancel');
    if(calCancel) calCancel.addEventListener('click', () => { state.calendarModal = null; render(); });
    const calClear = document.getElementById('wr-cal-clear');
    if(calClear) calClear.addEventListener('click', () => {
      delete state.calendarEntries[state.calendarModal.dateKey];
      saveCalendar();
      state.calendarModal = null;
      render();
      toast("Day cleared");
    });
    const calSave = document.getElementById('wr-cal-save');
    if(calSave) calSave.addEventListener('click', () => {
      const { dateKey: key, selectedIds } = state.calendarModal;
      if(selectedIds.length === 0){ delete state.calendarEntries[key]; }
      else { state.calendarEntries[key] = { itemIds: [...selectedIds] }; }
      saveCalendar();
      state.calendarModal = null;
      render();
      toast("Saved to your calendar");
    });

    // Packing
    const newTripBtn = document.getElementById('wr-new-trip');
    if(newTripBtn) newTripBtn.addEventListener('click', () => { state.tripNameModal = { name: "" }; render(); });
    root.querySelectorAll('[data-tripopen]').forEach(el => el.addEventListener('click', () => {
      state.activeTripId = el.dataset.tripopen; render();
    }));
    root.querySelectorAll('[data-tripdel]').forEach(el => el.addEventListener('click', (e) => {
      e.stopPropagation();
      state.confirmDelete = { type: 'trip', id: el.dataset.tripdel };
      render();
    }));
    const tripBack = document.getElementById('wr-trip-back');
    if(tripBack) tripBack.addEventListener('click', () => { state.activeTripId = null; render(); });
    root.querySelectorAll('[data-packtoggle]').forEach(el => el.addEventListener('click', () => {
      const trip = state.trips.find(t => t.id === state.activeTripId); if(!trip) return;
      const id = el.dataset.packtoggle;
      const i = trip.packedIds.indexOf(id);
      if(i >= 0) trip.packedIds.splice(i, 1); else trip.packedIds.push(id);
      saveTrips(); render();
    }));
    root.querySelectorAll('[data-packremove]').forEach(el => el.addEventListener('click', () => {
      const trip = state.trips.find(t => t.id === state.activeTripId); if(!trip) return;
      const id = el.dataset.packremove;
      trip.itemIds = trip.itemIds.filter(x => x !== id);
      trip.packedIds = trip.packedIds.filter(x => x !== id);
      saveTrips(); render();
    }));
    root.querySelectorAll('[data-packadd]').forEach(el => el.addEventListener('click', () => {
      const trip = state.trips.find(t => t.id === state.activeTripId); if(!trip) return;
      const id = el.dataset.packadd;
      if(!trip.itemIds.includes(id)) trip.itemIds.push(id);
      saveTrips(); render();
    }));

    const tripNameInput = document.getElementById('wr-tripname-input');
    if(tripNameInput){ tripNameInput.addEventListener('input', () => { state.tripNameModal.name = tripNameInput.value; }); tripNameInput.focus(); }
    const tripNameCancel = document.getElementById('wr-tripname-cancel');
    if(tripNameCancel) tripNameCancel.addEventListener('click', () => { state.tripNameModal = null; render(); });
    const tripNameCreate = document.getElementById('wr-tripname-create');
    if(tripNameCreate) tripNameCreate.addEventListener('click', () => {
      const name = state.tripNameModal.name.trim();
      if(!name){ toast("Give the trip a name first"); return; }
      const trip = { id: uid(), name, itemIds: [], packedIds: [] };
      state.trips.push(trip);
      saveTrips();
      state.tripNameModal = null;
      state.activeTripId = trip.id;
      render();
    });
  }

  loadData();
})();
