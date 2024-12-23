"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';
import { Board, BoardFormData } from '@/types';

interface Category {
  id: number;
  name: string;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<BoardFormData>({
    code: '',
    title: '',
    description: '',
    category: ''
  });
  const [editBoardId, setEditBoardId] = useState<number | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    order_num: 0
  });
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchBoards();
    fetchCategories();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/admin/boards');
      const data = await response.json();
      setBoards(data.boards);
    } catch (error) {
      console.error('게시판 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('카테고리 조회 실패');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('카테고리 조회 중 오류:', error);
      alert('카테고리 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editBoardId ? 'PUT' : 'POST';
      const url = editBoardId ? `/api/admin/boards/${editBoardId}` : '/api/admin/boards';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('게시판 저장 실패');
      }

      // 성공 시 모달 닫고 목록 새로고침
      setIsModalOpen(false);
      setFormData({ code: '', title: '', description: '', category: '' });
      setEditBoardId(null);
      fetchBoards();
    } catch (error) {
      console.error('게시판 저장 중 오류:', error);
      alert('게시판 저장에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (board: Board) => {
    setFormData({
      code: board.code,
      title: board.title,
      description: board.description,
      category: board.category
    });
    setEditBoardId(board.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, isDeleted: boolean) => {
    const message = isDeleted ? 
      '정말 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.' : 
      '정말 삭제하시겠습니까?';
    
    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/admin/boards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permanent: isDeleted }) // 영구 삭제 여부 전달
      });

      if (!response.ok) {
        throw new Error('게시판 삭제 실패');
      }

      fetchBoards();
    } catch (error) {
      console.error('게시판 삭제 중 오류:', error);
      alert('게시판 삭제에 실패했습니다.');
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('게시판을 복구하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/boards/${id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('게시판 복구 실패');
      }

      fetchBoards();
    } catch (error) {
      console.error('게시판 복구 중 오류:', error);
      alert('게시판 복구에 실패했습니다.');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editCategoryId ? 'PUT' : 'POST';
      const url = editCategoryId 
        ? `/api/admin/categories/${editCategoryId}` 
        : '/api/admin/categories';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '카테고리 저장 실패');
      }

      setCategoryModalOpen(false);
      setCategoryFormData({ name: '', description: '', order_num: 0 });
      setEditCategoryId(null);
      fetchCategories();
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error);
      alert(error instanceof Error ? error.message : '카테고리 저장에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('카테고리 삭제 실패');
      fetchCategories();
    } catch (error) {
      console.error('카테고리 삭제 중 오류:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">게시판 관리</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              게시판 추가
            </button>
          </div>
        </div>

        {boards.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  게시물 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boards.map((board) => (
                <tr key={board.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {board.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {board.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link 
                      href={`/boards/${board.code}`} 
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {board.code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {board.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {board.posts_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(board.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {board.deleted_at ? '삭제됨' : '활성'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {board.deleted_at ? (
                    <>
                        <button 
                        onClick={() => handleRestore(board.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                        >
                        복구
                        </button>
                        <button 
                        onClick={() => handleDelete(board.id, true)}
                        className="text-red-600 hover:text-red-900"
                        >
                        영구삭제
                        </button>
                    </>
                    ) : (
                    <>
                        <button 
                        onClick={() => handleEdit(board)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                        수정
                        </button>
                        <button 
                        onClick={() => handleDelete(board.id, false)}
                        className="text-red-600 hover:text-red-900"
                        >
                        삭제
                        </button>
                    </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 게시판이 없습니다.</p>
            <p className="text-gray-400 mt-2">
              상단의 '게시판 추가' 버튼을 클릭하여 새 게시판을 만들어보세요.
            </p>
          </div>
        )}

        {/* 게시판 추가/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">{editBoardId ? '게시판 수정' : '새 게시판 추가'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">코드</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={!!editBoardId} // 수정 시 코드는 변경 불가
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">제목</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">설명</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">카테고리</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditBoardId(null);
                      setFormData({ code: '', title: '', description: '', category: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    {editBoardId ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 카테고리 관리 섹션 */}
        <div className="mt-8 p-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">카테고리 관리</h3>
            <button 
              onClick={() => setCategoryModalOpen(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              카테고리 추가
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex flex-col p-4 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{category.name}</span>
                  <div>
                    <button
                      onClick={() => {
                        setEditCategoryId(category.id);
                        setCategoryFormData({
                          name: category.name,
                          description: category.description || '',
                          order_num: category.order_num
                        });
                        setCategoryModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
                <span className="text-xs text-gray-500 mt-2">���서: {category.order_num}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리 모달 */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editCategoryId ? '카테고리 수정' : '새 카테고리 추가'}
            </h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">카테고리명</label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">설명</label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">정렬 순서</label>
                  <input
                    type="number"
                    value={categoryFormData.order_num}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, order_num: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setEditCategoryId(null);
                    setCategoryFormData({ name: '', description: '', order_num: 0 });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editCategoryId ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}