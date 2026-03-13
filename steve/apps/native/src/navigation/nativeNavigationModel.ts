export const NATIVE_ROUTES = {
  login: "LoginScreen",
  register: "RegisterScreen",
  profileSetup: "ProfileSetupScreen",
  mainTabs: "MainTabs",
  inbox: "InboxScreen",
  profile: "ProfileScreen",
  addFriends: "AddFriendsScreen",
  searchResult: "SearchResultScreen",
  preferences: "PreferencesScreen",
  reports: "ReportsScreen",
  discovery: "DiscoveryScreen",
  profileEdit: "ProfileEditScreen",
  chat: "ChatScreen",
  notes: "NotesDashboardScreen",
  insideNote: "InsideNoteScreen",
  createNote: "CreateNoteScreen",
} as const;

export function resolveRootRoute(input: {
  hasSessionToken: boolean;
  hasProfile: boolean;
}) {
  if (!input.hasSessionToken) {
    return NATIVE_ROUTES.login;
  }

  return input.hasProfile ? NATIVE_ROUTES.mainTabs : NATIVE_ROUTES.profileSetup;
}

export function getMainTabRouteNames() {
  return [NATIVE_ROUTES.inbox, NATIVE_ROUTES.notes, NATIVE_ROUTES.profile];
}
