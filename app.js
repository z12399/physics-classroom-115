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
function T(x,y,s,o={}){const{size=18,fill=P.ink,anchor='start',weight=400}=o;return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${s}</text>`;}
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
const MEDIA={air:['空氣',1.00,'#14263d'],water:['水',1.33,'#1b4560'],glass:['玻璃',1.50,'#24516b'],diamond:['鑽石',2.42,'#36497a']};
const TIMBRE={pure:['音叉',[1]],flute:['笛子',[1,.35,.12]],violin:['小提琴',[1,.55,.4,.28,.2,.12]]};
const SOUND_SPEED={air:'空氣',water:'水',steel:'鋼鐵'};
const REFLECT={apple:['紅蘋果',[1,0,0]],leaf:['綠葉',[0,1,0]],banana:['黃香蕉',[1,1,0]],paper:['白紙',[1,1,1]],cloth:['黑布',[0,0,0]]};
const LIGHTS=[['白光',[255,255,255]],['紅',[255,0,0]],['綠',[0,255,0]],['藍',[0,0,255]],['黃',[255,255,0]],['青',[0,255,255]],['洋紅',[255,0,255]],['關燈',[0,0,0]]];
function colorName(r,g,b){if(Math.max(r,g,b)<40)return '黑';const k=[r,g,b].map(v=>v>=128?1:0).join('');return {'000':'暗色','100':'紅','010':'綠','001':'藍','110':'黃','011':'青','101':'洋紅','111':'白'}[k];}

/* ---------- 光學共用：開關燈與光路前進 ---------- */
const SPECTRUM=[['紅','#ff453a'],['橙','#ff9f0a'],['黃','#ffd60a'],['綠','#32d74b'],['藍','#0a84ff'],['靛','#5e5ce6'],['紫','#bf5af2']];
const replay=s=>{s.prog=0;};
const LAMP={type:'seg',key:'on',label:'燈',options:[[true,'開燈'],[false,'關燈']],onChange:replay};
const BEAM={type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['full','全光']],onChange:replay};
const LIGHT_TICK=(s,dt)=>{if(s.on&&s.prog<30)s.prog+=dt;};
let REACH=1e9,TRACED=[];
function beginLight(s){REACH=!s.on?0:reduceMotion?1e9:s.prog*750;TRACED=[];}
/* 沿折線畫出光，只畫到目前光走到的距離 */
function ray(pts,c,o={}){const{w=3,op=1,arrow=true,delay=0}=o;let total=delay;for(let i=1;i<pts.length;i++)total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);TRACED.push(total);
  let rem=REACH-delay;if(rem<=0)return '';let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=1;i<pts.length;i++){const[a,b]=[pts[i-1],pts[i]],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(rem>=l){d+=`L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;rem-=l;}else{const t=rem/l;d+=`L${(a[0]+(b[0]-a[0])*t).toFixed(1)} ${(a[1]+(b[1]-a[1])*t).toFixed(1)}`;break;}}
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"${arrow?' marker-end="url(#arr)"':''}/>`;}
const maxTraced=()=>TRACED.length?Math.max(...TRACED.filter(l=>l<2000),0):0;
const arrived=()=>TRACED.length>0&&REACH>=maxTraced();
const fadeIn=()=>TRACED.length?clamp((REACH-maxTraced())/200,0,1):0;

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

/* ===== 05 波動 ===== */
wave:{group:1,n:'05',name:'波動與波速',subtitle:'切換橫波與縱波，追蹤一個介質點怎麼動。',
  q:['保持波速不變，把頻率加倍，波長會變成多少？','由 v = fλ，波速不變時頻率加倍，波長減半。振幅只影響振動幅度，不影響波速。'],
  state:{kind:'T',f:1,v:3,A:0.4,run:!reduceMotion,slow:false,showL:true,track:4,t:0},
  controls:[
    {type:'seg',key:'kind',label:'波的種類',options:[['T','橫波'],['L','縱波']]},
    {type:'range',key:'f',label:'頻率 f',min:0.5,max:3,step:0.1,unit:' Hz'},
    {type:'range',key:'v',label:'波速 v',min:1,max:6,step:0.5,unit:' m/s'},
    {type:'range',key:'A',label:'振幅 A',min:0.1,max:0.8,step:0.05,unit:' m'},
    {type:'seg',key:'run',label:'動畫',options:[[true,'播放'],[false,'暫停']]},
    {type:'toggle',key:'slow',label:'慢動作'},
    {type:'toggle',key:'showL',label:'標示波長'}],
  tick:(s,dt)=>{if(s.run)s.t+=dt*(s.slow?0.25:1);},
  drag:{track:(p,s)=>{s.track=+clamp((p.x-80)/75,0,10).toFixed(1);}},
  render(s){
    const lam=s.v/s.f,X=x=>80+x*75,mid=250,ph=x=>2*Math.PI*(x/lam-s.f*s.t);let h='';
    for(let x=0;x<=10;x++)h+=L(X(x),110,X(x),400,{stroke:'#e6e1d5',w:1})+T(X(x),432,x,{size:13,fill:P.muted,anchor:'middle'});
    h+=T(X(10)+14,432,'m',{size:13,fill:P.muted})+T(830,74,'傳播方向 →',{size:17,fill:P.accent,anchor:'end',weight:600});
    let markY;
    if(s.kind==='T'){
      const Y=x=>mid-s.A*120*Math.sin(ph(x));h+=L(X(0),mid,X(10),mid,{stroke:'#cfd8d2',w:2});
      let d='';for(let x=0;x<=10.001;x+=0.04)d+=(x?'L':'M')+X(x).toFixed(1)+' '+Y(x).toFixed(1);h+=`<path d="${d}" fill="none" stroke="${P.accent}" stroke-width="4"/>`;
      for(let x=0;x<=10.001;x+=0.5)h+=`<circle cx="${X(x)}" cy="${Y(x)}" r="4" fill="#fff" stroke="${P.accent}" stroke-width="2"/>`;
      const ty=Y(s.track);h+=L(X(s.track),mid-s.A*120-14,X(s.track),mid+s.A*120+14,{stroke:P.orange,w:2,dash:'4 5'})+`<circle cx="${X(s.track)}" cy="${ty}" r="10" fill="${P.orange}" stroke="#fff" stroke-width="3"/>`+handle('track',X(s.track),ty,P.orange,16);
      markY=mid-s.A*120-30;
      if(s.showL){const x0=((lam*(0.25+s.f*s.t))%lam+lam)%lam;if(x0+lam<=10)h+=lamMark(X(x0),X(x0+lam),markY,lam,P.accent);}
    }else{
      for(let r=0;r<5;r++)for(let i=0;i<=50;i++){const x0=i*0.2,px=X(x0)+s.A*18*Math.sin(ph(x0)),tr=Math.abs(x0-s.track)<0.1;h+=`<circle cx="${px.toFixed(1)}" cy="${170+r*40}" r="${tr?6:4.5}" fill="${tr?P.orange:P.accent}" opacity="${tr?1:.55}"/>`;}
      const tx=X(s.track)+s.A*18*Math.sin(ph(s.track));h+=L(X(s.track),140,X(s.track),360,{stroke:P.orange,w:1.5,dash:'4 5'})+handle('track',tx,250,P.orange,16);
      const xc=((lam*(0.5+s.f*s.t))%lam+lam)%lam;
      for(let x=xc;x<=10;x+=lam){h+=T(X(x),140,'密',{size:16,anchor:'middle',fill:P.ink,weight:700});if(x+lam/2<=10)h+=T(X(x+lam/2),140,'疏',{size:16,anchor:'middle',fill:P.muted});}
      if(s.showL&&xc+lam<=10)h+=lamMark(X(xc),X(xc+lam),395,lam,P.accent);
    }
    return {svg:h,reads:[['波長 λ',lam.toFixed(2)+' m'],['週期 T',(1/s.f).toFixed(2)+' s'],['波速 v',s.v.toFixed(1)+' m/s']],
      note:`<b>v = f × λ</b>：${s.v} = ${s.f} × ${lam.toFixed(2)}<br>橘色點只在原地${s.kind==='T'?'上下':'左右'}振動，不會跟著波前進。`};}},

/* ===== 06 聲音 ===== */
sound:{group:1,n:'06',name:'聲音與回聲',subtitle:'調整頻率、振幅和波形，看聲音的三要素；或量量回聲。',
  q:['人離牆 51 m，聲速 340 m/s，回聲往返要多久？','聲音走 102 m，時間 = 102 ÷ 340 = 0.30 s。距離 = 聲速 × 往返時間 ÷ 2。'],
  state:{mode:'tone',f:400,A:6,timbre:'pure',d:51,medium:'air',temp:15,echo:null,t:0},
  controls:[
    {type:'seg',key:'mode',label:'模式',options:[['tone','聲音三要素'],['echo','回聲測距']]},
    {type:'range',key:'f',label:'頻率 → 音調',min:100,max:1000,step:10,unit:' Hz',show:s=>s.mode==='tone'},
    {type:'range',key:'A',label:'振幅 → 響度',min:1,max:10,step:1,unit:' 格',show:s=>s.mode==='tone'},
    {type:'seg',key:'timbre',label:'波形 → 音色',options:Object.entries(TIMBRE).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='tone'},
    {type:'range',key:'d',label:'到牆的距離',min:5,max:500,step:1,unit:' m',show:s=>s.mode==='echo'},
    {type:'seg',key:'medium',label:'介質',options:Object.entries(SOUND_SPEED),show:s=>s.mode==='echo'},
    {type:'range',key:'temp',label:'氣溫',min:0,max:40,step:1,unit:' °C',show:s=>s.mode==='echo'&&s.medium==='air'},
    {type:'buttons',label:'',items:[['📢 發出聲音',s=>{s.echo=0;}]],show:s=>s.mode==='echo',primary:true}],
  tick:(s,dt)=>{s.t+=dt;if(s.echo!==null&&s.echo<2)s.echo=Math.min(2,s.echo+dt);},
  render(s){
    let h='';
    if(s.mode==='tone'){
      const hs=TIMBRE[s.timbre][1],w=x=>hs.reduce((a,c,i)=>a+c*Math.sin((i+1)*x),0);let norm=0;for(let i=0;i<200;i++)norm=Math.max(norm,Math.abs(w(i/200*2*Math.PI)));
      const X=ms=>80+ms*76,Y=y=>180-y*s.A*10/norm;
      h+=`<rect x="70" y="36" width="780" height="280" rx="12" fill="#fff" stroke="#e1ddd2"/>`+L(80,180,840,180,{stroke:'#d8d3c6',w:1});
      for(let ms=0;ms<=10;ms+=2)h+=L(X(ms),44,X(ms),308,{stroke:'#efebe2',w:1})+T(X(ms),336,ms,{size:13,fill:P.muted,anchor:'middle'});
      h+=T(848,336,'ms',{size:13,fill:P.muted});
      let d='';for(let i=0;i<=600;i++){const ms=i/60;d+=(i?'L':'M')+X(ms).toFixed(1)+' '+Y(w(2*Math.PI*s.f*ms/1000)).toFixed(1);}
      h+=`<path d="${d}" fill="none" stroke="${P.accent}" stroke-width="3"/>`;
      const per=1000/s.f;if(per<=10)h+=lamMark(X(0.25*per),X(1.25*per),66,null,P.orange,`週期 ${per.toFixed(2)} ms`);
      for(let r=0;r<3;r++)for(let i=0;i<51;i++){const x=80+i*15+s.A*1.1*Math.sin(i*s.f*0.00074*2-2*Math.PI*(s.f/1000)*(reduceMotion?0:s.t));h+=`<circle cx="${x.toFixed(1)}" cy="${380+r*24}" r="3.6" fill="${P.accent}" opacity=".5"/>`;}
      h+=T(450,470,'空氣粒子疏密（放慢 1000 倍）',{size:13,fill:P.muted,anchor:'middle'});
      const pitch=s.f<300?'低':s.f<650?'中':'高';
      return {svg:h,reads:[['音調',`${s.f} Hz（${pitch}）`],['響度',`振幅 ${s.A} 格`],['音色',TIMBRE[s.timbre][0]]],
        note:'頻率越高 → <b>音調</b>越高<br>振幅越大 → <b>響度</b>越大<br>波形不同 → <b>音色</b>不同'};
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
      note:`<b>距離 = 聲速 × 時間 ÷ 2</b><br>${num(v,0)} × ${t.toFixed(3)} ÷ 2 = ${s.d} m`};}},

/* ===== 07 影子 ===== */
shadow:{group:2,n:'07',name:'光的直進與影子',subtitle:'開燈看光怎麼走；單束光看路徑，全光看影子怎麼形成。',dark:true,
  q:['物體靠近點光源，屏幕上的影子會變大還是變小？','會變大。屏幕位置不變時，光源到物體的距離 a 減少，影子的放大倍數 D/a 增加。'],
  state:{on:true,beam:'full',prog:0,src:'point',a:60,D:200,h:40,R:15,ang:-16,edges:true},
  controls:[LAMP,BEAM,
    {type:'seg',key:'src',label:'光源',options:[['point','點光源'],['area','有大小的光源']],onChange:replay},
    {type:'range',key:'R',label:'光源大小',min:4,max:30,step:1,unit:' cm',show:s=>s.src==='area'},
    {type:'range',key:'a',label:'光源 → 物體 a',min:20,max:150,step:1,unit:' cm'},
    {type:'range',key:'D',label:'光源 → 屏幕 D',min:160,max:300,step:1,unit:' cm'},
    {type:'range',key:'h',label:'物體高度 h',min:10,max:60,step:1,unit:' cm'},
    {type:'toggle',key:'edges',label:'標出邊界光線',show:s=>s.beam==='full'}],
  tick:LIGHT_TICK,
  drag:{obj:(p,s)=>{s.a=snap('a',(p.x-100)/(700/300));},top:(p,s)=>{s.h=snap('h',2*(250-p.y)/1.6);},screen:(p,s)=>{s.D=snap('D',(p.x-100)/(700/300));},aim:(p,s)=>{s.ang=clamp(deg(Math.atan2(p.y-250,p.x-100)),-40,40);}},
  render(s){
    beginLight(s);
    const k=700/300,vy=1.6,a=Math.min(s.a,s.D-15),Dd=s.D,R=s.src==='area'?s.R:0,PX=x=>100+x*k,PY=y=>250+y*vy;
    const s1=-R,s2=R,ot=-s.h/2,ob=s.h/2,line=(y0,y1)=>x=>y0+(y1-y0)*x/a;
    const uU=line(s1,ot),uL=line(s2,ob),oU=line(s2,ot),oL=line(s1,ob),sx=PX(Dd),ox=PX(a);
    const trace=(y0,ang)=>{const dx=Math.cos(ang),dy=Math.sin(ang),ty=y0+dy*(ox-100)/dx;if(ty>=PY(ot)&&ty<=PY(ob))return{pts:[[100,y0],[ox,ty]],hit:true};return{pts:[[100,y0],[sx,y0+dy*(sx-100)/dx]],hit:false};};
    let rays='',blocked=false,spot=null;
    if(s.on&&s.beam==='single'){const t=trace(250,rad(s.ang));blocked=t.hit;rays+=ray(t.pts,'#ffe8a5',{w:3.5});if(!t.hit)spot=t.pts[1];}
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
    if(s.beam==='single')reads=[['這束光',!s.on?'—':blocked?'被物體擋住':'照到屏幕'],...reads];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:s.beam==='single'?'光在同一介質中<b>沿直線</b>前進。拖動光束旁的圓圈改變方向。':R>0?'光源有大小 → 完全照不到的<b>本影</b>＋部分照到的<b>半影</b>':`被擋住的光到不了屏幕 → 影子。<b>H / h = D / a</b>`};}},

/* ===== 08 平面鏡 ===== */
mirror:{group:2,n:'08',name:'反射與平面鏡',subtitle:'開燈照亮物體；單束光看反射定律，全光看像怎麼出現。',dark:true,
  q:['物體向鏡面靠近 10 cm，物與像的距離改變多少？','像也向鏡面靠近 10 cm，所以物與像的距離減少 20 cm。'],
  state:{on:true,beam:'full',prog:0,d:55,h:60,ex:80,ey:110,eye:true,ext:true,hit:170},
  controls:[LAMP,BEAM,
    {type:'range',key:'d',label:'物距',min:15,max:110,step:1,unit:' cm'},
    {type:'range',key:'h',label:'物體高度',min:20,max:100,step:1,unit:' cm'},
    {type:'toggle',key:'eye',label:'進入眼睛的光線',show:s=>s.beam==='full'},
    {type:'toggle',key:'ext',label:'反向延長線'}],
  tick:LIGHT_TICK,
  drag:{obj:(p,s)=>{s.d=snap('d',(450-p.x)/3);},img:(p,s)=>{s.d=snap('d',(p.x-450)/3);},top:(p,s)=>{s.h=snap('h',(400-p.y)/2.6);},eye:(p,s)=>{s.ex=clamp(p.x,40,420);s.ey=clamp(p.y,40,440);},hit:(p,s)=>{s.hit=clamp(p.y,50,430);}},
  render(s){
    beginLight(s);
    const mx=450,ox=mx-s.d*3,ix=mx+s.d*3,base=400,top=base-s.h*2.6,refl=(Y,hy)=>{const dx=mx-ox,k=(mx-30)/dx;return[mx-dx*k,hy+(hy-Y)*k];};
    let h=`<rect x="450" y="40" width="12" height="400" fill="#72dbe6" opacity=".3"/>`+L(mx,40,mx,440,{stroke:D.ray,w:4})+T(mx,30,'平面鏡',{size:17,fill:D.ray,anchor:'middle'});
    let rays='',exts=[],ang=deg(Math.atan(Math.abs(s.hit-top)/(mx-ox)));
    if(s.on&&s.beam==='single'){rays+=ray([[ox,top],[mx,s.hit],refl(top,s.hit)],D.object,{w:3.5});exts.push([mx,s.hit,ix,top,D.object]);}
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
    const reads=s.beam==='single'?[['入射角 = 反射角',`${ang.toFixed(0)}°`],['物距 = 像距',`${s.d} cm`],['像的性質','正立・等大・虛像']]:[['物距 = 像距',`${s.d} cm`],['物與像的距離',`${s.d*2} cm`],['像的性質','正立・等大・虛像']];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads,
      note:s.beam==='single'?'<b>入射角 = 反射角</b>（從法線量起）。拖動鏡面上的圓圈換一條光線。':'所有反射光的<b>反向延長線</b>都交在同一點 → 虛像。'};}},

/* ===== 09 折射 ===== */
refraction:{group:2,n:'09',name:'折射與全反射',subtitle:'單束光看折射角；全光從一點發光，找出全反射從哪裡開始。',dark:true,
  q:['光由水射向空氣，一定會折射出去嗎？','不一定。由折射率大的介質射向折射率小的介質，入射角大於臨界角時，就發生全反射。'],
  state:{on:true,beam:'single',prog:0,m1:'air',m2:'water',a:40,sx:330,sy:120},
  controls:[LAMP,BEAM,
    {type:'seg',key:'m1',label:'上方介質（光從這裡來）',options:Object.entries(MEDIA).map(([k,v])=>[k,v[0]]),onChange:replay},
    {type:'seg',key:'m2',label:'下方介質',options:Object.entries(MEDIA).map(([k,v])=>[k,v[0]]),onChange:replay},
    {type:'buttons',label:'',items:[['⇅ 上下互換',s=>{[s.m1,s.m2]=[s.m2,s.m1];s.prog=0;}]]},
    {type:'range',key:'a',label:'入射角 θ₁',min:0,max:89,step:1,unit:'°',show:s=>s.beam==='single'}],
  tick:LIGHT_TICK,
  drag:{ray:(p,s)=>{const dx=450-p.x,dy=250-p.y;s.a=dy<=0?89:snap('a',deg(Math.atan2(Math.max(0,dx),dy)));},src:(p,s)=>{s.sx=clamp(p.x,40,860);s.sy=clamp(p.y,40,225);}},
  render(s){
    beginLight(s);
    const[n1Name,n1,c1]=MEDIA[s.m1],[n2Name,n2,c2]=MEDIA[s.m2],cx=450,cy=250,Ln=210,crit=n1>n2?deg(Math.asin(n2/n1)):null;
    let h=`<rect x="10" y="10" width="880" height="240" fill="${c1}"/><rect x="10" y="250" width="880" height="232" fill="${c2}"/>`+L(10,cy,890,cy,{stroke:'#d7edff',w:2});
    h+=T(30,52,`${n1Name}　n = ${n1.toFixed(2)}`,{size:19,fill:D.ink,weight:600})+T(30,462,`${n2Name}　n = ${n2.toFixed(2)}`,{size:19,fill:D.ink,weight:600});
    const bend=inc=>{const q=n1*Math.sin(inc)/n2;return q>1+1e-12?null:Math.asin(Math.min(1,q));};
    if(s.beam==='single'){
      const a=rad(s.a),b=bend(a),tir=b===null,sx=cx-Ln*Math.sin(a),sy=cy-Ln*Math.cos(a);
      h+=L(cx,30,cx,470,{stroke:D.muted,w:2,dash:true})+T(cx+12,46,'法線',{size:16,fill:D.muted});
      if(crit!==null){const cr=rad(crit);h+=L(cx,cy,cx-Ln*Math.sin(cr),cy-Ln*Math.cos(cr),{stroke:'#ffffff',w:1.5,dash:'3 6',op:.5})+T(cx-(Ln+12)*Math.sin(cr),cy-(Ln+12)*Math.cos(cr),`臨界角 ${crit.toFixed(1)}°`,{size:14,fill:D.muted,anchor:'end'});}
      if(s.on){h+=ray([[sx,sy],[cx,cy],[cx+Ln*Math.sin(a),cy-Ln*Math.cos(a)]],D.second,{w:tir?4:2.5,op:tir?1:.55});if(!tir)h+=ray([[sx,sy],[cx,cy],[cx+Ln*Math.sin(b),cy+Ln*Math.cos(b)]],D.ray,{w:4});else h+=ray([[sx,sy],[cx,cy]],D.object,{w:4});}
      const arc=(r,st,en,c)=>`<path d="M${cx+r*Math.cos(st)} ${cy+r*Math.sin(st)}A${r} ${r} 0 0 1 ${cx+r*Math.cos(en)} ${cy+r*Math.sin(en)}" fill="none" stroke="${c}" stroke-width="2"/>`;
      if(s.on&&arrived()){if(s.a>0)h+=arc(64,-Math.PI/2-a,-Math.PI/2,D.object);h+=T(cx-110,cy-80,`${s.a}°`,{size:19,fill:D.object,anchor:'end'});
        if(!tir){if(b>0.001)h+=arc(70,Math.PI/2-b,Math.PI/2,D.ray);h+=T(cx+90,cy+120,`${deg(b).toFixed(1)}°`,{size:19,fill:D.ray});}else h+=T(cx+60,cy+110,'全反射：沒有折射光',{size:22,fill:D.object,weight:700});}
      h+=`<circle cx="${sx}" cy="${sy}" r="8" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+handle('ray',sx,sy,D.object);
      const path=!s.on?'—':tir?'全反射':s.a===0?'垂直入射，不偏折':n2>n1?'偏向法線':n2<n1?'偏離法線':'不偏折';
      return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['入射角',`${s.a}°`],['折射角',tir?'—':`${deg(b).toFixed(1)}°`],['臨界角',crit===null?'不會全反射':`${crit.toFixed(1)}°`],['光的路徑',path]],
        note:tir?`n₁ ＞ n₂ 且入射角 ＞ 臨界角 → <b>全反射</b>`:`<b>n₁ sin θ₁ = n₂ sin θ₂</b><br>${n1.toFixed(2)} × sin ${s.a}° = ${n2.toFixed(2)} × sin ${deg(b).toFixed(1)}°`};
    }
    let nOut=0,nTir=0;
    if(s.on)for(let d=-80;d<=80;d+=4){const th=rad(d),hx=s.sx+(cy-s.sy)*Math.tan(th),sg=Math.sign(d),inc=Math.abs(th),b=bend(inc);if(hx<-200||hx>1100)continue;
      const up=[hx+Math.sin(th)*(cy-10)/Math.cos(th),10];
      if(b===null){nTir++;h+=ray([[s.sx,s.sy],[hx,cy],up],D.object,{w:1.8,op:.9,arrow:false});}
      else{nOut++;h+=ray([[s.sx,s.sy],[hx,cy],up],D.second,{w:1.2,op:.18,arrow:false})+ray([[s.sx,s.sy],[hx,cy],[hx+sg*Math.tan(b)*(480-cy),480]],D.ray,{w:1.8,op:.8,arrow:false});}}
    h+=`<circle cx="${s.sx}" cy="${s.sy}" r="10" fill="${s.on?'#ffe8a5':'#56606e'}"/>`+(s.on?`<circle cx="${s.sx}" cy="${s.sy}" r="24" fill="#ffe8a5" opacity=".25"/>`:'')+handle('src',s.sx,s.sy,D.object,16);
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['臨界角',crit===null?'不會全反射':`${crit.toFixed(1)}°`],['折射出去',s.on?`${nOut} 條`:'—'],['全反射（黃）',s.on?`${nTir} 條`:'—']],
      note:crit===null?'光從 n 小進入 n 大：每一條都能折射進去，而且<b>偏向法線</b>。':'越斜的光入射角越大；超過<b>臨界角</b>的光（黃色）全部反射回來。拖動光源試試。'};}},

/* ===== 10 透鏡 ===== */
lens:{group:2,n:'10',name:'透鏡與成像',subtitle:'開燈看光穿過透鏡；單束光、三條主要光線或全光，比較像怎麼形成。',dark:true,
  q:['凸透鏡的物體放在焦點內，像能接在屏幕上嗎？','不能。折射光發散，只有反向延長線相交，形成正立放大的虛像；屏幕接不到虛像。物體恰在焦點上時，折射光平行，不成像。'],
  state:{on:true,beam:'main',prog:0,type:1,f:80,u:200,oh:30,aim:20},
  controls:[LAMP,
    {type:'seg',key:'beam',label:'光線',options:[['single','單束光'],['main','主要光線'],['full','全光']],onChange:replay},
    {type:'seg',key:'type',label:'透鏡',options:[[1,'凸透鏡'],[-1,'凹透鏡']],onChange:replay},
    {type:'range',key:'u',label:'物距 u',min:20,max:360,step:1,unit:' cm'},
    {type:'range',key:'f',label:'焦距 |f|',min:40,max:140,step:1,unit:' cm'},
    {type:'range',key:'oh',label:'物高',min:10,max:50,step:1,unit:' cm'},
    {type:'buttons',label:'跳到關鍵位置',items:[['u > 2f',s=>{s.u=snap('u',s.f*2.6);}],['u = 2f',s=>{s.u=snap('u',s.f*2);}],['f < u < 2f',s=>{s.u=snap('u',s.f*1.5);}],['u = f',s=>{s.u=snap('u',s.f);}],['u < f',s=>{s.u=snap('u',s.f*0.55);}]],show:s=>s.type===1}],
  tick:LIGHT_TICK,
  drag:{obj:(p,s)=>{s.u=snap('u',(450-p.x)/1.15);},top:(p,s)=>{s.oh=snap('oh',(250-p.y)/2.4);},aim:(p,s)=>{s.aim=clamp((250-p.y)/2.4,-76,76);}},
  render(s){
    beginLight(s);
    const f=s.type*s.f,u=s.u,oh=s.oh,inf=Math.abs(u-f)<1e-9,v=inf?null:f*u/(u-f),m=inf?null:-v/u,cx=450,cy=250,X=x=>cx+x*1.15,Y=y=>cy-y*2.4,E=440/1.15;
    const P=([x,y])=>[X(x),Y(y)],outEnd=yh=>[E,yh+(inf?-oh/u:(m*oh-yh)/v)*E];
    let h=L(15,cy,885,cy,{stroke:D.muted,w:1.5,dash:true});
    for(const sg of[-1,1])for(const k of[1,2]){const x=X(sg*k*s.f);h+=L(x,cy-7,x,cy+7,{stroke:D.muted,w:2})+T(x,cy+28,`${k===2?'2':''}F`,{size:15,fill:D.muted,anchor:'middle'});}
    h+=s.type===1?`<path d="M450 60Q490 250 450 440Q410 250 450 60" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`:`<path d="M426 60Q462 250 426 440L474 440Q438 250 474 60Z" fill="#61ddeb22" stroke="${D.ray}" stroke-width="3"/>`;
    const hits=[];
    if(s.on){
      if(s.beam==='single')hits.push([s.aim,D.object,3.5,true]);
      else if(s.beam==='main'){hits.push([oh,D.ray,3,true],[0,D.second,3,true]);const y3=inf?null:f*oh/(f-u);if(!inf&&Math.abs(y3)<400)hits.push([y3,D.third,3,true]);}
      else for(let i=0;i<11;i++)hits.push([-72+i*14.4,'#ffe8a5',1.8,false]);
      for(const[yh,c,w,arrow]of hits){h+=ray([P([-u,oh]),P([0,yh]),P(outEnd(yh))],c,{w,arrow,op:s.beam==='full'?.8:1});}
    }
    const fade=fadeIn(),onStage=!inf&&X(v)>20&&X(v)<880;
    if(fade>0&&!inf&&v<0)for(const[yh,c]of hits)h+=L(X(0),Y(yh),X(v),Y(m*oh),{stroke:c,w:1.6,dash:'7 6',op:.85*fade});
    if(fade>0&&onStage)h+=`<g opacity="${fade}">${vArrow(X(v),cy,Y(m*oh),D.image,{dash:v<0?'7 6':false})}${T(X(v),Y(m*oh)+(m<0?30:-16),v>0?'實像':'虛像',{size:20,fill:D.image,anchor:'middle',weight:600})}</g>`;
    h+=`<g opacity="${s.on?1:.35}">${vArrow(X(-u),cy,Y(oh),D.object)}</g>`+T(X(-u),Y(oh)-18,'物',{size:20,fill:D.object,anchor:'middle'})+handle('obj',X(-u),cy,D.object)+handle('top',X(-u),Y(oh),D.object,10);
    if(s.on&&s.beam==='single')h+=handle('aim',X(0),Y(s.aim),D.object,11);
    if(!s.on)h+=T(450,480,'按「開燈」讓物體發出光線',{size:18,fill:D.muted,anchor:'middle'});
    else if(fade>0&&inf)h+=T(450,480,'物體在焦點上：折射光平行，不成像',{size:19,fill:D.object,anchor:'middle'});else if(fade>0&&!onStage)h+=T(450,480,'像在畫面外，請看右側像距',{size:18,fill:D.image,anchor:'middle'});
    const prop=inf?'不成像':`${v>0?'實像・倒立':'虛像・正立'}・${Math.abs(Math.abs(m)-1)<1e-6?'等大':Math.abs(m)>1?'放大':'縮小'}`;
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:[['像距 v',inf?'無窮遠':`${num(v)} cm`],['放大率',inf?'—':`${num(Math.abs(m),2)} 倍`],['成像',prop]],
      note:s.beam==='single'?'物體上同一點發出的光，穿過透鏡後都會經過（或延長經過）<b>同一個像點</b>。拖動透鏡上的圓圈試試。':s.beam==='full'?'整片光線會聚（或延長會聚）在同一點 → 像。':inf?'物在焦點 → 不成像':`<b>1/f = 1/u + 1/v</b><br>1/${f<0?`(${f})`:f} = 1/${u} + 1/${v<0?`(${num(v)})`:num(v)}`};}},

/* ===== 11 顏色 ===== */
color:{group:2,n:'11',name:'光與顏色',subtitle:'開燈混合色光、照射物體，或讓白光穿過稜鏡。',dark:true,
  q:['紅光和綠光相加，會變成哪種光？紅蘋果在綠光下是什麼顏色？','紅光＋綠光是黃光。紅蘋果只反射紅光，綠光下沒有紅光可反射，所以看起來是黑色。'],
  state:{on:true,prog:0,mode:'mix',r:255,g:255,b:0,obj:'apple',beam:'full',hue:3},
  controls:[LAMP,
    {type:'seg',key:'mode',label:'模式',options:[['mix','色光混合'],['object','照物體'],['prism','稜鏡色散']],onChange:replay},
    {type:'seg',key:'beam',label:'光線',options:[['full','白光（全光）'],['single','單色光']],show:s=>s.mode==='prism',onChange:replay},
    {type:'seg',key:'hue',label:'色光',options:SPECTRUM.map(([n],i)=>[i,n]),show:s=>s.mode==='prism'&&s.beam==='single',onChange:replay},
    {type:'seg',key:'obj',label:'物體',options:Object.entries(REFLECT).map(([k,v])=>[k,v[0]]),show:s=>s.mode==='object'},
    {type:'buttons',label:'光的顏色',items:LIGHTS.map(([n,c])=>[n,s=>{[s.r,s.g,s.b]=c;}]),show:s=>s.mode!=='prism'},
    {type:'range',key:'r',label:'紅光 R',min:0,max:255,step:1,show:s=>s.mode!=='prism'},
    {type:'range',key:'g',label:'綠光 G',min:0,max:255,step:1,show:s=>s.mode!=='prism'},
    {type:'range',key:'b',label:'藍光 B',min:0,max:255,step:1,show:s=>s.mode!=='prism'}],
  tick:LIGHT_TICK,
  render(s){
    beginLight(s);
    const[r,g,b]=s.on?[s.r,s.g,s.b]:[0,0,0];let h;
    if(s.mode==='mix'){
      const lamps=[[60,60,250,200,'255,60,60',r,'R'],[570,60,380,200,'60,255,90',g,'G'],[315,470,315,312,'80,140,255',b,'B']];
      h=`<rect x="35" y="30" width="550" height="440" rx="22" fill="#05080d"/>`;
      const vis=lamps.map(([x0,y0,x1,y1])=>clamp((REACH-Math.hypot(x1-x0,y1-y0))/200,0,1));
      const[vr,vg,vb]=vis;h+=`<g style="isolation:isolate"><circle cx="250" cy="200" r="130" fill="rgb(${Math.round(r*vr)},0,0)"/><circle cx="380" cy="200" r="130" fill="rgb(0,${Math.round(g*vg)},0)" style="mix-blend-mode:screen"/><circle cx="315" cy="312" r="130" fill="rgb(0,0,${Math.round(b*vb)})" style="mix-blend-mode:screen"/></g>`;
      lamps.forEach(([x0,y0,x1,y1,c,val,lab])=>{if(val>0)h+=ray([[x0,y0],[x1,y1]],`rgb(${c})`,{w:6,op:.85});h+=`<circle cx="${x0}" cy="${y0}" r="16" fill="${val>0?`rgb(${c})`:'#3a4250'}" stroke="#ffffff55" stroke-width="2"/>`+T(x0,y0+6,lab,{size:15,fill:'#05080d',anchor:'middle',weight:700});});
      const done=Math.min(...vis.map((v,i)=>[r,g,b][i]>0?v:1)),[mr,mg,mb]=done>=1?[r,g,b]:[0,0,0];
      h+=T(735,72,'重疊後的顏色',{size:18,fill:D.muted,anchor:'middle'})+`<rect x="635" y="95" width="200" height="170" rx="20" fill="rgb(${mr},${mg},${mb})" stroke="#ffffff33"/>`+T(735,305,!s.on?'沒有光':colorName(mr,mg,mb)+'光',{size:30,fill:D.ink,anchor:'middle',weight:700});
      h+=T(735,370,'紅 + 綠 = 黃',{size:17,fill:D.muted,anchor:'middle'})+T(735,400,'綠 + 藍 = 青',{size:17,fill:D.muted,anchor:'middle'})+T(735,430,'紅 + 藍 = 洋紅',{size:17,fill:D.muted,anchor:'middle'});
      return {svg:h,reads:[['紅 R',r],['綠 G',g],['藍 B',b],['看到',s.on?colorName(r,g,b)+'光':'—']],note:'光的三原色相加會<b>更亮</b>（加色）；三色等量相加 = 白光。'};
    }
    if(s.mode==='object'){
      const[oname,ref]=REFLECT[s.obj],reach=s.on?REACH:0,lit=clamp((reach-250)/150,0,1),pr=Math.round(r*ref[0]*lit),pg=Math.round(g*ref[1]*lit),pb=Math.round(b*ref[2]*lit);
      const shape=(c,stroke='#ffffff40')=>({apple:`<circle cx="0" cy="0" r="62" fill="${c}" stroke="${stroke}" stroke-width="2"/><path d="M0 -58Q4 -80 18 -88" stroke="#5b4026" stroke-width="7" fill="none" stroke-linecap="round"/>`,
        leaf:`<path d="M-90 25Q-20 -95 90 -25Q20 75 -90 25Z" fill="${c}" stroke="${stroke}" stroke-width="2"/><path d="M-80 22Q0 -10 80 -22" stroke="#00000040" stroke-width="3" fill="none"/>`,
        banana:`<path d="M-95 -30Q0 80 95 -35Q86 -12 74 -6Q0 42 -84 -40Z" fill="${c}" stroke="${stroke}" stroke-width="2"/>`,
        paper:`<rect x="-62" y="-80" width="124" height="160" rx="4" fill="${c}" stroke="${stroke}" stroke-width="2"/>`,
        cloth:`<path d="M-80 -70Q-40 -82 0 -70T80 -70V70Q40 82 0 70T-80 70Z" fill="${c}" stroke="${stroke}" stroke-width="2"/>`})[s.obj];
      const len=Math.min(reach,380),w=len/380*220;
      h=`<rect x="20" y="20" width="560" height="460" rx="20" fill="#05080d"/>`;
      if(len>0&&(r||g||b))h+=`<polygon points="270,40 330,40 ${300+w},${40+len} ${300-w},${40+len}" fill="rgb(${r},${g},${b})" opacity=".22"/>`+(len>=380?`<ellipse cx="300" cy="420" rx="220" ry="34" fill="rgb(${r},${g},${b})" opacity=".35"/>`:'');
      h+=`<rect x="262" y="24" width="76" height="22" rx="6" fill="${s.on?'#c9d3df':'#5a6573'}"/><g transform="translate(300 330)">${shape(`rgb(${pr},${pg},${pb})`)}</g>`;
      h+=T(735,70,'白光下',{size:17,fill:D.muted,anchor:'middle'})+`<g transform="translate(735 160) scale(.7)">${shape(`rgb(${ref.map(v=>v*255).join(',')})`)}</g>`+T(735,262,oname,{size:18,fill:D.ink,anchor:'middle'});
      h+=T(735,330,'現在看起來',{size:17,fill:D.muted,anchor:'middle'})+T(735,375,colorName(pr,pg,pb)+'色',{size:32,fill:D.ink,anchor:'middle',weight:700});
      return {svg:h,reads:[['照射的光',s.on?colorName(r,g,b)+'光':'沒有光'],['物體會反射',ref[0]&&ref[1]&&ref[2]?'所有色光':ref.some(Boolean)?['紅','綠','藍'].filter((_,i)=>ref[i]).join('、')+'光':'幾乎不反射'],['看起來',colorName(pr,pg,pb)+'色']],
        note:'物體只<b>反射</b>和自己同色的光，其餘被吸收；沒有光可反射 → 看起來是黑色。'};
    }
    /* 稜鏡：真實 Snell 定律，色散程度放大以便觀察 */
    const A=[450,96.8],B=[300,356.6],C=[600,356.6],src=[40,420],H=[B[0]+0.45*(A[0]-B[0]),B[1]+0.45*(A[1]-B[1])];
    const norm=v=>{const l=Math.hypot(v[0],v[1]);return[v[0]/l,v[1]/l];},d0=norm([H[0]-src[0],H[1]-src[1]]);
    const refr=(d,nr,n1,n2)=>{const ci=-(nr[0]*d[0]+nr[1]*d[1]),k=n1/n2,t=1-k*k*(1-ci*ci);if(t<0)return null;const c=k*ci-Math.sqrt(t);return[k*d[0]+c*nr[0],k*d[1]+c*nr[1]];};
    const hitFace=(p,d,a,b2)=>{const ex=b2[0]-a[0],ey=b2[1]-a[1],den=d[0]*ey-d[1]*ex,t=((a[0]-p[0])*ey-(a[1]-p[1])*ex)/den;return[p[0]+d[0]*t,p[1]+d[1]*t];};
    const list=s.beam==='full'?SPECTRUM.map((c,i)=>i):[s.hue];
    h=`<polygon points="${A} ${B} ${C}" fill="#9fd8ff22" stroke="#bfe6ff" stroke-width="2.5"/><rect x="852" y="40" width="18" height="420" rx="4" fill="#3a4554"/>`+T(861,30,'屏幕',{size:15,fill:D.muted,anchor:'middle'});
    const inC=s.beam==='full'?'#ffffff':SPECTRUM[s.hue][1];
    if(s.on)h+=ray([src,H],inC,{w:4,arrow:false});
    const spots=[];
    for(const i of list){const n=1.50+i*0.02,c=SPECTRUM[i][1],d1=refr(d0,[-0.866,-0.5],1,n),P2=hitFace(H,d1,A,C),d2=refr(d1,[-0.866,0.5],n,1);if(!d2)continue;const t=(852-P2[0])/d2[0],P3=[852,P2[1]+d2[1]*t];spots.push([P3[1],c,SPECTRUM[i][0]]);
      if(s.on)h+=ray([H,P2,P3],c,{w:s.beam==='full'?2.2:3.5,arrow:false,op:.95,delay:Math.hypot(H[0]-src[0],H[1]-src[1])});}
    if(s.on&&arrived())spots.forEach(([y,c,n],j)=>{h+=`<rect x="852" y="${y-6}" width="18" height="12" fill="${c}"/>`;if(s.beam==='single'||j===0||j===spots.length-1)h+=T(842,y+6,n,{size:15,fill:c,anchor:'end',weight:700});});
    h+=`<rect x="18" y="404" width="34" height="22" rx="5" transform="rotate(-29 35 415)" fill="${s.on?'#c9d3df':'#5a6573'}"/>`;
    const nm=SPECTRUM[s.hue][0];
    return {svg:`<g clip-path="url(#stage-clip)">${h}</g>`,reads:s.beam==='full'?[['入射光','白光'],['射出',s.on?'七種色光':'—'],['偏折最少','紅光'],['偏折最多','紫光']]:[['入射光',nm+'光'],['射出',s.on?nm+'光（不再分散）':'—']],
      note:s.beam==='full'?'白光由多種色光組成；各色光折射程度不同 → <b>色散</b>（紅光偏折最少、紫光最多）。':'單色光通過稜鏡只會<b>偏折</b>，不會再分出其他顏色。'};}}
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
function render(){const out=cfg.render(state);svgEl.innerHTML=DEFS+out.svg;setIf(labEl.querySelector('.readouts'),out.reads.map(([a,b])=>`<div class="readout"><span>${a}</span><b>${b}</b></div>`).join(''));setIf(labEl.querySelector('.note'),out.note||'');sync();}
function activate(key){
  if(!LABS[key])key='lens';cancelAnimationFrame(raf);current=key;cfg=LABS[key];state=structuredClone(cfg.state);
  document.querySelectorAll('nav a').forEach(a=>{const on=a.dataset.key===key;a.classList.toggle('active',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current');});
  document.getElementById('title').textContent=cfg.name;document.getElementById('subtitle').textContent=cfg.subtitle;document.title=cfg.name+'｜理化實驗室';
  labEl.innerHTML=`<div class="sim-layout"><div class="viz-panel${cfg.dark?' dark':''}"><svg id="scene" viewBox="0 0 900 500" role="img" aria-label="${cfg.name}"></svg>${cfg.drag?'<p class="drag-hint"><i></i>虛線圓圈可以直接拖曳</p>':''}</div><div class="controls">${cfg.controls.map(controlHTML).join('')}<div class="readouts"></div><p class="note"></p><button type="button" class="btn ghost reset">↺ 重設</button></div></div><section class="question"><h3>想一想</h3><p>${cfg.q[0]}</p><details><summary>看解釋</summary><div class="answer">${cfg.q[1]}</div></details></section>`;
  svgEl=labEl.querySelector('#scene');render();
  if(cfg.tick){let last=0;const loop=now=>{const dt=last?Math.min((now-last)/1000,0.1):0;last=now;cfg.tick(state,dt);render();raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);}
  const act=document.querySelector('nav a.active');if(act&&matchMedia('(max-width:760px)').matches)act.scrollIntoView({block:'nearest',inline:'center'});
}
labEl.addEventListener('input',e=>{const c=cfg.controls[e.target.dataset.c];if(!c)return;if(c.type==='range')state[c.key]=+e.target.value;else if(c.type==='toggle')state[c.key]=e.target.checked;render();});
labEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('reset'))return activate(current);const c=cfg.controls[b.dataset.c];if(!c)return;
  if(c.type==='seg'){state[c.key]=c.options[b.dataset.o][0];if(c.onChange)c.onChange(state);}else if(c.type==='buttons')c.items[b.dataset.a][1](state);else if(c.type==='counter')state[c.key][b.dataset.k]=Math.max(0,state[c.key][b.dataset.k]+ +b.dataset.d);else return;render();});
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
document.getElementById('guide').onclick=()=>{document.getElementById('info-content').innerHTML=`<h2>使用說明</h2><ol><li><b>先猜：</b>只改一個條件，請學生預測結果。</li><li><b>操作：</b>拖動圖中的虛線圓圈或右側控制項，驗證預測。</li><li><b>解釋：</b>對照右側數值與公式，再展開「看解釋」。</li></ol><p>「投影模式」會隱藏側欄、放大操作區。教室網路不穩時可下載離線版，雙擊 HTML 即可使用，不需安裝或帳號。</p><h3>範圍</h3><p>校方 115 學年度第一學期行事曆：第一次段考 10/5–10/6、第二次 11/25–11/26（<a href="https://www.thsh.tp.edu.tw/uploads/178591837953198rrnVIS.pdf" target="_blank" rel="noopener">行事曆</a>）。第一次範圍已核實為翰林 B3 Ch1～Ch3（<a href="https://www.thsh.tp.edu.tw/uploads/17902147214252um1mhto.pdf" target="_blank" rel="noopener">公告第 5 頁</a>）。第二次今年尚未公告，光學單元依 <a href="https://www.thsh.tp.edu.tw/uploads/1763512990199UYTfRHNp.pdf" target="_blank" rel="noopener">114 學年度第二次範圍</a>（B3 4-1～4-5）預備，以老師指定為準。</p><h3>模型說明</h3><ul><li>各單元為理想模型，圖示不等於實物比例。</li><li>光學為幾何光學；透鏡採薄透鏡、近軸近似。實線是實際光路，虛線是反向延長線。</li><li>溶解度曲線為常見課本數據的近似值；聲音頁不會發出聲音。</li><li>RGB 是螢幕色彩值，不是光功率。</li><li>光路動畫的速度只是示意（真實光速約 3×10⁸ m/s）；稜鏡的色散程度有放大，方便觀察。</li></ul><p class="small">原創互動教材，不是校方公告。</p>`;dialog.showModal();};
activate(location.hash.slice(1)||'lens');
