interface ObjectWithID {
  id: string;
}

export interface DeltaEngine<T extends ObjectWithID> {
  fetch(): Promise<T[]>;
  onCreate(fn: (item: T) => void): (item: T) => void;
  offCreate(fn: (item: T) => void): void;

  onDelete(fn: (item: T) => void): (item: T) => void;
  offDelete(fn: (item: T) => void): void;
}
