"use client";

import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

export function ConnectionStatus({
  isConnected,
  isConnecting = false,
}: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting...
      </Badge>
    );
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <Wifi className="h-3 w-3" />
        Connected
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Disconnected
    </Badge>
  );
}
