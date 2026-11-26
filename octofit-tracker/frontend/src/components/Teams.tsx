import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load teams'));
  }, []);

  if (error) return <CapabilityCard title="Teams" description="Manage teams and members." content={<p role="alert">Unable to load teams: {error}</p>} />;
  if (!teams) return <CapabilityCard title="Teams" description="Manage teams and members." content={<p role="status">Loading teams...</p>} />;
  if (teams.length === 0) return <CapabilityCard title="Teams" description="Manage teams and members." content={<p>No teams available.</p>} />;

  return <CapabilityCard title="Teams" description="Manage teams and members." content={
    <ul>{teams.map((team, index) => <li key={index}>{team.name} ({team.members.length} members)</li>)}</ul>
  } />;
}
