import {LogJson} from "../../../generals/LogWriter";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {AmocrmRequest} from "../../../crm_systems/amocrm/components/gateway/AmocrmGateway";

const chai = require('chai')

const testLogWriter = new LogJson('test', 'test,')
const testOptions: IRequestOptions = {
    uri: 'testUrisdoijksd',
    body: 'test body dfgdfg',
    method: 'qwerty',
    headers: 'testHeaders',

}
function getTestRequest(): AmocrmRequest {
    return new AmocrmRequest(testOptions, testLogWriter)
}

export async function testAmocrmRequest(): Promise<void> {
    describe('Amocrm Request Class', () => {
        it('Structure', () => {
            const request = getTestRequest()

            chai.assert(request.logWriter === testLogWriter)
            chai.assert(request.options.uri === testOptions.uri)
            chai.assert(request.options.body === testOptions.body)
            chai.assert(request.options.method === testOptions.method)
            chai.assert(request.options.headers === testOptions.headers)
        })

        it('Actions', async () => {
            const request = getTestRequest()
            const testResult = 'testReaspdokds'
            setTimeout(() => request.resolveTrigger(testResult), 100)
            const answer = await request.executed()
            chai.assert(testResult === answer)
        })
    })
}