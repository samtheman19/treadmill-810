const STORAGE_KEY="treadmill810.v5";
const pad2=n=>String(n).padStart(2,"0");
const esc=s=>(s??"").toString().replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const paceFromKmh=kmh=>{if(!kmh||kmh<=0)return"—";const spk=Math.round(3600/kmh);return`${Math.floor(spk/60)}:${pad2(spk%60)}/km`};
const fmtHMS=ms=>{const t=Math.max(0,Math.floor(ms/1000));const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;return`${pad2(h)}:${pad2(m)}:${pad2(s)}`};
const todayKey=()=>{const d=new Date();return`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`};
const dayKeyFromDate=()=>["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
const beep=()=>{try{const c=new (window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.type="sine";o.frequency.value=880;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.07,c.currentTime);o.start();o.stop(c.currentTime+.18)}catch(_){}};
const haptic=()=>{try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}};
const clampInt=(n,min,max)=>{const x=parseInt(n,10);if(Number.isNaN(x))return min;return Math.max(min,Math.min(max,x))};
const clampWeek=n=>clampInt(n,1,5);

const DAYS=[
 {key:"mon",label:"Mon – Strength A",type:"strength"},
 {key:"tue",label:"Tue – Intervals",type:"run"},
 {key:"wed",label:"Wed – Mobility / Rest",type:"rest"},
 {key:"thu",label:"Thu – Easy + Strides",type:"run"},
 {key:"fri",label:"Fri – Strength B",type:"strength"},
 {key:"sat",label:"Sat – Tempo / Race",type:"run"},
 {key:"sun",label:"Sun – Rest",type:"rest"}
];

const STRENGTH={
 mon:{title:"Mon – Strength A",warmup:["3 min easy walk or jog","Leg swings 10 each direction","Ankle & calf mobility 60 sec"],
  exercises:[
   {id:"trap_deadlift",name:"Trap Bar Deadlift",sets:4,targetReps:3,note:"Fast reps, no grind"},
   {id:"bss",name:"Bulgarian Split Squat",sets:3,targetReps:5,note:"Each leg"},
   {id:"box_jumps",name:"Box Jumps",sets:3,targetReps:3,note:"Reset each rep"},
   {id:"calf_raise",name:"Standing Calf Raises",sets:3,targetReps:10,note:"Slow eccentric"}
  ],
  mobility:["Couch stretch – 1 min/side","Calf stretch – 1 min/side","Glute stretch – 1 min/side"]
 },
 fri:{title:"Fri – Strength B",warmup:["5 min easy bike","Band pull-aparts"],
  exercises:[
   {id:"bench",name:"Bench Press / Push-ups",sets:4,targetReps:5,note:"Controlled"},
   {id:"pull",name:"Pull-ups / Lat pulldown",sets:4,targetReps:6,note:"Full ROM"},
   {id:"hip_thrust",name:"Hip Thrusts",sets:3,targetReps:6,note:"Lockout"},
   {id:"ham_curl",name:"Hamstring Curls",sets:3,targetReps:5,note:"Strong squeeze"},
   {id:"core",name:"Core",sets:3,targetReps:30,note:"seconds"}
  ],
  mobility:["Hip flexor stretch – 1 min/side","Thoracic rotations – 10/side"]
 }
};

const RUN={
 tue:{title:"Tue – Intervals",warmup:["Incline 1.0%","3 min jog","A-skips ×2","High knees ×2","2×20s build-ups"],
  weeks:{
   1:{workSec:95,restSec:90,rounds:6,workKmh:15.0,restKmh:10.0,incline:"1.0%",note:"Speed endurance (≈400m reps)"},
   2:{workSec:120,restSec:90,rounds:5,workKmh:15.0,restKmh:10.0,incline:"1.0%",note:"Progression"},
   3:{workSec:145,restSec:120,rounds:4,workKmh:15.0,restKmh:10.0,incline:"1.0%",note:"Longer reps"},
   4:{workSec:190,restSec:150,rounds:3,workKmh:14.7,restKmh:10.0,incline:"1.0%",note:"800m reps @ race pace"},
   5:{workSec:75,restSec:90,rounds:4,workKmh:15.5,restKmh:10.0,incline:"1.0%",note:"Sharpening"}
  },
  mobility:["Calf stretch – 1 min/side"]
 },
 thu:{title:"Thu – Easy + Strides",warmup:["Incline 1.0%","3 min jog","Leg swings","A-skips ×2","High knees ×2"],
  easy:{minutes:25,kmhMin:11.5,kmhMax:12.0,incline:"1.0%"},
  strides:{rounds:5,workSec:20,restSec:40,workKmh:15.5,restKmh:10.0,incline:"1.0%"},
  mobility:["Calf stretch – 1 min/side","Glute stretch – 1 min/side"]
 },
 sat:{title:"Sat – Tempo / Race",warmup:["Incline 1.0%","3 min jog","2×20s build-ups"],
  weeks:{
   1:{kind:"steady",distanceKm:2.0,kmh:14.3,incline:"1.0%",note:"Controlled tempo"},
   2:{kind:"steady",distanceKm:2.5,kmh:14.4,incline:"1.0%",note:"Controlled tempo"},
   3:{kind:"steady",distanceKm:3.0,kmh:14.5,incline:"1.0%",note:"Controlled tempo"},
   4:{kind:"reps",rounds:2,repKm:1.0,kmh:14.7,restSec:120,restKmh:10.0,incline:"1.0%",note:"2×1km @ race pace"},
   5:{kind:"tt",distanceKm:2.0,kmh:14.7,incline:"1.0%",note:"2km time trial"}
  },
  mobility:["Couch stretch – 1 min/side","Calf stretch – 1 min/side"]
 }
};

function loadState(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw) return {currentDay:"mon",week:1,autoRest:true,restDefaultSec:90,strengthLogs:{},workoutSessions:{},completedDates:[]};
  const s=JSON.parse(raw);
  return {
   currentDay:s.currentDay||"mon",
   week:clampWeek(s.week),
   autoRest:s.autoRest!==false,
   restDefaultSec:clampInt(s.restDefaultSec??90,10,600),
   strengthLogs:s.strengthLogs||{},
   workoutSessions:s.workoutSessions||{},
   completedDates:Array.isArray(s.completedDates)?s.completedDates:[]
  };
 }catch{
  return {currentDay:"mon",week:1,autoRest:true,restDefaultSec:90,strengthLogs:{},workoutSessions:{},completedDates:[]};
 }
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
const state=loadState();

const daySelect=document.getElementById("daySelect");
const sessionCard=document.getElementById("sessionCard");
const resetDayBtn=document.getElementById("resetDayBtn");
const resetWeekBtn=document.getElementById("resetWeekBtn");

const workSecEl=document.getElementById("workSec");
const restSecEl=document.getElementById("restSec");
const roundsEl=document.getElementById("rounds");
const setIntervalPreset=p=>{if(!workSecEl||!restSecEl||!roundsEl||!p) return; workSecEl.value=p.workSec; restSecEl.value=p.restSec; roundsEl.value=p.rounds;};

daySelect.innerHTML="";
DAYS.forEach(d=>{const o=document.createElement("option");o.value=d.key;o.textContent=d.label;daySelect.appendChild(o)});
daySelect.value=state.currentDay;function getWorkoutSession(dateK){
 state.workoutSessions[dateK]=state.workoutSessions[dateK]||{running:false,startTs:null,elapsedMs:0};
 return state.workoutSessions[dateK];
}
const workoutNowMs=dateK=>{
 const ws=getWorkoutSession(dateK);
 if(!ws.running||!ws.startTs) return ws.elapsedMs||0;
 return (ws.elapsedMs||0)+(Date.now()-ws.startTs);
};
let workoutTickId=null;
function pumpWorkoutTimer(dateK){
 if(workoutTickId) clearInterval(workoutTickId);
 workoutTickId=setInterval(()=>{
  const el=document.getElementById("workoutClock");
  const st=document.getElementById("workoutStatus");
  if(!el||!st) return;
  el.textContent=fmtHMS(workoutNowMs(dateK));
  const ws=getWorkoutSession(dateK);
  st.textContent=ws.running?"Running":"Paused";
 },250);
}
function startWorkoutTimer(dateK){
 const ws=getWorkoutSession(dateK);
 if(ws.running) return;
 ws.running=true; ws.startTs=Date.now();
 saveState(); pumpWorkoutTimer(dateK);
}
function pauseWorkoutTimer(dateK){
 const ws=getWorkoutSession(dateK);
 if(!ws.running) return;
 ws.elapsedMs=workoutNowMs(dateK);
 ws.running=false; ws.startTs=null;
 saveState();
}
function endWorkoutTimer(dateK){
 const ws=getWorkoutSession(dateK);
 ws.elapsedMs=workoutNowMs(dateK);
 ws.running=false; ws.startTs=null;
 saveState();
 if(!state.completedDates.includes(dateK)){
  state.completedDates.push(dateK);
  state.completedDates.sort();
  saveState();
 }
}
function computeStreak(){
 const set=new Set(state.completedDates);
 let streak=0; let d=new Date();
 while(true){
  const k=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  if(!set.has(k)) break;
  streak++; d.setDate(d.getDate()-1);
 }
 return streak;
}

/* Rest timer */
let restTimer={running:false,left:0,id:null};
function restRender(){
 const el=document.getElementById("restClock");
 const st=document.getElementById("restStatus");
 if(!el||!st) return;
 const mmss=fmtHMS(restTimer.left*1000).slice(3);
 el.textContent=mmss;
 st.textContent=restTimer.running?"Resting…":(restTimer.left<=0?"Done ✅":"Ready");
}
function restSet(sec){restTimer.left=sec; state.restDefaultSec=sec; saveState(); restRender();}
function restStart(){
 if(restTimer.running) return;
 if(restTimer.left<=0) restTimer.left=state.restDefaultSec||90;
 restTimer.running=true; restRender();
 restTimer.id=setInterval(()=>{
  restTimer.left-=1; restRender();
  if(restTimer.left<=0){
   clearInterval(restTimer.id); restTimer.id=null; restTimer.running=false; restRender();
   beep(); haptic();
  }
 },1000);
}
function restPause(){ if(!restTimer.running) return; clearInterval(restTimer.id); restTimer.id=null; restTimer.running=false; restRender(); }
function restReset(){
 if(restTimer.id) clearInterval(restTimer.id);
 restTimer.id=null; restTimer.running=false;
 restTimer.left=state.restDefaultSec||90; restRender();
}

/* Strength logs */
function ensureStrengthLog(week,dayKey){
 state.strengthLogs[week]=state.strengthLogs[week]||{};
 state.strengthLogs[week][dayKey]=state.strengthLogs[week][dayKey]||{};
 return state.strengthLogs[week][dayKey];
}
function getSetLog(week,dayKey,exId,setIdx,defaultReps){
 const dayLogs=ensureStrengthLog(week,dayKey);
 dayLogs[exId]=dayLogs[exId]||[];
 dayLogs[exId][setIdx]=dayLogs[exId][setIdx]||{kg:"",reps:String(defaultReps??""),done:false};
 return dayLogs[exId][setIdx];
}
function getPrevSetLog(prevWeek,dayKey,exId,setIdx){
 if(prevWeek<1) return null;
 const w=state.strengthLogs[prevWeek]; if(!w) return null;
 const d=w[dayKey]; if(!d) return null;
 const arr=d[exId]; if(!arr||!arr[setIdx]) return null;
 return arr[setIdx];
}function renderStrength(dayKey){
 const plan=STRENGTH[dayKey], week=state.week, prevWeek=week-1;
 const exBlocks=plan.exercises.map(ex=>{
  const rows=Array.from({length:ex.sets}).map((_,sIdx)=>{
   const cur=getSetLog(week,dayKey,ex.id,sIdx,ex.targetReps);
   const prev=getPrevSetLog(prevWeek,dayKey,ex.id,sIdx);
   const prevText=prev?`Last wk: ${esc(prev.kg||"—")}kg × ${esc(prev.reps||"—")}`:"Last wk: —";
   return `
    <div style="display:grid;grid-template-columns:54px 1fr 1fr 60px;gap:8px;align-items:center;margin-top:8px">
      <div class="muted">#${sIdx+1}</div>
      <input id="kg_${ex.id}_${sIdx}" inputmode="decimal" placeholder="kg" value="${esc(cur.kg)}" style="text-align:right" />
      <input id="reps_${ex.id}_${sIdx}" inputmode="numeric" placeholder="${ex.targetReps}" value="${esc(cur.reps)}" style="text-align:right" />
      <div style="text-align:right"><input id="done_${ex.id}_${sIdx}" type="checkbox" ${cur.done?"checked":""} style="width:18px;height:18px" /></div>
      <div class="muted" style="grid-column:1/-1;margin-left:54px;font-size:12px">${prevText}</div>
    </div>`;
  }).join("");
  return `
   <div style="border:1px solid #26262a;border-radius:16px;padding:12px;margin-top:12px">
    <div><div style="font-weight:800;font-size:15px">${esc(ex.name)}</div>
    <div class="muted">${esc(ex.sets)} sets • target reps: ${esc(ex.targetReps)} • ${esc(ex.note)}</div></div>
    <div style="height:1px;background:#26262a;margin:10px 0"></div>
    <div class="muted" style="display:grid;grid-template-columns:54px 1fr 1fr 60px;gap:8px">
      <div><strong>Set</strong></div><div style="text-align:right"><strong>kg</strong></div>
      <div style="text-align:right"><strong>reps</strong></div><div style="text-align:right"><strong>Done</strong></div>
    </div>${rows}
   </div>`;
 }).join("");

 return `
  <div class="title"><div><strong>${esc(plan.title)}</strong>
   <div class="muted">kg + reps (pre-filled) per set. Tick done to track.</div></div></div>
  <div class="hr"></div>
  <div class="muted"><strong>Warm-up</strong></div>
  <ul class="muted">${plan.warmup.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
  <div class="hr"></div>
  <div class="muted"><strong>Main</strong></div>${exBlocks}
  <div class="hr"></div>
  <div class="muted"><strong>Rest timer</strong></div>
  <div id="restControls" style="margin-top:10px">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button id="rt60" type="button">60s</button>
      <button id="rt90" type="button">90s</button>
      <button id="rt120" type="button">120s</button>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="rtCustom" type="number" min="10" step="5" style="width:90px;text-align:right" />
        <span class="muted">sec</span>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div id="restClock" style="font-size:34px;font-weight:900;font-variant-numeric:tabular-nums">00:00</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button id="rtStart" class="primary" type="button">Start</button>
        <button id="rtPause" type="button">Pause</button>
        <button id="rtReset" type="button">Reset</button>
      </div>
    </div>
    <div id="restStatus" class="muted" style="margin-top:6px">Ready</div>
  </div>
  <div class="hr"></div>
  <div class="muted"><strong>Mobility</strong></div>
  <ul class="muted">${plan.mobility.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
}

function bindStrengthInputs(dayKey){
 const plan=STRENGTH[dayKey], week=state.week;
 plan.exercises.forEach(ex=>{
  for(let sIdx=0;sIdx<ex.sets;sIdx++){
   const kgEl=document.getElementById(`kg_${ex.id}_${sIdx}`);
   const repsEl=document.getElementById(`reps_${ex.id}_${sIdx}`);
   const doneEl=document.getElementById(`done_${ex.id}_${sIdx}`);
   const cur=getSetLog(week,dayKey,ex.id,sIdx,ex.targetReps);
   kgEl.oninput=()=>{cur.kg=kgEl.value; saveState();};
   repsEl.oninput=()=>{cur.reps=repsEl.value; saveState();};
   doneEl.onchange=()=>{cur.done=!!doneEl.checked; saveState(); haptic(); if(cur.done&&state.autoRest){restSet(state.restDefaultSec||90); restStart();}};
  }
 });
}

function renderRun(dayKey){
 const week=state.week;
 if(dayKey==="tue"){
  const p=RUN.tue.weeks[week];
  setIntervalPreset({workSec:p.workSec,restSec:p.restSec,rounds:p.rounds});
  return `
   <div class="title"><div><strong>${esc(RUN.tue.title)}</strong>
    <div class="muted">Incline ${esc(p.incline)} • km/h + pace shown</div></div></div>
   <div class="hr"></div>
   <div class="muted"><strong>Warm-up</strong></div><ul class="muted">${RUN.tue.warmup.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
   <div class="hr"></div>
   <div class="muted"><strong>Main (treadmill-ready)</strong></div>
   <ul class="muted">
    <li><strong>Rounds:</strong> ${p.rounds}</li>
    <li><strong>Work:</strong> ${p.workSec}s @ <strong>${p.workKmh.toFixed(1)} km/h</strong> (${paceFromKmh(p.workKmh)})</li>
    <li><strong>Recovery:</strong> ${p.restSec}s @ <strong>${p.restKmh.toFixed(1)} km/h</strong> (${paceFromKmh(p.restKmh)})</li>
    <li class="muted">${esc(p.note)}</li>
   </ul>
   <div class="hr"></div>
   <div class="muted"><strong>Mobility</strong></div><ul class="muted">${RUN.tue.mobility.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
 }
 if(dayKey==="thu"){
  const e=RUN.thu.easy,s=RUN.thu.strides;
  setIntervalPreset({workSec:s.workSec,restSec:s.restSec,rounds:s.rounds});
  return `
   <div class="title"><div><strong>${esc(RUN.thu.title)}</strong>
    <div class="muted">Incline ${esc(e.incline)} • km/h + pace shown</div></div></div>
   <div class="hr"></div>
   <div class="muted"><strong>Warm-up</strong></div><ul class="muted">${RUN.thu.warmup.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
   <div class="hr"></div>
   <div class="muted"><strong>Main (treadmill-ready)</strong></div>
   <ul class="muted">
    <li><strong>Easy:</strong> ${e.minutes} min @ <strong>${e.kmhMin.toFixed(1)}–${e.kmhMax.toFixed(1)} km/h</strong> (${paceFromKmh(e.kmhMin)}–${paceFromKmh(e.kmhMax)})</li>
    <li><strong>Strides:</strong> ${s.rounds} × ${s.workSec}s @ <strong>${s.workKmh.toFixed(1)} km/h</strong> (${paceFromKmh(s.workKmh)})</li>
    <li><strong>Between:</strong> ${s.restSec}s @ <strong>${s.restKmh.toFixed(1)} km/h</strong> (${paceFromKmh(s.restKmh)})</li>
   </ul>
   <div class="hr"></div>
   <div class="muted"><strong>Mobility</strong></div><ul class="muted">${RUN.thu.mobility.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
 }
 if(dayKey==="sat"){
  const p=RUN.sat.weeks[week];
  if(p.kind==="reps") setIntervalPreset({workSec:60,restSec:p.restSec,rounds:p.rounds});
  const main=(p.kind==="steady"||p.kind==="tt")
   ? `<ul class="muted"><li><strong>${p.distanceKm.toFixed(1)} km</strong> @ <strong>${p.kmh.toFixed(1)} km/h</strong> (${paceFromKmh(p.kmh)})</li><li class="muted">${esc(p.note)}</li></ul>`
   : `<ul class="muted"><li><strong>${p.rounds} × ${p.repKm.toFixed(1)} km</strong> @ <strong>${p.kmh.toFixed(1)} km/h</strong> (${paceFromKmh(p.kmh)})</li><li><strong>Rest:</strong> ${p.restSec}s @ <strong>${p.restKmh.toFixed(1)} km/h</strong> (${paceFromKmh(p.restKmh)})</li><li class="muted">${esc(p.note)}</li></ul>`;
  return `
   <div class="title"><div><strong>${esc(RUN.sat.title)}</strong>
    <div class="muted">Incline ${esc(p.incline)} • Week ${week} • km/h + pace shown</div></div></div>
   <div class="hr"></div>
   <div class="muted"><strong>Warm-up</strong></div><ul class="muted">${RUN.sat.warmup.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>
   <div class="hr"></div>
   <div class="muted"><strong>Main (treadmill-ready)</strong></div>${main}
   <div class="hr"></div>
   <div class="muted"><strong>Mobility</strong></div><ul class="muted">${RUN.sat.mobility.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
 }
 return `<div class="muted">Run day not configured.</div>`;
}

function renderRestDay(dayKey){
 const title=dayKey==="wed"?"Wed – Mobility / Rest":"Sun – Rest";
 const items=dayKey==="wed"?["Optional 10 min walk","Mobility: couch stretch, calves, thoracic rotations"]:["Rest day","Optional light stretch"];
 return `<div class="title"><div><strong>${esc(title)}</strong><div class="muted">Recovery day.</div></div></div><div class="hr"></div><ul class="muted">${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
}

function render(){
 const dateK=todayKey();
 const todayDay=dayKeyFromDate();
 const streak=computeStreak();
 const top=`
  <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
    <div><div style="font-weight:800;font-size:16px">Workout</div>
    <div class="muted">Date: ${esc(dateK)} • Streak: <strong>${streak}</strong></div></div>
    <button id="todayBtn" class="primary" type="button">Today</button>
  </div>
  <div class="hr"></div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <div>
      <div class="muted">Workout time</div>
      <div id="workoutClock" style="font-size:34px;font-weight:900;font-variant-numeric:tabular-nums">${fmtHMS(workoutNowMs(dateK))}</div>
      <div id="workoutStatus" class="muted">${getWorkoutSession(dateK).running?"Running":"Paused"}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;min-width:160px">
      <button id="wStart" type="button" class="primary">Start</button>
      <button id="wPause" type="button">Pause</button>
      <button id="wEnd" type="button">End (save)</button>
    </div>
  </div>
  <div class="hr"></div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
    <div class="muted">Week</div>
    <input id="weekInput" type="number" min="1" max="5" value="${state.week}" style="width:90px;text-align:right" />
    <div style="flex:1"></div>
    <label class="muted" style="display:flex;gap:10px;align-items:center">
      <input id="autoRestToggle" type="checkbox" ${state.autoRest?"checked":""} style="width:18px;height:18px" />
      Auto-start rest when set done
    </label>
  </div>`;

 const meta=DAYS.find(d=>d.key===state.currentDay)||DAYS[0];
 let body="";
 if(meta.type==="strength"){ body=renderStrength(meta.key); }
 else if(meta.type==="run"){ body=renderRun(meta.key); }
 else { body=renderRestDay(meta.key); }

 sessionCard.innerHTML=top+body;

 document.getElementById("todayBtn").onclick=()=>{state.currentDay=todayDay;daySelect.value=state.currentDay;saveState();render();haptic();};
 document.getElementById("wStart").onclick=()=>startWorkoutTimer(dateK);
 document.getElementById("wPause").onclick=()=>pauseWorkoutTimer(dateK);
 document.getElementById("wEnd").onclick=()=>endWorkoutTimer(dateK);
 document.getElementById("weekInput").oninput=e=>{state.week=clampWeek(e.target.value);saveState();render();};
 document.getElementById("autoRestToggle").onchange=e=>{state.autoRest=!!e.target.checked;saveState();};

 pumpWorkoutTimer(dateK);

 if(meta.type==="strength"){
  document.getElementById("rt60").onclick=()=>restSet(60);
  document.getElementById("rt90").onclick=()=>restSet(90);
  document.getElementById("rt120").onclick=()=>restSet(120);
  const c=document.getElementById("rtCustom"); c.value=state.restDefaultSec||90;
  c.oninput=()=>restSet(clampInt(c.value,10,600));
  document.getElementById("rtStart").onclick=()=>restStart();
  document.getElementById("rtPause").onclick=()=>restPause();
  document.getElementById("rtReset").onclick=()=>restReset();
  restReset();
  bindStrengthInputs(meta.key);
 }
}

daySelect.addEventListener("change",()=>{state.currentDay=daySelect.value;saveState();render();});
resetDayBtn.addEventListener("click",()=>{const w=state.week;if(state.strengthLogs[w]) delete state.strengthLogs[w][state.currentDay];saveState();render();});
resetWeekBtn.addEventListener("click",()=>{delete state.strengthLogs[state.week];saveState();render();});

render();
