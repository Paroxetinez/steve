import { Suspense } from "react";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ChatWorkspace />
    </Suspense>
  );
}
