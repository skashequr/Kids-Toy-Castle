import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,

  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;

      // Always allow login page
      if (pathname.startsWith("/admin/login")) {
        return true;
      }

      const isLoggedIn = !!auth?.user;

      // role may not exist on default User type
      const role = (auth?.user as any)?.role as string | undefined;

      const isAdminUser =
        isLoggedIn &&
        Boolean(role) &&
        role !== "CUSTOMER";

      if (pathname.startsWith("/admin")) {
        return Boolean(isAdminUser);
      }

      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }

      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;