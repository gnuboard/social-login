'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Post } from '@/types';

interface Props {
  params: {
    boardCode: string;
    postId: string;
  };
}

async function getPostDetail(boardCode: string, postId: string) {
  const response = await fetch(`http://localhost:3000/api/board/${boardCode}/posts?postId=${postId}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '게시글을 불러오는데 실패했습니다.');
  }

  return response.json();
}

export default function PostDetailPage({ params }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);
  const { boardCode, postId } = resolvedParams;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostDetail(boardCode, postId);
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchPost();
  }, [boardCode, postId]);

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

  if (!post) {
    return <div>로딩중...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <span className="mr-4">작성자: {post.author}</span>
          <span>작성일: {new Date(post.created_at).toISOString().split('T')[0]}</span>
        </div>
        <div className="prose max-w-none">
          {post.content}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Link 
            href={`/board/${boardCode}`}
            className="text-blue-500 hover:text-blue-600"
          >
            목록으로 돌아가기
          </Link>
          
          <Link 
            href={`/board/${boardCode}/${postId}/edit`}
            className="text-green-500 hover:text-green-600"
          >
            수정하기
          </Link>
          
          <button
            onClick={async () => {
              if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                try {
                  const response = await fetch(`/api/board/${boardCode}/posts?postId=${postId}`, {
                    method: 'DELETE',
                  });
                  
                  if (!response.ok) {
                    throw new Error('게시글 삭제에 실패했습니다.');
                  }
                  
                  // 삭제 성공 후 목록 페이지로 이동
                  window.location.href = `/board/${boardCode}`;
                } catch (error) {
                  alert('게시글 삭제 중 오류가 발생했습니다.');
                }
              }
            }}
            className="text-red-500 hover:text-red-600"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
} 