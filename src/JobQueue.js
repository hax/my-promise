'use strict'

var ASYNC = '_async',
	QUANTUM = '_quantum',
	JOBS = '_jobs',
	RUNNING = '_running',
	RUN = '_run'

exports.default = JobQueue
function JobQueue(options) {
	if (typeof options.async !== 'function') {
		throw new TypeError('options.async should be a function')
	}
	if (typeof options.quantum !== 'number' || !(options.quantum >= 0 && options.quantum <= 10000)) {
		throw new TypeError('options.quantum should be a number in range [0, 10000]')
	}
	this[ASYNC] = options.async
	this[QUANTUM] = options.quantum
	this[JOBS] = []
	this[RUNNING] = false
	this[RUN] = drain(this)
}

Object.defineProperty(JobQueue.prototype, 'enqueue', {
	value: function enqueue(job) {
		if (!this[RUNNING]) {
			this[RUNNING] = true
			this[ASYNC](this[RUN])
		}
		var jobs = this[JOBS]
		jobs[jobs.length] = job
	}
})

function drain(queue) {
	return function run() {
		var t = queue[QUANTUM] === 0 ? 0 : (Date.now() + queue[QUANTUM])
		for (var i = 0, jobs = queue[JOBS]; i < jobs.length; i++) {
			var job = jobs[i]
			jobs[i] = undefined
			job()
			if (t !== 0 && Date.now() > t) {
				queue[JOBS] = jobs.slice(i + 1)
				queue[ASYNC](queue[RUN])
				return
			}
		}
		queue[JOBS] = []
		queue[RUNNING] = false
	}
}
