import { useState, useEffect, useCallback } from 'react';
import { fetchThemes, setThemeForMonthRemote } from '../firebaseThemeService';

export type Themes = Record<string, string>;

export const useThemes = (): [Themes, (month: string, theme: string) => void] => {
  const [themes, setThemesState] = useState<Themes>({});

  useEffect(() => {
    const loadRemote = async () => {
      try {
        const remote = await fetchThemes();
        setThemesState(remote || {});
      } catch (error) {
        console.error("Failed to fetch themes from remote", error);
      }
    };
    loadRemote();
  }, []);

  const setThemeForMonth = useCallback(
    (month: string, theme: string) => {
      const newThemes = { ...themes };
      if (theme) {
        newThemes[month] = theme;
      } else {
        delete newThemes[month];
      }
      setThemesState(newThemes);
      setThemeForMonthRemote(month, theme).catch((error) => {
        console.error("Failed to save theme remotely", error);
      });
    },
    [themes]
  );

  return [themes, setThemeForMonth];
};