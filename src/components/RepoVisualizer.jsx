import React, { useState, useCallback } from 'react';
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
    }
    setLoading(false);
  };

  const handleNodeHover = useCallback(node => {
    if (node) {
      node.__r = 8;
      node.__strokeColor = '#fff';
    }
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900">
      <div className="flex items-center space-x-2 p-4">
        <Input
          type="text"
          placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="flex-grow bg-gray-800 text-white"
        />
        <Button onClick={handleVisualize} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white">
          {loading ? 'Loading...' : 'Visualize'}
        </Button>
      </div>
      <div className="flex-grow">
        <ForceGraph2D
          graphData={graphData}
          backgroundColor="#111827"
          nodeAutoColorBy="group"
          nodeVal={node => node.group === 'blob' ? 3 : 5}
          nodeLabel="name"
          nodeColor={node => node.group === 'tree' ? '#4CAF50' : '#2196F3'}
          linkColor={() => '#999'}
          linkWidth={0.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={0.5}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x, node.y + 8);
          }}
          onNodeHover={handleNodeHover}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      </div>
    </div>
  );
};

export default RepoVisualizer;