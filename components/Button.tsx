import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'neutral' | 'warning';
  icon?: React.ReactNode;
  label: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  icon, 
  label, 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "relative font-bold py-3 px-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 border-2 border-black/10 select-none font-round text-lg";
  
  const variants = {
    primary: "bg-mario-red text-white shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[4px]",
    secondary: "bg-mario-blue text-white shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[4px]",
    success: "bg-mario-green text-white shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[4px]",
    danger: "bg-gray-800 text-white shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[4px]",
    neutral: "bg-white text-gray-800 shadow-pixel hover:bg-gray-50 active:shadow-none active:translate-y-[4px]",
    warning: "bg-mario-yellow text-mario-brown shadow-pixel hover:brightness-110 active:shadow-none active:translate-y-[4px]",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default Button;