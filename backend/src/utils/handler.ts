import { Response } from "express";

// App error handler
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface ApiResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    ...(data && { data }),
  } as ApiResponse<T>);
};
