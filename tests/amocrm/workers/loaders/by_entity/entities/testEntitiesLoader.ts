import {CustomFieldsLoader} from "../../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsLoader";
import {AmocrmRestGateway} from "../../../../../../workers/amocrm/AmocrmRestGateway";
import {LoadDataSets} from "../../LoadDataSets";

const chai = require('chai')

export async function testEntitiesLoader(): Promise<void> {
    describe('EntitiesLoader', () => {
        it('run with test dataSets', async () => {
            const testAnswer = await LoadDataSets.getFileContent('CompaniesCfLoader.json')
            chai.assert(!!testAnswer)
        })
    })
}

// class TestCustomFieldsLoader extends CustomFieldsLoader {
//     private async restQuery(): Promise<any> {
//         return await LoadDataSets.getFileContent(CustomFieldsLoader)
//     }
// }