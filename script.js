// ===== CONFIG-DRIVEN PROFILES =====
const PROFILES = {
  realestate: {
    brand: "Sophia Voice",
    tagline: "Your 24/7 AI receptionist that books, texts, and calls back instantly.",
    twilioFrom: "+18773781832",
    calendlyUrl: "https://calendly.com/mbayingana777/call-with-sophia",
    consent: `By submitting your name, phone number, or message through this website or by texting/calling
our toll-free number (+1 877-378-1832), you consent to receive SMS and voice communications
from Sophia Voice, our AI receptionist assistant. Message frequency may vary.
Message and data rates may apply. Reply STOP to unsubscribe at any time.`
  },
  medspa: {
    brand: "Sophia MedSpa AI",
    tagline: "24/7 AI front desk for consultations, appointments, and follow-ups.",
    twilioFrom: "+18773781832",
    calendlyUrl: "https://calendly.com/mbayingana777/medspa-consult",
    consent: `By submitting, you agree to receive SMS/voice from Sophia MedSpa AI for appointment logistics.
Msg&data rates may apply. Reply STOP to opt out.`
  },
  hvac: {
    brand: "Sophia HVAC AI",
    tagline: "Book repairs, triage issues, and dispatch techs—automatically.",
    twilioFrom: "+18773781832",
    calendlyUrl: "https://calendly.com/mbayingana777/hvac",
    consent: `You agree to receive SMS/voice from Sophia HVAC AI regarding service/booking.
Msg&data rates may apply. Reply STOP to opt out.`
  }
};

// Pick profile from URL ?niche=realestate|medspa|hvac
function getParam(name){ return new URLSearchParams(location.search).get(name); }
const NICHE = (getParam('niche') || 'realestate').toLowerCase();
const CFG = PROFILES[NICHE] || PROFILES.realestate;

// ===== BACKEND (Google Apps Script Web App) =====
// >>> REPLACE with your deployed Web App URL (must end with /exec)
const API_BASE   = 'https://script.google.com/macros/s/AKfycbyaGwr8K-BuS3Ff4Un4C19IoKwsfH0uufs6BzB54-7HrStenBkYZIbZdeJ1Vi9SbaaV/exec';
const STATUS_URL = `${API_BASE}?route=status`;

// ===== helpers =====
function $(sel){ return document.querySelector(sel); }
function getUTM(){ try { return window.location.search.replace(/^\?/, ''); } catch { return ''; } }

// ===== dynamic copy/branding =====
function applyBranding(){
  const h1 = document.querySelector('header h1');
  const p  = document.querySelector('header p');
  if (h1) h1.textContent = `Meet ${CFG.brand.split(' ')[0]}`;
  if (p)  p.textContent  = CFG.tagline;

  const consent = document.querySelector('#consent p');
  if (consent) consent.textContent = CFG.consent;

  const footer = document.querySelector('.footer div');
  if (footer) footer.innerHTML = `© <span id="year"></span> ${CFG.brand}`;
}

// ===== tolerant status check (works with JSON or OK text) =====
async function checkStatus(){
  const el = $('#status');

  const withTimeout = (url, ms = 6000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { cache: 'no-store', signal: ctrl.signal })
      .finally(() => clearTimeout(t));
  };

  try {
    let res;
    try { res = await withTimeout(STATUS_URL, 6000); }
    catch { await new Promise(r => setTimeout(r, 1200)); res = await withTimeout(STATUS_URL, 6000); }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    let ok = false;
    try {
      const data = await res.json();
      const server = String(data.server || '').toUpperCase();
      const sheets = String(data.sheets || '').toUpperCase();
      ok = server === 'OK' && (!sheets || sheets === 'OK');
    } catch {
      const txt = await res.text();
      ok = /OK/i.test(txt);
    }

    el.textContent = ok ? 'All systems go ✅' : 'Degraded ⚠️';
  } catch (e) {
    console.error('Status error:', e);
    el.textContent = 'Offline ❌';
  }
}

// ===== call & sms buttons =====
function wireButtons(){
  $('#callBtn')?.setAttribute('href', `tel:${CFG.twilioFrom}`);
  $('#smsBtn')?.setAttribute('href', `sms:${CFG.twilioFrom}`);
}

// ===== booking embed =====
function loadBooking(){
  const frame = $('#calFrame');
  if (frame) frame.src = CFG.calendlyUrl;
}

// ===== lead form -> POST /web-lead (NO PREFLIGHT) =====
function wireLeadForm(){
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
      const res = await fetch(`${API_BASE}?route=web-lead&niche=${encodeURIComponent(NICHE)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoid CORS preflight
        body: JSON.stringify({ name, phone, message, utm })
      });

      if (!res.ok) throw new Error(`network ${res.status}`);
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

// ===== footer year =====
function setYear(){ const y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

// ===== init =====
document.addEventListener('DOMContentLoaded', () => {
  applyBranding();
  setYear();
  wireButtons();
  loadBooking();
  wireLeadForm();
  checkStatus();
});
