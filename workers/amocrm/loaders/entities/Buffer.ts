import {EntitiesBuffer} from "./buffer/EntitiesBuffer";
import {EnumsBuffer} from "./buffer/EnumsBuffer";
import {FieldsBuffer} from "./buffer/FieldsBuffer";
import {PipelinesBuffer} from "./buffer/PipelinesBuffer";
import {StatusesBuffer} from "./buffer/StatusesBuffer";
import {UsersBuffer} from "./buffer/UsersBuffer";

export interface IEntityInterface {
    readonly amocrmEntityId: number
    readonly amocrmEntityType: string

    pragmaEntityId?: number
    readonly pragmaEntityType: number
}

export interface IValue{
    pragmaEntityId?: number
    readonly pragmaFieldId: number
    readonly pragmaFieldName?: string
    readonly value: string|number
}

export interface IInterfaceEntityBuffer {
    findPragmaId(amocrmId: number): number|null
    addInterface(inter: any): void
}

export interface IInterfacesBuffer {
    readonly contacts: IInterfaceEntityBuffer
    readonly companies: IInterfaceEntityBuffer
    readonly leads: IInterfaceEntityBuffer
    readonly users: IInterfaceEntityBuffer
    readonly fields: IInterfaceEntityBuffer
    readonly enums: IInterfaceEntityBuffer
    readonly pipelines: IInterfaceEntityBuffer
    readonly statuses: IInterfaceEntityBuffer
}

export class InterfacesBuffer{
    static async create(pragmaAccountId: number): Promise<IInterfacesBuffer> {
        const result = await Promise.all([
                EntitiesBuffer.create(pragmaAccountId),
                UsersBuffer.create(pragmaAccountId),
                EnumsBuffer.create(pragmaAccountId),
                FieldsBuffer.create(pragmaAccountId),
                PipelinesBuffer.create(pragmaAccountId),
                StatusesBuffer.create(pragmaAccountId),
            ])

        return {
            contacts: result[0].contacts,
            companies: result[0].companies,
            leads: result[0].leads,
            users: result[1],
            enums: result[2],
            fields: result[3],
            pipelines: result[4],
            statuses: result[5],
        }
    }
}