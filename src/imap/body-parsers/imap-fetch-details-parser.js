import rfc2047 from "rfc2047";
import sanitizeHtml from "sanitize-html";
import quotedPrintable from "quoted-printable";
import utf8 from "utf8";
import { getFlags, getHeaderField, getId } from "./common.js";

const separator = /^\)\r\n/gm;

export default function ImapFetchDetailsParser() {
  return { parse };

  function parse(body) {
    const item = body.split(separator)[0];
    const bodyProcessed = getBody(body);
    const flattenedBody = Array.isArray(bodyProcessed)
      ? bodyProcessed.flat()
      : [bodyProcessed];

    return {
      id: getId(item),
      flags: getFlags(item),
      date: getHeaderField(item, "Date"),
      subject: rfc2047.decode(getHeaderField(item, "Subject")),
      from: rfc2047.decode(getHeaderField(item, "From")),
      // body: getBody(body).flat(),
      parsedBody: getHtml(flattenedBody),
      attachments: getAttachments(flattenedBody),
    };
  }
}

function getAttachments(bodyArray) {
  return bodyArray
    .filter(({ headers: { contentDisposition } }) =>
      contentDisposition?.startsWith("attachment")
    )
    .map(({ content, headers: { contentDisposition, contentType } }) => ({
      content: `data:${contentType.match(/.+?;/)[0]}base64,${content.replace(
        /\r\n/g,
        ""
      )}`,
      fileName: contentDisposition?.match(/filename="(.+?)"/)[1],
    }));
}

function getHtml(bodyArray) {
  const htmlBody = bodyArray.find(({ headers: { contentType } }) =>
    contentType.startsWith("text/html")
  );
  const textBody = bodyArray.find(({ headers: { contentType } }) =>
    contentType.startsWith("text/plain")
  );
  if (textBody) {
    textBody.content = `<pre>${textBody.content}</pre>`;
  }
  const body = htmlBody ?? textBody;

  return body
    ? sanitizeHtml(utf8.decode(quotedPrintable.decode(body.content, {})), {
        allowedAttributes: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      })
    : undefined;
}

function getSectionInsideBoundary(body, boundary) {
  const pattern = new RegExp(`--${boundary}\\r\\n([\\s\\S]*?)--${boundary}--`);
  return body.match(pattern)[1];
}

function getSplitSectionByBoundary(section, boundary) {
  return section.split(`--${boundary}\r\n`);
}

function parseHeaders(headers) {
  return {
    contentType: getHeaderField(headers, "Content-Type"),
    contentTransferEncoding: getHeaderField(
      headers,
      "Content-Transfer-Encoding"
    ),
    contentDisposition: getHeaderField(headers, "Content-Disposition"),
  };
}

function parseBody(body) {
  const [, headers, content] = body.match(
    /([\s\S]*?\r\n)\r\n([\s\S]*?)((\)$)|$)/
  );
  return { headers: parseHeaders(headers), content };
}

function getBody(body) {
  const boundary = getBoundaryFromContentType(body);
  if (!boundary) {
    return parseBody(body);
  }

  const section = getSectionInsideBoundary(body, boundary);
  const splitSection = getSplitSectionByBoundary(section, boundary);

  return splitSection.map(getBody);
}

function getBoundaryFromContentType(body) {
  return getHeaderField(body, "Content-Type").match(/boundary="(.+)"/)?.[1];
}
