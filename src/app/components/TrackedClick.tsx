'use client';

import { track } from '../../lib/mixpanelClient';

interface TrackedClickProps {
  eventLabel: string;
  properties?: Record<string, string | number | boolean>;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function TrackedClick({ 
  eventLabel, 
  properties = {}, 
  children, 
  onClick,
  className,
  disabled = false
}: TrackedClickProps) {
  const handleClick = () => {
    if (disabled) return;
    
    // Track the event
    track(eventLabel, properties);
    
    // Execute the provided onClick handler
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={className}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{ 
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </div>
  );
}