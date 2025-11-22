import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

/**
 * Custom hook to fetch and update user settings
 * @returns {Object} { updateSettings, loading, error }
 */
const useUserSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSettings = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put('/auth/settings', formData);
      
      // Update local user state immediately
      updateUser(response.data.user);
      
      return response.data;
    } catch (err) {
      console.error('Settings update error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  return {
    updateSettings,
    loading,
    error,
    user // Include user for convenience
  };
};

export default useUserSettings;

