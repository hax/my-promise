// See https://github.com/promises-aplus/promises-spec/issues/179

'use strict'

var Promise = require('./PromiseImpl')

var resolveA;
var a = new Promise(function() {
    resolveA = arguments[0];
});

a.then(function() {
    console.log("first");
});

var resolveB;
var b = new Promise(function() {
    resolveB = arguments[0];
});

b.then(function() {
    console.log("second");
});

resolveA(b);

b.then(function() {
    console.log("third");
});

resolveB();
