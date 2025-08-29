import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { moviesService } from '../../services/moviesService';
import type { Movie, CreateMovieRequest, UpdateMovieRequest } from '../../types/movies';

interface MovieFormProps {
  movie?: Movie | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MovieForm: React.FC<MovieFormProps> = ({ movie, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    director: '',
    genero: '',
    rating: '',
    duracion: '',
    descripcion: '',
    actores: '',
    fechaEstreno: '',
    posterUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableRatings, setAvailableRatings] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
    if (movie) {
      setFormData({
        titulo: movie.titulo || '',
        director: movie.director || '',
        genero: movie.genero || '',
        rating: movie.rating || '',
        duracion: movie.duracion?.toString() || '',
        descripcion: movie.descripcion || '',
        actores: movie.actores || '',
        fechaEstreno: movie.fechaEstreno ? movie.fechaEstreno.split('T')[0] : '',
        posterUrl: movie.posterUrl || ''
      });
    }
  }, [movie]);

  const loadFilters = async () => {
    try {
      const [genres, ratings] = await Promise.all([
        moviesService.getGenres(),
        moviesService.getRatings()
      ]);
      setAvailableGenres(genres);
      setAvailableRatings(ratings);
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const movieData = {
        titulo: formData.titulo,
        director: formData.director,
        genero: formData.genero,
        rating: formData.rating,
        duracion: parseInt(formData.duracion),
        descripcion: formData.descripcion,
        actores: formData.actores,
        fechaEstreno: formData.fechaEstreno,
        posterUrl: formData.posterUrl || undefined
      };

      if (movie) {
        await moviesService.updateMovie(movie.id, movieData as UpdateMovieRequest);
      } else {
        await moviesService.createMovie(movieData as CreateMovieRequest);
      }
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving movie');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getButtonText = () => {
    if (loading) {
      return 'Guardando...';
    }
    if (movie) {
      return 'Actualizar';
    }
    return 'Crear';
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid sx={{ width: { xs: '100%' } }}>
          <TextField
            fullWidth
            label="Título"
            value={formData.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            required
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            label="Director"
            value={formData.director}
            onChange={(e) => handleChange('director', e.target.value)}
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            select
            label="Género"
            value={formData.genero}
            onChange={(e) => handleChange('genero', e.target.value)}
            required
          >
            {availableGenres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            select
            label="Rating"
            value={formData.rating}
            onChange={(e) => handleChange('rating', e.target.value)}
            required
          >
            {availableRatings.map((rating) => (
              <MenuItem key={rating} value={rating}>
                {rating}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            label="Duración (minutos)"
            type="number"
            value={formData.duracion}
            onChange={(e) => handleChange('duracion', e.target.value)}
            required
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%' } }}>
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={3}
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            required
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%' } }}>
          <TextField
            fullWidth
            label="Actores"
            value={formData.actores}
            onChange={(e) => handleChange('actores', e.target.value)}
            helperText="Separar con comas"
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            label="Fecha de Estreno"
            type="date"
            value={formData.fechaEstreno}
            onChange={(e) => handleChange('fechaEstreno', e.target.value)}
            required
          />
        </Grid>
        
  <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
          <TextField
            fullWidth
            label="URL del Poster"
            value={formData.posterUrl}
            onChange={(e) => handleChange('posterUrl', e.target.value)}
          />
        </Grid>
      </Grid>
      
      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {getButtonText()}
        </Button>
      </Box>
    </Box>
  );
};

export default MovieForm;