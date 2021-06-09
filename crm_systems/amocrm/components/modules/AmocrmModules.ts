import {MainModule, MainModules} from "../../../main/components/modules/Modules";
import {Amocrm} from "../../interface/AmocrmInterfaces";
import IModules = Amocrm.IModules;
import IModule = Amocrm.IModule;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;

export class AmocrmModule extends MainModule implements IModule {
    readonly amocrmCode: string;
    readonly amocrmIntegrationId: string;
    readonly amocrmSecretKey: string;

    constructor(model) {
        super(model)
        this.amocrmCode = model.amocrmCode
        this.amocrmIntegrationId = model.amocrmIntegrationId
        this.amocrmSecretKey = model.amocrmSecretKey
    }

    get publicModel(): any {
        const pragmaModel = super.publicModel
        const interfaceModel = {
            amocrm_code: this.amocrmCode,
            amocrm_integration_id: this.amocrmIntegrationId,
        }
        return Object.assign(pragmaModel, interfaceModel)
    }
}

export class Buffer {
    readonly buffer: Array<IModule> = []

    constructor() {
    }

    add(module: IModule): void {
        this.buffer.push(module)
    }

    find (pragmaModuleId: number): IModule|null {
        // @ts-ignore
        pragmaModuleId = Number.parseInt(pragmaModuleId)
        return this.buffer.find(module => module.pragmaModuleId === pragmaModuleId)
    }

    findByCode (code: string): IModule|null {
        return this.buffer.find(module => module.code === code)
    }

    findByAmocrmId (integrationId: string): IModule|null {
        return this.buffer.find(module => module.amocrmIntegrationId === integrationId)
    }

    get size(): number {
        return this.buffer.length
    }
}

class AmocrmModulesSchema extends CRMDB {

    static async find(pragma_module_id: number): Promise<object|null> {
        const condition = `${super.modulesSchema}.id = '${pragma_module_id}'`
        return await AmocrmModulesSchema.singleSelect(condition)
    }

    static async findById(integrationId: string): Promise<object|null> {
        const condition = `${super.amocrmModulesSchema}.integration_id = '${integrationId}'`
        return await AmocrmModulesSchema.singleSelect(condition)
    }

    static async findByCode(code: string): Promise<object|null> {
        const condition = `${super.modulesSchema}.code = '${code}'`
        return await AmocrmModulesSchema.singleSelect(condition)
    }

    private static async singleSelect(condition: string): Promise<object|null> {
        const sql = AmocrmModulesSchema.sql(condition)
        const result = await super.query(sql)
        return result[0] || null
    }

    private static sql (condition: string): string {
        const amocrm = CRMDB.amocrmModulesSchema
        const pragma = CRMDB.modulesSchema
        return `SELECT 
                    ${pragma}.id AS pragmaModuleId,
                    ${pragma}.code AS code,
                    ${pragma}.free_period_days AS freePeriodDays,
                    ${amocrm}.code AS amocrmCode,
                    ${amocrm}.integration_id AS amocrmIntegrationId,
                    ${amocrm}.secret_key AS amocrmSecretKey
                FROM ${amocrm} 
                    INNER JOIN ${pragma} ON ${pragma}.id = ${amocrm}.pragma_id
                WHERE ${condition}`
    }
}

export class AmocrmModules extends MainModules implements IModules{
    private static _instance: AmocrmModules
    protected buffer: Buffer

    static get self (): AmocrmModules {
        if(AmocrmModules._instance)
            return AmocrmModules._instance
        AmocrmModules._instance = new AmocrmModules()
        return AmocrmModules._instance
    }

    protected constructor() {
        super()
        this.buffer = new Buffer()
    }

    async findByCode(code: string): Promise<Amocrm.IModule | null> {
        return this.buffer.findByCode(code) || await this.findInDbByCode(code)
    }

    private async findInDbByCode(code: string): Promise<IModule|null> {
        const model = await AmocrmModulesSchema.findByCode(code)
        return model ? this._createModuleInstance(model) : null
    }

    async findByAmocrmId(integrationId: string): Promise<Amocrm.IModule | null> {
        return this.buffer.findByAmocrmId(integrationId) || await this.findInDbById(integrationId)
    }

    private async findInDbById(integrationId: string): Promise<IModule|null> {
        const model = await AmocrmModulesSchema.findById(integrationId)
        return model ? this._createModuleInstance(model) : null
    }

    async getModule(pragmaModuleId: number): Promise<Amocrm.IModule> {
        return this.buffer.find(pragmaModuleId) || await this.getFromDb(pragmaModuleId)
    }

    private async getFromDb(pragmaModuleId: number): Promise<IModule> {
        const model = await AmocrmModulesSchema.find(pragmaModuleId)
        if(!model)
            throw Errors.invalidRequest('Module not found "' + pragmaModuleId + '"')
        return model ? this._createModuleInstance(model) : null
    }

    protected _createModuleInstance(model: object): IModule {
        const module = new AmocrmModule(model)
        this.buffer.add(module)
        return module
    }
}