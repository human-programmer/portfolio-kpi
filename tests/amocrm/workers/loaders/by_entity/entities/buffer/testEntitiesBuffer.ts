import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import IAmocrmEnum = IAmocrmLoaders.IAmocrmEnum;
import {IEnumInterface} from "../../../../../../../workers/amocrm/loaders/entities/buffer/EnumsBuffer";
import {IInterfacesBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";

const chai = require('chai')

export async function testEntitiesBuffer(): Promise<void> {
    describe('EntitiesBuffer', () => {
        it('findPragmaId', async () => {
            const enums = await saveTestUniqueEntities()
            const interfaces = createEntitiesInterfaces(enums)
            const buffer = await EntitiesBuffer.create(enums[0].pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

function createEntitiesInterfaces(enums: Array<IAmocrmEnum>): Array<IEnumInterface> {
    return enums.map(en => {
        return {
            amocrmEnumId: en.amocrmEnumId,
            pragmaEnumId: en.pragmaEnumId,
        }
    })
}

function check(enums: Array<IEnumInterface>, buffer: IInterfacesBuffer): void {
    enums.forEach(en => {
        const pragmaId = buffer.enums.findPragmaId(en.amocrmEnumId)
        chai.assert(pragmaId === en.pragmaEnumId)
    })
}