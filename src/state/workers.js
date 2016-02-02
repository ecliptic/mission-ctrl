import {createAction, handleActions} from 'redux-actions'
import {fromJS} from 'immutable'

export const BUSY = 'ship-yard/workers/BUSY'
export const DONE = 'ship-yard/workers/DONE'
export const ERROR = 'ship-yard/workers/ERROR'
export const OFFLINE = 'ship-yard/workers/OFFLINE'
export const READY = 'ship-yard/workers/READY'
export const STOP = 'ship-yard/workers/STOP'

export const WORKER_BUNDLER = 'ship-yard/workers/WORKER_BUNDLER'
export const WORKER_DEV_SERVER = 'ship-yard/workers/WORKER_DEV_SERVER'
export const WORKER_LINTER = 'ship-yard/workers/WORKER_LINTER'
export const WORKER_TEST_RUNNER = 'ship-yard/workers/WORKER_TEST_RUNNER'
export const WORKER_TRANSPILER = 'ship-yard/workers/WORKER_TRANSPILER'
export const WORKER_WATCHER = 'ship-yard/workers/WORKER_WATCHER'

export const initialState = fromJS({
  [WORKER_BUNDLER]: {error: null, name: 'Bundler', status: OFFLINE},
  [WORKER_DEV_SERVER]: {error: null, name: 'Dev Server', status: OFFLINE},
  [WORKER_LINTER]: {error: null, name: 'Linter', status: OFFLINE},
  [WORKER_TEST_RUNNER]: {error: null, name: 'Test Runner', status: OFFLINE},
  [WORKER_TRANSPILER]: {error: null, name: 'Transpiler', status: OFFLINE},
  [WORKER_WATCHER]: {error: null, name: 'Watcher', status: OFFLINE},
})

function updateStatus(status, state, action) {
  return state.update(action.payload.worker, workerState => {
    return workerState.merge({error: action.payload.error || null, status})
  })
}

export default handleActions({
  [BUSY]: updateStatus.bind(null, BUSY),
  [DONE]: updateStatus.bind(null, DONE),
  [ERROR]: updateStatus.bind(null, ERROR),
  [OFFLINE]: updateStatus.bind(null, OFFLINE),
  [READY]: updateStatus.bind(null, READY),
  [STOP]: updateStatus.bind(null, STOP),
}, initialState)

export const workerBusy = createAction(BUSY, worker => ({worker}))
export const workerDone = createAction(DONE, worker => ({worker}))
export const workerError = createAction(ERROR, worker => ({worker}))
export const workerOffline = createAction(OFFLINE, worker => ({worker}))
export const workerReady = createAction(READY, worker => ({worker}))
export const workerStop = createAction(STOP, worker => ({worker}))
