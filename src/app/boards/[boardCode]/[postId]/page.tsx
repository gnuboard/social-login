'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Post, Comment } from '@/types';
import { useSession } from 'next-auth/react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useParams } from 'next/navigation';

async function getPostDetail(boardCode: string, postId: string) {
  const response = await fetch(`/api/boards/${boardCode}/${postId}`, {
    cache: 'no-store',
    credentials: 'include'
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


export default function PostDetailPage() {
  const params = useParams();
  const boardCode = params.boardCode as string;
  const postId = params.postId as string;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState<number>(0);
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  useEffect(() => {
    if (!boardCode || !postId) {
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      
      try {
        const data = await getPostDetail(boardCode, postId);
        setPost(data);
        setLikeCount(data.like_count || 0);
        setDislikeCount(data.dislike_count || 0);
        setUserVote(data.user_vote);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [boardCode, postId]);

  const handleVoteClick = async (voteType: boolean) => {
    if (!session) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    if (session.user && post?.author && 
        (session.user.email === post.author || session.user.name === post.author)) {
      alert('자신의 글에는 추천/반대를 할 수 없습니다.');
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

  const loadComments = useCallback(async () => {
    if (!boardCode || !postId) return;

    try {
      console.log('댓글 로딩 시작:', { boardCode, postId });
      
      const response = await fetch(`/api/boards/${boardCode}/${postId}/comments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('댓글 로딩 실패:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 404) {
          setComments([]);
          return;
        }
        
        throw new Error(errorData.error || '댓글을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('받은 댓글 데이터:', data);

      if (Array.isArray(data)) {
        setComments(data);
      } else if (data === null || data === undefined) {
        setComments([]);
      } else {
        console.error('예상치 못한 응답 형식:', data);
        setComments([]);
      }
    } catch (error) {
      console.error('댓글 로딩 중 오류:', error);
      setComments([]);
    }
  }, [boardCode, postId]);

  const handleCommentSubmit = async (content: string) => {
    if (!session) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsCommentLoading(true);
    try {
      const response = await fetch(`/api/boards/${boardCode}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다.');
      }

      await loadComments();
      setNewComment('');
    } catch (error) {
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsCommentLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600 font-medium">로딩중...</span>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-end items-center gap-2 mb-6">
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
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <FaThumbsUp />
            <span>추천 {likeCount}</span>
          </button>
          
          <button
            onClick={() => handleVoteClick(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              userVote === false
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <FaThumbsDown />
            <span>반대 {dislikeCount}</span>
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">
            댓글 <span className="text-gray-500">({comments.length})</span>
          </h3>
          
          <div className="mb-6">
            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={session ? "댓글을 작성해주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!session || isCommentLoading}
            />
            <div className="flex justify-end mt-2">
              <button 
                className={`px-4 py-2 bg-blue-500 text-white rounded-md transition-colors
                  ${(!session || isCommentLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                onClick={() => handleCommentSubmit(newComment)}
                disabled={!session || isCommentLoading}
              >
                {isCommentLoading ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{comment.author}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-500">아직 작성된 댓글이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 