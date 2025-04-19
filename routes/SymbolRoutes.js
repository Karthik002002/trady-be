import express from "express";
import { Symbol } from "../model/index.js";
import yahooFinance from "yahoo-finance2";

const SymbolRouter = express.Router();

// Create Symbol
SymbolRouter.post("/", async (req, res) => {
  try {
    const { symbol } = req.body;
    let quote;
    try {
      quote = await yahooFinance.quote(symbol + ".NS");
    } catch (err) {
      return res.status(400).json({ error: "Invalid stock symbol" });
    }

    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    const exists = await Symbol.findOne({ where: { symbol } });
    if (exists) return res.status(409).json({ error: "Symbol already exists" });

    console.log(quote);

    const price = quote.regularMarketPrice || null;

    const newSymbol = await Symbol.create({ symbol, price });

    res.status(201).json(newSymbol);
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "Server error" });
  }
});

// Read All Symbols
SymbolRouter.get("/", async (req, res) => {
  try {
    const symbols = await Symbol.findAll();
    res.json(symbols);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Read Symbol by ID
SymbolRouter.get("/:id", async (req, res) => {
  try {
    const symbol = await Symbol.findByPk(req.params.id);
    if (!symbol) return res.status(404).json({ error: "Symbol not found" });
    res.json(symbol);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Symbol
SymbolRouter.put("/:id", async (req, res) => {
  try {
    const { symbol } = req.body;
    const existing = await Symbol.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ error: "Symbol not found" });

    existing.symbol = symbol || existing.symbol;
    await existing.save();

    res.json({ message: "Symbol updated", symbol: existing });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Symbol
SymbolRouter.delete("/:id", async (req, res) => {
  try {
    const symbol = await Symbol.findByPk(req.params.id);
    if (!symbol) return res.status(404).json({ error: "Symbol not found" });

    await symbol.destroy();
    res.json({ message: "Symbol deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default SymbolRouter;
