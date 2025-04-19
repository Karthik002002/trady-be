import e from "express";
import { Portfolio, Holdings, Symbol } from "../model/index.js";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
const HoldingsRouter = e.Router();

// ➕ Add holding using symbol from Price only
HoldingsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { portfolio_id, symbol, quantity } = req.body;
    const user = req.user;

    if (!symbol || !quantity)
      return res
        .status(400)
        .json({ error: "Symbol and quantity are required." });

    // Check portfolio belongs to user
    const portfolio = await Portfolio.findOne({
      where: { id: portfolio_id, user_id: user.id },
    });
    if (!portfolio)
      return res.status(403).json({ error: "Unauthorized portfolio access." });

    // Get symbol and price from Price
    const priceData = await Symbol.findOne({ where: { symbol } });
    if (!priceData)
      return res.status(400).json({ error: "Symbol not found." });

    const holding = await Holdings.create({
      portfolio_id,
      symbol: priceData.symbol,
      quantity,
      avg_price: priceData.price,
    });

    res.status(201).json(holding);
  } catch (err) {
    console.error("Add Holding Error:", err);
    res.status(500).json({ error: "Failed to add holding." });
  }
});

// 🔄 Update holding (only quantity, price updated from Price)
HoldingsRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = req.user;

    const holding = await Holdings.findByPk(req.params.id);
    if (!holding) return res.status(404).json({ error: "Holding not found." });

    // Check portfolio ownership
    const portfolio = await Portfolio.findOne({
      where: { id: holding.portfolio_id, user_id: user.id },
    });
    if (!portfolio)
      return res.status(403).json({ error: "Unauthorized portfolio access." });

    // Get latest price for the existing symbol
    const priceData = await Symbol.findOne({
      where: { symbol: holding.symbol },
    });
    if (!priceData)
      return res.status(400).json({ error: "Symbol not found" });

    await holding.update({
      quantity,
      avg_price: priceData.price,
    });

    res.json({ message: "Holding updated successfully.", holding });
  } catch (err) {
    console.error("Update Holding Error:", err);
    res.status(500).json({ error: "Failed to update holding." });
  }
});

HoldingsRouter.get("/portfolio-summary", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // Get all portfolios for user
    const portfolios = await Portfolio.findAll({
      where: { user_id: user.id },
    });

    const summary = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Get all holdings in this portfolio
        const holdings = await Holdings.findAll({
          where: { portfolio_id: portfolio.id },
        });

        // Get all symbols and fetch current prices
        const symbols = holdings.map((h) => h.symbol);
        const prices = await Symbol.findAll({
          where: { symbol: symbols },
        });

        const priceMap = {};
        prices.forEach((p) => {
          priceMap[p.symbol] = p.price;
        });

        // Enrich holdings and calculate total value
        let totalValue = 0;
        const enrichedHoldings = holdings.map((h) => {
          const currentPrice = priceMap[h.symbol] || 0;
          const value = h.quantity * currentPrice;
          totalValue += value;

          return {
            id: h.id,
            symbol: h.symbol,
            quantity: h.quantity,
            avg_price: h.avg_price,
            current_price: currentPrice,
            value,
          };
        });

        return {
          portfolio_id: portfolio.id,
          portfolio_name: portfolio.name,
          total_value: totalValue,
          holdings: enrichedHoldings,
        };
      })
    );

    res.json(summary);
  } catch (err) {
    console.error("Portfolio Summary Error:", err);
    res.status(500).json({ error: "Failed to fetch portfolio summary." });
  }
});
export { HoldingsRouter };
