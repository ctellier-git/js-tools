
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

//const _fileName_ = "misc.js";
//const _moduleDir_ = import.meta.url.substring(0,import.meta.url.lastIndexOf("/"));

const getSessionDuration = function () {
	return window.performance.now();
};

const getStackTraceString = function () {
	let res = new Error().stack;
	if (typeof(res)=="string") {
		res = res.substring(res.indexOf("\n")+1);
		return res;
	}
	else return "";
};

// class FIFO extends Array {
	
	// #size = Number.POSITIVE_INFINITY;
	
	// constructor (...args) {
		// super (...args);
	// }
	
	// get size () {
		// return this.#size;
	// }
	
	// resize (size) {
		// if (size<this.length) this.splice (this.length-size-1, this.length-size);
		// this.#size = size;
		// return this.#size;
	// }
	
	// see () {
		// return this[0];
	// }
	
	// pick () {
		// return this.shift();
	// }
	
	// push () {
		// // can be optimized with the aid of this.splice !
		// for (let i=0 ; i<arguments.length ; ++i) {
			// if (this.length>=this.#size) this.shift();
			// super.push(arguments[i]);
		// }
		// return this.length;
	// }
// }

export {getSessionDuration, getStackTraceString}

