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
        .json({ message: "Username and password are mandatory for login" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Username or password" });
    }

    let existingToken = await Token.findOne({ where: { user_id: user.id } });

    if (existingToken) {
      try {
        // Check if token is still valid
        jwt.verify(existingToken.token, process.env.JWT_TOKEN);
        // If valid, return it
        return res.status(200).json({
          message: "Login successful",
          token: existingToken.token,
          user_role: user.user_role,
        });
      } catch (err) {
        // If token is expired or invalid, delete it
        await Token.destroy({ where: { user_id: user.id } });
      }
    }

    // Create new token
    const newToken = jwt.sign({ id: user.id }, process.env.JWT_TOKEN, {
      expiresIn: "2d",
    });

    await Token.create({
      user_id: user.id,
      token: newToken,
    });

    res.status(200).json({
      message: "Login successful",
      token: newToken,
      user_role: user.user_role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

UserRouter.post("/logout", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Get the token
    const user_id = req.user.id;

    // Remove the token from the database
    await Token.destroy({
      where: { user_id, token },
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

export { UserRouter };
