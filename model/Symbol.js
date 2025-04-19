import { DataTypes } from "sequelize";
import { sequelize } from "../db/Config.js";

const Symbol = sequelize.define(
  "symbol",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symbol: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true, // or false if always required
    },
  },
  {
    timestamps: true,
  }
);

export default Symbol;
