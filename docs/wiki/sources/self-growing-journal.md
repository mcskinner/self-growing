# Source: self-growing software journal

The author's full journal text, supplied in this chat for the wiki's initial synthesis. Original composition dates were not supplied. The text below is preserved as supplied; it is a source, not a current specification or a list of approved work. See the [concept index](../index.md) for the evolving synthesis.

---

I keep noodling around this concept of self-growing software.

I'm fairly far along in my AI-coding journey, having ridden the wave from Copilot autocomplete, through VSCode-derived IDEs like Cursor and Windsurf to help with the code at hand, to chat-first code-review only in Cursor, and now even to headless orchestration of agents.

Much of that is aimed at building production systems for my day job. But I still often find myself wanting to build smaller one-off tools for various purposes. Some at work (a pull request manager), some at home (a meal planner). Wherever they are, and no matter how hard I try to automate everything, every one of them ends up with me in the loop at some point to break glass and fix the system itself.

Historically I've done that through a chat shell, but in a few recent projects I've played with the idea of embedding the chat into the app itself. Then it's just one pane of glass for everything.

It's not even that hard. I asked Claude to embed a chat and it just did it. These harnesses generally have pretty good integration hooks. Best of all: it works with your existing subscription and you don't need to go token-based billing for the feature.

More recently still I've wondered how I can push this further. What's the minimal "starter kit" so anyone can build their own software this way?

At its most basic it's just web app scaffolding with a full screen mirror of an agentic harness. Everything after that is is optional, but some things that might make it more usable or just more fun are:

- The chat to work both screen and left-pane modes, but I think the minimal kit can start with the one and people can implement whatever they want from there.
- A "control plane" to guide the the project: goals and mission statement, review steps to ensure changes align with that, even a persona to drive the building (not just "what do you want to build" but "who do you want to build it?")
- Project management tooling: roadmap, workflow orchestration, etc.
- An opinionated component library, or the option to quickly grow one
- Maybe in general a set of curated skills that are sort of self-growing packages, like the chat app scaffolding is the garden bed and those are the seeds?

Maybe the way to think of it is like the `pi` harness, with an extremely minimal core and then a wide array of packages that can plug into it to extend it.

There's even an extreme almost art project version of this, where the live software can be modified by anyone who visits. At that point you might start to worry about vandalism, so the control plane and other guard rails become more important.

## So I built the thing

I stopped where I did above because I realized that I didn't have much more to say about the idea, but that what I had said was more than enough to get going. I was nearing my weekly reset for Codex so I ran it through Astra at full power and got a surprisingly minimal and beautiful chat interface out of the box. I mean that's what I asked for, but it's shockingly pleasant. And it's been working pretty well.

The first thing I did was build a small Markdown reader and commenting interface, which also came out _way_ nicer than any Markdown reading tool I've ever used. It's honestly a little painful being back in Obsidian and VSCode when I look at documents there. It also shifts the chat pane to the left, the first prototype of a potential "seed" to handle common adaptations.

Honestly my head is still spinning with all the possibilities. There are several "tree of life" analogies and parallels. The git branches themselves can represent the family tree of each iteration. Forks and user-driven mutations produce different evolutionary lines, which could exchange genes with other parts of that tree of life, with the usual difficulties the farther away in the tree you try to exchange. More of a bacteria gene exchange than a sexual reproduction though.

How can the software be structured to support this? The seeds idea I think has legs, but it's just one way of packaging the genes. Is there some way to take the Pi approach with packages (aka plugins or extensions) and get the exchange that way? Doesn't feel quite the same to me. Perhaps what I really want is a way to abstract components or knowledge at some appropriately chunked level to back into the packages rather than building them outright. The same idea but fuzzy. A component library for the agentic age.

Which I guess leads to some kind of hive mind idea too. Every fork has the ability to phone home and report lessons about different ways of growing software. The gene exchange isn't peer to peer but instead a library to pull from, almost in the direction of Adrian Tchaikovsky's Portiids.

Anyway that's borderline incoherent. Like I said my head is spinning. But I feel like I have a much better sense of the potential scope here now that I've played with it more.
