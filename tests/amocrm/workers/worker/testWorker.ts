import {PWorkers} from "../../../../server/PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import {TestFabric} from "../TestFabric";
import {IAmocrmLoaders} from "../../../../workers/amocrm/interface";
import createInstallEventRequest = IAmocrmLoaders.createInstallEventRequest;
import {checkTestResultIsWaitingToStart} from "../AccountWorkers/testAccountWorkers";

const worker = PragmaWorkers.amocrmWorkersWorker

export async function testAmocrmWorker(): Promise<void> {
    describe('amocrmRequestWorker', () => {
        it('Accounts', async () => {
            const node = await TestFabric.uniqueNodeStruct()
            const request = createInstallEventRequest(node)
            const answer = await worker.executeRequest(request)
            checkTestResultIsWaitingToStart(answer.result)
        })
    })
}