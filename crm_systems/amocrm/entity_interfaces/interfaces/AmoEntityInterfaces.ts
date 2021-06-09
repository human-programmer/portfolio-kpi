import {IEntityInterfaces} from "../../../main/interfaces/IEntityInterfaces";
import IGroupInterfaces = IEntityInterfaces.IGroupInterfaces;
import {Generals} from "../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import EntityGroup = Generals.EntityGroup;

export class AmoEntityInterfaces implements IGroupInterfaces {
    readonly amoGroupName: AmocrmEntityGroup;
    readonly groupName: EntityGroup;
    readonly interfaces: number[][];

    constructor(pragmaAccountId: number, groupName: EntityGroup, amoGroup: AmocrmEntityGroup) {

    }


    findPragmaId(amoId: number): number {
        return 0;
    }

    getOrCreate(amoId: number): Promise<number> {
        return Promise.resolve(0);
    }

}