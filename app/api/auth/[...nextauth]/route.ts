import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  // ... 다른 설정들 ...
  
  callbacks: {
    // ... 다른 callbacks ...
    
    signIn: async ({ user, account, profile }) => {
      // ... 기존 로직 ...
      return true
    },
  },
  
  // 로그인 후 리다이렉트 설정
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
  },
  
  // 로그인 완료 후 리다이렉트 설정
  redirect: async ({ url, baseUrl }) => {
    return baseUrl  // 메인 페이지('/')로 리다이렉트
  }
}