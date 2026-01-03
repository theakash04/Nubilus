import type {
  ApiResponse,
  LoginCredentialProps,
  LoguoutSessionProps,
  SessionRequestProps,
  User,
  VerifySessionProps,
} from "../types/auth.types";
import api from "./AxiosInstance";

export async function LoginUser(props: LoginCredentialProps) {
  const res = await api.post<ApiResponse>("/auth/login", props);

  return res.data;
}

interface OtpData {
  otpId: string;
}
export async function requestSessionManagementOTP({
  email,
}: SessionRequestProps): Promise<ApiResponse<OtpData>> {
  const res = await api.post<ApiResponse<OtpData>>("/auth/request", { email });
  return res.data;
}

interface VerifySessionRes {
  authToken: string;
  expiresIn: string;
}
export async function verifySessionOtp({ otpId, otp }: VerifySessionProps) {
  const res = await api.post<ApiResponse<VerifySessionRes>>("/auth/verify", {
    otpId,
    otp,
  });

  const { authToken, expiresIn } = res.data.data;

  // Save token (persistent)
  sessionStorage.setItem("authToken", authToken);
  sessionStorage.setItem("authTokenExpiresIn", expiresIn);

  return res.data.data;
}

interface ActiveSessionResponse {
  sessions: {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
  };
}
export async function getActiveSessions() {
  const token = sessionStorage.getItem("authToken");

  if (!token) throw new Error("No auth token");

  const res = await api.get<ApiResponse<ActiveSessionResponse>>(
    "/auth/sessions",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.data;
}

export async function LogoutSession({ sessionId }: LoguoutSessionProps) {
  const token = sessionStorage.getItem("authToken");
  if (!token) throw new Error("No auth token");

  const res = await api.post<ApiResponse>(
    "/auth/sessions/logout",
    { sessionId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.data;
}

export async function getUser(): Promise<ApiResponse<User>> {
  const res = await api.get<ApiResponse<User>>("/auth/user");

  return res.data;
}

export async function logoutUser(): Promise<ApiResponse> {
  const res = await api.get<ApiResponse>("/auth/logout");

  return res.data;
}

export async function acceptInvite(
  token: string
): Promise<ApiResponse<{ mustSetPassword: boolean }>> {
  const res = await api.get<ApiResponse<{ mustSetPassword: boolean }>>(
    `/org/invite/accept?token=${token}`
  );
  return res.data;
}

export async function setPassword(password: string): Promise<ApiResponse> {
  const res = await api.post<ApiResponse>("/auth/set-password", { password });
  return res.data;
}
