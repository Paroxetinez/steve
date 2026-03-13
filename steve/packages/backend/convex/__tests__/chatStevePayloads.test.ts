import {
  buildDirectTranscript,
  serializeDirectPayload,
} from "../chatStevePayloads";

describe("buildDirectTranscript", () => {
  test("normalizes users and assistant lines", () => {
    expect(
      buildDirectTranscript([
        {
          senderType: "user",
          senderUserId: "user_1" as never,
          content: "hi",
        },
        {
          senderType: "assistant",
          content: "look closer",
        },
        {
          senderType: "user",
          senderUserId: "user_2" as never,
          content: "okay",
        },
        {
          senderType: "system",
          content: "ignored",
        },
      ]),
    ).toBe("User1: hi\nSteve: look closer\nUser2: okay");
  });
});

describe("serializeDirectPayload", () => {
  test("prefixes the payload marker for direct Steve interventions", () => {
    expect(
      serializeDirectPayload({
        latestMessage: "latest",
        transcript: "transcript",
        forceSuggestion: true,
        triggerType: "manual_call",
      }),
    ).toBe(
      '__DIRECT_SUGGESTION__:{"latestMessage":"latest","transcript":"transcript","forceSuggestion":true,"triggerType":"manual_call"}',
    );
  });
});
