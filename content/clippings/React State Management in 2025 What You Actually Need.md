---
title: "React State Management in 2025: What You Actually Need"
source: "https://www.developerway.com/posts/react-state-management-2025"
author:
  - "[[Nadia Makarevich]]"
published: 2023-08-11
created: 2025-11-10
description: "Learn how to manage state in modern React apps, what is remote, URL, local, and shared state, and when you actually need a state management library."
tags:
  - "clippings"
---
https://www.developerway.com/posts/react-state-management-2025

Nadia Makarevich

![React State Management in 2025: What You Actually Need](https://www.developerway.com/_next/image?url=%2Fassets%2Freact-state-management-2025%2Fwelcome-large.png&w=2048&q=75 "React State Management in 2025: What You Actually Need")

If you've read my blog long enough, you'll know that I usually stay away from writing "opinion" articles. Most of my writing simply describes how things work. There is not much room for opinions there.

Not this time! From time to time, I'm asked what I think about state management, the best libraries, and the best practices for it. Can't avoid opinions in something like this. So, which library to choose these days? Good old Redux, maybe newer Zustand, or something completely different? Why not just use Context instead?

So here's my opinion, to kick off the discussion: **you don't need any of them**! Happy reading if you're curious about why, while I hide under a table, just in case. 😅

## Why Do You Want to Make a State Management Decision?

So, what is the best state management solution... First things first: why do you want to know? No, really.

There is no such thing as "the best" anything. It always, always depends. (Except for ice cream. Pistachio ice cream is the best).

If you simply want to learn something new to add to your CV and improve your job searching chances, then learn the most popular libraries. ["State of React"](https://stateofreact.com/en-US) and similar surveys are your friends here. Or even better - open the job descriptions of the company you're trying to apply for and extract those names from there. Or even betterer (more better? 🤔) learn the [core](https://react.dev/) and [advanced](https://www.advanced-react.com/) React concepts, like how re-renders and reconciliation work, for example. All state management libraries then become the same to you, just a matter of expressing the same concept in a slightly different way.

If you work on an existing old and large project, are unhappy with your current state management solution being Redux, and want to introduce something better, then you also don't need "the best" library. The most important thing in this case would be to understand why the current library makes you unhappy. The last thing you want to do is replace a well-known solution with something that does things very differently, requires a huge investment into upskilling colleagues, and doesn't solve the problem you promised to solve. A good example here would be trying to replace Redux with something like XState in an attempt to solve the "Redux is too complicated" problem.

You might also feel like your existing library is bad for performance, and you need something better. In this case... Is the library itself problematic? How sure are you? With numbers, please. Because I can bet almost anything that the impact of the library itself will be negligible. More likely, the problem is unoptimized for re-renders code or some very slow calculations on the critical path. Those might be influenced by the way the library encourages you to write code. Or they might not! It could be a sign of a bigger engineering problem in your org. In any case, switching to something different without fully understanding the problem will most likely achieve nothing.

Interestingly enough, while investigating what the problem is with your current code, you might find that you don't need a dedicated state management library at all. There are different state concerns that in the "old Redux days" were lumped together. But these days, a lot of them could be handled better with a library that targets that specific concern. So it's possible that the best solution for your particular use case would be to slowly replace the old library on a case-by-case basis with *three* different libraries, with state management concerns being almost negligible there.

You can also be on the path of kicking off a completely new project, free of any legacy influence, and want to choose the best tech stack, including state management, for it in advance. In the hope that you don't have to suddenly migrate to something completely different in a year or so, when your chosen library becomes deprecated because of yet another tech drama. In this case, ~~I admire your optimism~~ the rest of the article is for you.

## State Concerns That Don't Need a State Management Library

So, what is this "state" that we want to manage?

Essentially, it's just data. Data that influences how your system works or behaves. When you're eating ice cream, for example, the state of your mind as a system can be defined as:

1. In anticipation of eating ice cream.
2. Enjoying eating ice cream.
3. Satisfied after finishing ice cream.

Or, if we focus on React, it can be:

- The state of a modal dialog's openness (open/closed).
- The state of data fetching from an endpoint (no data/loading data/error happened/successfully loaded data).
- The state of a component's lifecycle (mounted or not mounted).

Or any other data that can influence how something is rendered on the screen or behaves in response to user interaction with the UI.

Speaking of data and React...

### Remote State

One very distinct and usually quite complicated use case for "state management" has always been dealing with "remote" data. I.e., data that exists somewhere outside, like a database, that we want to fetch via a REST endpoint (most of the time) and integrate into the React app.

Even the simplest "fetch and render" situation is not as easy as it seems. The UI should be able to handle at the very least three states of the data: no data yet, data is loading, and data is finally here.

But then, something can happen while the data is loading, like a server being down. So you need to add a way to handle failure here. You also don't want to trigger fetching multiple times if two or more components want to fetch from exactly the same endpoint.

Oh, and by the way, if you fetched that data on one page, you'd probably want to cache it so it can be reused on another page. Although you'd probably want to implement some mechanisms to refresh that cache from time to time to avoid stale data. Or clean it completely.

And speaking of cache. Surely you'd want to avoid [request waterfalls](https://www.developerway.com/posts/how-to-fetch-data-in-react), right? When a request for data is trapped inside a conditionally rendered component that only kicks off when another completely irrelevant request has finished. In this case, you'd want to parallelize those requests, pre-fetch the hidden data, put it into cache, and extract it from the cache when the need arises.

I'm still talking about "fetch, render, and forget" use cases, by the way! But what if you need to fetch that data as a response to user interaction? You'd add [race conditions](https://www.developerway.com/posts/fetching-in-react-lost-promises) and the fight with them to the mix.

And you're in a world of pain if the data can be *modified*, especially if you want to add the concept of "optimistic update" to the mix while preserving data integrity.

So if you're trying to migrate an older app from Redux, chances are, ~80% of your Redux-related code handles everything above.

In this case, you don't need a state management library. You need a good React-first data management library. Something that solves everything mentioned above, is actively maintained, has a good reputation, good documentation, and is stable. I.e., at the very least, > 1.x version and no major version rewrites every 6 months.

My default choice for this use case is [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) (formerly known as React Query). Told you, it will be opinions, not a "let's investigate" article! But really, try migrating to it from a legacy Redux-based custom solution if you haven't tried it. You'll cry happy tears, your life will never be the same, and 80% of your code will be just gone.

Want to fetch some data in a component while being mindful of loading and error states? Easy:

```
function Component() {
  const { isPending, error, data } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => fetch('https://my-url/data').then((res) => res.json()),
  });

  if (isPending) return 'Loading...';

  if (error) return 'Oops, something went wrong';

  return ... // render whatever here based on the data
}
```

Want to fetch from this endpoint in another component without triggering an additional fetch request? Don't even worry about it, just use the same `queryKey`, and the library will take care of it for you.

Want to prefetch and cache some of those requests? Don't mess with the code above, just add ["queryClient.prefetchQuery"](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching) call where you want to trigger your prefetch, the library will take care of the rest.

Want to implement a [paginated query](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)? [Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)? [Retries](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries) based on some condition? No worries about any of this, the library has you covered. I rarely get excited about tools, but this one is an exception.

If you don't like TanStack Query for some reason, it has a contender named [SWR](https://swr.vercel.app/). Both are equally good and comprehensive, with similar functionality. The API is slightly different, and TanStack Query is maintained by independent maintainers, whereas SWR is Vercel's product. So in the end, the choice between the two comes down to who you trust more and which API you like more. Play around with both and choose by the vibes here.

In the meantime, let's talk about another popular "remote" place that can store some information relevant to your React app.

### URL state

Everything that is happening in the website's URL is a state in a way, wouldn't you agree? When the URL changes, the UI responds in kind. And in modern apps, this response can be anything, from transitioning to another page to changing which tab is open based on a query param.

The base (or pathname) part of the URL these days is almost exclusively controlled by external routers and often file- and folder-based (like in Next.js). So it's not something we usually think about in the context of state management.

The query string part, however, is different. This is where we would store some fine-grained information that affects tiny aspects of what is happening on a particular page.

Consider this URL: `/somepath?search="test"&tab=1&sidebar=open&onboarding=step1`. Everything after the question mark is a state that defines which tab is open, whether the sidebar is open or closed, and at what stage the onboarding is. When the URL changes, the UI should reflect that. And when the user transitions through the onboarding steps or clicks on a new tab, the URL should change as well.

In older Redux-based apps you'd often see quite a lot of logic that manually implements that two-way syncing. These days, some of the routers will handle the syncing for you. React Router, for example, gives you the `useSearchParam` [hook](https://reactrouter.com/api/hooks/useSearchParams) for that, which you can use in the same way as state:

```
export function SomeComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ...
}
```

Other routers, however, are not that generous. Next.js, for example, gives you a nice hook to [read search params](https://nextjs.org/docs/app/api-reference/functions/use-search-params), but if you need to sync them with an internal state, which includes updates, you still need to jump through hoops.

If this is your case, I have information that will change your life forever. Don't jump through those hoops. Manually syncing local state with the URL is a journey full of misery and weird bugs. Use [nuqs](https://nuqs.dev/) library instead. Same as with TanStack Query being a game-changer for remote state, this beautiful but obscurely named library is a game-changer for managing query params.

Here's what syncing our onboarding state with the URL will look like with this library:

```
export function MyApp() {
  const [step, setStep] = useQueryState('onboarding');

  return (
    <>
      <button onClick={() => setStep('step2')}>Next Step</button>
    </>
  );
}
```

For tabs, do you want to default to `1` if the param is not present and be an actual number, not a string? Sure:

```
export function MyApp() {
  const [tab, setTab] = useQueryState('tab', parseAsInteger.withDefault(1));

  return (
    <>
      <button onClick={() => setTab(2)}>Second tab</button>
    </>
  );
}
```

If you ever implemented any of the above manually, you'll cry right now.

### Local State

There is another type of state that, in the post-Redux world, doesn't need a state management library. Local state! Is the dropdown open or closed? Is the tooltip visible? Is the component mounted? Basically, all the information that exists within the logical boundaries of a component that doesn't need to be shared with other components.

```
// the isOpen state is localized and doesn't need sharing
export function CreateIssueComponent() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Create Issue Dialog</button>
      {isOpen && <CreateIssueDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

I'm only mentioning this here because older apps, especially those that overuse Redux, tend to manage *all* the state via the state management library of their choosing. But if you're starting a new project from scratch, there is zero reason to introduce a new library for concerns like this.

This conversation, however, starts getting interesting when you need to ***share*** some of that state between different components.

## Shared State

Imagine, for example, an app with a collapsible panel on the left and a few ways to expand/collapse that panel:

- By clicking a hovering button at the right edge of that panel.
- By dragging the panel with the mouse by its edges.
- By clicking a button with a corresponding "expand" or "collapse" icon in the top bar.
- Via a keyboard shortcut.
- By entering a "full-screen" edit mode in the app, either by clicking a button or via a keyboard shortcut.

In other words, a bunch of components from very different parts of the app, that don't even know about each other, want to know and control our sidebar's most personal information. ~~Just like social media platforms~~.

### Shared State and Props Drilling

One way to share this information would be a technique known as ["lifting state up"](https://react.dev/learn/sharing-state-between-components#lifting-state-up-by-example). You'd need to find the most common parent for all of the components that want to know the information, move the state there, and propagate its value and the setter via props down to everyone. The result is as messy as you can imagine:

```
export function MyApp() {
  return (
    <>
      <TopBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="content">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <div className="main">
          <MainArea
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>
      </div>
      <KeyboardShortcutsController
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
    </>
  );
}
```

The state of the sidebar is *everywhere*. The code is hard to read because of the useless props that do nothing other than pass information around. Refactoring that state would require changing *every single component*.

To make things worse, every single component in that hierarchy will re-render with every state change, with *absolutely no way to prevent that*. No amount of memoization will help here, since every prop on every component will change with the state change. That kinda sucks.

This pattern is called "prop drilling", by the way. Don't get me wrong, it's a viable pattern for sharing state between parents/children on occasion. But if you need to drill through more than three levels of hierarchy, and more than two or three times throughout the app, you might have a problem.

### Shared State and Context

If prop drilling plagues your app, Context comes to the rescue. Context is a special mechanism for sharing data in React that allows you to bypass the hierarchy levels.

The idea is this. You have your state that you want to share with multiple independent components. You extract that state into its own component. You create "Context" inside that component, put your data there, and render that component at the top of your app. Then, you can access that Context directly in any component below in the hierarchy that needs that state.

From a code perspective, if I rewrite the previous "sidebar" example, it will be something like this. Creating Context with some default values:

```
});

// Expose the Context via hook:
```

Creating the "Provider" component that holds the Context:

```
const value = React.useMemo(
    [isSidebarOpen],
  );

  // "value" prop is the Context value
  // This is what will be available to everyone who tries to access Context
  return (
      {children}
    </SidebarContext.Provider>
  );
};
```

Rendering that Provider where the state used to live:

```
// Everything inside will have access to the Context value
export function MyApp() {
  return (
    <SidebarProvider>
      <TopBar />
      <div className="content">
        <div className="main">
          <MainArea />
        </div>
      </div>
      <KeyboardShortcutsController />
    </SidebarProvider>
  );
}
```

Use the Context value directly where it's needed, for example, in a tiny button somewhere inside the `TopBar` component that toggles the sidebar's open state.

```
return (
    <button
    >
    </button>
  );
};
```

And since "toggle" functionality is pretty standard, I can even implement it as a predefined API available to everyone who uses SidebarContext:

```
const value = React.useMemo(
    () => ({
      isSidebarOpen,
      setIsSidebarOpen,
      // Introduce the "toggle" API
    }),
    [isSidebarOpen],
  );

  return ... // same as before
};
```

And then use it in the button:

```
return (
    <button
    >
    </button>
  );
};
```

The benefits of this approach, compared to prop drilling, are great!

The code is readable and clean. No more unnecessary props. Refactoring that state doesn't mean a complete rewrite anymore. I'd need to change only the components that actually use it. And if you don't expose the state directly, but instead create a sensible API, like the `toggleSidebar` function, you might not need to refactor anything other than the provider's implementation itself! The code is highly contained, which is always good.

Even performance could potentially improve, despite what you might hear about Context being bad for performance. Because only the components that *use* that Context will re-render on its state change. All middle-of-the-hierarchy components where we removed the transitive props will no longer re-render.

Context is not all sunshine and roses, however. If you ask me whether I'd recommend using it extensively in your apps, I'd say "Absolutely not!".

Here's why.

### Don't Use Context for Shared State

As you've seen, I had to introduce a "Provider" component for the Context to work. That Provider should live at the closest parent of all components that need that Context, at the very least.

```
export function MyApp() {
  return (
    <SidebarProvider>
      ...
    </SidebarProvider>
  );
}
```

If I want to share some other state, like, for example, Theming, I'd naturally introduce another provider:

```
export function MyApp() {
  return (
      <ThemingProvider>
        <SidebarProvider>
          ...
        </SidebarProvider>
    </ThemingProvider>
  );
}
```

Then something else needs to be shared:

```
export function MyApp() {
  return (
      <SomethingElse>
          <ThemingProvider>
            <SidebarProvider>
              ...
            </SidebarProvider>
        </ThemingProvider>
    </SomethingElse>
  );
}
```

Too. Many. Providers. At some point, you'd want to group some of them, but someone else won't understand the grouping logic and adds other providers outside of the group. Some of the providers will start depending on each other. Some of them won't really make sense at the root level, so you'll try to move them closer to the end code, just to forget about it during the next refactoring, and be confused by the weird behavior in components that depend on Context but lost their Provider at the top.

Welcome to **"Providers Hell"**.

Providers like that are great when you need to distribute one or two states throughout the app. Maybe the only things that are shareable in your code are "Theming" and "UserAuthStatus". In this case, introducing two Context Providers is not a big deal.

Anything more, and it quickly gets out of control.

In this case, you might be tempted to merge all those states together under a single provider and separate them logically. Something like this:

```
},
  theming: {
    isDarkMode: false,
    setIsDarkMode: (isDark: boolean) => {},
    toggleDarkMode: () => {},
  },
  user: {
  },
});

  // implement all the states here

  return (
      {children}
    </SharedStateContext.Provider>
  );
};
```

Then, you'd need just one single provider for the entire app:

```
export function MyApp() {
  return (
    {/* One and only provider */}
    <SharedStateProvider>
      {/* the rest of the app */}
    </SharedStateProvider>
  );
}
```

And then, you could access everything via dot notation in all other components:

```
return (
    <button
    >
    </button>
  );
};
```

Technically, this will work. Whether it's a good idea or not from a separation-of-concerns perspective is debatable, but I'll leave it for now. The bigger problem here is **performance**. Or **re-renders** caused by the state change inside the provider, to be precise.

You see, the problem with Context is that when its value changes, *every single user of the Context* re-renders. All of them! Regardless of whether they use the part of the state that changed or not.

In the example above, that would mean that `SmallToggleSidebarButton` re-renders even if the `sidebar` state didn't change, but `theming` did. And vice versa.

With a somewhat complicated and widespread state like the above, that means that on every interaction, the entire app re-renders. This could be okay if the app is small. Or you might end up with the sidebar freezing for a few seconds on every interaction. Your users won't like that.

No premature optimization and measure first, of course. But the overuse of providers is almost guaranteed to cause you pain, suffering, weird bugs, and performance problems as soon as your app grows beyond a few shared state concerns. There are ways to mitigate that problem, of course, like [splitting Context providers into smaller pieces](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context). But at this point, you're basically re-inventing Zustand, so you might as well just use it right away.

Which finally leads me to what the article was all about - state management libraries!

## Shared State and External Libraries

Only when you have more complex shared state concerns in your app and you predict that the Context is not enough, is it time to look into external state management libraries.

Luckily, since we already did so much pre-work, we know exactly what to look for.

First of all, we eliminated like 80% of the state management concerns in an average app by choosing a data management library ([TanStack Query](https://tanstack.com/query/latest), [SWR](https://swr.vercel.app/)). Then we removed another 10% by moving URL state to [nuqs](https://github.com/47ng/nuqs). Only 10% left!

Considering that, the very first thing I'm going to look for in a shared state solution is simplicity. There really isn't much to handle in those 10%, so I really need something here that doesn't consume my brain resources. I need something that is dead simple to set up and does not introduce its own unique and abstract terminology. I want to look at the code and infer intuitively what it means and what to expect without opening the docs of the library.

Everything that implies that "you need to forget everything you learned" or introduces some "new, conceptual way of thinking" immediately goes to the bin. Those things are okay if you're trying to invent a completely new programming language that is going to change the world. But a massive overkill for a few shared state concerns in an average React app.

Secondly, we can always share data between components via Context. It's just that Context is not really scalable: it introduces the problems of "Providers Hell" and unnecessary, unstoppable re-renders.

That means the external library shouldn't have those problems. Otherwise, what's the point? It should either have only one global provider or no providers at all. And it should allow us to extract only parts of the state and be confident that if this part doesn't change, then the component update won't be triggered.

Also, since we live in the React world, the library should be compatible with React's direction and way of doing things. That means it should be updated to the latest React, survive in SSR and RSC environments, be hooks-based, based on unidirectional data flow, and declarative. Which means, by the way, that everything that includes "signals" and "observables" in its description immediately goes to the bin here. Although those things won't pass the "simplicity" test anyway 😅.

Just to be clear here: I'm not hating on "signals" and "observables" patterns. It's just that they require a significant mental shift from the typical "React" way of doing things. Plus, those are very non-intuitive patterns with a significant learning curve. People who haven't encountered them in their previous non-React experiences usually *really* struggle with those patterns.

Back to the libraries. Since all of them are open source, I want to have at least some degree of confidence that the library will survive for the next few years. That means it needs to be either really popular, so that in the event of some drama, there is at least some chance someone picks it up as a maintainer. Or, it needs to be maintained by a few people or even a company with a decent reputation as OS maintainers.

The above point just slightly improve the chances. it's not a guarantee of anything. That's why I want to double down on "simplicity" and "aligned with React's way" here. In the likely event of something going wrong with the library, I want to be able to switch to a new, similar solution with minimal refactoring.

Now that I have the criteria defined, wanna rate stuff and see the result? 😅

From the ["State of React"](https://2024.stateofreact.com/en-US/libraries/state-management/) survey, the most popular state management libraries are:

- [Redux](https://redux.js.org/) & [Redux Toolkit](https://redux-toolkit.js.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [MobX](https://mobx.js.org/README.html)
- [Jotai](https://jotai.org/)
- [XState](https://xstate.js.org/)

My evaluation for these would go like this.

**Simplicity**

- 👎 **Redux**. Absolutely not. Redux is notorious for being too complicated with too much boilerplate. The fact that Redux Toolkit was invented to make Redux simpler is telling.
- 😐 **Redux Toolkit**. Probably no. It's okay from the look at the current docs (been a long time since I used it), but it still feels like a lot of concepts to learn.
- 🎉 **Zustand**. An absolute winner here. You literally just create some state and then use it via a hook. You read two lines in the docs, and you're already an expert in this library.
- 👎 **MobX**. "Signals", "observables". Immediate no.
- 👎 **Jotai**. Introduces its own abstract concepts like "atoms". Nope.
- 👎 **XState**. "Event-driven", "state machines", "actors", "models", "complex logic". Definitely not simple.

**One or fewer providers**

🎉 All of them, from what I can see, use either one provider or none at all.

**No re-renders if the used state part doesn't change**

- 🎉 Redux & Redux Toolkit. Possible via creating selectors.
- 🎉 Zustand. Out-of-the-box.

The rest of them probably also support it in some shape or form; otherwise, no one would use them. But this criterion is still vital to verify with code when actually selecting a solution, especially if it's a very new library.

**Compatible with React direction and latest features**

Too much work to properly verify all of them, which would involve coding with them for real. I would do it if they met all other criteria and I was considering them for real for my next project.

- 🤨 **Redux Toolkit**. I really need to look into that one to make a decision.
- 🎉 **Zustand**. Supports everything from experience (I used it quite a lot).
- 🎉 **Jotai**. I haven't used it, but most likely it supports everything, since it's the latest and actively maintained library written by the author and the maintainer of Zustand as well.
- 👎 **MobX**. "Signals", "observables" - i.e., not "declarative" or "React way". No.
- 👎 **XState**. "Event-driven", i.e., not "declarative" or "React way". No.

**Open source concerns**

🎉 All of them seem to be actively maintained, no huge red flags here. Which is natural since all of them are on the list of most popular frameworks.

---

So, here it goes. [Zustand](https://github.com/pmndrs/zustand) is the winner in all categories. Which matches my default tech stack choice for any new project: [TanStack Query](https://tanstack.com/query/latest) + [nuqs](https://nuqs.dev/) + [Zustand](https://github.com/pmndrs/zustand).

Does it mean that Zustand is the best? Absolutely not! 😅 It just satisfies the criteria that are important to me. The result could've been very different with different criteria! For example.

If I added **"structured, opinionated"** as the top priority and didn't mind a bit of a learning curve, then 🎉 **Redux Toolkit** would've won. Zustand is really on the "do whatever, I don't care" side of the spectrum, and Redux is known for being very structured and very opinionated. This could be very useful in larger organizations, where consistency in how you write code trumps everything.

If my top priority is **"advanced debugging experience"**, then 🎉 **Redux Toolkit** would've won again. The Redux DevTools plugin is beloved by many for that.

If I am absolutely in love with the **"state machines"** pattern, and my shared state concerns are very advanced (thinking Figma-level complexity), then 🎉 **XState** is something I'd look into more deeply.

And so on and so forth, you get the idea 😊.

## TL;DR: What State Management Really Looks Like in 2025

Okay, so TL;DR of everything above. Most of the time, especially if you're not implementing the next Figma, you don't need a "state management library" at all. The days of putting *everything* into Redux are long gone. Break your state into different concerns, and you'll find yourself with better solutions for them than any "generic" state management library.

- **Remote state**. Anything coming from a backend, API, database, etc., could be handled by a data-fetching library. [TanStack Query](https://tanstack.com/query/latest) or [SWR](https://swr.vercel.app/) are the most popular choices these days. They solve caching, deduplication, invalidation, retries, pagination, optimistic updates, and many more, and likely much better than any manual implementation.
- **Query params in URL state**. If your router doesn't support syncing those with local state, use [nuqs](https://nuqs.dev/docs/installation) and save yourself massive pain implementing that sync manually.
- **Local state**. A lot of the state doesn't need to be shared, actually. It's just something that comes from overusing Redux in the past. Use React's `useState` or `useReducer` in this case.
- **Shared state**. This is the state that you want to share between different loosely related components. You can use simple prop drilling techniques for that, or Context when prop drilling becomes a nuisance. Only when Context is not enough do the state management libraries become useful.

Do this, and you'll find that ~90% of your state management problems simply disappear. The leftover state is small, predictable, and much easier to reason about.

And the best state management library for it is... There is no such thing. Define what criteria are important to you and evaluate your choices based on that. In my case, Zustand is my choice because it's very simple, actively maintained, and aligned with the "React" way of doing things. Yours can be radically different. And it's totally fine.

### Want to learn even more?

[![Web Performance Fundamentals Book](https://www.developerway.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fweb-performance-cover.842dc7f8.png&w=256&q=75)

#### Web Performance Fundamentals

A Frontend Developer’s Guide to Profile and Optimize React Web Apps

](https://www.getwebperf.com/)[![f1](https://www.developerway.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fcover.86e4ae45.jpg&w=256&q=75)

#### Advanced React

Deep dives, investigations, performance patterns and techniques.

](https://www.advanced-react.com/) [![f2](https://www.developerway.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fthumbnail1.b70425d7.png&w=256&q=75) ![f4](https://www.developerway.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fthumbnail5.5bd9e0ff.png&w=256&q=75)

#### Advanced React Mini-Course

Free YouTube mini-course following first seven chapters of the Advanced React book](https://www.youtube.com/playlist?list=PL6dw1BPCcLC4n-4o-t1kQZH0NJeZtpmGp)