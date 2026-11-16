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
async function loadFiles(){
  try{const p=await (await fetch('plan.json',{cache:'no-store'})).json();RAW.cal=p.events||[];ST.cal={s:'live',at:Date.parse(p.stand)||Date.now(),quelle:p.quelle}}catch(e){ST.cal={s:'fehler'}}
  try{const r=await (await fetch('routes.json')).json(),f=p=>p[0].toFixed(5)+','+p[1].toFixed(5),R={};
    for(const k in r){const q=r[k],pts=q.pts,idx=[];for(let i=1;i<=9;i++)idx.push(Math.round(i*(pts.length-1)/10));R[k]=[q.km,q.hm,null,f(pts[0]),idx.map(i=>f(pts[i])).join('%7C'),pts]}ROUTES=R}catch(e){}
  rebuild();render(true)}

/* ---------- Anmeldung ---------- */
ACT.strava=()=>{const g=id=>{const e=document.getElementById(id);return e?e.value.trim():''},cid=CID||g('cid'),secret=g('csec');
  if(!/^\d+$/.test(cid)||secret.length<20){STRAVA_MSG='Bitte Client-ID (Zahl) und Client-Geheimnis aus deiner Strava-API-Seite eintragen.';document.activeElement&&document.activeElement.blur();render(true);return}
  mem.set('strava',{cid,secret});location.href=`https://www.strava.com/oauth/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(redirectUri())}&response_type=code&approval_prompt=auto&scope=read,activity:read_all`};
ACT.trennen=()=>{mem.set('strava',{});mem.set('acts',null);RAW.acts=null;ST.acts={s:'aus'};rebuild();render(true)};
ACT.reload=()=>{loadFiles();loadStrava()};
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
  <div style="margin-top:14px"><div class="sb13">Garmin</div><div class="b12 gr" style="margin-top:2px">In dieser Fassung nicht verfügbar.</div></div></div>`};

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

/* ---------- Start ---------- */
(async()=>{const c=mem.get('acts',null);if(c&&c.list&&sv().refresh){RAW.acts=c.list;lastLoad=c.at;ST.acts={s:'live',at:c.at};rebuild()}
  await oauthReturn();render();loadFiles();loadStrava()})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastLoad>90e3){loadFiles();loadStrava()}});
