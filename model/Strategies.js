import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import User from "./UserModel.js";

const Strategy = sequelize.define(
  "strategy",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// User.hasMany(Strategy, { foreignKey: "user_id" });
// Strategy.belongsTo(User, { foreignKey: "user_id" });

export default Strategy;
