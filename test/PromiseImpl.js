'use strict'

var native = Promise
var my = require('../src').Promise
var bluebird = require('bluebird').Promise
var when = require('when').Promise
var rsvp = require('rsvp').Promise
var q = require('q').Promise
var npo = require('native-promise-only')

var PromiseImplementations = {
  native: native,
  v8: native,
  'my-promise': my,
  my: my,
  bluebird: bluebird,
  bb: bluebird,
  when: when,
  w: when,
  rsvp: rsvp,
  q: q,
  npo: npo,
}

var impl
var P = process.env.P
if (P) {
  impl = PromiseImplementations[P.toLowerCase()]
  if (impl === undefined) {
    console.log(
      'Unknown Promise implementaion:', P,
      ', use default implementation:', 'my-promise')
    impl = my
  }
} else {
  impl = my
}

module.exports = impl
