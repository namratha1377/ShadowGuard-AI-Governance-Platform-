import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `ShadowGuard | ${title}`;
  }, [title]);
};

export default usePageTitle;
