
//const _fileName_ = "uuid.js";
//const _moduleDir_ = import.meta.url.substring(0,import.meta.url.lastIndexOf("/"));

/*
from https://gist.github.com/jcxplorer/823878
*/
function generateV4 () {
	let uuid = "", i, random;
	for (i = 0; i < 32; i++) {
		random = Math.random() * 16 | 0;
		if (i == 8 || i == 12 || i == 16 || i == 20) uuid += "-";
		uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
	}
	return uuid;
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
