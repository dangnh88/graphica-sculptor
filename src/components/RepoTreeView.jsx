import React from 'react';
import { Tree } from 'react-arborist';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const RepoTreeView = ({ treeData, showTreeView, setShowTreeView }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!showTreeView) return null;

  return (
    <div className={cn(
      "absolute top-4 right-4 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-30 transition-all duration-300",
      isExpanded ? "w-1/3 h-1/2" : "w-48 h-12"
    )}>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className={cn(
            "text-xl font-semibold transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            Repository Structure
          </h2>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleExpand}
              className="shrink-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTreeView(false)}
              className={cn(
                "shrink-0 transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>
        </div>
        {isExpanded && treeData.length > 0 ? (
          <div className="mt-2">
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
          </div>
        ) : (
          <p className={cn(
            "p-2 transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            No repository structure available. Please enter a valid GitHub repository URL and click 'Visualize'.
          </p>
        )}
      </div>
    </div>
  );
};

export default RepoTreeView;