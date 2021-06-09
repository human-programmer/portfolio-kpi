import {IServer} from "../../intrfaces";
import IInputRequest = IServer.IInputRequest;
import IResult = IServer.IResult;
import {PragmaConductor} from "../pragma/PragmaConductor";
import {PWorkers} from "../../PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IUserStruct = IMain.IUserStruct;
import Result = IServer.Result;
import {IAmocrmLoaders} from "../../../workers/amocrm/interface";
import createInstallEventRequest = IAmocrmLoaders.createInstallEventRequest;
import RequestWorker = PWorkers.RequestWorker;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {LogJson} from "../../../generals/LogWriter";

export class AmocrmNodesConductor {
    static async execute(request: IInputRequest): Promise<IResult> {
        switch (request.method) {
            case 'get':
                return await AmocrmNodesConductor.getNodesHandler(request)
            case 'install':
                return await AmocrmNodesConductor.installNodeHandler(request)
            case 'update':
                return await AmocrmNodesConductor.changeNodeHandler(request)
            default:
                return await AmocrmNodesConductor.executeRequest(request)
        }
    }

    private static async getNodesHandler(request: IInputRequest): Promise<IResult> {
        const nodeModels = await AmocrmNodesConductor.getAmocrmNodes(request)
        return await AmocrmNodesConductor.addUsersToNodes(request, nodeModels)
    }

    protected static async installNodeHandler(request: IInputRequest): Promise<IResult> {
        const answer = await AmocrmNodesConductor.changeNodeHandler(request)
        const node = answer.result[0]
        await AmocrmNodesConductor.addLoaders(node)
        return answer
    }

    private static async addLoaders(node: IAmocrmNodeStruct): Promise<void> {
        if(typeof node !== 'object') return;
        try{
            const loadersAnswer = await AmocrmNodesConductor.sendInstallEvent(node)
            node.loaders = loadersAnswer.result
        } catch (e) {
            const error = Errors.internalError(e)
            LogJson.create(node).sendError(error, 'addLoaders')
        }
    }

    protected static async sendInstallEvent(node: IAmocrmNodeStruct): Promise<IResult> {
        const request = createInstallEventRequest(node)
        return await AmocrmNodesConductor.amoWorkerWorker.executeRequest(request)
    }

    protected static async changeNodeHandler(request: IInputRequest): Promise<IResult> {
        const answer = await AmocrmNodesConductor.executeRequest(request)
        return await AmocrmNodesConductor.addUsersToNodes(request, answer.result)
    }

    private static async getAmocrmNodes(request: IInputRequest): Promise<Array<IAmocrmNodeStruct>> {
        const amocrmRequest = PragmaConductor.createGetAmocrmNodesRequest(request)
        const answer = await AmocrmNodesConductor.executeRequest(amocrmRequest)
        return answer.result
    }

    private static async addUsersToNodes(request: IInputRequest, nodeModels: Array<IAmocrmNodeStruct>): Promise<IResult> {
        const users = await AmocrmNodesConductor.getUsersByNodes(request, nodeModels)
        AmocrmNodesConductor.addUsers(nodeModels, users)
        return new Result(nodeModels)
    }

    private static addUsers(nodeModels: Array<any>, users: Array<any>): void {
        nodeModels.forEach(nodeModel => nodeModel.user = users.find(i => i.pragma_user_id === nodeModel.pragma_user_id))
    }

    private static async getUsersByNodes(request: IInputRequest, nodes: Array<IAmocrmNodeStruct>): Promise<Array<IUserStruct>> {
        const usersId = nodes.map(node => node.pragma_user_id).filter(i => i)
        if(!usersId.length) return [];
        const usersRequest = PragmaConductor.createGetUsersRequest(request, usersId)
        const answer = await AmocrmNodesConductor.pragmaCrmWorker.executeRequest(usersRequest)
        if(answer.result.errror) throw answer.result
        return answer.result
    }

    private static async executeRequest(request: IInputRequest): Promise<IResult> {
        const answer = await AmocrmNodesConductor.amoQueueWorker.executeRequest(request)
        if(answer.result.error) throw answer.result
        return answer
    }

    protected static get pragmaCrmWorker(): RequestWorker {
        return PragmaWorkers.pragmaCrmWorker
    }

    protected static get amoWorkerWorker(): RequestWorker {
        return PragmaWorkers.amocrmWorkersWorker
    }

    protected static get amoQueueWorker(): RequestWorker {
        return PragmaWorkers.amocrmRequestWorker
    }
}