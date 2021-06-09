import {Batch, Bitrix24ApiRequest} from "../../../crm_systems/bitrix24/components/gateway/RestApiGateway";
import {testRequestClass} from "./RequestTest";
import {IBasic} from "../../../generals/IBasic";
import IError = IBasic.IError;

const chai = require('chai')
const REQUEST_QUANTITY = 1000

export class TestBitrix24Batch extends Batch{
    get testExecutedAnswer(): any {
        const result = {
            result: {},
            result_error: {},
            result_total: {},
            result_next: {},
            result_time: {},
        }

        this.requests.forEach(request => {
            // @ts-ignore
            if(request.testIsErrorAnswer)
                // @ts-ignore
                result.result_error[request.id] = request.resultErrorTest
            else {
                // @ts-ignore
                result.result[request.id] = request.resultTestBody
                // @ts-ignore
                result.result_total[request.id] = request.resultTotalTest
                // @ts-ignore
                result.result_next[request.id] = request.testResultNext
                // @ts-ignore
                result.result_time[request.id] = request.timeTest
            }
        })

        return {body: result}
    }
}

export class TestBitrix24Request extends Bitrix24ApiRequest {
    testExecutedFlag = false

    executedTrigger(result: any) {
        super.executedTrigger(result)
        this.testExecutedFlag = true
    }
    errorTrigger(error: IError) {
        super.errorTrigger(error)
        this.testExecutedFlag = true
    }

    get testIsErrorAnswer(): boolean {
        return this.id % 2 === 0
    }

    get resultTest(): any {
        if(this.testIsErrorAnswer)
            return this.resultErrorTest
        return {
            result: this.resultTestBody,
            total: this.resultTotalTest,
            time: this.timeTest,
            next: this.testResultNext
        }
    }

    get testResultNext(): number|undefined {
        return this.id > 50 ? 50 : undefined
    }

    get resultTestBody(): any {
        if(this.testIsErrorAnswer) return null

        const result = []
        const max = this.id > 50 ? 50 : this.id
        for(let i = 0; i < max; ++i)
            result.push({['test_field_' + i]: 'value_' + i})
        return result
    }

    get resultTotalTest(): number | null {
        return this.testIsErrorAnswer ? null : this.id
    }

    get resultErrorTest(): any {
        if(this.testIsErrorAnswer)
            return {
                error: 'error_' + this.id,
                error_description: 'error_' + this.id + '_description'
            }
    }

    get timeTest(): any {
        return {
            start: 1615449724.943842,
            finish: 1615449725.034159,
            duration: 0.0903170108795166,
            processing: 0.05793595314025879,
            date_start: "2021-03-11T11:02:04+03:00",
            date_finish: "2021-03-11T11:02:05+03:00",
        }
    }
}

function getTestRequests(): Array<TestBitrix24Request> {
    const bodies = []
    for (let i = 0; i < REQUEST_QUANTITY; ++i)
        bodies.push({
                ['field_a_' + i]: 'value_a_' + i,
                ['field_b_' + i]: 'value_b_' + i,
                ['field_c_' + i]: 'value_c_' + i,
            })

    return bodies.map(body => new TestBitrix24Request('test', 'test.method', body))
}

function checkQueryBody(requests: Array<TestBitrix24Request>, queryBody: any): void {
    chai.assert(queryBody.halt === 0)
    chai.assert(queryBody.cmd instanceof Object)

    const cmdKeys = Object.keys(queryBody.cmd)

    chai.assert(cmdKeys.length === REQUEST_QUANTITY)
    cmdKeys.forEach(RequestId => {
        const reqId = Number.parseInt(RequestId)
        const targetRequest = requests.find(request => request.id === reqId)
        chai.assert(!!targetRequest)
        chai.assert(queryBody.cmd[RequestId] === targetRequest.bitrix24FullMethod)
    })
}

async function checkBatchQueryBody(requests: Array<TestBitrix24Request> = null, batch: Batch = null): Promise<void> {
    requests = requests || getTestRequests()
    batch = batch || new Batch('test', requests)

    chai.assert(batch.isBatch === true)
    chai.assert(batch.requests.length === REQUEST_QUANTITY)
    const queryBody = batch.queryBody
    checkQueryBody(requests, queryBody)
    await checkEvent(requests, batch)
}

async function checkEvent(requests: Array<TestBitrix24Request>, batch: Batch): Promise<void> {
    chai.assert(requests.length === REQUEST_QUANTITY)
    await Promise.all([
        Promise.all(requests.map(checkRequestEvent)),
        new Promise(res => setTimeout(() => {
            batch.executedTrigger(getExecutedData(requests))
            res(null)
        }, 500))
    ])

}

async function checkRequestEvent(request: TestBitrix24Request): Promise<void> {
    const ERROR_FLAG = 'errors_flag'
    const answer = await Promise.race([
        new Promise(res => setTimeout(() => res(ERROR_FLAG), 1000)),
        request.executed()
    ])

    chai.assert(answer !== ERROR_FLAG)

    if(request.testIsErrorAnswer) {
        chai.assert(!!answer.error)
        chai.assert(answer.error === request.resultErrorTest.error)
        chai.assert(answer.error_description === request.resultErrorTest.error_description)
    } else {
        chai.assert(answer.body.next === request.testResultNext)
        chai.assert(answer.body.total === request.resultTotalTest)
        chai.assert(answer.body.result.length === request.resultTestBody.length)
        chai.assert(Object.keys(answer.body.time).length === 6)
    }
}

function getExecutedData(requests: Array<TestBitrix24Request>): any {
    const testBatch = new TestBitrix24Batch('test', requests)
    return testBatch.testExecutedAnswer
    // const result = {
    //     result: {},
    //     result_error: {},
    //     result_total: {},
    //     result_next: {},
    //     result_time: {},
    // }
    //
    // requests.forEach(request => {
    //     if(request.testIsErrorAnswer)
    //         result.result_error[request.id] = request.resultErrorTest
    //     else {
    //         result.result[request.id] = request.resultTestBody
    //         result.result_total[request.id] = request.resultTotalTest
    //         result.result_next[request.id] = request.testResultNext
    //         result.result_time[request.id] = request.timeTest
    //     }
    // })
    //
    // return {result}
}

export async function testBatch(): Promise<void> {
    describe('Bitrix24 Batch', () => {
        describe('As Request', () => {
            testRequestClass(Batch)
        })

        it('isBatch', () => {
            const batch = new Batch('test', [])
            chai.assert(batch.isBatch === true)
        })

        it('queryBody', async () => {
            await checkBatchQueryBody()
            await checkBatchQueryBody()
        })
    })
}