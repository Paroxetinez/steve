import {
  RELATIONSHIP_MEMORY_REFRESH_VERSION,
  RELATIONSHIP_STAGE_LABELS,
} from "./relationshipMemoryPrompts";

type MemoryResult = {
  content: string;
};

type BuildRelationshipMemorySnapshotArgs = {
  conversationId: string;
  personMemoryResults: MemoryResult[];
  episodicMemoryResults: MemoryResult[];
  eventLogResults: MemoryResult[];
  foresightResults: MemoryResult[];
};

function joinMemoryContents(results: MemoryResult[]) {
  return results
    .map((result) => result.content.trim())
    .filter(Boolean)
    .join(" ");
}

function inferPairStage(haystack: string) {
  if (/(warm|close|careful|meeting|meetup|hesitat)/i.test(haystack)) {
    return RELATIONSHIP_STAGE_LABELS.warming;
  }

  if (/(stalled|stuck|drift|flat)/i.test(haystack)) {
    return RELATIONSHIP_STAGE_LABELS.stalled;
  }

  return RELATIONSHIP_STAGE_LABELS.early;
}

function inferRecurringLoops(haystack: string) {
  const loops: string[] = [];

  if (/(careful|hesitat|avoid direct|indirect)/i.test(haystack)) {
    loops.push("Both users become more careful when the conversation turns more explicit.");
  }

  if (/(meeting|coffee|weekend|meetup)/i.test(haystack)) {
    loops.push("Momentum tends to gather around possible meetup planning.");
  }

  return loops;
}

export async function buildRelationshipMemorySnapshot({
  conversationId,
  personMemoryResults,
  episodicMemoryResults,
  eventLogResults,
  foresightResults,
}: BuildRelationshipMemorySnapshotArgs) {
  const personMemory = joinMemoryContents(personMemoryResults);
  const episodicMemory = joinMemoryContents(episodicMemoryResults);
  const eventLog = joinMemoryContents(eventLogResults);
  const foresight = joinMemoryContents(foresightResults);
  const fullHaystack = [personMemory, episodicMemory, eventLog, foresight]
    .filter(Boolean)
    .join(" ");

  return {
    conversationId,
    pairSummary: episodicMemory || eventLog || personMemory || foresight,
    pairStage: inferPairStage(fullHaystack),
    recurringLoops: inferRecurringLoops(fullHaystack),
    openThreads: eventLog ? [eventLog] : [],
    personAMemory: personMemory,
    personBMemory: "",
    interventionHints: inferRecurringLoops(fullHaystack),
    momentumForecast: foresight || eventLog,
    confidence: fullHaystack ? 0.6 : 0,
    sourceVersion: RELATIONSHIP_MEMORY_REFRESH_VERSION,
  };
}
