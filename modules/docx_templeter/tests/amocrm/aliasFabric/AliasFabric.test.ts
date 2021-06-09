import {AliasFabric} from "../../../amocrm/vendor/aliases";
import {Interfaces} from "../../../amocrm/vendor/Interfaces";
import IOtherParams = Interfaces.IOtherParams;

const chai = require('chai')
const fs = require('fs')

export async function testAliasFabric(): Promise<void> {
    describe('AliasFabric', () => {
        it('', () => {
            const {other_params, available_fields} = getDocxTestDataSets()
            const fabric = new AliasFabric(other_params)
            const aliases = fabric.getAliases()
            chai.assert(available_fields.length < aliases.length)
            available_fields.forEach(i => chai.assert(aliases.find(a => a.field_name == i.id)))
        })
    })
}

export function getDocxTestDataSets(): any {
    const other_params = getTestOtherParams()
    return {
        other_params,
        available_fields: other_params.customFields.filter(i => isAvailable(i))
    }
}

function getAvailableCustomFields(): any[] {
    const dataSets = getCfDataSets()
    return dataSets.filter(i => isAvailable(i))
}

function isAvailable(struct: any): boolean {
    const field_type = struct.field_type || struct.type
    switch (field_type) {
        case 'user_id':
        case 'text':
        case 'streetaddress':
        case 'numeric':
        case 'select':
        case 'multiselect':
        case 'radiobutton':
        case 'date_time':
        case 'date':
        case 'legal_entity':
        case 'checkbox':
            return true
        default:
            return false
    }
}

export function getTestOtherParams(): IOtherParams {
    return {
        customFields: getCfDataSets(),
        entities: getEntitiesDataSets(),
        managers: getUsers()
    }
}

function getUsers(): any[] {
    return LoadDataSets.getFileContent('UsersLoader.json').body._embedded.users
}

function getEntitiesDataSets(): any[] {
    const company = LoadDataSets.getFileContent('CompaniesLoader.json').body._embedded.companies[0]
    const contact = LoadDataSets.getFileContent('ContactsLoader.json').body._embedded.contacts[0]
    const lead = LoadDataSets.getFileContent('LeadsLoader.json').body._embedded.leads[0]
    company.entity_type = 'companies'
    contact.entity_type = 'contacts'
    lead.entity_type = 'leads'
    return [company, contact, lead]
}

function getCfDataSets(): any[] {
    return [
        ...LoadDataSets.getFileContent('CompaniesCfLoader.json').body._embedded.custom_fields,
        ...LoadDataSets.getFileContent('ContactsCfLoader.json').body._embedded.custom_fields,
        ...LoadDataSets.getFileContent('LeadsCfLoader.json').body._embedded.custom_fields,
    ]
}

export class LoadDataSets {
    private static readonly dir: string = __dirname + '/../data_sets/'

    static getFileContent = (fileName: string): any => {
        fileName = LoadDataSets.dir + fileName
        const content = fs.readFileSync(fileName, 'utf8')
        return JSON.parse(content)
    }

    static async saveToFile(fileName: string, content: string): Promise<void> {
        fileName = LoadDataSets.dir + fileName
        await new Promise((resolve, reject) => fs.writeFile(fileName, content, err => {
            err ? reject(err) : resolve(null)
        }))
    }
}