import {IMain} from "../../main/interfaces/MainInterface";
import IModule = IMain.IModule;
import {Handler} from "../../main/path_handlers/MainHandler";

export abstract class PragmaHandler extends Handler {
    findPragmaModule(moduleCode: string): Promise<IModule | null> {
        return null
    }
}