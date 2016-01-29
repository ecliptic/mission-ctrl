import {expect} from 'chai'
import {fromJS} from 'immutable'
import {call, fork, take, put} from 'redux-saga'
import {notifyForeman, watchProcess} from 'utils/sagas'
import * as foreman from 'state/foreman'
import * as workers from 'state/workers'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

describe('sagas/watcher', () => {
  const mockProcess = {on: sinon.spy(), send: sinon.spy()}
  const forkStub = sinon.stub().returns(mockProcess)

  const watcher = proxyquire('./watcher', {
    'utils/workers': {forkWorker: forkStub},
  })

  beforeEach(() => {
    mockProcess.on.reset()
    mockProcess.send.reset()
    forkStub.reset()
  })

  describe('startWatcher()', () => {

    it('waits for a SET_GOAL event', () => {
      const getState = () => {}
      const generator = watcher.startWatcher(getState)

      const result = generator.next()

      expect(result.value).to.deep.equal(take(foreman.SET_GOAL))
    })

    it('does nothing if the event goal is not GOAL_WATCH', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.READY}}),
      })
      const generator = watcher.startWatcher(getState)

      generator.next()  // yields take(foreman.SET_GOAL)
      const result = generator.next(foreman.setGoal(foreman.GOAL_LINT))

      expect(result.value).to.deep.equal(take(foreman.SET_GOAL))
    })

    it('marks the watcher as busy before launching it', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)

      generator.next()  // yields take(foreman.SET_GOAL)
      const result = generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // put(workers.workerBusy(workers.WORKER_WATCHER))

      expect(result.value).to.deep.equal(put(workers.workerBusy(workers.WORKER_WATCHER)))
    })

    it('launches the watcher process if it is offline', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      generator.next()  // yields call(watchProcess, watcher)

      expect(forkStub).to.have.been.calledWith('watcher')
    })

    it('creates a process watcher to monitor messages from the foreman', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      const result = generator.next()

      expect(result.value).to.deep.equal(call(watchProcess, mockProcess))
    })

    it('forks a notify process to accept messages from the foreman', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)
      const processWatcher = {}

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      generator.next()  // yields call(watchProcess, watcher)
      const result = generator.next(processWatcher)

      expect(result.value).to.deep.equal(fork(notifyForeman, processWatcher))
    })

    it('waits for the watcher to be ready', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)
      const processWatcher = {}

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      generator.next()  // yields call(watchProcess, watcher)
      generator.next(processWatcher)  // yields fork(notifyForeman, watcher)
      const result = generator.next()

      expect(result.value).to.deep.equal(take(workers.READY))
    })

    it('continues waiting if a ready event for another worker is dispatched', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)
      const processWatcher = {}

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      generator.next()  // yields call(watchProcess, watcher)
      generator.next(processWatcher)  // yields fork(notifyForeman, watcher)
      generator.next()  // yields take(workers.READY)
      const result = generator.next(workers.workerReady(workers.WORKER_LINTER))

      expect(result.value).to.deep.equal(take(workers.READY))
    })

    it('returns to watching for SET_GOAL events after it is done launching', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.OFFLINE}}),
      })
      const generator = watcher.startWatcher(getState)
      const processWatcher = {}

      generator.next()  // yields take(foreman.SET_GOAL)
      generator.next(foreman.setGoal(foreman.GOAL_WATCH))  // yields put(workers.workerBusy(workers.WORKER_WATCHER))
      generator.next()  // yields call(watchProcess, watcher)
      generator.next(processWatcher) // yields fork(notifyForeman, watcher)
      generator.next() // take(workers.READY)
      const result = generator.next(workers.workerReady(workers.WORKER_WATCHER))

      expect(result.value).to.deep.equal(take(foreman.SET_GOAL))
    })

    it('does nothing if the watcher is otherwise not ready', () => {
      const getState = () => ({
        workers: fromJS({[workers.WORKER_WATCHER]: {status: workers.BUSY}}),
      })
      const generator = watcher.startWatcher(getState)

      generator.next()  // yields take(foreman.SET_GOAL)
      const result = generator.next(foreman.setGoal(foreman.GOAL_WATCH))

      expect(result.value).to.deep.equal(take(foreman.SET_GOAL))
    })

  })

})