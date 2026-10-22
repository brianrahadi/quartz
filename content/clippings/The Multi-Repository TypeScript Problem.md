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
What if we could look at a Producer and Consumer within different repositories and compare their request and response as if they were inside a monorepo? Better yet, what about if we could do this in CI so that we can get this type checking goodness at the same point when we would typically run `tsc`?

![](https://cdn.prod.website-files.com/685162a038275750f4f6996d/687d233b69ad3c23fbaa397c_6878cf0450a1c9d5e95bbbb0_the_multi-_repository_typescript_problem_hero_image-min%20(1).png)
