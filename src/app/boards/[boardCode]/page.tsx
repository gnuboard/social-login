import { Post } from '@/types';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from 'next/image';
import ThumbnailImage from '@/app/components/ThumbnailImage';

interface Props {
  params: Promise<{
    boardCode: string;
  }>
}

async function getPosts(boardCode: string, session: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/boards/${boardCode}`;
  
  console.log('Fetching posts for board:', boardCode);
  console.log('Full Request URL:', apiUrl);
  
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      'Authorization': session ? `Bearer ${session.user.accessToken}` : ''
    }
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
  return {
    title: data.board.title || boardCode,
    posts: data.posts
  };
}

export default async function BoardPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  try {
    const resolvedParams = await params;
    const { title, posts } = await getPosts(resolvedParams.boardCode, session);
    
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {title}
          </h1>
          {session && (
            <Link 
              href={`/boards/${resolvedParams.boardCode}/new`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors duration-200 text-sm"
            >
              글쓰기
            </Link>
          )}
        </div>
        
        {posts && posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="hidden md:table-cell px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">번호</th>
                  <th className="px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">제목</th>
                  <th className="px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">작성자</th>
                  <th className="hidden md:table-cell px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">조회수</th>
                  <th className="hidden md:table-cell px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">좋아요</th>
                  <th className="hidden md:table-cell px-6 py-2.5 text-left text-xs font-normal text-gray-500 uppercase tracking-wider text-center">싫어요</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post: Post, index: number) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-xs text-gray-500 text-center">
                      {posts.length - index}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <Link href={`/boards/${resolvedParams.boardCode}/${post.id}`}>
                        <div className="flex items-center gap-3">
                          {post.thumbnail && (
                            <ThumbnailImage src={post.thumbnail} />
                          )}
                          <span className="text-sm font-normal text-gray-900 hover:text-blue-600">
                            {post.depth > 0 && (
                              <span className="inline-block text-gray-400" style={{ marginLeft: `${post.depth * 15}px` }}>
                                └&nbsp;
                              </span>
                            )}
                            {post.title}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{post.author}</td>
                    <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{post.view_count || 0}</td>
                    <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-xs text-green-600 text-center">{post.like_count || 0}</td>
                    <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-xs text-red-600 text-center">{post.dislike_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
