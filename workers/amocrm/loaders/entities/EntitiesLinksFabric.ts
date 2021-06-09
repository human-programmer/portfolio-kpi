import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IAmoEntityId, IAmoEntityLinks} from "./EntitiesFabric";
import {Generals} from "../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;


interface IPragmaLink {
    readonly mainId: number
    readonly links: Array<number>
}

interface IEntityInterface {
    readonly amocrmEntityId: number
    readonly amocrmEntityType: AmocrmEntityGroup
    readonly pragmaEntityId: number
}

export class EntitiesLinksFabric extends BasicDataBase {
    private readonly interfaces: Array<IEntityInterface>

    static async create(pragmaAccountId: number): Promise<EntitiesLinksFabric> {
        const interfaces = await EntitiesLinksFabric.getAllInterfaces(pragmaAccountId)
        return new EntitiesLinksFabric(interfaces)
    }

    constructor(interfaces: Array<IEntityInterface>) {
        super()
        this.interfaces = interfaces
    }

    private static async getAllInterfaces(pragmaAccountId: number): Promise<Array<IEntityInterface>> {
        const sql = `SELECT
                        entity_id as amocrmEntityId,
                        type as amocrmEntityType,
                        pragma_entity_id as pragmaEntityId
                    FROM ${CRMDB.amocrmEntitiesSchema} 
                    WHERE pragma_account_id = ${pragmaAccountId}`
        return await BasicDataBase.query(sql, [], 'EntitiesLinksFabric -> queryInterfaces')
    }

    async save(links: Array<IAmoEntityLinks>): Promise<void> {
        const pragmaLinks = await this.convertToPragmaLink(links)
        const pieces = BasicDataBase.toSplit(pragmaLinks, 50)
        await Promise.all(pieces.map(i => EntitiesLinksFabric.savePiece(i)))
    }

    private async convertToPragmaLink(links: Array<IAmoEntityLinks>): Promise<Array<IPragmaLink>> {
        await this.addPragmaEntityIds(links)
        return EntitiesLinksFabric.createPragmaLinks(links)
    }

    private async addPragmaEntityIds(links: Array<IAmoEntityLinks>): Promise<void> {
        const ids = [].concat(...links.map(i => EntitiesLinksFabric.fetchLinks(i)))
        await this.addPragmaId(ids)
    }

    private static fetchLinks(link: IAmoEntityLinks): Array<IAmoEntityId> {
        return [link.mainId, ...link.links]
    }

    private async addPragmaId(amoIds: Array<IAmoEntityId>) : Promise<any> {
        amoIds.forEach((id: any) => {
            const i = this.interfaces.find(i => id.id == i.amocrmEntityId && id.type == i.amocrmEntityType)
            if(i) id.pragmaEntityId = i.pragmaEntityId
        })
    }

    private static createPragmaLinks(links: Array<IAmoEntityLinks>): Array<IPragmaLink> {
        return links.map(i => EntitiesLinksFabric.createPragmaLink(i)).filter(i => i)
    }

    private static createPragmaLink(link: IAmoEntityLinks): IPragmaLink|null {
        const mainId = link.mainId.pragmaEntityId
        if(!mainId) return null
        return {
            mainId: mainId,
            links: link.links.map(i => i.pragmaEntityId).filter(i => i)
        }
    }

    private static async savePiece(pragmaLinks: Array<IPragmaLink>): Promise<void> {
        await EntitiesLinksFabric.clearOldLinks(pragmaLinks)
        const links = EntitiesLinksFabric.convertPragmaLinks(pragmaLinks)
        await EntitiesLinksFabric.insertLinks(links)
    }

    private static async clearOldLinks(pragmaLinks: Array<IPragmaLink>): Promise<void> {
        const condition = pragmaLinks.map(i => `first_id = ${i.mainId} OR second_id = ${i.mainId}`).join(' OR ')
        if(!condition) return;
        const sql = `DELETE FROM ${CRMDB.entitiesToEntitiesSchema} WHERE ${condition}`
        await EntitiesLinksFabric.query(sql, [], 'EntitiesLinksFabric -> clearOldLinks')
    }

    private static convertPragmaLinks(pragmaLinks: Array<IPragmaLink>): Array<Array<number>> {
        const result = [].concat(...pragmaLinks.map(i => EntitiesLinksFabric.convertPragmaLink(i)))
        return EntitiesLinksFabric.onlyUniqueLinks(result)
    }

    private static onlyUniqueLinks(links: Array<Array<number>>): Array<Array<number>> {
        return links.filter((i, index) => {
            const link = links.find(a => EntitiesLinksFabric.compareLinks(i, a))
            if(!link) return true
            const actualIndex = links.indexOf(link)
            return index === actualIndex
        })
    }

    private static convertPragmaLink(pragmaLink: IPragmaLink): Array<Array<number>> {
        return pragmaLink.links.map(i => {
            return [pragmaLink.mainId, i]
        })
    }

    private static compareLinks(i0: Array<number>, i1: Array<number>): boolean {
        return (i0[0] == i1[0] && i0[1] == i1[1]) || (i0[1] == i1[0] && i0[0] == i1[1])
    }

    private static async insertLinks(links: Array<Array<number>>): Promise<void> {
        const pieces = EntitiesLinksFabric.toSplit(links)
        await Promise.all(pieces.map(i => EntitiesLinksFabric.insertPieceLinks(i)))
    }

    private static async insertPieceLinks(links: Array<Array<number>>): Promise<void> {
        const values = links.map(link => `(${link[0]}, ${link[1]})`).join(',')
        if(!values) return;
        const sql = `INSERT INTO ${CRMDB.entitiesToEntitiesSchema} (first_id, second_id) 
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE 
                        first_id = VALUES(first_id),
                        second_id = VALUES(second_id)`
        await EntitiesLinksFabric.query(sql, [], 'EntitiesLinksFabric -> insertPieceLinks')
    }
}