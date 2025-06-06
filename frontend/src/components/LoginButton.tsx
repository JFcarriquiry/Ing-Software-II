// src/components/LoginButton.tsx
import React from 'react';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const LoginButton: React.FC = () => {
  const handleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL;
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      size="large"
      onClick={handleLogin}
      sx={{
        textTransform: 'none',
        fontSize: '1rem',
        paddingX: 3,
        paddingY: 1.5,
        bgcolor: 'primary.main',
        '&:hover': {
          bgcolor: 'primary.dark'
        }
      }}
    >
      Iniciar sesión con Google
    </Button>
  );
};

export default LoginButton;
