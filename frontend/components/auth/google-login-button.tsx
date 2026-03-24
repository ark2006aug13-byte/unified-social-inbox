"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export function GoogleLoginButton({ className = "" }: { className?: string }) {
  const { login } = useSession();

  return (
    <Button className={className} onClick={login}>
      Continue with Google
    </Button>
  );
}
