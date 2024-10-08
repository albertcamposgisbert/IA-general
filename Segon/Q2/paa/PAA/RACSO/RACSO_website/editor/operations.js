CodeMirror.defineMode("operations", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {},
      checkingReduction = parserConfig.checkingReduction || false,
      cfgsAllowed = parserConfig.cfgsAllowed;
  var isWord = /[a-zA-Z_0-9]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || (checkingReduction && ch == "'")) {
      state.tokenize = tokenString(ch);
      state.linePos = -1;
      state.alphabet = -1;
      return (ch == '"') ? "string" : "meta";
    }
    if (/[{}\(\);,]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if ((ch=="-" && stream.eat(">")) || (checkingReduction && /[<>=!]/.test(ch)) || /[-|&*=]/.test(ch))
      return "operator";
    if (isWord.test(ch)) {
      stream.eatWhile(isWord);
      var cur = stream.current();
      if (cur in keywords) {
        if (cur in blockKeywords) curPunc = "newstatement";
        return "keyword";
      }
      return "variable";
    }
    return "invalidchar";
  }

  function tokenString(delim) {
    if (delim == "'") {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == delim && !escaped) {
            end = true;
            break;
          }
          escaped = !escaped && next == "\\";
        }
        if (end) state.tokenize = null;
        return "meta";
      };
    } else {
      var isValidTerminal = checkingReduction
                          ? /[\(\)\*\+\-\/0123456789<>\[\]abcdefghijklmnopqrstuvwxyz#$&@]/
                          : /[\(\)\*\+\-\/0123456789<>\[\]abcdefghijklmnopqrstuvwxyz]/;
      var stringtype = false;
      return function(stream, state) {
        var ch = stream.next();
        if (ch == '"') {
          state.tokenize = null;
          return "string";
        }
        if (ch == "/") {
          if (stream.eat("/")) {
            while ((ch = stream.next()) != null) {
              if (ch == '"') {
                stream.backUp(1);
                break;
              }
            }
            return "comment";
          }
        }
        if (ch == ";") {
          if (stringtype == "word")
            stringtype = "wordfinished";
          state.linePos = -1;
          return null;
        }
        if (!stringtype) {
          // Here we are parsing the first line of actual text, so we have to
          // decide whether it is a word, a DFA or a CFG. However, we cannot read
          // beyond the current line, so we will consider it a non-word whenever
          // it seems a multi-line literal.
          stringtype = "word";
          var i = 0;
          do {
            i += 1;
            if (ch == '"')
              break;
            if (ch == ";")
              break;
            if (ch == "-" && stream.eat(">")) {
              i += 1;
              stringtype = "CFG";
              break;
            }
            if (ch == "/" && stream.eat("/")) {
              i += 1;
              while ((ch = stream.next()) != null) {
                i += 1;
                if (ch == '"') break;
              }
              break;
            }
          } while ((ch = stream.next()) != null);
          if (ch == null || ch == ";")
            stringtype = "DFA";
          stream.backUp(i);
          ch = stream.next();
        }
        if (stringtype == "word") {
          if (isValidTerminal.test(ch))
            return "string";
        } else if (stringtype == "CFG" && cfgsAllowed) {
          if (state.linePos == 0)
            return /[A-Z]/.test(ch) ? "keyword" : "invalidchar";
          else if (state.linePos == 1)
            return (ch=="-" && stream.eat(">")) ? "operator" : "invalidchar";
          else {
            if (/[|]/.test(ch))
              return "operator";
            if (/[A-Z]/.test(ch))
              return "keyword";
            if (isValidTerminal.test(ch))
              return "string";
          }
        } else if (stringtype == "DFA") {
          if (state.alphabet<0) {
            if (isValidTerminal.test(ch)) {
              if (!stream.eol() && isValidTerminal.test(stream.peek())) {
                stream.eatWhile(isValidTerminal);
                return "invalidchar";
              }
              return "string";
            }
          } else {
            if (state.linePos<=state.alphabet) {
              stream.backUp(1);
              if (stream.eatWhile(/[a-zA-Z_0-9]/))
                return "keyword";
              stream.next();
            } else if (state.linePos==state.alphabet+1 && /[+]/.test(ch))
              return "operator";
          }
        }
        return "invalidchar";
      };
    }
  }

  function Context(indented, column, type, prev) {
    this.indented = indented;
    this.column = column;
    this.type = (type == "top") ? "" : type;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    state.context = new Context(state.indented, col, type, state.context);
  }
  function popContext(state) {
    state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top"),
        indented: 0,
        linePos: 0,
        alphabet: -1,
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        state.indented = stream.indentation();
        if (state.alphabet<0 && state.linePos>0)
          state.alphabet = state.linePos;
        state.linePos = 0;
      }
      if (stream.eatWhile(isSpace)) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "invalidchar") return style;
      if (curPunc == ";")
        while (state.context.type == "statement") popContext(state);
      else if (curPunc == "{")
        pushContext(state, stream.column(), "}");
      else if (curPunc == "(")
        pushContext(state, stream.column(), ")");
      else if (curPunc == "}" || curPunc == ")") {
        while (state.context.type == "statement") popContext(state);
        if (state.context.type == curPunc) popContext(state);
        if (curPunc == "}")
          while (state.context.type == "statement") popContext(state);
      } else if (curPunc == "newstatement" && state.context.type == "statement")
        pushContext(state, stream.column(), "statement");
      else if (state.context.type == "}" || state.context.type == "top")
        pushContext(state, stream.column(), "statement");
      state.linePos += 1;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (ctx.type == "}") return ctx.indented + (closing ? 0 : indentUnit);
      else return ctx.column + ctx.type.length;
    },

    electricChars: "{}",
  };
});

(function() {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  CodeMirror.defineMIME("text/opreg", {
    name: "operations",
    keywords: words("main output reverse substitution projection intercal"),
    blockKeywords: words("main"),
    checkingReduction: false,
    cfgsAllowed: false,
  });
  CodeMirror.defineMIME("text/opcf", {
    name: "operations",
    keywords: words("main output reverse substitution"),
    blockKeywords: words("main"),
    checkingReduction: false,
    cfgsAllowed: true,
  });
  CodeMirror.defineMIME("text/redcfg", {
    name: "operations",
    keywords: words("input output reverse substitution projection intercal if else belongsto"),
    blockKeywords: words("input if else"),
    checkingReduction: false,
    cfgsAllowed: true,
  });
  CodeMirror.defineMIME("text/redcfg-sol", {
    name: "operations",
    keywords: words("main input output reverse substitution projection intercal if else eval getword getalphabet lineargrammars write isinfinite while include positive negative usererror userrejection internalerror and or not"),
    blockKeywords: words("main input if else while"),
    checkingReduction: true,
    cfgsAllowed: true,
  });
}());
