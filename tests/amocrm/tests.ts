import {Configs} from "../../generals/Configs";
Configs.setIsMainThread(true)

import {testAmocrmAccounts} from "./accounts/tests";
import {testAmocrmModules} from "./modules/tests";
import {testAmocrmAccountsModules} from "./accounts_modules/tests";
import {testAmocrmRequest} from "./gateway/testAmocrmRequest";
import {testAmocrmRequestStack} from "./gateway/testAmocrmRequestStack";
import {testAmocrmGateway} from "./gateway/testAmocrmGateway";
import {testAmocrmInstall} from "./gateway/testAmocrmInstall";
import {testAmocrmAccountsHandler} from "./path_handlers/accounts/testAmocrmAccountsHandler";
import {testAmocrmNodesHandler} from "./path_handlers/accounts_modules/testAmocrmNodesHandler";
import {testAmocrmInstallHandler} from "./path_handlers/install/testAmocrmInstallHandler";
import {testAmocrmRouter} from "./path_handlers/RouterTest";
import {testAmocrmWorker} from "./worker/tests";
import {testLoaders} from "./workers/tests";


export async function testAmocrm(): Promise<void> {
    await testAmocrmAccounts()
    await testAmocrmModules()
    await testAmocrmAccountsModules()
    await testAmocrmRequest()
    await testAmocrmRequestStack()
    await testAmocrmGateway()
    await testAmocrmRouter()
    // await testAmocrmInstall() //для каждого теста нужен уникаьный код из Amocrm
    await testAmocrmAccountsHandler()
    await testAmocrmNodesHandler()
    await testAmocrmInstallHandler()
    await testAmocrmWorker() //слишком долго стартуют
    await testLoaders()
}