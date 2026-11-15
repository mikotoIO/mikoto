/** Minimal stand-in for the browser WebSocket, driven by tests. */
export class FakeSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: FakeSocket[] = [];

  readyState = 0;
  sent: { op: string; data: unknown }[] = [];
  closedWith?: number;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }

  static latest() {
    return FakeSocket.instances[FakeSocket.instances.length - 1];
  }

  send(raw: string) {
    this.sent.push(JSON.parse(raw));
  }

  close(code?: number) {
    this.closedWith = code;
    this.readyState = FakeSocket.CLOSED;
  }

  // test helpers
  serverOpen() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  serverSend(op: string, data: unknown = null) {
    this.onmessage?.({ data: JSON.stringify({ op, data }) });
  }
  serverClose() {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }
}

/** Let pending promise callbacks run. */
export async function flushMicrotasks() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}
