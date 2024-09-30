// Generated by CoffeeScript 1.9.3
(function() {
  var allTrue, deepCopy, findNode, getFirstLeaf, getFirstLeafDepth, getLeftMostDerivations, getTreeDerivations, obtainCleanCFG, obtainDerivations, obtainNullable, obtainUnary, splitLines, toLeftMostDerivation,
    slice = [].slice,
    hasProp = {}.hasOwnProperty;

  obtainCleanCFG = function(text) {
    var parseCFG, removeNonGenerating, removeNonReachable;
    parseCFG = function(text) {
      var aa, allTerminals, allVariables, c, encrules, findNonSpace, i, j, l, le, len, len1, len2, len3, len4, len5, len6, lhs, ll, ls, m, numTerminals, numVariables, o, order, p, q, re, ref, ref1, ref2, ref3, ref4, rhs, rhss, rules, s, t, terminals, u, v, validOperators, validSpaces, validTerminals, validVariables, variables, w, z;
      validVariables = /[A-Z]/;
      validTerminals = /[!"#\$%&'\(\)\*\+,\-\.\/0-9:;<=>\?@\[\\\]\^_`a-z\{\}~]/;
      validOperators = /[|]/;
      validSpaces = /[ \x09\x0A\x0B\x0C\x0D]/;
      rules = {};
      order = [];
      ref = splitLines(text);
      for (i = m = 0, len = ref.length; m < len; i = ++m) {
        ll = ref[i];
        c = ll.indexOf("//");
        if (!(c < 0)) {
          ll = ll.slice(0, c);
        }
        ls = 0;
        le = -1;
        while (le !== ll.length) {
          ls = le + 1;
          le = ll.indexOf(";", ls);
          if (le < 0) {
            le = ll.length;
          }
          for (j = o = ref1 = ls, ref2 = le; ref1 <= ref2 ? o < ref2 : o > ref2; j = ref1 <= ref2 ? ++o : --o) {
            if (allTrue((function() {
              var len1, p, ref3, results;
              ref3 = [validVariables, validTerminals, validOperators, validSpaces];
              results = [];
              for (p = 0, len1 = ref3.length; p < len1; p++) {
                re = ref3[p];
                results.push(!re.test(ll[j]));
              }
              return results;
            })())) {
              throw "Error line " + (i + 1) + " column " + (j + 1) + ": invalid character.";
            }
          }
          findNonSpace = function(start) {
            while (start < ll.length && validSpaces.test(ll[start])) {
              start++;
            }
            return start;
          };
          j = findNonSpace(ls);
          if (j === le) {
            continue;
          }
          if (!validVariables.test(ll[j])) {
            throw "Error line " + (i + 1) + " column " + (j + 1) + ": the variables must be uppercase letters.";
          }
          j = findNonSpace(j + 1);
          if (j + 1 >= le || ll.slice(j, +(j + 1) + 1 || 9e9) !== "->") {
            throw "Error line " + (i + 1) + " column " + (j + 1) + ": rule missing the symbol '->'.";
          }
          l = ll.slice(ls, le).replace(/\s/g, "");
          lhs = l[0];
          rhss = l.slice(3).split("|");
          if (lhs in rules) {
            rules[lhs] = slice.call(rules[lhs]).concat(slice.call(rhss));
          } else {
            rules[lhs] = rhss;
            order.push(lhs);
          }
        }
      }
      if (order.length === 0) {
        throw "Error: empty context-free grammar.";
      }
      allVariables = {};
      allTerminals = {};
      for (i = p = 0, len1 = order.length; p < len1; i = ++p) {
        lhs = order[i];
        allVariables[lhs] = i;
      }
      numVariables = order.length;
      numTerminals = 0;
      for (lhs in rules) {
        if (!hasProp.call(rules, lhs)) continue;
        rhss = rules[lhs];
        for (q = 0, len2 = rhss.length; q < len2; q++) {
          rhs = rhss[q];
          for (u = 0, len3 = rhs.length; u < len3; u++) {
            s = rhs[u];
            if (validVariables.test(s)) {
              if (!(s in allVariables)) {
                allVariables[s] = numVariables;
                ++numVariables;
              }
            } else {
              if (!(s in allTerminals)) {
                allTerminals[s] = true;
                ++numTerminals;
              }
            }
          }
        }
      }
      terminals = (function() {
        var results;
        results = [];
        for (s in allTerminals) {
          if (!hasProp.call(allTerminals, s)) continue;
          results.push(s);
        }
        return results;
      })();
      terminals.sort();
      for (i = w = 0, len4 = terminals.length; w < len4; i = ++w) {
        t = terminals[i];
        allTerminals[t] = -i - 1;
      }
      variables = new Array(numVariables);
      for (v in allVariables) {
        if (!hasProp.call(allVariables, v)) continue;
        i = allVariables[v];
        variables[i] = v;
      }
      encrules = new Array(numVariables);
      for (i = z = 0, len5 = variables.length; z < len5; i = ++z) {
        v = variables[i];
        encrules[i] = [];
        ref4 = (ref3 = rules[v]) != null ? ref3 : [];
        for (aa = 0, len6 = ref4.length; aa < len6; aa++) {
          rhs = ref4[aa];
          encrules[i].push((function() {
            var ab, len7, ref5, results;
            results = [];
            for (ab = 0, len7 = rhs.length; ab < len7; ab++) {
              s = rhs[ab];
              results.push((ref5 = allTerminals[s]) != null ? ref5 : allVariables[s]);
            }
            return results;
          })());
        }
      }
      return {
        alphabetSize: numTerminals,
        rules: encrules,
        code2symbol: function(c) {
          var ref5, ref6;
          if (c < 0) {
            return (ref5 = terminals[-c - 1]) != null ? ref5 : "<T" + (-c - terminals.length) + ">";
          } else {
            return (ref6 = variables[c]) != null ? ref6 : "<V" + (c - variables.length + 1) + ">";
          }
        },
        symbol2code: function(s) {
          var ref5;
          return (ref5 = allTerminals[s]) != null ? ref5 : allVariables[s];
        },
        tostring: function() {
          var ab, ac, ad, len7, len8, len9, ref5, res;
          res = "";
          ref5 = this.rules;
          for (lhs = ab = 0, len7 = ref5.length; ab < len7; lhs = ++ab) {
            rhss = ref5[lhs];
            if (lhs !== 0) {
              res += "\n";
            }
            res += (this.code2symbol(lhs)) + " ->";
            if (rhss.length === 0) {
              res += " <empty>";
            } else {
              for (i = ac = 0, len8 = rhss.length; ac < len8; i = ++ac) {
                rhs = rhss[i];
                if (i !== 0) {
                  res += " |";
                }
                for (ad = 0, len9 = rhs.length; ad < len9; ad++) {
                  s = rhs[ad];
                  res += " " + (this.code2symbol(s));
                }
              }
            }
          }
          return res;
        },
        inverse: function() {
          var ab, ac, ad, ae, af, len7, len8, len9, ref5, ref6, ref7, res;
          res = new Array;
          if (this.alphabetSize > 0) {
            for (t = ab = -1, ref5 = -this.alphabetSize; -1 <= ref5 ? ab <= ref5 : ab >= ref5; t = -1 <= ref5 ? ++ab : --ab) {
              res[t] = [];
            }
          }
          for (v = ac = 0, ref6 = this.rules.length; 0 <= ref6 ? ac < ref6 : ac > ref6; v = 0 <= ref6 ? ++ac : --ac) {
            res[v] = [];
          }
          ref7 = this.rules;
          for (lhs = ad = 0, len7 = ref7.length; ad < len7; lhs = ++ad) {
            rhss = ref7[lhs];
            for (i = ae = 0, len8 = rhss.length; ae < len8; i = ++ae) {
              rhs = rhss[i];
              for (j = af = 0, len9 = rhs.length; af < len9; j = ++af) {
                s = rhs[j];
                res[s].push({
                  lhs: lhs,
                  irhs: i,
                  isymbol: j
                });
              }
            }
          }
          return res;
        },
        decode: function(derivation) {
          var ab, ac, len7, len8, res, step, str;
          res = [];
          for (ab = 0, len7 = derivation.length; ab < len7; ab++) {
            step = derivation[ab];
            str = "";
            for (ac = 0, len8 = step.length; ac < len8; ac++) {
              s = step[ac];
              str += this.code2symbol(s);
            }
            res.push(str);
          }
          return res;
        }
      };
    };
    removeNonGenerating = function(cfg) {
      var aa, data, generating, i, inv, inverse, len, len1, len2, len3, len4, len5, len6, lhs, m, nongenerating, o, p, q, ref, ref1, ref2, ref3, rhs, rhss, s, stack, t, u, w, z;
      inverse = cfg.inverse();
      data = [];
      ref = cfg.rules;
      for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
        rhss = ref[lhs];
        data.push([]);
        for (o = 0, len1 = rhss.length; o < len1; o++) {
          rhs = rhss[o];
          data[lhs].push(rhs.length);
        }
      }
      stack = new Array;
      if (cfg.alphabetSize > 0) {
        for (t = p = -1, ref1 = -cfg.alphabetSize; -1 <= ref1 ? p <= ref1 : p >= ref1; t = -1 <= ref1 ? ++p : --p) {
          stack.push(t);
        }
      }
      for (lhs = q = 0, len2 = data.length; q < len2; lhs = ++q) {
        rhss = data[lhs];
        for (u = 0, len3 = rhss.length; u < len3; u++) {
          nongenerating = rhss[u];
          if (!(nongenerating === 0)) {
            continue;
          }
          stack.push(lhs);
          break;
        }
      }
      generating = {};
      for (w = 0, len4 = stack.length; w < len4; w++) {
        s = stack[w];
        generating[s] = true;
      }
      while (stack.length > 0) {
        ref2 = inverse[stack.pop()];
        for (z = 0, len5 = ref2.length; z < len5; z++) {
          inv = ref2[z];
          if ((data[inv.lhs][inv.irhs] -= 1) === 0) {
            if (!generating[inv.lhs]) {
              stack.push(inv.lhs);
              generating[inv.lhs] = true;
            }
          }
        }
      }
      ref3 = cfg.rules;
      for (lhs = aa = 0, len6 = ref3.length; aa < len6; lhs = ++aa) {
        rhss = ref3[lhs];
        cfg.rules[lhs] = (function() {
          var ab, len7, results;
          results = [];
          for (i = ab = 0, len7 = rhss.length; ab < len7; i = ++ab) {
            rhs = rhss[i];
            if (data[lhs][i] === 0) {
              results.push(rhs);
            }
          }
          return results;
        })();
      }
      return cfg;
    };
    removeNonReachable = function(cfg) {
      var len, len1, len2, lhs, m, o, p, reachable, ref, ref1, rhs, rhss, s, stack;
      stack = [0];
      reachable = {
        0: true
      };
      while (stack.length > 0) {
        ref = cfg.rules[stack.pop()];
        for (m = 0, len = ref.length; m < len; m++) {
          rhs = ref[m];
          for (o = 0, len1 = rhs.length; o < len1; o++) {
            s = rhs[o];
            if (s >= 0) {
              if (!reachable[s]) {
                stack.push(s);
                reachable[s] = true;
              }
            }
          }
        }
      }
      ref1 = cfg.rules;
      for (lhs = p = 0, len2 = ref1.length; p < len2; lhs = ++p) {
        rhss = ref1[lhs];
        if (!reachable[lhs]) {
          cfg.rules[lhs] = [];
        }
      }
      return cfg;
    };
    return removeNonReachable(removeNonGenerating(parseCFG(text)));
  };

  obtainNullable = function(cfg) {
    var aux, len, len1, lhs, m, next, o, previous, ref, rhs, rhss, s;
    previous = (function() {
      var len, m, ref, results;
      ref = cfg.rules;
      results = [];
      for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
        rhss = ref[lhs];
        results.push([]);
      }
      return results;
    })();
    while (true) {
      next = (function() {
        var len, m, ref, results;
        ref = cfg.rules;
        results = [];
        for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
          rhss = ref[lhs];
          results.push([]);
        }
        return results;
      })();
      ref = cfg.rules;
      for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
        rhss = ref[lhs];
        for (o = 0, len1 = rhss.length; o < len1; o++) {
          rhs = rhss[o];
          if (rhs.length === 0) {
            next[lhs].push({
              root: lhs,
              children: []
            });
          } else if (allTrue((function() {
            var len2, p, results;
            results = [];
            for (p = 0, len2 = rhs.length; p < len2; p++) {
              s = rhs[p];
              results.push(s >= 0 && previous[s].length > 0);
            }
            return results;
          })())) {
            aux = getTreeDerivations(lhs, (function() {
              var len2, p, results;
              results = [];
              for (p = 0, len2 = rhs.length; p < len2; p++) {
                s = rhs[p];
                results.push(previous[s]);
              }
              return results;
            })());
            next[lhs].push(aux[0]);
            if (aux.length > 1 && next[lhs].length === 1) {
              next[lhs].push(aux[1]);
            }
          }
          if (next[lhs].length === 2) {
            break;
          }
        }
      }
      if (allTrue((function() {
        var len2, p, ref1, results;
        ref1 = cfg.rules;
        results = [];
        for (lhs = p = 0, len2 = ref1.length; p < len2; lhs = ++p) {
          rhss = ref1[lhs];
          results.push(previous[lhs].length === next[lhs].length);
        }
        return results;
      })())) {
        break;
      }
      previous = next;
    }
    return previous;
  };

  getTreeDerivations = function(lhs, parallelDerivations) {
    var d, hasTwo, i, len, m, res;
    for (i = m = 0, len = parallelDerivations.length; m < len; i = ++m) {
      d = parallelDerivations[i];
      if (!(d.length > 1)) {
        continue;
      }
      hasTwo = i;
      break;
    }
    res = [];
    res.push({
      root: lhs,
      children: (function() {
        var len1, o, results;
        results = [];
        for (o = 0, len1 = parallelDerivations.length; o < len1; o++) {
          d = parallelDerivations[o];
          results.push(deepCopy(d[0]));
        }
        return results;
      })()
    });
    if (!(hasTwo == null)) {
      res.push({
        root: lhs,
        children: (function() {
          var len1, o, results;
          results = [];
          for (i = o = 0, len1 = parallelDerivations.length; o < len1; i = ++o) {
            d = parallelDerivations[i];
            results.push(deepCopy(d[i === hasTwo ? 1 : 0]));
          }
          return results;
        })()
      });
    }
    return res;
  };

  getLeftMostDerivations = function(lhs, parallelDerivations) {
    var derivation, rec;
    rec = function(parallelDerivations, two) {
      var combined, fd, frontDerivations, len, len1, len2, len3, m, o, p, q, rd, res, restDerivations, s, step;
      if (parallelDerivations.length === 0) {
        return [[[]]];
      } else {
        frontDerivations = parallelDerivations[0].slice(0, (two ? 2 : 1));
        restDerivations = rec(parallelDerivations.slice(1), two && frontDerivations.length === 1);
        res = [];
        for (m = 0, len = frontDerivations.length; m < len; m++) {
          fd = frontDerivations[m];
          for (o = 0, len1 = restDerivations.length; o < len1; o++) {
            rd = restDerivations[o];
            combined = [];
            for (p = 0, len2 = fd.length; p < len2; p++) {
              step = fd[p];
              combined.push(slice.call(step).concat(slice.call(rd[0])));
            }
            for (s = q = 0, len3 = rd.length; q < len3; s = ++q) {
              step = rd[s];
              if (s > 0) {
                combined.push(slice.call(fd[fd.length - 1]).concat(slice.call(step)));
              }
            }
            res.push(combined);
          }
        }
        return res;
      }
    };
    return (function() {
      var len, m, ref, results;
      ref = rec(parallelDerivations, true);
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        derivation = ref[m];
        results.push([[lhs]].concat(slice.call(derivation)));
      }
      return results;
    })();
  };

  toLeftMostDerivation = function(tree) {
    var c;
    if (tree.children == null) {
      return [[tree.root]];
    } else {
      return (getLeftMostDerivations(tree.root, (function() {
        var len, m, ref, results;
        ref = tree.children;
        results = [];
        for (m = 0, len = ref.length; m < len; m++) {
          c = ref[m];
          results.push([toLeftMostDerivation(c)]);
        }
        return results;
      })()))[0];
    }
  };

  getFirstLeaf = function(tree) {
    var c, leaf, len, m, ref;
    if (tree.children == null) {
      return tree;
    } else {
      ref = tree.children;
      for (m = 0, len = ref.length; m < len; m++) {
        c = ref[m];
        leaf = getFirstLeaf(c);
        if (!(leaf == null)) {
          return leaf;
        }
      }
    }
  };

  getFirstLeafDepth = function(tree) {
    var c, leaf, len, m, ref;
    if (tree.children == null) {
      return 0;
    } else {
      ref = tree.children;
      for (m = 0, len = ref.length; m < len; m++) {
        c = ref[m];
        leaf = getFirstLeafDepth(c);
        if (!(leaf == null)) {
          return leaf + 1;
        }
      }
    }
  };

  findNode = function(tree, cb) {
    var c, len, m, node, ref, ref1;
    if (cb(tree.root)) {
      return tree;
    }
    ref1 = (ref = tree.children) != null ? ref : [];
    for (m = 0, len = ref1.length; m < len; m++) {
      c = ref1[m];
      node = findNode(c, cb);
      if (!(node == null)) {
        return node;
      }
    }
  };

  obtainUnary = function(cfg) {
    var combined, current, i, j, len, len1, len2, len3, len4, lhs, m, nullable, o, p, q, queue, r, reach, reachable, reachableInOneStep, ref, ref1, rhs, rhss, s, u, v;
    nullable = obtainNullable(cfg);
    reachableInOneStep = (function() {
      var m, ref, results;
      results = [];
      for (i = m = 0, ref = cfg.rules.length; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
        results.push((function() {
          var o, ref1, results1;
          results1 = [];
          for (j = o = 0, ref1 = cfg.rules.length; 0 <= ref1 ? o < ref1 : o > ref1; j = 0 <= ref1 ? ++o : --o) {
            results1.push(null);
          }
          return results1;
        })());
      }
      return results;
    })();
    ref = cfg.rules;
    for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
      rhss = ref[lhs];
      for (o = 0, len1 = rhss.length; o < len1; o++) {
        rhs = rhss[o];
        if (allTrue((function() {
          var len2, p, results;
          results = [];
          for (p = 0, len2 = rhs.length; p < len2; p++) {
            s = rhs[p];
            results.push(s >= 0);
          }
          return results;
        })())) {
          for (i = p = 0, len2 = rhs.length; p < len2; i = ++p) {
            v = rhs[i];
            if (reachableInOneStep[lhs][v] == null) {
              if (allTrue((function() {
                var len3, q, results;
                results = [];
                for (j = q = 0, len3 = rhs.length; q < len3; j = ++q) {
                  s = rhs[j];
                  if (j !== i) {
                    results.push(nullable[s].length > 0);
                  }
                }
                return results;
              })())) {
                reachableInOneStep[lhs][v] = (getTreeDerivations(lhs, (function() {
                  var len3, q, results;
                  results = [];
                  for (j = q = 0, len3 = rhs.length; q < len3; j = ++q) {
                    s = rhs[j];
                    results.push(j !== i ? nullable[s] : [
                      {
                        root: s,
                        children: null
                      }
                    ]);
                  }
                  return results;
                })()))[0];
              }
            }
          }
        }
      }
    }
    reachable = (function() {
      var q, ref1, results;
      results = [];
      for (i = q = 0, ref1 = cfg.rules.length; 0 <= ref1 ? q < ref1 : q > ref1; i = 0 <= ref1 ? ++q : --q) {
        results.push((function() {
          var ref2, results1, u;
          results1 = [];
          for (j = u = 0, ref2 = cfg.rules.length; 0 <= ref2 ? u < ref2 : u > ref2; j = 0 <= ref2 ? ++u : --u) {
            results1.push(null);
          }
          return results1;
        })());
      }
      return results;
    })();
    for (lhs = q = 0, len3 = reachable.length; q < len3; lhs = ++q) {
      reach = reachable[lhs];
      queue = [
        {
          root: lhs,
          children: null
        }
      ];
      while (queue.length > 0) {
        current = queue.shift();
        ref1 = reachableInOneStep[(getFirstLeaf(current)).root];
        for (v = u = 0, len4 = ref1.length; u < len4; v = ++u) {
          r = ref1[v];
          if (r != null) {
            if (reach[v] == null) {
              combined = deepCopy(current);
              (getFirstLeaf(combined)).children = deepCopy(r.children);
              reach[v] = combined;
              queue.push(combined);
            }
          }
        }
      }
    }
    return reachable;
  };

  obtainDerivations = function(cfg, word) {
    var boundRhss, collapseLoops, d, derivations, dprima, expandLoops, len, len1, m, node, o, pump, ref, s, topologicalSort, unbound;
    word = (function() {
      var len, m, ref, results;
      ref = word.replace(/\s/g, "");
      results = [];
      for (m = 0, len = ref.length; m < len; m++) {
        s = ref[m];
        results.push(cfg.symbol2code(s));
      }
      return results;
    })();
    if (!allTrue((function() {
      var len, m, results;
      results = [];
      for (m = 0, len = word.length; m < len; m++) {
        s = word[m];
        results.push((s != null) && s < 0);
      }
      return results;
    })())) {
      return [];
    }
    if (word.length === 0) {
      return (obtainNullable(cfg))[0];
    }
    boundRhss = function(cfg) {
      var i, j, len, len1, lhs, m, newrules, o, p, ref, ref1, ref2, rhs, rhss;
      newrules = [];
      ref = cfg.rules;
      for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
        rhss = ref[lhs];
        for (o = 0, len1 = rhss.length; o < len1; o++) {
          rhs = rhss[o];
          if (!(rhs.length > 2)) {
            continue;
          }
          i = cfg.rules.length + newrules.length;
          for (j = p = 1, ref1 = rhs.length - 2; 1 <= ref1 ? p <= ref1 : p >= ref1; j = 1 <= ref1 ? ++p : --p) {
            if (j < rhs.length - 2) {
              newrules.push([[rhs[j], i + j]]);
            } else {
              newrules.push([[rhs[j], rhs[j + 1]]]);
            }
          }
          [].splice.apply(rhs, [1, 9e9].concat(ref2 = [i])), ref2;
        }
      }
      cfg.beginBoundVars = cfg.rules.length;
      cfg.rules = slice.call(cfg.rules).concat(slice.call(newrules));
      cfg.endBoundVars = cfg.rules.length;
      return cfg;
    };
    collapseLoops = function(cfg) {
      var component2vars, i, len, m, newrules, o, originalrules, ref, ref1, rhs, rhss, unary, v, v2, var2component;
      unary = obtainUnary(cfg);
      newrules = [];
      originalrules = deepCopy(cfg.rules);
      var2component = [];
      component2vars = [];
      for (v = m = 0, ref = cfg.rules.length; 0 <= ref ? m < ref : m > ref; v = 0 <= ref ? ++m : --m) {
        if (!((var2component[v] == null) && (unary[v][v] != null))) {
          continue;
        }
        i = cfg.rules.length + newrules.length;
        component2vars[i] = (function() {
          var o, ref1, ref2, results;
          results = [];
          for (v2 = o = ref1 = v, ref2 = cfg.rules.length; ref1 <= ref2 ? o < ref2 : o > ref2; v2 = ref1 <= ref2 ? ++o : --o) {
            if ((unary[v][v2] != null) && (unary[v2][v] != null)) {
              results.push(v2);
            }
          }
          return results;
        })();
        rhss = [];
        ref1 = component2vars[i];
        for (o = 0, len = ref1.length; o < len; o++) {
          v2 = ref1[o];
          var2component[v2] = i;
          rhss = slice.call(rhss).concat(slice.call(cfg.rules[v2]));
          cfg.rules[v2] = [];
        }
        newrules.push(rhss);
      }
      cfg.beginLoopVariables = cfg.rules.length;
      cfg.rules = (function() {
        var len1, p, ref2, results;
        ref2 = slice.call(cfg.rules).concat(slice.call(newrules));
        results = [];
        for (p = 0, len1 = ref2.length; p < len1; p++) {
          rhss = ref2[p];
          results.push((function() {
            var len2, q, results1;
            results1 = [];
            for (q = 0, len2 = rhss.length; q < len2; q++) {
              rhs = rhss[q];
              results1.push((function() {
                var len3, ref3, results2, u;
                results2 = [];
                for (u = 0, len3 = rhs.length; u < len3; u++) {
                  s = rhs[u];
                  results2.push((ref3 = var2component[s]) != null ? ref3 : s);
                }
                return results2;
              })());
            }
            return results1;
          })());
        }
        return results;
      })();
      cfg.endLoopVariables = cfg.rules.length;
      cfg.unaryLoops = unary;
      cfg.originalrules = originalrules;
      cfg.var2component = var2component;
      cfg.component2vars = component2vars;
      return cfg;
    };
    cfg = collapseLoops(boundRhss(cfg));
    topologicalSort = (function() {
      var d, graph, i, indegree, j, len, len1, len2, len3, lhs, m, next, nullable, o, p, q, queue, ref, ref1, res, rhs, rhss, v;
      nullable = obtainNullable(cfg);
      graph = (function() {
        var m, ref, results;
        results = [];
        for (i = m = 0, ref = cfg.rules.length; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
          results.push((function() {
            var o, ref1, results1;
            results1 = [];
            for (j = o = 0, ref1 = cfg.rules.length; 0 <= ref1 ? o < ref1 : o > ref1; j = 0 <= ref1 ? ++o : --o) {
              results1.push(false);
            }
            return results1;
          })());
        }
        return results;
      })();
      indegree = (function() {
        var m, ref, results;
        results = [];
        for (i = m = 0, ref = cfg.rules.length; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
          results.push(0);
        }
        return results;
      })();
      ref = cfg.rules;
      for (lhs = m = 0, len = ref.length; m < len; lhs = ++m) {
        rhss = ref[lhs];
        for (o = 0, len1 = rhss.length; o < len1; o++) {
          rhs = rhss[o];
          if (allTrue((function() {
            var len2, p, results;
            results = [];
            for (p = 0, len2 = rhs.length; p < len2; p++) {
              s = rhs[p];
              results.push(s >= 0);
            }
            return results;
          })())) {
            for (i = p = 0, len2 = rhs.length; p < len2; i = ++p) {
              v = rhs[i];
              if (v !== lhs && !graph[v][lhs]) {
                if (allTrue((function() {
                  var len3, q, results;
                  results = [];
                  for (j = q = 0, len3 = rhs.length; q < len3; j = ++q) {
                    s = rhs[j];
                    if (j !== i) {
                      results.push(nullable[s].length > 0);
                    }
                  }
                  return results;
                })())) {
                  graph[v][lhs] = true;
                  indegree[lhs]++;
                }
              }
            }
          }
        }
      }
      res = [];
      queue = (function() {
        var len3, q, results;
        results = [];
        for (i = q = 0, len3 = indegree.length; q < len3; i = ++q) {
          d = indegree[i];
          if (d === 0) {
            results.push(i);
          }
        }
        return results;
      })();
      while (queue.length > 0) {
        i = queue.shift();
        ref1 = graph[i];
        for (v = q = 0, len3 = ref1.length; q < len3; v = ++q) {
          next = ref1[v];
          if (next) {
            if (--indegree[v] === 0) {
              queue.push(v);
            }
          }
        }
        res.push(i);
      }
      return res;
    })();
    derivations = (function() {
      var cyk, d1, d2, i, l, l1, l2, len, len1, len2, lhs, m, n, o, p, push, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, rhs, u, v, w, z;
      cyk = (function() {
        var m, ref, results;
        results = [];
        for (v = m = 0, ref = cfg.rules.length; 0 <= ref ? m < ref : m > ref; v = 0 <= ref ? ++m : --m) {
          results.push((function() {
            var o, ref1, results1;
            results1 = [];
            for (i = o = 0, ref1 = word.length; 0 <= ref1 ? o <= ref1 : o >= ref1; i = 0 <= ref1 ? ++o : --o) {
              results1.push((function() {
                var p, ref2, results2;
                results2 = [];
                for (l = p = 0, ref2 = word.length - i; 0 <= ref2 ? p <= ref2 : p >= ref2; l = 0 <= ref2 ? ++p : --p) {
                  results2.push(null);
                }
                return results2;
              })());
            }
            return results1;
          })());
        }
        return results;
      })();
      ref = obtainNullable(cfg);
      for (v = m = 0, len = ref.length; m < len; v = ++m) {
        n = ref[v];
        if (n.length > 0) {
          for (i = o = 0, ref1 = word.length; 0 <= ref1 ? o <= ref1 : o >= ref1; i = 0 <= ref1 ? ++o : --o) {
            cyk[v][i][0] = n;
          }
        }
      }
      push = function() {
        var aux, base, ds, i, l, lhs;
        lhs = arguments[0], i = arguments[1], l = arguments[2], ds = 4 <= arguments.length ? slice.call(arguments, 3) : [];
        aux = getTreeDerivations(lhs, ds);
        if ((base = cyk[lhs][i])[l] == null) {
          base[l] = [];
        }
        cyk[lhs][i][l].push(aux[0]);
        if (aux.length > 1 && cyk[lhs][i][l].length === 1) {
          return cyk[lhs][i][l].push(aux[1]);
        }
      };
      for (i = p = ref2 = word.length - 1; ref2 <= 0 ? p <= 0 : p >= 0; i = ref2 <= 0 ? ++p : --p) {
        for (l = q = 1, ref3 = word.length - i; 1 <= ref3 ? q <= ref3 : q >= ref3; l = 1 <= ref3 ? ++q : --q) {
          for (u = 0, len1 = topologicalSort.length; u < len1; u++) {
            lhs = topologicalSort[u];
            ref4 = cfg.rules[lhs];
            for (w = 0, len2 = ref4.length; w < len2; w++) {
              rhs = ref4[w];
              if (!(rhs.length > 0)) {
                continue;
              }
              if (rhs.length === 1) {
                if (rhs[0] === word[i] && l === 1) {
                  push(lhs, i, l, [
                    {
                      root: rhs[0],
                      children: null
                    }
                  ]);
                }
                if (rhs[0] >= 0 && rhs[0] !== lhs && (cyk[rhs[0]][i][l] != null)) {
                  push(lhs, i, l, cyk[rhs[0]][i][l]);
                }
              }
              if (rhs.length === 2) {
                for (l1 = z = 0, ref5 = l; 0 <= ref5 ? z <= ref5 : z >= ref5; l1 = 0 <= ref5 ? ++z : --z) {
                  l2 = l - l1;
                  if (rhs[0] < 0 && (l1 !== 1 || rhs[0] !== word[i])) {
                    continue;
                  }
                  if (rhs[1] < 0 && (l2 !== 1 || rhs[1] !== word[i + l1])) {
                    continue;
                  }
                  if (rhs[0] === lhs && l1 === l) {
                    continue;
                  }
                  if (rhs[1] === lhs && l2 === l) {
                    continue;
                  }
                  d1 = rhs[0] < 0 ? [
                    {
                      root: rhs[0],
                      children: null
                    }
                  ] : cyk[rhs[0]][i][l1];
                  d2 = rhs[1] < 0 ? [
                    {
                      root: rhs[1],
                      children: null
                    }
                  ] : cyk[rhs[1]][i + l1][l2];
                  if ((d1 == null) || (d2 == null)) {
                    continue;
                  }
                  push(lhs, i, l, d1, d2);
                  if (cyk[lhs][i][l].length === 2) {
                    break;
                  }
                }
              }
              if (((ref6 = cyk[lhs][i][l]) != null ? ref6.length : void 0) === 2) {
                break;
              }
            }
          }
        }
      }
      return (ref7 = cyk[(ref8 = cfg.var2component[0]) != null ? ref8 : 0][0][word.length]) != null ? ref7 : [];
    })();
    expandLoops = function(tree, goal) {
      var c, i, len, len1, len2, m, o, p, path, pathLength, ref, ref1, ref2, ref3, ref4, rhs, shortestPath, subgoals, v;
      if (tree.children != null) {
        subgoals = null;
        path = null;
        shortestPath = Infinity;
        ref1 = (ref = cfg.component2vars[tree.root]) != null ? ref : [goal];
        for (m = 0, len = ref1.length; m < len; m++) {
          v = ref1[m];
          pathLength = goal !== v ? getFirstLeafDepth(cfg.unaryLoops[goal][v]) : 0;
          if (shortestPath > pathLength) {
            ref2 = cfg.originalrules[v];
            for (o = 0, len1 = ref2.length; o < len1; o++) {
              rhs = ref2[o];
              if (rhs.length === tree.children.length) {
                if (allTrue((function() {
                  var len2, p, ref3, ref4, results;
                  ref3 = tree.children;
                  results = [];
                  for (i = p = 0, len2 = ref3.length; p < len2; i = ++p) {
                    c = ref3[i];
                    results.push(c.root === rhs[i] || -1 !== ((ref4 = cfg.component2vars[c.root]) != null ? ref4 : []).indexOf(rhs[i]));
                  }
                  return results;
                })())) {
                  path = goal !== v ? cfg.unaryLoops[goal][v] : null;
                  shortestPath = pathLength;
                  subgoals = rhs;
                  break;
                }
              }
            }
          }
        }
        ref3 = tree.children;
        for (i = p = 0, len2 = ref3.length; p < len2; i = ++p) {
          c = ref3[i];
          expandLoops(c, subgoals[i]);
        }
        if (path != null) {
          path = deepCopy(path);
          ref4 = [path.children, tree.children], tree.children = ref4[0], (getFirstLeaf(path)).children = ref4[1];
        }
      }
      return tree.root = goal;
    };
    unbound = function(tree) {
      var c, cs, len, m, ref, ref1, ref2, ref3, results;
      if (((ref = (cs = tree.children)) != null ? ref.length : void 0) > 0) {
        while ((cfg.beginBoundVars <= (ref3 = cs[cs.length - 1].root) && ref3 < cfg.endBoundVars)) {
          [].splice.apply(cs, [(ref1 = cs.length - 1), 9e9].concat(ref2 = cs[cs.length - 1].children)), ref2;
        }
        results = [];
        for (m = 0, len = cs.length; m < len; m++) {
          c = cs[m];
          results.push(unbound(c));
        }
        return results;
      }
    };
    for (m = 0, len = derivations.length; m < len; m++) {
      d = derivations[m];
      if (!((findNode(d, (function(label) {
        return (cfg.beginLoopVariables <= label && label < cfg.endLoopVariables);
      }))) != null)) {
        continue;
      }
      expandLoops(d, 0);
      dprima = deepCopy(d);
      node = findNode(dprima, (function(label) {
        return cfg.var2component[label] != null;
      }));
      pump = deepCopy(cfg.unaryLoops[node.root][node.root]);
      ref = [pump.children, node.children], node.children = ref[0], (getFirstLeaf(pump)).children = ref[1];
      derivations = [d, dprima];
      break;
    }
    for (o = 0, len1 = derivations.length; o < len1; o++) {
      d = derivations[o];
      unbound(d);
    }
    return derivations;
  };

  splitLines = function(s) {
    return s.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
  };

  allTrue = function(a) {
    var e, len, m;
    for (m = 0, len = a.length; m < len; m++) {
      e = a[m];
      if (!e) {
        return false;
      }
    }
    return true;
  };

  deepCopy = function(x) {
    var k, res, v, y;
    switch (typeof x) {
      case "object":
        if (x == null) {
          return x;
        } else if (x instanceof Array) {
          return (function() {
            var len, m, results;
            results = [];
            for (m = 0, len = x.length; m < len; m++) {
              y = x[m];
              results.push(deepCopy(y));
            }
            return results;
          })();
        } else {
          res = {};
          for (k in x) {
            if (!hasProp.call(x, k)) continue;
            v = x[k];
            res[k] = deepCopy(v);
          }
          return res;
        }
        break;
      case "boolean":
      case "number":
      case "string":
        return x;
    }
  };

  (typeof exports !== "undefined" && exports !== null ? exports : this).cfgDerivations = function(cfgText, wordText) {
    var cfg, d, derivations;
    cfg = obtainCleanCFG(cfgText);
    derivations = obtainDerivations(cfg, wordText);
    return (function() {
      var len, m, results;
      results = [];
      for (m = 0, len = derivations.length; m < len; m++) {
        d = derivations[m];
        results.push(cfg.decode(toLeftMostDerivation(d)));
      }
      return results;
    })();
  };

}).call(this);
