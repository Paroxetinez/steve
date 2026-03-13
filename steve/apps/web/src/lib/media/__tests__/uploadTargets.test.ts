import {
  requestConversationImageUploadTarget,
  uploadConversationImageWithFallback,
  uploadConversationImageViaApi,
  uploadFileToSignedUrl,
} from "../uploadTargets";

describe("uploadConversationImageViaApi", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("uploads the file through the same-origin api", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          objectKey: "conversation_media/images/c1/test.png",
          publicUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.png",
        }),
      json: async () => ({
        objectKey: "conversation_media/images/c1/test.png",
        publicUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.png",
      }),
    }) as typeof fetch;

    const file = new File(["hello"], "test.png", { type: "image/png" });

    const result = await uploadConversationImageViaApi({
      sessionToken: "session-token",
      conversationId: "c1" as never,
      file,
    });

    expect(result.objectKey).toBe("conversation_media/images/c1/test.png");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/media/conversation-image-upload",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const formData = options.body as FormData;
    expect(formData.get("sessionToken")).toBe("session-token");
    expect(formData.get("conversationId")).toBe("c1");
    expect(formData.get("file")).toBe(file);
  });

  test("surfaces api errors instead of throwing a generic fetch failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () =>
        JSON.stringify({
          error: "Image upload failed",
        }),
      json: async () => ({
        error: "Image upload failed",
      }),
    }) as typeof fetch;

    await expect(
      uploadConversationImageViaApi({
        sessionToken: "session-token",
        conversationId: "c1" as never,
        file: new File(["hello"], "test.png", { type: "image/png" }),
      }),
    ).rejects.toThrow("Image upload failed");
  });

  test("surfaces non-json gateway errors as plain text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => "Bad Gateway",
    }) as typeof fetch;

    await expect(
      uploadConversationImageViaApi({
        sessionToken: "session-token",
        conversationId: "c1" as never,
        file: new File(["hello"], "test.png", { type: "image/png" }),
      }),
    ).rejects.toThrow("Bad Gateway");
  });
});

describe("requestConversationImageUploadTarget", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("requests a signed upload target through the lightweight api", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          objectKey: "conversation_media/images/c1/test.jpg",
          publicUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.jpg",
          uploadUrl: "https://signed-upload.example/test",
        }),
    }) as typeof fetch;

    const target = await requestConversationImageUploadTarget({
      sessionToken: "session-token",
      conversationId: "c1" as never,
      contentType: "image/jpeg",
    });

    expect(target.uploadUrl).toBe("https://signed-upload.example/test");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/media/conversation-image-upload-target",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionToken: "session-token",
          conversationId: "c1",
          contentType: "image/jpeg",
        }),
      }),
    );
  });
});

describe("uploadFileToSignedUrl", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("uploads the file directly to the signed url", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    }) as typeof fetch;

    const file = new File(["hello"], "test.jpg", { type: "image/jpeg" });
    await uploadFileToSignedUrl({
      uploadUrl: "https://signed-upload.example/test",
      file,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://signed-upload.example/test",
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": "image/jpeg",
        },
        body: file,
      }),
    );
  });
});

describe("uploadConversationImageWithFallback", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("surfaces a direct-upload stage error instead of falling back through the web app", async () => {
    const file = new File(["hello"], "test.jpg", { type: "image/jpeg" });

    global.fetch = (jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            objectKey: "conversation_media/images/c1/direct.jpg",
            publicUrl: "https://steve.haloworld.me/conversation_media/images/c1/direct.jpg",
            uploadUrl: "https://signed-upload.example/test",
          }),
      })
      .mockRejectedValueOnce(new TypeError("Failed to fetch")) as unknown) as typeof fetch;

    await expect(
      uploadConversationImageWithFallback({
        sessionToken: "session-token",
        conversationId: "c1" as never,
        file,
      }),
    ).rejects.toThrow("Direct upload failed: Failed to fetch");

    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2);
  });

  test("surfaces an upload-target stage error before attempting direct upload", async () => {
    const file = new File(["hello"], "test.jpg", { type: "image/jpeg" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: "target creation failed" }),
    }) as typeof fetch;

    await expect(
      uploadConversationImageWithFallback({
        sessionToken: "session-token",
        conversationId: "c1" as never,
        file,
      }),
    ).rejects.toThrow("Upload target failed: target creation failed");

    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(1);
  });
});
