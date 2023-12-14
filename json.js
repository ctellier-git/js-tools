
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


import * as types from "./types.js";


const formatOnException = function () {
	let onException = function (e, exceptions) {
		if (arguments.length>1) exceptions.push(e);
		// console.error(e);
		throw e;
	};
	
	if (arguments.length>0 && typeof(arguments[0])!="undefined" && arguments[0]!=null) {
		if (isFunction(arguments[0])) {
			onException = function (e, exceptions) {
				if (arguments.length>1) exceptions.push(e);
				arguments[0](e);
			}
		}
		else switch (arguments[0].toString().toLowerCase()) {
			// case "debug":
				// onException = function(e, exceptions) {
					// if (arguments.length>1) exceptions.push(e);
					// console.debug(e);
				// }
				// break;
				
			case "log":
				onException = function(e, exceptions) {
					if (arguments.length>1) exceptions.push(e);
					console.log(e);
				}
				break;
				
			case "warn":
				onException = function(e, exceptions) {
					if (arguments.length>1) exceptions.push(e);
					console.warn(e);
				}
				break;
			
			case "false":
				onException = function (e, exceptions) {
					if (arguments.length>1) exceptions.push(e);
				};
				break;

			case "error":
				onException = function(e) {
					exceptions.push(e);
					console.error(e);
				}
				break;
				
			case "raise":
			case "throw":
			// default:
			onException = function(e, exceptions) {
				if (arguments.length>1) exceptions.push(e);
				throw e;
			}
			break;
		}
	}
	
	return onException;
};

const formatOnExceptionOpt = function (pOptions) {
	
	let onException;
	if (arguments.length>0 && typeof(arguments[0])!="undefined") {
		let field = "onException";
		if (arguments.length>1 && typeof(arguments[1])!="undefined" && arguments[1]!=null) field = arguments[1];
		onException = arguments[0][field];
	}
	return formatOnException(onException);
};

/*
/!\ The returned function is not a real copy of the parameter. It encapsulates code that calls the given parameter using an anonymous function,
making it slighlty slower than the original one.
/!\ the parameter "name" property can't be copied, the returned function will have its "name" property set to "anonymous".
But
The advantage of calling this method is to provide an new "dictionary". It is still a function, callable, with a copy of all
the additional properties that could have been added to the instance. It means that modifying those properties on the returned value
won't modify the parameters' ones !
*/
const cloneFunction = function (p) {
	// <compiler:debug>
	if (typeof(p)!="function") throw new TypeError();
	// </compiler:debug>
	var fcn = function () {return p.apply(this, arguments);};
	Object.setPrototypeOf(fcn, Object.getPrototypeOf(p));
	let names = Object.getOwnPropertyNames(p);
	for (let i in names) {
		let d = Object.getOwnPropertyDescriptor(p, names[i]);
		if (typeof(d)=="undefined" || d.writable)				// not read-only property ! (in strict mode, readonly affectation raise an Error)
			fcn[names[i]] = clone(p[names[i]]);
	}
	return fcn;
};


/*
? breadth-first ? Not exactly...

- Detects loops.
- Preserve sharings: when 2 brothers share a child (when 2 brothers both have a property of type Object that points to the same object), this child won't be clone 2 times,
  instead, the first time the child is seen, it is clone and then added to the "done" map, so that next time it is seen, the clone is "pointed to" instead of cloning a second time.

/!\ reminder: functions cannot be copied ! So the current method use "cloneFunction" that creates a slightly slower function...
    except if (pOptions.cloneFunction==false) which is the default setting
	Note:
	with "cloneFunction==false", the entire function object won't be clone, it means that if there is some additional properties added to the function, like:
	a = function () {};
	a.prop = new Object();
	Then a.prop won't be cloned.
	
/!\ Do not copy the Symbol

/!\ when a property descriptor describes accessor and not data, the "get" and "set" methods are not cloned.

/!\ Obvious but good to remind: do not clone "__proto__".



pOptions.cloneFunction

pOptions.map
	- of type Array => list of objects to point to instead of cloning
	- of type Map => when a key is seen, point to the value instead of cloning the key

*/
const clone = function (pSrc, pOptions) {

	let cloneFunction = false;
	let map = null;
	
	// if (isDictionary(arguments[1])) cloneFunction = arguments[1].cloneFunction ?? cloneFunction;
	// without coalescence operator (/!\ it also changes a little bit the method signature since it now uses "valueOf"):
	if (arguments.length>1 && types.isDictionary(arguments[1]) && types.isBoolean(arguments[1].cloneFunction)) cloneFunction = arguments[1].cloneFunction.valueOf();
		
	if (typeof(pSrc)=="function") {
		if (cloneFunction) return cloneFunction(pSrc);
		else return pSrc;
	}
	else {
		const done = new Map();
		
		if (arguments.length>1) {
			if (Array.isArray(arguments[1].map)) for (let i=0 ; i<arguments[1].map.length ; ++i) done.set(arguments[1].map[i], arguments[1].map[i]);
			else if (arguments[1].map instanceof Map) arguments[1].map.forEach((value,key)=>done.set(key,value));
		}
		const result = Object.create(Object.getPrototypeOf(pSrc));
		const srcStack = [pSrc];
		const dstStack = [result];
		while (srcStack.length>0) {
			const wSrc = srcStack.pop();
			const wDst = dstStack.pop();
			if(done.get(wSrc)==undefined)  {
				const names = Object.getOwnPropertyNames(wSrc);
				for (let i=0 ; i<names.length ; ++i) {

					// const dd = Object.getOwnPropertyDescriptor(wDst, names[i]);
					
					const d = Object.getOwnPropertyDescriptor(wSrc, names[i]);
					
					// if (typeof(dd)=="undefined" || dd.writable) {
					
					if (!types.isFunction(d.get) && !types.isFunction(d.set)) {
						/*
						The descriptor is a "data descriptor"
						*/
					
					
						if (typeof(wSrc[names[i]])=="function") {
							
							// // if (cloneFunction) wDst[names[i]] = cloneFunction(wSrc[names[i]]);
							// // else wDst[names[i]] = wSrc[names[i]];
							
							// if (cloneFunction) d.value = cloneFunction(wSrc[names[i]]);
							// else d.value = wSrc[names[i]];							
							// Object.defineProperty(wDst, names[i], d);
							
							
							if (cloneFunction) {
								const tmp = done.get(wSrc[names[i]]);
								if (typeof(tmp)=="undefined") {
									/* wSrc[names[i]] not yet cloned, clone it ! */
									d.value = cloneFunction(wSrc[names[i]]);
									Object.defineProperty(wDst, names[i], d);
									srcStack.push(wSrc[names[i]]);
									dstStack.push(wDst[names[i]]);
								}
								else {
									/* wSrc[names[i]] has already been cloned, use the clone ! */
									d.value = tmp;
									Object.defineProperty(wDst, names[i], d);
								}
							}
							else {
								d.value = wSrc[names[i]];							
								Object.defineProperty(wDst, names[i], d);
							}
							
						}
						// [EDIT: 08/05/2023.]
						// it seems not to change anything. More investigation required:
						// the browser generates a String object from the native string...
						// something weird.
						// commented to rollback.
						// else if (typeof(wSrc[names[i]])=="string") {
							// d.value = wSrc[names[i]];
							// Object.defineProperty(wDst, names[i], d);
						// }
						// [END EDIT: 08/05/2023]
						else if (typeof(wSrc[names[i]])=="object") {
							/*
							[EDIT 08/05/23: check the previous "else if" blocks !]
							
							optimization ?
							If the browser provide a slightly different version for "native" language objects
							such as String, Number, etc. (which could be optimized) but only provided by new String|Number|etc.
							then it could be useful to add here the following statements:
							if (wSrc[names[i]] instanceof String) {
								wDst[names[i]] = new String();
								...
							}
							else if (wSrc[names[i]] instanceof Number) {}
							else if ...
							
							But then, there is a special care to give to additional properties that could have been
							added to the wSrc[names[i]] instance which does not belong to the std String properties
							but which required to be cloned !
							
							To better understand, give a look in a debugger, while going through the current method, you will
							see that while "cloning" a String as an exemple, wDst is currently an "object" with the properties
							named with number for each letter of the string. Which is lead to a presentation in the debugger that
							is different than the one of a String...
							*/
							if (wSrc[names[i]]!=null) {
								// // wDst[names[i]] = Object.create(Object.getPrototypeOf(wSrc[names[i]]));
								// d.value = Object.create(Object.getPrototypeOf(wSrc[names[i]]));
								// Object.defineProperty(wDst, names[i], d);
								// srcStack.push(wSrc[names[i]]);
								// dstStack.push(wDst[names[i]]);
								
								const tmp = done.get(wSrc[names[i]]);
								if (typeof(tmp)=="undefined") {
									/* wSrc[names[i]] not yet cloned, clone it ! */
									d.value = Object.create(Object.getPrototypeOf(wSrc[names[i]]));
									Object.defineProperty(wDst, names[i], d);
									srcStack.push(wSrc[names[i]]);
									dstStack.push(wDst[names[i]]);
								}
								else {
									/* wSrc[names[i]] has already been cloned, use the clone ! */
									d.value = tmp;
									Object.defineProperty(wDst, names[i], d);
								}
							}
							else wDst[names[i]] = null;
						}
						else {
							// wDst[names[i]] = wSrc[names[i]];
							Object.defineProperty(wDst, names[i], Object.getOwnPropertyDescriptor(wSrc, names[i]));
						}
					
					}
					else {
						/*
						The descriptor is a "accessor descriptor"
						*/
						Object.defineProperty(wDst, names[i], d);
					}
					
					// }
				}
				done.set(wSrc, wDst);
			}
		};
// console.log("done size = "+done.size);
// debugger;
		return result;
	}
};

const doNotCloneObjects = [window, document, navigator, location, localStorage, sessionStorage/*, speechSynthesis*//*, clientInformation*/, history, indexedDB, performance, screen/*, styleMedia*//*, trustedTypes*//*, visualViewport*/, locationbar, menubar, personalbar, scrollbars, statusbar, toolbar];

/*
merge A into B

/!\ when a property is described by accessor, the "get" value is copied, not the "accessor" descriptor.

*/

const merge = function (A, B, pOptions) {

	let cloneRef = false;
	let prioA = true;
	
	let typeExceptions = [];
	let onTypeException = formatOnException();
		
	// if (arguments.length>2 && typeof(arguments[2])=="object" && arguments[2]!=null) {
	if (arguments.length>2 && types.isDictionary(arguments[2])) {
		// cloneRef = arguments[2].clone ?? cloneRef;
		// prioA = arguments[2].prioA ?? prioA;
		// without coalescence operator (/!\ it also changes a little bit the method signature since it now uses "valueOf"):
		if (types.isBoolean(arguments[2].clone)) cloneRef = arguments[2].clone.valueOf();
		if (types.isBoolean(arguments[2].prioA)) prioA = arguments[2].prioA.valueOf();
		
		// if (typeof(arguments[2].onTypeException)!="undefined" && arguments[2].onTypeException!=null) onWarn = formatOnExceptionOpt(arguments[2].onTypeException, "onTypeException");
		// if (typeof(arguments[2].typeExceptions)!="undefined" && arguments[2].typeExceptions!=null) typeExceptions = arguments[2].typeExceptions;
		// Taking advantage of "isDNN"
		if (types.isDNN(arguments[2].onTypeException)) onWarn = formatOnExceptionOpt(arguments[2].onTypeException, "onTypeException");
		if (types.isDNN(arguments[2].typeExceptions)) typeExceptions = arguments[2].typeExceptions;
	}
	let cloneOptions = null;
	if (typeof(cloneRef)=="object" && cloneRef!=null) {
		cloneOptions = cloneRef;
		cloneRef = true;
	}
	
	let srcStack = [A];
	let dstStack = [B];
	
	while (srcStack.length>0) {
		
		let wSrc = srcStack.pop();
		let wDst = dstStack.pop();
		
		let names = Object.getOwnPropertyNames(wSrc);
		
		for (let i=0 ; i<names.length ; ++i) {
				
			let d = Object.getOwnPropertyDescriptor(wDst, names[i]);
			
			if (typeof(d)=="undefined") {
				/*
				whatever "src[prop]" is, dst[prop] does not exist, so let's create it.
				Whether to create it has a deep clone or simple copy depends on the options that
				"merge" knows how to deal with.
				*/
				if (Object.isExtensible(wDst)) {
					if (cloneRef) wDst[names[i]] = clone(wSrc[names[i]], cloneOptions);
					else wDst[names[i]] = wSrc[names[i]];
				}
				else onTypeException(new MergeTypeException("the destination is not \"extensible\"", A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
				
				/*alternative to "if (Object.isExtensible(wDst))" could be
				try {
					if (cloneRef) wDst[names[i]] = clone(wSrc[names[i]], cloneOptions);
					else wDst[names[i]] = wSrc[names[i]];
				}
				catch (e) {
					if (e instanceof TypeError) {
						onTypeException(new MergeTypeException(e, A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
					}
					else throw e;
				}
				and then MergeTypeException constructor has to be rewritten as following
				MergeTypeException = function (e, A, B, src, dst, propName, options) {
					this = clone(e);
					this.A = A;
					this.B = B;
					this.src = src;
					this.dst = dst;
					this.propName = propName;
					this.options = options;
				};
				
				This logic can be applied to all the "type exception" managed below.
				*/
			}
			else if (typeof(wSrc[names[i]])=="function") {
				// src[prop] is a "function"
				
				// if  ((typeof(wDst[names[i]])=="object" && wDst[names[i]]!=null) || typeof(wDst[names[i]])=="function") {
				if (types.isDictionary(wDst[names[i]])) {
					if (prioA) {
						if (d.writable) {
							// let's call src[prop] "A" and dst[prop] "B"
							/*
							B is an object, let's turn it into a function while still preserving its properties.
							Note, in case of A and B having the same property, the A's ones should be selected.
							*/
							
							// temporary saving B
							let tmp = wDst[names[i]];
							
							// B is a copy of A, deep cloned or not according to the options.
							/*
							Why not using "cloneFunction" ? Well, "clone" will call it anyway. But "clone"
							will interpret the "cloneOptions" for us instead of having to do it here.
							So, despite of the name "clone" which suggest a "clone / deep copy", when it's about function and
							depending on the "cloneOptions", only a pointer to the same function can be generated.
							*/
							wDst[names[i]] = clone(wSrc[names[i]], cloneOptions);
							
							// now let's copy back the B's properties
							/* /!\
							/!\ *************************************************************** /!\
							
							if B has some instance properties and "cloneOptions.cloneFunction" is false (and
							A[prop] does not exist yet), then "A[prop]" will receive B[prop] !
							So, which will modify A !
							And that is most probably not what the caller wants ("merge(A into B)" shouldn't modify A) !
							
							(if A[prop] already exists and since prioA, the value of A[prop] is preserved, we're good).
							
							
							Investigations:
							Testing on "cloneRef" won't be enough. It is a starting point but the subject here is a "function" !
							For which the "clone" method behaves slightly differently by offering an option called: "cloneFunction".
							So:
							- inspect "cloneOptions" to detect whether a simple pointer on the function should be generated or 
							  a "cloned" version should be used.
							- raise an exception !
							
							/!\ *************************************************************** /!\
							*/
							merge(tmp, wDst[names[i]], {
								clone: false,
								prioA: false
							});
						}
						else onTypeException(new MergeTypeException("destination property \""+names[i]+"\" is not \"writable\"", A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
					}
					else {
						/*
						Here, A is a function, B is an object or a function but whatever, we don't want it to become
						the A function (!prioA) But, should we copy/clone the A's property into B ?
						Well
						if B is an object, perhaps,
						if B is a function, certainly not the "function" properties such as "length" and "name", but what about the other
						properties ? Those that may have been added on the A instance ?
						=> Well since !prioA, and there is already something in B, the answer is NO, B shouldn't be adjusted = nothing to copy from A to B.
						1) if B is an object, copying "function" properties onto it does not make sense (an object with function properties ???)
						2) if B is a function, it has its own function properties and shouldn't have the A ones
						
						Maybe we could raise an exception just to warn that here, desipte of being a function, A is "as an object" since it has additional instance properties.
						So its properties won't be merged ! => B won't receive A.
						*/
					}
				}
				else {
					if (prioA) {
						if (d.writable) {
							wDst[names[i]] = clone(wSrc[names[i]], cloneOptions);
						}
						else onTypeException(new MergeTypeException("destination property \""+names[i]+"\" is not \"writable\"", A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
					}
				}
			}
			else if (typeof(wSrc[names[i]])=="object" && wSrc[names[i]]!=null) {
				// if  ((typeof(wDst[names[i]])=="object" && wDst[names[i]]!=null) || typeof(wDst[names[i]])=="function") {
				if  (isDictionary(wDst[names[i]])) {
					srcStack.push(wSrc[names[i]]);
					dstStack.push(wDst[names[i]]);
				}
				else {
					if (prioA) {
						if (d.writable) {
							if (cloneRef) wDst[names[i]] = clone(wSrc[names[i]], cloneOptions);
							else wDst[names[i]] = wSrc[names[i]];
						}
						else onTypeException(new MergeTypeException("destination property \""+names[i]+"\" is not \"writable\"", A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
					}
				}
			}
			else {
				if (prioA) {
					if (d.writable) {
						wDst[names[i]] = wSrc[names[i]];
					}
					else onTypeException(new MergeTypeException("destination property \""+names[i]+"\" is not \"writable\"", A, B, wSrc, wDst, names[i], pOptions), typeExceptions);
				}
			}
		}
	}
	
	/*maybe better to return the errors array ? The one populated by the second arguments of onError...*/
	return {
		typeExceptions: typeExceptions,
		B: B
	};
};


const MergeTypeException = function (msg, A, B, src, dst, propName, options) {
	TypeError.call(this, "Merging type exception: "+msg+".");
	this.A = A;
	this.B = B;
	this.src = src;
	this.dst = dst;
	this.propName = propName;
	this.options = options;
};
(function(){
const InheritedTypeError = function(){};
InheritedTypeError.prototype = TypeError.prototype;
MergeTypeException.prototype = new InheritedTypeError();
})();


const searchObjectsWithProperty = function (searched, propName, propValue, pOptions) {
	let res = [];//new Array();
	switch (arguments.length) {
		case 2:
			for (let s in searched) if (propName in searched[s]) res.push (searched[s]);
			break;
			
		case 3:
			for (let s in searched) if (propName in searched[s] && searched[s][propName]==propValue) res.push (searched[s]);
			break;
			
		case 4:
		default: {
			let strictEqual = false;
			// if (isDictionary(arguments[3])) strictEqual = arguments[3].strictEqual ?? strictEqual;
			// without coalescence operator (/!\ it also changes a little bit the method signature since it now uses "valueOf"):
			if (types.isDictionary(arguments[3]) && types.isDNN(arguments[3].strictEqual)) strictEqual = arguments[3].strictEqual.valueOf();
			for (let s in searched) if (propName in searched[s]) {
				if (strictEqual && searched[s][propName]===propValue) res.push (searched[s]);
				else if (searched[s][propName]==propValue) res.push (searched[s]);
			}
		} break;
	}
	return res;
};

const searchObjectsWithOwnProperty = function (searched, propName, propValue, pOptions) {
	let res = [];
	switch (arguments.length) {
		case 2:
			for (let s in searched) if (Object.getOwnPropertyNames(searched[s]).includes(propName)) res.push(searched[s]);
			break;
			
		case 3:
			for (let s in searched) if (Object.getOwnPropertyNames(searched[s]).includes(propName) && searched[s][propName]==propValue) res.push (searched[s]);
			break;
			
		case 4:
		default: {
			let strictEqual = false;
			// // if (typeof(arguments[3])=="object" && arguments[3]!=null) strictEqual = arguments[3].strictEqual ?? strictEqual;
			// if (isDictionary(arguments[3])) strictEqual = arguments[3].strictEqual ?? strictEqual;
			// without coalescence operator (/!\ it also changes a little bit the method signature since it now uses "valueOf"):
			if (types.isDictionary(arguments[3]) && types.isDNN(arguments[3].strictEqual)) strictEqual = arguments[3].strictEqual.valueOf();
			for (let s in searched) if (Object.getOwnPropertyNames(searched[s]).includes(propName)) {
				if (strictEqual && searched[s][propName]===propValue) res.push (searched[s]);
				else if (searched[s][propName]==propValue) res.push (searched[s]);
			}
		} break;
	}
};

export {cloneFunction, clone, doNotCloneObjects, merge, MergeTypeException, searchObjectsWithProperty, searchObjectsWithOwnProperty}

