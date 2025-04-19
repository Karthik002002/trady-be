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
    price: {
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
      type: DataTypes.STRING, // Will store the file path or URL
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
  },
  {
    timestamps: true,
  }
);

// Strategy.hasMany(Trade, { foreignKey: "strategy_id", as: "trades" });
// Trade.belongsTo(Strategy, { foreignKey: "strategy_id", as: "strategy" });

export default Trade;
