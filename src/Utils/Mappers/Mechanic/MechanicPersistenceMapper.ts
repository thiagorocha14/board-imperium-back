import { Mechanic } from '../../../Domain/Mechanic/Mechanic.js';
import { MechanicEntity } from '../../../Persistence/Mechanic/MechanicEntity.js';

export function toMechanic(entity: MechanicEntity): Mechanic {
    return Mechanic.rehydrate(entity);
}
