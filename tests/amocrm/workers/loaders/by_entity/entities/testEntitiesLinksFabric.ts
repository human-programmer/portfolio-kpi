import {IAmoEntityId, IAmoEntityLinks, ILoadedEntity} from "../../../../../../workers/amocrm/loaders/entities/EntitiesFabric";
import {saveTestCompanies, saveTestContacts, saveTestLeads} from "./testEntitiesFabric";
import {Generals} from "../../../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import {EntitiesLinksFabric} from "../../../../../../workers/amocrm/loaders/entities/EntitiesLinksFabric";
import {Amocrm} from "../../../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {TestFabric} from "../../../TestFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";

const chai = require('chai')

export async function testEntitiesLinksFabric(): Promise<void> {
    describe('EntitiesLinksFabric', () => {
        it('save', async () => {
            const node = await TestFabric.uniqueNodeStruct()
            const expectPragmaLinks = await saveLinks(node)
            await checkActualLinks(expectPragmaLinks)
        })
    })
}

async function saveLinks(node: IAmocrmNodeStruct): Promise<Array<Array<number>>> {
    await safeDeleteLinks()
    const {amocrmLinks, pragmaLinks} = await createLinks(node.account.pragma_account_id)
    const fabric = await EntitiesLinksFabric.create(node.account.pragma_account_id)
    await fabric.save(amocrmLinks)
    return pragmaLinks
}

async function safeDeleteLinks(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.entitiesToEntitiesSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}

async function createLinks(pragmaAccountId: number): Promise<any> {
    const entities = await createEntities(pragmaAccountId)
    return {
        amocrmLinks: amocrmLinks(entities),
        pragmaLinks: pragmaLinks(entities)
    }
}

function amocrmLinks(entities: Array<Array<ILoadedEntity>>): Array<IAmoEntityLinks> {
    return entities[0].map(i => addLinks(i, AmocrmEntityGroup.leads, AmocrmEntityGroup.contacts, entities[1]))
}

function pragmaLinks(entities: Array<Array<ILoadedEntity>>): Array<Array<number>> {
    return [].concat(...entities[0].map(i => pragmaLinksTarget(i, entities[1])))
}

function pragmaLinksTarget(targetEntity: ILoadedEntity, entities: Array<ILoadedEntity>): Array<Array<number>> {
    return [...entities.map(i => [targetEntity.pragmaEntityId, i.pragmaEntityId])]
}

async function createEntities(pragmaAccountId: number): Promise<Array<Array<ILoadedEntity>>> {
    return await Promise.all([
        saveTestLeads(51, pragmaAccountId),
        saveTestContacts(51, pragmaAccountId),
    ])
}

function addLinks(targetEntity: ILoadedEntity, target_type: AmocrmEntityGroup, entities_type: AmocrmEntityGroup, entities: Array<ILoadedEntity>): IAmoEntityLinks {
    const links = entities.map(i => {
        return {
            id: i.amocrmEntityId,
            type: entities_type
        }
    })
    return {
        links,
        mainId: {id: targetEntity.amocrmEntityId, type: target_type}
    }
}

async function checkActualLinks(expectLinks: Array<Array<number>>): Promise<void> {
    const actualLinks = await getActualPragmaLinks()
    chai.assert(actualLinks.length === expectLinks.length)
    const actual = findUndefinedLink(actualLinks, expectLinks)
    const expect = findUndefinedLink(expectLinks, actualLinks)
    chai.assert(!actual)
    chai.assert(!expect)
}

function findUndefinedLink(sets0: Array<Array<number>>, sets1: Array<Array<number>>): boolean{
    return !!sets0.find(i0 => !sets1.find(i1 => compareLinks(i0, i1)))
}

async function getActualPragmaLinks(): Promise<Array<Array<number>>> {
    const links = await queryActualPragmaLinks()
    const linkIds = links.map(i => [Number.parseInt(i.first_id), i.second_id])
    return onlyUniqueLinks(linkIds)
}

function onlyUniqueLinks(links: Array<Array<number>>): Array<Array<number>> {
    return links.filter((i, index) => {
        const link = links.find(a => compareLinks(i, a))
        if(!link) return true
        const actualIndex = links.indexOf(link)
        return index === actualIndex
    })
}
function compareLinks(i0: Array<number>, i1: Array<number>): boolean {
    return (i0[0] == i1[0] && i0[1] == i1[1]) || (i0[1] == i1[0] && i0[0] == i1[1])
}

async function queryActualPragmaLinks(): Promise<Array<any>> {
    const sql = `SELECT
                    first_id,
                    second_id
                FROM ${CRMDB.entitiesToEntitiesSchema} 
                WHERE 1`
    return await CRMDB.query(sql)
}