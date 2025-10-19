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

// ===== BACKEND (your Apps Script Web App) =====
const API_BASE   = 'https://script.google.com/macros/s/AKfycby3_M3El1gq_D8n5qqCR7yADqIAZXhP0_YWAhjVpslcQrn16TDCSFjyuVMy893OQFHi/exec';
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

// ===== status check (simple GET => no preflight) =====
async function checkStatus(){
  const el = $('#status');
  try {
    const res = await fetch(STATUS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const ok = String(data.server).toUpperCase() === 'OK' && String(data.sheets).toUpperCase() === 'OK';
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
