import { InboxWorkspace } from "@/components/inbox/inbox-workspace";

export default function GmailPage() {
  return (
    <InboxWorkspace
      title="Gmail Workspace"
      subtitle="Review Gmail conversations, sync new messages, and trigger AI assistance without leaving the provider view."
      lockedProvider="gmail"
    />
  );
}
