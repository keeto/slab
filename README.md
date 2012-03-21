# Slab: Simple Templating

Slab is a templating engine for JavaScript with a simple syntax and an even simpler API.


## How does it look like?

	// slab template
	var templateString = "{slab myTemplate} \
		<ul> \
			{each person in people} \
				<li>Hello {person.name}! You are {person.age} year{person.age > 1 ? 's' : ''} old!</li> \
			{end} \
		</ul> \
	{endslab}"

	// js
	var templates = slab.compile(templateString);
	var result = templates.myTemplate({
		people: [
			{name: 'John', age: '22'},
			{name: 'Peter', age: '31'},
			{name: 'Matthew', age: '36'},
			{name: 'Mark', age: '24'}
		]
	});

	console.log('result');


## Template Syntax

Slab templates are declared using the `slab` statement, together with an identifier that's gonna be used for the template:

	{slab someIdentifier}
		Hello World!
	{endslab}

You can have multiple `slab` declarations in a single template:

	{slab hello}
		Hello World!
	{endslab}

	{slab hi}
		Hi Universe!
	{endslab}

You can comment your templates using a multiline comment syntax:

	{slab example}
		{* This is a comment *}
		{'This will be printed out!'}
	{endslab}

You can output the value of any expression just by writing the expression inside curly braces:

	{slab example}
		{* Literals *}
		{'Strings in single quotes, not double!'}
		{100}
		{true}

		{* Simple variable evaluation *}
		{firstName}

		{* Function calls *}
		{makeUpperCase(firstName)}

		{* Expressions *}
		{firstName + '' + lastName}
	{endslab}

If you're outputting data that needs to be escaped, you can prepend a colon (`:`) on the output statement:

	{slab example}
		{:untrustedData}
		{:untrustedFunction()}
		{:'<script>alert("Untrusted!");</script>'}
	{endslab}

Slab understands both the regular JavaScript operators as well as "word-operators" in expressions:

	and 	-> &&
	or 		-> ||
	is 		-> ==
	isnt 	-> !=
	eq 		-> ===
	neq 	-> !==
	not 	-> !

These operators can be used in Slab's branching statements:

	{slab example}
		{* If statement *}
		{if firstName is 'Slab'}
			Hello {firstName}
		{end}

		{* If-Else statement *}
		{if firstName is 'Slab' and lastName isnt 'Slabgle'}
			Hello {firstName}
		{else}
			Hello Stranger!
		{end}

		{* If-Else-If statement *}
		{if firstName eq 'Slab' or firstName neq 'SLAB'}
			Hello {firstName}
		{else if firstName isnt 'Slabble' and firstName isnt 'Slabby'}
			Hi Stranger!
		{end}
	{endslab}

For arrays, you can iterate through items using an `each` statment:

	{slab example}
		{* Array Iteration *}
		{each collection in collections}
			{collection}
		{end}

		{* Array Iteration with Index *}
		{each index,collection in collections}
			{index}: {collection}
		{end}
	{endslab}

Objects can be iterated using the `for` statement:

	{slab example}
		{* Object Iteration *}
		{for person in people}
			{person.name}
		{end}

		{* Object Iteration with Key *}
		{for id,person in people}
			{id}: {person.name}
		{end}
	{endslab}

Slab's `for` statement uses a `hasOwnProperty` guard internally to filter out inherited members. If you want to iterate through all members, use `forEvery`:

	{slab example}
		{forEvery member in object}
			{toString(member)}
		{end}
	{endslab}

Because Slab's parser looks for statements inside a single pair of curly braces, you might run into some issues with stuff you don't want to get parsed. The special `keep` statement can be used to escape parts of your template that you don't want to be included in parsing, such as inline scripts and styles:
	
	{slab example}
		{keep}
			<style>
			#someStyle {color: orange;}
			</style>
			<script>
			var obj = {'this': 'will not be parse'};
			</script>
		{endkeep}
	{endslab}

Slab allows you to include a template inside another template. There's no special designation for partials: all templates can be included into other templates using the `include` statement:

	{slab list}
		<ul>
			{each person in people}
				{include listItem}
			{end}
		</ul>
	{endslab}

	{slab listItem}
		<li>{person.name}</li>
	{endslab}


## Compiling Templates

Slab templates can be compiled using the `slab.compile` function:

	// A template string
	var template = '{slab example}Hello {name}{endslab}!';

	// Compile the template
	var templates = slab.compile(template);

	// Pass a data object to evaluate
	templates.example({name: 'Slab'}) == 'Hello Slab!';

The `slab.compile` function takes a template string and returns a new `SlabTemplate` object. The keys of this object correspond to the identifiers you used to declare your templates, with template function values. You can then pass a data object to these functions and you'll get a string return value.


## Extending Compiled Templates

If you want to override a specific template without having to change the template string directly, you can "extend" a `SlabTemplate` object by passing it together with the new templates to `slab.compile`:

	// The original template
	var template = '{slab example}Hello {name}{endslab}!';

	// Compile the template
	var templates = slab.compile(template);
	templates.example({name: 'Slab'}) == 'Hello Slab!';

	// A new template
	template = '{slab example}Hi {name}{endslab}';
	slab.compile(template, templates);
	templates.example({name: 'Slab'}) == 'Hi Slab!';


## Precompiling Templates

Slab uses a regexp-based parser for compiling the templates into valid JavaScript functions. This compilation is a pretty expensive process, although the resulting final functions are quite fast.

While it's alright to use `slab.compile` during development, it's advised that you precompile your templates. Slab includes a `slab.generate` function that returns a template string that you can copy and paste to a separate file and include in your own application:

	// The original template
	var template = '{slab example}Hello {name}{endslab}!';

	// Precompile the template
	var templates = slab.generate('templateName', template);
	console.log(templates);


## The `slab` CLI Compiler

You can also used the command-line `slab` utility to generate template files. Put the slab repository somewhere in your machine, add these lines to your shell's RC files:

	# Change /path/to/slab!
	export SLABHOME=/path/to/slab
	export PATH=$SLABHOME/bin:$PATH

After that you'll be able to run the `slab` utility. Simply pass it a set of files and it'll output the generated templates:

	$ slab myTemplates.slab > myTemplates.js


## Credits

- Shane Thacker (@shanebo) for the original template syntax idea.
- [DoT JS](https://github.com/olado/doT) for the string escaping.

## Copyright and License
Copyrighted 2012, Mark Obcena <keetology.com>, MIT-Style License
