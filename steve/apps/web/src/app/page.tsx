import { Suspense } from "react";
import LoginScreen from "@/components/chat-auth/LoginScreen";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginScreen />
    </Suspense>
  );
}
