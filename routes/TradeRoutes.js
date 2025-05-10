import e from "express";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import path from "path";
import { Journal, Portfolio, Strategy, Symbol, Trade } from "../model/index.js";
import multer from "multer";
import fs from "fs";

const TradeRouter = e.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "trade_uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

TradeRouter.post(
  "/add",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const {
        journal_id,
        portfolio_id,
        strategy_id,
        symbol_id,
        quantity,
        entry_price,
        exit_price,
        price,
        type,
        trade_date,
        fees,
        confidence_level,
        entry_reason,
        exit_reason,
        notes,
        outcome,
      } = req.body;
      const user_id = req.user.id;

      const photo = req.file ? req.file.path : null;

      // Validate required fields
      if (
        !strategy_id ||
        !symbol_id ||
        !quantity ||
        !type ||
        !entry_reason ||
        !exit_reason ||
        !outcome ||
        !entry_price ||
        !exit_price
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate related IDs
      const [strategy, symbol, journal, portfolio] = await Promise.all([
        Strategy.findByPk(strategy_id),
        Symbol.findByPk(symbol_id),
        journal_id
          ? Journal.findOne({ where: { id: journal_id, user_id } })
          : Promise.resolve(null),
        portfolio_id
          ? Portfolio.findOne({ where: { id: portfolio_id, user_id } })
          : Promise.resolve(null),
      ]);

      if (!strategy)
        return res.status(400).json({ error: "Invalid strategy_id" });
      if (!symbol) return res.status(400).json({ error: "Invalid symbol_id" });
      if (journal_id && !journal)
        return res.status(400).json({ error: "Invalid journal_id" });
      if (portfolio_id && !portfolio)
        return res.status(400).json({ error: "Invalid portfolio_id" });

      // Create trade
      const tradeData = {
        user_id: Number(user_id),
        journal_id: journal_id ? Number(journal_id) : null,
        portfolio_id: portfolio_id ? Number(portfolio_id) : null,
        strategy_id: Number(strategy_id),
        symbol_id: Number(symbol_id),
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        entry_price: parseFloat(entry_price),
        exit_price: parseFloat(exit_price),
        type, // assuming it's either "buy" or "sell"
        trade_date: trade_date && !isNaN(new Date(trade_date)) ? new Date(trade_date) : new Date(),

        fees: fees ? parseFloat(fees) : 0,
        confidence_level: confidence_level ? Number(confidence_level) : null,
        entry_reason,
        exit_reason,
        outcome,
        notes,
      };

      // Only add photo if it exists
      if (photo) {
        tradeData.photo = photo;
      }

      // Create trade
      const trade = await Trade.create(tradeData);

      res.status(201).json(trade);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create trade" });
    }
  }
);

TradeRouter.patch(
  "/:id",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const {
        journal_id,
        portfolio_id,
        strategy_id,
        symbol_id,
        quantity,
        price,
        type,
        trade_date,
        fees,
        confidence_level,
        entry_reason,
        exit_reason,
        outcome,
        remove_photo,
        photo,
        notes,
      } = req.body;

      const trade = await Trade.findOne({ where: { id, user_id } });
      if (!trade) return res.status(404).json({ error: "Trade not found" });

      // Validate related foreign keys if present
      const [strategy, symbol, journal, portfolio] = await Promise.all([
        strategy_id ? Strategy.findByPk(strategy_id) : Promise.resolve(true),
        symbol_id ? Symbol.findByPk(symbol_id) : Promise.resolve(true),
        journal_id
          ? Journal.findOne({ where: { id: journal_id, user_id } })
          : Promise.resolve(true),
        portfolio_id
          ? Portfolio.findOne({ where: { id: portfolio_id, user_id } })
          : Promise.resolve(true),
      ]);

      if (!strategy)
        return res.status(400).json({ error: "Invalid strategy_id" });
      if (!symbol) return res.status(400).json({ error: "Invalid symbol_id" });
      if (journal_id && !journal)
        return res.status(400).json({ error: "Invalid journal_id" });
      if (portfolio_id && !portfolio)
        return res.status(400).json({ error: "Invalid portfolio_id" });

      if (req.file) {
        // Delete old photo if it exists
        if (trade.photo) {
          const oldPath = path.join(process.cwd(), trade.photo);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        trade.photo = req.file.path;
      }

      // Delete existing photo if removePhoto flag is true
      if (remove_photo === "true" && trade.photo) {
        const oldPath = path.join(process.cwd(), trade.photo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
        trade.photo = null;
      }
      // Update fields if they are provided
      if (journal_id !== undefined) {
        const parsedJournalId = parseInt(journal_id, 10);
        if (isNaN(parsedJournalId)) {
          return res
            .status(400)
            .json({ error: "Invalid journal_id. It should be a number." });
        }
        trade.journal_id = parsedJournalId;
      }

      if (portfolio_id !== undefined) {
        const parsedPortfolioId = parseInt(portfolio_id, 10);
        if (isNaN(parsedPortfolioId)) {
          return res
            .status(400)
            .json({ error: "Invalid portfolio_id. It should be a number." });
        }
        trade.portfolio_id = parsedPortfolioId;
      }

      if (strategy_id !== undefined) {
        const parsedStrategyId = parseInt(strategy_id, 10);
        if (isNaN(parsedStrategyId)) {
          return res
            .status(400)
            .json({ error: "Invalid strategy_id. It should be a number." });
        }
        trade.strategy_id = parsedStrategyId;
      }

      if (symbol_id !== undefined) {
        const parsedSymbolId = parseInt(symbol_id, 10);
        if (isNaN(parsedSymbolId)) {
          return res
            .status(400)
            .json({ error: "Invalid symbol_id. It should be a number." });
        }
        trade.symbol_id = parsedSymbolId;
      }
      if (quantity !== undefined) trade.quantity = quantity;
      if (price !== undefined) trade.price = price;
      if (type !== undefined) trade.type = type;
      if (trade_date !== undefined) trade.trade_date = trade_date;
      if (fees !== undefined) trade.fees = fees;
      if (confidence_level !== undefined)
        trade.confidence_level = confidence_level;
      if (entry_reason !== undefined) trade.entry_reason = entry_reason;
      if (exit_reason !== undefined) trade.exit_reason = exit_reason;
      if (outcome !== undefined) trade.outcome = outcome;
      if (notes !== undefined) trade.notes = notes;
      if (photo) trade.photo = photo;

      await trade.save();

      // Format photo path to full URL
      const host = req.protocol + "://" + req.get("host");
      const tradeData = trade.toJSON();
      if (tradeData.photo) {
        tradeData.photo = `${host}/${tradeData.photo.replace(/\\/g, "/")}`;
      }

      res.json(tradeData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update trade" });
    }
  }
);

TradeRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const count = parseInt(req.query.count) || 10;
    const journalType = req.query.journal_type;
    const offset = (page - 1) * count;
    const journalWhere = { isDeleted: false };

    if (journalType !== undefined) {
      journalWhere.type = journalType;
    }

    const { rows: trades, count: total } = await Trade.findAndCountAll({
      where: { user_id },
      attributes: { exclude: ["user_id", "createdAt"] },
      order: [["trade_date", "DESC"]],
      limit: count,
      offset,
      include: [
        {
          model: Journal,
          as: "journal",
          where: journalWhere,
          required: true,
        },
      ],
    });

    const host = req.protocol + "://" + req.get("host");
    const baseUrl = `${host}${req.baseUrl}${req.path}`;

    const totalPages = Math.ceil(total / count);

    const formattedTrades = trades.map((trade) => {
      const tradeData = trade.toJSON();
      if (tradeData.photo) {
        tradeData.photo = `${host}/${tradeData.photo.replace(/\\/g, "/")}`;
      }
      return tradeData;
    });

    res.json({
      page,
      count,
      totalPages,
      totalItems: total,
      nextPage:
        page < totalPages ? `${baseUrl}?page=${page + 1}&count=${count}` : null,
      previousPage:
        page > 1 ? `${baseUrl}?page=${page - 1}&count=${count}` : null,
      trades: formattedTrades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

TradeRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const trade = await Trade.findOne({ where: { id, user_id } });
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    await trade.destroy();
    res.json({ message: "Trade deleted successfully" });
  } catch (error) {
    console.error("Delete trade error:", error);
    res.status(500).json({ error: "Failed to delete trade" });
  }
});

export { TradeRouter };
