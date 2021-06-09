import {IKPI} from "./IKPI";
import {IMainWorkers} from "../../main/interface";
import IJob = IMainWorkers.IJob;
import {IEvents} from "./IEvents";
import IEventsLoader = IEvents.IEventLoader;
import IAccStage = IEvents.IAccStage;
import IValuesTree = IEvents.IValuesTree;
import IMetricsLoader = IKPI.IMetricsLoader;
import {Generals} from "../../../generals/Interfaces";
import ITimeInterval = Generals.ITimeInterval;
import MetricName = IKPI.MetricName;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import IEvent = IEvents.IEvent;
import {Func} from "../../../generals/Func";
import IEventsConverterFabric = IEvents.IEventsConverterFabric;
import IStageCalculator = IEvents.IStageCalculator;
import {StageCalculatorFabric} from "./calculators/stage_calc/StageCalculator";
import IFullStage = IEvents.IFullStage;
import IStageCalculatorFabric = IEvents.IStageCalculatorFabric;
import {Metrics} from "./metrics/Metrics";
import IMetricCalc = IEvents.IMetricCalc;
import {MetricCalc} from "./calculators/metric_calc/MetricCalc";
import EventName = IKPI.EventName;


interface ILoadParams {
    readonly eventsLoader: IEventsLoader
    readonly eventNames: EventName[],
    readonly metricNames: MetricName[],
    readonly interval: ITimeInterval
}

export abstract class MetricsLoaderFabric {
    abstract getEventsConverterFabric(): Promise<IEventsConverterFabric>
    abstract createLoader(job: IJob): Promise<IEventsLoader>
    async createMetricsLoader(job: IJob): Promise<IMetricsLoader> {
        const arr = await Promise.all([
            this.loadAccStage(job),
            this.loadValuesTree(job),
            this.createLoader(job)
        ])
        return new MetricsLoader(arr[0], arr[1], arr[2])
    }

    async loadAccStage(job: IJob): Promise<IAccStage> {

    }

    async loadValuesTree(job: IJob): Promise<IValuesTree> {

    }
}

export class MetricsLoader implements IMetricsLoader{
    protected readonly fullStage: IFullStage
    protected readonly eventsLoader: IEventsLoader

    constructor(fullStage: IFullStage, eventsLoader: IEventsLoader) {
        this.fullStage = fullStage
        this.eventsLoader = eventsLoader
    }

    async run(): Promise<any> {
        await this.loadNewMetrics()
        await this.loadBySlice()
    }

    stop(): Promise<any> {
        return Promise.resolve(undefined);
    }

    private async loadBySlice(): Promise<void> {
        if(!this.fullStage.values_tree.needsNextUpdating) return;
        const metricNames = this.fullStage.values_tree.metricNames
        const coreMetricNames = await Metrics.coreMetricNamesOfAccount(this.fullStage.values_tree.account)
        const eventNames = Metrics.metricNamesToEventNames(metricNames).concat(Metrics.core)
        const loadParams: ILoadParams = {eventsLoader: this.eventsLoader, eventNames, metricNames, interval: this.nextTimeSliceInterval}
        await this.load(loadParams)
    }

    private async loadNewMetrics(): Promise<void> {
        const metricNames = await this.getNewMetricsToLoad()
        if(!metricNames.length) return;
        const eventNames = Metrics.metricNamesToEventNames(metricNames)
        if(!eventNames.length) return;
        const loadParams: ILoadParams = {eventsLoader: this.eventsLoader, eventNames, metricNames, interval: this.currentInterval}
        await this.load(loadParams)
    }

    private async load(loadParams: ILoadParams): Promise<void> {
        const loader = new Loader(this.fullStage, loadParams)
        await loader.run()
    }

    private get nextTimeSliceInterval(): ITimeInterval {
        return {start: this.fullStage.acc_stage.last_day, end: MetricsLoader.newLastTime}
    }

    private static get newLastTime(): number {
        const seconds = Math.trunc(new Date().getTime() / 1000)
        return Func.truncSeconds(seconds) - 1
    }

    private get currentInterval(): ITimeInterval {
        return {start: this.fullStage.acc_stage.start_day, end: this.fullStage.acc_stage.last_day + 86400 - 1}
    }

    private async getNewMetricsToLoad(): Promise<MetricName[]> {
        return await Metrics.getNewMetricNamesForAccount(this.fullStage.values_tree)
    }
}

class Loader {
    private error: any
    private readonly fullStage: IFullStage
    private readonly loadParams: ILoadParams

    private readonly eventsQueue: LoadEventsQueue
    private readonly loadEventsIterator: LoadEventsIterator
    private readonly stageCalcFabric: IStageCalculatorFabric
    private readonly stageCalculator: IStageCalculator
    private readonly metricCalculator: IMetricCalc

    constructor(fullStage: IFullStage, loadParams: ILoadParams) {
        this.fullStage = fullStage
        this.loadParams = loadParams
        this.loadEventsIterator = new LoadEventsIterator(loadParams.eventsLoader, loadParams.eventNames, loadParams.interval)

        this.eventsQueue =  new LoadEventsQueue(this.loadEventsIterator)
        this.stageCalcFabric = new StageCalculatorFabric(this.fullStage)
        this.stageCalculator = this.stageCalcFabric.createSliceCalculator(loadParams.metricNames)
        this.metricCalculator = new MetricCalc(this.fullStage)
    }

    async run(): Promise<void> {
        let nextEvents
        while (this.checkError && (nextEvents = await this.eventsQueue.nextEvents())) {
            await this.updateAccStage(nextEvents)
        }
        await this.updateMetrics()
    }

    private async updateAccStage(events: IEvent[]): Promise<void> {
        try {
            const updater = new StageUpdater(this.stageCalculator)
            await updater.update(events)
        } catch (e) {
            this.error = Errors.internalError(e)
        }
    }

    private get checkError(): boolean {
        if(this.error) throw this.error
        return true
    }

    private async updateMetrics(): Promise<void> {
        const dayTimes = this.metricUpdateDays
        dayTimes.forEach(datTime => {
            const photos = this.fullStage.acc_stage.photos(datTime)
            const values = this.metricCalculator.calcAsOneDay(photos, this.loadParams.metricNames)
            this.fullStage.values_tree.setValuesAndMoveDayIndex(values, datTime)
        })
    }

    private get metricUpdateDays(): number[] {
        const stageLastDay = this.fullStage.acc_stage.lastDay
        const metricsLastDay = this.fullStage.values_tree.lastDay
        const diff = stageLastDay - metricsLastDay
        Loader.validDif(diff)
        const daysQuantity = diff / 86400
        const dayTimes = []
        for (let i = 0; i < daysQuantity; i++)
            dayTimes.push(metricsLastDay + i * 86400)
        return dayTimes
    }

    private static validDif(diff: number): void {
        if(diff < 0 || diff % 86400)
            throw Errors.internalError("Invalid diff days: '" + diff + "'")
    }
}

class StageUpdater {
    private error: any
    private readonly stageCalc: IStageCalculator
    private reject: any
    private resolve: any
    private eventsToUpdate: IEvent[]
    private expectIterations: number
    private finalIterations: number = 0

    constructor(stageCalc: IStageCalculator) {
        this.stageCalc = stageCalc
    }

    async update(events: IEvent[]): Promise<void> {
        if(this.reject || this.reject || this.eventsToUpdate)
            throw Errors.internalError('Error due to repeated call method "update"')
        this.eventsToUpdate = events
        this.runUpdate()
        return new Promise(((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        }))
    }

    private runUpdate(): void {
        const groupedEvents: IEvent[][] = StageUpdater.groupByDay(this.eventsToUpdate)
        this.expectIterations = groupedEvents.length
        groupedEvents.forEach(events => this.asyncUpdate(events))
    }

    private asyncUpdate(events: IEvent[]): void {
        setTimeout(() => {
            try {
                this.error || this.stageCalc.updateStage(events)
                this.setNextIteration()
                this.isFinal && this.resolveTrigger()
            } catch (e) {
                this.error = e
                this.errorTrigger(e)
            }
        })
    }

    private setNextIteration(): void {
        this.finalIterations++
    }

    private get isFinal(): boolean {
        return this.finalIterations === this.expectIterations
    }

    private errorTrigger(error): void {
        this.reject(error)
    }

    private resolveTrigger(): void {
        this.resolve()
    }

    private static groupByDay(events: IEvent[]): IEvent[][] {
        const res: object = {}
        events.forEach(event => {
            const dayTime = Func.truncSeconds(event.time)
            let eventsGroup = res[dayTime]
            if(!eventsGroup)
                res[dayTime] = eventsGroup = []
            eventsGroup.push(event)
        })
        return Object.values(res)
    }
}

class LoadEventsQueue {
    private readonly loader: LoadEventsIterator
    private readonly eventsQueue: IEvent[][] = []
    private resolveHandler: any
    private rejectHandler: any
    private started: boolean = false

    constructor(eventsIterator: LoadEventsIterator) {
        this.loader = eventsIterator
    }

    async nextEvents(): Promise<IEvent[]|false> {
        setTimeout(() => this.safeRun())
        return new Promise((res, rej) => {
            this.resolveHandler = res
            this.rejectHandler = rej
        })
    }

    private safeRun(): void {
        if(!this.started)
            throw Errors.internalError('Error while trying to start events queue again')
        this.run()
    }

    private async run(): Promise<void> {
        while (await this.loadNext()) {}
    }

    private async loadNext(): Promise<boolean> {
        const events = await this.loader.nextEvents()
        this.pushEvents(events)
        this.delayedTrigger()
        return !this.loader.isEnded
    }

    private delayedTrigger(): void {
        setTimeout(() => {
            this.resolveHandler && this.resolveHandler(this.shiftEvents)
            this.resolveHandler = null
        })
    }

    private get shiftEvents(): IEvent[]|false {
        if(!this.eventsQueue.length && this.loader.isEnded)
            return false
        return this.eventsQueue.shift()
    }

    private pushEvents(events: IEvent[]): void {
        this.eventsQueue.push(events)
    }
}

class LoadEventsIterator {
    private readonly eventsLoader: IEventsLoader
    private readonly eventNames: EventName[]
    private readonly interval: ITimeInterval
    private currentPage: number = 0
    private daysInPage: number = 30
    private _isEnded: boolean = false

    constructor(eventsLoader: IEventsLoader, eventNames: EventName[], interval: ITimeInterval) {
        this.eventsLoader = eventsLoader
        this.eventNames = eventNames
        this.interval = interval
    }

    async nextEvents(): Promise<IEvent[]> {
        if(this._isEnded) return []
        return await this.eventsLoader.loadEvents(this.eventNames, this.nextInterval)
    }

    private get nextInterval(): ITimeInterval {
        const start = this.nextStartTime
        const end = this.getNextEndTime(start)
        ++this.currentPage
        return {start, end}
    }

    private get nextStartTime(): number {
        return (this.daysInPage * this.currentPage) * 86400 + this.interval.start
    }

    private getNextEndTime(startTime: number): number {
        const end = startTime + (this.daysInPage * (this.currentPage + 1)) * 86400
        if(end > this.interval.end) {
            this._isEnded = true
            return this.interval.end
        }
        return end
    }

    get isEnded(): boolean {
        return this._isEnded;
    }
}

class StageSaver {
    private readonly fullStage: IFullStage
    private readonly valuesTree: IValuesTree
    private readonly stageCalcFabric: IStageCalculatorFabric
    private readonly stageCalculator: IStageCalculator

    constructor(fullStage: IFullStage) {
        this.fullStage = fullStage
        this.stageCalcFabric = new StageCalculatorFabric(fullStage)
    }

    async updateStages(events: IEvent[]): Promise<void> {
        this.accStage.
    }
}