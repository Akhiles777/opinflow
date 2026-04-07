import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = new Set([
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.pkce.code_verifier",
  "__Secure-authjs.pkce.code_verifier",
  "authjs.state",
  "__Secure-authjs.state",
  "authjs.nonce",
  "__Secure-authjs.nonce",
]);

const AUTH_COOKIE_PREFIXES = [
  "next-auth.",
  "__Secure-next-auth.",
  "__Host-next-auth.",
  "authjs.",
  "__Secure-authjs.",
  "__Host-authjs.",
];

function isAuthCookie(name: string) {
  return AUTH_COOKIE_NAMES.has(name) || AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 307 });
  const secure = new URL(request.url).protocol === "https:";
  const namesToClear = new Set(
    request.cookies.getAll().map((cookie) => cookie.name).filter((name) => isAuthCookie(name)),
  );

  for (const name of namesToClear) {
    response.cookies.set({
      name,
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "lax",
    });
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
