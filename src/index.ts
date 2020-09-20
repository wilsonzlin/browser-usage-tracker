const debugLog = (msg: string) => console.debug(`[BUT] ${msg}`);

let lastActivityStarted = 0;
let lastActivityEnded = 0;
for (const name of ['keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart']) {
  document.addEventListener(name, () => {
    debugLog(`${name} activity`);
    if (!lastActivityStarted) {
      lastActivityStarted = Date.now();
    }
    lastActivityEnded = Date.now();
  }, {capture: true});
}

let windowHasFocus = false;
window.addEventListener('focus', () => {
  debugLog(`Window received focus`);
  windowHasFocus = true;
});
window.addEventListener('blur', () => {
  debugLog(`Window received blur`);
  windowHasFocus = false;
});

document.addEventListener('visibilitychange', () => {
  debugLog(`Page is ${document.visibilityState}`);
}, {capture: true});

const videoVisibility = new WeakMap<HTMLVideoElement, boolean>();

const intersectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    videoVisibility.set(entry.target as HTMLVideoElement, entry.isIntersecting);
  }
});
const videos = document.getElementsByTagName('video');

new MutationObserver(() => {
  for (const video of videos) {
    intersectionObserver.observe(video);
  }
}).observe(document, {
  childList: true,
  subtree: true,
});

const some = <T> (iterable: Iterable<T>, pred: (val: T) => boolean): boolean => {
  const it = iterable[Symbol.iterator]();
  while (true) {
    const next = it.next();
    if (next.done) {
      return false;
    }
    if (pred(next.value)) {
      return true;
    }
  }
};

const ACTIVITY_TRAIL = 3000;
// TICK_RATE should be less than ACTIVITY_TRAIL / 2.
const TICK_RATE = 1000;

setInterval(() => {
  const point = {
    url: location.href,
    title: document.title,
    activity: 0,
    focused: windowHasFocus,
    video: some(videos, v => !!videoVisibility.get(v) && !v.paused && !v.ended && v.readyState > 2 && v.currentTime > 0),
  };

  if (lastActivityStarted) {
    if (lastActivityEnded + ACTIVITY_TRAIL < Date.now()) {
      point.activity = lastActivityEnded - lastActivityStarted + ACTIVITY_TRAIL;
      debugLog(`Activity occurred for ${point.activity / 1000} seconds`);
      lastActivityStarted = lastActivityEnded = 0;
    }
  }
  if (point.focused) {
    debugLog(`Videos are visible and playing, page is ${windowHasFocus ? 'inactive' : 'active'}`);
  }

  console.log(point);
}, TICK_RATE);
