import {Generals} from "../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import getEntityGroups = Generals.getEntityGroups;
import {Func} from "../../../../generals/Func";
import {IKPI} from "../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import getMetricNames = IKPI.getMetricNames;

export class TestKpiFactory {
    static randomEntityGroup(): EntityGroup {
        const min = Math.min(...getEntityGroups())
        const max = Math.max(...getEntityGroups())
        return Func.randomOnIntervalForTests(min, max)
    }

    static randomMetricName(): MetricName {
        const index = Func.randomNumber(getMetricNames().length - 1)
        return getMetricNames()[index]
    }
}