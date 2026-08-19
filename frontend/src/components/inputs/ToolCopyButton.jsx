import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

/**
 * Standardized copy button component with success feedback
 */
export function ToolCopyButton({
  text,
  onCopy,
  disabled,
  variant = 'ghost',
  size = 'sm',
  className,
}) {
  const [copied, setCopied] = useState(false);

  const isDisabled = disabled ?? !text;

  const handleCopy = useCallback(async () => {
    if (isDisabled) return;

    try {
      if (onCopy) {
        await onCopy(text);
      } else {
        await navigator.clipboard.writeText(text);
      }

      // Show success feedback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [text, onCopy, isDisabled]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={isDisabled}
      className={cn('h-7 gap-1.5 text-[11px] font-bold uppercase tracking-wider', className)}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default ToolCopyButton;
