import {Modules} from "../../../crm_systems/bitrix24/components/modules/Modules";
import {TestPragmaModules} from "../../main/modules/TestPragmaModules";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IModule = Bitrix24.IModule;

export class TestBitrix24Modules extends Modules {
    private pragmaModules

    constructor() {
        super();
        this.pragmaModules = new TestPragmaModules()
    }
    async createTestModule (): Promise<IModule> {
        const code = '' + new Date().getTime()
        const freePeriod = 10
        const integrationId = '' + new Date().getTime()
        const secretKey = '' + new Date().getTime()
        const handlerPath = '' + new Date().getTime()


        const pragmaModule = await this.pragmaModules.getTestModule(code, freePeriod)
        await TestBitrix24Modules.insertTestModule(pragmaModule.pragmaModuleId, integrationId, secretKey, handlerPath)
        return this.getByPragmaId(pragmaModule.pragmaModuleId)
    }
    async getTestModule (code: string, freePeriod: number, integrationId: string, secretKey: string, handlerPath: string): Promise<IModule> {
        const pragmaModule = await this.pragmaModules.getTestModule(code, freePeriod)
        await TestBitrix24Modules.insertTestModule(pragmaModule.pragmaModuleId, integrationId, secretKey, handlerPath)
        return this.getByPragmaId(pragmaModule.pragmaModuleId)
    }

    private static async insertTestModule(id: number, integrationId: string, secretKey: string, handlerPath: string): Promise<void> {
        const schema = Modules.bitrix24ModulesSchema
        const sql = `INSERT INTO ${schema} (module_id, integration_id, secret_key, handler_path)
                    VALUES (${id}, '${integrationId}', '${secretKey}', '${handlerPath}')`;
        await TestBitrix24Modules.query(sql)
    }

    async clearTestModules(): Promise<void> {
        this.testedBuffer().clearBufferForTest()
        await this.pragmaModules.clearTestModules()
    }

    testedBuffer(){
        return this.getBufferForTests
    }
}