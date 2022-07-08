/*! jQuery Mustache - v0.2.8 - 2013-06-23
 * https://github.com/jonnyreeves/jquery-Mustache
 * Copyright (c) 2013 Jonny Reeves; Licensed MIT */

/*global jQuery, window */
(function ($, window) {
	'use strict';

	var templateMap = {},
		instance = null,
		options = {
			// Should an error be thrown if an attempt is made to render a non-existent template.  If false, the
			// operation will fail silently.
			warnOnMissingTemplates: false,

			// Should an error be thrown if an attempt is made to overwrite a template which has already been added.
			// If true the original template will be overwritten with the new value.
			allowOverwrite: true,

			// The 'type' attribute which you use to denoate a Mustache Template in the DOM; eg:
			// `<script type="text/html" id="my-template"></script>`
			domTemplateType: 'text/html',

			// Specifies the `dataType` attribute used when external templates are loaded.
			externalTemplateDataType: 'text',
		};

	function getMustache() {
		// Lazily retrieve Mustache from the window global if it hasn't been defined by
		// the User.
		if (instance === null) {
			instance = window.Mustache;
			if (instance === void 0) {
				$.error(
					'Failed to locate Mustache instance, are you sure it has been loaded?',
				);
			}
		}
		return instance;
	}

	/**
	 * @return {boolean} if the supplied templateName has been added.
	 */
	function has(templateName) {
		return templateMap[templateName] !== void 0;
	}

	/**
	 * Registers a template so that it can be used by $.Mustache.
	 *
	 * @param templateName		A name which uniquely identifies this template.
	 * @param templateHtml		The HTML which makes us the template; this will be rendered by Mustache when render()
	 *							is invoked.
	 * @throws					If options.allowOverwrite is false and the templateName has already been registered.
	 */
	function add(templateName, templateHtml) {
		if (!options.allowOverwrite && has(templateName)) {
			$.error('TemplateName: ' + templateName + ' is already mapped.');
			return;
		}
		templateMap[templateName] = $.trim(templateHtml);
	}

	/**
	 * Adds one or more tempaltes from the DOM using either the supplied templateElementIds or by retrieving all script
	 * tags of the 'domTemplateType'.  Templates added in this fashion will be registered with their elementId value.
	 *
	 * @param [...templateElementIds]	List of element id's present on the DOM which contain templates to be added;
	 *									if none are supplied all script tags that are of the same type as the
	 *									`options.domTemplateType` configuration value will be added.
	 */
	function addFromDom() {
		var templateElementIds;

		// If no args are supplied, all script blocks will be read from the document.
		if (arguments.length === 0) {
			templateElementIds = $(
				'script[type="' + options.domTemplateType + '"]',
			).map(function () {
				return this.id;
			});
		} else {
			templateElementIds = $.makeArray(arguments);
		}

		$.each(templateElementIds, function () {
			var templateElement = document.getElementById(this);

			if (templateElement === null) {
				$.error('No such elementId: #' + this);
			} else {
				add(this, $(templateElement).html());
			}
		});
	}

	/**
	 * Removes a template, the contents of the removed Template will be returned.
	 *
	 * @param templateName		The name of the previously registered Mustache template that you wish to remove.
	 * @returns					String which represents the raw content of the template.
	 */
	function remove(templateName) {
		var result = templateMap[templateName];
		delete templateMap[templateName];
		return result;
	}

	/**
	 * Removes all templates and tells Mustache to flush its cache.
	 */
	function clear() {
		templateMap = {};
		getMustache().clearCache();
	}

	/**
	 * Renders a previously added Mustache template using the supplied templateData object.  Note if the supplied
	 * templateName doesn't exist an empty String will be returned.
	 */
	function render(templateName, templateData) {
		if (!has(templateName)) {
			if (options.warnOnMissingTemplates) {
				$.error('No template registered for: ' + templateName);
			}
			return '';
		}
		return getMustache().to_html(
			templateMap[templateName],
			templateData,
			templateMap,
		);
	}

	/**
	 * Loads the external Mustache templates located at the supplied URL and registers them for later use.  This method
	 * returns a jQuery Promise and also support an `onComplete` callback.
	 *
	 * @param url			URL of the external Mustache template file to load.
	 * @param onComplete	Optional callback function which will be invoked when the templates from the supplied URL
	 *						have been loaded and are ready for use.
	 * @returns				jQuery deferred promise which will complete when the templates have been loaded and are
	 *						ready for use.
	 */
	function load(url, onComplete) {
		return $.ajax({
			url: url,
			dataType: options.externalTemplateDataType,
		}).done(function (templates) {
			$(templates)
				.filter('script')
				.each(function (i, el) {
					add(el.id, $(el).html());
				});

			if ($.isFunction(onComplete)) {
				onComplete();
			}
		});
	}

	/**
	 * Returns an Array of templateNames which have been registered and can be retrieved via
	 * $.Mustache.render() or $(element).mustache().
	 */
	function templates() {
		return $.map(templateMap, function (value, key) {
			return key;
		});
	}

	// Expose the public methods on jQuery.Mustache
	$.Mustache = {
		options: options,
		load: load,
		has: has,
		add: add,
		addFromDom: addFromDom,
		remove: remove,
		clear: clear,
		render: render,
		templates: templates,
		instance: instance,
	};

	/**
	 * Renders one or more viewModels into the current jQuery element.
	 *
	 * @param templateName	The name of the Mustache template you wish to render, Note that the
	 *						template must have been previously loaded and / or added.
	 * @param templateData	One or more JavaScript objects which will be used to render the Mustache
	 *						template.
	 * @param options.method	jQuery method to use when rendering, defaults to 'append'.
	 */
	$.fn.mustache = function (templateName, templateData, options) {
		var settings = $.extend(
			{
				method: 'append',
			},
			options,
		);

		var renderTemplate = function (obj, viewModel) {
			$(obj)[settings.method](render(templateName, viewModel));
		};

		return this.each(function () {
			var element = this;

			// Render a collection of viewModels.
			if ($.isArray(templateData)) {
				$.each(templateData, function () {
					renderTemplate(element, this);
				});
			}

			// Render a single viewModel.
			else {
				renderTemplate(element, templateData);
			}
		});
	};
})(window.jQuery || window.Zepto, window);

(function defineMustache(global, factory) { if (typeof exports === "object" && exports && typeof exports.nodeName !== "string") { factory(exports) } else if (typeof define === "function" && define.amd) { define(["exports"], factory) } else { global.Mustache = {}; factory(global.Mustache) } })(this, function mustacheFactory(mustache) { var objectToString = Object.prototype.toString; var isArray = Array.isArray || function isArrayPolyfill(object) { return objectToString.call(object) === "[object Array]" }; function isFunction(object) { return typeof object === "function" } function typeStr(obj) { return isArray(obj) ? "array" : typeof obj } function escapeRegExp(string) { return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&") } function hasProperty(obj, propName) { return obj != null && typeof obj === "object" && propName in obj } function primitiveHasOwnProperty(primitive, propName) { return primitive != null && typeof primitive !== "object" && primitive.hasOwnProperty && primitive.hasOwnProperty(propName) } var regExpTest = RegExp.prototype.test; function testRegExp(re, string) { return regExpTest.call(re, string) } var nonSpaceRe = /\S/; function isWhitespace(string) { return !testRegExp(nonSpaceRe, string) } var entityMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#x2F;", "`": "&#x60;", "=": "&#x3D;" }; function escapeHtml(string) { return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) { return entityMap[s] }) } var whiteRe = /\s*/; var spaceRe = /\s+/; var equalsRe = /\s*=/; var curlyRe = /\s*\}/; var tagRe = /#|\^|\/|>|\{|&|=|!/; function parseTemplate(template, tags) { if (!template) return []; var sections = []; var tokens = []; var spaces = []; var hasTag = false; var nonSpace = false; function stripSpace() { if (hasTag && !nonSpace) { while (spaces.length) delete tokens[spaces.pop()] } else { spaces = [] } hasTag = false; nonSpace = false } var openingTagRe, closingTagRe, closingCurlyRe; function compileTags(tagsToCompile) { if (typeof tagsToCompile === "string") tagsToCompile = tagsToCompile.split(spaceRe, 2); if (!isArray(tagsToCompile) || tagsToCompile.length !== 2) throw new Error("Invalid tags: " + tagsToCompile); openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + "\\s*"); closingTagRe = new RegExp("\\s*" + escapeRegExp(tagsToCompile[1])); closingCurlyRe = new RegExp("\\s*" + escapeRegExp("}" + tagsToCompile[1])) } compileTags(tags || mustache.tags); var scanner = new Scanner(template); var start, type, value, chr, token, openSection; while (!scanner.eos()) { start = scanner.pos; value = scanner.scanUntil(openingTagRe); if (value) { for (var i = 0, valueLength = value.length; i < valueLength; ++i) { chr = value.charAt(i); if (isWhitespace(chr)) { spaces.push(tokens.length) } else { nonSpace = true } tokens.push(["text", chr, start, start + 1]); start += 1; if (chr === "\n") stripSpace() } } if (!scanner.scan(openingTagRe)) break; hasTag = true; type = scanner.scan(tagRe) || "name"; scanner.scan(whiteRe); if (type === "=") { value = scanner.scanUntil(equalsRe); scanner.scan(equalsRe); scanner.scanUntil(closingTagRe) } else if (type === "{") { value = scanner.scanUntil(closingCurlyRe); scanner.scan(curlyRe); scanner.scanUntil(closingTagRe); type = "&" } else { value = scanner.scanUntil(closingTagRe) } if (!scanner.scan(closingTagRe)) throw new Error("Unclosed tag at " + scanner.pos); token = [type, value, start, scanner.pos]; tokens.push(token); if (type === "#" || type === "^") { sections.push(token) } else if (type === "/") { openSection = sections.pop(); if (!openSection) throw new Error('Unopened section "' + value + '" at ' + start); if (openSection[1] !== value) throw new Error('Unclosed section "' + openSection[1] + '" at ' + start) } else if (type === "name" || type === "{" || type === "&") { nonSpace = true } else if (type === "=") { compileTags(value) } } openSection = sections.pop(); if (openSection) throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos); return nestTokens(squashTokens(tokens)) } function squashTokens(tokens) { var squashedTokens = []; var token, lastToken; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { token = tokens[i]; if (token) { if (token[0] === "text" && lastToken && lastToken[0] === "text") { lastToken[1] += token[1]; lastToken[3] = token[3] } else { squashedTokens.push(token); lastToken = token } } } return squashedTokens } function nestTokens(tokens) { var nestedTokens = []; var collector = nestedTokens; var sections = []; var token, section; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { token = tokens[i]; switch (token[0]) { case "#": case "^": collector.push(token); sections.push(token); collector = token[4] = []; break; case "/": section = sections.pop(); section[5] = token[2]; collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens; break; default: collector.push(token) } } return nestedTokens } function Scanner(string) { this.string = string; this.tail = string; this.pos = 0 } Scanner.prototype.eos = function eos() { return this.tail === "" }; Scanner.prototype.scan = function scan(re) { var match = this.tail.match(re); if (!match || match.index !== 0) return ""; var string = match[0]; this.tail = this.tail.substring(string.length); this.pos += string.length; return string }; Scanner.prototype.scanUntil = function scanUntil(re) { var index = this.tail.search(re), match; switch (index) { case -1: match = this.tail; this.tail = ""; break; case 0: match = ""; break; default: match = this.tail.substring(0, index); this.tail = this.tail.substring(index) }this.pos += match.length; return match }; function Context(view, parentContext) { this.view = view; this.cache = { ".": this.view }; this.parent = parentContext } Context.prototype.push = function push(view) { return new Context(view, this) }; Context.prototype.lookup = function lookup(name) { var cache = this.cache; var value; if (cache.hasOwnProperty(name)) { value = cache[name] } else { var context = this, intermediateValue, names, index, lookupHit = false; while (context) { if (name.indexOf(".") > 0) { intermediateValue = context.view; names = name.split("."); index = 0; while (intermediateValue != null && index < names.length) { if (index === names.length - 1) lookupHit = hasProperty(intermediateValue, names[index]) || primitiveHasOwnProperty(intermediateValue, names[index]); intermediateValue = intermediateValue[names[index++]] } } else { intermediateValue = context.view[name]; lookupHit = hasProperty(context.view, name) } if (lookupHit) { value = intermediateValue; break } context = context.parent } cache[name] = value } if (isFunction(value)) value = value.call(this.view); return value }; function Writer() { this.cache = {} } Writer.prototype.clearCache = function clearCache() { this.cache = {} }; Writer.prototype.parse = function parse(template, tags) { var cache = this.cache; var cacheKey = template + ":" + (tags || mustache.tags).join(":"); var tokens = cache[cacheKey]; if (tokens == null) tokens = cache[cacheKey] = parseTemplate(template, tags); return tokens }; Writer.prototype.render = function render(template, view, partials, tags) { var tokens = this.parse(template, tags); var context = view instanceof Context ? view : new Context(view); return this.renderTokens(tokens, context, partials, template, tags) }; Writer.prototype.renderTokens = function renderTokens(tokens, context, partials, originalTemplate, tags) { var buffer = ""; var token, symbol, value; for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) { value = undefined; token = tokens[i]; symbol = token[0]; if (symbol === "#") value = this.renderSection(token, context, partials, originalTemplate); else if (symbol === "^") value = this.renderInverted(token, context, partials, originalTemplate); else if (symbol === ">") value = this.renderPartial(token, context, partials, tags); else if (symbol === "&") value = this.unescapedValue(token, context); else if (symbol === "name") value = this.escapedValue(token, context); else if (symbol === "text") value = this.rawValue(token); if (value !== undefined) buffer += value } return buffer }; Writer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate) { var self = this; var buffer = ""; var value = context.lookup(token[1]); function subRender(template) { return self.render(template, context, partials) } if (!value) return; if (isArray(value)) { for (var j = 0, valueLength = value.length; j < valueLength; ++j) { buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate) } } else if (typeof value === "object" || typeof value === "string" || typeof value === "number") { buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate) } else if (isFunction(value)) { if (typeof originalTemplate !== "string") throw new Error("Cannot use higher-order sections without the original template"); value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender); if (value != null) buffer += value } else { buffer += this.renderTokens(token[4], context, partials, originalTemplate) } return buffer }; Writer.prototype.renderInverted = function renderInverted(token, context, partials, originalTemplate) { var value = context.lookup(token[1]); if (!value || isArray(value) && value.length === 0) return this.renderTokens(token[4], context, partials, originalTemplate) }; Writer.prototype.renderPartial = function renderPartial(token, context, partials, tags) { if (!partials) return; var value = isFunction(partials) ? partials(token[1]) : partials[token[1]]; if (value != null) return this.renderTokens(this.parse(value, tags), context, partials, value) }; Writer.prototype.unescapedValue = function unescapedValue(token, context) { var value = context.lookup(token[1]); if (value != null) return value }; Writer.prototype.escapedValue = function escapedValue(token, context) { var value = context.lookup(token[1]); if (value != null) return mustache.escape(value) }; Writer.prototype.rawValue = function rawValue(token) { return token[1] }; mustache.name = "mustache.js"; mustache.version = "3.0.1"; mustache.tags = ["{{", "}}"]; var defaultWriter = new Writer; mustache.clearCache = function clearCache() { return defaultWriter.clearCache() }; mustache.parse = function parse(template, tags) { return defaultWriter.parse(template, tags) }; mustache.render = function render(template, view, partials, tags) { if (typeof template !== "string") { throw new TypeError('Invalid template! Template should be a "string" ' + 'but "' + typeStr(template) + '" was given as the first ' + "argument for mustache#render(template, view, partials)") } return defaultWriter.render(template, view, partials, tags) }; mustache.to_html = function to_html(template, view, partials, send) { var result = mustache.render(template, view, partials); if (isFunction(send)) { send(result) } else { return result } }; mustache.escape = escapeHtml; mustache.Scanner = Scanner; mustache.Context = Context; mustache.Writer = Writer; return mustache });
var _createClass = (function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ('value' in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}
	return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
})();

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError('Cannot call a class as a function');
	}
}

// Generated by CoffeeScript 2.1.0
(function () {
	/*
  jQuery Growl
  Copyright 2015 Kevin Sylvestre
  1.3.5
  */
	'use strict';

	var $, Animation, Growl;

	$ = jQuery;

	Animation = (function () {
		var Animation = (function () {
			function Animation() {
				_classCallCheck(this, Animation);
			}

			_createClass(Animation, null, [
				{
					key: 'transition',
					value: function transition($el) {
						var el, ref, result, type;
						el = $el[0];
						ref = this.transitions;
						for (type in ref) {
							result = ref[type];
							if (el.style[type] != null) {
								return result;
							}
						}
					},
				},
			]);

			return Animation;
		})();

		Animation.transitions = {
			webkitTransition: 'webkitTransitionEnd',
			mozTransition: 'mozTransitionEnd',
			oTransition: 'oTransitionEnd',
			transition: 'transitionend',
		};

		return Animation;
	})();

	Growl = (function () {
		var Growl = (function () {
			_createClass(Growl, null, [
				{
					key: 'growl',
					value: function growl() {
						var settings =
							arguments.length > 0 && arguments[0] !== undefined
								? arguments[0]
								: {};

						return new Growl(settings);
					},
				},
			]);

			function Growl() {
				var settings =
					arguments.length > 0 && arguments[0] !== undefined
						? arguments[0]
						: {};

				_classCallCheck(this, Growl);

				this.render = this.render.bind(this);
				this.bind = this.bind.bind(this);
				this.unbind = this.unbind.bind(this);
				this.mouseEnter = this.mouseEnter.bind(this);
				this.mouseLeave = this.mouseLeave.bind(this);
				this.click = this.click.bind(this);
				this.close = this.close.bind(this);
				this.cycle = this.cycle.bind(this);
				this.waitAndDismiss = this.waitAndDismiss.bind(this);
				this.present = this.present.bind(this);
				this.dismiss = this.dismiss.bind(this);
				this.remove = this.remove.bind(this);
				this.animate = this.animate.bind(this);
				this.$growls = this.$growls.bind(this);
				this.$growl = this.$growl.bind(this);
				this.html = this.html.bind(this);
				this.content = this.content.bind(this);
				this.container = this.container.bind(this);
				this.settings = $.extend({}, Growl.settings, settings);
				this.initialize(this.settings.location);
				this.render();
			}

			_createClass(Growl, [
				{
					key: 'initialize',
					value: function initialize(location) {
						var id;
						id = 'growls-' + location;
						return $('body:not(:has(#' + id + '))').append(
							'<div id="' + id + '" />',
						);
					},
				},
				{
					key: 'render',
					value: function render() {
						var $growl;
						$growl = this.$growl();
						this.$growls(this.settings.location).append($growl);
						if (this.settings.fixed) {
							this.present();
						} else {
							this.cycle();
						}
					},
				},
				{
					key: 'bind',
					value: function bind() {
						var $growl =
							arguments.length > 0 && arguments[0] !== undefined
								? arguments[0]
								: this.$growl();

						$growl.on('click', this.click);
						if (this.settings.delayOnHover) {
							$growl.on('mouseenter', this.mouseEnter);
							$growl.on('mouseleave', this.mouseLeave);
						}
						return $growl
							.on('contextmenu', this.close)
							.find('.' + this.settings.namespace + '-close')
							.on('click', this.close);
					},
				},
				{
					key: 'unbind',
					value: function unbind() {
						var $growl =
							arguments.length > 0 && arguments[0] !== undefined
								? arguments[0]
								: this.$growl();

						$growl.off('click', this.click);
						if (this.settings.delayOnHover) {
							$growl.off('mouseenter', this.mouseEnter);
							$growl.off('mouseleave', this.mouseLeave);
						}
						return $growl
							.off('contextmenu', this.close)
							.find('.' + this.settings.namespace + '-close')
							.off('click', this.close);
					},
				},
				{
					key: 'mouseEnter',
					value: function mouseEnter(event) {
						var $growl;
						$growl = this.$growl();
						return $growl.stop(true, true);
					},
				},
				{
					key: 'mouseLeave',
					value: function mouseLeave(event) {
						return this.waitAndDismiss();
					},
				},
				{
					key: 'click',
					value: function click(event) {
						if (this.settings.url != null) {
							event.preventDefault();
							event.stopPropagation();
							return window.open(this.settings.url);
						}
					},
				},
				{
					key: 'close',
					value: function close(event) {
						var $growl;
						event.preventDefault();
						event.stopPropagation();
						$growl = this.$growl();
						return $growl.stop().queue(this.dismiss).queue(this.remove);
					},
				},
				{
					key: 'cycle',
					value: function cycle() {
						var $growl;
						$growl = this.$growl();
						return $growl.queue(this.present).queue(this.waitAndDismiss());
					},
				},
				{
					key: 'waitAndDismiss',
					value: function waitAndDismiss() {
						var $growl;
						$growl = this.$growl();
						return $growl
							.delay(this.settings.duration)
							.queue(this.dismiss)
							.queue(this.remove);
					},
				},
				{
					key: 'present',
					value: function present(callback) {
						var $growl;
						$growl = this.$growl();
						this.bind($growl);
						return this.animate(
							$growl,
							this.settings.namespace + '-incoming',
							'out',
							callback,
						);
					},
				},
				{
					key: 'dismiss',
					value: function dismiss(callback) {
						var $growl;
						$growl = this.$growl();
						this.unbind($growl);
						return this.animate(
							$growl,
							this.settings.namespace + '-outgoing',
							'in',
							callback,
						);
					},
				},
				{
					key: 'remove',
					value: function remove(callback) {
						this.$growl().remove();
						return typeof callback === 'function' ? callback() : void 0;
					},
				},
				{
					key: 'animate',
					value: function animate($element, name) {
						var direction =
							arguments.length > 2 && arguments[2] !== undefined
								? arguments[2]
								: 'in';
						var callback = arguments[3];

						var transition;
						transition = Animation.transition($element);
						$element[direction === 'in' ? 'removeClass' : 'addClass'](name);
						$element.offset().position;
						$element[direction === 'in' ? 'addClass' : 'removeClass'](name);
						if (callback == null) {
							return;
						}
						if (transition != null) {
							$element.one(transition, callback);
						} else {
							callback();
						}
					},
				},
				{
					key: '$growls',
					value: function $growls(location) {
						var base;
						if (this.$_growls == null) {
							this.$_growls = [];
						}
						return (base = this.$_growls)[location] != null
							? base[location]
							: (base[location] = $('#growls-' + location));
					},
				},
				{
					key: '$growl',
					value: function $growl() {
						return this.$_growl != null
							? this.$_growl
							: (this.$_growl = $(this.html()));
					},
				},
				{
					key: 'html',
					value: function html() {
						return this.container(this.content());
					},
				},
				{
					key: 'content',
					value: function content() {
						return (
							"<div class='" +
							this.settings.namespace +
							"-close'>" +
							this.settings.close +
							"</div>\n<div class='" +
							this.settings.namespace +
							"-title'>" +
							this.settings.title +
							"</div>\n<div class='" +
							this.settings.namespace +
							"-message'>" +
							this.settings.message +
							'</div>'
						);
					},
				},
				{
					key: 'container',
					value: function container(content) {
						return (
							"<div class='" +
							this.settings.namespace +
							' ' +
							this.settings.namespace +
							'-' +
							this.settings.style +
							' ' +
							this.settings.namespace +
							'-' +
							this.settings.size +
							"'>\n  " +
							content +
							'\n</div>'
						);
					},
				},
			]);

			return Growl;
		})();

		Growl.settings = {
			namespace: 'growl',
			duration: 3200,
			close: '&#215;',
			location: 'default',
			style: 'default',
			size: 'medium',
			delayOnHover: true,
		};

		return Growl;
	})();

	this.Growl = Growl;

	$.growl = function () {
		var options =
			arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		return Growl.growl(options);
	};

	$.growl.error = function () {
		var options =
			arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		var settings;
		settings = {
			title: 'Error!',
			style: 'error',
		};
		return $.growl($.extend(settings, options));
	};

	$.growl.notice = function () {
		var options =
			arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		var settings;
		settings = {
			title: 'Notice!',
			style: 'notice',
		};
		return $.growl($.extend(settings, options));
	};

	$.growl.warning = function () {
		var options =
			arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		var settings;
		settings = {
			title: 'Warning!',
			style: 'warning',
		};
		return $.growl($.extend(settings, options));
	};
}.call(this));

(function(){function l(){function n(a){return a?"object"===typeof a||"function"===typeof a:!1}var p=null;var g=function(a,b){function f(){}if(!n(a)||!n(b))throw new TypeError("Cannot create proxy with a non-object as target or handler");p=function(){f=function(a){throw new TypeError("Cannot perform '"+a+"' on a proxy that has been revoked");}};var e=b;b={get:null,set:null,apply:null,construct:null};for(var k in e){if(!(k in b))throw new TypeError("Proxy polyfill does not support trap '"+k+"'");b[k]=e[k]}"function"===
typeof e&&(b.apply=e.apply.bind(e));var c=this,g=!1,q=!1;"function"===typeof a?(c=function(){var h=this&&this.constructor===c,d=Array.prototype.slice.call(arguments);f(h?"construct":"apply");return h&&b.construct?b.construct.call(this,a,d):!h&&b.apply?b.apply(a,this,d):h?(d.unshift(a),new (a.bind.apply(a,d))):a.apply(this,d)},g=!0):a instanceof Array&&(c=[],q=!0);var r=b.get?function(a){f("get");return b.get(this,a,c)}:function(a){f("get");return this[a]},v=b.set?function(a,d){f("set");b.set(this,
a,d,c)}:function(a,b){f("set");this[a]=b},t={};Object.getOwnPropertyNames(a).forEach(function(b){if(!((g||q)&&b in c)){var d={enumerable:!!Object.getOwnPropertyDescriptor(a,b).enumerable,get:r.bind(a,b),set:v.bind(a,b)};Object.defineProperty(c,b,d);t[b]=!0}});e=!0;Object.setPrototypeOf?Object.setPrototypeOf(c,Object.getPrototypeOf(a)):c.__proto__?c.__proto__=a.__proto__:e=!1;if(b.get||!e)for(var m in a)t[m]||Object.defineProperty(c,m,{get:r.bind(a,m)});Object.seal(a);Object.seal(c);return c};g.revocable=
function(a,b){return{proxy:new g(a,b),revoke:p}};return g};var u="undefined"!==typeof process&&"[object process]"==={}.toString.call(process)||"undefined"!==typeof navigator&&"ReactNative"===navigator.product?global:self;u.Proxy||(u.Proxy=l(),u.Proxy.revocable=u.Proxy.revocable);})()

!function(f){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=f();else if("function"==typeof define&&define.amd)define([],f);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).ispapiIdnconverter=f()}}(function(){return function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){return o(e[i][1][r]||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}({1:[function(require,module,exports){var root,factory;root=this,factory=function(){var blocks=[new Uint32Array([2163458,2159810,2163522,2131362,2163586,2160194,2163842,2132226,2163906,2132898,2163970,2161474,2138658,2097666,2136162,2163714]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064,14680064,14680064,14680064]),new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672,23068672,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0]),new Uint32Array([14680064,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064]),new Uint32Array([2178913,6291456,2178945,6291456,2178977,6291456,2179009,6291456,2179041,6291456,2179073,6291456,2179105,6291456,2179137,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,6291456,0,0,0,0,0]),new Uint32Array([2185793,6291456,2185825,6291456,2185857,6291456,2185889,6291456,2185921,6291456,2185953,6291456,2185985,6291456,2186017,6291456]),new Uint32Array([0,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,0,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2125346,2153474,2153538,2127394,2153602,2153666,2153730,2153794,2105507,2105476,2153858,2153922,2153986,2154050,2154114,2105794]),new Uint32Array([2199265,2114113,2114209,2199297,2199329,2114305,2199361,2114401,2114497,2199393,2114593,2114689,2114785,2114881,2114977,0]),new Uint32Array([2205345,6291456,2205377,6291456,2205409,6291456,2205441,6291456,2205473,6291456,2173249,2182561,2182817,2205505,2182881,6291456]),new Uint32Array([2134435,2134531,2134627,2134723,2134723,2134819,2134819,2134915,2134915,2135011,2105987,2135107,2135203,2135299,2131587,2135395]),new Uint32Array([2147906,2147970,2148034,2148098,2148162,2148226,2148290,2148354,2147906,2147970,2148034,2148098,2148162,2148226,2148290,2148354]),new Uint32Array([2219905,2216545,2209729,2219937,2219969,2194561,2211905,2214529,2220001,2220033,2217889,2220065,2217921,2220097,2220129,2220161]),new Uint32Array([2222689,2222689,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2220897,2218721,2220929,2220961,2220993,2221025,2221057,2218785,2216801,2221089,2218817,2221121,2218849,2221153,2198721,2221186]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,6291456]),new Uint32Array([6291456,2171009,2171041,2171073,6291456,2171105,6291456,2171137,2171169,6291456,6291456,6291456,2171201,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,23068672,6291456,2145538,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,6291456]),new Uint32Array([2228162,2228226,2228290,2228354,2228418,2228482,2228546,2228610,2228674,2228738,2228802,2228866,2228930,2228994,2229058,2229122]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,23068672,23068672,6291456]),new Uint32Array([2119939,2124930,2125026,2106658,2125218,2128962,2129058,2129154,2129250,2129346,2129442,2108866,2108770,2150466,2150530,2150594]),new Uint32Array([2189761,2189793,2189825,2189857,2189889,2189921,2189953,2189985,2190017,2190049,2190081,2190113,2190145,2190177,2190209,0]),new Uint32Array([2177153,6291456,2177185,6291456,2177217,6291456,2177249,6291456,2177281,6291456,2177313,6291456,2177345,6291456,2177377,6291456]),new Uint32Array([6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([0,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2230466,2230530,2230594,2230658,2230722,2230786,2230850,2230914,2230978,2231042,2231106,2231170,2231234,2231298,2231362,2231426]),new Uint32Array([2100289,2098657,2098049,2202305,2123489,2123681,2202337,2098625,2100321,2098145,2100449,2098017,2098753,2098977,2150241,2150305]),new Uint32Array([2182721,6291456,2190465,6291456,6291456,2190497,6291456,6291456,6291456,6291456,6291456,6291456,2111905,2100865,2190529,2190561]),new Uint32Array([23068672,18884130,23068672,23068672,23068672,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672]),new Uint32Array([2253153,2253185,2253217,2253249,2253281,2253313,2253345,2253378,2212001,2253441,2253473,2253505,2253537,2253569,2253601,2218529]),new Uint32Array([23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2208929,2208961,2208993,2209025,2209057,2209089,2209121,2209153,2209185,2209217,2209249,2209281,2209313,2209345,2209377,2209409]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,6291456,6291456]),new Uint32Array([2125219,2125315,2152898,2152962,2125411,2153026,2153090,2125506,2125507,2125603,2153154,2153218,2153282,2153346,2153410,2105348]),new Uint32Array([23068672,6291456,6291456,6291456,23068672,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,2203617,6291456,2203649,6291456,2203681,6291456,2203713,6291456,2203745,6291456,2203777,6291456,2203809,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,2192321]),new Uint32Array([2246337,2246369,2246401,2246433,2246465,2246497,2246529,2246561,2209729,2219937,2246593,2246625,2246657,2246690,2246753,2246785]),new Uint32Array([2181505,2181537,2181569,2181601,2181633,2181665,2181697,2181729,2181761,2181793,2181825,2181857,2181889,2181921,2181953,2181985]),new Uint32Array([10489988,10490116,10490244,10490372,10490500,10490628,10490756,10490884,0,0,0,0,0,0,0,0]),new Uint32Array([2118049,2105345,2118241,2105441,2118433,2118529,2118625,2118721,2118817,2201825,2201857,2193377,2201889,2201921,2201953,2201985]),new Uint32Array([2135170,2097506,2130691,2130787,2130883,2164034,2164098,2164162,2164226,2164290,2164354,2164418,2164482,2164546,2164610,2133122]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,0,0,23068672,23068672,23068672,6291456,0]),new Uint32Array([2179425,6291456,2179457,6291456,2179489,6291456,2179521,6291456,2179553,6291456,2179585,6291456,2179617,6291456,2179649,6291456]),new Uint32Array([2184417,6291456,2184449,6291456,2184481,6291456,2184513,6291456,2184545,6291456,2184577,6291456,2184609,6291456,2184641,6291456]),new Uint32Array([2215649,2215681,2215713,2215745,2215777,2215809,2215841,2195745,2215873,2215905,2215937,2215969,2216001,2216033,2216065,2216097]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2147905,2147969,2148033,2148097,2148161,2148225,2148289,2148353]),new Uint32Array([2143042,6291456,2143106,2143106,2168961,6291456,2168993,6291456,6291456,2169025,6291456,2169057,6291456,2169089,6291456,2143170]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,23068672,6291456]),new Uint32Array([2179169,6291456,2179201,6291456,2179233,6291456,2179265,6291456,2179297,6291456,2179329,6291456,2179361,6291456,2179393,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,23068672,23068672]),new Uint32Array([2177025,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,2177057,6291456,2177089,6291456,2177121,6291456]),new Uint32Array([2172769,6291456,2172801,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2172833,2172865,6291456,2172897,2172929,6291456]),new Uint32Array([2208545,2208577,2197025,2208609,2208641,2208673,2208705,2198721,2198721,2208737,2117857,2208769,2208801,2208833,2208865,2208897]),new Uint32Array([2192801,2192833,2192865,2192897,2192929,2192961,2192993,2117377,2193025,2193057,2193089,2193121,2193153,2193185,2193217,2117953]),new Uint32Array([2245857,2245889,2245921,2245953,2245985,2246017,2246049,2246081,2217697,2246113,2246146,2246209,2246241,2246273,2246305,2217761]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),new Uint32Array([23068672,23068672,23068672,18923650,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,18923714,23068672,23068672]),new Uint32Array([2126179,2125538,2126275,2126371,2126467,2125634,2126563,2105603,2105604,2125346,2126659,2126755,2126851,2098179,2098181,2098182]),new Uint32Array([2169601,6291456,2169633,6291456,2169665,6291456,2169697,6291456,2169729,6291456,2169761,6291456,2169793,6291456,2169825,6291456]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2168449,6291456,2168481,6291456,2168513,6291456,2168545,6291456,2168577,6291456,2168609,6291456,2168641,6291456,2168673,6291456]),new Uint32Array([2132898,2163906,2163970,2133282,2132034,2131938,2137410,2132802,2132706,2164930,2133282,2160642,2165250,2165250,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,2144322,2144386,2144450,2144514,2144578,2144642,2144706,2144770]),new Uint32Array([2232706,2232770,2232834,2232898,2232962,2233026,2233090,2233154,2233218,2233282,2233346,2233410,2233474,2233538,2233602,2233666]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10532162,10532226,10532290,10532354,10532418,10532482,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672]),new Uint32Array([2097281,2105921,2097729,2106081,2097377,2097601,2162401,2106017,2133281,2097505,0,2097185,2097697,2135777,2097633,2097441]),new Uint32Array([2139426,2160898,2160962,2161026,2134242,2161090,2161154,2161218,2161282,2161346,2161410,2161474,2138658,2161538,2161602,2134722]),new Uint32Array([0,0,2205825,6291456,2205857,2183233,2205889,0,0,0,0,0,0,0,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([10505091,10505187,10505283,10505379,10505475,10505571,10505667,10505763,10505859,10505955,10506051,10506147,10506243,10506339,10506435,10506531]),new Uint32Array([2105505,2098241,2108353,2108417,2105825,0,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177]),new Uint32Array([6291456,6291456,6291456,6291456,10502115,10502178,10502211,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),new Uint32Array([2222785,2222785,2222817,2222817,2159393,2159393,2159393,2159393,2097217,2097217,2158978,2158978,2159042,2159042,2159106,2159106]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2169857,6291456,2169889,6291456,2169921,6291456,2169953,6291456,2169985,2170017,6291456,2170049,6291456,2143329,6291456,2098305]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,0,0]),new Uint32Array([10500003,10500099,10500195,10500291,10500387,10500483,10500579,10500675,10500771,10500867,10500963,10501059,10501155,10501251,10501347,10501443]),new Uint32Array([2105601,2169249,2108193,2170177,2182593,2182625,2112481,2108321,2108289,2182657,2170625,2100865,2182689,2173729,2173761,2173793]),new Uint32Array([0,0,2199809,2199841,2199873,2199905,2199937,2199969,0,0,2200001,2200033,2200065,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),new Uint32Array([2197569,2197601,2197633,2197665,2197697,2197729,2197761,2197793,2197825,2197857,2197889,2197921,2197953,2197985,2198017,2198049]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2180769,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2180801,2180833,2180865,2180897,2180929,2180961,0,0]),new Uint32Array([0,0,0,0,10531458,10495395,2148545,2143201,2173601,2148865,2173633,0,2173665,0,2173697,2149121]),new Uint32Array([2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905]),new Uint32Array([6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,0]),new Uint32Array([6291456,0,6291456,2145026,0,6291456,2145090,0,6291456,6291456,0,0,23068672,0,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,2170081,2170113,6291456,2170145,6291456,2170177,2170209,6291456,2170241,2170273,2170305,6291456,6291456,2170337,2170369]),new Uint32Array([6291456,6291456,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0]),new Uint32Array([6291456,0,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,6291456,6291456]),new Uint32Array([2207521,2207553,2207585,2207617,2207649,2207681,2207713,2207745,2207777,2207809,2207841,2207873,2207905,2207937,2207969,2208001]),new Uint32Array([10485857,6291456,2198785,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2176513,6291456,2176545,6291456,2176577,6291456,2176609,6291456,2176641,6291456,2176673,6291456,2176705,6291456,2176737,6291456]),new Uint32Array([23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2178145,6291456,2178177,6291456,2178209,6291456,2178241,6291456,2178273,6291456,2178305,6291456,2178337,6291456,2178369,6291456]),new Uint32Array([6291456,6291456,6291456,2188193,0,0,6291456,6291456,2188225,2188257,2188289,2173633,0,10496067,10496163,10496259]),new Uint32Array([2186049,6291456,2186081,6291456,2186113,6291456,2186145,6291456,2186177,6291456,2186209,6291456,2186241,6291456,2186273,6291456]),new Uint32Array([2097152,0,0,0,2097152,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2152258,2121283,2103684,2103812,2097986,2098533,2097990,2098693,2098595,2098853,2099013,2103940,2121379,2121475,2121571,2104068]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([2221250,2221314,2221377,2221409,2221441,2221474,2221538,2221602,2221665,2221697,0,0,0,0,0,0]),new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2174113,2174081,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017]),new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417]),new Uint32Array([23068672,23068672,0,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),new Uint32Array([2210913,2210945,2210977,2211009,2211041,2211073,2211105,2211137,2211169,2211201,2211233,2211265,2209057,2211297,2211329,2211361]),new Uint32Array([0,0,0,0,0,0,0,23068672,0,0,0,0,2144834,2144898,0,2144962]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672]),new Uint32Array([6291456,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),new Uint32Array([2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,0,2105505,2098241]),new Uint32Array([2132514,2132610,2160450,2133090,2133186,2160514,2160578,2133282,2160642,2133570,2106178,2160706,2133858,2160770,2160834,2134146]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2205537,2205569,2182945,2205601,2205633,6291456,2205665,6291456,2205697,6291456,2205729,6291456,2205761,6291456,2205793,6291456]),new Uint32Array([2222561,2222561,2222561,2222561,2222593,2222593,2222625,2222625,2222625,2222625,2222657,2222657,2222657,2222657,2139873,2139873]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441]),new Uint32Array([2146882,2146946,2147010,2147074,2147138,2147202,2147266,2147330,2146882,2146946,2147010,2147074,2147138,2147202,2147266,2147330]),new Uint32Array([10502307,10502403,10502499,10502595,10502691,10502787,10502883,10502979,10503075,10503171,10503267,10503363,10503459,10503555,10503651,10503747]),new Uint32Array([2132227,2132323,2132419,2132419,2132515,2132515,2132611,2132707,2132707,2132803,2132899,2132899,2132995,2132995,2133091,2133187]),new Uint32Array([2216129,2242401,2242433,2242465,2242497,2242529,2242561,2242593,2242625,2242658,2242721,2242753,2242785,2239265,2242817,2242849]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,0,0,6291456,0,0,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0]),new Uint32Array([6291456,6291456,2098337,2101441,10531458,2153537,6291456,6291456,10531522,2100737,2108193,6291456,2106499,2106595,2106691,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2187777,2187809,2187841,2187873,2187905,2187937,0,0]),new Uint32Array([2186561,6291456,2186593,6291456,2186625,6291456,2186657,6291456,2186689,6291456,2186721,6291456,2186753,6291456,2186785,6291456]),new Uint32Array([2130979,2131075,2131075,2131171,2131267,2131363,2131459,2131555,2131651,2131651,2131747,2131843,2131939,2132035,2132131,2132227]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,14680064,14680064,14680064,14680064,14680064,14680064]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2149634,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2170401,2170433,6291456,2170465,2170497,6291456,2170529,2170561,2170593,6291456,6291456,6291456,2170625,2170657,6291456,2170689]),new Uint32Array([2167233,2167265,2167297,2167329,2167361,2167393,2167425,2167457,2167489,2167521,2167553,2167585,2167617,2167649,2167681,2167713]),new Uint32Array([6291456,6291456,6291456,2145794,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,2145858,6291456,6291456]),new Uint32Array([2174081,2174113,0,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2174337,2174369,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,0,0,6291456,0]),new Uint32Array([0,2105921,2097729,0,2097377,0,0,2106017,0,2097505,2105889,2097185,2097697,2135777,2097633,2097441]),new Uint32Array([2170721,6291456,2170753,6291456,2170785,6291456,2170817,2170849,6291456,2170881,6291456,6291456,2170913,6291456,2170945,2170977]),new Uint32Array([2190593,6291456,2190625,6291456,2190657,6291456,2190689,6291456,2190721,6291456,2190753,6291456,2190785,6291456,2190817,6291456]),new Uint32Array([14680064,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),new Uint32Array([2100033,2099233,2122017,2202241,2098113,2121537,2103201,2202273,2104033,2121857,2121953,2122401,2099649,2099969,2123009,2100129]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,6291456,23068672]),new Uint32Array([6291456,6291456,2148418,2148482,2148546,0,6291456,2148610,2188097,2188129,2148417,2148545,2148482,10495778,2143969,10495778]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2146114,6291456,6291456,6291456,0,0,0]),new Uint32Array([2188737,2188769,2188801,2188833,2188865,2188897,2188929,2188961,2188993,2189025,2189057,2189089,2189121,2189153,2189185,2189217]),new Uint32Array([2174049,2174081,2174113,2174145,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236897,2173825,2173889,2173921,2174241]),new Uint32Array([23068672,23068672,23068672,0,0,0,0,23068672,23068672,0,0,23068672,23068672,23068672,0,0]),new Uint32Array([2202017,2119681,2202049,2153377,2201441,2201473,2201505,2202081,2202113,2202145,2202177,2119105,2119201,2119297,2119393,2119489]),new Uint32Array([0,2113729,2198913,2198945,2113825,2198977,2199009,2113921,2199041,2114017,2199073,2199105,2199137,2199169,2199201,2199233]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,6291456,23068672,23068672]),new Uint32Array([6291456,6291456,23068672,23068672,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,0,0]),new Uint32Array([2163522,2130978,2131074,2131266,2131362,2163586,2160194,2132066,2131010,2131106,2106018,2131618,2131298,2132034,2131938,2137410]),new Uint32Array([6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0]),new Uint32Array([2202945,6291456,2202977,6291456,2203009,6291456,2203041,6291456,2203073,6291456,2203105,6291456,2203137,6291456,6291456,23068672]),new Uint32Array([2105570,2156098,2126947,2156162,2153730,2127043,2127139,2156226,0,2127235,2156290,2156354,2156418,2156482,2127331,2127427]),new Uint32Array([2251809,2251841,2251874,2251938,2252001,2252034,2252097,2252130,2252193,2252225,2218433,2252258,2252322,2252385,2252418,2252481]),new Uint32Array([2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2194209,2239201,2239233,2152321,2116609,2239265,2239297,2201633,2239329,2239361,2239393,2214209,2239425,2239457,2239489,2239521]),new Uint32Array([6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([10506627,10506723,10506819,10506915,10507011,10507107,10507203,10507299,10507395,10507491,10507587,10507683,10507779,10507875,10507971,10508067]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2203681,2205921,2190273,2205953]),new Uint32Array([6291456,23068672,23068672,23068672,0,23068672,23068672,0,0,0,0,0,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,23068672,6291456,6291456,23068672,23068672,23068672,6291456,0,0,0,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),new Uint32Array([2177409,6291456,2177441,6291456,2177473,6291456,2177505,6291456,2177537,6291456,2177569,6291456,2177601,6291456,2177633,6291456]),new Uint32Array([2140006,2140198,2140390,2140582,2140774,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,23068672,23068672,23068672]),new Uint32Array([2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241]),new Uint32Array([0,23068672,0,0,0,0,0,0,0,2145154,2145218,2145282,6291456,0,2145346,0]),new Uint32Array([2198593,2198625,2198657,2198689,2198721,2198753,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2224578,2224642,2224706,2224770,2224834,2224898,2224962,2225026,2225090,2225154,2225218,2225282,2225346,2225410,2225474,2225538]),new Uint32Array([2133089,2133281,2133281,2133281,2133281,2160641,2160641,2160641,2160641,2097441,2097441,2097441,2097441,2133857,2133857,2133857]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([10518915,10519011,10519107,10519203,2162306,2162370,2159618,2162434,2159426,2159682,2105922,2162498,2159810,2162562,2159874,2159938]),new Uint32Array([2204321,6291456,2204353,6291456,2204385,6291456,2204417,6291456,2204449,6291456,2204481,6291456,2204513,6291456,2204545,6291456]),new Uint32Array([2108321,2108289,2113153,2098209,2182465,2182497,2182529,2111137,2098241,2108353,2170369,2170401,2182561,2105825,6291456,2105473]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,18923970,23068672,23068672,23068672,0,6291456,6291456]),new Uint32Array([2223745,2165665,2165665,2165729,2165729,2223777,2223777,2165793,2165793,2158977,2158977,2158977,2158977,2097281,2097281,2105921]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),new Uint32Array([23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456]),new Uint32Array([2154626,2154690,2154754,2154818,2141858,2154882,2154946,2127298,2155010,2127298,2155074,2155138,2155202,2155266,2155330,2155266]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,6291456,0,0,0,0,0,0,0]),new Uint32Array([2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209]),new Uint32Array([10537282,10495683,2148738,2148802,2148866,0,6291456,2148930,2188161,2173601,2148737,2148865,2148802,10495779,10495875,10495971]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2101922,2102050,2102178,2102306,10498755,10498851,10498947,10499043,10499139,10499235,10499331,10499427,10499523,10489604,10489732,10489860]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2165828,2140004]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),new Uint32Array([2099173,2104196,2121667,2099395,2121763,2152322,2152386,2098946,2152450,2121859,2121955,2099333,2122051,2104324,2099493,2122147]),new Uint32Array([2183393,6291456,2183425,6291456,2183457,6291456,2183489,6291456,2183521,6291456,2183553,6291456,2183585,6291456,2183617,6291456]),new Uint32Array([2241985,2242017,2242049,2242081,2242113,2242145,2242145,2219297,2242177,2242209,2242241,2242273,2217409,2242305,2242337,2242369]),new Uint32Array([2134145,2097153,2134241,0,2132705,2130977,2160129,2131297,0,2133089,2160641,2133857,2239105,0,2239137,0]),new Uint32Array([2241185,2241217,2240033,2241249,2241281,2219201,2217281,2217313,2219233,2241313,2241345,2211489,2241377,2217345,2241409,2241441]),new Uint32Array([2248450,2248514,2248577,2248609,2220065,2248641,2248673,2248705,2248737,2248769,2248801,2248834,2248897,2248930,2248993,0]),new Uint32Array([6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0]),new Uint32Array([2184161,6291456,2184193,6291456,2184225,6291456,2184257,6291456,2184289,6291456,2184321,6291456,2184353,6291456,2184385,6291456]),new Uint32Array([2098657,2098049,2202305,2123489,2123681,2202337,2098625,2100321,2098145,2100449,2098017,2098753,2202369,2202401,2202433,2152194]),new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,0,0,0,0]),new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,0,0,0]),new Uint32Array([2161794,2161858,2135586,2161922,2161986,2137186,2131810,2160354,2135170,2162050,2137954,2162114,2162178,2162242,10518723,10518819]),new Uint32Array([2243393,2243426,2243489,2243521,0,2193537,2243553,2243585,2193601,2243617,2243649,2243682,2243745,2243778,2243841,2243873]),new Uint32Array([2099233,2122017,2202241,2098113,2121537,2103201,2202273,2104033,2121857,2121953,2122401,2099649,2099969,2123009,2100129,2100289]),new Uint32Array([14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064]),new Uint32Array([6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),new Uint32Array([2184673,6291456,2184705,6291456,2184737,6291456,2184769,6291456,2184801,6291456,2184833,6291456,2184865,6291456,2184897,6291456]),new Uint32Array([2239553,2239585,2195201,2239617,2239649,2239681,2239713,2239745,2239777,2116513,2116705,2239809,2202081,2201473,2202113,2239841]),new Uint32Array([2105601,2112289,2108193,2112481,2112577,0,2098305,2108321,2108289,2100865,2113153,2108481,2113345,0,2098209,2111137]),new Uint32Array([10499619,10499715,10499811,10499907,10500003,10500099,10500195,10500291,10500387,10500483,10500579,10500675,10500771,10500867,10500963,10501059]),new Uint32Array([2216513,6291456,2216545,6291456,6291456,2216577,2216609,2216641,2216673,2216705,2216737,2216769,2216801,2216833,2195969,6291456]),new Uint32Array([2143969,2173921,2173953,2153537,2173985,2174017,2174049,2174081,2174113,2173889,2174145,2174177,2174209,2174241,2174273,2174305]),new Uint32Array([0,0,0,0,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,23068672,0,0,0,0,23068672]),new Uint32Array([2173953,2153537,2173985,2174017,2174049,2174081,2174113,2173889,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236865]),new Uint32Array([2115265,2115361,2115457,2115553,2115649,2115745,2115841,2115937,2116033,2116129,2116225,2116321,2150658,2150722,2201793,6291456]),new Uint32Array([2097185,2097697,2097697,2097697,2097697,2135777,2135777,2135777,2135777,2097377,2097377,2097377,2097377,2097601,2097601,2097217]),new Uint32Array([2220193,2249569,2249601,2249633,2249665,2249698,2249761,2249794,2211457,2249858,2249921,2249954,2250018,2250082,2250145,2250177]),new Uint32Array([2247969,2217825,2214529,2248001,2248033,2248065,2248098,2248161,2248193,2248225,2248257,2220033,2248289,2248322,2248385,2248417]),new Uint32Array([2157314,2157378,2157442,2157506,2157570,2157634,2157698,0,2157762,2157826,2157890,2157954,2158018,0,2158082,0]),new Uint32Array([0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,0,6291456,0,6291456,6291456]),new Uint32Array([2214721,2116993,2214753,2214785,2214817,2214849,2214881,2214913,2214945,2214977,2215009,2211425,2215041,2215073,2215105,2215137]),new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,6291456,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2147393,2147457,2147521,2147585,2147649,2147713,2147777,2147841]),new Uint32Array([2125730,2125699,2125795,2125891,2125987,2154178,2154242,2154306,2154370,2154434,2154498,2154562,2126082,2126178,2126274,2126083]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2134145,2097153,2134241,2105953,2132705,2130977,2160129,2131297,2162113,2133089,2160641,2133857,2239105,2222529,2239137,2239169]),new Uint32Array([2217665,2208833,2153249,2245377,2245409,2245441,2245473,2245505,2245538,2245601,2245633,2245665,2245697,2245729,2245762,2245825]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,2144002,6291456,6291456,6291456,0,0,6291456,6291456,6291456]),new Uint32Array([0,0,0,0,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),new Uint32Array([2193729,2193761,2193793,2193825,2193857,2193889,2193921,2193953,2193985,2194017,2194049,2194081,2194113,2194145,2194177,2194209]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,0,0,6291456,6291456]),new Uint32Array([2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481]),new Uint32Array([2254785,2254817,2254849,2254881,2196577,2254914,2254977,2255009,2255041,2255073,2255105,2255138,2255202,2255265,2255297,2255329]),new Uint32Array([2111713,2173249,2111905,2098177,2173281,2173313,2173345,2113153,2113345,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2204801,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2204833,6291456,2204865,6291456,2204897,2204929,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,10611649,10612545,10611681,10612577,2224001]),new Uint32Array([2167042,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2213345,2211873,2213377,2213409,2213441,2213473,2213505,2213537,2152193,2213569,2211361,2213601,2213633,2213665,2213697,2213729]),new Uint32Array([0,2177921,6291456,2177953,6291456,2177985,6291456,2178017,6291456,2178049,6291456,2178081,6291456,2178113,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),new Uint32Array([2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017,2174049,2174081,2174113,2173889,2174145,2174177]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2187521,2187553,2187585,2187617,2187649,2187681,2187713,2187745]),new Uint32Array([2203425,6291456,2203457,6291456,2203489,6291456,2203521,6291456,2203553,6291456,2203585,6291456,2176321,2176385,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,0,0,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,0,0]),new Uint32Array([2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713]),new Uint32Array([2186817,6291456,2186849,6291456,2186881,6291456,2186913,6291456,2186945,6291456,2186977,6291456,2187009,6291456,2187041,6291456]),new Uint32Array([2200961,2200993,2201025,2201057,2201089,2201121,2201153,2201185,2201217,2201249,2201281,2201313,2201345,2201377,2201409,0]),new Uint32Array([2159170,2159170,2159234,2159234,2159298,2159298,2159362,2159362,2159362,2159426,2159426,2159426,2106401,2106401,2106401,2106401]),new Uint32Array([2183649,6291456,2183681,6291456,2183713,6291456,2183745,6291456,2183777,6291456,2183809,6291456,2183841,6291456,2183873,6291456]),new Uint32Array([0,0,2135491,2135587,2135683,2135779,2135875,2135971,2135971,2136067,2136163,2136259,2136355,2136355,2136451,2136547]),new Uint32Array([23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([6291456,6291456,23068672,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2149057,2236865,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017]),new Uint32Array([2194241,2194273,2194305,2194337,2194369,2194401,2194433,2118049,2194465,2117473,2117761,2194497,2194529,2194561,2194593,2194625]),new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2100897,2100898,2100899,2150018,2100865,2100866,2100867,2100868,2150082,2108481,2109858,2109859,2105569,2105505,2098241,2105601]),new Uint32Array([23068672,6291456,23068672,23068672,23068672,6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,23068672,23068672]),new Uint32Array([2256513,2256546,2256609,2256641,2256673,2256705,2256738,2256802,2256865,2256897,2256929,2256962,2257025,2257058,2221121,2221121]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0]),new Uint32Array([2216609,2220193,2220225,2220257,2220289,2220321,2216641,2220353,2220385,2220417,2220449,2220481,2220513,2218305,2220545,2220577]),new Uint32Array([10503843,10503939,10504035,10504131,10504227,10504323,10504419,10504515,10504611,10504707,10504803,10504899,10504995,10491140,10491268,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,2187969,0,2188001,0,2188033,0,2188065]),new Uint32Array([2251201,2251234,2251297,2251329,2251361,2251394,2251457,2251489,2251521,2251553,2251585,2251618,2251681,2251713,2251745,2251777]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([0,2105921,2097729,2106081,0,2097601,2162401,2106017,2133281,2097505,0,2097185,2097697,2135777,2097633,2097441]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2236930,2236994,2237058,2237122,2237186,2237250,2237314,2237378,2237442,2237506,2237570,2237634,2237698,2237762,2237826,2237890]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0,0,0,0,0,0,0,0]),new Uint32Array([2162401,2097633,2097633,2097633,2097633,2132705,2132705,2132705,2132705,2097153,2097153,2097153,2097153,2133089,2133089,2133089]),new Uint32Array([2168193,6291456,2168225,6291456,2168257,6291456,2168289,6291456,2168321,6291456,2168353,6291456,2168385,6291456,2168417,6291456]),new Uint32Array([2176769,6291456,2176801,6291456,2176833,6291456,2176865,6291456,2176897,6291456,2176929,6291456,2176961,6291456,2176993,6291456]),new Uint32Array([2257666,2257729,2257762,2257826,2257890,2198305,2257953,2198433,2257985,2258017,2258049,2258081,2198593,2258114,0,0]),new Uint32Array([2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017,2174049,2174081,2174113,2174145,2174145,2174177]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,0,0]),new Uint32Array([2098209,2108353,2108193,2108481,2170369,2111713,2105473,2105569,2105601,2112289,2112481,2098305,2108321,0,0,0]),new Uint32Array([2099521,2099105,2120705,2098369,2120801,2103361,2097985,2098433,2121377,2121473,2099169,2099873,2098401,2099393,2152673,2100033]),new Uint32Array([6291456,6291456,2116513,2116609,2116705,2116801,2201441,2201473,2201505,2201537,2192481,2201569,2201601,2201633,2201665,2192577]),new Uint32Array([2134562,2132162,2132834,2136866,2136482,2164674,2164738,2164802,2164866,2132802,2132706,2164930,2132898,2164994,2165058,2165122]),new Uint32Array([2209441,2209473,2209505,2209537,2209569,2209601,2209633,2209665,2209697,2209729,2209761,2209793,2209825,2209857,2209889,2209921]),new Uint32Array([2217665,2217697,2217729,2217761,2217793,2217825,2217857,2217889,2217921,2217953,2217985,2218017,2105441,2218049,2218081,2218113]),new Uint32Array([2246817,2246849,2217793,2246882,2246945,2246977,2247009,2221377,2247041,2247073,2247105,2247137,2247170,2247233,2247265,2247297]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2202209,2150786,2150850,2150914,2150978,2151042,2106562,2151106,2150562,2151170,2151234,2151298,2151362,2151426,2151490,2151554]),new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,18874368,18874368,18874368,0,0]),new Uint32Array([2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017,2174049,2174081,2174113,2174145,2174145,2174177,2174209,2174241]),new Uint32Array([2202689,6291456,2202721,6291456,2202753,6291456,2202785,6291456,2202817,6291456,2202849,6291456,2202881,6291456,2202913,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2182721,2105505,2182753,2167745,2182561]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2100833,2100897,0,0,2101569,2101697,2101825,2101953,2102081,2102209,10577185,2188609,10502177,10489601,10489697,2112289]),new Uint32Array([2237954,2238018,2238082,2238146,2238210,2238274,2238338,2238402,2238466,2238530,2238594,2238658,2238722,2238786,2238850,2238914]),new Uint32Array([2129730,2129762,2129858,2129731,2129827,2156546,2156546,0,0,0,0,0,0,0,0,0]),new Uint32Array([2174049,2174081,2174113,2173889,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236865,2148481,2173729,2173761,2173793]),new Uint32Array([2177665,6291456,2177697,6291456,2177729,6291456,2177761,6291456,2177793,6291456,2177825,6291456,2177857,6291456,2177889,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456]),new Uint32Array([2133187,2133283,2133283,2133379,2133475,2133571,2133667,2133667,2133763,2133859,2133955,2134051,2134147,2134147,2134243,2134339]),new Uint32Array([2235778,2235842,2235906,2235970,2236034,2236098,2236162,2236226,2236290,2236354,2236418,2236482,2236546,2236610,2236674,2236738]),new Uint32Array([2222049,2222049,2222081,2222081,2222081,2222081,2222113,2222113,2222113,2222113,2222145,2222145,2222145,2222145,2222177,2222177]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0]),new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2203169,6291456,2203201,6291456,2203233,6291456,2203265,6291456,2203297,6291456,2203329,6291456,2203361,6291456,2203393,6291456]),new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2100833,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2123683,2105092,2152770,2123779,2105220,2152834,2100453,2098755,2123906,2124002,2124098,2124194,2124290,2124386,2124482,2124578]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([0,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0]),new Uint32Array([2216129,2216161,2216193,2216225,2216257,2216289,2216321,2216353,2196545,2216385,2196641,2216417,2216449,2216481,6291456,6291456]),new Uint32Array([2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,0,2098241,2108353,2108417,2105825,0]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,6291456]),new Uint32Array([2193921,2244450,2244450,2244513,2244545,2244545,2244577,2244610,2244674,2244737,2244769,2244801,2244833,2244865,2244897,2244929]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2166850,2166914,2166978,0,0,0]),new Uint32Array([2196929,2142433,2239873,2239905,2239937,2239969,2118241,2117473,2240001,2240033,2240065,2240097,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2110051,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([10485857,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10495394,6291456,2098209,6291456,6291456,2097152,6291456,10531394]),new Uint32Array([2174561,6291456,2174593,6291456,2174625,6291456,2174657,6291456,2174689,6291456,2174721,6291456,2174753,6291456,2174785,6291456]),new Uint32Array([2196129,2196161,2196193,2119777,2119873,2196225,2196257,2196289,2196321,2196353,2196385,2196417,2196449,2196481,2196513,2196545]),new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672,23068672,23068672,23068672,6291456]),new Uint32Array([14680064,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2192129,6291456,2192161,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2192193,6291456,2192225,6291456,23068672]),new Uint32Array([2174209,2174241,2174273,2174305,2149057,2236865,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921]),new Uint32Array([2134145,2097153,2134241,2105953,2132705,2130977,2160129,2131297,2162113,2133089,2160641,2133857,0,0,0,0]),new Uint32Array([2184929,6291456,2184961,6291456,2184993,6291456,2185025,6291456,2185057,6291456,2185089,6291456,2185121,6291456,2185153,6291456]),new Uint32Array([2222177,2222177,2222209,2222209,2222241,2222241,2222273,2222273,2222305,2222305,2222337,2222337,2222369,2222369,2222401,2222401]),new Uint32Array([10501539,10501635,10501731,10501827,10501923,10502019,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,2192289]),new Uint32Array([2208033,2208065,2208097,2208129,2208161,2208193,2208225,2208257,2208289,2208321,2208353,2208385,2208417,2208449,2208481,2208513]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,0,0]),new Uint32Array([6291456,6291456,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2098209,2167425,2111137,6291456]),new Uint32Array([2169345,6291456,2169377,6291456,2169409,6291456,2169441,6291456,2169473,6291456,2169505,6291456,2169537,6291456,2169569,6291456]),new Uint32Array([2212385,2193377,2212417,2212449,2212481,2212513,2212545,2212577,2212609,2212641,2192865,2212673,2212705,2212737,2212769,2212801]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672]),new Uint32Array([2167106,2167170,2099169,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2113153,2108481,2113345,2113441,2236801,2236833,0,0,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889]),new Uint32Array([2204961,6291456,2204993,6291456,2205025,6291456,2205057,6291456,6291456,6291456,6291456,2205089,6291456,2182849,6291456,6291456]),new Uint32Array([6291456,23068672,6291456,2145602,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0]),new Uint32Array([2178401,6291456,2178433,6291456,2178465,6291456,2178497,6291456,2178529,6291456,2178561,6291456,2178593,6291456,2178625,6291456]),new Uint32Array([2155394,2155458,0,2155522,2155586,2155650,2105732,0,2155714,2155778,2155842,2125314,2155906,2155970,2126274,2156034]),new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2191105,6291456,2191137,6291456,2191169,6291456,2191201,6291456,2191233,6291456,2191265,6291456,2191297,6291456,2191329,6291456]),new Uint32Array([10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,10485857,2097152,4194304,4194304,0,0]),new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),new Uint32Array([6291456,6291456,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2136643,2136739,2136835,2136931,2137027,2137123,2137219,2137315,2137411,2137507,2137603,2137699,2137795,2137891,2137987,2138083]),new Uint32Array([2257121,2257154,2257217,2257249,2257281,2257313,2257345,2257377,2257409,2257442,2221153,2257505,2257537,2257569,2257601,2257633]),new Uint32Array([2252514,2252577,2252609,2252641,2252673,2252705,2252737,2252770,2252834,2252898,2252962,2244513,2253025,2253057,2253089,2253121]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2188673,2188705,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456]),new Uint32Array([2181025,2181057,2181089,2181121,2181153,2181185,2181217,2181249,2181281,2181313,2181345,2181377,2180769,2181409,2181441,2181473]),new Uint32Array([0,0,0,0,0,0,0,6291456,2168801,2169377,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2147394,2147458,2147522,2147586,2147650,2147714,2147778,2147842,2147394,2147458,2147522,2147586,2147650,2147714,2147778,2147842]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([2171521,6291456,2171553,6291456,2171585,6291456,2171617,6291456,2171649,6291456,2171681,6291456,2171713,6291456,2171745,6291456]),new Uint32Array([2219009,2219041,2219073,2219105,2219137,2219169,2219201,2219233,2217377,2219265,2219297,2219329,2216513,2219361,2219393,2219425]),new Uint32Array([6291456,2148545,6291456,2173601,6291456,2148865,6291456,2173633,6291456,2173665,6291456,2173697,6291456,2149121,0,0]),new Uint32Array([2198241,2210433,2210465,2210497,2210529,2210561,2210593,2210625,2210657,2210689,2210721,2210753,2210785,2210817,2210849,2210881]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,6291456,0,23068672,23068672,23068672,23068672,23068672,23068672,0,0]),new Uint32Array([2215169,2215201,2215233,2215265,2215297,2215329,2215361,2215393,2215425,2197249,2215457,2215489,2215521,2215553,2215585,2215617]),new Uint32Array([0,0,0,2156610,2156674,2156738,2156802,2156866,0,0,0,0,0,2156930,23068672,2156994]),new Uint32Array([2211393,2211425,2211457,2211489,2211521,2211553,2211585,2211617,2211649,2211681,2211713,2211745,2211777,2211809,2211841,2211873]),new Uint32Array([6291456,6291456,6291456,6291456,2143298,2143298,2143298,2143362,2143362,2143362,2143426,2143426,2143426,2171233,6291456,2171265]),new Uint32Array([2120162,2120258,2151618,2151682,2151746,2151810,2151874,2151938,2152002,2120035,2120131,2120227,2152066,2120323,2152130,2120419]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2097281,2105921,2097729,2106081,0,2097601,2162401,2106017,2133281,2097505,2105889,2097185,2097697,2135777,2097633,2097441]),new Uint32Array([6291456,6291456,2145922,6291456,6291456,6291456,6291456,2145986,6291456,6291456,6291456,6291456,2146050,6291456,6291456,6291456]),new Uint32Array([2191873,6291456,2191905,6291456,2191937,6291456,2191969,6291456,2192001,6291456,2192033,6291456,2192065,6291456,2192097,6291456]),new Uint32Array([2240193,2240225,2240257,2240290,2240353,2217185,2240385,2240417,2240449,2240481,2217217,2240513,2240545,2240578,2217249,2240641]),new Uint32Array([2165186,2164034,2164098,2164162,2164226,2164290,2164354,2164418,2164482,2164546,2164610,2133122,2134562,2132162,2132834,2136866]),new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),new Uint32Array([2105921,2105921,2105921,2223809,2223809,2130977,2130977,2130977,2130977,2160129,2160129,2160129,2160129,2097729,2097729,2097729]),new Uint32Array([2212833,2212865,2212897,2212929,2212961,2212993,2213025,2213057,2213089,2213121,2213153,2213185,2213217,2213249,2213281,2213313]),new Uint32Array([0,2179681,2179713,2179745,2179777,2144001,2179809,2179841,2179873,2179905,2179937,2156769,2179969,2156897,2180001,2180033]),new Uint32Array([0,2105921,2097729,0,2097377,0,0,2106017,2133281,2097505,2105889,0,2097697,2135777,2097633,2097441]),new Uint32Array([10496547,10496643,2105505,2149698,6291456,10496739,10496835,2170401,6291456,2149762,2105825,2111713,2111713,2111713,2111713,2168801]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,23068672,23068672,6291456,23068672,23068672,6291456,23068672,0,0,0,0,0,0,0,0]),new Uint32Array([2128195,2128291,2128387,2128483,2128579,2128675,2128771,2128867,2128963,2129059,2129155,2129251,2129347,2129443,2129539,2129635]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,0,6291456]),new Uint32Array([6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2196577,2196609,2196641,2196673,2196705,2196737,2196769,2196801,2196833,2196865,2196897,2196929,2196961,2196993,2197025,2197057]),new Uint32Array([2224033,2198785,2223233,2223265,2222849,2224065,2202433,2099681,2104481,2224097,2099905,2120737,2224129,2103713,2100225,2098785]),new Uint32Array([0,0,2097729,0,0,0,0,2106017,0,2097505,0,2097185,0,2135777,2097633,2097441]),new Uint32Array([2185441,6291456,2185473,6291456,2185505,6291456,2185537,6291456,2185569,6291456,2185601,6291456,2185633,6291456,2185665,6291456]),new Uint32Array([6291456,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017,2174049]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,6291456,6291456,6291456,6291456,0,0]),new Uint32Array([2097729,2106017,2106017,2106017,2106017,2131297,2131297,2131297,2131297,2106081,2106081,2162113,2162113,2105953,2105953,2162401]),new Uint32Array([6291456,0,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,0,0,0,0,0,0,23068672,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,6291456,23068672,6291456,23068672,6291456,6291456,6291456,6291456,23068672,23068672]),new Uint32Array([6291456,2172961,6291456,2172993,2173025,2173057,2173089,6291456,2173121,6291456,2173153,6291456,2173185,6291456,2173217,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456]),new Uint32Array([2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321]),new Uint32Array([2227138,2227202,2227266,2227330,2227394,2227458,2227522,2227586,2227650,2227714,2227778,2227842,2227906,2227970,2228034,2228098]),new Uint32Array([2131586,2132450,2135970,2135778,2161666,2136162,2163714,2161858,2135586,2163778,2137186,2131810,2160354,2135170,2097506,2159618]),new Uint32Array([2183169,2170689,2183201,2183233,2170881,2183265,2173025,2171009,2183297,2171041,2173057,2113441,2183329,2183361,2171137,2173889]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456]),new Uint32Array([2238978,2239042,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456]),new Uint32Array([2167745,2167777,2167809,2167841,2167873,2167905,2167937,6291456,2167969,2168001,2168033,2168065,2168097,2168129,2168161,4240130]),new Uint32Array([6291456,23068672,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2209953,2209985,2210017,2210049,2196001,2210081,2210113,2210145,2210177,2210209,2210241,2210273,2210305,2210337,2210369,2210401]),new Uint32Array([0,0,0,0,0,23068672,23068672,0,0,0,0,0,0,0,6291456,0]),new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,14680064,14680064,14680064,14680064,14680064]),new Uint32Array([2174209,2174241,2174273,2174305,2149057,2236897,2173825,2173889,2173921,2174241,2174113,2174081,2148481,2173729,2173761,2173793]),new Uint32Array([0,0,23068672,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2105473,2105569,2105601,2112289,0,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441]),new Uint32Array([2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481]),new Uint32Array([2249025,2220129,2249057,2249090,2249153,2249185,2249218,2249282,2249345,2249377,2249409,2249441,2249473,2249473,2249505,2249537]),new Uint32Array([2174113,2173889,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236865,2148481,2173729,2173761,2173793,2173825,2173857]),new Uint32Array([0,0,0,0,0,23068672,23068672,0,6291456,6291456,6291456,0,0,0,0,0]),new Uint32Array([2098241,2108353,2170337,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,6291456,2108193,2172545,2112481,2098177]),new Uint32Array([2162242,2163266,2163330,2135170,2136226,2162050,2137954,2159490,2159554,2163394,2159618,2163458,2159746,2139522,2136450,2159810]),new Uint32Array([0,0,0,0,0,0,23068672,23068672,0,0,0,0,2145410,2145474,0,6291456]),new Uint32Array([2241473,2241505,2241505,2241505,2241538,2241601,2241633,2241665,2241698,2241761,2241793,2241825,2241857,2241889,2241921,2241953]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2150146,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,0,23068672,23068672,0,0,23068672,23068672,23068672,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),new Uint32Array([2180065,2180097,2180129,2180161,2156609,2180193,2156641,2180225,2180257,2180289,2180321,2180353,2180385,2180417,2156801,2180449]),new Uint32Array([2232514,2232578,2232642,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),new Uint32Array([2113345,2113441,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289]),new Uint32Array([10554593,2222849,0,0,10562145,10502113,10538049,10537921,2222945,10489601,10489697,10611649,10611681,2141729,2141793,10612033]),new Uint32Array([2174273,2174305,2149057,2236897,2173825,2173889,2173921,2174241,2174113,2174081,2174497,2174497,0,0,2100833,2100737]),new Uint32Array([2199265,2114113,2114209,2199297,2199329,2114305,2199361,2114401,2114497,2199393,2114593,2114689,2114785,2114881,2114977,2199425]),new Uint32Array([6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([10577089,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,23068672,0,23068672,23068672,0,23068672]),new Uint32Array([6291456,6291456,6291456,2188321,6291456,6291456,6291456,6291456,2188353,2188385,2188417,2173697,2188449,10496355,10495395,10577089]),new Uint32Array([23068672,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2199969,2200001,2200033,2200065,0,2200097,2200129,2200161,2200193,2200225,2200257,2200289,2200321,2200353,2200385,2200417]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672,0,0,0,0,0,0,0,0]),new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2191361,6291456,2191393,6291456,2191425,6291456,2191457,6291456,2191489,6291456,2191521,6291456,2191553,6291456,2191585,6291456]),new Uint32Array([2221793,2221793,2221825,2221825,2221825,2221825,2221857,2221857,2221857,2221857,2221889,2221889,2221889,2221889,2221921,2221921]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,2198817,6291456,2117377,2198849,2198881,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,6291456,23068672,23068672,23068672,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456]),new Uint32Array([2108353,2108417,0,2105601,2108193,2157185,2157377,2157441,2157505,2100897,6291456,2108419,2174081,2173761,2173761,2174081]),new Uint32Array([2174241,2174273,2100897,2098177,2108289,2100865,2173729,2173761,2174113,2174241,2174273,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([0,10537921,10612449,10612033,10612257,10612289,10612065,10612481,10489601,10489697,10612097,10577185,10554593,2223521,2198785,10496577]),new Uint32Array([6291456,0,6291456,0,0,0,6291456,6291456,6291456,6291456,0,0,23068672,6291456,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2175905,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([10508163,10508259,10508355,10508451,2201697,2201729,2194305,2201761,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2197089,2197121,2197153,2197185,2197217,2197249,2117857,2197281,2197313,2197345,2197377,2197409,2197441,2197473,2197505,2197537]),new Uint32Array([2185697,6291456,2185729,6291456,2185761,6291456,6291456,6291456,6291456,6291456,2146818,2184929,6291456,6291456,2142978,6291456]),new Uint32Array([2161218,2161474,2138658,2161538,2161602,2097666,2097186,2097474,2163010,2132450,2163074,2163138,2136162,2163202,2161730,2161794]),new Uint32Array([6291456,2188545,6291456,6291456,6291456,6291456,6291456,10537858,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456]),new Uint32Array([2138179,2138275,2138371,2138467,2134243,2134435,2138563,2138659,2138755,2138851,2138947,2139043,2138947,2138755,2139139,2139235]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,0,0,0,0,0,6291456,0,0]),new Uint32Array([2240673,2240705,2240738,2240801,2240833,2239489,2240866,2240929,2240961,2240993,2241025,2219041,2241058,2192801,2241121,2241153]),new Uint32Array([2225602,2225666,2225730,2225794,2225858,2225922,2225986,2226050,2226114,2226178,2226242,2226306,2226370,2226434,2226498,2226562]),new Uint32Array([2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,10577185,2188609,10502177,10489601,10489697,0]),new Uint32Array([2233730,2233794,2233858,2233922,2233986,2234050,2234114,2234178,2234242,2234306,2234370,2234434,2234498,2234562,2234626,2234690]),new Uint32Array([2193249,2193281,2193313,2193345,2153345,2193377,2193409,2193441,2193473,2193505,2193537,2193569,2193601,2193633,2193665,2193697]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,6291456,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2255874,2255938,2256001,2256033,2256065,2256098,2256161,2256193,2256225,2256257,2256289,2256321,2256353,2256386,2256449,2256481]),new Uint32Array([6291456,6291456,4271297,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2174401]),new Uint32Array([2211905,2197089,2211937,2211969,2212001,2212033,2212065,2212097,2212129,2212161,2212193,2212225,2212257,2212289,2212321,2212353]),new Uint32Array([23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,0,0,0,6291456]),new Uint32Array([2199457,2199489,2199521,2199553,2199585,2199617,2199649,2199681,2199713,2199745,2199777,2199809,2199841,2199873,2199905,2199937]),new Uint32Array([10554593,2222849,0,10502113,10562145,10537921,10538049,2222881,2222913,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,6291456,0,0,0,0,0,0,0,10485857]),new Uint32Array([6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,6291456]),new Uint32Array([0,0,2148994,2149058,2149122,0,6291456,2149186,2188513,2173665,2148993,2149121,2149058,10531458,10496066,0]),new Uint32Array([2202465,6291456,2202497,6291456,2202529,6291456,2202561,6291456,2202593,6291456,2180993,6291456,2202625,6291456,2202657,6291456]),new Uint32Array([18884449,18884065,23068672,18884417,18884034,18921185,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,18874368]),new Uint32Array([2141923,2142019,2142115,2142211,2142307,2142403,2142499,2142595,2142691,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,23068672]),new Uint32Array([2160066,2160130,2160194,2160258,2160322,2132066,2131010,2131106,2106018,2131618,2160386,2131298,2132034,2131938,2137410,2132226]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2102402,2102403,6291456,2110050]),new Uint32Array([2229186,2229250,2229314,2229378,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2162626,2162690,2131362,2162754,2160002,2160066,2162818,2162882,2160194,2162946,2160258,2160322,2160898,2160962,2161090,2161154]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2140964,2141156,2140966,2141158,2141350]),new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2217185,2217217,2217249,2217281,2217313,2217345,2217377,2217409,2217441,2217473,2217505,2217537,2193601,2217569,2217601,2217633]),new Uint32Array([2189249,2189281,2189313,2189345,2189377,2189409,2189441,2189473,2189505,2189537,2189569,2189601,2189633,2189665,2189697,2189729]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,23068672,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),new Uint32Array([2188705,2223233,2223265,2223297,2223329,6291456,6291456,10611969,10612001,10537986,10537986,10537986,10537986,10611617,10611617,10611617]),new Uint32Array([2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921,2173953,2153537,2173985,2174017,2174049,2174081]),new Uint32Array([2242882,2242946,2243009,2243041,2243073,2243105,2243137,2243169,0,2243201,2243233,2243233,2243266,2243329,2243361,2211361]),new Uint32Array([6291456,6291456,2203841,6291456,2203873,6291456,2203905,6291456,2203937,6291456,2203969,6291456,2204001,6291456,2204033,6291456]),new Uint32Array([6291456,0,0,0,0,0,0,23068672,0,0,0,0,0,6291456,6291456,6291456]),new Uint32Array([2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0]),new Uint32Array([2173729,2173889,2174209,2173697,2174369,2174241,2174081,6291456,2174433,6291456,2174465,6291456,2174497,6291456,2174529,6291456]),new Uint32Array([0,0,2199425,2199457,2199489,2199521,2199553,2199585,0,0,2199617,2199649,2199681,2199713,2199745,2199777]),new Uint32Array([0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,23068672,23068672]),new Uint32Array([2253633,2253665,2253697,2253729,2253762,2253826,2253890,2253953,2253985,2254017,2254049,2254082,2254145,2254178,2254241,2254273]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0]),new Uint32Array([23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2159490,2159554,2159618,2159426,2159682,2159746,2139522,2136450,2159810,2159874,2159938,2130978,2131074,2131266,2131362,2160002]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2243905,2243937,2243969,2244001,2244033,2244065,2244097,2244129,2244161,2244194,2244257,2244289,2244321,2244353,2209697,2244386]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2219457,2219489,2219521,2219553,2219585,2219617,2219649,2219681,2219713,2217633,2219745,2217665,2219777,2219809,2219841,2219873]),new Uint32Array([6291456,2143490,2143490,2143490,2171777,6291456,2171809,2171841,2171873,6291456,2171905,6291456,2171937,6291456,2171969,6291456]),new Uint32Array([2178657,6291456,2178689,6291456,2178721,6291456,2178753,6291456,2178785,6291456,2178817,6291456,2178849,6291456,2178881,6291456]),new Uint32Array([2172513,6291456,2172545,6291456,2172577,6291456,2172609,6291456,2172641,6291456,2172673,6291456,2172705,6291456,2172737,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0]),new Uint32Array([2175489,2175521,2175553,2175585,2175617,2175649,2175681,2175713,2175745,2175777,2175809,2175841,2175873,2175905,2175937,2175969]),new Uint32Array([2176001,2176033,2176065,2176097,2176129,2176161,2176193,2176225,2176257,2176289,2176321,2176353,2176385,2176417,2176449,2176481]),new Uint32Array([2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2166658,2127298,2166722,2142978,2141827,2166786]),new Uint32Array([0,0,0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,2187329,2187361,2187393,2187425,2187457,2187489,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2150402]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,2145666,2145730,6291456,6291456]),new Uint32Array([2102788,2102916,2103044,2120515,2103172,2120611,2120707,2098373,2103300,2120803,2120899,2120995,2103428,2103556,2121091,2121187]),new Uint32Array([10612065,10612097,10577185,2223521,10612161,10612193,10502177,0,10612225,10612257,10612289,10612321,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2102404,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,2100612,6291456,6291456,6291456,6291456,6291456,6291456,6291456,10485857]),new Uint32Array([2214241,2214273,2214305,2214337,2198689,2214369,2214401,2214433,2214465,2214497,2214529,2214561,2214593,2214625,2214657,2214689]),new Uint32Array([2224161,2224193,2224225,10531394,2224257,2224289,2224321,0,2224353,2224385,2224417,2224449,2224481,2224513,2224545,0]),new Uint32Array([2134146,2139426,2161026,2134242,2161282,2161346,2161410,2161474,2138658,2134722,2134434,2134818,2097666,2097346,2097698,2105986]),new Uint32Array([2222401,2222401,2222433,2222433,2222433,2222433,2222465,2222465,2222465,2222465,2222497,2222497,2222497,2222497,2222529,2222529]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,2171297,6291456,2171329,6291456,2171361,6291456,2171393,6291456,2171425,6291456,2171457,6291456,6291456,2171489,6291456]),new Uint32Array([6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456]),new Uint32Array([2174977,2175009,2175041,2175073,2175105,2175137,2175169,2175201,2175233,2175265,2175297,2175329,2175361,2175393,2175425,2175457]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,0,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0]),new Uint32Array([2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,10611969,10612225,10612001,10612513,10611617]),new Uint32Array([2213761,2213793,2213825,2213857,2213889,2213921,2213953,2213985,2214017,2214049,2214081,2214113,2214145,2214177,2214209,2209057]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,0]),new Uint32Array([10612321,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193]),new Uint32Array([0,0,2105825,0,0,2111905,2105473,0,0,2112289,2108193,2112481,2112577,0,2098305,2108321]),new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,2192353,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,14680064,6291456,6291456,14680064]),new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),new Uint32Array([2100897,2111905,2105473,2105569,2105601,0,2108193,0,0,0,2098305,2108321,2108289,2100865,2113153,2108481]),new Uint32Array([2133857,2134145,2134145,2134145,2134145,2134241,2134241,2134241,2134241,2105889,2105889,2105889,2105889,2097185,2097185,2097185]),new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,10499619,10499715,10499811,10499907]),new Uint32Array([2173921,2174113,2174145,6291456,2173889,2173825,6291456,2174817,6291456,2174145,2174849,6291456,6291456,2174881,2174913,2174945]),new Uint32Array([0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2200449,2200481,2200513,2200545,2200577,2200609,2200641,2200673,2200705,2200737,2200769,2200801,2200833,2200865,2200897,2200929]),new Uint32Array([6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23068672]),new Uint32Array([2134145,2097153,2134241,0,2132705,2130977,2160129,2131297,0,2133089,0,2133857,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([10553922,2165378,10518722,6291456,10518818,0,10518914,2130690,10519010,2130786,10519106,2130882,10519202,2165442,10554114,2165570]),new Uint32Array([2204065,6291456,2204097,6291456,2204129,6291456,2204161,6291456,2204193,6291456,2204225,6291456,2204257,6291456,2204289,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,23068672,23068672,23068672,0,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456,23068672,23068672]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2231490,2231554,2231618,2231682,2231746,2231810,2231874,2231938,2232002,2232066,2232130,2232194,2232258,2232322,2232386,2232450]),new Uint32Array([2195617,2195649,2195681,2195713,2195745,2195777,2195809,2195841,2195873,2195905,2195937,2195969,2196001,2196033,2196065,2196097]),new Uint32Array([0,0,0,2222721,2222721,2222721,2222721,2144193,2144193,2159265,2159265,2159329,2159329,2144194,2222753,2222753]),new Uint32Array([23068672,23068672,23068672,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456]),new Uint32Array([2113153,2108481,2113345,2113441,2098209,2111137,0,2098241,2108353,2108417,2105825,0,0,2111905,2105473,2105569]),new Uint32Array([2220481,2250721,2250754,2218145,2250818,2250882,2216769,2250945,2250977,2218241,2251009,2251041,2251074,2251138,2251138,0]),new Uint32Array([2216865,6291456,2216897,6291456,6291456,2216929,2216961,6291456,6291456,6291456,2216993,2217025,2217057,2217089,2217121,2217153]),new Uint32Array([2136482,2164674,2164738,2164802,2164866,2132802,2132706,2164930,2132898,2164994,2165058,2165122,2165186,2132802,2132706,2164930]),new Uint32Array([2173953,2153537,2173985,2174017,2174049,2174081,2174113,2174145,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236897]),new Uint32Array([2173825,2173889,2173921,2174241,2174113,2174081,2148481,2173729,2173761,2173793,2173825,2173857,2148801,2173889,2143969,2173921]),new Uint32Array([6291456,6291456,6291456,6291456,16777216,16777216,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,23068672,10538818,10538882,6291456,6291456,2150338]),new Uint32Array([0,23068672,23068672,18923394,23068672,18923458,18923522,18884099,18923586,18884195,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2180481,2180513,2144033,2180545,2180577,2180609,2180641,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,6291456,6291456,6291456,23068672,6291456,0,0,0,0,0,0,0,0,0]),new Uint32Array([2190241,6291456,2190273,2190305,2190337,6291456,6291456,2190369,6291456,2190401,6291456,2190433,6291456,2182497,2183073,2182465]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2146881,2146945,2147009,2147073,2147137,2147201,2147265,2147329]),new Uint32Array([2191617,6291456,2191649,6291456,2191681,6291456,2191713,6291456,2191745,6291456,2191777,6291456,2191809,6291456,2191841,6291456]),new Uint32Array([0,0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2122915,2123011,2123107,2104708,2123203,2123299,2123395,2100133,2104836,2100290,2100293,2104962,2104964,2098052,2123491,2123587]),new Uint32Array([0,10554562,10554626,10554690,10554754,10554818,10554882,10554946,10555010,10555074,10555138,6291456,6291456,0,0,0]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137,2105505,2098241,0,2108417,0,2111713,2100897,2111905]),new Uint32Array([2198081,2198113,2198145,2198177,2198209,2198241,2198273,2198305,2198337,2198369,2198401,2198433,2198465,2198497,2198529,2198561]),new Uint32Array([2097217,2097505,2097505,2097505,2097505,2165634,2165634,2165698,2165698,2165762,2165762,2097858,2097858,0,0,2097152]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,0,0,6291456,6291456]),new Uint32Array([2134434,2134818,2097666,2097186,2097474,2097698,2105986,2131586,2132450,2131874,2131778,2135970,2135778,2161666,2136162,2161730]),new Uint32Array([6291456,6291456,6291456,6291456,0,6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2183905,6291456,2183937,6291456,2183969,6291456,2184001,6291456,2184033,6291456,2184065,6291456,2184097,6291456,2184129,6291456]),new Uint32Array([0,2222945,2222977,10611617,10611617,10489601,10489697,10611649,10611681,2141729,2141793,2223105,2223137,2223169,2223201,2188673]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,0,0,23068672,23068672,23068672,0,0,0,0,23068672]),new Uint32Array([2205985,2206017,2206049,2206081,2206113,2206145,2206177,2206209,2206241,2206273,2206305,2206337,2206369,2206401,2206433,2206465]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,6291456,6291456,6291456,0,0,0,0,0]),new Uint32Array([2098081,2099521,2099105,2120705,2098369,2120801,2103361,2097985,2098433,2121377,2121473,2099169,2099873,2098401,2099393,2152673]),new Uint32Array([2158146,2158210,0,2158274,2158338,0,2158402,2158466,2158530,2129922,2158594,2158658,2158722,2158786,2158850,2158914]),new Uint32Array([23068672,23068672,2192257,6291456,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2240129,2240161,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2100833,2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,10502113,10562145,10612161,10502177,10612193,10538049]),new Uint32Array([6291456,0,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,0,23068672,23068672,6291456,23068672,23068672]),new Uint32Array([2139811,2139907,2097284,2105860,2105988,2106116,2106244,2097444,2097604,2097155,10485778,10486344,2106372,6291456,0,0]),new Uint32Array([0,2097153,2134241,0,2132705,0,0,2131297,0,2133089,0,2133857,0,2222529,0,2239169]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([0,0,23068672,23068672,6291456,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([10501155,10501251,10501347,10501443,10501539,10501635,10501731,10501827,10501923,10502019,2141731,2105505,2098177,2155650,2166594,6291456]),new Uint32Array([2097152,2097152,2097152,2097152,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([0,0,0,0,0,0,0,2180705,0,0,0,0,0,2180737,0,0]),new Uint32Array([2194657,2194689,2194721,2194753,2117665,2117569,2194785,2194817,2194849,2194881,2194913,2194945,2194977,2195009,2195041,2195073]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([0,0,0,6291456,6291456,0,0,0,6291456,6291456,6291456,0,0,0,6291456,6291456]),new Uint32Array([2213025,2220609,2218433,2220641,2220673,2220705,2220737,2220769,2218593,2220801,2216897,2220833,2218625,2211297,2220865,2218657]),new Uint32Array([2221921,2221921,2221953,2221953,2221953,2221953,2221985,2221985,2221985,2221985,2222017,2222017,2222017,2222017,2222049,2222049]),new Uint32Array([23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),new Uint32Array([0,0,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2220385,2250210,2250274,2250338,2250402,2250465,2250497,2250497,2220417,2221441,2250529,2250561,2250593,2250626,2250689,2210273]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,23068672]),new Uint32Array([2170497,2105569,2098305,2108481,2173377,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456]),new Uint32Array([2247330,2247393,2247425,2247457,2247489,2211905,2247521,2247554,2247618,2247682,2247745,2247778,2247841,2247873,2247905,2247937]),new Uint32Array([2100897,2100897,2105569,2105569,6291456,2112289,2149826,6291456,6291456,2112481,2112577,2098177,2098177,2098177,6291456,6291456]),new Uint32Array([2190849,6291456,2190881,6291456,2190913,6291456,2190945,6291456,2190977,6291456,2191009,6291456,2191041,6291456,2191073,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,6291456,6291456,6291456]),new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0]),new Uint32Array([0,0,0,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2127650,2127746,2127842,2127938,2128034,2128130,2128226,2128322,2128418,2127523,2127619,2127715,2127811,2127907,2128003,2128099]),new Uint32Array([2149890,2108323,2149954,6291456,2113441,6291456,2149057,6291456,2113441,6291456,2105473,2167393,2111137,2105505,6291456,2108353]),new Uint32Array([2244961,2244993,2245025,2217569,2245058,2245121,2245153,2245185,2219681,2245185,2245217,2217633,2245249,2245281,2245313,2245345]),new Uint32Array([0,0,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,6291456]),new Uint32Array([2143170,2169121,6291456,2169153,6291456,2169185,6291456,2169217,6291456,2143234,2169249,6291456,2169281,6291456,2169313,6291456]),new Uint32Array([2234754,2234818,2234882,2234946,2235010,2235074,2235138,2235202,2235266,2235330,2235394,2235458,2235522,2235586,2235650,2235714]),new Uint32Array([2187073,6291456,2187105,6291456,2187137,6291456,2187169,6291456,2187201,6291456,2187233,6291456,2187265,6291456,2187297,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([0,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,6291456,6291456,6291456]),new Uint32Array([2226626,2226690,2226754,2226818,2226882,2226946,2227010,2227074,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2116513,2116609,2116705,2116801,2116897,2116993,2117089,2117185,2117281,2117377,2117473,2117569,2117665,2117761,2117857,2117953]),new Uint32Array([2100737,2098337,2101441,2101569,2101697,2101825,2101953,2102081,2102209,2100802,2101154,2101282,2101410,2101538,2101666,2101794]),new Uint32Array([6291456,6291456,6291456,0,6291456,6291456,6291456,6291456,6291456,2109955,6291456,6291456,0,0,0,0]),new Uint32Array([18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368,18874368]),new Uint32Array([2175553,2175617,2175937,2176033,2176065,2176065,2176321,2176545,2180993,0,0,0,0,0,0,0]),new Uint32Array([0,6291456,6291456,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,0]),new Uint32Array([2152514,2152578,2099653,2104452,2099813,2122243,2099973,2152642,2122339,2122435,2122531,2122627,2122723,2104580,2122819,2152706]),new Uint32Array([2218145,2118721,2218177,2218209,2218241,2218273,2218305,2213025,2218337,2218369,2218401,2218433,2218465,2218497,2218497,2218529]),new Uint32Array([6291456,6291456,6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2182017,2182049,2182081,2182113,2182145,2182177,2182209,2182241,2182273,2182305,2182337,0,0,2182369,2182401,2182433]),new Uint32Array([2113345,0,2098209,2111137,2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,2180673,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0]),new Uint32Array([2185185,6291456,2185217,6291456,2185249,6291456,2185281,6291456,2185313,6291456,2185345,6291456,2185377,6291456,2185409,6291456]),new Uint32Array([2220865,2220897,2196801,2255362,2255425,2255457,2255489,2255521,2255554,2255618,2255681,2255713,2255745,2255778,2255841,2220929]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([2172257,6291456,2172289,6291456,2172321,6291456,2172353,6291456,2172385,6291456,2172417,6291456,2172449,6291456,2172481,6291456]),new Uint32Array([2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0]),new Uint32Array([2195105,2195137,2195169,2195201,2195233,2195265,2195297,2195329,2195361,2195393,2195425,2195457,2195489,2195521,2195553,2195585]),new Uint32Array([2141542,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2105601,2112289,2108193,2112481,2112577,2098177,2098305,2108321,2108289,2100865,2113153,2108481,2113345,2113441,2098209,2111137]),new Uint32Array([2108417,2182785,2182817,2182849,2170561,2170529,2182881,2182913,2182945,2182977,2183009,2183041,2183073,2183105,2170657,2183137]),new Uint32Array([6291456,0,6291456,6291456,6291456,6291456,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2229442,2229506,2229570,2229634,2229698,2229762,2229826,2229890,2229954,2230018,2230082,2230146,2230210,2230274,2230338,2230402]),new Uint32Array([2204577,6291456,2204609,6291456,2204641,6291456,2204673,6291456,2204705,6291456,2204737,6291456,2204769,6291456,2204801,6291456]),new Uint32Array([2132226,2132514,2163650,2132610,2160450,2133090,2133186,2160514,2160578,2160642,2133570,2106178,2160706,2133858,2160770,2160834]),new Uint32Array([2113729,2113825,2113921,2114017,2114113,2114209,2114305,2114401,2114497,2114593,2114689,2114785,2114881,2114977,2115073,2115169]),new Uint32Array([6291456,6291456,0,6291456,6291456,6291456,6291456,0,0,0,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2174113,2174145,2174145,2174177,2174209,2174241,2174273,2174305,2149057,2236897,2173825,2173889,2173921,2174241,2174113,2174081]),new Uint32Array([2254306,2254370,2254433,2254465,2210113,2254497,2254529,2254561,2254593,2254625,2254657,2220705,2254689,2254721,2254753,0]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0,0,0,0,0,0,0,0]),new Uint32Array([2207009,2207041,2207073,2207105,2207137,2207169,2207201,2207233,2207265,2207297,2207329,2207361,2207393,2207425,2207457,2207489]),new Uint32Array([2108515,2108611,2100740,2108707,2108803,2108899,2108995,2109091,2109187,2109283,2109379,2109475,2109571,2109667,2109763,2100738]),new Uint32Array([2168705,6291456,2168737,6291456,2168769,6291456,2168801,6291456,2168833,6291456,2168865,6291456,2168897,6291456,2168929,6291456]),new Uint32Array([2116513,2192385,2192417,2192449,2192481,2192513,2116609,2192545,2192577,2192609,2192641,2117185,2192673,2192705,2192737,2192769]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,10538050,10538114,10538178,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2172001,6291456,2172033,6291456,2172065,6291456,2172097,6291456,2172129,6291456,2172161,6291456,2172193,6291456,2172225,6291456]),new Uint32Array([23068672,6291456,6291456,6291456,6291456,2144066,2144130,2144194,2144258,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,23068672,23068672,23068672,6291456,23068672,23068672]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0]),new Uint32Array([2124674,2124770,2123875,2123971,2124067,2124163,2124259,2124355,2124451,2124547,2124643,2124739,2124835,2124931,2125027,2125123]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0]),new Uint32Array([23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([2206497,2206529,2206561,2206593,2206625,2206657,2206689,2206721,2206753,2206785,2206817,2206849,2206881,2206913,2206945,2206977]),new Uint32Array([6291456,6291456,6291456,2100610,2100611,6291456,2107842,2107843,6291456,6291456,6291456,6291456,10537922,6291456,10537986,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456,6291456,6291456,6291456,6291456,23068672,0]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,23068672,0,0,0,0,0,0,0,0,6291456,6291456]),new Uint32Array([2205121,6291456,2205153,6291456,6291456,6291456,2205185,6291456,2205217,6291456,2205249,6291456,2205281,6291456,2205313,6291456]),new Uint32Array([2186305,6291456,2186337,6291456,2186369,6291456,2186401,6291456,2186433,6291456,2186465,6291456,2186497,6291456,2186529,6291456]),new Uint32Array([2188641,6291456,6291456,6291456,6291456,2098241,2098241,2108353,2100897,2111905,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,0,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456]),new Uint32Array([23068672,23068672,23068672,23068672,23068672,6291456,6291456,23068672,23068672,6291456,23068672,23068672,23068672,23068672,6291456,6291456]),new Uint32Array([6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,6291456,0,0,0,0,0,0]),new Uint32Array([23068672,23068672,23068672,0,0,0,0,0,0,0,0,23068672,23068672,23068672,23068672,23068672]),new Uint32Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23068672]),new Uint32Array([2139331,2139427,2139523,2139043,2133571,2132611,2139619,2139715,0,0,0,0,0,0,0,0]),new Uint32Array([2173409,6291456,2173441,6291456,2173473,6291456,2173505,6291456,0,0,10532546,6291456,6291456,6291456,10562145,2173569]),new Uint32Array([23068672,23068672,18923778,23068672,23068672,23068672,23068672,18923842,23068672,23068672,23068672,23068672,18923906,23068672,23068672,23068672]),new Uint32Array([2218561,2218593,2218625,2218657,2218689,2218721,2218753,2216929,2218785,2218817,2218849,2218881,2218914,2218977,0,0]),new Uint32Array([2221729,2157185,2157505,2157569,2157953,2158017,2221761,2158529,2158593,10577185,2157058,2157122,2129923,2130019,2157186,2157250]),new Uint32Array([6291456,6291456,6291456,6291456,0,0,0,0,0,0,0,0,0,0,0,0]),new Uint32Array([2105505,2098241,2108353,2108417,2105825,2111713,2100897,2111905,2105473,2105569,2105601,2112289,2108193,2112481,2112577,2098177]),new Uint32Array([6291456,6291456,23068672,23068672,23068672,6291456,6291456,0,0,0,0,0,0,0,0,0]),new Uint32Array([6291456,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,23068672,6291456,6291456])],blockIdxes=new Uint16Array([231,231,591,150,163,445,357,2,135,135,353,146,156,441,91,91,305,73,723,56,681,369,70,92,107,155,161,21,403,573,395,552,726,704,554,61,432,91,91,91,91,91,91,264,91,78,668,91,703,703,703,703,516,703,703,746,102,426,158,91,506,539,354,596,576,556,557,91,91,91,115,306,60,28,191,329,270,117,377,553,6,58,52,414,461,622,91,91,257,597,703,81,418,91,433,485,675,635,91,91,334,703,91,727,91,91,91,91,91,165,741,91,481,29,91,703,673,91,91,91,91,91,72,472,91,91,334,40,91,66,176,700,91,159,555,135,135,135,91,460,135,9,36,703,266,91,91,728,703,76,384,91,463,468,79,488,51,129,175,293,685,468,79,105,170,194,675,623,383,421,79,111,309,185,175,504,89,468,79,111,459,456,175,729,447,249,661,59,276,430,675,555,190,124,79,606,152,453,175,627,131,124,79,232,152,444,175,30,529,124,91,174,605,239,175,91,665,134,91,104,241,289,675,653,589,91,91,23,151,565,135,135,342,91,80,375,399,562,135,135,699,22,91,431,157,407,167,620,34,68,747,204,98,555,135,135,91,91,334,440,91,302,480,200,518,394,135,135,658,91,91,100,91,91,91,91,91,700,589,91,91,91,91,91,91,91,91,91,91,91,91,91,366,427,91,91,366,91,91,411,711,75,91,91,91,711,91,91,91,542,91,376,91,742,91,91,91,91,91,101,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,589,376,91,91,91,91,91,110,474,367,91,752,91,37,474,429,91,91,91,618,703,585,742,742,320,742,91,91,91,91,91,110,213,91,7,91,91,91,91,578,91,700,731,731,712,91,481,485,91,91,565,91,742,575,91,91,91,261,91,91,91,145,703,130,742,742,481,335,135,135,135,135,528,91,91,512,272,91,334,538,545,91,753,91,91,91,72,207,91,91,512,607,495,91,91,91,692,391,46,697,729,116,112,189,91,91,368,454,203,96,484,489,91,323,710,437,703,703,703,138,218,281,638,224,53,233,361,701,425,492,8,119,738,148,278,683,625,560,252,274,147,296,55,397,140,393,16,166,212,118,471,514,382,494,511,734,725,567,120,325,500,310,153,91,135,703,703,285,416,671,677,483,739,722,290,290,690,91,91,91,91,91,91,91,91,91,520,351,91,91,5,91,91,91,91,91,91,91,91,91,91,91,388,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,173,135,555,135,689,214,47,595,95,363,705,262,339,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,566,91,91,91,91,91,91,88,91,91,91,91,91,458,91,91,91,91,91,91,91,91,91,631,91,350,91,91,91,91,91,91,168,527,27,91,91,700,624,33,162,672,381,477,626,408,358,646,91,91,497,91,91,91,364,599,91,173,206,206,206,206,703,703,91,91,91,91,91,135,135,135,91,44,91,91,91,91,91,590,724,63,502,259,287,659,707,609,355,422,491,99,633,195,135,135,114,91,341,479,589,91,91,91,91,619,91,91,91,91,91,561,541,91,91,172,467,509,473,598,279,312,91,555,91,91,750,91,141,295,86,186,490,26,716,243,688,48,171,318,404,311,230,225,563,121,217,694,628,340,730,41,12,253,69,208,378,180,676,419,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,578,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,376,91,91,91,173,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,565,135,515,322,179,283,338,275,91,91,91,91,91,592,91,91,43,535,603,202,714,265,374,737,14,136,84,135,135,392,284,91,226,742,91,91,91,729,732,91,91,512,736,742,703,379,91,91,122,91,652,508,91,376,266,91,91,696,630,482,660,700,91,91,300,109,574,330,91,271,91,91,91,291,442,476,334,303,693,674,206,91,91,187,729,642,733,721,113,365,91,91,3,742,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,750,91,547,91,91,565,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,62,39,314,443,398,128,402,507,370,413,269,584,568,250,400,54,344,237,614,526,315,695,748,396,551,17,294,662,19,123,135,135,327,401,749,247,645,478,663,333,362,571,137,18,657,610,90,280,546,519,133,83,636,228,201,522,493,455,177,715,570,436,0,49,313,410,615,74,135,149,142,331,15,282,385,496,745,135,135,650,691,510,703,639,532,465,564,602,205,412,428,304,199,594,244,634,487,648,587,583,469,267,423,644,164,32,172,13,540,97,569,135,686,91,75,20,481,481,135,135,91,91,91,91,91,91,91,555,337,91,91,577,91,91,91,91,700,565,185,135,135,91,91,65,135,135,135,135,135,135,135,135,91,376,91,91,91,185,254,565,91,91,209,91,555,91,91,343,91,67,91,91,601,578,135,135,198,499,687,91,91,91,91,91,91,481,742,435,24,521,91,565,91,91,729,91,91,91,346,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,173,91,578,729,135,135,135,135,135,135,135,135,135,352,91,91,144,91,530,91,91,91,700,627,135,135,135,91,11,91,680,91,640,135,135,135,135,91,91,91,240,91,248,91,91,188,637,91,641,110,110,91,91,91,91,135,135,91,91,417,173,91,91,91,380,91,350,91,621,91,227,559,135,135,135,135,135,91,91,91,91,110,135,135,135,713,31,608,462,91,91,91,288,91,91,223,742,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,700,135,135,135,135,135,135,135,135,91,91,729,91,72,71,135,135,135,135,135,135,135,135,91,173,545,91,91,38,706,248,91,744,545,91,91,579,657,91,110,742,545,91,652,740,303,91,91,531,545,91,91,696,94,91,589,485,91,421,656,735,135,135,135,135,420,67,742,91,91,371,216,742,669,468,79,649,459,536,108,196,135,135,135,135,135,135,135,135,91,91,91,684,106,57,135,135,91,91,91,703,664,742,135,135,135,135,135,135,135,135,135,135,91,91,371,183,254,544,135,135,91,91,91,703,317,742,376,135,91,91,334,93,742,135,135,135,91,542,731,91,135,135,135,135,135,135,135,135,135,135,135,135,91,91,656,4,135,135,135,135,135,135,77,501,91,91,91,319,135,135,135,135,135,135,135,135,135,135,572,91,91,405,42,135,550,91,91,356,720,549,91,91,341,448,336,135,91,91,91,110,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,79,91,371,582,578,91,376,91,91,679,298,109,135,135,135,135,486,91,91,470,475,742,503,91,586,210,742,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,251,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,513,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,742,135,135,135,135,135,135,91,91,91,91,91,91,700,485,91,91,91,91,91,91,91,91,91,91,91,91,750,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,700,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,173,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,110,91,700,482,135,135,135,135,135,135,91,481,85,91,91,91,106,578,10,421,438,91,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,682,332,91,91,91,555,135,135,135,135,135,135,91,91,91,91,260,50,703,703,667,545,135,135,135,135,750,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,729,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,336,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,700,135,135,135,336,258,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,565,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,555,376,110,25,655,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,578,91,91,154,91,91,215,192,743,611,91,394,523,708,91,110,135,91,91,91,91,197,135,135,135,135,135,135,135,135,135,91,750,91,91,91,91,91,173,91,110,135,135,135,135,135,135,135,135,262,126,581,182,709,87,277,450,464,132,588,632,449,262,126,581,612,235,751,345,593,698,193,434,103,705,262,126,581,182,709,751,277,450,464,193,434,103,705,262,126,581,373,238,286,169,125,328,308,446,273,359,616,617,242,533,718,533,452,321,466,537,139,211,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,703,703,703,525,703,703,604,660,580,524,597,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,582,389,127,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,376,706,482,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,656,640,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,324,109,135,135,301,326,439,91,178,482,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,589,91,91,91,485,135,135,135,135,589,91,91,481,135,135,135,135,135,135,135,135,135,135,135,135,406,255,160,600,424,651,415,220,82,360,299,360,135,135,135,657,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,565,91,91,91,91,91,91,750,700,589,589,589,91,578,629,236,654,262,558,91,348,91,91,268,376,135,135,135,675,91,372,184,234,349,517,647,578,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,578,376,555,91,91,91,91,91,91,91,750,91,91,91,91,91,110,565,135,565,91,91,91,729,742,91,91,729,91,481,135,135,135,135,135,686,91,91,91,91,91,91,717,91,91,390,91,1,91,91,91,91,91,91,91,91,750,481,643,336,578,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,173,135,135,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,485,91,91,91,91,91,91,91,91,91,91,91,91,91,481,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,657,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,91,185,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,409,498,221,457,219,143,534,229,548,347,678,256,64,45,316,670,246,222,451,245,666,613,297,181,387,35,543,719,263,702,505,292,386,307,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135,135]);return{mapStr:"صلى الله عليه وسلمجل جلالهキロメートルrad∕s2エスクードキログラムキロワットグラムトンクルゼイロサンチームパーセントピアストルファラッドブッシェルヘクタールマンションミリバールレントゲン′′′′1⁄10viii(10)(11)(12)(13)(14)(15)(16)(17)(18)(19)(20)∫∫∫∫(오전)(오후)アパートアルファアンペアイニングエーカーカラットカロリーキュリーギルダークローネサイクルシリングバーレルフィートポイントマイクロミクロンメガトンリットルルーブル株式会社kcalm∕s2c∕kgاكبرمحمدصلعمرسولریال1⁄41⁄23⁄4 ̈́ྲཱྀླཱྀ ̈͂ ̓̀ ̓́ ̓͂ ̔̀ ̔́ ̔͂ ̈̀‵‵‵a/ca/sc/oc/utelfax1⁄71⁄91⁄32⁄31⁄52⁄53⁄54⁄51⁄65⁄61⁄83⁄85⁄87⁄8xii0⁄3∮∮∮(1)(2)(3)(4)(5)(6)(7)(8)(9)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(l)(m)(n)(o)(p)(q)(r)(s)(t)(u)(v)(w)(x)(y)(z)::====(ᄀ)(ᄂ)(ᄃ)(ᄅ)(ᄆ)(ᄇ)(ᄉ)(ᄋ)(ᄌ)(ᄎ)(ᄏ)(ᄐ)(ᄑ)(ᄒ)(가)(나)(다)(라)(마)(바)(사)(아)(자)(차)(카)(타)(파)(하)(주)(一)(二)(三)(四)(五)(六)(七)(八)(九)(十)(月)(火)(水)(木)(金)(土)(日)(株)(有)(社)(名)(特)(財)(祝)(労)(代)(呼)(学)(監)(企)(資)(協)(祭)(休)(自)(至)pte10月11月12月ergltdアールインチウォンオンスオームカイリガロンガンマギニーケースコルナコーポセンチダースノットハイツパーツピクルフランペニヒヘルツペンスページベータボルトポンドホールホーンマイルマッハマルクヤードヤールユアンルピー10点11点12点13点14点15点16点17点18点19点20点21点22点23点24点hpabardm2dm3khzmhzghzthzmm2cm2km2mm3cm3km3kpampagpalogmilmolppmv∕ma∕m10日11日12日13日14日15日16日17日18日19日20日21日22日23日24日25日26日27日28日29日30日31日galffifflשּׁשּׂ ٌّ ٍّ َّ ُّ ِّ ّٰـَّـُّـِّتجمتحجتحمتخمتمجتمحتمخجمححميحمىسحجسجحسجىسمحسمجسممصححصممشحمشجيشمخشممضحىضخمطمحطممطميعجمعممعمىغممغميغمىفخمقمحقمملحملحيلحىلججلخملمحمحجمحيمجحمجممخممجخهمجهممنحمنحىنجمنجىنمينمىيممبخيتجيتجىتخيتخىتميتمىجميجحىجمىسخىصحيشحيضحيلجيلمييحييجييميمميقمينحيعميكمينجحمخيلجمكممجحيحجيمجيفميبحيسخينجيصلےقلے𝅘𝅥𝅮𝅘𝅥𝅯𝅘𝅥𝅰𝅘𝅥𝅱𝅘𝅥𝅲𝆹𝅥𝅮𝆺𝅥𝅮𝆹𝅥𝅯𝆺𝅥𝅯〔s〕ppv〔本〕〔三〕〔二〕〔安〕〔点〕〔打〕〔盗〕〔勝〕〔敗〕 ̄ ́ ̧ssi̇ijl·ʼndžljnjdz ̆ ̇ ̊ ̨ ̃ ̋ ιեւاٴوٴۇٴيٴक़ख़ग़ज़ड़ढ़फ़य़ড়ঢ়য়ਲ਼ਸ਼ਖ਼ਗ਼ਜ਼ਫ਼ଡ଼ଢ଼ําໍາຫນຫມགྷཌྷདྷབྷཛྷཀྵཱཱིུྲྀླྀྒྷྜྷྡྷྦྷྫྷྐྵaʾἀιἁιἂιἃιἄιἅιἆιἇιἠιἡιἢιἣιἤιἥιἦιἧιὠιὡιὢιὣιὤιὥιὦιὧιὰιαιάιᾶι ͂ὴιηιήιῆιὼιωιώιῶι ̳!! ̅???!!?rs°c°fnosmtmivix⫝̸ ゙ ゚よりコト333435참고주의363738394042444546474849503月4月5月6月7月8月9月hgev令和ギガデシドルナノピコビルペソホンリラレムdaauovpciu平成昭和大正明治naμakakbmbgbpfnfμfμgmgμlmldlklfmnmμmpsnsμsmsnvμvkvpwnwμwmwkwkωmωbqcccddbgyhainkkktlnlxphprsrsvwbstմնմեմիվնմխיִײַשׁשׂאַאָאּבּגּדּהּוּזּטּיּךּכּלּמּנּסּףּפּצּקּרּתּוֹבֿכֿפֿאלئائەئوئۇئۆئۈئېئىئجئحئمئيبجبمبىبيتىتيثجثمثىثيخحضجضمطحظمغجفجفحفىفيقحقىقيكاكجكحكخكلكىكينخنىنيهجهىهييىذٰرٰىٰئرئزئنبزبنترتزتنثرثزثنمانرنزننيريزئخئهبهتهصخنههٰثهسهشهطىطيعىعيغىغيسىسيشىشيصىصيضىضيشخشرسرصرضراً ًـًـّ ْـْلآلألإ𝅗𝅥0,1,2,3,4,5,6,7,8,9,wzhvsdwcmcmdmrdjほかココàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįĵķĺļľłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷÿźżɓƃƅɔƈɖɗƌǝəɛƒɠɣɩɨƙɯɲɵơƣƥʀƨʃƭʈưʊʋƴƶʒƹƽǎǐǒǔǖǘǚǜǟǡǣǥǧǩǫǭǯǵƕƿǹǻǽǿȁȃȅȇȉȋȍȏȑȓȕȗșțȝȟƞȣȥȧȩȫȭȯȱȳⱥȼƚⱦɂƀʉʌɇɉɋɍɏɦɹɻʁʕͱͳʹͷ;ϳέίόύβγδεζθκλνξοπρστυφχψϊϋϗϙϛϝϟϡϣϥϧϩϫϭϯϸϻͻͼͽѐёђѓєѕіїјљњћќѝўџабвгдежзийклмнопрстуфхцчшщъыьэюяѡѣѥѧѩѫѭѯѱѳѵѷѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӂӄӆӈӊӌӎӑӓӕӗәӛӝӟӡӣӥӧөӫӭӯӱӳӵӷӹӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣԥԧԩԫԭԯաբգդզէըթժլծկհձղճյշոչպջռստրցփքօֆ་ⴧⴭნᏰᏱᏲᏳᏴᏵꙋაბგდევზთიკლმოპჟრსტუფქღყშჩცძწჭხჯჰჱჲჳჴჵჶჷჸჹჺჽჾჿɐɑᴂɜᴖᴗᴝᴥɒɕɟɡɥɪᵻʝɭᶅʟɱɰɳɴɸʂƫᴜʐʑḁḃḅḇḉḋḍḏḑḓḕḗḙḛḝḟḡḣḥḧḩḫḭḯḱḳḵḷḹḻḽḿṁṃṅṇṉṋṍṏṑṓṕṗṙṛṝṟṡṣṥṧṩṫṭṯṱṳṵṷṹṻṽṿẁẃẅẇẉẋẍẏẑẓẕạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹỻỽỿἐἑἒἓἔἕἰἱἲἳἴἵἶἷὀὁὂὃὄὅὑὓὕὗᾰᾱὲΐῐῑὶΰῠῡὺῥ`ὸ‐+−∑〈〉ⰰⰱⰲⰳⰴⰵⰶⰷⰸⰹⰺⰻⰼⰽⰾⰿⱀⱁⱂⱃⱄⱅⱆⱇⱈⱉⱊⱋⱌⱍⱎⱏⱐⱑⱒⱓⱔⱕⱖⱗⱘⱙⱚⱛⱜⱝⱞⱡɫᵽɽⱨⱪⱬⱳⱶȿɀⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱⲳⲵⲷⲹⲻⲽⲿⳁⳃⳅⳇⳉⳋⳍⳏⳑⳓⳕⳗⳙⳛⳝⳟⳡⳣⳬⳮⳳⵡ母龟丨丶丿乙亅亠人儿入冂冖冫几凵刀力勹匕匚匸卜卩厂厶又口囗士夂夊夕女子宀寸小尢尸屮山巛工己巾干幺广廴廾弋弓彐彡彳心戈戶手支攴文斗斤方无曰欠止歹殳毋比毛氏气爪父爻爿片牙牛犬玄玉瓜瓦甘生用田疋疒癶白皮皿目矛矢石示禸禾穴立竹米糸缶网羊羽老而耒耳聿肉臣臼舌舛舟艮色艸虍虫血行衣襾見角言谷豆豕豸貝赤走足身車辛辰辵邑酉釆里長門阜隶隹雨靑非面革韋韭音頁風飛食首香馬骨高髟鬥鬯鬲鬼魚鳥鹵鹿麥麻黃黍黑黹黽鼎鼓鼠鼻齊齒龍龜龠.〒卄卅ᄁᆪᆬᆭᄄᆰᆱᆲᆳᆴᆵᄚᄈᄡᄊ짜ᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵᄔᄕᇇᇈᇌᇎᇓᇗᇙᄜᇝᇟᄝᄞᄠᄢᄣᄧᄩᄫᄬᄭᄮᄯᄲᄶᅀᅇᅌᇱᇲᅗᅘᅙᆄᆅᆈᆑᆒᆔᆞᆡ上中下甲丙丁天地問幼箏우秘男適優印注項写左右医宗夜テヌモヨヰヱヲꙁꙃꙅꙇꙉꙍꙏꙑꙓꙕꙗꙙꙛꙝꙟꙡꙣꙥꙧꙩꙫꙭꚁꚃꚅꚇꚉꚋꚍꚏꚑꚓꚕꚗꚙꚛꜣꜥꜧꜩꜫꜭꜯꜳꜵꜷꜹꜻꜽꜿꝁꝃꝅꝇꝉꝋꝍꝏꝑꝓꝕꝗꝙꝛꝝꝟꝡꝣꝥꝧꝩꝫꝭꝯꝺꝼᵹꝿꞁꞃꞅꞇꞌꞑꞓꞗꞙꞛꞝꞟꞡꞣꞥꞧꞩɬʞʇꭓꞵꞷꞹꞻꞽꞿꟃꞔᶎꬷꭒᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯ豈更賈滑串句契喇奈懶癩羅蘿螺裸邏樂洛烙珞落酪駱亂卵欄爛蘭鸞嵐濫藍襤拉臘蠟廊朗浪狼郎來冷勞擄櫓爐盧蘆虜路露魯鷺碌祿綠菉錄論壟弄籠聾牢磊賂雷壘屢樓淚漏累縷陋勒肋凜凌稜綾菱陵讀拏諾丹寧怒率異北磻便復不泌數索參塞省葉說殺沈拾若掠略亮兩凉梁糧良諒量勵呂廬旅濾礪閭驪麗黎曆歷轢年憐戀撚漣煉璉秊練聯輦蓮連鍊列劣咽烈裂廉念捻殮簾獵囹嶺怜玲瑩羚聆鈴零靈領例禮醴隸惡了僚寮尿料燎療蓼遼暈阮劉杻柳流溜琉留硫紐類戮陸倫崙淪輪律慄栗隆利吏履易李梨泥理痢罹裏裡離匿溺吝燐璘藺隣鱗麟林淋臨笠粒狀炙識什茶刺切度拓糖宅洞暴輻降廓兀嗀塚晴凞猪益礼神祥福靖精蘒諸逸都飯飼館鶴郞隷侮僧免勉勤卑喝嘆器塀墨層悔慨憎懲敏既暑梅海渚漢煮爫琢碑祉祈祐祖禍禎穀突節縉繁署者臭艹著褐視謁謹賓贈辶難響頻恵𤋮舘並况全侀充冀勇勺啕喙嗢墳奄奔婢嬨廒廙彩徭惘慎愈慠戴揄搜摒敖望杖滛滋瀞瞧爵犯瑱甆画瘝瘟盛直睊着磌窱类絛缾荒華蝹襁覆調請諭變輸遲醙鉶陼韛頋鬒𢡊𢡄𣏕㮝䀘䀹𥉉𥳐𧻓齃龎עםٱٻپڀٺٿٹڤڦڄڃچڇڍڌڎڈژڑکگڳڱںڻۀہھۓڭۋۅۉ、〖〗—–_{}【】《》「」『』[]#&*-<>\\$%@ءؤة\"'^|~⦅⦆・ゥャ¢£¬¦¥₩│←↑→↓■○𐐨𐐩𐐪𐐫𐐬𐐭𐐮𐐯𐐰𐐱𐐲𐐳𐐴𐐵𐐶𐐷𐐸𐐹𐐺𐐻𐐼𐐽𐐾𐐿𐑀𐑁𐑂𐑃𐑄𐑅𐑆𐑇𐑈𐑉𐑊𐑋𐑌𐑍𐑎𐑏𐓘𐓙𐓚𐓛𐓜𐓝𐓞𐓟𐓠𐓡𐓢𐓣𐓤𐓥𐓦𐓧𐓨𐓩𐓪𐓫𐓬𐓭𐓮𐓯𐓰𐓱𐓲𐓳𐓴𐓵𐓶𐓷𐓸𐓹𐓺𐓻𐳀𐳁𐳂𐳃𐳄𐳅𐳆𐳇𐳈𐳉𐳊𐳋𐳌𐳍𐳎𐳏𐳐𐳑𐳒𐳓𐳔𐳕𐳖𐳗𐳘𐳙𐳚𐳛𐳜𐳝𐳞𐳟𐳠𐳡𐳢𐳣𐳤𐳥𐳦𐳧𐳨𐳩𐳪𐳫𐳬𐳭𐳮𐳯𐳰𐳱𐳲𑣀𑣁𑣂𑣃𑣄𑣅𑣆𑣇𑣈𑣉𑣊𑣋𑣌𑣍𑣎𑣏𑣐𑣑𑣒𑣓𑣔𑣕𑣖𑣗𑣘𑣙𑣚𑣛𑣜𑣝𑣞𑣟𖹠𖹡𖹢𖹣𖹤𖹥𖹦𖹧𖹨𖹩𖹪𖹫𖹬𖹭𖹮𖹯𖹰𖹱𖹲𖹳𖹴𖹵𖹶𖹷𖹸𖹹𖹺𖹻𖹼𖹽𖹾𖹿ıȷ∇∂𞤢𞤣𞤤𞤥𞤦𞤧𞤨𞤩𞤪𞤫𞤬𞤭𞤮𞤯𞤰𞤱𞤲𞤳𞤴𞤵𞤶𞤷𞤸𞤹𞤺𞤻𞤼𞤽𞤾𞤿𞥀𞥁𞥂𞥃ٮڡٯ字双多解交映無前後再新初終販声吹演投捕遊指禁空合満申割営配得可丽丸乁𠄢你侻倂偺備像㒞𠘺兔兤具𠔜㒹內𠕋冗冤仌冬𩇟刃㓟刻剆剷㔕包匆卉博即卽卿𠨬灰及叟𠭣叫叱吆咞吸呈周咢哶唐啓啣善喫喳嗂圖圗噑噴壮城埴堍型堲報墬𡓤売壷夆夢奢𡚨𡛪姬娛娧姘婦㛮嬈嬾𡧈寃寘寳𡬘寿将㞁屠峀岍𡷤嵃𡷦嵮嵫嵼巡巢㠯巽帨帽幩㡢𢆃㡼庰庳庶𪎒𢌱舁弢㣇𣊸𦇚形彫㣣徚忍志忹悁㤺㤜𢛔惇慈慌慺憲憤憯懞戛扝抱拔捐𢬌挽拼捨掃揤𢯱搢揅掩㨮摩摾撝摷㩬敬𣀊旣書晉㬙㬈㫤冒冕最暜肭䏙朡杞杓𣏃㭉柺枅桒𣑭梎栟椔楂榣槪檨𣚣櫛㰘次𣢧歔㱎歲殟殻𣪍𡴋𣫺汎𣲼沿泍汧洖派浩浸涅𣴞洴港湮㴳滇𣻑淹潮𣽞𣾎濆瀹瀛㶖灊災灷炭𠔥煅𤉣熜爨牐𤘈犀犕𤜵𤠔獺王㺬玥㺸瑇瑜璅瓊㼛甤𤰶甾𤲒𢆟瘐𤾡𤾸𥁄㿼䀈𥃳𥃲𥄙𥄳眞真瞋䁆䂖𥐝硎䃣𥘦𥚚𥛅秫䄯穊穏𥥼𥪧䈂𥮫篆築䈧𥲀糒䊠糨糣紀𥾆絣䌁緇縂繅䌴𦈨𦉇䍙𦋙罺𦌾羕翺𦓚𦔣聠𦖨聰𣍟䏕育脃䐋脾媵𦞧𦞵𣎓𣎜舄辞䑫芑芋芝劳花芳芽苦𦬼茝荣莭茣莽菧荓菊菌菜𦰶𦵫𦳕䔫蓱蓳蔖𧏊蕤𦼬䕝䕡𦾱𧃒䕫虐虧虩蚩蚈蜎蛢蜨蝫螆蟡蠁䗹衠𧙧裗裞䘵裺㒻𧢮𧥦䚾䛇誠𧲨貫賁贛起𧼯𠠄跋趼跰𠣞軔𨗒𨗭邔郱鄑𨜮鄛鈸鋗鋘鉼鏹鐕𨯺開䦕閷𨵷䧦雃嶲霣𩅅𩈚䩮䩶韠𩐊䪲𩒖頩𩖶飢䬳餩馧駂駾䯎𩬰鱀鳽䳎䳭鵧𪃎䳸𪄅𪈎𪊑䵖黾鼅鼏鼖𪘀",mapChar:function(codePoint){return codePoint>=196608?codePoint>=917760&&codePoint<=917999?18874368:0:blocks[blockIdxes[codePoint>>4]][15&codePoint]}}},"object"==typeof exports?module.exports=factory():root.uts46_map=factory()},{}],2:[function(require,module,exports){(function(global){!function(root){var freeExports="object"==typeof exports&&exports&&!exports.nodeType&&exports,freeModule="object"==typeof module&&module&&!module.nodeType&&module,freeGlobal="object"==typeof global&&global;freeGlobal.global!==freeGlobal&&freeGlobal.window!==freeGlobal&&freeGlobal.self!==freeGlobal||(root=freeGlobal);var punycode,key,maxInt=2147483647,base=36,tMin=1,tMax=26,skew=38,damp=700,initialBias=72,initialN=128,delimiter="-",regexPunycode=/^xn--/,regexNonASCII=/[^\x20-\x7E]/,regexSeparators=/[\x2E\u3002\uFF0E\uFF61]/g,errors={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},baseMinusTMin=base-tMin,floor=Math.floor,stringFromCharCode=String.fromCharCode;function error(type){throw new RangeError(errors[type])}function map(array,fn){for(var length=array.length,result=[];length--;)result[length]=fn(array[length]);return result}function mapDomain(string,fn){var parts=string.split("@"),result="";return parts.length>1&&(result=parts[0]+"@",string=parts[1]),result+map((string=string.replace(regexSeparators,".")).split("."),fn).join(".")}function ucs2decode(string){for(var value,extra,output=[],counter=0,length=string.length;counter<length;)(value=string.charCodeAt(counter++))>=55296&&value<=56319&&counter<length?56320==(64512&(extra=string.charCodeAt(counter++)))?output.push(((1023&value)<<10)+(1023&extra)+65536):(output.push(value),counter--):output.push(value);return output}function ucs2encode(array){return map(array,function(value){var output="";return value>65535&&(output+=stringFromCharCode((value-=65536)>>>10&1023|55296),value=56320|1023&value),output+=stringFromCharCode(value)}).join("")}function digitToBasic(digit,flag){return digit+22+75*(digit<26)-((0!=flag)<<5)}function adapt(delta,numPoints,firstTime){var k=0;for(delta=firstTime?floor(delta/damp):delta>>1,delta+=floor(delta/numPoints);delta>baseMinusTMin*tMax>>1;k+=base)delta=floor(delta/baseMinusTMin);return floor(k+(baseMinusTMin+1)*delta/(delta+skew))}function decode(input){var out,basic,j,index,oldi,w,k,digit,t,baseMinusT,codePoint,output=[],inputLength=input.length,i=0,n=initialN,bias=initialBias;for((basic=input.lastIndexOf(delimiter))<0&&(basic=0),j=0;j<basic;++j)input.charCodeAt(j)>=128&&error("not-basic"),output.push(input.charCodeAt(j));for(index=basic>0?basic+1:0;index<inputLength;){for(oldi=i,w=1,k=base;index>=inputLength&&error("invalid-input"),((digit=(codePoint=input.charCodeAt(index++))-48<10?codePoint-22:codePoint-65<26?codePoint-65:codePoint-97<26?codePoint-97:base)>=base||digit>floor((maxInt-i)/w))&&error("overflow"),i+=digit*w,!(digit<(t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias));k+=base)w>floor(maxInt/(baseMinusT=base-t))&&error("overflow"),w*=baseMinusT;bias=adapt(i-oldi,out=output.length+1,0==oldi),floor(i/out)>maxInt-n&&error("overflow"),n+=floor(i/out),i%=out,output.splice(i++,0,n)}return ucs2encode(output)}function encode(input){var n,delta,handledCPCount,basicLength,bias,j,m,q,k,t,currentValue,inputLength,handledCPCountPlusOne,baseMinusT,qMinusT,output=[];for(inputLength=(input=ucs2decode(input)).length,n=initialN,delta=0,bias=initialBias,j=0;j<inputLength;++j)(currentValue=input[j])<128&&output.push(stringFromCharCode(currentValue));for(handledCPCount=basicLength=output.length,basicLength&&output.push(delimiter);handledCPCount<inputLength;){for(m=maxInt,j=0;j<inputLength;++j)(currentValue=input[j])>=n&&currentValue<m&&(m=currentValue);for(m-n>floor((maxInt-delta)/(handledCPCountPlusOne=handledCPCount+1))&&error("overflow"),delta+=(m-n)*handledCPCountPlusOne,n=m,j=0;j<inputLength;++j)if((currentValue=input[j])<n&&++delta>maxInt&&error("overflow"),currentValue==n){for(q=delta,k=base;!(q<(t=k<=bias?tMin:k>=bias+tMax?tMax:k-bias));k+=base)qMinusT=q-t,baseMinusT=base-t,output.push(stringFromCharCode(digitToBasic(t+qMinusT%baseMinusT,0))),q=floor(qMinusT/baseMinusT);output.push(stringFromCharCode(digitToBasic(q,0))),bias=adapt(delta,handledCPCountPlusOne,handledCPCount==basicLength),delta=0,++handledCPCount}++delta,++n}return output.join("")}if(punycode={version:"1.4.1",ucs2:{decode:ucs2decode,encode:ucs2encode},decode:decode,encode:encode,toASCII:function(input){return mapDomain(input,function(string){return regexNonASCII.test(string)?"xn--"+encode(string):string})},toUnicode:function(input){return mapDomain(input,function(string){return regexPunycode.test(string)?decode(string.slice(4).toLowerCase()):string})}},freeExports&&freeModule)if(module.exports==freeExports)freeModule.exports=punycode;else for(key in punycode)punycode.hasOwnProperty(key)&&(freeExports[key]=punycode[key]);else root.punycode=punycode}(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],3:[function(require,module,exports){var root,factory;root=this,factory=function(punycode,idnaMap){function mapLabel(label,useStd3ASCII,transitional){for(var mapped=[],chars=punycode.ucs2.decode(label),i=0;i<chars.length;i++){var cp=chars[i],ch=punycode.ucs2.encode([chars[i]]),composite=idnaMap.mapChar(cp),flags=composite>>23,kind=composite>>21&3,index=composite>>5&65535,length=31&composite,value=idnaMap.mapStr.substr(index,length);if(0===kind||useStd3ASCII&&1&flags)throw new Error("Illegal char "+ch);1===kind?mapped.push(value):2===kind?mapped.push(transitional?value:ch):3===kind&&mapped.push(ch)}return mapped.join("").normalize("NFC")}function process(domain,transitional,useStd3ASCII){void 0===useStd3ASCII&&(useStd3ASCII=!1);var labels=mapLabel(domain,useStd3ASCII,transitional).split(".");return(labels=labels.map(function(label){return label.startsWith("xn--")?validateLabel(label=punycode.decode(label.substring(4)),useStd3ASCII,!1):validateLabel(label,useStd3ASCII,transitional),label})).join(".")}function validateLabel(label,useStd3ASCII,transitional){if("-"===label[2]&&"-"===label[3])throw new Error("Failed to validate "+label);if(label.startsWith("-")||label.endsWith("-"))throw new Error("Failed to validate "+label);if(label.includes("."))throw new Error("Failed to validate "+label);if(mapLabel(label,useStd3ASCII,transitional)!==label)throw new Error("Failed to validate "+label);var ch=label.codePointAt(0);if(idnaMap.mapChar(ch)&2<<23)throw new Error("Label contains illegal character: "+ch)}function toAscii(domain,options){void 0===options&&(options={});var i,transitional=!("transitional"in options)||options.transitional,useStd3ASCII="useStd3ASCII"in options&&options.useStd3ASCII,verifyDnsLength="verifyDnsLength"in options&&options.verifyDnsLength,asciiLabels=process(domain,transitional,useStd3ASCII).split(".").map(punycode.toASCII),asciiString=asciiLabels.join(".");if(verifyDnsLength){if(asciiString.length<1||asciiString.length>253)throw new Error("DNS name has wrong length: "+asciiString);for(i=0;i<asciiLabels.length;i++){var label=asciiLabels[i];if(label.length<1||label.length>63)throw new Error("DNS label has wrong length: "+label)}}return asciiString}function toUnicode(domain,options){return void 0===options&&(options={}),process(domain,!1,"useStd3ASCII"in options&&options.useStd3ASCII)}return{toUnicode:toUnicode,toAscii:toAscii,convert:function(domains){const isArrayInput=Array.isArray(domains);isArrayInput||(domains=[domains]);let results={IDN:[],PC:[]};return domains.forEach(domain=>{let pc,tmp;try{tmp={PC:pc=toAscii(domain,{transitional:!domain.match(/\.(?:be|ca|de|fr|pm|re|swiss|tf|wf|yt)\.?$/)}),IDN:toUnicode(pc)}}catch(e){tmp={PC:domain,IDN:domain}}results.PC.push(tmp.PC),results.IDN.push(tmp.IDN)}),isArrayInput?results:{IDN:results.IDN[0],PC:results.PC[0]}}}},"object"==typeof exports?module.exports=factory(require("punycode"),require("./idna-map")):root.uts46=factory(root.punycode,root.idna_map)},{"./idna-map":1,punycode:2}]},{},[3])(3)});
const ShoppingCart = function () {
	this.items = {};
};
ShoppingCart.prototype.load = async function () {
	try {
		this.items = await $.ajax({
			url: '?action=getcartitems',
			type: 'GET',
		});
		if (Array.isArray(this.items)) {
			// empty list
			this.items = {};
		}
	} catch (error) {
		this.items = {};
	}
	if (Object.keys(this.items).length) {
		$('.orderbutton').css('visibility', 'visible');
	} else {
		$('.orderbutton').css('visibility', 'hidden').off('click');
	}
};
ShoppingCart.prototype.getOrder = function (sr) {
	if (this.items[sr.data.PC]) {
		return this.items[sr.data.PC];
	}
	if (this.items[sr.data.IDN]) {
		return this.items[sr.data.IDN];
	}
	return null;
};
ShoppingCart.prototype.addOrderPremium = function (sr, successmsg, errmsg) {
	// WHMCS adds premium domain data to session in their standard domain availability check
	const row = sr.data;
	$.ajax(
		`cart.php?a=checkDomain&token=${csrfToken}&domain=${row.IDN}&source&cartAddDomain&type=domain&ispapichecker=true`,
		{
			type: 'GET',
			dataType: 'json',
		},
	)
		.done(d => {
			this.addOrderDomain(sr, successmsg, errmsg);
		})
		.fail(() => {
			$.growl.error(errmsg);
		});
};
ShoppingCart.prototype.addOrderDomain = function (sr, successmsg, errmsg) {
	const row = sr.data;
	$.post(
		`${wr}/cart.php`,
		{
			a: 'addToCart',
			domain: row.IDN,
			token: csrfToken,
			whois: 0,
			sideorder: 0,
		},
		'json',
	)
		.done(function (data) {
			if (data.result !== 'added') {
				$.growl.error(errmsg);
				return;
			}
			// check if the chosen term is different to the lowest term
			// WHMCS creates the order using the lowest term
			// in that case update the order item accordingly
			const termcfg = sr.getTermConfig('register');
			const term = parseInt(row.element.find('.hxdata').data('term'), 10);
			if (term > termcfg.initialTerm) {
				$.post(
					`${wr}/cart.php`,
					{
						a: 'updateDomainPeriod',
						domain: row.IDN,
						period: term,
						token: csrfToken,
					},
					'json',
				)
					.done(function (data) {
						const rows = data.domains.filter(d => {
							return d.domain === row.IDN || d.domain === row.PC;
						});
						if (rows.length && rows[0].regperiod === term + '') {
							(async function () {
								await cart.load();
								sr.generate();
								//$.growl.notice(successmsg);
							})();
						} else {
							$.growl.error(errmsg);
						}
					})
					.fail(() => {
						$.growl.error(errmsg);
					});
			} else {
				(async function () {
					await cart.load();
					sr.generate();
					//$.growl.notice(successmsg);
				})();
			}
		})
		.fail(() => {
			$.growl.error(errmsg);
		});
};
ShoppingCart.prototype.addOrder = function (sr) {
	const errmsg = {
		title: `${translations.error_occured}!`,
		message: translations.error_addtocart,
	};
	const successmsg = {
		title: `${translations.success_occured}!`,
		message: translations.success_addtocart,
	};
	// PREMIUM DOMAIN
	if (sr.data.premiumtype) {
		this.addOrderPremium(sr, successmsg, errmsg);
		return;
	}
	// BACKORDER
	if (sr.data.status === 'TAKEN') {
		this.addBackorder(sr);
		return;
	}
	// STANDARD DOMAIN
	cart.addOrderDomain(sr, successmsg, errmsg);
};
ShoppingCart.prototype.removeOrder = function (sr) {
	const errmsg = {
		title: `${translations.error_occured}!`,
		message: translations.error_removefromcart,
	};
	const successmsg = {
		title: `${translations.success_occured}!`,
		message: translations.success_removefromcart,
	};
	// BACKORDER
	if (sr.data.status === 'TAKEN') {
		this.deleteBackorder(sr);
		return;
	}
	// PREMIUM DOMAIN
	// STANDARD DOMAIN
	cart.removeOrderDomain(sr, successmsg, errmsg);
};
ShoppingCart.prototype.removeOrderDomain = function (sr, successmsg, errmsg) {
	$.ajax('?action=deleteorder', {
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify({
			PC: sr.data.PC,
			IDN: sr.data.IDN,
		}),
	})
		.done(d => {
			if (d.success) {
				(async function () {
					await cart.load();
					sr.generate();
					//$.growl.notice(successmsg);
				})();
				return;
			}
			$.growl.error(errmsg);
		})
		.fail(() => {
			$.growl.error(errmsg);
		});
};
ShoppingCart.prototype.orderClickHandler = function (e) {
	// TODO what about domains where NO registrar/autoreg is configured
	// or registrar module is deactivated? see @DCHelper::getTLDRegistrars
	// We can add them to cart, but how does whmcs handle them later on?
	// what about premium domains with special class? how do they get registered?
	if (/^BUTTON$/.test(e.target.nodeName)) {
		return;
	}
	if (/^SPAN$/.test(e.target.nodeName)) {
		if ($(e.target).hasClass('caret')) {
			return;
		}
	}

	let eL = $(e.target).closest('div.clickable');
	if (e.data.action === 'add') {
		eL = eL.find('i.fa-square');
		eL.removeClass('far fa-square').addClass('fas fa-spinner fa-spin');
		this.addOrder(e.data.sr);
	} else {
		eL = eL.find('i.fa-check-square');
		eL.removeClass('fas fa-check-square').addClass('fas fa-spinner fa-spin');
		this.removeOrder(e.data.sr);
	}
};
ShoppingCart.prototype.addBackorder = async function (sr) {
	// we can't process the backorder product through
	// the shopping cart as only in case a backorder
	// application succeeds, an invoice has to be created
	await TPLMgr.loadTemplates(['modalboadd'], 'Client');
	TPLMgr.renderAppend('body', 'modalboadd', {
		row: sr.data,
		price: sr.data.element.find('.hxdata').text(),
	});
	$('#backorderaddModal').modal({
		backdrop: 'static',
		keyboard: false,
	});
	$('#doCreateBackorder')
		.off()
		.click(
			function () {
				this.requestBackorderAction(sr, 'Create', {
					title: `${translations.success_occured}!`,
					message: translations.backorder_created,
				});
			}.bind(this),
		);
};
ShoppingCart.prototype.deleteBackorder = function (sr) {
	this.requestBackorderAction(sr, 'Delete', {
		title: `${translations.success_occured}!`,
		message: translations.backorder_deleted,
	});
};
ShoppingCart.prototype.requestBackorderAction = function (
	sr,
	action,
	successmsg,
) {
	$.post(
		`${wr}${ds.paths.bo}backend/call.php`,
		{
			COMMAND: `${action}Backorder`,
			DOMAIN: sr.data.PC,
			TYPE: 'FULL',
		},
		'json',
	)
		.done(data => {
			// TODO: why do we have to parse this? BUG:
			// (looks like response is text/html and not json!)
			data = JSON.parse(data);
			if (data.CODE === 200) {
				if (action === 'Create') {
					sr.data.backordered = true;
					ds.backorders[sr.data.PC] = true; // TODO: data.PROPERTY.ID[0]
				} else {
					sr.data.backordered = false;
					delete ds.backorders[sr.data.PC];
				}
				sr.generate();
				//$.growl.notice(successmsg);
			} else if (data.CODE === 531) {
				$.growl.error({message: translations.login_required});
			} else {
				$.growl.error({message: translations.error_occured});
			}
		})
		.fail(() => {
			$.growl.error({message: translations.error_occured});
		});
};

const TPLMgr = {
	loadTemplates: function (tpls, type) {
		// only load templates that are not yet loaded
		tpls = tpls.filter(tpl => {
			return !$.Mustache.has(tpl);
		});
		return new Promise(resolve => {
			// --- https://github.com/jonnyreeves/jquery-Mustache#usage
			// --- https://github.com/janl/mustache.js
			const tplpath = `${wr}/modules/addons/ispapidomaincheck/lib/${type}/templates/`;
			const tplext = '.mustache';
			let count = tpls.length;
			if (!count) {
				resolve();
			} else {
				tpls.forEach(tpl => {
					$.Mustache.load(`${tplpath}${tpl}${tplext}`).done(d => {
						$.Mustache.add(tpl, d);
						count--;
						if (count === 0) {
							resolve();
						}
					});
				});
			}
		});
	},
	has: function (tpl) {
		return $.Mustache.has(tpl);
	},
	renderAppend: function (selector, tpl, data) {
		$.extend(data, {translations: translations});
		return $(selector).mustache(tpl, data).children().last();
	},
	renderBefore: function (selector, tpl, data) {
		$.extend(data, {translations: translations});
		return $(TPLMgr.renderString(tpl, data)).insertBefore(selector);
	},
	renderPrepend: function (selector, tpl, data) {
		$.extend(data, {translations: translations});
		return $(selector)
			.mustache(tpl, data, {method: 'prepend'})
			.children()
			.first();
	},
	renderString: function (tpl, data) {
		$.extend(data, {translations: translations});
		return $.Mustache.render(tpl, data);
	},
};

const SearchResult = function (row) {
	this.data = row;
	this.data.isBackorderable = false;
	if (this.data.status === 'TAKEN') {
		if (Object.prototype.hasOwnProperty.call(this.data.pricing, 'backorder')) {
			this.data.isBackorderable = true;
		}
		// FEAT not yet supported in backorder module
		// if (this.data.pricing.hasOwnProperty("backorderlite")) {
		//    this.data.isBackorderable = true
		// }
		if (this.data.isBackorderable) {
			this.data.backordered =
				Object.prototype.hasOwnProperty.call(ds.backorders, this.data.PC) ||
				Object.prototype.hasOwnProperty.call(ds.backorders, this.data.IDN);
		}
	}
};
SearchResult.prototype.fadeOut = function () {
	this.data.element.fadeOut('slow', 'linear');
};
SearchResult.prototype.fadeIn = function () {
	this.data.element.fadeIn();
};
SearchResult.prototype.getTermConfig = function (key) {
	if (!Object.prototype.hasOwnProperty.call(this.data.pricing, key)) {
		return null;
	}
	const cfg = {
		terms: Object.keys(this.data.pricing[key]).sort(),
	};
	cfg.initialTerm = cfg.terms[0];
	return cfg;
};
SearchResult.prototype.hide = function () {
	this.data.element.hide();
};
SearchResult.prototype.show = function () {
	this.data.element.show();
};
SearchResult.prototype.applyClickHandler = function () {
	const row = this.data;
	row.element.off();
	if (row.element.hasClass('clickable')) {
		row.element.click(
			{
				action: row.order || row.backordered ? 'remove' : 'add',
				sr: this,
			},
			cart.orderClickHandler.bind(cart),
		);
	}
};
SearchResult.prototype.generate = function () {
	this.data.order = cart.getOrder(this);
	switch (this.data.status) {
		case 'TAKEN':
			this.showTaken();
			break;
		case 'AVAILABLE':
			this.showAvailable();
			break;
		case 'INVALID':
			this.showInvalid();
			break;
		case 'RESERVED':
			this.showReserved();
			break;
		case 'AFTERMARKET':
			this.showAftermarket();
			break;
		default:
			// status 'UNKNOWN' and error cases
			this.showError();
			break;
	}
	if (this.data.isSearchString) {
		this.data.element.addClass(
			'searchstring-' +
				(this.data.status === 'AVAILABLE' ? 'available' : 'taken'),
		);
	}
	this.applyClickHandler();
};
SearchResult.prototype.getPrice = function (pricetype, doformat, term) {
	const currency = this.data.pricing.currency;
	const price = this.data.pricing[pricetype];
	if (price) {
		if (term) {
			if (Object.prototype.hasOwnProperty.call(price, term)) {
				if (doformat) {
					return `${currency.prefix}${price[term]}${currency.suffix}`;
				}
				return `${price[term]}`;
			}
		} else {
			if (doformat) {
				return `${currency.prefix}${price}${currency.suffix}`;
			}
			return `${price}`;
		}
	}
	return '-';
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showError = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-error" data-toggle="tooltip" title="${row.REASON}">${translations.domaincheckererror}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showInvalid = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-taken" data-toggle="tooltip" title="${translations.label_descr_invaliddn}">${translations.domaincheckerinvaliddn}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showReserved = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-reserved" data-toggle="tooltip" title="${translations.label_descr_reserveddn}">${translations.domaincheckerreserveddn}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showAftermarket = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-premium" data-toggle="tooltip" title="${translations.label_descr_aftermarket}">${translations.aftermarket}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
SearchResult.prototype.showAvailable = function () {
	const row = this.data;
	const regenerate = !!row.element.find('.hxdata').length;
	const termcfg = this.getTermConfig('register');
	if (!termcfg) {
		// registration price not configured
		row.REASON = `${translations.error_notldprice}!`;
		this.showTaken();
		return;
	}
	const group = row.pricing.group;
	const regprice = this.getPrice('register', true, termcfg.initialTerm);
	const regpriceraw = this.getPrice('register', false, termcfg.initialTerm);
	const renprice = this.getPrice('renew', true, termcfg.initialTerm);
	const multiTerms = termcfg.terms.length > 1;
	// just set this once and not again after adding to cart, we would loss the chosen term and price
	if (!regenerate) {
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.addClass('available');
		row.element
			.find('span.checkboxarea')
			.html(
				'<label><i class="far fa-square avail" aria-hidden="true"></i></label>',
			);
		row.element
			.find('div.availability')
			.html(
				`<span class="label label-hx label-hx-available">${translations.domaincheckeravailable}</span>`,
			);
		row.element.find('div.second-line.registerprice').empty();
		if (row.premiumtype) {
			// premium domain handling
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-premium">${
						translations[row.premiumtype.toLowerCase()] || row.premiumtype
					}</span>`,
				);
		} else {
			if (multiTerms) {
				let opts = '';
				termcfg.terms.forEach(term => {
					opts += `<li><a href="javascript:;">${term}${translations.unit_s_year}</li>`;
				});
				row.element
					.find('div.second-line.registerprice')
					.html(
						`<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${termcfg.initialTerm}${translations.unit_s_year} <span class="caret"></span></button><ul class="dropdown-menu">${opts}</ul>`,
					);
				row.element
					.find('.dropdown-menu li')
					.off()
					.click(this, this.switchTerm);
			}
			if (group) {
				row.element
					.find('div.availability')
					.append(
						`<span class="label label-hx label-hx-${group}">${
							translations['group' + group]
						}</span>`,
					);
			}
		}
		// display prices
		row.element
			.find('div.second-line.registerprice')
			.append(`<span class="registerprice">${regprice}</span>`);
		row.element
			.find('div.second-line.renewalprice')
			.html(
				`<span class="renewal">${translations.renewal}: ${renprice}</span>`,
			);
		// add ADDED and price to the hidden div
		row.element
			.find('span.registerprice.added')
			.html(
				`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="${termcfg.initialTerm}">${regprice}</span>`,
			);
	}

	row.element
		.find('span.checkboxarea')
		.find('i.fa-spin')
		.removeClass('fas fa-spinner fa-spin')
		.addClass(row.order ? 'fas fa-check-square' : 'far fa-square');

	if (row.order) {
		if (multiTerms) {
			row.element
				.find(`ul.dropdown-menu > li > a:contains("${row.order.regperiod}Y")`)
				.trigger('click')
				.parent('li')
				.addClass('active');
		}
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.addClass('added');
		row.element
			.find('span.checkboxarea')
			.find('i.far')
			.removeClass('far fa-square')
			.addClass('fas fa-check-square');
		row.element
			.find('div.search-result-price')
			.addClass('hidden')
			.eq(1)
			.removeClass('hidden');
	} else {
		row.element
			.find('span.checkboxarea')
			.find('i.fas')
			.removeClass('fas fa-check-square')
			.addClass('far fa-square');
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.removeClass('added');
		row.element
			.find('div.search-result-price')
			.removeClass('hidden')
			.eq(1)
			.addClass('hidden');
	}
};
SearchResult.prototype.showTaken = function () {
	const row = this.data;
	// TAKEN CASES
	//
	// (3) normal domain (NOT BACKORDERABLE)
	// to add Added and backorder price
	row.element
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-taken">${translations.domaincheckertaken}</span><span class="label label-hx label-hx-whois pt" data-domain="${row.IDN}" data-pc="${row.PC}"><i class="fa fa-question-circle"></i> ${translations.whois}</span>`,
		);
	row.element
		.find('span.domainname.domain-label, span.domainname.tld-zone')
		.removeClass('added');
	/*if (row.REASON && row.REASON.length) {
    // TODO: we could translate REASON by mapping it to translation keys using regular expressions
    // that would allow us to improve step by step
    row.element
      .find('.label-hx-taken')
      .attr('title', row.REASON)
      .attr('data-toggle', 'tooltip')
      .addClass('pt');
  }*/
	if (row.isBackorderable) {
		const renprice = this.getPrice('renew', true, 1);
		const regprice = this.getPrice('backorder', true);
		const regpriceraw = this.getPrice('backorder', false);
		row.element
			.find('span.registerprice.added')
			.html(
				`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="1">${regprice}</span>`,
			);
		row.element
			.find('div.search-result-price')
			.removeClass('hidden')
			.eq(1)
			.addClass('hidden');
		if (row.backordered) {
			// BACKORDER EXISTS
			row.element
				.find('span.domainname.domain-label, span.domainname.tld-zone')
				.addClass('added');
			row.element
				.find('span.checkboxarea')
				.html(
					'<label class="added setbackorder"><i class="fas fa-check-square avail" aria-hidden="true"></i></label>',
				);
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-backorder added">${translations.backorder}</span>`,
				)
				.find('span.taken')
				.addClass('added');
			// hide the display register and renewprice as before
			row.element
				.find('span.checkboxarea')
				.find('i.far')
				.removeClass('far fa-square')
				.addClass('fas fa-check-square');
			row.element
				.find('div.search-result-price')
				.addClass('hidden')
				.eq(1)
				.removeClass('hidden');
		} else {
			// BACKORDERABLE
			row.element
				.find('span.checkboxarea')
				.html(
					'<label class="setbackorder"><i class="far fa-square" aria-hidden="true"></i></label>',
				);
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-backorder">${translations.backorder}</span>`,
				);
			// display prices
			row.element
				.find('div.second-line.registerprice')
				.html(`<span class="registerprice">${regprice}</span>`);
			row.element
				.find('div.second-line.renewalprice')
				.html(
					`<span class="renewal">${translations.renewal}: ${renprice}</span>`,
				);
			// add ADDED and price to the hidden div
			row.element
				.find('span.registerprice.added')
				.html(
					`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="1">${regprice}</span>`,
				);
		}
	} else {
		// NOT BACKORDERABLE
		row.element.toggleClass('clickable');
		row.element.find('div.col-xs-7').removeClass('search-result-info');
		row.element
			.find('div.second-line.registerprice')
			.html('<span>—</span><br><span><br></span>');
	}

	row.element
		.find('.label-hx-whois')
		.off()
		.on('click', this.showWhoisInformation);
};
SearchResult.prototype.switchTerm = function (e) {
	// to prevent event bubbling to parent element
	e.stopPropagation(); // because of this we have to close dropdown menu manually
	const sr = e.data;
	const row = sr.data;
	row.element.find('div.second-line.registerprice').removeClass('open');
	row.element.find('button.dropdown-toggle').attr('aria-expanded', false);
	let chosenTerm = $(this).text();
	row.element
		.find('.dropdown-toggle:first-child')
		.html(`${chosenTerm} <span class="caret"></span>`);
	chosenTerm = parseInt(chosenTerm, 10);
	row.element.find('.dropdown-toggle:first-child').val(chosenTerm);
	// update prices
	const regprice = sr.getPrice('register', true, chosenTerm);
	const regpriceraw = sr.getPrice('register', false, chosenTerm);
	const renprice = sr.getPrice('renew', true, chosenTerm);
	row.element
		.find('div.second-line.registerprice span.registerprice')
		.html(regprice);
	row.element
		.find('div.second-line.renewalprice')
		.html(`<span class="renewal">${translations.renewal}: ${renprice}</span>`);
	// add ADDED and price to the hidden div
	row.element
		.find('span.registerprice.added')
		.html(
			`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="${chosenTerm}">${regprice}</span>`,
		);
};
SearchResult.prototype.showWhoisInformation = function (e) {
	// to prevent event bubbling to parent element
	e.stopPropagation();
	const domain = $(this).data('domain');
	const pc = $(this).data('pc');
	$('#modalWhois').show();
	$('#modalWhoisBody')
		.css({
			'overflow-y': 'auto',
			height: $(window).height() - 200 + 'px',
		})
		.hide();
	$('#whoisDomainName').html(domain);
	$('#modalWhois').modal('show');
	$('#modalWhoisLoader').toggleClass('w-hidden');
	$.post(`${wr}/mywhois.php`, `idn=${domain}&pc=${pc}`, function (data) {
		// fetch html contents of body element
		const m = data.match(/<body[^>]*>([\w|\W]*)<\/body>/im);
		$('#modalWhoisBody').html(m[1]);
		$('#modalWhoisLoader').toggleClass('w-hidden');
		$('#modalWhoisBody').show();
	});
};

const DomainSearch = function () {
	this.connections = []; // queue for pending / queued xhr requests
	this.activeCurrency = null;
	this.catmgr = new CategoryManager();
	this.mode = 0; // { cfg } -> suggestions, 0 -> normal search
	this.searchcfg = {
		cacheJobID: null,
		maxCacheTTL: 600000, // 10 minutes in ms
		base: 2,
		initExp: 0,
		maxExp: 3,
		//maxGroupsPerPage: 3,
		maxEntriesPerPage: 15, // (1 + 2 + 4 + 8)
		// to know if a searchresult corresponds to the search string
		searchString: {IDN: '', PC: ''},
	};
	this.searchGroups = {};
	this.searchResults = [];
	this.searchResultsCache = {};
	this.d = {};
	this.handleXHRQueue();
	this.handleResultCache();

	// -------------------------------------------
	// --- init sessionStorage and searchStore ---
	// -------------------------------------------
	// sessionStorage will keep all search settings until browser or
	// the tab is getting closed
	// searchStore is saved json encoded in sessionStorage as it only allows
	// key value pairs as String (toString()!)
	// --- BEGIN
	// (1) check if GET parameters are used
	// e.g. domainchecker.php?search=test.com&cat=5
	const url = new URL(window.location.href);
	const search = url.searchParams.get('search');
	const categories = url.searchParams.get('cat');
	if (search !== null) {
		$('#searchfield').val(search);
		this.searchStore = {
			domain: search,
			activeCategories:
				categories === null
					? []
					: categories.split(',').map(c => {
							return parseInt(c, 10);
					  }),
			sug_ip_opt: url.searchParams.get('ip') || '0',
			// eslint-disable-next-line no-undef
			sug_lang_opt: url.searchParams.get('lang') || locale,
			showPremiumDomains: url.searchParams.get('showpremium') || '1',
			showTakenDomains: url.searchParams.get('showtaken') || '1',
		};
		sessionStorage.setItem(
			'ispapi_searchStore',
			JSON.stringify(this.searchStore),
		);
		this.initFromSessionStorage = 2; // filters can be overwritten by reseller settings
	} else {
		const $mysf = $('#searchfield');
		const tmp = $mysf.val();
		// (2) if sessionStore provides a configuration
		if (sessionStorage.getItem('ispapi_searchStore')) {
			this.searchStore = JSON.parse(
				sessionStorage.getItem('ispapi_searchStore'),
			);
			this.initFromSessionStorage = 1;
			// do not override searchstr that got posted
			if (tmp) {
				this.searchStore.domain = tmp;
			} else {
				$mysf.val(this.searchStore.domain);
			}
		} else {
			// (3) otherwise, start with defaults / empty config
			this.searchStore = {};
			sessionStorage.setItem('ispapi_searchStore', '{}');
			this.initFromSessionStorage = 0;
		}
	}
	// --- END
};

DomainSearch.prototype.cleanupSearchString = function (str) {
	function cleanupSearchStringSingle(str) {
		let tmp = str;
		// todo: review this regex with /[~`!@#$% ...]/ this looks quite ugly
		// invalid chars - SEARCH.INVALIDCHARACTERS@ispapi-search
		const invalidChars =
			/(~|`|!|@|#|\$|%|\^|&|\*|\(|\)|_|\+|=|{|}|\[|\]|\||\\|;|:|"|'|<|>|,|\?|\/)/g;
		try {
			const url = new URL(tmp); // try to url-parse given string
			tmp = url.hostname; // worked, we have hostname including subdomain
		} catch (e) {}
		tmp = tmp.replace(invalidChars, '');
		if (
			!tmp.length ||
			this.activeCurrency === null ||
			this.activeCurrency === undefined
		) {
			return tmp;
		}

		if (!/\./.test(tmp)) {
			return tmp;
		}
		let part,
			tld,
			found,
			search = tmp;
		const tlds = this.d[this.activeCurrency].pricing.tlds;
		tmp = search.split('.');
		do {
			part = tmp.shift(); // label
			tld = tmp.join('.'); // tlds
			found = Object.prototype.hasOwnProperty.call(tlds, tld);
			if (found) {
				return `${part}.${tld}`;
			}
		} while (tmp.length);
		return search;
	}

	let searchterms = str
		.toLowerCase()
		.replace(/(^\s+|\s+$)/g, '') // replace all dangling white spaces
		.replace(/(%20|\s)+/g, ' ') // replace multiple (urlenc) space with space
		.split(' '); // multi-keyword search
	return searchterms.map(cleanupSearchStringSingle, this).join(' ');
};

DomainSearch.prototype.handleResultCache = function () {
	this.searchcfg.cacheJobID = setInterval(
		function () {
			const keys = Object.keys(this.searchResultsCache);
			keys.forEach(
				function (k) {
					const d = this.searchResultsCache[k];
					if (Date.now() - d.ts > this.searchcfg.maxCacheTTL) {
						delete this.searchResultsCache[k];
					}
				}.bind(this),
			);
		}.bind(this),
		60000,
	);
};
DomainSearch.prototype.handleXHRQueue = function () {
	// handling connection queue
	// to abort pending / queued xhr requests on demand
	// to save resources on PHP- and API-end
	$(document).ajaxSend(function (event, jqxhr, settings) {
		ds.addToQueue(...arguments);
	});
	$(document).ajaxComplete(function (event, jqxhr, settings) {
		// this should also cover aborted requests
		ds.removeFromQueue(...arguments);
	});
	$(window)
		.off('beforeunload')
		.on('beforeunload', function () {
			ds.clearSearch();
			clearInterval(ds.searchcfg.cacheJobID);
		});
};
// TODO periodically reload
// ensure not to override active categories
// and not to override searchGroups
// but reflect price changes! <-- impossible for premium domains
// for premium domains we would have to again trigger domain check
// idea: working with sessionstorage to store all rows and to populate it from there
// in the way of a TTL cache
// allows to merge the searched domainlist and the results into one place for reuse
DomainSearch.prototype.loadConfiguration = function (currencyid) {
	let cfgurl = '?action=loadconfiguration';
	const currencychanged = currencyid !== undefined;
	if (currencychanged) {
		this.clearSearch();
		cfgurl += `&currency=${currencyid}`; // to change the currency in session
	}
	if (Object.prototype.hasOwnProperty.call(this.d, currencyid)) {
		this.generate(this.d[currencyid], 'success', currencychanged);
		cfgurl += '&nodata=1';
		$.ajax(cfgurl);
		return;
	}
	$.ajax({
		url: cfgurl,
		type: 'GET',
		dataType: 'json',
	}).then(
		(d, statusText) => {
			ds.generate(d, statusText, currencychanged);
		},
		(d, statusText) => {
			ds.generate(d, statusText, currencychanged);
		},
	);
};
DomainSearch.prototype.getTLDPricing = function (idndomain) {
	const tld = idndomain.replace(/^[^.]+\./, '');
	const prices = this.d[this.activeCurrency].pricing;
	// to have at least the currency for premium domains (see processresults fn)
	let pricing = $.extend({}, {currency: prices.currency});
	if (Object.prototype.hasOwnProperty.call(prices.tlds, tld)) {
		pricing = $.extend(pricing, prices.tlds[tld]);
		if (Object.prototype.hasOwnProperty.call(pricing, 'backorder')) {
			pricing.backorder = parseFloat(pricing.backorder).toFixed(2);
		}
		if (Object.prototype.hasOwnProperty.call(pricing, 'backorderlite')) {
			pricing.backorderlite = parseFloat(pricing.backorderlite).toFixed(2);
		}
	}
	return pricing;
};
DomainSearch.prototype.clearCache = function () {
	this.searchResultsCache = {};
};
DomainSearch.prototype.clearSearch = function () {
	$('#searchresults').empty();
	this.searchGroups = {};
	this.searchResults = [];
	$.each(this.connections, function (idx, jqxhr) {
		if (jqxhr) {
			jqxhr.abort();
		}
	});
};
DomainSearch.prototype.addToQueue = function (event, jqxhr, settings) {
	this.connections.push(jqxhr);
};
DomainSearch.prototype.removeFromQueue = function (event, jqxhr, settings) {
	this.connections.splice($.inArray(jqxhr, ds.connections), 1);
};
DomainSearch.prototype.initForm = function () {
	const data = this.d[this.activeCurrency];
	// when rebuilding dom / form from scratch
	// because currency or something else changed,
	// we have to care about setting searchStore back to
	// an object, otherwise the proxy would trigger new search
	// on every property change
	if (this.searchStore.isProxy) {
		const tmp = {};
		const self = this;
		Object.keys(this.searchStore).forEach(k => {
			tmp[k] = self.searchStore[k];
		});
		this.searchStore = tmp;
	}

	// final search string cleanup for initial page load
	const $mysf = $('#searchfield');
	$mysf.val(this.cleanupSearchString($mysf.val()));
	this.searchStore.domain = $mysf.val();

	if (this.initFromSessionStorage) {
		// loop over all form elements (select is also considered under scope of an :input)
		$('#searchform *')
			.filter(':input')
			.each(function () {
				$(this).val(ds.searchStore[this.name]);
			});
		$('#searchform')
			.serializeArray()
			.forEach(entry => {
				ds.searchStore[entry.name] = entry.value;
			});
		if (!this.searchStore.activeCategories.length) {
			this.searchStore.activeCategories = data.defaultActiveCategories;
		}
		$('#searchform *').filter(':input');
		this.catmgr
			.setCategories(data.categories, this.searchStore.activeCategories)
			.generate();
	} else {
		this.searchStore.activeCategories = data.defaultActiveCategories;
		this.catmgr
			.setCategories(data.categories, this.searchStore.activeCategories)
			.generate();
		// eslint-disable-next-line no-undef
		$('#sug_lang_opt').val(locale); // use the current active language as default
		$('#searchform')
			.serializeArray()
			.forEach(entry => {
				ds.searchStore[entry.name] = entry.value;
			});
		sessionStorage.setItem(
			'ispapi_searchStore',
			JSON.stringify(this.searchStore),
		);
	}
	if (Object.prototype.hasOwnProperty.call(this.searchStore, 'domain')) {
		this.searchcfg.searchString = ispapiIdnconverter.convert(
			this.searchStore.domain.split(' '),
		);
	}
	$('#showPremiumDomains i').addClass(
		this.searchStore.showPremiumDomains === '1'
			? 'fa-toggle-off'
			: 'fa-toggle-on',
	);
	$('#showTakenDomains i').addClass(
		this.searchStore.showTakenDomains === '1'
			? 'fa-toggle-off'
			: 'fa-toggle-on',
	);
	// do not allow to activate premium domains on client side if reseller has it deactivated
	if (!data.premiumDomains) {
		$('#showPremiumDomains').hide();
	}
	$('#datafilters .filter')
		.off('click')
		.on('click', function () {
			const $eL = $(this).find('i');
			const isOn = $eL.hasClass('fa-toggle-on');
			const filterId = $(this).attr('id');
			const isInverse = $(this).hasClass('filterInverse');
			// do not allow to activate premium domains on client side if reseller has it deactivated
			if (
				!(
					filterId === 'showPremiumDomains' &&
					!isOn &&
					data.premiumDomains === 0
				)
			) {
				$eL.toggleClass('fa-toggle-on', !isOn);
				$eL.toggleClass('fa-toggle-off', isOn);
				if (isInverse) {
					ds.searchStore[filterId] = isOn ? '1' : '0';
				} else {
					ds.searchStore[filterId] = isOn ? '0' : '1';
				}
			}
		});
	$('#datafilters').show();

	// Read about proxy here:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set
	// For IE / Safari?, we use proxy-polyfill (proxy.min.js)
	this.searchStore = new Proxy(this.searchStore, {
		set: function (target, key, value) {
			const isViewFilter = /^showTakenDomains$/i.test(key);
			// rewrite the value as necessary for search input field
			if (key === 'domain') {
				value = ds.cleanupSearchString(value);
				$('#searchfield').val(value); // this won't fire a change event
			}
			// trigger search
			if (target[key] !== value) {
				// config has changed, trigger completely new search
				// TODO -> just re-request rows that have not been requested yet!
				if (/^showPremiumDomains$/i.test(key)) {
					ds.clearCache(); // as this filter changes the data returned from API
				}
				if (!isViewFilter) {
					ds.clearSearch();
				}
			}
			const result = Reflect.set(...arguments);
			sessionStorage.setItem(
				'ispapi_searchStore',
				JSON.stringify(ds.searchStore),
			);
			if (!isViewFilter) {
				ds.search();
			} else {
				ds.filter(key, value);
			}
			return result;
		},
		get: function (target, key) {
			if (key === 'isProxy') {
				return true;
			}
			return Reflect.get(...arguments);
		},
		ownKeys: function (target) {
			return Reflect.ownKeys(target);
		},
	});
	// category changes are subscribed in categorymgr code
	$('#transferbutton')
		.off('click')
		.click(() => {
			const domain = $('#searchfield').val();
			if (/\./.test(domain)) {
				window.location.href = `${wr}/cart.php?a=add&domain=transfer&query=${domain}`;
			}
		});
	// category changes are subscribed in categorymgr code
	$('#searchbutton, #loadmorebutton')
		.off('click')
		.click(() => {
			ds.search();
		});
	// starts the search when enterkey is pressed
	$('#searchfield')
		.off('keypress')
		.on('keypress', function (e) {
			const keyCode = e.keyCode || e.which;
			if (keyCode === 13 && this.value.length) {
				this.blur();
			}
		});
	$('#searchfield')
		.off('change')
		.change(function () {
			const val = ds.cleanupSearchString(this.value);
			ds.searchcfg.searchString = ispapiIdnconverter.convert(val.split(' '));
			ds.searchStore[this.name] = val;
		});
	if (ds.mode) {
		// domain suggestions
		$('#sug_lang_opt, #sug_ip_opt')
			.off('change')
			.change(function () {
				ds.searchStore[this.name] = this.value;
			});
	}
};
DomainSearch.prototype.generate = async function (
	d,
	statusText,
	currencychanged,
) {
	const self = this;
	// handle the click on the category-button
	$('#legend-button')
		.off('click')
		.click(function () {
			$(this).find('i.legend').toggleClass('fa-angle-up fa-angle-down');
		});
	if (currencychanged) {
		this.clearCache();
	}
	if (d.lookupprovider !== 'ispapi') {
		// show error just in case we have not canceled it
		if (!/^abort$/i.test(statusText)) {
			$('#loading, #resultsarea, #errorcont').hide();
			$('#searchresults').empty();
			$.growl.error({
				title: `${translations.error_occured}!`,
				message: translations.error_lookupprovider,
			});
		}
		this.catmgr = null;
		return;
	}
	if (!Object.prototype.hasOwnProperty.call(d, 'categories')) {
		// show error just in case we have not canceled it
		if (!/^abort$/i.test(statusText)) {
			$('#loading, #resultsarea, #errorcont').hide();
			$('#searchresults').empty();
			$.growl.error({
				title: `${translations.error_occured}!`,
				message: `${translations.error_loadingcfg} (${d.status} ${d.statusText})`,
			});
		}
		this.catmgr = null;
		return;
	}
	this.activeCurrency = d.pricing.currency.id;
	this.mode = d.suggestionsOn ? d.suggestionsCfg : 0;
	this.backorders = d.backorders;
	this.paths = {
		dc: d.path_to_dc_module,
		bo: d.path_to_bo_module,
	};
	// apply reseller's filter settings if applicable
	if (this.initFromSessionStorage === 2 || !this.initFromSessionStorage) {
		this.searchStore.showPremiumDomains = d.premiumDomains + '';
		this.searchStore.showTakenDomains = d.takenDomains + '';
	}
	// commented out below lines to be able to reuse response for currency switch
	/* delete d.backorders;
  delete d.cartitems;
  delete d.lang;
  delete d.suggestionsOn;
  delete d.premiumDomains;
  delete d.takenDomains; */

	this.d[this.activeCurrency] = d;

	// this.mode -> domain suggestions, this.mode covers the suggestionscfg from registrar module or is 0
	const tpls = ['resultRow'].concat(
		this.mode ? ['suggestionscfg', 'suggestionscfgbttn'] : [],
	);
	await TPLMgr.loadTemplates(tpls, 'Client');

	$(document).ready(function () {
		$('#loading').hide();
		if (!currencychanged && self.mode) {
			// domain suggestions
			// render the specific DOM
			TPLMgr.renderPrepend('#searchform div.addon', 'suggestionscfgbttn');
			TPLMgr.renderBefore('#categories', 'suggestionscfg', {
				locales: d.locales,
			});
		}

		self.initForm();
		self.search();

		$('.currencychooser button')
			.off('click')
			.click(function () {
				const eL = $(this);
				if (eL.hasClass('active')) {
					return;
				}
				const bttns = $('.currencychooser button');
				bttns.removeClass('active');
				eL.toggleClass('active');
				ds.loadConfiguration(parseInt(eL.attr('id').replace(/^curr_/, ''), 10));
			});
	});
};
DomainSearch.prototype.getDomainSuggestions = function (searchstr) {
	// TODO: might be better to cover suggestionsnoweighted as searchStore var
	// and checkbox in the suggestions settings modal
	const cfg = {
		useip: this.searchStore.sug_ip_opt,
		zones: this.catmgr.getSelectedZones(
			this.mode ? this.mode.suggestionsnoweighted : false,
		),
		keyword: searchstr,
		language: this.searchStore.sug_lang_opt,
	};
	const data = {...cfg, ...this.mode};
	const errmsg = {
		title: `${translations.error_occured}!`,
		message: translations.error_loadingsuggestions,
	};
	return new Promise(resolve => {
		$.ajax({
			url: '?action=getsuggestions',
			type: 'POST',
			data: JSON.stringify(data),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
		}).then(
			(d, textStatus) => {
				if (!d.length) {
					$.growl.error(errmsg);
				}
				resolve(d);
			},
			(d, textStatus) => {
				// show error message only if we have not aborted
				// the xhr requests
				if (!/^abort$/.test(textStatus)) {
					$.growl.error(errmsg);
				}
				resolve(d); // empty array
			},
		);
	}).catch(() => {
		return [];
	});
};

DomainSearch.prototype.buildRows = function (list) {
	const group = [];
	const self = this;
	const l = $.extend(true, {}, list);
	l.PC.forEach((pc, idx) => {
		group.push({
			IDN: l.IDN[idx],
			PC: pc,
			registrar: self.getRegistrar(pc),
		});
	});
	return group;
};
DomainSearch.prototype.orderByPrio = function (a, b) {
	const regex = /^[^.]+\./;
	const tldsbyprio = this.d[this.activeCurrency].tldsbyprio;
	const indexA = tldsbyprio.indexOf(a.replace(regex, ''));
	const indexB = tldsbyprio.indexOf(b.replace(regex, ''));
	return indexA - indexB;
};
DomainSearch.prototype.buildDomainlist = async function () {
	// suggestionlist only works well with IDN keyword (FTASKS-2442)
	const searchstr = this.searchcfg.searchString.IDN;
	const tldsbyprio = this.d[this.activeCurrency].tldsbyprio;
	let directResults = [];
	let domainlist = [];
	let priodomainlist = [];
	if (this.mode) {
		// domain suggestions search
		// (1) fetch list of domain suggestions from API
		domainlist = await this.getDomainSuggestions(searchstr.join(' '));
		// (2) reorder them by by priority of the TLD (reorder by ascii by option)
		priodomainlist = domainlist.sort(this.orderByPrio.bind(this));
		directResults = searchstr
			.filter(str => {
				return /.+\..+/.test(str);
			})
			.sort(this.orderByPrio.bind(this));
	} else {
		// default search
		const labels = searchstr.map(function (str) {
			const label = str.replace(/\..+$/, '');
			let tld = '';
			if (/\./.test(str)) {
				tld = str.replace(/^[^.]+\./, '');
			}
			domainlist = domainlist.concat(this.catmgr.buildDomainlist(label));
			if (tld.length) {
				directResults.push(str);
				domainlist.push(str);
			}
			// (1) build domain list out of selected categories
			return {
				label,
				tld,
			};
		}, this);

		// (2) build domain list out of ALL available TLDs
		tldsbyprio.forEach(tld => {
			labels.forEach(item => {
				const entry = `${item.label}.${tld}`;
				priodomainlist.push(entry);
			});
		});
	}

	if (directResults.length) {
		priodomainlist = directResults.concat(priodomainlist);
	}

	// now remove duplicates (case: search for domain including tld)
	// and filter against the selected TLDs (domainlist)
	priodomainlist = priodomainlist.filter((el, index, arr) => {
		return (
			(domainlist.indexOf(el) !== -1 || // entry is part of search
				this.searchcfg.searchString.IDN.indexOf(el) !== -1 || // or matches the IDN search term
				this.searchcfg.searchString.PC.indexOf(el) !== -1) && // or matches the PunyCode search term
			index === arr.indexOf(el)
		);
	});
	return priodomainlist;
};
DomainSearch.prototype.getCachedResult = function (domain) {
	const d = this.searchResultsCache[domain];
	if (d) {
		if (Date.now() - d.ts <= this.searchcfg.maxCacheTTL) {
			return d.row;
		} else {
			delete this.searchResultsCache[domain];
		}
	}
	return null;
};
DomainSearch.prototype.getSearchGroups = async function (searchterm) {
	const newSearchTerm = searchterm !== this.searchGroups.searchterm;
	if (
		!Object.prototype.hasOwnProperty.call(this.searchGroups, 'open') ||
		newSearchTerm
	) {
		$('#searchresults').empty();
		const domainlist = await this.buildDomainlist();
		if (!domainlist.length) {
			this.searchGroups.finished = true;
			return [];
		}
		this.searchGroups = {
			searchterm: searchterm,
			open: this.buildRows(ispapiIdnconverter.convert(domainlist)),
			finished: false,
		};
	}
	const cachedgroup = [];
	const result = [];
	let groups = this.searchGroups.open.splice(
		0,
		this.searchcfg.maxEntriesPerPage,
	);
	groups = groups.filter(row => {
		// append rows to DOM that we request later on
		row.pricing = ds.getTLDPricing(row.IDN);
		row.domainlabel = row.IDN.replace(/\..+$/, '');
		row.extension = row.IDN.replace(/^[^.]+/, '');
		row.isSearchString =
			ds.searchcfg.searchString.PC.includes(row.PC) ||
			ds.searchcfg.searchString.IDN.includes(row.IDN); // maybe we could bring this with the above `searchterm` together
		// avoid duplicates
		// jquery v3 provides $.escapeSelector, this can be replaced when
		// WHMCS six template's dependency jquery upgrades from v1 to v3 one day :-(
		const selector = row.PC.replace(
			/([$%&()*+,./:;<=>?@[\\\]^{|}~'])/g,
			'\\$1',
		);
		row.element = $(`#${selector}`);
		if (!row.element.length) {
			row.element = TPLMgr.renderAppend('#searchresults', 'resultRow', {
				row: row,
			});
		}
		const cachedRow = ds.getCachedResult(row.PC);
		if (cachedRow) {
			cachedgroup.push($.extend(true, row, cachedRow));
			return false;
		}
		return true;
	});
	if (cachedgroup.length) {
		this.processCachedResults(cachedgroup);
	}
	let exp = ds.searchcfg.initExp;
	while (groups.length) {
		result.push(groups.splice(0, ds.searchcfg.base ** exp));
		if (++exp > ds.searchcfg.maxExp) {
			exp = ds.searchcfg.initExp;
		}
	}
	this.searchGroups.finished = !this.searchGroups.open.length;
	return result;
};
DomainSearch.prototype.checkTaken = function (sr, val) {
	const row = sr.data;
	if (val === undefined) {
		val = ds.searchStore.showTakenDomains;
	}
	if (!row.isSearchString && row.status === 'TAKEN' && val === '0') {
		sr.fadeOut();
	} else {
		sr.show();
	}
};
DomainSearch.prototype.processCachedResults = function (list) {
	list.forEach(
		function (row) {
			const sr = new SearchResult(row);
			this.searchResults.push(sr); // NOTE: this no longer represents the order in DOM
			sr.generate();
			// hide taken ones if applicable
			this.checkTaken(sr);
		}.bind(this),
	);
};
DomainSearch.prototype.processResults = function (grp, d) {
	if (
		Object.prototype.hasOwnProperty.call(d, 'statusText') &&
		/^abort$/i.test(d.statusText)
	) {
		// skip aborted connections, new search results are incoming
		return;
	}
	grp.forEach((row, idx) => {
		row.status = 'UNKNOWN';
		if (Object.prototype.hasOwnProperty.call(d, status)) {
			// client http error
			row.REASON = d.statusText;
		}
		if (d.success === false) {
			row.REASON = d.errormsg;
		} else {
			if (d.results && d.results.length && d.results[idx]) {
				$.extend(row, d.results[idx]);
				if (row.CLASS && row.PREMIUMCHANNEL) {
					if (row.CLASS.indexOf(row.PREMIUMCHANNEL) === -1) {
						row.premiumtype = row.PREMIUMCHANNEL;
					} else {
						row.premiumtype = 'PREMIUM';
					}
				} else if (
					row.PREMIUMCHANNEL &&
					row.REASON &&
					row.REASON === 'AFTERMARKET'
				) {
					row.premiumtype = row.REASON;
				}
				// override by returned registrar prices and cleanup row data
				if (Object.prototype.hasOwnProperty.call(row, 'PRICE')) {
					row.pricing.register = {
						1: parseFloat(row.PRICE).toFixed(2),
					};
					delete row.PRICE;
				}
				if (Object.prototype.hasOwnProperty.call(row, 'PRICERENEW')) {
					row.pricing.renew = {
						1: parseFloat(row.PRICERENEW).toFixed(2),
					};
					delete row.PRICERENEW;
				}
			}
		}
		const sr = new SearchResult(row);
		this.searchResults.push(sr); // NOTE: this no longer represents the order in DOM
		this.searchResultsCache[row.PC] = {
			row: $.extend(true, {}, row),
			ts: Date.now(),
		};
		// to ensure we use the one that is created by the next search batch
		delete this.searchResultsCache[row.PC].row.element;
		sr.generate();
		// hide taken ones if applicable
		this.checkTaken(sr);
		// no need to care about hiding premiums as this is different
		// (api command changes when using the filter, premiums won't get returned as such)
	});
};
DomainSearch.prototype.filter = function (key, val) {
	switch (key) {
		case 'showTakenDomains':
			this.searchResults.forEach(
				function (sr) {
					this.checkTaken(sr, val);
				}.bind(this),
			);
			this.checkAllTaken();
			break;
	}
};
DomainSearch.prototype.getRegistrar = function (domain) {
	const tld = domain.replace(/^[^.]+\./, '');
	return this.d[this.activeCurrency].registrars[tld];
};
DomainSearch.prototype.requestGroupCheck = function (group) {
	const data = {
		idn: [],
		pc: [],
		registrars: [],
		premiumDomains: parseInt(this.searchStore.showPremiumDomains, 10),
	};
	group.forEach(row => {
		data.idn.push(row.IDN);
		data.pc.push(row.PC);
		data.registrars.push(row.registrar);
	});
	return $.ajax({
		url: '?action=checkdomains',
		type: 'POST',
		data: JSON.stringify(data),
		contentType: 'application/json; charset=utf-8',
		dataType: 'json',
	}).then(
		d => {
			ds.processResults(group, d);
		},
		d => {
			ds.processResults(group, d);
		},
	);
};

DomainSearch.prototype.checkAllTaken = function () {
	if (!this.searchResults.length || ds.searchStore.showTakenDomains === '1') {
		$('#errorcont').hide();
		return;
	}
	for (let i = 0; i < this.searchResults.length; i++) {
		const row = this.searchResults[i].data;
		if (row.isSearchString || row.status !== 'TAKEN') {
			return; // we found a row not being TAKEN
		}
	}
	if (this.searchGroups.finished) {
		if (!$('div.domainbox.clickable').length) {
			$('#errorcont').show();
		}
	} else {
		this.search();
	}
};

DomainSearch.prototype.search = async function () {
	const search = this.searchStore.domain;
	if (!search.length) {
		return;
	}
	const groups = await this.getSearchGroups(search);
	const promises = [];
	$('#resultsarea').show();
	$('#errorcont').hide();
	groups.forEach(grp => {
		// keep in mind if replacing that fat-arrow fn with
		// this.requestGroupCheck then this context will be window
		promises.push(ds.requestGroupCheck(grp));
	});
	if (this.searchGroups.finished) {
		$('#loadmorebutton').hide();
	} else {
		$('#loadmorebutton').show();
	}
	await Promise.all(promises); // wait for requests to finish
	this.checkAllTaken();
};

const Category = function (name, id, tlds, isActive) {
	this.tlds = tlds;
	this.id = id;
	this.name = name;
	this.active = isActive;
	this.className = isActive ? 'subCat active' : 'subCat';
	this.element = null; // will be set by categorymgr in generate method
};
Category.prototype.toString = function () {
	return TPLMgr.renderString('category', {category: this});
};

const CategoryManager = function () {};
CategoryManager.prototype.setCategories = function (
	categories,
	activeCategories,
) {
	$('#categoriescont').empty();
	this.categoriesMap = {}; // access by id, faster
	this.categories = [];
	this.activeCategories = activeCategories;
	const all = {
		id: -1,
		name: 'All',
		tlds: [],
		active: true,
	};
	categories
		.sort(function (a, b) {
			const namea = a.name.toUpperCase();
			const nameb = b.name.toUpperCase();
			return namea < nameb ? -1 : namea > nameb ? 1 : 0;
		})
		.forEach(d => {
			const cat = new Category(
				d.name,
				d.id,
				d.tlds,
				activeCategories.indexOf(d.id) !== -1,
			);
			this.categoriesMap[d.id] = cat;
			this.categories.push(cat);
			all.tlds = all.tlds.concat(d.tlds);
			all.active = all.active && cat.active;
		});
	all.tlds = all.tlds.filter(function (item, pos, self) {
		return self.indexOf(item) === pos;
	});
	const cat = new Category(all.name, all.id, all.tlds, all.active);
	this.categoriesMap[all.id] = cat;
	this.categories.unshift(cat);
	return this;
};
CategoryManager.prototype.handleClicks = function () {
	$('.subCat')
		.off('click')
		.click(
			function (e) {
				const cat = this.getCategoryByDomId($(e.target).attr('id'));
				if (!cat) {
					return;
				}
				cat.element.toggleClass('active');
				cat.active = cat.element.hasClass('active');
				// NOTE: we need to create a new array so that proxy.set handler reacts as necessary
				// ALL === -1 -> put all cats to active or remove them all
				if (cat.id === -1) {
					if (cat.active) {
						const activecats = [];
						this.categories.forEach(cat => {
							cat.active = true;
							cat.element.addClass('active');
							activecats.push(cat.id);
						});
						ds.searchStore.activeCategories = activecats;
					} else {
						this.categories.forEach(cat => {
							cat.active = false;
							cat.element.removeClass('active');
						});
						ds.searchStore.activeCategories = [];
					}
				} else {
					if (cat.active) {
						const activecats = ds.searchStore.activeCategories.concat(cat.id);
						let allactive = true;
						this.categories.forEach(c => {
							if (c.id !== -1) {
								allactive = allactive && c.active;
							}
						});
						if (allactive) {
							this.categoriesMap[-1].active = true;
							this.categoriesMap[-1].element.addClass('active');
							activecats.push(-1);
						}
						ds.searchStore.activeCategories = activecats;
					} else {
						this.categoriesMap[-1].active = false;
						this.categoriesMap[-1].element.removeClass('active');
						ds.searchStore.activeCategories =
							ds.searchStore.activeCategories.filter(catid => {
								return catid !== cat.id && catid !== -1;
							});
					}
				}
			}.bind(this),
		);
	// handle the click on the category-button
	$('.category-button')
		.off('click')
		.click(function () {
			$(this).find('i.category').toggleClass('fa-angle-up fa-angle-down');
		});
	return this;
};
CategoryManager.prototype.getCategoryIdByDomId = function (domid) {
	return parseInt(domid.substring(2), 10);
};
CategoryManager.prototype.getCategoryByDomId = function (domid) {
	const id = this.getCategoryIdByDomId(domid);
	return this.categoriesMap[id];
};
CategoryManager.prototype.generate = async function () {
	if (!this.categories.length) {
		return $.growl.error({
			title: `${translations.error_occured}!`,
			message: translations.error_noprices,
		});
	}
	await TPLMgr.loadTemplates(['category'], 'Client');
	const $eL = $('#categoriescont');
	$eL.empty();
	this.categories.forEach(category => {
		category.element = $(category + '').appendTo($eL);
	});
	$('#categories').show();
	$('#searchbutton').prop('disabled', false);
	this.handleClicks();
	return this;
};
CategoryManager.prototype.getTLDsByCategory = function (categoryid) {
	const cat = this.categoriesMap[categoryid];
	if (cat) {
		return cat.tlds;
	}
	return [];
};
CategoryManager.prototype.getSelectedTLDs = function () {
	if (this.categoriesMap[-1].active) {
		return this.categoriesMap[-1].tlds;
	}
	let tlds = [];
	this.categories
		.filter(category => {
			return category.active;
		})
		.forEach(category => {
			tlds = tlds.concat(
				category.tlds.filter(item => {
					return tlds.indexOf(item) < 0; // no duplicates
				}),
			);
		});
	return tlds;
};
CategoryManager.prototype.getSelectedZones = function (suggestionsnoweighted) {
	return this.getSelectedTLDs()
		.filter(tld => {
			// filter out high weighted TLDs like .com, .net
			if (suggestionsnoweighted && /^(COM|NET)$/i.test(tld)) {
				return false;
			}
			// filter out 3rd level extensions as not supported by QueryDomainSuggestionList
			return /^[^.]+$/.test(tld);
		})
		.map(tld => {
			return tld.toUpperCase();
		});
};
CategoryManager.prototype.buildDomainlist = function (searchLabel) {
	const domainlist = [];
	if (searchLabel.length) {
		this.getSelectedTLDs().forEach(tld => {
			const entry = `${searchLabel}.${tld}`;
			domainlist.push(entry);
		});
	}
	return domainlist;
};

// eslint-disable-next-line no-unused-vars
const dcpath = '/modules/addons/ispapidomaincheck/';
// eslint-disable-next-line no-unused-vars
let translations;
let ds;
let cart;

(async function () {
	// eslint-disable-next-line no-unused-vars
	translations = await $.ajax({
		url: '?action=loadtranslations',
		type: 'GET',
	});
	cart = new ShoppingCart();
	await cart.load();
	ds = new DomainSearch();
	ds.loadConfiguration();
})();
