import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, Sun, Moon, Search, Info, Tag, Brain, FileTree } from 'lucide-react';
import { Tooltip } from './ui/tooltip';
import { motion } from 'framer-motion';

const LeftPanel = ({
  repoUrl,
  setRepoUrl,
  handleVisualize,
  isRepoStructureLoading,
  searchTerm,
  setSearchTerm,
  setIsInfoOpen,
  showLabels,
  setShowLabels,
  handleAnalyze,
  isAnalyzing,
  theme,
  setTheme,
  error,
  setShowTreeView,
}) => {
  return (
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
      <Tooltip content="Toggle repository structure">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowTreeView(prev => !prev)}
          className="w-full"
        >
          <FileTree className="h-4 w-4 mr-2" />
          Repository Structure
        </Button>
      </Tooltip>
      {error && <p className="text-destructive mt-2">{error}</p>}
    </motion.div>
  );
};

export default LeftPanel;