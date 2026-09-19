
// Final script for Currency Converter - Nimr (vFinal)
const API_BASE = 'https://open.er-api.com/v6/latest/USD';
const UPDATE_MS = 24*60*60*1000;
const RATES_KEY = 'nimr_rates_final';
const RATES_TS = 'nimr_rates_ts_final';
const SYMBOLS_KEY = 'nimr_symbols_final';
const THEME_KEY = 'nimr_theme_final';

const card = document.getElementById('card');
const amountEl = document.getElementById('amount');
const fromEl = document.getElementById('from');
const toEl = document.getElementById('to');
const flagFrom = document.getElementById('flagFrom');
const flagTo = document.getElementById('flagTo');
const resultEl = document.getElementById('result');
const swapBtn = document.getElementById('swapBtn');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const note = document.getElementById('note');
const previewLink = document.getElementById('previewLink');
const downloadLink = document.getElementById('downloadLink');

const c2c = {'USD':'us','EUR':'eu','GBP':'gb','EGP':'eg','SAR':'sa','AED':'ae','JPY':'jp','CNY':'cn','INR':'in','AUD':'au','CAD':'ca','CHF':'ch','TRY':'tr','RUB':'ru','BRL':'br','ZAR':'za'};

function setTheme(t){
  card.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  localStorage.setItem(THEME_KEY, t);
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
}
function loadTheme(){ const t = localStorage.getItem(THEME_KEY) || 'light'; setTheme(t); }
themeToggle.addEventListener('click', ()=>{ const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; setTheme(cur==='dark'?'light':'dark'); });

function setFlag(el, code){ const cc = c2c[code]; if(cc){ el.style.backgroundImage = `url('https://flagcdn.com/w40/${cc}.png')`; el.style.backgroundSize='cover'; el.textContent=''; } else { el.style.backgroundImage=''; el.textContent = code.slice(0,3); } }

function setResult(html, highlight=true){ resultEl.classList.remove('show'); resultEl.innerHTML = html; if(highlight) setTimeout(()=> resultEl.classList.add('show'), 40); }

function fetchJSON(url, timeout=10000){ return new Promise((res, rej)=>{ const t = setTimeout(()=> rej(new Error('timeout')), timeout); fetch(url).then(r=>{ clearTimeout(t); if(!r.ok) return rej(new Error('http '+r.status)); r.json().then(j=>res(j)).catch(e=>rej(e)); }).catch(e=>{ clearTimeout(t); rej(e); }); }); }

async function loadRates(force=false){
  const now = Date.now();
  const ts = parseInt(localStorage.getItem(RATES_TS) || '0', 10);
  const cached = JSON.parse(localStorage.getItem(RATES_KEY) || 'null');
  if(!force && cached && (now - ts) < UPDATE_MS){ note.textContent = 'آخر تحديث: ' + (cached.date || 'مخزّن محلياً'); return cached; }
  try{
    note.textContent = 'جارٍ تحديث الأسعار...';
    const data = await fetchJSON(API_BASE, 10000);
    if(data && data.result === 'success' && data.rates){
      const payload = { base: data.base_code || 'USD', date: data.time_last_update_utc || new Date().toISOString().split('T')[0], rates: data.rates };
      localStorage.setItem(RATES_KEY, JSON.stringify(payload));
      localStorage.setItem(RATES_TS, String(now));
      const syms = {}; Object.keys(payload.rates).forEach(c=> syms[c] = { description: c }); localStorage.setItem(SYMBOLS_KEY, JSON.stringify(syms));
      note.textContent = 'آخر تحديث: ' + (payload.date || 'اليوم');
      return payload;
    }
    throw new Error('invalid');
  }catch(e){
    console.warn('rates failed', e);
    if(cached){ note.textContent = 'استخدم المخزّن: ' + (cached.date || '—'); return cached; }
    const embedded = { base:'USD', date:'', rates: {"USD":1,"EUR":0.92,"EGP":30.9,"GBP":0.79,"SAR":3.75,"AED":3.67} };
    localStorage.setItem(RATES_KEY, JSON.stringify(embedded)); localStorage.setItem(RATES_TS, String(Date.now()));
    note.textContent = 'آخر تحديث: (احتياطي محلي)';
    return embedded;
  }
}

async function loadSymbols(){
  const cached = JSON.parse(localStorage.getItem(SYMBOLS_KEY) || 'null');
  if(cached){ fillSelects(cached); return; }
  try{ const r = await loadRates(false); const syms = {}; Object.keys(r.rates).forEach(c=> syms[c] = { description: c }); localStorage.setItem(SYMBOLS_KEY, JSON.stringify(syms)); fillSelects(syms); }catch(e){ const fallback = {"USD":{"description":"USD"},"EUR":{"description":"EUR"},"EGP":{"description":"EGP"},"GBP":{"description":"GBP"}}; fillSelects(fallback); }
}

function fillSelects(symbols){
  const entries = Object.entries(symbols).sort((a,b)=> a[0].localeCompare(b[0]));
  fromEl.innerHTML = entries.map(([c,o])=> `<option value="${c}">${c} — ${o.description}</option>`).join('');
  toEl.innerHTML   = entries.map(([c,o])=> `<option value="${c}">${c} — ${o.description}</option>`).join('');
  fromEl.value = symbols.USD ? 'USD' : entries[0][0];
  toEl.value = symbols.EGP ? 'EGP' : (entries[1]?entries[1][0]:entries[0][0]);
  setFlag(flagFrom, fromEl.value); setFlag(flagTo, toEl.value);
}

function convertUsingRates(amount, from, to, ratesObj){ if(!ratesObj || !ratesObj.rates) return null; const rates = ratesObj.rates; if(!(from in rates) || !(to in rates)) return null; const value = amount * (rates[to] / rates[from]); return { value, rate: rates[to] / rates[from], date: ratesObj.date || '' }; }

async function convertAction(){
  const amount = parseFloat(amountEl.value || '1');
  if(isNaN(amount) || amount <= 0){ setResult('أدخل مبلغًا صالحًا أكبر من صفر'); return; }
  const from = fromEl.value, to = toEl.value;
  if(from === to){ setResult(`${amount.toLocaleString()} ${from} = ${amount.toLocaleString()} ${to}`, true); return; }
  setResult('جاري التحويل...');
  try{ const ratesObj = await loadRates(false); const conv = convertUsingRates(amount, from, to, ratesObj); if(conv){ const formatted = `${Number(amount).toLocaleString()} ${from} = ${Number(conv.value).toLocaleString()} ${to}`; const rateText = `1 ${from} = ${Number(conv.rate).toLocaleString(undefined,{maximumFractionDigits:8})} ${to}${conv.date? ' — بتاريخ '+conv.date: ''}`; setResult(`<div style="font-weight:900">${formatted}</div><div style="margin-top:8px;color:var(--muted)">${rateText}</div>`, true); return; } }catch(e){ console.warn('convert error', e); }
  setResult('فشل التحويل — تحقق من اتصال الإنترنت أو أعد المحاولة.');
}

document.getElementById('convertBtn')?.addEventListener('click', convertAction);
amountEl.addEventListener('keydown', e=>{ if(e.key === 'Enter') convertAction(); });
swapBtn.addEventListener('click', ()=>{ const a = fromEl.value; fromEl.value = toEl.value; toEl.value = a; setFlag(flagFrom, fromEl.value); setFlag(flagTo, toEl.value); convertAction(); });
fromEl.addEventListener('change', ()=>{ setFlag(flagFrom, fromEl.value); convertAction(); });
toEl.addEventListener('change', ()=>{ setFlag(flagTo, toEl.value); convertAction(); });

refreshBtn.addEventListener('click', async ()=>{ await loadRates(true); alert('تم تحديث الأسعار الآن'); });
previewLink.addEventListener('click', e=>{ e.preventDefault(); window.open(window.location.href.split('#')[0], '_blank'); });
downloadLink.addEventListener('click', e=>{ e.preventDefault(); const html = buildStandalone(); const blob = new Blob([html], {type:'text/html;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'محول_العملات_النمر_للمعلوميات.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });

function buildStandalone(){ const style = document.querySelector('style').innerHTML; const cardHtml = document.querySelector('.card').outerHTML; const minimal = `(function(){const API_URL='https://open.er-api.com/v6/latest/USD';function fetchJSON(url,timeout=9000){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),timeout);fetch(url).then(r=>{clearTimeout(t);if(!r.ok)rej(new Error('http '+r.status));r.json().then(j=>res(j)).catch(e=>rej(e));}).catch(e=>{clearTimeout(t);rej(e);});});}async function updateAndConvert(){const amount=parseFloat(document.getElementById('amount').value||'1');const from=document.getElementById('from').value;const to=document.getElementById('to').value;document.getElementById('result').innerText='جاري التحويل...';try{const d=await fetchJSON(API_URL,9000);if(d&&d.rates&&d.rates[from]&&d.rates[to]){const val=amount*(d.rates[to]/d.rates[from]);document.getElementById('result').innerHTML='<div style=\"font-weight:900\">'+amount.toLocaleString()+' '+from+' = '+Number(val).toLocaleString()+' '+to+'</div>';return;}}catch(e){}document.getElementById('result').innerText='فشل التحويل';}document.getElementById('convertBtn').addEventListener('click',updateAndConvert);document.getElementById('swapBtn').addEventListener('click',()=>{const a=document.getElementById('from').value;document.getElementById('from').value=document.getElementById('to').value;document.getElementById('to').value=a;updateAndConvert();});})();`; return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>محول العملات - الحزمة</title><style>${style}</style></head><body>${cardHtml}<script>${minimal}</script></body></html>`; }

(async function init(){ loadTheme(); await loadSymbols(); await loadRates(false); setTimeout(()=>{ try{ convertAction(); }catch(e){} }, 200); })();
