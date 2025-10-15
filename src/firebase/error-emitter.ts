
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class TypedEventEmitter {
  private emitter = new EventEmitter();

  emit<E extends keyof AppEvents>(event: E, ...args: Parameters<AppEvents[E]>) {
    this.emitter.emit(event, ...args);
  }

  on<E extends keyof AppEvents>(event: E, listener: AppEvents[E]) {
    this.emitter.on(event, listener);
  }

  off<E extends keyof AppEvents>(event: E, listener: AppEvents[E]) {
    this.emitter.off(event, listener);
  }
}

export const errorEmitter = new TypedEventEmitter();
