import { AuthLayout } from "@/components/Layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/useAuthActions";
import { getUser } from "@/lib/api/Authapi";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    try {
      const res = await context.queryClient.fetchQuery({
        queryKey: ["user"],
        queryFn: getUser,
        staleTime: 1000 * 60 * 5,
      });
      if (res.success) {
        throw redirect({ to: "/dashboard" });
      }
    } catch (error) {
      if (error instanceof Response || (error as any)?.to) {
        throw error;
      }
    }
  },
  component: App,
});

function App() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const loginMutation = useLogin();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (email === "" || password === "") {
      return;
    }

    const result = await loginMutation.mutateAsync({ email, password });
    if (result.success) {
      navigate({ to: "/dashboard", replace: true });
    }
  }

  const error =
    loginMutation.error?.message ||
    (loginMutation.data?.success === false ? loginMutation.data.message : null);

  return (
    <AuthLayout title={"Sign in to your account"} subtitle={undefined}>
      <form onSubmit={handleLogin} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          className="w-full flex justify-center py-2.5 shadow-lg shadow-primary-500/20 cursor-pointer"
          isLoading={loginMutation.isPending}
          disabled={email === "" || password === ""}
        >
          Sign in <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
