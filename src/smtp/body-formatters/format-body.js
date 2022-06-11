export default function formatBody(content, attachments) {
  if (!attachments) return plainTextBodyFormatter(content);
  return multipartBodyFormatter(content, attachments);
}

function plainTextBodyFormatter(content) {
  return [
    "Content-Type: text/plain; charset=UTF-8; format=flowed",
    "",
    content,
  ];
}

function multipartBodyFormatter(content, attachments) {
  const boundary = "0000000000000" + getBoundary();
  const contentType = `Content-Type: multipart/mixed; boundary="${boundary}"`;

  return [
    contentType,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"\r\n',
    content,
    ...attachments.map(({ type, name, body }) => [
      `--${boundary}`,
      `Content-Type: ${type}; name="${name}"`,
      `Content-Disposition: attachment; filename="${name}"`,
      `Content-Transfer-Encoding: base64\r\n`,
      ...body.match(/.{1,76}/g),
    ]).flat(),
    `--${boundary}--`,
  ];
}

function getBoundary() {
  return Array(2).fill(Math.random().toString(36).slice(2)).join("");
}
