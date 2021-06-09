import {CRMDB} from "../../../../generals/data_base/CRMDB";

export class AccountsSchema extends CRMDB {
    protected async createAccountRow (crmName: string) : Promise<number> {
        const schema = CRMDB.accountSchema
        const crmNames = CRMDB.crmNameSchema
        const sql = `INSERT INTO ${schema} (test, crm) VALUES (0, (SELECT ${crmNames}.id FROM ${crmNames} WHERE ${crmNames}.name = '${crmName}'))`
        const result = await CRMDB.query(sql)
        return result['insertId']
    }
}