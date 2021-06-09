import {testAliasFabric} from "./aliasFabric/AliasFabric.test";
import {testValuesFabric} from "./valuesFabric/ValuesFabric.test";
import {testGenerate} from "./generator/generate.test";

export async function testDocxTempleter(): Promise<void> {
    await testAliasFabric()
    await testValuesFabric()
    await testGenerate()
}