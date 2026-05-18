import * as React from 'react';

export const IconComponentNode: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#FFF" opacity="0.08"/>
    <path d="M7 12h10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
    <path d="M12 7v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"/>
  </svg>
);

export default IconComponentNode;
