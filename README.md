# PlatiPoMiru Calculator

Онлайн-калькулятор эффективного курса RUB→EUR→USD для сервиса [PlatiPoMiru](https://help.platipomiru.com/). С учётом внутренних кросс-курсов и фиксированной комиссии €0.25 за транзакцию.

**Живой пример**: [Открыть калькулятор](https://your-username.github.io/platipomiru-calculator/)

## Возможности

- **Автозагрузка курса ЦБ** — подтягивает актуальные USD/EUR при открытии страницы (через CORS-прокси)
- **Ручной ввод курса PPM** — укажите ваш фактический курс из истории пополнений
- **Быстрый расчёт** — введите сумму подписки и мгновенно получите стоимость в ₽
- **Сравнительные таблицы** — EUR vs USD для сумм от $/€5 до $/€100
- **Графики** — визуализация влияния комиссии и истории курсов
- **История** — встроенные данные по 11 пополнениям с октября 2025 по май 2026

## Как развернуть на GitHub Pages

### Шаг 1. Создайте репозиторий на GitHub

```bash
# Локально внутри этой папки
cd platipomiru-calculator
git init
git add .
git commit -m "Initial commit"

# Замените USERNAME на свой логин GitHub
git remote add origin https://github.com/USERNAME/platipomiru-calculator.git
git branch -M main
git push -u origin main
```

### Шаг 2. Включите GitHub Pages

1. Откройте репозиторий на GitHub → **Settings** → **Pages**
2. В разделе **Source** выберите **Deploy from a branch**
3. Выберите ветку `main` и папку `/ (root)`
4. Нажмите **Save**
5. Через 1–2 минуты сайт будет доступен по адресу:  
   `https://USERNAME.github.io/platipomiru-calculator/`

### Шаг 3. Автообновление курсов (опционально)

В репозитории уже есть GitHub Actions workflow (`.github/workflows/update-rates.yml`), который:
- запускается каждый день в 6:00 UTC
- загружает курсы ЦБ через Python-скрипт
- обновляет `data/rates.json`
- автоматически коммитит изменения

Для активации workflow убедитесь, что в **Settings → Actions → General** разрешены workflows для этого репозитория.

### Локальное обновление курса (ручное)

```bash
cd platipomiru-calculator
pip install requests
python scripts/update_rates.py
# файл data/rates.json обновится
git add data/rates.json
git commit -m "Update rates $(date +%Y-%m-%d)"
git push
```

## Использование

1. Откройте страницу калькулятора
2. В блоке **Настройки** укажите ваш **фактический курс PPM RUB/EUR** (смотрите в истории пополнений, обычно 95–106 ₽/€)
3. Нажмите **Загрузить курс ЦБ** для точности
4. В **Быстром расчёте** введите сумму подписки и выберите валюту
5. Смотрите итоговую стоимость в ₽ и переплату к официальному курсу ЦБ

## Структура проекта

```
platipomiru-calculator/
├── index.html              # Главная страница
├── css/
│   └── style.css           # Стили
├── js/
│   └── app.js              # Логика и графики (Chart.js)
├── data/
│   └── rates.json          # Кэш курсов ЦБ
├── scripts/
│   └── update_rates.py     # Python-скрипт обновления курса
├── .github/workflows/
│   └── update-rates.yml    # GitHub Actions (ежедневное обновление)
└── README.md               # Этот файл
```

## Ключевые выводы из анализа

- **Средняя маржа PPM**: +12–13% над курсом ЦБ для EUR
- **USD через PPM**: +16–21% над ЦБ (двойная конвертация + кросс-курс)
- **Фиксированная комиссия €0.25**: на подписке €20 добавляет +1.25%, на €5 — +5%
- **Рекомендация**: если сервис позволяет выбрать валюту — **всегда выбирайте EUR**

## Лицензия

MIT. Используйте свободно.
