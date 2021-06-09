import {Bitrix24AccountsModules} from "../../../crm_systems/bitrix24/components/accounts_modules/AccountsModules";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccountModule = Bitrix24.IAccountModule;
import IModules = Bitrix24.IModules;
import IAccounts = Bitrix24.IAccounts;

export class TestBitrix24AccountsModules extends Bitrix24AccountsModules {
    constructor(modules?: IModules, accounts?: IAccounts) {
        super()
        this._modules = modules
        this._accounts = accounts
    }

    async createInstalledNode(): Promise<IAccountModule> {
        // @ts-ignore
        const testAccount = await this._accounts.getTestAccount('sdfsdfsdf', 'sdfsdfsdf', 'swew')
        // @ts-ignore
        const testModule = await this._modules.getTestModule('qwertt', 365, 'werwerwer', 'khjdroih', 'ertert')
        const node = await this.getTestAccountModule(testModule.pragmaModuleId, testAccount.pragmaAccountId)
        await node.bitrix24Install({
            accessToken: 'qwwerwerwer',
            refreshToken: 'qwwerwerwer',
            shutdownTimeSec: new Date().getTime() / 1000 + 500,
        })
        return node
    }

    async getTestAccountModule(moduleId: number, accountId: number): Promise<IAccountModule> {
        return this.accountModule(moduleId, accountId)
    }

    clearTestBuffer(): void {
        this.bufferTest.clearBufferForTests()
    }

    get bufferTest(){
        return this.bufferForTests
    }
}