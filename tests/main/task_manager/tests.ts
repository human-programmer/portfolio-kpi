import {Task, TasksManager} from "../../../crm_systems/main/components/tasks_manager/TasksManager";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import ITask = IMain.ITask;
import ITaskManager = IMain.ITaskManager;
const chai = require('chai')

class TestTask extends Task {
    async execute(): Promise<void> {
        await super.execute()
        const currentTime = new Date().getTime()
        chai.assert(currentTime - this.executeTime > 0)
        chai.assert(currentTime - this.executeTime < 50)
    }
}

class TestTaskManager extends TasksManager {
    readonly stack: Array<ITask> = []
}

export async function testTaskManager(): Promise<void> {
    describe('Main TaskManager', () => {
        it('addTask', async () => {
            const taskManager = new TestTaskManager()
            const delayInterval = 50
            const stack_size = 100
            const tasks: Array<ITask> = []

            for(let i = 0; i < stack_size; ++i){
                const task = createUniqueTask(delayInterval)
                tasks.push(task)
                checkUniqueTask(taskManager, task, delayInterval)
            }

            chai.assert(taskManager.size === stack_size)
            await checkQueueExecuted(taskManager, delayInterval + 100)
            checkTasksExecuted(tasks)
        })
        it('removeTask', async () => {
            const taskManager = new TestTaskManager()
            const delayInterval = 50
            const stack_size = 100
            const tasks: Array<ITask> = []

            for(let i = 0; i < stack_size; ++i){
                const task = createUniqueTask(delayInterval)
                tasks.push(task)
                taskManager.addTask(task)
            }
            chai.assert(taskManager.size === stack_size)
            tasks.forEach(task => taskManager.removeTask(task.taskId))
            await checkQueueNotExecuted(taskManager, delayInterval + 200)
            checkTasksNotExecuted(tasks)
        })
    })
}

function createUniqueTask(interval: number = 100): ITask {
    return new TestTask(new Date().getTime() + interval)
}

async function checkUniqueTask(manager: ITaskManager, task: ITask, interval: number): Promise<void> {
    manager.addTask(task)
    ;(interval > 0 ) && chai.assert(task.executed === false)
    ;(interval > 0) || chai.assert(task.executed === true)
    await new Promise(resolve => setTimeout(() => {
        chai.assert(task.executed === true)
        resolve(null)
    }, interval + 50))
}

async function checkQueueExecuted(taskManager: ITaskManager, delayInterval: number): Promise<void> {
    await await new Promise(resolve => setTimeout(() => {
        chai.assert(taskManager.size === 0)
        resolve(null)
    }, delayInterval + 50))
}

function checkTasksExecuted(tasks: Array<ITask>): void {
    tasks.forEach(task => chai.assert(task.executed === true))
}

async function checkQueueNotExecuted(taskManager: ITaskManager, delayInterval: number): Promise<void> {
    await await new Promise(resolve => setTimeout(() => {
        chai.assert(taskManager.size === 0)
        resolve(null)
    }, delayInterval + 50))
}

function checkTasksNotExecuted(tasks: Array<ITask>): void {
    tasks.forEach(task => chai.assert(task.executed === false))
}