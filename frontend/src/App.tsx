// frontend/src/App.tsx
import React from 'react';
import LoginPage from './components/LoginGrid';
import Map from './components/Map';
import LoginButton from './components/LoginButton';
import { LogoutButton } from './components/LogoutButton';
import ReservationsList from './components/ReservationsList';
import { useAuth } from './hooks/useAuth';
import  temaPrincipal  from '../theme/temaPrincipal';
import Navbar from './components/Navbar';
import { ThemeProvider } from '@emotion/react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {es} from 'date-fns/locale/es'; 
import MapGrid from './components/mapGrid';


const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Cargando usuario...</p>;
  }

  // Si no hay usuario, mostramos toda la pantalla de login
  if (!user) {
    return (
      <ThemeProvider theme={temaPrincipal}>
        <LoginPage />
      </ThemeProvider>
    );
  }

  // Ya está logueado: mostramos el dashboard
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <ThemeProvider theme={temaPrincipal}>
        <Navbar />
        <MapGrid user={user} />
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;

