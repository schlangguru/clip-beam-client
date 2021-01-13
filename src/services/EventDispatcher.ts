export class EventDispatcher<T> {
  private listeners: ((data: T) => void)[] = [];

  addListener(listener: (data: T) => void) {
    this.listeners.push(listener);
  }

  dispatch(data: T) {
    this.listeners.forEach(l => l(data));
  }
}
