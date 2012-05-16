/*
Script: Slab.js
	Pretty simple templating.

Copyright and License:
	(c) 2012, Mark Obcena <markeeto@gmail.com>
	MIT-Style License
*/

(function(context){

var exps = {
	// grouping
	group: (/\{slab\s+([$A-Za-z_][$0-9A-Za-z_]*)\}([^]*?)\{endslab\}/g),

	// comments
	comment: (/\{\*[^]*?\*\}/g),

	// parser escape
	kept: (/\{keep\}([^]*?)\{endkeep\}/g),
	keptIdent: (/(%#%)E[0-9]+\1/g),

	// new lines
	breaker: (/%#=#%/g),
	emptyLine: (/\n;\s*\n/g),
	appendableString: (/";\s*\n\s*_buffer_ \+= "/g),

	// strings and identifiers
	strings: (/('|").*?\1/g),
	stringIdent: (/(%#%)[0-9]+\1/g),
	identifier: (/\.?[$A-Za-z_][$0-9A-Za-z_]*/g),
	reservedIdentifier: (/__[$0-9A-Za-z_]*/g),
	extractedIdentifier: (/^([$A-Za-z_][$0-9A-Za-z_]*)\./),
	operators: (/\s+(and|or|eq|neq|is|isnt|not)\s+/g),

	// statements
	statement: (/\{\s*([^}]+?)\s*\}/g),
	escapeState: (/^:\s*(.+)/),
	endState: (/^end$/),
	elseState: (/^else$/),
	elseIfState: (/^else\s+if\s+(.+)$/),
	ifState: (/^if\s+(.+)$/),
	eachState: (/^each\s+([$A-Za-z_][$0-9A-Za-z_]*)(?:\s*,\s*([$A-Za-z_][0-9A-Za-z_]*))?\s+in\s(.+)$/),
	forState: (/^for\s+([$A-Za-z_][$0-9A-Za-z_]*)(?:\s*,\s*([$A-Za-z_][0-9A-Za-z_]*))?\s+in\s+(.+)$/),
	forEveryState: (/^forEvery\s+([$A-Za-z_][$0-9A-Za-z_]*)(?:\s*,\s*([$A-Za-z_][0-9A-Za-z_]*))?\s+in\s+(.+)$/),

	// inlining
	inlined: (/\{include\s+([$A-Za-z_][$0-9A-Za-z_]*)\}/g)
};

var slice = Array.prototype.slice;

function partial(fn){
	var args = slice.call(arguments, 1);
	return function(){
		return fn.apply(null, args.concat(slice.call(arguments)));
	};
}

// Operators
var ops = {
	and: ' && ', or: ' || ', eq: ' === ', neq: ' !== ',
	not: ' !', isnt: ' != ', is: ' == '
};

function parseOperators(_, op){
	return ops[op];
}

// Escape
function parseEscape(stack, _, exp){
	// Adapted from DoT.js (https://github.com/olado/doT)
	return '_strtmp = (' + parseIdents(stack, exp) + ').toString();%#=#%'
		+ '_buffer_ += _strs[_strtmp] ||'
		+ '(_strs[_strtmp] = _strtmp'
		+ '.replace(/&(?!\\w+;)/g, "&#38;")'
		+ '.split("<").join("&#60;")'
		+ '.split(">").join("&#62;")'
		+ '.split("\\"").join("&#34;")'
		+ '.split("\'").join("&#39;")'
		+ '.split("/").join("&#47;"));%#=#%';
}

// End Statement
function parseEnd(stack){
	stack.pop();
	stack.pop();
	return '} %#=#%';
}

// Else Statement
function parseElse(){
	return '} else { %#=#%';
}

// Else If Statement
function parseElseIf(stack, _, exp){
	return '} else if (' + parseIdents(stack, exp) +') { %#=#%';
}

// If Statement
function parseIf(stack, _, exp){
	stack.push(null, null);
	return 'if (' + parseIdents(stack, exp) + ') { %#=#%';
}

// Each Statement
var iterator = 0;

function parseEach(stack, _, iter, value, array){
	/*jsl:ignore*/
	if (!value) iter = (value = iter, 'iterator' + iterator++);
	/*jsl:end*/
	var length = 'length' + iterator++;
	array = resolveIdents(stack, array);
	stack.push(iter, value);
	return 'for (var ' + iter + ' = 0, '
		+ length + ' = ' + array + '.length; '
		+ iter + ' < ' + length + '; ' + iter + '++) { %#=#%'
		+ 'var ' + value + ' = ' + array + '[' + (iter) + ']';
}

// For Statement

function parseFor(stack, _, key, value, object){
	/*jsl:ignore*/
	if (!value) key = (value = key, 'iterator' + iterator++);
	/*jsl:end*/
	object = resolveIdents(stack, object);
	stack.push(key, value);
	return 'for (var ' + key + ' in ' + object + '){ %#=#%'
		+ 'if (!' + object + '.hasOwnProperty('+ key +')) continue; %#=#%'
		+ 'var ' + value + ' = ' + object + '[' + key +']';
}

function parseForEvery(stack, _, key, value, object){
	/*jsl:ignore*/
	if (!value) key = (value = key, 'iterator' + iterator++);
	/*jsl:end*/
	object = resolveIdents(stack, object);
	stack.push(key, value);
	return 'for (var ' + key + ' in ' + object + '){ %#=#%'
		+ 'var ' + value + ' = ' + object + '[' + key +']';
}

// Identifiers

var notIdents = {
	'true': 1, 'false': 1, 'null': 1, 'undefined': 1,
	'typeof': 1, 'instanceof': 1, 'if': 1, 'else': 1,
	'_data_': 1
};

function resolveIdents(stack, match){
	var _match = match,
		matches = match.match(exps.extractedIdentifier);
	if (matches) match = matches[1];
	if (exps.reservedIdentifier.test(match)) return match;
	return (match.charAt(0) == '.'
		|| stack.indexOf(match) != -1
		|| notIdents[match]) ? _match : '_data_.' + _match;
}

function resolveReservedIdents(match){
	return match.slice(2);
}

function parseIdents(stack, str){
	var strings = {}, ident = 0;
	return str.replace(exps.strings, function(match, id){
		strings[(id = '%#%' + (ident++) + '%#%')] = match;
		return id;
	}).replace(exps.identifier, partial(resolveIdents, stack))
	.replace(exps.reservedIdentifier, resolveReservedIdents)
	.replace(exps.stringIdent, function(match){
		return strings[match];
	});
}


// Main Parser
function parseStatement(stack, match, inner){
	var result = '"; %#=#%',
		prev = inner = inner.replace(exps.operators, parseOperators);

	inner = inner.replace(exps.elseState, parseElse)
		.replace(exps.elseIfState, partial(parseElseIf, stack))
		.replace(exps.ifState, partial(parseIf, stack))
		.replace(exps.eachState, partial(parseEach, stack))
		.replace(exps.forState, partial(parseFor, stack))
		.replace(exps.forState, partial(parseForEvery, stack))
		.replace(exps.endState, partial(parseEnd, stack))
		.replace(exps.escapeState, partial(parseEscape, stack));

	if (inner == prev){
		result += '_buffer_ += ';
		inner = parseIdents(stack, inner);
	}

	return result + inner.replace(/\t|\n|\r/, '') + '; %#=#%_buffer_ += "';
}

// Cleanup
function clean(str){
	return str.replace(/_buffer_\s\+=\s"";/g, '')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(exps.breaker, '\n')
		.replace(exps.emptyLine, '\n');
		/*.replace(exps.appendableString, '');*/
}

// Classes
function SlabError(msg){
	this.message = msg;
}

SlabError.prototype = new Error();
SlabError.prototype.name = 'SlabError';

function SlabTemplate(){
	this._templates = {};
	this._parsed = {};
	this._cache = {};
}

// Public Functions

function inlineIncludes(templates, deps, _, name){
	if (deps.indexOf(name) != -1){
		deps.push(name);
		throw new SlabError('Recursive includes for template "' + name + '" (' + deps.join(' > ') + ').');
	}

	deps.push(name);
	var item = templates[name];
	if (!item) throw new SlabError('Cannot find template named "' + name + '" (' + deps.join(' > ') + ').');
	return item;
}

function resolveIncludes(template, templates){
	var deps = [],
		resolver = partial(inlineIncludes, templates, deps);
	while (template != (template = template.replace(exps.inlined, resolver))) null;
	return template;
}

function parseSub(str, slab){
	var cache = slab._cache;
	if (cache[str]) return cache[str];

	var stack = [],
		kept = {},
		stashCount = 0;

	var  _str = str.replace(exps.kept, function(id, match){
			kept[(id = '%#%E' + (stashCount++) + '%#%')] = match;
			return id;
		}).replace(exps.statement, partial(parseStatement, stack))
		.replace(exps.keptIdent, function(match){
			return kept[match];
		});

	return (cache[str] = clean('%#=#%_buffer_ += "' + _str + '";'));
}

function parse(str, slab){
	if (!str) throw new SlabError('Template string cannot be empty.');
	if (slab && !(slab instanceof SlabTemplate))
		throw new SlabError('Object passed is not a Slab object.');

	str = str.replace(new RegExp('\\\\', 'g'), '\\\\').replace(/"/g, '\\"');
	slab = slab || new SlabTemplate();

	var slabs = str.replace(exps.comment, '').match(exps.group);
	if (!slabs) throw new SlabError('No valid templates found in string.');
	
	var len = slabs.length,
		templates = slab._templates,
		parsed = slab._parsed,
		identifier;

	while (len--){
		var current = slabs[len],
			_tmp = current.replace(exps.group, function(_, id, body){
				identifier = id;
				return body;
			});
		templates[identifier] = _tmp;
	}

	for (var i in templates){
		var template = resolveIncludes(templates[i], templates);
		parsed[i] = parseSub(template, slab);
	}

	return slab;
}

function wrapTemplate(str, id){
	return 'var _buffer_ = "", _strs = {}, _strtmp;' + str
		+ '\nreturn _buffer_;\n//@ sourceURL=' + id;
}

function compile(str, slab){
	slab = parse(str, slab);
	var templates = slab._parsed;

	for (var id in templates){
		var template = templates[id];
		try {
			slab[id] = new Function('_data_', wrapTemplate(template, id));
		} catch(e){
			throw new SlabError('Can\'t compile slab template. ' + e.message);
		}
	}
	return slab;
}

var generateCount = 0;
function generate(objId, str, slab){
	if (!objId) objId = 'slabTemplate' + (generateCount++);
	slab = parse(str, slab);

	var results = [],
		templates = slab._parsed;

	for (var id in templates){
		var template = templates[id];
		results.push(id + ': function(_data_){\n' + wrapTemplate(template, objId) + '\n}');
	}
	return 'var ' + objId + '= {\n' + results.join(',\n') + '};';
}

context.slab = {
	compile: compile,
	parse: parse,
	generate: generate
};

})(typeof exports != 'undefined' ? exports : this);


