const NATIVE_PREFERENCES_LANGUAGE_KEY = "steve.native.preferences.language";
const SECURE_STORE_MODULE_NAME = "expo-secure-store";

export type NativeAppLanguage = "en" | "zh";

type NativePreferencesStorageAdapter = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let persistedLanguage: NativeAppLanguage | null = null;
let defaultAdapterPromise: Promise<NativePreferencesStorageAdapter> | null = null;

const memoryAdapter: NativePreferencesStorageAdapter = {
  async getItemAsync() {
    return persistedLanguage;
  },
  async setItemAsync(_key, value) {
    persistedLanguage = value as NativeAppLanguage;
  },
  async deleteItemAsync() {
    persistedLanguage = null;
  },
};

export function createNativePreferencesStorage(adapter: NativePreferencesStorageAdapter) {
  return {
    async loadLanguage() {
      const language = await adapter.getItemAsync(NATIVE_PREFERENCES_LANGUAGE_KEY);
      return language === "zh" ? "zh" : language === "en" ? "en" : null;
    },
    async saveLanguage(language: NativeAppLanguage) {
      await adapter.setItemAsync(NATIVE_PREFERENCES_LANGUAGE_KEY, language);
    },
    async clearLanguage() {
      await adapter.deleteItemAsync(NATIVE_PREFERENCES_LANGUAGE_KEY);
    },
  };
}

async function loadSecureStoreAdapter(): Promise<NativePreferencesStorageAdapter> {
  try {
    const secureStoreModule = (await import(
      SECURE_STORE_MODULE_NAME
    )) as NativePreferencesStorageAdapter;

    if (
      typeof secureStoreModule.getItemAsync === "function" &&
      typeof secureStoreModule.setItemAsync === "function" &&
      typeof secureStoreModule.deleteItemAsync === "function"
    ) {
      return secureStoreModule;
    }
  } catch {
    // Fall back to in-memory storage in unsupported environments.
  }

  return memoryAdapter;
}

async function getDefaultStorage() {
  defaultAdapterPromise ??= loadSecureStoreAdapter();
  return createNativePreferencesStorage(await defaultAdapterPromise);
}

export async function loadNativeLanguagePreference() {
  return (await getDefaultStorage()).loadLanguage();
}

export async function saveNativeLanguagePreference(language: NativeAppLanguage) {
  await (await getDefaultStorage()).saveLanguage(language);
}

export async function clearNativeLanguagePreference() {
  await (await getDefaultStorage()).clearLanguage();
}
