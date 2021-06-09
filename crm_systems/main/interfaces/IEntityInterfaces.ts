import {Generals} from "../../../generals/Interfaces";

export namespace IEntityInterfaces {
    import EntityGroup = Generals.EntityGroup;

    export enum InterfaceKey {
        external = 0,
        pragma = 1,
    }

    export interface IGroupInterfaces extends ICrmInterfaces{
        readonly groupName: EntityGroup
    }

    export interface ICrmInterfaces {
        readonly interfaces: number[][]
        findPragmaId(amoId: number): number
        getOrCreate(amoId: number): Promise<number>
    }

    export interface ICrmInterfaceFabric {
        readonly leads: IGroupInterfaces
        readonly contacts: IGroupInterfaces
        readonly companies: IGroupInterfaces
        readonly customers: IGroupInterfaces
        readonly users: ICrmInterfaces
        readonly statuses: ICrmInterfaces
        readonly pipelines: ICrmInterfaces
    }
}