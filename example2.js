// simple uniqure key
const _UniqueKey = Symbol;

/******************************************************************************
 * Fake some internal abstract operations of ECMAScript
 *****************************************************************************/
// https://tc39.github.io/ecma262/#sec-makemethod
function MakeMethod(F, homeObject) {
  F["[[HomeObject]]"] = homeObject; // is internal slot in sepc.
  return F;
}

// https://tc39.github.io/ecma262/#sec-implicit-completion-values
function Assert(T, message) {
  if (!T) throw Error(message);  // will return ThrowCompletion() in sepc.
}

// https://tc39.github.io/ecma262/#sec-getvalue
let GetValue = (V) => V.base[V.name];

// https://tc39.github.io/ecma262/#sec-putvalue
let PutValue = (V, W) => void (V.base[V.name] = W);

// https://tc39.github.io/ecma262/#sec-hasownproperty
let HasOwnProperty = (O, P) => O && (P in O);

// simple call when Reference's value is function
let Call = (V, ...args) => V.base[V.name].apply(V.base, args);

/******************************************************************************
 * Expect updates, in ECMAScript
 *****************************************************************************/
const IsPublic = ({scope}) => scope == undefined || scope == 'public';

// 19.1.2.10 Object.getOwnPropertySymbols ( O )
function Object_getOwnPropertySymbols(O) {
  return GetOwnPropertyKeys(O, Symbol)
    .filter(symbol => IsPublic(Object.getOwnPropertyDescriptor(O, symbol)));
}

//   - https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
function Object_getOwnPropertyDescriptors(O) {
   // after 19.1.2.8 - 4.a
   // If desc has not an [[Scope]] field or desc.[[Scope]] is 'public' then
   if (IsPublic(desc)) {
      // continue 4.b ~ 4.c
   }
}

// disable write scope for user code
// https://tc39.github.io/ecma262/#sec-validateandapplypropertydescriptor
function ValidateAndApplyPropertyDescriptor ( O, P, extensible, Desc, current )
  // Assert Desc has not a [[Scope]] field
  // (OR?) Assert Desc[[Scope]] is either 'public' or null
}

/******************************************************************************
 * Proposal implementation details
 *****************************************************************************/
// CreateDataProperty() with private scope
// @see https://tc39.github.io/ecma262/#sec-createdataproperty
function CreatePrivateProperty (O, P, V, scope='private') {
  let desc = { scope, writable: true, value: V };
  if (typeof V == 'function') desc.writable = false;
  Object.defineProperty(O, P, desc); //uncompleted, write [[Scope]] field
}

// The <nodes> from syntax parser
function _InitPrivateKeys(proto, nodes) {
  let names = Object.keys(nodes);
  let privateKeys = {};

  names.forEach(name => {
    // is internal call in ECMAScript
    if (typeof nodes[name] == 'function') MakeMethod(nodes[name], proto);

    // generate every time
    let key = _UniqueKey();

    // [STEP1: MAP PRIVATE PROPERTIES]
    /* solution 1 */
    privateKeys[name] = key;
    CreatePrivateProperty(proto, key, nodes[name]);
    /* solution 2 */
    // privateKeys[name] = {key, value: nodes[name], scope: 'private'};
  });

  // save to internal solt
  proto["[[PrivateKeys]]"] = privateKeys;
}

function _ClonePrivateProperties(proto, instance) {
  // load from internal solt
  let privateKeys = proto["[[PrivateKeys]]"];

  // or `let keys = Object.values(privateKeys)`
  let keys = Object.keys(privateKeys).map(key=>privateKeys[key]);

  // [STEP2: PUT PRIVATE PROPERTIES]
  // solution 1: clone from prototype
  keys.forEach(privateKey => {
    instance[privateKey] = proto[privateKey]; //uncompleted, clone with PropertyDescriptor
  })
  /* solution 2: create every time
  keys.forEach(r => { // PrivateKey Record
    CreatePrivateProperty(instance, r.key, r.value, r.scope);
  })
  */
}

// faked
function _Init_OnClassConstructor(X) {
  // static private data: 100
  // static private foo() {}
  _InitPrivateKeys(X, {
    data: 100,
    foo: function() {
      console.log("in Class");
    }
  });

  // private data: 200
  // private foo() {}
  _InitPrivateKeys(X.prototype, {
    data: 200,
    foo: function f() {
      console.log("in instances,", '#data is ' + GetValue(op('this#data', [this, f])));
    }
  });

  MakeMethod(X.prototype.test, X.prototype);
  MakeMethod(X.test, X);
}

function _Init_OnObjectCreate(x) {
  // private data: 300
  // private foo() {}
  _InitPrivateKeys(x, {
    data: 300,
    foo: function() {
      console.log("in literals");
    }
  });
  MakeMethod(x.test, x);
}

// `#` operation, return Reference type
function op(stmt, args) {
  // Static Semantics: `this#data`
  let [l, r] = stmt.split('#');
  if (!l) l = 'this';

  // Runtime:
  // @see https://tc39.github.io/ecma262/#sec-property-accessors-runtime-semantics-evaluation
  // @see https://tc39.github.io/ecma262/#sec-getsuperconstructor
  //   let instance be GetValue from result_of_evaluating(l). // It's ECMAScript evaluating.
  //   let method be activeFunction. // The `activeFunction` be envRec.[[FunctionObject]]
  let [instance, method] = args;

  // Algorithm:
  //  - get key from table in homeObject
  let homeObject = method['[[HomeObject]]'];
  //  - [STEP3: GET PRIVATE PROPERTIE]
  let key = homeObject["[[PrivateKeys]]"][r];

  //  - a Reference of 'this#data', and IsPropertyReference(ref) is true.
  let ref = { base: instance, name: key };

  //  - check private access
  Assert(HasOwnProperty(ref.base, ref.name), 'Invalid private access.');
  return ref;
}

/******************************************************************************
 * Example
 *****************************************************************************/
class ClassEx {
  // CALL _Init_OnClassConstructor() when class Definition evaluation
  // ------------
  // static private data: 100
  // static private foo() {}
  // private data: 200
  // private foo() {}

  constructor() {
     // add to Runtime Semantics in `9.2.2 [[Construct]]`, after get <this>
     _ClonePrivateProperties(ClassEx.prototype, this);
  }

  // normal methods
  test(x) {
    let current = ClassEx.prototype.test;
    console.log("===== for instances =====")
    console.log('Get `this#data`:', GetValue(op('this#data', [this, current])));
    console.log('Get `#data`:', GetValue(op('#data', [this, current])));
    console.log('Get `x#data`:', GetValue(op('x#data', [x, current])));

    console.log(' -> Update value of `x#data`...');
    PutValue(op('x#data', [x, current]), 'Hello World!');

    console.log(' -> Recheck...');
    console.log('Get `#data`:', GetValue(op('#data', [this, current])));
    console.log('Get `x#data`:', GetValue(op('x#data', [x, current])));

    Call(op('#foo', [x, current]));
  }

  // normal static methods
  static test() {
    let current = ClassEx.test;
    console.log("====== for classes ======")
    console.log('Get `this#data`:', GetValue(op('this#data', [this, current])));
    Call(op('#foo', [this, current]));
  }
}

var obj2 = {
  // CALL _Init_OnObjectCreate() when property definition evaluation
  // ------------
  // private data: 300
  // private foo() {}

  test() {
    let current = obj2.test;
    console.log("== for object literals ==")
    console.log('Get `#data`:', GetValue(op('#data', [this, current])));

    try {
      console.log('Try `x#data` when x is other object.');
      let x = new Object;
      op('x#data', [x, current]);
    }
    catch(e) {
      console.log('  Error:', e.message);
    }

    Call(op('#foo', [this, current]));
  }
}

// add to Runtime Semantics in `14.6.13: ClassDefinitionEvaluation`
_Init_OnClassConstructor(ClassEx);

// add to Runtime Semantics in `12.2.6.8 PropertyDefinitionEvaluation`
_Init_OnObjectCreate(obj2);


// Run test cases
var obj = new ClassEx;
var more = new ClassEx;
obj.test(more);

ClassEx.test();

obj2.test();
obj2.faked = (new ClassEx).test;
try {
  console.log('Try faked methods.');
  obj2.faked();
}
catch(e) {
  console.log('  Error:', e.message);
}