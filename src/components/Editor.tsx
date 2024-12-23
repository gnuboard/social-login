 'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>로딩중...</p>,
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const Editor = ({ value, onChange }: EditorProps) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      className="h-[300px] mb-12"
    />
  );
};

export default Editor;