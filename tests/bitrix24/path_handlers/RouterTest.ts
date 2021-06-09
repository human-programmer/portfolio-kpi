import {Bitrix24Router} from "../../../crm_systems/bitrix24/path_handlers/Router";
import {IServer} from "../../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;

const chai = require('chai')

export async function testBitrix24Router(): Promise<void> {
    describe('Bitrix24 Router', () => {
        it('route', async () => {
            const message: IWorkerMessage = {
                body: {basePath: 'werwer'}, requestId: 45435
            }
            const answer = await Bitrix24Router.route(message)
            chai.assert(answer.body.result.error === true)
        })
    })
}