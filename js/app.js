// ============================================================
// PlatiPoMiru Calculator — основной скрипт
// ============================================================

const STATE = {
    cbrUsd: null,
    cbrEur: null,
    cbrDate: null,
    ppmRubEur: 97.89,
    ppmEurUsd: 0.88,
    ppmCommission: 0.25,
    loaded: false
};

const TABLE_AMOUNTS_EUR = [5, 10, 15, 20, 30, 50, 100];
const TABLE_AMOUNTS_USD = [5, 10, 15, 20, 30, 50, 100];

// ============================================================
// Загрузка курсов ЦБ РФ (CORS-friendly зеркало)
// ============================================================
async function loadCBRRates() {
    const statusEl = document.getElementById('rate-status');
    try {
        const resp = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        const usd = data.Valute.USD?.Value;
        const eur = data.Valute.EUR?.Value;
        const date = data.Date;

        if (!usd || !eur) throw new Error('USD/EUR not found in response');

        STATE.cbrUsd = usd;
        STATE.cbrEur = eur;
        STATE.cbrDate = date;
        STATE.loaded = true;

        document.getElementById('cbr-usd').textContent = usd.toFixed(4);
        document.getElementById('cbr-eur').textContent = eur.toFixed(4);
        document.getElementById('cbr-eurusd').textContent = (eur / usd).toFixed(4);
        document.getElementById('cbr-date').textContent = new Date(date).toLocaleDateString('ru-RU');

        statusEl.textContent = `Курсы ЦБ загружены: ${new Date(date).toLocaleDateString('ru-RU')}`;
        statusEl.className = 'status-badge ok';

        recalcAll();
    } catch (err) {
        console.error('CBR load failed:', err);
        statusEl.textContent = 'Не удалось загрузить курсы ЦБ. Используются значения по умолчанию.';
        statusEl.className = 'status-badge error';
        // Fallback
        STATE.cbrUsd = 71.5532;
        STATE.cbrEur = 86.2499;
        STATE.cbrDate = new Date().toISOString();
        STATE.loaded = true;
        document.getElementById('cbr-usd').textContent = STATE.cbrUsd.toFixed(4);
        document.getElementById('cbr-eur').textContent = STATE.cbrEur.toFixed(4);
        document.getElementById('cbr-eurusd').textContent = (STATE.cbrEur / STATE.cbrUsd).toFixed(4);
        recalcAll();
    }
}

// ============================================================
// Чтение параметров PPM из инпутов
// ============================================================
function readParams() {
    STATE.ppmRubEur = parseFloat(document.getElementById('ppm-rub-eur').value) || 97.89;
    STATE.ppmEurUsd = parseFloat(document.getElementById('ppm-eur-usd').value) || 0.88;
    STATE.ppmCommission = parseFloat(document.getElementById('ppm-commission').value) || 0.25;
}

// ============================================================
// Таблица: пополнение EUR
// ============================================================
function renderTopupEUR() {
    const tbody = document.getElementById('tbody-eur-topup');
    tbody.innerHTML = '';
    for (const eur of TABLE_AMOUNTS_EUR) {
        const rub = eur * STATE.ppmRubEur;
        const eff = rub / eur;
        const diff = eff - STATE.cbrEur;
        const pct = (diff / STATE.cbrEur) * 100;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${eur} €</td>
                <td>${rub.toFixed(2)} ₽</td>
                <td>${eff.toFixed(2)} ₽/€</td>
                <td>${STATE.cbrEur.toFixed(2)} ₽/€</td>
                <td class="positive">+${diff.toFixed(2)} ₽</td>
                <td class="positive">+${pct.toFixed(1)}%</td>
            </tr>
        `);
    }
}

// ============================================================
// Таблица: оплата в EUR (с комиссией)
// ============================================================
function renderPayEUR() {
    const tbody = document.getElementById('tbody-eur-pay');
    tbody.innerHTML = '';
    for (const eur of TABLE_AMOUNTS_EUR) {
        const eurCharged = eur + STATE.ppmCommission;
        const rub = eurCharged * STATE.ppmRubEur;
        const eff = rub / eur;
        const pct = (eff / STATE.cbrEur - 1) * 100;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${eur} €</td>
                <td>${eurCharged.toFixed(2)} €</td>
                <td>${rub.toFixed(2)} ₽</td>
                <td>${eff.toFixed(2)} ₽/€</td>
                <td class="positive">+${pct.toFixed(1)}%</td>
            </tr>
        `);
    }
}

// ============================================================
// Таблица: оплата в USD
// ============================================================
function renderPayUSD() {
    const tbody = document.getElementById('tbody-usd-pay');
    tbody.innerHTML = '';
    for (const usd of TABLE_AMOUNTS_USD) {
        const eurCharged = usd * STATE.ppmEurUsd + STATE.ppmCommission;
        const rub = eurCharged * STATE.ppmRubEur;
        const eff = rub / usd;
        const pct = (eff / STATE.cbrUsd - 1) * 100;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${usd} $</td>
                <td>${eurCharged.toFixed(2)} €</td>
                <td>${rub.toFixed(2)} ₽</td>
                <td>${eff.toFixed(2)} ₽/$</td>
                <td class="positive">+${pct.toFixed(1)}%</td>
            </tr>
        `);
    }
}

// ============================================================
// Таблица: EUR vs USD сравнение
// ============================================================
function renderCompare() {
    const tbody = document.getElementById('tbody-compare');
    tbody.innerHTML = '';
    const amounts = [5, 10, 15, 20, 30, 50, 100];
    let totalDiff = 0, count = 0;
    for (const amt of amounts) {
        const rubEur = (amt + STATE.ppmCommission) * STATE.ppmRubEur;
        const rubUsd = (amt * STATE.ppmEurUsd + STATE.ppmCommission) * STATE.ppmRubEur;
        const diff = rubUsd - rubEur;
        const pct = (diff / rubEur) * 100;
        totalDiff += pct;
        count++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${amt} € / $</td>
                <td>${rubEur.toFixed(0)} ₽</td>
                <td>${rubUsd.toFixed(0)} ₽</td>
                <td class="positive">+${diff.toFixed(0)} ₽</td>
                <td class="positive">+${pct.toFixed(1)}%</td>
            </tr>
        `);
    }
    document.getElementById('usd-penalty-avg').textContent = `~${(totalDiff / count).toFixed(1)}%`;
}

// ============================================================
// Стратегия пополнения
// ============================================================
function renderStrategy() {
    const budgetEur = 1000;
    const monthlyEur = 83;
    const months = 12;

    // Крупное: пополнить 1000 сразу, 12 списаний с комиссией
    const rubLargeTopup = budgetEur * STATE.ppmRubEur;
    const rubLargeComm = months * STATE.ppmCommission * STATE.ppmRubEur;
    const rubLarge = rubLargeTopup + rubLargeComm;

    // Мелкое: 12 пополнений по 83 + 12 комиссий на списание
    // При стабильном курсе те же 1000 * курс + 12 комиссий
    const rubSmallTopup = budgetEur * STATE.ppmRubEur;
    const rubSmallComm = months * STATE.ppmCommission * STATE.ppmRubEur;
    const rubSmall = rubSmallTopup + rubSmallComm; // теоретически равно при стабильном курсе

    document.getElementById('strat-large').textContent = rubLarge.toFixed(0) + ' ₽';
    document.getElementById('strat-small').textContent = rubSmall.toFixed(0) + ' ₽';
    document.getElementById('strat-diff').textContent = '0 ₽';
}

// ============================================================
// Кастомные калькуляторы
// ============================================================
function setupCustomCalcs() {
    const updateEurTopup = () => {
        const val = parseFloat(document.getElementById('custom-eur-topup').value) || 0;
        const rub = val * STATE.ppmRubEur;
        document.getElementById('custom-eur-topup-result').textContent = `→ ${rub.toFixed(2)} ₽ (эф. курс ${STATE.ppmRubEur.toFixed(2)} ₽/€)`;
    };
    const updateEurPay = () => {
        const val = parseFloat(document.getElementById('custom-eur-pay').value) || 0;
        const rub = (val + STATE.ppmCommission) * STATE.ppmRubEur;
        document.getElementById('custom-eur-pay-result').textContent = `→ ${rub.toFixed(2)} ₽ (эф. курс ${(rub/val).toFixed(2)} ₽/€)`;
    };
    const updateUsdPay = () => {
        const val = parseFloat(document.getElementById('custom-usd-pay').value) || 0;
        const rub = (val * STATE.ppmEurUsd + STATE.ppmCommission) * STATE.ppmRubEur;
        document.getElementById('custom-usd-pay-result').textContent = `→ ${rub.toFixed(2)} ₽ (эф. курс ${(rub/val).toFixed(2)} ₽/$)`;
    };

    document.getElementById('custom-eur-topup').addEventListener('input', updateEurTopup);
    document.getElementById('custom-eur-pay').addEventListener('input', updateEurPay);
    document.getElementById('custom-usd-pay').addEventListener('input', updateUsdPay);

    updateEurTopup();
    updateEurPay();
    updateUsdPay();
}

// ============================================================
// Графики Chart.js
// ============================================================
let charts = {};

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

function renderCharts() {
    const amounts = Array.from({length: 100}, (_, i) => i + 1);

    // Chart 1: Комиссия в % для EUR
    destroyChart('chart-comm-eur');
    const ctx1 = document.getElementById('chart-comm-eur').getContext('2d');
    charts['chart-comm-eur'] = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: amounts,
            datasets: [{
                label: 'Доля €0.25 в стоимости, %',
                data: amounts.map(a => (STATE.ppmCommission / a) * 100),
                borderColor: '#f87171',
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 6
            }, {
                label: '1% порог',
                data: amounts.map(() => 1),
                borderColor: '#4ade80',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: '5% порог',
                data: amounts.map(() => 5),
                borderColor: '#fbbf24',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Влияние €0.25 на платежи в EUR', color: '#e2e8f0', font: {size: 14} },
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { title: { display: true, text: 'Сумма платежа, €', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                y: { title: { display: true, text: '% от суммы', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Chart 2: Комиссия в % для USD
    destroyChart('chart-comm-usd');
    const ctx2 = document.getElementById('chart-comm-usd').getContext('2d');
    const usdAmounts = Array.from({length: 100}, (_, i) => i + 1);
    charts['chart-comm-usd'] = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: usdAmounts,
            datasets: [{
                label: 'Доля €0.25 в эквиваленте EUR, %',
                data: usdAmounts.map(a => (STATE.ppmCommission / (a * STATE.ppmEurUsd)) * 100),
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 6
            }, {
                label: '1% порог',
                data: usdAmounts.map(() => 1),
                borderColor: '#4ade80',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: '5% порог',
                data: usdAmounts.map(() => 5),
                borderColor: '#fbbf24',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Влияние €0.25 на платежи в USD (кросс-курс ' + STATE.ppmEurUsd + ')', color: '#e2e8f0', font: {size: 14} },
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { title: { display: true, text: 'Сумма платежа, $', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                y: { title: { display: true, text: '% от эквивалента', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Chart 3: EUR vs USD — стоимость в ₽
    destroyChart('chart-eur-vs-usd');
    const ctx3 = document.getElementById('chart-eur-vs-usd').getContext('2d');
    const compAmounts = Array.from({length: 50}, (_, i) => i + 1);
    charts['chart-eur-vs-usd'] = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: compAmounts.map(a => `${a}`),
            datasets: [{
                label: 'Оплата в EUR (с комиссией)',
                data: compAmounts.map(a => (a + STATE.ppmCommission) * STATE.ppmRubEur),
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }, {
                label: 'Оплата в USD (кросс + комиссия)',
                data: compAmounts.map(a => (a * STATE.ppmEurUsd + STATE.ppmCommission) * STATE.ppmRubEur),
                borderColor: '#f87171',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }, {
                label: 'ЦБ EUR (без маржи)',
                data: compAmounts.map(a => a * STATE.cbrEur),
                borderColor: '#94a3b8',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }, {
                label: 'ЦБ USD (без маржи)',
                data: compAmounts.map(a => a * STATE.cbrUsd),
                borderColor: '#64748b',
                borderDash: [2, 4],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'EUR vs USD: сколько реально уйдёт рублей', color: '#e2e8f0', font: {size: 15} },
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { title: { display: true, text: 'Сумма на сервисе (€ или $)', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                y: { title: { display: true, text: '₽', color: '#94a3b8' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

// ============================================================
// Пересчёт всего
// ============================================================
function recalcAll() {
    readParams();
    renderTopupEUR();
    renderPayEUR();
    renderPayUSD();
    renderCompare();
    renderStrategy();
    renderCharts();
    setupCustomCalcs();
}

// ============================================================
// Табы
// ============================================================
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });
}

// ============================================================
// Инициализация
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    document.getElementById('recalc-btn').addEventListener('click', recalcAll);
    // Автоматически пересчитывать при изменении параметров
    ['ppm-rub-eur', 'ppm-eur-usd', 'ppm-commission'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            recalcAll();
        });
    });
    loadCBRRates();
});
