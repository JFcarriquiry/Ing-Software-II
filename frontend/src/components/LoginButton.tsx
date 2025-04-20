import React from 'react';

const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/api/auth/google';
  };

  return (
    <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>
      Iniciar sesión con Google
    </button>
  );
};

export default LoginButton;
