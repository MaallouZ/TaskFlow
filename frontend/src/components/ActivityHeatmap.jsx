import { useEffect, useRef } from 'react';
import { buildWeeks, formatDayLabel, makeLevelFn, monthLabels } from '../utils/heatmap.js';

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// texte au survol : "3 tâches terminées · mercredi 7 octobre 2026"
function describe(day) {
  const parts = [];
  if (day.tasks > 0) parts.push(plural(day.tasks, 'tâche terminée', 'tâches terminées'));
  if (day.habits > 0) parts.push(plural(day.habits, 'habitude cochée', 'habitudes cochées'));
  return `${parts.length > 0 ? parts.join(' et ') : 'Aucune activité'} · ${formatDayLabel(day.date)}`;
}

function ActivityHeatmap({ days }) {
  const scrollRef = useRef(null);
  const weeks = buildWeeks(days);
  const levelOf = makeLevelFn(days);
  const labels = monthLabels(weeks);

  // sur petit écran, on affiche la fin (aujourd'hui) en premier
  useEffect(() => {
    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [days]);

  return (
    <div className="heatmap">
      <div className="heatmap-scroll" ref={scrollRef}>
        <div className="heatmap-layout">
          <div className="heatmap-months" aria-hidden="true">
            {labels.map((label) => (
              <span key={label.index} style={{ gridColumn: label.index + 1 }}>{label.text}</span>
            ))}
          </div>

          <div className="heatmap-weekdays" aria-hidden="true">
            <span>Lun</span>
            <span>Mer</span>
            <span>Ven</span>
          </div>

          <div className="heatmap-grid" role="img" aria-label="Calendrier d’activité des 12 derniers mois">
            {weeks.flat().map((day, i) =>
              day ? (
                <span key={day.date} className={`heat-cell level-${levelOf(day.total)}`} title={describe(day)} />
              ) : (
                <span key={`empty-${i}`} className="heat-cell heat-empty" />
              )
            )}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Moins</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`heat-cell level-${level}`} />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;