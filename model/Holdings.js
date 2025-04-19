import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import Portfolio from "./Portfolio.js";

const Holdings = sequelize.define(
  "holdings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    portfolio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Portfolio, key: "id" },
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
    avg_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    current_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["portfolio_id"],
      },
    ],
  }
);

export default Holdings;
