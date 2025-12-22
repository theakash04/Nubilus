declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      apiKey?: {
        id: string;
        orgId: string;
      };
    }
  }
}

export {};
