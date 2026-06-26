import type { User, Book, Loan, Institution, Event } from "@/types";
import { apiClient } from "./api";

// --- API shape adapters -----------------------------------------------------
// The Go API and the frontend disagree on a few field names/types, so we
// normalize at the service boundary instead of leaking the differences into
// the views.

// API users carry `score`; the UI uses `points`.
const normalizeUser = (raw: Record<string, unknown>): User => ({
  ...(raw as unknown as User),
  points: Number(raw?.score ?? raw?.points ?? 0),
});

// API serializes book ids as strings; the UI (and the loans endpoint) use numbers.
const normalizeBook = (raw: Record<string, unknown>): Book => ({
  ...(raw as unknown as Book),
  id: Number(raw?.id),
});

// Normalize the event shape: ids may arrive as strings, dates may be null.
const normalizeEvent = (raw: Record<string, unknown>): Event => ({
  id: Number(raw?.id),
  name: String(raw?.name ?? ""),
  description: String(raw?.description ?? ""),
  location: String(raw?.location ?? ""),
  date: (raw?.date as string | null) ?? null,
  institution_id: Number(raw?.institution_id ?? 0),
  created_at: (raw?.created_at as string | null) ?? null,
});

// The API binds dates as RFC3339 (time.Time); inputs may be `YYYY-MM-DD`.
const toRFC3339 = (value: string): string => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
};

export const userService = {
  async getMe(): Promise<User> {
    return normalizeUser(await apiClient.get<Record<string, unknown>>("/me"));
  },

  async getAllUsers(): Promise<User[]> {
    const users = await apiClient.get<Record<string, unknown>[]>("/users");
    return users.map(normalizeUser);
  },

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: "student" | "teacher";
    points: number;
    institution_id: number | null;
    address: string;
    document: string;
    cellphone: string;
    birthDate: string;
  }): Promise<{ id: number }> {
    return apiClient.post("/users", {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      institution_id: data.institution_id,
      address: data.address,
      document: data.document,
      cellphone: data.cellphone,
      score: data.points,
      birthDate: toRFC3339(data.birthDate),
    });
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/users/${id}`);
  },
};

export const institutionService = {
  async getAllInstitutions(): Promise<Institution[]> {
    return apiClient.get<Institution[]>("/institutions");
  },

  async getInstitution(id: number): Promise<Institution> {
    return apiClient.get<Institution>(`/institutions/${id}`);
  },

  // POST /institutions requires the admin role; all four fields are required
  // server-side (binding:"required").
  async createInstitution(data: {
    name: string;
    abbreviation: string;
    city: string;
    address: string;
  }): Promise<{ message: string }> {
    return apiClient.post("/institutions", data);
  },

  // PATCH /institutions/:id requires the admin role; it accepts partial fields,
  // so only send what was provided.
  async updateInstitution(
    id: number,
    data: {
      name?: string;
      abbreviation?: string;
      city?: string;
      address?: string;
    },
  ): Promise<{ message: string }> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.abbreviation !== undefined)
      payload.abbreviation = data.abbreviation;
    if (data.city !== undefined) payload.city = data.city;
    if (data.address !== undefined) payload.address = data.address;
    return apiClient.patch(`/institutions/${id}`, payload);
  },

  async deleteInstitution(
    id: number,
  ): Promise<{ message: string }> {
    return apiClient.delete(`/institutions/${id}`);
  },
};

export const bookService = {
  async getAllBooks(): Promise<Book[]> {
    const books = await apiClient.get<Record<string, unknown>[]>("/books");
    return books.map(normalizeBook);
  },

  async getBook(id: number): Promise<Book> {
    return normalizeBook(
      await apiClient.get<Record<string, unknown>>(`/books/${id}`),
    );
  },

  async createBook(data: {
    title: string;
    author: string;
    release_date: string;
    edition?: string;
    status: "available" | "lent";
  }): Promise<{ message: string }> {
    // The API sets created_at server-side (time.Now()); it's no longer part
    // of the request contract.
    return apiClient.post("/books", {
      title: data.title,
      author: data.author,
      release_date: toRFC3339(data.release_date),
      edition: data.edition,
      status: data.status,
    });
  },

  async updateBook(
    id: number,
    data: {
      title?: string;
      author?: string;
      release_date?: string;
      edition?: string;
      status?: "available" | "lent";
    },
  ): Promise<{ message: string }> {
    // PATCH /books/:id accepts partial fields; only send what was provided.
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.author !== undefined) payload.author = data.author;
    if (data.release_date !== undefined)
      payload.release_date = toRFC3339(data.release_date);
    if (data.edition !== undefined) payload.edition = data.edition;
    if (data.status !== undefined) payload.status = data.status;
    return apiClient.patch(`/books/${id}`, payload);
  },

  async deleteBook(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/books/${id}`);
  },
};

export const loanService = {
  async getAllLoans(): Promise<Loan[]> {
    return apiClient.get<Loan[]>("/loans");
  },

  async getUserLoans(userId: number): Promise<Loan[]> {
    const loans = await apiClient.get<Loan[]>("/loans");
    return loans.filter((l) => l.user_id === userId);
  },

  // POST /loans derives the borrower from the JWT; the body carries only the
  // book and the (required) return date, bound server-side as RFC3339.
  async borrowBook(bookId: number, returnDate: string): Promise<Loan> {
    return apiClient.post<Loan>("/loans", {
      book_id: bookId,
      return_date: toRFC3339(returnDate),
    });
  },

  async returnBook(loanId: number): Promise<Loan> {
    return apiClient.patch<Loan>(`/loans/${loanId}`, {});
  },

  async getLoan(loanId: number): Promise<Loan> {
    return apiClient.get<Loan>(`/loans/${loanId}`);
  },

  async deleteLoan(
    loanId: number,
  ): Promise<{ message: string }> {
    return apiClient.delete(`/loans/${loanId}`);
  },
};

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const list = await apiClient.get<Record<string, unknown>[]>("/events");
    return list.map(normalizeEvent);
  },

  async getEvent(id: number): Promise<Event> {
    return normalizeEvent(
      await apiClient.get<Record<string, unknown>>(`/events/${id}`),
    );
  },

  async createEvent(data: {
    name: string;
    description: string;
    location: string;
    date: string;
    institution_id: number;
  }): Promise<{ message: string }> {
    // POST /events expects the correctly-spelled `institution_id` and an
    // RFC3339 `date` (the API binds dates as time.Time).
    return apiClient.post("/events", { ...data, date: toRFC3339(data.date) });
  },

  // PATCH /events/:id accepts partial fields and is open to admin and teacher
  // roles; only send what was provided, RFC3339-encoding the date.
  async updateEvent(
    id: number,
    data: {
      name?: string;
      description?: string;
      location?: string;
      date?: string;
      institution_id?: number;
    },
  ): Promise<{ message: string }> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.location !== undefined) payload.location = data.location;
    if (data.date !== undefined) payload.date = toRFC3339(data.date);
    if (data.institution_id !== undefined)
      payload.institution_id = data.institution_id;
    return apiClient.patch(`/events/${id}`, payload);
  },

  async deleteEvent(
    id: number,
  ): Promise<{ message: string }> {
    return apiClient.delete(`/events/${id}`);
  },
};
