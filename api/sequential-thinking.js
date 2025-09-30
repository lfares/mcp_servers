// Simple sequential thinking logic
class SimpleSequentialThinking {
  constructor() {
    this.thoughtHistory = [];
  }

  processThought(thought, thoughtNumber, totalThoughts, nextThoughtNeeded) {
    const thoughtData = {
      thought,
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      timestamp: new Date().toISOString()
    };
    
    this.thoughtHistory.push(thoughtData);
    
    return {
      thoughtNumber,
      totalThoughts,
      nextThoughtNeeded,
      thoughtHistoryLength: this.thoughtHistory.length,
      message: `Thought ${thoughtNumber}/${totalThoughts} processed successfully`
    };
  }
}

const thinkingServer = new SimpleSequentialThinking();

// Vercel serverless function
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.url.includes('/health') && req.method === 'GET') {
    res.status(200).json({ 
      status: 'healthy', 
      service: 'sequential-thinking-mcp',
      version: '1.0.0'
    });
    return;
  }

  if (req.url.includes('/tools/list') && req.method === 'POST') {
    const tools = [{
      name: "sequentialthinking",
      description: "A tool for dynamic and reflective problem-solving through thoughts. Helps analyze problems through a flexible thinking process that can adapt and evolve.",
      inputSchema: {
        type: "object",
        properties: {
          thought: { type: "string", description: "Your current thinking step" },
          nextThoughtNeeded: { type: "boolean", description: "Whether another thought step is needed" },
          thoughtNumber: { type: "integer", description: "Current thought number", minimum: 1 },
          totalThoughts: { type: "integer", description: "Estimated total thoughts needed", minimum: 1 }
        },
        required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
      }
    }];

    res.status(200).json({
      jsonrpc: "2.0",
      id: 1,
      result: { tools }
    });
    return;
  }

  if (req.url.includes('/tools/call') && req.method === 'POST') {
    try {
      const request = req.body;
      if (request.params && request.params.name === 'sequentialthinking') {
        const { thought, thoughtNumber, totalThoughts, nextThoughtNeeded } = request.params.arguments;
        const result = thinkingServer.processThought(thought, thoughtNumber, totalThoughts, nextThoughtNeeded);
        
        res.status(200).json({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
            }]
          }
        });
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32601, message: "Unknown tool" }
        });
      }
    } catch (error) {
      res.status(500).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: error.message }
      });
    }
    return;
  }

  // Default response
  res.status(404).json({ error: 'Not Found' });
}
