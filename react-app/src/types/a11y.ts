export interface A11yColor {
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  contrastRatio: number;
  level: string;
  message: string;
}

export interface AccessibilityResult {
  level: string;
  message: string;
} 