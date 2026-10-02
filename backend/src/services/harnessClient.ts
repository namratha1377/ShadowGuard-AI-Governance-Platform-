import axios from 'axios';

export interface EvaluatePayload {
  user: string;
  department: string;
  target_app: string;
  prompt: string;
}

export interface DetectedEntity {
  type: string;
  match: string;
}

export interface EvaluateResponse {
  risk_score: number;
  risk_tier: 'Low' | 'Medium' | 'High' | 'Critical';
  detected_entities: DetectedEntity[];
  matched_policy: string | null;
  decision: 'allowed' | 'restricted' | 'blocked';
  workflow_path: string[];
  explanation: string;
  verification_used: boolean;
  top_factors?: {
    user_role_contribution: number;
    data_sensitivity_contribution: number;
    endpoint_trust_contribution: number;
    policy_match_contribution: number;
  };
  requires_human_review?: boolean;
  redacted_prompt?: string | null;
  routed_model?: string | null;
}

export interface GenerateResponse {
  response: string;
  provider: string;
}

const HARNESS_URL = process.env.HARNESS_URL || 'http://localhost:8000';

export class HarnessClient {
  static async evaluate(payload: EvaluatePayload): Promise<EvaluateResponse> {
    try {
      const response = await axios.post<EvaluateResponse>(
        `${HARNESS_URL}/evaluate`,
        payload,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error: any) {
      console.error('Harness service call failed:', error.message);
      const failure: any = new Error(
        'ShadowGuard security evaluation is currently unavailable. Please make sure the harness is running on port 8000.'
      );
      failure.status = 503;
      throw failure;
    }
  }

  static async generate(payload: { prompt: string; target_app: string }): Promise<GenerateResponse> {
    const response = await axios.post<GenerateResponse>(
      `${HARNESS_URL}/generate`,
      payload,
      { timeout: 35000 }
    );
    return response.data;
  }
}
