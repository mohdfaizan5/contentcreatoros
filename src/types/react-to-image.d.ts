declare module 'react-to-image' {
  import type { RefCallback, RefObject } from 'react';

  export type UseToImageOptions<T extends HTMLElement = HTMLElement> = {
    ref?: RefObject<T>;
    pixelRatio?: number;
    backgroundColor?: string;
    fileName?: string;
    cacheBust?: boolean;
    quality?: number;
    [key: string]: unknown;
  };

  export type UseToImageState = {
    isLoading: boolean;
    error: unknown;
    dataURL?: string;
  };

  export type UseToImageResult<T extends HTMLElement = HTMLElement> = UseToImageState & {
    ref: RefCallback<T> | RefObject<T>;
    getSvg: () => Promise<void>;
    getJpeg: () => Promise<void>;
    getPng: () => Promise<void>;
    getBlob: () => Promise<void>;
    getPixelData: () => Promise<void>;
    getCanvas: () => Promise<void>;
  };

  export function useToImage<T extends HTMLElement = HTMLElement>(
    options?: UseToImageOptions<T>,
    callback?: (state: UseToImageState & Record<string, unknown>) => void,
  ): UseToImageResult<T>;
}
