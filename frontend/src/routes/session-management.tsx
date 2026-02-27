import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Monitor,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  requestSessionManagementOTP,
  verifySessionOtp,
  getActiveSessions,
  LogoutSession,
} from "../lib/api/Authapi";
import type { SessionInfo } from "../lib/api/Authapi";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/Layouts/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

enum Step {
  EMAIL = 0,
  OTP = 1,
  SESSIONS = 2,
}

function parseDeviceInfo(userAgent: string) {
  if (!userAgent || userAgent === "Unknown Device") {
    return { browser: "Unknown", os: "Unknown Device", isMobile: false };
  }

  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";

  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
    os = "iOS";

  const isMobile =
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone");

  return { browser, os, isMobile };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const Route = createFileRoute("/session-management")({
  component: SessionManagement,
});

function SessionManagement() {
  const [step, setStep] = useState<Step>(Step.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const sendOtpMutation = useMutation({
    mutationFn: requestSessionManagementOTP,
    onSuccess: (data) => {
      setError("");
      setMessage("OTP sent! Please check your email inbox.");
      setOtpId(data.data.otpId);
      setStep(Step.OTP);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || err.message || "Failed to send OTP",
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifySessionOtp,
    onSuccess: async () => {
      setError("");
      setMessage("");
      try {
        const data = await getActiveSessions();
        setSessions(data.sessions);
        setStep(Step.SESSIONS);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load sessions");
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || "Invalid OTP");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: LogoutSession,
    onMutate: ({ sessionId }) => setRevokingId(sessionId),
    onSettled: () => setRevokingId(null),
    onSuccess: (_data, { sessionId }) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage("Session revoked successfully");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to revoke session");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setMessage("");
    sendOtpMutation.mutate({ email });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError("");
    setMessage("");
    verifyOtpMutation.mutate({ otpId, otp });
  };

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <AuthLayout
      title={
        step === Step.EMAIL
          ? "Manage Sessions"
          : step === Step.OTP
            ? "Verify OTP"
            : "Active Sessions"
      }
      subtitle={
        step === Step.EMAIL
          ? "Enter your email to manage active login sessions."
          : step === Step.OTP
            ? `Enter the OTP sent to ${email}`
            : "Revoke access from devices you no longer use."
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {message && !error && (
          <div className="bg-primary/10 border border-primary/20 text-primary text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
          </div>
        )}

        {step === Step.EMAIL && (
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button
              type="submit"
              className="w-full flex justify-center py-2.5 shadow-lg shadow-primary-500/20"
              isLoading={isLoading}
              disabled={!email}
            >
              Send OTP <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === Step.OTP && (
          <form className="space-y-6" onSubmit={handleOtpSubmit}>
            <Input
              label="One-Time Password"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setStep(Step.EMAIL);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-2 py-2.5 shadow-lg shadow-primary-500/20"
                isLoading={isLoading}
                disabled={!otp}
              >
                Verify OTP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === Step.SESSIONS && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No active sessions found.
              </p>
            ) : (
              sessions.map((session) => {
                const { browser, os, isMobile } = parseDeviceInfo(
                  session.deviceInfo,
                );
                const DeviceIcon = isMobile ? Smartphone : Monitor;
                const isRevoking = revokingId === session.id;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <DeviceIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {browser} on {os}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.ipAddress || "Unknown IP"} ·{" "}
                          {timeAgo(session.createdAt)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        revokeMutation.mutate({ sessionId: session.id })
                      }
                      disabled={isRevoking}
                      isLoading={isRevoking}
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
