import {testLogJSON} from "./LogJSON/testLogJSON";
import {testConductor} from "./Conductor/testConductor";
import {testConfigs} from "./Configs/ConfigsTest";

export async function testGenerals(): Promise<void> {
    await testLogJSON()
    await testConfigs()
    // await testConductor() //Долго запускаются воркеры, вылетает ошибка из-за этого
}