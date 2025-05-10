import e from "express";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import { Trade, TradeExecution } from "../model/index.js";

const TradeExecutionRouter = e.Router();

// CREATE - Add a new trade execution
TradeExecutionRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      symbol_id,
      strategy_id,
      entry,
      exit,
      quantity,
      commission_percent,
      target,
    } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (
      symbol_id == null ||
      entry == null ||
      exit == null ||
      quantity == null ||
      target == null ||
      strategy_id == null ||
      commission_percent == null
    ) {
      return res.status(400).json({
        error:
          "symbol_id, strategy_id, entry, exit, quantity, commission_percent and target  are required.",
      });
    }

    // Create trade
    const trade = await TradeExecution.create({ ...req.body, user_id });

    // Convert decimal strings to floats in the response
    const decimalFields = [
      "entry",
      "exit",
      "target",
      "risk_percent",
      "reward_percent",
      "rr_ratio",
      "traded_value",
      "exit_on_sl",
      "confidence_level",
      "exit_on_target",
      "margin_amount",
      "margin_type",
      "margin_risk_percent",
      "margin_reward_percent",
      "commission_percent",
    ];

    const tradeData = trade.get();
    const parsedTrade = { ...tradeData };

    for (const key of decimalFields) {
      if (parsedTrade[key] != null) {
        parsedTrade[key] = parseFloat(parsedTrade[key]);
      }
    }

    res.status(201).json(parsedTrade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ ALL - Get all trade executions (with optional filters)
TradeExecutionRouter.get("/:id?", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    if (id) {
      const trade = await TradeExecution.findByPk(id);
      if (!trade) return res.status(404).json({ error: "Trade not found" });
      if (trade.user_id !== user_id)
        return res.status(403).json({ error: "Unauthorized" });

      return res.json(trade);
    } else {
      const trades = await TradeExecution.findAll({
        where: { user_id },
        order: [["createdAt", "DESC"]],
      });
      return res.json(trades);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Update a trade execution by ID
TradeExecutionRouter.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      symbol_id,
      strategy_id,
      entry,
      exit,
      quantity,
      commission_percent,
      target,
    } = req.body;
    
    if (
      symbol_id == null ||
      entry == null ||
      exit == null ||
      quantity == null ||
      target == null ||
      strategy_id == null ||
      commission_percent == null
    ) {
      return res.status(400).json({
        error:
          "symbol_id, strategy_id, entry, exit, quantity, commission_percent and target  are required.",
      });
    }

    const trade = await TradeExecution.findByPk(req.params.id);

    if (!trade) return res.status(404).json({ error: "Trade not found" });
    if (trade.user_id !== user_id)
      return res.status(403).json({ error: "Unauthorized" });

    trade.set(req.body); // Set new values
    await trade.save();
    res.json(trade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - Delete a trade execution by ID
TradeExecutionRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const trade = await TradeExecution.findByPk(req.params.id);

    if (!trade) return res.status(404).json({ error: "Trade not found" });
    if (trade.user_id !== user_id)
      return res.status(403).json({ error: "Unauthorized" });

    await trade.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

TradeExecutionRouter.post(
  "/convert-to-execution/:id",
  authMiddleware,
  async (req, res) => {
    const { executionId } = req.params;

    try {
      const execution = await TradeExecution.findByPk(executionId);

      if (!execution) {
        return res.status(404).json({ error: "TradeExecution not found" });
      }

      // Create Trade using mapped fields
      const newTrade = await Trade.create({
        user_id: execution.user_id,
        symbol_id: execution.symbol_id,
        quantity: execution.quantity,
        type: execution.type,
        // trade_date: execution.execution_time,
        entry_price: execution.entry_price,
        exit_price: execution.exit_price || execution.entry_price,
        fees: null,
        entry_reason: null,
        exit_reason: null,
        outcome: execution.outcome || "neutral",
        confidence_level: execution.confidence_level || 5,
        notes: execution.notes,
        photo: execution.photo,
        strategy_id: execution.strategy_id || null,
      });

      res.status(201).json({
        message: "Trade created from TradeExecution",
        trade: newTrade,
      });
    } catch (err) {
      console.error("Conversion error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
TradeExecutionRouter.post("/calculate/", authMiddleware, async (req, res) => {
  try {
    const {
      entry,
      target,
      exit,
      quantity,
      commission_percent = 0,
      trade_type = "buy",
      margin_type,
    } = req.body;

    if (!entry || !target || !quantity || !trade_type) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const entryVal = parseFloat(entry);
    const targetVal = parseFloat(target);
    const exitVal = exit ? parseFloat(exit) : null;
    const qty = parseInt(quantity, 10);
    const commissionPercent = parseFloat(commission_percent);

    const risk =
      trade_type === "buy"
        ? entryVal - (exitVal || 0)
        : (exitVal || 0) - entryVal;
    const reward =
      trade_type === "buy" ? targetVal - entryVal : entryVal - targetVal;

    const tradedValue = entryVal * qty;
    const commission = tradedValue * 2 * (commissionPercent / 100);

    const risk_percent =
      risk !== 0 ? -parseFloat(((risk / entryVal) * 100).toFixed(2)) : null;
    const reward_percent =
      reward !== 0 ? parseFloat(((reward / entryVal) * 100).toFixed(2)) : null;
    const rr_ratio = risk !== 0 ? parseFloat((reward / risk).toFixed(2)) : null;

    let exit_on_sl = qty * risk;
    let exit_on_target = qty * reward;

    exit_on_sl =
      exit_on_sl <= 0 ? exit_on_sl - commission : exit_on_sl + commission;
    exit_on_target =
      exit_on_target >= 0
        ? exit_on_target - commission
        : exit_on_target + commission;

    let margin_amount = margin_type
      ? tradedValue / parseFloat(margin_type)
      : tradedValue;
    let margin_risk_percent = null;
    let margin_reward_percent = null;

    if (margin_amount > 0) {
      margin_risk_percent = parseFloat(
        ((exit_on_sl / margin_amount) * 100).toFixed(2)
      );
      margin_reward_percent = parseFloat(
        ((exit_on_target / margin_amount) * 100).toFixed(2)
      );
    }

    return res.json({
      risk_percent,
      reward_percent,
      rr_ratio,
      traded_value: parseFloat(tradedValue.toFixed(2)),
      exit_on_sl: parseFloat(exit_on_sl.toFixed(2)),
      exit_on_target: parseFloat(exit_on_target.toFixed(2)),
      margin_amount: parseFloat(margin_amount.toFixed(2)),
      margin_risk_percent,
      margin_reward_percent,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Calculation error", details: error.message });
  }
});

// controllers/TradePreviewController.js

export const calculateTradePreview = (req, res) => {
  try {
    const {
      entry,
      target,
      exit,
      quantity,
      commission_percent = 0,
      trade_type = "buy",
      margin_type,
    } = req.body;

    if (!entry || !target || !quantity || !trade_type) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const entryVal = parseFloat(entry);
    const targetVal = parseFloat(target);
    const exitVal = exit ? parseFloat(exit) : null;
    const qty = parseInt(quantity, 10);
    const commissionPercent = parseFloat(commission_percent);

    const risk =
      trade_type === "buy"
        ? entryVal - (exitVal || 0)
        : (exitVal || 0) - entryVal;
    const reward =
      trade_type === "buy" ? targetVal - entryVal : entryVal - targetVal;

    const tradedValue = entryVal * qty;
    const commission = tradedValue * 2 * (commissionPercent / 100);

    const risk_percent =
      risk !== 0 ? -parseFloat(((risk / entryVal) * 100).toFixed(2)) : null;
    const reward_percent =
      reward !== 0 ? parseFloat(((reward / entryVal) * 100).toFixed(2)) : null;
    const rr_ratio = risk !== 0 ? parseFloat((reward / risk).toFixed(2)) : null;

    let exit_on_sl = qty * risk;
    let exit_on_target = qty * reward;

    exit_on_sl =
      exit_on_sl <= 0 ? exit_on_sl - commission : exit_on_sl + commission;
    exit_on_target =
      exit_on_target >= 0
        ? exit_on_target - commission
        : exit_on_target + commission;

    let margin_amount = margin_type
      ? tradedValue / parseFloat(margin_type)
      : tradedValue;
    let margin_risk_percent = null;
    let margin_reward_percent = null;

    if (margin_amount > 0) {
      margin_risk_percent = parseFloat(
        ((exit_on_sl / margin_amount) * 100).toFixed(2)
      );
      margin_reward_percent = parseFloat(
        ((exit_on_target / margin_amount) * 100).toFixed(2)
      );
    }

    return res.json({
      risk_percent,
      reward_percent,
      rr_ratio,
      traded_value: parseFloat(tradedValue.toFixed(2)),
      exit_on_sl: parseFloat(exit_on_sl.toFixed(2)),
      exit_on_target: parseFloat(exit_on_target.toFixed(2)),
      margin_amount: parseFloat(margin_amount.toFixed(2)),
      margin_risk_percent,
      margin_reward_percent,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Calculation error", details: error.message });
  }
};

export default TradeExecutionRouter;
