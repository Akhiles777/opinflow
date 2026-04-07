import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Yandex from "next-auth/providers/yandex";
import bcrypt from "bcryptjs";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureUserSetup } from "@/lib/user-setup";
import { resolveManagedRole } from "@/lib/role-utils";

type AuthUserPayload = {
  id: string;
  role: Role;
  status: "ACTIVE" | "PENDING_VERIFICATION" | "BLOCKED";
  image?: string | null;
};

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  passwordHash: true,
  role: true,
  status: true,
  emailVerified: true,
} satisfies Prisma.UserSelect;

const authTokenUserSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  status: true,
} satisfies Prisma.UserSelect;

function clearUserToken(token: Record<string, unknown>) {
  delete token.id;
  delete token.role;
  delete token.status;
  delete token.email;
  delete token.name;
  delete token.picture;
  delete token.sub;
}

class BlockedCredentialsError extends CredentialsSignin {
  code = "BLOCKED";
}

class NotVerifiedCredentialsError extends CredentialsSignin {
  code = "NOT_VERIFIED";
}

class RespondentSocialOnlyCredentialsError extends CredentialsSignin {
  code = "RESPONDENT_SOCIAL_ONLY";
}

class AuthUnavailableCredentialsError extends CredentialsSignin {
  code = "AUTH_UNAVAILABLE";
}

class VkidSigninFailedCredentialsError extends CredentialsSignin {
  code = "VKID_SIGNIN_FAILED";
}

function isRespondentSocialOnlyRole(role: Role) {
  return role === "CLIENT";
}

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

      const identifier = String(credentials.email).trim();
      const password = String(credentials.password);

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
          select: authUserSelect,
        });
      } catch (error) {
        console.error("[auth][credentials-authorize-error]", error);
        if (isDatabaseUnavailable(error)) {
          throw new AuthUnavailableCredentialsError();
        }
        throw error;
      }

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      if (user.status === "BLOCKED") {
        throw new BlockedCredentialsError();
      }

      if (user.status === "PENDING_VERIFICATION") {
        throw new NotVerifiedCredentialsError();
      }

      const targetRole = resolveManagedRole(user.email, user.role);
      if (targetRole !== user.role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: targetRole },
          select: authUserSelect,
        });
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
  Credentials({
    id: "vkid",
    name: "VK",
    credentials: {
      vkUserId: { label: "VK User ID", type: "text" },
      email: { label: "Email", type: "email" },
      name: { label: "Имя", type: "text" },
      image: { label: "Аватар", type: "text" },
    },
    async authorize(credentials) {
      const vkUserId = String(credentials?.vkUserId ?? "").trim();
      if (!vkUserId) {
        return null;
      }

      const rawEmail = String(credentials?.email ?? "").trim().toLowerCase();
      const email = rawEmail || getOAuthFallbackEmail("vk", vkUserId);
      const name = String(credentials?.name ?? "").trim() || "Пользователь VK";
      const image = String(credentials?.image ?? "").trim() || null;

      try {
        let user = await prisma.user.findUnique({
          where: { email },
          select: authUserSelect,
        });

        if (user?.status === "BLOCKED") {
          throw new BlockedCredentialsError();
        }

        if (user && isRespondentSocialOnlyRole(user.role) && resolveManagedRole(email, user.role) !== "ADMIN") {
          throw new RespondentSocialOnlyCredentialsError();
        }

        const targetRole = resolveManagedRole(email, user?.role ?? "RESPONDENT");

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
              image,
              role: targetRole,
              status: "ACTIVE",
              emailVerified: new Date(),
            },
            select: authUserSelect,
          });
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: user.name ?? name,
              image: user.image ?? image,
              role: targetRole,
              status: user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
              emailVerified: user.emailVerified ?? new Date(),
            },
            select: authUserSelect,
          });
        }

        try {
          await ensureUserSetup(user.id, targetRole);
        } catch (setupError) {
          console.error("[auth][vkid-setup-error]", {
            userId: user.id,
            targetRole,
            setupError,
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      } catch (error) {
        if (isDatabaseUnavailable(error)) {
          throw new AuthUnavailableCredentialsError();
        }

        if (error instanceof CredentialsSignin) {
          throw error;
        }

        console.error("[auth][vkid-authorize-error]", error);
        throw new VkidSigninFailedCredentialsError();
      }
    },
  }),
];

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

      if (token.id || token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: token.id ? { id: String(token.id) } : { email: String(token.email) },
            select: authTokenUserSelect,
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            token.role = dbUser.role;
            token.status = dbUser.status;
          } else if (token.id) {
            clearUserToken(token);
          }
        } catch (error) {
          console.error("[auth][jwt-sync-error]", error);
          clearUserToken(token);
          return token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role) {
        return {
          ...session,
          user: undefined,
        } as unknown as typeof session;
      }

      if (session.user) {
        session.user.id = token.id;
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.name = token.name ? String(token.name) : null;
        session.user.image = token.picture ? String(token.picture) : session.user.image ?? null;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials" && user.id) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, email: true },
          });
          const targetRole = resolveManagedRole(user.email ?? currentUser?.email ?? "", "RESPONDENT");

          if (currentUser && isRespondentSocialOnlyRole(currentUser.role) && targetRole !== "ADMIN") {
            return "/auth/error?error=RESPONDENT_SOCIAL_ONLY";
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              role: targetRole,
              status: "ACTIVE",
              emailVerified: new Date(),
            },
          });

          await ensureUserSetup(user.id, targetRole);
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
