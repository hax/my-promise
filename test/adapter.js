'use strict'

var assert = require('assert')
var Promise = require('../src').Promise

module.exports = {
  deferred: function () {
    var _resolve, _reject
    return {
      promise: new Promise(function (resolve, reject) {
        _resolve = resolve
        _reject = reject
      }),
      resolve: function (value) {
        _resolve(value)
      },
      reject: function (reason) {
        _reject(reason)
      }
    }
  },
  defineGlobalPromise: function (global) {
    global.Promise = Promise
    global.assert = assert
  },
  removeGlobalPromise: function (global) {
    delete global.Promise
  },
}
