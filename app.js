const categories = Object.keys(vocab);

// ════════════════════════════════════════════════
// GLOBAL STATE
// ════════════════════════════════════════════════
let currentPanel = "dashboard";
let sidebarOpen = window.innerWidth > 768;

// flashcard state
let fcCat = categories[0];
let fcIdx = 0;
let fcFlipped = false;
let fcCards = [];
let fcFilter = "";

// quiz states (index + score per section)
const qState = {};
["h1", "h2", "h3", "l1", "l2", "l3", "s1", "s2", "sp2", "sp3"].forEach((k) => {
  qState[k] = { idx: 0, score: 0, answered: {} };
});

// ════════════════════════════════════════════════
// LAYOUT
// ════════════════════════════════════════════════
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open", sidebarOpen);
    sidebar.classList.remove("closed");
    if (backdrop) backdrop.classList.toggle("active", sidebarOpen);
  } else {
    sidebar.classList.toggle("closed", !sidebarOpen);
    sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
  }
}

const panelMeta = {
  dashboard: { title: "Dashboard", sub: "Goethe A1 Exam Prep" },
  flashcards: { title: "📚 Flashcards", sub: "Vocabulary" },
  hoeren1: { title: "🎧 Hören Teil 1", sub: "Multiple Choice – 300 questions" },
  hoeren2: { title: "🎧 Hören Teil 2", sub: "Richtig / Falsch – 300 questions" },
  hoeren3: { title: "📞 Hören Teil 3", sub: "Voicemail Comprehension – 300 questions" },
  lesen1: { title: "📖 Lesen Teil 1", sub: "Richtig / Falsch – 50 sets" },
  lesen2: { title: "🔍 Lesen Teil 2", sub: "Match the Ad – 210 questions" },
  lesen3: { title: "🪧 Lesen Teil 3", sub: "Signs & Notices – 100 questions" },
  schreiben1: { title: "📝 Schreiben Teil 1", sub: "Form Filling – 30 exercises" },
  schreiben2: { title: "✉️ Schreiben Teil 2", sub: "Email Writing – 44 prompts" },
  sprechen2: { title: "🗣 Sprechen Teil 2", sub: "Answer Questions – 298 prompts" },
  sprechen3: { title: "🙋 Sprechen Teil 3", sub: "Asking Questions – 163 cards" },
};

function showPanel(name, navEl) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  if (navEl) navEl.classList.add("active");
  else {
    const match = document.querySelector(`[data-panel="${name}"]`);
    if (match) match.classList.add("active");
  }
  const m = panelMeta[name] || {};
  document.getElementById("topbar-title").textContent = m.title || name;
  document.getElementById("topbar-sub").textContent = m.sub || "";
  currentPanel = name;

  // Close sidebar on mobile after choosing a panel
  if (window.innerWidth <= 768) {
    sidebarOpen = false;
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
  }

  // lazy render
  if (name === "flashcards") fcInit();
  else if (name === "hoeren1") renderH1();
  else if (name === "hoeren2") renderH2();
  else if (name === "hoeren3") renderH3();
  else if (name === "lesen1") renderL1();
  else if (name === "lesen2") renderL2();
  else if (name === "lesen3") renderL3();
  else if (name === "schreiben1") renderS1();
  else if (name === "schreiben2") renderS2();
  else if (name === "sprechen2") renderSp2();
  else if (name === "sprechen3") renderSp3();
}

// ════════════════════════════════════════════════
// FLASHCARDS
// ════════════════════════════════════════════════
const catEmojisFC = {
  Alphabet: "🔤",
  Numbers: "🔢",
  "Ordinal Numbers": "🔢",
  "Roman Numbers": "Ⅻ",
  Months: "📅",
  "Days & Times of Day": "🌅",
  Time: "🕐",
  Weekdays: "📆",
  "Time Measurements": "⏱",
  "Years & Seasons": "🍂",
  Colors: "🎨",
  "Countries & Nationalities": "🌍",
  Directions: "🧭",
  Greetings: "👋",
  "Travel & Transport": "✈️",
  "Places & Locations": "🏛",
  "Food & Drinks": "🍽",
  "House & Objects": "🏠",
  "Work & School": "💼",
  "Shopping & Money": "🛍",
  "Doctor & Health": "⚕️",
  "Emotions & Attitudes": "💭",
  "Weather & Nature": "🌤",
  Restaurant: "🍷",
  "Parts of Body": "🫀",
  "Signs & Notices": "🪧",
  "Internet & Technology": "💻",
  "Measures & Weight": "⚖️",
  "Family & Relatives": "👪",
  "Personal Information": "🧾",
  "Introducing Yourself": "🙋",
  "Hobbies & Free Time": "🎯",
  "Daily Routine": "⏰",
  "Clothing & Accessories": "👗",
  "Family Celebrations": "🎉",
  "Birthday & Age": "🎂",
  Furniture: "🛋",
  "Household Activities": "🧹",
  "Pets & Animals": "🐾",
  "City & Village": "🏙",
  "Public Services": "🏛",
  "Bank & Post Office": "🏦",
  "Telephone & Communication": "📞",
  "Computer & Technology": "💻",
  "Leisure Activities": "🎲",
  "Sports & Fitness": "🏃",
  "Holidays & Vacation": "🏖",
  "Hotel & Accommodation": "🏨",
  "At the Train Station": "🚉",
  "At the Airport": "✈️",
  "Emergency Situations": "🚑",
  Invitations: "🎫",
  "Festivals & Holidays": "🎊",
  "Friends & Relationships": "🤝",
  "Personality Traits": "🧠",
  "Education & Subjects": "🎓",
  "Jobs & Professions": "💼",
  "Office Vocabulary": "📎",
  "Kitchen Vocabulary": "🍳",
  "Fruits & Vegetables": "🥦",
  "Family Life": "🏡",
  Environment: "🌿",
  "Television & Media": "📺",
  "Music & Entertainment": "🎵",
  "Reading & Books": "📚",
  "Apartment & Rent": "🏠",
  Neighborhood: "🏘",
  "Basic Verbs": "🔁",
  "Common Adjectives": "✨",
  "Common Nouns": "📦",
  Prepositions: "📍",
  "Question Words (W-Fragen)": "❓",
  "Daily Activities": "📝",
  "Giving Opinions": "🗣",
  "Likes & Dislikes": "👍",
  "Simple Conversations": "💬",
  "Forms & Applications": "📝",
  "Classroom Vocabulary": "🏫",
  "Common Expressions": "🗨",
  "Household Appliances": "🔌",
  "Festivals in Germany": "🍺",
  "Cultural Activities": "🎭",
  "Health Emergencies": "🚨",
  "Personal Hygiene": "🧼",
  "Appearance & Description": "👀",
  "Transportation Tickets": "🎟",
  "Weekend Activities": "🛶",
  "Social Media & Communication": "🌐",
};

function fcInit() {
  fcRenderCatList();
  fcLoadCat(fcCat);
}
function fcFilterCats(v) {
  fcFilter = v;
  fcRenderCatList();
}
function fcRenderCatList() {
  const list = document.getElementById("fc-cat-list");
  list.innerHTML = "";
  const f = fcFilter.trim().toLowerCase();
  categories
    .filter((c) => !f || c.toLowerCase().includes(f))
    .forEach((cat) => {
      const el = document.createElement("div");
      el.className = "cat-item" + (cat === fcCat ? " active" : "");
      el.innerHTML = `<span>${catEmojisFC[cat] || "📖"}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis">${cat}</span><span class="cc">${vocab[cat].length}</span>`;
      el.onclick = () => fcLoadCat(cat);
      list.appendChild(el);
    });
}
function fcLoadCat(cat) {
  fcCat = cat;
  fcIdx = 0;
  fcFlipped = false;
  fcCards = [...vocab[cat]];
  fcRenderCatList();
  fcRenderCard();
  fcRenderWordList();
}
function fcRenderCard() {
  if (!fcCards.length) return;
  const c = fcCards[fcIdx];
  document.getElementById("fc-front").textContent = c.front;
  document.getElementById("fc-back").textContent = c.back;
  document.getElementById("fc-article").textContent = c.article ? "Article: " + c.article : "";
  document.getElementById("fc-example").textContent = c.example || "";
  document.getElementById("fc-progress").style.width = ((fcIdx + 1) / fcCards.length) * 100 + "%";
  document.getElementById("fc-num").textContent = fcIdx + 1 + " / " + fcCards.length;
  document.getElementById("fc-card-inner").classList.toggle("flipped", fcFlipped);
  // highlight in word list
  document
    .querySelectorAll("#fc-word-items .word-item")
    .forEach((el, i) => el.classList.toggle("active", i === fcIdx));
}
function fcRenderWordList() {
  const container = document.getElementById("fc-word-items");
  container.innerHTML = "";
  fcCards.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "word-item" + (i === fcIdx ? " active" : "");
    el.innerHTML = `<span class="word-term">${c.front}</span><span class="word-expl">${c.back}</span>`;
    el.onclick = () => {
      fcIdx = i;
      fcFlipped = false;
      fcRenderCard();
    };
    container.appendChild(el);
  });
}
function fcFlip() {
  fcFlipped = !fcFlipped;
  fcRenderCard();
}
function fcNext() {
  fcFlipped = false;
  fcIdx = (fcIdx + 1) % fcCards.length;
  fcRenderCard();
}
function fcPrev() {
  fcFlipped = false;
  fcIdx = (fcIdx - 1 + fcCards.length) % fcCards.length;
  fcRenderCard();
}
function fcShuffle() {
  for (let i = fcCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fcCards[i], fcCards[j]] = [fcCards[j], fcCards[i]];
  }
  fcIdx = 0;
  fcFlipped = false;
  fcRenderCard();
  fcRenderWordList();
}
function fcSpeak() {
  if (!fcCards.length) return;
  const u = new SpeechSynthesisUtterance(fcCards[fcIdx].front);
  u.lang = "de-DE";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
document.addEventListener("keydown", (e) => {
  if (currentPanel !== "flashcards") return;
  if (e.code === "Space") {
    e.preventDefault();
    fcFlip();
  } else if (e.code === "ArrowRight") {
    e.preventDefault();
    fcNext();
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    fcPrev();
  }
});

// ════════════════════════════════════════════════
// QUIZ HELPERS
// ════════════════════════════════════════════════
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function checkAnswerMatch(userVal, correctVal) {
  if (!userVal || !correctVal) return false;
  const clean = (s) =>
    String(s)
      .toLowerCase()
      .trim()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return clean(userVal) === clean(correctVal);
}
function randomSubset(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function quizNavHtml(key, idx, total) {
  return `<div class="nav-row-quiz">
    <button class="q-btn" onclick="qNav('${key}',-1)">← Prev</button>
    <span class="q-counter">${idx + 1} / ${total}</span>
    <button class="q-btn" onclick="qNav('${key}',1)">Next →</button>
    <button class="q-btn" onclick="qReset('${key}')">↺ Reset</button>
  </div>`;
}

function quizScoreHtml(key) {
  const s = qState[key];
  const total = Object.keys(s.answered).length;
  return total ? `<div class="quiz-score-box">✅ ${s.score} / ${total}</div>` : "";
}

function qNav(key, dir) {
  window.speechSynthesis.cancel();
  const s = qState[key];
  const data = getQData(key);
  s.idx = (s.idx + dir + data.length) % data.length;
  renderSection(key);
}
function qReset(key) {
  qState[key] = { idx: 0, score: 0, answered: {} };
  renderSection(key);
}
function getQData(key) {
  if (key === "h1") return D.hoeren1;
  if (key === "h2") return D.hoeren2;
  if (key === "h3") return D.hoeren3;
  if (key === "l1") return D.lesen1;
  if (key === "l2") return D.lesen2;
  if (key === "l3") return D.lesen3;
  if (key === "s1") return D.schreiben1;
  if (key === "s2") return D.schreiben2;
  if (key === "sp2") return D.sprechen2;
  if (key === "sp3") return D.sprechen3;
  return [];
}
function renderSection(key) {
  if (key === "h1") renderH1();
  else if (key === "h2") renderH2();
  else if (key === "h3") renderH3();
  else if (key === "l1") renderL1();
  else if (key === "l2") renderL2();
  else if (key === "l3") renderL3();
  else if (key === "s1") renderS1();
  else if (key === "s2") renderS2();
  else if (key === "sp2") renderSp2();
  else if (key === "sp3") renderSp3();
}

// ════════════════════════════════════════════════
// AUDIO TTS SYSTEM
// ════════════════════════════════════════════════
const audioState = {};

function getAudioState(key) {
  if (!audioState[key]) audioState[key] = {};
  const idx = qState[key].idx;
  if (!audioState[key][idx]) audioState[key][idx] = { played: 0, playing: false };
  return audioState[key][idx];
}

function playTTS(key, maxPlays) {
  const st = getAudioState(key);
  if (st.playing || st.played >= maxPlays) return;

  const data = getQData(key);
  const q = data[qState[key].idx];
  const text = q.dialogue || q.audio_transcript || "";

  st.playing = true;
  st.played++;
  renderSection(key);

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "de-DE";
  utter.rate = 0.88;
  utter.pitch = 1.0;

  // Try to find a German voice
  const voices = window.speechSynthesis.getVoices();
  const deVoice = voices.find((v) => v.lang && v.lang.startsWith("de"));
  if (deVoice) utter.voice = deVoice;

  utter.onend = () => {
    st.playing = false;
    renderSection(key);
  };
  utter.onerror = () => {
    st.playing = false;
    renderSection(key);
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function audioPlayerHtml(key, maxPlays) {
  const st = getAudioState(key);
  const remaining = maxPlays - st.played;
  const canPlay = !st.playing && remaining > 0;
  const statusText = st.playing ? "🔊 Playing…" : remaining <= 0 ? "✓ Audio played" : "";
  const btnLabel = st.playing ? "🔊 Playing…" : remaining <= 0 ? "✓ Done" : "▶ Play Audio";
  const playsLabel =
    remaining > 0 ? `(${remaining} play${remaining > 1 ? "s" : ""} remaining)` : "";

  return `<div class="audio-player">
    <div class="audio-controls">
      <button class="play-btn" onclick="playTTS('${key}', ${maxPlays})" ${canPlay ? "" : "disabled"}>${btnLabel}</button>
      <span class="play-count">${playsLabel}</span>
      <span class="audio-status">${statusText}</span>
    </div>
  </div>`;
}

// Preload voices
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

// ════════════════════════════════════════════════
// HÖREN 1 – Multiple choice
// ════════════════════════════════════════════════
function renderH1() {
  const key = "h1";
  const s = qState[key];
  const data = D.hoeren1;
  const q = data[s.idx];
  const ans = s.answered[s.idx];
  const opts = q.options;
  const letters = Object.keys(opts);

  let optHtml = letters
    .map((l) => {
      let cls = "option-btn";
      if (ans !== undefined) {
        if (l === q.answer) cls += " correct";
        else if (l === ans && ans !== q.answer) cls += " wrong";
        else cls += " revealed";
      }
      return `<button class="${cls}" onclick="answerH1('${l}')" ${ans !== undefined ? "disabled" : ""}>
      <span class="option-letter">${l.toUpperCase()}</span>${escHtml(opts[l])}
    </button>`;
    })
    .join("");

  const expl =
    ans !== undefined ? `<div class="explanation">💡 ${escHtml(q.explanation || "")}</div>` : "";
  const transcript = q.dialogue || q.audio_transcript || "";
  const showTrans = s.answered[s.idx] !== undefined || audioState["h1"]?.[s.idx]?.played >= 2;
  const transHtml = showTrans
    ? `<div class="transcript-box">${escHtml(transcript)}</div>`
    : `<div style="font-size:12px;color:var(--muted);margin-bottom:8px;font-style:italic">Listen to the audio, then answer. Transcript shows after 2 plays.</div>`;

  document.getElementById("h1-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Hören Teil 1</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Question ${s.idx + 1} of ${data.length} · Topic: ${escHtml(q.topic || "")}</div>
      ${audioPlayerHtml("h1", 2)}
      ${transHtml}
      <div class="question-text">${escHtml(q.question)}</div>
      <div class="options">${optHtml}</div>
      ${expl}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function answerH1(l) {
  const s = qState["h1"];
  const q = D.hoeren1[s.idx];
  if (s.answered[s.idx] !== undefined) return;
  s.answered[s.idx] = l;
  if (l === q.answer) s.score++;
  renderH1();
}

// ════════════════════════════════════════════════
// HÖREN 2 – Richtig/Falsch
// ════════════════════════════════════════════════
function renderH2() {
  const key = "h2";
  const s = qState[key];
  const data = D.hoeren2;
  const q = data[s.idx];
  const ans = s.answered[s.idx];
  const correct = q.answer === "Richtig";

  function tfCls(val) {
    if (ans === undefined) return "tf-btn";
    const chosen = (val === "Richtig") === (ans === true);
    const isRight = (val === "Richtig") === correct;
    if (isRight) return "tf-btn correct";
    if (chosen && !isRight) return "tf-btn wrong";
    return "tf-btn";
  }

  const expl =
    ans !== undefined ? `<div class="explanation">💡 ${escHtml(q.explanation || "")}</div>` : "";
  const transcriptH2 = q.audio_transcript || "";
  const showTransH2 = ans !== undefined || audioState["h2"]?.[s.idx]?.played >= 1;
  const transHtmlH2 = showTransH2
    ? `<div class="transcript-box">${escHtml(transcriptH2)}</div>`
    : `<div style="font-size:12px;color:var(--muted);margin-bottom:8px;font-style:italic">Listen once, then decide Richtig or Falsch. Transcript shows after playing.</div>`;

  document.getElementById("h2-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Hören Teil 2</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Question ${s.idx + 1} of ${data.length} · Context: ${escHtml(q.context || "")}</div>
      ${audioPlayerHtml("h2", 1)}
      ${transHtmlH2}
      <div class="question-text">${escHtml(q.statement)}</div>
      <div class="tf-options">
        <button class="${tfCls("Richtig")}" onclick="answerH2(true)" ${ans !== undefined ? "disabled" : ""}>✔ Richtig</button>
        <button class="${tfCls("Falsch")}" onclick="answerH2(false)" ${ans !== undefined ? "disabled" : ""}>✗ Falsch</button>
      </div>
      ${expl}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function answerH2(val) {
  const s = qState["h2"];
  const q = D.hoeren2[s.idx];
  if (s.answered[s.idx] !== undefined) return;
  s.answered[s.idx] = val;
  if ((val === true) === (q.answer === "Richtig")) s.score++;
  renderH2();
}

// ════════════════════════════════════════════════
// HÖREN 3 – Multiple choice (voicemail)
// ════════════════════════════════════════════════
function renderH3() {
  const key = "h3";
  const s = qState[key];
  const data = D.hoeren3;
  const q = data[s.idx];
  const ans = s.answered[s.idx];
  const opts = q.options || {};
  const letters = Object.keys(opts);

  let optHtml = letters
    .map((l) => {
      let cls = "option-btn";
      if (ans !== undefined) {
        if (l === q.correct_answer) cls += " correct";
        else if (l === ans) cls += " wrong";
        else cls += " revealed";
      }
      return `<button class="${cls}" onclick="answerH3('${l}')" ${ans !== undefined ? "disabled" : ""}>
      <span class="option-letter">${l.toUpperCase()}</span>${escHtml(opts[l])}
    </button>`;
    })
    .join("");

  const transcriptH3 = q.audio_transcript || "";
  const showTransH3 = q._showTrans || ans !== undefined || audioState["h3"]?.[s.idx]?.played >= 2;
  const transBtn = `<button class="show-trans-btn" onclick="toggleH3Trans(${s.idx})">
    ${showTransH3 ? "▲ Hide transcript" : "▼ Show transcript"}
  </button>`;
  const transBox = showTransH3 ? `<div class="transcript-box">${escHtml(transcriptH3)}</div>` : "";

  document.getElementById("h3-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Hören Teil 3</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Question ${s.idx + 1} of ${data.length}</div>
      ${audioPlayerHtml("h3", 2)}
      <div style="margin-bottom:8px">${transBtn}</div>
      ${transBox}
      <div class="question-text">${escHtml(q.question || "")}</div>
      <div class="options">${optHtml}</div>
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function toggleH3Trans(idx) {
  D.hoeren3[idx]._showTrans = !D.hoeren3[idx]._showTrans;
  renderH3();
}
function answerH3(l) {
  const s = qState["h3"];
  const q = D.hoeren3[s.idx];
  if (s.answered[s.idx] !== undefined) return;
  s.answered[s.idx] = l;
  if (l === q.correct_answer) s.score++;
  renderH3();
}

// ════════════════════════════════════════════════
// LESEN 1 – Richtig/Falsch on sets
// ════════════════════════════════════════════════
function renderL1() {
  const key = "l1";
  const s = qState[key];
  const data = D.lesen1;
  const set = data[s.idx];
  const ans = s.answered[s.idx] || {};

  let qHtml = set.questions
    .map((q, qi) => {
      const a = ans[qi];
      const correct = q.answer === "Richtig";
      function tfCls(val) {
        if (a === undefined) return "tf-btn";
        const chosen = (val === "Richtig") === (a === true);
        const isRight = (val === "Richtig") === correct;
        if (isRight) return "tf-btn correct";
        if (chosen && !isRight) return "tf-btn wrong";
        return "tf-btn";
      }
      const expl =
        a !== undefined ? `<div class="explanation">💡 ${escHtml(q.explanation || "")}</div>` : "";
      const allDone = Object.keys(ans).length >= set.questions.length;
      return `<div style="margin-bottom:14px">
      <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text)">${qi + 1}. ${escHtml(q.statement)}</div>
      <div class="tf-options">
        <button class="${tfCls("Richtig")}" onclick="answerL1(${qi},true)" ${a !== undefined ? "disabled" : ""}>✔ Richtig</button>
        <button class="${tfCls("Falsch")}" onclick="answerL1(${qi},false)" ${a !== undefined ? "disabled" : ""}>✗ Falsch</button>
      </div>${expl}
    </div>`;
    })
    .join("");

  document.getElementById("l1-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Lesen Teil 1</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Set ${s.idx + 1} of ${data.length}</div>
      <span class="text-type-tag">${escHtml(set.text_type || "Text")}</span>
      <div class="text-passage">${escHtml(set.text).replace(/\n/g, "<br>")}</div>
      ${qHtml}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function answerL1(qi, val) {
  const s = qState["l1"];
  const set = D.lesen1[s.idx];
  if (!s.answered[s.idx]) s.answered[s.idx] = {};
  if (s.answered[s.idx][qi] !== undefined) return;
  s.answered[s.idx][qi] = val;
  if ((val === true) === (set.questions[qi].answer === "Richtig")) s.score++;
  renderL1();
}

// ════════════════════════════════════════════════
// LESEN 2 – Match the ad
// ════════════════════════════════════════════════
function renderL2() {
  const key = "l2";
  const s = qState[key];
  const data = D.lesen2;
  const q = data[s.idx];
  const ans = s.answered[s.idx];
  const opts = q.options || {};
  const letters = Object.keys(opts);

  let optHtml = letters
    .map((l) => {
      const o = opts[l];
      let cls = "l2-option";
      if (ans !== undefined) {
        if (l === q.answer) cls += " correct";
        else if (l === ans) cls += " wrong";
      }
      const details = (o.details || []).map((d) => `• ${escHtml(d)}`).join("<br>");
      return `<div class="${cls}" onclick="answerL2('${l}')" style="${ans !== undefined ? "pointer-events:none" : ""}">
      <div class="l2-option-letter">Option ${l.toUpperCase()}</div>
      <div class="l2-option-title">${escHtml(o.title || "")}</div>
      ${o.url ? `<div class="l2-option-url">🔗 ${escHtml(o.url)}</div>` : ""}
      <div class="l2-option-details">${details}</div>
    </div>`;
    })
    .join("");

  const expl =
    ans !== undefined ? `<div class="explanation">💡 ${escHtml(q.explanation || "")}</div>` : "";

  document.getElementById("l2-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Lesen Teil 2</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Question ${s.idx + 1} of ${data.length}</div>
      <div class="situation-box"><strong>Situation:</strong> ${escHtml(q.situation)}</div>
      <div style="margin-bottom:10px;font-size:13px;color:var(--muted)">Which option best fits the situation?</div>
      <div class="lesen2-options">${optHtml}</div>
      ${expl}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function answerL2(l) {
  const s = qState["l2"];
  const q = D.lesen2[s.idx];
  if (s.answered[s.idx] !== undefined) return;
  s.answered[s.idx] = l;
  if (l === q.answer) s.score++;
  renderL2();
}

// ════════════════════════════════════════════════
// LESEN 3 – Richtig/Falsch (signs)
// ════════════════════════════════════════════════
function renderL3() {
  const key = "l3";
  const s = qState[key];
  const data = D.lesen3;
  const q = data[s.idx];
  const ans = s.answered[s.idx];
  const correct = q.answer === "Richtig";

  function tfCls(val) {
    if (ans === undefined) return "tf-btn";
    const chosen = (val === "Richtig") === (ans === true);
    const isRight = (val === "Richtig") === correct;
    if (isRight) return "tf-btn correct";
    if (chosen && !isRight) return "tf-btn wrong";
    return "tf-btn";
  }
  const expl =
    ans !== undefined ? `<div class="explanation">💡 ${escHtml(q.explanation || "")}</div>` : "";

  document.getElementById("l3-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Lesen Teil 3</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="question-card">
      <div class="question-num">Question ${s.idx + 1} of ${data.length}</div>
      <div class="text-passage" style="font-size:16px;font-weight:600">${escHtml(q.text)}</div>
      <div class="question-text" style="margin-top:14px">${escHtml(q.statement)}</div>
      <div class="tf-options">
        <button class="${tfCls("Richtig")}" onclick="answerL3(true)" ${ans !== undefined ? "disabled" : ""}>✔ Richtig</button>
        <button class="${tfCls("Falsch")}" onclick="answerL3(false)" ${ans !== undefined ? "disabled" : ""}>✗ Falsch</button>
      </div>
      ${expl}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function answerL3(val) {
  const s = qState["l3"];
  const q = D.lesen3[s.idx];
  if (s.answered[s.idx] !== undefined) return;
  s.answered[s.idx] = val;
  if ((val === true) === (q.answer === "Richtig")) s.score++;
  renderL3();
}

// ════════════════════════════════════════════════
// SCHREIBEN 1 – Form filling
// ════════════════════════════════════════════════
function renderS1() {
  const key = "s1";
  const s = qState[key];
  const data = D.schreiben1;
  const q = data[s.idx];
  const blankFields = q.fields.filter((f) => f.blank);
  const filledFields = q.fields.filter((f) => !f.blank);

  const fieldHtml = q.fields
    .map((f, fi) => {
      if (!f.blank) {
        return `<div class="form-field">
        <div class="field-label">${escHtml(f.label)}</div>
        <div class="field-value">${escHtml(f.value)}</div>
      </div>`;
      }
      const revealed = (s.answered[s.idx] || {})[fi + "_revealed"];
      if (revealed) {
        return `<div class="form-field">
        <div class="field-label">${escHtml(f.label)}</div>
        <div class="field-value" style="color:#4a8a4a;font-weight:600">✓ ${escHtml(f.value || "(see scenario)")}</div>
      </div>`;
      }
      return `<div class="form-field">
      <div class="field-label">${escHtml(f.label)}</div>
      <div class="field-value" style="color:#c0a868;letter-spacing:.15em">_ _ _ _ _</div>
      <button class="check-field-btn" onclick="showS1Answer(${fi})">Show Answer</button>
    </div>`;
    })
    .join("");

  document.getElementById("s1-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Schreiben Teil 1</h2>
      <div class="quiz-controls">${quizScoreHtml(key)}</div>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="scenario-box"><strong>Scenario:</strong><br>${escHtml(q.context)}</div>
    <div class="form-card">
      <h3>${escHtml(q.form_title || "Registration Form")}</h3>
      ${fieldHtml}
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function showS1Answer(fi) {
  const s = qState["s1"];
  if (!s.answered[s.idx]) s.answered[s.idx] = {};
  s.answered[s.idx][fi + "_revealed"] = true;
  renderS1();
}

// ════════════════════════════════════════════════
// SCHREIBEN 2 – Email writing
// ════════════════════════════════════════════════
function renderS2() {
  const key = "s2";
  const s = qState[key];
  const data = D.schreiben2;
  const q = data[s.idx];
  const modelVisible = (s.answered[s.idx] || {}).modelVisible;
  const pts = (q.required_points || []).map((p) => `<li>${escHtml(p)}</li>`).join("");
  const modelText = [q.salutation, q.model_answer, q.closing].filter(Boolean).join("\n\n");

  document.getElementById("s2-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Schreiben Teil 2</h2>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="email-card">
      <h3>${escHtml(q.topic || "")}</h3>
      <div class="email-scenario">${escHtml(q.scenario || "")}</div>
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Required points:</div>
      <ul class="points-list">${pts}</ul>
      <textarea class="email-textarea" id="s2-ta-${s.idx}" placeholder="Write your email here…" oninput="saveS2()">${(s.answered[s.idx] || {}).text || ""}</textarea>
      <div style="display:flex;gap:10px;align-items:center;margin-top:8px">
        <button class="show-model-btn" onclick="toggleS2Model()">
          ${modelVisible ? "▲ Hide model answer" : "▼ Show model answer"}
        </button>
        <button class="q-btn" onclick="saveS2()" style="padding:5px 12px;font-size:12px">💾 Save</button>
      </div>
      <div class="model-answer ${modelVisible ? "visible" : ""}" style="white-space:pre-line">${escHtml(modelText)}</div>
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function toggleS2Model() {
  const s = qState["s2"];
  if (!s.answered[s.idx]) s.answered[s.idx] = {};
  s.answered[s.idx].modelVisible = !s.answered[s.idx].modelVisible;
  renderS2();
}
function saveS2() {
  const s = qState["s2"];
  if (!s.answered[s.idx]) s.answered[s.idx] = {};
  const ta = document.getElementById("s2-ta-" + s.idx);
  if (ta) s.answered[s.idx].text = ta.value;
}

// ════════════════════════════════════════════════
// SPRECHEN 2 – Answer questions
// ════════════════════════════════════════════════
const sp2ThemaColors = {
  "Essen & Trinken": "#e65c00",
  Familie: "#1a6bb5",
  Wohnen: "#2e7d32",
  "Freizeit & Hobby": "#7b1fa2",
  "Arbeit & Beruf": "#c62828",
  "Schule & Lernen": "#00838f",
  "Reisen & Verkehr": "#4527a0",
  Gesundheit: "#558b2f",
  Einkaufen: "#bf360c",
  "Sprachen & Länder": "#1565c0",
  Tagesablauf: "#795548",
  "Wetter & Jahreszeiten": "#0277bd",
  "Feste & Feiertage": "#ad1457",
  "Körper & Aussehen": "#6a1b9a",
  "Kleidung & Mode": "#e91e63",
  "Technik & Medien": "#37474f",
  "Natur & Umwelt": "#388e3c",
  "Stadt & Orientierung": "#f57f17",
  "Zahlen & Uhrzeit": "#0288d1",
  "Gefühle & Meinungen": "#d81b60",
};
const sp2State = { thema: "Alle", search: "", set: "all", cards: {} };
const sp2Mid = Math.ceil(D.sprechen2.length / 2);

function sp2Color(thema) {
  return sp2ThemaColors[thema] || "var(--accent)";
}
function sp2Themen() {
  return ["Alle", ...new Set(D.sprechen2.map((c) => c.thema))];
}
function sp2Filtered() {
  const q = sp2State.search.trim().toLowerCase();
  return D.sprechen2.filter((c) => {
    const setMatch =
      sp2State.set === "all" ||
      (sp2State.set === "set1" && c.id <= sp2Mid) ||
      (sp2State.set === "set2" && c.id > sp2Mid);
    const themeMatch = sp2State.thema === "Alle" || c.thema === sp2State.thema;
    const search =
      q === "" ||
      (c.keyword || "").toLowerCase().includes(q) ||
      (c.thema || "").toLowerCase().includes(q) ||
      (c.question || "").toLowerCase().includes(q);
    return setMatch && themeMatch && search;
  });
}
function renderSp2() {
  const total = D.sprechen2.length;
  document.getElementById("sp2-layout").innerHTML = `
    <div class="sp2-controls">
      <button class="sp2-set-btn" data-set="all" onclick="sp2SetShow('all')">📚 Alle ${total} Karten</button>
      <button class="sp2-set-btn" data-set="set1" onclick="sp2SetShow('set1')">🟡 Set 1: 1–${sp2Mid}</button>
      <button class="sp2-set-btn" data-set="set2" onclick="sp2SetShow('set2')">🟢 Set 2: ${sp2Mid + 1}–${total}</button>
    </div>
    <div class="sp2-search">
      <input type="text" id="sp2-search-input" placeholder="🔍 Stichwort, Thema oder Frage suchen…"
        autocomplete="off" oninput="sp2State.search=this.value;sp2RenderCards()" />
    </div>
    <div class="sp2-topics" id="sp2-topics"></div>
    <div class="sp2-count"><span id="sp2-count">0</span> Karten angezeigt</div>
    <div class="sp2-grid" id="sp2-grid"></div>
    <div class="sp2-no-results" id="sp2-no-results" style="display:none">
      Keine Karten gefunden. Probiere ein anderes Stichwort oder Thema.
    </div>`;
  const input = document.getElementById("sp2-search-input");
  input.value = sp2State.search;
  sp2RenderTopics();
  sp2RenderSetButtons();
  sp2RenderCards();
}
function sp2RenderTopics() {
  const wrap = document.getElementById("sp2-topics");
  wrap.innerHTML = sp2Themen()
    .map((t) => {
      const active = t === sp2State.thema;
      const color = sp2Color(t);
      const style = active
        ? `background:${t === "Alle" ? "var(--dark)" : color};border-color:${
            t === "Alle" ? "var(--dark)" : color
          }`
        : "";
      return `<button class="sp2-topic-btn${active ? " active" : ""}" style="${style}"
        onclick="sp2SetThema('${t.replace(/'/g, "\\'")}')">${escHtml(t === "Alle" ? "📚 Alle" : t)}</button>`;
    })
    .join("");
}
function sp2RenderSetButtons() {
  document.querySelectorAll("#sp2-layout .sp2-set-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.set === sp2State.set);
  });
}
function sp2RenderCards() {
  const total = D.sprechen2.length;
  const filtered = sp2Filtered();
  document.getElementById("sp2-count").textContent = filtered.length;
  document.getElementById("sp2-no-results").style.display = filtered.length ? "none" : "block";
  document.getElementById("sp2-grid").innerHTML = filtered
    .map((c) => {
      const st = sp2State.cards[c.id] || { flipped: false, hint: false };
      const color = sp2Color(c.thema);
      const themeStyle = st.flipped ? `background:${color}` : "";
      return `
      <article class="sp2-card${st.flipped ? " flipped" : ""}" onclick="sp2Flip(${c.id})">
        <div class="sp2-card-top"><span>Modellsatz</span><span>Kandidatenblätter</span></div>
        <div class="sp2-card-theme" style="${themeStyle}"><span>Thema: ${escHtml(c.thema || "")}</span></div>
        <div class="sp2-card-keyword">${escHtml(c.keyword || "")}</div>
        <div class="sp2-card-footer"><span>#${c.id} / ${total}</span><span>${st.flipped ? "" : "Tippen →"}</span></div>
        <div class="sp2-answer${st.flipped ? " visible" : ""}">
          <div class="sp2-section">
            <span class="sp2-label">❓ Frage</span>
            <p class="sp2-question-text">${escHtml(c.question || "")}</p>
            <button class="sp2-speak-btn" onclick="event.stopPropagation();sp2Speak(${c.id},'question')">🔊 Frage hören</button>
          </div>
          <div class="sp2-section">
            <span class="sp2-label">✅ Antwort</span>
            <p class="sp2-answer-text">${escHtml(c.answer || "")}</p>
            <button class="sp2-speak-btn" onclick="event.stopPropagation();sp2Speak(${c.id},'answer')">🔊 Antwort hören</button>
          </div>
          ${
            c.hint
              ? `<div class="sp2-section">
            <button class="sp2-hint-btn" onclick="event.stopPropagation();sp2Hint(${c.id})">${
              st.hint ? "▲ Grammatik ausblenden" : "▼ 💡 Grammatik-Tipp"
            }</button>
            <div class="sp2-hint-panel" style="display:${st.hint ? "block" : "none"}">${escHtml(c.hint)}</div>
          </div>`
              : ""
          }
        </div>
      </article>`;
    })
    .join("");
}
function sp2Flip(id) {
  const st = sp2State.cards[id] || { flipped: false, hint: false };
  sp2State.cards[id] = { ...st, flipped: !st.flipped };
  sp2RenderCards();
}
function sp2Hint(id) {
  const st = sp2State.cards[id] || { flipped: true, hint: false };
  sp2State.cards[id] = { ...st, hint: !st.hint };
  sp2RenderCards();
}
function sp2SetThema(t) {
  sp2State.thema = t;
  sp2RenderTopics();
  sp2RenderCards();
}
function sp2SetShow(set) {
  sp2State.set = set;
  sp2RenderSetButtons();
  sp2RenderCards();
}
function sp2Speak(id, field) {
  const card = D.sprechen2.find((c) => c.id === id);
  if (!card) return;
  const text = field === "answer" ? card.answer : card.question;
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  u.rate = 0.85;
  const deVoice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith("de"));
  if (deVoice) u.voice = deVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ════════════════════════════════════════════════
// SPRECHEN 3 – Object cards
// ════════════════════════════════════════════════
function renderSp3() {
  const key = "sp3";
  const s = qState[key];
  const data = D.sprechen3;
  const q = data[s.idx];
  const revealed = (s.answered[s.idx] || {}).revealed;

  document.getElementById("sp3-layout").innerHTML = `
    <div class="quiz-meta">
      <h2>Sprechen Teil 3</h2>
    </div>
    <div class="q-progress"><div class="q-progress-bar" style="width:${((s.idx + 1) / data.length) * 100}%"></div></div>
    <div class="spr-card">
      <div class="spr-topic">${escHtml(q.category || "")} · ${escHtml(q.difficulty || "")}</div>
      <div class="spr-keyword" style="font-size:40px">${escHtml(q.emoji || "")} ${escHtml(q.german || "")}</div>
      <div style="font-size:14px;color:var(--muted);margin-top:4px;margin-bottom:14px">${escHtml(q.english || "")}</div>
      ${
        !revealed
          ? `<button class="reveal-btn" onclick="revealSp3()">Show Question &amp; Answer</button>`
          : `
        <div class="spr-question" style="margin-top:12px">❓ ${escHtml(q.example_question || "")}</div>
        <div class="answer-reveal visible" style="margin-top:10px">${escHtml(q.example_answer || "")}</div>
        <button class="reveal-btn" style="margin-top:10px;background:#8a7358" onclick="revealSp3()">Hide</button>
      `
      }
    </div>
    ${quizNavHtml(key, s.idx, data.length)}`;
}
function revealSp3() {
  const s = qState["sp3"];
  if (!s.answered[s.idx]) s.answered[s.idx] = {};
  s.answered[s.idx].revealed = !s.answered[s.idx].revealed;
  renderSp3();
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════
if (window.innerWidth <= 768) {
  document.getElementById("sidebar").classList.add("closed");
}
showPanel("dashboard", document.querySelector('[data-panel="dashboard"]'));
