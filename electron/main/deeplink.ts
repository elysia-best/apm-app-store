/**
 * Deep link handler for Electron app.
 * Author: juxnpxblo@github
 */
import { app } from "electron";
type Query = Record<string, string>;
export type Listener = (query: Query) => any;

class ListenersMap {
  private map: Map<string, Set<Listener>> = new Map();

  add(action: string, listener: Listener) {
    if (!this.map.has(action)) {
      this.map.set(action, new Set());
    }
    this.map.get(action)!.add(listener);

    return this.map.get(action)!.size;
  }

  remove(action: string, listener: Listener) {
    const listeners = this.map.get(action);
    if (!listeners) return 0;

    listeners.delete(listener);

    if (listeners.size === 0) {
      this.map.delete(action);
      return 0;
    }

    return listeners.size;
  }

  emit(action: string, query: Query) {
    const actionListeners = this.map.get(action);
    if (!actionListeners) return 0;

    actionListeners.forEach((listener) => listener(query));

    return actionListeners.size;
  }
}

const protocols = ["apmstore"];
const listeners = new ListenersMap();

export const deepLink = {
  on: (event: string, listener: Listener) => {
    const count = listeners.add(event, listener);
    console.log(
      `Deep link: listener added for event ${event}. Total event listeners: ${count}`
    );
  },
  off: (event: string, listener: Listener) => {
    const count = listeners.remove(event, listener);
    console.log(
      `Deep link: listener removed for event ${event}. Total event listeners: ${count}`
    );
  },
  once: (event: string, listener: Listener) => {
    const onceListener: Listener = (query) => {
      deepLink.off(event, onceListener);
      listener(query);
    };
    deepLink.on(event, onceListener);
  },
};

app.on("second-instance", (_e, commandLine) => {
  const target = commandLine.find((arg) =>
    protocols.some((protocol) => arg.startsWith(protocol + "://"))
  );
  if (!target) return;

  console.log(`Deep link: protocol link got: ${target}`);

  try {
    const url = new URL(target);

    const action = url.hostname;
    console.log(`Deep link: action found: ${action}`);

    const query: Query = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    console.log(`Deep link: query found: ${JSON.stringify(query)}`);

    const emitCount = listeners.emit(action, query);
    console.log(`Deep link: emitted for ${emitCount} listeners`);
  } catch (error) {
    console.error(`Deep link: error parsing URL: ${error}`);
  }
});
