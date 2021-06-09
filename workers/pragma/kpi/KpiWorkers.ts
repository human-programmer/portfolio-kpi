import {IKPI} from "./IKPI";
import IMetricLoadersFabric = IKPI.IMetricLoadersFabric;
import {IMainWorkers} from "../../main/interface";
import IWorkExecutor = IMainWorkers.IWorkExecutor;
import IJob = IMainWorkers.IJob;
import IMetricsLoader = IKPI.IMetricsLoader;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;
import IWorkerStatus = IMainWorkers.IWorkerStatus;

export abstract class MetricWorkersFabric {
    abstract getMetricsLoaderFabric(): IMetricLoadersFabric

    async create(job: IJob): Promise<IWorkExecutor> {
        const loader = await this.getMetricsLoaderFabric().createMetricsLoader(job)
        return new MetricsWorker(job, loader)
    }
}

export class MetricsWorker implements IWorkExecutor {
    readonly inWork: boolean = false
    readonly job: IJob
    readonly metricsLoader: IMetricsLoader

    constructor(job: IJob, metricsLoader: IMetricsLoader) {
        this.job = job
        this.metricsLoader = metricsLoader
    }

    async run(): Promise<void> {
        await this.metricsLoader.run()
    }

    async stop(): Promise<void> {
        await this.metricsLoader.stop()
    }

    get resultBody(): IWorkerResultBody {

    }
    get statuses(): IWorkerStatus[] {

    }
}