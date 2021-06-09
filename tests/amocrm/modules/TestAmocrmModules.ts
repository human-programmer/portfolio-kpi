import {AmocrmModule, AmocrmModules} from "../../../crm_systems/amocrm/components/modules/AmocrmModules";
import {CRMDB} from "../../../generals/data_base/CRMDB";


export class TestAmocrmModule extends AmocrmModule {

}

export class TestAmocrmModules extends AmocrmModules {

    readonly testModules: Array<number> = []

    constructor() {
        super();
    }

    async createTestDefaultModule(): Promise<TestAmocrmModule> {
        const time = new Date().getTime()
        const uniqueId = Math.ceil((time << 5) * Math.random())

        const pragmaModel = await this.createTestPragma('code_' + uniqueId, 40)
        const amoInterface = await TestAmocrmModules.saveInterface(pragmaModel.pragmaModuleId, 'amoCode_' + uniqueId, 'iId_' + uniqueId, 'secret_' + time)
        const model = Object.assign(pragmaModel, amoInterface)
        return this.createTestInstance(model)
    }

    async createTestModule(code: string, freePeriod: number|null, amocrmCode: string, integrationId: string, secretKey: string): Promise<TestAmocrmModule> {
        const pragmaModel = await this.createTestPragma(code, freePeriod)
        const amoInterface = await TestAmocrmModules.saveInterface(pragmaModel.pragmaModuleId, amocrmCode, integrationId, secretKey)
        const model = Object.assign(pragmaModel, amoInterface)
        return this.createTestInstance(model)
    }

    private createTestInstance (model: any): TestAmocrmModule {
        const module = new TestAmocrmModule(model)
        this.buffer.buffer.push(module)
        return module
    }

    private async createTestPragma(code: string, freePeriodDays: number|null): Promise<any> {
        const modules = CRMDB.modulesSchema
        const sql = `INSERT INTO ${modules} (code, free_period_days)
                    VALUES(?, ?)`
        const answer = await CRMDB.query(sql, [code, freePeriodDays])
        this.testModules.push(answer['insertId'])
        return {
            pragmaModuleId: answer['insertId'],
            code,
            freePeriodDays
        }
    }

    private static async saveInterface(pragmaModuleId: number, amocrmCode: string, integrationId: string, secretKey: string): Promise<any> {
        const modules = CRMDB.amocrmModulesSchema
        const sql = `INSERT INTO ${modules} (pragma_id, code, integration_id, secret_key)
                    VALUES (?, ?, ?, ?)`
        await CRMDB.query(sql, [pragmaModuleId, amocrmCode, integrationId, secretKey])
        return {
            amocrmCode,
            amocrmIntegrationId: integrationId,
            amocrmSecretKey: secretKey,
        }
    }

    async clearTestAll(): Promise<void> {
        this.clearTestBuffer()
        await this.clearTestModules()
    }

    clearTestBuffer(): void {
        const size = this.buffer.size
        for (let i = 0; i < size; i++)
            this.buffer.buffer.pop()
    }

    async clearTestModules(): Promise<void> {
        const condition = this.testModules.map(id => 'id = ' + id).join(' OR ')
        if(!condition) return;
        const modules = CRMDB.modulesSchema
        const sql = `DELETE FROM ${modules} WHERE ${condition}`
        await CRMDB.query(sql)
    }
}