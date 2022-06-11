import tls from "tls";
import StreamReader from "./stream-reader.js";

const CMD = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LIST: "LIST",
  SELECT: "SELECT",
  UID_SEARCH: "UID SEARCH",
  UID_FETCH: "UID FETCH",
};

async function imapClient({ host, port, log = console.log }) {
  let counter = 1;
  const client = await setup();

  return {
    login,
    logout,
    list,
    select,
    search,
    fetch,
  };

  async function login(email, password) {
    return writeMessage(CMD.LOGIN, email, password);
  }

  async function logout() {
    return writeMessage(CMD.LOGOUT);
  }

  async function list(referenceName, mailbox) {
    return writeMessage(CMD.LIST, referenceName, mailbox);
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
      const tag = `A${currentCounter}`;
      const message = `${tag} ${command}${getArgs(args)}\r\n`;
      client.write(message);
      log(message);

      const streamReader = StreamReader(tag);
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

export default imapClient;
