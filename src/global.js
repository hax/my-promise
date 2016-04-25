'use strict'

module.exports = function () {

	if (typeof System === 'object' && System && typeof System.global === 'object' && System.global) return System.global
	if (typeof global === 'object' && global && global.global === global) return global
	if (typeof window === 'object' && window && window.window === window) return window
	return new Function('return this')()

}()
