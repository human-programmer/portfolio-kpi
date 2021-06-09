import {IMain} from "../../main/interfaces/MainInterface";
import {IServer} from "../../../server/intrfaces";

export namespace Pragma {
    import IUsers = IMain.IUsers;
    import IUser = IMain.IUser;

    export interface IAccountsRequest extends IMain.IAccountsRequest {
    }

    export interface IAccount extends IMain.IAccount {
    }

    export interface IAccounts extends IMain.IAccounts {
        getAccount(pragmaAccountId: number): Promise<IAccount>
    }

    export interface IPragmaUser extends IUser {

    }

    export interface IPragmaUsers extends IUsers {

    }
}