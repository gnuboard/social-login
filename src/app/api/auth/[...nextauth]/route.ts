import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const authOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, credentials, email, trigger }, req) {
      console.log('로그인 시도 정보:', {
        user,
        account,
        profile,
        email,
        credentials
      });

      if (account?.provider === "naver") {
        const naverProfile = profile as any;
        user.name = naverProfile.response?.name || user.name;
        user.email = naverProfile.response?.email || user.email;
        user.image = naverProfile.response?.profile_image || user.image;
      }

      if (account?.provider === "google" || account?.provider === "naver") {
        try {
          const connection = await pool.getConnection();
          const uuid = uuidv4();
          
          try {
            const [users] = await connection.execute(
              'SELECT * FROM users WHERE email = ?',
              [user.email]
            );

            if (Array.isArray(users) && users.length > 0) {
              // 기 사용자의 updated_at 시간 업데이트
              await connection.execute(
                'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE email = ?',
                [user.email]
              );
            } else {
              await connection.execute(
                'INSERT INTO users (email, name, image, provider, uuid) VALUES (?, ?, ?, ?, ?)',
                [user.email, user.name, user.image, account.provider, uuid]
              );
            }
            return true;
          } catch (error: any) {
            console.error("DB 저장 에러:", error);
            return false;
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session?.user?.email) {
        try {
          const connection = await pool.getConnection();
          try {
            const [users] = await connection.execute(
              'SELECT * FROM users WHERE email = ?',
              [session.user.email]
            );
            
            if (Array.isArray(users) && users.length > 0) {
              const dbUser = users[0];
              session.user.name = dbUser.name;
              session.user.id = dbUser.id;
            }
          } finally {
            connection.release();
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return '/'
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 