import {IMain} from "../../../main/interfaces/MainInterface";
import ICreateUserStruct = IMain.ICreateUserStruct;
import IUpdateUserStruct = IMain.IUpdateUserStruct;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import {MainUser, UsersSchema} from "../../../main/components/users/Users";
import {Pragma} from "../../instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;
import IPragmaUsers = Pragma.IPragmaUsers;
import validPhoneExcept = IBasic.validPhoneExcept;
import validEmailExcept = IBasic.validEmailExcept;


class PragmaUser extends MainUser {

}

export class Buffer {
    readonly users: Array<IPragmaUser> = []

    constructor() {
    }

    add(account: IPragmaUser): void {
        this.users.push(account)
    }

    find(pragmaUserId: number): IPragmaUser|null {
        return this.users.find(user => user.pragmaUserId === pragmaUserId)
    }

    findByEmail(email: string): IPragmaUser|null {
        return this.users.find(user => user.compareEmail(email))
    }

    findByPhone(phone: string): IPragmaUser|null {
        return this.users.find(user => user.comparePhone(phone))
    }

    get size(): number {
        return this.users.length
    }
}

export class PragmaUsers implements IPragmaUsers {
    private static inst: PragmaUsers
    protected readonly buffer: Buffer

    static get self(): PragmaUsers {
        if(PragmaUsers.inst) return PragmaUsers.inst
        PragmaUsers.inst = new PragmaUsers()
        return PragmaUsers.inst
    }

    protected constructor() {
        this.buffer = new Buffer()
    }

    async findUserByEmail(email: string): Promise<IPragmaUser | null> {
        if(!PragmaUser.validEmail(email)) return null
        return this.buffer.findByEmail(email) || await this.findInDbByEmail(email)
    }

    private async findInDbByEmail(email: string): Promise<IPragmaUser|null> {
        const model = await UsersSchema.findByEmail(email)
        return model ? this.createInstance(model) : null
    }

    async findUserById(pragmaUserId: number): Promise<IPragmaUser | null> {
        return this.buffer.find(pragmaUserId) || await this.findInDbUser(pragmaUserId)
    }

    private async findInDbUser(pragmaUserId: number): Promise<IPragmaUser|null> {
        const model = await UsersSchema.findById(pragmaUserId)
        return model ? this.createInstance(model) : null
    }

    async findUserByPhone(phone: string): Promise<IPragmaUser | null> {
        if(!PragmaUser.validPhone(phone)) return null
        return this.buffer.findByPhone(phone) || await this.findInDbByPhone(phone)
    }

    private async findInDbByPhone(phone: string): Promise<IPragmaUser|null> {
        const model = await UsersSchema.findByPhone(phone)
        return model ? this.createInstance(model) : null
    }

    private createInstance(userModel: any): IPragmaUser {
        const user = new PragmaUser(userModel)
        this.buffer.add(user)
        return user
    }

    async createUser(struct: ICreateUserStruct): Promise<IPragmaUser> {
        await this.validStructToCreate(struct)
        const user_id = await UsersSchema.createUser(struct)
        return await this.findUserById(user_id)
    }

    private async validStructToCreate(struct: ICreateUserStruct): Promise<void> {
        if(!struct.email && !struct.phone)
            throw Errors.invalidRequest("Email or phone is missing")
        struct.phone && await this.validPhone(struct)
        struct.email && await this.validEmail(struct)
    }

    private async validPhone(struct: ICreateUserStruct): Promise<void> {
        if(struct.phone) {
            validPhoneExcept(struct.phone)
            const user = await this.findInDbByPhone(struct.phone)
            if(user) throw Errors.duplicateError()
        }
    }

    private async validEmail(struct: ICreateUserStruct): Promise<void> {
        validEmailExcept(struct.email)
        const user = await this.findUserByEmail(struct.email)
        if(user) throw Errors.duplicateError()
    }

    static async updateUser(struct: IUpdateUserStruct): Promise<void> {
        PragmaUsers.validStructToUpdate(struct)
        await UsersSchema.updateUser(struct)
    }

    private static validStructToUpdate(struct: IUpdateUserStruct): void {
        if(!struct.pragma_user_id)
            throw Errors.invalidRequest('"pragma_user_id" is missing')
    }
}