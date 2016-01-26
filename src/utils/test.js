import chai from 'chai'
import chaiImmutable from 'chai-immutable'
import configureStore from 'redux-mock-store'
import sourceMaps from 'source-map-support'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import thunkMiddleware from 'redux-thunk'

sourceMaps.install()

chai.use(chaiImmutable)
chai.use(sinonChai)

process.send = sinon.spy()
process.on = sinon.spy()

export function mockStore(...args) {
  return configureStore([thunkMiddleware])(...args)
}