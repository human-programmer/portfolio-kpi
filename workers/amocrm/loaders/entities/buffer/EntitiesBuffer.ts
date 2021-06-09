import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IEntityInterface {
    readonly amocrmEntityId: number
    readonly pragmaEntityId: number
}

export interface IEntitiesBuffers {
    readonly contacts: IInterfaceEntityBuffer
    readonly companies: IInterfaceEntityBuffer
    readonly leads: IInterfaceEntityBuffer
}

export class EntitiesBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IEntitiesBuffers> {
        const groups = await EntitiesLoader.getModelsByTypes(pragmaAccountId)
        return {
            contacts: new EntitiesBuffer(groups.contacts),
            companies: new EntitiesBuffer(groups.companies),
            leads: new EntitiesBuffer(groups.leads),
        }
    }

    private readonly interfaces: Array<IEntityInterface>

    constructor(interfaces: Array<IEntityInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in EntitiesBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const enumInterface = this.interfaces.find(i => i.amocrmEntityId == amocrmId)
        return enumInterface ? enumInterface.pragmaEntityId : null
    }
}

class EntitiesLoader extends CRMDB{
    static async getModelsByTypes(pragmaAccountId: number): Promise<any> {
        const models = await EntitiesLoader.getAll(pragmaAccountId)
        const groups = EntitiesLoader.groupModels(models)
        return EntitiesLoader.createInterfacesByGroups(groups)
    }

    private static createInterfacesByGroups(groups: any): any {
        const keys = Object.keys(groups)
        const arrs = Object.values(groups)
        const result = {}
        keys.forEach((key, index) => {
            // @ts-ignore
            result[key] = arrs[index].map(i => EntitiesLoader.createInterface(i))
        })
        return result
    }

    private static createInterface(model: any): IEntityInterface {
        return {
            amocrmEntityId: Number.parseInt(model.amocrmEntityId),
            pragmaEntityId: Number.parseInt(model.pragmaEntityId),
        }
    }

    private static groupModels(models: Array<any>): any {
        return {
            contacts: models.filter(i => i.amocrmEntityType === 'contacts'),
            companies: models.filter(i => i.amocrmEntityType === 'companies'),
            leads: models.filter(i => i.amocrmEntityType === 'leads'),
        }
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const amocrm = super.amocrmEntitiesSchema
        const sql = `SELECT
                        entity_id as amocrmEntityId,
                        pragma_entity_id as pragmaEntityId,
                        type as amocrmEntityType
                    FROM ${amocrm}
                    WHERE ${amocrm}.pragma_account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}