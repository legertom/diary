import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Custom hook to fetch detailed week data with entries
 * @param {string} weekId - Week ID
 * @returns {Object} { week, entries, loading, error, refetch }
 */
const useWeekDetail = (weekId) => {
  const [week, setWeek] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeekDetail = useCallback(async () => {
    if (!weekId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/weeks/${weekId}`);
      setWeek(response.data.week);
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Error loading week detail:', err);
      setError(err.response?.data?.error || 'Failed to load week details');
      setWeek(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [weekId]);

  useEffect(() => {
    fetchWeekDetail();
  }, [fetchWeekDetail]);

  return {
    week,
    entries,
    loading,
    error,
    refetch: fetchWeekDetail
  };
};

export default useWeekDetail;

