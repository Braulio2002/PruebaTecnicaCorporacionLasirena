import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Showtime, CreateShowtimeRequest, UpdateShowtimeRequest, ShowtimeFilters, PaginatedResponse } from '../types/showtimes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Configurar axios con interceptores
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(new Error(error.message || 'Request interceptor error'));
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(error.message || 'Response interceptor error'));
  }
);

export class ShowtimesService {
  /**
   * Obtener todos los turnos con filtros y paginación
   */
  static async getShowtimes(
    filters: ShowtimeFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Showtime>> {
    try {
      const params = new URLSearchParams();
      
      // Agregar parámetros de paginación
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Agregar filtros
      if (filters.movieId) {
        params.append('movieId', filters.movieId.toString());
      }
      if (filters.sala) {
        params.append('sala', filters.sala);
      }
      if (filters.fechaInicio) {
        params.append('fechaInicio', filters.fechaInicio);
      }
      if (filters.fechaFin) {
        params.append('fechaFin', filters.fechaFin);
      }
      if (filters.precioMin !== undefined) {
        params.append('precioMin', filters.precioMin.toString());
      }
      if (filters.precioMax !== undefined) {
        params.append('precioMax', filters.precioMax.toString());
      }
      
      const response: AxiosResponse<PaginatedResponse<Showtime>> = await api.get(
        `/api/turnos?${params.toString()}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener un turno por ID
   */
  static async getShowtimeById(id: number): Promise<Showtime> {
    try {
      const response: AxiosResponse<Showtime> = await api.get(`/api/turnos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching showtime ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Crear un nuevo turno
   */
  static async createShowtime(showtimeData: CreateShowtimeRequest): Promise<Showtime> {
    try {
      // Validar datos antes de enviar
      this.validateShowtimeData(showtimeData);
      
      const response: AxiosResponse<Showtime> = await api.post('/api/turnos', showtimeData);
      return response.data;
    } catch (error) {
      console.error('Error creating showtime:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Actualizar un turno existente
   */
  static async updateShowtime(id: number, showtimeData: UpdateShowtimeRequest): Promise<Showtime> {
    try {
      // Validar datos antes de enviar
      this.validateUpdateShowtimeData(showtimeData);
      
      const response: AxiosResponse<Showtime> = await api.put(`/api/turnos/${id}`, showtimeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating showtime ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Eliminar un turno
   */
  static async deleteShowtime(id: number): Promise<void> {
    try {
      await api.delete(`/api/turnos/${id}`);
    } catch (error) {
      console.error(`Error deleting showtime ${id}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener turnos por película
   */
  static async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    try {
      const response = await this.getShowtimes({ movieId }, 1, 100);
      return response.data;
    } catch (error) {
      console.error(`Error fetching showtimes for movie ${movieId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener turnos por fecha
   */
  static async getShowtimesByDate(date: string): Promise<Showtime[]> {
    try {
      const response = await this.getShowtimes({ 
        fechaInicio: date,
        fechaFin: date 
      }, 1, 100);
      return response.data;
    } catch (error) {
      console.error(`Error fetching showtimes for date ${date}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener turnos por sala
   */
  static async getShowtimesByRoom(sala: string): Promise<Showtime[]> {
    try {
      const response = await this.getShowtimes({ sala }, 1, 100);
      return response.data;
    } catch (error) {
      console.error(`Error fetching showtimes for room ${sala}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtener salas disponibles
   */
  static async getAvailableRooms(): Promise<string[]> {
    try {
      const response = await this.getShowtimes({}, 1, 1000);
      const rooms = [...new Set(response.data.map(showtime => showtime.sala))];
      return rooms.sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verificar disponibilidad de sala en horario específico
   */
  static async checkRoomAvailability(
    sala: string,
    fechaHora: string,
    duracion: number,
    excludeShowtimeId?: number
  ): Promise<boolean> {
    try {
      const startTime = new Date(fechaHora);
      const endTime = new Date(startTime.getTime() + duracion * 60000);
      
      const response = await this.getShowtimesByRoom(sala);
      
      const conflictingShowtimes = response.filter(showtime => {
        if (excludeShowtimeId && showtime.id === excludeShowtimeId) {
          return false;
        }
        
        const showtimeStart = new Date(showtime.fechaHora);
        const showtimeEnd = new Date(showtimeStart.getTime() + (showtime.movie?.duracion || 0) * 60000);
        
        // Verificar si hay solapamiento
        return (
          (startTime >= showtimeStart && startTime < showtimeEnd) ||
          (endTime > showtimeStart && endTime <= showtimeEnd) ||
          (startTime <= showtimeStart && endTime >= showtimeEnd)
        );
      });
      
      return conflictingShowtimes.length === 0;
    } catch (error) {
      console.error('Error checking room availability:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Validar datos de creación de turno
   */
  private static validateShowtimeData(data: CreateShowtimeRequest): void {
    if (!data.movieId) {
      throw new Error('Movie ID is required');
    }
    if (!data.fechaHora) {
      throw new Error('Date and time are required');
    }
    if (!data.sala || data.sala.trim() === '') {
      throw new Error('Room is required');
    }
    if (data.precio === undefined || data.precio <= 0) {
      throw new Error('Price must be greater than 0');
    }
    
    // Validar que la fecha no sea en el pasado
    const showtimeDate = new Date(data.fechaHora);
    const now = new Date();
    if (showtimeDate <= now) {
      throw new Error('Showtime date must be in the future');
    }
  }

  /**
   * Validar datos de actualización de turno
   */
  private static validateUpdateShowtimeData(data: UpdateShowtimeRequest): void {
    if (data.fechaHora) {
      const showtimeDate = new Date(data.fechaHora);
      const now = new Date();
      if (showtimeDate <= now) {
        throw new Error('Showtime date must be in the future');
      }
    }
    
    if (data.sala !== undefined && data.sala.trim() === '') {
      throw new Error('Room cannot be empty');
    }
    
    if (data.precio !== undefined && data.precio <= 0) {
      throw new Error('Price must be greater than 0');
    }
  }

  /**
   * Manejar errores de la API
   */
  private static handleError(error: unknown): Error {
    // Manejar errores de axios de forma segura sin usar `any`
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as Record<string, unknown> | undefined;

      switch (status) {
        case 400:
          return new Error((data && (data.message as string)) || 'Invalid request data');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Showtime not found');
        case 409:
          return new Error((data && (data.message as string)) || 'Conflict with existing data');
        case 422:
          return new Error((data && (data.message as string)) || 'Validation error');
        case 500:
          return new Error('Internal server error');
        default:
          return new Error(status ? `Server error: ${status}` : 'Server error');
      }
    }

    // Errores de red u otros objetos con request
    if (typeof error === 'object' && error !== null && 'request' in error) {
      return new Error('Network error - please check your connection');
    }

    // Error genérico
    if (error instanceof Error) {
      return new Error(error.message || 'An unexpected error occurred');
    }

    return new Error(String(error) || 'An unexpected error occurred');
  }
}

export default ShowtimesService;