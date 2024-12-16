// app/types/index.ts

export interface User {
    id: number;
    uuid: string;
    email: string;
    name: string;
    provider: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }
  
  export interface Board {
    id: number;
    title: string;
    content: string;
    author: string;
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
  
  export interface Post {
    id: number;
    board_id: number;
    user_id: number;
    author: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    view_count: number;
    comments_count: number;
    attachment_count: number;
  }