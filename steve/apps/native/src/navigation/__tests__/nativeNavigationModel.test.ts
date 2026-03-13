import assert from "node:assert/strict";
import {
  getMainTabRouteNames,
  NATIVE_ROUTES,
  resolveRootRoute,
} from "../nativeNavigationModel.ts";

assert.equal(
  resolveRootRoute({ hasSessionToken: false, hasProfile: false }),
  NATIVE_ROUTES.login,
);
assert.equal(
  resolveRootRoute({ hasSessionToken: true, hasProfile: false }),
  NATIVE_ROUTES.profileSetup,
);
assert.equal(
  resolveRootRoute({ hasSessionToken: true, hasProfile: true }),
  NATIVE_ROUTES.mainTabs,
);
assert.deepEqual(getMainTabRouteNames(), [
  NATIVE_ROUTES.inbox,
  NATIVE_ROUTES.notes,
  NATIVE_ROUTES.profile,
]);
assert.equal(NATIVE_ROUTES.addFriends, "AddFriendsScreen");
assert.equal(NATIVE_ROUTES.searchResult, "SearchResultScreen");
assert.equal(NATIVE_ROUTES.preferences, "PreferencesScreen");
assert.equal(NATIVE_ROUTES.reports, "ReportsScreen");
assert.equal(NATIVE_ROUTES.discovery, "DiscoveryScreen");
assert.equal(NATIVE_ROUTES.profileEdit, "ProfileEditScreen");

console.log("nativeNavigationModel tests passed");
