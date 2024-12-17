import { Post } from '@/types';
import Link from 'next/link';

interface Props {
  params: Promise<{
    boardCode: string;
  }>
}

async function getPosts(boardCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/boards/${boardCode}`;
  
  console.log('Fetching posts for board:', boardCode);
  console.log('Full Request URL:', apiUrl);
  
  const response = await fetch(apiUrl, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('API 응답 에러:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData.error || '게시글을 불러오는데 실패했습니다.');
  }
  
  const data = await response.json();
  return data;
}

export default async function BoardPage({ params }: Props) {
  try {
    const resolvedParams = await params;
    const posts = await getPosts(resolvedParams.boardCode);
    
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {resolvedParams.boardCode} 게시판
          </h1>
          <Link 
            href={`/boards/${resolvedParams.boardCode}/write`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            글쓰기
          </Link>
        </div>
        
        {posts && posts.length > 0 ? (
          <div className="grid gap-4">
            {posts.map((post: any) => (
              <div 
                key={post.id} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <Link href={`/boards/${resolvedParams.boardCode}/${post.id}`}>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
                    {post.title}
                  </h2>
                </Link>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg 
                        className="w-4 h-4 mr-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {post.author}
                    </span>
                    <span className="flex items-center">
                      <svg 
                        className="w-4 h-4 mr-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.view_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">게시글이 없습니다.</p>
          </div>
        )}
      </div>
    );
  } catch (error: any) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            에러가 발생했습니다
          </h1>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }
}
