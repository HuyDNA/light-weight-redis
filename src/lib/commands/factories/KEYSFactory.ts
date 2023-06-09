import CommandFactory from "../commandFactory";
import KEYSCommand from "../commands_imp/KEYS";
import Result from "../../result";
import extractToken from "../../utils/extractToken";

export default class KEYSFactory extends CommandFactory {
  constructor() {
    super("KEYS", [], []);
  }

  create(rawString: string): Result<KEYSCommand> {
    const matchRes = extractToken(rawString);

    if (matchRes.error !== null || matchRes.value === null)
      return Result.err("ERR invalid arguments");

    const tokenList = matchRes.value;
    if (tokenList[0] !== "KEYS") return Result.err("ERR not a KEYS command");

    if (tokenList.length != 1)
      return Result.err("ERR KEYS does not accept any arguments");

    return Result.ok(new KEYSCommand());
  }
}
