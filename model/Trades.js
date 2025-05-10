// models/Trade.js

import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";

const Trade = sequelize.define(
  "trade",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    journal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "journals", key: "id" },
    },
    portfolio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    strategy_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    symbol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "symbols", key: "id" },
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
    },
    trade_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fees: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    confidence_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },

    entry_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    exit_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    outcome: {
      type: DataTypes.ENUM("win", "loss", "neutral"),
      allowNull: false,
    },
    entry_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    exit_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    pl: {
      type: DataTypes.FLOAT,
      allowNull: true, // will be auto-calculated
    },
  },
  {
    timestamps: true,
  }
);

Trade.beforeSave((trade, options) => {
  const { entry_price, exit_price, quantity, type, fees = 0 } = trade;

  if (entry_price != null && exit_price != null && quantity != null) {
    let profit = 0;

    if (type === "buy") {
      profit = (exit_price - entry_price) * quantity;
    } else if (type === "sell") {
      profit = (entry_price - exit_price) * quantity;
    }

    trade.pl = profit - fees;
  }
});

// Strategy.hasMany(Trade, { foreignKey: "strategy_id", as: "trades" });
// Trade.belongsTo(Strategy, { foreignKey: "strategy_id", as: "strategy" });

export default Trade;
