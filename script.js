// الحقول البرمجية الأساسية للتطبيق
const fromSelect = document.getElementById('from');
const toSelect = document.getElementById('to');
const amountInput = document.getElementById('amount');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const resultDiv = document.getElementById('result');
const noteDiv = document.getElementById('note');
const cardContainer = document.getElementById('card');

// قائمة العملات المدعومة الأساسية (عالمية وعربية)
const popularCurrencies = [
  { code: 'USD', name: 'دولار أمريكي' },
  { code: 'EGP', name: 'جنيه مصري' },
  { code: 'SAR', name: 'ريال سعودي' },
  { code: 'EUR', name: 'يورو' },
  { code: 'AED', name: 'درهم إماراتي' },
  { code: 'KWD', name: 'دينار كويتي' },
  { code: 'QAR', name: 'ريال قطري' },
  { code: 'BHD', name: 'دينار بحريني' },
  { code: 'OMR', name: 'ريال عماني' },
  { code: 'JOD', name: 'دينار أردني' },
  { code: 'GBP', name: 'جنيه إسترليني' }
];

let exchangeRates = {};

// تهيئة القوائم المنسدلة عند فتح التطبيق
function initData() {
  popularCurrencies.forEach(curr => {
    const optFrom = new Option(`${curr.code} - ${curr.name}`, curr.code);
    const optTo = new Option(`${curr.code} - ${curr.name}`, curr.code);
    fromSelect.add(optFrom);
    toSelect.add(optTo);
  });

  // ضبط العملات الافتراضية الذكية
  fromSelect.value = 'USD';
  toSelect.value = 'EGP';
  
  fetchRates();
}

// جلب أسعار العملات الحية والمباشرة من الـ API المعتمد
async function fetchRates() {
  noteDiv.textContent = 'جارٍ تحديث أسعار العملات الآن...';
  try {
    const response = await fetch('https://er-api.com');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    exchangeRates = data.rates;
    
    const now = new Date();
    noteDiv.textContent = `آخر تحديث حي: ${now.toLocaleTimeString('ar-EG')}`;
  } catch (error) {
    console.error(error);
    noteDiv.textContent = 'تعذر التحديث الحي. يعمل بالتخزين المؤقت.';
  }
}

// معالجة وإجراء عملية التحويل الحسابية بدقة
function performConversion() {
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    resultDiv.innerHTML = '<div class="inner" style="color:red">يرجى كتابة مبلغ صحيح!</div>';
    return;
  }

  const fromCurr = fromSelect.value;
  const toCurr = toSelect.value;

  if (!exchangeRates[fromCurr] || !exchangeRates[toCurr]) {
    resultDiv.innerHTML = '<div class="inner">خطأ في البيانات الحالية!</div>';
    return;
  }

  // التحويل البرمجي عبر الدولار كوسيط قياسي
  const amountInUSD = amount / exchangeRates[fromCurr];
  const convertedAmount = amountInUSD * exchangeRates[toCurr];

  resultDiv.innerHTML = `<div class="inner">${amount.toFixed(2)} ${fromCurr} = <span style="color:var(--primary-color)">${convertedAmount.toFixed(2)}</span> ${toCurr}</div>`;
}

// إدارة وظيفة تبديل العملات العكسية (Swap)
swapBtn.addEventListener('click', () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
  performConversion();
});

// الأزرار التفاعلية
convertBtn.addEventListener('click', performConversion);
refreshBtn.addEventListener('click', fetchRates);

// تفعيل وتغيير الوضع الليلي/النهاري (Dark/Light Mode)
themeToggle.addEventListener('click', () => {
  const currentTheme = cardContainer.getAttribute('data-theme');
  if (currentTheme === 'light') {
    cardContainer.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
  } else {
    cardContainer.setAttribute('data-theme', 'light');
    themeToggle.textContent = '🌙';
  }
});

// تشغيل التأسيس الأولي للمشروع
initData();
