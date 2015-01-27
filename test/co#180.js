// See https://github.com/tj/co/issues/180

'use strict'

var v8 = require('v8-natives')
var Promise = require('./PromiseImpl')

var i = 0
next()
function next() {
  return new Promise(function (resolve) {
    i++
    if (i % 0x100 === 0) {
      v8.collectGarbage();
      console.log(process.memoryUsage());
    }
    setTimeout(resolve)
  }).then(next)
}
