import CommandFactory from "../commandFactory";
import SADDCommand from "../commands_imp/SADD";
import Result from "../../result";
import extractToken from "../../utils/extractToken";

export default class SADDFactory extends CommandFactory {
  constructor() {
    super("SADD", ["key", "values"], [String, Array]);
  }

  create(rawString: string): Result<SADDCommand> {
    const matchRes = extractToken(rawString);

    if (matchRes.error !== null || matchRes.value === null)
      return Result.err("ERR invalid arguments");

    const tokenList = matchRes.value;
    if (tokenList[0] !== "SADD") return Result.err("ERR not a SADD command");

    if (tokenList.length < 3)
      return Result.err("ERR SADD expects at least 2 arguments");

    return Result.ok(new SADDCommand(tokenList[1], tokenList.slice(2)));
  }
}
