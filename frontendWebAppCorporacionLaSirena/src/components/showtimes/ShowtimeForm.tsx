import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import ShowtimesService from '../../services/showtimesService';
import { moviesService } from '../../services/moviesService';
import type { Showtime, CreateShowtimeRequest, UpdateShowtimeRequest } from '../../types/showtimes';
import type { Movie } from '../../types/movies';

interface ShowtimeFormProps {
  showtime?: Showtime | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type FormData = {
  movieId: number | '';
  fecha: Dayjs | null;
  hora: Dayjs | null;
  sala: string;
  precio: string;
};

const ShowtimeForm: React.FC<ShowtimeFormProps> = ({ showtime, onSuccess, onCancel }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    movieId: showtime?.movieId ?? '',
    fecha: showtime?.fechaHora ? dayjs(showtime.fechaHora) : null,
    hora: showtime?.fechaHora ? dayjs(showtime.fechaHora) : null,
    sala: showtime?.sala ?? '',
    precio: showtime?.precio !== undefined ? String(showtime.precio) : ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoadingMovies(true);
  const response = await moviesService.getMovies({ page: 1, limit: 100 });
  setMovies(response.data);
    } catch (err) {
      console.error('Error al cargar películas:', err);
      setError('Error al cargar las películas disponibles');
    } finally {
      setLoadingMovies(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.movieId === '' || formData.movieId === undefined) {
      newErrors.movieId = 'La película es requerida';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida';
    }

    if (!formData.sala) {
      newErrors.sala = 'La sala es requerida';
    } else {
      const salaNum = parseInt(formData.sala.toString());
      if (isNaN(salaNum) || salaNum < 1 || salaNum > 20) {
        newErrors.sala = 'La sala debe ser un número entre 1 y 20';
      }
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es requerido';
    } else {
      const precioNum = parseFloat(formData.precio.toString());
      if (isNaN(precioNum) || precioNum <= 0) {
        newErrors.precio = 'El precio debe ser un número mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construir fechaHora combinando fecha y hora (formato YYYY-MM-DDTHH:mm:ss)
      const fecha = formData.fecha!;
      const hora = formData.hora!;
      const fechaHora = `${fecha.format('YYYY-MM-DD')}T${hora.format('HH:mm:ss')}`;

      const requestData = {
        movieId: formData.movieId as number,
        fechaHora,
        sala: formData.sala,
        precio: parseFloat(formData.precio.toString())
      };

      if (showtime) {
        // Update existing showtime
        await ShowtimesService.updateShowtime(showtime.id, requestData as UpdateShowtimeRequest);
      } else {
        // Create new showtime
        await ShowtimesService.createShowtime(requestData as CreateShowtimeRequest);
      }

      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al guardar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value } as unknown as FormData));
    // Clear error when user starts typing
    if (errors[String(field)]) {
      setErrors(prev => ({ ...prev, [String(field)]: '' }));
    }
  };

  if (loadingMovies) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // establecer locale de Dayjs
  dayjs.locale('es');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid sx={{ width: { xs: '100%' } }}>
            <FormControl fullWidth error={!!errors.movieId}>
              <InputLabel>Película *</InputLabel>
              <Select<number | ''>
                value={formData.movieId}
                onChange={(e) => handleInputChange('movieId', e.target.value as unknown as number | '')}
                label="Película *"
              >
                {movies.map((movie) => (
                  <MenuItem key={movie.id} value={movie.id}>
                    <Box>
                      <Typography variant="body1">{movie.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {movie.genero} • {movie.duracion} min • {movie.rating}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.movieId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.movieId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <DatePicker
              label="Fecha *"
              value={formData.fecha}
              onChange={(value) => handleInputChange('fecha', value as Dayjs | null)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.fecha,
                  helperText: errors.fecha
                }
              }}
              minDate={dayjs()}
            />
          </Grid>

          <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TimePicker
              label="Hora *"
              value={formData.hora}
              onChange={(value) => handleInputChange('hora', value as Dayjs | null)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.hora,
                  helperText: errors.hora
                }
              }}
              ampm={false}
            />
          </Grid>

          <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
            <TextField
              fullWidth
              label="Sala *"
              type="number"
              value={formData.sala}
              onChange={(e) => handleInputChange('sala', e.target.value)}
              error={!!errors.sala}
              helperText={errors.sala || 'Número de sala (1-20)'}
              slotProps={{ input: { inputProps: { min: 1, max: 20 } } }}
            />
          </Grid>

          <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ ml: 0.5 }}>RD$</Typography>
              <TextField
                sx={{ flex: 1 }}
                label="Precio *"
                type="number"
                value={formData.precio}
                onChange={(e) => handleInputChange('precio', e.target.value)}
                error={!!errors.precio}
                helperText={errors.precio || 'Precio en pesos dominicanos'}
                slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
              />
            </Box>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          {(() => {
            const submitLabel = showtime ? 'Actualizar' : 'Crear';
            return (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Guardando...' : submitLabel}
              </Button>
            );
          })()}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ShowtimeForm;