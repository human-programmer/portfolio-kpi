import {TestFabric} from "../TestFabric";
import {AmocrmRestGateway} from "../../../../workers/amocrm/AmocrmRestGateway";

const chai = require('chai')

export async function testAmocrmRestGateway(): Promise<void> {
    describe('AmocrmRestGateway', () => {
        it('get Node', async () => {
            const node = await TestFabric.getTestNodeStruct()
            chai.assert(!!node)
        })

        it('get', async () => {
            const node = await TestFabric.getTestNodeStruct()
            const answer = await AmocrmRestGateway.get(node, '/api/v4/users')
            chai.assert(!!answer.body._embedded.users.length)
        })
    })
}