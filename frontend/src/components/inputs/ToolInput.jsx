import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../utils/cn';

export function ToolInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  containerClassName,
  ...props
}) {
  return (
    <div className={cn('grid w-full items-center gap-1.5', containerClassName)}>
      {label && (
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">
          {label}
        </Label>
      )}
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn('h-9 bg-background/50 border-border/40', className)}
        {...props}
      />
    </div>
  );
}

export default ToolInput;
