/*
  await sleep(毫秒)
*/
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
  断言条件，如果条件不为真，则抛出错误
*/
export function assert(condition, message = "") {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
