'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');

  const techStacks = [
    { value: 'react', label: 'React' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'django', label: 'Django' },
    { value: 'fastapi', label: 'FastAPI' },
    { value: 'flask', label: 'Flask' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'java', label: 'Java' },
    { value: 'spring', label: 'Spring' },
    { value: 'aws', label: 'AWS' },
    { value: 'php', label: 'PHP' },
    { value: 'laravel', label: 'Laravel' },
    { value: 'codeigniter', label: 'CodeIgniter' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'redis', label: 'Redis' },
    { value: 'oracle', label: 'Oracle' },
    { value: 'mssql', label: 'MS SQL' }
  ];

  const toggleTech = (tech: string) => {
    setSelectedTech(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          techStack: selectedTech,
          budget: Number(budget),
          duration: Number(duration)
        }),
      });

      if (!response.ok) {
        throw new Error('프로젝트 등록에 실패했습니다.');
      }

      router.push('/projects'); // 프로젝트 목록 페이지로 이동
    } catch (error) {
      alert('프로젝트 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">새 프로젝트 등록</h1>
      
      <form className="max-w-2xl" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">프로젝트 제목</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">프로젝트 설명</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 h-32 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">기술 스택</label>
          <div className="flex flex-wrap gap-2">
            {techStacks.map((tech) => (
              <button
                key={tech.value}
                type="button"
                onClick={() => toggleTech(tech.value)}
                className={`px-4 py-2 rounded-full border ${
                  selectedTech.includes(tech.value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
              >
                {tech.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">예산</label>
            <div className="relative">
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">예상 기간</label>
            <div className="relative w-48">
              <input 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-24 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">개월 이하</span>
            </div>
          </div>
        </div>
        
        <button 
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          프로젝트 등록
        </button>
      </form>
    </div>
  );
} 