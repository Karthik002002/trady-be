import express from "express";
import User from "../model/UserModel.js";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import { Token } from "../model/TokenModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Strategy from "../model/Strategies.js";
import { Op } from "sequelize";

const StrategyRouter = express.Router();

StrategyRouter.post("/add", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are mandatory." });
    }

    const user = req.user; // Assuming authMiddleware sets `req.user`

    if (!user) {
      return res.status(401).json({ error: "Unauthorized user." });
    }

    // Check if strategy already exists for the current user
    const existingStrategy = await Strategy.findOne({
      where: {
        user_id: user.id,
        name: name,
      },
    });

    if (existingStrategy) {
      return res.status(400).json({ error: "Strategy already exists." });
    }

    // Create new strategy
    const newStrategy = await Strategy.create({
      user_id: user.id,
      name,
      description,
    });

    res.status(201).json({
      message: "Strategy created successfully.",
      strategy: newStrategy,
    });
  } catch (error) {
    console.error("Error creating strategy:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

StrategyRouter.get("/list", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized user." });
    }

    const strategies = await Strategy.findAll({
      where: {
        [Op.or]: [
          { user_id: user.id }, // User's personal strategies
          { user_id: null }, // Global strategies
        ],
      },
      attributes: { exclude: ["user_id"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(strategies);
  } catch (error) {
    console.error("Error fetching strategies:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

StrategyRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const user = req.user;

    const strategy = await Strategy.findOne({
      where: {
        id,
        user_id: user.id, // Only allow updating strategies owned by the user
      },
    });

    if (!strategy) {
      return res
        .status(404)
        .json({ error: "Strategy not found or not authorized." });
    }

    strategy.name = name || strategy.name;
    strategy.description = description || strategy.description;
    await strategy.save();

    res
      .status(200)
      .json({ message: "Strategy updated successfully.", strategy });
  } catch (error) {
    console.error("Error updating strategy:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

StrategyRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const strategy = await Strategy.findOne({
      where: {
        id,
        user_id: user.id, // Only allow deleting strategies owned by the user
      },
    });

    if (!strategy) {
      return res
        .status(404)
        .json({ error: "Strategy not found or not authorized." });
    }

    await strategy.destroy();

    res.status(200).json({ message: "Strategy deleted successfully." });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export { StrategyRouter };
