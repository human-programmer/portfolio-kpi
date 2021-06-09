import {AmocrmRequest, AmocrmRequestStack} from "../../../crm_systems/amocrm/components/gateway/AmocrmGateway";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {Generals} from "../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {LogJson} from "../../../generals/LogWriter";

const chai = require('chai')
const STACK_SIZE = 1000

class TestAmocrmRequest extends AmocrmRequest {
    readonly testAnswer: string

    static get createTest(): TestAmocrmRequest {
        const testLogWriter = new LogJson('test', 'test,')
        const testOptions: IRequestOptions = {
            uri: TestAmocrmRequest.generateUniqueAnswer(),
            body: TestAmocrmRequest.generateUniqueAnswer(),
            method: TestAmocrmRequest.generateUniqueAnswer(),
            headers: TestAmocrmRequest.generateUniqueAnswer(),
        }
        return new TestAmocrmRequest(testOptions, testLogWriter)
    }

    static createTestPriority(priority: number): TestAmocrmRequest {
        const testLogWriter = new LogJson('test', 'test,')
        const testOptions: IRequestOptions = {
            uri: TestAmocrmRequest.generateUniqueAnswer(),
            body: TestAmocrmRequest.generateUniqueAnswer(),
            method: TestAmocrmRequest.generateUniqueAnswer(),
            headers: TestAmocrmRequest.generateUniqueAnswer(),
            priority
        }
        return new TestAmocrmRequest(testOptions, testLogWriter)
    }

    constructor(request: IRequestOptions, logWriter: ILogWriter) {
        super(request, logWriter)
        this.testAnswer = TestAmocrmRequest.generateUniqueAnswer()
    }

    static generateUniqueAnswer(): string {
        return '' + Math.ceil((new Date().getTime() << 5) * Math.random())
    }
}

class TestAmocrmRequestStack extends AmocrmRequestStack {
    readonly testMask: Array<number>
    readonly testSize: Array<number>
    readonly stack: Array<AmocrmRequest> = []

    constructor() {
        super(new LogJson('testr', 'dfgdfg'), STACK_SIZE)
        this.testMask = []
        this.testSize = []
    }

    async next(): Promise<AmocrmRequest> {
        const answer = await super.next()
        const time = new Date().getTime()
        this.testMask.push(time)
        const requestsQuantity = this.testMask.filter(i => i > (time - 1000)).length
        this.testSize.push(requestsQuantity)
        return answer
    }

    get testMaxSize(): number {
        let size = 0
        this.testSize.forEach(i => {
            if(i > size) size = i
        })
        return size
    }
}

function testRequests(quantity: number): Array<AmocrmRequest> {
    const answer = []
    for(let i = 0; i < quantity; i++)
        answer.push(TestAmocrmRequest.createTest)
    return answer
}

const size = Math.ceil(STACK_SIZE * 1.7)
const testRequestsForLoad = testRequests(size)

export async function testAmocrmRequestStack(): Promise<void> {
    describe('AmocrmRequestStack', async () => {
        it('add next', async () => {
            const logWriter = new LogJson('test', 'test,')
            const stack = new AmocrmRequestStack(logWriter)

            chai.assert(stack.size === 0)

            const request1 = TestAmocrmRequest.createTest
            stack.add(request1)
            chai.assert(stack.size === 1)

            chai.assert(await stack.next() === request1)
            chai.assert(stack.size === 0)

            stack.add(TestAmocrmRequest.createTest)
            chai.assert(stack.size === 1)

            stack.add(TestAmocrmRequest.createTest)
            chai.assert(stack.size === 2)

            stack.add(TestAmocrmRequest.createTest)
            chai.assert(stack.size === 3)

            stack.add(TestAmocrmRequest.createTest)
            chai.assert(stack.size === 4)

            stack.add(TestAmocrmRequest.createTest)
            chai.assert(stack.size === 5)

            await stack.next()
            chai.assert(stack.size === 4)

            await stack.next()
            chai.assert(stack.size === 3)

            await stack.next()
            chai.assert(stack.size === 2)

            await stack.next()
            chai.assert(stack.size === 1)

            await stack.next()
            chai.assert(stack.size === 0)
        })

        it('load test', async () => {

            const testStack = new TestAmocrmRequestStack()
            testRequestsForLoad.forEach(i => testStack.add(i))

            await new Promise((resolve => setTimeout(resolve)))

            try {
                while (testStack.size > 0)
                    await testStack.next()
            } catch (error) {
                throw error
            }
            chai.assert(testStack.testMask.length === size)
            chai.assert(testStack.testSize.length === size)
            const maxRequestsCounters = testStack.testSize.filter(s => s > STACK_SIZE)
            if(maxRequestsCounters.length)
                console.log('maxRequestsCounters', maxRequestsCounters, 'MAX SIZE', STACK_SIZE)
            chai.assert(!testStack.testSize.find(s => s > STACK_SIZE + 1))
            chai.assert(testStack.testMaxSize === STACK_SIZE)
        })

        it('priority queue', () => {
            const requests = testPriorityRequests(500)
            const testStack = new TestAmocrmRequestStack()
            requests.forEach(request => {
                testStack.add(request)
                checkPriorityStack(testStack, request)
            })
        })
    })
}

function testPriorityRequests(quantity: number): Array<AmocrmRequest> {
    const answer = []
    for(let i = 0; i < quantity; i++) {
        const priority = Math.ceil(Math.random() * 10)
        answer.push(TestAmocrmRequest.createTestPriority(priority))
    }
    return answer
}

function checkPriorityStack(stack: TestAmocrmRequestStack, request: AmocrmRequest): void {
    const index = stack.stack.indexOf(request)
    if(index === 0 && stack.size > 1)
        chai.assert(!stack.stack.find(i => i.priority < request.priority))
    else if(index === 0 && stack.size === 1)
        chai.assert(stack.size === 1)
    else {
        const previousRequest = stack.stack[index - 1]
        chai.assert(previousRequest.priority < request.priority)
    }
}