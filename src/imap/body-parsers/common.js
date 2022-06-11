export function getId(body) {
  return Number(body.match(/\*.+?UID (\d+)/)[1]);
}

export function getFlags(body) {
  const flagsString = body.match(/\*.+?\(.*?FLAGS \((.+?)\)/)[1];
  const flags = flagsString
    .toLowerCase()
    .split(" ")
    .map((flag) => flag.replace("\\", ""));

  return {
    isSeen: flags.includes("seen"),
    isAnswered: flags.includes("answered"),
    isFlagged: flags.includes("flagged"),
    isDeleted: flags.includes("deleted"),
    isDraft: flags.includes("draft"),
    isRecent: flags.includes("recent"),
  };
}

export function getHeaderField(body, name) {
  const pattern = new RegExp(`(^${name}:[\\s\\S]+?)\\r\\n(\\S|$)`, "m");
  const field = body.match(pattern)?.[1];
  return field?.replace(`${name}: `, "");
}