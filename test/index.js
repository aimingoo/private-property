var execute = require('./prepack-core/prepack.min.js').default;
var fancy = require('fancy-test').fancy;
var expect = require('chai').expect;

describe("Simple class declaration", ()=> {
	fancy.stdout().stderr().
	it('Simple private property', output => {
		execute(`
			class MyClass {
				private x = 100;
				foo() {
					return x;
				}
			}
			console.log((new MyClass).foo());
		`);
		expect(output.stdout).to.eql('100\n');
	});

	fancy.stdout().stderr().
	it('Simple static private property', output => {
		execute(`
			class MyClass {
				private static x = 200;
				static foo() {
					return x;
				}
			}
			console.log(MyClass.foo());
		`);
		expect(output.stdout).to.eql('200\n');
	});
});

describe("Simple object literal", ()=> {
	fancy.stdout().stderr().
	it('Simple private property', output => {
		execute(`
			var obj = {
				private x: 300,
				foo() {
					return x;
				}
			}
			console.log(obj.foo());
		`);
		expect(output.stdout).to.eql('300\n');
	});
});

describe("Constructor method", ()=> {
	fancy.stdout().stderr().
	it('Normal non extends constructor', output => {
		execute(`
			class MyClass {
				private x = 400;
				constructor() {
					console.log(x);
				}
			}
			new MyClass;
		`);
		expect(output.stdout).to.eql('400\n');
	});

	fancy.stdout().stderr().
	it('Normal extends constructor', output => {
		execute(`
			class MyClass extends Object {
				private x = 500;
				constructor() {
					super();
					console.log(x);
				}
			}
			new MyClass;
		`);
		expect(output.stdout).to.eql('500\n');
	});
});

describe("Private scope access", ()=> {
	fancy.stdout().stderr().
	it('In prototype method', output => {
		execute(`
			class MyClass {
				internal private x = new Object;
				foo(b) {
					return x === b[internal.x];
				}
			}

			console.log((new MyClass).foo(new MyClass));
		`);
		expect(output.stdout).to.eql('true\n');
	});

	fancy.stdout().stderr().
	it('In class method', output => {
		execute(`
			class MyClass {
				internal private x = 100;
				static foo(a) {
					return a[internal.x];
				}
			}

			console.log(MyClass.foo(new MyClass));
		`);
		expect(output.stdout).to.eql('100\n');
	});
});

describe("Hijack method", ()=> {
	fancy.stdout().stderr().
	it('Try same private name access', output => {
		execute(`
			var x = 'global';

			class MyClass {
				private x = 100;
			}

			class OtherClass {
				private x = 200;
				foo() {
					console.log(x);
				}
			}

			var a = new MyClass;
			var b = new OtherClass;
			b.foo.call(a);
		`);
		expect(output.stdout).to.eql('undefined\n');
	});

	fancy.stdout().stderr().
	it('Try same private name access by object literal ', output => {
		execute(`
			var x = 'global';

			class MyClass {
				private x = 100;
			}

			var b = {
				private x: 200,
				foo() {
					console.log(x);
				}
			}

			var a = new MyClass;
			b.foo.call(a);
		`);
		// expect(output.stderr.length).to.eql(0);
		expect(output.stdout).to.eql('undefined\n');
	});


	fancy.stdout().stderr().
	it('Try force internal access', output => {
		execute(`
			var publicMember = new Object;
			class MyClass {
				private x = 100;
				static foo(a) {
					console.log([typeof internal, typeof internal.x, a[internal.x] === publicMember]);
				}
			}
			var a = new MyClass;
			a["undefined"] = publicMember;
			MyClass.foo(a);
		`);
		// expect(output.stderr.length).to.eql(0);
		expect(output.stdout).to.eql('object,undefined,true\n');
	});
});
