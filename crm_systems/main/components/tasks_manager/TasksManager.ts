import {IMain} from "../../interfaces/MainInterface";
import ITaskManager = IMain.ITaskManager;
import ITask = IMain.ITask;
import {IBasic} from "../../../../generals/IBasic";
import randomString = IBasic.randomString;

export abstract class Task implements ITask{
    private static lastId = 0
    readonly taskId: string;
    readonly executeTime: number
    private _executed: boolean = false

    constructor(executeTime: number) {
        this.executeTime = executeTime
        this.taskId = Task.createNewId()
    }

    async execute(): Promise<void> {
        this._executed = true
    }

    get executed(): boolean {
        return this._executed
    }

    get timeInterval(): number {
        const dif = this.executeTime - new Date().getTime()
        return dif <= 0 ? 0 : dif
    }

    private static createNewId(): string {
        return ++Task.lastId + '.' + randomString(5)
    }
}

export class TasksManager implements ITaskManager{
    readonly stack: Array<ITask> = []
    private handler: any
    private nextTaskHandler: any
    private timeout: any

    constructor() {}

    get size(): number {
        return this.stack.length
    }

    protected async runQueue (): Promise<void> {
        try{
            await this.taskHandler()
        } catch (e) {
            this.handler = null
            this.runQueue()
        }
    }

    private stopQueue(): void {
        this.handler = null
        this.nextTaskHandler(null)
    }

    addTask(task: IMain.ITask): void {
        this.stack.push(task)
        this.checkQueue()
    }

    removeTask(taskId: string): void {
        const task = this.stack.find(task => task.taskId === taskId)
        this.deleteFromStack(task)
        this.checkQueue()
    }

    private async taskHandler(): Promise<void> {
        if(this.handler) return;
        this.handler = this.taskHandler

        let task: ITask
        while (task = await this.nextTask())
            TasksManager.safeExecute(task)
    }

    private async nextTask(): Promise<ITask|null> {
        return new Promise(resolve => {
            this.nextTaskHandler = resolve
            this.checkQueue()
        })
    }

    private static safeExecute(task: ITask): void {
        try {
            typeof task.execute === 'function' && task.execute()
        } catch (e) {}
    }

    private checkQueue(): void {
        this.clearTimeOut()
        this.runQueue()
        const task = this.taskByMinTime
        task && this.nextTaskExecute(task)
        task || this.stopQueue()
    }

    private nextTaskExecute(task: ITask): void {
        this.clearTimeOut()
        this.createTimeout(task)
    }

    private clearTimeOut(): void {
        this.timeout && clearTimeout(this.timeout)
    }

    private createTimeout(task: ITask) : void {
        const interval = task.timeInterval
        if(!interval)
            return this.sendTaskToExecute(task)
        this.timeout = setTimeout(() => this.sendTaskToExecute(task), task.timeInterval)
    }

    private sendTaskToExecute(task: ITask): void {
        this.deleteFromStack(task)
        this.nextTaskHandler(task)
    }

    private deleteFromStack(task: ITask): void {
        const index = this.stack.indexOf(task)
        this.stack.splice(index, 1)
    }

    private get taskByMinTime(): ITask|false {
        let minTask: ITask|false
        this.stack.forEach(task => {
            if(!minTask || task.executeTime < minTask.executeTime)
                minTask = task
        })
        return minTask
    }
}