import Result from "../result";

export default function extractToken(str: string): Result<Array<string>> {
  //Negative lookbehind used - which the V8-engine supports but some may not
  //However, this is acceptable as it runs on the server-side.
  const tokenPattern =
    /(?:(?!<[^\s])[\w\d]*((?:"[^"]*")|(?:'[^']*'))?(?![^\s]))/g;
  const tokenStreamPattern =
    /^(\s*(?:(?!<[^\s])[\w\d]*((?:"[^"]*")|(?:'[^']*'))?(?![^\s]))\s*)*$/;

  if (!str.match(tokenStreamPattern))
    return Result.err("(ERR) input is not a valid stream of token");
  return Result.ok(
    [...str.matchAll(tokenPattern)]
      .map((tuple) => aposMerge(tuple[0]).value as string)
      .filter((str) => str !== "")
  );
}

export function aposMerge(str: string): Result<string> {
  const tokenPattern =
    /^\s*(?<first>[\w\d]*)(?<second>(?:"[^"]*")|(?:'[^']*'))?\s*$/;
  const matched = str.match(tokenPattern);
  if (matched === null) return Result.err("(ERR) input is not a word");
  const groups = matched.groups;
  const first = groups!.first;
  const second = groups!.second;
  return Result.ok(
    first + (second === undefined ? "" : second.slice(1, second.length - 1))
  );
}
