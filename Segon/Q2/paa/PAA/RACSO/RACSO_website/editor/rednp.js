CodeMirror.defineMode("rednp", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {},
      limitedKeywords = parserConfig.limitedKeywords || {},
      referenceTypes = parserConfig.referenceTypes || {},
      referencePrograms = parserConfig.referencePrograms || {},
      typeKeywords = parserConfig.typeKeywords || {};
  var isIdentificador1 = /[a-zA-Z_]/;
  var isIdentificador2 = /[a-zA-Z_0-9]/;
  var isOperatorChar = /[.+\-*\/%!=<>&]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;
  var isRedSAT = !("out" in keywords);

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"') {
      state.tokenize = tokenString;
      state.inInterpolation = false;
      return "string";
    }
    if (/[{}\(\)\[\];,]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/\d/);
      if (isRedSAT && stream.eat(isIdentificador2)) {
        stream.eatWhile(isIdentificador2);
        return "invalidchar";
      } else
        return "number";
    }
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      if (isRedSAT && stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
    }
    if (isOperatorChar.test(ch) || (!isRedSAT && state.context.scope == "global-scope" && /[:#@]/.test(ch)) || (isRedSAT && ch == "|"))
      return "operator";
    if (isIdentificador1.test(ch)) {
      stream.eatWhile(isIdentificador2);
      var cur = stream.current();
      if (state.context.scope == "global-scope") {
        if (cur in referencePrograms) {
          pushContext(state, stream.column(), "program", "program-scope");
          return "keyword";
        } else if (!isRedSAT) {
          if ((cur in referenceTypes) || (cur in typeKeywords)) {
            return "keyword";
          } else if (/^[A-Z_0-9]*$/.test(cur)) {
            return "meta";
          } else
            return "variable";
        }
      } else if (cur in keywords) {
        if (cur in blockKeywords) curPunc = "newstatement";
        return (cur in limitedKeywords) ? "invalidchar" : "keyword";
      } else
        return "variable";
    }
    return "invalidchar";
  }

  function tokenString(stream, state) {
    var ch = stream.next();
    if (ch == '"') {
      state.tokenize = null;
      return "string";
    }
    if (ch == '{') {
      state.inInterpolation = true;
      return "string";
    } else if (ch == '}') {
      state.inInterpolation = false;
      return "string";
    }
    if (state.inInterpolation) {
      if (isIdentificador1.test(ch)) {
        stream.eatWhile(isIdentificador2);
        var cur = stream.current();
        if (cur in keywords)
          return (cur in limitedKeywords) ? "invalidchar" : "keyword";
      }
      return "meta";
    } else
      return "string";
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, scope, prev) {
    this.indented = indented;
    this.column = column;
    this.type = (type == "top") ? "" : type;
    this.scope = scope;
    this.prev = prev;
  }
  function pushContext(state, col, type, scope) {
    state.context = new Context(state.indented, col, type, (scope||state.context.scope), state.context);
  }
  function popContext(state) {
    state.context = state.context.prev;
  }

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn||0)-indentUnit, 0, "top", "global-scope"),
        indented: 0,
        startOfLine: true,
        inInterpolation: false,
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatWhile(isSpace)) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "invalidchar") return style;
      if (curPunc == ";" || (isRedSAT && curPunc == ","))
        while (state.context.type == "statement") popContext(state);
      else if (curPunc == "{")
        pushContext(state, stream.column(), "}");
      else if (curPunc == "(")
        pushContext(state, stream.column(), ")");
      else if (curPunc == "[")
        pushContext(state, stream.column(), "]");
      else if (curPunc == "}" || curPunc == ")" || curPunc == "]") {
        while (state.context.type == "statement") popContext(state);
        if (state.context.type == curPunc) popContext(state);
        if (curPunc == "}") {
          while (state.context.type == "statement") popContext(state);
          if (state.context.type == "program") popContext(state);
        }
      } else if (curPunc == "newstatement" && state.context.type == "statement")
        pushContext(state, stream.column(), "statement");
      else if (state.context.type == "}" || (isRedSAT && state.context.type == ")") || state.context.type == "top")
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement" || ctx.type == "program") return ctx.indented + (firstChar == "{" || ctx.type == "program" ? 0 : statementIndentUnit);
      else if (ctx.type == "}" || (isRedSAT && ctx.type == ")")) return ctx.indented + (closing ? 0 : indentUnit);
      else return ctx.column + ctx.type.length;
    },

    electricChars: "{}",
  };
});

(function() {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i=0; i<words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  CodeMirror.defineMIME("text/rednp",{
    name: "rednp",
    keywords: words("in out stop if else while for foreach and or not push size back min max abs substr insertsat"),
    blockKeywords: words("if else while for foreach"),
    limitedKeywords: words("substr"),
    referenceTypes: words("input output rich"),
    referencePrograms: words("main testset test2input input2sat output2rich rich2sat"),
    typeKeywords: words("struct array of int string index"),
  })
  CodeMirror.defineMIME("text/redsat",{
    name: "rednp",
    keywords: words("true false atleast atmost exactly not and or iff implies if else for foreach in while push back size stop min max abs"),
    blockKeywords: words("if else while for foreach"),
    limitedKeywords: words(""),
    referenceTypes: words(""),
    referencePrograms: words("reduction reconstruction"),
    typeKeywords: words(""),
  });
}());
