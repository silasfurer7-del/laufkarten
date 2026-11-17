/* ================= Silas Sport ================= */
const PROFIL=/*PROFIL*/{};
let ROUTES=typeof ROUTES0!=='undefined'?ROUTES0:{};
const HAS_SNAP=typeof SNAP!=='undefined';
const KMAP=typeof KMAP0!=='undefined'?KMAP0:{},KHR=typeof KHR0!=='undefined'?KHR0:{},KNOTE=typeof KNOTE0!=='undefined'?KNOTE0:{};
const IC={
  heute:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  plan:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  training:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  erholung:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  ich:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  l:'<path d="M14 6l-6 6 6 6"/>', r:'<path d="M10 6l6 6-6 6"/>', out:'<path d="M8 16 16 8M9 8h7v7"/>',
  run:'<circle cx="13" cy="4" r="1"/><path d="M4 17l5 1l.75 -1.5"/><path d="M15 21l0 -4l-4 -3l1 -6"/><path d="M7 12l0 -3l5 -1l3 3l3 1"/>',
  bar:'<path d="M2 12h1"/><path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2"/><path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"/><path d="M9 12h6"/><path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"/><path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2"/><path d="M22 12h-1"/>'
};
const ZC=['rgba(31,63,214,.45)','rgba(31,63,214,.9)','rgba(240,67,30,.4)','rgba(240,67,30,.7)','#F0431E'],ZN=['Erholung','Locker, lange Läufe','Zügig','Schwelle, Intervalle','Maximal'];
const ZB=PROFIL.zonen||[131,163,179,195,201];
const ZONES=ZB.map((u,i)=>['Z'+(i+1),ZN[i],i?`${ZB[i-1]+1}–${u}`:'bis '+u,Math.max(4,i?u-ZB[i-1]:Math.round(u*.24)),ZC[i]]);
const BEST=PROFIL.bestzeiten||[];
const RACE=new Date((PROFIL.ziel&&PROFIL.ziel.datum||'2027-02-27')+'T00:00:00');
const MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const DOW=['So','Mo','Di','Mi','Do','Fr','Sa'],DOWL=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
/* ---------- Helfer ---------- */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const monday=d=>addD(d,-((d.getDay()+6)%7));
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const mmss=s=>{s=Math.round(s);return Math.floor(s/60)+':'+pad(s%60)};
const hmm=s=>{const m=Math.round(s/60);return Math.floor(m/60)+':'+pad(m%60)};
const f1=x=>(Math.round(x*10)/10).toFixed(1);
const kmTxt=x=>{const r=Math.round(x*10)/10;return Number.isInteger(r)?String(r):r.toFixed(1)};
const dm=d=>d.getDate()+'.'+(d.getMonth()+1);
const longDate=d=>`${DOWL[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()]}`;
const localDate=s=>{const m=String(s).match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);return m?new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):new Date(s)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- Kalender lesen ---------- */
const kindOf=s=>/lauf|interval|\brun\b|jog/i.test(s)?'run':/push|pull|beine|\bleg|gym|kraft/i.test(s)?'gym':null;
function parseIv(t){const m=t.match(/(\d+)\s*[×x]\s*(\d+)\s*m?/i);if(!m)return null;const num=x=>parseFloat(String(x).replace(',','.'));
 const pace=(t.match(/@\s*(\d{1,2}:\d\d)/)||[])[1]||'',pause=(t.match(/(\d+)\s*min\s*(?:trab)?pause/i)||t.match(/(\d+)\s*min(?:uten)?\s*traben/i)||[])[1]||'';
 const warm=num((t.match(/(\d+(?:[.,]\d+)?)\s*km\s*(?:einlaufen|warm)/i)||[])[1]||0),c=t.match(/(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*km\s*(?:auslaufen|cool)/i),cool=c?num(c[2]||c[1]):0;
 return {reps:+m[1],dist:+m[2],pace,pause,warm,cool,km:warm+(+m[1])*(+m[2])/1000+cool}}
function parseEvent(e){if(!e||!e.start||!e.start.dateTime)return null;const s=e.summary||'',k=kindOf(s);if(!k)return null;const d=new Date(e.start.dateTime);
 const it={id:e.id,k,date:d,key:ymd(d),time:hm(d),desc:(e.description||'').trim(),loc:e.location||''};
 if(k==='run'){const a=s.match(/^(.*?)\s+(\d+\s*[×x]\s*\d+)/i),b=s.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*km/i);
  if(a){it.t=a[1].trim();it.v=a[2].replace(/\s*x\s*/i,'×').replace(/\s/g,'');it.iv=parseIv(s+' · '+it.desc);it.km=it.iv?it.iv.km:null;it.type='intervall'}
  else if(b){it.t=b[1].trim();it.km=parseFloat(b[2].replace(',','.'));it.v=kmTxt(it.km)+' km';it.type=/lang|long/i.test(it.t)?'lang':'locker'}
  else{it.t=s;it.v='Lauf';it.type='locker'}
  it.val=it.km?kmTxt(it.km)+' km':'';
  const p=it.desc.split(' · ').filter(Boolean);it.sub=it.type==='intervall'&&it.km?`${kmTxt(it.km)} km${it.iv.pace?' · '+it.iv.pace+' /km':''}`:(p.slice(0,2).join(' · ')||it.val);
  if(!it.loc)it.loc=it.type==='intervall'?'Sportplatz Heiden':it.type==='lang'?'ab zuhause':d.getDay()===6?'Eselschwanz':'';
  const folder=it.km?`${it.type==='intervall'?'intervall-heiden':it.type==='lang'?'lang-zuhause':d.getDay()===6?'locker-eselschwanz':'locker-zuhause'}-${Math.round(it.km)}`:null;it.route=folder&&ROUTES[folder]?folder:null;
 }else{it.t=/push/i.test(s)?'Push':/pull/i.test(s)?'Pull':/beine|\bleg/i.test(s)?'Beine':s.replace(/\s*\(.*\)\s*$/,'');it.gt=it.t.toLowerCase();it.v='Gym';it.sub='Krafttraining'}
 return it}

/* ---------- Hevy-Text aus Strava lesen ---------- */
function parseHevy(desc){const ex=[];let cur=null,q=false;for(const raw of String(desc||'').split('\n')){const l=raw.trim();const n=(l.match(/"/g)||[]).length;
  if(q||l[0]==='"'){if(n%2)q=!q;continue}
  const m=l.match(/^Set \d+:\s*(?:([\d.]+)\s*kg\s*x\s*)?(\d+)(?:\s*Wiederholungen)?\s*(\[.*\])?/i);
  if(m){if(cur)cur.sets.push({w:m[1]?+m[1]:null,r:+m[2],warm:/warm/i.test(m[3]||''),fail:/fail/i.test(m[3]||'')})}
  else if(l&&!/^Mit hevyapp/i.test(l)){const name=l.replace(/\s*\(.*\)\s*$/,'').replace(/\s+-\s+.*$/,'').replace(/\s+sitzend$/i,'');cur=ex.find(x=>x.name===name)?{name,sets:[]}:(c=>{ex.push(c);return c})({name,sets:[]})}}
 return ex.filter(e=>e.sets.length)}
const topSet=e=>{const ws=e.sets.filter(s=>!s.warm&&s.w!=null);if(!ws.length)return null;const mx=Math.max(...ws.map(s=>s.w));return ws.find(s=>s.w===mx)};
const gymType=n=>/push/i.test(n)?'push':/pull/i.test(n)?'pull':/\bleg|beine/i.test(n)?'beine':null;
const gymName={push:'Push',pull:'Pull',beine:'Beine'};
function prChances(w){if(!w)return[];return parseHevy(w.description).map(e=>{const t=topSet(e);return t&&!t.fail&&t.r>=10?{name:e.name,from:t,w:t.w+(/beinpresse/i.test(e.name)?5:2.5)}:null}).filter(Boolean)}
const kg=x=>String(Math.round(x*10)/10);
function compare(cur,prev){const P=prev?parseHevy(prev.description):[];let up=0,same=0,down=0;const rows=[];
 for(const e of parseHevy(cur.description)){const t=topSet(e);if(!t)continue;const pe=P.find(x=>x.name===e.name),p=pe&&topSet(pe);let chip='neu',kind='same';
  if(p){const dw=Math.round((t.w-p.w)*10)/10,dr=t.r-p.r;if(dw>0){chip='+'+kg(dw)+' kg';kind='up'}else if(dw<0){chip='−'+kg(-dw)+' kg';kind='down'}else if(dr>0){chip='+'+dr+' Wdh';kind='up'}else if(dr<0){chip='−'+(-dr)+' Wdh';kind='down'}else chip='gleich';
   if(kind==='up')up++;else if(kind==='down')down++;else same++}
  rows.push([e.name,`${kg(t.w)} kg × ${t.r}`,chip,kind])}
 return {rows,up,same,down,has:P.length>0}}

/* ---------- Modell aus Kalender und Strava ---------- */
function build(calEvents,acts,now){
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),tk=ymd(today),mon=monday(today),M={now,todayKey:tk};
 const A=(acts||[]).map(a=>({...a,d:localDate(a.start_local),kind:/run/i.test(a.sport_type)?'run':/weight|workout|crossfit/i.test(a.sport_type)?'gym':null})).filter(a=>a.kind).sort((x,y)=>y.d-x.d);
 A.forEach(a=>a.key=ymd(a.d));
 /* Läufe, geteilte Aufzeichnungen zusammenlegen */
 const runsRaw=A.filter(a=>a.kind==='run'),runs=[];
 for(const a of runsRaw){const base=/teil\s*\d/i.test(a.name)?a.name.replace(/\s*teil\s*\d+/i,'').trim().toLowerCase():null;const g=base&&runs.find(r=>r.base===base&&r.key===a.key);
  if(g){g.dist+=a.summary.distance;g.mov+=a.summary.moving_time;g.elev+=a.summary.elevation_gain;g.parts.push(a);if(a.d<g.d){g.d=a.d;g.id=a.id;g.loc=a.location_summary}}
  else runs.push({id:a.id,name:a.name,base,key:a.key,d:a.d,dist:a.summary.distance,mov:a.summary.moving_time,elev:a.summary.elevation_gain,loc:a.location_summary||'',desc:a.description||'',hide:a.hide,parts:[a],ahr:a.avg_hr?Math.round(a.avg_hr):null})}
 const gyms=A.filter(a=>a.kind==='gym').map(a=>({...a,type:gymType(a.name)}));
 const inRange=(d,a,b)=>d>=a&&d<b;
 const wEnd=addD(mon,7),mStart=new Date(today.getFullYear(),today.getMonth(),1),mEnd=new Date(today.getFullYear(),today.getMonth()+1,1);
 /* Plan dieser Woche */
 const evs=(calEvents||[]).map(parseEvent).filter(Boolean).sort((a,b)=>a.date-b.date);
 const lastOf=t=>gyms.find(g=>g.type===t&&g.description);
 for(const it of evs){it.lab=(it.key===tk?'Heute · ':'')+`${DOW[it.date.getDay()]} ${it.date.getDate()} · ${it.time}`;
  if(it.k==='gym'){const pr=gymType(it.t)?prChances(lastOf(gymType(it.t))):[];it.pr=pr;
   if(pr.length){it.v=kg(pr[0].w)+' kg';it.val=it.v;it.vs='PR-Chance';it.sub=`PR-Chance ${pr[0].name}`+(pr.length>1?`, ${pr.length-1} weitere`:'');it.text=`PR-Chance ${pr[0].name}: letztes Mal ${kg(pr[0].from.w)} kg × ${pr[0].from.r}, ohne Failure.`+(pr.length>1?` Dazu ${pr.slice(1).map(p=>p.name+' '+kg(p.w)+' kg').join(', ')}.`:'')}
   else if(lastOf(gymType(it.t))){it.sub='Keine PR-Chance offen, Gewichte halten';it.text='Letztes Mal ging jeder oberste Satz ans Limit. Gewichte halten.'}}
  it.auto=it.k==='run'?runs.some(r=>r.key===it.key&&!r.hide):gyms.some(g=>g.key===it.key&&(!gymType(it.t)||g.type===gymType(it.t)||!g.type));
 }
 const week=evs.filter(e=>inRange(e.date,mon,wEnd));
 M.days=[];for(let i=0;i<7;i++){const d=addD(mon,i),k=ymd(d),day=week.filter(e=>e.key===k);const pre=(k===tk?'Heute · ':'')+`${DOW[d.getDay()]} ${d.getDate()}`;
  if(!day.length)M.days.push({id:'frei-'+k,k:'frei',key:k,date:d,lab:pre,t:'Frei',v:'Ruhetag',sub:'Erholung'});
  for(const e of day)M.days.push(e)}
 evs.forEach((e,n)=>{if(e.k==='run')e.go='geplant-'+n});M.evs=evs;M.days.forEach((d,i)=>{d.i=i});
 M.week=[];for(let i=0;i<7;i++){const k=ymd(addD(mon,i)),ks=new Set(week.filter(e=>e.key===k).map(e=>e.k));M.week.push([DOW[(i+1)%7].toUpperCase(),ks.size>1?'both':ks.has('run')?'run':ks.has('gym')?'gym':'frei'])}
 const sun=addD(mon,6);M.weekTitle=mon.getMonth()===sun.getMonth()?`${mon.getDate()}. – ${sun.getDate()}. ${MON[sun.getMonth()]}`:`${mon.getDate()}. ${MON[mon.getMonth()].slice(0,3)}. – ${sun.getDate()}. ${MON[sun.getMonth()].slice(0,3)}.`;
 const wkRuns=runs.filter(r=>inRange(r.d,mon,wEnd)&&!r.hide);
 M.wk={km:wkRuns.reduce((s,r)=>s+r.dist,0),plan:week.filter(e=>e.k==='run').reduce((s,e)=>s+(e.km||0),0),runs:wkRuns.length,planRuns:week.filter(e=>e.k==='run').length};
 const upcoming=evs.filter(e=>e.key>=tk);
 M.todayItems=M.days.filter(d=>d.key===tk&&d.k!=='frei');M.upcoming=upcoming;M.tomorrowKey=ymd(addD(today,1));
 M.next=upcoming.find(e=>e.key>tk)||null;
 M.nextRun=upcoming.find(e=>e.k==='run'&&!e.auto)||null;M.nextGym=upcoming.find(e=>e.k==='gym'&&!e.auto)||null;
 /* Monat */
 const mRuns=runs.filter(r=>inRange(r.d,mStart,mEnd)&&!r.hide),mGyms=gyms.filter(g=>inRange(g.d,mStart,mEnd));
 const mKm=mRuns.reduce((s,r)=>s+r.dist,0),mMov=mRuns.reduce((s,r)=>s+r.mov,0);
 M.mo={name:MON[today.getMonth()],km:f1(mKm),pace:mKm?mmss(mMov/mKm):'–',runs:mRuns.length,gyms:mGyms.length,units:mRuns.length+mGyms.length,gymAvg:mGyms.length?hmm(mGyms.reduce((s,g)=>s+g.summary.moving_time,0)/mGyms.length):'–'};
 const cal={title:MON[today.getMonth()],lead:(mStart.getDay()+6)%7,n:new Date(today.getFullYear(),today.getMonth()+1,0).getDate(),run:[],gym:[],both:[]};
 for(let d=1;d<=cal.n;d++){const k=ymd(new Date(today.getFullYear(),today.getMonth(),d));if(k>tk)break;const r=mRuns.some(x=>x.key===k),g=mGyms.some(x=>x.key===k);if(r&&g)cal.both.push(d);else if(r)cal.run.push(d);else if(g)cal.gym.push(d)}
 M.cal=cal;
 /* Verlauf pro Woche */
 const weeks=(list,n,val)=>{const cur=list.some(x=>inRange(x.d,mon,wEnd));const last=cur?mon:addD(mon,-7),out=[];for(let i=n-1;i>=0;i--){const a=addD(last,-7*i),b=addD(a,7);out.push([val(list.filter(x=>inRange(x.d,a,b))),dm(a)])}return out};
 M.kmWeek=weeks(runs,8,l=>Math.round(l.reduce((s,r)=>s+r.dist,0)));M.kmAvg=Math.round(M.kmWeek.reduce((s,w)=>s+w[0],0)/8);
 M.gymWeek=weeks(gyms,6,l=>l.length);M.gymAvg=Math.round(M.gymWeek.reduce((s,w)=>s+w[0],0)/6);
 M.longest=runs.filter(r=>!r.hide).reduce((m,r)=>Math.max(m,r.dist),0);
 /* Listen */
 M.runs=runs.filter(r=>!r.hide).map(r=>{const txt=r.name+' '+r.desc,iv=/interval/i.test(txt),m=txt.match(/(\d+)\s*x\s*(\d+)/i),big=iv?'Intervalle':/long|lang/i.test(r.name)?'Long Run':'Lauf',pace=mmss(r.mov/r.dist),city=(r.loc||'').split(',')[0];
  const id=String(r.id),km=KMAP[id];
  return {id,d:r.d,date:longDate(r.d),lab:hm(r.d)+(KNOTE[id]?' · '+KNOTE[id]:city?' · '+city:''),big,km:f1(r.dist),text:r.parts.length>1?`In ${r.parts.length} Teilen aufgezeichnet.`:iv&&m?`${m[1]} × ${m[2]} m`:r.name,pace,dur:r.mov>=3600?hmm(r.mov):mmss(r.mov),du:r.mov>=3600?'Stunden':'Minuten',hr:KHR[id]||r.ahr||null,hm:Math.round(r.elev),
   map:km?km[0]:null,ar:km?km[1]:null,poly:r.parts.map(p=>p.reduced_polyline).filter(Boolean),note:KNOTE[id],strava:id,lt:iv?'Intervalle'+(m?` ${m[1]}×${m[2]}`:''):big==='Long Run'?'Long Run':r.name,ls:`${DOW[r.d.getDay()]} ${dm(r.d)}. · ${pace} /km`}});
 M.gyms=gyms.map((g,i)=>{const prev=g.type&&gyms.slice(i+1).find(x=>x.type===g.type&&x.description);const c=g.description?compare(g,prev):null,n=g.description?parseHevy(g.description).length:0;
  return {id:String(g.id),t:gymName[g.type]||g.name.replace(/\s*\(.*\)/,''),d:g.d,date:longDate(g.d),dur:hmm(g.summary.moving_time),ls:`${DOW[g.d.getDay()]} ${dm(g.d)}.`+(n?` · ${n} Übungen`:''),cmp:c,prevDate:prev?longDate(prev.d):null}});
 return M}

/* ---------- Zustand ---------- */
const mem={get(k,d){try{const v=localStorage.getItem('ss.'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('ss.'+k,JSON.stringify(v))}catch(e){}}};
const S={done:mem.get('done',{}),notes:mem.get('notes',{}),noteOpen:false,open:null,moreRuns:false,moreGym:false,stack:[]};
const RAW={cal:null,acts:null,rec:null};           /* Live-Antworten */
const ST={cal:{s:'aus'},acts:{s:'aus'},rec:{s:'aus'}}; /* Zustand je Quelle */
const NOREC={energy:null,sleep:null,rhr:null,stress:null,hrv:null,nights:[],phases:null,none:true};
let M=build(HAS_SNAP?SNAP.cal:[],HAS_SNAP?SNAP.acts:[],HAS_SNAP?SNAP_NOW:new Date()),REC=HAS_SNAP?SNAP.rec:NOREC,HR={};
function rebuild(){if(!S.openUser)S.open=null;const live=RAW.cal||RAW.acts;M=build(RAW.cal||(HAS_SNAP?SNAP.cal:[]),RAW.acts||(HAS_SNAP?SNAP.acts:[]),RAW.cal||!HAS_SNAP?new Date():SNAP_NOW);M.live=!!live||!HAS_SNAP;REC=RAW.rec||(HAS_SNAP?SNAP.rec:NOREC)}
const isDone=it=>!!(it&&(it.auto||S.done[it.id]));
const weekKm=()=>M.wk.km+M.days.filter(d=>d.k==='run'&&S.done[d.id]&&!d.auto).reduce((s,d)=>s+(d.km||0),0);
const weekRuns=()=>M.wk.runs+M.days.filter(d=>d.k==='run'&&S.done[d.id]&&!d.auto).length;
const defaultOpen=()=>{const i=M.days.findIndex(d=>d.k!=='frei'&&d.key>=M.todayKey&&!isDone(d));return i<0?Math.max(0,M.days.findIndex(d=>d.key===M.todayKey)):i};

/* ---------- Bausteine ---------- */
const ic=(p,s=22,w=1.8)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const head=(t,right='',cls='')=>`<div class="head ${cls}"><h1 class="s34">${t}</h1>${right}</div>`;
const dhead=t=>`<div class="dhead"><button class="round" data-act="back" aria-label="Zurück">${ic(IC.l)}</button><span class="s26">${t}</span></div>`;
const tile=(lab,num,sub,cls='',extra='')=>`<div class="tile"><div class="lab">${lab}</div><div class="n50 ${cls}">${num}</div><div class="s21">${sub}</div>${extra}</div>`;
const kz=a=>`<div class="kz">${a.map(q=>`<div><div class="lab">${q[0]}</div><div class="n34">${q[1]}</div><div class="b12">${q[2]}</div></div>`).join('')}</div>`;
const hero=o=>{const tag=o.go?'button':'div';return `<${tag} ${o.go?`data-go="${o.go}"`:''} class="hero ${o.bl?'bl':''} ${o.plain?'plain':''}"><div class="lab">${o.lab}</div><div class="big">${o.big}</div><div class="val"><span class="n60">${o.val}</span>${o.unit?`<span class="s26">${o.unit}</span>`:''}</div>${o.extra||''}${o.text?`<p class="b15">${esc(o.text)}</p>`:''}${o.after||''}</${tag}>`};
const NAV=[['heute','Heute'],['plan','Plan'],['training','Training'],['erholung','Erholung'],['ich','Ich']];
const nav=a=>`<div class="fix"><div class="in"><nav class="nav">${NAV.map(n=>`<button data-go="${n[0]}" class="${n[0]===a?'on':''}" aria-label="${n[1]}">${ic(IC[n[0]])}</button>`).join('')}</nav></div></div>`;
const bar=(v,max)=>`<div class="bar"><i style="width:${Math.min(100,max?v/max*100:0)}%"></i></div>`;
const chart=(a,bw,col,ops)=>{const max=Math.max(1,...a.map(q=>q[0]));return `<div class="chart">${a.map((q,i)=>{const h=q[0]?Math.max(8,q[0]/max*96):6;return `<div class="c" style="width:${bw}px"><span class="b12">${q[0]}</span><i style="height:${h}px;border-radius:${q[0]?7:3}px;background:${q[0]?col:'var(--gr)'};opacity:${q[0]?ops(q[0],i,max):.25}"></i></div>`}).join('')}</div><div class="cdates">${a.map(q=>`<span style="width:${bw}px">${q[1]}</span>`).join('')}</div>`};
const more=(on,act,n)=>n>3?`<button class="pill sb13" data-act="${act}">${on?'Weniger zeigen':'Mehr laden'}</button>`:'';
const dotCls=k=>k==='both'?'both':k;
const daysToRace=()=>Math.max(0,Math.ceil((RACE-new Date(M.now.getFullYear(),M.now.getMonth(),M.now.getDate()))/864e5));
const splitVal=v=>{const m=String(v).match(/^([\d.,:]+)\s+(\S.*)$/);return m?{val:m[1],unit:m[2]}:{val:v}};
const clock=()=>hm(M.live?new Date():M.now);
const noteKey=it=>it?it.id:'x';

/* ---------- Seiten ---------- */
const V={};
const whenLab=it=>it.key===M.todayKey?'Heute':it.key===M.tomorrowKey?'Morgen':`${DOW[it.date.getDay()]} ${it.date.getDate()}`;
V.heute=()=>{
  const it=M.upcoming.find(x=>!isDone(x))||null,d=M.now,km=weekKm();let h;
  if(it){const sv=splitVal(it.v);h=`<div class="hero ${it.k==='gym'?'bl':''}" ${it.go?`data-go="${it.go}" role="link" tabindex="0"`:''}><div class="lab">${whenLab(it)} · ${it.time}${it.loc?' · '+esc(it.loc):''}</div><div class="big">${esc(it.t)}</div><div class="val"><span class="n60">${esc(sv.val)}</span>${sv.unit?`<span class="s26">${esc(sv.unit)}</span>`:''}</div>
      <p class="b15">${esc(it.k==='run'?it.desc||it.sub:it.text||it.sub)}</p>
      <div class="acts"><button class="btn-a ${it.k==='gym'?'blu':''}" data-act="done" data-id="${it.id}">Abhaken</button><button class="btn-b" data-act="note">Notiz</button></div>
      ${S.noteOpen||S.notes[it.id]?`<textarea class="note" rows="2" placeholder="Wie war es?" data-note="${it.id}">${esc(S.notes[it.id]||'')}</textarea>`:''}</div>`}
  else h=hero({plain:1,lab:'Heute',big:M.evs.length?'Frei':ST.cal.s==='laden'?'Plan':'Kein Plan',val:M.evs.length?'Alles erledigt':ST.cal.s==='laden'?'lädt':'–',text:M.evs.length?'Im Kalender steht nichts mehr an.':ST.cal.s==='laden'?'':'Es ist noch kein Trainingsplan geladen.'});
  const u=S.lastDone&&M.evs.find(x=>x.id===S.lastDone&&S.done[x.id]);
  return `<main class="page">${head(`${d.getDate()}. ${MON[d.getMonth()]}`,`<span class="n34" id="clock">${clock()}</span>`)}
  <div class="stack">${Hooks.banner()}${h}${u?`<div class="undo b12 gr">${esc(u.t)} abgehakt. <button data-act="undo">Rückgängig</button></div>`:''}
    <div class="card"><div class="s26 ct">deine Woche</div><div class="days">${M.week.map(w=>`<div class="day"><span class="dot ${dotCls(w[1])}"></span><span class="b12">${w[0]}</span></div>`).join('')}</div></div>
    <div class="tiles">${tile(PROFIL.ziel?esc(PROFIL.ziel.name):'Ziel',daysToRace(),'Tage bis zum Start','or')}${tile('Diese Woche',kmTxt(km),`von ${kmTxt(M.wk.plan)} Kilometern`,'',bar(km,M.wk.plan))}</div>
    ${REC.none?'':`<button class="erh" data-go="erholung"><div class="lab">Erholung · ${REC.asof?'Stand '+REC.asof:'heute'}</div><div class="row"><span class="n50">${REC.energy??'–'}</span><span class="s21">von 100 Energie</span></div><div class="b13">Schlaf ${REC.sleep?REC.sleep+' h':'–'} · Ruhepuls ${REC.rhr?REC.rhr+' bpm':'–'}</div>
      <div class="days">${(REC.nights.length?REC.nights:Array(7).fill([0,null])).map(n=>n[1]==null?`<span class="dot" style="background:rgba(223,214,196,.14)"></span>`:`<span class="dot" style="background:rgba(223,214,196,${n[1]/100});color:${n[1]>=50?'var(--blx)':'var(--card)'}">${n[1]}</span>`).join('')}</div></button>`}
  </div></main>${nav('heute')}`};

const item=(d,i,open)=>`<button class="it ${d.k} ${open?'open':''}" data-act="open" data-i="${i}" ${d.go?`data-to="${d.go}"`:''}>
  <div class="co"><span class="dot ${d.k}"></span><span class="lab">${esc(d.lab)}</span><span class="s21">${esc(d.t)}</span>${d.val?`<div class="v ${d.vs?'':'mid'}"><div class="n20">${esc(d.val)}</div>${d.vs?`<div class="b12">${d.vs}</div>`:''}</div>`:''}</div>
  <div class="op"><div class="lab">${esc(d.lab)}${isDone(d)?' · erledigt':''}</div><div class="t">${esc(d.t)}</div><div class="n44">${esc(d.v)}</div><div class="b15 cut">${esc(d.sub||'')}</div></div></button>`;
const planHead=a=>head('Plan',`<div class="toggle"><button data-go="plan" class="${a?'':'on'}">Woche</button><button data-go="plan-monat" class="${a?'on':''}">Monat</button></div>`,'pl');
const sw=t=>`<div class="sw"><span class="round">${ic(IC.l)}</span><span class="s26">${t}</span><span class="round">${ic(IC.r)}</span></div>`;
V.plan=()=>{if(S.open==null||S.open>=M.days.length)S.open=defaultOpen();const km=weekKm();return `<main class="page">${planHead(0)}${sw(M.weekTitle)}
  <div class="acc">${M.days.map((d,i)=>item(d,i,i===S.open)).join('')}</div>
  <div class="tiles" style="margin-top:16px">${tile('Diese Woche',kmTxt(km),`von ${kmTxt(M.wk.plan)} Kilometern`,'',bar(km,M.wk.plan))}${tile('Läufe',weekRuns(),`von ${M.wk.planRuns} erledigt`,'or')}</div></main>${nav('plan')}`};
V['plan-monat']=()=>{const c=M.cal;let cells='';for(let i=0;i<c.lead;i++)cells+='<span></span>';
  for(let d=1;d<=c.n;d++){const k=c.run.includes(d)?'run':c.gym.includes(d)?'gym':c.both.includes(d)?'both':'';cells+=`<span class="dot ${k}">${d}</span>`}
  const it=M.upcoming.find(x=>!isDone(x));
  return `<main class="page">${planHead(1)}${sw(c.title)}<div class="stack">
  <div class="card"><div class="calh lab">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(w=>`<span>${w}</span>`).join('')}</div><div class="cal">${cells}</div>
    <div class="leg b12"><span><i style="background:var(--or)"></i>Lauf</span><span><i style="background:var(--bl)"></i>Gym</span></div></div>
  ${it?`<button class="it ${it.k} open" ${it.go?`data-go="${it.go}"`:''}><div class="op"><div class="lab">${esc(it.lab)}</div><div class="t">${esc(it.t)}</div><div class="n44">${esc(it.v)}</div><div class="b15 cut">${esc(it.sub||'')}</div></div></button>`:''}
  <div class="tiles">${tile('Im '+M.mo.name,M.mo.km,'Kilometer gelaufen','or')}${tile('Einheiten',M.mo.units,`${M.mo.runs} Läufe, ${M.mo.gyms} Mal Gym`)}</div>
  </div></main>${nav('plan')}`};

V.training=()=>`<main class="page">${head('Training')}<div class="choice"><button data-go="laufen" style="background:var(--or)" aria-label="Laufen">${ic(IC.run,168,1.5)}</button><button data-go="gym" style="background:var(--bl)" aria-label="Gym">${ic(IC.bar,168,1.5)}</button></div></main>${nav('training')}`;

V.laufen=()=>{const rs=S.moreRuns?M.runs:M.runs.slice(0,3),n=M.nextRun;
  const sv=n?splitVal(n.v):null;const h=n?hero({go:n.go,lab:`Nächster Lauf · ${n.key===M.todayKey?'Heute':DOW[n.date.getDay()]+' '+n.date.getDate()} ${n.time}`,big:esc(n.t),val:esc(sv.val),unit:sv.unit,text:n.sub}):hero({plain:1,lab:'Nächster Lauf',big:'Offen',val:'–',text:'Im Kalender steht kein weiterer Lauf.'});
  return `<main class="page">${head('Laufen')}<div class="stack">${h}
  <div class="card"><div class="s26 ct">kilometer pro woche</div><div class="lab cr">Ø ${M.kmAvg} km</div>${chart(M.kmWeek,28,'var(--or)',(k,i,max)=>i===7?1:k>=max*.6?.5:.25)}</div>
  <div class="tiles">${tile('Ø Pace',M.mo.pace,'im '+M.mo.name)}${tile('Gesamt',M.mo.km,'km im '+M.mo.name)}</div>
  <div class="tiles">${tile('Längster Lauf',f1(M.longest),'von 60 Kilometern','or')}${tile('Läufe',M.mo.runs,'im '+M.mo.name)}</div>
  <div class="card"><div class="s26 ct">letzte läufe</div><div class="lrows">${rs.map(r=>`<button class="lr" data-go="lauf-${r.id}"><div><div class="s21 cut">${esc(r.lt)}</div><div class="b12">${r.ls}</div></div><div class="n20">${r.km} km</div></button>`).join('')||'<p class="b15 gr">Noch keine Läufe.</p>'}</div>${more(S.moreRuns,'moreRuns',M.runs.length)}</div>
  </div></main>${nav('training')}`};
V.gym=()=>{const gs=S.moreGym?M.gyms:M.gyms.slice(0,3),n=M.nextGym;let h;
  if(n){const sv=splitVal(n.v);h=hero({bl:1,lab:`Nächstes Training · ${n.key===M.todayKey?'Heute':DOW[n.date.getDay()]+' '+n.date.getDate()}`,big:esc(n.t),val:esc(sv.val),unit:sv.unit,text:n.text||n.sub})}
  else h=hero({bl:1,lab:'Nächstes Training',big:'Offen',val:'–',text:'Im Kalender steht kein weiteres Gym-Training.'});
  return `<main class="page">${head('Gym')}<div class="stack">${h}
  <div class="card"><div class="s26 ct">einheiten pro woche</div><div class="lab cr">Ø ${M.gymAvg}</div>${chart(M.gymWeek,36,'var(--blx)',(k,i)=>i===5?.9:.45)}</div>
  <div class="tiles">${tile('Ø Dauer',M.mo.gymAvg,'Stunden')}${tile('Gesamt',M.mo.gyms,'im '+M.mo.name,'blu')}</div>
  <div class="card"><div class="s26 ct">letzte trainings</div><div class="lrows">${gs.map(g=>`<${g.cmp?`button data-go="gym-${g.id}"`:'div'} class="lr"><div><div class="s21">${esc(g.t)}</div><div class="b12">${g.ls}</div></div><div class="n20">${g.dur} h</div></${g.cmp?'button':'div'}>`).join('')||'<p class="b15 gr">Noch keine Trainings.</p>'}</div>${more(S.moreGym,'moreGym',M.gyms.length)}</div>
  </div></main>${nav('training')}`};

/* geplanter Lauf */
function planned(it){const iv=it.iv,rt=it.route&&ROUTES[it.route];let abl='',k;
  if(iv){const cols=['70fr','8fr'],cells=['<i class="e"></i>','<b></b>'];for(let i=0;i<iv.reps;i++){cols.push('34fr');cells.push('<i class="b"><span>Intervall</span></i>');if(i<iv.reps-1){cols.push('6fr','10fr','6fr');cells.push('<b></b>','<i class="p"></i>','<b></b>')}}cols.push('8fr','29fr');cells.push('<b></b>','<i class="e"></i>');
   abl=`<div class="card" style="padding-bottom:22px"><div class="s26 ct">ablauf</div><div class="abl" style="grid-template-columns:${cols.join(' ')}">${cells.join('')}</div>
    <div class="cap b12" style="margin-top:10px"><span>${iv.warm?kmTxt(iv.warm)+' km ein':'ein'}</span><span class="m">${iv.reps} × ${iv.dist} m</span><span>aus</span></div>
    <div class="cap b12 gr" style="margin-top:3px"><span>locker</span><span class="m">${iv.pace?iv.pace+' /km':''}${iv.pause?' · '+iv.pause+':00 traben':''}</span><span>locker</span></div></div>`;
   k=[['Pace',iv.pace||'–','pro km'],['Pause',iv.pause?iv.pause+':00':'–','min traben'],['Distanz',kmTxt(iv.km),'km gesamt']]}
  else{const p=it.desc.match(/@\s*(\d{1,2}:\d\d)(?:\s*[–-]\s*(\d{1,2}:\d\d))?/),hr=it.desc.match(/puls\s*unter\s*(\d+)/i);k=[['Distanz',it.km?kmTxt(it.km):'–','km'],['Pace',p?p[1]:'–',p&&p[2]?'bis '+p[2]+' /km':'pro km'],['Puls',hr?hr[1]:'–','bpm höchstens']]}
  const sv=splitVal(it.v);
  return `<main class="page detail cta">${dhead(longDate(it.date))}<div class="stack">
  ${hero({lab:it.time+(it.loc?' · '+esc(it.loc):''),big:esc(it.t),val:esc(sv.val),unit:sv.unit,text:it.desc})}${abl}${kz(k)}
  ${rt?`<div class="card"><div class="s26 ct">route</div><span class="tag sb13">Andere Route</span>
    ${Maps.route(it.route,rt)}
    <div style="display:flex;align-items:flex-start;margin-top:14px"><span class="n20">${rt[0]} km</span><span class="n20" style="margin-left:18px">${rt[1]} Hm</span></div>
    <a class="pill sb13" style="margin-top:15px" href="https://www.google.com/maps/dir/?api=1&origin=${rt[3]}&destination=${rt[3]}&waypoints=${rt[4]}&travelmode=walking" target="_blank" rel="noopener">In Google Maps öffnen ${ic(IC.out,18)}</a></div>`:''}
  </div></main><div class="fix"><div class="in"><button class="ctab" data-act="done" data-id="${it.id}" data-back="1">${isDone(it)?'✓ Erledigt':'Als erledigt abhaken'}</button></div></div>`}

/* gelaufener Lauf */
const Hooks={banner:()=>'',daten:()=>'',after(){}};
const Maps={route:(key)=>`<img class="map" src="routes/${key}.jpg" alt="Karte der vorgeschlagenen Runde" style="aspect-ratio:317/182">`,
  run:r=>polySvg(r.poly)+'<p class="b12 gr" style="margin-top:10px">Nur die Spur. Die Karte dazu wird noch nicht automatisch gerechnet.</p>'};
function decodePoly(s){const pts=[];let i=0,lat=0,lon=0;while(i<s.length){for(const w of [0,1]){let sh=0,res=0,b;do{b=s.charCodeAt(i++)-63;res|=(b&31)<<sh;sh+=5}while(b>=32&&i<=s.length);const d=res&1?~(res>>1):res>>1;if(w)lon+=d;else lat+=d}pts.push([lat/1e5,lon/1e5])}return pts}
function polySvg(polys){const segs=polys.map(decodePoly).filter(p=>p.length>1);if(!segs.length)return '';const all=segs.flat(),la=all.map(p=>p[0]),lo=all.map(p=>p[1]),k=Math.cos(la[0]*Math.PI/180);
  const x0=Math.min(...lo)*k,x1=Math.max(...lo)*k,y0=Math.min(...la),y1=Math.max(...la),w=317,pd=22,sc=Math.min((w-2*pd)/((x1-x0)||1e-6),(260-2*pd)/((y1-y0)||1e-6)),h=Math.round((y1-y0)*sc+2*pd),ox=(w-(x1-x0)*sc)/2;
  const P=p=>`${(ox+(p[1]*k-x0)*sc).toFixed(1)},${(pd+(y1-p[0])*sc).toFixed(1)}`,st=segs[0][0];
  return `<svg class="map" viewBox="0 0 ${w} ${h}" style="aspect-ratio:${w}/${h}" role="img" aria-label="Gelaufene Strecke als Linie">${segs.map(s=>`<polyline points="${s.map(P).join(' ')}" fill="none" stroke="#F0431E" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}<circle cx="${P(st).split(',')[0]}" cy="${P(st).split(',')[1]}" r="6" fill="#17130F"/><circle cx="${P(st).split(',')[0]}" cy="${P(st).split(',')[1]}" r="2.5" fill="#EDE7DA"/></svg>`}
function runPage(r){const hr=r.hr||HR[r.id];if(!hr)loadHr(r.id);let map;
  const hmTag=`<div class="n20" style="position:absolute;right:18px;top:22px">${r.hm} Hm</div>`;
  if(r.map)map=hmTag+`<img class="map" src="maps/lauf-${r.map}.jpg" alt="Gelaufene Strecke auf der Karte" style="aspect-ratio:${r.ar}">`;
  else if(r.poly.length)map=hmTag+Maps.run(r);
  else map=`<p class="b15 gr" style="margin-top:15px">${r.note==='Laufband'?'Auf dem Laufband gelaufen, deshalb gibt es keine Karte.':'Ohne GPS-Spur, deshalb gibt es keine Karte.'}</p>`;
  return `<main class="page detail nonav">${dhead(r.date)}<div class="stack">
  ${hero({lab:esc(r.lab),big:r.big,val:r.km,unit:'km',text:r.text})}
  ${kz([['Ø Pace',r.pace,'pro km'],['Dauer',r.dur,r.du],['Ø Puls',hr||'–','bpm']])}
  <div class="card"><div class="s26 ct">strecke</div>${map}
    <a class="pill sb13" style="margin-top:14px" href="https://www.strava.com/activities/${r.strava}" target="_blank" rel="noopener">In Strava öffnen</a></div>
  </div></main>`}
function gymPage(g){const c=g.cmp;return `<main class="page detail nonav">${dhead(g.date)}<div class="stack">
  ${hero({bl:1,lab:'Erledigt · Hevy',big:esc(g.t),val:g.dur,unit:'Stunden',text:c.has?`Verglichen mit ${g.prevDate}.`:'Kein früheres Training zum Vergleichen.'})}
  ${c.has?`<div class="t3">${[['Gesteigert',c.up,'blu'],['Gleich',c.same,''],['Tiefer',c.down,'or']].map(q=>`<div><div class="lab">${q[0]}</div><div class="n50 ${q[2]}">${q[1]}</div><div class="s21">${q[1]===1?'Übung':'Übungen'}</div></div>`).join('')}</div>`:''}
  <div class="card list"><div class="s26 ct">übungen</div><div class="rows">${c.rows.map(x=>`<div class="rw"><div><div class="s21">${esc(x[0])}</div><div class="b12">${x[1]}</div></div>${c.has?`<span class="chip ${x[3]}">${x[2]}</span>`:''}</div>`).join('')}</div></div>
  </div></main>`}

V.erholung=()=>{if(REC.none)return `<main class="page">${head('Erholung')}<div class="stack">${hero({plain:1,lab:'Garmin',big:'Energie',val:'–',text:'Noch keine Garmin-Daten. Verbinde Garmin unter «Ich» bei «daten».'})}</div></main>${nav('erholung')}`;const R=REC,ph=R.phases,COL=['rgba(31,63,214,.9)','rgba(31,63,214,.45)','#17130F','rgba(110,101,87,.3)'];return `<main class="page">${head('Erholung')}<div class="stack">
  ${hero({bl:1,lab:(R.asof?'Stand '+R.asof:'Jetzt')+' · Body Battery',big:'Energie',val:R.energy??'–',unit:'von 100',extra:`<div class="bar" style="height:10px;border-radius:5px;background:rgba(223,214,196,.3);margin-top:16px"><i style="width:${R.energy||0}%;background:var(--card);border-radius:5px"></i></div>`,text:R.energyText||'Garmin hat noch keinen Energiestand geschickt.'}).replace('class="b15"','class="b15" style="margin-top:16px"')}
  <div class="card" style="padding-bottom:24px"><div class="s26 ct">schlaf</div>${R.score?`<div class="lab cr">Schlafwert ${R.score}</div>`:''}
    ${R.sleep?`<div style="display:flex;align-items:baseline;gap:10px;margin-top:9px"><span class="n50">${R.sleep}</span><span class="s21">Stunden</span></div>${R.sleepNote?`<p class="b12 gr" style="margin-top:10px">${R.sleepNote}</p>`:''}
    ${ph?`<div class="seg" style="margin-top:15px">${ph.map((s,i)=>`<i style="flex:${s[2]};background:${COL[i]}"></i>`).join('')}</div>
    <div style="margin-top:16px">${ph.map((s,i)=>`<div class="zr sb13" style="${i?'margin-top:14px':''}"><span class="sq" style="background:${COL[i]}"></span><span class="nm">${s[0]}</span><span>${s[1]} h</span></div>`).join('')}</div>`:''}`
    :`<p class="b15 gr" style="margin-top:15px">Für letzte Nacht ist bei Garmin noch kein Schlaf angekommen. Trag die Uhr nachts und synchronisiere sie am Morgen.</p>`}</div>
  <div class="card" style="padding-bottom:20px"><div class="s26 ct">sieben nächte</div><div class="lab cr">Schlafwert</div>
    <div class="days" style="margin-top:17px">${R.nights.map(n=>`<div class="day">${n[1]==null?'<span class="dot frei"></span>':`<span class="dot" style="background:rgba(31,63,214,${n[1]/100});color:${n[1]>=50?'var(--bg)':'var(--ink)'}">${n[1]}</span>`}<span class="b12" style="margin-top:8px">${n[0]}</span></div>`).join('')}</div></div>
  ${kz([['Ruhepuls',R.rhr||'–','bpm'],['Stress',R.stress||'–',R.asof&&!R.heute?'Ø Tag':'Ø heute'],['HRV',R.hrv||'–','ms']])}
  ${R.example?'<p class="b12 gr" style="padding:0 18px">Schlaf, Energiestand und HRV sind Beispielwerte, bis Garmin echte Daten liefert.</p>':''}
</div></main>${nav('erholung')}`};

V.ich=()=>{const z=PROFIL.ziel||{};return `<main class="page">${head(esc(PROFIL.name||'Ich'))}<div class="stack">
  ${z.name?hero({lab:'Ziel · '+new Date(z.datum+'T00:00:00').toLocaleDateString('de-CH',{day:'numeric',month:'long',year:'numeric'}),big:esc(z.wort||'Ziel'),val:esc(z.wert||''),unit:z.einheit,text:`Noch ${daysToRace()} Tage bis zum Start.`}):''}
  <div class="tiles">${tile('Max-Puls',PROFIL.maxPuls||'–','Schläge','or')}${tile('Serie',PROFIL.serie||'–','Wochen')}</div>
  <div class="card" style="padding-bottom:28px"><div class="s26 ct">pulszonen</div><div class="lab cr">locker bis ${ZB[1]}</div>
    <div class="seg" style="margin-top:17px">${ZONES.map(z=>`<i style="flex:${z[3]};background:${z[4]}"></i>`).join('')}</div>
    <div style="margin-top:20px">${ZONES.map((z,i)=>`<div class="zr sb13" style="${i?'margin-top:18px':''}"><span class="sq" style="background:${z[4]}"></span><span style="width:28px">${z[0]}</span><span class="nm gr">${z[1]}</span><span>${z[2]}</span></div>`).join('')}</div></div>
  ${BEST.length?`<div class="card list"><div class="s26 ct">bestzeiten</div><div class="rows">${BEST.map(b=>`<div class="rw"><div><div class="s21">${esc(b[0])}</div><div class="b12">${esc(b[1])}</div></div><div class="n20">${esc(b[2])}</div></div>`).join('')}</div></div>`:''}
  ${Hooks.daten()}
</div></main>${nav('ich')}`};
V.leer=()=>`<main class="page">${head('Nicht gefunden')}<p class="b15 gr" style="padding:0 18px">Diese Seite gibt es nicht mehr.</p></main>${nav('')}`;

/* ---------- Ablauf ---------- */
const route=()=>(location.hash||'#heute').slice(1);
function view(r){if(V[r])return V[r]();let m;
  if((m=r.match(/^geplant-(\d+)$/))&&M.evs[+m[1]]&&M.evs[+m[1]].k==='run')return planned(M.evs[+m[1]]);
  if(m=r.match(/^lauf-(.+)$/)){const x=M.runs.find(q=>q.id===m[1]);if(x)return runPage(x)}
  if(m=r.match(/^gym-(.+)$/)){const x=M.gyms.find(q=>q.id===m[1]&&q.cmp);if(x)return gymPage(x)}
  return V.leer()}
let dirty=false;
function fit(){document.querySelectorAll('.hero .big,.op .t').forEach(el=>{el.style.fontSize='';let s=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth+1&&s>28){s-=2;el.style.fontSize=s+'px'}})}
function render(keep){const a=document.activeElement;if(keep&&a&&a.matches&&a.matches('[data-note],.fld')){dirty=true;return}dirty=false;const y=window.scrollY;Hooks.before&&Hooks.before();document.getElementById('app').innerHTML=view(route());fit();Hooks.after();window.scrollTo(0,keep?y:0)}
function go(r){if(r===route()){render();return}S.stack.push(route());location.hash=r}
function back(){location.hash=S.stack.pop()||'heute'}
window.addEventListener('hashchange',()=>{if(!S.keep)S.lastDone=null;S.keep=false;render()});
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a){e.stopPropagation();act(a.dataset.act,a);return}
  if(e.target.closest('[data-note],a[href],.fld'))return;const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
document.addEventListener('input',e=>{if(e.target.matches('[data-note]')){S.notes[e.target.dataset.note]=e.target.value;mem.set('notes',S.notes)}});
document.addEventListener('focusout',e=>{if(e.target.matches&&e.target.matches('[data-note],.fld')&&dirty)setTimeout(()=>render(true),0)});
const ACT={
  done(el){const id=el.dataset.id;S.done[id]=!S.done[id];mem.set('done',S.done);S.lastDone=S.done[id]?id:null;S.noteOpen=false;if(el.dataset.back&&S.done[id]){S.stack=[];S.keep=true;location.hash='heute';return}render(true)},
  undo(){if(S.lastDone){S.done[S.lastDone]=false;mem.set('done',S.done);S.lastDone=null;render(true)}},
  note(){S.noteOpen=!S.noteOpen;render(true);const t=document.querySelector('[data-note]');if(t&&S.noteOpen)t.focus()},
  back(){back()},
  open(el){const i=+el.dataset.i;if(S.open===i){if(el.dataset.to)go(el.dataset.to);return}S.open=i;S.openUser=true;document.querySelectorAll('.it[data-i]').forEach(x=>x.classList.toggle('open',+x.dataset.i===i))},
  moreRuns(){S.moreRuns=!S.moreRuns;render(true)},moreGym(){S.moreGym=!S.moreGym;render(true)},
};
function act(n,el){if(ACT[n])ACT[n](el)}
setInterval(()=>{const c=document.getElementById('clock');if(c)c.textContent=clock()},20000);

render();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
