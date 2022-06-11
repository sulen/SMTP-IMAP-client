import smtpClient from "./smtp-client.js";
import formatBody from "./body-formatters/format-body.js";

export default function SmtpService() {
  return {
    sendEmail,
  };

  async function sendEmail({ to, subject, content, attachments }) {
    const client = await getClient();
    await client.mailFrom(process.env.EMAIL);
    await client.mailTo(to);
    await client.data(
      process.env.EMAIL,
      to,
      subject,
      formatBody(content, attachments)
    );
    await client.quit();
    // const fetch = await client.fetch(`${id} (FLAGS BODY[])`);
    // await client.logout();

    return {};
    // return ImapResponseParser(ImapFetchDetailsParser).parse(fetch);
  }
}

async function getClient() {
  const client = await smtpClient({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
  });
  await client.ehlo("example.com");
  await client.login(process.env.EMAIL, process.env.PASSWORD);
  // const login = await client.login(process.env.EMAIL, process.env.PASSWORD);
  // const select = await client.select("INBOX");

  return client;
}
