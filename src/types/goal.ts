export type GoalKind = 'apartment' | 'car' | 'pension' | 'education' | 'custom';
export type GoalIcon = '🏡' | '🚗' | '🌴' | '🎓' | '💎';

export interface Goal {
  id: string;
  kind: GoalKind;
  icon: GoalIcon;
  title: string;
  targetAmount: Money;      // цель в minorUnits
  targetDate: ISODate | null;
  createdAt: ISODate;
  archived: boolean;
}
