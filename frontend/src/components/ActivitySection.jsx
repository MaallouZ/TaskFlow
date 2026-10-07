import { useEffect, useState } from 'react';
import ActivityHeatmap from './ActivityHeatmap.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { getActivity } from '../services/activityService.js';
import { lastYearRange } from '../utils/heatmap.js';

const SOURCES = [
  { value: 'all', label: 'Tout' },
  { value: 'tasks', label: 'Tâches' },
  { value: 'habits', label: 'Habitudes' },
];

// section "Activité" : calendrier des 12 derniers mois
function ActivitySection({ user, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getActivity({ ...lastYearRange(user.timezone), source })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [user.timezone, source, refreshKey]);

  const total = data ? data.days.reduce((sum, day) => sum + day.total, 0) : 0;

  return (
    <section className="activity-section">
      <div className="activity-head">
        <div>
          <h2 className="section-title">Activité</h2>
          <p className="page-sub">
            {data ? `${total} action(s) sur les 12 derniers mois · fuseau ${data.timezone}` : 'Chargement…'}
          </p>
        </div>
        <div className="segmented">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={source === s.value ? 'segment active' : 'segment'}
              onClick={() => setSource(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      {data && (
        <div className="card">
          <ActivityHeatmap days={data.days} />
        </div>
      )}
    </section>
  );
}

export default ActivitySection;