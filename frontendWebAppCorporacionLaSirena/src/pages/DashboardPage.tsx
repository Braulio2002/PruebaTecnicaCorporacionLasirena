import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { Logout, Movie, Schedule, Dashboard } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Corporación La Sirena - Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Bienvenido, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Control
        </Typography>
        
        <Grid container spacing={3}>
          <Grid sx={{ padding: 1.5, width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Movie sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Gestión de Películas</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Administra el catálogo de películas, géneros y clasificaciones.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/movies')}
                  disabled={user?.role !== 'admin'}
                >
                  Ir a Películas
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid sx={{ padding: 1.5, width: { xs: '100%', md: '50%' } }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Gestión de Turnos</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Programa y administra los horarios de las funciones.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/showtimes')}
                >
                  Ir a Turnos
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}