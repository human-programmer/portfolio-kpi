import {testPriceCalc} from "./target/LeadsPriceCalc.test";
import {testConversionCalc} from "./target/ConversionCalc.test";

export async function testDecorators(): Promise<void> {
    describe('Decorators', () => {
        testPriceCalc()
        testConversionCalc()
    })
}