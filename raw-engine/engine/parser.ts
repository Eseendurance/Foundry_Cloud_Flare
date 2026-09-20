import { ASTProgram, EndpointNode, PipelineNode } from "./ast";

export function parsePipeDSL(source: string): ASTProgram {
  const ast: ASTProgram = {
    endpoints: [],
    pipelines: [],
  };

  const lines = source.split("\n");
  let currentPipeline: PipelineNode | null = null;
  let inTransformBlock = false;

  for (let line of lines) {
    line = line.trim();

    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    if (line.startsWith("endpoint")) {
      const match = line.match(/endpoint\s+(GET|POST|PUT|DELETE)\s+"([^"]+)"/i);
      if (match) {
        ast.endpoints.push({
          type: "EndpointNode",
          method: match[1].toUpperCase(),
          path: match[2],
          requiresKey: line.includes("requiresKey: true"),
        });
      }
      continue;
    }

    if (line.startsWith("pipeline")) {
      const match = line.match(/pipeline\s+"([^"]+)"/);
      if (match) {
        currentPipeline = {
          type: "PipelineNode",
          name: match[1],
          transforms: [],
          conditions: [],
        };
        ast.pipelines.push(currentPipeline);
      }
      continue;
    }

    if (line.startsWith("transform {")) {
      inTransformBlock = true;
      continue;
    }

    if (line === "}" && inTransformBlock) {
      inTransformBlock = false;
      continue;
    }

    if (inTransformBlock && currentPipeline && line.includes("=")) {
      const parts = line.split("=");
      const targetField = parts[0].trim();
      const expression = parts.slice(1).join("=").trim().replace(/;$/, "");

      currentPipeline.transforms.push({
        type: "TransformRuleNode",
        targetField,
        expression,
      });
    }
  }

  return ast;
}

// Alias parse for backward compatibility with bin/engine.ts
export const parse = parsePipeDSL;
export default parsePipeDSL;