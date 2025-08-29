import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Lock, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Lock sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom color="error">
            Acceso Denegado
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            No tienes permisos suficientes para acceder a esta página.
            Contacta al administrador si crees que esto es un error.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              Ir al Dashboard
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}