import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import helpers from "./lib/r2-backfill-helpers.js";
import envLoader from "./lib/load-r2-env-from-web.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "packages", "backend");
const convexCli = path.join(
  backendDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "convex.cmd" : "convex",
);

const PAGE_SIZE = 100;
const R2_REGION = "auto";

const {
  buildAvatarBackfillObjectKey,
  buildConversationBackfillObjectKey,
  normalizeBackfillContentType,
} = helpers;
const { loadMissingR2EnvFromWebEnvLocal } = envLoader;

let r2Client = null;
let hasPushedConvexFunctions = false;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: R2_REGION,
    endpoint: `https://${getRequiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return r2Client;
}

function parseFlags(argv) {
  return {
    dryRun: !argv.includes("--live"),
    avatarsOnly: argv.includes("--avatars-only"),
    imagesOnly: argv.includes("--images-only"),
  };
}

async function convexRun(functionName, args = {}) {
  const cliArgs = [
    "run",
    functionName,
    JSON.stringify(args),
  ];

  if (!hasPushedConvexFunctions) {
    cliArgs.push("--push");
  }

  cliArgs.push("--typecheck", "disable", "--codegen", "disable");

  const { stdout, stderr } =
    process.platform === "win32"
      ? await execFileAsync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", convexCli, ...cliArgs],
          {
            cwd: backendDir,
            env: process.env,
          },
        )
      : await execFileAsync(convexCli, cliArgs, {
          cwd: backendDir,
          env: process.env,
        });

  const output = stdout.trim();
  if (!output) {
    return null;
  }

  try {
    const parsed = JSON.parse(output);
    hasPushedConvexFunctions = true;
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to parse Convex output for ${functionName}: ${output}\n${stderr}`.trim(),
    );
  }
}

async function listAllCandidates(functionName) {
  let offset = 0;
  let total = 0;
  const items = [];

  for (;;) {
    const page = await convexRun(functionName, { offset, limit: PAGE_SIZE });
    if (!page || !Array.isArray(page.items)) {
      throw new Error(`Unexpected page payload from ${functionName}`);
    }

    total = page.total ?? total;
    items.push(...page.items);

    if (page.items.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return { total, items };
}

async function downloadLegacyMedia(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const contentType = normalizeBackfillContentType(
    response.headers.get("content-type") ?? undefined,
    sourceUrl,
  );
  const bytes = new Uint8Array(await response.arrayBuffer());

  return {
    bytes,
    contentType,
  };
}

async function uploadToR2(objectKey, contentType, bytes) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getRequiredEnv("R2_BUCKET_NAME"),
      Key: objectKey,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}

function createSummary() {
  return {
    scanned: 0,
    downloadable: 0,
    uploaded: 0,
    patched: 0,
    failed: 0,
    skipped: 0,
  };
}

async function processAvatarCandidates(items, options) {
  const summary = createSummary();

  for (const item of items) {
    summary.scanned += 1;

    if (!item.sourceUrl) {
      summary.failed += 1;
      console.error(`[avatar] missing source url for profile ${item.profileId}`);
      continue;
    }

    try {
      const media = await downloadLegacyMedia(item.sourceUrl);
      const objectKey = buildAvatarBackfillObjectKey(String(item.userId), media.contentType);
      summary.downloadable += 1;

      if (options.dryRun) {
        console.log(`[avatar][dry-run] ${item.profileId} -> ${objectKey}`);
        continue;
      }

      await uploadToR2(objectKey, media.contentType, media.bytes);
      summary.uploaded += 1;
      await convexRun("backfillMedia:setAvatarObjectKey", {
        profileId: item.profileId,
        objectKey,
      });
      summary.patched += 1;
      console.log(`[avatar] patched ${item.profileId} -> ${objectKey}`);
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[avatar] failed for profile ${item.profileId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return summary;
}

async function processImageCandidates(items, options) {
  const summary = createSummary();

  for (const item of items) {
    summary.scanned += 1;

    if (!item.sourceUrl) {
      summary.failed += 1;
      console.error(`[image] missing source url for message ${item.messageId}`);
      continue;
    }

    try {
      const media = await downloadLegacyMedia(item.sourceUrl);
      const objectKey = buildConversationBackfillObjectKey(
        String(item.conversationId),
        media.contentType,
      );
      summary.downloadable += 1;

      if (options.dryRun) {
        console.log(`[image][dry-run] ${item.messageId} -> ${objectKey}`);
        continue;
      }

      await uploadToR2(objectKey, media.contentType, media.bytes);
      summary.uploaded += 1;
      await convexRun("backfillMedia:setImageObjectKey", {
        messageId: item.messageId,
        objectKey,
      });
      summary.patched += 1;
      console.log(`[image] patched ${item.messageId} -> ${objectKey}`);
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[image] failed for message ${item.messageId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return summary;
}

function printSummary(label, summary) {
  console.log(
    JSON.stringify(
      {
        type: label,
        ...summary,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const options = parseFlags(process.argv.slice(2));
  if (options.avatarsOnly && options.imagesOnly) {
    throw new Error("Choose at most one of --avatars-only or --images-only");
  }

  loadMissingR2EnvFromWebEnvLocal(repoRoot);

  console.log(
    `Starting R2 media backfill in ${options.dryRun ? "dry-run" : "live"} mode`,
  );

  if (!options.imagesOnly) {
    const avatars = await listAllCandidates("backfillMedia:listLegacyAvatarCandidates");
    console.log(`Avatar candidates: ${avatars.total}`);
    const summary = await processAvatarCandidates(avatars.items, options);
    printSummary("avatars", summary);
  }

  if (!options.avatarsOnly) {
    const images = await listAllCandidates("backfillMedia:listLegacyImageCandidates");
    console.log(`Image candidates: ${images.total}`);
    const summary = await processImageCandidates(images.items, options);
    printSummary("images", summary);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
