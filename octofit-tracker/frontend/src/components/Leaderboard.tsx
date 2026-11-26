import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Entry[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load leaderboard'));
  }, []);

  if (error) return <CapabilityCard title="Leaderboard" description="Compare team point totals." content={<p role="alert">Unable to load leaderboard: {error}</p>} />;
  if (!leaderboard) return <CapabilityCard title="Leaderboard" description="Compare team point totals." content={<p role="status">Loading leaderboard...</p>} />;
  if (leaderboard.length === 0) return <CapabilityCard title="Leaderboard" description="Compare team point totals." content={<p>No leaderboard rankings available.</p>} />;

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." content={
    <ol>{leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>
  } />;
}
