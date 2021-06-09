import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;

export class AccountsSchema extends CRMDB{
    async getBitrix24AccountRow(pragmaAccountId: number): Promise<any>{
        const condition = `${CRMDB.accountSchema}.id = ${pragmaAccountId}`
        const sql = AccountsSchema.sql(condition)
        const row = await CRMDB.query(sql)
        return row[0] || null
    }

    async getBitrix24AccountRowByMemberId(memberId: string): Promise<any>{
        const condition = `${CRMDB.bitrix24AccountSchema}.member_id = '${memberId}'`
        const sql = AccountsSchema.sql(condition)
        const result = await CRMDB.query(sql)
        return result[0] || null
    }

    private static sql (condition: string): string {
        const bitrix24 = CRMDB.bitrix24AccountSchema
        const pragma = CRMDB.accountSchema
        const crmNamesSchema = CRMDB.crmNameSchema
        return `SELECT 
                    ${pragma}.id AS pragmaAccountId,
                    ${pragma}.date_create AS dateCreate,
                    ${pragma}.test AS pragmaTest,
                    ${crmNamesSchema}.name AS crmName,
                    ${bitrix24}.member_id AS bitrix24MemberId,
                    ${bitrix24}.referer AS bitrix24Referer,
                    ${bitrix24}.lang AS bitrix24Lang
                FROM ${bitrix24}
                    INNER JOIN ${pragma} ON ${bitrix24}.pragma_account_id = ${pragma}.id
                    INNER JOIN ${crmNamesSchema} ON ${crmNamesSchema}.id = ${pragma}.crm
                WHERE ${condition}`
    }

    async saveAccountRow (account: IAccount): Promise<any>{
        const schema = CRMDB.bitrix24AccountSchema
        const sql = `UPDATE ${schema} 
                    SET ${schema}.referer = ?,
                        ${schema}.lang = ?
                    WHERE ${schema}.pragma_account_id = ?`
        const model = [account.bitrix24Referer, account.bitrix24Lang, account.pragmaAccountId]
        return CRMDB.query(sql, model)
    }

    async saveMemberId (pragmaAccountId: number, memberId: string) : Promise<void> {
        const oldInterface = await this.getBitrix24AccountRowByMemberId(memberId)
        if(oldInterface)
            throw 'Tis account already exists ("' + memberId + '")'
        await AccountsSchema.insertInterface(pragmaAccountId, memberId)
    }

    private static async insertInterface(pragmaAccountId: number, memberId: string): Promise<any> {
        const schema = CRMDB.bitrix24AccountSchema
        const sql = `INSERT INTO ${schema} (pragma_account_id, member_id)
                    VALUES (?, ?)`

        const model = [pragmaAccountId, memberId]
        await CRMDB.query(sql, model)
    }
}

export default AccountsSchema