# PlatiPoMiru Calculator

Интерактивный калькулятор эффективного курса **RUB → EUR / USD** через сервис [PlatiPoMiru](https://platipomiru.com/).

**🔗 Живые сайты**:
- https://intari.github.io/platipomiru_calculator/ (оригинал, заказчик)
- https://taurired-ai.github.io/platipomiru_calculator/ (mirror, разработчик)

---

## Что делает

- Подгружает **актуальные курсы ЦБ РФ** (USD, EUR) автоматически через API
- Считает **эффективный курс** при пополнении EUR-баланса PlatiPoMiru
- Считает **итоговую стоимость** оплаты подписок в EUR и USD с учётом:
  - Маржи PPM на RUB→EUR
  - Внутреннего кросс-курса EUR→USD
  - Фиксированной комиссии €0.25 за списание
- **Сравнивает** EUR vs USD — сколько реально уйдёт рублей
- **Визуализирует** влияние комиссии и стратегию пополнения
- Работает **полностью в браузере**, никаких серверов

---

## Структура проекта

```
platipomiru-calculator/
├── index.html              # Главная страница
├── css/
│   └── style.css           # Стили (dark theme)
├── js/
│   └── app.js              # Логика + Chart.js графики
├── data/
│   └── rates.json          # Кэш курсов (обновляется GitHub Actions)
├── .github/
│   └── workflows/
│       └── update-rates.yml  # Авто-обновление курсов каждый день
├── README.md               # Этот файл
├── LICENSE                 # MIT License
└── scripts/
    └── update_rates.py     # Python-скрипт для ручного обновления курсов
```

---

## Как запустить локально

```bash
cd platipomiru-calculator

# Вариант 1: просто открыть в браузере
# Двойной клик на index.html

# Вариант 2: локальный сервер
python3 -m http.server 8080
# Открыть http://localhost:8080
```

---

## Развёртывание на GitHub Pages

1. Создай публичный репозиторий `platipomiru-calculator`
2. Загрузи все файлы
3. **Settings** → **Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)`
4. Через 1–2 минуты сайт доступен по адресу: `https://ТВОЙ_НИК.github.io/platipomiru-calculator/`

---

## Как пользоваться калькулятором

1. **Параметры PPM** вверху — изменяй по факту своих пополнений:
   - `PPM эф. RUB/EUR` — сколько ₽ вы заплатили за 1 €
   - `PPM внутр. EUR/USD` — обычно 0.87–0.89
   - `Комиссия` — €0.25 по умолчанию

2. **Табы**: Пополнение EUR, Оплата в EUR/USD, EUR vs USD, Стратегия, График комиссии
3. **Своя сумма** — введи любое число под таблицей, результат пересчитается мгновенно

---

## Поддержка и обновления

| Компонент | Обновляется |
|---|---|
| Курсы ЦБ РФ | Автоматически при загрузке страницы + ежедневно через Actions |
| Параметры PPM | Вручную пользователем |

---

## Используемые технологии

| Компонент | Назначение |
|---|---|
| **Vanilla JavaScript (ES2020+)** | Логика расчётов, табы, экспорт CSV |
| **Chart.js 4.x** | Интерактивные графики (4 canvas-чарта) |
| **CSS Grid / Flexbox** | Адаптивная вёрстка, тёмная тема |
| **GitHub Pages** | Бесплатный хостинг статики |
| **cbr-xml-daily.ru API** | Зеркало курсов ЦБ РФ с CORS |
| **GitHub Actions** | Ежедневное авто-обновление `data/rates.json` |
| **Python 3 + requests** | Скрипт `update_rates.py` для ручного обновления |

---

## Авторство

| Роль | Кто |
|---|---|
| **Аналитика, разработка фронтенда, DevOps** | **Tauri Red** — [<taurired-ai@l.viorsan.com>](mailto:taurired-ai@l.viorsan.com) |
| **Заказчик, владелец данных, репозитория** | **[intari](https://github.com/intari)** |

> Проект выполнен по запросу [intari](https://github.com/intari). Все расчёты эффективных курсов, прогнозы и визуализации произведены Tauri Red.

---

## Лицензия

[MIT License](LICENSE) © 2026 Tauri Red, intari
