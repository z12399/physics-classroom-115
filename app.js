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
/* 主軸上的焦點標記（F、2F）：小圓點＋粗體字，各頁統一 */
const fMark=(x,y,t,o={})=>{const{size=16,dy=26,c='#cfdcec'}=o;return `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`+(t?T(x,y+dy,t,{size,fill:c,anchor:'middle',weight:700,halo:true}):'');};
/* 可拖曳的把手：虛線圓圈 */
const handle=(name,x,y,c,r=13)=>`<g class="handle" data-drag="${name}"><circle cx="${x}" cy="${y}" r="${r+12}" fill="transparent"/><circle class="ring" cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="2" stroke-dasharray="4 3"/></g>`;
const DEFS=`<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker><linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#61ddeb" stop-opacity=".16"/><stop offset=".42" stop-color="#c8f7ff" stop-opacity=".42"/><stop offset=".6" stop-color="#61ddeb" stop-opacity=".2"/><stop offset="1" stop-color="#61ddeb" stop-opacity=".1"/></linearGradient><clipPath id="stage-clip"><rect x="8" y="8" width="884" height="484" rx="10"/></clipPath></defs>`;

/* ---------- 單元資料 ---------- */
const SPECIES={
  O2:{label:'O₂ 氧氣',atoms:['O','O']},N2:{label:'N₂ 氮氣',atoms:['N','N']},H2:{label:'H₂ 氫氣',atoms:['H','H']},
  He:{label:'He 氦氣',atoms:['He']},H2O:{label:'H₂O 水',atoms:['O','H','H']},CO2:{label:'CO₂ 二氧化碳',atoms:['C','O','O']}};
const ATOM={H:{r:10,c:'#f3f5f7'},O:{r:15,c:'#e04a3a'},N:{r:15,c:'#3b6fd8'},C:{r:14,c:'#3f4a52'},He:{r:12,c:'#5fc7d6'}};/* 顏色和第六章的原子模型一致（EL_COLOR） */
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

/* ---------- 4-5 色光自由實驗室：理想色光模型（顏色只看紅、綠、藍三種色光） ---------- */
const CF_COLORS={w:['白',[1,1,1]],k:['黑',[0,0,0]],r:['紅',[1,0,0]],g:['綠',[0,1,0]],b:['藍',[0,0,1]],y:['黃',[1,1,0]],c:['青',[0,1,1]],m:['洋紅',[1,0,1]]};
const CF_ORDER=['w','k','r','g','b','y','c','m'];
/* 條紋國旗（顏色簡化成上面八種；h 橫條由上到下、v 直條由左到右） */
const CF_FLAGS={de:['德國','h',['k','r','y']],nl:['荷蘭','h',['r','w','b']],at:['奧地利','h',['r','w','r']],ru:['俄羅斯','h',['w','b','r']],
  hu:['匈牙利','h',['r','w','g']],ua:['烏克蘭','h',['b','y']],fr:['法國','v',['b','w','r']],it:['義大利','v',['g','w','r']]};
/* 由 RGB（0–255）說出顏色名稱；部分亮度時可能出現橙、紫等中間色 */
function cfName(c){const mx=Math.max(...c),mn=Math.min(...c);if(mx<30)return '黑';if((mx-mn)/mx<0.18)return mx>200?'白':'灰';
  const[r,g,b]=c,d=mx-mn;let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;
  const n=h<15||h>=335?'紅':h<40?'橙':h<70?'黃':h<165?'綠':h<195?'青':h<255?'藍':h<285?'紫':'洋紅';return (mx<110?'暗':mn/mx>0.45?'淡':'')+n;}
const cfLight=s=>[s.lr,s.lg,s.lb].map(v=>v/100);
const cfSeen=(s,key)=>{const L=cfLight(s),f=s.filt==='none'?[1,1,1]:FILTERS[s.filt][1];return CF_COLORS[key][1].map((v,i)=>255*L[i]*v*f[i]);};
const cfInk=c=>(c[0]*0.3+c[1]*0.59+c[2]*0.11)>140?'#1b2330':'#ffffff';
const cfObj=s=>s.guess?['mystery','h',CF_FLAGS[s.myst][2],CF_FLAGS[s.myst][1]]:s.obj==='card'?['card','g',CF_ORDER]:s.obj==='my'?['my','h',s.cust]:[s.obj,CF_FLAGS[s.obj][1],CF_FLAGS[s.obj][2]];
const cfPickMystery=s=>{const keys=Object.keys(CF_FLAGS).filter(k=>k!==s.myst);s.myst=keys[Math.floor(Math.random()*keys.length)];s.reveal=false;};
const CF_CHALLENGES=[
  ['只開一盞燈，讓德國國旗（黑、紅、黃）看起來只剩兩條。','只開<b>紅燈</b>：黃條也會反射紅光，所以紅條、黃條都是紅色，連成一片 → 黑、紅、紅。只開<b>綠燈</b>也可以：紅條不反射綠光變黑 → 黑、黑、綠。'],
  ['什麼燈光能讓奧地利國旗（紅、白、紅）看起來像一整塊布，完全看不出條紋？','<b>紅光</b>：紅條反射紅光、白條也反射紅光 → 三條都是紅色。'],
  ['荷蘭國旗（紅、白、藍）在哪些燈光下，三條還是三種不同的顏色？','例如白光、<b>洋紅光</b>（紅＋藍）：紅 → 紅、白 → 洋紅、藍 → 藍；<b>黃光</b>（紅＋綠）：紅 → 紅、白 → 黃、藍 → 黑。要讓三條不同，燈光裡至少要有兩種色光。'],
  ['在白光下透過綠色玻璃紙看義大利國旗（綠、白、紅），會看到什麼？','綠 → 綠、白 → 綠（只剩綠光過得了玻璃紙）、紅 → 黑。左邊兩條連成一片綠色，右邊是黑色。'],
  ['關掉藍燈，把紅燈調到 100%、綠燈調到 50%，黃色和白色的條紋會變成什麼顏色？','照到的光是紅光加上較弱的綠光，看起來是<b>橙色</b>。黃條、白條都會反射紅光和綠光，所以都是橙色；紅條只反射紅光，還是紅色。'],
  ['猜猜看模式：每次只開紅、綠、藍其中一盞燈，最少要照幾次才能確定每一條在白光下的顏色？','<b>三次</b>。每次只開一盞燈，看每一條亮不亮，就知道它會不會反射紅光、綠光、藍光；三個答案合起來就是白光下的顏色（例如紅亮、綠亮、藍不亮 → 黃色）。']];
const cfQHTML=()=>`<h3>挑戰</h3>${CF_CHALLENGES.map(([q,a],i)=>`<div class="ex-q"><b>${i+1}. ${q}</b></div><details data-k="${hashK(q)}"><summary>看解釋</summary><div class="answer">${a}</div></details>`).join('')}`;
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
  /* 底下多畫一條寬而淡的線，讓光線有微微發光的感覺 */
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${(w*3.4).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round" opacity="${(op*.12).toFixed(3)}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"${arrow?' marker-end="url(#arr)"':''}/>`;}
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
const lensPath=(x,f,ry=60,cy=250)=>{const t=clamp(2400/Math.abs(f),5,24);return f>0?`<path d="M${x} ${cy-ry}Q${x+t} ${cy} ${x} ${cy+ry}Q${x-t} ${cy} ${x} ${cy-ry}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`:`<path d="M${x-9} ${cy-ry}Q${x-2} ${cy} ${x-9} ${cy+ry}L${x+9} ${cy+ry}Q${x+2} ${cy} ${x+9} ${cy-ry}Z" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`;};
/* 生活中的透鏡：每個裝置「考到什麼程度」（依課本與常見段考、會考題型整理；實際範圍以學校公告為準） */
const LIFE_EXAM={
  camera:{base:['鏡頭是<b>凸透鏡</b>，感光元件（底片）接到的是<b>實像</b>。','物體在 <b>2F 以外</b> → <b>倒立、縮小的實像</b>。','像（感光元件）在鏡頭另一側的 <b>F 與 2F 之間</b>。'],
    test:['拍近處的物體：物距變小 → 像距變大 → 鏡頭要<b>往前伸</b>（離感光元件遠一點）。','物體越遠，像越小，也越靠近 F。','和眼睛對照：鏡頭 ↔ 水晶體、感光元件 ↔ 視網膜、光圈 ↔ 瞳孔。相機靠<b>移動鏡頭</b>對焦，眼睛靠<b>改變水晶體厚薄</b>。'],
    ext:['鏡頭焦距與拍到的範圍（延伸 C）、光圈與景深（延伸 D）。']},
  proj:{base:['投影片在 <b>F 與 2F 之間</b> → 螢幕上<b>倒立、放大的實像</b>。','螢幕（像）在鏡頭另一側的 <b>2F 以外</b>。','投影片要<b>上下顛倒、左右相反</b>（轉 180°）放進去，螢幕上的字才是正的。'],
    test:['像要更大：投影片<b>靠近 F</b>（物距變小），螢幕<b>移遠</b>（像距變大）。','投影片放到 F 以內 → 只有虛像，螢幕<b>接不到</b>。','用黑紙遮住鏡頭的一半 → 像仍然<b>完整</b>，只是<b>變暗</b>。'],
    ext:['放大倍數 ＝ 像距 ÷ 物距（國中通常只比較變大、變小，不算倍數）。']},
  mag:{base:['字放在 <b>F 以內</b> → <b>正立、放大的虛像</b>。','虛像和字在透鏡的<b>同一側</b>，紙屏接不到，要透過透鏡看。'],
    test:['字在 F 以內、越靠近 F，看到的像越大（也越遠）。','字移到 F 以外 → 變成<b>倒立</b>的實像，就不是放大鏡的用法。','判斷鏡片：拿來看字<b>變大</b>是凸透鏡，<b>變小</b>是凹透鏡。'],
    ext:['放大鏡的倍數約 ＝ 25 cm ÷ 焦距（高中）。']},
  scope:{base:['物鏡、目鏡<b>都是凸透鏡</b>。','最後看到<b>倒立、放大的虛像</b>（上下、左右都相反）→ 玻片往左推，像往右移。','總放大倍數 ＝ <b>物鏡倍數 × 目鏡倍數</b>（生物課也會考）。'],
    testLabel:'段考進階（看學校範圍）',
    test:['<b>第一次成像（物鏡）</b>：標本在物鏡的 <b>F 與 2F 之間</b> → 在物鏡另一側 <b>2F 以外</b>形成倒立、放大的<b>實像</b>（和投影機一樣）。','<b>第二次成像（目鏡）</b>：這個實像落在目鏡的 <b>F 以內</b> → 目鏡當<b>放大鏡</b>，形成放大的<b>虛像</b>，相對中間的實像是<b>正立</b>的。','所以只倒一次：相對標本是<b>倒立</b>。「兩個凸透鏡、倒兩次變正立」是常見錯誤。'],
    ext:['物鏡焦距很短、目鏡焦距較長；和望遠鏡（延伸 B，物鏡焦距長）比較。']},
  eye:{base:['<b>水晶體</b>相當於凸透鏡，<b>視網膜</b>相當於感光元件。','看東西時物體在 2F 以外 → 視網膜上是<b>倒立、縮小的實像</b>（大腦再把它看成正的）。'],
    test:['水晶體到視網膜的距離（像距）<b>固定</b>，看遠、看近靠<b>改變水晶體厚薄</b>：看近時<b>變厚</b>（焦距變短），看遠時變薄。','和照相機比較：相機改變像距（移動鏡頭），眼睛改變焦距（水晶體厚薄）。','瞳孔像光圈，控制進入眼睛的光量。'],
    ext:['睫狀肌、盲點、感光細胞等構造（生物）。']},
  myopia:{base:['近視：看遠處時，光會聚在視網膜<b>前方</b> → 看遠模糊。','矯正：戴<b>凹透鏡</b>（中間薄、邊緣厚），讓光先發散一點。'],
    test:['原因：眼球前後<b>太長</b>，或水晶體<b>太厚</b>（會聚能力太強）。','判斷：拿眼鏡看字<b>變小</b> → 凹透鏡 → 近視眼鏡。'],
    ext:['近視度數與焦距的換算（延伸 E）。']},
  hyper:{base:['遠視：看近處時，光會聚在視網膜<b>後方</b> → 看近模糊。','矯正：戴<b>凸透鏡</b>（中間厚、邊緣薄），先幫忙會聚。'],
    test:['原因：眼球前後<b>太短</b>，或水晶體<b>太薄</b>（會聚能力不足）。','老花也戴凸透鏡，但原因是水晶體變硬、調節能力變差（延伸 A），不要和遠視混為一談。'],
    ext:['遠視、老花度數（延伸 E）。']}};
function examHTML(k){const e=LIFE_EXAM[k];if(!e)return '';
  return `<div class="exam-card"><h3>考到什麼程度</h3>${[['base','基本必會（會考）'],['test',e.testLabel||'段考常考'],['ext','延伸（不一定考）']].map(([t,l])=>e[t]?`<div class="exam-row ${t}"><span class="exam-tag">${l}</span><ul>${e[t].map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'').join('')}<p class="exam-foot">依課本與常見段考、會考題型整理；實際範圍以學校公告為準。</p></div>`;}
/* 圖上標出一段範圍（例如「像在 F 與 2F 之間」）：兩端短豎線＋橫線＋文字 */
const zoneBar=(x1,x2,y,txt,c,up=true)=>L(x1,y,x2,y,{stroke:c,w:2.5})+L(x1,y-7,x1,y+7,{stroke:c,w:2.5})+L(x2,y-7,x2,y+7,{stroke:c,w:2.5})+T((x1+x2)/2,up?y-11:y+22,txt,{size:15,fill:c,anchor:'middle',weight:700,halo:true});
/* 延伸（課綱外）頁面左上角的標籤 */
const EXT_TAG=`<rect x="20" y="16" width="118" height="28" rx="14" fill="#b8661a"/><text x="79" y="35" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">延伸・課綱外</text>`;
const LIFE_Q={
  camera:['照相機拍到的像在感光元件上是什麼樣子？照相機的哪些構造和眼睛很像？','風景在鏡頭的 <b>2F 以外</b> → 感光元件上是<b>倒立、縮小的實像</b>。鏡頭（凸透鏡）↔ 水晶體、感光元件 ↔ 視網膜、光圈 ↔ 瞳孔。'],
  proj:['如果把投影片放到鏡頭的焦點以內，螢幕上還會有像嗎？','<b>不會</b>。焦點以內的光經過凸透鏡後仍然發散，只會形成虛像（就像放大鏡），螢幕接不到。投影片一定要在 <b>F 與 2F 之間</b>，才會在遠處的螢幕上形成倒立、放大的<b>實像</b>。'],
  mag:['用放大鏡看字時，慢慢把放大鏡拿離字遠一點（字仍在焦點以內），看到的字會變大還是變小？','<b>變大</b>。字越靠近焦點，虛像越大、也越遠；但字一移到焦點以外，看到的像就會倒過來、而且模糊。'],
  scope:['在顯微鏡下，想把視野左邊的細胞移到中間，玻片要往哪邊推？','<b>往左推</b>。顯微鏡最後看到的是<b>倒立</b>的像（上下、左右都相反），所以玻片往左推，像會往右移，剛好把左邊的細胞移到中間。'],
  eye:['眼睛和照相機都要「對焦」，方法有什麼不同？','照相機的鏡頭焦距固定，靠<b>移動鏡頭</b>改變像距來對焦；眼睛的視網膜不能動（像距固定），靠改變<b>水晶體的厚薄</b>（焦距）來對焦。'],
  myopia:['近視眼鏡的鏡片，中間比較厚還是邊緣比較厚？為什麼？','<b>邊緣比較厚</b>，是凹透鏡。近視眼看遠處時光會聚在視網膜前方，凹透鏡先讓光稍微發散，會聚點往後移到視網膜上。'],
  presby:['（延伸）老花眼和遠視眼都戴凸透鏡，兩者有什麼不同？','遠視是眼球<b>太短</b>（或水晶體太薄），看遠、看近都要用力，看近更吃力。老花是年紀大了水晶體<b>變硬、調節能力變差</b>，看遠還是清楚，<b>只有看近</b>時水晶體變不夠厚 → 光會聚在視網膜後方。所以老花眼鏡通常看近（閱讀）時才戴。'],
  tele:['（延伸）望遠鏡和顯微鏡都是兩個凸透鏡，差在哪裡？','顯微鏡的物鏡<b>焦距短</b>、標本放在物鏡附近（F 與 2F 之間）；望遠鏡的物鏡<b>焦距長</b>、景物在很遠的地方，像落在物鏡焦點附近。兩者的物鏡都先成倒立的實像，目鏡當放大鏡不會再倒過來，所以看到的都是<b>倒立</b>的像（克卜勒望遠鏡）。放大倍數約＝物鏡焦距 ÷ 目鏡焦距。'],
  zoom:['（延伸）手機的「2 倍、3 倍鏡頭」為什麼拍得比較大？','換成<b>焦距較長</b>的鏡頭：遠處景物的像大小大約和焦距成正比，焦距加倍、像也加倍；但感光元件大小不變，所以<b>拍到的範圍變小</b>。焦距短的是廣角，拍得廣、東西小。'],
  aper:['（延伸）拍照時光圈調小，照片會有什麼改變？','光圈小 → 每一點進來的光錐變細，沒有對準的物體也只糊成小點，<b>前後都比較清楚</b>（景深深），原理和「透鏡成像 → 為什麼會模糊」的小孔一樣；但進來的光變少，<b>畫面變暗</b>，要曝光久一點。'],
  diop:['（延伸）近視 300 度的眼鏡，焦距是多少？','度數 ＝ 100 × 屈光度，屈光度 ＝ 1 ÷ 焦距（公尺）。300 度 → 3 屈光度 → 焦距 1/3 公尺 ≈ <b>33 cm</b>；近視用凹透鏡，所以寫成 −300 度、焦距 −33 cm（虛焦點）。度數越大，焦距越短，鏡片越厚。'],
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
  return btn+`<table class="ex-table"><thead><tr><th>物體位置</th><th>像的位置</th><th>像的性質</th><th>應用</th></tr></thead><tbody>${rows.map((r,i)=>`<tr${i===cur?' class="on"':''}>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="ex-hint">${cc?'黃色那一列＝目前物體的位置。用<b>一個</b>凸透鏡時，實像都是倒立的，能用紙屏接到；虛像是正立的，紙屏接不到。':'凹透鏡只會讓光發散，像永遠是正立、縮小的虛像。'}</p>`;
}
const LENS_Q={
  why:['凸透鏡和凹透鏡，哪一種會讓平行光會聚？為什麼？','凸透鏡。光經過透鏡的兩個表面<b>各折射一次</b>，兩次都偏向<b>較厚的一邊</b>。凸透鏡中間厚 → 光往主軸偏 → 會聚；凹透鏡邊緣厚 → 光往外偏 → 發散。'],
  blur:['紙屏不在成像的位置時，為什麼像會模糊，而不是完全消失？','把透鏡想成<b>很多個小孔</b>：每個小孔都像針孔一樣，在紙屏上形成一個倒立的像，大小都一樣。紙屏在成像位置時，透鏡讓這些像<b>剛好疊在同一個位置</b> → 清楚；紙屏往前或往後移，這些像就<b>錯開</b>疊在一起 → 模糊。就像把針孔挖大一樣：像還在，只是糊掉了。'],
  focus:['怎樣用太陽光量出凸透鏡的焦距？','太陽很遠，射來的光可以看成<b>平行光</b>。讓透鏡正對太陽，在另一側前後移動紙張，找到<b>最小、最亮</b>的光點，那就是焦點；量光點到透鏡中心（光心）的距離，就是焦距。（千萬不要用透鏡看太陽！）'],
};
const LENS_QUIZ=[
  {q:'焦距 10 cm 的凸透鏡，把蠟燭放在透鏡前 <b>15 cm</b> 處，移動紙屏可以接到清楚的像。這個像是：',opts:['倒立、縮小的實像','倒立、放大的實像','正立、放大的虛像','倒立、等大的實像'],ans:1,
    sol:'物距 15 cm 在 F（10 cm）與 2F（20 cm）之間 → 像在另一側 2F 以外，是<b>倒立、放大的實像</b>（投影機的原理）。',go:s=>{s.mode='image';s.type=1;s.beam='main';s.block=false;s.f=80;s.u=120;s.oh=30;s.sweep=null;},goLabel:'用模擬驗證（比例相同：焦距 80 cm、物距 120 cm）'},
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

/* ---------- 第五章 溫度與熱：共用繪圖 ---------- */
/* 水的顏色跟著溫度變：冷偏藍、熱偏紅（示意，讓冷熱一眼看得出來） */
const WARM=t=>{const f=clamp(t/100,0,1);return `rgb(${Math.round(40+f*200)},${Math.round(120-f*60)},${Math.round(230-f*190)})`;};
const HG='#9aa3ad',ALC='#d94b3d';
/* 玻璃管溫度計：x 中心、yb 玻璃泡圓心、yt 管頂、yl 液面。o.c 液體顏色、o.br 泡半徑、o.w 管內徑、o.neck 縮口高度、o.gap 液柱在縮口斷開 */
function glassTherm(x,yb,yt,yl,o={}){const{c=ALC,br=15,w=8,neck=0,gap=false}=o,ow=w+12;yl=clamp(yl,yt,yb);
  let h=`<circle cx="${x}" cy="${yb}" r="${br+5}" fill="#fbfdff" stroke="#8fa3a8" stroke-width="2"/>`
    +`<rect x="${x-ow/2}" y="${yt-10}" width="${ow}" height="${yb-yt+10-br}" rx="${ow/2}" fill="#fbfdff" stroke="#8fa3a8" stroke-width="2"/>`
    +`<rect x="${x-ow/2+1.5}" y="${yb-br-14}" width="${ow-3}" height="${14+br}" fill="#fbfdff"/>`
    +`<circle cx="${x}" cy="${yb}" r="${br}" fill="${c}"/>`;
  if(gap&&neck){h+=`<rect x="${x-w/2}" y="${neck+7}" width="${w}" height="${yb-neck-7}" fill="${c}"/>`;if(yl<neck-3)h+=`<rect x="${x-w/2}" y="${yl}" width="${w}" height="${neck-3-yl}" fill="${c}"/>`;}
  else h+=`<rect x="${x-w/2}" y="${yl}" width="${w}" height="${yb-yl}" fill="${c}"/>`;
  if(neck)h+=`<path d="M${x-ow/2+1} ${neck-6}L${x-w/2+1} ${neck}L${x-ow/2+1} ${neck+6}M${x+ow/2-1} ${neck-6}L${x+w/2-1} ${neck}L${x+ow/2-1} ${neck+6}" fill="#dfe6e8" stroke="#8fa3a8" stroke-width="1.5"/>`;
  return h;}
/* 刻度：由 a 到 b，每 minor 一小格、每 major 標數字；y(v) 給位置；side=1 畫在右側 */
function thermTicks(x,a,b,minor,major,y,o={}){const{side=1,size=15,fill=P.muted,fmt=v=>String(v).replace('-','−')}=o;let h='';
  for(let v=Math.ceil(a/minor)*minor;v<=b+1e-9;v+=minor){const big=Math.abs(v/major-Math.round(v/major))<1e-6,yy=y(v);
    h+=L(x,yy,x+side*(big?14:8),yy,{stroke:fill,w:big?1.6:1});if(big)h+=T(x+side*20,yy+5,fmt(+v.toFixed(4)),{size,fill,anchor:side>0?'start':'end'});}
  return h;}
const beakerPath=(x1,x2,y1,y2)=>`<path d="M${x1} ${y1}V${y2}H${x2}V${y1}" fill="none" stroke="#83999d" stroke-width="4" stroke-linejoin="round"/>`;
const thermBubble=(x,y,text,c)=>`<rect x="${x-62}" y="${y-24}" width="124" height="40" rx="18" fill="#fffdf8" stroke="${c}" stroke-width="2"/>`+T(x,y+3,text,{size:20,fill:c,anchor:'middle',weight:700});
/* 華氏、攝氏、自訂溫標 */
const toF=c=>c*9/5+32,toX=(c,s)=>s.xa+c*(s.xb-s.xa)/100;
const tnum=v=>{const r=Math.round(v*10)/10;return Number.isInteger(r)?String(r):r.toFixed(1);};
/* 5-2 熱平衡：A 在內杯、B 在外杯，熱流 ＝ K × 溫差；K 依兩杯水量調整，任何水量都約 5 分鐘接近熱平衡（快慢為示意）；散熱時外杯對 25°C 的空氣散熱 */
const MIX_CACHE={key:'',C:null};
function mixCurve(s){const key=[s.ma,s.ta,s.mb,s.tb,s.loss].join();if(MIX_CACHE.key===key)return MIX_CACHE.C;
  const K=1.1*s.ma*s.mb/(s.ma+s.mb),KL=s.loss?10:0,dt=.01,out=[];let a=s.ta,b=s.tb,lost=0;
  for(let i=0;i<=1000;i++){if(i%5===0)out.push([i*dt,a,b,lost]);const p=K*(a-b)*dt,q=KL*(b-25)*dt;a-=p/s.ma;b+=(p-q)/s.mb;lost+=q;}
  MIX_CACHE.key=key;MIX_CACHE.C=out;return out;}

/* 5-1 想一想與例題 */
const TEMP_Q={
  touch:['左手先泡熱水、右手先泡冷水，再一起放進同一盆溫水，兩手的感覺一樣嗎？','<b>不一樣</b>：左手覺得溫水冷，右手覺得溫水熱。可是溫度計量到的都是同一個溫度。手的感覺會受原來狀態影響，<b>不可靠</b>，所以要用溫度計測量物體的<b>冷熱程度</b>，也就是溫度。'],
  liquid:['量 −60°C 的氣溫，水銀溫度計為什麼不行？量沸水呢？','水銀在 <b>−39°C 就凝固</b>，量不了 −60°C，要用<b>酒精</b>溫度計（酒精的凝固點在 −100°C 以下）。酒精在 <b>78°C 就沸騰</b>，量沸水要用<b>水銀</b>溫度計（水銀 357°C 才沸騰）。選溫度計要看<b>測量範圍</b>。'],
  clinical:['體溫計為什麼使用前要甩一甩？沒甩就量會怎樣？','體溫計玻璃泡上方有一段很細的<b>縮口</b>。拿出來後液柱在縮口斷開，不會自己降回去，方便讀數。所以下次量之前要<b>甩一甩</b>，把液柱甩回玻璃泡。沒甩就量，若這次體溫比上次低，讀數會<b>停在上一次的較高值</b>。（按「放進腋下」比較看看）'],
  bimetal:['雙金屬片受熱為什麼會彎曲？會往哪一邊彎？','兩種金屬（例如銅和鐵）貼在一起，受熱時<b>膨脹的程度不同</b>。銅膨脹得比鐵多，變得比較長，所以金屬片向<b>鐵的那一側</b>彎（銅在外側）。冷卻時則反過來彎。溫度越高彎得越多，就能帶動指針指出溫度。'],
  digital:['電子溫度計裡面沒有液柱，怎麼知道溫度？','探頭裡的元件（熱敏電阻）<b>電阻會隨溫度改變</b>。電路量出電阻，再換算成溫度，用數字顯示出來。'],
  ir:['耳溫槍、額溫槍為什麼不用等很久，也不必含在嘴裡？','物體都會放出<b>紅外線</b>，溫度越高放出越強。耳溫槍、額溫槍偵測紅外線的強弱，再換算成溫度，所以<b>不必接觸</b>、一兩秒就能讀數。'],
  design:['兩支溫度計的玻璃泡一樣大，一支管子較細、一支較粗。哪一支比較靈敏？','<b>管子較細</b>的。溫度升高 1°C，玻璃泡裡的液體膨脹的體積一樣多，擠進較細的管子就上升得比較長，刻度間隔較大，比較容易看出細小的溫度變化。玻璃泡較大（液體較多）也有同樣效果。'],
  scale:['定攝氏溫標時，為什麼選「冰水混合物」和「沸水」當作兩個定點？','在 1 大氣壓下，純水的<b>冰水混合物溫度固定</b>，<b>沸騰時溫度也固定</b>，在哪裡都能重複做出來，所以適合當定點。攝氏把兩點定為 0°C 和 100°C，中間<b>等分成 100 格</b>；華氏定為 32°F 和 212°F，中間等分成 180 格。'],
  convert:['攝氏和華氏的讀數有可能一樣嗎？','有可能：<b>−40°C ＝ −40°F</b>。由 C/100 ＝ (F − 32)/180，令 F ＝ C，得 C ＝ −40。（按「−40°C」驗證）']};
const TEMP_QUIZ=[
  {q:'一般實驗室用的酒精溫度計，是利用什麼原理測量溫度？',opts:['液體熱脹冷縮','金屬膨脹程度不同','電阻隨溫度改變','物體放出紅外線'],ans:0,
    sol:'玻璃泡裡的液體受熱<b>膨脹</b>、遇冷<b>收縮</b>，體積的變化在細管中變成液柱長度的變化。',go:s=>{s.mode='types';s.kind='liquid';s.liq='alc';s.tt=60;},goLabel:'看液體溫度計'},
  {q:'小美昨天發燒，體溫計量到 38.5°C，用完沒有甩。今天體溫已經恢復成 36.8°C，她直接用這支體溫計再量一次，讀數是：',opts:['36.8°C','37.6°C','38.5°C','低於 35°C'],ans:2,
    sol:'體溫計有<b>縮口</b>，液柱不會自己降回去。今天體溫比較低，液柱不會下降，所以仍停在 <b>38.5°C</b>。使用前要先甩一甩。',go:s=>{s.mode='types';s.kind='clinical';s.cr=38.5;s.body=36.8;s.clin='in';},goLabel:'用體溫計驗證'},
  {q:'要測量 −60°C 的南極氣溫，應該選用哪一種溫度計？',opts:['水銀溫度計','酒精溫度計','體溫計','哪一種都可以'],ans:1,
    sol:'水銀在 <b>−39°C</b> 就凝固；酒精的凝固點在 −100°C 以下，所以用<b>酒精溫度計</b>。體溫計只能量 35～42°C 左右。',go:s=>{s.mode='types';s.kind='liquid';s.liq='hg';s.tt=-50;},goLabel:'把水銀溫度計放到 −50°C'},
  {q:'兩支液體溫度計的玻璃泡大小相同、裝同一種液體，甲的管徑較細、乙較粗。下列何者正確？',opts:['甲每 1°C 的刻度間隔較大，較靈敏','乙每 1°C 的刻度間隔較大，較靈敏','兩支刻度間隔相同','管徑越粗，液柱上升越多'],ans:0,
    sol:'升高 1°C 時，兩支膨脹的液體體積一樣。管子越<b>細</b>，液柱上升越<b>長</b>，刻度間隔越大，越靈敏。',go:s=>{s.mode='design';s.bulb='s';s.bore='thin';s.dt=20;},goLabel:'比較兩支溫度計'},
  {q:'一支沒有刻度的溫度計，放入冰水混合物中液柱長 3 cm，放入沸水（1 atm）中長 23 cm。放入某杯水中液柱長 8 cm，這杯水的溫度是：',opts:['8°C','25°C','40°C','80°C'],ans:1,
    sol:'0～100°C 對應 3～23 cm，共 20 cm，每 1 cm 代表 100 ÷ 20 ＝ 5°C。8 cm 比 3 cm 多 5 cm → 5 × 5 ＝ <b>25°C</b>。也可寫成 (8 − 3)/(23 − 3) ＝ T/100。',go:s=>{s.mode='scale';s.sys='C';s.mk='test';s.tc=25;},goLabel:'用定標驗證'},
  {q:'25°C 等於多少 °F？',opts:['45°F','57°F','77°F','81°F'],ans:2,
    sol:'F ＝ 9/5 × C ＋ 32 ＝ 9/5 × 25 ＋ 32 ＝ 45 ＋ 32 ＝ <b>77°F</b>。也可用比例：C/100 ＝ (F − 32)/180。',go:s=>{s.mode='convert';s.cc=25;},goLabel:'用換算尺驗證'},
  {q:'自訂一種 X 溫標：冰水混合物為 −20°X、沸水（1 atm）為 180°X。40°C 等於多少 °X？',opts:['20°X','60°X','80°X','100°X'],ans:1,
    sol:'0～100°C 對應 −20～180°X，共 200 格，所以 1°C ＝ 2°X。40°C → −20 ＋ 40 × 2 ＝ <b>60°X</b>。比例式：(X − (−20))/200 ＝ 40/100。',go:s=>{s.mode='convert';s.xa=-20;s.xb=180;s.cc=40;},goLabel:'用換算尺驗證'},
  {q:'在什麼溫度時，攝氏溫度計和華氏溫度計的讀數相同？',opts:['0°','−32°','−40°','100°'],ans:2,
    sol:'令 F ＝ C 代入 C/100 ＝ (F − 32)/180：180C ＝ 100C − 3200 → C ＝ <b>−40</b>。',go:s=>{s.mode='convert';s.cc=-40;},goLabel:'用換算尺驗證'}];

/* 5-2 想一想與例題 */
const HEAT_Q={
  define:['用同一個熱源，把 100 g 和 200 g 的水各加熱 2 分鐘，哪一杯吸收的熱量多？哪一杯升溫多？','同一熱源、加熱時間相同 → 吸收的<b>熱量相同</b>。由 <b>H ＝ m × ΔT</b>，熱量相同時質量越大升溫越少：100 g 升溫是 200 g 的 <b>2 倍</b>。（打開「比較不同水量」比較哪一條線比較陡）'],
  compare:['一杯 100°C 的沸水和一浴缸 40°C 的洗澡水，哪一個溫度高？冷卻到室溫 20°C 時，哪一個放出的熱量多？','沸水的<b>溫度</b>比較高；但洗澡水的質量大得多。例如 250 g 的沸水冷卻到 20°C，放出 250 × 80 ＝ 20000 cal；150 kg 的洗澡水冷卻到 20°C，放出 150000 × 20 ＝ 3000000 cal。放出多少熱量要看<b>質量和溫度變化</b>，不是只看溫度。'],
  mix:['熱水和冷水達到熱平衡時，兩杯的「熱量」相同，還是「溫度」相同？','<b>溫度相同</b>。熱由高溫傳到低溫，直到溫度相同就熱不再傳遞。不計散熱時，<b>熱水放出的熱量 ＝ 冷水吸收的熱量</b>；兩杯水量不同時，升高與下降的溫度就不同。熱量是傳過去的能量，不能說兩杯「含有的熱量」相同。']};
/* 5-2 考到什麼程度 */
const HEAT_EXAM={
  define:{base:['熱量是因<b>溫度差</b>而傳遞的能量，熱由<b>高溫傳到低溫</b>。','<b>1 卡（cal）</b>：使 1 g 的水升高 1°C 所需的熱量；1 千卡（kcal）＝ 1000 卡，食品標示的「大卡」就是千卡。','水吸收或放出的熱量 <b>H ＝ m × ΔT</b>。'],
    test:['穩定熱源：吸收的熱量和<b>加熱時間成正比</b>。','吸熱相同時，水越多升溫越少（ΔT 和 m 成反比）；溫度–時間圖越平緩，水量越多。','單位換算：kcal ↔ cal、kg ↔ g。'],
    ext:['熱量也常用焦耳（J）表示，1 卡約 4.2 焦耳。']},
  compare:{base:['<b>溫度</b>表示冷熱程度；<b>熱量</b>是傳遞的能量，兩者不同。'],
    test:['溫度高的物體，放出的熱量<b>不一定</b>比較多：還要看質量和溫度變化（H ＝ m × ΔT）。','熱由<b>高溫</b>傳到低溫，不是由「熱量多」傳到「熱量少」；也不說物體「含有」多少熱量。']},
  mix:{base:['熱由高溫物體傳到低溫物體，直到<b>溫度相同</b>（熱平衡）。','不計散熱：<b>高溫放出的熱量 ＝ 低溫吸收的熱量</b>。'],
    test:['冷熱水混合求<b>末溫</b>，或反過來求水量、初溫（只有兩杯等量時，末溫才是平均）。','實驗測得的混合溫度比算出來的低：有熱散失到空氣和容器（用保麗龍杯、加蓋可以減少）。','溫度計要等液柱不動才讀數：溫度計和待測物要達到熱平衡。'],
    ext:['金屬放進水中這類不同物質的熱平衡，要用比熱計算，見 5-3。']}};
const HEAT_QUIZ=[
  {q:'「1 卡」的定義是：',opts:['使 1 g 的水升高 1°C 所需的熱量','使 1 kg 的水升高 1°C 所需的熱量','使 1 g 的任何物質升高 1°C 所需的熱量','使 1 g 的水升高 100°C 所需的熱量'],ans:0,
    sol:'<b>1 卡（cal）</b>：使 1 g 的水溫度升高 1°C 所需的熱量。1 千卡（kcal）＝ 1000 卡，可使 1 kg 的水升高 1°C。食品包裝上的「大卡」就是千卡。'},
  {q:'一瓶飲料標示熱量 150 大卡。這些熱量若全部被水吸收，可以使 3 kg 的水升高多少 °C？',opts:['0.05°C','5°C','50°C','150°C'],ans:2,
    sol:'1 大卡 ＝ 1 千卡 ＝ 1000 卡，所以 150 大卡 ＝ 150000 cal。3 kg ＝ 3000 g，ΔT ＝ H ÷ m ＝ 150000 ÷ 3000 ＝ <b>50°C</b>。'},
  {q:'把 200 g 的水由 20°C 加熱到 50°C，水吸收了多少熱量？（不計散熱）',opts:['30 cal','600 cal','6000 cal','10000 cal'],ans:2,
    sol:'H ＝ m × ΔT ＝ 200 × (50 − 20) ＝ <b>6000 cal</b> ＝ 6 kcal。',go:s=>{s.mode='define';s.m=200;s.t=6;},goLabel:'用加熱實驗驗證'},
  {q:'500 g 的水吸收 2 kcal 的熱量，溫度升高多少？（不計散熱）',opts:['0.4°C','4°C','40°C','250°C'],ans:1,
    sol:'2 kcal ＝ 2000 cal。ΔT ＝ H ÷ m ＝ 2000 ÷ 500 ＝ <b>4°C</b>。',go:s=>{s.mode='define';s.m=500;s.t=2;},goLabel:'用加熱實驗驗證'},
  {q:'用同一個穩定熱源分別加熱甲杯 100 g、乙杯 300 g 的水，加熱時間相同。不計散熱，甲杯升高的溫度是乙杯的幾倍？',opts:['1/3 倍','1 倍','3 倍','9 倍'],ans:2,
    sol:'同熱源、同時間 → 吸收的熱量相同。H ＝ m × ΔT，H 相同時 ΔT 與 m 成反比：甲的質量是乙的 1/3，升溫是乙的 <b>3 倍</b>。',go:s=>{s.mode='define';s.m=100;s.t=3;s.cmp=true;},goLabel:'比較不同水量'},
  {q:'下列關於溫度與熱量的敘述，何者正確？',opts:['溫度高的物體，含有的熱量一定比較多','熱量是因溫度差而傳遞的能量','兩物體接觸時，熱由熱量多的傳到熱量少的','溫度的單位是卡'],ans:1,
    sol:'熱量是因<b>溫度差</b>而傳遞的能量，熱由<b>高溫</b>傳到低溫（不是由「熱量多」傳到「熱量少」），也不說物體「含有」熱量。溫度的單位是 °C，熱量的單位才是卡。',go:s=>{s.mode='compare';s.ca=100;s.cta=80;s.cb=1000;s.ctb=40;s.cool=0;},goLabel:'看溫度與熱量的比較'},
  {q:'甲：200 g、90°C 的熱水；乙：1000 g、40°C 的溫水。兩杯都冷卻到 20°C，哪一杯放出的熱量比較多？',opts:['甲，因為溫度比較高','乙','一樣多','無法比較'],ans:1,
    sol:'甲放出 200 × (90 − 20) ＝ 14000 cal；乙放出 1000 × (40 − 20) ＝ <b>20000 cal</b>。乙的溫度比較低，但質量大得多，放出的熱量反而比較多。',go:s=>{s.mode='compare';s.ca=200;s.cta=90;s.cb=1000;s.ctb=40;s.cool=1;},goLabel:'用比較實驗驗證'},
  {q:'80°C 的熱水 100 g 和 20°C 的冷水 300 g 混合，不計散熱，達到熱平衡時的溫度是：',opts:['35°C','45°C','50°C','65°C'],ans:0,
    sol:'熱水放出的熱量 ＝ 冷水吸收的熱量：100 × (80 − T) ＝ 300 × (T − 20)，8000 − 100T ＝ 300T − 6000，T ＝ <b>35°C</b>。只有兩邊水量相同時，才是兩個溫度的平均。',go:s=>{s.mode='mix';s.ma=100;s.ta=80;s.mb=300;s.tb=20;s.loss=false;s.tm=10;},goLabel:'用熱平衡實驗驗證'},
  {q:'60°C 的熱水 100 g 倒入一杯 20°C 的冷水中，混合後的溫度是 30°C。不計散熱，冷水有多少 g？',opts:['100 g','200 g','300 g','400 g'],ans:2,
    sol:'熱水放出 100 × (60 − 30) ＝ 3000 cal；冷水吸收 m × (30 − 20) ＝ 10m。3000 ＝ 10m，m ＝ <b>300 g</b>。',go:s=>{s.mode='mix';s.ma=100;s.ta=60;s.mb=300;s.tb=20;s.loss=false;s.tm=10;},goLabel:'用熱平衡實驗驗證'},
  {q:'兩物體接觸後達到熱平衡，下列敘述何者正確？',opts:['兩物體所含的熱量相同','兩物體的溫度相同','兩物體升高或降低的溫度相同','質量大的物體溫度較高'],ans:1,
    sol:'熱由高溫物體傳到低溫物體，直到兩者<b>溫度相同</b>，就達到熱平衡，熱不再傳遞。質量不同時，升降的溫度並不相同。'},
  {q:'實際做冷熱水混合實驗，測得的混合溫度常比用「放熱 ＝ 吸熱」算出來的低，主要原因是：',opts:['溫度計不準','有一部分熱散失到空氣中或被容器吸收','冷水吸收的熱量比熱水放出的多','熱由低溫傳到高溫'],ans:1,
    sol:'熱水放出的熱量，有一部分<b>散失到空氣中、被容器吸收</b>，冷水實際吸收的比較少，所以混合溫度較低。實驗時可用保麗龍杯、加蓋來減少散熱。',go:s=>{s.mode='mix';s.ma=100;s.ta=80;s.mb=300;s.tb=20;s.loss=true;s.tm=10;},goLabel:'打開散熱比較'},
  {q:'用溫度計量一杯熱水，要等液柱不再移動才讀數，主要原因是：',opts:['要等溫度計和熱水的溫度相同（熱平衡）','要等熱水冷卻到室溫','液柱移動時刻度會改變','要讓熱水吸收溫度計的熱'],ans:0,
    sol:'溫度計放進熱水後，熱由熱水傳給溫度計，直到兩者<b>溫度相同（熱平衡）</b>，液柱才停止移動，這時的讀數才是熱水的溫度。'}];

/* ---------- 第五、六章共用：圖表軸、熱源、播放、考到什麼程度 ---------- */
/* 折線圖的座標軸：回傳 {h:SVG 字串, X(v), Y(v)}。格線用淡虛線，字和 5-2 的圖一致 */
function chartAxes(o){const{x0,y0,w,h,xmax,xmin=0,ymin=0,ymax,xstep,ystep,xl='',yl='',xfmt=v=>String(v),yfmt=v=>String(v).replace('-','−'),size=15,grid=true}=o;
  const X=v=>x0+(v-xmin)/(xmax-xmin)*w,Y=v=>y0-(v-ymin)/(ymax-ymin)*h;let s='';
  for(let v=ymin;v<=ymax+1e-9;v+=ystep){const y=Y(v);if(grid&&v>ymin+1e-9)s+=L(x0,y,x0+w,y,{stroke:P.faint,w:1,dash:'3 5'});s+=T(x0-10,y+5,yfmt(+v.toFixed(4)),{size,anchor:'end',fill:P.muted});}
  for(let v=xmin;v<=xmax+1e-9;v+=xstep){const x=X(v);s+=L(x,y0,x,y0+6,{stroke:P.muted})+T(x,y0+24,xfmt(+v.toFixed(4)),{size,anchor:'middle',fill:P.muted});}
  s+=L(x0,y0,x0+w+6,y0,{stroke:P.muted,w:1.5})+L(x0,y0,x0,y0-h-8,{stroke:P.muted,w:1.5});
  if(yl)s+=T(x0+6,y0-h-12,yl,{size,fill:P.muted});if(xl)s+=T(x0+w,y0+48,xl,{size,anchor:'end',fill:P.muted});
  return {h:s,X,Y};}
/* 加熱板：x 左緣、y 頂端、w 寬；on 時電熱絲變橘紅 */
function hotPlate(x,y,w,on){let h=`<rect x="${x}" y="${y}" width="${w}" height="28" rx="6" fill="#4a5860"/>`;const n=Math.max(2,Math.round(w/44));for(let i=0;i<n;i++){const cx=x+w*(i+.5)/n;h+=`<path d="M${cx-10} ${y+9}q10 10 20 0" fill="none" stroke="${on?'#ff7b4a':'#7c8a92'}" stroke-width="3"/>`;}return h;}
/* 酒精燈：x 中心、y 燈芯頂端；on 時有火焰（t 讓火焰微微晃動） */
function lampFlame(x,y,on=true,t=0,k=1){const f=reduceMotion?0:Math.sin(t*9)*2*k;
  let h=`<path d="M${x-30*k} ${y+66*k}Q${x-34*k} ${y+20*k} ${x-12*k} ${y+12*k}H${x+12*k}Q${x+34*k} ${y+20*k} ${x+30*k} ${y+66*k}Z" fill="#e8f1f4" fill-opacity=".85" stroke="#8fa3a8" stroke-width="2"/>`
    +`<rect x="${x-26*k}" y="${y+40*k}" width="${52*k}" height="${24*k}" rx="${6*k}" fill="#bcd9e6" opacity=".7"/>`
    +`<rect x="${x-8*k}" y="${y+2*k}" width="${16*k}" height="${12*k}" rx="2" fill="#9aa3ad"/>`+L(x,y+2*k,x,y-4*k,{stroke:'#3c4a52',w:3});
  if(on)h+=`<path d="M${x} ${y-46*k+f}Q${x+15*k} ${y-18*k} ${x+8*k} ${y-6*k}Q${x} ${y} ${x-8*k} ${y-6*k}Q${x-15*k} ${y-18*k} ${x} ${y-46*k+f}Z" fill="#ffb347" opacity=".9"/><path d="M${x} ${y-30*k+f/2}Q${x+7*k} ${y-14*k} ${x+3*k} ${y-7*k}Q${x} ${y-4*k} ${x-3*k} ${y-7*k}Q${x-7*k} ${y-14*k} ${x} ${y-30*k+f/2}Z" fill="#5aa9e6" opacity=".85"/>`;
  return h;}
/* 播放鈕：讓 s[key] 從目前位置走到 max（已在終點就從 0 開始）；老師一拖滑桿就自動停 */
const playBtn=(key,max,label='▶ 播放',o={})=>({type:'buttons',label:'',primary:true,show:o.show,items:[[label,s=>{if(s[key]>=max-1e-9)s[key]=0;s.play=key;s._pv=s[key];}],['⏸ 暫停',s=>{s.play=false;},{primary:false}]]});
function playTick(s,dt,max,speed){const k=s.play;if(!k)return false;if(s[k]!==s._pv){s.play=false;return false;}s[k]=Math.min(max,s[k]+dt*speed);s._pv=s[k];if(s[k]>=max)s.play=false;return true;}
/* 「考到什麼程度」卡：e = {base:[…], test:[…], ext:[…], testLabel?} */
function examCard(e){if(!e)return '';
  return `<div class="exam-card"><h3>考到什麼程度</h3>${[['base','基本必會（會考）'],['test',e.testLabel||'段考常考'],['ext','延伸（不一定考）']].map(([t,l])=>e[t]&&e[t].length?`<div class="exam-row ${t}"><span class="exam-tag">${l}</span><ul>${e[t].map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'').join('')}<p class="exam-foot">依課本與常見段考、會考題型整理；實際範圍以學校公告為準。</p></div>`;}

/* ---------- 第六章共用：元素資料、原子球 ---------- */
/* 原子序 符號 中文 原子量 類別(m 金屬 n 非金屬 d 類金屬 x 人工合成未明) 常溫狀態(s 固 l 液 g 氣 ? 未知) 族(f＝鑭系、錒系) 週期 */
const ELEM=`1 H 氫 1.008 n g 1 1|2 He 氦 4.003 n g 18 1|3 Li 鋰 6.94 m s 1 2|4 Be 鈹 9.012 m s 2 2|5 B 硼 10.81 d s 13 2|6 C 碳 12.01 n s 14 2|7 N 氮 14.01 n g 15 2|8 O 氧 16.00 n g 16 2|9 F 氟 19.00 n g 17 2|10 Ne 氖 20.18 n g 18 2|11 Na 鈉 22.99 m s 1 3|12 Mg 鎂 24.31 m s 2 3|13 Al 鋁 26.98 m s 13 3|14 Si 矽 28.09 d s 14 3|15 P 磷 30.97 n s 15 3|16 S 硫 32.06 n s 16 3|17 Cl 氯 35.45 n g 17 3|18 Ar 氬 39.95 n g 18 3|19 K 鉀 39.10 m s 1 4|20 Ca 鈣 40.08 m s 2 4|21 Sc 鈧 44.96 m s 3 4|22 Ti 鈦 47.87 m s 4 4|23 V 釩 50.94 m s 5 4|24 Cr 鉻 52.00 m s 6 4|25 Mn 錳 54.94 m s 7 4|26 Fe 鐵 55.85 m s 8 4|27 Co 鈷 58.93 m s 9 4|28 Ni 鎳 58.69 m s 10 4|29 Cu 銅 63.55 m s 11 4|30 Zn 鋅 65.38 m s 12 4|31 Ga 鎵 69.72 m s 13 4|32 Ge 鍺 72.63 d s 14 4|33 As 砷 74.92 d s 15 4|34 Se 硒 78.97 n s 16 4|35 Br 溴 79.90 n l 17 4|36 Kr 氪 83.80 n g 18 4|37 Rb 銣 85.47 m s 1 5|38 Sr 鍶 87.62 m s 2 5|39 Y 釔 88.91 m s 3 5|40 Zr 鋯 91.22 m s 4 5|41 Nb 鈮 92.91 m s 5 5|42 Mo 鉬 95.95 m s 6 5|43 Tc 鎝 (97) m s 7 5|44 Ru 釕 101.1 m s 8 5|45 Rh 銠 102.9 m s 9 5|46 Pd 鈀 106.4 m s 10 5|47 Ag 銀 107.9 m s 11 5|48 Cd 鎘 112.4 m s 12 5|49 In 銦 114.8 m s 13 5|50 Sn 錫 118.7 m s 14 5|51 Sb 銻 121.8 d s 15 5|52 Te 碲 127.6 d s 16 5|53 I 碘 126.9 n s 17 5|54 Xe 氙 131.3 n g 18 5|55 Cs 銫 132.9 m s 1 6|56 Ba 鋇 137.3 m s 2 6|57 La 鑭 138.9 m s f 6|58 Ce 鈰 140.1 m s f 6|59 Pr 鐠 140.9 m s f 6|60 Nd 釹 144.2 m s f 6|61 Pm 鉕 (145) m s f 6|62 Sm 釤 150.4 m s f 6|63 Eu 銪 152.0 m s f 6|64 Gd 釓 157.3 m s f 6|65 Tb 鋱 158.9 m s f 6|66 Dy 鏑 162.5 m s f 6|67 Ho 鈥 164.9 m s f 6|68 Er 鉺 167.3 m s f 6|69 Tm 銩 168.9 m s f 6|70 Yb 鐿 173.0 m s f 6|71 Lu 鎦 175.0 m s f 6|72 Hf 鉿 178.5 m s 4 6|73 Ta 鉭 180.9 m s 5 6|74 W 鎢 183.8 m s 6 6|75 Re 錸 186.2 m s 7 6|76 Os 鋨 190.2 m s 8 6|77 Ir 銥 192.2 m s 9 6|78 Pt 鉑 195.1 m s 10 6|79 Au 金 197.0 m s 11 6|80 Hg 汞 200.6 m l 12 6|81 Tl 鉈 204.4 m s 13 6|82 Pb 鉛 207.2 m s 14 6|83 Bi 鉍 209.0 m s 15 6|84 Po 釙 (209) m s 16 6|85 At 砈 (210) d s 17 6|86 Rn 氡 (222) n g 18 6|87 Fr 鍅 (223) m s 1 7|88 Ra 鐳 (226) m s 2 7|89 Ac 錒 (227) m s f 7|90 Th 釷 232.0 m s f 7|91 Pa 鏷 231.0 m s f 7|92 U 鈾 238.0 m s f 7|93 Np 錼 (237) m s f 7|94 Pu 鈽 (244) m s f 7|95 Am 鋂 (243) m s f 7|96 Cm 鋦 (247) m s f 7|97 Bk 鉳 (247) m s f 7|98 Cf 鉲 (251) m s f 7|99 Es 鑀 (252) m s f 7|100 Fm 鐨 (257) m s f 7|101 Md 鍆 (258) m s f 7|102 No 鍩 (259) m s f 7|103 Lr 鐒 (266) m s f 7|104 Rf - (267) x ? 4 7|105 Db - (268) x ? 5 7|106 Sg - (269) x ? 6 7|107 Bh - (270) x ? 7 7|108 Hs - (269) x ? 8 7|109 Mt - (278) x ? 9 7|110 Ds - (281) x ? 10 7|111 Rg - (282) x ? 11 7|112 Cn - (285) x ? 12 7|113 Nh - (286) x ? 13 7|114 Fl - (289) x ? 14 7|115 Mc - (290) x ? 15 7|116 Lv - (293) x ? 16 7|117 Ts - (294) x ? 17 7|118 Og - (294) x ? 18 7`
  .split('|').map(r=>{const[z,sym,zh,mass,cat,st,g,p]=r.split(' ');return {z:+z,sym,zh:zh==='-'?'':zh,mass,cat,st,g:g==='f'?null:+g,p:+p,f:g==='f'};});
const EL=Object.fromEntries(ELEM.map(e=>[e.sym,e]));
/* 週期表上的位置：col 1–18、row 1–7；鑭系、錒系放在下方第 9、10 列（第 3 族的位置留給「鑭系」「錒系」） */
const elemPos=e=>e.f?{col:3+(e.z-(e.p===6?57:89)),row:e.p+2.4}:{col:e.g,row:e.p};
const CAT_NAME={m:'金屬',n:'非金屬',d:'類金屬',x:'人工合成（性質未明）'},ST_NAME={s:'固態',l:'液態',g:'氣態','?':'未知'};
const GROUP_NAME={1:'鹼金屬（氫除外）',2:'鹼土金屬',17:'鹵素',18:'鈍氣（惰性氣體）'};
const groupName=g=>GROUP_NAME[g]||(g>=3&&g<=12?'過渡元素':'');
/* 常見元素的性質與用途（國中程度） */
const ELEM_NOTE={
  H:'最輕的氣體；可以燃燒，燃燒後只生成水，是乾淨的燃料（燃料電池）。',
  He:'很輕、不會燃燒，用來充填氣球、飛船；性質非常穩定（鈍氣）。',
  Li:'最輕的金屬，用在鋰電池（手機、電動車）。',
  C:'鑽石、石墨都只由碳組成（同素異形體）；生物體的主要元素之一。',
  N:'約占空氣體積的 78%；性質穩定，食品包裝充氮可防止變質；液態氮可以急速冷凍。',
  O:'約占空氣體積的 21%；可以幫助燃燒（助燃）、供生物呼吸；臭氧（O₃）也是由氧組成。',
  F:'活性最大的非金屬；含氟牙膏裡的氟化物可以預防蛀牙。',
  Ne:'通電時發出紅橙色的光，用在霓虹燈。',
  Na:'很軟的銀白色金屬，可以用刀切；活性很大，遇水劇烈反應，要保存在煤油中；食鹽（氯化鈉）含有鈉。',
  Mg:'燃燒時發出強烈的白光（煙火）；鎂合金又輕又堅固。',
  Al:'地殼中含量最多的金屬；密度小，表面有一層緻密的氧化鋁保護，不容易鏽蝕；鋁罐、鋁箔、飛機。',
  Si:'地殼中含量第二多的元素（僅次於氧）；高純度的矽是半導體，用來做晶片、太陽能電池。',
  P:'紅磷用在火柴盒側面的摩擦面；白磷在空氣中會自燃，要保存在水中。',
  S:'黃色固體（硫磺），用來製造硫酸、火藥。',
  Cl:'黃綠色、有刺激性臭味的有毒氣體；用來消毒自來水、製造漂白水。',
  Ar:'約占空氣的 0.9%；性質穩定，充填在燈泡裡、焊接時當保護氣體。',
  K:'很軟的金屬，活性比鈉更大，要保存在煤油中；植物生長需要鉀（肥料）。',
  Ca:'骨骼、牙齒、貝殼、大理石裡都有含鈣的化合物。',
  Ti:'強度高、質量輕、耐腐蝕，用在飛機、人工關節。',
  Cr:'鍍在金屬表面光亮又耐腐蝕；不鏽鋼裡含有鉻。',
  Mn:'乾電池裡有二氧化錳。',
  Fe:'用途最廣的金屬（鋼筋、橋樑、鍋子）；會被磁鐵吸引；在潮濕的空氣中容易生鏽；血液的血紅素含鐵。',
  Ni:'用在不鏽鋼、硬幣、充電電池。',
  Cu:'紅色金屬，導電性很好（僅次於銀），用來做電線；黃銅是銅鋅合金。',
  Zn:'鍍在鐵上防鏽（鍍鋅鐵）；乾電池的外殼。',
  Ga:'熔點約 30°C，放在手心就會熔化；門得列夫預言過的「類鋁」。',
  Ge:'門得列夫預言過的「類矽」；早期的半導體材料。',
  Br:'常溫下唯一呈液態的非金屬，紅棕色、有毒。',
  Kr:'通電發光，用在特殊燈具。',
  Ag:'導電、導熱性最好的金屬；銀飾、鏡子背面的鍍層。',
  Sn:'鍍在鐵上防鏽（馬口鐵罐頭）；焊錫。',
  I:'紫黑色固體，加熱會昇華成紫色的蒸氣；碘酒可以消毒；加碘鹽可以預防甲狀腺腫大。',
  Xe:'通電發出很亮的光，用在汽車大燈、閃光燈。',
  W:'熔點最高的金屬（約 3400°C），用來做燈泡的燈絲。',
  Pt:'俗稱白金，很不容易起反應，用在首飾、汽車的觸媒轉化器。',
  Au:'延展性最好的金屬，很不容易起反應，能長久保持光澤；首飾、電子零件的接點。',
  Hg:'俗稱水銀，常溫下唯一呈液態的金屬；有毒；以前用在溫度計。',
  Pb:'密度大、很軟、有毒；汽車的鉛蓄電池、阻擋輻射的材料。',
  Rn:'有放射性的氣體。',
  Ra:'居禮夫人發現的放射性元素。',
  U:'核能發電的燃料。'};
/* 原子模型的顏色（接近課本常見的配色：氫白、碳黑、氮藍、氧紅、氯綠、硫黃）。[填色, 字色] */
const EL_COLOR={H:['#f3f5f7','#1b2a33'],He:['#5fc7d6','#fff'],C:['#3f4a52','#fff'],N:['#3b6fd8','#fff'],O:['#e04a3a','#fff'],F:['#9ad66f','#1b2a33'],Ne:['#f06a8a','#fff'],
  Na:['#8e6bd6','#fff'],Mg:['#2f9e6f','#fff'],Al:['#aab4be','#1b2a33'],Si:['#c9a77c','#1b2a33'],P:['#f08a24','#fff'],S:['#e6c228','#1b2a33'],Cl:['#43a047','#fff'],Ar:['#5fb0d0','#fff'],
  K:['#7a52c4','#fff'],Ca:['#8f9aa0','#fff'],Fe:['#c06a2b','#fff'],Cu:['#c8783a','#fff'],Zn:['#7d8fa8','#fff'],Ag:['#c3ccd4','#1b2a33'],Au:['#e3b33b','#1b2a33'],Hg:['#b9c2c9','#1b2a33'],
  Br:['#a33a2a','#fff'],I:['#7b3fa0','#fff'],Li:['#b07ad6','#fff'],Pb:['#5c6670','#fff']};
const shadeHex=(c,k=.68)=>'#'+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
/* 原子球：x、y 圓心，r 半徑；o.label 是否寫符號、o.op 透明度、o.ring 外圈顏色（強調用） */
function ball(x,y,sym,r=16,o={}){const[c,t]=EL_COLOR[sym]||['#9aa5ad','#fff'],{label=true,op=1,ring=null,size=null}=o;
  return `<g opacity="${op}">${ring?`<circle cx="${x}" cy="${y}" r="${r+5}" fill="none" stroke="${ring}" stroke-width="3"/>`:''}<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${shadeHex(c)}" stroke-width="1.5"/><ellipse cx="${(x-r*.42).toFixed(1)}" cy="${(y-r*.5).toFixed(1)}" rx="${(r*.26).toFixed(1)}" ry="${(r*.17).toFixed(1)}" fill="#fff" opacity=".5" transform="rotate(-35 ${(x-r*.42).toFixed(1)} ${(y-r*.5).toFixed(1)})"/>`
    +(label?`<text x="${x}" y="${y}" dominant-baseline="central" font-size="${size||Math.max(10,Math.round(r*(sym.length>1?.8:.95)))}" fill="${t}" text-anchor="middle" font-weight="700">${sym}</text>`:'')+`</g>`;}
/* 化學式的下標：'H2O' → 'H₂O'；'2H2O' 前面的係數保留一般數字 */
const SUBS='₀₁₂₃₄₅₆₇₈₉';
const chem=f=>{const m=f.match(/^(\d*)(.*)$/);return m[1]+m[2].replace(/(\D)(\d+)/g,(_,a,d)=>a+[...d].map(x=>SUBS[x]).join(''));};

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
    const atom=(x,y,a,rot)=>{const c=ATOM[a].c,tc=(EL_COLOR[a]||[c,'#fff'])[1];return `<circle cx="${x}" cy="${y}" r="${ATOM[a].r}" fill="${c}" stroke="${shadeHex(c)}" stroke-width="1.5"/>${s.labels?`<text x="${x}" y="${y+5}" font-size="${a==='H'?11:13}" fill="${tc}" text-anchor="middle" font-weight="700" transform="rotate(${-rot} ${x} ${y})">${a}</text>`:''}`;};
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
    {type:'range',key:'temp',label:'水溫',min:0,max:100,step:1,unit:'°C'},
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
    {type:'range',key:'temp',label:'氣溫',min:0,max:40,step:1,unit:'°C',show:s=>s.mode==='echo'&&s.medium==='air'},
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
      /* 球面鏡；示意圖以清楚為先：反射光一律正好經過 F（凸面鏡為延長線），法線畫成入射光與反射光的角平分線（幾乎就是指向球心 C）。凸面鏡往左放，讓鏡後的 F 留在畫面內 */
      const R=520,V=cc?760:540,Cx=cc?V-R:V+R,arcX=dy=>cc?Cx+Math.sqrt(R*R-dy*dy):Cx-Math.sqrt(R*R-dy*dy),Fx=cc?V-R/2:V+R/2;
      let arc='';for(let dy=-175;dy<=175;dy+=5)arc+=(dy===-175?'M':'L')+arcX(dy).toFixed(1)+' '+(cy-dy);
      for(let dy=-170;dy<=170;dy+=17){const x=arcX(dy);h+=L(x+3,cy-dy,x+13,cy-dy-8,{stroke:'#6f8196',w:1.5});}
      h+=`<path d="${arc}" fill="none" stroke="${D.ray}" stroke-width="5"/>`;
      h+=`<circle cx="${Fx}" cy="${cy}" r="5" fill="${D.object}"/>`+T(Fx,cy+28,cc?'F':'F（虛焦點）',{size:17,fill:D.object,anchor:'middle',weight:700});
      h+=Cx<880?`<circle cx="${Cx}" cy="${cy}" r="5" fill="${D.muted}"/>`+T(Cx,cy+28,'C（球心）',{size:15,fill:D.muted,anchor:'middle',halo:true}):T(885,40,'C 在右方畫面外 →',{size:14,fill:D.muted,anchor:'end'});
      /* 平行光只取主軸附近 ±100，反射後都經過 F */
      const hs=s.beam==='single'?[s.hy]:[-100,-75,-50,-25,0,25,50,75,100];let rays='',exts='',norms='',ang=0;
      for(const dy of hs){const y=cy-dy,x=arcX(dy),rv=cc?[Fx-x,cy-y]:[x-Fx,y-cy],rl=Math.hypot(rv[0],rv[1]),r=[rv[0]/rl,rv[1]/rl],nv=[r[0]-1,r[1]],nl=Math.hypot(nv[0],nv[1]),n=[nv[0]/nl,nv[1]/nl],t=(x-20)/-r[0],end=[x+r[0]*t,y+r[1]*t];
        rays+=ray([[20,y],[x,y],end],s.beam==='single'?D.object:'#ffe8a5',{w:s.beam==='single'?3.5:2,arrow:s.beam==='single',op:s.beam==='single'?1:.85});
        if(!cc)exts+=L(x,y,Fx,y-r[1]*(Fx-x)/-r[0],{stroke:'#ffe8a5',w:1.4,dash:'6 6',op:.7});
        if(s.normals){/* 法線延伸到主軸（凹面鏡：往 C；凸面鏡：鏡後往 C 畫一段，鏡前再畫一小段） */const k=Math.abs(n[1])>1e-6?Math.abs((cy-y)/n[1]):Math.abs(Cx-x),g=cc?1:-0.4;norms+=L(x,y,x+n[0]*k*g,y+n[1]*k*g,{stroke:D.muted,w:1.2,dash:'3 5',op:.55})+(cc?'':L(x,y,x+n[0]*60,y+n[1]*60,{stroke:D.muted,w:1.2,dash:'3 5',op:.55}));}
        if(s.beam==='single'){ang=deg(Math.acos(Math.abs(n[0])));const pp=[-n[1],n[0]],side=Math.sign(-pp[0])||1,at=(sg)=>[x+n[0]*85+pp[0]*sg*side*22,y+n[1]*85+pp[1]*sg*side*22+5];
          if(dy!==0&&arrived()){const[a1,a2]=at(1),[b1,b2]=at(-1);h+=T(a1,a2,`入 ${ang.toFixed(0)}°`,{size:14,fill:D.object,anchor:'middle'})+T(b1,b2,`反 ${ang.toFixed(0)}°`,{size:14,fill:D.ink,anchor:'middle'});}}}
      const fade=fadeIn();h+=norms+rays;if(!cc&&fade>0)h+=`<g opacity="${fade}">${exts}</g>`;
      if(s.beam==='single')h+=handle('hit',arcX(s.hy),cy-s.hy,D.object,11);
      if(!s.on)h+=T(300,120,'按「開燈」',{size:20,fill:D.muted,anchor:'middle'});
      const reads=s.beam==='single'?[['入射角 = 反射角',`${ang.toFixed(1)}°`],['這點的法線','通過球心 C'],['焦點 F','鏡面到 C 的一半']]:[['平行光反射後',!s.on?'（開燈後觀察）':cc?'會聚於 F':'散開'],['焦點種類',cc?'實焦點':'虛焦點（鏡後）'],['F 的位置','鏡面與 C 的中點']];
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
        note:s.beam==='single'?'拖動鏡面上的圓圈：每一點的法線方向不同，但都遵守<b>入射角 = 反射角</b>。':cc?'每條光都遵守反射定律；因為法線都指向 C，反射光都經過 <b>F</b>。':'反射光散開，它們的<b>反向延長線</b>交於鏡後的 F（虛焦點）。'};
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
lens:{group:2,n:'4-4',name:'透鏡成像',subtitle:'透鏡靠折射讓光偏折：先看光為什麼會偏、找出焦點，再看像怎麼形成，最後用光具座做實驗。',dark:true,steps:'mode',
  tasks:{why:'把「透鏡彎曲程度」調大或調小，焦點往哪裡移？再換成凹透鏡比較。',focus:'打開「拿一張紙，找最亮的點」，拖動紙張找到最小、最亮的光點：那就是焦點，它到透鏡的距離就是焦距。',image:'按「把物體放到」的各個位置（或按 ▶ 讓物體慢慢靠近），看像的正倒、大小、虛實怎麼變。',bench:'移動紙屏，直到燭焰的像最清楚，再按「記錄這一次」；換個物距再做一次，比較物距和像距。',blur:'先只開 1 個小孔，再開 2 個、5 個：紙屏不在成像位置時，像為什麼會糊掉？最後按「把紙屏移到成像位置」。'},
  q:s=>s.mode==='image'?{html:lensTableHTML(s)+quizHTML(s,LENS_QUIZ)}:s.mode==='bench'?{html:quizHTML(s,LENS_QUIZ)}:LENS_Q[s.mode],
  qAction(s,v){if(v==='tab'){s.tab=!s.tab;return;}quizAction(s,v,LENS_QUIZ);},
  state:{on:true,prog:0,mode:'why',type:1,wbeam:'parallel',bulge:3,prisms:false,wnorm:false,wy:80,side:'left',terms:true,paper:false,pd:120,
    beam:'main',f:80,u:200,oh:30,aim:20,block:false,sweep:null,tab:false,su:null,bf:10,bu:30,bv:10,log:[],bdev:'lens',bh:'5',bu2:20,bd:30,bcol:true,breal:false,flash:'',flashT:0,qi:0,qp:null,qc:false,qs:false},
  controls:[{...LAMP,adv:true},
    {type:'seg',key:'mode',label:'實驗',options:[['why','為什麼會偏折'],['focus','焦點與焦距'],['image','成像'],['bench','光具座實驗'],['blur','為什麼會模糊']],onChange:s=>{s.prog=0;s.sweep=null;}},
    {type:'seg',key:'type',label:'透鏡',options:[[1,'凸透鏡'],[-1,'凹透鏡']],onChange:replay,show:s=>s.mode!=='bench'&&s.mode!=='blur'},
    {type:'seg',key:'wbeam',label:'光線',options:[['single','單束光'],['parallel','平行光']],onChange:replay,show:s=>s.mode==='why'},
    {type:'range',key:'bulge',label:'透鏡彎曲程度',min:1,max:5,step:1,fmt:s=>['很平','較平','中等','較彎','很彎'][s.bulge-1],show:s=>s.mode==='why'},
    {type:'toggle',key:'prisms',label:'看成一疊三稜鏡',onChange:replay,show:s=>s.mode==='why'},
    {type:'toggle',key:'wnorm',label:'顯示法線',adv:true,show:s=>s.mode==='why'&&s.wbeam==='parallel'},
    {type:'seg',key:'side',label:'平行光從',options:[['left','左邊射入'],['right','右邊射入']],onChange:replay,show:s=>s.mode==='focus'},
    {type:'range',key:'f',label:'焦距 f',min:40,max:140,step:1,unit:' cm',show:s=>s.mode==='focus'||s.mode==='image'},
    {type:'toggle',key:'terms',label:'標示名詞（主軸、光心、焦點、焦距）',adv:true,show:s=>s.mode==='focus'},
    {type:'toggle',key:'paper',label:'拿一張紙，找最亮的點',show:s=>s.mode==='focus'},
    {type:'range',key:'pd',label:'紙 → 透鏡',min:10,max:170,step:1,unit:' cm',show:s=>s.mode==='focus'&&s.paper},
    {type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['main','主要光線'],['full','全光']],onChange:replay,show:s=>s.mode==='image'},
    {type:'range',key:'u',label:'物距',min:20,max:360,step:1,unit:' cm',show:s=>s.mode==='image'},
    {type:'range',key:'oh',label:'物高',min:10,max:50,step:1,unit:' cm',adv:true,show:s=>s.mode==='image'},
    {type:'buttons',label:'把物體放到',items:[['2F 以外',s=>{s.u=snap('u',s.f*2.6);s.sweep=null;}],['2F 上',s=>{s.u=snap('u',s.f*2);s.sweep=null;}],['F 與 2F 之間',s=>{s.u=snap('u',s.f*1.5);s.sweep=null;}],['F 上',s=>{s.u=snap('u',s.f);s.sweep=null;}],['F 以內',s=>{s.u=snap('u',s.f*0.55);s.sweep=null;}]],show:s=>s.mode==='image'&&s.type===1},
    {type:'buttons',label:'',items:[['▶ 物體從遠處慢慢靠近',s=>{s.sweep=0;s.su=null;}]],show:s=>s.mode==='image',primary:true},
    {type:'toggle',key:'block',label:'用黑紙遮住透鏡上半部',onChange:replay,show:s=>s.mode==='image'&&s.beam!=='single'},
    {type:'seg',key:'bdev',label:'用什麼成像',options:[['lens','凸透鏡'],['pin','針孔板（沒有透鏡）']],onChange:replay,show:s=>s.mode==='blur'},
    {type:'seg',key:'bh',label:'打開幾個小孔',options:[['1','1 個'],['2','2 個'],['5','5 個'],['all','全部（挖大）']],onChange:replay,show:s=>s.mode==='blur'},
    {type:'range',key:'bu2',label:'物體 → 透鏡（物距）',min:13,max:40,step:1,unit:' cm',show:s=>s.mode==='blur'},
    {type:'range',key:'bd',label:'透鏡 → 紙屏',min:5,max:50,step:0.5,unit:' cm',show:s=>s.mode==='blur'},
    {type:'buttons',label:'',items:[['🔍 把紙屏移到成像位置',s=>{const v=10*s.bu2/(s.bu2-10);if(v<=50)s.bd=snap('bd',v);}]],show:s=>s.mode==='blur'&&s.bdev==='lens',primary:true},
    {type:'toggle',key:'bcol',label:'依小孔位置上色',adv:true,show:s=>s.mode==='blur'},
    {type:'toggle',key:'breal',label:'看實際的樣子（像糊成一片）',show:s=>s.mode==='blur'&&s.bh==='all'},
    {type:'seg',key:'bf',label:'凸透鏡的焦距',options:[[10,'10 cm'],[15,'15 cm']],onChange:s=>{s.log=[];},show:s=>s.mode==='bench'},
    {type:'range',key:'bu',label:'蠟燭 → 透鏡（物距）',min:4,max:50,step:1,unit:' cm',show:s=>s.mode==='bench'},
    {type:'range',key:'bv',label:'透鏡 → 紙屏',min:4,max:50,step:0.5,unit:' cm',show:s=>s.mode==='bench'},
    {type:'buttons',label:'',items:[['📋 記錄這一次',s=>benchLog(s)]],show:s=>s.mode==='bench',primary:true},
    {type:'buttons',label:'',items:[['🔍 幫我對焦',s=>{const v=s.bf*s.bu/(s.bu-s.bf);if(s.bu>s.bf&&v<=50)s.bv=snap('bv',v);else{s.flash=s.bu<=s.bf?'蠟燭在焦點上或焦點以內，紙屏接不到像':'像太遠了，紙屏放不到';s.flashT=3;}}],['清除紀錄',s=>{s.log=[];}]],show:s=>s.mode==='bench'},
    {type:'buttons',label:'',items:[['🤔 沒對準時為什麼會模糊？',s=>{s.mode='blur';s.bdev='lens';s.bh='5';s.prog=0;if(s.bf===10){s.bu2=snap('bu2',s.bu);s.bd=snap('bd',s.bv);}}]],adv:true,show:s=>s.mode==='bench'}],
  tick:(s,dt)=>{LIGHT_TICK(s,dt);if(s.flashT>0)s.flashT-=dt;
    if(s.sweep!==null){if(s.su!==null&&s.u!==s.su){s.sweep=null;return;}s.sweep=Math.min(1,s.sweep+dt/7);const e=1-Math.pow(1-s.sweep,2),to=s.type===1?s.f*1.08:20;s.u=s.su=snap('u',360-(360-to)*e);if(s.sweep>=1)s.sweep=null;}},
  drag:{obj:(p,s)=>{s.u=snap('u',(450-p.x)/1.15);s.sweep=null;},top:(p,s)=>{s.oh=snap('oh',(250-p.y)/2.4);},aim:(p,s)=>{s.aim=clamp((250-p.y)/2.4,-76,76);},
    wy:(p,s)=>{const m=s.type===1?118:110;s.wy=clamp(250-p.y,-m,m);},paper:(p,s)=>{s.pd=snap('pd',(p.x-450)*(s.side==='left'?1:-1)/2.4);},
    cand:(p,s)=>{s.bu=snap('bu',(450-p.x)/8);},bobj:(p,s)=>{s.bu2=snap('bu2',(330-p.x)/7);},bscr:(p,s)=>{s.bd=snap('bd',(p.x-330)/7);},scr:(p,s)=>{s.bv=snap('bv',(p.x-450)/8);}},
  /* 為什麼會偏折：光在透鏡兩個表面各轉折一次。示意圖以清楚為先：透鏡畫厚一點，每條平行光都正好經過焦點（兩次轉折各分一半偏折） */
  why(s){
    beginLight(s);
    const cc=s.type===1,cx=cc?340:560,cy=250,H=125,R=[400,300,230,190,165][s.bulge-1],fx=cx+(cc?1:-1)*[420,340,270,220,180][s.bulge-1],sag=R-Math.sqrt(R*R-H*H),tc=cc?2*sag+6:8,xL=cx-tc/2,xR=cx+tc/2;
    const S1=cc?{c:xL+R,side:-1}:{c:xL-R,side:1},S2=cc?{c:xR-R,side:1}:{c:xR+R,side:-1},ax=(S,dy)=>S.c+S.side*Math.sqrt(R*R-dy*dy);
    const NB=7,E=k=>-H+k*2*H/NB,dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
    const unit=v=>{const l=Math.hypot(v[0],v[1]);return[v[0]/l,v[1]/l];};
    const arcHit=(p,d,S)=>{const o=[p[0]-S.c,p[1]-cy],b=dot(o,d),D=b*b-dot(o,o)+R*R;if(D<0)return null;for(const t of[-b-Math.sqrt(D),-b+Math.sqrt(D)])if(t>1e-6){const q=[p[0]+d[0]*t,p[1]+d[1]*t];if(Math.sign(q[0]-S.c)===S.side)return{p:q,N:[(q[0]-S.c)/R,(q[1]-cy)/R]};}return null;};
    const segHit=(p,d,S,k)=>{const a=[ax(S,E(k)),cy+E(k)],b=[ax(S,E(k+1)),cy+E(k+1)],e=[b[0]-a[0],b[1]-a[1]],den=d[0]*e[1]-d[1]*e[0];if(Math.abs(den)<1e-9)return null;const t=((a[0]-p[0])*e[1]-(a[1]-p[1])*e[0])/den,l=Math.hypot(e[0],e[1]);return{p:[p[0]+d[0]*t,p[1]+d[1]*t],N:[e[1]/l,-e[0]/l]};};
    const trace=(y0,flat)=>{const p0=[20,y0],d0=[1,0],k=clamp(Math.floor((y0-cy+H)/(2*H/NB)),0,NB-1),hit=(p,d,S)=>flat?segHit(p,d,S,k):arcHit(p,d,S);
      const h1=hit(p0,d0,S1);if(!h1)return null;let d1=d0,d2=d0,h2=null;
      /* 出射光對準焦點（凸）或從虛焦點散開（凹）；玻璃內的方向取入射與出射的中間 → 兩個表面各轉一半 */
      for(let i=0;i<8;i++){h2=hit(h1.p,d1,S2);if(!h2)return null;d2=unit(cc?[fx-h2.p[0],cy-h2.p[1]]:[h2.p[0]-fx,h2.p[1]-cy]);d1=unit([d0[0]+d2[0],d0[1]+d2[1]]);}
      return{pts:[p0,h1.p,h2.p,[h2.p[0]+d2[0]*1200,h2.p[1]+d2[1]*1200]],h1,h2,d0,d1,d2};};
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(s.prisms){for(let k=0;k<NB;k++){const a=E(k),b=E(k+1),q=[[ax(S1,a),cy+a],[ax(S2,a),cy+a],[ax(S2,b),cy+b],[ax(S1,b),cy+b]];h+=`<polygon points="${q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${k===3?'#61ddeb14':k%2?'#61ddeb34':'#61ddeb20'}" stroke="${D.ray}" stroke-width="2" stroke-linejoin="round"/>`;}}
    else{let d='';for(let dy=-H;dy<=H;dy+=5)d+=(dy===-H?'M':'L')+ax(S1,dy).toFixed(1)+' '+(cy+dy);for(let dy=H;dy>=-H;dy-=5)d+='L'+ax(S2,dy).toFixed(1)+' '+(cy+dy);h+=`<path d="${d}Z" fill="url(#glass)" stroke="${D.ray}" stroke-width="3"/>`;}
    h+=`<circle cx="${fx}" cy="${cy}" r="5" fill="${D.object}"/>`+(cc?T(clamp(fx,50,850),cy+28,'F',{size:16,fill:D.object,anchor:'middle',weight:700,halo:true}):T(fx-12,cy-11,'F（虛焦點）',{size:16,fill:D.object,anchor:'end',weight:700,halo:true}));
    const single=s.wbeam==='single',wy=clamp(s.wy,cc?-118:-110,cc?118:110),ys=single?[cy-wy]:s.prisms?Array.from({length:NB},(_,k)=>cy+E(k)+H/NB):[-3,-2,-1,0,1,2,3].map(k=>cy+k*H*0.25),tr=ys.map(y=>trace(y,s.prisms)).filter(Boolean);
    if(s.on)for(const t of tr)h+=ray(t.pts,single?D.object:'#ffe8a5',{w:single?3.5:2.6,arrow:single,op:.95});
    /* 標出兩個轉折點（光走到才出現） */
    if(s.on)for(const t of tr){const l1=Math.hypot(t.h1.p[0]-t.pts[0][0],t.h1.p[1]-t.pts[0][1]),l2=l1+Math.hypot(t.h2.p[0]-t.h1.p[0],t.h2.p[1]-t.h1.p[1]);
      [[t.h1.p,l1,'① 進入玻璃，轉折',-1],[t.h2.p,l2,'② 離開玻璃，再轉折',1]].forEach(([q,l,lab,side])=>{if(REACH<l)return;h+=`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${single?6:4}" fill="#fff" stroke="${D.object}" stroke-width="2.5"/>`;
        if(single)h+=T(q[0]+side*14,q[1]+(q[1]<cy?-16:28),lab,{size:15,fill:D.ink,anchor:side<0?'end':'start',weight:700,halo:true});});}
    const fade=fadeIn();
    if(!cc&&fade>0)for(const t of tr){const back=(t.h2.p[0]-fx)/t.d2[0];if(back>0)h+=L(t.h2.p[0],t.h2.p[1],t.h2.p[0]-t.d2[0]*back,t.h2.p[1]-t.d2[1]*back,{stroke:'#ffe8a5',w:1.3,dash:'6 6',op:.6*fade});}
    if((single||s.wnorm)&&s.on)for(const t of tr)for(const g of[t.h1,t.h2])h+=L(g.p[0]-g.N[0]*48,g.p[1]-g.N[1]*48,g.p[0]+g.N[0]*48,g.p[1]+g.N[1]*48,{stroke:D.muted,w:1.4,dash:'4 4',op:.85});
    if(s.prisms&&fade>0)h+=T(cx,58,cc?'每塊三稜鏡的底都朝向主軸':'每塊三稜鏡的底都朝外',{size:16,fill:D.ink,anchor:'middle',weight:700})+T(cx,cy+H+42,'中間是長方體：光直進',{size:14,fill:D.muted,anchor:'middle'});
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
      :(cc?'凸透鏡<b>中間厚、邊緣薄</b> → 光都偏向中間（主軸）→ <b>會聚</b>。透鏡越彎，偏折越多，焦點越近。每條光在<b>進入、離開</b>透鏡時各轉折一次（白點處）。':'凹透鏡<b>中間薄、邊緣厚</b> → 光都偏向外側 → <b>發散</b>；反向延長線交在透鏡前方的<b>虛焦點</b>。');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  /* 焦點與焦距：理想薄透鏡 */
  focus(s){
    beginLight(s);
    const cx=450,cy=250,k=2.4,cc=s.type===1,fp=s.f*k,dir=s.side==='left'?1:-1,x0=cx-dir*430,Fo=cx+dir*fp,Fi=cx-dir*fp,t=clamp(5200/s.f,30,95),pX=cx+dir*s.pd*k;
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(cc)h+=`<path d="M${cx} 70Q${cx+t} ${cy} ${cx} 430Q${cx-t} ${cy} ${cx} 70" fill="url(#glass)" stroke="${D.ray}" stroke-width="3"/>`;
    else{const e=10+t*.35;h+=`<path d="M${cx-e} 70Q${cx+t*.35} ${cy} ${cx-e} 430L${cx+e} 430Q${cx-t*.35} ${cy} ${cx+e} 70Z" fill="url(#glass)" stroke="${D.ray}" stroke-width="3"/>`;}
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
    for(const sg of[-1,1])for(const k of[1,2]){const x=X(sg*k*s.f);h+=fMark(x,cy,`${k===2?'2':''}F`);}
    h+=s.type===1?`<path d="M450 60Q490 250 450 440Q410 250 450 60" fill="url(#glass)" stroke="${D.ray}" stroke-width="3"/>`:`<path d="M426 60Q462 250 426 440L474 440Q438 250 474 60Z" fill="url(#glass)" stroke="${D.ray}" stroke-width="3"/>`;
    const hits=[];
    if(s.on){
      if(s.beam==='single')hits.push([oh,s.aim,D.object,3.5,true,1]);
      else if(s.beam==='main'){h+=L(cx,18,cx,482,{stroke:D.ray,w:1.2,dash:'3 6',op:.35});hits.push([oh,oh,D.ray,3,true,1],[oh,0,D.second,3,true,1]);const y3=inf?null:f*oh/(f-u);if(!inf&&Math.abs(y3)<400)hits.push([oh,y3,D.third,3,true,1]);}
      else for(const[y0,c,op]of[[oh,'#ffe8a5',.8],[oh/2,D.second,.6]])for(let i=0;i<11;i++)hits.push([y0,-72+i*14.4,c,1.6,false,op]);
      for(const[y0,yh,c,w,arrow,op]of hits){const stop=blk&&yh>0.01;h+=ray(stop?[P([-u,y0]),P([0,yh])]:[P([-u,y0]),P([0,yh]),P(out(y0,yh))],c,{w,arrow:arrow&&!stop,op});}
    }
    const fade=fadeIn(),onStage=!inf&&X(v)>20&&X(v)<880&&Y(m*oh)>20&&Y(m*oh)<480,dim=blk?.5:1;
    if(fade>0&&!inf&&v<0)for(const[y0,yh,c]of hits)if(!(blk&&yh>0.01))h+=L(X(0),Y(yh),X(v),Y(m*y0),{stroke:c,w:2.2,dash:'8 6',op:.95*fade});
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
    const reads=!s.on?[['物體位置',where],['成像','（開燈後觀察）']]:[['物體位置',where],['像的位置',inf?'不成像':v>0?`透鏡另一側 ${num(v)} cm`:`與物體同側 ${num(-v)} cm`],['像高 ÷ 物高',inf?'—':`${num(Math.abs(m),2)} 倍`],['成像',prop]];
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
    for(const sg of[-1,1])for(const k of[1,2]){const x=X(sg*k*f);if(x>20&&x<880)h+=fMark(x,ay,`${k===2?'2':''}F`,{size:15,dy:22});}
    /* 支架、透鏡、紙屏、蠟燭 */
    h+=`<rect x="${cx-3}" y="${ay+A*ky}" width="6" height="${440-ay-A*ky}" fill="#5d7088"/><path d="M${cx} ${ay-A*ky-6}Q${cx+14} ${ay} ${cx} ${ay+A*ky+6}Q${cx-14} ${ay} ${cx} ${ay-A*ky-6}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`;
    const sx=X(sv);h+=`<g data-drag="scr" class="handle-body"><rect x="${sx-4}" y="206" width="8" height="220" rx="2" fill="#d8cda4"/><rect x="${sx-2}" y="426" width="4" height="14" fill="#5d7088"/></g>`+handle('scr',sx,432,D.muted,11)+T(sx+10,222,'紙屏',{size:14,fill:D.muted});
    const ox=X(-u);h+=`<g data-drag="cand" class="handle-body"><rect x="${ox-3}" y="${ay}" width="6" height="${440-ay}" fill="#5d7088"/><rect x="${ox-7}" y="${Y(4)}" width="14" height="${4*ky}" rx="2" fill="#e9e2cf"/>`+L(ox,Y(4),ox,Y(4.6),{stroke:'#333',w:1.5})+(s.on?`<circle cx="${ox}" cy="${Y(5.6)}" r="16" fill="#ffb347" opacity=".25"/><path d="M${ox} ${Y(6.8)}Q${ox+8} ${Y(5.4)} ${ox+4} ${Y(4.8)}Q${ox} ${Y(4.4)} ${ox-4} ${Y(4.8)}Q${ox-8} ${Y(5.4)} ${ox} ${Y(6.8)}Z" fill="#ffb347"/>`:'')+`</g>`+handle('cand',ox,ay+40,D.object,11);
    let lo=1e9,hi=-1e9;
    if(s.on)for(const yh of[A,A/2,0,-A/2,-A]){const ys=yi(yh);lo=Math.min(lo,ys);hi=Math.max(hi,ys);if(yh===A||yh===0||yh===-A)h+=ray([[ox,Y(yo)],[X(0),Y(yh)],[sx,Y(ys)]],'#ffe8a5',{w:1.6,arrow:false,op:.8});}
    const fade=fadeIn();
    if(s.on&&fade>0){h+=`<g opacity="${fade}"><rect x="${sx-4}" y="${clamp(Y(hi),206,424)}" width="8" height="${Math.max(2,clamp(Y(lo),208,426)-clamp(Y(hi),206,424))}" fill="#fff2b0" opacity="${clamp(1.2/(1+b),.25,1)}"/>${real&&v<sv-0.5?`<circle cx="${X(v)}" cy="${Y(-m*yo)}" r="4" fill="${D.image}"/>`:''}</g>`;}
    /* 紙屏上看到的（正面） */
    const ix=590,iy=12,iw=290,ihh=184,cxI=ix+iw/2,ayI=iy+34,g=13,sc=sv/u,sd=Math.min(18,b*g*0.45);
    h+=`<clipPath id="scrc"><rect x="${ix}" y="${iy}" width="${iw}" height="${ihh}" rx="10"/></clipPath><rect x="${ix}" y="${iy}" width="${iw}" height="${ihh}" rx="10" fill="#efe6c8"/>`+T(ix+12,iy+22,'紙屏上看到的',{size:15,fill:'#6f6448',weight:700});
    if(s.on&&fade>0){const op=clamp(1.5/(1+b*0.9),.3,1)*fade,glyph=`<rect x="-0.8" y="-4" width="1.6" height="4" fill="#d9cfb4"/><path d="M0 -6.8Q1 -5.4 0.5 -4.8Q0 -4.4 -0.5 -4.8Q-1 -5.4 0 -6.8Z" fill="#ff9a2e"/>`;
      h+=`<filter id="bblur" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="${sd.toFixed(2)}"/></filter><g clip-path="url(#scrc)"><g filter="url(#bblur)" opacity="${op.toFixed(2)}"><g transform="translate(${cxI} ${ayI}) scale(${(sc*g).toFixed(3)}) rotate(180)">${glyph}</g></g></g>`;
      h+=T(ix+iw-12,iy+ihh-12,sharp?`清楚：倒立・${Math.abs(m-1)<0.02?'等大':m>1?'放大':'縮小'}`:b>4?'只有一片模糊的光':'模糊',{size:16,fill:sharp?'#0f766e':'#6f6448',anchor:'end',weight:700});}
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
  /* 為什麼會模糊：把透鏡看成很多個小孔，每個小孔各成一個針孔像；只有紙屏在會聚處時這些像才疊在一起 */
  blur(s){
    beginLight(s);
    const f=10,A=5,u=s.bu2,Dd=s.bd,lens=s.bdev==='lens',v=f*u/(u-f),m=-v/u,oh=3,cx=330,cy=372,X=d=>cx+d*7,Y=y=>cy-y*11;
    const holes=s.bh==='1'?[[0,0]]:s.bh==='2'?[[0,3.5],[0,-3.5]]:s.bh==='5'?[[0,0],[0,3.5],[0,-3.5],[3.5,0],[-3.5,0]]:(()=>{const o=[];for(let x=-4.5;x<=4.5;x+=1)for(let y=-4.5;y<=4.5;y+=1)if(x*x+y*y<=4.6*4.6)o.push([x,y]);return o;})();
    const all=s.bh==='all',many=holes.length>1;
    /* 依小孔位置上色：上紅、下青、右紫、左綠，中間白 */
    const hcol=(hx,hy)=>{if(!s.bcol||all&&s.breal)return '#ffe8a5';const r=Math.min(1,Math.hypot(hx,hy)/4.5),a=(deg(Math.atan2(hy,hx))-90+720)%360;return `hsl(${a.toFixed(0)} ${(r*95).toFixed(0)}% ${(84-16*r).toFixed(0)}%)`;};
    /* 穿過小孔 h 的光打在紙屏上的位置：每個像大小都是 物 × D/u，只差在錯開多少 */
    const shift=lens?1-Dd/v:1+Dd/u,onScr=(h,p)=>h*shift-p*Dd/u,sharp=lens&&Math.abs(shift)*3.5<0.15;
    let h=`<clipPath id="bside"><rect x="8" y="238" width="884" height="254"/></clipPath><g clip-path="url(#bside)">`+L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    if(lens)for(const sg of[-1,1])for(const k of[1,2])h+=fMark(X(sg*k*f),cy,`${k===2?'2':''}F`,{size:15,dy:24});
    const ys=all?[-4.5,-3,-1.5,0,1.5,3,4.5]:[...new Set(holes.filter(p=>p[0]===0).map(p=>p[1]))];
    const gaps=all&&!lens?[[-A,A]]:all?[]:ys.map(y=>[y-.35,y+.35]),bar=(x,w,y0,y1,c)=>{let g='',top=y1;for(const[a,b]of[...gaps].sort((p,q)=>q[1]-p[1])){if(b<top)g+=`<rect x="${x}" y="${Y(top)}" width="${w}" height="${(top-b)*11}" fill="${c}"/>`;top=Math.min(top,a);}if(top>y0)g+=`<rect x="${x}" y="${Y(top)}" width="${w}" height="${(top-y0)*11}" fill="${c}"/>`;return g;};
    if(lens){h+=`<path d="M${cx} ${Y(A)-6}Q${cx+18} ${cy} ${cx} ${Y(-A)+6}Q${cx-18} ${cy} ${cx} ${Y(A)-6}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`;if(!all)h+=bar(cx-17,7,-A-1.2,A+1.2,'#05080d');}
    else h+=bar(cx-4,8,-13,13,'#5d7088');
    /* 光線：從物體頂端穿過每一個（側面看得到的）小孔，打到紙屏 */
    const hits=[];
    if(s.on)for(const hy of ys){const ysc=onScr(hy,oh),c=hcol(0,hy);hits.push(ysc);h+=ray([[X(-u),Y(oh)],[X(0),Y(hy)],[X(Dd),Y(ysc)]],c,{w:all?1.6:2.6,arrow:false,op:all?.75:.95});}
    const fade=fadeIn();
    if(lens&&fade>0&&many&&!sharp){const ix=X(v),iy=Y(m*oh);if(Dd<v)for(const hy of ys)h+=L(X(Dd),Y(onScr(hy,oh)),ix,iy,{stroke:hcol(0,hy),w:1.2,dash:'4 5',op:.45*fade});
      if(ix<880)h+=`<circle cx="${ix}" cy="${iy}" r="4.5" fill="${D.image}" opacity="${fade}"/>`+T(ix,iy+(m<0?44:-12),Dd<v?'光在紙屏後面才會聚':'光在這裡會聚過了',{size:14,fill:D.image,anchor:'middle',weight:700,halo:true});}
    if(fade>0&&many&&hits.length>1){const lo=Math.min(...hits),hi=Math.max(...hits),bx=X(Dd)+14;if(hi-lo>0.3)h+=L(bx,Y(hi),bx,Y(lo),{stroke:'#ff8a7a',w:2.5,op:fade})+L(bx-5,Y(hi),bx+5,Y(hi),{stroke:'#ff8a7a',w:2.5,op:fade})+L(bx-5,Y(lo),bx+5,Y(lo),{stroke:'#ff8a7a',w:2.5,op:fade})+T(bx+10,clamp((Y(hi)+Y(lo))/2+5,258,485),'錯開',{size:15,fill:'#ff8a7a',weight:700,halo:true});
      else h+=T(X(Dd)+14,clamp(Y(hi)+5,258,485),'疊在一起！',{size:15,fill:D.third,weight:700,halo:true});}
    h+=`<g opacity="${s.on?1:.35}">${vArrow(X(-u),cy,Y(oh),D.object)}</g>`+T(X(-u),Y(oh)-14,'物',{size:17,fill:D.object,anchor:'middle'})+handle('bobj',X(-u),cy+44,D.object,11);
    const sx=X(Dd);h+=`<g data-drag="bscr" class="handle-body"><rect x="${sx-4}" y="248" width="8" height="230" rx="2" fill="#d8cda4"/></g>`+handle('bscr',sx,470,D.muted,11)+T(sx+10,264,'紙屏',{size:14,fill:D.muted})+'</g>';
    /* 紙屏上看到的（從紙屏後面看）：每個小孔一個像 */
    const px=20,py=12,pw=520,ph=215,ox=px+pw/2,oy=py+ph/2+6,k=Dd/u,ext=Math.max(...holes.map(([x,y])=>Math.hypot(x,y)))*Math.abs(shift)+1.6*k,g=Math.min(22,96/ext),op=all?0.1:0.6;
    h+=`<clipPath id="bscrc"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="10"/></clipPath><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="10" fill="#141a24" stroke="#3a4554"/>`;
    if(s.on&&fade>0){const sd=all&&s.breal?Math.abs(shift)*A*g*0.4:0;h+=(sd>0.3?`<filter id="bblur2" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="${sd.toFixed(1)}"/></filter>`:'')+`<g clip-path="url(#bscrc)"><g opacity="${fade}"${sd>0.3?' filter="url(#bblur2)"':''}>`;for(const[hx,hy]of holes){const c=hcol(hx,hy);h+=`<g transform="translate(${(ox+hx*shift*g).toFixed(1)} ${(oy-hy*shift*g).toFixed(1)}) scale(${(k*g).toFixed(3)}) rotate(180)" opacity="${op}"><path d="M0 1.5V-1.5M-0.55 -0.85L0 -1.5L0.55 -0.85" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="M0 -1.5L1.3 -1L0 -0.5Z" fill="${c}"/></g>`;}h+='</g></g>';}
    h+=T(px+12,py+22,'紙屏上看到的（從紙屏後面看）',{size:13,fill:D.muted,weight:700});
    if(s.on&&fade>0)h+=T(px+pw-12,py+ph-12,!many?'只有一個像：清楚，但很暗':sharp?'所有的像疊在一起 → 清楚、明亮':all?'無數個像錯開疊在一起 → 模糊':`${holes.length} 個像錯開了 → 模糊`,{size:14,fill:sharp||!many?D.third:'#ff8a7a',anchor:'end',weight:700});
    else if(!s.on)h+=T(ox,oy,'按「開燈」',{size:16,fill:D.muted,anchor:'middle'});
    /* 透鏡（或針孔板）正面：小孔的位置與顏色 */
    const fx=560,fw=200,fcx=fx+fw/2,fcy=py+ph/2+8,R=A*14;
    h+=`<rect x="${fx}" y="${py}" width="${fw}" height="${ph}" rx="10" fill="#141a24" stroke="#3a4554"/>`+T(fx+12,py+22,lens?'透鏡正面':'針孔板正面',{size:13,fill:D.muted,weight:700});
    if(lens)h+=`<circle cx="${fcx}" cy="${fcy}" r="${R}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`+(all?'':`<circle cx="${fcx}" cy="${fcy}" r="${R+6}" fill="#05080d"/>`);
    else h+=`<rect x="${fcx-R-10}" y="${fcy-R-10}" width="${2*R+20}" height="${2*R+20}" rx="6" fill="#5d7088"/>`+(all?`<circle cx="${fcx}" cy="${fcy}" r="${R}" fill="#141a24"/>`:'');
    for(const[hx,hy]of holes)h+=`<circle cx="${(fcx+hx*14).toFixed(1)}" cy="${(fcy-hy*14).toFixed(1)}" r="${all?3:5}" fill="${hcol(hx,hy)}"${all?' opacity=".8"':''}/>`;
    if(!s.on)h+=T(450,300,'按「開燈」',{size:18,fill:D.muted,anchor:'middle'});
    const spread=Math.abs(shift)*(all?2*A:7);
    const reads=[[lens?'光會聚的位置（像距）':'光會聚的位置',lens?`透鏡後 ${num(v)} cm`:'沒有（針孔不會讓光偏折）'],['紙屏位置',`${Dd} cm`],['每個像的大小',`物體的 ${num(k,2)} 倍（每個小孔都一樣）`],
      ['像錯開的距離',!many?'只有一個像':spread<0.15?'0 → 疊在一起，清楚':`約 ${num(spread)} cm → 模糊`]];
    const note=!s.on?'按「開燈」。':!many?'只開<b>一個小孔</b>：就是針孔成像。紙屏放在哪裡都看得到清楚的像，只是光太少、<b>很暗</b>。'
      :!lens?`沒有透鏡時，每個孔都各自形成一個倒立的像，大小一樣，但<b>位置錯開</b>；紙屏放在哪裡都疊不起來。孔越多（針孔挖越大）→ 越亮，但越模糊。`
      :sharp?'紙屏剛好在光會聚的地方：每個小孔各自形成一個針孔像，大小一樣、<b>位置也一樣</b> → 全部疊在一起 → 又清楚又亮。這就是透鏡的功用：<b>把很多個針孔像拉到同一個位置</b>。'
      :`透鏡可以看成<b>很多個小孔</b>，每個小孔都形成一個倒立的針孔像（大小都一樣）。紙屏${Dd<v?'太靠近透鏡，光還沒會聚':'離得太遠，光已經會聚又散開'}，這些像就<b>錯開</b>疊在一起 → 模糊。`+(all?'整個透鏡＝無數個小孔，無數個像疊成一片模糊。':'打開「全部」看看整個透鏡。');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,note};},
  keep:['mode','type'],
  render(s){return this[s.mode](s);}},

/* ===== 4-4 生活中的透鏡 ===== */
life:{group:2,n:'4-4',name:'生活中的透鏡',subtitle:'照相機、投影機、放大鏡、顯微鏡和眼睛：物體放在哪裡，就形成什麼樣的像。下排是課綱外的延伸。',dark:true,steps:'dev',
  stepGroups:[{label:'課綱內',keys:['camera','proj','mag','scope','eye','myopia','hyper']},{label:'延伸・課綱外',keys:['presby','tele','zoom','aper','diop'],ext:true}],
  tasks:{camera:'畫面現在是模糊的：調「對焦」讓它變清楚。再把物體拉近，鏡頭要往前伸還是往後縮？',proj:'移動投影片靠近或遠離鏡頭：螢幕上的像變大還是變小？投影片要怎麼放，字才是正的？',mag:'把字慢慢移近、移遠（都在焦點以內）：看到的虛像大小怎麼變？',scope:'先「只看物鏡」形成的像，再「加上目鏡」：最後看到的像是正立還是倒立？',eye:'拖動物體遠近：視網膜不能移動，眼睛靠什麼讓像一直清楚？',myopia:'近視眼的像落在視網膜的前面還是後面？打開「戴上眼鏡」，看凹透鏡怎麼修正。',hyper:'遠視眼的像落在視網膜的前面還是後面？打開「戴上眼鏡」，看凸透鏡怎麼修正。',presby:'（延伸）換成 20、45、65 歲看書：光會聚在哪裡？再切到「看遠處」比較，最後戴上老花眼鏡。',tele:'（延伸）看中間的倒立實像在哪裡，再換成伽利略望遠鏡：看到的像變成正立還是倒立？',zoom:'（延伸）從 24 mm 換到 160 mm：感光元件上的像變大還是變小？拍到的範圍呢？',aper:'（延伸）把光圈從大調到小：近處的花在感光元件上糊成多大一團？畫面亮度怎麼變？',diop:'（延伸）把度數調成 −300、−600、+200：焦距多長？鏡片的形狀怎麼變？'},
  q:s=>({html:examHTML(s.dev)+qBlockHTML(LIFE_Q[s.dev])+quizHTML(s,LIFE_QUIZ)}),
  qAction(s,v){quizAction(s,v,LIFE_QUIZ);},
  state:{on:true,prog:0,beam:'full',dev:'camera',u:900,glasses:false,focus:118,cu:900,pu:150,flip:false,mu:100,step:'obj',age:65,pview:'near',tk:'kep',fe:80,zf:125,ap:'big',dg:-300,qi:0,qp:null,qc:false,qs:false},
  controls:[{...LAMP,adv:true},{...BEAM,adv:true,show:s=>!['proj','mag','scope','tele','zoom','aper','diop'].includes(s.dev)},
    {type:'seg',key:'dev',label:'裝置',options:[['camera','照相機'],['proj','投影機'],['mag','放大鏡'],['scope','顯微鏡'],['eye','眼睛'],['myopia','近視'],['hyper','遠視'],['presby','老花眼'],['tele','望遠鏡'],['zoom','鏡頭焦距'],['aper','光圈與景深'],['diop','眼鏡度數']],onChange:s=>{replay(s);const i=LIFE_QUIZ.findIndex(q=>{const t={};if(q.go)q.go(t);return t.dev===s.dev;});if(i>=0){s.qi=i;s.qp=null;s.qc=false;s.qs=false;}}},
    {type:'seg',key:'step',label:'顯微鏡',options:[['obj','只看物鏡'],['both','加上目鏡']],onChange:replay,show:s=>s.dev==='scope'},
    {type:'range',key:'pu',label:'投影片 → 鏡頭（焦距 10 cm）',min:120,max:190,step:1,fmt:s=>`${(s.pu/10).toFixed(1)} cm`,show:s=>s.dev==='proj'},
    {type:'toggle',key:'flip',label:'投影片倒著放（上下顛倒、左右相反）',show:s=>s.dev==='proj'},
    {type:'range',key:'mu',label:'字 → 放大鏡（焦距 16 cm）',min:40,max:140,step:1,fmt:s=>`${(s.mu/10).toFixed(1)} cm`,show:s=>s.dev==='mag'},
    {type:'range',key:'u',label:'物體距離',min:300,max:3000,step:10,fmt:s=>s.u>=2400?'很遠':s.u>=900?'中等':'近',show:s=>s.dev==='eye'},
    {type:'seg',key:'age',label:'年齡',options:[[20,'20 歲'],[45,'45 歲'],[65,'65 歲']],onChange:replay,show:s=>s.dev==='presby'},
    {type:'seg',key:'pview',label:'看',options:[['near','看近處的書'],['far','看遠處']],onChange:replay,show:s=>s.dev==='presby'},
    {type:'toggle',key:'glasses',label:'戴上眼鏡',show:s=>s.dev==='myopia'||s.dev==='hyper'||(s.dev==='presby'&&s.pview==='near')},
    {type:'seg',key:'tk',label:'望遠鏡',options:[['kep','克卜勒（凸＋凸）'],['gal','伽利略（凸＋凹）']],onChange:replay,show:s=>s.dev==='tele'},
    {type:'seg',key:'fe',label:'目鏡焦距（物鏡 30 cm）',options:[[80,'8 cm'],[50,'5 cm']],onChange:replay,show:s=>s.dev==='tele'},
    {type:'seg',key:'zf',label:'鏡頭焦距',options:[[60,'24 mm 廣角'],[125,'50 mm'],[250,'100 mm'],[400,'160 mm 望遠']],onChange:replay,show:s=>s.dev==='zoom'},
    {type:'seg',key:'ap',label:'光圈',options:[['big','大'],['mid','中'],['small','小']],onChange:replay,show:s=>s.dev==='aper'},
    {type:'range',key:'dg',label:'眼鏡度數',min:-800,max:600,step:50,fmt:s=>s.dg===0?'0（平光）':(s.dg>0?'+':'−')+Math.abs(s.dg)+' 度',show:s=>s.dev==='diop'},
    {type:'range',key:'cu',label:'物體距離',min:300,max:3000,step:10,fmt:s=>s.cu>=2400?'很遠':s.cu>=900?'中等':'近',show:s=>s.dev==='camera'},
    {type:'range',key:'focus',label:'對焦：鏡頭到感光元件',min:100,max:170,step:1,fmt:s=>camSharp(s)?'清楚':'模糊',show:s=>s.dev==='camera'}],
  tick:LIGHT_TICK,
  drag:{eobj:(p,s)=>{s.u=snap('u',560-p.x);},cobj:(p,s)=>{s.cu=snap('cu',(780-s.focus)-p.x);},slide:(p,s)=>{s.pu=snap('pu',260-p.x);},mobj:(p,s)=>{s.mu=snap('mu',560-p.x);}},
  /* 顯微鏡：物鏡成倒立放大實像，落在目鏡焦點以內，目鏡當放大鏡 → 倒立放大虛像 */
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
    for(const sd of[-1,1]){const x=xo+sd*2*fo;h+=L(x,cy-5,x,cy+5,{stroke:D.muted,w:2})+T(x,cy+20,'2F',{size:12,fill:D.muted,anchor:'middle'});}
    h+=zoneBar(xo-2*fo,xo-fo,cy-100,'① 標本在物鏡 F 與 2F 之間',D.object);
    if(fade>0)h+=`<g opacity="${fade}">${zoneBar(xo+2*fo,xI,cy+150,'② 中間實像在物鏡 2F 以外',D.image,false)}${both?zoneBar(xe-fe,xe,cy+196,'③ 實像在目鏡 F′ 以內（當放大鏡）',D.second,false):''}</g>`;
    h+=vArrow(xs,cy,Y(oh),D.object,{w:4});
    if(both)h+=`<path d="M${ex+30} ${cy}Q${ex} ${cy-26} ${ex-26} ${cy}Q${ex} ${cy+26} ${ex+30} ${cy}" fill="#e8f3ff"/><circle cx="${ex-8}" cy="${cy}" r="9" fill="#162b46"/>`+T(ex,cy+46,'眼睛',{size:14,fill:D.ink,anchor:'middle'});
    const glyph=(x0,title,rot,sc,on)=>`<rect x="${x0}" y="12" width="150" height="140" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+75,32,title,{size:15,fill:D.ink,anchor:'middle',weight:700})
      +(on?`<clipPath id="sc${x0}"><rect x="${x0}" y="40" width="150" height="110"/></clipPath><g clip-path="url(#sc${x0})"><g transform="translate(${x0+75} 96) scale(${sc}) rotate(${rot})"><path d="M-14 -30H16V-20H-4V-5H10V5H-4V30H-14Z" fill="#ffcc6a"/></g></g>`:T(x0+75,96,both?'':'（加上目鏡）',{size:13,fill:D.muted,anchor:'middle'}));
    h+=glyph(560,'玻片上的字',0,0.3,true)+glyph(724,'從目鏡看到的',180,1.25,s.on&&both&&fade>=1);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['物鏡','標本在 F 與 2F 之間 → 倒立放大實像'],['目鏡',both?'實像在 F 以內 → 當放大鏡':'（還沒加上）'],['最後看到',both?'倒立・放大・虛像':'—'],['放大倍數',both?`約 ${num(mT,0)} 倍（物鏡 ${num(vo/u,0)} × 目鏡 ${num(-ve/ue,1)}）`:`物鏡 ${num(vo/u,0)} 倍`]],
      note:both?'顯微鏡有兩個凸透鏡：<b>物鏡</b>先把標本放大成倒立的實像；這個像落在<b>目鏡</b>的焦點以內，目鏡再像放大鏡一樣放大它（不會再倒過來）→ 最後看到<b>倒立、放大的虛像</b>。'
        :'第一步：標本放在<b>物鏡</b>的 F 與 2F 之間 → 在鏡筒裡形成<b>倒立、放大的實像</b>。打開「加上目鏡」看第二步。'};},
  /* 投影機：投影片在 F 與 2F 之間 → 倒立放大實像，所以投影片要倒著放 */
  proj(s){
    beginLight(s);
    const cy=250,fl=100,xl=260,u=s.pu,v=fl*u/(u-fl),m=v/u,xo=xl-u,xS=Math.min(xl+v,872),oh=24,sg=s.flip?-1:1,Y=y=>cy-y,lenses=[{x:xl,f:fl}];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    h+=`<rect x="16" y="178" width="${xl+26-16}" height="144" rx="16" fill="#1b2738" stroke="#5d7088" stroke-width="2"/>`+T(28,342,'投影機',{size:14,fill:D.muted});
    h+=`<rect x="28" y="226" width="34" height="48" rx="8" fill="${s.on?'#fff2c4':'#56606e'}"/>`+(s.on?`<circle cx="45" cy="250" r="30" fill="#fff2c4" opacity=".18"/><polygon points="62,232 ${xo},${cy-oh-14} ${xo},${cy+oh+14} 62,268" fill="#fff2c4" opacity=".1"/>`:'')+T(45,214,'燈',{size:13,fill:D.muted,anchor:'middle'});
    for(const[k,t]of[[1,'F'],[2,'2F']])for(const sd of[-1,1]){const x=xl+sd*k*fl;h+=fMark(x,cy,sd<0&&k===2?'':t,{size:15});}/* 左邊的 2F 在燈箱裡，只畫刻度不寫字 */
    h+=lensPath(xl,fl,64)+T(xl,cy-74,'鏡頭（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});
    h+=`<g data-drag="slide" class="handle-body"><rect x="${xo-4}" y="${cy-46}" width="8" height="92" rx="2" fill="#9fb2c8" opacity=".45"/>${vArrow(xo,cy,Y(sg*oh),D.object,{w:4})}</g>`+handle('slide',xo,cy+62,D.object,11)+T(xo,cy-54,'投影片',{size:13,fill:D.object,anchor:'middle'});
    if(s.on)for(const[yh,c]of[[sg*oh,D.ray],[0,D.second],[-sg*48,D.third]]){const t=paraxTrace(xo,sg*oh,(yh-sg*oh)/u,lenses,xS);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),c,{w:2.4,arrow:false,op:.9});}
    const fade=fadeIn();
    h+=`<rect x="${xS}" y="172" width="10" height="300" rx="3" fill="#efe6c8" opacity=".9"/>`+T(xS+5,490,'螢幕',{size:14,fill:D.muted,anchor:'middle'});
    if(fade>0)h+=`<g opacity="${fade}">${vArrow(xS-7,cy,Y(-sg*oh*m),D.image,{w:5})}</g>`;
    h+=zoneBar(xl-2*fl,xl-fl,cy+100,'投影片在 F 與 2F 之間',D.object,false)+zoneBar(xl+2*fl,xS,cy+170,'螢幕（像）在 2F 以外',D.image,false);
    const glyph=(x0,title,rot,sc,on)=>`<rect x="${x0}" y="12" width="168" height="150" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+84,32,title,{size:15,fill:D.ink,anchor:'middle',weight:700})
      +(on?`<clipPath id="gl${x0}"><rect x="${x0}" y="40" width="168" height="120"/></clipPath><g clip-path="url(#gl${x0})"><g transform="translate(${x0+84} 100) scale(${sc.toFixed(2)}) rotate(${rot})"><path d="M-14 -30H16V-20H-4V-5H10V5H-4V30H-14Z" fill="#ffcc6a"/></g></g>`:T(x0+84,104,'（還沒有像）',{size:13,fill:D.muted,anchor:'middle'}));
    h+=glyph(330,'投影片（從機器後面看）',s.flip?180:0,0.3,true)+L(504,88,532,88,{stroke:D.muted,w:2,arrow:true})+glyph(540,'螢幕上（觀眾看到的）',s.flip?0:180,clamp(0.3*m,0.3,1.6),s.on&&fade>=1);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['投影片位置','鏡頭的 F 與 2F 之間'],['螢幕上的像','倒立・放大・實像'],['放大倍數',`${num(m,1)} 倍`],['螢幕上的字',s.flip?'正的 ✓':'上下顛倒、左右相反']],
      note:'投影片放在鏡頭的 <b>F 與 2F 之間</b> → 在遠處螢幕上形成<b>倒立、放大的實像</b>。所以投影片要<b>倒著放</b>（上下顛倒、左右相反），螢幕上的字才會是正的。'+(s.flip?'':'<br>打開「投影片倒著放」試試看。')+'<br>投影片越靠近焦點，像越遠、越大。'};},
  /* 放大鏡：物體在焦點以內 → 正立放大虛像 */
  mag(s){
    beginLight(s);
    const cy=250,fl=160,xl=560,u=s.mu,v=fl*u/(u-fl),m=-v/u,xo=xl-u,xi=xl+v,oh=22,yi=m*oh,ex=812,Y=y=>cy-y,lenses=[{x:xl,f:fl}];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6});
    for(const sd of[-1,1]){const x=xl+sd*fl;h+=fMark(x,cy,'F');}
    h+=`<rect x="${xl-5}" y="${cy+94}" width="10" height="100" rx="5" fill="#8a6a45"/>`+lensPath(xl,fl,94)+T(xl,cy-104,'放大鏡（凸透鏡）',{size:13,fill:D.ray,anchor:'middle'});
    const rays=[];if(s.on)for(const ye of[-7,0,7]){const yh=yi+(xl-xi)*(ye-yi)/(ex-8-xi),t=paraxTrace(xo,oh,(yh-oh)/u,lenses,ex-10);rays.push(yh);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),'#ffe8a5',{w:2.2,arrow:false,op:.9});}
    const fade=fadeIn(),xiv=Math.max(xi,16);
    if(fade>0)for(const yh of rays)h+=L(xl,Y(yh),xiv,Y(yh+(yi-yh)*(xl-xiv)/(xl-xi)),{stroke:'#ffe8a5',w:1.3,dash:'6 6',op:.6*fade});
    if(fade>0&&xi>16&&yi<235)h+=`<g opacity="${fade}">${vArrow(xi,cy,Y(yi),D.image,{dash:'7 6'})}${T(xi,Math.abs(xi-xo)<60?cy+44:Y(yi)-14,'虛像',{size:16,fill:D.image,anchor:'middle',weight:700})}</g>`;
    else if(fade>0)h+=T(30,60,'← 像在很遠的地方，而且很大',{size:15,fill:D.image});
    h+=`<g data-drag="mobj" class="handle-body">${vArrow(xo,cy,Y(oh),D.object,{w:4})}</g>`+handle('mobj',xo,cy+30,D.object,11)+T(xo,Y(oh)-12,'字',{size:15,fill:D.object,anchor:'middle',weight:700});
    h+=`<path d="M${ex+30} ${cy}Q${ex} ${cy-26} ${ex-26} ${cy}Q${ex} ${cy+26} ${ex+30} ${cy}" fill="#e8f3ff"/><circle cx="${ex-8}" cy="${cy}" r="9" fill="#162b46"/>`+T(ex,cy+46,'眼睛',{size:14,fill:D.ink,anchor:'middle'});
    const box=(x0,title,sz)=>`<rect x="${x0}" y="350" width="190" height="130" rx="12" fill="#fbfaf6"/>`+T(x0+95,372,title,{size:15,fill:'#6b777e',anchor:'middle',weight:700})+`<clipPath id="mb${x0}"><rect x="${x0}" y="380" width="190" height="98"/></clipPath><g clip-path="url(#mb${x0})">${T(x0+95,430+sz*0.36,'理化',{size:sz.toFixed(1),fill:'#1b2a33',anchor:'middle',weight:700})}</g>`;
    h+=zoneBar(xl-fl,xl,cy+84,'字放在 F 以內',D.object);
    h+=box(20,'不用放大鏡',18)+(s.on&&fade>=1?box(225,'透過放大鏡看',18*m):'');
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['字的位置','焦點以內'],['看到的像','正立・放大・虛像'],['放大倍數',`${num(m,1)} 倍`],['像的位置',xi>16?'和字同一側（字的後方）':'很遠的地方']],
      note:'放大鏡就是<b>凸透鏡</b>。字放在<b>焦點以內</b>，折射光發散進入眼睛；眼睛看起來，光好像是從反向延長線的交點射來的 → 看到<b>正立、放大的虛像</b>。字越靠近焦點，像越大。'};},
  keep:['dev'],
  /* （延伸）望遠鏡：遠處景物的光幾乎平行。克卜勒：物鏡在焦點附近形成倒立實像，目鏡當放大鏡；伽利略：目鏡是凹透鏡，看到正立的像 */
  tele(s){
    beginLight(s);
    const cy=250,Y=y=>cy-y,gal=s.tk==='gal',fo=300,fe=+s.fe,xo=150,xe=gal?xo+fo-fe:xo+fo+fe,xI=xo+fo,M=fo/fe,th=0.07,ex=gal?xe+80:xe+fe*(fo+fe)/fo,ch=paraxTrace(20,th*(xo-20),-th,[{x:xo,f:fo},{x:xe,f:gal?-fe:fe}],ex),ey=ch.pts[ch.pts.length-1][1];
    const lenses=[{x:xo,f:fo},{x:xe,f:gal?-fe:fe}];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6})+EXT_TAG;
    h+=`<rect x="${xo-14}" y="${cy-104}" width="${xe-xo+28}" height="208" rx="18" fill="#1b2738" opacity=".5" stroke="#5d7088" stroke-width="2"/>`+T((xo+xe)/2,cy-114,'鏡筒',{size:14,fill:D.muted,anchor:'middle'});
    h+=lensPath(xo,fo,96)+T(xo,cy+122,'物鏡（凸透鏡，焦距長）',{size:15,fill:D.ray,anchor:'middle',halo:true});
    h+=lensPath(xe,gal?-fe:fe,62)+T(xe,cy+88,gal?'目鏡（凹透鏡）':'目鏡（凸透鏡）',{size:15,fill:D.ray,anchor:'middle',halo:true});
    h+=L(xI,cy-6,xI,cy+6,{stroke:D.object,w:2.5})+T(xI,cy-14,'物鏡的 F',{size:13,fill:D.object,anchor:'middle',halo:true});
    if(s.on)[-60,0,60].forEach(yk=>{const t=paraxTrace(20,yk+th*(xo-20),-th,lenses,ex);h+=ray(t.pts.map(([x,y])=>[x,Y(y)]),'#ffe8a5',{w:2.4,arrow:false,op:.9});});
    const fade=fadeIn();
    if(fade>0&&!gal)h+=`<g opacity="${fade}">${vArrow(xI,cy,Y(-fo*th),D.image,{w:4})}${T(xI-12,Y(-fo*th)+26,'中間的實像（倒立、縮小）',{size:15,fill:D.image,weight:700,anchor:'end',halo:true})}</g>`;
    const yE=Y(ey);h+=`<path d="M${ex+34} ${yE}Q${ex+6} ${yE-24} ${ex-18} ${yE}Q${ex+6} ${yE+24} ${ex+34} ${yE}" fill="#e8f3ff"/><circle cx="${ex-2}" cy="${yE}" r="8" fill="#162b46"/>`+T(ex+8,yE+44,'眼睛',{size:14,fill:D.ink,anchor:'middle'});
    h+=T(26,Y(th*(xo-20)+60)-22,'← 遠方的景物（光幾乎平行）',{size:15,fill:D.object,halo:true});
    /* 肉眼看 vs 從望遠鏡看 */
    const tree=`<rect x="-5" y="-6" width="10" height="30" fill="#8a5a3b"/><circle cx="0" cy="-22" r="22" fill="#3fbf6a"/><circle cx="-14" cy="-10" r="13" fill="#35a85c"/><circle cx="14" cy="-10" r="13" fill="#35a85c"/>`;
    const box=(x0,title,sc,rot)=>`<rect x="${x0}" y="16" width="150" height="130" rx="12" fill="#05080d" stroke="#3a4554"/>`+T(x0+75,36,title,{size:14,fill:D.ink,anchor:'middle',weight:700})+`<clipPath id="tl${x0}"><rect x="${x0}" y="44" width="150" height="100"/></clipPath><g clip-path="url(#tl${x0})"><g transform="translate(${x0+75} 98) rotate(${rot}) scale(${sc})">${tree}</g></g>`;
    if(fade>0)h+=`<g opacity="${fade}">${box(560,'肉眼看',0.32,0)}${box(724,`望遠鏡看（${num(M,1)} 倍）`,Math.min(1.9,0.32*M),gal?0:180)}</g>`;
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['物鏡焦距','30 cm'],['目鏡焦距',`${fe/10} cm`],['放大倍數',`約 ${num(M,1)} 倍（30 ÷ ${fe/10}）`],['看到的像',gal?'正立・放大':'倒立・放大']],
      note:gal?'<b>伽利略望遠鏡</b>：目鏡換成<b>凹透鏡</b>，放在實像形成之前，把光攔下來再發散 → 看到<b>正立</b>的像。觀劇鏡、玩具望遠鏡常用這種。'
        :'<b>克卜勒望遠鏡</b>：遠處景物的光幾乎平行，<b>物鏡</b>（焦距長）在它的<b>焦點附近</b>形成倒立、縮小的實像；<b>目鏡</b>當放大鏡看這個像 → 看到<b>倒立、放大</b>的虛像。'};},
  /* （延伸）鏡頭焦距：遠處景物的像大小約和焦距成正比；感光元件大小固定，焦距越長拍到的範圍越小 */
  zoom(s){
    beginLight(s);
    const cy=250,Y=y=>cy-y,f=+s.zf,xl=f>300?150:250,xs=xl+f,H=60,top=0.2,bot=-0.1,mm=Math.round(f*0.4);
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6})+EXT_TAG;
    h+=`<rect x="${xl-16}" y="${cy-H-30}" width="${f+34}" height="${2*H+60}" rx="14" fill="#1b2738" stroke="#5d7088" stroke-width="2" opacity=".85"/>`;
    h+=lensPath(xl,f,52)+T(xl,cy-H-40,`鏡頭（焦距 ${mm} mm）`,{size:15,fill:D.ray,anchor:'middle',halo:true});
    h+=`<rect x="${xs-4}" y="${cy-H}" width="8" height="${2*H}" fill="#8aa0b8"/>`+T(xs,cy+H+52,'感光元件（大小固定）',{size:14,fill:D.muted,anchor:f>300?'end':'middle',halo:true});
    /* 拍得到的範圍：感光元件兩端連回鏡頭中心 */
    const fov=H/f,ey=Math.min(230,fov*(xl-20));
    h+=`<polygon points="${xl},${cy} 20,${cy-ey} 20,${cy+ey}" fill="#ffe8a5" opacity=".07"/>`+L(xl,cy,20,cy-ey,{stroke:'#ffe8a5',w:1.3,dash:'5 6',op:.6})+L(xl,cy,20,cy+ey,{stroke:'#ffe8a5',w:1.3,dash:'5 6',op:.6});
    h+=T(30,Math.min(470,cy+ey+22),'虛線之間＝拍得到的範圍',{size:14,fill:'#ffe8a5',halo:true});
    if(s.on)for(const[a,c]of[[top,D.ray],[bot,D.second]])h+=ray([[20,Y(a*(xl-20))],[xl,cy],[xs,Y(-a*f)]],c,{w:2.4,arrow:false,op:.9});
    const fade=fadeIn(),yT=-top*f,yB=-bot*f,cl=v=>clamp(v,-H,H);
    if(fade>0){h+=`<g opacity="${fade}">${L(xs-12,Y(cl(yB)),xs-12,Y(cl(yT)),{stroke:D.image,w:6})}${yT<-H?L(xs-12,Y(-H),xs-12,Y(yT),{stroke:D.image,w:3,dash:'4 4',op:.6})+T(xs-20,Y(yT)+4,'超出感光元件 → 拍不到',{size:13,fill:D.image,anchor:'end',halo:true}):''}</g>`;
      /* 拍到的照片：景物放大 f 倍，用固定的框裁切 */
      const k=f/60,scene=`<rect x="-200" y="20" width="400" height="80" fill="#2f6b3a"/><circle cx="60" cy="-60" r="14" fill="#ffd60a"/><rect x="-70" y="-6" width="40" height="28" fill="#c8553d"/><path d="M-76 -6L-50 -26L-24 -6Z" fill="#8a3b2b"/><rect x="2" y="2" width="5" height="18" fill="#8a5a3b"/><circle cx="4.5" cy="-6" r="11" fill="#3fbf6a"/>`;
      h+=`<g opacity="${fade}"><rect x="620" y="16" width="260" height="196" rx="12" fill="#05080d" stroke="#3a4554"/>${T(750,38,'拍到的照片',{size:15,fill:D.ink,anchor:'middle',weight:700})}<clipPath id="zf"><rect x="640" y="50" width="220" height="146" rx="4"/></clipPath><rect x="640" y="50" width="220" height="146" rx="4" fill="#7fb7e6"/><g clip-path="url(#zf)"><g transform="translate(750 123) scale(${k})">${scene}</g></g></g>`;}
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['鏡頭焦距',`${mm} mm`],['感光元件上的像',f>=250?'很大':f>=125?'中等':'很小'],['拍到的範圍',f>=250?'很小（只拍到局部）':f>=125?'中等':'很廣'],['像的大小','約和焦距成正比']],
      note:'遠處景物在感光元件上的像，大小約和<b>焦距成正比</b>：焦距加倍，像也加倍。感光元件大小不變，所以焦距越長，像越大、<b>拍到的範圍越小</b>（望遠）；焦距越短，拍得越<b>廣</b>（廣角）。'};},
  /* （延伸）光圈與景深：對準遠處的樹，近處的花會聚在感光元件後面；光圈越小，花糊成的光斑越小，但進光量也越少 */
  aper(s){
    beginLight(s);
    const cy=250,Y=y=>cy-y,xl=360,f=150,a={big:70,mid:36,small:12}[s.ap],far=[1500,34],near=[480,-34],img=([u,y])=>{const v=f*u/(u-f);return[v,-y*v/u];},[vF,hF]=img(far),[vN,hN]=img(near),xs=xl+vF;
    const blur=2*a*(vN-vF)/vN,light=(a/70)**2,tx=40,nx=150;
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6})+EXT_TAG;
    h+=lensPath(xl,f,90)+T(xl,cy-118,'鏡頭',{size:15,fill:D.ray,anchor:'middle',halo:true});
    h+=`<rect x="${xl-5}" y="${cy-100}" width="10" height="${100-a}" fill="#2a313c" stroke="#8aa0b8"/><rect x="${xl-5}" y="${cy+a}" width="10" height="${100-a}" fill="#2a313c" stroke="#8aa0b8"/>`+T(xl+14,cy-a-8,'光圈',{size:14,fill:D.ink,halo:true});
    h+=`<rect x="${xs-3}" y="${cy-110}" width="7" height="220" fill="#8aa0b8"/>`+T(xs,cy+132,'感光元件（對焦在樹）',{size:14,fill:D.muted,anchor:'middle',halo:true});
    h+=`<g transform="translate(${tx} ${Y(far[1])-8}) scale(.6)"><rect x="-5" y="0" width="10" height="34" fill="#8a5a3b"/><circle cx="0" cy="-14" r="22" fill="#3fbf6a"/></g>`+T(tx-10,Y(far[1])-40,'遠處的樹',{size:14,fill:'#7be0a2'});
    h+=`<circle cx="${nx}" cy="${Y(near[1])}" r="9" fill="#ff7eb6"/>`+T(nx,Y(near[1])+30,'近處的花',{size:14,fill:'#ff7eb6',anchor:'middle'});
    if(s.on)for(const e of[-a*0.92,0,a*0.92]){h+=ray([[tx,Y(far[1])],[xl,Y(e)],[xs,Y(hF)]],'#7be0a2',{w:2,arrow:false,op:.85});
      const yS=e+(hN-e)*(vF/vN);h+=ray([[nx,Y(near[1])],[xl,Y(e)],[xs,Y(yS)]],'#ff7eb6',{w:2,arrow:false,op:.85});h+=L(xs,Y(yS),xl+vN,Y(hN),{stroke:'#ff7eb6',w:1.2,dash:'4 5',op:.45});}
    const fade=fadeIn();
    if(fade>0){h+=`<g opacity="${fade}"><circle cx="${xs}" cy="${Y(hF)}" r="4" fill="#7be0a2"/><rect x="${xs-5}" y="${Y(hN)-blur/2}" width="10" height="${Math.max(3,blur)}" rx="5" fill="#ff7eb6" opacity=".7"/>${T(xs+12,Y(hF)+5,'樹：一個點 → 清楚',{size:14,fill:'#7be0a2',halo:true})}${T(xs+12,Y(hN)+5,blur>8?'花：一團光 → 模糊':'花：很小一團 → 還算清楚',{size:14,fill:'#ff7eb6',halo:true})}</g>`;
      const sd=Math.max(0,blur*0.12),pic=`<rect x="640" y="296" width="230" height="194" rx="12" fill="#05080d" stroke="#3a4554"/>${T(755,318,'拍到的照片',{size:15,fill:D.ink,anchor:'middle',weight:700})}<clipPath id="apc"><rect x="652" y="328" width="206" height="150" rx="4"/></clipPath><g clip-path="url(#apc)"><rect x="652" y="328" width="206" height="150" fill="#7fb7e6"/><rect x="652" y="420" width="206" height="60" fill="#2f6b3a"/><g transform="translate(720 400)"><rect x="-6" y="0" width="12" height="40" fill="#8a5a3b"/><circle cx="0" cy="-18" r="28" fill="#3fbf6a"/></g><defs><filter id="apb" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${sd.toFixed(1)}"/></filter></defs><g filter="url(#apb)" transform="translate(800 440)"><rect x="-2" y="0" width="4" height="40" fill="#3a8a3a"/><circle cx="0" cy="-6" r="8" fill="#ff7eb6"/><circle cx="-9" cy="2" r="7" fill="#ff7eb6"/><circle cx="9" cy="2" r="7" fill="#ff7eb6"/><circle cx="0" cy="0" r="4" fill="#ffd60a"/></g><rect x="652" y="328" width="206" height="150" fill="#000" opacity="${(0.72*(1-light)).toFixed(2)}"/></g>`;
      h+=`<g opacity="${fade}">${pic}</g>`;}
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['光圈',{big:'大',mid:'中',small:'小'}[s.ap]],['進光量',{big:'多 → 亮',mid:'中等',small:'少 → 暗'}[s.ap]],['近處的花',blur>8?'糊成一團':'只糊一點點'],['景深（前後都清楚的範圍）',{big:'淺',mid:'中等',small:'深'}[s.ap]]],
      note:'鏡頭對準遠處的樹，近處的花會聚在感光元件<b>後面</b>，在感光元件上糊成一團。光圈<b>越小</b>，每一點進來的光錐越細，糊成的光斑越小 → 前後都比較清楚（<b>景深深</b>）。代價是進來的光變少，<b>畫面變暗</b>。眼睛的瞳孔就像光圈：光線強時瞳孔會縮小。'};},
  /* （延伸）眼鏡度數：度數 ＝ 100 × 屈光度，屈光度 ＝ 1 ÷ 焦距（公尺） */
  diop(s){
    beginLight(s);
    const cy=250,Y=y=>cy-y,xl=450,k=3.2,dg=s.dg,fcm=dg?10000/dg:Infinity,fp=fcm*k,onS=Math.abs(fp)<420;
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1,dash:true,op:.6})+EXT_TAG;
    for(let c=-130;c<=130;c+=10){const x=xl+c*k;if(x<20||x>880)continue;h+=L(x,cy+150,x,cy+(c%50?158:166),{stroke:D.muted,w:1.2})+(c%50?'':T(x,cy+184,Math.abs(c)+'',{size:14,fill:D.muted,anchor:'middle'}));}
    h+=L(20,cy+150,880,cy+150,{stroke:D.muted,w:1.2})+T(880,cy+204,'cm（和鏡片的距離）',{size:13,fill:D.muted,anchor:'end'});
    const thick=dg?clamp(Math.abs(dg)/800,0.15,1):0,ry=110;
    h+=dg>0?`<path d="M${xl} ${cy-ry}Q${xl+12+40*thick} ${cy} ${xl} ${cy+ry}Q${xl-12-40*thick} ${cy} ${xl} ${cy-ry}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`
      :dg<0?`<path d="M${xl-8-24*thick} ${cy-ry}Q${xl-3} ${cy} ${xl-8-24*thick} ${cy+ry}L${xl+8+24*thick} ${cy+ry}Q${xl+3} ${cy} ${xl+8+24*thick} ${cy-ry}Z" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`
      :`<rect x="${xl-5}" y="${cy-ry}" width="10" height="${2*ry}" fill="url(#glass)" stroke="${D.ray}" stroke-width="2.5"/>`;
    h+=T(xl,cy-ry-14,dg>0?'凸透鏡（遠視、老花）':dg<0?'凹透鏡（近視）':'平光鏡片',{size:15,fill:D.ray,anchor:'middle',halo:true});
    const hs=[-90,-60,-30,0,30,60,90];
    if(s.on)for(const y of hs){const m=dg?-y/fp:0;h+=ray([[20,Y(y)],[xl,Y(y)],[880,Y(y+m*(880-xl))]],'#ffe8a5',{w:2,arrow:false,op:.85});}
    const fade=fadeIn(),xb=Math.max(20,xl+fp);
    if(fade>0&&dg<0)for(const y of hs){if(y)h+=L(xl,Y(y),xb,Y(y*(1-(xb-xl)/fp)),{stroke:'#ffe8a5',w:1.3,dash:'5 6',op:.6*fade});}
    if(fade>0&&dg&&onS){const Fx=xl+fp;h+=`<g opacity="${fade}"><circle cx="${Fx}" cy="${cy}" r="6" fill="${D.object}"/>${T(Fx,cy-16,dg>0?'焦點':'虛焦點',{size:15,fill:D.object,anchor:'middle',weight:700,halo:true})}${L(xl,cy+128,Fx,cy+128,{stroke:D.object,w:2})}${L(xl,cy+120,xl,cy+136,{stroke:D.object,w:2})}${L(Fx,cy+120,Fx,cy+136,{stroke:D.object,w:2})}${T((xl+Fx)/2,cy+120,`焦距 ${num(Math.abs(fcm),0)} cm`,{size:15,fill:D.object,anchor:'middle',weight:700,halo:true})}</g>`;}
    else if(fade>0&&dg)h+=T(dg>0?870:30,cy-16,dg>0?'焦點在畫面外 →':'← 虛焦點在畫面外',{size:14,fill:D.object,anchor:dg>0?'end':'start',halo:true});
    const D1=dg/100;
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['度數',dg===0?'0 度':(dg>0?'+':'−')+Math.abs(dg)+' 度'],['屈光度',dg===0?'0':`${dg>0?'+':'−'}${num(Math.abs(D1),1)}`],['焦距',dg===0?'無限遠（光不偏折）':`${dg>0?'':'−'}${num(Math.abs(fcm),1)} cm`],['用途',dg>0?'遠視、老花（會聚）':dg<0?'近視（發散）':'不矯正']],
      note:'眼鏡的<b>度數 ＝ 100 × 屈光度</b>，<b>屈光度 ＝ 1 ÷ 焦距（公尺）</b>。習慣上近視（凹透鏡）寫成負的，遠視、老花（凸透鏡）寫成正的。<b>度數越大，焦距越短，鏡片也越厚</b>：凹透鏡邊緣更厚、凸透鏡中間更厚。'};},
  render(s){
    if(s.dev==='proj')return this.proj(s);if(s.dev==='mag')return this.mag(s);if(s.dev==='scope')return this.scope(s);
    if(s.dev==='tele')return this.tele(s);if(s.dev==='zoom')return this.zoom(s);if(s.dev==='aper')return this.aper(s);if(s.dev==='diop')return this.diop(s);
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
      /* 感光元件上的畫面：倒立的樹，沒對準就糊掉 */
      if(s.on&&fade>0){const sd=sharp?0:Math.min(9,1.5+blur*.6),tree=`<rect x="-7" y="-10" width="14" height="44" fill="#8a5a3b"/><circle cx="0" cy="-34" r="30" fill="#3fbf6a"/><circle cx="-20" cy="-18" r="18" fill="#35a85c"/><circle cx="20" cy="-18" r="18" fill="#35a85c"/>`;
        h+=`<g opacity="${fade}"><rect x="40" y="290" width="250" height="180" rx="14" fill="#0b1220" stroke="#3a4554"/>${T(165,316,'感光元件上的畫面',{size:15,fill:D.ink,anchor:'middle',weight:700})}<defs><filter id="camblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd.toFixed(1)}"/></filter></defs><g filter="url(#camblur)" transform="translate(165 370) scale(1 -1)">${tree}</g>${T(165,460,sharp?'清楚：倒立的像':'模糊：要再對焦',{size:15,fill:sharp?'#7be0a2':'#ffb38a',anchor:'middle',weight:700})}</g>`;}
      for(const[k,t]of[[1,'F'],[2,'2F']])for(const sd of[-1,1]){const x=xl+sd*k*fl;h+=fMark(x,cy,t,{size:15});}
      h+=zoneBar(xl+fl,xl+2*fl,cy+126,'像在 F 與 2F 之間',D.image,false)+zoneBar(20,xl-2*fl,120,'物體在 2F 以外',D.object);
      const move=sharp?'剛好':s.focus<v?'往前伸（遠離感光元件）':'往後縮（靠近感光元件）';
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['畫面',sharp?'清楚':'模糊'],['鏡頭應該',move],['物體位置','2F 以外'],['成像','倒立・縮小・實像']],
        note:'相機用<b>移動鏡頭</b>對焦：物體越近，像距越大，鏡頭就要往前伸。'};
    }
    const X0=560,L0={eye:200,myopia:240,hyper:170,presby:200}[s.dev],xr=X0+L0,PMIN={20:120,45:145,65:170};
    let u,oh,fEye,lenses;
    if(s.dev==='eye'){u=s.u;oh=40;fEye=1/(1/u+1/L0);lenses=[{x:X0,f:fEye}];}
    else if(s.dev==='myopia'){u=3000;oh=0;fEye=200;lenses=[{x:X0,f:fEye}];if(s.glasses){const Dv=1/(1/200-1/L0);lenses.unshift({x:X0-70,f:1/(1/(u-70)+1/-(Dv-70))});}}
    else if(s.dev==='presby'){/* 老花：眼球長度正常，水晶體最多只能變到 PMIN 這麼厚（焦距不能再短） */
      u=s.pview==='far'?3000:380;oh=0;const need=1/(1/u+1/L0);fEye=Math.max(need,PMIN[s.age]);lenses=[{x:X0,f:fEye}];
      if(s.glasses&&s.pview==='near'&&fEye>need+0.5){const Dv=1/(1/fEye-1/L0);lenses.unshift({x:X0-70,f:1/(1/(u-70)+1/-(Dv-70))});}}
    else{u=520;oh=0;fEye=160;lenses=[{x:X0,f:fEye}];if(s.glasses){const Dv=1/(1/160-1/L0);lenses.unshift({x:X0-70,f:1/(1/(u-70)+1/-(Dv-70))});}}
    const ox=X0-u,first=lenses[0].x;
    h+=`<ellipse cx="${(X0-24+xr)/2}" cy="${cy}" rx="${(xr-X0+24)/2+12}" ry="115" fill="#1a2536" stroke="#c9d6e6" stroke-width="2.5"/>`+`<path d="M${xr-4} ${cy-90}Q${xr+14} ${cy} ${xr-4} ${cy+90}" fill="none" stroke="#ff92bc" stroke-width="5"/>`+T(xr+18,cy-80,'視網膜',{size:14,fill:D.second});
    h+=lensShape(X0,fEye,58)+T(X0,cy-74,'水晶體',{size:15,fill:D.ray,anchor:'middle',halo:true});
    if(lenses.length>1)h+=lensShape(lenses[0].x,lenses[0].f,70)+T(lenses[0].x,cy+96,lenses[0].f>0?'凸透鏡':'凹透鏡',{size:14,fill:D.ink,anchor:'middle'});
    const ys=s.beam==='single'?[38]:[-45,-30,-15,0,15,30,45];let conv=null;
    for(const yk of ys){const t=trace(ox,oh,(yk-oh)/(first-ox),lenses,xr);if(Math.abs(t.m)>1e-9&&oh===0)conv=t.x-t.y/t.m;
      if(s.on){h+=ray(toPx(t.pts),'#ffe8a5',{w:s.beam==='single'?3:1.6,arrow:false,op:.85});}}
    const fade=fadeIn();
    if(oh===0&&conv!==null&&fade>0&&conv>xr+2){for(const yk of ys){const t=trace(ox,oh,(yk-oh)/(first-ox),lenses,xr);h+=L(xr,Y(t.pts[t.pts.length-1][1]),conv,cy,{stroke:'#ffe8a5',w:1.2,dash:'4 5',op:.6*fade});}h+=`<circle cx="${conv}" cy="${cy}" r="5" fill="${D.object}" opacity="${fade}"/>`;}
    if(oh===0&&conv!==null&&fade>0&&conv<xr-2)h+=`<circle cx="${conv}" cy="${cy}" r="5" fill="${D.object}" opacity="${fade}"/>`;
    /* 標出光會聚的位置，以及視網膜上看到的是一個點還是一團 */
    if(oh===0&&conv!==null&&fade>0){const on=Math.abs(conv-xr)<3,lab=on?'剛好會聚在視網膜上 → 清楚':conv<xr?'會聚點在視網膜前方':'會聚點在視網膜後方';
      h+=`<g opacity="${fade}">${on?'':`<rect x="${xr-5}" y="${cy-Math.min(60,Math.abs(conv-xr)*0.9)}" width="10" height="${2*Math.min(60,Math.abs(conv-xr)*0.9)}" rx="5" fill="#ffe8a5" opacity=".45"/>`}${T(on?xr-40:Math.min(conv-20,740),cy+(on?150:140),lab,{size:16,fill:D.object,anchor:'middle',weight:700,halo:true})}${on?'':T(Math.min(conv-20,740),cy+164,'視網膜上是一團光 → 看起來模糊',{size:15,fill:D.ink,anchor:'middle',halo:true})}</g>`;}
    if(s.dev==='eye'){if(fade>0)h+=`<g opacity="${fade}">${vArrow(xr-8,cy,Y(-oh*L0/u),D.image)}</g>`;if(ox>30)h+=`<g opacity="${s.on?1:.35}">${vArrow(ox,cy,Y(oh),D.object)}</g>`+handle('eobj',ox,cy,D.object);else h+=T(40,Y(oh)-10,`← ${u>=2400?'很遠':'較遠'}的物體`,{size:15,fill:D.object});}
    else if(ox>30)h+=`<circle cx="${ox}" cy="${cy}" r="7" fill="${s.on?D.object:'#56606e'}"/>`+T(ox,cy-16,s.dev==='presby'?'看書（近處）':'近處物體',{size:15,fill:D.object,anchor:'middle'});else h+=T(40,cy-14,'← 遠方物體',{size:15,fill:D.object});
    if(s.dev==='eye')return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['水晶體',u<900?'變厚（看近）':u<2400?'稍厚':'較薄（看遠）'],['視網膜上的像','倒立・縮小・實像'],['畫面','清楚（水晶體自動調整厚薄）']],
      note:'眼睛像相機：<b>水晶體</b>是凸透鏡，在<b>視網膜</b>上形成倒立縮小的實像；看近時水晶體變厚。'};
    const where=conv===null?'—':Math.abs(conv-xr)<3?'視網膜上':conv<xr?'視網膜前方':'視網膜後方',ok=where==='視網膜上';
    if(s.dev==='presby'){const weak=PMIN[s.age]>1/(1/380+1/L0)+0.5;h+=EXT_TAG;
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['年齡',s.age+' 歲'],['看近時水晶體',weak?'變不夠厚（調節能力變差）':'可以變厚 → 看得清楚'],['光會聚在',where],['矯正',s.pview==='far'?'看遠不需要':weak?'凸透鏡（老花眼鏡，看近時戴）':'不需要']],
        note:'年紀越大，水晶體越<b>硬</b>，看近時沒辦法變得夠厚：光會聚在視網膜<b>後方</b>，看書模糊。但眼球長度正常，<b>看遠仍然清楚</b> → 這是老花，和眼球太短的遠視不同。老花眼鏡是<b>凸透鏡</b>，看近時戴。'};}
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:s.dev==='myopia'?[['眼球','前後太長（也可能是水晶體太厚）'],['光會聚在',where],['看遠處',ok?'清楚':'模糊'],['矯正','凹透鏡（發散）']]:[['眼球','前後太短（也可能是水晶體太薄）'],['光會聚在',where],['看近處',ok?'清楚':'模糊'],['矯正','凸透鏡（會聚）']],
      note:s.dev==='myopia'?'近視：光會聚在視網膜<b>前方</b> → 戴<b>凹透鏡</b>讓光先發散一點。':'遠視：光會聚在視網膜<b>後方</b> → 戴<b>凸透鏡</b>幫忙會聚。'};}},
/* ===== 11 顏色 ===== */
color:{group:2,n:'4-5',keep:['mode'],steps:'mode',
  tasks:{prism:'看紙屏上的顏色順序：哪一色光偏折最多？再改成單色光，或再放一個倒置的三稜鏡。',rainbow:'跟著光走一遍：進入小水滴折射 → 反射 → 再折射出來；再切到「為什麼外紅內紫？」。',clear:'換不同顏色的玻璃紙：透過來的是什麼色光？兩張疊在一起又會怎樣？',opaque:'改變照射的光或物體：物體看起來是什麼顏色？什麼時候會變成黑色？',mix:'開關紅、綠、藍光：兩兩重疊是什麼顏色？三種都開呢？',paint:'（延伸）加入青、洋紅、黃顏料：顏料是越混越亮，還是越混越暗？'},name:'色散與顏色',subtitle:'白光經過三稜鏡會分成各種色光（色散），彩虹也是這樣形成的；物體的顏色，看它讓哪些色光透過或反射。',dark:true,
  q:s=>({html:qBlockHTML(COLOR_Q[s.mode==='opaque'&&s.ov==='text'?'text':s.mode]||COLOR_Q.prism)+quizHTML(s,COLOR_QUIZ)}),
  qAction(s,v){quizAction(s,v,COLOR_QUIZ);},
  state:{on:true,prog:0,mode:'prism',beam:'full',hue:3,newton:false,rv:'drop',tv:'one',f1:'r',f2:'g',fR:true,fG:true,fB:true,ov:'obj',obj:'apple',ink:'r',gv:'g',r:1,g:1,b:1,pc:true,pm:true,py:true,compare:false,qi:0,qp:null,qc:false,qs:false},
  controls:[{...LAMP,adv:true},
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
    for(const i of full?SPECTRUM.map((c,j)=>j):[s.hue]){const n=1.50+i*0.03,d1=cRefr(d0,[-0.866,-0.5],1,n),P2=hitFace(H,d1,A,C);let e=cRefr(d1,[-0.866,0.5],n,1);if(!e)continue;const pts=[H,P2];
      if(nw){const Q1=hitFace(P2,e,C2,A2),e1=cRefr(e,[-0.866,0.5],1,n),Q2=hitFace(Q1,e1,A2,B2);e=cRefr(e1,[-0.866,-0.5],n,1);if(!e)continue;pts.push(Q1,Q2);}
      const P=pts[pts.length-1],S=[852,P[1]+e[1]*(852-P[0])/e[0]];pts.push(S);spots.push([S[1],SPECTRUM[i][1],SPECTRUM[i][0],P]);
      if(s.on)h+=ray(pts,SPECTRUM[i][1],{w:full?2.2:3.5,arrow:false,op:.95,delay:len});}
    const fade=fadeIn(),done=s.on&&arrived();
    if(done&&nw&&full){const r0=spots[0],v0=spots[spots.length-1],p0=[r0[3],v0[3]].sort((a,b)=>(b[0]*d0[0]+b[1]*d0[1])-(a[0]*d0[0]+a[1]*d0[1]))[0],y0=Math.min(r0[0],v0[0]),y1=Math.max(r0[0],v0[0]);
      h+=`<defs><linearGradient id="nwt" gradientUnits="userSpaceOnUse" x1="${p0[0]}" y1="${p0[1]}" x2="${p0[0]+d0[0]*50}" y2="${p0[1]+d0[1]*50}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs>`;
      h+=`<g opacity="${fade}"><polygon points="${r0[3]} 852,${r0[0]} 852,${v0[0]} ${v0[3]}" fill="url(#nwt)" stroke="url(#nwt)" stroke-width="3"/><rect x="852" y="${y0-3}" width="18" height="${y1-y0+6}" fill="#fff"/>${T(846,y0-16,'又變回白光',{size:16,fill:'#ffffff',anchor:'end',weight:700})}</g>`;}
    else if(done)spots.forEach(([y,c,n],j)=>{h+=`<rect x="852" y="${y-6}" width="18" height="12" fill="${c}"/>`;if(!full||j===0||j===spots.length-1)h+=T(875,y+5,n,{size:15,fill:c,weight:700});});
    h+=`<rect x="18" y="404" width="34" height="22" rx="5" transform="rotate(-29 35 415)" fill="${s.on?'#c9d3df':'#5a6573'}"/>`;
    const inc=s.on?(full?'白光':nm+'光'):'沒有光（關燈）',reads=!full?[['入射光',inc],['射出',done?nm+'光（不再分散）':'—'],...(nw?[['倒置的三稜鏡',done?'又把它偏折回來':'—']]:[])]:nw?[['入射光',inc],['第一個三稜鏡',done?'分成各種色光':'—'],['倒置的三稜鏡',done?'把各色光偏折回來':'—'],['紙屏上',done?'又變回白光':'—']]:[['入射光',inc],['射出',done?'各種色光（紅～紫）':'—'],['偏折最少',done?'紅光':'—'],['偏折最多',done?'紫光':'—']];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:!full?'單色光通過三稜鏡只會<b>偏折</b>，不會再分出其他顏色。':nw?'倒置的三稜鏡把各色光<b>反方向偏折</b>回來，重疊在一起 → <b>又變回白光</b>（牛頓的實驗）。可見顏色不是三稜鏡「染」上去的，白光本來就含有各種色光。':'各色光在玻璃中的<b>光速不同</b>（4-3）→ 偏折程度不同：<b>紫光最多、紅光最少</b>，白光就分成各種色光，這叫<b>色散</b>。光都偏向三稜鏡<b>較厚的底部</b>，這也是凸透鏡能會聚光的原因（4-4）。<br><small>延伸：4-3「光的折射」的波前圖，可以比較紅光和紫光。</small>'};},
  rainbow(s){
    /* 彩虹：陽光在水滴裡折射 → 反射 → 再折射。水的折射率紅光約 1.331、紫光約 1.343，圖中色散放大 4 倍 */
    const nOf=i=>1.331+0.011*i,drop=(c,R,n)=>{const b=0.86*R,E=[c[0]-Math.sqrt(R*R-b*b),c[1]-b],un=p=>[(p[0]-c[0])/R,(p[1]-c[1])/R],cut=(p,d)=>{const t=-2*((p[0]-c[0])*d[0]+(p[1]-c[1])*d[1]);return[p[0]+d[0]*t,p[1]+d[1]*t];};
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
        note:(white&&s.fR&&s.fG&&s.fB?'白光含有各種色光。三片濾色片分別只讓紅、綠、藍光<b>透過</b>，三道色光在屏幕上疊回去 → 看起來又是<b>白色</b>；兩兩重疊是黃、青、洋紅。':white?'拿掉濾色片的那一道是<b>白光</b>，直接通過；它和其他色光疊在一起，看起來還是偏白。':'三片濾色片分別只讓紅、綠、藍光<b>透過</b>；照射的光裡沒有的色光，濾色片也變不出來。拿掉濾色片，光就直接通過。')};
    }
    /* 一張或兩張玻璃紙排在一起 */
    const ks=s.tv==='two'?[s.f1,s.f2]:[s.f1],xs=s.tv==='two'?[300,520]:[400],steps=[];let c=c0,x=74,dl=0;
    /* 光畫成紅、綠、藍三股細光：被玻璃紙吸收的那一股停在玻璃紙上（打 ✕），透過的才繼續往前 */
    const STR=[[-13,'#ff3b30'],[0,'#30d158'],[13,'#0a84ff']],strands=(cc,xa,xb,d)=>STR.map(([o,col],i)=>cc[i]>=40?ray([[xa,250+o],[xb,250+o]],col,{w:6,arrow:false,op:.35+.6*cc[i]/255,delay:d}):'').join('');
    if(s.on&&white)h+=T(190,214,'白光含有各種色光（圖中用紅、綠、藍代表）',{size:14,fill:D.ink,anchor:'middle',weight:700});
    ks.forEach((k,j)=>{const[nm,f]=FILTERS[k],x1=xs[j],out=cmul(c,f),abs=cmul(c,f.map(v=>1-v)),got=s.on&&has(c)&&REACH>=dl+x1-x;
      if(s.on&&has(c))h+=strands(c,x,x1,dl);
      if(got)STR.forEach(([o],i)=>{if(c[i]>=40&&out[i]<40)h+=T(x1-14,250+o+5,'✕',{size:15,fill:'#ffffff',anchor:'middle',weight:700});});
      h+=`<rect x="${x1}" y="150" width="16" height="200" rx="3" fill="${rgbOf(f.map(v=>v*255))}" opacity=".7" stroke="#ffffff66"/>`+T(x1+8,138,`${nm}色玻璃紙`,{size:15,fill:D.ink,anchor:'middle',weight:700});
      if(got)h+=T(x1+8,380,has(out)?`透過：${ln(out)}`:'全部被吸收',{size:14,fill:D.ink,anchor:'middle'})+(has(abs)?T(x1+8,402,`吸收：${c.every(v=>v>0)?'其餘色光':ln(abs)}`,{size:14,fill:D.muted,anchor:'middle'}):'');
      steps.push([nm,out]);dl+=x1-x;c=out;x=x1+16;});
    if(s.on&&has(c))h+=strands(c,x,760,dl);
    const done=!s.on||!any||arrived(),fade=s.on&&any?fadeIn():1,res=!any?'沒有光':has(c)?ln(c):'幾乎沒有光';
    h+=`<rect x="760" y="90" width="26" height="320" rx="4" fill="#2a313c" stroke="#3a4554"/>`+T(773,78,'白色屏幕',{size:15,fill:D.muted,anchor:'middle'});
    if(done&&has(c))h+=`<ellipse cx="773" cy="250" rx="15" ry="46" fill="${rgbOf(c)}" opacity="${fade}"/>`;
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
    /* 照下來的紅、綠、藍光；物體反射的那幾股射向右上的眼睛，被吸收的停在物體上 */
    const STR=[[-16,'#ff3b30','紅'],[0,'#30d158','綠'],[16,'#0a84ff','藍']],eye=[520,120],top={apple:262,leaf:258,banana:300,paper:246,cloth:256}[s.obj];
    if(s.on&&any){STR.forEach(([o,col],i)=>{if(c0[i]>0)h+=ray([[300+o,48],[300+o,top]],col,{w:5,op:.9});if(lit>=1&&out[i]>=40)h+=ray([[312+o*.5,top+4+o*.5],[eye[0]-14,eye[1]+o*.6]],col,{w:5,op:.95,delay:380});});
      if(lit>=1){const ab=STR.filter((x,i)=>c0[i]>0&&out[i]<40).map(x=>x[2]),rf=STR.filter((x,i)=>out[i]>=40).map(x=>x[2]);
        h+=`<ellipse cx="${eye[0]}" cy="${eye[1]}" rx="22" ry="13" fill="#fff"/><circle cx="${eye[0]-6}" cy="${eye[1]}" r="7" fill="#1b2a33"/>`+T(eye[0],eye[1]-24,'眼睛',{size:14,fill:D.muted,anchor:'middle'});
        h+=T(470,178,rf.length?`反射：${rf.join('、')}光`:'沒有光反射',{size:15,fill:D.ink,anchor:'middle',weight:700,halo:true})+(ab.length?T(300,455,`吸收：${ab.join('、')}光`,{size:15,fill:D.muted,anchor:'middle',halo:true}):'');}}
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
    h+=T(735,370,'紅＋綠＝黃',{size:17,fill:D.muted,anchor:'middle'})+T(735,400,'綠＋藍＝青',{size:17,fill:D.muted,anchor:'middle'})+T(735,430,'紅＋藍＝洋紅',{size:17,fill:D.muted,anchor:'middle'});
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
      note:'（延伸）顏料三原色是<b>青、洋紅、黃</b>：青吸收紅光、洋紅吸收綠光、黃吸收藍光。混得越多吸收越多 → 越暗（<b>減色</b>）。'};}},
/* ===== 4-5 色光自由實驗室 ===== */
colorfree:{group:2,n:'4-5',tasks:s=>s.guess?'只看這個燈光下的樣子，猜國旗原本是什麼顏色，再按「揭曉答案」。':'先選一面國旗，再把燈光換成紅光（或關掉綠燈）：每一條會變成什麼顏色？',name:'色光自由實驗室',subtitle:'自己調燈光、選物體、加玻璃紙：看到的顏色＝光源裡有、物體會反射、玻璃紙也讓它透過的色光。',dark:true,
  q:()=>({html:cfQHTML()}),
  state:{lr:100,lg:100,lb:100,obj:'de',filt:'none',cust:['w','r','k'],guess:false,myst:'de',reveal:false},
  controls:[
    {type:'buttons',label:'快速選燈光',items:[...LIGHTS,['關燈',[0,0,0]]].map(([n,c])=>[n,s=>{[s.lr,s.lg,s.lb]=c.map(v=>v*100);}])},
    {type:'range',key:'lr',label:'紅燈亮度',min:0,max:100,step:5,unit:'%'},
    {type:'range',key:'lg',label:'綠燈亮度',min:0,max:100,step:5,unit:'%'},
    {type:'range',key:'lb',label:'藍燈亮度',min:0,max:100,step:5,unit:'%'},
    {type:'seg',key:'obj',label:'物體',options:[['card','色卡'],...Object.entries(CF_FLAGS).map(([k,v])=>[k,v[0]+'國旗']),['my','自己設計']],show:s=>!s.guess},
    {type:'seg',key:'filt',label:'眼睛前面的玻璃紙',options:[['none','不放'],...Object.entries(FILTERS).map(([k,v])=>[k,v[0]+'色'])]},
    {type:'toggle',key:'guess',label:'猜猜看：藏起國旗原本的顏色',onChange:s=>{if(s.guess)cfPickMystery(s);}},
    {type:'buttons',items:[['揭曉答案',s=>{s.reveal=true;}],['換一面國旗',s=>{cfPickMystery(s);}]],show:s=>s.guess}],
  tap(s,v){const[k,i]=v.split(':');if(k==='cust'){const j=CF_ORDER.indexOf(s.cust[+i]);s.cust=s.cust.map((c,n)=>n===+i?CF_ORDER[(j+1)%CF_ORDER.length]:c);}},
  render(s){
    const[kind,dir,keys]=cfObj(s),lt=cfLight(s),lightOn=Math.max(...lt)>0,hide=s.guess&&!s.reveal,f=s.filt==='none'?null:FILTERS[s.filt];
    const seen=keys.map(k=>cfSeen(s,k)),names=seen.map(cfName),lightName=lightOn?cfName(lt.map(v=>v*255))+'光':'沒有光（關燈）';
    let h=`<rect x="20" y="20" width="520" height="460" rx="20" fill="#05080d"/>`;
    /* 三盞燈與照下來的光 */
    [['紅',0,'#ff3b30'],['綠',1,'#30d158'],['藍',2,'#0a84ff']].forEach(([n,i,c],j)=>{const x=200+j*80,v=lt[i];
      h+=`<circle cx="${x}" cy="54" r="19" fill="${v?c:'#2a313c'}" fill-opacity="${v?0.25+0.75*v:1}" stroke="#ffffff55" stroke-width="2"/>`+T(x,59,n,{size:14,fill:v>0.5?'#05080d':D.ink,anchor:'middle',weight:700})+T(x,92,`${Math.round(v*100)}%`,{size:13,fill:D.muted,anchor:'middle'});});
    if(lightOn)h+=`<defs><linearGradient id="cfbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rgbOf(lt.map(v=>v*255))}" stop-opacity=".45"/><stop offset="1" stop-color="${rgbOf(lt.map(v=>v*255))}" stop-opacity="0"/></linearGradient></defs><polygon points="185,76 375,76 500,160 60,160" fill="url(#cfbeam)"/>`;
    /* 物體：照到這種光、再透過玻璃紙，看起來的樣子 */
    const tapOK=kind==='my',box=(x,y,w,ht,c,i,lab)=>{const g=`<rect x="${x}" y="${y}" width="${w}" height="${ht}" fill="${rgbOf(c)}" stroke="#56606e" stroke-width="1.5"/>`+T(x+w/2,y+ht/2+7,lab,{size:19,fill:cfInk(c),anchor:'middle',weight:700});
      return tapOK?`<g data-tap="cust:${i}" tabindex="0" role="button" aria-label="第 ${i+1} 條，點一下換顏色">${g}</g>`:g;};
    if(kind==='card'){keys.forEach((k,i)=>{const x=78+(i%4)*104,y=170+Math.floor(i/4)*130;h+=box(x,y,92,92,seen[i],i,names[i]);h+=T(x+46,y+116,'白光下：'+CF_COLORS[k][0],{size:13,fill:D.muted,anchor:'middle'});});}
    else{const X=100,Y=168,W=360,H=228,n=keys.length;keys.forEach((k,i)=>{h+=dir==='v'?box(X+i*W/n,Y,W/n,H,seen[i],i,names[i]):box(X,Y+i*H/n,W,H/n,seen[i],i,names[i]);});
      if(tapOK)h+=T(280,436,'點國旗的每一條，可以換顏色',{size:14,fill:D.object,anchor:'middle'});}
    if(f)h+=`<rect x="64" y="152" width="432" height="${kind==='card'?280:252}" rx="10" fill="none" stroke="${rgbOf(f[1].map(v=>v*255))}" stroke-width="4" stroke-dasharray="10 6"/>`+T(280,462,`透過${f[0]}色玻璃紙看`,{size:15,fill:D.ink,anchor:'middle',weight:700});
    else h+=T(280,462,'直接看',{size:15,fill:D.muted,anchor:'middle'});
    /* 右邊：白光下的樣子與每一條的推理 */
    h+=T(715,46,'白光下（原本的顏色）',{size:15,fill:D.muted,anchor:'middle'});
    if(hide)h+=`<rect x="640" y="60" width="150" height="96" rx="6" fill="#141b26" stroke="#56606e" stroke-dasharray="6 5"/>`+T(715,120,'？',{size:44,fill:D.object,anchor:'middle',weight:700});
    else if(kind==='card')CF_ORDER.forEach((k,i)=>{h+=`<rect x="${631+(i%4)*43}" y="${62+Math.floor(i/4)*46}" width="38" height="40" fill="${rgbOf(CF_COLORS[k][1].map(v=>v*255))}" stroke="#56606e"/>`;});
    else{const n=keys.length;keys.forEach((k,i)=>{const c=CF_COLORS[k][1].map(v=>v*255);h+=dir==='v'?`<rect x="${640+i*150/n}" y="60" width="${150/n}" height="96" fill="${rgbOf(c)}" stroke="#56606e"/>`:`<rect x="640" y="${60+i*96/n}" width="150" height="${96/n}" fill="${rgbOf(c)}" stroke="#56606e"/>`;});}
    const title=kind==='card'?'色卡':kind==='my'?'自己設計的國旗':kind==='mystery'?(hide?'神秘國旗':CF_FLAGS[s.myst][0]+'國旗'):CF_FLAGS[kind][0]+'國旗';
    h+=T(715,178,title,{size:15,fill:D.ink,anchor:'middle',weight:700});
    const rows=keys.length,rh=Math.min(34,250/rows),y0=212;
    h+=T(586,y0-6,dir==='v'?'由左到右':kind==='card'?'色卡':'由上到下',{size:14,fill:D.muted})+T(700,y0-6,'會反射',{size:14,fill:D.muted,anchor:'middle'})+T(812,y0-6,'看起來',{size:14,fill:D.muted,anchor:'middle'});
    keys.forEach((k,i)=>{const y=y0+i*rh,c=CF_COLORS[k][1],cy=y+rh/2;
      h+=hide?`<rect x="586" y="${cy-9}" width="22" height="18" fill="#141b26" stroke="#56606e" stroke-dasharray="3 3"/>`+T(614,cy+5,'？',{size:16,fill:D.object}):`<rect x="586" y="${cy-9}" width="22" height="18" fill="${rgbOf(c.map(v=>v*255))}" stroke="#56606e"/>`+T(614,cy+5,CF_COLORS[k][0],{size:16,fill:D.ink});
      ['#ff3b30','#30d158','#0a84ff'].forEach((col,j)=>{const x=680+j*20;h+=hide?`<circle cx="${x}" cy="${cy}" r="6" fill="none" stroke="#56606e" stroke-dasharray="2 2"/>`:`<circle cx="${x}" cy="${cy}" r="6" fill="${c[j]?col:'none'}" stroke="${c[j]?col:'#56606e'}" stroke-width="1.5"/>`;});
      h+=L(740,cy,762,cy,{stroke:D.muted,w:1.5})+`<rect x="768" y="${cy-9}" width="22" height="18" fill="${rgbOf(seen[i])}" stroke="#56606e"/>`+T(796,cy+5,names[i],{size:16,fill:D.ink,weight:700});});
    h+=T(715,y0+rows*rh+18,'● 會反射　○ 不會反射（紅、綠、藍）',{size:14,fill:D.muted,anchor:'middle'});
    /* 相鄰條紋看起來一樣 → 連成一片 */
    const same=[];if(kind!=='card')for(let i=1;i<keys.length;i++)if(names[i]===names[i-1])same.push(i);
    const groups=kind==='card'?0:keys.length-same.length;
    let note='看到的顏色＝<b>光源裡有</b>、而且物體<b>會反射</b>的色光'+(f?'，還要<b>玻璃紙讓它透過</b>':'')+'。';
    if(!lightOn)note+='關燈時沒有光可以反射，什麼都是黑的。';
    else if(seen.every(c=>Math.max(...c)<30))note+='照到的光，物體都不反射'+(f?'（或被玻璃紙擋住）':'')+' → 一片黑。';
    else if(same.length&&kind!=='card')note+=`相鄰的條紋看起來一樣，連成一片 → 只看得出 <b>${groups}</b> 條。`;
    if(hide)note+='<br>換不同顏色的燈光照照看：每一條亮或不亮，告訴你它會不會反射那種色光。想好了再按「揭曉答案」。';
    if(kind==='card'&&lightOn&&!f&&lt.every(v=>v===1))note+='白光含有紅、綠、藍光，色卡都是原本的顏色。換一種燈光，看看哪些色卡變黑。';
    return {svg:h,reads:[['燈光',lightName],['玻璃紙',f?f[0]+'色':'沒有放'],[kind==='card'?'看起來':'由'+(dir==='v'?'左到右':'上到下')+'看起來',names.join('・')],...(kind==='card'?[]:[['看得出幾條',`${groups} 條`]])],note};}},
/* ===== 5-1 溫度與溫度計 ===== */
temp:{group:3,n:'5-1',keep:['mode'],steps:'mode',
  tasks:{touch:'先做「①」再做「②」：兩手放進同一盆溫水，感覺一樣嗎？最後打開「用溫度計量量看」。',types:'換不同的溫度計，再調待測物的溫度：每一種是利用什麼性質來測量？',design:'把乙換成大泡、細管：水溫升高 1°C，哪一支的液柱上升得多？',scale:'照 ①②③ 的順序做：溫度計的刻度是怎麼定出來的？',convert:'按「常見溫度」，看攝氏、華氏、X 溫標怎麼對應；先自己算，再看答案。'},name:'溫度與溫度計',subtitle:'溫度是物體的冷熱程度。溫度計利用物質的性質隨溫度規律改變來測量；溫標是在兩個定點之間等分刻度。',
  q:s=>({html:qBlockHTML(TEMP_Q[s.mode==='types'?s.kind:s.mode])+quizHTML(s,TEMP_QUIZ)}),
  qAction(s,v){quizAction(s,v,TEMP_QUIZ);},
  state:{mode:'touch',tstep:'soak',measure:false,kind:'liquid',liq:'alc',tt:25,body:37,clin:'out',cr:null,bulb:'b',bore:'thin',dt:20,sys:'C',mk:'ice',tc:40,xa:-20,xb:180,cc:37,kel:false,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['touch','用手感覺可靠嗎'],['types','溫度計的種類'],['design','液體溫度計的設計'],['scale','溫標的制定'],['convert','溫標的換算']]},
    {type:'seg',key:'tstep',label:'步驟',options:[['soak','① 左手泡熱水、右手泡冷水'],['move','② 兩手一起放進溫水']],show:s=>s.mode==='touch'},
    {type:'toggle',key:'measure',label:'用溫度計量量看',show:s=>s.mode==='touch'},
    {type:'seg',key:'kind',label:'溫度計',options:[['liquid','液體溫度計'],['clinical','體溫計'],['bimetal','金屬溫度計'],['digital','電子溫度計'],['ir','紅外線溫度計']],show:s=>s.mode==='types'},
    {type:'seg',key:'liq',label:'液體',options:[['alc','酒精（染紅）'],['hg','水銀']],show:s=>s.mode==='types'&&s.kind==='liquid'},
    {type:'range',key:'tt',label:'待測物的溫度',min:-50,max:120,step:1,unit:'°C',show:s=>s.mode==='types'&&s.kind!=='clinical'},
    {type:'range',key:'body',label:'現在的體溫',min:35,max:42,step:.1,unit:'°C',fmt:s=>s.body.toFixed(1)+'°C',show:s=>s.mode==='types'&&s.kind==='clinical'},
    {type:'buttons',label:'操作',items:[['放進腋下',s=>{s.clin='in';}],['拿出來',s=>{s.clin='out';}],['甩一甩',s=>{s.clin='out';s.cr=null;}]],show:s=>s.mode==='types'&&s.kind==='clinical'},
    {type:'seg',key:'bulb',label:'乙的玻璃泡',options:[['s','小'],['b','大']],show:s=>s.mode==='design'},
    {type:'seg',key:'bore',label:'乙的管徑',options:[['thick','粗'],['thin','細']],show:s=>s.mode==='design'},
    {type:'range',key:'dt',label:'水溫',min:0,max:40,step:1,unit:'°C',show:s=>s.mode==='design'},
    {type:'seg',key:'sys',label:'要定的溫標',options:[['C','攝氏'],['F','華氏'],['X','自訂 X 溫標']],show:s=>s.mode==='scale'},
    {type:'seg',key:'mk',label:'步驟',options:[['ice','① 放入冰水混合物'],['boil','② 放入沸水'],['test','③ 等分刻度、量一杯水']],show:s=>s.mode==='scale'},
    {type:'range',key:'tc',label:'這杯水的溫度（攝氏）',min:0,max:100,step:1,unit:'°C',show:s=>s.mode==='scale'&&s.mk==='test'},
    {type:'range',key:'cc',label:'攝氏溫度',min:-40,max:110,step:1,unit:'°C',show:s=>s.mode==='convert'},
    {type:'buttons',label:'常見溫度',items:[['冰點 0°C',s=>{s.cc=0;}],['室溫 25°C',s=>{s.cc=25;}],['體溫 37°C',s=>{s.cc=37;}],['沸點 100°C',s=>{s.cc=100;}],['−40°C',s=>{s.cc=-40;}]],show:s=>s.mode==='convert'},
    {type:'range',key:'xa',label:'X 溫標：冰點定為',min:-50,max:50,step:5,unit:'°X',show:s=>s.mode==='convert'||(s.mode==='scale'&&s.sys==='X')},
    {type:'range',key:'xb',label:'X 溫標：沸點定為',min:60,max:250,step:10,unit:'°X',show:s=>s.mode==='convert'||(s.mode==='scale'&&s.sys==='X')},
    {type:'toggle',key:'kel',label:'（延伸）顯示克氏溫標 K',show:s=>s.mode==='convert'}],
  render(s){const m=s.mode;return m==='types'?this[s.kind](s):m==='design'?this.design(s):m==='scale'?this.scale(s):m==='convert'?this.convert(s):this.touch(s);},
  panel:(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fffdf8" stroke="#ddd7c9"/>`,
  lines(x,y,arr,o={}){const{size=18,gap=30}=o;return arr.map((t,i)=>T(x,y+i*gap,t,{size,fill:P.ink})).join('');},
  touch(s){const soak=s.tstep==='soak',B=[[200,45,'熱水',WARM(95)],[450,30,'溫水',WARM(50)],[700,10,'冷水',WARM(0)]];
    let h=T(450,46,soak?'① 兩手各泡一分鐘':'② 兩手一起放進溫水',{size:24,anchor:'middle',weight:700});
    B.forEach(([x,t,n,c])=>{h+=`<path d="M${x-106} 300L${x-88} 420H${x+88}L${x+106} 300Z" fill="${c}" fill-opacity=".35"/>`+L(x-106,300,x+106,300,{stroke:c,w:3})
      +`<path d="M${x-114} 262L${x-90} 424H${x+90}L${x+114} 262" fill="none" stroke="#83999d" stroke-width="4" stroke-linejoin="round"/>`
      +T(x,456,n,{size:21,anchor:'middle',weight:700,fill:c})+T(x,484,s.measure?`溫度計：${t}°C`:'溫度？',{size:17,anchor:'middle',fill:s.measure?P.ink:P.muted});
      if(t===45)for(let i=0;i<3;i++)h+=`<path d="M${x-40+i*40} 290q-8 -12 0 -24q8 -12 0 -24" fill="none" stroke="${P.red}" stroke-width="2" opacity=".45"/>`;});
    const hand=(x,y,name)=>`<rect x="${x-26}" y="88" width="52" height="${y-178}" rx="8" fill="#a9c1d1"/>`
      +`<path d="M${x-22} ${y-92}V${y-22}Q${x-22} ${y} ${x} ${y}Q${x+22} ${y} ${x+22} ${y-22}V${y-92}Z" fill="#f2c9a5" stroke="#c99a76" stroke-width="2"/>`
      +T(x,124,name,{size:17,anchor:'middle',weight:700,fill:'#2c4655'});
    if(soak)h+=hand(200,370,'左手')+hand(700,370,'右手')+thermBubble(312,150,'熱熱的',P.red)+thermBubble(588,150,'冰冰的',P.blue);
    else h+=hand(420,370,'左手')+hand(480,370,'右手')+thermBubble(300,150,'好冷！',P.blue)+thermBubble(600,150,'好熱！',P.red)
      +T(450,236,'同一盆水',{size:17,anchor:'middle',fill:P.muted});
    return {svg:h,reads:soak?[['左手','泡在 45°C 熱水'],['右手','泡在 10°C 冷水'],['接下來','一起放進溫水']]:[['左手覺得溫水','冷'],['右手覺得溫水','熱'],['溫度計',s.measure?'兩邊都是 30°C':'（打開「用溫度計量量看」）']],
      note:'<b>溫度</b>：表示物體的<b>冷熱程度</b>。同一盆溫水，兩手感覺卻相反：手的感覺會受原來的狀態影響，<b>不可靠</b>，所以要用溫度計測量。'};},
  liquid(s){const hg=s.liq==='hg',x=300,yb=455,y=t=>420-(t+50)*2,frozen=hg&&s.tt<-39,boil=!hg&&s.tt>78,show=frozen?-39:boil?78:s.tt;
    let h=`<rect x="226" y="372" width="148" height="114" fill="${WARM(s.tt)}" fill-opacity=".3"/>`+beakerPath(222,378,350,488)+T(214,440,'待測物',{size:16,anchor:'end',fill:P.muted});
    h+=glassTherm(x,yb,70,y(show),{c:hg?(frozen?'#6f777f':HG):ALC,br:15,w:9})+thermTicks(x+12,-50,120,5,20,y,{size:17});
    h+=L(x-30,y(s.tt),x-12,y(s.tt),{stroke:P.accent,w:3,arrow:true})+T(x-36,y(s.tt)+6,`實際 ${s.tt}°C`,{size:15,anchor:'end',fill:P.accent,weight:700});
    h+=this.panel(470,70,400,330)+T(670,108,'液體溫度計：熱脹冷縮',{size:22,anchor:'middle',weight:700});
    h+=this.lines(495,148,['玻璃泡裡的液體受熱膨脹、遇冷收縮，','體積變化在細管中變成液柱長度的變化。'],{size:17,gap:28});
    const row=(yy,a,b,c,o={})=>T(530,yy,a,{size:17,anchor:'middle',...o})+T(660,yy,b,{size:17,anchor:'middle',...o})+T(790,yy,c,{size:17,anchor:'middle',...o});
    h+=row(232,'液體','凝固點','沸點',{weight:700,fill:P.muted})+L(490,242,850,242,{stroke:P.faint})
      +row(270,'酒精','−100°C 以下','78°C',{fill:hg?P.muted:ALC,weight:hg?400:700})+row(304,'水銀','−39°C','357°C',{fill:hg?'#5d6670':P.muted,weight:hg?700:400});
    const msg=frozen?['水銀在 −39°C 就凝固','量不了這麼低的溫度 → 改用酒精溫度計']:boil?['超過酒精的沸點 78°C','量不了 → 改用水銀溫度計']:['在測量範圍內',`讀數 ${s.tt}°C`];
    h+=T(670,352,msg[0],{size:19,anchor:'middle',weight:700,fill:frozen||boil?P.red:P.accent})+T(670,382,msg[1],{size:17,anchor:'middle',fill:frozen||boil?P.red:P.ink});
    return {svg:h,reads:[['待測物',s.tt+'°C'],['讀數',frozen||boil?'無法測量':s.tt+'°C'],['原理','液體熱脹冷縮']],
      note:'讀數時視線要與液面<b>等高</b>，並等液柱不再移動。選溫度計要看<b>測量範圍</b>：低溫用酒精、高溫用水銀。'};},
  clinical(s){if(s.clin==='in')s.cr=Math.max(s.cr??0,s.body);
    const x=300,yb=455,neck=420,y=t=>395-(t-35)*40,inn=s.clin==='in',stale=inn&&s.cr>s.body+1e-9,top=s.cr===null?neck+12:y(s.cr);
    let h=inn?`<circle cx="${x}" cy="${yb}" r="44" fill="#f4b6a0" fill-opacity=".35"/>`+T(x-56,yb+6,`腋下 ${s.body.toFixed(1)}°C`,{size:16,anchor:'end',fill:P.red,weight:700})
      :T(x-40,yb+6,'在空氣中',{size:16,anchor:'end',fill:P.muted});
    h+=glassTherm(x,yb,100,top,{c:HG,br:14,w:6,neck,gap:!inn&&s.cr!==null})+thermTicks(x+11,35,42,.1,1,y,{size:18});
    h+=L(x+11,y(37),x+30,y(37),{stroke:P.red,w:2})+T(x-20,neck+5,'縮口',{size:15,anchor:'end',fill:P.muted})+L(x-18,neck,x-9,neck,{stroke:P.muted,w:1.5});
    h+=this.panel(470,70,400,330)+T(670,108,'體溫計的縮口',{size:22,anchor:'middle',weight:700});
    const zx=560,zy=230,c=HG;
    h+=`<path d="M${zx-30} 150V${zy-14}L${zx-10} ${zy}L${zx-30} ${zy+14}V310M${zx+30} 150V${zy-14}L${zx+10} ${zy}L${zx+30} ${zy+14}V310" fill="none" stroke="#8fa3a8" stroke-width="3"/>`;
    h+=s.cr===null?`<rect x="${zx-26}" y="${zy+30}" width="52" height="${310-zy-30}" fill="${c}"/>`:inn?`<path d="M${zx-26} 160V${zy-12}L${zx-9} ${zy}L${zx-26} ${zy+12}V310H${zx+26}V${zy+12}L${zx+9} ${zy}L${zx+26} ${zy-12}V160Z" fill="${c}"/>`
      :`<path d="M${zx-26} 160V${zy-24}H${zx+26}V160Z" fill="${c}"/><rect x="${zx-26}" y="${zy+22}" width="52" height="${310-zy-22}" fill="${c}"/>`;
    h+=T(zx,330,'放大的縮口',{size:15,anchor:'middle',fill:P.muted});
    h+=this.lines(612,160,stale?['體溫比讀數低：','上面那段液柱降不回來。']:inn?['體溫高：液體膨脹，','擠過縮口往上升。']:s.cr===null?['甩過了：','液體回到玻璃泡。']:['離開身體：液柱在縮口斷開，','上面那段不會降回去，','方便讀數。'],{size:16,gap:26});
    h+=T(612,262,'下次用之前要甩一甩。',{size:16,fill:P.ink,weight:700});
    if(stale)h+=T(670,365,`沒甩就量：讀數停在 ${s.cr.toFixed(1)}°C`,{size:18,anchor:'middle',weight:700,fill:P.red})+T(670,390,`不是現在的體溫 ${s.body.toFixed(1)}°C`,{size:16,anchor:'middle',fill:P.red});
    else h+=T(670,375,s.cr===null?'讀數：低於 35°C（已甩下）':`讀數：${s.cr.toFixed(1)}°C`,{size:19,anchor:'middle',weight:700,fill:P.accent});
    return {svg:h,reads:[['現在的體溫',s.body.toFixed(1)+'°C'],['體溫計讀數',s.cr===null?'低於 35°C':s.cr.toFixed(1)+'°C'],['位置',inn?'腋下':'空氣中']],
      note:'體溫計的刻度只有約 <b>35～42°C</b>，每小格 0.1°C，比一般溫度計精細。按「放進腋下」→「拿出來」，再把體溫調低、<b>不甩</b>直接量，看看讀數。'};},
  bimetal(s){const th=(s.tt-20)*.0055,x0=150,y0=240,Ls=330,n=40,ds=Ls/n;
    const pts=th=>{let x=x0,y=y0;const out=[[x,y,0]];for(let i=1;i<=n;i++){const f=th*(i-.5)/n;x+=Math.cos(f)*ds;y+=Math.sin(f)*ds;out.push([x,y,th*i/n]);}return out;};
    const P0=pts(th),off=(d)=>P0.map(([x,y,f])=>`${(x-Math.sin(f)*d).toFixed(1)},${(y+Math.cos(f)*d).toFixed(1)}`).join(' ');
    let h=`<rect x="70" y="90" width="460" height="320" rx="14" fill="${WARM(s.tt)}" fill-opacity=".14"/>`+T(300,118,`環境溫度 ${s.tt}°C`,{size:18,anchor:'middle',fill:P.muted});
    for(let t=-40;t<=120;t+=20){const p=pts((t-20)*.0055)[n];h+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="${P.muted}"/>`+T(p[0]+16,p[1]+5,t+'°',{size:13,fill:P.muted});}
    h+=`<polyline points="${off(-5)}" fill="none" stroke="#d98a4e" stroke-width="10" stroke-linecap="butt"/><polyline points="${off(5)}" fill="none" stroke="#8a949b" stroke-width="10" stroke-linecap="butt"/>`;
    h+=`<rect x="112" y="205" width="40" height="70" rx="4" fill="#5b6870"/>`;
    const tip=P0[n];h+=`<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="7" fill="${P.red}"/>`;
    h+=`<rect x="110" y="438" width="22" height="12" fill="#d98a4e"/>`+T(140,449,'銅（膨脹較多）',{size:15})+`<rect x="290" y="438" width="22" height="12" fill="#8a949b"/>`+T(320,449,'鐵（膨脹較少）',{size:15});
    h+=this.panel(560,70,310,330)+T(715,108,'金屬溫度計',{size:22,anchor:'middle',weight:700});
    h+=this.lines(582,150,['銅片和鐵片貼在一起（雙金屬片）。','受熱時銅膨脹得比鐵多，','→ 向鐵那一側（下方）彎曲；','冷卻時向銅那一側彎。','溫度變化越大，彎得越多。'],{size:16,gap:30});
    h+=T(582,320,'實際常捲成螺旋狀，',{size:16,fill:P.muted})+T(582,346,'帶動指針（烤箱溫度計）。',{size:16,fill:P.muted});
    const dir=Math.abs(s.tt-20)<1?'平直':s.tt>20?'向下（鐵那一側）':'向上（銅那一側）';
    return {svg:h,reads:[['溫度',s.tt+'°C'],['彎曲方向',dir],['原理','兩種金屬膨脹程度不同']],
      note:'假設雙金屬片在 <b>20°C</b> 時是平直的。彎曲程度有放大，方便觀察；灰點是不同溫度時尖端的位置，可以當作刻度。'};},
  digital(s){const R=10*Math.exp(3950*(1/(s.tt+273.15)-1/298.15));
    let h=`<rect x="134" y="300" width="192" height="168" fill="${WARM(s.tt)}" fill-opacity=".3"/>`+beakerPath(130,330,250,470)+T(230,492,'待測物',{size:15,anchor:'middle',fill:P.muted});
    h+=`<rect x="226" y="150" width="8" height="270" rx="3" fill="#b8c2c7"/><rect x="224" y="410" width="12" height="22" rx="4" fill="#3c4a52"/>`+T(250,428,'熱敏電阻',{size:15,fill:P.ink});
    h+=`<path d="M230 150C230 110 300 110 360 150" fill="none" stroke="#5b6870" stroke-width="3"/><rect x="340" y="120" width="170" height="120" rx="14" fill="#eef2f3" stroke="#8fa3a8" stroke-width="2"/><rect x="356" y="140" width="138" height="56" rx="6" fill="#cfdccf"/>`
      +T(425,180,s.tt.toFixed(1)+'°C',{size:28,anchor:'middle',weight:700,fill:'#1c3326'});
    h+=this.panel(560,70,310,360)+T(715,108,'電子溫度計',{size:22,anchor:'middle',weight:700});
    h+=this.lines(582,148,['探頭裡的熱敏電阻，','電阻會隨溫度改變。','電路量出電阻 → 換算成溫度。'],{size:16,gap:28});
    const X=t=>600+(t+50)/170*240,Y=r=>420-(Math.log10(r)-(-.5))/3.5*170;let d='';for(let t=-50;t<=120;t+=5)d+=(d?'L':'M')+X(t).toFixed(1)+' '+Y(10*Math.exp(3950*(1/(t+273.15)-1/298.15))).toFixed(1);
    h+=L(600,250,600,420,{stroke:P.muted})+L(600,420,845,420,{stroke:P.muted})+`<path d="${d}" fill="none" stroke="${P.blue}" stroke-width="3"/>`+`<circle cx="${X(s.tt).toFixed(1)}" cy="${Y(R).toFixed(1)}" r="6" fill="${P.red}"/>`;
    h+=T(600,242,'電阻',{size:14,anchor:'middle',fill:P.muted})+T(845,440,'溫度 →',{size:14,anchor:'end',fill:P.muted});
    return {svg:h,reads:[['待測物',s.tt+'°C'],['電阻',(R>=10?num(R,0):num(R,2))+' kΩ'],['原理','電阻隨溫度改變']],
      note:'這種熱敏電阻溫度越高、電阻越小（數值為示意）。電子體溫計就是這一類。'};},
  ir(s){const k=clamp((s.tt+50)/170,0,1);
    let h=`<rect x="100" y="170" width="170" height="170" rx="18" fill="${WARM(s.tt)}" fill-opacity=".75"/>`+T(185,262,s.tt+'°C',{size:26,anchor:'middle',weight:700,fill:'#fff'})+T(185,370,'待測物',{size:16,anchor:'middle',fill:P.muted});
    for(let j=-1;j<=1;j++){let d=`M285 ${255+j*45}`;for(let x=285;x<=470;x+=6)d+=`L${x} ${(255+j*45+Math.sin((x-285)/11)*(5+7*k)).toFixed(1)}`;h+=`<path d="${d}" fill="none" stroke="${P.red}" stroke-width="${(1.2+4.5*k).toFixed(1)}" opacity="${(.35+.6*k).toFixed(2)}"/>`;}
    h+=T(378,175,'紅外線（眼睛看不見）',{size:16,anchor:'middle',fill:P.red});
    h+=`<path d="M480 215H600Q616 215 616 231V279Q616 295 600 295H560L548 385H516L524 295H480Z" fill="#eef2f3" stroke="#8fa3a8" stroke-width="2"/><rect x="530" y="230" width="72" height="34" rx="5" fill="#cfdccf"/>`+T(566,254,num(s.tt,0)+'°',{size:20,anchor:'middle',weight:700,fill:'#1c3326'});
    h+=this.panel(640,70,230,330)+T(755,108,'紅外線溫度計',{size:21,anchor:'middle',weight:700});
    h+=this.lines(660,150,['物體都會放出紅外線，','溫度越高放出越強。','偵測紅外線的強弱，','換算成溫度。','不必接觸，量得很快：','耳溫槍、額溫槍。'],{size:16,gap:30});
    return {svg:h,reads:[['待測物',s.tt+'°C'],['紅外線',k<.35?'較弱':k<.7?'中等':'較強'],['原理','偵測紅外線強弱']],
      note:'波線的粗細只表示強弱，不是真實的波長。紅外線溫度計<b>不必接觸</b>待測物，常用在耳溫槍、額溫槍。'};},
  design(s){const V=s.bulb==='b'?2:1,A=s.bore==='thin'?1:2,p=4*V/A,y0=400,yb=452;
    let h=`<rect x="160" y="420" width="450" height="64" fill="${WARM(s.dt)}" fill-opacity=".3"/>`+beakerPath(156,614,404,486)+T(385,476,`水溫 ${s.dt}°C`,{size:16,anchor:'middle',fill:P.muted});
    [[250,2,13,10,'甲：小泡、粗管'],[520,p,V===2?19:13,A===1?5:10,`乙：${V===2?'大':'小'}泡、${A===1?'細':'粗'}管`]].forEach(([x,pp,br,w,name])=>{
      h+=glassTherm(x,yb,70,y0-s.dt*pp,{c:ALC,br,w})+thermTicks(x+w/2+7,0,40,5,pp<4?20:10,t=>y0-t*pp,{size:16});
      h+=T(x,44,name,{size:18,anchor:'middle',weight:700})+T(x-w/2-10,y0-s.dt*pp+5,`${num(s.dt*pp/2,0)} mm`,{size:14,anchor:'end',fill:ALC});});
    h+=this.panel(650,90,220,300)+T(760,128,'每升高 1°C',{size:20,anchor:'middle',weight:700});
    h+=T(670,172,'甲：液柱上升 1 mm',{size:17})+T(670,206,`乙：液柱上升 ${num(p/2,0)} mm`,{size:17,fill:ALC,weight:700});
    h+=this.lines(670,256,['玻璃泡越大（液體越多）、','管徑越細，','每 1°C 的刻度間隔越大，','越容易讀出小變化。'],{size:15,gap:27});
    return {svg:h,reads:[['水溫',s.dt+'°C'],['甲的液柱上升',num(s.dt,0)+' mm'],['乙的液柱上升',num(s.dt*p/2,0)+' mm']],
      note:'升溫相同時，玻璃泡裡液體膨脹的體積與液體的量成正比；擠進越細的管子，液柱上升越長。刻度間隔大，比較<b>靈敏</b>。'};},
  scale(s){const sys=s.sys,lo=sys==='C'?0:sys==='F'?32:s.xa,hi=sys==='C'?100:sys==='F'?212:s.xb,u=sys==='C'?'°C':sys==='F'?'°F':'°X';
    const Lc=s.mk==='ice'?4:s.mk==='boil'?24:4+s.tc/5,x=360,yb=455,y=Lc=>440-15*Lc,read=lo+(Lc-4)/20*(hi-lo);
    let h=T(450,36,'自己做一支溫度計的刻度',{size:22,anchor:'middle',weight:700});
    const fill=s.mk==='ice'?'#cfe3f2':s.mk==='boil'?WARM(100):WARM(s.tc);
    h+=`<rect x="318" y="420" width="84" height="66" fill="${fill}" fill-opacity=".45"/>`+beakerPath(314,406,404,488);
    if(s.mk==='ice')[[330,430],[372,446],[346,462],[380,470]].forEach(([a,b])=>{h+=`<rect x="${a}" y="${b}" width="15" height="13" rx="2" fill="#fff" stroke="#9cc0d9"/>`;});
    if(s.mk==='boil')[[334,470],[384,462],[350,436],[392,440],[326,446]].forEach(([a,b],i)=>{h+=`<circle cx="${a}" cy="${b}" r="${3+i%3}" fill="none" stroke="#fff" stroke-width="2"/>`;});
    h+=glassTherm(x,yb,62,y(Lc),{c:ALC,br:14,w:7});
    h+=L(300,y(0),300,y(25),{stroke:P.muted,w:1.5});for(let c=0;c<=25;c++)h+=L(300,y(c),300-(c%5?6:12),y(c),{stroke:P.muted,w:1})+(c%5?'':T(282,y(c)+6,c,{size:16,anchor:'end',fill:P.muted}));
    h+=T(290,y(25)-14,'cm',{size:13,anchor:'end',fill:P.muted});
    const mark=(Lm,v,name,c,on)=>on?L(372,y(Lm),560,y(Lm),{stroke:c,w:2,dash:true})+T(568,y(Lm)+6,`${tnum(v)}${u}　${name}（液柱 ${Lm} cm）`,{size:17,fill:c,weight:700}):'';
    h+=mark(4,lo,'冰水混合物',P.blue,true)+mark(24,hi,'沸水',P.red,s.mk!=='ice');
    if(s.mk==='test'){const N=hi-lo,cand=[1,2,5,10,20,50],minor=cand.find(c=>300/N*c>=3)||50,major=cand.find(c=>c>=minor*5&&300/N*c>=34)||100;
      for(let v=Math.ceil(lo/minor)*minor;v<=hi+1e-9;v+=minor){const yy=y(4+(v-lo)/N*20),big=Math.abs(v/major-Math.round(v/major))<1e-6;h+=L(372,yy,372+(big?14:7),yy,{stroke:P.ink,w:big?1.6:1});
        if(big&&v-lo>N*.07&&hi-v>N*.07)h+=T(392,yy+6,v,{size:16,fill:P.ink});}
      h+=L(372,y(Lc),470,y(Lc),{stroke:P.accent,w:3})+T(478,y(Lc)+6,`讀數 ${tnum(read)}${u}`,{size:19,fill:P.accent,weight:700});}
    h+=this.panel(600,150,270,190);
    const txt=s.mk==='ice'?['① 1 atm 下純水的冰水混合物，','溫度固定不變。','液柱停在 4 cm → 標上 '+tnum(lo)+u]:s.mk==='boil'?['② 1 atm 下的沸水，','溫度也固定不變。','液柱停在 24 cm → 標上 '+tnum(hi)+u]
      :[`③ 兩點之間等分成 ${tnum(hi-lo)} 格。`,`液柱 ${tnum(Lc)} cm：`,`(${tnum(Lc)} − 4) ÷ (24 − 4) × ${tnum(hi-lo)}`,`＋ ${tnum(lo)} ＝ ${tnum(read)}${u}`];
    h+=this.lines(620,190,txt,{size:16,gap:32});
    return {svg:h,reads:[['液柱長度',tnum(Lc)+' cm'],['兩個定點',`${tnum(lo)}${u}、${tnum(hi)}${u}`],['讀數',s.mk==='test'?tnum(read)+u:'（還在定點）']],
      note:'定溫標：先找兩個<b>溫度固定</b>的定點，再把中間<b>等分</b>。攝氏 0°C～100°C 分 100 格；華氏 32°F～212°F 分 180 格。溫度每升高 1 度，液柱增加的長度都一樣，所以可以用比例算讀數。'};},
  convert(s){const cols=[['C','攝氏 °C',c=>c,v=>v,5,20],['F','華氏 °F',toF,v=>(v-32)*5/9,10,50]];
    const k=(s.xb-s.xa)/100,cand=[5,10,20,25,50,100],majX=cand.find(c=>c/k*2.2>=40)||100;cols.push(['X','X 溫標 °X',c=>toX(c,s),v=>(v-s.xa)/k,majX/5,majX]);
    if(s.kel)cols.push(['K','克氏 K（延伸）',c=>c+273,v=>v-273,10,50]);
    const y=c=>440-(c+40)*2.2,gap=s.kel?185:230,x0=s.kel?150:200;let h='';
    h+=L(60,y(0),860,y(0),{stroke:P.blue,w:1,dash:'4 6',op:.6})+L(60,y(100),860,y(100),{stroke:P.red,w:1,dash:'4 6',op:.6})+T(40,y(0)+5,'冰點',{size:14,fill:P.blue})+T(40,y(100)+5,'沸點',{size:14,fill:P.red});
    h+=L(60,y(s.cc),860,y(s.cc),{stroke:P.accent,w:2.5});
    cols.forEach(([id,name,f,inv,mi,ma],i)=>{const x=x0+i*gap,a=f(-40),b=f(110);
      h+=L(x,y(-40),x,y(110),{stroke:P.ink,w:2})+T(x,82,name,{size:17,anchor:'middle',weight:700})+thermTicks(x,Math.min(a,b),Math.max(a,b),mi,ma,v=>y(inv(v)),{side:-1,size:16});
      const v=f(s.cc),txt=tnum(v)+(id==='K'?' K':'°');h+=`<rect x="${x+8}" y="${y(s.cc)-17}" width="86" height="32" rx="8" fill="#e5f3ef" stroke="${P.accent}"/>`+T(x+51,y(s.cc)+6,txt,{size:17,anchor:'middle',weight:700,fill:P.accent});});
    h+=T(450,482,`C ÷ 100 ＝ (F − 32) ÷ 180 ＝ ${s.xa<0?'(X ＋ '+(-s.xa)+')':s.xa?'(X − '+s.xa+')':'X'} ÷ ${s.xb-s.xa}`,{size:19,anchor:'middle'});
    const reads=[['攝氏',s.cc+'°C'],['華氏',tnum(toF(s.cc))+' °F'],['X 溫標',tnum(toX(s.cc,s))+' °X']];if(s.kel)reads.push(['克氏',s.cc+273+' K']);
    return {svg:h,reads,note:`三種溫標都是在冰點與沸點之間等分，只是兩點的數字和格數不同。<b>F ＝ 9/5 × C ＋ 32</b>：${s.cc}°C → ${tnum(toF(s.cc))}°F。${s.kel?'（延伸）克氏溫度 ＝ 攝氏溫度 ＋ 273，每 1 K 和 1°C 一樣大。':''}`};}},

/* ===== 5-2 熱量與熱平衡 ===== */
heat:{group:3,n:'5-2',keep:['mode'],steps:'mode',
  tasks:{define:'按「▶ 開始加熱」：加熱時間每多 1 分鐘，水溫升高幾度？再打開「比較不同水量」：水越多，升溫越快還是越慢？',
    compare:'先猜：哪一杯的溫度比較高？兩杯都冷卻到室溫 20°C 時，哪一杯放出的熱量比較多？再按「▶ 冷卻到室溫」驗證。',
    mix:'按「▶ 開始混合」（或拉動「經過時間」）：熱從哪一杯傳到哪一杯？兩杯溫度相同時，A 放出的熱和 B 吸收的熱一樣多嗎？'},
  name:'熱量與熱平衡',subtitle:'熱量是因溫度差而傳遞的能量，單位是卡（cal）。水吸收的熱量 H ＝ m × ΔT；冷熱物體接觸，熱由高溫傳到低溫，直到溫度相同。',
  q:s=>({html:examCard(HEAT_EXAM[s.mode])+qBlockHTML(HEAT_Q[s.mode])+quizHTML(s,HEAT_QUIZ)}),
  qAction(s,v){if(v==='qgo')s.play=false;quizAction(s,v,HEAT_QUIZ);},
  state:{mode:'define',m:200,t:0,cmp:false,ca:100,cta:80,cb:1000,ctb:40,cool:0,ma:100,ta:80,mb:300,tb:20,tm:0,loss:false,play:false,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['define','熱量與卡'],['compare','溫度與熱量'],['mix','熱平衡']],onChange:s=>{s.play=false;}},
    {type:'range',key:'m',label:'水的質量 m',min:100,max:500,step:50,unit:' g',show:s=>s.mode==='define'},
    {type:'range',key:'t',label:'加熱時間',min:0,max:10,step:.5,fmt:s=>tnum(s.t)+' 分鐘',show:s=>s.mode==='define'},
    playBtn('t',10,'▶ 開始加熱',{show:s=>s.mode==='define'}),
    {type:'toggle',key:'cmp',label:'比較不同水量',show:s=>s.mode==='define'},
    {type:'range',key:'ca',label:'甲杯水量',min:50,max:1000,step:50,unit:' g',show:s=>s.mode==='compare'},
    {type:'range',key:'cta',label:'甲杯水溫',min:20,max:100,step:1,unit:'°C',show:s=>s.mode==='compare'},
    {type:'range',key:'cb',label:'乙杯水量',min:50,max:1000,step:50,unit:' g',show:s=>s.mode==='compare'},
    {type:'range',key:'ctb',label:'乙杯水溫',min:20,max:100,step:1,unit:'°C',show:s=>s.mode==='compare'},
    {type:'range',key:'cool',label:'冷卻進度',min:0,max:1,step:.05,fmt:s=>s.cool>=1?'已到 20°C':Math.round(s.cool*100)+'%',show:s=>s.mode==='compare'},
    playBtn('cool',1,'▶ 冷卻到室溫',{show:s=>s.mode==='compare'}),
    {type:'buttons',label:'例子',items:[['小杯熱水、大桶溫水',s=>{s.ca=100;s.cta=80;s.cb=1000;s.ctb=40;s.cool=0;}],['同溫度、水量不同',s=>{s.ca=100;s.cta=80;s.cb=500;s.ctb=80;s.cool=0;}],['同水量、溫度不同',s=>{s.ca=300;s.cta=80;s.cb=300;s.ctb=40;s.cool=0;}]],show:s=>s.mode==='compare'},
    {type:'range',key:'ma',label:'A（內杯）水量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='mix'},
    {type:'range',key:'ta',label:'A 的初溫',min:0,max:100,step:1,unit:'°C',show:s=>s.mode==='mix'},
    {type:'range',key:'mb',label:'B（外杯）水量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='mix'},
    {type:'range',key:'tb',label:'B 的初溫',min:0,max:100,step:1,unit:'°C',show:s=>s.mode==='mix'},
    {type:'range',key:'tm',label:'經過時間',min:0,max:10,step:.1,fmt:s=>s.tm.toFixed(1)+' 分鐘',show:s=>s.mode==='mix'},
    playBtn('tm',10,'▶ 開始混合',{show:s=>s.mode==='mix'}),
    {type:'buttons',label:'例子',items:[['等量混合',s=>{s.ma=100;s.ta=80;s.mb=100;s.tb=20;s.tm=0;}],['100 g＋300 g',s=>{s.ma=100;s.ta=80;s.mb=300;s.tb=20;s.tm=0;}],['直接到熱平衡',s=>{s.tm=10;}]],show:s=>s.mode==='mix'},
    {type:'toggle',key:'loss',label:'考慮散熱（室溫 25°C）',show:s=>s.mode==='mix'}],
  tick:(s,dt)=>{const mx={t:10,tm:10,cool:1}[s.play];if(mx)playTick(s,dt,mx,s.play==='cool'?.3:1.2);},
  render(s){return s.mode==='mix'?this.mix(s):s.mode==='compare'?this.compare(s):this.define(s);},
  graph(xl,yl){const X=t=>500+t*36,Y=T=>440-T*3.3;let h='';
    for(let v=20;v<=100;v+=20)h+=L(500,Y(v),860,Y(v),{stroke:P.faint,w:1,dash:'3 5'})+T(490,Y(v)+6,v,{size:16,anchor:'end',fill:P.muted});
    for(let t=0;t<=10;t+=2)h+=L(X(t),440,X(t),446,{stroke:P.muted})+T(X(t),466,t,{size:16,anchor:'middle',fill:P.muted});
    h+=L(500,440,866,440,{stroke:P.muted,w:1.5})+L(500,440,500,96,{stroke:P.muted,w:1.5})+T(506,92,yl,{size:16,fill:P.muted})+T(860,490,xl,{size:16,anchor:'end',fill:P.muted});
    return {h,X,Y};},
  /* 計算用的時間取到 0.1 分鐘（播放時是連續的），讓熱量是整百卡、算式對得起來 */
  define(s){const R=1000,tq=Math.round(s.t*10)/10,H=Math.round(R*tq),rise=H/s.m,Tw=Math.min(100,20+rise),boil=20+rise>100,dT=Tw-20,wh=50+s.m*.32,bt=400,ap=Math.abs(dT*10-Math.round(dT*10))>1e-6;
    let h=`<rect x="125" y="${bt-wh}" width="230" height="${wh}" fill="${WARM(Tw)}" fill-opacity=".5"/>`+L(125,bt-wh,355,bt-wh,{stroke:WARM(Tw),w:3})+beakerPath(120,360,165,bt+2);
    h+=T(205,bt-wh-14,`${s.m} g 的水`,{size:18,anchor:'middle',weight:700})+T(205,bt-wh/2+12,`${tnum(Tw)}°C`,{size:28,anchor:'middle',weight:700,fill:P.red});
    h+=glassTherm(320,bt-26,140,bt-46-Tw*2.2,{c:ALC,br:10,w:5});
    h+=hotPlate(130,408,220,s.t>0);
    h+=T(240,468,'穩定熱源：每分鐘供熱 1000 cal',{size:16,anchor:'middle',fill:P.muted});
    const g=this.graph('加熱時間（分鐘）','水溫（°C）');h+=g.h;
    const line=(m,w,c,op)=>{const tEnd=Math.min(10,80*m/R);let d=`M${g.X(0)} ${g.Y(20)}L${g.X(tEnd).toFixed(1)} ${g.Y(20+R*tEnd/m).toFixed(1)}`;return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${op}"/>`;};
    if(s.cmp)[100,200,300,400,500].forEach(m=>{if(m===s.m)return;h+=line(m,2,P.muted,.55);const tEnd=Math.min(10,80*m/R);h+=T(g.X(tEnd)-4,g.Y(20+R*tEnd/m)-7,m+' g',{size:13,anchor:'end',fill:P.muted});});
    h+=line(s.m,4,P.red,1)+`<circle cx="${g.X(tq)}" cy="${g.Y(Tw).toFixed(1)}" r="7" fill="${P.red}" stroke="#fff" stroke-width="2"/>`;
    if(boil)h+=T(680,g.Y(100)-12,'100°C 沸騰（見 5-5）',{size:15,anchor:'middle',fill:P.red});
    const kc=v=>Number.isInteger(v/1000)?v/1000:(v/1000).toFixed(1);
    return {svg:h,reads:[['供給熱量 H',`${H} cal ＝ ${kc(H)} kcal`],['升高溫度 ΔT',(ap?'約 ':'')+tnum(dT)+'°C'],['水溫',tnum(Tw)+'°C']],
      note:boil?'水溫到 100°C 就會沸騰，之後吸收的熱用來讓水汽化，溫度不再上升（5-5 加熱曲線）。所以 H ＝ m × ΔT 只用在溫度改變、沒有沸騰的時候。'
        :`<b>1 卡（cal）</b>：使 1 g 的水升高 1°C 所需的熱量；1 千卡（kcal）＝ 1000 卡。<br>供熱 H ＝ 1000 × ${tnum(tq)} ＝ ${H} cal；由 <b>H ＝ m × ΔT</b>，ΔT ＝ ${H} ÷ ${s.m} ${ap?'≈':'＝'} ${tnum(dT)}°C（不計散熱與容器吸熱）`};},
  /* 溫度與熱量：兩杯水冷卻到室溫 20°C 時各放出多少熱量 */
  compare(s){const R=20,c=clamp(s.cool,0,1),done=c>=1-1e-9;
    const cups=[['甲',s.ca,s.cta,165,P.red],['乙',s.cb,s.ctb,400,P.blue]].map(([n,m,T0,x,col])=>{const Tn=T0-c*(T0-R);return {n,m,T0,x,col,Tn,Hf:m*(T0-R),Hn:m*(T0-Tn)};});
    let h=T(450,44,'溫度比較高，放出的熱量就一定比較多嗎？',{size:22,anchor:'middle',weight:700});
    cups.forEach(({n,m,T0,x,col,Tn})=>{const w=clamp(80+m*.13,100,210),wh=(6000+40*m)/w,yb=402,yt=yb-wh;
      h+=`<rect x="${(x-w/2).toFixed(1)}" y="${yt.toFixed(1)}" width="${w.toFixed(1)}" height="${wh.toFixed(1)}" fill="${WARM(Tn)}" fill-opacity=".55"/>`+L(x-w/2,yt,x+w/2,yt,{stroke:WARM(Tn),w:3})+beakerPath(x-w/2-4,x+w/2+4,yt-24,yb+2);
      if(Tn>=45)for(let i=-1;i<=1;i++)h+=`<path d="M${x+i*28} ${yt-30}q-7 -10 0 -20q7 -10 0 -20" fill="none" stroke="${P.red}" stroke-width="2" opacity="${(.2+(Tn-45)/110).toFixed(2)}"/>`;
      h+=T(x,yt+Math.min(wh/2+10,64),tnum(Tn)+'°C',{size:26,anchor:'middle',weight:700,fill:Tn>=35?P.red:P.blue});
      h+=T(x,434,`${n}：${m} g`,{size:19,anchor:'middle',weight:700,fill:col})+T(x,460,c>0?`原本 ${T0}°C`:'',{size:15,anchor:'middle',fill:P.muted});});
    h+=`<rect x="560" y="84" width="320" height="356" rx="14" fill="#fffdf8" stroke="#ddd7c9"/>`+T(720,118,'冷卻到 20°C 時放出的熱量',{size:19,anchor:'middle',weight:700});
    const mx=Math.max(1000,...cups.map(k=>k.Hf)),W=200;
    if(c<=0)h+=T(720,250,'先猜猜看：哪一杯比較多？',{size:18,anchor:'middle',fill:P.muted})+T(720,282,'再按「▶ 冷卻到室溫」',{size:16,anchor:'middle',fill:P.muted});
    else cups.forEach(({n,m,T0,col,Hf,Hn},i)=>{const y=168+i*126;
      h+=T(582,y+20,n,{size:20,weight:700,fill:col})+`<rect x="612" y="${y}" width="${W}" height="30" rx="6" fill="#f1eee6"/>`+`<rect x="612" y="${y}" width="${(W*Hn/mx).toFixed(1)}" height="30" rx="6" fill="${col}" opacity=".85"/>`;
      h+=T(612,y+58,`${num(Hn,0)} cal`,{size:18,weight:700,fill:col});
      if(done)h+=T(612,y+84,`${m} × (${T0} − 20) ＝ ${Hf} cal`,{size:15,fill:P.ink});});
    const [A,B]=cups;
    if(done){const msg=A.Hf===B.Hf?'兩杯放出的熱量一樣多':`${A.Hf>B.Hf?'甲':'乙'}放出的熱量比較多`;h+=T(720,424,msg,{size:18,anchor:'middle',weight:700,fill:P.accent});}
    const hot=A.T0===B.T0?'':`${A.T0>B.T0?'甲':'乙'}的溫度比較高`,big=A.Hf===B.Hf?'':`${A.Hf>B.Hf?'甲':'乙'}放熱比較多`;
    return {svg:h,reads:[['甲的水溫',tnum(A.Tn)+'°C'],['乙的水溫',tnum(B.Tn)+'°C'],['甲放出',num(A.Hn,0)+' cal'],['乙放出',num(B.Hn,0)+' cal']],
      note:'<b>溫度</b>是冷熱程度；<b>熱量</b>是因溫度差而傳遞的能量。冷卻時放出的熱量 <b>H ＝ m × ΔT</b>，同時取決於<b>質量</b>和<b>溫度變化</b>。'
        +(done&&hot&&big&&hot[0]!==big[0]?`<br>${hot}，但${big}：溫度高，放出的熱量不一定多。`:'')};},
  mix(s){const C=mixCurve(s),i=clamp(Math.round(s.tm/.05),0,C.length-1),[,a,b,lost]=C[i],tf=(s.ma*s.ta+s.mb*s.tb)/(s.ma+s.mb),eq=Math.abs(a-b)<.2;
    const qa=s.ma*(a-s.ta),qb=s.mb*(b-s.tb);
    let h=`<rect x="94" y="250" width="292" height="176" fill="${WARM(b)}" fill-opacity=".5"/>`+L(94,250,386,250,{stroke:WARM(b),w:3})+beakerPath(90,390,180,430);
    h+=`<rect x="170" y="225" width="140" height="185" fill="#fbfdff" fill-opacity=".6"/><rect x="172" y="262" width="136" height="146" fill="${WARM(a)}" fill-opacity=".6"/>`+L(172,262,308,262,{stroke:WARM(a),w:3})
      +`<path d="M170 222V410H310V222" fill="none" stroke="#7e8b92" stroke-width="5"/>`;
    h+=glassTherm(285,385,150,365-a*2.1,{c:ALC,br:9,w:4})+glassTherm(365,402,150,382-b*2.1,{c:ALC,br:9,w:4});
    {const ca=Math.abs(a-b)<.2?P.accent:a>b?P.red:P.blue,cb=Math.abs(a-b)<.2?P.accent:a>b?P.blue:P.red;h+=T(222,330,tnum(a)+'°C',{size:22,anchor:'middle',weight:700,fill:ca})+T(130,350,tnum(b)+'°C',{size:20,anchor:'middle',weight:700,fill:cb});}
    h+=T(240,212,`A（內杯）${s.ma} g`,{size:16,anchor:'middle',weight:700})+T(240,456,`B（外杯）${s.mb} g`,{size:16,anchor:'middle',weight:700});
    if(!eq){const out=a>b;h+=out?L(176,300,108,300,{stroke:P.red,w:4,arrow:true})+L(304,300,338,300,{stroke:P.red,w:4,arrow:true}):L(108,300,176,300,{stroke:P.red,w:4,arrow:true})+L(338,300,304,300,{stroke:P.red,w:4,arrow:true});
      h+=T(140,292,'熱',{size:15,anchor:'middle',fill:P.red,weight:700});}
    if(s.loss&&Math.abs(b-25)>.5){const o=b>25;[[86,340,50,340],[394,340,430,340]].forEach(([x1,y1,x2,y2])=>{h+=o?L(x1,y1,x2,y2,{stroke:P.muted,w:2.5,arrow:true}):L(x2,y2,x1,y1,{stroke:P.muted,w:2.5,arrow:true});});h+=T(40,322,o?'散熱':'吸熱',{size:14,fill:P.muted});}
    const g=this.graph('經過時間（分鐘）','溫度（°C）');h+=g.h;
    const path=(j,upto)=>C.slice(0,upto+1).map(([t,...v],k)=>(k?'L':'M')+g.X(t).toFixed(1)+' '+g.Y(v[j]).toFixed(1)).join('');
    h+=L(500,g.Y(tf),860,g.Y(tf),{stroke:P.accent,w:1.5,dash:true})+T(856,g.Y(tf)+(tf>s.tb&&tf<s.ta&&s.ta-tf<12?18:-8),`${s.loss?'不計散熱的':''}計算值 ${tnum(tf)}°C`,{size:13,anchor:'end',fill:P.accent});
    h+=`<path d="${path(0,C.length-1)}" fill="none" stroke="${P.red}" stroke-width="2" opacity=".25"/><path d="${path(1,C.length-1)}" fill="none" stroke="${P.blue}" stroke-width="2" opacity=".25"/>`;
    h+=`<path d="${path(0,i)}" fill="none" stroke="${P.red}" stroke-width="4"/><path d="${path(1,i)}" fill="none" stroke="${P.blue}" stroke-width="4"/>`;
    h+=`<circle cx="${g.X(C[i][0])}" cy="${g.Y(a).toFixed(1)}" r="6" fill="${P.red}"/><circle cx="${g.X(C[i][0])}" cy="${g.Y(b).toFixed(1)}" r="6" fill="${P.blue}"/>`;
    h+=T(520,120,'— A（內杯）',{size:14,fill:P.red})+T(620,120,'— B（外杯）',{size:14,fill:P.blue});
    h+=T(240,60,eq?'溫度相同：達到熱平衡':'熱由高溫傳到低溫',{size:22,anchor:'middle',weight:700,fill:eq?P.accent:P.red});
    const hot=s.ta>=s.tb?['A',s.ma,s.ta,'B',s.mb,s.tb]:['B',s.mb,s.tb,'A',s.ma,s.ta];
    return {svg:h,reads:[['A 溫度',tnum(a)+'°C'],['B 溫度',tnum(b)+'°C'],[qa<=0?'A 放出熱量':'A 吸收熱量',num(Math.abs(qa),0)+' cal'],[qb>=0?'B 吸收熱量':'B 放出熱量',num(Math.abs(qb),0)+' cal']],
      note:`熱由高溫傳到低溫，直到<b>溫度相同（熱平衡）</b>。不計散熱：<b>放出的熱量 ＝ 吸收的熱量</b><br>${hot[1]} × (${hot[2]} − T) ＝ ${hot[4]} × (T − ${hot[5]})　→　T ＝ ${tnum(tf)}°C`
        +(s.loss?`<br>考慮散熱：已有 ${num(Math.abs(lost),0)} cal ${lost>=0?'散到空氣中，所以溫度比計算值低':'從空氣傳進來，所以溫度比計算值高'}，之後會慢慢趨近室溫 25°C。`:'')};}}
};
/* ===== 5-3 比熱 ===== */
/* ===== 5-3 比熱 ===== */
/* 比熱（cal/g·°C）採國中課本常見數值；k：l 液體、p 粉粒、b 塊狀；bp：1 大氣壓下的沸點 */
const SPEC_R=1000;
const SPEC_S={
  water:{n:'水',s:1,k:'l',bp:100,c:[76,133,187]},
  alc:{n:'酒精',s:.58,k:'l',bp:78,c:[150,196,214]},
  ice:{n:'冰',s:.55,k:'b',c:[196,224,240]},
  x:{n:'液體 X',s:.5,k:'l',c:[156,132,204]},
  oil:{n:'沙拉油',s:.47,k:'l',c:[228,184,62]},
  al:{n:'鋁',s:.217,k:'b',c:[196,203,210]},
  glass:{n:'玻璃',s:.2,k:'b',c:[178,216,214]},
  sand:{n:'砂',s:.19,k:'p',c:[216,186,132]},
  fe:{n:'鐵',s:.113,k:'b',c:[124,132,140]},
  cu:{n:'銅',s:.093,k:'b',c:[198,124,76]},
  ag:{n:'銀',s:.056,k:'b',c:[214,216,220]},
  hg:{n:'水銀',s:.033,k:'l',c:[160,168,178]},
  pb:{n:'鉛',s:.031,k:'b',c:[112,118,132]},
  ma:{n:'金屬甲',s:.1,k:'b',c:[150,150,160]},
  mb:{n:'金屬乙',s:.2,k:'b',c:[186,170,140]}};
const SPEC_CHART=['water','alc','ice','oil','al','glass','sand','fe','cu','ag','hg','pb'];
const SPEC_M=[1,2,5,10,20,50,100,200,300,400,500];
const specS=v=>v.toFixed(3).replace(/0$/,'');
const specN=v=>String(+v.toFixed(3));
const specMix=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
const specRGB=c=>`rgb(${c.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
/* 有白邊的字：壓在圖線上也看得清楚 */
const specT=(x,y,t,o={})=>{const{size=15,fill=P.ink,anchor='start',weight=700,bg='#fffdf8'}=o;return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" paint-order="stroke" stroke="${bg}" stroke-width="4.5" stroke-linejoin="round">${t}</text>`;};
const specGrad=(id,c)=>`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${specRGB(specMix(c,[0,0,0],.3))}"/><stop offset=".28" stop-color="${specRGB(specMix(c,[255,255,255],.5))}"/><stop offset=".6" stop-color="${specRGB(c)}"/><stop offset="1" stop-color="${specRGB(specMix(c,[0,0,0],.38))}"/></linearGradient>`;
/* 液體顏色：水沿用 WARM；其他液體由本色漸漸偏紅（示意） */
const specLiqCol=(key,T,cap)=>key==='water'?WARM(T):specRGB(specMix(SPEC_S[key].c,[222,84,52],clamp((T-20)/(cap-20),0,1)*.7));
/* 燒杯（玻璃反光、杯口外翻）與杯內液體 */
const specCup=(x1,x2,yT,yb)=>`<path d="M${x1-5} ${yT}Q${x1} ${yT} ${x1} ${yT+8}V${yb-8}Q${x1} ${yb} ${x1+8} ${yb}H${x2-8}Q${x2} ${yb} ${x2} ${yb-8}V${yT+8}Q${x2} ${yT} ${x2+5} ${yT}" fill="#e6f2f4" fill-opacity=".28" stroke="#83999d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
  +`<path d="M${x1+9} ${yT+20}V${yb-24}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M${x2-9} ${yT+30}V${yb-60}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`;
const specFill=(x1,x2,top,yb,col,op=.55)=>`<path d="M${x1+2} ${top}V${yb-8}Q${x1+2} ${yb-2} ${x1+8} ${yb-2}H${x2-8}Q${x2-2} ${yb-2} ${x2-2} ${yb-8}V${top}Z" fill="${col}" fill-opacity="${op}"/>`;
const specSurface=(x1,x2,top,col)=>`<path d="M${x1+2} ${top}H${x2-2}" stroke="${col}" stroke-width="3"/><path d="M${x1+22} ${top+5}H${(x1+22+(x2-x1)*.28).toFixed(1)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/>`;
function specSand(x1,x2,top,yb,col,seed){let d=`M${x1+2} ${yb-8}V${top}`;const n=Math.round((x2-x1)/16);for(let i=1;i<=n;i++){const x=x1+2+(x2-x1-4)*i/n;d+=`L${x.toFixed(1)} ${(top+(i<n?(rnd(i+seed)-.5)*5:0)).toFixed(1)}`;}
  d+=`V${yb-8}Q${x2-2} ${yb-2} ${x2-8} ${yb-2}H${x1+8}Q${x1+2} ${yb-2} ${x1+2} ${yb-8}Z`;let h=`<path d="${d}" fill="${col}"/>`;
  const k=Math.round((yb-top)*(x2-x1)/260);for(let i=0;i<k;i++)h+=`<circle cx="${(x1+8+rnd(i*3+seed)*(x2-x1-16)).toFixed(1)}" cy="${(top+6+rnd(i*3+1+seed)*(yb-top-12)).toFixed(1)}" r="${(1+rnd(i*3+2+seed)).toFixed(1)}" fill="${i%3?'#8f7448':'#f6e7c6'}" opacity=".55"/>`;return h;}
/* 金屬塊（圓柱）：gid 漸層、glow 0~1 受熱泛紅、hx 有值時在頂面開一個插溫度計的孔 */
function specBlock(cx,yb,bw,bh,gid,glow,hx){const x=cx-bw/2,y=yb-bh,ry=Math.min(7,bw*.09);
  let h=`<path d="M${x} ${y+ry}V${yb-ry}A${bw/2} ${ry} 0 0 0 ${x+bw} ${yb-ry}V${y+ry}Z" fill="url(#${gid})" stroke="#5d676d" stroke-width="1.5"/>`;
  if(glow>0)h+=`<path d="M${x} ${y+ry}V${yb-ry}A${bw/2} ${ry} 0 0 0 ${x+bw} ${yb-ry}V${y+ry}Z" fill="#ff4a1c" opacity="${(glow*.38).toFixed(2)}"/>`;
  h+=`<ellipse cx="${cx}" cy="${y+ry}" rx="${bw/2}" ry="${ry}" fill="url(#${gid})" stroke="#5d676d" stroke-width="1.5"/><ellipse cx="${cx}" cy="${y+ry}" rx="${bw/2}" ry="${ry}" fill="#fff" opacity=".28"/>`;
  if(hx!==undefined)h+=`<ellipse cx="${hx}" cy="${y+ry}" rx="10" ry="${Math.min(4,ry*.6)}" fill="#39434a"/>`;return h;}
/* 酒精燈與三腳架 */
function specBurner(cx,on,ph,id){let h=L(cx-84,382,cx-97,462,{stroke:'#7d8a90',w:4})+L(cx+84,382,cx+97,462,{stroke:'#7d8a90',w:4})+`<rect x="${cx-94}" y="376" width="188" height="6" rx="3" fill="#6f7c83"/><path d="M${cx-70} 379H${cx+70}" stroke="#aab4b9" stroke-width="2" stroke-dasharray="3 3"/>`;
  h+=`<path d="M${cx-36} 462Q${cx-44} 438 ${cx-13} 431H${cx+13}Q${cx+44} 438 ${cx+36} 462Z" fill="#eaf4f6" stroke="#8fa3a8" stroke-width="2"/><path d="M${cx-34} 460Q${cx-38} 448 ${cx-27} 443H${cx+27}Q${cx+38} 448 ${cx+34} 460Z" fill="#8fc1e4" opacity=".7"/><rect x="${cx-9}" y="423" width="18" height="9" rx="2" fill="#a9825a"/><rect x="${cx-2.5}" y="415" width="5" height="9" rx="1.5" fill="#f2efe6" stroke="#b7b0a0"/>`;
  if(on){const w=Math.sin(ph*9+id*2)*2.2,t=Math.sin(ph*13+id)*2.5;
    h+=`<path d="M${cx} ${(387+t).toFixed(1)}C${(cx+14+w).toFixed(1)} 400 ${cx+11} 414 ${cx} 420C${cx-11} 414 ${(cx-14+w).toFixed(1)} 400 ${cx} ${(387+t).toFixed(1)}Z" fill="#ff8f3a" opacity=".88"/><path d="M${cx} ${(398+t*.6).toFixed(1)}C${(cx+7+w*.5).toFixed(1)} 406 ${cx+6} 415 ${cx} 419C${cx-6} 415 ${(cx-7+w*.5).toFixed(1)} 406 ${cx} ${(398+t*.6).toFixed(1)}Z" fill="#ffe28a"/><ellipse cx="${cx}" cy="417" rx="4" ry="3" fill="#7fb4ff" opacity=".8"/>`;}
  return h;}
/* 座標軸：t 由 ta 到 tm、溫度 Ta 到 Tb */
function specAxes(o){const{x0,x1,y0,y1,ta=0,tm,Ta,Tb,dx,dy,xl,yl,xf=v=>v}=o,X=t=>x0+(t-ta)/(tm-ta)*(x1-x0),Y=v=>y0-(v-Ta)/(Tb-Ta)*(y0-y1);let h='';
  for(let v=Ta;v<=Tb+1e-9;v+=dy)h+=(v>Ta?L(x0,Y(v),x1,Y(v),{stroke:P.faint,w:1,dash:'3 5'}):'')+T(x0-9,Y(v)+5,v,{size:15,anchor:'end',fill:P.muted});
  for(let t=ta;t<=tm+1e-9;t+=dx)h+=L(X(t),y0,X(t),y0+6,{stroke:P.muted,w:1.5})+T(X(t),y0+24,xf(t),{size:15,anchor:'middle',fill:P.muted});
  h+=L(x0,y0,x1+6,y0,{stroke:P.muted,w:1.5})+L(x0,y0,x0,y1-10,{stroke:P.muted,w:1.5})+T(x0+7,y1-12,yl,{size:15,fill:P.muted})+T(x1+6,y0+46,xl,{size:15,anchor:'end',fill:P.muted});
  return {h,X,Y};}
const specHM=h=>{const m=Math.round(h*60)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
const specLand=h=>26.2+9*Math.cos(2*Math.PI*(h-13)/24),specSea=h=>26+1.5*Math.cos(2*Math.PI*(h-15)/24);
/* 加熱：同一熱源每分鐘 1000 cal，初溫 20°C；到沸點或上限 cap 就不再畫 */
function specHeat(key,m,t,top){const S=SPEC_S[key],rate=SPEC_R/(m*S.s),cap=S.bp&&S.bp<top?S.bp:top,tc=(cap-20)/rate,done=t>=tc-1e-9;
  return {S,rate,cap,tc,done,boil:done&&!!S.bp&&cap===S.bp,T:done?cap:20+rate*t,ms:m*S.s};}
/* 熱平衡（進階）：金屬塊在前 0.2 分鐘放入水中，之後金屬與水的溫度以同一條衰減曲線趨近平衡溫度（快慢為示意），任何時刻放熱都等於吸熱 */
function specMixModel(s){const M=SPEC_S[s.xmet],C1=s.xm1*M.s,C2=s.xm2,Tf=(C1*s.xt1+C2*s.xt2)/(C1+C2),tau=.5+C1*C2/(C1+C2)/100,TM=8,D=.2,e8=Math.exp(-(TM-D)/tau),g=t=>t<=D?1:t>=TM?0:(Math.exp(-(t-D)/tau)-e8)/(1-e8);
  return {M,C1,C2,Tf,g,T1:t=>Tf+(s.xt1-Tf)*g(t),T2:t=>Tf+(s.xt2-Tf)*g(t)};}
const specToggle=(s,k,max)=>{if(s.play){s.play=false;s[k]=Math.round(s[k]*10)/10;return;}if(reduceMotion){s[k]=max;return;}if(s[k]>=max-1e-6)s[k]=0;s.play=true;};

const SPEC_Q={
  race:['做這個實驗時，怎樣才能確定水和沙拉油「吸收的熱量相同」？為什麼兩杯的質量也要相同？','用<b>相同的熱源</b>加熱<b>相同的時間</b>，兩杯吸收的熱量就相同（不計散熱）。升高的溫度同時受質量和物質種類影響，所以要讓<b>質量相同</b>（控制變因），只留下「物質種類」不同，升溫的差別才能說是物質造成的。結果：沙拉油升溫比水多，表示沙拉油的<b>比熱比水小</b>。'],
  define:['水的比熱為什麼剛好是 1 cal/g·°C？100 g 的鐵和 200 g 的鐵，比熱一樣嗎？','<b>1 卡</b>的定義就是「使 1 g 的水升高 1°C 所需的熱量」，所以水的比熱剛好是 <b>1 cal/g·°C</b>。比熱是<b>物質的特性</b>，和質量無關：100 g 和 200 g 的鐵，比熱都是 0.113 cal/g·°C；只是 200 g 的鐵升高同樣的溫度，需要 2 倍的熱量。'],
  graph:['同一個熱源加熱甲、乙兩物體，溫度–時間圖上甲的線比較陡。能不能說「甲的比熱比較小」？','<b>不一定</b>。線比較陡只表示甲升溫快，也就是甲的 <b>m × s 比較小</b>。要再知道質量：兩者<b>質量相同</b>時，才能說甲的比熱比較小。（按「不同物質卻重疊」：水 200 g 和液體 X 400 g 的線完全重疊，但兩者比熱不同）'],
  life:['沿海地區和內陸地區，哪裡的日夜溫差比較大？冬天用的熱水袋為什麼裝水？','<b>內陸</b>的日夜溫差大。沿海有大量的海水，水的<b>比熱大</b>，白天吸收很多熱，溫度只升高一點；夜晚放出很多熱，溫度也只降低一點，所以氣溫變化小。熱水袋裝水也是同樣的道理：水的比熱大，降低同樣的溫度能<b>放出較多的熱</b>，而且<b>降溫慢</b>，可以保暖比較久。汽車引擎用水當冷卻劑，則是因為水吸收很多熱，溫度才升高一點。'],
  mix:['熱的金屬塊放進冷水，達到熱平衡時，金屬降低的溫度和水升高的溫度一樣多嗎？','<b>通常不一樣</b>。不計散熱時相同的是<b>熱量</b>：金屬放出的熱量 ＝ 水吸收的熱量，也就是 m₁ s₁ × 金屬降低的溫度 ＝ m₂ s₂ × 水升高的溫度。金屬的比熱小，m × s 通常比水小，所以金屬溫度降很多，水只升高一點。熱平衡時兩者相同的是<b>溫度</b>。']};
const SPEC_QUIZ=[
  {q:'「鐵的比熱是 0.113 cal/g·°C」，意思是：',opts:['1 g 的鐵含有 0.113 cal 的熱量','使 1 g 的鐵升高 1°C，需要吸收 0.113 cal 的熱量','使 0.113 g 的鐵升高 1°C，需要 1 cal 的熱量','鐵每吸收 1 cal 的熱量，溫度升高 0.113°C'],ans:1,
    sol:'<b>比熱</b>：使 <b>1 g</b> 的物質溫度升高 <b>1°C</b> 所需的熱量。熱量是傳遞的能量，不能說物體「含有」多少熱量。',go:s=>{s.mode='define';s.dsub='fe';s.dmi=0;s.ddt=1;s.play=false;},goLabel:'看 1 g 的鐵升高 1°C'},
  {q:'用兩個相同的熱源，分別加熱質量相同、初溫相同的水和沙拉油，加熱時間相同（都沒有沸騰，不計散熱）。下列敘述何者正確？',opts:['水吸收的熱量較多，所以升溫較多','沙拉油吸收的熱量較多，所以升溫較多','兩者吸收的熱量相同，升高的溫度也相同','兩者吸收的熱量相同，沙拉油升高的溫度較多'],ans:3,
    sol:'熱源相同、加熱時間相同 → 吸收的<b>熱量相同</b>。由 H ＝ m × s × ΔT，H 和 m 都相同時，比熱小的升溫多。沙拉油的比熱（0.47）比水（1）小，所以<b>沙拉油升溫較多</b>。',go:s=>{s.mode='race';s.rsub='oil';s.rm1=200;s.rm2=200;s.rt=4;s.play=false;},goLabel:'用加熱實驗驗證'},
  {q:'鐵的比熱為 0.113 cal/g·°C。使 100 g 的鐵塊溫度升高 50°C，需要吸收多少熱量？',opts:['5.65 cal','56.5 cal','565 cal','5000 cal'],ans:2,
    sol:'H ＝ m × s × ΔT ＝ 100 × 0.113 × 50 ＝ <b>565 cal</b>。同質量的水升高 50°C 需要 5000 cal，是鐵的將近 9 倍。',go:s=>{s.mode='define';s.dsub='fe';s.dmi=6;s.ddt=50;s.play=false;},goLabel:'用模擬驗證'},
  {q:'某金屬塊 100 g，吸收 465 cal 的熱量後，溫度由 20°C 升高到 70°C。這個金屬的比熱是多少 cal/g·°C？',opts:['0.093','0.113','0.217','0.93'],ans:0,
    sol:'ΔT ＝ 70 − 20 ＝ 50°C。s ＝ H ÷ (m × ΔT) ＝ 465 ÷ (100 × 50) ＝ <b>0.093</b> cal/g·°C，查表可知是銅。',go:s=>{s.mode='define';s.dsub='cu';s.dmi=6;s.ddt=50;s.play=false;},goLabel:'用銅驗證'},
  {q:'用同一個穩定熱源加熱質量相同的甲、乙兩種液體。加熱 4 分鐘，甲由 20°C 升到 60°C，乙由 20°C 升到 40°C（都沒有沸騰）。甲、乙的比熱比是：',opts:['1：2','2：1','1：4','3：2'],ans:0,
    sol:'同熱源、同時間 → 吸收的熱量相同；質量也相同，所以比熱和升高的溫度成<b>反比</b>。ΔT 甲：乙 ＝ 40：20 ＝ 2：1，比熱 甲：乙 ＝ <b>1：2</b>。（模擬中 A 是液體 X、B 是水，各 200 g）',go:s=>{s.mode='graph';s.ga='x';s.gma=200;s.gb='water';s.gmb=200;s.gt=4;s.play=false;},goLabel:'看溫度–時間圖'},
  {q:'用同一個熱源加熱 200 g 的水和 400 g 的某液體，兩者的溫度–時間圖線完全重疊（都沒有沸騰）。這種液體的比熱是多少 cal/g·°C？',opts:['2','1','0.5','0.25'],ans:2,
    sol:'圖線重疊 → 相同時間升高的溫度相同 → <b>m × s 相同</b>。200 × 1 ＝ 400 × s，s ＝ <b>0.5</b> cal/g·°C。斜率只能告訴我們 m × s，要再用質量才能求比熱。',go:s=>{s.mode='graph';s.ga='water';s.gma=200;s.gb='x';s.gmb=400;s.gt=4;s.play=false;},goLabel:'看重疊的圖線'},
  {q:'用同一個熱源分別加熱 100 g 和 200 g 的水，畫出溫度–時間圖。下列何者正確？',opts:['200 g 的水圖線較陡，比熱較大','100 g 的水圖線較陡，比熱較小','100 g 的水圖線較陡，兩者比熱相同','兩條圖線重疊，比熱相同'],ans:2,
    sol:'比熱是<b>物質的特性</b>，都是水，比熱相同（1 cal/g·°C）。質量小的升溫快，所以 100 g 的圖線較陡：每分鐘升高 10°C，是 200 g（每分鐘 5°C）的 2 倍。',go:s=>{s.mode='graph';s.ga='water';s.gma=100;s.gb='water';s.gmb=200;s.gt=4;s.play=false;},goLabel:'看溫度–時間圖'},
  {q:'夏天晴朗的白天，海邊近地面的風通常怎麼吹？主要原因是什麼？',opts:['由陸地吹向海洋，因為陸地比熱大、升溫慢','由陸地吹向海洋，因為海水比熱小、升溫快','由海洋吹向陸地，因為海水比熱小、升溫快','由海洋吹向陸地，因為陸地（砂）比熱小、升溫快'],ans:3,
    sol:'砂的<b>比熱小</b>，白天受日照後升溫比海水快。陸地上方的空氣受熱上升，海面上較冷的空氣流向陸地補充，形成<b>海風</b>。夜晚陸地降溫快，風向相反，是陸風。',go:s=>{s.mode='life';s.lh=14;s.play=false;},goLabel:'看白天的海邊'},
  {q:'汽車引擎常用水當冷卻劑，主要是因為水：',opts:['比熱大，吸收很多熱量，溫度才升高一點','比熱小，容易升溫','沸點很低，容易汽化','密度比金屬小'],ans:0,
    sol:'水的<b>比熱大</b>：同質量的物質吸收相同的熱量，水升高的溫度最少，所以能帶走大量的熱而自己升溫不多。熱水袋裝水也是利用水的比熱大，降溫時能放出較多的熱。'},
  {q:'（進階）比熱 0.10 cal/g·°C 的金屬塊 200 g，加熱到 100°C 後放入 100 g、16°C 的水中。不計散熱，達到熱平衡時的溫度是：',opts:['24°C','30°C','44°C','58°C'],ans:1,
    sol:'金屬放出的熱量 ＝ 水吸收的熱量：200 × 0.10 × (100 − T) ＝ 100 × 1 × (T − 16)，2000 − 20T ＝ 100T − 1600，T ＝ <b>30°C</b>。金屬降了 70°C，水只升高 14°C。',go:s=>{s.mode='mix';s.xmet='ma';s.xm1=200;s.xt1=100;s.xm2=100;s.xt2=16;s.xt=8;s.play=false;},goLabel:'用熱平衡實驗驗證'}];

LABS.spec={group:4,n:'5-3',keep:['mode'],steps:'mode',
  tasks:{race:'按「播放」：兩邊吸收的熱量一樣多，哪一邊溫度升得快？再換右邊的物質比較看看。',
    define:'先把質量調成 1 g、升高 1°C，看需要多少熱量；再點右邊的長條換物質，比較哪一種最難升溫。',
    graph:'依序按三個例子：哪一條線比較陡？線比較陡，一定是比熱比較小嗎？',
    life:'按「播放」看一整天：陸地和海水哪一個溫度變化大？白天和夜晚，近地面的風各往哪邊吹？',
    mix:'按「播放」：金屬降了幾度？水升了幾度？兩者放出和吸收的熱量一樣多嗎？'},
  name:'比熱',subtitle:'比熱是使 1 g 的物質溫度升高 1°C 所需的熱量。H ＝ m × s × ΔT；質量相同的物質吸收相同的熱量時，比熱越小，溫度升高越多。',
  q:s=>({html:qBlockHTML(SPEC_Q[s.mode])+quizHTML(s,SPEC_QUIZ)}),
  qAction(s,v){quizAction(s,v,SPEC_QUIZ);},
  state:{mode:'race',ph:0,play:false,rsub:'oil',rm1:200,rm2:200,rt:0,dsub:'fe',dmi:6,ddt:10,ga:'water',gma:200,gb:'oil',gmb:200,gt:4,lh:14,xmet:'ma',xm1:200,xt1:100,xm2:100,xt2:16,xt:0,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'實驗',options:[['race','誰升溫快'],['define','比熱的定義'],['graph','讀溫度–時間圖'],['life','生活中的比熱'],['mix','不同物質的熱平衡（進階）']],onChange:s=>{s.play=false;}},
    {type:'seg',key:'rsub',label:'右邊的物質',options:[['oil','沙拉油'],['alc','酒精'],['sand','砂'],['al','鋁'],['fe','鐵'],['cu','銅']],show:s=>s.mode==='race'},
    {type:'range',key:'rm1',label:'水的質量',min:100,max:500,step:50,unit:' g',show:s=>s.mode==='race'},
    {type:'range',key:'rm2',label:'右邊物質的質量',min:100,max:500,step:50,unit:' g',show:s=>s.mode==='race'},
    {type:'range',key:'rt',label:'加熱時間',min:0,max:10,step:.1,fmt:s=>s.rt.toFixed(1)+' 分鐘',show:s=>s.mode==='race'},
    {type:'buttons',label:'加熱',items:[['▶ 播放／暫停',s=>specToggle(s,'rt',10)],['↺ 從頭開始',s=>{s.rt=0;s.play=false;}],['質量調成相同',s=>{s.rm2=s.rm1;}]],show:s=>s.mode==='race'},
    {type:'seg',key:'dsub',label:'物質（也可以點圖上的長條）',options:[['water','水'],['alc','酒精'],['oil','沙拉油'],['al','鋁'],['fe','鐵'],['cu','銅']],show:s=>s.mode==='define'},
    {type:'range',key:'dmi',label:'質量 m',min:0,max:SPEC_M.length-1,step:1,fmt:s=>SPEC_M[s.dmi]+' g',show:s=>s.mode==='define'},
    {type:'range',key:'ddt',label:'升高的溫度 ΔT',min:1,max:50,step:1,unit:'°C',show:s=>s.mode==='define'},
    {type:'buttons',label:'例子',items:[['1 g 升高 1°C',s=>{s.dmi=0;s.ddt=1;}],['100 g 升高 10°C',s=>{s.dmi=6;s.ddt=10;}]],show:s=>s.mode==='define'},
    {type:'buttons',label:'例子',items:[['同質量、不同物質',s=>{s.ga='water';s.gma=200;s.gb='oil';s.gmb=200;s.gt=4;}],['同物質、不同質量',s=>{s.ga='water';s.gma=100;s.gb='water';s.gmb=200;s.gt=4;}],['不同物質卻重疊',s=>{s.ga='water';s.gma=200;s.gb='x';s.gmb=400;s.gt=4;}]],show:s=>s.mode==='graph'},
    {type:'seg',key:'ga',label:'A 的物質',options:[['water','水'],['alc','酒精'],['x','液體 X'],['oil','沙拉油'],['al','鋁']],show:s=>s.mode==='graph'},
    {type:'range',key:'gma',label:'A 的質量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='graph'},
    {type:'seg',key:'gb',label:'B 的物質',options:[['water','水'],['alc','酒精'],['x','液體 X'],['oil','沙拉油'],['al','鋁']],show:s=>s.mode==='graph'},
    {type:'range',key:'gmb',label:'B 的質量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='graph'},
    {type:'range',key:'gt',label:'讀圖：加熱到第幾分鐘',min:1,max:8,step:.5,unit:' 分鐘',show:s=>s.mode==='graph'},
    {type:'range',key:'lh',label:'時刻',min:0,max:24,step:.5,fmt:s=>specHM(s.lh),show:s=>s.mode==='life'},
    {type:'buttons',label:'跳到',items:[['白天 14:00',s=>{s.lh=14;s.play=false;}],['夜晚 02:00',s=>{s.lh=2;s.play=false;}]],show:s=>s.mode==='life'},
    {type:'buttons',label:'一整天',items:[['▶ 播放／暫停',s=>{if(s.play){s.play=false;s.lh=Math.round(s.lh*2)/2;}else if(!reduceMotion)s.play=true;}]],show:s=>s.mode==='life'},
    {type:'buttons',label:'例子',items:[['甲 200 g → 水 100 g',s=>{s.xmet='ma';s.xm1=200;s.xt1=100;s.xm2=100;s.xt2=16;s.xt=0;s.play=false;}],['乙 250 g → 水 200 g',s=>{s.xmet='mb';s.xm1=250;s.xt1=100;s.xm2=200;s.xt2=20;s.xt=0;s.play=false;}],['甲 500 g → 水 450 g',s=>{s.xmet='ma';s.xm1=500;s.xt1=100;s.xm2=450;s.xt2=20;s.xt=0;s.play=false;}]],show:s=>s.mode==='mix'},
    {type:'seg',key:'xmet',label:'金屬',options:[['ma','金屬甲（比熱 0.10）'],['mb','金屬乙（比熱 0.20）'],['al','鋁'],['fe','鐵'],['cu','銅']],show:s=>s.mode==='mix'},
    {type:'range',key:'xm1',label:'金屬的質量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='mix'},
    {type:'range',key:'xt1',label:'金屬的初溫',min:50,max:100,step:1,unit:'°C',show:s=>s.mode==='mix'},
    {type:'range',key:'xm2',label:'水的質量',min:50,max:500,step:50,unit:' g',show:s=>s.mode==='mix'},
    {type:'range',key:'xt2',label:'水的初溫',min:0,max:40,step:1,unit:'°C',adv:true,show:s=>s.mode==='mix'},
    {type:'range',key:'xt',label:'經過時間',min:0,max:8,step:.1,fmt:s=>s.xt.toFixed(1)+' 分鐘',show:s=>s.mode==='mix'},
    {type:'buttons',label:'操作',items:[['▶ 播放／暫停',s=>specToggle(s,'xt',8)],['直接到熱平衡',s=>{s.xt=8;s.play=false;}],['↺ 從頭開始',s=>{s.xt=0;s.play=false;}]],show:s=>s.mode==='mix'}],
  tick(s,dt){s.ph=(s.ph+dt)%3600;if(!s.play)return;
    if(s.mode==='race'){s.rt=Math.min(10,s.rt+dt*.7);if(s.rt>=10)s.play=false;}
    else if(s.mode==='mix'){s.xt=Math.min(8,s.xt+dt*.6);if(s.xt>=8)s.play=false;}
    else if(s.mode==='life'){s.lh=(s.lh+dt*1.6)%24;}
    else s.play=false;},
  tap(s,id){if(id.startsWith('sub:')&&SPEC_S[id.slice(4)])s.dsub=id.slice(4);},
  render(s){const m=s.mode;return m==='define'?this.define(s):m==='graph'?this.graph(s):m==='life'?this.life(s):m==='mix'?this.mix(s):this.race(s);},

  /* ---- 1 誰升溫快 ---- */
  station(cx,key,m,r,ph,on,id,col){const S=r.S,x1=cx-75,x2=cx+75,yb=372,yT=190,tx=cx+28,Yt=v=>330-v*.95,over=r.done&&!r.boil;let h=specBurner(cx,on,ph,id);
    const therm=()=>{let t=glassTherm(tx,350,132,Yt(r.T),{br:8,w:4});for(let v=0;v<=200;v+=20)t+=L(tx+9,Yt(v),tx+(v%100?13:17),Yt(v),{stroke:'#7d8a90',w:v%100?1:1.8});return t;};
    if(S.k==='l'){const top=yb-(40+m*.2),lc=specLiqCol(key,r.T,r.cap);h+=specFill(x1,x2,top,yb,lc)+therm();
      if(r.boil||(on&&r.T>r.cap-12)){const n=r.boil?9:3;for(let i=0;i<n;i++){const p=(ph*(.5+rnd(i+id*20)*.5)+rnd(i+7+id*20))%1;h+=`<circle cx="${(x1+14+rnd(i+31+id*20)*110).toFixed(1)}" cy="${(yb-8-p*(yb-top-12)).toFixed(1)}" r="${(1.8+rnd(i+3)*2.6).toFixed(1)}" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="1.2" opacity="${(.9-p*.4).toFixed(2)}"/>`;}}
      h+=specSurface(x1,x2,top,lc);}
    else if(S.k==='p'){const top=yb-(34+m*.17);h+=specSand(x1,x2,top,yb,specRGB(specMix(S.c,[214,110,70],clamp((r.T-20)/180,0,1)*.45)),5)+therm();}
    else{const bh=34+m*.085;h+=specBlock(cx,yb-3,84,bh,'spec-mg',clamp((r.T-20)/180,0,1),tx)+`<clipPath id="spec-tc${id}"><rect x="${cx-80}" y="100" width="160" height="${yb-3-bh+7-100}"/></clipPath><g clip-path="url(#spec-tc${id})">${therm()}</g>`;}
    h+=specCup(x1,x2,yT,yb);
    h+=T(cx,46,`${S.n} ${m} g`,{size:20,anchor:'middle',weight:700})+T(cx,82,over?'超過 200°C':tnum(r.T)+'°C',{size:28,anchor:'middle',weight:700,fill:col})
      +T(cx,108,over?'超出溫度計的範圍':r.boil?`升高 ${tnum(r.T-20)}°C（已沸騰）`:`升高 ${tnum(r.T-20)}°C`,{size:16,anchor:'middle',fill:r.done?P.red:P.muted,weight:r.done?700:400});
    return h;},
  race(s){const t=s.rt,on=t>0||s.play,A=specHeat('water',s.rm1,t,200),B=specHeat(s.rsub,s.rm2,t,200),H=Math.round(SPEC_R*t),cA=P.blue,cB=P.red;
    let h=`<defs>${specGrad('spec-mg',B.S.c)}</defs>`+L(24,462,466,462,{stroke:P.faint,w:2});
    h+=this.station(130,'water',s.rm1,A,s.ph,on,0,cA)+this.station(350,s.rsub,s.rm2,B,s.ph,on,1,cB);
    h+=T(240,486,'兩邊熱源相同：每分鐘各供熱 1000 cal（不計散熱）',{size:15,anchor:'middle',fill:P.muted});
    const g=specAxes({x0:545,x1:865,y0:430,y1:110,tm:10,Ta:0,Tb:200,dx:2,dy:50,xl:'加熱時間（分鐘）',yl:'溫度（°C）'});h+=g.h;
    h+=L(548,46,578,46,{stroke:cA,w:4})+T(586,51,`水（比熱 1.00）`,{size:15,fill:cA,weight:700})+L(548,70,578,70,{stroke:cB,w:4})+T(586,75,`${B.S.n}（比熱 ${specS(B.S.s)}）`,{size:15,fill:cB,weight:700});
    if(t>0)h+=L(g.X(t),430,g.X(t),112,{stroke:P.muted,w:1,dash:'4 5'});
    const line=(r,c,up)=>{const te=Math.min(10,r.tc),tn=Math.min(t,te),xe=g.X(te),ye=g.Y(20+r.rate*te);
      let o=`<path d="M${g.X(0)} ${g.Y(20)}L${xe.toFixed(1)} ${ye.toFixed(1)}" stroke="${c}" stroke-width="2" opacity=".28" fill="none"/><path d="M${g.X(0)} ${g.Y(20)}L${g.X(tn).toFixed(1)} ${g.Y(20+r.rate*tn).toFixed(1)}" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
      if(r.tc<10){const txt=r.S.bp&&r.cap===r.S.bp?`${r.cap}°C 沸騰`:'超過 200°C',top=r.cap===200,right=xe<740;o+=`<circle cx="${xe.toFixed(1)}" cy="${ye.toFixed(1)}" r="4.5" fill="#fffdf8" stroke="${c}" stroke-width="2.5"/>`+(top?specT(right?xe+10:xe-14,ye+(right?20:6),txt,{size:15,fill:c,anchor:right?'start':'end'}):specT(clamp(xe,600,815),ye-14,txt,{size:15,fill:c,anchor:'middle'}));}
      return o+`<circle cx="${g.X(tn).toFixed(1)}" cy="${g.Y(20+r.rate*tn).toFixed(1)}" r="7" fill="${c}" stroke="#fff" stroke-width="2"/>`;};
    h+=line(A,cA,A.cap>=B.cap)+line(B,cB,B.cap>A.cap);
    const dA=A.T-20,dB=B.T-20,same=s.rm1===s.rm2,n=B.S.n;let note;
    if(t<=0)note=`兩邊用<b>相同的熱源</b>加熱：加熱時間相同，吸收的熱量就相同。按「播放」，比較哪一邊溫度升得快。（初溫都是 20°C，不計散熱與容器吸熱）`;
    else{note=`熱源相同、加熱時間相同 → 兩邊吸收的<b>熱量相同</b>（各 ${specN(H)} cal）。`;
      if(A.done||B.done)note+=`<br>${[A,B].filter(r=>r.done).map(r=>r.boil?`${r.S.n}到 ${r.cap}°C 就沸騰，溫度不再上升`:`${r.S.n}已超過 200°C，超出溫度計的範圍`).join('；')}，這時不能再用 H ＝ m × s × ΔT 比較。把加熱時間調短一點再比。`;
      else if(same)note+=`質量也相同時，<b>比熱小的升溫多</b>：<br>水（比熱 1）升高 ${tnum(dA)}°C；${n}（比熱 ${specS(B.S.s)}）升高 ${tnum(dB)}°C，是水的 ${num(dB/dA,1)} 倍。`;
      else note+=`<br>現在兩邊<b>質量不同</b>，不能只看升溫多少就比比熱：ΔT ＝ H ÷ (m × s)，水的 m × s ＝ ${specN(A.ms)}，${n}的 m × s ＝ ${specN(B.ms)}。想比比熱，先把質量調成相同。`;}
    return {svg:h,reads:[['加熱時間',t.toFixed(1)+' 分鐘'],['各吸收熱量 H',specN(H)+' cal'],['水升高 ΔT',tnum(dA)+'°C'+(A.boil?'（沸騰）':'')],[`${n}升高 ΔT`,B.done&&!B.boil?'超過 180°C':tnum(dB)+'°C'+(B.boil?'（沸騰）':'')]],note};},

  /* ---- 2 比熱的定義 ---- */
  define(s){const key=SPEC_S[s.dsub]?s.dsub:'fe',S=SPEC_S[key],m=SPEC_M[clamp(Math.round(s.dmi),0,SPEC_M.length-1)],dT=s.ddt,H=m*S.s*dT,HW=m*dT,f=Math.log10(m)/Math.log10(500),cx=178,yb=292;
    let h=`<defs>${specGrad('spec-mg',S.c)}</defs>`+T(30,46,`${m} g 的${S.n}，溫度升高 ${dT}°C，需要吸收多少熱量？`,{size:20,weight:700});
    const tx=S.k==='b'?cx:cx+30,y0=yb-74,yl=y0-dT*2.3,therm=glassTherm(tx,yb-24,yl-22,yl,{br:8,w:4});
    h+=L(cx-110,yb+2,cx+120,yb+2,{stroke:P.faint,w:3});
    if(S.k==='b'){const bw=46+f*64,bh=34+f*26;h+=specBlock(cx,yb,bw,bh,'spec-mg',clamp(dT/50,0,1)*.6,tx)+`<clipPath id="spec-dc"><rect x="${cx-60}" y="40" width="120" height="${yb-bh+7-40}"/></clipPath><g clip-path="url(#spec-dc)">${therm}</g>`;}
    else{const x1=cx-58,x2=cx+58,top=yb-(24+f*34);h+=(S.k==='p'?specSand(x1,x2,top,yb,specRGB(S.c),3):specFill(x1,x2,top,yb,specRGB(specMix(S.c,[222,84,52],dT/50*.5))))+therm+(S.k==='p'?'':specSurface(x1,x2,top,specRGB(specMix(S.c,[222,84,52],dT/50*.5))))+specCup(x1,x2,yb-96,yb);}
    /* 溫度計旁：原來的液面與升高的量 */
    const bx=tx+18;h+=L(tx-12,y0,bx+8,y0,{stroke:P.muted,w:1.5,dash:'3 3'})+L(bx,y0,bx,yl,{stroke:P.red,w:2.5})+L(bx-5,yl,bx+5,yl,{stroke:P.red,w:2.5})+L(bx-5,y0,bx+5,y0,{stroke:P.red,w:2.5})
      +T(bx+12,Math.min((y0+yl)/2+5,y0-8),`升高 ${dT}°C`,{size:16,fill:P.red,weight:700})+T(bx+12,y0+17,'原來的溫度',{size:14,fill:P.muted});
    /* 熱量流入 */
    [0,1,2].forEach(i=>{h+=L(28,yb-22-i*20,84,yb-22-i*20,{stroke:P.red,w:4,arrow:true});});
    h+=T(60,yb-96,'吸收熱量',{size:15,anchor:'middle',fill:P.red})+T(60,yb-74,specN(H)+' cal',{size:16,anchor:'middle',fill:P.red,weight:700});
    /* 算式 */
    h+=T(336,112,'H ＝ m × s × ΔT',{size:22,weight:700})+T(336,148,`＝ ${m} × ${specS(S.s)} × ${dT}`,{size:21})+T(336,194,`＝ ${specN(H)} cal`,{size:30,weight:700,fill:P.red})
      +T(336,236,`${S.n}的比熱 ${specS(S.s)} cal/g·°C：`,{size:15,fill:P.muted})+T(336,260,`1 g 升高 1°C 需要 ${specS(S.s)} cal`,{size:16,weight:700,fill:P.accent});
    /* 和同質量的水比較 */
    const bar=(y,w,c,lab,val)=>{let o=T(30,y-8,lab,{size:15,fill:P.ink})+`<rect x="30" y="${y}" width="430" height="24" rx="5" fill="#ece7da"/><rect x="30" y="${y}" width="${Math.max(3,w).toFixed(1)}" height="24" rx="${w<10?1.5:5}" fill="${c}"/>`;
      for(let i=1;i<10;i++)o+=L(30+i*43,y+1,30+i*43,y+23,{stroke:'#fffdf8',w:1.5,op:.8});return o+specT(Math.max(3,w)>330?450:36+Math.max(3,w),y+18,val,{size:16,fill:Math.max(3,w)>330?'#fff':P.ink,anchor:Math.max(3,w)>330?'end':'start',bg:Math.max(3,w)>330?c:'#ece7da'});};
    h+=bar(340,S.s*430,P.red,`${S.n} ${m} g 升高 ${dT}°C 需要的熱量`,specN(H)+' cal');
    if(key==='water')h+=T(30,408,'水的比熱是 1 cal/g·°C：',{size:15,fill:P.muted})+T(30,432,'1 卡就是「使 1 g 的水升高 1°C 所需的熱量」。',{size:16,weight:700,fill:P.blue})+T(30,462,'右表中，水的比熱最大，最不容易升溫，也最不容易降溫。',{size:15,fill:P.muted});
    else h+=bar(406,430,P.blue,`同質量的水 ${m} g 升高 ${dT}°C 需要的熱量`,specN(HW)+' cal')+T(30,462,`質量、升高的溫度都相同時，${S.n}需要的熱量是水的 ${specS(S.s)} 倍。`,{size:15,fill:P.muted});
    /* 比熱長條圖（可點選） */
    h+=T(562,46,'常見物質的比熱（cal/g·°C）',{size:16,weight:700});
    SPEC_CHART.forEach((k,i)=>{const C=SPEC_S[k],y=62+i*32.5,on=k===key,w=C.s*196;
      h+=`<g data-tap="sub:${k}" tabindex="0" role="button" aria-label="${C.n}" style="cursor:pointer"><rect x="558" y="${y}" width="326" height="29" rx="7" fill="${on?'#e4f1ee':'transparent'}" stroke="${on?P.accent:'transparent'}" stroke-width="1.5"/>`
        +T(616,y+20,C.n,{size:15,anchor:'end',weight:on?700:400,fill:on?P.accent:P.ink})+`<rect x="624" y="${y+6}" width="${Math.max(3,w).toFixed(1)}" height="17" rx="3" fill="${on?P.accent:k==='water'?P.blue:'#b9c2bf'}"/>`
        +T(632+Math.max(3,w),y+20,specS(C.s),{size:15,weight:on?700:400,fill:on?P.accent:P.muted})+`</g>`;});
    h+=T(721,474,'點長條可以換物質',{size:14,anchor:'middle',fill:P.muted});
    return {svg:h,reads:[['物質的比熱 s',specS(S.s)+' cal/g·°C'],['質量 m',m+' g'],['升高溫度 ΔT',dT+'°C'],['所需熱量 H',specN(H)+' cal']],
      note:`<b>比熱 s</b>：使 1 g 的物質溫度升高 1°C 所需的熱量，單位是 cal/g·°C。比熱是物質的特性，和質量多少無關。<br><b>H ＝ m × s × ΔT</b> ＝ ${m} × ${specS(S.s)} × ${dT} ＝ ${specN(H)} cal`+(key==='water'?'（水的 s ＝ 1，就是 5-2 的 H ＝ m × ΔT）':`；比熱越大，升高同樣的溫度要吸收越多熱，降溫時也放出越多熱。`)};},

  /* ---- 3 讀溫度–時間圖 ---- */
  graph(s){const TOP=120,TM=10.5,A=specHeat(s.ga,s.gma,s.gt,TOP),B=specHeat(s.gb,s.gmb,s.gt,TOP),cA=P.red,cB=P.blue;
    const g=specAxes({x0:78,x1:572,y0:440,y1:60,tm:TM,Ta:0,Tb:120,dx:1,dy:20,xl:'加熱時間（分鐘）',yl:'溫度（°C）'});let h=g.h;
    const same=Math.abs(A.ms-B.ms)<1e-9,twin=same&&A.cap===B.cap,x0=g.X(0),yS=g.Y(20);
    const end=r=>{const te=Math.min(TM,r.tc);return [g.X(te),g.Y(20+r.rate*te)];},rd=r=>{const te=Math.min(s.gt,r.tc);return {te,x:g.X(te),y:g.Y(20+r.rate*te),dT:r.rate*te,cut:te<s.gt-1e-9};};
    const line=(r,c,dash)=>{const[xe,ye]=end(r);return `<path d="M${x0} ${yS}L${xe.toFixed(1)} ${ye.toFixed(1)}" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"${dash?' stroke-dasharray="10 12"':''}/>`;};
    /* 讀圖三角形：底邊 Δt、直立邊 ΔT */
    const tri=(r,c)=>{const q=rd(r);return `<path d="M${x0} ${yS}H${q.x.toFixed(1)}V${q.y.toFixed(1)}" fill="${c}" fill-opacity=".07" stroke="${c}" stroke-width="1.6" stroke-dasharray="5 4"/>`;};
    h+=tri(A,cA)+tri(B,cB)+line(A,cA)+line(B,cB,same);
    /* 線的終點：沸騰、超出圖的上緣，或畫到右端 */
    const hiA=A.rate>=B.rate,[xa]=end(A),[xb]=end(B);
    const tag=(r,c,nm,upper,shift)=>{const[xe,ye]=end(r);
      if(r.tc>=TM)return specT(xe-4,upper?ye-12:ye+25,nm,{size:17,fill:c,anchor:'end'});
      const o=`<circle cx="${xe.toFixed(1)}" cy="${ye.toFixed(1)}" r="4.5" fill="#fffdf8" stroke="${c}" stroke-width="2.5"/>`;
      if(r.cap===TOP)return o+(xe<176?specT(xe+12+shift,ye+17,nm,{size:17,fill:c}):specT(xe+shift,ye-11,nm,{size:17,fill:c,anchor:'middle'}));
      return o+specT(clamp(xe,160,500),ye-13,`${nm}：${r.cap}°C 沸騰`,{size:15,fill:c,anchor:'middle'});};
    if(twin)h+=tag(A,P.ink,'A、B',true,0);
    else{const near=A.tc<TM&&B.tc<TM&&A.cap===TOP&&B.cap===TOP&&Math.abs(xa-xb)<24;h+=tag(A,cA,'A',hiA,0)+tag(B,cB,'B',!hiA,near?(xb>=xa?24-(xb-xa):-24-(xb-xa)):0);}
    /* 讀數：寫在 20°C 線的下方，不會壓到圖線 */
    const qa=rd(A),qb=rd(B),cut=qa.cut||qb.cut,W=cut?262:150,bx=Math.min(g.X(s.gt)+12,604-W),rl=(q,nm)=>`${nm}：ΔT ＝ ${tnum(q.dT)}°C`+(q.cut?`（到 ${tnum(q.te)} 分鐘為止）`:'');
    h+=`<circle cx="${qa.x.toFixed(1)}" cy="${qa.y.toFixed(1)}" r="7" fill="${cA}" stroke="#fff" stroke-width="2"/><circle cx="${qb.x.toFixed(1)}" cy="${qb.y.toFixed(1)}" r="${same&&!qa.cut&&!qb.cut?4:7}" fill="${cB}" stroke="#fff" stroke-width="2"/>`;
    h+=specT(bx,yS+17,`Δt ＝ ${tnum(s.gt)} 分鐘`,{size:15,fill:P.muted})+(same&&!cut?specT(bx,yS+36,rl(qa,'A、B'),{size:15,fill:P.ink}):specT(bx,yS+36,rl(qa,'A'),{size:15,fill:cA})+specT(bx,yS+55,rl(qb,'B'),{size:15,fill:cB}));
    /* 右側資料卡：由斜率求 m × s，再除以質量得比熱 */
    const card=(y,r,c,nm,mm)=>{const ex=Math.abs(r.rate*10-Math.round(r.rate*10))<1e-9;return `<rect x="606" y="${y}" width="280" height="150" rx="14" fill="#fffdf8" stroke="${c}" stroke-width="2"/><rect x="606" y="${y}" width="10" height="150" rx="5" fill="${c}"/>`
      +T(630,y+30,`${nm}：${r.S.n} ${mm} g`,{size:19,weight:700,fill:c})+T(630,y+60,ex?`每分鐘升高 ${tnum(r.rate)}°C`:`每分鐘升高約 ${r.rate.toFixed(1)}°C`,{size:16})+T(630,y+86,ex?`m × s ＝ 1000 ÷ ${tnum(r.rate)} ＝ ${specN(r.ms)}`:`m × s ＝ 1000 ÷ ${r.rate.toFixed(2)} ≈ ${specN(r.ms)}`,{size:16})
      +T(630,y+112,`比熱 s ＝ ${specN(r.ms)} ÷ ${mm}`,{size:16})+T(630,y+137,`＝ ${specS(r.S.s)} cal/g·°C`,{size:16,weight:700,fill:c});};
    h+=card(40,A,cA,'A',s.gma)+card(204,B,cB,'B',s.gmb);
    const steep=hiA?'A':'B';
    h+=T(612,386,'圖線越陡 → 升溫越快 → m × s 越小',{size:16,weight:700})+T(612,416,same?'現在兩條線重疊：m × s 相同':`現在 ${steep} 比較陡：${steep} 的 m × s 較小`,{size:16,fill:P.accent,weight:700})+T(612,446,'只看斜率，還不能比較比熱；',{size:15,fill:P.muted})+T(612,468,'要再用質量算。',{size:15,fill:P.muted});
    let tail;
    if(s.ga===s.gb)tail=s.gma===s.gmb?'兩者物質相同、質量也相同，所以圖線重疊。':`A、B 是<b>同一種物質</b>，比熱相同（${specS(A.S.s)}）；質量大的 m × s 大，升溫慢、圖線較平。`;
    else if(same)tail=`兩條線<b>重疊</b>只表示 m × s 相同（都是 ${specN(A.ms)}）。B 的質量是 A 的 ${specN(s.gmb/s.gma)} 倍，所以 B 的比熱是 A 的 ${specN(s.gma/s.gmb)} 倍，兩者比熱並不相同。`;
    else if(s.gma===s.gmb)tail=`兩者<b>質量相同</b>，所以比較陡的 ${steep}（${(hiA?A:B).S.n}）比熱較小。`;
    else tail=`兩者質量不同，<b>不能只看斜率比比熱</b>：先由斜率求出 m × s，再除以質量。A 的比熱 ${specS(A.S.s)}，B 的比熱 ${specS(B.S.s)}。`;
    const rr=r=>(Math.abs(r.rate*10-Math.round(r.rate*10))<1e-9?'':'約 ')+tnum(r.rate)+'°C';
    return {svg:h,reads:[['A 每分鐘升高',rr(A)],['B 每分鐘升高',rr(B)],['A 的 m × s',specN(A.ms)+' cal/°C'],['B 的 m × s',specN(B.ms)+' cal/°C']],
      note:`同一個熱源每分鐘供熱 1000 cal：每分鐘升高的溫度（圖線的斜率 ΔT ÷ Δt）＝ 1000 ÷ (m × s)。<b>圖線越陡，m × s 越小</b>。<br>${tail}`};},

  /* ---- 4 生活中的比熱：海風與陸風 ---- */
  life(s){const hr=s.lh%24,TL=specLand(hr),TS=specSea(hr),el=-Math.cos(2*Math.PI*hr/24),d=clamp((el+.12)/.3,0,1),nt=1-d,dusk=clamp(1-Math.abs(el)/.3,0,1)*.6,HY=300,ph=s.ph;
    const top=specMix([20,30,62],[118,180,232],d),bot=specMix(specMix([46,62,104],[208,234,247],d),[247,180,122],dusk),day=hr>=6&&hr<18,ink=d>.5?'#1f4257':'#e6f0fb',halo=d>.5?'#e9f5fb':'#1c2a4c';
    const landC=specMix([228,202,150],[74,78,98],nt*.72),seaC=specMix([78,150,200],[26,44,84],nt*.75);
    let h=`<defs><linearGradient id="spec-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${specRGB(top)}"/><stop offset="1" stop-color="${specRGB(bot)}"/></linearGradient><linearGradient id="spec-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${specRGB(specMix(seaC,[255,255,255],.18))}"/><stop offset="1" stop-color="${specRGB(specMix(seaC,[0,0,0],.25))}"/></linearGradient><clipPath id="spec-scene"><rect x="20" y="20" width="545" height="432" rx="14"/></clipPath></defs><g clip-path="url(#spec-scene)"><rect x="20" y="20" width="545" height="432" fill="url(#spec-sky)"/>`;
    if(nt>.1)for(let i=0;i<28;i++)h+=`<circle cx="${(30+rnd(i+50)*525).toFixed(1)}" cy="${(28+rnd(i+90)*230).toFixed(1)}" r="${(.8+rnd(i+130)*1.2).toFixed(1)}" fill="#fff" opacity="${(nt*(.5+.5*Math.sin(ph*1.5+i))*.6+nt*.3).toFixed(2)}"/>`;
    /* 太陽與月亮 */
    {const a=Math.PI*(hr-6)/12,sx=292-250*Math.cos(a),sy=HY-212*Math.sin(a);if(el>-.2)h+=`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="34" fill="#ffe9a0" opacity=".35"/><circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="22" fill="#ffd257" stroke="#ffb53d" stroke-width="2"/>`;
      const a2=Math.PI*(((hr+6)%24))/12,mx=292-250*Math.cos(a2),my=HY-212*Math.sin(a2);if(el<.2)h+=`<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="27" fill="#f4f1dc" opacity=".18"/><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="17" fill="#f4f1dc"/><circle cx="${(mx-5).toFixed(1)}" cy="${(my-4).toFixed(1)}" r="4" fill="#dcd8c0"/><circle cx="${(mx+6).toFixed(1)}" cy="${(my+5).toFixed(1)}" r="3" fill="#dcd8c0"/>`;}
    /* 雲 */
    [[120,84,1],[400,60,.8]].forEach(([x,y,k],i)=>{const cx=20+((x+ph*4*(i+1))%600)-30;h+=`<g opacity="${(.25+d*.6).toFixed(2)}" fill="${d>.5?'#ffffff':'#8c9bbd'}"><ellipse cx="${cx.toFixed(1)}" cy="${y}" rx="${34*k}" ry="${12*k}"/><ellipse cx="${(cx+22*k).toFixed(1)}" cy="${y-9*k}" rx="${22*k}" ry="${13*k}"/><ellipse cx="${(cx-20*k).toFixed(1)}" cy="${y-5*k}" rx="${18*k}" ry="${10*k}"/></g>`;});
    /* 陸地（剖面，沙灘向海裡傾斜）與海水 */
    h+=`<path d="M20 452V276C110 266 190 276 250 296C278 305 302 318 330 338C352 354 368 402 382 452Z" fill="${specRGB(landC)}"/><path d="M20 276C110 266 190 276 250 296" fill="none" stroke="${specRGB(specMix(landC,[255,255,255],.35))}" stroke-width="3"/>`;
    for(let i=0;i<46;i++){const x=28+rnd(i+200)*300,yy=290+rnd(i+260)*155,lim=x<250?276+(x-20)*.09:296+(x-250)*1.1;if(yy>lim+6&&x<330+(yy-338)*.45)h+=`<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${(1+rnd(i+300)*1.2).toFixed(1)}" fill="${specRGB(specMix(landC,[120,90,50],.35))}" opacity=".6"/>`;}
    h+=`<path d="M252 ${HY}H565V452H382C368 402 352 354 330 338C302 318 278 305 252 ${HY}Z" fill="url(#spec-sea)" opacity=".93"/>`;
    for(let k=0;k<3;k++){const y=HY+16+k*30,o=((ph*(10+k*5))%44),x0=300+k*26-o;let dd='';for(let x=x0;x<560;x+=44)if(x>270+k*30)dd+=`M${x.toFixed(1)} ${y}q11 -6 22 0`;h+=`<path d="${dd||'M0 0'}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="${(.2+d*.35).toFixed(2)}"/>`;}
    h+=`<path d="M252 ${HY}H565" stroke="${specRGB(specMix(seaC,[255,255,255],.5))}" stroke-width="2.5"/>`;
    /* 小屋、椰子樹、旗子（旗子指向下風處） */
    const dk=c=>specRGB(specMix(c,[40,46,70],nt*.6)),diff=TL-TS,wv=clamp(Math.abs(diff)/7,0,1),dir=diff>0?-1:1,calm=Math.abs(diff)<1;
    h+=`<rect x="36" y="246" width="46" height="27" fill="${dk([246,238,222])}" stroke="${dk([150,130,100])}" stroke-width="1.5"/><path d="M30 248L59 226L88 248Z" fill="${dk([200,104,74])}"/><rect x="52" y="256" width="13" height="17" fill="${nt>.5?'#ffd76a':dk([150,120,90])}"/>`;
    h+=`<path d="M112 273Q110 254 118 238" fill="none" stroke="${dk([140,104,66])}" stroke-width="5" stroke-linecap="round"/>`+[[-26,-2],[-19,-17],[4,-22],[22,-12],[26,4]].map(([dx,dy])=>`<path d="M118 238Q${118+dx*.6} ${238+dy-8} ${118+dx} ${238+dy+6}" fill="none" stroke="${dk([70,140,84])}" stroke-width="4.5" stroke-linecap="round"/>`).join('');
    {const fx=200,fy=206,len=calm?10:16+wv*26,wob=calm?0:Math.sin(ph*7)*3*wv;h+=L(fx,283,fx,fy-4,{stroke:dk([110,110,116]),w:3})+(calm?`<path d="M${fx} ${fy}L${fx+5} ${fy+22}L${fx-5} ${fy+22}Z" fill="${dk([223,124,68])}"/>`:`<path d="M${fx} ${fy}Q${fx+dir*len*.5} ${(fy+2+wob).toFixed(1)} ${fx+dir*len} ${(fy+7-wob).toFixed(1)}L${fx} ${fy+15}Z" fill="${dk([223,124,68])}"/>`);}
    /* 空氣的流動：近地面的風粗、其餘細 */
    if(!calm){const XL=150,XR=456,YT=134,YB=262,r=26,op=(.35+.65*wv).toFixed(2),off=(-(ph*46*wv)%24).toFixed(1);
      const loop=dir<0?`M${XR-r} ${YB}H${XL+r}Q${XL} ${YB} ${XL} ${YB-r}V${YT+r}Q${XL} ${YT} ${XL+r} ${YT}H${XR-r}Q${XR} ${YT} ${XR} ${YT+r}V${YB-r}Q${XR} ${YB} ${XR-r} ${YB}`:`M${XL+r} ${YB}H${XR-r}Q${XR} ${YB} ${XR} ${YB-r}V${YT+r}Q${XR} ${YT} ${XR-r} ${YT}H${XL+r}Q${XL} ${YT} ${XL} ${YT+r}V${YB-r}Q${XL} ${YB} ${XL+r} ${YB}`;
      const head=(x,y,a,z)=>`<path d="M${-z} ${-z*.8}L${z} 0L${-z} ${z*.8}Z" transform="translate(${x} ${y}) rotate(${a})" fill="${ink}"/>`,up=dir<0?XL:XR,dn=dir<0?XR:XL;
      h+=`<g opacity="${op}"><path d="${loop}" fill="none" stroke="${ink}" stroke-width="3" stroke-dasharray="14 10" stroke-dashoffset="${off}" stroke-linecap="round"/>`
        +L(XL+r+10,YB,XR-r-10,YB,{stroke:ink,w:8})+head(dir<0?XL+r+6:XR-r-6,YB,dir<0?180:0,15)+head(up,(YT+YB)/2,-90,9)+head(dn,(YT+YB)/2,90,9)+head((XL+XR)/2,YT,dir<0?0:180,9)+`</g>`;
      h+=specT(up+(dir<0?-12:12),YT+38,'較熱',{size:15,fill:ink,bg:halo,anchor:dir<0?'end':'start'})+specT(up+(dir<0?-12:12),YT+58,'上升',{size:15,fill:ink,bg:halo,anchor:dir<0?'end':'start'})
        +specT(dn+(dir<0?12:-12),YT+38,'較冷',{size:15,fill:ink,bg:halo,anchor:dir<0?'start':'end'})+specT(dn+(dir<0?12:-12),YT+58,'下沉',{size:15,fill:ink,bg:halo,anchor:dir<0?'start':'end'});}
    const wname=calm?'很弱':dir<0?'海風':'陸風';
    h+=`<rect x="${calm?188:206}" y="216" width="${calm?230:194}" height="34" rx="17" fill="#fffdf8" fill-opacity=".94" stroke="${P.accent}" stroke-width="2"/>`+T(303,239,calm?'海、陸溫度相近，風很弱':dir<0?'海風：由海吹向陸地':'陸風：由陸地吹向海',{size:17,anchor:'middle',weight:700,fill:P.accent});
    /* 溫度標籤 */
    const tag=(x,y,w,a,b,c)=>`<rect x="${x}" y="${y}" width="${w}" height="58" rx="12" fill="#fffdf8" fill-opacity=".95" stroke="${c}" stroke-width="2"/>`+T(x+w/2,y+22,a,{size:15,anchor:'middle',fill:P.ink})+T(x+w/2,y+48,b,{size:22,anchor:'middle',weight:700,fill:c});
    h+=tag(34,378,186,'陸地（砂，比熱小）',TL.toFixed(1)+'°C',P.red)+tag(394,378,158,'海水（比熱大）',TS.toFixed(1)+'°C',P.blue);
    h+=`<rect x="32" y="32" width="150" height="34" rx="17" fill="#fffdf8" fill-opacity=".94"/>`+T(107,55,`${specHM(hr)}　${day?'白天':'夜晚'}`,{size:17,anchor:'middle',weight:700})+`</g><rect x="20" y="20" width="545" height="432" rx="14" fill="none" stroke="#c9c2b2" stroke-width="1.5"/>`;
    h+=T(292,476,'海邊的剖面示意：左邊是陸地，右邊是海',{size:14,anchor:'middle',fill:P.muted});
    /* 24 小時溫度曲線 */
    const g=specAxes({x0:628,x1:868,y0:380,y1:130,tm:24,Ta:15,Tb:40,dx:6,dy:5,xl:'時刻（時）',yl:'溫度（°C）'});
    h+=`<rect x="${g.X(0)}" y="130" width="${g.X(6)-g.X(0)}" height="250" fill="#27364d" opacity=".09"/><rect x="${g.X(18)}" y="130" width="${g.X(24)-g.X(18)}" height="250" fill="#27364d" opacity=".09"/>`+g.h;
    const curve=f=>{let dd='';for(let i=0;i<=96;i++)dd+=(i?'L':'M')+g.X(i/4).toFixed(1)+' '+g.Y(f(i/4)).toFixed(1);return dd;};
    h+=`<path d="${curve(specLand)}" fill="none" stroke="${P.red}" stroke-width="3.5"/><path d="${curve(specSea)}" fill="none" stroke="${P.blue}" stroke-width="3.5"/>`+L(g.X(hr),380,g.X(hr),132,{stroke:P.ink,w:1.5,dash:'4 4'})
      +`<circle cx="${g.X(hr).toFixed(1)}" cy="${g.Y(TL).toFixed(1)}" r="6.5" fill="${P.red}" stroke="#fff" stroke-width="2"/><circle cx="${g.X(hr).toFixed(1)}" cy="${g.Y(TS).toFixed(1)}" r="6.5" fill="${P.blue}" stroke="#fff" stroke-width="2"/>`;
    h+=L(600,40,626,40,{stroke:P.red,w:4})+T(634,45,'陸地（砂）：日夜溫差 18°C',{size:15,fill:P.red,weight:700})+L(600,66,626,66,{stroke:P.blue,w:4})+T(634,71,'海水：日夜溫差 3°C',{size:15,fill:P.blue,weight:700});
    h+=T(600,452,'比熱小：升溫快，降溫也快',{size:15,fill:P.red,weight:700})+T(600,476,'比熱大：溫度變化小',{size:15,fill:P.blue,weight:700});
    return {svg:h,reads:[['時刻',specHM(hr)+(day?'（白天）':'（夜晚）')],['陸地（砂）',TL.toFixed(1)+'°C'],['海水',TS.toFixed(1)+'°C'],['近地面的風',calm?'很弱':dir<0?'海風（海 → 陸）':'陸風（陸 → 海）']],
      note:`砂的<b>比熱小</b>，白天受日照升溫快，夜晚降溫也快；水的<b>比熱大</b>，吸收或放出同樣多的熱，溫度變化小。所以沿海地區日夜溫差小，內陸大。<br>`
        +(calm?'現在陸地和海水的溫度差不多，風很弱；接下來風向會反過來。':dir<0?'現在陸地比海水熱：陸地上方的空氣受熱上升，海面上較冷的空氣流向陸地補充，形成<b>海風</b>。':'現在陸地比海水冷：海面上方的空氣較暖而上升，陸地上較冷的空氣流向海面補充，形成<b>陸風</b>。')+'（空氣的對流在 5-5 說明；溫度曲線為示意）'};},

  /* ---- 5 不同物質的熱平衡（進階） ---- */
  mix(s){const md=specMixModel(s),t=s.xt,a=md.T1(t),b=md.T2(t),eq=t>=8||Math.abs(a-b)<.05,M=md.M,q1=md.C1*(s.xt1-a),q2=md.C2*(b-s.xt2),p=clamp(t/.2,0,1),pe=p*p*(3-2*p),bh=30+s.xm1*.09,bx=292,bw=56;
    const bt=112+(420-bh-112)*pe,hw=55+s.xm2*.25+pe*(4+s.xm1*.016),wy=428-hw,wc=WARM(b);
    let h=`<defs>${specGrad('spec-mg',M.c)}</defs>`+L(24,447,492,447,{stroke:P.faint,w:2});
    h+=T(250,46,eq?'溫度相同：達到熱平衡':t>=.2?'熱由高溫的金屬傳到低溫的水':'把熱的金屬塊放進冷水',{size:22,anchor:'middle',weight:700,fill:eq?P.accent:t>=.2?P.red:P.ink});
    /* 鐵架與細線 */
    h+=`<rect x="428" y="440" width="58" height="7" rx="2" fill="#6f7c83"/>`+L(457,440,457,72,{stroke:'#7d8a90',w:5})+L(292,72,457,72,{stroke:'#7d8a90',w:5})+`<circle cx="292" cy="72" r="5" fill="#6f7c83"/>`+L(bx,76,bx,bt+4,{stroke:'#8a8172',w:1.5});
    /* 保麗龍杯（剖面） */
    h+=`<path d="M150 200H166V420Q166 428 174 428H386Q394 428 394 420V200H410V432Q410 446 396 446H164Q150 446 150 432Z" fill="#f4f0e6" stroke="#b9b2a2" stroke-width="2" stroke-linejoin="round"/>`;
    for(let i=0;i<40;i++){const side=i%3,x=side===0?153+rnd(i+400)*10:side===1?397+rnd(i+400)*10:160+rnd(i+400)*240,y=side===2?431+rnd(i+440)*12:206+rnd(i+440)*225;h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#d9d3c4"/>`;}
    h+=specBlock(bx,bt+bh,bw,bh,'spec-mg',clamp((a-20)/80,0,1));
    h+=`<path d="M166 ${wy.toFixed(1)}V420Q166 428 174 428H386Q394 428 394 420V${wy.toFixed(1)}Z" fill="${wc}" fill-opacity=".5"/>`;
    {const Yt=v=>392-v*2.8;h+=glassTherm(368,408,104,Yt(b),{br:8,w:4});for(let v=0;v<=100;v+=10)h+=L(377,Yt(v),v%50?382:386,Yt(v),{stroke:'#7d8a90',w:v%50?1:1.8});}
    h+=`<path d="M166 ${wy.toFixed(1)}H394" stroke="${wc}" stroke-width="3"/>`;
    if(pe>=1&&!eq){const cy=bt+bh/2,op=(.35+.65*md.g(t)).toFixed(2);h+=`<g opacity="${op}">`+L(bx+bw/2+4,cy,bx+bw/2+26,cy,{stroke:P.red,w:3.5,arrow:true})+L(bx,bt-4,bx,bt-26,{stroke:P.red,w:3.5,arrow:true})+`</g>`;}
    h+=specT(214,398,`水 ${s.xm2} g`,{size:16,anchor:'middle',bg:'#eef3f6'})+specT(214,422,tnum(b)+'°C',{size:22,anchor:'middle',fill:eq?P.accent:P.blue,bg:'#eef3f6'});
    h+=specBlock(78,222,34,24,'spec-mg',0)+T(78,250,`${M.n} ${s.xm1} g`,{size:16,anchor:'middle',weight:700})+T(78,272,`比熱 ${specS(M.s)}`,{size:15,anchor:'middle',fill:P.muted})+T(78,304,tnum(a)+'°C',{size:24,anchor:'middle',weight:700,fill:eq?P.accent:P.red});
    h+=T(280,474,'保麗龍杯：不計散熱與杯子吸熱',{size:14,anchor:'middle',fill:P.muted});
    /* 溫度–時間圖 */
    const g=specAxes({x0:545,x1:865,y0:430,y1:110,tm:8,Ta:0,Tb:100,dx:2,dy:20,xl:'經過時間（分鐘）',yl:'溫度（°C）'});h+=g.h;
    const path=(f,te)=>{let dd='';const n=Math.max(1,Math.round(te*20));for(let i=0;i<=n;i++){const tt=te*i/n;dd+=(i?'L':'M')+g.X(tt).toFixed(1)+' '+g.Y(f(tt)).toFixed(1);}return dd;};
    h+=L(545,g.Y(md.Tf),865,g.Y(md.Tf),{stroke:P.accent,w:1.5,dash:true});
    h+=`<path d="${path(md.T1,8)}" fill="none" stroke="${P.red}" stroke-width="2" opacity=".25"/><path d="${path(md.T2,8)}" fill="none" stroke="${P.blue}" stroke-width="2" opacity=".25"/><path d="${path(md.T1,t)}" fill="none" stroke="${P.red}" stroke-width="4" stroke-linecap="round"/><path d="${path(md.T2,t)}" fill="none" stroke="${P.blue}" stroke-width="4" stroke-linecap="round"/>`;
    h+=specT(861,g.Y(md.Tf)+(md.Tf<12?-10:21),`熱平衡 ${tnum(md.Tf)}°C`,{size:15,anchor:'end',fill:P.accent});
    h+=`<circle cx="${g.X(t).toFixed(1)}" cy="${g.Y(a).toFixed(1)}" r="6.5" fill="${P.red}" stroke="#fff" stroke-width="2"/><circle cx="${g.X(t).toFixed(1)}" cy="${g.Y(b).toFixed(1)}" r="6.5" fill="${P.blue}" stroke="#fff" stroke-width="2"/>`;
    h+=L(548,46,578,46,{stroke:P.red,w:4})+T(586,51,`${M.n}（比熱 ${specS(M.s)}）`,{size:15,fill:P.red,weight:700})+L(548,70,578,70,{stroke:P.blue,w:4})+T(586,75,'水（比熱 1.00）',{size:15,fill:P.blue,weight:700});
    return {svg:h,reads:[[`${M.n}的溫度`,tnum(a)+'°C'],['水的溫度',tnum(b)+'°C'],[`${M.n}放出熱量`,num(q1,0)+' cal'],['水吸收熱量',num(q2,0)+' cal']],
      note:`不計散熱：<b>金屬放出的熱量 ＝ 水吸收的熱量</b>，m₁ s₁ (T₁ − T) ＝ m₂ s₂ (T − T₂)<br>${s.xm1} × ${specS(M.s)} × (${s.xt1} − T) ＝ ${s.xm2} × 1 × (T − ${s.xt2})　→　T ＝ ${tnum(md.Tf)}°C`
        +`<br>到熱平衡時金屬降了 ${tnum(s.xt1-md.Tf)}°C，水升高 ${tnum(md.Tf-s.xt2)}°C。m × s 較小的一方溫度變化較大（${M.n} ${specN(md.C1)}、水 ${specN(md.C2)}）。圖中降溫的快慢為示意。`};}
};

/* ===== 5-4 熱對物質的影響 ===== */
/* ---------- 5-4 熱對物質的影響：熱脹冷縮、水的特殊性質、加熱曲線、三態變化、吸熱與放熱的變化 ---------- */
const PHASE_f=v=>+v.toFixed(1);
const PHASE_lerp=(a,b,t)=>a+(b-a)*t;
const PHASE_ease=t=>t*t*(3-2*t);
const PHASE_rgb=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*clamp(t,0,1))).join(',')})`;
const PHASE_tri=(u,W)=>{u=((u%(2*W))+2*W)%(2*W);return u<W?u:2*W-u;};
/* 水的密度（g/cm³，0～100°C 的近似式）：4°C 最大 */
const PHASE_RHO=t=>1-(t-3.98)**2*(t+283)/(503570*(t+67.26));
const PHASE_sg=(v,d=1)=>(v>=0?'＋':'−')+Math.abs(v).toFixed(d);
const PHASE_mn=v=>String(v).replace('-','−');
const PHASE_DEFS=`<defs><radialGradient id="ph-ball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6f8fa"/><stop offset=".45" stop-color="#aab4bd"/><stop offset="1" stop-color="#5d6871"/></radialGradient>`
  +`<linearGradient id="ph-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dde3e8"/><stop offset=".5" stop-color="#9aa5ae"/><stop offset="1" stop-color="#6c7780"/></linearGradient>`
  +`<linearGradient id="ph-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a98e6"/><stop offset=".3" stop-color="#ffc35a"/><stop offset="1" stop-color="#ff6a3d" stop-opacity=".9"/></linearGradient>`
  +`<linearGradient id="ph-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e3f1f8"/><stop offset="1" stop-color="#c3deec"/></linearGradient>`
  +`<linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbe9f3"/><stop offset="1" stop-color="#f3f7f8"/></linearGradient>`
  +`<linearGradient id="ph-co" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgb(59,127,196)"/><stop offset="1" stop-color="rgb(232,140,175)"/></linearGradient>`
  +`<radialGradient id="ph-balloon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd0a8"/><stop offset=".5" stop-color="#f08a4b"/><stop offset="1" stop-color="#c9602a"/></radialGradient>`
  +`<clipPath id="ph-lake"><path d="M60 160H560L512 445H108Z"/></clipPath></defs>`;
const PHASE_TW=(x,y,s,o={})=>{const{size=15,fill=P.ink,anchor='start',weight=400}=o;return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" paint-order="stroke" stroke="#fff" stroke-opacity=".85" stroke-width="4" stroke-linejoin="round">${s}</text>`;};
const PHASE_panel=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${o.fill||'#fffdf8'}" stroke="${o.stroke||'#ddd7c9'}" stroke-width="${o.sw||1.5}"/>`;
const PHASE_pill=(x,y,t,c,o={})=>{const{w=64,h=28,size=16,on=true}=o;return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${on?c:'#fffdf8'}" stroke="${c}" stroke-width="2"/>`+T(x,y+size*.36,t,{size,fill:on?'#fff':c,anchor:'middle',weight:700});};
function PHASE_flame(x,y,h,ck,i=0){const k=1+.07*Math.sin(ck*9+i*2),w=h*.3,hh=h*k,sx=2.2*Math.sin(ck*6+i),f=PHASE_f;
  const d=(w,hh)=>`M${f(x-w)} ${y}C${f(x-w*1.35)} ${f(y-hh*.45)} ${f(x-w*.25+sx)} ${f(y-hh*.7)} ${f(x+sx)} ${f(y-hh)}C${f(x+w*.25+sx)} ${f(y-hh*.7)} ${f(x+w*1.35)} ${f(y-hh*.45)} ${f(x+w)} ${y}Z`;
  return `<path d="${d(w,hh)}" fill="url(#ph-flame)"/><path d="${d(w*.5,hh*.5)}" fill="#fff3c4" fill-opacity=".85"/>`;}
/* 酒精燈：yb 是底部，火焰頂端約在 yb − 66 − h */
function PHASE_lamp(x,yb,ck,h=58){return `<path d="M${x-36} ${yb}Q${x-48} ${yb-30} ${x-14} ${yb-52}H${x+14}Q${x+48} ${yb-30} ${x+36} ${yb}Z" fill="#eef6f8" stroke="#83999d" stroke-width="2.5" stroke-linejoin="round"/>`
  +`<path d="M${x-35} ${yb-3}Q${x-41} ${yb-20} ${x-29} ${yb-32}H${x+29}Q${x+41} ${yb-20} ${x+35} ${yb-3}Z" fill="#9cc7e8" fill-opacity=".6"/>`
  +`<rect x="${x-12}" y="${yb-63}" width="24" height="13" rx="3" fill="url(#ph-metal)" stroke="#6c7780" stroke-width="1.5"/><rect x="${x-3}" y="${yb-71}" width="6" height="9" fill="#f3efe2" stroke="#b8b09a"/>`+PHASE_flame(x,yb-67,h,ck);}
/* 加熱板／冷卻板 */
function PHASE_plate(x1,x2,y,mode){const c=mode==='heat'?'#ff7b4a':mode==='cool'?'#8fd0ff':'#7c8a92';let h=`<rect x="${x1}" y="${y}" width="${x2-x1}" height="26" rx="6" fill="${mode==='cool'?'#3d5f7d':'#4a5860'}"/>`;
  const n=Math.floor((x2-x1-30)/36);for(let i=0;i<n;i++){const x=x1+(x2-x1-n*36)/2+i*36+8;h+=`<path d="M${x} ${y+9}q10 10 20 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;}return h;}
const PHASE_flaskD=(cx,cy,r,nw,top)=>{const yj=PHASE_f(cy-Math.sqrt(r*r-nw*nw));return `M${cx-nw} ${top}V${yj}A${r} ${r} 0 1 0 ${cx+nw} ${yj}V${top}`;};
const PHASE_flask=(cx,cy,r,nw,top)=>`<path d="${PHASE_flaskD(cx,cy,r,nw,top)}" fill="none" stroke="#83999d" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M${cx-r*.72} ${cy-r*.2}A${r*.76} ${r*.76} 0 0 1 ${cx-r*.3} ${cy-r*.68}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
const PHASE_dots=(pts,r,c)=>pts.map(([x,y])=>`<circle cx="${PHASE_f(x)}" cy="${PHASE_f(y)}" r="${r}" fill="${c}" stroke="#16323f" stroke-opacity=".4"/>`).join('');
/* 粒子位置：kind = s 固態（整齊排列、原處振動）、l 液態（靠得近、沿著環形路線滑動）、g 氣態（距離遠、到處飛） */
function PHASE_pos(kind,i,ph,b,o={}){const r=o.r||6;let x,y;
  if(kind==='s'){const C=o.cols||6,a=o.a||20,amp=o.amp===undefined?1.6:o.amp;
    x=b.x+b.w/2+(i%C-(C-1)/2)*a+amp*Math.sin(ph*9+i*2.4);y=b.y+b.h-r-4-Math.floor(i/C)*a+amp*Math.cos(ph*8.3+i*1.7);}
  else if(kind==='l'){const C=o.lcols||6,sp=o.sp||22,lp=Math.floor(i/(2*C)),q=(((i%(2*C))+ph*.45*(lp%2?-1:1))%(2*C)+2*C)%(2*C);let c,rw;
    if(q<C-1){c=q;rw=0;}else if(q<C){c=C-1;rw=q-(C-1);}else if(q<2*C-1){c=C-1-(q-C);rw=1;}else{c=0;rw=1-(q-(2*C-1));}
    x=b.x+b.w/2+(c-(C-1)/2)*sp+2.5*Math.sin(ph*2.1+i*1.9);y=b.y+b.h-r-5-(lp*2+rw)*(sp-2)+2.5*Math.cos(ph*1.7+i*2.3);}
  else{const W=b.w-2*r-4,H=b.h-2*r-4;
    x=b.x+r+2+PHASE_tri(rnd(i+11)*W*2+ph*(26+rnd(i+21)*30)*(i%2?1:-1),W);y=b.y+r+2+PHASE_tri(rnd(i+31)*H*2+ph*(22+rnd(i+41)*30),H);}
  return [clamp(x,b.x+r+1,b.x+b.w-r-1),clamp(y,b.y+r+1,b.y+b.h-r-1)];}
/* 加熱曲線的物質：比熱 cal/g·°C；lf 熔化熱、lv 汽化熱（cal/g，延伸，只用來決定平台長短）；bv 畫到汽化多少熱量為止 */
const PHASE_SUB={
  water:{name:'水',solid:'冰',liq:'水',gas:'水蒸氣',sn:'冰',ln:'水',drop:'小水滴',t0:-20,mp:0,bp:100,cs:.5,cl:1,lf:80,lv:540,bv:60,ymin:-40,ymax:120,ys:20},
  alc:{name:'酒精',solid:'固態酒精',liq:'液態酒精',gas:'酒精蒸氣',sn:'固體',ln:'液體',drop:'小液滴',t0:-130,mp:-114,bp:78,cs:.5,cl:.58,lf:26,lv:204,bv:60,ymin:-140,ymax:100,ys:40},
  nap:{name:'萘',solid:'固態萘',liq:'液態萘',gas:'萘蒸氣',sn:'固體',ln:'液體',drop:'小顆粒',t0:20,mp:80,bp:218,cs:.31,cl:.41,lf:35,lv:81,bv:30,ymin:0,ymax:240,ys:40}};
const PHASE_seg=S=>{const a=S.cs*(S.mp-S.t0),b=a+S.lf,c=b+S.cl*(S.bp-S.mp);return [a,b,c,c+S.bv];};
function PHASE_at(S,h){const H=PHASE_seg(S);h=clamp(h,0,H[3]);
  if(h<H[0])return{k:0,T:S.t0+h/S.cs,f:0};if(h<H[1])return{k:1,T:S.mp,f:(h-H[0])/S.lf};if(h<H[2])return{k:2,T:S.mp+(h-H[1])/S.cl,f:0};return{k:3,T:S.bp,f:(h-H[2])/S.lv};}
const PHASE_tmax=s=>PHASE_seg(PHASE_SUB[s.sub])[3]*s.cm/1000;
const PHASE_AR={melt:['熔化','S','L',1,'粒子吸收熱，離開固定位置，可以到處移動',['冰塊在室溫下熔化成水','蠟燭點燃後，蠟熔化成蠟油']],
  freeze:['凝固','L','S',0,'粒子放出熱，回到固定位置，排列整齊',['水在冷凍庫裡結成冰','蠟油冷卻後凝固']],
  vap:['汽化','L','G',1,'粒子吸收熱，彼此遠離，自由運動',['晒衣服：水慢慢蒸發','水燒開：沸騰','汗水蒸發吸熱，所以覺得涼']],
  cond:['凝結','G','L',0,'粒子放出熱，互相靠近，聚成液體',['冷飲杯外壁的小水滴、露','燒開水的「白煙」是小水滴','（水蒸氣本身看不見）']],
  sub:['昇華','S','G',1,'粒子吸收熱，直接離開固定位置而遠離',['乾冰直接變成二氧化碳氣體','衣櫃裡的樟腦丸越放越小']],
  dep:['凝華','G','S',0,'粒子放出熱，直接排列成固體',['寒冷清晨葉面上的霜','冷凍庫內壁結的霜']]};
const PHASE_NODE={S:[96,396,'固態','s'],L:[444,396,'液態','l'],G:[270,112,'氣態','g']};
const PHASE_Q={
  expand:['鋪鐵軌時，兩段鐵軌之間為什麼要留一小段空隙？夏天和冬天，哪個時候空隙比較大？','鐵軌受熱會<b>膨脹</b>變長。留空隙（伸縮縫）是讓鐵軌在夏天有伸長的空間，才不會互相擠壓而彎曲變形。<b>冬天</b>鐵軌遇冷收縮，空隙比較<b>大</b>；夏天空隙比較小。橋樑的伸縮縫、電線夏天比較鬆，也是同樣的道理。'],
  water4:['寒冷地區的湖面結了厚厚的冰，湖裡的魚為什麼還能活？','水在 <b>4°C 時密度最大</b>，會沉到湖底；0～4°C 的水密度較小，留在上層，所以湖是<b>從水面開始結冰</b>。冰的密度比水小，浮在水面上，還能隔開冷空氣，湖底的水可以維持在約 <b>4°C</b>，魚就能在湖底過冬。'],
  curve:['冰熔化的過程一直在吸熱，溫度卻停在 0°C。吸收的熱到哪裡去了？','熔化時吸收的熱用來<b>改變狀態</b>（讓粒子離開固定的位置），不是用來升高溫度，所以冰完全熔化以前，冰水混合物的溫度一直是 <b>0°C</b>。沸騰也一樣：1 大氣壓下，純水沸騰時溫度維持 <b>100°C</b>，火開得再大也不會更高，只是汽化得比較快。'],
  states:['燒開水時壺嘴冒出的「白煙」是水蒸氣嗎？','<b>不是</b>。水蒸氣是氣體，<b>看不見</b>。壺嘴噴出的水蒸氣遇到較冷的空氣，<b>凝結</b>成許多小水滴，我們看到的白煙是這些<b>小水滴</b>（液態）。壺嘴口附近有一小段是透明的，那裡才是水蒸氣。冰棒冒的白煙，也是空氣中的水蒸氣遇冷凝結成的小水滴。'],
  chem:['怎麼檢驗一種無色液體裡有沒有水？','可以用<b>白色的硫酸銅粉末</b>：遇到水會變成<b>藍色</b>；或用<b>藍色的氯化亞鈷試紙</b>：遇到水會變成<b>粉紅色</b>。兩種方法都是利用物質遇水後顏色改變來檢驗。']};
const PHASE_QUIZ=[
  {q:'室溫下恰好能通過鐵環的鐵球，加熱後就卡在鐵環上。主要原因是：',opts:['鐵球的粒子本身變大','鐵球粒子間的距離變大，球的體積變大','鐵球的粒子數目變多','鐵球的質量變大'],ans:1,
    sol:'受熱時粒子運動變快、<b>粒子間的距離變大</b>，所以體積膨脹。粒子本身的大小、粒子的數目和球的質量都<b>沒有改變</b>。',go:s=>{s.mode='expand';s.ek='solid';s.et=100;},goLabel:'把鐵球加熱到 100°C'},
  {q:'體積相同的鐵塊、水和空氣，都由 20°C 升高到 100°C（壓力不變）。體積增加量由大到小排列是：',opts:['鐵 ＞ 水 ＞ 空氣','水 ＞ 空氣 ＞ 鐵','水 ＞ 鐵 ＞ 空氣','空氣 ＞ 水 ＞ 鐵'],ans:3,
    sol:'升高相同的溫度時，膨脹的程度通常是<b>氣體 ＞ 液體 ＞ 固體</b>。模擬中 1000 cm³ 的空氣約增加 273 cm³，水約 42 cm³，鐵只有約 3 cm³。',go:s=>{s.mode='expand';s.ek='gas';s.et=100;},goLabel:'比較三種的體積變化'},
  {q:'把一杯水由 0°C 慢慢加熱到 10°C，水的體積怎麼變化？',opts:['一直變大','一直變小','先變小，後變大','先變大，後變小'],ans:2,
    sol:'0～4°C 之間，水溫升高體積反而<b>變小</b>；<b>4°C 時體積最小、密度最大</b>；超過 4°C 才和一般物質一樣熱脹冷縮。',go:s=>{s.mode='water4';s.wv='curve';s.wt=4;s.wd=false;},goLabel:'看 0～10°C 的體積曲線'},
  {q:'冬天湖面結冰，氣溫 −10°C。湖底的水溫最接近：',opts:['−10°C','4°C','0°C','10°C'],ans:1,
    sol:'4°C 的水<b>密度最大</b>，沉在湖底。緊貼冰層的水是 0°C，越往下越接近 <b>4°C</b>。',go:s=>{s.mode='water4';s.wv='lake';s.air=-10;},goLabel:'看冬天的湖'},
  {q:'用穩定的熱源加熱 200 g、−20°C 的冰，溫度與時間的關係圖中，第 2 分鐘到第 18 分鐘溫度維持 0°C。這段時間燒杯內是：',opts:['只有冰','只有水','冰和水同時存在','水和水蒸氣同時存在'],ans:2,
    sol:'溫度維持在<b>熔點 0°C</b> 的這一段，冰正在<b>熔化</b>，吸收的熱用來改變狀態，溫度不變，燒杯內<b>冰和水共存</b>（固液共存）。',go:s=>{s.mode='curve';s.sub='water';s.cool=false;s.cm=200;s.ct=10;s.play=false;},goLabel:'看第 10 分鐘的燒杯'},
  {q:'在 1 大氣壓下，一鍋純水已經沸騰，把火再開大繼續加熱，水溫會：',opts:['維持 100°C','繼續升高','先升高再降低','降低'],ans:0,
    sol:'沸騰時吸收的熱用來<b>汽化</b>，溫度維持在<b>沸點 100°C</b>。火開大只會讓水汽化得更快。',go:s=>{s.mode='curve';s.sub='water';s.cool=false;s.cm=200;s.ct=45;s.play=false;},goLabel:'看沸騰的那一段'},
  {q:'用每分鐘供熱 1000 cal 的熱源，把 200 g、0°C 的水加熱到 100°C，需要多久？（水的比熱 1 cal/g·°C，不計散熱）',opts:['10 分鐘','20 分鐘','100 分鐘','200 分鐘'],ans:1,
    sol:'H ＝ m × s × ΔT ＝ 200 × 1 × 100 ＝ 20000 cal。20000 ÷ 1000 ＝ <b>20 分鐘</b>。模擬中冰在第 18 分鐘完全熔化，第 38 分鐘到達 100°C，正好相差 20 分鐘。',go:s=>{s.mode='curve';s.sub='water';s.cool=false;s.cm=200;s.ct=38;s.play=false;},goLabel:'看第 18～38 分鐘這一段'},
  {q:'某純物質由固態開始加熱，溫度與時間的關係圖在 80°C 和 218°C 各有一段水平線。這種物質在 100°C 時是：',opts:['固態','固態和液態共存','液態','氣態'],ans:2,
    sol:'第一段水平線是熔化（<b>熔點 80°C</b>），第二段是沸騰（<b>沸點 218°C</b>）。100°C 介於熔點和沸點之間，所以是<b>液態</b>。純物質有固定的熔點和沸點，不同物質各不相同。',go:s=>{s.mode='curve';s.sub='nap';s.cool=false;s.cm=200;s.ct=12.25;s.play=false;},goLabel:'換成萘看看'},
  {q:'舞台上常用乾冰製造煙霧。乾冰（固態二氧化碳）在室溫下直接變成氣體，這種變化是：',opts:['熔化，吸熱','凝華，放熱','汽化，吸熱','昇華，吸熱'],ans:3,
    sol:'固態<b>直接</b>變成氣態是<b>昇華</b>，需要<b>吸熱</b>。乾冰吸熱使周圍變冷，空氣中的水蒸氣凝結成小水滴，就是看到的白霧。',go:s=>{s.mode='states';s.sv='tri';s.arrow='sub';s.a0=s.clock;},goLabel:'看昇華的粒子'},
  {q:'把水滴在白色的硫酸銅粉末上，會觀察到：',opts:['粉末變成藍色，溫度升高','粉末變成藍色，溫度降低','粉末變成粉紅色，溫度升高','粉末顏色不變，溫度降低'],ans:0,
    sol:'白色硫酸銅粉末遇水變回<b>藍色</b>，同時<b>放熱</b>，所以溫度升高。這個顏色變化可以用來檢驗水。變粉紅色的是氯化亞鈷試紙。',go:s=>{s.mode='chem';s.ck='cu';s.cs='drop';s.cp=100;},goLabel:'在白色粉末上滴水'}];

LABS.phase={group:4,n:'5-4',keep:['mode'],steps:'mode',
  tasks:{expand:'把溫度由 20°C 慢慢拉到 100°C：鐵球還過得去嗎？細管的液面和氣球怎麼變？三種的體積誰增加最多？',
    water4:'把水溫由 0°C 慢慢拉到 10°C：液面先降還是先升？最低點在幾度？再換到「冬天的湖」，看湖底的水溫。',
    curve:'按「播放」：哪兩段時間溫度沒有上升？那時候燒杯裡有哪些狀態？',
    states:'點圖上的箭頭：哪三種變化要吸熱？粒子的排列怎麼改變？',
    chem:'拉動「進行程度」：硫酸銅的顏色怎麼變？哪一個過程吸熱、哪一個放熱？'},
  name:'熱對物質的影響',subtitle:'物體受熱，體積會改變（熱脹冷縮），狀態會改變（熔化、汽化…），有時還會變成不同的物質。狀態改變時要吸熱或放熱，但溫度不變。',
  q:s=>({html:qBlockHTML(PHASE_Q[s.mode])+quizHTML(s,PHASE_QUIZ)}),
  qAction(s,v){quizAction(s,v,PHASE_QUIZ);},
  state:{mode:'expand',ek:'solid',et:20,wv:'curve',wt:0,wd:false,air:-10,wf:0,sub:'water',cm:200,ct:0,play:false,cool:false,cx:false,sv:'tri',arrow:'melt',a0:0,ck:'cu',cs:'heat',cp:0,cw:0,cl:'warm',lt:0,clock:0,ph:0,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'主題',options:[['expand','熱脹冷縮'],['water4','水的特殊性質'],['curve','加熱曲線'],['states','三態變化'],['chem','吸熱與放熱的變化']]},
    {type:'range',key:'et',label:'溫度',min:0,max:100,step:1,unit:'°C',show:s=>s.mode==='expand'},
    {type:'buttons',label:'常用溫度',items:[['0°C',s=>{s.et=0;}],['20°C',s=>{s.et=20;}],['60°C',s=>{s.et=60;}],['100°C',s=>{s.et=100;}]],show:s=>s.mode==='expand'},
    {type:'seg',key:'ek',label:'右邊看哪一種的粒子',options:[['solid','固體'],['liquid','液體'],['gas','氣體']],show:s=>s.mode==='expand'},
    {type:'seg',key:'wv',label:'內容',options:[['curve','0～10°C 的水'],['lake','冬天的湖'],['ice','水結成冰']],show:s=>s.mode==='water4'},
    {type:'range',key:'wt',label:'水溫',min:0,max:10,step:.5,unit:'°C',show:s=>s.mode==='water4'&&s.wv==='curve'},
    {type:'toggle',key:'wd',label:'縱軸改看密度',show:s=>s.mode==='water4'&&s.wv==='curve'},
    {type:'range',key:'air',label:'氣溫',min:-20,max:4,step:1,unit:'°C',fmt:s=>PHASE_mn(s.air)+'°C',show:s=>s.mode==='water4'&&s.wv==='lake'},
    {type:'range',key:'wf',label:'已結冰的比例',min:0,max:100,step:5,unit:'%',show:s=>s.mode==='water4'&&s.wv==='ice'},
    {type:'buttons',label:'時間',primary:true,items:[['▶ 播放',s=>{if(s.ct>=PHASE_tmax(s)-1e-6)s.ct=0;s.play=true;}],['⏸ 暫停',s=>{s.play=false;}],['↺ 從頭',s=>{s.ct=0;s.play=false;}]],show:s=>s.mode==='curve'},
    {type:'range',key:'ct',label:'經過時間',min:0,max:50,step:.25,fmt:s=>Math.min(s.ct,PHASE_tmax(s)).toFixed(1)+' 分鐘',show:s=>s.mode==='curve'},
    {type:'range',key:'cm',label:'質量',min:100,max:200,step:25,unit:' g',show:s=>s.mode==='curve'},
    {type:'toggle',key:'cool',label:'冷卻（反過來看）',onChange:s=>{s.ct=0;s.play=false;},show:s=>s.mode==='curve'},
    {type:'seg',key:'sub',adv:true,label:'換一種純物質',options:[['water','水'],['alc','酒精'],['nap','萘']],onChange:s=>{s.ct=0;s.play=false;},show:s=>s.mode==='curve'},
    {type:'toggle',key:'cx',adv:true,label:'（延伸）顯示熔化熱、汽化熱',show:s=>s.mode==='curve'},
    {type:'seg',key:'sv',label:'內容',options:[['tri','三態變化'],['evap','蒸發和沸騰的比較']],show:s=>s.mode==='states'},
    {type:'seg',key:'arrow',label:'變化',options:[['melt','熔化'],['freeze','凝固'],['vap','汽化'],['cond','凝結'],['sub','昇華'],['dep','凝華']],onChange:s=>{s.a0=s.clock;},show:s=>s.mode==='states'&&s.sv==='tri'},
    {type:'seg',key:'ck',label:'例子',options:[['cu','硫酸銅'],['co','氯化亞鈷試紙'],['life','生活中的例子']],show:s=>s.mode==='chem'},
    {type:'seg',key:'cs',label:'實驗',options:[['heat','加熱藍色晶體'],['drop','白色粉末滴水']],onChange:s=>{s.cp=0;},show:s=>s.mode==='chem'&&s.ck==='cu'},
    {type:'range',key:'cp',label:'進行程度',min:0,max:100,step:5,unit:'%',show:s=>s.mode==='chem'&&s.ck==='cu'},
    {type:'range',key:'cw',label:'試紙的含水程度',min:0,max:100,step:5,unit:'%',show:s=>s.mode==='chem'&&s.ck==='co'},
    {type:'seg',key:'cl',label:'例子',options:[['warm','暖暖包'],['cold','硝酸銨溶於水']],onChange:s=>{s.lt=0;},show:s=>s.mode==='chem'&&s.ck==='life'},
    {type:'range',key:'lt',label:'經過時間',min:0,max:10,step:.5,unit:' 分鐘',show:s=>s.mode==='chem'&&s.ck==='life'}],
  tick(s,dt){
    if(!reduceMotion){s.clock+=dt;
      let v=1;if(s.mode==='expand')v=.35+s.et/100*1.3;else if(s.mode==='curve'){const S=PHASE_SUB[s.sub],H=PHASE_seg(S),hq=1000*Math.min(s.ct,PHASE_tmax(s))/s.cm;v=.35+1.3*(s.cool?H[3]-hq:hq)/H[3];}
      s.ph+=dt*v;}
    if(s.mode==='curve'){const tm=PHASE_tmax(s);if(s.play){s.ct+=dt*2;if(s.ct>=tm)s.play=false;}if(s.ct>tm)s.ct=tm;}},
  tap(s,id){const[k,v]=id.split(':');if(k==='ek')s.ek=v;else if(k==='ar'&&PHASE_AR[v]){s.arrow=v;s.a0=s.clock;}},
  render(s){const m=s.mode,o=m==='water4'?this['w_'+s.wv](s):m==='curve'?this.curve(s):m==='states'?(s.sv==='evap'?this.evap(s):this.tri(s)):m==='chem'?this['c_'+s.ck](s):this.expand(s);o.svg=PHASE_DEFS+o.svg;return o;},

  /* ---- 1 熱脹冷縮 ---- */
  expand(s){const Tc=s.et,dT=Tc-20,ck=s.clock,f=PHASE_f,k=s.ek;
    const dFe=1000*3.6e-5*dT,dW=1000*(PHASE_RHO(20)/PHASE_RHO(Tc)-1),dA=1000*dT/293,dia=25*(1+1.2e-5*dT),pass=Tc<60;
    const cols=[['solid','固體：鐵球與鐵環','1000 cm³ 的鐵',dFe],['liquid','液體：水','1000 cm³ 的水',dW],['gas','氣體：空氣','1000 cm³ 的空氣',dA]];
    let h=T(310,38,Tc===20?'現在是 20°C（比較的基準）。拉動溫度，看體積怎麼改變。':`由 20°C 變成 ${Tc}°C，體積改變多少？（圖為示意，已放大）`,{size:16,anchor:'middle',fill:P.muted});
    cols.forEach(([id,title,lab,dv],i)=>{const x=22+196*i,cx=x+94,on=k===id,c=dv>=0?P.red:P.blue;
      h+=`<g data-tap="ek:${id}" tabindex="0" role="button" aria-label="${title}" style="cursor:pointer">`+PHASE_panel(x,52,188,334,on?{stroke:P.accent,sw:3}:{})+`</g>`+T(cx,78,title,{size:16,anchor:'middle',weight:700,fill:on?P.accent:P.ink});
      h+=T(cx,410,lab,{size:14,anchor:'middle',fill:P.muted})+T(cx,436,`${PHASE_sg(dv)} cm³`,{size:20,anchor:'middle',weight:700,fill:Math.abs(dv)<.05?P.muted:c});
      h+=`<rect x="${cx-86}" y="448" width="172" height="12" rx="6" fill="#ece7da"/>`+(Math.abs(dv)>=.05?`<rect x="${cx-86}" y="448" width="${f(clamp(Math.abs(dv)/273.1*172,3,172))}" height="12" rx="6" fill="${c}"/>`:'');});
    h+=T(310,482,'長條：1000 cm³ 的物質體積改變了多少（壓力不變）',{size:14,anchor:'middle',fill:P.muted});
    /* 固體：鐵球與鐵環 */
    {const x=106,r=40*(1+.0025*dT),yTop=190,yBot=pass?312:250-Math.sqrt(Math.max(0,r*r-44*44))-2,u=(ck/6)%1;
      const p=reduceMotion?1:u<.3?PHASE_ease(u/.3):u<.55?1:u<.85?1-PHASE_ease((u-.55)/.3):0,y=PHASE_lerp(yTop,yBot,p),tint=dT>=0?'#ff6a2a':'#4c85bb';
      h+=`<rect x="148" y="344" width="58" height="9" rx="3" fill="url(#ph-metal)" stroke="#6c7780"/><rect x="184" y="112" width="8" height="234" rx="3" fill="url(#ph-metal)" stroke="#6c7780"/><rect x="160" y="246" width="30" height="8" fill="url(#ph-metal)" stroke="#6c7780"/>`;
      h+=`<path d="M${x-51} 250A51 12 0 0 1 ${x+51} 250" fill="none" stroke="#7d8891" stroke-width="14"/>`;
      h+=L(x,f(y-r-46),x,f(y-r+2),{stroke:'#8b959c',w:2.5})+`<rect x="${x-18}" y="${f(y-r-54)}" width="36" height="9" rx="4" fill="#b98a5a" stroke="#8a6238"/>`;
      h+=`<circle cx="${x}" cy="${f(y)}" r="${f(r)}" fill="url(#ph-ball)" stroke="#4d575f" stroke-width="1.5"/><circle cx="${x}" cy="${f(y)}" r="${f(r)}" fill="${tint}" fill-opacity="${f(Math.min(.5,Math.abs(dT)/80*.5))}"/>`;
      h+=`<path d="M${x-51} 250A51 12 0 0 0 ${x+51} 250" fill="none" stroke="url(#ph-metal)" stroke-width="14"/><path d="M${x-51} 250A51 12 0 0 0 ${x+51} 250" fill="none" stroke="#5d6871" stroke-width="1" transform="translate(0 7)"/>`;
      h+=T(162,104,pass?'✓ 通過':'✗ 卡住',{size:16,anchor:'middle',weight:700,fill:pass?P.accent:P.red});
      h+=T(116,374,`球 ${dia.toFixed(3)}／環 25.012 mm`,{size:13,anchor:'middle',fill:P.muted});}
    /* 液體：燒瓶＋細管 */
    {const cx=312,cy=300,yl=clamp(196-dW/41.6*96,96,204);
      h+=`<circle cx="${cx}" cy="${cy}" r="48.5" fill="#f3b3a8"/><rect x="${cx-12.5}" y="224" width="25" height="40" fill="#f3b3a8"/>`+PHASE_flask(cx,cy,50,14,212);
      h+=`<path d="M${cx-18} 202H${cx+18}L${cx+14} 228H${cx-14}Z" fill="#b5835a" stroke="#8a6238" stroke-width="1.5"/>`;
      h+=`<rect x="${cx-5.5}" y="90" width="11" height="162" rx="2" fill="#fbfdff" stroke="#8fa3a8" stroke-width="1.5"/><rect x="${cx-3}" y="${f(yl)}" width="6" height="${f(251-yl)}" fill="${ALC}"/>`;
      for(let y=100;y<=196;y+=16)h+=L(cx+7,y,cx+(y%32===4?15:12),y,{stroke:P.muted,w:1});
      h+=L(cx-24,196,cx-8,196,{stroke:P.muted,w:1.5,dash:'3 3'})+T(cx-28,201,'20°C',{size:13,anchor:'end',fill:P.muted});
      h+=`<path d="M${cx+20} ${f(yl)}l9 -5v10z" fill="${P.red}"/>`+T(cx+33,f(yl+5),'液面',{size:14,fill:P.red,weight:700});
      h+=T(cx,374,'水（染紅）裝滿燒瓶',{size:13,anchor:'middle',fill:P.muted});}
    /* 氣體：燒瓶＋氣球 */
    {const cx=508,cy=300,fr=clamp((dA+68.3)/341.3,0,1),R=13+33*Math.pow(fr,.7);
      h+=`<ellipse cx="${cx}" cy="${f(210-R*1.05)}" rx="${f(R)}" ry="${f(R*1.08)}" fill="url(#ph-balloon)" stroke="#a84f20" stroke-width="1.5"/><path d="M${cx-16} 226L${cx-13} 206Q${cx} 200 ${cx+13} 206L${cx+16} 226Z" fill="#e07a3c" stroke="#a84f20" stroke-width="1.5"/>`;
      h+=`<circle cx="${cx}" cy="${cy}" r="48.5" fill="#eef5f7"/>`+PHASE_flask(cx,cy,50,14,214);
      h+=T(cx,306,'空氣',{size:15,anchor:'middle',fill:P.muted})+T(cx,374,'瓶口套上氣球',{size:13,anchor:'middle',fill:P.muted});}
    /* 粒子 */
    {const nm={solid:'固體',liquid:'液體',gas:'氣體'}[k],b={x:632,y:92,w:230,h:190},pc='#3f7fb5';
      h+=PHASE_panel(616,52,262,426)+T(747,78,`${nm}的粒子（示意）`,{size:16,anchor:'middle',weight:700})+`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8" fill="#f6f3ea" stroke="#ddd7c9"/>`;
      const dash=(x,y,w,hh)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(hh)}" rx="6" fill="none" stroke="${P.muted}" stroke-width="1.5" stroke-dasharray="5 4"/>`;let pts=[];
      if(k==='solid'){const a=22*(1+dT*.0016);for(let i=0;i<30;i++)pts.push(PHASE_pos('s',i,s.ph,b,{cols:6,a,amp:.5+Tc/100*1.6,r:7}));h+=dash(747-65,b.y+b.h-11-88-10,130,108);}
      else if(k==='liquid'){const sp=23*(1+dT*.0022);for(let i=0;i<30;i++)pts.push(PHASE_pos('l',i,s.ph,b,{lcols:8,sp,r:7}));h+=dash(747-91,b.y+b.h-12-63-10,182,84);}
      else{const sc=1+dT*.004,gb={x:747-75*sc,y:187-60*sc,w:150*sc,h:120*sc};for(let i=0;i<12;i++)pts.push(PHASE_pos('g',i,s.ph,gb,{r:7}));
        h+=`<rect x="${f(gb.x)}" y="${f(gb.y)}" width="${f(gb.w)}" height="${f(gb.h)}" rx="6" fill="#fffdf8" stroke="#b9b3a4" stroke-width="1.5"/>`+dash(672,127,150,120);}
      h+=PHASE_dots(pts,7,pc);
      const up=Tc>=20;h+=T(632,310,up?'溫度升高：粒子運動變快，':'溫度降低：粒子運動變慢，',{size:15})+T(632,333,up?'粒子間的距離變大。':'粒子間的距離變小。',{size:15});
      h+=T(632,364,'粒子本身的大小沒有改變。',{size:16,weight:700,fill:P.accent});
      h+=T(632,396,{solid:'固體粒子排列整齊，在原處振動。',liquid:'液體粒子靠得近，可以互相滑動。',gas:'氣體粒子距離很遠，膨脹最明顯。'}[k],{size:15,fill:P.muted});
      h+=L(632,424,662,424,{stroke:P.muted,w:1.5,dash:'5 4'})+T(670,429,'20°C 時的範圍',{size:14,fill:P.muted})+T(632,456,'點左邊的圖可以換一種看',{size:14,fill:P.muted});}
    return {svg:h,reads:[['溫度',Tc+'°C'],['鐵 1000 cm³ →',(1000+dFe).toFixed(1)+' cm³'],['水 1000 cm³ →',(1000+dW).toFixed(1)+' cm³'],['空氣 1000 cm³ →',(1000+dA).toFixed(1)+' cm³']],
      note:`大部分物質受熱膨脹、遇冷收縮（<b>熱脹冷縮</b>）。升降相同的溫度，體積變化通常是 <b>氣體 ＞ 液體 ＞ 固體</b>：這裡是 ${PHASE_sg(dA)}、${PHASE_sg(dW)}、${PHASE_sg(dFe)} cm³。<br>鐵球（只加熱球，鐵環維持 20°C）現在${pass?'<b>過得去</b>':'<b>卡住</b>，要等它冷卻收縮才過得去'}。生活例子：鐵軌和橋樑的伸縮縫、夏天電線比較鬆、液體溫度計；5-1 的雙金屬片也是利用膨脹程度不同。`};},

  /* ---- 2 水的特殊性質 ---- */
  w_curve(s){const Tc=s.wt,rho=PHASE_RHO(Tc),v=1/rho,f=PHASE_f,cx=200,cy=372,yl=clamp(262-(v-1)/.00027*150,104,262),wc='#a9d3ee';
    let h=T(200,44,'燒瓶裝滿水，插上細管（示意，已放大）',{size:15,anchor:'middle',fill:P.muted});
    h+=`<circle cx="${cx}" cy="${cy}" r="76.5" fill="${wc}"/><rect x="${cx-7.5}" y="${f(yl)}" width="15" height="${f(cy-70-yl)}" fill="${wc}"/>`+L(cx-7.5,f(yl),cx+7.5,f(yl),{stroke:'#4c85bb',w:2.5})+PHASE_flask(cx,cy,78,9,92);
    for(let y=112;y<=262;y+=15)h+=L(cx-11,y,cx-(y%30===22?20:16),y,{stroke:P.muted,w:1});
    h+=L(cx+12,262,cx+84,262,{stroke:P.accent,w:1.5,dash:'4 4'})+T(cx+16,281,'4°C 時的液面（最低）',{size:14,fill:P.accent});
    h+=`<path d="M${cx-24} ${f(yl)}l-10 -6v12z" fill="${P.red}"/>`+T(cx-38,f(yl+6),tnum(Tc)+'°C',{size:20,anchor:'end',weight:700,fill:P.red});
    const reg=Tc<4?0:Tc===4?1:2;[['0～4°C：溫度升高，','體積反而變小'],['4°C：體積最小，','密度最大'],['4°C 以上：溫度升高，','體積變大']].forEach(([a,b],i)=>{const on=i===reg,y=120+i*0;
      if(on)h+=PHASE_panel(300,104,176,70,{stroke:P.accent,sw:2})+T(312,132,a,{size:15,weight:700})+T(312,157,b,{size:16,weight:700,fill:P.accent});});
    h+=T(cx,476,'水',{size:15,anchor:'middle',fill:P.muted});
    h+=PHASE_panel(300,300,176,150)+T(312,328,'1 g 水的體積',{size:14,fill:P.muted})+T(312,356,v.toFixed(5)+' cm³',{size:19,weight:700,fill:s.wd?P.ink:P.blue})+T(312,394,'密度',{size:14,fill:P.muted})+T(312,422,rho.toFixed(5)+' g/cm³',{size:19,weight:700,fill:s.wd?P.blue:P.ink});
    /* 圖 */
    const X=t=>540+t*32,Y=s.wd?(t=>140+(1-PHASE_RHO(t))/.0003*280):(t=>400-(1/PHASE_RHO(t)-1)/.0003*280);
    h+=PHASE_panel(480,60,400,426);
    for(let i=0;i<4;i++){const y=s.wd?140+i*93.33:400-i*93.33;h+=L(540,f(y),860,f(y),{stroke:P.faint,w:1,dash:'3 5'})+T(532,f(y+5),s.wd?(1-i*.0001).toFixed(4):(1+i*.0001).toFixed(4),{size:14,anchor:'end',fill:P.muted});}
    for(let t=0;t<=10;t+=2)h+=L(X(t),420,X(t),426,{stroke:P.muted})+T(X(t),446,t,{size:15,anchor:'middle',fill:P.muted});
    h+=L(540,420,866,420,{stroke:P.muted,w:1.5})+L(540,420,540,100,{stroke:P.muted,w:1.5})+T(548,94,s.wd?'水的密度（g/cm³）':'1 g 水的體積（cm³）',{size:15,fill:P.ink,weight:700})+T(860,472,'溫度（°C）',{size:15,anchor:'end',fill:P.muted});
    let d='';for(let t=0;t<=10.001;t+=.25)d+=(d?'L':'M')+f(X(t))+' '+f(Y(t));
    h+=L(X(4),420,X(4),f(Y(4)),{stroke:P.accent,w:1.5,dash:'4 4'})+`<path d="${d}" fill="none" stroke="${P.blue}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    h+=PHASE_TW(X(4),s.wd?f(Y(4)+72):f(Y(4)-58),s.wd?'4°C：密度最大':'4°C：體積最小',{size:15,anchor:'middle',fill:P.accent,weight:700});
    h+=L(X(Tc),420,X(Tc),f(Y(Tc)),{stroke:P.red,w:1.5,dash:'3 4'})+`<circle cx="${X(Tc)}" cy="${f(Y(Tc))}" r="7" fill="${P.red}" stroke="#fff" stroke-width="2"/>`;
    return {svg:h,reads:[['水溫',tnum(Tc)+'°C'],['1 g 水的體積',v.toFixed(5)+' cm³'],['密度',rho.toFixed(5)+' g/cm³']],
      note:(Tc<4?`0～4°C 之間，水溫升高時體積反而<b>變小</b>（和一般物質相反）。現在 ${tnum(Tc)}°C，再升溫液面還會下降。`:Tc===4?'<b>4°C 的水體積最小、密度最大</b>（約 1 g/cm³）。不管升溫或降溫，體積都會變大。':`超過 4°C 以後，水和一般物質一樣<b>熱脹冷縮</b>。現在 ${tnum(Tc)}°C，體積比 4°C 時大。`)
        +'<br>質量不變，體積越小密度越大，所以體積最小時密度最大。圖的縱軸已放大：0～10°C 之間體積只差約萬分之三。'};},
  w_lake(s){const air=s.air,ck=s.clock,f=PHASE_f,th=air<0?8+(-air)*3.2:0,Ts=air<0?0:air,yT=160+th,yM=yT+(445-yT)*.62,Tat=y=>Ts+(4-Ts)*clamp((y-yT)/(yM-yT),0,1);
    let h=`<rect x="20" y="20" width="580" height="462" rx="12" fill="url(#ph-sky)"/><path d="M20 152H60L108 445H512L560 152H600V470Q600 482 588 482H32Q20 482 20 470Z" fill="#b89b78"/><path d="M20 152H62L64 164H20ZM600 152H558L556 164H600Z" fill="${air<0?'#fbfdff':'#8fae7a'}"/>`;
    h+=`<g clip-path="url(#ph-lake)">`;for(let i=0;i<19;i++){const y=160+i*15;h+=`<rect x="56" y="${y}" width="508" height="15.6" fill="${PHASE_rgb([196,228,244],[72,138,190],Tat(y+7)/4)}"/>`;}
    for(let i=0;i<5;i++){const x=150+i*82;h+=`<path d="M${x} 445q-10 -22 2 -40q8 -16 -2 -30" fill="none" stroke="#4f8a5b" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;}
    if(th>0){h+=`<rect x="56" y="160" width="508" height="${f(th)}" fill="url(#ph-ice)"/>`+L(56,f(yT),564,f(yT),{stroke:'#9fc3d6',w:2});for(let i=0;i<6;i++){const x=110+i*78+rnd(i)*30;h+=`<path d="M${f(x)} 162l${f(6+rnd(i+2)*8)} ${f(th*.5)}l${f(-10+rnd(i+4)*8)} ${f(th*.4)}" fill="none" stroke="#b7d3e2" stroke-width="1.5"/>`;}}
    else h+=L(56,160,564,160,{stroke:'#6fa7cf',w:2.5});
    h+=`</g><path d="M60 160L108 445H512L560 160" fill="none" stroke="#8a6f50" stroke-width="3" stroke-linejoin="round"/>`;
    /* 魚 */
    for(let i=0;i<3;i++){const ph=ck*.35+i*2.1,x=230+i*90+46*Math.sin(ph),y=398+i*13+3*Math.sin(ck*.9+i),dr=Math.cos(ph)>=0?1:-1;
      h+=`<g transform="translate(${f(x)} ${f(y)}) scale(${dr} 1)"><path d="M-14 0L-26 -8V8Z" fill="#e58a3c"/><ellipse cx="0" cy="0" rx="16" ry="7.5" fill="#f2a44e" stroke="#c9742a" stroke-width="1.2"/><circle cx="9" cy="-2" r="1.8" fill="#1b2a33"/></g>`;}
    /* 溫度標示 */
    if(Ts>=4)h+=PHASE_TW(310,300,'整個湖的水約 4°C',{size:18,anchor:'middle',weight:700});
    else{for(let t=Math.ceil(Ts);t<4;t++){const y=yT+(t-Ts)/(4-Ts)*(yM-yT)+(t===Ts?16:5);h+=L(118,f(y-5),136,f(y-5),{stroke:'#fff',w:2})+PHASE_TW(142,f(y),t+'°C'+(t===0&&th>0?'（緊貼冰層的水）':t===Ts?'（水面）':''),{size:16,weight:700});}
      h+=PHASE_TW(310,f(Math.max(yM+6,378)),'4°C：密度最大，沉在湖底',{size:17,anchor:'middle',weight:700,fill:'#0c4a6e'});}
    if(th>=26)h+=T(310,f(160+th/2+6),'冰（密度比水小，浮在水面）',{size:15,anchor:'middle',weight:700,fill:'#4a7890'});
    else if(th>0)h+=T(310,146,'薄冰',{size:15,anchor:'middle',weight:700,fill:'#4a7890'});
    h+=T(40,58,`氣溫 ${PHASE_mn(air)}°C`,{size:24,weight:700})+T(40,84,air<0?'湖水從水面開始結冰':air<4?'水面的水比 4°C 冷，密度較小，留在上層':'4°C 的水密度最大',{size:15,fill:P.muted});
    if(air<0&&!reduceMotion)for(let i=0;i<16;i++){const x=40+rnd(i)*540,y=24+((rnd(i+7)*126+ck*16*(.6+rnd(i+3)))%126);if(y<96&&x<340)continue;h+=`<circle cx="${f(x)}" cy="${f(y)}" r="2.4" fill="#fff" stroke="#b9c9d6"/>`;}
    /* 溫度—深度 */
    const X=t=>650+(t+20)*8.4;h+=PHASE_panel(616,20,262,462)+T(747,50,'溫度隨深度的變化',{size:16,anchor:'middle',weight:700})+T(747,72,'（示意）',{size:14,anchor:'middle',fill:P.muted});
    h+=`<rect x="${X(-20)}" y="160" width="${f(X(5)-X(-20))}" height="285" fill="#eaf4fa" stroke="#c9d6dc"/>`+(th>0?`<rect x="${X(-20)}" y="160" width="${f(X(5)-X(-20))}" height="${f(th)}" fill="#fff" stroke="#c9d6dc"/>`+T(X(-20)+8,f(Math.min(160+th-6,160+th/2+5)),th>=20?'冰':'',{size:14,fill:'#4a7890',weight:700}):'');
    [-20,-10,0,4].forEach(t=>{h+=L(X(t),152,X(t),445,{stroke:t===4?P.accent:P.faint,w:1,dash:'3 4'})+T(X(t),142,PHASE_mn(t),{size:14,anchor:'middle',fill:t===4?P.accent:P.muted,weight:t===4?700:400});});
    h+=T(747,112,'溫度（°C）',{size:14,anchor:'middle',fill:P.muted})+T(X(-20)+8,436,'湖底',{size:14,fill:P.muted})+T(X(-20)+8,f(Math.max(yT+22,200)),'水',{size:14,fill:'#3c6f96',weight:700});
    const pp=(th>0?[[air,160],[0,yT]]:[[Ts,160]]).concat([[4,yM],[4,445]]);
    h+=`<path d="${pp.map(([t,y],i)=>(i?'L':'M')+f(X(t))+' '+f(y)).join('')}" fill="none" stroke="${P.red}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`+T(747,470,'湖底的水維持約 4°C',{size:14,anchor:'middle',fill:P.accent,weight:700});
    return {svg:h,reads:[['氣溫',PHASE_mn(air)+'°C'],['冰層',th>0?`約 ${Math.round(th*.5)} cm（示意）`:'沒有結冰'],[th>0?'緊貼冰層的水':'水面的水',Ts+'°C'],['湖底的水','4°C']],
      note:`<b>4°C 的水密度最大</b>，會沉到湖底；0～4°C 的水密度較小，留在上層，所以湖是<b>從水面往下</b>結冰。${th>0?'冰的密度比水小，浮在水面，還能隔開冷空氣，':''}湖底的水維持約 4°C，魚可以在湖底過冬。<br>冰層厚度和水溫分布是示意；實際結冰快慢還和時間、風、湖的深淺有關。`};},
  w_ice(s){const fr=s.wf/100,V=100*(1-fr)+100/.917*fr,f=PHASE_f,ck=s.clock,wc='#a9d3ee';
    let h='';[['水結成冰：體積變大',150],['裝滿水的玻璃瓶放進冷凍庫',450],['冰的密度比水小：浮在水面',750]].forEach(([t,x])=>{h+=PHASE_panel(x-138,30,276,452)+T(x,62,t,{size:16,anchor:'middle',weight:700});});
    /* 量杯 */
    {const x1=92,x2=208,bot=400,hw=140,top=bot-hw*V/100,ih=hw*(100/.917)/100*fr;
      h+=`<rect x="${x1+2}" y="${f(top)}" width="${x2-x1-4}" height="${f(bot-top)}" fill="${wc}"/>`+(fr>0?`<rect x="${x1+2}" y="${f(top)}" width="${x2-x1-4}" height="${f(ih)}" fill="url(#ph-ice)" stroke="#9fc3d6" stroke-width="1.5"/>`:'')+L(x1+2,f(top),x2-2,f(top),{stroke:'#4c85bb',w:2.5})+beakerPath(x1,x2,190,bot+2);
      for(let v=20;v<=120;v+=20)h+=L(x2-18,bot-v*1.4,x2-4,bot-v*1.4,{stroke:P.muted,w:1.2})+(v%40===20?T(x2-22,bot-v*1.4+5,v,{size:13,anchor:'end',fill:P.muted}):'');
      h+=L(x1-14,bot-hw,x2+14,bot-hw,{stroke:P.red,w:1.5,dash:'5 4'})+L(100,108,128,108,{stroke:P.red,w:1.5,dash:'5 4'})+T(136,113,'原來的水面',{size:14,fill:P.red})+T(150,150,'100 g 的水，慢慢結冰',{size:15,anchor:'middle',fill:P.muted});
      if(fr>0)h+=T(150,f(top+Math.max(18,ih/2+5)),'冰',{size:15,anchor:'middle',weight:700,fill:'#4a7890'});if(fr<.86)h+=T(150,388,'水',{size:15,anchor:'middle',fill:'#2f6b99'});
      h+=T(150,434,`體積 ${V.toFixed(1)} cm³`,{size:18,anchor:'middle',weight:700,fill:P.red})+T(150,460,'質量 100 g（不變）',{size:15,anchor:'middle',fill:P.muted});}
    /* 玻璃瓶 */
    {const x=450,brk=clamp((fr-.3)/.25,0,1),bd=`M${x-16} 176V214Q${x-52} 232 ${x-52} 262V398Q${x-52} 410 ${x-40} 410H${x+40}Q${x+52} 410 ${x+52} 398V262Q${x+52} 232 ${x+16} 214V176Z`,ih=234*fr;
      h+=T(x,90,'冷凍庫 −18°C',{size:14,anchor:'middle',fill:P.blue})+`<clipPath id="ph-bot"><path d="${bd}"/></clipPath><g clip-path="url(#ph-bot)"><rect x="${x-56}" y="170" width="112" height="244" fill="${wc}"/><rect x="${x-56}" y="170" width="112" height="${f(ih)}" fill="url(#ph-ice)"/>${fr>0&&fr<1?L(x-56,f(176+ih),x+56,f(176+ih),{stroke:'#9fc3d6',w:1.5}):''}</g>`;
      h+=`<path d="${bd}" fill="none" stroke="#83999d" stroke-width="3.5" stroke-linejoin="round"/><rect x="${x-20}" y="162" width="40" height="15" rx="4" fill="url(#ph-metal)" stroke="#6c7780" stroke-width="1.5"/><path d="M${x-42} 270V380" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
      if(brk>0)h+=`<path d="M${x+52} 268l-22 26l14 22l-26 30l12 28M${x-52} 300l20 18l-10 30l18 22M${x+8} 240l-12 30l16 20" fill="none" stroke="${P.red}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="${f(brk)}"/>`;
      h+=T(x,434,brk>0?'冰把玻璃瓶撐裂':'瓶子裝滿、蓋緊',{size:18,anchor:'middle',weight:700,fill:brk>0?P.red:P.ink})+T(x,460,brk>0?'結冰時體積變大，瓶內沒有空間':'水沒有膨脹的空間',{size:15,anchor:'middle',fill:P.muted});}
    /* 浮冰 */
    {const x=750,bob=reduceMotion?0:1.5*Math.sin(ck*1.4),top=262+bob;
      h+=`<rect x="${x-58}" y="270" width="116" height="138" fill="${wc}"/>`+`<rect x="${x-30}" y="${f(top)}" width="60" height="60" rx="7" fill="url(#ph-ice)" stroke="#9fc3d6" stroke-width="2"/><rect x="${x-29}" y="270" width="58" height="${f(top+59-270)}" rx="6" fill="${wc}" fill-opacity=".45"/>`+L(x-58,270,x-31,270,{stroke:'#4c85bb',w:2.5})+L(x+31,270,x+58,270,{stroke:'#4c85bb',w:2.5})+beakerPath(x-60,x+60,190,410);
      h+=T(x,f(top+34),'冰',{size:15,anchor:'middle',weight:700,fill:'#4a7890'})+T(x,150,'冰：約 0.92 g/cm³',{size:15,anchor:'middle',fill:'#4a7890',weight:700})+T(x,172,'水：1.00 g/cm³',{size:15,anchor:'middle',fill:'#2f6b99',weight:700});
      h+=T(x,434,'約九成在水面下',{size:18,anchor:'middle',weight:700})+T(x,460,'密度小的浮在上面',{size:15,anchor:'middle',fill:P.muted});}
    return {svg:h,reads:[['已結冰',s.wf+'%'],['質量','100 g（不變）'],['體積',V.toFixed(1)+' cm³'],['平均密度',(100/V).toFixed(3)+' g/cm³']],
      note:`水結成冰時<b>質量不變、體積變大</b>（100 g 的水約 100 cm³，全部結冰後約 109 cm³），所以冰的<b>密度比水小</b>，會浮在水面。<br>裝滿水的玻璃瓶不要放進冷凍庫，水結冰膨脹會把瓶子撐裂；寒流時水管凍裂也是同樣的原因。（瓶子在結冰多少時裂開是示意）`};},

  /* ---- 3 加熱曲線 ---- */
  curve(s){const S=PHASE_SUB[s.sub],m=s.cm,H=PHASE_seg(S),tmax=H[3]*m/1000,t=clamp(s.ct,0,tmax),hq=1000*t/m,hc=s.cool?H[3]-hq:hq,st=PHASE_at(S,hc),k=st.k,Tc=st.T,ck=s.clock,f=PHASE_f,cool=s.cool;
    const col=['#4c85bb',P.accent,'#d98a2b',P.red],nm=cool?[S.sn+'降溫','凝固',S.ln+'降溫','凝結']:[S.sn+'升溫','熔化',S.ln+'升溫','沸騰'],flat=k===1||k===3;
    const ban=flat?`${nm[k]}（${PHASE_mn(k===1?S.mp:S.bp)}°C）：${cool?'狀態改變時放熱':'吸收的熱用來改變狀態'}，溫度不變`:`${nm[k]}：${cool?'放出熱，溫度下降':'吸收的熱使溫度上升'}`;
    let h=`<rect x="150" y="14" width="600" height="38" rx="19" fill="${flat?'#e2f2ef':'#fffdf8'}" stroke="${flat?P.accent:'#ddd7c9'}" stroke-width="2"/>`+T(450,40,ban,{size:20,anchor:'middle',weight:700,fill:flat?P.accent:P.ink});
    /* 燒杯 */
    const x1=62,x2=228,W=x2-x1,bot=378,hw=50+m*.5,wcol=WARM((Tc-S.mp)/(S.bp-S.mp)*100);let lev=0;
    h+=T(22,74,'溫度計讀數',{size:13,fill:P.muted})+T(22,102,PHASE_mn(tnum(Tc))+'°C',{size:26,weight:700,fill:col[k]});
    if(k>=1){const fr=k===1?st.f:1;let wi=0,hi=0;if(k===1){wi=150*Math.sqrt(1-fr);hi=1.206*hw*Math.sqrt(1-fr);}
      lev=k===1?Math.min(hw,fr*hw*W/(W-wi)):k===3?hw*(1-st.f):hw;
      h+=`<rect x="${x1}" y="${f(bot-lev)}" width="${W}" height="${f(lev)}" fill="${wcol}" fill-opacity=".42"/>`;
      if(k===1&&wi>3){const yb=Math.min(bot,bot-lev+.917*hi);h+=`<rect x="${f(140-wi/2)}" y="${f(yb-hi)}" width="${f(wi)}" height="${f(hi)}" rx="${f(Math.min(12,hi/3,wi/3))}" fill="url(#ph-ice)" stroke="#9fc3d6" stroke-width="2"/><rect x="${f(140-wi/2+1)}" y="${f(Math.max(yb-hi,bot-lev))}" width="${f(Math.max(0,wi-2))}" height="${f(Math.max(0,Math.min(hi,yb-(bot-lev))))}" rx="4" fill="${wcol}" fill-opacity=".2"/>`;}
      h+=L(x1,f(bot-lev),x2,f(bot-lev),{stroke:wcol,w:3});
      if(k===3&&!cool&&!reduceMotion)for(let i=0;i<10;i++){const lf=(ck*(.5+rnd(i+5)*.5)+rnd(i+9))%1;h+=`<circle cx="${f(74+rnd(i)*120+3*Math.sin(ck*5+i))}" cy="${f(bot-5-lf*(lev-10))}" r="${f(2+lf*3.5)}" fill="#fff" fill-opacity=".75" stroke="#7fa6c4"/>`;}
      if(k===3&&cool)for(let i=0;i<8;i++){const y=178+rnd(i+2)*Math.max(4,bot-lev-196)+(reduceMotion?0:(ck*6*(.5+rnd(i))%10));h+=`<ellipse cx="${i%2?x2-6:x1+6}" cy="${f(y)}" rx="3" ry="4.5" fill="#8cc4ea" stroke="#3f7fb5"/>`;}}
    else{const hi=1.206*hw;h+=`<rect x="65" y="${f(bot-hi)}" width="150" height="${f(hi)}" rx="12" fill="url(#ph-ice)" stroke="#9fc3d6" stroke-width="2"/><path d="M82 ${f(bot-hi+16)}l22 14M96 ${f(bot-hi*.5)}l30 -12M150 ${f(bot-22)}l26 -16" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`;}
    if(k===3&&!cool){if(s.sub==='water'){if(!reduceMotion)for(let i=0;i<5;i++){const lf=(ck*.22+i/5)%1;h+=`<ellipse cx="${f(158+(rnd(i+2)-.5)*40+5*Math.sin(ck+i))}" cy="${f(146-lf*62)}" rx="${f(13+lf*10)}" ry="${f(7+lf*5)}" fill="#fff" stroke="#b9c6cc" opacity="${f(Math.sin(Math.PI*lf)*.85)}"/>`;}
      else h+=`<ellipse cx="158" cy="110" rx="20" ry="10" fill="#fff" stroke="#b9c6cc"/>`;
      h+=L(240,99,190,106,{stroke:P.muted,w:1})+T(244,104,'白煙：小水滴',{size:14,fill:P.muted});}
      h+=L(240,151,196,160,{stroke:P.muted,w:1})+T(244,156,`${S.gas}（看不見）`,{size:14,fill:P.muted});}
    else if(k===3)h+=L(240,151,226,186,{stroke:P.muted,w:1})+T(244,156,`${S.gas}凝結成${S.liq}`,{size:14,fill:P.muted});
    h+=beakerPath(x1-2,x2+2,168,bot+2)+`<path d="M70 190V340" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
    h+=glassTherm(212,bot-18,116,(bot-40)-(Tc-S.ymin)/(S.ymax-S.ymin)*200,{c:ALC,br:8,w:4});
    h+=PHASE_plate(54,236,386,cool?'cool':'heat')+T(145,436,cool?'冷卻：每分鐘放出 1000 cal':'熱源：每分鐘供熱 1000 cal',{size:14,anchor:'middle',fill:P.muted})+T(145,458,`${S.name} ${m} g（1 大氣壓，不計散熱）`,{size:13,anchor:'middle',fill:P.muted});
    h+=cool?vArrow(36,330,372,P.blue,{w:4})+T(36,318,'放熱',{size:14,anchor:'middle',fill:P.blue,weight:700}):vArrow(36,372,330,P.red,{w:4})+T(36,318,'吸熱',{size:14,anchor:'middle',fill:P.red,weight:700});
    /* 粒子 */
    {const b={x:272,y:228,w:158,h:150},N=24,C=6,pts=[];h+=PHASE_panel(262,196,178,250)+T(351,218,'粒子（示意）',{size:14,anchor:'middle',weight:700,fill:P.muted})+`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8" fill="#f6f3ea" stroke="#ddd7c9"/>`;
      const amp=.8+1.6*clamp((Tc-S.t0)/(S.mp-S.t0),0,1);
      for(let i=0;i<N;i++){const c=i%C,rw=Math.floor(i/C),dd=Math.abs(c-2.5)+Math.abs(rw-1.5)*1.01;let rk=0;for(let j=0;j<N;j++){const d2=Math.abs(j%C-2.5)+Math.abs(Math.floor(j/C)-1.5)*1.01;if(d2>dd+1e-9||(Math.abs(d2-dd)<1e-9&&j<i))rk++;}
        const wl=k===0?0:k===1?PHASE_ease(clamp(st.f*N-rk,0,1)):1,wg=k===3?PHASE_ease(clamp(st.f*N-(N-1-i),0,1)):0;
        let p=PHASE_pos('s',i,s.ph,b,{cols:C,a:19,amp});if(wl>0){const q=PHASE_pos('l',i,s.ph,b,{lcols:6,sp:22});p=[PHASE_lerp(p[0],q[0],wl),PHASE_lerp(p[1],q[1],wl)];}
        if(wg>0){const q=PHASE_pos('g',i,s.ph,b);p=[PHASE_lerp(p[0],q[0],wg),PHASE_lerp(p[1],q[1],wg)];}pts.push(p);}
      h+=PHASE_dots(pts,6,'#3f7fb5')+T(351,404,['固態','固態＋液態','液態','液態＋氣態'][k],{size:16,anchor:'middle',weight:700,fill:col[k]})+T(351,428,['排列整齊，在原處振動','有些粒子離開固定位置','靠得近，但可以到處移動','有些粒子遠離、快速運動'][k],{size:13,anchor:'middle',fill:P.muted});}
    /* 圖 */
    const X=v=>492+v*7.5,Y=v=>390-(v-S.ymin)/(S.ymax-S.ymin)*300,tau=hh=>(cool?H[3]-hh:hh)*m/1000;
    for(let v=S.ymin;v<=S.ymax;v+=S.ys)h+=L(492,f(Y(v)),867,f(Y(v)),{stroke:P.faint,w:1,dash:'3 5'})+T(484,f(Y(v)+5),PHASE_mn(v),{size:14,anchor:'end',fill:P.muted});
    for(let v=0;v<=50;v+=10)h+=L(X(v),390,X(v),396,{stroke:P.muted})+T(X(v),414,v,{size:14,anchor:'middle',fill:P.muted});
    h+=L(492,390,872,390,{stroke:P.muted,w:1.5})+L(492,390,492,84,{stroke:P.muted,w:1.5})+T(498,80,'溫度（°C）',{size:14,fill:P.muted})+T(867,434,cool?'冷卻時間（分鐘）':'加熱時間（分鐘）',{size:14,anchor:'end',fill:P.muted});
    h+=L(492,f(Y(S.mp)),867,f(Y(S.mp)),{stroke:col[1],w:1.5,dash:'5 4',op:.7})+L(492,f(Y(S.bp)),867,f(Y(S.bp)),{stroke:col[3],w:1.5,dash:'5 4',op:.7});
    h+=(cool?PHASE_TW(498,f(Y(S.mp)+19),`凝固點 ${PHASE_mn(S.mp)}°C`,{size:14,fill:col[1],weight:700}):PHASE_TW(864,f(Y(S.mp)+19),`熔點 ${PHASE_mn(S.mp)}°C`,{size:14,anchor:'end',fill:col[1],weight:700}))+PHASE_TW(864,f(Y(S.bp)+19),`沸點 ${PHASE_mn(S.bp)}°C`,{size:14,anchor:'end',fill:col[3],weight:700});
    const hp=[0,H[0],H[1],H[2],H[3]],Th=v=>PHASE_at(S,v).T,ln=(a,b,c,w,op)=>`<path d="M${f(X(tau(a)))} ${f(Y(Th(a)))}L${f(X(tau(b)))} ${f(Y(b>=H[3]?S.bp:Th(b-1e-7)))}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
    for(let i=0;i<4;i++)h+=ln(hp[i],hp[i+1],col[i],3,.28);
    for(let i=0;i<4;i++){const a=cool?Math.max(hp[i],hc):hp[i],b=cool?hp[i+1]:Math.min(hp[i+1],hc);if(b>a+1e-6)h+=ln(a,b,col[i],5,1);}
    h+=L(X(t),390,X(t),f(Y(Tc)),{stroke:col[k],w:1.5,dash:'3 4'})+`<circle cx="${f(X(t))}" cy="${f(Y(Tc))}" r="7" fill="${col[k]}" stroke="#fff" stroke-width="2.5"/>`;
    (cool?[3,2,1,0]:[0,1,2,3]).forEach((i,j)=>{h+=PHASE_pill(537+j*95,460,'①②③④'[j]+' '+nm[i],col[i],{w:90,h:28,size:14,on:i===k});});
    const stn=[S.solid,`${S.solid}＋${S.liq}（固液共存）`,S.liq,`${S.liq}＋${S.gas}`][k];
    const note=(k===1?`<b>${nm[1]}</b>：溫度停在${cool?'凝固點':'熔點'} <b>${PHASE_mn(S.mp)}°C</b>，${S.solid}和${S.liq}同時存在（<b>固液共存</b>）。${cool?'凝固時放熱':'吸收的熱用來改變狀態'}，溫度不變，已${cool?'凝固':'熔化'} ${Math.round((cool?1-st.f:st.f)*100)}%。`
      :k===3?`<b>${nm[3]}</b>：溫度停在沸點 <b>${PHASE_mn(S.bp)}°C</b>。${cool?S.gas+'凝結成'+S.liq+'時放熱':'吸收的熱用來把'+S.liq+'變成'+S.gas}，溫度不變。${s.sub==='water'?'水蒸氣看不見，看得到的白煙是凝結成的小水滴。':''}`
      :`<b>${nm[k]}</b>：只有一種狀態（${stn}）時，${cool?'放熱使溫度下降':'吸收的熱使溫度上升'}。${s.sub==='water'&&k===0?'冰的比熱約是水的一半，所以同樣的熱源下冰升降溫比水快。':''}`)
      +`<br>在 1 大氣壓下，純物質有固定的熔點和沸點，而且<b>熔點 ＝ 凝固點</b>（${S.name}：${PHASE_mn(S.mp)}°C、沸點 ${PHASE_mn(S.bp)}°C）。質量越大，各段需要的時間越長，但熔點、沸點不變。`
      +(s.cx?`<br>延伸（國中不計算）：1 g 的${S.solid}完全熔化約吸收 ${S.lf} cal（熔化熱），1 g 的${S.liq}完全汽化約吸收 ${S.lv} cal（汽化熱），所以沸騰那一段比熔化長很多，圖只畫到一部分汽化為止。`:'');
    return {svg:h,reads:[[cool?'冷卻時間':'加熱時間',t.toFixed(1)+' 分鐘'],['溫度',PHASE_mn(tnum(Tc))+'°C'],['狀態',stn],[cool?'已放出熱量':'已吸收熱量',Math.round(1000*t)+' cal']],note};},

  /* ---- 4 三態變化 ---- */
  tri(s){const ck=s.clock,f=PHASE_f,A=PHASE_AR[s.arrow]||PHASE_AR.melt,cc=a=>a?P.red:P.blue;
    let h=L(26,36,66,36,{stroke:P.red,w:4,arrow:true})+T(76,42,'吸熱',{size:16,fill:P.red,weight:700})+L(26,64,66,64,{stroke:P.blue,w:4,arrow:true})+T(76,70,'放熱',{size:16,fill:P.blue,weight:700})+T(516,42,'點箭頭看粒子的變化',{size:14,anchor:'end',fill:P.muted});
    for(const id of Object.keys(PHASE_AR)){const[nm,a,b,ab]=PHASE_AR[id],Pa=PHASE_NODE[a],Pb=PHASE_NODE[b],dx=Pb[0]-Pa[0],dy=Pb[1]-Pa[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,nx=-uy,ny=ux,on=id===s.arrow,c=cc(ab);
      h+=`<g data-tap="ar:${id}" tabindex="0" role="button" aria-label="${nm}" style="cursor:pointer">`+L(f(Pa[0]+ux*62+nx*11),f(Pa[1]+uy*62+ny*11),f(Pb[0]-ux*68+nx*11),f(Pb[1]-uy*68+ny*11),{stroke:c,w:on?6:4,arrow:true,op:on?1:.75})
        +PHASE_pill(f((Pa[0]+Pb[0])/2+nx*39),f((Pa[1]+Pb[1])/2+ny*39),nm,c,{w:78,h:34,size:18,on})+`</g>`;}
    for(const key of ['S','L','G']){const[x,y,nm,kd]=PHASE_NODE[key],b={x:x-33,y:y-33,w:66,h:66},pts=[];h+=`<circle cx="${x}" cy="${y}" r="50" fill="#fffdf8" stroke="${P.ink}" stroke-width="2.5"/>`;
      for(let i=0;i<(kd==='g'?4:9);i++)pts.push(PHASE_pos(kd,i,ck*(kd==='g'?.8:1),b,{cols:3,a:15,lcols:3,sp:17,amp:1.2,r:5}));
      h+=PHASE_dots(pts,5,'#3f7fb5')+T(x,key==='G'?48:474,nm,{size:21,anchor:'middle',weight:700});}
    /* 右側：粒子變化 */
    const[nm,a,b,ab,desc,ex]=A,c=cc(ab),bx={x:560,y:78,w:300,h:176},N=20,u=reduceMotion?1:clamp(((ck-s.a0)%6+6)%6/3.4,0,1),pts=[],ka=PHASE_NODE[a][3],kb=PHASE_NODE[b][3],o={cols:5,a:22,lcols:6,sp:24,amp:1.6,r:7};
    h+=PHASE_panel(540,16,340,468)+T(560,56,nm,{size:28,weight:700,fill:c})+T(630,54,`${PHASE_NODE[a][2]} → ${PHASE_NODE[b][2]}`,{size:19,weight:700})+PHASE_pill(826,46,ab?'吸熱':'放熱',c,{w:68,h:30,size:16});
    h+=`<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="8" fill="#f6f3ea" stroke="#ddd7c9"/>`;
    for(let i=0;i<N;i++){const w=PHASE_ease(clamp(u*1.5-(N-1-i)/N*.5,0,1)),p=PHASE_pos(ka,i,ck,bx,o),q=PHASE_pos(kb,i,ck,bx,o);pts.push([PHASE_lerp(p[0],q[0],w),PHASE_lerp(p[1],q[1],w)]);}
    h+=PHASE_dots(pts,7,'#3f7fb5')+`<rect x="560" y="262" width="300" height="5" rx="2.5" fill="#ece7da"/><rect x="560" y="262" width="${f(300*u)}" height="5" rx="2.5" fill="${c}"/>`;
    h+=T(560,292,desc,{size:15,fill:P.ink})+T(560,326,'生活例子',{size:15,weight:700,fill:P.muted});ex.forEach((e,i)=>{h+=T(560,352+i*26,(e[0]==='（'?'':'・')+e,{size:16});});
    h+=L(560,434,860,434,{stroke:P.faint,w:1})+T(560,460,'狀態改變時質量不變，體積和密度會改變。',{size:15,weight:700,fill:P.accent});
    return {svg:h,reads:[['變化',`${nm}：${PHASE_NODE[a][2]} → ${PHASE_NODE[b][2]}`],['熱',ab?'吸熱':'放熱'],['質量','不變'],['體積、密度','改變']],
      note:`<b>吸熱</b>的變化：熔化、汽化、昇華（粒子變得比較分散）；<b>放熱</b>的變化：凝固、凝結、凝華（粒子變得比較靠近）。<br>狀態改變只是粒子的排列和距離改變，粒子的種類和數目不變，所以<b>質量不變</b>。${s.arrow==='cond'?'水蒸氣看不見，看得到的「白煙」是凝結成的小水滴。':s.arrow==='vap'?'汽化有蒸發和沸騰兩種方式，可以換到「蒸發和沸騰的比較」。':''}`};},
  evap(s){const ck=s.clock,f=PHASE_f,mv=!reduceMotion;
    let h=PHASE_panel(40,20,400,330)+PHASE_panel(460,20,400,330);
    [[240,'蒸發','室溫 25°C 的水',25],[660,'沸騰','100°C 的水（1 大氣壓）',100]].forEach(([x,nm,sub,Tc],j)=>{const bot=j?286:312,lev=bot-98;
      h+=T(x,58,nm,{size:26,anchor:'middle',weight:700,fill:j?P.red:P.blue})+T(x,84,sub,{size:15,anchor:'middle',fill:P.muted});
      h+=`<rect x="${x-78}" y="${lev}" width="156" height="98" fill="${WARM(Tc)}" fill-opacity=".4"/>`+L(x-78,lev,x+78,lev,{stroke:WARM(Tc),w:3});
      if(j&&mv)for(let i=0;i<11;i++){const lf=(ck*(.5+rnd(i+5)*.5)+rnd(i+9))%1;h+=`<circle cx="${f(x-64+rnd(i)*128+3*Math.sin(ck*5+i))}" cy="${f(bot-5-lf*88)}" r="${f(2+lf*4)}" fill="#fff" fill-opacity=".8" stroke="#7fa6c4"/>`;}
      const n=j?12:4;for(let i=0;i<n;i++){const lf=mv?(ck*(j?.45:.16)*(.7+rnd(i+3)*.6)+i/n)%1:(i+.5)/n;h+=`<circle cx="${f(x-62+rnd(i+13)*124+8*Math.sin(ck*.8+i))}" cy="${f(lev-6-lf*72)}" r="4.5" fill="#3f7fb5" opacity="${f(1-lf*.9)}"/>`;}
      h+=beakerPath(x-80,x+80,bot-150,bot+2);
      if(j)h+=PHASE_plate(x-90,x+90,bot+8,'heat');else h+=L(x-110,bot+6,x+110,bot+6,{stroke:'#b9b3a4',w:3});});
    h+=T(334,212,'只有表面的',{size:14,fill:P.blue,weight:700})+T(334,231,'粒子離開',{size:14,fill:P.blue,weight:700})+T(566,226,'內部也汽化',{size:14,anchor:'end',fill:P.red,weight:700})+T(566,245,'（冒出氣泡）',{size:14,anchor:'end',fill:P.red,weight:700});
    h+=PHASE_panel(40,362,820,96);[['發生的溫度','任何溫度都會發生','到達沸點才發生'],['發生的位置','只在液體表面','液體內部和表面同時'],['劇烈程度','緩慢','劇烈，產生大量氣泡']].forEach(([a,b,c],i)=>{const y=388+i*28;
      if(i)h+=L(60,y-19,840,y-19,{stroke:P.faint,w:1});h+=T(450,y,a,{size:15,anchor:'middle',fill:P.muted,weight:700})+T(240,y,b,{size:17,anchor:'middle',weight:700,fill:P.blue})+T(660,y,c,{size:17,anchor:'middle',weight:700,fill:P.red});});
    h+=T(450,482,'相同的地方：都是汽化（液態 → 氣態），都要吸熱。',{size:16,anchor:'middle',weight:700,fill:P.accent});
    return {svg:h,reads:[['蒸發','任何溫度、只在表面'],['沸騰','到達沸點、內部和表面'],['相同','都是汽化，都吸熱']],
      note:'<b>蒸發</b>：任何溫度都會發生，只在液體<b>表面</b>，比較緩慢；溫度高、表面積大、通風時蒸發較快。<b>沸騰</b>：到達<b>沸點</b>才發生，液體<b>內部和表面同時</b>汽化，很劇烈；沸騰時溫度不變。<br>兩種都要<b>吸熱</b>：流汗後汗水蒸發帶走熱，所以覺得涼；擦酒精覺得涼也是一樣。'};},

  /* ---- 5 吸熱與放熱的變化 ---- */
  side(title,rows,tag,c,extra){let h=PHASE_panel(580,30,300,450)+T(600,66,title,{size:19,weight:700});
    rows.forEach(([col,t,arrow],i)=>{const y=112+i*92;h+=`<circle cx="622" cy="${y}" r="20" fill="${col}" stroke="#8a949b" stroke-width="1.5"/>`+T(652,y+6,t,{size:16,weight:700});if(arrow)h+=L(622,y+28,622,y+62,{stroke:c,w:3,arrow:true})+T(640,y+52,arrow,{size:15,fill:c,weight:700});});
    extra.forEach((e,i)=>{h+=T(600,306+i*27,e,{size:15,fill:i?P.ink:P.accent,weight:i?400:700});});
    return h+PHASE_pill(650,440,tag,c,{w:100,h:34,size:18});},
  dropper(x,y,ck,on){const f=PHASE_f;let h=`<path d="M${x-7} ${y-78}H${x+7}V${y-18}L${x+2.5} ${y}H${x-2.5}L${x-7} ${y-18}Z" fill="#f4fafc" stroke="#83999d" stroke-width="2" stroke-linejoin="round"/><rect x="${x-5}" y="${y-52}" width="10" height="38" fill="#a9d3ee"/><ellipse cx="${x}" cy="${y-96}" rx="14" ry="22" fill="#c8553d" stroke="#8f3a29" stroke-width="1.5"/>`;
    if(on){const lf=reduceMotion?.4:(ck*.9)%1;h+=`<path d="M${x} ${f(y+4+lf*lf*70)}q-6 9 0 13q6 -4 0 -13z" fill="#6fb1e0" stroke="#3f7fb5"/>`;}return h;},
  c_cu(s){const p=s.cp/100,ck=s.clock,f=PHASE_f,BL=[47,127,214],WH=[241,239,231],heat=s.cs==='heat';let h='';
    if(heat){const col=PHASE_rgb(BL,WH,p);
      h+=T(290,62,'加熱藍色硫酸銅晶體',{size:20,anchor:'middle',weight:700});
      h+=`<rect x="56" y="440" width="284" height="10" rx="4" fill="url(#ph-metal)" stroke="#6c7780"/><rect x="82" y="96" width="9" height="346" rx="3" fill="url(#ph-metal)" stroke="#6c7780"/>`;
      h+=`<rect x="352" y="388" width="104" height="52" rx="4" fill="#c9a47a" stroke="#8a6238" stroke-width="1.5"/><path d="M360 404H448M360 422H448" stroke="#b08a5e" stroke-width="1.5"/>`+PHASE_lamp(404,388,ck,76)+`<g transform="rotate(-7 300 214)"><rect x="90" y="208" width="126" height="9" fill="url(#ph-metal)" stroke="#6c7780"/>`
        +`<path d="M186 190H420Q444 190 444 214Q444 238 420 238H186" fill="#f7fbfc" fill-opacity=".85" stroke="#83999d" stroke-width="3.5" stroke-linecap="round"/><path d="M186 186V242" stroke="#83999d" stroke-width="3.5" stroke-linecap="round"/>`
        +`<path d="M352 236Q356 222 372 218Q384 208 400 214Q414 206 428 218Q440 224 438 228Q432 237 420 236Z" fill="${col}" stroke="#7d8a92" stroke-width="1.2"/>`
        +[0,1,2,3,4].map(i=>`<ellipse cx="${200+i*22+rnd(i)*8}" cy="${i%2?196:232}" rx="${f(2+p*3)}" ry="${f(1.6+p*2.4)}" fill="#8cc4ea" stroke="#3f7fb5" opacity="${f(clamp(p*1.6-i*.08,0,1))}"/>`).join('')
        +`<rect x="210" y="184" width="16" height="60" rx="4" fill="url(#ph-metal)" stroke="#6c7780"/><path d="M210 200H400" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>`;
      if(p>.15)h+=T(232,176,'試管口附近出現小水滴',{size:15,anchor:'middle',fill:P.blue,weight:700});
      h+=T(214,290,'試管口略向下傾斜',{size:14,anchor:'middle',fill:P.muted})+T(214,310,'（水才不會倒流回熱的地方）',{size:14,anchor:'middle',fill:P.muted});
      h+=`<rect x="130" y="360" width="150" height="46" rx="10" fill="${col}" stroke="#8a949b" stroke-width="1.5"/>`+T(205,350,'現在的顏色',{size:14,anchor:'middle',fill:P.muted});
      h+=this.side('硫酸銅晶體受熱',[['rgb(47,127,214)','藍色硫酸銅晶體','加熱'],['rgb(241,239,231)','白色硫酸銅粉末 ＋ 水']],'吸熱',P.red,['失去結晶水，顏色由藍變白。','要一直加熱（吸熱）才會進行。']);
      return {svg:h,reads:[['進行程度',s.cp+'%'],['顏色',p<.15?'藍色':p>.85?'白色':'藍色 → 白色'],['熱','吸熱']],
        note:'藍色的硫酸銅晶體含有<b>結晶水</b>。加熱時<b>吸熱</b>，失去結晶水，變成<b>白色</b>的硫酸銅粉末，試管口附近出現小水滴。<br>加熱後得到的白色粉末和原來的藍色晶體性質不同，這不只是狀態改變。'};}
    const Tc=25+20*p;h+=T(290,62,'白色硫酸銅粉末滴水',{size:20,anchor:'middle',weight:700});
    h+=L(70,402,510,402,{stroke:'#b9b3a4',w:3})+`<clipPath id="ph-mound"><path d="M190 372Q230 318 290 314Q350 318 390 372Z"/></clipPath><path d="M190 372Q230 318 290 314Q350 318 390 372Z" fill="rgb(241,239,231)" stroke="#a9a595" stroke-width="1.5"/>`;
    if(p>0)h+=`<g clip-path="url(#ph-mound)"><ellipse cx="290" cy="322" rx="${f(18+140*Math.sqrt(p))}" ry="${f(10+62*Math.sqrt(p))}" fill="rgb(47,127,214)"/></g><path d="M190 372Q230 318 290 314Q350 318 390 372Z" fill="none" stroke="#7d8a92" stroke-width="1.5"/>`;
    h+=`<path d="M150 356Q290 418 430 356" fill="#f4fafc" fill-opacity=".55" stroke="#83999d" stroke-width="3.5" stroke-linecap="round"/><path d="M172 370Q290 410 408 370" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    h+=this.dropper(290,226,ck,s.cp>0&&s.cp<100)+T(264,150,'滴管（水）',{size:15,anchor:'end',fill:P.muted});
    h+=glassTherm(384,352,130,330-(Tc-20)*5.5,{c:ALC,br:9,w:4})+thermTicks(396,20,50,5,10,v=>330-(v-20)*5.5,{size:14})+T(384,104,tnum(Tc)+'°C',{size:24,anchor:'middle',weight:700,fill:P.red})+T(440,436,'溫度上升（示意）',{size:15,anchor:'middle',fill:P.red,weight:700});
    h+=T(150,436,p>0?'沾到水的地方變成藍色':'乾燥的白色粉末',{size:16,anchor:'middle',weight:700,fill:p>0?'rgb(47,127,214)':P.muted});
    h+=this.side('白色硫酸銅粉末遇水',[['rgb(241,239,231)','白色硫酸銅粉末','滴水'],['rgb(47,127,214)','變回藍色']],'放熱',P.blue,['可以用來檢驗水。','滴水後摸起來溫溫的（放熱）。']);
    return {svg:h,reads:[['進行程度',s.cp+'%'],['顏色',p<.05?'白色':p>.85?'藍色':'白色 → 藍色'],['溫度（示意）',tnum(Tc)+'°C'],['熱','放熱']],
      note:'白色的硫酸銅粉末遇到水，會變回<b>藍色</b>，同時<b>放熱</b>，溫度升高。因為遇水就變色，所以可以用來<b>檢驗水</b>。<br>和「加熱藍色晶體」剛好相反：一個吸熱、一個放熱。溫度上升幾度是示意。'};},
  c_co(s){const w=s.cw/100,ck=s.clock,f=PHASE_f,BL=[59,127,196],PK=[232,140,175],col=PHASE_rgb(BL,PK,w);
    let h=T(290,62,'氯化亞鈷試紙',{size:20,anchor:'middle',weight:700});
    h+=`<rect x="120" y="226" width="300" height="64" rx="5" fill="${col}" stroke="#7d8a92" stroke-width="1.5"/><path d="M128 234H412" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
    h+=`<path d="M420 246L520 226M420 270L520 290" stroke="#8b959c" stroke-width="5" stroke-linecap="round"/><path d="M520 226Q540 258 520 290" fill="none" stroke="#8b959c" stroke-width="5" stroke-linecap="round"/>`;
    h+=this.dropper(200,196,ck,s.cw>0&&s.cw<100)+T(228,120,'滴管（水）',{size:15,fill:P.muted});
    h+=T(270,266,w<.15?'藍色':w>.7?'粉紅色':'',{size:20,anchor:'middle',weight:700,fill:'#fff'});
    h+=`<rect x="120" y="356" width="300" height="18" rx="9" fill="url(#ph-co)" stroke="#8a949b"/><path d="M${f(120+300*w)} 352l-8 -14h16z" fill="${P.ink}"/>`+T(120,402,'乾燥：藍色',{size:16,weight:700,fill:'rgb(59,127,196)'})+T(420,402,'遇水：粉紅色',{size:16,anchor:'end',weight:700,fill:'rgb(205,95,140)'});
    h+=T(270,446,'潮溼變粉紅的試紙，烘乾（加熱）後又變回藍色。',{size:15,anchor:'middle',fill:P.muted});
    h+=this.side('氯化亞鈷試紙',[['rgb(59,127,196)','乾燥時：藍色','遇水'],['rgb(232,140,175)','變成粉紅色']],'檢驗水',P.accent,['可以用來檢驗水。','使用前要保持乾燥，','用鑷子夾，不要用手直接拿。']);
    return {svg:h,reads:[['含水程度',s.cw+'%'],['試紙顏色',w<.15?'藍色':w>.7?'粉紅色':'藍紫色 → 粉紅色']],
      note:'<b>氯化亞鈷試紙</b>乾燥時是<b>藍色</b>，遇到水變成<b>粉紅色</b>，可以用來檢驗水；烘乾後又變回藍色。<br>檢驗水的兩種方法：白色硫酸銅粉末（白 → 藍）、氯化亞鈷試紙（藍 → 粉紅）。手上的汗也會讓試紙變色，所以要用鑷子夾。'};},
  c_life(s){const warm=s.cl==='warm',t=s.lt,ck=s.clock,f=PHASE_f,A=warm?30:-18,Tat=v=>25+A*(1-Math.exp(-v/2.5)),Tc=Tat(t),c=warm?P.red:P.blue,act=Math.exp(-t/2.5),yT=v=>388-v*4.4;
    let h=T(250,62,warm?'暖暖包：鐵粉和空氣作用，放熱':'硝酸銨溶於水：吸熱（冷敷包的原理）',{size:19,anchor:'middle',weight:700});
    if(warm){h+=`<rect x="90" y="232" width="230" height="150" rx="16" fill="#f3e3d1" stroke="#c9a784" stroke-width="2.5"/><rect x="102" y="244" width="206" height="126" rx="10" fill="none" stroke="#c9a784" stroke-width="1.5" stroke-dasharray="5 5"/>`+T(205,300,'暖暖包',{size:22,anchor:'middle',weight:700,fill:'#9a5a2b'})+T(205,328,'（鐵粉、活性碳、食鹽…）',{size:14,anchor:'middle',fill:'#9a5a2b'});
      [[205,222,0,-1],[130,226,-.5,-1],[280,226,.5,-1],[80,306,-1,0],[205,392,0,1],[130,388,-.5,1]].forEach(([x,y,dx,dy],i)=>{const k=reduceMotion?0:3*Math.sin(ck*3+i);h+=L(f(x+dx*k),f(y+dy*k),f(x+dx*(30+k)),f(y+dy*(30+k)),{stroke:P.red,w:4,arrow:true,op:f(.3+.7*act)});});
      h+=T(205,452,'放熱：周圍的溫度升高',{size:17,anchor:'middle',weight:700,fill:P.red});}
    else{h+=`<rect x="102" y="262" width="206" height="120" fill="${WARM(Tc)}" fill-opacity=".4"/>`+L(102,262,308,262,{stroke:WARM(Tc),w:3});
      for(let i=0;i<14;i++){const r=3.2*clamp(1-t/8+rnd(i)*.3,0,1);if(r>.4)h+=`<rect x="${f(124+rnd(i+3)*160)}" y="${f(374-rnd(i+8)*14-r)}" width="${f(r*2)}" height="${f(r*2)}" rx="1" fill="#fff" stroke="#a9a595"/>`;}
      h+=beakerPath(100,310,196,384)+T(205,330,'水 ＋ 硝酸銨',{size:17,anchor:'middle',weight:700,fill:'#2f6b99'});
      [[72,306,1,0],[72,350,1,0],[338,306,-1,0],[338,350,-1,0]].forEach(([x,y,dx],i)=>{const k=reduceMotion?0:3*Math.sin(ck*3+i);h+=L(f(x-dx*(30-k)),y,f(x+dx*k),y,{stroke:P.blue,w:4,arrow:true,op:f(.3+.7*act)});});
      h+=T(205,452,'吸熱：周圍的溫度降低',{size:17,anchor:'middle',weight:700,fill:P.blue});}
    h+=glassTherm(warm?356:286,warm?368:362,120,yT(Tc),{c:ALC,br:9,w:4})+thermTicks(warm?368:298,0,60,5,10,yT,{size:14})+T(warm?336:266,134,tnum(Tc)+'°C',{size:24,anchor:'end',weight:700,fill:c});
    /* 圖 */
    const X=v=>606+v*24,Y=v=>410-v*4.6;h+=PHASE_panel(540,30,340,450)+T(710,62,'溫度隨時間的變化（示意）',{size:16,anchor:'middle',weight:700});
    for(let v=0;v<=60;v+=10)h+=L(606,f(Y(v)),846,f(Y(v)),{stroke:P.faint,w:1,dash:'3 5'})+T(598,f(Y(v)+5),v,{size:14,anchor:'end',fill:P.muted});
    for(let v=0;v<=10;v+=2)h+=L(X(v),410,X(v),416,{stroke:P.muted})+T(X(v),434,v,{size:14,anchor:'middle',fill:P.muted});
    h+=L(606,410,852,410,{stroke:P.muted,w:1.5})+L(606,410,606,112,{stroke:P.muted,w:1.5})+T(612,106,'溫度（°C）',{size:14,fill:P.muted})+T(846,460,'時間（分鐘）',{size:14,anchor:'end',fill:P.muted});
    h+=L(606,f(Y(25)),846,f(Y(25)),{stroke:P.accent,w:1.5,dash:'5 4'})+T(842,f(Y(25)+(warm?19:-8)),'室溫 25°C',{size:14,anchor:'end',fill:P.accent});
    const path=e=>{let d='';for(let v=0;v<=e+1e-6;v+=.25)d+=(d?'L':'M')+f(X(v))+' '+f(Y(Tat(v)));return d;};
    h+=`<path d="${path(10)}" fill="none" stroke="${c}" stroke-width="2.5" opacity=".28"/><path d="${path(t)}" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/><circle cx="${f(X(t))}" cy="${f(Y(Tc))}" r="7" fill="${c}" stroke="#fff" stroke-width="2.5"/>`;
    return {svg:h,reads:[['經過時間',t.toFixed(1)+' 分鐘'],['溫度（示意）',tnum(Tc)+'°C'],['熱',warm?'放熱':'吸熱']],
      note:warm?'<b>暖暖包</b>：撕開包裝後，裡面的鐵粉和空氣中的氧作用，<b>放熱</b>，所以摸起來變熱。放熱的例子還有燃燒、白色硫酸銅粉末遇水。<br>溫度數值是示意。':'<b>硝酸銨溶於水</b>會<b>吸熱</b>，水溫下降，拋棄式冷敷包就是利用這個原理。吸熱的例子還有加熱硫酸銅晶體、冰熔化、水蒸發。<br>溫度數值是示意。'};}
};

/* ===== 5-5 熱的傳播方式 ===== */
/* ===== 5-5 熱的傳播方式：傳導、對流、輻射、保溫瓶、判斷題 ===== */
const TRANSFER_MAT={
  ag:{n:'銀',a:1.66,c1:'#f6f8fa',c2:'#b4bcc5'},cu:{n:'銅',a:1.11,c1:'#f1b98f',c2:'#b3683d'},al:{n:'鋁',a:.97,c1:'#e9edf0',c2:'#a3adb6'},
  fe:{n:'鐵',a:.23,c1:'#b4bac1',c2:'#69717a'},gl:{n:'玻璃',a:.0034,c1:'#eaf8fb',c2:'#a8d2db'},wd:{n:'木',a:.0012,c1:'#e6c696',c2:'#a87b44'}};
const TRANSFER_ORDER=['ag','cu','al','fe','gl','wd'];
/* 一維熱擴散：棒長 21 cm、每格 0.5 cm；x＝0 維持 400°C，另一端絕熱，側面少量散熱。每 1 秒存一筆，共 120 秒 */
const TRANSFER_CACHE={};
function transferRod(k){if(TRANSFER_CACHE[k])return TRANSFER_CACHE[k];
  const a=TRANSFER_MAT[k].a,N=43,dx=.5,dt=.05,r=a*dt/dx/dx,snaps=[];let u=new Array(N).fill(25);u[0]=400;
  for(let i=0;i<=2400;i++){if(i%20===0)snaps.push(u.slice());const w=u.slice();
    for(let j=1;j<N;j++){const rt=j<N-1?u[j+1]:u[j-1];w[j]=u[j]+r*(u[j-1]-2*u[j]+rt)-.004*dt*(u[j]-25);}u=w;}
  return TRANSFER_CACHE[k]=snaps;}
function transferRodT(k,x,t){const S=transferRod(k),ti=clamp(t,0,120),i0=Math.min(119,Math.floor(ti)),ft=ti-i0,xj=clamp(x/.5,0,42),j0=Math.min(41,Math.floor(xj)),fx=xj-j0;
  const at=i=>S[i][j0]+(S[i][j0+1]-S[i][j0])*fx;return at(i0)+(at(i0+1)-at(i0))*ft;}
/* 蠟在 60°C 熔化：回傳火柴掉落的時間（120 秒內沒掉回傳 999） */
function transferDrop(k,x){const key=k+'@'+x;if(TRANSFER_CACHE[key]!==undefined)return TRANSFER_CACHE[key];let out=999;
  for(let t=1;t<=120;t++){const b=transferRodT(k,x,t);if(b>=60){const a=transferRodT(k,x,t-1);out=t-1+(60-a)/(b-a);break;}}
  return TRANSFER_CACHE[key]=out;}
const transferGlow=T=>{const f=clamp((T-25)/375,0,1);return [`rgb(255,${Math.round(196-150*f)},${Math.round(72-44*f)})`,f<.004?0:Math.min(.95,1.5*Math.pow(f,.72))];};
/* 試管：上層 a、下層 b 兩區，冰塊比例 f。熱在下方時靠對流混合得快，熱在上方時只靠傳導（很慢） */
function transferTube(th){const key='tube'+th;if(TRANSFER_CACHE[key])return TRANSFER_CACHE[key];
  const top=th==='top',dt=.05,out=[];let a=10,b=10,f=1;
  for(let i=0;i<=2400;i++){if(i%10===0)out.push([a,b,f]);let qa=top?2.6:0,qb=top?0:2.6;const ex=(top?.0015:.6)*(b-a);qa+=ex;qb-=ex;
    if(f>0){const q=(top?.012:.07)*Math.cbrt(f*f)*(top?b:a);if(top)qb-=q;else qa-=q;f=Math.max(0,f-q*dt/60);}
    a=clamp(a+qa*dt,0,100);b=clamp(b+qb*dt,0,100);}
  return TRANSFER_CACHE[key]=out;}
/* 對流的流場：在 u＝h 處上升的兩個環流；v0～v1 是有流動的高度範圍（v 由底往上） */
function transferFlow(s){if(s.cs==='room'){const ac=s.rd==='ac',w=s.wrong;return {h:ac?0:1,v0:w&&!ac?.74:0,v1:w&&ac?.26:1,k:w?.06:.085};}
  return {h:({l:.14,c:.5,r:.86})[s.hp],v0:0,v1:1,k:.036*s.pw};}
function transferVel(f,u,v){if(v<f.v0||v>f.v1||f.k<=0)return [0,0];const bh=f.v1-f.v0,e=(v-f.v0)/bh,PI=Math.PI;let du,dv;
  if(u<f.h){const w=Math.max(f.h,.001),x=u/w;du=w*PI*Math.sin(PI*x)*Math.cos(PI*e);dv=-PI*Math.cos(PI*x)*Math.sin(PI*e);}
  else{const w=Math.max(1-f.h,.001),x=(u-f.h)/w;du=-w*PI*Math.sin(PI*x)*Math.cos(PI*e);dv=PI*Math.cos(PI*x)*Math.sin(PI*e);}
  return [du*f.k,dv*f.k*bh];}
const TRANSFER_PTS=(()=>{const a=[];for(let i=0;i<54;i++){a.push(+(((i%9)+.5+(rnd(i+3)-.5)*.8)/9).toFixed(3),+((Math.floor(i/9)+.5+(rnd(i+91)-.5)*.8)/6).toFixed(3));}return a;})();
/* 黑罐、亮罐：吸收率＝放射率 e；開燈由 25°C 升溫，關燈由 60°C 降溫（示意） */
const TRANSFER_E=[.9,.2];
function transferCan(s,j,t){const e=TRANSFER_E[j],k=.06+.12*e;if(s.rp==='off')return 25+35*Math.exp(-k*t);const eq=25+1200*e/(s.rdist*s.rdist*k);return eq+(25-eq)*Math.exp(-k*t);}
/* 保溫瓶：三種途徑的散熱係數（每小時），水 500 g */
function transferBottle(s,ideal){const air=!ideal&&s.bair,nos=!ideal&&s.bnos,open=!ideal&&s.bopen,hot=s.bc==='hot';
  const c=.006+(air?.03:0),v=.002+(air?.06:0)+(open?(hot?.22:.05):0),r=nos?.05:.005;return {c,v,r,k:c+v+r,T0:hot?95:4};}
const transferBT=(m,t)=>25+(m.T0-25)*Math.exp(-m.k*t);
const transferClock=s=>s.mode==='cond'?['ct',120,8]:s.mode==='conv'&&s.cs==='tube'?['tt',120,6]:s.mode==='rad'?['rt',20,1.4]:s.mode==='bottle'?['bt',12,.9]:0;
const TRANSFER_PLAY={type:'buttons',label:'時間',items:[['播放',s=>{const k=transferClock(s);if(k){if(s[k[0]]>=k[1])s[k[0]]=0;s.run=true;}}],['暫停',s=>{s.run=false;}],['從頭',s=>{const k=transferClock(s);if(k)s[k[0]]=0;s.run=false;}]],show:s=>!!transferClock(s)};

/* ---------- 畫圖用的小工具 ---------- */
function transferArrow(x1,y1,x2,y2,c,o={}){const{w=4,op=1}=o,dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy);if(l<6)return '';const ux=dx/l,uy=dy/l,a=Math.min(l*.6,w*2.7),bx=x2-ux*a,by=y2-uy*a,n=a*.55;
  return `<g opacity="${op}"><line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx-uy*n).toFixed(1)} ${(by+ux*n).toFixed(1)}L${(bx+uy*n).toFixed(1)} ${(by-ux*n).toFixed(1)}Z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/></g>`;}
/* 波浪箭頭：代表輻射 */
function transferWavy(x1,y1,x2,y2,c,o={}){const{w=2.6,amp=5,wl=18,ph=0,op=1}=o,dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy);if(l<14)return '';const ux=dx/l,uy=dy/l,body=l-11;let d='';
  for(let q=0;q<=body;q+=2.5){const a=amp*Math.sin(q/wl*2*Math.PI-ph)*Math.min(1,q/7,(body-q)/7);d+=(q?'L':'M')+(x1+ux*q-uy*a).toFixed(1)+' '+(y1+uy*q+ux*a).toFixed(1);}
  const bx=x2-ux*11,by=y2-uy*11;
  return `<g opacity="${op}"><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x2.toFixed(1)} ${y2.toFixed(1)}L${(bx-uy*5.5).toFixed(1)} ${(by+ux*5.5).toFixed(1)}L${(bx+uy*5.5).toFixed(1)} ${(by-ux*5.5).toFixed(1)}Z" fill="${c}"/></g>`;}
function transferFlame(x,yb,h,an,sc=1){const H=h*(1+.07*Math.sin(an*9)+.04*Math.sin(an*14.3)),sw=2.2*Math.sin(an*5.1),w=h*.36*sc,f=(W,HH,fill)=>`<path d="M${x} ${yb}C${x-W} ${yb-HH*.3} ${x-W*.55+sw} ${yb-HH*.72} ${x+sw} ${yb-HH}C${x+W*.55+sw} ${yb-HH*.72} ${x+W} ${yb-HH*.3} ${x} ${yb}Z" fill="${fill}"/>`;
  return f(w,H,'url(#tr-flame)')+f(w*.5,H*.58,'#fff3b0')+f(w*.24,H*.3,'#8fc9ff');}
/* 酒精燈：火焰尖端在 yTip，底部墊到桌面 table */
function transferLamp(x,yTip,table,an,fh=40){const yb=yTip+fh,b=yb+62;let h='';
  if(table-b>3)h+=`<rect x="${x-44}" y="${b}" width="88" height="${table-b}" rx="3" fill="#d9b98a" stroke="#b08a57" stroke-width="1.5"/>`;
  h+=`<path d="M${x-12} ${yb+16}C${x-44} ${yb+22} ${x-48} ${yb+58} ${x-36} ${yb+62}H${x+36}C${x+48} ${yb+58} ${x+44} ${yb+22} ${x+12} ${yb+16}Z" fill="#f4fbfd" stroke="#83999d" stroke-width="2.5"/>`
    +`<path d="M${x-39} ${yb+40}C${x-42} ${yb+52} ${x-40} ${yb+59} ${x-35} ${yb+60}H${x+35}C${x+40} ${yb+59} ${x+42} ${yb+52} ${x+39} ${yb+40}Z" fill="#bfe0f2"/>`
    +`<rect x="${x-3}" y="${yb-5}" width="6" height="14" rx="2" fill="#f1ead8" stroke="#b9b09a"/><rect x="${x-13}" y="${yb+6}" width="26" height="11" rx="3" fill="#c7cdd2" stroke="#8a959c" stroke-width="1.5"/>`;
  return h+transferFlame(x,yb-3,fh-3,an);}
const transferPill=(x,y,w,h,t,o={})=>{const{c=P.ink,bg='#fffdf8',bd='#ddd7c9',size=16,weight=700}=o;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(h/2,12)}" fill="${bg}" stroke="${bd}" stroke-width="1.5"/>`+T(x+w/2,y+h/2+size*.36,t,{size,fill:c,anchor:'middle',weight});};
const transferPanel=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fffdf8" stroke="#ddd7c9"/>`;
/* 環流箭頭：紅色上升、藍色下沉 */
function transferLoop(bx,by,bw,bh,f,o={}){const{op=.5,w=5}=o;let h='';const y1=by+bh*(1-f.v1),y2=by+bh*(1-f.v0);
  [[0,f.h,1],[f.h,1,0]].forEach(([a,b,ur])=>{const cw=(b-a)*bw;if(cw<80)return;const m=Math.min(36,cw*.2),my=Math.min(32,(y2-y1)*.24),xL=bx+a*bw+m,xR=bx+b*bw-m,yt=y1+my,yb=y2-my,xu=ur?xR:xL,xd=ur?xL:xR,g=16,sg=xd>xu?1:-1;
    h+=transferArrow(xu,yb-g,xu,yt+g,P.red,{w,op})+transferArrow(xu+sg*g,yt,xd-sg*g,yt,'#8d8f95',{w,op})+transferArrow(xd,yt+g,xd,yb-g,P.blue,{w,op})+transferArrow(xd-sg*g,yb,xu+sg*g,yb,'#8d8f95',{w,op});});
  return h;}
const TRANSFER_DEFS=`<radialGradient id="tr-flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#ffd35a"/><stop offset=".6" stop-color="#ff9a3c"/><stop offset="1" stop-color="#f0642c"/></radialGradient>`
  +`<linearGradient id="tr-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aeb7bf"/><stop offset=".35" stop-color="#eef2f5"/><stop offset=".7" stop-color="#c3cbd2"/><stop offset="1" stop-color="#98a2ab"/></linearGradient>`
  +`<linearGradient id="tr-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa5ae"/><stop offset=".22" stop-color="#f7fafc"/><stop offset=".45" stop-color="#c2cbd3"/><stop offset=".7" stop-color="#eef2f5"/><stop offset="1" stop-color="#8f9aa3"/></linearGradient>`
  +`<linearGradient id="tr-black" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#23272b"/><stop offset=".3" stop-color="#4a5056"/><stop offset=".6" stop-color="#2c3035"/><stop offset="1" stop-color="#1b1e21"/></linearGradient>`;
function transferGraph(x0,x1,y0,y1,xs,ys,xl,yl){let h='';
  ys.forEach(([v,y])=>{h+=L(x0,y,x1,y,{stroke:P.faint,w:1,dash:'3 5'})+T(x0-8,y+5,v,{size:15,anchor:'end',fill:P.muted});});
  xs.forEach(([v,x])=>{h+=L(x,y0,x,y0+6,{stroke:P.muted})+T(x,y0+24,v,{size:15,anchor:'middle',fill:P.muted});});
  return h+L(x0,y0,x1+6,y0,{stroke:P.muted,w:1.5})+L(x0,y0,x0,y1-10,{stroke:P.muted,w:1.5})+T(x0+6,y1-14,yl,{size:15,fill:P.muted})+T(x1,y0+46,xl,{size:15,anchor:'end',fill:P.muted});}
/* 簡單的人：腳底 (x,yf)、身高 h */
function transferPerson(x,yf,h,c='#5d8fb3',o={}){const r=h*.105,hy=yf-h+r,sh=hy+r+4,hip=yf-h*.42,w=h*.15;
  return `<rect x="${x-w*.8}" y="${hip-4}" width="${w*.7}" height="${yf-hip+4}" rx="${w*.3}" fill="#48586a"/><rect x="${x+w*.1}" y="${hip-4}" width="${w*.7}" height="${yf-hip+4}" rx="${w*.3}" fill="#48586a"/>`
    +`<rect x="${x-w*(o.puff?1.35:1)}" y="${sh}" width="${w*(o.puff?2.7:2)}" height="${hip-sh+6}" rx="${w*(o.puff?.7:.55)}" fill="${c}"/>`
    +`<circle cx="${x}" cy="${hy}" r="${r}" fill="#f2c9a5" stroke="#c99a76" stroke-width="1.5"/>`;}

/* ---------- 「是哪一種傳播」的情境 ---------- */
const TRANSFER_WAY=['傳導','對流','輻射'];
const TRANSFER_W=[
  {t:'金屬湯匙放在熱湯裡，握柄漸漸變燙',a:0,sc:'spoon',why:['熱沿著金屬湯匙，由泡在湯裡的高溫端','傳到握柄；湯匙本身沒有流動。']},
  {t:'燒開水時，鍋裡的水上下翻滾，整鍋都變熱',a:1,sc:'boil',why:['底部的水受熱膨脹、密度變小而上升，','較冷的水下沉補過來，水流動時把熱帶走。']},
  {t:'曬太陽時，身體覺得暖和',a:2,sc:'sun',why:['太陽和地球之間幾乎是真空，沒有介質，','熱只能用輻射傳過來。']},
  {t:'開冷氣後，整個房間的空氣都變涼',a:1,sc:'ac',why:['冷空氣密度較大而下沉，較熱的空氣上升，','空氣在房間裡循環流動。']},
  {t:'鍋子的握柄做成塑膠，是為了減少哪一種傳熱？',a:0,sc:'pan',why:['熱會沿著金屬鍋身傳導到握柄；','塑膠是熱的不良導體，握柄才不燙手。']},
  {t:'站在烤箱前面，隔著一段距離臉也覺得熱',a:2,sc:'oven',why:['熱空氣是往上升的，不會往旁邊流到臉上；','臉感受到的是烤箱向四周放出的輻射。']},
  {t:'點火加熱後，熱氣球慢慢升空',a:1,sc:'balloon',why:['球內的空氣受熱膨脹、密度變小而上升，','和熱水上升是同樣的道理。']},
  {t:'羽絨衣困住空氣不讓它流動，熱只能靠什麼方式穿過？',a:0,sc:'jacket',why:['空氣不流動就不能對流，熱只能靠傳導；','空氣是熱的不良導體，所以散熱很慢。']},
  {t:'烤肉時站在炭火旁邊（不是上方），臉覺得熱',a:2,sc:'bbq',why:['熱空氣往上升，不會流向旁邊的人；','傳到臉上的是炭火放出的輻射。']},
  {t:'冰塊浮在飲料上方，整杯飲料很快都變涼',a:1,sc:'ice',why:['冰塊旁的飲料變冷、密度變大而下沉，','下方較溫的飲料上升，形成對流。']}];
const TRANSFER_SCENE={
  spoon(){let h=`<defs><linearGradient id="tr-spoon" gradientUnits="userSpaceOnUse" x1="235" y1="245" x2="370" y2="150"><stop offset="0" stop-color="#e2553a"/><stop offset=".55" stop-color="#e9a25c"/><stop offset="1" stop-color="#c5ccd2"/></linearGradient></defs>`;
    h+=`<rect x="60" y="305" width="390" height="10" rx="5" fill="#d9c9a8"/>`;
    for(let i=0;i<3;i++)h+=`<path d="M${160+i*40} 195q-9 -14 0 -28q9 -14 0 -28" fill="none" stroke="#c9a08a" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;
    h+=`<path d="M112 222Q118 305 225 305Q332 305 338 222Z" fill="#fbfdff" stroke="#83999d" stroke-width="3" stroke-linejoin="round"/><ellipse cx="225" cy="222" rx="113" ry="17" fill="#e39a55" stroke="#83999d" stroke-width="3"/>`;
    h+=`<line x1="238" y1="240" x2="370" y2="150" stroke="url(#tr-spoon)" stroke-width="11" stroke-linecap="round"/><ellipse cx="225" cy="222" rx="60" ry="8" fill="#e39a55"/>`;
    h+=`<rect x="398" y="127" width="58" height="30" rx="12" fill="#a9c1d1" transform="rotate(-34 382 142)"/><rect x="356" y="123" width="52" height="38" rx="15" fill="#f2c9a5" stroke="#c99a76" stroke-width="2" transform="rotate(-34 382 142)"/>`;
    return h+transferArrow(250,196,318,150,P.red,{w:4})+T(256,160,'熱',{size:18,fill:P.red,weight:700})+T(225,278,'熱湯',{size:17,anchor:'middle',fill:P.muted});},
  boil(){let h=`<rect x="150" y="150" width="210" height="140" fill="#9cc9ea" fill-opacity=".5"/>`+L(150,150,360,150,{stroke:'#6da9d4',w:3})+`<path d="M146 122V292H364V122" fill="none" stroke="#6f7c84" stroke-width="5" stroke-linejoin="round"/>`+L(120,134,146,134,{stroke:'#6f7c84',w:6})+L(364,134,390,134,{stroke:'#6f7c84',w:6});
    h+=transferArrow(255,270,255,176,P.red,{w:5})+transferArrow(238,166,196,166,'#8d8f95',{w:4})+transferArrow(272,166,314,166,'#8d8f95',{w:4})+transferArrow(180,178,180,268,P.blue,{w:5})+transferArrow(330,178,330,268,P.blue,{w:5});
    [[222,250,5],[286,232,4],[240,210,3.5],[275,268,4.5]].forEach(([x,y,r])=>{h+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".8" stroke="#6da9d4"/>`;});
    h+=`<rect x="165" y="318" width="180" height="16" rx="6" fill="#4a5860"/>`;for(let i=0;i<4;i++)h+=transferFlame(195+i*40,318,24,i*1.7);
    return h;},
  sun(){let h=`<circle cx="105" cy="140" r="56" fill="#ffd45a" fill-opacity=".25"/><circle cx="105" cy="140" r="36" fill="#ffc93c" stroke="#f0a020" stroke-width="2"/>`+L(40,332,470,332,{stroke:'#b9ad8f',w:3});
    [[150,150,330,196],[146,170,322,236],[136,188,314,276]].forEach(([a,b,c,d],i)=>{h+=transferWavy(a,b,c,d,'#e58a1f',{ph:i*1.3});});
    return h+transferPerson(380,332,170,'#5d8fb3')+T(105,226,'太陽',{size:17,anchor:'middle',fill:P.muted});},
  ac(){let h=`<rect x="64" y="98" width="382" height="234" rx="4" fill="#eef5fa" stroke="#7e8b92" stroke-width="4"/><rect x="352" y="110" width="84" height="30" rx="6" fill="#fff" stroke="#7e8b92" stroke-width="2"/>`+L(362,132,426,132,{stroke:'#9aa8b0',w:2})+T(394,128,'冷氣',{size:14,anchor:'middle',fill:P.muted});
    h+=transferArrow(404,150,404,300,P.blue,{w:5})+transferArrow(384,314,124,314,'#8d8f95',{w:5})+transferArrow(104,298,104,138,P.red,{w:5})+transferArrow(124,122,330,122,'#8d8f95',{w:5});
    return h+transferPerson(250,332,150,'#6fa58a')+T(390,226,'冷空氣',{size:15,anchor:'end',fill:P.blue,weight:700})+T(120,226,'較熱的空氣',{size:15,fill:P.red,weight:700});},
  pan(){let h=`<rect x="90" y="292" width="250" height="18" rx="6" fill="#4a5860"/>`;for(let i=0;i<4;i++)h+=transferFlame(150+i*40,292,26,i*2.1);
    h+=`<path d="M100 226H330L318 262H112Z" fill="url(#tr-steel)" stroke="#6f7c84" stroke-width="3" stroke-linejoin="round"/><rect x="326" y="226" width="118" height="20" rx="10" fill="#2f3438"/>`;
    h+=`<rect x="372" y="212" width="58" height="46" rx="17" fill="#f2c9a5" stroke="#c99a76" stroke-width="2"/><rect x="424" y="218" width="50" height="34" rx="12" fill="#a9c1d1"/>`;
    h+=L(350,222,330,180,{stroke:P.muted,w:1.5})+T(330,172,'塑膠握柄',{size:16,anchor:'middle',weight:700})+L(200,224,190,180,{stroke:P.muted,w:1.5})+T(190,172,'金屬鍋身',{size:16,anchor:'middle',weight:700});
    return h+transferArrow(230,244,312,244,P.red,{w:4});},
  oven(){let h=L(40,332,470,332,{stroke:'#b9ad8f',w:3})+`<rect x="60" y="232" width="210" height="100" fill="#e8dfcc" stroke="#b9ad8f" stroke-width="2"/><rect x="72" y="112" width="186" height="120" rx="10" fill="#dfe4e8" stroke="#6f7c84" stroke-width="3"/><rect x="88" y="128" width="118" height="88" rx="6" fill="#ffb05a" stroke="#6f7c84" stroke-width="2"/>`;
    for(let i=0;i<3;i++)h+=L(96,150+i*22,198,150+i*22,{stroke:'#f0642c',w:4});
    h+=`<circle cx="232" cy="146" r="9" fill="#6f7c84"/><circle cx="232" cy="180" r="9" fill="#6f7c84"/>`;
    [150,176,202].forEach((y,i)=>{h+=transferWavy(214,y,348,y-6+i*6,'#e0662c',{ph:i*1.4});});
    [112,150,188].forEach(x=>{h+=transferArrow(x,104,x,84,'#9aa0a6',{w:3,op:.8});});
    return h+transferPerson(392,332,172,'#b0825f');},
  balloon(){let h=`<path d="M255 82C170 82 150 160 176 214L232 286H278L334 214C360 160 340 82 255 82Z" fill="#f6c453" stroke="#c98a1b" stroke-width="3"/><path d="M255 82C225 110 222 220 244 286M255 82C285 110 288 220 266 286" fill="none" stroke="#e0662c" stroke-width="3"/>`;
    h+=L(236,286,240,318,{stroke:'#7b6a55',w:2})+L(274,286,270,318,{stroke:'#7b6a55',w:2})+`<rect x="236" y="318" width="38" height="26" rx="4" fill="#b98a55" stroke="#8a6238" stroke-width="2"/>`+transferFlame(255,312,24,1.2);
    h+=transferArrow(255,262,255,150,P.red,{w:5,op:.85})+transferArrow(222,246,206,166,P.red,{w:4,op:.6})+transferArrow(288,246,304,166,P.red,{w:4,op:.6});
    return h+T(372,170,'熱空氣',{size:16,fill:P.red,weight:700})+L(366,165,318,165,{stroke:P.muted,w:1.5});},
  jacket(){let h=L(40,332,470,332,{stroke:'#b9ad8f',w:3})+transferPerson(160,332,190,'#d9785a',{puff:true});
    for(let i=0;i<4;i++)h+=L(124,196+i*18,196,196+i*18,{stroke:'#b85a3f',w:2});
    h+=`<rect x="108" y="184" width="20" height="74" rx="9" fill="#d9785a"/><rect x="192" y="184" width="20" height="74" rx="9" fill="#d9785a"/>`;
    h+=L(198,214,290,180,{stroke:P.muted,w:1.5,dash:'4 4'})+`<circle cx="360" cy="190" r="80" fill="#fffdf8" stroke="#b9ad8f" stroke-width="2.5"/>`;
    [[318,170,30],[352,150,-20],[392,176,40],[336,214,-35],[386,222,15]].forEach(([x,y,r])=>{h+=`<g transform="rotate(${r} ${x} ${y})"><path d="M${x-24} ${y}H${x+24}M${x-14} ${y}l-7 -9M${x-14} ${y}l-7 9M${x} ${y}l-7 -10M${x} ${y}l-7 10M${x+13} ${y}l-7 -9M${x+13} ${y}l-7 9" fill="none" stroke="#c9b79a" stroke-width="2" stroke-linecap="round"/></g>`;});
    for(let i=0;i<14;i++)h+=`<circle cx="${(304+rnd(i+40)*112).toFixed(0)}" cy="${(136+rnd(i+70)*104).toFixed(0)}" r="3.2" fill="${P.blue}" opacity=".55"/>`;
    return h+T(360,294,'羽絨之間：不流動的空氣',{size:15,anchor:'middle',fill:P.muted});},
  bbq(){let h=L(40,332,470,332,{stroke:'#b9ad8f',w:3})+L(132,262,116,332,{stroke:'#4a5860',w:5})+L(268,262,284,332,{stroke:'#4a5860',w:5})+`<path d="M110 232H290L276 264H124Z" fill="#3b4348" stroke="#2a3034" stroke-width="2"/>`;
    for(let i=0;i<7;i++)h+=`<circle cx="${134+i*22}" cy="${238+(i%2)*3}" r="9" fill="${i%2?'#e2553a':'#f08a3c'}"/>`;
    h+=L(116,226,284,226,{stroke:'#8a959c',w:3});
    [160,200,240].forEach(x=>{h+=transferArrow(x,206,x,128,'#9aa0a6',{w:4,op:.8});});
    [[292,236,356,212],[292,246,352,244]].forEach(([a,b,c,d],i)=>{h+=transferWavy(a,b,c,d,'#e0662c',{ph:i*1.5});});
    return h+T(200,114,'熱空氣往上升',{size:15,anchor:'middle',fill:P.muted})+transferPerson(400,332,172,'#6fa58a');},
  ice(){let h=`<rect x="60" y="322" width="390" height="10" rx="5" fill="#d9c9a8"/><path d="M178 132L190 318H320L332 132Z" fill="#e7b76a" fill-opacity=".45"/>`+L(178,132,332,132,{stroke:'#c98f3a',w:3});
    [[206,124,-8],[250,120,6],[292,126,-4]].forEach(([x,y,r])=>{h+=`<rect x="${x-17}" y="${y-13}" width="34" height="30" rx="5" fill="#eef8ff" stroke="#8fc3e3" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`;});
    h+=`<path d="M172 100L188 320H322L338 100" fill="none" stroke="#83999d" stroke-width="4" stroke-linejoin="round"/>`;
    h+=transferArrow(255,168,255,292,P.blue,{w:5})+transferArrow(212,296,208,176,P.red,{w:4,op:.75})+transferArrow(298,296,302,176,P.red,{w:4,op:.75});
    return h+T(350,222,'變冷的飲料',{size:15,fill:P.blue,weight:700})+T(350,244,'下沉',{size:15,fill:P.blue,weight:700})+L(344,224,264,230,{stroke:P.muted,w:1.5});}};

/* ---------- 想一想與例題 ---------- */
const TRANSFER_Q={
  cond:['冬天教室裡的鐵椅和木椅溫度一樣（都是室溫），為什麼摸起來鐵椅比較冰？','手的溫度比椅子高，熱由手傳到椅子。<b>鐵是熱的良導體</b>，手上的熱很快被傳走，手的溫度下降得快，就覺得冰；木頭是<b>不良導體</b>，熱傳得慢，手不太降溫。兩張椅子的溫度其實相同，這也說明用手感覺冷熱不可靠。'],
  conv:['白天在海邊，風常常從海面吹向陸地（海風）。這和對流有什麼關係？','陸地（砂石）的比熱比水小，白天受日照後<b>升溫比海水快</b>。陸地上方的空氣受熱膨脹、密度變小而<b>上升</b>，海面上較冷、密度較大的空氣流過來補充，就形成<b>海風</b>。晚上陸地降溫比較快，方向反過來，成為<b>陸風</b>。這是大範圍的空氣對流。'],
  rad:['太陽能熱水器的集熱板為什麼塗成黑色？夏天為什麼穿淺色衣服比較涼？','<b>黑色、粗糙</b>的表面容易<b>吸收</b>輻射，集熱板塗黑可以吸收較多太陽的輻射熱，水溫升得快。<b>白色、光亮</b>的表面容易<b>反射</b>輻射，吸收得少，所以夏天穿淺色衣服比較涼。'],
  bottle:['保溫瓶摔過以後，外表沒破，卻變得不保溫了。最可能是哪裡壞了？','最可能是內、外層之間的<b>真空夾層漏氣</b>了。夾層裡一旦有空氣，熱就能靠<b>傳導和對流</b>穿過夾層，散熱變快很多。（打開「夾層灌入空氣」比較曲線）'],
  which:['站在營火旁邊覺得熱，為什麼說主要是輻射，而不是傳導或對流？','空氣是熱的<b>不良導體</b>，隔著一段距離，靠傳導傳過來的熱很少。被火加熱的空氣密度變小會<b>往上升</b>，不會往旁邊流向人，所以也不是對流。火向四周放出的<b>輻射</b>不需要介質，可以直接傳到身上；用手或木板擋住臉，馬上就不那麼熱。']};
const TRANSFER_QUIZ=[
  {q:'粗細、長度相同的銅棒和鐵棒，各用蠟黏上幾根火柴，從兩棒相接的地方同時加熱。下列敘述何者正確？',opts:['鐵棒上的火柴先掉落','銅棒上的火柴先掉落','兩邊離火焰一樣遠的火柴同時掉落','離火焰最遠的火柴最先掉落'],ans:1,
    sol:'銅的導熱比鐵快，同樣的距離，銅棒比較早達到蠟熔化的溫度，所以<b>銅棒上的火柴先掉落</b>；同一根棒子上，離火焰近的先掉。',go:s=>{s.mode='cond';s.cmp=true;s.mat='cu';s.matB='fe';s.ct=0;s.run=true;},goLabel:'用銅棒和鐵棒驗證'},
  {q:'固體以傳導的方式傳熱時，物質的粒子是怎麼運動的？',opts:['由高溫處流動到低溫處','受熱後上升，冷卻後下沉','在原來的位置振動，把振動傳給相鄰的粒子','粒子靜止不動，熱自己穿過去'],ans:2,
    sol:'傳導時，高溫處的粒子振動比較劇烈，並把振動<b>傳給相鄰的粒子</b>，熱就一路傳過去。粒子<b>留在原位</b>，物質本身沒有移動。',go:s=>{s.mode='cond';s.cmp=false;s.mat='cu';s.ct=30;s.run=false;},goLabel:'看粒子放大圖'},
  {q:'下列物質中，哪一個最不容易傳導熱？',opts:['銅','鋁','鐵','空氣'],ans:3,
    sol:'金屬是熱的良導體；液體、氣體是不良導體，其中<b>空氣</b>的導熱很差。羽絨衣、雙層玻璃窗、保麗龍都是利用不流動的空氣來隔熱。'},
  {q:'試管裝水，用鐵絲網把冰塊壓在管底，再用酒精燈加熱試管上端的水。上端的水沸騰了，冰塊卻幾乎沒有熔化。這個實驗說明什麼？',opts:['水是熱的良導體','水是熱的不良導體，而且熱水留在上方，不會形成對流','冰塊不會吸收熱量','熱只能由下往上傳'],ans:1,
    sol:'上端的水受熱後密度變小，本來就在上方，<b>不會往下流</b>，沒有對流；熱只能靠傳導往下傳，而<b>水是熱的不良導體</b>，所以冰塊熔化得很慢。',go:s=>{s.mode='conv';s.cs='tube';s.th='top';s.tt=0;s.run=true;},goLabel:'用試管實驗驗證'},
  {q:'在燒杯底部的一側加熱，水中木屑的運動情形是：',opts:['在原地振動','從加熱處上升，到另一側下沉，不斷循環','全部沉在杯底不動','全部浮在水面不動'],ans:1,
    sol:'加熱處的水膨脹、密度變小而<b>上升</b>，另一側較冷、密度較大的水<b>下沉</b>補過來，水循環流動，木屑跟著繞圈。',go:s=>{s.mode='conv';s.cs='beaker';s.hp='l';s.pw=3;},goLabel:'用燒杯實驗驗證'},
  {q:'冷氣機通常裝在房間的高處，主要原因是：',opts:['冷空氣密度較大會下沉，容易形成對流，使整個房間變涼','冷空氣密度較小會上升','高處的空氣比較熱，不容易傳導','裝在高處輻射比較強'],ans:0,
    sol:'冷氣吹出的<b>冷空氣密度較大而下沉</b>，房間下方較熱的空氣被擠上去，再被冷氣冷卻，形成<b>對流</b>。暖氣則要裝在低處，讓熱空氣上升。',go:s=>{s.mode='conv';s.cs='room';s.rd='ac';s.wrong=false;},goLabel:'看房間的對流'},
  {q:'太陽的熱主要是以哪一種方式傳到地球？',opts:['傳導','對流','輻射','傳導和對流'],ans:2,
    sol:'太陽和地球之間幾乎是<b>真空</b>，沒有介質，傳導和對流都無法進行。<b>輻射</b>不需要介質，在真空中也能傳播。',go:s=>{s.mode='rad';s.rp='on';s.rt=0;s.run=false;},goLabel:'看輻射實驗'},
  {q:'兩個相同的鐵罐，一個塗成黑色、一個是光亮的銀色，裝等量的水，放在燈泡兩側相同距離處照射；一段時間後關燈，讓它們由相同的溫度開始冷卻。下列何者正確？',opts:['黑罐升溫快，降溫也快','黑罐升溫快，降溫慢','亮罐升溫快，降溫也快','兩罐升溫、降溫都一樣快'],ans:0,
    sol:'黑色表面<b>容易吸收</b>輻射，照光時升溫快；容易吸收輻射的表面也<b>容易放出</b>輻射，所以由相同溫度開始冷卻時，黑罐降溫也比較快。',go:s=>{s.mode='rad';s.rp='on';s.rdist=15;s.rt=0;s.run=true;},goLabel:'用兩個罐子驗證'},
  {q:'保溫瓶的內、外兩層瓶壁之間抽成真空，主要是為了：',opts:['減少輻射','阻絕傳導和對流','防止水蒸發','讓瓶子比較輕'],ans:1,
    sol:'<b>傳導和對流都需要介質</b>，真空中沒有物質，這兩種方式都無法進行。輻射可以穿過真空，所以還要靠鍍銀面來減少。',go:s=>{s.mode='bottle';s.bc='hot';s.bair=true;s.bnos=false;s.bopen=false;s.bsel='gap';s.bt=6;s.run=false;},goLabel:'把夾層灌入空氣比較'},
  {q:'保溫瓶夾層兩側的瓶壁鍍上光亮的銀，主要是為了減少哪一種方式的熱傳播？',opts:['傳導','對流','輻射','三種都一樣'],ans:2,
    sol:'光亮的表面會把熱<b>輻射反射</b>回去，本身放出的輻射也少，所以能減少輻射造成的散熱。救難用的鋁箔毯也是同樣的道理。',go:s=>{s.mode='bottle';s.bc='hot';s.bair=false;s.bnos=true;s.bopen=false;s.bsel='silver';s.bt=6;s.run=false;},goLabel:'去掉鍍銀比較'}];

/* 動畫每一格都會重畫圖，按下到放開之間元素被換掉時 click 會落空；所以按下的當下就處理 data-tap，隨後的 click 不重複計算 */
let TRANSFER_TAPPED=0;

LABS.transfer={group:4,n:'5-5',keep:['mode'],steps:'mode',
  tasks:s=>({cond:'按「播放」：哪一根火柴先掉？換成鐵、玻璃再比一次，最後打開「兩根一起比」。',
    conv:s.cs==='tube'?'先加熱上端，再改成加熱下端：冰塊熔化的快慢差在哪裡？':s.cs==='room'?'冷氣和暖氣各該裝在高處還是低處？打開「裝在不適合的位置」比較頭和腳的溫度。':'移動熱源、調整火力：木屑從哪裡上升、到哪裡下沉？',
    rad:'按「播放」：哪一個罐子升溫快？再改成「關燈冷卻」，哪一個降溫快？',
    bottle:'點瓶子的各個部分，再一次只拿掉一項：哪一項拿掉後水溫降得最快？',
    which:'先預測是傳導、對流還是輻射，再點圖上的按鈕對答案。'})[s.mode],
  name:'熱的傳播方式',subtitle:'熱由高溫處傳到低溫處，有傳導、對流、輻射三種方式。傳導、對流需要介質；輻射不需要介質，在真空中也能傳播。',
  q:s=>({html:qBlockHTML(TRANSFER_Q[s.mode])+quizHTML(s,TRANSFER_QUIZ)}),
  qAction(s,v){quizAction(s,v,TRANSFER_QUIZ);},
  state:{mode:'cond',an:0,run:false,mat:'cu',cmp:false,matB:'fe',ct:0,cs:'beaker',hp:'l',pw:3,cp:TRANSFER_PTS.slice(),th:'top',tt:0,rd:'ac',wrong:false,
    rp:'on',rdist:15,rt:0,bc:'hot',bair:false,bnos:false,bopen:false,bt:0,bsel:'',wi:0,wa:TRANSFER_W.map(()=>-1),qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'主題',options:[['cond','傳導'],['conv','對流'],['rad','輻射'],['bottle','保溫瓶'],['which','是哪一種傳播']],onChange:s=>{s.run=false;}},
    {type:'seg',key:'mat',label:'棒子的材質',options:TRANSFER_ORDER.map(k=>[k,TRANSFER_MAT[k].n]),show:s=>s.mode==='cond'},
    {type:'toggle',key:'cmp',label:'兩根一起比（中間加熱）',show:s=>s.mode==='cond'},
    {type:'seg',key:'matB',label:'右邊的棒子',options:TRANSFER_ORDER.map(k=>[k,TRANSFER_MAT[k].n]),show:s=>s.mode==='cond'&&s.cmp},
    {type:'range',key:'ct',label:'加熱時間',min:0,max:120,step:1,fmt:s=>Math.round(s.ct)+' 秒',show:s=>s.mode==='cond'},
    {type:'seg',key:'cs',label:'情境',options:[['beaker','燒杯裡的水'],['tube','試管與冰塊'],['room','房間的冷暖氣']],onChange:s=>{s.run=false;},show:s=>s.mode==='conv'},
    {type:'seg',key:'hp',label:'熱源位置',options:[['l','左'],['c','中'],['r','右']],show:s=>s.mode==='conv'&&s.cs==='beaker'},
    {type:'range',key:'pw',label:'火力',min:0,max:5,step:1,fmt:s=>s.pw===0?'關火':s.pw+' 級',show:s=>s.mode==='conv'&&s.cs==='beaker'},
    {type:'seg',key:'th',label:'加熱的位置',options:[['top','加熱上端（冰塊壓在管底）'],['bottom','加熱下端（冰塊浮在上面）']],onChange:s=>{s.tt=0;s.run=false;},show:s=>s.mode==='conv'&&s.cs==='tube'},
    {type:'range',key:'tt',label:'加熱時間',min:0,max:120,step:1,fmt:s=>Math.round(s.tt)+' 秒',show:s=>s.mode==='conv'&&s.cs==='tube'},
    {type:'seg',key:'rd',label:'裝置',options:[['ac','冷氣（夏天）'],['heater','暖氣（冬天）']],show:s=>s.mode==='conv'&&s.cs==='room'},
    {type:'toggle',key:'wrong',label:'裝在不適合的位置',show:s=>s.mode==='conv'&&s.cs==='room'},
    {type:'seg',key:'rp',label:'燈',options:[['on','開燈照射（由 25°C 開始）'],['off','關燈冷卻（都由 60°C 開始）']],onChange:s=>{s.rt=0;s.run=false;},show:s=>s.mode==='rad'},
    {type:'range',key:'rdist',label:'罐子到燈的距離',min:10,max:25,step:1,unit:' cm',show:s=>s.mode==='rad'&&s.rp==='on'},
    {type:'range',key:'rt',label:'經過時間',min:0,max:20,step:.5,fmt:s=>s.rt.toFixed(1)+' 分鐘',show:s=>s.mode==='rad'},
    {type:'seg',key:'bc',label:'瓶裡裝',options:[['hot','熱水 95°C'],['cold','冰水 4°C']],show:s=>s.mode==='bottle'},
    {type:'toggle',key:'bair',label:'夾層灌入空氣（不是真空）',show:s=>s.mode==='bottle'},
    {type:'toggle',key:'bnos',label:'去掉鍍銀',show:s=>s.mode==='bottle'},
    {type:'toggle',key:'bopen',label:'拿掉瓶塞',show:s=>s.mode==='bottle'},
    {type:'range',key:'bt',label:'經過時間',min:0,max:12,step:.5,fmt:s=>s.bt.toFixed(1)+' 小時',show:s=>s.mode==='bottle'},
    TRANSFER_PLAY,
    {type:'buttons',label:'題目',items:[['上一題',s=>{s.wi=(s.wi+TRANSFER_W.length-1)%TRANSFER_W.length;}],['下一題',s=>{s.wi=(s.wi+1)%TRANSFER_W.length;}],['全部重做',s=>{s.wi=0;s.wa=TRANSFER_W.map(()=>-1);}]],show:s=>s.mode==='which'}],
  tick(s,dt){if(!reduceMotion)s.an=(s.an+dt)%3600;const k=transferClock(s);
    if(k&&s.run){s[k[0]]=Math.min(k[1],s[k[0]]+dt*k[2]);if(s[k[0]]>=k[1])s.run=false;}
    if(s.mode==='conv'&&s.cs!=='tube'&&!reduceMotion&&dt>0){const f=transferFlow(s),p=s.cp,h=dt/2;
      for(let n=0;n<2;n++)for(let i=0;i<p.length;i+=2){const[a,b]=transferVel(f,p[i],p[i+1]),[c,d]=transferVel(f,p[i]+a*h/2,p[i+1]+b*h/2);p[i]=clamp(p[i]+c*h,.02,.98);p[i+1]=clamp(p[i+1]+d*h,.02,.98);}}},
  pick(s,id){if(id[0]==='b')s.bsel=s.bsel===id.slice(2)?'':id.slice(2);
    else if(id==='wn')s.wi=(s.wi+1)%TRANSFER_W.length;
    else if(id[0]==='w'&&s.wa[s.wi]<0)s.wa[s.wi]=+id[1];},
  tap(s,id){if(Date.now()-TRANSFER_TAPPED<700)return;this.pick(s,id);},
  render(s){const o=this[s.mode==='conv'?s.cs:s.mode](s);o.svg=`<defs>${TRANSFER_DEFS}</defs>`+o.svg;return o;},

  /* ---------- 1 傳導 ---------- */
  cond(s){const t=s.ct,cmp=s.cmp,Y=112,RH=18,TB=262,px=cmp?15.6:24.5,x0=cmp?340:100,len=cmp?16.6:20.8,pos=cmp?[4,8,12,16]:[4,8,12,16,20];
    const rods=cmp?[[s.mat,-1],[s.matB,1]]:[[s.mat,1]],GY=T=>448-T*.34,an=s.an;
    let d='',h='',g='';
    h+=L(30,TB,636,TB,{stroke:'#b9ad8f',w:3})+T(30,50,'一端加熱，熱沿著棒子傳過去',{size:22,weight:700})+T(612,50,`第 ${Math.round(t)} 秒`,{size:22,weight:700,anchor:'end',fill:P.accent});
    /* 溫度—位置圖：和上面的棒子對齊 */
    [0,100,200,300,400].forEach(v=>{g+=L(74,GY(v),614,GY(v),{stroke:P.faint,w:1,dash:'3 5'})+T(66,GY(v)+5,v,{size:14,anchor:'end',fill:P.muted});});
    g+=L(74,GY(0),618,GY(0),{stroke:P.muted,w:1.5})+L(74,GY(0),74,GY(400)-8,{stroke:P.muted,w:1.5})+L(74,GY(60),614,GY(60),{stroke:P.orange,w:2,dash:'7 5'})
      +T(80,300,'溫度（°C）',{size:14,fill:P.muted})+T(614,300,'橘色虛線：蠟熔化的溫度（約 60°C）',{size:14,fill:P.orange,anchor:'end'})+T(614,486,'離火焰的距離（cm）',{size:14,fill:P.muted,anchor:'end'});
    const dropped=[];
    rods.forEach(([k,dir],ri)=>{const M=TRANSFER_MAT[k],xa=x0,xb=x0+dir*len*px,xl=Math.min(xa,xb)-(cmp?0:12),wd=Math.abs(xb-xa)+(cmp?0:12);
      d+=`<linearGradient id="tr-m${ri}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.c1}"/><stop offset=".45" stop-color="${M.c1}"/><stop offset="1" stop-color="${M.c2}"/></linearGradient><linearGradient id="tr-h${ri}" gradientUnits="userSpaceOnUse" x1="${xa}" y1="0" x2="${xb.toFixed(1)}" y2="0">`;
      for(let i=0;i<=26;i++){const[c,a]=transferGlow(transferRodT(k,len*i/26,t));d+=`<stop offset="${(i/26).toFixed(3)}" stop-color="${c}" stop-opacity="${a.toFixed(2)}"/>`;}
      d+='</linearGradient>';
      h+=`<rect x="${xl.toFixed(1)}" y="${Y}" width="${wd.toFixed(1)}" height="${RH}" rx="4" fill="url(#tr-m${ri})" stroke="#5d676e" stroke-width="1.5"/><rect x="${xl.toFixed(1)}" y="${Y}" width="${wd.toFixed(1)}" height="${RH}" rx="4" fill="url(#tr-h${ri})"/>`+L(xl+5,Y+4,xl+wd-5,Y+4,{stroke:'#fff',w:2,op:.45});
      h+=T((xa+xb)/2,Y-16,M.n+'棒',{size:20,weight:700,anchor:'middle'});
      /* 支架 */
      const sx=xb+dir*10;h+=`<rect x="${sx-3}" y="${Y-22}" width="6" height="${TB-Y+22}" fill="#7e8b92"/><rect x="${sx-26}" y="${TB-7}" width="52" height="7" rx="2" fill="#5d6b73"/><rect x="${sx-12}" y="${Y-5}" width="24" height="${RH+10}" rx="4" fill="#5d6b73"/>`;
      /* 圖上的曲線 */
      let pth='';for(let q=0;q<=len+.01;q+=.4)pth+=(q?'L':'M')+(x0+dir*q*px).toFixed(1)+' '+GY(transferRodT(k,q,t)).toFixed(1);
      g+=`<path d="${pth}" fill="none" stroke="${P.red}" stroke-width="3.5" stroke-linejoin="round"/>`;
      let n=0;const tds=[];
      pos.forEach((p,i)=>{const x=x0+dir*p*px,td=transferDrop(k,p),Tp=transferRodT(k,p,t),hot=t>=td;tds.push(td);if(hot)n++;
        g+=L(x,TB+5,x,GY(Tp),{stroke:P.muted,w:1,dash:'2 4'})+`<circle cx="${x.toFixed(1)}" cy="${GY(Tp).toFixed(1)}" r="5" fill="${hot?P.red:'#fffdf8'}" stroke="${hot?P.red:P.muted}" stroke-width="2"/>`+T(x,466,p,{size:14,anchor:'middle',fill:P.muted});
        const q=hot?clamp((t-td)/2.5,0,1):0,yy=Y+RH+2+(TB-7-Y-RH-2)*q*q+(q>=1?2:0),sd=p>=14?-dir:dir,ang=-88*sd*q-(q>=1?2*sd:0);
        h+=`<ellipse cx="${x.toFixed(1)}" cy="${Y+RH+1}" rx="${hot?4:5.5}" ry="${hot?2.5:4}" fill="#f6e7ae" stroke="#d6bf73"/>`
          +`<g transform="translate(${x.toFixed(1)} ${yy.toFixed(1)}) rotate(${ang.toFixed(1)})"><line x1="0" y1="0" x2="0" y2="30" stroke="#e2c38d" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="0" cy="31" rx="4" ry="5.5" fill="${P.red}"/></g>`;});
      dropped.push([M.n,n,tds]);
      if(ri===0)g+=T(x0,466,0,{size:14,anchor:'middle',fill:P.muted});});
    h+=transferLamp(x0,Y+RH-2,TB,an,46);
    /* 粒子放大圖 */
    let pn=transferPanel(664,62,220,166)+T(774,86,'粒子放大圖（示意）',{size:15,weight:700,anchor:'middle'});
    const lattice=(k,ys)=>{let o='';ys.forEach((y,r)=>{const pts=[];for(let i=0;i<8;i++){const f=clamp((transferRodT(k,i*2.6,t)-25)/375,0,1),a=1.2+7.5*Math.sqrt(f),ph=rnd(i*7+r*13+k.length)*6.28,bx=688+i*24.6;
        pts.push([bx+(reduceMotion?0:a*Math.sin(an*11+ph)),y+(reduceMotion?0:a*.8*Math.cos(an*12.7+ph*1.7)),f,bx]);}
      pts.forEach((p,i)=>{if(i)o+=L(pts[i-1][0].toFixed(1),pts[i-1][1].toFixed(1),p[0].toFixed(1),p[1].toFixed(1),{stroke:'#b9c2c8',w:1.5});});
      pts.forEach(p=>{o+=`<circle cx="${p[3].toFixed(1)}" cy="${y}" r="2" fill="${P.faint}"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="7.5" fill="rgb(${Math.round(120+115*p[2])},${Math.round(150-80*p[2])},${Math.round(175-125*p[2])})" stroke="#fff" stroke-width="1.5"/>`;});});return o;};
    if(cmp)pn+=T(676,106,TRANSFER_MAT[s.mat].n,{size:14,fill:P.muted})+lattice(s.mat,[120,142])+T(676,170,TRANSFER_MAT[s.matB].n,{size:14,fill:P.muted})+lattice(s.matB,[184,206]);
    else pn+=lattice(s.mat,[118,146,174])+T(688,214,'熱端',{size:14,fill:P.red,weight:700})+T(860,214,'冷端',{size:14,fill:P.blue,weight:700,anchor:'end'});
    pn+=T(774,250,'粒子在原位振動，',{size:14,anchor:'middle',fill:P.muted})+T(774,269,'把振動傳給旁邊的粒子',{size:14,anchor:'middle',fill:P.muted});
    /* 掉落時間表 */
    pn+=transferPanel(664,282,220,pos.length*25+62)+T(774,306,'火柴掉落的時間',{size:15,weight:700,anchor:'middle'})+T(680,330,'距離',{size:14,fill:P.muted});
    const cols=cmp?[784,848]:[816];dropped.forEach(([n],j)=>{pn+=T(cols[j],330,n+'棒',{size:14,fill:P.muted,anchor:'middle'});});
    pos.forEach((p,i)=>{pn+=T(680,355+i*25,p+' cm',{size:15});dropped.forEach(([,,tds],j)=>{const ok=t>=tds[i];pn+=T(cols[j],355+i*25,ok?Math.round(tds[i])+' 秒':'還沒掉',{size:15,anchor:'middle',weight:ok?700:400,fill:ok?P.red:P.muted});});});
    const A=dropped[0],B=dropped[1],bad=k=>TRANSFER_MAT[k].a<.01;
    const reads=[['加熱時間',Math.round(t)+' 秒'],[A[0]+'棒掉落',`${A[1]} 根（共 ${pos.length} 根）`]];
    if(cmp)reads.push([B[0]+'棒掉落',`${B[1]} 根（共 ${pos.length} 根）`]);else reads.push(['距火焰 16 cm 處',tnum(transferRodT(s.mat,16,t))+'°C']);
    let note='<b>傳導</b>：熱由高溫處沿著物體傳到低溫處。粒子只在原位振動，<b>物質本身沒有移動</b>；固體主要靠傳導傳熱。<br>金屬是熱的<b>良導體</b>（銀 ＞ 銅 ＞ 鋁 ＞ 鐵）；玻璃、木頭、水、空氣是<b>不良導體</b>。羽絨衣、雙層玻璃、保麗龍都是利用不流動的空氣隔熱。<br>';
    note+=cmp?(s.mat===s.matB?'兩邊材質相同，離火焰一樣遠的火柴同時掉落。':`第 ${Math.round(t)} 秒：${A[0]}棒掉了 ${A[1]} 根，${B[0]}棒掉了 ${B[1]} 根。`)
      :bad(s.mat)?`${A[0]}幾乎不導熱，120 秒內火柴都不會掉${s.mat==='wd'?'（木棒靠近火焰的一端實際上會燒焦）':''}。`:`第 ${Math.round(t)} 秒：${A[0]}棒掉了 ${A[1]} 根，離火焰越近越早掉。`;
    note+='（溫度與時間為示意，動畫已加快）';
    return {svg:`<defs>${d}</defs>`+h+g+pn,reads,note};},

  /* ---------- 2 對流：燒杯 ---------- */
  tracers(s,bx,yb,bw,bh,f,c,r,tl){let h='';const p=s.cp;for(let i=0;i<p.length;i+=2){const x=bx+p[i]*bw,y=yb-p[i+1]*bh,[a,b]=transferVel(f,p[i],p[i+1]),tx=x-a*bw*tl,ty=y+b*bh*tl;
      h+=`<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="${(r*.9).toFixed(1)}" stroke-linecap="round" opacity=".3"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>`;}return h;},
  beaker(s){const bx=124,bw=332,wy=128,yb=350,bh=yb-wy,f=transferFlow(s),hx=bx+f.h*bw,on=s.pw>0;
    let h=`<defs><radialGradient id="tr-plume" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#f08a4a" stop-opacity="${(.14+.1*s.pw).toFixed(2)}"/><stop offset="1" stop-color="#f08a4a" stop-opacity="0"/></radialGradient><clipPath id="tr-water"><rect x="${bx}" y="${wy}" width="${bw}" height="${bh}"/></clipPath></defs>`;
    h+=T(30,50,on?'加熱處的水上升，較冷的水下沉':'沒有加熱，水不流動',{size:22,weight:700})+L(30,462,500,462,{stroke:'#b9ad8f',w:3});
    h+=`<rect x="${bx}" y="${wy}" width="${bw}" height="${bh}" fill="#a9d3ee" fill-opacity=".45"/>`;
    if(on)h+=`<g clip-path="url(#tr-water)"><ellipse cx="${hx.toFixed(1)}" cy="${yb}" rx="62" ry="${bh*1.05}" fill="url(#tr-plume)"/><ellipse cx="${hx.toFixed(1)}" cy="${wy}" rx="150" ry="34" fill="url(#tr-plume)" transform="rotate(180 ${hx.toFixed(1)} ${wy})"/></g>`;
    if(on)h+=transferLoop(bx,wy,bw,bh,f);
    h+=this.tracers(s,bx,yb,bw,bh,f,'#8a5a2b',3.4,.17);
    h+=L(bx,wy,bx+bw,wy,{stroke:'#6da9d4',w:3})+`<path d="M${bx-5} 92V${yb+3}H${bx+bw+5}V92" fill="none" stroke="#83999d" stroke-width="4.5" stroke-linejoin="round"/>`+L(bx+bw-22,150,bx+bw-22,320,{stroke:'#fff',w:4,op:.5});
    h+=`<rect x="${bx-26}" y="${yb+5}" width="${bw+52}" height="7" rx="3" fill="#8a959c"/>`+L(bx-16,yb+12,bx-30,462,{stroke:'#6f7c84',w:5})+L(bx+bw+16,yb+12,bx+bw+30,462,{stroke:'#6f7c84',w:5});
    if(on)h+=transferLamp(hx,yb+14,462,s.an,22+s.pw*3);
    else h+=`<path d="M${hx-12} 416C${hx-44} 422 ${hx-48} 458 ${hx-36} 462H${hx+36}C${hx+48} 458 ${hx+44} 422 ${hx+12} 416Z" fill="#f4fbfd" stroke="#83999d" stroke-width="2.5"/><rect x="${hx-13}" y="406" width="26" height="11" rx="3" fill="#c7cdd2" stroke="#8a959c" stroke-width="1.5"/>`;
    h+=T(bx+bw/2,112,'木屑隨著水流動',{size:15,anchor:'middle',fill:P.muted});
    /* 右側：因果流程 */
    const st=[['靠近熱源的水受熱',P.ink,'#fffdf8'],['體積膨脹，密度變小',P.ink,'#fffdf8'],['密度較小的熱水上升',P.red,'#fdf0ec'],['旁邊較冷、密度較大的水下沉補過來',P.blue,'#edf4fb'],['水不斷循環流動：對流',P.accent,'#e8f4f2']];
    st.forEach(([t,c,bg],i)=>{const y=84+i*70;h+=`<rect x="536" y="${y}" width="344" height="46" rx="12" fill="${bg}" stroke="${c===P.ink?'#ddd7c9':c}" stroke-width="1.5" opacity="${on||i===4?1:.55}"/>`+T(708,y+29,t,{size:17,anchor:'middle',fill:c,weight:i>1?700:400});if(i<4)h+=transferArrow(708,y+50,708,y+66,P.muted,{w:3});});
    h+=transferArrow(552,440,592,440,P.red,{w:5,op:.6})+T(600,446,'上升',{size:15,fill:P.muted})+transferArrow(672,440,712,440,P.blue,{w:5,op:.6})+T(720,446,'下沉',{size:15,fill:P.muted})+`<circle cx="790" cy="440" r="4" fill="#8a5a2b"/>`+T(802,446,'木屑',{size:15,fill:P.muted});
    const where=({l:'左側',c:'中央',r:'右側'})[s.hp],sink=s.hp==='c'?'兩側':s.hp==='l'?'右側':'左側';
    return {svg:h,reads:[['熱源位置',where],['火力',on?s.pw+' 級':'關火'],['水的流動',on?`${where}上升、${sink}下沉`:'不流動']],
      note:`<b>對流</b>：液體或氣體受熱後膨脹、<b>密度變小而上升</b>，周圍較冷、密度較大的部分<b>下沉</b>補過來，物質<b>本身流動</b>，把熱帶到各處。<br>`
        +(on?`現在熱源在${where}：水由${where}上升，到${sink}下沉；火力越大，流動越快。`:'關火後沒有溫度差，水不再流動。')+'對流需要能流動的介質，固體和真空中都不能對流。（流動情形為示意）'};},

  /* ---------- 2 對流：試管與冰塊 ---------- */
  tube(s){const top=s.th==='top',C=transferTube(s.th),ix=clamp(s.tt*2,0,C.length-1),i0=Math.min(C.length-2,Math.floor(ix)),fr=ix-i0,[Ta,Tb,ice]=[0,1,2].map(j=>C[i0][j]+(C[i0+1][j]-C[i0][j])*fr);
    const P0=top?[172.6,374.2]:[246.5,279.6],sy=P0[1]-165.5,Sx=P0[0]+129.4,tf=`translate(${P0[0]} ${P0[1]}) rotate(38)`,an=s.an,TD='M-24 -270V0A24 24 0 0 0 24 0V-270';
    let h=`<defs><clipPath id="tr-tubeclip"><path d="${TD}Z" transform="${tf}"/></clipPath><linearGradient id="tr-tubew" gradientUnits="userSpaceOnUse" x1="${P0[0]}" y1="${P0[1]}" x2="${Sx.toFixed(1)}" y2="${sy.toFixed(1)}"><stop offset="0" stop-color="${WARM(Tb)}"/><stop offset=".38" stop-color="${WARM(Tb)}"/><stop offset=".62" stop-color="${WARM(Ta)}"/><stop offset="1" stop-color="${WARM(Ta)}"/></linearGradient></defs>`;
    h+=L(30,416,510,416,{stroke:'#b9ad8f',w:3})+transferLamp(265,287,416,an,40);
    h+=`<g clip-path="url(#tr-tubeclip)"><rect x="0" y="${sy.toFixed(1)}" width="600" height="400" fill="url(#tr-tubew)" fill-opacity=".55"/>`+L(Sx-70,sy,Sx+70,sy,{stroke:WARM(Ta),w:3})+'</g>';
    let g='';
    if(ice>.01){const z=30*Math.cbrt(ice),cy=top?-12:-190;g+=`<rect x="${(-z/2).toFixed(1)}" y="${(cy-z/2).toFixed(1)}" width="${z.toFixed(1)}" height="${z.toFixed(1)}" rx="4" fill="#f1f9ff" stroke="#7fb6d9" stroke-width="2"/><path d="M${(-z/4).toFixed(1)} ${(cy-z/4).toFixed(1)}l${(z/5).toFixed(1)} 0" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;}
    if(top)g+=`<path d="M-23 -38l5.75 -5l5.75 5l5.75 -5l5.75 5l5.75 -5l5.75 5l5.75 -5l5.75 5" fill="none" stroke="#5d676e" stroke-width="2.5" stroke-linejoin="round"/>`;
    const bub=(y0,y1,n,k)=>{let o='';for(let i=0;i<n;i++){const yy=y1+((an*46+rnd(i+k)*200)%(y0-y1)),x=(rnd(i*3+k)-.5)*32;o+=`<circle cx="${x.toFixed(1)}" cy="${(y0+y1-yy).toFixed(1)}" r="${(2.4+rnd(i+k+9)*2.4).toFixed(1)}" fill="#fff" fill-opacity=".85" stroke="#9cc3dd"/>`;}return o;};
    if(Ta>=99.5)g+=bub(-108,-200,6,5);if(Tb>=99.5)g+=bub(-8,-104,6,31);
    if(!top&&Ta<99.5&&s.tt>0)g+=transferArrow(11,-34,11,-150,P.red,{w:4,op:.65})+transferArrow(-11,-150,-11,-34,P.blue,{w:4,op:.65});
    g+=`<path d="${TD}" fill="#ffffff" fill-opacity=".18" stroke="#83999d" stroke-width="4" stroke-linejoin="round"/>`+L(-30,-270,-22,-270,{stroke:'#83999d',w:4})+L(22,-270,30,-270,{stroke:'#83999d',w:4})+L(14,-250,14,-40,{stroke:'#fff',w:3,op:.5});
    g+=`<rect x="-94" y="-249" width="70" height="14" rx="6" fill="#b08455" stroke="#8a6238" stroke-width="1.5"/><rect x="-31" y="-248" width="62" height="12" rx="4" fill="#8a6238"/>`;
    h+=`<g transform="${tf}">${g}</g>`;
    h+=transferPill(Sx+38,sy+4,118,34,`上層 ${Math.round(Ta)}°C`,{c:WARM(Ta),size:17})+transferPill(P0[0]-150,P0[1]-28,112,34,`下層 ${Math.round(Tb)}°C`,{c:WARM(Tb),size:17});
    if(top)h+=T(P0[0]-150,P0[1]+28,'鐵絲網壓住冰塊',{size:15,fill:P.muted});
    h+=T(40,456,top?'熱水密度較小，留在上面，不會往下流':'下面的熱水上升、上面的冷水下沉：對流',{size:17,weight:700,fill:top?P.red:P.accent});
    /* 圖 */
    const X=t=>580+t*2.3,Y=v=>400-v*2.8;
    h+=T(718,56,top?'加熱上端：上面沸騰，冰塊還在':'加熱下端：整管水一起變熱',{size:19,weight:700,anchor:'middle'});
    h+=transferGraph(580,856,400,120,[0,30,60,90,120].map(v=>[v,X(v)]),[0,20,40,60,80,100].map(v=>[v,Y(v)]),'加熱時間（秒）','水溫（°C）');
    const pth=j=>C.map((r,k)=>(k?'L':'M')+X(k/2).toFixed(1)+' '+Y(r[j]).toFixed(1)).join(''),pk=j=>C.slice(0,i0+1).map((r,k)=>(k?'L':'M')+X(k/2).toFixed(1)+' '+Y(r[j]).toFixed(1)).join('')+`L${X(s.tt).toFixed(1)} ${Y(j?Tb:Ta).toFixed(1)}`;
    h+=`<path d="${pth(0)}" fill="none" stroke="${P.red}" stroke-width="2" opacity=".25"/><path d="${pth(1)}" fill="none" stroke="${P.blue}" stroke-width="2" opacity=".25"/><path d="${pk(0)}" fill="none" stroke="${P.red}" stroke-width="4" stroke-linejoin="round"/><path d="${pk(1)}" fill="none" stroke="${P.blue}" stroke-width="4" stroke-linejoin="round"/>`;
    h+=`<circle cx="${X(s.tt).toFixed(1)}" cy="${Y(Ta).toFixed(1)}" r="6" fill="${P.red}"/><circle cx="${X(s.tt).toFixed(1)}" cy="${Y(Tb).toFixed(1)}" r="6" fill="${P.blue}"/>`;
    h+=L(700,100,724,100,{stroke:P.red,w:4})+T(730,105,'上層',{size:15,fill:P.red})+L(784,100,808,100,{stroke:P.blue,w:4})+T(814,105,'下層',{size:15,fill:P.blue});
    const pc=Math.round(ice*100);
    h+=T(580,474,'冰塊剩下',{size:16,fill:P.muted})+`<rect x="656" y="460" width="130" height="16" rx="8" fill="#e9e4d8"/><rect x="656" y="460" width="${(130*ice).toFixed(1)}" height="16" rx="8" fill="#8fc3e3"/>`+T(798,475,pc+'%',{size:18,weight:700});
    return {svg:h,reads:[['上層水溫',Math.round(Ta)+'°C'+(Ta>=99.5?'（沸騰）':'')],['下層水溫',Math.round(Tb)+'°C'+(Tb>=99.5?'（沸騰）':'')],['冰塊剩下',pc+'%']],
      note:top?'<b>加熱上端</b>：上面的水變熱後密度變小，本來就在上方，<b>不會往下流，沒有對流</b>。熱只能靠傳導往下傳，而<b>水是熱的不良導體</b>，所以上面沸騰了，管底的冰塊只熔化一點。（數值為示意）'
        :'<b>加熱下端</b>：下面的水受熱、密度變小而上升，上面較冷的水下沉，<b>對流</b>很快把熱帶到整管水，冰塊很快就熔化，上下層的溫度幾乎一樣。（數值為示意）'};},

  /* ---------- 2 對流：房間 ---------- */
  room(s){const ac=s.rd==='ac',w=s.wrong,bx=74,bw=752,ty=90,yb=428,bh=yb-ty,f=transferFlow(s),[tc,tf]=ac?(w?[32,21]:[27,25]):(w?[28,13]:[22,20]),hi=ac?!w:w;
    const air=T=>{const q=clamp((T-24)/9,-1,1),a=Math.abs(q),m=q<0?[112,170,235]:[244,160,92];return `rgb(${[236,236,226].map((v,i)=>Math.round(v+(m[i]-v)*a)).join(',')})`;},e1=w?(ac?.66:.2):0,e2=w?(ac?.8:.34):1;
    let h=`<defs><linearGradient id="tr-air" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${air(tc)}"/><stop offset="${e1}" stop-color="${air(tc)}"/><stop offset="${e2}" stop-color="${air(tf)}"/><stop offset="1" stop-color="${air(tf)}"/></linearGradient></defs>`;
    const good=ac?'冷氣裝在高處：冷空氣下沉，整個房間都變涼':'暖氣裝在低處：熱空氣上升，整個房間都變暖',bad=ac?'冷氣裝在低處：冷空氣留在地板附近，上面還是熱':'暖氣裝在高處：熱空氣留在天花板附近，腳邊還是冷';
    h+=T(450,54,w?bad:good,{size:22,weight:700,anchor:'middle',fill:w?P.red:P.accent});
    h+=`<rect x="${bx}" y="${ty}" width="${bw}" height="${bh}" fill="url(#tr-air)" fill-opacity=".62"/>`+transferLoop(bx,ty,bw-96,bh,f,{op:.55,w:6})+this.tracers(s,bx,yb,bw,bh,f,'#7c8a92',2.8,.13);
    h+=`<rect x="${bx-4}" y="${ty-4}" width="${bw+8}" height="${bh+8}" rx="4" fill="none" stroke="#7e8b92" stroke-width="6"/>`+L(bx-20,yb+7,bx+bw+20,yb+7,{stroke:'#b9ad8f',w:5});
    h+=`<rect x="${bx-7}" y="170" width="6" height="120" fill="#bfe0f2" stroke="#7e8b92" stroke-width="1.5"/>`;
    h+=transferPerson(450,yb,176,'#6fa58a');
    const dy=hi?ty+10:yb-52;
    if(ac){h+=`<rect x="726" y="${dy}" width="92" height="40" rx="8" fill="#fff" stroke="#7e8b92" stroke-width="2.5"/>`+L(736,dy+30,808,dy+30,{stroke:'#9aa8b0',w:2.5})+T(772,dy+22,'冷氣',{size:15,anchor:'middle',weight:700,fill:P.blue});
      for(let i=0;i<3;i++)h+=hi?transferArrow(744+i*28,dy+46,744+i*28,dy+72,P.blue,{w:3,op:.8}):transferArrow(720,dy+8+i*12,694,dy+8+i*12,P.blue,{w:3,op:.8});}
    else{h+=`<rect x="748" y="${dy-(hi?0:12)}" width="64" height="${hi?40:54}" rx="8" fill="#f4ede0" stroke="#7e8b92" stroke-width="2.5"/>`;for(let i=0;i<3;i++)h+=L(760,dy-(hi?0:12)+12+i*(hi?9:14),800,dy-(hi?0:12)+12+i*(hi?9:14),{stroke:'#f0642c',w:3.5});
      h+=T(780,hi?dy+58:dy-44,'暖氣',{size:15,anchor:'middle',weight:700,fill:P.red});for(let i=0;i<3;i++)h+=hi?transferArrow(740,dy+8+i*12,714,dy+8+i*12,P.red,{w:3,op:.8}):transferArrow(760+i*20,dy-18,760+i*20,dy-36,P.red,{w:3,op:.8});}
    h+=transferPill(160,ty+12,186,34,`天花板附近 ${tc}°C`,{size:16,c:tc>=tf+3?P.red:P.ink})+transferPill(160,yb-46,186,34,`地板附近 ${tf}°C`,{size:16,c:tc>=tf+3?P.blue:P.ink});
    h+=T(450,474,w?(ac?'冷空氣密度較大，沉在下面不動；上方的熱空氣沒有被冷卻':'熱空氣密度較小，浮在上面不動；下方的冷空氣沒有被加熱'):(ac?'冷空氣（密度較大）下沉，較熱的空氣上升後再被冷氣冷卻':'熱空氣（密度較小）上升，較冷的空氣下沉後再被暖氣加熱'),{size:17,anchor:'middle',fill:P.ink});
    return {svg:h,reads:[['裝置位置',(ac?'冷氣':'暖氣')+'在'+(hi?'高處':'低處')],['天花板附近',tc+'°C'],['地板附近',tf+'°C'],['上下溫差',(tc-tf)+'°C']],
      note:`<b>冷氣裝高處、暖氣裝低處</b>：冷空氣密度較大會下沉，熱空氣密度較小會上升，這樣空氣才能<b>對流</b>，整個房間的溫度比較一致。<br>`
        +(w?`現在${ac?'冷氣在低處，冷空氣一直留在下面':'暖氣在高處，熱空氣一直留在上面'}，上下溫差有 ${tc-tf}°C。`:`現在上下只差 ${tc-tf}°C。`)+'海風、陸風也是空氣的對流。（溫度為示意）'};},

  /* ---------- 3 輻射 ---------- */
  rad(s){const on=s.rp==='on',t=s.rt,Lx=255,Ly=188,D=46+s.rdist*6,TBL=262,an=s.an,xs=[Lx-D,Lx+D],Tn=[0,1].map(j=>transferCan(s,j,t)),names=['黑色罐','光亮的銀色罐'],col=['#2b2f33','#5d8fb3'];
    let h=T(725,50,on?'燈的熱以輻射傳到兩側的罐子':'關燈後，罐子以輻射把熱放出去',{size:19,weight:700,anchor:'middle'})+L(20,TBL,500,TBL,{stroke:'#b9ad8f',w:3});
    /* 燈 */
    h+=`<rect x="${Lx-5}" y="${Ly+20}" width="10" height="${TBL-Ly-26}" fill="#8a959c"/><rect x="${Lx-30}" y="${TBL-8}" width="60" height="8" rx="3" fill="#5d6b73"/><rect x="${Lx-11}" y="${Ly+16}" width="22" height="14" rx="3" fill="#b9c2c8" stroke="#7e8b92"/>`;
    if(on)h+=`<circle cx="${Lx}" cy="${Ly}" r="46" fill="#ffcf5a" fill-opacity="${(.2+.05*Math.sin(an*3)).toFixed(2)}"/>`;
    h+=`<circle cx="${Lx}" cy="${Ly}" r="24" fill="${on?'#ffd65c':'#e7e9ea'}" stroke="${on?'#e59a1f':'#9aa5ae'}" stroke-width="2.5"/><path d="M${Lx-8} ${Ly+6}q4 -16 8 0q4 -16 8 0" fill="none" stroke="${on?'#e0662c':'#9aa5ae'}" stroke-width="2"/>`+T(Lx,Ly-56,on?'燈（開）':'燈（關）',{size:15,anchor:'middle',fill:P.muted});
    xs.forEach((x,j)=>{const dir=j?1:-1,Tc=Tn[j],yl=168-(clamp(Tc,20,95)-20)*.8,face=x-dir*30;
      h+=glassTherm(x,236,96,yl,{c:ALC,br:8,w:4});
      h+=`<rect x="${x-30}" y="176" width="60" height="${TBL-177}" rx="5" fill="url(#${j?'tr-shine':'tr-black'})" stroke="${j?'#7e8b92':'#15181a'}" stroke-width="2"/><ellipse cx="${x}" cy="177" rx="30" ry="6" fill="${j?'#dfe5ea':'#3a3f44'}" stroke="${j?'#7e8b92':'#15181a'}" stroke-width="2"/><ellipse cx="${x}" cy="177" rx="6" ry="2" fill="#6d757e"/>`;
      h+=transferPill(x-48,40,96,38,tnum(Tc)+'°C',{c:col[j],bd:col[j],size:19});
      h+=T(x,286,names[j],{size:16,anchor:'middle',weight:700,fill:col[j]})+T(x,307,j?'反射多、吸收少':'吸收多、放出多',{size:14,anchor:'middle',fill:P.muted});
      if(on){[196,218,240].forEach((y,i)=>{h+=transferWavy(Lx+dir*28,Ly+(i-1)*8,face-dir*2,y,'#e0662c',{ph:reduceMotion?i:an*5+i*1.3,op:.9,amp:4,wl:15});if(j)h+=transferArrow(face-dir*3,y-4,face-dir*20,y-18,'#e0662c',{w:2.2,op:.45});});}
      else{const q=clamp((Tc-25)/35,0,1),n=j?1:3;for(let i=0;i<n;i++){const y=j?218:198+i*20,ln=Math.min(x-49,(j?24:38)*(.45+.55*q));[1,-1].forEach(sd=>{h+=transferWavy(x+sd*33,y,x+sd*(33+ln),y-6,'#e0662c',{ph:reduceMotion?i:-an*5+i,op:.35+.6*q,amp:4,wl:14});});}}
      h+=L(Math.min(x,Lx),322,Math.max(x,Lx),322,{stroke:P.muted,w:1.5})+L(x,315,x,329,{stroke:P.muted,w:1.5})+T((x+Lx)/2,341,s.rdist+' cm',{size:15,anchor:'middle',fill:P.muted});});
    h+=L(Lx,315,Lx,329,{stroke:P.muted,w:1.5});
    /* 太陽與地球 */
    h+=`<rect x="30" y="362" width="450" height="84" rx="12" fill="#17253a"/>`;for(let i=0;i<16;i++)h+=`<circle cx="${(120+rnd(i+5)*290).toFixed(0)}" cy="${(370+rnd(i+25)*68).toFixed(0)}" r="1.2" fill="#fff" opacity=".6"/>`;
    h+=`<circle cx="76" cy="404" r="38" fill="#ffc93c" fill-opacity=".25"/><circle cx="76" cy="404" r="26" fill="#ffc93c"/><circle cx="440" cy="404" r="17" fill="#4c85bb"/><path d="M430 396q8 -6 14 2q-4 8 -12 6zM442 410q8 0 9 6q-6 5 -10 0z" fill="#6fb37a"/>`;
    [392,404,416].forEach((y,i)=>{h+=transferWavy(112,y,414,y,'#ffd27a',{ph:reduceMotion?i:an*5+i*2,amp:4,op:.9});});
    h+=`<rect x="205" y="368" width="100" height="24" rx="12" fill="#17253a" fill-opacity=".85"/>`+T(255,386,'太空是真空',{size:15,anchor:'middle',fill:'#cfe0f5'})+T(255,470,'太陽的熱穿過真空傳到地球：輻射不需要介質',{size:15,anchor:'middle',fill:P.muted});
    /* 圖 */
    const X=v=>590+v*13.5,Y=v=>420-(v-20)*3.8;
    h+=transferGraph(590,860,420,116,[0,5,10,15,20].map(v=>[v,X(v)]),[20,40,60,80,100].map(v=>[v,Y(v)]),'經過時間（分鐘）','水溫（°C）');
    [0,1].forEach(j=>{let a='',b='';for(let q=0;q<=20.01;q+=.25){const p=X(q).toFixed(1)+' '+Y(transferCan(s,j,q)).toFixed(1);a+=(q?'L':'M')+p;if(q<=t+1e-6)b+=(q?'L':'M')+p;}b+=`L${X(t).toFixed(1)} ${Y(Tn[j]).toFixed(1)}`;
      h+=`<path d="${a}" fill="none" stroke="${col[j]}" stroke-width="2" opacity=".25"/><path d="${b}" fill="none" stroke="${col[j]}" stroke-width="4" stroke-linejoin="round"/><circle cx="${X(t).toFixed(1)}" cy="${Y(Tn[j]).toFixed(1)}" r="6" fill="${col[j]}" stroke="#fff" stroke-width="1.5"/>`;});
    h+=L(X(0),Y(25),X(20),Y(25),{stroke:P.muted,w:1,dash:'6 5'})+T(X(20),Y(25)+17,'室溫 25°C',{size:14,anchor:'end',fill:P.muted});
    h+=L(700,84,722,84,{stroke:col[0],w:4})+T(728,89,'黑色罐',{size:15,fill:col[0]})+L(790,84,812,84,{stroke:col[1],w:4})+T(818,89,'銀色罐',{size:15,fill:col[1]});
    const diff=Tn[0]-Tn[1];
    return {svg:h,reads:[['黑色罐',tnum(Tn[0])+'°C'],['銀色罐',tnum(Tn[1])+'°C'],[on?'黑色罐比銀色罐高':'黑色罐比銀色罐低',tnum(Math.abs(diff))+'°C']],
      note:`<b>輻射</b>：熱不靠任何介質，直接由高溫物體向四周傳出，<b>在真空中也能傳播</b>。熱空氣是往上升的，所以傳到燈旁邊罐子上的熱主要是輻射。<br>`
        +(on?`第 ${t.toFixed(1)} 分鐘：黑色罐 ${tnum(Tn[0])}°C、銀色罐 ${tnum(Tn[1])}°C。<b>黑色、粗糙</b>的表面容易吸收輻射，升溫快；<b>白色、光亮</b>的表面容易反射，升溫慢。離燈越遠，升溫越慢。`
          :`第 ${t.toFixed(1)} 分鐘：黑色罐 ${tnum(Tn[0])}°C、銀色罐 ${tnum(Tn[1])}°C。容易吸收輻射的表面也<b>容易放出輻射</b>，所以黑色罐降溫也比較快。`)
        +'<br>生活中：夏天穿淺色衣服、太陽能熱水器的集熱板塗黑、保溫瓶內壁鍍銀、救難用鋁箔毯。（數值為示意）'};},

  /* ---------- 4 保溫瓶 ---------- */
  bottle(s){const m=transferBottle(s,false),m0=transferBottle(s,true),hot=s.bc==='hot',t=s.bt,Tw=transferBT(m,t),dT=Math.abs(Tw-25),cx=215,an=s.an,sel=s.bsel,changed=s.bair||s.bnos||s.bopen;
    const shp=(i,top)=>`M${cx-62+i} ${top}V150C${cx-62+i} 180 ${cx-104+i} 172 ${cx-104+i} 208V${430-i}Q${cx-104+i} ${456-i} ${cx-78+i} ${456-i}H${cx+78-i}Q${cx+104-i} ${456-i} ${cx+104-i} ${430-i}V208C${cx+104-i} 172 ${cx+62-i} 180 ${cx+62-i} 150V${top}Z`;
    const liq=hot?'#e9a06a':'#9ccbea',tapA=(id,inner,label)=>`<g data-tap="b:${id}" tabindex="0" role="button" aria-label="${label}" style="cursor:pointer">${inner}</g>`,ring=shp(8,108)+shp(30,96);
    let h=`<defs><clipPath id="tr-cav"><path d="${shp(37,96)}"/></clipPath><clipPath id="tr-low"><rect x="0" y="109" width="500" height="400"/></clipPath></defs>`;
    h+=T(30,44,hot?'保溫瓶怎麼讓熱水不容易變冷':'保溫瓶怎麼讓冰水不容易變溫',{size:22,weight:700})+L(60,460,400,460,{stroke:'#b9ad8f',w:3});
    /* 外壁、夾層、內壁 */
    h+=tapA('wall',`<path d="${shp(0,96)}" fill="url(#tr-steel)" stroke="${sel==='wall'?P.accent:'#6f7c84'}" stroke-width="${sel==='wall'?3.5:2}"/>`,'雙層瓶壁');
    let gp=`<path d="${ring}" fill-rule="evenodd" fill="${s.bair?'#dcebf5':'#fbfaf5'}" stroke="${sel==='gap'?P.accent:'none'}" stroke-width="3"/>`;
    if(s.bair)for(let i=0;i<46;i++){const side=i%2?1:-1,yy=214+rnd(i+11)*212,xx=cx+side*(85+((rnd(i+50)+(reduceMotion?0:.08*Math.sin(an*2+i)))*14-7));gp+=`<circle cx="${xx.toFixed(1)}" cy="${(yy+(reduceMotion?0:2*Math.sin(an*1.7+i*2))).toFixed(1)}" r="2.2" fill="${P.blue}" opacity=".55"/>`;}
    h+=tapA('gap',gp,'夾層');
    h+=`<path d="${shp(30,96)}" fill="url(#tr-steel)" stroke="#6f7c84" stroke-width="1.5"/><path d="${shp(37,96)}" fill="#fffdf8"/>`;
    if(!s.bnos)h+=tapA('silver',`<g clip-path="url(#tr-low)"><path d="${shp(8,108)}" fill="none" stroke="${sel==='silver'?P.accent:'#f4f8fb'}" stroke-width="3.5"/><path d="${shp(30,96)}" fill="none" stroke="${sel==='silver'?P.accent:'#f4f8fb'}" stroke-width="3.5"/><path d="${shp(8,108)}" fill="none" stroke="#9aa5ae" stroke-width="1" stroke-dasharray="2 5"/><path d="${shp(30,96)}" fill="none" stroke="#9aa5ae" stroke-width="1" stroke-dasharray="2 5"/></g>`,'鍍銀面');
    /* 內容物 */
    h+=`<g clip-path="url(#tr-cav)"><rect x="100" y="158" width="240" height="320" fill="${liq}" fill-opacity=".6"/>`+L(100,158,340,158,{stroke:hot?'#c9743a':'#5d9fcf',w:3})+'</g>';
    h+=T(cx,290,hot?'熱水':'冰水',{size:18,anchor:'middle',fill:P.ink})+T(cx,326,tnum(Tw)+'°C',{size:28,anchor:'middle',weight:700,fill:hot?P.red:P.blue});
    /* 瓶塞 */
    if(!s.bopen)h+=tapA('stop',`<path d="M${cx-27} 84H${cx+27}L${cx+24.5} 140H${cx-24.5}Z" fill="#c9a36f" stroke="${sel==='stop'?P.accent:'#9a7645'}" stroke-width="${sel==='stop'?3.5:2}"/><rect x="${cx-70}" y="58" width="140" height="34" rx="9" fill="#d95f4a" stroke="${sel==='stop'?P.accent:'#a8402f'}" stroke-width="${sel==='stop'?3.5:2}"/>`+L(cx-56,68,cx+56,68,{stroke:'#fff',w:3,op:.35}),'瓶塞');
    else{const c=hot?'#c8553d':'#8d8f95';[-16,0,16].forEach((dx,i)=>{const ph=reduceMotion?i:an*3+i*2;h+=hot?transferWavy(cx+dx,112,cx+dx*1.6,62,c,{ph,amp:4,wl:16,op:.7,w:2.2}):transferArrow(cx+dx*1.8,66,cx+dx,104,c,{w:2.5,op:.7});});}
    /* 夾層裡的示意：輻射、對流、傳導（畫在左側夾層） */
    const xi=cx-74,xo=cx-96;
    [236,s.bair?318:330,424].forEach((y,i)=>{if(i===1&&s.bair&&!s.bnos)return;if(s.bnos)h+=hot?transferWavy(xi-2,y,xo-34,y,'#e0662c',{amp:3.5,wl:13,ph:reduceMotion?i:an*5+i,w:2.2}):transferWavy(xo-34,y,xi-2,y,'#e0662c',{amp:3.5,wl:13,ph:reduceMotion?i:an*5+i,w:2.2});
      else{const a=hot?xi-2:xo+2,b=hot?xo+4:xi-4;h+=`<path d="M${a} ${y-9}L${b} ${y}L${a} ${y+9}" fill="none" stroke="#e0662c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${a} ${y+9}l${hot?-7:7} ${-1}l${hot?3:-3} ${-6}z" fill="#e0662c"/>`;}});
    if(s.bair){h+=transferArrow(xi-5,402,xi-5,346,hot?P.red:P.blue,{w:2.4,op:.85})+transferArrow(xo+5,346,xo+5,402,hot?P.blue:P.red,{w:2.4,op:.85})+(hot?transferArrow(xi-1,279,xo-30,279,P.red,{w:3}):transferArrow(xo-30,279,xi-1,279,P.red,{w:3}));}
    /* 圖例 */
    h+=transferWavy(22,196,62,196,'#e0662c',{amp:3.5,wl:13,w:2.2})+T(22,220,'輻射',{size:15,fill:P.muted})+transferArrow(22,252,62,252,P.red,{w:3})+T(22,276,'傳導',{size:15,fill:P.muted})+transferArrow(32,330,32,300,P.red,{w:2.4})+transferArrow(50,300,50,330,P.blue,{w:2.4})+T(22,354,'對流',{size:15,fill:P.muted});
    /* 標籤 */
    const tags=[['stop',s.bopen?'沒有瓶塞':'瓶塞',76,cx+(s.bopen?30:66),78],['wall','雙層瓶壁',232,cx+101,240],['gap',s.bair?'夾層（空氣）':'真空夾層',292,cx+86,300],['silver',s.bnos?'沒有鍍銀':'鍍銀面',352,cx+75,360]];
    tags.forEach(([id,t2,y,px,py])=>{const on=sel===id,off=(id==='stop'&&s.bopen)||(id==='gap'&&s.bair)||(id==='silver'&&s.bnos);
      h+=L(px,py,352,y+16,{stroke:on?P.accent:P.muted,w:1.5})+`<circle cx="${px}" cy="${py}" r="3.5" fill="${on?P.accent:P.muted}"/>`
        +tapA(id,transferPill(352,y,118,34,t2,{size:16,c:on?'#fff':off?P.red:P.ink,bg:on?P.accent:'#fffdf8',bd:on?P.accent:off?P.red:'#cfc9ba'}),t2);});
    /* 圖 */
    const X=v=>548+v*26,Y=v=>292-v*2.05;
    h+=transferGraph(548,860,292,84,[0,3,6,9,12].map(v=>[v,X(v)]),[0,20,40,60,80,100].map(v=>[v,Y(v)]),'經過時間（小時）','水溫（°C）');
    h+=L(X(0),Y(25),X(12),Y(25),{stroke:P.muted,w:1,dash:'6 5'})+T(X(12),Y(25)+(hot?17:-7),'室溫 25°C',{size:14,anchor:'end',fill:P.muted});
    const cur=(mm,upto)=>{let a='';for(let q=0;q<=upto+1e-6;q+=.25)a+=(q?'L':'M')+X(q).toFixed(1)+' '+Y(transferBT(mm,q)).toFixed(1);return a+`L${X(upto).toFixed(1)} ${Y(transferBT(mm,upto)).toFixed(1)}`;},cc=hot?P.red:P.blue;
    if(changed)h+=`<path d="${cur(m0,12)}" fill="none" stroke="${P.accent}" stroke-width="2.5" stroke-dasharray="7 5"/>`+L(562,Y(hot?10:62),596,Y(hot?10:62),{stroke:P.accent,w:2.5,dash:'7 5'})+T(604,Y(hot?10:62)+5,'完整的保溫瓶',{size:15,fill:P.accent});
    h+=`<path d="${cur(m,12)}" fill="none" stroke="${cc}" stroke-width="2" opacity=".25"/><path d="${cur(m,t)}" fill="none" stroke="${cc}" stroke-width="4" stroke-linejoin="round"/><circle cx="${X(t).toFixed(1)}" cy="${Y(Tw).toFixed(1)}" r="6" fill="${cc}" stroke="#fff" stroke-width="1.5"/>`;
    /* 說明卡 */
    const INFO={stop:['瓶塞（塑膠、軟木）',['塑膠、軟木是熱的不良導體：減少傳導','塞住瓶口，熱空氣和水蒸氣出不去：','減少對流，也防止蒸發']],wall:['雙層瓶壁（玻璃或不鏽鋼）',['內、外兩層瓶壁只在瓶口相連','熱要沿著薄薄的瓶壁繞到瓶口才出得去','傳導的路又長又窄，所以傳得很慢']],
      gap:['真空夾層',['兩層瓶壁之間抽成真空，沒有物質','傳導和對流都需要介質：無法進行','只剩輻射能穿過真空']],silver:['鍍銀面',['夾層兩側的瓶壁鍍成光亮的銀色','光亮的表面把熱輻射反射回去','本身放出的輻射也少：減少輻射']]};
    h+=transferPanel(490,346,394,134);
    if(sel&&INFO[sel]){h+=T(508,374,INFO[sel][0],{size:18,weight:700,fill:P.accent});INFO[sel][1].forEach((l,i)=>{h+=T(508,402+i*25,l,{size:16});});}
    else h+=T(687,392,'點一下瓶子的各個部分',{size:18,weight:700,anchor:'middle',fill:P.accent})+T(687,422,'看它擋住哪一種熱的傳播',{size:16,anchor:'middle',fill:P.muted})+T(687,448,'（瓶塞、雙層瓶壁、真空夾層、鍍銀面）',{size:15,anchor:'middle',fill:P.muted});
    const rate=k=>k*500*dT/60,verb=hot?'散失':'傳入',fr=v=>v>=10?v.toFixed(0):v.toFixed(1),big=[['傳導',m.c],['對流',m.v],['輻射',m.r]].sort((a,b)=>b[1]-a[1])[0][0];
    return {svg:h,reads:[['水溫',tnum(Tw)+'°C'],['傳導'+verb,fr(rate(m.c))+' cal/分'],['對流'+verb+(s.bopen&&hot?'（含蒸發）':''),fr(rate(m.v))+' cal/分'],['輻射'+verb,fr(rate(m.r))+' cal/分']],
      note:`<b>真空夾層</b>阻絕傳導和對流，<b>鍍銀面</b>把輻射反射回去，<b>瓶塞</b>減少傳導、對流並防止蒸發。三種途徑都擋住，${hot?'熱水就不容易變冷':'外面的熱不容易傳進來，冰水也不容易變溫'}。<br>`
        +`第 ${t.toFixed(1)} 小時：水溫 ${tnum(Tw)}°C，每分鐘共${verb} ${fr(rate(m.k))} cal`+(changed?`，其中<b>${big}</b>最多。`:'。')+(s.bopen&&!hot?'冷空氣密度較大，會留在瓶內，所以拿掉瓶塞對冰水的影響比熱水小。':'')+'（500 g 的水，數值為示意）'};},

  /* ---------- 5 是哪一種傳播 ---------- */
  which(s){const n=TRANSFER_W.length,i=clamp(s.wi,0,n-1),Q=TRANSFER_W[i],pk=s.wa[i],done=pk>=0,right=s.wa.filter((a,j)=>a===TRANSFER_W[j].a).length,ans=s.wa.filter(a=>a>=0).length;
    let h=T(30,38,`第 ${i+1} 題（共 ${n} 題）`,{size:16,fill:P.muted})+T(30,68,Q.t,{size:21,weight:700});
    for(let j=0;j<n;j++){const a=s.wa[j],c=a<0?'#e9e4d8':a===TRANSFER_W[j].a?P.accent:P.red;h+=`<circle cx="${668+j*22}" cy="32" r="${j===i?8:6}" fill="${c}" stroke="${j===i?P.ink:'none'}" stroke-width="2"/>`;}
    h+=`<rect x="30" y="84" width="450" height="266" rx="14" fill="#fffdf8" stroke="#ddd7c9"/>`+TRANSFER_SCENE[Q.sc]();
    TRANSFER_WAY.forEach((w,j)=>{const x=30+j*155,isA=j===Q.a,st=!done?'idle':isA?'ok':j===pk?'bad':'dim',bg=st==='ok'?P.accent:st==='bad'?P.red:'#fffdf8',fc=st==='ok'||st==='bad'?'#fff':st==='dim'?P.muted:P.ink,bd=st==='ok'?P.accent:st==='bad'?P.red:st==='dim'?'#ddd7c9':P.accent;
      h+=`<g data-tap="w${j}" tabindex="0" role="button" aria-label="${w}" style="cursor:${done?'default':'pointer'}"><rect x="${x}" y="366" width="140" height="58" rx="14" fill="${bg}" stroke="${bd}" stroke-width="2.5"/>`+T(x+70,404,(st==='ok'?'✓ ':st==='bad'?'✗ ':'')+w,{size:24,weight:700,anchor:'middle',fill:fc})+'</g>';});
    h+=T(255,458,done?'':'這主要是哪一種熱的傳播方式？點一個答案',{size:16,anchor:'middle',fill:P.muted});
    /* 比較表 */
    const cx=[538,612,700,812],rows=[['','介質','物質本身','主要發生在'],['傳導','需要','不移動','固體'],['對流','需要','流動','液體、氣體'],['輻射','不需要','不靠物質','真空中也能傳']];
    h+=transferPanel(500,84,384,170);
    rows.forEach((r,k)=>{const y=110+k*38;if(k)h+=L(512,y-24,872,y-24,{stroke:'#e4dfd2',w:1});r.forEach((c,q)=>{h+=T(cx[q],y,c,{size:k&&q?16:15,anchor:'middle',weight:q===0?700:400,fill:k===0?P.muted:q===0?P.accent:P.ink});});});
    h+=T(692,276,'三種方式都是由高溫傳到低溫',{size:15,anchor:'middle',fill:P.muted});
    /* 回饋 */
    h+=`<rect x="500" y="290" width="384" height="116" rx="14" fill="${!done?'#fffdf8':pk===Q.a?'#e8f4f2':'#fdf0ec'}" stroke="${!done?'#ddd7c9':pk===Q.a?P.accent:P.red}" stroke-width="1.5"/>`;
    if(done)h+=T(518,320,pk===Q.a?`✓ 答對了：${TRANSFER_WAY[Q.a]}`:`✗ 答案是「${TRANSFER_WAY[Q.a]}」`,{size:20,weight:700,fill:pk===Q.a?P.accent:P.red})+Q.why.map((l,k)=>T(518,352+k*26,l,{size:16})).join('');
    else h+=T(692,342,'先預測，再點左邊的答案',{size:18,anchor:'middle',fill:P.muted})+T(692,372,'答對或答錯都會說明原因',{size:15,anchor:'middle',fill:P.muted});
    h+=T(500,452,`答對 ${right} 題`,{size:22,weight:700,fill:P.accent})+T(500,478,ans===n?'全部作答完畢':`已作答 ${ans} 題`,{size:15,fill:P.muted});
    h+=`<g data-tap="wn" tabindex="0" role="button" aria-label="下一題" style="cursor:pointer"><rect x="744" y="424" width="140" height="52" rx="14" fill="${done?P.accent:'#fffdf8'}" stroke="${P.accent}" stroke-width="2.5"/>`+T(814,458,'下一題',{size:20,weight:700,anchor:'middle',fill:done?'#fff':P.accent})+'</g>';
    return {svg:h,reads:[['題號',`${i+1}／${n}`],['答對',right+' 題'],['已作答',ans+' 題']],
      note:'<b>傳導</b>：需要介質，物質不移動，固體為主。<br><b>對流</b>：需要介質，物質本身流動，發生在液體和氣體。<br><b>輻射</b>：不需要介質，真空中也能傳，以電磁波（例如紅外線）的形式傳出。<br>三種方式都是把熱由<b>高溫</b>傳到<b>低溫</b>。'};}
};

/* ===== 6-1、6-5 元素、化合物與化學式 ===== */
/* ===== 6-1 元素與化合物、6-5 分子與化學式 ===== */
/* 原子的顏色與相對大小：五個分頁共用（H、O、N、C、He 沿用「物質與粒子」的顏色） */
const COMPOUND_EL={H:{n:'氫',c:'#7fa6d6',r:9.5},He:{n:'氦',c:'#a37acc',r:11.5},C:{n:'碳',c:'#4a5860',r:14},N:{n:'氮',c:'#0f9488',r:14},O:{n:'氧',c:'#df7c44',r:14},
  Ne:{n:'氖',c:'#e389a8',r:12.5},Na:{n:'鈉',c:'#6f7fd6',r:12.5},S:{n:'硫',c:'#e0b92c',r:16},Cl:{n:'氯',c:'#74b24a',r:16.5},Ar:{n:'氬',c:'#c2a35a',r:15},
  Fe:{n:'鐵',c:'#868e96',r:15},Cu:{n:'銅',c:'#b0622f',r:15},Zn:{n:'鋅',c:'#9db4bd',r:15}};
const compoundMix=(hex,to,f)=>{const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),b=[1,3,5].map(i=>parseInt(to.slice(i,i+2),16));return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*f).toString(16).padStart(2,'0')).join('');};
/* 原子顏色和其他單元一致（EL_COLOR）；淺色的球（氫）用深色邊線和字 */
for(const k of Object.keys(COMPOUND_EL)){const E=COMPOUND_EL[k];if(EL_COLOR[k])E.c=EL_COLOR[k][0];const lum=[1,3,5].reduce((s,i,j)=>s+parseInt(E.c.slice(i,i+2),16)*[.3,.59,.11][j],0),light=lum>205;E.d=light?'#7d8b99':compoundMix(E.c,'#000000',.32);E.ink=light?'#56677a':compoundMix(E.c,'#000000',.28);E.tx=light||k==='S'||k==='Zn'?'#1b2a33':'#fff';}
const COMPOUND_DEFS='<defs>'+Object.entries(COMPOUND_EL).map(([k,E])=>`<radialGradient id="cpd-${k}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${compoundMix(E.c,'#ffffff',.72)}"/><stop offset=".42" stop-color="${E.c}"/><stop offset="1" stop-color="${compoundMix(E.c,'#000000',.3)}"/></radialGradient>`).join('')
  +'<linearGradient id="cpd-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe7f3"/><stop offset="1" stop-color="#a9d0e4"/></linearGradient>'
  +'<linearGradient id="cpd-glassv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".1"/><stop offset="1" stop-color="#9fb6bd" stop-opacity=".22"/></linearGradient>'
  +'<linearGradient id="cpd-rod" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c8a92"/><stop offset=".45" stop-color="#39444b"/><stop offset="1" stop-color="#20282d"/></linearGradient>'
  +'<linearGradient id="cpd-batt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6b73"/><stop offset=".5" stop-color="#2f3a40"/><stop offset="1" stop-color="#1d2529"/></linearGradient>'
  +'<radialGradient id="cpd-flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#ffc73a"/><stop offset="1" stop-color="#f0692a"/></radialGradient>'
  +'<radialGradient id="cpd-sugar" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff7e2"/><stop offset=".5" stop-color="#ecd29c"/><stop offset="1" stop-color="#c9a660"/></radialGradient>'
  +'<filter id="cpd-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter></defs>';
/* 下標：HTML 用 <sub>，SVG 用 <tspan> 降低基線，字級不小於 13 */
const COMPOUND_SUBD='₀₁₂₃₄₅₆₇₈₉';
const compoundDig=m=>[...m].map(c=>COMPOUND_SUBD.indexOf(c)).join('');
const compoundHtml=t=>String(t).replace(/[₀-₉]+/g,m=>'<sub>'+compoundDig(m)+'</sub>');
function compoundT(x,y,str,o={}){const{size=16,fill=P.ink,anchor='start',weight=400,op=1}=o,ss=Math.max(13,Math.round(size*.68)),d=+(size*.2).toFixed(1);let out='',down=false;
  String(str).split(/([₀-₉]+)/).forEach((seg,i)=>{if(!seg)return;if(i%2){out+=`<tspan dy="${down?0:d}" font-size="${ss}">${compoundDig(seg)}</tspan>`;down=true;}else{out+=down?`<tspan dy="${-d}">${seg}</tspan>`:seg;down=false;}});
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}"${op<1?` opacity="${op}"`:''}>${out}</text>`;}
const compoundSubN=n=>String(n).replace(/\d/g,d=>COMPOUND_SUBD[d]);
const compoundFstr=f=>f.map(([e,n])=>e+(n>1?compoundSubN(n):'')).join('');
/* 分子模型：a 是原子（依繪製順序，後面的畫在上層），f 是化學式的寫法 */
const COMPOUND_MOL={
  He:{n:'氦',f:[['He',1]],a:[['He',0,0]]},Ne:{n:'氖',f:[['Ne',1]],a:[['Ne',0,0]]},Ar:{n:'氬',f:[['Ar',1]],a:[['Ar',0,0]]},
  H2:{n:'氫氣',f:[['H',2]],a:[['H',-8,0],['H',8,0]]},O2:{n:'氧氣',f:[['O',2]],a:[['O',-11.5,0],['O',11.5,0]]},N2:{n:'氮氣',f:[['N',2]],a:[['N',-11,0],['N',11,0]]},
  Cl2:{n:'氯氣',f:[['Cl',2]],a:[['Cl',-13.5,0],['Cl',13.5,0]]},O3:{n:'臭氧',f:[['O',3]],a:[['O',-19,8],['O',19,8],['O',0,-5]]},
  H2O:{n:'水',f:[['H',2],['O',1]],a:[['H',-14.5,9.5],['H',14.5,9.5],['O',0,-2]]},CO2:{n:'二氧化碳',f:[['C',1],['O',2]],a:[['O',-23,0],['O',23,0],['C',0,0]]},
  NH3:{n:'氨',f:[['N',1],['H',3]],a:[['H',-16,9],['H',16,9],['N',0,-4],['H',0,13]]},CH4:{n:'甲烷',f:[['C',1],['H',4]],a:[['H',0,-19],['H',-18,8],['H',18,8],['C',0,0],['H',2,13]]},
  HCl:{n:'氯化氫',f:[['H',1],['Cl',1]],a:[['H',-14,0],['Cl',6,0]]},
  H2SO4:{n:'硫酸',f:[['H',2],['S',1],['O',4]],a:[['H',-38,-9],['H',38,9],['O',0,-24],['O',0,24],['O',-25,0],['O',25,0],['S',0,0]]},
  C2H5OH:{n:'酒精（乙醇）',f:[['C',2],['H',5],['O',1],['H',1]],a:[['H',-37,0],['H',-22,-18],['H',-22,18],['H',4,-18],['H',4,18],['H',38,9],['O',26,-2],['C',-20,0],['C',4,0]]},
  C6H12O6:{n:'葡萄糖',f:[['C',6],['H',12],['O',6]],a:(()=>{const pt=(r,a)=>[+(r*Math.cos(rad(a))).toFixed(1),+(r*Math.sin(rad(a))).toFixed(1)],H=[],O=[],C=[];
    for(let i=0;i<6;i++){const a=-90+60*i;if(i===0){O.push(['O',...pt(24,a)]);continue;}C.push(['C',...pt(24,a)]);H.push(['H',...pt(40,a-24)]);
      if(i<5){O.push(['O',...pt(47,a+4)]);H.push(['H',...pt(60,a+12)]);}
      else{const[cx,cy]=pt(50,a+6);C.push(['C',cx,cy]);H.push(['H',cx-4,cy+17],['H',cx-16,cy-8]);O.push(['O',...pt(72,a+18)]);H.push(['H',...pt(85,a+24)]);}}
    return [...H,...O,...C];})()}};
for(const k of Object.keys(COMPOUND_MOL)){const M=COMPOUND_MOL[k];M.d=2*Math.max(...M.a.map(([e,x,y])=>Math.hypot(x,y)+COMPOUND_EL[e].r));M.fs=compoundFstr(M.f);
  M.cnt={};M.f.forEach(([e,n])=>{M.cnt[e]=(M.cnt[e]||0)+n;});M.els=Object.keys(M.cnt);M.tot=M.a.length;}
function compoundAtom(el,x,y,sc=1,o={}){const E=COMPOUND_EL[el],r=E.r*sc,{lab=false,dim=false,glow=false,rot=0}=o,fs=Math.round(clamp(r*.82,13,30));
  return (glow?`<circle cx="${x}" cy="${y}" r="${(r+Math.min(3.5,r*.25)).toFixed(1)}" fill="none" stroke="#f2a91e" stroke-width="${Math.min(3.5,r*.3).toFixed(1)}"/>`:'')
    +`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="url(#cpd-${el})" stroke="${E.d}" stroke-width="${r>20?1.6:1}"${dim?' opacity=".3"':''}/>`
    +(lab&&r>=10.5?`<text x="${x}" y="${(y+fs*.36).toFixed(1)}" font-size="${fs}" fill="${E.tx}" text-anchor="middle" font-weight="700"${rot?` transform="rotate(${(-rot).toFixed(1)} ${x} ${y})"`:''}${dim?' opacity=".2"':''}>${el}</text>`:'');}
function compoundMol(key,x,y,sc=1,rot=0,o={}){const M=COMPOUND_MOL[key];
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})">${M.a.map(([e,ax,ay])=>compoundAtom(e,+(ax*sc).toFixed(1),+(ay*sc).toFixed(1),sc,{...o,rot,dim:o.hl?e!==o.hl:false,glow:o.hl?e===o.hl:false})).join('')}</g>`;}
const compoundSugar=(x,y,r)=>`<path d="M${[0,1,2,3,4,5].map(i=>`${(x+r*Math.cos(rad(60*i))).toFixed(1)} ${(y+r*Math.sin(rad(60*i))).toFixed(1)}`).join('L')}Z" fill="url(#cpd-sugar)" stroke="#a8843f" stroke-width="1.2" stroke-linejoin="round"/>`+T(x,y+5,'糖',{size:13,anchor:'middle',weight:700,fill:'#6b4e16'});
const compoundAny=(key,x,y,sc,rot,o)=>key==='SUG'?compoundSugar(x,y,17*sc):COMPOUND_MOL[key]?compoundMol(key,x,y,sc,rot,o):compoundAtom(key,+x.toFixed(1),+y.toFixed(1),sc,o);
const compoundD=key=>key==='SUG'?34:COMPOUND_MOL[key]?COMPOUND_MOL[key].d:COMPOUND_EL[key].r*2;
/* 氣體：每個粒子在自己的格子裡慢慢漂移、轉動（不會互相重疊）；seed 決定排法 */
function compoundGas(parts,x,y,w,h,sc,t,seed,o={}){const list=parts.flatMap(([k,n])=>Array(n).fill(k)),n=list.length;let best=null;
  for(let c=2;c<=8;c++){const r=Math.ceil(n/c),m=Math.min(w/c,h/r)-(c*r-n)*2;if(!best||m>best.m)best={c,r,m};}
  const cw=w/best.c,ch=h/best.r,cells=[];for(let j=0;j<best.r;j++)for(let i=0;i<best.c;i++)cells.push([x+(i+.5)*cw,y+(j+.5)*ch]);
  for(let i=cells.length-1;i>0;i--){const j=Math.floor(rnd(seed*7.13+i*3.31)*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
  const order=list.map((k,i)=>[rnd(seed*1.7+i*9.1),k]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);
  return order.map((k,i)=>{const d=compoundD(k)*sc,ax=Math.max(0,(cw-d)/2-2),ay=Math.max(0,(ch-d)/2-2),p=rnd(seed+i*5.7)*6.28,q=rnd(seed+i*8.3)*6.28;
    const px=cells[i][0]+ax*Math.sin(t*(.5+rnd(i+seed)*.5)+p),py=cells[i][1]+ay*Math.cos(t*(.45+rnd(i*2+seed)*.5)+q),rot=rnd(seed+i*3.9)*360+t*(rnd(i*4.4+seed)>.5?1:-1)*(10+rnd(i*6.1)*14);
    return compoundAny(k,px,py,sc,rot,o);}).join('');}
/* 液體：靠得很近、位置不固定地晃動。pick(i) 傳回第 i 個位置放什麼粒子 */
function compoundLiquid(pick,x,y,w,h,sx,sy,sc,t,free=true){let out='',i=0;const cols=Math.floor((w-sx*.5)/sx),rows=Math.floor(h/sy),x0=x+(w-(cols-.5)*sx)/2,y0=y+h-(rows-.5)*sy-3;
  for(let j=0;j<rows;j++)for(let c=0;c<cols;c++,i++){const k=pick(i,cols*rows),px=x0+c*sx+(j%2?sx/2:0)+2.6*Math.sin(t*1.7+i*2.3),py=y0+j*sy+2.6*Math.cos(t*1.5+i*1.9);
    const rot=(free?rnd(i*3.7)*360:(rnd(i*3.7)>.5?180:0)+rnd(i*5.1)*30-15)+14*Math.sin(t*1.1+i);out+=compoundAny(k,px,py,sc,rot);}
  return out;}
/* 金屬：原子緊密堆積（el 可以是函式，用來畫合金） */
function compoundMetal(cx,cy,cols,rows,r,t,el,o={}){let out='';const dy=r*1.732,x0=cx-(cols-.5)*r,y0=cy-(rows-1)*dy/2;
  for(let j=0;j<rows;j++)for(let c=0;c<cols-(j%2);c++){const i=j*cols+c,e=typeof el==='function'?el(i):el,x=x0+c*2*r+(j%2?r:0)+r*.5+.7*Math.sin(t*8+i*2.1),y=y0+j*dy+.7*Math.cos(t*7+i*1.3);
    out+=compoundAtom(e,+x.toFixed(1),+y.toFixed(1),(r-.6)/COMPOUND_EL[e].r,o);}
  return out;}
/* 氯化鈉：鈉、氯粒子依 1：1 交錯排列 */
function compoundSalt(cx,cy,cols,rows,sp,t,o={}){let out='';const sc=sp/31;
  for(let pass=0;pass<2;pass++)for(let j=0;j<rows;j++)for(let c=0;c<cols;c++){const na=(c+j)%2===0;if(na!==(pass===0))continue;const i=j*cols+c,x=cx+(c-(cols-1)/2)*sp+.6*Math.sin(t*8+i*2.1),y=cy+(j-(rows-1)/2)*sp+.6*Math.cos(t*7+i*1.3);
    out+=compoundAtom(na?'Na':'Cl',+x.toFixed(1),+y.toFixed(1),sc*(na?.98:1.02),o);}
  return out;}
/* 鑽石：每個碳原子和周圍的碳原子相連（平面示意） */
function compoundDia(cx,cy,cols,rows,sx,sy,r,t,o={}){const pt=(c,j)=>[cx+(c-(cols-1)/2)*sx+(j%2?sx/2:0)-sx/4,cy+(j-(rows-1)/2)*sy];let b='',a='';
  for(let j=0;j<rows;j++)for(let c=0;c<cols;c++){const[x,y]=pt(c,j);if(j<rows-1)for(const c2 of j%2?[c,c+1]:[c-1,c]){if(c2<0||c2>=cols)continue;const[x2,y2]=pt(c2,j+1);b+=`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#8b979c" stroke-width="${(r*.42).toFixed(1)}" stroke-linecap="round"/>`;}
    a+=compoundAtom('C',+(x+.5*Math.sin(t*8+(j*cols+c)*2.1)).toFixed(1),+(y+.5*Math.cos(t*7+(j*cols+c))).toFixed(1),r/14,o);}
  return b+a;}
/* 石墨：碳原子連成一層一層的六角形網（斜看的示意） */
function compoundGra(cx,cy,a,r,o={}){let out='';const cols=7,rows=3,W=(cols-1)*a*.866,Hh=(rows-1)*1.5*a+a/2;
  for(const ly of [58,-58]){const pt=(i,j)=>{const x=i*a*.866-W/2,y=j*1.5*a+((i+j)%2?a/2:0)-Hh/2;return[+(cx+x+.6*y).toFixed(1),+(cy+ly+.5*y).toFixed(1)];};let b='',at='';
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const[x,y]=pt(i,j);if(i<cols-1){const[x2,y2]=pt(i+1,j);b+=`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#8b979c" stroke-width="${(r*.42).toFixed(1)}"/>`;}
      if(j<rows-1&&(i+j)%2){const[x2,y2]=pt(i,j+1);b+=`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#8b979c" stroke-width="${(r*.42).toFixed(1)}"/>`;}at+=compoundAtom('C',x,y,r/14,o);}
    out+=b+at;}
  return out;}
const compoundLegend=(x,y,els,extra='')=>els.map((e,i)=>`<circle cx="${x+i*74+9}" cy="${y-5}" r="8" fill="url(#cpd-${e})" stroke="${COMPOUND_EL[e].d}"/>`+T(x+i*74+22,y,`${COMPOUND_EL[e].n} ${e}`,{size:14,fill:P.muted})).join('')+extra;
const compoundPanel=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx||14}" fill="${o.fill||'#fffdf8'}" stroke="${o.stroke||'#ddd7c9'}" stroke-width="${o.sw||1.5}"/>`;
const compoundChip=(x,y,w,t,c)=>`<rect x="${x}" y="${y-21}" width="${w}" height="30" rx="15" fill="${c}"/>`+T(x+w/2,y,t,{size:16,anchor:'middle',weight:700,fill:'#fff'});
const COMPOUND_CLS={E:['元素',P.accent],C:['化合物',P.orange],M:['混合物','#7a5aa8']};
/* 6-1 物質的分類：st 狀態（g 氣體、l 液體、s 固體）、cls 分類、pk 粒子、ek 元素、r 兩行理由 */
const COMPOUND_SUB={
  o2:{n:'氧氣',f:'O₂',st:'g',cls:'E',ic:'jar',gas:[['O2',14]],els:['O'],pk:'1 種（O₂ 分子）',ek:'1 種（氧）',r:['只有一種粒子（O₂ 分子）→ 純物質','O₂ 分子只由氧原子組成 → 元素']},
  he:{n:'氦氣',f:'He',st:'g',cls:'E',ic:'jar',gas:[['He',16]],els:['He'],pk:'1 種（He 原子）',ek:'1 種（氦）',r:['只有一種粒子（He 原子）→ 純物質','只有氦一種原子 → 元素']},
  cu:{n:'銅',f:'Cu',st:'s',cls:'E',ic:'block',col:'#c27a45',els:['Cu'],pk:'1 種（銅原子）',ek:'1 種（銅）',r:['只有銅原子，緊密堆在一起 → 純物質','只有銅一種原子 → 元素（化學式寫 Cu）']},
  dia:{n:'鑽石',f:'C',st:'s',cls:'E',ic:'gem',els:['C'],pk:'1 種（碳原子）',ek:'1 種（碳）',r:['只有碳原子，互相連結 → 純物質','只有碳一種原子 → 元素（化學式寫 C）']},
  h2o:{n:'水',f:'H₂O',st:'l',cls:'C',ic:'beaker',col:'#bcdcec',els:['H','O'],pk:'1 種（H₂O 分子）',ek:'2 種（氫、氧）',r:['只有一種粒子（H₂O 分子）→ 純物質','分子由氫、氧兩種原子結合 → 化合物']},
  co2:{n:'二氧化碳',f:'CO₂',st:'g',cls:'C',ic:'jar',gas:[['CO2',12]],els:['C','O'],pk:'1 種（CO₂ 分子）',ek:'2 種（碳、氧）',r:['只有一種粒子（CO₂ 分子）→ 純物質','分子由碳、氧兩種原子結合 → 化合物']},
  nacl:{n:'食鹽（氯化鈉）',f:'NaCl',st:'s',cls:'C',ic:'salt',els:['Na','Cl'],pk:'鈉、氯依 1：1 排列',ek:'2 種（鈉、氯）',r:['只有氯化鈉一種物質 → 純物質','鈉、氯兩種元素依 1：1 結合 → 化合物']},
  eth:{n:'酒精（乙醇）',f:'C₂H₅OH',st:'l',cls:'C',ic:'beaker',col:'#e3eef2',els:['C','H','O'],pk:'1 種（酒精分子）',ek:'3 種（碳、氫、氧）',r:['只有一種粒子（酒精分子）→ 純物質','分子由碳、氫、氧三種原子結合 → 化合物']},
  air:{n:'空氣',f:'',st:'g',cls:'M',ic:'jar',gas:[['N2',15],['O2',4],['Ar',1]],els:['N','O','Ar'],pk:'N₂、O₂、Ar 等好幾種',ek:'氮、氧、氬…',r:['有氮氣、氧氣、氬等好幾種物質 → 混合物','各種粒子各自分開，沒有結合在一起']},
  sugar:{n:'糖水',f:'',st:'l',cls:'M',ic:'beaker',col:'#efe6c8',els:['H','O'],pk:'2 種（水分子、糖分子）',ek:'碳、氫、氧',r:['有水和糖兩種物質 → 混合物','糖分子分散在水分子之間，沒有結合']},
  salt:{n:'食鹽水',f:'',st:'l',cls:'M',ic:'beaker',col:'#cfe3ec',els:['H','O','Na','Cl'],pk:'水分子和食鹽的粒子',ek:'氫、氧、鈉、氯',r:['有水和食鹽兩種物質 → 混合物','食鹽的粒子分散在水分子之間']},
  brass:{n:'黃銅（銅鋅合金）',f:'',st:'s',cls:'M',ic:'block',col:'#d6ac3e',els:['Cu','Zn'],pk:'2 種（銅原子、鋅原子）',ek:'2 種（銅、鋅）',r:['有銅和鋅兩種物質 → 混合物（合金）','兩種原子混在一起，比例可以改變']}};
const COMPOUND_STATE={g:'氣體',l:'液體',s:'固體'};
/* 6-5 粒子模型圖鑑 */
const COMPOUND_KINDS=[['單原子（鈍氣）',['He','Ne','Ar']],['元素的分子',['H2','O2','N2','Cl2','O3']],['化合物的分子',['H2O','CO2','NH3','CH4','HCl']],['不是一個個分子',['Cu','Fe','DIA','GRA','NaCl']]];
const COMPOUND_LAT={Cu:{n:'銅',fs:'Cu',cls:'E',els:['Cu']},Fe:{n:'鐵',fs:'Fe',cls:'E',els:['Fe']},DIA:{n:'鑽石',fs:'C',cls:'E',els:['C']},GRA:{n:'石墨',fs:'C',cls:'E',els:['C']},NaCl:{n:'食鹽（氯化鈉）',fs:'NaCl',cls:'C',els:['Na','Cl']}};
const COMPOUND_KLABEL={DIA:'鑽石',GRA:'石墨'};
const compoundKind=k=>COMPOUND_LAT[k]||COMPOUND_MOL[k];
/* 6-5 粒子圖判讀：12 種題型 */
const COMPOUND_BUILD=[
  {ans:'E',parts:[['O2',11]],nm:'氧氣 O₂',r:'只有一種分子，分子裡只有一種原子'},
  {ans:'C',parts:[['H2O',11]],nm:'水 H₂O',r:'只有一種分子，分子由兩種原子結合'},
  {ans:'M',parts:[['H2',6],['O2',5]],nm:'氫氣 H₂ 和氧氣 O₂ 混合',r:'有兩種分子，各自分開、沒有結合'},
  {ans:'E',parts:[['He',12]],nm:'氦氣 He',r:'只有一種原子，各自獨立'},
  {ans:'C',parts:[['CO2',10]],nm:'二氧化碳 CO₂',r:'只有一種分子，分子由兩種原子結合'},
  {ans:'M',parts:[['He',6],['Ne',6]],nm:'氦氣 He 和氖氣 Ne 混合',r:'兩種原子各自分開，並沒有結合'},
  {ans:'E',lat:'Cu',nm:'銅 Cu',r:'只有一種原子，緊密堆在一起'},
  {ans:'C',parts:[['NH3',10]],nm:'氨 NH₃',r:'只有一種分子，分子由兩種原子結合'},
  {ans:'M',parts:[['O2',6],['O3',5]],nm:'氧氣 O₂ 和臭氧 O₃ 混合',r:'原子只有一種，但有兩種不同的分子'},
  {ans:'E',parts:[['O3',10]],nm:'臭氧 O₃',r:'只有一種分子，分子裡只有一種原子'},
  {ans:'C',parts:[['HCl',11]],nm:'氯化氫 HCl',r:'只有一種分子，分子由兩種原子結合'},
  {ans:'M',parts:[['H2O',6],['CO2',5]],nm:'水 H₂O 和二氧化碳 CO₂ 混合',r:'有兩種分子（兩種化合物混在一起）'}];
const compoundBuildI=s=>{const n=COMPOUND_BUILD.length,lap=Math.floor(s.bi/n);return lap%2?(s.bi*5+3)%n:s.bi%n;};
/* 想一想與例題 */
const COMPOUND_Q={
  sort:['空氣裡有氮氣和氧氣，空氣是化合物嗎？糖水呢？','都<b>不是</b>，兩者都是<b>混合物</b>。化合物是不同元素的原子<b>結合</b>成的另一種物質，組成固定；混合物只是幾種物質<b>混在一起</b>，各成分保有原來的性質，比例也可以改變。空氣裡的氮分子、氧分子各自分開；糖水蒸乾後，糖還是糖。'],
  split:['把食鹽水蒸乾得到食鹽，和把水電解得到氫氣、氧氣，這兩種「分開」有什麼不同？','蒸發是<b>物理方法</b>：食鹽和水本來只是混在一起，分開後還是食鹽和水，沒有產生新物質。電解是<b>化學方法</b>：水分子被拆開，原子重新組合成氫氣和氧氣，產生了<b>新物質</b>。混合物用過濾、蒸發等物理方法就能分離；化合物要用通電、加熱等化學方法才能分解；元素不能再用一般的化學方法分解。'],
  kinds:['氧氣是由 O₂ 分子組成的。「由分子組成」就是化合物嗎？','<b>不是</b>。O₂ 分子由 2 個<b>同一種</b>原子結合而成，所以氧氣是<b>元素</b>。分元素或化合物要看<b>原子的種類</b>：只有一種是元素，兩種以上結合才是化合物。分子只是「幾個原子結合成的粒子」，元素和化合物都可能以分子存在。'],
  formula:['2H₂O 和 H₂O₂ 裡都有數字 2，意思一樣嗎？','不一樣。<b>2H₂O</b> 前面的 2 是<b>係數</b>：有 2 個水分子；右下角的 2 是<b>下標</b>：一個水分子裡有 2 個氫原子。<b>H₂O₂</b>（過氧化氫，雙氧水的成分）是另一種物質，一個分子有 2 個氫原子和 2 個氧原子。改下標就變成別的物質，改係數只是改變分子的個數。'],
  build:['粒子圖裡有兩種顏色的原子，就一定是化合物嗎？','<b>不一定</b>。要看兩種原子有沒有<b>結合在同一個粒子裡</b>：每個粒子都相同，而且裡面有兩種原子，才是化合物。如果是兩種粒子各自分開（例如 H₂ 和 O₂ 混在一起），就是混合物。']};
for(const k of Object.keys(COMPOUND_Q))COMPOUND_Q[k]=COMPOUND_Q[k].map(compoundHtml);
const COMPOUND_QUIZ=[
  {q:'下列哪一種物質是<b>元素</b>？',opts:['水','二氧化碳','氧氣','空氣'],ans:2,
    sol:'氧氣只由<b>氧一種原子</b>組成（O₂ 分子），是元素。水（氫、氧）和二氧化碳（碳、氧）是化合物；空氣含有氮氣、氧氣等，是混合物。',go:s=>{s.mode='sort';s.sub='o2';s.guess=false;},goLabel:'看氧氣的粒子圖'},
  {q:'下列哪一種物質是<b>混合物</b>？',opts:['食鹽（氯化鈉）','酒精（乙醇）','鑽石','黃銅'],ans:3,
    sol:'黃銅是銅和鋅熔合成的<b>合金</b>，兩種金屬混在一起、比例可以改變，是混合物。食鹽、酒精是化合物，鑽石是只由碳原子組成的元素。',go:s=>{s.mode='sort';s.sub='brass';s.guess=false;},goLabel:'看黃銅的粒子圖'},
  {q:'電解水時，兩極產生的氣體和體積比，何者正確？',opts:['正極產生氫氣，氫：氧 ＝ 2：1','負極產生氫氣，氫：氧 ＝ 2：1','負極產生氫氣，氫：氧 ＝ 1：2','負極產生氧氣，氫：氧 ＝ 2：1'],ans:1,
    sol:'<b>負極</b>產生氫氣、<b>正極</b>產生氧氣，體積比 氫：氧 ＝ <b>2：1</b>。',go:s=>{s.mode='split';s.tm=10;s.play=false;s.test='none';},goLabel:'看電解的結果'},
  {q:'電解水一段時間後，負極的試管收集到 12 mL 氣體。正極的試管大約收集到多少氣體？',opts:['6 mL','12 mL','24 mL','36 mL'],ans:0,
    sol:'負極是氫氣、正極是氧氣，體積比 2：1。氧氣 ＝ 12 ÷ 2 ＝ <b>6 mL</b>。',go:s=>{s.mode='split';s.tm=6;s.play=false;s.test='none';},goLabel:'通電到氫氣 12 mL'},
  {q:'把有餘燼的線香伸入一瓶氣體中，線香立刻<b>復燃</b>。這瓶氣體最可能是：',opts:['氫氣','二氧化碳','氮氣','氧氣'],ans:3,
    sol:'氧氣有<b>助燃性</b>，能使有餘燼的線香復燃。氫氣有可燃性，點火會有爆鳴聲；二氧化碳和氮氣不助燃。',go:s=>{s.mode='split';s.tm=10;s.play=false;s.test='o2';},goLabel:'檢驗正極的氣體'},
  {q:'關於元素、化合物和分子，下列敘述何者正確？',opts:['由分子組成的物質都是化合物','化合物可以用過濾的方法分解成元素','氧氣由 O₂ 分子組成，是元素','元素加熱後可以分解成更簡單的物質'],ans:2,
    sol:'O₂ 分子只含氧一種原子，所以氧氣是<b>元素</b>。分子不一定是化合物；化合物要用化學方法（通電、加熱）才能分解，過濾是物理方法；元素不能再用一般的化學方法分解。',go:s=>{s.mode='kinds';s.kd='O2';},goLabel:'看 O₂ 的模型'},
  {q:'下列哪一種物質<b>不是</b>由一個個分子組成的？',opts:['二氧化碳 CO₂','銅 Cu','氨 NH₃','氧氣 O₂'],ans:1,
    sol:'金屬是由原子緊密堆積而成，沒有一個個分子，所以化學式只寫元素符號 <b>Cu</b>。CO₂、NH₃、O₂ 都以分子存在。',go:s=>{s.mode='kinds';s.kd='Cu';},goLabel:'看銅的模型'},
  {q:'3CO₂ 中共有多少個氧原子？',opts:['2 個','3 個','5 個','6 個'],ans:3,
    sol:'係數 3：有 3 個 CO₂ 分子；下標 2：每個分子有 2 個氧原子。3 × 2 ＝ <b>6 個</b>。',go:s=>{s.mode='formula';s.fs='CO2';s.k=3;s.hl='O';},goLabel:'用化學式驗證'},
  {q:'一個硫酸分子 H₂SO₄ 是由幾種元素、幾個原子組成的？',opts:['3 種元素、7 個原子','3 種元素、6 個原子','4 種元素、7 個原子','7 種元素、3 個原子'],ans:0,
    sol:'元素有氫、硫、氧 <b>3 種</b>；原子數 2 ＋ 1 ＋ 4 ＝ <b>7 個</b>（S 右下角沒有數字，代表 1 個）。',go:s=>{s.mode='formula';s.fs='H2SO4';s.k=1;s.hl='none';},goLabel:'用化學式驗證'},
  {q:'密閉容器中有許多 H₂ 分子和 O₂ 分子，彼此沒有結合。容器裡的物質屬於：',opts:['元素','化合物','混合物','純物質'],ans:2,
    sol:'容器裡有<b>兩種</b>分子，各自分開，是<b>混合物</b>。兩種元素要結合成同一種分子（例如 H₂O）才是化合物。',go:s=>{s.mode='build';s.bi=2;s.bp='';},goLabel:'看這個粒子圖'}];
COMPOUND_QUIZ.forEach(Q=>{Q.q=compoundHtml(Q.q);Q.sol=compoundHtml(Q.sol);Q.opts=Q.opts.map(compoundHtml);});

LABS.compound={group:5,n:'6-1',keep:['mode'],steps:'mode',
  stepGroups:[{label:'6-1 元素與化合物',keys:['sort','split']},{label:'6-5 分子與化學式',keys:['kinds','formula','build']}],
  tasks:{sort:'換不同的物質，先看放大的粒子圖：裡面有幾種粒子？每種粒子由幾種原子組成？再對照右邊的分類。',
    split:'按「通電」：哪一極收集到的氣體比較多？兩支試管的氣體體積比是多少？再選一種方法檢驗氣體。',
    kinds:'一個一個點來看：哪些是分子？哪些分子只由同一種原子組成？哪些物質沒有一個個分子？',
    formula:'把前面的數字由 1 調到 6，再換不同的化學式：哪個數字決定分子的個數？哪個數字決定一個分子裡的原子個數？',
    build:'先數有幾種粒子，再看每種粒子由幾種原子組成，然後在圖上點選答案。'},
  name:'元素與化合物、分子與化學式',subtitle:'物質分成純物質和混合物，純物質又分成元素和化合物。化學式用元素符號和數字，表示物質由哪些原子、各幾個組成。',
  q:s=>({html:qBlockHTML(COMPOUND_Q[s.mode])+quizHTML(s,COMPOUND_QUIZ)}),
  qAction(s,v){quizAction(s,v,COMPOUND_QUIZ);},
  state:{mode:'sort',t:0,sub:'o2',guess:false,rev:false,tm:0,play:false,test:'none',eq:false,kd:'H2O',lab:true,fs:'H2O',k:3,hl:'none',bi:0,bp:'',bs:0,bn:0,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'分頁',options:[['sort','物質的分類'],['split','化合物可以再分解'],['kinds','原子與分子'],['formula','讀化學式'],['build','粒子圖判讀']],onChange:s=>{s.play=false;}},
    {type:'seg',key:'sub',label:'物質',options:Object.entries(COMPOUND_SUB).map(([k,v])=>[k,v.n.replace(/（.*/,'')]),onChange:s=>{s.rev=false;},show:s=>s.mode==='sort'},
    {type:'toggle',key:'guess',label:'先猜再看：先不顯示分類',onChange:s=>{s.rev=false;},show:s=>s.mode==='sort'},
    {type:'buttons',items:[['揭曉答案',s=>{s.rev=true;}]],primary:true,show:s=>s.mode==='sort'&&s.guess&&!s.rev},
    {type:'range',key:'tm',label:'通電時間',min:0,max:10,step:.5,fmt:s=>s.tm.toFixed(1)+' 分鐘',show:s=>s.mode==='split'},
    {type:'buttons',label:'電源',items:[['▶ 通電／暫停',s=>{if(reduceMotion){s.tm=10;s.play=false;return;}if(s.tm>=10)s.tm=0;s.play=!s.play;}],['重新開始',s=>{s.tm=0;s.play=false;}]],show:s=>s.mode==='split'},
    {type:'seg',key:'test',label:'檢驗氣體',options:[['none','先不檢驗'],['h2','點燃的火柴 → 負極的氣體'],['o2','有餘燼的線香 → 正極的氣體']],show:s=>s.mode==='split'},
    {type:'toggle',key:'eq',label:'（延伸）顯示化學反應式',adv:true,show:s=>s.mode==='split'},
    {type:'seg',key:'kd',label:'粒子',options:COMPOUND_KINDS.flatMap(([,ks])=>ks.map(k=>[k,COMPOUND_KLABEL[k]||compoundHtml(compoundKind(k).fs)])),show:s=>s.mode==='kinds'},
    {type:'seg',key:'fs',label:'化學式',options:['H2O','CO2','O2','NH3','CH4','H2SO4','C2H5OH','C6H12O6'].map(k=>[k,compoundHtml(COMPOUND_MOL[k].fs)]),show:s=>s.mode==='formula'},
    {type:'range',key:'k',label:'前面的數字（係數）',min:1,max:6,step:1,show:s=>s.mode==='formula'},
    {type:'seg',key:'hl',label:'標出同一種原子',options:[['none','不標示'],['H','氫 H'],['C','碳 C'],['O','氧 O'],['N','氮 N'],['S','硫 S']],show:s=>s.mode==='formula'},
    {type:'toggle',key:'lab',label:'顯示原子符號',show:s=>s.mode==='kinds'||s.mode==='formula'},
    {type:'buttons',label:'題目',items:[['下一題',s=>{s.bi++;s.bp='';}],['分數歸零',s=>{s.bs=0;s.bn=0;s.bp='';}]],show:s=>s.mode==='build'}],
  tick(s,dt){s.t+=dt;if(s.mode==='split'&&s.play){s.tm=Math.min(10,s.tm+dt*.8);if(s.tm>=10)s.play=false;}},
  tap(s,v){const[k,x]=v.split(':');
    if(k==='ans'){if(s.mode==='build'&&!s.bp&&COMPOUND_CLS[x]){s.bp=x;s.bn++;if(x===COMPOUND_BUILD[compoundBuildI(s)].ans)s.bs++;}}
    else if(k==='next'){if(s.bp){s.bi++;s.bp='';}}
    else if(k==='kd'&&compoundKind(x))s.kd=x;},
  render(s){const out=this[s.mode](s,reduceMotion?0:s.t);return {svg:COMPOUND_DEFS+out.svg,reads:out.reads.map(([a,b])=>[a,compoundHtml(b)]),note:compoundHtml(out.note)};},

  /* ---- 1 物質的分類 ---- */
  icon(S,cx,cy){const g='#8fa3a8';
    if(S.ic==='jar')return `<rect x="${cx-30}" y="${cy-44}" width="60" height="88" rx="10" fill="#e2eff3" stroke="${g}" stroke-width="2.5"/><rect x="${cx-37}" y="${cy-52}" width="74" height="9" rx="3" fill="#dfe9ec" stroke="${g}" stroke-width="2"/><path d="M${cx-19} ${cy-32}v62" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`;
    if(S.ic==='beaker')return `<path d="M${cx-30} ${cy-8}H${cx+30}V${cy+40}a4 4 0 0 1-4 4H${cx-26}a4 4 0 0 1-4-4Z" fill="${S.col}"/><path d="M${cx-30} ${cy-8}H${cx+30}" stroke="${compoundMix(S.col,'#000000',.2)}" stroke-width="2"/><path d="M${cx-36} ${cy-44}q6 0 6 6V${cy+40}a4 4 0 0 0 4 4H${cx+26}a4 4 0 0 0 4-4V${cy-44}" fill="none" stroke="${g}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx-20} ${cy-34}v66" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
    if(S.ic==='block'){const c=S.col,l=compoundMix(c,'#ffffff',.45),d=compoundMix(c,'#000000',.28);return `<path d="M${cx-38} ${cy-6}l16-16h60l-16 16Z" fill="${l}" stroke="${d}" stroke-linejoin="round"/><path d="M${cx+22} ${cy-6}l16-16v34l-16 16Z" fill="${d}" stroke="${d}" stroke-linejoin="round"/><rect x="${cx-38}" y="${cy-6}" width="60" height="34" fill="${c}" stroke="${d}"/><path d="M${cx-32} ${cy+1}h36" stroke="${l}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;}
    if(S.ic==='gem')return `<path d="M${cx-34} ${cy-12}l14-18h40l14 18l-34 42Z" fill="#e6f5fb" stroke="#7fa4b6" stroke-width="2" stroke-linejoin="round"/><path d="M${cx-34} ${cy-12}h68M${cx-20} ${cy-30}l8 18l12-18l12 18l8-18M${cx-12} ${cy-12}l12 42l12-42" fill="none" stroke="#7fa4b6" stroke-width="1.4" stroke-linejoin="round"/><path d="M${cx-12} ${cy-12}l12-18l12 18Z" fill="#fff"/>`;
    const cube=(x,y,a)=>`<path d="M${x} ${y}l${a} ${-a*.5}l${a} ${a*.5}l${-a} ${a*.5}Z" fill="#fff" stroke="#9aa8ad"/><path d="M${x} ${y}v${a}l${a} ${a*.5}v${-a}Z" fill="#eef1f2" stroke="#9aa8ad"/><path d="M${x+2*a} ${y}v${a}l${-a} ${a*.5}v${-a}Z" fill="#d9dfe1" stroke="#9aa8ad"/>`;
    return `<ellipse cx="${cx}" cy="${cy+30}" rx="42" ry="10" fill="#eef4f5" stroke="${g}" stroke-width="2"/>`+cube(cx-30,cy+4,12)+cube(cx+6,cy+6,11)+cube(cx-13,cy-14,13)+cube(cx-10,cy+14,10);},
  view(key,S,x,y,w,h,t){let g='';const cx=x+w/2,cy=y+h/2;
    if(S.st==='g')g=compoundGas(S.gas,x+8,y+8,w-16,h-16,key==='air'?.86:key==='co2'?.9:1,t,3);
    else if(S.st==='l'){const top=y+h*.2;g=`<rect x="${x}" y="${top}" width="${w}" height="${y+h-top}" fill="${S.col}" opacity=".55"/><path d="M${x} ${top}H${x+w}" stroke="${compoundMix(S.col,'#000000',.22)}" stroke-width="2.5"/>`;
      if(key==='eth')g+=compoundLiquid(()=>'C2H5OH',x+4,top+10,w-8,y+h-top-12,72,44,.6,t,false);
      else{const sol=key==='sugar'?{5:'SUG',16:'SUG',22:'SUG',31:'SUG',38:'SUG'}:key==='salt'?{3:'Na',10:'Cl',17:'Na',20:'Cl',26:'Na',33:'Cl',36:'Na',40:'Cl'}:{};g+=compoundLiquid(i=>sol[i]||'H2O',x+4,top+8,w-8,y+h-top-10,42,38,.74,t);}}
    else if(key==='cu')g=compoundMetal(cx,cy,7,9,20,t,'Cu');
    else if(key==='brass')g=compoundMetal(cx,cy,7,9,20,t,i=>rnd(i*2.37+1)<.34?'Zn':'Cu');
    else if(key==='nacl')g=compoundSalt(cx,cy,8,8,35,t);
    else g=compoundDia(cx,cy,6,9,48,34,11,t);
    return `<clipPath id="cpd-view"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff"/><g clip-path="url(#cpd-view)">${g}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="none" stroke="#b9c7c4" stroke-width="2.5"/>`;},
  tree(cls,hide){const N={root:[690,100,'物質'],pure:[600,206,'純物質'],mix:[800,206,'混合物'],el:[530,312,'元素'],cp:[672,312,'化合物']},lit=hide?[]:cls==='M'?['root','mix']:['root','pure',cls==='E'?'el':'cp'],W=116,Hh=46;let h='';
    const edge=(a,b)=>{const on=lit.includes(a)&&lit.includes(b),[x1,y1]=N[a],[x2,y2]=N[b],my=(y1+Hh+y2)/2;return `<path d="M${x1} ${y1+Hh}V${my}H${x2}V${y2}" fill="none" stroke="${on?P.accent:hide?'#9aa7ab':P.faint}" stroke-width="${on?4.5:2.5}" stroke-linejoin="round"/>`;};
    for(const[a,b]of [['root','pure'],['root','mix'],['pure','el'],['pure','cp']])if(!(lit.includes(a)&&lit.includes(b)))h+=edge(a,b);
    for(const[a,b]of [['root','pure'],['root','mix'],['pure','el'],['pure','cp']])if(lit.includes(a)&&lit.includes(b))h+=edge(a,b);
    for(const k of Object.keys(N)){const[x,y,t]=N[k],on=lit.includes(k),leaf=k==='el'||k==='cp'||k==='mix',c=on&&leaf?COMPOUND_CLS[k==='el'?'E':k==='cp'?'C':'M'][1]:P.accent;
      h+=`<rect x="${x-W/2}" y="${y}" width="${W}" height="${Hh}" rx="12" fill="${on?c:'#fffdf8'}" stroke="${on?c:hide?'#7f8c90':P.faint}" stroke-width="2"/>`+T(x,y+30,t,{size:21,anchor:'middle',weight:700,fill:on?'#fff':hide?P.ink:'#9aa39f'});}
    const q=(x,y,t,a,on)=>T(x,y,t,{size:14,anchor:a,fill:on?P.accent:P.muted,weight:on?700:400});
    h+=q(634,166,'只有一種物質','end',lit.includes('pure'))+q(746,166,'兩種以上的物質','start',lit.includes('mix'));
    h+=q(520,272,'一種元素','end',lit.includes('el'))+q(682,272,'兩種以上的元素','start',lit.includes('cp'));
    return h;},
  sort(s,t){const S=COMPOUND_SUB[s.sub],hide=s.guess&&!s.rev,[cn,cc]=COMPOUND_CLS[S.cls];
    let h=T(150,56,S.n,{size:26,weight:700})+(S.f?compoundT(456,58,S.f,{size:28,anchor:'end',weight:700,fill:P.accent}):T(456,82,'沒有固定的化學式',{size:14,anchor:'end',fill:P.muted}));
    h+=T(150,82,'放大的粒子圖（示意）',{size:14,fill:P.muted});
    h+=`<path d="M86 270L150 94M86 310L150 440" stroke="#b9c7c4" stroke-width="1.5" stroke-dasharray="5 5" fill="none"/>`+this.icon(S,78,290)+`<circle cx="78" cy="290" r="21" fill="#fff" fill-opacity=".25" stroke="#6f8f8b" stroke-width="2" stroke-dasharray="4 4"/>`;
    h+=T(78,372,S.n.replace(/（.*/,''),{size:17,anchor:'middle',weight:700})+T(78,394,'常溫：'+COMPOUND_STATE[S.st],{size:14,anchor:'middle',fill:P.muted});
    h+=this.view(s.sub,S,150,94,306,346,t);
    h+=compoundLegend(152,468,S.els.slice(0,4),s.sub==='sugar'?compoundSugar(310,462,9).replace(/<text.*<\/text>/,'')+T(324,468,'糖分子',{size:14,fill:P.muted}):'');
    h+=T(690,56,'物質的分類',{size:18,anchor:'middle',weight:700,fill:P.muted})+this.tree(S.cls,hide);
    h+=compoundPanel(476,378,404,100);
    if(hide)h+=T(494,406,'先猜猜看：',{size:16,weight:700,fill:P.orange})+T(494,432,'① 粒子圖裡有幾種粒子？',{size:16})+T(494,458,'② 每種粒子由幾種原子組成？',{size:16});
    else h+=compoundT(494,406,'① '+S.r[0],{size:16})+compoundT(494,434,'② '+S.r[1],{size:16})+compoundChip(770,466,94,cn,cc)+T(494,462,S.n.replace(/（.*/,'')+'是',{size:16,weight:700})+`<path d="M${494+(S.n.replace(/（.*/,'').length+1)*16+8} 456H760" stroke="${cc}" stroke-width="2" stroke-dasharray="3 5"/>`;
    const extra={air:'空氣的成分：氮氣約 78 %、氧氣約 21 %，其餘是氬等氣體（圖中的粒子數是示意）。',brass:'合金是金屬和其他元素熔合成的<b>混合物</b>。',nacl:'食鹽是鈉、氯的粒子交錯排列而成，沒有一個個「NaCl 分子」。',dia:'鑽石和石墨都只由碳原子組成，是同一種元素。',cu:'金屬沒有一個個分子，化學式只寫元素符號。',sugar:'糖水蒸乾後糖還在：成分保有原來的性質。',salt:'食鹽水蒸乾後得到食鹽：混合物可以用物理方法分離。'}[s.sub]||'';
    return {svg:h,reads:[['物質',S.n+(S.f?'　'+S.f:'')],['粒子圖裡的粒子',S.pk],['原子（元素）種類',S.ek],['分類',hide?'？（先猜）':S.cls==='M'?'混合物':'純物質 · '+cn]],
      note:hide?'先看粒子圖再猜：只有一種物質是<b>純物質</b>，兩種以上是<b>混合物</b>；純物質裡只有一種原子是<b>元素</b>，兩種以上的原子結合是<b>化合物</b>。'
        :(S.cls==='M'?`${S.r[0].replace('→ ','→ <b>')}</b>。混合物的成分各自保有原來的性質，沒有固定的組成。`:`${S.r[0].replace('→ 純物質','→ <b>純物質</b>')}；${S.r[1].replace(/→ (元素|化合物)/,'→ <b>$1</b>')}。`)+(extra?'<br>'+extra:'')};},

  /* ---- 2 電解水 ---- */
  flame(x,y,k,t){const w=1+.08*Math.sin(t*11),hh=1+.12*Math.sin(t*14+1);return `<g transform="translate(${x} ${y}) scale(${(k*w).toFixed(3)} ${(k*hh).toFixed(3)})"><path d="M0 0C-9 -6 -7 -17 0 -28C7 -17 9 -6 0 0Z" fill="url(#cpd-flame)"/><path d="M0 -2C-4 -6 -3 -11 0 -16C3 -11 4 -6 0 -2Z" fill="#fff8d6" opacity=".9"/></g>`;},
  split(s,t){const tm=s.tm,vh=2*tm,vo=tm,p=tm/10,on=s.play&&tm<10,xL=185,xR=315,y0=106,px=8,yb=398,HC=COMPOUND_EL.H.ink,OC=COMPOUND_EL.O.ink;
    let h=T(250,40,'水　→　氫氣 ＋ 氧氣',{size:23,anchor:'middle',weight:700})+T(203,22,'通電',{size:14,anchor:'middle',fill:P.accent,weight:700});
    if(s.eq)h+=compoundT(250,64,'（延伸）2H₂O → 2H₂ ＋ O₂',{size:14,anchor:'middle',fill:P.muted});
    /* 水槽 */
    h+=`<rect x="83" y="306" width="334" height="122" fill="url(#cpd-water)" opacity=".75"/><path d="M83 306H417" stroke="#7fb1cb" stroke-width="2.5"/><path d="M74 286q6 0 6 6V424a6 6 0 0 0 6 6H414a6 6 0 0 0 6-6V292q0-6 6-6" fill="none" stroke="#83999d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="88" y="296" width="8" height="126" rx="4" fill="#fff" opacity=".55"/>`;
    /* 導線與電池 */
    h+=`<path d="M${xL} 430V461H222" fill="none" stroke="#39444b" stroke-width="3.5" stroke-linejoin="round"/><path d="M${xR} 430V461H282" fill="none" stroke="${P.red}" stroke-width="3.5" stroke-linejoin="round"/>`
      +`<rect x="222" y="447" width="56" height="28" rx="5" fill="url(#cpd-batt)"/><rect x="278" y="455" width="6" height="12" rx="2" fill="#8d999f"/><rect x="258" y="447" width="20" height="28" rx="5" fill="#c79a3a"/>`
      +T(236,467,'−',{size:18,anchor:'middle',weight:700,fill:'#fff'})+T(268,467,'＋',{size:15,anchor:'middle',weight:700,fill:'#3a2a08'});
    h+=T(xL-14,458,'負極',{size:16,anchor:'end',weight:700})+T(xR+14,458,'正極',{size:16,weight:700,fill:P.red})+`<circle cx="${xR+62}" cy="453" r="6" fill="${on?'#3fb26b':'#b9c0c4'}"/>`+T(xR+74,458,on?'通電中':'未通電',{size:14,fill:on?'#23804a':P.muted});
    h+=T(16,484,'水中加少量氫氧化鈉（幫助導電）',{size:13,fill:P.muted});
    /* 兩支試管 */
    const tube=(cx,V,name,c,nb,id)=>{const yi=y0+V*px,sh=`M${cx-20} ${yb}V${y0+8}a10 10 0 0 1 10-10h20a10 10 0 0 1 10 10V${yb}`;
      let g=`<clipPath id="cpd-${id}"><path d="${sh}Z"/></clipPath><g clip-path="url(#cpd-${id})"><rect x="${cx-22}" y="90" width="44" height="${yb-88}" fill="#bfdcea"/><rect x="${cx-22}" y="90" width="44" height="${(yi-90).toFixed(1)}" fill="#fcfefe"/><path d="M${cx-22} ${yi.toFixed(1)}H${cx+22}" stroke="#6fa6c2" stroke-width="2.5"/>`;
      if(on&&yi<350)for(let i=0;i<nb;i++){const f=(t*.55+i/nb+rnd(i*3.1+cx)*.2)%1,by=366-f*(366-yi-3),bx=cx+7*Math.sin(i*2.4+f*7);g+=`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(2.2+rnd(i+cx)*1.8).toFixed(1)}" fill="#fff" fill-opacity=".85" stroke="#7fb1cb"/>`;}
      g+=`<rect x="${cx-22}" y="90" width="44" height="${yb-88}" fill="url(#cpd-glassv)"/></g><path d="${sh}" fill="none" stroke="#83999d" stroke-width="3" stroke-linejoin="round"/>`;
      g+=`<rect x="${cx-3.5}" y="370" width="7" height="60" rx="2" fill="url(#cpd-rod)"/><rect x="${cx-9}" y="424" width="18" height="9" rx="2" fill="#6b777e"/>`;
      g+=T(cx,90,name,{size:17,anchor:'middle',weight:700,fill:V>0?c:P.muted});return g;};
    h+=tube(xL,vh,'氫氣',HC,9,'tl')+tube(xR,vo,'氧氣',OC,5,'tr');
    for(let v=0;v<=20;v++){const yy=y0+v*px,b=v%5===0;h+=L(xL+22,yy,xL+(b?33:28),yy,{stroke:P.muted,w:b?1.6:1})+L(xR-22,yy,xR-(b?33:28),yy,{stroke:P.muted,w:b?1.6:1});if(b)h+=T(250,yy+5,v,{size:14,anchor:'middle',fill:P.muted});}
    h+=T(250,y0-14,'mL',{size:13,anchor:'middle',fill:P.muted});
    h+=`<path d="M${xL-24} ${y0+vh*px}H${xL-44}" stroke="${HC}" stroke-width="2"/>`+T(xL-48,y0+vh*px+6,vh.toFixed(1)+' mL',{size:19,anchor:'end',weight:700,fill:HC})
      +`<path d="M${xR+24} ${y0+vo*px}H${xR+44}" stroke="${OC}" stroke-width="2"/>`+T(xR+48,y0+vo*px+6,vo.toFixed(1)+' mL',{size:19,weight:700,fill:OC});
    /* 粒子圖：6 個水分子，一次兩個拆開重組 */
    h+=compoundPanel(480,20,400,268)+T(498,46,'放大看粒子（示意）',{size:15,weight:700,fill:P.muted});
    const sm=q=>q*q*(3-2*q),mv=(el,a,b,e,up)=>compoundAtom(el,+(a[0]+(b[0]-a[0])*e).toFixed(1),+(a[1]+(b[1]-a[1])*e-up*Math.sin(Math.PI*e)).toFixed(1),.88);
    let nw=0,nh=0,no=0,lo='',hi='';
    for(let r=0;r<3;r++){const q=clamp((p*3-r)/.75,0,1),e=sm(q),y=92+r*50;if(q<=0)nw+=2;else if(q>=1){nh+=2;no+=1;}
      [[652,516],[708,566]].forEach(([wx,hx],j)=>{lo+=mv('H',[wx-12.5,y+8],[hx-7,y],e,12+j*5)+mv('H',[wx+12.5,y+8],[hx+7,y],e,20+j*5);hi+=mv('O',[wx,y-2],[824+(j?10:-10),y],e,j?-14:16);});}
    h+=`<path d="M606 62V238M762 62V238" stroke="${P.faint}" stroke-width="1.5" stroke-dasharray="4 6"/>`+lo+hi;
    h+=T(541,226,`氫分子 ${nh} 個`,{size:15,anchor:'middle',weight:700,fill:HC})+T(680,226,`水分子 ${nw} 個`,{size:15,anchor:'middle',weight:700})+T(824,226,`氧分子 ${no} 個`,{size:15,anchor:'middle',weight:700,fill:OC});
    h+=T(680,254,'氫原子 12 個、氧原子 6 個：數目沒有變，只是重新組合',{size:14,anchor:'middle',fill:P.muted})+T(680,276,'負極這一側　　　　　　　　　　　　　　正極這一側',{size:13,anchor:'middle',fill:P.muted});
    /* 檢驗或性質比較 */
    h+=compoundPanel(480,300,400,180);
    if(s.test==='none'){h+=T(498,326,'性質比一比',{size:15,weight:700,fill:P.muted});
      [['H2O','水（化合物）','可以滅火',P.ink],['H2','氫氣（元素）','可以燃燒（可燃性）',HC],['O2','氧氣（元素）','幫助燃燒（助燃性）',OC]].forEach(([k,a,b,c],i)=>{const y=356+i*36;h+=compoundMol(k,520,y-5,.72,0)+T(552,y,a,{size:16,weight:700,fill:c})+T(690,y,b,{size:16});});
      h+=T(498,468,'化合物的性質，和組成它的元素不同。',{size:15,fill:P.accent,weight:700});}
    else{const isH=s.test==='h2',ok=(isH?vh:vo)>=2,c=isH?HC:OC;h+=T(498,326,isH?'檢驗負極的氣體':'檢驗正極的氣體',{size:15,weight:700,fill:P.muted});
      if(isH){h+=`<g transform="rotate(-12 560 400)"><path d="M610 384H520a16 16 0 0 0 0 32H610" fill="#fcfefe" stroke="#83999d" stroke-width="3" stroke-linejoin="round"/><path d="M522 392H600" stroke="#fff" stroke-width="4"/></g>`+T(548,446,'氫氣',{size:14,anchor:'middle',fill:c,weight:700});
        h+=`<path d="M644 440L628 392" stroke="#b98a4b" stroke-width="4" stroke-linecap="round"/><circle cx="627" cy="391" r="4" fill="#5a2f1a"/>`+this.flame(627,389,.8,t);
        if(ok){const k=1+.14*Math.sin(t*15),pts=Array.from({length:16},(_,i)=>{const a=rad(i*22.5),r=(i%2?11:24)*k;return `${(622+r*Math.cos(a)).toFixed(1)} ${(374+r*Math.sin(a)).toFixed(1)}`;}).join('L');h+=`<path d="M${pts}Z" fill="#ffd95a" stroke="#f0692a" stroke-width="2" stroke-linejoin="round" opacity=".92"/>`+T(622,350,'啵！',{size:20,anchor:'middle',weight:700,fill:P.red});}}
      else{h+=`<path d="M530 352V440a17 17 0 0 0 34 0V352" fill="#fcfefe" stroke="#83999d" stroke-width="3" stroke-linejoin="round"/><path d="M537 358V436" stroke="#fff" stroke-width="4"/>`+T(547,474,'氧氣',{size:14,anchor:'middle',fill:c,weight:700});
        h+=`<path d="M612 322L550 398" stroke="#b98a4b" stroke-width="3.5" stroke-linecap="round"/>`;
        if(ok)h+=`<circle cx="550" cy="394" r="20" fill="#ffd95a" opacity=".5" filter="url(#cpd-soft)"/>`+this.flame(550,398,1.15,t);else h+=`<circle cx="550" cy="398" r="4" fill="#e2572a"/>`;}
      const X=660;
      if(!ok)h+=T(X,372,'收集到的氣體還太少，',{size:16})+T(X,398,'先通電一段時間。',{size:16});
      else if(isH)h+=T(X,362,'點燃的火柴靠近管口',{size:16})+T(X,392,'→ 有爆鳴聲',{size:19,weight:700,fill:P.red})+T(X,428,'氫氣可以燃燒',{size:16,weight:700,fill:c})+T(X,452,'（可燃性）',{size:15,fill:P.muted});
      else h+=T(X,362,'有餘燼的線香伸入管中',{size:16})+T(X,392,'→ 復燃',{size:19,weight:700,fill:P.red})+T(X,428,'氧氣幫助燃燒',{size:16,weight:700,fill:c})+T(X,452,'（助燃性）',{size:15,fill:P.muted});}
    return {svg:h,reads:[['通電時間',tm.toFixed(1)+' 分鐘'],['負極：氫氣',vh.toFixed(1)+' mL'],['正極：氧氣',vo.toFixed(1)+' mL'],['體積比 氫：氧',tm>0?'2：1':'—']],
      note:(tm>0?`通電 ${tm.toFixed(1)} 分鐘：負極收集到氫氣 ${vh.toFixed(1)} mL，正極收集到氧氣 ${vo.toFixed(1)} mL，體積比 <b>氫：氧 ＝ 2：1</b>。`:'還沒通電：兩支試管都裝滿水。')
        +'<br>水是<b>化合物</b>，可以用通電這種化學方法分解成氫氣和氧氣；氫和氧是<b>元素</b>，不能再用一般的化學方法分解。（每分鐘的氣體量與粒子圖為示意）'};},

  /* ---- 3 原子與分子 ---- */
  mini(k,cx,cy){if(COMPOUND_MOL[k])return compoundMol(k,cx,cy,Math.min(.82,44/COMPOUND_MOL[k].d),0);
    if(k==='Cu'||k==='Fe')return compoundMetal(cx,cy,4,2,8.5,0,k);if(k==='NaCl')return compoundSalt(cx,cy,4,2,15,0);if(k==='DIA')return compoundDia(cx+5,cy,3,3,20,13,5.5,0);
    return [-8,8].map(d=>`<path d="M${cx-22} ${cy+d}l10-6h14l10 6l-10 6h-14Z" fill="none" stroke="#8b979c" stroke-width="2"/>`+[[-22,0],[-12,-6],[2,-6],[12,0],[2,6],[-12,6]].map(([x,y])=>compoundAtom('C',cx+x+5,cy+d+y,.3)).join('')).join('');},
  kinds(s,t){const k=s.kd,K=compoundKind(k),mol=COMPOUND_MOL[k],cls=mol?(mol.els.length>1?'C':'E'):K.cls,[cn,cc]=COMPOUND_CLS[cls],ci=COMPOUND_KINDS.findIndex(([,ks])=>ks.includes(k)),o={lab:s.lab};let h='';
    COMPOUND_KINDS.forEach(([title,ks],r)=>{h+=T(26,40+r*110,title,{size:15,weight:700,fill:r===ci?P.accent:P.muted});
      ks.forEach((key,i)=>{const x=24+i*80,y=50+r*110,on=key===k;h+=`<g data-tap="kd:${key}" tabindex="0" role="button" aria-label="${compoundKind(key).n}" style="cursor:pointer"><rect x="${x}" y="${y}" width="74" height="72" rx="12" fill="${on?'#e3f3f0':'#fffdf8'}" stroke="${on?P.accent:'#ddd7c9'}" stroke-width="${on?3:1.5}"/>${this.mini(key,x+37,y+27)}${compoundT(x+37,y+65,COMPOUND_KLABEL[key]||compoundKind(key).fs,{size:15,anchor:'middle',weight:700,fill:on?P.accent:P.ink})}</g>`;});});
    h+=compoundPanel(440,20,440,460,{rx:16})+T(462,62,K.n,{size:26,weight:700})+compoundT(858,66,K.fs,{size:40,anchor:'end',weight:700,fill:P.accent});
    const cx=660,cy=202;let l2,l3,chip,els=mol?mol.els:K.els;
    if(mol){const sc=Math.min(4,205/mol.d);h+=`<ellipse cx="${cx}" cy="${cy+mol.d*sc*.38+26}" rx="${mol.d*sc*.4}" ry="9" fill="#1b2a33" opacity=".07"/>`+compoundMol(k,cx,cy,sc,mol.tot>1?4*Math.sin(t*.9):0,o);
      if(mol.tot===1){chip='單原子';l2='一個原子就是一個粒子，不結合成分子';l3='鈍氣（He、Ne、Ar…）都以單獨的原子存在';}
      else{chip='分子';l2=mol.els.length===1?`一個分子有 ${mol.tot} 個${COMPOUND_EL[mol.els[0]].n}原子`:`一個分子有 ${mol.tot} 個原子（${mol.els.map(e=>COMPOUND_EL[e].n+' '+mol.cnt[e]).join('、')}）`;
        l3=cls==='E'?'是分子，但只有一種原子 → 元素，不是化合物':'分子裡有兩種以上的原子 → 化合物';}}
    else{chip='不是分子';
      if(k==='Cu'||k==='Fe'){h+=compoundMetal(cx,cy,5,4,27,t,k,o);l2=`${K.n}原子緊密堆在一起，沒有一個個分子`;l3=`金屬的化學式只寫元素符號：${K.fs}`;}
      else if(k==='NaCl'){h+=compoundSalt(cx,cy,6,4,47,t,o);l2='鈉、氯的粒子整齊交錯排列';l3='化學式 NaCl 只表示 鈉：氯 ＝ 1：1';}
      else if(k==='DIA'){h+=compoundDia(cx,cy,5,6,62,36,13,t,o);l2='碳原子互相連結成一大片，化學式寫 C';l3='鑽石和石墨都只由碳原子組成，排列方式不同';}
      else{h+=compoundGra(cx,cy,30,10,o);l2='碳原子連成一層一層，化學式寫 C';l3='鑽石和石墨都只由碳原子組成，排列方式不同';}}
    const elT=els.map(e=>COMPOUND_EL[e].n).join('、');
    h+=compoundLegend(462,332,els)+compoundChip(462,372,84,cn,cc)+T(558,372,cls==='E'?`只由${elT}一種原子組成`:`由${elT} ${els.length} 種元素結合而成`,{size:16});
    h+=compoundChip(462,412,chip.length>2?96:84,chip,chip==='分子'?P.blue:'#6b777e')+T(chip.length>2?570:558,412,l2,{size:16});
    h+=`<path d="M462 432H858" stroke="${P.faint}"/>`+compoundT(462,460,l3,{size:17,weight:700,fill:P.accent});
    return {svg:h,reads:[['化學式',K.fs],['分類',cn],['粒子的形式',mol?(mol.tot===1?'單原子':mol.tot+' 個原子結合成的分子'):'不是一個個分子'],['原子種類',`${els.length} 種（${elT}）`]],
      note:`<b>${K.n} ${K.fs}</b>：${cls==='E'?`只由${elT}一種原子組成，是<b>元素</b>`:`由${elT} ${els.length} 種元素結合而成，是<b>化合物</b>`}；${l2}。<br>分元素或化合物看<b>原子的種類</b>，和是不是分子無關：O₂、N₂ 是分子，也是元素。`};},

  /* ---- 4 讀化學式 ---- */
  formula(s,t){const M=COMPOUND_MOL[s.fs],k=s.k,hl=s.hl==='none'?'':s.hl,size=M.f.length>2?66:78,ss=Math.round(size*.56),base=138;
    /* 逐字排版，才知道每個符號的位置 */
    const cells=[];cells.push({t:k>1?String(k):'1',w:size*.66,coef:true});M.f.forEach(([e,n],i)=>{cells.push({t:e,w:size*.76,el:e,part:i});if(n>1)cells.push({t:String(n),w:ss*.6*String(n).length+4,sub:true,el:e,part:i});});
    const tw=cells.reduce((a,c)=>a+c.w,0);let x=300-tw/2,h='';const pos=[];
    for(const c of cells){const cx=x+c.w/2,lit=hl&&c.el===hl;
      if(c.coef){if(k>1)h+=T(cx,base,c.t,{size,anchor:'middle',weight:700,fill:P.orange});else h+=`<rect x="${(cx-size*.26).toFixed(1)}" y="${base-size*.78}" width="${(size*.52).toFixed(1)}" height="${size*.86}" rx="8" fill="none" stroke="${P.faint}" stroke-width="2" stroke-dasharray="5 5"/>`+T(cx,base,'1',{size,anchor:'middle',weight:700,fill:'#e2ddd0'});c.cx=cx;pos.coef=cx;}
      else if(c.sub){h+=T(cx,base+size*.2,c.t,{size:ss,anchor:'middle',weight:700,fill:lit?COMPOUND_EL[c.el].ink:hl?'#9aa39f':P.blue});pos[c.part].x2=x+c.w;}
      else{h+=T(cx,base,c.t,{size,anchor:'middle',weight:700,fill:lit?COMPOUND_EL[c.el].ink:hl?'#9aa39f':P.ink});pos[c.part]={x1:x,x2:x+c.w,cx,el:c.el,n:M.f[c.part][1]};}
      x+=c.w;}
    h+=`<path d="M${pos.coef.toFixed(1)} ${base-size*.84}V58" stroke="${P.orange}" stroke-width="2"/>`+T(clamp(pos.coef,150,300),46,k>1?`係數 ${k}：有 ${k} 個分子`:'前面沒有寫數字：1 個分子',{size:17,anchor:'middle',weight:700,fill:P.orange});
    pos.forEach((p,i)=>{const mx=(p.x1+p.x2)/2,y1=Math.round(base+size*.3),y2=y1+28+(i%2)*24,c=COMPOUND_EL[p.el].ink;h+=`<path d="M${(p.x1+5).toFixed(1)} ${y1}H${(p.x2-5).toFixed(1)}M${mx.toFixed(1)} ${y1}V${y2-15}" fill="none" stroke="${c}" stroke-width="2" opacity="${hl&&p.el!==hl?.3:1}"/>`+T(mx,y2,`${COMPOUND_EL[p.el].n} ${p.n} 個`,{size:16,anchor:'middle',weight:700,fill:c})+(hl&&p.el!==hl?`<rect x="${mx-40}" y="${y2-17}" width="80" height="22" fill="#fbf8f1" opacity=".6"/>`:'');});
    h+=T(300,246,'下標：一個分子裡這種原子的個數（1 省略不寫）',{size:15,anchor:'middle',fill:P.blue,weight:700});
    /* 計數表 */
    h+=compoundPanel(588,20,292,232)+T(606,48,`${k} 個${M.n.replace(/（.*/,'')}分子裡有`,{size:16,weight:700,fill:P.muted});
    const rh=M.els.length>3?30:34;M.els.forEach((e,i)=>{const y=80+i*rh,E=COMPOUND_EL[e];if(hl===e)h+=`<rect x="596" y="${y-22}" width="276" height="${rh-2}" rx="8" fill="#fdf0cf"/>`;
      h+=`<circle cx="614" cy="${y-6}" r="9" fill="url(#cpd-${e})" stroke="${E.d}"/>`+T(632,y,`${E.n} ${e}`,{size:17,weight:700,fill:E.ink})+T(790,y,`${M.cnt[e]} × ${k} ＝`,{size:16,anchor:'end',fill:P.muted})+T(862,y,`${M.cnt[e]*k} 個`,{size:19,anchor:'end',weight:700});});
    const yb=80+M.els.length*rh;h+=`<path d="M604 ${yb-14}H864" stroke="${P.faint}" stroke-width="1.5"/>`+T(606,yb+12,'原子總數',{size:16,fill:P.muted})+T(862,yb+12,`${M.tot*k} 個`,{size:20,anchor:'end',weight:700,fill:P.accent})+T(606,yb+40,'元素種類',{size:16,fill:P.muted})+T(862,yb+40,`${M.els.length} 種`,{size:20,anchor:'end',weight:700,fill:P.accent});
    /* 分子模型 */
    h+=compoundPanel(20,264,860,216,{fill:'#fff'});const sc=Math.min(2.3,170/M.d,Math.max(128,840/k-26)/M.d),slot=Math.min(840/k,M.d*sc+26),x0=450-(k-1)*slot/2;
    for(let i=0;i<k;i++)h+=compoundMol(s.fs,x0+i*slot,366+3*Math.sin(t*1.2+i*1.3),sc,s.fs==='C6H12O6'||s.fs==='C2H5OH'||s.fs==='H2SO4'?0:3*Math.sin(t*.9+i*2),{lab:s.lab,hl});
    h+=T(38,290,`${k} 個${M.n.replace(/（.*/,'')}分子`,{size:16,weight:700,fill:P.orange})+compoundLegend(862-M.els.length*74,468,M.els);
    const per=M.els.map(e=>`${COMPOUND_EL[e].n} ${M.cnt[e]*k}`).join('、'),nm=M.n.replace(/（.*/,''),fx=(k>1?k:'')+M.fs;
    return {svg:h,reads:[['分子數',`${k} 個`],['各種原子',per+'（個）'],['原子總數',`${M.tot} × ${k} ＝ ${M.tot*k} 個`],['元素種類',`${M.els.length} 種`]],
      note:`<b>${fx}</b>：${k} 個${nm}分子，一個分子有 ${M.els.map(e=>`${M.cnt[e]} 個${COMPOUND_EL[e].n}原子`).join('、')}（共 ${M.tot} 個）。${k} 個分子共有 <b>${M.tot*k} 個原子</b>、${M.els.length} 種元素。`
        +(hl?(M.cnt[hl]?`<br>${COMPOUND_EL[hl].n}原子：每個分子 ${M.cnt[hl]} 個 × ${k} 個分子 ＝ <b>${M.cnt[hl]*k} 個</b>。`:`<br>這個化學式裡沒有${COMPOUND_EL[hl].n}原子。`):'<br><b>係數</b>（前面的數字）是分子的個數；<b>下標</b>（右下角的小數字）是一個分子裡該原子的個數。')
        +(s.fs==='C6H12O6'||s.fs==='C2H5OH'||s.fs==='H2SO4'?'（模型的形狀為示意）':'')};},

  /* ---- 5 粒子圖判讀 ---- */
  build(s,t){const qi=compoundBuildI(s),Q=COMPOUND_BUILD[qi],done=!!s.bp,right=s.bp===Q.ans;
    let h=T(30,46,`第 ${s.bi+1} 題`,{size:22,weight:700})+T(144,46,'這個粒子圖代表哪一類物質？',{size:17,fill:P.muted});
    h+=`<rect x="30" y="62" width="480" height="386" rx="18" fill="#fff" stroke="#b9c7c4" stroke-width="2.5"/>`+(Q.lat?compoundMetal(270,255,9,8,24,t,Q.lat):compoundGas(Q.parts,42,74,456,362,1.12,t,s.bi*13+5));
    h+=T(30,474,'不同顏色代表不同種類的原子；連在一起表示已經結合。',{size:14,fill:P.muted});
    h+=T(872,46,`答對 ${s.bs} ／ ${s.bn} 題`,{size:18,anchor:'end',weight:700,fill:P.accent});
    ['E','C','M'].forEach((k,i)=>{const y=66+i*66,[nm,c]=COMPOUND_CLS[k],isAns=done&&k===Q.ans,isPick=s.bp===k,bad=isPick&&!right,fill=isAns?'#e2f4ea':bad?'#fbe7e1':'#fffdf8',st=isAns?'#2e9460':bad?P.red:done?P.faint:c;
      h+=`<g data-tap="ans:${k}" tabindex="0" role="button" aria-label="${nm}" style="cursor:${done?'default':'pointer'}"><rect x="536" y="${y}" width="340" height="54" rx="14" fill="${fill}" stroke="${st}" stroke-width="${isAns||bad?3.5:2.5}"/>`
        +T(566,y+35,nm,{size:23,weight:700,fill:done&&!isAns&&!bad?'#9aa39f':isAns?'#1f7a4c':bad?P.red:c})+T(654,y+34,['純物質，只有一種原子','純物質，兩種以上的原子結合','兩種以上的物質混在一起'][i],{size:14,fill:done&&!isAns&&!bad?'#b3b9b5':P.muted})+(isAns?T(864,y+36,'✓',{size:24,anchor:'end',weight:700,fill:'#1f7a4c'}):bad?T(864,y+36,'✗',{size:24,anchor:'end',weight:700,fill:P.red}):'')+'</g>';});
    h+=compoundPanel(536,270,340,132);
    if(!done)h+=T(556,302,'判斷的順序',{size:16,weight:700,fill:P.muted})+T(556,332,'① 有幾種粒子？兩種以上 → 混合物',{size:16})+T(556,360,'② 只有一種粒子：裡面有幾種原子？',{size:16})+T(556,386,'　一種 → 元素，兩種以上 → 化合物',{size:16});
    else h+=T(556,302,right?'答對了':'再看一次粒子圖',{size:18,weight:700,fill:right?'#1f7a4c':P.red})+T(556,332,Q.r,{size:16})+T(556,362,'→ '+COMPOUND_CLS[Q.ans][0],{size:20,weight:700,fill:COMPOUND_CLS[Q.ans][1]})+compoundT(556,390,'這是'+Q.nm,{size:15,fill:P.muted});
    if(done)h+=`<g data-tap="next" tabindex="0" role="button" aria-label="下一題" style="cursor:pointer"><rect x="696" y="416" width="180" height="48" rx="24" fill="${P.accent}"/>`+T(786,447,'下一題 →',{size:19,anchor:'middle',weight:700,fill:'#fff'})+'</g>';
    else h+=T(876,446,'點上面的答案',{size:15,anchor:'end',fill:P.muted});
    return {svg:h,reads:[['題號',`第 ${s.bi+1} 題`],['你的答案',done?COMPOUND_CLS[s.bp][0]+(right?'　✓':'　✗'):'還沒作答'],['正確答案',done?COMPOUND_CLS[Q.ans][0]:'？'],['答對',`${s.bs} ／ ${s.bn} 題`]],
      note:done?`${Q.r} → <b>${COMPOUND_CLS[Q.ans][0]}</b>（${Q.nm}）。`:'先看<b>粒子的種類</b>：兩種以上的粒子混在一起是混合物。只有一種粒子時再看<b>原子的種類</b>：一種是元素，兩種以上結合是化合物。'};}
};
/* 這個單元每一格都重畫圖面，滑鼠按下到放開之間元素會被換掉；圖上的按鈕改在按下時就處理（tap 重複呼叫不會重複計分） */

/* ===== 6-3 物質結構與原子 ===== */
/* ===== 6-3 物質結構與原子（深色舞台） ===== */
const ATOM_C={ink:'#eaf3ff',muted:'#a9b8cf',dim:'#7387a3',panel:'#14243a',panel2:'#1b3050',line:'#2f4868',p:'#ff7466',n:'#b4bfcd',e:'#5fcbff',a:'#ffcc6a',ok:'#86e3a4',warn:'#ffb35c',bg:'#0b1626'};
const ATOM_DEFS=`<defs>`
  +[['p','#ffd0c8','#ff7466','#b8392c'],['n','#f4f7fb','#b4bfcd','#66758a'],['e','#e6f8ff','#5fcbff','#1f7fc0'],['a','#fff6d8','#ffcc6a','#c8872a'],
    ['H','#ffffff','#dfe7f0','#8d9bb0'],['O','#ffc4bc','#f0604f','#9c2a20'],['C','#b9c3d0','#6f7c8d','#333e4d'],['D','#f6e3bd','#d9b36c','#8a6630'],['Fe','#e3eaf2','#9aa9bb','#4c5a6c'],['S','#f6e7c4','#d8bb82','#8d6f3c']]
    .map(([k,a,b,c])=>`<radialGradient id="atom-g${k}" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join('')
  +`<radialGradient id="atom-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".35" stop-color="#ff8a5c" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a5c" stop-opacity="0"/></radialGradient>`
  +`<radialGradient id="atom-pud"><stop offset="0" stop-color="#ff7466" stop-opacity=".34"/><stop offset="1" stop-color="#ff7466" stop-opacity=".2"/></radialGradient>`
  +`<linearGradient id="atom-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe6ee"/><stop offset=".5" stop-color="#93a1b3"/><stop offset="1" stop-color="#5a6779"/></linearGradient>`
  +`<linearGradient id="atom-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98a1e"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#b98a1e"/></linearGradient>`
  +`<clipPath id="atom-clipA"><circle cx="690" cy="232" r="130"/></clipPath><clipPath id="atom-clipS"><rect x="20" y="30" width="520" height="440" rx="12"/></clipPath><clipPath id="atom-clipZ"><rect x="20" y="20" width="460" height="460" rx="12"/></clipPath><clipPath id="atom-clipN"><circle cx="668" cy="272" r="76"/></clipPath></defs>`;
const atomT=(x,y,t,o={})=>T(x,y,t,{fill:ATOM_C.ink,...o});
const atomBox=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx??14}" fill="${o.fill||ATOM_C.panel}" stroke="${o.stroke||ATOM_C.line}" stroke-width="${o.sw||1.5}"/>`;
const atomBall=(x,y,r,k)=>`<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${(+r).toFixed(1)}" fill="url(#atom-g${k})"/>`;
const atomSign=(x,y,r,plus)=>`<path d="M${(x-r).toFixed(1)} ${y.toFixed(1)}H${(x+r).toFixed(1)}${plus?`M${x.toFixed(1)} ${(y-r).toFixed(1)}V${(y+r).toFixed(1)}`:''}" stroke="#fff" stroke-width="${Math.max(1.4,r*.42).toFixed(1)}" stroke-linecap="round" opacity=".92"/>`;
const atomElec=(x,y,r=5.5)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*1.9).toFixed(1)}" fill="${ATOM_C.e}" opacity=".2"/>`+atomBall(x,y,r,'e')+atomSign(x,y,r*.5,false);
const atomProton=(x,y,r)=>atomBall(x,y,r,'p')+atomSign(x,y,r*.5,true);
const atomEase=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const atomMix=(a,b,f)=>a+(b-a)*f;
/* 原子核：質子、中子依葵花籽排列緊密堆在一起（固定排列，不用亂數） */
function atomNucleus(cx,cy,p,n,r0){const A=p+n;if(A<1)return '';const r=r0||(A<=4?11:A<=12?9.5:A<=28?8:6.8),out=[];
  for(let k=0;k<A;k++){const isP=Math.floor((k+1)*p/A)>Math.floor(k*p/A),rr=A===1?0:r*.9*Math.sqrt(k+.35),an=k*2.39996+.6;out.push([cx+rr*Math.cos(an),cy+rr*Math.sin(an),isP]);}
  return out.reverse().map(([x,y,isP])=>isP?atomProton(x,y,r):atomBall(x,y,r,'n')).join('');}
/* 元素（原子序 1～20）：符號、名稱、最常見的中子數、自然界存在的中子數 */
const ATOM_EL=[['H','氫',0,[0,1,2]],['He','氦',2,[1,2]],['Li','鋰',4,[3,4]],['Be','鈹',5,[5]],['B','硼',6,[5,6]],['C','碳',6,[6,7,8]],['N','氮',7,[7,8]],['O','氧',8,[8,9,10]],['F','氟',10,[10]],['Ne','氖',10,[10,11,12]],
  ['Na','鈉',12,[12]],['Mg','鎂',12,[12,13,14]],['Al','鋁',14,[14]],['Si','矽',14,[14,15,16]],['P','磷',16,[16]],['S','硫',16,[16,17,18,20]],['Cl','氯',18,[18,20]],['Ar','氬',22,[18,20,22]],['K','鉀',20,[20,21,22]],['Ca','鈣',20,[20,22,23,24,26,28]]];
const atomNow=s=>{const p=clamp(Math.round(s.p),1,20),E=ATOM_EL[p-1];return {p,n:s.nfree?s.nn:E[2],e:s.efree?s.e:p,sym:E[0],name:E[1],nat:E[3]};};
const atomSet=(s,p,n,e)=>{s.mode='build';s.p=p;s.nfree=true;s.nn=n;s.efree=e!==p;s.e=e;};

/* 拉塞福散射：α 粒子受原子核的斥力（與距離平方成反比），逐步計算軌跡。長度單位是放大圖的像素。
   d＝正面對撞時最接近原子核的距離；布丁模型把同樣多的正電均勻分布在半徑 Ra 的球內。 */
const ATOM_SC={d:2.5,V:520,B:200,Ra:200,rate:12,T:1.1};
const ATOM_SHOTS=[[],[]];
const atomB=i=>{const u=(.342+i*.6180339887)%1;return ATOM_SC.B*(2*u-1);};
function atomShot(i,pud){const c=ATOM_SHOTS[pud?1:0];if(c[i])return c[i];
  const {d,V,Ra}=ATOM_SC,K=d*V*V/2,b=atomB(i);let x=-270,y=b,vx=V,vy=0,t=0,lx=1,ly=0;const pts=[[x,y,0]];
  const acc=(x,y)=>{const r2=x*x+y*y,r=Math.sqrt(r2)||1e-6,f=pud&&r<Ra?K/(Ra*Ra*Ra):K/(r2*r);return [f*x,f*y];};
  let [ax,ay]=acc(x,y);
  for(let k=0;k<40000;k++){const r=Math.hypot(x,y),dt=clamp(.02*r/V,2e-5,.004);
    vx+=ax*dt/2;vy+=ay*dt/2;x+=vx*dt;y+=vy*dt;[ax,ay]=acc(x,y);vx+=ax*dt/2;vy+=ay*dt/2;t+=dt;
    const sp=Math.hypot(vx,vy),ux=vx/sp,uy=vy/sp;if(ux*lx+uy*ly<.9997){pts.push([x,y,t]);lx=ux;ly=uy;}
    if(Math.abs(x)>275||Math.abs(y)>265||t>4)break;}
  pts.push([x,y,t]);const th=deg(Math.atan2(vy,vx)),a=Math.abs(th);
  return c[i]={b,th,cat:a<5?0:a<90?1:2,pts,tEnd:t};}
const atomShotPos=(sh,tau)=>{const P=sh.pts;if(tau>=sh.tEnd)return P[P.length-1];let k=1;while(k<P.length-1&&P[k][2]<tau)k++;const a=P[k-1],b=P[k],f=clamp((tau-a[2])/Math.max(1e-9,b[2]-a[2]),0,1);return [atomMix(a[0],b[0],f),atomMix(a[1],b[1],f),tau];};
const atomEnd=s=>(s.sn-1)/ATOM_SC.rate+ATOM_SC.T+.5;
const atomTally=s=>{const c=[0,0,0];let fired=0,done=0;for(let i=0;i<s.sn;i++){const t0=i/ATOM_SC.rate;if(s.st>=t0)fired++;if(s.st>=t0+ATOM_SC.T){done++;c[atomShot(i,s.pud).cat]++;}}return {c,fired,done};};
const atomLen=m=>{const f=v=>+v.toPrecision(2);return m>=1?f(m)+' m':m>=.01?f(m*100)+' cm':f(m*1000)+' mm';};
const atomW=z=>140*Math.pow(5e-5,z);

const ATOM_DAL=[
  {t:'原子不可分割',l:['物質由原子組成，','原子是不可分割的最小粒子'],cap:['把物質一直放大來看，最後是一顆一顆的原子。','道耳頓認為原子是實心的小球，不能再分割。'],fix:['修正：原子還可以再分成<tspan fill="#5fcbff" font-weight="700">電子</tspan>、<tspan fill="#ff7466" font-weight="700">質子</tspan>、<tspan font-weight="700">中子</tspan>。','不過在化學反應中，原子仍然不會被分割。']},
  {t:'同種原子都相同',l:['同種元素的原子，質量和性質','都相同；不同元素的原子不同'],cap:['每個氧原子都一樣；每個氫原子也都一樣。','氧原子和氫原子的質量、性質不同。'],fix:['修正（延伸）：同一種元素的原子，質量可能不同，','稱為同位素。它們的質子數仍然相同。']},
  {t:'簡單整數比',l:['不同元素的原子，以簡單','整數比結合成化合物'],cap:['原子是一顆一顆的，不會只用半顆，','所以化合物中各種原子的個數是簡單整數比。'],fix:['至今仍成立：水一定是 2 個氫原子配 1 個氧原子，','二氧化碳一定是 1 個碳原子配 2 個氧原子。']},
  {t:'反應是重新排列',l:['化學反應只是原子重新排列，','原子不會消失、新生或變種類'],cap:['原子只是換了排列方式，','種類和個數在反應前後都沒有改變。'],fix:['至今仍成立：化學反應前後，原子的種類和個數不變。','（所以反應前後的總質量也不變）']}];
const ATOM_HIS=[
  {who:'道耳頓',yr:1803,what:'提出原子說',model:'實心球模型',l:['提出原子說：物質由原子組成，','原子是不可分割的實心小球。']},
  {who:'湯姆森',yr:1897,what:'發現電子',model:'湯姆森的想法：正電均勻分布，電子嵌在裡面',l:['研究陰極射線，發現原子裡有帶負電的粒子：電子。','原子不帶電，所以原子裡一定還有帶正電的部分。']},
  {who:'拉塞福',yr:1911,what:'發現原子核',model:'有原子核的模型：電子在原子核外運動',l:['用 α 粒子撞擊金箔，發現原子的正電和大部分質量','集中在中心很小的原子核，電子在原子核外。']},
  {who:'拉塞福',yr:1919,what:'發現質子',model:'原子核裡有帶正電的質子',l:['發現原子核裡有帶正電的粒子：質子。','質子帶的電量和電子一樣多，電性相反。']},
  {who:'查兌克',yr:1932,what:'發現中子',model:'原子核 ＝ 質子 ＋ 中子，電子在核外',l:['發現原子核裡還有不帶電的粒子：中子。','中子的質量和質子差不多。']}];

const ATOM_Q={
  dalton:['後來發現原子裡還有電子、質子、中子，道耳頓的原子說就全錯了嗎？','<b>不是</b>。被修正的是「原子不可分割」和「同種原子質量都相同」這兩點。在<b>化學反應</b>中，原子不會被分割，只是<b>重新排列</b>，種類和個數都不變，這些到現在仍然成立。科學理論常常是保留正確的部分、修正不合的部分。'],
  history:['湯姆森發現原子裡有帶負電的電子，可是原子整體不帶電。由此可以推想什麼？','原子裡一定還有<b>帶正電</b>的部分，而且正電和負電<b>一樣多</b>，才會互相抵消成電中性。後來拉塞福用 α 粒子散射實驗，發現正電集中在很小的<b>原子核</b>。'],
  scatter:['如果原子的正電像布丁一樣均勻分布，α 粒子射向金箔會怎樣？和實驗結果哪裡不合？','正電分散開來，對 α 粒子的斥力很弱，α 粒子應該<b>全部幾乎直線穿過</b>。但實驗中有極少數 α 粒子<b>大角度偏折甚至反彈</b>，表示正電和質量集中在很小的<b>原子核</b>。（打開「如果原子像均勻的布丁？」比較）'],
  build:['鈉原子有 11 個質子。多放 1 個中子，或拿走 1 個電子，它還是鈉嗎？','<b>都還是鈉</b>，因為元素的種類只由<b>質子數（原子序）</b>決定。多 1 個中子：質量數由 23 變成 24，電性不變。拿走 1 個電子：質子比電子多 1 個，變成<b>帶正電</b>的離子。只有質子數改變，才會變成別種元素。'],
  scale:['原子核只占原子很小的空間，為什麼說原子的質量幾乎都在原子核？','質子和中子都在原子核裡，1 個質子（或中子）的質量大約是電子的 <b>1836 倍</b>。電子雖然占了原子大部分的空間，質量卻小到可以忽略，所以<b>質量數只算質子數＋中子數</b>。']};
const ATOM_QUIZ=[
  {q:'道耳頓原子說的內容中，哪一項後來被修正？',opts:['化合物由不同元素的原子以簡單整數比結合','化學反應是原子重新排列','原子是不可分割的最小粒子','化學反應前後原子的種類不變'],ans:2,
    sol:'後來發現原子裡還有<b>電子、質子、中子</b>，所以原子可以再分割。其他三項在化學反應中仍然成立。',go:s=>{s.mode='dalton';s.dsel=1;s.dfix=true;s.da=0;},goLabel:'看後來的修正'},
  {q:'2 個氫分子和 1 個氧分子反應，生成 2 個水分子。反應前後何者<b>改變</b>？',opts:['原子的排列方式','原子的種類','氫原子的個數','氧原子的個數'],ans:0,
    sol:'化學反應只是原子<b>重新排列</b>：反應前後都是 4 個氫原子、2 個氧原子，種類和個數不變，改變的是原子的組合方式（分子的種類）。',go:s=>{s.mode='dalton';s.dsel=4;s.dfix=false;s.da=0;},goLabel:'看原子重新排列'},
  {q:'發現「電子」、「原子核」、「中子」的科學家依序是：',opts:['道耳頓、湯姆森、拉塞福','拉塞福、湯姆森、查兌克','湯姆森、查兌克、拉塞福','湯姆森、拉塞福、查兌克'],ans:3,
    sol:'<b>湯姆森</b>由陰極射線發現電子；<b>拉塞福</b>由 α 粒子散射實驗發現原子核（後來又發現質子）；<b>查兌克</b>發現中子。',go:s=>{s.mode='history';s.hsel=1;},goLabel:'看原子模型的演進'},
  {q:'拉塞福的 α 粒子散射實驗中，「絕大多數 α 粒子直接穿過金箔」可以推論：',opts:['原子核帶正電','原子內部大部分是空的','原子核的質量很大','電子帶負電'],ans:1,
    sol:'絕大多數 α 粒子沒有碰到東西就穿過去，表示原子內部<b>大部分是空的</b>，原子核只占很小的空間。',go:s=>{s.mode='scatter';s.sview='foil';s.pud=false;s.sn=100;s.st=999;s.run=false;},goLabel:'看 100 個 α 粒子的結果'},
  {q:'α 粒子散射實驗中，有極少數 α 粒子被大角度偏折，甚至反彈。主要原因是 α 粒子：',opts:['被帶負電的電子吸引','撞到金箔表面的雜質','接近帶正電、質量很大的原子核而被排斥','在金箔中速度變慢'],ans:2,
    sol:'α 粒子帶正電，接近同樣帶<b>正電</b>的原子核時受到很大的斥力；原子核<b>質量很大</b>，所以是 α 粒子被彈開。原子核很小，正好接近的機會很少。',go:s=>{s.mode='scatter';s.sview='atom';s.pud=false;s.sn=100;s.st=999;s.run=false;},goLabel:'放大看單一原子'},
  {q:'某原子的原子核內有 17 個質子、18 個中子，核外有 17 個電子。它的原子序和質量數依序是：',opts:['17、35','17、34','18、35','35、52'],ans:0,
    sol:'原子序 ＝ 質子數 ＝ <b>17</b>；質量數 ＝ 質子數 ＋ 中子數 ＝ 17 ＋ 18 ＝ <b>35</b>。電子不算進質量數。',go:s=>atomSet(s,17,18,17),goLabel:'組這個原子'},
  {q:'一個電中性的鈉原子，原子序 11、質量數 23。它的質子數、中子數、電子數依序是：',opts:['11、23、11','12、11、12','11、12、23','11、12、11'],ans:3,
    sol:'質子數 ＝ 原子序 ＝ 11；中子數 ＝ 質量數 − 質子數 ＝ 23 − 11 ＝ 12；電中性的原子，電子數 ＝ 質子數 ＝ 11。',go:s=>atomSet(s,11,12,11),goLabel:'組這個原子'},
  {q:'某粒子有 12 個質子、12 個中子、10 個電子。下列敘述何者正確？',opts:['它是電中性的鎂原子','它帶正電，仍然屬於鎂元素','它帶負電，仍然屬於鎂元素','它變成了氖元素'],ans:1,
    sol:'質子數 12 → 原子序 12，是<b>鎂</b>。質子（正電）比電子（負電）多 2 個，所以<b>帶正電</b>。元素種類只看質子數，和電子數無關。',go:s=>atomSet(s,12,12,10),goLabel:'組這個粒子'},
  {q:'甲原子有 6 個質子、6 個中子；乙原子有 6 個質子、8 個中子。下列何者正確？',opts:['甲、乙是不同的元素','甲、乙的質量數相同','甲、乙是同一種元素，質量數不同','乙帶負電'],ans:2,
    sol:'質子數都是 6 → 原子序都是 6，都是<b>碳</b>。質量數：甲 6 ＋ 6 ＝ 12，乙 6 ＋ 8 ＝ 14。中子不帶電，不影響電性。',go:s=>atomSet(s,6,8,6),goLabel:'組乙原子'},
  {q:'關於質子、中子、電子，下列敘述何者正確？',opts:['中子帶負電','質子和電子都在原子核內','原子的質量大部分來自電子','電子在原子核外，質量比質子小很多'],ans:3,
    sol:'質子（帶正電）和中子（不帶電）在<b>原子核內</b>；電子（帶負電）在<b>原子核外</b>，質量約為質子的 1/1836，所以原子的質量幾乎都在原子核。',go:s=>{s.mode='scale';s.sv='mass';s.me=1836;},goLabel:'用天平比較質量'}];

LABS.atom={group:5,n:'6-3',dark:true,keep:['mode'],steps:'mode',
  tasks:{dalton:'點左邊的四張卡片看動畫，再打開「後來的修正」：哪幾項後來被修正？哪幾項到現在仍然成立？',
    history:'照順序點時間軸上的五個階段：每一次新發現，原子的模型多了什麼？',
    scatter:'按「發射」：大部分 α 粒子怎麼走？有沒有被彈回來的？再切到「單一原子」，看它們是在哪裡轉彎的。',
    build:'拉動「質子數」：元素名稱跟著誰改變？再打開「自己調中子」「自己調電子」，看質量數和電性各由誰決定。',
    scale:'拉動「放大」，從整個操場一路放大到中心的原子核；再切到「質量」，看要幾個電子才和 1 個質子一樣重。'},
  name:'原子結構',subtitle:'原子由原子核和核外的電子組成；原子核很小，裡面有帶正電的質子和不帶電的中子。原子序 ＝ 質子數，質量數 ＝ 質子數 ＋ 中子數。',
  q:s=>({html:qBlockHTML(ATOM_Q[s.mode])+quizHTML(s,ATOM_QUIZ)}),
  qAction(s,v){quizAction(s,v,ATOM_QUIZ);},
  state:{mode:'dalton',t:0,dsel:1,dfix:false,da:0,hsel:0,sview:'foil',sn:100,st:0,run:false,pud:false,p:11,nfree:false,nn:12,efree:false,e:11,sv:'size',z:0,zplay:false,me:0,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'分頁',options:[['dalton','道耳頓原子說'],['history','原子模型的演進'],['scatter','拉塞福的散射實驗'],['build','組一個原子'],['scale','原子與原子核有多小']],onChange:s=>{s.da=0;s.zplay=false;}},
    {type:'seg',key:'dsel',label:'原子說的四項內容',options:[[1,'① 不可分割'],[2,'② 同種相同'],[3,'③ 整數比'],[4,'④ 重新排列']],onChange:s=>{s.da=0;},show:s=>s.mode==='dalton'},
    {type:'toggle',key:'dfix',label:'後來的修正',show:s=>s.mode==='dalton'},
    {type:'buttons',label:'動畫',items:[['↺ 重播',s=>{s.da=0;}]],show:s=>s.mode==='dalton'},
    {type:'seg',key:'hsel',label:'階段',options:[[0,'① 道耳頓'],[1,'② 湯姆森'],[2,'③ 拉塞福'],[3,'④ 質子'],[4,'⑤ 中子']],show:s=>s.mode==='history'},
    {type:'buttons',label:'α 粒子',primary:true,items:[['▶ 發射',s=>{if(s.st>=atomEnd(s)-.01)s.st=0;s.run=true;}],['⏸ 暫停',s=>{s.run=false;}],['↺ 重來',s=>{s.st=0;s.run=false;}],['直接看結果',s=>{s.st=999;s.run=false;}]],show:s=>s.mode==='scatter'},
    {type:'range',key:'sn',label:'α 粒子數',min:20,max:240,step:20,unit:' 個',show:s=>s.mode==='scatter'},
    {type:'seg',key:'sview',label:'觀察範圍',options:[['foil','整片金箔'],['atom','單一原子（放大）']],show:s=>s.mode==='scatter'},
    {type:'toggle',key:'pud',label:'如果原子像均勻的布丁？',show:s=>s.mode==='scatter'},
    {type:'range',key:'p',label:'質子數',min:1,max:20,step:1,unit:' 個',show:s=>s.mode==='build'},
    {type:'toggle',key:'nfree',label:'自己調中子',onChange:s=>{if(s.nfree)s.nn=ATOM_EL[s.p-1][2];},show:s=>s.mode==='build'},
    {type:'range',key:'nn',label:'中子數',min:0,max:28,step:1,unit:' 個',show:s=>s.mode==='build'&&s.nfree},
    {type:'toggle',key:'efree',label:'自己調電子',onChange:s=>{if(s.efree)s.e=s.p;},show:s=>s.mode==='build'},
    {type:'range',key:'e',label:'電子數',min:0,max:20,step:1,unit:' 個',show:s=>s.mode==='build'&&s.efree},
    {type:'buttons',label:'常見原子',items:[[1,'H'],[2,'He'],[6,'C'],[7,'N'],[8,'O'],[11,'Na'],[12,'Mg'],[13,'Al'],[17,'Cl'],[20,'Ca']].map(([z,sy])=>[sy,s=>{s.p=z;s.nfree=false;s.efree=false;s.nn=ATOM_EL[z-1][2];s.e=z;}]),show:s=>s.mode==='build'},
    {type:'seg',key:'sv',label:'比較',options:[['size','大小'],['mass','質量']],onChange:s=>{s.zplay=false;},show:s=>s.mode==='scale'},
    {type:'range',key:'z',label:'放大',min:0,max:1,step:.005,fmt:s=>'畫面寬約 '+atomLen(atomW(s.z)),show:s=>s.mode==='scale'&&s.sv==='size'},
    {type:'buttons',label:'鏡頭',items:[['▶ 自動放大',s=>{if(s.z>=.995)s.z=0;s.zplay=true;}],['⏸ 停',s=>{s.zplay=false;}],['回到操場',s=>{s.z=0;s.zplay=false;}],['看原子核',s=>{s.z=1;s.zplay=false;}]],show:s=>s.mode==='scale'&&s.sv==='size'},
    {type:'range',key:'me',label:'右盤的電子數',min:0,max:2520,step:36,unit:' 個',show:s=>s.mode==='scale'&&s.sv==='mass'},
    {type:'buttons',label:'快速設定',items:[['清空',s=>{s.me=0;}],['放 1836 個',s=>{s.me=1836;}]],show:s=>s.mode==='scale'&&s.sv==='mass'}],
  tick(s,dt){if(reduceMotion){s.da=99;if(s.run){s.st=999;s.run=false;}if(s.zplay){s.z=1;s.zplay=false;}return;}
    s.t=(s.t+dt)%3600;if(s.mode==='dalton')s.da=Math.min(99,s.da+dt);
    if(s.mode==='scatter'&&s.run){s.st+=dt;if(s.st>=atomEnd(s)){s.st=atomEnd(s);s.run=false;}}
    if(s.mode==='scale'&&s.zplay){s.z=Math.min(1,s.z+dt/9);if(s.z>=1)s.zplay=false;}},
  tapDo(s,id){if(id[0]==='d'){s.dsel=clamp(+id.slice(1)||1,1,4);s.da=0;}else if(id[0]==='h')s.hsel=clamp(+id.slice(1)||0,0,4);},
  tap(s,id){if(Date.now()-ATOM_TAP.t<700)return;this.tapDo(s,id);},
  render(s){const m=s.mode;return m==='history'?this.history(s):m==='scatter'?this.scatter(s):m==='build'?this.build(s):m==='scale'?(s.sv==='mass'?this.mass(s):this.size(s)):this.dalton(s);},

  /* ---------- 1 道耳頓原子說 ---------- */
  dalton(s){const C=ATOM_C,k=clamp(s.dsel,1,4),fix=s.dfix,a=reduceMotion?99:s.da,t=s.t,D=ATOM_DAL[k-1];let h=ATOM_DEFS;
    ATOM_DAL.forEach((d,i)=>{const y=20+i*116,on=k===i+1,ty=fix?y+34:y+46,chg=i<2;
      h+=`<g data-tap="d${i+1}" tabindex="0" role="button" style="cursor:pointer" aria-label="第 ${i+1} 項：${d.t}">`+atomBox(20,y,318,106,{fill:on?C.panel2:C.panel,stroke:on?C.a:C.line,sw:on?3:1.5})
        +`<circle cx="48" cy="${ty+6}" r="17" fill="${on?C.a:'#263b59'}"/>`+T(48,ty+13,i+1,{size:19,weight:700,anchor:'middle',fill:on?'#1b2a33':C.ink})
        +atomT(76,ty,d.l[0],{size:16,weight:on?700:400})+atomT(76,ty+25,d.l[1],{size:16,weight:on?700:400})
        +(fix?`<rect x="76" y="${y+70}" width="${chg?104:104}" height="26" rx="13" fill="${chg?C.warn:C.ok}" fill-opacity=".16" stroke="${chg?C.warn:C.ok}" stroke-width="1.5"/>`+T(128,y+88,chg?'後來修正':'仍然成立',{size:15,weight:700,anchor:'middle',fill:chg?C.warn:C.ok}):'')+`</g>`;});
    h+=atomBox(352,20,528,454)+atomT(376,58,`第 ${k} 項：${D.t}`,{size:21,weight:700});
    if(fix)h+=`<rect x="750" y="38" width="110" height="28" rx="14" fill="${k<3?C.warn:C.ok}" fill-opacity=".16" stroke="${k<3?C.warn:C.ok}" stroke-width="1.5"/>`+T(805,57,k<3?'後來修正':'仍然成立',{size:15,weight:700,anchor:'middle',fill:k<3?C.warn:C.ok});
    if(k===1){const g=atomEase(a/.9);
      h+=`<rect x="388" y="196" width="96" height="72" rx="8" fill="url(#atom-metal)"/><path d="M394 204H478" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`+atomT(436,296,'一塊鐵',{size:16,anchor:'middle',fill:C.muted});
      h+=`<g opacity="${g.toFixed(2)}">`+L(484,198,632,116,{stroke:C.dim,w:1.5,dash:'5 6'})+L(484,266,632,348,{stroke:C.dim,w:1.5,dash:'5 6'})+`<circle cx="690" cy="232" r="130" fill="${C.bg}"/><g clip-path="url(#atom-clipA)">`;
      for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const x=690+58*(i+(j&1)/2),y=232+50*j,ph=(i*7+j*13);if(i===0&&j===0&&fix)continue;
        h+=atomBall(x+1.6*Math.sin(t*5+ph),y+1.6*Math.cos(t*4.3+ph*1.7),28,'Fe');}
      if(fix){h+=`<circle cx="690" cy="232" r="28" fill="#0e1d31" stroke="${C.warn}" stroke-width="2.5"/><circle cx="690" cy="232" r="11" fill="url(#atom-glow)"/>`+atomBall(690,232,4,'p');
        for(let i=0;i<3;i++){const an=t*1.6+i*2.094;h+=atomElec(690+19*Math.cos(an),232+19*Math.sin(an),3.2);}}
      h+=`</g><circle cx="690" cy="232" r="130" fill="none" stroke="#5f7da3" stroke-width="3"/></g>`;
      h+=atomT(436,150,'一直放大',{size:15,anchor:'middle',fill:C.muted})+atomT(436,172,'→ 原子',{size:15,anchor:'middle',fill:C.muted});
      if(fix)h+=atomT(690,388,'中間這顆原子：裡面有原子核和電子',{size:15,anchor:'middle',fill:C.warn});
      else h+=atomT(690,388,'每一顆都是實心、不可分割的小球',{size:15,anchor:'middle',fill:C.muted});}
    else if(k===2){const row=(y,r,kd,name)=>{let o=atomT(380,y+6,name,{size:17,weight:700});for(let i=0;i<5;i++){const g=atomEase((a-i*.14)/.4),x=490+i*72,heavy=fix&&kd==='O'&&(i===1||i===3);
        o+=`<g opacity="${g.toFixed(2)}">`+atomBall(x,y+1.5*Math.sin(t*2+i),r*(heavy?1.06:1),kd)+(heavy?`<circle cx="${x}" cy="${(y+1.5*Math.sin(t*2+i)).toFixed(1)}" r="${r*1.06+3}" fill="none" stroke="${C.warn}" stroke-width="2" stroke-dasharray="4 4"/>`+T(x,y-r-12,'較重',{size:14,weight:700,anchor:'middle',fill:C.warn}):'')+`</g>`;}return o;};
      h+=row(165,26,'O','氧原子')+row(280,16,'H','氫原子');
      h+=`<path d="M464 206v8H804v-8" fill="none" stroke="${C.dim}" stroke-width="1.5"/><path d="M464 308v8H804v-8" fill="none" stroke="${C.dim}" stroke-width="1.5"/>`
        +atomT(634,236,fix?'性質相同，但質量可能不完全相同':'質量相同、性質相同',{size:15,anchor:'middle',fill:fix?C.warn:C.muted})+atomT(634,338,'質量相同、性質相同',{size:15,anchor:'middle',fill:C.muted})
        +atomT(634,382,'氧原子和氫原子是不同的原子：質量不同，性質也不同',{size:15,anchor:'middle',fill:C.muted});}
    else if(k===3){const e=atomEase((a-.5)/1.5);
      h+=atomBall(496,atomMix(268,226,e),26,'O')+atomBall(atomMix(430,468,e),atomMix(140,204,e),16,'H')+atomBall(atomMix(562,524,e),atomMix(140,204,e),16,'H');
      h+=atomBall(atomMix(640,694,e),226,26,'O')+atomBall(atomMix(840,786,e),226,26,'O')+atomBall(740,226,22,'C');
      h+=L(616,110,616,360,{stroke:C.line,w:1.5,dash:'4 6'});
      h+=atomT(496,318,'氫：氧 ＝ 2：1',{size:19,weight:700,anchor:'middle'})+atomT(496,346,'水 H₂O',{size:16,anchor:'middle',fill:C.muted})
        +atomT(740,318,'碳：氧 ＝ 1：2',{size:19,weight:700,anchor:'middle'})+atomT(740,346,'二氧化碳 CO₂',{size:16,anchor:'middle',fill:C.muted});
      h+=atomT(430,112,'氫原子',{size:14,fill:C.muted,anchor:'middle'})+atomT(562,112,'氫原子',{size:14,fill:C.muted,anchor:'middle'})+atomT(740,186,'碳原子',{size:14,fill:C.muted,anchor:'middle'})
        +`<g opacity="${(1-e).toFixed(2)}">`+atomT(496,308-4,'',{size:14})+`</g>`;}
    else{const e=atomEase((a-1)/2.2),ph=a<1?0:e<1?1:2;
      const AT=[['H',434,160,718,148],['H',468,160,774,148],['H',434,292,718,280],['H',468,292,774,280],['O',540,226,746,172],['O',592,226,746,304]];
      AT.forEach(([kd,x0,y0,x1,y1])=>{const r=kd==='O'?28:18;h+=`<circle cx="${x0}" cy="${y0}" r="${r}" fill="none" stroke="${C.dim}" stroke-width="1.3" stroke-dasharray="3 5" opacity="${(e*.8).toFixed(2)}"/><circle cx="${x1}" cy="${y1}" r="${r}" fill="none" stroke="${C.dim}" stroke-width="1.3" stroke-dasharray="3 5" opacity="${((1-e)*.8).toFixed(2)}"/>`;});
      h+=`<path d="M626 226H664M654 216l10 10l-10 10" fill="none" stroke="${C.dim}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      h+=`<g opacity="${(1-atomEase((a-1)/.6)).toFixed(2)}">`+atomT(452,122,'氫分子 H₂',{size:15,anchor:'middle',fill:C.muted})+atomT(452,256,'氫分子 H₂',{size:15,anchor:'middle',fill:C.muted})+atomT(565,182,'氧分子 O₂',{size:15,anchor:'middle',fill:C.muted})+`</g>`;
      h+=`<g opacity="${atomEase((a-2.9)/.5).toFixed(2)}">`+atomT(746,112,'水分子 H₂O',{size:15,anchor:'middle',fill:C.muted})+atomT(746,246,'水分子 H₂O',{size:15,anchor:'middle',fill:C.muted})+`</g>`;
      [...AT].sort((p,q)=>(p[0]==='O'?0:1)-(q[0]==='O'?0:1)).forEach(([kd,x0,y0,x1,y1],i)=>{const bend=Math.sin(e*Math.PI)*(kd==='O'?0:(i%2?26:-26));h+=atomBall(atomMix(x0,x1,e),atomMix(y0,y1,e)+bend,kd==='O'?28:18,kd);});
      const nH=AT.filter(q=>q[0]==='H').length,nO=AT.length-nH;
      h+=atomT(616,340,['反應前：2 個氫分子 ＋ 1 個氧分子','原子重新排列中','反應後：2 個水分子'][ph],{size:17,weight:700,anchor:'middle',fill:ph===1?C.a:C.ink});
      h+=`<rect x="436" y="354" width="172" height="34" rx="17" fill="#0e1d31" stroke="${C.line}"/><rect x="624" y="354" width="172" height="34" rx="17" fill="#0e1d31" stroke="${C.line}"/>`+atomBall(458,371,9,'H')+atomT(474,377,`氫原子 ${nH} 個`,{size:16,weight:700})+atomBall(646,371,10,'O')+atomT(662,377,`氧原子 ${nO} 個`,{size:16,weight:700});}
    const cap=fix?D.fix:D.cap;h+=atomT(376,k===4?424:428,cap[0],{size:16,fill:fix&&k<3?C.ink:C.ink})+atomT(376,k===4?450:454,cap[1],{size:16,fill:C.muted});
    return {svg:h,reads:[[`第 ${k} 項`,D.t],['現在的看法',fix?(k===1?'修正：原子可再分割':k===2?'修正：有同位素（延伸）':'化學反應中仍然成立'):'打開「後來的修正」查看'],...(k===4?[['氫原子、氧原子','4 個、2 個（前後不變）']]:[])],
      note:fix?'後來修正的是第 1、2 項：原子裡還有<b>電子、質子、中子</b>；同種元素的原子質量可能不同（延伸：同位素）。<br>第 3、4 項在化學反應中仍然成立：原子只是<b>重新排列</b>，種類和個數不變。'
        :'<b>道耳頓原子說</b>：物質由原子組成；同種元素的原子相同；不同元素的原子以簡單整數比結合成化合物；化學反應只是原子<b>重新排列</b>。'};},

  /* ---------- 2 原子模型的演進 ---------- */
  history(s){const C=ATOM_C,k=clamp(s.hsel,0,4),H=ATOM_HIS[k],t=s.t,cx=230,cy=212;let h=ATOM_DEFS;
    h+=atomBox(20,20,420,372)+atomBox(456,20,424,372);
    const leg=(x,kd,txt)=>(kd==='pud'?`<circle cx="${x}" cy="46" r="8" fill="${C.p}" fill-opacity=".35" stroke="${C.p}"/>`:atomBall(x,46,kd==='e'?6:7,kd))+atomT(x+14,52,txt,{size:15,fill:C.muted});
    if(k===0){h+=atomBall(cx,cy,118,'D')+leg(40,'D','原子（實心球）');}
    else if(k===1){h+=`<circle cx="${cx}" cy="${cy}" r="122" fill="url(#atom-pud)" stroke="${C.p}" stroke-opacity=".7" stroke-width="2"/>`;
      for(let i=0;i<16;i++){const an=i*2.39996,r=28*Math.sqrt(i+.5);h+=T(cx+r*Math.cos(an),cy+r*Math.sin(an)+6,'＋',{size:17,anchor:'middle',fill:C.p,weight:700});}
      for(let i=0;i<8;i++){const an=i*2.39996+1.2,r=36*Math.sqrt(i+.6);h+=atomElec(cx+r*Math.cos(an)+2*Math.sin(t*2+i*2),cy+r*Math.sin(an)+2*Math.cos(t*1.7+i*3),6);}
      h+=leg(40,'pud','帶正電的部分')+leg(190,'e','電子（帶負電）');}
    else{h+=`<circle cx="${cx}" cy="${cy}" r="128" fill="none" stroke="${C.dim}" stroke-width="1.5" stroke-dasharray="3 7"/>`;
      [[66,2,.9],[112,4,-.55]].forEach(([r,n,w],j)=>{h+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.e}" stroke-opacity=".22" stroke-width="1.2"/>`;for(let i=0;i<n;i++){const an=t*w+i*2*Math.PI/n+j;h+=atomElec(cx+r*Math.cos(an),cy+r*Math.sin(an),6);}});
      h+=`<circle cx="${cx}" cy="${cy}" r="20" fill="url(#atom-glow)"/>`+atomBall(cx,cy,5.5,'p');
      h+=leg(40,'p','原子核（帶正電）')+leg(210,'e','電子（帶負電）');
      if(k===2)h+=atomT(cx+62,cy-98,'大部分是空的',{size:15,fill:C.muted,anchor:'middle'});}
    h+=atomT(cx,372,H.model,{size:16,weight:700,anchor:'middle',fill:C.a});
    h+=atomT(478,58,`${H.who}：${H.what}`,{size:22,weight:700})+atomT(860,58,`${H.yr} 年`,{size:14,anchor:'end',fill:C.muted})+atomT(478,94,H.l[0],{size:16})+atomT(478,120,H.l[1],{size:16});
    if(k===0){h+=atomBall(560,250,17,'H')+atomBall(668,250,27,'O')+atomBall(776,250,23,'C')+atomT(560,304,'氫原子',{size:15,anchor:'middle',fill:C.muted})+atomT(668,304,'氧原子',{size:15,anchor:'middle',fill:C.muted})+atomT(776,304,'碳原子',{size:15,anchor:'middle',fill:C.muted})
      +atomT(668,186,'不同元素的原子，大小和質量不同',{size:15,anchor:'middle',fill:C.muted})+atomT(668,350,'那時還不知道原子裡面有什麼',{size:15,anchor:'middle',fill:C.muted});}
    else if(k===1){const by=255,q=11/8100,ex=730,ey=by-11,sl=-2*q*90,endY=ey+sl*(832-ex);
      h+=`<rect x="486" y="${by-52}" width="372" height="104" rx="44" fill="#7fb4e6" fill-opacity=".07" stroke="#7fa6c9" stroke-width="2"/><path d="M520 ${by-44}H780" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".18"/>`;
      h+=`<rect x="502" y="${by-15}" width="9" height="30" rx="2" fill="#9aa9bb"/><rect x="556" y="${by-30}" width="7" height="24" rx="2" fill="#9aa9bb"/><rect x="556" y="${by+6}" width="7" height="24" rx="2" fill="#9aa9bb"/>`
        +`<rect x="640" y="${by-30}" width="90" height="6" rx="3" fill="${C.p}"/><rect x="640" y="${by+24}" width="90" height="6" rx="3" fill="${C.e}"/>`
        +atomT(685,by-36,'＋ 正極板',{size:14,anchor:'middle',fill:C.p,weight:700})+atomT(685,by+47,'− 負極板',{size:14,anchor:'middle',fill:C.e,weight:700});
      h+=L(730,by,838,by,{stroke:C.dim,w:1.5,dash:'4 6'});
      const d=`M511 ${by}H640Q685 ${by} ${ex} ${ey}L832 ${endY.toFixed(1)}`;
      h+=`<path d="${d}" fill="none" stroke="#9dffb0" stroke-width="5" stroke-linecap="round" opacity=".25"/><path d="${d}" fill="none" stroke="#c9ffd4" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="10 8" stroke-dashoffset="${(-t*60%18).toFixed(1)}"/><circle cx="834" cy="${endY.toFixed(1)}" r="7" fill="#9dffb0" opacity=".8"/>`;
      h+=atomT(506,by+38,'−',{size:17,anchor:'middle',fill:C.muted,weight:700})+atomT(600,by+26,'陰極射線',{size:14,fill:'#c9ffd4',anchor:'middle'})+atomT(668,186,'陰極射線管（側面）',{size:15,anchor:'middle',fill:C.muted});
      h+=atomT(668,340,'射線偏向正極板 → 射線是帶負電的粒子',{size:15,anchor:'middle'})+atomT(668,366,'換不同金屬當電極都有 → 各種原子都含有電子',{size:15,anchor:'middle',fill:C.muted});}
    else if(k===2){h+=`<rect x="686" y="172" width="7" height="150" rx="2" fill="url(#atom-gold)"/>`+atomT(690,164,'金箔',{size:14,anchor:'middle',fill:C.a});
      const ar=(d,c,op=1)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arr)" opacity="${op}"/>`;
      [182,206,318].forEach(y=>{h+=ar(`M510 ${y}H846`,C.a,.75);});h+=ar('M510 276H689L842 298',C.warn)+ar('M510 242H682L538 224','#ff8d9d');
      h+=atomT(482,262,'α',{size:17,fill:C.a,weight:700})+atomT(668,350,'大多數穿過，少數偏折，極少數反彈',{size:15,anchor:'middle'})+atomT(668,374,'（第 3 分頁可以自己發射 α 粒子）',{size:14,anchor:'middle',fill:C.muted});}
    else{h+=L(cx+5,cy-3,640,198,{stroke:C.dim,w:1.3,dash:'4 6'})+L(cx+5,cy+3,640,346,{stroke:C.dim,w:1.3,dash:'4 6'})+`<circle cx="668" cy="272" r="76" fill="${C.bg}" stroke="#5f7da3" stroke-width="2.5"/>`;
      if(k===4)h+=atomNucleus(668,272,6,6,13);
      else{for(let i=11;i>=0;i--){const rr=13*Math.sqrt(i+.35),an=i*2.39996+.6,x=668+rr*Math.cos(an),y=272+rr*Math.sin(an);h+=i%2?atomProton(x,y,13):`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="12" fill="#0e1d31" stroke="${C.dim}" stroke-width="1.5" stroke-dasharray="3 4"/>`+T(x,y+5,'?',{size:15,anchor:'middle',fill:C.dim,weight:700});}}
      h+=atomT(668,176,'原子核放大來看',{size:15,anchor:'middle',fill:C.muted});
      h+=atomProton(772,236,9)+atomT(788,242,'質子',{size:16,weight:700})+atomT(762,264,'帶正電',{size:15,fill:C.muted});
      if(k===4)h+=atomBall(772,300,9,'n')+atomT(788,306,'中子',{size:16,weight:700})+atomT(762,328,'不帶電',{size:15,fill:C.muted});
      else h+=atomT(762,306,'還有別的',{size:15,fill:C.muted})+atomT(762,328,'粒子嗎？',{size:15,fill:C.muted});
      h+=atomT(478,376,k===4?'質子 6 個、中子 6 個（以碳原子為例）':'只算質子，原子核的質量還不夠',{size:14,fill:C.muted});}
    h+=L(104,420,796,420,{stroke:C.line,w:4})+L(104,420,104+173*k,420,{stroke:C.a,w:4});
    ATOM_HIS.forEach((d,i)=>{const x=104+i*173,on=i===k,past=i<k;
      h+=`<g data-tap="h${i}" tabindex="0" role="button" style="cursor:pointer" aria-label="${d.who}：${d.what}"><rect x="${x-86}" y="398" width="172" height="90" rx="12" fill="${on?'#1b3050':'#0f1b2d'}" fill-opacity="${on?.9:.01}" stroke="${on?C.a:'#0f1b2d'}" stroke-opacity="${on?1:0}" stroke-width="2"/>`
        +`<circle cx="${x}" cy="420" r="${on?13:10}" fill="${on||past?C.a:'#263b59'}" stroke="${on?'#fff':C.line}" stroke-width="2"/>`+T(x,425,i+1,{size:14,weight:700,anchor:'middle',fill:on||past?'#1b2a33':C.ink})
        +T(x,456,d.who,{size:17,weight:700,anchor:'middle',fill:on?C.a:C.ink})+T(x,478,`${d.yr}　${d.what}`,{size:14,anchor:'middle',fill:C.muted})+`</g>`;});
    return {svg:h,reads:[['科學家',`${H.who}（${H.yr} 年）`],['發現',H.what],['那時的原子模型',k===0?'實心球':k===1?'正電均勻分布，電子嵌在裡面':k===2?'中心有原子核，電子在核外':k===3?'原子核裡有質子':'原子核 ＝ 質子 ＋ 中子']],
      note:['<b>道耳頓</b>認為原子是不可分割的實心球。之後的發現一步步修正這個模型。','<b>湯姆森</b>發現<b>電子</b>（帶負電）：原子不是不可分割的。原子不帶電，所以還有等量的正電。','<b>拉塞福</b>由 α 粒子散射實驗發現<b>原子核</b>：體積很小、帶正電、集中了原子大部分的質量。','<b>拉塞福</b>發現原子核裡有帶正電的<b>質子</b>。','<b>查兌克</b>發現不帶電的<b>中子</b>。到這裡，原子的結構是：原子核（質子＋中子）和核外的電子。'][k]+'<br>圖中的原子核和粒子大小都已放大（示意）。'};},

  /* ---------- 3 拉塞福散射實驗 ---------- */
  scatter(s){const C=ATOM_C,SC=ATOM_SC,t=s.t,st=s.st,N=s.sn,foil=s.sview==='foil',pud=s.pud,col=[C.a,C.warn,'#ff8d9d'];let h=ATOM_DEFS;
    const tr=['','',''],act=[];let flashes='',dots='';
    const R=191,fx=300,fy=250,Lt=208+R;
    for(let i=0;i<N;i++){const tau=st-i/SC.rate;if(tau<0)break;const sh=atomShot(i,pud),done=tau>=SC.T;
      if(foil){const yb=sh.b/SC.B*9,a=rad(sh.th),hx=fx+R*Math.cos(a),hy=fy+R*Math.sin(a),dist=Math.min(tau/SC.T,1)*Lt;
        if(done){tr[sh.cat]+=`M96 ${(fy+yb).toFixed(1)}H${fx}L${hx.toFixed(1)} ${hy.toFixed(1)}`;dots+=`<circle cx="${(fx+(R+4)*Math.cos(a)).toFixed(1)}" cy="${(fy+(R+4)*Math.sin(a)).toFixed(1)}" r="3" fill="${sh.cat?col[sh.cat]:'#c8ff9e'}" opacity=".85"/>`;
          if(tau<SC.T+.4){const f=(tau-SC.T)/.4;flashes+=`<circle cx="${(fx+(R+4)*Math.cos(a)).toFixed(1)}" cy="${(fy+(R+4)*Math.sin(a)).toFixed(1)}" r="${(4+f*14).toFixed(1)}" fill="#eaffd0" opacity="${(.9*(1-f)).toFixed(2)}"/>`;}}
        else{const p=dist<=208?[96+dist,fy+yb]:[fx+(dist-208)*Math.cos(a),fy+yb*(1-(dist-208)/R)+(dist-208)*Math.sin(a)];act.push([`M96 ${(fy+yb).toFixed(1)}`+(dist>208?`H${fx}`:'')+`L${p[0].toFixed(1)} ${p[1].toFixed(1)}`,p,sh.cat]);}}
      else{const P=sh.pts,X=x=>(280+x).toFixed(1),Y=y=>(250+y).toFixed(1);
        if(done)tr[sh.cat]+=P.map((q,j)=>(j?'L':'M')+X(q[0])+' '+Y(q[1])).join('');
        else{const p=atomShotPos(sh,tau);let d='M'+X(P[0][0])+' '+Y(P[0][1]);for(let j=1;j<P.length&&P[j][2]<tau;j++)d+='L'+X(P[j][0])+' '+Y(P[j][1]);d+='L'+X(p[0])+' '+Y(p[1]);act.push([d,[280+p[0],250+p[1]],sh.cat]);}}}
    const tracks=tr.map((d,c)=>d?`<path d="${d}" fill="none" stroke="${col[c]}" stroke-width="${c?2:1.2}" stroke-linejoin="round" opacity="${c===0?.3:c===1?.75:1}"/>`:'').join('');
    const heads=act.map(([d,p,c])=>`<path d="${d}" fill="none" stroke="${col[c]}" stroke-width="1.6" opacity=".7" stroke-linejoin="round"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="8" fill="${C.a}" opacity=".25"/>`+atomBall(p[0],p[1],4,'a')).join('');
    if(foil){h+=atomBox(20,30,520,440,{fill:C.bg});
      h+=`<path d="M${(fx+199*Math.cos(rad(194))).toFixed(1)} ${(fy+199*Math.sin(rad(194))).toFixed(1)}A199 199 0 1 1 ${(fx+199*Math.cos(rad(166))).toFixed(1)} ${(fy+199*Math.sin(rad(166))).toFixed(1)}" fill="none" stroke="#1d5a45" stroke-width="12" stroke-linecap="round"/><path d="M${(fx+193.5*Math.cos(rad(194))).toFixed(1)} ${(fy+193.5*Math.sin(rad(194))).toFixed(1)}A193.5 193.5 0 1 1 ${(fx+193.5*Math.cos(rad(166))).toFixed(1)} ${(fy+193.5*Math.sin(rad(166))).toFixed(1)}" fill="none" stroke="#5fd49a" stroke-width="1.5" opacity=".7"/>`;
      h+=L(96,fy,fx+186,fy,{stroke:C.dim,w:1,dash:'2 8',op:.6});
      h+=tracks+heads+dots+flashes;
      h+=`<rect x="26" y="222" width="70" height="56" rx="6" fill="#55657a" stroke="#8fa0b6" stroke-width="2"/><rect x="60" y="244" width="38" height="12" fill="${C.bg}"/><circle cx="54" cy="250" r="9" fill="url(#atom-glow)"/>`+atomBall(54,250,4,'a');
      h+=`<rect x="${fx-3.5}" y="${fy-42}" width="7" height="84" rx="2" fill="url(#atom-gold)"/>`+atomT(fx,fy-52,'金箔',{size:15,anchor:'middle',fill:C.a,weight:700,halo:true});
      h+=atomT(34,60,'俯視圖',{size:17,weight:700})+atomT(61,212,'α 粒子源',{size:15,anchor:'middle',fill:C.muted})+atomT(61,300,'α 粒子',{size:15,anchor:'middle',fill:C.a,weight:700})+atomT(61,320,'（帶正電）',{size:14,anchor:'middle',fill:C.a})
        +atomT(452,430,'螢光屏',{size:15,fill:'#7fe0ae',weight:700})+atomT(452,450,'被打到會發光',{size:13,fill:C.muted})+atomT(fx+214,fy+5,'0°',{size:14,fill:C.muted})+atomT(fx,46,'90°',{size:14,fill:C.muted,anchor:'middle'})+atomT(fx,468,'90°',{size:14,fill:C.muted,anchor:'middle'});}
    else{h+=atomBox(20,30,520,440,{fill:C.bg})+`<g clip-path="url(#atom-clipS)">`;
      if(pud){h+=`<circle cx="280" cy="250" r="200" fill="url(#atom-pud)" stroke="${C.p}" stroke-opacity=".6" stroke-width="1.5"/>`;for(let i=0;i<40;i++){const an=i*2.39996,r=31*Math.sqrt(i+.5);h+=T(280+r*Math.cos(an),256+r*Math.sin(an),'＋',{size:15,anchor:'middle',fill:C.p});}
        for(let i=0;i<12;i++){const an=i*2.39996+1,r=54*Math.sqrt(i+.7);h+=atomElec(280+r*Math.cos(an),250+r*Math.sin(an),4);}}
      else{h+=`<circle cx="280" cy="250" r="200" fill="#12233a" fill-opacity=".5" stroke="${C.dim}" stroke-width="1.5" stroke-dasharray="3 7"/>`;
        [[92,3,.5],[150,4,-.35],[188,5,.25]].forEach(([r,n,w],j)=>{for(let i=0;i<n;i++){const an=t*w+i*2*Math.PI/n+j*1.3;h+=`<g opacity=".55">`+atomElec(280+r*Math.cos(an),250+r*Math.sin(an),3.6)+`</g>`;}});}
      h+=tracks+heads;
      if(!pud)h+=`<circle cx="280" cy="250" r="16" fill="url(#atom-glow)"/>`+atomBall(280,250,2.2,'p');
      h+=`</g>`;
      h+=atomT(34,60,'放大看一個金原子',{size:17,weight:700,halo:true})+atomT(34,456,'α 粒子（帶正電）由左邊射入 →',{size:15,fill:C.a,halo:true});
      if(pud)h+=atomT(526,60,'正電均勻分布，沒有原子核',{size:15,anchor:'end',fill:C.p,halo:true,weight:700});
      else h+=L(288,242,334,196,{stroke:C.muted,w:1.2})+atomT(338,192,'原子核（帶正電）',{size:15,fill:C.p,weight:700,halo:true})+atomT(526,456,'電子很輕，幾乎不影響 α 粒子',{size:14,anchor:'end',fill:C.muted,halo:true});}
    /* 右側：計數、長條圖、推論 */
    const ty=atomTally(s),c=ty.c,pc=v=>ty.done?Math.round(v/ty.done*100):0,names=['直接穿過（偏折不到 5°）','小角度偏折','大角度偏折或反彈（90° 以上）'];
    h+=atomBox(556,30,324,440)+atomT(574,62,`已到達 ${ty.done}／${N} 個`,{size:19,weight:700});
    names.forEach((nm,i)=>{const y=92+i*46,w=ty.done?Math.max(c[i]?4:0,c[i]/N*288):0;
      h+=atomT(574,y,nm,{size:15,fill:C.muted})+atomT(862,y,`${c[i]} 個`,{size:16,weight:700,anchor:'end',fill:col[i]})+`<rect x="574" y="${y+7}" width="288" height="10" rx="5" fill="#0c1829"/>`+(w?`<rect x="574" y="${y+7}" width="${w.toFixed(1)}" height="10" rx="5" fill="${col[i]}"/>`:'');});
    if(pud){h+=atomBox(570,236,296,150,{fill:'#0e1d31',stroke:C.p})+atomT(586,266,'如果正電像布丁一樣均勻分布：',{size:15,weight:700,fill:C.p})+atomT(586,296,'正電分散，斥力很弱，',{size:16})+atomT(586,322,'α 粒子全部幾乎直線穿過。',{size:16})+atomT(586,356,'和實驗結果不合，所以不是這樣。',{size:16,weight:700,fill:C.warn});
      h+=atomT(574,418,'實驗中確實有極少數 α 粒子',{size:15,fill:C.muted})+atomT(574,440,'大角度偏折，甚至反彈。',{size:15,fill:C.muted});}
    else{[['絕大多數直接穿過','原子內部大部分是空的',c[0]>=5,C.a],['少數發生偏折','正電集中在很小的原子核',c[1]+c[2]>=1,C.warn],['極少數大角度偏折、反彈','原子核的質量很大',c[2]>=1,'#ff8d9d']].forEach(([ob,inf,on,cc],i)=>{const y=232+i*72;
        h+=`<g opacity="${on?1:.38}">`+atomBox(570,y,296,62,{fill:'#0e1d31',stroke:on?cc:C.line,rx:10})+atomT(584,y+24,ob,{size:15,fill:on?cc:C.muted})+atomT(584,y+49,'→ '+inf,{size:17,weight:700})+`</g>`;});
      h+=atomT(574,461,'原子核已放大很多倍（示意）',{size:13,fill:C.dim});}
    return {svg:h,reads:[['已到達螢光屏',`${ty.done}／${N} 個`],['直接穿過',`${c[0]} 個（${pc(c[0])}%）`],['小角度偏折',`${c[1]} 個（${pc(c[1])}%）`],['大角度偏折或反彈',`${c[2]} 個（${pc(c[2])}%）`]],
      note:pud?'<b>布丁模型</b>：同樣多的正電均勻分布在整個原子裡，α 粒子受到的斥力很弱，全部幾乎直線穿過，沒有大角度偏折。這和實驗結果不合。'
        :`α 粒子帶正電，接近帶正電的原子核會被<b>排斥</b>，越接近偏折越大。絕大多數直接穿過 → 原子內部<b>大部分是空的</b>；極少數大角度偏折或反彈 → 正電和質量集中在很小的<b>原子核</b>。<br>示意：軌跡依斥力計算，每個 α 粒子只算遇到一個原子，原子核已放大，所以偏折的比例比真實實驗高很多。（α 粒子是氦的原子核）`};},

  /* ---------- 4 組一個原子 ---------- */
  build(s){const C=ATOM_C,A0=atomNow(s),{p,n,e,sym,name}=A0,A=p+n,t=s.t,cx=250,cy=250;let h=ATOM_DEFS;
    h+=atomBox(20,20,460,460,{fill:C.bg});
    const cap=[2,8,8,2],rad4=[84,124,164,204];let left=e;
    cap.forEach((m,j)=>{const k=Math.min(m,left);left-=k;if(!k)return;const r=rad4[j],w=[.55,-.34,.24,-.17][j];
      h+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.e}" stroke-opacity=".2" stroke-width="1.3"/>`;
      for(let i=0;i<k;i++){const an=t*w+i*2*Math.PI/k+j*.7;h+=atomElec(cx+r*Math.cos(an),cy+r*Math.sin(an),6);}});
    h+=`<circle cx="${cx}" cy="${cy}" r="66" fill="url(#atom-glow)" opacity=".22"/>`+atomNucleus(cx,cy,p,n);
    h+=atomT(34,48,'原子核',{size:15,fill:C.muted})+atomT(34,468,'原子核已放大很多倍（示意）',{size:13,fill:C.dim})+atomT(466,468,'電子在原子核外運動',{size:13,fill:C.dim,anchor:'end'});
    h+=L(84,44,cx-Math.min(40,10+Math.sqrt(A)*6),cy-Math.min(34,8+Math.sqrt(A)*5),{stroke:C.dim,w:1.2,dash:'3 5'});
    /* 讀數卡 */
    h+=atomBox(500,20,380,460);
    h+=atomT(520,74,'質量數',{size:15,fill:C.a})+T(648,82,A,{size:32,weight:700,anchor:'end',fill:C.a})+atomT(520,134,'原子序',{size:15,fill:C.p})+T(648,142,p,{size:32,weight:700,anchor:'end',fill:C.p})
      +atomT(656,138,sym,{size:84,weight:700})+atomT(820,112,name,{size:46,weight:700,anchor:'middle'})+atomT(820,142,'元素',{size:14,anchor:'middle',fill:C.muted});
    h+=L(516,166,864,166,{stroke:C.line,w:1.5});
    [['p','質子',p,'帶正電，在原子核內',C.p],['n','中子',n,'不帶電，在原子核內',C.n],['e','電子',e,'帶負電，在原子核外',C.e]].forEach(([kd,nm,v,ds,cc],i)=>{const y=198+i*32;
      h+=(kd==='p'?atomProton(532,y-6,8):kd==='e'?atomElec(532,y-6,6):atomBall(532,y-6,8,'n'))+atomT(550,y,nm,{size:17,weight:700})+T(640,y+1,v,{size:23,weight:700,anchor:'end',fill:cc})+atomT(652,y,'個',{size:15,fill:C.muted})+atomT(688,y,ds,{size:15,fill:C.muted});});
    h+=L(516,280,864,280,{stroke:C.line,w:1.5});
    h+=atomT(520,310,`原子序 ＝ 質子數 ＝ ${p}`,{size:17})+atomT(520,340,`質量數 ＝ 質子數 ＋ 中子數 ＝ ${p} ＋ ${n} ＝ ${A}`,{size:17});
    const dq=p-e,cc=dq===0?C.ok:C.warn,ch=dq===0?`電子數 ＝ 質子數 ＝ ${p} → 電中性`:dq>0?`電子比質子少 ${dq} 個 → 帶正電（稱為離子）`:`電子比質子多 ${-dq} 個 → 帶負電（稱為離子）`;
    h+=`<rect x="514" y="358" width="352" height="44" rx="12" fill="${cc}" fill-opacity=".13" stroke="${cc}" stroke-width="1.5"/>`+T(690,386,ch,{size:17,weight:700,anchor:'middle',fill:cc});
    const nat=A0.nat.includes(n),lo=Math.min(...A0.nat),hi=Math.max(...A0.nat);
    h+=nat?atomT(520,432,`${name}的原子核一定有 ${p} 個質子。`,{size:15,fill:C.muted})+atomT(520,456,'改變中子或電子，都不會變成別種元素。',{size:15,fill:C.muted})
      :atomT(520,432,`示意：自然界幾乎找不到這種原子`,{size:15,fill:C.warn})+atomT(520,456,`（${name}原子的中子數通常是 ${lo===hi?lo:lo+'～'+hi} 個）`,{size:15,fill:C.muted});
    return {svg:h,reads:[['元素',`${name} ${sym}（原子序 ${p}）`],['質量數',`${p} ＋ ${n} ＝ ${A}`],['電性',dq===0?'電中性':dq>0?`帶正電（質子多 ${dq} 個）`:`帶負電（電子多 ${-dq} 個）`]],
      note:`<b>原子序 ＝ 質子數</b>：質子數決定是哪一種元素，${p} 個質子就是${name}。<b>質量數 ＝ 質子數 ＋ 中子數</b> ＝ ${p} ＋ ${n} ＝ ${A}，是個數，沒有單位。<br>中子不帶電，不影響電性；${dq===0?'電子數 ＝ 質子數時，正負電一樣多，原子是<b>電中性</b>。':'電子數和質子數不同時，粒子帶電，稱為<b>離子</b>。'}（電子的排列方式為示意）`};},

  /* ---------- 5 大小與質量 ---------- */
  table(y){const C=ATOM_C;let h=atomBox(500,y,380,154)+`<path d="M500 ${y+34}H880" stroke="${C.line}" stroke-width="1.5"/>`;
    ['粒子','位置','電性','質量（質子＝1）'].forEach((t,i)=>{h+=atomT([548,628,712,806][i],y+23,t,{size:14,fill:C.muted,anchor:'middle'});});
    [['p','質子','原子核內','帶正電','1',C.p],['n','中子','原子核內','不帶電','約 1',C.n],['e','電子','原子核外','帶負電','約 1／1836',C.e]].forEach(([kd,nm,pos,ch,ms,cc],i)=>{const yy=y+62+i*36;
      h+=(kd==='p'?atomProton(522,yy-6,7.5):kd==='e'?atomElec(522,yy-6,5.5):atomBall(522,yy-6,7.5,'n'))+atomT(556,yy,nm,{size:17,weight:700,anchor:'middle'})+atomT(628,yy,pos,{size:16,anchor:'middle'})+T(712,yy,ch,{size:16,anchor:'middle',fill:cc,weight:700})+atomT(806,yy,ms,{size:16,anchor:'middle',weight:700});});
    return h;},
  size(s){const C=ATOM_C,z=clamp(s.z,0,1),W=atomW(z),S=460/W,t=s.t,X=m=>250+m*S,Y=m=>250+m*S;let h=ATOM_DEFS;
    h+=atomBox(20,20,460,460,{fill:'#0c1a14'})+`<g clip-path="url(#atom-clipZ)">`;
    const big=S*50>4000;
    if(big)h+=`<rect x="20" y="20" width="460" height="460" fill="#2d6a40"/>`;
    else{h+=`<circle cx="250" cy="250" r="${(50*S).toFixed(1)}" fill="#14301f" stroke="${C.e}" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="4 7"/>`
      +`<rect x="${X(-50).toFixed(1)}" y="${Y(-29).toFixed(1)}" width="${(100*S).toFixed(1)}" height="${(58*S).toFixed(1)}" rx="${(29*S).toFixed(1)}" fill="#b0563c"/>`
      +`<rect x="${X(-50).toFixed(1)}" y="${Y(-29).toFixed(1)}" width="${(100*S).toFixed(1)}" height="${(58*S).toFixed(1)}" rx="${(29*S).toFixed(1)}" fill="none" stroke="#f1d9cf" stroke-opacity=".5" stroke-width="${clamp(S*.3,.6,2).toFixed(1)}"/>`
      +`<rect x="${X(-41).toFixed(1)}" y="${Y(-20).toFixed(1)}" width="${(82*S).toFixed(1)}" height="${(40*S).toFixed(1)}" rx="${(20*S).toFixed(1)}" fill="#2d6a40" stroke="#f1d9cf" stroke-opacity=".5" stroke-width="${clamp(S*.3,.6,2).toFixed(1)}"/>`;
      if(S*50<700)for(let i=0;i<5;i++){const an=t*.25+i*1.2566;h+=atomElec(250+50*S*Math.cos(an),250+50*S*Math.sin(an),5);}}
    /* 草地紋理：放大時才看得出畫面在變 */
    for(let lv=-3;lv<=1;lv++){const cell=Math.pow(10,lv),px=cell*S;if(px<28||px>360)continue;const op=clamp((px-28)/36,0,1)*clamp((360-px)/120,0,1)*.6,n=Math.ceil(240/px);
      for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const k=(i*31+j*17+lv*101),x=250+(i+rnd(k)-.5)*px,y=250+(j+rnd(k+7)-.5)*px,l=clamp(px*.1,4,13);if(Math.abs(x-250)>240||Math.abs(y-250)>240)continue;if(Math.hypot((x-250)/S,(y-250)/S)>(big?1e9:19))continue;
        h+=`<path d="M${(x-l*.45).toFixed(1)} ${(y-l).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}L${(x+l*.5).toFixed(1)} ${(y-l*.8).toFixed(1)}" fill="none" stroke="#58aa6e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="${op.toFixed(2)}"/>`;}}
    const vis=(mx,my,mr)=>{const pr=mr*S;return pr>1.2&&Math.abs(mx*S)-pr<250&&Math.abs(my*S)-pr<250&&pr<6000;};
    const lab=(mx,my,mr,txt)=>{const pr=mr*S;return pr>5&&pr<150?atomT(X(mx),Y(my)+pr+20,txt,{size:15,anchor:'middle',halo:true,weight:700}):'';};
    if(vis(1.25,.85,.3)){const x=X(1.25),y=Y(.85);h+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(.26*S).toFixed(1)}" ry="${(.12*S).toFixed(1)}" fill="#3f6fb5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.105*S).toFixed(1)}" fill="#2a2320"/>`+lab(1.25,.85,.2,'人（俯視）');}
    if(vis(-.3,.2,.12)){const x=X(-.3),y=Y(.2),r=.12*S;h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#e2803a"/><path d="M${(x-r).toFixed(1)} ${y.toFixed(1)}H${(x+r).toFixed(1)}M${x.toFixed(1)} ${(y-r).toFixed(1)}V${(y+r).toFixed(1)}" stroke="#6b3412" stroke-width="${clamp(r*.06,.6,4).toFixed(1)}" fill="none"/>`+lab(-.3,.2,.12,'籃球 24 cm');}
    if(vis(.036,-.027,.013)){const x=X(.036),y=Y(-.027),r=.013*S;h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#atom-gold)" stroke="#8a6a1c" stroke-width="${clamp(r*.08,.6,5).toFixed(1)}"/>`+(r>12?T(x,y+r*.3,'10',{size:clamp(r*.8,13,80),anchor:'middle',fill:'#7a5b12',weight:700}):'')+lab(.036,-.027,.013,'10 元硬幣 2.6 cm');}
    const gr=.0005*S;
    if(gr>1.5)h+=`<ellipse cx="250" cy="${(250+gr*.5).toFixed(1)}" rx="${(gr*1.05).toFixed(1)}" ry="${(gr*.6).toFixed(1)}" fill="#000" opacity=".3"/>`+atomBall(250,250,gr,'S');
    if(gr<9){const pr=10+2*Math.sin(t*3);h+=`<circle cx="250" cy="250" r="${pr.toFixed(1)}" fill="none" stroke="${C.a}" stroke-width="2"/><path d="M250 ${238-pr}v-22" stroke="${C.a}" stroke-width="2"/>`+atomT(250,250-pr-40,'原子核在這裡',{size:15,anchor:'middle',fill:C.a,weight:700,halo:true});}
    else h+=atomT(250,250-gr-14,'原子核：直徑約 1 mm，像一粒沙',{size:16,anchor:'middle',fill:C.a,weight:700,halo:true});
    if(z<.12)h+=atomT(250,52,'整個原子 ＝ 一座操場（寬約 100 m）',{size:16,anchor:'middle',weight:700,halo:true})+atomT(250,Y(-50)+ (Y(-50)>70?-8:0)+0,'',{size:13});
    if(!big&&S*50<700&&S*50>180)h+=atomT(250,Y(50)-10>470?470:Y(50)+ -8,'電子在這麼遠的地方運動',{size:14,anchor:'middle',fill:C.e,halo:true});
    h+=`</g>`;
    /* 比例尺 */
    const nice=[50,20,10,5,2,1,.5,.2,.1,.05,.02,.01,.005,.002,.001],Lb=nice.find(v=>v*S<=150)||.001,bw=Lb*S;
    h+=`<rect x="34" y="428" width="${(bw+24).toFixed(1)}" height="40" rx="8" fill="#0f1b2d" fill-opacity=".82"/><path d="M46 456v-8M46 452H${(46+bw).toFixed(1)}M${(46+bw).toFixed(1)} 456v-8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`+T(46+bw/2,444,atomLen(Lb),{size:15,weight:700,anchor:'middle',fill:'#fff'});
    h+=atomBox(500,20,380,290)+atomT(520,56,'把原子放大成一座操場',{size:20,weight:700});
    h+=atomT(520,92,'原子的直徑',{size:15,fill:C.muted})+atomT(520,118,'約 10<tspan dy="-8" font-size="14">−10</tspan><tspan dy="8"> m</tspan>',{size:19,weight:700})+atomT(676,118,'→ 放大成 100 m',{size:17,fill:C.e,weight:700});
    h+=atomT(520,152,'原子核的直徑',{size:15,fill:C.muted})+atomT(520,178,'約為原子的 10 萬分之一',{size:19,weight:700})+atomT(520,204,'→ 放大後只有 1 mm，像操場中央的一粒沙',{size:16,fill:C.a,weight:700});
    h+=L(516,222,864,222,{stroke:C.line,w:1.5})+atomT(520,252,'現在畫面的寬度',{size:15,fill:C.muted})+T(864,256,'約 '+atomLen(W),{size:24,weight:700,anchor:'end',fill:C.ink});
    {const f=z,x0=520,x1=864;h+=`<rect x="${x0}" y="276" width="${x1-x0}" height="6" rx="3" fill="#0c1829"/><rect x="${x0}" y="276" width="${((x1-x0)*f).toFixed(1)}" height="6" rx="3" fill="${C.a}"/>`+atomT(x0,300,'操場',{size:13,fill:C.muted})+atomT(x1,300,'原子核',{size:13,fill:C.muted,anchor:'end'});}
    h+=this.table(326);
    return {svg:h,reads:[['畫面寬度','約 '+atomLen(W)],['放大倍率（和整個操場相比）',`約 ${Math.round(140/W).toLocaleString('en-US')} 倍`],['原子核：原子（直徑）','約 1：100000']],
      note:'原子的直徑約 10<sup>−10</sup> m，原子核的直徑大約只有原子的 <b>10 萬分之一</b>。把原子放大成 100 m 寬的操場，原子核只像中央一粒 1 mm 的沙，電子在很遠的外圍運動，所以原子內部<b>大部分是空的</b>。<br>示意：操場、籃球、硬幣只是用來比較大小。'};},
  mass(s){const C=ATOM_C,ne=s.me,A0=atomNow(s),th=rad(clamp((1836-ne)/1836*13,-13,13)),px=250,py=118,bl=150;let h=ATOM_DEFS;
    h+=atomBox(20,20,460,332,{fill:C.bg});
    const lx=px-bl*Math.cos(th),ly=py+bl*Math.sin(th),rx=px+bl*Math.cos(th),ry=py-bl*Math.sin(th);
    h+=`<path d="M${px-9} ${py}L${px-16} 318H${px+16}L${px+9} ${py}Z" fill="#5d6d82"/><rect x="${px-70}" y="316" width="140" height="14" rx="5" fill="#7c8da3"/>`;
    h+=`<path d="M${lx.toFixed(1)} ${ly.toFixed(1)}L${rx.toFixed(1)} ${ry.toFixed(1)}" stroke="#c9d4e2" stroke-width="8" stroke-linecap="round"/><circle cx="${px}" cy="${py}" r="9" fill="#e8eef6" stroke="#5d6d82" stroke-width="3"/>`;
    const pan=(x,y)=>`<path d="M${x.toFixed(1)} ${y.toFixed(1)}L${(x-62).toFixed(1)} ${(y+96).toFixed(1)}M${x.toFixed(1)} ${y.toFixed(1)}L${(x+62).toFixed(1)} ${(y+96).toFixed(1)}" stroke="#8fa0b6" stroke-width="1.5" fill="none"/><path d="M${(x-70).toFixed(1)} ${(y+96).toFixed(1)}H${(x+70).toFixed(1)}q-6 14 -24 14H${(x-46).toFixed(1)}q-18 0 -24 -14Z" fill="#8fa0b6"/>`;
    h+=pan(lx,ly)+pan(rx,ry)+`<circle cx="${lx.toFixed(1)}" cy="${(ly+72).toFixed(1)}" r="30" fill="url(#atom-glow)" opacity=".3"/>`+atomProton(lx,ly+72,23);
    const dots=Math.ceil(ne/12);let k=0;for(let row=0;k<dots;row++){const m=24-row;for(let i=0;i<m&&k<dots;i++,k++)h+=`<circle cx="${(rx+(i-(m-1)/2)*5).toFixed(1)}" cy="${(ry+92-row*4.5).toFixed(1)}" r="2.5" fill="${C.e}"/>`;}
    h+=atomT(lx,ly+134,'1 個質子',{size:17,weight:700,anchor:'middle',fill:C.p})+atomT(rx,ry+134,`${ne} 個電子`,{size:17,weight:700,anchor:'middle',fill:C.e});
    const stt=ne===1836?'一樣重：1 個質子 ≈ 1836 個電子':ne<1836?'質子這一邊比較重':'電子這一邊比較重';
    h+=atomT(250,56,stt,{size:20,weight:700,anchor:'middle',fill:ne===1836?C.ok:C.ink})+atomT(34,338,'每一個藍點代表 12 個電子',{size:13,fill:C.dim})+atomT(466,338,'天平為示意',{size:13,fill:C.dim,anchor:'end'});
    /* 質量分配長條 */
    const {p,n,e,name}=A0,mN=(p+n)*1836,fe=e/(mN+e)*100,bwid=420;
    h+=atomBox(20,364,460,116)+atomT(40,394,`${name}原子（質子 ${p}、中子 ${n}、電子 ${e}）的質量分配`,{size:16,weight:700});
    h+=`<rect x="40" y="408" width="${bwid}" height="26" rx="6" fill="${C.p}"/><rect x="40" y="408" width="${(bwid*p/(p+n)).toFixed(1)}" height="26" rx="6" fill="${C.p}"/><rect x="${(40+bwid*p/(p+n)).toFixed(1)}" y="408" width="${(bwid*n/(p+n)).toFixed(1)}" height="26" fill="${C.n}"/>`+(e?`<rect x="${40+bwid-3}" y="404" width="3" height="34" fill="${C.e}"/>`:'')+T(40+bwid*p/(p+n)/2,427,'質子',{size:15,weight:700,anchor:'middle',fill:'#4a1009'})+(n?T(40+bwid*p/(p+n)+bwid*n/(p+n)/2,427,'中子',{size:15,weight:700,anchor:'middle',fill:'#25303f'}):'');
    h+=atomT(40,462,`原子核（質子＋中子）約 ${(100-fe).toFixed(2)}%`,{size:16,weight:700})+T(460,462,`電子 約 ${fe.toFixed(2)}%`,{size:16,weight:700,anchor:'end',fill:C.e});
    h+=atomBox(500,20,380,290)+atomT(520,56,'誰比較重？',{size:20,weight:700});
    h+=atomT(520,96,'1 個質子的質量',{size:17})+atomT(520,124,'≈ 1 個中子的質量',{size:17})+atomT(520,152,'≈ 1836 個電子的質量',{size:17,weight:700,fill:C.e});
    h+=L(516,172,864,172,{stroke:C.line,w:1.5})+atomT(520,202,'電子太輕，質量可以忽略：',{size:16,fill:C.muted})+atomT(520,232,'原子的質量幾乎都在原子核',{size:19,weight:700,fill:C.a});
    h+=atomT(520,268,'質量數 ＝ 質子數 ＋ 中子數',{size:18,weight:700})+atomT(520,294,'（只數個數，不是幾公克）',{size:15,fill:C.muted});
    h+=this.table(326);
    return {svg:h,reads:[['左盤','1 個質子'],['右盤',`${ne} 個電子`],['結果',ne===1836?'一樣重':ne<1836?`質子較重（還差 ${1836-ne} 個電子）`:'電子這邊較重'],[`${name}原子的質量`,`原子核約 ${(100-fe).toFixed(2)}%`]],
      note:`1 個質子的質量 ≈ 1 個中子 ≈ <b>1836 個電子</b>。${name}原子有 ${p} 個質子、${n} 個中子、${e} 個電子，電子只占質量的約 ${fe.toFixed(2)}%，所以原子的質量幾乎都在<b>原子核</b>，質量數只算質子數＋中子數。<br>下方長條用的是第 4 分頁組好的原子；中子的質量以和質子相同計算。`};}
};
/* 這一頁每一格都在重畫，滑鼠按下到放開之間圖形已被換掉，瀏覽器不會送出 click；所以卡片、時間軸改在 pointerdown 就處理。 */
const ATOM_TAP={t:0};

/* ===== 6-2、6-4 元素與週期表 ===== */
/* ===== 6-2 生活中常見的元素、6-4 週期表 ===== */
/* 週期、族由原子序算出；鑭系、錒系（f＝1～15）另外排在下方兩列 */
function ptPos(z){const ends=[0,2,10,18,36,54,86,118];let p=1;while(z>ends[p])p++;const i=z-ends[p-1];let g,f=0;
  if(p===1)g=i===1?1:18;else if(p<4)g=i<=2?i:i+10;else if(p<6)g=i;else if(i<=2)g=i;else if(i<=17){g=3;f=i-2;}else g=i-14;
  return {p,g,f};}
const PT_SYM='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
/* 臺灣標準譯名；? 表示用字罕見（一般字型可能顯示不出來），只列符號 */
const PT_NAME=('氫氦'+'鋰鈹硼碳氮氧氟氖'+'鈉鎂鋁矽磷硫氯氬'+'鉀鈣鈧鈦釩鉻錳鐵鈷鎳銅鋅鎵鍺砷硒溴氪'+'銣鍶釔鋯鈮鉬鎝釕銠鈀銀鎘銦錫銻碲碘氙'
  +'銫鋇鑭鈰鐠釹鉕釤銪釓鋱鏑鈥鉺銩鐿鎦鉿鉭鎢錸鋨銥鉑金汞鉈鉛鉍釙砈氡'+'鍅鐳錒釷鏷鈾錼鈽鋂鋦鉳鉲鑀鐨鍆鍩鐒鑪?????鐽錀鎶鉨鈇鏌鉝??').split('');
const PT_NM=[1,2,6,7,8,9,10,15,16,17,18,34,35,36,53,54,85,86,117,118],PT_ML=[5,14,32,33,51,52],PT_GAS=[1,2,7,8,9,10,17,18,36,54,86];
const PT_E=[0];for(let z=1;z<=118;z++){const o=ptPos(z);PT_E.push({z,sym:PT_SYM[z-1],name:PT_NAME[z-1]==='?'?'':PT_NAME[z-1],p:o.p,g:o.g,f:o.f,
  cat:PT_NM.includes(z)?'n':PT_ML.includes(z)?'ml':'m',st:PT_GAS.includes(z)?'g':z===35||z===80?'l':z>=104?'u':'s'});}
const PT_CATN={m:'金屬',ml:'類金屬',n:'非金屬'},PT_STN={s:'固態',l:'液態',g:'氣態',u:'未確定'};
const PT_C={m:['#dbe7f1','#7f9fbb'],ml:['#f6dfa2','#c79a2e'],n:['#cfe9d6','#5fa67c'],s:['#ebe5d6','#a79f8a'],l:['#9cc5f0','#3f7fbe'],g:['#f9d2c4','#d47a5c'],u:['#ffffff','#b9b3a4'],hi:['#bfe6e0','#0f766e'],dim:['#f6f3ea','#e4dece']};
const PT_GN={1:'鹼金屬',2:'鹼土金屬',17:'鹵素',18:'鈍氣（惰性氣體）'};
const ptFam=e=>e.f?(e.p===6?'鑭系元素':'錒系元素'):e.z===1?'':e.g===18?'鈍氣':PT_GN[e.g]||'';
const PT_USE={1:'最輕的元素。氫氣可燃，燃燒後只產生水。',2:'密度小又不可燃，用來填充氣球、飛船。',3:'質輕的金屬，用來做鋰電池。',6:'鑽石最硬；石墨可導電，做筆芯和電極。',7:'約占空氣的 4/5，化性不活潑，食品包裝常充氮氣。',8:'約占空氣的 1/5，可助燃；地殼中含量最多的元素。',9:'淡黃色氣體，活性很大；牙膏中含有氟化物。',10:'通電後發出紅橘色的光，用於霓虹燈。',
  11:'質軟，遇水劇烈反應，要保存在石油中。',12:'燃燒時發出強烈白光，用於煙火。',13:'質輕，表面的氧化層保護內部；地殼中含量最多的金屬。',14:'半導體材料，做晶片、太陽能電池；地殼中含量第二多。',15:'火柴盒側面含有紅磷；磷也是肥料的成分。',16:'黃色固體，用於製造火藥、硫酸。',17:'黃綠色的有毒氣體，用於自來水消毒、漂白。',18:'化性很不活潑，充入燈泡可保護燈絲。',19:'比鈉更活潑，要保存在石油中；也是肥料的成分。',20:'骨骼、牙齒含鈣；石灰石、大理石是鈣的化合物。',
  22:'質輕、堅固、耐腐蝕，做人工關節、眼鏡架。',24:'鍍在金屬表面可防鏽；不鏽鋼含有鉻。',25:'乾電池裡的二氧化錳是錳的化合物。',26:'用途最廣的金屬，煉成鋼用於建築、機械。',27:'符號是 Co；CO 則是一氧化碳，大小寫不同。',28:'用於硬幣、電池、不鏽鋼。',29:'紅色金屬，導電性僅次於銀，用來做電線。',30:'乾電池的外殼是鋅；鍍在鐵上可防鏽。',35:'暗紅色液體，常溫下唯一呈液態的非金屬。',47:'導電、導熱最好的金屬，做飾品、餐具。',50:'熔點低，用於焊接（焊錫）。',53:'紫黑色固體；碘酒可消毒，碘液遇澱粉變藍黑色。',
  74:'熔點最高的金屬，做燈泡的燈絲。',78:'又稱白金，活性小，做飾品。',79:'黃色金屬，活性小、延展性最好，做飾品。',80:'俗稱水銀，常溫下唯一呈液態的金屬，有毒。',82:'質軟、密度大，用於鉛蓄電池；有毒。',92:'核能發電的燃料。'};
const ptUse=e=>PT_USE[e.z]||((e.z===43||e.z===61||e.z>=93)?'主要由人工合成的元素'+(e.z>=104?'，性質還不完全清楚。':'。'):'')+(e.name?'':'中文名用字罕見，這裡只列符號。');
const ptWrap=(t,n)=>{const out=[];let cur='',w=0;for(const c of t){const cw=c.charCodeAt(0)<256?.56:1;if(w+cw>n+.01&&!'，。、；）」'.includes(c)){out.push(cur);cur='';w=0;}cur+=c;w+=cw;}if(cur)out.push(cur);return out;};
const ptLines=(x,y,arr,o={})=>{const{size=15,gap=22}=o;return arr.map((t,i)=>T(x,y+i*gap,t,{...o,size})).join('');};
const ptMix=(a,b,f)=>{const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),x=h(a),y=h(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*f).toString(16).padStart(2,'0')).join('');};
const ptPanel=(x,y,w,h,o={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx||14}" fill="${o.fill||'#fffdf8'}" stroke="${o.stroke||'#ddd7c9'}" stroke-width="${o.sw||1.5}"/>`;
const ptBtn=(id,x,y,w,h,label,o={})=>`<g data-tap="${id}" tabindex="0" role="button" aria-label="${o.aria||label}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx||10}" fill="${o.fill||'#fffdf8'}" stroke="${o.stroke||P.accent}" stroke-width="${o.sw||2}"/>${T(x+w/2,y+h/2+(o.size||18)*.36,label,{size:o.size||18,weight:700,anchor:'middle',fill:o.ink||P.accent})}</g>`;
const PT_DEFS=`<defs><radialGradient id="ptGlow"><stop offset="0" stop-color="#ffe680" stop-opacity=".95"/><stop offset=".45" stop-color="#ffd24a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient>
<radialGradient id="ptWhite"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".8"/><stop offset="1" stop-color="#eaf6ff" stop-opacity="0"/></radialGradient>
<linearGradient id="ptSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b97a1"/><stop offset="1" stop-color="#48545d"/></linearGradient>
<linearGradient id="ptWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b988"/><stop offset="1" stop-color="#b8935c"/></linearGradient>
<linearGradient id="ptFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5aa0e6"/><stop offset=".45" stop-color="#ffb347"/><stop offset="1" stop-color="#ffe9a3"/></linearGradient>
<radialGradient id="ptPink"><stop offset="0" stop-color="#e23d74" stop-opacity=".42"/><stop offset="1" stop-color="#e23d74" stop-opacity="0"/></radialGradient>
<clipPath id="ptWater"><path d="M96 240H464V412Q464 426 450 426H110Q96 426 96 412Z"/></clipPath></defs>`;

/* 6-2 卡片：前 20 號、常見金屬、全部常見 */
const PT_DECK={f20:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],metal:[11,12,13,19,20,22,24,25,26,27,28,29,30,47,50,74,78,79,80,82],all:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,25,26,27,28,29,30,35,47,50,53,74,78,79,80,82]};
const ptDeck=s=>{const d=PT_DECK[s.nf]||PT_DECK.f20;return s.nsh?d.slice().sort((a,b)=>rnd(a*7+s.nsh*13)-rnd(b*7+s.nsh*13)):d;};
/* 部首：0 金、1 石、2 气、3 氵／水 */
const ptRad=e=>e.st==='g'?[2,'「气」字頭','常溫為氣態的非金屬']:e.z===80?[3,'下方是「水」','常溫為液態的金屬（例外）']:e.z===35?[3,'「氵」字旁','常溫為液態的非金屬']:e.cat==='m'?[0,e.z===79?'就是「金」字':'「金」字旁','常溫為固態的金屬']:[1,'「石」字旁',e.cat==='ml'?'常溫為固態（類金屬）':'常溫為固態的非金屬'];

/* 金屬與非金屬的樣品：el 能否導電、kt 熱傳導率（W/m·K，用來排導熱快慢）、br 1 易碎 0 有延展性 −1 不適用、lu 光澤 */
const PT_SAMP=[
  {k:'cu',n:'銅',z:29,form:'s',cat:'m',col:'#c8693a',cn:'紅色',lu:2,el:1,kt:401,br:0},{k:'fe',n:'鐵',z:26,form:'s',cat:'m',col:'#a3abb3',cn:'銀白色',lu:2,el:1,kt:80,br:0},
  {k:'al',n:'鋁',z:13,form:'s',cat:'m',col:'#cdd3d8',cn:'銀白色',lu:2,el:1,kt:237,br:0},{k:'au',n:'金',z:79,form:'s',cat:'m',col:'#e3b53c',cn:'黃色',lu:2,el:1,kt:318,br:0},
  {k:'ag',n:'銀',z:47,form:'s',cat:'m',col:'#dde1e5',cn:'銀白色',lu:2,el:1,kt:429,br:0},{k:'mg',n:'鎂',z:12,form:'s',cat:'m',col:'#c4cacf',cn:'銀白色',lu:2,el:1,kt:156,br:0},
  {k:'zn',n:'鋅',z:30,form:'s',cat:'m',col:'#b4bfc9',cn:'銀白色',lu:2,el:1,kt:116,br:0},{k:'hg',n:'汞',z:80,form:'l',cat:'m',col:'#bfc6cc',cn:'銀白色',lu:2,el:1,kt:0,br:-1},
  {k:'si',n:'矽',z:14,form:'s',cat:'ml',col:'#6b7480',cn:'灰黑色',lu:2,el:0,kt:150,br:1},{k:'gr',n:'石墨',z:6,form:'s',cat:'n',col:'#474d54',cn:'灰黑色',lu:1,el:1,kt:130,br:1},
  {k:'di',n:'鑽石',z:6,form:'s',cat:'n',col:'#d3ecf6',cn:'無色透明',lu:0,el:0,kt:0,br:1},{k:'s',n:'硫',z:16,form:'s',cat:'n',col:'#e6cd3c',cn:'黃色',lu:0,el:0,kt:.2,br:1},
  {k:'i',n:'碘',z:53,form:'s',cat:'n',col:'#43305a',cn:'紫黑色',lu:1,el:0,kt:.45,br:1},{k:'br',n:'溴',z:35,form:'l',cat:'n',col:'#7a1c14',cn:'暗紅色',lu:0,el:0,kt:0,br:-1},
  {k:'o',n:'氧',z:8,form:'g',cat:'n',col:'#ffffff',cn:'無色',lu:0,el:0,kt:0,br:-1},{k:'n',n:'氮',z:7,form:'g',cat:'n',col:'#ffffff',cn:'無色',lu:0,el:0,kt:0,br:-1}];
const PT_SM={};PT_SAMP.forEach(m=>{PT_SM[m.k]=m;});
const PT_LU=['無金屬光澤','略有光澤','有金屬光澤'],PT_FORM={s:'固態',l:'液態',g:'氣態'};
const ptHeatOK=m=>m.form==='s'&&m.kt>0,ptTm=m=>2.2+420/m.kt;
const ptDur=s=>{const m=PT_SM[s.ps]||PT_SAMP[0];return s.ptest==='elec'?1.5:s.ptest==='heat'?(!ptHeatOK(m)?.4:m.kt>=50?ptTm(m)+1.8:10):s.ptest==='ham'?(m.br<0?.4:m.br?1.9:3.1):.9;};
/* 紀錄表的一格：[文字, 顏色] */
const ptRes=(m,t)=>t==='elec'?(m.el?['✓ 亮',P.accent]:['✗ 不亮',P.red]):t==='heat'?(!ptHeatOK(m)?['—',P.muted]:m.kt>=50?[ptTm(m).toFixed(1)+' 秒',P.accent]:['未熔',P.red]):t==='ham'?(m.br<0?['—',P.muted]:m.br?['碎裂',P.red]:['延展',P.accent]):[(m.cn.length===3?m.cn.slice(0,2):m.cn)+(m.lu===2?' ✦':''),P.ink];

/* 生活中常見的元素 16 種 */
const PT_U16=[26,29,13,79,47,22,74,80,6,14,16,8,7,2,10,17];
const PT_UT={26:'用途最廣，煉成鋼',29:'電線',13:'鋁箔、門窗',79:'飾品',47:'導電導熱最好',22:'人工關節、眼鏡架',74:'燈絲',80:'溫度計（有毒）',6:'鑽石、石墨筆芯',14:'晶片、太陽能電池',16:'火藥、硫酸',8:'助燃、呼吸',7:'食品包裝充氮',2:'氣球、飛船',10:'霓虹燈',17:'自來水消毒'};
const PT_UD={26:'用途最廣的金屬。鐵礦煉成鐵，再煉成鋼，用於建築、橋梁、機械。地殼中含量第二多的金屬。',29:'紅色金屬，導電性僅次於銀，價格較低，所以電線大多用銅。',13:'質輕。表面會生成一層緻密的氧化鋁，保護內部不再氧化。用於鋁箔、鋁罐、門窗。地殼中含量最多的金屬。',79:'黃色金屬，活性小，不易和其他物質反應，能長久保持光澤；延展性最好。',47:'銀白色金屬，導電、導熱都是金屬中最好的。做飾品、餐具。',22:'質輕、堅固、耐腐蝕，做人工關節、人工牙根、眼鏡架。',
  74:'熔點最高的金屬（約 3400°C），高溫下不易熔化，做燈泡的燈絲。',80:'俗稱水銀，常溫下唯一的液態金屬，可做溫度計、氣壓計。汞和汞的蒸氣有毒。',6:'鑽石和石墨都是碳。鑽石是最硬的物質，不導電；石墨質軟、可導電，做鉛筆芯和電極。',14:'半導體材料，做晶片、太陽能電池。砂和玻璃的主要成分是二氧化矽。地殼中含量第二多的元素。',16:'黃色固體，用於製造火藥、硫酸。火山口、溫泉區常見。',8:'無色氣體，約占空氣的 1/5。可助燃，生物呼吸需要氧。地殼中含量最多的元素。',
  7:'無色氣體，約占空氣的 4/5。化性不活潑，食品包裝充氮可防止變質；液態氮用於冷凍。',2:'密度比空氣小，而且不可燃，比氫氣安全，用來填充氣球、飛船。',10:'裝在玻璃管中通電，會發出紅橘色的光，用於霓虹燈。',17:'黃綠色、有毒的氣體。用於自來水和游泳池的消毒，也用於漂白。'};
const PT_UQ=[['熔點最高的金屬，做燈泡的燈絲',74],['約占空氣 4/5 的氣體',7],['導電、導熱最好的金屬',47],['半導體材料，做晶片',14],['常溫下是液態的金屬',80],['密度小又不可燃，填充氣球',2],['質輕，表面有氧化層保護內部',13],['用於自來水消毒的黃綠色氣體',17],['鑽石和石墨都由它組成',6],['導電性僅次於銀，做電線',29],['可助燃，約占空氣 1/5',8],['質輕堅固耐腐蝕，做人工關節',22],['黃色固體，製造火藥、硫酸',16],['活性小的黃色金屬，做飾品',79],['通電後發出紅橘色的光',10],['用途最廣的金屬，煉成鋼',26]];
/* 小圖示：畫在 44×44 的框內 */
function ptIcon(z,x,y){const S='stroke-linecap="round" stroke-linejoin="round"';let d='';
  if(z===26)d=`<path d="M6 8H38V14H26V30H38V36H6V30H18V14H6Z" fill="#9aa5ae" stroke="#5c6770" stroke-width="1.5" ${S}/>`;
  else if(z===29)d=`<path d="M4 31C12 8 18 40 25 22S36 12 40 15" fill="none" stroke="#c8693a" stroke-width="4" ${S}/><path d="M4 31C7 23 9 20 12 21" fill="none" stroke="#2f3a40" stroke-width="8" ${S}/>`;
  else if(z===13)d=`<rect x="12" y="6" width="20" height="33" rx="4" fill="#d5dade" stroke="#8b97a1" stroke-width="1.5"/><ellipse cx="22" cy="9" rx="8" ry="2.2" fill="#eef1f3" stroke="#8b97a1"/><rect x="12" y="19" width="20" height="9" fill="#df7c44" opacity=".85"/>`;
  else if(z===79)d=`<circle cx="22" cy="27" r="12" fill="none" stroke="#e3b53c" stroke-width="5"/><path d="M22 5L28 11L22 17L16 11Z" fill="#fff3c4" stroke="#b98a14" stroke-width="1.5" ${S}/>`;
  else if(z===47)d=`<rect x="20" y="20" width="4" height="20" rx="2" fill="#dfe3e7" stroke="#8b97a1"/><ellipse cx="22" cy="14" rx="8" ry="11" fill="#eef1f3" stroke="#8b97a1" stroke-width="1.5"/><path d="M18 9Q20 6 23 6" fill="none" stroke="#fff" stroke-width="2" ${S}/>`;
  else if(z===22)d=`<circle cx="12" cy="25" r="8" fill="#eaf4f8" stroke="#6f7f8c" stroke-width="3"/><circle cx="32" cy="25" r="8" fill="#eaf4f8" stroke="#6f7f8c" stroke-width="3"/><path d="M20 24Q22 21 24 24M4 23L2 14M40 23L42 14" fill="none" stroke="#6f7f8c" stroke-width="3" ${S}/>`;
  else if(z===74)d=`<circle cx="22" cy="17" r="13" fill="#fff6c9" stroke="#b59b3a" stroke-width="1.5"/><rect x="16" y="29" width="12" height="10" rx="2" fill="#8d99a3"/><path d="M17 29L19 18l2 4 2-4 2 4 2-4L27 29" fill="none" stroke="#c8553d" stroke-width="1.5" ${S}/>`;
  else if(z===80)d=`<rect x="18.500" y="3" width="7" height="30" rx="3.500" fill="#fbfdff" stroke="#8fa3a8" stroke-width="1.5"/><circle cx="22" cy="35" r="6.500" fill="#aab3bc" stroke="#8fa3a8" stroke-width="1.5"/><rect x="20.500" y="14" width="3" height="18" fill="#aab3bc"/>`;
  else if(z===6)d=`<path d="M8 36L12 26L30 8L36 14L18 32Z" fill="#f2c14e" stroke="#8a6d1a" stroke-width="1.5" ${S}/><path d="M8 36L12 26L18 32Z" fill="#3d4248"/><path d="M27 11L33 17" stroke="#8a6d1a" stroke-width="1.5"/>`;
  else if(z===14)d=`<path d="M8 15H36M8 22H36M8 29H36M15 8V36M22 8V36M29 8V36" stroke="#8d99a3" stroke-width="2" ${S}/><rect x="11" y="11" width="22" height="22" rx="3" fill="#2f3a40"/><rect x="17" y="17" width="10" height="10" rx="1.5" fill="#5d6d77"/>`;
  else if(z===16)d=`<path d="M5 37L12 20L20 37Z" fill="#e6cd3c" stroke="#a8921c" stroke-width="1.5" ${S}/><path d="M15 37L25 10L35 37Z" fill="#f0da55" stroke="#a8921c" stroke-width="1.5" ${S}/><path d="M28 37L35 24L41 37Z" fill="#e6cd3c" stroke="#a8921c" stroke-width="1.5" ${S}/>`;
  else if(z===8)d=`<path d="M22 4Q34 18 31 29Q29 39 22 39Q15 39 13 29Q11 20 18 13Q19 19 22 19Q23 12 22 4Z" fill="#f2884b"/><path d="M22 20Q28 27 26 33Q25 37 22 37Q19 37 18 33Q17 28 22 20Z" fill="#ffd66b"/>`;
  else if(z===7)d=`<path d="M10 8L13 5L16 8L19 5L22 8L25 5L28 8L31 5L34 8V36L31 39L28 36L25 39L22 36L19 39L16 36L13 39L10 36Z" fill="#7fb6d9" stroke="#4c85bb" stroke-width="1.5" ${S}/><ellipse cx="22" cy="22" rx="8" ry="6" fill="#fdf6d8" stroke="#4c85bb"/>`;
  else if(z===2)d=`<ellipse cx="22" cy="16" rx="11" ry="13" fill="#f2a3b3" stroke="#c8697c" stroke-width="1.5"/><path d="M19 9Q16 12 16 16" fill="none" stroke="#fff" stroke-width="2" ${S}/><path d="M22 29L20 32H24ZM22 32Q18 36 23 41" fill="none" stroke="#8b6a70" stroke-width="1.5" ${S}/>`;
  else if(z===10)d=`<rect x="4" y="9" width="36" height="26" rx="6" fill="#22303a"/><path d="M10 29V15L18 29V15M24 22H33Q33 15 28.500 15T24 22T29 29Q32 29 33 27" fill="none" stroke="#ff9478" stroke-width="5" opacity=".35" ${S}/><path d="M10 29V15L18 29V15M24 22H33Q33 15 28.500 15T24 22T29 29Q32 29 33 27" fill="none" stroke="#ff6a45" stroke-width="2" ${S}/>`;
  else d=`<path d="M22 5Q35 22 35 28A13 13 0 0 1 9 28Q9 22 22 5Z" fill="#8ccbe6" stroke="#4c85bb" stroke-width="1.5"/><path d="M15 27Q15 33 21 35" fill="none" stroke="#fff" stroke-width="2.5" ${S}/>`;
  return `<g transform="translate(${x} ${y})">${d}</g>`;}
/* 燒杯（鹼金屬、鈣）：回傳 [水, 玻璃]，反應物畫在兩者之間 */
function ptBeaker(pink,cloud){const W='M96 240H464V412Q464 426 450 426H110Q96 426 96 412Z';
  let back=`<path d="${W}" fill="#d7ecf4"/>`;if(pink>0)back+=`<path d="${W}" fill="#e23d74" opacity="${(pink*.5).toFixed(3)}"/>`;if(cloud>0)back+=`<path d="${W}" fill="#ffffff" opacity="${(cloud*.35).toFixed(3)}"/>`;
  let front=`<path d="M90 150V414Q90 432 108 432H452Q470 432 470 414V150" fill="none" stroke="#83999d" stroke-width="4" stroke-linecap="round"/><path d="M80 150H98M462 150H480" stroke="#83999d" stroke-width="4" stroke-linecap="round"/>`+L(96,240,464,240,{stroke:'#8fc4d6',w:2.5})
    +`<path d="M108 172V404" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/><path d="M120 180V300" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`;
  for(let i=0;i<5;i++)front+=L(446,400-i*45,i%2?454:462,400-i*45,{stroke:'#9db0b4',w:1.5});
  return [back,front];}
/* 同族頁右側：小週期表（標出這一族）＋重點 */
function ptFamSide(g,rows,sel,cap,bul,y0){let h=ptPanel(584,16,300,468);
  for(let z=1;z<=118;z++){const e=PT_E[z];if(e.f)continue;const on=e.g===g,strong=on&&rows.includes(e.p),isSel=on&&e.p===sel;
    h+=`<rect x="${(600+(e.g-1)*15.4).toFixed(1)}" y="${(32+(e.p-1)*14).toFixed(1)}" width="13.6" height="12.2" rx="2" fill="${isSel?P.accent:strong?'#55b3a8':on?(z===1?'#cfe9d6':'#bfe6e0'):'#ebe6d9'}"${z===1&&g===1?' stroke="#5fa67c"':''}/>`;}
  h+=T(600,150,cap,{size:15,weight:700,fill:P.accent});
  bul.forEach((t,i)=>{const c=t[0]==='　';h+=(c?'':`<circle cx="606" cy="${y0+i*25-5}" r="3" fill="${P.accent}"/>`)+T(618,y0+i*25,c?t.slice(1):t,{size:15});});
  h+=`<rect x="600" y="436" width="268" height="34" rx="17" fill="${P.accent}"/>`+T(734,459,'同一族的元素，化學性質相似',{size:16,weight:700,anchor:'middle',fill:'#fff'});
  return h;}

const PT_Q={
  names:['「汞」是金屬，為什麼中文名稱沒有「金」字旁？','元素的中文名稱是依<b>常溫下的狀態</b>造字的：固態金屬用「金」字旁，固態非金屬用「石」字旁，氣態用「气」字頭，液態用「氵（水）」。汞是常溫下<b>唯一呈液態的金屬</b>，所以用「水」作部首；溴則是唯一呈液態的非金屬。'],
  props:['石墨和鑽石都是碳，為什麼一個質軟、能導電，另一個是最硬的物質、不導電？','兩者是<b>同一種元素</b>，但碳原子的<b>排列方式不同</b>，性質就不同。所以「能導電的一定是金屬」是錯的：石墨是非金屬，卻能導電。（在測試台分別測石墨和鑽石比較看看）'],
  table:['門得列夫的週期表留了一些空格，他為什麼敢預言還沒被發現的元素？','他把當時已知的元素依<b>原子量</b>由小到大排列，發現性質會<b>週期性</b>地重複，於是把性質相似的排在同一行。排不下去的地方就留空格，並依周圍元素的性質，預測空格裡元素的性質；後來發現的鎵、鍺等元素和預測很接近。現在的週期表改依<b>原子序</b>排列。'],
  family:['鈉和鉀為什麼要保存在石油（礦物油）中？可以泡在水裡嗎？','<b>不可以泡在水裡</b>。鈉、鉀的活性很大，會和空氣中的氧、水氣反應，遇水更會劇烈反應並產生氫氣。泡在石油中可以<b>隔絕空氣和水</b>。'],
  uses:['鋁的活性比鐵大，為什麼鋁門窗反而不容易鏽蝕？','鋁的表面會很快生成一層<b>緻密的氧化鋁</b>，緊緊蓋住表面，裡面的鋁就不再接觸空氣。鐵鏽質地疏鬆、容易剝落，內部的鐵會繼續生鏽。']};
const PT_QUIZ=[
  {q:'只看中文名稱，下列哪一種元素在常溫常壓下是液態？',opts:['碘','溴','氯','鎂'],ans:1,
    sol:'「溴」是「氵」字旁 → 常溫為<b>液態</b>。碘是「石」字旁（固態非金屬），氯是「气」字頭（氣態），鎂是「金」字旁（固態金屬）。',go:s=>{s.mode='names';s.nv='state';s.nf='all';s.nsh=0;s.ni=28;s.nflip=false;s.nfa=0;s.ng='';},goLabel:'看「溴」這張卡片'},
  {q:'下列元素符號的寫法，何者正確？',opts:['鈷 CO','鎂 mg','鈉 Na','氯 CL'],ans:2,
    sol:'元素符號的<b>第一個字母大寫，第二個字母小寫</b>：鈷 Co、鎂 Mg、鈉 Na、氯 Cl。CO 是一氧化碳（碳和氧的化合物），不是鈷。',go:s=>{s.mode='names';s.nv='name';s.nf='f20';s.nsh=0;s.ni=10;s.nflip=true;s.nfa=1;s.ng='';},goLabel:'看「鈉」這張卡片'},
  {q:'某固體有光澤、可以導電，用鐵鎚敲打會碎裂。它最可能是：',opts:['銅','石墨','硫','鋁'],ans:1,
    sol:'銅、鋁是金屬，敲打會延展、不會碎裂；硫不導電。<b>石墨</b>是非金屬，質脆，卻能導電。',go:s=>{s.mode='props';s.ps='gr';s.ptest='ham';s.pp=0;},goLabel:'敲敲看石墨'},
  {q:'關於金屬元素的敘述，下列何者正確？',opts:['常溫下都是固體','都是銀白色','都能導電、導熱','都能被磁鐵吸引'],ans:2,
    sol:'金屬都是<b>電和熱的良導體</b>。汞在常溫下是液體；銅是紅色、金是黃色；能被磁鐵吸引的只有鐵、鈷、鎳等少數金屬。',go:s=>{s.mode='props';s.ps='hg';s.ptest='elec';s.pp=0;},goLabel:'測汞能不能導電'},
  {q:'現在的週期表，元素是依照什麼順序排列的？',opts:['元素被發現的先後','原子的質量大小','在地殼中的含量','原子序（質子數）'],ans:3,
    sol:'現在的週期表依<b>原子序</b>（質子數）由小到大排列。門得列夫當年是依原子量排列。',go:s=>{s.mode='table';s.tc='f20';s.tsel=1;},goLabel:'看前 20 號元素'},
  {q:'下列哪一組元素的化學性質最相似？',opts:['鈉、鎂、鋁','鋰、鈉、鉀','碳、氮、氧','氫、氦、鋰'],ans:1,
    sol:'<b>同一族</b>（同一直行）的元素化學性質相似。鋰、鈉、鉀都在第 1 族（鹼金屬）；鈉、鎂、鋁是同一週期（同一橫列）。',go:s=>{s.mode='table';s.tc='fam';s.tg=1;s.tsel=11;},goLabel:'標出第 1 族'},
  {q:'常溫常壓下呈液態的元素有哪些？',opts:['汞、溴和氯','溴和碘','只有汞','汞和溴'],ans:3,
    sol:'只有<b>汞</b>（金屬）和<b>溴</b>（非金屬）兩種。氯是氣體，碘是固體。',go:s=>{s.mode='table';s.tc='state';s.tsel=35;},goLabel:'依常溫狀態上色'},
  {q:'把一小塊鈉投入滴有酚酞的水中，下列敘述何者<b>錯誤</b>？',opts:['產生的氣體是氧氣','鈉浮在水面上游動','水溶液使酚酞變紅','反應比鋰劇烈、比鉀緩和'],ans:0,
    sol:'鈉和水反應產生的是<b>氫氣</b>，同時生成氫氧化鈉，水溶液呈鹼性，所以酚酞變紅。活性：鉀 ＞ 鈉 ＞ 鋰。',go:s=>{s.mode='family';s.fam='alk';s.am='na';s.fp=0;},goLabel:'把鈉投入水中'},
  {q:'某元素位於週期表的第 3 週期、第 17 族，它是：',opts:['鈉','硫','氯','氬'],ans:2,
    sol:'第 3 週期由左到右是鈉、鎂、鋁、矽、磷、硫、氯、氬；第 17 族（鹵素）是<b>氯</b>。',go:s=>{s.mode='table';s.tc='fam';s.tg=17;s.tsel=17;},goLabel:'在週期表上找'},
  {q:'地殼中含量最多的元素，和含量最多的金屬元素，依序是：',opts:['氧、鋁','矽、鐵','氧、鐵','氮、鋁'],ans:0,
    sol:'地殼中的含量：<b>氧</b> ＞ 矽 ＞ <b>鋁</b> ＞ 鐵。氧和矽是非金屬與類金屬，含量最多的金屬是鋁。氮是空氣中含量最多的。',go:s=>{s.mode='uses';s.uq=false;s.usel=13;},goLabel:'看含量長條圖'}];

LABS.ptable={group:5,n:'6-4',keep:['mode'],steps:'mode',
  tasks:{names:'先看卡片正面想答案，再點卡片翻面。換成「猜常溫狀態」：只看部首，猜得出它是固態、液態還是氣態嗎？',
    props:'在上面一排點一種樣品，再換不同的測試。哪些樣品會讓燈泡亮？有沒有非金屬也會亮？',
    table:'點任何一格看它的資料。換不同的上色方式：金屬集中在哪一邊？常溫下是液態的有幾種？',
    family:'把鋰、鈉、鉀分別投入水中：哪些現象一樣？劇烈的程度怎麼排？再看其他三族。',
    uses:'點一張卡片看這種元素的用途。打開「配對小測驗」，看用途找元素。'},
  name:'生活中常見的元素、週期表',subtitle:'元素用符號表示，中文名稱的部首表示常溫下的狀態。週期表依原子序排列：橫列是週期，直行是族，同一族的元素化學性質相似。',
  q:s=>({html:qBlockHTML(PT_Q[s.mode]||PT_Q.names)+quizHTML(s,PT_QUIZ)}),
  qAction(s,v){quizAction(s,v,PT_QUIZ);},
  state:{mode:'names',t:0,nv:'sym',nf:'f20',ni:0,nflip:false,nfa:0,ng:'',nsh:0,nok:0,ntry:0,ps:'cu',ptest:'elec',pp:0,pdone:{},tc:'cat',tg:1,tsel:11,fam:'alk',am:'na',aem:'mg',fp:0,hsel:1,gsel:0,usel:26,uq:false,uqi:0,uqp:0,uqs:0,uqn:0,qi:0,qp:null,qc:false,qs:false},
  controls:[
    {type:'seg',key:'mode',label:'主題',options:[['names','元素符號與命名'],['props','金屬與非金屬'],['table','週期表'],['family','同族元素性質相似'],['uses','生活中常見的元素']],onChange:s=>{s.pp=0;s.fp=0;}},
    {type:'seg',key:'nv',label:'練習方式',options:[['sym','看符號想名稱'],['name','看名稱想符號'],['state','猜常溫狀態']],show:s=>s.mode==='names',onChange:s=>{LABS.ptable.nreset(s);}},
    {type:'seg',key:'nf',label:'卡片範圍',options:[['f20','前 20 號'],['metal','常見金屬'],['all','全部常見']],show:s=>s.mode==='names',onChange:s=>{LABS.ptable.nreset(s);}},
    {type:'buttons',label:'換卡片',items:[['上一張',s=>{LABS.ptable.ngo(s,-1);}],['下一張',s=>{LABS.ptable.ngo(s,1);}],['洗牌',s=>{s.nsh=(s.nsh||0)+1;LABS.ptable.nreset(s);}],['照原子序',s=>{s.nsh=0;LABS.ptable.nreset(s);}]],show:s=>s.mode==='names'},
    {type:'seg',key:'ptest',label:'測試',options:[['elec','導電'],['heat','導熱'],['ham','敲打'],['look','外觀']],show:s=>s.mode==='props',onChange:s=>{s.pp=0;}},
    {type:'buttons',label:'操作',items:[['再測一次',s=>{s.pp=0;}],['清空紀錄表',s=>{s.pdone={};s.pp=0;}]],show:s=>s.mode==='props'},
    {type:'seg',key:'tc',label:'上色方式',options:[['cat','金屬／非金屬'],['state','常溫狀態'],['fam','標出一族'],['f20','前 20 號']],show:s=>s.mode==='table'},
    {type:'seg',key:'tg',label:'哪一族',options:[[1,'第 1 族'],[2,'第 2 族'],[17,'第 17 族'],[18,'第 18 族']],show:s=>s.mode==='table'&&s.tc==='fam'},
    {type:'buttons',label:'選元素（也可以直接點格子）',items:[['← 上一個',s=>{s.tsel=s.tsel>1?s.tsel-1:118;}],['下一個 →',s=>{s.tsel=s.tsel<118?s.tsel+1:1;}]],show:s=>s.mode==='table'},
    {type:'seg',key:'fam',label:'哪一族',options:[['alk','鹼金屬'],['ae','鹼土金屬'],['hal','鹵素'],['noble','鈍氣']],show:s=>s.mode==='family',onChange:s=>{s.fp=0;}},
    {type:'seg',key:'am',label:'投入水中的金屬',options:[['li','鋰 Li'],['na','鈉 Na'],['k','鉀 K']],show:s=>s.mode==='family'&&s.fam==='alk',onChange:s=>{s.fp=0;}},
    {type:'seg',key:'aem',label:'實驗',options:[['mg','鎂帶燃燒'],['ca','鈣投入水中']],show:s=>s.mode==='family'&&s.fam==='ae',onChange:s=>{s.fp=0;}},
    {type:'buttons',label:'操作',items:[['重新播放',s=>{s.fp=0;}],['直接看結果',s=>{s.fp=40;}]],show:s=>s.mode==='family'&&(s.fam==='alk'||s.fam==='ae')},
    {type:'toggle',key:'uq',label:'配對小測驗（看用途找元素）',show:s=>s.mode==='uses',onChange:s=>{s.uqp=0;}},
    {type:'buttons',label:'小測驗',items:[['下一題',s=>{s.uqi=(s.uqi+1)%PT_UQ.length;s.uqp=0;}],['重新計分',s=>{s.uqi=0;s.uqp=0;s.uqs=0;s.uqn=0;}]],show:s=>s.mode==='uses'&&s.uq}],
  nreset(s){s.ni=0;s.nflip=false;s.nfa=0;s.ng='';s.nok=0;s.ntry=0;},
  ngo(s,d){const n=ptDeck(s).length;s.ni=((clamp(s.ni,0,n-1)+d)%n+n)%n;s.nflip=false;s.nfa=0;s.ng='';},
  tick(s,dt){s.t+=dt;const tg=s.nflip?1:0;s.nfa=reduceMotion?tg:(s.nfa<tg?Math.min(tg,s.nfa+dt*4):Math.max(tg,s.nfa-dt*4));
    if(s.mode==='props'){const d=ptDur(s);s.pp=reduceMotion?d:Math.min(d,s.pp+dt);if(s.pp>=d-1e-6){if(!s.pdone[s.ps])s.pdone[s.ps]={};s.pdone[s.ps][s.ptest]=1;}}
    if(s.mode==='family')s.fp=reduceMotion?40:Math.min(40,s.fp+dt);},
  tap(s,id){const [k,v]=id.split(':');
    if(id==='flip'){s.nflip=!s.nflip;}
    else if(id==='prev')this.ngo(s,-1);else if(id==='next')this.ngo(s,1);
    else if(k==='g'){if(!s.ng){const e=PT_E[ptDeck(s)[clamp(s.ni,0,ptDeck(s).length-1)]];s.ng=v;s.ntry++;if(v===e.st)s.nok++;s.nflip=true;}}
    else if(k==='d'){const n=ptDeck(s).length;s.ni=clamp(+v,0,n-1);s.nflip=false;s.nfa=0;s.ng='';}
    else if(k==='e'){s.tsel=clamp(+v,1,118);}
    else if(k==='p'){if(PT_SM[v]){s.ps=v;s.pp=0;}}
    else if(k==='h'){s.hsel=clamp(+v,0,3);}else if(k==='n'){s.gsel=clamp(+v,0,2);}
    else if(k==='u'){const z=+v;if(s.uq){if(!s.uqp){s.uqp=z;s.uqn++;if(z===PT_UQ[s.uqi%PT_UQ.length][1])s.uqs++;}}else s.usel=z;}
    else if(id==='uqn'){s.uqi=(s.uqi+1)%PT_UQ.length;s.uqp=0;}},
  render(s){const m=s.mode;return m==='props'?this.props(s):m==='table'?this.table(s):m==='family'?this.family(s):m==='uses'?this.uses(s):this.names(s);},

  /* ---------- 1 元素符號與命名 ---------- */
  names(s){const deck=ptDeck(s),n=deck.length,i=clamp(s.ni,0,n-1),e=PT_E[deck[i]],[ri,rl,rd]=ptRad(e),sv=s.nv==='state',back=s.nfa>.5,sx=Math.max(.02,Math.abs(1-2*s.nfa)).toFixed(3),seen=s.nflip;
    let h=PT_DEFS,c='';
    if(!back){c+=`<rect x="40" y="44" width="300" height="320" rx="24" fill="${P.accent}"/><rect x="52" y="56" width="276" height="296" rx="16" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/>`
        +T(190,96,s.nv==='sym'?'元素符號':'中文名稱',{size:17,anchor:'middle',fill:'#d6f0ec'})
        +T(190,s.nv==='sym'?252:256,s.nv==='sym'?e.sym:e.name,{size:s.nv==='sym'?128:136,anchor:'middle',weight:700,fill:'#ffffff'})
        +T(190,326,sv?'常溫下是固態、液態還是氣態？':s.nv==='sym'?'中文名稱是什麼？':'元素符號怎麼寫？',{size:17,anchor:'middle',fill:'#d6f0ec'});}
    else{const ok=s.ng===e.st;c+=`<rect x="40" y="44" width="300" height="320" rx="24" fill="#fffdf8" stroke="${P.accent}" stroke-width="3"/>`
        +T(190,84,`原子序 ${e.z}`,{size:17,anchor:'middle',fill:P.muted})+T(122,178,e.sym,{size:76,anchor:'middle',weight:700})+T(262,176,e.name,{size:76,anchor:'middle',weight:700,fill:P.accent})
        +L(70,206,310,206,{stroke:P.faint,w:1.5})+T(190,244,rl,{size:22,anchor:'middle',weight:700})+T(190,278,rd,{size:20,anchor:'middle',weight:700,fill:e.z===80?P.red:P.accent})
        +(sv&&s.ng?T(190,330,ok?'✓ 答對了':`✗ 你選的是${PT_STN[s.ng]}`,{size:19,anchor:'middle',weight:700,fill:ok?P.accent:P.red}):T(190,330,e.sym.length===2?'第一個字母大寫，第二個小寫':'只有一個字母：大寫',{size:16,anchor:'middle',fill:P.muted}));}
    h+=`<g data-tap="flip" tabindex="0" role="button" aria-label="翻面" style="cursor:pointer" transform="translate(190 0) scale(${sx} 1) translate(-190 0)">${c}</g>`;
    if(sv)[['s','固態'],['l','液態'],['g','氣態']].forEach(([k,t],j)=>{const done=!!s.ng,right=done&&k===e.st,wrong=done&&k===s.ng&&k!==e.st;
      h+=ptBtn('g:'+k,40+j*104,378,92,44,t,{fill:right?'#cfe9d6':wrong?'#f6d5cf':'#fffdf8',stroke:right?'#2e8b57':wrong?P.red:P.accent,ink:right?'#1d6b41':wrong?P.red:P.accent});});
    else h+=T(190,406,seen?'再點一次翻回正面':'先想答案，再點卡片翻面',{size:16,anchor:'middle',fill:P.muted});
    const nav=(id,x,d,a)=>`<g data-tap="${id}" tabindex="0" role="button" aria-label="${a}" style="cursor:pointer"><circle cx="${x}" cy="458" r="21" fill="#fffdf8" stroke="${P.accent}" stroke-width="2"/><path d="${d}" fill="none" stroke="${P.accent}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    h+=nav('prev',64,'M69 448L59 458L69 468','上一張')+nav('next',316,'M311 448L321 458L311 468','下一張')+T(190,464,`第 ${i+1} / ${n} 張`,{size:18,anchor:'middle',weight:700});
    /* 右側：部首規則 */
    h+=T(386,38,'中文名稱：看部首就知道常溫下的狀態',{size:18,weight:700});
    [['金','常溫為固態的金屬','銅、鐵、鈉…（汞例外）'],['石','常溫為固態的非金屬','碳、硫、碘、矽'],['气','常溫為氣態','氫、氧、氮、氯、氖'],['氵','常溫為液態','只有溴（非金屬）、汞（金屬）']].forEach(([r,d,ex],k)=>{const y=52+k*47,on=seen&&k===ri;
      h+=`<rect x="386" y="${y}" width="488" height="41" rx="10" fill="${on?'#e2f3f0':'#fffdf8'}" stroke="${on?P.accent:'#ddd7c9'}" stroke-width="${on?2.5:1.5}"/><rect x="394" y="${y+5}" width="34" height="31" rx="7" fill="${on?P.accent:'#efe9db'}"/>`
        +T(411,y+29,r,{size:23,anchor:'middle',weight:700,fill:on?'#fff':P.ink})+T(440,y+27,d,{size:17,weight:700})+T(864,y+27,ex,{size:15,anchor:'end',fill:P.muted});});
    h+=ptPanel(386,248,488,76,{rx:12})+T(400,274,'元素符號：第一個字母大寫，第二個字母小寫',{size:16,weight:700})
      +T(400,305,'Co　鈷（一種元素）',{size:16,weight:700,fill:P.accent})+T(578,305,'CO　一氧化碳（碳和氧的化合物）',{size:16,weight:700,fill:P.red});
    h+=T(386,346,'這一組的卡片（點一下可以跳到那一張）',{size:14,fill:P.muted});
    deck.forEach((z,j)=>{const d=PT_E[z],x=386+(j%13)*37.5,y=356+Math.floor(j/13)*39,on=j===i;
      h+=`<g data-tap="d:${j}" tabindex="0" role="button" aria-label="第 ${j+1} 張" style="cursor:pointer"><rect x="${x}" y="${y}" width="34" height="34" rx="7" fill="${on?P.accent:'#fffdf8'}" stroke="${on?P.accent:'#cfc9ba'}" stroke-width="1.5"/>${T(x+17,y+(s.nv==='sym'?23:23.5),s.nv==='sym'?d.sym:d.name,{size:s.nv==='sym'?15:17,anchor:'middle',weight:700,fill:on?'#fff':P.ink})}</g>`;});
    const reads=[['卡片',`第 ${i+1} / ${n} 張`],['正面',s.nv==='sym'?e.sym:e.name],['背面',seen?`${e.sym}　${e.name}`:'先想再翻']];if(sv)reads.push(['答對',`${s.nok} / ${s.ntry} 張`]);
    const note=seen?`<b>${e.name}（${e.sym}）</b>：${rl} → <b>${rd}</b>。`+(e.z===80?'汞是常溫下唯一呈液態的金屬，所以不是「金」字旁。':e.z===35?'溴是常溫下唯一呈液態的非金屬。':e.z===79?'':e.cat==='ml'?'在週期表上，'+e.name+'屬於類金屬。':'')+`<br>符號 ${e.sym}：${e.sym.length===2?'第一個字母大寫、第二個字母小寫。':'只有一個字母，要大寫。'}`
      :'中文名稱的部首表示<b>常溫下的狀態</b>：「金」固態金屬、「石」固態非金屬、「气」氣態、「氵」液態。<br>元素符號取自拉丁文或英文名稱：<b>第一個字母大寫，第二個字母小寫</b>。';
    return {svg:h,reads,note};},

  /* ---------- 2 金屬與非金屬：測試台 ---------- */
  props(s){const sm=PT_SM[s.ps]||PT_SAMP[0],t=s.ptest,dur=ptDur(s),pp=Math.min(s.pp,dur),done=pp>=dur-1e-6,dark=ptMix(sm.col,'#000000',.4);
    let h=PT_DEFS+`<defs><linearGradient id="ptS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ptMix(sm.col,'#ffffff',sm.lu===2?.7:sm.lu?.35:.2)}"/><stop offset=".45" stop-color="${sm.col}"/><stop offset="1" stop-color="${ptMix(sm.col,'#000000',.32)}"/></linearGradient></defs>`;
    /* 樣品架 */
    PT_SAMP.forEach((m,j)=>{const x=18+j*54.2,on=m.k===s.ps,cc=PT_C[m.cat];
      h+=`<g data-tap="p:${m.k}" tabindex="0" role="button" aria-label="${m.n}" style="cursor:pointer"><rect x="${x.toFixed(1)}" y="14" width="50" height="52" rx="9" fill="${on?'#e2f3f0':'#fffdf8'}" stroke="${on?P.accent:'#d5cfc0'}" stroke-width="${on?3:1.5}"/><rect x="${(x+8).toFixed(1)}" y="18" width="34" height="5" rx="2.5" fill="${cc[1]}"/>`
        +`<circle cx="${(x+25).toFixed(1)}" cy="36" r="8" fill="${m.col}" stroke="${m.form==='g'?'#9aa3ad':ptMix(m.col,'#000000',.35)}" stroke-width="1.5"${m.form==='g'?' stroke-dasharray="3 2"':''}/>${m.lu===2?`<circle cx="${(x+22.5).toFixed(1)}" cy="33.500" r="2.500" fill="#fff" opacity=".85"/>`:''}`
        +T(x+25,60,m.n,{size:14,anchor:'middle',weight:700})+`</g>`;});
    h+=`<rect x="18" y="372" width="524" height="14" rx="4" fill="url(#ptWood)"/><rect x="18" y="372" width="524" height="3" rx="1.5" fill="#ecd6b0"/>`;
    const A=t==='elec'?this.pElec(s,sm,pp):t==='heat'?this.pHeat(s,sm,pp):t==='ham'?this.pHam(s,sm,pp):this.pLook(s,sm,pp);h+=A;
    /* 結果文字 */
    let r1,r2,rc=P.accent;const mt=sm.cat==='m';
    if(t==='elec'){r1=sm.el?`${sm.n}：燈泡亮 → 能導電`:`${sm.n}：燈泡不亮 → 不易導電`;rc=sm.el?P.accent:P.red;
      r2=sm.k==='gr'?'石墨是非金屬，卻能導電（常考的例外）。':sm.k==='di'?'鑽石和石墨都是碳，但鑽石不導電。':sm.k==='hg'?'汞是液體，仍然是金屬，能導電。':sm.k==='si'?'矽是類金屬，導電性介於金屬和非金屬之間（半導體）。':mt?'金屬都是電的良導體。':'大部分非金屬不易導電。';}
    else if(t==='heat'){if(!ptHeatOK(sm)){r1=sm.k==='di'?'鑽石太小，做不成棒子，這裡不測':`${sm.n}是${PT_FORM[sm.form][0]}體，這個裝置只測固體棒`;rc=P.muted;r2=sm.k==='di'?'延伸：鑽石不導電，導熱卻比金屬還快。':sm.k==='hg'?'汞是金屬，也是熱的良導體。':'換一種固體樣品試試看。';}
      else if(sm.kt>=50){r1=`${sm.n}：蠟在 ${ptTm(sm).toFixed(1)} 秒熔化 → 導熱快`;r2=mt?'金屬都是熱的良導體；這幾種以銀最快，銅次之。':sm.k==='gr'?'石墨是非金屬，導電、導熱卻都不錯。':'矽是類金屬，導熱比一般非金屬好。';}
      else{r1=`${sm.n}：10 秒後蠟仍未熔化 → 導熱慢`;rc=P.red;r2='大部分非金屬不易導熱。';}}
    else if(t==='ham'){if(sm.br<0){r1=`${sm.n}是${PT_FORM[sm.form][0]}體，沒有固定形狀，不能敲打`;rc=P.muted;r2='敲打只比較固體：金屬有延展性，固態非金屬大多易碎。';}
      else if(sm.br){r1=`${sm.n}：碎裂 → 沒有延展性`;rc=P.red;r2=sm.k==='di'?'鑽石是最硬的物質，但質脆，重擊會碎裂。':sm.k==='si'?'矽有金屬光澤，但質脆、沒有延展性。':'固態非金屬大多質脆，一敲就碎。';}
      else{r1=`${sm.n}：敲扁了、沒有碎裂 → 有延展性`;r2=sm.k==='au'?'金的延展性是金屬中最好的，可以打成很薄的金箔。':'金屬可以打成薄片、抽成細絲，稱為延展性。';}}
    else{r1=`${sm.n}：${sm.cn}、${PT_LU[sm.lu]}`;rc=P.ink;
      r2=sm.k==='hg'?'汞是常溫下唯一呈液態的金屬。':sm.k==='br'?'溴是常溫下唯一呈液態的非金屬，容易揮發。':(sm.k==='gr'||sm.k==='di')?'鑽石和石墨都是碳：同一種元素，原子排列不同，性質不同。':mt?'金屬都有金屬光澤，大多是銀白色；銅是紅色、金是黃色。':sm.k==='si'?'矽是類金屬，有金屬光澤。':'非金屬大多沒有金屬光澤，顏色各不相同。';}
    h+=done?T(26,424,r1,{size:21,weight:700,fill:rc})+T(26,454,r2,{size:15.5,fill:P.ink}):T(26,424,'測試中…',{size:21,weight:700,fill:P.muted});
    /* 紀錄表 */
    const X=[562,626,680,744,806],tx=556,keys=['elec','heat','ham','look'],rows=PT_SAMP.filter(m=>s.pdone[m.k]);
    h+=ptPanel(tx,76,330,410,{rx:12})+`<path d="M${tx} 104V88Q${tx} 76 ${tx+12} 76H${tx+318}Q${tx+330} 76 ${tx+330} 88V104Z" fill="#efe9db"/>`;
    ['樣品','導電','導熱','敲打','外觀'].forEach((c,j)=>{h+=T(X[j]+(j?0:4),96,c,{size:14,weight:700,fill:j&&keys[j-1]===t?P.accent:P.ink});});
    if(!rows.length)h+=T(tx+165,250,'還沒有紀錄',{size:16,anchor:'middle',fill:P.muted})+T(tx+165,276,'選樣品、選測試，結果會記在這裡',{size:14,anchor:'middle',fill:P.muted});
    rows.forEach((m,j)=>{const y=104+j*22;if(m.k===s.ps)h+=`<rect x="${tx+2}" y="${y+1}" width="326" height="21" rx="4" fill="#e2f3f0"/>`;
      h+=`<rect x="${tx+6}" y="${y+5}" width="5" height="13" rx="2" fill="${PT_C[m.cat][1]}"/>`+T(X[0]+10,y+17,m.n,{size:14,weight:700});
      keys.forEach((k,q)=>{const d=s.pdone[m.k][k];const [v,c]=d?ptRes(m,k):['·',P.faint];h+=T(X[q+1],y+17,v,{size:14,fill:c,weight:d&&k!=='look'?700:400});});});
    h+=T(tx+12,476,'✦ 有金屬光澤　　— 不適用',{size:13,fill:P.muted});[['m','金屬'],['ml','類金屬'],['n','非金屬']].forEach(([k,t2],j)=>{h+=`<rect x="${22+j*78}" y="76" width="22" height="6" rx="3" fill="${PT_C[k][1]}"/>`+T(48+j*78,84,t2,{size:13,fill:P.muted});});
    const nT=Object.keys(s.pdone).length;
    return {svg:h,reads:[['樣品',`${sm.n}（${PT_CATN[sm.cat]}，${PT_FORM[sm.form]}）`],['這項測試',done?ptRes(sm,t)[0].replace('✦','').replace('—','不適用'):'測試中'],['已記錄的樣品',`${nT} 種`]],
      note:'<b>金屬</b>：有金屬光澤、導電和導熱良好、有延展性，大多是銀白色（銅紅色、金黃色）。<b>非金屬</b>大多相反。<br>例外要記：<b>汞</b>是唯一的液態金屬，<b>溴</b>是唯一的液態非金屬，<b>石墨</b>是非金屬卻能導電。（熔化時間為示意，快慢順序依實際的導熱能力）'};},
  /* 裝液體或氣體的小燒杯／集氣瓶 */
  pVessel(sm,cx,by,w,hh){const x1=cx-w/2,x2=cx+w/2,top=by-hh;let h='';
    if(sm.form==='l'){const ly=by-hh*.5;h+=`<path d="M${x1+3} ${ly}H${x2-3}V${by-8}Q${x2-3} ${by-3} ${x2-8} ${by-3}H${x1+8}Q${x1+3} ${by-3} ${x1+3} ${by-8}Z" fill="${sm.k==='hg'?'url(#ptS)':sm.col}"/>`+(sm.k==='br'?`<rect x="${x1+3}" y="${top+6}" width="${w-6}" height="${ly-top-6}" fill="#b5452f" opacity=".3"/>`:`<path d="M${x1+12} ${ly+5}H${x2-30}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`);}
    else{h+=`<rect x="${x1+3}" y="${top+6}" width="${w-6}" height="${hh-9}" rx="5" fill="#eef6f8" opacity=".7"/>`;for(let i=0;i<9;i++)h+=`<circle cx="${(x1+14+rnd(i+3)*(w-28)).toFixed(1)}" cy="${(top+16+rnd(i+11)*(hh-30)).toFixed(1)}" r="2.5" fill="none" stroke="#9db8c2" stroke-width="1.2"/>`;}
    h+=`<path d="M${x1} ${top}V${by-10}Q${x1} ${by} ${x1+10} ${by}H${x2-10}Q${x2} ${by} ${x2} ${by-10}V${top}" fill="none" stroke="#83999d" stroke-width="3.5" stroke-linecap="round"/><path d="M${x1+8} ${top+12}V${by-16}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    if(sm.form==='g'||sm.k==='br')h+=`<rect x="${x1-6}" y="${top-7}" width="${w+12}" height="8" rx="3" fill="#cfe0e5" stroke="#83999d" stroke-width="1.5"/>`;
    return h;},
  pElec(s,sm,pp){const cl=clamp((pp-.3)/.4,0,1),on=cl>=1&&!!sm.el,glow=on?clamp((pp-.7)/.4,0,1):0,W='#4a5860',solid=sm.form==='s';
    const wire=d=>`<path d="${d}" fill="none" stroke="${W}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    let h=wire('M100 330H70V200H150')+wire('M210 200H316')+wire(solid?'M344 200H500V330H438':'M344 200H500V250H386V268')+wire(solid?'M194 330H262':'M194 330H250V250H314V268');
    /* 開關 */
    const a=rad(-32*(1-cl));h+=L(150,200,150+60*Math.cos(a),200+60*Math.sin(a),{stroke:'#c8553d',w:5})+`<circle cx="150" cy="200" r="6" fill="#fffdf8" stroke="${W}" stroke-width="2.5"/><circle cx="210" cy="200" r="6" fill="#fffdf8" stroke="${W}" stroke-width="2.5"/>`+T(180,230,cl>=1?'開關：通路':'開關',{size:14,anchor:'middle',fill:P.muted});
    /* 電池 */
    h+=`<rect x="100" y="312" width="86" height="36" rx="6" fill="#2f3a40"/><rect x="100" y="312" width="30" height="36" rx="6" fill="#d08a2e"/><rect x="124" y="312" width="8" height="36" fill="#d08a2e"/><rect x="186" y="322" width="8" height="16" rx="2" fill="#9aa3ad"/>`+T(170,336,'＋',{size:15,anchor:'middle',fill:'#fff',weight:700})+T(114,336,'−',{size:16,anchor:'middle',fill:'#fff',weight:700})+T(143,366,'電池',{size:14,anchor:'middle',fill:P.muted});
    /* 燈泡 */
    if(glow>0){h+=`<circle cx="330" cy="142" r="72" fill="url(#ptGlow)" opacity="${glow.toFixed(2)}"/>`;for(let i=0;i<10;i++){const b=rad(-90+(i-4.5)*30),r1=46,r2=58+5*Math.sin(s.t*3+i);h+=L(330+r1*Math.cos(b),142+r1*Math.sin(b),330+r2*Math.cos(b),142+r2*Math.sin(b),{stroke:'#f0b429',w:3,op:(glow*.8).toFixed(2)});}}
    h+=`<path d="M318 170Q296 156 298 138A32 32 0 0 1 362 138Q364 156 342 170V184H318Z" fill="${glow>0?ptMix('#f7fbfd','#fff0a8',glow):'#f7fbfd'}" stroke="#8fa3a8" stroke-width="2" stroke-linejoin="round"/><path d="M322 184L325 152Q330 138 335 152L338 184" fill="none" stroke="${glow>0?'#f08c1a':'#6b777e'}" stroke-width="${glow>0?2.5:1.8}" stroke-linejoin="round"/>`
      +`<rect x="316" y="182" width="28" height="20" rx="3" fill="#8d99a3"/><path d="M316 188H344M316 194H344" stroke="#6b777e" stroke-width="1.5"/>`+T(388,128,'燈泡',{size:14,fill:P.muted});
    if(pp>=1.1)h+=T(388,156,sm.el?'亮了':'不亮',{size:22,weight:700,fill:sm.el?'#c47a00':P.red});
    /* 樣品 */
    if(solid){h+=`<rect x="270" y="319" width="160" height="22" rx="${sm.k==='di'?3:7}" fill="url(#ptS)" stroke="${ptMix(sm.col,'#000000',.4)}" stroke-width="1.5"/>`+(sm.lu?`<path d="M280 324H400" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="${sm.lu===2?.8:.35}"/>`:'')
        +`<rect x="255" y="320" width="20" height="20" rx="4" fill="#6b777e"/><rect x="425" y="320" width="20" height="20" rx="4" fill="#6b777e"/>`+T(350,364,sm.n+'棒',{size:15,anchor:'middle',weight:700});}
    else{h+=`<rect x="310" y="262" width="8" height="${sm.form==='l'?92:70}" rx="2" fill="#3d4248"/><rect x="382" y="262" width="8" height="${sm.form==='l'?92:70}" rx="2" fill="#3d4248"/>`+this.pVessel(sm,350,372,124,92)+T(446,330,sm.n,{size:15,weight:700})+T(446,350,sm.form==='l'?'（液體）':'（氣體）',{size:14,fill:P.muted});}
    return h;},
  pHeat(s,sm,pp){const ok=ptHeatOK(sm);let h='';
    /* 鐵架 */
    h+=`<rect x="50" y="360" width="110" height="12" rx="4" fill="url(#ptSteel)"/><rect x="96" y="120" width="9" height="242" rx="3" fill="url(#ptSteel)"/><rect x="92" y="240" width="62" height="10" rx="3" fill="#6b777e"/><rect x="140" y="233" width="14" height="34" rx="4" fill="#4a5860"/>`;
    /* 酒精燈 */
    const lit=ok&&pp>0,fl=6*Math.sin(s.t*11)+3*Math.sin(s.t*23);
    h+=`<path d="M186 372Q170 372 172 356L184 326Q188 316 202 316H234Q248 316 252 326L264 356Q266 372 250 372Z" fill="#dff0f5" stroke="#83999d" stroke-width="2.5"/><path d="M178 352L186 334H250L258 352Q262 368 248 368H188Q174 368 178 352Z" fill="#9fd0e6" opacity=".7"/><rect x="208" y="302" width="20" height="16" rx="3" fill="#8d99a3"/><rect x="215" y="294" width="6" height="10" fill="#f3efe4" stroke="#b9b3a4"/>`+T(272,364,'酒精燈',{size:14,fill:P.muted});
    if(lit)h+=`<path d="M207 296Q200 280 ${(218+fl*.4).toFixed(1)} ${(258+fl*.3).toFixed(1)}Q236 280 229 296Q218 302 207 296Z" fill="url(#ptFlame)" opacity=".92"/>`;
    if(!ok){h+=`<rect x="150" y="241" width="320" height="18" rx="6" fill="#efe9db" stroke="#cfc9ba" stroke-width="1.5" stroke-dasharray="6 5"/>`+T(310,222,'（沒有固體棒可以測）',{size:15,anchor:'middle',fill:P.muted});
      h+=`<g transform="translate(0 0)">${sm.form!=='s'?this.pVessel(sm,440,372,90,74):''}</g>`+(sm.form!=='s'?T(440,290,sm.n,{size:15,anchor:'middle',weight:700}):'');return h;}
    const good=sm.kt>=50,tm=good?ptTm(sm):600,fr=clamp(pp/tm,0,1),xf=200+270*fr,mlt=good?clamp((pp-tm)/1.3,0,1):0;
    h+=`<rect x="150" y="241" width="320" height="18" rx="${sm.k==='di'?3:6}" fill="url(#ptS)" stroke="${ptMix(sm.col,'#000000',.4)}" stroke-width="1.5"/>`;
    if(pp>0){const gid='ptH';h+=`<defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="186" y1="0" x2="${Math.max(232,xf).toFixed(1)}" y2="0"><stop offset="0" stop-color="#ff4b2b" stop-opacity=".1"/><stop offset=".12" stop-color="#ff4b2b" stop-opacity="${(.45+.4*Math.min(1,pp/1.2)).toFixed(2)}"/><stop offset="1" stop-color="#ff7a2b" stop-opacity="0"/></linearGradient></defs><rect x="186" y="242" width="${(Math.max(232,xf)-186).toFixed(1)}" height="16" rx="5" fill="url(#${gid})"/>`;
      if(good&&fr<1)h+=`<path d="M${xf.toFixed(1)} 232v-12m-5 6l5-6l5 6" fill="none" stroke="${P.red}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(90 ${xf.toFixed(1)} 224)"/>`+T(Math.min(xf,440),212,'熱',{size:15,anchor:'middle',weight:700,fill:P.red});}
    /* 蠟 */
    const rx=16+8*mlt,ry=12-9*mlt;h+=`<path d="M${445-rx} 241A${rx} ${ry} 0 0 1 ${445+rx} 241Z" fill="#f2d264" stroke="#b9972e" stroke-width="1.5"/>`;
    if(mlt>0){const ph=(pp-tm)*1.4%1,dy=259+ph*ph*105;if(pp<tm+1.7)h+=`<path d="M445 ${(dy-7).toFixed(1)}q5 8 0 11q-5-3 0-11Z" fill="#f1dc8c" stroke="#c9b56a"/>`;h+=`<path d="M463 250v${(6+6*mlt).toFixed(1)}" stroke="#f1dc8c" stroke-width="5" stroke-linecap="round"/><ellipse cx="445" cy="371" rx="${(6+16*mlt).toFixed(1)}" ry="3" fill="#f1dc8c" stroke="#c9b56a"/>`;}
    h+=L(445,196,445,224,{stroke:P.muted,w:1.5})+T(445,190,mlt>0?'蠟熔化了':'蠟',{size:15,anchor:'middle',weight:700,fill:mlt>0?P.red:P.ink})+T(310,284,sm.n+'棒',{size:15,anchor:'middle',weight:700});
    /* 計時 */
    const shown=good?Math.min(pp,tm):pp;h+=ptPanel(396,84,140,62,{rx:12})+T(466,106,'加熱時間',{size:14,anchor:'middle',fill:P.muted})+T(466,136,shown.toFixed(1)+' 秒',{size:24,anchor:'middle',weight:700,fill:mlt>0?P.red:P.ink});
    return h;},
  pHam(s,sm,pp){let h='';
    h+=`<path d="M176 300H384Q392 300 386 308L352 330V352H372V372H188V352H208V330L174 308Q168 300 176 300Z" fill="url(#ptSteel)" stroke="#3b454c" stroke-width="1.5" stroke-linejoin="round"/><path d="M182 303H378" stroke="#c4ced6" stroke-width="2" stroke-linecap="round"/>`+T(280,352,'鐵砧',{size:14,anchor:'middle',fill:'#e8eef2'});
    if(sm.br<0){h+=this.pVessel(sm,450,372,96,80)+T(450,280,sm.n,{size:15,anchor:'middle',weight:700})
        +`<g transform="rotate(28 480 270)"><rect x="302" y="262" width="178" height="9" rx="4" fill="#b98b55"/><rect x="258" y="250" width="44" height="32" rx="5" fill="url(#ptSteel)"/></g>`;return h;}
    const H=sm.br?[.9]:[.9,1.7,2.5],hits=H.filter(x=>pp>=x).length,since=hits?pp-H[hits-1]:1,f=clamp(since/.1,0,1);
    const RX=[30,45,60,74],RY=[17,11,7,4.5],k0=Math.max(0,hits-1);let rx=30,ry=17,ytop;
    if(!sm.br){rx=RX[k0]+(RX[hits]-RX[k0])*f;ry=RY[k0]+(RY[hits]-RY[k0])*f;}
    if(sm.br&&hits){const f2=clamp(since/.4,0,1),e2=1-(1-f2)*(1-f2);for(let i=0;i<11;i++){const dx=(rnd(i+2)-.5)*230,land=Math.abs(dx)<96?300:372,x=280+dx*e2,y=(300-12)+(land-6-(300-12))*f2*f2-40*Math.sin(Math.PI*f2)*rnd(i+8),r=5+rnd(i+5)*8,a=rnd(i)*360+f2*200*(rnd(i+1)-.5);
        h+=`<path d="M${-r} ${r*.6}L${-r*.2} ${-r}L${r} ${r*.5}Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})" fill="${i%3?sm.col:ptMix(sm.col,'#ffffff',.3)}" stroke="${ptMix(sm.col,'#000000',.4)}" stroke-width="1.2" stroke-linejoin="round"/>`;}
      ytop=300-34+28*f;}
    else{h+=`<ellipse cx="280" cy="${(300-ry).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#ptS)" stroke="${ptMix(sm.col,'#000000',.4)}" stroke-width="1.5"/>`+(sm.lu?`<path d="M${(280-rx*.6).toFixed(1)} ${(300-ry*1.5).toFixed(1)}Q280 ${(300-ry*1.95).toFixed(1)} ${(280+rx*.4).toFixed(1)} ${(300-ry*1.6).toFixed(1)}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="${sm.lu===2?.8:.3}"/>`:'');ytop=300-2*ry;}
    let ang;if(hits>=H.length)ang=Math.min(30,(pp-H[H.length-1])*150);else{const t1=H[hits],u=clamp((pp-(t1-.8))/.8,0,1);ang=u<.6?44*Math.sin(u/.6*Math.PI/2):44*(1-Math.pow((u-.6)/.4,2));}
    h+=`<g transform="rotate(${ang.toFixed(1)} 486 ${(ytop-15).toFixed(1)})"><rect x="300" y="${(ytop-20).toFixed(1)}" width="186" height="10" rx="5" fill="#b98b55" stroke="#8a6238"/><rect x="432" y="${(ytop-23).toFixed(1)}" width="58" height="16" rx="8" fill="#8a6238"/><rect x="258" y="${(ytop-32).toFixed(1)}" width="46" height="32" rx="5" fill="url(#ptSteel)" stroke="#3b454c" stroke-width="1.5"/></g>`;
    if(hits&&since<.14)for(let i=0;i<7;i++){const b=rad(-170+i*27),r1=44,r2=62;h+=L(280+r1*Math.cos(b),290+r1*.6*Math.sin(b),280+r2*Math.cos(b),290+r2*.6*Math.sin(b),{stroke:'#f0b429',w:3});}
    h+=T(40,134,sm.n+'：'+(sm.br?(hits?'碎了':'敲一下'):`敲了 ${hits} 下`),{size:21,weight:700,fill:sm.br&&hits?P.red:P.ink})+T(40,162,sm.br?(hits?'碎成小塊':''):hits?'越敲越薄、越寬，沒有裂開':'',{size:15,fill:P.muted});
    return h;},
  pLook(s,sm,pp){let h='';
    /* 檯燈 */
    h+=`<path d="M70 372V190Q70 120 130 112" fill="none" stroke="#4a5860" stroke-width="7" stroke-linecap="round"/><rect x="40" y="362" width="62" height="10" rx="4" fill="#4a5860"/><path d="M120 92L176 112L160 146L112 128Z" fill="#df7c44" stroke="#a85628" stroke-width="1.5" stroke-linejoin="round"/><path d="M136 137L160 146L330 360H150Z" fill="#ffe680" opacity=".2"/>`;
    h+=`<ellipse cx="270" cy="352" rx="150" ry="16" fill="#eef6f8" stroke="#83999d" stroke-width="2.5"/>`;
    const dk=ptMix(sm.col,'#000000',.4);
    if(sm.form==='g'){h+=`<g transform="translate(0 -24)">${this.pVessel(sm,270,372,120,150)}</g>`+T(270,180,'無色的氣體，看不見',{size:14,anchor:'middle',fill:P.muted});}
    else if(sm.k==='br'){h+=`<path d="M254 196H286V226Q318 236 318 262V330Q318 344 304 344H236Q222 344 222 330V262Q222 236 254 226Z" fill="#b5452f" fill-opacity=".28" stroke="#83999d" stroke-width="3" stroke-linejoin="round"/><path d="M225 296H315V330Q315 341 304 341H236Q225 341 225 330Z" fill="${sm.col}"/><rect x="250" y="182" width="40" height="18" rx="5" fill="#c9a877" stroke="#8a6238"/><path d="M232 262V322" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`+T(212,254,'紅棕色蒸氣',{size:14,anchor:'end',fill:P.muted})+T(212,322,'暗紅色液體',{size:14,anchor:'end',fill:P.muted});}
    else if(sm.k==='hg'){[[230,334,38,13],[300,338,26,10],[268,318,16,7],[336,330,12,6],[196,340,10,5]].forEach(([x,y,a,b])=>{h+=`<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="url(#ptS)" stroke="${dk}" stroke-width="1.2"/><ellipse cx="${x-a*.35}" cy="${y-b*.4}" rx="${a*.3}" ry="${b*.22}" fill="#fff" opacity=".9"/>`;});h+=T(270,290,'會聚成小圓珠的液體',{size:14,anchor:'middle',fill:P.muted});}
    else if(sm.k==='di'){h+=`<path d="M210 262L240 228H300L330 262L270 344Z" fill="#e4f6fd" stroke="#6fa8c0" stroke-width="2" stroke-linejoin="round"/><path d="M210 262H330M240 228L252 262L270 344L288 262L300 228M252 262L270 228L288 262" fill="none" stroke="#6fa8c0" stroke-width="1.3" stroke-linejoin="round"/><path d="M240 228L252 262H210Z" fill="#fff" opacity=".7"/>`;
      for(let i=0;i<4;i++){const tw=.5+.5*Math.sin(s.t*3+i*1.7),x=[226,300,270,318][i],y=[240,246,300,270][i],r=7*tw;h+=`<path d="M${x} ${y-r}L${x+r*.25} ${y-r*.25}L${x+r} ${y}L${x+r*.25} ${y+r*.25}L${x} ${y+r}L${x-r*.25} ${y+r*.25}L${x-r} ${y}L${x-r*.25} ${y-r*.25}Z" fill="#fff" stroke="#9fd0e6" stroke-width=".8"/>`;}}
    else{const d='M196 318L214 262L262 236L318 244L348 286L336 334L270 346L212 340Z';
      h+=`<defs><clipPath id="ptLk"><path d="${d}"/></clipPath><linearGradient id="ptS2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ptMix(sm.col,'#ffffff',sm.lu===2?.6:sm.lu?.25:.18)}"/><stop offset=".5" stop-color="${sm.col}"/><stop offset="1" stop-color="${ptMix(sm.col,'#000000',.38)}"/></linearGradient></defs>`
        +`<path d="${d}" fill="url(#ptS2)" stroke="${dk}" stroke-width="2" stroke-linejoin="round"/><path d="M214 262L250 290L262 236M250 290L318 244M250 290L270 346M250 290L196 318M318 244L310 300L348 286M310 300L336 334M310 300L270 346" fill="none" stroke="${dk}" stroke-width="1" opacity=".35"/>`;
      if(sm.lu){const sx=150+((s.t*90)%330);h+=`<g clip-path="url(#ptLk)"><path d="M${sx.toFixed(1)} 220l26 0l-50 140l-26 0Z" fill="#fff" opacity="${sm.lu===2?.6:.22}"/><path d="M${(sx+38).toFixed(1)} 220l8 0l-50 140l-8 0Z" fill="#fff" opacity="${sm.lu===2?.4:.12}"/></g>`;}}
    h+=T(270,392-0,'',{size:14});
    [['顏色',sm.cn],['光澤',PT_LU[sm.lu]],['常溫狀態',PT_FORM[sm.form]]].forEach(([a,b],j)=>{const y=96+j*74;h+=ptPanel(408,y,128,62,{rx:12})+T(420,y+22,a,{size:14,fill:P.muted})+T(420,y+49,b,{size:19,weight:700,fill:j===1&&sm.lu===2?P.accent:P.ink});});
    h+=T(270,104,sm.n,{size:24,anchor:'middle',weight:700})+T(270,130,`${PT_CATN[sm.cat]}　原子序 ${sm.z}`,{size:15,anchor:'middle',fill:P.muted});
    return h;},

  /* ---------- 3 週期表 ---------- */
  table(s){const tc=s.tc,E=PT_E.slice(1),sel=PT_E[clamp(s.tsel,1,118)],CW=46.5,CH=48;
    const XY=e=>e.f?[30+(e.f+1)*47.5,385+(e.p-6)*49]:[30+(e.g-1)*47.5,30+(e.p-1)*49];
    const sty=e=>tc==='cat'?PT_C[e.cat]:tc==='state'?PT_C[e.st]:tc==='fam'?(e.g===s.tg&&!e.f?(e.z===1?PT_C.n:PT_C.hi):PT_C.dim):(e.z<=20?PT_C[e.cat]:PT_C.dim);
    let h='';
    for(let g=1;g<=18;g++)h+=T(30+(g-1)*47.5+CW/2,24,g,{size:14,anchor:'middle',weight:700,fill:tc==='fam'&&g===s.tg?P.accent:P.muted});
    for(let p=1;p<=7;p++)h+=T(19,30+(p-1)*49+30,p,{size:14,anchor:'middle',weight:700,fill:P.muted});
    for(const e of E){const [x,y]=XY(e),c=sty(e),dim=c===PT_C.dim;
      h+=`<g data-tap="e:${e.z}" tabindex="0" role="button" aria-label="${e.z} ${e.sym} ${e.name}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="5" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.3"${c===PT_C.u?' stroke-dasharray="4 3"':''}/>`
        +T(x+4,y+14,e.z,{size:13,fill:dim?'#aaa392':P.muted})+(e.name?T(x+CW-4,y+15,e.name,{size:13,anchor:'end',fill:dim?'#aaa392':P.ink}):'')+T(x+CW/2,y+40,e.sym,{size:21,anchor:'middle',weight:700,fill:dim?'#aaa392':P.ink})+`</g>`;}
    /* 鑭系、錒系的位置 */
    [[6,'57–71','鑭系'],[7,'89–103','錒系']].forEach(([p,r,nm])=>{const x=30+2*47.5,y=30+(p-1)*49;h+=`<rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="5" fill="#fbf8f0" stroke="#cfc9ba" stroke-width="1.3" stroke-dasharray="4 3"/>`+T(x+CW/2,y+21,r,{size:13,anchor:'middle',fill:P.muted})+T(x+CW/2,y+39,nm,{size:13,anchor:'middle',fill:P.muted})
      +T(116,385+(p-6)*49+22,nm,{size:15,anchor:'end',weight:700,fill:P.muted})+T(116,385+(p-6)*49+40,r,{size:13,anchor:'end',fill:P.muted});});
    h+=`<path d="M${30+2*47.5+CW/2} ${30+7*49-1}V${379}" stroke="#cfc9ba" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    /* 選取框 */
    {const [x,y]=XY(sel);h+=`<rect x="${x-1.5}" y="${y-1.5}" width="${CW+3}" height="${CH+3}" rx="6" fill="none" stroke="${P.ink}" stroke-width="3" pointer-events="none"/>`;}
    /* 資料卡：放在過渡元素上方的空位 */
    {const e=sel,x=129,y=33,c=PT_C[e.cat],fam=ptFam(e),use=ptWrap(ptUse(e),21).slice(0,3);
      h+=ptPanel(x,y,467,140,{rx:12,stroke:'#b9b3a4'})+`<rect x="${x+10}" y="${y+10}" width="100" height="120" rx="10" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>`+T(x+20,y+32,e.z,{size:17,weight:700,fill:P.muted})+T(x+60,y+84,e.sym,{size:44,weight:700,anchor:'middle'})+T(x+60,y+117,e.name,{size:24,anchor:'middle'});
      h+=T(x+124,y+30,`原子序 ${e.z}　第 ${e.p} 週期　${e.f?(e.p===6?'鑭系':'錒系'):'第 '+e.g+' 族'}`,{size:17,weight:700});
      h+=T(x+124,y+56,(fam?fam+'｜':'')+PT_CATN[e.cat]+'｜常溫：'+PT_STN[e.st],{size:16,fill:P.accent,weight:700});
      h+=ptLines(x+124,y+82,use,{size:15,gap:21});
      if(e.z===1)h+=T(x+124,y+124,'氫在第 1 族，但它是非金屬，不是鹼金屬。',{size:14,fill:P.red});}
    /* 圖例 */
    const leg=tc==='cat'||tc==='f20'?[['m','金屬'],['ml','類金屬'],['n','非金屬']]:tc==='state'?[['s','固態'],['l','液態'],['g','氣態'],['u','未確定']]:[['hi','第 '+s.tg+' 族：'+(s.tg===18?'鈍氣':PT_GN[s.tg])],...(s.tg===1?[['n','氫：非金屬']]:[])];
    leg.forEach(([k,t],j)=>{const wide=tc==='fam',x=606+(wide?0:(j%2)*112),y=47+(wide?j:Math.floor(j/2))*23;h+=`<rect x="${x}" y="${y-13}" width="15" height="15" rx="3" fill="${PT_C[k][0]}" stroke="${PT_C[k][1]}" stroke-width="1.5"${k==='u'?' stroke-dasharray="3 2"':''}/>`+T(x+21,y,t,{size:14});});
    /* 讀數 */
    const cnt=(arr,f)=>arr.filter(f).length;let reads,note;
    if(tc==='cat'){reads=[['金屬',cnt(E,e=>e.cat==='m')+' 種'],['類金屬',cnt(E,e=>e.cat==='ml')+' 種'],['非金屬',cnt(E,e=>e.cat==='n')+' 種']];
      note='<b>金屬</b>在左邊和中間，占大多數；<b>非金屬</b>集中在右上角（氫例外，在左上角）；<b>類金屬</b>（硼、矽、鍺、砷、銻、碲）在兩者的交界。';}
    else if(tc==='state'){reads=[['固態',cnt(E,e=>e.st==='s')+' 種'],['液態',cnt(E,e=>e.st==='l')+' 種（汞、溴）'],['氣態',cnt(E,e=>e.st==='g')+' 種'],['未確定',cnt(E,e=>e.st==='u')+' 種']];
      note='常溫常壓下，液態的只有<b>汞</b>（金屬）和<b>溴</b>（非金屬）；氣態的有氫、氮、氧、氟、氯和第 18 族的鈍氣；其餘都是固態。<br>104 號以後是人工合成的元素，數量極少，狀態還不確定。';}
    else if(tc==='fam'){const G=E.filter(e=>e.g===s.tg&&!e.f),nm=s.tg===18?'鈍氣':PT_GN[s.tg];reads=[['第 '+s.tg+' 族',PT_GN[s.tg]],['這一直行',G.length+' 種元素'],['金屬／非金屬',`${cnt(G,e=>e.cat==='m')} ／ ${cnt(G,e=>e.cat!=='m')} 種`]];
      note=`<b>同一族（同一直行）的元素，化學性質相似。</b><br>第 ${s.tg} 族：`+G.map(e=>e.name||e.sym).join('、')+'。'+(s.tg===1?'氫以外的 6 種是<b>鹼金屬</b>，都很活潑，遇水劇烈反應。':s.tg===2?'都是金屬，稱為<b>鹼土金屬</b>。':s.tg===17?'稱為<b>鹵素</b>，是活潑的非金屬。':'稱為<b>'+nm+'</b>，幾乎不和其他物質反應。');}
    else{const F=E.filter(e=>e.z<=20);reads=[['前 20 號：金屬',cnt(F,e=>e.cat==='m')+' 種'],['類金屬',cnt(F,e=>e.cat==='ml')+' 種'],['非金屬',cnt(F,e=>e.cat==='n')+' 種']];
      note='前 20 號：氫氦｜鋰鈹硼碳氮氧氟氖｜鈉鎂鋁矽磷硫氯氬｜鉀鈣。每個週期由左到右原子序加 1。<br>第 1 週期 2 種、第 2 和第 3 週期各 8 種；第 4 週期從鉀、鈣開始。';}
    if(tc==='cat'||tc==='state')note+=`<br>週期表依<b>原子序</b>排列：橫列是<b>週期</b>（共 7 個），直行是<b>族</b>（第 1～18 族）。現在選的 ${sel.name||sel.sym} 在第 ${sel.p} 週期${sel.f?'':'、第 '+sel.g+' 族'}。`;
    return {svg:h,reads,note};},

  /* ---------- 4 同族元素性質相似 ---------- */
  family(s){return s.fam==='ae'?(s.aem==='ca'?this.fCa(s):this.fMg(s)):s.fam==='hal'?this.fHal(s):s.fam==='noble'?this.fNoble(s):this.fAlk(s);},
  fAlk(s){const M={li:{n:'鋰',D:14,A:34,w:.8,col:'#aeb6bd',oh:'氫氧化鋰',p:2,nb:6,say:'浮在水面，慢慢冒出氣泡'},na:{n:'鈉',D:7,A:118,w:2.3,col:'#d3d8dc',oh:'氫氧化鈉',p:3,nb:10,say:'熔成小球，在水面快速游動'},k:{n:'鉀',D:3.5,A:122,w:4.4,col:'#c9cfd4',oh:'氫氧化鉀',p:4,nb:14,say:'反應最劇烈，冒出紫色火焰'}}[s.am]||{};
    const t0=.9,fp=s.fp,tr=fp-t0,q=clamp(tr/M.D,0,1),X=t=>280+M.A*(.62*Math.sin(M.w*t)+.38*Math.sin(1.7*M.w*t+1)),x0=X(0),[back,front]=ptBeaker(q,0);
    let h=PT_DEFS+T(30,44,'第 1 族　鹼金屬',{size:22,weight:700})+T(30,72,'平常保存在石油中；質軟，用小刀切一小塊來做實驗',{size:15,fill:P.muted})+back;
    /* 酚酞變紅的痕跡 */
    if(tr>0&&q<1){let g='';for(let j=1;j<=12;j++){const tj=tr-j*M.D/18;if(tj<0)break;g+=`<circle cx="${X(tj).toFixed(1)}" cy="${252+j*8}" r="${22+j*8}" fill="url(#ptPink)"/>`;}h+=`<g clip-path="url(#ptWater)">${g}</g>`;}
    if(tr<0){const y=fp<.3?158:158+78*Math.pow((fp-.3)/.6,2);h+=L(x0-16,118,x0-6,150,{stroke:'#8d99a3',w:4})+L(x0+16,118,x0+6,150,{stroke:'#8d99a3',w:4})+`<rect x="${(x0-11).toFixed(1)}" y="${(y-9).toFixed(1)}" width="22" height="18" rx="4" fill="${M.col}" stroke="#7b858d" stroke-width="1.5"/>`;}
    else if(q<1){const r=12*Math.sqrt(1-q)+2,x=X(tr),cy=240-r*.3+1.5*Math.sin(s.t*9);
      for(let i=0;i<M.nb;i++){const ph=(tr*(1.6+rnd(i)*1.6)+rnd(i+9))%1;h+=`<circle cx="${(x+(rnd(i+3)-.5)*(2*r+26)).toFixed(1)}" cy="${(240-ph*(8+rnd(i+5)*22)).toFixed(1)}" r="${(1.6+rnd(i+7)*2.6).toFixed(1)}" fill="#fff" stroke="#7fb2c4" stroke-width="1.2" opacity="${(1-ph).toFixed(2)}"/>`;}
      if(s.am==='k'){const fh=30+7*Math.sin(s.t*19),y=cy-r*.4;h+=`<path d="M${(x-10).toFixed(1)} ${y.toFixed(1)}Q${(x-13).toFixed(1)} ${(y-16).toFixed(1)} ${x.toFixed(1)} ${(y-fh).toFixed(1)}Q${(x+13).toFixed(1)} ${(y-16).toFixed(1)} ${(x+10).toFixed(1)} ${y.toFixed(1)}Z" fill="#b592ee" opacity=".9"/><path d="M${(x-5).toFixed(1)} ${y.toFixed(1)}Q${(x-6).toFixed(1)} ${(y-9).toFixed(1)} ${x.toFixed(1)} ${(y-fh*.55).toFixed(1)}Q${(x+6).toFixed(1)} ${(y-9).toFixed(1)} ${(x+5).toFixed(1)} ${y.toFixed(1)}Z" fill="#f1e8ff"/>`;}
      h+=s.am==='li'?`<rect x="${(x-r).toFixed(1)}" y="${(cy-r*.8).toFixed(1)}" width="${(2*r).toFixed(1)}" height="${(1.6*r).toFixed(1)}" rx="3" fill="${M.col}" stroke="#7b858d" stroke-width="1.5"/>`:`<circle cx="${x.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${M.col}" stroke="#7b858d" stroke-width="1.5"/><circle cx="${(x-r*.35).toFixed(1)}" cy="${(cy-r*.35).toFixed(1)}" r="${(r*.28).toFixed(1)}" fill="#fff" opacity=".9"/>`;
      h+=T(x,cy-r-(s.am==='k'?46:16),'氫氣',{size:14,anchor:'middle',fill:P.muted,weight:700});}
    h+=front+T(280,106,tr<0?`把一小塊${M.n}投入滴有酚酞的水中`:q<1?`${M.n}：${M.say}`:'反應結束：水溶液變成紅色',{size:18,anchor:'middle',weight:700,fill:q>=1?'#b3144f':P.ink});
    h+=q>=1?T(280,340,'酚酞變紅 → 水溶液呈鹼性',{size:21,anchor:'middle',weight:700,fill:'#8f0f3f'}):T(280,408,q>.02?'酚酞遇到鹼性溶液變紅':'水＋酚酞（無色）',{size:15,anchor:'middle',fill:'#4f6b76'});
    h+=T(280,468,`${M.n} ＋ 水 → ${M.oh} ＋ 氫氣`,{size:18,anchor:'middle',weight:700});
    h+=ptFamSide(1,[2,3,4],M.p,'第 1 族（氫除外）：鹼金屬',['質軟，可以用小刀切開','密度比水小，浮在水面上','和水反應，產生氫氣','水溶液呈鹼性（酚酞變紅）','鈉、鉀要保存在石油中'],300);
    h+=T(600,176,'和水反應的劇烈程度（示意）',{size:14,fill:P.muted});
    [['li','鋰',1],['na','鈉',2],['k','鉀',3]].forEach(([k,n,v],j)=>{const y=186+j*25,on=k===s.am;h+=T(600,y+15,n,{size:16,weight:700,fill:on?P.accent:P.ink})+`<rect x="628" y="${y+2}" width="${v*76}" height="15" rx="7.500" fill="${on?P.accent:'#d7d1c2'}"/>`;});
    return {svg:h,reads:[['金屬',`${M.n}（第 ${M.p} 週期、第 1 族）`],['反應進度',tr<0?'還沒放入':q<1?Math.round(q*100)+'%':'反應完畢'],['反應所需時間',M.D+' 秒（示意）']],
      note:`鋰、鈉、鉀同在第 1 族，和水反應的結果<b>相似</b>：都浮在水面、產生<b>氫氣</b>、水溶液呈<b>鹼性</b>（酚酞變紅）。<br>劇烈程度不同：<b>鉀 ＞ 鈉 ＞ 鋰</b>。在週期表上的位置，可以用來預測元素的性質。`};},
  fCa(s){const fp=s.fp,D=12,q=clamp((fp-.9)/D,0,1),[back,front]=ptBeaker(q,q);
    let h=PT_DEFS+T(30,44,'第 2 族　鹼土金屬',{size:22,weight:700})+T(30,72,'和同週期的鉀比一比：鈣的反應緩和得多',{size:15,fill:P.muted})+back;
    const r=10*Math.sqrt(1-q)+2,gy=fp<.3?158:fp<.9?158+82*Math.pow((fp-.3)/.6,2):Math.min(424-r,240+(fp-.9)*150);
    if(fp<.9)h+=L(264,118,274,150,{stroke:'#8d99a3',w:4})+L(296,118,286,150,{stroke:'#8d99a3',w:4});
    if(fp>=.9&&q<1)for(let i=0;i<16;i++){const ph=(fp*.55+rnd(i)*7)%1,by=gy-ph*(gy-244);if(by<gy-4)h+=`<circle cx="${(280+(rnd(i+3)-.5)*34+6*Math.sin(ph*9+i)).toFixed(1)}" cy="${by.toFixed(1)}" r="${(2+rnd(i+7)*3).toFixed(1)}" fill="#fff" fill-opacity=".8" stroke="#7fb2c4" stroke-width="1.2"/>`;}
    if(q<1)h+=`<rect x="${(280-r).toFixed(1)}" y="${(gy-r*.8).toFixed(1)}" width="${(2*r).toFixed(1)}" height="${(1.6*r).toFixed(1)}" rx="4" fill="#c2c8cd" stroke="#7b858d" stroke-width="1.5"/>`;
    h+=front+T(280,106,fp<.9?'把一小塊鈣投入滴有酚酞的水中':q<1?'鈣沉到杯底，持續冒出氫氣的氣泡':'反應結束：水溶液變紅，而且有些混濁',{size:18,anchor:'middle',weight:700,fill:q>=1?'#b3144f':P.ink});
    h+=q>=1?T(280,340,'酚酞變紅 → 水溶液呈鹼性',{size:21,anchor:'middle',weight:700,fill:'#8f0f3f'}):T(190,404,q>.02?'酚酞遇到鹼性溶液變紅':'水＋酚酞（無色）',{size:15,anchor:'middle',fill:'#4f6b76'});
    h+=T(280,468,'鈣 ＋ 水 → 氫氧化鈣 ＋ 氫氣',{size:18,anchor:'middle',weight:700});
    h+=ptFamSide(2,[3,4],4,'第 2 族：鹼土金屬',['鈹、鎂、鈣、鍶、鋇、鐳','都是銀白色的金屬','活性比同週期的鹼金屬小','鈣和水反應產生氫氣，','　水溶液呈鹼性，但比鈉緩和','鎂帶燃燒發出強烈白光，','　生成白色的氧化鎂','鈣的密度比水大，會沉下去'],184);
    return {svg:h,reads:[['金屬','鈣（第 4 週期、第 2 族）'],['反應進度',fp<.9?'還沒放入':q<1?Math.round(q*100)+'%':'反應完畢'],['反應所需時間',D+' 秒（示意）']],
      note:'鈣和水反應也產生<b>氫氣</b>，水溶液呈<b>鹼性</b>，但比同週期的鉀（第 1 族）緩和。<br>鎂、鈣同在第 2 族，化學性質相似，都能在空氣中燃燒，也都能和酸反應產生氫氣。'};},
  fMg(s){const fp=s.fp,b=clamp((fp-.7)/6.3,0,1),lit=fp>.7&&b<1,A=[150,172],B=[440,262],Pt=u=>[B[0]+(A[0]-B[0])*u*.82,B[1]+(A[1]-B[1])*u*.82],[px,py]=Pt(b);
    let h=PT_DEFS+T(30,44,'第 2 族　鹼土金屬',{size:22,weight:700})+T(290,74,fp<.7?'用坩堝鉗夾住鎂帶，在酒精燈上點燃':lit?'鎂帶燃燒：發出強烈的白光（不可直視）':'燒完後留下白色粉末：氧化鎂',{size:18,anchor:'middle',weight:700,fill:lit?P.red:P.ink});
    h+=`<rect x="30" y="88" width="520" height="350" rx="16" fill="#26333b"/>`;
    h+=`<ellipse cx="330" cy="408" rx="96" ry="12" fill="#dfe6ea" stroke="#9aa9b1" stroke-width="2"/><ellipse cx="330" cy="405" rx="80" ry="8" fill="#c9d3d9"/>`;
    /* 氧化鎂粉末 */
    const N=26,cnt=Math.floor(b*N+1e-6);for(let i=0;i<cnt;i++){const age=(fp-.7)-i/N*6.3,[sx,sy]=Pt(i/N),tx=330+(rnd(i+4)-.5)*120,ty=402-rnd(i+2)*9,f=clamp(age/.8,0,1),x=sx+(tx-sx)*f,y=sy+(ty-sy)*f*f;h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3+rnd(i)*3).toFixed(1)}" fill="#f6f8f9" stroke="#cfd8dd" stroke-width=".8"/>`;}
    if(b<1)h+=L(A[0],A[1],px,py,{stroke:'#b7bec4',w:8})+L(A[0]+2,A[1]-2,px,py-2.5,{stroke:'#eef1f3',w:2});
    h+=L(48,122,160,178,{stroke:'#8d99a3',w:6})+L(66,104,156,168,{stroke:'#aab5bd',w:6})+`<circle cx="100" cy="132" r="5" fill="#5c6770"/>`;
    if(lit){const fk=.86+.14*Math.sin(s.t*23);h+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(130*fk).toFixed(1)}" fill="url(#ptWhite)"/>`;for(let i=0;i<14;i++){const a=rad(i*360/14+s.t*20),r2=64+16*Math.sin(s.t*9+i*2);h+=L(px+24*Math.cos(a),py+24*Math.sin(a),px+r2*Math.cos(a),py+r2*Math.sin(a),{stroke:'#ffffff',w:3,op:.75});}h+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="13" fill="#fff"/>`;}
    h+=T(206,160,'鎂帶（銀白色）',{size:15,fill:'#dfe7ea'})+T(470,392,'氧化鎂',{size:15,fill:'#fff',weight:700})+T(470,412,'白色粉末',{size:14,fill:'#dfe7ea'});
    h+=T(290,468,'鎂 ＋ 氧 → 氧化鎂',{size:18,anchor:'middle',weight:700});
    h+=ptFamSide(2,[3,4],3,'第 2 族：鹼土金屬',['鈹、鎂、鈣、鍶、鋇、鐳','都是銀白色的金屬','活性比同週期的鹼金屬小','鎂帶燃燒發出強烈白光，','　生成白色的氧化鎂','鈣和水反應產生氫氣，','　水溶液呈鹼性，但比鈉緩和','鎂用於煙火和質輕的合金'],184);
    return {svg:h,reads:[['金屬','鎂（第 3 週期、第 2 族）'],['燃燒進度',fp<.7?'還沒點燃':b<1?Math.round(b*100)+'%':'燒完了'],['產物','氧化鎂（白色粉末）']],
      note:'鎂帶在空氣中燃燒，發出<b>強烈白光</b>，生成白色的<b>氧化鎂</b>。強光會傷眼睛，實驗時不可直視。<br>鎂、鈣同在第 2 族（鹼土金屬），化學性質相似。'};},
  fHal(s){const sel=clamp(s.hsel,0,3),IT=[['氟','F','淡黃色','氣體','#efe58a',.5,'活性最大的非金屬；牙膏裡的氟化物可以預防蛀牙。'],['氯','Cl','黃綠色','氣體','#c3d95f',.62,'有毒的氣體；自來水和游泳池用氯消毒，也用於漂白。'],['溴','Br','暗紅色','液體','#7a1c14',1,'常溫下唯一呈液態的非金屬，容易揮發成紅棕色氣體。'],['碘','I','紫黑色','固體','#43305a',1,'紫黑色固體；溶在酒精裡就是碘酒，可以消毒。']];
    let h=PT_DEFS+T(30,44,'第 17 族　鹵素',{size:22,weight:700})+T(30,72,'點一種看說明。由上到下，狀態和顏色怎麼變？',{size:15,fill:P.muted});
    h+=L(60,112,516,112,{stroke:P.accent,w:3,arrow:true})+T(288,102,'原子序增加：氣體 → 液體 → 固體，顏色越來越深',{size:15,anchor:'middle',fill:P.accent,weight:700});
    IT.forEach(([n,sy,cn,st,col,op],j)=>{const cx=95+j*130,on=j===sel;let g=`<rect x="${cx-60}" y="126" width="120" height="312" rx="14" fill="${on?'#e2f3f0':'#fffdf8'}" stroke="${on?P.accent:'#ddd7c9'}" stroke-width="${on?3:1.5}"/>`;
      if(j<2){g+=`<rect x="${cx-39}" y="166" width="78" height="170" rx="8" fill="${col}" opacity="${op}"/>`;for(let i=0;i<10;i++){const a=s.t*(.5+rnd(i+j*20)*.6)+rnd(i+j*20+5)*6.28;g+=`<circle cx="${(cx+(rnd(i+j*20+1)-.5)*56+5*Math.cos(a)).toFixed(1)}" cy="${(250+(rnd(i+j*20+2)-.5)*140+5*Math.sin(a*1.3)).toFixed(1)}" r="2.2" fill="${ptMix(col,'#6b6b10',.4)}" opacity=".4"/>`;}
        g+=`<path d="M${cx-42} 162V328Q${cx-42} 340 ${cx-30} 340H${cx+30}Q${cx+42} 340 ${cx+42} 328V162" fill="none" stroke="#83999d" stroke-width="3.5" stroke-linecap="round"/><rect x="${cx-50}" y="152" width="100" height="9" rx="3" fill="#cfe0e5" stroke="#83999d" stroke-width="1.5"/><path d="M${cx-33} 176V318" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;}
      else if(j===2){g+=`<path d="M${cx-14} 176H${cx+14}V214Q${cx+40} 224 ${cx+40} 248V326Q${cx+40} 340 ${cx+26} 340H${cx-26}Q${cx-40} 340 ${cx-40} 326V248Q${cx-40} 224 ${cx-14} 214Z" fill="#b5452f" fill-opacity=".3" stroke="#83999d" stroke-width="3.5" stroke-linejoin="round"/><path d="M${cx-37} 292H${cx+37}V326Q${cx+37} 337 ${cx+26} 337H${cx-26}Q${cx-37} 337 ${cx-37} 326Z" fill="${col}"/><rect x="${cx-18}" y="160" width="36" height="18" rx="5" fill="#c9a877" stroke="#8a6238"/><path d="M${cx-30} 250V320" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;}
      else{g+=`<ellipse cx="${cx}" cy="332" rx="50" ry="9" fill="#eef6f8" stroke="#83999d" stroke-width="2.5"/>`;for(let i=0;i<11;i++){const x=cx+(rnd(i+60)-.5)*66,y=326-rnd(i+70)*14,r=5+rnd(i+80)*6;g+=`<path d="M${(x-r).toFixed(1)} ${(y+r*.5).toFixed(1)}L${(x-r*.3).toFixed(1)} ${(y-r).toFixed(1)}L${(x+r).toFixed(1)} ${(y-r*.2).toFixed(1)}L${(x+r*.5).toFixed(1)} ${(y+r*.6).toFixed(1)}Z" fill="${i%3?col:'#5a4375'}" stroke="#2a1d3a" stroke-width="1"/>`;}}
      g+=T(cx,372,`${n}　${sy}`,{size:21,anchor:'middle',weight:700})+T(cx,398,cn,{size:16,anchor:'middle',fill:P.ink})+T(cx,422,st,{size:16,anchor:'middle',weight:700,fill:P.accent});
      h+=`<g data-tap="h:${j}" tabindex="0" role="button" aria-label="${n}" style="cursor:pointer">${g}</g>`;});
    h+=T(30,470,`${IT[sel][0]}：${IT[sel][6]}`,{size:16,weight:700});
    h+=ptFamSide(17,[2,3,4,5],sel+2,'第 17 族：鹵素',['氟、氯、溴、碘…','都是活潑的非金屬','都有顏色，也都有毒','由上到下：氣體 → 液體','　→ 固體，顏色越來越深','容易和金屬化合成鹽類，','　例如氯化鈉（食鹽）','氯：自來水消毒、漂白','碘：碘酒'],184);
    return {svg:h,reads:[['元素',`${IT[sel][0]}（${IT[sel][1]}）`],['常溫下',`${IT[sel][2]}${IT[sel][3]}`],['位置',`第 ${sel+2} 週期、第 17 族`]],
      note:'鹵素都是<b>活潑的非金屬</b>，容易和金屬化合。常溫下氟、氯是氣體，溴是液體，碘是固體。<br><b>氯</b>用於自來水消毒；食鹽（氯化鈉）是氯和鈉的化合物，性質和氯、鈉都不同。'};},
  fNoble(s){const sel=clamp(s.gsel,0,2),IT=[['氦','He','氣球、飛船','密度比空氣小，而且不可燃，比氫氣安全。'],['氖','Ne','霓虹燈','玻璃管裡的氖氣通電後，發出紅橘色的光。'],['氬','Ar','充入燈泡','化性不活潑，燈絲在氬氣中不容易燒斷。']];
    let h=PT_DEFS+T(30,44,'第 18 族　鈍氣（惰性氣體）',{size:22,weight:700})+T(30,72,'都是無色的氣體，幾乎不和其他物質反應。點一種看用途',{size:15,fill:P.muted});
    IT.forEach(([n,sy,use],j)=>{const cx=105+j*175,on=j===sel;let g=`<rect x="${cx-80}" y="96" width="160" height="340" rx="14" fill="${on?'#e2f3f0':'#fffdf8'}" stroke="${on?P.accent:'#ddd7c9'}" stroke-width="${on?3:1.5}"/>`;
      if(j===0){const by=206+7*Math.sin(s.t*1.3),sw=6*Math.sin(s.t*1.3+1);g+=`<path d="M${cx} ${(by+66).toFixed(1)}Q${(cx+14+sw).toFixed(1)} ${(by+100).toFixed(1)} ${cx} 300T${cx} 340" fill="none" stroke="#8b6a70" stroke-width="2"/><ellipse cx="${cx}" cy="${by.toFixed(1)}" rx="52" ry="62" fill="#f2a3b3" stroke="#c8697c" stroke-width="2"/><path d="M${cx-8} ${(by+61).toFixed(1)}L${cx} ${(by+72).toFixed(1)}L${cx+8} ${(by+61).toFixed(1)}Z" fill="#e48a9c" stroke="#c8697c"/><path d="M${cx-28} ${(by-34).toFixed(1)}Q${cx-40} ${(by-14).toFixed(1)} ${cx-36} ${(by+6).toFixed(1)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`+T(cx,by+8,'He',{size:24,anchor:'middle',weight:700,fill:'#fff'})+`<rect x="${cx-12}" y="338" width="24" height="10" rx="3" fill="#8d99a3"/>`;}
      else if(j===1){const gl=.8+.2*Math.sin(s.t*2.2),d=`M${cx-46} 268V196L${cx-10} 268V196M${cx+12} 240H${cx+48}Q${cx+48} 214 ${cx+30} 214T${cx+12} 240T${cx+32} 268Q${cx+44} 268 ${cx+48} 258`;
        g+=`<rect x="${cx-68}" y="160" width="136" height="150" rx="12" fill="#1f2b33"/><path d="${d}" fill="none" stroke="#ff7a52" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="${(.22*gl).toFixed(2)}"/><path d="${d}" fill="none" stroke="#ff8a63" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="${(.45*gl).toFixed(2)}"/><path d="${d}" fill="none" stroke="#ffd9cc" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx-40} 160V140M${cx+40} 160V140" stroke="#6b777e" stroke-width="3"/>`;}
      else{const gl=.85+.15*Math.sin(s.t*1.7);g+=`<circle cx="${cx}" cy="226" r="78" fill="url(#ptGlow)" opacity="${(.8*gl).toFixed(2)}"/><path d="M${cx-17} 276Q${cx-52} 256 ${cx-50} 222A50 50 0 0 1 ${cx+50} 222Q${cx+52} 256 ${cx+17} 276V298H${cx-17}Z" fill="#fff6c9" fill-opacity=".85" stroke="#8fa3a8" stroke-width="2.5" stroke-linejoin="round"/><path d="M${cx-9} 298L${cx-6} 246Q${cx} 226 ${cx+6} 246L${cx+9} 298" fill="none" stroke="#f08c1a" stroke-width="2.5"/><rect x="${cx-19}" y="296" width="38" height="30" rx="4" fill="#8d99a3"/><path d="M${cx-19} 305H${cx+19}M${cx-19} 314H${cx+19}" stroke="#6b777e" stroke-width="2"/>`+T(cx+26,216,'Ar',{size:17,anchor:'middle',weight:700,fill:'#8a6d1a'});}
      g+=T(cx,376,`${n}　${sy}`,{size:21,anchor:'middle',weight:700})+T(cx,404,use,{size:16,anchor:'middle',weight:700,fill:P.accent});
      h+=`<g data-tap="n:${j}" tabindex="0" role="button" aria-label="${n}" style="cursor:pointer">${g}</g>`;});
    h+=T(30,468,`${IT[sel][0]}：${IT[sel][3]}`,{size:16,weight:700});
    h+=ptFamSide(18,[1,2,3],sel+1,'第 18 族：鈍氣（惰性氣體）',['氦、氖、氬、氪、氙、氡','都是無色、無味的氣體','化性非常不活潑，','　幾乎不和其他物質反應','氦：填充氣球、飛船','氖：霓虹燈','氬：充入燈泡保護燈絲','空氣中約有 1% 的氬'],184);
    return {svg:h,reads:[['元素',`${IT[sel][0]}（${IT[sel][1]}）`],['用途',IT[sel][2]],['位置',`第 ${sel+1} 週期、第 18 族`]],
      note:'第 18 族的元素都是<b>無色氣體</b>，化性非常不活潑，稱為<b>鈍氣</b>（惰性氣體）。<br>用途都和「不容易反應」有關：氦不可燃，氬可以保護燈絲。'};},

  /* ---------- 5 生活中常見的元素 ---------- */
  uses(s){const qz=s.uq,Q=PT_UQ[s.uqi%PT_UQ.length],ans=Q[1],pk=s.uqp,sel=PT_E[PT_U16.includes(s.usel)?s.usel:26];let h='';
    PT_U16.forEach((z,i)=>{const e=PT_E[z],x=16+(i%4)*149,y=18+Math.floor(i/4)*116,c=PT_C[e.cat];let fill='#fffdf8',st='#d5cfc0',sw=1.5;
      if(qz){if(pk&&z===ans){fill='#cfe9d6';st='#2e8b57';sw=3;}else if(pk&&z===pk){fill='#f6d5cf';st=P.red;sw=3;}}else if(z===sel.z){fill='#e2f3f0';st=P.accent;sw=3;}
      let g=`<rect x="${x}" y="${y}" width="143" height="110" rx="12" fill="${fill}" stroke="${st}" stroke-width="${sw}"/><rect x="${x+10}" y="${y+101}" width="123" height="4" rx="2" fill="${c[1]}" opacity=".8"/>`;
      if(qz)g+=T(x+71.5,y+58,e.sym,{size:36,anchor:'middle',weight:700})+T(x+71.5,y+88,e.name,{size:20,anchor:'middle'});
      else{g+=ptIcon(z,x+10,y+10)+T(x+64,y+42,e.sym,{size:28,weight:700})+T(x+133,y+41,e.name,{size:22,anchor:'end',weight:700,fill:P.accent});g+=T(x+11,y+84,PT_UT[z],{size:15});}
      h+=`<g data-tap="u:${z}" tabindex="0" role="button" aria-label="${e.name}" style="cursor:pointer">${g}</g>`;});
    let reads,note;
    if(qz){const okc=pk===ans,ae=PT_E[ans];h+=ptPanel(622,18,262,464)+T(636,46,`配對小測驗　第 ${s.uqi%PT_UQ.length+1} / ${PT_UQ.length} 題`,{size:15,fill:P.muted})+T(636,78,'哪一種元素？',{size:16,weight:700,fill:P.accent})+ptLines(636,112,ptWrap(Q[0],11.5),{size:19,gap:28,weight:700});
      if(!pk)h+=T(636,212,'點左邊的元素卡作答',{size:15,fill:P.muted});
      else h+=T(636,212,okc?`✓ 答對了：${ae.name} ${ae.sym}`:`✗ 答案是 ${ae.name} ${ae.sym}`,{size:19,weight:700,fill:okc?'#1d6b41':P.red})+ptLines(636,242,ptWrap(PT_UD[ans],14.5).slice(0,6),{size:15,gap:22});
      h+=ptBtn('uqn',636,390,234,44,'下一題',{fill:P.accent,ink:'#fff'})+T(753,462,`答對 ${s.uqs} / ${s.uqn} 題`,{size:16,anchor:'middle',weight:700});
      reads=[['題號',`第 ${s.uqi%PT_UQ.length+1} / ${PT_UQ.length} 題`],['答對',`${s.uqs} / ${s.uqn} 題`]];note='看用途或性質，找出是哪一種元素。答完會顯示這種元素的說明。';}
    else{const e=sel,c=PT_C[e.cat];h+=ptPanel(622,18,262,238)+`<rect x="636" y="30" width="76" height="76" rx="10" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>`+T(674,81,e.sym,{size:38,anchor:'middle',weight:700})+T(724,60,e.name,{size:30,weight:700})+T(724,84,`原子序 ${e.z}`,{size:15,fill:P.muted})+T(724,104,`${PT_CATN[e.cat]}・常溫${PT_STN[e.st]}`,{size:15,fill:P.accent,weight:700})
        +ptLines(636,134,ptWrap(PT_UD[e.z],14.5).slice(0,6),{size:15,gap:22});
      h+=ptPanel(622,264,262,218)+T(636,287,'地殼中的含量（質量）',{size:15,weight:700});
      [[8,'氧',46],[14,'矽',28],[13,'鋁',8],[26,'鐵',5]].forEach(([z,n,v],k)=>{const y=296+k*21,on=z===e.z;h+=T(636,y+15,n,{size:15,weight:700,fill:on?P.accent:P.ink})+`<rect x="660" y="${y+3}" width="${v*3}" height="14" rx="4" fill="${on?P.accent:PT_C[PT_E[z].cat][1]}"/>`+T(666+v*3,y+15,`約 ${v}%`,{size:14,fill:on?P.accent:P.muted,weight:on?700:400});});
      h+=T(636,403,'空氣中的含量（體積）',{size:15,weight:700});
      [[7,'氮',78,'約 78%（4/5）'],[8,'氧',21,'約 21%（1/5）'],[18,'氬',1,'約 1%（氬、二氧化碳等）']].forEach(([z,n,v,t],k)=>{const y=411+k*21,on=z===e.z;h+=T(636,y+15,k===2?'其他':n,{size:15,weight:700,fill:on?P.accent:P.ink})+`<rect x="${k===2?674:660}" y="${y+3}" width="${Math.max(4,v*1.4)}" height="14" rx="4" fill="${on?P.accent:'#5fa67c'}"/>`+T((k===2?680:666)+Math.max(4,v*1.4),y+15,t,{size:14,fill:on?P.accent:P.muted,weight:on?700:400});});
      reads=[['元素',`${e.name}（${e.sym}）`],['類別',PT_CATN[e.cat]],['常溫狀態',PT_STN[e.st]]];
      note='<b>地殼</b>中含量：氧 ＞ 矽 ＞ 鋁 ＞ 鐵；含量最多的金屬是<b>鋁</b>，其次是鐵。<b>空氣</b>中含量最多的是<b>氮</b>（約 4/5），其次是氧（約 1/5）。<br>卡片下緣的色條：藍色是金屬、黃色是類金屬、綠色是非金屬。';}
    return {svg:h,reads,note};}
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
  if(c.type==='buttons')return `<div class="control" data-c="${i}">${lab}<div class="control-buttons">${c.items.map(([t,,o],j)=>`<button type="button" class="btn${(o&&'primary' in o?o.primary:c.primary)?' primary':''}" data-c="${i}" data-a="${j}">${t}</button>`).join('')}</div></div>`;
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
function render(){const out=cfg.render(state);if(typeof cfg.q==='function'){const qh=questionHTML();if(qh!==lastQ){setQuestion(qh);lastQ=qh;}}
  /* 重畫會換掉 SVG 裡的節點：原本用鍵盤選到的 data-tap 元素，重畫後把焦點還給同一個 id 的新元素 */
  const ae=document.activeElement,fid=ae&&svgEl.contains(ae)?ae.getAttribute('data-tap'):null;
  svgEl.innerHTML=DEFS+out.svg;
  if(fid){const again=svgEl.querySelector(`[data-tap="${CSS.escape(fid)}"]`);if(again)again.focus({preventScroll:true});}
  const hint=labEl.querySelector('.drag-hint');if(hint)hint.style.visibility=svgEl.querySelector('[data-drag]')?'':'hidden';setIf(labEl.querySelector('.readouts'),out.reads.map(([a,b])=>`<div class="readout"><span>${a}</span><b>${b}</b></div>`).join(''));setIf(labEl.querySelector('.note'),out.note||'');const task=labEl.querySelector('.task');if(task)setIf(task,taskText());setPhoto();sync();}
function taskText(){const t=typeof cfg.tasks==='function'?cfg.tasks(state):cfg.tasks?.[state[cfg.steps]];return t?`<b>試試看</b>${t}`:'';}
/* 引導版面：圖和控制項一起放進一個螢幕高度（窄螢幕改成上下排，不固定高度） */
function fitStage(){const sim=labEl.querySelector('.sim-layout');if(!sim)return;if(!labEl.classList.contains('guided')||innerWidth<=1180){sim.style.removeProperty('--fit');return;}
  sim.style.setProperty('--fit',Math.max(440,innerHeight-(sim.getBoundingClientRect().top+scrollY)-18)+'px');}
addEventListener('resize',fitStage);
/* ---------- 改了什麼：老師一調整，圖上就用大字顯示「哪個條件 → 變成什麼」 ---------- */
const ann={base:null,timer:0};
function ctlVal(c){if(c.show&&!c.show(state))return null;
  if(c.type==='range')return c.fmt?c.fmt(state):`${state[c.key]}${c.unit||''}`;
  if(c.type==='seg'){const o=c.options.find(([v])=>String(v)===String(state[c.key]));return o?o[1]:null;}
  if(c.type==='toggle')return !!state[c.key];return null;}
const snapCtl=()=>cfg.controls.map(ctlVal);
function announce(before,head,first){
  const box=labEl.querySelector('.change-toast');if(!box)return;if(!ann.base)ann.base=before;
  const now=snapCtl(),idx=now.map((v,i)=>i).filter(i=>now[i]!==null&&ann.base[i]!==null&&now[i]!==ann.base[i]&&i!==first);
  if(first!=null&&now[first]!==null)idx.unshift(first);
  const line=i=>{const c=cfg.controls[i],v=now[i];if(c.type==='toggle')return v?`✓ ${c.label}`:`✗ 取消：${c.label}`;const was=ann.base[i];return `${c.label}：${was!==null&&was!==v?`<s>${was}</s> → `:''}<b>${v}</b>`;};
  const lines=[...(head?[`<b>${head}</b>`]:[]),...idx.slice(0,head?2:3).map(line)];if(!lines.length)return;
  box.innerHTML=lines.map(l=>`<div>${l}</div>`).join('');box.classList.add('show');
  idx.forEach(i=>{const el=labEl.querySelector(`.controls .control[data-c="${i}"]`);if(el){el.classList.remove('changed');void el.offsetWidth;el.classList.add('changed');}});
  clearTimeout(ann.timer);ann.timer=setTimeout(()=>{box.classList.remove('show');ann.base=null;},2400);}
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
  thermometers:['img/thermometers.webp','各種溫度計：由左到右是液體溫度計、體溫計、電子溫度計、紅外線耳溫槍、指針式（雙金屬片）溫度計。'],
  earthermo:['img/earthermo.webp','額溫槍偵測額頭放出的<b>紅外線</b>，不必接觸皮膚就能量體溫。'],
  icebath:['img/icebath.webp','定攝氏溫標的兩個定點：<b>冰水混合物</b>（0°C）和 1 大氣壓下的<b>沸水</b>（100°C），溫度都固定不變。'],
  mixwater:['img/mixwater.webp','冷熱水混合實驗：用保麗龍杯可以減少散熱，攪拌後等溫度計讀數穩定，就是熱平衡時的溫度。'],
  stagelights:['img/stagelights.webp','舞台燈：紅、綠、藍光照在白牆上，兩兩重疊成黃、青、洋紅，三色重疊成<b>白光</b>。']};
const PHOTO_OF={
  shadow:s=>s.mode==='speed'?(s.sv==='thunder'?'lightning':null):s.mode==='pinhole'?'pinhole':null,
  mirror:s=>s.mode==='diffuse'?'lake':null,
  curved:s=>s.type===-1?'roadmirror':'makeupmirror',
  refraction:()=>'pencil',
  lens:s=>s.mode==='focus'&&s.type===1?'sunfocus':s.mode==='bench'?'bench':null,
  life:s=>({camera:'camera',proj:'projector',mag:'magnifier',scope:'microscope',myopia:'glasses',hyper:'glasses'})[s.dev]||null,
  temp:s=>s.mode==='types'?(s.kind==='ir'?'earthermo':'thermometers'):s.mode==='scale'?'icebath':null,
  heat:s=>s.mode==='mix'?'mixwater':null,
  color:s=>({prism:'prism',rainbow:'rainbow',clear:'cellophane',mix:'stagelights'})[s.mode]||null};
let lastPhoto;
function setPhoto(){const f=PHOTO_OF[current],k=f?f(state):null,fig=labEl.querySelector('.photo');if(k===lastPhoto||!fig)return;lastPhoto=k;fig.hidden=!k;if(k){fig.querySelector('img').src=PHOTOS[k][0];fig.querySelector('figcaption').innerHTML=PHOTOS[k][1];}}
function openPhoto(k){document.getElementById('info-content').innerHTML=`<img class="photo-big" src="${PHOTOS[k][0]}" alt=""><p>${PHOTOS[k][1]}</p><p class="small">插圖由 AI 生成，僅供示意。</p>`;dialog.showModal();}
function activate(key){
  if(!LABS[key])key='lens';cancelAnimationFrame(raf);audioSync(false);current=key;cfg=LABS[key];state=structuredClone(cfg.state);
  document.querySelectorAll('nav a').forEach(a=>{const on=a.dataset.key===key;a.classList.toggle('active',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
  document.getElementById('title').textContent=cfg.name;document.getElementById('subtitle').textContent=cfg.subtitle;document.title=cfg.name+'｜理化實驗室';
  /* 引導版面（4-4、4-5）：子實驗變成圖上方的分頁＋「試試看」，進階選項收進「更多選項」 */
  const si=cfg.steps?cfg.controls.findIndex(c=>c.type==='seg'&&c.key===cfg.steps):-1,st=cfg.controls[si],guided=!!(cfg.steps||cfg.tasks);
  const basic=cfg.controls.map((c,i)=>i===si||c.adv?'':controlHTML(c,i)).join(''),adv=cfg.controls.map((c,i)=>c.adv?controlHTML(c,i):'').join('');
  /* cfg.stepGroups：分頁分成幾組（例如課綱內／延伸），延伸組用字母編號 */
  const tabBtn=(j,n)=>`<button type="button" data-c="${si}" data-o="${j}"><i>${n}</i>${st.options[j][1]}</button>`,idxOf=k=>st.options.findIndex(([v])=>v===k);
  const tabs=!st?'':cfg.stepGroups?cfg.stepGroups.map(g=>`<div class="step-group${g.ext?' ext':''}"><span class="step-group-label">${g.label}</span><div class="seg" role="group" aria-label="${g.label}">${g.keys.map((k,n)=>tabBtn(idxOf(k),g.ext?String.fromCharCode(65+n):n+1)).join('')}</div></div>`).join('')
    :`<div class="seg" role="group" aria-label="${st.label}">${st.options.map((o,j)=>tabBtn(j,j+1)).join('')}</div>`;
  const top=!guided?'':`<div class="steps">${st?`<div class="control step-tabs" data-c="${si}">${tabs}</div>`:''}<p class="task"></p></div>`;
  const tail=`<div class="readouts"></div><p class="note"></p>${adv?`<details class="more"><summary>更多選項</summary>${adv}</details>`:''}<figure class="photo" hidden title="點一下放大" tabindex="0" role="button" aria-label="放大實物圖"><img alt=""><figcaption></figcaption></figure><button type="button" class="btn ghost reset">↺ 重設</button>`;
  labEl.classList.toggle('guided',guided);
  labEl.innerHTML=`${top}<div class="sim-layout"><div class="viz-panel${cfg.dark?' dark':''}"><svg id="scene" viewBox="0 0 900 500" role="img" aria-label="${cfg.name}"></svg>${guided?'<div class="change-toast" aria-live="polite"></div>':''}${cfg.drag?'<p class="drag-hint"><i></i>虛線圓圈可以直接拖曳</p>':''}</div><div class="controls">${guided?basic+tail:cfg.controls.map(controlHTML).join('')+tail}</div></div><section class="question">${lastQ=questionHTML()}</section>`;
  svgEl=labEl.querySelector('#scene');lastPhoto=undefined;ann.base=null;render();fitStage();
  if(cfg.tick){let last=0;const loop=now=>{const dt=last?Math.min((now-last)/1000,0.1):0;last=now;cfg.tick(state,dt);render();raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);}
  const act=document.querySelector('nav a.active');if(act&&matchMedia('(max-width:760px)').matches)act.scrollIntoView({block:'nearest',inline:'center'});
  else if(act){const sb=document.querySelector('.sidebar'),r=act.getBoundingClientRect(),rs=sb.getBoundingClientRect();if(r.bottom>rs.bottom||r.top<rs.top)sb.scrollTop+=r.top-rs.top-rs.height/2;}
}
labEl.addEventListener('input',e=>{const c=cfg.controls[e.target.dataset.c];if(!c)return;const before=snapCtl();if(c.type==='range')state[c.key]=+e.target.value;else if(c.type==='toggle'){state[c.key]=e.target.checked;if(c.onChange)c.onChange(state);}render();announce(before,null,+e.target.dataset.c);});
labEl.addEventListener('click',e=>{const tp=e.target.closest('[data-tap]');if(tp&&cfg.tap){if(e.detail===0){cfg.tap(state,tp.dataset.tap);render();}return;}const ph=e.target.closest('.photo');if(ph&&lastPhoto){openPhoto(lastPhoto);return;}const b=e.target.closest('button');if(!b)return;if(b.classList.contains('reset')){const keep=(cfg.keep||[]).map(k=>[k,state[k]]);activate(current);if(keep.length){for(const[k,v]of keep){state[k]=v;const c=cfg.controls.find(c=>c.key===k&&c.onChange);if(c)c.onChange(state);}render();}return;}const before=snapCtl();if(b.dataset.qa&&cfg.qAction){cfg.qAction(state,b.dataset.qa);render();announce(before,null,null);return;}const c=cfg.controls[b.dataset.c];if(!c)return;
  if(c.type==='seg'){state[c.key]=c.options[b.dataset.o][0];if(c.onChange)c.onChange(state);}else if(c.type==='buttons')c.items[b.dataset.a][1](state);else if(c.type==='counter')state[c.key][b.dataset.k]=Math.max(0,state[c.key][b.dataset.k]+ +b.dataset.d);else return;render();announce(before,c.type==='buttons'?b.textContent:null,c.type==='seg'?+b.dataset.c:null);});
labEl.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const tp=e.target.closest('[data-tap]');if(tp&&cfg.tap){e.preventDefault();const id=tp.dataset.tap;cfg.tap(state,id);render();const again=svgEl.querySelector(`[data-tap="${id}"]`);if(again)again.focus();return;}if(e.target.closest('.photo')&&lastPhoto){e.preventDefault();openPhoto(lastPhoto);}});
const svgPoint=e=>{const p=svgEl.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svgEl.getScreenCTM().inverse());};
labEl.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-drag]');if(!h||!cfg.drag||!cfg.drag[h.dataset.drag])return;e.preventDefault();drag={name:h.dataset.drag,p0:svgPoint(e),s0:structuredClone(state),before:snapCtl()};svgEl.setPointerCapture(e.pointerId);labEl.classList.add('dragging');});
labEl.addEventListener('pointermove',e=>{if(!drag)return;cfg.drag[drag.name](svgPoint(e),state,drag);if(!cfg.tick)render();announce(drag.before,null,null);});
const endDrag=()=>{drag=null;labEl.classList.remove('dragging');};labEl.addEventListener('pointerup',endDrag);labEl.addEventListener('pointercancel',endDrag);
/* 圖上可點的元素（data-tap）：有動畫的單元每一幀都重畫，按下和放開會落在不同的節點，click 找不到元素；
   所以用 pointerdown／pointerup 比對同一個 data-tap（沒移動太遠才算點一下）。鍵盤與輔助工具的 click（detail＝0）在上面處理。 */
let tapStart=null;
labEl.addEventListener('pointerdown',e=>{const tp=e.target.closest('[data-tap]');tapStart=tp&&cfg.tap?{id:tp.dataset.tap,x:e.clientX,y:e.clientY}:null;});
labEl.addEventListener('pointerup',e=>{const t=tapStart;tapStart=null;if(!t)return;const tp=e.target.closest('[data-tap]');if(!tp||tp.dataset.tap!==t.id||Math.hypot(e.clientX-t.x,e.clientY-t.y)>12)return;cfg.tap(state,t.id);render();});
labEl.addEventListener('pointercancel',()=>{tapStart=null;});

/* ---------- 頁面 ---------- */
const NAV_GROUPS=['','第一次段考','第二次段考 · 光學','第二次段考 · 溫度與熱','第三次段考 · 溫度與熱（續）','第三次段考 · 物質的基本結構'];
let nav='';[1,2,3,4,5].forEach(g=>{const list=Object.entries(LABS).filter(([,t])=>t.group===g);if(!list.length)return;nav+=`<div class="nav-group-label">${NAV_GROUPS[g]}</div>`;list.forEach(([key,t])=>{nav+=`<a href="#${key}" data-key="${key}"><span class="count" aria-hidden="true">${t.n}</span>${t.name}</a>`;});});
document.getElementById('nav').innerHTML=nav;
window.addEventListener('hashchange',()=>activate(location.hash.slice(1)));
document.getElementById('focus').onclick=()=>{const on=document.body.classList.toggle('projection');document.getElementById('focus').textContent=on?'結束投影':'投影模式';fitStage();};
const dialog=document.getElementById('info');dialog.querySelector('.close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.getElementById('guide').onclick=()=>{document.getElementById('info-content').innerHTML=`<h2>使用說明</h2><ol><li><b>先猜：</b>只改一個條件，請學生預測結果。</li><li><b>操作：</b>拖動圖中的虛線圓圈或右側控制項，驗證預測。</li><li><b>解釋：</b>對照右側數值與說明，再展開「看解釋」。</li></ol><p>4-4 以後的頁面：上方的編號分頁是各個小實驗，下面一行「試試看」告訴學生這一步要觀察什麼；每改一個條件，圖上會用大字顯示「改了什麼 → 變成什麼」，右側對應的控制項也會閃一下。不常用的開關收在「更多選項」。</p><p>「投影模式」會隱藏側欄、放大操作區。教室網路不穩時可下載離線版，雙擊 HTML 即可使用，不需安裝或帳號。</p><h3>範圍</h3><p>校方 115 學年度第一學期行事曆：第一次段考 10/5–10/6、第二次 11/25–11/26（<a href="https://www.thsh.tp.edu.tw/uploads/178591837953198rrnVIS.pdf" target="_blank" rel="noopener">行事曆</a>）。第一次範圍已核實為翰林 B3 Ch1～Ch3（<a href="https://www.thsh.tp.edu.tw/uploads/17902147214252um1mhto.pdf" target="_blank" rel="noopener">公告第 5 頁</a>）。第二次今年尚未公告，光學單元依 <a href="https://www.thsh.tp.edu.tw/uploads/1763512990199UYTfRHNp.pdf" target="_blank" rel="noopener">114 學年度第二次範圍</a>（B3 4-1～4-5）預備，另外先做了 5-1 溫度與溫度計、5-2 熱量與熱平衡。第三次範圍也還沒公告：5-3～6-5 依翰林第三冊目錄（5-3 比熱、5-4 熱對物質的影響、5-5 熱的傳播方式、6-1 元素與化合物、6-2 生活中常見的元素、6-3 原子結構、6-4 週期表、6-5 分子與化學式）預備到第三冊結束。側欄的段考分組是預估，實際範圍以學校公告為準。</p><h3>模型說明</h3><ul><li>各單元為理想模型，圖示不等於實物比例。</li><li>光學單元依講義 4-1～4-5 編排；為幾何光學，透鏡與面鏡成像採近軸近似。實線是實際光路，虛線是反向延長線。</li><li>國中不教透鏡成像公式與折射定律的 sin 式；頁面以成像規律、三條主要光線和「光速快慢」說明，公式只放在標明「延伸（高中）」的地方。</li><li>光路圖以「看得清楚」為先，不一定完全照真實比例：「透鏡成像 → 為什麼會偏折」把透鏡畫得比較厚，光在兩個表面各轉折一次（白點標出轉折處），每條平行光都畫成正好經過焦點；「焦點與焦距」「成像」用理想的薄透鏡。</li><li>「光具座實驗」紙屏上的模糊程度與燭焰影像為示意，實際操作以課本實驗步驟為準。</li><li>曲面鏡的「單束光／平行光」和課本一樣理想化：平行光反射後都正好經過焦點 F（凸面鏡是反向延長線）。</li><li>「生活中的透鏡」的照相機、投影機、放大鏡、顯微鏡與眼睛尺寸為示意比例。</li><li>溶解度曲線為常見課本數據的近似值。聲音頁預設不發聲，「多變的聲音」可自行開啟播放（請先調低音量）。</li><li>發聲體與空氣粒子的振動已放慢並放大，方便觀察；動物可聽範圍為約略值。</li><li>色光三原色用紅、綠、藍光的開關示意（螢幕上的顏色不是真實的光強度）。顏料三原色採理化常用的青、洋紅、黃（與美術課的紅黃藍不同）；真實顏料全混通常是暗褐色而非純黑。</li><li>溫度與熱：除了打開「考慮散熱」，都不計散熱與容器吸熱；熱源每分鐘 1000 cal、熱平衡的快慢、雙金屬片的彎曲程度與熱敏電阻的數值都是示意。</li><li>5-3 比熱：熱源每分鐘 1000 cal，不計散熱與容器吸熱；海陸溫度曲線與熱平衡的快慢為示意。液體 X、金屬甲、金屬乙是為了讓計算得到整數而設的假想物質。</li><li>5-4 熱對物質的影響：加熱曲線只畫到部分汽化；膨脹量與湖水溫度分布的圖示已放大；硫酸銅、暖暖包等的溫度數值為示意。</li><li>5-5 熱的傳播方式：金屬棒的溫度依熱傳導計算，其餘的時間、溫度與散熱快慢為示意，動畫已加快。</li><li>第 6 章：粒子圖、分子形狀與電解水的氣體量為示意；金屬、鑽石、食鹽不是一個個分子。原子核與粒子的大小都已放大；α 粒子散射的軌跡依電的排斥力計算，但每個 α 粒子只算遇到一個原子核；電子的排列為示意。週期表中 104 號以後元素的常溫狀態標為未確定；導熱與鹼金屬反應的時間為示意。</li><li>右側的「實物圖」是 AI 生成的示意插圖，用來連結生活與實驗器材，細節不一定與真實器材完全相同；點一下可以放大。</li><li>光路動畫的速度只是示意（真實光速約 3×10⁸ m/s）；稜鏡的色散程度有放大，方便觀察。</li></ul><p class="small">原創互動教材，不是校方公告。</p>`;dialog.showModal();};
activate(location.hash.slice(1)||'lens');
