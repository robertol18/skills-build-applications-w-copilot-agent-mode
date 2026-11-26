import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((data) => setSuggestions(data.suggestions))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load workout suggestions'));
  }, []);

  if (error) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." content={<p role="alert">Unable to load workout suggestions: {error}</p>} />;
  if (!suggestions) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." content={<p role="status">Loading workout suggestions...</p>} />;
  if (suggestions.length === 0) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." content={<p>No workout suggestions available.</p>} />;

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." content={
    <ul>{suggestions.map((workout, index) => <li key={index}><strong>{workout.title}</strong>: {workout.reason}</li>)}</ul>
  } />;
}
