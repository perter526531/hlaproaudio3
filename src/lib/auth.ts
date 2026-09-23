import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 }, // 7 days
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: '管理员',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const u = String(credentials.username).trim();
        const p = String(credentials.password);
        // constant-time-ish comparison
        if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD && p.length > 0) {
          return { id: '1', name: u, role: 'admin' } as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'admin';
        token.name = (user as any).name || ADMIN_USERNAME;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).name = token.name;
      }
      return session;
    },
  },
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}
