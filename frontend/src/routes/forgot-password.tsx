import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  sendResetPassOtp,
  verifyResetPassOtp,
  resetPassword,
} from "../lib/api/Authapi";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/Layouts/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

enum Step {
  EMAIL = 0,
  OTP = 1,
  PASSWORD = 2,
}

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(Step.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const sendOtpMutation = useMutation({
    mutationFn: sendResetPassOtp,
    onSuccess: () => {
      setError("");
      setMessage("OTC sent! Please check your email inbox.");
      setStep(Step.OTP);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to send OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyResetPassOtp,
    onSuccess: (data) => {
      setError("");
      setMessage(data.message);
      setResetToken(data.data.token);
      setStep(Step.PASSWORD);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Invalid OTP");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to reset password");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    sendOtpMutation.mutate({ email });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    verifyOtpMutation.mutate({ email, otp });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    resetPasswordMutation.mutate({ token: resetToken, password });
  };

  const isLoading =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <AuthLayout
      title={
        step === Step.EMAIL
          ? "Forgot Password"
          : step === Step.OTP
            ? "Verify OTP"
            : "Reset Password"
      }
      subtitle={
        step === Step.EMAIL
          ? "Enter your email address to receive a one-time password."
          : step === Step.OTP
            ? `Enter the OTP sent to ${email}`
            : "Create a new strong password for your account."
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
            <CheckCircle2 className="h-4 w-4" /> {message}
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
                onClick={() => setStep(Step.EMAIL)}
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

        {step === Step.PASSWORD && (
          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full py-2.5 shadow-lg shadow-primary-500/20"
              isLoading={isLoading}
              disabled={!password || !confirmPassword}
            >
              Reset Password <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
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
