import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { fetchRepoStructure, fetchRepoInfo } from '../utils/githubUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Sun, Moon, Search, Filter, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Tooltip } from './ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useQuery } from '@tanstack/react-query';

const RepoVisualizer = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const graphRef = useRef();
  const { theme, setTheme } = useTheme();

  const { data: repoInfo, isLoading: isRepoInfoLoading } = useQuery({
    queryKey: ['repoInfo', repoUrl],
    queryFn: () => {
      const [, , , owner, repo] = repoUrl.split('/');
      return fetchRepoInfo(owner, repo);
    },
    enabled: !!repoUrl,
  });

  const { data: repoStructure, isLoading: isRepoStructureLoading, refetch: refetchRepoStructure } = useQuery({
    queryKey: ['repoStructure', repoUrl],
    queryFn: () => {
      const [, , , owner, repo] = repoUrl.split('/');
      return fetchRepoStructure(owner, repo);
    },
    enabled: false,
  });

  useEffect(() => {
    if (repoStructure) {
      setGraphData(repoStructure);
    }
  }, [repoStructure]);

  const handleVisualize = () => {
    setError('');
    refetchRepoStructure();
  };

  const handleNodeHover = useCallback(node => {
    if (node) {
      node.__r = 8;
      node.__strokeColor = theme === 'dark' ? '#fff' : '#000';
    }
    setSelectedNode(node);
  }, [theme]);

  const handleNodeClick = useCallback(node => {
    if (graphRef.current) {
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      graphRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1000
      );
    }
  }, []);

  const filteredGraphData = useCallback(() => {
    if (!searchTerm) return graphData;
    const lowercasedSearch = searchTerm.toLowerCase();
    const filteredNodes = graphData.nodes.filter(node => 
      node.name.toLowerCase().includes(lowercasedSearch)
    );
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = graphData.links.filter(link => 
      filteredNodeIds.has(link.source.id || link.source) && filteredNodeIds.has(link.target.id || link.target)
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-screen flex flex-col bg-background text-foreground"
    >
      <div className="flex flex-col items-center space-y-4 p-6 bg-secondary">
        <h1 className="text-3xl font-bold mb-4">GitHub Repository Visualizer</h1>
        <div className="flex items-center space-x-2 w-full max-w-2xl">
          <Input
            type="text"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-grow bg-background text-foreground border-input focus:border-primary"
          />
          <Button 
            onClick={handleVisualize} 
            disabled={isRepoStructureLoading} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md transition-colors duration-200"
          >
            {isRepoStructureLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Visualize'}
          </Button>
          <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </Tooltip>
        </div>
        {error && <p className="text-destructive mt-2">{error}</p>}
        <div className="flex items-center space-x-2 w-full max-w-2xl">
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-background text-foreground border-input focus:border-primary"
            startIcon={<Search className="h-4 w-4" />}
          />
          <Tooltip content="View repository info">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsInfoOpen(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="flex-grow relative">
        <AnimatePresence>
          {(isRepoStructureLoading || isRepoInfoLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredGraphData()}
          backgroundColor={theme === 'dark' ? '#1a1b26' : '#f0f4f8'}
          nodeAutoColorBy="group"
          nodeVal={node => node.group === 'blob' ? 4 : 6}
          nodeLabel="name"
          nodeColor={node => node.group === 'tree' ? '#22c55e' : '#3b82f6'}
          linkColor={() => theme === 'dark' ? 'rgba(156, 163, 175, 0.6)' : 'rgba(55, 65, 81, 0.6)'}
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
            ctx.fillStyle = theme === 'dark' ? 'white' : 'black';
            ctx.fillText(label, node.x, node.y + 10);
          }}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
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
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-popover text-popover-foreground p-4 rounded-md shadow-lg"
          >
            <h3 className="font-bold">{selectedNode.name}</h3>
            <p>Type: {selectedNode.group}</p>
            <p>Path: {selectedNode.id}</p>
          </motion.div>
        )}
      </div>
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repository Information</DialogTitle>
            <DialogDescription>
              {repoInfo && (
                <div>
                  <p>Name: {repoInfo.name}</p>
                  <p>Owner: {repoInfo.owner.login}</p>
                  <p>Stars: {repoInfo.stargazers_count}</p>
                  <p>Forks: {repoInfo.forks_count}</p>
                  <p>Description: {repoInfo.description}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default RepoVisualizer;