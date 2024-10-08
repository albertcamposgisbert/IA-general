// Finite State Machine Designer (http://madebyevan.com/fsm/)
// License: MIT License (see below)
//
// Copyright (c) 2010 Evan Wallace
//               2013-2016 Carles Creus
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// magicFSMtext + setupFSMEditor
// ~~~~~~~~~~~~   ~~~~~~~~~~~~~~
//
// This modules defines the 2 functions magicFSMtext and setupFSMEditor (if the
// browser does not have the features required to run this code, i.e. canvas
// and JSON, then the functions are *not* defined). The function setupFSMEditor
// expects 6 parameters:
//   1) a canvas element where to draw
//   2) a theme name (light,dark) to use for colors
//   3) a boolean to indicate whether to edit a DFA (otherwise, a PDA)
//   4) an (optional) DOM node where to write error messages or the compiled
//      automaton (which conforms to the DFA/PDA judge syntax)
//   5) an (optional) callback that is run each time the user edits something,
//      receiving 2 parameters: a string with the magic+encoded+compiled
//      configuration of the editor (the encoded and compiled parts can be
//      extracted with the function magicFSMtext, which returns null when the
//      magic part is missing), and also a string with the encoded part alone.
//      The first parameter, i.e., the magic+encoded+compiled string can be
//      passed directly to the DFA/PDA judge, as it conforms to its syntax! :-)
//   6) an (optional) text with an encoded configuration of the editor, which
//      is loaded as initial state (this overrides the parameter 2)
// The function returns an object with the following methods:
//   - deattach: to stop listening for events (mouse, keyboard)
//   - reattach: restart listening for events (mouse, keyboard)
//   - setTheme: change the color theme
//   - setFullscreen: set the fullscreen state
// XXX: the way keystrokes are captured is a bit unfortunate... it installs
// event listeners to the root document! More than one instance of the editor
// is permitted, as they play nice between each other, but mixing editors with
// any other thing that requires to fiddle with the root document is going to
// break.
(function() {
	if (typeof JSON === "undefined" || !JSON || !JSON.parse || !JSON.stringify)
		return;
	if (!(document.createElement("canvas")||{}).getContext)
		return;

	// start by defining some useful constants: (i) string with the regex of
	// valid state names and input symbols for DFA/PDA, (ii) a magic to
	// identify the presence of JSON encoded data, and (iii) texts with error
	// messages when the design of the automaton is not sane

	var validStates = "^[0-9A-Z_a-z]+$";
	var validDFAInputs = '[()0-9A-Za-z]';
	var validPDAInput = '[!"#$%&\'()*+,\\-./0-9:;<=>?@A-Z\\[\\\\\\]^_`a-z{}~]';
	var validPDAStack = '[!"#$%&\'()*+\\-./0-9:;<=>?@A-Z\\[\\\\\\]^_`a-z{}~]';

	var magicJSON = "//@MAGIC_JSON@//";
	magicFSMtext = function(magicencoded) {
		if (!startsWith(magicencoded,magicJSON))
			return null;
		var i = magicencoded.indexOf("\n");
		if (i == -1)
			return null;
		return {
			encoded: magicencoded.substr(magicJSON.length,i-magicJSON.length),
			compiled: magicencoded.substr(i+1),
		};
	};

	var errorMessages = [
		"", // not an error
		"Error: there should be a starting state.",
		"Error: there should be just one starting state.",
		"Error: there should be some transition in the DFA.", // (DFA only)
		"Error: there are states with invalid names.",
		"Error: there are repeated state names.",
		"Error: there are wrongly formatted transitions.",
		"Error: the following states of the DFA have multiple transitions for some inputs symbols:", // (DFA only)
		"Error: the following states of the DFA have undefined transitions for some inputs symbols:", // (DFA only)
	];

	// also some constants used during the rendering and edit

	var lineWidthNode = 1;
	var lineWidthLink = 1;
	var nodeRadius = 22;
	var acceptRadius = 18;
	var snapToPadding = 6; // pixels
	var hitTargetPadding = 6; // pixels
	var fontHeight = 14;
	var font = fontHeight+'px "monospace"';
	var caretBlink = 500; // milliseconds
	var themes = {
		light: {
			backgroundColor: "white",
			normalColor: "black",
			selectionColor: "#05d",
			insaneColor: "#f00",
		},
		dark: {
			backgroundColor: "black",
			normalColor: "white",
			selectionColor: "#28f",
			insaneColor: "#f00",
		},
	};

	// now the function that sets up the visual editor (the auxiliary classes
	// and functions that are used by this function are defined *afterwards*)

	setupFSMEditor = function(canvas,currentTheme,isDFA,outputArea,callbackCurrent,encoded) {
		if (outputArea)
			outputArea = getNode(outputArea);
		function canvasHasFocus() { // XXX canvas cannot get the focus or whatever, hence this ugly hack...
			var active = document.activeElement || document.body;
			return isDescendant(canvas,active) && focused == keyboardID && focused != -1;
			// return active == document.body;
		}
		// current configuration of the DFA/PDA, along with their corresponding
		// JSON encode/decode functions
		var nodes = [];
		var links = [];
		function encode() {
			var backup = {
				'isDFA': isDFA,
				'nodes': [],
				'links': []
			};
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				var backupNode = {
					'x': node.x,
					'y': node.y,
					'text': node.text,
					'sane': node.sane,
					'isAcceptState': node.isAcceptState
				};
				backup.nodes.push(backupNode);
			}
			for (var i = 0; i < links.length; i++) {
				var link = links[i];
				var backupLink = null;
				if (link instanceof SelfLink) {
					backupLink = {
						'type': 'SelfLink',
						'node': nodes.indexOf(link.node),
						'text': link.text,
						'sane': link.sane,
						'anchorAngle': link.anchorAngle
					};
				} else if (link instanceof StartLink) {
					backupLink = {
						'type': 'StartLink',
						'node': nodes.indexOf(link.node),
						'sane': link.sane,
						'deltaX': link.deltaX,
						'deltaY': link.deltaY
					};
				} else if (link instanceof Link) {
					backupLink = {
						'type': 'Link',
						'nodeA': nodes.indexOf(link.nodeA),
						'nodeB': nodes.indexOf(link.nodeB),
						'text': link.text,
						'sane': link.sane,
						'lineAngleAdjust': link.lineAngleAdjust,
						'parallelPart': link.parallelPart,
						'perpendicularPart': link.perpendicularPart
					};
				}
				if (backupLink != null)
					backup.links.push(backupLink);
			}
			return JSON.stringify(backup)
			           .replace(/\n/g,""); // XXX we need it to be a single line (probably it already was)
		}
		function decode(encodedText) {
			var backup = JSON.parse(encodedText);
			isDFA = backup.isDFA;
			nodes = [];
			for (var i = 0; i < backup.nodes.length; i++) {
				var backupNode = backup.nodes[i];
				var node = new Node(backupNode.x, backupNode.y);
				node.isAcceptState = backupNode.isAcceptState;
				node.text = backupNode.text;
				node.sane = backupNode.sane;
				nodes.push(node);
			}
			links = [];
			for (var i = 0; i < backup.links.length; i++) {
				var backupLink = backup.links[i];
				var link = null;
				if (backupLink.type == 'SelfLink') {
					link = new SelfLink(nodes[backupLink.node]);
					link.anchorAngle = backupLink.anchorAngle;
					link.text = backupLink.text;
					link.sane = backupLink.sane;
				} else if (backupLink.type == 'StartLink') {
					link = new StartLink(nodes[backupLink.node]);
					link.deltaX = backupLink.deltaX;
					link.deltaY = backupLink.deltaY;
					link.sane = backupLink.sane;
				} else if (backupLink.type == 'Link') {
					link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
					link.parallelPart = backupLink.parallelPart;
					link.perpendicularPart = backupLink.perpendicularPart;
					link.text = backupLink.text;
					link.sane = backupLink.sane;
					link.lineAngleAdjust = backupLink.lineAngleAdjust;
				}
				if (link != null)
					links.push(link);
			}
		}
		// when the design of the automaton is sane (according to sanityCheck
		// below), then this function encodes it with the RACSO syntax
		function computeRACSO() {
			var racsoData = '';
			var start;
			for (var i = 0; i < links.length; i++)
				if (links[i] instanceof StartLink) {
					start = links[i].node.text;
					break;
				}
			var states = [];
			var accepting = {};
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].text != start)
					states.push(nodes[i].text);
				if (nodes[i].isAcceptState)
					accepting[nodes[i].text] = true;
			}
			states.sort();
			states.unshift(start); // push start state to the beginning
			var longestStateName = 0;
			for (var i = 0; i < states.length; i++)
				if (longestStateName < states[i].length)
					longestStateName = states[i].length;
			function fixed(s) {
				return s+(new Array(longestStateName+1-s.length)).join(' ');
			}
			if (isDFA) {
				var regexInputs = new RegExp(validDFAInputs);
				var transitions = [];
				var alphabet = {};
				for (var i = 0; i < links.length; i++) {
					if (links[i] instanceof StartLink) continue;
					var origin = (links[i] instanceof SelfLink)? links[i].node.text : links[i].nodeA.text;
					var destiny = (links[i] instanceof SelfLink)? links[i].node.text : links[i].nodeB.text;
					for (var j = 0; j < links[i].text.length; j++)
						if (regexInputs.test(links[i].text[j])) {
							transitions.push([origin,links[i].text[j],destiny]);
							alphabet[links[i].text[j]] = true;
						}
				}
				alphabet = Object.keys(alphabet).sort();
				var transitionMatrix = [];
				for (var i = 0; i < states.length; i++)
					transitionMatrix.push(new Array(alphabet.length));
				for (var i = 0; i < transitions.length; i++)
					transitionMatrix[states.indexOf(transitions[i][0])][alphabet.indexOf(transitions[i][1])] = transitions[i][2];
				racsoData += fixed('');
				for (var i = 0; i < alphabet.length; i++)
					racsoData += ' '+fixed(alphabet[i]);
				racsoData += '\n';
				for (var i = 0; i < transitionMatrix.length; i++) {
					racsoData += fixed(states[i]);
					for (var j = 0; j < transitionMatrix[i].length; j++)
						racsoData += ' '+fixed(transitionMatrix[i][j]);
					if (states[i] in accepting)
						racsoData += ' +';
					racsoData += '\n';
				}
			} else {
				states.sort(); // start state does not need to be the first one
				racsoData += 'Z '+start;
				for (var i = 0; i < states.length; i++)
					if (states[i] in accepting)
						racsoData += ' '+states[i];
				racsoData += '\n';
				var regexInput = new RegExp(validPDAInput);
				var regexStack = new RegExp(validPDAStack);
				var transitions = [];
				for (var i = 0; i < links.length; i++) {
					if (links[i] instanceof StartLink) continue;
					var origin = (links[i] instanceof SelfLink)? links[i].node.text : links[i].nodeA.text;
					var destiny = (links[i] instanceof SelfLink)? links[i].node.text : links[i].nodeB.text;
					for (var j = 0; j < links[i].text.length; j++) {
						if (regexStack.test(links[i].text[j])) {
							var inStack = links[i].text[j];
							for (j++; links[i].text[j] == ' '; j++){}
							var inInput = ' ';
							if (links[i].text[j] == '|')
								j++;
							else {
								inInput = links[i].text[j];
								for (j++; links[i].text[j] == ' '; j++){}
								j++;
							}
							var toStack = '';
							for (; j < links[i].text.length && (links[i].text[j] == ' ' || regexStack.test(links[i].text[j])); j++)
								if (links[i].text[j] != ' ')
									toStack += links[i].text[j];
							transitions.push([origin,inStack+inInput+'|'+toStack,destiny]);
						}
					}
				}
				var transitionMatrix = [];
				for (var i = 0; i < states.length; i++) {
					transitionMatrix.push([]);
					for (var j = 0; j < states.length; j++)
						transitionMatrix[i].push('');
				}
				for (var i = 0; i < transitions.length; i++)
					transitionMatrix[states.indexOf(transitions[i][0])][states.indexOf(transitions[i][2])] += ', '+transitions[i][1];
				var longestTransition = 0;
				for (var i = 0; i < states.length; i++)
					for (var j = 0; j < states.length; j++)
						if (transitionMatrix[i][j] != '') {
							transitionMatrix[i][j] = transitionMatrix[i][j].substr(2);
							if (longestTransition < transitionMatrix[i][j].length)
								longestTransition = transitionMatrix[i][j].length;
						}
				function fixedtrans(s) {
					return s+(new Array(longestTransition+1-s.length)).join(' ');
				}
				for (var i = 0; i < states.length; i++)
					for (var j = 0; j < states.length; j++)
						if (transitionMatrix[i][j] != '')
							racsoData += fixed(states[i])+' -> '+fixedtrans(transitionMatrix[i][j])+' -> '+states[j]+'\n';
			}
			return racsoData;
		}
		// integrity checking of the current configuration, according to our
		// models of DFA and of PDA
		function sanityCheck() {
			var sanityHasStartState = false;
			var sanityJustOneStartState = false;
			var sanityHasSomeTransition = false; // for DFA only
			var sanityStateNames = true;
			var sanityUniqueStateNames = true;
			var sanityTransitionFormat = true;
			var sanityNoRepeatedTransitions = true, sanityRepeatedTransitions = {}; // for DFA only
			var sanityNoMissingTransitions = true, sanityMissingTransitions = {}; // for DFA only
			function nodesSanityCheck() {
				sanityStateNames = true;
				var regexStates = new RegExp(validStates);
				for (var i = 0; i < nodes.length; i++) {
					nodes[i].sane = regexStates.test(nodes[i].text);
					if (!nodes[i].sane)
						sanityStateNames = false;
				}
				sanityUniqueStateNames = true;
				for (var i = 0; i < nodes.length; i++)
					if (nodes[i].sane)
						for (var j = i+1; j < nodes.length; j++)
							if (nodes[i].text == nodes[j].text) {
								nodes[i].sane = nodes[j].sane = false;
								sanityUniqueStateNames = false;
							}
			}
			function linksSanityCheck() {
				if (isDFA) {
					sanityTransitionFormat = true;
					var starts = [];
					var regexInputs = new RegExp(validDFAInputs);
					var regexTransition = new RegExp('^ *'+validDFAInputs+'( *, *'+validDFAInputs+')* *(, *)?$');
					var link2inputs = [];
					for (var i = 0; i < links.length; i++) {
						link2inputs.push({});
						if (links[i] instanceof StartLink) {
							links[i].sane = true;
							starts.push(nodes.indexOf(links[i].node));
						} else {
							links[i].sane = regexTransition.test(links[i].text);
							if (!links[i].sane)
								sanityTransitionFormat = false;
							else {
								for (var j = 0; j < links[i].text.length; j++)
									if (regexInputs.test(links[i].text[j])) {
										if (!(links[i].text[j] in link2inputs[i]))
											link2inputs[i][links[i].text[j]] = 0;
										link2inputs[i][links[i].text[j]] += 1;
									}
							}
						}
					}
					sanityHasStartState = (starts.length > 0);
					sanityJustOneStartState = sanityHasStartState;
					for (var i = 1; i < starts.length && sanityJustOneStartState; i++)
						sanityJustOneStartState = (starts[i-1] == starts[i]);
					sanityHasSomeTransition = (starts.length != links.length);
					var alphabet = {};
					for (var i = 0; i < links.length; i++)
						for (var sym in link2inputs[i])
							if (link2inputs[i].hasOwnProperty(sym))
								alphabet[sym] = true;
					var node2transitions = [];
					for (var i = 0; i < nodes.length; i++) {
						node2transitions.push({});
						for (var sym in alphabet)
							if (alphabet.hasOwnProperty(sym))
								node2transitions[i][sym] = 0;
					}
					for (var i = 0; i < links.length; i++) {
						if (links[i].sane && links[i].getOrigin() != null) {
							var origin = nodes.indexOf(links[i].getOrigin());
							for (var sym in link2inputs[i])
								if (link2inputs[i].hasOwnProperty(sym))
									node2transitions[origin][sym] += link2inputs[i][sym];
						}
					}
					sanityNoRepeatedTransitions = true;
					sanityRepeatedTransitions = {};
					sanityNoMissingTransitions = true;
					sanityMissingTransitions = {};
					for (var i = 0; i < nodes.length; i++)
						for (var sym in alphabet)
							if (alphabet.hasOwnProperty(sym))
								if (node2transitions[i][sym] > 1) {
									if (!(nodes[i].text in sanityRepeatedTransitions))
										sanityRepeatedTransitions[nodes[i].text] = {};
									sanityRepeatedTransitions[nodes[i].text][sym] = true;
									sanityNoRepeatedTransitions = false;
								} else if (node2transitions[i][sym] == 0) {
									if (!(nodes[i].text in sanityMissingTransitions))
										sanityMissingTransitions[nodes[i].text] = {};
									sanityMissingTransitions[nodes[i].text][sym] = true;
									sanityNoMissingTransitions = false;
								}
					for (var i = 0; i < links.length; i++)
						if (links[i].sane && links[i].getOrigin() != null) {
							var origin = nodes.indexOf(links[i].getOrigin());
							for (var sym in link2inputs[i])
								if (link2inputs[i].hasOwnProperty(sym))
									if (node2transitions[origin][sym] > 1) {
										links[i].sane = false;
										break;
									}
						}
				} else {
					sanityTransitionFormat = true;
					var starts = [];
					var validTransition = ' *'+validPDAStack+' *'+validPDAInput+'? *\\|('+validPDAStack+'| )*';
					var regexTransition = new RegExp('^'+validTransition+'(,'+validTransition+')*(, *)?$');
					for (var i = 0; i < links.length; i++) {
						if (links[i] instanceof StartLink) {
							links[i].sane = true;
							starts.push(nodes.indexOf(links[i].node));
						} else {
							links[i].sane = regexTransition.test(links[i].text);
							if (!links[i].sane)
								sanityTransitionFormat = false;
						}
					}
					sanityHasStartState = (starts.length > 0);
					sanityJustOneStartState = sanityHasStartState;
					for (var i = 1; i < starts.length && sanityJustOneStartState; i++)
						sanityJustOneStartState = (starts[i-1] == starts[i]);
				}
			}
			nodesSanityCheck();
			linksSanityCheck();
			function sanityNotifier(code,data) {
				var compiled = (code == 0) ? computeRACSO() : "";
				if (outputArea) {
					removeChildren(outputArea);
					if (code == 0) {
						var pre = document.createElement("pre");
						pre.appendChild(document.createTextNode(compiled));
						outputArea.appendChild(pre);
					} else {
						var span = document.createElement("span");
						span.className += " fsm_error_message";
						span.appendChild(document.createTextNode(errorMessages[code]));
						if (code == 7 || code == 8) {
							var ul = document.createElement("ul");
							for (var state in data)
								if (data.hasOwnProperty(state)) {
									var list = "";
									for (var sym in data[state])
										if (data[state].hasOwnProperty(sym))
											list += ", "+sym;
									var it = document.createElement("li");
									it.appendChild(document.createTextNode(state+": "+list.substr(2)));
									ul.appendChild(it);
								}
							span.appendChild(ul);
						}
						outputArea.appendChild(span);
					}
				}
				if (callbackCurrent) {
					var enc = encode();
					callbackCurrent(magicJSON+enc+"\n"+compiled,enc);
				}
			}
			if (!sanityStateNames)
				sanityNotifier(4);
			else if (!sanityUniqueStateNames)
				sanityNotifier(5);
			else if (!sanityTransitionFormat)
				sanityNotifier(6);
			else if (isDFA && !sanityNoRepeatedTransitions)
				sanityNotifier(7,sanityRepeatedTransitions);
			else if (isDFA && !sanityNoMissingTransitions)
				sanityNotifier(8,sanityMissingTransitions);
			else if (!sanityHasStartState)
				sanityNotifier(1);
			else if (!sanityJustOneStartState)
				sanityNotifier(2);
			else if (isDFA && !sanityHasSomeTransition)
				sanityNotifier(3);
			else
				sanityNotifier(0);
		}
		// configuration of the visual editing
		var caretTimer = null;
		var caretVisible = true;
		function resetCaret() {
			disableCaret();
			if (selectedObject != null) {
				caretTimer = setInterval(function() {
					draw();
					caretVisible = !caretVisible;
				}, caretBlink);
				caretVisible = true;
			}
		}
		function disableCaret() {
			if (caretTimer) {
				clearInterval(caretTimer);
				caretTimer = null;
			}
		}
		var selectedObject = null; // either a Link or a Node
		var currentLink = null; // a Link
		function draw() {
			var c = canvas.getContext('2d');
			c.fillStyle = c.strokeStyle = themes[currentTheme].backgroundColor;
			c.fillRect(0, 0, canvas.width, canvas.height);
			c.save();
			c.translate(0.5, 0.5);
			var showCaret = (caretVisible && canvasHasFocus() && document.hasFocus());
			for (var i = 0; i < nodes.length; i++) {
				var isSelected = (nodes[i] == selectedObject);
				c.lineWidth = lineWidthNode;
				c.fillStyle = c.strokeStyle = isSelected ? themes[currentTheme].selectionColor : (nodes[i].sane ? themes[currentTheme].normalColor : themes[currentTheme].insaneColor);
				nodes[i].draw(c, showCaret && isSelected);
			}
			for (var i = 0; i < links.length; i++) {
				var isSelected = (links[i] == selectedObject);
				c.lineWidth = lineWidthLink;
				c.fillStyle = c.strokeStyle = isSelected ? themes[currentTheme].selectionColor : (links[i].sane ? themes[currentTheme].normalColor : themes[currentTheme].insaneColor);
				links[i].draw(c, showCaret && isSelected);
			}
			if (currentLink != null) {
				c.lineWidth = lineWidthLink;
				c.fillStyle = c.strokeStyle = themes[currentTheme].normalColor;
				currentLink.draw(c, false);
			}
			c.restore();
		}
		var fullscreen = false;
		var defullscreen = null;
		function setFullscreen(st) {
			if (st == fullscreen)
				return;
			if (!defullscreen) {
				defullscreen = {
					p: canvas.style.position,
					t: canvas.style.top,
					l: canvas.style.left,
					w: canvas.style.width,
					h: canvas.style.height,
					b: canvas.style.borderRadius,
					z: canvas.style.zIndex,
					cw: canvas.width,
					ch: canvas.height,
					o: document.documentElement.style.overflow,
				};
			}
			fullscreen = st;
			if (fullscreen) {
				defullscreen.st = window.pageYOffset;
				defullscreen.sl = window.pageXOffset;
				canvas.style.position = "absolute";
				canvas.style.top = "0";
				canvas.style.left = "0";
				canvas.style.borderRadius = "0px";
				canvas.style.zIndex = "75";
				document.documentElement.style.overflow = "hidden";
				canvas.style.width = (canvas.width = window.innerWidth)+"px";
				canvas.style.height = (canvas.height = window.innerHeight)+"px";
				window.scrollTo(0,0);
			} else {
				canvas.style.position = defullscreen.p;
				canvas.style.top = defullscreen.t;
				canvas.style.left = defullscreen.l;
				canvas.style.borderRadius = defullscreen.b;
				canvas.style.zIndex = defullscreen.z;
				canvas.style.width = defullscreen.w;
				canvas.style.height = defullscreen.h;
				canvas.width = defullscreen.cw;
				canvas.height = defullscreen.ch;
				document.documentElement.style.overflow = defullscreen.o;
				window.scrollTo(defullscreen.sl,defullscreen.st);
			}
			draw();
		}
		// user interaction code when using the mouse: create nodes and links,
		// and move around stuff
		var oldOnMouseDown = null;
		var oldOnDblClick = null;
		var oldOnMouseMove = null;
		var oldOnMouseUp = null;
		function attachMouseListeners() {
			var movingObject = false;
			var originalClick;
			function selectObject(x, y) {
				for (var i = nodes.length-1; i>=0; i--)
					if (nodes[i].containsPoint(x, y))
						return nodes[i];
				for (var i = links.length-1; i>=0; i--)
					if (links[i].containsPoint(x, y))
						return links[i];
				return null;
			}
			oldOnMouseDown = canvas.onmousedown;
			canvas.onmousedown = function(e) {
				focus(keyboardID);
				var mouse = crossBrowserRelativeMousePos(e);
				selectedObject = selectObject(mouse.x, mouse.y);
				resetCaret();
				movingObject = false;
				originalClick = mouse;
				if (selectedObject != null) {
					if (shift && selectedObject instanceof Node)
						currentLink = new SelfLink(selectedObject, mouse);
					else {
						movingObject = true;
						if (selectedObject.setMouseStart)
							selectedObject.setMouseStart(mouse.x, mouse.y);
					}
				} else if (shift)
					currentLink = new TemporaryLink(mouse, mouse);
				draw();
				if (canvasHasFocus())
					return false; // disable drag-and-drop only if the canvas is already focused
				else
					return true; // otherwise, let the browser switch the focus away from wherever it was
			};
			oldOnDblClick = canvas.ondblclick;
			canvas.ondblclick = function(e) {
				focus(keyboardID);
				var mouse = crossBrowserRelativeMousePos(e);
				selectedObject = selectObject(mouse.x, mouse.y);
				if (selectedObject == null) {
					selectedObject = new Node(mouse.x, mouse.y);
					resetCaret();
					nodes.push(selectedObject);
					sanityCheck();
					draw();
				} else {
					resetCaret();
					if (selectedObject instanceof Node) {
						selectedObject.isAcceptState = !selectedObject.isAcceptState;
						sanityCheck();
						draw();
					}
				}
			};
			oldOnMouseMove = canvas.onmousemove;
			canvas.onmousemove = function(e) {
				var mouse = crossBrowserRelativeMousePos(e);
				if (currentLink != null) {
					var targetNode = selectObject(mouse.x, mouse.y);
					if (!(targetNode instanceof Node))
						targetNode = null;
					if (selectedObject == null) {
						if (targetNode != null)
							currentLink = new StartLink(targetNode, originalClick);
						else
							currentLink = new TemporaryLink(originalClick, mouse);
					} else {
						if (targetNode == selectedObject)
							currentLink = new SelfLink(selectedObject, mouse);
						else if (targetNode != null)
							currentLink = new Link(selectedObject, targetNode);
						else
							currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
					}
					draw();
				}
				if (movingObject) {
					selectedObject.setAnchorPoint(mouse.x, mouse.y);
					if (selectedObject instanceof Node) {
						function snapNode(node) {
							for (var i = 0; i < nodes.length; i++) {
								if (nodes[i] == node) continue;
								if (Math.abs(node.x - nodes[i].x) < snapToPadding) node.x = nodes[i].x;
								if (Math.abs(node.y - nodes[i].y) < snapToPadding) node.y = nodes[i].y;
							}
						}
						snapNode(selectedObject);
					}
					draw();
				}
			};
			oldOnMouseUp = canvas.onmouseup;
			canvas.onmouseup = function(e) {
				if (movingObject) {
					movingObject = false;
					sanityCheck(); // calls the callback with updated coordinates
				}
				if (currentLink != null) {
					if (!(currentLink instanceof TemporaryLink)) {
						selectedObject = currentLink;
						resetCaret();
						links.push(currentLink);
						sanityCheck();
					}
					currentLink = null;
					draw();
				}
			};
		}
		function deattachMouseListeners() {
			canvas.onmousedown = oldOnMouseDown;
			canvas.ondblclick = oldOnDblClick;
			canvas.onmousemove = oldOnMouseMove;
			canvas.onmouseup = oldOnMouseUp;
		}
		// user interaction code when using the keyboard: give names to states,
		// define the transition symbols (and actually pressing shift is needed
		// to create a link)
		// XXX canvas cannot get the focus or whatever, and thus, registering
		// the listers into the document object
		var shift = false;
		var keyboardID = -1;
		function attachKeyListeners() {
			keyboardID = register(
				function(e) {
					var key = crossBrowserKey(e);
					if (key == 16)
						shift = true;
					else if (key == 27 && fullscreen)
						setFullscreen(false);
					else if (!canvasHasFocus())
						return true; // don't read keystrokes when other things have focus
					else if (selectedObject != null) {
						if (key == 8 && selectedObject.text) { // backspace key
							selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
							sanityCheck();
							resetCaret();
							draw();
						} else if (key == 8 || key == 46) { // delete key
							for (var i = 0; i < nodes.length; i++)
								if (nodes[i] == selectedObject)
									nodes.splice(i--, 1);
							for (var i = 0; i < links.length; i++)
								if (links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject)
									links.splice(i--, 1);
							sanityCheck();
							selectedObject = null;
							resetCaret();
							draw();
						}
					}
					if (key == 8)
						return false; // backspace is a shortcut for the back button, but do NOT want to change pages
				},
				function(e) {
					var key = crossBrowserKey(e);
					if (key == 16)
						shift = false;
				},
				function(e) {
					var key = crossBrowserKey(e);
					if (!canvasHasFocus())
						return true; // don't read keystrokes when other things have focus
					else if (key >= 0x20 && key <= 0x7E && !e.metaKey && (e.altKey == e.ctrlKey) && selectedObject != null && 'text' in selectedObject) {
						selectedObject.text += String.fromCharCode(key);
						sanityCheck();
						resetCaret();
						draw();
						return false; // don't let keys do their actions (like space scrolls down the page)
					} else if (key == 8)
						return false; // backspace is a shortcut for the back button, but do NOT want to change pages
				}
			);
		}
		function deattachKeyListeners() {
			unregister(keyboardID);
			keyboardID = -1;
		}
		// finally starting everything and then returning an object that allows
		// to setup/disable the editor (along with some extra goodies)
		if (encoded)
			decode(encoded);
		sanityCheck();
		draw();
		resetCaret();
		attachMouseListeners();
		attachKeyListeners();
		return {
			deattach: function() {
				deattachKeyListeners();
				deattachMouseListeners();
				disableCaret();
			},
			reattach: function() {
				resetCaret();
				attachMouseListeners();
				attachKeyListeners();
				sanityCheck(); // calls the callback, updates messages
			},
			setTheme: function(newTheme) {
				currentTheme = newTheme;
				draw();
			},
			setFullscreen: function(st) {
				setFullscreen(st);
			},
		};
	};

	// now the auxiliary classes and functions that are used in the code above;
	// start with the basic geometry classes: node and links between nodes
	// (several kinds of links)

	function Link(a, b) {
		this.nodeA = a;
		this.nodeB = b;
		this.text = '';
		this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line
		// make anchor point relative to the locations of nodeA and nodeB
		this.parallelPart = 0.5; // percentage from nodeA to nodeB
		this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
		this.sane = false;
	}
	Link.prototype.getOrigin = function() {
		return this.nodeA;
	}
	Link.prototype.getAnchorPoint = function() {
		var dx = this.nodeB.x - this.nodeA.x;
		var dy = this.nodeB.y - this.nodeA.y;
		var scale = Math.sqrt(dx * dx + dy * dy);
		return {
			'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
			'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
		};
	};
	Link.prototype.setAnchorPoint = function(x, y) {
		var dx = this.nodeB.x - this.nodeA.x;
		var dy = this.nodeB.y - this.nodeA.y;
		var scale = Math.sqrt(dx * dx + dy * dy);
		this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
		this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
		// snap to a straight line
		if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
			this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
			this.perpendicularPart = 0;
		}
	};
	Link.prototype.getEndPointsAndCircle = function() {
		if (this.perpendicularPart == 0) {
			var midX = (this.nodeA.x + this.nodeB.x) / 2;
			var midY = (this.nodeA.y + this.nodeB.y) / 2;
			var start = this.nodeA.closestPointOnCircle(midX, midY);
			var end = this.nodeB.closestPointOnCircle(midX, midY);
			return {
				'hasCircle': false,
				'startX': start.x,
				'startY': start.y,
				'endX': end.x,
				'endY': end.y
			};
		}
		var anchor = this.getAnchorPoint();
		function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
			function det(a, b, c, d, e, f, g, h, i) {
				return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
			}
			var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
			var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
			var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
			var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
			return {
				'x': -bx / (2*a),
				'y': -by / (2*a),
				'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
			};
		}
		var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
		var isReversed = (this.perpendicularPart > 0);
		var reverseScale = isReversed ? 1 : -1;
		var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * nodeRadius / circle.radius;
		var endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * nodeRadius / circle.radius;
		var startX = circle.x + circle.radius * Math.cos(startAngle);
		var startY = circle.y + circle.radius * Math.sin(startAngle);
		var endX = circle.x + circle.radius * Math.cos(endAngle);
		var endY = circle.y + circle.radius * Math.sin(endAngle);
		return {
			'hasCircle': true,
			'startX': startX,
			'startY': startY,
			'endX': endX,
			'endY': endY,
			'startAngle': startAngle,
			'endAngle': endAngle,
			'circleX': circle.x,
			'circleY': circle.y,
			'circleRadius': circle.radius,
			'reverseScale': reverseScale,
			'isReversed': isReversed
		};
	};
	Link.prototype.draw = function(c, showCaret) {
		var stuff = this.getEndPointsAndCircle();
		// draw arc
		c.beginPath();
		if (stuff.hasCircle)
			c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
		else {
			c.moveTo(stuff.startX, stuff.startY);
			c.lineTo(stuff.endX, stuff.endY);
		}
		c.stroke();
		// draw the head of the arrow
		if (stuff.hasCircle)
			drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
		else
			drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
		// draw the text
		if (stuff.hasCircle) {
			var startAngle = stuff.startAngle;
			var endAngle = stuff.endAngle;
			if (endAngle < startAngle)
				endAngle += Math.PI * 2;
			var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
			var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
			var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
			drawText(c, this.text, textX, textY, textAngle, showCaret);
		} else {
			var textX = (stuff.startX + stuff.endX) / 2;
			var textY = (stuff.startY + stuff.endY) / 2;
			var textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
			drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, showCaret);
		}
	};
	Link.prototype.containsPoint = function(x, y) {
		var stuff = this.getEndPointsAndCircle();
		if (stuff.hasCircle) {
			var dx = x - stuff.circleX;
			var dy = y - stuff.circleY;
			var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
			if (Math.abs(distance) < hitTargetPadding) {
				var angle = Math.atan2(dy, dx);
				var startAngle = stuff.startAngle;
				var endAngle = stuff.endAngle;
				if (stuff.isReversed) {
					var temp = startAngle;
					startAngle = endAngle;
					endAngle = temp;
				}
				if (endAngle < startAngle)
					endAngle += Math.PI * 2;
				if (angle < startAngle)
					angle += Math.PI * 2;
				else if (angle > endAngle)
					angle -= Math.PI * 2;
				return (angle > startAngle && angle < endAngle);
			}
		} else {
			var dx = stuff.endX - stuff.startX;
			var dy = stuff.endY - stuff.startY;
			var length = Math.sqrt(dx*dx + dy*dy);
			var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
			var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
			return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
		}
		return false;
	};

	function Node(x, y) {
		this.x = x;
		this.y = y;
		this.mouseOffsetX = 0;
		this.mouseOffsetY = 0;
		this.isAcceptState = false;
		this.text = '';
		this.sane = false;
	}
	Node.prototype.setMouseStart = function(x, y) {
		this.mouseOffsetX = this.x - x;
		this.mouseOffsetY = this.y - y;
	};
	Node.prototype.setAnchorPoint = function(x, y) {
		this.x = x + this.mouseOffsetX;
		this.y = y + this.mouseOffsetY;
	};
	Node.prototype.draw = function(c, showCaret) {
		// draw the circle
		c.beginPath();
		c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
		c.stroke();
		// draw the text
		drawText(c, this.text, this.x, this.y, null, showCaret);
		// draw a double circle for an accept state
		if (this.isAcceptState) {
			c.beginPath();
			c.arc(this.x, this.y, acceptRadius, 0, 2 * Math.PI, false);
			c.stroke();
		}
	};
	Node.prototype.closestPointOnCircle = function(x, y) {
		var dx = x - this.x;
		var dy = y - this.y;
		var scale = Math.sqrt(dx * dx + dy * dy);
		return {
			'x': this.x + dx * nodeRadius / scale,
			'y': this.y + dy * nodeRadius / scale
		};
	};
	Node.prototype.containsPoint = function(x, y) {
		return (x - this.x)*(x - this.x) + (y - this.y)*(y - this.y) < nodeRadius*nodeRadius;
	};

	function SelfLink(node, mouse) {
		this.node = node;
		this.anchorAngle = 0;
		this.mouseOffsetAngle = 0;
		this.text = '';
		this.sane = false;
		if (mouse)
			this.setAnchorPoint(mouse.x, mouse.y);
	}
	SelfLink.prototype.getOrigin = function() {
		return this.node;
	}
	SelfLink.prototype.setMouseStart = function(x, y) {
		this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
	};
	SelfLink.prototype.setAnchorPoint = function(x, y) {
		this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
		// snap to 90 degrees
		var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
		if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
		// keep in the range -pi to pi so our containsPoint() function always works
		if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
		if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
	};
	SelfLink.prototype.getEndPointsAndCircle = function() {
		var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
		var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
		var circleRadius = 0.75 * nodeRadius;
		var startAngle = this.anchorAngle - Math.PI * 0.8;
		var endAngle = this.anchorAngle + Math.PI * 0.8;
		var startX = circleX + circleRadius * Math.cos(startAngle);
		var startY = circleY + circleRadius * Math.sin(startAngle);
		var endX = circleX + circleRadius * Math.cos(endAngle);
		var endY = circleY + circleRadius * Math.sin(endAngle);
		return {
			'hasCircle': true,
			'startX': startX,
			'startY': startY,
			'endX': endX,
			'endY': endY,
			'startAngle': startAngle,
			'endAngle': endAngle,
			'circleX': circleX,
			'circleY': circleY,
			'circleRadius': circleRadius
		};
	};
	SelfLink.prototype.draw = function(c, showCaret) {
		var stuff = this.getEndPointsAndCircle();
		// draw arc
		c.beginPath();
		c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, false);
		c.stroke();
		// draw the text on the loop farthest from the node
		var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
		var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
		drawText(c, this.text, textX, textY, this.anchorAngle, showCaret);
		// draw the head of the arrow
		drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
	};
	SelfLink.prototype.containsPoint = function(x, y) {
		var stuff = this.getEndPointsAndCircle();
		var dx = x - stuff.circleX;
		var dy = y - stuff.circleY;
		var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
		return (Math.abs(distance) < hitTargetPadding);
	};

	function StartLink(node, start) {
		this.node = node;
		this.deltaX = 0;
		this.deltaY = 0;
		this.sane = false;
		if (start)
			this.setAnchorPoint(start.x, start.y);
	}
	StartLink.prototype.getOrigin = function() {
		return null;
	}
	StartLink.prototype.setAnchorPoint = function(x, y) {
		this.deltaX = x - this.node.x;
		this.deltaY = y - this.node.y;
		if (Math.abs(this.deltaX) < snapToPadding)
			this.deltaX = 0;
		if (Math.abs(this.deltaY) < snapToPadding)
			this.deltaY = 0;
	};
	StartLink.prototype.getEndPoints = function() {
		var startX = this.node.x + this.deltaX;
		var startY = this.node.y + this.deltaY;
		var end = this.node.closestPointOnCircle(startX, startY);
		return {
			'startX': startX,
			'startY': startY,
			'endX': end.x,
			'endY': end.y
		};
	};
	StartLink.prototype.draw = function(c) {
		var stuff = this.getEndPoints();
		// draw the line
		c.beginPath();
		c.moveTo(stuff.startX, stuff.startY);
		c.lineTo(stuff.endX, stuff.endY);
		c.stroke();
		// draw the head of the arrow
		drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
	};
	StartLink.prototype.containsPoint = function(x, y) {
		var stuff = this.getEndPoints();
		var dx = stuff.endX - stuff.startX;
		var dy = stuff.endY - stuff.startY;
		var length = Math.sqrt(dx*dx + dy*dy);
		var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
		var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
	};

	function TemporaryLink(from, to) {
		this.from = from;
		this.to = to;
	}
	TemporaryLink.prototype.draw = function(c) {
		// draw the line
		c.beginPath();
		c.moveTo(this.to.x, this.to.y);
		c.lineTo(this.from.x, this.from.y);
		c.stroke();
		// draw the head of the arrow
		drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
	};

	function drawArrow(c, x, y, angle) {
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);
		c.beginPath();
		c.moveTo(x, y);
		c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
		c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
		c.fill();
	}

	function drawText(c, text, x, y, angleOrNull, showCaret) {
		c.font = font;
		var width = c.measureText(text).width;
		// center the text
		x -= width / 2;
		// position the text intelligently if given an angle
		if (angleOrNull != null) {
			var cos = Math.cos(angleOrNull);
			var sin = Math.sin(angleOrNull);
			var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
			var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
			var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
			x += cornerPointX - sin * slide;
			y += cornerPointY + cos * slide;
		}
		// draw text and caret (round the coordinates so the caret falls on a pixel)
		x = Math.round(x);
		y = Math.round(y);
		c.fillText(text, x, y + 6);
		if (showCaret) {
			x += width;
			c.beginPath();
			c.moveTo(x + 2, y - fontHeight/2);
			c.lineTo(x + 2, y + fontHeight/2);
			c.stroke();
		}
	}

	// finally some generic auxiliary functions

	function getNode(n) {
		if (typeof n === "string" || n instanceof String)
			return document.getElementById(n);
		else
			return n;
	}

	function removeChildren(n) {
		while (n.firstChild)
			n.removeChild(n.firstChild);
	}

	function isDescendant(node,antecessor) {
		for (node=node.parentNode ; node!=null ; node=node.parentNode)
			if (node == antecessor)
				return true;
		return false;
	}

	function startsWith(a,b) {
		return a.lastIndexOf(b,0) === 0;
	}

	function objectEmpty(obj) {
		for (var k in obj)
			if (obj.hasOwnProperty(k))
				return false;
		return true;
	}

	function crossBrowserKey(e) {
		e = e || window.event;
		return e.which || e.keyCode;
	}

	function crossBrowserRelativeMousePos(e) {
		function crossBrowserElementPos(e) {
			e = e || window.event;
			var obj = e.target || e.srcElement;
			var x = 0, y = 0;
			while (obj.offsetParent) {
				x += obj.offsetLeft;
				y += obj.offsetTop;
				obj = obj.offsetParent;
			}
			return { 'x': x, 'y': y };
		}
		function crossBrowserMousePos(e) {
			e = e || window.event;
			return {
				'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
				'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop
			};
		}
		var element = crossBrowserElementPos(e);
		var mouse = crossBrowserMousePos(e);
		return {
			'x': mouse.x - element.x,
			'y': mouse.y - element.y
		};
	}

	// XXX we register keyboard listeners globally, but in order to allow two
	// or more instances of the editor on the same page, we need coordination
	// and to keep track of which editor has 'focus'... This is a PITA.

	var originalonkeydown = undefined;
	var originalonkeyup = undefined;
	var originalonkeypress = undefined;
	var id = 0;
	var id2event2func = {};
	function register(onkeydown,onkeyup,onkeypress) {
		if (objectEmpty(id2event2func)) {
			originalonkeydown = document.onkeydown;
			originalonkeyup = document.onkeyup;
			originalonkeypress = document.onkeypress;
			document.onkeydown = function(e){ return delegate(e,"onkeydown"); };
			document.onkeyup = function(e){ delegate(e,"onkeyup"); };
			document.onkeypress = function(e){ return delegate(e,"onkeypress"); };
		}
		id2event2func[id] = {
			onkeydown: onkeydown,
			onkeyup: onkeyup,
			onkeypress: onkeypress,
		};
		return id++;
	}
	function unregister(id) {
		if (id2event2func.hasOwnProperty(id)) {
			delete id2event2func[id];
			if (objectEmpty(id2event2func)) {
				document.onkeydown = originalonkeydown;
				document.onkeyup = originalonkeyup;
				document.onkeypress = originalonkeypress;
				originalonkeydown = undefined;
				originalonkeyup = undefined;
				originalonkeypress = undefined;
			}
		}
	}
	var focused = -1;
	function focus(id) {
		focused = id2event2func.hasOwnProperty(id) ? id : -1;
	}
	function delegate(e,code) {
		var propagate = true;
		for (var id in id2event2func)
			if (id2event2func.hasOwnProperty(id))
				propagate = id2event2func[id][code](e) && propagate;
		return propagate;
	}
}());
