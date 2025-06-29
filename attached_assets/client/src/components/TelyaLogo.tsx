import React from 'react';

interface TelyaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TelyaLogo: React.FC<TelyaLogoProps> = ({ size = 'md', className = '' }) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <svg 
      className={`${dimensions[size]} ${className}`}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="telyaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill="url(#telyaGradient)" 
        opacity="0.2"
        filter="url(#glow)"
      />
      
      {/* Main circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        fill="url(#telyaGradient)"
      />
      
      {/* Letter T stylized */}
      <path 
        d="M25 25 L75 25 M50 25 L50 75" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Decorative dots */}
      <circle cx="35" cy="60" r="3" fill="white" opacity="0.8" />
      <circle cx="65" cy="60" r="3" fill="white" opacity="0.8" />
      <circle cx="50" cy="70" r="2" fill="white" opacity="0.6" />
    </svg>
  );
};