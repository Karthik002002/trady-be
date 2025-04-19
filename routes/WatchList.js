import express from "express";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import Watchlist from "../model/WatchList.js";
import { updatePrice } from "../script/watchlistListener.js";
import { Symbol, WatchlistSymbol } from "../model/index.js";
import { logger } from "../Logger.js";

const WatchlistRouter = express.Router();

WatchlistRouter.post("/add", authMiddleware, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    const user = req.user;

    if (!symbol || !name) {
      return res.status(400).json({ error: "Symbol and name are required" });
    }

    // Normalize to array of symbol objects
    const symbolObjects = Array.isArray(symbol) ? symbol : [{ id: symbol }];

    const symbolIds = symbolObjects.map((s) => s.id);

    // 1. Find or create the watchlist
    let watchlist = await Watchlist.findOne({
      where: { user_id: user.id, name },
    });

    if (!watchlist) {
      watchlist = await Watchlist.create({ user_id: user.id, name });
    }

    // 2. Fetch existing links
    const existingLinks = await WatchlistSymbol.findAll({
      where: { watchlist_id: watchlist.id },
    });

    const existingIds = new Set(existingLinks.map((item) => item.symbol_id));

    // 3. Filter only new symbol IDs
    const newSymbolObjects = symbolObjects.filter(
      (s) => !existingIds.has(s.id)
    );

    if (newSymbolObjects.length === 0) {
      return res.status(200).json({
        message: "All symbols already exist in the watchlist",
        watchlist_id: watchlist.id,
        added: [],
      });
    }

    // 4. Validate symbols exist
    const validSymbols = await Symbol.findAll({
      where: { id: newSymbolObjects.map((s) => s.id) },
    });

    const validSymbolMap = new Map(validSymbols.map((s) => [s.id, s]));

    // 5. Create bulk insert data
    const insertData = newSymbolObjects
      .filter((s) => validSymbolMap.has(s.id))
      .map((s) => ({
        watchlist_id: watchlist.id,
        symbol_id: s.id,
        buying_value: s.buy_price || null,
        buy_quantity: s.buy_quantity || null,
      }));

    await WatchlistSymbol.bulkCreate(insertData);

    res.status(201).json({
      message: "Symbols merged into watchlist",
      watchlist_id: watchlist.id,
      added: insertData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

WatchlistRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol } = req.body;
    const user = req.user;

    // 1. Find the watchlist
    let watchlist = await Watchlist.findOne({
      where: { id, user_id: user.id },
    });

    if (!watchlist) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    // 2. Update name if provided
    if (name) {
      watchlist.name = name;
      await watchlist.save();
    }

    if (!symbol) {
      return res.status(200).json({ message: "Watchlist updated", watchlist });
    }

    // Normalize symbol input
    const symbolObjects = Array.isArray(symbol) ? symbol : [{ id: symbol }];
    const symbolIds = symbolObjects.map((s) => s.id);

    // 3. Get existing links
    const existingLinks = await WatchlistSymbol.findAll({
      where: { watchlist_id: watchlist.id },
    });

    const existingMap = new Map();
    for (const link of existingLinks) {
      existingMap.set(link.symbol_id, link);
    }

    const updatedSymbols = [];
    const newSymbols = [];

    for (const s of symbolObjects) {
      if (existingMap.has(s.id)) {
        // Update existing entry
        const link = existingMap.get(s.id);
        link.buying_value = s.buy_price ?? link.buying_value;
        link.buy_quantity = s.buy_quantity ?? link.buy_quantity;
        await link.save();
        updatedSymbols.push(link);
      } else {
        newSymbols.push({
          watchlist_id: watchlist.id,
          symbol_id: s.id,
          buying_value: s.buy_price || null,
          buy_quantity: s.buy_quantity || null,
        });
      }
    }

    // 4. Validate and add new symbols
    if (newSymbols.length > 0) {
      const validSymbols = await Symbol.findAll({
        where: { id: newSymbols.map((s) => s.symbol_id) },
      });

      const validSymbolIds = new Set(validSymbols.map((s) => s.id));
      const toInsert = newSymbols.filter((s) =>
        validSymbolIds.has(s.symbol_id)
      );

      await WatchlistSymbol.bulkCreate(toInsert);
    }

    res.status(200).json({
      message: "Watchlist updated",
      watchlist_id: watchlist.id,
      updated: updatedSymbols,
      added: newSymbols,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    // Optional: update prices
    try {
      const userWatchlist = await Watchlist.findAll({
        where: { user_id: req.user.id },
      });
      await updatePrice(userWatchlist);
    } catch (err) {
      console.error("Error updating prices:", err);
    }
  }
});

// Patch Watchlist Data

WatchlistRouter.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_deleted } = req.body;
    const user = req.user;

    const existing_data = await Watchlist.findOne({
      where: { id, user_id: user.id },
    });

    if (!existing_data) {
      return res.status(404).json({ message: "Watchlist not found." });
    }
    if (name !== undefined) existing_data.name = name;
    if (is_deleted !== undefined) existing_data.is_deleted = is_deleted;

    await existing_data.save();

    return res.status(200).json({
      message: "WatchList updated successfully",
    });
  } catch (error) {}
});

WatchlistRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const entry = await Watchlist.findOne({
      where: { id, user_id: user.id },
    });

    if (!entry) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    // Soft delete by updating `is_deleted` flag
    entry.is_deleted = true;
    await entry.save();

    res.status(200).json({ message: "Watchlist Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// To Delete the Watchlist symbols
// DELETE /:watchlistId/symbol/:symbolId
WatchlistRouter.delete(
  "/:watchlistId/symbol/:symbolId",
  authMiddleware,
  async (req, res) => {
    try {
      const { watchlistId, symbolId } = req.params;
      const user = req.user;

      // Ensure the watchlist belongs to the user
      const watchlist = await Watchlist.findOne({
        where: { id: watchlistId, user_id: user.id },
      });

      if (!watchlist) {
        return res.status(404).json({ error: "Watchlist not found" });
      }

      // Delete the symbol from WatchlistSymbol
      const deleted = await WatchlistSymbol.destroy({
        where: {
          watchlist_id: watchlistId,
          symbol_id: symbolId,
        },
      });

      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Symbol not found in this watchlist" });
      }

      res.status(200).json({ message: "Symbol removed from watchlist" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

WatchlistRouter.get("/:id?", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { time } = req.query;
    const includeTimestamps = time === "true";
    const userId = req.user.id;

    const listAttributes = includeTimestamps
      ? { exclude: ["user_id"] }
      : ["id", "name"];

    const watchlists = await Watchlist.findAll({
      where: id
        ? { id, user_id: userId, is_deleted: false }
        : { user_id: userId, is_deleted: false },
      attributes: listAttributes,
      include: [
        {
          model: Symbol,
          attributes: ["id", "symbol", "price", "updatedAt"],
          through: {
            attributes: ["buying_value", "buy_quantity"], // include buying data
          },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (id && watchlists.length === 0) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    // Add returns
    // const enriched = watchlists.map((list) => {
    //   let totalReturn = 0;

    //   const enrichedSymbols = (list.Symbols || []).map((symbol) => {
    //     const { price } = symbol;
    //     const { buying_value, buy_quantity } = symbol.WatchlistSymbol || {};

    //     let individualReturn = null;

    //     if (price && buying_value && buy_quantity) {
    //       individualReturn = (price - buying_value) * buy_quantity;
    //       totalReturn += individualReturn;
    //     }

    //     return {
    //       ...symbol.toJSON(),
    //       buy_quantity,
    //       buying_value,
    //       return_value: individualReturn,
    //     };
    //   });

    //   return {
    //     ...list.toJSON(),
    //     Symbols: enrichedSymbols,
    //     total_return: totalReturn,
    //   };
    // });

    const enriched = watchlists.map((watchlist) => {
      let totalReturn = 0;

      const updatedSymbols = watchlist.symbols.map((symbol) => {
        const { price } = symbol;
        const { buying_value, buy_quantity } = symbol.WatchlistSymbol;

        const returns =
          price && buying_value && buy_quantity
            ? (price - buying_value) * buy_quantity
            : 0;

        totalReturn += returns;

        return {
          ...symbol.toJSON(),
          returns: +returns.toFixed(2),
        };
      });

      return {
        ...watchlist.toJSON(),
        symbols: updatedSymbols,
        total_return: +totalReturn.toFixed(2),
      };
    });

    logger.info(JSON.stringify(enriched));

    res.status(200).json(id ? enriched[0] : enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export { WatchlistRouter };
