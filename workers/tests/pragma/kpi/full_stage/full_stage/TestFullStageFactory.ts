import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IFullStage = IEvents.IFullStage;
import IAccStage = IEvents.IAccStage;
import IValuesTree = IEvents.IValuesTree;
import {TestAccStage} from "../acc_stage/TestAccStageFactory";
import {TestValuesTreeFactory} from "../values_tree/TestValuesTreeFactory";

export class TestFullStageFactory {
    static emptyFullStage(acc_stage?: IAccStage, values_tree?: IValuesTree): IFullStage {
        acc_stage = acc_stage || new TestAccStage([], 0)
        values_tree = values_tree || TestValuesTreeFactory.emptyValuesTree()
        return {acc_stage, values_tree}
    }
}