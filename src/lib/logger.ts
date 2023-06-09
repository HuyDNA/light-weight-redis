import LogEntry from "./logentry";
import Result from "./result";

export default class Logger {
  #log: Array<LogEntry>;
  #checkpoints: Array<number>;

  constructor() {
    this.#log = new Array();
    this.#checkpoints = new Array();
  }

  pushEntry(entry: LogEntry) {
    this.#log.push(entry);
  }

  popEntry(): Result<LogEntry> {
    const entry = this.#log.pop();
    if (entry === undefined) return Result.err("No more log entries to pop");
    return Result.ok(entry);
  }

  length(): number {
    return this.#log.length;
  }

  dump() {
    return {
      entries: [...this.#log],
      checkpoints: [...this.#checkpoints],
    };
  }

  takeCheckpoint() {
    if (this.#checkpoints[this.#checkpoints.length - 1] != this.#log.length - 1)
      this.#checkpoints.push(this.#log.length - 1);
  }

  popCheckpoint(): number | undefined {
    return this.#checkpoints.pop();
  }

  lastCheckpoint(): number | undefined {
    if (this.#checkpoints.length === 0) return undefined;
    return this.#checkpoints[this.#checkpoints.length - 1];
  }
}
