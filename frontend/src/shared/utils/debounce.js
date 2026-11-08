/** Returns a debounced function with .cancel() and .flush(). */
export function debounce(fn, wait = 300) {
  let timer = null;
  let lastArgs = null;

  function debounced(...args) {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...lastArgs);
    }, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn(...lastArgs);
    }
  };

  return debounced;
}

