import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IModules = Bitrix24.IModules;
import {ModulesSchema} from "./ModulesSchema";
import IModule = Bitrix24.IModule;
import {MainModule} from "../../../main/components/modules/Modules";
import IBitrix24ModuleStruct = Bitrix24.IBitrix24ModuleStruct;


export class Module extends MainModule implements IModule {
    readonly bitrix24SecretKey: string
    readonly bitrix24IntegrationId: string
    readonly bitrix24HandlerPath: string

    constructor(model: any) {
        super(model);
        this.bitrix24SecretKey = model.bitrix24SecretKey || ''
        this.bitrix24IntegrationId = model.bitrix24IntegrationId || ''
        this.bitrix24HandlerPath = model.bitrix24HandlerPath || ''
    }

    get publicModel(): IBitrix24ModuleStruct {
        return Object.assign(super.publicModel, {
            bitrix24_integration_id: this.bitrix24IntegrationId,
            bitrix24_handler_path: this.bitrix24HandlerPath,
        })
    }

    toString(): string {
        return JSON.stringify(this.publicModel)
    }
}

class Buffer {
    private modules: Array<IModule> = []

    constructor() {
    }

    add (module: IModule) : void {
        this.modules.push(module)
    }

    find (pragmaModuleId: number) : IModule|null {
        return this.modules.find(module => module.pragmaModuleId === pragmaModuleId)
    }

    findByCode (code: string): IModule|null {
        return this.modules.find(module => module.code === code)
    }

    get ModuleForTests(): Array<IModule> {
        return this.modules
    }

    clearBufferForTest(): void {
        this.modules = []
    }
}


export class Modules extends ModulesSchema implements IModules {
    private buffer: Buffer

    private static _inst: Modules

    static getModules(): IModules {
        if(Modules._inst)
            return Modules._inst
        Modules._inst = new Modules()
        return Modules._inst
    }

    protected static _setInstForTest(modules: Modules): void {
        Modules._inst = modules
    }

    protected constructor() {
        super();
        this.buffer = new Buffer()
    }

    async getByCode(code: string): Promise<IModule> {
        return this.buffer.findByCode(code) || await this.findInDbByCode(code)
    }

    async findByCode(code: string): Promise<IModule|null> {
        return this.buffer.findByCode(code) || await this.findInDbByCode(code)
    }

    private async findInDbByCode (code: string): Promise<IModule|null> {
        const model = await this.getBitrix24ModuleModelByCode(code)
        return model ? this.createModuleInstance(model) : null
    }

    async getByPragmaId(pragmaModuleId: number): Promise<IModule> {
        return this.buffer.find(pragmaModuleId) || await this.findInDbById(pragmaModuleId)
    }

    private async findInDbById(pragmaModuleId: number): Promise<IModule|null>{
        const model = await this.getBitrix24ModuleModelById(pragmaModuleId)
        return this.createModuleInstance(model)
    }

    private createModuleInstance(model: any): IModule {
        const module = new Module(model)
        this.buffer.add(module)
        return module
    }

    protected get getBufferForTests(): Buffer {
        return this.buffer
    }
}