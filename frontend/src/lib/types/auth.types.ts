export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface LoginCredentialProps {
  email: string;
  password: string;
}

export interface SessionRequestProps {
  email: string;
}

export interface VerifySessionProps {
  otpId: string;
  otp: string;
}

export interface LoguoutSessionProps {
  sessionId: string;
}
