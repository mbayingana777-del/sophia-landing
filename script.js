// -------- Sophia frontend glue --------
const CFG = window.SOPHIA_CONFIG; // from config.js
let SESSION_ID = localStorage.getItem("sophia_session") || null;

// Small helper
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${CFG.BACKEND_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

// 1) Health check
async function checkBackend() {
  try {
    const data = await api("/status");
    console.log("✅ Backend online:", data);
    return true;
  } catch (e) {
    console.error("❌ Backend unreachable:", e);
    return false;
  }
}

// 2) Persona
async function loadPersona() {
  try {
    const p = await api("/api/persona");
    console.log("Persona:", p);
    const ph = document.querySelector(".chat-body .placeholder");
    if (ph && p?.greeting) ph.textContent = p.greeting;
    enableChat();
  } catch (e) {
    console.error("Persona load failed:", e);
  }
}

// 3) Chat send
async function sendMessage(text) {
  const payload = {
    session_id: SESSION_ID,
    message: text.trim(),
    meta: { source: "landing", persona: "base" }
  };
  const data = await api("/api/chat", { method: "POST", body: payload });
  if (data?.session_id && data.session_id !== SESSION_ID) {
    SESSION_ID = data.session_id;
    localStorage.setItem("sophia_session", SESSION_ID);
  }
  return data?.reply || "";
}

// 4) Wire UI
function enableChat() {
  const input = document.getElementById("chat-input");
  const button = document.querySelector("#chat-box button");
  const body = document.querySelector("#chat-box .chat-body");
  if (!input || !button || !body) return;

  input.disabled = false;
  button.disabled = false;

  function appendBubble(text, role) {
    const div = document.createElement("div");
    div.className = `bubble ${role}`;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  async function handleSend() {
    const txt = input.value.trim();
    if (!txt) return;
    appendBubble(txt, "user");
    input.value = "";
    try {
      const reply = await sendMessage(txt);
      appendBubble(reply, "bot");
    } catch {
      appendBubble("(Connection issue. Try again.)", "bot");
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
  button.addEventListener("click", handleSend);
}

// 5) Boot
(async () => {
  const ok = await checkBackend();
  if (!ok) return;
  await loadPersona();
})();
