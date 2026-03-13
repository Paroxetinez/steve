import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const PHONE_PATTERN = /^\d{11}$/;

type DbCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone);
}

export function createSessionToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

export function buildSessionExpiresAt(now = Date.now()): number {
  return now + SESSION_DURATION_MS;
}

export async function requireUserBySession(ctx: DbCtx, sessionToken: string) {
  const tokenHash = await sha256Hex(sessionToken);
  const session = await ctx.db
    .query("authSessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();

  if (!session || session.revokedAt || session.expiresAt <= Date.now()) {
    throw new ConvexError("Unauthorized");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== "active") {
    throw new ConvexError("Unauthorized");
  }

  return { user, session };
}
