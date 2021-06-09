import {getDocxTestDataSets, LoadDataSets} from "../aliasFabric/AliasFabric.test";
import {AliasValuesFabric} from "../../../amocrm/vendor/values";
import {AliasFabric} from "../../../amocrm/vendor/aliases";

const chai = require('chai')

export async function testValuesFabric(): Promise<void> {
    describe('ValuesFabric', () => {
        it('getCurrentValues', () => {
            defaultTest(getDocxTestDataSets())
        })
        it('without contacts values', () => {
            defaultTest(getDataSetsWithoutValues('contacts'))
        })
        it('without leads values', () => {
            defaultTest(getDataSetsWithoutValues('leads'))
        })
        it('without companies values', () => {
            defaultTest(getDataSetsWithoutValues('companies'))
        })
        it('without companies', () => {
            defaultTest(getDataSetsWithoutEntity('companies'))
        })
        it('without leads', () => {
            defaultTest(getDataSetsWithoutEntity('leads'))
        })
        it('without contacts', () => {
            defaultTest(getDataSetsWithoutEntity('contacts'))
        })
    })
}

function defaultTest(dataSets: any): void {
    const {other_params, available_fields} = dataSets
    const valuesFabric = new AliasValuesFabric(other_params)
    const aliasFabric = new AliasFabric(other_params)
    const aliases = aliasFabric.getAliases()
    const values = valuesFabric.getAllCurrentValues()
    chai.assert(values.length > available_fields.length)
    chai.assert(values.length === aliases.length)
}

function getDataSetsWithoutValues(entity_type): any {
    const {other_params, available_fields} = getDocxTestDataSets()
    const contact = other_params.entities.find(i => i.entity_type === entity_type)
    contact.custom_fields_values = null
    return {other_params, available_fields}
}

function getDataSetsWithoutEntity(entity_type): any {
    const {other_params, available_fields} = getDocxTestDataSets()
    const entity = other_params.entities.find(i => i.entity_type === entity_type)
    const index = other_params.entities.indexOf(entity)
    other_params.entities.splice(index, 1)
    return {other_params, available_fields}
}

export function getTestDocxValueDataSets(): any {
    const {other_params, available_fields} = getDocxTestDataSets()
    const valuesFabric = new AliasValuesFabric(other_params)
    const values = valuesFabric.getAllCurrentValues()
    return {other_params, available_fields, values}
}