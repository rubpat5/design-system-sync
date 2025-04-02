import React from 'react';
import { ButtonProps, ButtonStyleProps } from '../types';
import './Button.css';

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  fullWidth = false,
  onClick,
  onUpdate,
  style = {}
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
  };

  const styleProps = {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius
  }
  
  const handleDoubleClick = () => {
    if (onUpdate) {
      const newText = prompt('Edit button text:', children as string);
      if (newText !== null && newText !== children) {
        onUpdate({ text: newText });
      }
    }
  };
  
  const handleRightClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (onUpdate) {
      const variants = ['primary', 'secondary', 'outline', 'text'];
      const currentIndex = variants.indexOf(variant);
      const nextVariant = variants[(currentIndex + 1) % variants.length];
      
      onUpdate({ variant: nextVariant });
    }
  };
  
  return (
    <button 
      className={`ds-button ds-button-${variant} ds-button-${size} ${fullWidth ? 'ds-button-full-width' : ''}`}
      disabled={disabled}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      style={styleProps}
    >
      <span style={{ color: style.backgroundColor !== style.borderColor ? style.borderColor : 'white' }}>{children}</span>
    </button>
  );
};

export default Button; 