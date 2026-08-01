const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeBase32(value: number, length: number): string {
  let remaining = Math.floor(value);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result = ENCODING[remaining % 32] + result;
    remaining = Math.floor(remaining / 32);
  }
  return result;
}

function randomBase32(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ENCODING[byte % 32]).join("");
}

export function createUlid(): string {
  return `${encodeBase32(Date.now(), 10)}${randomBase32(16)}`;
}

export function createWorkspaceId(): string {
  return `ws_${createUlid()}`;
}

export function createWindowId(): string {
  return `win_${createUlid()}`;
}
