/**
 * Utility functions for dragon rendering and color conversion
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

/**
 * Get RGB color for element (0-5)
 */
export function getElementRGB(element: number): RGBColor {
  const colors: { [key: number]: string } = {
    0: '#FF4500', // Fire
    1: '#1E90FF', // Water
    2: '#8B4513', // Earth
    3: '#87CEEB', // Air
    4: '#4B0082', // Dark
    5: '#FFD700', // Light
    6: '#FF1493', // Shadow
    7: '#FF69B4', // Chaos
  };
  
  const hex = colors[element] || '#FFFFFF';
  return hexToRgb(hex);
}

/**
 * Format RGB color as CSS string
 */
export function rgbToCss(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Get normalized RGB for WASM (0.0 - 1.0 range)
 */
export function getElementRGBNormalized(element: number): { r: number; g: number; b: number } {
  const rgb = getElementRGB(element);
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255
  };
}
