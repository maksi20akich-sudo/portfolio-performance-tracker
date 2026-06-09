using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace PortfolioTracker
{
    class Trade
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public string Type { get; set; } // buy/sell
        public double Quantity { get; set; }
        public double Price { get; set; }
        public string Date { get; set; }
    }

    class Program
    {
        const string DbPath = "portfolio.db";
        static HttpClient client = new HttpClient();

        static void InitDb()
        {
            using var conn = new SQLiteConnection($"Data Source={DbPath}");
            conn.Open();
            string sql = @"CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                type TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                date TEXT NOT NULL)";
            using var cmd = new SQLiteCommand(sql, conn);
            cmd.ExecuteNonQuery();
        }

        static void AddTrade(string symbol, string type, double quantity, double price, string date = null)
        {
            if (string.IsNullOrEmpty(date)) date = DateTime.Now.ToString("o");
            using var conn = new SQLiteConnection($"Data Source={DbPath}");
            conn.Open();
            string sql = "INSERT INTO trades (symbol, type, quantity, price, date) VALUES (@sym, @typ, @qty, @pr, @dt)";
            using var cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@sym", symbol.ToUpper());
            cmd.Parameters.AddWithValue("@typ", type);
            cmd.Parameters.AddWithValue("@qty", quantity);
            cmd.Parameters.AddWithValue("@pr", price);
            cmd.Parameters.AddWithValue("@dt", date);
            cmd.ExecuteNonQuery();
            Console.WriteLine($"✓ {type.ToUpper()} {quantity} {symbol} @ {price}");
        }

        static async Task<double> GetCurrentPrice(string symbol)
        {
            try
            {
                string url = $"https://api.coingecko.com/api/v3/simple/price?ids={symbol.ToLower()}&vs_currencies=usd";
                var response = await client.GetStringAsync(url);
                var json = JObject.Parse(response);
                return json[symbol.ToLower()]?.Value<double>("usd") ?? 0;
            }
            catch
            {
                return 0;
            }
        }

        static async Task ShowSummary()
        {
            var trades = new List<Trade>();
            using var conn = new SQLiteConnection($"Data Source={DbPath}");
            conn.Open();
            string sql = "SELECT id, symbol, type, quantity, price, date FROM trades ORDER BY date";
            using var cmd = new SQLiteCommand(sql, conn);
            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                trades.Add(new Trade
                {
                    Id = reader.GetInt32(0),
                    Symbol = reader.GetString(1),
                    Type = reader.GetString(2),
                    Quantity = reader.GetDouble(3),
                    Price = reader.GetDouble(4),
                    Date = reader.GetString(5)
                });
            }

            if (trades.Count == 0)
            {
                Console.WriteLine("No trades.");
                return;
            }

            var holdings = new Dictionary<string, (double qty, double totalCost)>();
            foreach (var t in trades)
            {
                double deltaQty = t.Type == "buy" ? t.Quantity : -t.Quantity;
                double deltaCost = t.Type == "buy" ? t.Quantity * t.Price : -t.Quantity * t.Price;
                if (!holdings.ContainsKey(t.Symbol))
                    holdings[t.Symbol] = (0, 0);
                var (qty, cost) = holdings[t.Symbol];
                holdings[t.Symbol] = (qty + deltaQty, cost + deltaCost);
            }

            double totalCost = 0, totalCurrent = 0;
            Console.WriteLine("\n=== PORTFOLIO SUMMARY ===");
            foreach (var kv in holdings)
            {
                if (kv.Value.qty <= 0) continue;
                double currentPrice = await GetCurrentPrice(kv.Key);
                double currentValue = kv.Value.qty * currentPrice;
                double avgPrice = kv.Value.totalCost / kv.Value.qty;
                double pnl = currentValue - kv.Value.totalCost;
                double pnlPct = (pnl / kv.Value.totalCost) * 100;
                Console.WriteLine($"{kv.Key}: {kv.Value.qty:F4} @ avg {avgPrice:F2} | current ${currentPrice:F2} | PnL ${pnl:F2} ({pnlPct:F2}%)");
                totalCost += kv.Value.totalCost;
                totalCurrent += currentValue;
            }
            Console.WriteLine($"\nTotal invested: ${totalCost:F2}");
            Console.WriteLine($"Current value : ${totalCurrent:F2}");
            Console.WriteLine($"Total PnL     : ${totalCurrent - totalCost:F2} ({(totalCurrent / totalCost - 1) * 100:F2}%)");
        }

        static async Task Main(string[] args)
        {
            InitDb();
            while (true)
            {
                Console.Write("\nCommands: add, summary, exit\n> ");
                string cmd = Console.ReadLine().Trim().ToLower();
                if (cmd == "add")
                {
                    Console.Write("Symbol (bitcoin, ethereum): ");
                    string sym = Console.ReadLine();
                    Console.Write("Type (buy/sell): ");
                    string typ = Console.ReadLine();
                    Console.Write("Quantity: ");
                    double qty = double.Parse(Console.ReadLine());
                    Console.Write("Price (USD): ");
                    double price = double.Parse(Console.ReadLine());
                    AddTrade(sym, typ, qty, price);
                }
                else if (cmd == "summary")
                {
                    await ShowSummary();
                }
                else if (cmd == "exit")
                    break;
                else
                    Console.WriteLine("Unknown command.");
            }
        }
    }
}
