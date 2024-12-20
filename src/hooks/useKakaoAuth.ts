import { signIn } from 'next-auth/react';

export const useKakaoAuth = () => {
  const handleKakaoSignIn = async () => {
    try {
      console.log('카카오 로그인 시도...');
      const result = await signIn('kakao', { 
        callbackUrl: '/',
        redirect: true
      });
      console.log('카카오 로그인 결과:', result);
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
    }
  };

  return { handleKakaoSignIn };
}; 