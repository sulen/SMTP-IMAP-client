function StreamReader(tag) {
  const pattern = new RegExp(`(^|(\\r\\n))${tag}.*\\r\\n`);
  let message = "";

  function push(data) {
    message += data;
  }

  function isDone() {
    const qwe = message.search(pattern);
    return qwe !== -1;
  }

  function getMessage() {
    return message;
  }

  return {
    push,
    isDone,
    getMessage,
  };
}

export default StreamReader;
