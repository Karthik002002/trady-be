import express from "express";
import User from "../model/UserModel.js";
import { authMiddleware } from "../middleware/Autheticatetoken.js";
import { Token } from "../model/TokenModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserRouter = express.Router();

UserRouter.post("/register", authMiddleware, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate the recieved data on the body or not
    if (!username || !email || !password) {
      return res.status(500).json({
        error: "All Required Fields (username, email, password) must be sent.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check existing user
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

UserRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password is mandatory for login" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Username or password" });
    }

    const existingToken = await Token.findOne({ where: { user_id: user.id } });

    if (existingToken) {
      await Token.destroy({ where: { user_id: user.id } });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_TOKEN, {
      expiresIn: "1d",
    });

    await Token.create({
      user_id: user.id,
      token: token,
    });

    res
      .status(200)
      .json({ message: "Login successful", token, user_role: user.user_role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export { UserRouter };
