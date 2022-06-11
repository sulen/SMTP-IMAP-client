import rfc2047 from "rfc2047";
import { getFlags, getHeaderField, getId } from "./common.js";

const separator = /^\)\r\n/gm;

export default function ImapFetchParser() {
  return { parse };

  function parse(body) {
    const bodyArray = body.split(separator);
    return bodyArray
      .map((item) => ({
        id: getId(item),
        flags: getFlags(item),
        date: getHeaderField(item, "Date"),
        subject: rfc2047.decode(getHeaderField(item, "Subject")),
        from: rfc2047.decode(getHeaderField(item, "From")),
      }))
      .reverse();
  }
}
