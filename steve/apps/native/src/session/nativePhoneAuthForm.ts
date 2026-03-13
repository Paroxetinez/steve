export function normalizeNativePhone(phone: string) {
  return phone.replace(/\D+/g, "");
}

export function canSubmitNativePhoneLogin(input: {
  phone: string;
  password: string;
}) {
  const normalizedPhone = normalizeNativePhone(input.phone);
  return normalizedPhone.length === 11 && input.password.trim().length >= 6;
}

export function canSubmitNativePhoneRegistration(input: {
  phone: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
}) {
  const normalizedPhone = normalizeNativePhone(input.phone);
  return (
    normalizedPhone.length === 11 &&
    input.password.trim().length >= 6 &&
    input.password === input.confirmPassword &&
    input.inviteCode.trim().length > 0
  );
}
