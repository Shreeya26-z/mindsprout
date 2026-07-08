const API = "https://mindsprout-msjx.onrender.com";
// ── Route Protection ──
const protectedPages = ["dashboard.html", "mood.html", "habit.html", "analytics.html", "chat.html", "specialists.html", "wellness.html", "journal.html", "meditation.html", "sleep-sounds.html", "community.html"];
const specialistProtectedPages = ["specialist-dashboard.html"];
const currentPage = window.location.pathname.split("/").pop();
if (protectedPages.includes(currentPage)) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}
if (specialistProtectedPages.includes(currentPage)) {
  const token = localStorage.getItem("specialistToken");
  if (!token) {
    window.location.href = "specialist-login.html";
  }
}
if (specialistProtectedPages.includes(currentPage)) {
  const token = localStorage.getItem("specialistToken");
  if (!token) {
    window.location.href = "specialist-login.html";
  }
}

// ── Helpers ──
function showError(id, message) {
  const box = document.getElementById(id);
  box.textContent = message;
  box.style.display = "block";
}

function hideMessages() {
  const error = document.getElementById("errorBox");
  const success = document.getElementById("successBox");
  if (error) error.style.display = "none";
  if (success) success.style.display = "none";
}

function showSuccess(id, message) {
  const box = document.getElementById(id);
  box.textContent = message;
  box.style.display = "block";
}

// ── Signup ──
async function signup() {
  hideMessages();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    showError("errorBox", "Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showSuccess("successBox", "Account created! Redirecting...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);

  } catch (error) {
    showError("errorBox", "Cannot connect to server. Is it running?");
  }
}
// ── Login ──
async function login() {
  hideMessages();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showError("errorBox", "Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    showSuccess("successBox", "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);

  } catch (error) {
    showError("errorBox", "Cannot connect to server. Is it running?");
  }
}
// ── Dashboard ──
async function loadDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/api/user`, {
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = "login.html";
      return;
    }

    const user = data.user;
    document.getElementById("userName").textContent = user.name;
    document.getElementById("streak").textContent = user.streak;
    document.getElementById("xp").textContent = user.xp;
    document.getElementById("level").textContent = user.level;
    document.getElementById("badgeEmoji").textContent = user.badge.emoji;
    document.getElementById("badgeName").textContent = user.badge.name;

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

// ── Logout ──
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ── Run on page load ──
if (window.location.pathname.includes("dashboard.html")) {
  loadDashboard();
}
// ── Mood Tracker ──
let selectedMood = null;

function selectMood(mood, btn) {
  selectedMood = mood;
  document.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

async function logMood() {
  hideMessages();

  if (!selectedMood) {
    showError("errorBox", "Please select a mood first!");
    return;
  }

  const token = localStorage.getItem("token");
  const note = document.getElementById("moodNote").value;

  try {
    const res = await fetch(`${API}/api/mood`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ mood: selectedMood, note }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    showSuccess("successBox", `Mood logged! +10 XP 🎉 Total XP: ${data.stats.xp}`);
    selectedMood = null;
    document.querySelectorAll(".mood-btn").forEach((b) => b.classList.remove("selected"));
    document.getElementById("moodNote").value = "";
    loadMoodHistory();

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function loadMoodHistory() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/mood`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    const container = document.getElementById("moodHistory");

    if (data.moods.length === 0) {
      container.innerHTML = `<p style="color: rgba(255,255,255,0.6); font-size: 14px;">No moods logged yet.</p>`;
      return;
    }

    const moodEmojis = {
      Happy: "😄",
      Neutral: "😐",
      Sad: "😢",
      Angry: "😠",
    };

    container.innerHTML = data.moods.map((m) => `
      <div class="history-item">
        <span class="history-mood">${moodEmojis[m.mood] || "😊"} ${m.mood}</span>
        <span class="history-date">${new Date(m.date).toLocaleDateString()}</span>
      </div>
    `).join("");

  } catch (error) {
    console.error("Mood history error:", error);
  }
}

// Run on mood page load
if (window.location.pathname.includes("mood.html")) {
  loadMoodHistory();
}
// ── Habit Tracker ──
async function addHabit() {
  hideMessages();

  const name = document.getElementById("habitName").value.trim();

  if (!name) {
    showError("errorBox", "Please enter a habit name.");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/habit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    document.getElementById("habitName").value = "";
    showSuccess("successBox", "Habit added! ✅");
    loadHabits();

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function completeHabit(id) {
  hideMessages();

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/habit/${id}/complete`, {
      method: "PATCH",
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    showSuccess("successBox", `${data.message} Total XP: ${data.stats.xp}`);
    loadHabits();

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function deleteHabit(id) {
  const token = localStorage.getItem("token");

  try {
    await fetch(`${API}/api/habit/${id}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    loadHabits();

  } catch (error) {
    console.error("Delete habit error:", error);
  }
}

async function loadHabits() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/habit`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    const container = document.getElementById("habitList");

    if (data.habits.length === 0) {
      container.innerHTML = `<p style="color: rgba(255,255,255,0.6); font-size: 14px;">No habits yet. Add one above!</p>`;
      return;
    }

    container.innerHTML = data.habits.map((h) => `
      <div class="habit-item ${h.completedToday ? "completed" : ""}">
        <div class="habit-left">
          <div>
            <div class="habit-name">${h.name}</div>
            <div class="habit-streak">🔥 ${h.streak} day streak</div>
          </div>
        </div>
        ${h.completedToday
          ? `<button class="btn-complete done">✅ Done</button>`
          : `<button class="btn-complete" onclick="completeHabit('${h._id}')">Complete</button>`
        }
        <button class="btn-delete" onclick="deleteHabit('${h._id}')">🗑</button>
      </div>
    `).join("");

  } catch (error) {
    console.error("Load habits error:", error);
  }
}

// Run on habit page load
if (window.location.pathname.includes("habit.html")) {
  loadHabits();
}
// ── Analytics ──
async function loadAnalytics() {
  const token = localStorage.getItem("token");

  try {
    // Load user stats
    const userRes = await fetch(`${API}/api/user`, {
      headers: { Authorization: token },
    });
    const userData = await userRes.json();
    const user = userData.user;

    document.getElementById("totalXP").textContent = user.xp;
    document.getElementById("currentLevel").textContent = user.level;
    document.getElementById("currentStreak").textContent = user.streak;
    document.getElementById("analyticsEmoji").textContent = user.badge.emoji;
    document.getElementById("analyticsBadge").textContent = user.badge.name;

    // XP progress bar
    const xpInCurrentLevel = user.xp % 50;
    const percentage = (xpInCurrentLevel / 50) * 100;
    document.getElementById("xpBarFill").style.width = percentage + "%";
    document.getElementById("xpBarLabel").textContent =
      `${xpInCurrentLevel} / 50 XP to Level ${user.level + 1}`;

    // Load mood frequency
    const moodRes = await fetch(`${API}/api/mood`, {
      headers: { Authorization: token },
    });
    const moodData = await moodRes.json();
    const frequency = moodData.frequency;

    // Draw chart
    const ctx = document.getElementById("moodChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(frequency),
        datasets: [{
          label: "Times logged",
          data: Object.values(frequency),
          backgroundColor: [
            "rgba(255, 255, 255, 0.6)",
            "rgba(255, 255, 255, 0.4)",
            "rgba(255, 255, 255, 0.3)",
            "rgba(255, 255, 255, 0.2)",
          ],
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: 1,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "white", stepSize: 1 },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
    });

  } catch (error) {
    console.error("Analytics error:", error);
  }
}

// Run on analytics page load
if (window.location.pathname.includes("analytics.html")) {
  loadAnalytics();
}
// ── Chatbot ──
const botResponses = {
  sad: [
    "I'm really sorry you're feeling sad 💙 It's okay to feel this way. Take it one moment at a time.",
    "Sadness is a valid emotion. Try taking a few deep breaths and be kind to yourself today 🌸",
    "I hear you. Sometimes writing down your feelings can help. You're not alone 💜",
  ],
  stress: [
    "Stress can feel overwhelming. Try the 4-7-8 breathing technique: breathe in for 4 seconds, hold for 7, out for 8 🌬️",
    "When stress hits, take a 5 minute walk outside. Fresh air does wonders 🌿",
    "You're doing better than you think. Break your tasks into small steps and tackle one at a time 💪",
  ],
  angry: [
    "It's okay to feel angry. Try counting to 10 slowly before reacting 🧘",
    "Anger is energy — channel it into something positive like a workout or journaling 💪",
    "Take a deep breath. Step away for a moment and give yourself space to cool down 🌬️",
  ],
  happy: [
    "That's amazing! Happiness is contagious 😄 Keep that energy going!",
    "Love to hear that! Celebrate the good moments — you deserve it 🎉",
    "Wonderful! Try to share that happiness with someone around you today 🌟",
  ],
  anxious: [
    "Anxiety can be tough. Try grounding yourself — name 5 things you can see right now 👀",
    "Take slow deep breaths. You are safe right now 💙 This feeling will pass.",
    "When anxiety strikes, focus on what you can control and let go of what you can't 🌿",
  ],
  lonely: [
    "Loneliness is hard. Remember you are never truly alone — I'm here for you 💜",
    "Try reaching out to one person today, even just a text. Connection heals 🌸",
    "You matter more than you know. Consider joining a community or group activity 🌟",
  ],
  tired: [
    "Rest is productive too! Make sure you're getting enough sleep tonight 😴",
    "Listen to your body — it might be asking for a break. Be gentle with yourself 🌿",
    "Try a short 10 minute nap or meditation. Even brief rest can recharge you ⚡",
  ],
  default: [
    "Thank you for sharing that with me 🌱 I'm here to listen. Tell me more!",
    "You're taking a great step by talking about how you feel. Keep going 💪",
    "I hear you. Remember — every small step forward counts on your wellness journey 🌿",
    "That's interesting! How does that make you feel? 💙",
  ],
};

function getBotResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes("sad") || msg.includes("unhappy") || msg.includes("depressed") || msg.includes("cry")) {
    return botResponses.sad[Math.floor(Math.random() * botResponses.sad.length)];
  }
  if (msg.includes("stress") || msg.includes("overwhelm") || msg.includes("pressure") || msg.includes("worried")) {
    return botResponses.stress[Math.floor(Math.random() * botResponses.stress.length)];
  }
  if (msg.includes("angry") || msg.includes("anger") || msg.includes("mad") || msg.includes("frustrated")) {
    return botResponses.angry[Math.floor(Math.random() * botResponses.angry.length)];
  }
  if (msg.includes("happy") || msg.includes("great") || msg.includes("good") || msg.includes("excited")) {
    return botResponses.happy[Math.floor(Math.random() * botResponses.happy.length)];
  }
  if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("nervous") || msg.includes("panic")) {
    return botResponses.anxious[Math.floor(Math.random() * botResponses.anxious.length)];
  }
  if (msg.includes("lonely") || msg.includes("alone") || msg.includes("isolated")) {
    return botResponses.lonely[Math.floor(Math.random() * botResponses.lonely.length)];
  }
  if (msg.includes("tired") || msg.includes("exhausted") || msg.includes("sleepy") || msg.includes("fatigue")) {
    return botResponses.tired[Math.floor(Math.random() * botResponses.tired.length)];
  }
  return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) return;

  const chatBox = document.getElementById("chatBox");

  // Add user message
  chatBox.innerHTML += `
    <div class="chat-message user">
      <div class="chat-bubble user-bubble">${message}</div>
    </div>
  `;

  input.value = "";

  // Scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;

  // Bot typing delay
  setTimeout(() => {
    const response = getBotResponse(message);
    chatBox.innerHTML += `
      <div class="chat-message bot">
        <div class="chat-bubble bot-bubble">${response}</div>
      </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 800);
}
// ── Specialist Auth ──
async function specialistSignup() {
  hideMessages();

  const name = document.getElementById("name").value.trim();
  const specialty = document.getElementById("specialty").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !specialty || !email || !password) {
    showError("errorBox", "Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/specialist-auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, specialty, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    localStorage.setItem("specialistToken", data.token);
    localStorage.setItem("specialist", JSON.stringify(data.specialist));

    showSuccess("successBox", "Account created! Redirecting...");
    setTimeout(() => {
      window.location.href = "specialist-dashboard.html";
    }, 1500);

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function specialistLogin() {
  hideMessages();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showError("errorBox", "Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/specialist-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    localStorage.setItem("specialistToken", data.token);
    localStorage.setItem("specialist", JSON.stringify(data.specialist));

    showSuccess("successBox", "Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "specialist-dashboard.html";
    }, 1500);

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}
// ── Specialist Dashboard ──
async function loadSpecialistDashboard() {
  const token = localStorage.getItem("specialistToken");

  if (!token) {
    window.location.href = "specialist-login.html";
    return;
  }

  const specialist = JSON.parse(localStorage.getItem("specialist"));

  document.getElementById("specialistName").textContent = specialist.name;
  document.getElementById("specialistSpecialty").textContent = specialist.specialty;

  try {
    const res = await fetch(`${API}/api/specialist/me`, {
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = "specialist-login.html";
      return;
    }

    const statusEl = document.getElementById("availabilityStatus");
    statusEl.textContent = data.specialist.isAvailable ? "🟢 Available" : "🔴 Unavailable";
    // Load specialist's bookings/conversations
    const bookingRes = await fetch(`${API}/api/booking/specialist`, {
      headers: { Authorization: token },
    });
    const bookingData = await bookingRes.json();
    const container = document.getElementById("conversationsList");

    if (!bookingData.bookings || bookingData.bookings.length === 0) {
      container.innerHTML = `<p style="color:rgba(255,255,255,0.6);font-size:14px;">No conversations yet.</p>`;
    } else {
      container.innerHTML = bookingData.bookings.map(b => `
        <div class="habit-item">
          <div class="habit-left">
            <div>
              <div class="habit-name">👤 ${b.userId?.name || "User"}</div>
              <div class="habit-streak">${b.userId?.email || ""} • ${b.status}</div>
            </div>
          </div>
          <button class="btn-complete" onclick="window.location.href='live-chat.html?room=${b.roomId}'">
            💬 Chat
          </button>
        </div>
      `).join("");
    }
  } catch (error) {
    console.error("Specialist dashboard error:", error);
  }
}

async function toggleAvailability() {
  const token = localStorage.getItem("specialistToken");

  try {
    const res = await fetch(`${API}/api/specialist/toggle-availability`, {
      method: "PATCH",
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    const statusEl = document.getElementById("availabilityStatus");
    statusEl.textContent = data.isAvailable ? "🟢 Available" : "🔴 Unavailable";

  } catch (error) {
    console.error("Toggle availability error:", error);
  }
}

function specialistLogout() {
  localStorage.removeItem("specialistToken");
  localStorage.removeItem("specialist");
  window.location.href = "specialist-login.html";
}

if (window.location.pathname.includes("specialist-dashboard.html")) {
  loadSpecialistDashboard();
}
// ── Specialists Page ──
let allSpecialists = [];

async function loadSpecialists() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/specialist`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    allSpecialists = data.specialists || [];
    renderSpecialists(allSpecialists);

  } catch (error) {
    console.error("Load specialists error:", error);
    document.getElementById("specialistsList").innerHTML =
      `<p style="color:rgba(255,255,255,0.6);font-size:14px;">Could not load specialists.</p>`;
  }
}

function filterSpecialists(type, btn) {
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");

  let filtered = allSpecialists;

  if (type === "available") {
    filtered = allSpecialists.filter(s => s.isAvailable);
  } else if (type === "rated") {
    filtered = [...allSpecialists].sort((a, b) => b.rating - a.rating);
  }

  renderSpecialists(filtered);
}

function renderSpecialists(specialists) {
  const container = document.getElementById("specialistsList");

  if (specialists.length === 0) {
    container.innerHTML = `<p style="color:rgba(255,255,255,0.6);font-size:14px;">No specialists found.</p>`;
    return;
  }

  container.innerHTML = specialists.map(s => `
    <div class="specialist-card">
      <div class="specialist-top">
        <div class="specialist-avatar">${s.initials || "DR"}</div>
        <div class="specialist-info">
          <div class="specialist-name">${s.name}</div>
          <div class="specialist-specialty">${s.specialty}</div>
          <div class="specialist-rating">⭐ ${s.rating} (${s.reviewCount} reviews)</div>
        </div>
        <span class="specialist-badge ${s.isAvailable ? "badge-available" : "badge-unavailable"}">
          ${s.isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>
      <div class="specialist-actions">
        <button class="btn-chat-specialist" onclick="bookAndChat('${s._id}')">
          💬 Chat
        </button>
        <button class="btn-book-specialist" onclick="bookSpecialist('${s._id}')"
          ${!s.isAvailable ? "disabled" : ""}>
          📅 Book
        </button>
      </div>
    </div>
  `).join("");
}

async function bookSpecialist(specialistId) {
  hideMessages();
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ specialistId }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    showSuccess("successBox", `${data.message} Redirecting to chat...`);
    setTimeout(() => {
      window.location.href = `live-chat.html?room=${data.roomId}&name=${encodeURIComponent(document.querySelector('.specialist-name')?.textContent || 'Specialist')}`;
    }, 1500);

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function bookAndChat(specialistId) {
  hideMessages();
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ specialistId }),
    });

    const data = await res.json();

    // Whether new booking or existing, we get a roomId
    if (data.roomId) {
      window.location.href = `live-chat.html?room=${data.roomId}`;
      return;
    }

    if (!res.ok) {
      showError("errorBox", data.message);
    }

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

if (window.location.pathname.includes("specialists.html")) {
  loadSpecialists();
}
// ── Live Chat (Socket.io) ──
let socket = null;
let currentRoomId = null;
let currentSenderName = null;
let currentSenderId = null;
let isSpecialist = false;

function initLiveChat() {
  const params = new URLSearchParams(window.location.search);
  currentRoomId = params.get("room");

  if (!currentRoomId) {
    alert("No chat room specified.");
    window.location.href = "dashboard.html";
    return;
  }

  const specialistToken = localStorage.getItem("specialistToken");
  const userToken = localStorage.getItem("token");

  if (specialistToken) {
    isSpecialist = true;
    const specialist = JSON.parse(localStorage.getItem("specialist"));
    currentSenderName = specialist.name;
    currentSenderId = specialist.id;
    document.getElementById("chatTitle").textContent = "Session Chat 🩺";
  } else if (userToken) {
    isSpecialist = false;
    const user = JSON.parse(localStorage.getItem("user"));
    currentSenderName = user ? user.name : "User";
    currentSenderId = user ? user.id : "user";
    document.getElementById("chatTitle").textContent = "Session Chat 🌱";
  } else {
    window.location.href = "login.html";
    return;
  }

  socket = io(API);

  socket.emit("join_room", currentRoomId);

  socket.on("receive_message", (data) => {
    displayMessage(data);
  });

  socket.on("connect", () => {
    console.log("Connected to Socket.io ✅");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Socket.io");
  });
}

function displayMessage(data) {
  const chatBox = document.getElementById("chatBox");
  const isMe = String(data.senderId) === String(currentSenderId);

  const div = document.createElement("div");
  div.className = `chat-message ${isMe ? "user" : "bot"}`;
  div.innerHTML = `
    <div class="chat-bubble ${isMe ? "user-bubble" : "bot-bubble"}">
      <div style="font-size:11px;opacity:0.7;margin-bottom:4px;">
        ${isMe ? "You" : data.senderName}
      </div>
      ${data.message}
    </div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendLiveMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message || !socket || !currentRoomId) return;

  const data = {
    roomId: currentRoomId,
    message,
    senderName: currentSenderName,
    senderId: currentSenderId,
    timestamp: new Date().toISOString(),
  };

  socket.emit("send_message", data);
  input.value = "";
}

function goBack() {
  if (isSpecialist) {
    window.location.href = "specialist-dashboard.html";
  } else {
    window.location.href = "specialists.html";
  }
}

if (window.location.pathname.includes("live-chat.html")) {
  initLiveChat();
}
// ── Journal ──
const emotionEmojis = {
  happy: "😊 Happy",
  sad: "😢 Sad",
  anxious: "😰 Anxious",
  angry: "😠 Angry",
  tired: "😴 Tired",
  hopeful: "🌟 Hopeful",
  grateful: "🙏 Grateful",
  neutral: "😐 Neutral",
};

async function loadJournalPrompt() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/journal/prompt`, {
      headers: { Authorization: token },
    });
    const data = await res.json();
    document.getElementById("todayPrompt").textContent = data.prompt;
  } catch (error) {
    document.getElementById("todayPrompt").textContent =
      "What is one thing you're grateful for today?";
  }
}

async function saveJournalEntry() {
  hideMessages();

  const token = localStorage.getItem("token");
  const entry = document.getElementById("journalEntry").value.trim();
  const prompt = document.getElementById("todayPrompt").textContent;

  if (!entry || entry.length < 10) {
    showError("errorBox", "Please write at least a sentence before saving.");
    return;
  }

  const btn = document.querySelector(".btn-primary");
  btn.textContent = "Analyzing... 🌱";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ prompt, entry }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      btn.textContent = "Save & Reflect 🌱";
      btn.disabled = false;
      return;
    }

    // Show analysis
    const analysisCard = document.getElementById("analysisCard");
    document.getElementById("analysisText").textContent = data.aiAnalysis;
    document.getElementById("emotionDetected").textContent =
      emotionEmojis[data.emotion] || "😐 Neutral";
    analysisCard.style.display = "block";

    showSuccess("successBox", "Journal entry saved! 🌱");

    document.getElementById("journalEntry").value = "";
    document.getElementById("wordCount").textContent = "0";
    btn.textContent = "Save & Reflect 🌱";
    btn.disabled = false;

    loadJournalHistory();

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
    btn.textContent = "Save & Reflect 🌱";
    btn.disabled = false;
  }
}

async function loadJournalHistory() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/journal`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    const container = document.getElementById("journalHistory");

    if (!data.entries || data.entries.length === 0) {
      container.innerHTML = `<p style="color:rgba(255,255,255,0.6);font-size:14px;">No entries yet. Write your first one above!</p>`;
      return;
    }

    container.innerHTML = data.entries.map(e => `
      <div class="journal-history-item">
        <div class="journal-history-date">
          ${new Date(e.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div class="journal-history-prompt">"${e.prompt}"</div>
        <div class="journal-history-entry">${e.entry}</div>
        <span class="journal-emotion-badge">${emotionEmojis[e.mood] || "😐 Neutral"}</span>
      </div>
    `).join("");

  } catch (error) {
    console.error("Journal history error:", error);
  }
}

// Word counter
if (window.location.pathname.includes("journal.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.getElementById("journalEntry");
    if (textarea) {
      textarea.addEventListener("input", () => {
        const words = textarea.value.trim().split(/\s+/).filter(w => w).length;
        document.getElementById("wordCount").textContent = words;
      });
    }
  });

  loadJournalPrompt();
  loadJournalHistory();
}
// ── Guided Meditation ──
const meditations = {
  beginner1: {
    title: "Breathing Basics",
    emoji: "🌬️",
    duration: "5 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  beginner2: {
    title: "Morning Calm",
    emoji: "🌿",
    duration: "7 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  stress1: {
    title: "Ocean Breath",
    emoji: "🌊",
    duration: "10 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  stress2: {
    title: "Let It Go",
    emoji: "☁️",
    duration: "8 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  sleep1: {
    title: "Deep Sleep Journey",
    emoji: "🌙",
    duration: "15 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  sleep2: {
    title: "Starlight Relaxation",
    emoji: "⭐",
    duration: "12 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  focus1: {
    title: "Clear Mind",
    emoji: "🎯",
    duration: "10 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  focus2: {
    title: "Deep Focus",
    emoji: "💡",
    duration: "20 min",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
};

let currentAudio = null;
let currentMeditationId = null;
let isPlaying = false;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playMeditation(el, id) {
  const meditation = meditations[id];
  if (!meditation) return;

  // Stop current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Reset all play buttons
  document.querySelectorAll(".meditation-play-btn").forEach(b => b.textContent = "▶");
  document.querySelectorAll(".meditation-item").forEach(i => i.classList.remove("playing"));

  // Set current
  currentMeditationId = id;

  // Show player card
  const playerCard = document.getElementById("playerCard");
  playerCard.style.display = "block";
  document.getElementById("playerEmoji").textContent = meditation.emoji;
  document.getElementById("playerTitle").textContent = meditation.title;
  document.getElementById("playerDuration").textContent = meditation.duration;

  // Create audio
  currentAudio = new Audio(meditation.url);
  currentAudio.volume = document.getElementById("volumeSlider").value;

  // Update progress
  currentAudio.addEventListener("timeupdate", () => {
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    document.getElementById("progressFill").style.width = progress + "%";
    document.getElementById("currentTime").textContent = formatTime(currentAudio.currentTime);
    document.getElementById("totalTime").textContent = formatTime(currentAudio.duration || 0);
  });

  currentAudio.addEventListener("ended", () => {
    isPlaying = false;
    document.getElementById("playPauseBtn").textContent = "▶";
    document.getElementById("progressFill").style.width = "0%";
    el.querySelector(".meditation-play-btn").textContent = "▶";
    el.classList.remove("playing");
  });

  // Play
  currentAudio.play();
  isPlaying = true;
  document.getElementById("playPauseBtn").textContent = "⏸";
  el.querySelector(".meditation-play-btn").textContent = "⏸";
  el.classList.add("playing");

  // Scroll to player
  playerCard.scrollIntoView({ behavior: "smooth" });
}

function togglePlayPause() {
  if (!currentAudio) return;

  if (isPlaying) {
    currentAudio.pause();
    isPlaying = false;
    document.getElementById("playPauseBtn").textContent = "▶";
    if (currentMeditationId) {
      const btn = document.getElementById(`btn-${currentMeditationId}`);
      if (btn) btn.textContent = "▶";
    }
  } else {
    currentAudio.play();
    isPlaying = true;
    document.getElementById("playPauseBtn").textContent = "⏸";
    if (currentMeditationId) {
      const btn = document.getElementById(`btn-${currentMeditationId}`);
      if (btn) btn.textContent = "⏸";
    }
  }
}

function rewindAudio() {
  if (currentAudio) {
    currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
  }
}

function forwardAudio() {
  if (currentAudio) {
    currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
  }
}

function seekAudio(event) {
  if (!currentAudio) return;
  const bar = event.currentTarget;
  const rect = bar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percent = clickX / rect.width;
  currentAudio.currentTime = percent * currentAudio.duration;
}

function changeVolume(value) {
  if (currentAudio) {
    currentAudio.volume = value;
  }
} 
// ── Sleep Sounds ──
const sleepSounds = {
  rain: {
    name: "Rain on Window",
    emoji: "🌧️",
    youtubeId: "q76bMs-NwRk",
  },
  ocean: {
    name: "Ocean Waves",
    emoji: "🌊",
    youtubeId: "WHPEKLQID4U",
  },
  forest: {
    name: "Forest Sounds",
    emoji: "🌲",
    youtubeId: "xNN7iTA57jM",
  },
  thunder: {
    name: "Thunder Storm",
    emoji: "🌩️",
    youtubeId: "nDq6TstdEi8",
  },
  wind: {
    name: "Gentle Wind",
    emoji: "💨",
    youtubeId: "mPZkdNFkNps",
  },
  fire: {
    name: "Soft Fireplace",
    emoji: "🔥",
    youtubeId: "UgHKb_7884o",
  },
  piano: {
    name: "Gentle Piano",
    emoji: "🎹",
    youtubeId: "77ZozI0rw7w",
  },
  whitenoise: {
    name: "White Noise",
    emoji: "📻",
    youtubeId: "1ZYbU82GVz4",
  },
  lofi: {
    name: "Lo-Fi Beats",
    emoji: "🎵",
    youtubeId: "lTRoQ6tg3bE",
  },
  singing: {
    name: "Tibetan Bowls",
    emoji: "🔔",
    youtubeId: "60OzBkwPcCc",
  },
  };

let sleepIsPlaying = false;
let sleepTimerInterval = null;
let sleepTimerSeconds = 0;

function playSleepSound(soundId, el) {
  const sound = sleepSounds[soundId];
  if (!sound) return;

  const existing = document.getElementById("youtubePlayer");
  if (existing) existing.remove();

  document.querySelectorAll(".sleep-sound-card").forEach(c => c.classList.remove("active-sound"));
  el.classList.add("active-sound");

  const playerCard = document.getElementById("sleepPlayerCard");
  playerCard.style.display = "block";
  document.getElementById("sleepEmoji").textContent = sound.emoji;
  document.getElementById("sleepTitle").textContent = sound.name;

  // Create visible YouTube iframe with controls
  const iframeContainer = document.getElementById("youtubeContainer");
  iframeContainer.innerHTML = `
    <iframe 
      id="youtubePlayer"
      width="100%"
      height="80"
      src="https://www.youtube.com/embed/${sound.youtubeId}?autoplay=1&loop=1&playlist=${sound.youtubeId}&mute=0"
      allow="autoplay; encrypted-media"
      allowfullscreen
      style="border-radius:12px;border:none;opacity:0.01;position:absolute;"
    ></iframe>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:8px;">
      🔊 Use your device volume to adjust sound
    </div>
  `;

  sleepIsPlaying = true;
  document.getElementById("sleepPlayPauseBtn").textContent = "⏸";
  playerCard.scrollIntoView({ behavior: "smooth" });
}

function toggleSleepPlayPause() {
  const iframe = document.getElementById("youtubePlayer");
  if (!iframe) return;

  if (sleepIsPlaying) {
    iframe.src = iframe.src.replace("autoplay=1", "autoplay=0");
    sleepIsPlaying = false;
    document.getElementById("sleepPlayPauseBtn").textContent = "▶";
  } else {
    iframe.src = iframe.src.replace("autoplay=0", "autoplay=1");
    sleepIsPlaying = true;
    document.getElementById("sleepPlayPauseBtn").textContent = "⏸";
  }
}

function changeSleepVolume(value) {
  console.log("Volume:", value);
}

function setSleepTimer(minutes) {
  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval);
    sleepTimerInterval = null;
  }

  document.querySelectorAll(".timer-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  if (minutes === 0) {
    document.getElementById("timerDisplay").textContent = "";
    return;
  }

  sleepTimerSeconds = minutes * 60;

  sleepTimerInterval = setInterval(() => {
    sleepTimerSeconds--;
    const m = Math.floor(sleepTimerSeconds / 60);
    const s = sleepTimerSeconds % 60;
    document.getElementById("timerDisplay").textContent =
      `Stops in ${m}:${s.toString().padStart(2, "0")}`;

    if (sleepTimerSeconds <= 0) {
      clearInterval(sleepTimerInterval);
      const iframe = document.getElementById("youtubePlayer");
      if (iframe) iframe.remove();
      sleepIsPlaying = false;
      document.getElementById("sleepPlayPauseBtn").textContent = "▶";
      document.getElementById("timerDisplay").textContent = "Sleep timer ended 🌙";
    }
  }, 1000);
}
// ── Community ──
async function createPost() {
  hideMessages();

  const content = document.getElementById("postContent").value.trim();
  const isAnonymous = document.getElementById("isAnonymous").checked;
  const token = localStorage.getItem("token");

  if (!content) {
    showError("errorBox", "Please write something to share.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/community`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ content, isAnonymous }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError("errorBox", data.message);
      return;
    }

    showSuccess("successBox", data.message);
    document.getElementById("postContent").value = "";
    document.getElementById("charCount").textContent = "0";
    loadPosts();

  } catch (error) {
    showError("errorBox", "Cannot connect to server.");
  }
}

async function likePost(postId, btn) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/community/${postId}/like`, {
      method: "PATCH",
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) return;

    btn.classList.toggle("liked", data.likedByMe);
    btn.innerHTML = `❤️ ${data.likeCount}`;

  } catch (error) {
    console.error("Like error:", error);
  }
}

async function deletePost(postId) {
  const token = localStorage.getItem("token");

  try {
    await fetch(`${API}/api/community/${postId}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    loadPosts();
  } catch (error) {
    console.error("Delete post error:", error);
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function loadPosts() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const res = await fetch(`${API}/api/community`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    const container = document.getElementById("postsFeed");

    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = `<p style="color:rgba(255,255,255,0.6);font-size:14px;">No stories yet. Be the first to share! 🌱</p>`;
      return;
    }

    container.innerHTML = data.posts.map(p => {
      const initials = p.authorName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      const isOwn = user && p.userId === user.id;

      return `
        <div class="post-card">
          <div class="post-header">
            <div class="post-avatar">${p.isAnonymous ? "AU" : initials}</div>
            <div>
              <div class="post-author">${p.authorName}</div>
              <div class="post-time">${timeAgo(p.createdAt)}</div>
            </div>
          </div>
          <div class="post-content">${p.content}</div>
          <div class="post-actions">
            <button class="post-like-btn ${p.likedByMe ? "liked" : ""}"
              onclick="likePost('${p._id}', this)">
              ❤️ ${p.likeCount}
            </button>
            ${isOwn ? `<button class="post-delete-btn" onclick="deletePost('${p._id}')">🗑 Delete</button>` : ""}
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Load posts error:", error);
  }
}

if (window.location.pathname.includes("community.html")) {
  // Character counter
  const textarea = document.getElementById("postContent");
  if (textarea) {
    textarea.addEventListener("input", () => {
      document.getElementById("charCount").textContent = textarea.value.length;
    });
  }
  loadPosts();
}