import {testEnumsBuffer} from "./buffer/testEnumsBuffer";
import {testFieldsBuffer} from "./buffer/testFieldsBuffer";
import {testPipelinesBuffer} from "./buffer/testPipelinesBuffer";
import {testStatusesBuffer} from "./buffer/testStatusesBuffer";
import {Configs} from "../../../../../../generals/Configs";
import {testUsersBuffer} from "./buffer/testUsersBufer";
import {testStringValuesFabric} from "./values/testStringValuesFabric";
import {testEnumsValuesFabric} from "./values/testEnumsValuesFabric";
import {testEntitiesFabric} from "./testEntitiesFabric";
import {testEntitiesLoader} from "./testEntitiesLoader";
import {testEntitiesLinksFabric} from "./testEntitiesLinksFabric";
import {testOtherLinksFabric} from "./testOtherLinksfabric";

Configs.setIsMainThread(true)

export async function testEntities(): Promise<void> {
    await testEnumsBuffer()
    await testFieldsBuffer()
    await testPipelinesBuffer()
    await testStatusesBuffer()
    await testUsersBuffer()
    await testStringValuesFabric()
    await testEnumsValuesFabric()
    await testEntitiesFabric()
    await testEntitiesLoader()
    await testEntitiesLinksFabric()
    await testOtherLinksFabric()
}