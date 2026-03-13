import assert from "node:assert/strict";
import { createNativeSessionStorage } from "../nativeSessionStorage.ts";

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

const storage = createNativeSessionStorage(createFakeAdapter());

async function main() {
  const initialToken = await storage.loadNativeSessionToken();
  assert.equal(initialToken, null);

  await storage.saveNativeSessionToken("session-123");
  assert.equal(await storage.loadNativeSessionToken(), "session-123");

  await storage.clearNativeSessionToken();
  assert.equal(await storage.loadNativeSessionToken(), null);

  console.log("nativeSessionStorage tests passed");
}

void main();
