const NATIVE_SESSION_STORAGE_KEY = "steve.native.sessionToken";
const SECURE_STORE_MODULE_NAME = "expo-secure-store";

type NativeSessionStorageAdapter = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let persistedSessionToken: string | null = null;
let defaultAdapterPromise: Promise<NativeSessionStorageAdapter> | null = null;

const memoryAdapter: NativeSessionStorageAdapter = {
  async getItemAsync() {
    return persistedSessionToken;
  },
  async setItemAsync(_key, value) {
    persistedSessionToken = value;
  },
  async deleteItemAsync() {
    persistedSessionToken = null;
  },
};

export function createNativeSessionStorage(adapter: NativeSessionStorageAdapter) {
  return {
    async loadNativeSessionToken() {
      return adapter.getItemAsync(NATIVE_SESSION_STORAGE_KEY);
    },
    async saveNativeSessionToken(sessionToken: string) {
      await adapter.setItemAsync(NATIVE_SESSION_STORAGE_KEY, sessionToken);
    },
    async clearNativeSessionToken() {
      await adapter.deleteItemAsync(NATIVE_SESSION_STORAGE_KEY);
    },
  };
}

async function loadSecureStoreAdapter(): Promise<NativeSessionStorageAdapter> {
  try {
    const secureStoreModule = (await import(
      SECURE_STORE_MODULE_NAME
    )) as NativeSessionStorageAdapter;

    if (
      typeof secureStoreModule.getItemAsync === "function" &&
      typeof secureStoreModule.setItemAsync === "function" &&
      typeof secureStoreModule.deleteItemAsync === "function"
    ) {
      return secureStoreModule;
    }
  } catch {
    // Fall back to in-memory storage when secure storage is unavailable.
  }

  return memoryAdapter;
}

async function getDefaultStorage() {
  defaultAdapterPromise ??= loadSecureStoreAdapter();
  return createNativeSessionStorage(await defaultAdapterPromise);
}

export async function loadNativeSessionToken() {
  return (await getDefaultStorage()).loadNativeSessionToken();
}

export async function saveNativeSessionToken(sessionToken: string) {
  await (await getDefaultStorage()).saveNativeSessionToken(sessionToken);
}

export async function clearNativeSessionToken() {
  await (await getDefaultStorage()).clearNativeSessionToken();
}
