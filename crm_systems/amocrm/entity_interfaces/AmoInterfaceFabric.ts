import {IEntityInterfaces} from "../../main/interfaces/IEntityInterfaces";
import IAmoInterfaceFabric = IEntityInterfaces.ICrmInterfaceFabric;
import IGroupInterfaces = IEntityInterfaces.IGroupInterfaces;
import IAmoInterfaces = IEntityInterfaces.ICrmInterfaces;

export class AmoInterfaceFabric implements IAmoInterfaceFabric {
    readonly companies: IGroupInterfaces;
    readonly contacts: IGroupInterfaces;
    readonly customers: IGroupInterfaces;
    readonly leads: IGroupInterfaces;
    readonly pipelines: IAmoInterfaces;
    readonly statuses: IAmoInterfaces;
    readonly users: IAmoInterfaces;

    static async create(pragmaAccountId: number): Promise<IAmoInterfaceFabric> {

    }

    protected constructor(companies: IGroupInterfaces,
                          contacts: IGroupInterfaces,
                          customers: IGroupInterfaces,
                          leads: IGroupInterfaces,
                          pipelines: IAmoInterfaces,
                          statuses: IAmoInterfaces,
                          users: IAmoInterfaces) {
        this.companies = companies
        this.contacts = contacts
        this.customers = customers
        this.leads = leads
        this.pipelines = pipelines
        this.statuses = statuses
        this.users = users
    }
}