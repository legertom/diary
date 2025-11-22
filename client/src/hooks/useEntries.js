import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

/**
 * Custom hook to fetch and manage entries for a week
 * @param {string} weekId - Week ID
 * @param {string} userId - User ID
 * @returns {Object} { entries, entryCount, loading, error, refetch }
 */
const useEntries = (weekId, userId) => {
  const [entries, setEntries] = useState([]);
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntries = useCallback(async () => {
    if (!weekId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/entries?userId=${userId}&weekId=${weekId}`
      );
      setEntries(response.data.entries || []);
      setEntryCount(response.data.count || 0);
    } catch (err) {
      console.error('Error loading entries:', err);
      setError(err.response?.data?.error || 'Failed to load entries');
      setEntries([]);
      setEntryCount(0);
    } finally {
      setLoading(false);
    }
  }, [weekId, userId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    entryCount,
    loading,
    error,
    refetch: fetchEntries
  };
};

export default useEntries;

