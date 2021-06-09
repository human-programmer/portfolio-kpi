import {testPragmaAccounts} from "./accounts/tests";
import {testPragmaAccountsHandler} from "./path_handlers/accounts/testPragmaAccountHandler";
import {testPragmaUsers} from "./users/tests";
import {testPragmaUsersHandler} from "./path_handlers/users/testPragmaUsersHandler";
import {Configs} from "../../generals/Configs";
import {testPragmaWorker} from "./worker/tests";

Configs.setIsMainThread(true)


export async function testPragma(): Promise<void> {
    await testPragmaAccounts()
    await testPragmaAccountsHandler()
    await testPragmaUsers()
    await testPragmaUsersHandler()
    // await testPragmaWorker()//Долго запускаетя. ошбибка из-за этого
}