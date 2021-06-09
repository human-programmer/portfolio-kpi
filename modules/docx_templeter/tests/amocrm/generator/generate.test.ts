import {getTestDocxValueDataSets} from "../valuesFabric/ValuesFabric.test";
import {Interfaces} from "../../../amocrm/vendor/Interfaces";
import IAliasValue = Interfaces.IAliasValue;
import {IBasic} from "../../../../../crm_systems/main/path_handlers/BasicHandler";
import randomString = IBasic.randomString;
import {createWithValues} from "../../../amocrm/vendor/generator";

const fs = require('fs')
const chai = require('chai')

export async function testGenerate(): Promise<void> {
    describe('docx generate', () => {
        it('run', async () => {
            const {other_params, available_fields, values, content} = await generateDataSets()
            const answer = await createWithValues(content, values)
            const res = answer.toString('binary')
            chai.assert(values.length > 1)
            values.forEach(i => i.field_type !== 'date' && i.field_type !== 'date_time' && chai.assert(res.indexOf(i.value) !== -1))
        })
    })
}

async function generateDataSets(): Promise<any> {
    const {other_params, available_fields, values} = getTestDocxValueDataSets()
    valuesRandomizer(values)
    const str = values.map(i => i.alias).join(',')
    return {other_params, available_fields, values, content: TemplateLoader.getFileContent('test.docx')}
}

function valuesRandomizer(values: IAliasValue[]|any[]): void {
    values.forEach(i => i._value = randomString(256))
}

class TemplateLoader {
    private static readonly dir: string = __dirname + '/../data_sets/'

    static getFileContent = (fileName: string): any => {
        fileName = TemplateLoader.dir + fileName
        return fs.readFileSync(fileName, 'binary')
    }

    static async saveToFile(fileName: string, content: string): Promise<void> {
        fileName = TemplateLoader.dir + fileName
        fs.writeFile(fileName, content)
    }
}