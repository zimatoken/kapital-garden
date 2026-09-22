// src/types/achievement.ts

import type { ISODate } from './common';

export type AchievementId =
  | 'first-seed'
  | 'ten-seeds'
  | 'full-month'
  | 'first-tree'
  | 'hundred-days'
  | 'forest'
  | 'big-saver'
  | 'goal-reached'
  | 'investor';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlockedAt: ISODate | null;
}