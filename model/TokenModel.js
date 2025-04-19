import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import User from "./UserModel.js";

const Token = sequelize.define(
  "token",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        // model: "Users",
        key: "id",
      },
    },
    token: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
  }
);

// User.hasMany(Token, { foreignKey: "user_id" });
// Token.belongsTo(User, { foreignKey: "user_id" });

export { Token };
