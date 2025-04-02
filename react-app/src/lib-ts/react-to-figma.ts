import { FigmaComponent, Color } from '../types/figma';
import { ComponentUpdate } from '../types/component-update';

export const generateReactToFigma = (
  component: { id: string; name: string; type: string }, 
  updates: Record<string, any>
): ComponentUpdate => {
  switch (component.type) {
    case 'BUTTON':
      return generateButtonUpdate(component, updates);
    case 'TEXT':
      return generateTextUpdate(component, updates);
    case 'CARD':
      return generateCardUpdate(component, updates);
    default:
      return generateGenericUpdate(component, updates);
  }
}

const generateButtonUpdate = (
  component: { id: string; name: string; type: string }, 
  updates: Record<string, any>
): ComponentUpdate => {
  const updateMessage: ComponentUpdate = {
    id: component.id,
    name: component.name,
    type: 'BUTTON'
  };
  
  if (updates.text) {
    updateMessage.children = [{
      type: 'TEXT',
      characters: updates.text
    }];
  }
  
  if (updates.variant) {
    updateMessage.componentProperties = {
      variant: { value: updates.variant }
    };
    
    switch (updates.variant) {
      case 'primary':
        updateMessage.fills = [{ type: 'SOLID', color: { r: 0.094, g: 0.627, b: 0.984 } }];
        break;
      case 'secondary':
        updateMessage.fills = [{ type: 'SOLID', color: { r: 0.867, g: 0.867, b: 0.867 } }];
        break;
      case 'outline':
        updateMessage.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        updateMessage.strokes = [{ type: 'SOLID', color: { r: 0.094, g: 0.627, b: 0.984 } }];
        updateMessage.strokeWeight = 1;
        break;
      case 'text':
        updateMessage.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 0 } }];
        break;
    }
  }
  
  if (updates.size) {
    updateMessage.componentProperties = {
      ...(updateMessage.componentProperties || {}),
      size: { value: updates.size }
    };
    
    switch (updates.size) {
      case 'small':
        updateMessage.height = 32;
        break;
      case 'medium':
        updateMessage.height = 40;
        break;
      case 'large':
        updateMessage.height = 48;
        break;
    }
  }
  
  if (updates.disabled !== undefined) {
    updateMessage.componentProperties = {
      ...(updateMessage.componentProperties || {}),
      disabled: { value: updates.disabled ? 'true' : 'false' }
    };
    
    updateMessage.opacity = updates.disabled ? 0.5 : 1;
  }
  
  if (updates.fullWidth !== undefined) {
    updateMessage.componentProperties = {
      ...(updateMessage.componentProperties || {}),
      fullWidth: { value: updates.fullWidth ? 'true' : 'false' }
    };
  }
  
  return updateMessage;
}

const generateTextUpdate = (
  component: { id: string; name: string; type: string }, 
  updates: Record<string, any>
): ComponentUpdate => {
  const updateMessage: ComponentUpdate = {
    id: component.id,
    name: component.name,
    type: 'TEXT'
  };
  
  if (updates.text) {
    updateMessage.characters = updates.text;
  }
  
  if (updates.fontSize) {
    updateMessage.fontSize = updates.fontSize;
  }
  
  if (updates.fontWeight) {
    updateMessage.fontWeight = updates.fontWeight;
  }
  
  if (updates.color) {
    updateMessage.fills = [{
      type: 'SOLID',
      color: hexToRgb(updates.color)
    }];
  }
  
  if (updates.textAlign) {
    updateMessage.textAlignHorizontal = updates.textAlign.toUpperCase();
  }
  
  return updateMessage;
}

const generateCardUpdate = (
  component: { id: string; name: string; type: string }, 
  updates: Record<string, any>
): ComponentUpdate => {
  const updateMessage: ComponentUpdate = {
    id: component.id,
    name: component.name,
    type: 'FRAME'
  };
  
  if (updates.borderRadius !== undefined) {
    updateMessage.cornerRadius = updates.borderRadius;
  }
  
  if (updates.backgroundColor) {
    updateMessage.fills = [{
      type: 'SOLID',
      color: hexToRgb(updates.backgroundColor)
    }];
  }
  
  return updateMessage;
}

const generateGenericUpdate = (
  component: { id: string; name: string; type: string }, 
  updates: Record<string, any>
): ComponentUpdate => {
  const updateMessage: ComponentUpdate = {
    id: component.id,
    name: component.name,
    type: component.type
  };
  
  return { ...updateMessage, ...updates };
}

const hexToRgb = (hex: string): Color => {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
} 