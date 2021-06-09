import {AmocrmGateway, AmocrmRequest} from "../../../crm_systems/amocrm/components/gateway/AmocrmGateway";
import {LogJson} from "../../../generals/LogWriter";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {Generals} from "../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
const chai = require('chai')


const REQUESTS_QUANTITY = 10

interface ITestRequestOptions extends IRequestOptions {
    readonly testAnswerBody?: any
    readonly testAnswerInfo?: any
    readonly testAnswerError?: any
}

class TestAmocrmRequest extends AmocrmRequest {
    readonly testAnswer: string
    readonly testOptions: ITestRequestOptions

    static createAnswerTest(statusCode: number = 200): TestAmocrmRequest {
        const testLogWriter = new LogJson('test', 'test,')
        const testOptions: ITestRequestOptions = {
            uri: TestAmocrmRequest.generateUniqueAnswer(),
            body: TestAmocrmRequest.generateUniqueAnswer(),
            method: TestAmocrmRequest.generateUniqueAnswer(),
            headers: TestAmocrmRequest.generateUniqueAnswer(),
            testAnswerInfo: {statusCode, statusMessage: TestAmocrmRequest.generateUniqueAnswer()},
            testAnswerBody: TestAmocrmRequest.generateUniqueAnswer(),
        }
        return new TestAmocrmRequest(testOptions, testLogWriter)
    }

    constructor(request: ITestRequestOptions, logWriter: ILogWriter) {
        super(request, logWriter)
        this.testOptions = request
        this.testAnswer = TestAmocrmRequest.generateUniqueAnswer()
    }

    static generateUniqueAnswer(): string {
        return '' + Math.ceil((new Date().getTime() << 5) * Math.random())
    }
}

class TestAmocrmGateway extends AmocrmGateway {
    readonly testMask: Array<number>
    readonly testSize: Array<number>

    constructor(logWriter: ILogWriter) {
        super(logWriter);
        this.testSize = []
        this.testMask = []
    }

    async request (options: any): Promise<any> {
        return new Promise(resolve => setTimeout(() => {
            this.setRequestAnalytic()
            resolve({
                body: options.testAnswerBody,
                info: options.testAnswerInfo,
                error: options.testAnswerError
            })
        }, 100))
    }

    private setRequestAnalytic(): void {
        const time = new Date().getTime()
        this.testMask.push(time)
        const requestsQuantity = this.testMask.filter(i => i > (time - 1000)).length
        this.testSize.push(requestsQuantity)
    }

    get maxTestRequestsQuantity(): number {
        let max = 0
        this.testSize.forEach(i => {
            if(i > max) max = i
        })
        return max
    }
}

function createTestRequests(): Array<TestAmocrmRequest> {
    const answer = []
    for(let i = 0; i < REQUESTS_QUANTITY; i++)
        answer.push(TestAmocrmRequest.createAnswerTest())
    return answer
}

const testLog = new LogJson('testAmocrmGateway', 'testAmocrmGateway')
const testGateway = new TestAmocrmGateway(testLog)
const requestSet = createTestRequests()

const checkAnswer = async (request: TestAmocrmRequest) => {
    const answer = await testGateway.execute(request.options, testLog)
    chai.assert(answer.body === request.testOptions.testAnswerBody)
    chai.assert(answer.info === request.testOptions.testAnswerInfo)
    chai.assert(answer.error === request.testOptions.testAnswerError)
}

export async function testAmocrmGateway (): Promise<void> {
    describe('AmocrmGateway', () => {
        it('execute', async () => {
            const promises = requestSet.map(i => checkAnswer(i))
            await Promise.all(promises)
        })
    })
}