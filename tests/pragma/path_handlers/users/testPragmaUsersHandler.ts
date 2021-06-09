import {TestUsers} from "../../users/TestUsers";
import {Pragma} from "../../../../crm_systems/pragma/instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;
import {IMain} from "../../../../crm_systems/main/interfaces/MainInterface";
import ICreateUserStruct = IMain.ICreateUserStruct;
import IUpdateUserStruct = IMain.IUpdateUserStruct;
import {IBasic} from "../../../../generals/IBasic";
import testError = IBasic.testError;
import {PragmaUsersHandler} from "../../../../crm_systems/pragma/path_handlers/users/PragmaUsersHandler";
import IUsersRequest = IMain.IUsersRequest;
import {TestAmocrmModules} from "../../../amocrm/modules/TestAmocrmModules";
import IUserStruct = IMain.IUserStruct;
import IUsersFilter = IMain.IUsersFilter;
import IUser = IMain.IUser;

const chai = require('chai')

export async function testPragmaUsersHandler(): Promise<void> {
    describe('PragmaUsersHandler', () => {
        describe('Errors', () => {

        })
        it('create', async () => {
            const phone = getUniquePhone()
            const email = getUniqueEmail()
            const createStruct = getUniqueStructToCreate(phone, email)
            const request = await createUpdateUsersRequest(createStruct, 'create')
            const answer = await PragmaUsersHandler.execute(request)
            chai.assert(answer.result.length === 1)
            chai.assert(!!answer.result[0].pragma_user_id)
        })
        it('create by phone', async () => {
            const phone = getUniquePhone()
            const createStruct = getUniqueStructToCreate(phone, '')
            const request = await createUpdateUsersRequest(createStruct, 'create')
            const answer = await PragmaUsersHandler.execute(request)
            chai.assert(answer.result.length === 1)
            chai.assert(!!answer.result[0].pragma_user_id)
        })
        it('create by email', async () => {
            const email = getUniqueEmail()
            const createStruct = getUniqueStructToCreate('', email)
            const request = await createUpdateUsersRequest(createStruct, 'create')
            const answer = await PragmaUsersHandler.execute(request)
            chai.assert(answer.result.length === 1)
            chai.assert(!!answer.result[0].pragma_user_id)
        })
        it('update', async () => {
            const {user0, user1, user2, user3} = await createUniqueUsers()
            const updateStruct = getUniqueUpdateStruct(user1)
            const request = await createUpdateUsersRequest(updateStruct, 'update')
            const answer = await PragmaUsersHandler.execute(request)
            compareModelUserAndUpdateStruct(answer.result[0], updateStruct)
        })
        it('get', async () => {
            const {user0, user1, user2, user3} = await createUniqueUsers()
            const filter = {
                pragma_user_id: user0.pragmaUserId,
                email: user1.email,
                phone: user2.phone,
            }
            const request = await getUserRequest(filter, 'get')
            const answer = await PragmaUsersHandler.execute(request)
            compareUsersAndModels([user0, user1, user2], answer.result)
        })
    })
}

function compareModelUserAndUpdateStruct(model: IUserStruct, updateStruct: IUpdateUserStruct): void {
    chai.assert(model.pragma_user_id === updateStruct.pragma_user_id)
    chai.assert(model.surname === updateStruct.surname)
    chai.assert(model.middle_name === updateStruct.middle_name)
    chai.assert(model.name === updateStruct.name)
    chai.assert(model.lang === updateStruct.lang)
}

async function createUpdateUsersRequest(data: any, method: any): Promise<IUsersRequest> {
    const testModules = new TestAmocrmModules()
    setTimeout(() => testModules.clearTestAll(), 2000)
    const module = await testModules.createTestDefaultModule()
    const query = {data, client_module_code: module.code}
    return request(query, method)
}

async function getUserRequest(filter: IUsersFilter, method: string): Promise<IUsersRequest> {
    const testModules = new TestAmocrmModules()
    setTimeout(() => testModules.clearTestAll(), 2000)
    const module = await testModules.createTestDefaultModule()
    const query = {filter, client_module_code: module.code}
    return request(query, method)
}

function request(query: any, method: any): IUsersRequest{
    return {
        method: method,
        crmName: 'amocrm',
        entity: 'users',
        query
    }
}

async function createUniqueUsers(): Promise<any> {
    const promises = [
        createUniqueUser(getUniquePhone()),
        createUniqueUser(getUniquePhone()),
        createUniqueUser(getUniquePhone()),
        createUniqueUser(getUniquePhone()),
    ]
    const users = await Promise.all((promises))
    return {
        user0: users[0],
        user1: users[1],
        user2: users[2],
        user3: users[3],
    }
}

async function createUniqueUser(phone: string = '', email: string = getUniqueEmail()): Promise<IPragmaUser> {
    const users = new TestUsers()
    setTimeout(() => users.clearTestAll(), 2000)
    const struct = getUniqueStructToCreate(phone, email)
    return await users.createUser(struct)
}

function getUniqueStructToCreate(phone: string = '', email: string = getUniqueEmail()): ICreateUserStruct {
    const unique = getUniqueId()
    return {
        email,
        lang: "lr",
        middle_name: "middle_name" + unique,
        name:  "name" + unique,
        phone,
        surname:  "surname" + unique,

    }
}

function compareUsersAndModels(users: Array<IUser>, models: Array<IUserStruct>): void {
    chai.assert(users.length === models.length)
    users.forEach(user => compareUserAndModel(user, models.find(model => model.pragma_user_id === user.pragmaUserId)))
}

function compareUserAndModel(user: IUser, model: IUserStruct): void {
    chai.assert(user.surname === model.surname)
    chai.assert(user.middleName === model.middle_name)
    chai.assert(user.lang === model.lang)
    chai.assert(user.name === model.name)
    chai.assert(user.email === model.email)
    chai.assert(user.phone === model.phone)
    chai.assert(user.pragmaUserId === model.pragma_user_id)
    chai.assert(user.confirmEmail === model.confirm_email)
}

function getUniqueEmail(): string {
    return getUniqueId() + '@test.test'
}

function getUniquePhone(): string {
    return getUniqueId()
}

function getUniqueId(): string {
    const id = Math.ceil((new Date().getTime() * Math.random()) << 3)
    return '' + Math.abs(id)
}

function getUniqueUpdateStruct(user: IPragmaUser): IUpdateUserStruct {
    const unique = getUniqueId()
    return {
        lang: "lr1",
        middle_name: "middle_name1" + unique,
        name:  "name1" + unique,
        pragma_user_id: user.pragmaUserId,
        surname:  "surname1" + unique,
    }
}