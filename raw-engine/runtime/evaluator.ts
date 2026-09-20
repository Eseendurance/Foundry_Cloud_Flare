import { ASTProgram, TransformRuleNode } from "../engine/ast";

export interface ExecutionContext {
  logs: string[];
  errors: Error[];
  webhooksTriggered: string[];
}

export async function executeAST(
  ast: ASTProgram,
  payload: Record<string, any>
): Promise<{ data: Record<string, any>; ctx: ExecutionContext }> {
  const ctx: ExecutionContext = { logs: [], errors: [], webhooksTriggered: [] };
  const output: Record<string, any> = { ...payload };

  for (const pipeline of ast.pipelines) {
    ctx.logs.push(`Executing pipeline '${pipeline.name}'`);

    // 1. Unconditional Transforms
    for (const transform of pipeline.transforms || []) {
      applyTransform(transform, payload, output, ctx);
    }

    // 2. Conditional Logic (if / else)
    for (const condNode of pipeline.conditions || []) {
      const conditionMet = evaluateCondition(condNode.condition, output, payload);
      ctx.logs.push(`Evaluating condition (${condNode.condition}) => ${conditionMet}`);

      const targetBranch = conditionMet ? condNode.thenBranch : condNode.elseBranch || [];
      for (const transform of targetBranch) {
        applyTransform(transform, payload, output, ctx);
      }
    }

    // 3. Webhook Notifications
    for (const webhook of pipeline.webhooks || []) {
      try {
        ctx.logs.push(`Dispatching webhook to: ${webhook.url}`);
        fetch(webhook.url, {
          method: webhook.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(output),
        }).catch((err) => {
          ctx.logs.push(`Webhook warning (${webhook.url}): ${err.message}`);
        });
        ctx.webhooksTriggered.push(webhook.url);
      } catch (err: any) {
        ctx.errors.push(new Error(`Webhook dispatch failed: ${err.message}`));
      }
    }
  }

  return { data: output, ctx };
}

function applyTransform(
  transform: TransformRuleNode,
  payload: Record<string, any>,
  output: Record<string, any>,
  ctx: ExecutionContext
) {
  try {
    output[transform.targetField] = evaluateExpression(transform.expression, payload, output);
    ctx.logs.push(`Set '${transform.targetField}' = ${JSON.stringify(output[transform.targetField])}`);
  } catch (err: any) {
    ctx.errors.push(new Error(`Transform failed for field '${transform.targetField}': ${err.message}`));
  }
}

function evaluateCondition(
  conditionStr: string,
  currentOutput: Record<string, any>,
  rawInput: Record<string, any>
): boolean {
  try {
    let op = "";
    if (conditionStr.includes("==")) op = "==";
    else if (conditionStr.includes("!=")) op = "!=";

    if (op) {
      const parts = conditionStr.split(op).map((s) => s.trim());
      const leftKey = parts[0];
      const rightVal = cleanQuotes(parts[1]).toLowerCase();

      const leftVal = String(
        getFieldValue(leftKey, currentOutput) ?? getFieldValue(leftKey, rawInput) ?? ""
      ).toLowerCase();

      if (op === "==") return leftVal === rightVal;
      if (op === "!=") return leftVal !== rightVal;
    }

    const val = getFieldValue(conditionStr, currentOutput) ?? getFieldValue(conditionStr, rawInput);
    return Boolean(val);
  } catch {
    return false;
  }
}

function evaluateExpression(
  expr: string,
  rawInput: Record<string, any>,
  currentOutput: Record<string, any>
): any {
  expr = expr.trim();

  if (expr === "now()") return new Date().toISOString();

  if (expr.startsWith("uppercase(")) {
    const fieldName = expr.match(/uppercase\(([^)]+)\)/)?.[1]?.trim();
    const val = getFieldValue(fieldName, currentOutput) ?? getFieldValue(fieldName, rawInput);
    return typeof val === "string" ? val.toUpperCase() : val;
  }

  if (expr.startsWith("lowercase(")) {
    const fieldName = expr.match(/lowercase\(([^)]+)\)/)?.[1]?.trim();
    const val = getFieldValue(fieldName, currentOutput) ?? getFieldValue(fieldName, rawInput);
    return typeof val === "string" ? val.toLowerCase() : val;
  }

  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return cleanQuotes(expr);
  }

  if (!isNaN(Number(expr))) return Number(expr);

  return getFieldValue(expr, currentOutput) ?? getFieldValue(expr, rawInput) ?? expr;
}

function cleanQuotes(str: string): string {
  return str.replace(/^['"]|['"]$/g, "");
}

function getFieldValue(fieldName: string | undefined, data: Record<string, any>): any {
  if (!fieldName || !data) return undefined;
  if (fieldName.startsWith("payload.")) {
    return data[fieldName.replace("payload.", "")];
  }
  return data[fieldName];
}