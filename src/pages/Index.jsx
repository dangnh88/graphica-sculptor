import RepoVisualizer from '../components/RepoVisualizer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">GitHub Repository Visualizer</h1>
        <RepoVisualizer />
      </div>
    </div>
  );
};

export default Index;