import {call, put, take} from 'redux-saga'
import {done} from 'state/transpiler'
import {expect} from 'chai'
import {sync as glob} from 'glob'
import {TRANSPILE, transpile as transpileAction} from 'state/transpiler'
import {workerDone, WORKER_TRANSPILER} from 'state/workers'
import * as babel from 'utils/babel'
import initTranspiler, {transpile} from './transpiler'

describe('sagas/transpiler', () => {

  describe('initTranspiler()', () => {
    const generator = initTranspiler()

    it('watches for TRANSPILE events', () => {
      const result = generator.next()
      expect(result.value).to.deep.equal(take(TRANSPILE))
    })

    it('calls transpile() with the path provided', () => {
      const result = generator.next(transpileAction('file.js'))
      expect(result.value).to.deep.equal(call(transpile, 'file.js'))
    })

    it('goes back to watching for TRANSPILE events', () => {
      const result = generator.next()
      expect(result.value).to.deep.equal(take(TRANSPILE))
    })

  })

  describe('transpile()', () => {
    const filenames = ['src/spike.js', 'src/lee.js']
    const generator = transpile()

    it('calls glob-sync to get filenames', () => {
      const result = generator.next()
      expect(result.value).to.deep.equal(call(glob, 'src/**/*.js?(x)'))
    })

    it('calls babel to transpile the discovered files', () => {
      const result = generator.next(filenames)
      expect(result.value).to.deep.equal(call(babel.transpile, {
        baseDir: 'src',
        filenames,
        outDir: 'build',
        sourceMaps: true,
      }))
    })

    it('dispatches a done event', () => {
      const result = generator.next()
      expect(result.value).to.deep.equal(put(done()))
    })

    it('sends a workerDone event to the foreman', () => {
      const result = generator.next()
      expect(result.value.CALL.fn).to.have.property('name', 'bound proxy')
      expect(result.value.CALL.args[0]).to.deep.equal(workerDone(WORKER_TRANSPILER))
    })

    it('ends the saga', () => {
      const result = generator.next()
      expect(result.done).to.be.true
    })

  })

})