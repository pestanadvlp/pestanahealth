/* ================= LOGIN ================= */

let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;

function register() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (!user || !pass) {
    alert("Preencha usuário e senha");
    return;
  }

  if (users[user]) {
    alert("Usuário já existe");
    return;
  }

  users[user] = {
    password: pass,
    createdAt: Date.now()
  };

  localStorage.setItem("users", JSON.stringify(users));

  alert("Usuário criado com sucesso!");
}

function login() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (!users[user] || users[user].password !== pass) {
    alert("Usuário ou senha inválidos");
    return;
  }

  currentUser = user;

  // salva sessão
  localStorage.setItem("sessionUser", user);

  document.getElementById("loginScreen").style.display = "none";

  initializeUserData();
}

function logout() {
  localStorage.removeItem("sessionUser");
  currentUser = null;
  document.getElementById("loginScreen").style.display = "flex";
}

function initializeUserData() {
  console.log("Usuário logado:", currentUser);

  document.getElementById("profileName").innerText = currentUser;

  loadUserProfile();
}

function loadUserProfile() {
  const userData = users[currentUser];

  if (!userData.avatar) return;

  document.getElementById("profileAvatar").src = userData.avatar;
}

document.addEventListener("change", function (e) {
  if (e.target.id === "avatarInput") {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      users[currentUser].avatar = event.target.result;
      localStorage.setItem("users", JSON.stringify(users));
      loadUserProfile();
    };

    reader.readAsDataURL(file);
  }
});

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

  const savedUser = localStorage.getItem("sessionUser");

    if (savedUser && users[savedUser]) {
      currentUser = savedUser;
      document.getElementById("loginScreen").style.display = "none";
      initializeUserData();
}

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

  users[currentUser].events = events;
  localStorage.setItem("users", JSON.stringify(users));
  closeEventModal();
  renderCalendar();
}

function editEvent(index) {
  openEventModal(index);
}

function removeEvent(index) {
  events[selectedDate].splice(index, 1);
  if (!events[selectedDate].length) delete events[selectedDate];
  users[currentUser].events = events;
  localStorage.setItem("users", JSON.stringify(users));
  renderCalendar();
}

/* ================= TREINOS ================= */

let trainings = JSON.parse(localStorage.getItem("trainings")) || [];
let editingTrainingId = null;

function openTrainingModal(trainingId = null) {
  document.getElementById("trainingModal").style.display = "block";
  document.getElementById("exerciseList").innerHTML = "";
  document.getElementById("trainingName").value = "";

  editingTrainingId = trainingId !== null ? Number(trainingId) : null;

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
    <input placeholder="Séries" type="number" value="${data.series || ""}">
    <input placeholder="Reps" type="number" value="${data.reps || ""}">
    <input placeholder="Carga (kg)" type="number" step="0.5" value="${data.load || ""}">
  `;
  document.getElementById("exerciseList").appendChild(div);
}

function saveTraining() {
  const name = document.getElementById("trainingName").value.trim();
  if (!name) return alert("Nome obrigatório");


  const exercises = [...document.querySelectorAll("#exerciseList .exercise")].map(e => {
    const i = e.querySelectorAll("input");
    return { 
      name: i[0]?.value || "", 
      series: i[1]?.value || "", 
      reps: i[2]?.value || "", 
      load: i[3]?.value || "" 
    };
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

  users[currentUser].trainings = trainings;
  localStorage.setItem("users", JSON.stringify(users));
  closeTrainingModal();
  renderTrainings();
  renderWorkoutOfDay();
}

function deleteTraining(id) {
  if (!confirm("Remover este treino?")) return;
  trainings = trainings.filter(t => t.id !== id);
  users[currentUser].trainings = trainings;
  localStorage.setItem("users", JSON.stringify(users));
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
      ${t.exercises.map(e => `
      <div class="exercise">
      ${e.name} — ${e.series}x${e.reps}
      ${e.load ? ` • ${e.load}kg` : ""}
      </div>
      `).join("")}
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
  ${workout.exercises.map(e => `
    <div class="exercise">
      ${e.name} — ${e.series}x${e.reps}
      ${e.load ? ` • ${e.load}kg` : ""}
    </div>
  `).join("")}
`;
}
  
  function completeWorkout() {
  alert("Função ainda não implementada");
}

/*============= SERVICE WORKER ============= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
