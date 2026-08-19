import React from 'react';
import { cn } from '../../utils/cn';

export function ToolInputGroup({ label, children, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
          {label}
        </h4>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default ToolInputGroup;
