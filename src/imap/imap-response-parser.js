const separator = "\r\n";

export default function ImapResponseParser(bodyParser) {
  return { parse };

  function parse(response) {
    const responseArray = response.split(separator);
    responseArray.pop();
    const statusString = responseArray.pop();

    const bodyString = responseArray.join(separator);

    return {
      status: parseStatus(statusString),
      body: bodyParser ? bodyParser().parse(bodyString) : bodyString,
    };
  }
}

function parseStatus(statusString) {
  const [tag, code, ...messageArray] = statusString.split(" ");
  return {
    tag,
    code,
    message: messageArray.join(" "),
  };
}
