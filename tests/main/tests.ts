import {testMainAccountsModules} from "./accounts_modules/mainAccountsModulesTest";
import {testMainAccounts} from "./accounts/testMainAccounts";
import {testTaskManager} from "./task_manager/tests";
import {Configs} from "../../generals/Configs";

Configs.setIsMainThread(true)


export async function testMain(): Promise<void> {
    await testMainAccounts()
    await testMainAccountsModules()
    await testTaskManager()
}