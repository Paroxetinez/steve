import assert from "node:assert/strict";
import {
  canSubmitNativePhoneRegistration,
  canSubmitNativePhoneLogin,
  normalizeNativePhone,
} from "../nativePhoneAuthForm.ts";

assert.equal(normalizeNativePhone("138-0013-8000"), "13800138000");
assert.equal(
  canSubmitNativePhoneLogin({
    phone: "13800138000",
    password: "123456",
  }),
  true,
);
assert.equal(
  canSubmitNativePhoneLogin({
    phone: "1380013800",
    password: "123456",
  }),
  false,
);
assert.equal(
  canSubmitNativePhoneLogin({
    phone: "13800138000",
    password: "12345",
  }),
  false,
);
assert.equal(
  canSubmitNativePhoneRegistration({
    phone: "13800138000",
    password: "123456",
    confirmPassword: "123456",
    inviteCode: "ABCD12",
  }),
  true,
);
assert.equal(
  canSubmitNativePhoneRegistration({
    phone: "13800138000",
    password: "123456",
    confirmPassword: "12345",
    inviteCode: "ABCD12",
  }),
  false,
);

console.log("nativePhoneAuthForm tests passed");
