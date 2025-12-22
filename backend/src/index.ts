import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mainRoutes from "./modules/index.routes";
import errorHandler from "./middleware/errorHandler";
import { AppError, sendResponse } from "./utils/handler";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(cookieParser());

app.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendResponse(res, 200, "Server is running", {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", mainRoutes);

app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
