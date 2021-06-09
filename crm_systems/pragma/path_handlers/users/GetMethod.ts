import {PragmaHandler} from "../PragmaHandler";
import {IMain} from "../../../main/interfaces/MainInterface";
import IUsersRequest = IMain.IUsersRequest;
import IGetUsersQuery = IMain.IGetUsersQuery;
import IUsersFilter = IMain.IUsersFilter;
import IUserStruct = IMain.IUserStruct;
import {Pragma} from "../../instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import {PragmaUsers} from "../../components/users/PragmaUsers";

export class GetMethod extends PragmaHandler {
    readonly availableMethods: Array<string> = ['get']

    readonly request: IUsersRequest
    constructor(request: any) {
        super(request)
        this.request = GetMethod.requestFormatting(request)
    }

    async execute(): Promise<Array<IUserStruct>> {
        const users = await this.getUsers()
        return users.map(user => user.publicModel)
    }

    private async getUsers(): Promise<Array<IPragmaUser>> {
        const getAllUsersFlag = !this.idFromFilter.length && !this.emailFromFilter.length && !this.phoneFromFilter.length
        return getAllUsersFlag ? await this.getAllUsers() : await this.getTargetUsers()
    }

    private async getAllUsers(): Promise<Array<IPragmaUser>> {
        throw Errors.internalError('getAllUsers method is not implemented')
    }

    private async getTargetUsers(): Promise<Array<IPragmaUser>> {
        const fromPhones = await this.getByPhone()
        const fromEmails = await this.getByEmail()
        const fromId = await this.getById()
        const users = fromPhones.concat(fromEmails, fromId)
        return users.filter((user, index) => users.indexOf(user) === index)
    }

    private async getByEmail(): Promise<Array<IPragmaUser>> {
        if(!this.emailFromFilter.length) return []
        const promises = this.emailFromFilter.map(email => PragmaUsers.self.findUserByEmail(email))
        const users = await Promise.all(promises)
        return users.filter(i => i)
    }

    private async getByPhone(): Promise<Array<IPragmaUser>> {
        if(!this.phoneFromFilter.length) return []
        const promises = this.phoneFromFilter.map(phone => PragmaUsers.self.findUserByPhone(phone))
        const users = await Promise.all(promises)
        return users.filter(i => i)
    }

    private async getById(): Promise<Array<IPragmaUser>> {
        if(!this.idFromFilter.length) return []
        const promises = this.idFromFilter.map(id => PragmaUsers.self.findUserById(id))
        const users = await Promise.all(promises)
        return users.filter(i => i)
    }

    private get idFromFilter(): Array<number> {
        return this.request.query.filter.pragma_user_id
    }

    private get emailFromFilter(): Array<string> {
        return this.request.query.filter.email
    }

    private get phoneFromFilter(): Array<string> {
        return this.request.query.filter.phone
    }

    private static requestFormatting(request: any): IUsersRequest {
        request = super.basicRequestFormatting(request)
        request.query = GetMethod.queryProcessing(request.query)
        return request
    }

    private static queryProcessing(query: any): IGetUsersQuery {
        query.filter = query.filter instanceof Object ? query.filter : {}
        query.filter = GetMethod.filterProcessing(query.filter)
        return query
    }

    private static filterProcessing(filter): IUsersFilter {
        filter.pragma_user_id = this.asUniqueNumbers(filter.pragma_user_id)
        filter.email = this.asUniqueStrings(filter.email)
        filter.phone = this.asUniquePhones(filter.phone)
        return filter
    }
}