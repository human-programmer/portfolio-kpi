import {AmocrmLoader, PackLoaders} from "../AmocrmLoader";
import {IAmocrmLoaders} from "../../interface";
import IAmocrmCustomField = IAmocrmLoaders.IAmocrmCustomField;
import {CustomFieldsFabric} from "./CustomFieldsFabric";
import {IMainWorkers} from "../../../main/interface";
import {FieldsValidator} from "./FieldsValidator";
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import WorkName = IMainWorkers.WorkName;
import IAmoJob = IAmocrmLoaders.IAmoJob;
import IAmoWorker = IAmocrmLoaders.IAmoWorker;

abstract class CFLoader extends AmocrmLoader {
    protected fetchEntities(body: any): Array<IAmocrmCustomField> {
        const f = body._embedded.custom_fields
        const fields = Array.isArray(f) ? f : []
        return this.formattingFields(fields)
    }

    protected async saveEntities(entities: Array<IAmocrmCustomField>): Promise<void> {
        await CustomFieldsFabric.save(entities)
    }

    private formattingFields(fields: Array<any>): Array<IAmocrmCustomField> {
        return FieldsValidator.formattingFields(this.job.node, fields)
    }

    protected static createCfJob(job: IAmoJob, target: WorkerTarget.contactsCf|WorkerTarget.companiesCf|WorkerTarget.leadsCf): IAmoJob {
        return {
            full_name: WorkName.load + ":" + target,
            node: job.node,
            target,
            work_name: WorkName.load
        }
    }
}

export class LeadsCfLoader extends CFLoader {
    protected readonly route: string = '/api/v4/leads/custom_fields'
    constructor(job: IAmoJob) {
        super(CFLoader.createCfJob(job, WorkerTarget.leadsCf));
    }
}

export class ContactsCfLoader extends CFLoader {
    protected readonly route: string = '/api/v4/contacts/custom_fields'
    constructor(job: IAmoJob) {
        super(CFLoader.createCfJob(job, WorkerTarget.contactsCf));
    }
}

export class CompaniesCfLoader extends CFLoader {
    protected readonly route: string = '/api/v4/companies/custom_fields'
    constructor(job: IAmoJob) {
        super(CFLoader.createCfJob(job, WorkerTarget.companiesCf));
    }
}

export class CustomFieldsLoader extends PackLoaders implements IAmoWorker {
    protected concurrentlyRun: boolean = true
    readonly job: IAmoJob

    static create(job: IAmoJob): IAmoWorker {
        const loaders = []
        loaders.push(new LeadsCfLoader(job))
        loaders.push(new ContactsCfLoader(job))
        loaders.push(new CompaniesCfLoader(job))
        return new CustomFieldsLoader(job, loaders)
    }

    constructor(job: IAmoJob, loaders: IAmoWorker[]) {
        super(job, loaders)
        this.job = job
    }
}