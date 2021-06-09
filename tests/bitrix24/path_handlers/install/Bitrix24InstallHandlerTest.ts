import {Bitrix24InstallHandler} from "../../../../crm_systems/bitrix24/path_handlers/install/Bitrix24InstallHandler";
import {Bitrix24} from "../../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IModules = Bitrix24.IModules;
import IAccounts = Bitrix24.IAccounts;

export class Bitrix24InstallHandlerTest extends Bitrix24InstallHandler {
    constructor(props) {
        super(props);

    }
    static set testModules(modules: IModules){
        super._modules = modules
    }
    static set testAccounts(accounts: IAccounts){
        super._accounts = accounts
    }
}