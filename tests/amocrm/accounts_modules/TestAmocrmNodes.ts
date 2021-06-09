import {
    AmocrmAccountModule,
    AmocrmAccountsModules, AmocrmNodesBuffer
} from "../../../crm_systems/amocrm/components/accounts_modules/AmocrmAccountsModules";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IModule = Amocrm.IModule;
import IAccount = Amocrm.IAccount;
import {TestAmocrmAccounts} from "../accounts/TestAmocrmAccounts";
import {TestAmocrmModules} from "../modules/TestAmocrmModules";
import IAccountModule = Amocrm.IAccountModule;
import {AmocrmModules} from "../../../crm_systems/amocrm/components/modules/AmocrmModules";
import {AmocrmAccounts} from "../../../crm_systems/amocrm/components/accounts/AmocrmAccounts";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;

export class TestAmocrmNode extends AmocrmAccountModule {
    testTokensApiAnswer: {
        access_token: string
        refresh_token: string
        expires_in: string
    }
    testAccountApiAnswer: {
        country: string
        created_at: number
        created_by: number
        currency: string
        currency_symbol: string
        id: number
        is_technical_account: true
        name: string
        subdomain: string
    }

    constructor(module: IModule, account: IAccount, model: any) {
        super(module, account, model);
    }

    async restQuery(request: IRequestOptions): Promise<any> {
        await new Promise(resolve => setTimeout(resolve, 100))
        return await this.generateTestAnswer(request)
    }

    protected async generateTestAnswer (request: IRequestOptions): Promise<any> {
        let answer = null
        switch (request.uri) {
            case '/oauth2/access_token':
                this.setTokensApiAnswer()
                answer = this.testTokensApiAnswer
                break
            case '/api/v4/account':
                this.setAccountAnswer()
                answer = this.testAccountApiAnswer
                break
            case '/api/v4/widgets/' + this.module.amocrmCode:
                const token = await this.getTestInactiveToken()
                answer = {settings: {api_key: token}}
                break
            default:
                throw 'Unknown test request uri'
        }

        return {
            info: {statusCode: 200, statusMessage: 'success'},
            body: JSON.stringify(answer)
        }
    }

    private async getTestInactiveToken(): Promise<string> {
        // @ts-ignore
        const apiKeys = await this.getApiKeys()
        const apiKey = apiKeys.find(i => !i.isActive)
        return apiKey ? apiKey.token : ''
    }

    protected setTokensApiAnswer(): void {
        const time = new Date().getTime()
        const uniqueId = Math.ceil((time << 5) * Math.random())
        const unique = '' + this.module.pragmaModuleId + '.' + this.account.pragmaAccountId + '.' + uniqueId

        this.testTokensApiAnswer = {
            access_token: 'access.' + unique,
            refresh_token: 'refresh.' + unique,
            expires_in: '86400',
        }
    }

    protected setAccountAnswer(): void {
        const time = new Date().getTime()
        const uniqueId = Math.ceil((time << 5) * Math.random())

        this.testAccountApiAnswer = {
            country: 'COUNTR',
            created_at: uniqueId + 1,
            created_by: uniqueId - 1,
            currency: ('CURRENCY'),
            currency_symbol: 'R',
            id: uniqueId,
            is_technical_account: true,
            name: 'name.' + uniqueId,
            subdomain: 'subdomain.' + uniqueId,
        }
    }
}

export class TestAmocrmNodes extends AmocrmAccountsModules {
    private testModules: TestAmocrmModules
    private testAccounts: TestAmocrmAccounts

    constructor(testModules: TestAmocrmModules, testAccounts: TestAmocrmAccounts) {
        super();
        this.testModules = testModules
        this.testAccounts = testAccounts
    }

    async createTestNode(module: IModule = null, account: IAccount = null, model: any = null): Promise<TestAmocrmNode> {
        module = module || await this.testModules.createTestDefaultModule()
        account = account || await this.testAccounts.createTestDefaultAccount()
        return this.createTestInstance(module, account, model)
    }

    private createTestInstance(module: IModule, account: IAccount, model: any): TestAmocrmNode {
        return new TestAmocrmNode(module, account, model)
    }

    clearTestBuffer(): void {
        const size = this.buffer.size
        for (let i = 0; i < size; i++)
            this.buffer.buffer.pop()
    }

    async clearTest(): Promise<void> {
        this.clearTestBuffer()
        await Promise.all([
            this.testModules.clearTestAll(),
            this.testAccounts.clearAllTests()
        ])
    }

    get nodesBuffer(): AmocrmNodesBuffer {
        return this.buffer
    }



    protected get AmocrmModules(): AmocrmModules {
        return this.testModules
    }

    protected get AmocrmAccounts(): AmocrmAccounts {
        return this.testAccounts
    }
}