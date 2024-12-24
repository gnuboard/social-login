"use client";

import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useRouter } from 'next/navigation';
import { BoardFormData } from '@/types';
import Link from 'next/link';

export default function NewBoardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<BoardFormData>({
    code: '',
    title: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '게시판 생성 실패');
      }
      
      router.push('/admin/boards');
    } catch (error) {
      console.error('게시판 생성 중 오류:', error);
      alert(error instanceof Error ? error.message : '게시판 생성에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">게시판 추가</h2>
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
                onChange={(e) => {
                  if (e.target.value === '' || /^[a-zA-Z0-9-_]+$/.test(e.target.value)) {
                    handleChange(e);
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                required
                placeholder="영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능"
                pattern="^[a-zA-Z0-9-_]+$"
                title="영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다"
              />
              <p className="mt-1 text-sm text-gray-500">
                게시판을 구분하는 고유 코드입니다. 생성 후 변경할 수 없습니다.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                required
                placeholder="게시판 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                placeholder="게시판에 대한 설명을 입력하세요"
              />
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
                생성하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
} 