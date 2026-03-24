import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function InboxLayout({
  list,
  preview,
}: {
  list: ReactNode;
  preview: ReactNode;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
      <Card className="space-y-4">{list}</Card>
      {preview}
    </div>
  );
}
