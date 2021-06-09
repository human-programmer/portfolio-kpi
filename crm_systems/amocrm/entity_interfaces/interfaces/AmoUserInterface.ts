import {IEntityInterfaces} from "../../../main/interfaces/IEntityInterfaces";
import IAmoInterfaces = IEntityInterfaces.ICrmInterfaces;

export class AmoUserInterface implements IAmoInterfaces {
    readonly interfaces: number[][];

    constructor(pragmaAccountId: number) {
    }

    findPragmaId(amoId: number): number {
        return 0;
    }

    getOrCreate(amoId: number): Promise<number> {
        return Promise.resolve(0);
    }
}