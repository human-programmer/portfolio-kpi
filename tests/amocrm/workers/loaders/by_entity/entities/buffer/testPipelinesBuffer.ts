import {PipelinesBuffer, IPipelineInterface} from "../../../../../../../workers/amocrm/loaders/entities/buffer/PipelinesBuffer";
import {IInterfaceEntityBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";
import {saveTestUniquePipelines} from "../../pipelines/testPipelinesFabric";
import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import IPipeline = IAmocrmLoaders.IPipeline;

const chai = require('chai')

export async function testPipelinesBuffer(): Promise<void> {
    describe('PipelinesBuffer', () => {
        it('findPragmaId', async () => {
            const pipelines = await saveTestUniquePipelines()
            const interfaces = createPipelinesInterfaces(pipelines)
            const buffer = await PipelinesBuffer.create(pipelines[0].pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

function createPipelinesInterfaces(enums: Array<IPipeline>): Array<IPipelineInterface> {
    return enums.map(en => {
        return {
            amocrmPipelineId: en.amocrmPipelineId,
            pragmaPipelineId: en.pragmaPipelineId,
        }
    })
}

function check(enums: Array<IPipelineInterface>, buffer: IInterfaceEntityBuffer): void {
    enums.forEach(en => {
        const pragmaId = buffer.findPragmaId(en.amocrmPipelineId)
        chai.assert(pragmaId === en.pragmaPipelineId)
    })
}