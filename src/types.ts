export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionStatus = 'Draft' | 'Published';
export type ProgressStatus = 'solved' | 'retry' | 'none';
export type VoteType = 'up' | 'down';
export type UserRole = 'user' | 'admin';

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Question {
  id: string;
  question: string;
  category_id: string;
  category_name?: string; // joined or resolved
  difficulty: Difficulty;
  tags: string[];
  url_1?: string;
  url_2?: string;
  status: QuestionStatus;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  plain_password?: string; // Visible plain text for newly created administrative users
}

export interface UserProgress {
  id: string;
  user_id: string;
  question_id: string;
  status: ProgressStatus;
  notes: string;
  updated_at: string;
}

export interface UserVote {
  id: string;
  user_id: string;
  question_id: string;
  vote: VoteType;
  created_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
}
