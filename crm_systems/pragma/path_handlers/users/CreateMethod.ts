import {PragmaHandler} from "../PragmaHandler";
import {IMain} from "../../../main/interfaces/MainInterface";
import IUsersRequest = IMain.IUsersRequest;
import IUserStruct = IMain.IUserStruct;
import {PragmaUsers} from "../../components/users/PragmaUsers";
import ICreateUserQuery = IMain.ICreateUserQuery;
import ICreateUserStruct = IMain.ICreateUserStruct;
import {IBasic} from "../../../../generals/IBasic";
import asEmail = IBasic.asEmail;
import asPhone = IBasic.asPhone;
import isValidPhone = IBasic.isValidPhone;

export class CreateMethod extends PragmaHandler {
    readonly availableMethods: Array<string> = ['create']
    readonly request: IUsersRequest

    constructor(request: any) {
        super(request)
        this.request = CreateMethod.requestFormatting(request)
    }

    async execute(): Promise<Array<IUserStruct>> {
        await this.validRequest()
        const user = await PragmaUsers.self.createUser(this.createStruct)
        return [user.publicModel]
    }

    private async validRequest(): Promise<void> {
        await this.requestValidator()
    }

    private get createStruct(): ICreateUserStruct {
        return this.request.query.data
    }

    private static requestFormatting(request: any): IUsersRequest {
        request = super.basicRequestFormatting(request)
        request.query = CreateMethod.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query): ICreateUserQuery {
        query.data = query.data instanceof Object ? query.data : {}
        query.data = CreateMethod.dataFormatting(query.data)
        return query
    }

    private static dataFormatting(data: any): ICreateUserStruct {
        data.surname = CreateMethod.formattingString(data.surname)
        data.middle_name = CreateMethod.formattingString(data.middle_name)
        data.lang = CreateMethod.formattingString(data.lang)
        data.name = CreateMethod.formattingString(data.name)

        data.email = CreateMethod.formattingEmail(data.email)
        data.phone = CreateMethod.formattingPhone(data.phone)
        return data
    }

    private static formattingString(str: string): string {
        if(!str) return ''
        return `${str}`.trim()
    }

    private static formattingEmail(email: string): string {
        try {
            return asEmail(email)
        } catch (e) {return ''}
    }

    private static formattingPhone(phone: string): string {
        return isValidPhone(phone) ? asPhone(phone) : ''
    }
}