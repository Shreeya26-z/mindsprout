const API = "https://mindsprout-msjx.onrender.com";
// ── Route Protection ──
const protectedPages = ["dashboard.html", "mood.html", "habit.html", "analytics.html", "chat.html", "specialists.html", "wellness.html", "journal.html", "meditation.html", "sleep-sounds.html", "community.html", "profile.html", "stress.html"];
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
    "I hear you, and I want you to know that what you're feeling is completely valid 💙 Sadness isn't weakness — it's a sign that something matters to you. Take a breath. You don't have to fix everything today. What's weighing on you the most right now?",
    "Sometimes sadness visits us without warning, and that's okay 🌧️ You don't have to pretend to be okay. Be gentle with yourself today — maybe make a warm drink, wrap yourself in a blanket, and just let yourself feel. I'm right here with you.",
    "It takes real courage to acknowledge when we're hurting 💜 You're not alone in this. Even the strongest people have moments when the world feels heavy. Is there one small thing — even tiny — that might bring you a little comfort right now?",
    "Sadness often carries a message worth listening to 🌸 It might be telling you that you need rest, connection, or simply permission to slow down. What do you think your heart is trying to say to you?",
  ],
  stress: [
    "Stress can make everything feel urgent and impossible at the same time 🌬️ Let's slow down for just a moment. Try this with me: breathe in for 4 counts... hold for 4... breathe out for 6. Just that, right now. What's creating the most pressure for you today?",
    "When stress piles up, our nervous system goes into overdrive — and that's exhausting 💚 Remember: you don't have to solve everything at once. Pick just ONE thing. The smallest possible next step. What would that be?",
    "You're carrying a lot, and I see that 🌿 Stress often comes from caring deeply about things that matter. That caring is a strength, even when it doesn't feel like it. What would feel like a relief to let go of, even temporarily?",
    "I want you to know — feeling stressed doesn't mean you're failing 💪 It means you're human and you're trying. Take a 5-minute walk if you can. Fresh air and movement can shift your nervous system out of fight-or-flight mode. You've got this.",
  ],
  angry: [
    "Anger is one of the most misunderstood emotions — it's actually a signal that something important to you has been violated 🔥 Before you react, try this: count slowly to 10 and breathe deeply between each number. What's underneath this anger?",
    "It's completely okay to feel angry — what matters is what we do with it 💪 Try channeling that energy: go for a walk, do some jumping jacks, write it all out in a journal. Physical movement helps release anger safely. What happened that triggered this?",
    "Anger often hides other emotions underneath — hurt, disappointment, or feeling unheard 🌊 Give yourself space to cool down before responding to anyone. You deserve to express yourself from a place of clarity, not reaction. What boundary might need to be spoken?",
    "I hear your frustration, and it's valid 🧘 Sometimes we need to feel angry before we can move forward. But don't let it consume you — you're bigger than this moment. Is there something specific that needs to change in your situation?",
  ],
  happy: [
    "This genuinely makes me smile! 😄 Joy is meant to be celebrated — don't minimize it or rush past it. Pause and really soak in this feeling. What specifically is making your heart feel light today?",
    "YES! This is what we love to hear 🌟 Happiness is contagious — have you thought about sharing this energy with someone who might need it today? A message, a call, even a smile can ripple outward in beautiful ways.",
    "Hold onto this feeling 🎉 Notice exactly what contributed to it — your environment, who you were with, what you were doing. These are clues to what makes you thrive. How can you create more moments like this?",
    "You deserve every bit of this happiness 💛 Don't let anyone or anything rush you past it. Write it down, take a mental photo, call someone you love. Good moments are worth anchoring in your memory.",
  ],
  anxious: [
    "Anxiety can make everything feel like an emergency, even when it isn't 💙 Let's ground you right now. Name 5 things you can see around you. 4 things you can touch. 3 you can hear. 2 you can smell. 1 you can taste. You are safe in this moment.",
    "I hear you — anxiety is one of the hardest things to carry because it's invisible to others but so loud inside 🌬️ Remember: anxiety lies. It tells you the worst will happen, but most of what we fear never does. What's the most likely outcome of what you're facing?",
    "When anxiety spikes, your body is trying to protect you — even if it's being overprotective right now 💚 Try placing your hand on your heart and taking three slow, deep breaths. Feel your heartbeat slow down. You are stronger than this feeling.",
    "Anxiety thrives in uncertainty, so let's focus on what IS within your control 🌿 You can control your breathing, your next small action, and how you talk to yourself. What's one tiny thing you can do in the next 5 minutes to feel more grounded?",
  ],
  lonely: [
    "Loneliness is one of the most painful human experiences — feeling unseen and disconnected cuts deep 💜 But I want you to know: you reaching out right now, even to me, matters. You are not invisible. What kind of connection are you craving most right now?",
    "Feeling lonely doesn't mean you're unlovable — it means you're human and you need connection 🌸 Sometimes loneliness is a signal to nurture our existing relationships. Is there one person — even someone you haven't spoken to in a while — you could reach out to today?",
    "I'm here with you right now, and I don't want you to feel alone 💙 Loneliness often lies to us and tells us we'll always feel this way. That's not true. Connection is possible, even when it feels far away. What's one small step toward feeling less isolated?",
    "You matter more than you may feel right now 🌟 Loneliness can make us withdraw further, which deepens the feeling. What's one community, group, or activity that has made you feel connected in the past — even briefly?",
  ],
  tired: [
    "Your body and mind are sending you an important message right now — please listen 😴 Rest is not laziness. Rest is medicine. You cannot pour from an empty cup. What would true, guilt-free rest look like for you today?",
    "Exhaustion is your body's way of saying 'I've been strong for too long — I need a break' 🌙 And that's okay. You're allowed to slow down. What's one commitment you could temporarily release to give yourself permission to rest?",
    "Sometimes the most productive thing we can do is stop 🌿 Sleep deprivation and mental exhaustion cloud our thinking, our emotions, and our resilience. What would help you recharge — even just a little — in the next hour?",
    "I hear how drained you are 💚 Before anything else, try to do one restorative thing: a short nap, a gentle walk, a few minutes of silence. Your work and responsibilities will still be there after you've taken care of yourself first.",
  ],
  hopeful: [
    "Hope is one of the most powerful forces in the human spirit 🌱 Hold onto this feeling — it's telling you that things CAN get better. What is it that you're feeling hopeful about? Tell me more!",
    "I love this energy! ✨ Hope combined with small, consistent action creates real change. What's one step you could take today toward what you're hoping for?",
    "This is beautiful to hear 🌟 Hope is a choice, and you're making it. What has shifted that's allowing you to feel this way?",
  ],
  grateful: [
    "Gratitude is genuinely one of the most powerful wellness practices — research shows it rewires our brain toward positivity 🙏 What you're feeling right now is real and it matters. Who or what are you feeling most grateful for?",
    "A grateful heart changes everything 🌸 When we focus on what we have rather than what we lack, the world looks different. Is there someone in your life who deserves to hear how grateful you are for them today?",
    "I love that you're practicing gratitude 💛 It's easy to overlook the good when life gets hard. What's something small — something you usually take for granted — that you're appreciating today?",
  ],
  motivation: [
    "You came to the right place 💪 Motivation follows action — not the other way around. You don't wait to feel motivated; you start small and motivation catches up. What's the tiniest possible first step you could take right now?",
    "Here's something powerful: you don't need to feel ready to begin 🌟 Readiness is a feeling that comes AFTER starting, not before. What's one thing you've been putting off that you could spend just 5 minutes on today?",
    "You've got everything you need already inside you 🔥 Sometimes we just need a reminder of our own strength. Think back to a time you overcame something hard. You did it then. You can do this now. What would that version of you say to you right now?",
  ],
  grief: [
    "I'm so sorry for what you're going through 💙 Grief is love with nowhere to go, and it's one of the heaviest things a human being can carry. There's no timeline for healing and no right way to grieve. I'm here with you.",
    "Grief comes in waves — sometimes gentle, sometimes overwhelming 🌊 Be patient with yourself. You don't have to be okay right now. What do you need most in this moment — to talk, to be heard, or just to not feel alone?",
    "Loss changes us, and that's okay 💜 The pain you feel is a testament to how much you loved or cared. Please don't try to rush past it. Is there someone in your life who can sit with you through this?",
  ],
  relationship: [
    "Relationships are one of the most complex and rewarding parts of being human 💙 Whether it's family, friendship, or romance — they take constant nurturing. What's happening in your relationship that's on your mind?",
    "Healthy relationships require honest communication, and that's hard 🌸 It takes courage to express our needs and even more courage to listen to someone else's. What do you wish the other person understood about how you feel?",
    "Every relationship goes through difficult seasons 💚 What matters is whether both people are willing to work through it. What would a resolution look like to you?",
  ],
  sleep: [
    "Sleep is the foundation of everything — mood, focus, resilience, physical health 🌙 When we don't sleep well, everything feels harder. What's getting in the way of your sleep right now?",
    "Poor sleep is often a symptom of an anxious or overactive mind 😴 Try this tonight: no screens 30 minutes before bed, write down tomorrow's tasks so your brain can let go, and keep your room cool and dark. Would our Sleep Sounds feature help?",
    "Your body heals and processes emotions during sleep — it's not wasted time, it's essential time 🌿 What does your bedtime routine look like currently?",
  ],
  default: [
    "Thank you for sharing that with me 🌱 I want to make sure I understand what you're going through. Can you tell me a little more about what's on your mind?",
    "I'm here and I'm listening — all of it 💙 Sometimes just putting words to our feelings helps us understand them better. What else is going on for you?",
    "What you're sharing matters, and so do you 🌿 I may be an AI, but I genuinely care about how you're doing. What would feel most helpful right now — to vent, to get advice, or just to be heard?",
    "Every feeling you have is valid and worth exploring 💜 You don't have to have it all figured out. What's the thing that's taking up the most space in your head right now?",
    "You reached out, and that takes courage 🌟 Whether things are wonderful or really hard right now, I'm glad you're here. What's going on in your world today?",
  ],
};

function getBotResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes("sad") || msg.includes("unhappy") || msg.includes("depressed") || msg.includes("cry") || msg.includes("crying") || msg.includes("heartbroken") || msg.includes("miserable") || msg.includes("down")) {
    return botResponses.sad[Math.floor(Math.random() * botResponses.sad.length)];
  }
  if (msg.includes("stress") || msg.includes("overwhelm") || msg.includes("pressure") || msg.includes("worried") || msg.includes("worry") || msg.includes("burden") || msg.includes("too much")) {
    return botResponses.stress[Math.floor(Math.random() * botResponses.stress.length)];
  }
  if (msg.includes("angry") || msg.includes("anger") || msg.includes("mad") || msg.includes("frustrated") || msg.includes("furious") || msg.includes("rage") || msg.includes("irritated")) {
    return botResponses.angry[Math.floor(Math.random() * botResponses.angry.length)];
  }
  if (msg.includes("happy") || msg.includes("great") || msg.includes("excited") || msg.includes("joy") || msg.includes("wonderful") || msg.includes("amazing") || msg.includes("fantastic") || msg.includes("good")) {
    return botResponses.happy[Math.floor(Math.random() * botResponses.happy.length)];
  }
  if (msg.includes("anxious") || msg.includes("anxiety") || msg.includes("nervous") || msg.includes("panic") || msg.includes("scared") || msg.includes("fear") || msg.includes("dread")) {
    return botResponses.anxious[Math.floor(Math.random() * botResponses.anxious.length)];
  }
  if (msg.includes("lonely") || msg.includes("alone") || msg.includes("isolated") || msg.includes("no one") || msg.includes("nobody") || msg.includes("friendless")) {
    return botResponses.lonely[Math.floor(Math.random() * botResponses.lonely.length)];
  }
  if (msg.includes("tired") || msg.includes("exhausted") || msg.includes("drained") || msg.includes("fatigue") || msg.includes("burnout") || msg.includes("no energy")) {
    return botResponses.tired[Math.floor(Math.random() * botResponses.tired.length)];
  }
  if (msg.includes("hope") || msg.includes("hopeful") || msg.includes("better") || msg.includes("optimis") || msg.includes("looking forward")) {
    return botResponses.hopeful[Math.floor(Math.random() * botResponses.hopeful.length)];
  }
  if (msg.includes("grateful") || msg.includes("thankful") || msg.includes("appreciate") || msg.includes("blessed") || msg.includes("gratitude")) {
    return botResponses.grateful[Math.floor(Math.random() * botResponses.grateful.length)];
  }
  if (msg.includes("motivat") || msg.includes("inspire") || msg.includes("lazy") || msg.includes("procrastinat") || msg.includes("stuck") || msg.includes("can't start")) {
    return botResponses.motivation[Math.floor(Math.random() * botResponses.motivation.length)];
  }
  if (msg.includes("grief") || msg.includes("loss") || msg.includes("lost") || msg.includes("miss") || msg.includes("died") || msg.includes("death") || msg.includes("gone")) {
    return botResponses.grief[Math.floor(Math.random() * botResponses.grief.length)];
  }
  if (msg.includes("relationship") || msg.includes("partner") || msg.includes("boyfriend") || msg.includes("girlfriend") || msg.includes("husband") || msg.includes("wife") || msg.includes("breakup") || msg.includes("divorce") || msg.includes("fight")) {
    return botResponses.relationship[Math.floor(Math.random() * botResponses.relationship.length)];
  }
  if (msg.includes("sleep") || msg.includes("insomnia") || msg.includes("cant sleep") || msg.includes("awake") || msg.includes("nightmare")) {
    return botResponses.sleep[Math.floor(Math.random() * botResponses.sleep.length)];
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
      <div class="nav-card" onclick="window.location.href='stress.html'">
  <div class="nav-card-emoji">🧠</div>
  <div class="nav-card-title">Stress Analysis</div>
  <div class="nav-card-subtitle">Your wellness score</div>
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
    youtubeId: "5qap5aO4i9A",
  },
  singing: {
    name: "Tibetan Bowls",
    emoji: "🔔",
    youtubeId: "L1AzPdkMEC8",
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
// ── Profile ──
async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    // Load user stats
    const userRes = await fetch(`${API}/api/user`, {
      headers: { Authorization: token },
    });
    const userData = await userRes.json();
    const user = userData.user;

    // Profile card
    const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("profileAvatar").textContent = initials;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileBadge").textContent = `${user.badge.emoji} ${user.badge.name}`;

    // Stats
    document.getElementById("profileXP").textContent = user.xp;
    document.getElementById("profileLevel").textContent = user.level;
    document.getElementById("profileStreak").textContent = user.streak;

    // XP bar
    const xpInLevel = user.xp % 50;
    document.getElementById("profileXPBar").style.width = `${(xpInLevel / 50) * 100}%`;
    document.getElementById("profileXPLabel").textContent = `${xpInLevel} / 50 XP to Level ${user.level + 1}`;

    // Load mood count
    const moodRes = await fetch(`${API}/api/mood`, {
      headers: { Authorization: token },
    });
    const moodData = await moodRes.json();
    document.getElementById("profileMoods").textContent = moodData.moods?.length || 0;

    // Achievements
    const achievements = [
      {
        emoji: "🌱",
        name: "First Step",
        desc: "Log your first mood",
        unlocked: moodData.moods?.length > 0,
      },
      {
        emoji: "🔥",
        name: "On Fire",
        desc: "3 day streak",
        unlocked: user.streak >= 3,
      },
      {
        emoji: "⭐",
        name: "XP Hunter",
        desc: "Earn 50 XP",
        unlocked: user.xp >= 50,
      },
      {
        emoji: "🏆",
        name: "Consistent",
        desc: "Earn 100 XP",
        unlocked: user.xp >= 100,
      },
      {
        emoji: "💜",
        name: "Community",
        desc: "Share a story",
        unlocked: user.xp >= 5,
      },
      {
        emoji: "🧘",
        name: "Mindful",
        desc: "Try meditation",
        unlocked: user.xp >= 10,
      },
      {
        emoji: "📓",
        name: "Journaler",
        desc: "Write a journal entry",
        unlocked: user.xp >= 15,
      },
      {
        emoji: "🌟",
        name: "Master",
        desc: "Reach Level 5",
        unlocked: user.level >= 5,
      },
    ];

    document.getElementById("achievementsList").innerHTML = achievements.map(a => `
      <div class="achievement-card ${a.unlocked ? "unlocked" : "locked"}">
        <div class="achievement-emoji">${a.emoji}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.unlocked ? a.desc : "🔒 " + a.desc}</div>
      </div>
    `).join("");

  } catch (error) {
    console.error("Profile error:", error);
  }
}

if (window.location.pathname.includes("profile.html")) {
  loadProfile();
}
// ── Profile ──
async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    const userRes = await fetch(`${API}/api/user`, {
      headers: { Authorization: token },
    });
    const userData = await userRes.json();
    const user = userData.user;

    const initials = user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("profileAvatar").textContent = initials;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileStreak").textContent = user.streak;

    // Pre-fill account settings
    document.getElementById("settingsName").value = user.name;
    document.getElementById("settingsEmail").value = user.email;

    // Load mood count as sessions
    const moodRes = await fetch(`${API}/api/mood`, {
      headers: { Authorization: token },
    });
    const moodData = await moodRes.json();
    document.getElementById("profileSessions").textContent = moodData.moods?.length || 0;

    // Load community posts count
    const postsRes = await fetch(`${API}/api/community`, {
      headers: { Authorization: token },
    });
    const postsData = await postsRes.json();
    const myPosts = postsData.posts?.filter(p => p.userId === user.id) || [];
    document.getElementById("profilePosts").textContent = myPosts.length;

  } catch (error) {
    console.error("Profile error:", error);
  }
}

function showAccountSettings() {
  document.getElementById("accountModal").classList.add("active");
}

function showNotifications() {
  document.getElementById("notificationsModal").classList.add("active");
}

function showPrivacy() {
  document.getElementById("privacyModal").classList.add("active");
}

function showHelp() {
  document.getElementById("helpModal").classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function upgradePlan() {
  const status = document.getElementById("premiumStatus");
  const desc = document.getElementById("premiumDesc");
  const btn = document.querySelector(".premium-row .btn-add");

  status.textContent = "⭐ Premium Plan";
  desc.textContent = "Active until Dec 2025";
  btn.textContent = "Active ✅";
  btn.disabled = true;
  btn.style.background = "rgba(80,200,120,0.3)";
  btn.style.color = "white";
}

function saveSettings() {
  closeModal("accountModal");
  alert("Settings saved! ✅");
}

if (window.location.pathname.includes("profile.html")) {
  loadProfile();
}
// ── Bottom Navigation Bar ──
function addBottomNav() {
  const pagesWithNav = [
    "dashboard.html",
    "mood.html",
    "habit.html",
    "analytics.html",
    "chat.html",
    "specialists.html",
    "wellness.html",
    "journal.html",
    "meditation.html",
    "sleep-sounds.html",
    "community.html",
    "profile.html",
  ];

  const currentPage = window.location.pathname.split("/").pop();
  if (!pagesWithNav.includes(currentPage)) return;

  const navItems = [
    { emoji: "🏠", label: "Home", page: "dashboard.html" },
    { emoji: "📊", label: "Analytics", page: "analytics.html" },
    { emoji: "💜", label: "Community", page: "community.html" },
    { emoji: "🤖", label: "MindBot", page: "chat.html" },
    { emoji: "👤", label: "Profile", page: "profile.html" },
  ];

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";

  nav.innerHTML = navItems.map(item => `
    <div class="bottom-nav-item ${currentPage === item.page ? "active" : ""}"
      onclick="window.location.href='${item.page}'">
      <span class="bottom-nav-emoji">${item.emoji}</span>
      <span class="bottom-nav-label">${item.label}</span>
    </div>
  `).join("");

  document.body.appendChild(nav);
}

// Run on every page
addBottomNav();
// ── Stress Analysis ──
async function loadStressAnalysis() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/api/stress`, {
      headers: { Authorization: token },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Stress analysis error:", data.message);
      return;
    }

    // Overall score
    document.getElementById("stressEmoji").textContent = data.stressEmoji;
    document.getElementById("stressScore").textContent = data.overallScore;
    document.getElementById("stressLabel").textContent = data.stressLevel;

    setTimeout(() => {
      document.getElementById("stressBarFill").style.width = data.overallScore + "%";
    }, 300);

    // Description
    const descs = {
      "Low Stress": "You're doing amazing! Your wellness habits are paying off. Keep up the great work! 🌟",
      "Moderate": "You're managing well overall. A few small improvements could boost your wellness score significantly.",
      "High Stress": "Your data suggests you may be under significant stress. Let's work on some areas together.",
      "Critical": "Your wellness needs attention right now. Please consider speaking to a specialist or trusted person.",
    };
    document.getElementById("stressDesc").textContent = descs[data.stressLevel] || "";

    // Breakdown
    const b = data.breakdown;
    document.getElementById("breakdownGrid").innerHTML = `
      <div class="breakdown-card">
        <div class="breakdown-score">${b.mood.score}</div>
        <div class="breakdown-label">😊 Mood Score<br/>${b.mood.count} entries this week</div>
        <div class="breakdown-mini-bar">
          <div class="breakdown-mini-fill" style="width:${b.mood.score}%"></div>
        </div>
      </div>
      <div class="breakdown-card">
        <div class="breakdown-score">${b.habits.score}</div>
        <div class="breakdown-label">📅 Habit Completion<br/>${b.habits.count} done today</div>
        <div class="breakdown-mini-bar">
          <div class="breakdown-mini-fill" style="width:${b.habits.score}%"></div>
        </div>
      </div>
      <div class="breakdown-card">
        <div class="breakdown-score">${b.journal.score}</div>
        <div class="breakdown-label">📓 Journal Wellbeing<br/>${b.journal.count} entries this week</div>
        <div class="breakdown-mini-bar">
          <div class="breakdown-mini-fill" style="width:${b.journal.score}%"></div>
        </div>
      </div>
      <div class="breakdown-card">
        <div class="breakdown-score">${b.streak.score}</div>
        <div class="breakdown-label">🔥 Streak Score<br/>${b.streak.days} day streak</div>
        <div class="breakdown-mini-bar">
          <div class="breakdown-mini-fill" style="width:${b.streak.score}%"></div>
        </div>
      </div>
    `;

    // Radar Chart
    const ctx = document.getElementById("radarChart").getContext("2d");
    new Chart(ctx, {
      type: "radar",
      data: {
        labels: ["Mood", "Habits", "Journal", "Streak"],
        datasets: [{
          label: "Your Wellness",
          data: [b.mood.score, b.habits.score, b.journal.score, b.streak.score],
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.8)",
          pointBackgroundColor: "white",
          pointBorderColor: "#764ba2",
          pointRadius: 6,
        }],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { color: "rgba(255,255,255,0.5)", stepSize: 25 },
            grid: { color: "rgba(255,255,255,0.1)" },
            pointLabels: { color: "white", font: { size: 13 } },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });

    // Recommendations
    document.getElementById("recommendationsList").innerHTML =
      data.recommendations.map(r => `
        <div class="recommendation-card">
          <div class="rec-icon">${r.icon}</div>
          <div class="rec-content">
            <div class="rec-title">${r.title}</div>
            <div class="rec-desc">${r.desc}</div>
            <button class="rec-action-btn"
              onclick="window.location.href='${r.action}'">
              ${r.actionLabel} →
            </button>
          </div>
        </div>
      `).join("");

  } catch (error) {
    console.error("Stress analysis error:", error);
  }
}

if (window.location.pathname.includes("stress.html")) {
  loadStressAnalysis();
}