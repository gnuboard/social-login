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

interface Category {
  id: string;
  name: string;
}

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const { boardCode, postId } = use(params);
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [initialData, setInitialData] = useState<{ 
    title: string; 
    content: string;
    category_id?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    const fetchData = async () => {
      try {
        if (status === 'unauthenticated') {
          throw new Error('로그인이 필요합니다.');
        }

        const [postResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/boards/${boardCode}/${postId}`),
          fetch(`/api/boards/${boardCode}/categories`)
        ]);

        const post = await postResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        if (session?.user?.id !== post.user_id) {
          throw new Error('게시글을 수정할 권한이 없습니다.');
        }

        setCategories(categoriesData);
        setInitialData({
          title: post.title || '',
          content: post.content || '',
          category_id: post.category_id || null
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, session, boardCode, postId]);

  const handleSubmit = async (formData: { 
    title: string; 
    content: string;
    category_id?: string | null;
  }) => {
    setSubmitLoading(true);
    
    try {
      if (!formData.category_id) {
        throw new Error('카테고리를 선택해주세요.');
      }

      const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category_id: formData.category_id
        }),
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
      categories={categories}
    />
  );
}
