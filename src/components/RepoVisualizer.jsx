import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { fetchRepoStructure, fetchRepoInfo, analyzeRepoContent } from '../utils/githubUtils';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useQuery } from '@tanstack/react-query';
import RepoTreeView from './RepoTreeView';
import LeftPanel from './LeftPanel';

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
      <LeftPanel
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        handleVisualize={handleVisualize}
        isRepoStructureLoading={isRepoStructureLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setIsInfoOpen={setIsInfoOpen}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        handleAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        theme={theme}
        setTheme={setTheme}
        error={error}
        setShowTreeView={setShowTreeView}
      />

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

      <RepoTreeView
        treeData={treeData}
        showTreeView={showTreeView}
        setShowTreeView={setShowTreeView}
      />

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
