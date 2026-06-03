const DATA = {
    cbr: { usd: 71.5532, eur: 86.2499, date: '2025-06-02' },
    history: [
        { date: '2025-10-23', rub: 3141.45, eur: 30.00, cbrEur: 94.7543 },
        { date: '2025-12-29', rub: 2023.23, eur: 20.00, cbrEur: 91.2066 },
        { date: '2026-01-09', rub: 3522.89, eur: 35.00, cbrEur: 92.0938 },
        { date: '2026-01-17', rub: 499.19,  eur: 5.00,  cbrEur: 90.5366 },
        { date: '2026-01-29', rub: 767.44,  eur: 7.61,  cbrEur: 91.2988 },
        { date: '2026-02-22', rub: 877.26,  eur: 8.77,  cbrEur: 90.2833 },
        { date: '2026-02-28', rub: 5037.21, eur: 50.00, cbrEur: 90.5821 },
        { date: '2026-03-25', rub: 1059.35, eur: 10.00, cbrEur: 93.9247 },
        { date: '2026-04-13', rub: 2391.73, eur: 23.00, cbrEur: 90.0120 },
        { date: '2026-05-06', rub: 2052.50, eur: 20.00, cbrEur: 88.3463 },
        { date: '2026-05-21', rub: 1426.81, eur: 15.00, cbrEur: 81.9823 },
    ]
};

let charts = {};

function init() {
    loadTodayRates();
    renderHistoryTable();
    calculateAll();
    quickCalc();
}

async function loadTodayRates() {
    const proxies = [
        'https://api.codetabs.com/v1/proxy?quest=https://www.cbr.ru/scripts/XML_daily.asp',
        'https://thingproxy.freeboard.io/fetch/https://www.cbr.ru/scripts/XML_daily.asp',
        'https://corsproxy.io/?https://www.cbr.ru/scripts/XML_daily.asp',
    ];

    let xml = null;
    for (const proxy of proxies) {
        try {
            const r = await fetch(proxy, { method: 'GET', signal: AbortSignal.timeout(8000) });
            if (r.ok) {
                xml = await r.text();
                if (xml.includes('Valute') && xml.includes('USD')) break;
            }
        } catch (e) { /* continue */ }
    }

    if (xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'application/xml');
        let usd = null, eur = null;
        const valutes = doc.querySelectorAll('Valute');
        valutes.forEach(v => {
            const code = v.querySelector('CharCode')?.textContent;
            const valNode = v.querySelector('Value');
            if (code && valNode) {
                const val = parseFloat(valNode.textContent.replace(',', '.'));
                if (code === 'USD') usd = val;
                if (code === 'EUR') eur = val;
            }
        });
        if (usd && eur) {
            DATA.cbr.usd = usd;
            DATA.cbr.eur = eur;
            DATA.cbr.date = new Date().toISOString().split('T')[0];
            document.getElementById('rates-date').textContent = formatDateRu(DATA.cbr.date);
            document.getElementById('cbr-usd').textContent = usd.toFixed(2);
            document.getElementById('cbr-eur').textContent = eur.toFixed(2);
            updatePpmBadge();
            calculateAll();
            quickCalc();
            return;
        }
    }

    // Fallback: use stored values
    document.getElementById('rates-date').textContent = formatDateRu(DATA.cbr.date) + ' (кэш)';
    updatePpmBadge();
}

function updatePpmBadge() {
    const ppmRate = parseFloat(document.getElementById('ppm-rate').value) || 97.89;
    const cbrEur = DATA.cbr.eur;
    const delta = ((ppmRate / cbrEur - 1) * 100).toFixed(1);
    document.getElementById('ppm-eur').textContent = ppmRate.toFixed(2);
    document.getElementById('ppm-eur-delta').textContent = `+${delta}%`;
}

function getParams() {
    return {
        ppmRate: parseFloat(document.getElementById('ppm-rate').value) || 97.89,
        eurUsdRate: parseFloat(document.getElementById('eur-usd-rate').value) || 0.88,
        commission: parseFloat(document.getElementById('commission').value) || 0.25,
        cbrUsd: DATA.cbr.usd,
        cbrEur: DATA.cbr.eur,
    };
}

function calculateAll() {
    updatePpmBadge();
    renderEurTable();
    renderUsdTable();
    renderCommissionChart();
    renderEurUsdChart();
    renderHistoryChart();
}

function renderEurTable() {
    const p = getParams();
    const amounts = [5, 10, 15, 20, 30, 50, 100];
    const tbody = document.getElementById('table-eur');
    tbody.innerHTML = amounts.map(a => {
        const charged = a + p.commission;
        const rub = charged * p.ppmRate;
        const eff = rub / a;
        const pct = ((eff / p.cbrEur - 1) * 100).toFixed(1);
        return `<tr>
            <td>${a} €</td>
            <td>${charged.toFixed(2)}</td>
            <td>${rub.toFixed(0)}</td>
            <td>${eff.toFixed(2)}</td>
            <td class="positive">+${pct}%</td>
        </tr>`;
    }).join('');
}

function renderUsdTable() {
    const p = getParams();
    const amounts = [5, 10, 15, 20, 30, 50, 100];
    const tbody = document.getElementById('table-usd');
    tbody.innerHTML = amounts.map(a => {
        const charged = a * p.eurUsdRate + p.commission;
        const rub = charged * p.ppmRate;
        const eff = rub / a;
        const pct = ((eff / p.cbrUsd - 1) * 100).toFixed(1);
        return `<tr>
            <td>${a} $</td>
            <td>${charged.toFixed(2)}</td>
            <td>${rub.toFixed(0)}</td>
            <td>${eff.toFixed(2)}</td>
            <td class="positive">+${pct}%</td>
        </tr>`;
    }).join('');
}

function quickCalc() {
    const p = getParams();
    const amount = parseFloat(document.getElementById('quick-sum').value) || 50;
    const currency = document.getElementById('quick-currency').value;

    let charged, rub, effRate, excessPct;
    if (currency === 'eur') {
        charged = amount + p.commission;
        rub = charged * p.ppmRate;
        effRate = rub / amount;
        excessPct = ((effRate / p.cbrEur - 1) * 100);
    } else {
        charged = amount * p.eurUsdRate + p.commission;
        rub = charged * p.ppmRate;
        effRate = rub / amount;
        excessPct = ((effRate / p.cbrUsd - 1) * 100);
    }

    document.getElementById('res-charged').textContent = charged.toFixed(2) + ' €';
    document.getElementById('res-rub').textContent = rub.toFixed(0) + ' ₽';
    document.getElementById('res-rate').textContent = effRate.toFixed(2) + ' ₽/' + currency.toUpperCase();
    document.getElementById('res-excess').textContent = `+${excessPct.toFixed(1)}% к ЦБ`;
}

function renderCommissionChart() {
    const ctx = document.getElementById('commission-chart').getContext('2d');
    if (charts.commission) charts.commission.destroy();

    const amounts = Array.from({length: 100}, (_, i) => i + 1);
    const commPctEur = amounts.map(a => (0.25 / a) * 100);
    const commPctUsd = amounts.map(a => (0.25 / (a * 0.88)) * 100);

    charts.commission = new Chart(ctx, {
        type: 'line',
        data: {
            labels: amounts,
            datasets: [
                { label: 'EUR-оплата', data: commPctEur, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
                { label: 'USD-оплата', data: commPctUsd, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'top' }
            },
            scales: {
                x: { title: { display: true, text: 'Сумма платежа, € или $' } },
                y: { title: { display: true, text: 'Доля комиссии в стоимости, %' }, min: 0, max: 30 }
            }
        }
    });
}

function renderEurUsdChart() {
    const ctx = document.getElementById('eur-usd-chart').getContext('2d');
    if (charts.eurUsd) charts.eurUsd.destroy();

    const p = getParams();
    const amounts = Array.from({length: 100}, (_, i) => i + 1);
    const rubEur = amounts.map(a => (a + p.commission) * p.ppmRate);
    const rubUsd = amounts.map(a => (a * p.eurUsdRate + p.commission) * p.ppmRate);
    const cbrEur = amounts.map(a => a * p.cbrEur);
    const cbrUsd = amounts.map(a => a * p.cbrUsd);

    charts.eurUsd = new Chart(ctx, {
        type: 'line',
        data: {
            labels: amounts,
            datasets: [
                { label: `PPM EUR (курс ${p.ppmRate.toFixed(0)} ₽/€)`, data: rubEur, borderColor: '#ef4444', borderWidth: 2, pointRadius: 0, tension: 0.3 },
                { label: `PPM USD (кросс ${p.eurUsdRate} EUR/$)`, data: rubUsd, borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.3 },
                { label: `ЦБ EUR (${p.cbrEur.toFixed(2)})`, data: cbrEur, borderColor: '#10b981', borderWidth: 1, borderDash: [5,5], pointRadius: 0, tension: 0.3 },
                { label: `ЦБ USD (${p.cbrUsd.toFixed(2)})`, data: cbrUsd, borderColor: '#059669', borderWidth: 1, borderDash: [2,3], pointRadius: 0, tension: 0.3 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'top' }
            },
            scales: {
                x: { title: { display: true, text: 'Сумма на сервисе' } },
                y: { title: { display: true, text: 'Итоговая стоимость, ₽' } }
            }
        }
    });
}

function renderHistoryChart() {
    const ctx = document.getElementById('history-chart').getContext('2d');
    if (charts.history) charts.history.destroy();

    const labels = DATA.history.map(h => formatDateRu(h.date));
    const effRates = DATA.history.map(h => h.rub / h.eur);
    const cbrRates = DATA.history.map(h => h.cbrEur);

    charts.history = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Эффективный курс PPM', data: effRates, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7 },
                { label: 'Курс ЦБ EUR', data: cbrRates, borderColor: '#10b981', borderWidth: 2, borderDash: [5,5], pointRadius: 4, tension: 0.3 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        afterBody: (items) => {
                            const idx = items[0].dataIndex;
                            const h = DATA.history[idx];
                            return `${h.rub.toFixed(2)} ₽ → ${h.eur.toFixed(2)} €\nПревышение: +${((h.rub/h.eur - h.cbrEur)/h.cbrEur*100).toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Дата пополнения' } },
                y: { title: { display: true, text: '₽ / €' }, min: 70, max: 115 }
            }
        }
    });
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-table');
    tbody.innerHTML = DATA.history.map(h => {
        const eff = h.rub / h.eur;
        const pct = ((eff / h.cbrEur - 1) * 100).toFixed(1);
        return `<tr>
            <td>${formatDateRu(h.date)}</td>
            <td>${h.rub.toFixed(2)}</td>
            <td>${h.eur.toFixed(2)}</td>
            <td>${eff.toFixed(2)}</td>
            <td>${h.cbrEur.toFixed(2)}</td>
            <td class="positive">+${pct}%</td>
        </tr>`;
    }).join('');
}

function formatDateRu(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y.slice(2)}`;
}

function exportCSV() {
    const p = getParams();
    const rows = [
        ['PlatiPoMiru Calculator Export'],
        ['Дата', new Date().toLocaleDateString('ru-RU')],
        ['Курс ЦБ USD', p.cbrUsd],
        ['Курс ЦБ EUR', p.cbrEur],
        ['Курс PPM', p.ppmRate],
        [''],
        ['Сумма EUR', 'EUR списано', 'Рубли', 'Эф.курс', 'Переплата%'],
    ];
    [5,10,15,20,30,50,100].forEach(a => {
        const c = a + p.commission;
        const r = c * p.ppmRate;
        rows.push([a, c.toFixed(2), r.toFixed(2), (r/a).toFixed(2), ((r/a/p.cbrEur-1)*100).toFixed(1)]);
    });
    rows.push(['']);
    rows.push(['Сумма USD', 'EUR списано', 'Рубли', 'Эф.курс', 'Переплата%']);
    [5,10,15,20,30,50,100].forEach(a => {
        const c = a * p.eurUsdRate + p.commission;
        const r = c * p.ppmRate;
        rows.push([a, c.toFixed(2), r.toFixed(2), (r/a).toFixed(2), ((r/a/p.cbrUsd-1)*100).toFixed(1)]);
    });

    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ppm-calculator-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Event listeners
document.getElementById('ppm-rate').addEventListener('input', calculateAll);
document.getElementById('eur-usd-rate').addEventListener('input', calculateAll);
document.getElementById('commission').addEventListener('input', calculateAll);
document.getElementById('quick-sum').addEventListener('input', quickCalc);
document.getElementById('quick-currency').addEventListener('change', quickCalc);

// Init
init();
