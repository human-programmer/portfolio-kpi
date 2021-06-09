import {AmocrmRouter} from "../../../crm_systems/amocrm/path_handlers/AmocrmRouter";
import {IServer} from "../../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;
import {IBasic} from "../../../generals/IBasic";
import testError = IBasic.testError;
import Errors = IBasic.Errors;
import TypeWorkerMessage = IServer.TypeWorkerMessage;

const chai = require('chai')

export async function testAmocrmRouter(): Promise<void> {
    describe('Bitrix24 Router', () => {
        it('route', async () => {
            const message: IWorkerMessage = {
                type: TypeWorkerMessage.api,
                body: {basePath: 'werwer'},
                requestId: 4543556
            }
            const answer = await AmocrmRouter.self.route(message)
            testError(answer.body.result, Errors.invalidRequestCode)
        })
    })
}