import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Custom hook to fetch and manage all weeks for a user
 * @param {string} userId - User ID
 * @returns {Object} { weeks, loading, error, refetch, getCurrentWeek }
 */
const useWeeks = (userId) => {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeeks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/weeks?userId=${userId}`);
      setWeeks(response.data.weeks || []);
    } catch (err) {
      console.error('Error loading weeks:', err);
      setError(err.response?.data?.error || 'Failed to load weeks');
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  /**
   * Get the current week (week that contains today)
   * @returns {Object|null} Current week object or null
   */
  const getCurrentWeek = useCallback(() => {
    if (!weeks || weeks.length === 0) return null;
    
    const now = new Date();
    const currentWeek = weeks.find(week => {
      const start = new Date(week.weekStart);
      const end = new Date(week.weekEnd);
      return now >= start && now <= end;
    });
    
    // Fallback to most recent week if no current week found
    return currentWeek || weeks[0] || null;
  }, [weeks]);

  return {
    weeks,
    loading,
    error,
    refetch: fetchWeeks,
    getCurrentWeek
  };
};

export default useWeeks;

