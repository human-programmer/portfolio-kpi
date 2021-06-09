import {IEvents} from "../../IEvents";
import IAccStage = IEvents.IAccStage;
import IStageCalculator = IEvents.IStageCalculator;
import {Generals} from "../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import IStageCalculatorFabric = IEvents.IStageCalculatorFabric;
import {IKPI} from "../../IKPI";
import {PriceStageDecorator} from "./decorators/PriceStageDecorator";
import IFullStage = IEvents.IFullStage;
import MetricName = IKPI.MetricName;
import EventName = IKPI.EventName;
import IEvent = IKPI.IEvent;
import IEntityFieldStage = IKPI.IEntityFieldStage;
import StageFieldName = IKPI.StageFieldName;

export abstract class StageCalculator implements IStageCalculator {
    abstract updateStage(events: IEvent[]): void
    abstract getOwnFieldStages(events: IEvent[]): IEntityFieldStage[]

    protected readonly acc_stage: IAccStage

    constructor(acc_stage: IAccStage) {
        this.acc_stage = acc_stage
    }
}

export abstract class AStageDecorator extends StageCalculator {
    abstract readonly event_names: EventName[]
    protected abstract createFieldStageCalculator(): AtomFieldStageCalc
    protected abstract isEventOwner(event: IEvent): boolean
    private readonly stageCalc: StageCalculator
    private _stageFieldCalc: AtomFieldStageCalc

    constructor(stage: IAccStage, stageCalc: StageCalculator) {
        super(stage)
        this.stageCalc = stageCalc
    }

    updateStage(events: IEvent[]): void {
        const stages = this.getStages(events)
        stages.forEach(stage => this.acc_stage.addEntityFieldStage(stage))
    }

    getStages(events: IEvent[]): IEntityFieldStage[] {
        return this.getOwnStages(events).concat(this.getNextStages(events))
    }

    private getOwnStages(events: IEvent[]): IEntityFieldStage[] {
        const ownEvents = events.filter(i => this.isEventOwner(i))
        return this.getOwnFieldStages(ownEvents)
    }

    private getNextStages(events: IEvent[]): IEntityFieldStage[] {
        return this.stageCalc.getOwnFieldStages(events)
    }

    getOwnFieldStages(events: IEvent[]): IEntityFieldStage[] {
        this.stageFieldCalc.setEvents(events)
        return this.stageFieldCalc.stages
    }

    get stageFieldCalc(): AtomFieldStageCalc {
        if(this._stageFieldCalc) return this._stageFieldCalc
        this._stageFieldCalc = this.createFieldStageCalculator()
        return this._stageFieldCalc
    }
}


export abstract class AtomFieldStageCalc {
    protected abstract readonly fieldName: StageFieldName
    protected abstract fetchValueFromEvent(event: IEvent): any
    protected abstract isEventOwner(event: IEvent): boolean
    private readonly accStage: IAccStage
    private events: IEvent[] = []
    private _stages: IEntityFieldStage[] = []

    constructor(accStage: IAccStage) {
        this.accStage = accStage
        this.calcStages()
    }

    setEvents(events: IEvent[]): void {
        const ownEvents = events.filter(i => this.isEventOwner(i))
        this.events = AtomFieldStageCalc.sortEvents(ownEvents)
        this._stages = []
    }

    private static sortEvents(events: IEvent[]): IEvent[] {
        const f = {}
        events.forEach(event => f[event.time] = event)
        return Object.values(f)
    }

    private calcStages(): void {
        this._stages = this.events.flatMap(event => this.createEntityFieldStage(event))
    }

    protected createEntityFieldStage(event: IEvent): [IEntityFieldStage] {
        return [{
            entity_id: event.entity_id,
            entity_type: event.entity_type,
            field_name: this.fieldName,
            time: event.time,
            init_user_id: event.user_id,
            value: this.fetchValueFromEvent(event)
        }]
    }

    get stages(): IEntityFieldStage[] {
        return this._stages;
    }
}

export class DefaultStageCalculator extends StageCalculator {
    updateStage(events: IEvent[]): void {}
    getOwnFieldStages(events: IEvent[]): IEntityFieldStage[] {
        return []
    }
}

export class StageCalculatorFabric implements IStageCalculatorFabric {
    readonly stage: IFullStage;

    constructor(stage: IFullStage) {
        this.stage = stage
    }

    createSliceCalculator(metricNames: MetricName[]): IStageCalculator {
        let basicCalc: any = new DefaultStageCalculator(this.stage.acc_stage)
        basicCalc = this.addOtherDecorators(basicCalc, metricNames)
        return this.addCoreDecorators(basicCalc)
    }

    private addOtherDecorators(basic: IStageCalculator, metricNames: MetricName[]): IStageCalculator {
        StageCalculatorFabric.getTargetDecoratorClasses(metricNames).forEach(ClassName => {
            basic = new ClassName(this.stage.acc_stage, basic)
        })
        return basic
    }

    private addCoreDecorators(basic: IStageCalculator): IStageCalculator {
        StageCalculatorFabric.coreDecorators.forEach(ClassName => {
            basic = new ClassName(this.stage.acc_stage, basic)
        })
        return basic
    }

    private static getTargetDecoratorClasses(metricNames: MetricName[]): any[] {
        return StageCalculatorFabric.othersDecoratorClasses.filter(i => metricNames.find(name => i.isMetricOwner(name)))
    }

    private static get coreDecorators(): any[] {
        return [

        ]
    }

    private static get othersDecoratorClasses(): any[] {
        return [
            PriceStageDecorator
        ]
    }
}