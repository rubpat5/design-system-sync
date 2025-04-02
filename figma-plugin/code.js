figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'connect-server') {
    console.log('Connecting to server:', msg.serverUrl);
  } 
  else if (msg.type === 'export-components') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'export-components',
        components: []
      });
      return;
    }
    
    const componentsData = [];
    
    for (const node of selection) {
      const componentData = await extractComponentData(node);
      componentsData.push(componentData);
    }
    
    figma.ui.postMessage({
      type: 'export-components',
      components: componentsData
    });
  }
  else if (msg.type === 'update-component') {
    const comp = msg.component;
    
    if (!comp || !comp.id) {
      console.error('Invalid component data received');
      return;
    }
    
    const node = figma.getNodeById(comp.id);
    
    if (!node) {
      console.error('Component not found in Figma:', comp.id);
      return;
    }
    
    await updateFigmaComponent(node, comp);
    
    figma.ui.postMessage({
      type: 'component-updated',
      componentId: comp.id
    });
  }
  else if (msg.type === 'connection-status') {
    console.log('Connection status:', msg.connected ? 'Connected' : 'Disconnected');
  }
};

async function extractComponentData(node) {
  if (node.type === 'TEXT') {
    await figma.loadFontAsync(node.fontName);
  }
  
  const data = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    visible: node.visible,
    rotation: node.rotation,
    children: []
  };
  
  if (node.fills) {
    console.log(`Fills for ${node.name}:`, JSON.stringify(node.fills, null, 2));
    
    const hasVisibleFills = node.fills.some(fill => fill.visible !== false);
    
    if (hasVisibleFills) {
      data.fills = node.fills;
      
      const bgFill = node.fills.find(fill => fill.type === 'SOLID' && fill.visible !== false);
      if (bgFill && bgFill.color) {
        data.backgroundColor = {
          r: bgFill.color.r,
          g: bgFill.color.g,
          b: bgFill.color.b,
          a: bgFill.opacity !== undefined ? bgFill.opacity : 1
        };
      }
    }
  }
  
  if (node.strokes) {
    console.log(`Strokes for ${node.name}:`, JSON.stringify(node.strokes, null, 2));
    data.strokes = node.strokes;
    
    const borderStroke = node.strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible !== false);
    if (borderStroke && borderStroke.color) {
      data.borderColor = {
        r: borderStroke.color.r,
        g: borderStroke.color.g,
        b: borderStroke.color.b,
        a: borderStroke.opacity !== undefined ? borderStroke.opacity : 1
      };
    }
  }
  
  if (node.strokeWeight) data.strokeWeight = node.strokeWeight;
  if (node.cornerRadius) data.cornerRadius = node.cornerRadius;
  
  if (node.type === 'TEXT') {
    data.characters = node.characters;
    data.fontSize = node.fontSize;
    data.fontName = node.fontName;
    data.textAlignHorizontal = node.textAlignHorizontal;
    data.textAlignVertical = node.textAlignVertical;
    data.letterSpacing = node.letterSpacing;
    data.lineHeight = node.lineHeight;
  }
  
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    if (node.componentProperties) {
      data.componentProperties = node.componentProperties;
    }
    
    if (node.variantProperties) {
      data.variantProperties = node.variantProperties;
    }
  }
  
  data.a11y = extractA11yData(node);
  
  if ('children' in node && node.children.length > 0) {
    for (const child of node.children) {
      const childData = await extractComponentData(child);
      data.children.push(childData);
    }
  }
  
  return data;
}

function extractA11yData(node) {
  const a11yData = {
    issues: []
  };
  
  if (node.type === 'TEXT' && node.fills && node.fills.length > 0) {
    const textFill = node.fills.find(fill => fill.type === 'SOLID');
    
    if (textFill) {
      const textColor = textFill.color;
      
      let bgColor = { r: 1, g: 1, b: 1 };
      
      const contrastRatio = calculateContrastRatio(textColor, bgColor);
      
      const fontSize = node.fontSize || 16;
      const isBold = node.fontWeight >= 700;
      
      const isLargeText = (fontSize >= 18) || (fontSize >= 14 && isBold);
      
      if (isLargeText) {
        if (contrastRatio < 3) {
          a11yData.issues.push({
            type: 'contrast',
            level: 'AA',
            message: 'Text contrast ratio is below 3:1 (WCAG AA for large text)'
          });
        }
        if (contrastRatio < 4.5) {
          a11yData.issues.push({
            type: 'contrast',
            level: 'AAA',
            message: 'Text contrast ratio is below 4.5:1 (WCAG AAA for large text)'
          });
        }
      } else {
        if (contrastRatio < 4.5) {
          a11yData.issues.push({
            type: 'contrast',
            level: 'AA',
            message: 'Text contrast ratio is below 4.5:1 (WCAG AA for normal text)'
          });
        }
        if (contrastRatio < 7) {
          a11yData.issues.push({
            type: 'contrast',
            level: 'AAA',
            message: 'Text contrast ratio is below 7:1 (WCAG AAA for normal text)'
          });
        }
      }
    }
  }
  
  if (node.name.toLowerCase().includes('button') || 
      node.type === 'INSTANCE' && node.mainComponent && node.mainComponent.name.toLowerCase().includes('button')) {
    if (node.width < 44 || node.height < 44) {
      a11yData.issues.push({
        type: 'size',
        message: 'Interactive elements should be at least 44x44px for touch targets'
      });
    }
  }
  
  return a11yData;
}

function calculateContrastRatio(color1, color2) {
  const lum1 = 0.2126 * color1.r + 0.7152 * color1.g + 0.0722 * color1.b;
  const lum2 = 0.2126 * color2.r + 0.7152 * color2.g + 0.0722 * color2.b;
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

async function updateFigmaComponent(node, componentData) {
  if (componentData.name) node.name = componentData.name;
  if (componentData.visible !== undefined) node.visible = componentData.visible;
  
  if (componentData.width !== undefined) node.resize(componentData.width, node.height);
  if (componentData.height !== undefined) node.resize(node.width, componentData.height);
  if (componentData.x !== undefined && componentData.y !== undefined) {
    node.x = componentData.x;
    node.y = componentData.y;
  }
  
  if (componentData.fills) {
    node.fills = componentData.fills;
  }
  
  if (componentData.strokes) {
    node.strokes = componentData.strokes;
  }
  
  if (node.type === 'TEXT' && componentData.characters) {
    if (componentData.fontName) {
      await figma.loadFontAsync(componentData.fontName);
      node.fontName = componentData.fontName;
    } else {
      await figma.loadFontAsync(node.fontName);
    }
    
    node.characters = componentData.characters;
    
    if (componentData.fontSize) node.fontSize = componentData.fontSize;
    if (componentData.textAlignHorizontal) node.textAlignHorizontal = componentData.textAlignHorizontal;
    if (componentData.textAlignVertical) node.textAlignVertical = componentData.textAlignVertical;
    if (componentData.letterSpacing) node.letterSpacing = componentData.letterSpacing;
    if (componentData.lineHeight) node.lineHeight = componentData.lineHeight;
  }
  
  if ((node.type === 'COMPONENT' || node.type === 'INSTANCE') && componentData.componentProperties) {
    for (const [key, value] of Object.entries(componentData.componentProperties)) {
      if (node.componentProperties && key in node.componentProperties) {
        if (node.type === 'INSTANCE' && node.setProperties) {
          const props = {};
          props[key] = value.value || value;
          node.setProperties(props);
        }
      }
    }
  }
  
  if (componentData.children && 'children' in node) {
    for (let i = 0; i < Math.min(componentData.children.length, node.children.length); i++) {
      await updateFigmaComponent(node.children[i], componentData.children[i]);
    }
  }
}

function updateSelection() {
  const selection = figma.currentPage.selection;
  
  figma.ui.postMessage({
    type: 'selection-update',
    count: selection.length,
    items: selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type
    }))
  });
}

updateSelection();
figma.on('selectionchange', updateSelection); 