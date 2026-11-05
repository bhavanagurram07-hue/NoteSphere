import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    pdf: 'bg-red-50 text-red-700 border-red-200 font-bold',
    docx: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[11px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variants[variant] || variants.default} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
