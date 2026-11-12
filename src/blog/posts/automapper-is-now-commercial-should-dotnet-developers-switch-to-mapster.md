---
title: "AutoMapper Is Now Commercial: Should .NET Developers Switch to Mapster?"
description: "With AutoMapper officially going commercial, many .NET teams are weighing their options. Here’s how Mapster stacks up, what the new license means, and how to migrate safely without breaking your app."
date: 2025-10-24
updated:
slug: "automapper-is-now-commercial-should-dotnet-developers-switch-to-mapster"
tags:
  - ".NET"
  - "AutoMapper"
  - "Mapster"
  - "Migration"
coverImage:
coverAlt:
mediumUrl: "https://medium.com/@dino.cosic/automapper-is-now-commercial-should-net-developers-switch-to-mapster-25445581d38c"
canonicalUrl:
draft: false
---

![White arrow painted on a blue brick wall, pointing right](/assets/blog/automapper-is-now-commercial-should-dotnet-developers-switch-to-mapster/01.jpg "Photo by Nick Fewings on Unsplash")

You probably saw the announcement where Jimmy Bogard recently declared that **AutoMapper and MediatR are going commercial**¹. For us that means new licensing models, possible paid tiers, and uncertainty around future versions. But before you panic, all existing versions published under MIT remain usable under that license². Still many teams ask the same question:

*“Do we stick with current implementation, or migrate to something new?”*

One of the possible solutions is **Mapster,** a rising alternative used for mappings in the .NET libraries.

To make a decision and move from AutoMapper, first we need to find out how hard that would be. Our project was heavily using it, but still with careful planning we managed to migrate pretty easily. Let me walk you through the suggested steps that we have used on enterprise system that was in production.

## What Mapster Brings to the Table

Before going through the details, it’s worth mentioning the benefits and risks of the migration. This article shows steps of moving toward a simpler, faster, and more predictable way to handle object mapping.

### Performance

During the analysis, multiple benchmarks show that Mapster can outperform AutoMapper (in multiple scenarios)³. For example, Code Maze reports Mapster is “1–4× faster” in typical mapping tasks⁴. Bench suites like DotNet-Mappers place Mapster almost at the top of performance rankings⁵. In practice, if you’re mapping thousands of objects in a request, you could notice those performance benefits.

### Simpler configuration & compile-time control

Mapster offers both convention-based mapping (similar to AutoMapper) and explicit mapping with lambdas or code generation support⁶. Because of that, you can gradually adopt configurations in places where your domain is more complex, while letting “simple DTOs” just map by convention.

One thing I really like about Mapster is that it supports compile-time validation through code generation. This means it can catch mapping issues early, before your app even runs. That’s a big win compared to AutoMapper, where a simple property rename can quietly break things and only show up later at runtime.

### Migration support

Mapster’s GitHub docs point out that you can still use an IMapper abstraction. This means that you don’t have to refactor every call immediately⁹. You can use Mapster through DI and start converting mapping config behind the scenes. Mapster also supports projection into queryables (LINQ .ProjectToType<T>), flattening/unflattening, and nested scenarios¹⁰. Long story short, you won’t lose useful features (if your use of AutoMapper wasn’t extraordinarily exotic).

### Some trade-offs

Since docs and community is important, you may find more mature documentation and community for AutoMapper. There are a lot of blog posts and articles around it. Furthermore, in some custom scenarios, you might have to write more code for mapping logic (e.g. extremely dynamic mappings or runtime composition). Finally, if your code heavily uses AutoMapper profiles and ForMember, you may need to translate those to Mapster’s style (e.g. TypeAdapterConfig). But that tends to be mechanical.

## A Practical Migration Strategy

Switching your entire mapping logic overnight is risky. The idea is to do it incrementally. Here’s a strategy where you can keep parts of AutoMapper implementation around during the transition.

![Close-up of colourful minified source code on a dark screen](/assets/blog/automapper-is-now-commercial-should-dotnet-developers-switch-to-mapster/02.jpg "Photo by Felix Mittermeier on Unsplash")

### Initial steps

You should start with writing down how you use AutoMapper. You need to check how many map calls do you have, how many profiles or custom ForMember calls, customer resolvers, etc. Identification of the “hot paths” which represent mappings with high-throughput code would be beneficial as well. If you don’t have unit tests for mapping it would be good to add them so that we can be sure later that it works as expected.

### Introducing Mapster

Next step would be adding Mapster side by side, by installing NuGet package. After this you can wire Mapster into DI, by using services.AddMapster().This way you can inject an IMapper wrapper or own interface. Do NOT remove AutoMapper yet. Optionally add Mapster.Tool for generation capabilities⁷.

### Migration in progress (start small)

At the beginning, we should pick DTOs that are simple, DTOs with few properties and no complex mapping logic. Replace AutoMapper with Mapster style mappings like source.Adapt<TDestination>(). Also, use TypeAdapterConfig to express custom mappings where needed. Over time, convert all mapping profiles you have. Run tests to confirm that nothing is broken.

### Example snippet:

```csharp
TypeAdapterConfig<Foo, FooDto>
    .NewConfig()
    .Map(dest => dest.Name, src => src.FullName);
```

That’s roughly the Mapster equivalent of CreateMap<Foo, FooDto>().ForMember(...).

### Gradually retire AutoMapper

As more and more mapping logic is migrated, we should start with removing old AutoMapper profiles. Still, AutoMapper NuGet should be kept until all maping migrations are completed. Eventually, remove AutoMapper from DI, delete mapping references, and remove AutoMapper completely from the solution.

### Monitoring and production

At the end, run your mapping unit tests again. Test all paths and ensure that there are no regressions. For some applications, it might be interesting to observe memory allocations (some tests show that Mapster uses less memory)⁴.

This iterative approach allows you to ensure that system is working as expected all the time while doing migration.

## Is It Really That Easy?

In my opinion smooth migrations are rare. You will always find some edge cases which might introduce some challenges. Good thing here is that we have an active community and that there is a lot of people who did this already.

There are also other blogs and migration guides like “[AutoMapper Goes Commercial — Here’s Your Best Alternative](https://medium.com/@eslamhelmy523/%EF%B8%8F-automapper-goes-commercial-heres-your-best-alternative-6333f38ac46a)”¹³ which will walk you through the steps of migration. It is a good way of showing that this is doable and it will not cause any troubles if done with testing and caution.

## Final Thoughts: Should You Migrate Now or Wait?

![A dirt path in a green forest splitting into two directions](/assets/blog/automapper-is-now-commercial-should-dotnet-developers-switch-to-mapster/03.jpg "Photo by Jens Lelie on Unsplash")

There is no single answer that fits every use case, but here’s what I would do if I were in your shoes:

- If your team is small or your mapping setup isn’t too complex, I’d start the migration sooner rather than later, while it’s still easy to manage.
- If you’re heavily invested in AutoMapper, make sure your tests are solid before making any big changes.
- Think of the commercialization change as a nudge. It might be a good opportunity to lower your risk of license headaches.

If you decide to do migration, don’t let it become nightmare for your team. Create the plan, start with small steps and reiterate. It is almost always easier to handle migrations in manageable steps that you can repeat once you’ve validated your approach.

## References

¹ Jimmy Bogard — *AutoMapper and MediatR Going Commercial* (jimmybogard.com, 2024)\
² Trailhead Technology — *AutoMapper Goes Commercial: What It Means and What to Do About It* (2024)\
³ Code Maze — *AutoMapper vs Mapster in .NET* (code-maze.com, 2024)\
⁴ Code Maze — *Performance Comparison: AutoMapper vs Mapster* (code-maze.com, 2024)\
⁵ GitHub — *DotNet-Mappers Benchmark Repository* by mjebrahimi (github.com, 2024)\
⁶ Mapster Official Repository — *Mapster Documentation and Setup* (github.com/MapsterMapper/Mapster)\
⁷ Nimeth S. — *Mapster in .NET: A High-Performance Object Mapper for Streamlined Development* (medium.com, 2024)\
⁸ Answer Overflow — *Common AutoMapper Mapping Issues* (answeroverflow.com, 2024)\
⁹ Mapster GitHub — *Dependency Injection and IMapper Abstraction* (github.com/MapsterMapper/Mapster)\
¹⁰ Mapster GitHub — *Projection and Flattening Features* (github.com/MapsterMapper/Mapster)\
¹¹ Eren Inal — *Choosing the Right Mapper in .NET: AutoMapper vs Mapster* (medium.com, 2024)\
¹² Mapster GitHub Discussions — *Ignoring Mapping Source Without Attribute* (github.com, 2024)\
¹³ Eslam Helmy — *AutoMapper Goes Commercial — Here’s Your Best Alternative* (medium.com, 2024)
