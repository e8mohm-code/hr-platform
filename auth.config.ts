import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config: no DB calls allowed here.
 * Used by both middleware (Edge runtime) and the full auth instance.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [], // populated in auth.ts
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.establishmentId = (token.establishmentId as string | null) ?? null;
        session.user.role = (token.role as string) ?? 'MEMBER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
