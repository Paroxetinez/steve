import { getChatComposerTextareaClassName } from "../chatComposerInput";

describe("getChatComposerTextareaClassName", () => {
  test("uses a 16px textarea on mobile to avoid browser auto-zoom when focusing", () => {
    expect(getChatComposerTextareaClassName()).toContain("text-base");
  });

  test("keeps the denser textarea size on medium screens and above", () => {
    expect(getChatComposerTextareaClassName()).toContain("md:text-sm");
  });
});
