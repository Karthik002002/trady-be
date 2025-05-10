// models/Goal.js
import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import Trade from "./Trades.js";

const Goal = sequelize.define(
  "goal",
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
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    reached: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    percent: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0, // e.g., 75 means 75%
    },
  },
  {
    timestamps: true,
  }
);

// Hook: beforeSave (applies to both create and update)
Goal.beforeSave(async (goal, options) => {
  const trades = await Trade.findAll({
    where: { journal_id: goal.journal_id },
  });

  const totalPL = trades.reduce((acc, trade) => acc + trade.pl, 0);

  if (goal.goal && goal.goal !== 0) {
    goal.percent = Math.min((totalPL / goal.goal) * 100, 100).toFixed(2);
    goal.reached = totalPL >= goal.goal;
  } else {
    goal.percent = 0;
    goal.reached = false;
  }
});

export default Goal;
