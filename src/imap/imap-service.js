import imapClient from "./imap-client.js";
import ImapResponseParser from "./imap-response-parser.js";
import ImapFetchParser from "./body-parsers/imap-fetch-parser.js";
import ImapFetchDetailsParser from "./body-parsers/imap-fetch-details-parser.js";

export default function ImapService() {
  return {
    getEmails,
    getEmail,
  };

  async function getEmails() {
    const client = await getClient();
    const search = await client.search("ALL");
    const fetch = await client.fetch(
      "*:1 (FLAGS BODY.PEEK[HEADER.FIELDS (DATE FROM SUBJECT)])"
    );
    await client.logout();

    return ImapResponseParser(ImapFetchParser).parse(fetch);
  }

  async function getEmail(id) {
    const client = await getClient();
    const fetch = await client.fetch(`${id} (FLAGS BODY[])`);
    await client.logout();

    return ImapResponseParser(ImapFetchDetailsParser).parse(fetch);
  }
}

async function getClient() {
  const client = await imapClient({
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
  });
  const login = await client.login(process.env.EMAIL, process.env.PASSWORD);
  const select = await client.select("INBOX");

  return client;
}
