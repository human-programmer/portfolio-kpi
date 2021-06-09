import {IKPI} from "../IKPI";
import IMetric = IKPI.IMetric;
import {IEvents} from "../IEvents";
import IEventLoader = IEvents.IEventLoader;
import IAccStage = IEvents.IAccStage;
import {Func} from "../../../../generals/Func";
import {Generals} from "../../../../generals/Interfaces";
import ITimeInterval = Generals.ITimeInterval;
import EventName = IEvents.EventName;
import IEvent = IEvents.IEvent;
import IAtomValues = IKPI.IAtomValues;

export class MetricValuesLoader implements IMetricValuesLoader {
    protected readonly loader: IEventLoader
    protected readonly accStage: IAccStage
    protected readonly valuesTree: IValuesTree
    private currentValuesLoader: ValuesLoader
    private readonly newLastDay: number
    private startDay: number

    constructor() {
        this.newLastDay = ValuesLoader.truncTime(Math.trunc(new Date().getTime() / 1000))
    }


    async loadMetrics(metrics: IMetric[]): Promise<void> {
        const {load_all, load_next} = await this.sortMetricsByPriority(metrics)
        load_all.length && await this.loadNewMetrics(load_all)
        load_next.length && await this.loadNextDays(load_next)
    }

    setEventsLoader(loader: IEventLoader): void {
        // @ts-ignore
        this.loader = loader
    }

    setAccStage(accStage: IAccStage): void {
        // @ts-ignore
        this.accStage = accStage
        this.startDay = ValuesLoader.truncTime(this.accStage.start_day)
    }

    private async loadNewMetrics(metrics: IMetric[]): Promise<void> {
        const toLoad = metrics.filter(i => i.time_update < this.accStage.last_day)
        const loader = this.createValuesLoader(toLoad)
        await this.executeLoader(loader)
    }

    private async loadNextDays(metrics: IMetric[]): Promise<void> {
        const groupedMetrics = MetricValuesLoader.groupMetricsByDays(metrics)
        const valueLoaders = Object.keys(groupedMetrics).map(lastStartDay => this.createValuesLoader(groupedMetrics[lastStartDay], Number.parseInt(lastStartDay) + 86400))
        this.executeLoaders(valueLoaders)
    }

    private static groupMetricsByDays(metrics: IMetric[]): any {
        const res = {}
        metrics.forEach(i => {
            res[i.time_update] = Array.isArray(res[i.time_update]) ? res[i.time_update] : []
            res[i.time_update].push(i)
        })
        return res
    }

    private createValuesLoader(metrics: IMetric[], startDay: number|null = null, endDay: number|null = null): ValuesLoader {
        const eventNames = MetricValuesLoader.convertMetricsToEventNames(metrics)
        return new ValuesLoader(this.loader, eventNames, startDay || this.startDay, endDay || this.newLastDay)
    }

    private static convertMetricsToEventNames(metrics: IMetric[]): EventName[] {

    }

    private async executeLoaders (loaders: ValuesLoader[]): Promise<void> {
        await Promise.all(loaders.map(i => this.executeLoader(i)))
    }

    private async executeLoader(loader: ValuesLoader): Promise<void> {
        while (this.executeNextOfLoader(loader)){}
    }

    private async executeNextOfLoader(loader: ValuesLoader): Promise<boolean> {
        const events = await loader.getNext()
        const values = await this.eventsToMetrics(events)
        this.valuesTree.pushValues(values, loader.lastCurrentDay)
        return loader.isEnded
    }

    private async eventsToMetrics(events: IEvent[]): Promise<IAtomValues[]> {

    }
}

class ValuesLoader {
    private readonly loader: IEventLoader
    private readonly names: EventName[]
    private readonly startDay: number
    private readonly endDay: number
    private readonly limitDays: 10
    private currentPage: number = 0
    private _isEndedFlag: boolean = false

    constructor(loader: IEventLoader, names: EventName[], startDay: number, endDay: number) {
        this.loader = loader
        this.names = names
        this.startDay = ValuesLoader.truncTime(startDay)
        this.endDay = ValuesLoader.ceilTime(endDay)
    }

    async getNext (): Promise<IEvent[]|null> {
        if(this.isEnded) return null
        return await this.loader.loadEvents(this.names, this.nextInterval)
    }

    private get nextInterval (): ITimeInterval {
        const start = this.getNextStartDay()
        const end = this.getNextEndDay(start)
        const res = {end, start}
        this.setNextPage()
        return res
    }

    private getNextStartDay(): number {
        return this.startDay + this.currentPage * this.limitDays * 86400
    }

    private getNextEndDay(startDay: number): number {
        let end = startDay + this.limitDays * 86400
        if((end * 1000) < new Date().getTime()) return end
        this._isEndedFlag = true
        return ValuesLoader.truncTime(new Date().getTime() / 1000)
    }

    private setNextPage(): void {
        ++this.currentPage
    }

    get isEnded(): boolean {
        return this._isEndedFlag
    }

    get lastCurrentDay(): number {
        return this.startDay + (this.currentPage - 1) * this.limitDays * 86400
    }

    static truncTime(timeSec: number): number {
        const time = Func.truncDate(new Date(timeSec * 1000)).getTime()
        return Math.trunc(time / 1000)
    }

    static ceilTime(timeSec: number): number {
        const time = Func.ceilDate(new Date(timeSec * 1000)).getTime()
        return Math.trunc(time / 1000)
    }
}