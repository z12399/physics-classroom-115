/* Self-contained, dependency-free junior-high optics laboratory. */
(function () {
  'use strict';
  const C={object:'#ffcc6a',image:'#bb9bff',ray:'#61ddeb',second:'#ff92bc',muted:'#a6b5cd',ink:'#eaf3ff'};
  const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;
  function snell(n1,n2,a){const q=n1*Math.sin(rad(a))/n2;return {tir:q>1+1e-12,angle:q>1+1e-12?null:deg(Math.asin(Math.min(1,Math.max(-1,q)))),critical:n1>n2?deg(Math.asin(n2/n1)):null};}
  function shadow(a,D,h){return {m:D/a,height:h*D/a};}
  function lens(f,u){if(Math.abs(u-f)<1e-9)return {v:null,m:null,infinity:true};const v=f*u/(u-f);return {v,m:-v/u,infinity:false};}
  const num=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'—';
  const text=(x,y,s,fill=C.ink,size=20,anchor='start')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const line=(x1,y1,x2,y2,c=C.ray,dash=false,w=3,arrow=false)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" ${dash?'stroke-dasharray="9 7"':''} ${arrow?'marker-end="url(#optic-arrow)"':''}/>`;
  const arrow=(x,y0,y1,c,dash=false)=>line(x,y0,x,y1,c,dash,5)+`<path d="M ${x-9} ${y1+(y1<y0?15:-15)} L ${x} ${y1} L ${x+9} ${y1+(y1<y0?15:-15)}" fill="none" stroke="${c}" stroke-width="4"/>`;
  const read=(label,value)=>`<div class="readout"><span>${label}</span><strong>${value}</strong></div>`;
  const range=(key,label,value,min,max,step,unit)=>`<div class="control"><label for="optic-${key}">${label} <output data-value="${key}">${value}${unit}</output></label><input id="optic-${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${label}" data-unit="${unit}"/></div>`;
  const question=(q,a)=>`<section class="question"><h3>先猜，再操作</h3><p>${q}</p><details><summary>展開解釋</summary><div class="answer">${a}</div></details></section>`;
  const LABELS={shadow:'點光源、直線傳播與屏幕上的影子',mirror:'平面鏡成像與反射光線',refraction:'法線、入射光、反射光及折射光',lens:'透鏡主光線與物像位置',color:'紅綠藍光加色混合'};
  function svg(content,label){return `<svg viewBox="0 0 900 500" role="img" aria-label="${label}" style="display:block;width:100%;height:auto;font-family:inherit"><defs><marker id="optic-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker><clipPath id="optic-clip"><rect x="15" y="15" width="870" height="450"/></clipPath></defs>${content}</svg>`;}
  function mount(host,topic){
    const state={d:55,h:65,n1:1,n2:1.5,a:40,f:80,u:200,type:1,r:255,g:255,b:0,sa:60,sd:200,sh:40};
    let controls='',q='';
    if(topic==='shadow'){controls=range('sa','光源到物體 a',60,20,100,1,' cm')+range('sd','光源到屏幕 D',200,120,300,1,' cm')+range('sh','物體高度 h',40,5,60,1,' cm');q=question('物體靠近點光源，屏幕上的影子會變大還是變小？','會變大。屏幕位置不變時，光源到物體的距離 a 減少，影子的放大倍數 D/a 增加。這裡使用點光源，因此影子邊界清楚，沒有半影。');}
    else if(topic==='mirror'){controls=range('d','物體離鏡距離',55,15,100,1,' cm')+range('h','物體高度',65,20,100,1,' cm');q=question('物體向鏡面靠近 10 cm，物與像的距離改變多少？','像也向鏡面靠近 10 cm，所以物與像的距離減少 20 cm。平面鏡像與物體到鏡面的距離相等。');}
    else if(topic==='refraction'){controls=range('n1','入射介質折射率 n₁',1,1,2.5,.01,'')+range('n2','透射介質折射率 n₂',1.5,1,2.5,.01,'')+range('a','入射角 θ₁（從法線量起）',40,0,89,1,'°');q=question('光由水射向空氣，一定會折射出去嗎？','不一定。由高折射率介質射向低折射率介質時，入射角大於臨界角，就發生全反射。臨界角時折射方向沿著界面。');}
    else if(topic==='lens'){controls=`<div class="control"><label for="optic-type">透鏡種類</label><select id="optic-type" data-key="type"><option value="1">凸透鏡（會聚）</option><option value="-1">凹透鏡（發散）</option></select></div>`+range('f','焦距大小 |f|',80,40,140,1,' cm')+range('u','物距 u',200,20,360,.5,' cm')+`<div class="control"><span>凸透鏡關鍵位置</span><div class="control-buttons">${[['2.5','u > 2f'],['2','u = 2f'],['1.5','f < u < 2f'],['1','u = f'],['0.5','u < f']].map(([v,t])=>`<button type="button" class="btn" data-preset="${v}">${t}</button>`).join('')}</div></div>`;q=question('凸透鏡的物體放在焦點內，像能接在屏幕上嗎？','不能。射出光線發散，只有反向延長線相交，形成正立放大的虛像；屏幕接不到虛像。物體恰在焦點上時，射出光線平行，沒有有限距離的像。');}
    else {topic='color';controls=range('r','紅光 R',255,0,255,1,'')+range('g','綠光 G',255,0,255,1,'')+range('b','藍光 B',0,0,255,1,'')+`<div class="control-buttons"><button class="btn" type="button" data-color="white">白光</button><button class="btn" type="button" data-color="yellow">黃光</button><button class="btn" type="button" data-color="cyan">青光</button><button class="btn" type="button" data-color="magenta">洋紅光</button><button class="btn" type="button" data-color="off">關燈</button></div>`;q=question('紅光和綠光相加，會變成哪種光？','等強度的紅光與綠光相加是黃光；再加等強度藍光可得到白光。這是光的加色混合，顏料或濾色片的減色混合不能套用同一規則。');}
    host.innerHTML=`<div class="sim-layout"><div class="viz-panel dark"><div class="viz-heading"><span><i class="live-dot"></i>${LABELS[topic]}</span><span class="tag">暗室模擬</span></div><div class="drawing" data-drawing></div></div><div class="controls"><h3>改變條件，觀察結果</h3>${controls}<div class="readouts" data-reads></div><p class="note" data-note></p></div></div>${q}`;
    const drawing=host.querySelector('[data-drawing]'),reads=host.querySelector('[data-reads]'),note=host.querySelector('[data-note]');
    function render(){let art='',info='',explain='';
      host.querySelectorAll('[data-key]').forEach(el=>{el.value=state[el.dataset.key];const out=host.querySelector(`[data-value="${el.dataset.key}"]`);if(out)out.textContent=state[el.dataset.key]+el.dataset.unit;});
      if(topic==='shadow'){
        const z=shadow(state.sa,state.sd,state.sh),sy=Math.min(3,350/z.height),ox=100+700*state.sa/state.sd,ot=250-state.sh*sy/2,ob=250+state.sh*sy/2,st=250-z.height*sy/2,sb=250+z.height*sy/2;
        art=`<rect x="790" y="35" width="18" height="400" rx="4" fill="#708399"/><path d="M ${ox} ${ot} L800 ${st} L800 ${sb} L${ox} ${ob} Z" fill="#05080d"/>`+line(100,250,800,250,C.muted,true,2)+line(100,250,ox,ot,C.ray,false,3,true)+line(ox,ot,800,st,C.ray,false,3,true)+line(100,250,ox,ob,C.ray,false,3,true)+line(ox,ob,800,sb,C.ray,false,3,true)+line(ox,ot,ox,ob,C.object,false,10)+line(799,st,799,sb,C.image,false,10)+`<circle cx="100" cy="250" r="11" fill="#ffe8a5"/><circle cx="100" cy="250" r="23" fill="none" stroke="#ffe8a5" opacity=".35"/>`+text(100,210,'點光源',C.object,22,'middle')+text(ox,ot-18,'不透明物體',C.object,21,'middle')+text(810,30,'屏幕',C.ink,21,'middle')+text(820,250,'影子',C.image,22)+line(100,448,ox,448,C.object,true,2)+text((100+ox)/2,439,`a = ${state.sa} cm`,C.object,19,'middle')+line(100,481,800,481,C.muted,true,2)+text(450,475,`D = ${state.sd} cm`,C.muted,19,'middle');
        info=read('物體高度 h',`${state.sh} cm`)+read('影子高度 H',`${num(z.height)} cm`)+read('放大倍數 H/h',`${num(z.m,2)} 倍`)+read('相似三角形','H / h = D / a');explain='光在均勻介質中沿直線傳播。不透明物體擋住部分光，形成影子；兩條邊界光線由點光源出發，剛好經過物體兩端。固定屏幕時，物體越靠近光源，影子越大。這是點光源模型，沒有半影；圖的水平與垂直顯示比例可能不同，但物體與影子的高度比例正確。';
      } else if(topic==='mirror'){
        const mx=450,ox=mx-state.d*3,ix=mx+state.d*3,base=365,top=base-state.h*2,ex=100,ey=100;
        art=`<rect x="450" y="45" width="12" height="380" fill="#72dbe6" opacity=".35"/>`+line(mx,45,mx,425,C.ray,false,4)+text(mx,30,'平面鏡',C.ray,20,'middle');
        [top,base].forEach((y,i)=>{const hit=ey+(y-ey)*(mx-ex)/(ix-ex);art+=line(ox,y,mx,hit,i?C.second:C.ray,false,3,true)+line(mx,hit,ex,ey,i?C.second:C.ray,false,3,true)+line(mx,hit,ix,y,i?C.second:C.ray,true,2);});
        art+=arrow(ox,base,top,C.object)+arrow(ix,base,top,C.image,true)+text(ox,base+30,'物',C.object,24,'middle')+text(ix,base+30,'虛像',C.image,24,'middle');
        art+=`<path d="M 69 100 Q 100 71 131 100 Q 100 129 69 100" fill="#e8f3ff"/><circle cx="100" cy="100" r="11" fill="#162b46"/>`+text(65,60,'眼睛',C.ink,20)+line(ox,435,mx,435,C.object,true,2)+line(mx,435,ix,435,C.image,true,2)+text((ox+mx)/2,468,`${state.d} cm`,C.object,20,'middle')+text((ix+mx)/2,468,`${state.d} cm`,C.image,20,'middle');
        info=read('物距 = 像距',`${state.d} cm`)+read('物與像距離',`${state.d*2} cm`)+read('像的高度',`${state.h} cm`)+read('像的性質','正立・等大・虛像');explain='實線是光走的路徑，虛線是反射光的反向延長線。像在鏡後，光沒有真正穿過鏡子。鏡像把垂直鏡面的前後方向反轉；常見的「左右相反」來自把鏡像與轉身後的自己比較。';
      } else if(topic==='refraction'){
        const z=snell(state.n1,state.n2,state.a),cx=450,cy=250,L=205,a=rad(state.a);
        art=`<rect x="20" y="30" width="860" height="220" fill="#1d3854"/><rect x="20" y="250" width="860" height="225" fill="#244c66"/>`+line(20,cy,880,cy,'#d7edff',false,2)+line(cx,35,cx,470,C.muted,true,2)+text(470,50,'法線',C.muted)+text(40,65,`介質 1：n₁ = ${num(state.n1,2)}`)+text(40,450,`介質 2：n₂ = ${num(state.n2,2)}`)+line(cx-L*Math.sin(a),cy-L*Math.cos(a),cx,cy,C.object,false,4,true)+line(cx,cy,cx+L*Math.sin(a),cy-L*Math.cos(a),C.second,false,4,true);
        const arc=(r,start,end,c)=>`<path d="M ${cx+r*Math.cos(start)} ${cy+r*Math.sin(start)} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(end)} ${cy+r*Math.sin(end)}" fill="none" stroke="${c}" stroke-width="2"/>`;
        if(state.a>0)art+=arc(65,-Math.PI/2-a,-Math.PI/2,C.object)+arc(90,-Math.PI/2,-Math.PI/2+a,C.second);
        art+=text(250,110,`入射 ${state.a}°`,C.object,21)+text(590,110,`反射 ${state.a}°`,C.second,21);
        if(!z.tir){const b=rad(z.angle);art+=line(cx,cy,cx+L*Math.sin(b),cy+L*Math.cos(b),C.ray,false,4,true);if(z.angle>0)art+=arc(70,Math.PI/2-b,Math.PI/2,C.ray);art+=text(590,365,`折射 ${num(z.angle)}°`,C.ray,21);}else art+=text(590,365,'全反射：無折射光',C.object,24);
        info=read('反射角',`${state.a}°`)+read('折射角',z.tir?'無折射光':`${num(z.angle)}°`)+read('臨界角',z.critical===null?'此方向不會全反射':`${num(z.critical)}°`)+read('關係式','n₁ sin θ₁ = n₂ sin θ₂');explain='所有角度都從法線量起。進入較高折射率介質，折射光偏向法線；進入較低折射率介質則偏離法線。僅當 n₁ > n₂ 且入射角大於臨界角時會全反射。圖中的光線粗細不代表能量比例。';
      } else if(topic==='lens'){
        const f=state.type*state.f,u=state.u,z=lens(f,u),outside=!z.infinity&&Math.abs(z.v)>1800;
        const extent=Math.max(u,2*state.f,(!z.infinity&&!outside?Math.abs(z.v):0),160),s=Math.min(380/extent,145/(30*Math.max(1,!z.infinity&&!outside?Math.abs(z.m):1))),cx=450,cy=255,X=x=>cx+x*s,Y=y=>cy-y*s,oh=30;
        art=line(25,cy,875,cy,C.muted,true,2)+text(875,cy-12,'主軸',C.muted,16,'end');
        for(const sign of [-1,1])for(const mult of [1,2]){const x=X(sign*mult*state.f);art+=line(x,cy-6,x,cy+6,C.muted,false,2)+text(x,cy+28,`${mult===2?'2':''}F`,C.muted,16,'middle');}
        art+=state.type===1?`<path d="M450 65 Q487 255 450 445 Q413 255 450 65" fill="#61ddeb22" stroke="${C.ray}" stroke-width="3"/>`:`<path d="M428 65 Q460 255 428 445 L472 445 Q440 255 472 65 Z" fill="#61ddeb22" stroke="${C.ray}" stroke-width="3"/>`;
        const end=430/s;
        art+='<g clip-path="url(#optic-clip)">'+line(X(-u),Y(oh),cx,Y(oh),C.ray,false,3,true)+line(cx,Y(oh),X(end),Y(oh-oh*end/f),C.ray,false,3,true)+line(X(-u),Y(oh),cx,cy,C.second,false,3,true)+line(cx,cy,X(end),Y(-oh*end/u),C.second,false,3,true);
        if(!z.infinity&&z.v<0){art+=line(cx,Y(oh),X(z.v),Y(z.m*oh),C.ray,true,2)+line(cx,cy,X(z.v),Y(z.m*oh),C.second,true,2);}
        if(!z.infinity&&!outside)art+=arrow(X(z.v),cy,Y(z.m*oh),C.image,z.v<0);
        art+=arrow(X(-u),cy,Y(oh),C.object)+'</g>'+text(X(-u),Y(oh)-15,'物',C.object,22,'middle');
        if(!z.infinity&&!outside)art+=text(X(z.v),Y(z.m*oh)+(z.m<0?30:-17),z.v>0?'實像':'虛像',C.image,22,'middle');
        if(z.infinity)art+=text(450,475,'物體在焦點：出射光平行，沒有有限像距',C.object,22,'middle');else if(outside)art+=text(450,475,'像超出目前視野；請查看右側像距',C.image,22,'middle');else art+=text(450,475,'實線：實際光路　　虛線：反向延長線',C.muted,18,'middle');
        const property=z.infinity?'無有限距離的像':`${z.v>0?'實像・倒立':'虛像・正立'}・${Math.abs(Math.abs(z.m)-1)<1e-8?'等大':Math.abs(z.m)>1?'放大':'縮小'}`;
        info=read('焦距 f',`${f} cm`)+read('像距 v',z.infinity?'趨向無窮遠':`${num(z.v)} cm`)+read('放大率 m',z.infinity?'不適用':num(z.m,2))+read('成像性質',property);explain='薄透鏡模型：1/f = 1/u + 1/v，m = −v/u。凸透鏡 f 為正，凹透鏡 f 為負；v > 0 是透鏡另一側的實像，v < 0 是物體同側的虛像。青色光線平行主軸入射後通過像方焦點（凹透鏡則反向延長通過物方焦點）；粉色光線通過光心不偏折。畫面會自動縮放。';
      } else {
        const {r,g,b}=state;
        art=`<rect x="35" y="30" width="550" height="430" rx="22" fill="#05080d"/><g style="isolation:isolate"><circle cx="255" cy="195" r="130" fill="rgb(${r},0,0)"/><circle cx="385" cy="195" r="130" fill="rgb(0,${g},0)" style="mix-blend-mode:screen"/><circle cx="320" cy="307" r="130" fill="rgb(0,0,${b})" style="mix-blend-mode:screen"/></g>`+text(225,65,'R 紅光',C.ink,22,'middle')+text(435,65,'G 綠光',C.ink,22,'middle')+text(320,455,'B 藍光',C.ink,22,'middle')+`<rect x="625" y="95" width="220" height="190" rx="20" fill="rgb(${r},${g},${b})" stroke="#9fb3c7"/>`+text(735,60,'三束光重疊的顏色',C.ink,21,'middle')+text(735,320,`RGB (${r}, ${g}, ${b})`,C.ink,20,'middle')+text(735,365,'紅 + 綠 = 黃',C.muted,19,'middle')+text(735,399,'綠 + 藍 = 青',C.muted,19,'middle')+text(735,433,'紅 + 藍 = 洋紅',C.muted,19,'middle');
        info=read('紅色色值比例',`${Math.round(r/255*100)}%`)+read('綠色色值比例',`${Math.round(g/255*100)}%`)+read('藍色色值比例',`${Math.round(b/255*100)}%`)+read('混色方式','光的加色法');explain='把三束光投在同一個白色屏幕上，重疊處做加色混合。此處 RGB 數值是螢幕示意值，並非光功率量測。等強度紅、綠、藍光在本模型中形成白色；全關則黑。白光也可含多種波長，通過稜鏡後會因各波長折射程度不同而色散成光譜。這裡不是顏料混色。';
      }
      drawing.innerHTML=svg(art,LABELS[topic]);reads.innerHTML=info;note.textContent=explain;
    }
    function onInput(e){const k=e.target.dataset.key;if(!k)return;state[k]=+e.target.value;render();}
    function onClick(e){const p=e.target.closest('[data-preset]'),c=e.target.closest('[data-color]');if(p){state.type=1;state.u=state.f*+p.dataset.preset;if(state.u>360)state.u=360;render();}if(c){const presets={white:[255,255,255],yellow:[255,255,0],cyan:[0,255,255],magenta:[255,0,255],off:[0,0,0]};[state.r,state.g,state.b]=presets[c.dataset.color];render();}}
    host.addEventListener('input',onInput);host.addEventListener('change',onInput);host.addEventListener('click',onClick);render();
    return ()=>{host.removeEventListener('input',onInput);host.removeEventListener('change',onInput);host.removeEventListener('click',onClick);};
  }
  window.OpticsLab={mount,math:{snell,lens,shadow}};
})();
