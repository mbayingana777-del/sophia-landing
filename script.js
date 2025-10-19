// === CONFIG (your values) ===
const API_BASE   = 'https://script.google.com/macros/s/XXXXX/exec'; // <-- your GAS web app URL (no trailing slash)
const STATUS_URL = `${API_BASE}?route=status`;
const TWILIO_FROM = '+18773781832';
const BOOKING_URL = 'https://calendly.com/mbayingana777/call-with-sophia';

// ... keep your helpers ...

// === status check ===
async function checkStatus() {
  const el = $('#status');
  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' }); // simple GET => no preflight
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const ok = String(data.server).toUpperCase() === 'OK' && String(data.sheets).toUpperCase() === 'OK';
    el.textContent = ok ? 'All systems go ✅' : 'Degraded ⚠️';
  } catch (e) {
    console.error('Status error:', e);
    el.textContent = 'Offline ❌';
  }
}

// === lead form -> POST web-lead (NO PREFLIGHT) ===
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
      const res = await fetch(`${API_BASE}?route=web-lead`, {
        method: 'POST',
        // IMPORTANT: text/plain avoids CORS preflight; GAS will parse raw body
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ name, phone, message, utm })
      });

      if (!res.ok) throw new Error('network');
      const data = await res.json();

      if (data && data.ok) {
        msg.textContent = 'Thanks! We got your message.';
        form.reset();
      } else {
        msg.textContent = 'Error — please retry.';
      }
    } catch (err) {
      console.error('Lead error:', err);
      msg.textContent = 'Network error — please retry.';
    }
  });
}
