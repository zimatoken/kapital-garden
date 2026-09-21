// src/components/TreeVisual.tsx

import type { OctaveInfo } from '../core/octaves';

interface TreeVisualProps {
  octave: OctaveInfo | null;
  /** Прогресс к следующей октаве: 0..1 */
  progress?: number;
}

/**
 * CSS-визуализация дерева.
 * Растёт по мере роста октавы.
 * Уровни: семя → росток → стебель → дерево → цветущее → плодоносящее → большое → лес.
 */
export function TreeVisual({ octave, progress = 0 }: TreeVisualProps) {
  if (!octave) {
    return (
      <div className="tree-visual tree-empty">
        <div className="tree-soil" />
        <div className="tree-hint">Посади первое семя</div>
      </div>
    );
  }

  const level = octave.level;

  return (
    <div className={`tree-visual tree-level-${level}`}>
      <div className="tree-scene">
        {/* Солнце — растёт с уровнем */}
        <div className="tree-sun" style={{ opacity: 0.3 + level * 0.08 }} />

        {/* Земля */}
        <div className="tree-soil" />

        {/* Растение — размер зависит от уровня */}
        <div className={`tree-plant tree-plant-${level}`}>
          {level >= 1 && <div className="tree-seed" />}
          {level >= 2 && <div className="tree-stem" />}
          {level >= 3 && <div className="tree-stem tree-stem-tall" />}
          {level >= 4 && (
            <>
              <div className="tree-trunk" />
              <div className="tree-crown tree-crown-1" />
            </>
          )}
          {level >= 5 && <div className="tree-crown tree-crown-2" />}
          {level >= 6 && <div className="tree-crown tree-crown-3" />}
          {level >= 7 && <div className="tree-crown tree-crown-4" />}
          {level >= 8 && (
            <>
              <div className="tree-sibling tree-sibling-left" />
              <div className="tree-sibling tree-sibling-right" />
            </>
          )}
        </div>

        {/* Прогресс к следующей октаве */}
        {progress > 0 && level < 8 && (
          <div className="tree-progress">
            <div
              className="tree-progress-fill"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="tree-label">
        <span className="tree-emoji">{octave.emoji}</span>
        <span className="tree-name">{octave.name}</span>
        <span className="tree-day">День {octave.day}</span>
      </div>

      <p className="tree-motivation">{octave.motivation}</p>
    </div>
  );
}