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
  expression: string; // e.g. "uppercase(name)", "now()", "payload.age + 1"
}

export interface ConditionNode extends ASTNode {
  type: "ConditionNode";
  condition: string; // e.g. "role == 'admin'"
  thenBranch: TransformRuleNode[];
  elseBranch?: TransformRuleNode[];
}

export interface PipelineNode extends ASTNode {
  type: "PipelineNode";
  name: string;
  transforms: TransformRuleNode[];
  conditions: ConditionNode[];
}

export interface ASTProgram {
  endpoints: EndpointNode[];
  pipelines: PipelineNode[];
}