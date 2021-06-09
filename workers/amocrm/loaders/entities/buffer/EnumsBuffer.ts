import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IEnumInterface {
    readonly amocrmEnumId: number
    readonly pragmaEnumId: number
}

export class EnumsBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IInterfaceEntityBuffer> {
        const models = await EnumsLoader.getModels(pragmaAccountId)
        return new EnumsBuffer(models)
    }

    private readonly interfaces: Array<IEnumInterface>

    constructor(interfaces: Array<IEnumInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in EnumsBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const enumInterface = this.interfaces.find(i => i.amocrmEnumId == amocrmId)
        return enumInterface ? enumInterface.pragmaEnumId : null
    }
}

class EnumsLoader extends CRMDB{
    static async getModels(pragmaAccountId: number): Promise<Array<IEnumInterface>> {
        const models = await EnumsLoader.getAll(pragmaAccountId)
        return models.map(i => {
            return {
                amocrmEnumId: Number.parseInt(i.amocrmEnumId),
                pragmaEnumId: Number.parseInt(i.pragmaEnumId),
            }
        })
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const amocrm = super.amocrmEnumsSchema
        const sql = `SELECT
                        amocrm_id as amocrmEnumId,
                        pragma_id as pragmaEnumId
                    FROM ${amocrm}
                    WHERE ${amocrm}.pragma_account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}