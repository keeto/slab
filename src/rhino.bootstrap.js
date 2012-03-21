importPackage(java.io);
importPackage(java.lang);

function showHelp(){
	java.lang.System.out.println('usage: slab file1.slab file2.slab ...');
	quit(0);
}

function readStdin(){
	var stdin = new BufferedReader(new InputStreamReader(System['in'])),
	    lines = [];
	while(stdin.ready()) lines.push(stdin.readLine()); 
	return (lines.length) ? lines.join('\n') : null;
}

function generate(filename, str){
	filename = filename || 'templates';
	try {
		var result = slab.generate(filename, str);
	} catch(e){
		java.lang.System.out.println('Cannot generate template: ' + e.message);
		quit(1);
	}
	java.lang.System.out.println(js_beautify(result));
	quit(0);
}

function main(args){
	var input = readStdin();
	if (!input){
		if (!args.length) showHelp();
		input = [];
		for (var i = 0, l = args.length; i < l; i++){
			input.push(readFile(args[i]));
		}
		input = input.join('\n');
	}

	var parts = (args[0] || 'template.js').split(/\.|\/|\\/);
	parts.pop();
	return generate(parts.pop(), input);
}

main(arguments);
