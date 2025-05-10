import express from "express";
import Goal from "../model/Goals.js";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import Journal from "../model/Journal.js";

import Trade from "../model/Trades.js";

const GoalRouter = express.Router();

// 📌 Create Goal
// 📌 Create Goal with validation
GoalRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { journal_id, title, goal } = req.body;

    // Validation
    if (
      journal_id === undefined ||
      title === undefined ||
      goal === undefined ||
      journal_id === null ||
      title === null ||
      goal === null ||
      title.trim() === ""
    ) {
      return res.status(400).json({
        message: "journal_id, title, and goal are mandatory fields",
      });
    }

    // Optional: validate goal is a number
    if (isNaN(goal)) {
      return res.status(400).json({ message: "goal must be a valid number" });
    }

    const newGoal = await Goal.create({
      user_id: req.user.id,
      journal_id,
      title: title.trim(),
      goal,
    });

    res.status(201).json(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ message: "Failed to create goal" });
  }
});

// 📌 Get All Goals (optionally filter by user_id or journal_id)
GoalRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.user.id) where.user_id = req.user.id;
    if (req.query.journal_id) where.journal_id = req.query.journal_id;

    const goals = await Goal.findAll({ where });

    const goalsWithCurrent = await Promise.all(
      goals.map(async (goal) => {
        const trades = await Trade.findAll({
          where: { journal_id: goal.journal_id, user_id: req.user.id },
        });

        const totalPL = trades.reduce((acc, trade) => acc + trade.pl, 0);

        return {
          ...goal.toJSON(),
          current: totalPL, // Add current P&L to the response
        };
      })
    );

    res.status(200).json(goalsWithCurrent);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
});

// 📌 Get Single Goal by ID
GoalRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);

    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.status(200).json(goal);
  } catch (error) {
    console.error("Error fetching goal:", error);
    res.status(500).json({ message: "Failed to fetch goal" });
  }
});

// 📌 Update Goal
GoalRouter.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const goalData = await Goal.findByPk(req.params.id);
    if (!goalData) return res.status(404).json({ message: "Goal not found" });

    const updateFields = {};

    // Only update if present in body
    if (req.body.journal_id !== undefined)
      updateFields.journal_id = req.body.journal_id;
    if (req.body.title !== undefined && req.body.title.trim() !== "")
      updateFields.title = req.body.title.trim();
    if (req.body.goal !== undefined) {
      if (isNaN(req.body.goal)) {
        return res.status(400).json({ message: "goal must be a valid number" });
      }
      updateFields.goal = req.body.goal;
    }

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    await goalData.update(updateFields);
    res.status(200).json(goalData);
  } catch (error) {
    console.error("Error updating goal:", error);
    res.status(500).json({ message: "Failed to update goal" });
  }
});

// 📌 Delete Goal
GoalRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    await goal.destroy();
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ message: "Failed to delete goal" });
  }
});

export default GoalRouter;
