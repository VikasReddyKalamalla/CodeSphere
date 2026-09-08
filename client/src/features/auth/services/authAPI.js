import apiClient from '@services/axios.js';

export const loginAPI = async (credentials) => {
  const res = await apiClient.post('/auth/login', credentials);
  return res.data;
};

export const registerAPI = async (data) => {
  const payload = {
    fullName: data.name,
    username: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Math.floor(100 + Math.random() * 900),
    email: data.email,
    password: data.password
  };
  const res = await apiClient.post('/auth/register', payload);
  return res.data;
};

export const googleAuthAPI = async (googleUser) => {
  const email = googleUser?.email || '';
  const payload = {
    email,
    fullName: googleUser?.displayName || googleUser?.fullName || (email ? email.split('@')[0] : 'Google User'),
    avatar: googleUser?.photoURL || googleUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(email || 'Google User')}&background=4285F4&color=fff`,
    googleId: googleUser?.uid || googleUser?.googleId || `google_${Date.now()}`,
  };
  const res = await apiClient.post('/auth/google', payload);
  return res.data;
};

export const fetchCurrentUserAPI = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

