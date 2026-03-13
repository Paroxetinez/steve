import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@packages/backend/convex/_generated/api";
import { createAvatarUploadTarget } from "@/lib/server/r2Upload";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionToken?: string;
      contentType?: string;
    };

    if (!body.sessionToken || !body.contentType) {
      return NextResponse.json(
        { error: "sessionToken and contentType are required" },
        { status: 400 },
      );
    }

    const { userId } = await fetchQuery(api.chatProfilesStorage.getAvatarUploadContext, {
      sessionToken: body.sessionToken,
    });

    const target = await createAvatarUploadTarget({
      userId: String(userId),
      contentType: body.contentType,
    });

    return NextResponse.json(target);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload target";
    const status = /Unauthorized/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
