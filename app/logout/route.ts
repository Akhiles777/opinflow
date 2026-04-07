import { NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
];

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 307 });
  const secure = new URL(request.url).protocol === "https:";

  for (const name of AUTH_COOKIE_NAMES) {
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
