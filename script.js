// ==== BACKEND PERSONA ENDPOINT (set this if your backend is deployed) ====
const PERSONA_API_BASE = null; 
// Example when deployed:  const PERSONA_API_BASE = "https://sophia-voice.onrender.com";

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
// ---- Persona params from URL (?niche=&packs=) ----
function getPersonaParams() {
  const url = new URL(window.location.href);
  const niche = url.searchParams.get('niche') || '';
  const packs = url.searchParams.get('packs') || '';
  return { niche, packs };
}

// ---- Load persona from backend (if set) or local files ----
async function loadPersonaData() {
  const { niche, packs } = getPersonaParams();

  // 1) Try backend if configured
  if (PERSONA_API_BASE) {
    try {
      const qs = new URLSearchParams();
      if (niche) qs.set('niche', niche);
      if (packs) qs.set('packs', packs);
      const resp = await fetch(`${PERSONA_API_BASE}/persona?${qs.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!resp.ok) throw new Error(`Backend persona failed: ${resp.status}`);
      const data = await resp.json();
      console.info('[persona] loaded from backend', data);
      return data;
    } catch (e) {
      console.warn('[persona] backend fetch failed, falling back to local files', e);
    }
  }

  // 2) Fallback to local persona files
  const base = await (await fetch('/persona/base.json')).json();
  let merged = { ...base };

  // optional niche override
  if (niche) {
    try {
      const nicheJson = await (await fetch(`/persona/niches/${niche}.json`)).json();
      merged = deepMerge(merged, nicheJson);
      console.info('[persona] merged local niche', niche);
    } catch (_) {
      console.warn(`[persona] no local niche file found for '${niche}', skipping`);
    }
  }

  // optional packs override (comma-separated)
  if (packs) {
    const list = packs.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of list) {
      try {
        const packJson = await (await fetch(`/persona/packs/${p}.json`)).json();
        merged = deepMerge(merged, packJson);
        console.info('[persona] merged local pack', p);
      } catch (_) {
        console.warn(`[persona] no local pack file found for '${p}', skipping`);
      }
    }
  }

  return merged;
}

// ---- tiny deep-merge helpers ----
function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) return [...target, ...source];
  if (isObj(target) && isObj(source)) {
    const out = { ...target };
    for (const k of Object.keys(source)) {
      out[k] = k in out ? deepMerge(out[k], source[k]) : source[k];
    }
    return out;
  }
  return source;
}
function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const persona = await loadPersonaData();

    // ——— Apply basic branding to hero ———
    if (persona?.business_name) {
      const h1 = document.querySelector('.hero-title');
      if (h1) h1.textContent = `Meet ${persona.business_name.replace(/ Voice$/, '')}`;
    }

    if (persona?.brand?.tagline) {
      const sub = document.querySelector('.hero-kicker');
      if (sub) sub.innerHTML = persona.brand.tagline;
    }

    if (persona?.consent) {
      const consentEl = document.querySelector('#consent-text');
      if (consentEl) consentEl.textContent = persona.consent;
    }

    // ——— Keep your existing site wiring ———
    applyBranding?.();
    setYear?.();
    wireButtons?.();
    loadBooking?.();
    wireLeadForm?.();
    checkStatus?.();

    console.log('[persona] init complete');
  } catch (err) {
    console.error('Persona init failed', err);
  }
});

});


/* =======================
   UNIVERSAL PERSONA LOADER
   ======================= */

// read ?niche=real_estate from the URL (default: real_estate)
function getNicheFromURL() {
  const p = new URLSearchParams(window.location.search).get("niche");
  return (p || "real_estate").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

async function loadPersona(niche = "real_estate") {
  const safeJSON = async (path) => {
    try {
      const r = await fetch(path);
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  try {
    const base     = await safeJSON("persona/base.json");
    const slots    = await safeJSON("persona/slots.json");
    const actions  = await safeJSON("persona/actions.json");
    const prompts  = await fetch("persona/prompts.md").then(r => r.text());
    const nicheCfg = await safeJSON(`persona/niches/${niche}.json`);
    const hipaaPack = await safeJSON("persona/packs/hipaa_compliance.json");

    return { base, slots, actions, prompts, niche: nicheCfg, packs: { hipaaPack } };
  } catch (err) {
    console.error("Error loading persona:", err);
    return null;
  }
}

function applyPersonaToUI(config) {
  if (!config || !config.base) return;

  const { base } = config;

  const cal = document.getElementById("calFrame");
  if (cal && base.booking_link) {
    const embed = new URL(base.booking_link);
    embed.searchParams.set("embed_domain", location.hostname || "localhost");
    embed.searchParams.set("embed_type", "Inline");
    embed.searchParams.set("hide_event_type_details", "1");
    embed.searchParams.set("hide_gdpr_banner", "1");
    cal.src = embed.toString();
  }

  const cta = document.querySelector(".hero-cta");
  if (cta && base.booking_link) cta.setAttribute("href", base.booking_link);

  console.log("Persona applied:", config);
}

(async function initPersona() {
  const niche = getNicheFromURL();
  const persona = await loadPersona(niche);
  applyPersonaToUI(persona);
})();
// === Sophia Backend Connection Test ===
const CFG = window.SOPHIA_CONFIG;

async function checkBackend() {
  try {
    const res = await fetch(`${CFG.BACKEND_URL}/status`);
    const data = await res.json();
    if (data.ok) {
      console.log("✅ Backend online:", data);
      alert("Sophia backend is online!");
    } else {
      console.log("⚠️ Backend returned unexpected response:", data);
      alert("Backend reachable, but not responding correctly.");
    }
  } catch (err) {
    console.error("❌ Could not reach backend:", err);
    alert("Backend offline or URL incorrect. Check config.js");
  }
}

// Run check when page loads
checkBackend();

