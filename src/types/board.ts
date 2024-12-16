// src/types/board.ts
export interface Board {
    id: number;
    code: string;
    title: string;
    description: string;
    category: string;
    list_level: number;
    read_level: number;
    write_level: number;
    comment_level: number;
    posts_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }

  export interface BoardFormData {
    code: string;
    title: string;
    description: string;
    category: string;
  }