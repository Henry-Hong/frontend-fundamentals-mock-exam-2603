import { Equipment, ALL_EQUIPMENT } from '../consts';

export function isEquipment(value: string): value is Equipment {
  return ALL_EQUIPMENT.some(eq => eq === value);
}
