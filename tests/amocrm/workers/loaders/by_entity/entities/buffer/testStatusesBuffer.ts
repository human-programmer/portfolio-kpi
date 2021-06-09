import {IStatusInterface, StatusesBuffer} from "../../../../../../../workers/amocrm/loaders/entities/buffer/StatusesBuffer";
import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import IStatus = IAmocrmLoaders.IStatus;
import {IInterfaceEntityBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";
import {saveTestUniquePipelines} from "../../pipelines/testPipelinesFabric";

const chai = require('chai')

export async function testStatusesBuffer(): Promise<void> {
    describe('StatusesBuffer', () => {
        it('findPragmaId', async () => {
            const {statuses, pragmaAccountId} = await getTest()
            const interfaces = createStatusesInterfaces(statuses)
            const buffer = await StatusesBuffer.create(pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

async function getTest(): Promise<any> {
    const pipelines = await saveTestUniquePipelines()
    return {
        statuses: [].concat(...pipelines.map(i => i.statuses)),
        pragmaAccountId: pipelines[0].pragmaAccountId
    }
}

function createStatusesInterfaces(enums: Array<IStatus>): Array<IStatusInterface> {
    return enums.map(en => {
        return {
            amocrmStatusId: en.amocrmStatusId,
            pragmaStatusId: en.pragmaStatusId,
        }
    })
}

function check(statuses: Array<IStatusInterface>, buffer: IInterfaceEntityBuffer): void {
    statuses.forEach(en => {
        const pragmaId = buffer.findPragmaId(en.amocrmStatusId)
        chai.assert(pragmaId === en.pragmaStatusId)
    })
}