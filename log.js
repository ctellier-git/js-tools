
import * as string from "./string.js";
import * as types from "./types.js";
import * as uuid from "./uuid.js";
import * as misc from "./misc.js";

//const _fileName_ = "types.js";
//const _moduleDir_ = import.meta.url.substring(0,import.meta.url.lastIndexOf("/"));

const Level = {
	CRITICAL: 1,
	SEVERE: 2,
	WARN: 3,
	INFO: 4,
	DETAIL: 5,
	DEBUG: 6,
	isLevel: function (p) {
		return 	p===Level.CRITICAL ||
				p===Level.SEVERE ||
				p===Level.WARN ||
				p===Level.INFO ||
				p===Level.DETAIL ||
				p===Level.DEBUG;
	}
};

class ConsoleHandler {
	
	#nbPublish = 0;
	#publishDate = false;
	#publishSessionDuration = true;
	#columnifyConfig = {
		// columnSize: [8, 7, 10, 15, 20, 8, 38, 30, 30, 50],
		columnSize: -1,
		spacer: " ",
		separator: "|",
		shrink: -1
	};
	
	constructor () {}

	#format (logRecord) {
		let levelStr;
		switch (logRecord.level) {
			case Level.DEBUG:	levelStr = "DEBUG";		break;
			case Level.DETAIL:	levelStr = "DETAIL";	break;
			case Level.INFO:	levelStr = "INFO";		break;
			case Level.WARN:	levelStr = "WARN";		break;
			case Level.SEVERE:	levelStr = "SEVERE";	break;
			case Level.CRITICAL:	levelStr = "CRITICAL";	break;
			default: levelStr = "*?*";	break;
		}

		let strs = [
			this.#nbPublish.toString(),
			logRecord?.logger?.getName?.()
		];
			
		if (this.#publishDate) strs.push (logRecord.date.toString());
		if (this.#publishSessionDuration) strs.push (logRecord.sessionDuration.toString());
		
		/*
		strs.push (
			//levelStr,
			logRecord?.fileName ?? "file",
			//(logRecord.lineNumber!=-1?logRecord.lineNumber.toString():""),
			logRecord?.instanceId ?? "instId",
			logRecord.className ?? "class",
			logRecord.functionName ?? "function",
		);
		*/
		let instanceIdDNN = types.isDNN(logRecord.instanceId);
		let classNameDNN = types.isDNN(logRecord.className);
		let functionNameDNN = types.isDNN(logRecord.functionName);
		
		if (types.isDNN(logRecord.fileName)) strs.push(logRecord.fileName);
		else if (instanceIdDNN || classNameDNN || functionNameDNN) strs.push("");	// strs.push ("file");
		
		if (instanceIdDNN) strs.push(logRecord.instanceId);
		else if (classNameDNN || functionNameDNN) strs.push("");	// strs.push ("instId");
		
		if (classNameDNN) strs.push(logRecord.className);
		else if (functionNameDNN) strs.push("");	// strs.push ("class");
		
		if (functionNameDNN) strs.push(logRecord.functionName);
		// if (logRecord.level==Level.DETAIL) strs.push(logRecord.stackTraceString);

		let res = "["+levelStr+"] #"+string.columnify(strs, this.columnifyConfig);
		if (types.isDNN(logRecord.message)) res += "\n"+logRecord.message;
		
		return res;
	}

	getColumnHeadsString () {
		let str = [
			"nb publications",
			"logger name"
		];
		if (this.#publishDate) str.push ("date ms");
		if (this.#publishSessionDuration) str.push ("session duration ms");
		str.push (
			//"level",
			"file name",
			//"line number",
			"instance id",
			"class name",
			"function name"
		);
		return "[LEVEL] #"+string.columnify (str, this.columnifyConfig)+"\nmessage [data...]";
	}

	publishColumnHeadsString () {
		let s;
		if (types.isString(arguments[0])) s = arguments[0].valueOf();
		else s = "";
		s += this.getColumnHeadsString();
		console.log(s);
	}


	publish (logRecord) {
		let params = [this.#format(logRecord)];
		/*
		if (types.isDNN(logRecord.data)) {
			params.push("\n");
			params.push(...logRecord.data);
		}
		*/
		for (let d in logRecord.data) {
			params.push("\n");
			params.push(logRecord.data[d]);

			if (logRecord.data[d] instanceof Error) {
				params.push("\n");
				params.push({e:logRecord.data[d]});
			}
		}
		
		switch (logRecord.level) {
			case Level.DEBUG:
				// console.group.apply(console, params);
				// console.log(logRecord.stackTraceString);
				// console.groupEnd();
				console.log.apply(console, params);
				break;
				
			case Level.DETAIL:
			case Level.INFO:
				console.log.apply(console, params);
				break;
			
			case Level.WARN:
				console.warn.apply(console, params);
				break;
				
			case Level.SEVERE:
			case Level.CRITICAL:
			default:
				console.error.apply(console, params);
				break;
		}
		
		if (logRecord.stackTraceString!=null) {
			console.group("-- stack trace --");
			console.log(logRecord.stackTraceString);
			console.groupEnd();
		}
		
		return ++this.#nbPublish;
		
	}

	group (logRecord) {
		if (types.isDNN(logRecord.data)) console.group (this.#format(logRecord), ...logRecord.data);
		else console.group(this.#format(logRecord));
		
		if (logRecord.stackTraceString!=null) {
			console.group("-- stack trace --");
			console.log(logRecord.stackTraceString);
			console.groupEnd();
		}
		
		return ++this.#nbPublish;
	}

	groupEnd () {
		console.groupEnd();
	}
}



class Logger {

	#activated = true;

	constructor () {
			
		if (types.isDictionary(arguments[0])) {
			if (typeof(arguments[0].handler)!="undefined") {
				if (types.isArray(arguments[0].handler)) this.handlers = [...arguments[0].handler];
				else this.handlers = [arguments[0].handler];
			}
			else this.handlers = [];
			
			if (types.isString(arguments[0].name)) this.name = arguments[0].name.valueOf();
			else this.name = "";
			
			if (types.isBoolean(arguments[0].activated)) this.#activated = arguments[0].activated.valueOf();
			else this.#activated = true;
		}
		else {
			this.name = "";
			this.handlers = [];
		}
		
		if (this.handlers.length==0) this.#activated = false;
		
		this.nbDebugCalls = 0;	// debug with stack trace
		this.nbDetailCalls = 0;	// debug without stack trace
		this.nbInfoCalls = 0;	// normal log
		this.nbWarnCalls = 0;	// warning
		this.nbSevereCalls = 0;	// handled error
		this.nbCriticalCalls = 0;	// unhandlable error, crash/critic
		this.nbUnknownCalls = 0;
			
		uuid.getSetInstId(this);
		
		this.forceStackTraceString = false;
	};

	get activated () {
		return this.#activated;
	}
	set activated (v) {
		this.#activated = v;
		return v;
	}

	setName () {
		this.name = arguments[0].valueOf();
	};

	getName () {
		return this.name;
	};

	getTotalCalls () {
		return this.nbDebugCalls+this.nbDetailCalls+this.nbInfoCalls+this.nbWarnCalls+this.nbSevereCalls+this.nbCriticalCalls+this.nbUnknownCalls;
	};

	#initLogRecord = function () {	
		let wLogRecord = {
			date: new Date(Date.now()).toUTCString(),
			sessionDuration: misc.getSessionDuration(),
			logger: this,
			level: Level.INFO,
			/*
			instanceId: "",
			className: "",
			functionName: "",
			fileName: "",
			//lineNumber: -1,
			message: "",
			*/
			data: null,
			stackTraceString: null,
			stackTrace: false
		};
		let dataIdx = 1;
		if (types.isString(arguments[0])) wLogRecord.message = arguments[0].valueOf();
		else {
			if (types.isDictionary(arguments[0])) {
				if (Level.isLevel(arguments[0].level)) wLogRecord.level = arguments[0].level;
				if (types.isDNN(arguments[0].instance)) {
					// wLogRecord.instance = arguments[0].instance;
					wLogRecord.instanceId = uuid.getSetInstId (arguments[0].instance);
				}
				if (types.isBoolean(arguments[0].stackTrace)) wLogRecord.stackTrace = arguments[0].stackTrace.valueOf();
				if (types.isString(arguments[0].className)) wLogRecord.className = arguments[0].className.valueOf();
				if (types.isString(arguments[0].functionName)) wLogRecord.functionName = arguments[0].functionName.valueOf();
				if (types.isString(arguments[0].fileName)) wLogRecord.fileName = arguments[0].fileName.valueOf();
				//if (types.isNumber(arguments[0].lineNumber)) wLogRecord.lineNumber = arguments[0].lineNumber.valueOf();
				if (types.isString(arguments[0].message)) wLogRecord.message = arguments[0].message.valueOf();
				if (types.isDNN(arguments[0].data)) {
					if (types.isArray(arguments[0].data)) wLogRecord.data = [...arguments[0].data];
					else wLogRecord.data = [arguments[0].data];
				}
				// if (types.isString(arguments[0].stackTraceString)) wLogRecord.stackTraceString = arguments[0].stackTraceString.valueOf();
			}
			if (arguments.length>1) {
				if (types.isString(arguments[1])) {
					if (!types.isDNN(wLogRecord.message)) wLogRecord.message = "";
					wLogRecord.message += arguments[1].valueOf();
					dataIdx = 2;
				}
			}
		}
		if (arguments.length>dataIdx) {
			wLogRecord.data = [];
			for (let i=dataIdx ; i<arguments.length ; ++i) wLogRecord.data.push(arguments[i]);
		}

		return wLogRecord;
	};

	group () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			
			switch (wLogRecord.level) {
				case Level.CRITICAL:++this.nbCriticalCalls;	break;
				case Level.SEVERE:	++this.nbSevereCalls;	break;
				case Level.WARN: 	++this.nbWarnCalls;		break;
				case Level.INFO: 	++this.nbInfoCalls;		break;
				case Level.DETAIL: 	++this.nbDetailCalls;	break;
				case Level.DEBUG:	++this.nbDebugCalls;	break;
				default: 			++this.nbUnknownCalls;	break;
			}
			
			if (this.forceStackTraceString || wLogRecord.level==Level.CRITICAL || wLogRecord.level==Level.DEBUG || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].group(wLogRecord);
			
			return wLogRecord;
		}
	}

	groupEnd () {
		if (this.activated) {
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].groupEnd();
		}
	}

	/*
	// log (level, instance, className, functionName, message, optionalData);
	// log ({all});
	// log (message);
	// log (message, optionalData);
	// log ({params}, message);
	// log ({params}, message, optionalData)

	// Maintenant que "stackTraceString" a été enlevé:
	// Pourquoi ne pas tester types.isDictionary(arguments[0])
	// et permettre ainsi de mettre autant de "optionalData" qu'on veut en elipse ? Attention au cas (level, instance, className, functionName, message)...
	// Peut être faut il le supprimer...

	first and second parameters type let decide between the 3 versions:
	a: log (message, data...); // where message must be a string or a String
	b: log ({params}, data...)
	c: log ({params}, message, data...)
	if first param is a string or a String, then "a" is selected.
	else {
		if second param is a string, then "c" is selected
		else "b" is selected
	}
	In case of having "b" or "c" containing data in params, then the additional data will be append.
	In case of having "c" with params containing a message, the message will be concatenated.
	*/
	log () {	
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			switch (wLogRecord.level) {
				case Level.CRITICAL:++this.nbCriticalCalls;	break;
				case Level.SEVERE:	++this.nbSevereCalls;	break;
				case Level.WARN: 	++this.nbWarnCalls;		break;
				case Level.INFO: 	++this.nbInfoCalls;		break;
				case Level.DETAIL: 	++this.nbDetailCalls;	break;
				case Level.DEBUG:	++this.nbDebugCalls;	break;
				default: 			++this.nbUnknownCalls;	break;
			}
			
			if (this.forceStackTraceString || wLogRecord.level==Level.CRITICAL || wLogRecord.level==Level.DEBUG || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}



	/*
	debug (instance, className, functionName, message, optionalData);
	debug ({all});
	debug (message);
	debug (message, optionalData);
	debug (message, optionalData);
	debug ({params}, message);
	debug ({params}, message, optionalData)
	*/
	debug () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.DEBUG;
			++this.nbDebugCalls;
			let str = misc.getStackTraceString();
			str = str.substring(str.indexOf("\n")+1);
			wLogRecord.stackTraceString = str;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}


	/*
	detail (instance, className, functionName, message, optionalData);
	detail ({all});
	detail (message);
	detail (message, optionalData);
	detail ({params}, message);
	detail ({params}, message, optionalData)
	*/
	detail () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.DETAIL;
			++this.nbDetailCalls;
			if (this.forceStackTraceString || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}


	/*
	info (instance, className, functionName, message, optionalData);
	info ({all});
	info (message);
	info (message, optionalData);
	info ({params}, message);
	info ({params}, message, optionalData)
	*/
	info () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.INFO;
			++this.nbInfoCalls;
			if (this.forceStackTraceString || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}


	/*
	warn (instance, className, functionName, message, optionalData);
	warn ({all});
	warn (message);
	warn (message, optionalData);
	warn ({params}, message);
	warn ({params}, message, optionalData)
	*/
	warn () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.WARN;
			++this.nbWarnCalls;
			if (this.forceStackTraceString || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}

	/*
	severe (instance, className, functionName, message, optionalData);
	severe ({all});
	severe (message);
	severe (message, optionalData);
	severe ({params}, message);
	severe ({params}, message, optionalData)
	*/
	severe () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.SEVERE;
			++this.nbWarnCalls;
			if (this.forceStackTraceString || wLogRecord.stackTrace) {
				let str = misc.getStackTraceString();
				str = str.substring(str.indexOf("\n")+1);
				wLogRecord.stackTraceString = str;
			}
			delete wLogRecord.stackTrace;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}

	/*
	critical (instance, className, functionName, message, optionalData);
	critical ({all});
	critical (message);
	critical (message, optionalData);
	critical ({params}, message);
	critical ({params}, message, optionalData)
	*/
	critical = function () {
		if (this.activated) {
			let wLogRecord = this.#initLogRecord.apply(this, arguments);
			wLogRecord.level = Level.CRITICAL;
			++this.nbCriticalCalls;
			let str = misc.getStackTraceString();
			str = str.substring(str.indexOf("\n")+1);
			wLogRecord.stackTraceString = str;
			for (let i=0 ; i<this.handlers.length ; ++i) this.handlers[i].publish(wLogRecord);
			return wLogRecord;
		}
	}

	getHandlers () {
		return [...this.handlers];
	}

	addHandler () {
		let wHandler = arguments[0];
		if (!this.handlers.includes(wHandler)) {
			this.handlers.push(wHandler);
			return wHandler;
		}
		else return null;
	}

	removeHandler () {
		let wHandler = arguments[0];
		let idx = this.handlers.indexOf(wHandler);
		if (idx!=-1) {
			this.handlers = this.handlers.slice(0,idx).concat(this.handlers.slice(idx+1,this.handlers.length));
			return wHandler;
		}
		else return null;
	}
}

const defaultConsoleHandler = new ConsoleHandler();
const defaultHandler = defaultConsoleHandler;

export {
	Level,
	Logger,
	ConsoleHandler,
	defaultConsoleHandler,
	defaultHandler
};
