import { buildRelationshipMemorySnapshot } from "../relationshipMemory";

describe("buildRelationshipMemorySnapshot", () => {
  test("summarizes pair stage and recurring loops from raw memories", async () => {
    const snapshot = await buildRelationshipMemorySnapshot({
      conversationId: "conv_1",
      personMemoryResults: [
        {
          content:
            "Alice tends to avoid direct statements when the conversation starts becoming more emotionally explicit.",
        },
      ],
      episodicMemoryResults: [
        {
          content:
            "They got close several times, but both became noticeably careful when the topic shifted toward meeting in person.",
        },
      ],
      eventLogResults: [
        { content: "They mentioned meeting for coffee next weekend." },
      ],
      foresightResults: [
        {
          content:
            "The relationship may be approaching a meetup threshold, but both users are still hesitating.",
        },
      ],
    });

    expect(snapshot.conversationId).toBe("conv_1");
    expect(snapshot.pairStage).toBe("warming");
    expect(snapshot.recurringLoops.length).toBeGreaterThan(0);
    expect(snapshot.personAMemory).toContain("avoid direct statements");
    expect(snapshot.momentumForecast).toContain("meetup");
  });
});
