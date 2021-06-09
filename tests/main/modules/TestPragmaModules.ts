import {MainModule, MainModules} from "../../../crm_systems/main/components/modules/Modules";

MainModules

export class TestPragmaModules extends MainModules{
    private testModulesCodes: Array<string>

    constructor() {
        super();
        this.testModulesCodes = []
    }

    async getTestModule (testCode: string, freePeriodDays: number = null): Promise<MainModule> {
        await this.deleteTestModule(testCode)
        this.testModulesCodes.push(testCode)
        await TestPragmaModules.InsertTestModule(testCode, freePeriodDays)
        const model = await TestPragmaModules.queryTestPragmaModuleModel(testCode)
        return new MainModule(model)
    }

    private static async InsertTestModule(testCode: string, freePeriodDays: number = null): Promise<void> {
        const schema = MainModules.modulesSchema
        const sql = `INSERT INTO ${schema} (code, free_period_days)
                    VALUES ('${testCode}', ${freePeriodDays})`;
        await MainModules.query(sql)
    }

    private static async queryTestPragmaModuleModel(testCode: string): Promise<any> {
        const schema = TestPragmaModules.modulesSchema
        const sql = `SELECT
                        ${schema}.free_period_days AS freePeriodDays,
                        ${schema}.code AS code,
                        ${schema}.id AS pragmaModuleId
                    FROM ${schema} 
                    WHERE ${schema}.code = '${testCode}'`
        const result = await TestPragmaModules.query(sql)
        return result[0]
    }

    async deleteTestModule(code: string): Promise<void> {
        const schema = MainModules.modulesSchema
        const sql = `DELETE FROM ${schema} WHERE ${schema}.code = '${code}'`
        await MainModules.query(sql)
    }

    async clearTestModules(): Promise<void> {
        const promises = this.testModulesCodes.map(code => this.deleteTestModule(code))
        this.testModulesCodes = []
        await Promise.all(promises)
    }
}