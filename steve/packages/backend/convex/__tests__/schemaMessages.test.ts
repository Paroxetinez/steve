const schema = require("../schema.ts").default;

describe("messages schema", () => {
  test("keeps current image lifecycle documents deployable", () => {
    const fields = schema.tables.messages.validator.fields;

    expect(fields.imageObjectKey).toBeDefined();
    expect(fields.imageObjectKey.isOptional).toBe("optional");
    expect(fields.imageStorageId).toBeDefined();
    expect(fields.imageStorageId.isOptional).toBe("optional");
    expect(fields.imageUploadStatus).toBeDefined();
    expect(fields.imageUploadStatus.isOptional).toBe("optional");
    expect(fields.imageUploadError).toBeDefined();
    expect(fields.imageUploadError.isOptional).toBe("optional");
    expect(fields.pendingImageObjectKey).toBeDefined();
    expect(fields.pendingImageObjectKey.isOptional).toBe("optional");
    expect(fields.clientMessageId).toBeDefined();
    expect(fields.clientMessageId.isOptional).toBe("optional");
    expect(fields.imageMimeType).toBeDefined();
    expect(fields.imageMimeType.isOptional).toBe("optional");
    expect(fields.imageSizeBytes).toBeDefined();
    expect(fields.imageSizeBytes.isOptional).toBe("optional");
    expect(fields.imageWidth).toBeDefined();
    expect(fields.imageWidth.isOptional).toBe("optional");
    expect(fields.imageHeight).toBeDefined();
    expect(fields.imageHeight.isOptional).toBe("optional");
  });
});
