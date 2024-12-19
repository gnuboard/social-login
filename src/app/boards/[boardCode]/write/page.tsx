'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

export default function WritePostPage() {
  const router = useRouter();
  const params = useParams();
  const boardCode = params.boardCode as string;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const parent_id = searchParams.get('parent_id');
  const [parentPost, setParentPost] = useState<Post | null>(null);

  useEffect(() => {
    // 부모 게시글 정보 가져오기
    const fetchParentPost = async () => {
      if (!parent_id) return;
      
      try {
        const response = await fetch(`/api/boards/${params.boardCode}/${parent_id}`);
        if (!response.ok) throw new Error('원글을 불러오는데 실패했습니다.');
        
        const data = await response.json();
        setParentPost(data);
        // 제목과 내용 설정
        setTitle(`${data.title}`);
        setContent(`\n\n> ${data.content.split('\n').join('\n> ')}`);
      } catch (error) {
        console.error('원글 로딩 실패:', error);
      }
    };

    fetchParentPost();
  }, [parent_id, params.boardCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 답글인 경우 원글의 그룹 정보 설정
      let grpInfo = { group_id: 0, sequence: 0, depth: 0 };
      
      if (parent_id && parentPost) {
        grpInfo = {
          group_id: parentPost.group_id || parentPost.id, // 원글이 최상위글인 경우 id를 group_id로 사용
          sequence: (parentPost.sequence || 0) + 1,     // 원글의 sequence + 1
          depth: (parentPost.depth || 0) + 1          // 원글의 depth + 1
        };
      }

      const response = await fetch(`/api/boards/${boardCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          parent_id: parent_id ? parseInt(parent_id) : null,
          ...grpInfo
        }),
      });

      if (!response.ok) {
        throw new Error('게시글 작성에 실패했습니다.');
      }

      router.push(`/boards/${boardCode}`);
    } catch (error) {
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">새 게시글 작성</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48"
              required
            />
          </div>

          <div className="flex items-center gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('작성을 취소하시겠습니까?')) {
                  router.back();
                }
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-300"
            >
              {isSubmitting ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
