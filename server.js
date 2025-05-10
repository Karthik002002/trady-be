import { connectDB, sequelize } from "./db/Config.js";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { MainRoute } from "./routes/MainRoutes.js";

import { dark, light, noSidebar } from "@adminjs/themes";
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import AdminJSSequelize from "@adminjs/sequelize";
// import { ModelKey } from "./model/ModelManager.js";

const app = express();
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(express.json());
AdminJS.registerAdapter(AdminJSSequelize);

const adminJs = new AdminJS({
  databases: [sequelize],
  rootPath: "/admin",
  availableThemes: [dark, light,noSidebar],
  branding: {
    companyName: "Your Company",
    logo: false, // or your logo URL
    softwareBrothers: false, // removes AdminJS watermark
    theme: {
      colors: {
        primary100: "#1e1e2f",
        primary80: "#2e2e3e",
        primary60: "#3e3e4f",
        primary40: "#4e4e6f",
        primary20: "#6e6e8f",

        grey100: "#1a1a1a",
        grey80: "#2a2a2a",
        grey60: "#3a3a3a",
        grey40: "#4a4a4a",
        grey20: "#5a5a5a",

        filterBg: "#111",
        accent: "#ffd700", // Gold for contrast
        hoverBg: "#222",

        border: "#333",
        defaultText: "#e0e0e0",
        lightText: "#999",
        darkText: "#fff",
        bg: "#121212",
        inputBg: "#1a1a1a",
      },
    },
  },
});

const router = AdminJSExpress.buildRouter(adminJs);
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(adminJs.options.rootPath, router);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
connectDB();

sequelize.sync().then(() => {
  // sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized.");
});

MainRoute.map((route) => {
  app.use(route.path, route.route);
});

const PORT = 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from 'trade_uploads'
app.use(
  "/trade_uploads",
  express.static(path.join(__dirname, "trade_uploads"))
);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
