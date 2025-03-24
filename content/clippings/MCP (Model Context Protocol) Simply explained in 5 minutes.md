---
title: "MCP (Model Context Protocol): Simply explained in 5 minutes"
source: "https://substack.com/home/post/p-159139276?source=queue"
author:
  - "[[Substack]]"
published:
created: 2025-03-24
description: "What MCP is, how it can save you time, and how it works behind the scenes"
tags:
  - "clippings"
---
https://substack.com/home/post/p-159139276?source=queue

[MCP, or Model Context Protocol](https://modelcontextprotocol.io/introduction), is the hot new trend right now, but it also sounds much more complicated than it actually is. In this article, I’ll simplify what MCP is for you, show you how you can use it to be more productive, and explain how it works behind the scenes.

## What is MCP

**Put simply, MCP is a way for LLMs to more easily integrate with external tools.**

By default, when you talk to Claude, ChatGPT, or your Cursor IDE, if you ask it to “pull the latest errors from Sentry and fix them” it will have no idea what you’re talking about.

Similarly, it won’t know how to do any of these:

- Read the PRD your PM provided and write tests that meet requirements
- Read the messages in your #alerts channel in Slack and debug them
- Create JIRA tickets for some code you found that needs to be refactored

MCP allows you to do **all** of these. It’s a standard protocol that engineers can follow to expose these tools to LLMs.

Below is a simplified diagram of the MCP mental model:

![Client -> MCP servers/adapters -> 3rd party APIs](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6de5b04a-5e6c-47cf-a81e-e332dd3570df_2906x990.png)

There are two key components

1. **MCP Client:** Various clients and apps you use, like Cursor, know how to talk using the “MCP Protocol.”
2. **MCP Servers:** Providers like Sentry, Slack, JIRA, Gmail, etc. set up **adapters** around their APIs that follow the MCP Protocol. Any engineer can also open source their own!  
	  
	Note: The official term they’re called is MCP Servers, but the design pattern at play is the [adapter pattern](https://refactoring.guru/design-patterns/adapter). They convert a message like “Get me the recent messages in the #alerts channel” to a request that can be sent to the Slack API.

So **why** was MCP introduced? It solves the problem of needing to **manually integrate** the different APIs you want to use. If you’ve ever tried talking to 3rd-party APIs, you know how much of a pain it is to integrate all the different API types and patterns. MCP solves that by forcing these providers to follow one standard interface.

We’ll dive more into what that interface looks like soon. First, let’s look at a practical case of how MCP is useful.

## How it’s useful in practice

Let’s say an error appears in the browser console, and you want Cursor to solve it.

![element.ref error in browser console logs](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F20737242-2338-4d97-bd50-9f3aa11726fe_2476x814.png)

We can hook up an MCP Server to Cursor that can give Cursor “superpowers.” It’ll let Cursor read the console logs, take screenshots, and interact with the browser to test if it solved the problem. For this, I used the [AgentDesk BrowserTools MCP](https://browsertools.agentdesk.ai/installation).

Once the MCP is set up, I opened a Cursor composer window and said:

> *“Read from the browser console logs and fix the tooltip ref issue”*

![Telling Cursor, "Read from the browser console logs and fix the tooltip ref issue."](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5727eae4-04cc-4f6f-b468-5283f9369e91_2222x653.png)

Without needing to copy-paste anything, I could tell it to read from the browser logs to fix the issue. Not only that, but it can use this tool and others to check itself. Here’s an example when using “Agent mode”

![Cursor reading from the console errors to figure out what the issue is](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd993cda3-74ed-4294-8cf2-2ee176796402_2198x552.png)

The custom tooltip approach actually got rid of the error! Now, if that’s the best approach… I didn’t think so, but that’s just a matter of re-prompting.

It was cool to see the MCP tool in use when in Agent mode. Cursor did all the things a developer would do, thinking through each step of the problem as it got stuck and identifying different tools to use. You could envision setting Cursor up with all the tools we have access to, like docs search, Slack conversations, reading from PRDs or design docs, and more. With all those tools at its disposal, it’ll become more powerful and can save you even more time.

## How it actually works behind the scenes

To see how MCP works, let’s look at an actual integration—it’s simpler than you’d think. This [mcp-servers repo](https://github.com/modelcontextprotocol/servers) has ones for Google Drive, GitHub, Slack, Sentry, Postgres, and more.

The [Slack MCP Server](https://github.com/modelcontextprotocol/servers/blob/main/src/slack/index.ts) is only one file. There are 3 things happening:

1. Defining a set of tools for the MCP Server to implement
2. Creating the server to listen for incoming requests
3. Defining a \`switch\` case that receives the tool call and calls the underlying external API, like the Slack API.

### Part 1: Defining the tool

Each tool exposed to the client follows the “Tool” interface.

```markup
interface Tool {
  name: string;
  description: string;
  inputSchema: InputSchema;
}

interface InputSchema {
  type: ...;
  properties: ...;
  required: ...;
}
```

Here’s a “getChannelHistoryTool” in the Slack MCP:

```markup
const getChannelHistoryTool: Tool = {
  name: "slack_get_channel_history",
  description: "Get recent messages from a channel",
  inputSchema: {
    type: "object",
    properties: {
      channel_id: {
        type: "string",
        description: "The ID of the channel",
      },
      limit: {
        type: "number",
        description: "Number of messages to retrieve (default 10)",
        default: 10,
      },
    },
    required: ["channel_id"],
  },
};
```

Cursor, or the MCP client, needs to provide the channel ID, and the Slack MCP will return the most recent 10 messages in that channel.

### Part 2: Starting the server

Next, we create the server that will handle the incoming tool requests from Cursor, or the MCP Client.

```markup
const server = new Server(
  {
    name: "Slack MCP Server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

### Part 3: Handling incoming tool calls

We need to give the server a handler to respond to tool calls, like if Cursor asks for the recent messages in a channel. Here’s what that looks like ( [full code here](https://github.com/modelcontextprotocol/servers/blob/bc750b9b6fb1c1216b4706040e53ea95b6a6bd65/src/slack/index.ts#L454) ):

```markup
server.setRequestHandler(
  CallToolRequestSchema, 
  async (request: CallToolRequest) => {
    switch (request.params.name) {
       case "slack_get_channel_history":
         // call slack client and return messages
       
       ... other tool call case statements
    }
})
```

### Part 4: Wiring up transport between Client/Server

There’s one more, hidden part you don’t need to worry too much about, but it might be interesting for you. It’s these lines at the very bottom:

```markup
const transport = new StdioServerTransport();
await server.connect(transport);
```

As you’ll see in the next step, we set up this MCP server to run directly in Cursor. These two lines allow the MCP client and server to communicate more simply than standard HTTP requests. Instead, they can read from standard IO when communicating. [More details are here](https://modelcontextprotocol.io/docs/concepts/architecture#transport-layer).

## How to add an MCP to Cursor

Each MCP will have its own instructions, but in general, **you just need your MCP client (Cursor in this case) to run the MCP server.** Things get more complicated when you need additional integrations, API keys, or permissions.

To start, let’s use the [Puppeteer MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) which will let Cursor interact with our browser.

1. Create a \`.cursor/mcp.json\` file as directed from the [Cursor docs](https://docs.cursor.com/context/model-context-protocol#configuration-locations).
2. Look for the “NPX” command section in the [MCP Server docs](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer).
3. Paste the npx command in the mcp.json file.
```markup
{
  "mcpServers": {
    "puppeteer": {
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ],
      "command": "npx"
    }
  }
}
```

Now, I open the command palette, go to “Cursor settings,” then enable the MCP.

![MCP Servers cursor settings enable button](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe9aa3d03-4106-4eba-9353-0c0325e8ba56_2292x878.png)

After clicking to enable it, the circle will turn green and it will be marked as “Enabled.”

![Green indicator in MCP servers showing that the MCP is enabled](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7fc9d9f4-349e-462b-8c52-a016396aff21_2354x866.png)

Now, when I give Cursor a command in the command palette, it can use Puppeteer to control the browser!

![Cursor calling the MCP tool based on the command I gave it](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd64999c7-ffaf-4f07-9dde-ee0bce46f544_2202x934.png)

The process for setting up other MCPs is the same—it just might involve other pre-setup steps or adding environment variables. For example, the Slack MCP needs you to add a Slack App, then in your \`.cursor/mcp.json\` file add env variables for \`SLACK\_BOT\_TOKEN\` and \`SLACK\_TEAM\_ID\`. [Full setup can be found here](https://github.com/modelcontextprotocol/servers/tree/main/src/slack#setup).

## 📖 TL;DR

- **What is MCP:** It’s a way for LLMs to more easily integrate with external tools.
- **How MCP is useful:** It gives the LLM ways to behave more like a real developer, such as reading from docs, Slack, browser logs, etc.
- **How it works behind the scenes:** A provider, like Slack, sets up a wrapper around its API that follows the standard MCP interface. That wrapper is wired up to the MCP Client in a host like Cursor IDE. The LLM now knows how to call all the tools that Slack provides.
- **How to add an MCP to Cursor:** Follow the docs for the given MCP server you want to add. Usually, it involves updating \`.cursor/mcp.json\` with the correct contents so Cursor knows how to run the MCP.

Resources:

- [Model Context Protocol documentation](https://modelcontextprotocol.io/)
- [Typescript SDK for creating an MCP server](https://github.com/modelcontextprotocol/typescript-sdk)
- [Available MCP Servers GitHub Repo](https://github.com/modelcontextprotocol/servers)

## 👏 Shout-outs of the week

[How Cursor (AI IDE) works](https://blog.sshh.io/p/how-cursor-ai-ide-works) on [Shrivu’s Substack](https://open.substack.com/pub/shrivu) — I came across this gem of a newsletter to learn more about AI under the hood. Thank you, Shrivu, for this article explaining how Cursor works, sharing Cursor’s system prompt, and giving best practices for writing rules and instructions.

**Announcement:** Paid subscribers to the newsletter can now access a [discount](https://read.highgrowthengineer.com/i/142703108/discounts) on [WriteEdge](https://www.writeedge.ai/). We recently added a chat feature that gives you high-quality feedback on your technical docs. Next week’s article will dive into how it’s built behind the scenes!

---

***Thank you for reading and being a supporter in growing the newsletter*** **🙏**

We’re almost at 90k, let’s get there this week!

You can also hit the like ❤️ button at the bottom of this email to support me or share it with a friend to [earn referral rewards](https://read.highgrowthengineer.com/leaderboard). It helps me a ton!