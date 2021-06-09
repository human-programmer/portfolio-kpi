import {LogJson} from "../../../generals/LogWriter";
import {IServer} from "../../../server/intrfaces";
import IInputQuery = IServer.IInputQuery;
import {Generals} from "../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {IMain} from "../interfaces/MainInterface";
import IModule = IMain.IModule;
import {IBasic} from "../../../generals/IBasic";
import IHandler = IBasic.IHandler;
import IInputRequest = IServer.IInputRequest;
import Errors = IBasic.Errors;
import isValidPhone = IBasic.isValidPhone;
import Error = IBasic.Error;

export abstract class Handler implements IHandler{
    abstract readonly availableMethods: Array<string>

    readonly query: IInputQuery
    readonly actualMethod: string
    readonly logWriter: ILogWriter

    abstract findPragmaModule(moduleCode: string): Promise<IModule|null>

    protected constructor(request: IInputRequest) {
        this.actualMethod = request.method
        this.query = request.query
        this.logWriter = new LogJson(this.accountReferer || 'GENERALS', this.clientModuleCode, this.getPrefix())
    }

    protected get clientModuleCode(): string|null {
        return this.query.client_module_code
    }

    protected get accountReferer(): string|null {
        return this.query.account_referer
    }

    private getPrefix() : string {
        return this.actualMethod
    }

    static basicRequestFormatting(request: any): any {
        request = request instanceof Object ? request : {}
        request.query = request.query instanceof Object ? request.query : {}
        return request
    }

    protected async requestValidator(): Promise<null> {
        if(!this.query || !this.clientModuleCode)
            throw new Error('client_module_code is missing', Errors.invalidRequestCode)

        if(!this.availableMethods.find(i => i === this.actualMethod))
            throw Errors.invalidRequest('Invalid method "' + this.actualMethod + '"')
        return null
    }

    protected async checkModule(moduleCode: string = null): Promise<null> {
        moduleCode = moduleCode || this.query.client_module_code
        const module = await this.findPragmaModule(moduleCode)
        if(!module)
            throw Errors.createError('Module "' + moduleCode + '" not found', Errors.notFoundCode)
        return null
    }

    protected static asUniqueNumbers(values: any): Array<number> {
        values = Array.isArray(values) ? values : [values]
        values = values.map(i => Number.parseInt(i)).filter(i => i)
        values = values.filter((ref, index) => values.indexOf(ref) === index)
        return values
    }

    protected static asUniqueStrings(values: any): Array<number> {
        values = Array.isArray(values) ? values : [values]
        values = values.filter(i => i).map(i => ('' + i).trim())
        values = values.filter((ref, index) => values.indexOf(ref) === index)
        return values
    }

    protected static asUniquePhones(values: any): Array<number> {
        values = Array.isArray(values) ? values : [values]
        values = values.map(i => ('' + i).trim()).filter(phone => isValidPhone(phone))
        values = values.filter((ref, index) => values.indexOf(ref) === index)
        return values
    }
}