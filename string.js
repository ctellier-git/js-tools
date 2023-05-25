
import * as types from "./types.js";

/*
const maxLength = function () {
	
	let max = 0;
	let wStrings = [];
	for (let i=0 ; i<arguments.length ; ++i) {
		if (isArray(arguments[i])) wStrings = wStrings.concat(arguments[i]);
		else wStrings.push(arguments[i]);
	}
	for (let i=0 ; i<wStrings.length ; ++i) if (wStrings[i].length>max) max = wStrings[i].length;
	
	return max;
};
*/

/*
Returns a string with added trailing spaces.
*/
const addTrailSpaces = function (pString, pSize, pSpaceChar) {
	let wSpaceChar = " ";
	// types.isSNL0 is commented to let the error bubbling up:
	if (arguments.length>2 /*&& types.isSNL0(pSpaceChar)*/) wSpaceChar = pSpaceChar.valueOf()[0];
	let res = "";
	let nbSpace = pSize - pString.length;
	for (let i=0 ; i<nbSpace ; ++i) res += wSpaceChar;
	return res;
};

/*
Returns a substring where the removed char are:
- the trailing char when mode<0 (ie: -1)
- the leading char when mode>0 (ie: 1)
- a combination of leading and trailing char to "center" the string when mode=0
*/
const shrink = function (str, mode, size) {
	if (size<0) return "";
	else if (size<str.length) {
		if (mode<0) return str.substring(0, size);
		else if (mode>0) return str.substring(str.length-size, str.length);
		else {
			let startIdx = Math.floor((str.length-size)/2);
			return str.substring(startIdx, startIdx+size);
		}
	}
};

const columnify = function (pStrings, pOptions) {
	let wOptions = {
		columnSize: -1,	// -1 => "auto", can be an array for each column, if the array length is < pStrings.length, still works /!\ the algo does not check that each array[i] is a number.
		maxColumnSize: Number.POSITIVE_INFINITY,	// can be an array for each column, if the array length is < pStrings.length, still works /!\ the algo does not check that each array[i] is a number.
		spacer: " ",
		addSpace: true,
		separator: "|",
		shrink: -1
	};
	if (pOptions) {
		let tmpColumnSize = wOptions.columnSize;
		if (pOptions.columnSize!=undefined) tmpColumnSize = pOptions.columnSize.valueOf();
		if (typeof(tmpColumnSize)=="number" || types.isArray(tmpColumnSize)) wOptions.columnSize = tmpColumnSize;
		
		let tmpSpacer = wOptions.spacer;
		if (pOptions.spacer!=undefined) tmpSpacer = pOptions.spacer.valueOf();
		if (isSNL0(tmpSpacer)) wOptions.spacer = tmpSpacer.valueOf[0];
		
		let tmpAddSpace = wOptions.addSpace;
		if (pOptions.addSpace!=undefined) tmpAddSpace = pOptions.addSpace.valueOf();
		if (typeof(tmpAddSpace)=="boolean") wOptions.addSpace = tmpAddSpace;
		
		let tmpSeparator = wOptions.separator;
		if (pOptions.separator!=undefined) tmpSeparator = pOptions.separator.valueOf();
		if (typeof(tmpSeparator)=="string") wOptions.separator = tmpSeparator;
		
		let tmpMaxColumnSize = wOptions.maxColumnSize;
		if (pOptions.maxColumnSize!=undefined) tmpMaxColumnSize = pOptions.maxColumnSize.valueOf();
		if (typeof(tmpMaxColumnSize)=="number" || types.isArray(tmpMaxColumnSize)) wOptions.maxColumnSize = tmpMaxColumnSize;
		
		let tmpOverride = wOptions.shrink;
		if (pOptions.shrink!=undefined) tmpOverride = pOptions.shrink.valueOf();
		if (typeof(tmpOverride)=="number" || types.isArray(tmpOverride)) wOptions.shrink = tmpOverride;
	}
	
	let wColumnSizes = new Array(pStrings.length);
	let wMaxColumnSizes = new Array(pStrings.length);
	let wShrinks = new Array(pStrings.length);

	for (let i=0 ; i<pStrings.length ; ++i) {
		
		if (types.isArray(wOptions.columnSize)) wColumnSizes[i] = wOptions.columnSize[i<wOptions.columnSize.length?i:wOptions.columnSize.length-1].valueOf();
		else wColumnSizes[i] = wOptions.columnSize;
		
		if (types.isArray(wOptions.maxColumnSize)) wMaxColumnSizes[i] = wOptions.maxColumnSize[i<wOptions.maxColumnSize.length?i:wOptions.maxColumnSize.length-1].valueOf();
		else wMaxColumnSizes[i] = wOptions.maxColumnSize;
		
		if (types.isArray(wOptions.shrink)) wShrinks[i] = wOptions.shrink[i<wOptions.shrink.length?i:wOptions.shrink.length-1].valueOf();
		else wShrinks[i] = wOptions.shrink;
	}
	
	let res = "";
	
	for (let i=0 ; i<pStrings.length ; ++i) {
			
		let columnSize = Math.min(
			wColumnSizes[i]==-1
				? (wOptions.addSpace?pStrings[i].length+(i==0?1:2):pStrings[i].length)
				: wColumnSizes[i],
			wMaxColumnSizes[i])
			
		if (pStrings[i].length>columnSize) res += shrink(pStrings[i], wShrinks[i], columnSize);
		else {
			let tmpStr = "";
			if (i!=0 && wOptions.addSpace) {
				if (pStrings[i].length+1>columnSize) tmpStr = pStrings[i];
				else tmpStr = " "+pStrings[i];
			}
			else tmpStr = pStrings[i];
			if (i<pStrings.length-1 || wColumnSizes[i]!=-1) tmpStr += addTrailSpaces(tmpStr, columnSize, wOptions.spacer);
			res += tmpStr;
		}
		
		if (i<pStrings.length-1) res += wOptions.separator;
	}
	
	return res;
};

export {addTrailSpaces, shrink, columnify}
