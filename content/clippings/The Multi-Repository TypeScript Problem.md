---
title: "The Multi-Repository TypeScript Problem"
source: "https://www.carrick.tools/blog/the-multi-repository-typescript-problem?utm_source=tldrwebdev"
author:
published:
created: 2025-08-06
description: "Navigating Type Safety Across Service Boundaries"
tags:
  - "clippings"
---
https://www.carrick.tools/blog/the-multi-repository-typescript-problem?utm_source=tldrwebdev

![](https://cdn.prod.website-files.com/685162a038275750f4f6996d/687d233b69ad3c23fbaa397c_6878cf0450a1c9d5e95bbbb0_the_multi-_repository_typescript_problem_hero_image-min%20(1).png)

Work on a large enough Typescript code base with distributed teams and you’re likely working within either a monorepo or polyrepo architecture. Choosing one or the other depends on a number of decisions which can range from architectural (isolated services, independent deployments) to business (self-organising teams, devops maturity, multi-language services). The developer community can be polarising on the merits of both, but when it comes to Typescript, monorepos have profound benefits. With little additional tooling you can give all your services access to a single shared typescript package. Dig a little deeper into modern tooling and you might use [tRPC](https://trpc.io/) to share types or [nx workspaces](https://nx.dev/concepts/typescript-project-linking).

Unfortunately the story in a polyrepo architecture isn’t so simple, but there are options:

- Perhaps your APIs are bound quite strictly to your database schemas. You could fire up these databases and use introspection and codegen tools to generate types from the schemas
- You could publish a shared NPM types package on a private registry and get all your typescript projects to consume it
- You could go “Contract-first” - write the contracts, make each service consume the schemas and generate the types

With all of the above, there is tooling that has to exist in each repository, and for each team that means maintenance:

- If the shared types are updated, then each service needs to know about the version change. You could use a product like [Dependabot](https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot) and alert you on a cadence, but with private registries this isn’t trivial and is the cadence frequent enough (but not noisy) if you are deploying frequently?
- If the business isn’t “contract-first”, then APIs can be updated but the ticket to update the contract sits on the backlog
- If the business is “contract-first”, then each team/service needs to commit an update to their service to access new versions of the schemas

This problem - what at [Carrick](https://carrick.tools/) we like to call **TypeScript's project boundary problem** is what we’re going to try and solve today. Put on your waders as we’re going deep in the weeds. Let’s go!

### The Dream

For the sake of (mild) simplicity, lets limit this discussion to API’s. What if we could look at a Producer and Consumer within different repositories and compare their request and response as if they were inside a monorepo? Better yet, what about if we could do this in CI so that we can get this type checking goodness at the same point when we would typically run `tsc`?

TypeScript needs to understand the full project context to perform type checking. It builds an AST (Abstract Syntax Tree) by traversing imports and exports across files, resolving each type reference to its complete definition. So therefore we would need to have both the producer and consumer from different repos inside a single Typescript codebase to perform type checks. Extracting the code for either the producer or consumer isn’t ideal - do we add the producer to the consumers repo or vice-versa? Do we create a third project? and if so, what dependencies would we need for the code to be valid?

What about if we just extract the types? That seems more straightforward - we can somehow take the request and response types, store them somewhere and reference them in an isolated typescript project at CI time. Lets give that a go.

### The Recursive Type Discovery Problem

First we need to get the types. [Carrick](https://carrick.tools/) utilises a great library called [ts-morph](https://ts-morph.com/) which provides an API on top of the typescript compiler that allows us to perform a surgical extraction of the type. I’ll get into that in more detail in a second, but for now lets assume we can extract the type at a position in the source file for both the consumer and producer repositories…

```typescript
// PRODUCER SIDE (user-service)
export type GetUsersResponse = Response<User[]>;

// CONSUMER SIDE (comment-service) 
const users: User[] = await fetch('/api/users').then(r => r.json());

// Copy Response type:
export type Response<T> = {
  // ... wait, what properties does Express Response actually have?
};

// Copy User type:
export type User = {
  // ... wait, what properties does User actually have?
};
```

OK, we’ve run into a problem. The types are composites of other types. If we’re going to compare these two types we need their dependencies. Let’s fetch them!

```typescript
// Looking up Express Response<T>:
export type Response<T> = {
  status(code: number): this;
  json(obj: any): this;
  send(body?: any): this;
  cookie(name: string, val: string, options?: CookieOptions): this;  // ← What's CookieOptions?
  locals: Record<string, any>;
  app: Application;                                                 // ← What's Application?
  req: Request;                                                     // ← What's Request?
  // ... 47 more properties
} & ServerResponse;                                                 // ← What's ServerResponse?

// "OK, now I need CookieOptions..."
export type CookieOptions = {
  maxAge?: number;
  signed?: boolean;
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  encode?: (val: string) => string;
};

// "And Application..."
export type Application = {
  locals: Record<string, any>;
  mountpath: string | string[];
  settings: any;
  engines: any;
  // ... 85 more properties and methods
} & EventEmitter;                                                   // ← What's EventEmitter?

// "And ServerResponse..."
export type ServerResponse = {
  statusCode: number;
  statusMessage: string;
  socket: Socket;                                                   // ← What's Socket?
  connection: Socket;
  // ... 73 more properties
} & OutgoingMessage;                                               // ← What's OutgoingMessage?

// ============= THE NAMING CONFLICTS =============
// Meanwhile, consumer service has its own types:

export type Response<T> = {              // ← Name clash with Express Response!
  success: boolean;
  data: T;
  message?: string;
};

export type User = {                     // ← Name clash with producer User!
  userId: string;                        // ← Different structure entirely!
  displayName: string;
};
```

OK this has exploded in complexity. What we wanted to do was compare `User` against `User`, but we're now at:

- Types manually copied so far: 47
- Types still needed: ~200+
- Naming conflicts: 12
- Circular dependencies discovered: 8

Let’s find a new approach. Ideally what we want is to recursively find the types if they are defined in the project, and if they are imports we want to preserve the import and add it to our typescript project.

### ts-morph: TypeScript's Compiler as a Library

ts-morph provides a wrapper around the compiler APIs and allows us to traverse the type graph intelligently. To do that we need the source file and the bit position of the type. For [Carrick](https://carrick.tools/) we use [SWC](https://swc.rs/) to traverse nodes in a typescript file and extract these positions (there are other ways if you dig into the ts-morph documentation). Now we can implement something like this:

```javascript
import { Project, Node } from 'ts-morph';

// Create a TypeScript project programmatically
const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

extractTypeAtPosition('src/handlers.ts', 1247);
```

with **`extractTypeAtPosition`** roughly implemented as:

```typescript
function extractTypeAtPosition(filePath: string, position: number) {
  const sourceFile = project.getSourceFile(filePath);
  const node = sourceFile.getDescendantAtPos(position);
  
  if (Node.isTypeReference(node)) {
    // We found our "Response<User[]>" type reference
    // Now we can use TypeScript's own logic to understand it
    console.log(\`Found type reference: ${node.getText()}\`);
    
    // This is where the magic happens - recursive type discovery
    processTypeReference(node);
    
    // Also process any type arguments (the "User[]" part in "Response<User[]>")
    for (const typeArg of node.getTypeArguments()) {
      if (Node.isTypeReference(typeArg)) {
        processTypeReference(typeArg);
      }
    }
  }
}

function processTypeReference(typeRef: Node) {
  const typeName = typeRef.getTypeName().getText();
  console.log(\`Processing type reference: ${typeName}\`);
  
  const symbol = typeRef.getTypeName().getSymbol();
  
  if (symbol) {
    for (const declaration of symbol.getDeclarations()) {
      const filePath = declaration.getSourceFile().getFilePath();
      
      if (filePath.includes('node_modules')) {
        // External dependency - preserve as import
        console.log(\`  → External type from: ${getPackageName(filePath)}\`);
        addToImports(declaration);
      } else {
        // Local type - recursively collect its definition
        console.log(\`  → Local type in: ${filePath}\`);
        collectDeclarationsRecursively(declaration);
      }
    }
  }
}
```

So now we have:

- Local types recursively extracted with full definitions
- External types preserved as clean imports
- We only follow the types we actually need

This gives us the type resolution including dependencies, but how are we going to make these work across service boundaries?

### Creating Portable Type Packages

To keep the scope of this article manageable, lets make some assumptions from here on out so that we have a clear mental model of where we are and what we need to achieve to address the dream of running type checks across service boundaries.

1. We have two services - User Service repository and Comment Service repository
2. We have the above ts-morph program running in a CI process for each repo within Github
3. This process is running on pushes to `main`

…which means we have a few more problems to address:

1. How do we associate the producer and consumer?
2. How do we store and retrieve these types and their dependencies in each service that requires them?
3. How do we output the type check results?

#### Associating the Producer and Consumer

As the producer and consumer likely have similar types, there is a high chance of duplicates if we were to build the type files as-is. Different services can also be built by different teams so we can't rely on naming conventions, but we can be fairly certain that the routing that the producer and consumer use will be the same. We can use that to associate the types and create type aliases for unique naming. That would look something like this:

```typescript
// For PRODUCERS (API endpoints):
function generateProducerTypeName(endpoint: ApiEndpoint): string {
  const method = endpoint.method.toLowerCase(); // "get"
  const normalizedRoute = normalizeRoute(endpoint.route); // "/api/users" → "ApiUsers"
  return \`${capitalize(method)}${normalizedRoute}ResponseProducer\`;
  // Result: "GetApiUsersResponseProducer"
}

// For CONSUMERS (API calls):
function generateConsumerTypeName(call: ApiCall): string {
  const method = call.method.toLowerCase(); // "get"
  const normalizedRoute = normalizeRoute(call.route); // "/api/users" → "ApiUsers"
  const callId = call.call_id || generateCallId(); // "Call1", "Call2", etc.
  return \`${capitalize(method)}${normalizedRoute}ResponseConsumer${callId}\`;
  // Result: "GetApiUsersResponseConsumerCall1"
}
```

`‍   `

#### Storing Types and Their Dependencies

Each CI process needs to create a self-contained package that can be shared with other repositories. This requires two key artifacts:

**1\. The TypeScript definitions file:**

```typescript
// user-service_types.ts
import { Response } from 'express';
import { ObjectId } from 'mongodb';

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}

export type GetApiUsersResponseProducer = Response<User[]>;
export type PostApiUsersRequestProducer = User;
```

**2\. The dependency manifest (package.json):**

```json
{
  "name": "user-service-types",
  "version": "1.0.0",
  "dependencies": {
    "express": "4.18.0",
    "mongodb": "5.1.0",
    "@types/node": "18.15.0"
  }
}
```

`‍   `

These artifacts get uploaded to shared storage (S3, dynamoDB, etc.) where other CI processes can download them.

#### Performing the Type Validation

Now we have all the pieces, but how do we actually use them to validate compatibility?

When a repository's CI process runs, it downloads the type packages from all its related services and creates a temporary TypeScript project specifically for validation. In this isolated environment, we can:

1. **Reconstruct the Project -** We create source files from the downloaded definitions (`user-service-types.ts`, `comment-service-types.ts`, etc.).
2. **Unify Dependencies -** We merge the `dependencies` from each package's manifest into a single `package.json`.
3. **Install -** We run `npm install` to ensure all external types (like those from `express` or other libraries) are available to the compiler.

We're programmatically constructing a valid TypeScript project where types from completely separate repositories can coexist and be compared.

### Compiling within the compiler

The beauty of this approach is that we can simply let TypeScript's own type checker determine compatibility. Instead of writing custom validation logic to manually traverse and compare type structures, we can leverage simple assignability rules.

We can create a small validation script that loads this temporary project and uses the compiler's API to directly compare the types we've aliased.

```typescript
// Create a type compatibility checker from the temporary project
const typeChecker = validationProject.getTypeChecker();

// Find the aliased producer and consumer types
const producerType = findType('GetApiUsersResponseProducer').getType();
const consumerType = findType('GetApiUsersResponseConsumerCall1').getType();

// Let TypeScript decide compatibility using its own internal logic
const isCompatible = producerType.isAssignableTo(consumerType);

if (!isCompatible) {
  // If it fails, we get TypeScript's actual diagnostic message,
  // which is far more useful than a simple true/false.
  const error = getTypeCompatibilityError(producerType, consumerType);
  // "Type 'Response<User[]>' is not assignable to type 'Comment[]'."
}
```

If it fails, we create a fake assignment that's guaranteed to fail, then extract TypeScript's own error message.

```typescript
function getTypeCompatibilityError(producerType: Type, consumerType: Type): string {
  // Create a test assignment to trigger TypeScript's diagnostics
  const testCode = \`
    declare const producer: ${producerType.getText()};
    declare const consumer: ${consumerType.getText()};
    
    // This assignment will fail and give us the exact error message
    const test: ${consumerType.getText()} = producer;
  \`;

  // Create a temporary file and get TypeScript's diagnostic
  const tempFile = project.createSourceFile('temp.ts', testCode);
  const diagnostics = tempFile.getPreEmitDiagnostics();
  tempFile.delete();

  // Find the assignment error
  const error = diagnostics.find(d => 
    d.getMessageText().includes("not assignable")
  );

  return error ? error.getMessageText() : "Types are incompatible";
}
```

This approach is powerful because TypeScript already knows about the nuances of its own system. The validation feels seamless because it uses standard TypeScript compilation - we're just operating it across repository boundaries in a way it wasn't originally designed for.

### The Engineering Reality

Building this system taught us several things about TypeScript's internals that we didn't fully appreciate at the outset.

- **Complexity explosion -** What started as a simple idea of extracting and comparing types became a deep dive into TypeScript's symbol resolution, module loading, and type instantiation systems.
- **Considerations of performance at scale -** Building a Github action and keeping it snappy in CI runs means finding ways to shave critical seconds off compile times. Creating an isolated typescript environment for cross-repo checking means we’re not running the Typescript compiler across hundreds of files.
- **TypeScript's boundaries are artificial -** The compiler already has all the machinery needed for cross-project type checking, it's just not exposed in a way that makes it easy. Most of our engineering was about building a work around those artificial boundaries.

This approach scales because we're leveraging TypeScript's existing infrastructure rather than building a parallel system. Every improvement to the TypeScript compiler automatically improves our validation accuracy.

The dream of monorepo-style type safety in a polyrepo architecture is possible. You just need to convince TypeScript to look beyond its own project boundaries.