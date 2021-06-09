import {testCustomFieldsLoader} from "./customFields/testCustomFieldsLoader";
import {testCustomFieldsFabric} from "./customFields/testCustomFieldsFabric";
import {testEnumsFabric} from "./customFields/testEnumsFabric";
import {testEntities} from "./entities/tests";
import {testPipelinesFabric} from "./pipelines/testPipelinesFabric";
import {testPipelinesLoader} from "./pipelines/testPipelinesLoader";
import {testStatusesFabric} from "./pipelines/testStatusesFabric";
import {testUsersFabric} from "./users/testUsersFabric";
import {testUsersLoader} from "./users/testUsersLoader";

export async function testLoadersByPragmadev(): Promise<void>{
    await testCustomFieldsLoader()
    await testCustomFieldsFabric()
    await testEnumsFabric()
    await testEntities()
    await testPipelinesFabric()
    await testPipelinesLoader()
    await testStatusesFabric()
    await testUsersFabric()
    await testUsersLoader()
}