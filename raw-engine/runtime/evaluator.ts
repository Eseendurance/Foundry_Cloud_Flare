import { ASTProgram, TransformRuleNode } from "../engine/ast";

export interface ExecutionContext {
  logs: string[];
  errors: Error[];
}

export async function executeAST(
  ast: ASTProgram,
  payload: Record<string, any>
): Promise<{ data: Record<string, any>; ctx: ExecutionContext }> {
  const ctx: ExecutionContext = { logs: [], errors: [] };
  const output: Record<string, any> = { ...payload };

  // Run transforms across all pipelines in AST
  for (const pipeline of ast.pipelines) {
    ctx.logs.push(`Executing pipeline '${pipeline.name}' with ${pipeline.transforms.length} transformation rule(s)`);

    for (const transform of pipeline.transforms) {
      try {
        output[transform.targetField] = evaluateExpression(transform.expression, payload, output);
        ctx.logs.push(`Transformed field '${transform.targetField}' = ${JSON.stringify(output[transform.targetField])}`);
      } catch (err: any) {
        ctx.errors.push(new Error(`Transform failed for field '${transform.targetField}': ${err.message}`));
      }
    }
  }

  return { data: output, ctx };
}

// Built-in Function & Expression Helper
function evaluateExpression(expr: string, rawInput: Record<string, any>, currentOutput: Record<string, any>): any {
  expr = expr.trim();

  // Helper 1: now() -> ISO timestamp
  if (expr === "now()") {
    return new Date().toISOString();
  }

  // Helper 2: uppercase(field)
  if (expr.startsWith("uppercase(")) {
    const fieldName = expr.match(/uppercase\(([^)]+)\)/)?.[1]?.trim();
    const val = getFieldValue(fieldName, rawInput, currentOutput);
    return typeof val === "string" ? val.toUpperCase() : val;
  }

  // Helper 3: lowercase(field)
  if (expr.startsWith("lowercase(")) {
    const fieldName = expr.match(/lowercase\(([^)]+)\)/)?.[1]?.trim();
    const val = getFieldValue(fieldName, rawInput, currentOutput);
    return typeof val === "string" ? val.toLowerCase() : val;
  }

  // Quoted string literal
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }

  // Number literal
  if (!isNaN(Number(expr))) {
    return Number(expr);
  }

  // Fallback: Lookup field value or return raw expression
  return getFieldValue(expr, rawInput, currentOutput) ?? expr;
}

function getFieldValue(fieldName: string | undefined, rawInput: Record<string, any>, currentOutput: Record<string, any>): any {
  if (!fieldName) return undefined;
  if (fieldName.startsWith("payload.")) {
    const key = fieldName.replace("payload.", "");
    return rawInput[key];
  }
  return currentOutput[fieldName] ?? rawInput[fieldName];
}