CodeMirror.defineMode("redk", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {};
  var isWord1 = /[a-zA-Z_]/;
  var isWord2 = /[a-zA-Z_0-9]/;
  var isOperatorChar = /[+\-*\/%!=<>]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (/[{}\(\);]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/\d/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    if (isWord1.test(ch)) {
      stream.eatWhile(isWord2);
      var cur = stream.current();
      if (cur in keywords) {
        if (cur in blockKeywords) curPunc = "newstatement";
        return "keyword";
      }
      return "variable";
    }
    return "invalidchar";
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

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top"),
        indented: 0,
        startOfLine: true
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
      state.startOfLine = false;
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
  function redk_autocompleteHinting() {
    var autocompletions = "output infiniteloop; runmxx; mxxstopsininputsteps accept; reject;".split(" ").sort();
    function hinting(editor, options) {
      var cur = editor.getCursor();
      var token = editor.getTokenAt(cur);
      if (!/^[a-z]*$/.test(token.string))
        return;
      var completions = [];
      for (var i = 0, e = autocompletions.length; i < e; ++i) {
        if (autocompletions[i].indexOf(token.string) == 0)
          completions.push(autocompletions[i]);
      }
      return {
        list: completions,
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, token.end)
      };
    }
    function autocomplete(cm) {
      setTimeout(function() {
        if (!cm.state.completionActive)
          CodeMirror.showHint(cm, hinting, {completeSingle: false});
      }, 100);
      return CodeMirror.Pass;
    }
    return {
      "'a'": autocomplete,
      "'i'": autocomplete,
      "'o'": autocomplete,
      "'r'": autocomplete,
      "'m'": autocomplete,
    };
  }
  CodeMirror.defineMIME("text/redk", {
    name: "redk",
    keywords: words("input output infiniteloop runmxx mxxstopsininputsteps accept reject if else and or not"),
    blockKeywords: words("input if else"),
    autocompleteHinting: redk_autocompleteHinting(),
  });
}());
