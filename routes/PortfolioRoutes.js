import express from "express";
import { Portfolio, User } from "../model/index.js";
import { authMiddleware } from "../middleware/Autheticatetoken.js";

const PortfolioRouter = express.Router();

PortfolioRouter.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: "Portfolio name is required and must be at least 3 characters.",
      });
    }

    const existing = await Portfolio.findOne({
      where: { user_id: user.id, name: name },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "Portfolio with this name already exists." });
    }

    const portfolio = await Portfolio.create({
      user_id: user.id,
      name: name,
    });
    res.status(201).json(portfolio);
  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ error: "Failed to create portfolio." });
  }
});

PortfolioRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const portfolios = await Portfolio.findAll({
      where: { user_id: user.id },
      // include: [{ model: User, attributes: ["id", "username", "email"] }],
      attributes: { exclude: ["createdAt", "updatedAt", "user_id"] },
      order: [["createdAt", "DESC"]],
    });

    res.json(portfolios);
  } catch (err) {
    console.error("Fetch All Error:", err);
    res.status(500).json({ error: "Failed to fetch portfolios." });
  }
});

PortfolioRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const portfolio = await Portfolio.findOne({
      where: { id: req.params.id, user_id: user.id },
    });

    if (!portfolio)
      return res.status(404).json({ error: "Portfolio not found." });

    res.json(portfolio);
  } catch (err) {
    console.error("Fetch By ID Error:", err);
    res.status(500).json({ error: "Failed to fetch portfolio." });
  }
});

PortfolioRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: "Portfolio name is required and must be at least 3 characters.",
      });
    }

    const existing = await Portfolio.findOne({
      where: { user_id: user.id, name: name.trim() },
    });

    if (existing && existing.id !== parseInt(req.params.id)) {
      return res
        .status(409)
        .json({ error: "Another portfolio with this name already exists." });
    }

    const [updated] = await Portfolio.update(
      { name: name.trim() },
      { where: { id: req.params.id, user_id: user.id } }
    );

    if (updated === 0)
      return res
        .status(404)
        .json({ error: "Portfolio not found or not owned by user." });

    res.json({ message: "Portfolio updated successfully." });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Failed to update portfolio." });
  }
});

PortfolioRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const deleted = await Portfolio.destroy({
      where: { id: req.params.id, user_id: user.id },
    });

    if (!deleted)
      return res
        .status(404)
        .json({ error: "Portfolio not found or not owned by user." });

    res.json({ message: "Portfolio deleted successfully." });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Failed to delete portfolio." });
  }
});

export { PortfolioRouter };
