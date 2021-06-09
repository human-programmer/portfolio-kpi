import {IMain} from "../../interfaces/MainInterface";
import IAccount = IMain.IAccount;
import IAccounts = IMain.IAccounts;
import {AccountsSchema} from "./AccountsSchema";
import IMainAccountStruct = IMain.IMainAccountStruct;

export class MainAccount implements IAccount {
    private readonly pragmaAccounts: IAccounts

    readonly dateCreate: Date;
    readonly pragmaAccountId: number;
    readonly timeCreateSeconds: number;
    readonly crmName: string;

    constructor(accounts: IAccounts, model: any) {
        this.pragmaAccounts = accounts

        this.dateCreate = model.dateCreate
        this.crmName = model.crmName
        this.timeCreateSeconds = Math.ceil(this.dateCreate.getTime()) / 1000
        this.pragmaAccountId = Number.parseInt(model.pragmaAccountId)
    }

    get publicModel(): IMainAccountStruct {
        return {
            pragma_account_id: this.pragmaAccountId,
            pragma_time_create: this.timeCreateSeconds,
            crm_name: this.crmName
        }
    }

    saveMain(): Promise<void> {
        return this.pragmaAccounts.saveMain(this)
    }
}

export class MainAccounts extends AccountsSchema implements IAccounts {

    constructor() {
        super();
    }

    async createPragmaAccount(crmName: string): Promise<number> {
        return await this.createAccountRow(crmName)
    }

    saveMain(account: IMain.IAccount): Promise<void> {
        return new Promise<void>(res => res())
    }
}