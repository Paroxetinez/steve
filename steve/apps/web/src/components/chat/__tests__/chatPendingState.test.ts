import { resolveChatPendingState } from "../chatPendingState";

describe("resolveChatPendingState", () => {
  test("shows the current user as pending while a text message is sending", () => {
    expect(
      resolveChatPendingState({
        sending: true,
        uploadingImage: false,
      }),
    ).toEqual({
      isMine: true,
      showPending: true,
    });
  });

  test("shows the current user as pending while an image is sending", () => {
    expect(
      resolveChatPendingState({
        sending: false,
        uploadingImage: true,
      }),
    ).toEqual({
      isMine: true,
      showPending: true,
    });
  });

  test("hides the pending bubble when idle", () => {
    expect(
      resolveChatPendingState({
        sending: false,
        uploadingImage: false,
      }),
    ).toEqual({
      isMine: false,
      showPending: false,
    });
  });
});
