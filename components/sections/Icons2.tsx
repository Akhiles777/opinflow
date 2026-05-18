import * as React from 'react';

export const Icons2: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="#fff" opacity="0.08"/>
    <path d="M8 12h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default Icons2;
