export interface FigmaComponent {
  id: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  backgroundColor?: Color;
  borderColor?: Color;
  strokeWeight?: number;
  cornerRadius?: number;
  rotation?: number;
  fills?: Fill[];
  strokes?: Stroke[];
  children?: FigmaComponent[];
  characters?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlignHorizontal?: string;
  componentProperties?: Record<string, { value: string }>;
  x?: number;
  y?: number;
  a11y?: { issues: any[] };
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Fill {
  type: string;
  color: Color;
  visible?: boolean;
  opacity?: number;
}

export interface Stroke {
  type: string;
  color: Color;
  visible?: boolean;
  opacity?: number;
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  props: Record<string, any>;
  code: string;
  style?: Record<string, any>;
  a11yIssues: any[];
}

export interface CardChild {
  type: string;
  props: Record<string, any>;
} 