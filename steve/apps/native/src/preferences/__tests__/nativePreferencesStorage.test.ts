import assert from "node:assert/strict";
import { createNativePreferencesStorage } from "../nativePreferencesStorage.ts";

function createFakeAdapter() {
  const store = new Map<string, string>();

  return {
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      store.delete(key);
    },
  };
}

const storage = createNativePreferencesStorage(createFakeAdapter());

async function main() {
  assert.equal(await storage.loadLanguage(), null);

  await storage.saveLanguage("zh");
  assert.equal(await storage.loadLanguage(), "zh");

  await storage.clearLanguage();
  assert.equal(await storage.loadLanguage(), null);

  console.log("nativePreferencesStorage tests passed");
}

void main();
