CodeMirror.defineMode("pda", function(config, parserConfig) {
  var isValidSymbol = /[!"#\$%&'\(\)\*\+,\-\.\/0-9:;<=>\?@A-Z\[\\\]\^_`a-z\{\}~]/;
  var isValidState = /[0-9A-Z_a-z]/;
  var isSpace = /[ \x09\x0A\x0B\x0C\x0D]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    var consumeSingleSymbol = function(isstack){
      var i = 0;
      while ((ch = stream.next()) != null) {
        if (isSpace.test(ch)) {
          stream.backUp(1);
          break;
        } else if (ch=="/" && stream.eat("/")) {
          stream.backUp(2);
          break;
        }
        i += 1;
      }
      return i == 0 ? (isstack ? "meta" : "string") : "invalidchar";
    };
    var consumeSymbol = function(){
      stream.eatWhile(isValidSymbol);
      var i = 0;
      while ((ch = stream.next()) != null) {
        if (isSpace.test(ch)) {
          stream.backUp(1);
          break;
        } else if (ch=="/" && stream.eat("/")) {
          stream.backUp(2);
          break;
        }
        i += 1;
      }
      return i == 0 ? "meta" : "invalidchar";
    };
    var consumeState = function(consumeuntilspace){
      stream.eatWhile(isValidState);
      var i = 0;
      if (consumeuntilspace) {
        while ((ch = stream.next()) != null) {
          if (isSpace.test(ch)) {
            stream.backUp(1);
            break;
          } else if (ch=="/" && stream.eat("/")) {
            stream.backUp(2);
            break;
          }
          i += 1;
        }
      }
      return i == 0 ? "keyword" : "invalidchar";
    };
    if (state.firstLine && state.linePos==0) {
      if (isValidSymbol.test(ch))
        return consumeSingleSymbol(true);
    } else if (state.firstLine && state.linePos>0) {
      if (isValidState.test(ch))
        return consumeState(true);
    } else {
      if (state.linePos==0) {
        // here we have to decide whether the transition is simple, or
        // multiple (i.e., compact representation of several transitions
        // in a single line)
        var i = 0;
        do {
          if (isSpace.test(ch)) {
            stream.backUp(1);
            break;
          } else if (ch=="-" && stream.eat(">")) {
            stream.backUp(2);
            break;
          } else if (ch=="/" && stream.eat("/")) {
            stream.backUp(2);
            break;
          }
          i += 1;
        } while ((ch = stream.next()) != null);
        while ((ch = stream.next()) != null) {
          if (!isSpace.test(ch)) {
            stream.backUp(1);
            break;
          }
          i += 1;
        }
        var one = stream.eat("-"), two = stream.eat(">");
        stream.backUp( i + (one ? 1 : 0) + (two ? 1 : 0) );
        ch = stream.next();
        if (one && two)
          state.arrow = 1;
      }
      if (state.arrow == 1) {
        if (state.linePos == 0) {
          if (isValidState.test(ch))
            return consumeState(false);
        } else if (state.linePos == 1) {
          if (ch=="-" && stream.eat(">")) {
            state.compact = 0;
            return "operator";
          }
        } else {
          if (state.compact < 0) {
            if (state.compact == -1)
              if (isValidState.test(ch)) {
                state.compact -= 1;
                return consumeState(false);
              }
          } else if (state.compact == 0) {
            if (ch=="-" && stream.eat(">")) {
              state.compact = -1;
              return "operator";
            } else if (isValidSymbol.test(ch)) {
              state.compact += 1;
              return "meta";
            }
          } else if (state.compact == 1) {
            if (ch == "|") {
              state.compact += 2;
              return "operator";
            } else if (isValidSymbol.test(ch)) {
              state.compact += 1;
              return "string";
            }
          } else if (state.compact == 2) {
            if (ch == "|") {
              state.compact += 1;
              return "operator";
            }
          } else {
            if (ch == ",") {
              state.compact = 0;
              return "operator";
            } else if (ch=="-" && stream.eat(">")) {
              state.compact = -1;
              return "operator";
            } else if (isValidSymbol.test(ch))
              return "meta";
          }
        }
      } else {
        if (state.arrow<0 && (state.linePos==2 || state.linePos==3) && ch=="-" && stream.eat(">")) {
          state.arrow = state.linePos;
          return "operator";
        } else if (state.linePos==0 || state.linePos==2) {
          if (isValidSymbol.test(ch))
            return consumeSingleSymbol(state.linePos==0);
        } else if (state.linePos==1) {
          if (isValidState.test(ch))
            return consumeState(true);
        } else if (state.arrow>0) {
          if (state.linePos-state.arrow==2) {
            if (isValidState.test(ch))
              return consumeState(true);
          } else if (state.linePos-state.arrow==1) {
            // counting how many tokens there are after the arrow to detect
            // whether something is pushed onto the stack, and hence, color the
            // next token appropiately
            var i = 1;
            while ((ch = stream.next()) != null) {
              if (isSpace.test(ch)) {
                stream.backUp(1);
                break;
              } else if (ch=="/" && stream.eat("/")) {
                stream.backUp(2);
                break;
              }
              i += 1;
            }
            while ((ch = stream.next()) != null) {
              if (!isSpace.test(ch)) {
                stream.backUp(1);
                break;
              }
              i += 1;
            }
            var e = stream.eol(), one = stream.eat("/"), two = stream.eat("/");
            stream.backUp( i + (one ? 1 : 0) + (two ? 1 : 0) );
            ch = stream.next();
            if (e || (one && two)) {
              if (isValidState.test(ch))
                return consumeState(true);
            } else {
              if (isValidSymbol.test(ch))
                return consumeSymbol();
            }
          }
        }
      }
    }
    return "invalidchar";
  }

  return {
    startState: function(basecolumn) {
      return {
        linePos: 0,
        firstLine: true,
        arrow: -1,
        compact: -1,
      };
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.firstLine && state.linePos>0)
          state.firstLine = false;
        state.linePos = 0;
        state.arrow = -1;
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
  CodeMirror.defineMIME("text/pda", {
    name: "pda",
  });
}());
