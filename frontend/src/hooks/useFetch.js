import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

// const { data, loading, error, reload } = useFetch("/services", token)
export default function useFetch(path, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api(path, { token }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
