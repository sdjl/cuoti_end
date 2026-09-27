/*
  把 sh.abc()这样的文案，改成 abc() 这样，去掉sh.
*/


export function randomInt(max) {
  return Math.floor(Math.random() * max);
}


export function randomString(size, {
  onlyLowercase = false
} = {}) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const s = onlyLowercase ? lower : upper + lower + digits;
  let result = "";
  for (let i = 0; i < size; i++) {
    result += s.charAt(Math.floor(Math.random() * s.length));
  }
  return result;
}


export function randomNumber(size) {
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < size; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}



export function randomChoose(l, count = 1) {
  const l2 = Array.from(l);
  if (l2.length > 0) {
    if (count === 1) {
      return l2[Math.floor(Math.random() * l2.length)];
    } else {
      const shuffled = l2.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  } else {
    return count === 1 ? null : [];
  }
}
