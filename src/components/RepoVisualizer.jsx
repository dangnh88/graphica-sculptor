import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { fetchRepoStructure, fetchRepoInfo, analyzeRepoContent } from '../utils/githubUtils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Sun, Moon, Search, Info, Tag, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Tooltip } from './ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Tree } from 'react-arborist';

const RepoVisualizer = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [showTreeView, setShowTreeView] = useState(false);
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
      setTreeData(convertToTreeData(repoStructure.nodes));
    }
  }, [repoStructure]);

  const convertToTreeData = (nodes) => {
    const root = { id: 'root', name: 'Root', children: [] };
    const nodeMap = new Map();
    nodeMap.set('root', root);

    nodes.forEach(node => {
      const parts = node.id.split('/');
      let currentPath = '';
      let currentParent = root;

      parts.forEach((part, index) => {
        currentPath += (index > 0 ? '/' : '') + part;
        if (!nodeMap.has(currentPath)) {
          const newNode = { id: currentPath, name: part, children: [] };
          nodeMap.set(currentPath, newNode);
          currentParent.children.push(newNode);
        }
        currentParent = nodeMap.get(currentPath);
      });
    });

    return [root];
  };

  const handleVisualize = () => {
    setError('');
    refetchRepoStructure();
    setShowTreeView(true);
  };

  const handleNodeHover = useCallback(node => {
    if (node) {
      node.__r = 2.5;
      node.__strokeColor = theme === 'dark' ? '#fff' : '#000';
    }
    setSelectedNode(node);
  }, [theme]);

  const handleNodeClick = useCallback(node => {
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
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

  const getNodeColor = useCallback((node) => {
    const colors = {
      tree: '#22c55e',
      blob: '#3b82f6',
      commit: '#f59e0b',
      tag: '#8b5cf6',
    };
    return colors[node.group] || '#6b7280';
  }, []);

  const handleAnalyze = async () => {
    if (!repoUrl) return;
    const [, , , owner, repo] = repoUrl.split('/');
    setIsAnalyzing(true);
    setIsAnalysisPanelOpen(true);
    setAnalysisResult('');
    try {
      const result = await analyzeRepoContent(owner, repo);
      setAnalysisResult(result);
    } catch (error) {
      setError('Failed to analyze repository content. Please try again.');
      setAnalysisResult('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-screen flex bg-background text-foreground relative"
    >
      {/* Left Panel */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-64 h-full bg-secondary p-4 flex flex-col space-y-4 shadow-lg z-10"
      >
        <h1 className="text-2xl font-bold mb-4">GitHub Repo Visualizer</h1>
        <Input
          type="text"
          placeholder="Enter GitHub repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="bg-background text-foreground border-input focus:border-primary"
        />
        <Button 
          onClick={handleVisualize} 
          disabled={isRepoStructureLoading} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
        >
          {isRepoStructureLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Visualize'}
        </Button>
        <Input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-background text-foreground border-input focus:border-primary"
          startIcon={<Search className="h-4 w-4" />}
        />
        <div className="flex justify-between">
          <Tooltip content="View repository info">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsInfoOpen(true)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content={`${showLabels ? 'Hide' : 'Show'} labels`}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowLabels(!showLabels)}
            >
              <Tag className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Analyze repository content">
            <Button
              variant="outline"
              size="icon"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !repoUrl}
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            </Button>
          </Tooltip>
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
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-grow relative">
        <AnimatePresence>
          {(isRepoStructureLoading || isRepoInfoLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20"
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
          nodeVal={node => node.group === 'blob' ? 0.5 : 0.75}
          nodeLabel="name"
          nodeColor={getNodeColor}
          linkColor={() => theme === 'dark' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(55, 65, 81, 0.3)'}
          linkWidth={0.3}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={1}
          linkDirectionalParticleSpeed={0.005}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (showLabels) {
              const label = node.name;
              const fontSize = 4/globalScale;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
              ctx.fillText(label, node.x, node.y + 4);
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, 1.5, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node);
            ctx.fill();
          }}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          cooldownTimes={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          linkHoverPrecision={5}
          onLinkHover={(link) => {
            if (link) {
              link.color = '#f59e0b';
              link.width = 0.5;
            }
          }}
        />
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-68 bg-popover text-popover-foreground p-4 rounded-md shadow-lg"
          >
            <h3 className="font-bold">{selectedNode.name}</h3>
            <p>Type: {selectedNode.group}</p>
            <p>Path: {selectedNode.id}</p>
          </motion.div>
        )}
      </div>

      {/* Tree View Overlay */}
      <AnimatePresence>
        {showTreeView && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-68 w-1/3 h-1/2 bg-background border border-border rounded-lg shadow-lg overflow-auto z-30"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Repository Structure</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTreeView(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>
              {treeData.length > 0 ? (
                <Tree
                  data={treeData}
                  width="100%"
                  height={300}
                  indent={24}
                  rowHeight={24}
                  overscanCount={1}
                >
                  {({ node, style, dragHandle }) => (
                    <div style={style} ref={dragHandle} className="flex items-center">
                      <span className="mr-2">{node.isLeaf ? '📄' : node.isOpen ? '📂' : '📁'}</span>
                      {node.data.name}
                    </div>
                  )}
                </Tree>
              ) : (
                <p className="p-2">No repository structure available. Please enter a valid GitHub repository URL and click 'Visualize'.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalysisPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsAnalysisPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full sm:w-2/3 md:w-1/2 lg:w-1/3 bg-background shadow-lg z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Repository Analysis</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAnalysisPanelOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </Button>
                </div>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{analysisResult}</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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