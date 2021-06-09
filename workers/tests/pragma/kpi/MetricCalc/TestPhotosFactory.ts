import {IKPI} from "../../../../pragma/kpi/IKPI";
import IPhoto = IKPI.IPhoto;
import StageFieldName = IKPI.StageFieldName;
import IAtom = IKPI.IAtom;
import {Func} from "../../../../../generals/Func";
import assembleAtomId = IKPI.assembleAtomId;
import {Generals} from "../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {TestKpiFactory} from "../TestKpiFactory";
import ValueName = IKPI.ValueName;

export class TestPhotosFactory {
    static uniqueEmptyPhotos(quantity: number, entity_type?: EntityGroup, atom?: IAtom): IPhoto[] {
        const photos: IPhoto[] = []
        for(let i = 0; i < quantity; i++)
            photos.push(TestPhotosFactory.uniqueEmptyPhoto(entity_type, atom))
        return photos
    }
    static uniqueEmptyPhoto(entity_type?: EntityGroup, atom?: IAtom): IPhoto {
        const atom2: any = atom || {}
        atom = TestPhotosFactory.uniqueAtom(atom2)
        entity_type = entity_type || TestKpiFactory.randomEntityGroup()
        return {
            atom_id: assembleAtomId(atom),
            counters_values: {},
            entity_type,
            is_general: true,
            metric_values: {},
            pipeline_id: atom.pipeline_id,
            status_id: atom.status_id,
            time: 1,
            user_id: atom.user_id,
            values_lists: {}
        }
    }

    static uniqueAtom({user_id, status_id, pipeline_id}): IAtom {
        user_id = !user_id && user_id !== 0 ? Func.randomNumber(20) : user_id
        status_id = !status_id && status_id !== 0 ? Func.randomNumber(20) : status_id
        pipeline_id = !pipeline_id && pipeline_id !== 0 ? Func.randomNumber(20) : pipeline_id
        return {user_id, status_id, pipeline_id}
    }

    static addCounters(photos: IPhoto[], counterName: StageFieldName, counter: number = 1): void {
        photos.forEach(photo => photo.counters_values[counterName] = counter)
    }

    static addListValues(photos: IPhoto[], listName: StageFieldName, listLength: number, values: number[]|number = 1): void {
        values = Array.isArray(values) ? values : [values]
        const length = values.length
        photos.forEach(photo => {
            photo.values_lists[listName] = new Array(listLength).fill(0).map((i, index) => values[index % length])
        })
    }

    static addMetricValues(photos: IPhoto[], valueName: ValueName, listLength: number, values: number[]|number = 1): void {
        values = Array.isArray(values) ? values : [values]
        const length = values.length
        photos.forEach(photo => {
            photo.metric_values[valueName] = new Array(listLength).fill(0).map((i, index) => values[index % length])
        })
    }
}