import { connectDB, sequelize } from "./db/Config.js";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { MainRoute } from "./routes/MainRoutes.js";
// import { ModelKey } from "./model/ModelManager.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
connectDB();

sequelize.sync().then(() => {
  // sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized.");
});

MainRoute.map((route) => {
  app.use(route.path, route.route);
});

const PORT = 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from 'trade_uploads'
app.use(
  "/trade_uploads",
  express.static(path.join(__dirname, "trade_uploads"))
);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
