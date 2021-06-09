import {TestUsers} from "./TestUsers";
import {IBasic} from "../../../generals/IBasic";
import testError = IBasic.testError;
import Errors = IBasic.Errors;
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import ICreateUserStruct = IMain.ICreateUserStruct;
import IUpdateUserStruct = IMain.IUpdateUserStruct;
import {CRMDB} from "../../../generals/data_base/CRMDB";

const chai = require('chai')

export async function testPragmaUsers(): Promise<void> {
    describe('Pragma Users', () => {
        describe('Errors', () => {
            describe('Create', () => {
                it('Invalid email 0', async () => {
                    const struct = getUniqueStructToCreate('', 'qweqweqwe')
                    await testCreateError(struct, Errors.invalidEmailCode, 'Invalid email')
                })
                it('Invalid email 1', async () => {
                    const struct = getUniqueStructToCreate('', 'qweqwe@qwe')
                    await testCreateError(struct, Errors.invalidEmailCode, 'Invalid email')
                })
                it('Invalid email 2', async () => {
                    const struct = getUniqueStructToCreate('', 'qweqwe.qwe')
                    await testCreateError(struct, Errors.invalidEmailCode, 'Invalid email')
                })
                it('Invalid email 3', async () => {
                    const struct = getUniqueStructToCreate('', 'qweqwe@q w.e')
                    await testCreateError(struct, Errors.invalidEmailCode, 'Invalid email')
                })
                it('Exceeded the maximum size 256 characters', async () => {
                    const struct = getUniqueStructToCreate('', 'qweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqweqwe@qw.e')
                    await testCreateError(struct, Errors.invalidEmailCode, 'Exceeded the maximum size 256 characters')
                })
                it('Invalid phone 0', async () => {
                    const struct = getUniqueStructToCreate('1223qwe')
                    await testCreateError(struct, Errors.invalidPhoneCode, 'Invalid phone')
                })
                it('Invalid phone 1', async () => {
                    const struct = getUniqueStructToCreate('34345 345')
                    await testCreateError(struct, Errors.invalidPhoneCode, 'Invalid phone')
                })
                it('Exceeded the maximum size 18 characters', async () => {
                    const struct = getUniqueStructToCreate('33333333323423423423423423423234')
                    await testCreateError(struct, Errors.invalidPhoneCode, 'Exceeded the maximum size 18 characters')
                })
                it('Minimum phone size 4 characters', async () => {
                    const struct = getUniqueStructToCreate('123')
                    await testCreateError(struct, Errors.invalidPhoneCode, 'Minimum phone size 4 characters')
                })
                it('create double phone', async () => {
                    const phone = getUniquePhone()
                    const user = await createUniqueUser(phone)
                    const struct = getUniqueStructToCreate(phone)
                    await testCreateError(struct, Errors.duplicateErrorCode, 'Duplicate Error')
                })
                it('update double phone', async () => {
                    const user = await createUniqueUser(getUniquePhone())
                    const struct = getUniqueStructToCreate(user.phone)
                    await testCreateError(struct, Errors.duplicateErrorCode, 'Duplicate Error')
                })
                it('create double email', async () => {
                    const email = getUniqueEmail()
                    const user = await createUniqueUser(getUniquePhone(), email)
                    const struct = getUniqueStructToCreate(getUniquePhone(), email)
                    await testCreateError(struct, Errors.duplicateErrorCode, 'Duplicate Error')
                })
                it('update double email', async () => {
                    const user = await createUniqueUser(getUniquePhone(), getUniqueEmail())
                    const struct = getUniqueStructToCreate(getUniquePhone(), user.email)
                    await testCreateError(struct, Errors.duplicateErrorCode, 'Duplicate Error')
                })
            })
        })

        describe('Correct', () => {
            describe('create', () => {
                it('Without phone', async () => {
                    const struct = getUniqueStructToCreate()
                    chai.assert(!!struct.phone === false)
                    const user = await createUniqueUserByStruct(struct)
                    compareUserWithCreateStruct(user, struct)
                    await checkActualUser(user)
                })
                it('With phone 0', async () => {
                    const struct = getUniqueStructToCreate(getUniquePhone())
                    const user = await createUniqueUserByStruct(struct)
                    compareUserWithCreateStruct(user, struct)
                    await checkActualUser(user)
                })
                it('With phone 1', async () => {
                    const struct = getUniqueStructToCreate(getUniquePhone() + '  ')
                    const user = await createUniqueUserByStruct(struct)
                    chai.assert(user.phone === struct.phone.trim())
                    await checkActualUser(user)
                })
            })
            describe('update', () => {
                it('setPhone', async () => {
                    const user = await createUniqueUser()
                    chai.assert(user.phone === '')
                    await user.setPhone('123456')
                    chai.assert(user.phone === '123456')
                    await checkActualUser(user)
                })
                it('setConfirmEmail', async () => {
                    const user = await createUniqueUser()
                    chai.assert(user.confirmEmail === false)
                    await user.setConfirmEmail()
                    chai.assert(user.confirmEmail === true)
                    await checkActualUser(user)
                })
                it('update', async () => {
                    const user = await createUniqueUser()
                    const user2 = await new TestUsers().findUserById(user.pragmaUserId)
                    const updateStruct = getUniqueUpdateStruct(user)
                    await user.update(updateStruct)
                    notEqualsUsersAfterUpdate(user, user2)
                    await checkActualUserAfterUpdate(user2)
                })
            })
            describe('get', () => {
                describe('Buffer', () => {
                    it('Buffer by id', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserById(user0.pragmaUserId)
                        const resultUser2 = await testUsers.findUserById(user0.pragmaUserId)
                        const resultUser3 = await testUsers.findUserById(user0.pragmaUserId)
                        const resultUser4 = await testUsers.findUserById(user1.pragmaUserId)
                        const resultUser5 = await testUsers.findUserById(user1.pragmaUserId)
                        chai.assert(resultUser1 === resultUser2)
                        chai.assert(resultUser2 === resultUser3)
                        chai.assert(resultUser3 !== resultUser4)
                        chai.assert(resultUser4 === resultUser5)
                        chai.assert(testUsers.testBuffer.size === 2)
                    })
                    it('Buffer by email', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserByEmail(user0.email)
                        const resultUser2 = await testUsers.findUserByEmail(user0.email)
                        const resultUser3 = await testUsers.findUserByEmail(user0.email)
                        const resultUser4 = await testUsers.findUserByEmail(user1.email)
                        const resultUser5 = await testUsers.findUserByEmail(user1.email)
                        chai.assert(resultUser1 === resultUser2)
                        chai.assert(resultUser2 === resultUser3)
                        chai.assert(resultUser3 !== resultUser4)
                        chai.assert(resultUser4 === resultUser5)
                        chai.assert(testUsers.testBuffer.size === 2)
                    })
                    it('Buffer by phone', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserByPhone(user0.phone)
                        const resultUser2 = await testUsers.findUserByPhone(user0.phone)
                        const resultUser3 = await testUsers.findUserByPhone(user0.phone)
                        const resultUser4 = await testUsers.findUserByPhone(user1.phone)
                        const resultUser5 = await testUsers.findUserByPhone(user1.phone)
                        chai.assert(resultUser1 === resultUser2)
                        chai.assert(resultUser2 === resultUser3)
                        chai.assert(resultUser3 !== resultUser4)
                        chai.assert(resultUser4 === resultUser5)
                        chai.assert(testUsers.testBuffer.size === 2)
                    })
                })
                describe('find', () => {
                    it('findById', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserById(user0.pragmaUserId)
                        compareUsers(resultUser1, user0)
                    })
                    it('findByEmail', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserByEmail(user1.email)
                        compareUsers(resultUser1, user1)
                    })
                    it('findByPhone', async () => {
                        const {user0, user1, user2, user3} = await createUniqueTestUsers()
                        const testUsers = new TestUsers()
                        const resultUser1 = await testUsers.findUserByPhone(user2.phone)
                        compareUsers(resultUser1, user2)
                    })
                })
            })
        })
    })
}

async function checkActualUser(user: IPragmaUser): Promise<void> {
    const users = new TestUsers()
    const actualUser = await users.findUserById(user.pragmaUserId)
    chai.assert(user !== actualUser)
    chai.assert(user.pragmaUserId === user.pragmaUserId)
    chai.assert(user.email === user.email)
    chai.assert(user.confirmEmail === user.confirmEmail)
    chai.assert(user.phone === user.phone)
    chai.assert(user.name === user.name)
    chai.assert(user.surname === user.surname)
    chai.assert(user.middleName === user.middleName)
}

export async function createUniqueTestUsers(): Promise<any> {
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

async function createUniqueUserByStruct(struct: ICreateUserStruct): Promise<IPragmaUser> {
    const users = new TestUsers()
    setTimeout(() => users.clearTestAll(), 2000)
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

async function testCreateError(struct: ICreateUserStruct, code: number, message: string): Promise<void> {
    const testUsers = new TestUsers()
    try{
        await testUsers.createUser(struct)
        chai.assert(false)
    } catch (error) {
        testError(error, code, message)
    } finally {
        await testUsers.clearTestAll()
    }
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

function compareUserWithCreateStruct(user: IPragmaUser, model: ICreateUserStruct): void {
    chai.assert(model.phone === user.phone)
    chai.assert(model.email === user.email)
    chai.assert(model.name === user.name)
    chai.assert(model.surname === user.surname)
    chai.assert(model.middle_name === user.middleName)
    chai.assert(model.lang === user.lang)
}

async function checkActualUserAfterUpdate(user: IPragmaUser):Promise<void> {
    const users = new TestUsers()
    const actualUser = await users.findUserById(user.pragmaUserId)
    notEqualsUsersAfterUpdate(user, actualUser)
}
function notEqualsUsersAfterUpdate(user1: IPragmaUser, user2: IPragmaUser): void {
    chai.assert(user2 !== user1)
    chai.assert(user2.phone === user1.phone)
    chai.assert(user2.email === user1.email)
    chai.assert(user2.confirmEmail === user1.confirmEmail)
    chai.assert(user2.name !== user1.name)
    chai.assert(user2.surname !== user1.surname)
    chai.assert(user2.middleName !== user1.middleName)
    chai.assert(user2.lang !== user1.lang)
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
function compareUsers(user1: IPragmaUser, user2: IPragmaUser): void {
    chai.assert(user2.pragmaUserId === user1.pragmaUserId)
    chai.assert(user2.phone === user1.phone)
    chai.assert(user2.email === user1.email)
    chai.assert(user2.confirmEmail === user1.confirmEmail)
    chai.assert(user2.name === user1.name)
    chai.assert(user2.surname === user1.surname)
    chai.assert(user2.middleName === user1.middleName)
    chai.assert(user2.lang === user1.lang)
}