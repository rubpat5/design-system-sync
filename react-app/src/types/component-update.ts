import { FigmaComponent, Color } from './figma';

export interface ComponentUpdate {
  id: string;
  name: string;
  type: string;
  fills?: { type: string; color: Color }[];
  strokes?: { type: string; color: Color }[];
  strokeWeight?: number;
  height?: number;
  opacity?: number;
  componentProperties?: Record<string, { value: string }>;
  characters?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlignHorizontal?: string;
  cornerRadius?: number;
  children?: Partial<FigmaComponent>[];
} 