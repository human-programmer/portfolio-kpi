import {AmocrmLoader} from "../AmocrmLoader";
import {IAmocrmLoaders} from "../../interface";
import IPipeline = IAmocrmLoaders.IPipeline;
import IStatus = IAmocrmLoaders.IStatus;
import {PipelinesFabric} from "./PipelinesFabric";

export class PipelinesLoader extends AmocrmLoader {
    protected readonly route: string = '/api/v4/leads/pipelines'

    protected fetchEntities(entities: any): Array<IPipeline> {
        const pipelines = entities._embedded.pipelines
        return this.formattingPipelines(pipelines)
    }

    protected async saveEntities(entities: Array<IPipeline>): Promise<void> {
        await PipelinesFabric.save(entities)
    }

    private formattingPipelines(input: Array<any>): Array<IPipeline> {
        return input.map(i => this.formattingPipeline(i))
    }

    private formattingPipeline(pipeline: any): IPipeline {
        const pipeId = Number.parseInt(pipeline.id)
        return {
            amocrmAccountId: this.amocrmAccountId,
            amocrmPipelineId: pipeId,
            pragmaAccountId: this.pragmaAccountId,
            sort: Number.parseInt(pipeline.id),
            statuses: this.formattingStatuses(pipeId, pipeline._embedded.statuses || []),
            title: '' + pipeline.name
        }
    }

    private formattingStatuses(amocrmPipelineId: number, input: Array<any>): Array<IStatus> {
        return input.map(status => this.formattingStatus(amocrmPipelineId, status))
    }

    private formattingStatus(amocrmPipelineId: number, status: any): IStatus {
        return {
            amocrmAccountId: this.amocrmAccountId,
            amocrmPipelineId: amocrmPipelineId,
            amocrmStatusId: Number.parseInt(status.id),
            color: "" + status.color,
            sort: Number.parseInt(status.sort),
            title: "" + status.name
        }
    }
}