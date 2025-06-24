/**
 * Multi-Agent Orchestration Demo
 * 
 * This demo shows how to use the agents-as-tools pattern to create
 * a hierarchical multi-agent system where specialized agents work
 * together under an orchestrator.
 */

import { 
  Agent, 
  BedrockModel, 
  agentAsTool, 
  statefulAgentAsTool,
  createAgentTools 
} from '@strands/agent-sdk';
import { 
  currentDateTime, 
  httpRequest, 
  searchWeb, 
  calculator 
} from '@strands/tools';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function main() {
  console.log(`
${colors.bright}🤖 Multi-Agent Orchestration Demo${colors.reset}
${colors.dim}Demonstrating agents working together as tools${colors.reset}
`);

  // Create the base model configuration
  const modelConfig = {
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: process.env.AWS_REGION || 'us-west-2'
  };

  // 1. Create specialized agent tools
  console.log(`${colors.yellow}Creating specialized agents...${colors.reset}\n`);

  // Research Agent - Gathers information from the web
  const researchAgent = agentAsTool({
    name: 'research_assistant',
    description: 'Researches topics using web search and HTTP requests. Best for gathering factual information, current events, and technical documentation.',
    parameterDescription: 'The topic or question to research',
    agentFactory: () => new Agent({
      model: new BedrockModel(modelConfig),
      tools: [searchWeb, httpRequest, currentDateTime],
      systemPrompt: `You are a research assistant specialized in gathering accurate, up-to-date information.
      
Your responsibilities:
- Search for relevant information using web search
- Fetch detailed content from specific URLs when needed
- Verify facts and provide sources
- Focus on accuracy and relevance
- Always cite your sources

Be thorough but concise in your research summaries.`
    })
  });

  // Analysis Agent - Analyzes data and performs calculations
  const analysisAgent = agentAsTool({
    name: 'data_analyst',
    description: 'Analyzes data, performs calculations, and provides insights. Best for numerical analysis, statistics, and data interpretation.',
    parameterDescription: 'The data or analysis request',
    agentFactory: () => new Agent({
      model: new BedrockModel(modelConfig),
      tools: [calculator],
      systemPrompt: `You are a data analyst specialized in numerical analysis and insights.
      
Your responsibilities:
- Perform accurate calculations
- Analyze numerical data and trends
- Provide clear interpretations
- Suggest data-driven insights
- Use the calculator for all mathematical operations

Present your analysis in a clear, structured format.`
    })
  });

  // Writing Agent - Creates well-structured content
  const writingAgent = agentAsTool({
    name: 'content_writer',
    description: 'Creates well-structured, engaging content. Best for writing articles, summaries, documentation, and creative content.',
    parameterDescription: 'The writing task or content requirements',
    agentFactory: () => new Agent({
      model: new BedrockModel(modelConfig),
      tools: [], // No tools needed, pure language model
      systemPrompt: `You are a professional content writer specialized in creating clear, engaging content.
      
Your responsibilities:
- Write well-structured content with clear sections
- Use appropriate tone and style for the audience
- Ensure proper grammar and flow
- Make complex topics accessible
- Create engaging introductions and conclusions

Focus on clarity, readability, and engagement.`
    })
  });

  // 2. Create the orchestrator agent
  console.log(`${colors.cyan}Creating orchestrator agent...${colors.reset}\n`);

  const orchestrator = new Agent({
    model: new BedrockModel(modelConfig),
    tools: [researchAgent, writingAgent, analysisAgent],
    systemPrompt: `You are an intelligent orchestrator that coordinates specialized agents to fulfill complex requests.

Available agents:
1. **research_assistant**: For gathering information, facts, and current data
2. **data_analyst**: For numerical analysis, calculations, and data insights  
3. **content_writer**: For creating polished, well-structured content

Your approach:
1. Analyze the user's request to understand what needs to be done
2. Break down complex tasks into steps
3. Delegate to appropriate specialized agents
4. Combine and synthesize their outputs
5. Ensure the final response fully addresses the user's needs

Important guidelines:
- Use research_assistant FIRST when you need factual information
- Use data_analyst for any numerical or analytical tasks
- Use content_writer to polish and structure final outputs
- You can call multiple agents and combine their outputs
- Always provide a comprehensive response that fully addresses the request`
  });

  // 3. Example: Complex multi-agent task
  console.log(`${colors.bright}Example 1: Market Analysis Report${colors.reset}\n`);
  
  const marketAnalysisQuery = `Create a brief market analysis report about the electric vehicle industry in 2024. 
  Include current market size, growth trends, and top 3 companies by market share.`;

  console.log(`${colors.green}User Query:${colors.reset} ${marketAnalysisQuery}\n`);
  console.log(`${colors.blue}Orchestrator working...${colors.reset}\n`);

  const marketAnalysisResult = await orchestrator.call(marketAnalysisQuery);
  console.log(`${colors.magenta}Result:${colors.reset}\n${marketAnalysisResult.text}\n`);

  // 4. Example: Technical tutorial creation
  console.log(`\n${colors.bright}Example 2: Technical Tutorial Creation${colors.reset}\n`);
  
  const tutorialQuery = `Create a beginner-friendly tutorial about using TypeScript decorators. 
  Research what decorators are, provide a simple example, and explain a practical use case.`;

  console.log(`${colors.green}User Query:${colors.reset} ${tutorialQuery}\n`);
  console.log(`${colors.blue}Orchestrator working...${colors.reset}\n`);

  const tutorialResult = await orchestrator.call(tutorialQuery);
  console.log(`${colors.magenta}Result:${colors.reset}\n${tutorialResult.text}\n`);

  // 5. Example: Data analysis task
  console.log(`\n${colors.bright}Example 3: Data Analysis Task${colors.reset}\n`);
  
  const analysisQuery = `If a software company has 150 employees and plans to grow by 20% each year, 
  how many employees will they have after 3 years? Also, calculate the total salary cost if the 
  average salary is $120,000 per year.`;

  console.log(`${colors.green}User Query:${colors.reset} ${analysisQuery}\n`);
  console.log(`${colors.blue}Orchestrator working...${colors.reset}\n`);

  const analysisResult = await orchestrator.call(analysisQuery);
  console.log(`${colors.magenta}Result:${colors.reset}\n${analysisResult.text}\n`);

  // 6. Demonstrate stateful agent pattern
  console.log(`\n${colors.bright}Example 4: Stateful Agent Conversation${colors.reset}\n`);
  
  // Create a stateful assistant that remembers context
  const projectManagerAgent = new Agent({
    model: new BedrockModel(modelConfig),
    systemPrompt: `You are a project manager assistant that helps track project progress.
    Remember all project details shared in our conversation.`
  });

  const projectManagerTool = statefulAgentAsTool({
    name: 'project_manager',
    description: 'A stateful project manager that remembers project details across calls',
    agent: projectManagerAgent
  });

  // Create a coordinator that uses the stateful project manager
  const projectCoordinator = new Agent({
    model: new BedrockModel(modelConfig),
    tools: [projectManagerTool],
    systemPrompt: 'You coordinate project activities using the project manager assistant.'
  });

  console.log(`${colors.dim}Demonstrating stateful conversation...${colors.reset}\n`);

  const projectUpdate1 = await projectCoordinator.call(
    "Tell the project manager we're starting a new website redesign project with a 3-month timeline."
  );
  console.log(`Update 1: ${projectUpdate1.text}\n`);

  const projectUpdate2 = await projectCoordinator.call(
    "Ask the project manager what project we're working on and what the timeline is."
  );
  console.log(`Update 2: ${projectUpdate2.text}\n`);

  // 7. Demonstrate batch agent creation
  console.log(`\n${colors.bright}Example 5: Batch Agent Creation${colors.reset}\n`);

  const specializedAgents = createAgentTools({
    code_reviewer: {
      description: 'Reviews code for best practices and potential issues',
      agentFactory: () => new Agent({
        model: new BedrockModel(modelConfig),
        systemPrompt: 'You are a senior code reviewer. Analyze code for best practices, potential bugs, and improvements.'
      })
    },
    documentation_writer: {
      description: 'Writes technical documentation',
      agentFactory: () => new Agent({
        model: new BedrockModel(modelConfig),
        systemPrompt: 'You are a technical documentation specialist. Write clear, comprehensive documentation.'
      })
    },
    test_writer: {
      description: 'Writes unit tests for code',
      agentFactory: () => new Agent({
        model: new BedrockModel(modelConfig),
        systemPrompt: 'You are a test engineer. Write comprehensive unit tests with good coverage.'
      })
    }
  });

  const developmentOrchestrator = new Agent({
    model: new BedrockModel(modelConfig),
    tools: specializedAgents,
    systemPrompt: `You are a development team lead that coordinates code review, documentation, and testing.
    Use the specialized agents to ensure high-quality software delivery.`
  });

  const codeReviewQuery = `Review this TypeScript function and suggest improvements:
  
  function calculate(a: number, b: number, operation: string) {
    if (operation == 'add') return a + b;
    if (operation == 'subtract') return a - b;
    if (operation == 'multiply') return a * b;
    if (operation == 'divide') return a / b;
  }`;

  console.log(`${colors.green}Code Review Request:${colors.reset}\n${codeReviewQuery}\n`);
  console.log(`${colors.blue}Development orchestrator working...${colors.reset}\n`);

  const codeReviewResult = await developmentOrchestrator.call(codeReviewQuery);
  console.log(`${colors.magenta}Review Result:${colors.reset}\n${codeReviewResult.text}\n`);

  console.log(`${colors.bright}✅ Demo completed!${colors.reset}\n`);
}

// Run the demo
main().catch(console.error);