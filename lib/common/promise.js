let promiseQueue = Promise.resolve();


export function allResolved(promises) {
  return new Promise(resolve => {
    Promise.all(promises).then(() => {
      resolve(true);
    }).catch(() => {
      resolve(false);
    });
  });
}


export function awaitAll(arr, proFunc) {
  return new Promise((resolve, reject) => {
    allResolved(arr.map(proFunc)).then(resolve).catch(reject);
  });
}


export function addPromiseToQueue(promiseFunc) {
  promiseQueue = promiseQueue.then(() => {
    return promiseFunc().then(() => {
      // 确保返回void类型
      return;
    });
  }).catch(() => {});
}
