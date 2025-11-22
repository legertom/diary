/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...options
  };
  return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format a time to a readable string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (date, options = {}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return dateObj.toLocaleTimeString('en-US', defaultOptions);
};

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get day name from day number (0 = Sunday, 6 = Saturday)
 * @param {number} dayNumber - Day number (0-6)
 * @returns {string} Day name
 */
export const getDayName = (dayNumber) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || '';
};

