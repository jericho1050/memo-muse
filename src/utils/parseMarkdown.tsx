// --- Display component for AI generated story and prompts (adapted from ImageCollageCreator) ---
interface CollageDisplayProps {
    collageData: { summary: string; prompts: string[] } | null;
    isLoading: boolean;
  }
  
  // Simple markdown parser function
export const parseMarkdown = (markdown: string): string => {
    if (!markdown || typeof markdown !== 'string') {
      console.error("Invalid markdown content:", markdown);
      return '';
    }
  
    // Debug
    console.log("Raw markdown to parse:", markdown);
    
    // Remove any $2 tokens anywhere in the text
    let html = markdown.replace(/\$2/g, '');
    
    // Convert headers (## Header) to styled HTML
    html = html
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-gray-800">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-800">$1</h1>');
    
    // Pre-process lists for better handling
    const listItemRegex = /^[\s-]*(-|\*|\d+\.)\s+(.*)/gm;
    let foundLists = false;
    
    // Check if any list items exist
    if (listItemRegex.test(html)) {
      foundLists = true;
    }
    
    if (foundLists) {
      // Handle list items
      html = html
        .replace(/^[\s-]*(-|\*)\s+(.*)/gm, '<li class="ml-5 mb-1">$2</li>')
        .replace(/^[\s-]*(\d+\.)\s+(.*)/gm, '<li class="ml-5 mb-1">$2</li>');
      
      // Wrap adjacent list items in ul/ol tags
      html = '<ul class="list-disc mb-4">' + html + '</ul>';
      html = html
        .replace(/<\/li>\s*<li/g, '</li><li')
        .replace(/<\/ul>\s*<ul[^>]*>/g, '');
    }
    
    // Process paragraphs
    html = html.split('\n').map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<h') || 
          line.startsWith('<ul') || 
          line.startsWith('<ol') || 
          line.startsWith('<li') || 
          line.startsWith('<p')) {
        return line;
      }
      return `<p class="mb-3 leading-relaxed">${line}</p>`;
    }).join('\n');
    
    // Convert bold and italic
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>');
      
    // Remove empty paragraphs
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
    
    console.log("Final HTML:", html);
    return html.trim();
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
          className="prose prose-indigo max-w-none text-sm text-gray-700 bg-gray-50 p-4 rounded-md"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(collageData.summary) }}
        />
        
        {collageData.prompts && collageData.prompts.length > 0 && (
          <div className="mt-6">
            <h5 className="text-md font-semibold text-gray-700 mb-2">Journal Prompts:</h5>
            <ul className="space-y-3">
              {collageData.prompts.map((prompt, index) => (
                <li key={`prompt-${index}`} className="bg-indigo-50 p-3 rounded-md">
                  <div 
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(prompt) }} 
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };