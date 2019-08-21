var execute = require('./prepack-core/prepack.min.js').default;
var fancy = require('fancy-test').fancy;
var expect = require('chai').expect;

describe("Simple class declaration", ()=> {
	fancy.stdout().
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

	fancy.stdout().
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
	fancy.stdout().
	it('Simple private property', output => {
		execute(`
			let obj = {
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
	fancy.stdout().
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
	fancy.stdout().
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