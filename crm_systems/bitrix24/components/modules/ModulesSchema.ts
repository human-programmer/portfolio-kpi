import {CRMDB} from "../../../../generals/data_base/CRMDB";

export class ModulesSchema extends CRMDB {
    protected async getBitrix24ModuleModelByCode(code: string): Promise<any> {
        const condition = `${ModulesSchema.modulesSchema}.code = '${code}'`
        return ModulesSchema.getSingleModuleModel(condition)
    }

    protected async getBitrix24ModuleModelById(pragmaModuleId: number): Promise<any> {
        const condition = `${ModulesSchema.modulesSchema}.id = ${pragmaModuleId}`
        return ModulesSchema.getSingleModuleModel(condition)
    }

    private static async getSingleModuleModel(condition: string): Promise<any | null> {
        const sql = ModulesSchema.sql(condition)
        const answer = await ModulesSchema.query(sql)
        return answer[0]
    }

    private static sql(condition: string): string {
        const bitrix24 = ModulesSchema.bitrix24ModulesSchema
        const pragma = ModulesSchema.modulesSchema
        return `SELECT
                        ${pragma}.id AS pragmaModuleId,
                        ${pragma}.code AS code,
                        ${pragma}.free_period_days AS freePeriodDays,
                        ${bitrix24}.integration_id AS bitrix24IntegrationId,
                        ${bitrix24}.secret_key AS bitrix24SecretKey,
                        ${bitrix24}.handler_path AS bitrix24HandlerPath
                    FROM ${pragma}
                        INNER JOIN ${bitrix24} ON ${pragma}.id = ${bitrix24}.module_id
                    WHERE ${condition}`
    }
}