

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

