import Holdings from "./Holdings.js";
import Journal from "./Journal.js";
import Portfolio from "./Portfolio.js";
import Strategy from "./Strategies.js";
import Symbol from "./Symbol.js";
import { Token } from "./TokenModel.js";
import Trade from "./Trades.js";
import User from "./UserModel.js";
import Watchlist from "./WatchList.js";
import WatchlistSymbol from "./WatchListSymbol.js";

// Portfolio
User.hasMany(Portfolio, { foreignKey: "user_id" });
Portfolio.belongsTo(User, {
  foreignKey: "user_id",
});

// Strategy
User.hasMany(Strategy, { foreignKey: "user_id" });
Strategy.belongsTo(User, { foreignKey: "user_id" });

// Token
User.hasMany(Token, { foreignKey: "user_id" });
Token.belongsTo(User, { foreignKey: "user_id" });

// Journal
User.hasMany(Journal, { foreignKey: "user_id" });
Journal.belongsTo(User, { foreignKey: "user_id" });

// Trade
Strategy.hasMany(Trade, { foreignKey: "strategy_id", as: "trades" });
Trade.belongsTo(Strategy, { foreignKey: "strategy_id", as: "strategy" });
Trade.belongsTo(Symbol, { foreignKey: "symbol_id" });
Symbol.hasMany(Trade, { foreignKey: "symbol_id" });
Trade.belongsTo(Journal, { foreignKey: "journal_id", as: "journal" });
Journal.hasMany(Trade, { foreignKey: "journal_id", as: "trades" });
User.hasMany(Trade, { foreignKey: "user_id" });
Trade.belongsTo(User, { foreignKey: "user_id" });
Portfolio.hasMany(Trade, { foreignKey: "portfolio_id" });
Trade.belongsTo(Portfolio, { foreignKey: "portfolio_id" });

// User
User.hasMany(Portfolio, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

// Watchlist
// Watchlist.belongsTo(Symbol, { foreignKey: "symbol_id" });
// Symbol.hasMany(Watchlist, { foreignKey: "symbol_id" });

// Holdings
Holdings.belongsTo(Symbol, { foreignKey: "symbol_id" });
Symbol.hasMany(Holdings, { foreignKey: "symbol_id" });

// Watchlist

Watchlist.belongsToMany(Symbol, {
  through: WatchlistSymbol,
  foreignKey: "watchlist_id",
});

Symbol.belongsToMany(Watchlist, {
  through: WatchlistSymbol,
  foreignKey: "symbol_id",
});

export {
  User,
  Token,
  Holdings,
  Portfolio,
  Watchlist,
  Symbol,
  WatchlistSymbol,
  Strategy,
  Journal,
  Trade,
};
