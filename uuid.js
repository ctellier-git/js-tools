
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

//const _fileName_ = "uuid.js";
//const _moduleDir_ = import.meta.url.substring(0,import.meta.url.lastIndexOf("/"));

function generateV4 () {
	/*
	from https://gist.github.com/jcxplorer/823878
	*/
	if (window.location.protocol!="https:") {
		let uuid = "", i, random;
		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i == 8 || i == 12 || i == 16 || i == 20) uuid += "-";
			uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
		}
		return uuid;
	}
	else return window.crypto.randomUUID();
};

function getSetInstId (obj) {
	let res = null;
	if (typeof(obj._instId_)=="undefined") {
		if (Object.isExtensible(obj)) {
			res = generateV4();
			Object.defineProperty (obj, "_instId_", {
				configurable: false,
				enumerable: false,
				writable: false,
				value: res,
			});
		}
	}
	else res = obj._instId_;
	
	return res;
};

export {generateV4, getSetInstId}
