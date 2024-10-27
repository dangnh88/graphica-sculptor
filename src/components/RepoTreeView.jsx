import React from 'react';
import { Tree } from 'react-arborist';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

const RepoTreeView = ({ treeData, showTreeView, setShowTreeView }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!showTreeView) return null;

  return (
    <div className="absolute top-4 right-4 w-1/3 h-1/2 bg-background border border-border rounded-lg shadow-lg overflow-auto z-30">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Repository Structure</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTreeView(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>
        </div>
        {isExpanded && treeData.length > 0 ? (
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
    </div>
  );
};

export default RepoTreeView;