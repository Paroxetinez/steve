import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@packages/backend/convex/_generated/api";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import { uploadConversationImage } from "@/lib/server/r2Upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionToken = formData.get("sessionToken");
    const conversationId = formData.get("conversationId");
    const file = formData.get("file");

    if (
      typeof sessionToken !== "string" ||
      typeof conversationId !== "string" ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { error: "sessionToken, conversationId, and file are required" },
        { status: 400 },
      );
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please choose an image file" }, { status: 400 });
    }

    const { conversationId: verifiedConversationId } = await fetchQuery(
      api.chatMessages.getConversationImageUploadContext,
      {
        sessionToken,
        conversationId: conversationId as Id<"conversations">,
      },
    );

    const uploaded = await uploadConversationImage({
      conversationId: String(verifiedConversationId),
      contentType: file.type,
      body: new Uint8Array(await file.arrayBuffer()),
    });

    return NextResponse.json(uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    const status = /Unauthorized|Forbidden/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
