import e from "express";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import { Journal, Trade } from "../model/index.js";
import { Op } from "sequelize";

const JournalRouter = e.Router();

JournalRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, type } = req.body;
    const user_id = req.user.id;

    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required" });
    }

    // Check if journal with same title and type exists for this user
    const existingJournal = await Journal.findOne({
      where: { user_id, title, type },
    });

    if (existingJournal) {
      return res.status(400).json({
        message: "A journal with the same title and type already exists.",
      });
    }

    const journal = await Journal.create({ title, type, user_id });
    res.status(201).json(journal);
  } catch (error) {
    console.error("POST /journal error:", error);
    res.status(500).json({ error: "Failed to create journal" });
  }
});

// ✏️ Partial update (title, type, isDeleted)
JournalRouter.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, isDeleted } = req.body;
    const user_id = req.user.id;

    const journal = await Journal.findOne({ where: { id, user_id } });
    if (!journal) return res.status(404).json({ error: "Journal not found" });

    if (
      (title !== undefined && title !== journal.title) ||
      (type !== undefined && type !== journal.type)
    ) {
      const existingJournal = await Journal.findOne({
        where: { user_id, title, type, id: { [Op.ne]: id } },
      });

      if (existingJournal) {
        return res.status(400).json({
          message: "A journal with the same title and type already exists.",
        });
      }
    }
    // Check if a journal with the same title and type already exists for this user
    const existingJournal = await Journal.findOne({
      where: { user_id, title, type, id: { [Op.ne]: id } }, // Exclude the current journal by id
    });

    if (existingJournal) {
      return res.status(400).json({
        message: "A journal with the same title and type already exists.",
      });
    }

    // Update the journal fields if they are provided
    if (title !== undefined) journal.title = title;
    if (type !== undefined) journal.type = type;
    if (isDeleted !== undefined) journal.isDeleted = isDeleted;

    await journal.save();
    res.json(journal);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to update journal" });
  }
});

// ❌ Soft delete (set isDeleted: true)
JournalRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const journal = await Journal.findOne({ where: { id, user_id } });
    if (!journal) return res.status(404).json({ error: "Journal not found" });

    journal.isDeleted = true;
    await journal.destroy();

    res.json({ message: "Journal soft-deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete journal" });
  }
});

JournalRouter.get("/with-trades", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const journalType = req.query.type;
    const today = req.query.today;
    const dateParam = req.query.date;

    const where = {
      user_id,
      isDeleted: false,
    };

    const tradeWhere = {
      user_id,
    };

    if (journalType) {
      where.type = journalType;
    }
    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      tradeWhere.updatedAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    if (dateParam) {
      const date = new Date(dateParam);
      const startDate = new Date(date.setHours(0, 0, 0, 0));
      const endDate = new Date(date.setHours(23, 59, 59, 999));

      tradeWhere.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }
    const BASE_URL = process.env.BASE_URL || "http://localhost:5001";
    const journals = await Journal.findAll({
      where,
      attributes: { exclude: ["user_id", "isDeleted", "createdAt"] },
      order: [["updatedAt", "DESC"]],
      include: [
        {
          model: Trade,
          as: "trades",
          where: tradeWhere,
          required: false,
          attributes: { exclude: ["user_id", "createdAt"] },
          order: [["trade_date", "DESC"]],
        },
      ],
    });
    journals.forEach((journal) => {
      journal.trades?.forEach((trade) => {
        if (trade.photo) {
          trade.photo = `${BASE_URL}/${trade.photo}`;
        }
      });
    });
    const enrichedJournals = journals.map((journal) => {
      const trades = journal.trades || [];

      let totalPL = 0;
      let winCount = 0;
      let totalReturn = 0;
      let tradeCount = trades.length;

      let winTrades = 0;
      let lossTrades = 0;
      let neutralTrades = 0;

      for (const trade of trades) {
        const pl = trade.pl || 0;
        const ret = trade.pl || 0;

        totalPL += pl;
        totalReturn += ret;

        if (pl > 0) winCount++;

        switch (trade.outcome) {
          case "win":
            winTrades++;
            break;
          case "loss":
            lossTrades++;
            break;
          case "neutral":
            neutralTrades++;
            break;
        }
      }

      const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
      const avgReturn = tradeCount > 0 ? totalReturn / tradeCount : 0;

      return {
        ...journal.toJSON(),
        total_pl: totalPL,
        win_rate: parseFloat(winRate.toFixed(2)),
        avg_return: parseFloat(avgReturn.toFixed(2)),
        // Optional: return individual counts if needed
        win_trades: winTrades,
        loss_trades: lossTrades,
        neutral_trades: neutralTrades,
      };
    });

    res.json(enrichedJournals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch journals with trades" });
  }
});
// 📦 Get all journals (non-deleted) or one by ID
JournalRouter.get("/:id?", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const journalType = req.query.type;

    const where = {
      user_id,
      isDeleted: false,
    };

    if (id) {
      const journal = await Journal.findOne({
        where: { id, ...where },
        attributes: { exclude: ["isDeleted", "user_id", "createdAt"] },
      });
      if (!journal) return res.status(404).json({ error: "Journal not found" });
      return res.json(journal);
    }

    if (journalType) {
      where.type = journalType;
    }

    const journals = await Journal.findAll({
      where,
      attributes: { exclude: ["isDeleted", "user_id", "createdAt"] },
      order: [["updatedAt", "DESC"]],
    });

    res.json(journals);
  } catch (error) {
    console.error("Journal fetch error:", error);
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

export { JournalRouter };
