"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) return setError("Enter your email and password");

    setSubmitting(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't log you in");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-orbit-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-8 py-12">
        <div className="mb-8 text-center">
          <p className="text-3xl font-bold text-white">Orbit</p>
          <p className="mt-1 text-sm text-orbit-muted">Log in to your account</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="h-12 rounded-lg border border-orbit-border bg-orbit-card px-4 text-sm text-white placeholder:text-orbit-muted"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="h-12 rounded-lg border border-orbit-border bg-orbit-card px-4 text-sm text-white placeholder:text-orbit-muted"
          />
          {error && <p className="text-xs text-orbit-shield">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-[52px] rounded-full bg-orbit-pulse text-[15px] font-semibold text-[#0A0F1E] disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-orbit-muted">
          New to Orbit?{" "}
          <Link href="/signup" className="font-medium text-orbit-pulse">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-[11px] text-orbit-muted">
          Demo account: sarah@example.com / password123
        </p>
      </div>
    </div>
  );
}
