import e from "express";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import { Journal, Trade } from "../model/index.js";
import { Op } from "sequelize";

const JournalRouter = e.Router();

JournalRouter.post("/add", authMiddleware, async (req, res) => {
  try {
    const { title, type } = req.body;
    const user_id = req.user.id;

    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required" });
    }

    const journal = await Journal.create({ title, type, user_id });
    res.status(201).json(journal);
  } catch (error) {
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
    await journal.save();

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
    console.log(where, today);

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
    const enrichedJournals = journals.map((journal) => {
      const trades = journal.trades || [];

      const totalPL = trades.reduce((sum, t) => sum + (t.pl || 0), 0);
      const winCount = trades.filter((t) => t.pl > 0).length;
      const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;
      const avgReturn =
        trades.length > 0
          ? trades.reduce((sum, t) => sum + (t.return_percent || 0), 0) /
            trades.length
          : 0;

      return {
        ...journal.toJSON(),
        total_pl: totalPL,
        win_rate: parseFloat(winRate.toFixed(2)),
        avg_return: parseFloat(avgReturn.toFixed(2)),
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
    const { id, type } = req.params;

    if (id) {
      const journal = await Journal.findOne({
        where: { id, user_id, isDeleted: false },
        attributes: { exclude: ["isDeleted", "user_id", "createdAt"] },
      });
      if (!journal) return res.status(404).json({ error: "Journal not found" });
      return res.json(journal);
    }

    const journals = await Journal.findAll({
      where: { user_id, isDeleted: false },
      attributes: { exclude: ["isDeleted", "user_id", "createdAt"] },
      order: [["updatedAt", "DESC"]],
    });

    res.json(journals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

export { JournalRouter };
