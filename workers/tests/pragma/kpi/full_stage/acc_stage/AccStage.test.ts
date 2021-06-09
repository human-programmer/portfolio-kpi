import {checkTestAccStagePhotos, TestAccStage, TestAccStageFactory} from "./TestAccStageFactory";
import {AccStage, EntitiesStages} from "../../../../../pragma/kpi/full_stage/AccStage";
import {compareTestFieldActions, TestStatusTypes} from "../entity_stage/TestEntityStageFactory";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {getTestTimes} from "../entitiesStage/TestEntitiesStagesFactory";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import StageFieldName = IKPI.StageFieldName;

const chai = require('chai')

const {
    timeMoment,
    dayTimeMoment,
    eventTimeMoment,
    nextInterval,
} = getTestTimes()

let counter = 100

export async function testAccStage(): Promise<void> {
    describe('AccStage', () => {
        it('constructor', () => {
            const emptyStruct = TestAccStageFactory.uniqueEmptyAccStageStruct()
            const accStage = new AccStage(emptyStruct, new TestStatusTypes())
            chai.assert(accStage.account_id === emptyStruct.account_id)
            chai.assert(accStage.last_day === emptyStruct.last_day)
            chai.assert(accStage.start_day === emptyStruct.start_day)
            chai.assert(accStage.entity_stages[EntityGroup.leads] instanceof EntitiesStages)
            chai.assert(accStage.entity_stages[EntityGroup.contacts] instanceof EntitiesStages)
            chai.assert(accStage.entity_stages[EntityGroup.companies] instanceof EntitiesStages)
            chai.assert(accStage.entity_stages[EntityGroup.customers] instanceof EntitiesStages)
        })

        it('add/get field', () => {
            const quantity = 1000
            const accStage = new TestAccStage([], quantity)
            const fieldStage = TestAccStageFactory.uniqueAccEntityFieldStage()
            accStage.addEntityFieldStage(fieldStage)
            const actualStage = accStage.getFieldAction(fieldStage)
            compareTestFieldActions(fieldStage, actualStage)
        })

        it('createNewStruct', () => {
            const leads = TestAccStage.createNewStruct(EntityGroup.leads)
            const contacts = TestAccStage.createNewStruct(EntityGroup.contacts)
            const companies = TestAccStage.createNewStruct(EntityGroup.companies)
            const customers = TestAccStage.createNewStruct(EntityGroup.customers)
            chai.assert(leads.group_name === EntityGroup.leads)
            chai.assert(contacts.group_name === EntityGroup.contacts)
            chai.assert(companies.group_name === EntityGroup.companies)
            chai.assert(customers.group_name === EntityGroup.customers)
        })

        describe('photos', () => {
            it('only created', () => {
                const quantity = 1000
                const accStage = new TestAccStage([], quantity)
                checkTestAccStagePhotos(accStage, [], quantity, timeMoment)
            })
            it('created and deleted', () => {
                const quantity = 1000
                const fieldNames = [StageFieldName.deleted]
                const accStage = new TestAccStage(fieldNames, quantity)
                checkTestAccStagePhotos(accStage, fieldNames, quantity, timeMoment + nextInterval)
            })
            it('entities_counter', () => {
                const quantity = 1000
                const accStage = new TestAccStage([], quantity)
                checkTestAccStagePhotos(accStage, [StageFieldName.entities_counter], quantity, timeMoment)
            })
            it('price', () => {
                const quantity = 1000
                const fieldNames = [StageFieldName.price]
                const accStage = new TestAccStage(fieldNames, quantity)
                checkTestAccStagePhotos(accStage, fieldNames, quantity, timeMoment + nextInterval)
            })
            it('price with responsible', () => {
                const quantity = 1000
                const fieldNames = [StageFieldName.price, StageFieldName.responsible_user_id]
                const accStage = new TestAccStage(fieldNames, quantity)
                checkTestAccStagePhotos(accStage, fieldNames, quantity, timeMoment + nextInterval)
            })
            it('price with status', () => {
                const quantity = 1000
                const fieldNames = [StageFieldName.price, StageFieldName.status]
                const accStage = new TestAccStage(fieldNames, quantity)
                checkTestAccStagePhotos(accStage, fieldNames, quantity, timeMoment + nextInterval)
            })
            it('price with status and responsible', () => {
                const quantity = 1000
                const fieldNames = [StageFieldName.responsible_user_id]
                const accStage = new TestAccStage(fieldNames, quantity)
                checkTestAccStagePhotos(accStage, fieldNames, quantity, timeMoment + nextInterval)
            })
        })
    })
}

