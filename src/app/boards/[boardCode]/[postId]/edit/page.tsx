'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PostForm from '@/components/PostForm';

interface Props {
  params: Promise<{
    boardCode: string;
    postId: string;
  }>;
}

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const { boardCode, postId } = use(params);
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [initialData, setInitialData] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    const fetchPost = async () => {
      try {
        if (status === 'unauthenticated') {
          throw new Error('로그인이 필요합니다.');
        }

        const response = await fetch(`/api/boards/${boardCode}/${postId}`);
        const post = await response.json();
        
        if (session?.user?.id !== post.user_id) {
          throw new Error('게시글을 수정할 권한이 없습니다.');
        }

        setInitialData({
          title: post.title || '',
          content: post.content || ''
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [status, session, boardCode, postId]);

  const handleSubmit = async (formData: { title: string; content: string }) => {
    setSubmitLoading(true);
    
    try {
      const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '게시글 수정에 실패했습니다.');
      }

      router.push(`/boards/${boardCode}/${postId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-700 mb-2">에러가 발생했습니다</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !initialData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-center">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <PostForm
      initialData={initialData}
      boardCode={boardCode}
      postId={postId}
      isSubmitting={submitLoading}
      onSubmit={handleSubmit}
    />
  );
}
