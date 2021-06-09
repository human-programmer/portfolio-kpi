import {Pragma} from "../../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {IKPI} from "../IKPI";
import MetricName = IKPI.MetricName;
import allMetricNames = IKPI.getMetricNames;
import EventName = IKPI.EventName;
import getCoreEvents = IKPI.getCoreEvents;
import eventDependenciesOfMetrics = IKPI.eventDependenciesOfMetrics;
import {IEvents} from "../IEvents";
import IValuesTree = IEvents.IValuesTree;

export class Metrics {

    static getCoreEventNames(): EventName[] {
        return getCoreEvents()
    }

    static metricNamesToEventNames(metricNames: MetricName[]): EventName[] {
        return [].concat(metricNames.map(name => Metrics.getDependencyEventNames(name)))
    }

    static getDependencyEventNames(metricName: MetricName): EventName[] {
        return eventDependenciesOfMetrics()[metricName] || []
    }

    static async coreMetricNamesOfAccount(account: IAccount): Promise<MetricName[]> {
        return allMetricNames()
    }

    static async getMetricNamesOfAccount(account: IAccount): Promise<MetricName[]> {
        return allMetricNames()
    }

    static async getNewMetricNamesForAccount(valuesTree: IValuesTree): Promise<MetricName[]> {
        return []
    }
}