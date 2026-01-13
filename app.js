const days = [
  {
    key: "mon",
    name: "Mon – Strength A",
    warmup: [
      "3 min easy walk or jog",
      "Leg swings 10 each direction",
      "Ankle & calf mobility 60 sec"
    ],
    main: [
      "Trap Bar Deadlift – 4×3 (fast, no grind)",
      "Bulgarian Split Squat – 3×5 each leg",
      "Box Jumps – 3×3",
      "Standing Calf Raises – 3×10 (slow down)"
    ],
    mobility: [
      "Couch stretch – 1 min/side",
      "Calf stretch – 1 min/side",
      "Glute stretch – 1 min/side"
    ]
  },
  {
    key: "tue",
    name: "Tue – Intervals (Treadmill)",
    warmup: [
      "Incline 1.0%",
      "3 min easy jog",
      "A-skips × 2",
      "High knees × 2"
    ],
    main: [
      "Week 1: 6 × 400 m @ 14.7 km/h (90s jog)",
      "Week 2: 5 × 500 m @ 14.8 km/h",
      "Week 3: 4 × 600 m @ 14.9 km/h",
      "Week 4: 3 × 800 m @ 14.7 km/h",
      "Week 5: 4 × 300 m @ 15.5 km/h"
    ],
    mobility: [
      "Hip flexor stretch – 1 min/side",
      "Calf stretch – 1 min/side"
    ]
  },
  {
    key: "wed",
    name: "Wed – Mobility / Rest",
    warmup: ["Optional 10 min walk"],
    main: ["Mobility only"],
    mobility: [
      "Couch stretch – 1 min/side",
      "Thoracic rotations – 10/side"
    ]
  },
  {
    key: "thu",
    name: "Thu – Easy + Strides",
    warmup: [
      "Incline 1.0%",
      "3 min jog",
      "Leg swings"
    ],
    main: [
      "25 min easy @ 11.5–12.0 km/h",
      "5 × 20 sec strides @ 15.5 km/h",
      "40 sec easy jog between strides"
    ],
    mobility: [
      "Calf stretch – 1 min/side",
      "Glute stretch – 1 min/side"
    ]
  },
  {
    key: "fri",
    name: "Fri – Strength B",
    warmup: [
      "5 min easy bike",
      "Band pull-aparts"
    ],
    main: [
      "Bench press / Push-ups – 4×5",
      "Pull-ups / Lat pulldown – 4×6",
      "Hip thrusts – 3×6",
      "Hamstring curls – 3×5",
      "Core – 3×30 sec"
    ],
    mobility: [
      "Hip flexor stretch",
      "Thoracic rotation"
    ]
  },
  {
    key: "sat",
    name: "Sat – Tempo / Race",
    warmup: [
      "Incline 1.0%",
      "3 min jog",
      "2 × 20 sec build-ups"
    ],
    main: [
      "Week 1: 2 km @ 14.3 km/h",
      "Week 2: 2.5 km @ 14.4 km/h",
      "Week 3: 3 km @ 14.5 km/h",
      "Week 4: 2 × 1 km @ 14.7 km/h",
      "Week 5: 2 km TIME TRIAL"
    ],
    mobility: [
      "Couch stretch – 1 min/side",
      "Calf stretch – 1 min/side"
    ]
  },
  {
    key: "sun",
    name: "Sun – Rest",
    warmup: [],
    main: ["Rest day"],
    mobility: ["Optional light stretch"]
  }
];

const state = JSON.parse(localStorage.getItem("treadmill810")) || {
  day: "mon",
  completed: {}
};

const daySelect = document.getElementById("daySelect");
const card = document.getElementById("sessionCard");

days.forEach(d => {
  const opt = document.createElement("option");
  opt.value = d.key;
  opt.textContent = d.name;
  daySelect.appendChild(opt);
});

daySelect.value = state.day;

daySelect.addEventListener("change", () => {
  state.day = daySelect.value;
  save();
  render();
});

document.getElementById("resetDayBtn").onclick = () => {
  delete state.completed[state.day];
  save();
  render();
};

document.getElementById("resetWeekBtn").onclick = () => {
  state.completed = {};
  save();
  render();
};

function render() {
  const d = days.find(x => x.key === state.day);
  const done = state.completed[state.day] || {};

  card.innerHTML = `
    <h3>${d.name}</h3>

    ${section("Warm-up", d.warmup, "warmup")}
    ${section("Main", d.main, "main")}
    ${section("Mobility", d.mobility, "mobility")}
  `;

  ["warmup","main","mobility"].forEach(type => {
    const box = document.getElementById(type);
    if (box) {
      box.checked = done[type] || false;
      box.onchange = () => {
        state.completed[state.day] = state.completed[state.day] || {};
        state.completed[state.day][type] = box.checked;
        save();
      };
    }
  });
}

function section(title, items, id) {
  if (!items.length) return "";
  return `
    <label>
      <input type="checkbox" id="${id}">
      <strong>${title}</strong>
    </label>
    <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>
  `;
}

function save() {
  localStorage.setItem("treadmill810", JSON.stringify(state));
}

render();
