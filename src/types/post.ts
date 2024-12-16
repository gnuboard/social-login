// src/types/post.ts
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