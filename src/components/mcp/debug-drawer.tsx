"use client";

/**
 * DebugDrawer
 *
 * Right sliding panel for debugging tools:
 * - Event timeline
 * - Replay scrubber
 * - Session status (optional)
 *
 * Closed by default, toggled via button.
 */

import { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

interface DebugDrawerProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger button (if not provided, uses default Bug icon button) */
  trigger?: ReactNode;
}

export function DebugDrawer({
  children,
  open,
  onOpenChange,
  trigger,
}: DebugDrawerProps) {
  const defaultTrigger = (
    <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50">
      <Bug className="h-4 w-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
