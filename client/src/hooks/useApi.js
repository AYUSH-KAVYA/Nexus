import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!options.manual);
  const [error, setError] = useState(null);

  const fetchApi = useCallback(async (config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client({
        url,
        method: options.method || 'GET',
        ...options,
        ...config,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options.method]);

  useEffect(() => {
    if (!options.manual) {
      fetchApi();
    }
  }, [fetchApi, options.manual]);

  return { data, loading, error, refetch: fetchApi };
};
