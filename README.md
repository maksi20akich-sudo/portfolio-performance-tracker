portfolio-performance-tracker/
├── python/
│   ├── tracker.py
│   ├── requirements.txt
│   └── portfolio.db (создаётся при запуске)
├── react/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   │       ├── TradeForm.js
│   │       └── PortfolioChart.js
│   ├── package.json
│   └── public/index.html
├── csharp/
│   ├── PortfolioTracker.csproj
│   └── Program.cs
└── README.md



Приложение для учёта инвестиций в криптовалюты (акции могут быть добавлены аналогично). Позволяет добавлять сделки, рассчитывать текущую стоимость портфеля, доходность и строить график.

## Возможности
- Добавление покупок и продаж с датами
- Получение текущих цен через CoinGecko API
- Расчёт взвешенной средней цены и PnL (абсолютной и процентной)
- Визуализация изменения стоимости портфеля (только в Python версии полноценный график Plotly, в React – демо-график)

## Реализации

### Python (Pandas + Plotly)
```bash
cd python
pip install -r requirements.txt
python tracker.py
