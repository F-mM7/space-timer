import { useState, useEffect } from 'react';

export type ScreenSize = 'desktop' | 'tablet' | 'mobile' | 'small';

/**
 * 画面サイズに応じたScreenSizeを返すフック
 * - desktop: 1025px以上
 * - tablet: 769px - 1024px
 * - mobile: 480px - 768px
 * - small: 479px以下
 */
export const useScreenSize = (): ScreenSize => {
  const getScreenSize = (width: number): ScreenSize => {
    if (width >= 1025) return 'desktop';
    if (width >= 769) return 'tablet';
    if (width >= 480) return 'mobile';
    return 'small';
  };

  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window !== 'undefined') {
      return getScreenSize(window.innerWidth);
    }
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};
