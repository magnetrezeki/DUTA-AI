const injectionPatterns = [
  /ignore (all|previous|prior) (instructions|rules)/i,
  /system prompt/i,
  /developer message/i,
  /jailbreak/i,
  /bypass (rls|authorization|security)/i,
];

const prohibitedPatterns = [
  /service[-_ ]role/i,
  /api key|password|secret|token/i,
  /all (users|cvs|career passports|profiles)/i,
  /generic sql|run sql|select \* from/i,
  /diagnose (me|my)|medical diagnosis|prescribe/i,
];

export function inspectPrompt(message: string):
  | { allowed: true; message: string }
  | { allowed: false; reason: string } {
  const normalized = message.trim().slice(0, 800);
  if (!normalized) return { allowed: false, reason: "Pertanyaan belum diisi." };
  if (injectionPatterns.some((pattern) => pattern.test(normalized))) {
    return { allowed: false, reason: "Permintaan terdeteksi mencoba mengubah aturan keamanan DUTA AI." };
  }
  if (prohibitedPatterns.some((pattern) => pattern.test(normalized))) {
    return { allowed: false, reason: "Permintaan meminta data atau kemampuan yang tidak boleh diakses AI." };
  }
  return { allowed: true, message: normalized };
}
