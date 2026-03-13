const fs = require("node:fs");
const path = require("node:path");

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL",
];

function applyMissingR2EnvFromText(targetEnv, text) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!R2_ENV_KEYS.includes(key)) {
      continue;
    }

    if (targetEnv[key]?.trim()) {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim();
    if (!value) {
      continue;
    }

    targetEnv[key] = value;
  }
}

function loadMissingR2EnvFromWebEnvLocal(rootDir, targetEnv = process.env) {
  const envFilePath = path.join(rootDir, "apps", "web", ".env.local");
  const text = fs.readFileSync(envFilePath, "utf8");
  applyMissingR2EnvFromText(targetEnv, text);
}

module.exports = {
  applyMissingR2EnvFromText,
  loadMissingR2EnvFromWebEnvLocal,
};
