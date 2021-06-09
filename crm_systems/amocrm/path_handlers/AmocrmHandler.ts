import {IMain} from "../../main/interfaces/MainInterface";
import {AmocrmModules} from "../components/modules/AmocrmModules";
import {Handler} from "../../main/path_handlers/MainHandler";


export abstract class AmocrmHandler extends Handler {
    findPragmaModule(moduleCode: string): Promise<IMain.IModule | null> {
        return AmocrmModules.self.findByCode(moduleCode)
    }
}
