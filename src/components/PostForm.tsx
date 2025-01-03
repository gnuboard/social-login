'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Editor from './Editor';

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    category_id?: string;
  };
  boardCode: string;
  postId?: string;
  isSubmitting: boolean;
  categories: { id: string; name: string; }[];
  onSubmit: (formData: { title: string; content: string; category_id: string }) => Promise<void>;
}

export default function PostForm({
  initialData,
  boardCode,
  postId,
  isSubmitting,
  categories = [],
  onSubmit
}: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category_id, setCategory_id] = useState(initialData?.category_id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category_id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    await onSubmit({ title, content, category_id });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h1 className="text-xl font-medium mb-5">
          {postId ? '게시글 수정' : '새 게시글 작성'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-medium mb-1" htmlFor="category">
              카테고리
            </label>
            <div className="relative">
              <select
                id="category"
                value={category_id}
                onChange={(e) => setCategory_id(e.target.value)}
                className="appearance-none shadow-sm border border-gray-200 rounded w-full py-1.5 pl-2.5 pr-8 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                required
              >
                <option value="">카테고리 선택</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-medium mb-1" htmlFor="title">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow-sm appearance-none border border-gray-200 rounded w-full py-1.5 px-2.5 text-sm text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              required
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-600 text-xs font-medium mb-1" htmlFor="content">
              내용
            </label>
            <Editor value={content} onChange={setContent} />
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(postId ? '수정을 취소하시겠습니까?' : '작성을 취소하시겠습니까?')) {
                  if (postId) {
                    router.push(`/boards/${boardCode}/${postId}`);
                  } else {
                    router.back();
                  }
                }
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-1.5 px-3.5 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-3.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (postId ? '수정 중...' : '작성 중...') : (postId ? '수정하기' : '작성하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 