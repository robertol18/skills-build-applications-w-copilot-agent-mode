import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load activities'));
  }, []);

  if (error) return <CapabilityCard title="Activities" description="Track student activity minutes and points." content={<p role="alert">Unable to load activities: {error}</p>} />;
  if (!activities) return <CapabilityCard title="Activities" description="Track student activity minutes and points." content={<p role="status">Loading activities...</p>} />;
  if (activities.length === 0) return <CapabilityCard title="Activities" description="Track student activity minutes and points." content={<p>No activities yet.</p>} />;

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." content={
      <ul>{activities.map((activity, index) => <li key={index}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>
    } />
  );
}
