# Property in class and object definition



The goal of this proposal is to replace the highly controversial  old proposal "proposal-class-fields". The new proposal with a concise implementation and aims to propose and accomplish the following objectives:

* No Fields!
  No new components into the ECMAScript specification.
* Friendly syntax and concepts, predictable design.
  Concept `private property` are compatible with Current ECMAScript spec.

* Easy to implement.
* Less changes.



> **NOTE:** HOW TO deliver this to TC39 proposals? 
>
> The proposal is not tc39 formal, Because I am not "members of TC39 or  ... registered via Ecma International", and the [registered](https://tc39.github.io/agreements/contributor) form is invalid always after press submit. 



## Syntax

**1. define property in class definition**

```java
// The syntax declaration is similar to ObjectLiteral definition 
class f {
    // properties
    data: 100,
    static data: 200,

    // methods
    foo() {
        ...
    }
}
```

by default, public properties define equal next steps:

```javascript
// for instances
//   - data: 100
f.prototype.data = 100;

// for class
//   - static data: 200
f.data = 200;
```

> NOTE1: Why is `:` not `=`?  [here](#faq)
>
> NOTE2: Why is `,` not `;`?  [here](#faq)



**2. define private property in class and object definition**

```java
// in class definition
class f {
    // private property for per-instances
    private data: 100,
    // private property for class
    private static data: 200
}

// in object definition
// (NOTE: `get` or `set` is qualifier of accessor, `private` too.)
obj = {
    // `private` is qualifier
    private data: 100,
    private data,
    private get data() { ... }
    // normal
    data: 100,
    data,
    get data() { ... }
}
```

> NOTE3: Why is `private` as qualifier, not `#` as prefix or sigil? [here](#faq)



**3. method is property, so `private` is allow**

```java
class f {
    private foo() { ... }
    private static foo() { ... }
}

obj = {
    private get foo() { ... }
}
```



**4. access privated properties**

> NOTE: The `#` is an operator and context limited, only used in methods.

```java
class f {
	private data,
    private static data: new Object,
    foo(x) {
        this#data = 100; // standard syntax
        #data = 100;     // unary operator, equ this#data
        #data = x#data;  // allow when x is instanceof f
    }
    static foo(x) {
        console.log(#data == f#data); // true 
        console.log(#data == this#data); // true, when this is f()
        console.log(#data == x#data); // true, when x is f()
    }
}
```

## Implementation

@see [example.js](example.js):

* **STEP1: MAP PRIVATE PROPERTIES**
  Create a `name->privateKey` map and put it to prototype's [[PrivateKeys]] internal slot. and, register all `name/value pair` as a initializer.

  * solution1: add to prototype as Initialized property;
  * solution2: add to [[PrivateKeys]] table as PrivateKey record.

  Complete MAP process on Class/ObjectLiteral initialization.

* **STEP2: PUT PRIVATE PROPERTIES**
  Use `privateKey/value pair` as private properties add to instanceo of Class.
  Complete PUT process on class's constructor phase.

* **STEP3: GET PRIVATE PROPERTIE**
  Use `x#name` syntax to access private property, put `method.[[HomeObject]]` and `x` as arguments, the `method` is `current active function` of ThisEnvironment always.
  The `#` is context limited operator, similar to`super`. 

  > NOTE: Similarly, `super` and `eval` and arrow functions also use ThisEnvironment.

Ok. please read the source code, which will demonstrate how to implement the example below ([Source code](example.js)):

```java
class ClassEx {
  private data: 200,

  private foo() {
    console.log("in instances,", '#data is ' + #data);
  }

  test(x) {
    console.log(#data);
    x#data = 'Hello World!';
    x#foo();
  }
}

// testcases
var obj = new ClassEx;
var more = new ClassEx;
obj.test(more);
```

Run in console with nodejs: 

```bash
> node example.js
200
in instances, #data is Hello World!
```

And you can find a bigger example in the repo. ^^.



## Completed and planning

- [x] Class definition
- [x] Object Literal definition(Object Initializer)
- [ ] protect property, with override, support super#data (maybe?)
- [ ] destructuring assignment
- [x] same name normal property
- [x] in eval()
- [x] in arrow functions
- [x] in get/setter methods
- [-] in inner other function type



## FAQ

* Why is `:` not `=` ?

Token `:` is separator of object `key/value pair`, and ObjectLiteral definition is already the case, why not?

> NOTE: the syntax `data: String = 'aabb'` is ok in TypeScript. In the case, the `:` used by type declare, so `=` as data define. JavaScript don't need that.



* **Why is `,` not `;`?**

Token `,` is list separator for all of define, arguments, array and records, etc. So, obviously it should be `,`.

> NOTE: `;`  is statement separator.



* **Why is `private` as qualifier, not `#` as prefix or sigil?**

`sigil + sigil + sigil + sigil + sigil == Readability * 2**-5`

`prefix + prefix + prefix + prefix + prefix == Readability * 2**(-5*2)`



* **Why is `private property` is safe and feasible?**

1. Internal slot [[HomeObject]] is ECMAScript component and initialzation by MakeMethod in ClassConstructor or ObjectCreate process.
2. AClass.prototype is readonly.
3. You can‘t get privateKey's symbol, so cant access it as own property. all private/protected property is not allow enumerate, because has `[[Scope]]` attribute in his PropertyDescriptor with value 'private' or 'protecte'.
4. `#` has no effect on existing attribute operations, and context limited.
5. `super` is okay, so, ...



## References

* [Objections to fields, especially the private field syntax](https://github.com/tc39/proposal-class-fields/issues/150)
* [The proposal should be rejected!](https://github.com/tc39/proposal-class-fields/issues/148)
* [My comments at #100](https://github.com/tc39/proposal-class-fields/issues/100#issuecomment-429533532)



## History

2018.10.19 initial release.
