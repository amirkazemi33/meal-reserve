import { cache } from "react";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export type SessionPayload = {
  userId: string;
  phone: string;
  name: string;
  permissionCodes: string[];
};

type SessionJwtPayload = JWTPayload & SessionPayload;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    phone: payload.phone,
    name: payload.name,
    permissionCodes: payload.permissionCodes,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const data = payload as SessionJwtPayload;
    if (
      typeof data.userId !== "string" ||
      typeof data.phone !== "string" ||
      typeof data.name !== "string" ||
      !Array.isArray(data.permissionCodes)
    ) {
      return null;
    }
    return {
      userId: data.userId,
      phone: data.phone,
      name: data.name,
      permissionCodes: data.permissionCodes.filter(
        (code): code is string => typeof code === "string",
      ),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true },
  });

  // Cookie is still a valid JWT, but the user is gone (reset/seed/delete).
  // Send them through /logout so the cookie is cleared; otherwise proxy.ts
  // treats the JWT as logged-in and bounces /login back to /menu.
  if (!user?.isActive) {
    redirect("/logout");
  }

  return payload;
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
