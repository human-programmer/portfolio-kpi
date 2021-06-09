import {PragmaHandler} from "../PragmaHandler";
import {IMain} from "../../../main/interfaces/MainInterface";
import IUsersRequest = IMain.IUsersRequest;
import IUpdateUserQuery = IMain.IUpdateUserQuery;
import IUpdateUserStruct = IMain.IUpdateUserStruct;
import IUserStruct = IMain.IUserStruct;
import {PragmaUsers} from "../../components/users/PragmaUsers";
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;

export class UpdateMethod extends PragmaHandler {
    readonly availableMethods: Array<string> = ['update']
    readonly request: IUsersRequest

    constructor(request: any) {
        super(request)
        this.request = UpdateMethod.requestFormatting(request)
    }

    async execute(): Promise<Array<IUserStruct>> {
        await this.validRequest()
        const user = await PragmaUsers.self.findUserById(this.updateStruct.pragma_user_id)
        await user.update(this.updateStruct)
        return [user.publicModel]
    }

    private get updateStruct(): IUpdateUserStruct {
        return this.request.query.data
    }

    private async validRequest(): Promise<void> {
        await this.requestValidator()
    }

    private static requestFormatting(request: any): IUsersRequest {
        request = super.basicRequestFormatting(request)
        request.query = UpdateMethod.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query: any): IUpdateUserQuery {
        query.data = query.data instanceof Object ? query.data : {}
        query.data = UpdateMethod.createDataFormatting(query.data)
        return query
    }

    private static createDataFormatting(data): IUpdateUserStruct {
        data.pragma_user_id = UpdateMethod.formattingId(data.pragma_user_id)

        data.surname = UpdateMethod.formattingString(data.surname)
        data.middle_name = UpdateMethod.formattingString(data.middle_name)
        data.lang = UpdateMethod.formattingString(data.lang)
        data.name = UpdateMethod.formattingString(data.name)
        return data
    }

    private static formattingId(id: any): number {
        id = '' + id
        if(id.match(/\D+/))
            throw Errors.invalidRequest('Invalid user id "' + id + '"')
        id = Number.parseInt(id)
        if(!id)
            throw Errors.invalidRequest('pragma_user_id is missing"' + id + '"')
        return id
    }

    private static formattingString(str: string): string {
        if(!str) return ''
        return `${str}`.trim()
    }
}