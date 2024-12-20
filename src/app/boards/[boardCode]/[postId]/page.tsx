'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Post, Comment } from '@/types';
import { useSession } from 'next-auth/react';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useParams } from 'next/navigation';
import Image from 'next/image';

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

interface CommentProps {
  comment: Comment;
  onReply: (parentId: number) => void;
  boardCode: string;
  postId: string;
  setCommentsCount: (count: number) => void;
}

const CommentForm = ({ parentId, onSubmit, onCancel }: {
  parentId?: number;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded whitespace-pre-wrap"
        placeholder={parentId ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
      />
      <div className="mt-2 flex gap-2">
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {parentId ? "답글 작성" : "댓글 작성"}
        </button>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
};

const Comment = ({ comment, onReply, boardCode, postId, setCommentsCount }: CommentProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [replyToId, setReplyToId] = useState<number | null>(null);

  const handleSubmitReply = async (content: string) => {
    try {
      const response = await fetch(`/api/boards/${boardCode}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          parentId: comment.id,
          mentionedUserId: replyToId ? replies.find(r => r.id === replyToId)?.user_id : comment.user_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '답글 작성에 실패했습니다.');
      }

      const data = await response.json();
      setReplies([...replies, data]);
      setReplyToId(null);
      setCommentsCount(data.comments_count);
      onReply(comment.id);
    } catch (error) {
      console.error('답글 작성 오류:', error);
      alert(error.message || '답글 작성에 실패했습니다.');
    }
  };

  const renderCommentContent = (comment: Comment) => {
    if (comment.mentioned_user_name) {
      return (
        <p className="mt-2 whitespace-pre-wrap">
          <span className="text-blue-600">@{comment.mentioned_user_name}</span> {comment.content}
        </p>
      );
    }
    return <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>;
  };

  if (comment.parentId) {
    return (
      <div className="ml-8 mb-2">
        <div className="bg-gray-50 p-4 rounded">
          <div className="flex justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Image
                src="/icons/user.svg"
                alt="작성자"
                width={14}
                height={14}
                className="text-gray-500"
              />
              {comment.author}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-2">
              <Image
                src="/icons/calendar.svg"
                alt="작성일"
                width={14}
                height={14}
                className="text-gray-500"
              />
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm">{renderCommentContent(comment)}</div>
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className="text-xs text-blue-500 mt-2"
          >
            답글 달기
          </button>
        </div>

        {isReplying && (
          <CommentForm 
            parentId={comment.parentId}
            onSubmit={handleSubmitReply}
            onCancel={() => setIsReplying(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="bg-gray-50 p-4 rounded">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium flex items-center gap-2">
            <Image
              src="/icons/user.svg"
              alt="작성자"
              width={14}
              height={14}
              className="text-gray-500"
            />
            {comment.author}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <Image
              src="/icons/calendar.svg"
              alt="작성일"
              width={14}
              height={14}
              className="text-gray-500"
            />
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        <button 
          onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
          className="text-xs text-blue-500 mt-2 hover:text-blue-600"
        >
          답글 달기
        </button>
      </div>

      {replyToId === comment.id && (
        <div className="ml-8">
          <CommentForm 
            parentId={comment.id}
            onSubmit={handleSubmitReply}
            onCancel={() => setReplyToId(null)}
          />
        </div>
      )}
      
      {replies.map((reply) => (
        <div key={reply.id}>
          <div className="ml-8 mt-2">
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Image
                    src="/icons/user.svg"
                    alt="작성자"
                    width={14}
                    height={14}
                    className="text-gray-500"
                  />
                  {reply.author}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <Image
                    src="/icons/calendar.svg"
                    alt="작성일"
                    width={14}
                    height={14}
                    className="text-gray-500"
                  />
                  {new Date(reply.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm">{renderCommentContent(reply)}</div>
              <button 
                onClick={() => setReplyToId(replyToId === reply.id ? null : reply.id)}
                className="text-xs text-blue-500 mt-2"
              >
                답글 달기
              </button>
            </div>
          </div>
          {replyToId === reply.id && (
            <div className="ml-8">
              <CommentForm 
                parentId={comment.id}
                onSubmit={handleSubmitReply}
                onCancel={() => setReplyToId(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

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
  const [replyToComment, setReplyToComment] = useState<{
    id: number;
    author: string;
    userId: number;
  } | null>(null);
  const [commentsCount, setCommentsCount] = useState<number>(0);

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
      alert('자신의 글에는 좋아요/싫어요를 할 수 없습니다.');
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
        throw new Error(errorData.error || '댓글을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setComments(data.comments);
      setCommentsCount(data.comments_count);
    } catch (error) {
      console.error('댓글 로딩 중 오류:', error);
      setComments([]);
      setCommentsCount(0);
    }
  }, [boardCode, postId]);

  const handleCommentSubmit = async (content: string, parentId?: number, mentionedUserId?: number) => {
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
        body: JSON.stringify({ content, parentId, mentionedUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.');
      }

      await loadComments();
      setNewComment('');
      setReplyToComment(null);
    } catch (error) {
      alert(error.message || '댓글 작성 중 오류가 발생했습니다.');
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
        <h1 className="text-base font-medium mb-3">{post.title}</h1>
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
          <span className="flex items-center gap-2">
            <Image
              src="/icons/user.svg"
              alt="작성자"
              width={16}
              height={16}
              className="text-gray-500"
            />
            {post.author}
          </span>
          <span className="flex items-center gap-2">
            <Image
              src="/icons/calendar.svg"
              alt="작성일"
              width={16}
              height={16}
              className="text-gray-500"
            />
            {new Date(post.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-2">
            <Image
              src="/icons/eye.svg"
              alt="조회수"
              width={16}
              height={16}
              className="text-gray-500"
            />
            조회 {post.view_count || 0}
          </span>
        </div>
        <div className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[200px]">
          {post.content}
        </div>
        <div className="mt-6 flex items-center justify-center gap-8 border-t border-b py-4">
          <button
            onClick={() => handleVoteClick(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              userVote === true
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <FaThumbsUp />
            <span>좋아요 {likeCount}</span>
          </button>
          
          <button
            onClick={() => handleVoteClick(false)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              userVote === false
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <FaThumbsDown />
            <span>싫어요 {dislikeCount}</span>
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium mb-4">
            댓글 <span className="text-gray-500 text-xs">({commentsCount})</span>
          </h3>
          
          <div className="mb-6">
            <textarea
              className="w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={session ? "댓글을 작성해주세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!session || isCommentLoading}
            />
            <div className="flex justify-end mt-2">
              <button 
                className={`px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md transition-colors
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
              <Comment 
                key={comment.id} 
                comment={comment} 
                onReply={setReplyToComment} 
                boardCode={boardCode} 
                postId={postId}
                setCommentsCount={setCommentsCount}
              />
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-500 text-sm">아직 작성된 댓글이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Link 
              href={`/boards/${boardCode}/new`}
              className="px-3 py-1.5 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              글쓰기
            </Link>
            
            <Link 
              href={`/boards/${boardCode}/new?parent_id=${postId}`}
              className="px-3 py-1.5 text-sm rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              답글
            </Link>
            
            {session?.user && post.author && (
              session.user.email === post.author || 
              session.user.name === post.author
            ) && (
              <>
                <Link 
                  href={`/boards/${boardCode}/${postId}/edit`}
                  className="px-3 py-1.5 text-sm rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  수정
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
                  className="px-3 py-1.5 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  삭제
                </button>
              </>
            )}
          </div>

          <Link 
            href={`/boards/${boardCode}`}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            목록
          </Link>
        </div>
      </div>
    </div>
  );
} 