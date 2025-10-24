import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runPipeline } from './pipeline';
import { PipelineInput } from './types';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main pipeline endpoint
app.post('/api/pipeline/run', async (req: Request, res: Response) => {
  try {
    const input: PipelineInput = req.body;

    // Validate input
    if (!input.employees || !Array.isArray(input.employees)) {
      return res.status(400).json({
        error: 'Invalid input: employees array is required',
      });
    }

    if (!input.lunchMenu || !Array.isArray(input.lunchMenu)) {
      return res.status(400).json({
        error: 'Invalid input: lunchMenu array is required',
      });
    }

    // Run the pipeline
    const result = await runPipeline(input);

    res.json(result);
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoint: POST http://localhost:${PORT}/api/pipeline/run`);
});
