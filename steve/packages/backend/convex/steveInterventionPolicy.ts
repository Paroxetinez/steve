type AutoInterventionArgs = {
  triggerType: string;
  forceSuggestion: boolean;
  lastAssistantAt?: number | null;
  now: number;
  cooldownMs: number;
  newerUserCount: number;
  maxNewerUserMessages: number;
};

const CANDIDATE_PATTERNS = [
  /误会|生气|委屈|别扭|冷淡|不回|不想理|吵|酸|吃醋/i,
  /见面|约|喜欢|想你|靠近|下一步|名分|暧昧/i,
  /你是不是|那你倒是|怎么不|为什么不/i,
];

const BLOCKED_TONE_PATTERNS = [
  /用户|双方|A\s*[\/、]?\s*B|User\s*\d+/i,
  /你应该|建议|问题在于|建立.*机制|复盘|沟通模型/i,
];

export function shouldAllowAutoIntervention({
  triggerType,
  forceSuggestion,
  lastAssistantAt,
  now,
  cooldownMs,
  newerUserCount,
  maxNewerUserMessages,
}: AutoInterventionArgs) {
  if (forceSuggestion || triggerType !== "auto_after_user_message") {
    return true;
  }

  if (typeof lastAssistantAt === "number" && now - lastAssistantAt < cooldownMs) {
    return false;
  }

  if (newerUserCount > maxNewerUserMessages) {
    return false;
  }

  return true;
}

export function isMeaningfulAutoInterventionCandidate(input: {
  latestMessage: string;
  transcript: string;
}) {
  const haystack = `${input.latestMessage}\n${input.transcript}`;
  return CANDIDATE_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function classifySteveTone(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return "blocked";
  }

  return BLOCKED_TONE_PATTERNS.some((pattern) => pattern.test(normalized))
    ? "blocked"
    : "allowed";
}
