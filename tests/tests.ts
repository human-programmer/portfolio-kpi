import {testMain} from "./main/tests";
import {testAmocrm} from "./amocrm/tests";
// import {testBitrix24} from "./bitrix24/tests";
import {testGenerals} from "./generals/tests";
import {testPragma} from "./pragma/tests";
import {testDocxTempleter} from "../modules/docx_templeter/tests/amocrm/tests";

export async function testAll(): Promise<void> {
    await testGenerals()
    await testMain()
    await testPragma()
    await testAmocrm()
    // await testBitrix24()
    await testDocxTempleter()
}