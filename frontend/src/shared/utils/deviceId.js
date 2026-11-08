// Stable device id for NFR Auditing (sent as X-Device-Id).
const DEVICE_KEY = 'retailone.deviceId';

function fallbackUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getDeviceId() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = window.crypto && typeof window.crypto.randomUUID === 'function' ? window.crypto.randomUUID() : fallbackUuid();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

