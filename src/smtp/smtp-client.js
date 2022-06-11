import tls from "tls";
import crypto from "crypto";
import StreamReader from "../imap/stream-reader.js";

const CMD = {
  EHLO: "EHLO",
  LOGIN: "AUTH LOGIN",
  QUIT: "QUIT",
  DATA: "DATA",
  STARTTLS: "STARTTLS",
  SELECT: "SELECT",
  UID_SEARCH: "UID SEARCH",
  UID_FETCH: "UID FETCH",
};

async function smtpClient({ host, port, log = console.log }) {
  let counter = 1;
  const client = await setup();

  return {
    ehlo,
    login,
    quit,
    mailFrom,
    mailTo,
    data,
    select,
    search,
    fetch,
  };

  async function ehlo(domain) {
    await writeMessage(CMD.EHLO, domain);
  }

  async function login(email, password) {
    await writeMessage(CMD.LOGIN);
    await writeMessage(Buffer.from(email).toString("base64"));
    await writeMessage(Buffer.from(password).toString("base64"));
  }

  async function mailFrom(email) {
    return writeMessage(`MAIL FROM:<${email}>`);
  }

  async function mailTo(email) {
    return writeMessage(`RCPT TO:<${email}>`);
  }

  async function quit() {
    return writeMessage(CMD.QUIT);
  }

  async function data(from, to, subject, body) {
    const uuid = crypto.randomBytes(16).toString("hex");
    await writeMessage(CMD.DATA);
    const lines = [
      `<!--Message-ID: <${uuid}@mail.yahoo.com>-->`,
      `Date: ${(new Date().toUTCString())}`,
      "Mime-Version: 1.0",
      // 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Thunderbird/91.8.1',
      "Content-Language: pl",
      // `Reply-to: ${from}`,
      // `Return-Path: <${from}>`,
      `To: ${to}`,
      `From: test imap <${from}>`,
      // 'X-Mailer: Node v14.16.0',
      // `References: <${uuid}.ref@mail.yahoo.com>`,
      `Subject: ${subject}`,
      ...body,
      ".",
    ];
    await writeMessage(lines.join("\r\n"));
    // return writeMessage('\r\n.\r\n');
  }

  async function select(mailbox) {
    return writeMessage(CMD.SELECT, mailbox);
  }

  async function search(...criteria) {
    return writeRawMessage(CMD.UID_SEARCH, ...criteria);
  }

  async function fetch(...sequence) {
    return writeRawMessage(CMD.UID_FETCH, ...sequence);
  }

  async function writeMessage(command, ...args) {
    const parseArgs = (args) => args.map((arg) => `"${arg}"`);

    return writeRawMessage(command, ...parseArgs(args));
  }

  async function writeRawMessage(command, ...args) {
    function getArgs(a) {
      if (!a || a.length === 0) return "";
      return ` ${args.join(" ")}`;
    }

    return new Promise((resolve, reject) => {
      const currentCounter = counter++;
      // const tag = `A${currentCounter}`;
      const message = `${command}${getArgs(args)}\r\n`;
      client.write(message);
      log(message);

      const streamReader = StreamReader("");
      const onDataReceived = (data) => {
        streamReader.push(data.toString());

        if (streamReader.isDone()) {
          client.off("data", onDataReceived);
          const response = streamReader.getMessage();
          log(response);
          resolve(response);
        }
      };
      client.on("data", onDataReceived);

      client.once("error", reject);
    });
  }

  async function setup() {
    return new Promise((resolve, reject) => {
      const client = tls.connect(
        { port, host, servername: host, rejectUnauthorized: false },
        () => {
          if (client.authorized) {
            client.once("data", () => {
              resolve(client);
            });
          } else {
            reject(client.authorizationError);
          }
        }
      );
    });
  }
}

export default smtpClient;
