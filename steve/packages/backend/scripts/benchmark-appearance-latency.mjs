#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import OpenAI from "openai";

const DEFAULT_COUNTS = [3, 5, 8, 10, 12, 15, 20, 25];
const DEFAULT_REPEATS = 3;
const DEFAULT_MODEL = "doubao-seed-2-0-lite-260215";
const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_APPEAR_THRESHOLD = 70;

function parseArgs(argv) {
  const options = {
    counts: DEFAULT_COUNTS,
    repeats: DEFAULT_REPEATS,
    transcriptFile: "",
    appearancePromptFile: "",
    suggestionPromptFile: "",
    latestMessage: "",
    dryRun: false,
    strictJson: false,
    stream: true,
    decisionOnly: false,
    respectThreshold: false,
    threshold: DEFAULT_APPEAR_THRESHOLD,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg.startsWith("--counts=")) {
      const raw = arg.slice("--counts=".length);
      options.counts = raw
        .split(/[,\s]+/)
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0)
        .map((v) => Math.floor(v));
      continue;
    }

    if (arg === "--counts") {
      const next = argv[i + 1] ?? "";
      options.counts = next
        .split(/[,\s]+/)
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0)
        .map((v) => Math.floor(v));
      i += 1;
      continue;
    }

    if (arg === "--repeats") {
      const next = Number(argv[i + 1]);
      if (Number.isFinite(next) && next > 0) {
        options.repeats = Math.floor(next);
      }
      i += 1;
      continue;
    }

    if (arg === "--transcript-file") {
      options.transcriptFile = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--appearance-prompt-file") {
      options.appearancePromptFile = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--suggestion-prompt-file") {
      options.suggestionPromptFile = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--latest-message") {
      options.latestMessage = argv[i + 1] ?? "";
      i += 1;
      continue;
    }

    if (arg === "--threshold") {
      const next = Number(argv[i + 1]);
      if (Number.isFinite(next)) {
        options.threshold = Math.max(0, Math.min(100, Math.round(next)));
      }
      i += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--strict-json") {
      options.strictJson = true;
      continue;
    }

    if (arg === "--stream") {
      options.stream = true;
      continue;
    }

    if (arg === "--no-stream") {
      options.stream = false;
      continue;
    }

    if (arg === "--decision-only") {
      options.decisionOnly = true;
      continue;
    }

    if (arg === "--respect-threshold") {
      options.respectThreshold = true;
      continue;
    }
  }

  if (options.counts.length === 0) {
    options.counts = DEFAULT_COUNTS;
  }

  return options;
}

function parseEnvText(text) {
  const map = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    map.set(key, value);
  }
  return map;
}

async function readEnvFromCandidates(keys, candidates) {
  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const text = await readFile(path, "utf8");
      const env = parseEnvText(text);
      const found = {};
      let hit = false;
      for (const key of keys) {
        if (env.has(key) && env.get(key)) {
          found[key] = env.get(key);
          hit = true;
        }
      }
      if (hit) return found;
    } catch {
      // ignore
    }
  }
  return {};
}

async function resolveModelConfig() {
  const envCandidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "packages/backend/.env.local"),
    resolve(process.cwd(), "../../apps/web/.env.local"),
    resolve(process.cwd(), "../apps/web/.env.local"),
  ];

  const fromFiles = await readEnvFromCandidates(
    ["DOUBAO_API_KEY", "DOUBAO_MODEL", "DOUBAO_BASE_URL"],
    envCandidates,
  );

  return {
    apiKey: process.env.DOUBAO_API_KEY || fromFiles.DOUBAO_API_KEY || "",
    model: process.env.DOUBAO_MODEL || fromFiles.DOUBAO_MODEL || DEFAULT_MODEL,
    baseURL: process.env.DOUBAO_BASE_URL || fromFiles.DOUBAO_BASE_URL || DEFAULT_BASE_URL,
  };
}

async function readPromptFromFileOrCandidates(customFile, candidates, fallbackPrompt) {
  if (customFile) {
    const customPath = resolve(process.cwd(), customFile);
    if (existsSync(customPath)) {
      const content = (await readFile(customPath, "utf8")).trim();
      if (content) return content;
    }
    throw new Error(`prompt file not found or empty: ${customPath}`);
  }

  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const content = (await readFile(path, "utf8")).trim();
      if (content) return content;
    } catch {
      // ignore
    }
  }

  return fallbackPrompt;
}

async function readAppearanceSystemPrompt(customFile = "") {
  return readPromptFromFileOrCandidates(
    customFile,
    [
      resolve(process.cwd(), "../../apps/web/public/prompt/steve-direct-appearance-decision.md"),
      resolve(process.cwd(), "../apps/web/public/prompt/steve-direct-appearance-decision.md"),
      resolve(process.cwd(), "apps/web/public/prompt/steve-direct-appearance-decision.md"),
    ],
    'Output JSON only: {"isappear": <0-100 number>}.',
  );
}

async function readSuggestionSystemPrompt(customFile = "") {
  return readPromptFromFileOrCandidates(
    customFile,
    [
      resolve(process.cwd(), "../../apps/web/public/prompt/steve-direct-suggestion.md"),
      resolve(process.cwd(), "../apps/web/public/prompt/steve-direct-suggestion.md"),
      resolve(process.cwd(), "apps/web/public/prompt/steve-direct-suggestion.md"),
    ],
    "You are Steve, a concise and supportive chat assistant. Reply in plain text, 1 sentence.",
  );
}

function parseTranscriptTextToMessages(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseTranscriptJsonToMessages(data) {
  if (Array.isArray(data)) {
    if (data.every((item) => typeof item === "string")) {
      return data.map((s) => s.trim()).filter(Boolean);
    }

    return data
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const senderType = item.senderType;
        if (senderType === "system") return "";
        const content = typeof item.content === "string" ? item.content.trim() : "";
        if (!content) return "";
        if (senderType === "assistant") {
          return /^Steve:\s*/i.test(content) ? content : `Steve: ${content}`;
        }
        return content;
      })
      .filter(Boolean);
  }
  return [];
}

async function loadMessages(transcriptFile) {
  if (!transcriptFile) {
    return [
      "User1: How do you usually relax on weekends?",
      "User2: Hiking or reading in a cafe.",
      "User1: Same here, but I have been busy recently.",
      "User2: I do shorter routes when busy, under 2 hours.",
      "User1: Good idea, I can try that.",
      "User2: Which area in Shanghai are you around most?",
      "User1: Xuhui and Jingan mostly, you?",
      "User2: Pudong, but I cross the river for food sometimes.",
      "User1: Nice, maybe we have similar taste.",
      "User2: We can swap restaurant picks next time.",
      "Steve: You can each share one favorite spot to start an easy common topic.",
      "User1: I can share a brunch place.",
      "User2: I will share a spicy Sichuan place.",
      "User1: So you like spicy food.",
      "User2: Yes, how about you?",
      "User1: Medium spicy is fine.",
      "User2: That still gives many options.",
      "User1: Any place you want to go recently?",
      "User2: I want to do cycling on Chongming Island.",
      "User1: I also want to try cycling.",
      "User2: We can start with a short route.",
      "User1: Sounds good, easy route first.",
      "User2: Yep, just enjoy first.",
      "User1: I like that mindset.",
      "User2: I just want a sustainable rhythm.",
      "User1: Agree, consistency matters.",
      "User2: Same logic at work lately?",
      "User1: Yes, I am reducing burnout.",
      "User2: Mature approach.",
      "User1: Talking with you feels easy.",
    ];
  }

  const raw = await readFile(resolve(process.cwd(), transcriptFile), "utf8");
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseTranscriptJsonToMessages(parsed);
    } catch {
      return parseTranscriptTextToMessages(trimmed);
    }
  }

  return parseTranscriptTextToMessages(trimmed);
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function avg(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function normalizeProbability(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  if (typeof value === "string") {
    const numeric = Number(value.trim().replace("%", ""));
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.min(100, Math.round(numeric)));
    }
  }

  return null;
}

function parseProbabilityFromJson(raw) {
  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === "object" && parsed !== null) {
      const maybe = parsed.isappear;
      return normalizeProbability(maybe);
    }

    return normalizeProbability(parsed);
  } catch {
    return null;
  }
}

function parseAppearScore(raw) {
  const cleaned = String(raw || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const directJson = parseProbabilityFromJson(cleaned);
  if (directJson !== null) {
    return directJson;
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const objectJson = parseProbabilityFromJson(cleaned.slice(start, end + 1));
    if (objectJson !== null) {
      return objectJson;
    }
  }

  const numberMatch = cleaned.match(/-?\d+(\.\d+)?/);
  if (numberMatch) {
    return normalizeProbability(numberMatch[0]);
  }

  return null;
}

function printRunOutput(count, run, stage, content) {
  console.log(`[count=${count} run=${run} stage=${stage}] output_begin`);
  console.log(content || "(empty)");
  console.log(`[count=${count} run=${run} stage=${stage}] output_end`);
}

function buildDecisionUserPrompt(latestMessage, transcript) {
  return (
    `Latest message:\n${latestMessage}\n\n` +
    `Recent transcript (oldest -> newest):\n${transcript}\n\n` +
    'Output JSON only: {"isappear": <0-100 number>}.'
  );
}

function buildSuggestionUserPrompt(transcript, appearScore) {
  return (
    "Generate Steve's one-message intervention for this direct chat.\n\n" +
    `Appearance probability score: ${appearScore}/100\n\n` +
    `Recent transcript (oldest -> newest):\n${transcript}\n\n` +
    "Reply in Chinese, one concise sentence, no markdown."
  );
}

async function runModelRequest({ client, requestPayload, stream }) {
  const start = process.hrtime.bigint();

  if (stream) {
    const streamResult = await client.chat.completions.create({
      ...requestPayload,
      stream: true,
    });

    let firstCharMs = null;
    let content = "";
    let usage = null;

    for await (const chunk of streamResult) {
      const delta = chunk?.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        if (firstCharMs === null) {
          const now = process.hrtime.bigint();
          firstCharMs = Number(now - start) / 1_000_000;
        }
        content += delta;
      }

      if (chunk?.usage) {
        usage = chunk.usage;
      }
    }

    const end = process.hrtime.bigint();
    const doneMs = Number(end - start) / 1_000_000;
    return {
      firstCharMs: firstCharMs ?? doneMs,
      doneMs,
      content,
      usage,
    };
  }

  const response = await client.chat.completions.create(requestPayload);
  const end = process.hrtime.bigint();
  const doneMs = Number(end - start) / 1_000_000;
  const content = response?.choices?.[0]?.message?.content ?? "";

  return {
    firstCharMs: doneMs,
    doneMs,
    content,
    usage: response?.usage ?? null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const messages = await loadMessages(options.transcriptFile);
  if (messages.length === 0) {
    console.error("No transcript messages found.");
    process.exit(1);
  }

  const latestMessage = options.latestMessage || messages[messages.length - 1];
  const appearanceSystemPrompt = await readAppearanceSystemPrompt(options.appearancePromptFile);
  const suggestionSystemPrompt = await readSuggestionSystemPrompt(options.suggestionPromptFile);
  const config = await resolveModelConfig();

  if (!config.apiKey) {
    console.error("DOUBAO_API_KEY not found in env or .env.local.");
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    maxRetries: 0,
    timeout: 120000,
  });

  console.log("=== Steve Full Pipeline Benchmark ===");
  console.log(`Model: ${config.model}`);
  console.log(`BaseURL: ${config.baseURL}`);
  console.log(`Counts: ${options.counts.join(", ")}`);
  console.log(`Repeats per count: ${options.repeats}`);
  console.log(`Strict JSON response format: ${options.strictJson ? "ON" : "OFF"}`);
  console.log(`Streaming: ${options.stream ? "ON" : "OFF"}`);
  console.log(`Decision only: ${options.decisionOnly ? "ON" : "OFF"}`);
  console.log(`Respect threshold: ${options.respectThreshold ? "ON" : "OFF"}`);
  console.log(`Threshold: ${options.threshold}`);
  console.log(`Appearance prompt file: ${options.appearancePromptFile || "default"}`);
  console.log(`Suggestion prompt file: ${options.suggestionPromptFile || "default"}`);
  console.log(`Transcript total messages: ${messages.length}`);
  console.log("");

  const summary = [];

  for (const count of options.counts) {
    const subset = messages.slice(-count);
    const transcript = subset.join("\n");

    const decisionUserPrompt = buildDecisionUserPrompt(latestMessage, transcript);
    const decisionInputChars = appearanceSystemPrompt.length + decisionUserPrompt.length;
    const decisionInputTokensEst =
      estimateTokens(appearanceSystemPrompt) + estimateTokens(decisionUserPrompt);

    const suggestionInputCharsBase =
      suggestionSystemPrompt.length + buildSuggestionUserPrompt(transcript, 50).length;
    const suggestionInputTokensEstBase =
      estimateTokens(suggestionSystemPrompt) + estimateTokens(buildSuggestionUserPrompt(transcript, 50));

    if (options.dryRun) {
      console.log(
        `[dry-run] count=${count} decisionInputChars=${decisionInputChars} suggestionInputCharsBase=${suggestionInputCharsBase}`,
      );
      summary.push({
        count,
        runs: 0,
        generateRate: 0,
        decisionFirstAvgMs: 0,
        decisionDoneAvgMs: 0,
        suggestionFirstAvgMs: 0,
        suggestionDoneAvgMs: 0,
        pipelineDoneAvgMs: 0,
        pipelineDoneP95Ms: 0,
        decisionInputChars,
        decisionInputTokensEst,
        suggestionInputCharsBase,
        suggestionInputTokensEstBase,
      });
      continue;
    }

    const decisionFirstLatencies = [];
    const decisionDoneLatencies = [];
    const suggestionFirstLatencies = [];
    const suggestionDoneLatencies = [];
    const pipelineDoneLatencies = [];
    let generatedRuns = 0;

    for (let run = 1; run <= options.repeats; run += 1) {
      const runStart = process.hrtime.bigint();

      try {
        const decisionRequestPayload = {
          model: config.model,
          temperature: 0.2,
          messages: [
            { role: "system", content: appearanceSystemPrompt },
            { role: "user", content: decisionUserPrompt },
          ],
        };
        if (options.strictJson) {
          decisionRequestPayload.response_format = { type: "json_object" };
        }

        const decisionResult = await runModelRequest({
          client,
          requestPayload: decisionRequestPayload,
          stream: options.stream,
        });
        decisionFirstLatencies.push(decisionResult.firstCharMs);
        decisionDoneLatencies.push(decisionResult.doneMs);
        printRunOutput(count, run, "decision", decisionResult.content);

        const appearScore = parseAppearScore(decisionResult.content);
        const shouldAppear = appearScore !== null ? appearScore >= options.threshold : false;
        const willGenerate =
          !options.decisionOnly && (options.respectThreshold ? shouldAppear : true);

        let suggestionFirstMs = null;
        let suggestionDoneMs = null;

        if (willGenerate) {
          generatedRuns += 1;
          const suggestionUserPrompt = buildSuggestionUserPrompt(transcript, appearScore ?? 0);
          const suggestionRequestPayload = {
            model: config.model,
            temperature: 0.7,
            messages: [
              { role: "system", content: suggestionSystemPrompt },
              { role: "user", content: suggestionUserPrompt },
            ],
          };

          const suggestionResult = await runModelRequest({
            client,
            requestPayload: suggestionRequestPayload,
            stream: options.stream,
          });

          suggestionFirstMs = suggestionResult.firstCharMs;
          suggestionDoneMs = suggestionResult.doneMs;
          suggestionFirstLatencies.push(suggestionResult.firstCharMs);
          suggestionDoneLatencies.push(suggestionResult.doneMs);
          printRunOutput(count, run, "suggestion", suggestionResult.content);
        }

        const runEnd = process.hrtime.bigint();
        const pipelineDoneMs = Number(runEnd - runStart) / 1_000_000;
        pipelineDoneLatencies.push(pipelineDoneMs);

        console.log(
          `[count=${count} run=${run}] decisionFirstMs=${decisionResult.firstCharMs.toFixed(1)} decisionDoneMs=${decisionResult.doneMs.toFixed(1)} appearScore=${
            appearScore ?? "n/a"
          } shouldAppear=${shouldAppear} generated=${willGenerate} suggestionFirstMs=${
            suggestionFirstMs === null ? "n/a" : suggestionFirstMs.toFixed(1)
          } suggestionDoneMs=${
            suggestionDoneMs === null ? "n/a" : suggestionDoneMs.toFixed(1)
          } pipelineDoneMs=${pipelineDoneMs.toFixed(1)}`,
        );
      } catch (error) {
        const runEnd = process.hrtime.bigint();
        const pipelineDoneMs = Number(runEnd - runStart) / 1_000_000;
        pipelineDoneLatencies.push(pipelineDoneMs);
        console.error(
          `[count=${count} run=${run}] failed after ${pipelineDoneMs.toFixed(1)}ms: ${
            error?.message ?? String(error)
          }`,
        );
      }
    }

    summary.push({
      count,
      runs: options.repeats,
      generateRate: options.repeats > 0 ? (generatedRuns / options.repeats) * 100 : 0,
      decisionFirstAvgMs: avg(decisionFirstLatencies),
      decisionDoneAvgMs: avg(decisionDoneLatencies),
      suggestionFirstAvgMs: avg(suggestionFirstLatencies),
      suggestionDoneAvgMs: avg(suggestionDoneLatencies),
      pipelineDoneAvgMs: avg(pipelineDoneLatencies),
      pipelineDoneP95Ms: percentile(pipelineDoneLatencies, 95),
      decisionInputChars,
      decisionInputTokensEst,
      suggestionInputCharsBase,
      suggestionInputTokensEstBase,
    });
  }

  console.log("");
  console.log(
    "count | runs | generate_rate_pct | decision_first_avg_ms | decision_done_avg_ms | suggestion_first_avg_ms | suggestion_done_avg_ms | pipeline_done_avg_ms | pipeline_done_p95_ms | decision_input_chars | decision_input_tokens_est | suggestion_input_chars_base | suggestion_input_tokens_est_base",
  );

  for (const row of summary) {
    console.log(
      `${row.count} | ${row.runs} | ${row.generateRate.toFixed(1)} | ${row.decisionFirstAvgMs.toFixed(
        1,
      )} | ${row.decisionDoneAvgMs.toFixed(1)} | ${row.suggestionFirstAvgMs.toFixed(
        1,
      )} | ${row.suggestionDoneAvgMs.toFixed(1)} | ${row.pipelineDoneAvgMs.toFixed(
        1,
      )} | ${row.pipelineDoneP95Ms.toFixed(1)} | ${row.decisionInputChars} | ${
        row.decisionInputTokensEst
      } | ${row.suggestionInputCharsBase} | ${row.suggestionInputTokensEstBase}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
