'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PostForm from '@/components/PostForm';

export default function NewPostPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const boardCode = params.boardCode as string;
  const parent_id = searchParams.get('parent_id');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentPost, setParentPost] = useState<any>(null);
  const [initialData, setInitialData] = useState<{ title: string; content: string } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: null as number | null
  });

  // 원글 정보 불러오기
  useEffect(() => {
    const fetchParentPost = async () => {
      if (!parent_id) {
        setInitialData({ title: '', content: '' });
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/boards/${boardCode}/${parent_id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '원글을 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setParentPost(data);
        setInitialData({
          title: data.title ? `Re: ${data.title}` : '',
          content: ''
        });
      } catch (error) {
        console.error('원글 조회 오류:', error);
        setError(error instanceof Error ? error.message : '원글을 불러오는데 실패했습니다.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentPost();
  }, [parent_id, boardCode]);

  // 카테고리 정보 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/boards/${boardCode}/categories`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('받아온 카테고리 데이터:', data);
        
        const updatedCategories = [
          { id: null, name: '선택없음' },
          ...data
        ];
        
        console.log('최종 카테고리 데이터:', updatedCategories);
        setCategories(updatedCategories);
      } catch (error) {
        console.error('카테고리 조회 에러:', error);
        setError(error instanceof Error ? error.message : '카테고리 로딩 실패');
      }
    };

    if (boardCode) {
      fetchCategories();
    }
  }, [boardCode]);

  // formData 초기값 설정 부분 수정
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        title: initialData.title,
        content: initialData.content,
        category_id: null
      }));
    }
  }, [initialData]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>에러: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PostForm
        boardCode={boardCode}
        categories={categories}
        isSubmitting={isSubmitting}
        initialData={formData}
        onSubmit={async (formData) => {
          setIsSubmitting(true);

          try {
            // 답글인 경우 원글의 그룹 정보 설정
            let grpInfo = { group_id: 0, sequence: 0, depth: 0 };
            
            if (parent_id && parentPost) {
              grpInfo = {
                group_id: parentPost.group_id || parentPost.id,
                sequence: (parentPost.sequence || 0) + 1,
                depth: (parentPost.depth || 0) + 1
              };
            }

            const response = await fetch(`/api/boards/${boardCode}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: formData.title,
                content: formData.content,
                category_id: formData.category_id || 0,
                parent_id: parent_id ? parseInt(parent_id) : null,
                ...grpInfo
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 401) {
                alert(errorData.error);
                router.push('/login');
                return;
              }
              throw new Error(errorData.error || '게시글 작성에 실패했습니다.');
            }

            const data = await response.json();
            router.push(`/boards/${data.boardCode}/${data.id}`);
          } catch (error) {
            console.error('게시글 작성 오류:', error);
            alert(error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다.');
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </div>
  );
}
