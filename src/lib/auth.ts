import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { getSessionUserId } from "./session";

export class AuthError extends Error {}

const MIN_PASSWORD_LENGTH = 8;

export async function signUp(name: string, email: string, password: string): Promise<User> {
  if (!name.trim()) throw new AuthError("Enter your name.");
  if (!email.trim()) throw new AuthError("Enter your email.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) throw new AuthError("An account with that email already exists — log in instead.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.trim(), passwordHash },
  });
  // Every user gets guardrails from day one, at the same defaults the
  // Settings screen shows — there's no "unconfigured" state to special-case.
  await prisma.guardrailSettings.create({ data: { userId: user.id } });

  return user;
}

export async function logIn(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) throw new AuthError("No account found with that email — sign up instead.");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AuthError("Incorrect password.");

  return user;
}

export async function getSessionUser(): Promise<User | null> {
  const userId = getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

// For Server Component pages: returns the logged-in user, or redirects to
// /login if there isn't one. Every protected page starts with this.
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
