import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../generals/IBasic";
import asVarchar = IBasic.asVarchar;
import {Generals} from "../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import EntityGroup = Generals.EntityGroup;
import EntityFieldName = Generals.FieldName;
import FieldType = Generals.FieldType;
import {OthersFieldsValuesFabric} from "./OtherFieldsValues";

export interface IAmoEntityId {
    readonly id: number
    readonly type: AmocrmEntityGroup
    readonly pragmaEntityId?: number
}

export interface IAmoEntityLinks {
    readonly mainId: IAmoEntityId
    readonly links: Array<IAmoEntityId>
}

export interface ILoadedEntity {
    readonly amocrmEntityId: number
    pragmaEntityId?: number
    readonly values: Array<ILoadedValue>
    readonly links: IAmoEntityLinks
    readonly otherFieldsValues: IOtherFieldsValues
    readonly fieldsValues: IFieldsValues
}

export interface IOtherFieldsValues {
    readonly pragmaEntityId: number
    readonly status?: ILoadedValue
    readonly user?: ILoadedValue
    readonly pipeline?: ILoadedValue
    readonly date_update?: ILoadedValue
}

export interface IFieldsValues {
    readonly pragmaEntityId: number
    readonly price?: ILoadedValue
    readonly title?: ILoadedValue
    readonly date_create?: ILoadedValue
    readonly date_update?: ILoadedValue
}

export interface IFieldInterface {
    readonly pragmaFieldId: number
    readonly pragmaFieldName?: EntityFieldName
    readonly pragmaFieldType: FieldType
}

export interface ILoadedValue extends IFieldInterface{
    pragmaEntityId?: number
    readonly value: string|number|Date
}

export abstract class EntitiesFabric extends BasicDataBase{
    readonly amocrmLinks: Array<IAmoEntityLinks> = []
    private readonly pragmaAccountId: number
    private readonly amocrmAccountId: number
    protected abstract readonly amocrmEntityType: AmocrmEntityGroup
    protected abstract readonly pragmaEntityType: EntityGroup

    constructor(pragmaAccountId: number, amocrmAccountId: number) {
        super()
        this.pragmaAccountId = pragmaAccountId
        this.amocrmAccountId = amocrmAccountId
    }

    async save (entities: Array<ILoadedEntity>): Promise<void> {
        this.saveLinksInBuffer(entities)
        const pieces = BasicDataBase.toSplit(entities, 25)
        await Promise.all(pieces.map(piece => this.savePiece(piece)))
    }

    private saveLinksInBuffer(entities: Array<ILoadedEntity>): void {
        entities.forEach(i => this.amocrmLinks.push(i.links))
    }

    private async savePiece(entities: Array<ILoadedEntity>): Promise<void> {
        await this.saveCore(entities)
        await this.saveOther(entities)
    }

    private async saveCore(entities: Array<ILoadedEntity>): Promise<void> {
        const existsEntities = await this.filterExists(entities)
        const newEntities = entities.filter(i => !i.pragmaEntityId)
        await Promise.all([
            this.updateEntities(existsEntities),
            this.createEntities(newEntities),
        ])
    }

    private async filterExists(entities: Array<ILoadedEntity>): Promise<Array<ILoadedEntity>> {
        const existsInterfaces = await this.getExistsInterfaces(entities)
        EntitiesFabric.addPragmaEntityId(entities, existsInterfaces)
        return entities.filter(i => i.pragmaEntityId)
    }

    private async getExistsInterfaces(entities: Array<ILoadedEntity>): Promise<Array<any>> {
        const condition = entities.map(i => `(entity_id = ${i.amocrmEntityId} AND type = '${this.amocrmEntityType}')`).join(' OR ')
        if(!condition) return []
        const amocrm = EntitiesFabric.amocrmEntitiesSchema
        const sql = `SELECT
                        pragma_entity_id AS pragmaEntityId,
                        entity_id AS amocrmEntityId
                    FROM ${amocrm} 
                    WHERE pragma_account_id = ${this.pragmaAccountId} AND ${condition}`
        return EntitiesFabric.query(sql, [], 'EntitiesFabric -> getExistsInterfaces')
    }

    private static addPragmaEntityId(entities: Array<ILoadedEntity>, interfaces: Array<any>): void {
        interfaces.forEach(i => {
            const entity = entities.find(e => e.amocrmEntityId == i.amocrmEntityId)
            if(entity) entity.pragmaEntityId = Number.parseInt(i.pragmaEntityId)
        })
    }

    private async createEntities(newEntities: Array<ILoadedEntity>): Promise<void> {
        await Promise.all(newEntities.map(i => this.createEntity(i)))
    }

    private async createEntity(entity: ILoadedEntity): Promise<void> {
        const {keys, values, model} = EntitiesFabric.valuesStringToCreate(entity)

        if(!keys || !values || !model || !model.length) return;

        const pragma = CRMDB.entitiesSchema
        const sql = `INSERT INTO ${pragma} (account_id, entity_type ${keys})
                    VALUES(${this.pragmaAccountId}, ${this.pragmaEntityType} ${values})`

        const answer = await EntitiesFabric.query(sql, model, 'EntitiesFabric -> createEntity')

        entity.pragmaEntityId = Number.parseInt(answer['insertId'])
    }

    private static valuesStringToCreate(entity: ILoadedEntity): any {
        const fieldsValues = EntitiesFabric.fetchFieldsValues(entity)
        const answer = {keys: '', values: '', model: []}
        if(!fieldsValues.length) return answer
        answer.keys = ',' + fieldsValues.map(i => i.pragmaFieldName).join(',')
        answer.values = ',' + fieldsValues.map(i => '?').join(',')
        answer.model = fieldsValues.map(i => i.value)
        return answer
    }

    private static fetchFieldsValues(entity: ILoadedEntity): Array<ILoadedValue> {
        return Object.values(entity.fieldsValues).filter(i => i && typeof i === 'object' && i.pragmaFieldName)
    }

    private async updateEntities(existsEntities: Array<ILoadedEntity>): Promise<void> {
        await Promise.all(existsEntities.map(i => EntitiesFabric.updateEntity(i)))
    }

    private static async updateEntity(existsEntity: ILoadedEntity): Promise<void> {
        const fieldsValues = EntitiesFabric.fetchFieldsValues(existsEntity)
        const {headers, values} = EntitiesFabric.fetchParamsToUpdate(fieldsValues)

        if(!headers) return;

        const sql = `UPDATE ${CRMDB.entitiesSchema} SET ${headers} WHERE id = ${existsEntity.pragmaEntityId}`
        await EntitiesFabric.query(sql, values, 'EntitiesFabric -> updateEntity')
    }

    private static fetchParamsToUpdate(fieldsValues: ILoadedValue[]): any {
        const headers = [], values = []
        fieldsValues.forEach(val => {
            headers.push(`${val.pragmaFieldName} = ?`)
            values.push(val.value)
        })
        return {headers: headers.join(','), values}
    }

    private async saveOther(entities: Array<ILoadedEntity>): Promise<void> {
        await Promise.all([
            this.saveInterfaces(entities),
            ValuesFabric.saveValues(entities)
        ])
    }

    private async saveInterfaces(entities: Array<ILoadedEntity>): Promise<void> {
        const values = entities
            .map(i => `(${i.pragmaEntityId}, 
                        ${this.pragmaAccountId}, 
                        ${i.amocrmEntityId}, 
                        ${this.amocrmAccountId}, 
                        ${CRMDB.escape(this.amocrmEntityType)})`)
            .join(',')

        const sql = `INSERT INTO ${EntitiesFabric.amocrmEntitiesSchema} 
                        (pragma_entity_id, pragma_account_id, entity_id, account_id, type)
                        VALUES ${values}
                    ON DUPLICATE KEY UPDATE type = VALUES(type)`

        await EntitiesFabric.query(sql, [], 'EntitiesFabric -> saveInterfaces')
    }
}

export class ValuesFabric {
    static async saveValues(entities: Array<ILoadedEntity>): Promise<void> {
        ValuesFabric.addPragmaEntityIdToValues(entities)
        await Promise.all([
            ValuesFabric.saveTablesValues(entities),
            ValuesFabric.saveOtherFieldsValues(entities)
        ])
    }

    private static async saveTablesValues(entities: Array<ILoadedEntity>): Promise<void> {
        await ValuesFabric.removeOldValues(entities)
        const values = ValuesFabric.fetchAllTableValues(entities)
        await ValuesFabric.saveEnumStringValues(values)
    }

    private static async removeOldValues(entities: Array<ILoadedEntity>): Promise<void> {
        const ids = entities.map(entity => entity.pragmaEntityId)
        await Promise.all([
            EnumsValuesFabric.deleteOldValues(ids),
            StringValuesFabric.deleteOldValues(ids),
        ])
    }

    private static fetchAllTableValues(entities: Array<ILoadedEntity>): Array<ILoadedValue> {
        return [].concat(...entities.map(i => i.values))
    }

    private static addPragmaEntityIdToValues(entities: Array<ILoadedEntity>): void {
        entities.forEach(i => ValuesFabric.addPEntityId(i))
    }

    private static addPEntityId(entity: ILoadedEntity): void {
        let allValues = [...Object.values(entity.fieldsValues), ...Object.values(entity.otherFieldsValues), ...entity.values]
        allValues = allValues.filter(i => i && typeof i === 'object')
        allValues.forEach(val => val.pragmaEntityId = entity.pragmaEntityId)
        // @ts-ignore
        entity.fieldsValues.pragmaEntityId = entity.pragmaEntityId
        // @ts-ignore
        entity.otherFieldsValues.pragmaEntityId = entity.pragmaEntityId
    }

    static async saveEnumStringValues (values: Array<ILoadedValue>): Promise<void> {
        await Promise.all([
            ValuesFabric.saveEnumValues(values),
            ValuesFabric.saveStringValues(values),
        ])
    }

    private static async saveEnumValues(values: Array<ILoadedValue>): Promise<void> {
        const enumValues = values.filter(i => i.pragmaFieldType === 'enums' && i.pragmaFieldId && typeof i.value === 'number')
        await EnumsValuesFabric.save(enumValues)
    }

    private static async saveStringValues(values: Array<ILoadedValue>): Promise<void> {
        const stringValues = values.filter(i => i.pragmaFieldType !== 'enums' && i.pragmaFieldId)
        await StringValuesFabric.save(stringValues)
    }

    private static async saveOtherFieldsValues(entities: Array<ILoadedEntity>): Promise<void> {
        const values = [].concat(...entities.map(i => i.otherFieldsValues))
        await OthersFieldsValuesFabric.save(values)
    }
}

export class EnumsValuesFabric extends BasicDataBase{
    static async deleteOldValues(entitiesId: Array<number>): Promise<void> {
        const condition = entitiesId.map(id => `entity_id = ${id}`).join(' OR ')
        if(!condition) return;
        const sql = `DELETE FROM ${super.enumsValuesSchema} WHERE ${condition}`
        await super.query(sql, [], 'EnumsValuesFabric -> deleteOldValues')
    }

    static async save (values: Array<ILoadedValue>): Promise<void> {
        const pieces = super.toSplit(values, 50)
        await Promise.all(pieces.map(piece => this.savePiece(piece)))
    }
    private static async savePiece(values: Array<ILoadedValue>): Promise<void> {
        const valuesStr = values.map(i => `(${i.pragmaEntityId}, ${i.pragmaFieldId}, ${super.escape(i.value)})`).join(',')
        if(!valuesStr) return;
        const sql = `INSERT INTO ${super.enumsValuesSchema} 
                        (entity_id, field_id, option_id)
                    VALUES ${valuesStr}
                    ON DUPLICATE KEY UPDATE
                        option_id = VALUES(option_id)`

        await super.query(sql, [], 'EnumsValuesFabric -> savePiece')
    }
}

export class StringValuesFabric extends BasicDataBase {
    static async deleteOldValues(entitiesId: Array<number>): Promise<void> {
        const condition = entitiesId.map(id => `entity_id = ${id}`).join(' OR ')
        if(!condition) return;
        const sql = `DELETE FROM ${super.stringValuesSchema} WHERE ${condition}`
        await super.query(sql, [], 'StringValuesFabric -> deleteOldValues')
    }

    static async save (values: Array<ILoadedValue>): Promise<void> {
        const pieces = super.toSplit(values, 50)
        await Promise.all(pieces.map(piece => this.savePiece(piece)))
    }

    private static async savePiece(values: Array<ILoadedValue>): Promise<void> {
        const valuesStr = StringValuesFabric.createValuesString(values)
        if(!valuesStr) return;
        const sql = `INSERT INTO ${super.stringValuesSchema} 
                        (entity_id, field_id, value)
                    VALUES ${valuesStr}
                    ON DUPLICATE KEY UPDATE
                        value = VALUES(value)`
        await super.query(sql, [], 'StringValuesFabric -> savePiece')
    }

    private static createValuesString(values: Array<ILoadedValue>): string {
        return values.map(i => {
            const stringValue = StringValuesFabric.toStringValue(i.value)
            if(!stringValue) return null
            return `(${i.pragmaEntityId}, ${i.pragmaFieldId}, ${super.escape(i.value)})`
        }).filter(i => i).join(',')
    }

    private static toStringValue(value: any): string {
        if(value instanceof Date)
            value = Math.ceil(value.getTime() / 1000)
        value = '' + value
        value = asVarchar(value, 256)
        return value
    }
}

export class ContactsFabric extends EntitiesFabric {
    protected readonly amocrmEntityType: AmocrmEntityGroup.contacts = AmocrmEntityGroup.contacts
    protected readonly pragmaEntityType: EntityGroup.contacts = EntityGroup.contacts
}

export class CompaniesFabric extends EntitiesFabric {
    protected readonly amocrmEntityType: AmocrmEntityGroup.companies = AmocrmEntityGroup.companies
    protected readonly pragmaEntityType: EntityGroup.companies = EntityGroup.companies
}

export class LeadsFabric extends EntitiesFabric {
    protected readonly amocrmEntityType: AmocrmEntityGroup.leads = AmocrmEntityGroup.leads
    protected readonly pragmaEntityType: EntityGroup.leads = EntityGroup.leads
}