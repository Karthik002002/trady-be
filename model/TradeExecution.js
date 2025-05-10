import { DataTypes } from "sequelize";
import { sequelize } from "../db/Config.js";

const TradeExecution = sequelize.define(
  "TradeExecution",
  {
    symbol_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Reference to Symbol table",
    },
    strategy_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Reference to Symbol table",
    },
    journal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Reference to Journal table",
    },
    confidence_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    active_status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: true,
      comment: "Indicates whether the trade is currently active or inactive",
    },
    trade_type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: true,
      comment: "Buy or Sell action",
    },
    entry: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Entry price",
    },
    exit: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Exit price",
    },
    target: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Target price",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Quantity traded",
    },
    risk_percent: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Risk percentage of the trade",
    },
    reward_percent: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Reward percentage of the trade",
    },
    rr_ratio: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Risk-Reward Ratio",
    },
    traded_value: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Total value traded",
    },
    exit_on_sl: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "P&L on stop loss exit",
    },
    exit_on_target: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "P&L on target exit",
    },
    margin_type: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Margin multiplier used for the trade (e.g., 1.25, 5.00)",
    },

    margin_amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Margin amount required",
    },
    margin_risk_percent: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Risk percentage based on margin",
    },
    margin_reward_percent: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Reward percentage based on margin",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes or observations",
    },
    commission_percent: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment:
        "Commission percent charged on traded value (e.g., 0.0025 = 0.25%)",
    },

    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Trade status (open, closed, partial, etc.)",
    },
  },
  {
    tableName: "trade_executions",
    timestamps: true,
    paranoid: true, // soft deletes
  }
);

async function calculateTradeFields(trade) {
  const decimalFields = [
    "entry",
    "exit",
    "target",
    "risk_percent",
    "reward_percent",
    "rr_ratio",
    "traded_value",
    "exit_on_sl",
    "exit_on_target",
    "margin_amount",
    "margin_type",
    "margin_risk_percent",
    "margin_reward_percent",
    "commission_percent",
  ];
  for (const key of decimalFields) {
    if (trade[key] != null) {
      trade[key] = parseFloat(trade[key]);
    }
  }
  if (trade.entry && trade.target && trade.quantity) {
    const entry = parseFloat(trade.entry);
    const target = parseFloat(trade.target);
    const exit = parseFloat(trade.exit) || null;
    const quantity = parseInt(trade.quantity, 10);
    const commissionPercent = parseFloat(trade.commission_percent || 0);

    const risk =
      trade.trade_type === "buy" ? entry - (exit || 0) : (exit || 0) - entry;
    const reward = trade.trade_type === "buy" ? target - entry : entry - target;

    const tradedValue = entry * quantity;
    const commission = tradedValue * 2 * (commissionPercent / 100);

    trade.risk_percent =
      risk !== 0 ? -parseFloat(((risk / entry) * 100).toFixed(2)) : null;
    trade.reward_percent =
      reward !== 0 ? parseFloat(((reward / entry) * 100).toFixed(2)) : null;
    trade.rr_ratio = risk !== 0 ? parseFloat((reward / risk).toFixed(2)) : null;

    trade.traded_value = parseFloat(tradedValue.toFixed(2));

    let exitOnSl = quantity * risk;
    let exitOnTarget = quantity * reward;

    exitOnSl = exitOnSl <= 0 ? exitOnSl - commission : exitOnSl + commission;
    exitOnTarget =
      exitOnTarget >= 0 ? exitOnTarget - commission : exitOnTarget + commission;

    trade.exit_on_sl = parseFloat(exitOnSl.toFixed(2));
    trade.exit_on_target = parseFloat(exitOnTarget.toFixed(2));

    if (trade.margin_type) {
      trade.margin_amount = parseFloat(
        (tradedValue / trade.margin_type).toFixed(2)
      );
    } else {
      trade.margin_amount = parseFloat(tradedValue.toFixed(2));
    }

    if (trade.margin_amount > 0) {
      const marginAmount = trade.margin_amount;
      trade.margin_risk_percent = parseFloat(
        ((exitOnSl / marginAmount) * 100).toFixed(2)
      );
      trade.margin_reward_percent = parseFloat(
        ((exitOnTarget / marginAmount) * 100).toFixed(2)
      );
    } else {
      trade.margin_risk_percent = null;
      trade.margin_reward_percent = null;
    }
  }
}

TradeExecution.beforeCreate(async (trade) => {
  await calculateTradeFields(trade);
});

TradeExecution.beforeUpdate(async (trade) => {
  await calculateTradeFields(trade);
});

export { TradeExecution };
