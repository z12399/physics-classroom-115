'use strict';
/* 八年級理化互動實驗室：每個單元 = 狀態 + 控制項 + render(state)。 */

/* ---------- 共用工具 ---------- */
const P={ink:'#1b2a33',muted:'#6b777e',faint:'#cfc9ba',accent:'#0f766e',orange:'#df7c44',blue:'#4c85bb',red:'#c8553d'};
const D={ink:'#eaf3ff',muted:'#a6b5cd',object:'#ffcc6a',image:'#bb9bff',ray:'#61ddeb',second:'#ff92bc',third:'#9be38b'};
const rnd=i=>{const x=Math.sin(i*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const num=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function T(x,y,s,o={}){const{size=18,fill=P.ink,anchor='start',weight=400,halo=false}=o;return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${halo?' paint-order="stroke" stroke="#0f1b2d" stroke-width="5" stroke-linejoin="round"':''}>${s}</text>`;}
function L(x1,y1,x2,y2,o={}){const{stroke=P.ink,w=2,dash=false,arrow=false,op=1}=o;return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${dash?` stroke-dasharray="${dash===true?'8 7':dash}"`:''}${arrow?' marker-end="url(#arr)"':''} opacity="${op}"/>`;}
function vArrow(x,y0,y1,c,o={}){const{w=5,dash=false}=o;const dir=y1<=y0?1:-1;return L(x,y0,x,y1,{stroke:c,w,dash})+`<path d="M${x-9} ${y1+dir*14}L${x} ${y1}L${x+9} ${y1+dir*14}" fill="none" stroke="${c}" stroke-width="${w-1}" stroke-linecap="round" stroke-linejoin="round"/>`;}
/* 可拖曳的把手：虛線圓圈 */
const handle=(name,x,y,c,r=13)=>`<g class="handle" data-drag="${name}"><circle cx="${x}" cy="${y}" r="${r+12}" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="2" stroke-dasharray="4 3"/></g>`;
const DEFS=`<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><clipPath id="stage-clip"><rect x="8" y="8" width="884" height="484" rx="10"/></clipPath></defs>`;

/* ---------- 單元資料 ---------- */
const SPECIES={
  O2:{label:'O₂ 氧氣',atoms:['O','O']},N2:{label:'N₂ 氮氣',atoms:['N','N']},H2:{label:'H₂ 氫氣',atoms:['H','H']},
  He:{label:'He 氦氣',atoms:['He']},H2O:{label:'H₂O 水',atoms:['O','H','H']},CO2:{label:'CO₂ 二氧化碳',atoms:['C','O','O']}};
const ATOM={H:{r:10,c:'#7fa6d6'},O:{r:15,c:'#df7c44'},N:{r:15,c:'#0f9488'},C:{r:14,c:'#4a5860'},He:{r:12,c:'#a37acc'}};
const SLOTS=(()=>{const out=[];for(let r=0;r<4;r++)for(let c=0;c<6;c++){const i=r*6+c;out.push([185+c*106+((i*37)%23-11),128+r*84+((i*53)%21-10)]);}const order=[7,16,2,21,11,4,19,13,0,9,22,5,14,1,18,10,23,6,15,3,20,8,12,17];return order.map(i=>out[i]);})();
const SOLUBILITY={KNO3:{name:'硝酸鉀',data:[13.3,31.6,63.9,110,169,246]},NaCl:{name:'食鹽',data:[35.7,36.0,36.6,37.3,38.4,39.8]}};
const solubility=(sub,t)=>{const d=SOLUBILITY[sub].data,i=clamp(Math.floor(t/20),0,4),k=(t-i*20)/20;return d[i]+(d[i+1]-d[i])*k;};
const LIQUIDS=[[0.79,'酒精','#dfe9ee'],[0.92,'沙拉油','#f1d98a'],[1,'水','#bcd9e6'],[1.2,'濃鹽水','#97c1d6']];
const liquid=v=>LIQUIDS.find(l=>l[0]===v);
const MEDIA={air:['空氣',1.00,'#14263d'],water:['水',4/3,'#1b4560'],glass:['玻璃',1.50,'#24516b'],diamond:['鑽石',2.42,'#36497a']};
const TIMBRE={pure:['音叉',[1]],flute:['笛子',[1,.35,.12]],violin:['小提琴',[1,.55,.4,.28,.2,.12]]};
const SOUND_SPEED={air:'空氣',water:'水',steel:'鋼鐵'};
const REFLECT={apple:['紅蘋果',[1,0,0]],leaf:['綠葉',[0,1,0]],banana:['黃香蕉',[1,1,0]],paper:['白紙',[1,1,1]],cloth:['黑布',[0,0,0]]};
const LIGHTS=[['白光',[1,1,1]],['紅光',[1,0,0]],['綠光',[0,1,0]],['藍光',[0,0,1]],['黃光',[1,1,0]],['青光',[0,1,1]],['洋紅光',[1,0,1]]];
const FILTERS={r:['紅',[1,0,0],'只讓紅光透過'],g:['綠',[0,1,0],'只讓綠光透過'],b:['藍',[0,0,1],'只讓藍光透過'],y:['黃',[1,1,0],'讓紅光和綠光透過（合起來是黃光）'],c:['青',[0,1,1],'讓綠光和藍光透過（合起來是青光）'],m:['洋紅',[1,0,1],'讓紅光和藍光透過（合起來是洋紅光）']};
/* 色名：以最亮的一色為準，達 0.6 倍才算有這一色；kind 是「光」或「色」，太暗時回傳「沒有光」或「黑色」 */
function colorName(r,g,b,kind='光'){const c=[r,g,b],m=Math.max(...c);if(!(m>=40))return kind==='光'?'沒有光':'黑色';const k=c.map(v=>v>=m*.6?1:0).join(''),n={'100':'紅','010':'綠','001':'藍','110':'黃','011':'青','101':'洋紅','111':'白'}[k];
  if(n==='白')return kind==='色'&&m<200?'灰色':'白'+kind;return (m<128?'暗':Math.min(...c)>=m*.3?'淡':'')+n+kind;}
const rgbOf=c=>`rgb(${c.map(v=>Math.round(clamp(v,0,255))).join(',')})`,cmul=(a,f)=>a.map((v,i)=>v*f[i]),lightRGB=s=>[s.r,s.g,s.b].map(v=>s.on&&v?255:0);
/* 折射後的方向（nr：迎著入射光那一側的單位法線；全反射時回傳 null） */
const cRefr=(d,nr,n1,n2)=>{const ci=-(nr[0]*d[0]+nr[1]*d[1]),k=n1/n2,t=1-k*k*(1-ci*ci);if(t<0)return null;const c=k*ci-Math.sqrt(t);return[k*d[0]+c*nr[0],k*d[1]+c*nr[1]];};
/* 4-5 想一想（依實驗切換）與例題 */
const COLOR_Q={
  prism:['白光經過三稜鏡為什麼會分成各種顏色？如果改用紅光照射三稜鏡，還會再分出其他顏色嗎？','白光本來就含有各種色光。各色光在玻璃中的<b>光速不同</b>，折射時偏折的程度也不同，所以被分開（<b>色散</b>）。紅光是單色光，通過三稜鏡只會偏折，<b>不會</b>再分散——顏色不是三稜鏡加上去的。（切到「單色光」，或打開「倒置的三稜鏡」試試看）'],
  rainbow:['早上出太陽時，要往哪個方向看才可能看到彩虹？為什麼？','要<b>背對太陽</b>：陽光進入小水滴後折射、反射、再折射，是往太陽那一側射回來的。早上太陽在東方，所以彩虹出現在<b>西方</b>（傍晚則在東方）。背對太陽用水管噴出水霧，也能做出人造彩虹。'],
  clear:['白光穿過紅色玻璃紙變成紅光，是玻璃紙把光「染」成紅色的嗎？','<b>不是</b>。白光本來就含有各種色光，紅色玻璃紙只讓<b>紅光透過</b>，其他色光都被吸收。所以紅色玻璃紙不能把別的顏色「變成」紅色：如果照射的是藍光，穿過紅色玻璃紙後就幾乎沒有光了。'],
  opaque:['為什麼夏天穿白衣服比穿黑衣服涼快？','白色物體<b>反射所有色光</b>，黑色物體<b>吸收所有色光</b>。被吸收的光會變成熱，所以黑衣服比較熱、白衣服比較涼快。'],
  text:['白紙上用紅筆寫的字，為什麼透過紅色玻璃紙看會「消失」？','白紙反射所有色光、紅字只反射紅光。透過紅色玻璃紙，只有紅光能到眼睛：紙和字<b>都是紅色</b>，分不出來，字就像消失了。（選紅色玻璃紙試試看）'],
  mix:['手機、電視螢幕只有紅、綠、藍三種小光點，為什麼能顯示黃色和白色？','色光可以相加：紅光＋綠光看起來是<b>黃光</b>，紅、綠、藍三種都亮看起來是<b>白光</b>。改變三種光的亮暗，就能組合出各種顏色，所以紅、綠、藍叫做<b>色光三原色</b>。'],
  paint:['（延伸）青色和黃色的顏料混在一起，看起來是什麼顏色？','<b>綠色</b>。青色顏料吸收紅光、黃色顏料吸收藍光，混在一起只剩綠光被反射。顏料越混越暗（減色），和色光越加越亮相反。']};
const COLOR_QUIZ=[
  {q:'白光通過三稜鏡後分成各種色光。偏折程度<b>最大</b>的是哪一種色光？',opts:['紅光','黃光','綠光','紫光'],ans:3,
    sol:'各色光在玻璃中的光速不同，偏折程度也不同：<b>紫光偏折最多</b>、紅光最少，所以紙屏上由上到下是紅、橙、黃、綠、藍、靛、紫。',go:s=>{s.mode='prism';s.beam='full';s.newton=false;s.on=true;},goLabel:'用三稜鏡驗證'},
  {q:'關於雨後看到的彩虹（主虹），下列敘述何者正確？',opts:['要面向太陽才看得到，最外圈是紫色','要背對太陽才看得到，最外圈是紅色','要背對太陽才看得到，最外圈是紫色','要面向太陽才看得到，最外圈是紅色'],ans:1,
    sol:'陽光進入小水滴，經過折射、反射、再折射而色散，光是往太陽那一側射回來的，所以要<b>背對太陽</b>才看得到。進入眼睛的紅光來自較高的水滴、紫光來自較低的水滴 → 主虹<b>外紅內紫</b>。',go:s=>{s.mode='rainbow';s.rv='sky';s.on=true;},goLabel:'看「為什麼外紅內紫」'},
  {q:'在暗室中只用<b>紅光</b>照射一片綠葉，綠葉看起來是什麼顏色？',opts:['綠色','黃色','紅色','黑色'],ans:3,
    sol:'不透明物體的顏色由它<b>反射</b>的色光決定。綠葉只反射綠光，紅光照上去全部被吸收，沒有光反射到眼睛 → <b>黑色</b>。（不是「紅＋綠＝黃」！）',go:s=>{s.mode='opaque';s.ov='obj';s.obj='leaf';[s.r,s.g,s.b]=[1,0,0];s.on=true;}},
  {q:'手電筒的白光先穿過<b>紅色</b>玻璃紙，再穿過<b>綠色</b>玻璃紙，照到白色屏幕上，會看到：',opts:['黃色的光','紅色的光','綠色的光','幾乎沒有光（很暗）'],ans:3,
    sol:'透明物體的顏色由它<b>透過</b>的色光決定。紅色玻璃紙只讓紅光透過；紅光到了綠色玻璃紙又被吸收 → <b>幾乎沒有光</b>。玻璃紙疊在一起是越疊越暗，不是色光相加。',go:s=>{s.mode='clear';s.tv='two';s.f1='r';s.f2='g';[s.r,s.g,s.b]=[1,1,1];s.on=true;}},
  {q:'白紙上寫著<b>紅字</b>，透過<b>綠色</b>玻璃紙看，會看到：',opts:['紙白、字紅','紙綠、字紅','紙綠、字黑','紙綠、字黃'],ans:2,
    sol:'白紙反射所有色光，經過綠色玻璃紙只剩綠光 → 紙是<b>綠色</b>；紅字只反射紅光，紅光過不了綠色玻璃紙 → 字是<b>黑色</b>。',go:s=>{s.mode='opaque';s.ov='text';s.ink='r';s.gv='g';[s.r,s.g,s.b]=[1,1,1];s.on=true;}},
  {q:'紅光和綠光一起照在白牆上，重疊的地方看起來是：',opts:['白光','黃光','青光','洋紅光'],ans:1,
    sol:'色光三原色是紅、綠、藍，色光相加會更亮：紅＋綠＝<b>黃</b>、綠＋藍＝青、紅＋藍＝洋紅，三色一起＝白。',go:s=>{s.mode='mix';[s.r,s.g,s.b]=[1,1,0];s.on=true;}},
  {q:'只用<b>藍光</b>照射一張白紙，白紙看起來是：',opts:['白色','藍色','黑色','黃色'],ans:1,
    sol:'白紙會反射<b>所有</b>色光。照到的只有藍光，反射出來的也只有藍光 → <b>藍色</b>。',go:s=>{s.mode='opaque';s.ov='obj';s.obj='paper';[s.r,s.g,s.b]=[0,0,1];s.on=true;}}];

/* ---------- 光學共用：開關燈與光路前進 ---------- */
const SPECTRUM=[['紅','#ff453a'],['橙','#ff9f0a'],['黃','#ffd60a'],['綠','#32d74b'],['藍','#0a84ff'],['靛','#5e5ce6'],['紫','#bf5af2']];
const replay=s=>{s.prog=0;};
const LAMP={type:'seg',key:'on',label:'燈',options:[[true,'開燈'],[false,'關燈']],onChange:replay};
const BEAM={type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['full','全光']],onChange:replay};
const LIGHT_TICK=(s,dt)=>{if(s.on&&s.prog<30)s.prog+=dt;};
let REACH=1e9,TRACED=[];
function beginLight(s){REACH=!s.on?0:reduceMotion?1e9:s.prog*750;TRACED=[];}
/* 沿折線畫出光，只畫到目前光走到的距離 */
const inStage=([x,y])=>x>=-2&&x<=902&&y>=-2&&y<=502;
function clipPts(pts){const out=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(inStage(b)||!inStage(a)){out.push(b);continue;}let t=1;const dx=b[0]-a[0],dy=b[1]-a[1];if(dx)t=Math.min(t,((dx>0?902:-2)-a[0])/dx);if(dy)t=Math.min(t,((dy>0?502:-2)-a[1])/dy);out.push([a[0]+dx*t,a[1]+dy*t]);break;}return out;}
function ray(pts,c,o={}){const{w=3,op=1,arrow=true,delay=0}=o;pts=clipPts(pts);let total=delay;for(let i=1;i<pts.length;i++)total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);TRACED.push(total);
  let rem=REACH-delay;if(rem<=0)return '';let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=1;i<pts.length;i++){const[a,b]=[pts[i-1],pts[i]],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(rem>=l){d+=`L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;rem-=l;}else{const t=rem/l;d+=`L${(a[0]+(b[0]-a[0])*t).toFixed(1)} ${(a[1]+(b[1]-a[1])*t).toFixed(1)}`;break;}}
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"${arrow?' marker-end="url(#arr)"':''}/>`;}
const maxTraced=()=>TRACED.length?Math.max(...TRACED):0;
const arrived=()=>TRACED.length>0&&REACH>=maxTraced();
const fadeIn=()=>TRACED.length?clamp((REACH-maxTraced())/200,0,1):0;

/* ---------- 聲音共用 ---------- */
const HEARING=[['人',20,20000],['狗',67,45000],['貓',45,64000],['蝙蝠',2000,110000],['海豚',75,150000],['大象',16,12000]];
const fmtHz=hz=>{if(hz<1000)return `${Math.round(hz)} Hz`;const k=hz/1000;return `${k>=10||Math.abs(k-Math.round(k))<0.05?Math.round(k):k.toFixed(1)} kHz`;};
/* 發聲體振動強度隨時間的變化（敲擊、撥弦會衰減；拉弓、說話持續） */
function srcEnv(s,t){
  if(s.src==='fork'||s.src==='string'){if(s.t0===null||t<s.t0)return 0;let e=Math.exp(-(t-s.t0)/(s.src==='fork'?2.5:1.4));if(s.td!==null&&s.td>s.t0&&t>s.td)e*=Math.exp(-(t-s.td)/0.06);return e;}
  const rise=t=>t>=s.ton?1-Math.exp(-(t-s.ton)/0.15):0,fall=t=>t>=s.toff?s.eoff*Math.exp(-(t-s.toff)/0.12):0;
  return s.bow?(t>=s.ton?rise(t):fall(t)):(t>=s.toff?fall(t):rise(t));}
function bowSwitch(s){if(s.bow)s.ton=s.t;else{s.eoff=srcEnv({...s,bow:true},s.t);s.toff=s.t;}}
/* 真的發出聲音（預設關閉） */
const AUD={};
function audioSync(on,f,A,tb){
  if(!on){if(AUD.osc){try{AUD.osc.stop();}catch(e){}AUD.osc.disconnect();AUD.osc=null;AUD.key=null;}return;}
  try{if(!AUD.ctx)AUD.ctx=new(window.AudioContext||window.webkitAudioContext)();const c=AUD.ctx;if(c.state==='suspended')c.resume();
    if(!AUD.osc){AUD.gain=c.createGain();AUD.gain.gain.value=0;AUD.gain.connect(c.destination);AUD.osc=c.createOscillator();AUD.osc.connect(AUD.gain);AUD.osc.start();AUD.tb=null;}
    if(AUD.tb!==tb){const hs=TIMBRE[tb][1],re=new Float32Array(hs.length+1),im=new Float32Array(hs.length+1);hs.forEach((v,i)=>{im[i+1]=v;});AUD.osc.setPeriodicWave(c.createPeriodicWave(re,im));AUD.tb=tb;}
    const key=f+'|'+A;if(AUD.key!==key){AUD.osc.frequency.setTargetAtTime(f,c.currentTime,0.02);AUD.gain.gain.setTargetAtTime(0.012*A,c.currentTime,0.03);AUD.key=key;}
  }catch(e){}}

/* ---------- 針孔成像例題：視角決定看到的形狀 ---------- */
const F_OPTS=[['A','正常','',' '],['B','左右相反','scale(-1 1)'],['C','上下顛倒','scale(1 -1)'],['D','轉 180°','rotate(180)']];
const fGlyph=(t,c='#1b2a33')=>`<svg viewBox="-30 -36 60 72" width="54" height="64" aria-hidden="true"><g transform="${t}"><path d="M-14 -30H16V-20H-4V-5H10V5H-4V30H-14Z" fill="${c}"/></g></svg>`;
function pinholeExample(s){
  const ans={a:'D',b:'C'},row=(k,who)=>`<div class="ex-row"><span class="ex-who">${who}</span>${F_OPTS.map(([id])=>{const pick=s['ex'+k.toUpperCase()]===id,cls=pick?(s.exChk?(id===ans[k]?' right':' wrong'):' picked'):'';return `<button type="button" class="qopt${cls}" data-qa="${k}:${id}">(${id})</button>`;}).join('')}${s.exChk&&s['ex'+k.toUpperCase()]?`<span class="ex-mark">${s['ex'+k.toUpperCase()]===ans[k]?'✓ 正確':'✗ 再想想'}</span>`:''}</div>`;
  const q=`<b>例題</b>　用針孔成像觀察一個發光的字母「F」。從針孔這一側<b>面向物體</b>看，它是正常的 F。<br>・<b>小明</b>站在紙屏<b>後面</b>，面向針孔看紙屏上的像（像用針孔成像筒那樣）。<br>・<b>小華</b>站在針孔和紙屏<b>之間</b>，背對針孔看紙屏。<br>兩人看到的像分別是下列哪一個？`;
  const opts=`<div class="ex-opts">${F_OPTS.map(([id,name,t])=>`<figure>${fGlyph(t)}<figcaption>(${id}) ${name}</figcaption></figure>`).join('')}</div>`;
  const tools=`<div class="ex-tools"><button type="button" class="btn primary" data-qa="check">對答案</button><button type="button" class="btn" data-qa="view:A">用立體圖驗證：小明的方向</button><button type="button" class="btn" data-qa="view:B">小華的方向</button><button type="button" class="btn ghost" data-qa="sol">${s.exSol?'收起解析':'看解析'}</button></div>`;
  const sol=s.exSol?`<div class="answer"><b>答案：小明 (D)、小華 (C)</b><br>關鍵是先確定<b>從哪個方向看</b>。<br>・小明在紙屏後面面向針孔，和「面向物體」是<b>同一個方向</b> → 上下顛倒、左右相反，等於轉 180°。<br>・小華背對針孔看，觀看方向和面向物體<b>相反</b>，左右又被反一次，所以只剩<b>上下顛倒</b>。<br>課本說的「上下顛倒、左右相反」，是指用同一個方向比較物體和像。按上面的驗證按鈕，對照立體圖下方的小窗。</div>`:'';
  return {html:`<h3>想一想：視角決定形狀</h3><div class="ex-q">${q}</div>${opts}${row('a','小明看到')}${row('b','小華看到')}${tools}${sol}`};
}

/* ---------- 相似三角形例題（講義）---------- */
function simExample(s){
  const row=(key,label,opts,ans)=>`<div class="ex-row"><span class="ex-who">${label}</span>${opts.map(o=>{const pick=s[key]===o,cls=pick?(s.exSChk?(o===ans?' right':' wrong'):' picked'):'';return `<button type="button" class="qopt${cls}" data-qa="${key}:${o}">${o}</button>`;}).join('')}${s.exSChk&&s[key]?`<span class="ex-mark">${s[key]===ans?'✓ 正確':'✗ 再想想'}</span>`:''}</div>`;
  const q=`<b>例題</b>　簡易針孔成像裝置：文字「d」與小孔相距 <b>10 cm</b>，紙屏與小孔相距 <b>15 cm</b>。<br>(1) 若「d」高 <b>6 cm</b>，紙屏上的像高是多少？<br>(2) 從紙屏後面看，像是哪一個字母？`;
  const tools=`<div class="ex-tools"><button type="button" class="btn primary" data-qa="scheck">對答案</button><button type="button" class="btn" data-qa="sview">用圖算算看</button><button type="button" class="btn ghost" data-qa="ssol">${s.exSSol?'收起解析':'看解析'}</button></div>`;
  const sol=s.exSSol?`<div class="answer"><b>答案：(1) 9 cm　(2) p</b><br>(1) 針孔兩邊的三角形相似。像距 15 是物距 10 的 <b>1.5 倍</b>，所以像高也是物高的 1.5 倍：6 × 1.5 = 9 cm。<br>也可以寫成 6 : 像高 = 10 : 15。<br>(2) 從紙屏後面看，像上下顛倒、左右相反，等於轉 180°，「d」轉 180° 就是「p」。（可以切到「立體 360°」看看）</div>`:'';
  return {html:`<h3>想一想：講義例題</h3><div class="ex-q">${q}</div>${row('exS1','(1) 像高',['4 cm','9 cm','10 cm','15 cm'],'9 cm')}${row('exS2','(2) 字母',['d','b','p','q'],'p')}${tools}${sol}`};
}

const hashK=t=>{let h=0;for(const c of String(t))h=(h*31+c.charCodeAt(0))|0;return h;};
/* ---------- 例題卡（多題選擇）：state 用 qi 題號、qp 選項、qc 已對答案、qs 顯示解析 ---------- */
function quizHTML(s,list,title='例題'){
  const i=clamp(s.qi||0,0,list.length-1),Q=list[i],pick=s.qp,chk=s.qc,AB='ABCD';
  const tabs=list.length>1?`<div class="ex-row"><span class="ex-who">題號</span>${list.map((_,j)=>`<button type="button" class="qopt${j===i?' picked':''}" data-qa="qi:${j}">${j+1}</button>`).join('')}</div>`:'';
  const opts=`<div class="ex-row">${Q.opts.map((o,j)=>{const cls=pick===j?(chk?(j===Q.ans?' right':' wrong'):' picked'):'';return `<button type="button" class="qopt${cls}" data-qa="qp:${j}">(${AB[j]}) ${o}</button>`;}).join('')}${chk?`<span class="ex-mark">${pick===null?'先選一個答案':pick===Q.ans?'✓ 正確':'✗ 再想想'}</span>`:''}</div>`;
  const tools=`<div class="ex-tools"><button type="button" class="btn primary" data-qa="qc">對答案</button>${Q.go?`<button type="button" class="btn" data-qa="qgo">${Q.goLabel||'用模擬驗證'}</button>`:''}<button type="button" class="btn ghost" data-qa="qs">${s.qs?'收起解析':'看解析'}</button></div>`;
  return `<h3>${title}</h3>${tabs}<div class="ex-q">${Q.q}</div>${opts}${tools}${s.qs?`<div class="answer"><b>答案：(${AB[Q.ans]}) ${Q.opts[Q.ans]}</b><br>${Q.sol}</div>`:''}`;
}
function quizAction(s,v,list){const[k,x]=v.split(':');
  if(k==='qi'){s.qi=+x;s.qp=null;s.qc=false;s.qs=false;}else if(k==='qp'){s.qp=+x;s.qc=false;}else if(k==='qc')s.qc=true;else if(k==='qs')s.qs=!s.qs;
  else if(k==='qgo'){const Q=list[clamp(s.qi||0,0,list.length-1)];if(Q.go){Q.go(s);s.prog=0;}}}

/* ---------- 4-4 透鏡共用：近軸光線追跡（薄透鏡讓斜率 m 變成 m − y/f，y 向上為正）與透鏡外形 ---------- */
const paraxTrace=(x0,y0,m,lenses,xEnd)=>{if(x0<20){y0+=m*(20-x0);x0=20;}const pts=[[x0,y0]];let x=x0,y=y0;for(const l of lenses){y+=m*(l.x-x);x=l.x;m-=y/l.f;pts.push([x,y]);}pts.push([xEnd,y+m*(xEnd-x)]);return{pts,y,m,x};};
const lensPath=(x,f,ry=60,cy=250)=>{const t=clamp(2400/Math.abs(f),5,24);return f>0?`<path d="M${x} ${cy-ry}Q${x+t} ${cy} ${x} ${cy+ry}Q${x-t} ${cy} ${x} ${cy-ry}" fill="#61ddeb33" stroke="${D.ray}" stroke-width="2.5"/>`:`<path d="M${x-9} ${cy-ry}Q${x-2} ${cy} ${x-9} ${cy+ry}L${x+9} ${cy+ry}Q${x+2} ${cy} ${x+9} ${cy-ry}Z" fill="#61ddeb33" stroke="${D.ray}" stroke-width="2.5"/>`;};
const LIFE_Q={
  camera:['照相機拍到的像在感光元件上是什麼樣子？照相機的哪些構造和眼睛很像？','風景在鏡頭的 <b>2F 以外</b> → 感光元件上是<b>倒立、縮小的實像</b>。鏡頭（凸透鏡）↔ 水晶體、感光元件 ↔ 視網膜、光圈 ↔ 瞳孔。'],
  proj:['如果把投影片放到鏡頭的焦點以內，螢幕上還會有像嗎？','<b>不會</b>。焦點以內的光經過凸透鏡後仍然發散，只會形成虛像（就像放大鏡），螢幕接不到。投影片一定要在 <b>F 與 2F 之間</b>，才會在遠處的螢幕上形成倒立、放大的<b>實像</b>。'],
  mag:['用放大鏡看字時，慢慢把放大鏡拿離字遠一點（字仍在焦點以內），看到的字會變大還是變小？','<b>變大</b>。字越靠近焦點，虛像越大、也越遠；但字一移到焦點以外，看到的像就會倒過來、而且模糊。'],
  scope:['在顯微鏡下，想把視野左邊的細胞移到中間，玻片要往哪邊推？','<b>往左推</b>。顯微鏡最後看到的是<b>倒立</b>的像（上下、左右都相反），所以玻片往左推，像會往右移，剛好把左邊的細胞移到中間。'],
  eye:['眼睛和照相機都要「對焦」，方法有什麼不同？','照相機的鏡頭焦距固定，靠<b>移動鏡頭</b>改變像距來對焦；眼睛的視網膜不能動（像距固定），靠改變<b>水晶體的厚薄</b>（焦距）來對焦。'],
  myopia:['近視眼鏡的鏡片，中間比較厚還是邊緣比較厚？為什麼？','<b>邊緣比較厚</b>，是凹透鏡。近視眼看遠處時光會聚在視網膜前方，凹透鏡先讓光稍微發散，會聚點往後移到視網膜上。'],
  hyper:['遠視的人為什麼要戴凸透鏡？','遠視眼看近處時，光會聚在視網膜<b>後方</b>。凸透鏡先幫忙會聚一些，會聚點往前移，剛好落在視網膜上。']};

/* 「想一想」問答區塊（和例題卡放在同一張卡片時使用） */
const qBlockHTML=([q,a])=>`<h3>想一想</h3><div class="ex-q"><b>${q}</b></div><details data-k="${hashK(q)}"><summary>看解釋</summary><div class="answer">${a}</div></details><hr class="ex-sep">`;
const camSharp=s=>{const v=100*s.cu/(s.cu-100);return Math.abs(s.focus-v)*90/v<3;};
const LIFE_QUIZ=[
  {q:'照相機原本拍遠處的風景，改拍近處的花，鏡頭要怎麼調才會清楚？',opts:['往前伸（離感光元件遠一點）','往後縮（離感光元件近一點）','不用調','換成凹透鏡'],ans:0,
    sol:'物體變近 → 像距變大（物近像遠）。感光元件不能動，所以鏡頭要<b>往前伸</b>，讓鏡頭到感光元件的距離變大。',go:s=>{s.dev='camera';s.cu=400;s.focus=118;},goLabel:'用照相機試試（花在近處）'},
  {q:'投影機的投影片要怎麼放，螢幕上的字才會是正的？',opts:['正著放','只要上下顛倒','只要左右相反','上下顛倒、左右相反（轉 180°）'],ans:3,
    sol:'投影片在鏡頭的 F 與 2F 之間，成<b>倒立、放大的實像</b>：上下、左右都相反。所以投影片要先轉 180° 放進去。',go:s=>{s.dev='proj';s.flip=false;},goLabel:'用投影機試試'},
  {q:'想讓螢幕上的像<b>更大</b>又清楚，投影機要怎麼調？',opts:['投影機離螢幕遠一點，投影片稍微靠近鏡頭','投影機靠近螢幕，投影片離鏡頭遠一點','只把投影機往後移','換一個焦距更長的鏡頭並靠近螢幕'],ans:0,
    sol:'像要更大 → 像距要更大（螢幕更遠），物距就要更小（投影片更靠近焦點，但仍在焦點外）。',go:s=>{s.dev='proj';s.flip=true;s.pu=122;},goLabel:'投影片靠近焦點看看'},
  {q:'用放大鏡看小字時，看到的像是：',opts:['倒立、放大的實像','正立、放大的虛像','正立、縮小的虛像','倒立、縮小的實像'],ans:1,
    sol:'字在放大鏡的<b>焦點以內</b> → 正立、放大的<b>虛像</b>，而且像和字在同一側。',go:s=>{s.dev='mag';s.mu=100;}},
  {q:'複式顯微鏡的物鏡和目鏡各是哪一種透鏡？從目鏡看到的像是：',opts:['都是凸透鏡；倒立、放大的虛像','都是凸透鏡；正立、放大的虛像','物鏡凸透鏡、目鏡凹透鏡；倒立、放大的實像','都是凹透鏡；正立、縮小的虛像'],ans:0,
    sol:'物鏡、目鏡都是<b>凸透鏡</b>。物鏡成倒立放大的實像，目鏡當放大鏡再放大 → 最後是<b>倒立、放大的虛像</b>。',go:s=>{s.dev='scope';s.step='both';},goLabel:'看顯微鏡'},
  {q:'近視的人看遠處的物體，光會聚在哪裡？要戴哪一種眼鏡？',opts:['視網膜前方，戴凹透鏡','視網膜後方，戴凹透鏡','視網膜前方，戴凸透鏡','視網膜後方，戴凸透鏡'],ans:0,
    sol:'近視：光會聚在視網膜<b>前方</b> → 戴<b>凹透鏡</b>讓光先發散一點。遠視（或老花）相反，戴凸透鏡。',go:s=>{s.dev='myopia';s.glasses=false;},goLabel:'看看近視眼'},
  {q:'拿一副眼鏡放在書上，看到的字<b>變小</b>了。這是：',opts:['遠視眼鏡（凸透鏡）','近視眼鏡（凹透鏡）','老花眼鏡（凸透鏡）','平光眼鏡'],ans:1,
    sol:'凹透鏡不管物體放哪裡，都成<b>正立、縮小</b>的虛像 → 看字變小的是凹透鏡，也就是<b>近視</b>眼鏡。看字變大的是凸透鏡（遠視或老花眼鏡）。到「透鏡成像 → 成像」選凹透鏡可以驗證。'},
  {q:'眼睛從看遠處改成看近處的書，眼睛怎麼調整？',opts:['水晶體變厚','水晶體變薄','視網膜往後移','眼球變長'],ans:0,
    sol:'視網膜的位置不能動（像距固定），所以看近處時<b>水晶體變厚</b>、焦距變短，像才會剛好落在視網膜上。',go:s=>{s.dev='eye';s.u=400;},goLabel:'讓物體靠近眼睛'}];

/* ---------- 4-4 凸透鏡成像規律與例題 ---------- */
const LENS_ROWS=[['2F 以外','另一側 F 與 2F 之間','倒立・縮小・實像','照相機、眼睛'],['2F 上','另一側 2F 上','倒立・等大・實像','用來求焦距'],['F 與 2F 之間','另一側 2F 以外','倒立・放大・實像','投影機'],['F 上','不成像','折射光平行射出','—'],['F 以內','與物體同側','正立・放大・虛像','放大鏡']];
const lensRow=(u,f)=>{const r=u/f;return Math.abs(r-1)<1e-6?3:r<1?4:Math.abs(r-2)<1e-6?1:r>2?0:2;};
function lensTableHTML(s){
  const btn=`<div class="ex-tools tab-tools"><button type="button" class="btn${s.tab?'':' primary'}" data-qa="tab">${s.tab?'收起成像規律表':'📋 顯示成像規律表'}</button></div>`;
  if(!s.tab)return btn;
  const cc=s.type===1,cur=cc?lensRow(s.u,s.f):0,rows=cc?LENS_ROWS:[['任何位置','與物體同側、焦點以內','正立・縮小・虛像','近視眼鏡']];
  return btn+`<table class="ex-table"><thead><tr><th>物體位置</th><th>像的位置</th><th>像的性質</th><th>應用</th></tr></thead><tbody>${rows.map((r,i)=>`<tr${i===cur?' class="on"':''}>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="ex-hint">${cc?'黃色那一列 = 目前物體的位置。用<b>一個</b>凸透鏡時，實像都是倒立的，能用紙屏接到；虛像是正立的，紙屏接不到。':'凹透鏡只會讓光發散，像永遠是正立、縮小的虛像。'}</p>`;
}
const LENS_Q={
  why:['凸透鏡和凹透鏡，哪一種會讓平行光會聚？為什麼？','凸透鏡。光經過透鏡的兩個表面<b>各折射一次</b>，兩次都偏向<b>較厚的一邊</b>。凸透鏡中間厚 → 光往主軸偏 → 會聚；凹透鏡邊緣厚 → 光往外偏 → 發散。'],
  focus:['怎樣用太陽光量出凸透鏡的焦距？','太陽很遠，射來的光可以看成<b>平行光</b>。讓透鏡正對太陽，在另一側前後移動紙張，找到<b>最小、最亮</b>的光點，那就是焦點；量光點到透鏡中心（光心）的距離，就是焦距。（千萬不要用透鏡看太陽！）'],
};
const LENS_QUIZ=[
  {q:'焦距 10 cm 的凸透鏡，把蠟燭放在透鏡前 <b>15 cm</b> 處，移動紙屏可以接到清楚的像。這個像是：',opts:['倒立、縮小的實像','倒立、放大的實像','正立、放大的虛像','倒立、等大的實像'],ans:1,
    sol:'15 cm 在 f（10 cm）和 2f（20 cm）之間 → 像在另一側 2F 以外，是<b>倒立、放大的實像</b>（投影機的原理）。',go:s=>{s.mode='image';s.type=1;s.beam='main';s.block=false;s.f=80;s.u=120;s.oh=30;s.sweep=null;},goLabel:'用模擬驗證（同比例：焦距 80、物距 120）'},
  {q:'凸透鏡在紙屏上形成清楚的像。用黑紙把透鏡的<b>上半部</b>遮住，紙屏上的像會：',opts:['只剩下半部','只剩上半部','仍然完整，但變暗','完全消失'],ans:2,
    sol:'物體上<b>每一點</b>發出的光，都有一部分會穿過沒被遮住的下半部，仍然會聚到同一個像點 → 像仍然完整；穿過透鏡的光變少，所以<b>變暗</b>。',go:s=>{s.mode='image';s.type=1;s.beam='full';s.block=true;s.f=80;s.u=200;s.oh=30;s.sweep=null;},goLabel:'用模擬驗證（全光＋遮住上半部）'},
  {q:'蠟燭和紙屏都距離凸透鏡 <b>30 cm</b> 時，紙屏上出現倒立、等大的清楚像。這個透鏡的焦距是：',opts:['10 cm','15 cm','30 cm','60 cm'],ans:1,
    sol:'倒立、等大的實像出現在<b>物距 ＝ 像距 ＝ 2 倍焦距</b>（2F 上），所以 2f ＝ 30 cm，f ＝ <b>15 cm</b>。這是實驗室常用的求焦距方法。',go:s=>{s.mode='bench';s.bf=15;s.bu=30;s.bv=30;s.log=[];},goLabel:'到光具座驗證'},
  {q:'把蠟燭放在凸透鏡的<b>焦點以內</b>，前後移動紙屏：',opts:['可以接到倒立、放大的實像','可以接到正立、放大的實像','接不到；要透過透鏡看，看到正立、放大的虛像','接不到；因為完全不成像'],ans:2,
    sol:'焦點以內的光經過凸透鏡後仍然<b>發散</b>，只有反向延長線相交 → 虛像，紙屏接不到；從另一側透過透鏡看，看到正立放大的虛像（放大鏡）。',go:s=>{s.mode='bench';s.bf=10;s.bu=6;s.bv=20;s.log=[];},goLabel:'到光具座試試看'},
  {q:'蠟燭從很遠的地方，慢慢移向凸透鏡（還沒到焦點）。紙屏上的像會：',opts:['越來越大，像距越來越大','越來越小，像距越來越小','越來越大，像距越來越小','大小、位置都不變'],ans:0,
    sol:'物體越靠近焦點，像離透鏡越<b>遠</b>、也越<b>大</b>（物近 → 像遠 → 像變大）。到焦點上就不成像了。',go:s=>{s.mode='image';s.type=1;s.beam='main';s.block=false;s.f=80;s.oh=30;s.sweep=0;s.su=null;},goLabel:'▶ 播放：物體慢慢靠近'},
  {q:'想把凸透鏡當放大鏡，看清楚書上的小字，字應該放在：',opts:['2F 以外','2F 上','F 與 2F 之間','焦點以內'],ans:3,
    sol:'物體在<b>焦點以內</b> → 正立、放大的虛像，眼睛從另一側透過透鏡看。到「生活中的透鏡 → 放大鏡」可以看到眼睛看到的畫面。',go:s=>{s.mode='image';s.type=1;s.beam='main';s.block=false;s.sweep=null;s.oh=30;s.u=snap('u',s.f*0.55);}},
  {q:'物體放在<b>凹透鏡</b>前面，不管放在哪裡，看到的像都是：',opts:['倒立、縮小的實像','正立、縮小的虛像','正立、放大的虛像','倒立、放大的實像'],ans:1,
    sol:'凹透鏡讓光發散，折射光只有反向延長線會相交 → 一定是<b>正立、縮小的虛像</b>，在物體同一側。拖動物體試試看。',go:s=>{s.mode='image';s.type=-1;s.beam='main';s.block=false;s.oh=30;s.sweep=null;}},
  {q:'紙屏上已經有清楚的實像。把紙屏拿走，那個實像：',opts:['也跟著消失','仍然存在，眼睛在適當位置看得到','變成虛像','變成正立的像'],ans:1,
    sol:'實像是光<b>真的會聚</b>形成的，紙屏只是把光接住讓我們看到。拿走紙屏，光還是會聚在那裡，眼睛在像的後方適當位置仍然看得到。'},
  {q:'凹透鏡和凹面鏡（4-2），哪一個能讓平行光<b>會聚</b>？',opts:['凹透鏡','凹面鏡','兩個都可以','兩個都不行'],ans:1,
    sol:'名字很像，作用卻相反：<b>凹面鏡</b>把光反射後會聚，作用像凸透鏡；<b>凹透鏡</b>讓光發散，作用像凸面鏡。',go:s=>{s.mode='focus';s.type=-1;s.side='left';s.paper=false;},goLabel:'看凹透鏡讓平行光發散'}];
/* 光具座實驗：記錄一次結果 */
function benchLog(s){
  if(!s.on){s.flash='先開燈，點燃蠟燭';s.flashT=3;return;}
  const f=s.bf,u=s.bu,inf=u===f,v=inf?Infinity:f*u/(u-f),real=!inf&&v>0,b=inf?8:8*Math.abs(s.bv-v)/Math.abs(v),m=v/u;let row;
  if(real&&b<0.3)row={u,v:String(s.bv),p:`倒立・${Math.abs(m-1)<0.02?'等大':m>1?'放大':'縮小'}・實像`};
  else if(u<f)row={u,v:'—',p:'接不到（正立放大虛像）'};
  else if(inf)row={u,v:'—',p:'不成像'};
  else{s.flash=v>50?`像距約 ${num(v)} cm，超出光具座，紙屏放不到`:'先移動紙屏，找到最清楚的像再記錄';s.flashT=3;return;}
  s.log=s.log.filter(r=>r.u!==u);s.log.push(row);if(s.log.length>5)s.log.shift();s.flash='已記錄！';s.flashT=1.5;}

const LABS={
/* ===== 01 測量 ===== */
measure:{group:1,n:'01',name:'測量與估讀',subtitle:'拖動物件或換一把尺，練習讀出完整的測量值。',
  q:['最小刻度為 0.1 cm 的尺，量到 5.34 cm，最後一位代表什麼？','4 是估讀位。估讀會有合理差異，不是精準知道物體的每一位數；記錄時要估讀到最小刻度的下一位。'],
  state:{len:5.34,start:0,step:0.1,mag:true,show:false},
  controls:[
    {type:'seg',key:'step',label:'尺的最小刻度',options:[[1,'1 cm'],[0.1,'1 mm']]},
    {type:'range',key:'start',label:'物件起點',min:0,max:3,step:0.5,unit:' cm'},
    {type:'range',key:'len',label:'物件長度',min:1,max:7,step:0.01,fmt:s=>s.show?s.len.toFixed(2)+' cm':'？'},
    {type:'toggle',key:'mag',label:'放大鏡'},
    {type:'toggle',key:'show',label:'顯示參考讀值'}],
  drag:{end:(p,s)=>{s.len=snap('len',(p.x-90)/72-s.start);},obj:(p,s,c)=>{s.start=snap('start',c.s0.start+(p.x-c.p0.x)/72);}},
  render(s){
    const X=c=>90+c*72,end=s.start+s.len,ex=X(end),dg=s.step===1?1:2,n=s.step===1?10:100;
    let ruler=`<rect x="66" y="250" width="768" height="96" rx="6" fill="#efe3c4" stroke="#d3c49c"/>`;
    for(let i=0;i<=n;i++){const x=X(i*10/n),major=i%(n/10)===0,half=n===100&&i%5===0;ruler+=L(x,250,x,250+(major?30:half?21:12),{stroke:'#6f6448',w:major?2:1});if(major)ruler+=T(x,322,i/(n/10),{size:18,fill:'#6f6448',anchor:'middle'});}
    ruler+=T(812,338,'cm',{size:15,fill:'#6f6448'});
    const obj=`<rect x="${X(s.start)}" y="200" width="${s.len*72}" height="40" rx="5" fill="${P.accent}"/>`+L(ex,190,ex,284,{stroke:P.orange,w:2,dash:'5 4'})+L(X(s.start),190,X(s.start),284,{stroke:P.orange,w:2,dash:'5 4'});
    let h=ruler+`<g data-drag="obj" class="handle-body">${obj}</g>`+handle('end',ex,220,P.orange);
    if(s.mag){const mx=clamp(ex,180,720),my=112,r=80;h+=`<clipPath id="mag"><circle cx="${mx}" cy="${my}" r="${r}"/></clipPath><g clip-path="url(#mag)" pointer-events="none"><circle cx="${mx}" cy="${my}" r="${r}" fill="#fbfaf6"/><g transform="translate(${mx} ${my}) scale(3) translate(${-ex} -262)">${ruler}${obj}</g></g><circle cx="${mx}" cy="${my}" r="${r}" fill="none" stroke="${P.ink}" stroke-width="3"/>`;}
    const endR=+end.toFixed(dg),lenR=endR-s.start;
    h+=T(450,410,s.show?`末端 ${endR.toFixed(dg)} − 起點 ${s.start.toFixed(dg)} = ${lenR.toFixed(dg)} cm`:`要估讀到 ${s.step===1?'0.1':'0.01'} cm`,{size:24,anchor:'middle',weight:600});
    return {svg:h,reads:[['最小刻度',s.step===1?'1 cm':'0.1 cm'],['記錄到',s.step===1?'0.1 cm':'0.01 cm'],['讀值',s.show?lenR.toFixed(dg)+' cm':'先自己讀']],
      note:'長度 = 末端讀數 − 起點讀數；最後一位是<b>估計值</b>。'};}},

/* ===== 02 密度 ===== */
density:{group:1,n:'02',name:'密度與浮沉',subtitle:'改變質量、體積或液體，看物體浮起還是沉下。',
  q:['同一物體放進密度較大的液體，漂浮時露出水面的比例會如何變化？','露出比例變大。漂浮時浮力等於重力；液體密度越大，只要排開較少液體就能平衡，所以浸入比例變小。'],
  state:{m:120,V:200,liq:1,forces:true},
  controls:[
    {type:'range',key:'m',label:'質量 m',min:10,max:2400,step:5,unit:' g'},
    {type:'range',key:'V',label:'體積 V',min:20,max:300,step:5,unit:' cm³'},
    {type:'buttons',label:'換材質（體積不變）',items:[['木頭',s=>{s.m=snap('m',0.6*s.V);}],['冰',s=>{s.m=snap('m',0.92*s.V);}],['塑膠',s=>{s.m=snap('m',1.05*s.V);}],['鋁',s=>{s.m=snap('m',2.7*s.V);}],['鐵',s=>{s.m=snap('m',7.9*s.V);}]]},
    {type:'buttons',label:'操作',items:[['切成一半',s=>{s.m=snap('m',s.m/2);s.V=snap('V',s.V/2);}]]},
    {type:'seg',key:'liq',label:'液體',options:LIQUIDS.map(([v,n])=>[v,n])},
    {type:'toggle',key:'forces',label:'顯示重力與浮力'}],
  render(s){
    const rho=s.m/s.V,rl=s.liq,side=22*Math.cbrt(s.V),surface=190,bottom=430,eq=Math.abs(rho-rl)<0.005,float=!eq&&rho<rl;
    const ratio=float?rho/rl:1,y=float?surface-side*(1-ratio):eq?(surface+bottom)/2-side/2:bottom-side,x=450-side/2;
    const status=float?'漂浮':eq?'懸浮':'下沉';
    let h=T(450,62,status,{size:28,anchor:'middle',weight:700,fill:float?P.accent:eq?P.blue:P.red});
    h+=`<rect x="${x}" y="${y}" width="${side}" height="${side}" rx="5" fill="#d98a4e" stroke="#a65e2e" stroke-width="2"/>`;
    h+=`<rect x="232" y="${surface}" width="436" height="${bottom-surface}" fill="${liquid(rl)[2]}" opacity=".62"/>`+L(232,surface,668,surface,{stroke:P.blue,w:3});
    h+=`<path d="M228 92V434H672V92" fill="none" stroke="#9bb5b1" stroke-width="6" stroke-linejoin="round"/>`+T(244,surface-12,liquid(rl)[1],{size:17,fill:P.blue});
    if(s.forces){const W=s.m,B=rl*(float?s.m/rl:s.V),N=float||eq?0:W-B,k=120/Math.max(W,B),cx=450,cy=y+side/2;
      h+=L(cx+12,cy,cx+12,cy+W*k,{stroke:P.red,w:5,arrow:true})+T(cx+24,cy+W*k-4,`重力 ${num(W,0)} gw`,{size:16,fill:P.red,weight:600});
      h+=L(cx-12,cy,cx-12,cy-B*k,{stroke:P.blue,w:5,arrow:true})+T(cx-24,cy-B*k+14,`浮力 ${num(B,0)} gw`,{size:16,fill:P.blue,anchor:'end',weight:600});
      if(N>0.5)h+=L(cx+side/2+26,bottom,cx+side/2+26,bottom-N*k,{stroke:P.accent,w:4,arrow:true})+T(cx+side/2+36,bottom-N*k+16,`支持力 ${num(N,0)} gw`,{size:15,fill:P.accent});}
    return {svg:h,reads:[['物體密度',rho.toFixed(2)+' g/cm³'],['液體密度',rl.toFixed(2)+' g/cm³'],['浸入比例',(ratio*100).toFixed(0)+'%']],
      note:`<b>ρ = m ÷ V</b> = ${s.m} ÷ ${s.V} = ${rho.toFixed(2)} g/cm³<br>${float?'物體 ＜ 液體 → 漂浮，浮力 = 重力':eq?'物體 ＝ 液體 → 懸浮':'物體 ＞ 液體 → 下沉，浮力 ＜ 重力'}`};}},

/* ===== 03 物質 ===== */
matter:{group:1,n:'03',name:'物質與粒子',subtitle:'自己放入不同分子，看看它是元素、化合物還是混合物。',
  q:['把很多顆相同的水分子放在一起，會不會變成混合物？','不會。相同種類的水分子構成純物質；水分子內含氫、氧兩種元素，所以水是化合物。'],
  state:{counts:{O2:8,N2:0,H2:0,He:0,H2O:0,CO2:0},labels:true,t:0},
  controls:[
    {type:'buttons',label:'範例',items:[['氧氣',s=>setCounts(s,{O2:8})],['水',s=>setCounts(s,{H2O:8})],['二氧化碳',s=>setCounts(s,{CO2:6})],['空氣',s=>setCounts(s,{N2:8,O2:2})],['汽水',s=>setCounts(s,{H2O:8,CO2:3})],['清空',s=>setCounts(s,{})]]},
    {type:'counter',key:'counts',label:'放入分子',items:Object.entries(SPECIES).map(([k,v])=>[k,v.label]),max:8,total:24},
    {type:'toggle',key:'labels',label:'顯示原子符號'}],
  tick:(s,dt)=>{s.t+=dt;},
  render(s){
    const list=[],kinds=Object.keys(SPECIES).filter(k=>s.counts[k]>0),left={...s.counts};
    while(list.length<24&&kinds.some(k=>left[k]>0))for(const k of kinds)if(left[k]>0&&list.length<24){list.push(k);left[k]--;}
    const els=[...new Set(kinds.flatMap(k=>SPECIES[k].atoms))];
    const cls=!kinds.length?'空的':kinds.length>1?'混合物':els.length===1?'純物質 · 元素':'純物質 · 化合物';
    let h=T(450,52,cls,{size:26,anchor:'middle',weight:700,fill:kinds.length>1?P.orange:kinds.length?P.accent:P.muted});
    h+=`<rect x="120" y="76" width="660" height="384" rx="28" fill="#fff" stroke="#c9d6cf" stroke-width="2"/>`;
    const atom=(x,y,a,rot)=>`<circle cx="${x}" cy="${y}" r="${ATOM[a].r}" fill="${ATOM[a].c}" stroke="#fff" stroke-width="1.5"/>${s.labels?`<text x="${x}" y="${y+5}" font-size="${a==='H'?11:13}" fill="#fff" text-anchor="middle" font-weight="700" transform="rotate(${-rot} ${x} ${y})">${a}</text>`:''}`;
    list.forEach((k,i)=>{const[bx,by]=SLOTS[i],t=reduceMotion?0:s.t,x=bx+8*Math.sin(t*1.3+i*1.7),y=by+8*Math.cos(t*1.1+i*2.3),rot=(i*47+(reduceMotion?0:25*Math.sin(t*.8+i)))%360,a=SPECIES[k].atoms;let g='';
      if(a.length===1)g=atom(0,0,a[0],rot);
      else if(k==='H2O')g=atom(-13,13,'H',rot)+atom(13,13,'H',rot)+atom(0,0,'O',rot);
      else if(k==='CO2')g=atom(-25,0,'O',rot)+atom(25,0,'O',rot)+atom(0,0,'C',rot);
      else{const d=ATOM[a[0]].r*.85;g=atom(-d,0,a[0],rot)+atom(d,0,a[1],rot);}
      h+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(1.3)">${g}</g>`;});
    if(!list.length)h+=T(450,275,'用右側的 ＋ 放入分子',{size:20,anchor:'middle',fill:P.muted});
    return {svg:h,reads:[['分子種類',`${kinds.length} 種`],['元素種類',els.length?`${els.join('、')}（${els.length} 種）`:'—'],['分類',cls]],
      note:!kinds.length?'元素看<b>原子種類</b>，純物質看<b>分子種類</b>。':kinds.length>1?'含兩種以上的分子 → <b>混合物</b>':els.length===1?'只有一種分子，且只由一種原子組成 → <b>元素</b>':'只有一種分子，但含兩種以上原子 → <b>化合物</b>'};}},

/* ===== 04 溶液 ===== */
solution:{group:1,n:'04',name:'水溶液與溶解度',subtitle:'改變溫度、水量和溶質，看溶不溶得完；也可以直接拖曲線上的點。',
  q:['100 g 水最多能溶 36 g 某溶質，加入 50 g 後，溶液濃度是 50/150 嗎？','不是。只有 36 g 溶解，14 g 沉在杯底；溶液質量 = 100 + 36 = 136 g，濃度 = 36 ÷ 136 × 100% ≈ 26.47%。未溶的固體不算進溶液。'],
  state:{sub:'KNO3',temp:20,water:100,solute:40},
  controls:[
    {type:'seg',key:'sub',label:'溶質',options:Object.entries(SOLUBILITY).map(([k,v])=>[k,v.name])},
    {type:'range',key:'temp',label:'水溫',min:0,max:100,step:1,unit:' °C'},
    {type:'range',key:'water',label:'水的質量',min:50,max:200,step:10,unit:' g'},
    {type:'range',key:'solute',label:'加入溶質',min:0,max:250,step:1,unit:' g'}],
  drag:{pt:(p,s)=>{s.temp=snap('temp',(p.x-490)/3.7);s.solute=snap('solute',(420-p.y)/1.4*s.water/100);}},
  render(s){
    const sol=solubility(s.sub,s.temp),cap=sol*s.water/100,d=Math.min(cap,s.solute),left=s.solute-d,pct=d/(s.water+d)*100,sat=s.solute>=cap-1e-9;
    const level=440-s.water*1.25;
    let h=T(230,62,sat?'飽和溶液':'未飽和溶液',{size:26,anchor:'middle',weight:700,fill:sat?P.orange:P.accent});
    h+=`<rect x="64" y="${level}" width="332" height="${436-level}" fill="${P.blue}" opacity="${(0.12+pct*0.008).toFixed(3)}"/>`+L(64,level,396,level,{stroke:P.blue,w:2});
    for(let i=0;i<Math.min(70,Math.round(d/2.5));i++)h+=`<circle cx="${(78+rnd(i)*304).toFixed(1)}" cy="${(level+12+rnd(i+500)*Math.max(10,(410-level))).toFixed(1)}" r="4" fill="${P.accent}" opacity=".5"/>`;
    for(let i=0;i<Math.min(84,Math.ceil(left/2.5));i++)h+=`<rect x="${74+(i%28)*11.5}" y="${425-Math.floor(i/28)*11}" width="9" height="9" rx="2" fill="${P.orange}"/>`;
    h+=`<path d="M60 100V430Q60 440 72 440H388Q400 440 400 430V100" fill="none" stroke="#9fb4b0" stroke-width="6"/>`+T(388,94,`${s.temp} °C`,{size:18,anchor:'end',fill:P.ink,weight:600});
    const X=t=>490+t*3.7,Y=v=>420-v*1.4;
    for(let v=0;v<=250;v+=50)h+=L(490,Y(v),860,Y(v),{stroke:'#e6e1d5',w:1})+T(480,Y(v)+5,v,{size:13,fill:P.muted,anchor:'end'});
    for(let t=0;t<=100;t+=20)h+=T(X(t),442,t,{size:13,fill:P.muted,anchor:'middle'});
    h+=T(490,52,'溶解度（g / 100 g 水）',{size:14,fill:P.muted})+T(860,468,'溫度（°C）',{size:14,fill:P.muted,anchor:'end'});
    for(const[k,v]of Object.entries(SOLUBILITY)){const pts=v.data.map((y,i)=>`${X(i*20)},${Y(y)}`).join(' '),on=k===s.sub;h+=`<polyline points="${pts}" fill="none" stroke="${on?P.accent:P.faint}" stroke-width="${on?3.5:2}"${on?'':' stroke-dasharray="6 5"'}/>`+T(X(100)-6,Y(v.data[5])-10,v.name,{size:14,fill:on?P.accent:P.muted,anchor:'end',weight:on?700:400});}
    const s100=s.solute*100/s.water,py=Math.max(Y(s100),62),px=X(s.temp);
    if(s100>sol)h+=L(px,Y(sol),px,py,{stroke:P.orange,w:3,dash:'4 4'});
    h+=`<circle cx="${px}" cy="${py}" r="7" fill="${s100>sol?P.orange:P.accent}"/>`+handle('pt',px,py,s100>sol?P.orange:P.accent);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['溶解度',`${sol.toFixed(1)} g / 100 g 水`],['已溶解',d.toFixed(1)+' g'],['沉在杯底',left.toFixed(1)+' g'],['濃度',pct.toFixed(1)+'%']],
      note:`<b>濃度 = 溶質 ÷ 溶液</b> = ${d.toFixed(1)} ÷ (${s.water} + ${d.toFixed(1)})<br>點在曲線上方 → 多出的溶質溶不了。`};}},

/* ===== 3-1 波的傳播與性質 ===== */
wave:{group:1,n:'3-1',name:'波的傳播與性質',subtitle:'波傳遞的是能量，不是物質；認識波的名詞，再看看波需不需要介質。',
  q:['保持波速不變，把頻率加倍，波長會變成多少？','由 v = fλ，波速不變時頻率加倍，波長減半。振幅只影響振動幅度，不影響波速。'],
  state:{mode:'wave',kind:'T',f:1,v:3,A:0.4,run:!reduceMotion,slow:false,terms:true,track:4,t:0,air:100,ring:true},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['wave','波形與名詞'],['medium','需要介質嗎？']]},
    {type:'seg',key:'kind',label:'波的種類',options:[['T','橫波'],['L','縱波']],show:s=>s.mode==='wave'},
    {type:'range',key:'f',label:'頻率 f',min:0.5,max:3,step:0.1,unit:' Hz',show:s=>s.mode==='wave'},
    {type:'range',key:'v',label:'波速 v（由介質決定）',min:1,max:6,step:0.5,unit:' m/s',show:s=>s.mode==='wave'},
    {type:'range',key:'A',label:'振幅 A',min:0.1,max:0.8,step:0.05,unit:' m',show:s=>s.mode==='wave'},
    {type:'seg',key:'run',label:'動畫',options:[[true,'播放'],[false,'暫停']],show:s=>s.mode==='wave'},
    {type:'toggle',key:'slow',label:'慢動作',show:s=>s.mode==='wave'},
    {type:'toggle',key:'terms',label:'標示波的名詞',show:s=>s.mode==='wave'},
    {type:'range',key:'air',label:'鐘罩內的空氣',min:0,max:100,step:5,unit:' %',show:s=>s.mode==='medium'},
    {type:'toggle',key:'ring',label:'電鈴響',show:s=>s.mode==='medium'}],
  tick:(s,dt)=>{if(s.mode==='medium'||s.run)s.t+=dt*(s.mode==='wave'&&s.slow?0.25:1);},
  drag:{track:(p,s)=>{s.track=+clamp((p.x-80)/75,0,10).toFixed(1);}},
  render(s){
    if(s.mode==='medium')return this.medium(s);
    const lam=s.v/s.f,X=x=>80+x*75,mid=250,ph=x=>2*Math.PI*(x/lam-s.f*s.t);let h='';
    for(let x=0;x<=10;x++)h+=L(X(x),110,X(x),400,{stroke:'#e6e1d5',w:1})+T(X(x),432,x,{size:13,fill:P.muted,anchor:'middle'});
    h+=T(X(10)+14,432,'m',{size:13,fill:P.muted})+T(830,74,'傳播方向 →',{size:17,fill:P.accent,anchor:'end',weight:600});
    if(s.kind==='T'){
      const Y=x=>mid-s.A*120*Math.sin(ph(x)),x0=((lam*(0.25+s.f*s.t))%lam+lam)%lam,top=mid-s.A*120;
      if(s.terms&&x0+lam<=10)h+=`<rect x="${X(x0)}" y="${top-6}" width="${lam*75}" height="${s.A*240+12}" fill="${P.accent}" opacity=".07"/>`+T(X(x0+lam/2),mid+s.A*120+34,'一個完整的波',{size:14,fill:P.accent,anchor:'middle'});
      h+=L(X(0),mid,X(10),mid,{stroke:'#cfd8d2',w:2});
      let d='';for(let x=0;x<=10.001;x+=0.04)d+=(x?'L':'M')+X(x).toFixed(1)+' '+Y(x).toFixed(1);h+=`<path d="${d}" fill="none" stroke="${P.accent}" stroke-width="4"/>`;
      for(let x=0;x<=10.001;x+=0.5)h+=`<circle cx="${X(x)}" cy="${Y(x)}" r="4" fill="#fff" stroke="${P.accent}" stroke-width="2"/>`;
      if(s.terms){if(x0+lam<=10)h+=lamMark(X(x0),X(x0+lam),top-26,lam,P.accent);
        h+=T(X(x0),top-8,'波峰',{size:14,fill:P.ink,anchor:'middle',weight:700});const xt=x0+lam/2<=10?x0+lam/2:x0-lam/2;if(xt>=0)h+=T(X(xt),mid+s.A*120+20,'波谷',{size:14,fill:P.ink,anchor:'middle',weight:700});
        h+=L(X(x0),mid,X(x0),top,{stroke:P.blue,w:2,dash:'4 3'})+L(X(x0)-6,mid,X(x0)+6,mid,{stroke:P.blue,w:2})+T(X(x0)+8,(mid+top)/2+5,'振幅',{size:14,fill:P.blue,weight:700});}
      const ty=Y(s.track);h+=L(X(s.track),mid-s.A*120-14,X(s.track),mid+s.A*120+14,{stroke:P.orange,w:2,dash:'4 5'})+`<circle cx="${X(s.track)}" cy="${ty}" r="10" fill="${P.orange}" stroke="#fff" stroke-width="3"/>`+handle('track',X(s.track),ty,P.orange,16);
    }else{
      for(let r=0;r<5;r++)for(let i=0;i<=50;i++){const x0=i*0.2,px=X(x0)+s.A*18*Math.sin(ph(x0)),tr=Math.abs(x0-s.track)<0.1;h+=`<circle cx="${px.toFixed(1)}" cy="${170+r*40}" r="${tr?6:4.5}" fill="${tr?P.orange:P.accent}" opacity="${tr?1:.55}"/>`;}
      const tx=X(s.track)+s.A*18*Math.sin(ph(s.track));h+=L(X(s.track),140,X(s.track),360,{stroke:P.orange,w:1.5,dash:'4 5'})+handle('track',tx,250,P.orange,16);
      const xc=((lam*(0.5+s.f*s.t))%lam+lam)%lam;
      if(s.terms){for(let x=xc;x<=10;x+=lam){h+=T(X(x),140,'密部',{size:15,anchor:'middle',fill:P.ink,weight:700});if(x+lam/2<=10)h+=T(X(x+lam/2),140,'疏部',{size:15,anchor:'middle',fill:P.muted});}if(xc+lam<=10)h+=lamMark(X(xc),X(xc+lam),395,lam,P.accent);}
    }
    return {svg:h,reads:[['波長 λ',lam.toFixed(2)+' m'],['頻率 f',`${s.f} Hz`],['週期 T',(1/s.f).toFixed(2)+' s'],['波速 v',s.v.toFixed(1)+' m/s']],
      note:`<b>v = f × λ</b>：${s.v} = ${s.f} × ${lam.toFixed(2)}<br>${s.kind==='T'?'<b>橫波</b>：振動方向和傳播方向垂直':'<b>縱波</b>：振動方向和傳播方向平行'}；橘點只在原地振動，波傳的是能量。`};},
  medium(s){
    /* 鐘罩抽氣：聲音（力學波）需要介質，光（非力學波）不需要 */
    const k=s.air/100,cx=300,cy=270;let h='';
    h+=`<rect x="130" y="390" width="340" height="16" rx="4" fill="#b8c4bc"/>`+`<path d="M170 390V230Q170 120 300 120Q430 120 430 230V390" fill="#e6f1f5" fill-opacity=".55" stroke="#8fb3c0" stroke-width="4"/>`;
    h+=L(130,398,70,398,{stroke:'#8a9a92',w:8})+`<rect x="28" y="370" width="46" height="60" rx="8" fill="#8a9a92"/>`+T(51,452,'抽氣機',{size:14,fill:P.muted,anchor:'middle'});
    for(let i=0;i<Math.round(60*k);i++){const x=185+rnd(i)*230,y=140+rnd(i+300)*240;if(Math.hypot((x-300)/130,(y-250)/135)<1)h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${P.blue}" opacity=".45"/>`;}
    const vib=s.ring?Math.sin(s.t*40)*4:0;
    h+=`<path d="M270 300Q270 240 300 240Q330 240 330 300L338 312H262Z" fill="#d9a441" stroke="#a87a25" stroke-width="2"/><circle cx="${300+vib}" cy="318" r="7" fill="#7a5a1c"/>`+L(300,240,300,200,{stroke:'#777',w:3});
    if(s.ring)for(let j=0;j<4;j++){const r=((s.t*90+j*45)%180)+20;if(r<130)h+=`<path d="M${cx+r*Math.cos(-0.6)} ${cy+r*Math.sin(-0.6)}A${r} ${r} 0 0 1 ${cx+r*Math.cos(0.6)} ${cy+r*Math.sin(0.6)}" fill="none" stroke="${P.orange}" stroke-width="3" opacity="${(k*(1-r/180)).toFixed(2)}"/>`;
      const x=440+((s.t*140+j*55)%220);h+=`<path d="M${x} ${cy+30}Q${x+16} ${cy+60} ${x} ${cy+90}" fill="none" stroke="${P.orange}" stroke-width="3" opacity="${(k*0.9).toFixed(2)}"/>`;}
    h+=`<path d="M300 280L700 170" stroke="#e8b84a" stroke-width="3" stroke-dasharray="10 8" opacity=".9"/>`+T(560,190,'光',{size:16,fill:'#b8862a',weight:700});
    h+=`<path d="M690 170Q720 145 750 170Q720 195 690 170" fill="#fff" stroke="${P.ink}" stroke-width="2"/><circle cx="720" cy="170" r="8" fill="${P.ink}"/>`+T(720,215,'眼睛：看得到',{size:15,fill:P.ink,anchor:'middle'});
    h+=`<path d="M705 330Q705 300 730 300Q755 300 755 330Q755 350 735 360Q730 375 718 372" fill="none" stroke="${P.ink}" stroke-width="3"/>`+T(730,400,k>0.6?'耳朵：聽得到':k>0.15?'耳朵：聲音變小':'耳朵：幾乎聽不到',{size:15,fill:P.ink,anchor:'middle'});
    h+=T(300,96,s.air===0?'接近真空':`空氣 ${s.air}%`,{size:18,fill:P.ink,anchor:'middle',weight:700});
    return {svg:h,reads:[['鐘罩內空氣',`${s.air}%`],['聲音（力學波）',!s.ring?'電鈴沒響':k>0.6?'聽得到':k>0.15?'變小':'幾乎聽不到'],['光（非力學波）','看得到']],
      note:'聲音是<b>力學波</b>，要靠介質（空氣）傳播；抽掉空氣就傳不出來。光是<b>非力學波</b>，真空中也能傳播，所以還看得到電鈴。'};}},

/* ===== 3-2 聲音的形成 ===== */
source:{group:1,n:'3-2',name:'聲音的形成',subtitle:'聲音來自物體的快速振動：敲、撥、摩擦、說話，都是讓東西振動起來。',
  q:['用手按住正在響的音叉，聲音為什麼馬上停止？','聲音是物體振動產生的。按住音叉讓振動停止，就不再推動空氣，聲音也跟著停止。'],
  state:{src:'fork',t:0,t0:null,td:null,bow:false,ton:0,toff:-99,eoff:0,slow:true,ball:true},
  controls:[
    {type:'seg',key:'src',label:'發聲方式',options:[['fork','敲擊（音叉）'],['string','撥弦（吉他）'],['bow','摩擦（拉弓）'],['voice','說話（聲帶）']],onChange:s=>{s.t0=null;s.td=null;s.bow=false;s.eoff=0;s.toff=-99;}},
    {type:'buttons',label:'',items:[['🔨 敲一下',s=>{s.t0=s.t;s.td=null;}],['✋ 用手按住',s=>{s.td=s.t;}]],show:s=>s.src==='fork',primary:true},
    {type:'buttons',label:'',items:[['撥一下',s=>{s.t0=s.t;s.td=null;}],['✋ 用手按住',s=>{s.td=s.t;}]],show:s=>s.src==='string',primary:true},
    {type:'toggle',key:'bow',label:'拉弓（弓和弦摩擦）',show:s=>s.src==='bow',onChange:bowSwitch},
    {type:'toggle',key:'bow',label:'發出聲音（氣流通過聲帶）',show:s=>s.src==='voice',onChange:bowSwitch},
    {type:'toggle',key:'ball',label:'在音叉旁放乒乓球',show:s=>s.src==='fork'},
    {type:'toggle',key:'slow',label:'慢動作'}],
  tick:(s,dt)=>{s.t+=dt;},
  render(s){
    const fv=s.slow?2:9,E=tt=>srcEnv(s,tt),disp=tt=>E(tt)*Math.sin(2*Math.PI*fv*tt)*(s.src==='voice'?0.75+0.25*Math.sin(4*Math.PI*fv*tt):1),e=E(s.t),d=disp(s.t);let h='';
    if(s.src==='fork'){
      const off=d*10;h+=`<rect x="${178-off}" y="140" width="16" height="170" rx="6" fill="#9aa7b0"/><rect x="${226+off}" y="140" width="16" height="170" rx="6" fill="#9aa7b0"/><path d="M178 300Q210 340 242 300" fill="none" stroke="#9aa7b0" stroke-width="16"/><rect x="202" y="320" width="16" height="70" rx="4" fill="#9aa7b0"/>`;
      if(s.t0!==null&&s.t-s.t0<0.35)h+=`<g transform="rotate(${-20+60*(s.t-s.t0)} 120 160)"><rect x="60" y="150" width="70" height="10" rx="4" fill="#8a6a45"/><rect x="118" y="135" width="26" height="40" rx="6" fill="#c25b3f"/></g>`;
      if(s.ball){const push=Math.min(1,e*1.4),bx=255+off+push*45*Math.abs(Math.sin(s.t*3));h+=L(bx,40,bx,200,{stroke:'#bbb',w:1.2})+`<circle cx="${bx}" cy="212" r="13" fill="#ffffff" stroke="#d0c8b0" stroke-width="2"/>`;}
    }else if(s.src==='string'||s.src==='bow'){
      h+=`<ellipse cx="210" cy="300" rx="150" ry="70" fill="#d9a46b" opacity=".35"/>`;let p='';for(let x=70;x<=350;x+=5){const u=(x-70)/280;p+=(x===70?'M':'L')+x+' '+(250+d*28*Math.sin(Math.PI*u)).toFixed(1);}
      h+=`<path d="${p}" fill="none" stroke="#6b4b2a" stroke-width="3"/><rect x="62" y="236" width="10" height="28" fill="#555"/><rect x="348" y="236" width="10" height="28" fill="#555"/>`;
      if(s.src==='bow'){const bx=210+(s.bow?70*Math.sin(s.t*1.6):0);h+=`<rect x="${bx-120}" y="218" width="240" height="8" rx="3" fill="#7a5230"/>`+L(bx-120,214,bx+120,214,{stroke:'#eee7d6',w:3});}
      else if(s.t0!==null&&s.t-s.t0<0.3)h+=`<circle cx="210" cy="${250-24+(s.t-s.t0)*60}" r="12" fill="#f0c9a6" stroke="#b98d6a"/>`;
    }else{
      const open=8+(s.bow?10*Math.abs(Math.sin(2*Math.PI*fv*s.t)):0);
      h+=`<path d="M150 80V420M270 80V420" stroke="#d9a0a0" stroke-width="10" fill="none"/><ellipse cx="${210-open/2-22}" cy="250" rx="26" ry="12" fill="#c46a6a"/><ellipse cx="${210+open/2+22}" cy="250" rx="26" ry="12" fill="#c46a6a"/>`+T(210,222,'聲帶',{size:15,fill:P.ink,anchor:'middle'});
      if(s.bow)for(let j=0;j<3;j++){const y=420-((s.t*120+j*50)%160);h+=L(210,y,210,y-24,{stroke:P.blue,w:3,arrow:true,op:.7});}
      h+=T(210,446,'↑ 從肺部來的氣流',{size:14,fill:P.blue,anchor:'middle'});
    }
    const cv=s.slow?160:480;for(let r=0;r<5;r++)for(let i=0;i<34;i++){const x0=390+i*14,tt=s.t-(x0-390)/cv,dx=10*disp(tt);h+=`<circle cx="${(x0+dx).toFixed(1)}" cy="${150+r*30}" r="3.6" fill="${P.accent}" opacity=".55"/>`;}
    h+=T(620,128,'空氣被推動 → 疏密波',{size:14,fill:P.muted,anchor:'middle'});
    let g='';for(let i=0;i<=300;i++){const tt=s.t-3+i/100;g+=(i?'L':'M')+(390+i*1.57).toFixed(1)+' '+(410-28*disp(tt)).toFixed(1);}
    h+=`<rect x="384" y="368" width="484" height="86" rx="10" fill="#fff" stroke="#e1ddd2"/>`+L(390,410,862,410,{stroke:'#e6e1d5',w:1})+`<path d="${g}" fill="none" stroke="${P.orange}" stroke-width="2"/>`+T(392,386,'振動（位移 − 時間）',{size:13,fill:P.muted});
    const on=e>0.03,name={fork:'敲擊',string:'撥弦',bow:'摩擦',voice:'聲帶振動'}[s.src];
    h+=T(620,90,on?'物體在振動 → 有聲音':'沒有振動 → 沒有聲音',{size:20,fill:on?P.accent:P.muted,anchor:'middle',weight:700});
    return {svg:h,reads:[['發聲方式',name],['物體振動',on?'有':'沒有'],['聲音',on?'有':'沒有']],
      note:{fork:'敲擊讓音叉<b>快速振動</b>，推動空氣形成疏密波。用手按住，振動停止，聲音也停止。',string:'撥弦讓弦<b>快速振動</b>；振動越來越小，聲音也越來越小。',bow:'弓和弦<b>摩擦</b>，一下黏住、一下滑開，讓弦持續振動。',voice:'氣流通過聲帶，讓聲帶<b>快速振動</b>而發聲。'}[s.src]};}},

/* ===== 3-3 多變的聲音 ===== */
sound:{group:1,n:'3-3',name:'多變的聲音',subtitle:'響度、音調、音色：分別由振幅、頻率、波形決定。',
  q:['兩個聲音的波形週期相同、振幅不同，它們哪裡不一樣？','週期相同 → 頻率相同 → 音調相同；振幅不同 → 響度不同。'],
  state:{f:400,A:6,timbre:'pure',t:0,ref:null,audio:false},
  controls:[
    {type:'range',key:'f',label:'頻率 → 音調',min:100,max:1000,step:10,unit:' Hz'},
    {type:'range',key:'A',label:'振幅 → 響度',min:1,max:10,step:1,unit:' 格'},
    {type:'seg',key:'timbre',label:'波形 → 音色',options:Object.entries(TIMBRE).map(([k,v])=>[k,v[0]])},
    {type:'buttons',label:'比較兩個聲音',items:[['📌 固定為比較波形',s=>{s.ref={f:s.f,A:s.A,timbre:s.timbre};}],['清除',s=>{s.ref=null;}]]},
    {type:'toggle',key:'audio',label:'🔊 真的播放聲音（注意音量）'}],
  tick:(s,dt)=>{s.t+=dt;},
  render(s){
    audioSync(s.audio,s.f,s.A,s.timbre);
    const X=ms=>80+ms*76,wave=(f,A,tb,c,w,dash)=>{const hs=TIMBRE[tb][1],fn=x=>hs.reduce((a,cc,i)=>a+cc*Math.sin((i+1)*x),0);let norm=0;for(let i=0;i<200;i++)norm=Math.max(norm,Math.abs(fn(i/200*2*Math.PI)));let d='';for(let i=0;i<=600;i++){const ms=i/60;d+=(i?'L':'M')+X(ms).toFixed(1)+' '+(180-fn(2*Math.PI*f*ms/1000)*A*10/norm).toFixed(1);}return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"${dash?' stroke-dasharray="6 5"':''}/>`;};
    let h=`<rect x="70" y="36" width="780" height="280" rx="12" fill="#fff" stroke="#e1ddd2"/>`+L(80,180,840,180,{stroke:'#d8d3c6',w:1});
    for(let ms=0;ms<=10;ms+=2)h+=L(X(ms),44,X(ms),308,{stroke:'#efebe2',w:1})+T(X(ms),336,ms,{size:13,fill:P.muted,anchor:'middle'});
    h+=T(848,336,'ms',{size:13,fill:P.muted});
    if(s.ref)h+=wave(s.ref.f,s.ref.A,s.ref.timbre,'#b9b3a5',2.5,true)+T(842,304,'灰色虛線：比較波形',{size:13,fill:P.muted,anchor:'end'});
    h+=wave(s.f,s.A,s.timbre,P.accent,3);
    const per=1000/s.f;if(per<=10)h+=lamMark(X(0.25*per),X(1.25*per),66,null,P.orange,`週期 ${per.toFixed(2)} ms`);
    for(let r=0;r<3;r++)for(let i=0;i<51;i++){const x=80+i*15+s.A*1.1*Math.sin(i*s.f*0.00074*2-2*Math.PI*(s.f/1000)*(reduceMotion?0:s.t));h+=`<circle cx="${x.toFixed(1)}" cy="${380+r*24}" r="3.6" fill="${P.accent}" opacity=".5"/>`;}
    h+=T(450,470,'空氣粒子疏密（放慢 1000 倍）',{size:13,fill:P.muted,anchor:'middle'});
    const pitch=s.f<300?'低':s.f<650?'中':'高',cmp=(a,b,hi,lo)=>a>b?hi:a<b?lo:'相同';
    const reads=[['音調',`${s.f} Hz（${pitch}）`],['響度',`振幅 ${s.A} 格`],['音色',TIMBRE[s.timbre][0]]];
    if(s.ref)reads.push(['和比較波形相比',`音調${cmp(s.f,s.ref.f,'較高','較低')}・響度${cmp(s.A,s.ref.A,'較大','較小')}・音色${s.timbre===s.ref.timbre?'相同':'不同'}`]);
    return {svg:h,reads,note:'頻率越高 → <b>音調</b>越高（週期越短）<br>振幅越大 → <b>響度</b>越大<br>波形不同 → <b>音色</b>不同'};}},

/* ===== 3-4 聲音的傳播與應用 ===== */
echo:{group:1,n:'3-4',name:'聲音的傳播與應用',subtitle:'聲音在不同介質中速度不同；利用回聲可以測距離、測海深。',
  q:['人離牆 51 m，聲速 340 m/s，回聲往返要多久？','聲音走 102 m，時間 = 102 ÷ 340 = 0.30 s。距離 = 聲速 × 往返時間 ÷ 2。'],
  state:{mode:'echo',d:51,medium:'air',temp:15,echo:null,t:0,sx:420,sonar:null,lg:3},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['echo','回聲測距'],['sonar','聲納測海深'],['hear','聽得到嗎？']],onChange:s=>{s.echo=null;s.sonar=null;}},
    {type:'range',key:'d',label:'到牆的距離',min:5,max:500,step:1,unit:' m',show:s=>s.mode==='echo'},
    {type:'seg',key:'medium',label:'介質',options:Object.entries(SOUND_SPEED),show:s=>s.mode==='echo'},
    {type:'range',key:'temp',label:'氣溫',min:0,max:40,step:1,unit:' °C',show:s=>s.mode==='echo'&&s.medium==='air'},
    {type:'buttons',label:'',items:[['📢 發出聲音',s=>{s.echo=0;}]],show:s=>s.mode==='echo',primary:true},
    {type:'range',key:'sx',label:'船的位置',min:60,max:840,step:5,fmt:()=>'',show:s=>s.mode==='sonar'},
    {type:'buttons',label:'',items:[['📡 發出超聲波',s=>{s.sonar=0;}]],show:s=>s.mode==='sonar',primary:true},
    {type:'range',key:'lg',label:'聲音頻率',min:0,max:5.3,step:0.01,fmt:s=>fmtHz(Math.pow(10,s.lg)),show:s=>s.mode==='hear'}],
  tick:(s,dt)=>{s.t+=dt;if(s.echo!==null&&s.echo<2)s.echo=Math.min(2,s.echo+dt);if(s.sonar!==null&&s.sonar<2.4)s.sonar=Math.min(2.4,s.sonar+dt);},
  drag:{ship:(p,s)=>{s.sx=snap('sx',p.x);s.sonar=null;},hz:(p,s)=>{s.lg=snap('lg',(p.x-80)/780*5.3);}},
  render(s){
    let h='';
    if(s.mode==='sonar'){
      const depth=x=>2300+1300*Math.sin(x/130)+500*Math.sin(x/47+1),SY=x=>120+depth(x)/4500*340,dep=depth(s.sx),t=2*dep/1500;
      h+=`<rect x="10" y="10" width="880" height="110" fill="#e9f3f8"/><rect x="10" y="120" width="880" height="372" fill="#bcd9e6"/>`;
      let sb='M10 492';for(let x=10;x<=890;x+=10)sb+=`L${x} ${SY(x).toFixed(1)}`;h+=`<path d="${sb}L890 492Z" fill="#c9b48c"/>`;
      h+=`<g data-drag="ship" class="handle-body"><path d="M${s.sx-50} 104L${s.sx+50} 104L${s.sx+36} 124L${s.sx-36} 124Z" fill="#5d7088"/><rect x="${s.sx-14}" y="84" width="28" height="20" fill="#8aa0b8"/></g>`+handle('ship',s.sx,104,P.orange,10);
      if(s.sonar!==null){const fr=s.sonar/2.4,y=fr<0.5?124+(SY(s.sx)-124)*fr*2:SY(s.sx)-(SY(s.sx)-124)*(fr-0.5)*2,up=fr>=0.5;
        if(fr<1)for(let k=0;k<3;k++){const yy=y+(up?k*12:-k*12),w=30-k*6;h+=`<path d="M${s.sx-w} ${yy}Q${s.sx} ${yy+(up?-12:12)} ${s.sx+w} ${yy}" fill="none" stroke="${P.orange}" stroke-width="${4-k}" opacity="${1-k*.3}"/>`;}
        else h+=L(s.sx,124,s.sx,SY(s.sx),{stroke:P.orange,w:1.5,dash:'5 5'})+T(s.sx+12,(124+SY(s.sx))/2,`${num(dep,0)} m`,{size:17,fill:P.ink,weight:700});}
      h+=T(30,40,'聲納：船底發出超聲波，量回聲時間算海深',{size:16,fill:P.ink,weight:600});
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['水中聲速','1500 m/s'],['回聲時間',s.sonar!==null&&s.sonar>=2.4?`${t.toFixed(2)} s`:'按「發出超聲波」'],['海深',s.sonar!==null&&s.sonar>=2.4?`${num(dep,0)} m`:'—']],
        note:`<b>海深 = 聲速 × 時間 ÷ 2</b>${s.sonar!==null&&s.sonar>=2.4?` = 1500 × ${t.toFixed(2)} ÷ 2 = ${num(dep,0)} m`:''}<br>聲納用<b>超聲波</b>（高於 20000 Hz），方向性好、人耳聽不到。拖動船換位置。`};
    }
    if(s.mode==='hear'){
      const X=lg=>80+lg/5.3*780,hz=Math.pow(10,s.lg),bands=[[0,Math.log10(20),'#efe7f6','次聲波'],[Math.log10(20),Math.log10(20000),'#e2f0ec','可聽聲（人）'],[Math.log10(20000),5.3,'#fdf0e1','超聲波']];
      for(const[a,b,c,t]of bands)h+=`<rect x="${X(a)}" y="50" width="${X(b)-X(a)}" height="370" fill="${c}"/>`+T((X(a)+X(b))/2,72,t,{size:15,fill:P.ink,anchor:'middle',weight:700});
      HEARING.forEach(([n,lo,hi],i)=>{const y=110+i*50,on=hz>=lo&&hz<=hi;h+=T(70,y+7,n,{size:16,fill:P.ink,anchor:'end',weight:on?700:400})+`<rect x="${X(Math.log10(lo))}" y="${y-9}" width="${X(Math.log10(hi))-X(Math.log10(lo))}" height="18" rx="9" fill="${on?P.accent:'#cfc9ba'}"/>`;});
      for(let e=0;e<=5;e++)h+=L(X(e),420,X(e),428,{stroke:P.muted})+T(X(e),448,fmtHz(Math.pow(10,e)),{size:13,fill:P.muted,anchor:'middle'});
      h+=L(X(s.lg),50,X(s.lg),420,{stroke:P.orange,w:3})+handle('hz',X(s.lg),40,P.orange,11);
      const who=HEARING.filter(([,lo,hi])=>hz>=lo&&hz<=hi).map(a=>a[0]),kind=hz<20?'次聲波':hz>20000?'超聲波':'可聽聲';
      return {svg:h,reads:[['頻率',fmtHz(hz)],['種類',kind],['聽得到的',who.length?who.join('、'):'都聽不到']],
        note:'人耳約可聽 <b>20～20000 Hz</b>；低於 20 Hz 是<b>次聲波</b>，高於 20000 Hz 是<b>超聲波</b>。動物的數值為約略範圍。'};
    }
    const v=s.medium==='air'?331+0.6*s.temp:s.medium==='water'?1500:5200,t=2*s.d/v,ok=t>=0.1;
    h+=T(60,60,`介質：${SOUND_SPEED[s.medium]}${s.medium==='air'?`（${s.temp} °C）`:''}　聲速 ${num(v,0)} m/s`,{size:17,fill:P.ink,weight:600});
    h+=L(60,400,840,400,{stroke:'#cfc9ba',w:2})+`<rect x="790" y="170" width="28" height="230" rx="3" fill="#b8c4bc"/>`;
    h+=`<circle cx="130" cy="290" r="20" fill="${P.accent}"/><path d="M130 310V360M130 330L104 346M130 330L156 346M130 360L110 398M130 360L150 398" stroke="${P.accent}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
    h+=L(160,440,790,440,{stroke:P.muted,w:1.5})+L(160,432,160,448,{stroke:P.muted})+L(790,432,790,448,{stroke:P.muted})+T(475,470,`${s.d} m`,{size:17,anchor:'middle',fill:P.ink});
    if(s.echo!==null){const fr=s.echo/2,out=fr<0.5,x=out?165+fr*2*620:785-(fr-0.5)*2*620;
      if(fr<1)for(let k=0;k<3;k++){const xx=x+(out?-k*16:k*16),c=out?1:-1;h+=`<path d="M${xx} ${290-40+k*4}Q${xx+c*22} 290 ${xx} ${290+40-k*4}" fill="none" stroke="${P.orange}" stroke-width="${4-k}" opacity="${1-k*.28}"/>`;}
      h+=T(475,240,fr<0.5?'去程 →':fr<1?'← 回程':ok?'聽到回聲！':'回聲和原聲混在一起',{size:22,anchor:'middle',fill:P.orange,weight:700});}
    return {svg:h,reads:[['聲速',`${num(v,0)} m/s`],['往返路程',`${2*s.d} m`],['回聲時間',`${t.toFixed(3)} s`],['能分辨回聲？',ok?'可以':'不行（< 0.1 s）']],
      note:`<b>距離 = 聲速 × 時間 ÷ 2</b><br>${num(v,0)} × ${t.toFixed(3)} ÷ 2 = ${s.d} m　（聲速：固體 ＞ 液體 ＞ 氣體）`};}},

/* ===== 07 影子 ===== */
shadow:{group:2,n:'4-1',keep:['mode','view','sv'],name:'光的傳播：影子、針孔、光速',subtitle:'光沿直線前進：用影子和針孔成像來證明；再比比看光在不同物質中跑多快。',dark:true,
  q(s){if(s.mode==='speed')return this.speedQ[s.sv];if(s.mode!=='pinhole')return ['物體靠近點光源，屏幕上的影子會變大還是變小？','會變大。屏幕位置不變時，光源到物體的距離 a 減少，影子的放大倍數 D/a 增加。'];
    return s.view==='3d'?pinholeExample(s):s.view==='sim'?simExample(s):['針孔變大，紙屏上的像會怎樣？','<b>更亮，但更模糊</b>。孔變大，物體上每一點的光穿過針孔後，在紙屏上變成較大的光點，光點互相重疊，像就模糊了；進來的光變多，所以更亮。<br>像的<b>大小</b>由物高、物距、像距決定（像高 ÷ 物高 = 像距 ÷ 物距），不會因為孔變大而改變。孔很小時，像的形狀也和孔的形狀無關。'];},
  speedQ:{race:['光在哪一種物質中跑得最快？光速和什麼有關？','在<b>真空</b>中最快，約 3 × 10⁸ m/s；進入空氣、水、玻璃、鑽石會越來越慢。所以光速和光經過的<b>物質（介質）</b>有關。<br>聲音剛好相反：聲音不能在真空中傳播，在固體中反而最快（3-4）。'],
    thunder:['看到閃電後 3 秒才聽到雷聲，打雷的地方大約多遠？','約 1 公里。閃電和雷聲同時發生，光幾乎立刻到達，所以 3 秒是聲音走的時間：340 m/s × 3 s ≈ 1020 m。'],
    sun:['如果太陽突然熄滅，地球上的人多久後才會發現？','約 <b>8 分 20 秒</b>後。太陽光要走 1.5 × 10¹¹ m ÷ 3 × 10⁸ m/s = 500 秒才到地球；在這之前看到的，都是早已在路上的光。']},
  qAction(s,v){const[k,x]=v.split(':');if(k==='exS1'||k==='exS2'){s[k]=x;s.exSChk=false;return;}if(k==='scheck'){s.exSChk=true;return;}if(k==='ssol'){s.exSSol=!s.exSSol;return;}if(k==='sview'){s.tri3='pinhole';s.pd=10;s.ph3=6;s.pD=15;s.turnT=0;return;}if(k==='a'||k==='b'){s[k==='a'?'exA':'exB']=x;s.exChk=false;}else if(k==='check')s.exChk=true;else if(k==='sol')s.exSol=!s.exSol;
    else if(k==='view'){s.obj3='F';s.spin=false;s.insets=true;if(x==='A'){s.yaw=0;s.pitch=6;}else{s.yaw=180;s.pitch=6;}}},
  state:{on:true,beam:'full',prog:0,mode:'shadow',src:'point',a:60,D:200,h:40,R:15,ang:-16,edges:true,pa:80,pb:60,ph:40,hole:1,tri:true,view:'2d',tri3:'define',k:2,overlap:false,stretch:'all',animK:null,pd:4,ph3:3,pD:8,turn:0,turnT:0,exS1:null,exS2:null,exSChk:false,exSSol:false,yaw:50,pitch:18,spin:false,rays3:true,insets:true,obj3:'man',exA:null,exB:null,exChk:false,exSol:false,sv:'race',st:null,km:1.7},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['shadow','影子'],['pinhole','針孔成像'],['speed','光速']],onChange:s=>{replay(s);s.st=null;}},
    {type:'seg',key:'view',label:'視角',options:[['2d','剖面圖'],['3d','立體 360°'],['sim','相似三角形']],show:s=>s.mode==='pinhole'},
    {...LAMP,show:s=>s.mode==='shadow'||s.mode==='pinhole'&&s.view!=='sim'},
    {...BEAM,show:s=>s.mode==='shadow'||s.mode==='pinhole'&&s.view==='2d'},
    {type:'seg',key:'sv',label:'比一比',options:[['race','不同物質中的光速'],['thunder','閃電與雷聲'],['sun','太陽光到地球']],show:s=>s.mode==='speed',onChange:s=>{s.st=null;}},
    {type:'range',key:'km',label:'打雷的地方離你',min:0.3,max:5,step:0.1,unit:' km',show:s=>s.mode==='speed'&&s.sv==='thunder'},
    {type:'buttons',label:'',items:[['▶ 出發',s=>{s.st=0;}]],show:s=>s.mode==='speed'&&s.sv!=='thunder',primary:true},
    {type:'buttons',label:'',items:[['⚡ 打雷',s=>{s.st=0;}]],show:s=>s.mode==='speed'&&s.sv==='thunder',primary:true},
    {type:'seg',key:'src',label:'光源',options:[['point','點光源'],['area','有大小的光源']],onChange:replay,show:s=>s.mode==='shadow'},
    {type:'range',key:'R',label:'光源大小',min:4,max:30,step:1,unit:' cm',show:s=>s.mode==='shadow'&&s.src==='area'},
    {type:'range',key:'a',label:'光源 → 物體 a',min:20,max:150,step:1,unit:' cm',show:s=>s.mode==='shadow'},
    {type:'range',key:'D',label:'光源 → 屏幕 D',min:165,max:300,step:1,unit:' cm',show:s=>s.mode==='shadow'},
    {type:'range',key:'h',label:'物體高度 h',min:10,max:60,step:1,unit:' cm',show:s=>s.mode==='shadow'},
    {type:'toggle',key:'edges',label:'標出邊界光線',show:s=>s.mode==='shadow'&&s.beam==='full'},
    {type:'seg',key:'tri3',label:'相似三角形',options:[['define','什麼是相似'],['pinhole','用在針孔成像']],show:s=>s.mode==='pinhole'&&s.view==='sim'},
    {type:'seg',key:'stretch',label:'怎麼放大',options:[['all','每一邊都放大'],['one','只放大底邊']],show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='define'},
    {type:'range',key:'k',label:'放大倍數',min:0.5,max:2.5,step:0.5,unit:' 倍',show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='define'},
    {type:'buttons',label:'',items:[['▶ 從小變大',s=>{s.animK=0;}]],show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='define',primary:true},
    {type:'toggle',key:'overlap',label:'疊在一起看',show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='define'},
    {type:'range',key:'pd',label:'物距',min:2,max:10,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='pinhole'},
    {type:'range',key:'ph3',label:'物高',min:1,max:6,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='pinhole'},
    {type:'range',key:'pD',label:'像距',min:2,max:15,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='pinhole'},
    {type:'buttons',label:'例子',items:[['3-4-5 → 6-8-10',s=>{s.pd=4;s.ph3=3;s.pD=8;s.turnT=0;}],['講義例題',s=>{s.pd=10;s.ph3=6;s.pD=15;s.turnT=0;}],['像比物小',s=>{s.pd=8;s.ph3=4;s.pD=4;s.turnT=0;}]],show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='pinhole'},
    {type:'buttons',label:'',items:[['🔄 轉過來疊疊看',s=>{s.turnT=s.turnT>0.5?0:1;}]],show:s=>s.mode==='pinhole'&&s.view==='sim'&&s.tri3==='pinhole',primary:true},
    {type:'seg',key:'obj3',label:'物體',options:[['man','立體小人'],['F','字母 F']],show:s=>s.mode==='pinhole'&&s.view==='3d'},
    {type:'buttons',label:'換個角度看',items:[['側面',s=>{s.yaw=90;s.pitch=12;s.spin=false;}],['從紙屏後面',s=>{s.yaw=0;s.pitch=6;s.spin=false;}],['從物體後面',s=>{s.yaw=180;s.pitch=6;s.spin=false;}],['斜上方',s=>{s.yaw=50;s.pitch=18;s.spin=false;}]],show:s=>s.mode==='pinhole'&&s.view==='3d'},
    {type:'toggle',key:'spin',label:'自動旋轉',show:s=>s.mode==='pinhole'&&s.view==='3d'},
    {type:'toggle',key:'rays3',label:'顯示光線',show:s=>s.mode==='pinhole'&&s.view==='3d'},
    {type:'toggle',key:'insets',label:'對照：直接看物體 vs 看紙屏上的像',show:s=>s.mode==='pinhole'&&s.view==='3d'},
    {type:'range',key:'pa',label:'物體 → 針孔（物距）',min:30,max:150,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view!=='sim'},
    {type:'range',key:'pb',label:'針孔 → 紙屏（像距）',min:20,max:150,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view!=='sim'},
    {type:'range',key:'ph',label:'物高',min:10,max:50,step:1,unit:' cm',show:s=>s.mode==='pinhole'&&s.view==='2d'},
    {type:'range',key:'hole',label:'針孔大小',min:0.5,max:8,step:0.5,unit:' cm',show:s=>s.mode==='pinhole'&&s.view==='2d'},
    {type:'toggle',key:'tri',label:'顯示相似三角形',show:s=>s.mode==='pinhole'&&s.view==='2d'}],
  tick:(s,dt)=>{LIGHT_TICK(s,dt);if(s.mode==='speed'&&s.st!==null&&s.st<(s.sv==='thunder'?s.km/0.34+1.2:6.5))s.st+=dt;if(s.spin&&s.mode==='pinhole'&&s.view==='3d')s.yaw=(s.yaw+dt*25)%360;if(s.animK!==null){s.animK+=dt;if(s.animK>1.6)s.animK=null;}s.turn+=(s.turnT-s.turn)*Math.min(1,dt*2.5);},
  drag:{obj:(p,s)=>{s.a=snap('a',(p.x-100)/(700/300));},top:(p,s)=>{s.h=snap('h',2*(250-p.y)/1.6);},screen:(p,s)=>{s.D=snap('D',(p.x-100)/(700/300));},aim:(p,s)=>{s.ang=clamp(deg(Math.atan2(p.y-250,p.x-100)),-40,40);},pobj:(p,s)=>{s.pa=snap('pa',(450-p.x)/2.5);},pscr:(p,s)=>{s.pb=snap('pb',(p.x-450)/2.5);},orbit:(p,s,c)=>{s.yaw=c.s0.yaw-(p.x-c.p0.x)*0.45;s.pitch=clamp(c.s0.pitch+(p.y-c.p0.y)*0.3,-60,75);s.spin=false;}},
  similar(s){
    /* 相似三角形：三種邊固定三種顏色（底藍、高綠、斜邊橘），同色＝互相對應 */
    const CB='#7fb3ff',CH='#9be38b',CS='#ffb86b',CA='#ff92bc',fmt=v=>Math.abs(v-Math.round(v))<1e-6?String(Math.round(v)):v.toFixed(1);
    const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const lab=(x,y,t,c,anchor='middle',size=17)=>T(x,y,t,{size,fill:c,anchor,weight:700});
    const sideL=(a,b,c,w=4)=>L(a[0],a[1],b[0],b[1],{stroke:c,w});
    /* 斜邊每 1 單位畫一個刻度，讓斜邊也能「數」 */
    const ticks=(a,b,units,u,c)=>{if(units>24)return '';const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;let g='';for(let i=1;i<units-1e-6;i++){const t=i*u/len,px=a[0]+dx*t,py=a[1]+dy*t;g+=L(px-nx*6,py-ny*6,px+nx*6,py+ny*6,{stroke:c,w:2});}return g;};
    const sq=(c,sx,sy)=>`<path d="M${c[0]+sx*14} ${c[1]}V${c[1]+sy*14}H${c[0]}" fill="none" stroke="${D.ink}" stroke-width="2"/>`;
    const arcAt=(c,r,a0,a1,col)=>{const p0=[c[0]+r*Math.cos(rad(a0)),c[1]-r*Math.sin(rad(a0))],p1=[c[0]+r*Math.cos(rad(a1)),c[1]-r*Math.sin(rad(a1))],big=Math.abs(a1-a0)>180?1:0;return `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}A${r} ${r} 0 ${big} 0 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${col}" stroke-width="3"/>`;};
    let h='';
    if(s.tri3==='define'){
      const kd=s.animK!==null?1+(s.k-1)*ease(clamp(s.animK/1.5,0,1)):s.k,kx=kd,ky=s.stretch==='all'?kd:1,u=40,y0=410,x0=80,X1=290;
      for(let x=x0-u;x<=X1+4*2.5*u+u;x+=u)h+=L(x,y0-3*2.5*u-u,x,y0+u*0.4,{stroke:'#ffffff10',w:1});for(let y=y0;y>=y0-3*2.5*u-u;y-=u)h+=L(x0-u,y,X1+4*2.5*u+u,y,{stroke:'#ffffff10',w:1});
      const draw=(ox,sx,sy,fill,showLab)=>{const P=[ox,y0],Q=[ox+4*sx*u,y0],R=[ox,y0-3*sy*u],hyp=Math.hypot(4*sx,3*sy),aB=deg(Math.atan2(3*sy,4*sx)),aT=90-aB;
        let g=`<polygon points="${P} ${Q} ${R}" fill="${fill}" fill-opacity=".14"/>`+sideL(P,Q,CB)+sideL(P,R,CH)+sideL(R,Q,CS)+ticks(R,Q,hyp,u,CS)+sq(P,1,-1)+arcAt(Q,32,180-aB,180,CA)+arcAt(R,30,270,270+aT,'#c6a6ff');
        if(showLab)g+=lab((P[0]+Q[0])/2,y0+26,fmt(4*sx),CB)+lab(P[0]-12,(P[1]+R[1])/2+6,fmt(3*sy),CH,'end')+lab((Q[0]+R[0])/2+14,(Q[1]+R[1])/2-10,fmt(hyp),CS,'start')
          +T(Q[0]-48,y0-8,`${aB.toFixed(1)}°`,{size:14,fill:CA,anchor:'end'})+T(R[0]+10,R[1]+44,`${aT.toFixed(1)}°`,{size:14,fill:'#c6a6ff'});
        return g;};
      h+=draw(x0,1,1,D.object,true)+draw(X1,kx,ky,D.image,true);
      if(s.overlap)h+=`<polygon points="${X1},${y0} ${X1+4*u},${y0} ${X1},${y0-3*u}" fill="${D.object}" fill-opacity=".45" stroke="${D.object}" stroke-width="2.5"/>`+T(X1+6,y0-3*u-8,'小三角形',{size:13,fill:D.object});
      h+=T(x0+2*u,y0-3*u-50,'原來的三角形',{size:16,fill:D.object,anchor:'middle'})+T(X1+2*kx*u,y0-3*ky*u-50,s.stretch==='all'?`每一邊都 × ${fmt(kd)}`:`只有底邊 × ${fmt(kd)}`,{size:16,fill:D.image,anchor:'middle',weight:700});
      const same=s.stretch==='all'||Math.abs(kd-1)<1e-6,hyp2=Math.hypot(4*kx,3*ky);
      h+=T(450,470,same?'同顏色的角一樣大 → 形狀相同 → 相似':'角度變了 → 形狀不同 → 不相似',{size:16,fill:same?D.ink:'#ff8a7a',anchor:'middle',weight:700});
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['原來','底 4、高 3、斜邊 5'],['新的三角形',`底 ${fmt(4*kx)}、高 ${fmt(3*ky)}、斜邊 ${fmt(hyp2)}`],['各邊放大的倍數',`${fmt(kx)}、${fmt(ky)}、${fmt(hyp2/5)}`],['相似嗎？',same?'相似（倍數都一樣）':'不相似（倍數不一樣）']],
        note:same?'<b>相似</b>：每一邊都放大<b>同一個倍數</b>，形狀不變（三個角都一樣）。斜邊上的刻度可以數：5 格變成 '+fmt(hyp2)+' 格。':'只拉長底邊：三邊的倍數不一樣，角度跟著改變，形狀變了，所以<b>不相似</b>。'};
    }
    /* 用在針孔成像：物側三角形（物距、物高、光線）與像側三角形 */
    const d=s.pd,hh=s.ph3,Dd=s.pD,k=Dd/d,H=hh*k,Lo=Math.hypot(d,hh),Li=Lo*k;
    const u=Math.min(44,800/(d+Dd+1.5),360/(hh+H)),objH=hh*u,imgH=H*u,cy=50+objH+Math.max(0,(410-objH-imgH)/2),hx=450-(Dd-d)*u/2,ox=hx-d*u,ix=hx+Dd*u;
    for(let x=hx;x>=ox-u;x-=u)h+=L(x,cy-objH-u,x,cy+imgH+u,{stroke:'#ffffff10',w:1});for(let x=hx;x<=ix+u;x+=u)h+=L(x,cy-objH-u,x,cy+imgH+u,{stroke:'#ffffff10',w:1});
    for(let y=cy;y>=cy-objH-u;y-=u)h+=L(ox-u,y,ix+u,y,{stroke:'#ffffff10',w:1});for(let y=cy;y<=cy+imgH+u;y+=u)h+=L(ox-u,y,ix+u,y,{stroke:'#ffffff10',w:1});
    h+=L(20,cy,880,cy,{stroke:D.muted,w:1.2,dash:true,op:.6})+L(hx,Math.max(34,cy-objH-u*1.5),hx,cy-6,{stroke:'#8aa0b8',w:6})+L(hx,cy+6,hx,cy+imgH+u*1.5,{stroke:'#8aa0b8',w:6})+T(hx,Math.max(26,cy-objH-u*1.5-8),'針孔',{size:14,fill:D.muted,anchor:'middle'});
    const O=[hx,cy],oB=[ox,cy],oT=[ox,cy-objH],iB=[ix,cy],iT=[ix,cy+imgH];
    h+=`<polygon points="${O} ${oB} ${oT}" fill="${D.object}" fill-opacity=".14"/>`+sideL(O,oB,CB)+sideL(oB,oT,CH)+sideL(oT,O,CS)+ticks(O,oT,Lo,u,CS)+sq(oB,1,-1);
    const tw=clamp(s.turn,0,1),sc=1+(1/k-1)*tw,imgTri=`<polygon points="${O} ${iB} ${iT}" fill="${D.image}" fill-opacity=".16"/>`+sideL(O,iB,CB)+sideL(iB,iT,CH)+sideL(iT,O,CS)+ticks(O,iT,Li,u,CS)+sq(iB,-1,1);
    h+=`<g transform="translate(${hx} ${cy}) rotate(${180*tw}) scale(${sc}) translate(${-hx} ${-cy})">${imgTri}</g>`;
    const aO=deg(Math.atan2(hh,d));
    h+=vArrow(ox,cy,cy-objH,D.object);
    if(tw<0.02){h+=arcAt(O,Math.min(44,d*u*0.6),180-aO,180,CA)+arcAt(O,Math.min(44,d*u*0.6),-aO,0,CA)+T(hx+50,cy+(imgH>40?34:-12),'對頂角相等',{size:14,fill:CA});
      h+=vArrow(ix,cy,cy+imgH,D.image)+L(ox,cy-objH,ix,cy+imgH,{stroke:'#ffe8a5',w:1.5,op:.5});
      h+=lab((ox+hx)/2,cy+24,`物距 ${d}`,CB)+lab(ox-12,cy-objH/2+6,`物高 ${hh}`,CH,'end')+lab((ox+hx)/2+8,cy-objH/2-8,fmt(Lo),CS,'start');
      h+=lab((ix+hx)/2,cy-12,`像距 ${Dd}`,CB)+lab(ix+12,cy+imgH/2+6,`像高 ${fmt(H)}`,CH,'start')+lab((ix+hx)/2-12,cy+imgH/2+22,fmt(Li),CS,'end');}
    else if(tw>0.98)h+=T(450,474,'像那邊的三角形轉 180°、縮小後，和物體這邊完全疊合 → 相似！',{size:16,fill:D.ink,anchor:'middle',weight:700});
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['物側三角形',`底 ${d}、高 ${hh}、斜邊 ${fmt(Lo)}`],['像側三角形',`底 ${Dd}、高 ${fmt(H)}、斜邊 ${fmt(Li)}`],['像距是物距的',`${fmt(k)} 倍`],['所以像高',`${hh} × ${fmt(k)} = ${fmt(H)}`]],
      note:`針孔兩邊的三角形，在針孔處的角是<b>對頂角</b>、另一個角都是直角 → 形狀相同（相似）。像距是物距的 <b>${fmt(k)} 倍</b>，像高就是物高的 ${fmt(k)} 倍。`};},
  pinhole3d(s){
    /* 簡易 3D：x 為光前進方向（物體在 −x，針孔在原點，紙屏在 +x），y 向左，z 向上 */
    const d=s.pa,Dd=s.pb,k0=Dd/d,yaw=rad(s.yaw),pit=rad(s.pitch),tgt=[(Dd-d)/2,0,0],R=Math.max(250,(d+Dd)*1.35),F=900,cx=450,cy=s.insets?180:250;
    const cam=[tgt[0]+R*Math.cos(pit)*Math.cos(yaw),tgt[1]+R*Math.cos(pit)*Math.sin(yaw),tgt[2]+R*Math.sin(pit)];
    const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a);return[a[0]/l,a[1]/l,a[2]/l];};
    const fw=nrm(sub(tgt,cam)),rt=nrm(crs(fw,[0,0,1])),up=crs(rt,fw);
    const pr=P=>{const v=sub(P,cam),z=Math.max(1,dot(v,fw));return[cx+F*dot(v,rt)/z,cy-F*dot(v,up)/z,z];};
    const poly=(pts,fill,op=1,stroke='#00000033')=>{const q=pts.map(pr);return{z:q.reduce((a,p)=>a+p[2],0)/q.length,svg:`<polygon points="${q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${fill}" opacity="${op}" stroke="${stroke}" stroke-width="1"/>`};};
    /* 小人：黃頭、紅手舉高（+y 側）、綠手平舉（−y 側），上下左右都不對稱 */
    const box=(c,sz,col)=>{const[x,y,z]=c,[a,b,h]=sz.map(v=>v/2),V=[[-a,-b,-h],[a,-b,-h],[a,b,-h],[-a,b,-h],[-a,-b,h],[a,-b,h],[a,b,h],[-a,b,h]].map(p=>[x+p[0],y+p[1],z+p[2]]);return[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].map(f=>({pts:f.map(i=>V[i]),col}));};
    const isF=s.obj3==='F',parts=(isF?[box([0,-8,0],[4,5,40],'#ffcc6a'),box([0,4,17.5],[4,19,5],'#ff9f43'),box([0,1.5,0],[4,14,5],'#e5484d')]:[box([0,5,-14],[4,3,12],'#5b6b74'),box([0,-5,-14],[4,3,12],'#5b6b74'),box([0,0,0],[6,9,16],'#4c85bb'),box([0,0,14],[8,8,10],'#ffcc6a'),box([0,12,12],[3,3,14],'#e5484d'),box([0,-15,4],[3,12,3],'#32b45a'),box([4.2,2.2,15.5],[0.4,1.6,1.6],'#1b2a33'),box([4.2,-2.2,15.5],[0.4,1.6,1.6],'#1b2a33')]).flat()
      .map(f=>({pts:f.pts.map(p=>[p[0]-d,p[1],p[2]]),col:f.col}));
    const toImg=p=>{const k=Dd/-p[0];return[Dd,-p[1]*k,-p[2]*k];};
    const items=[];
    for(const f of parts)items.push(poly(f.pts,s.on?f.col:'#56606e',1));
    items.push(poly([[0,-46,-46],[0,46,-46],[0,46,46],[0,-46,46]],'#8aa0b8',.22,'#8aa0b8'));
    /* 紙屏＋像：像的各面依「離針孔遠近」排序，近的蓋住遠的 */
    const scr=poly([[Dd,-46,-46],[Dd,46,-46],[Dd,46,46],[Dd,-46,46]],'#efe6c8',.3,'#d8cda4');
    let img='';if(s.on){const fs=parts.map(f=>({f,dist:f.pts.reduce((a,p)=>a+Math.hypot(...p),0)/4})).sort((a,b)=>b.dist-a.dist);for(const{f}of fs)img+=poly(f.pts.map(toImg),f.col,.92,'none').svg;}
    items.push({z:scr.z,svg:scr.svg+img});
    items.sort((a,b)=>b.z-a.z);
    let scene=`<rect x="0" y="0" width="900" height="500" fill="transparent"/>`+items.map(i=>i.svg).join('');
    const keys=isF?[[[-d,13.5,17.5],'#ff9f43'],[[-d,8.5,0],'#e5484d'],[[-d,-8,-20],'#ffcc6a']]:[[[-d,0,19],'#ffcc6a','頭'],[[-d,12,19],'#e5484d','紅手'],[[-d,-21,4],'#32b45a','綠手'],[[-d,5,-20],'#9fb2c8','腳']];
    if(s.on&&s.rays3)for(const[P,c]of keys){const a=pr(P),o=pr([0,0,0]),b=pr(toImg(P));scene+=`<polyline points="${a[0].toFixed(1)},${a[1].toFixed(1)} ${o[0].toFixed(1)},${o[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}" fill="none" stroke="${c}" stroke-width="2.2" opacity=".95"/><circle cx="${b[0]}" cy="${b[1]}" r="4" fill="${c}"/>`;}
    const o=pr([0,0,0]);scene+=`<circle cx="${o[0]}" cy="${o[1]}" r="4" fill="#fff"/>`;
    const lab=(P,t,c)=>{const q=pr(P);return T(clamp(q[0],40,860),clamp(q[1],48,470),t,{size:15,fill:c,anchor:'middle',weight:700,halo:true});};
    scene+=lab([-d,0,32],'物體',D.object)+lab([0,0,54],'針孔',D.ink)+lab([Dd,0,54],'紙屏',D.muted);
    let h=`<g data-drag="orbit" class="handle-body">${scene}</g>`;
    if(s.insets){
      /* 同一個觀看方向（朝 −x，往物體看）：左＝直接看物體，右＝從紙屏後面看像 */
      const panel=(x0,title,mapPts,order)=>{let g=`<rect x="${x0}" y="384" width="190" height="108" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+95,403,title,{size:14,fill:D.ink,anchor:'middle',weight:700});
        for(const f of order)g+=`<polygon points="${mapPts(f.pts).map(p=>p.join(',')).join(' ')}" fill="${s.on?f.col:'#56606e'}" stroke="#00000033"/>`;return g;};
      const m=(x0,sy,sz)=>pts=>pts.map(p=>[(x0+95+sy*p[1]*1.55).toFixed(1),(447-sz*p[2]*1.55).toFixed(1)]),back=Math.cos(yaw)>=0;
      const front=[...parts].sort((a,b)=>a.pts.reduce((s2,p)=>s2+p[0],0)-b.pts.reduce((s2,p)=>s2+p[0],0));
      const imgOrder=parts.map(f=>({f,dist:f.pts.reduce((a,p)=>a+Math.hypot(...p),0)/4})).sort((a,b)=>b.dist-a.dist).map(x=>x.f);
      h+=panel(20,'直接看物體',m(20,1,1),front)+(s.on?panel(690,back?'從紙屏後面看像':'從紙屏前面看像',m(690,back?-1:1,-1),imgOrder):`<rect x="690" y="384" width="190" height="108" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(785,445,'關燈：沒有像',{size:14,fill:D.muted,anchor:'middle'}));
      h+=back?T(450,440,'兩邊都是「面向物體」的方向看',{size:14,fill:D.muted,anchor:'middle'})+T(450,462,'→ 像轉了 180°',{size:15,fill:D.ink,anchor:'middle',weight:700}):T(450,440,'右邊改成背對針孔看（方向相反）',{size:14,fill:D.muted,anchor:'middle'})+T(450,462,'→ 只剩上下顛倒',{size:15,fill:D.ink,anchor:'middle',weight:700});
    }
    h+=T(450,28,'拖曳畫面可旋轉視角',{size:13,fill:D.muted,anchor:'middle'});
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['像','上下顛倒・左右相反'],['像高 ÷ 物高',`${num(k0,2)} 倍（= 像距 ÷ 物距）`],['同方向比較','像 = 物體轉 180°']],
      note:isF?'每條光線都直直穿過針孔：F 的<b>上方</b>橫槓跑到<b>下方</b>、往<b>右</b>伸的橫槓變成往<b>左</b>。要判斷像的形狀，先說清楚<b>從哪個方向看</b>。':'每條光線都直直穿過針孔：<b>上面</b>的點（頭、紅手）跑到<b>下面</b>，<b>左邊</b>的紅手跑到<b>右邊</b>。從紙屏後面看，和直接看物體比 → 上下顛倒、左右相反。'};},
  pinhole(s){
    if(s.view==='3d')return this.pinhole3d(s);
    if(s.view==='sim')return this.similar(s);
    beginLight(s);
    const k=2.5,hx=450,cy=250,ox=hx-s.pa*k,sx=hx+s.pb*k,hp=s.ph*k,w=Math.max(1.5,s.hole*k/2),r=s.pb/s.pa;
    const top=[ox,cy-hp/2],bot=[ox,cy+hp/2],img=y=>cy-(y-cy)*r,atScr=(P,e)=>P[1]+(e-P[1])*(sx-P[0])/(hx-P[0]);
    let h=`<rect x="${hx}" y="70" width="${sx-hx+8}" height="360" fill="#16202e" stroke="#5d7088" stroke-width="2"/>`+L(hx,70,hx,cy-w,{stroke:'#8aa0b8',w:7})+L(hx,cy+w,hx,430,{stroke:'#8aa0b8',w:7})+L(sx,80,sx,420,{stroke:'#d8cda4',w:6,op:.85})+T(hx,58,'針孔',{size:15,fill:D.muted,anchor:'middle'})+T(sx,58,'紙屏',{size:15,fill:D.muted,anchor:'middle'});
    let rs='';
    if(s.on){
      if(s.beam==='single')rs+=ray([top,[hx,cy],[sx,img(top[1])]],D.object,{w:3.5});
      else for(const[P,c]of[[top,D.object],[[ox,cy],'#fff2c4'],[bot,D.second]]){for(const e of[cy-w,cy,cy+w])rs+=ray([P,[hx,e],[sx,atScr(P,e)]],c,{w:1.5,arrow:false,op:.85});for(const e of[cy-110,cy+110])rs+=ray([P,[hx,e]],c,{w:1.2,arrow:false,op:.25});}}
    const fade=s.beam==='full'?fadeIn():0,spot=w*2*(sx-ox)/(hx-ox);
    if(fade>0&&s.tri)h+=`<polygon points="${top} ${bot} ${hx},${cy}" fill="${D.object}" opacity="${.16*fade}"/><polygon points="${sx},${img(top[1])} ${sx},${img(bot[1])} ${hx},${cy}" fill="${D.image}" opacity="${.22*fade}"/>`;
    h+=rs;
    if(s.beam==='single'&&arrived())h+=`<circle cx="${sx}" cy="${img(top[1])}" r="7" fill="${D.object}"/>`;
    if(fade>0){const op=clamp(1.15-spot/45,.3,1);h+=`<g opacity="${fade*op}">${L(sx-10,img(bot[1]),sx-10,img(top[1]),{stroke:D.image,w:Math.max(5,spot),op:.9})}</g>`+T(sx+14,img(top[1])+6,'像（倒立）',{size:15,fill:D.image,weight:600});}
    h+=`<g opacity="${s.on?1:.35}">${vArrow(ox,bot[1],top[1],D.object)}</g>`+(s.on?`<path d="M${ox} ${top[1]-26}q-8 12 0 20q8 -8 0 -20z" fill="#ffb347"/>`:'')+handle('pobj',ox,bot[1]+22,D.object)+handle('pscr',sx,440,D.muted);
    h+=L(ox,468,hx,468,{stroke:D.object,w:1.5,dash:'5 5'})+T((ox+hx)/2,488,`物距 ${s.pa} cm`,{size:15,fill:D.object,anchor:'middle'})+L(hx,468,sx,468,{stroke:D.image,w:1.5,dash:'5 5'})+T((hx+sx)/2,488,`像距 ${s.pb} cm`,{size:15,fill:D.image,anchor:'middle'});
    const H=s.ph*r,spotCm=s.hole*(s.pa+s.pb)/s.pa;
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['像高',`${num(H)} cm`],['像距 ÷ 物距',`${num(r,2)} 倍`],['像','倒立・'+(Math.abs(r-1)<1e-6?'等大':r>1?'放大':'縮小')+'・實像'],['清晰度',spotCm<1.6?'清楚':spotCm<4?'有點模糊':'模糊']],
      note:`像距是物距的 <b>${num(r,2)} 倍</b>，像高也是物高的 ${num(r,2)} 倍（兩個三角形形狀一樣）。針孔越大越亮，但越模糊。`};},
  speed(s){
    /* 光速：等長跑道比一比、閃電與雷聲、太陽光到地球（動畫時間是示意，畫面標出放慢或快轉幾倍） */
    const t=s.st===null?0:s.st,go=s.st!==null,glow=(x,y,r=8)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${2*r}" fill="#ffe8a5" opacity=".25"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#ffe8a5"/>`;let h='';
    if(s.sv==='race'){
      /* 跑道 3 m；真空中跑完畫成 2 秒（實際 1 億分之 1 秒 → 放慢 2 億倍）；速率單位 ×10⁸ m/s */
      const x0=150,x1=690,half=t>=2,LANES=[['真空',3,'#05080d','3.00'],['空氣',2.999,MEDIA.air[2],'約 3.00'],['水',2.25,MEDIA.water[2],'2.25'],['玻璃',2,MEDIA.glass[2],'2.00'],['鑽石',1.24,MEDIA.diamond[2],'1.24']];
      h+=T(450,44,half?'真空中的光到終點時，其他的光走到哪裡？':go?'跑道一樣長（3 m），哪一道的光先到終點？':'跑道一樣長（3 m）：先猜猜看，再按「▶ 出發」',{size:18,fill:D.ink,anchor:'middle',weight:700});
      LANES.forEach(([name,v,c,txt],i)=>{const y=106+i*76,p=clamp(t*v/6,0,1),x=x0+(x1-x0)*p;
        h+=`<rect x="${x0-14}" y="${y-24}" width="${x1-x0+28}" height="48" rx="10" fill="${c}" stroke="#3a4f6b" stroke-width="1.5"/>`+T(x0-28,y+6,name,{size:19,fill:D.ink,anchor:'end',weight:700})+T(x1+24,y+6,`${txt} × 10⁸ m/s`,{size:16,fill:D.ink});
        if(i===0)for(let j=0;j<14;j++)h+=`<circle cx="${(x0+rnd(j)*(x1-x0)).toFixed(1)}" cy="${(y-18+rnd(j+40)*36).toFixed(1)}" r="1.2" fill="#ffffff" opacity=".6"/>`;
        if(half&&v<2.99){const px=x0+(x1-x0)*v/3;h+=L(px,y-22,px,y+22,{stroke:'#ffe8a5',w:2,dash:'4 3',op:.8})+T(px,y-30,`${Math.round(v/3*100)}%`,{size:14,fill:'#ffe8a5',anchor:'middle',weight:700});}
        h+=(go?L(Math.max(x0,x-70),y,x,y,{stroke:'#ffe8a5',w:6,op:.35}):'')+glow(x,y);});
      h+=L(x1,70,x1,440,{stroke:'#ffffff',w:2,dash:'6 6',op:.6})+T(x1,462,'終點',{size:14,fill:D.muted,anchor:'middle'})+T(450,488,'動畫放慢了約 2 億倍：真空中跑 3 m，實際只要 1 億分之 1 秒',{size:14,fill:D.muted,anchor:'middle'});
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['真空中的光速','約 3 × 10⁸ m/s'],['1 秒可以走','30 萬公里（繞地球約 7 圈半）'],['水中的光速','約真空的 3/4'],['影響光速的因素','介質（光經過的物質）']],
        note:'光在<b>真空</b>中最快；進入空氣、水、玻璃、鑽石越來越慢 → <b>光速和介質有關</b>。<br>和聲音相反：聲音不能在真空中傳播（3-4）。'};
    }
    if(s.sv==='thunder'){
      /* 真實時間：光幾乎立刻到，聲音每秒 340 m */
      const d=s.km*1000,tS=d/340,bx=150,px=790,gy=400,heard=go&&t>=tS,rr=640*Math.min(t,tS)*340/d,fo=heard?clamp(1-(t-tS)/0.8,0,1):1;
      if(go&&t<0.35)h+=`<rect x="0" y="0" width="900" height="500" fill="#dfe9ff" opacity="${((0.35-t)/0.35*0.35).toFixed(3)}"/>`;
      if(go&&rr>0&&fo>0)for(let j=0;j<3;j++){const r=rr-j*28;if(r>0)h+=`<circle cx="${bx}" cy="${gy}" r="${r.toFixed(1)}" fill="none" stroke="${D.second}" stroke-width="3" opacity="${((0.9-j*0.28)*fo).toFixed(2)}"/>`;}
      h+=`<rect x="0" y="${gy}" width="900" height="100" fill="#16202e"/>`+L(0,gy,900,gy,{stroke:'#5d7088',w:2});
      h+=`<g fill="#56606e"><ellipse cx="${bx}" cy="86" rx="92" ry="34"/><ellipse cx="${bx-56}" cy="100" rx="52" ry="26"/><ellipse cx="${bx+60}" cy="102" rx="56" ry="24"/></g>`;
      if(go&&t<0.6)h+=`<path d="M${bx+6} 116L${bx-22} 210L${bx+10} 222L${bx-18} 318L${bx+12} 330L${bx} ${gy}" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linejoin="round" opacity="${(1-t/0.6).toFixed(2)}"/>`;
      if(go&&t<1.5)h+=L(bx,250,px,326,{stroke:'#ffe8a5',w:2.5,dash:'8 6',op:1-t/1.5})+T((bx+px)/2,272,'光：幾乎立刻到達',{size:15,fill:'#ffe8a5',anchor:'middle',weight:700});
      h+=`<circle cx="${px}" cy="326" r="14" fill="${D.ink}"/>`+L(px,340,px,372,{stroke:D.ink,w:5})+L(px,372,px-12,gy,{stroke:D.ink,w:5})+L(px,372,px+12,gy,{stroke:D.ink,w:5})+L(px-18,352,px+18,352,{stroke:D.ink,w:4})+T(px,300,'你',{size:15,fill:D.ink,anchor:'middle'});
      if(heard)h+=T(px-20,262,'轟隆隆！',{size:22,fill:D.second,anchor:'end',weight:700});
      h+=L(bx,440,px,440,{stroke:D.muted,w:1.5,dash:'5 5'})+L(bx,432,bx,448,{stroke:D.muted,w:2})+L(px,432,px,448,{stroke:D.muted,w:2})+T((bx+px)/2,468,`${num(s.km,1)} km = ${Math.round(d)} m`,{size:16,fill:D.muted,anchor:'middle'});
      h+=T(870,60,!go?'按「⚡ 打雷」，看到閃電就開始數秒':heard?`${num(tS,1)} 秒後聽到雷聲`:`看到閃電後…… ${num(t,1)} 秒`,{size:20,fill:heard?D.second:D.ink,anchor:'end',weight:700})+T(870,86,'（真實速度，可以跟著一起數）',{size:14,fill:D.muted,anchor:'end'});
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['光到達',`約 ${(d/3e8).toFixed(6)} 秒（幾乎立刻）`],['雷聲到達',`約 ${num(tS,1)} 秒後`],['秒數 × 340',`${num(tS,1)} × 340 ≈ ${Math.round(+tS.toFixed(1)*340)} m`]],
        note:'閃電和雷聲<b>同時</b>發生，但光速（約 3 × 10⁸ m/s）比聲速（約 340 m/s）快了約 88 萬倍 → 先看到閃電，後聽到雷聲。<br><b>看到閃電後數幾秒 × 340 ≈ 打雷處的距離（公尺）</b>。'};
    }
    /* 太陽光到地球：500 秒畫成 5 秒（快轉 100 倍） */
    const x0=150,x1=800,p=clamp(t/5,0,1),el=Math.round(p*500),done=go&&p>=1;
    for(let j=0;j<40;j++)h+=`<circle cx="${(rnd(j)*900).toFixed(1)}" cy="${(rnd(j+70)*500).toFixed(1)}" r="1.1" fill="#ffffff" opacity=".45"/>`;
    h+=`<circle cx="60" cy="250" r="120" fill="#ffb347" opacity=".18"/><circle cx="60" cy="250" r="86" fill="#ffcc6a"/>`+T(60,370,'太陽',{size:18,fill:D.object,anchor:'middle',weight:700});
    h+=`<circle cx="${x1+22}" cy="250" r="20" fill="#4c85bb"/><path d="M${x1+10} 240q8 -6 14 2q-4 8 4 14q-10 6 -16 -2z" fill="#9be38b"/>`+T(x1+22,296,'地球',{size:18,fill:'#7fb3ff',anchor:'middle',weight:700});
    if(go)h+=L(x0,250,x0+(x1-x0)*p,250,{stroke:'#ffe8a5',w:3,op:.5});h+=glow(x0+(x1-x0)*p,250,7);
    h+=L(x0,400,x1+22,400,{stroke:D.muted,w:1.5,dash:'5 5'})+T((x0+x1)/2,426,'約 1.5 × 10¹¹ m（1.5 億公里）',{size:16,fill:D.muted,anchor:'middle'});
    h+=T(450,80,!go?'太陽光要多久才到地球？先猜猜看，再按「▶ 出發」':done?'到了！共 500 秒 ≈ 8 分 20 秒':`已經過 ${el} 秒（${Math.floor(el/60)} 分 ${el%60} 秒）`,{size:20,fill:done?D.object:D.ink,anchor:'middle',weight:700})+T(450,476,'動畫快轉了 100 倍',{size:14,fill:D.muted,anchor:'middle'});
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['太陽到地球','約 1.5 × 10¹¹ m'],['光速','約 3 × 10⁸ m/s'],['時間 = 距離 ÷ 速率','1.5 × 10¹¹ ÷ (3 × 10⁸) = 500 秒'],['也就是','約 8 分 20 秒']],
      note:'我們現在看到的太陽，是約 <b>8 分 20 秒前</b>發出的光。光速雖然很快，宇宙中的距離更遠。'};},
  render(s){
    if(s.mode==='pinhole')return this.pinhole(s);
    if(s.mode==='speed')return this.speed(s);
    beginLight(s);
    /* D 最小 165、a 最大 150：物體一定在屏幕前 */
    const k=700/300,vy=1.6,a=s.a,Dd=s.D,R=s.src==='area'?s.R:0,PX=x=>100+x*k,PY=y=>250+y*vy;
    const s1=-R,s2=R,ot=-s.h/2,ob=s.h/2,line=(y0,y1)=>x=>y0+(y1-y0)*x/a;
    const uU=line(s1,ot),uL=line(s2,ob),oU=line(s2,ot),oL=line(s1,ob),sx=PX(Dd),ox=PX(a);
    /* 屏幕只在 y 30～470：超出就從旁邊經過 */
    const trace=(y0,ang)=>{const dx=Math.cos(ang),dy=Math.sin(ang),ty=y0+dy*(ox-100)/dx,sy=y0+dy*(sx-100)/dx;if(ty>=PY(ot)&&ty<=PY(ob))return{pts:[[100,y0],[ox,ty]],hit:true};if(sy<30||sy>470)return{pts:[[100,y0],[900,y0+dy*800/dx]],hit:false,miss:true};return{pts:[[100,y0],[sx,sy]],hit:false};};
    let rays='',blocked=false,miss=false,spot=null;
    if(s.on&&s.beam==='single'){const t=trace(250,rad(s.ang));blocked=t.hit;miss=!!t.miss;rays+=ray(t.pts,'#ffe8a5',{w:3.5});if(!t.hit&&!t.miss)spot=t.pts[1];}
    else if(s.on){const ys=R>0?[PY(s1),250,PY(s2)]:[250];for(const y0 of ys){const n=R>0?13:25,a0=Math.atan2(36-y0,sx-100),a1=Math.atan2(464-y0,sx-100);for(let i=0;i<n;i++)rays+=ray(trace(y0,a0+(a1-a0)*i/(n-1)).pts,'#ffe8a5',{w:1.6,op:R>0?.4:.55,arrow:false});}}
    const fade=s.beam==='full'?fadeIn():0,lit=fade>0;
    let h=`<rect x="${sx}" y="30" width="16" height="440" rx="4" fill="${lit?'#d8cda4':'#5d7088'}"/>`;
    const poly=pts=>pts.map(([x,y])=>`${PX(x).toFixed(1)},${PY(y).toFixed(1)}`).join(' ');
    let umbraH=uU(Dd)<uL(Dd)?uL(Dd)-uU(Dd):0;
    if(lit){
      if(R>0)h+=`<polygon points="${poly([[a,ot],[Dd,oU(Dd)],[Dd,oL(Dd)],[a,ob]])}" fill="#000" opacity="${.42*fade}"/>`;
      if(umbraH>0)h+=`<polygon points="${poly([[a,ot],[Dd,uU(Dd)],[Dd,uL(Dd)],[a,ob]])}" fill="#03060b" opacity="${.92*fade}"/>`;
      else{const xs=a*(s2-s1)/((s2-s1)-(ob-ot));h+=`<polygon points="${poly([[a,ot],[xs,uU(xs)],[a,ob]])}" fill="#03060b" opacity="${.92*fade}"/>`;}
      if(R>0)h+=`<rect x="${sx}" y="${PY(oU(Dd))}" width="16" height="${(oL(Dd)-oU(Dd))*vy}" fill="#5c6270" opacity="${fade}"/>`;
      if(umbraH>0)h+=`<rect x="${sx}" y="${PY(uU(Dd))}" width="16" height="${umbraH*vy}" fill="#05080d" opacity="${fade}"/>`;
    }
    h+=rays;
    if(lit&&s.edges){const e=(y0,y1,yE,c)=>L(PX(0),PY(y0),PX(Dd),PY(yE),{stroke:c,w:2.5,op:.95*fade});h+=R>0?e(s1,ot,uU(Dd),D.ray)+e(s2,ob,uL(Dd),D.ray)+e(s2,ot,oU(Dd),D.second)+e(s1,ob,oL(Dd),D.second):e(0,ot,uU(Dd),D.ray)+e(0,ob,uL(Dd),D.ray);}
    if(lit&&umbraH>0)h+=T(sx-10,PY(0)+6,'本影',{size:17,fill:D.ink,anchor:'end'});if(lit&&R>0)h+=T(sx-10,PY(oL(Dd))-6,'半影',{size:16,fill:D.muted,anchor:'end'});
    if(spot&&arrived())h+=`<circle cx="${sx}" cy="${spot[1]}" r="9" fill="#ffe8a5"/><circle cx="${sx}" cy="${spot[1]}" r="20" fill="#ffe8a5" opacity=".3"/>`;
    if(blocked&&arrived())h+=T(ox+14,PY(ot)-14,'被擋住',{size:16,fill:D.object});
    const glow=s.on?'#ffe8a5':'#56606e';
    h+=R>0?`<rect x="92" y="${PY(s1)}" width="16" height="${2*R*vy}" rx="8" fill="${glow}"/>${s.on?`<rect x="84" y="${PY(s1)-8}" width="32" height="${2*R*vy+16}" rx="16" fill="${glow}" opacity=".25"/>`:''}`:`<circle cx="100" cy="250" r="11" fill="${glow}"/>${s.on?`<circle cx="100" cy="250" r="24" fill="${glow}" opacity=".25"/>`:''}`;
    h+=L(ox,PY(ot),ox,PY(ob),{stroke:D.object,w:10})+handle('obj',ox,PY(ob)+30,D.object)+handle('top',ox,PY(ot),D.object,10)+handle('screen',sx+8,52,D.muted);
    if(s.on&&s.beam==='single')h+=handle('aim',100+120*Math.cos(rad(s.ang)),250+120*Math.sin(rad(s.ang)),'#ffe8a5',11);
    h+=T(100,R>0?PY(s1)-22:214,'光源',{size:19,fill:D.object,anchor:'middle'})+T(sx+8,22,'屏幕',{size:17,fill:D.ink,anchor:'middle'});
    h+=L(100,462,ox,462,{stroke:D.object,w:1.5,dash:'5 5'})+T((100+ox)/2,456,`a = ${a} cm`,{size:15,fill:D.object,anchor:'middle'})+L(100,488,sx,488,{stroke:D.muted,w:1.5,dash:'5 5'})+T((100+sx)/2+60,483,`D = ${Dd} cm`,{size:15,fill:D.muted,anchor:'middle'});
    if(!s.on)h+=T(450,250,'按「開燈」',{size:22,fill:D.muted,anchor:'middle'});
    let reads=R>0?[['本影高度',umbraH>0?num(umbraH)+' cm':'沒有本影'],['半影寬度（單側）',num((oL(Dd)-oU(Dd)-umbraH)/2)+' cm']]:[['影子高度 H',num(s.h*Dd/a)+' cm'],['放大倍數',num(Dd/a,2)+' 倍']];
    if(s.beam==='single')reads=[['這束光',!s.on?'—':blocked?'被物體擋住':miss?'沒照到屏幕（從旁邊經過）':'照到屏幕'],...reads];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:s.beam==='single'?'光在同一介質中<b>沿直線</b>前進。拖動光束旁的圓圈改變方向。':R>0?'光源有大小 → 完全照不到的<b>本影</b>＋部分照到的<b>半影</b>':`被擋住的光到不了屏幕 → 影子。<b>H / h = D / a</b>`};}},

/* ===== 08 平面鏡 ===== */
mirror:{group:2,n:'4-2',keep:['mode'],name:'光的反射與平面鏡',subtitle:'看得見 = 光進入眼睛。觀察反射定律、光的可逆、單向反射與漫射。',dark:true,
  q:s=>s.mode==='diffuse'?['為什麼教室各個位置的同學都看得到黑板上的字，有些位置卻會看到黑板「反光」？','黑板和粉筆字的表面粗糙，光照到後發生<b>漫射</b>，反射光射向各方向，所以每個位置都有光進入眼睛。<br>「反光」是黑板較光滑的地方發生<b>單向反射</b>，反射光集中射向某個方向，坐在那裡的同學眼睛收到很強的光，就看不清楚字。兩種情形的每一小塊表面都遵守反射定律。']
    :s.mode==='rotate'?['入射光不動，把平面鏡轉 10°，反射光會轉幾度？','<b>20°</b>。鏡面轉 10°，法線也跟著轉 10°；入射角、反射角各改變 10°，所以反射光一共轉 <b>2 × 10° = 20°</b>。把「鏡面轉動 θ」調到 10°，再按「▶ 播放轉動」驗證。']
    :['物體向鏡面靠近 10 cm，物與像的距離改變多少？','像也向鏡面靠近 10 cm，所以物與像的距離減少 20 cm。'],
  state:{on:true,beam:'full',prog:0,mode:'plane',d:55,h:60,ex:80,ey:110,eye:true,ext:true,hit:170,rev:false,surf:'rough',normals:true,zoom:0,zoomT:0,pick:4,mag:true,i0:40,rot:15,ghost:true,anim:null},
  controls:[LAMP,{...BEAM,show:s=>s.mode!=='rotate'},
    {type:'seg',key:'mode',label:'實驗',options:[['plane','平面鏡成像'],['diffuse','單向反射 vs 漫射'],['rotate','鏡面旋轉（延伸）']],onChange:replay},
    {type:'range',key:'i0',label:'原來的入射角',min:10,max:60,step:1,unit:'°',show:s=>s.mode==='rotate'},
    {type:'range',key:'rot',label:'鏡面轉動 θ',min:-30,max:30,step:1,unit:'°',show:s=>s.mode==='rotate'},
    {type:'buttons',label:'',items:[['▶ 播放轉動',s=>{s.anim=0;}]],show:s=>s.mode==='rotate',primary:true},
    {type:'toggle',key:'ghost',label:'顯示原來位置（虛線）',show:s=>s.mode==='rotate'},
    {type:'range',key:'d',label:'物距',min:15,max:110,step:1,unit:' cm',show:s=>s.mode==='plane'},
    {type:'range',key:'h',label:'物體高度',min:20,max:100,step:1,unit:' cm',show:s=>s.mode==='plane'},
    {type:'toggle',key:'rev',label:'光的可逆（反方向射回去）',show:s=>s.mode==='plane'&&s.beam==='single',onChange:replay},
    {type:'toggle',key:'eye',label:'進入眼睛的光線',show:s=>s.mode==='plane'&&s.beam==='full'},
    {type:'toggle',key:'ext',label:'反向延長線',show:s=>s.mode==='plane'},
    {type:'seg',key:'surf',label:'表面',options:[['smooth','光滑（鏡面）'],['rough','粗糙（紙、牆）']],onChange:replay,show:s=>s.mode==='diffuse'},
    {type:'seg',key:'zoomT',label:'放大表面',options:[[0,'肉眼看'],[0.5,'放大'],[1,'再放大']],show:s=>s.mode==='diffuse'&&s.surf==='rough'},
    {type:'toggle',key:'mag',label:'放大鏡：看選中的那一點',show:s=>s.mode==='diffuse'},
    {type:'toggle',key:'normals',label:'顯示每一點的法線',show:s=>s.mode==='diffuse'}],
  tick:(s,dt)=>{LIGHT_TICK(s,dt);if(s.anim!==null){s.anim+=dt;if(s.anim>1.6)s.anim=null;}s.zoom+=(s.zoomT-s.zoom)*Math.min(1,dt*3);},
  drag:{obj:(p,s)=>{s.d=snap('d',(450-p.x)/3);},img:(p,s)=>{s.d=snap('d',(p.x-450)/3);},top:(p,s)=>{s.h=snap('h',(400-p.y)/2.6);},eye:(p,s)=>{s.ex=clamp(p.x,40,420);s.ey=clamp(p.y,40,440);},hit:(p,s)=>{s.hit=clamp(p.y,50,430);},pick:(p,s)=>{s.pick=clamp(Math.round((p.x-230)/52),0,8);},turn:(p,s)=>{let a=deg(Math.atan2(-(p.y-340),p.x-450));if(a>90)a-=180;if(a<-90)a+=180;s.rot=snap('rot',a);s.anim=null;}},
  rotate(s){
    beginLight(s);
    /* 入射光固定，鏡面繞入射點轉 θ：法線轉 θ，反射光轉 2θ */
    const P=[450,340],L0=300,rotV=(v,a)=>[v[0]*Math.cos(a)+v[1]*Math.sin(a),-v[0]*Math.sin(a)+v[1]*Math.cos(a)];
    const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,th=s.anim!==null?s.rot*ease(clamp(s.anim/1.5,0,1)):s.rot,a0=rad(s.i0),d=[Math.sin(a0),Math.cos(a0)],S=[P[0]-d[0]*L0,P[1]-d[1]*L0];
    const state=t=>{const m=rotV([1,0],rad(t)),n=rotV([0,-1],rad(t)),dot=d[0]*n[0]+d[1]*n[1],r=[d[0]-2*dot*n[0],d[1]-2*dot*n[1]];return{m,n,r,back:dot>=0,inc:deg(Math.acos(clamp(-dot,-1,1)))};};
    const A=state(0),B=state(th),tr=Math.round(Math.abs(th)),at=(v,k)=>[P[0]+v[0]*k,P[1]+v[1]*k];
    const arc=(v1,v2,R,c,label,lw=2.5)=>{const a1=Math.atan2(v1[1],v1[0]),a2=Math.atan2(v2[1],v2[0]);let da=a2-a1;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;if(Math.abs(da)<0.01)return '';
      const p1=[P[0]+R*Math.cos(a1),P[1]+R*Math.sin(a1)],p2=[P[0]+R*Math.cos(a2),P[1]+R*Math.sin(a2)],am=a1+da/2;
      return `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${R} ${R} 0 0 ${da>0?1:0} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" fill="none" stroke="${c}" stroke-width="${lw}"/>`+T(P[0]+(R+22)*Math.cos(am),P[1]+(R+22)*Math.sin(am)+6,label,{size:16,fill:c,anchor:'middle',weight:700});};
    const mirror=(m,c,dash)=>L(P[0]-m[0]*230,P[1]-m[1]*230,P[0]+m[0]*230,P[1]+m[1]*230,{stroke:c,w:dash?3:6,dash:dash?'8 7':false,op:dash?.55:1});
    let h='';
    if(s.ghost){h+=mirror(A.m,D.muted,true)+L(P[0],P[1],...at(A.n,150),{stroke:D.muted,w:1.5,dash:'4 5',op:.6});}
    h+=mirror(B.m,D.ray,false);for(let k=-200;k<=200;k+=25){const q=at(B.m,k),o=rotV([0,1],rad(th));h+=L(q[0],q[1],q[0]+o[0]*10+B.m[0]*-6,q[1]+o[1]*10+B.m[1]*-6,{stroke:'#6f8196',w:1.5});}
    h+=L(P[0],P[1],...at(B.n,150),{stroke:D.ink,w:1.5,dash:'4 5'})+T(...at(B.n,168),'法線',{size:14,fill:D.ink,anchor:'middle'});
    if(s.on){h+=ray([S,P],D.object,{w:4});if(!B.back)h+=ray([S,P,at(B.r,L0)],D.object,{w:4});}
    if(s.ghost&&s.on&&arrived())h+=L(P[0],P[1],...at(A.r,L0),{stroke:D.second,w:2.5,dash:'8 7',op:.7})+T(...at(A.r,L0+20),'原來的反射光',{size:14,fill:D.second,anchor:'middle'});
    if(s.on&&arrived()&&!B.back){if(Math.abs(th)>=1){h+=arc(A.r,B.r,190,D.object,`2θ = ${2*tr}°`,3.5);if(s.ghost)h+=arc(A.n,B.n,110,D.ink,`θ`)+arc(A.m,B.m,215,D.ray,`θ = ${tr}°`);}
      h+=arc([-d[0],-d[1]],B.n,62,'#ffe8a5',`${num(B.inc,0)}°`,2)+arc(B.n,B.r,78,'#ffe8a5',`${num(B.inc,0)}°`,2);}
    if(B.back)h+=T(450,470,'光照到鏡子背面了，轉小一點',{size:18,fill:D.second,anchor:'middle'});
    h+=`<circle cx="${S[0]}" cy="${S[1]}" r="9" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+handle('turn',...at(B.m,200),D.ray,12)+`<circle cx="${P[0]}" cy="${P[1]}" r="5" fill="${D.ink}"/>`;
    if(!s.on)h+=T(450,80,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
    /* θ 為正時法線轉向入射光；θ 大於原入射角就轉過頭，入射光跑到法線另一側 */
    const cross=!B.back&&s.i0-th<-0.5;
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['鏡面轉了',`${tr}°`],['法線也轉了',`${tr}°`],['入射角',`${s.i0}° → ${num(B.inc,0)}°${cross?'（在法線另一側）':''}`],['反射光轉了',`${2*tr}°`]],
      note:'入射光不動，鏡面轉 θ → <b>法線轉 θ</b> → 反射光一共轉 <b>2θ</b>。'+(cross?`<br>這次法線轉過了入射光，入射光跑到法線的<b>另一側</b>：入射角 = ${tr}° − ${s.i0}° = ${num(B.inc,0)}°，反射光仍然轉 2θ。`:'<br>入射角、反射角各改變 θ，合起來就是 2θ。')};},
  diffuse(s){
    beginLight(s);
    /* 表面由很多小平面組成；粗糙表面每片傾斜不同。放大倍率只影響「畫出來的凹凸」，反射永遠用真實的小平面 */
    const smooth=s.surf==='smooth',sy=360,w=26,x0=110,N=26,ANG=[-28,17,-9,31,-20,6,25,-33,12,-15,29,-6,21,-31,9,-24,33,-12,18,-27,4,26,-19,14,-8,30];
    const phi=i=>smooth?0:rad(ANG[i%ANG.length]*0.7);let ys=[0];for(let i=0;i<N;i++)ys.push(ys[i]+Math.tan(phi(i))*w);const mean=ys.reduce((a,b)=>a+b,0)/ys.length;ys=ys.map(y=>y-mean);
    const z=clamp(s.zoom,0,1),Yd=y=>sy+y*z,surfY=x=>{const i=clamp(Math.floor((x-x0)/w),0,N-1);return Yd(ys[i]+Math.tan(phi(i))*(x-x0-i*w));};
    const d=[Math.cos(rad(55)),Math.sin(rad(55))],xs=[230,282,334,386,438,490,542,594,646],pick=clamp(s.pick,0,8),idx=s.beam==='single'?[pick]:xs.map((_,i)=>i);
    let h='',sp='';
    let surf=`M${x0} ${Yd(ys[0]).toFixed(1)}`;for(let i=1;i<=N;i++)surf+=`L${x0+i*w} ${Yd(ys[i]).toFixed(1)}`;
    h+=`<path d="${surf}L${x0+N*w} ${sy+60}L${x0} ${sy+60}Z" fill="${smooth?'#5d7088':'#7d8794'}"/><path d="${surf}" fill="none" stroke="#d7edff" stroke-width="2.5"/>`;
    const geo={};
    for(const i of idx){const x=xs[i],k=clamp(Math.floor((x-x0)/w),0,N-1),f=phi(k),n=[Math.sin(f),-Math.cos(f)],dt=d[0]*n[0]+d[1]*n[1],r=[d[0]-2*dt*n[0],d[1]-2*dt*n[1]],y=surfY(x),th=deg(Math.acos(clamp(-dt,-1,1)));
      geo[i]={x,y,f,n,r,th};if(s.on)sp+=ray([[x-d[0]*300,y-d[1]*300],[x,y],[x+r[0]*250,y+r[1]*250]],i===pick?D.object:'#ffe8a5',{w:i===pick?3.5:2,arrow:true,op:i===pick?1:.75});}
    const fade=fadeIn();
    if(s.normals&&fade>0&&z>0.35||smooth&&s.normals&&fade>0)for(const i of idx){const g=geo[i];h+=L(g.x,g.y,g.x+g.n[0]*60,g.y+g.n[1]*60,{stroke:D.muted,w:1.4,dash:'4 4',op:fade});}
    h+=sp;
    const g=geo[pick];
    if(g){
      if(z>0.35||smooth)h+=L(g.x-15*Math.cos(g.f),Yd(0)===sy?g.y-15*Math.sin(g.f)*z:g.y,g.x+15*Math.cos(g.f),g.y+15*Math.sin(g.f)*z,{stroke:'#ffffff',w:4});
      h+=handle('pick',g.x,g.y,D.object,11);
      if(s.mag&&s.on&&arrived()){
        const C=[765,118],R=88,t=[Math.cos(g.f),Math.sin(g.f)],n=g.n,r=g.r,pp=[-n[1],n[0]],side=Math.sign(-pp[0]*d[0]-pp[1]*d[1])||1;
        const lab=(sg,txt,c)=>{const q=[C[0]+n[0]*52+pp[0]*sg*side*24,C[1]+n[1]*52+pp[1]*sg*side*24+5];return T(q[0],q[1],txt,{size:14,fill:c,anchor:'middle',weight:700});};
        h+=L(g.x,g.y,C[0]-R*0.7,C[1]+R*0.7,{stroke:'#ffffff55',w:1.5,dash:'3 4'});
        h+=`<clipPath id="magc"><circle cx="${C[0]}" cy="${C[1]}" r="${R}"/></clipPath><circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="#0b1422"/><g clip-path="url(#magc)">`
          +`<polygon points="${C[0]-t[0]*R*1.5},${C[1]-t[1]*R*1.5} ${C[0]+t[0]*R*1.5},${C[1]+t[1]*R*1.5} ${C[0]+t[0]*R*1.5-n[0]*R*1.5},${C[1]+t[1]*R*1.5-n[1]*R*1.5} ${C[0]-t[0]*R*1.5-n[0]*R*1.5},${C[1]-t[1]*R*1.5-n[1]*R*1.5}" fill="#7d8794"/>`
          +L(C[0]-t[0]*R,C[1]-t[1]*R,C[0]+t[0]*R,C[1]+t[1]*R,{stroke:'#ffffff',w:4})
          +L(C[0],C[1],C[0]+n[0]*R,C[1]+n[1]*R,{stroke:D.muted,w:1.5,dash:'4 4'})
          +L(C[0]-d[0]*R,C[1]-d[1]*R,C[0],C[1],{stroke:D.object,w:3.5,arrow:true})+L(C[0],C[1],C[0]+r[0]*R*0.95,C[1]+r[1]*R*0.95,{stroke:D.object,w:3.5,arrow:true})
          +`</g><circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="#c9d6e6" stroke-width="3"/>`
          +lab(1,`入 ${g.th.toFixed(0)}°`,D.object)+lab(-1,`反 ${g.th.toFixed(0)}°`,D.ink)+T(C[0],C[1]+R+22,'放大這一點：就是一小片平面鏡',{size:14,fill:D.ink,anchor:'middle',weight:600});
      }
    }
    h+=T(450,446,smooth?'光滑表面（鏡子）':z<0.15?'粗糙表面：肉眼看起來平平的':'粗糙表面放大：其實凹凸不平',{size:17,fill:D.muted,anchor:'middle'});
    if(!s.on)h+=T(450,200,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
    const note=smooth?'光滑表面每一小塊的方向都一樣 → 反射光整齊平行，叫做<b>單向反射（鏡面反射）</b>，所以鏡子能成像。':z<0.15?'看起來平平的，反射光卻射向各處……按「放大」看看表面！':'每一小塊都是一片<b>小平面鏡</b>，都遵守<b>入射角 = 反射角</b>；只是每塊方向不同 → 反射光射向各方向，叫做<b>漫射</b>（漫反射）。';
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['表面',smooth?'光滑':'粗糙'],['反射光',smooth?'平行射出（單向反射）':'射向各方向（漫射）'],['選中的這一點',g?`入射角 = 反射角 = ${g.th.toFixed(0)}°`:'—']],note};},
  render(s){
    if(s.mode==='diffuse')return this.diffuse(s);
    if(s.mode==='rotate')return this.rotate(s);
    beginLight(s);
    const mx=450,ox=mx-s.d*3,ix=mx+s.d*3,base=400,top=base-s.h*2.6,refl=(Y,hy)=>{const dx=mx-ox,k=(mx-30)/dx;return[mx-dx*k,hy+(hy-Y)*k];};
    let h=`<rect x="450" y="40" width="12" height="400" fill="#72dbe6" opacity=".3"/>`+L(mx,40,mx,440,{stroke:D.ray,w:4})+T(mx,30,'平面鏡',{size:17,fill:D.ray,anchor:'middle'});
    let rays='',exts=[],ang=deg(Math.atan(Math.abs(s.hit-top)/(mx-ox)));
    if(s.on&&s.beam==='single'){if(s.rev)rays+=ray([refl(top,s.hit),[mx,s.hit],[ox,top]],D.object,{w:3.5});else{rays+=ray([[ox,top],[mx,s.hit],refl(top,s.hit)],D.object,{w:3.5});exts.push([mx,s.hit,ix,top,D.object]);}}
    else if(s.on){for(let i=0;i<7;i++){const hy=60+i*60;rays+=ray([[ox,top],[mx,hy],refl(top,hy)],D.third,{w:1.8,op:.75,arrow:false});exts.push([mx,hy,ix,top,D.third]);}
      if(s.eye)[top,base].forEach((Y,i)=>{const hy=s.ey+(Y-s.ey)*(mx-s.ex)/(ix-s.ex),c=i?D.second:D.ray;if(hy<40||hy>440)return;rays+=ray([[ox,Y],[mx,hy],[s.ex,s.ey]],c,{w:3});exts.push([mx,hy,ix,Y,c]);});}
    const fade=fadeIn();
    if(s.ext&&fade>0)for(const[x1,y1,x2,y2,c]of exts)h+=L(x1,y1,x2,y2,{stroke:c,w:1.6,dash:'6 6',op:.8*fade});
    h+=rays;
    if(s.on&&s.beam==='single'&&arrived()){const r=60,th=rad(ang),dir=s.hit<top?-1:1;h+=L(mx-110,s.hit,mx,s.hit,{stroke:D.muted,w:1.5,dash:'4 5'})+T(mx-116,s.hit+5,'法線',{size:14,fill:D.muted,anchor:'end'});
      h+=`<path d="M${mx-r} ${s.hit}A${r} ${r} 0 0 ${dir<0?1:0} ${mx-r*Math.cos(th)} ${s.hit-dir*r*Math.sin(th)}" fill="none" stroke="${D.object}" stroke-width="2"/><path d="M${mx-r*0.8} ${s.hit}A${r*0.8} ${r*0.8} 0 0 ${dir<0?0:1} ${mx-r*0.8*Math.cos(th)} ${s.hit+dir*r*0.8*Math.sin(th)}" fill="none" stroke="${D.ink}" stroke-width="2"/>`;
      h+=T(mx-r-8,s.hit-dir*30,`${ang.toFixed(0)}°`,{size:16,fill:D.object,anchor:'end'})+T(mx-r-8,s.hit+dir*38,`${ang.toFixed(0)}°`,{size:16,fill:D.ink,anchor:'end'});}
    h+=`<g opacity="${s.on?1:.35}">${vArrow(ox,base,top,D.object)}</g>`+T(ox,base+30,'物',{size:20,fill:D.object,anchor:'middle'});
    if(fade>0)h+=`<g opacity="${fade}">${vArrow(ix,base,top,D.image,{dash:'7 6'})}${T(ix,base+30,'虛像',{size:20,fill:D.image,anchor:'middle'})}</g>`;
    h+=handle('obj',ox,base,D.object)+handle('top',ox,top,D.object,10)+handle('img',ix,base,D.image);
    if(s.on&&s.beam==='single')h+=handle('hit',mx,s.hit,D.object,11);
    h+=`<path d="M${s.ex-30} ${s.ey}Q${s.ex} ${s.ey-28} ${s.ex+30} ${s.ey}Q${s.ex} ${s.ey+28} ${s.ex-30} ${s.ey}" fill="#e8f3ff"/><circle cx="${s.ex}" cy="${s.ey}" r="10" fill="#162b46"/>`+handle('eye',s.ex,s.ey,D.ink,34);
    h+=L(ox,465,mx,465,{stroke:D.object,w:1.5,dash:'5 5'})+L(mx,465,ix,465,{stroke:D.image,w:1.5,dash:'5 5'})+T((ox+mx)/2,488,`${s.d} cm`,{size:16,fill:D.object,anchor:'middle'})+T((ix+mx)/2,488,`${s.d} cm`,{size:16,fill:D.image,anchor:'middle'});
    if(!s.on)h+=T(680,250,'關燈時沒有光進入眼睛，看不到像',{size:17,fill:D.muted,anchor:'middle'});
    const reads=s.beam==='single'?[['入射角 = 反射角',`${ang.toFixed(0)}°`],['物距 = 像距',`${s.d} cm`],['像的性質','正立・等大・左右相反・虛像']]:[['物距 = 像距',`${s.d} cm`],['物與像的距離',`${s.d*2} cm`],['像的性質','正立・等大・左右相反・虛像']];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:s.beam==='single'?(s.rev?'<b>光的可逆</b>：光從反射光的方向射回去，會沿原路回到物體。':'<b>入射角 = 反射角</b>（從法線量起）。拖動鏡面上的圓圈換一條光線。'):'所有反射光的<b>反向延長線</b>都交在同一點 → 虛像。'};}},

/* ===== 4-2 凹面鏡與凸面鏡 ===== */
curved:{group:2,n:'4-2',name:'凹面鏡與凸面鏡',subtitle:'從每一條光的反射看懂焦點，再用主要光線找出像。',dark:true,keep:['type','beam'],
  q:['為什麼平行光照到凹面鏡，反射後會聚在同一點？','鏡面上每一點的法線都通過球心 C。每條平行光在自己的反射點遵守「入射角 = 反射角」，反射後就都經過同一點：焦點 F（約在 C 與鏡面的中點）。凸面鏡則是反射光散開，延長線交於鏡後的虛焦點。'],
  state:{on:true,prog:0,type:1,beam:'parallel',normals:true,hy:90,u:200,f:80,oh:30},
  controls:[LAMP,
    {type:'seg',key:'type',label:'面鏡',options:[[1,'凹面鏡'],[-1,'凸面鏡']],onChange:replay},
    {type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['parallel','平行光'],['main','主要光線'],['full','全光']],onChange:replay},
    {type:'toggle',key:'normals',label:'顯示法線（都指向球心 C）',show:s=>s.beam==='single'||s.beam==='parallel'},
    {type:'range',key:'u',label:'物距',min:20,max:360,step:1,unit:' cm',show:s=>s.beam==='main'||s.beam==='full'},
    {type:'range',key:'f',label:'焦距',min:40,max:140,step:1,unit:' cm',show:s=>s.beam==='main'||s.beam==='full'},
    {type:'range',key:'oh',label:'物高',min:10,max:50,step:1,unit:' cm',show:s=>s.beam==='main'||s.beam==='full'},
    {type:'buttons',label:'物體放在',items:[['2F 以外',s=>{s.u=snap('u',s.f*2.6);}],['2F 上',s=>{s.u=snap('u',s.f*2);}],['F 與 2F 之間',s=>{s.u=snap('u',s.f*1.5);}],['F 上',s=>{s.u=snap('u',s.f);}],['F 以內',s=>{s.u=snap('u',s.f*0.55);}]],show:s=>s.type===1&&(s.beam==='main'||s.beam==='full')}],
  tick:LIGHT_TICK,
  drag:{hit:(p,s)=>{s.hy=clamp(250-p.y,-150,150);},obj:(p,s)=>{s.u=snap('u',(600-p.x)/1.15);},top:(p,s)=>{s.oh=snap('oh',(250-p.y)/2.4);}},
  render(s){
    beginLight(s);const cy=250,cc=s.type===1;let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(s.beam==='single'||s.beam==='parallel'){
      /* 真實球面：每一點的法線都通過球心；凸面鏡往左放，讓鏡後的 F 留在畫面內 */
      const R=520,V=cc?760:540,Cx=cc?V-R:V+R,arcX=dy=>cc?Cx+Math.sqrt(R*R-dy*dy):Cx-Math.sqrt(R*R-dy*dy),Fx=cc?V-R/2:V+R/2;
      let arc='';for(let dy=-175;dy<=175;dy+=5)arc+=(dy===-175?'M':'L')+arcX(dy).toFixed(1)+' '+(cy-dy);
      for(let dy=-170;dy<=170;dy+=17){const x=arcX(dy);h+=L(x+3,cy-dy,x+13,cy-dy-8,{stroke:'#6f8196',w:1.5});}
      h+=`<path d="${arc}" fill="none" stroke="${D.ray}" stroke-width="5"/>`;
      h+=`<circle cx="${Fx}" cy="${cy}" r="5" fill="${D.object}"/>`+T(Fx,cy+28,cc?'F':'F（虛焦點）',{size:17,fill:D.object,anchor:'middle',weight:700});
      h+=Cx<880?`<circle cx="${Cx}" cy="${cy}" r="5" fill="${D.muted}"/>`+T(Cx,cy+28,'C（球心）',{size:15,fill:D.muted,anchor:'middle',halo:true}):T(885,40,'C 在右方畫面外 →',{size:14,fill:D.muted,anchor:'end'});
      /* 平行光只取主軸附近 ±100，反射後都經過 F */
      const hs=s.beam==='single'?[s.hy]:[-100,-75,-50,-25,0,25,50,75,100];let rays='',exts='',norms='',ang=0;
      for(const dy of hs){const y=cy-dy,x=arcX(dy),n=cc?[(Cx-x)/R,(cy-y)/R]:[(x-Cx)/R,(y-cy)/R],dot=n[0],r=[1-2*dot*n[0],-2*dot*n[1]],t=(x-20)/-r[0],end=[x+r[0]*t,y+r[1]*t];
        rays+=ray([[20,y],[x,y],end],s.beam==='single'?D.object:'#ffe8a5',{w:s.beam==='single'?3.5:2,arrow:s.beam==='single',op:s.beam==='single'?1:.85});
        if(!cc)exts+=L(x,y,Fx,y-r[1]*(Fx-x)/-r[0],{stroke:'#ffe8a5',w:1.4,dash:'6 6',op:.7});
        if(s.normals)norms+=cc?L(x,y,Cx,cy,{stroke:D.muted,w:1.2,dash:'3 5',op:.55}):L(x,y,x+(x-Cx)*-0.4,y+(y-cy)*-0.4,{stroke:D.muted,w:1.2,dash:'3 5',op:.55})+L(x,y,x+n[0]*60,y+n[1]*60,{stroke:D.muted,w:1.2,dash:'3 5',op:.55});
        if(s.beam==='single'){ang=deg(Math.acos(Math.abs(n[0])));const pp=[-n[1],n[0]],side=Math.sign(-pp[0])||1,at=(sg)=>[x+n[0]*85+pp[0]*sg*side*22,y+n[1]*85+pp[1]*sg*side*22+5];
          if(dy!==0&&arrived()){const[a1,a2]=at(1),[b1,b2]=at(-1);h+=T(a1,a2,`入 ${ang.toFixed(0)}°`,{size:14,fill:D.object,anchor:'middle'})+T(b1,b2,`反 ${ang.toFixed(0)}°`,{size:14,fill:D.ink,anchor:'middle'});}}}
      const fade=fadeIn();h+=norms+rays;if(!cc&&fade>0)h+=`<g opacity="${fade}">${exts}</g>`;
      if(s.beam==='single')h+=handle('hit',arcX(s.hy),cy-s.hy,D.object,11);
      if(!s.on)h+=T(300,120,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
      const reads=s.beam==='single'?[['入射角 = 反射角',`${ang.toFixed(1)}°`],['這點的法線','通過球心 C'],['焦點 F','鏡面到 C 的一半']]:[['平行光反射後',!s.on?'（開燈後觀察）':cc?'會聚於 F':'散開'],['焦點種類',cc?'實焦點':'虛焦點（鏡後）'],['F 的位置','鏡面與 C 的中點']];
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
        note:s.beam==='single'?'拖動鏡面上的圓圈：每一點的法線方向不同，但都遵守<b>入射角 = 反射角</b>。':cc?'每條光都遵守反射定律；因為法線都指向 C，反射光都經過 <b>F</b>。<small>（延伸：離主軸很遠的光會稍微偏離 F，叫球面像差。）</small>':'反射光散開，它們的<b>反向延長線</b>交於鏡後的 F（虛焦點）。'};
    }
    /* 成像：近軸光線 */
    const V=600,f=s.type*s.f,u=s.u,oh=s.oh,inf=Math.abs(u-f)<1e-9,v=inf?null:f*u/(u-f),m=inf?null:-v/u,X=d=>V-d*1.15,Y=y=>cy-y*2.4,E=(V-20)/1.15,P=([d,y])=>[X(d),Y(y)],outEnd=yh=>[E,yh+(inf?-oh/u:(m*oh-yh)/v)*E];
    for(const k of[1,2]){const d=k*f,x=X(d);h+=L(x,cy-7,x,cy+7,{stroke:D.muted,w:2})+T(x,cy+28,k===1?'F':'C（2F）',{size:15,fill:D.muted,anchor:'middle'});}
    h+=`<path d="M${V+(cc?-12:12)} 60Q${V+(cc?12:-12)} 250 ${V+(cc?-12:12)} 440" fill="none" stroke="${D.ray}" stroke-width="5"/>`;for(let y=70;y<=430;y+=20)h+=L(V+8,y,V+18,y-8,{stroke:'#6f8196',w:1.5});
    const hits=[];
    if(s.on){if(s.beam==='main'){hits.push([oh,D.ray,0]);const y2=inf?null:f*oh/(f-u);if(!inf&&Math.abs(y2)<400)hits.push([y2,D.third,f]);if(Math.abs(2*f-u)>1e-6){const yc=oh*2*f/(2*f-u);if(Math.abs(yc)<400)hits.push([yc,D.second,2*f]);}}
      else for(let i=0;i<11;i++)hits.push([-72+i*14.4,'#ffe8a5']);
      for(const[yh,c]of hits)h+=ray([P([u,oh]),P([0,yh]),P(outEnd(yh))],c,{w:s.beam==='main'?3:1.8,arrow:s.beam==='main',op:s.beam==='main'?1:.8});}
    const fade=fadeIn(),onStage=!inf&&X(v)>20&&X(v)<880,tipY=inf?cy:Y(m*oh);
    if(fade>0&&!inf&&v<0)for(const[yh,c]of hits)h+=L(X(0),Y(yh),X(v),Y(m*oh),{stroke:c,w:1.6,dash:'7 6',op:.85*fade});
    /* 凸面鏡：平行光的延長線通過鏡後 F；射向 F、C 的光，虛線畫到鏡後（C 線從像接著畫，不和延長線重疊） */
    if(fade>0&&!cc&&s.beam==='main')for(const[yh,c,d]of hits)h+=d===f?L(X(0),Y(yh),X(f),cy,{stroke:c,w:1.4,dash:'3 5',op:.7*fade}):d?L(X(v),Y(m*oh),X(d),cy,{stroke:c,w:1.4,dash:'3 5',op:.7*fade}):L(X(v),Y(m*oh),X(f),cy,{stroke:c,w:1.6,dash:'7 6',op:.85*fade});
    if(fade>0&&onStage)h+=`<g opacity="${fade}">${vArrow(X(v),cy,Y(m*oh),D.image,{dash:v<0?'7 6':false})}${T(X(v),m<0?Math.max(Y(m*oh)+30,cy+52):Y(m*oh)-16,v>0?'實像':'虛像',{size:20,fill:D.image,anchor:'middle',weight:600})}</g>`;
    h+=`<g opacity="${s.on?1:.35}">${vArrow(X(u),cy,Y(oh),D.object)}</g>`+T(X(u),Y(oh)-18,'物',{size:20,fill:D.object,anchor:'middle'})+handle('obj',X(u),cy,D.object)+handle('top',X(u),Y(oh),D.object,10);
    if(fade>0&&inf)h+=T(450,480,'物體在焦點上：反射光平行，不成像',{size:19,fill:D.object,anchor:'middle'});else if(fade>0&&!onStage)h+=T(450,480,'像在畫面外，請看右側「像的位置」',{size:18,fill:D.image,anchor:'middle'});
    else if(fade>0&&(tipY<20||tipY>480))h+=T(450,tipY>480?36:480,'像太大，超出畫面（看右側數值）',{size:18,fill:D.image,anchor:'middle'});
    const prop=inf?'不成像':`${v>0?'倒立':'正立'}・${Math.abs(Math.abs(m)-1)<1e-6?'等大':Math.abs(m)>1?'放大':'縮小'}・${v>0?'實像':'虛像'}`,off='（開燈後觀察）';
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['像的位置',!s.on?off:inf?'不成像':v>0?`鏡前 ${num(v)} cm`:`鏡後 ${num(-v)} cm`],['像高 ÷ 物高',!s.on||inf?'—':`${num(Math.abs(m),2)} 倍`],['成像',!s.on?'—':prop]],
      note:s.beam==='main'?(cc?'平行主軸的光 → 反射後經過 F；經過 F 的光 → 反射後平行主軸；經過 C 的光 → 原路反射。':'平行主軸的光 → 反射光的<b>反向延長線</b>通過鏡後的 F；射向鏡後 F 的光 → 反射後平行主軸；射向 C 的光 → 原路反射。凸面鏡的像都是<b>正立、縮小的虛像</b>。')
        :inf?'物體在焦點上：反射光互相平行，不會交在一點 → <b>不成像</b>。':'物體同一點發出的光，反射後（或延長線）交在同一點 → 像。'};}},
/* ===== 09 折射 ===== */
refraction:{group:2,n:'4-3',name:'光的折射',subtitle:'單束光看折射角，波前看光為什麼轉彎；「全光」從一點發光，找出全反射從哪裡開始（全反射為延伸內容）。',dark:true,keep:['beam'],
  q:s=>s.beam==='full'?['（延伸）光由水射向空氣，一定會折射出去嗎？','不一定。光從光速<b>慢</b>的水射向光速<b>快</b>的空氣，折射光偏離法線；入射角大於<b>臨界角</b>時，沒有折射光、全部反射回水中，這就是<b>全反射</b>。']:['把鉛筆斜插進水杯，從旁邊看為什麼好像在水面「折斷」了？','鉛筆水中那一段的光，從水射進空氣時<b>折射</b>（光速變快，偏離法線）；眼睛以為光是沿直線射來的，看到的位置比實際淺 → 好像在水面折斷。池底看起來比實際淺，也是同樣的原因。'],
  state:{on:true,beam:'single',prog:0,m1:'air',m2:'water',a:40,sx:330,sy:120,rev:false,view:'ray',wt:0,slowW:false,cart:true,col:'mono'},
  controls:[LAMP,{...BEAM,options:[['single','單束光'],['full','全光（全反射・延伸）']]},
    {type:'seg',key:'m1',label:'上方介質（光從這裡來）',options:Object.entries(MEDIA).map(([k,v])=>[k,v[0]]),onChange:replay},
    {type:'seg',key:'m2',label:'下方介質',options:Object.entries(MEDIA).map(([k,v])=>[k,v[0]]),onChange:replay},
    {type:'buttons',label:'',items:[['⇅ 上下互換',s=>{[s.m1,s.m2]=[s.m2,s.m1];s.prog=0;}]]},
    {type:'buttons',label:'',items:[['試試：光從水中射向空氣',s=>{s.m1='water';s.m2='air';replay(s);}]],show:s=>s.beam==='full'},
    {type:'seg',key:'view',label:'看法',options:[['ray','光線'],['wave','波前（外圈內圈）']],show:s=>s.beam==='single'},
    {type:'range',key:'a',label:'入射角 θ₁',min:0,max:89,step:1,unit:'°',show:s=>s.beam==='single'},
    {type:'toggle',key:'rev',label:'光的可逆（從下方射回去）',show:s=>s.beam==='single'&&s.view!=='wave',onChange:replay},
    {type:'seg',key:'col',label:'光的顏色',options:[['mono','單色光'],['rv','紅光 vs 紫光（色散）']],show:s=>s.beam==='single'&&s.view==='wave'},
    {type:'toggle',key:'cart',label:'畫成推車的兩個輪子',show:s=>s.beam==='single'&&s.view==='wave'},
    {type:'toggle',key:'slowW',label:'慢動作',show:s=>s.beam==='single'&&s.view==='wave'}],
  tick:(s,dt)=>{LIGHT_TICK(s,dt);s.wt+=dt*(s.slowW?0.3:1);},
  drag:{ray:(p,s)=>{const dx=450-p.x,dy=250-p.y;s.a=dy<=0?89:snap('a',deg(Math.atan2(Math.max(0,dx),dy)));},src:(p,s)=>{s.sx=clamp(p.x,40,860);s.sy=clamp(p.y,40,225);}},
  /* 紫光在空氣以外的介質都比紅光慢一點（折射率稍大，差異已放大）；空氣不變 */
  nOf:(k,col)=>{const n=MEDIA[k][1];return col==='v'&&n>1?n+0.12*(n-1)/0.5:n;},
  mLabel:(nm,n)=>`${nm}<tspan font-size="15" font-weight="400">　光速約 ${(3/n).toFixed(2)}×10⁸ m/s</tspan>`,
  wave(s){
    /* 惠更斯波前：同一道波前，先進入介質 2 的那一端改用 v2 前進，還在介質 1 的那一端仍用 v1 */
    const[n1Name,n1,c1]=MEDIA[s.m1],[n2Name,n2,c2]=MEDIA[s.m2],cx=450,cy=250,a=rad(Math.min(s.a,75)),V=170,PER=0.55,W=220,t=s.wt,same=s.m1===s.m2;
    let h=`<rect x="10" y="10" width="880" height="240" fill="${c1}"/><rect x="10" y="250" width="880" height="232" fill="${c2}"/>`+L(10,cy,890,cy,same?{stroke:'#d7edff',w:1.5,dash:'4 8',op:.35}:{stroke:'#d7edff',w:2})+L(cx,30,cx,470,{stroke:D.muted,w:1.5,dash:true,op:.7});
    h+=T(870,52,this.mLabel(n1Name,n1),{size:19,fill:D.ink,weight:600,anchor:'end'})+T(870,462,this.mLabel(n2Name,n2),{size:19,fill:D.ink,weight:600,anchor:'end'});
    const rv=s.col==='rv',sets=rv?[['r','#ff5a4f','紅光'],['v','#c77dff','紫光']]:[['r',D.ray,'']];
    const u1=[Math.sin(a),Math.cos(a)],p1=[Math.cos(a),-Math.sin(a)],sa=Math.sin(a),ca=Math.cos(a);
    /* 每種色光在上、下兩種介質各有自己的光速 */
    const info=sets.map(([k,col,name])=>{const m1=this.nOf(s.m1,k),nn=this.nOf(s.m2,k),q=m1*sa/nn,tir=q>1+1e-12;return{nn,col,name,v1:V/m1,v2:V/nn,tir,b:tir?null:Math.asin(Math.min(1,q))};}),same1=info.every(I=>I.v1===info[0].v1),tirs=info.filter(J=>J.tir),nm=xs=>xs.map(J=>J.name).join('、');
    const tcOf=(tau,q,I)=>tau+q*sa/(I.v1*ca),pos=(tau,q,I)=>{const tc=tcOf(tau,q,I);if(t<tc)return{m:1,p:[cx+q*p1[0]+I.v1*(t-tau)*u1[0],cy+q*p1[1]+I.v1*(t-tau)*u1[1]]};if(I.tir)return null;const u2=[Math.sin(I.b),Math.cos(I.b)];return{m:2,p:[cx+q/ca+I.v2*(t-tc)*u2[0],cy+I.v2*(t-tc)*u2[1]]};};
    if(s.on){
      /* 中心光線（垂直於波前）*/
      h+=L(cx-u1[0]*320,cy-u1[1]*320,cx,cy,{stroke:'#ffe8a5',w:2,op:.55});
      info.forEach(I=>{if(!I.tir)h+=L(cx,cy,cx+Math.sin(I.b)*260,cy+Math.cos(I.b)*260,{stroke:I.col,w:2.5,op:.8,arrow:true});});
      const k0=Math.floor((t-4.5)/PER);
      for(let k=k0;k<k0+Math.ceil(9/PER);k++){const tau=k*PER;
        info.forEach((I,ii)=>{let seg1=[],seg2=[];for(let j=0;j<=30;j++){const q=-W/2+W*j/30,r=pos(tau,q,I);if(!r)continue;(r.m===1?seg1:seg2).push(r.p);}
          if(sa>1e-6){const qs=(t-tau)*I.v1*ca/sa;if(qs>-W/2&&qs<W/2){const X=[cx+qs/ca,cy];seg1.push(X);if(!I.tir)seg2.unshift(X);}}
          const pl=(pts,c,wd)=>pts.length>1?`<polyline points="${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="${wd}" stroke-linecap="round"/>`:'';
          if(ii===0||!same1)h+=pl(seg1,same1?'#ffe8a5':I.col,3);h+=pl(seg2,I.col,3);});}
      /* 標出正在跨越交界的那一道波前：外圈 vs 內圈 */
      const I=info[0];
      if(sa>0.02&&!I.tir){const span=W/2*sa/(I.v1*ca),k=Math.round(t/PER);let best=null;for(let kk=k-6;kk<=k+6;kk++){const tau=kk*PER;if(t>tau-span&&t<tau+span&&(best===null||Math.abs(t-tau)<Math.abs(t-best)))best=tau;}
        if(best!==null){const A=pos(best,W/2,I),B=pos(best,-W/2,I),dt=0.45,u2=[Math.sin(I.b),Math.cos(I.b)];
          const ends=[A,B].map(e=>({p:e.p,m:e.m,v:e.m===1?I.v1:I.v2,u:e.m===1?u1:u2})),fast=ends[0].v>=ends[1].v?0:1;
          if(s.cart)h+=L(ends[0].p[0],ends[0].p[1],ends[1].p[0],ends[1].p[1],{stroke:'#c9d3df',w:5})+ends.map(e=>`<circle cx="${e.p[0]}" cy="${e.p[1]}" r="11" fill="#2b3442" stroke="#c9d3df" stroke-width="3"/>`).join('');
          ends.forEach((e,i)=>{const q=[e.p[0]+e.u[0]*e.v*dt,e.p[1]+e.u[1]*e.v*dt],isF=i===fast,c=isF||same?'#ffcc6a':'#9be38b';
            h+=L(e.p[0],e.p[1],q[0],q[1],{stroke:c,w:4,arrow:true})+`<circle cx="${e.p[0]}" cy="${e.p[1]}" r="6" fill="${c}"/>`+T(i===0?Math.min(788,q[0]+14):Math.max(112,q[0]-14),Math.min(486,q[1]+(e.m===1?-10:22)),same?'兩端一樣快':isF?'外圈：走得多':'內圈：走得少',{size:16,fill:c,anchor:i===0?'start':'end',weight:700});});}}
      if(tirs.length)h+=T(cx+60,tirs.length===info.length?cy+110:cy+170,tirs.length===info.length?'全反射：沒有折射波':`${nm(tirs)}全反射，只剩${nm(info.filter(J=>!J.tir))}折射出去`,{size:22,fill:D.object,weight:700});
      if(s.a===0&&!same)h+=T(cx,cy+150,`垂直入射：整道波前同時${n2>n1?'變慢':'變快'}，不轉彎`,{size:18,fill:D.ink,anchor:'middle',weight:600});
    }else h+=T(450,140,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
    if(s.a>75)h+=T(30,52,`波前圖最大畫到 75°（滑桿是 ${s.a}°）`,{size:17,fill:D.object,weight:600});
    const I=info[0],ang=x=>x===null?'全反射':`${deg(x).toFixed(1)}°`,inc=s.a>75?'75°（波前圖最大）':`${s.a}°`;
    /* 結論看紅、紫光實際偏折了多少：|θ₂ − θ₁| */
    const dev=info.map(J=>J.tir?0:Math.abs(J.b-a)),concl=same?'同一種介質，不偏折也不色散':tirs.length?(tirs.length===info.length?'兩種色光都全反射':`${nm(tirs)}先全反射`):s.a===0?'垂直入射，不偏折也不色散':dev[1]>dev[0]?'紫光偏折較多':'紅光偏折較多';
    const reads=rv?[['入射角',inc],['紅光折射角',ang(info[0].b)],['紫光折射角',ang(info[1].b)],['結論',concl]]
      :[['入射角',inc],['光速',`${(3/n1).toFixed(2)} → ${(3/n2).toFixed(2)} ×10⁸ m/s`],['波長',`λ₂ = λ₁ × ${(n1/n2).toFixed(2)}`],['折射角',ang(I.b)]];
    const note=same?`兩邊是同一種介質 → 光速一樣，波前不轉彎（不偏折${rv?'，也不色散':''}）。`
      :s.a===0?`垂直入射：整道波前同時${n2>n1?'變慢':'變快'}，方向不變 → 不偏折${rv?'，紅光、紫光也不會分開':''}。`
      :tirs.length===info.length?'光從光速慢的介質射向光速快的介質，入射角超過<b>臨界角</b> → 波前進不去，全部反射回來（<b>全反射</b>）。'
      :tirs.length?'光從光速慢的介質射向光速快的介質：紫光的<b>臨界角</b>比紅光小 → <b>紫光先全反射</b>，只剩紅光折射出去。（差異已放大）'
      :rv?'紫光在水、玻璃、鑽石中都比紅光<b>更慢</b>（在空氣中一樣快）→ 跨過界面時紫光的光速變化較大、<b>轉得更多</b> → 不同顏色分開，這就是<b>色散</b>。（差異已放大）'
      :n2>n1?'同一道波前：<b>外圈</b>還在快的介質、走得多；<b>內圈</b>先進入慢的介質、走得少 → 波前轉彎，光線（垂直波前）偏向法線。波前也變密（波長變短）。'
      :'反過來進入快的介質：先進去的一端變快、走得多 → 波前往另一邊轉，光線偏離法線。';
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  render(s){
    if(s.beam==='single'&&s.view==='wave')return this.wave(s);
    beginLight(s);
    const[n1Name,n1,c1]=MEDIA[s.m1],[n2Name,n2,c2]=MEDIA[s.m2],cx=450,cy=250,Ln=210,crit=n1>n2?deg(Math.asin(n2/n1)):null,same=s.m1===s.m2;
    let h=`<rect x="10" y="10" width="880" height="240" fill="${c1}"/><rect x="10" y="250" width="880" height="232" fill="${c2}"/>`+L(10,cy,890,cy,same?{stroke:'#d7edff',w:1.5,dash:'4 8',op:.35}:{stroke:'#d7edff',w:2});
    h+=T(870,52,this.mLabel(n1Name,n1),{size:19,fill:D.ink,weight:600,anchor:'end'})+T(870,462,this.mLabel(n2Name,n2),{size:19,fill:D.ink,weight:600,anchor:'end'});
    const bend=inc=>{const q=n1*Math.sin(inc)/n2;return q>1+1e-12?null:Math.asin(Math.min(1,q));};
    if(s.beam==='single'){
      const a=rad(s.a),b=bend(a),tir=b===null,sx=cx-Ln*Math.sin(a),sy=cy-Ln*Math.cos(a);
      h+=L(cx,30,cx,470,{stroke:D.muted,w:2,dash:true})+T(cx+12,46,'法線',{size:16,fill:D.muted});
      if(crit!==null){const cr=rad(crit);h+=L(cx,cy,cx-Ln*Math.sin(cr),cy-Ln*Math.cos(cr),{stroke:'#ffffff',w:1.5,dash:'3 6',op:.5})+T(cx-(Ln+12)*Math.sin(cr),cy-(Ln+12)*Math.cos(cr),`臨界角 ${crit.toFixed(1)}°`,{size:14,fill:D.muted,anchor:'end'});}
      if(s.on&&s.rev&&!tir)h+=ray([[cx+Ln*Math.sin(b),cy+Ln*Math.cos(b)],[cx,cy],[sx,sy]],D.ray,{w:4});
      else if(s.on){if(!same)h+=ray([[sx,sy],[cx,cy],[cx+Ln*Math.sin(a),cy-Ln*Math.cos(a)]],D.second,{w:tir?4:2.5,op:tir?1:.55});if(!tir)h+=ray([[sx,sy],[cx,cy],[cx+Ln*Math.sin(b),cy+Ln*Math.cos(b)]],D.ray,{w:4});else h+=ray([[sx,sy],[cx,cy]],D.object,{w:4});}
      const arc=(r,st,en,c)=>`<path d="M${cx+r*Math.cos(st)} ${cy+r*Math.sin(st)}A${r} ${r} 0 0 1 ${cx+r*Math.cos(en)} ${cy+r*Math.sin(en)}" fill="none" stroke="${c}" stroke-width="2"/>`;
      if(s.on&&arrived()){if(s.a>0)h+=arc(64,-Math.PI/2-a,-Math.PI/2,D.object);h+=T(cx-110,cy-80,`${s.a}°`,{size:19,fill:D.object,anchor:'end'});
        if(!tir){if(b>0.001)h+=arc(70,Math.PI/2-b,Math.PI/2,D.ray);h+=T(cx+90,cy+120,`${deg(b).toFixed(1)}°`,{size:19,fill:D.ray});}else h+=T(cx+60,cy+110,'全反射：沒有折射光',{size:22,fill:D.object,weight:700});}
      h+=`<circle cx="${sx}" cy="${sy}" r="8" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+handle('ray',sx,sy,D.object);
      const path=!s.on?'—':tir?'全反射':same?'不偏折':s.a===0?'垂直入射，不偏折':n2>n1?'偏向法線':'偏離法線';
      /* 國中用光速快慢說明；折射定律只當延伸 */
      const why=s.a===0?'<b>垂直入射</b>：光速改變，但方向不變 → 不偏折。':n2>n1?'光從光速<b>快</b>的介質斜射進入光速<b>慢</b>的介質 → 折射光<b>偏向法線</b>（折射角 ＜ 入射角）。':'光從光速<b>慢</b>的介質斜射進入光速<b>快</b>的介質 → 折射光<b>偏離法線</b>（折射角 ＞ 入射角）。';
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['入射角',`${s.a}°`],['折射角',tir?'—':`${deg(b).toFixed(1)}°`],...(crit===null?[]:[['臨界角（延伸）',`${crit.toFixed(1)}°`]]),['光的路徑',path]],
        note:tir?'光從光速<b>慢</b>的介質射向光速<b>快</b>的介質，入射角 ＞ <b>臨界角</b> → 沒有折射光，全部反射回來（<b>全反射</b>）。':same?'兩邊是同一種介質 → 光直直前進，不偏折。':s.rev?'<b>光的可逆</b>：沿折射光的反方向射回去，光會沿原路回到光源。':`${why}<br><small>延伸（高中）：n₁ sin θ₁ = n₂ sin θ₂，${n1.toFixed(2)} × sin ${s.a}° = ${n2.toFixed(2)} × sin ${deg(b).toFixed(1)}°</small>`};
    }
    let nOut=0,nTir=0;
    if(s.on)for(let d=-80;d<=80;d+=4){const th=rad(d),hx=s.sx+(cy-s.sy)*Math.tan(th),sg=Math.sign(d),inc=Math.abs(th),b=bend(inc);
      const up=[hx+Math.sin(th)*(cy-10)/Math.cos(th),10];
      if(b===null){nTir++;h+=ray([[s.sx,s.sy],[hx,cy],up],D.object,{w:1.8,op:.9,arrow:false});}
      else{nOut++;if(!same)h+=ray([[s.sx,s.sy],[hx,cy],up],D.second,{w:1.2,op:.18,arrow:false});h+=ray([[s.sx,s.sy],[hx,cy],[hx+sg*Math.tan(b)*(480-cy),480]],D.ray,{w:1.8,op:.8,arrow:false});}}
    h+=`<circle cx="${s.sx}" cy="${s.sy}" r="10" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+(s.on?`<circle cx="${s.sx}" cy="${s.sy}" r="24" fill="#ffe8a5" opacity=".25"/>`:'')+handle('src',s.sx,s.sy,D.object,16);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['臨界角（延伸）',crit===null?'不會全反射':`${crit.toFixed(1)}°`],['折射出去',s.on?`${nOut} / ${nOut+nTir} 條`:'—'],['全反射（黃）',s.on?`${nTir} / ${nOut+nTir} 條`:'—']],
      note:same?'兩邊是同一種介質 → 光直直前進，不偏折。':crit===null?'光從光速快的介質進入光速慢的介質：每一條都能折射進去，斜射的光都<b>偏向法線</b>。':'光從光速慢的介質射向光速快的介質：越斜的光入射角越大；超過<b>臨界角</b>的光（黃色）全部反射回來（<b>全反射</b>）。拖動光源試試。'};}},

/* ===== 4-4 透鏡成像 ===== */
lens:{group:2,n:'4-4',name:'透鏡成像',subtitle:'透鏡靠折射讓光偏折：先看光為什麼會偏、找出焦點，再看像怎麼形成，最後用光具座做實驗。',dark:true,
  q:s=>s.mode==='image'?{html:lensTableHTML(s)+quizHTML(s,LENS_QUIZ)}:s.mode==='bench'?{html:quizHTML(s,LENS_QUIZ)}:LENS_Q[s.mode],
  qAction(s,v){if(v==='tab'){s.tab=!s.tab;return;}quizAction(s,v,LENS_QUIZ);},
  state:{on:true,prog:0,mode:'why',type:1,wbeam:'parallel',bulge:3,prisms:false,wnorm:false,wy:80,side:'left',terms:true,paper:false,pd:120,
    beam:'main',f:80,u:200,oh:30,aim:20,block:false,sweep:null,tab:false,su:null,bf:10,bu:30,bv:10,log:[],flash:'',flashT:0,qi:0,qp:null,qc:false,qs:false},
  controls:[LAMP,
    {type:'seg',key:'mode',label:'實驗',options:[['why','為什麼會偏折'],['focus','焦點與焦距'],['image','成像'],['bench','光具座實驗']],onChange:s=>{s.prog=0;s.sweep=null;}},
    {type:'seg',key:'type',label:'透鏡',options:[[1,'凸透鏡'],[-1,'凹透鏡']],onChange:replay,show:s=>s.mode!=='bench'},
    {type:'seg',key:'wbeam',label:'光線',options:[['single','單束光'],['parallel','平行光']],onChange:replay,show:s=>s.mode==='why'},
    {type:'range',key:'bulge',label:'透鏡彎曲程度',min:1,max:5,step:1,fmt:s=>['很平','較平','中等','較彎','很彎'][s.bulge-1],show:s=>s.mode==='why'},
    {type:'toggle',key:'prisms',label:'看成一疊三稜鏡',onChange:replay,show:s=>s.mode==='why'},
    {type:'toggle',key:'wnorm',label:'顯示法線',show:s=>s.mode==='why'&&s.wbeam==='parallel'},
    {type:'seg',key:'side',label:'平行光從',options:[['left','左邊射入'],['right','右邊射入']],onChange:replay,show:s=>s.mode==='focus'},
    {type:'range',key:'f',label:'焦距 f',min:40,max:140,step:1,unit:' cm',show:s=>s.mode==='focus'||s.mode==='image'},
    {type:'toggle',key:'terms',label:'標示名詞（主軸、光心、焦點、焦距）',show:s=>s.mode==='focus'},
    {type:'toggle',key:'paper',label:'拿一張紙，找最亮的點',show:s=>s.mode==='focus'},
    {type:'range',key:'pd',label:'紙 → 透鏡',min:10,max:170,step:1,unit:' cm',show:s=>s.mode==='focus'&&s.paper},
    {type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['main','主要光線'],['full','全光']],onChange:replay,show:s=>s.mode==='image'},
    {type:'range',key:'u',label:'物距',min:20,max:360,step:1,unit:' cm',show:s=>s.mode==='image'},
    {type:'range',key:'oh',label:'物高',min:10,max:50,step:1,unit:' cm',show:s=>s.mode==='image'},
    {type:'buttons',label:'把物體放到',items:[['2F 以外',s=>{s.u=snap('u',s.f*2.6);s.sweep=null;}],['2F 上',s=>{s.u=snap('u',s.f*2);s.sweep=null;}],['F 與 2F 之間',s=>{s.u=snap('u',s.f*1.5);s.sweep=null;}],['F 上',s=>{s.u=snap('u',s.f);s.sweep=null;}],['F 以內',s=>{s.u=snap('u',s.f*0.55);s.sweep=null;}]],show:s=>s.mode==='image'&&s.type===1},
    {type:'buttons',label:'',items:[['▶ 物體從遠處慢慢靠近',s=>{s.sweep=0;s.su=null;}]],show:s=>s.mode==='image',primary:true},
    {type:'toggle',key:'block',label:'用黑紙遮住透鏡上半部',onChange:replay,show:s=>s.mode==='image'&&s.beam!=='single'},
    {type:'seg',key:'bf',label:'凸透鏡的焦距',options:[[10,'10 cm'],[15,'15 cm']],onChange:s=>{s.log=[];},show:s=>s.mode==='bench'},
    {type:'range',key:'bu',label:'蠟燭 → 透鏡（物距）',min:4,max:50,step:1,unit:' cm',show:s=>s.mode==='bench'},
    {type:'range',key:'bv',label:'透鏡 → 紙屏',min:4,max:50,step:0.5,unit:' cm',show:s=>s.mode==='bench'},
    {type:'buttons',label:'',items:[['📋 記錄這一次',s=>benchLog(s)]],show:s=>s.mode==='bench',primary:true},
    {type:'buttons',label:'',items:[['🔍 幫我對焦',s=>{const v=s.bf*s.bu/(s.bu-s.bf);if(s.bu>s.bf&&v<=50)s.bv=snap('bv',v);else{s.flash=s.bu<=s.bf?'蠟燭在焦點上或焦點內，紙屏接不到像':'像太遠了，紙屏放不到';s.flashT=3;}}],['清除紀錄',s=>{s.log=[];}]],show:s=>s.mode==='bench'}],
  tick:(s,dt)=>{LIGHT_TICK(s,dt);if(s.flashT>0)s.flashT-=dt;
    if(s.sweep!==null){if(s.su!==null&&s.u!==s.su){s.sweep=null;return;}s.sweep=Math.min(1,s.sweep+dt/7);const e=1-Math.pow(1-s.sweep,2),to=s.type===1?s.f*1.08:20;s.u=s.su=snap('u',360-(360-to)*e);if(s.sweep>=1)s.sweep=null;}},
  drag:{obj:(p,s)=>{s.u=snap('u',(450-p.x)/1.15);s.sweep=null;},top:(p,s)=>{s.oh=snap('oh',(250-p.y)/2.4);},aim:(p,s)=>{s.aim=clamp((250-p.y)/2.4,-76,76);},
    wy:(p,s)=>{const m=s.type===1?118:110;s.wy=clamp(250-p.y,-m,m);},paper:(p,s)=>{s.pd=snap('pd',(p.x-450)*(s.side==='left'?1:-1)/2.4);},
    cand:(p,s)=>{s.bu=snap('bu',(450-p.x)/8);},scr:(p,s)=>{s.bv=snap('bv',(p.x-450)/8);}},
  /* 為什麼會偏折：真實的球面（或切成一疊三稜鏡），在兩個表面各用一次折射定律 */
  why(s){
    beginLight(s);
    const cc=s.type===1,cx=cc?340:560,cy=250,n=1.5,H=125,R=[500,420,350,300,260][s.bulge-1],sag=R-Math.sqrt(R*R-H*H),tc=cc?2*sag+6:8,xL=cx-tc/2,xR=cx+tc/2;
    const S1=cc?{c:xL+R,side:-1}:{c:xL-R,side:1},S2=cc?{c:xR-R,side:1}:{c:xR+R,side:-1},ax=(S,dy)=>S.c+S.side*Math.sqrt(R*R-dy*dy);
    const NB=7,E=k=>-H+k*2*H/NB,dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
    const refr=(d,N,n1,n2)=>{const nr=dot(N,d)>0?[-N[0],-N[1]]:N,ci=-dot(nr,d),k=n1/n2,t=1-k*k*(1-ci*ci);if(t<0)return null;const c=k*ci-Math.sqrt(t);return[k*d[0]+c*nr[0],k*d[1]+c*nr[1]];};
    const arcHit=(p,d,S)=>{const o=[p[0]-S.c,p[1]-cy],b=dot(o,d),D=b*b-dot(o,o)+R*R;if(D<0)return null;for(const t of[-b-Math.sqrt(D),-b+Math.sqrt(D)])if(t>1e-6){const q=[p[0]+d[0]*t,p[1]+d[1]*t];if(Math.sign(q[0]-S.c)===S.side)return{p:q,N:[(q[0]-S.c)/R,(q[1]-cy)/R]};}return null;};
    const segHit=(p,d,S,k)=>{const a=[ax(S,E(k)),cy+E(k)],b=[ax(S,E(k+1)),cy+E(k+1)],e=[b[0]-a[0],b[1]-a[1]],den=d[0]*e[1]-d[1]*e[0];if(Math.abs(den)<1e-9)return null;const t=((a[0]-p[0])*e[1]-(a[1]-p[1])*e[0])/den,l=Math.hypot(e[0],e[1]);return{p:[p[0]+d[0]*t,p[1]+d[1]*t],N:[e[1]/l,-e[0]/l]};};
    const trace=(y0,flat)=>{const p0=[20,y0],d0=[1,0],k=clamp(Math.floor((y0-cy+H)/(2*H/NB)),0,NB-1),hit=(p,d,S)=>flat?segHit(p,d,S,k):arcHit(p,d,S);
      const h1=hit(p0,d0,S1);if(!h1)return null;const d1=refr(d0,h1.N,1,n),h2=hit(h1.p,d1,S2);if(!h2)return null;const d2=refr(d1,h2.N,n,1);if(!d2)return null;
      return{pts:[p0,h1.p,h2.p,[h2.p[0]+d2[0]*1200,h2.p[1]+d2[1]*1200]],h1,h2,d0,d1,d2};};
    const par=trace(cy-1,false),fx=par?par.h2.p[0]+(cy-par.h2.p[1])*par.d2[0]/par.d2[1]:cx+(cc?R:-R);
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(s.prisms){for(let k=0;k<NB;k++){const a=E(k),b=E(k+1),q=[[ax(S1,a),cy+a],[ax(S2,a),cy+a],[ax(S2,b),cy+b],[ax(S1,b),cy+b]];h+=`<polygon points="${q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${k===3?'#61ddeb14':k%2?'#61ddeb34':'#61ddeb20'}" stroke="${D.ray}" stroke-width="2" stroke-linejoin="round"/>`;}}
    else{let d='';for(let dy=-H;dy<=H;dy+=5)d+=(dy===-H?'M':'L')+ax(S1,dy).toFixed(1)+' '+(cy+dy);for(let dy=H;dy>=-H;dy-=5)d+='L'+ax(S2,dy).toFixed(1)+' '+(cy+dy);h+=`<path d="${d}Z" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`;}
    h+=`<circle cx="${fx}" cy="${cy}" r="5" fill="${D.object}"/>`+T(clamp(fx,50,850),cy+28,cc?'F':'F（虛焦點）',{size:16,fill:D.object,anchor:'middle',weight:700,halo:true});
    const single=s.wbeam==='single',wy=clamp(s.wy,cc?-118:-110,cc?118:110),ys=single?[cy-wy]:s.prisms?Array.from({length:NB},(_,k)=>cy+E(k)+H/NB):[-3,-2,-1,0,1,2,3].map(k=>cy+k*H*0.18),tr=ys.map(y=>trace(y,s.prisms)).filter(Boolean);
    if(s.on)for(const t of tr)h+=ray(t.pts,single?D.object:'#ffe8a5',{w:single?3.5:2.2,arrow:single,op:.9});
    const fade=fadeIn();
    if(!cc&&fade>0)for(const t of tr){const back=(t.h2.p[0]-(fx-30))/t.d2[0];if(back>0)h+=L(t.h2.p[0],t.h2.p[1],t.h2.p[0]-t.d2[0]*back,t.h2.p[1]-t.d2[1]*back,{stroke:'#ffe8a5',w:1.3,dash:'6 6',op:.6*fade});}
    if((single||s.wnorm)&&s.on)for(const t of tr)for(const g of[t.h1,t.h2])h+=L(g.p[0]-g.N[0]*48,g.p[1]-g.N[1]*48,g.p[0]+g.N[0]*48,g.p[1]+g.N[1]*48,{stroke:D.muted,w:1.4,dash:'4 4',op:.85});
    if(s.prisms&&fade>0)h+=T(cx,58,cc?'每一塊三稜鏡，較厚的一邊（底）都朝向主軸':'每一塊三稜鏡，較厚的一邊（底）都朝外',{size:16,fill:D.ink,anchor:'middle',weight:700})+T(cx,cy+H+42,'中間那一塊是長方體 → 光直直穿過',{size:14,fill:D.muted,anchor:'middle'});
    const dev=t=>Math.abs(deg(Math.atan2(t.d2[1],t.d2[0])));
    if(single){h+=`<circle cx="20" cy="${cy-wy}" r="7" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+handle('wy',44,cy-wy,D.object,11);
      const t=tr[0];if(t&&fade>0&&dev(t)>0.5){const q=[t.h2.p[0]+t.d2[0]*170,t.h2.p[1]+t.d2[1]*170];h+=T(q[0]+12,q[1]+(t.d2[1]>0?-12:24),cc?'偏向較厚的中間':'偏向較厚的邊緣',{size:15,fill:D.object,weight:700});}}
    if(!s.on)h+=T(450,470,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
    const ang=(d,N)=>deg(Math.acos(clamp(Math.abs(dot(d,N)),0,1))).toFixed(0);
    let reads;
    if(single){const t=tr[0];reads=!t?[['光線','沒有穿過透鏡']]:[['第一面（空氣 → 玻璃）',`入射 ${ang(t.d0,t.h1.N)}° → 折射 ${ang(t.d1,t.h1.N)}°`],['第二面（玻璃 → 空氣）',`入射 ${ang(t.d1,t.h2.N)}° → 折射 ${ang(t.d2,t.h2.N)}°`],['總共偏轉',dev(t)<0.05?(Math.abs(wy)<1?'0°（沿主軸直進）':'0°（穿過中間的長方體，直直前進）'):`${dev(t).toFixed(1)}°，${(t.d2[1]>0)===(wy>0)?'偏向主軸':'偏離主軸'}`]];}
    else reads=[['透鏡的形狀',cc?'中間厚、邊緣薄':'中間薄、邊緣厚'],['平行光通過後',cc?'會聚':'發散'],['焦點',`${cc?'實焦點，在透鏡後方':'虛焦點，在透鏡前方'}，約 ${num(Math.abs(fx-cx)/10,0)} cm`]];
    const note=single?`光在透鏡的<b>兩個表面各折射一次</b>（就是 4-3 的折射）：進入玻璃時偏向法線，離開玻璃時偏離法線，兩次都把光推向<b>較厚的一邊</b>。拖動左邊的圓圈換高度。`
      :s.prisms?(cc?'把凸透鏡切成一疊<b>三稜鏡</b>：中間是長方體，光直直穿過；越外側的三稜鏡越斜，光偏折越多 → 全部偏向中間，<b>會聚</b>在焦點附近。':'凹透鏡也像一疊三稜鏡，只是較厚的一邊朝外 → 光都往外偏 → <b>發散</b>。')
      :(cc?'凸透鏡<b>中間厚、邊緣薄</b> → 光都偏向中間（主軸）→ <b>會聚</b>。透鏡越彎，偏折越多，焦點越近。（最外側的光會稍微偏離焦點，課本只看靠近主軸的光。）':'凹透鏡<b>中間薄、邊緣厚</b> → 光都偏向外側 → <b>發散</b>；反向延長線交在透鏡前方的<b>虛焦點</b>。');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  /* 焦點與焦距：理想薄透鏡 */
  focus(s){
    beginLight(s);
    const cx=450,cy=250,k=2.4,cc=s.type===1,fp=s.f*k,dir=s.side==='left'?1:-1,x0=cx-dir*430,Fo=cx+dir*fp,Fi=cx-dir*fp,t=clamp(5200/s.f,30,95),pX=cx+dir*s.pd*k;
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(cc)h+=`<path d="M${cx} 70Q${cx+t} ${cy} ${cx} 430Q${cx-t} ${cy} ${cx} 70" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`;
    else{const e=10+t*.35;h+=`<path d="M${cx-e} 70Q${cx+t*.35} ${cy} ${cx-e} 430L${cx+e} 430Q${cx-t*.35} ${cy} ${cx+e} 70Z" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`;}
    for(const x of[cx-fp,cx+fp])h+=L(x,cy-8,x,cy+8,{stroke:D.object,w:2.5})+T(x,cy+30,'F',{size:17,fill:D.object,anchor:'middle',weight:700});
    const hs=[-150,-120,-90,-60,-30,0,30,60,90,120,150];
    if(s.on)for(const y of hs){const dv=cc?[dir*fp,-y]:[dir*fp,y],l=Math.hypot(dv[0],dv[1]),u=[dv[0]/l,dv[1]/l];let te=(dir>0?885-cx:cx-15)/Math.abs(u[0]);if(s.paper)te=Math.min(te,Math.abs(pX-cx)/Math.abs(u[0]));
      h+=ray([[x0,cy+y],[cx,cy+y],[cx+u[0]*te,cy+y+u[1]*te]],'#ffe8a5',{w:1.8,arrow:false,op:.85});}
    const fade=fadeIn();
    if(!cc&&fade>0)for(const y of hs)if(y)h+=L(cx,cy+y,Fi,cy,{stroke:'#ffe8a5',w:1.2,dash:'6 6',op:.55*fade});
    let w=0;
    const hot=cc&&s.paper&&Math.abs(s.pd-s.f)<=1;
    if(s.paper){w=cc?150*Math.abs(1-s.pd/s.f):150*(1+s.pd/s.f);
      h+=`<g data-drag="paper" class="handle-body"><rect x="${pX-5}" y="40" width="10" height="420" rx="3" fill="#efe6c8"/></g>`;
      if(fade>0)h+=`<g opacity="${fade}">${hot?`<circle cx="${pX}" cy="${cy}" r="26" fill="#ffd27a" opacity=".45"/>`:''}<ellipse cx="${pX}" cy="${cy}" rx="5" ry="${Math.max(3,Math.min(w,210))}" fill="#fff7c2" opacity="${clamp(16/Math.max(w,3),.18,1)}"/></g>`;
      h+=handle('paper',pX,452,D.object,11);
      if(fade>=1){const flip=dir>0?pX>700:pX<200;h+=T(pX+(flip?-dir:dir)*16,cy-36,hot?'最小最亮 → 焦點！':cc?'光點還不是最小':'光點越來越大',{size:16,fill:hot?D.object:D.muted,anchor:(dir>0)!==flip?'start':'end',weight:700});}}
    if(s.terms){h+=T(dir>0?880:20,cy-10,'主軸',{size:15,fill:D.muted,anchor:dir>0?'end':'start'})+`<circle cx="${cx}" cy="${cy}" r="4" fill="${D.ink}"/>`+T(cx+10,cy+50,'光心（鏡心）',{size:15,fill:D.ink,halo:true});
      const Fk=cc?Fo:Fi;h+=L(cx,470,Fk,470,{stroke:D.object,w:1.5})+L(cx,462,cx,478,{stroke:D.object,w:1.5})+L(Fk,462,Fk,478,{stroke:D.object,w:1.5})+T((cx+Fk)/2,462,`焦距 f = ${s.f} cm`,{size:15,fill:D.object,anchor:'middle',weight:700});
      if(fade>0&&!s.paper)h+=T(Fk,cy-18,cc?'焦點':'虛焦點',{size:15,fill:D.object,anchor:'middle',weight:700});}
    if(!s.on)h+=T(450,40,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
    const reads=[['焦點',cc?'實焦點（光真的會聚）':'虛焦點（反向延長線的交點）'],['焦距 f',`${s.f} cm`],['透鏡',s.f<70?`較${cc?'凸':'凹'} → 焦距較短`:s.f>110?'較平 → 焦距較長':'中等']];
    if(s.paper)reads.push(['紙上的光點',!s.on?'—':hot?'最小、最亮':cc&&w<45?'較小':'很大']);
    const note=(cc?'平行主軸的光經過凸透鏡，折射後<b>會聚</b>在主軸上一點 → <b>焦點</b>（實焦點）。焦點到光心的距離叫<b>焦距</b>；透鏡越凸，焦距越短。':'平行光經過凹透鏡後<b>發散</b>，好像是從透鏡前方一點射出來的 → 那一點是<b>虛焦點</b>（反向延長線的交點）。')
      +(s.side==='right'?(cc?'<br>光從右邊來，就會聚在左邊的焦點：透鏡<b>兩側各有一個焦點</b>，到光心一樣遠。':'<br>光從右邊來，虛焦點也在右邊（光射來的那一側）：透鏡<b>兩側各有一個焦點</b>，到光心一樣遠。'):'')
      +(s.paper?(cc?'<br>移動紙張：光點<b>最小最亮</b>時，紙就在焦點上，紙到透鏡的距離 = 焦距。':'<br>凹透鏡讓光發散，紙放在哪裡，光點都比射進來的光束還大，找不到亮點。'):'');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  /* 成像：近軸光線 */
  image(s){
    beginLight(s);
    const f=s.type*s.f,u=s.u,oh=s.oh,inf=Math.abs(u-f)<1e-9,v=inf?null:f*u/(u-f),m=inf?null:-v/u,cx=450,cy=250,X=x=>cx+x*1.15,Y=y=>cy-y*2.4,E=440/1.15,blk=s.block&&s.beam!=='single';
    const P=([x,y])=>[X(x),Y(y)],out=(y0,yh)=>[E,yh+(inf?-y0/u:(m*y0-yh)/v)*E];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    for(const sg of[-1,1])for(const k of[1,2]){const x=X(sg*k*s.f);h+=L(x,cy-7,x,cy+7,{stroke:D.muted,w:2})+T(x,cy+28,`${k===2?'2':''}F`,{size:15,fill:D.muted,anchor:'middle'});}
    h+=s.type===1?`<path d="M450 60Q490 250 450 440Q410 250 450 60" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`:`<path d="M426 60Q462 250 426 440L474 440Q438 250 474 60Z" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`;
    const hits=[];
    if(s.on){
      if(s.beam==='single')hits.push([oh,s.aim,D.object,3.5,true,1]);
      else if(s.beam==='main'){h+=L(cx,18,cx,482,{stroke:D.ray,w:1.2,dash:'3 6',op:.35});hits.push([oh,oh,D.ray,3,true,1],[oh,0,D.second,3,true,1]);const y3=inf?null:f*oh/(f-u);if(!inf&&Math.abs(y3)<400)hits.push([oh,y3,D.third,3,true,1]);}
      else for(const[y0,c,op]of[[oh,'#ffe8a5',.8],[oh/2,D.second,.6]])for(let i=0;i<11;i++)hits.push([y0,-72+i*14.4,c,1.6,false,op]);
      for(const[y0,yh,c,w,arrow,op]of hits){const stop=blk&&yh>0.01;h+=ray(stop?[P([-u,y0]),P([0,yh])]:[P([-u,y0]),P([0,yh]),P(out(y0,yh))],c,{w,arrow:arrow&&!stop,op});}
    }
    const fade=fadeIn(),onStage=!inf&&X(v)>20&&X(v)<880&&Y(m*oh)>20&&Y(m*oh)<480,dim=blk?.5:1;
    if(fade>0&&!inf&&v<0)for(const[y0,yh,c]of hits)if(!(blk&&yh>0.01))h+=L(X(0),Y(yh),X(v),Y(m*y0),{stroke:c,w:1.4,dash:'7 6',op:.75*fade});
    /* 凹透鏡的主要光線：①的延長線通過同側焦點、③原本射向另一側焦點 */
    if(fade>0&&s.type===1&&s.beam==='main'&&u<s.f)h+=L(X(-u),Y(oh),X(-s.f),cy,{stroke:D.third,w:1.4,dash:'3 5',op:.7*fade});
    if(fade>0&&s.type===-1&&s.beam==='main'&&!inf&&!blk){h+=L(X(0),Y(oh),X(-s.f),cy,{stroke:D.ray,w:1.4,dash:'3 5',op:.7*fade});const y3=f*oh/(f-u);if(Math.abs(y3)<400)h+=L(X(0),Y(y3),X(s.f),cy,{stroke:D.third,w:1.4,dash:'3 5',op:.7*fade});}
    if(blk)h+=`<rect x="436" y="56" width="28" height="${cy-56}" rx="4" fill="#05080d" stroke="#56606e" stroke-width="2"/>`+T(470,80,'黑紙',{size:15,fill:D.muted});
    if(fade>0&&onStage)h+=`<g opacity="${fade*dim}">${vArrow(X(v),cy,Y(m*oh),D.image,{dash:v<0?'7 6':false})}</g>`+`<g opacity="${fade}">${T(X(v),v<0&&Math.abs(X(v)-X(-u))<70?cy+58:Y(m*oh)+(m<0?30:-16),(v>0?'實像':'虛像')+(blk?'（完整、變暗）':''),{size:20,fill:D.image,anchor:'middle',weight:600})}</g>`;
    h+=`<g opacity="${s.on?1:.35}">${vArrow(X(-u),cy,Y(oh),D.object)}</g>`+T(X(-u),Y(oh)-18,'物',{size:20,fill:D.object,anchor:'middle'})+handle('obj',X(-u),cy,D.object)+handle('top',X(-u),Y(oh),D.object,10);
    if(s.on&&s.beam==='single')h+=handle('aim',X(0),Y(s.aim),D.object,11);
    if(!s.on)h+=T(450,480,'按「開燈」讓物體發出光線',{size:18,fill:D.muted,anchor:'middle'});
    else if(fade>0&&inf)h+=T(450,480,'物體在焦點上：折射光平行，不成像',{size:19,fill:D.object,anchor:'middle'});else if(fade>0&&!onStage)h+=T(450,480,'像太大或太遠，超出畫面（看右側數值）',{size:18,fill:D.image,anchor:'middle'});
    const prop=inf?'不成像':`${v>0?'倒立':'正立'}・${Math.abs(Math.abs(m)-1)<1e-6?'等大':Math.abs(m)>1?'放大':'縮小'}・${v>0?'實像':'虛像'}`;
    const where=s.type===1?['2F 以外','2F 上','F 與 2F 之間','F 上','F 以內'][lensRow(u,s.f)]:`凹透鏡前 ${u} cm（任何位置都一樣）`;
    const reads=!s.on?[['物體位置',where],['成像','（開燈後觀察）']]:[['物體位置',where],['像的位置',inf?'不成像':v>0?`透鏡另一側 ${num(v)} cm`:`和物體同側 ${num(-v)} cm`],['像高 ÷ 物高',inf?'—':`${num(Math.abs(m),2)} 倍`],['成像',prop]];
    if(blk&&s.on)reads.push(['亮度','變暗（光少了一半）']);
    const rules=s.type===1?'①平行主軸 → 折射後通過<b>焦點</b><br>②通過<b>光心</b> → 直線前進<br>③通過焦點（或延長線通過焦點）→ 折射後<b>平行主軸</b>':'①平行主軸 → 折射後發散，<b>反向延長線</b>通過同側焦點<br>②通過<b>光心</b> → 直線前進<br>③射向另一側焦點 → 折射後<b>平行主軸</b>';
    const note=inf?'物體在<b>焦點上</b>：同一點發出的光折射後互相平行，不會交在一點 → <b>不成像</b>。':s.beam==='single'?'物體上同一點發出的光，穿過透鏡後都會經過（或延長經過）<b>同一個像點</b>。拖動透鏡上的圓圈試試。'
      :s.beam==='full'?(blk?'遮住上半部後，物體<b>每一點</b>的光仍有一部分穿過下半部，還是會聚到同一個像點 → 像<b>仍然完整</b>，只是光變少、<b>變暗</b>。':'物體上每一點發出的光（黃：頂端、粉紅：中間），都會聚（或延長會聚）到像上<b>對應的一點</b> → 整個像。')
      :rules+(blk?'<br>上半部被遮住，還有其他光線通過 → 像還在。':'');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  /* 光具座實驗：移動紙屏找清楚的像 */
  bench(s){
    beginLight(s);
    const f=s.bf,u=s.bu,sv=s.bv,cx=450,ay=250,kx=8,ky=8,A=4,yo=5.5,X=d=>cx+d*kx,Y=y=>ay-y*ky;
    const inf=u===f,v=inf?Infinity:f*u/(u-f),real=!inf&&v>0,b=inf?2*A:2*A*Math.abs(sv-v)/Math.abs(v),sharp=real&&b<0.3,far=real&&v>50,m=v/u;
    const yi=yh=>yh+(inf?-yo/u:(-(v/u)*yo-yh)/v)*sv;
    let h=`<rect x="24" y="440" width="852" height="12" rx="4" fill="#3a4554"/>`;
    for(let d=-50;d<=50;d+=5){const x=X(d);h+=L(x,440,x,d%10?434:428,{stroke:'#8aa0b8',w:1.5});if(d%10===0)h+=T(x,472,Math.abs(d),{size:12,fill:D.muted,anchor:'middle'});}
    h+=T(880,490,'cm（與透鏡的距離）',{size:12,fill:D.muted,anchor:'end'})+L(20,ay,880,ay,{stroke:D.muted,w:1.2,dash:true,op:.6});
    for(const sg of[-1,1])for(const k of[1,2]){const x=X(sg*k*f);if(x>20&&x<880)h+=L(x,ay-6,x,ay+6,{stroke:D.muted,w:2})+T(x,ay+22,`${k===2?'2':''}F`,{size:13,fill:D.muted,anchor:'middle'});}
    /* 支架、透鏡、紙屏、蠟燭 */
    h+=`<rect x="${cx-3}" y="${ay+A*ky}" width="6" height="${440-ay-A*ky}" fill="#5d7088"/><path d="M${cx} ${ay-A*ky-6}Q${cx+14} ${ay} ${cx} ${ay+A*ky+6}Q${cx-14} ${ay} ${cx} ${ay-A*ky-6}" fill="#61ddeb33" stroke="${D.ray}" stroke-width="2.5"/>`;
    const sx=X(sv);h+=`<g data-drag="scr" class="handle-body"><rect x="${sx-4}" y="206" width="8" height="220" rx="2" fill="#d8cda4"/><rect x="${sx-2}" y="426" width="4" height="14" fill="#5d7088"/></g>`+handle('scr',sx,432,D.muted,11)+T(sx+10,222,'紙屏',{size:14,fill:D.muted});
    const ox=X(-u);h+=`<g data-drag="cand" class="handle-body"><rect x="${ox-3}" y="${ay}" width="6" height="${440-ay}" fill="#5d7088"/><rect x="${ox-7}" y="${Y(4)}" width="14" height="${4*ky}" rx="2" fill="#e9e2cf"/>`+L(ox,Y(4),ox,Y(4.6),{stroke:'#333',w:1.5})+(s.on?`<circle cx="${ox}" cy="${Y(5.6)}" r="16" fill="#ffb347" opacity=".25"/><path d="M${ox} ${Y(6.8)}Q${ox+8} ${Y(5.4)} ${ox+4} ${Y(4.8)}Q${ox} ${Y(4.4)} ${ox-4} ${Y(4.8)}Q${ox-8} ${Y(5.4)} ${ox} ${Y(6.8)}Z" fill="#ffb347"/>`:'')+`</g>`+handle('cand',ox,ay+40,D.object,11);
    let lo=1e9,hi=-1e9;
    if(s.on)for(const yh of[A,A/2,0,-A/2,-A]){const ys=yi(yh);lo=Math.min(lo,ys);hi=Math.max(hi,ys);if(yh===A||yh===0||yh===-A)h+=ray([[ox,Y(yo)],[X(0),Y(yh)],[sx,Y(ys)]],'#ffe8a5',{w:1.6,arrow:false,op:.8});}
    const fade=fadeIn();
    if(s.on&&fade>0){h+=`<g opacity="${fade}"><rect x="${sx-4}" y="${clamp(Y(hi),206,424)}" width="8" height="${Math.max(2,clamp(Y(lo),208,426)-clamp(Y(hi),206,424))}" fill="#fff2b0" opacity="${clamp(1.2/(1+b),.25,1)}"/>${real&&v<sv-0.5?`<circle cx="${X(v)}" cy="${Y(-m*yo)}" r="4" fill="${D.image}"/>`:''}</g>`;}
    /* 紙屏上看到的（正面） */
    const ix=590,iy=12,iw=290,ihh=184,cxI=ix+iw/2,ayI=iy+28,g=7,sc=sv/u,sd=Math.min(18,b*g*0.45);
    h+=`<clipPath id="scrc"><rect x="${ix}" y="${iy}" width="${iw}" height="${ihh}" rx="10"/></clipPath><rect x="${ix}" y="${iy}" width="${iw}" height="${ihh}" rx="10" fill="#efe6c8"/>`+T(ix+12,iy+22,'紙屏上看到的',{size:13,fill:'#6f6448',weight:700});
    if(s.on&&fade>0){const op=clamp(1.5/(1+b*0.9),.3,1)*fade,glyph=`<rect x="-0.8" y="-4" width="1.6" height="4" fill="#d9cfb4"/><path d="M0 -6.8Q1 -5.4 0.5 -4.8Q0 -4.4 -0.5 -4.8Q-1 -5.4 0 -6.8Z" fill="#ff9a2e"/>`;
      h+=`<filter id="bblur" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="${sd.toFixed(2)}"/></filter><g clip-path="url(#scrc)"><g filter="url(#bblur)" opacity="${op.toFixed(2)}"><g transform="translate(${cxI} ${ayI}) scale(${(sc*g).toFixed(3)}) rotate(180)">${glyph}</g></g></g>`;
      h+=T(ix+iw-12,iy+ihh-12,sharp?`清楚：倒立・${Math.abs(m-1)<0.02?'等大':m>1?'放大':'縮小'}`:b>4?'只有一片模糊的光':'模糊',{size:13,fill:sharp?'#0f766e':'#6f6448',anchor:'end',weight:700});}
    else h+=T(cxI,iy+90,s.on?'':'蠟燭沒點燃',{size:14,fill:'#6f6448',anchor:'middle'});
    /* 實驗紀錄 */
    h+=`<rect x="20" y="12" width="440" height="164" rx="10" fill="#0b1422" stroke="#3a4554"/>`+T(36,38,'物距',{size:13,fill:D.muted,weight:700})+T(128,38,'像距',{size:13,fill:D.muted,weight:700})+T(220,38,`像的性質（f = ${f} cm）`,{size:13,fill:D.muted,weight:700})+L(30,46,450,46,{stroke:'#3a4554',w:1});
    if(!s.log.length)h+=T(240,100,'找到清楚的像後，按「記錄這一次」',{size:14,fill:D.muted,anchor:'middle'});
    [...s.log].sort((a,b)=>b.u-a.u).forEach((r,i)=>{const y=68+i*21;h+=T(36,y,`${r.u} cm`,{size:14,fill:D.object})+T(128,y,r.v==='—'?'—':`${r.v} cm`,{size:14,fill:D.image})+T(220,y,r.p,{size:14,fill:D.ink});});
    if(!s.on)h+=T(250,300,'按「開燈」點燃蠟燭',{size:18,fill:D.muted,anchor:'middle'});
    const where=['2F 以外','2F 上','F 與 2F 之間','F 上','F 以內'][lensRow(u,f)];
    const reads=[['蠟燭位置',`${u} cm（${where}）`],['紙屏位置',`${sv} cm`],['紙屏上',!s.on?'—':sharp?'清楚的像':real&&!far?'模糊（再移動紙屏）':'接不到清楚的像'],['像的性質',s.on&&sharp?`倒立・${Math.abs(m-1)<0.02?'等大':m>1?'放大':'縮小'}・實像`:'—']];
    const flash=s.flashT>0&&s.flash?`<b>${s.flash}</b><br>`:'';
    const note=flash+(!s.on?'按「開燈」點燃蠟燭。':u<f?'蠟燭在<b>焦點以內</b>：紙屏怎麼移都接不到像。從紙屏這一側<b>透過透鏡看</b>，會看到正立、放大的<b>虛像</b>（放大鏡）。':inf?'蠟燭在<b>焦點上</b>：折射光平行，紙屏上只有一片亮光，<b>不成像</b>。'
      :far?`像距約 ${num(v)} cm，超出光具座，紙屏放不到。把蠟燭往遠離透鏡的方向移一點。`:sharp?'找到了！<b>實像</b>可以用紙屏接到。按「記錄這一次」，再換一個蠟燭位置。':'前後移動紙屏，找到<b>最清楚</b>的像（燭焰的像最清楚、邊緣最銳利）。');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  keep:['mode','type'],
  render(s){return this[s.mode](s);}},

/* ===== 4-4 生活中的透鏡 ===== */
life:{group:2,n:'4-4',name:'生活中的透鏡',subtitle:'照相機、投影機、放大鏡、顯微鏡和眼睛：物體放在哪裡，就形成什麼樣的像。',dark:true,
  q:s=>({html:qBlockHTML(LIFE_Q[s.dev])+quizHTML(s,LIFE_QUIZ)}),
  qAction(s,v){quizAction(s,v,LIFE_QUIZ);},
  state:{on:true,prog:0,beam:'full',dev:'camera',u:900,glasses:false,focus:118,cu:900,pu:150,flip:false,mu:100,step:'obj',qi:0,qp:null,qc:false,qs:false},
  controls:[LAMP,{...BEAM,show:s=>!['proj','mag','scope'].includes(s.dev)},
    {type:'seg',key:'dev',label:'裝置',options:[['camera','照相機'],['proj','投影機'],['mag','放大鏡'],['scope','顯微鏡'],['eye','眼睛'],['myopia','近視'],['hyper','遠視']],onChange:s=>{replay(s);const i=LIFE_QUIZ.findIndex(q=>{const t={};if(q.go)q.go(t);return t.dev===s.dev;});if(i>=0){s.qi=i;s.qp=null;s.qc=false;s.qs=false;}}},
    {type:'seg',key:'step',label:'顯微鏡',options:[['obj','只看物鏡'],['both','加上目鏡']],onChange:replay,show:s=>s.dev==='scope'},
    {type:'range',key:'pu',label:'投影片 → 鏡頭（焦距 10 cm）',min:120,max:190,step:1,fmt:s=>`${(s.pu/10).toFixed(1)} cm`,show:s=>s.dev==='proj'},
    {type:'toggle',key:'flip',label:'投影片倒著放（上下顛倒、左右相反）',show:s=>s.dev==='proj'},
    {type:'range',key:'mu',label:'字 → 放大鏡（焦距 16 cm）',min:40,max:140,step:1,fmt:s=>`${(s.mu/10).toFixed(1)} cm`,show:s=>s.dev==='mag'},
    {type:'range',key:'u',label:'物體距離',min:300,max:3000,step:10,fmt:s=>s.u>=2400?'很遠':s.u>=900?'中等':'近',show:s=>s.dev==='eye'},
    {type:'toggle',key:'glasses',label:'戴上眼鏡',show:s=>s.dev==='myopia'||s.dev==='hyper'},
    {type:'range',key:'cu',label:'物體距離',min:300,max:3000,step:10,fmt:s=>s.cu>=2400?'很遠':s.cu>=900?'中等':'近',show:s=>s.dev==='camera'},
    {type:'range',key:'focus',label:'對焦：鏡頭到感光元件',min:100,max:170,step:1,fmt:s=>camSharp(s)?'清楚':'模糊',show:s=>s.dev==='camera'}],
  tick:LIGHT_TICK,
  drag:{eobj:(p,s)=>{s.u=snap('u',560-p.x);},cobj:(p,s)=>{s.cu=snap('cu',(780-s.focus)-p.x);},slide:(p,s)=>{s.pu=snap('pu',260-p.x);},mobj:(p,s)=>{s.mu=snap('mu',560-p.x);}},
  /* 顯微鏡：物鏡成倒立放大實像，落在目鏡焦點內，目鏡當放大鏡 → 倒立放大虛像 */
  scope(s){
    beginLight(s);
    const cy=250,fo=40,fe=110,xo=210,u=50,vo=fo*u/(u-fo),xI=xo+vo,xe=xI+80,ue=xe-xI,ve=fe*ue/(ue-fe),xF=xe+ve,oh=12,hI=-oh*vo/u,hF=hI*(-ve/ue),mT=(vo/u)*(-ve/ue),ex=690,Y=y=>cy-y,both=s.step==='both',xs=xo-u;
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    h+=`<rect x="${xo-26}" y="${cy-70}" width="${xe-xo+52}" height="140" rx="18" fill="#1b2738" opacity=".55" stroke="#5d7088" stroke-width="2"/>`+T((xo+xe)/2,cy-80,'鏡筒',{size:13,fill:D.muted,anchor:'middle'});
    h+=`<rect x="${xs-34}" y="${cy+16}" width="68" height="8" rx="2" fill="#9fb2c8" opacity=".6"/>`+T(xs-6,cy+44,'玻片（標本）',{size:13,fill:D.object,anchor:'end'});
    for(const[x,f,lab]of[[xo,fo,'物鏡'],[xe,fe,'目鏡']]){h+=lensPath(x,f,x===xo?42:80)+T(x,x===xo?cy-50:cy+102,lab+'（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});}
    for(const sd of[-1,1]){const x=xo+sd*fo;h+=L(x,cy-5,x,cy+5,{stroke:D.muted,w:2})+T(x,cy+20,'F',{size:12,fill:D.muted,anchor:'middle'});}
    if(both)for(const sd of[-1,1]){const x=xe+sd*fe;h+=L(x,cy-5,x,cy+5,{stroke:D.muted,w:2})+T(x,cy-10,'F′',{size:12,fill:D.muted,anchor:'middle'});}
    const lenses=both?[{x:xo,f:fo},{x:xe,f:fe}]:[{x:xo,f:fo}],end=both?ex-14:xe-6,cols=[D.ray,D.second,D.third],outs=[];
    if(s.on)[oh,0,-oh*0.9].forEach((yh,i)=>{const t=paraxTrace(xs,oh,(yh-oh)/u,lenses,end);outs.push(t);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),cols[i],{w:2.2,arrow:false,op:.9});});
    const fade=fadeIn();
    if(fade>0)h+=`<g opacity="${fade*(both?.55:1)}">${vArrow(xI,cy,Y(hI),D.image,{w:4})}${T(xI-10,Y(hI)+18,both?'中間的實像':'倒立、放大的實像',{size:14,fill:D.image,weight:700,anchor:'end'})}</g>`;
    if(both&&fade>0){for(const t of outs){const[,yl]=t.pts[2];h+=L(xe,Y(yl),xF,Y(hF),{stroke:'#ffe8a5',w:1.2,dash:'6 6',op:.55*fade});}
      h+=`<g opacity="${fade}">${vArrow(xF,cy,Y(hF),D.second,{dash:'7 6'})}${T(xF,Y(hF)+26,'最後看到的虛像',{size:15,fill:D.second,anchor:'middle',weight:700})}</g>`;}
    h+=vArrow(xs,cy,Y(oh),D.object,{w:4});
    if(both)h+=`<path d="M${ex+30} ${cy}Q${ex} ${cy-26} ${ex-26} ${cy}Q${ex} ${cy+26} ${ex+30} ${cy}" fill="#e8f3ff"/><circle cx="${ex-8}" cy="${cy}" r="9" fill="#162b46"/>`+T(ex,cy+46,'眼睛',{size:14,fill:D.ink,anchor:'middle'});
    const glyph=(x0,title,rot,sc,on)=>`<rect x="${x0}" y="12" width="150" height="140" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+75,32,title,{size:13,fill:D.ink,anchor:'middle',weight:700})
      +(on?`<clipPath id="sc${x0}"><rect x="${x0}" y="40" width="150" height="110"/></clipPath><g clip-path="url(#sc${x0})"><g transform="translate(${x0+75} 96) scale(${sc}) rotate(${rot})"><path d="M-14 -30H16V-20H-4V-5H10V5H-4V30H-14Z" fill="#ffcc6a"/></g></g>`:T(x0+75,96,both?'':'（加上目鏡）',{size:13,fill:D.muted,anchor:'middle'}));
    h+=glyph(560,'玻片上的字',0,0.3,true)+glyph(724,'從目鏡看到的',180,1.25,s.on&&both&&fade>=1);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['物鏡','標本在 F 與 2F 之間 → 倒立放大實像'],['目鏡',both?'實像在焦點內 → 當放大鏡':'（還沒加上）'],['最後看到',both?'倒立・放大・虛像':'—'],['放大倍數',both?`約 ${num(mT,0)} 倍（物鏡 ${num(vo/u,0)} × 目鏡 ${num(-ve/ue,1)}）`:`物鏡 ${num(vo/u,0)} 倍`]],
      note:both?'顯微鏡有兩個凸透鏡：<b>物鏡</b>先把標本放大成倒立的實像；這個像落在<b>目鏡</b>的焦點以內，目鏡再像放大鏡一樣放大它（不會再倒過來）→ 最後看到<b>倒立、放大的虛像</b>。'
        :'第一步：標本放在<b>物鏡</b>的 F 與 2F 之間 → 在鏡筒裡形成<b>倒立、放大的實像</b>。打開「加上目鏡」看第二步。'};},
  /* 投影機：投影片在 F 與 2F 之間 → 倒立放大實像，所以投影片要倒著放 */
  proj(s){
    beginLight(s);
    const cy=250,fl=100,xl=260,u=s.pu,v=fl*u/(u-fl),m=v/u,xo=xl-u,xS=Math.min(xl+v,872),oh=24,sg=s.flip?-1:1,Y=y=>cy-y,lenses=[{x:xl,f:fl}];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    h+=`<rect x="16" y="178" width="${xl+26-16}" height="144" rx="16" fill="#1b2738" stroke="#5d7088" stroke-width="2"/>`+T(28,342,'投影機',{size:14,fill:D.muted});
    h+=`<rect x="28" y="226" width="34" height="48" rx="8" fill="${s.on?'#fff2c4':'#56606e'}"/>`+(s.on?`<circle cx="45" cy="250" r="30" fill="#fff2c4" opacity=".18"/><polygon points="62,232 ${xo},${cy-oh-14} ${xo},${cy+oh+14} 62,268" fill="#fff2c4" opacity=".1"/>`:'')+T(45,214,'燈',{size:13,fill:D.muted,anchor:'middle'});
    for(const[k,t]of[[1,'F'],[2,'2F']])for(const sd of[-1,1]){const x=xl+sd*k*fl;h+=L(x,cy-6,x,cy+6,{stroke:D.muted,w:2})+T(x,cy+24,t,{size:13,fill:D.ink,anchor:'middle',halo:true});}
    h+=lensPath(xl,fl,64)+T(xl,cy-74,'鏡頭（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});
    h+=`<g data-drag="slide" class="handle-body"><rect x="${xo-4}" y="${cy-46}" width="8" height="92" rx="2" fill="#9fb2c8" opacity=".45"/>${vArrow(xo,cy,Y(sg*oh),D.object,{w:4})}</g>`+handle('slide',xo,cy+62,D.object,11)+T(xo,cy-54,'投影片',{size:13,fill:D.object,anchor:'middle'});
    if(s.on)for(const[yh,c]of[[sg*oh,D.ray],[0,D.second],[-sg*48,D.third]]){const t=paraxTrace(xo,sg*oh,(yh-sg*oh)/u,lenses,xS);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),c,{w:2.4,arrow:false,op:.9});}
    const fade=fadeIn();
    h+=`<rect x="${xS}" y="172" width="10" height="300" rx="3" fill="#efe6c8" opacity=".9"/>`+T(xS+5,490,'螢幕',{size:14,fill:D.muted,anchor:'middle'});
    if(fade>0)h+=`<g opacity="${fade}">${vArrow(xS-7,cy,Y(-sg*oh*m),D.image,{w:5})}</g>`;
    const glyph=(x0,title,rot,sc,on)=>`<rect x="${x0}" y="12" width="168" height="150" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+84,32,title,{size:13,fill:D.ink,anchor:'middle',weight:700})
      +(on?`<clipPath id="gl${x0}"><rect x="${x0}" y="40" width="168" height="120"/></clipPath><g clip-path="url(#gl${x0})"><g transform="translate(${x0+84} 100) scale(${sc.toFixed(2)}) rotate(${rot})"><path d="M-14 -30H16V-20H-4V-5H10V5H-4V30H-14Z" fill="#ffcc6a"/></g></g>`:T(x0+84,104,'（還沒有像）',{size:13,fill:D.muted,anchor:'middle'}));
    h+=glyph(330,'投影片（從機器後面看）',s.flip?180:0,0.3,true)+L(504,88,532,88,{stroke:D.muted,w:2,arrow:true})+glyph(540,'螢幕上（觀眾看到的）',s.flip?0:180,clamp(0.3*m,0.3,1.6),s.on&&fade>=1);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['投影片位置','鏡頭的 F 與 2F 之間'],['螢幕上的像','倒立・放大・實像'],['放大倍數',`${num(m,1)} 倍`],['螢幕上的字',s.flip?'正的 ✓':'上下顛倒、左右相反']],
      note:'投影片放在鏡頭的 <b>F 與 2F 之間</b> → 在遠處螢幕上形成<b>倒立、放大的實像</b>。所以投影片要<b>倒著放</b>（上下顛倒、左右相反），螢幕上的字才會是正的。'+(s.flip?'':'<br>打開「投影片倒著放」試試看。')+'<br>投影片越靠近焦點，像越遠、越大。'};},
  /* 放大鏡：物體在焦點以內 → 正立放大虛像 */
  mag(s){
    beginLight(s);
    const cy=250,fl=160,xl=560,u=s.mu,v=fl*u/(u-fl),m=-v/u,xo=xl-u,xi=xl+v,oh=22,yi=m*oh,ex=812,Y=y=>cy-y,lenses=[{x:xl,f:fl}];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    for(const sd of[-1,1]){const x=xl+sd*fl;h+=L(x,cy-6,x,cy+6,{stroke:D.muted,w:2})+T(x,cy+24,'F',{size:14,fill:D.muted,anchor:'middle'});}
    h+=`<rect x="${xl-5}" y="${cy+94}" width="10" height="100" rx="5" fill="#8a6a45"/>`+lensPath(xl,fl,94)+T(xl,cy-104,'放大鏡（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});
    const rays=[];if(s.on)for(const ye of[-7,0,7]){const yh=yi+(xl-xi)*(ye-yi)/(ex-8-xi),t=paraxTrace(xo,oh,(yh-oh)/u,lenses,ex-10);rays.push(yh);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),'#ffe8a5',{w:2.2,arrow:false,op:.9});}
    const fade=fadeIn(),xiv=Math.max(xi,16);
    if(fade>0)for(const yh of rays)h+=L(xl,Y(yh),xiv,Y(yh+(yi-yh)*(xl-xiv)/(xl-xi)),{stroke:'#ffe8a5',w:1.3,dash:'6 6',op:.6*fade});
    if(fade>0&&xi>16&&yi<235)h+=`<g opacity="${fade}">${vArrow(xi,cy,Y(yi),D.image,{dash:'7 6'})}${T(xi,Math.abs(xi-xo)<60?cy+44:Y(yi)-14,'虛像',{size:16,fill:D.image,anchor:'middle',weight:700})}</g>`;
    else if(fade>0)h+=T(30,60,'← 像在很遠的地方，而且很大',{size:15,fill:D.image});
    h+=`<g data-drag="mobj" class="handle-body">${vArrow(xo,cy,Y(oh),D.object,{w:4})}</g>`+handle('mobj',xo,cy+30,D.object,11)+T(xo,Y(oh)-12,'字',{size:15,fill:D.object,anchor:'middle',weight:700});
    h+=`<path d="M${ex+30} ${cy}Q${ex} ${cy-26} ${ex-26} ${cy}Q${ex} ${cy+26} ${ex+30} ${cy}" fill="#e8f3ff"/><circle cx="${ex-8}" cy="${cy}" r="9" fill="#162b46"/>`+T(ex,cy+46,'眼睛',{size:14,fill:D.ink,anchor:'middle'});
    const box=(x0,title,sz)=>`<rect x="${x0}" y="350" width="190" height="130" rx="12" fill="#fbfaf6"/>`+T(x0+95,372,title,{size:13,fill:'#6b777e',anchor:'middle',weight:700})+`<clipPath id="mb${x0}"><rect x="${x0}" y="380" width="190" height="98"/></clipPath><g clip-path="url(#mb${x0})">${T(x0+95,430+sz*0.36,'理化',{size:sz.toFixed(1),fill:'#1b2a33',anchor:'middle',weight:700})}</g>`;
    h+=box(20,'不用放大鏡',18)+(s.on&&fade>=1?box(225,'透過放大鏡看',18*m):'');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['字的位置','焦點以內'],['看到的像','正立・放大・虛像'],['放大倍數',`${num(m,1)} 倍`],['像的位置',xi>16?'和字同一側（字的後方）':'很遠的地方']],
      note:'放大鏡就是<b>凸透鏡</b>。字放在<b>焦點以內</b>，折射光發散進入眼睛；眼睛以為光是從反向延長線的交點射來的 → 看到<b>正立、放大的虛像</b>。字越靠近焦點，像越大。'};},
  keep:['dev'],
  render(s){
    if(s.dev==='proj')return this.proj(s);if(s.dev==='mag')return this.mag(s);if(s.dev==='scope')return this.scope(s);
    beginLight(s);const cy=250,Y=y=>cy-y;let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    const trace=paraxTrace,lensShape=lensPath;
    const toPx=pts=>pts.map(([x,y])=>[x,Y(y)]);
    if(s.dev==='camera'){
      const fl=100,xs=780,xl=xs-s.focus,u=s.cu,v=fl*u/(u-fl),blur=Math.abs(s.focus-v)*90/v,sharp=camSharp(s),ox=xl-u,oh=40;
      h+=`<rect x="${xl-14}" y="150" width="${xs-xl+30}" height="200" rx="14" fill="#1b2738" stroke="#5d7088" stroke-width="2"/><rect x="${xl-40}" y="180" width="30" height="140" rx="6" fill="#26354a" stroke="#5d7088"/>`+L(xs,165,xs,335,{stroke:'#8aa0b8',w:6})+T(xs,148,'感光元件',{size:14,fill:D.muted,anchor:'middle'});
      h+=lensShape(xl,fl,58)+T(xl,140,'鏡頭（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});
      const ys=s.beam==='single'?[30]:[-45,-30,-15,0,15,30,45];
      if(s.on)for(const yk of ys){const t=trace(ox,oh,(yk-oh)/u,[{x:xl,f:fl}],xs);h+=ray(toPx(t.pts),'#ffe8a5',{w:s.beam==='single'?3:1.6,arrow:false,op:.85});}
      const fade=fadeIn();
      if(fade>0){const ih=-oh*s.focus/u;h+=`<g opacity="${fade}">${sharp?vArrow(xs-14,cy,Y(ih),D.image):`<rect x="${xs-16}" y="${Y(Math.max(0,ih)+blur/2)}" width="10" height="${Math.abs(ih)+blur}" fill="${D.image}" opacity=".45" rx="5"/>`}</g>`;}
      if(ox>30)h+=`<g opacity="${s.on?1:.35}">${vArrow(ox,cy,Y(oh),D.object)}</g>`+handle('cobj',ox,cy,D.object);else h+=T(40,Y(oh)-10,`← ${u>=2400?'很遠':'較遠'}的物體`,{size:15,fill:D.object});
      const move=sharp?'剛好':s.focus<v?'往前伸（遠離感光元件）':'往後縮（靠近感光元件）';
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['畫面',sharp?'清楚':'模糊'],['鏡頭應該',move],['物體位置','2F 以外'],['成像','倒立・縮小・實像']],
        note:'相機用<b>移動鏡頭</b>對焦：物體越近，像距越大，鏡頭就要往前伸。'};
    }
    const X0=560,L0={eye:200,myopia:240,hyper:170}[s.dev],xr=X0+L0;
    let u,oh,fEye,lenses;
    if(s.dev==='eye'){u=s.u;oh=40;fEye=1/(1/u+1/L0);lenses=[{x:X0,f:fEye}];}
    else if(s.dev==='myopia'){u=3000;oh=0;fEye=200;lenses=[{x:X0,f:fEye}];if(s.glasses){const Dv=1/(1/200-1/L0);lenses.unshift({x:X0-70,f:1/(1/(u-70)+1/-(Dv-70))});}}
    else{u=520;oh=0;fEye=160;lenses=[{x:X0,f:fEye}];if(s.glasses){const Dv=1/(1/160-1/L0);lenses.unshift({x:X0-70,f:1/(1/(u-70)+1/-(Dv-70))});}}
    const ox=X0-u,first=lenses[0].x;
    h+=`<ellipse cx="${(X0-24+xr)/2}" cy="${cy}" rx="${(xr-X0+24)/2+12}" ry="115" fill="#1a2536" stroke="#c9d6e6" stroke-width="2.5"/>`+`<path d="M${xr-4} ${cy-90}Q${xr+14} ${cy} ${xr-4} ${cy+90}" fill="none" stroke="#ff92bc" stroke-width="5"/>`+T(xr+18,cy-80,'視網膜',{size:14,fill:D.second});
    h+=lensShape(X0,fEye,58)+T(X0,cy-74,'水晶體',{size:14,fill:D.ray,anchor:'middle'});
    if(lenses.length>1)h+=lensShape(lenses[0].x,lenses[0].f,70)+T(lenses[0].x,cy+96,lenses[0].f>0?'凸透鏡':'凹透鏡',{size:14,fill:D.ink,anchor:'middle'});
    const ys=s.beam==='single'?[38]:[-45,-30,-15,0,15,30,45];let conv=null;
    for(const yk of ys){const t=trace(ox,oh,(yk-oh)/(first-ox),lenses,xr);if(Math.abs(t.m)>1e-9&&oh===0)conv=t.x-t.y/t.m;
      if(s.on){h+=ray(toPx(t.pts),'#ffe8a5',{w:s.beam==='single'?3:1.6,arrow:false,op:.85});}}
    const fade=fadeIn();
    if(oh===0&&conv!==null&&fade>0&&conv>xr+2){for(const yk of ys){const t=trace(ox,oh,(yk-oh)/(first-ox),lenses,xr);h+=L(xr,Y(t.pts[t.pts.length-1][1]),conv,cy,{stroke:'#ffe8a5',w:1.2,dash:'4 5',op:.6*fade});}h+=`<circle cx="${conv}" cy="${cy}" r="5" fill="${D.object}" opacity="${fade}"/>`;}
    if(oh===0&&conv!==null&&fade>0&&conv<xr-2)h+=`<circle cx="${conv}" cy="${cy}" r="5" fill="${D.object}" opacity="${fade}"/>`;
    if(s.dev==='eye'){if(fade>0)h+=`<g opacity="${fade}">${vArrow(xr-8,cy,Y(-oh*L0/u),D.image)}</g>`;if(ox>30)h+=`<g opacity="${s.on?1:.35}">${vArrow(ox,cy,Y(oh),D.object)}</g>`+handle('eobj',ox,cy,D.object);else h+=T(40,Y(oh)-10,`← ${u>=2400?'很遠':'較遠'}的物體`,{size:15,fill:D.object});}
    else if(ox>30)h+=`<circle cx="${ox}" cy="${cy}" r="7" fill="${s.on?D.object:'#56606e'}"/>`+T(ox,cy-16,'近處物體',{size:15,fill:D.object,anchor:'middle'});else h+=T(40,cy-14,'← 遠方物體',{size:15,fill:D.object});
    if(s.dev==='eye')return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['水晶體',u<900?'變厚（看近）':u<2400?'稍厚':'較薄（看遠）'],['視網膜上的像','倒立・縮小・實像'],['畫面','清楚（自動調焦）']],
      note:'眼睛像相機：<b>水晶體</b>是凸透鏡，在<b>視網膜</b>上形成倒立縮小的實像；看近時水晶體變厚。'};
    const where=conv===null?'—':Math.abs(conv-xr)<3?'視網膜上':conv<xr?'視網膜前方':'視網膜後方',ok=where==='視網膜上';
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:s.dev==='myopia'?[['眼球','前後太長（也可能是水晶體太厚）'],['光會聚在',where],['看遠處',ok?'清楚':'模糊'],['矯正','凹透鏡（發散）']]:[['眼球','前後太短（也可能是水晶體太薄）'],['光會聚在',where],['看近處',ok?'清楚':'模糊'],['矯正','凸透鏡（會聚）']],
      note:s.dev==='myopia'?'近視：光會聚在視網膜<b>前方</b> → 戴<b>凹透鏡</b>讓光先發散一點。':'遠視：光會聚在視網膜<b>後方</b> → 戴<b>凸透鏡</b>幫忙會聚。'};}},
/* ===== 11 顏色 ===== */
color:{group:2,n:'4-5',keep:['mode'],name:'色散與顏色',subtitle:'白光經過三稜鏡會分成各種色光（色散），彩虹也是這樣形成的；物體的顏色，看它讓哪些色光透過或反射。',dark:true,
  q:s=>({html:qBlockHTML(COLOR_Q[s.mode==='opaque'&&s.ov==='text'?'text':s.mode]||COLOR_Q.prism)+quizHTML(s,COLOR_QUIZ)}),
  qAction(s,v){quizAction(s,v,COLOR_QUIZ);},
  state:{on:true,prog:0,mode:'prism',beam:'full',hue:3,newton:false,rv:'drop',tv:'one',f1:'r',f2:'g',fR:true,fG:true,fB:true,ov:'obj',obj:'apple',ink:'r',gv:'g',r:1,g:1,b:1,pc:true,pm:true,py:true,compare:false,qi:0,qp:null,qc:false,qs:false},
  controls:[LAMP,
    {type:'seg',key:'mode',label:'實驗',options:[['prism','色散（三稜鏡）'],['rainbow','彩虹'],['clear','透明物體'],['opaque','不透明物體'],['mix','色光三原色'],['paint','顏料混色（延伸）']],onChange:s=>{if(!s.r&&!s.g&&!s.b)[s.r,s.g,s.b]=[1,1,1];replay(s);}},
    {type:'seg',key:'beam',label:'光線',options:[['full','白光'],['single','單色光']],show:s=>s.mode==='prism',onChange:replay},
    {type:'seg',key:'hue',label:'色光',options:SPECTRUM.map(([n],i)=>[i,n]),show:s=>s.mode==='prism'&&s.beam==='single',onChange:replay},
    {type:'toggle',key:'newton',label:'再放一個倒置的三稜鏡',show:s=>s.mode==='prism',onChange:replay},
    {type:'seg',key:'rv',label:'看法',options:[['drop','一顆小水滴'],['sky','為什麼外紅內紫？']],show:s=>s.mode==='rainbow',onChange:replay},
    {type:'seg',key:'tv',label:'裝置',options:[['one','一張玻璃紙'],['two','兩張疊在一起'],['rgb','紅綠藍三片濾色片']],show:s=>s.mode==='clear',onChange:replay},
    {type:'seg',key:'f1',label:'玻璃紙的顏色',options:Object.entries(FILTERS).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='clear'&&s.tv==='one',onChange:replay},
    {type:'seg',key:'f1',label:'第一張玻璃紙',options:Object.entries(FILTERS).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='clear'&&s.tv==='two',onChange:replay},
    {type:'seg',key:'f2',label:'第二張玻璃紙',options:Object.entries(FILTERS).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='clear'&&s.tv==='two',onChange:replay},
    {type:'toggle',key:'fR',label:'放紅色濾色片',show:s=>s.mode==='clear'&&s.tv==='rgb'},
    {type:'toggle',key:'fG',label:'放綠色濾色片',show:s=>s.mode==='clear'&&s.tv==='rgb'},
    {type:'toggle',key:'fB',label:'放藍色濾色片',show:s=>s.mode==='clear'&&s.tv==='rgb'},
    {type:'seg',key:'ov',label:'看法',options:[['obj','光照在物體上'],['text','透過玻璃紙看字']],show:s=>s.mode==='opaque',onChange:replay},
    {type:'seg',key:'obj',label:'物體',options:Object.entries(REFLECT).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='opaque'&&s.ov==='obj'},
    {type:'seg',key:'ink',label:'白紙上的字',options:[['r','紅字'],['g','綠字'],['b','藍字'],['k','黑字']],show:s=>s.mode==='opaque'&&s.ov==='text'},
    {type:'seg',key:'gv',label:'蓋上的玻璃紙',options:[['none','不蓋'],...Object.entries(FILTERS).map(([k,v])=>[k,v[0]])],show:s=>s.mode==='opaque'&&s.ov==='text'},
    {type:'buttons',label:'光的顏色',items:LIGHTS.map(([n,c])=>[n,s=>{[s.r,s.g,s.b]=c;replay(s);}]),show:s=>['clear','opaque','mix'].includes(s.mode)},
    {type:'toggle',key:'r',label:'紅光',show:s=>s.mode==='mix',onChange:replay},
    {type:'toggle',key:'g',label:'綠光',show:s=>s.mode==='mix',onChange:replay},
    {type:'toggle',key:'b',label:'藍光',show:s=>s.mode==='mix',onChange:replay},
    {type:'toggle',key:'pc',label:'青色顏料',show:s=>s.mode==='paint',onChange:replay},
    {type:'toggle',key:'pm',label:'洋紅色顏料',show:s=>s.mode==='paint',onChange:replay},
    {type:'toggle',key:'py',label:'黃色顏料',show:s=>s.mode==='paint',onChange:replay},
    {type:'toggle',key:'compare',label:'和色光混合（加色）對照',show:s=>s.mode==='paint'}],
  tick:LIGHT_TICK,
  render(s){beginLight(s);const m=s.mode;return m==='rainbow'?this.rainbow(s):m==='clear'?this.clear(s):m==='opaque'?this.opaque(s):m==='mix'?this.mix(s):m==='paint'?this.paint(s):this.prism(s);},
  prism(s){
    /* 三稜鏡：用折射定律計算，色散程度放大以便觀察；倒置的三稜鏡三個面都和第一個平行，各色光平行射出、重疊回白光 */
    const A=[450,96.8],B=[300,356.6],C=[600,356.6],A2=[675,360.88],B2=[765,205],C2=[585,205],src=[40,420],H=[B[0]+0.45*(A[0]-B[0]),B[1]+0.45*(A[1]-B[1])];
    const len=Math.hypot(H[0]-src[0],H[1]-src[1]),d0=[(H[0]-src[0])/len,(H[1]-src[1])/len],full=s.beam==='full',nw=s.newton,nm=SPECTRUM[s.hue][0];
    const hitFace=(p,d,a,b2)=>{const ex=b2[0]-a[0],ey=b2[1]-a[1],den=d[0]*ey-d[1]*ex,t=((a[0]-p[0])*ey-(a[1]-p[1])*ex)/den;return[p[0]+d[0]*t,p[1]+d[1]*t];};
    let h=`<polygon points="${A} ${B} ${C}" fill="#9fd8ff22" stroke="#bfe6ff" stroke-width="2.5"/>`+T(450,335,'三稜鏡',{size:16,fill:'#bfe6ff',anchor:'middle',weight:700});
    if(nw)h+=`<polygon points="${C2} ${B2} ${A2}" fill="#9fd8ff22" stroke="#bfe6ff" stroke-width="2.5"/>`+T(675,392,'倒置的三稜鏡',{size:15,fill:'#bfe6ff',anchor:'middle',weight:700});
    h+=`<rect x="852" y="40" width="18" height="420" rx="4" fill="#3a4554"/>`+T(861,30,'紙屏',{size:15,fill:D.muted,anchor:'middle'});
    if(s.on)h+=ray([src,H],full?'#ffffff':SPECTRUM[s.hue][1],{w:4,arrow:false})+T(170,392,full?'白光':nm+'光',{size:16,fill:full?D.ink:SPECTRUM[s.hue][1],anchor:'middle',weight:700});
    const spots=[];
    for(const i of full?SPECTRUM.map((c,j)=>j):[s.hue]){const n=1.50+i*0.02,d1=cRefr(d0,[-0.866,-0.5],1,n),P2=hitFace(H,d1,A,C);let e=cRefr(d1,[-0.866,0.5],n,1);if(!e)continue;const pts=[H,P2];
      if(nw){const Q1=hitFace(P2,e,C2,A2),e1=cRefr(e,[-0.866,0.5],1,n),Q2=hitFace(Q1,e1,A2,B2);e=cRefr(e1,[-0.866,-0.5],n,1);if(!e)continue;pts.push(Q1,Q2);}
      const P=pts[pts.length-1],S=[852,P[1]+e[1]*(852-P[0])/e[0]];pts.push(S);spots.push([S[1],SPECTRUM[i][1],SPECTRUM[i][0],P]);
      if(s.on)h+=ray(pts,SPECTRUM[i][1],{w:full?2.2:3.5,arrow:false,op:.95,delay:len});}
    const fade=fadeIn(),done=s.on&&arrived();
    if(done&&nw&&full){const r0=spots[0],v0=spots[spots.length-1],p0=[r0[3],v0[3]].sort((a,b)=>(b[0]*d0[0]+b[1]*d0[1])-(a[0]*d0[0]+a[1]*d0[1]))[0],y0=Math.min(r0[0],v0[0]),y1=Math.max(r0[0],v0[0]);
      h+=`<defs><linearGradient id="nwt" gradientUnits="userSpaceOnUse" x1="${p0[0]}" y1="${p0[1]}" x2="${p0[0]+d0[0]*50}" y2="${p0[1]+d0[1]*50}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs>`;
      h+=`<g opacity="${fade}"><polygon points="${r0[3]} 852,${r0[0]} 852,${v0[0]} ${v0[3]}" fill="url(#nwt)" stroke="url(#nwt)" stroke-width="3"/><rect x="852" y="${y0-3}" width="18" height="${y1-y0+6}" fill="#fff"/>${T(846,y0-16,'又變回白光',{size:16,fill:'#ffffff',anchor:'end',weight:700})}</g>`;}
    else if(done)spots.forEach(([y,c,n],j)=>{h+=`<rect x="852" y="${y-6}" width="18" height="12" fill="${c}"/>`;if(!full||j===0||j===spots.length-1)h+=T(875,y+5,n,{size:15,fill:c,weight:700});});
    h+=`<rect x="18" y="404" width="34" height="22" rx="5" transform="rotate(-29 35 415)" fill="${s.on?'#c9d3df':'#5a6573'}"/>`;
    const inc=s.on?(full?'白光':nm+'光'):'沒有光（關燈）',reads=!full?[['入射光',inc],['射出',done?nm+'光（不再分散）':'—'],...(nw?[['倒置的三稜鏡',done?'又把它偏折回來':'—']]:[])]:nw?[['入射光',inc],['第一個三稜鏡',done?'分成各種色光':'—'],['倒置的三稜鏡',done?'把各色光偏折回來':'—'],['紙屏上',done?'又變回白光':'—']]:[['入射光',inc],['射出',done?'七種色光':'—'],['偏折最少',done?'紅光':'—'],['偏折最多',done?'紫光':'—']];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:!full?'單色光通過三稜鏡只會<b>偏折</b>，不會再分出其他顏色。':nw?'倒置的三稜鏡把各色光<b>反方向偏折</b>回來，重疊在一起 → <b>又變回白光</b>（牛頓的實驗）。可見顏色不是三稜鏡「染」上去的，白光本來就含有各種色光。':'各色光在玻璃中的<b>光速不同</b>（4-3）→ 偏折程度不同：<b>紫光最多、紅光最少</b>，白光就分成各種色光，這叫<b>色散</b>。光都偏向三稜鏡<b>較厚的底部</b>，這也是凸透鏡能會聚光的原因（4-4）。<br><small>延伸：4-3「光的折射」的波前圖，可以比較紅光和紫光。</small>'};},
  rainbow(s){
    /* 彩虹：陽光在水滴裡折射 → 反射 → 再折射。水的折射率紅光約 1.331、紫光約 1.343，圖中色散放大 4 倍 */
    const nOf=i=>1.331+0.008*i,drop=(c,R,n)=>{const b=0.86*R,E=[c[0]-Math.sqrt(R*R-b*b),c[1]-b],un=p=>[(p[0]-c[0])/R,(p[1]-c[1])/R],cut=(p,d)=>{const t=-2*((p[0]-c[0])*d[0]+(p[1]-c[1])*d[1]);return[p[0]+d[0]*t,p[1]+d[1]*t];};
      const d1=cRefr([1,0],un(E),1,n),P=cut(E,d1),u=un(P),k=2*(d1[0]*u[0]+d1[1]*u[1]),d2=[d1[0]-k*u[0],d1[1]-k*u[1]],Q=cut(P,d2),w=un(Q);return{E,P,Q,d:cRefr(d2,[-w[0],-w[1]],n,1)||d2};};
    const sun=(x,y)=>`<circle cx="${x}" cy="${y}" r="20" fill="${s.on?'#ffd60a':'#5a6573'}"/>`+[0,1,2,3,4,5,6,7].map(k=>{const a=k*Math.PI/4;return L(x+27*Math.cos(a),y+27*Math.sin(a),x+35*Math.cos(a),y+35*Math.sin(a),{stroke:s.on?'#ffd60a':'#5a6573',w:3});}).join('');
    const off=!s.on?T(s.rv==='sky'?450:200,250,'沒有陽光，就沒有彩虹',{size:20,fill:D.muted,anchor:'middle'}):'',RED=SPECTRUM[0][1],VIO=SPECTRUM[6][1];
    const note='小水滴就像<b>小三稜鏡</b>：陽光進入水滴<b>折射</b>、在後面<b>反射</b>、出來時<b>再折射</b>，各色光偏折不同 → 色散。要<b>背對太陽</b>才看得到；主虹<b>外紅內紫</b>。';
    let h='';
    if(s.rv==='sky'){
      /* 觀察者背對太陽：較高的水滴送紅光進眼睛，較低的送紫光 */
      const eye=[100,440],ang=i=>{const d=drop([0,0],10,nOf(i)).d;return Math.atan2(d[1],-d[0]);},drops=[0,3,6].map(i=>{const a=ang(i);return[i,[eye[0]+560*Math.cos(a),eye[1]-560*Math.sin(a)]];});
      h+=L(20,488,880,488,{stroke:'#3a4554',w:2})+L(eye[0],eye[1],640,eye[1],{stroke:D.muted,w:1.5,dash:true,op:.7})+T(330,462,'和陽光平行的方向',{size:13,fill:D.muted,anchor:'middle'});
      h+=sun(46,392)+T(46,440,'太陽',{size:14,fill:D.muted,anchor:'middle'})+T(46,458,'（在背後）',{size:12,fill:D.muted,anchor:'middle'});
      h+=`<circle cx="${eye[0]-6}" cy="${eye[1]+2}" r="12" fill="#c9d3df"/><circle cx="${eye[0]}" cy="${eye[1]}" r="2.5" fill="#05080d"/>`+L(eye[0]-6,eye[1]+14,eye[0]-6,eye[1]+34,{stroke:'#c9d3df',w:4})+L(eye[0]-6,eye[1]+34,eye[0]-14,eye[1]+47,{stroke:'#c9d3df',w:4})+L(eye[0]-6,eye[1]+34,eye[0]+2,eye[1]+47,{stroke:'#c9d3df',w:4});
      for(const[i,D0]of drops){const sl=D0[0]-11-70;if(s.on)h+=ray([[70,D0[1]],[D0[0]-11,D0[1]]],'#ffffff',{w:2,op:.8});
        SPECTRUM.forEach(([,c],j)=>{const a=ang(j),dir=[-Math.cos(a),Math.sin(a)];if(!s.on)return;h+=j===i?ray([D0,eye],c,{w:3.5,delay:sl}):ray([D0,[D0[0]+dir[0]*70,D0[1]+dir[1]*70]],c,{w:1.6,op:.45,arrow:false,delay:sl});});
        h+=`<circle cx="${D0[0]}" cy="${D0[1]}" r="11" fill="#9fd8ff33" stroke="#bfe6ff" stroke-width="2"/>`+T(D0[0]+20,D0[1]+5,!s.on?'小水滴':i===0?'較高的水滴 → 紅光進入眼睛':i===6?'較低的水滴 → 紫光進入眼睛':'中間的水滴 → 綠光進入眼睛',{size:14,fill:s.on?SPECTRUM[i][1]:D.muted,weight:700});}
      if(s.on)h+=T(80,58,'陽光（從背後照來）',{size:14,fill:D.ink});
      const fade=fadeIn(),aR=ang(0),aV=ang(6),arc=(r,a,c)=>`<path d="M${eye[0]+r} ${eye[1]}A${r} ${r} 0 0 0 ${eye[0]+r*Math.cos(a)} ${eye[1]-r*Math.sin(a)}" fill="none" stroke="${c}" stroke-width="2"/>`;
      if(s.on&&fade>0){h+=`<g opacity="${fade}">${arc(92,aR,RED)}${arc(74,aV,VIO)}${T(eye[0]+100*Math.cos(aR+0.12),eye[1]-100*Math.sin(aR+0.12),'42°',{size:14,fill:RED,anchor:'end',weight:700})}${T(eye[0]+86*Math.cos(aV-0.2),eye[1]-86*Math.sin(aV-0.2)+4,'40°',{size:14,fill:VIO,weight:700})}`;
        h+=`<rect x="650" y="250" width="226" height="222" rx="14" fill="#0b1220" stroke="#3a4554"/>`+T(763,278,'你看到的彩虹',{size:15,fill:D.ink,anchor:'middle',weight:700})+SPECTRUM.map(([,c],j)=>{const r=100-j*6;return `<path d="M${763-r} 452A${r} ${r} 0 0 1 ${763+r} 452" fill="none" stroke="${c}" stroke-width="6.5"/>`;}).join('')+L(656,453,870,453,{stroke:'#3a4554',w:2});
        h+=T(763,342,'外圈：紅',{size:13,fill:RED,anchor:'middle',weight:700})+T(763,438,'內圈：紫',{size:13,fill:VIO,anchor:'middle',weight:700})+'</g>';}
      return {svg:`<g clip-path="url(#stage-clip)">${h}${off}</g>`,reads:s.on?[['較高的水滴','送紅光進眼睛'],['較低的水滴','送紫光進眼睛'],['所以主虹','外紅內紫'],['太陽在','觀察者背後']]:[['陽光','沒有'],['彩虹','看不到']],
        note:note+'<br>每顆水滴都射出各種色光，但只有一種剛好進入眼睛：<b>較高</b>的水滴送來紅光、<b>較低</b>的送來紫光 → 紅色在外圈。<br><small>真實角度：紅光約 42°、紫光約 40°；圖中把角度差放大了。</small>'};
    }
    /* 一顆放大的水滴 */
    const c=[520,190],R=150,ps=SPECTRUM.map((x,i)=>drop(c,R,nOf(i))),E=ps[0].E;
    h+=`<circle cx="${c[0]}" cy="${c[1]}" r="${R}" fill="#9fd8ff1c" stroke="#bfe6ff" stroke-width="2.5"/>`+T(640,72,'小水滴（放大圖）',{size:15,fill:'#bfe6ff',weight:700});
    h+=sun(46,E[1])+L(ps[0].Q[0],ps[0].Q[1],ps[0].Q[0]-300,ps[0].Q[1],{stroke:D.muted,w:1.5,dash:true,op:.7})+T(ps[0].Q[0]-300,ps[0].Q[1]-8,'和陽光平行的方向',{size:13,fill:D.muted});
    if(s.on)h+=ray([[78,E[1]],E],'#ffffff',{w:4,arrow:false})+T(200,E[1]-14,'陽光（白光）',{size:15,fill:D.ink,anchor:'middle'});
    ps.forEach((p,i)=>{if(s.on)h+=ray([p.E,p.P,p.Q,[p.Q[0]+p.d[0]*190,p.Q[1]+p.d[1]*190]],SPECTRUM[i][1],{w:2.2,arrow:false,op:.95,delay:E[0]-78});});
    const fade=fadeIn(),eR=[ps[0].Q[0]+ps[0].d[0]*190,ps[0].Q[1]+ps[0].d[1]*190],eV=[ps[6].Q[0]+ps[6].d[0]*190,ps[6].Q[1]+ps[6].d[1]*190];
    h+=T(E[0]+10,E[1]+34,'① 折射',{size:14,fill:D.ink,weight:700})+T(ps[0].P[0]+14,ps[0].P[1]+6,'② 反射',{size:14,fill:D.ink,weight:700})+T(ps[0].Q[0]+14,ps[0].Q[1]+22,'③ 再折射',{size:14,fill:D.ink,weight:700});
    if(s.on&&fade>0)h+=`<g opacity="${fade}">${T(eR[0]+10,eR[1]+4,'紅光 約 42°',{size:15,fill:RED,weight:700})}${T(eV[0]-10,eV[1]+4,'紫光 約 40°',{size:15,fill:VIO,anchor:'end',weight:700})}</g>`;
    h+=T(30,486,'射向背對太陽的觀察者 ↙',{size:13,fill:D.muted});
    return {svg:`<g clip-path="url(#stage-clip)">${h}${off}</g>`,reads:s.on?[['陽光在水滴裡','折射 → 反射 → 折射'],['紅光射出','約 42°'],['紫光射出','約 40°'],['要看到彩虹','背對太陽']]:[['陽光','沒有'],['彩虹','看不到']],
      note:note+'<br><small>角度是和陽光方向比較；圖中把色散放大了。</small>'};},
  clear(s){
    /* 透明物體：照射的光 × 玻璃紙讓它透過的色光 */
    const c0=lightRGB(s),any=Math.max(...c0)>0,has=c=>Math.max(...c)>=40,ln=c=>colorName(...c),white=c0.every(v=>v>0);
    let h=`<rect x="20" y="20" width="860" height="460" rx="20" fill="#05080d"/><rect x="34" y="226" width="40" height="48" rx="8" fill="${s.on?'#c9d3df':'#5a6573'}"/>`+T(54,300,'光源',{size:14,fill:D.muted,anchor:'middle'});
    if(s.tv==='rgb'){
      /* 白光 → 紅綠藍濾色片 → 三道色光疊在屏幕上；拿掉濾色片，光就直接通過 */
      const F=[['紅',[1,0,0],s.fR,130,[680,190]],['綠',[0,1,0],s.fG,250,[780,190]],['藍',[0,0,1],s.fB,370,[730,280]]],outs=F.map(([,f,on])=>on?cmul(c0,f):c0),vis=[];
      h+=`<rect x="560" y="70" width="300" height="340" rx="10" fill="#0b0f16" stroke="#3a4554" stroke-width="2"/>`+T(710,58,'白色屏幕',{size:15,fill:D.muted,anchor:'middle'});
      F.forEach(([n,f,on,fy,[tx,ty]],i)=>{const d1=Math.hypot(300-74,fy-250),c=outs[i];
        if(s.on&&any)h+=ray([[74,250],[300,fy]],rgbOf(c0),{w:9,arrow:false,op:.8});
        if(s.on&&has(c))h+=ray([[318,fy],[tx,ty]],rgbOf(c),{w:9,arrow:false,op:.85,delay:d1+18});
        vis.push(s.on&&has(c)?clamp((REACH-d1-18-Math.hypot(tx-318,ty-fy))/200,0,1):1);
        h+=on?`<rect x="300" y="${fy-40}" width="18" height="80" rx="4" fill="${rgbOf(f.map(v=>v*255))}" opacity=".75" stroke="#ffffff55"/>`+T(309,fy-48,`${n}色濾色片`,{size:14,fill:D.ink,anchor:'middle'}):`<rect x="300" y="${fy-40}" width="18" height="80" rx="4" fill="none" stroke="#ffffff33" stroke-dasharray="4 4"/>`+T(309,fy-48,'（拿掉了）',{size:14,fill:D.muted,anchor:'middle'});});
      h+=`<g style="isolation:isolate">${F.map(([,,,,[tx,ty]],i)=>s.on&&has(outs[i])&&vis[i]>0?`<circle cx="${tx}" cy="${ty}" r="78" fill="${rgbOf(outs[i])}" opacity="${vis[i]}" style="mix-blend-mode:screen"/>`:'').join('')}</g>`;
      const sum=outs.reduce((a,c)=>a.map((v,i)=>Math.min(255,v+c[i])),[0,0,0]),done=vis.every(v=>v>=1);
      h+=T(710,450,done?`中央重疊：${ln(sum)}`:'',{size:21,fill:D.ink,anchor:'middle',weight:700});
      return {svg:h,reads:[['照射的光',ln(c0)],...F.map(([n,,on],i)=>[`${n}色濾色片`,!any?'—':!on?`拿掉了，${ln(c0)}直接通過`:!done?'—':has(outs[i])?`透過 ${ln(outs[i])}`:'全部被吸收']),['三道光疊在一起',done?ln(sum):'—']],
        note:(white&&s.fR&&s.fG&&s.fB?'白光含有各種色光。三片濾色片分別只讓紅、綠、藍光<b>透過</b>，三道色光在屏幕上疊回去 → 看起來又是<b>白色</b>；兩兩重疊是黃、青、洋紅。':white?'拿掉濾色片的那一道是<b>白光</b>，直接通過；它和其他色光疊在一起，看起來還是偏白。':'三片濾色片分別只讓紅、綠、藍光<b>透過</b>；照射的光裡沒有的色光，濾色片也變不出來。')+'拿掉濾色片，光就直接通過。'};
    }
    /* 一張或兩張玻璃紙排在一起 */
    const ks=s.tv==='two'?[s.f1,s.f2]:[s.f1],xs=s.tv==='two'?[300,520]:[400],steps=[];let c=c0,x=74,dl=0;
    ks.forEach((k,j)=>{const[nm,f]=FILTERS[k],x1=xs[j],out=cmul(c,f),abs=cmul(c,f.map(v=>1-v)),got=s.on&&has(c)&&REACH>=dl+x1-x;
      if(s.on&&has(c))h+=ray([[x,250],[x1,250]],rgbOf(c),{w:14,arrow:false,op:.85,delay:dl});
      h+=`<rect x="${x1}" y="150" width="16" height="200" rx="3" fill="${rgbOf(f.map(v=>v*255))}" opacity=".7" stroke="#ffffff66"/>`+T(x1+8,138,`${nm}色玻璃紙`,{size:15,fill:D.ink,anchor:'middle',weight:700});
      if(got)h+=T(x1+8,380,has(out)?`透過：${ln(out)}`:'全部被吸收',{size:14,fill:D.ink,anchor:'middle'})+(has(abs)?T(x1+8,402,`吸收：${c.every(v=>v>0)?'其餘色光':ln(abs)}`,{size:14,fill:D.muted,anchor:'middle'}):'');
      steps.push([nm,out]);dl+=x1-x;c=out;x=x1+16;});
    if(s.on&&has(c))h+=ray([[x,250],[760,250]],rgbOf(c),{w:14,arrow:false,op:.85,delay:dl});
    const done=!s.on||!any||arrived(),fade=s.on&&any?fadeIn():1,res=!any?'沒有光':has(c)?ln(c):'幾乎沒有光';
    h+=`<rect x="760" y="90" width="26" height="320" rx="4" fill="#2a313c" stroke="#3a4554"/>`+T(773,78,'白色屏幕',{size:15,fill:D.muted,anchor:'middle'});
    if(done&&has(c))h+=`<ellipse cx="773" cy="250" rx="13" ry="40" fill="${rgbOf(c)}" opacity="${fade}"/>`;
    h+=T(773,446,done?res:'',{size:18,fill:D.ink,anchor:'middle',weight:700});
    const pass=o=>!any?'—':!done?'—':has(o)?ln(o):'幾乎沒有光',[n1]=FILTERS[s.f1],[n2]=FILTERS[s.f2],o1=steps[0][1];
    const reads=s.tv==='two'?[['照射的光',ln(c0)],[`第一張（${n1}）透過`,pass(o1)],[`第二張（${n2}）透過`,pass(c)],['屏幕上',done?res:'—']]:[['照射的光',ln(c0)],[`${n1}色玻璃紙透過`,pass(c)],['屏幕上',done?res:'—']];
    let note='透明物體的顏色＝它讓哪些色光<b>透過</b>，其餘被吸收。';
    if(s.tv==='two')note+='兩張疊在一起：光要<b>兩張都能透過</b>才到得了屏幕，越疊越暗'+(any&&has(o1)&&!has(c)?`。${n1}色玻璃紙透過的${ln(o1)}，到了${n2}色玻璃紙被吸收 → <b>幾乎沒有光</b>${FILTERS[s.f1][1].every((v,i)=>!(v&&FILTERS[s.f2][1][i]))?`（不是色光相加，不會變成${ln(FILTERS[s.f1][1].map((v,i)=>255*Math.max(v,FILTERS[s.f2][1][i])))}）`:''}。`:'。');
    else if(any&&white)note+=`白光含有各種色光，${n1}色玻璃紙${FILTERS[s.f1][2]} → 屏幕上是<b>${n1}色</b>。`;
    else if(any)note+='照射的光裡，只有玻璃紙能讓它透過的部分才過得去。';
    return {svg:h,reads,note};},
  opaque(s){
    /* 不透明物體：照射的光 × 物體反射的色光 */
    const c0=lightRGB(s),any=Math.max(...c0)>0,reach=s.on?REACH:0,has=c=>Math.max(...c)>=40,ln=c=>colorName(...c),cn=c=>colorName(...c,'色');
    let h=`<rect x="20" y="20" width="560" height="460" rx="20" fill="#05080d"/>`;
    if(s.ov==='text'){
      /* 白紙上的字：眼睛看到的＝照射的光 × 反射 × 玻璃紙透過 */
      const INK={r:['紅',[1,0,0]],g:['綠',[0,1,0]],b:['藍',[0,0,1]],k:['黑',[0,0,0]]},[iname,ink]=INK[s.ink],fl=s.gv==='none'?null:FILTERS[s.gv],lit=clamp((reach-60)/150,0,1),done=!s.on||lit>=1;
      const pD=c0.map(v=>v*lit),tD=cmul(pD,ink),pF=fl?cmul(pD,fl[1]):pD,tF=fl?cmul(tD,fl[1]):tD;
      if(reach>0&&any)h+=`<polygon points="270,40 330,40 540,${40+Math.min(reach,60)} 60,${40+Math.min(reach,60)}" fill="${rgbOf(c0)}" opacity=".2"/>`;
      h+=`<rect x="262" y="24" width="76" height="22" rx="6" fill="${s.on?'#c9d3df':'#5a6573'}"/><rect x="60" y="100" width="240" height="350" fill="${rgbOf(pD)}"/><rect x="300" y="100" width="240" height="350" fill="${rgbOf(pF)}"/>`;
      h+=T(180,315,'理化',{size:92,fill:rgbOf(tD),anchor:'middle',weight:900})+T(420,315,'理化',{size:92,fill:rgbOf(tF),anchor:'middle',weight:900})+T(180,476,'直接看',{size:15,fill:D.muted,anchor:'middle'});
      h+=fl?`<rect x="296" y="90" width="254" height="370" rx="6" fill="none" stroke="${rgbOf(fl[1].map(v=>v*255))}" stroke-width="3" stroke-dasharray="9 5"/>`+T(423,476,`透過${fl[0]}色玻璃紙看`,{size:15,fill:D.ink,anchor:'middle',weight:700}):T(420,476,'（沒有蓋玻璃紙）',{size:15,fill:D.muted,anchor:'middle'});
      const[pa,ta,pb,tb]=[pD,tD,pF,tF].map(cn),verdict=!any?'沒有光，什麼都看不到':!has(pF)&&!has(tF)?'一片黑，什麼都看不到':pb===tb?'字和紙同色 → 看不出字':tb==='黑色'?'字是黑色 → 看得很清楚':'字和紙顏色不同 → 看得到字';
      h+=T(735,70,'看到的顏色',{size:17,fill:D.muted,anchor:'middle'});
      if(done){if(any)h+=T(735,130,'直接看',{size:16,fill:D.ink,anchor:'middle',weight:700})+T(735,162,`紙：${pa}　字：${ta}`,{size:16,fill:D.ink,anchor:'middle'});
        if(fl&&any)h+=T(735,230,`透過${fl[0]}色玻璃紙`,{size:16,fill:D.ink,anchor:'middle',weight:700})+T(735,262,`紙：${pb}　字：${tb}`,{size:16,fill:D.ink,anchor:'middle'});
        h+=T(735,340,verdict,{size:18,fill:D.object,anchor:'middle',weight:700});}
      let note='不透明物體的顏色＝它<b>反射</b>哪些色光，其餘被吸收。透過玻璃紙看時，只有玻璃紙讓它透過的色光才到得了眼睛。';
      if(fl&&done&&any){if(has(tD)&&!has(tF)&&has(pF))note+=`<br>${iname}字反射的${ln(tD)}過不了${fl[0]}色玻璃紙 → 字變成<b>黑色</b>；紙看起來是${pb}。`;else if(pb===tb)note+=`<br>紙和字透過來的都是${ln(pF)} → 字和紙同色，<b>看不出來</b>。`;}
      return {svg:h,reads:[['照射的光',ln(c0)],['直接看',done&&any?`紙${pa}・字${ta}`:'—'],[fl?`透過${fl[0]}色玻璃紙`:'玻璃紙',fl?(done&&any?`紙${pb}・字${tb}`:'—'):'沒有蓋'],['結果',done?verdict:'—']],note};
    }
    const[oname,ref]=REFLECT[s.obj],lit=clamp((reach-250)/150,0,1),out=cmul(c0,ref).map(v=>v*lit),done=!s.on||lit>=1,look=any?cn(out):'看不見';
    const shape=(c,stroke='#ffffff40')=>({apple:`<circle cx="0" cy="0" r="62" fill="${c}" stroke="${stroke}" stroke-width="2"/><path d="M0 -58Q4 -80 18 -88" stroke="#5b4026" stroke-width="7" fill="none" stroke-linecap="round"/>`,
      leaf:`<path d="M-90 25Q-20 -95 90 -25Q20 75 -90 25Z" fill="${c}" stroke="${stroke}" stroke-width="2"/><path d="M-80 22Q0 -10 80 -22" stroke="#00000040" stroke-width="3" fill="none"/>`,
      banana:`<path d="M-95 -30Q0 80 95 -35Q86 -12 74 -6Q0 42 -84 -40Z" fill="${c}" stroke="${stroke}" stroke-width="2"/>`,
      paper:`<rect x="-62" y="-80" width="124" height="160" rx="4" fill="${c}" stroke="${stroke}" stroke-width="2"/>`,
      cloth:`<path d="M-80 -70Q-40 -82 0 -70T80 -70V70Q40 82 0 70T-80 70Z" fill="${c}" stroke="${stroke}" stroke-width="2"/>`})[s.obj];
    const len=Math.min(reach,380),w=len/380*220;
    if(len>0&&any)h+=`<polygon points="270,40 330,40 ${300+w},${40+len} ${300-w},${40+len}" fill="${rgbOf(c0)}" opacity=".22"/>`+(len>=380?`<ellipse cx="300" cy="420" rx="220" ry="34" fill="${rgbOf(c0)}" opacity=".35"/>`:'');
    h+=`<rect x="262" y="24" width="76" height="22" rx="6" fill="${s.on?'#c9d3df':'#5a6573'}"/><g transform="translate(300 330)">${shape(rgbOf(out))}</g>`;
    h+=T(735,70,'白光下',{size:17,fill:D.muted,anchor:'middle'})+`<g transform="translate(735 160) scale(.7)">${shape(rgbOf(ref.map(v=>v*255)))}</g>`+T(735,262,oname,{size:18,fill:D.ink,anchor:'middle'});
    h+=T(735,330,'現在看起來',{size:17,fill:D.muted,anchor:'middle'})+T(735,375,done?look:'',{size:32,fill:D.ink,anchor:'middle',weight:700});
    const refl=ref.every(v=>v>0)?'所有色光':ref.some(v=>v>0)?['紅','綠','藍'].filter((_,i)=>ref[i]).join('、')+'光':'幾乎不反射';
    const why={apple:'紅蘋果只反射紅光，其餘色光都被吸收。',leaf:'綠葉只反射綠光，其餘色光都被吸收。',banana:'黃香蕉反射<b>紅光和綠光</b>（黃＝紅＋綠），所以在紅光下是紅色、在綠光下是綠色。',paper:'白紙反射<b>所有</b>色光，照什麼顏色的光，看起來就是什麼顏色。',cloth:'黑布吸收<b>所有</b>色光，照什麼光都是黑色。'}[s.obj];
    return {svg:h,reads:[['照射的光',ln(c0)],['物體會反射',refl],['看起來',done?look:'—']],
      note:'不透明物體的顏色＝它<b>反射</b>哪些色光，其餘被吸收。'+why+(done&&any&&s.obj!=='cloth'&&look==='黑色'?'照射的光裡沒有它能反射的色光 → 看起來是<b>黑色</b>。':'')};},
  mix(s){
    /* 色光三原色：紅、綠、藍三盞燈照在白牆上 */
    const c0=lightRGB(s),[r,g,b]=c0,lamps=[[60,60,250,200,'255,60,60',r,'紅'],[570,60,380,200,'60,255,90',g,'綠'],[315,470,315,312,'80,140,255',b,'藍']];
    let h=`<rect x="35" y="30" width="550" height="440" rx="22" fill="#05080d"/>`;
    const vis=lamps.map(([x0,y0,x1,y1])=>clamp((REACH-Math.hypot(x1-x0,y1-y0))/200,0,1)),[vr,vg,vb]=vis;
    h+=`<g style="isolation:isolate">${[[250,200,[r*vr,0,0]],[380,200,[0,g*vg,0]],[315,312,[0,0,b*vb]]].map(([x,y,c])=>Math.max(...c)>0?`<circle cx="${x}" cy="${y}" r="130" fill="${rgbOf(c)}" style="mix-blend-mode:screen"/>`:'').join('')}</g>`;
    lamps.forEach(([x0,y0,x1,y1,c,val,lab])=>{if(val>0)h+=ray([[x0,y0],[x1,y1]],`rgb(${c})`,{w:6,op:.85});h+=`<circle cx="${x0}" cy="${y0}" r="17" fill="${val>0?`rgb(${c})`:'#3a4250'}" stroke="#ffffff55" stroke-width="2"/>`+T(x0,y0+6,lab,{size:15,fill:'#05080d',anchor:'middle',weight:700});});
    const done=Math.min(...vis.map((v,i)=>c0[i]>0?v:1))>=1,res=colorName(r,g,b);
    h+=T(735,72,'重疊後的顏色',{size:18,fill:D.muted,anchor:'middle'})+`<rect x="635" y="95" width="200" height="170" rx="20" fill="${done?rgbOf(c0):'#05080d'}" stroke="#ffffff33"/>`+T(735,305,done?res:'',{size:30,fill:D.ink,anchor:'middle',weight:700});
    h+=T(735,370,'紅 + 綠 = 黃',{size:17,fill:D.muted,anchor:'middle'})+T(735,400,'綠 + 藍 = 青',{size:17,fill:D.muted,anchor:'middle'})+T(735,430,'紅 + 藍 = 洋紅',{size:17,fill:D.muted,anchor:'middle'});
    return {svg:h,reads:[['紅光',r?'開':'關'],['綠光',g?'開':'關'],['藍光',b?'開':'關'],['重疊後',done?res:'—']],
      note:'色光三原色是<b>紅、綠、藍</b>。色光相加會<b>更亮</b>：紅＋綠＝黃、綠＋藍＝青、紅＋藍＝洋紅，三色一起＝白光。'};},
  paint(s){
    /* （延伸）顏料三原色：每種吸收一種色光（減色） */
    const P3=[['青',[0,1,1],s.pc,[230,190]],['洋紅',[1,0,1],s.pm,[350,190]],['黃',[1,1,0],s.py,[290,295]]],sel=P3.filter(p=>p[2]),ref=sel.reduce((a,p)=>cmul(a,p[1]),[1,1,1]),look=ref.map(v=>s.on?v*255:0);let seen=s.on?colorName(...look,'色'):'看不見（沒有光）';
    let h=`<rect x="40" y="30" width="500" height="440" rx="20" fill="#fbfaf6"/><g style="isolation:isolate">${P3.map(([,c,on,[x,y]])=>on?`<circle cx="${x}" cy="${y}" r="105" fill="${rgbOf(c.map(v=>v*255))}" style="mix-blend-mode:multiply"/>`:'').join('')}</g>`;
    P3.forEach(([n,,on,[x,y]],i)=>{if(on)h+=T(x+[-60,60,0][i],y+[-70,-70,85][i],n,{size:18,fill:'#1b2a33',anchor:'middle',weight:700});});
    const pair=(a,b,x,y,t)=>P3[a][2]&&P3[b][2]?T(x,y,t,{size:15,fill:'#ffffff',anchor:'middle',weight:700}):'';
    if(s.on)h+=pair(0,1,290,160,'藍')+pair(1,2,345,262,'紅')+pair(0,2,235,262,'綠')+(sel.length===3?T(290,228,'黑',{size:15,fill:'#ffffff',anchor:'middle',weight:700}):'');
    if(!s.on)h+=`<rect x="40" y="30" width="500" height="440" rx="20" fill="#05080d" opacity=".88"/>`+T(290,250,'沒有光照，看不到顏色',{size:18,fill:D.muted,anchor:'middle'});
    if(s.compare){
      h+=T(730,60,'色光混合（加色）',{size:17,fill:D.ink,anchor:'middle',weight:700})+`<rect x="600" y="75" width="260" height="210" rx="16" fill="#05080d" stroke="#3a4554"/><g style="isolation:isolate"><circle cx="700" cy="150" r="58" fill="#ff0000"/><circle cx="760" cy="150" r="58" fill="#00ff00" style="mix-blend-mode:screen"/><circle cx="730" cy="205" r="58" fill="#0000ff" style="mix-blend-mode:screen"/></g>`;
      h+=T(730,320,'色光：越加越亮 → 白',{size:16,fill:D.ink,anchor:'middle'})+T(730,348,'顏料：越混越暗 → 黑',{size:16,fill:D.ink,anchor:'middle'})+T(730,392,'色光兩兩相加 ＝ 顏料三原色',{size:15,fill:D.muted,anchor:'middle'})+T(730,418,'顏料兩兩相混 ＝ 色光三原色',{size:15,fill:D.muted,anchor:'middle'});
    }else{
      h+=T(730,60,s.on?'白光照到顏料上':'沒有光照到顏料',{size:17,fill:D.ink,anchor:'middle',weight:700})+(s.on?T(730,82,'（用紅、綠、藍光代表白光）',{size:13,fill:D.muted,anchor:'middle'}):'');
      [['#ff453a',0],['#32d74b',1],['#0a84ff',2]].forEach(([c,i],k)=>{const x0=600+k*28,x1=680+k*30,inLen=Math.hypot(x1-x0,358-90);if(s.on)h+=ray([[x0,90],[x1,358]],c,{w:4});
        if(ref[i]>0.5){if(s.on)h+=ray([[x1,358],[x1+110,100]],c,{w:4,delay:inLen});}else if(s.on&&REACH>inLen)h+=T(x1,390,'×',{size:22,fill:'#ffffff',anchor:'middle',weight:700});});
      const pd=!s.on||arrived();if(!pd)seen='—';h+=`<rect x="620" y="360" width="220" height="44" rx="8" fill="${pd?rgbOf(look):'#05080d'}" stroke="#ffffff55"/>`+T(730,436,pd?`看起來：${seen}`:'',{size:18,fill:D.ink,anchor:'middle',weight:700});
    }
    const abs=['紅','綠','藍'].filter((_,i)=>ref[i]<0.5),refl=['紅','綠','藍'].filter((_,i)=>ref[i]>0.5);
    return {svg:h,reads:[['顏料',sel.length?sel.map(p=>p[0]).join(' ＋ '):'（白紙）'],['吸收',!s.on?'—':abs.length?abs.join('、')+'光':'沒有'],['反射',!s.on?'—':refl.length?refl.join('、')+'光':'沒有'],['看起來',seen]],
      note:'（延伸）顏料三原色是<b>青、洋紅、黃</b>：青吸收紅光、洋紅吸收綠光、黃吸收藍光。混得越多吸收越多 → 越暗（<b>減色</b>）。'};}}
};
function setCounts(s,c){for(const k of Object.keys(SPECIES))s.counts[k]=c[k]||0;}
function lamMark(x1,x2,y,lam,c,label){return L(x1,y,x2,y,{stroke:c,w:2})+L(x1,y-8,x1,y+8,{stroke:c,w:2})+L(x2,y-8,x2,y+8,{stroke:c,w:2})+T((x1+x2)/2,y-10,label||`λ = ${lam.toFixed(2)} m`,{size:15,fill:c,anchor:'middle',weight:700});}

/* ---------- 引擎 ---------- */
const labEl=document.getElementById('lab');
let current='lens',cfg=null,state=null,raf=0,drag=null,svgEl=null;
function snap(key,v){const c=cfg.controls.find(c=>c.type==='range'&&c.key===key);if(!c)return v;const x=Math.round((clamp(v,c.min,c.max)-c.min)/c.step)*c.step+c.min;return +clamp(x,c.min,c.max).toFixed(6);}
function controlHTML(c,i){
  const lab=c.label?`<span class="ctl-label">${c.label}</span>`:'';
  if(c.type==='range')return `<div class="control" data-c="${i}"><label for="c-${c.key}">${c.label}<output></output></label><input id="c-${c.key}" type="range" data-c="${i}" min="${c.min}" max="${c.max}" step="${c.step}"></div>`;
  if(c.type==='seg')return `<div class="control" data-c="${i}">${lab}<div class="seg" role="group" aria-label="${c.label}">${c.options.map(([,t],j)=>`<button type="button" data-c="${i}" data-o="${j}">${t}</button>`).join('')}</div></div>`;
  if(c.type==='toggle')return `<div class="control" data-c="${i}"><label class="toggle"><input type="checkbox" data-c="${i}"><span>${c.label}</span></label></div>`;
  if(c.type==='buttons')return `<div class="control" data-c="${i}">${lab}<div class="control-buttons">${c.items.map(([t],j)=>`<button type="button" class="btn${c.primary?' primary':''}" data-c="${i}" data-a="${j}">${t}</button>`).join('')}</div></div>`;
  if(c.type==='counter')return `<div class="control" data-c="${i}">${lab}<div class="counter">${c.items.map(([k,t])=>`<div class="count-row"><span>${t}</span><span class="stepper"><button type="button" data-c="${i}" data-k="${k}" data-d="-1" aria-label="減少${t}">−</button><output data-k="${k}"></output><button type="button" data-c="${i}" data-k="${k}" data-d="1" aria-label="增加${t}">＋</button></span></div>`).join('')}</div></div>`;
  return '';
}
function sync(){
  cfg.controls.forEach((c,i)=>{const box=labEl.querySelector(`.control[data-c="${i}"]`);if(!box)return;box.hidden=c.show?!c.show(state):false;
    if(c.type==='range'){const el=box.querySelector('input'),v=state[c.key];if(el.value!==String(v))el.value=v;el.style.setProperty('--p',(v-c.min)/(c.max-c.min)*100+'%');box.querySelector('output').textContent=c.fmt?c.fmt(state):`${v}${c.unit||''}`;}
    else if(c.type==='seg')box.querySelectorAll('button').forEach(b=>{const on=String(c.options[b.dataset.o][0])===String(state[c.key]);b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});
    else if(c.type==='toggle')box.querySelector('input').checked=!!state[c.key];
    else if(c.type==='counter'){const tot=Object.values(state[c.key]).reduce((a,b)=>a+b,0);box.querySelectorAll('output').forEach(o=>o.textContent=state[c.key][o.dataset.k]);box.querySelectorAll('button').forEach(b=>{const n=state[c.key][b.dataset.k];b.disabled=b.dataset.d==='1'?(n>=c.max||tot>=c.total):n<=0;});}});
}
const setIf=(el,html)=>{if(el.innerHTML!==html)el.innerHTML=html;};
function questionHTML(){const q=typeof cfg.q==='function'?cfg.q(state):cfg.q;return q.html||`<h3>想一想</h3><p>${q[0]}</p><details data-k="${hashK(q[0])}"><summary>看解釋</summary><div class="answer">${q[1]}</div></details>`;}
/* 問題卡重畫時，保留已經打開的「看解釋」 */
function setQuestion(qh){const el=labEl.querySelector('.question'),open=new Set([...el.querySelectorAll('details[open]')].map(d=>d.dataset.k));el.innerHTML=qh;el.querySelectorAll('details').forEach(d=>{if(d.dataset.k&&open.has(d.dataset.k))d.open=true;});}
let lastQ='';
function render(){const out=cfg.render(state);if(typeof cfg.q==='function'){const qh=questionHTML();if(qh!==lastQ){setQuestion(qh);lastQ=qh;}}svgEl.innerHTML=DEFS+out.svg;const hint=labEl.querySelector('.drag-hint');if(hint)hint.style.visibility=svgEl.querySelector('[data-drag]')?'':'hidden';setIf(labEl.querySelector('.readouts'),out.reads.map(([a,b])=>`<div class="readout"><span>${a}</span><b>${b}</b></div>`).join(''));setIf(labEl.querySelector('.note'),out.note||'');setPhoto();sync();}
/* ---------- 實物圖：依實驗與模式顯示一張生活或實驗照片（插圖由 AI 生成，僅供示意） ---------- */
const PHOTOS={
  pinhole:['img/pinhole.webp','自製<b>針孔成像</b>盒：燭光穿過小孔，在描圖紙上形成上下顛倒、左右相反的像。'],
  lake:['img/lake.webp','平靜的湖面像鏡子（<b>單向反射</b>），倒影清楚；有波紋的地方反射光射向各方向（像<b>漫射</b>），倒影就碎掉了。'],
  makeupmirror:['img/makeupmirror.webp','化妝鏡是<b>凹面鏡</b>：東西放在焦點以內，看到正立、放大的虛像。'],
  cellophane:['img/cellophane.webp','白光穿過<b>紅色玻璃紙</b>：只有紅光透過，其他色光被吸收，所以牆上是紅色的光。'],
  lightning:['img/lightning.webp','閃電和雷聲是同時發生的，但光速比聲速快很多，所以先看到閃電、後聽到雷聲。'],
  roadmirror:['img/roadmirror.webp','道路轉角的<b>凸面鏡</b>：成正立、縮小的虛像，能看到比平面鏡更大的範圍。'],
  pencil:['img/pencil.webp','鉛筆在水面處好像折斷了：水中那一段射出的光在水面（和杯壁）<b>折射</b>，看起來位置偏移了。'],
  sunfocus:['img/sunfocus.webp','用凸透鏡把太陽光<b>會聚</b>成又小又亮的光點，紙會被燒焦——光點最小的地方就是<b>焦點</b>。千萬不要用透鏡看太陽！'],
  bench:['img/bench.webp','實驗室的<b>光具座</b>：蠟燭、凸透鏡、紙屏排在一直線上，移動紙屏找到最清楚的燭焰像（倒立的實像）。'],
  camera:['img/camera.webp','照相機的鏡頭是<b>凸透鏡</b>：遠處的樹在 2F 以外，在感光元件上形成倒立、縮小的實像。'],
  projector:['img/projector.webp','投影機：投影片（畫面）在鏡頭的 F 與 2F 之間，在遠處的螢幕上形成<b>倒立、放大的實像</b>。'],
  magnifier:['img/magnifier.webp','放大鏡：瓢蟲在焦點以內，透過凸透鏡看到<b>正立、放大的虛像</b>。'],
  microscope:['img/microscope.webp','複式顯微鏡：靠近玻片的是<b>物鏡</b>，眼睛看的是<b>目鏡</b>，兩個都是凸透鏡。'],
  glasses:['img/glasses.webp','眼鏡：近視用<b>凹透鏡</b>（拿來看字會變小），遠視、老花用<b>凸透鏡</b>（看字變大）。'],
  prism:['img/prism.webp','白光經過三稜鏡分成各種色光：<b>紅光偏折最少，紫光偏折最多</b>。'],
  rainbow:['img/rainbow.webp','彩虹：要<b>背對太陽</b>才看得到（影子朝向彩虹）。主虹外紅內紫，較淡的副虹顏色順序相反。'],
  stagelights:['img/stagelights.webp','舞台燈：紅、綠、藍光照在白牆上，兩兩重疊成黃、青、洋紅，三色重疊成<b>白光</b>。']};
const PHOTO_OF={
  shadow:s=>s.mode==='speed'?(s.sv==='thunder'?'lightning':null):s.mode==='pinhole'?'pinhole':null,
  mirror:s=>s.mode==='diffuse'?'lake':null,
  curved:s=>s.type===-1?'roadmirror':'makeupmirror',
  refraction:()=>'pencil',
  lens:s=>s.mode==='focus'&&s.type===1?'sunfocus':s.mode==='bench'?'bench':null,
  life:s=>({camera:'camera',proj:'projector',mag:'magnifier',scope:'microscope',myopia:'glasses',hyper:'glasses'})[s.dev]||null,
  color:s=>({prism:'prism',rainbow:'rainbow',clear:'cellophane',mix:'stagelights'})[s.mode]||null};
let lastPhoto;
function setPhoto(){const f=PHOTO_OF[current],k=f?f(state):null,fig=labEl.querySelector('.photo');if(k===lastPhoto||!fig)return;lastPhoto=k;fig.hidden=!k;if(k){fig.querySelector('img').src=PHOTOS[k][0];fig.querySelector('figcaption').innerHTML=PHOTOS[k][1];}}
function openPhoto(k){document.getElementById('info-content').innerHTML=`<img class="photo-big" src="${PHOTOS[k][0]}" alt=""><p>${PHOTOS[k][1]}</p><p class="small">插圖由 AI 生成，僅供示意。</p>`;dialog.showModal();}
function activate(key){
  if(!LABS[key])key='lens';cancelAnimationFrame(raf);audioSync(false);current=key;cfg=LABS[key];state=structuredClone(cfg.state);
  document.querySelectorAll('nav a').forEach(a=>{const on=a.dataset.key===key;a.classList.toggle('active',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
  document.getElementById('title').textContent=cfg.name;document.getElementById('subtitle').textContent=cfg.subtitle;document.title=cfg.name+'｜理化實驗室';
  labEl.innerHTML=`<div class="sim-layout"><div class="viz-panel${cfg.dark?' dark':''}"><svg id="scene" viewBox="0 0 900 500" role="img" aria-label="${cfg.name}"></svg>${cfg.drag?'<p class="drag-hint"><i></i>虛線圓圈可以直接拖曳</p>':''}</div><div class="controls">${cfg.controls.map(controlHTML).join('')}<div class="readouts"></div><p class="note"></p><figure class="photo" hidden title="點一下放大" tabindex="0" role="button" aria-label="放大實物圖"><img alt=""><figcaption></figcaption></figure><button type="button" class="btn ghost reset">↺ 重設</button></div></div><section class="question">${lastQ=questionHTML()}</section>`;
  svgEl=labEl.querySelector('#scene');lastPhoto=undefined;render();
  if(cfg.tick){let last=0;const loop=now=>{const dt=last?Math.min((now-last)/1000,0.1):0;last=now;cfg.tick(state,dt);render();raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);}
  const act=document.querySelector('nav a.active');if(act&&matchMedia('(max-width:760px)').matches)act.scrollIntoView({block:'nearest',inline:'center'});
  else if(act){const sb=document.querySelector('.sidebar'),r=act.getBoundingClientRect(),rs=sb.getBoundingClientRect();if(r.bottom>rs.bottom||r.top<rs.top)sb.scrollTop+=r.top-rs.top-rs.height/2;}
}
labEl.addEventListener('input',e=>{const c=cfg.controls[e.target.dataset.c];if(!c)return;if(c.type==='range')state[c.key]=+e.target.value;else if(c.type==='toggle'){state[c.key]=e.target.checked;if(c.onChange)c.onChange(state);}render();});
labEl.addEventListener('click',e=>{const ph=e.target.closest('.photo');if(ph&&lastPhoto){openPhoto(lastPhoto);return;}const b=e.target.closest('button');if(!b)return;if(b.classList.contains('reset')){const keep=(cfg.keep||[]).map(k=>[k,state[k]]);activate(current);if(keep.length){for(const[k,v]of keep){state[k]=v;const c=cfg.controls.find(c=>c.key===k&&c.onChange);if(c)c.onChange(state);}render();}return;}if(b.dataset.qa&&cfg.qAction){cfg.qAction(state,b.dataset.qa);render();return;}const c=cfg.controls[b.dataset.c];if(!c)return;
  if(c.type==='seg'){state[c.key]=c.options[b.dataset.o][0];if(c.onChange)c.onChange(state);}else if(c.type==='buttons')c.items[b.dataset.a][1](state);else if(c.type==='counter')state[c.key][b.dataset.k]=Math.max(0,state[c.key][b.dataset.k]+ +b.dataset.d);else return;render();});
labEl.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.photo')&&lastPhoto){e.preventDefault();openPhoto(lastPhoto);}});
const svgPoint=e=>{const p=svgEl.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svgEl.getScreenCTM().inverse());};
labEl.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-drag]');if(!h||!cfg.drag||!cfg.drag[h.dataset.drag])return;e.preventDefault();drag={name:h.dataset.drag,p0:svgPoint(e),s0:structuredClone(state)};svgEl.setPointerCapture(e.pointerId);labEl.classList.add('dragging');});
labEl.addEventListener('pointermove',e=>{if(!drag)return;cfg.drag[drag.name](svgPoint(e),state,drag);if(!cfg.tick)render();});
const endDrag=()=>{drag=null;labEl.classList.remove('dragging');};labEl.addEventListener('pointerup',endDrag);labEl.addEventListener('pointercancel',endDrag);

/* ---------- 頁面 ---------- */
let nav='';[1,2].forEach(g=>{nav+=`<div class="nav-group-label">${g===1?'第一次段考':'第二次段考 · 光學'}</div>`;Object.entries(LABS).filter(([,t])=>t.group===g).forEach(([key,t])=>{nav+=`<a href="#${key}" data-key="${key}"><span class="count" aria-hidden="true">${t.n}</span>${t.name}</a>`;});});
document.getElementById('nav').innerHTML=nav;
window.addEventListener('hashchange',()=>activate(location.hash.slice(1)));
document.getElementById('focus').onclick=()=>{const on=document.body.classList.toggle('projection');document.getElementById('focus').textContent=on?'結束投影':'投影模式';};
const dialog=document.getElementById('info');dialog.querySelector('.close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.getElementById('guide').onclick=()=>{document.getElementById('info-content').innerHTML=`<h2>使用說明</h2><ol><li><b>先猜：</b>只改一個條件，請學生預測結果。</li><li><b>操作：</b>拖動圖中的虛線圓圈或右側控制項，驗證預測。</li><li><b>解釋：</b>對照右側數值與說明，再展開「看解釋」。</li></ol><p>「投影模式」會隱藏側欄、放大操作區。教室網路不穩時可下載離線版，雙擊 HTML 即可使用，不需安裝或帳號。</p><h3>範圍</h3><p>校方 115 學年度第一學期行事曆：第一次段考 10/5–10/6、第二次 11/25–11/26（<a href="https://www.thsh.tp.edu.tw/uploads/178591837953198rrnVIS.pdf" target="_blank" rel="noopener">行事曆</a>）。第一次範圍已核實為翰林 B3 Ch1～Ch3（<a href="https://www.thsh.tp.edu.tw/uploads/17902147214252um1mhto.pdf" target="_blank" rel="noopener">公告第 5 頁</a>）。第二次今年尚未公告，光學單元依 <a href="https://www.thsh.tp.edu.tw/uploads/1763512990199UYTfRHNp.pdf" target="_blank" rel="noopener">114 學年度第二次範圍</a>（B3 4-1～4-5）預備，以老師指定為準。</p><h3>模型說明</h3><ul><li>各單元為理想模型，圖示不等於實物比例。</li><li>光學單元依講義 4-1～4-5 編排；為幾何光學，透鏡與面鏡成像採近軸近似。實線是實際光路，虛線是反向延長線。</li><li>國中不教透鏡成像公式與折射定律的 sin 式；頁面以成像規律、三條主要光線和「光速快慢」說明，公式只放在標明「延伸（高中）」的地方。</li><li>「透鏡成像 → 為什麼會偏折」在透鏡兩個球面各算一次折射，最外側的光會略偏離焦點；「焦點與焦距」「成像」用理想的薄透鏡。</li><li>「光具座實驗」紙屏上的模糊程度與燭焰影像為示意，實際操作以課本實驗步驟為準。</li><li>曲面鏡的「單束光／平行光」用真實球面計算，邊緣光線會略偏離焦點（球面像差）；課本以近軸光線簡化。</li><li>「生活中的透鏡」的照相機、投影機、放大鏡、顯微鏡與眼睛尺寸為示意比例。</li><li>溶解度曲線為常見課本數據的近似值。聲音頁預設不發聲，「多變的聲音」可自行開啟播放（請先調低音量）。</li><li>發聲體與空氣粒子的振動已放慢並放大，方便觀察；動物可聽範圍為約略值。</li><li>色光三原色用紅、綠、藍光的開關示意（螢幕上的顏色不是真實的光強度）。顏料三原色採理化常用的青、洋紅、黃（與美術課的紅黃藍不同）；真實顏料全混通常是暗褐色而非純黑。</li><li>右側的「實物圖」是 AI 生成的示意插圖，用來連結生活與實驗器材，細節不一定與真實器材完全相同；點一下可以放大。</li><li>光路動畫的速度只是示意（真實光速約 3×10⁸ m/s）；稜鏡的色散程度有放大，方便觀察。</li></ul><p class="small">原創互動教材，不是校方公告。</p>`;dialog.showModal();};
activate(location.hash.slice(1)||'lens');
