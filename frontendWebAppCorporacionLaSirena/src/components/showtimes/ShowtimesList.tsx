import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import ShowtimesService from '../../services/showtimesService';
import { moviesService } from '../../services/moviesService';
import type { Showtime, ShowtimeFilters } from '../../types/showtimes';
import type { Movie } from '../../types/movies';
import ShowtimeForm from './ShowtimeForm';

interface ShowtimesListProps {
  onShowtimeSelect?: (showtime: Showtime) => void;
}

const ShowtimesList: React.FC<ShowtimesListProps> = ({ onShowtimeSelect }) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showtimeToDelete, setShowtimeToDelete] = useState<Showtime | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ShowtimeFilters>({
    movieId: undefined,
    sala: undefined,
    fechaInicio: undefined,
    fechaFin: undefined,
    precioMin: undefined,
    precioMax: undefined
  });

  const itemsPerPage = 12;

  useEffect(() => {
    loadShowtimes();
    loadMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadShowtimes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ShowtimesService.getShowtimes(filters, page, itemsPerPage);
      setShowtimes(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const loadMovies = async () => {
    try {
      const response = await moviesService.getMovies({ page: 1, limit: 100 });
      setMovies(response.data);
    } catch (err) {
      console.error('Error al cargar películas:', err);
    }
  };

  const handleFilterChange = (
    field: keyof ShowtimeFilters,
    value: number | string | boolean | undefined
  ) => {
    setFilters(prev => ({ ...prev, [field]: value } as ShowtimeFilters));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      movieId: undefined,
      sala: undefined,
      fechaInicio: undefined,
      fechaFin: undefined,
      precioMin: undefined,
      precioMax: undefined
    });
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedShowtime(null);
    setOpenForm(true);
  };

  const handleEdit = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setOpenForm(true);
  };

  const handleDelete = (showtime: Showtime) => {
    setShowtimeToDelete(showtime);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!showtimeToDelete) return;
    try {
      await ShowtimesService.deleteShowtime(showtimeToDelete.id);
      await loadShowtimes();
      setDeleteDialogOpen(false);
      setShowtimeToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Error al eliminar el turno');
    }
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    setSelectedShowtime(null);
    loadShowtimes();
  };

  const getMovieTitle = (movieId: number) => {
    const movie = movies.find(m => m.id === movieId);
    return movie?.titulo || 'Película no encontrada';
  };

  const formatTime = (fechaHora: string) => dayjs(fechaHora).format('HH:mm');

  const formatPrice = (price: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(price);

  if (loading && showtimes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  dayjs.locale('es');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">Gestión de Turnos</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Nuevo Turno</Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filtros</Typography>
              <Button startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</Button>
            </Box>

            {showFilters && (
              <Grid container spacing={2}>
                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Película</InputLabel>
                    <Select value={filters.movieId ?? ''} onChange={(e) => handleFilterChange('movieId', e.target.value || undefined)}>
                      <MenuItem value="">Todas</MenuItem>
                      {movies.map(m => <MenuItem key={m.id} value={m.id}>{m.titulo}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '16.6667%' } }}>
                  <TextField fullWidth label="Sala" type="text" value={filters.sala ?? ''} onChange={(e) => handleFilterChange('sala', e.target.value ? String(e.target.value) : undefined)} />
                </Grid>

                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '16.6667%' } }}>
                  <DatePicker label="Fecha" value={filters.fechaInicio ? dayjs(filters.fechaInicio) : null} onChange={(d) => handleFilterChange('fechaInicio', d ? d.format('YYYY-MM-DD') : undefined)} slotProps={{ textField: { fullWidth: true } }} />
                </Grid>

                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '16.6667%' } }}>
                  <TextField fullWidth label="Precio Mín." type="number" value={filters.precioMin ?? ''} onChange={(e) => handleFilterChange('precioMin', e.target.value ? parseFloat(e.target.value) : undefined)} />
                </Grid>

                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '16.6667%' } }}>
                  <TextField fullWidth label="Precio Máx." type="number" value={filters.precioMax ?? ''} onChange={(e) => handleFilterChange('precioMax', e.target.value ? parseFloat(e.target.value) : undefined)} />
                </Grid>

                <Grid sx={{ width: { xs: '100%', sm: '50%', md: '8.3333%' } }}>
                  <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ height: '56px' }}>Limpiar</Button>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">Mostrando {showtimes.length} de {totalItems} turnos</Typography>
          {loading && <CircularProgress size={20} />}
        </Box>

        <Grid container spacing={3}>
          {showtimes.map(st => (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '33.333%' } }} key={st.id}>
              <Card sx={{ height: '100%', cursor: onShowtimeSelect ? 'pointer' : 'default' }} onClick={() => onShowtimeSelect?.(st)}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" noWrap>{getMovieTitle(st.movieId)}</Typography>
                    <Box>
                      <Tooltip title="Editar"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(st); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(st); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}><EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /><Typography variant="body2">{dayjs(st.fechaHora).format('DD/MM/YYYY')}</Typography></Box>
                  <Box display="flex" alignItems="center" mb={1}><TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /><Typography variant="body2">{formatTime(st.fechaHora)}</Typography></Box>
                  <Box display="flex" alignItems="center" mb={2}><MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /><Typography variant="body2" fontWeight="bold">{formatPrice(st.precio)}</Typography></Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={`Sala ${st.sala}`} size="small" color="primary" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">ID: {st.id}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {showtimes.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No se encontraron turnos</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>{Object.values(filters).some(v => v !== undefined) ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza creando tu primer turno'}</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Crear Turno</Button>
          </Box>
        )}

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} color="primary" size="large" />
          </Box>
        )}

        <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedShowtime ? 'Editar Turno' : 'Crear Nuevo Turno'}</DialogTitle>
          <DialogContent>
            <ShowtimeForm showtime={selectedShowtime} onSuccess={handleFormSuccess} onCancel={() => setOpenForm(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>¿Estás seguro de que deseas eliminar este turno?</Typography>
            {showtimeToDelete && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary"><strong>Película:</strong> {getMovieTitle(showtimeToDelete.movieId)}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Fecha:</strong> {dayjs(showtimeToDelete.fechaHora).format('DD/MM/YYYY')}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Hora:</strong> {formatTime(showtimeToDelete.fechaHora)}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Sala:</strong> {showtimeToDelete.sala}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ShowtimesList;