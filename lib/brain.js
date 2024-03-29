// RiveScript.js
// https://www.rivescript.com/

// This code is released under the MIT License.
// See the "LICENSE" file for more information.

// Brain logic for RiveScript

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = require("./utils");
var inherit_utils = require("./inheritance");

/**
Brain (RiveScript master)

Create a Brain object which handles the actual process of fetching a reply.
*/

var Brain = function () {
	function Brain(master) {
		_classCallCheck(this, Brain);

		var self = this;

		self.master = master;
		self.strict = master._strict;
		self.utf8 = master._utf8;

		// Private variables only relevant to the reply-answering part of RiveScript.
		self._currentUser = null; // The current user asking for a message
	}

	// Proxy functions


	_createClass(Brain, [{
		key: "say",
		value: function say(message) {
			return this.master.say(message);
		}
	}, {
		key: "warn",
		value: function warn(message, filename, lineno) {
			return this.master.warn(message, filename, lineno);
		}

		/**
  async reply (string user, string msg[, scope])
  
  Fetch a reply for the user. This returns a Promise that may be awaited on.
  */

	}, {
		key: "reply",
		value: function () {
			var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(user, msg, scope) {
				var self, reply, begin, history;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								self = this;


								self.say("Asked to reply to [" + user + "] " + msg);

								// Store the current user's ID.
								self._currentUser = user;

								// Format their message.
								msg = self.formatMessage(msg);
								reply = "";

								// Set initial match to be undefined

								_context.next = 7;
								return self.master._session.set(user, {
									__initialmatch__: null
								});

							case 7:
								if (!self.master._topics.__begin__) {
									_context.next = 21;
									break;
								}

								_context.next = 10;
								return self._getReply(user, "request", "begin", 0, scope);

							case 10:
								begin = _context.sent;

								if (!(begin.indexOf("{ok}") > -1)) {
									_context.next = 16;
									break;
								}

								_context.next = 14;
								return self._getReply(user, msg, "normal", 0, scope);

							case 14:
								reply = _context.sent;

								begin = begin.replace(/\{ok\}/g, reply);

							case 16:
								_context.next = 18;
								return self.processTags(user, msg, begin, [], [], 0, scope);

							case 18:
								reply = _context.sent;
								_context.next = 24;
								break;

							case 21:
								_context.next = 23;
								return self._getReply(user, msg, "normal", 0, scope);

							case 23:
								reply = _context.sent;

							case 24:
								_context.next = 26;
								return self.master._session.get(user, "__history__");

							case 26:
								history = _context.sent;

								if (history == "undefined") {
									// purposeful typecast
									history = newHistory();
								}
								try {
									// If modifying it fails, the data was bad, and reset it.
									history.input.pop();
									history.input.unshift(msg);
									history.reply.pop();
									history.reply.unshift(reply);
								} catch (e) {
									history = newHistory();
								}
								_context.next = 31;
								return self.master._session.set(user, {
									__history__: history
								});

							case 31:

								// Unset the current user ID.
								self._currentUser = null;

								return _context.abrupt("return", reply);

							case 33:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function reply(_x, _x2, _x3) {
				return _ref.apply(this, arguments);
			}

			return reply;
		}()

		/**
  async _getReply (string user, string msg, string context, int step, scope)
  
  The internal reply method. DO NOT CALL THIS DIRECTLY.
  
  * user, msg and scope are the same as reply()
  * context = "normal" or "begin"
  * step = the recursion depth
  * scope = the call scope for object macros
  */

	}, {
		key: "_getReply",
		value: function () {
			var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(user, msg, context, step, scope) {
				var self, topic, stars, thatstars, reply, history, matched, matchedTrigger, foundMatch, allTopics, j, len, top, lastReply, k, len1, trig, pattern, botside, match, userSide, regexp, isAtomic, isMatch, _match, l, _len, _trig, _pattern, _regexp, _isAtomic, _isMatch, _match2, i, _len2, lastTriggers, n, redirect, o, len4, row, halves, condition, left, eq, right, potreply, passed, bucket, q, len5, rep, weight, _match3, _i, choice, _match4, giveup, name, _name, value;

				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								self = this;

								// Needed to sort replies?

								if (self.master._sorted.topics) {
									_context2.next = 4;
									break;
								}

								self.warn("You forgot to call sortReplies()!");
								return _context2.abrupt("return", "ERR: Replies Not Sorted");

							case 4:
								_context2.next = 6;
								return self.master.getUservar(user, "topic");

							case 6:
								topic = _context2.sent;

								if (topic === null || topic === "undefined") {
									topic = "random";
								}

								stars = [];
								thatstars = []; // For %Previous

								reply = "";

								// Avoid letting them fall into a missing topic.

								if (self.master._topics[topic]) {
									_context2.next = 16;
									break;
								}

								self.warn("User " + user + " was in an empty topic named '" + topic + "'");
								topic = "random";
								_context2.next = 16;
								return self.master.setUservar(user, "topic", topic);

							case 16:
								if (!(step > self.master._depth)) {
									_context2.next = 18;
									break;
								}

								return _context2.abrupt("return", self.master.errors.deepRecursion);

							case 18:

								// Are we in the BEGIN block?
								if (context === "begin") {
									topic = "__begin__";
								}

								// Initialize this user's history.
								_context2.next = 21;
								return self.master._session.get(user, "__history__");

							case 21:
								history = _context2.sent;

								if (!(history == "undefined")) {
									_context2.next = 26;
									break;
								}

								// purposeful typecast
								history = newHistory();
								_context2.next = 26;
								return self.master._session.set(user, {
									__history__: history
								});

							case 26:
								if (self.master._topics[topic]) {
									_context2.next = 28;
									break;
								}

								return _context2.abrupt("return", "ERR: No default topic 'random' was found!");

							case 28:

								// Create a pointer for the matched data when we find it.
								matched = null;
								matchedTrigger = null;
								foundMatch = false;

								// See if there were any %Previous's in this topic, or any topic related
								// to it. This should only be done the first time -- not during a recursive
								// redirection. This is because in a redirection, "lastreply" is still gonna
								// be the same as it was the first time, resulting in an infinite loop!

								if (!(step === 0)) {
									_context2.next = 78;
									break;
								}

								allTopics = [topic];

								if (self.master._topics[topic].includes || self.master._topics[topic].inherits) {
									// Get ALL the topics!
									allTopics = inherit_utils.getTopicTree(self.master, topic);
								}

								// Scan them all.
								j = 0, len = allTopics.length;

							case 35:
								if (!(j < len)) {
									_context2.next = 78;
									break;
								}

								top = allTopics[j];

								self.say("Checking topic " + top + " for any %Previous's");

								if (!self.master._sorted.thats[top].length) {
									_context2.next = 74;
									break;
								}

								// There's one here!
								self.say("There's a %Previous in this topic!");

								// Do we have history yet?
								lastReply = history.reply ? history.reply[0] : "undefined";

								// Format the bot's last reply the same way as the human's.

								lastReply = self.formatMessage(lastReply, true);
								self.say("Last reply: " + lastReply);

								// See if it's a match
								k = 0, len1 = self.master._sorted.thats[top].length;

							case 44:
								if (!(k < len1)) {
									_context2.next = 72;
									break;
								}

								trig = self.master._sorted.thats[top][k];
								pattern = trig[1].previous;
								_context2.next = 49;
								return self.triggerRegexp(user, pattern);

							case 49:
								botside = _context2.sent;


								self.say("Try to match lastReply (" + lastReply + ") to " + botside);

								// Match?
								match = lastReply.match(new RegExp("^" + botside + "$"));

								if (!match) {
									_context2.next = 69;
									break;
								}

								// Huzzah! See if OUR message is right too.
								self.say("Bot side matched!");

								thatstars = match; // Collect the bot stars in case we need them
								thatstars.shift();

								// Compare the triggers to the user's message.
								userSide = trig[1];
								_context2.next = 59;
								return self.triggerRegexp(user, userSide.trigger);

							case 59:
								regexp = _context2.sent;

								self.say("Try to match \"" + msg + "\" against " + userSide.trigger + " (" + regexp + ")");

								// If the trigger is atomic, we don't need to bother with the regexp engine.
								isAtomic = utils.isAtomic(userSide.trigger);
								isMatch = false;

								if (isAtomic) {
									if (msg === regexp) {
										isMatch = true;
									}
								} else {
									_match = msg.match(new RegExp("^" + regexp + "$"));

									if (_match) {
										isMatch = true;
										// Get the stars
										stars = _match;
										if (stars.length >= 1) {
											stars.shift();
										}
									}
								}

								// Was it a match?

								if (!isMatch) {
									_context2.next = 69;
									break;
								}

								// Keep the trigger pointer.
								matched = userSide;
								foundMatch = true;
								matchedTrigger = userSide.trigger;
								return _context2.abrupt("break", 72);

							case 69:
								k++;
								_context2.next = 44;
								break;

							case 72:
								_context2.next = 75;
								break;

							case 74:
								self.say("No %Previous in this topic!");

							case 75:
								j++;
								_context2.next = 35;
								break;

							case 78:
								if (foundMatch) {
									_context2.next = 100;
									break;
								}

								self.say("Searching their topic for a match...");
								l = 0, _len = self.master._sorted.topics[topic].length;

							case 81:
								if (!(l < _len)) {
									_context2.next = 100;
									break;
								}

								_trig = self.master._sorted.topics[topic][l];
								_pattern = _trig[0];
								_context2.next = 86;
								return self.triggerRegexp(user, _pattern);

							case 86:
								_regexp = _context2.sent;


								self.say("Try to match \"" + msg + "\" against " + _pattern + " (" + _regexp + ")");

								// If the trigger is atomic, we don't need to bother with the regexp engine.
								_isAtomic = utils.isAtomic(_pattern);
								_isMatch = false;

								if (_isAtomic) {
									if (msg === _regexp) {
										_isMatch = true;
									}
								} else {
									// Non-atomic triggers always need the regexp.
									_match2 = msg.match(new RegExp("^" + _regexp + "$"));

									if (_match2) {
										// The regexp matched!
										_isMatch = true;

										// Collect the stars
										stars = [];
										if (_match2.length > 1) {
											for (i = 1, _len2 = _match2.length; i < _len2; i++) {
												stars.push(_match2[i]);
											}
										}
									}
								}

								// A match somehow?

								if (!_isMatch) {
									_context2.next = 97;
									break;
								}

								self.say("Found a match!");

								// Keep the pointer to this trigger's data.
								matched = _trig[1];
								foundMatch = true;
								matchedTrigger = _pattern;
								return _context2.abrupt("break", 100);

							case 97:
								l++;
								_context2.next = 81;
								break;

							case 100:
								_context2.next = 102;
								return self.master._session.set(user, { __lastmatch__: matchedTrigger });

							case 102:
								lastTriggers = [];

								if (!(step === 0)) {
									_context2.next = 106;
									break;
								}

								_context2.next = 106;
								return self.master._session.set(user, {
									// Store initial matched trigger. Like __lastmatch__, this can be undefined.
									__initialmatch__: matchedTrigger,

									// Also initialize __last_triggers__ which will keep all matched triggers
									__last_triggers__: lastTriggers
								});

							case 106:
								if (!matched) {
									_context2.next = 160;
									break;
								}

								// Keep the current match
								lastTriggers.push(matched);
								_context2.next = 110;
								return self.master._session.set(user, { __last_triggers__: lastTriggers });

							case 110:
								n = 0;

							case 111:
								if (!(n < 1)) {
									_context2.next = 160;
									break;
								}

								if (!(matched.redirect != null)) {
									_context2.next = 122;
									break;
								}

								self.say("Redirecting us to " + matched.redirect);
								_context2.next = 116;
								return self.processTags(user, msg, matched.redirect, stars, thatstars, step, scope);

							case 116:
								redirect = _context2.sent;


								self.say("Pretend user said: " + redirect);
								_context2.next = 120;
								return self._getReply(user, redirect, context, step + 1, scope);

							case 120:
								reply = _context2.sent;
								return _context2.abrupt("break", 160);

							case 122:
								o = 0, len4 = matched.condition.length;

							case 123:
								if (!(o < len4)) {
									_context2.next = 150;
									break;
								}

								row = matched.condition[o];
								halves = row.split(/\s*=>\s*/);

								if (!(halves && halves.length === 2)) {
									_context2.next = 147;
									break;
								}

								condition = halves[0].match(/^(.+?)\s+(==|eq|!=|ne|<>|<|<=|>|>=)\s+(.*?)$/);

								if (!condition) {
									_context2.next = 147;
									break;
								}

								left = utils.strip(condition[1]);
								eq = condition[2];
								right = utils.strip(condition[3]);
								potreply = halves[1].trim();

								// Process tags all around

								_context2.next = 135;
								return self.processTags(user, msg, left, stars, thatstars, step, scope);

							case 135:
								left = _context2.sent;
								_context2.next = 138;
								return self.processTags(user, msg, right, stars, thatstars, step, scope);

							case 138:
								right = _context2.sent;


								// Defaults?
								if (left.length === 0) {
									left = "undefined";
								}
								if (right.length === 0) {
									right = "undefined";
								}

								self.say("Check if " + left + " " + eq + " " + right);

								// Validate it
								passed = false;

								if (eq === "eq" || eq === "==") {
									if (left === right) {
										passed = true;
									}
								} else if (eq === "ne" || eq === "!=" || eq === "<>") {
									if (left !== right) {
										passed = true;
									}
								} else {
									try {
										// Dealing with numbers here
										left = parseInt(left);
										right = parseInt(right);
										if (eq === "<" && left < right) {
											passed = true;
										} else if (eq === "<=" && left <= right) {
											passed = true;
										} else if (eq === ">" && left > right) {
											passed = true;
										} else if (eq === ">=" && left >= right) {
											passed = true;
										}
									} catch (error) {
										e = error;
										self.warn("Failed to evaluate numeric condition!");
									}
								}

								// OK?

								if (!passed) {
									_context2.next = 147;
									break;
								}

								reply = potreply;
								return _context2.abrupt("break", 150);

							case 147:
								o++;
								_context2.next = 123;
								break;

							case 150:
								if (!(reply !== null && reply.length > 0)) {
									_context2.next = 152;
									break;
								}

								return _context2.abrupt("break", 160);

							case 152:

								// Process weights in the replies.
								bucket = [];

								for (q = 0, len5 = matched.reply.length; q < len5; q++) {
									rep = matched.reply[q];
									weight = 1;
									_match3 = rep.match(/\{weight=(\d+?)\}/i);

									if (_match3) {
										weight = _match3[1];
										if (weight <= 0) {
											self.warn("Can't have a weight <= 0!");
											weight = 1;
										}
									}

									for (_i = 0; _i < weight; _i++) {
										bucket.push(rep);
									}
								}

								// Get a random reply.
								choice = parseInt(Math.random() * bucket.length);

								reply = bucket[choice];
								return _context2.abrupt("break", 160);

							case 157:
								n++;
								_context2.next = 111;
								break;

							case 160:

								// Still no reply?
								if (!foundMatch) {
									reply = self.master.errors.replyNotMatched;
								} else if (reply === void 0 || reply.length === 0) {
									reply = self.master.errors.replyNotFound;
								}

								self.say("Reply: " + reply);

								// Process tags for the BEGIN block.

								if (!(context === "begin")) {
									_context2.next = 194;
									break;
								}

								// The BEGIN block can set {topic} and user vars.

								// Topic setter
								_match4 = reply.match(/\{topic=(.+?)\}/i);
								giveup = 0;

							case 165:
								if (!_match4) {
									_context2.next = 177;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context2.next = 170;
									break;
								}

								self.warn("Infinite loop looking for topic tag!");
								return _context2.abrupt("break", 177);

							case 170:
								name = _match4[1];
								_context2.next = 173;
								return self.master.setUservar(user, "topic", name);

							case 173:
								reply = reply.replace(new RegExp("{topic=" + utils.quotemeta(name) + "}", "ig"), "");
								_match4 = reply.match(/\{topic=(.+?)\}/i);
								_context2.next = 165;
								break;

							case 177:

								// Set user vars
								_match4 = reply.match(/<set (.+?)=(.+?)>/i);
								giveup = 0;

							case 179:
								if (!_match4) {
									_context2.next = 192;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context2.next = 184;
									break;
								}

								self.warn("Infinite loop looking for set tag!");
								return _context2.abrupt("break", 192);

							case 184:
								_name = _match4[1];
								value = _match4[2];
								_context2.next = 188;
								return self.master.setUservar(user, _name, value);

							case 188:
								reply = reply.replace(new RegExp("<set " + utils.quotemeta(_name) + "=" + utils.quotemeta(value) + ">", "ig"), "");
								_match4 = reply.match(/<set (.+?)=(.+?)>/i);
								_context2.next = 179;
								break;

							case 192:
								_context2.next = 195;
								break;

							case 194:
								// Process all the tags.
								reply = self.processTags(user, msg, reply, stars, thatstars, step, scope);

							case 195:
								return _context2.abrupt("return", reply);

							case 196:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function _getReply(_x4, _x5, _x6, _x7, _x8) {
				return _ref2.apply(this, arguments);
			}

			return _getReply;
		}()

		/**
  string formatMessage (string msg)
  
  Format a user's message for safe processing.
  */

	}, {
		key: "formatMessage",
		value: function formatMessage(msg, botreply) {
			var self = this;

			// Lowercase it.
			msg = "" + msg;
			msg = msg.toLowerCase();

			// Run substitutions and sanitize what's left.
			msg = self.substitute(msg, "sub");

			// In UTF-8 mode, only strip metacharcters and HTML brackets (to protect
			// against obvious XSS attacks).
			if (self.utf8) {
				msg = msg.replace(/[\\<>]+/, "");

				if (self.master.unicodePunctuation != null) {
					msg = msg.replace(self.master.unicodePunctuation, "");
				}

				// For the bot's reply, also strip common punctuation.
				if (botreply != null) {
					msg = msg.replace(/[.?,!;:@#$%^&*()]/, "");
				}
			} else {
				// For everything else, strip all non-alphanumerics
				msg = utils.stripNasties(msg, self.utf8);
			}

			// cut leading and trailing blanks once punctuation dropped office
			msg = msg.trim();
			msg = msg.replace(/\s+/g, " ");
			return msg;
		}

		/**
  async triggerRegexp (string user, string trigger)
  
  Prepares a trigger for the regular expression engine.
  */

	}, {
		key: "triggerRegexp",
		value: function () {
			var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(user, regexp) {
				var self, match, giveup, parts, opts, j, len, p, pipes, _match5, name, rep, _match6, _name2, _rep, _match7, _name3, _rep2, history, ref, k, len1, type, i, value;

				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								self = this;

								// If the trigger is simply '*' then the * needs to become (.*?)
								// to match the blank string too.

								regexp = regexp.replace(/^\*$/, "<zerowidthstar>");

								// Simple replacements.
								regexp = regexp.replace(/\*/g, "(.+?)"); // Convert * into (.+?)
								regexp = regexp.replace(/#/g, "(\\d+?)"); // Convert # into (\d+?)
								regexp = regexp.replace(/_/g, "(\\w+?)"); // Convert _ into (\w+?)
								regexp = regexp.replace(/\s*\{weight=\d+\}\s*/g, ""); // Remove {weight} tags
								regexp = regexp.replace(/<zerowidthstar>/g, "(.*?)");
								regexp = regexp.replace(/\|{2,}/, '|'); // Remove empty entities
								regexp = regexp.replace(/(\(|\[)\|/g, '$1'); // Remove empty entities from start of alt/opts
								regexp = regexp.replace(/\|(\)|\])/g, '$1'); // Remove empty entities from end of alt/opts

								// UTF-8 mode special characters.
								if (self.utf8) {
									regexp = regexp.replace(/\\@/, "\\u0040"); // @ symbols conflict w/ arrays
								}

								// Optionals.
								match = regexp.match(/\[(.+?)\]/);
								giveup = 0;

							case 13:
								if (!match) {
									_context3.next = 29;
									break;
								}

								if (!(giveup++ > 50)) {
									_context3.next = 17;
									break;
								}

								self.warn("Infinite loop when trying to process optionals in a trigger!");
								return _context3.abrupt("return", "");

							case 17:

								// The resulting regexp needs to work in two scenarios:
								// 1) The user included the optional word(s) in which case they must be
								//    in the message surrounded by a space or a word boundary (e.g. the
								//    end or beginning of their message)
								// 2) The user did not include the word, meaning the whole entire set of
								//    words should be "OR'd" with a word boundary or one or more spaces.
								//
								// The resulting regexp ends up looking like this, for a given input
								// trigger of: what is your [home|office] number
								// what is your(?:(?:\s|\b)+home(?:\s|\b)+|(?:\s|\b)+office(?:\s|\b)+|(?:\b|\s)+)number
								//
								// See https://github.com/aichaos/rivescript-js/issues/48

								parts = match[1].split("|");
								opts = [];

								for (j = 0, len = parts.length; j < len; j++) {
									p = parts[j];

									opts.push("(?:\\s|\\b)+" + p + "(?:\\s|\\b)+");
								}

								// If this optional had a star or anything in it, make it non-matching.
								pipes = opts.join("|");

								pipes = pipes.replace(new RegExp(utils.quotemeta("(.+?)"), "g"), "(?:.+?)");
								pipes = pipes.replace(new RegExp(utils.quotemeta("(\\d+?)"), "g"), "(?:\\d+?)");
								pipes = pipes.replace(new RegExp(utils.quotemeta("(\\w+?)"), "g"), "(?:\\w+?)");

								// Temporarily dummy out the literal square brackets so we don't loop forever
								// thinking that the [\s\b] part is another optional.
								pipes = pipes.replace(/\[/g, "__lb__").replace(/\]/g, "__rb__");
								regexp = regexp.replace(new RegExp("\\s*\\[" + utils.quotemeta(match[1]) + "\\]\\s*"), "(?:" + pipes + "|(?:\\b|\\s)+)");
								match = regexp.match(/\[(.+?)\]/);
								_context3.next = 13;
								break;

							case 29:

								// Restore the literal square brackets.
								regexp = regexp.replace(/__lb__/g, "[").replace(/__rb__/g, "]");

								// _ wildcards can't match numbers! Quick note on why I did it this way:
								// the initial replacement above (_ => (\w+?)) needs to be \w because the
								// square brackets in [\s\d] will confuse the optionals logic just above.
								// So then we switch it back down here. Also, we don't just use \w+ because
								// that matches digits, and similarly [A-Za-z] doesn't work with Unicode,
								// so this regexp excludes spaces and digits instead of including letters.
								regexp = regexp.replace(/\\w/, "[^\\s\\d]");

								// Filter in arrays.
								giveup = 0;

							case 32:
								if (!(regexp.indexOf("@") > -1)) {
									_context3.next = 39;
									break;
								}

								if (!(giveup++ > 50)) {
									_context3.next = 35;
									break;
								}

								return _context3.abrupt("break", 39);

							case 35:
								_match5 = regexp.match(/\@(.+?)\b/);

								if (_match5) {
									name = _match5[1];
									rep = "";

									if (self.master._array[name]) {
										rep = "(?:" + self.master._array[name].join("|") + ")";
									}
									regexp = regexp.replace(new RegExp("@" + utils.quotemeta(name) + "\\b"), rep);
								}
								_context3.next = 32;
								break;

							case 39:

								// Filter in bot variables.
								giveup = 0;

							case 40:
								if (!(regexp.indexOf("<bot") > -1)) {
									_context3.next = 47;
									break;
								}

								if (!(giveup++ > 50)) {
									_context3.next = 43;
									break;
								}

								return _context3.abrupt("break", 47);

							case 43:
								_match6 = regexp.match(/<bot (.+?)>/i);

								if (_match6) {
									_name2 = _match6[1];
									_rep = '';

									if (self.master._var[_name2]) {
										_rep = utils.stripNasties(self.master._var[_name2], self.utf8);
									}
									regexp = regexp.replace(new RegExp("<bot " + utils.quotemeta(_name2) + ">"), _rep.toLowerCase());
								}
								_context3.next = 40;
								break;

							case 47:
								// Filter in user variables.
								giveup = 0;

							case 48:
								if (!(regexp.indexOf("<get") > -1)) {
									_context3.next = 60;
									break;
								}

								if (!(giveup++ > 50)) {
									_context3.next = 51;
									break;
								}

								return _context3.abrupt("break", 60);

							case 51:
								_match7 = regexp.match(/<get (.+?)>/i);

								if (!_match7) {
									_context3.next = 58;
									break;
								}

								_name3 = _match7[1];
								_context3.next = 56;
								return self.master.getUservar(user, _name3);

							case 56:
								_rep2 = _context3.sent;

								regexp = regexp.replace(new RegExp("<get " + utils.quotemeta(_name3) + ">", "ig"), _rep2.toLowerCase());

							case 58:
								_context3.next = 48;
								break;

							case 60:
								// Filter in input/reply tags.
								giveup = 0;
								regexp = regexp.replace(/<input>/i, "<input1>");
								regexp = regexp.replace(/<reply>/i, "<reply1>");
								_context3.next = 65;
								return self.master._session.get(user, "__history__");

							case 65:
								history = _context3.sent;

								if (history == "undefined") {
									// purposeful typecast
									history = newHistory();
								}

							case 67:
								if (!(regexp.indexOf("<input") > -1 || regexp.indexOf("<reply") > -1)) {
									_context3.next = 74;
									break;
								}

								if (!(giveup++ > 50)) {
									_context3.next = 70;
									break;
								}

								return _context3.abrupt("break", 74);

							case 70:
								ref = ["input", "reply"];

								for (k = 0, len1 = ref.length; k < len1; k++) {
									type = ref[k];

									for (i = 1; i <= 9; i++) {
										if (regexp.indexOf("<" + type + i + ">") > -1) {
											value = self.formatMessage(history[type][i - 1], type === "reply");

											regexp = regexp.replace(new RegExp("<" + type + i + ">", "g"), value);
										}
									}
								}
								_context3.next = 67;
								break;

							case 74:

								// Recover escaped Unicode symbols.
								if (self.utf8 && regexp.indexOf("\\u") > -1) {
									regexp = regexp.replace(/\\u([A-Fa-f0-9]{4})/, function (match, grp) {
										return String.fromCharCode(parseInt(grp, 16));
									});
								}

								// Prevent accidental wildcard match due to double-pipe (e.g. /hi||hello/)
								regexp = regexp.replace(/\|{2,}/mg, '|');
								return _context3.abrupt("return", regexp);

							case 77:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function triggerRegexp(_x9, _x10) {
				return _ref3.apply(this, arguments);
			}

			return triggerRegexp;
		}()

		/**
  string processTags (string user, string msg, string reply, string[] stars,
                      string[] botstars, int step, scope)
  
  Process tags in a reply element.
  */

	}, {
		key: "processTags",
		value: function () {
			var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(user, msg, reply, st, bst, step, scope) {
				var self, stars, botstars, match, giveup, name, result, i, len, _i2, _len3, history, _i3, random, text, output, formats, m, _len4, type, content, replace, parts, tag, data, insert, target, _name4, value, existingValue, _result, _name5, _target, subreply, _parts, _output, obj, args, lang;

				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								self = this;

								// Prepare the stars and botstars.

								stars = [""];

								stars.push.apply(stars, st);
								botstars = [""];

								botstars.push.apply(botstars, bst);
								if (stars.length === 1) {
									stars.push("undefined");
								}
								if (botstars.length === 1) {
									botstars.push("undefined");
								}

								// Turn arrays into randomized sets.
								match = reply.match(/\(@([A-Za-z0-9_]+)\)/i);
								giveup = 0;

							case 9:
								if (!match) {
									_context4.next = 20;
									break;
								}

								if (!(giveup++ > self.master._depth)) {
									_context4.next = 13;
									break;
								}

								self.warn("Infinite loop looking for arrays in reply!");
								return _context4.abrupt("break", 20);

							case 13:
								name = match[1];
								result = void 0;

								if (self.master._array[name]) {
									result = "{random}" + self.master._array[name].join("|") + "{/random}";
								} else {
									// Dummy it out so we can reinsert it later.
									result = "\0@" + name + "\0";
								}

								reply = reply.replace(new RegExp("\\(@" + utils.quotemeta(name) + "\\)", "ig"), result);
								match = reply.match(/\(@([A-Za-z0-9_]+)\)/i);
								_context4.next = 9;
								break;

							case 20:

								// Restore literal arrays that didn't exist.
								reply = reply.replace(/\x00@([A-Za-z0-9_]+)\x00/g, "(@$1)");

								// Tag shortcuts.
								reply = reply.replace(/<person>/ig, "{person}<star>{/person}");
								reply = reply.replace(/<@>/ig, "{@<star>}");
								reply = reply.replace(/<formal>/ig, "{formal}<star>{/formal}");
								reply = reply.replace(/<sentence>/ig, "{sentence}<star>{/sentence}");
								reply = reply.replace(/<uppercase>/ig, "{uppercase}<star>{/uppercase}");
								reply = reply.replace(/<lowercase>/ig, "{lowercase}<star>{/lowercase}");

								// Weight and star tags.
								reply = reply.replace(/\{weight=\d+\}/ig, ""); // Remove {weight}s
								reply = reply.replace(/<star>/ig, stars[1]);
								reply = reply.replace(/<botstar>/ig, botstars[1]);
								for (i = 1, len = stars.length; i <= len; i++) {
									reply = reply.replace(new RegExp("<star" + i + ">", "ig"), stars[i]);
								}
								for (_i2 = 1, _len3 = botstars.length; _i2 <= _len3; _i2++) {
									reply = reply.replace(new RegExp("<botstar" + _i2 + ">", "ig"), botstars[_i2]);
								}

								// <input> and <reply>
								_context4.next = 34;
								return self.master._session.get(user, "__history__");

							case 34:
								history = _context4.sent;

								if (history == "undefined") {
									// purposeful typecast for `undefined` too
									history = newHistory();
								}
								reply = reply.replace(/<input>/ig, history.input ? history.input[0] : "undefined");
								reply = reply.replace(/<reply>/ig, history.reply ? history.reply[0] : "undefined");
								for (_i3 = 1; _i3 <= 9; _i3++) {
									if (reply.indexOf("<input" + _i3 + ">") > -1) {
										reply = reply.replace(new RegExp("<input" + _i3 + ">", "ig"), history.input[_i3 - 1]);
									}
									if (reply.indexOf("<reply" + _i3 + ">") > -1) {
										reply = reply.replace(new RegExp("<reply" + _i3 + ">", "ig"), history.reply[_i3 - 1]);
									}
								}

								// <id> and escape codes
								reply = reply.replace(/<id>/ig, user);
								reply = reply.replace(/\\s/ig, " ");
								reply = reply.replace(/\\n/ig, "\n");
								reply = reply.replace(/\\#/ig, "#");

								// {random}
								match = reply.match(/\{random\}(.+?)\{\/random\}/i);
								giveup = 0;

							case 45:
								if (!match) {
									_context4.next = 57;
									break;
								}

								if (!(giveup++ > self.master._depth)) {
									_context4.next = 49;
									break;
								}

								self.warn("Infinite loop looking for random tag!");
								return _context4.abrupt("break", 57);

							case 49:
								random = [];
								text = match[1];

								if (text.indexOf("|") > -1) {
									random = text.split("|");
								} else {
									random = text.split(" ");
								}

								output = random[parseInt(Math.random() * random.length)];

								reply = reply.replace(new RegExp("\\{random\\}" + utils.quotemeta(text) + "\\{\\/random\\}", "ig"), output);
								match = reply.match(/\{random\}(.+?)\{\/random\}/i);
								_context4.next = 45;
								break;

							case 57:

								// Person substitutions & string formatting
								formats = ["person", "formal", "sentence", "uppercase", "lowercase"];
								m = 0, _len4 = formats.length;

							case 59:
								if (!(m < _len4)) {
									_context4.next = 78;
									break;
								}

								type = formats[m];

								match = reply.match(new RegExp("{" + type + "}(.+?){/" + type + "}", "i"));
								giveup = 0;

							case 63:
								if (!match) {
									_context4.next = 75;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context4.next = 68;
									break;
								}

								self.warn("Infinite loop looking for " + type + " tag!");
								return _context4.abrupt("break", 75);

							case 68:
								content = match[1];
								replace = void 0;

								if (type === "person") {
									replace = self.substitute(content, "person");
								} else {
									replace = utils.stringFormat(type, content);
								}

								reply = reply.replace(new RegExp("{" + type + "}" + utils.quotemeta(content) + ("{/" + type + "}"), "ig"), replace);
								match = reply.match(new RegExp("{" + type + "}(.+?){/" + type + "}", "i"));
								_context4.next = 63;
								break;

							case 75:
								m++;
								_context4.next = 59;
								break;

							case 78:

								// Handle all variable-related tags with an iterative regexp approach, to
								// allow for nesting of tags in arbitrary ways (think <set a=<get b>>)
								// Dummy out the <call> tags first, because we don't handle them right here.
								reply = reply.replace(/<call>/ig, "«__call__»");
								reply = reply.replace(/<\/call>/ig, "«/__call__»");

							case 80:
								if (!true) {
									_context4.next = 136;
									break;
								}

								// This regexp will match a <tag> which contains no other tag inside it,
								// i.e. in the case of <set a=<get b>> it will match <get b> but not the
								// <set> tag, on the first pass. The second pass will get the <set> tag,
								// and so on.
								match = reply.match(/<([^<]+?)>/);

								if (match) {
									_context4.next = 84;
									break;
								}

								return _context4.abrupt("break", 136);

							case 84:

								match = match[1];
								parts = match.split(" ");
								tag = parts[0].toLowerCase();
								data = "";

								if (parts.length > 1) {
									data = parts.slice(1).join(" ");
								}
								insert = "";

								// Handle the tags.

								if (!(tag === "bot" || tag === "env")) {
									_context4.next = 95;
									break;
								}

								// <bot> and <env> tags are similar
								target = tag === "bot" ? self.master._var : self.master._global;

								if (data.indexOf("=") > -1) {
									// Assigning a variable
									parts = data.split("=", 2);
									self.say("Set " + tag + " variable " + parts[0] + " = " + parts[1]);
									target[parts[0]] = parts[1];
								} else {
									// Getting a bot/env variable
									insert = target[data] || "undefined";
								}
								_context4.next = 133;
								break;

							case 95:
								if (!(tag === "set")) {
									_context4.next = 102;
									break;
								}

								// <set> user vars
								parts = data.split("=", 2);
								self.say("Set uservar " + parts[0] + " = " + parts[1]);
								_context4.next = 100;
								return self.master.setUservar(user, parts[0], parts[1]);

							case 100:
								_context4.next = 133;
								break;

							case 102:
								if (!(tag === "add" || tag === "sub" || tag === "mult" || tag === "div")) {
									_context4.next = 126;
									break;
								}

								// Math operator tags
								parts = data.split("=");
								_name4 = parts[0];
								value = parts[1];

								// Initialize the variable?

								_context4.next = 108;
								return self.master.getUservar(user, _name4);

							case 108:
								existingValue = _context4.sent;

								if (existingValue === "undefined") {
									existingValue = 0;
								}

								// Sanity check
								value = parseInt(value);

								if (!isNaN(value)) {
									_context4.next = 115;
									break;
								}

								insert = "[ERR: Math can't '" + tag + "' non-numeric value '" + value + "']";
								_context4.next = 124;
								break;

							case 115:
								if (!isNaN(parseInt(existingValue))) {
									_context4.next = 119;
									break;
								}

								insert = "[ERR: Math can't '" + tag + "' non-numeric user variable '" + _name4 + "']";
								_context4.next = 124;
								break;

							case 119:
								_result = parseInt(existingValue);

								if (tag === "add") {
									_result += value;
								} else if (tag === "sub") {
									_result -= value;
								} else if (tag === "mult") {
									_result *= value;
								} else if (tag === "div") {
									if (value === 0) {
										insert = "[ERR: Can't Divide By Zero]";
									} else {
										_result /= value;
									}
								}

								// No errors?

								if (!(insert === "")) {
									_context4.next = 124;
									break;
								}

								_context4.next = 124;
								return self.master.setUservar(user, _name4, _result);

							case 124:
								_context4.next = 133;
								break;

							case 126:
								if (!(tag === "get")) {
									_context4.next = 132;
									break;
								}

								_context4.next = 129;
								return self.master.getUservar(user, data);

							case 129:
								insert = _context4.sent;
								_context4.next = 133;
								break;

							case 132:
								// Unrecognized tag, preserve it
								insert = "\0" + match + "\x01";

							case 133:
								reply = reply.replace(new RegExp("<" + utils.quotemeta(match) + ">"), insert);
								_context4.next = 80;
								break;

							case 136:

								// Recover mangled HTML-like tags
								reply = reply.replace(/\x00/g, "<");
								reply = reply.replace(/\x01/g, ">");

								// Topic setter
								match = reply.match(/\{topic=(.+?)\}/i);
								giveup = 0;

							case 140:
								if (!match) {
									_context4.next = 152;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context4.next = 145;
									break;
								}

								self.warn("Infinite loop looking for topic tag!");
								return _context4.abrupt("break", 152);

							case 145:
								_name5 = match[1];
								_context4.next = 148;
								return self.master.setUservar(user, "topic", _name5);

							case 148:
								reply = reply.replace(new RegExp("{topic=" + utils.quotemeta(_name5) + "}", "ig"), "");
								match = reply.match(/\{topic=(.+?)\}/i); // Look for more
								_context4.next = 140;
								break;

							case 152:

								// Inline redirector
								match = reply.match(/\{@([^\}]*?)\}/);
								giveup = 0;

							case 154:
								if (!match) {
									_context4.next = 168;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context4.next = 159;
									break;
								}

								self.warn("Infinite loop looking for redirect tag!");
								return _context4.abrupt("break", 168);

							case 159:
								_target = utils.strip(match[1]);

								self.say("Inline redirection to: " + _target);

								_context4.next = 163;
								return self._getReply(user, _target, "normal", step + 1, scope);

							case 163:
								subreply = _context4.sent;

								reply = reply.replace(new RegExp("\\{@" + utils.quotemeta(match[1]) + "\\}", "i"), subreply);
								match = reply.match(/\{@([^\}]*?)\}/);
								_context4.next = 154;
								break;

							case 168:

								// Object caller
								reply = reply.replace(/«__call__»/g, "<call>");
								reply = reply.replace(/«\/__call__»/g, "</call>");
								match = reply.match(/<call>([\s\S]+?)<\/call>/);
								giveup = 0;

							case 172:
								if (!match) {
									_context4.next = 202;
									break;
								}

								giveup++;

								if (!(giveup >= 50)) {
									_context4.next = 177;
									break;
								}

								self.warn("Infinite loop looking for call tags!");
								return _context4.abrupt("break", 202);

							case 177:
								_parts = utils.trim(match[1]).split(" ");
								_output = self.master.errors.objectNotFound;
								obj = _parts[0];

								// Make the args shell-like.

								args = [];

								if (_parts.length > 1) {
									args = utils.parseCallArgs(_parts.slice(1).join(" "));
								}

								// Do we know self object?

								if (!(obj in self.master._objlangs)) {
									_context4.next = 198;
									break;
								}

								// We do, but do we have a handler for that language?
								lang = self.master._objlangs[obj];

								if (!(lang in self.master._handlers)) {
									_context4.next = 197;
									break;
								}

								_context4.prev = 185;
								_context4.next = 188;
								return self.master._handlers[lang].call(self.master, obj, args, scope);

							case 188:
								_output = _context4.sent;
								_context4.next = 195;
								break;

							case 191:
								_context4.prev = 191;
								_context4.t0 = _context4["catch"](185);

								if (_context4.t0 != undefined) {
									self.warn(_context4.t0);
								}
								_output = "[ERR: Error raised by object macro]";

							case 195:
								_context4.next = 198;
								break;

							case 197:
								_output = "[ERR: No Object Handler]";

							case 198:
								reply = reply.replace(match[0], _output);
								match = reply.match(/<call>(.+?)<\/call>/);
								_context4.next = 172;
								break;

							case 202:
								return _context4.abrupt("return", reply);

							case 203:
							case "end":
								return _context4.stop();
						}
					}
				}, _callee4, this, [[185, 191]]);
			}));

			function processTags(_x11, _x12, _x13, _x14, _x15, _x16, _x17) {
				return _ref4.apply(this, arguments);
			}

			return processTags;
		}()

		/**
  string substitute (string msg, string type)
  
  Run substitutions against a message. `type` is either "sub" or "person" for
  the type of substitution to run.
  */

	}, {
		key: "substitute",
		value: function substitute(msg, type) {
			var self = this;

			// Safety checking.
			if (!self.master._sorted[type]) {
				self.master.warn("You forgot to call sortReplies()!");
				return "";
			}

			// Get the substitutions map.
			var subs = type === "sub" ? self.master._sub : self.master._person;

			// Get the max number of words in sub/person to minimize interations
			var maxwords = type === "sub" ? self.master._submax : self.master._personmax;
			var result = "";

			// Take the original message with no punctuation
			var pattern;
			if (self.master.unicodePunctuation != null) {
				pattern = msg.replace(self.master.unicodePunctuation, "");
			} else {
				pattern = msg.replace(/[.,!?;:]/g, "");
			}

			var tries = 0;
			var giveup = 0;
			var subgiveup = 0;

			// Look for words/phrases until there is no "spaces" in pattern
			while (pattern.indexOf(" ") > -1) {
				giveup++;
				// Give up if there are too many substitutions (for safety)
				if (giveup >= 1000) {
					self.warn("Too many loops when handling substitutions!");
					break;
				}

				var li = utils.nIndexOf(pattern, " ", maxwords);
				var subpattern = pattern.substring(0, li);

				// If finds the pattern in sub object replace and stop to look
				result = subs[subpattern];
				if (result !== undefined) {
					msg = msg.replace(subpattern, result);
				} else {
					// Otherwise Look for substitutions in a subpattern
					while (subpattern.indexOf(" ") > -1) {
						subgiveup++;

						// Give up if there are too many substitutions (for safety)
						if (subgiveup >= 1000) {
							self.warn("Too many loops when handling substitutions!");
							break;
						}

						li = subpattern.lastIndexOf(" ");
						subpattern = subpattern.substring(0, li);

						// If finds the subpattern in sub object replace and stop to look
						result = subs[subpattern];
						if (result !== undefined) {
							msg = msg.replace(subpattern, result);
							break;
						}

						tries++;
					}
				}

				var fi = pattern.indexOf(" ");
				pattern = pattern.substring(fi + 1);
				tries++;
			}

			// After all loops, see if just one word is in the pattern
			result = subs[pattern];
			if (result !== undefined) {
				msg = msg.replace(pattern, result);
			}

			return msg;
		}
	}]);

	return Brain;
}();

;

function newHistory() {
	return {
		input: ["undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined"],
		reply: ["undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined", "undefined"]
	};
}

module.exports = Brain;