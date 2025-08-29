import axios from 'axios';
import type { 
  Movie, 
  CreateMovieRequest, 
  UpdateMovieRequest, 
  MoviesResponse, 
  MovieFilters 
} from '../types/movies';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const moviesAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las requests
moviesAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(new Error(error.message || 'Request failed'));
  }
);

// Interceptor para manejar respuestas y errores
moviesAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    
    // Extraer mensaje de error más específico
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error inesperado';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export const moviesService = {
  // Obtener todas las películas con filtros opcionales
  async getMovies(filters?: MovieFilters): Promise<MoviesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.genero) params.append('genre', filters.genero);
    if (filters?.rating) params.append('rating', filters.rating);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await moviesAPI.get(`/movies?${params.toString()}`);
    return {
      data: response.data.movies,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages
    };
  },

  // Obtener una película por ID
  async getMovieById(id: number): Promise<Movie> {
    const response = await moviesAPI.get<{ data: Movie }>(`/movies/${id}`);
    return response.data.data;
  },

  // Crear una nueva película
  async createMovie(movieData: CreateMovieRequest): Promise<Movie> {
    const response = await moviesAPI.post<{ data: Movie }>('/movies', movieData);
    return response.data.data;
  },

  // Actualizar una película existente
  async updateMovie(id: number, movieData: UpdateMovieRequest): Promise<Movie> {
    const response = await moviesAPI.put<{ data: Movie }>(`/movies/${id}`, movieData);
    return response.data.data;
  },

  // Eliminar una película
  async deleteMovie(id: number): Promise<void> {
    await moviesAPI.delete(`/movies/${id}`);
  },

  // Obtener géneros únicos (útil para filtros)
  async getGenres(): Promise<string[]> {
    try {
      const response = await moviesAPI.get<{ data: string[] }>('/movies/genres');
      return response.data.data;
    } catch {
      // Si el endpoint no existe, extraer géneros de las películas
      const movies = await this.getMovies({ limit: 1000 });
      const genres = [...new Set(movies.data.map((movie: Movie) => movie.genero))];
      return genres.sort((a, b) => a.localeCompare(b));
    }
  },

  // Obtener ratings únicos (útil para filtros)
  async getRatings(): Promise<string[]> {
    try {
      const response = await moviesAPI.get<{ data: string[] }>('/movies/ratings');
      return response.data.data;
    } catch {
      // Si el endpoint no existe, extraer ratings de las películas
      const movies = await this.getMovies({ limit: 1000 });
      const ratings = [...new Set(movies.data.map((movie: Movie) => movie.rating))];
      return ratings.sort((a, b) => a.localeCompare(b));
    }
  },

  // Validar si una película tiene turnos asociados
  async hasShowtimes(movieId: number): Promise<boolean> {
    try {
      const response = await moviesAPI.get<{ data: { hasShowtimes: boolean } }>(`/movies/${movieId}/showtimes/check`);
      return response.data.data.hasShowtimes;
    } catch {
      // Si el endpoint no existe, asumir que no tiene turnos
      return false;
    }
  }
};

export default moviesAPI;