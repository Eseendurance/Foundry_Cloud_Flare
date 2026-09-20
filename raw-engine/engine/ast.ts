export interface ASTNode {
  type: string;
}

export interface EndpointNode extends ASTNode {
  type: "EndpointNode";
  method: string;
  path: string;
  requiresKey: boolean;
}

export interface TransformRuleNode extends ASTNode {
  type: "TransformRuleNode";
  targetField: string;
  expression: string;
}

export interface ConditionNode extends ASTNode {
  type: "ConditionNode";
  condition: string; // e.g. "user_role == 'admin'" or "role == 'ADMIN'"
  thenBranch: TransformRuleNode[];
  elseBranch?: TransformRuleNode[];
}

export interface WebhookNode extends ASTNode {
  type: "WebhookNode";
  url: string;
  method?: string;
}

export interface PipelineNode extends ASTNode {
  type: "PipelineNode";
  name: string;
  transforms: TransformRuleNode[];
  conditions: ConditionNode[];
  webhooks: WebhookNode[];
}

export interface ASTProgram {
  endpoints: EndpointNode[];
  pipelines: PipelineNode[];
}