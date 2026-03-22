export const ALL_EQUIPMENT = ['tv', 'whiteboard', 'video', 'speaker'] as const;
export type Equipment = (typeof ALL_EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  tv: 'TV',
  whiteboard: '화이트보드',
  video: '화상장비',
  speaker: '스피커',
};
