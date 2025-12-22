import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/handler";

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // Handle unexpected errors
  console.error("Unexpected error:", err);
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
  });
};

export default errorHandler;
