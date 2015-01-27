'use strict'

var adapter = require('./adapter')

var promisesES6Tests = require("promises-es6-tests")
promisesES6Tests(adapter, function (err) {
	logError(err)
	// tests complete; output to console; `err` is number of failures
})

var promisesAplusTests = require("promises-aplus-tests")
promisesAplusTests(adapter, function (err) {
	logError(err)
	// All done; output is in the console. Or check `err` for number of failures.
})

var count = 2, errors = []
function logError(err) {
	errors.push(err)
	if (--count === 0) {
		errors.forEach(function (err) {
			if (err) console.error(err.message)
		})
	}
}
