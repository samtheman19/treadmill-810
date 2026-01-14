/* 2km 8:10 Routine — Strength Weight Tracking + Rest Timer */

const days = [
  {
    key: "mon",
    name: "Mon – Strength A",
    type: "strength",
    warmup: [
      "3 min easy walk or jog",
      "Leg swings 10 each direction",
      "Ankle & calf mobility 60 sec"
    ],
    main: [
      "Trap Bar Deadlift – 4×3",
      "Bulgarian Split Squat – 3×5 each leg",
      "Box Jumps – 3×3",
      "Standing Calf Raises – 3×10"
    ],
    mobility: [
      "Couch stretch – 1 min/side",
      "Calf stretch – 1 min/side",
      "Glute stretch – 1 min/side"
    ]
  },
  {
    key: "tue",
    name: "Tue – Intervals",
    type: "run",
    warmup: ["Incline 1.0%", "3 min jog"],
    main: ["Intervals as planned"],
    mobility: ["Calf stretch"]
  },
  {
    key: "thu",
    name: "Thu – Easy + Strides",
    type: "run",
    warmup: ["Easy jog"],
    main: ["Easy + strides"],
    mobility: ["Stretch"]
  },
  {
    key: "fri",
    name: "Fri – Strength B",
    type: "strength",
    warmup: ["5 min bike"],
    main: [
      "Bench Press – 4×5",
      "Pull-ups – 4×6",
      "Hip Thrust – 3×6",
      "Hamstring Curl – 3×5"
    ],
    mobility: ["Hip flexor stretch"]
  }
];

const STORAGE_KEY = "treadmill810.v3";

const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  day: "mon",
  weights: {},
  rest: 90
};

const daySelect = document.getElementById("daySelect");
const card = document.getElementById("sessionCard");

days.forEach(d => {
  const o = document.createElement("option");
  o.value = d.key;
  o.textContent = d.name;
  daySelect.appendChild(o);
});

daySelect.value = state.day;

daySelect.onchange = () => {
  state.day = daySelect.value;
  save();
  render();
};

function render() {
  const d = days.find(x => x.key === state.day);
  card.innerHTML = `
    <h3>${d.name}</h3>
    ${list("Warm-up", d.warmup)}
    ${list("Main", d.main)}
    ${list("Mobility", d.mobility)}
    ${d.type === "strength" ? strengthUI(d) : ""}
  `;
}

function list(title, items) {
  return `
    <strong>${title}</strong>
    <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>
  `;
}

function strengthUI(day) {
  const w = state.weights[day.key] || {};
  return `
    <hr>
    <strong>Strength Tracker</strong>
    ${day.main.map((ex, i) => `
      <div style="display:flex;justify-content:space-between;margin:6px 0">
        <span>${ex}</span>
        <input
          style="width:70px"
          placeholder="kg"
          value="${w[i] || ""}"
          oninput="saveWeight('${day.key}',${i},this.value)"
        >
      </div>
    `).join("")}

    <hr>
    <strong>Rest Timer</strong>
    <div id="timer" style="font-size:32px">00:00</div>
    <button onclick="startTimer()">Start</button>
    <button onclick="stopTimer()">Reset</button>
  `;
}

let timerId;
function startTimer() {
  let t = state.rest;
  document.getElementById("timer").textContent = format(t);
  clearInterval(timerId);
  timerId = setInterval(() => {
    t--;
    document.getElementById("timer").textContent = format(t);
    if (t <= 0) {
      clearInterval(timerId);
      beep();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  document.getElementById("timer").textContent = format(state.rest);
}

function format(s) {
  return `00:${String(s).padStart(2, "0")}`;
}

function saveWeight(day, i, val) {
  state.weights[day] = state.weights[day] || {};
  state.weights[day][i] = val;
  save();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  o.connect(ctx.destination);
  o.frequency.value = 800;
  o.start();
  o.stop(ctx.currentTime + 0.2);
}

render();
