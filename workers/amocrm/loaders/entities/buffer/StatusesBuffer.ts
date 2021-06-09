import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IStatusInterface {
    readonly amocrmStatusId: number
    readonly pragmaStatusId: number
}

export class StatusesBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IInterfaceEntityBuffer> {
        const models = await StatusLoader.getModels(pragmaAccountId)
        return new StatusesBuffer(models)
    }

    private readonly interfaces: Array<IStatusInterface>

    constructor(interfaces: Array<IStatusInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in StatusBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const enumInterface = this.interfaces.find(i => i.amocrmStatusId == amocrmId)
        return enumInterface ? enumInterface.pragmaStatusId : null
    }
}

class StatusLoader extends CRMDB{
    static async getModels(pragmaAccountId: number): Promise<Array<IStatusInterface>> {
        const models = await StatusLoader.getAll(pragmaAccountId)
        return models.map(i => {
            return {
                amocrmStatusId: Number.parseInt(i.amocrmStatusId),
                pragmaStatusId: Number.parseInt(i.pragmaStatusId),
            }
        })
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const amocrm = super.amocrmStatusesSchema
        const link = super.statusesToPipelineSchema
        const pipelines = super.pipelinesSchema
        const sql = `SELECT
                        amocrm_id as amocrmStatusId,
                        pragma_id as pragmaStatusId
                    FROM ${amocrm}
                        INNER JOIN ${link} ON ${link}.status_id = ${amocrm}.pragma_id
                        INNER JOIN ${pipelines} ON ${pipelines}.id = ${link}.pipeline_id
                    WHERE ${pipelines}.account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}