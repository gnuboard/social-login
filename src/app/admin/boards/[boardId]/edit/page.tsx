"use client";

import React, { useEffect, useState, useRef, use } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useRouter } from 'next/navigation';
import { Board, BoardFormData } from '@/types';
import Link from 'next/link';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
}

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  editingCategory: Category | null;
  editCategoryInputRef: React.RefObject<HTMLInputElement>;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  setEditingCategory: React.Dispatch<React.SetStateAction<{id: string, name: string} | null>>;
}

export default function EditBoardPage({ params }: { params: { boardId: string } }) {
  const { boardId } = use(params);
  
  return (
    <EditBoardForm boardId={boardId} />
  );
}

const EditingCategoryItem = React.memo(({ 
  category,
  editingCategory,
  editCategoryInputRef,
  onUpdate,
  onCancelEdit,
  setEditingCategory
}: Partial<CategoryItemProps>) => (
  <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
    <div className="flex items-center gap-2 w-full">
      <input
        ref={editCategoryInputRef}
        type="text"
        value={editingCategory?.name || ''}
        onChange={(e) => {
          if (editingCategory && setEditingCategory) {
            setEditingCategory({
              ...editingCategory,
              name: e.target.value
            });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onUpdate?.();
          } else if (e.key === 'Escape') {
            onCancelEdit?.();
          }
        }}
        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={onUpdate}
        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        저장
      </button>
      <button
        type="button"
        onClick={onCancelEdit}
        className="px-3 py-1 text-gray-600 hover:text-red-600"
      >
        취소
      </button>
    </div>
  </div>
));

EditingCategoryItem.displayName = 'EditingCategoryItem';

const DraggableCategoryItem = React.memo(({ 
  category,
  onEdit,
  onDelete
}: Partial<CategoryItemProps>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category!.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!category) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white p-3 rounded-md shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-2 w-full">
        <span 
          {...listeners} 
          className="flex items-center gap-2 flex-1 cursor-move text-sm"
        >
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 8h16M4 16h16" 
            />
          </svg>
          {category.name}
        </span>
        <button
          type="button"
          onClick={() => onEdit && onEdit(category)}
          className="px-3 py-1 text-gray-600 hover:text-blue-600 text-sm"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => onDelete && onDelete(category.id)}
          className="px-3 py-1 text-gray-600 hover:text-red-600 text-sm"
        >
          삭제
        </button>
      </div>
    </div>
  );
});

DraggableCategoryItem.displayName = 'DraggableCategoryItem';

const CategoryList = React.memo(({ 
  categories,
  editingCategory,
  editCategoryInputRef,
  handleEditCategory,
  handleDeleteCategory,
  handleUpdateCategory,
  setEditingCategory,
  sensors,
  handleDragEnd 
}) => (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
  >
    <SortableContext
      items={categories.map(cat => cat.id)}
      strategy={verticalListSortingStrategy}
    >
      {categories.map((category) => {
        const isEditing = editingCategory?.id === category.id;
        
        if (isEditing) {
          return (
            <EditingCategoryItem
              key={category.id}
              category={category}
              editingCategory={editingCategory}
              editCategoryInputRef={editCategoryInputRef}
              onUpdate={handleUpdateCategory}
              onCancelEdit={() => setEditingCategory(null)}
              setEditingCategory={setEditingCategory}
            />
          );
        }

        return (
          <DraggableCategoryItem
            key={category.id}
            id={category.id}
            category={category}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        );
      })}
    </SortableContext>
  </DndContext>
));

CategoryList.displayName = 'CategoryList';

function EditBoardForm({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<BoardFormData>({
    code: '',
    title: '',
    description: '',
  });
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const editCategoryInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/boards/${boardId}`),
      fetch(`/api/admin/boards/${boardId}/categories`)
    ])
      .then(async ([boardResponse, categoriesResponse]) => {
        if (!boardResponse.ok) throw new Error('게시판 로딩 실패');
        if (!categoriesResponse.ok) throw new Error('카테고리 로딩 실패');

        const boardData = await boardResponse.json();
        const categoriesData = await categoriesResponse.json();

        setFormData({
          code: boardData.code || '',
          title: boardData.title || '',
          description: boardData.description || '',
        });

        const categoryArray = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || [];
        setCategories(categoryArray);
      })
      .catch(error => {
        console.error('데이터 로딩 중 오류:', error);
        alert('데이터를 불러오는데 실패했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [boardId]);

  useEffect(() => {
    if (editingCategory && editCategoryInputRef.current) {
      editCategoryInputRef.current.focus();
    }
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, categories }),
      });

      if (!response.ok) throw new Error('게시판 수정 실패');
      
      router.push('/admin/boards');
    } catch (error) {
      console.error('게시판 수정 중 오류:', error);
      alert('게시판 수정에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = async (inputName: string) => {
    if (!inputName || !inputName.trim()) return;

    const trimmedName = inputName.trim();

    try {
      const response = await fetch(`/api/admin/boards/${boardId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) throw new Error('카테고리 추가 실패');

      const newCategoryData = await response.json();
      console.log('서버 응답:', newCategoryData);

      const categoryId = newCategoryData.category?.id || newCategoryData.id;
      const newName = newCategoryData.category?.name || newCategoryData.name || trimmedName;

      if (!categoryId) {
        console.error('서버 응답 데이터:', newCategoryData);
        throw new Error('카테고리 추가 실패: 유효하지 않은 응답');
      }

      const categoryToAdd = {
        id: categoryId,
        name: newName,
        order_num: categories.length
      };

      console.log('추가할 카테고리:', categoryToAdd);
      
      setCategories(prevCategories => {
        const updatedCategories = [...prevCategories, categoryToAdd];
        console.log('업데이트된 카테고리들:', updatedCategories);
        return updatedCategories;
      });
      
      setNewCategory('');
    } catch (error) {
      console.error('카테고리 추가 중 오류:', error);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  const handleEditCategory = (category: Category) => {
    if (editingCategory) return;
    
    setEditingCategory({
      id: category.id,
      name: category.name
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    fetch(`/api/admin/boards/${boardId}/categories/${editingCategory.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: editingCategory.name.trim() }),
    })
      .then(response => {
        if (!response.ok) throw new Error('카테고리 수정 실패');
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? editingCategory : cat
        ));
        setEditingCategory(null);
      })
      .catch(error => {
        console.error('카테고리 수정 중 오류:', error);
        alert('카테고리 수정에 실패했습니다.');
        setEditingCategory(null);
      });
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return;
    
    fetch(`/api/admin/boards/${boardId}/categories/${id}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) throw new Error('카테고리 삭제 실패');
        setCategories(categories.filter(cat => cat.id !== id));
      })
      .catch(error => {
        console.error('카테고리 삭제 중 오류:', error);
        alert('카테고리 삭제에 실패했습니다.');
      });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // API 호출 시 order_num으로 필드명 수정
      try {
        const response = await fetch(`/api/admin/boards/${boardId}/categories/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categories: newCategories.map((cat, index) => ({
              id: cat.id,
              order_num: index  // order를 order_num으로 변경
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('카테고리 순서 변경 실패');
        }
      } catch (error) {
        console.error('카테고리 순서 변경 중 오류:', error);
        alert('카테고리 순서 변경에 실패했습니다.');
        setCategories(categories);
      }
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">게시판 수정</h2>
            <Link
              href="/admin/boards"
              className="text-gray-600 hover:text-gray-900"
            >
              목록으로 돌아가기
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">코드</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                disabled
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
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">카테고리 관리</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory(newCategory);
                    }
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="새 카테고리 이름"
                />
                <button
                  type="button"
                  onClick={() => handleAddCategory(newCategory)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  추가
                </button>
              </div>

              <div className="space-y-2">
                <CategoryList
                  categories={categories}
                  editingCategory={editingCategory}
                  editCategoryInputRef={editCategoryInputRef}
                  handleEditCategory={handleEditCategory}
                  handleDeleteCategory={handleDeleteCategory}
                  handleUpdateCategory={handleUpdateCategory}
                  setEditingCategory={setEditingCategory}
                  sensors={sensors}
                  handleDragEnd={handleDragEnd}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/boards"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </Link>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                수정하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
} 