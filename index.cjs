const { createHook, executionAsyncId, executionAsyncResource } = require('async_hooks')
const { inspect } = require('util')

const nodes = Object.create(null)

const hook = createHook({
    init: (aid, type, tid, resource) => {
        nodes[aid] = { type, tid, resource, beforeTimes: [], afterTimes: [], time: Date.now() }
    },
    before: (aid) => {
        nodes[aid]?.beforeTimes.push(Date.now())
    },
    after: (aid) => {
        nodes[aid]?.afterTimes.push(Date.now())
    },
    destroy: (aid) => {
        delete nodes[aid]
    },
})

exports.enable = () => {
    const id = executionAsyncId()
    nodes[id] = nodes[id] || { tid: -1, type: null, beforeTimes: [], afterTimes: [], resource: executionAsyncResource() }
    nodes[id].beforeTimes.push(Date.now())
    hook.enable()
}

exports.disable = () => {
    hook.disable()
    for (const id in nodes) delete nodes[id]
}

/**
 * Return a forest of currently existing async resources with some extra info.
 *
 * @param {(any) => any} serialize A function to serialize async resource.
 *      You don't want it to be an identity function or anything similar to avoid memory leaks or other side-effects,
 *      try to return a string or something just as harmless.
 *      Default: `res => util.inspect(res, { breakLength: Infinity, compact: true  })`
 *
 * @returns {Record<number, Root>} Tree of async resources linked by their ID,
 *      roots may not have as much info as other nodes as they could have been instantiated prior to enabling async hooks.
 */
exports.show = (
    serialize = res => inspect(res, { breakLength: Infinity, compact: true  })
) => {
    const roots = Object.create(null)
    const visited = Object.create(null)
    for (let [asyncId, { resource, tid, ...rest }] of Object.entries(nodes)) {
        asyncId = Number(asyncId)
        if (asyncId in roots) delete roots[asyncId]

        const node = visited[asyncId] = Object.assign(
            visited[asyncId] || { children: {} },
            { resource: serialize(resource), ...rest },
        )

        if (visited[tid]) visited[tid].children[asyncId] = node
        else roots[tid] = visited[tid] = { children: { [asyncId]: node } }
    }

    return roots
}

/** @typedef {{ type: string, resource: any, beforeTimes: number[], afterTimes: number[], time: number, children: Record<number, Node> }} Node */
/** @typedef {{ type?: string | null, resource?: any, beforeTimes?: number[], afterTimes?: number[], time?: number, children: Record<number, Node> }} Root */
