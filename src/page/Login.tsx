import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { CircleCheck, Lock, Mail, ShieldCheck, Zap } from "lucide-react";

import { useLogin } from "@/API/auth-api";
import LoopLogo from "@/components/LoopLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/userContext";

type LoginFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: "email" | "password";
  icon: typeof Mail;
};

const fieldLabelClassName = "mb-2 text-base font-bold tracking-tight text-zinc-800";
const inputClassName =
  "h-12 rounded-xl border-zinc-300 bg-zinc-50/80 pl-11 text-[15px] font-jetbrains font-semibold tracking-[0.01em] shadow-none transition-all duration-200 focus:bg-white";

function LoginField({
  label,
  placeholder,
  value,
  onChange,
  type = "email",
  icon: Icon,
}: LoginFieldProps) {
  return (
    <label className="block">
      <p className={fieldLabelClassName}>{label}</p>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>
    </label>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mutate, isPending } = useLogin();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    mutate({ email, password });
  };

  return (
    <div className="font-roboto relative min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_0%_0%,#dcfce7,transparent_35%),radial-gradient(circle_at_100%_100%,#e2e8f0,transparent_30%),linear-gradient(145deg,#f8fafc,#f1f5f9)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <Card className="w-full border-zinc-200/80 bg-white/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 border-b border-zinc-200/80 pb-3">
            <div className="flex items-center justify-between gap-4">
              <LoopLogo
                className="items-center gap-4"
                markClassName="h-16 w-16 rounded-3xl [&>span:first-child]:text-3xl"
                textClassName="text-4xl tracking-[0.18em]"
              />
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                Driver Login
              </Badge>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base font-medium text-zinc-600">
                Sign in to continue driving with Loop.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-3">
            {error ? (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-800">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <form onSubmit={handleLogin} className="space-y-4">
                <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 sm:p-4">
                  <div className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-800">
                    <ShieldCheck className="h-5 w-5" />
                    Account access
                  </div>

                  <div className="grid gap-3">
                    <LoginField
                      label="Email"
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={(value) => {
                        setError("");
                        setEmail(value);
                      }}
                      placeholder="you@example.com"
                    />

                    <LoginField
                      label="Password"
                      type="password"
                      icon={Lock}
                      value={password}
                      onChange={(value) => {
                        setError("");
                        setPassword(value);
                      }}
                      placeholder="Enter password"
                    />
                  </div>

                  <Button type="submit" className="mt-4 h-11 w-full text-base font-semibold" disabled={isPending}>
                    {isPending ? "Signing in..." : "Login"}
                  </Button>
                </section>
              </form>

              <aside className="hidden rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 lg:block">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Why Loop</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-800">Quick start</p>
                    <p className="mt-1 text-sm text-zinc-600">Get online and accept rides in seconds.</p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                      <CircleCheck className="h-4 w-4 text-emerald-600" />
                      Secure account access
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">Your login session is protected.</p>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Live trip updates
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">Track and manage active trips live.</p>
                  </div>
                </div>
              </aside>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-zinc-200/80 pt-6 text-base font-medium text-zinc-600">
            New to Loop?
            <Button asChild variant="link" className="h-auto px-1 font-semibold text-zinc-900">
              <Link to="/register">Create account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Login;
