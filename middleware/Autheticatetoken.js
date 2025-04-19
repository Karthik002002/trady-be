import jwt from "jsonwebtoken";
import { Token } from "../model/TokenModel.js";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Access denied. Invalid token format." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify token using the correct secret
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    req.user = decoded;

    // Check if token exists in the database
    const existingToken = await Token.findOne({ where: { token } });

    if (!existingToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export { authMiddleware };
