CodeMirror.defineMode("dfa", function(config, parserConfig) {
  var isValidAlphabet = /[0-9A-Za-z\(\)]/;
  var isValidState = /[0-9A-Z_a-z]/;
  var isOperatorChar = /[+]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;
  var noSpace = /[^ \x09\x0A\x0B\x0C\x0D]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (state.alphabetsize<0) {
      if (isValidAlphabet.test(ch)) {
        if (!stream.eol() && noSpace.test(stream.peek())) {
          stream.eatWhile(noSpace);
          return "invalidchar";
        }
        if (ch in state.alphabet)
          return "invalidchar";
        state.alphabet[ch] = true;
        return "string";
      }
    } else {
      if (state.linePos<=state.alphabetsize && isValidState.test(ch)) {
        stream.eatWhile(isValidState);
        if (!stream.eol() && noSpace.test(stream.peek())) {
          stream.eatWhile(noSpace);
          return "invalidchar";
        }
        return "keyword";
      }
      if (state.linePos==state.alphabetsize+1 && isOperatorChar.test(ch))
        return "operator";
    }
    return "invalidchar";
  }

  return {
    startState: function(basecolumn) {
      return {
        linePos: 0,
        alphabet: {},
        alphabetsize: -1
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.alphabetsize<0) {
          if (state.linePos>0)
            state.alphabetsize = state.linePos;
          else if (state.linePos==0)
            state.alphabet = {};
        }
        state.linePos = 0;
      }
      if (stream.eatWhile(isSpace)) return null;
      var style = tokenBase(stream, state);
      if (style == "comment" || style == "invalidchar") return style;
      state.linePos += 1;
      return style;
    },
  };
});

(function() {
  CodeMirror.defineMIME("text/dfa", {
    name: "dfa",
  });
}());
