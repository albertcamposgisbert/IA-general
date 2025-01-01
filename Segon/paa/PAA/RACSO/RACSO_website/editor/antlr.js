CodeMirror.defineMode("antlr", function(config, parserConfig) {
  var onlyregex = parserConfig.onlyregex;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "/" && stream.eat("/")) {
      stream.skipToEnd();
      return "comment";
    }
    if (ch == "'" || ch == '"') {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (!onlyregex) {
      if (state.inscope != "terminal") {
        if (/[a-z_]/.test(ch)) {
          stream.eatWhile(/[a-zA-Z_0-9]/);
          if (state.inscope == null)
            stream.eat("^");
          return "keyword";
        }
        if (/[A-Z]/.test(ch)) {
          stream.eatWhile(/[a-zA-Z_0-9]/);
          return "meta";
        }
      }
      if (ch == ":") {
        if (state.previous == "keyword") {
          state.inscope = "nonterminal";
          return "operator";
        }
        if (state.previous == "meta") {
          state.inscope = "terminal";
          return "operator";
        }
      }
      if (ch == ";") {
        state.inscope = null;
        return "operator";
      }
    }
    if (state.inscope == "nonterminal") {
      if (/[\*\+\?\|\(\)\^\!]/.test(ch))
        return "operator";
    } else if (onlyregex || state.inscope == "terminal") {
      if (/[\*\+\?\|\(\)\~]/.test(ch) || (ch == "." && stream.eat(".")))
        return "operator";
    }
    return "invalidchar";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true;
          break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end) state.tokenize = null;
      return "string";
    };
  }

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        previous: null,
        inscope: null,
      };
    },

    token: function(stream, state) {
      if (stream.eatWhile(isSpace)) return null;
      state.previous = (state.tokenize || tokenBase)(stream, state);
      return state.previous;
    },
  };
});

(function() {
  CodeMirror.defineMIME("text/antlrlex", {
    name: "antlr",
    onlyregex: true,
  });
  CodeMirror.defineMIME("text/antlrsyn", {
    name: "antlr",
    onlyregex: false,
  });
}());
