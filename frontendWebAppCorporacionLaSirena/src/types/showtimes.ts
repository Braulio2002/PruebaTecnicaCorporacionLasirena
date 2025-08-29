export interface Showtime {
  id: number;
  movieId: number;
  fechaHora: string;
  sala: string;
  precio: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  movie?: {
    id: number;
    titulo: string;
    duracion: number;
    genero: string;
    rating: string;
    descripcion?: string;
    director?: string;
    actores?: string;
    fechaEstreno?: string;
    posterUrl?: string;
  };
}

export interface CreateShowtimeRequest {
  movieId: number;
  fechaHora: string;
  sala: string;
  precio: number;
}

export interface UpdateShowtimeRequest extends Partial<CreateShowtimeRequest> {
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShowtimeFilters {
  movieId?: number;
  sala?: string;
  fechaInicio?: string;
  fechaFin?: string;
  precioMin?: number;
  precioMax?: number;
  isActive?: boolean;
}