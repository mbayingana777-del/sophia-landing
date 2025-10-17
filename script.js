const CONFIG={
  PHONE:"+18773781832",
  STATUS_URL:"https://sophia-voice.onrender.com/status",
  BOOKING_LINK:"https://calendly.com/mbayingana777/call-with-sophia"
};

document.getElementById("year").textContent=new Date().getFullYear();

const callBtn=document.getElementById("callBtn");
const smsBtn=document.getElementById("smsBtn");
callBtn.href=`tel:${CONFIG.PHONE}`;
smsBtn.href=`sms:${CONFIG.PHONE}?body=${encodeURIComponent("Hi Sophia, I’m interested.")}`;

(async()=>{
  try{
    const r=await fetch(CONFIG.STATUS_URL,{cache:"no-store"});
    const s=await r.json();
    document.getElementById("status").textContent=`Server ${s.server} • OpenAI ${s.openai} • Sheets ${s.sheets}`;
  }catch{
    document.getElementById("status").textContent="Status unavailable";
  }
})();

const f=document.getElementById("tryForm");
const input=document.getElementById("tryMsg");
f.addEventListener("submit",(e)=>{
  e.preventDefault();
  const msg=(input.value||"Hi Sophia, I’m interested.").trim();
  window.location.href=`sms:${CONFIG.PHONE}?body=${encodeURIComponent(msg)}`;
});

document.getElementById("calFrame").src=CONFIG.BOOKING_LINK;
