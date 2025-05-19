// frontend/src/components/MapGrid.tsx
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Map from './Map';
import ReservationsList from './ReservationsList';
import { User } from '../hooks/useAuth';
import image from '../../img/img-2025-05-05-18-39-25.png';

interface MapGridProps {
  user: User;
}

const MapGrid: React.FC<MapGridProps> = ({ user }) => {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        p: { xs: 2, md: 4 },
        height: '100vh',
        width: '100%',
        overflow: 'hidden', // para evitar scrolls innecesarios


        // fondo con url(...)
        backgroundImage: `url(${image})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(156, 156, 156, 0.4)', // ajustar opacidad al gusto
          zIndex: 1,
          borderRadius: 0,
        }}
      />

      {/* Contenido */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1,
          zIndex: 2, // encima del overlay
        }}
      >
        {/* IZQUIERDA: Reservas */}
        <Box
          sx={{
            order: { xs: 2, md: 1 },
            flex: { xs: 'none', md: 1 },
            width: '100%',
            maxWidth: { xs: '100%', md: '25%' },
            bgcolor: 'rgba(255,255,255,0.8)',
            p: 2,
            borderRadius: 0,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Bienvenido, {user.email}
          </Typography>
          <ReservationsList user={user} />
        </Box>

        {/* DERECHA: mapa */}
        <Box
          sx={{
            order: { xs: 1, md: 2 },
            flex: { xs: 'none', md: 3 },
            width: '100%',
            height: { xs: '40vh', md: '80vh' },
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Map user={user} />
        </Box>
      </Box>
    </Box>
  );
};

export default MapGrid;
