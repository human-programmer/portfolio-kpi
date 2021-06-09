// import {testAmocrmRestGateway} from "./gateway/testAmocrmRestGateway";
// import {testUsersFabric} from "./users/testUsersFabric";
// import {testUsersLoader} from "./users/testUsersLoader";
// import {testStatusesFabric} from "./pipelines/testStatusesFabric";
// import {testPipelinesFabric} from "./pipelines/testPipelinesFabric";
// import {testPipelinesLoader} from "./pipelines/testPipelinesLoader";
// import {testCustomFieldsFabric} from "./customFields/testCustomFieldsFabric";
// import {testCustomFieldsLoader} from "./customFields/testCustomFieldsLoader";
// import {testEnumsFabric} from "./customFields/testEnumsFabric";
// import {testEntities} from "./entities/tests";

import {Configs} from "../../../generals/Configs";
Configs.setIsMainThread(true)

import {testJobDealer} from "./loaders/loader_with_status/testJobDealer";
import {testPackLoadersWithStatus} from "./loaders/loader_with_status/testPackLoadersWithStatus";
import {testLoadTestDataSets} from "./loaders/tests";
import {testLoaderWithStatus} from "./loaders/loader_with_status/testLoaderWithStatus";
import {testWorkersFabric} from "./workers_fabric/testWorkersFabric";
import {testAmoAccWorkers} from "./AccountWorkers/testAccountWorkers";
import {testAccountsWorkersStorage} from "./AccountWorkers/testAccountWorkersStorage";
import {testRequestsConductor} from "./handlers/testRequestsConductor";
import {testAmocrmWorker} from "./worker/testWorker";


export async function testLoaders(): Promise<void> {
    // await testAmocrmRestGateway()
    // await testUsersFabric()
    // await testUsersLoader()
    // await testStatusesFabric()
    // await testPipelinesFabric()
    // await testPipelinesLoader()
    // await testCustomFieldsFabric()
    // await testEnumsFabric()
    // await testCustomFieldsLoader()
    // await testEntities()
    // то что выше повторяется в testLoadTestDataSets

    await testLoadTestDataSets()
    await testLoaderWithStatus()
    await testPackLoadersWithStatus()
    await testJobDealer()
    await testWorkersFabric()
    await testAmoAccWorkers()
    await testAccountsWorkersStorage()
    await testRequestsConductor()
    await testAmocrmWorker()
}