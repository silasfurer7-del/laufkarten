/* ================= Daten ohne Claude =================
   Strava direkt im Browser (Anmeldung einmal pro Gerät), Plan und Routen als Dateien aus dem Repo,
   Karten live aus den PMTiles. Persönliche Trainingsdaten bleiben auf dem Gerät. */
const CID=/*STRAVA_CLIENT_ID*/'';
const sv=()=>mem.get('strava',{});
const redirectUri=()=>location.origin+location.pathname;
let STRAVA_MSG='';

async function tokenPost(p){const r=await fetch('https://www.strava.com/oauth/token',{method:'POST',body:new URLSearchParams(p)});if(!r.ok)throw new Error('Strava lehnt die Anmeldung ab ('+r.status+'). Stimmen Client-ID und Client-Geheimnis?');return r.json()}
async function accessToken(){const c=sv();if(!c.refresh)throw new Error('Strava ist nicht verbunden.');if(c.access&&c.exp*1000>Date.now()+120e3)return c.access;
  const j=await tokenPost({client_id:c.cid,client_secret:c.secret,grant_type:'refresh_token',refresh_token:c.refresh});mem.set('strava',{...c,access:j.access_token,refresh:j.refresh_token||c.refresh,exp:j.expires_at});return j.access_token}
async function api(path){const t=await accessToken(),r=await fetch('https://www.strava.com/api/v3'+path,{headers:{Authorization:'Bearer '+t}});
  if(r.status===401){const c=sv();mem.set('strava',{...c,access:null});throw new Error('Strava hat den Zugang abgelehnt. Bitte neu verbinden.')}
  if(r.status===429)throw new Error('Strava-Limit erreicht. In 15 Minuten geht es wieder.');
  if(!r.ok)throw new Error('Strava antwortet mit Fehler '+r.status+'.');return r.json()}
const isGym=a=>/weight|workout|crossfit/i.test(a.sport_type||a.type||'');
const norm=(a,desc)=>({id:String(a.id),name:a.name||'',sport_type:a.sport_type||a.type||'',start_local:a.start_date_local,location_summary:'',description:desc[a.id]||'',avg_hr:a.average_heartrate||null,
  reduced_polyline:a.map&&a.map.summary_polyline||'',summary:{distance:(a.distance||0)/1000,moving_time:a.moving_time||0,elevation_gain:a.total_elevation_gain||0}});

let loading=false,lastLoad=0;
async function loadStrava(){if(!sv().refresh){ST.acts={s:'aus'};return}if(loading)return;loading=true;if(!RAW.acts)ST.acts={s:'laden'};
  try{const now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()),mon=monday(t0),ms=new Date(now.getFullYear(),now.getMonth(),1),a=addD(mon,-63),from=a<ms?a:ms;
    let list=[],page=1;for(;;){const part=await api(`/athlete/activities?after=${Math.floor(from/1000)}&per_page=100&page=${page}`);list=list.concat(part);if(part.length<100||page>=3)break;page++}
    const desc=mem.get('desc',{}),need=list.filter(x=>isGym(x)&&!(x.id in desc)).slice(-40);
    for(let i=0;i<need.length;i+=4){const got=await Promise.all(need.slice(i,i+4).map(x=>api('/activities/'+x.id).catch(()=>null)));
      got.forEach((d,k)=>{const x=need[i+k];if(!d)return;const txt=d.description||'';if(txt||Date.now()-Date.parse(x.start_date)>864e5)desc[x.id]=txt})}
    mem.set('desc',desc);RAW.acts=list.map(x=>norm(x,desc));lastLoad=Date.now();mem.set('acts',{at:lastLoad,list:RAW.acts});ST.acts={s:'live',at:lastLoad};STRAVA_MSG=''}
  catch(e){STRAVA_MSG=e.message||'Strava ist gerade nicht erreichbar.';ST.acts=RAW.acts?{s:'live',at:lastLoad,alt:true}:{s:'fehler'}}
  loading=false;rebuild();render(true)}
const setPlan=p=>{RAW.cal=p.events||[];ST.cal={s:'live',at:Date.parse(p.stand)||Date.now(),quelle:p.quelle}};
async function loadFiles(){
  try{const p=await (await fetch('plan.json',{cache:'no-store'})).json();setPlan(p);mem.set('plan',p)}catch(e){if(!RAW.cal)ST.cal={s:'fehler'}}
  try{const r=await (await fetch('routes.json')).json(),f=p=>p[0].toFixed(5)+','+p[1].toFixed(5),R={};
    for(const k in r){const q=r[k],pts=q.pts,idx=[];for(let i=1;i<=9;i++)idx.push(Math.round(i*(pts.length-1)/10));R[k]=[q.km,q.hm,null,f(pts[0]),idx.map(i=>f(pts[i])).join('%7C'),pts]}ROUTES=R}catch(e){}
  rebuild();render(true)}

/* ---------- Anmeldung ---------- */
ACT.strava=()=>{const g=id=>{const e=document.getElementById(id);return e?e.value.trim():''},cid=CID||g('cid'),secret=g('csec');
  if(!/^\d+$/.test(cid)||secret.length<20){STRAVA_MSG='Bitte Client-ID (Zahl) und Client-Geheimnis aus deiner Strava-API-Seite eintragen.';document.activeElement&&document.activeElement.blur();render(true);return}
  mem.set('strava',{cid,secret});location.href=`https://www.strava.com/oauth/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(redirectUri())}&response_type=code&approval_prompt=auto&scope=read,activity:read_all`};
ACT.trennen=()=>{mem.set('strava',{});mem.set('acts',null);RAW.acts=null;ST.acts={s:'aus'};rebuild();render(true)};
ACT.reload=()=>{loadFiles();loadStrava();loadGarmin()};
async function oauthReturn(){const q=new URLSearchParams(location.search),code=q.get('code'),err=q.get('error');if(!code&&!err)return;
  history.replaceState(null,'',location.pathname+'#ich');
  if(err){STRAVA_MSG='Die Anmeldung bei Strava wurde abgebrochen.';return}
  if(!/activity:read/.test(q.get('scope')||'')){STRAVA_MSG='Strava hat den Zugriff auf Aktivitäten nicht freigegeben. Bitte beim Verbinden das Häkchen lassen.';return}
  const c=sv();try{const j=await tokenPost({client_id:c.cid,client_secret:c.secret,code,grant_type:'authorization_code'});mem.set('strava',{...c,access:j.access_token,refresh:j.refresh_token,exp:j.expires_at});STRAVA_MSG=''}catch(e){STRAVA_MSG=e.message}}

/* ---------- Anzeige der Quellen ---------- */
const stand=t=>{const d=new Date(t),n=new Date();return (d.toDateString()===n.toDateString()?'':d.getDate()+'.'+(d.getMonth()+1)+'. ')+hm(d)};
Hooks.banner=()=>sv().refresh?'':`<button class="card" data-go="ich" style="display:block;width:100%;text-align:left"><div class="s26 ct">strava verbinden</div><p class="b15 gr" style="margin-top:8px">Damit Läufe, Gym und PR-Chancen erscheinen, einmal mit Strava anmelden.</p></button>`;
Hooks.daten=()=>{const on=!!sv().refresh,c=ST.cal,a=ST.acts;
  return `<div class="card"><div class="s26 ct">daten</div>
  <div style="margin-top:14px"><div class="sb13">Plan</div><div class="b12 gr" style="margin-top:2px">${c.s==='live'?`Aus dem ${c.quelle==='kalender'?'Kalender':'Startplan'} · Stand ${stand(c.at)}`:c.s==='fehler'?'Plan-Datei konnte nicht geladen werden.':'Wird geladen …'}</div></div>
  <div style="margin-top:12px"><div class="sb13">Strava</div><div class="b12 gr" style="margin-top:2px">${on?(a.s==='live'?`Verbunden · Stand ${stand(a.at)}`:a.s==='laden'?'Wird geladen …':'Verbunden'):'Nicht verbunden.'}</div>${STRAVA_MSG?`<div class="b12 or" style="margin-top:4px">${esc(STRAVA_MSG)}</div>`:''}</div>
  ${on?`<button class="pill sb13" style="margin-top:16px" data-act="reload">Neu laden</button><button class="pill sb13" style="margin-top:8px" data-act="trennen">Strava trennen</button>`
     :`${CID?'':'<input class="fld" id="cid" inputmode="numeric" autocomplete="off" placeholder="Client-ID">'}<input class="fld" id="csec" type="password" autocomplete="off" placeholder="Client-Geheimnis"><button class="pill sb13" style="margin-top:10px;background:var(--ink);color:var(--bg)" data-act="strava">Mit Strava verbinden</button>
       <p class="b12 gr" style="margin-top:10px">Beides steht auf strava.com/settings/api. Es wird nur auf diesem Gerät gespeichert.</p>`}
  <div style="margin-top:14px"><div class="sb13">Garmin</div>${garminCard()}</div></div>`};

/* ---------- Garmin: Export-ZIP auf dem Gerät einlesen ---------- */
let GMSG='',GDIAG={};const gm=()=>mem.get('garmin',null),RELAY=/*GARMIN_RELAY*/'',gk=()=>mem.get('gk',{});
function garminCard(){const g=gm(),on=!!gk().key,msg=GMSG?`<div class="b12 or" style="margin-top:4px">${esc(GMSG)}</div>`:'',line=t=>`<div class="b12 gr" style="margin-top:2px">${t}</div>`;
  if(on)return line(g&&g.live?`Verbunden · Stand ${stand(g.at)}`:'Verbunden')+msg+`<button class="pill sb13" style="margin-top:10px" data-act="garmintrennen">Garmin trennen</button>${Object.keys(GDIAG).length?'<button class="pill sb13" style="margin-top:8px" data-act="gdiag">Diagnose kopieren</button>':''}`;
  const exp=g?line(`Export geladen · Stand ${g.rec.asof}`):'';
  if(RELAY)return exp+line('Schlüssel von connect.garmin.com, Einstellungen, «Personal API Key». Er bleibt auf diesem Gerät.')+msg+`<input class="fld" id="gkey" type="password" autocomplete="off" placeholder="Garmin-Schlüssel"><button class="pill sb13" style="margin-top:10px;background:var(--ink);color:var(--bg)" data-act="garminlive">Mit Garmin verbinden</button>`;
  return (exp||line('Kein Live-Abruf. Du kannst deinen Garmin-Export (ZIP) laden, er bleibt auf diesem Gerät.'))+msg+`<button class="pill sb13" style="margin-top:10px" data-act="garmin">${g?'Neuen Export laden':'Garmin-Export laden'}</button>${g?'<button class="pill sb13" style="margin-top:8px" data-act="garminweg">Garmin-Daten löschen</button>':''}`}

/* ---------- Garmin live: Personal API über den Vermittler ---------- */
const dig=(o,...names)=>{const q=[o];let n=0;while(q.length&&n++<5000){const x=q.shift();if(!x||typeof x!=='object')continue;if(!Array.isArray(x))for(const k of names)if(typeof x[k]==='number')return Math.round(x[k]);for(const v of Array.isArray(x)?x:Object.values(x))if(v&&typeof v==='object')q.push(v)}return null};
const digV=(o,name,test)=>{const q=[o];let n=0;while(q.length&&n++<5000){const x=q.shift();if(!x||typeof x!=='object')continue;if(!Array.isArray(x)&&test(x[name]))return x[name];for(const v of Array.isArray(x)?x:Object.values(x))if(v&&typeof v==='object')q.push(v)}return null};
const gDate=x=>{const v=digV(x,'calendarDate',t=>typeof t==='string')||digV(x,'date',t=>typeof t==='string')||digV(x,'summaryDate',t=>typeof t==='string');return v?v.slice(0,10):null};
const gRows=o=>Array.isArray(o)?o:(o&&typeof o==='object'?Object.values(o).find(v=>Array.isArray(v)&&v.length&&typeof v[0]==='object')||[o]:[]);
const gScore=x=>{const s=digV(x,'sleepScores',t=>t&&typeof t==='object');if(s){const ov=s.overall,v=ov&&typeof ov==='object'?ov.value:ov;if(typeof v==='number')return Math.round(v);if(typeof s.overallScore==='number')return Math.round(s.overallScore)}return dig(x,'overallSleepScore','sleepScore','overallScore')};
const outline=(v,d=0)=>v===null?'null':Array.isArray(v)?`[${v.length}×${v.length?outline(v[0],d+1):''}]`:typeof v==='object'?(d>4?'{…}':'{'+Object.keys(v).slice(0,70).map(k=>k+':'+outline(v[k],d+1)).join(',')+'}'):typeof v;
async function gTok(force){const c=gk();if(!c.key)throw new Error('Garmin ist nicht verbunden.');if(!force&&c.token&&c.exp>Date.now()+3600e3)return c.token;
  const r=await fetch(RELAY+'/personalapitoken-service/personal-api/personal-api-key/token',{method:'POST',headers:{Authorization:'ApiKey '+c.key}});
  if(r.status===400||r.status===401||r.status===403){let b='';try{b=(await r.text()).replace(/\s+/g,' ').trim().slice(0,90)}catch(e){}throw Object.assign(new Error(`Garmin lehnt den Schlüssel ab (Antwort ${r.status}${b?': '+b:''}). Eingefügt waren ${c.key.length} Zeichen. Kopiere ihn frisch aus den Notizen, nur den Schlüssel.`),{auth:true})}
  if(!r.ok)throw new Error('Garmin antwortet mit Fehler '+r.status+'.');
  let t=(await r.text()).trim();if(t[0]==='{'){try{const j=JSON.parse(t);t=j.access_token||j.token||''}catch(e){}}t=t.replace(/^"|"$/g,'');if(!t)throw new Error('Garmin hat kein Zugangs-Token geschickt.');
  let exp=Date.now()+23*3600e3;try{exp=JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp*1000||exp}catch(e){}
  mem.set('gk',{...c,token:t,exp});return t}
async function gGet(name,path){const go=async f=>fetch(RELAY+path,{headers:{Authorization:'Bearer '+await gTok(f)}});let r=await go(false);if(r.status===401)r=await go(true);
  let j=null;try{const t=await r.text();j=t?JSON.parse(t):null}catch(e){}GDIAG[name]=r.status+' '+outline(j);return r.ok?j:null}
let gLoading=false,gLast=0;
async function loadGarmin(){if(!RELAY||!gk().key||gLoading)return;gLoading=true;GDIAG={};
  try{const now=new Date(),t=ymd(now),y=ymd(addD(now,-1)),w=ymd(addD(now,-6));await gTok(false);
    const [sum,bb,sl,sls,hrv,str]=await Promise.all([gGet('tag',`/usersummary-service/v2/dailysummaries?startDate=${t}&endDate=${t}`),gGet('batterie',`/wellness-service/wellness/bodyBattery/reports/daily?startDate=${y}&endDate=${t}`),gGet('schlaf',`/sleep-service/sleep/dailySleep?date=${t}`),
      gGet('naechte',`/sleep-service/sleep/dailySleepSummariesByDate?startDate=${w}&endDate=${t}`),gGet('hrv',`/hrv-service/hrv/${t}`),gGet('stress',`/usersummary-service/stats/stress/daily/${t}/${t}`)].map(p=>p.catch(()=>null)));
    if(Object.values(GDIAG).every(v=>!/^2/.test(v)))throw new Error('Garmin gibt keine Daten heraus ('+Object.values(GDIAG).map(v=>v.slice(0,3)).join(', ')+').');
    const day=gRows(sum).find(x=>gDate(x)===t)||gRows(sum).pop()||{},bat=gRows(bb).find(x=>gDate(x)===t)||gRows(bb).pop()||{},arr=digV(bat,'bodyBatteryValuesArray',Array.isArray)||[],lastV=arr.length?arr[arr.length-1]:null,
      lvl=Array.isArray(lastV)?(typeof lastV[2]==='number'?lastV[2]:typeof lastV[1]==='number'?lastV[1]:null):null;
    /* Feldnamen nach Garmins echten Antworten (17.11.2026): tag.data[].bodyBattery/heartRate/stress */
    const B=day.bodyBattery||{},n1=v=>typeof v==='number'?Math.round(v):null,energy=n1(B.latestValue)??dig(day,'bodyBatteryMostRecentValue','bodyBatteryLatestValue')??(lvl!=null?Math.round(lvl):null),wake=dig(day,'bodyBatteryAtWakeTime'),top=n1(B.maxValue),ch=n1(B.chargedValue)??dig(bat,'charged','chargedValue'),dr=n1(B.drainedValue)??dig(bat,'drained','drainedValue');
    const cur=sl&&gDate(sl)===t?sl:null,ph=cur?['deepSleepSeconds','lightSleepSeconds','remSleepSeconds','awakeSleepSeconds'].map(k=>dig(cur,k)):[],secs=cur?(dig(cur,'sleepTimeSeconds')??((ph[0]||0)+(ph[1]||0)+(ph[2]||0))):0;
    const nr=gRows(sls),nights=[];for(let i=6;i>=0;i--){const dt=addD(now,-i),k=ymd(dt),row=nr.find(x=>gDate(x)===k);nights.push([DOW[dt.getDay()].toUpperCase(),row?gScore(row):(i===0&&cur?gScore(cur):null)])}
    // Garmin kennt nur, was die Uhr zuletzt abgeglichen hat: Zeitpunkt der letzten Daten zeigen statt «Jetzt».
    const wc=day.wellnessChronology||{},loc=typeof wc.endTimestampLocal==='string'&&(wc.endTimestampLocal.match(/T(\d\d:\d\d)/)||[])[1],gmt=typeof wc.endTimestampGmt==='string'?Date.parse(wc.endTimestampGmt.replace(/\.\d+$/,'').replace(/Z$/,'')+'Z'):NaN,alt=gmt&&Date.now()-gmt>25*60e3&&Date.now()-gmt<864e5;
    const rec={heute:true,asof:loc||undefined,energy,energyText:[wake!=null?`Aufgewacht mit ${wake}.`:top!=null?`Höchststand heute ${top}.`:'',ch!=null?`${ch} geladen, ${dr??0} verbraucht.`:'',alt?'Seither hat die Uhr nicht abgeglichen.':''].filter(Boolean).join(' '),sleep:secs?hmm(secs):null,score:cur?gScore(cur):null,rhr:n1((day.heartRate||{}).restingValue)??dig(day,'restingHeartRate','restingHeartRateInBeatsPerMinute'),stress:n1((day.stress||{}).avgLevel)??dig(day,'averageStressLevel')??dig(str,'overallStressLevel','averageStressLevel'),hrv:dig(hrv,'lastNightAvg'),nights,
      phases:secs&&ph[0]!=null?[['Tief',ph[0]],['Leicht',ph[1]],['REM',ph[2]],['Wach',ph[3]]].map(q=>[q[0],hmm(q[1]||0),Math.max(1,Math.round((q[1]||0)/60))]):null};
    gLast=Date.now();mem.set('garmin',{at:gLast,rec,live:true});GMSG=rec.energy==null&&rec.rhr==null&&!rec.sleep?'Verbunden, aber Garmin hat für heute noch keine Werte.':'';if(rec.energy!=null&&rec.rhr!=null)GDIAG={}}
  catch(e){GMSG=e.message||'Garmin ist gerade nicht erreichbar.';if(e.auth){mem.set('gk',{});GDIAG={}}}
  gLoading=false;useGarmin();rebuild();render(true)}
ACT.garminlive=()=>{const e=document.getElementById('gkey'),key=e?e.value.replace(/\s+/g,'').replace(/^ApiKey:?/i,''):'';if(/[^\x21-\x7e]/.test(key)){GMSG='Im eingefügten Text sind Sonderzeichen, die in einem Schlüssel nicht vorkommen. Kopiere ihn frisch aus den Notizen.';render(true);return}if(key.length<20){GMSG='Bitte den ganzen Garmin-Schlüssel einfügen.';render(true);return}document.activeElement&&document.activeElement.blur();mem.set('gk',{key});GMSG='Verbinde …';render(true);loadGarmin()};
ACT.garmintrennen=()=>{mem.set('gk',{});mem.set('garmin',null);GMSG='';GDIAG={};useGarmin();rebuild();render(true)};
ACT.gdiag=async()=>{const t='Garmin-Diagnose (nur Feldnamen, keine Werte)\n'+Object.entries(GDIAG).map(([k,v])=>k+': '+v).join('\n');try{await navigator.clipboard.writeText(t);GMSG='Kopiert. Füge es im Chat ein.'}catch(e){GMSG=t}render(true)};
async function unzip(buf,want){const v=new DataView(buf),td=new TextDecoder(),out=[];let e=buf.byteLength-22;while(e>=0&&v.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('Das ist keine ZIP-Datei.');
  let p=v.getUint32(e+16,true);const cnt=v.getUint16(e+10,true);
  for(let i=0;i<cnt&&v.getUint32(p,true)===0x02014b50;i++){const method=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),lo=v.getUint32(p+42,true),name=td.decode(new Uint8Array(buf,p+46,nl));p+=46+nl+v.getUint16(p+30,true)+v.getUint16(p+32,true);
    if(!want.test(name))continue;const raw=new Uint8Array(buf,lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true),cs);
    out.push([name,method===0?td.decode(raw):await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()])}
  return out}
function garminRec(files){const all=re=>files.filter(f=>re.test(f[0])).flatMap(f=>{try{const j=JSON.parse(f[1]);return Array.isArray(j)?j:[]}catch(e){return []}}),byDate=a=>a.filter(x=>x&&x.calendarDate).sort((x,y)=>x.calendarDate<y.calendarDate?-1:1),num=v=>typeof v==='number'?Math.round(v):null;
  const sl=byDate(all(/sleepData\.json$/)).filter(x=>x.sleepStartTimestampGMT),days=byDate(all(/UDSFile[^/]*\.json$/)),hs=byDate(all(/healthStatusData\.json$/));
  if(!sl.length&&!days.length)throw new Error('Im ZIP sind keine Schlaf- oder Tagesdaten von Garmin Connect.');
  const d=days[days.length-1]||{},last=sl[sl.length-1],bb=d.bodyBattery||{},stat=t=>{const q=(bb.bodyBatteryStatList||[]).find(x=>x.bodyBatteryStatType===t);return q?num(q.statsValue):null},st=((d.allDayStress||{}).aggregatorList||[]).find(x=>x.type==='TOTAL');
  const end=[d.calendarDate,last&&last.calendarDate].filter(Boolean).sort().pop(),[Y,Mo,D]=end.split('-').map(Number),e0=new Date(Y,Mo-1,D),sc=x=>x&&x.sleepScores?num(x.sleepScores.overallScore):null;
  const nights=[];for(let i=6;i>=0;i--){const dt=addD(e0,-i),row=sl.find(x=>x.calendarDate===ymd(dt));nights.push([DOW[dt.getDay()].toUpperCase(),sc(row)])}
  const cur=last&&last.calendarDate===end?last:null,secs=cur?(cur.deepSleepSeconds||0)+(cur.lightSleepSeconds||0)+(cur.remSleepSeconds||0):0,hv=hs.filter(x=>x.calendarDate===end).flatMap(x=>x.metrics||[]).find(m=>m.type==='HRV'),wake=stat('SLEEPEND'),ch=num(bb.chargedValue),dr=num(bb.drainedValue);
  return {asof:D+'.'+Mo+'.',energy:stat('MOSTRECENT'),energyText:[wake!=null?`Aufgewacht mit ${wake}.`:'',ch!=null?`${ch} geladen, ${dr??0} verbraucht.`:''].filter(Boolean).join(' '),sleep:secs?hmm(secs):null,score:sc(cur),rhr:num(d.restingHeartRate),stress:st?num(st.averageStressLevel):null,hrv:hv?num(hv.value):null,nights,
    phases:secs?[['Tief',cur.deepSleepSeconds],['Leicht',cur.lightSleepSeconds],['REM',cur.remSleepSeconds],['Wach',cur.awakeSleepSeconds]].map(q=>[q[0],hmm(q[1]||0),Math.max(1,Math.round((q[1]||0)/60))]):null}}
function useGarmin(){const g=gm();RAW.rec=g&&g.rec||null;ST.rec=g?{s:'live',at:g.at}:{s:'aus'}}
ACT.garmin=()=>{const old=document.getElementById('gzip');if(old)old.remove();const i=document.createElement('input');i.type='file';i.id='gzip';i.accept='.zip,application/zip';i.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.appendChild(i);
  i.onchange=async()=>{const f=i.files&&i.files[0];i.remove();if(!f)return;GMSG='Wird gelesen …';render(true);
    try{const files=await unzip(await f.arrayBuffer(),/(sleepData|healthStatusData|UDSFile[^/]*)\.json$/);mem.set('garmin',{at:Date.now(),rec:garminRec(files)});GMSG=''}catch(e){GMSG=e.message||'Die Datei konnte nicht gelesen werden.'}
    useGarmin();rebuild();render(true)};i.click()};
ACT.garminweg=()=>{mem.set('garmin',null);GMSG='';useGarmin();rebuild();render(true)};

/* ---------- Karten live aus den PMTiles ---------- */
const SW={motorway:2.6,trunk:2.4,primary:2.2,secondary:2,tertiary:1.7,residential:1.2,unclassified:1.2,living_street:1.2,pedestrian:1,service:.7},DASH=['track','path','footway','cycleway','steps'];
const mapStyle=()=>({version:8,sources:{t:{type:'vector',url:'pmtiles://'+new URL('karte.pmtiles',location.href).href,attribution:'© OpenStreetMap-Mitwirkende'}},layers:[
  {id:'bg',type:'background',paint:{'background-color':'#eef0e6'}},
  {id:'land',type:'fill',source:'t','source-layer':'land',paint:{'fill-color':['match',['get','kind'],['forest','wood'],'#c9dfb4',['meadow','grass'],'#e3ecd2','farmland','#eef0e0','residential','#e6e3dd','orchard','#d8e7c2','rgba(0,0,0,0)']}},
  {id:'wasser',type:'fill',source:'t','source-layer':'water_polygons',paint:{'fill-color':'#aad3df'}},
  {id:'bach',type:'line',source:'t','source-layer':'water_lines',filter:['!=',['get','tunnel'],true],paint:{'line-color':'#aad3df','line-width':1}},
  {id:'haus',type:'fill',source:'t','source-layer':'buildings',minzoom:13,paint:{'fill-color':'#d4cfc7'}},
  {id:'weg',type:'line',source:'t','source-layer':'streets',minzoom:12,filter:['all',['in',['get','kind'],['literal',DASH]],['!=',['get','rail'],true]],paint:{'line-color':'#9a8f80','line-width':['interpolate',['linear'],['zoom'],12,.5,16,1.4],'line-dasharray':[2,1.5]}},
  {id:'strasse',type:'line',source:'t','source-layer':'streets',filter:['all',['in',['get','kind'],['literal',Object.keys(SW)]],['!=',['get','rail'],true]],layout:{'line-cap':'round','line-join':'round'},
    paint:{'line-color':'#fff','line-width':['interpolate',['exponential',1.6],['zoom'],10,['*',.45,['match',['get','kind'],...Object.entries(SW).flat(),1]],14,['*',1.5,['match',['get','kind'],...Object.entries(SW).flat(),1]],17,['*',5,['match',['get','kind'],...Object.entries(SW).flat(),1]]]}}]});
let LIVE=[],MAPSEGS=null,PROTO=false;
Hooks.before=()=>{LIVE.forEach(m=>{try{m.remove()}catch(e){}});LIVE=[]};
Maps.route=(key,rt)=>{MAPSEGS=[rt[5]];return '<div class="map live" data-live></div>'};
Maps.run=r=>{MAPSEGS=r.poly.map(decodePoly);return '<div class="map live" data-live></div>'};
Hooks.after=()=>{const el=document.querySelector('[data-live]');if(!el||!MAPSEGS)return;const segs=MAPSEGS.filter(s=>s&&s.length>1);if(!segs.length)return;
  if(!window.maplibregl||!window.pmtiles){el.innerHTML='<p class="b12 gr" style="padding:14px">Die Karte konnte nicht geladen werden.</p>';return}
  if(!PROTO){maplibregl.addProtocol('pmtiles',new pmtiles.Protocol().tile);PROTO=true}
  const all=segs.flat(),la=all.map(p=>p[0]),lo=all.map(p=>p[1]);
  const map=new maplibregl.Map({container:el,style:mapStyle(),bounds:[[Math.min(...lo),Math.min(...la)],[Math.max(...lo),Math.max(...la)]],fitBoundsOptions:{padding:30},maxZoom:17,minZoom:9,
    cooperativeGestures:true,dragRotate:false,pitchWithRotate:false,touchPitch:false,attributionControl:false,
    locale:{'CooperativeGesturesHandler.MobileHelpText':'Mit zwei Fingern verschieben','CooperativeGesturesHandler.WindowsHelpText':'Strg + Scrollen zum Zoomen','CooperativeGesturesHandler.MacHelpText':'⌘ + Scrollen zum Zoomen'}});
  map.touchZoomRotate&&map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({compact:true}));
  map.on('load',()=>{
    map.addSource('r',{type:'geojson',data:{type:'FeatureCollection',features:segs.map(s=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:s.map(p=>[p[1],p[0]])}}))}});
    map.addLayer({id:'r0',type:'line',source:'r',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff','line-width':6.5}});
    map.addLayer({id:'r1',type:'line',source:'r',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#F0431E','line-width':3.5}});
    const st=document.createElement('div');st.className='mstart';new maplibregl.Marker({element:st}).setLngLat([segs[0][0][1],segs[0][0][0]]).addTo(map);
    map.once('idle',()=>{const seen=new Set();for(const f of map.querySourceFeatures('t',{sourceLayer:'place_labels'})){const p=f.properties;if(!p.name||seen.has(p.name)||!['city','town','village','hamlet','suburb'].includes(p.kind))continue;seen.add(p.name);
      const d=document.createElement('div');d.className='ml'+(['city','town','village'].includes(p.kind)?' big':'');d.textContent=p.name;new maplibregl.Marker({element:d}).setLngLat(f.geometry.coordinates).addTo(map)}})});
  LIVE.push(map)};

/* ---------- Neue Fassung der App von selbst holen ---------- */
// GitHub Pages lässt den Browser die Seite bis zu 10 Minuten zwischenspeichern. Darum beim Öffnen prüfen,
// ob es eine neuere Fassung gibt, sie am Zwischenspeicher vorbei laden und einmal neu starten.
const VERSION=/*VERSION*/'';
async function checkVersion(){if(!VERSION)return;try{const v=(await (await fetch('version.txt',{cache:'no-store'})).text()).trim();if(!v||v===VERSION||v.length>80)return;
  let seen='';try{seen=sessionStorage.getItem('ss.v')||''}catch(e){}if(seen===v)return;const a=document.activeElement;if(a&&a.matches&&a.matches('.fld,[data-note]'))return;
  try{sessionStorage.setItem('ss.v',v)}catch(e){return}await fetch(location.pathname,{cache:'reload'}).catch(()=>{});location.reload()}catch(e){}}

/* ---------- Start ---------- */
(async()=>{const c=mem.get('acts',null),pl=mem.get('plan',null);if(pl&&pl.events)setPlan(pl);else ST.cal={s:'laden'};useGarmin();if(c&&c.list&&sv().refresh){RAW.acts=c.list;lastLoad=c.at;ST.acts={s:'live',at:c.at}}rebuild();
  await oauthReturn();render();checkVersion();loadFiles();loadStrava();loadGarmin()})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion();if(!document.hidden&&Date.now()-lastLoad>90e3){loadFiles();loadStrava()}if(!document.hidden&&Date.now()-gLast>90e3)loadGarmin()});
