CodeMirror.defineMode("redwp", function(config, parserConfig) {
  var isTerminal = /[abcdefg0123456789#$&@]/;
  var isVariable = /[uvwxyzlrs]/;
  var isOperatorChar = /[\(\)=\->]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (ch == "i")
      return "meta";
    if (isOperatorChar.test(ch))
      return "operator";
    if (isVariable.test(ch))
      return "keyword";
    if (isTerminal.test(ch))
      return "string";
    return "invalidchar";
  }

  return {
    token: function(stream, state) {
      if (stream.eatWhile(isSpace)) return null;
      return tokenBase(stream, state);
    },
  };
});

(function() {
  CodeMirror.defineMIME("text/redwp", {
    name: "redwp",
  });
}());
