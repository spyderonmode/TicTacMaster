// Simple auth API calls
export const login = async (credentials: { username: string; password: string }) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  return response.json();
};

export const register = async (credentials: { username: string; password: string; email: string }) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  
  return response.json();
};

export const sendEmailVerification = async (email: string) => {
  const response = await fetch('/api/auth/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send verification email');
  }
  
  return response.json();
};

export const verifyEmail = async (token: string) => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  if (!response.ok) {
    throw new Error('Email verification failed');
  }
  
  return response.json();
};

export const logout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
   // Navigate to auth page without reload
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/auth' } }));
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/user');
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};