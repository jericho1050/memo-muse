// --- Display component for AI generated story and prompts ---
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';

interface CollageDisplayProps {
  collageData: { summary: string; prompts: string[] } | null;
  isLoading: boolean;
}

// Component for displaying markdown content with consistent styling
export const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ 
  content, 
  className = "" 
}) => {
  if (!content || typeof content !== 'string') {
    console.error("Invalid markdown content:", content);
    return null;
  }

  // Remove any $2 tokens that might be in the text
  const cleanedContent = content.replace(/\$2/g, '');
  
  return (
    <div className={`prose prose-indigo max-w-none ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize, rehypeRaw]}
        components={{
          h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-800" {...props} />,
          h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-800" {...props} />,
          h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800" {...props} />,
          p: (props) => <p className="mb-3 leading-relaxed" {...props} />,
          ul: (props) => <ul className="list-disc mb-4 ml-5" {...props} />,
          ol: (props) => <ol className="list-decimal mb-4 ml-5" {...props} />,
          li: (props) => <li className="ml-5 mb-1" {...props} />,
          strong: (props) => <strong className="font-semibold" {...props} />,
          em: (props) => <em className="italic" {...props} />
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};

// For backward compatibility
export const parseMarkdown = (markdown: string): string => {
  console.warn("parseMarkdown is deprecated. Use <MarkdownRenderer content={markdown} /> instead.");
  return markdown;
};

export const QuickStoryDisplay: React.FC<CollageDisplayProps> = ({ collageData, isLoading }) => {
  // Force re-render with a key based on content hash
  const contentKey = collageData ? 
    `summary-${collageData.summary?.substring(0, 20)}` : 'no-content';
  
  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        <p className="text-center text-indigo-600 font-medium mt-4">AI is crafting your story...</p>
      </div>
    );
  }

  if (!collageData) {
    return <p className="text-center text-gray-500 py-8">Click "Generate Story" to see the magic happen!</p>;
  }
  
  // Debug content 
  console.log("Summary to display:", collageData.summary);
  console.log("Prompts to display:", collageData.prompts);

  return (
    <div className="mt-4 py-4 border-t border-gray-200">
      <h4 className="text-lg font-semibold text-gray-800 mb-2">Your AI Generated Story</h4>
      <div 
        key={contentKey}
        className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md"
      >
        <MarkdownRenderer content={collageData.summary} />
      </div>
      
      {collageData.prompts && collageData.prompts.length > 0 && (
        <div className="mt-6">
          <h5 className="text-md font-semibold text-gray-700 mb-2">Journal Prompts:</h5>
          <ul className="space-y-3">
            {collageData.prompts.map((prompt, index) => (
              <li key={`prompt-${index}`} className="bg-indigo-50 p-3 rounded-md">
                <div className="text-sm text-gray-700">
                  <MarkdownRenderer content={prompt} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};