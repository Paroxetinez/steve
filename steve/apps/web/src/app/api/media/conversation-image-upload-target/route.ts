import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { createConversationImageUploadTarget } from "@/lib/server/r2Upload";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionToken?: string;
      conversationId?: string;
      contentType?: string;
    };

    if (!body.sessionToken || !body.conversationId || !body.contentType) {
      return NextResponse.json(
        { error: "sessionToken, conversationId, and contentType are required" },
        { status: 400 },
      );
    }

    const { conversationId } = await fetchQuery(
      api.chatMessages.getConversationImageUploadContext,
      {
        sessionToken: body.sessionToken,
        conversationId: body.conversationId as Id<"conversations">,
      },
    );

    const target = await createConversationImageUploadTarget({
      conversationId: String(conversationId),
      contentType: body.contentType,
    });

    return NextResponse.json(target);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload target";
    const status = /Unauthorized|Forbidden/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
