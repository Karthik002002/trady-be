// models/Journal.js
import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";

const Journal = sequelize.define(
  "journal",
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
    title: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., "May 2025"
    },
    type: {
      type: DataTypes.ENUM("real", "test"),
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Journal;
