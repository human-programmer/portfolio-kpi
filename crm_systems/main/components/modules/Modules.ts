import {IMain} from "../../interfaces/MainInterface";
import IModule = IMain.IModule;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import IMainModuleStruct = IMain.IMainModuleStruct;

export class MainModule implements IModule {
    readonly freePeriodDays: number;
    readonly isFree: boolean;
    readonly code: string;
    readonly pragmaModuleId: number;

    constructor(model: any) {
        this.freePeriodDays = model.freePeriodDays || 0
        this.isFree = !this.freePeriodDays
        this.code = model.code
        this.pragmaModuleId = model.pragmaModuleId
    }

    saveMain(): Promise<void> {
        return new Promise<void>(res => res())
    }

    get publicModel(): IMainModuleStruct {
        return {
            pragma_module_id: this.pragmaModuleId,
            code: this.code,
            free_period_days: this.freePeriodDays,
            is_free: this.isFree
        }
    }
}

export class MainModules extends CRMDB {

}