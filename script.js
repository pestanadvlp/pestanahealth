/* ================= UTIL ================= */

function toISODate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ================= HEADER ================= */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentDate").innerText =
    new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

  renderCalendar();
  renderWorkoutOfDay();
});

/* ================= TABS ================= */

document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {

    closeAllModals();

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
    btn.classList.add("active");

    if (btn.dataset.tab === "agenda") renderCalendar();
    if (btn.dataset.tab === "trainings") renderTrainings();
    if (btn.dataset.tab === "routine") renderWorkoutOfDay();
  };
});

function closeAllModals() {
  const modals = [
    document.getElementById("trainingModal"),
    document.getElementById("eventModal")
  ];

  modals.forEach(m => {
    if (m) m.style.display = "none";
  });

  editingTrainingId = null;
  editingEvent = null;
}

/* ================= AGENDA ================= */

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = toISODate(currentYear, currentMonth, new Date().getDate());
let editingEvent = null;

let events = JSON.parse(localStorage.getItem("events")) || {};

function changeMonth(step) {
  currentMonth += step;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  document.getElementById("monthLabel").innerText =
    new Date(currentYear, currentMonth, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) cal.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISODate(currentYear, currentMonth, d);

    const div = document.createElement("div");
    div.className = "day";
    if (iso === selectedDate) div.classList.add("selected");
    if (events[iso]) div.classList.add("has-event");

    div.innerHTML = `<strong>${d}</strong>`;
    div.onclick = () => {
      selectedDate = iso;
      renderCalendar();
      renderEvents();
    };

    cal.appendChild(div);
  }

  renderEvents();
}

function renderEvents() {
  const label = document.getElementById("selectedDateLabel");
  const list = document.getElementById("eventList");

  label.innerText = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR");
  list.innerHTML = "";

  (events[selectedDate] || []).forEach((e, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${e.time || ""} ${e.title}</strong>
      <div class="event-actions">
        <button onclick="editEvent(${i})">✏️</button>
        <button onclick="removeEvent(${i})">🗑️</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function openEventModal(index = null) {
  editingEvent = index;
  document.getElementById("eventModal").style.display = "block";
  document.getElementById("eventModalTitle").innerText =
    index === null ? "Novo compromisso" : "Editar compromisso";

  if (index !== null) {
    const e = events[selectedDate][index];
    eventTitle.value = e.title;
    eventTime.value = e.time;
  } else {
    eventTitle.value = "";
    eventTime.value = "";
  }
}

function closeEventModal() {
  document.getElementById("eventModal").style.display = "none";
}

function saveEvent() {
  if (!events[selectedDate]) events[selectedDate] = [];

  const data = {
    title: eventTitle.value,
    time: eventTime.value
  };

  if (editingEvent === null) events[selectedDate].push(data);
  else events[selectedDate][editingEvent] = data;

  localStorage.setItem("events", JSON.stringify(events));
  closeEventModal();
  renderCalendar();
}

function editEvent(index) {
  openEventModal(index);
}

function removeEvent(index) {
  events[selectedDate].splice(index, 1);
  if (!events[selectedDate].length) delete events[selectedDate];
  localStorage.setItem("events", JSON.stringify(events));
  renderCalendar();
}

/* ================= TREINOS ================= */

let trainings = JSON.parse(localStorage.getItem("trainings")) || [];
let editingTrainingId = null;

function openTrainingModal(trainingId = null) {
  document.getElementById("trainingModal").style.display = "block";
  document.getElementById("exerciseList").innerHTML = "";
  document.getElementById("trainingName").value = "";

  editingTrainingId = trainingId;

  const title = document.getElementById("trainingModalTitle");

  if (trainingId !== null) {  // ✅ corrigido
    const t = trainings.find(x => x.id === trainingId);
    if (!t) return;
    title.innerText = "Editar Treino";
    document.getElementById("trainingName").value = t.name;
    t.exercises.forEach(addExercise);
  } else {
    title.innerText = "Novo Treino";
  }
}

function closeTrainingModal() {
  document.getElementById("trainingModal").style.display = "none";
  editingTrainingId = null;
}

function addExercise(data = {}) {
  const div = document.createElement("div");
  div.className = "exercise";
  div.innerHTML = `
    <input placeholder="Exercício" value="${data.name || ""}">
    <input placeholder="Séries" value="${data.series || ""}">
    <input placeholder="Reps" value="${data.reps || ""}">
  `;
  document.getElementById("exerciseList").appendChild(div);
}

function saveTraining() {
  const name = document.getElementById("trainingName").value.trim();
  if (!name) return alert("Nome obrigatório");

  const exercises = [...document.querySelectorAll(".exercise")].map(e => {
    const i = e.querySelectorAll("input");
    return { name: i[0].value, series: i[1].value, reps: i[2].value };
  });

  if (editingTrainingId !== null) {
    const t = trainings.find(x => x.id === editingTrainingId);
    if (t) {
      t.name = name;
      t.exercises = exercises;
    }
  } else {
    trainings.push({ id: Date.now(), name, exercises });
  }

  localStorage.setItem("trainings", JSON.stringify(trainings));
  closeTrainingModal();
  renderTrainings();
}

function deleteTraining(id) {
  if (!confirm("Remover este treino?")) return;
  trainings = trainings.filter(t => t.id !== id);
  localStorage.setItem("trainings", JSON.stringify(trainings));
  renderTrainings();
  renderWorkoutOfDay();
}

function renderTrainings() {
  const list = document.getElementById("trainingList");
  if (!list) return;

  list.innerHTML = "";

  trainings.forEach(t => {
    const div = document.createElement("div");
    div.className = "workout-card";
    div.innerHTML = `
      <h3>${t.name}</h3>
      ${t.exercises.map(e => `<div class="exercise">${e.name} — ${e.series}x${e.reps}</div>`).join("")}
      <div class="workout-actions">
        <button onclick="openTrainingModal(${t.id})">Editar</button>
        <button onclick="deleteTraining(${t.id})">Excluir</button>
      </div>
    `;
    list.appendChild(div);
  });
}

/* ================= ROTINA ================= */

function renderWorkoutOfDay() {
  const box = document.getElementById("workoutOfDay");
  if (!box) return;

  if (!trainings.length) {
    box.innerHTML = "<em>Nenhum treino cadastrado</em>";
    return;
  }

  const todayIndex = new Date().getDay() % trainings.length;
  const workout = trainings[todayIndex];

  box.innerHTML = `
    <h3>${workout.name}</h3>
    ${workout.exercises.map(e => `<div class="exercise">${e.name} — ${e.series}x${e.reps}</div>`).join("")}
  `;
}

/*============= SERVICE WORKER ============= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
