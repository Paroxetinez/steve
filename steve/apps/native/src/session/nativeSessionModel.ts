export function createDemoSessionToken() {
  return "native-demo-session";
}

export function resolveNativeSessionView(input: {
  sessionReady: boolean;
  sessionToken: string | null;
}) {
  if (!input.sessionReady) {
    return {
      status: "bootstrapping" as const,
      isAuthenticated: false,
    };
  }

  if (!input.sessionToken) {
    return {
      status: "unauthenticated" as const,
      isAuthenticated: false,
    };
  }

  return {
    status: "authenticated" as const,
    isAuthenticated: true,
  };
}
