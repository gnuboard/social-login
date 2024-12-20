"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(session?.user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return null;
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName || newName.trim() === '') {
      setError('이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '업데이트 실패');
      }

      await update({ name: newName });
      setIsEditing(false);
    } catch (error) {
      console.error('이름 업데이트 중 오류 발생:', error);
      setError(error.message || '이름 업데이트 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">프로필 설정</h1>
      
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-sm text-gray-500">이메일</h2>
          <p className="mt-1">{session.user?.email}</p>
        </div>

        <div>
          <h2 className="text-sm text-gray-500">이름</h2>
          {isEditing ? (
            <form onSubmit={handleUpdateName} className="mt-1">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError('');
                      setNewName(session?.user?.name || '');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    disabled={isLoading}
                  >
                    취소
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <p>{session.user?.name}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                수정
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm text-gray-500">가입일</h2>
          <p className="mt-1">
            {session.user?.createdAt ? 
              new Date(session.user.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
              : '정보 없음'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 