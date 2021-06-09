import {IMain} from "../../main/interfaces/MainInterface";
import {Modules} from "../components/modules/Modules";
import {Handler} from "../../main/path_handlers/MainHandler";

export class Bitrix24Handler extends Handler {
    findPragmaModule(moduleCode: string): Promise<IMain.IModule | null> {
        return Modules.getModules().findByCode(moduleCode)
    }
}