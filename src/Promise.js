'use strict'


var spec = require('./spec')
var global = require('./global')
var TypeIsObject = spec.TypeIsObject,
	WellKnownSymbol = spec.defineSymbol(global.Symbol).WellKnownSymbol,
	IsCallable = spec.IsCallable,
	IsConstructor = spec.IsConstructor,
	Call = spec.Call,
	SpeciesConstructor = spec.SpeciesConstructor,
	SpeciesConstructor0 = spec.SpeciesConstructor0


var noop = require('./noop').default

var JobQueue = require('./JobQueue').default
var asap = require('./asap').default

var promiseJobs = new JobQueue({
	async: asap,
	quantum: typeof navigator === 'object' ? 40 : 0,
})


exports.default = Promise


// [25.4.6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-properties-of-promise-instances)
var	State	= '_PromiseState',
	PENDING	= 0,
	FULFILLED	= 1,
	REJECTED	= 2,
	Constructor	= '_PromiseConstructor',
	Result	= '_PromiseResult',
	FulfillReactions	= '_PromiseFulfillReactions',
	RejectReactions	= '_PromiseRejectReactions',
	Resolved	= '_PromiseResolved'


// [25.4.1.4](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-createresolvingfunctions)
function CreateResolvingFunctions(promise) {

	var _resolve, _reject

	// 25.4.1.4.2 Promise Resolve Functions
	_resolve = function (r) {
		_resolve = _reject = noop
		ResolvePromise(promise, r)
	}

	// 25.4.1.4.1 Promise Reject Functions
	_reject = function (r) {
		_resolve = _reject = noop
		RejectPromise(promise, r)
	}

	return [
		function resolve(resolution) { _resolve(resolution) },
		function reject(reason) { _reject(reason) },
	]

}


// [25.4.1.4.2](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-resolve-functions) Promise Resolve Functions
function ResolvePromise(promise, resolution) {

	if (promise === resolution) {
		RejectPromise(promise, new TypeError('self resolution'))
		return
	}

	if (!TypeIsObject(resolution)) {
		FulfillPromise(promise, resolution)
		return
	}

	// Optimize memory usage for chained promises
	// if (IsPromise(resolution)) {
	// 	ChainPromise(promise, resolution)
	// 	return
	// }

	var then
	try {
		then = resolution.then
	} catch (e) {
		RejectPromise(promise, e)
		return
	}
	if (!IsCallable(then)) {
		FulfillPromise(promise, resolution)
		return
	}
	promiseJobs.enqueue(
		// [25.4.2.2](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promiseresolvethenablejob)
		function PromiseResolveThenableJob() {
			var resolvingFunctions = CreateResolvingFunctions(promise)
			try {
				Call(then, resolution, resolvingFunctions)
			} catch (e) {
				resolvingFunctions[1](e)
			}
		}
	)

}


function ChainPromise(promise, resolution) {
	switch (resolution[State]) {
		case FULFILLED:
			// if (resolution[FulfillReactions] === undefined) {
				FulfillPromise(promise, resolution[Result])
			// } else {
			// 	promise[Resolved] = resolution
			// 	Append(resolution[FulfillReactions], promise[FulfillReactions])
			// }
			break
		case REJECTED:
			// if (resolution[RejectReactions] === undefined) {
				RejectPromise(promise, resolution[Result])
			// } else {
			// 	promise[Resolved] = resolution
			// 	Append(resolution[RejectReactions], promise[RejectReactions])
			// }
			break
		default:
			promise[Resolved] = resolution
			Append(resolution[FulfillReactions], promise[FulfillReactions])
			Append(resolution[RejectReactions], promise[RejectReactions])
			break
	}
}


// [25.4.1.5](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-fulfillpromise)
function FulfillPromise(promise, value) {
	// Assert(promise[State] === PENDING)
	var reactions = promise[FulfillReactions]
	promise[Result] = value
	promise[FulfillReactions] = undefined
	promise[RejectReactions] = undefined
	promise[State] = FULFILLED
	TriggerPromiseReactions(reactions, value)
}


// [25.4.1.6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-newpromisecapability)
function NewPromiseCapability(C) {
	if (!IsConstructor(C)) throw new TypeError
	// 25.4.1.6.1 CreatePromiseCapabilityRecord( promise, constructor )
	var promiseCapability = {}
	promiseCapability.promise = new C(function (resolve, reject) {
		promiseCapability.resolve = resolve
		promiseCapability.reject = reject
	})
	promiseCapability.promise[Constructor] = C
	if (!IsCallable(promiseCapability.resolve)
		|| !IsCallable(promiseCapability.reject)
	) throw new TypeError
	if (!(promiseCapability.promise instanceof C)) throw new TypeError
	return promiseCapability
}


// [25.4.1.7](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-ispromise)
function IsPromise(x) {
	return TypeIsObject(x) && x[State] !== undefined
}


// [25.4.1.8](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-rejectpromise)
function RejectPromise(promise, reason) {
	// Assert(promise[State] === PENDING)
	var reactions = promise[RejectReactions]
	promise[Result] = reason
	promise[FulfillReactions] = undefined
	promise[RejectReactions] = undefined
	promise[State] = REJECTED
	TriggerPromiseReactions(reactions, reason)
}


// [25.4.1.9](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-triggerpromisereactions)
function TriggerPromiseReactions(reactions, argument) {
	// 25.4.2.1 PromiseReactionJob ( reaction, argument )
	promiseJobs.enqueue(
		function PromiseReactionsJob() {
			var reaction = reactions.next
			while (reaction !== undefined) {
				var next = reaction.next
				reaction.next = undefined
				if (reaction.tail) reaction.tail = undefined // for ChainPromise
				else reaction(argument)
				reaction = next
			}
		}
	)
}


// [25.4.3](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-constructor) The Promise Constructor
function Promise(executor) {

	// 25.4.3.2 new Promise ( ... argumentsList )
	if (!(this instanceof Promise)) throw new TypeError

	// 25.4.1.3 AllocatePromise ( constructor )
	// this[State] = undefined
	this[Constructor] = Promise

	// 25.4.3.1 Promise ( executor )
	// if (!TypeIsObject(this)) throw new TypeError
	// if (!(State in this)) throw new TypeError
	if (this[State] !== undefined) throw new TypeError
	if (!IsCallable(executor)) throw new TypeError

	// 25.4.3.1.1 InitializePromise ( promise, executor )
	// Assert(promise[State] === undefined)
	// Assert(IsCallable(executor))
	this[State] = PENDING
	this[FulfillReactions] = {}
	this[RejectReactions] = {}
	var resolvingFunctions = CreateResolvingFunctions(this)
	try {
		executor(resolvingFunctions[0], resolvingFunctions[1])
	} catch (e) {
		resolvingFunctions[1](e)
	}

}


// [25.4.4.1](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.all)
Promise.all = function all(iterable) {

	var C = SpeciesConstructor0(this)
	var promiseCapability = NewPromiseCapability(C)

	// 25.4.4.1.1 PerformPromiseAll( iterator, constructor, resultCapability) Abstract Operation
	var values = [], remainingElementsCount = 1, index = 0

	try {
		Iterate(iterable, function (nextValue) {
			remainingElementsCount++
			C.resolve(nextValue).then(ResolveElement(index), promiseCapability.reject)
			index++
		})
	} catch (e) {
		var reject = promiseCapability.reject
		reject(e)
	}


	remainingElementsCount--
	if (remainingElementsCount === 0) promiseCapability.resolve(values)

	return promiseCapability.promise

	// 25.4.4.1.2 Promise.all Resolve Element Functions
	function ResolveElement(index) {
		var _resolve = function (value) {
			_resolve = noop
			values[index] = value
			remainingElementsCount--
			if (remainingElementsCount === 0) promiseCapability.resolve(values)
		}
		return function resolve(value) {
			_resolve(value)
		}
	}

}


// 25.4.4.2 Promise.prototype
Object.defineProperty(Promise, 'prototype', {})


// [25.4.4.3](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.race)
Promise.race = function race(iterable) {

	var C = SpeciesConstructor0(this)
	var promiseCapability = NewPromiseCapability(C)

	try {
		Iterate(iterable, function (x) {
			C.resolve(x).then(promiseCapability.resolve, promiseCapability.reject)
		})
	} catch (e) {
		promiseCapability.reject(e)
	}

	return promiseCapability.promise

}


// [25.4.4.4](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.reject)
Promise.reject = function reject(r) {

	var C = SpeciesConstructor0(this)
	var promiseCapability = NewPromiseCapability(C)

	var reject = promiseCapability.reject
	reject(r)

	return promiseCapability.promise

}


// [25.4.4.5](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.resolve)
Promise.resolve = function (x) {

	if (IsPromise(x) && x[Constructor] === this) return x

	var C = SpeciesConstructor0(this)
	var promiseCapability = NewPromiseCapability(C)

	var resolve = promiseCapability.resolve
	resolve(x)

	return promiseCapability.promise

}


// [25.4.4.6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-get-promise-@@species)
Object.defineProperty(Promise, WellKnownSymbol('species'), {
	get: function () { return this }
})


// [25.4.5.1](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype.catch)
Promise.prototype.catch = function caught(onRejected) {
	return this.then(undefined, onRejected)
}


// [25.4.5.3](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype.then)
Promise.prototype.then = function then(onFulfilled, onRejected) {

	if (!IsPromise(this)) throw new TypeError
	var C = SpeciesConstructor(this, Promise)
	var resultCapability = NewPromiseCapability(C)
	var resolve = resultCapability.resolve, reject = resultCapability.reject

	// 25.4.5.3.1 PerformPromiseThen ( promise, onFulfilled, onRejected, resultCapability )
	var promise = this
	if (!IsCallable(onFulfilled)) {
		onFulfilled = function Identity() {
			resolve(promise[Result])
		}
	}
	if (!IsCallable(onRejected)) {
		onRejected = function Thrower() {
			reject(promise[Result])
		}
	}

	switch (promise[State]) {
		case FULFILLED:
			promiseJobs.enqueue(function PromiseFulfillReactionJob() {
				settle(resolve, reject, onFulfilled, promise[Result])
			})
			break
		case REJECTED:
			promiseJobs.enqueue(function PromiseRejectReactionJob() {
				settle(resolve, reject, onRejected, promise[Result])
			})
			break
		default:
			Append(promise[FulfillReactions],
				function (r) {
					settle(resolve, reject, onFulfilled, r)
				})
			Append(promise[RejectReactions],
				function (r) { settle(resolve, reject, onRejected, r) })
			break
	}

	return resultCapability.promise

}


function Append(reactions, node) {
	if (!reactions.next) reactions.next = node
	if (reactions.tail) {
		if (reactions.tail.next) node.next = reactions.tail.next
		reactions.tail.next = node
	}
	reactions.tail = node
	// var count = 0, node = reactions.next
	// while (node = node.next) count++
	// if (count > 0 && count % 100 === 0) console.log(count)
	// var node = reactions.next, count = 0
	// while (node = node.next) console.log(count++, node)
}


function settle(resolve, reject, f, r) {
	try {
		r = f(r)
	} catch (e) {
		reject(e)
		return
	}
	resolve(r)
}


// [25.4.5.4](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype-@@tostringtag)
Object.defineProperty(Promise.prototype, WellKnownSymbol('toStringTag'), {
	value: 'Promise', configurable: true
})


var ArrayIterator = Array.prototype[WellKnownSymbol('iterator')]

function Iterate(iterable, f) {

	var method = iterable[WellKnownSymbol('iterator')]

	// optimize for Array
	if (method === ArrayIterator && Array.isArray(iterable)) {
		for (var i = 0; i < iterable.length; i++) f(iterable[i])
		return
	}

	if (method == null) throw new TypeError

	var iterator = iterable[WellKnownSymbol('iterator')]()
	if (!TypeIsObject(iterator)) throw new TypeError

	try {
		var result
		while (!(result = iterator.next()).done) {
			f(result.value)
		}
	} finally {
		if (iterator.return !== undefined) {
			var r = iterator.return()
			if (r == null || typeof r !== 'object') throw new TypeError
		}
	}

}
