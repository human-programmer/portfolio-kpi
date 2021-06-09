import {testEntityStage} from "./full_stage/entity_stage/EntityStage.test";
import {testEntitiesStages} from "./full_stage/entitiesStage/EntitiesStages.test";
import {testAccStage} from "./full_stage/acc_stage/AccStage.test";
import {testValuesTree} from "./full_stage/values_tree/ValuesTree.test";
import {testAMetricCalcDecorator} from "./MetricCalc/decorators/AMetricCalcDecorator.test";
import {testMetricCalc} from "./MetricCalc/metric_calc/MetricCalc.test";
import {testDecorators} from "./MetricCalc/decorators/Decorator.test";

let i = 1

export async function testPragmaKPI(): Promise<void> {
    while (i--) {
        await testEntityStage()
        await testEntitiesStages()
        await testAccStage()
        await testValuesTree()
        await testAMetricCalcDecorator()
        await testDecorators()
        await testMetricCalc()
    }
}