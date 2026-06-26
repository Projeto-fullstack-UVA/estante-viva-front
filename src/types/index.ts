export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  points: number;
  institution_id: number | null;
  address?: string;
  document?: string;
  cellphone?: string;
  birthDate?: string;
  created_at: string;
}

export interface Institution {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
  address: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  release_date: string;
  edition?: string;
  status: "available" | "lent";
  created_at: string;
}

export interface Loan {
  id: number;
  user_id: number;
  book_id: number;
  return_date: string;
  returned_at: string | null;
  book_title?: string;
  book_author?: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  date: string | null;
  institution_id: number;
  created_at: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}
