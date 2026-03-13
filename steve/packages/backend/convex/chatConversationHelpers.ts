export function filterDiscoverUsers<T extends { isConnected: boolean }>(
  users: T[],
  includeConnected = false,
) {
  if (includeConnected) {
    return users;
  }

  return users.filter((user) => !user.isConnected);
}
