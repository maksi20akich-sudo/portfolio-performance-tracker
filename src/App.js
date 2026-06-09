import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const STORAGE_KEY = 'portfolio_trades';

function App() {
  const [trades, setTrades] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setTrades(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    calculatePortfolio();
  }, [trades]);

  const addTrade = () => {
    if (!symbol || !quantity || !price) return;
    const newTrade = {
      id: Date.now(),
      symbol: symbol.toLowerCase(),
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date: new Date().toISOString(),
    };
    setTrades([...trades, newTrade]);
    setSymbol('');
    setQuantity('');
    setPrice('');
  };

  const getCurrentPrice = async (sym) => {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${sym}&vs_currencies=usd`);
      const data = await res.json();
      return data[sym]?.usd || 0;
    } catch {
      return 0;
    }
  };

  const calculatePortfolio = async () => {
    if (trades.length === 0) {
      setPortfolio(null);
      return;
    }
    const holdings = {};
    for (const t of trades) {
      const qty = t.type === 'buy' ? t.quantity : -t.quantity;
      const cost = t.quantity * t.price;
      if (!holdings[t.symbol]) holdings[t.symbol] = { qty: 0, totalCost: 0 };
      holdings[t.symbol].qty += qty;
      holdings[t.symbol].totalCost += t.type === 'buy' ? cost : -cost;
    }
    const result = [];
    let totalCost = 0;
    let totalCurrent = 0;
    for (const [sym, data] of Object.entries(holdings)) {
      if (data.qty <= 0) continue;
      const currentPrice = await getCurrentPrice(sym);
      const currentValue = data.qty * currentPrice;
      const avgPrice = data.totalCost / data.qty;
      const pnl = currentValue - data.totalCost;
      const pnlPct = (pnl / data.totalCost) * 100;
      result.push({ sym, qty: data.qty, avgPrice, currentPrice, currentValue, pnl, pnlPct });
      totalCost += data.totalCost;
      totalCurrent += currentValue;
    }
    setPortfolio({ items: result, totalCost, totalCurrent, totalPnl: totalCurrent - totalCost, totalPnlPct: ((totalCurrent / totalCost) - 1) * 100 });
  };

  const chartData = {
    labels: trades.map((_, i) => i + 1),
    datasets: [{ label: 'Portfolio Value (USD)', data: trades.map((_, idx) => idx + 1), borderColor: 'limegreen' }], // placeholder – real historical not implemented here
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>📈 Portfolio Performance Tracker</h1>
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Add Trade</h3>
        <input placeholder="Symbol (bitcoin)" value={symbol} onChange={e => setSymbol(e.target.value)} />
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <input type="number" placeholder="Price (USD)" value={price} onChange={e => setPrice(e.target.value)} />
        <button onClick={addTrade}>Add Trade</button>
      </div>
      {portfolio && (
        <div>
          <h3>Current Holdings</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Symbol</th><th>Qty</th><th>Avg Price</th><th>Current</th><th>Value</th><th>PnL</th><th>PnL%</th></tr></thead>
            <tbody>
              {portfolio.items.map(item => (
                <tr key={item.sym}>
                  <td>{item.sym}</td><td>{item.qty.toFixed(4)}</td><td>${item.avgPrice.toFixed(2)}</td>
                  <td>${item.currentPrice.toFixed(2)}</td><td>${item.currentValue.toFixed(2)}</td>
                  <td style={{ color: item.pnl >= 0 ? 'green' : 'red' }}>${item.pnl.toFixed(2)}</td>
                  <td style={{ color: item.pnlPct >= 0 ? 'green' : 'red' }}>{item.pnlPct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
            <strong>Total Invested:</strong> ${portfolio.totalCost.toFixed(2)}<br />
            <strong>Current Value:</strong> ${portfolio.totalCurrent.toFixed(2)}<br />
            <strong>Total PnL:</strong> <span style={{ color: portfolio.totalPnl >= 0 ? 'green' : 'red' }}>${portfolio.totalPnl.toFixed(2)} ({portfolio.totalPnlPct.toFixed(2)}%)</span>
          </div>
          <div style={{ marginTop: '20px' }}>
            <Line data={chartData} options={{ responsive: true }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
