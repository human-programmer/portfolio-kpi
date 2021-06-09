import {IAmocrmLoaders} from "../../../../../../../workers/amocrm/interface";
import ILoadedUser = IAmocrmLoaders.ILoadedUser;
import {IUserInterface, UsersBuffer} from "../../../../../../../workers/amocrm/loaders/entities/buffer/UsersBuffer";
import {IInterfaceEntityBuffer} from "../../../../../../../workers/amocrm/loaders/entities/Buffer";
import {saveTestUniqueUsers} from "../../users/testUsersFabric";

const chai = require('chai')

export async function testUsersBuffer(): Promise<void> {
    describe('UsersBuffer', () => {
        it('findPragmaId', async () => {
            const {pragmaAccountId, interfaces} = await createTest()
            const buffer = await UsersBuffer.create(pragmaAccountId)
            check(interfaces, buffer)
        })
    })
}

async function createTest(): Promise<any> {
    const users = await saveTestUniqueUsers()
    return {
        pragmaAccountId: users[0].pragmaAccountId,
        interfaces: createUsersInterfaces(users)
    }
}

function createUsersInterfaces(users: Array<ILoadedUser>): Array<IUserInterface> {
    return users.map(en => {
        return {
            amocrmUserId: en.amocrmUserId,
            pragmaUserId: en.pragmaUserId,
        }
    })
}

function check(interfaces: Array<IUserInterface>, buffer: IInterfaceEntityBuffer): void {
    interfaces.forEach(en => {
        const pragmaId = buffer.findPragmaId(en.amocrmUserId)
        chai.assert(pragmaId === en.pragmaUserId)
    })
}