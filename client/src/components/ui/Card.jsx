import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  className,
  padding = 'p-6',
  hover = false,
  onClick,
  ...rest
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800/80 shadow-md shadow-black/20 text-zinc-100',
        padding,
        hover && 'transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40',
        onClick && 'cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
