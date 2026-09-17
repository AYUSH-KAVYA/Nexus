import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({ label, error, helperText, icon, className, ...rest }, ref) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <span className="text-slate-400 sm:text-sm">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'block w-full rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 shadow-inner px-3.5 py-2.5 sm:text-sm transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-slate-900/90',
            icon && 'pl-10',
            error && 'border-rose-500/80 text-rose-200 placeholder-rose-400/50 focus:border-rose-500 focus:ring-rose-500/40'
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
