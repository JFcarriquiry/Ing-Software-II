import React from 'react';
import Map from './components/Map';
import LoginButton from './components/LoginButton';
import { LogoutButton } from './components/LogoutButton';
import ReservationsList from './components/ReservationsList';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando usuario...</p>;

  return (
    <div className="App">
      <h1>Explora, elige, reserva. Así de simple.</h1>
      {!user ? (
        <LoginButton />
      ) : (
        <>
          <p>Bienvenido, {user.email}</p>
          <LogoutButton />
          <Map user={user} />
          <ReservationsList user={user} />
        </>
      )}
    </div>
  );
}
