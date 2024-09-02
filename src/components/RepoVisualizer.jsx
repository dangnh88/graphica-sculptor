import React, { useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { fetchRepoStructure } from '../utils/githubUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';

const RepoVisualizer = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);

  const handleVisualize = async () => {
    setLoading(true);
    try {
      const [, , , owner, repo] = repoUrl.split('/');
      const data = await fetchRepoStructure(owner, repo);
      setGraphData(data);
    } catch (error) {
      console.error('Error visualizing repository:', error);
      // Here you might want to show an error message to the user
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex items-center space-x-2 p-4">
        <Input
          type="text"
          placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleVisualize} disabled={loading}>
          {loading ? 'Loading...' : 'Visualize'}
        </Button>
      </div>
      <div className="flex-grow">
        <ForceGraph2D
          graphData={graphData}
          nodeAutoColorBy="group"
          nodeLabel="name"
          linkDirectionalParticles={2}
        />
      </div>
    </div>
  );
};

export default RepoVisualizer;