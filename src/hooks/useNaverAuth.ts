import { signIn } from 'next-auth/react';

export const useNaverAuth = () => {
  const handleNaverSignIn = async () => {
    try {
      console.log('네이버 로그인 시도...');
      const result = await signIn('naver', { 
        callbackUrl: '/',
        redirect: true
      });
      console.log('네이버 로그인 결과:', result);
    } catch (error) {
      console.error('네이버 로그인 에러:', error);
    }
  };

  return { handleNaverSignIn };
}; 