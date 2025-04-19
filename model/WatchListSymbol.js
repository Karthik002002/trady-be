import { DataTypes } from "sequelize";
import { sequelize } from "../db/Config.js";

const WatchlistSymbol = sequelize.define(
  "WatchlistSymbol",
  {
    watchlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "watchlists", key: "id" },
    },
    symbol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "symbols", key: "id" },
    },
    buying_value: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    buy_quantity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "watchlist_symbols",
    timestamps: false,
  }
);

export default WatchlistSymbol;
