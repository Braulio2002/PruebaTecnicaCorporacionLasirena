import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { moviesService } from '../../services/moviesService';
import type { Movie, MovieFilters } from '../../types/movies';
import { MovieForm } from '../movies/MovieForm';

interface MoviesListProps {
  onMovieSelect?: (movie: Movie) => void;
  selectable?: boolean;
}

export const MoviesList: React.FC<MoviesListProps> = ({ onMovieSelect, selectable = false }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<MovieFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; movie: Movie | null }>({
    open: false,
    movie: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableRatings, setAvailableRatings] = useState<string[]>([]);

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await moviesService.getMovies({
        ...filters,
        page,
        limit: 12
      });
      setMovies(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading movies');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const loadFilters = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadMovies();
    loadFilters();
  }, [loadMovies, loadFilters]);

  const handleSearch = () => {
    const newFilters: MovieFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (genreFilter) newFilters.genero = genreFilter;
    if (ratingFilter) newFilters.rating = ratingFilter;
    
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setGenreFilter('');
    setRatingFilter('');
    setFilters({});
    setPage(1);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleDelete = (movie: Movie) => {
    setDeleteDialog({ open: true, movie });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.movie) return;
    
    try {
      await moviesService.deleteMovie(deleteDialog.movie.id);
      setDeleteDialog({ open: false, movie: null });
      loadMovies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting movie');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMovie(null);
    loadMovies();
  };

  const handleMovieClick = (movie: Movie) => {
    if (selectable && onMovieSelect) {
      onMovieSelect(movie);
    }
  };

  if (loading && movies.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtros y búsqueda */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid sx={{ width: { xs: '100%', md: '33.333%' } }}>
              <TextField
              fullWidth
              label="Buscar películas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
            <TextField
              fullWidth
              select
              label="Género"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <MenuItem value="">Todos los géneros</MenuItem>
              {availableGenres.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid sx={{ width: { xs: '100%', md: '25%' } }}>
            <TextField
              fullWidth
              select
              label="Rating"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <MenuItem value="">Todos los ratings</MenuItem>
              {availableRatings.map((rating) => (
                <MenuItem key={rating} value={rating}>
                  {rating}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid sx={{ width: { xs: '100%', md: '16.6667%' } }}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
              >
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box mt={2} display="flex" gap={1}>
          <Button onClick={handleClearFilters}>Limpiar filtros</Button>
          {!selectable && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              Nueva Película
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Lista de películas */}
      <Grid container spacing={3}>
        {movies.map((movie) => (
          <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' } }} key={movie.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: selectable ? 'pointer' : 'default',
                '&:hover': selectable ? { boxShadow: 4 } : {}
              }}
              onClick={() => handleMovieClick(movie)}
            >
              {movie.posterUrl && (
                <CardMedia
                  component="img"
                  height="300"
                  image={movie.posterUrl}
                  alt={movie.titulo}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" noWrap>
                  {movie.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {movie.director}
                </Typography>
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                  <Chip label={movie.genero} size="small" color="primary" />
                  <Chip label={movie.rating} size="small" color="secondary" />
                  <Chip label={`${movie.duracion} min`} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {movie.descripcion}
                </Typography>
                {movie.fechaEstreno && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Estreno: {new Date(movie.fechaEstreno).toLocaleDateString()}
                  </Typography>
                )}
              </CardContent>
              {!selectable && (
                <Box p={1} display="flex" justifyContent="flex-end" gap={1}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(movie);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(movie);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Formulario de película */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMovie ? 'Editar Película' : 'Nueva Película'}
        </DialogTitle>
        <DialogContent>
          <MovieForm
            movie={editingMovie}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, movie: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la película "{deleteDialog.movie?.titulo}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, movie: null })}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MoviesList;