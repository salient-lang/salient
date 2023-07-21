# Language Principles

## Concrete: Pour Fast, Harden Slow

Programs should be quick to develop with dynamic typing like ease - but also the flexibility of once you have the rough program laid out you can refine it into all safe static types

## Throughput not latency focused

The language is focused on computing thousands of problems concurrently - rather than single ones fast in quick succession.

If there is a decision between lower individual request latency, and total throughput. Total throughput is the desired option.

## Reflection

Your program should be able to reason about itself as easily as modern runtime languages without the ability to self mutate.

This includes compile time functions being able to reason about the types it's given to generate code, but also runtime code that feels like it has direct access to the compile time types. Such as looping over attributes in a structure, where the actual structure definition no longer exists at runtime, but is unrolled during compilation.

This also means built in simple type conversions, if you have two structures with the same attributes under a different name - you should be able to re-encode without error or hassle.

## Embrace the tail call

Tailcalls are free as part of the language design, making tailcall recursion also free.

## Bubble up not boil up errors

Errors are values, if a function returns an error, simple syntax should allow it to bubble up the chain if desired - but also with the option as to whether to include the stack trace of the current function in that bubbling. No one likes a 30 line stack trace. Functions should be allowed to omit themselves from the stack trace if they choose to giving developers more options for clear and concise code.

## Mixed Memory

Somethings are just plain easier with GC, the problem with GC is when everything is managed by it. But if it only has a small amount of work to do - it will only ever be a small bother.

Values should primarily be owned statically by functions or global states, you can also use allocators to manually attribute memory for variable length data, but that doesn't mean than you can't store certain things in a garbage collector. They simply just need a wrapper to go from the static to the dynamic world.

But as long as the GC is language level, these wrapped entities can remain easily shareable between libraries and domains.

## Closures are a really good hammer not a way of life

Closures are really powerful, with lambda calculus you can derive the real number space.
But they aren't designed for trying to process `10k req/sec` interleaving processing different requests as each request waits on database calls and other external factors to generate a full response.

Closures have became the shortcut for circumventing lack luster flow control, and this abuse of closures leads to longer and longer compile times as the compiler attempts to understand what you're attempting to do.