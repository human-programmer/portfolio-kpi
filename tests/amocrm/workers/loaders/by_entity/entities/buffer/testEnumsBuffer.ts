import {saveTestUniqueEnums} from "../../customFields/testEnumsFabric";
import {EnumsBuffer, IEnumInterface} from "../../../../../../../workers/amocrm/loaders/entities/buffer/EnumsBuffer";
import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import IAmocrmEnum = IAmocrmLoaders.IAmocrmEnum;
import {IInterfaceEntityBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";

const chai = require('chai')

export async function testEnumsBuffer(): Promise<void> {
    describe('EnumsBuffer', () => {
        it('findPragmaId', async () => {
            const enums = await saveTestUniqueEnums()
            const interfaces = createEnumsInterfaces(enums)
            const buffer = await EnumsBuffer.create(enums[0].pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

function createEnumsInterfaces(enums: Array<IAmocrmEnum>): Array<IEnumInterface> {
    return enums.map(en => {
        return {
            amocrmEnumId: en.amocrmEnumId,
            pragmaEnumId: en.pragmaEnumId,
        }
    })
}

function check(enums: Array<IEnumInterface>, buffer: IInterfaceEntityBuffer): void {
    enums.forEach(en => {
        const pragmaId = buffer.findPragmaId(en.amocrmEnumId)
        chai.assert(pragmaId === en.pragmaEnumId)
    })
}