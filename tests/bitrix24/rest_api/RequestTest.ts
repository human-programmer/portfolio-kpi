import {Bitrix24ApiRequest} from "../../../crm_systems/bitrix24/components/gateway/RestApiGateway";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IRequest = Bitrix24.IRequest;

const chai = require('chai')
const testPath = 'https://referer/testPath'

export async function testRequestClass (Classname: any) {
    describe('Request class', () => {
        describe('bitrix24 methods', () => {
            if(Classname === Bitrix24ApiRequest)
                it('simple method', () => {
                    const testMethod = 'user.access'
                            const testRequest = new Classname(testPath, testMethod, {})

                    chai.assert(testRequest.path === testPath)
                    chai.assert(testRequest.bitrix24Method === testMethod)
                    chai.assert(testRequest.isBatch === false)
                })

            it('batch method', () => {
                const testMethod = 'batch'
                    const testRequest = new Classname(testPath, testMethod, {})

                chai.assert(testRequest.path === testPath)
                chai.assert(testRequest.bitrix24Method === testMethod)
                chai.assert(testRequest.isBatch === true)
            })
        })

        it('query body', () => {
            const bodies = [{}, {test: 'test'}, null, undefined, 1, 'qwe']

            bodies.forEach(testBody => {
                const request = new Classname(testPath, 'test', testBody)
                chai.assert(request.queryBody instanceof Object)

                if(Classname === Bitrix24ApiRequest && testBody instanceof Object)
                    chai.assert(Object.keys(testBody).length === Object.keys(request.queryBody).length)
            })
        })

        it('unique id', async () => {
            const count = 10000, requests: Array<IRequest> = []

            for (let i = 0; i < count; ++i) {
                const request = new Classname(testPath, 'q', {})
                chai.assert(!requests.find(i => i.id === request.id))
                requests.push(request)
            }
        })

        it('events', async () => {
            const testMethod = 'user.access'
            const testRequest = new Classname(testPath, testMethod, {})

            const testRes = {test1: 'werewr', twer: 'sgdg'}

            setTimeout(() => testRequest.executedTrigger(testRes), 500)
            const result = await testRequest.executed()

            if(testRequest.isBatch)
                chai.assert(Object.keys(result.body).length === 5)
            else {
                chai.assert(!!Object.keys(testRes))
                Object.keys(testRes).forEach(expectedKey => {
                    chai.assert(!!result[expectedKey])
                    chai.assert(result[expectedKey] === testRes[expectedKey])
                })
            }
        })
    })
}

export async function testRequest(): Promise<void> {
    await testRequestClass(Bitrix24ApiRequest)
}