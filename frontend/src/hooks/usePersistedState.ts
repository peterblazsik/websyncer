import { useState, useEffect } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`websyncer:${key}`);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`websyncer:${key}`, JSON.stringify(state));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [key, state]);

  return [state, setState];
}
