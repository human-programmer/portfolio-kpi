import {IInterfaceEntityBuffer} from "../Buffer";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;

export interface IUserInterface {
    readonly amocrmUserId: number
    readonly pragmaUserId: number
}

export class UsersBuffer implements IInterfaceEntityBuffer{
    static async create (pragmaAccountId: number): Promise<IInterfaceEntityBuffer> {
        const models = await UserLoader.getModels(pragmaAccountId)
        return new UsersBuffer(models)
    }

    private readonly interfaces: Array<IUserInterface>

    constructor(interfaces: Array<IUserInterface>) {
        this.interfaces = interfaces
    }

    addInterface(inter: any): void {
        throw Errors.internalError('addInterface in UserBuffer is not implemented')
    }

    findPragmaId(amocrmId: number): number | null {
        const enumInterface = this.interfaces.find(i => i.amocrmUserId == amocrmId)
        return enumInterface ? enumInterface.pragmaUserId : null
    }
}

class UserLoader extends CRMDB{
    static async getModels(pragmaAccountId: number): Promise<Array<IUserInterface>> {
        const models = await UserLoader.getAll(pragmaAccountId)
        return models.map(i => {
            return {
                amocrmUserId: Number.parseInt(i.amocrmUserId),
                pragmaUserId: Number.parseInt(i.pragmaUserId),
            }
        })
    }

    private static async getAll(pragmaAccountId: number): Promise<Array<any>> {
        const amocrm = super.amocrmUsersSchema
        const link = super.usersToAccountsSchema
        const sql = `SELECT
                        amo_id as amocrmUserId,
                        pragma_id as pragmaUserId
                    FROM ${amocrm}
                        INNER JOIN ${link} ON ${link}.user_id = ${amocrm}.pragma_id
                    WHERE ${link}.account_id = ${pragmaAccountId}`
        return await super.query(sql)
    }
}