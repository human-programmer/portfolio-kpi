import {bitrix24AccountsTest} from "./accounts/tests";
import {testBitrix24Modules} from "./modules/tests";
import {bitrix24AccountsModulesTests} from "./accounts_modules/tests";
import {testBitrix24AccountsHandler} from "./path_handlers/accounts/tests";
import {testBitrix24AccountsModulesHandler} from "./path_handlers/accounts_modules/tests";
import {testBitrix24InstallHandlerPath} from "./path_handlers/install/tests";
import {testBitrix24RestApiGateway} from "./rest_api/tests";
import {testBitrix24QueryHandler} from "./path_handlers/request/tests";
import {testBitrix24RequestWorker} from "./workers/tests";
import {testBitrix24Router} from "./path_handlers/RouterTest";

export async function testBitrix24(): Promise<void> {
    await bitrix24AccountsTest()
    await testBitrix24Modules()
    await bitrix24AccountsModulesTests()
    await testBitrix24AccountsHandler()
    await testBitrix24AccountsModulesHandler()
    await testBitrix24InstallHandlerPath()
    await testBitrix24RestApiGateway()
    await testBitrix24QueryHandler()
    await testBitrix24RequestWorker()
    await testBitrix24Router()
}