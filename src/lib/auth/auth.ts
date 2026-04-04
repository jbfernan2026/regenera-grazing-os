// =============================================================================
// NextAuth.js v5 (Auth.js) Configuration
// =============================================================================
// Credential-based auth for Phase 1.
// Google OAuth can be enabled via NEXT_PUBLIC_ENABLE_GOOGLE_AUTH.
// The Prisma adapter handles session/account persistence automatically.
// =============================================================================

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { PlatformRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      platformRole: PlatformRole;
    };
  }

  interface User {
    platformRole?: PlatformRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    platformRole: PlatformRole;
  }
}

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
            platformRole: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          platformRole: user.platformRole,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.platformRole = (user.platformRole as PlatformRole) ?? PlatformRole.USER;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.platformRole = token.platformRole;
      }
      return session;
    },

    async signIn({ user }) {
      // Check if the platform admin email should be promoted
      if (
        user.email &&
        process.env.PLATFORM_ADMIN_EMAIL &&
        user.email.toLowerCase() === process.env.PLATFORM_ADMIN_EMAIL.toLowerCase()
      ) {
        await prisma.user.update({
          where: { email: user.email.toLowerCase() },
          data: { platformRole: PlatformRole.SUPER_ADMIN },
        }).catch(() => {
          // User might not exist yet during first sign-in via OAuth
        });
      }
      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
