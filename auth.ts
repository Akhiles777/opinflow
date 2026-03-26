import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import VK from "next-auth/providers/vk";
import Yandex from "next-auth/providers/yandex";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureUserSetup } from "@/lib/user-setup";

type AuthUserPayload = {
  id: string;
  role: Role;
  status: "ACTIVE" | "PENDING_VERIFICATION" | "BLOCKED";
};

function hasOAuthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return Boolean(clientId?.trim() && clientSecret?.trim() && clientId.trim().length > 5 && clientSecret.trim().length > 5);
}

function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("p6002") ||
    message.includes("api key is invalid") ||
    message.includes("can't reach database") ||
    message.includes("database")
  );
}

function getOAuthFallbackEmail(provider: "vk" | "yandex", profileId: string | number) {
  return `${provider}-${profileId}@oauth.potokmneny.local`;
}

const providers: NonNullable<NextAuthConfig["providers"]> = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Пароль", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email: String(credentials.email).toLowerCase() },
        });
      } catch (error) {
        if (isDatabaseUnavailable(error)) {
          throw new Error("AUTH_UNAVAILABLE");
        }
        throw error;
      }

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);
      if (!isValid) {
        return null;
      }

      if (user.status === "BLOCKED") {
        throw new Error("BLOCKED");
      }

      if (user.status === "PENDING_VERIFICATION") {
        throw new Error("NOT_VERIFIED");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        status: user.status,
      };
    },
  }),
];

if (hasOAuthCredentials(process.env.VK_CLIENT_ID, process.env.VK_CLIENT_SECRET)) {
  providers.push(
    VK({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
      checks: ["none"],
      profile(profile) {
        return {
          id: String(profile.id),
          name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Пользователь VK",
          email: profile.email ?? getOAuthFallbackEmail("vk", profile.id),
          image: profile.photo_100 ?? null,
        };
      },
    }),
  );
}

if (hasOAuthCredentials(process.env.YANDEX_CLIENT_ID, process.env.YANDEX_CLIENT_SECRET)) {
  providers.push(
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.display_name ?? profile.real_name ?? profile.first_name ?? "Пользователь Яндекса",
          email:
            profile.default_email ??
            profile.emails?.[0] ??
            getOAuthFallbackEmail("yandex", profile.id),
          image:
            !profile.is_avatar_empty && profile.default_avatar_id
              ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
              : null,
        };
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  providers,
  logger: {
    error(error) {
      console.error("[auth][error]", error);
    },
    warn(code) {
      console.warn("[auth][warn]", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[auth][debug]", code, metadata);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const appUser = user as typeof user & AuthUserPayload;
        token.id = appUser.id;
        token.role = appUser.role;
        token.status = appUser.status;
      }

      if ((!token.role || !token.status) && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, status: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        } catch {
          return token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials" && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              status: "ACTIVE",
              emailVerified: new Date(),
            },
          });

          await ensureUserSetup(user.id, "RESPONDENT");
        } catch (error) {
          console.error("[auth][oauth-setup-error]", {
            provider: account.provider,
            userId: user.id,
            error,
          });
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
} satisfies NextAuthConfig);
