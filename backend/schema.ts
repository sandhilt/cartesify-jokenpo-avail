import fs from "fs";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";

/*
This code customizes the TypeScript schema generation using openapi-typescript
Node API defined at https://openapi-ts.pages.dev/node/. The goal is to use the
viem types Hex and Address instead of simple strings for some schema properties.
*/

const inputFile =
  "https://raw.githubusercontent.com/cartesi/openapi-interfaces/fce8cc7fcf2d2fcc1940e048cd16fb8550b09779/rollup.yaml";
const outputFile = "src/schema.d.ts";

// import types from viem in generated code
const inject = "import { Address, Hex } from 'viem';\n";

const HEX = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Hex")); // `Hex`
const ADDRESS = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Address")); // `Address`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

console.log(`${inputFile} -> ${outputFile}`);
openapiTS(inputFile, {
  inject,
  transform(schemaObject, options) {
    // use viem.Hex if format is hex
    if (schemaObject.type === "string") {
      if (schemaObject.format === "hex") {
        return schemaObject.nullable ? ts.factory.createUnionTypeNode([HEX, NULL]) : HEX;
      }

      // use viem.Address if format is address
      if (schemaObject.format === "address") {
        return schemaObject.nullable ? ts.factory.createUnionTypeNode([ADDRESS, NULL]) : ADDRESS;
      }
    }
  },
}).then((ast) => {
  const contents = astToString(ast);
  return fs.writeFileSync(outputFile, contents);
});