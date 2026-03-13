"use node";

import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  DIRECT_MARKER,
  type DirectPayload,
} from "./chatStevePayloads";
import {
  classifySteveTone,
  isMeaningfulAutoInterventionCandidate,
  shouldAllowAutoIntervention,
} from "./steveInterventionPolicy";

const DOUBAO_MODEL_DEFAULT = "doubao-seed-2-0-lite-260215";
const DOUBAO_BASE_URL_DEFAULT = "https://ark.cn-beijing.volces.com/api/v3";
const INTERVENTION_PROMPT_FILE_RELATIVE =
  "apps/web/public/prompt/steve-direct-intervention.md";
const SUGGESTION_PROMPT_FILE_RELATIVE =
  "apps/web/public/prompt/steve-direct-suggestion.md";
const INTERVENTION_PROMPT_KEY = "steve-direct-intervention";
const SUGGESTION_PROMPT_KEY = "steve-direct-suggestion";
const DIRECT_SAVE_THRESHOLD = 75;
const DIRECT_STALE_MAX_NEWER_USER_MESSAGES = 2;
const DIRECT_STALE_MAX_AGE_MS = 8000;
const DIRECT_COOLDOWN_MS = 20000;
const DIRECT_MAX_CONTENT_CHARS = 120;
const NO_SUGGESTION = "NO_SUGGESTION";
// Debounce-only mode: keep supersede precheck, disable cooldown and stale checks.
const ENABLE_DIRECT_PRECHECK = true;
const ENABLE_DIRECT_COOLDOWN = true;
const ENABLE_DIRECT_STALE_CHECK = true;
const FORCE_FALLBACK_CONTENT = "你俩这句都不像没感觉，差的只是有人先把在意说开一点。";

type DirectIntervention = {
  appearScore: number;
  content: string;
};

type DirectFreshness = {
  latestMessageId: Id<"messages"> | null;
  latestMessageAt: number | null;
  latestUserMessageId: Id<"messages"> | null;
  latestUserMessageAt: number | null;
  lastAssistantMessageId: Id<"messages"> | null;
  lastAssistantAt: number | null;
  newerUserCount: number;
  directMessageCount: number;
};

async function readApiKeyFromWebEnvLocal(): Promise<string | null> {
  const candidatePaths = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../../apps/web/.env.local"),
    resolve(process.cwd(), "../apps/web/.env.local"),
    resolve(process.cwd(), "apps/web/.env.local"),
  ];

  for (const path of candidatePaths) {
    try {
      const text = await readFile(path, "utf8");
      const line = text
        .split(/\r?\n/)
        .map((item) => item.trim())
        .find((item) => item.startsWith("DOUBAO_API_KEY="));
      if (!line) continue;
      const value = line
        .slice("DOUBAO_API_KEY=".length)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (value) return value;
    } catch {
      // ignore and try next path
    }
  }

  return null;
}

async function readFirstAvailablePrompt(paths: string[], fallbackPrompt: string): Promise<string> {
  for (const path of paths) {
    try {
      const content = (await readFile(path, "utf8")).trim();
      if (content) return content;
    } catch {
      // ignore and try next path
    }
  }
  return fallbackPrompt;
}

async function readInterventionPromptMarkdown(): Promise<string> {
  const fallbackPrompt =
    "You are Steve, a mutual friend observing a direct chat between two users. " +
    'Return JSON only: {"isappear": <0-100 number>, "content": "<one short Chinese sentence or NO_SUGGESTION>"}.';

  const candidatePaths = [
    resolve(process.cwd(), INTERVENTION_PROMPT_FILE_RELATIVE),
    resolve(process.cwd(), "../../apps/web/public/prompt/steve-direct-intervention.md"),
    resolve(process.cwd(), "../apps/web/public/prompt/steve-direct-intervention.md"),
  ];

  return readFirstAvailablePrompt(candidatePaths, fallbackPrompt);
}

async function readSuggestionPromptMarkdown(): Promise<string> {
  const fallbackPrompt =
    "You are Steve, a concise and supportive chat assistant. Reply in plain text, 1-3 short sentences.";

  const candidatePaths = [
    resolve(process.cwd(), SUGGESTION_PROMPT_FILE_RELATIVE),
    resolve(process.cwd(), "../../apps/web/public/prompt/steve-direct-suggestion.md"),
    resolve(process.cwd(), "../apps/web/public/prompt/steve-direct-suggestion.md"),
  ];

  return readFirstAvailablePrompt(candidatePaths, fallbackPrompt);
}

function normalizeSteveContent(content: string) {
  return content.replace(/^\s*Steve:\s*/i, "").trim();
}

function normalizeProbability(value: unknown): number | null {
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

function parseProbabilityFromJson(raw: string): number | null {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed === "object" && parsed !== null) {
      const maybe = (parsed as Record<string, unknown>).isappear;
      return normalizeProbability(maybe);
    }

    return normalizeProbability(parsed);
  } catch {
    return null;
  }
}

function normalizeInterventionContent(raw: unknown): string {
  if (typeof raw !== "string") return NO_SUGGESTION;
  const normalized = normalizeSteveContent(raw).replace(/\s+/g, " ").trim();
  if (!normalized) return NO_SUGGESTION;
  return normalized;
}

function parseDirectIntervention(raw: string): DirectIntervention | null {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const appearScore = normalizeProbability(
        record.isappear ?? record.appearScore ?? record.score,
      );
      const content = normalizeInterventionContent(
        record.content ?? record.suggestion ?? record.message,
      );
      if (appearScore !== null) {
        return {
          appearScore,
          content,
        };
      }
    }
  } catch {
    // fallback parse below
  }

  const directJson = parseProbabilityFromJson(cleaned);
  if (directJson !== null) {
    return { appearScore: directJson, content: NO_SUGGESTION };
  }

  const numberMatch = cleaned.match(/-?\d+(\.\d+)?/);
  if (numberMatch) {
    const numberScore = normalizeProbability(numberMatch[0]);
    if (numberScore !== null) {
      return { appearScore: numberScore, content: NO_SUGGESTION };
    }
  }

  return null;
}

function normalizePromptContent(content: string | null | undefined): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function shouldSaveDirectIntervention(input: DirectPayload, intervention: DirectIntervention) {
  if (input.forceSuggestion) return true;
  if (intervention.appearScore < DIRECT_SAVE_THRESHOLD) return false;
  const content = intervention.content.trim();
  if (!content || content.toUpperCase() === NO_SUGGESTION) return false;
  if (content.length > DIRECT_MAX_CONTENT_CHARS) return false;
  return true;
}

async function generateDirectIntervention(
  input: DirectPayload,
  systemPrompt: string,
): Promise<DirectIntervention> {
  const apiKey = process.env.DOUBAO_API_KEY ?? (await readApiKeyFromWebEnvLocal());
  if (!apiKey) {
    return input.forceSuggestion
      ? { appearScore: 100, content: FORCE_FALLBACK_CONTENT }
      : { appearScore: 0, content: NO_SUGGESTION };
  }

  const modelName = process.env.DOUBAO_MODEL ?? DOUBAO_MODEL_DEFAULT;
  const baseURL = process.env.DOUBAO_BASE_URL ?? DOUBAO_BASE_URL_DEFAULT;

  try {
    const client = new OpenAI({ apiKey, baseURL });

    const response = await client.chat.completions.create({
      model: modelName,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            `Latest message:\n${input.latestMessage}\n\n` +
            `Recent transcript (oldest -> newest):\n${input.transcript}\n\n` +
            (input.forceSuggestion
              ? 'User explicitly called Steve. Return high score and useful content in JSON: {"isappear": <0-100>, "content": "<one short Chinese sentence>"}'
              : 'Output JSON only: {"isappear": <0-100 number>, "content": "<one short Chinese sentence or NO_SUGGESTION>"}'),
        },
      ],
      max_tokens: 160,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) {
      return input.forceSuggestion
        ? { appearScore: 100, content: FORCE_FALLBACK_CONTENT }
        : { appearScore: 0, content: NO_SUGGESTION };
    }

    const intervention = parseDirectIntervention(raw);
    if (!intervention) {
      return input.forceSuggestion
        ? { appearScore: 100, content: FORCE_FALLBACK_CONTENT }
        : { appearScore: 0, content: NO_SUGGESTION };
    }

    if (input.forceSuggestion) {
      return {
        appearScore: 100,
        content:
          intervention.content.toUpperCase() === NO_SUGGESTION
            ? FORCE_FALLBACK_CONTENT
            : intervention.content,
      };
    }

    return intervention;
  } catch (error) {
    console.error("doubao_direct_intervention_error", error);
    return input.forceSuggestion
      ? { appearScore: 100, content: FORCE_FALLBACK_CONTENT }
      : { appearScore: 0, content: NO_SUGGESTION };
  }
}

function parseDirectPayload(raw: string): DirectPayload | null {
  if (!raw.startsWith(DIRECT_MARKER)) return null;

  const json = raw.slice(DIRECT_MARKER.length).trim();
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as Partial<DirectPayload>;
    if (!parsed.latestMessage || !parsed.transcript) return null;
    return {
      latestMessage: parsed.latestMessage,
      transcript: parsed.transcript,
      forceSuggestion: Boolean(parsed.forceSuggestion),
      currentSuggestion:
        typeof parsed.currentSuggestion === "string" ? parsed.currentSuggestion : undefined,
      traceId: typeof parsed.traceId === "string" ? parsed.traceId : undefined,
      pipelineStartAt:
        typeof parsed.pipelineStartAt === "number" && Number.isFinite(parsed.pipelineStartAt)
          ? parsed.pipelineStartAt
          : undefined,
      triggerType: typeof parsed.triggerType === "string" ? parsed.triggerType : undefined,
      anchorMessageId:
        typeof parsed.anchorMessageId === "string"
          ? (parsed.anchorMessageId as Id<"messages">)
          : undefined,
      anchorCreatedAt:
        typeof parsed.anchorCreatedAt === "number" && Number.isFinite(parsed.anchorCreatedAt)
          ? parsed.anchorCreatedAt
          : undefined,
    };
  } catch {
    return null;
  }
}

async function buildAssistantReply(
  userMessage: string,
  systemPrompt?: string,
): Promise<string> {
  const apiKey = process.env.DOUBAO_API_KEY ?? (await readApiKeyFromWebEnvLocal());
  if (!apiKey) {
    return `I heard you: "${userMessage}". I can help you break this down into facts, feelings, and next steps.`;
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.DOUBAO_BASE_URL ?? DOUBAO_BASE_URL_DEFAULT,
    });

    const response = await client.chat.completions.create({
      model: process.env.DOUBAO_MODEL ?? DOUBAO_MODEL_DEFAULT,
      messages: [
        {
          role: "system",
          content: systemPrompt ?? (await readSuggestionPromptMarkdown()),
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (content) return content;
  } catch (error) {
    console.error("assistant_reply_error", error);
  }

  return `Thanks for sharing. You said: "${userMessage}". Tell me what outcome you want, and I will help you plan the next message.`;
}

async function runDirectReplyPipeline(
  ctx: {
    runQuery: any;
    runMutation: any;
  },
  args: {
    conversationId: Id<"conversations">;
    directPayload: DirectPayload;
    targetMessageId?: Id<"messages">;
  },
) {
  const actionStartAt = Date.now();
  const directPayload = args.directPayload;
  const traceId =
    directPayload.traceId ??
    `steve-action-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const pipelineStartAt = directPayload.pipelineStartAt;
  const readDirectFreshness = async () => {
    const freshnessStartAt = Date.now();
    const freshness = (await ctx.runQuery(internal.chatAssistant.getDirectFreshness, {
      conversationId: args.conversationId,
      anchorMessageId: directPayload.anchorMessageId,
      anchorCreatedAt: directPayload.anchorCreatedAt,
    })) as DirectFreshness;
    return {
      freshness,
      freshnessMs: Date.now() - freshnessStartAt,
    };
  };

  console.log("[steve_timing] direct_pipeline_action_start", {
    traceId,
    triggerType: directPayload.triggerType ?? "unknown",
    conversationId: String(args.conversationId),
    schedulerDelayMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
    anchorMessageId: directPayload.anchorMessageId ?? null,
    anchorCreatedAt: directPayload.anchorCreatedAt ?? null,
  });

  if (ENABLE_DIRECT_PRECHECK) {
    try {
      const { freshness, freshnessMs } = await readDirectFreshness();
      const now = Date.now();
      const isAutoTrigger = directPayload.triggerType === "auto_after_user_message";
      const supersededByNewerUser =
        isAutoTrigger &&
        Boolean(directPayload.anchorMessageId) &&
        Boolean(freshness.latestUserMessageId) &&
        freshness.latestUserMessageId !== directPayload.anchorMessageId;

      const inCooldown = !shouldAllowAutoIntervention({
        triggerType: directPayload.triggerType ?? "unknown",
        forceSuggestion: Boolean(directPayload.forceSuggestion),
        lastAssistantAt: freshness.lastAssistantAt,
        now,
        cooldownMs: ENABLE_DIRECT_COOLDOWN ? DIRECT_COOLDOWN_MS : 0,
        newerUserCount: freshness.newerUserCount,
        maxNewerUserMessages: DIRECT_STALE_MAX_NEWER_USER_MESSAGES,
      });
      const lacksMeaningfulTrigger =
        isAutoTrigger &&
        !directPayload.forceSuggestion &&
        !isMeaningfulAutoInterventionCandidate({
          latestMessage: directPayload.latestMessage,
          transcript: directPayload.transcript,
        });

      if (supersededByNewerUser || inCooldown || lacksMeaningfulTrigger) {
        console.log("[steve_timing] direct_pipeline_dropped_precheck", {
          traceId,
          triggerType: directPayload.triggerType ?? "unknown",
          conversationId: String(args.conversationId),
          supersededByNewerUser,
          inCooldown,
          lacksMeaningfulTrigger,
          cooldownRemainingMs:
            inCooldown && typeof freshness.lastAssistantAt === "number"
              ? Math.max(0, DIRECT_COOLDOWN_MS - (now - freshness.lastAssistantAt))
              : 0,
          freshnessMs,
          latestUserMessageId: freshness.latestUserMessageId ?? null,
          lastAssistantAt: freshness.lastAssistantAt ?? null,
          actionTotalMs: Date.now() - actionStartAt,
          pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
        });
        return;
      }
    } catch (error) {
      console.error("load_direct_freshness_precheck_error", error);
    }
  }

  const interventionPromptLoadStartAt = Date.now();
  let interventionPromptFromDb: string | null = null;
  try {
    interventionPromptFromDb = normalizePromptContent(
      await ctx.runQuery(internal.systemPrompts.getByKey, {
        key: INTERVENTION_PROMPT_KEY,
      }),
    );
  } catch (error) {
    console.error("load_intervention_prompt_error", error);
  }
  const interventionSystemPrompt =
    interventionPromptFromDb ?? (await readInterventionPromptMarkdown());
  const interventionPromptLoadMs = Date.now() - interventionPromptLoadStartAt;

  const interventionStartAt = Date.now();
  const intervention = await generateDirectIntervention(directPayload, interventionSystemPrompt);
  const interventionMs = Date.now() - interventionStartAt;
  const isNoSuggestion = intervention.content.trim().toUpperCase() === NO_SUGGESTION;

  const shouldAppear = shouldSaveDirectIntervention(directPayload, intervention);
  if (!shouldAppear) {
    console.log("[steve_timing] direct_pipeline_intervention_done", {
      traceId,
      triggerType: directPayload.triggerType ?? "unknown",
      conversationId: String(args.conversationId),
      interventionPromptLoadMs,
      interventionMs,
      appearScore: intervention.appearScore,
      threshold: DIRECT_SAVE_THRESHOLD,
      isNoSuggestion,
      contentChars: intervention.content.length,
      shouldAppear: false,
      actionTotalMs: Date.now() - actionStartAt,
      pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
    });
    return;
  }

  if (ENABLE_DIRECT_STALE_CHECK) {
    try {
      const { freshness, freshnessMs } = await readDirectFreshness();
      const now = Date.now();
      const staleByAge =
        !directPayload.forceSuggestion &&
        typeof directPayload.anchorCreatedAt === "number" &&
        now - directPayload.anchorCreatedAt > DIRECT_STALE_MAX_AGE_MS;
      const staleByNewerUsers =
        !directPayload.forceSuggestion &&
        freshness.newerUserCount > DIRECT_STALE_MAX_NEWER_USER_MESSAGES;
      if (staleByAge || staleByNewerUsers) {
        console.log("[steve_timing] direct_pipeline_dropped_stale_after_decision", {
          traceId,
          triggerType: directPayload.triggerType ?? "unknown",
          conversationId: String(args.conversationId),
          staleByAge,
          staleByNewerUsers,
          newerUserCount: freshness.newerUserCount,
          maxNewerUserMessages: DIRECT_STALE_MAX_NEWER_USER_MESSAGES,
          staleAgeMs:
            typeof directPayload.anchorCreatedAt === "number"
              ? now - directPayload.anchorCreatedAt
              : null,
          maxStaleAgeMs: DIRECT_STALE_MAX_AGE_MS,
          freshnessMs,
          interventionMs,
          actionTotalMs: Date.now() - actionStartAt,
          pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
        });
        return;
      }
    } catch (error) {
      console.error("load_direct_freshness_after_decision_error", error);
    }
  }

  const content =
    intervention.content.trim().toUpperCase() === NO_SUGGESTION
      ? FORCE_FALLBACK_CONTENT
      : intervention.content;
  const toneClassification = classifySteveTone(content);
  if (toneClassification === "blocked" && !directPayload.forceSuggestion) {
    console.log("[steve_timing] direct_pipeline_dropped_tone_lint", {
      traceId,
      triggerType: directPayload.triggerType ?? "unknown",
      conversationId: String(args.conversationId),
      content,
      actionTotalMs: Date.now() - actionStartAt,
      pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
    });
    return;
  }

  const safeContent =
    toneClassification === "blocked" ? FORCE_FALLBACK_CONTENT : content;

  if (ENABLE_DIRECT_STALE_CHECK) {
    try {
      const { freshness, freshnessMs } = await readDirectFreshness();
      const now = Date.now();
      const staleByAge =
        !directPayload.forceSuggestion &&
        typeof directPayload.anchorCreatedAt === "number" &&
        now - directPayload.anchorCreatedAt > DIRECT_STALE_MAX_AGE_MS;
      const staleByNewerUsers =
        !directPayload.forceSuggestion &&
        freshness.newerUserCount > DIRECT_STALE_MAX_NEWER_USER_MESSAGES;
      if (staleByAge || staleByNewerUsers) {
        console.log("[steve_timing] direct_pipeline_dropped_stale_before_save", {
          traceId,
          triggerType: directPayload.triggerType ?? "unknown",
          conversationId: String(args.conversationId),
          staleByAge,
          staleByNewerUsers,
          newerUserCount: freshness.newerUserCount,
          maxNewerUserMessages: DIRECT_STALE_MAX_NEWER_USER_MESSAGES,
          staleAgeMs:
            typeof directPayload.anchorCreatedAt === "number"
              ? now - directPayload.anchorCreatedAt
              : null,
          maxStaleAgeMs: DIRECT_STALE_MAX_AGE_MS,
          freshnessMs,
          interventionMs,
          actionTotalMs: Date.now() - actionStartAt,
          pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
        });
        return;
      }
    } catch (error) {
      console.error("load_direct_freshness_before_save_error", error);
    }
  }

  const saveReplyStartAt = Date.now();
  await ctx.runMutation(internal.chatAssistant.saveAssistantReply, {
    conversationId: args.conversationId,
    content: `Steve: ${safeContent}`,
    targetMessageId: args.targetMessageId,
  });
  const saveReplyMs = Date.now() - saveReplyStartAt;
  console.log("[steve_timing] direct_pipeline_complete", {
    traceId,
    triggerType: directPayload.triggerType ?? "unknown",
    conversationId: String(args.conversationId),
    interventionPromptLoadMs,
    interventionMs,
    appearScore: intervention.appearScore,
    threshold: DIRECT_SAVE_THRESHOLD,
    isNoSuggestion,
    shouldAppear: true,
    contentChars: safeContent.length,
    saveReplyMs,
    actionTotalMs: Date.now() - actionStartAt,
    pipelineTotalMs: pipelineStartAt ? Date.now() - pipelineStartAt : null,
  });
}

export const callDirectReply = action({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pipelineStartAt = Date.now();
    const traceId = `steve-${pipelineStartAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const directPayload = (await ctx.runQuery(internal.chatAssistant.getManualDirectPayload, {
      sessionToken: args.sessionToken,
      conversationId: args.conversationId,
      traceId,
      pipelineStartAt,
    })) as DirectPayload;

    await runDirectReplyPipeline(ctx, {
      conversationId: args.conversationId,
      directPayload,
    });

    return { success: true };
  },
});

export const reply = internalAction({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    targetMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const directPayload = parseDirectPayload(args.userMessage);
    if (directPayload) {
      await runDirectReplyPipeline(ctx, {
        conversationId: args.conversationId,
        directPayload,
        targetMessageId: args.targetMessageId,
      });
      return;
    }

    const actionStartAt = Date.now();
    const traceId = `steve-action-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const suggestionPromptLoadStartAt = Date.now();
    let suggestionPromptFromDb: string | null = null;
    try {
      suggestionPromptFromDb = normalizePromptContent(
        await ctx.runQuery(internal.systemPrompts.getByKey, {
          key: SUGGESTION_PROMPT_KEY,
        }),
      );
    } catch (error) {
      console.error("load_suggestion_prompt_error", error);
    }
    const suggestionSystemPrompt =
      suggestionPromptFromDb ?? (await readSuggestionPromptMarkdown());
    const suggestionPromptLoadMs = Date.now() - suggestionPromptLoadStartAt;

    const assistantReplyStartAt = Date.now();
    const replyContent = await buildAssistantReply(args.userMessage, suggestionSystemPrompt);
    const assistantReplyGenMs = Date.now() - assistantReplyStartAt;
    const assistantSaveStartAt = Date.now();
    await ctx.runMutation(internal.chatAssistant.saveAssistantReply, {
      conversationId: args.conversationId,
      content: replyContent,
      targetMessageId: args.targetMessageId,
    });
    console.log("[steve_timing] assistant_pipeline_complete", {
      traceId,
      conversationId: String(args.conversationId),
      suggestionPromptLoadMs,
      assistantReplyGenMs,
      saveReplyMs: Date.now() - assistantSaveStartAt,
      totalMs: Date.now() - actionStartAt,
    });
  },
});
