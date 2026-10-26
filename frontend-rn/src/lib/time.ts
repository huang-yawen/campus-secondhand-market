// 后端返回的时间都不带时区后缀：聊天(chat_service)存的是北京时间，其余表存的是 UTC。
// 直接 new Date() 会按设备时区解析，这里显式补上时区，返回毫秒时间戳

const HAS_TZ = /([zZ]|[+-]\d\d:\d\d)$/;

export function parseUtc(value: string): number {
  if (!value) return NaN;
  return new Date(HAS_TZ.test(value) ? value : value + 'Z').getTime();
}

export function parseBeijing(value: string): number {
  if (!value) return NaN;
  return new Date(HAS_TZ.test(value) ? value : value + '+08:00').getTime();
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

// 毫秒时间戳 → YYYY-MM-DD HH:mm（设备本地时区）
export function formatDateTime(ms: number): string {
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
