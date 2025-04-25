// src/components/LogoutButton.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirige a la página de login o home de tu frontend
      window.location.href = 'http://localhost:5173/';
    } catch {
      alert('No se pudo cerrar sesión');
    }
  };

  return (
    <button onClick={handleLogout}>
      Cerrar sesión
    </button>
  );
}
