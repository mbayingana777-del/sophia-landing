// === CONFIG (your values) ===
const API_BASE   = 'https://sophia-voice.onrender.com';           // your backend
const STATUS_URL = `${API_BASE}/status`;
const TWILIO_FROM = '+18773781832';                               // your Twilio toll-free
const BOOKING_URL = 'https://calendly.com/mbayingana777/call-with-sophia';

// === helpers ===
function $(sel){ return document.querySelector(sel); }
function getUTM() { try { return window.location.search.replace(/^\?/, ''); } catch { return ''; } }

// === status check ===
async function checkStatus() {
  const el = $('#status');
  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const ok = data.server === 'OK' && data.sheets === 'OK';
    el.textContent = ok ? 'All systems go ✅' : 'Degraded ⚠️';
  } catch {
    el.textContent = 'Offline ❌';
  }
}

// === call & sms buttons ===
function wireButtons() {
  // tel: and sms: schemes open the dialer / messages apps
  $('#callBtn').setAttribute('href', `tel:${TWILIO_FROM}`);
  $('#smsBtn').setAttribute('href', `sms:${TWILIO_FROM}`);
}

// === booking embed ===
function loadBooking() {
  const frame = $('#calFrame');
  if (frame) frame.src = BOOKING_URL;
}

// === lead form -> POST /web-lead ===
function wireLeadForm() {
  const form = $('#leadForm');
  const msg  = $('#leadMsg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Sending…';

    const name    = $('#leadName').value.trim();
    const phone   = $('#leadPhone').value.trim();
    const message = $('#leadMessage').value.trim();
    const utm     = getUTM();

    if (!name || !phone || !message) {
      msg.textContent = 'Please fill in all fields.';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/web-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message, utm })
      });

      if (!res.ok) throw new Error('network');

      const data = await res.json();
      if (data && data.ok) {
        msg.textContent = 'Thanks! We got your message.';
        form.reset();
      } else {
        msg.textContent = 'Network error — please retry.';
      }
    } catch (_) {
      msg.textContent = 'Network error — please retry.';
    }
  });
}

// === footer year ===
function setYear(){ const y=$('#year'); if (y) y.textContent = new Date().getFullYear(); }

// === init ===
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  wireButtons();
  loadBooking();
  wireLeadForm();
  checkStatus();
});

