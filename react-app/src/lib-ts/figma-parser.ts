import { FigmaComponent, Color, Fill, Stroke, ComponentData, CardChild } from '../types/figma';

export const parseFigmaComponent = (figmaComponent: FigmaComponent): ComponentData => {
  const component: ComponentData = {
    id: figmaComponent.id,
    name: figmaComponent.name,
    type: determineComponentType(figmaComponent),
    props: {},
    code: '',
    a11yIssues: figmaComponent.a11y?.issues || []
  };

  console.log('figmaComponent', figmaComponent);
  
  const styleProps = extractStyleProperties(figmaComponent);
  
  switch (component.type) {
    case 'BUTTON':
      component.props = { ...styleProps, ...parseButtonProps(figmaComponent) };
      component.code = generateButtonCode(component.props);
      component.style = styleProps;
      break;
    case 'TEXT':
      component.props = { ...styleProps, ...parseTextProps(figmaComponent) };
      component.code = generateTextCode(component.props);
      break;
    case 'CARD':
      component.props = { ...styleProps, ...parseCardProps(figmaComponent) };
      component.code = generateCardCode(component.props);
      break;
    default:
      component.props = { ...styleProps, ...parseGenericProps(figmaComponent) };
      component.code = generateGenericCode(component.props);
  }
  
  return component;
}

const determineComponentType = (figmaComponent: FigmaComponent): string => {
  const name = figmaComponent.name.toLowerCase();
  
  if (name.includes('button')) {
    return 'BUTTON';
  } else if (figmaComponent.type === 'TEXT') {
    return 'TEXT';
  } else if (name.includes('card')) {
    return 'CARD';
  }
  
  return figmaComponent.type;
}

const extractStyleProperties = (figmaComponent: FigmaComponent): Record<string, any> => {
  const styleProps: Record<string, any> = {
    width: figmaComponent.width,
    height: figmaComponent.height,
  };
  
  if (figmaComponent.backgroundColor) {
    styleProps.backgroundColor = rgbToHex(figmaComponent.backgroundColor);
    if (figmaComponent.backgroundColor.a !== undefined && figmaComponent.backgroundColor.a < 1) {
      styleProps.backgroundOpacity = figmaComponent.backgroundColor.a;
    }
  } else if (figmaComponent.fills && figmaComponent.fills.length > 0) {
    const bgFill = figmaComponent.fills.find(fill => fill.type === 'SOLID' && fill.visible !== false);
    if (bgFill) {
      styleProps.backgroundColor = rgbToHex(bgFill.color);
      if (bgFill.opacity !== undefined && bgFill.opacity !== 1) {
        styleProps.backgroundOpacity = bgFill.opacity;
      }
    }
  }
  
  if (figmaComponent.borderColor) {
    styleProps.borderColor = rgbToHex(figmaComponent.borderColor);
    if (figmaComponent.borderColor.a !== undefined && figmaComponent.borderColor.a < 1) {
      styleProps.borderOpacity = figmaComponent.borderColor.a;
    }
  } else if (figmaComponent.strokes && figmaComponent.strokes.length > 0) {
    const borderStroke = figmaComponent.strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible !== false);
    if (borderStroke) {
      styleProps.borderColor = rgbToHex(borderStroke.color);
      if (borderStroke.opacity !== undefined && borderStroke.opacity !== 1) {
        styleProps.borderOpacity = borderStroke.opacity;
      }
    }
  }
  
  if (figmaComponent.strokeWeight !== undefined) {
    styleProps.borderWidth = figmaComponent.strokeWeight;
  }
  
  if (figmaComponent.cornerRadius !== undefined) {
    styleProps.borderRadius = figmaComponent.cornerRadius;
  }
  
  if (figmaComponent.rotation !== undefined) {
    styleProps.rotation = figmaComponent.rotation;
  }
  
  console.log('Extracted style properties:', styleProps);
  
  return styleProps;
}

const parseButtonProps = (figmaComponent: FigmaComponent): Record<string, any> => {
  const props = {
    text: '',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    fullWidth: false
  };
  
  const textNode = findTextNode(figmaComponent);
  if (textNode) {
    props.text = textNode.characters || '';
  }
  
  if (figmaComponent.componentProperties?.variant) {
    props.variant = figmaComponent.componentProperties.variant.value || 'primary';
  } else if (figmaComponent.name.toLowerCase().includes('secondary')) {
    props.variant = 'secondary';
  } else if (figmaComponent.name.toLowerCase().includes('outline')) {
    props.variant = 'outline';
  } else if (figmaComponent.name.toLowerCase().includes('text')) {
    props.variant = 'text';
  }
  
  if (figmaComponent.componentProperties?.size) {
    props.size = figmaComponent.componentProperties.size.value || 'medium';
  } else if (figmaComponent.height && figmaComponent.height < 36) {
    props.size = 'small';
  } else if (figmaComponent.height && figmaComponent.height > 48) {
    props.size = 'large';
  }
  
  if (figmaComponent.componentProperties?.disabled) {
    props.disabled = figmaComponent.componentProperties.disabled.value === 'true';
  } else if (figmaComponent.name.toLowerCase().includes('disabled')) {
    props.disabled = true;
  }
  
  if (figmaComponent.componentProperties?.fullWidth) {
    props.fullWidth = figmaComponent.componentProperties.fullWidth.value === 'true';
  } else if (figmaComponent.name.toLowerCase().includes('full-width')) {
    props.fullWidth = true;
  }
  
  return props;
}

const parseTextProps = (figmaComponent: FigmaComponent): Record<string, any> => {
  return {
    text: figmaComponent.characters || '',
    fontSize: figmaComponent.fontSize || 16,
    fontWeight: figmaComponent.fontWeight || 400,
    color: figmaComponent.fills && figmaComponent.fills.length > 0 ? 
      rgbToHex(figmaComponent.fills[0].color) : '#000000',
    textAlign: figmaComponent.textAlignHorizontal || 'LEFT'
  };
}

const parseCardProps = (figmaComponent: FigmaComponent): Record<string, any> => {
  const props: {
    padding: string;
    children: CardChild[];
  } = {
    padding: '16px',
    children: []
  };
    
  if (figmaComponent.children && figmaComponent.children.length > 0) {
    figmaComponent.children.forEach(child => {
      if (child.type === 'TEXT') {
        props.children.push({
          type: 'TEXT',
          props: { ...extractStyleProperties(child), ...parseTextProps(child) }
        });
      } else if (child.name.toLowerCase().includes('button')) {
        props.children.push({
          type: 'BUTTON',
          props: { ...extractStyleProperties(child), ...parseButtonProps(child) }
        });
      } else {
        props.children.push({
          type: determineComponentType(child),
          props: { ...extractStyleProperties(child), ...parseGenericProps(child) }
        });
      }
    });
  }
  
  return props;
}

const parseGenericProps = (figmaComponent: FigmaComponent): Record<string, any> => {
  return {
    name: figmaComponent.name,
    type: figmaComponent.type,
    x: figmaComponent.x,
    y: figmaComponent.y
  };
}

const findTextNode = (component: FigmaComponent): FigmaComponent | null => {
  if (component.type === 'TEXT') {
    return component;
  }
  
  if (component.children) {
    for (const child of component.children) {
      const textNode = findTextNode(child);
      if (textNode) {
        return textNode;
      }
    }
  }
  
  return null;
}

const rgbToHex = (color: Color | undefined): string => {
  if (!color) return '#000000';
  
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const generateButtonCode = (props: Record<string, any>): string => {
  const { 
    text, 
    variant, 
    size, 
    disabled, 
    fullWidth,
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius
  } = props;
  
  let customStyles = '';
  if (backgroundColor || borderColor || borderWidth !== undefined || borderRadius !== undefined) {
    customStyles = `\n      style={{
        ${backgroundColor ? `backgroundColor: "${backgroundColor}",` : ''}
        ${borderColor ? `borderColor: "${borderColor}",` : ''}
        ${borderWidth !== undefined ? `borderWidth: ${borderWidth},` : ''}
        ${borderRadius !== undefined ? `borderRadius: ${borderRadius},` : ''}
      }}`;
  }
  
  return `import React from 'react';
import Button from './components/Button';

function MyComponent() {
  return (
    <Button
      variant="${variant}"
      size="${size}"
      ${disabled ? 'disabled' : ''}
      ${fullWidth ? 'fullWidth' : ''}${customStyles}
    >
      ${text}
    </Button>
  );
}`;
}

const generateTextCode = (props: Record<string, any>): string => {
  const { 
    text, 
    fontSize, 
    fontWeight, 
    color, 
    textAlign,
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius
  } = props;
  
  let customStyles = '';
  if (backgroundColor || borderColor || borderWidth !== undefined || borderRadius !== undefined) {
    customStyles = `\n      style={{
        ${backgroundColor ? `backgroundColor: "${backgroundColor}",` : ''}
        ${borderColor ? `borderColor: "${borderColor}",` : ''}
        ${borderWidth !== undefined ? `borderWidth: ${borderWidth},` : ''}
        ${borderRadius !== undefined ? `borderRadius: ${borderRadius},` : ''}
      }}`;
  }
  
  return `import React from 'react';
import Text from './components/Text';

function MyComponent() {
  return (
    <Text
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      textAlign="${textAlign.toLowerCase()}"${customStyles}
    >
      ${text}
    </Text>
  );
}`;
}

const generateCardCode = (props: Record<string, any>): string => {
  const { 
    children, 
    padding,
    width,
    height,
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius
  } = props;
  
  const childrenCode = children.map((child: CardChild) => {
    if (child.type === 'TEXT') {
      return `      <Text
        fontSize={${child.props.fontSize}}
        fontWeight={${child.props.fontWeight}}
        color="${child.props.color}"
      >
        ${child.props.text}
      </Text>`;
    } else if (child.type === 'BUTTON') {
      return `      <Button
        variant="${child.props.variant}"
        size="${child.props.size}"
        ${child.props.disabled ? 'disabled' : ''}
      >
        ${child.props.text}
      </Button>`;
    } else {
      return `      <div>${child.props.name}</div>`;
    }
  }).join('\n');
  
  return `import React from 'react';
import Card from './components/Card';
import Text from './components/Text';
import Button from './components/Button';

function MyComponent() {
  return (
    <Card
      width={${width}}
      height={${height}}
      backgroundColor="${backgroundColor || '#ffffff'}"
      ${borderColor ? `borderColor="${borderColor}"` : ''}
      ${borderWidth !== undefined ? `borderWidth={${borderWidth}}` : ''}
      borderRadius={${borderRadius || 0}}
      padding="${padding}"
    >
${childrenCode}
    </Card>
  );
}`;
}

const generateGenericCode = (props: Record<string, any>): string => {
  const { 
    name, 
    type,
    width,
    height,
    backgroundColor,
    borderColor,
    borderWidth,
    borderRadius
  } = props;
  
  const styleProps = [
    width !== undefined ? `width: ${width}px` : null,
    height !== undefined ? `height: ${height}px` : null,
    backgroundColor ? `backgroundColor: "${backgroundColor}"` : null,
    borderColor ? `borderColor: "${borderColor}"` : null,
    borderWidth !== undefined ? `borderWidth: ${borderWidth}px` : null,
    borderRadius !== undefined ? `borderRadius: ${borderRadius}px` : null
  ].filter(Boolean).join(',\n        ');
  
  return `import React from 'react';

function MyComponent() {
  return (
    <div
      style={{
        ${styleProps}
      }}
    >
      ${name} (${type})
    </div>
  );
}`;
} 