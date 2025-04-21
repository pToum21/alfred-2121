// components/alfred-thinking-state.tsx

import React from 'react';
import { Spinner } from '@/components/ui/spinner';

export type ThinkingState = 'searching' | 'thinking' | 'processing';

export interface AlfredThinkingStateProps {
  state: ThinkingState;
  className?: string;
}

export const AlfredThinkingState: React.FC<AlfredThinkingStateProps> = ({ state, className = '' }) => {
  const getStateText = () => {
    switch (state) {
      case 'searching':
        return 'searching...';
      case 'thinking':
        return 'thinking...';
      case 'processing':
        return 'processing...';
      default:
        return 'working...';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span>ALFReD is {getStateText()}</span>
    </div>
  );
};