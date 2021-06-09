import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IFieldInterface {
    readonly amocrmFieldId: number
    readonly pragmaFieldId: number
    readonly pragmaFieldName?: string
    readonly amocrmFieldName?: string
}

export class FieldsBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IInterfaceEntityBuffer> {
        const models = await FieldsLoader.getModels(pragmaAccountId)
        return new FieldsBuffer(models)
    }

    private readonly interfaces: Array<IFieldInterface>

    constructor(interfaces: Array<IFieldInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in FieldsBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const field = this.interfaces.find(i => i.amocrmFieldId == amocrmId)
        return field ? field.pragmaFieldId : null
    }
}

class FieldsLoader extends CRMDB{
    static async getModels(pragmaAccountId: number): Promise<Array<IFieldInterface>> {
        const models = await FieldsLoader.getAll(pragmaAccountId)
        return models.map(i => {
            return {
                amocrmFieldId: Number.parseInt(i.amocrmFieldId),
                pragmaFieldId: Number.parseInt(i.pragmaFieldId),
            }
        })
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const pragma = super.fieldsSchema
        const amocrm = super.amocrmFieldsSchema
        const sql = `SELECT
                        field_id as amocrmFieldId,
                        pragma_field_id as pragmaFieldId
                    FROM ${pragma}
                        INNER JOIN ${amocrm} ON ${amocrm}.pragma_field_id = ${pragma}.id
                    WHERE ${pragma}.account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}