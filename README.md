# Property in class and object definition



The goal of this proposal is to replace the highly controversial  old proposal "proposal-class-fields"(@[here](https://github.com/tc39/proposal-class-fields)).

The new proposal with a concise implementation and aims to propose and accomplish the following objectives:

* No Fields!
  No new components into the ECMAScript specification.
  
* Syntax beautiful, and friendly concepts, predictable design.
  Concept `private property` are current ECMAScript spec compatibled.

* Easy to implement.

  And makes it easy to implement the `protected` and `public`.

* Less changes.

  Simple first!



The proposal is not tc39 formal now. but have a implement at [prepack-core with proposal-private-property](https://github.com/aimingoo/prepack-core/tree/proposal-private-property) ([@here](https://github.com/aimingoo/prepack-core/tree/proposal-private-property)).

You can try testcase in current project ([@here](#testcases)).



Table of Contents
=================

* [The private-property proposal](#property-in-class-and-object-definition)
  * [Syntax design](#syntax-design)
  * [Concepts](#concepts)
    * [Conceptual syntax of private access](#conceptual-syntax-of-private-access)
  * [Implementation](#implementation)
  * [Implementation for ObjectLiteral](#implementation-for-objectliteral)
  * [Completed and planning](#completed-and-planning)
  * [FAQ](#faq)
  * [Testcases](#testcases)
  * [References](#references)
  * [History](#history)



## Syntax design



**1. define private property in class definition and object literals** 

Use `private` as qualifier to definition property. The syntax is:

   * \<**private**\> \[**static**\] *name* \[**=** *value*\] \[, …\]			
   * \<**private**\> \[**static**\] \[**get** | **set**\] *methodName* **(** *argumentsList* **)** **{** … **}**			

> NOTE: Why use `private` qualifier, not `#`  prefix or sigil? [here](#faq)
>
> NOTE: Support async and generator methods.

The  `protected` and `public` are activation now. at [here](#completed-and-planning).

Examples:

```javascript
// property define in class syntax
// (NOTE: `private` use statement syntax, similar to `var`)
class f {
    // private property for per-instances
    private data = 100;
    // private property for class
    private static data = 200;
    // declaration list (maybe)
    private x, y, z = 100;

    ...
}

// method and accessor define in class syntax
class f {
    private get data() { ... };
    private foo() { ... };
 
    // for static ...
    ... 
}

// in object literal definition
obj = {
    // `private` is qualifier
    private data1: 100,
    private data2,
    private get data3() { ... },

    // normal
    data1: 100,
    ...
}
```



**2. access privated properties**

Read reference using *identifier* or *propertyName* without `this`:

* **Identifier**: *IdentifierName* but not *ReservedWord*.

```javascript
class f {
  private x;
  foo() {
    console.log(x); // accept
  }
}
```
Access private scope with his instances:

* \<**internal**\> **private** *name*...
  set `internal` prefix modifier when class private member definition.
* *instance*\[**internal**.*name*\]
  the syntax same of computed property.

> NOTE: _the implement of conceptual syntax `(private this).x`, informal suggest._
>
> NOTE: *as a conceptual depiction, the `x` equ `(private this).x`.*

```javascript
class MyClass {
  internal private x;

  compare(b) {
    return x === b[internal.x];
  }

  static compare(a, b) {
    return a[internal.x] === b[internal.x];
  }
}
```

Or publish it:

> NOTE: Simple publish private property with normal class definition.
> *(Maybe extended to  `public as x`.)*

```javascript
// ex: publish with same name
class MyClass {
  private x = 100;
  get x() {  // accept
    return x;
  }
}
a = new MyClass;
console.log(a.x); // 100
```



## Concepts

The private property is object instance's private member, it define in class definition and object literals. Normal property is public member and published. They are different  member of private and public scope of object instance.

Private property can only be accessed in method of class and object of them definition lexical. For classes inheritance tree, it's non-inherited and invisible. In runtime, Private scope is a ObjectEnvironment create by `[[Private]]` internal solt of its home object, that is method's `[[HomeObject]]`. All method running in this environment, but the read-write operations happen on the `[[Private]]` internal solt of the instance self.

> NOTE: Object environment is safe at here. @see [here](#faq)


Protected property define in private scope too, but it's inherited and visible. @see [here](#completed-and-planning)



### Conceptual syntax of private access

The `(private a).x` is syntax to depiction private scope access procedure of instances `a`, the procedure will return value of private member `x` of  `a`.

The concept restricts `(private a).x` to be used only for prototype methods or static methods in class declarations, and only allows it to access the private domain of instances of the class in the context of the above methods.

>  NOTE: *The `obj.#x` grammar is a implement of the conceptual syntax, because it is equivalent to `(private obj).x`.*



## Implementation

**Core rules:**

- Identifier resolve  by name of private property but internal access will use private symbol key.
- `AClass.prototype` and `AClass` has `[[Private]]` and `[[Protected]]` when them created at *ClassDefinitionEvaluation* phase, but a instance has `[[Private]]` only when it create by `new AClass()`.

**Implementation steps:**

* IsPrivateEnvironment(env)

  If ObjectEnvironment create by `[[Private]]` object, Return true,
  
  Else Return false.
  
* in ClassDefinitionEvaluation

  For each `private ...` defines, create properties at `AClass.prototype.[[Private]]` by name with a symbol as value. next, create a property use this symbol as key, its value from define statement. 
  
* before call OrdinaryCallBindThis() in [[Construct]] of Function Objects

  `obj.[[Private]] = Object.create(AClass.prototype.[[Private]]);`

* in [[Call]] of ECMAScript Function Objects

  If `F.[[HomeObject]]` is present, let *env* be NewObjectEnvironment with `F.[[HomeObject]].[[Private]]`, and set `env.withEnvironment` to true, `env.privateBase` to `this`.

  Set the outer lexical environment reference of current-environment to *env*.

* rename IsSuperReference() to IsSuperOrPrivateReference();

* in GetIdentifierReference()
  If IsPrivateEnvironment(*env*), set `ref.thisValue` to `env.privateBase` when resolved binding `ref`.

* in GetValue(V)

  Let *env* be `GetBase(V)`.

  If IsPrivateEnvironment(*env*), let *thisObject* be GetThisValue(V), let *privateSymbol* be resolved value in *env*.WithBaseObject()  with GetReferencedName(*env*).

  Return *thisObject*.[[Private]].[[Get]]\(*privateSymbol*, *thisObject*\).

* in PutValue(V, W)

  Let *env* be `GetBase(V)`.
  
  If IsPrivateEnvironment(*env*), let *thisObject* be GetThisValue(V), let *privateSymbol* be resolved value in *env*.WithBaseObject()  with GetReferencedName(*env*).
  
  Let *x* be resolved descriptor in *env*.WithBaseObject()  with *privateSymbol*, and let *parent* be resolved object.
  
  * If *privateSymbol* is not ownKey of *thisObject*.[[Private]]
    * If x is not reference descriptor, add a new data descriptor to *thisObject*.[[Private]] with value W.
    * Else call *parent*.[[Set]]\(*privateSymbol*, W, *thisObject*\)
  
  * Else let *parent* be *thisObject*.[[Private]], *x* be descriptor of *parent*.[*privateSymbol*]. and
    * If x is not reference descriptor, call *parent*.[[Set]]\(*privateSymbol*, W, *parent*\)
    * Else call *parent*.[[Set]]\(*parentSymbol*, W, *thisObject*\)

Done.

**Implementation in constructor method:**

- in SuperCall()

  Update result.[[Private]] to newTarget.prototype.[[Private]] after constuct from parent's constructor() method. and, the result must be instanceof newTarget.

- in [[Call]] of ECMAScript Function Objects

  Accept when thisArgument is null when bind object to private scope.

Done.

> NOTE: Set `env.withEnvironment` to true because it will be used when implementing the protected property.
>
> NOTE: Maybe, A method can support the immutable binding objectEnvironment created with its [[HomeObject]] in MakeMethod(). But if *env* is immutable, then you cannot use `env.privateBase` to pass thisArgument. The good thing is that you don't need to modify the [[call]] internal method to support the runtime dynamic insertion of the objectEnvironment.
>
> NOTE: (Continue note6,) If not use `env.privateBase`, we can resolve `this` object from call stack similar to a SuperPropertyReference.

## Implementation for ObjectLiteral

Limit rules:

* not support `protected`.
* not support `private as`.

Implementation steps:

* Set empty private object after ObjectCreate() for the literal `obj`：
  `obj.[[Private] = Object.create(null) `
* Create all private properties and methods at `obj.[[Private]]` when PropertyDefinitionEvaluation().

Done.


## Completed and planning

- [x] Class definition
- [x] Object Literal definition(Object Initializer)
- [ ] protected property, with override
  - [ ] support super call (maybe)
- [ ] destructuring assignment (maybe)
- [ ] declaration list (maybe)
- [x] same name normal property
- [x] in eval()
- [x] in arrow functions
- [x] in get/setter methods
- [x] in inner other function type



## FAQ

* **Why use `private` as qualifier, not `#` prefix or sigil?**

`sigil + sigil + sigil + sigil + sigil == Readability * 2**-5`

`prefix + prefix + prefix + prefix + prefix == Readability * 2**(-5*2)`

and，If use  `#` character,  we may not be able to design the syntax of protected property.



* **Why is `private property` is safe and feasible?**

1. Internal slot `[[HomeObject]]` is ECMAScript component and initialzation by MakeMethod in ClassConstructor or ObjectCreate process.

   For methods, the `[[HomeObject]]` is immutable, so using `HomeObject.[[Private]]` to create `ObjectEnvironment` will get a definite context.

2. AClass.prototype is readonly.

   So object instances can always get a valid private property chain from his internal slot, without being affected by behavior like `Object.setPrototypeOf(aClass.prototype, ...)`.

3. ObjectEnvironment is safe in the static context of non-public object instance.

   No one can get the host instance for this ObjectEnvironment, so this environment is static and secure, and there is no identifier ambiguity or violates lexical scope similar to the use of the `with` statement. @see Eich's point of view: [Violates lexical scope for `with` statement](http://2ality.com/2011/06/with-statement.html).



## Testcases

The proposal has full test case in repository, current syntax based.

```bash
# install test framework
> mkdir node_modules
> npm install fancy-test chai mocha --no-save
# test it
> mocha

# (OR)
> bash run.sh
```



## References

* [Objections to fields, especially the private field syntax](https://github.com/tc39/proposal-class-fields/issues/150)
* [The proposal should be rejected!](https://github.com/tc39/proposal-class-fields/issues/148)
* [My comments at #100](https://github.com/tc39/proposal-class-fields/issues/100#issuecomment-429533532)



## History

2019.08.21 first version of implement solution.

2019.07.29 new solution release.

2018.10.19 initial release.
