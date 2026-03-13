import { webViewport } from "../viewportConfig";

describe("webViewport", () => {
  test("requests content resizing for interactive widgets such as the iOS keyboard", () => {
    expect(webViewport.interactiveWidget).toBe("resizes-content");
  });

  test("uses cover viewport fitting for edge-to-edge mobile layouts", () => {
    expect(webViewport.viewportFit).toBe("cover");
  });
});
