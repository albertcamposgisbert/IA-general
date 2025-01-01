CodeMirror.defineMode("cfg", function(config, parserConfig) {
  var isVariable = /[A-Z]/;
  var isTerminal = /[!"#\$%&'\(\)\*\+,\-\.\/0-9:;<=>\?@\[\\\]\^_`a-z\{\}~]/;
  var isOperatorChar = /[|]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (state.linePos == 0)
      return isVariable.test(ch) ? "keyword" : "invalidchar";
    else if (state.linePos == 1)
      return (ch=='-' && stream.eat(">")) ? "operator" : "invalidchar";
    else {
      if (isOperatorChar.test(ch))
        return "operator";
      if (isVariable.test(ch))
        return "keyword";
      if (isTerminal.test(ch))
        return "string";
      return "invalidchar";
    }
  }

  return {
    startState: function(basecolumn) {
      return {
        linePos: 0
      };
    },

    token: function(stream, state) {
      if (stream.sol()) state.linePos = 0;
      if (stream.eatWhile(isSpace)) return null;
      var style = tokenBase(stream, state);
      if (style == "comment" || style == "invalidchar") return style;
      state.linePos += 1;
      return style;
    },
  };
});

(function() {
  CodeMirror.defineMIME("text/cfg", {
    name: "cfg",
  });
}());
