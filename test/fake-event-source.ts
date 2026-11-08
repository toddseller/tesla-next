import { act } from "@testing-library/react";

// The stream: each instance the hook opens, and what it has been sent.
export class FakeStream {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static opened: FakeStream[] = [];
  readyState = FakeStream.CONNECTING;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  listeners: Record<string, (event: MessageEvent) => void> = {};
  closed = false;
  constructor(public url: string) {
    FakeStream.opened.push(this);
  }
  addEventListener(name: string, listener: (event: MessageEvent) => void) {
    this.listeners[name] = listener;
  }
  close() {
    this.closed = true;
  }
  // The browser's own retry after a dropped connection keeps it connecting; an answer other than 200 closes it for good.
  fail(forGood: boolean) {
    this.readyState = forGood ? FakeStream.CLOSED : FakeStream.CONNECTING;
    act(() => this.onerror?.());
  }
  // The server answering 200, first or after a retry.
  connect() {
    this.readyState = FakeStream.OPEN;
    act(() => this.onopen?.());
  }
  send(data: unknown, name?: string) {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    act(() => (name ? this.listeners[name](event) : this.onmessage!(event)));
  }
}
