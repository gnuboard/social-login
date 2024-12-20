import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";
import KakaoProvider from "next-auth/providers/kakao";
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
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      async profile(profile) {
        console.log('Kakao profile:', JSON.stringify(profile, null, 2))
        return {
          id: profile.id,
          name: profile.properties?.nickname,
          email: profile.kakao_account?.email,
          image: profile.properties?.profile_image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, credentials, email, trigger }, req) {

      if (account?.provider === "kakao") {
        const kakaoProfile = profile as any;
        user.name = kakaoProfile.properties?.nickname || user.name;
        user.email = kakaoProfile.kakao_account?.email || user.email;
        user.image = kakaoProfile.properties?.profile_image || user.image;
      }

      if (account?.provider === "naver") {
        const naverProfile = profile as any;
        user.name = naverProfile.response?.name || user.name;
        user.email = naverProfile.response?.email || user.email;
        user.image = naverProfile.response?.profile_image || user.image;
      }

      if (account?.provider === "google" || account?.provider === "naver" || account?.provider === "kakao") {
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