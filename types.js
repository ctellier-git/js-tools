
/*
MIT Licence
Copyright (c) 2020 Clement Tellier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

//const _fileName_ = "types.js";
//const _moduleDir_ = import.meta.url.substring(0,import.meta.url.lastIndexOf("/"));

/*
if ((typeof(p)==="object" || typeof(p)==="function") && (p!==null))
- To be used before "indirecting" like p["prop"] or p.prop.
- To be used to ensure that doing "p['prop']" or "p.prop" won't throw a ReferenceError on an undefined element.

Not intend to tell whether or not p is an instance of "Object",
But
intend to tell whether or not p is an "object" (notice the lowercase "o") according to EcmaScript spec.
reminder:
before considering "classes" (or prototypes), EcmaScript implies lower type definition:
- object
- function
- literals
- etc.

Then, every instance that uses the "prototype" mechanism are of type "object" (and also instance of Object but that
is not the question here), it means that they are dictionaries.

Remarks:
"Objects" are "objects", but the opposite could not be true (well, in practice, hard to find an exemple !)
"typeof" should be considered prior to "instanceof". if "typeof" does not answer "object", "instanceof"
will be always false.
"bonjour" instanceof String => false (typeof("bonjour") => "string" which is a literal !)
but
typeof (new String("bonjour")) => "object" and then new String("bonjour") instanceof String => true (and also instanceof Object => true)

So "isDictionary" answers to "is it safe to do "p['prop']" or "p.prop" on "p" ?

Warning, the method does not do any test on "p.prop" ! This one can be null or undefined, but it exists.

// commenting "isObject" will force devs to check twice:
// Is there any confusion with "isDictionary" ?
// Since "isObject" does not exist and "isDictionary" is an unusual name
// it may force them to look for more info...
// reminder: JS "object" concept is blurry, more often, we need to know whether
// an indirection will work with raising an error, and this is exactly the purpose
// of "isDictionary".
// isObject = function (p) {
	// return (p instanceof Object);
// };
*/
const isDictionary = function (p) {
	if ((typeof(p)==="object" || typeof(p)==="function") && p!==null) return true;
	// if ((typeof(p)==="object" && p!==null) || typeof(p)==="function") return true; is it equal result but faster ?
	else return false;
};

/*
isObjectNotFunction is useful since function are special objects.
but isObjectNotArray is useless by considering that an array is an object, then
first test on isObject and then test on isArray.
*/
const isDictionaryNotFunction = function (p) {
	if (typeof(p)==="object" && p!==null) return true;
	else return false;
};


// const isDeclared = function (p) {return p!==undefined}
const isDefined = function (p) {
	return (typeof(p)!="undefined");
};

/*
"is Defined and Not Null"
*/
const isDNN = function (p) {
	return (typeof(p)!="undefined" && p!=null);
};


const isArray = function (p) {
	return Array.isArray(p) || (p instanceof Array);
};

const isFunction = function (p) {
	return (typeof (p)==="function");	// return (p instanceof Function)
};

const isStringObject = function (p) {
	return (p instanceof String);
};

const isStringLiteral = function (p) {
	return (typeof(p)=="string");
};

const isString = function (p) {
	return (isStringLiteral(p) || isStringObject(p));
};

const isSNL0 = function (p) {
	if (isString(p)) return p.valueOf().length!=0;
	else return false;
};

const isNumberObject = function (p) {
	return (p instanceof Number);
};

const isNumberLiteral = function (p) {
	return (typeof(p)=="number");
};

const isNumber = function (p) {
	return (isNumberObject(p) || isNumberLiteral(p));
};

const isBooleanLiteral = function (p) {
	return (typeof(p)=="boolean");
};

const isBooleanObject = function (p) {
	return (p instanceof Boolean);
};

const isBoolean = function (p) {
	return (isBooleanLiteral(p) || isBooleanObject(p));
};

export {
	isDictionary,
	isDictionaryNotFunction,
	//isDeclared,
	isDefined,
	isDNN,
	isArray,
	isFunction,
	isStringObject,
	isStringLiteral,
	isString,
	isSNL0,
	isNumberObject,
	isNumberLiteral,
	isNumber,
	isBooleanLiteral,
	isBooleanObject,
	isBoolean
};
