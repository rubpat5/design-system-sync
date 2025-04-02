import { A11yColor, ContrastResult, AccessibilityResult } from '../types';

function calculateLuminance(color: A11yColor): number {
  const r = color.r;
  const g = color.g;
  const b = color.b;
  
  const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

export function checkColorContrast(foreground: A11yColor, background: A11yColor): ContrastResult {
  const foregroundLuminance = calculateLuminance(foreground);
  const backgroundLuminance = calculateLuminance(background);
  
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);
  
  let level = '';
  let message = '';
  
  if (contrastRatio >= 7) {
    level = 'AAA';
    message = `Great contrast ratio: ${contrastRatio.toFixed(2)}`;
  } else if (contrastRatio >= 4.5) {
    level = 'AA';
    message = `Good contrast ratio: ${contrastRatio.toFixed(2)}`;
  } else {
    level = 'FAIL';
    message = `Poor contrast ratio: ${contrastRatio.toFixed(2)} - should be at least 4.5:1`;
  }
  
  return { contrastRatio, level, message };
}

export function checkTextSize(fontSize: number): AccessibilityResult {
  if (fontSize < 14) {
    return {
      level: 'FAIL',
      message: `Text size ${fontSize}px is too small - should be at least 14px`
    };
  } else if (fontSize < 16) {
    return {
      level: 'AA',
      message: `Text size ${fontSize}px is acceptable but could be larger`
    };
  } else {
    return {
      level: 'AAA',
      message: `Text size ${fontSize}px is good for readability`
    };
  }
}

export function checkInteractiveElementSize(width: number, height: number): AccessibilityResult {
  const minSize = 44;
  
  if (width < minSize || height < minSize) {
    return {
      level: 'FAIL',
      message: `Element size ${width}x${height}px is too small - should be at least ${minSize}x${minSize}px for touch targets`
    };
  } else {
    return {
      level: 'AAA',
      message: `Element size ${width}x${height}px is good for touch targets`
    };
  }
} 