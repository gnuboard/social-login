'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Post } from '@/types';

interface Props {
  params: Promise<{
    boardCode: string;
    postId: string;
  }>;
}

async function getPostDetail(boardCode: string, postId: string) {
  const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '게시글을 불러오는데 실패했습니다.');
  }

  return response.json();
}

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const { boardCode, postId } = use(params);
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    const fetchPost = async () => {
      try {
        if (status === 'unauthenticated') {
          throw new Error('로그인이 필요합니다.');
        }

        const post = await getPostDetail(boardCode, postId);
        
        console.log('Session user ID:', session?.user?.id);
        console.log('Post user ID:', post.user_id);
        
        if (session?.user?.id !== post.user_id) {
          throw new Error('게시글을 수정할 권한이 없습니다.');
        }

        setFormData({
          title: post.title || '',
          content: post.content || '',
          author: post.author || ''
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [status, session, boardCode, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: formData.content
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            에러가 발생했습니다
          </h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-center">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">게시글 수정</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              제목
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                hover:border-gray-400 transition-colors"
              required
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
              내용
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                hover:border-gray-400 transition-colors min-h-[12rem] resize-y whitespace-pre-wrap"
              required
            />
          </div>

          <div className="flex items-center gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('수정을 취소하시겠습니까?')) {
                  router.push(`/boards/${boardCode}/${postId}`);
                }
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                transition-colors disabled:opacity-50"
              disabled={submitLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                transition-colors disabled:opacity-50"
              disabled={submitLoading}
            >
              {submitLoading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
