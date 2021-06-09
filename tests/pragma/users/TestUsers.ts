import {Buffer, PragmaUsers} from "../../../crm_systems/pragma/components/users/PragmaUsers";
import {CRMDB} from "../../../generals/data_base/CRMDB";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import ICreateUserStruct = IMain.ICreateUserStruct;
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;

export class TestUsers extends PragmaUsers {
    private testUsers: Array<number> = []
    constructor() {
        super()
    }

    async createUser(struct: ICreateUserStruct): Promise<IPragmaUser> {
        const user = await super.createUser(struct)
        this.testUsers.push(user.pragmaUserId)
        return user
    }

    clearTestBuffer(): void {
        const size = this.buffer.size
        for(let i = 0; i < size; ++i)
            this.buffer.users.pop()
    }

    async clearTestUsers(): Promise<void> {
        const users = CRMDB.usersSchema
        const condition = this.testUsers.map(id => `${users}.id = ${id}`).join(' OR ')
        if(!condition)return ;
        const sql = `DELETE FROM ${users} WHERE ${condition}`
        await CRMDB.query(sql)
    }

    async clearTestAll(): Promise<void> {
        this.clearTestBuffer()
        await this.clearTestUsers()
    }

    get testBuffer(): Buffer {
        return this.buffer
    }
}