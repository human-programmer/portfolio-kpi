import {AmocrmLoader, PackLoaders} from "../AmocrmLoader";
import {IInterfacesBuffer, InterfacesBuffer} from "./Buffer";
import {Generals} from "../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import EntityGroup = Generals.EntityGroup;
import {CompaniesFabric, ContactsFabric, EntitiesFabric, IAmoEntityLinks, LeadsFabric} from "./EntitiesFabric";
import {EntitiesValidator} from "./EntitiesValidator";
import {IAmocrmLoaders} from "../../interface";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;
import {EntitiesLinksFabric} from "./EntitiesLinksFabric";
import {IMainWorkers} from "../../../main/interface";
import IWorkerResult = IMainWorkers.IWorkerResult;
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import WorkName = IMainWorkers.WorkName;

export interface ILink {
    readonly amocrmEntityId: number
    readonly amocrmEntityType: AmocrmEntityGroup
    readonly companies: Array<number>
    readonly contacts: Array<number>
    readonly leads: Array<number>
}

abstract class BasicEntitiesLoader extends AmocrmLoader {
    protected readonly loadersQuantity: number = 6
    abstract readonly amocrmEntityGroup: AmocrmEntityGroup
    abstract readonly entityGroup: EntityGroup
    abstract readonly entitiesFabric: EntitiesFabric

    readonly entitiesValidator: EntitiesValidator
    readonly buffer: IInterfacesBuffer

    constructor(job: IAmocrmJob, buffer: IInterfacesBuffer, validator: EntitiesValidator) {
        super(job)
        this.buffer = buffer
        this.entitiesValidator = validator
    }

    protected fetchEntities(body: any): Array<any> {
        const amocrmEntities = this.fetchAmocrmEntities(body)
        return this.entitiesValidator.formatting(amocrmEntities)
    }

    protected async saveEntities(entities: Array<any>): Promise<void> {
        await this.entitiesFabric.save(entities)
    }

    get links (): Array<IAmoEntityLinks> {
        return this.entitiesFabric.amocrmLinks
    }

    fetchAmocrmEntities(body: any): Array<any> {
        body = typeof body === 'object' ? body : {}
        body._embedded = typeof body._embedded === 'object' ? body._embedded : {}
        return Array.isArray(body._embedded[this.amocrmEntityGroup]) ? body._embedded[this.amocrmEntityGroup] : []
    }
}

export class ContactsLoader extends BasicEntitiesLoader {
    readonly amocrmEntityGroup: AmocrmEntityGroup = AmocrmEntityGroup.contacts
    readonly entityGroup: EntityGroup = EntityGroup.contacts
    readonly entitiesFabric: EntitiesFabric
    protected readonly route: string = '/api/v4/contacts'
    protected readonly queryParams: any = {with: 'leads,companies'}

    constructor(job: IAmocrmJob, buffer: IInterfacesBuffer) {
        super(job, buffer, new EntitiesValidator(buffer, AmocrmEntityGroup.leads))
        this.entitiesFabric = new ContactsFabric(this.pragmaAccountId, this.amocrmAccountId)
    }
}

export class CompaniesLoader extends BasicEntitiesLoader {
    readonly amocrmEntityGroup: AmocrmEntityGroup = AmocrmEntityGroup.companies
    readonly entityGroup: EntityGroup = EntityGroup.companies
    readonly entitiesFabric: EntitiesFabric
    protected readonly route: string = '/api/v4/companies'
    protected readonly queryParams: any = {with: 'leads,contacts'}

    constructor(job: IAmocrmJob, buffer: IInterfacesBuffer) {
        super(job, buffer, new EntitiesValidator(buffer, AmocrmEntityGroup.leads))
        this.entitiesFabric = new CompaniesFabric(this.pragmaAccountId, this.amocrmAccountId)
    }
}

export class LeadsLoader extends BasicEntitiesLoader {
    readonly amocrmEntityGroup: AmocrmEntityGroup = AmocrmEntityGroup.leads
    readonly entityGroup: EntityGroup = EntityGroup.leads
    readonly entitiesFabric: EntitiesFabric
    protected readonly route: string = '/api/v4/leads'
    protected readonly queryParams: any = {with: 'contacts,companies'}

    constructor(job: IAmocrmJob, buffer: IInterfacesBuffer) {
        super(job, buffer, new EntitiesValidator(buffer, AmocrmEntityGroup.leads))
        this.entitiesFabric = new LeadsFabric(this.pragmaAccountId, this.amocrmAccountId)
    }
}

export class EntitiesLoader extends PackLoaders{
    protected concurrentlyRun: boolean = false
    readonly loaders: BasicEntitiesLoader[]
    readonly job: IAmocrmJob
    readonly buffer: IInterfacesBuffer

    static async create(job: IAmocrmJob): Promise<EntitiesLoader> {
        const buffer = await InterfacesBuffer.create(job.node.account.pragma_account_id)
        const loaders = []
        loaders.push(new ContactsLoader(EntitiesLoader.contactsJob(job), buffer))
        loaders.push(new CompaniesLoader(EntitiesLoader.companiesJob(job), buffer))
        loaders.push(new LeadsLoader(EntitiesLoader.leadsJob(job), buffer))
        return new EntitiesLoader(job, buffer, loaders)
    }

    constructor(job: IAmocrmJob, buffer: IInterfacesBuffer, loaders: BasicEntitiesLoader[]) {
        super(job, loaders)
        this.loaders = loaders
        this.buffer = buffer
    }

    async run(): Promise<IWorkerResult> {
        try {
            await super.run()
            await this.saveLinks()
        } catch (error) {
            this.error = error
        } finally {
            return this.lastWorkerResult
        }
    }

    private async saveLinks(): Promise<void> {
        const linksFabric = await EntitiesLinksFabric.create(this.job.node.account.pragma_account_id)
        await linksFabric.save(this.links)
    }

    private get links(): Array<IAmoEntityLinks> {
        return [].concat(...this.loaders.map(i => i.links))
    }

    private static leadsJob(job: IAmocrmJob): IAmocrmJob {
        return EntitiesLoader.newLoadJob(job, WorkerTarget.leads)
    }

    private static contactsJob(job: IAmocrmJob): IAmocrmJob {
        return EntitiesLoader.newLoadJob(job, WorkerTarget.contacts)
    }

    private static companiesJob(job: IAmocrmJob): IAmocrmJob {
        return EntitiesLoader.newLoadJob(job, WorkerTarget.companies)
    }

    private static newLoadJob (job: IAmocrmJob, target: WorkerTarget): IAmocrmJob {
        return {
            full_name: WorkName.load + ":" + target,
            node: job.node,
            target,
            work_name: WorkName.load
        }
    }
}