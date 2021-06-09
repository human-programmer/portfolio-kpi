import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IPipelineInterface {
    readonly amocrmPipelineId: number
    readonly pragmaPipelineId: number
}

export class PipelinesBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IInterfaceEntityBuffer> {
        const models = await PipelinesLoader.getModels(pragmaAccountId)
        return new PipelinesBuffer(models)
    }

    private readonly interfaces: Array<IPipelineInterface>

    constructor(interfaces: Array<IPipelineInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in PipelinesBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const enumInterface = this.interfaces.find(i => i.amocrmPipelineId == amocrmId)
        return enumInterface ? enumInterface.pragmaPipelineId : null
    }
}

class PipelinesLoader extends CRMDB{
    static async getModels(pragmaAccountId: number): Promise<Array<IPipelineInterface>> {
        const models = await PipelinesLoader.getAll(pragmaAccountId)
        return models.map(i => {
            return {
                amocrmPipelineId: Number.parseInt(i.amocrmPipelineId),
                pragmaPipelineId: Number.parseInt(i.pragmaPipelineId),
            }
        })
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const amocrm = super.amocrmPipelinesSchema
        const sql = `SELECT
                        amocrm_id as amocrmPipelineId,
                        pragma_id as pragmaPipelineId
                    FROM ${amocrm}
                    WHERE ${amocrm}.pragma_account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}