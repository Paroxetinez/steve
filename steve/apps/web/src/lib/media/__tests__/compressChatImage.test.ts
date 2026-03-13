import { compressChatImage } from "../compressChatImage";

describe("compressChatImage", () => {
  const originalImage = global.Image;
  const originalDocument = global.document;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    global.Image = originalImage;
    global.document = originalDocument;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  test("returns a jpeg file with a normalized filename", async () => {
    const drawImage = jest.fn();
    const fillRect = jest.fn();
    const toBlob = jest.fn((callback: BlobCallback, type?: string, quality?: number) => {
      expect(type).toBe("image/jpeg");
      expect(quality).toBe(0.82);
      callback(new Blob(["compressed"], { type: "image/jpeg" }));
    });

    global.document = {
      createElement: jest.fn(() => ({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage, fillRect }),
        toBlob,
      })),
    } as unknown as Document;

    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();

    class MockImage {
      width = 1600;
      height = 1200;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    global.Image = MockImage as never;

    const file = new File(["source"], "photo.png", { type: "image/png" });

    const result = await compressChatImage(file);

    expect(result.file).toBeInstanceOf(File);
    expect(result.file.type).toBe("image/jpeg");
    expect(result.file.name).toBe("photo.jpg");
    expect(result.metadata).toEqual({
      mimeType: "image/jpeg",
      sizeBytes: result.file.size,
      width: 1600,
      height: 1200,
    });
    const canvas = (global.document.createElement as jest.Mock).mock.results[0].value;
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(fillRect).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  test("downscales oversized tall images before encoding", async () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: jest.fn(), fillRect: jest.fn() }),
      toBlob: (callback: BlobCallback) => callback(new Blob(["compressed"], { type: "image/jpeg" })),
    };

    global.document = {
      createElement: jest.fn(() => canvas),
    } as unknown as Document;

    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();

    class MockImage {
      width = 3000;
      height = 4000;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    global.Image = MockImage as never;

    const result = await compressChatImage(
      new File(["source"], "portrait.heic", { type: "image/heic" }),
    );

    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(1600);
    expect(result.metadata.width).toBe(1200);
    expect(result.metadata.height).toBe(1600);
  });
});
