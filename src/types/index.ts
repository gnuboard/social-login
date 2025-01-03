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
  posts_count: number;
}

export interface BoardFormData {
  code: string;
  title: string;
  description: string;
  category: string;
}

export interface Post {
  id: number;
  group_id: number;
  sequence: number;
  depth: number;
  board_id: number;
  user_id: number;
  author: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  view_count: number;
  like_count: number;
  dislike_count: number;
  comments_count: number;
  attachment_count: number;
  }

export interface RouteParams {
  params: {
    boardCode: string;
    postId: string;
  }
}
  
export interface Comment {
  id: number;
  content: string;
  author: string;
  created_at: string;
  parent_id: number | null;
  replies: Comment[];
}

export interface Category {
  id: number;
  board_id: number;
  name: string;
  description: string | null;
  order_num: number;
  created_at: string;
}