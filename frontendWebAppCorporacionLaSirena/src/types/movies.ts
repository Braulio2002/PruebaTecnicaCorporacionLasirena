export interface Movie {
  id: number;
  titulo: string;
  descripcion: string;
  genero: string;
  duracion: number;
  rating: string;
  fechaEstreno: string;
  director?: string;
  actores?: string;
  posterUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMovieRequest {
  titulo: string;
  descripcion: string;
  genero: string;
  duracion: number;
  rating: string;
  fechaEstreno: string;
  director?: string;
  actores?: string;
  posterUrl?: string;
}

export interface UpdateMovieRequest extends Partial<CreateMovieRequest> {
  isActive?: boolean;
}

export interface MoviesResponse {
  data: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieFilters {
  search?: string;
  genero?: string;
  rating?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}