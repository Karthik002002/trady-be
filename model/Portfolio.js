import { sequelize } from "../db/Config.js";
import { DataTypes } from "sequelize";
import User from "./UserModel.js";

const Portfolio = sequelize.define(
  "portfolio",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    name: {
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
        fields: ["user_id", "name"], // if you want user_id+name to be unique
      },
    ],
  }
);



export default Portfolio;
