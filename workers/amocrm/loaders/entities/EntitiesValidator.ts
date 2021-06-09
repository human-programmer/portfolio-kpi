import {IInterfacesBuffer} from "./Buffer";
import {
    IAmoEntityId,
    IAmoEntityLinks,
    IFieldsValues,
    ILoadedEntity,
    ILoadedValue,
    IOtherFieldsValues
} from "./EntitiesFabric";
import {Func} from "../../../../generals/Func";
import {Generals} from "../../../../generals/Interfaces";
import FieldType = Generals.FieldType;
import EntityFieldName = Generals.FieldName;
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import FieldName = Generals.FieldName;


export class EntitiesValidator {
    readonly buffer: IInterfacesBuffer
    readonly entitiesGroup: AmocrmEntityGroup

    constructor(buffer: IInterfacesBuffer, entityGroup: AmocrmEntityGroup) {
        this.buffer = buffer
        this.entitiesGroup = entityGroup
    }

    formatting(amocrmEntities: Array<any>): Array<ILoadedEntity> {
        amocrmEntities = Array.isArray(amocrmEntities) ? amocrmEntities : []
        return amocrmEntities.map(i => this.formattingEntity(i))
    }

    private formattingEntity (amocrmEntity: any): ILoadedEntity {
        return {
            amocrmEntityId: EntitiesValidator.fetchEntityId(amocrmEntity),
            values: this.fetchTableValues(amocrmEntity),
            fieldsValues: EntitiesValidator.fetchFieldsValues(amocrmEntity),
            otherFieldsValues: this.fetchOtherFieldsValues(amocrmEntity),
            links: this.formattingLinks(amocrmEntity)
        }
    }

    private static fetchEntityId(amocrmEntity: any): number {
        return Number.parseInt(amocrmEntity.id)
    }

    private static fetchFieldsValues(amocrmEntity: any): IFieldsValues {
        return {
            pragmaEntityId: 0,
            date_create: EntitiesValidator.fetchDateCreate(amocrmEntity),
            date_update: EntitiesValidator.fetchDateUpdate(amocrmEntity),
            price: EntitiesValidator.fetchPrice(amocrmEntity),
            title: EntitiesValidator.fetchTitle(amocrmEntity)
        }
    }

    private static fetchTitle(amocrmEntity: any): ILoadedValue {
        return {
            pragmaFieldId: 0,
            pragmaFieldName: EntityFieldName.title,
            pragmaFieldType: FieldType.string,
            value: EntitiesValidator.formattingValue(amocrmEntity.name, FieldType.string)
        }
    }

    private static fetchPrice(amocrmEntity: any): ILoadedValue {
        return {
            pragmaFieldId: 0,
            pragmaFieldName: EntityFieldName.price,
            pragmaFieldType: FieldType.float,
            value: EntitiesValidator.formattingValue(amocrmEntity.price, FieldType.float)
        }
    }

    private static fetchDateCreate(amocrmEntity: any): ILoadedValue {
        return {
            pragmaFieldId: 0,
            pragmaFieldName: EntityFieldName.date_create,
            pragmaFieldType: FieldType.date,
            value: EntitiesValidator.formattingValue(amocrmEntity.created_at, FieldType.date)
        }
    }

    private static fetchDateUpdate(amocrmEntity: any): ILoadedValue {
        return {
            pragmaFieldId: 0,
            pragmaFieldName: EntityFieldName.date_update,
            pragmaFieldType: FieldType.date,
            value: EntitiesValidator.formattingValue(amocrmEntity.updated_at, FieldType.date)
        }
    }

    private static formattingValue(value: any, fieldType: FieldType): number|string|Date {
        switch (fieldType) {
            case FieldType.float:
                return Func.asFloatForDB(value)
            case FieldType.string:
                return Func.asStringForDB(value)
            case FieldType.date:
                const timeSec = Number.parseInt(value)
                return new Date(timeSec * 1000)
            case FieldType.enums:
                return Number.parseInt(value)
            default:
                return ''
        }
    }

    private fetchOtherFieldsValues(amocrmEntity: any): IOtherFieldsValues {
        return {
            pragmaEntityId: 0,
            pipeline: this.fetchPipelineValue(amocrmEntity),
            status: this.fetchStatusValue(amocrmEntity),
            user: this.fetchResponsibleUserValue(amocrmEntity),
            date_update: EntitiesValidator.fetchDateUpdate(amocrmEntity)
        }
    }

    private fetchResponsibleUserValue(amocrmEntity: any): ILoadedValue {
        return {
            pragmaEntityId: 0,
            pragmaFieldId: 0,
            pragmaFieldName: FieldName.responsible_user_id,
            pragmaFieldType: FieldType.user_id,
            value: this.buffer.users.findPragmaId(amocrmEntity.responsible_user_id)
        }
    }

    private fetchStatusValue(amocrmEntity: any): ILoadedValue {
        return {
            pragmaEntityId: 0,
            pragmaFieldId: 0,
            pragmaFieldName: FieldName.status_id,
            pragmaFieldType: FieldType.status_id,
            value: this.buffer.statuses.findPragmaId(amocrmEntity.status_id)
        }
    }

    private fetchPipelineValue(amocrmEntity: any): ILoadedValue {
        return {
            pragmaEntityId: 0,
            pragmaFieldId: 0,
            pragmaFieldName: FieldName.pipeline_id,
            pragmaFieldType: FieldType.pipeline_id,
            value: this.buffer.pipelines.findPragmaId(amocrmEntity.pipeline_id)
        }
    }

    private fetchTableValues(amocrmEntity: any): Array<ILoadedValue> {
        const cfValues = EntitiesValidator.fetchCustomFieldsValues(amocrmEntity)
        return this.formattingCfValues(cfValues)
    }

    private static fetchCustomFieldsValues(amocrmEntity: any): Array<any> {
        const entity = typeof amocrmEntity === 'object' ? amocrmEntity : {}
        const values = entity.custom_fields_values
        return Array.isArray(values) ? values : []
    }

    private formattingCfValues(cfValues: Array<any>): Array<ILoadedValue> {
        return cfValues.map(i => this.formattingCfVal(i)).filter(i => i && i.pragmaFieldId)
    }

    private formattingCfVal(cfVal: any): ILoadedValue|null {
        const pragmaFieldId = this.findPragmaFieldId(cfVal)
        const pragmaFieldType: FieldType = EntitiesValidator.getPragmaFieldType(cfVal)

        if(!pragmaFieldId)
            return null

        const amocrmValue = EntitiesValidator.fetchAmocrmValue(pragmaFieldType, cfVal)
        const pragmaValue = pragmaFieldType === FieldType.enums ? this.buffer.enums.findPragmaId(amocrmValue) : amocrmValue

        if(!pragmaValue)
            return null
        return {
            pragmaFieldId: pragmaFieldId,
            pragmaFieldType: pragmaFieldType,
            value: pragmaValue
        }
    }

    private findPragmaFieldId(cfVal: any): number|null {
        const amocrmFieldId = EntitiesValidator.fetchAmocrmFieldId(cfVal)
        if(!amocrmFieldId) return null
        return this.buffer.fields.findPragmaId(amocrmFieldId)
    }

    private static fetchAmocrmFieldId(cfValue: any): number {
        return Number.parseInt(cfValue.field_id)
    }

    private static getPragmaFieldType(cfVal: any): FieldType {
        const amocrmType = cfVal.field_type
        switch (amocrmType) {
            case 'radiobutton':
            case 'select':
                return FieldType.enums;
            case 'multiselect':
                return FieldType.multienums;
            case 'date_time':
            case 'date':
            case 'birthday':
                return FieldType.date;
            case 'text':
            case 'textarea':
            case 'url':
                return FieldType.string;
            case 'numeric':
                return FieldType.float;
            default:
                return FieldType.unknown
        }
    }

    private static fetchAmocrmValue(pragmaFieldType: FieldType, cfVal: any): any {
        if(pragmaFieldType === FieldType.multienums || pragmaFieldType === FieldType.unknown)
            return 0

        const values = Array.isArray(cfVal.values) ? cfVal.values : []
        const valueObj = typeof values[0] === 'object' ? values[0] : {}
        const value = valueObj.value ? valueObj.value : ''
        const enum_id = valueObj.enum_id ? valueObj.enum_id : 0

        if(pragmaFieldType === FieldType.enums && enum_id)
            return Number.parseInt(enum_id)
        return value
    }

    private formattingLinks(amoEntity: any): IAmoEntityLinks {
        const mainId = EntitiesValidator.createId(amoEntity.id, this.entitiesGroup)

        const link = EntitiesValidator.fetchLinks(amoEntity)

        const contacts = link.contacts.map(e => EntitiesValidator.createId(e.id, AmocrmEntityGroup.contacts))
        const companies = link.companies.map(e => EntitiesValidator.createId(e.id, AmocrmEntityGroup.companies))
        const leads = link.leads.map(e => EntitiesValidator.createId(e.id, AmocrmEntityGroup.leads))
        return {
            mainId,
            links: [].concat(contacts, companies, leads)
        }
    }

    private static createId(id: any, type: any): IAmoEntityId {
        return {id: Number.parseInt(id), type}
    }

    private static fetchLinks(amoEntity: any): any {
        amoEntity = typeof amoEntity === 'object' ? amoEntity : {}
        const embedded = typeof amoEntity._embedded === 'object' ? amoEntity._embedded : {}
        return {
            contacts: Array.isArray(embedded.contacts) ? embedded.contacts : [],
            companies: Array.isArray(embedded.companies) ? embedded.companies : [],
            leads: Array.isArray(embedded.leads) ? embedded.leads : [],
        }
    }
}