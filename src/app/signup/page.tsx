"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Enter your name");
    if (!email.trim()) return setError("Enter your email");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");

    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't create your account");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-orbit-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-8 py-12">
        <div className="mb-8 text-center">
          <p className="text-3xl font-bold text-white">Orbit</p>
          <p className="mt-1 text-sm text-orbit-muted">Create your account</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="h-12 rounded-lg border border-orbit-border bg-orbit-card px-4 text-sm text-white placeholder:text-orbit-muted"
          />
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
            placeholder="Password (min 8 characters)"
            className="h-12 rounded-lg border border-orbit-border bg-orbit-card px-4 text-sm text-white placeholder:text-orbit-muted"
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            placeholder="Confirm password"
            className="h-12 rounded-lg border border-orbit-border bg-orbit-card px-4 text-sm text-white placeholder:text-orbit-muted"
          />
          {error && <p className="text-xs text-orbit-shield">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-[52px] rounded-full bg-orbit-pulse text-[15px] font-semibold text-[#0A0F1E] disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-orbit-muted">
          Already a member?{" "}
          <Link href="/login" className="font-medium text-orbit-pulse">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
