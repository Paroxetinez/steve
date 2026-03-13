export const AUTHENTICATED_HOME_PATH = "/inbox";
export const PROFILE_SETUP_PATH = "/profile";

export function resolvePostAuthPath(hasProfile: boolean) {
  return hasProfile ? AUTHENTICATED_HOME_PATH : PROFILE_SETUP_PATH;
}

export function resolveInstallAppNextPath(nextPath: string | null | undefined) {
  return nextPath || AUTHENTICATED_HOME_PATH;
}

export function buildInstallAppPath(nextPath = AUTHENTICATED_HOME_PATH) {
  return `/install-app?next=${encodeURIComponent(nextPath)}`;
}
