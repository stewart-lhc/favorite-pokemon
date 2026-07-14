import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['/', '/picker', '/game', '/explore', '/pokedex', '/stats'];
const locales = ['ja', 'ko', 'zh-CN', 'zh-TW', 'es-CL', 'en', 'zh-HK', 'es', 'es-PR', 'fr', 'es-CR'];
const seoFields = ['title', 'socialTitle', 'description'];

function readRouteSeoConfig(path, scriptKind) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const declarations = new Map();

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }

  const cache = new Map();

  function unwrap(node) {
    let current = node;
    while (
      ts.isAsExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isParenthesizedExpression(current)
    ) {
      current = current.expression;
    }
    return current;
  }

  function propertyName(name) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
      return name.text;
    }
    throw new Error(`Unsupported computed SEO property in ${path}`);
  }

  function evaluateIdentifier(name) {
    if (cache.has(name)) return cache.get(name);
    const initializer = declarations.get(name);
    if (!initializer) throw new Error(`Unknown SEO identifier ${name} in ${path}`);
    const value = evaluate(initializer);
    cache.set(name, value);
    return value;
  }

  function evaluate(rawNode) {
    const node = unwrap(rawNode);
    if (
      ts.isStringLiteral(node)
      || ts.isNoSubstitutionTemplateLiteral(node)
      || ts.isNumericLiteral(node)
    ) {
      return node.text;
    }
    if (ts.isIdentifier(node)) return evaluateIdentifier(node.text);
    if (ts.isTemplateExpression(node)) {
      return node.templateSpans.reduce(
        (value, span) => value + evaluate(span.expression) + span.literal.text,
        node.head.text,
      );
    }
    if (ts.isObjectLiteralExpression(node)) {
      const value = {};
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) {
          value[propertyName(property.name)] = evaluate(property.initializer);
        } else if (ts.isShorthandPropertyAssignment(property)) {
          value[property.name.text] = evaluateIdentifier(property.name.text);
        } else {
          throw new Error(`Unsupported SEO object property in ${path}`);
        }
      }
      return value;
    }
    throw new Error(`Unsupported SEO syntax ${ts.SyntaxKind[node.kind]} in ${path}`);
  }

  return evaluateIdentifier('routeSeoByLanguage');
}

function expectCompleteSeoShape(config) {
  expect(Object.keys(config).sort()).toEqual([...locales].sort());
  for (const locale of locales) {
    expect(Object.keys(config[locale]).sort()).toEqual([...routes].sort());
    for (const route of routes) {
      expect(Object.keys(config[locale][route]).sort()).toEqual([...seoFields].sort());
    }
  }
}

describe('runtime and build-time SEO configuration', () => {
  it('keeps every locale and route metadata entry in parity', () => {
    const runtimeConfig = readRouteSeoConfig(join(root, 'src', 'App.tsx'), ts.ScriptKind.TSX);
    const buildConfig = readRouteSeoConfig(join(root, 'scripts', 'seo-config.mjs'), ts.ScriptKind.JS);

    expectCompleteSeoShape(runtimeConfig);
    expectCompleteSeoShape(buildConfig);
    expect(runtimeConfig).toEqual(buildConfig);
  });
});
