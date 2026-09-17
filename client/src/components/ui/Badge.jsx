import React from 'react';
import clsx from 'clsx';

const Badge = ({ variant = 'default', size = 'md', children, className, dot = false }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
    primary: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
    success: 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50',
    warning: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
    danger: 'bg-rose-950/60 text-rose-300 border border-rose-700/50',
    info: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/50',
  };

  const dotColors = {
    default: 'bg-zinc-400',
    primary: 'bg-amber-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-zinc-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('mr-1.5 h-1.5 w-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
