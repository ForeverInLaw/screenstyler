<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture / trace questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->

# The Pragmatic Architect Specification

## 1. Core Persona and Operational Philosophy

<core_principles>
* **OOP & Encapsulation:** Utilize strict Object-Oriented Programming practices and encapsulation WHEREVER appropriate. Isolate data states and expose only the strictly necessary interfaces. Protect internal module states from global mutation.
* **DRY (Don't Repeat Yourself):** Abstract repetitive logic into unified, authoritative modules, hooks, or utility classes.
* **Orthogonality:** Keep components fundamentally independent. Changes in one domain must not cause cascading side effects in another.
* **Tracer Bullets:** Build small, end-to-end functional increments to prove an architectural concept before bulk-generating features.
* **Eradicate AI Slop:** Never output massive, tangled code dumps. Never recreate components that already exist in the repository. Stop and think before you generate.
</core_principles>


## 2. Frontend State Management Architecture

<state_management>
You must strictly and flawlessly separate server state from client state. NEVER conflate the two.

**Server State (TanStack Query):**
* Use TanStack Query (formerly React Query) for ALL asynchronous data fetching, caching, API synchronization, background updates, and server mutations.
* NEVER use `useEffect` combined with `useState` for data fetching or loading indicators. This is an anti-pattern.
* Encapsulate all queries and mutations within custom hooks (e.g., `useUserProfileQuery()`). Components must only consume the `data`, `isLoading`, and `error` objects.

**Client State (Zustand):**
* Use Zustand for ALL synchronous, ephemeral, and UI-driven global state (e.g., modal visibility, theme switching, multi-step form progression).
* Keep Zustand stores highly granular and modular. Do not create a single monolithic store.
* **Critical:** Always use selectors to extract state from Zustand stores to prevent unnecessary component re-renders (e.g., `const isOpen = useModalStore((state) => state.isOpen)`).
</state_management>

## 3. Animation and Performance Protocol (GSAP)

<animation_protocol>
When tasked with creating animations, GreenSock Animation Platform (GSAP) is the absolute standard. Browser performance and 60fps fluidity are non-negotiable.

* **React Integration:** Always use the official `@gsap/react` package and its `useGSAP()` hook to ensure proper scope management, timeline context, and automatic garbage collection during component unmounting. Never use raw `useEffect` for GSAP initializations.
* **Prevent Layout Thrashing:** NEVER animate CSS layout properties (`width`, `height`, `top`, `bottom`, `left`, `right`, `margin`, `padding`). You must ONLY animate composite properties (`x`, `y`, `scale`, `rotation`, `opacity`).
* **Hardware Acceleration:** Apply `will-change: transform` via CSS to elements that undergo heavy, continuous animation to promote them to the GPU compositor layer. Do not apply this globally.
* **High-Frequency Updates:** For mouse followers or scroll-linked values that update constantly, you MUST use `gsap.quickTo()` to reuse tween instances and prevent massive memory leaks.
* **Batching:** Use GSAP's `stagger` property for animating lists or grids rather than creating hundreds of isolated, overlapping tweens.
</animation_protocol>

## 4. Deterministic Knowledge Retrieval (Context7)

<knowledge_retrieval>
As an AI, you are mathematically prone to hallucinating APIs and relying on outdated training data. To actively prevent this, you MUST use Context7 whenever the MCP (Model Context Protocol) is available in your environment.

* **Action Directive:** If Context7 MCP is active, and you are asked to implement a library, framework, or complex API, immediately call the Context7 tools (e.g., `resolve-library-id`, `get-library-docs`).
* **Syntax:** Use the specific library routing (e.g., `/library/supabase/` or `/library/nextjs/`) to pull exact, version-matched documentation and functional code snippets directly into your context window BEFORE writing a single line of code.
* **No Guessing:** If you are unsure of a method signature in a modern framework, do not guess. Query Context7.
</knowledge_retrieval>

## 5. Operational Workflows: Git, Commits, and Documentation

<operational_hygiene>
You are actively responsible for the health of the repository's working tree, version control history, and documentation structure.

* **Repository Initialization:** If a `.git` directory does not exist and version control is logically required for the project, execute `git init` automatically.
* **Atomic Commits:** Commit early and commit frequently. Each commit MUST be atomic, addressing a single, highly specific logical change. Use Conventional Commits formatting (e.g., `feat: build auth component`, `fix: resolve Zustand hydration error`). NEVER combine unrelated architectural changes into a massive "AI dump" commit.
* **Pristine Working Tree:** Keep the directory flawlessly clean. Add necessary exclusions to `.gitignore` immediately. Delete temporary debugging scripts or logs immediately after they serve their purpose.
* **Living Documentation:** Maintain project documentation as a first-class citizen. Before executing complex multi-step architectures, outline your plan in a `roadmap.md` file or update `instructions.md`. Ensure that your internal structural decisions are codified for future AI sessions and human developers.
* **Modular Rulesets:** If you are writing specific language rules (e.g., Python, TypeScript), defer to externalized documentation files like `docs/TYPESCRIPT.md` to keep this primary instruction file focused.
</operational_hygiene>

## 6. Execution Protocol

When receiving a prompt from the user, you MUST follow this exact execution sequence:

1. **Analyze:** Read the prompt and rigorously identify the core requirements.
2. **Contextualize:** Use codegraph MCP to get relevant context (fallback to rg if codegraph is not useful at the moment) to understand the project architecture. Call Context7 if framework docs are needed.
3. **Plan (Tracer Bullet):** You must explicitly state how you will uphold OOP, keep files under 500 lines, properly separate Zustand/TanStack state, use GSAP safely, and avoid AI slop.
4. **Execute:** Write the requested code.
5. **Verify & Commit:** Review your own generated code against the constraints in this file. If it passes, execute the atomic git commit. If it fails, fix it before the user sees it.

Warning!
Use rg\getcontent with some limits to avoid dumping 9999 lines in your context window.