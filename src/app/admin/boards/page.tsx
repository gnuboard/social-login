"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';
import { Board, BoardFormData } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: number;
  name: string;
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<BoardFormData>({
    code: '',
    title: '',
    description: '',
    category: null,
  });
  const [editBoardId, setEditBoardId] = useState<number | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    order_num: 0
  });
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [selectedBoardForCategory, setSelectedBoardForCategory] = useState<Board | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/admin/boards');
      const data = await response.json();
      
      // 각 게시판의 카테고리 정보를 함께 가져오기
      const boardsWithCategories = await Promise.all(
        data.boards.map(async (board) => {
          try {
            const categoryResponse = await fetch(`/api/admin/boards/${board.id}/categories`);
            const categoryData = await categoryResponse.json();
            return {
              ...board,
              categories: categoryData.categories || []
            };
          } catch (error) {
            console.error(`게시판 ${board.id}의 카테고리 조회 실패:`, error);
            return {
              ...board,
              categories: []
            };
          }
        })
      );

      setBoards(boardsWithCategories);
    } catch (error) {
      console.error('게시판 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (boardId: number) => {
    try {
      const response = await fetch(`/api/admin/boards/${boardId}/categories`);
      
      // 응답 상태 및 데이터 로깅
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || '카테고리 로드 실패');
      }

      if (!Array.isArray(data.categories)) {
        console.error('Unexpected data format:', data);
        throw new Error('카테고리 데이터 형식이 올바르지 않습니다.');
      }

      setCategories(data.categories);
    } catch (error) {
      console.error('카테고리 로드 상세 오류:', error);
      setCategories([]);
      throw error; // 상위 컴포넌트에서 에러 처리 가능하도록
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

      // 성공 시 목록만 새로고침고 폼 데이터와 editBoardId는 유지
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

  const handleEdit = async (board: Board) => {
    // 수정 페이지로 이동
    window.location.href = `/admin/boards/${board.id}/edit`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const response = await fetch(`/api/admin/boards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoardForCategory) return;

    try {
      const method = editCategoryId ? 'PUT' : 'POST';
      const url = editCategoryId 
        ? `/api/admin/boards/${selectedBoardForCategory.id}/categories/${editCategoryId}` 
        : `/api/admin/boards/${selectedBoardForCategory.id}/categories`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '카테고리 저장 실패');
      }

      // 성공 시 처리
      setCategoryModalOpen(false);
      setCategoryFormData({ name: '', description: '', order_num: 0 });
      setEditCategoryId(null);
      setSelectedBoardForCategory(null);
      fetchCategories(); // 카테고리 목록 새로고침
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error);
      alert(error instanceof Error ? error.message : '카테고리 저장에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!editBoardId || !confirm('이 카테고리를 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/admin/boards/${editBoardId}/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('카테고리 삭제 실패');
      await fetchCategories(editBoardId); // 카테고리 목록만 새로고침
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const handleCategoryClick = (board: Board) => {
    setSelectedBoardForCategory(board);
    setCategoryModalOpen(true);
  };

  const handleAddCategory = async () => {
    if (!editBoardId || !newCategoryName.trim()) return;

    try {
      const response = await fetch(`/api/admin/boards/${editBoardId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) throw new Error('카테고리 추가 실패');

      await fetchCategories(editBoardId);
      setNewCategoryName(''); // 입력 필드만 초기화
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    if (!categoryInput.trim() || !editBoardId) return;
    try {
      const response = await fetch(`/api/admin/boards/${editBoardId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryInput }),
      });
      if (!response.ok) throw new Error('카테고리 수정 실패');
      fetchCategories(editBoardId);
      setCategoryInput('');
      setEditCategoryId(null);
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleCategoryUpdate = async (categoryId: number, newName: string) => {
    if (!newName.trim() || !editBoardId) return;

    try {
      const response = await fetch(`/api/admin/boards/${editBoardId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error('카테고리 수정 실패');
      }

      // 카테고리 목록 새로고침
      await fetchCategories(editBoardId);
      
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleCategoryKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    categoryId: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      await handleCategoryUpdate(categoryId, target.value);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!editBoardId) {
      console.error('게시판 ID가 없습니다.');
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      const newCategories = arrayMove(categories, oldIndex, newIndex).map(
        (category, index) => ({ ...category, order_num: index + 1 })
      );

      setCategories(newCategories);

      try {
        const response = await fetch(`/api/admin/boards/${editBoardId}/categories/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categories: newCategories }),
        });

        if (!response.ok) {
          throw new Error('카테고리 순서 변경 실패');
        }
      } catch (error) {
        console.error('카테고리 순서 변경 오류:', error);
        alert('카테고리 순서 변경에 실패했습니다.');
        // 실패시 원래 순서로 복구
        if (editBoardId) {
          await fetchCategories(editBoardId);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setEditBoardId(null);
    setFormData({ code: '', title: '', description: '' });
    setCategories([]);
    setCategoryInput('');
    setEditCategoryId(null);
  };

  const SortableItem = React.memo(({ category, onKeyPress, onDelete }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: category.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);

    const handleEdit = async () => {
      if (!editBoardId) return;
      
      try {
        const response = await fetch(`/api/admin/boards/${editBoardId}/categories/${category.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: editName.trim() }),
        });

        if (!response.ok) {
          throw new Error('카테고리 수정 실패');
        }

        await fetchCategories(editBoardId);
        setIsEditing(false);
      } catch (error) {
        console.error('카테고리 수정 오류:', error);
        alert('카테고리 수정에 실패했습니다.');
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-2 bg-white border rounded shadow-sm"
      >
        <span {...attributes} {...listeners} className="cursor-move text-gray-400">⋮⋮</span>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border rounded px-2 py-1 flex-1 text-sm"
              autoFocus
            />
            <button
              onClick={handleEdit}
              className="text-green-600 text-sm hover:text-green-800 mr-2"
            >
              저장
            </button>
          </>
        ) : (
          <>
            <span className="flex-1">{category.name}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 text-sm hover:text-blue-800 mr-2"
            >
              수정
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(category.id)}
          className="text-red-500 text-sm hover:text-red-700"
        >
          삭제
        </button>
      </div>
    );
  });

  SortableItem.displayName = 'SortableItem';

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
            <Link 
              href="/admin/boards/new"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              게시판 추가
            </Link>
          </div>
        </div>

        {boards.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  코드
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  게시물 수
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boards.map((board) => (
                <tr key={board.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link 
                      href={`/boards/${board.code}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {board.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{board.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>카테고리 ({board.categories?.length || 0})</option>
                      {board.categories?.length > 0 ? (
                        board.categories
                          .sort((a, b) => a.order_num - b.order_num)
                          .map((category) => (
                            <option key={category.id} value={category.id} disabled>
                              {category.name}
                            </option>
                          ))
                      ) : (
                        <option disabled>-없음-</option>
                      )}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{board.posts_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(board.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(board)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(board.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
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

        {/* 카테고�� 모달 */}
        {categoryModalOpen && selectedBoardForCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedBoardForCategory.title} 게시판의 카테고리 관리
                </h3>
                <button
                  onClick={() => {
                    setCategoryModalOpen(false);
                    setSelectedBoardForCategory(null);
                    setEditCategoryId(null);
                    setCategoryFormData({ name: '', description: '', order_num: 0 });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => {
                    setEditCategoryId(null);
                    setCategoryFormData({ name: '', description: '', order_num: 0 });
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  새 카테고리 추가
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      defaultValue={category.name}
                      className="border rounded px-2 py-1 flex-1"
                      onKeyPress={(e) => handleCategoryKeyPress(e, category.id)}
                    />
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>

              {/* 카테고리 추가/수정 폼 */}
              <form onSubmit={handleCategorySubmit} className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700">순서</label>
                    <input
                      type="number"
                      value={categoryFormData.order_num}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, order_num: parseInt(e.target.value) || 0 }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">설명</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
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
      </div>
    </AdminLayout>
  );
}