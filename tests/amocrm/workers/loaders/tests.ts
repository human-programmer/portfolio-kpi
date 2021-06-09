import {testSetsUsers} from "./loaders/testUsers";
import {testSetsPipelines} from "./loaders/testPipelines";
import {testCustomFieldsWithDataSets} from "./loaders/testCustomFields";
import {testEntitiesDataSets} from "./loaders/testEntities";
import {testLoadersByPragmadev} from "./by_entity/tests";

export async function testLoadTestDataSets(): Promise<void> {
    await testSetsUsers()
    await testSetsPipelines()
    await testCustomFieldsWithDataSets()
    await testEntitiesDataSets()
    // await testLoadersByPragmadev()
}