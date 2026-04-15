declare module 'color-contrast-checker' {
  type ContrastResult = {
    WCAG_AA?: boolean;
    WCAG_AAA?: boolean;
    customRatio?: boolean;
  };

  export default class ColorContrastChecker {
    isLevelAA(colorA: string, colorB: string, fontSize?: number): boolean;
    isLevelAAA(colorA: string, colorB: string, fontSize?: number): boolean;
    isLevelCustom(colorA: string, colorB: string, ratio: number): boolean;
    check(
      colorA: string,
      colorB: string,
      fontSize?: number,
      customRatio?: number,
    ): ContrastResult;
    checkPairs(
      pairs: Array<{ colorA: string; colorB: string; fontSize?: number }>,
      customRatio?: number,
    ): ContrastResult[];
  }
}
