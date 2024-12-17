'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { useSession } from 'next-auth/react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

interface Props {
  params: {
    boardCode: string;
    postId: string;
  };
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

async function handleVote(boardCode: string, postId: string, voteType: boolean) {
  const response = await fetch(`/api/boards/${boardCode}/${postId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ voteType }),
  });

  if (!response.ok) {
    throw new Error('투표 처리 중 오류가 발생했습니다.');
  }

  return response.json();
}

export default function PostDetailPage({ params }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);
  const { boardCode, postId } = resolvedParams;
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState<number>(0);
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [userVote, setUserVote] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostDetail(boardCode, postId);
        console.log('Fetched post data:', data);
        setPost(data);
        setLikeCount(data.like_count || 0);
        setDislikeCount(data.dislike_count || 0);
        setUserVote(data.user_vote);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message);
      }
    };

    fetchPost();
  }, [boardCode, postId]);

  const handleVoteClick = async (voteType: boolean) => {
    if (!session) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    try {
      const result = await handleVote(boardCode, postId, voteType);
      setLikeCount(result.likeCount);
      setDislikeCount(result.dislikeCount);
      setUserVote(result.userVote);
    } catch (error) {
      alert('투표 처리 중 오류가 발생했습니다.');
    }
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600 font-medium">로딩중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded">
            <pre>{JSON.stringify(post, null, 2)}</pre>
          </div>
        )}
        
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <span className="mr-4">작성자: {post.author}</span>
          <span>작성일: {new Date(post.created_at).toISOString().split('T')[0]}</span>
        </div>
        <div className="whitespace-pre-wrap">
          {post.content}
        </div>
        <div className="mt-6 flex items-center justify-center gap-8 border-t border-b py-4">
          <button
            onClick={() => handleVoteClick(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              userVote === true
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FaThumbsUp />
            <span>추천 {likeCount}</span>
          </button>
          
          <button
            onClick={() => handleVoteClick(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              userVote === false
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FaThumbsDown />
            <span>반대 {dislikeCount}</span>
          </button>
        </div>
        <div className="mt-6 flex justify-end items-center gap-2">
          <Link 
            href={`/boards/${boardCode}`}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            목록으로
          </Link>
          
          {session?.user && post.author && (
            session.user.email === post.author || 
            session.user.name === post.author
          ) && (
            <>
              <Link 
                href={`/boards/${boardCode}/${postId}/edit`}
                className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                수정하기
              </Link>
              
              <button
                onClick={async () => {
                  if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                    try {
                      const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
                        method: 'DELETE',
                      });
                      
                      if (!response.ok) {
                        throw new Error('게시글 삭제에 실패했습니다.');
                      }
                      
                      window.location.href = `/boards/${boardCode}`;
                    } catch (error) {
                      alert('게시글 삭제 중 오류가 발생했습니다.');
                    }
                  }
                }}
                className="px-4 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                삭제하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 