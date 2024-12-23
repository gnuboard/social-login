'use client';

import Image from 'next/image';

interface ThumbnailImageProps {
  src: string;
}

export default function ThumbnailImage({ src }: ThumbnailImageProps) {
  return (
    <div className="flex-shrink-0 w-12 h-12 relative overflow-hidden rounded">
      <Image
        src={src}
        alt="게시글 썸네일"
        fill
        className="object-cover"
        sizes="48px"
        onError={(e) => {
          console.error('썸네일 로딩 실패:', src);
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
} 