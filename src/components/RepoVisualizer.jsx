import React, { useState, useCallback } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { fetchRepoStructure } from '../utils/githubUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';

const RepoVisualizer = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVisualize = async () => {
    setLoading(true);
    setError('');
    try {
      const [, , , owner, repo] = repoUrl.split('/');
      const data = await fetchRepoStructure(owner, repo);
      setGraphData(data);
    } catch (error) {
      console.error('Error visualizing repository:', error);
      setError('Failed to fetch repository data. Please check the URL and try again.');
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
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex flex-col items-center space-y-4 p-6 bg-gray-800">
        <h1 className="text-3xl font-bold mb-4">GitHub Repository Visualizer</h1>
        <div className="flex items-center space-x-2 w-full max-w-2xl">
          <Input
            type="text"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-grow bg-gray-700 text-white border-gray-600 focus:border-blue-500"
          />
          <Button 
            onClick={handleVisualize} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Visualize'}
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      <div className="flex-grow relative">
        <ForceGraph2D
          graphData={graphData}
          backgroundColor="#111827"
          nodeAutoColorBy="group"
          nodeVal={node => node.group === 'blob' ? 4 : 6}
          nodeLabel="name"
          nodeColor={node => node.group === 'tree' ? '#22c55e' : '#3b82f6'}
          linkColor={() => 'rgba(156, 163, 175, 0.6)'}
          linkWidth={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 14/globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(label, node.x, node.y + 10);
          }}
          onNodeHover={handleNodeHover}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          linkHoverPrecision={5}
          onLinkHover={(link) => {
            if (link) {
              link.color = '#f59e0b';
              link.width = 2;
            }
          }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoVisualizer;