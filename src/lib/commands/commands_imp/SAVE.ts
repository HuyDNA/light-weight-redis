import Command from "../command";
import Result from "../../result";
import Store from "../../store";
import Log from "../../logger";
import LogEntry from "../../logentry";
export default class SAVECommand extends Command {
  execute(store: Store): Result<number> {
    return new Result<number>(null, null);
  }
}
