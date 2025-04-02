export interface Component {
  id: string;
  name: string;
  type: string;
  props?: Record<string, any>;
  style?: Record<string, string>;
  code?: string;
} 