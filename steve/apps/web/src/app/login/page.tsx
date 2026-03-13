import { Suspense } from "react";
import LoginScreen from "@/components/chat-auth/LoginScreen";

type LoginPageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
    invite?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const inviteParam = Array.isArray(params.invite) ? params.invite[0] : params.invite;

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginScreen
        initialMode={modeParam === "register" ? "register" : undefined}
        initialInviteCode={inviteParam}
      />
    </Suspense>
  );
}
