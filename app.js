/* 2 km 8:10 – Routine (Treadmill + Outdoor mode)
   - Mode dropdown: Treadmill / Outdoor
   - Run instructions switch based on mode
   - Interval timer ONLY on Intervals day
   - Strength logging: kg + LWkg + reps + LWreps
   - Per-set rest countdown starts when set ticked
   - Mobility timers + tick
*/

const STORAGE_KEY = "treadmill810_v8";
const TODAY_KEY = () => new Date().toISOString().slice(0, 10);

// -------------------- Plan (FULL WEEK) --------------------
const days = [
  {
    key: "mon",
    name: "Mon – Strength A",
    warmup: ["3 min easy walk or jog", "Leg swings 10 each direction", "Ankle & calf mobility 60 sec"],
    main: {
      type: "strength",
      exercises: [
        { id: "trap", name: "Trap Bar Deadlift", sets: 4, targetReps: 3, note: "fast, no grind" },
        { id: "bss", name: "Bulgarian Split Squat", sets: 3, targetReps: 5, note: "each leg" },
        { id: "box", name: "Box Jumps", sets: 3, targetReps: 3, note: "reset each rep" },
        { id: "calf", name: "Standing Calf Raises", sets: 3, targetReps: 10, note: "slow down" }
      ]
    },
    mobility: [
      { id: "couch", name: "Couch stretch", seconds: 60, note: "per side" },
      { id: "calfStretch", name: "Calf stretch", seconds: 60, note: "per side" },
      { id: "glute", name: "Glute stretch", seconds: 60, note: "per side" }
    ]
  },

  // Intervals day (ONLY day that shows Interval Timer)
  {
    key: "tue",
    name: "Tue – Intervals",
    warmup: ["10–12 min easy", "3 × 20s strides"],
    main: {
      type: "run",
      title: "Intervals",
      showIntervalTimer: true, // IMPORTANT
      detailsByMode: {
        treadmill: [
          "Incline: 1.0%",
          "Rounds: 6",
          "Work: 95s @ 15.0 km/h (4:00/km)",
          "Recovery: 90s @ 10.0 km/h (6:00/km)",
          "Goal: controlled hard reps"
        ],
        outdoor: [
          "Route: flat loop / track",
          "Rounds: 6",
          "Work: 95s @ hard-but-controlled (RPE 8/10)",
          "Recovery: 90s easy jog/walk",
          "Goal: even effort reps (don’t sprint the first 2)"
        ]
      }
    },
    mobility: [{ id: "calfStretch2", name: "Calf stretch", seconds: 60, note: "per side" }]
  },

  // Mid-week easier day
  {
    key: "wed",
    name: "Wed – Mobility / Rest",
    warmup: [],
    main: { type: "rest", details: ["Recovery day. Keep it easy.", "Optional 10–20 min walk"] },
    mobility: [
      { id: "couch2", name: "Couch stretch", seconds: 60, note: "per side" },
      { id: "calves2", name: "Calves", seconds: 60, note: "per side" },
      { id: "thoracic", name: "Thoracic rotations", seconds: 60, note: "per side" }
    ]
  },

  {
    key: "thu",
    name: "Thu – Strength B",
    warmup: ["3 min easy walk or jog", "Hip openers 60 sec", "Ankle & calf mobility 60 sec"],
    main: {
      type: "strength",
      exercises: [
        { id: "rdl", name: "Romanian Deadlift", sets: 4, targetReps: 6, note: "controlled" },
        { id: "split", name: "Reverse Lunge", sets: 3, targetReps: 6, note: "each leg" },
        { id: "step", name: "Step-ups", sets: 3, targetReps: 8, note: "each leg" },
        { id: "calf2", name: "Seated Calf Raises", sets: 3, targetReps: 12, note: "slow down" }
      ]
    },
    mobility: [
      { id: "hipFlex", name: "Hip flexor stretch", seconds: 60, note: "per side" },
      { id: "ham", name: "Hamstring stretch", seconds: 60, note: "per side" }
    ]
  },

  // Easy run day (NO interval timer)
  {
    key: "fri",
    name: "Fri – Easy Run",
    warmup: ["8–10 min easy", "2 × 15s relaxed strides (optional)"],
    main: {
      type: "run",
      title: "Easy Run",
      showIntervalTimer: false,
      detailsByMode: {
        treadmill: [
          "Incline: 1.0%",
          "20–30 min easy",
          "Speed: 10.0–12.0 km/h (6:00–5:00/km)",
          "Finish feeling fresh"
        ],
        outdoor: [
          "20–30 min easy",
          "Talk-test pace (RPE 4–5/10)",
          "Avoid big hills if possible",
          "Finish feeling fresh"
        ]
      }
    },
    mobility: [{ id: "calfStretch3", name: "Calf stretch", seconds: 60, note: "per side" }]
  },

  // Tempo day (NO interval timer)
  {
    key: "sat",
    name: "Sat – Tempo / Steady",
    warmup: ["10 min easy", "3 × 20s strides"],
    main: {
      type: "run",
      title: "Tempo / Steady",
      showIntervalTimer: false,
      detailsByMode: {
        treadmill: [
          "Incline: 1.0%",
          "10 min easy @ 11.0–12.0 km/h",
          "10–15 min steady @ 13.0–14.0 km/h",
          "5 min easy cool down"
        ],
        outdoor: [
          "10 min easy",
          "10–15 min steady (RPE 7/10, ‘comfortably hard’)",
          "5–10 min cool down",
          "Aim even effort not exact pace"
        ]
      }
    },
    mobility: [{ id: "glutes2", name: "Glute stretch", seconds: 60, note: "per side" }]
  },

  // Long run day (NO interval timer)
  {
    key: "sun",
    name: "Sun – Long Run",
    warmup: ["5–10 min easy build"],
    main: {
      type: "run",
      title: "Long Run",
      showIntervalTimer: false,
      detailsByMode: {
        treadmill: [
          "Incline: 1.0%",
          "35–50 min easy (build by +5 min every 1–2 weeks)",
          "Keep it conversational (RPE 4–5/10)"
        ],
        outdoor: [
          "35–50 min easy (build by +5 min every 1–2 weeks)",
          "Conversational pace (RPE 4–5/10)",
          "Prefer flatter route; take water if needed"
        ]
      }
    },
    mobility: [{ id: "fullbody", name: "Full body stretch", seconds: 180, note: "easy" }]
  }
];

// -------------------- State --------------------
const defaultState = {
  dayKey: "mon",
  mode: "treadmill", // NEW
  restSeconds: 90,
  session: { running: false, startedAt: null, elapsedMs: 0, lastSaved: null },
  logs: {},
  mobility: {}
};

let state = loadState();

// -------------------- Helpers --------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function dayByKey(key) { return days.find(d => d.key === key) || days[0]; }

function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
function formatMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function currentWeekNumber() {
  const base = new Date("2026-01-01T00:00:00Z").getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - base) / (24 * 3600 * 1000));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}
function getWeekKey() { return String(currentWeekNumber()); }

function ensurePath(obj, pathArr, fallback) {
  let ref = obj;
  for (let i = 0; i < pathArr.length; i++) {
    const k = pathArr[i];
    if (ref[k] == null) ref[k] = (i === pathArr.length - 1) ? fallback : {};
    ref = ref[k];
  }
  return ref;
}

// -------------------- DOM --------------------
const daySelect = document.getElementById("daySelect");
const modeSelect = document.getElementById("modeSelect"); // NEW
const resetDayBtn = document.getElementById("resetDayBtn");
const resetWeekBtn = document.getElementById("resetWeekBtn");

const sessionDateEl = document.getElementById("sessionDate");
const sessionTimeEl = document.getElementById("sessionTime");
const sessionStartBtn = document.getElementById("sessionStartBtn");
const sessionPauseBtn = document.getElementById("sessionPauseBtn");
const sessionEndBtn = document.getElementById("sessionEndBtn");

const dayTitleEl = document.getElementById("dayTitle");
const warmupList = document.getElementById("warmupList");
const mainBlock = document.getElementById("mainBlock");
const mobilityList = document.getElementById("mobilityList");

// -------------------- Init --------------------
function init() {
  daySelect.innerHTML = days.map(d => `<option value="${d.key}">${d.name}</option>`).join("");
  daySelect.value = state.dayKey;

  if (modeSelect) modeSelect.value = state.mode || "treadmill";

  render();
  startTick();
}
init();

// -------------------- Session Timer --------------------
function sessionNowElapsedMs() {
  if (!state.session.running || !state.session.startedAt) return state.session.elapsedMs || 0;
  return (state.session.elapsedMs || 0) + (Date.now() - state.session.startedAt);
}
function sessionStart() {
  if (state.session.running) return;
  state.session.running = true;
  state.session.startedAt = Date.now();
  saveState();
  renderSession();
}
function sessionPause() {
  if (!state.session.running) return;
  state.session.elapsedMs = sessionNowElapsedMs();
  state.session.running = false;
  state.session.startedAt = null;
  saveState();
  renderSession();
}
function sessionEndSave() {
  state.session.elapsedMs = sessionNowElapsedMs();
  state.session.running = false;
  state.session.startedAt = null;
  state.session.lastSaved = { date: TODAY_KEY(), elapsedMs: state.session.elapsedMs };
  saveState();
  renderSession();
}

// -------------------- Strength logging --------------------
function getLogRef(weekKey, dayKey, exId) {
  const week = ensurePath(state.logs, [weekKey], {});
  const day = ensurePath(week, [dayKey], {});
  return ensurePath(day, [exId], {});
}
function getLastWeekValue(dayKey, exId, setIdx, field) {
  const wk = Number(getWeekKey());
  const lw = String(Math.max(1, wk - 1));
  const ex = (((state.logs || {})[lw] || {})[dayKey] || {})[exId];
  const row = ex && ex[String(setIdx)];
  return row && row[field] != null && row[field] !== "" ? row[field] : "";
}
function setTodayValue(dayKey, exId, setIdx, field, value) {
  const wk = getWeekKey();
  const ex = getLogRef(wk, dayKey, exId);
  const row = ensurePath(ex, [String(setIdx)], { kg: "", reps: "", done: false, restEndsAtMs: null });
  row[field] = value;
  saveState();
}
function setDoneAndStartRest(dayKey, exId, setIdx, done) {
  const wk = getWeekKey();
  const ex = getLogRef(wk, dayKey, exId);
  const row = ensurePath(ex, [String(setIdx)], { kg: "", reps: "", done: false, restEndsAtMs: null });

  row.done = done;
  row.restEndsAtMs = done ? Date.now() + (Number(state.restSeconds) * 1000) : null;
  saveState();
}

// -------------------- Mobility --------------------
function getMob(dayKey, mobId) {
  const day = ensurePath(state.mobility, [dayKey], {});
  return ensurePath(day, [mobId], { done: false, running: false, endsAtMs: null });
}
function mobStart(dayKey, mobId, seconds) {
  const m = getMob(dayKey, mobId);
  m.running = true;
  m.endsAtMs = Date.now() + seconds * 1000;
  m.done = false;
  saveState();
}
function mobToggleDone(dayKey, mobId, done) {
  const m = getMob(dayKey, mobId);
  m.done = done;
  if (done) { m.running = false; m.endsAtMs = null; }
  saveState();
}
function mobRemainingMs(dayKey, mobId) {
  const m = getMob(dayKey, mobId);
  if (!m.running || !m.endsAtMs) return 0;
  return Math.max(0, m.endsAtMs - Date.now());
}

// -------------------- Render --------------------
function renderSession() {
  sessionDateEl.textContent = new Date().toDateString();
  sessionTimeEl.textContent = formatHMS(sessionNowElapsedMs());
  sessionStartBtn.textContent = state.session.running ? "Running" : "Start";
  sessionStartBtn.disabled = state.session.running;
}

function renderDay() {
  const day = dayByKey(state.dayKey);
  dayTitleEl.textContent = day.name;

  warmupList.innerHTML =
    (day.warmup || []).map(x => `<li>${escapeHtml(x)}</li>`).join("") || `<li class="muted">—</li>`;

  // Main
  if (day.main.type === "strength") {
    mainBlock.innerHTML = `
      ${(day.main.exercises || []).map(ex => renderExercise(day.key, ex)).join("")}
      ${renderRestSettings()}
    `;
  } else if (day.main.type === "run") {
    const mode = state.mode || "treadmill";
    const details = (day.main.detailsByMode && day.main.detailsByMode[mode]) || day.main.details || [];

    mainBlock.innerHTML = `
      <div class="cardTitle">${escapeHtml(day.main.title || "Run")}</div>
      <div class="muted">Mode: <b>${mode === "treadmill" ? "Treadmill" : "Outdoor"}</b></div>
      <ul>${details.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      ${
        day.main.showIntervalTimer
          ? `
            <div class="hr"></div>
            <div class="cardTitle">Interval Timer</div>
            <div class="muted">Use for work/rest intervals</div>
            ${renderIntervalTimer()}
          `
          : ``
      }
    `;
  } else {
    mainBlock.innerHTML = `
      <div class="cardTitle">Recovery</div>
      <ul>${(day.main.details || []).map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    `;
  }

  // Mobility
  mobilityList.innerHTML =
    (day.mobility || []).map(m => renderMobItem(day.key, m)).join("") || `<div class="muted">—</div>`;
}

function renderExercise(dayKey, ex) {
  const wk = getWeekKey();
  const exLog = getLogRef(wk, dayKey, ex.id);

  const rows = Array.from({ length: ex.sets }, (_, i) => {
    const setIdx = i + 1;
    const row = exLog[String(setIdx)] || { kg: "", reps: ex.targetReps, done: false, restEndsAtMs: null };

    const lwKg = getLastWeekValue(dayKey, ex.id, setIdx, "kg");
    const lwReps = getLastWeekValue(dayKey, ex.id, setIdx, "reps");

    const remaining = row.restEndsAtMs ? Math.max(0, row.restEndsAtMs - Date.now()) : 0;
    const restLabel = row.restEndsAtMs ? formatMS(remaining) : "—";

    return `
      <div class="setRow">
        <div class="setNum">#${setIdx}</div>

        <input class="pillInput" inputmode="decimal" placeholder="kg"
          value="${escapeAttr(row.kg ?? "")}"
          data-kg="${ex.id}|${setIdx}" />

        <div class="pillRead" title="Last week kg">${lwKg !== "" ? escapeHtml(String(lwKg)) : "LW"}</div>

        <input class="pillInput" inputmode="numeric" placeholder="${ex.targetReps}"
          value="${escapeAttr(row.reps ?? ex.targetReps)}"
          data-reps="${ex.id}|${setIdx}" />

        <div class="pillRead" title="Last week reps">${lwReps !== "" ? escapeHtml(String(lwReps)) : "LW"}</div>

        <div class="restBox" data-restbox="${ex.id}|${setIdx}" title="Rest countdown">${restLabel}</div>

        <div class="doneWrap">
          <input class="done" type="checkbox" ${row.done ? "checked" : ""} data-done="${ex.id}|${setIdx}" />
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="margin:10px 0 18px;">
      <div class="exTitle">${escapeHtml(ex.name)}</div>
      <div class="exMeta">${ex.sets} sets · target reps ${ex.targetReps}${ex.note ? ` · ${escapeHtml(ex.note)}` : ""}</div>

      <div class="tableHead">
        <div>#</div><div>kg</div><div>LW</div><div>reps</div><div>LW</div><div>⏱</div><div>✓</div>
      </div>
      ${rows}
    </div>
  `;
}

function renderRestSettings() {
  return `
    <div class="hr"></div>
    <div class="cardTitle">Rest settings</div>
    <div class="muted">Tick a set to auto-start the countdown next to it.</div>
    <div class="row" style="margin-top:10px;">
      <button class="btn" data-rest="60">60s</button>
      <button class="btn" data-rest="90">90s</button>
      <button class="btn" data-rest="120">120s</button>
      <div class="spacer"></div>
      <input id="restSeconds" type="number" min="10" max="600" value="${Number(state.restSeconds) || 90}" style="width:120px;" />
      <div class="muted" style="padding-left:8px;">sec</div>
    </div>
  `;
}

function renderMobItem(dayKey, m) {
  const mob = getMob(dayKey, m.id);
  const rem = mobRemainingMs(dayKey, m.id);
  const shown = mob.running ? formatMS(rem) : formatMS(m.seconds * 1000);

  return `
    <div class="mobItem">
      <div>
        <div class="mobName">${escapeHtml(m.name)}</div>
        <div class="tiny">${escapeHtml(m.note || "")}</div>
      </div>
      <div class="mobTimer">${shown}</div>
      <button class="mobBtn" data-mobstart="${m.id}" title="Start">▶</button>
      <div class="mobDone">
        <input class="mobChk" type="checkbox" ${mob.done ? "checked" : ""} data-mobdone="${m.id}" />
      </div>
    </div>
  `;
}

function renderIntervalTimer() {
  return `
    <div class="card" style="margin:12px 0 0;">
      <div class="row" style="align-items:flex-end;">
        <div class="bigTime" id="itTime" style="font-size:44px;margin:0;">00:00</div>
        <div class="spacer"></div>
        <button class="btn btnPrimary" id="itStart">Start</button>
        <button class="btn" id="itPause">Pause</button>
        <button class="btn" id="itStop">Stop</button>
      </div>
      <div class="hr"></div>
      <div class="row">
        <input id="itWork" type="number" min="5" value="95" style="width:100%;" placeholder="Work (sec)" />
        <input id="itRest" type="number" min="5" value="90" style="width:100%;" placeholder="Rest (sec)" />
      </div>
      <div class="row" style="margin-top:10px;">
        <input id="itRounds" type="number" min="1" value="6" style="width:100%;" placeholder="Rounds" />
        <select id="itAuto" style="width:100%;">
          <option value="on" selected>Auto switch: On</option>
          <option value="off">Auto switch: Off</option>
        </select>
      </div>
    </div>
  `;
}

function render() {
  renderSession();
  renderDay();
  attachHandlers();
}

// -------------------- Handlers --------------------
function attachHandlers() {
  daySelect.onchange = () => {
    state.dayKey = daySelect.value;
    saveState();
    render();
  };

  if (modeSelect) {
    modeSelect.onchange = () => {
      state.mode = modeSelect.value;
      saveState();
      render();
    };
  }

  resetDayBtn.onclick = () => {
    const wk = getWeekKey();
    if (state.logs[wk] && state.logs[wk][state.dayKey]) delete state.logs[wk][state.dayKey];
    if (state.mobility[state.dayKey]) delete state.mobility[state.dayKey];
    saveState();
    render();
  };

  resetWeekBtn.onclick = () => {
    const wk = getWeekKey();
    delete state.logs[wk];
    saveState();
    render();
  };

  sessionStartBtn.onclick = sessionStart;
  sessionPauseBtn.onclick = sessionPause;
  sessionEndBtn.onclick = sessionEndSave;

  // Rest buttons / input (inside rest settings)
  document.querySelectorAll("[data-rest]").forEach(btn => {
    btn.onclick = () => {
      state.restSeconds = Number(btn.getAttribute("data-rest")) || 90;
      saveState();
      render(); // refresh input value
    };
  });

  const restSecondsInput = document.getElementById("restSeconds");
  if (restSecondsInput) {
    restSecondsInput.onchange = () => {
      const v = Number(restSecondsInput.value || 90);
      state.restSeconds = Math.min(600, Math.max(10, v));
      saveState();
      render();
    };
  }

  // Strength inputs
  document.querySelectorAll("[data-kg]").forEach(inp => {
    inp.oninput = () => {
      const [exId, setIdx] = inp.getAttribute("data-kg").split("|");
      setTodayValue(state.dayKey, exId, Number(setIdx), "kg", inp.value);
    };
  });

  document.querySelectorAll("[data-reps]").forEach(inp => {
    inp.oninput = () => {
      const [exId, setIdx] = inp.getAttribute("data-reps").split("|");
      setTodayValue(state.dayKey, exId, Number(setIdx), "reps", inp.value);
    };
  });

  // Done tick -> starts rest countdown
  document.querySelectorAll("[data-done]").forEach(chk => {
    chk.onchange = () => {
      const [exId, setIdx] = chk.getAttribute("data-done").split("|");
      setDoneAndStartRest(state.dayKey, exId, Number(setIdx), chk.checked);
      renderDay();
      attachHandlers();
    };
  });

  // Mobility
  document.querySelectorAll("[data-mobstart]").forEach(btn => {
    btn.onclick = () => {
      const mobId = btn.getAttribute("data-mobstart");
      const day = dayByKey(state.dayKey);
      const item = (day.mobility || []).find(x => x.id === mobId);
      if (!item) return;
      mobStart(state.dayKey, mobId, item.seconds);
      renderDay();
      attachHandlers();
    };
  });

  document.querySelectorAll("[data-mobdone]").forEach(chk => {
    chk.onchange = () => {
      const mobId = chk.getAttribute("data-mobdone");
      mobToggleDone(state.dayKey, mobId, chk.checked);
      renderDay();
      attachHandlers();
    };
  });

  // Interval timer only if present
  const itTime = document.getElementById("itTime");
  if (itTime) setupIntervalTimer();
}

// -------------------- Live tick updates --------------------
let tickTimer = null;
function startTick() {
  if (tickTimer) clearInterval(tickTimer);

  tickTimer = setInterval(() => {
    sessionTimeEl.textContent = formatHMS(sessionNowElapsedMs());

    const wk = getWeekKey();
    const dayKey = state.dayKey;
    const day = dayByKey(dayKey);

    // Update strength rest boxes
    if (day.main.type === "strength") {
      (day.main.exercises || []).forEach(ex => {
        const exLog = (((state.logs || {})[wk] || {})[dayKey] || {})[ex.id] || {};
        for (let i = 1; i <= ex.sets; i++) {
          const row = exLog[String(i)];
          const el = document.querySelector(`[data-restbox="${ex.id}|${i}"]`);
          if (!el) continue;

          if (row && row.restEndsAtMs) {
            const rem = Math.max(0, row.restEndsAtMs - Date.now());
            el.textContent = formatMS(rem);
            if (rem <= 0) {
              row.restEndsAtMs = null;
              saveState();
              el.textContent = "—";
              beep();
            }
          }
        }
      });
    }

    // Finish mobility timers
    (day.mobility || []).forEach(m => {
      const mob = getMob(dayKey, m.id);
      if (mob.running && mob.endsAtMs) {
        const rem = Math.max(0, mob.endsAtMs - Date.now());
        if (rem <= 0) {
          mob.running = false;
          mob.endsAtMs = null;
          saveState();
          beep();
          renderDay();
          attachHandlers();
        }
      }
    });
  }, 250);
}

// -------------------- Interval Timer --------------------
function setupIntervalTimer() {
  const itTime = document.getElementById("itTime");
  const itStart = document.getElementById("itStart");
  const itPause = document.getElementById("itPause");
  const itStop = document.getElementById("itStop");
  const itWork = document.getElementById("itWork");
  const itRest = document.getElementById("itRest");
  const itRounds = document.getElementById("itRounds");
  const itAuto = document.getElementById("itAuto");

  let running = false;
  let phase = "work";
  let endsAt = null;
  let round = 1;

  function setDisplay(ms) { itTime.textContent = formatMS(ms); }
  function startPhase() {
    const work = Number(itWork.value || 95) * 1000;
    const rest = Number(itRest.value || 90) * 1000;
    endsAt = Date.now() + (phase === "work" ? work : rest);
  }
  function tick() {
    if (!running || !endsAt) return;
    const rem = Math.max(0, endsAt - Date.now());
    setDisplay(rem);
    if (rem <= 0) {
      beep();
      if (itAuto.value === "off") { running = false; return; }
      if (phase === "work") phase = "rest";
      else {
        phase = "work";
        round += 1;
        const totalRounds = Number(itRounds.value || 6);
        if (round > totalRounds) { running = false; return; }
      }
      startPhase();
    }
  }

  itStart.onclick = () => { if (!running) { running = true; phase = "work"; round = 1; startPhase(); } };
  itPause.onclick = () => { running = false; };
  itStop.onclick = () => { running = false; endsAt = null; setDisplay(0); phase = "work"; round = 1; };

  setInterval(tick, 200);
}

// -------------------- Utils --------------------
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 800;
    o.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
  } catch {}
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[m]);
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

// ==================== PROGRESSION LOGIC ====================

// ---- Strength progression ----
function getStrengthSuggestion(dayKey, ex) {
  const wk = Number(getWeekKey());
  const lastWeek = String(Math.max(1, wk - 1));
  const logs = (((state.logs || {})[lastWeek] || {})[dayKey] || {})[ex.id];

  if (!logs) return null;

  let allHit = true;
  let avgKg = 0;
  let sets = 0;

  for (let i = 1; i <= ex.sets; i++) {
    const row = logs[String(i)];
    if (!row) return null;

    const reps = Number(row.reps || 0);
    const kg = Number(row.kg || 0);

    if (reps < ex.targetReps) allHit = false;
    avgKg += kg;
    sets++;
  }

  if (!allHit || sets === 0) return null;

  avgKg = avgKg / sets;

  // Weight jump rules
  let jump = 2.5;
  if (/split|lunge|step/i.test(ex.name)) jump = 1;
  if (/calf/i.test(ex.name)) jump = 2.5;

  return Math.round((avgKg + jump) * 2) / 2;
}

// ---- Interval progression ----
function getIntervalSuggestion() {
  const wk = Number(getWeekKey());

  if (wk % 4 === 0) {
    return { reps: 6, speedBump: 0.2 };
  }

  return { reps: Math.min(8, 6 + (wk % 4)), speedBump: 0 };
}

// ---- Tempo progression ----
function getTempoMinutes(base = 12) {
  const wk = Number(getWeekKey());
  return Math.min(20, base + Math.floor(wk / 2) * 2);
}

// ---- Long run progression ----
function getLongRunMinutes(base = 45) {
  const wk = Number(getWeekKey());
  if (wk % 4 === 0) return base; // deload
  return base + Math.min(25, wk * 5);
}
