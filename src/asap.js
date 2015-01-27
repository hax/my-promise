'use strict'

exports.default = function tryHostAPIs(apis) {

	for (var i = 0; i < apis.length; i++) {
		var asap
		try {
			asap = apis[i]()
		} catch (e) {
			continue
		}
		if (asap !== undefined) return asap
	}
	throw new Error('No schedule API available')

}([

	function () {
		if (typeof process === 'object' && process !== null
			&& typeof process.nextTick === 'function'
		) return process.nextTick
	},

	function () {
		if (typeof Object.observe === 'function') {
			var q = []
			var o = {c: 0}
			Object.observe(o, function () {
				for (var i = 0; i < q.length; i++) {
					var f = q[i]
					q[i] = undefined
					f()
				}
				q = []
			})
			return function asap(f) {
				q[q.length] = f
				o.c++
			}
		}
	},

	function () {
		if (typeof setImmediate === 'function') return setImmediate
	},

	function () {
		if (typeof postMessage === 'function') {
			var q = []
			addEventListener('message', function (e) {
				if (e.data === 'ASAP') {
					for (var i = 0; i < q.length; i++) {
						var f = q[i]
						q[i] = undefined
						f()
					}
					q = []
				}
			})
			return function asap(f) {
				q[q.length] = f
				postMessage('ASAP', '*')
			}
		}
	},

	function () {
		if (typeof Image === 'function') {
			var q = []
			var img = new Image, running = false, c = 0
			img.onerror = function () {
				for (var i = 0; i < q.length; i++) {
					var f = q[i]
					q[i] = undefined
					f()
				}
				q = []
				running = false
			}
			return function asap(f) {
				q[q.length] = f
				if (running) return
				running = true
				img.src = 'data:,' + c
				c++
			}
		}
	},

	function () {
		if (typeof setTimeout === 'function') return setTimeout
	},

])
