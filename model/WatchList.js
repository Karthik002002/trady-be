import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";

const Watchlist = sequelize.define(
  "Watchlist",
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
    name: { type: DataTypes.STRING, allowNull: false },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },

  {
    timestamps: true,
  }
);

export default Watchlist;
