'use strict'


// [6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-ecmascript-data-types-and-values)
function TypeIsObject(x) {
	if (x == null) return false
	var t = typeof x
	return t === 'object' || t === 'function'
}


// [6.1.5.1](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-well-known-symbols)
var WellKnownSymbol
function defineSymbol(Symbol) {
	WellKnownSymbol = Symbol != null ?
		function (name) { return Symbol[name] || Symbol.for(name) } :
		function (name) { return '@@' + name }
	return {WellKnownSymbol: WellKnownSymbol}
}


// [7.2.3](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-iscallable)
function IsCallable(argument) {
	return typeof argument === 'function'
}


// [7.2.4](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor)
function IsConstructor(argument) {
	return typeof argument === 'function'
}


var noop = require('./noop').default
// 7.3.11 Call(F, V, [args])
var Call = noop.call.bind(noop.apply)


// [7.3.21](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-speciesconstructor)
function SpeciesConstructor(O, defaultConstructor) {
	return SpeciesConstructor0(O.constructor, defaultConstructor)
}
function SpeciesConstructor0(C, defaultConstructor) {
	if (!TypeIsObject(C)) throw new TypeError
	if (defaultConstructor === undefined) defaultConstructor = C
	var S = C[WellKnownSymbol('species')]
	if (S == null) return defaultConstructor
	if (IsConstructor(S)) return S
	throw new TypeError
	return defaultConstructor
}


exports.TypeIsObject = TypeIsObject
exports.defineSymbol = defineSymbol
exports.IsCallable = IsCallable
exports.IsConstructor = IsConstructor
exports.Call = Call
exports.SpeciesConstructor = SpeciesConstructor
exports.SpeciesConstructor0 = SpeciesConstructor0
