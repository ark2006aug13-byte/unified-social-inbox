"use client";

import { InboxWorkspace } from "@/components/inbox/inbox-workspace";

export default function GmailPage() {
  return (
    <InboxWorkspace
      title="Gmail"
      subtitle="Everything that lands in your Gmail inbox, imported into the workspace with labels, threads and AI enrichment."
      lockedProvider="gmail"
    />
  );
}
