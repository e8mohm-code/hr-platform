import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      establishmentId: string | null;
      role: string;
    } & DefaultSession['user'];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة المرور', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          establishmentId: user.establishmentId,
          role: user.role,
        } as never;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.establishmentId = (user as { establishmentId: string | null }).establishmentId;
        token.role = (user as { role: string }).role;
      }

      // Self-heal stale tokens (e.g. establishment was re-created via seed).
      // Runs server-side only — middleware uses the slim auth.config which
      // doesn't trigger this branch.
      if (token.email) {
        let stale = !token.establishmentId;
        if (!stale && token.establishmentId) {
          const exists = await prisma.establishment.findUnique({
            where: { id: token.establishmentId as string },
            select: { id: true },
          });
          if (!exists) stale = true;
        }

        if (stale) {
          const dbUser = await prisma.user.findUnique({
            where: { email: String(token.email).toLowerCase() },
            select: { id: true, establishmentId: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.establishmentId = dbUser.establishmentId;
            token.role = dbUser.role;
          }
        }
      }

      return token;
    },
  },
});
