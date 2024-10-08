// computeReachability
// ~~~~~~~~~~~~~~~~~~~
//
// This module defines the function computeReachability, which expects 3
// parameters:
//   1) an origin word (string)
//   2) a destiny word (string)
//   3) a word rewrite system (string of the form "w1->w2\nw3->w4\n...")
// If the parameters are not valid, it throws a string with an error message.
// Otherwise, the returned value is either:
//   - a false, when no derivation from the origin to destiny is found, or
//   - an array with the words found in the derivation (the array always starts
//     with the origin word, and ends with the destiny word).
(function() {
	var maxStepAmount = 20;
	var maxWordLength = 20;
	var maxCurrentWords = 3000;
	computeReachability = function(uText,vText,RText) {
		// Getting origin and destiny words, and solving the trivial case where
		// both are equal.
		var u = clearSpace(uText);
		if (u.length == 0)
			throw "Empty origin word.";
		if (u.length > maxWordLength)
			throw "Origin word is too long.";
		var v = clearSpace(vText);
		if (v.length == 0)
			throw "Empty destiny word.";
		if (v.length > maxWordLength)
			throw "Destiny word is too long.";
		if (u === v)
			return [u];
		// Getting rewrite rules, and also its inverse (to perform a backwards
		// rewrite derivation), and solving the trivial cases where no rewrite
		// step is allowed and where there are no rewrite rules.
		if (!maxStepAmount)
			return false;
		var aux = parseRules(RText);
		var R = [];
		var iR = [];
		for (var i=0 ; i<aux.length ; ++i)
			if (aux[i][0] !== aux[i][1]) {
				R.push(aux[i]);
				iR.push([aux[i][1],aux[i][0]]);
			}
		if (R.length == 0)
			return false;
		// Now rewritting, both forward from u, as well as backward from v.
		function rewrite(reached,previousStep,R,goals) {
			var currentStep = new Map();
			var joined = previousStep.foreach(function(w,p) {
				for (var rr=0 ; rr<R.length ; ++rr) {
					var l = R[rr][0];
					var r = R[rr][1];
					if (w.length-l.length+r.length <= maxWordLength)
						for (var i=0 ; i<=w.length-l.length ; ++i)
							if (rewrittable(w,i,l)) {
								var rewritten = w.substr(0,i) + r + w.substr(i+l.length);
								if (!reached.has(rewritten)) {
									if (goals.has(rewritten)) {
										reached.insert(rewritten,w);
										return rewritten;
									}
									currentStep.insert(rewritten,w);
								}
							}
				}
			});
			if (joined)
				return joined;
			previousStep.clear();
			if (currentStep.size() <= maxCurrentWords) {
				currentStep.foreach(function(w,p) {
					reached.insert(w,p);
					previousStep.insert(w);
				});
			} else {
				var current = [];
				currentStep.foreach(function(w,p) {
					current.push([w,p]);
				});
				current.sort(function(a,b) {
					if (a[0].length < b[0].length)
						return -1;
					if (a[0].length > b[0].length)
						return 1;
					return a[0].localeCompare(b[0]);
				});
				for (var i=0 ; i<maxCurrentWords ; ++i) {
					reached.insert(current[i][0],current[i][1]);
					previousStep.insert(current[i][0]);
				}
			}
		}
		function rewrittable(w,i,l) {
			var res = (w.length-i >= l.length);
			for (var j=0 ; res && j<l.length ; ++j)
				res = (w.charAt(i+j) === l.charAt(j));
			return res;
		}
		var uReached = new Map().insert(u,null);
		var uCurrentStep = new Map().insert(u);
		var vReached = new Map().insert(v,null);
		var vCurrentStep = new Map().insert(v);
		var joined = false;
		for (var s=0 ; !joined && s<maxStepAmount ; ++s) {
			if (uCurrentStep.size() <= vCurrentStep.size())
				joined = rewrite(uReached, uCurrentStep, R, vReached);
			else
				joined = rewrite(vReached, vCurrentStep, iR, uReached);
		}
		if (!joined)
			return false;
		// We have succeeded :D now we reconstruct the derivation.
		function trace(reached,w) {
			if (w === null)
				return [];
			else {
				var res = trace(reached, reached.image(w));
				res.push(w);
				return res;
			}
		}
		var forward = trace(uReached, joined);
		var backward = trace(vReached, joined);
		for (var i=backward.length-2 ; i>=0 ; --i)
			forward.push(backward[i]);
		return forward;
	};
	// Two helper functions to parse the input:
	function clearSpace(text) {
		return text.replace(/\s+/g, "");
	}
	function parseRules(text) {
		var res = [];
		var lines = text.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
		for(var i=0 ; i<lines.length ; ++i) {
			var line = clearSpace(lines[i]);
			if (line.length > 0) {
				var j = line.indexOf("->");
				if (j == -1)
					throw "The rule at line "+(i+1)+" does not have \"->\".";
				if (j == 0)
					throw "The rule at line "+(i+1)+" has an empty left-hand side.";
				if (j > maxWordLength)
					throw "The rule at line "+(i+1)+" has a too-big left-hand side.";
				if (j == line.length-2)
					throw "The rule at line "+(i+1)+" has an empty right-hand side.";
				if (line.length-j-2 > maxWordLength)
					throw "The rule at line "+(i+1)+" has a too-big right-hand side.";
				var l = line.substr(0, j);
				var r = line.substr(j+2);
				res.push([l,r]);
			}
		}
		return res;
	}
	// Since javascript lacks essential data structures, let's define a map
	// where: (i) checking its size is not linear, and (ii) the member
	// functions do not pollute the namespace of contained elements (nor
	// vice-versa).
	var Map = function() {
		this.clear();
	};
	Map.prototype.clear = function() {
		this._size = 0;
		this._map = {};
	};
	Map.prototype.size = function() {
		return this._size;
	};
	Map.prototype.has = function(k) {
		return this._map.hasOwnProperty(k);
	};
	Map.prototype.image = function(k) {
		return this._map[k];
	};
	Map.prototype.insert = function(k,v) {
		if (!this._map.hasOwnProperty(k)) {
			++this._size;
			this._map[k] = v; // we do not overwrite present mappings
		}
		return this;
	};
	Map.prototype.foreach = function(callback) {
		for (var k in this._map)
			if (this._map.hasOwnProperty(k)) {
				var res = callback(k, this._map[k]);
				if (res !== undefined)
					return res;
			}
	};
	Map.prototype.toString = function() {
		var res = "";
		for (var k in this._map)
			if (this._map.hasOwnProperty(k))
				res += k+":"+this._map[k]+",";
		return "{"+res+"}";
	};
}());
