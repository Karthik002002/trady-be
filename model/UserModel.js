import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import Portfolio from "./Portfolio.js";

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    user_role: {
      type: DataTypes.INTEGER,
      defaultValue: 2, // 1 -> admin, 2 -> user
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["username"], // Add unique constraint properly
      },
    ],
  }
);

// User.hasMany(Portfolio, {
//   foreignKey: "user_id",
//   onDelete: "CASCADE",
// });

export default User;
