const CONFIG = {
  PHONE: "+18773781832",
  STATUS_URL: "https://sophia-voice.onrender.com/status",
  BOOKING_LINK: "https://calendly.com/mbayingana777/call-with-sophia"
};
const API_BASE = "https://sophia-voice.onrender.com";

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Call/Text buttons
document.getElementById("callBtn").href = `tel:${CONFIG.PHONE}`;
document.getElementById("smsBtn").href  = `sms:${CONFIG.PHONE}?body=${encodeURIComponent("Hi Sophia, I’m interested.")}`;

// Status line
(async () => {
  try {
    const r = await fetch(CONFIG.STATUS_URL, { cache: "no-store" });
    const s = await r.json();
    document.getElementById("status").textContent =
      `Server ${s.server} • OpenAI ${s.openai} • Sheets ${s.sheets}`;
  } catch {
    document.getElementById("status").textContent = "Status unavailable";
  }
})();

// "Try a sample message" opens SMS with prefill
const tryForm = document.getElementById("tryForm");
if (tryForm) {
  tryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = (document.getElementById("tryMsg").value || "Hi Sophia, I’m interested.").trim();
    window.location.href = `sms:${CONFIG.PHONE}?body=${encodeURIComponent(msg)}`;
  });
}

// Calendly embed
document.getElementById("calFrame").src = CONFIG.BOOKING_LINK;

// ✅ NEW: Web-lead form → POST to your backend /web-lead
const leadForm = document.getElementById("leadForm");
if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = document.getElementById("lfName").value.trim();
    const phone = document.getElementById("lfPhone").value.trim();
    const note  = document.getElementById("lfNote").value.trim();
    const msgEl = document.getElementById("leadMsg");

    try {
      const res  = await fetch(`${API_BASE}/web-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, note })
      });
      const data = await res.json();
      if (data.ok) {
        msgEl.textContent = "✅ Message sent! Sophia will follow up soon.";
        leadForm.reset();
      } else {
        msgEl.textContent = data.error || "⚠️ Something went wrong. Please try again.";
      }
    } catch {
      msgEl.textContent = "Network error — please retry.";
    }
  });
}

