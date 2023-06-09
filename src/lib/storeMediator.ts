import Command from "./commands/command";
import Logger from "./logger";
import Store from "./store";
import LogEntry from "./logentry";
import Result from "./result";
import fs from "fs";
import Parser from "./parser";
import commandMapping from "./commandMapping";
import EventTimer from "./utils/eventTimer";
import DELCommand from "./commands/commands_imp/DEL";

export default class StoreMediator {
  #store: Store;
  #logger: Logger;
  #timerStore: Map<string, EventTimer>;

  constructor(store: Store, logger: Logger) {
    this.#store = store;
    this.#logger = logger;
    this.#timerStore = new Map<string, EventTimer>();
    this.#recoverFromPersist();
  }

  #recoverFromPersist() {
    let parser = new Parser(commandMapping);
    try {
      const logRawContent = fs
        .readFileSync("./log.json", {
          encoding: "utf8",
          flag: "r",
        })
        .toString();
      const log = JSON.parse(logRawContent);

      for (let logRawEntry of log.entries) {
        const commandRes = parser.parse(logRawEntry);
        const command = commandRes.value;
        if (commandRes.error !== null || command === null) {
          console.log(
            "[Warning] Invalid command encountered in persisted log."
          );
          continue;
        }
        command.execute(this);
      }
    } catch {
      console.log("[Warning] Reading from persisted log fails.");
    }
  }

  getStore(): Store {
    return this.#store;
  }

  setTimeout(key: string, milliseconds: number) {
    const timer = this.#timerStore.get(key);
    if (timer !== undefined) timer.clear();
    this.#timerStore.set(
      key,
      new EventTimer(() => {
        this.acceptCommand(new DELCommand(key));
        this.#timerStore.delete(key);
      }, milliseconds)
    );
  }

  getTimeout(key: string): number | undefined {
    const timer = this.#timerStore.get(key);
    return timer === undefined ? undefined : timer.getRemainingTime();
  }

  clearTimeout(key: string) {
    const timeout = this.#timerStore.get(key);
    if (timeout !== undefined) timeout.clear();
    this.#timerStore.delete(key);
  }

  acceptCommand(command: Command): Result<any> {
    const rollbackCommandRes = command.getRollbackCommand(this);
    const res = command.execute(this);
    if (
      res.error !== null ||
      rollbackCommandRes.error !== null ||
      rollbackCommandRes.value === null
    )
      return res;

    this.#logger.pushEntry(new LogEntry(command, rollbackCommandRes.value));
    return res;
  }

  takeSnapshot(): Result<any> {
    this.#logger.takeCheckpoint();
    this.persistLog();
    return Result.mes("OK");
  }

  restoreSnapshot(): Result<any> {
    const currentPoint = this.#logger.length() - 1;
    let checkpoint = this.#logger.popCheckpoint();

    if (checkpoint === undefined) return Result.err("No snapshot taken");

    if (currentPoint === checkpoint) {
      checkpoint = this.#logger.popCheckpoint();

      if (checkpoint === undefined) return Result.err("No snapshot taken");
    }

    while (this.#logger.length() > checkpoint + 1) {
      const entry = this.#logger.popEntry().value as LogEntry;
      if (entry.backwardCommand === null) continue;
      entry.backwardCommand.execute(this);
    }
    this.#logger.takeCheckpoint();
    return Result.mes("OK");
  }

  persistLog() {
    const log = this.#logger.dump();
    const serializedLog = {
      checkpoints: log.checkpoints,
      entries: log.entries.map((entry) => entry.forwardCommand.toString()),
    };

    fs.writeFile("./log.json", JSON.stringify(serializedLog), function (err) {
      if (err) console.log(`[write log]: ${err}`);
      else console.log("[write log]: success");
    });
  }
}
