// See https://github.com/promises-aplus/promises-spec/issues/179

'use strict'

var Promise = require('./Promise').default


var count = 0
function log() {
	var index = count
	count++
	return function () {
		console.log(index)
	}
}

var r1, r2, r3
var p1 = new Promise(function (resolve) { r1 = resolve })
var p2 = new Promise(function (resolve) { r2 = resolve })
var p3 = new Promise(function (resolve) { r3 = resolve })

var f0, r0
var p0 = new Promise(function (onFulfilled, onRejected) {
	f0 = onFulfilled
	r0 = onRejected
})
var t0 = p0.then
p0.then = function () {
	console.log('then')
	t0.apply(this, arguments)
}

// var p0 = {
// 	then: function (onFulfilled, onRejected) {
// 		console.log('ok')
// 		onFulfilled()
// 	},
// }

p1.then(log())
p2.then(log())
p3.then(log())
p3.then(log())
p2.then(log())
p1.then(log())

r1(p0)
r2(p0)
r3(p0)

p1.then(log())
p2.then(log())
p3.then(log())
p3.then(log())
p2.then(log())
p1.then(log())

f0()

p1.then(log())
p2.then(log())
p3.then(log())
p3.then(log())
p2.then(log())
p1.then(log())

console.log('sync done')

setTimeout(function () {
	p1.then(log())
	p2.then(log())
	p3.then(log())
	p3.then(log())
	p2.then(log())
	p1.then(log())
})
