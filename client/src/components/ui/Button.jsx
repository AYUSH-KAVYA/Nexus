import React from 'react';
import clsx from 'clsx';
import Spinner from './Spinner';

const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  loading,
  icon,
  ...rest
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-[0.98] cursor-pointer';
  
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-md shadow-amber-500/15 border border-amber-400/50 focus:ring-amber-500',
    secondary: 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 hover:border-zinc-700 focus:ring-zinc-600 shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/15 border border-emerald-400/40 focus:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/15 border border-rose-400/40 focus:ring-rose-500',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-850 focus:ring-zinc-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
