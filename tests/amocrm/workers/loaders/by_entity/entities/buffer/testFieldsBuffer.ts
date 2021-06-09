import {saveTestUniqueCF} from "../../customFields/testCustomFieldsFabric";
import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import {FieldsBuffer, IFieldInterface} from "../../../../../../../workers/amocrm/loaders/entities/buffer/FieldsBuffer";
import IAmocrmCustomField = IAmocrmLoaders.IAmocrmCustomField;
import {IInterfaceEntityBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";

const chai = require('chai')

export async function testFieldsBuffer(): Promise<void> {
    describe('FieldsBuffer', () => {
        it('findPragmaId', async () => {
            const customFields = await saveTestUniqueCF()
            const interfaces = createInterfaces(customFields)
            const buffer = await FieldsBuffer.create(customFields[0].pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

function createInterfaces(customFields: Array<IAmocrmCustomField>): Array<IFieldInterface> {
    return customFields.map(i => {
        return {
            amocrmFieldId: i.amocrmFieldId,
            pragmaFieldId: i.pragmaFieldId,
        }
    })
}

function check(enums: Array<IFieldInterface>, buffer: IInterfaceEntityBuffer): void {
    enums.forEach(en => {
        const pragmaId = buffer.findPragmaId(en.amocrmFieldId)
        chai.assert(pragmaId === en.pragmaFieldId)
    })
}