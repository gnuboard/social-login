import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export const useGoogleAuth = () => {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        redirect: false,
      });
      
      if (result?.ok) {
        // 회원가입 API 호출
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: result.user.email,
            name: result.user.name,
            image: result.user.image,
            provider: 'google',
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Google 로그인 중 오류:', error);
      // 에러 처리 로직 추가
    }
  };

  return { handleGoogleSignIn };
}; 