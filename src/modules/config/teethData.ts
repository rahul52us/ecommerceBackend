export interface ToothData {
  id: string;
  name: string;
  fdi: string;
  universal: string;
  palmer: string;
  position: 'upper' | 'lower';
  side: 'left' | 'right';
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
}

export const adultTeeth: ToothData[] = [
  // Upper Right (patient's right)
  { id: '18', name: 'Right Upper Third Molar', fdi: '18', universal: '1', palmer: '8', position: 'upper', side: 'right', type: 'molar' },
  { id: '17', name: 'Right Upper Second Molar', fdi: '17', universal: '2', palmer: '7', position: 'upper', side: 'right', type: 'molar' },
  { id: '16', name: 'Right Upper First Molar', fdi: '16', universal: '3', palmer: '6', position: 'upper', side: 'right', type: 'molar' },
  { id: '15', name: 'Right Upper Second Premolar', fdi: '15', universal: '4', palmer: '5', position: 'upper', side: 'right', type: 'premolar' },
  { id: '14', name: 'Right Upper First Premolar', fdi: '14', universal: '5', palmer: '4', position: 'upper', side: 'right', type: 'premolar' },
  { id: '13', name: 'Right Upper Canine', fdi: '13', universal: '6', palmer: '3', position: 'upper', side: 'right', type: 'canine' },
  { id: '12', name: 'Right Upper Lateral Incisor', fdi: '12', universal: '7', palmer: '2', position: 'upper', side: 'right', type: 'incisor' },
  { id: '11', name: 'Right Upper Central Incisor', fdi: '11', universal: '8', palmer: '1', position: 'upper', side: 'right', type: 'incisor' },
  
  // Upper Left (patient's left)
  { id: '21', name: 'Left Upper Central Incisor', fdi: '21', universal: '9', palmer: '1', position: 'upper', side: 'left', type: 'incisor' },
  { id: '22', name: 'Left Upper Lateral Incisor', fdi: '22', universal: '10', palmer: '2', position: 'upper', side: 'left', type: 'incisor' },
  { id: '23', name: 'Left Upper Canine', fdi: '23', universal: '11', palmer: '3', position: 'upper', side: 'left', type: 'canine' },
  { id: '24', name: 'Left Upper First Premolar', fdi: '24', universal: '12', palmer: '4', position: 'upper', side: 'left', type: 'premolar' },
  { id: '25', name: 'Left Upper Second Premolar', fdi: '25', universal: '13', palmer: '5', position: 'upper', side: 'left', type: 'premolar' },
  { id: '26', name: 'Left Upper First Molar', fdi: '26', universal: '14', palmer: '6', position: 'upper', side: 'left', type: 'molar' },
  { id: '27', name: 'Left Upper Second Molar', fdi: '27', universal: '15', palmer: '7', position: 'upper', side: 'left', type: 'molar' },
  { id: '28', name: 'Left Upper Third Molar', fdi: '28', universal: '16', palmer: '8', position: 'upper', side: 'left', type: 'molar' },
  
  // Lower Left (patient's left)
  { id: '38', name: 'Left Lower Third Molar', fdi: '38', universal: '17', palmer: '8', position: 'lower', side: 'left', type: 'molar' },
  { id: '37', name: 'Left Lower Second Molar', fdi: '37', universal: '18', palmer: '7', position: 'lower', side: 'left', type: 'molar' },
  { id: '36', name: 'Left Lower First Molar', fdi: '36', universal: '19', palmer: '6', position: 'lower', side: 'left', type: 'molar' },
  { id: '35', name: 'Left Lower Second Premolar', fdi: '35', universal: '20', palmer: '5', position: 'lower', side: 'left', type: 'premolar' },
  { id: '34', name: 'Left Lower First Premolar', fdi: '34', universal: '21', palmer: '4', position: 'lower', side: 'left', type: 'premolar' },
  { id: '33', name: 'Left Lower Canine', fdi: '33', universal: '22', palmer: '3', position: 'lower', side: 'left', type: 'canine' },
  { id: '32', name: 'Left Lower Lateral Incisor', fdi: '32', universal: '23', palmer: '2', position: 'lower', side: 'left', type: 'incisor' },
  { id: '31', name: 'Left Lower Central Incisor', fdi: '31', universal: '24', palmer: '1', position: 'lower', side: 'left', type: 'incisor' },
  
  // Lower Right (patient's right)
  { id: '41', name: 'Right Lower Central Incisor', fdi: '41', universal: '25', palmer: '1', position: 'lower', side: 'right', type: 'incisor' },
  { id: '42', name: 'Right Lower Lateral Incisor', fdi: '42', universal: '26', palmer: '2', position: 'lower', side: 'right', type: 'incisor' },
  { id: '43', name: 'Right Lower Canine', fdi: '43', universal: '27', palmer: '3', position: 'lower', side: 'right', type: 'canine' },
  { id: '44', name: 'Right Lower First Premolar', fdi: '44', universal: '28', palmer: '4', position: 'lower', side: 'right', type: 'premolar' },
  { id: '45', name: 'Right Lower Second Premolar', fdi: '45', universal: '29', palmer: '5', position: 'lower', side: 'right', type: 'premolar' },
  { id: '46', name: 'Right Lower First Molar', fdi: '46', universal: '30', palmer: '6', position: 'lower', side: 'right', type: 'molar' },
  { id: '47', name: 'Right Lower Second Molar', fdi: '47', universal: '31', palmer: '7', position: 'lower', side: 'right', type: 'molar' },
  { id: '48', name: 'Right Lower Third Molar', fdi: '48', universal: '32', palmer: '8', position: 'lower', side: 'right', type: 'molar' },
];

export const childTeeth: ToothData[] = [
  // Upper Right (patient's right)
  { id: '55', name: 'Primary Right Upper Second Molar', fdi: '55', universal: '1d', palmer: 'E', position: 'upper', side: 'right', type: 'molar' },
  { id: '54', name: 'Primary Right Upper First Molar', fdi: '54', universal: '2d', palmer: 'D', position: 'upper', side: 'right', type: 'molar' },
  { id: '53', name: 'Primary Right Upper Canine', fdi: '53', universal: '3d', palmer: 'C', position: 'upper', side: 'right', type: 'canine' },
  { id: '52', name: 'Primary Right Upper Lateral Incisor', fdi: '52', universal: '4d', palmer: 'B', position: 'upper', side: 'right', type: 'incisor' },
  { id: '51', name: 'Primary Right Upper Central Incisor', fdi: '51', universal: '5d', palmer: 'A', position: 'upper', side: 'right', type: 'incisor' },
  
  // Upper Left (patient's left)
  { id: '61', name: 'Primary Left Upper Central Incisor', fdi: '61', universal: '6d', palmer: 'A', position: 'upper', side: 'left', type: 'incisor' },
  { id: '62', name: 'Primary Left Upper Lateral Incisor', fdi: '62', universal: '7d', palmer: 'B', position: 'upper', side: 'left', type: 'incisor' },
  { id: '63', name: 'Primary Left Upper Canine', fdi: '63', universal: '8d', palmer: 'C', position: 'upper', side: 'left', type: 'canine' },
  { id: '64', name: 'Primary Left Upper First Molar', fdi: '64', universal: '9d', palmer: 'D', position: 'upper', side: 'left', type: 'molar' },
  { id: '65', name: 'Primary Left Upper Second Molar', fdi: '65', universal: '10d', palmer: 'E', position: 'upper', side: 'left', type: 'molar' },
  
  // Lower Left (patient's left)
  { id: '75', name: 'Primary Left Lower Second Molar', fdi: '75', universal: '11d', palmer: 'E', position: 'lower', side: 'left', type: 'molar' },
  { id: '74', name: 'Primary Left Lower First Molar', fdi: '74', universal: '12d', palmer: 'D', position: 'lower', side: 'left', type: 'molar' },
  { id: '73', name: 'Primary Left Lower Canine', fdi: '73', universal: '13d', palmer: 'C', position: 'lower', side: 'left', type: 'canine' },
  { id: '72', name: 'Primary Left Lower Lateral Incisor', fdi: '72', universal: '14d', palmer: 'B', position: 'lower', side: 'left', type: 'incisor' },
  { id: '71', name: 'Primary Left Lower Central Incisor', fdi: '71', universal: '15d', palmer: 'A', position: 'lower', side: 'left', type: 'incisor' },
  
  // Lower Right (patient's right)
  { id: '81', name: 'Primary Right Lower Central Incisor', fdi: '81', universal: '16d', palmer: 'A', position: 'lower', side: 'right', type: 'incisor' },
  { id: '82', name: 'Primary Right Lower Lateral Incisor', fdi: '82', universal: '17d', palmer: 'B', position: 'lower', side: 'right', type: 'incisor' },
  { id: '83', name: 'Primary Right Lower Canine', fdi: '83', universal: '18d', palmer: 'C', position: 'lower', side: 'right', type: 'canine' },
  { id: '84', name: 'Primary Right Lower First Molar', fdi: '84', universal: '19d', palmer: 'D', position: 'lower', side: 'right', type: 'molar' },
  { id: '85', name: 'Primary Right Lower Second Molar', fdi: '85', universal: '20d', palmer: 'E', position: 'lower', side: 'right', type: 'molar' },
];

export type DentitionType = 'adult' | 'child';

export const getTeethByType = (type: DentitionType): ToothData[] => {
  return type === 'adult' ? adultTeeth : childTeeth;
};
