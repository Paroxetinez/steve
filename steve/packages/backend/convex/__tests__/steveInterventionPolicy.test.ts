import {
  classifySteveTone,
  isMeaningfulAutoInterventionCandidate,
  shouldAllowAutoIntervention,
} from "../steveInterventionPolicy";

describe("shouldAllowAutoIntervention", () => {
  test("blocks auto intervention during cooldown window", () => {
    expect(
      shouldAllowAutoIntervention({
        triggerType: "auto_after_user_message",
        forceSuggestion: false,
        lastAssistantAt: 10_000,
        now: 25_000,
        cooldownMs: 20_000,
        newerUserCount: 0,
        maxNewerUserMessages: 2,
      }),
    ).toBe(false);
  });

  test("allows manual intervention regardless of cooldown", () => {
    expect(
      shouldAllowAutoIntervention({
        triggerType: "manual_call",
        forceSuggestion: true,
        lastAssistantAt: 10_000,
        now: 25_000,
        cooldownMs: 20_000,
        newerUserCount: 4,
        maxNewerUserMessages: 2,
      }),
    ).toBe(true);
  });
});

describe("isMeaningfulAutoInterventionCandidate", () => {
  test("allows tension and escalation moments", () => {
    expect(
      isMeaningfulAutoInterventionCandidate({
        latestMessage: "你是不是不想见我了",
        transcript: "User1: 最近都没空\nUser2: 不是，我怕你不想见\nUser1: 那你倒是说呀",
      }),
    ).toBe(true);
  });

  test("blocks smooth early small talk", () => {
    expect(
      isMeaningfulAutoInterventionCandidate({
        latestMessage: "今天午饭吃了吗",
        transcript: "User1: 早呀\nUser2: 早\nUser1: 今天忙吗\nUser2: 还行",
      }),
    ).toBe(false);
  });
});

describe("classifySteveTone", () => {
  test("rejects system tone and coach tone", () => {
    expect(classifySteveTone("双方的问题在于沟通方式不一致，你应该先复盘。")).toBe(
      "blocked",
    );
    expect(classifySteveTone("用户A和用户B可以建立一个固定沟通机制。")).toBe(
      "blocked",
    );
  });

  test("allows short mutual-friend nudges", () => {
    expect(classifySteveTone("你俩这句都不是冷淡，像是在等对方先软一点。")).toBe(
      "allowed",
    );
  });
});
