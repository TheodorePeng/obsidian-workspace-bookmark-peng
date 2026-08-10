/* Workspace Bookmark */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = Symbol.for("yaml.alias");
    var DOC = Symbol.for("yaml.document");
    var MAP = Symbol.for("yaml.map");
    var PAIR = Symbol.for("yaml.pair");
    var SCALAR = Symbol.for("yaml.scalar");
    var SEQ = Symbol.for("yaml.seq");
    var NODE_TYPE = Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error2) {
            onError(String(error2));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error2 = new Error("Failed to resolve repeated object (this should not happen)");
              error2.source = source;
              throw error2;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning2) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning2);
        else
          console.warn(warning2);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error2) => {
      if (error2.pos[0] === -1)
        return;
      error2.linePos = error2.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error2.linePos[0];
      error2.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error2.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error2.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error2 = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error2 === -1)
            error2 = offset + i;
        }
      }
      if (error2 !== -1)
        onError(error2, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + match[1];
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error2) {
        const msg = error2 instanceof Error ? error2.message : String(error2);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error2) {
            const message = error2 instanceof Error ? error2.message : String(error2);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning2) => {
          const pos = getErrorPos(source);
          if (warning2)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning2) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning2);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error2 = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error2);
            else
              this.doc.errors.push(error2);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = Symbol("break visit");
    var SKIP = Symbol("skip children");
    var REMOVE = Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports2.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error2) {
        const token = error2 ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning2) => log.warn(doc.options.logLevel, warning2));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WorkspaceBookmarkPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/ids.ts
var ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function encodeBase32(value, length) {
  let remaining = Math.floor(value);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result = ENCODING[remaining % 32] + result;
    remaining = Math.floor(remaining / 32);
  }
  return result;
}
function randomBase32(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ENCODING[byte % 32]).join("");
}
function createUlid() {
  return `${encodeBase32(Date.now(), 10)}${randomBase32(16)}`;
}
function createWorkspaceId() {
  return `ws_${createUlid()}`;
}
function createWindowId() {
  return `win_${createUlid()}`;
}

// src/modals.ts
var import_obsidian = require("obsidian");

// src/capture-recipe.ts
function candidateToRecipe(candidate) {
  const restoreMode = candidate.restoreMode ?? (candidate.browser || candidate.obsidianUrl || candidate.manualUrl ? "open-content" : "launch-only");
  let adapter = "manual";
  let appName = candidate.native.appName;
  let bundleId = candidate.native.bundleId;
  let browserId;
  let contents = [];
  if (candidate.browser || candidate.browserIdHint) {
    adapter = "browser";
    appName = candidate.browser?.browserName ?? candidate.browserNameHint ?? appName;
    bundleId = candidate.browser?.browserBundleId ?? bundleId;
    browserId = candidate.browser?.browserId ?? candidate.browserIdHint;
    contents = (candidate.browser?.tabs ?? []).filter((tab) => candidate.selectedTabs.has(tab.index)).map(tabToContent);
  } else if (candidate.obsidianUrl) {
    adapter = "obsidian";
    appName = "Obsidian";
    bundleId = "md.obsidian";
    contents = [{
      order: 1,
      title: candidate.native.title,
      url: candidate.obsidianUrl,
      active: true,
      pinned: false
    }];
  } else if (candidate.manualUrl) {
    contents = [{
      order: 1,
      title: candidate.native.title,
      url: candidate.manualUrl,
      active: true,
      pinned: false
    }];
  }
  if (restoreMode === "open-content" && contents.length === 0) return null;
  if (contents.length > 0 && !contents.some((item) => item.active)) contents[0].active = true;
  const contentTitle = contents.find((item) => item.active)?.title || contents[0]?.title || candidate.native.title;
  return {
    id: createWindowId(),
    name: contentTitle || candidate.native.appName,
    adapter,
    appName,
    bundleId,
    ...browserId ? { browserId } : {},
    titleHint: contentTitle || candidate.native.appName,
    openMode: adapter === "browser" && restoreMode === "open-content" ? candidate.openMode ?? "focus-existing" : adapter === "manual" ? "app-default" : "focus-existing",
    monitor: candidate.native.monitor,
    space: "current",
    layout: frameToLayout(candidate.native.normalizedFrame),
    restoreMode,
    contents
  };
}
function frameToLayout(frame) {
  const epsilon = 0.035;
  const close = (left, right) => Math.abs(left - right) <= epsilon;
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.width, 1) && close(frame.height, 1)) {
    return "full";
  }
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.height, 1)) {
    return `left ${round(frame.width)}`;
  }
  if (close(frame.x + frame.width, 1) && close(frame.y, 0) && close(frame.height, 1)) {
    return `right ${round(frame.width)}`;
  }
  if (close(frame.x, 0) && close(frame.y, 0) && close(frame.width, 1)) {
    return `top ${round(frame.height)}`;
  }
  if (close(frame.x, 0) && close(frame.y + frame.height, 1) && close(frame.width, 1)) {
    return `bottom ${round(frame.height)}`;
  }
  return `frame ${round(frame.x)} ${round(frame.y)} ${round(frame.width)} ${round(frame.height)}`;
}
function tabToContent(tab) {
  return {
    order: tab.index + 1,
    title: tab.title,
    url: tab.url,
    active: tab.active,
    pinned: tab.pinned
  };
}
function round(value) {
  return Math.max(0, Math.min(1, Math.round(value * 1e3) / 1e3)).toString();
}

// src/capture.ts
function reconcileCaptureSnapshot(previous, next) {
  const previousByKey = new Map(previous.map((candidate) => [
    captureCandidateKey(candidate),
    candidate
  ]));
  let preserved = 0;
  const candidates = next.candidates.map((candidate) => {
    const prior = previousByKey.get(captureCandidateKey(candidate));
    if (!prior) return candidate;
    previousByKey.delete(captureCandidateKey(candidate));
    preserved += 1;
    const selectedTabs = reconcileSelectedTabs(prior, candidate);
    return {
      ...candidate,
      selected: prior.selected,
      selectedTabs,
      manualUrl: prior.manualUrl,
      restoreMode: prior.restoreMode ?? candidate.restoreMode,
      openMode: prior.openMode ?? candidate.openMode,
      action: prior.action,
      targetId: prior.targetId,
      duplicateTargetIds: prior.duplicateTargetIds ?? candidate.duplicateTargetIds,
      tabsExpanded: prior.tabsExpanded
    };
  });
  return {
    ...next,
    candidates,
    stats: {
      added: candidates.length - preserved,
      removed: previousByKey.size,
      preserved
    }
  };
}
function captureSourceNotices(sources, candidates) {
  const notices = [];
  for (const source of sources) {
    const visible = candidates.filter(
      (candidate) => candidate.browser?.browserId === source.browserId
    ).length;
    if (!source.connected) {
      notices.push({
        browserId: source.browserId,
        browserName: source.browserName,
        tone: "warning",
        message: `${source.browserName} \u6865\u63A5\u79BB\u7EBF\uFF1B\u5F53\u524D\u53EA\u663E\u793A\u539F\u751F\u7A97\u53E3\uFF0C\u65E0\u6CD5\u8BFB\u53D6\u9875\u9762\u3002`
      });
    } else if (source.windows.length > 0 && visible === 0) {
      notices.push({
        browserId: source.browserId,
        browserName: source.browserName,
        tone: "neutral",
        message: `${source.browserName} \u6865\u63A5\u5728\u7EBF\uFF0C\u4F46\u5F53\u524D Space \u6CA1\u6709\u53EF\u89C1\u7A97\u53E3\uFF1B\u9690\u85CF\u3001\u5DF2\u5173\u95ED\u6216\u5176\u4ED6 Space \u7684\u7A97\u53E3\u4E0D\u4F1A\u53C2\u4E0E\u6536\u5F55\u3002`
      });
    }
  }
  return notices;
}
function captureCandidateKey(candidate) {
  if (candidate.browser) {
    return `browser:${candidate.browser.browserId}:${candidate.browser.id}`;
  }
  return `native:${candidate.native.pid}:${candidate.native.windowId}`;
}
function uniqueBrowserMatch(nativeWindow, browserWindows) {
  const candidates = browserMatchCandidates(nativeWindow, browserWindows);
  if (candidates.length !== 1) return void 0;
  return candidates[0];
}
function browserMatchCandidates(nativeWindow, browserWindows) {
  const scored = browserWindows.filter((window2) => browserOwnsNativeWindow(window2, nativeWindow)).map((window2) => ({
    window: window2,
    score: Math.abs(window2.frame.x - nativeWindow.frame.x) + Math.abs(window2.frame.y - nativeWindow.frame.y) + Math.abs(window2.frame.width - nativeWindow.frame.width) + Math.abs(window2.frame.height - nativeWindow.frame.height) + titlePenalty(nativeWindow.title, window2)
  })).sort((left, right) => left.score - right.score);
  const best = scored[0];
  if (!best || best.score > 160) return [];
  const nearBest = scored.filter((candidate) => candidate.score - best.score < 20);
  return nearBest.map((candidate) => candidate.window);
}
function browserOwnsNativeWindow(browser, nativeWindow) {
  if (browser.browserId === "chrome") {
    return nativeWindow.bundleId === "com.google.Chrome";
  }
  return nativeWindow.bundleId === "com.tabbit-ai.Tabbit" || nativeWindow.bundleId.startsWith("com.tabbit-ai.Tabbit.app.");
}
function titlePenalty(nativeTitle, browser) {
  if (!nativeTitle) return 0;
  const activeTitle = browser.tabs.find((tab) => tab.active)?.title ?? "";
  if (!activeTitle) return 0;
  const left = nativeTitle.toLowerCase();
  const right = activeTitle.toLowerCase();
  return left.includes(right) || right.includes(left) ? 0 : 80;
}
function reconcileSelectedTabs(previous, next) {
  if (!previous.browser || !next.browser) return new Set(next.selectedTabs);
  const selectedKeys = new Set(
    previous.browser.tabs.filter((tab) => previous.selectedTabs.has(tab.index)).map(tabIdentity)
  );
  return new Set(
    next.browser.tabs.filter((tab) => selectedKeys.has(tabIdentity(tab))).map((tab) => tab.index)
  );
}
function tabIdentity(tab) {
  return tab.id != null ? `id:${tab.id}` : `url:${tab.url}`;
}
function isRestorableBrowserUrl(url) {
  try {
    return ["http:", "https:", "file:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

// src/model.ts
var import_yaml = __toESM(require_dist(), 1);

// src/recipe-identity.ts
function captureRecipeKey(recipe) {
  const owner = recipe.adapter === "browser" ? recipe.browserId ?? recipe.bundleId : recipe.bundleId;
  if ((recipe.restoreMode ?? "open-content") === "launch-only") {
    return [
      recipe.adapter,
      owner,
      "launch-only",
      recipe.titleHint.trim().toLocaleLowerCase(),
      recipe.monitor,
      recipe.space,
      recipe.layout
    ].join("\0");
  }
  return [
    recipe.adapter,
    owner,
    normalizedUrls(recipe).join("")
  ].join("\0");
}
function duplicateFocusExistingKey(recipe) {
  if (recipe.openMode !== "focus-existing") return null;
  return [
    captureRecipeKey(recipe),
    recipe.monitor,
    recipe.space,
    recipe.layout
  ].join("\0");
}
function findDuplicateFocusExistingGroups(recipes) {
  const byKey = /* @__PURE__ */ new Map();
  for (const recipe of recipes) {
    const key = duplicateFocusExistingKey(recipe);
    if (!key) continue;
    const group = byKey.get(key) ?? [];
    group.push(recipe);
    byKey.set(key, group);
  }
  return [...byKey.entries()].flatMap(
    ([key, recipes2]) => recipes2.length > 1 ? [{ key, keep: recipes2[0], duplicates: recipes2.slice(1) }] : []
  );
}
function deduplicateFocusExistingRecipes(recipes) {
  const firstByKey = /* @__PURE__ */ new Map();
  const runnable = [];
  const duplicates = [];
  for (const recipe of recipes) {
    const key = duplicateFocusExistingKey(recipe);
    const kept = key ? firstByKey.get(key) : void 0;
    if (key && kept) {
      duplicates.push({ recipe, kept });
      continue;
    }
    if (key) firstByKey.set(key, recipe);
    runnable.push(recipe);
  }
  return { runnable, duplicates };
}
function normalizedUrls(recipe) {
  return recipe.contents.map((item) => item.url.trim()).sort();
}

// src/model.ts
var ADAPTERS = /* @__PURE__ */ new Set(["browser", "obsidian", "manual"]);
var BROWSERS = /* @__PURE__ */ new Set(["chrome", "tabbit"]);
var MODES = /* @__PURE__ */ new Set([
  "new-window",
  "reuse-window",
  "focus-existing",
  "app-default"
]);
var RESTORE_MODES = /* @__PURE__ */ new Set(["open-content", "launch-only"]);
var MONITORS = /* @__PURE__ */ new Set([
  "current",
  "main",
  "built-in",
  "external-primary"
]);
var ADAPTER_MODES = {
  browser: /* @__PURE__ */ new Set(["new-window", "reuse-window", "focus-existing"]),
  obsidian: /* @__PURE__ */ new Set(["reuse-window", "focus-existing", "app-default"]),
  manual: /* @__PURE__ */ new Set(["app-default"])
};
var DEFAULT_SCHEMES = /* @__PURE__ */ new Set(["http", "https", "obsidian", "file"]);
var APP_BY_LEGACY = {
  chrome: {
    adapter: "browser",
    appName: "Google Chrome",
    browserId: "chrome",
    bundleId: "com.google.Chrome"
  },
  obsidian: {
    adapter: "obsidian",
    appName: "Obsidian",
    bundleId: "md.obsidian"
  },
  manual: {
    adapter: "manual",
    appName: "\u5176\u4ED6 App",
    bundleId: ""
  }
};
var OPEN_MODE_LABELS = {
  "new-window": "\u59CB\u7EC8\u65B0\u5EFA\u7A97\u53E3",
  "reuse-window": "\u4F18\u5148\u590D\u7528\u7A97\u53E3",
  "focus-existing": "\u805A\u7126\u5DF2\u6709\u9875\u9762",
  "app-default": "\u4EA4\u7ED9\u5E94\u7528\u5904\u7406"
};
var OPEN_MODE_VALUES = reverseMap(OPEN_MODE_LABELS);
var RESTORE_MODE_LABELS = {
  "open-content": "\u6062\u590D\u9875\u9762\u6216\u6587\u6863",
  "launch-only": "\u4EC5\u542F\u52A8\u5E94\u7528"
};
var RESTORE_MODE_VALUES = reverseMap(RESTORE_MODE_LABELS);
var MONITOR_LABELS = {
  current: "\u5F53\u524D\u5C4F\u5E55",
  main: "\u4E3B\u5C4F\u5E55",
  "built-in": "Mac \u5185\u7F6E\u5C4F\u5E55",
  "external-primary": "\u4E3B\u8981\u5916\u63A5\u5C4F\u5E55"
};
var MONITOR_VALUES = reverseMap(MONITOR_LABELS);
function parseWorkspaceMarkdown(source, options = {}) {
  const diagnostics = [];
  const lines = normalize(source).split("\n");
  const frontmatterResult = parseFrontmatter(lines);
  diagnostics.push(...frontmatterResult.diagnostics);
  const frontmatter = frontmatterResult.value;
  const managed = frontmatter?.type === "workspace";
  const schemaNumber = Number(frontmatter?.schema_version);
  const sectionVersion = schemaNumber === 1 ? 1 : schemaNumber === 2 ? 2 : schemaNumber === 3 ? 3 : 4;
  const sections = findWindowSections(lines, sectionVersion);
  if (!managed) {
    return { workspace: null, diagnostics, managed: false, sections, frontmatter };
  }
  const id = stringValue(frontmatter.workspace_id);
  const name = stringValue(frontmatter.name);
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : frontmatter.tags == null ? [] : [String(frontmatter.tags)];
  if (!/^ws_[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
    diagnostics.push(error("WORKSPACE_ID", "workspace_id \u5FC5\u987B\u662F ws_<ULID>\u3002", 1, void 0, "workspace_id"));
  }
  if (!name.trim()) {
    diagnostics.push(error("WORKSPACE_NAME", "name \u4E0D\u80FD\u4E3A\u7A7A\u3002", 1, void 0, "name"));
  }
  if (schemaNumber !== 1 && schemaNumber !== 2 && schemaNumber !== 3 && schemaNumber !== 4) {
    diagnostics.push(error("SCHEMA_VERSION", "schema_version \u5FC5\u987B\u4E3A 1\u30012\u30013 \u6216 4\u3002", 1, void 0, "schema_version"));
  }
  if (new Set(tags).size !== tags.length) {
    diagnostics.push(error("TAGS_DUPLICATE", "tags \u4E0D\u5F97\u91CD\u590D\u3002", 1, void 0, "tags"));
  }
  const parsedWindows = [];
  const seenWindowIds = /* @__PURE__ */ new Set();
  for (const section of sections) {
    const parsed = parseWindowSection(lines, section, options);
    section.recipe = parsed.recipe;
    diagnostics.push(...parsed.diagnostics);
    if (!parsed.recipe) continue;
    if (seenWindowIds.has(parsed.recipe.id)) {
      diagnostics.push(error(
        "DUPLICATE_WINDOW_ID",
        `Window ID \u91CD\u590D\uFF1A${parsed.recipe.id}`,
        section.headingLine + 1,
        section.name,
        "id"
      ));
    }
    seenWindowIds.add(parsed.recipe.id);
    parsedWindows.push(parsed.recipe);
  }
  for (const group of findDuplicateFocusExistingGroups(parsedWindows)) {
    for (const duplicate of group.duplicates) {
      const section = sections.find((candidate) => candidate.recipe?.id === duplicate.id);
      diagnostics.push(warning(
        "DUPLICATE_WINDOW_RECIPE",
        `\u4E0E\u201C${group.keep.name}\u201D\u7684\u6062\u590D\u5185\u5BB9\u548C\u5E03\u5C40\u5B8C\u5168\u76F8\u540C\uFF1B\u8FD0\u884C\u65F6\u53EA\u4F1A\u6267\u884C\u7B2C\u4E00\u4EFD\u3002`,
        section ? section.headingLine + 1 : void 0,
        duplicate.name
      ));
    }
  }
  return {
    workspace: {
      id,
      name,
      schemaVersion: sectionVersion,
      tags,
      windows: parsedWindows
    },
    diagnostics,
    managed,
    sections,
    frontmatter
  };
}
function validateLayout(layout) {
  const tokens = layout.trim().split(/\s+/);
  const kind = tokens[0];
  if (kind === "full" || kind === "keep") {
    return tokens.length === 1 ? null : `${kind} \u4E0D\u63A5\u53D7\u989D\u5916\u53C2\u6570\u3002`;
  }
  const expected = {
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    center: 2,
    frame: 4
  };
  const count = kind ? expected[kind] : void 0;
  if (count == null) return "layout \u5FC5\u987B\u662F left/right/top/bottom/center/frame/full/keep\u3002";
  if (tokens.length !== count + 1) return `${kind} \u9700\u8981 ${count} \u4E2A\u6BD4\u4F8B\u53C2\u6570\u3002`;
  for (const [index, value] of tokens.slice(1).entries()) {
    const number = Number(value);
    const zeroAllowed = kind === "frame" && index < 2;
    if (!Number.isFinite(number) || (zeroAllowed ? number < 0 : number <= 0) || number > 1) {
      return zeroAllowed ? `\u504F\u79FB\u91CF ${value} \u5FC5\u987B\u5728 0\uFF5E1 \u8303\u56F4\u5185\u3002` : `\u6BD4\u4F8B ${value} \u5FC5\u987B\u5927\u4E8E 0 \u4E14\u4E0D\u8D85\u8FC7 1\u3002`;
    }
  }
  if (kind === "frame") {
    const [x, y, width, height] = tokens.slice(1).map(Number);
    if ((x ?? 0) + (width ?? 0) > 1 || (y ?? 0) + (height ?? 0) > 1) {
      return "frame \u7684 x + width \u4E0E y + height \u5747\u4E0D\u5F97\u8D85\u8FC7 1\u3002";
    }
  }
  return null;
}
function formatWorkspaceMarkdown(source, parsed) {
  if (!parsed.managed || !parsed.workspace || parsed.workspace.schemaVersion !== 4 || parsed.diagnostics.some((item) => item.severity === "error")) return source;
  return rewriteSections(source, parsed.sections, false);
}
function replaceWindowSection(source, section, recipe) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = normalize(source);
  if (!section) {
    const separator = normalized.endsWith("\n\n") ? "" : normalized.endsWith("\n") ? "\n" : "\n\n";
    return restoreEol(`${normalized}${separator}${renderWindowSection(recipe)}`, eol);
  }
  const current = normalized.slice(section.start, section.end);
  const rendered = renderWindowSectionPreserving(current, recipe, section.schemaVersion);
  return restoreEol(
    normalized.slice(0, section.start) + rendered + normalized.slice(section.end),
    eol
  );
}
function removeWindowSections(source, parsed, windowIds) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const ids = new Set(windowIds);
  let result = normalize(source);
  const sections = parsed.sections.filter((section) => section.recipe && ids.has(section.recipe.id)).sort((left, right) => right.start - left.start);
  for (const section of sections) {
    result = result.slice(0, section.start) + result.slice(section.end);
  }
  return restoreEol(result.replace(/\n{3,}$/g, "\n\n"), eol);
}
function renderWindowSection(recipe) {
  const restoreMode = recipe.restoreMode ?? "open-content";
  const editableFields = [
    ["\u6062\u590D\u65B9\u5F0F", RESTORE_MODE_LABELS[restoreMode], "\u6062\u590D\u9875\u9762\u6216\u6587\u6863 / \u4EC5\u542F\u52A8\u5E94\u7528"],
    ["\u6253\u5F00\u65B9\u5F0F", OPEN_MODE_LABELS[recipe.openMode], openModeHint(recipe.adapter)],
    ["\u5C4F\u5E55", MONITOR_LABELS[recipe.monitor], "\u5F53\u524D\u5C4F\u5E55 / \u4E3B\u5C4F\u5E55 / Mac \u5185\u7F6E\u5C4F\u5E55 / \u4E3B\u8981\u5916\u63A5\u5C4F\u5E55"],
    ["\u5E03\u5C40", recipe.layout, "full / keep / left 0.5 / right 0.4 / center 0.8 0.7 / frame 0 0 1 1"],
    ["Space", recipe.space === "current" ? "\u5F53\u524D" : recipe.space, "\u5F53\u524D\u7248\u672C\u4EC5\u652F\u6301\u5F53\u524D"],
    ["\u6807\u9898\u5339\u914D", recipe.titleHint, "\u4EFB\u610F\u7A97\u53E3\u6807\u9898\u7247\u6BB5\uFF0C\u7528\u4E8E\u5339\u914D\u7A97\u53E3"]
  ];
  const readonlyFields = [
    ["\u5E94\u7528", recipe.appName],
    ["\u9002\u914D\u5668", recipe.adapter],
    ...recipe.browserId ? [["Browser ID", recipe.browserId]] : [],
    ["Bundle ID", `\`${escapeCode(recipe.bundleId)}\``],
    ["ID", `\`${escapeCode(recipe.id)}\``]
  ];
  const contentRows = [...recipe.contents].sort((left, right) => left.order - right.order).map(
    (item) => `| ${item.order} | ${escapeCell(item.title)} | ${item.active ? "\u662F" : "\u5426"} | ${item.pinned ? "\u662F" : "\u5426"} | \`${escapeCode(item.url)}\` |`
  ).join("\n");
  const contentSection = [
    "",
    "### \u6253\u5F00\u5185\u5BB9",
    "",
    "| \u987A\u5E8F | \u9875\u9762\u6807\u9898 | \u6FC0\u6D3B | \u56FA\u5B9A | URL |",
    "|---:|---|:---:|:---:|---|",
    ...contentRows ? [contentRows] : []
  ];
  return [
    `## ${safeHeading(recipe.appName)} \xB7 ${safeHeading(recipe.name)}`,
    "",
    "### \u53EF\u7F16\u8F91\u8BBE\u7F6E",
    "",
    "| \u8BBE\u7F6E\u9879 | \u5F53\u524D\u503C | \u586B\u5199\u63D0\u793A |",
    "|---|---|---|",
    ...editableFields.map(
      ([key, value, hint]) => `| ${escapeCell(key)} | ${escapeCell(value)} | ${escapeCell(hint)} |`
    ),
    ...contentSection,
    "",
    "### \u53EA\u8BFB\u4FE1\u606F",
    "",
    "<details>",
    "<summary>\u7528\u4E8E\u6062\u590D\u548C\u6392\u9519\uFF0C\u901A\u5E38\u4E0D\u8981\u4FEE\u6539</summary>",
    "",
    "| \u9879 | \u503C |",
    "|---|---|",
    ...readonlyFields.map(([key, value]) => `| ${escapeCell(key)} | ${value} |`),
    "",
    "</details>",
    ""
  ].join("\n");
}
function openModeHint(adapter) {
  if (adapter === "browser") {
    return "\u805A\u7126\u5DF2\u6709\u9875\u9762\uFF08\u76F8\u540C URL \u76F4\u63A5\u5207\u6362\uFF09/ \u4F18\u5148\u590D\u7528\u7A97\u53E3\uFF08\u65B0\u5F00\u9875\u9762\uFF09/ \u59CB\u7EC8\u65B0\u5EFA\u7A97\u53E3";
  }
  if (adapter === "obsidian") return "\u805A\u7126\u5DF2\u6709\u9875\u9762 / \u4F18\u5148\u590D\u7528\u7A97\u53E3 / \u4EA4\u7ED9\u5E94\u7528\u5904\u7406";
  return "\u4EA4\u7ED9\u5E94\u7528\u5904\u7406";
}
function createWorkspaceTemplate(id, name) {
  const frontmatter = (0, import_yaml.stringify)({
    type: "workspace",
    workspace_id: id,
    name,
    schema_version: 4,
    tags: []
  }).trimEnd();
  return `---
${frontmatter}
---

\u6B64\u6587\u6863\u7531 Workspace Bookmark \u7BA1\u7406\u3002\u4F60\u53EF\u4EE5\u901A\u8FC7\u63D2\u4EF6 Capture \u5F53\u524D\u7A97\u53E3\uFF0C\u4E5F\u53EF\u4EE5\u624B\u52A8\u7F16\u8F91\u6BCF\u4E2A APP \u533A\u57DF\u4E2D\u7684\u201C\u53EF\u7F16\u8F91\u8BBE\u7F6E\u201D\u548C\u201C\u6253\u5F00\u5185\u5BB9\u201D\u3002

`;
}
function canAutoInitializeWorkspaceSource(source) {
  const trimmed = normalize(source).trim();
  return trimmed === "" || /^#\s+.+$/.test(trimmed);
}
function initializeWorkspaceMarkdown(source, id, name) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const normalized = normalize(source);
  if (canAutoInitializeWorkspaceSource(normalized)) {
    return restoreEol(createWorkspaceTemplate(id, headingName(normalized) ?? name), eol);
  }
  const lines = normalized.split("\n");
  const frontmatterResult = parseFrontmatter(lines);
  let frontmatter = {};
  let body = normalized.trimStart();
  if (frontmatterResult.value) {
    frontmatter = { ...frontmatterResult.value };
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    body = lines.slice(end + 1).join("\n").trimStart();
  }
  const initialized = {
    ...frontmatter,
    type: "workspace",
    workspace_id: id,
    name: stringValue(frontmatter.name) || headingName(body) || name,
    schema_version: 4,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : []
  };
  const renderedFrontmatter = (0, import_yaml.stringify)(initialized).trimEnd();
  const bodyText = body.trim() ? body.trimEnd() : "\u6B64\u6587\u6863\u7531 Workspace Bookmark \u7BA1\u7406\u3002\u4F60\u53EF\u4EE5\u901A\u8FC7\u63D2\u4EF6 Capture \u5F53\u524D\u7A97\u53E3\uFF0C\u4E5F\u53EF\u4EE5\u624B\u52A8\u7F16\u8F91\u6BCF\u4E2A APP \u533A\u57DF\u4E2D\u7684\u201C\u53EF\u7F16\u8F91\u8BBE\u7F6E\u201D\u548C\u201C\u6253\u5F00\u5185\u5BB9\u201D\u3002";
  return restoreEol(`---
${renderedFrontmatter}
---

${bodyText}
`, eol);
}
function migrateWorkspaceMarkdownToLatest(source, options = {}) {
  const parsed = parseWorkspaceMarkdown(source, options);
  const errors = parsed.diagnostics.filter((item) => item.severity === "error");
  if (!parsed.managed || !parsed.workspace || errors.length > 0) {
    return { ok: false, source, diagnostics: parsed.diagnostics, headingChanges: [] };
  }
  if (parsed.workspace.schemaVersion === 4) {
    return { ok: true, source, diagnostics: [], headingChanges: [] };
  }
  const usedHeadings = /* @__PURE__ */ new Set();
  const migratedSections = parsed.sections.map((section) => {
    if (!section.recipe) return section;
    const recipe = structuredClone(section.recipe);
    recipe.name = uniqueHeadingName(recipe.appName, recipe.name, usedHeadings);
    usedHeadings.add(`${recipe.appName}\0${recipe.name}`);
    return { ...section, recipe };
  });
  const headingChanges = migratedSections.flatMap((section) => {
    if (!section.recipe) return [];
    return [{
      from: `Window \xB7 ${section.name}`,
      to: `${section.recipe.appName} \xB7 ${section.recipe.name}`
    }];
  });
  let migrated = rewriteSections(source, migratedSections, true);
  migrated = migrated.replace(
    /(^---\r?\n[\s\S]*?^schema_version:\s*)(1|2|3)(\s*$[\s\S]*?^---\s*$)/m,
    (_match, prefix, _version, suffix) => `${prefix}4${suffix}`
  );
  const verified = parseWorkspaceMarkdown(migrated, options);
  if (verified.diagnostics.some((item) => item.severity === "error")) {
    return { ok: false, source, diagnostics: verified.diagnostics, headingChanges: [] };
  }
  return { ok: true, source: migrated, diagnostics: [], headingChanges };
}
function uniqueHeadingName(appName, requestedName, used) {
  if (!used.has(`${appName}\0${requestedName}`)) return requestedName;
  let suffix = 2;
  while (used.has(`${appName}\0${requestedName}\uFF08${suffix}\uFF09`)) suffix += 1;
  return `${requestedName}\uFF08${suffix}\uFF09`;
}
function rewriteSections(source, sections, migrating) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  let result = normalize(source);
  for (const section of [...sections].reverse()) {
    if (!section.recipe) continue;
    const current = result.slice(section.start, section.end);
    const rendered = renderWindowSectionPreserving(
      current,
      section.recipe,
      migrating ? section.schemaVersion : 4
    );
    result = result.slice(0, section.start) + rendered + result.slice(section.end);
  }
  return restoreEol(result, eol);
}
function renderWindowSectionPreserving(sectionSource, recipe, sourceVersion) {
  const lines = normalize(sectionSource).split("\n");
  const bounds = managedBounds(lines, sourceVersion);
  if (!bounds) return renderWindowSection(recipe);
  const prefix = lines.slice(1, bounds.settingsHeading).join("\n").trim();
  const nextManagedHeading = bounds.contentsHeading >= 0 ? bounds.contentsHeading : bounds.readonlyHeading >= 0 ? bounds.readonlyHeading : bounds.managedEnd;
  const between = lines.slice(bounds.settingsTable.end, nextManagedHeading).join("\n").trim();
  const tail = lines.slice(bounds.managedEnd).join("\n").trim();
  const rendered = renderWindowSection(recipe).trimEnd().split("\n");
  const settingsHeading = rendered.findIndex((line) => line === "### \u53EF\u7F16\u8F91\u8BBE\u7F6E");
  const contentsHeading = rendered.findIndex((line) => line === "### \u6253\u5F00\u5185\u5BB9");
  const readonlyHeading = rendered.findIndex((line) => line === "### \u53EA\u8BFB\u4FE1\u606F");
  const output = [...rendered];
  const firstManagedHeading = contentsHeading >= 0 ? contentsHeading : readonlyHeading;
  if (between && firstManagedHeading >= 0) output.splice(firstManagedHeading, 0, "", between, "");
  if (prefix) output.splice(settingsHeading, 0, "", prefix, "");
  if (tail) output.push("", tail);
  return `${output.join("\n").replace(/\n{3,}/g, "\n\n")}
`;
}
function managedBounds(lines, version) {
  const contentsPattern = version === 1 ? /^###\s+Contents\s*$/i : /^###\s+打开内容\s*$/;
  const settingsHeading = version === 1 ? 1 : findLine(
    lines,
    1,
    lines.length,
    version >= 3 ? /^###\s+可编辑设置\s*$/ : /^###\s+窗口设置\s*$/
  );
  const contentsHeading = findLine(lines, 1, lines.length, contentsPattern);
  const readonlyHeading = version >= 3 ? findLine(lines, 1, lines.length, /^###\s+只读信息\s*$/) : -1;
  const settingsEnd = contentsHeading >= 0 ? contentsHeading : readonlyHeading >= 0 ? readonlyHeading : lines.length;
  const settingsTable = findTable(
    lines,
    settingsHeading,
    settingsEnd,
    version === 1 ? [["\u5B57\u6BB5", "\u503C"]] : version === 2 ? [["\u5C5E\u6027", "\u8BBE\u7F6E"]] : [["\u8BBE\u7F6E\u9879", "\u5F53\u524D\u503C", "\u586B\u5199\u63D0\u793A"]]
  );
  const contentsTable = contentsHeading < 0 ? null : findTable(
    lines,
    contentsHeading + 1,
    readonlyHeading >= 0 ? readonlyHeading : lines.length,
    version === 1 ? [["\u987A\u5E8F", "\u6807\u9898", "URL", "\u6FC0\u6D3B", "\u56FA\u5B9A"]] : [["\u987A\u5E8F", "\u9875\u9762\u6807\u9898", "\u6FC0\u6D3B", "\u56FA\u5B9A", "URL"]]
  );
  if (!settingsTable || version < 4 && (contentsHeading < 0 || !contentsTable)) return null;
  const readonlyTable = readonlyHeading < 0 ? null : findTable(lines, readonlyHeading + 1, lines.length, [["\u9879", "\u503C"]]);
  const detailsEnd = readonlyHeading < 0 ? -1 : findLine(lines, readonlyHeading + 1, lines.length, /^<\/details>\s*$/);
  return {
    settingsHeading,
    settingsTable,
    contentsHeading,
    contentsTable,
    readonlyHeading,
    readonlyTable,
    managedEnd: detailsEnd >= 0 ? detailsEnd + 1 : readonlyTable?.end ?? contentsTable?.end ?? settingsTable.end
  };
}
function parseWindowSection(lines, section, options) {
  const diagnostics = [];
  const bounds = managedBounds(
    lines.slice(section.headingLine, section.endLine),
    section.schemaVersion
  );
  if (!bounds) {
    return {
      recipe: null,
      diagnostics: [error(
        "WINDOW_TABLES",
        section.schemaVersion === 1 ? "Window \u7F3A\u5C11\u5B57\u6BB5\u8868\u6216 Contents \u8868\u3002" : "\u7A97\u53E3\u7F3A\u5C11\u201C\u7A97\u53E3\u8BBE\u7F6E\u201D\u6216\u201C\u6253\u5F00\u5185\u5BB9\u201D\u8868\u683C\u3002",
        section.headingLine + 1,
        section.name
      )]
    };
  }
  const fields = /* @__PURE__ */ new Map();
  for (const row of bounds.settingsTable.rows) {
    const key = stripCode(row[0] ?? "").trim();
    if (key && row.length >= 2) fields.set(key, settingValue(row, section.schemaVersion));
  }
  for (const row of bounds.readonlyTable?.rows ?? []) {
    const key = stripCode(row[0] ?? "").trim();
    if (key && row.length >= 2) fields.set(key, stripCode(row.slice(1).join(" | ")).trim());
  }
  const legacyApp = fields.get("app");
  const legacyDefaults = legacyApp ? APP_BY_LEGACY[legacyApp] : void 0;
  const adapter = section.schemaVersion === 1 ? legacyDefaults?.adapter : fields.get("\u9002\u914D\u5668");
  const browserId = section.schemaVersion === 1 ? legacyDefaults && "browserId" in legacyDefaults ? legacyDefaults.browserId : void 0 : fields.get("Browser ID");
  const appName = section.schemaVersion === 1 ? legacyDefaults?.appName ?? section.appName : fields.get("\u5E94\u7528") ?? section.appName;
  const bundleId = section.schemaVersion === 1 ? fields.get("bundle_id") ?? legacyDefaults?.bundleId ?? "" : fields.get("Bundle ID") ?? "";
  const id = section.schemaVersion === 1 ? fields.get("id") ?? "" : fields.get("ID") ?? "";
  const titleHint = section.schemaVersion === 1 ? fields.get("title_hint") ?? "" : fields.get("\u6807\u9898\u5339\u914D") ?? "";
  const openModeRaw = section.schemaVersion === 1 ? fields.get("open_mode") ?? "" : fields.get("\u6253\u5F00\u65B9\u5F0F") ?? "";
  const monitorRaw = section.schemaVersion === 1 ? fields.get("monitor") ?? "" : fields.get("\u5C4F\u5E55") ?? "";
  const spaceRaw = section.schemaVersion === 1 ? fields.get("space") ?? "" : fields.get("Space") ?? "";
  const layout = section.schemaVersion === 1 ? fields.get("layout") ?? "" : fields.get("\u5E03\u5C40") ?? "";
  const restoreModeRaw = section.schemaVersion === 4 ? fields.get("\u6062\u590D\u65B9\u5F0F") ?? "" : "open-content";
  const openMode = OPEN_MODE_VALUES[openModeRaw] ?? openModeRaw;
  const restoreMode = RESTORE_MODE_VALUES[restoreModeRaw] ?? restoreModeRaw;
  const monitor = MONITOR_VALUES[monitorRaw] ?? monitorRaw;
  const space = spaceRaw === "\u5F53\u524D" ? "current" : spaceRaw;
  const contentsTableInvalid = section.schemaVersion >= 4 && (bounds.contentsHeading >= 0 && !bounds.contentsTable || bounds.contentsHeading < 0 && restoreMode === "open-content");
  const requiredValues = [
    ["ID", id],
    ["\u5E94\u7528", appName],
    ["\u9002\u914D\u5668", adapter],
    ["Bundle ID", bundleId],
    ["\u6807\u9898\u5339\u914D", titleHint],
    ["\u6253\u5F00\u65B9\u5F0F", openMode],
    ["\u5C4F\u5E55", monitor],
    ["Space", space],
    ["\u5E03\u5C40", layout],
    ...section.schemaVersion === 4 ? [["\u6062\u590D\u65B9\u5F0F", restoreMode]] : []
  ];
  for (const [field, value] of requiredValues) {
    if (!value) diagnostics.push(error("MISSING_FIELD", `\u7F3A\u5C11\u5B57\u6BB5 ${field}\u3002`, section.headingLine + 1, section.name, field));
  }
  if (!/^win_[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
    diagnostics.push(error("WINDOW_ID", "ID \u5FC5\u987B\u662F win_<ULID>\u3002", section.headingLine + 1, section.name, "ID"));
  }
  if (!ADAPTERS.has(adapter)) {
    diagnostics.push(error("ADAPTER_ENUM", `\u4E0D\u652F\u6301\u7684\u9002\u914D\u5668\uFF1A${adapter || "\uFF08\u7A7A\uFF09"}`, section.headingLine + 1, section.name, "\u9002\u914D\u5668"));
  }
  if (adapter === "browser" && (!browserId || !BROWSERS.has(browserId))) {
    diagnostics.push(error("BROWSER_ID", `\u4E0D\u652F\u6301\u7684 Browser ID\uFF1A${browserId || "\uFF08\u7A7A\uFF09"}`, section.headingLine + 1, section.name, "Browser ID"));
  }
  if (!MODES.has(openMode)) {
    diagnostics.push(error("OPEN_MODE_ENUM", `\u4E0D\u652F\u6301\u7684\u6253\u5F00\u65B9\u5F0F\uFF1A${openMode || "\uFF08\u7A7A\uFF09"}`, section.headingLine + 1, section.name, "\u6253\u5F00\u65B9\u5F0F"));
  } else if (ADAPTERS.has(adapter) && !ADAPTER_MODES[adapter].has(openMode)) {
    diagnostics.push(error("OPEN_MODE_APP", `${adapter} \u4E0D\u652F\u6301 ${openMode}\u3002`, section.headingLine + 1, section.name, "\u6253\u5F00\u65B9\u5F0F"));
  }
  if (!RESTORE_MODES.has(restoreMode)) {
    diagnostics.push(error("RESTORE_MODE_ENUM", `\u4E0D\u652F\u6301\u7684\u6062\u590D\u65B9\u5F0F\uFF1A${restoreMode || "\uFF08\u7A7A\uFF09"}`, section.headingLine + 1, section.name, "\u6062\u590D\u65B9\u5F0F"));
  }
  if (!MONITORS.has(monitor)) {
    diagnostics.push(error("MONITOR_ENUM", `\u4E0D\u652F\u6301\u7684\u5C4F\u5E55\uFF1A${monitor || "\uFF08\u7A7A\uFF09"}`, section.headingLine + 1, section.name, "\u5C4F\u5E55"));
  }
  if (space !== "current") {
    diagnostics.push(error(
      "SPACE_UNSUPPORTED",
      /^\d+$/.test(space) ? `Space ${space} \u53EF\u89E3\u6790\uFF0C\u4F46\u5F53\u524D\u7248\u672C\u53EA\u5141\u8BB8 current\u3002` : "Space \u5FC5\u987B\u4E3A\u5F53\u524D\u3002",
      section.headingLine + 1,
      section.name,
      "Space"
    ));
  }
  const layoutError = validateLayout(layout);
  if (layoutError) diagnostics.push(error("LAYOUT_INVALID", layoutError, section.headingLine + 1, section.name, "\u5E03\u5C40"));
  const contents = [];
  for (const row of bounds.contentsTable?.rows ?? []) {
    if (row.length < 5) continue;
    if (section.schemaVersion === 1) {
      const content = legacyContentValue(row);
      contents.push({
        order: content.order,
        title: content.title,
        url: content.url,
        active: content.active,
        pinned: content.pinned
      });
    } else {
      const content = modernContentValue(row);
      contents.push({
        order: content.order,
        title: content.title,
        active: content.active,
        pinned: content.pinned,
        url: content.url
      });
    }
  }
  if (contentsTableInvalid) {
    diagnostics.push(error(
      "CONTENTS_TABLE_INVALID",
      "\u201C\u6253\u5F00\u5185\u5BB9\u201D\u8868\u683C\u7F3A\u5931\u6216\u683C\u5F0F\u4E0D\u6B63\u786E\u3002\u8BF7\u4FDD\u7559\u6807\u51C6\u8868\u5934\u4E0E\u5206\u9694\u884C\u3002",
      section.headingLine + Math.max(bounds.contentsHeading, 0) + 1,
      section.name,
      "\u6253\u5F00\u5185\u5BB9"
    ));
  } else {
    validateContents(contents, restoreMode, diagnostics, section, options);
  }
  if (diagnostics.some((item) => item.severity === "error")) return { recipe: null, diagnostics };
  return {
    recipe: {
      id,
      name: section.name,
      adapter,
      appName,
      bundleId,
      ...browserId ? { browserId } : {},
      titleHint,
      openMode,
      monitor,
      space,
      layout,
      restoreMode,
      contents
    },
    diagnostics
  };
}
function validateContents(contents, restoreMode, diagnostics, section, options) {
  if (restoreMode === "launch-only") {
    if (contents.length > 0) {
      diagnostics.push(error("LAUNCH_ONLY_CONTENTS", "\u4EC5\u542F\u52A8\u5E94\u7528\u65F6\u4E0D\u80FD\u5305\u542B\u201C\u6253\u5F00\u5185\u5BB9\u201D\u3002", section.headingLine + 1, section.name, "\u6062\u590D\u65B9\u5F0F"));
    }
    return;
  }
  if (contents.length === 0) {
    diagnostics.push(error("CONTENTS_EMPTY", "\u6253\u5F00\u5185\u5BB9\u81F3\u5C11\u9700\u8981\u4E00\u884C\u3002", section.headingLine + 1, section.name));
    return;
  }
  const seenOrders = /* @__PURE__ */ new Set();
  let activeCount = 0;
  const trusted = new Set([
    ...DEFAULT_SCHEMES,
    ...options.trustedSchemes ?? []
  ].map((item) => item.toLowerCase()));
  for (const content of contents) {
    if (!Number.isInteger(content.order) || content.order < 1) {
      diagnostics.push(error("CONTENT_ORDER", "\u987A\u5E8F\u5FC5\u987B\u662F\u5927\u4E8E 0 \u7684\u6574\u6570\u3002", section.headingLine + 1, section.name, "\u987A\u5E8F"));
    } else if (seenOrders.has(content.order)) {
      diagnostics.push(error("CONTENT_ORDER_DUPLICATE", `\u987A\u5E8F ${content.order} \u91CD\u590D\u3002`, section.headingLine + 1, section.name, "\u987A\u5E8F"));
    }
    seenOrders.add(content.order);
    if (content.active) activeCount += 1;
    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(content.url)?.[1]?.toLowerCase();
    if (!scheme) {
      diagnostics.push(error("URL_SCHEME", `URL \u7F3A\u5C11 Scheme\uFF1A${content.url}`, section.headingLine + 1, section.name, "URL"));
    } else if (!trusted.has(scheme)) {
      diagnostics.push(error("UNTRUSTED_SCHEME", `URL Scheme \u201C${scheme}\u201D\u5C1A\u672A\u52A0\u5165\u53EF\u4FE1\u5217\u8868\u3002`, section.headingLine + 1, section.name, "URL"));
    }
  }
  if (activeCount > 1) {
    diagnostics.push(error("CONTENT_ACTIVE", "\u6253\u5F00\u5185\u5BB9\u6700\u591A\u53EA\u80FD\u6709\u4E00\u9879\u6FC0\u6D3B\u3002", section.headingLine + 1, section.name, "\u6FC0\u6D3B"));
  }
}
function parseFrontmatter(lines) {
  if (lines[0]?.trim() !== "---") return { value: null, diagnostics: [] };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) {
    return { value: null, diagnostics: [error("FRONTMATTER_UNCLOSED", "YAML frontmatter \u7F3A\u5C11\u7ED3\u675F\u7684 ---\u3002", 1)] };
  }
  try {
    const value = (0, import_yaml.parse)(lines.slice(1, end).join("\n"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { value: null, diagnostics: [error("FRONTMATTER_TYPE", "YAML frontmatter \u5FC5\u987B\u662F\u5BF9\u8C61\u3002", 1)] };
    }
    return { value, diagnostics: [] };
  } catch (cause) {
    return { value: null, diagnostics: [error("FRONTMATTER_PARSE", `\u65E0\u6CD5\u89E3\u6790 YAML frontmatter\uFF1A${messageOf(cause)}`, 1)] };
  }
}
function findWindowSections(lines, schemaVersion) {
  const sections = [];
  const offsets = lineOffsets(lines);
  for (let index = 0; index < lines.length; index += 1) {
    const legacy = /^##\s+Window\s*·\s*(.+?)\s*$/.exec(lines[index] ?? "");
    const modern = /^##\s+(.+?)\s*·\s*(.+?)\s*$/.exec(lines[index] ?? "");
    if (!legacy && !modern) continue;
    let endLine = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^##\s+/.test(lines[cursor] ?? "")) {
        endLine = cursor;
        break;
      }
    }
    const version = legacy ? 1 : schemaVersion >= 3 ? schemaVersion : 2;
    if (version !== 1 && findLine(lines, index + 1, endLine, /^###\s+(窗口设置|可编辑设置)\s*$/) < 0) continue;
    sections.push({
      start: offsets[index] ?? 0,
      end: offsets[endLine] ?? lines.join("\n").length,
      headingLine: index,
      endLine,
      name: (legacy?.[1] ?? modern?.[2] ?? "").trim(),
      appName: (legacy ? "" : modern?.[1] ?? "").trim(),
      schemaVersion: version,
      recipe: null
    });
  }
  if (schemaVersion >= 1 && schemaVersion <= 4) return sections;
  return sections;
}
function settingValue(row, version) {
  if (version >= 3 && row.length > 3) {
    return stripCode(row.slice(1, -1).join(" | ")).trim();
  }
  if (version >= 3) return stripCode(row[1] ?? "").trim();
  return stripCode(row.slice(1).join(" | ")).trim();
}
function legacyContentValue(row) {
  const urlIndex = row.findIndex(
    (cell, index) => index > 1 && index < row.length - 2 && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(stripCode(cell).trim())
  );
  if (urlIndex >= 0) {
    return {
      order: Number(stripCode(row[0] ?? "")),
      title: stripCode(row.slice(1, urlIndex).join(" | ")),
      url: stripCode(row.slice(urlIndex, -2).join("|")),
      active: parseBoolean(row[row.length - 2] ?? ""),
      pinned: parseBoolean(row[row.length - 1] ?? "")
    };
  }
  return {
    order: Number(stripCode(row[0] ?? "")),
    title: stripCode(row.slice(1, -3).join(" | ")),
    url: stripCode(row[row.length - 3] ?? ""),
    active: parseBoolean(row[row.length - 2] ?? ""),
    pinned: parseBoolean(row[row.length - 1] ?? "")
  };
}
function modernContentValue(row) {
  for (let index = 2; index < row.length - 2; index += 1) {
    if (isBooleanCell(row[index] ?? "") && isBooleanCell(row[index + 1] ?? "") && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(stripCode(row.slice(index + 2).join("|")).trim())) {
      return {
        order: Number(stripCode(row[0] ?? "")),
        title: stripCode(row.slice(1, index).join(" | ")),
        active: parseBoolean(row[index] ?? ""),
        pinned: parseBoolean(row[index + 1] ?? ""),
        url: stripCode(row.slice(index + 2).join("|"))
      };
    }
  }
  return {
    order: Number(stripCode(row[0] ?? "")),
    title: stripCode(row.slice(1, -3).join(" | ")),
    active: parseBoolean(row[row.length - 3] ?? ""),
    pinned: parseBoolean(row[row.length - 2] ?? ""),
    url: stripCode(row[row.length - 1] ?? "")
  };
}
function isBooleanCell(value) {
  return ["\u662F", "\u5426", "true", "false", "yes", "no", "1", "0"].includes(
    stripCode(value).trim().toLowerCase()
  );
}
function findTable(lines, start, end, expectedHeaders = []) {
  for (let index = Math.max(0, start); index + 1 < end; index += 1) {
    const header = splitTableRow(lines[index] ?? "");
    const separator = splitTableRow(lines[index + 1] ?? "");
    if (!header || !separator || header.length !== separator.length || !separator.every((cell) => /^:?-+:?$/.test(cell.trim())) || expectedHeaders.length > 0 && !expectedHeaders.some((expected) => tableHeaderMatches(header, expected))) continue;
    const rows = [];
    let cursor = index + 2;
    for (; cursor < end; cursor += 1) {
      const row = splitTableRow(lines[cursor] ?? "");
      if (!row) break;
      rows.push(row);
    }
    return { start: index, end: cursor, header, rows };
  }
  return null;
}
function tableHeaderMatches(actual, expected) {
  return actual.length === expected.length && actual.every(
    (cell, index) => stripCode(cell).trim() === expected[index]
  );
}
function splitTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = [];
  let current = "";
  let escaped = false;
  for (const character of trimmed.slice(1, -1)) {
    if (escaped) {
      current += character === "|" ? "|" : `\\${character}`;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (escaped) current += "\\";
  cells.push(current.trim());
  return cells;
}
function reverseMap(values) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [value, key]));
}
function parseBoolean(value) {
  return ["\u662F", "true", "yes", "1"].includes(stripCode(value).trim().toLowerCase());
}
function stripCode(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("`") && trimmed.endsWith("`") ? trimmed.slice(1, -1).replace(/\\`/g, "`") : trimmed;
}
function escapeCell(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");
}
function escapeCode(value) {
  return escapeCell(value).replaceAll("`", "\\`");
}
function safeHeading(value) {
  return value.replace(/[|\r\n]+/g, " - ").replace(/\s+/g, " ").trim();
}
function headingName(source) {
  const match = /^#\s+(.+?)\s*$/m.exec(normalize(source).trim());
  return match?.[1]?.trim() || null;
}
function normalize(source) {
  return source.replace(/\r\n/g, "\n");
}
function restoreEol(source, eol) {
  return eol === "\r\n" ? source.replace(/\n/g, "\r\n") : source;
}
function lineOffsets(lines) {
  const offsets = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  offsets.push(Math.max(0, offset - 1));
  return offsets;
}
function findLine(lines, start, end, pattern) {
  for (let index = start; index < end; index += 1) {
    if (pattern.test(lines[index] ?? "")) return index;
  }
  return -1;
}
function stringValue(value) {
  return value == null ? "" : String(value);
}
function messageOf(cause) {
  return cause instanceof Error ? cause.message : String(cause);
}
function error(code, message, line, windowName, field) {
  return { severity: "error", code, message, line, windowName, field };
}
function warning(code, message, line, windowName, field) {
  return { severity: "warning", code, message, line, windowName, field };
}

// src/modals.ts
var TextPromptModal = class extends import_obsidian.Modal {
  constructor(app, title, placeholder, onSubmit) {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
  }
  value = "";
  onOpen() {
    prepareModal(this, "compact");
    this.titleEl.setText(this.title);
    createModalIntro(
      this.contentEl,
      "\u65B0\u5EFA\u5DE5\u4F5C\u533A",
      "\u4E3A\u5F53\u524D\u4EFB\u52A1\u521B\u5EFA\u4E00\u4EFD\u53EF\u6355\u83B7\u3001\u53EF\u7F16\u8F91\u3001\u53EF\u6062\u590D\u7684 Workspace Markdown\u3002",
      "folder-plus"
    );
    const form = this.contentEl.createDiv({ cls: "workspace-bookmark-form-card" });
    new import_obsidian.Setting(form).setName("Workspace \u540D\u79F0").setDesc("\u7A0D\u540E\u4ECD\u53EF\u5728 Markdown \u4E2D\u4FEE\u6539\u3002").addText((input) => {
      input.setPlaceholder(this.placeholder).onChange((value) => this.value = value.trim());
      input.inputEl.focus();
      input.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void this.submit();
      });
    });
    const footer = createModalFooter(this.contentEl);
    new import_obsidian.Setting(footer).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => this.close())
    ).addButton(
      (button) => button.setButtonText("\u521B\u5EFA").setCta().onClick(() => void this.submit())
    );
  }
  async submit() {
    if (!this.value) {
      new import_obsidian.Notice("\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002");
      return;
    }
    await this.onSubmit(this.value);
    this.close();
  }
};
var CopyableTextModal = class extends import_obsidian.Modal {
  constructor(app, heading, value) {
    super(app);
    this.heading = heading;
    this.value = value;
  }
  onOpen() {
    prepareModal(this, "compact");
    this.titleEl.setText(this.heading);
    createModalIntro(
      this.contentEl,
      "\u81EA\u52A8\u590D\u5236\u5931\u8D25",
      "\u8BF7\u624B\u52A8\u590D\u5236\u4E0B\u65B9\u5185\u5BB9\u3002\u63D2\u4EF6\u4E0D\u4F1A\u6267\u884C\u8FD9\u6BB5\u547D\u4EE4\u3002",
      "clipboard-copy",
      "warning"
    );
    const input = this.contentEl.createEl("textarea", {
      cls: "workspace-bookmark-copyable-text",
      attr: {
        readonly: "true",
        "aria-label": this.heading
      }
    });
    input.value = this.value;
    input.rows = Math.min(12, Math.max(4, this.value.split("\n").length));
    input.addEventListener("focus", () => input.select());
    const footer = createModalFooter(this.contentEl);
    new import_obsidian.Setting(footer).addButton((button) => button.setButtonText("\u5173\u95ED").onClick(() => this.close())).addButton(
      (button) => button.setButtonText("\u518D\u6B21\u590D\u5236").setIcon("copy").setCta().onClick(async () => {
        try {
          await navigator.clipboard.writeText(this.value);
          new import_obsidian.Notice("\u5DF2\u590D\u5236\u3002");
          this.close();
        } catch {
          input.focus();
          input.select();
          new import_obsidian.Notice("\u4ECD\u65E0\u6CD5\u8BBF\u95EE\u526A\u8D34\u677F\uFF0C\u8BF7\u6309 \u2318C \u624B\u52A8\u590D\u5236\u3002", 6e3);
        }
      })
    );
    window.setTimeout(() => {
      input.focus();
      input.select();
    });
  }
};
var DiagnosticsModal = class extends import_obsidian.Modal {
  constructor(app, title, diagnostics) {
    super(app);
    this.title = title;
    this.diagnostics = diagnostics;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText(this.title);
    const errors = this.diagnostics.filter((item) => item.severity === "error").length;
    const warnings = this.diagnostics.length - errors;
    createModalIntro(
      this.contentEl,
      errors > 0 ? "\u9700\u8981\u4FEE\u6B63" : warnings > 0 ? "\u53EF\u4EE5\u6267\u884C\uFF0C\u4F46\u5EFA\u8BAE\u68C0\u67E5" : "\u72B6\u6001\u6B63\u5E38",
      errors > 0 ? `\u53D1\u73B0 ${errors} \u4E2A\u9519\u8BEF\u3002\u4FEE\u6B63\u524D\u4E0D\u4F1A\u6267\u884C\u6216\u8986\u76D6\u539F\u6587\u3002` : warnings > 0 ? `\u6CA1\u6709\u963B\u65AD\u9519\u8BEF\uFF0C\u53E6\u6709 ${warnings} \u6761\u63D0\u9192\u3002` : "\u683C\u5F0F\u3001\u5B57\u6BB5\u548C URL \u5747\u901A\u8FC7\u68C0\u67E5\u3002",
      errors > 0 ? "circle-alert" : warnings > 0 ? "triangle-alert" : "circle-check",
      errors > 0 ? "danger" : warnings > 0 ? "warning" : "success"
    );
    const container = this.contentEl.createDiv({ cls: "workspace-bookmark-diagnostics" });
    if (this.diagnostics.length === 0) {
      createEmptyState(container, "sparkles", "\u65E0\u9700\u5904\u7406", "\u5F53\u524D Workspace \u5DF2\u901A\u8FC7\u5168\u90E8\u6821\u9A8C\u3002");
      return;
    }
    for (const diagnostic of this.diagnostics) {
      const location = [
        diagnostic.line ? `\u7B2C ${diagnostic.line} \u884C` : "",
        diagnostic.windowName ? `Window\uFF1A${diagnostic.windowName}` : "",
        diagnostic.field ? `\u5B57\u6BB5\uFF1A${diagnostic.field}` : ""
      ].filter(Boolean).join(" \xB7 ");
      const item = container.createDiv({ cls: "workspace-bookmark-diagnostic-row" });
      item.addClass(
        diagnostic.severity === "error" ? "is-error" : "is-warning"
      );
      const icon = item.createDiv({ cls: "workspace-bookmark-diagnostic-icon" });
      (0, import_obsidian.setIcon)(icon, diagnostic.severity === "error" ? "circle-x" : "triangle-alert");
      const body = item.createDiv({ cls: "workspace-bookmark-diagnostic-body" });
      const heading = body.createDiv({ cls: "workspace-bookmark-diagnostic-heading" });
      heading.createEl("strong", { text: diagnostic.message });
      heading.createSpan({ text: diagnostic.code, cls: "workspace-bookmark-code" });
      if (location) body.createEl("small", { text: location });
    }
  }
};
var RestoreBlockedModal = class extends import_obsidian.Modal {
  constructor(app, workspaceName, issues, actions = {}) {
    super(app);
    this.workspaceName = workspaceName;
    this.issues = issues;
    this.actions = actions;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText(`\u65E0\u6CD5\u6062\u590D \xB7 ${this.workspaceName}`);
    createModalIntro(
      this.contentEl,
      "\u5F53\u524D\u6CA1\u6709\u53EF\u5B89\u5168\u6267\u884C\u7684\u5185\u5BB9",
      "\u6CA1\u6709\u542F\u52A8\u4EFB\u4F55\u5199\u5165\u578B\u6062\u590D\u64CD\u4F5C\u3002\u8BF7\u4FEE\u590D\u8FDE\u63A5\u6216\u7F16\u8F91\u5BF9\u5E94 Window \u540E\u91CD\u65B0\u68C0\u6D4B\u3002",
      "circle-off",
      "danger"
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-issue-list" });
    for (const issue of this.issues) {
      const row = list.createDiv({ cls: "workspace-bookmark-issue-row" });
      const icon = row.createDiv({ cls: "workspace-bookmark-issue-icon" });
      (0, import_obsidian.setIcon)(icon, "alert-circle");
      const copy = row.createDiv();
      if (issue.windowName) copy.createEl("strong", { text: issue.windowName });
      copy.createEl("p", { text: issue.message });
      if (issue.windowId && this.actions.onEditWindow) {
        new import_obsidian.ButtonComponent(row).setButtonText("\u7F16\u8F91").setIcon("pencil").onClick(async () => {
          this.close();
          await this.actions.onEditWindow?.(issue.windowId);
        });
      }
    }
    const footer = createModalFooter(this.contentEl);
    const buttons = new import_obsidian.Setting(footer);
    if (this.actions.onDiagnostics) {
      buttons.addButton(
        (button) => button.setButtonText("\u7CFB\u7EDF\u8BCA\u65AD").setIcon("stethoscope").onClick(async () => {
          this.close();
          await this.actions.onDiagnostics?.();
        })
      );
    }
    buttons.addButton(
      (button) => button.setButtonText("\u590D\u5236\u8BE6\u60C5").setIcon("copy").onClick(async () => {
        await navigator.clipboard.writeText(
          this.issues.map(
            (issue) => `${issue.windowName ? `${issue.windowName}\uFF1A` : ""}${issue.message}`
          ).join("\n")
        );
        new import_obsidian.Notice("\u5DF2\u590D\u5236\u6062\u590D\u963B\u65AD\u8BE6\u60C5\u3002");
      })
    );
    if (this.actions.onRetry) {
      buttons.addButton(
        (button) => button.setButtonText("\u91CD\u65B0\u68C0\u6D4B").setIcon("refresh-cw").setCta().onClick(async () => {
          this.close();
          await this.actions.onRetry?.();
        })
      );
    }
  }
};
var RestoreResultsModal = class extends import_obsidian.Modal {
  constructor(app, workspaceName, items, actions = {}) {
    super(app);
    this.workspaceName = workspaceName;
    this.items = items;
    this.actions = actions;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText(`\u6062\u590D\u7ED3\u679C \xB7 ${this.workspaceName}`);
    const success = this.items.filter((item) => item.status === "success").length;
    const failed = this.items.filter((item) => item.status === "failed").length;
    createModalIntro(
      this.contentEl,
      failed > 0 ? "\u90E8\u5206\u9879\u76EE\u9700\u8981\u5904\u7406" : "\u6062\u590D\u6D41\u7A0B\u5DF2\u5B8C\u6210",
      failed > 0 ? `${success} \u9879\u6210\u529F\uFF0C${failed} \u9879\u5931\u8D25\u3002\u4E0B\u65B9\u4FDD\u7559\u4E86\u6BCF\u4E00\u6B65\u7684\u7ED3\u679C\u3002` : `${success} \u9879\u64CD\u4F5C\u6210\u529F\u5B8C\u6210\u3002`,
      failed > 0 ? "list-checks" : "party-popper",
      failed > 0 ? "warning" : "success"
    );
    const metrics = this.contentEl.createDiv({ cls: "workspace-bookmark-metrics" });
    const order = ["failed", "degraded", "skipped", "success"];
    const labels = {
      success: "\u6210\u529F",
      skipped: "\u8DF3\u8FC7",
      failed: "\u5931\u8D25",
      degraded: "\u964D\u7EA7"
    };
    const icons = {
      success: "circle-check",
      skipped: "circle-minus",
      failed: "circle-x",
      degraded: "triangle-alert"
    };
    for (const status of order) {
      const count = this.items.filter((item) => item.status === status).length;
      const metric = metrics.createDiv({ cls: `workspace-bookmark-metric is-${status}` });
      metric.createSpan({ text: String(count), cls: "workspace-bookmark-metric-value" });
      metric.createSpan({ text: labels[status], cls: "workspace-bookmark-metric-label" });
    }
    const groups = this.contentEl.createDiv({ cls: "workspace-bookmark-result-groups" });
    for (const status of order) {
      const matches = this.items.filter((item) => item.status === status);
      if (matches.length === 0) continue;
      const section = groups.createDiv({ cls: `workspace-bookmark-result-section is-${status}` });
      const heading = section.createDiv({ cls: "workspace-bookmark-section-heading" });
      const headingIcon = heading.createSpan();
      (0, import_obsidian.setIcon)(headingIcon, icons[status]);
      heading.createEl("h3", { text: `${labels[status]}\uFF08${matches.length}\uFF09` });
      const list = section.createDiv({ cls: "workspace-bookmark-result-list" });
      for (const item of matches) {
        const row = list.createDiv({ cls: "workspace-bookmark-result-row" });
        const copy = row.createDiv({ cls: "workspace-bookmark-result-copy" });
        copy.createEl("strong", { text: item.label });
        if (item.detail) copy.createEl("small", { text: item.detail });
        if (item.windowId && this.actions.onEditWindow && item.status !== "success") {
          new import_obsidian.ButtonComponent(row).setButtonText("\u7F16\u8F91").setIcon("pencil").onClick(async () => {
            this.close();
            await this.actions.onEditWindow?.(item.windowId);
          });
        }
      }
    }
    if (this.items.length === 0) {
      createEmptyState(groups, "inbox", "\u6CA1\u6709\u53EF\u6267\u884C\u7684 Window", "\u8BF7\u5148\u68C0\u67E5 Workspace \u5185\u5BB9\u3002");
    }
    const footer = createModalFooter(this.contentEl);
    const buttons = new import_obsidian.Setting(footer);
    if (this.actions.onDiagnostics) {
      buttons.addButton(
        (button) => button.setButtonText("\u7CFB\u7EDF\u8BCA\u65AD").setIcon("stethoscope").onClick(async () => {
          this.close();
          await this.actions.onDiagnostics?.();
        })
      );
    }
    buttons.addButton(
      (button) => button.setButtonText("\u590D\u5236\u7ED3\u679C").setIcon("copy").onClick(async () => {
        await navigator.clipboard.writeText(JSON.stringify({
          workspace: this.workspaceName,
          items: this.items
        }, null, 2));
        new import_obsidian.Notice("\u5DF2\u590D\u5236\u6062\u590D\u7ED3\u679C\u3002");
      })
    );
  }
};
var SystemDiagnosticsModal = class extends import_obsidian.Modal {
  constructor(app, report, onRetry) {
    super(app);
    this.report = report;
    this.onRetry = onRetry;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText("Workspace Bookmark \u7CFB\u7EDF\u8BCA\u65AD");
    const passed = this.report.items.filter((item) => item.ok).length;
    const healthy = passed === this.report.items.length;
    createModalIntro(
      this.contentEl,
      healthy ? "\u6240\u6709\u7EC4\u4EF6\u5747\u53EF\u7528" : "\u8FD0\u884C\u73AF\u5883\u9700\u8981\u5904\u7406",
      `\u63D2\u4EF6 ${this.report.pluginVersion} \xB7 ${passed}/${this.report.items.length} \u9879\u901A\u8FC7 \xB7 \u53D7\u7BA1\u76EE\u5F55 ${this.report.managedFolder}`,
      healthy ? "badge-check" : "stethoscope",
      healthy ? "success" : "warning"
    );
    const grid = this.contentEl.createDiv({ cls: "workspace-bookmark-health-grid" });
    for (const item of this.report.items) {
      const row = grid.createDiv({
        cls: `workspace-bookmark-health-row ${item.ok ? "is-ok" : "is-blocked"}`
      });
      const icon = row.createDiv({ cls: "workspace-bookmark-health-icon" });
      (0, import_obsidian.setIcon)(icon, item.ok ? "check" : "x");
      const copy = row.createDiv({ cls: "workspace-bookmark-health-copy" });
      copy.createEl("strong", { text: item.label });
      copy.createEl("p", { text: item.value });
      if (item.help && !item.ok) copy.createEl("small", { text: item.help });
    }
    const footer = createModalFooter(this.contentEl);
    new import_obsidian.Setting(footer).setName("\u8131\u654F\u8BCA\u65AD\u62A5\u544A").setDesc("\u4E0D\u5305\u542B\u6807\u7B7E\u9875 URL\u3001\u6807\u9898\u6216 Workspace \u6B63\u6587\u3002").addButton((button) => {
      if (!this.onRetry) return;
      button.setButtonText("\u91CD\u65B0\u68C0\u6D4B").onClick(async () => {
        this.close();
        await this.onRetry?.();
      });
    }).addButton(
      (button) => button.setButtonText("\u590D\u5236").onClick(async () => {
        await navigator.clipboard.writeText(JSON.stringify(this.report, null, 2));
        new import_obsidian.Notice("\u5DF2\u590D\u5236\u8131\u654F\u8BCA\u65AD\u62A5\u544A\u3002");
      })
    );
  }
};
var ConfirmSchemesModal = class extends import_obsidian.Modal {
  constructor(app, schemes, onConfirm) {
    super(app);
    this.schemes = schemes;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    prepareModal(this, "compact");
    this.titleEl.setText("\u4FE1\u4EFB URL Scheme");
    createModalIntro(
      this.contentEl,
      "\u4EC5\u4FE1\u4EFB\u4F60\u8BA4\u8BC6\u7684\u5E94\u7528",
      "\u7B2C\u4E09\u65B9 URL Scheme \u53EF\u4EE5\u5524\u8D77\u672C\u673A\u5E94\u7528\u3002Workspace Bookmark \u4E0D\u4F1A\u6267\u884C Shell \u547D\u4EE4\u3002",
      "shield-question",
      "warning"
    );
    const schemes = this.contentEl.createDiv({ cls: "workspace-bookmark-scheme-list" });
    for (const scheme of this.schemes) {
      schemes.createSpan({ text: `${scheme}://`, cls: "workspace-bookmark-chip is-accent" });
    }
    const row = new import_obsidian.Setting(createModalFooter(this.contentEl));
    row.addButton((button) => button.setButtonText("\u53D6\u6D88").onClick(() => this.close()));
    row.addButton(
      (button) => button.setButtonText("\u4FE1\u4EFB\u5E76\u7EE7\u7EED").setCta().onClick(async () => {
        await this.onConfirm();
        this.close();
      })
    );
  }
};
var WorkspaceBrowserModal = class extends import_obsidian.Modal {
  constructor(app, items, onOpenWorkspace, onCopyLaunchUrl) {
    super(app);
    this.items = items;
    this.onOpenWorkspace = onOpenWorkspace;
    this.onCopyLaunchUrl = onCopyLaunchUrl;
  }
  onOpen() {
    prepareModal(this, "wide");
    this.titleEl.setText("Workspace Library");
    createModalIntro(
      this.contentEl,
      `${this.items.length} \u4E2A Workspace`,
      "\u6309\u540D\u79F0\u3001\u6807\u7B7E\u3001App \u6216\u9875\u9762\u6807\u9898\u67E5\u627E\u3002",
      "library-big"
    );
    const toolbar = this.contentEl.createDiv({ cls: "workspace-bookmark-library-toolbar" });
    const searchShell = toolbar.createDiv({ cls: "workspace-bookmark-search-shell" });
    const searchIcon = searchShell.createSpan();
    (0, import_obsidian.setIcon)(searchIcon, "search");
    const searchInput = searchShell.createEl("input", {
      type: "search",
      placeholder: "\u641C\u7D22 Workspace\u3001\u6807\u7B7E\u3001App \u6216 URL \u6807\u9898\u2026"
    });
    const count = toolbar.createSpan({ cls: "workspace-bookmark-result-count" });
    const results = this.contentEl.createDiv({ cls: "workspace-bookmark-library-results" });
    const renderItems = (container, items) => {
      for (const item of items) {
        const row = container.createDiv({ cls: "workspace-bookmark-workspace-row" });
        const lead = row.createDiv({ cls: "workspace-bookmark-workspace-row-lead" });
        const glyph = lead.createDiv({ cls: "workspace-bookmark-workspace-glyph" });
        (0, import_obsidian.setIcon)(glyph, appIconFor(item.apps));
        const title = lead.createDiv();
        title.createEl("h3", { text: item.name });
        const metadata = [
          ...item.apps.slice(0, 2).map(appLabel),
          `${item.windowCount} \u4E2A\u7A97\u53E3`,
          `${item.contentCount} \u4E2A\u9875\u9762`,
          item.lastOpenedAt ? relativeTime(item.lastOpenedAt) : ""
        ].filter(Boolean);
        title.createEl("small", { text: metadata.join(" \xB7 ") });
        if (item.tags.length > 0) {
          title.createDiv({
            text: item.tags.slice(0, 3).map((tag) => `#${tag}`).join("  "),
            cls: "workspace-bookmark-workspace-tags"
          });
        }
        const actions = row.createDiv({ cls: "workspace-bookmark-row-actions" });
        new import_obsidian.ButtonComponent(actions).setIcon("link-2").setTooltip("\u590D\u5236\u542F\u52A8\u94FE\u63A5").onClick(async () => {
          await this.onCopyLaunchUrl(item);
        });
        new import_obsidian.ButtonComponent(actions).setButtonText("\u7B14\u8BB0").setIcon("file-text").onClick(async () => {
          await this.app.workspace.getLeaf(false).openFile(item.file);
          this.close();
        });
        new import_obsidian.ButtonComponent(actions).setButtonText("\u8FD0\u884C").setIcon("play").setCta().onClick(async () => {
          await this.onOpenWorkspace(item);
          this.close();
        });
      }
    };
    const render = (query) => {
      results.empty();
      const normalized = query.trim().toLowerCase();
      const filtered = this.items.filter((item) => item.searchable.includes(normalized));
      count.setText(`${filtered.length} \u4E2A\u7ED3\u679C`);
      if (!normalized) {
        const recent = filtered.filter((item) => item.lastOpenedAt).sort(
          (left, right) => (right.lastOpenedAt ?? "").localeCompare(left.lastOpenedAt ?? "")
        ).slice(0, 5);
        if (recent.length > 0) {
          const recentSection = createLibrarySection(results, "\u6700\u8FD1\u4F7F\u7528", "history");
          renderItems(recentSection, recent);
        }
        const allSection = createLibrarySection(results, "\u5168\u90E8 Workspace", "layers-3");
        renderItems(allSection, filtered);
      } else {
        const searchSection = createLibrarySection(results, "\u641C\u7D22\u7ED3\u679C", "list-filter");
        renderItems(searchSection, filtered);
      }
      if (filtered.length === 0) {
        createEmptyState(
          results,
          "search-x",
          "\u6CA1\u6709\u5339\u914D\u7684 Workspace",
          "\u5C1D\u8BD5\u641C\u7D22\u6807\u7B7E\u3001App \u540D\u79F0\u6216\u7F51\u9875\u6807\u9898\u3002"
        );
      }
    };
    searchInput.addEventListener("input", () => render(searchInput.value));
    window.setTimeout(() => searchInput.focus(), 0);
    render("");
  }
};
var CaptureModal = class extends import_obsidian.Modal {
  constructor(app, candidates, existing, onSubmit, options = {}) {
    super(app);
    this.candidates = candidates;
    this.existing = existing;
    this.onSubmit = onSubmit;
    this.options = options;
  }
  summaryEl = null;
  sourceNoticesEl = null;
  candidatesEl = null;
  refreshButton = null;
  refreshing = false;
  candidateRows = /* @__PURE__ */ new Map();
  onOpen() {
    prepareModal(this, "wide");
    this.titleEl.setText("\u6536\u5F55\u5F53\u524D Workspace");
    const toolbar = this.contentEl.createDiv({ cls: "workspace-bookmark-capture-toolbar" });
    this.summaryEl = toolbar.createDiv({ cls: "workspace-bookmark-capture-summary" });
    const quickActions = toolbar.createDiv({ cls: "workspace-bookmark-quick-actions" });
    this.sourceNoticesEl = quickActions.createDiv({
      cls: "workspace-bookmark-capture-bridge-icons"
    });
    if (this.options.onRefresh) {
      this.refreshButton = new import_obsidian.ButtonComponent(quickActions).setIcon("refresh-cw").setTooltip("\u5237\u65B0\u5F53\u524D\u53EF\u89C1\u7A97\u53E3").onClick(() => void this.refreshCandidates());
    }
    this.updateScannedAt(this.options.scannedAt);
    new import_obsidian.ButtonComponent(quickActions).setIcon("check-check").setTooltip("\u5168\u90E8\u6536\u5F55").onClick(() => this.setAllCandidates(true));
    new import_obsidian.ButtonComponent(quickActions).setIcon("circle-off").setTooltip("\u5168\u90E8\u5FFD\u7565").onClick(() => this.setAllCandidates(false));
    this.candidatesEl = this.contentEl.createDiv({
      cls: "workspace-bookmark-capture-candidates"
    });
    this.renderSourceNotices(this.options.sourceNotices ?? []);
    this.renderCandidates();
    this.updateCaptureSummary();
    const footer = createModalFooter(this.contentEl, "sticky");
    footer.createEl("small", { text: "\u5199\u5165\u524D\u4F1A\u663E\u793A\u5DEE\u5F02\uFF0C\u4E0D\u4F1A\u5220\u9664\u672A\u9009\u5185\u5BB9\u3002" });
    new import_obsidian.Setting(footer).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => this.close())
    ).addButton(
      (button) => button.setButtonText("\u9884\u89C8\u5E76\u5199\u5165").setIcon("arrow-right").setCta().onClick(async () => {
        const duplicate = this.candidates.find(
          (candidate) => candidate.selected && (candidate.duplicateTargetIds?.length ?? 0) > 1
        );
        if (duplicate) {
          this.revealCaptureIssue(duplicate, "\u5B58\u5728\u591A\u4E2A\u91CD\u590D\u7684\u5DF2\u6709 Window\uFF0C\u8BF7\u5148\u68C0\u67E5\u91CD\u590D\u9879\u3002");
          return;
        }
        const firstInvalid = this.candidates.find(
          (candidate) => candidate.selected && candidate.action !== "ignore" && candidateToRecipe(candidate) == null
        );
        if (firstInvalid) {
          this.revealCaptureIssue(firstInvalid, "\u8BF7\u5148\u6DFB\u52A0\u6062\u590D\u5185\u5BB9\uFF0C\u6216\u5207\u6362\u4E3A\u201C\u4EC5\u542F\u52A8\u5E94\u7528\u201D\u3002");
          return;
        }
        const operations = this.candidates.flatMap((candidate) => {
          if (!candidate.selected || candidate.action === "ignore") return [];
          const recipe = candidateToRecipe(candidate);
          if (!recipe) return [];
          if (candidate.action === "update" && candidate.targetId) {
            return [
              {
                action: "update",
                targetId: candidate.targetId,
                recipe: { ...recipe, id: candidate.targetId }
              }
            ];
          }
          return [{ action: "add", recipe }];
        });
        if (operations.length === 0) {
          const ambiguous = this.candidates.find(
            (candidate) => candidate.browserAlternatives?.length && !candidate.browser
          );
          if (ambiguous) {
            this.revealCaptureIssue(ambiguous, "\u8BF7\u5148\u89E3\u51B3\u6D4F\u89C8\u5668\u7A97\u53E3\u5339\u914D\u6B67\u4E49\u3002");
            return;
          }
          new import_obsidian.Notice("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u8981\u6536\u5F55\u7684\u7A97\u53E3\u3002");
          return;
        }
        await this.onSubmit(operations);
        this.close();
      })
    );
  }
  renderCandidates() {
    if (!this.candidatesEl) return;
    this.candidatesEl.empty();
    this.candidateRows.clear();
    if (this.candidates.length === 0) {
      const empty = createEmptyState(
        this.candidatesEl,
        "scan-search",
        "\u5F53\u524D\u6CA1\u6709\u53EF\u6536\u5F55\u7A97\u53E3",
        "\u53EA\u663E\u793A\u5F53\u524D Space \u4E2D\u5B9E\u9645\u53EF\u89C1\u7684\u666E\u901A\u7A97\u53E3\u3002"
      );
      const actions = empty.createDiv({ cls: "workspace-bookmark-empty-actions" });
      if (this.options.onRefresh) {
        new import_obsidian.ButtonComponent(actions).setButtonText("\u91CD\u65B0\u626B\u63CF").setIcon("refresh-cw").onClick(() => void this.refreshCandidates());
      }
      if (this.options.onDiagnostics) {
        new import_obsidian.ButtonComponent(actions).setButtonText("\u7CFB\u7EDF\u8BCA\u65AD").setIcon("stethoscope").onClick(() => void this.options.onDiagnostics?.());
      }
      return;
    }
    const groups = /* @__PURE__ */ new Map();
    for (const candidate of this.candidates) {
      const group = groups.get(candidate.native.monitor) ?? [];
      group.push(candidate);
      groups.set(candidate.native.monitor, group);
    }
    for (const [monitor, candidates] of groups) {
      const group = this.candidatesEl.createDiv({ cls: "workspace-bookmark-capture-group" });
      const groupHeading = group.createDiv({ cls: "workspace-bookmark-group-heading" });
      const headingCopy = groupHeading.createDiv();
      headingCopy.createEl("h3", { text: monitorLabel(monitor) });
      headingCopy.createEl("small", { text: `${candidates.length} \u4E2A\u53EF\u89C1\u7A97\u53E3` });
      const apps = /* @__PURE__ */ new Map();
      for (const candidate of candidates) {
        const groupName = candidate.browser?.browserName ?? candidate.browserNameHint ?? candidate.native.appName;
        const appGroup = apps.get(groupName) ?? [];
        appGroup.push(candidate);
        apps.set(groupName, appGroup);
      }
      for (const [appName, appCandidates] of apps) {
        const appGroup = group.createDiv({ cls: "workspace-bookmark-app-group" });
        const appHeading = appGroup.createDiv({ cls: "workspace-bookmark-app-heading" });
        appHeading.createEl("h4", { text: appName });
        const tabCount = appCandidates.reduce(
          (total, candidate) => total + (candidate.browser?.tabs.length ?? 0),
          0
        );
        const browserConnection = appCandidates.find((candidate) => candidate.browserIdHint);
        appHeading.createSpan({
          text: browserConnection ? browserConnection.browserConnected ? `${appCandidates.length} \u4E2A\u7A97\u53E3 \xB7 ${tabCount} \u4E2A\u6807\u7B7E\u9875` : `${appCandidates.length} \u4E2A\u7A97\u53E3 \xB7 \u6865\u63A5\u79BB\u7EBF` : `${appCandidates.length} \u4E2A\u7A97\u53E3`,
          cls: `workspace-bookmark-count-badge${browserConnection && !browserConnection.browserConnected ? " is-warning" : ""}`
        });
        for (const candidate of appCandidates) this.renderCandidate(appGroup, candidate);
      }
    }
  }
  renderCandidate(container, candidate) {
    const row = container.createDiv({ cls: "workspace-bookmark-window-row" });
    this.candidateRows.set(candidate, row);
    row.toggleClass("is-selected", candidate.selected);
    const visibleAppName = candidate.browser?.browserName ?? candidate.browserNameHint ?? candidate.native.appName;
    const header = row.createDiv({ cls: "workspace-bookmark-window-row-header" });
    const canSelect = !(!candidate.browser && Boolean(candidate.browserAlternatives?.length)) && (candidate.duplicateTargetIds?.length ?? 0) <= 1;
    const selectionInput = header.createEl("input", {
      cls: "workspace-bookmark-capture-select",
      attr: {
        type: "checkbox",
        "aria-label": `\u6536\u5F55 ${visibleAppName}\uFF1A${candidate.native.title || "\u65E0\u6807\u9898"}`
      }
    });
    selectionInput.checked = candidate.selected;
    selectionInput.disabled = !canSelect;
    const identity = header.createDiv({ cls: "workspace-bookmark-window-identity" });
    const icon = identity.createSpan({ cls: "workspace-bookmark-window-icon" });
    (0, import_obsidian.setIcon)(
      icon,
      candidate.browser || candidate.browserAlternatives?.length ? "globe-2" : candidate.obsidianUrl ? "notebook-tabs" : "app-window"
    );
    const copy = identity.createDiv();
    const primary = copy.createDiv({ cls: "workspace-bookmark-window-primary" });
    primary.createSpan({ text: visibleAppName, cls: "workspace-bookmark-window-app" });
    primary.createSpan({
      text: candidate.native.title || "\u65E0\u6807\u9898",
      cls: "workspace-bookmark-window-title"
    });
    copy.createDiv({
      text: `${monitorLabel(candidate.native.monitor)} \xB7 ${humanLayout(
        frameToLayout(candidate.native.normalizedFrame)
      )}`,
      cls: "workspace-bookmark-window-secondary"
    });
    const applySelection = (selected) => {
      candidate.selected = selected;
      candidate.action = selected ? candidate.targetId ? "update" : "add" : "ignore";
      this.renderCandidates();
      this.updateCaptureSummary();
    };
    selectionInput.addEventListener("change", () => applySelection(selectionInput.checked));
    const manualContainer = row.createDiv({ cls: "workspace-bookmark-manual-url" });
    if ((candidate.duplicateTargetIds?.length ?? 0) > 1) {
      const warning2 = row.createDiv({ cls: "workspace-bookmark-capture-inline-warning" });
      const warningIcon = warning2.createSpan();
      (0, import_obsidian.setIcon)(warningIcon, "copy-x");
      warning2.createSpan({
        text: `\u68C0\u6D4B\u5230 ${candidate.duplicateTargetIds.length} \u4E2A\u91CD\u590D\u7684\u5DF2\u6709 Window\u3002`
      });
      if (this.options.onReviewDuplicates) {
        new import_obsidian.ButtonComponent(warning2).setButtonText("\u68C0\u67E5\u91CD\u590D\u9879").onClick(async () => {
          this.close();
          await this.options.onReviewDuplicates?.();
        });
      }
    }
    if (candidate.obsidianUriFallback) {
      const warning2 = row.createDiv({ cls: "workspace-bookmark-capture-inline-warning" });
      const warningIcon = warning2.createSpan();
      (0, import_obsidian.setIcon)(warningIcon, "link-2-off");
      warning2.createSpan({
        text: "\u8DEF\u5F84\u578B\u5F15\u7528\uFF0C\u91CD\u547D\u540D\u540E\u53EF\u80FD\u9700\u8981\u4FEE\u590D\u3002\u542F\u7528 Advanced URI \u53EF\u6539\u7528\u7A33\u5B9A UUID\u3002"
      });
    }
    identity.addEventListener("click", () => {
      if (canSelect) applySelection(!candidate.selected);
    });
    if (supportsBrowserOpenMode(candidate)) {
      const modes = header.createDiv({
        cls: "workspace-bookmark-window-open-modes",
        attr: { role: "group", "aria-label": "\u6D4F\u89C8\u5668\u6253\u5F00\u65B9\u5F0F" }
      });
      const options = [
        {
          value: "new-window",
          icon: "square-plus",
          tooltip: "\u59CB\u7EC8\u65B0\u5EFA\u7A97\u53E3\uFF1A\u6BCF\u6B21\u90FD\u521B\u5EFA\u72EC\u7ACB\u6D4F\u89C8\u5668\u7A97\u53E3\u3002"
        },
        {
          value: "reuse-window",
          icon: "panels-top-left",
          tooltip: "\u4F18\u5148\u590D\u7528\u7A97\u53E3\uFF1A\u5728\u53EF\u7528\u7A97\u53E3\u4E2D\u65B0\u5F00\u6240\u9009\u9875\u9762\uFF0C\u76F8\u540C\u9875\u9762\u53EF\u80FD\u91CD\u590D\u3002"
        },
        {
          value: "focus-existing",
          icon: "scan-search",
          tooltip: "\u805A\u7126\u5DF2\u6709\u9875\u9762\uFF1A\u5B8C\u6574 URL \u5DF2\u6253\u5F00\u65F6\u76F4\u63A5\u5207\u6362\uFF0C\u5426\u5219\u590D\u7528\u7A97\u53E3\u3002"
        }
      ];
      for (const option of options) {
        const button = new import_obsidian.ButtonComponent(modes).setIcon(option.icon).setTooltip(option.tooltip).onClick(() => {
          candidate.openMode = option.value;
          this.renderCandidates();
        });
        button.buttonEl.addClass("workspace-bookmark-open-mode-icon");
        button.buttonEl.setAttribute("aria-pressed", String(candidate.openMode === option.value));
        button.buttonEl.setAttribute("aria-label", option.tooltip);
        button.buttonEl.toggleClass("is-active", candidate.openMode === option.value);
      }
    }
    const tabs = row.createEl("details", { cls: "workspace-bookmark-capture-tabs" });
    tabs.open = candidate.tabsExpanded ?? false;
    tabs.addEventListener("toggle", () => {
      candidate.tabsExpanded = tabs.open;
    });
    const renderTabs = () => {
      tabs.empty();
      if (!candidate.browser) return;
      const tabsHeading = tabs.createEl("summary", {
        cls: "workspace-bookmark-tabs-heading"
      });
      tabsHeading.createSpan({ text: "\u6807\u7B7E\u9875" });
      const tabSummary = tabsHeading.createEl("small", {
        text: `${candidate.selectedTabs.size}/${candidate.browser.tabs.length}`
      });
      const tabActions = tabsHeading.createDiv({ cls: "workspace-bookmark-tab-actions" });
      const selectTabs = (mode) => {
        candidate.selectedTabs.clear();
        for (const tab of candidate.browser?.tabs ?? []) {
          if (isRestorableBrowserUrl(tab.url) && (mode === "all" || tab.active)) {
            candidate.selectedTabs.add(tab.index);
          }
        }
        renderTabs();
        this.updateCaptureSummary();
      };
      new import_obsidian.ButtonComponent(tabActions).setButtonText("\u5168\u90E8").onClick((event) => {
        event.preventDefault();
        event.stopPropagation();
        selectTabs("all");
      });
      new import_obsidian.ButtonComponent(tabActions).setButtonText("\u4EC5\u5F53\u524D").onClick((event) => {
        event.preventDefault();
        event.stopPropagation();
        selectTabs("active");
      });
      for (const tab of candidate.browser.tabs) {
        const tabRow = new import_obsidian.Setting(tabs).setName(tab.title || tab.url).setDesc(compactUrl(tab.url)).addToggle(
          (toggle) => toggle.setValue(candidate.selectedTabs.has(tab.index)).setDisabled(!isRestorableBrowserUrl(tab.url)).onChange((value) => {
            if (value) candidate.selectedTabs.add(tab.index);
            else candidate.selectedTabs.delete(tab.index);
            tabSummary.setText(
              `${candidate.selectedTabs.size}/${candidate.browser?.tabs.length ?? 0}`
            );
            this.updateCaptureSummary();
          })
        );
        tabRow.settingEl.addClass("workspace-bookmark-tab-row");
        if (!isRestorableBrowserUrl(tab.url)) {
          tabRow.settingEl.addClass("is-disabled");
          tabRow.setDesc(
            `${compactUrl(tab.url)} \xB7 ${candidate.browser.browserName} \u4E0D\u5141\u8BB8\u6062\u590D`
          );
        }
      }
    };
    if (!candidate.browser && candidate.browserAlternatives?.length) {
      new import_obsidian.Setting(row).setName("\u6D4F\u89C8\u5668\u5339\u914D\u6709\u6B67\u4E49").setDesc("\u8BF7\u9009\u62E9\u5BF9\u5E94\u7A97\u53E3\uFF0C\u63D2\u4EF6\u4E0D\u4F1A\u81EA\u52A8\u731C\u6D4B\u3002").addDropdown((dropdown) => {
        dropdown.addOption("", "\u8BF7\u9009\u62E9\u2026");
        for (const alternative of candidate.browserAlternatives ?? []) {
          const active = alternative.tabs.find((tab) => tab.active);
          dropdown.addOption(
            `${alternative.browserId}:${alternative.id}`,
            `${alternative.browserName} \xB7 ${active?.title || `\u7A97\u53E3 ${alternative.id}`}`
          );
        }
        dropdown.onChange((value) => {
          candidate.browser = candidate.browserAlternatives?.find(
            (alternative) => `${alternative.browserId}:${alternative.id}` === value
          );
          candidate.selected = Boolean(candidate.browser);
          candidate.action = candidate.selected ? "add" : "ignore";
          candidate.targetId = void 0;
          candidate.restoreMode = "open-content";
          candidate.openMode = "focus-existing";
          candidate.selectedTabs = new Set(
            candidate.browser?.tabs.filter((tab) => isRestorableBrowserUrl(tab.url)).map((tab) => tab.index) ?? []
          );
          this.renderCandidates();
          this.updateCaptureSummary();
        });
      });
    }
    renderTabs();
    if (!candidate.obsidianUrl && !candidate.browser && !candidate.browserAlternatives?.length) {
      const restoreControls = manualContainer.createDiv({
        cls: "workspace-bookmark-capture-restore-controls"
      });
      const launchOnly = restoreControls.createEl("button", {
        text: "\u4EC5\u542F\u52A8\u5E94\u7528",
        cls: "workspace-bookmark-capture-link",
        attr: { type: "button", "aria-pressed": String(candidate.restoreMode === "launch-only") }
      });
      const addUrl = restoreControls.createEl("button", {
        text: "\u6DFB\u52A0\u6062\u590D URL",
        cls: "workspace-bookmark-capture-link",
        attr: { type: "button", "aria-pressed": String(candidate.restoreMode === "open-content") }
      });
      const input = manualContainer.createEl("input", {
        cls: "workspace-bookmark-capture-url-input",
        attr: { type: "url", placeholder: "scheme://..." }
      });
      input.value = candidate.manualUrl;
      const updateRestoreMode = (mode) => {
        candidate.restoreMode = mode;
        launchOnly.toggleClass("is-active", mode === "launch-only");
        addUrl.toggleClass("is-active", mode === "open-content");
        launchOnly.setAttribute("aria-pressed", String(mode === "launch-only"));
        addUrl.setAttribute("aria-pressed", String(mode === "open-content"));
        input.toggleClass("is-visible", mode === "open-content");
        this.updateCaptureSummary();
      };
      launchOnly.addEventListener("click", () => updateRestoreMode("launch-only"));
      addUrl.addEventListener("click", () => updateRestoreMode("open-content"));
      input.addEventListener("input", () => {
        candidate.manualUrl = input.value.trim();
        this.updateCaptureSummary();
      });
      updateRestoreMode(candidate.restoreMode ?? "launch-only");
    }
    manualContainer.toggleClass("is-visible", candidate.selected);
  }
  async refreshCandidates() {
    if (this.refreshing || !this.options.onRefresh) return;
    this.refreshing = true;
    this.refreshButton?.setDisabled(true);
    this.refreshButton?.setIcon("loader-circle");
    try {
      const next = await this.options.onRefresh();
      const reconciled = reconcileCaptureSnapshot(this.candidates, next);
      this.candidates = reconciled.candidates;
      this.options.sourceNotices = reconciled.sourceNotices;
      this.options.scannedAt = reconciled.scannedAt;
      this.renderSourceNotices(reconciled.sourceNotices);
      this.renderCandidates();
      this.updateScannedAt(reconciled.scannedAt);
      this.updateCaptureSummary();
      const parts = [
        reconciled.stats.added > 0 ? `\u65B0\u589E ${reconciled.stats.added}` : "",
        reconciled.stats.removed > 0 ? `\u79FB\u9664 ${reconciled.stats.removed} \u4E2A\u5F53\u524D\u4E0D\u53EF\u89C1\u7A97\u53E3` : "",
        `\u4FDD\u7559\u9009\u62E9 ${reconciled.stats.preserved}`
      ].filter(Boolean);
      new import_obsidian.Notice(`Workspace Bookmark\uFF1A${parts.join(" \xB7 ")}`);
    } catch (cause) {
      new import_obsidian.Notice(`\u5237\u65B0\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u5F53\u524D\u9009\u62E9\uFF1A${messageFromUnknown(cause)}`, 8e3);
    } finally {
      this.refreshing = false;
      this.refreshButton?.setDisabled(false);
      this.refreshButton?.setIcon("refresh-cw");
    }
  }
  renderSourceNotices(notices) {
    if (!this.sourceNoticesEl) return;
    this.sourceNoticesEl.empty();
    for (const notice of notices) {
      const row = this.sourceNoticesEl.createEl("button", {
        cls: `clickable-icon workspace-bookmark-capture-source-icon is-${notice.tone}`,
        attr: { type: "button", "aria-label": notice.message }
      });
      row.title = notice.message;
      (0, import_obsidian.setIcon)(row, notice.tone === "warning" ? "wifi-off" : "circle-alert");
      row.addEventListener("click", () => void this.options.onDiagnostics?.());
    }
  }
  updateScannedAt(value) {
    if (!this.refreshButton) return;
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    this.refreshButton.setTooltip(
      `\u5237\u65B0\u5F53\u524D\u53EF\u89C1\u7A97\u53E3\uFF08\u4E0A\u6B21\u626B\u63CF ${date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })}\uFF09`
    );
  }
  setAllCandidates(selected) {
    for (const candidate of this.candidates) {
      const canSelect = !(!candidate.browser && Boolean(candidate.browserAlternatives?.length)) && (candidate.duplicateTargetIds?.length ?? 0) <= 1;
      candidate.selected = selected && canSelect;
      candidate.action = candidate.selected ? candidate.targetId ? "update" : "add" : "ignore";
    }
    this.renderCandidates();
    this.updateCaptureSummary();
  }
  revealCaptureIssue(candidate, message) {
    const row = this.candidateRows.get(candidate);
    row?.addClass("is-error");
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => row?.removeClass("is-error"), 2500);
    new import_obsidian.Notice(message);
  }
  updateCaptureSummary() {
    if (!this.summaryEl) return;
    const selected = this.candidates.filter(
      (candidate) => candidate.selected && candidate.action !== "ignore"
    );
    const selectedTabs = selected.reduce(
      (total, candidate) => total + candidate.selectedTabs.size,
      0
    );
    const launchOnly = selected.filter((candidate) => candidate.restoreMode === "launch-only").length;
    this.summaryEl.setText(`\u5DF2\u9009 ${selected.length} \xB7 ${selectedTabs} \u4E2A\u9875\u9762${launchOnly ? ` \xB7 ${launchOnly} \u4E2A\u4EC5\u542F\u52A8` : ""}`);
  }
};
function supportsBrowserOpenMode(candidate) {
  return candidate.selected && candidate.restoreMode === "open-content" && Boolean(candidate.browser?.tabs.some((tab) => isRestorableBrowserUrl(tab.url)));
}
var CaptureDiffModal = class extends import_obsidian.Modal {
  constructor(app, diffs, onConfirm) {
    super(app);
    this.diffs = diffs;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText("\u786E\u8BA4\u6536\u5F55\u53D8\u66F4");
    createModalIntro(
      this.contentEl,
      "\u5199\u5165\u524D\u6700\u540E\u786E\u8BA4",
      "\u53EA\u4F1A\u65B0\u589E\u6216\u66F4\u65B0\u4E0B\u5217 Window\uFF1B\u672A\u5217\u51FA\u7684 Window \u4E0E\u666E\u901A\u6B63\u6587\u4E0D\u4F1A\u5220\u9664\u3002",
      "file-diff"
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const diff of this.diffs) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      const heading = row.createDiv({ cls: "workspace-bookmark-diff-heading" });
      heading.createSpan({
        text: diff.action === "add" ? "\u65B0\u589E" : "\u66F4\u65B0",
        cls: `workspace-bookmark-chip ${diff.action === "add" ? "is-success" : "is-accent"}`
      });
      heading.createEl("h3", { text: diff.windowName });
      const changes = row.createEl("ul");
      for (const change of diff.changes) changes.createEl("li", { text: change });
    }
    const actions = new import_obsidian.Setting(createModalFooter(this.contentEl));
    actions.addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => this.close())
    );
    actions.addButton(
      (button) => button.setButtonText("\u786E\u8BA4\u5199\u5165").setCta().onClick(async () => {
        await this.onConfirm();
        this.close();
      })
    );
  }
};
var MigrationPreviewModal = class extends import_obsidian.Modal {
  constructor(app, headingChanges, onDecision) {
    super(app);
    this.headingChanges = headingChanges;
    this.onDecision = onDecision;
  }
  settled = false;
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText("\u5347\u7EA7 Workspace Markdown");
    createModalIntro(
      this.contentEl,
      "\u9700\u8981\u5148\u8FC1\u79FB\u5230 V4",
      "Capture \u53EA\u4F1A\u5411 V4 \u6587\u6863\u5199\u5165\u3002\u8FC1\u79FB\u4F1A\u4FDD\u7559 APP \u6807\u9898\u3001\u53EF\u7F16\u8F91\u8BBE\u7F6E\u3001\u6298\u53E0\u53EA\u8BFB\u4FE1\u606F\u3001\u666E\u901A\u6B63\u6587\u4E0E\u81EA\u5B9A\u4E49 frontmatter\u3002",
      "file-up",
      "warning"
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const change of this.headingChanges) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      row.createEl("strong", { text: change.from });
      row.createEl("p", { text: `\u2192 ${change.to}` });
    }
    const footer = createModalFooter(this.contentEl, "sticky");
    new import_obsidian.Setting(footer).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => {
        this.settled = true;
        this.onDecision(false);
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("\u786E\u8BA4\u8FC1\u79FB").setCta().onClick(() => {
        this.settled = true;
        this.onDecision(true);
        this.close();
      })
    );
  }
  onClose() {
    if (!this.settled) this.onDecision(false);
  }
};
var WorkspaceRepairPreviewModal = class extends import_obsidian.Modal {
  constructor(app, changes, onDecision) {
    super(app);
    this.changes = changes;
    this.onDecision = onDecision;
  }
  settled = false;
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText("\u4FEE\u590D Workspace \u5F15\u7528");
    createModalIntro(
      this.contentEl,
      `\u51C6\u5907\u4FEE\u590D ${this.changes.length} \u9879`,
      "\u53EA\u4F1A\u66F4\u65B0\u7CBE\u786E\u5339\u914D\u7684\u65E7\u8DEF\u5F84\u3001\u6587\u4EF6\u540D\u548C\u63D2\u4EF6\u7BA1\u7406\u8868\u683C\uFF1B\u666E\u901A\u6B63\u6587\u4E0E\u672A\u77E5\u5C5E\u6027\u4FDD\u6301\u4E0D\u53D8\u3002",
      "wrench",
      "warning"
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const change of this.changes) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      row.createEl("strong", { text: repairChangeLabel(change.kind) });
      row.createEl("p", { text: `${change.from} \u2192 ${change.to}` });
    }
    const footer = createModalFooter(this.contentEl, "sticky");
    new import_obsidian.Setting(footer).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => {
        this.settled = true;
        this.onDecision(false);
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("\u786E\u8BA4\u4FEE\u590D").setCta().onClick(() => {
        this.settled = true;
        this.onDecision(true);
        this.close();
      })
    );
  }
  onClose() {
    if (!this.settled) this.onDecision(false);
  }
};
var DuplicateRepairModal = class extends import_obsidian.Modal {
  constructor(app, groups, onDecision) {
    super(app);
    this.groups = groups;
    this.onDecision = onDecision;
  }
  onOpen() {
    prepareModal(this, "standard");
    this.titleEl.setText("\u68C0\u67E5\u91CD\u590D Window");
    const duplicateCount = this.groups.reduce(
      (total, group) => total + group.duplicates.length,
      0
    );
    createModalIntro(
      this.contentEl,
      `\u53D1\u73B0 ${duplicateCount} \u4E2A\u91CD\u590D\u9879`,
      "\u4EC5\u5904\u7406\u6253\u5F00\u65B9\u5F0F\u4E3A\u201C\u805A\u7126\u5DF2\u6709\u9875\u9762\u201D\u3001\u5185\u5BB9\u548C\u5E03\u5C40\u5B8C\u5168\u76F8\u540C\u7684 Window\u3002\u7B2C\u4E00\u4EFD\u4F1A\u4FDD\u7559\u3002",
      "copy-x",
      "warning"
    );
    const list = this.contentEl.createDiv({ cls: "workspace-bookmark-diff-list" });
    for (const group of this.groups) {
      const row = list.createDiv({ cls: "workspace-bookmark-diff-row" });
      row.createEl("strong", { text: `\u4FDD\u7559\uFF1A${group.keep.appName} \xB7 ${group.keep.name}` });
      row.createEl("p", {
        text: `\u79FB\u9664\uFF1A${group.duplicates.map((item) => item.name).join("\u3001")}`
      });
      row.createEl("small", {
        text: `${group.keep.contents.length} \u4E2A\u9875\u9762 \xB7 ${group.keep.monitor} \xB7 ${group.keep.layout}`
      });
    }
    const footer = createModalFooter(this.contentEl);
    new import_obsidian.Setting(footer).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => {
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText(`\u79FB\u9664 ${duplicateCount} \u4E2A\u91CD\u590D\u9879`).setCta().onClick(async () => {
        await this.onDecision(
          this.groups.flatMap((group) => group.duplicates.map((item) => item.id))
        );
        this.close();
      })
    );
  }
};
var WindowEditorModal = class extends import_obsidian.Modal {
  constructor(app, recipe, onSave) {
    super(app);
    this.onSave = onSave;
    this.draft = structuredClone(recipe);
  }
  draft;
  contentsContainer;
  errorEl;
  previewWindowEl = null;
  previewIconEl = null;
  previewNameEl = null;
  saveButton = null;
  onOpen() {
    prepareModal(this, "wide");
    this.titleEl.setText(`\u7F16\u8F91 \xB7 ${this.draft.name}`);
    createModalIntro(
      this.contentEl,
      `${this.draft.appName} \u7A97\u53E3`,
      "\u53EA\u663E\u793A\u65E5\u5E38\u9700\u8981\u7684\u8BBE\u7F6E\uFF1B\u5339\u914D\u5B57\u6BB5\u548C\u539F\u59CB\u8BED\u6CD5\u4F4D\u4E8E\u9AD8\u7EA7\u8BBE\u7F6E\u3002",
      appIconFor([this.draft.appName, this.draft.adapter])
    );
    this.errorEl = this.contentEl.createDiv({ cls: "workspace-bookmark-inline-error" });
    const form = this.contentEl.createDiv({ cls: "workspace-bookmark-editor-form" });
    const general = createFormSection(
      form,
      "\u57FA\u672C\u4FE1\u606F",
      "\u540D\u79F0\u4E0E\u6253\u5F00\u65B9\u5F0F",
      "sliders-horizontal"
    );
    this.addTextSetting(
      general,
      "\u540D\u79F0",
      "\u663E\u793A\u5728 Workspace \u4E2D\u7684\u540D\u79F0\u3002",
      this.draft.name,
      (value) => this.draft.name = value
    );
    let updateContentsVisibility = null;
    new import_obsidian.Setting(general).setName("\u6062\u590D\u65B9\u5F0F").setDesc("\u4EC5\u542F\u52A8\u5E94\u7528\u65F6\u4E0D\u9700\u8981 URL \u6216\u6807\u7B7E\u9875\u3002").addDropdown((dropdown) => {
      dropdown.addOption("open-content", "\u6062\u590D\u9875\u9762\u6216\u6587\u6863").addOption("launch-only", "\u4EC5\u542F\u52A8\u5E94\u7528").setValue(this.draft.restoreMode ?? "open-content").onChange((value) => {
        this.draft.restoreMode = value;
        if (this.draft.restoreMode === "launch-only") {
          this.draft.contents = [];
        } else if (this.draft.contents.length === 0) {
          this.draft.contents = [{
            order: 1,
            title: "",
            url: "https://",
            active: true,
            pinned: false
          }];
        }
        updateContentsVisibility?.();
        this.renderContents();
        this.updateError();
      });
    });
    let modeDropdown = null;
    new import_obsidian.Setting(general).setName("\u6253\u5F00\u65B9\u5F0F").setDesc("\u4F18\u5148\u805A\u7126\u3001\u590D\u7528\u6216\u521B\u5EFA\u7A97\u53E3\u3002").addDropdown((dropdown) => {
      modeDropdown = dropdown;
      configureModeDropdown(dropdown, this.draft);
      dropdown.onChange((value) => {
        this.draft.openMode = value;
        this.updateError();
      });
    });
    if (this.draft.adapter === "browser") {
      new import_obsidian.Setting(general).setName("\u76EE\u6807\u6D4F\u89C8\u5668").setDesc("Workspace \u4F1A\u4E25\u683C\u4F7F\u7528\u8FD9\u91CC\u6307\u5B9A\u7684\u6D4F\u89C8\u5668\uFF0C\u4E0D\u4F1A\u8DE8\u6D4F\u89C8\u5668\u66FF\u4EE3\u3002").addDropdown(
        (dropdown) => dropdown.addOption("chrome", "Google Chrome").addOption("tabbit", "Tabbit").setValue(this.draft.browserId ?? "chrome").onChange((value) => {
          this.applyBrowserIdentity(value);
          this.updateError();
        })
      );
    }
    const placement = createFormSection(
      form,
      "\u7A97\u53E3\u4F4D\u7F6E",
      "\u4F7F\u7528\u5C4F\u5E55\u6BD4\u4F8B\uFF0C\u4E0D\u4F9D\u8D56\u5206\u8FA8\u7387",
      "panel-top"
    );
    this.addDropdown(
      placement,
      "\u76EE\u6807\u5C4F\u5E55",
      this.draft.monitor,
      {
        current: "\u5F53\u524D\u5C4F\u5E55",
        main: "\u7CFB\u7EDF\u4E3B\u5C4F\u5E55",
        "built-in": "Mac \u5185\u7F6E\u5C4F\u5E55",
        "external-primary": "\u4E3B\u8981\u5916\u63A5\u5C4F"
      },
      (value) => {
        this.draft.monitor = value;
        this.updateLayoutPreview();
      }
    );
    this.addLayoutSettings(placement);
    const preview = placement.createDiv({ cls: "workspace-bookmark-layout-preview" });
    const previewHeading = preview.createDiv({ cls: "workspace-bookmark-preview-heading" });
    previewHeading.createEl("span", { text: "\u5E03\u5C40\u9884\u89C8" });
    previewHeading.createEl("small", { text: monitorLabel(this.draft.monitor) });
    const screen = preview.createDiv({ cls: "workspace-bookmark-preview-screen" });
    this.previewWindowEl = screen.createDiv({ cls: "workspace-bookmark-preview-window" });
    const previewLabel = this.previewWindowEl.createDiv();
    this.previewIconEl = previewLabel.createSpan();
    (0, import_obsidian.setIcon)(this.previewIconEl, appIconFor([this.draft.appName, this.draft.adapter]));
    this.previewNameEl = previewLabel.createSpan({ text: this.draft.name || "Window" });
    this.updateLayoutPreview();
    const contentsSection = createFormSection(
      form,
      "\u7A97\u53E3\u5185\u5BB9",
      "\u70B9\u51FB\u9875\u9762\u53EF\u7F16\u8F91\u6807\u9898\u548C\u5B8C\u6574 URL",
      "list-ordered",
      "workspace-bookmark-contents-section"
    );
    new import_obsidian.Setting(contentsSection).setName(`${this.draft.contents.length} \u4E2A\u9875\u9762`).setDesc("\u5F53\u524D\u9875\u9762\u548C\u56FA\u5B9A\u72B6\u6001\u663E\u793A\u5728\u5217\u8868\u53F3\u4FA7\u3002").addButton(
      (button) => button.setButtonText("\u65B0\u589E").setIcon("plus").onClick(() => {
        this.draft.contents.push({
          order: this.draft.contents.length + 1,
          title: "",
          url: "https://",
          active: this.draft.contents.length === 0,
          pinned: false
        });
        this.renderContents();
        this.updateError();
      })
    );
    this.contentsContainer = contentsSection.createDiv({
      cls: "workspace-bookmark-contents-list"
    });
    updateContentsVisibility = () => {
      contentsSection.toggleClass("is-hidden", this.draft.restoreMode === "launch-only");
    };
    updateContentsVisibility();
    this.renderContents();
    const advanced = form.createEl("details", {
      cls: "workspace-bookmark-advanced-settings"
    });
    advanced.createEl("summary", { text: "\u9AD8\u7EA7\u8BBE\u7F6E" });
    const advancedBody = advanced.createDiv({
      cls: "workspace-bookmark-advanced-settings-body"
    });
    const renderAdvanced = () => {
      advancedBody.empty();
      new import_obsidian.Setting(advancedBody).setName("\u9002\u914D\u5668").setDesc("\u51B3\u5B9A\u4F7F\u7528\u54EA\u79CD\u6062\u590D\u65B9\u5F0F\u3002").addDropdown((dropdown) => {
        dropdown.addOption("browser", "\u6D4F\u89C8\u5668").addOption("obsidian", "Obsidian").addOption("manual", "\u5176\u4ED6 App / \u624B\u52A8 URL").setValue(this.draft.adapter).onChange((value) => {
          this.draft.adapter = value;
          if (this.draft.adapter === "browser" && !this.draft.browserId) {
            this.draft.browserId = "chrome";
          } else if (this.draft.adapter !== "browser") {
            delete this.draft.browserId;
          }
          if (!modesForAdapter(this.draft.adapter).includes(this.draft.openMode)) {
            this.draft.openMode = modesForAdapter(this.draft.adapter)[0];
          }
          if (modeDropdown) configureModeDropdown(modeDropdown, this.draft);
          renderAdvanced();
          this.updateError();
        });
      });
      this.addTextSetting(
        advancedBody,
        "\u5E94\u7528\u540D\u79F0",
        "\u7528\u4E8E Markdown \u6807\u9898\u3002",
        this.draft.appName,
        (value) => this.draft.appName = value
      );
      this.addTextSetting(
        advancedBody,
        "Bundle ID",
        "\u7528\u4E8E\u5339\u914D\u7CFB\u7EDF App\u3002",
        this.draft.bundleId,
        (value) => this.draft.bundleId = value
      );
      this.addTextSetting(
        advancedBody,
        "\u6807\u9898\u5339\u914D",
        "\u540C\u4E00 App \u5B58\u5728\u591A\u4E2A\u7A97\u53E3\u65F6\u4F7F\u7528\u3002",
        this.draft.titleHint,
        (value) => this.draft.titleHint = value
      );
      new import_obsidian.Setting(advancedBody).setName("Space").setDesc("\u5F53\u524D\u7248\u672C\u53EA\u64CD\u4F5C\u5F53\u524D\u53EF\u89C1 Space\u3002").addDropdown(
        (dropdown) => dropdown.addOption("current", "\u5F53\u524D Space").setValue("current").setDisabled(true)
      );
      new import_obsidian.Setting(advancedBody).setName("\u539F\u59CB\u5E03\u5C40").setDesc("\u652F\u6301 left 0.5\u3001center 0.8 0.7 \u6216 frame x y w h\u3002").addText(
        (input) => input.setValue(this.draft.layout).onChange((value) => {
          this.draft.layout = value.trim();
          this.updateError();
          this.updateLayoutPreview();
        })
      );
      new import_obsidian.Setting(advancedBody).setName("Window ID").setDesc(this.draft.id);
    };
    renderAdvanced();
    advanced.addEventListener("toggle", () => {
      if (advanced.open) renderAdvanced();
    });
    const footer = createModalFooter(this.contentEl, "sticky");
    footer.createEl("small", { text: "\u53EA\u91CD\u5199\u5F53\u524D APP \u533A\u57DF\u3002" });
    new import_obsidian.Setting(footer).addButton((button) => button.setButtonText("\u53D6\u6D88").onClick(() => this.close())).addButton((button) => {
      this.saveButton = button;
      button.setButtonText("\u4FDD\u5B58").setIcon("save").setCta().onClick(async () => {
        const message = validateDraft(this.draft);
        this.errorEl.setText(message ?? "");
        if (message) return;
        this.draft.contents.forEach((item, index) => item.order = index + 1);
        await this.onSave(this.draft);
        this.close();
      });
    });
    this.updateError();
  }
  renderContents() {
    if (!this.contentsContainer) return;
    this.contentsContainer.empty();
    for (const [index, item] of this.draft.contents.entries()) {
      const details = this.contentsContainer.createEl("details", {
        cls: "workspace-bookmark-content-item"
      });
      if (!item.title || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(item.url)) details.open = true;
      const summary = details.createEl("summary", {
        cls: "workspace-bookmark-content-summary"
      });
      summary.createSpan({
        text: String(index + 1),
        cls: "workspace-bookmark-content-order"
      });
      const copy = summary.createDiv({ cls: "workspace-bookmark-content-copy" });
      const titleLabel = copy.createEl("strong", { text: item.title || "\u672A\u547D\u540D\u9875\u9762" });
      const urlLabel = copy.createEl("small", { text: compactUrl(item.url) });
      const states = summary.createDiv({ cls: "workspace-bookmark-content-states" });
      if (item.active) {
        const active = states.createSpan({ attr: { "aria-label": "\u5F53\u524D\u9875\u9762" } });
        active.title = "\u5F53\u524D\u9875\u9762";
        (0, import_obsidian.setIcon)(active, "circle-dot");
      }
      if (item.pinned) {
        const pinned = states.createSpan({ attr: { "aria-label": "\u56FA\u5B9A\u9875\u9762" } });
        pinned.title = "\u56FA\u5B9A\u9875\u9762";
        (0, import_obsidian.setIcon)(pinned, "pin");
      }
      const more = summary.createEl("button", {
        cls: "clickable-icon workspace-bookmark-icon-action",
        attr: { "aria-label": `\u7F16\u8F91 ${item.title || "\u9875\u9762"} \u7684\u64CD\u4F5C`, type: "button" }
      });
      more.title = "\u9875\u9762\u64CD\u4F5C";
      (0, import_obsidian.setIcon)(more, "more-horizontal");
      more.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const menu = new import_obsidian.Menu();
        menu.addItem(
          (entry) => entry.setTitle("\u8BBE\u4E3A\u5F53\u524D\u9875\u9762").setIcon("circle-dot").setDisabled(item.active).onClick(() => {
            this.draft.contents.forEach(
              (candidate) => candidate.active = candidate === item
            );
            this.renderContents();
            this.updateError();
          })
        );
        menu.addItem(
          (entry) => entry.setTitle(item.pinned ? "\u53D6\u6D88\u56FA\u5B9A" : "\u56FA\u5B9A\u9875\u9762").setIcon("pin").onClick(() => {
            item.pinned = !item.pinned;
            this.renderContents();
          })
        );
        menu.addSeparator();
        menu.addItem(
          (entry) => entry.setTitle("\u4E0A\u79FB").setIcon("arrow-up").setDisabled(index === 0).onClick(() => this.moveContent(index, index - 1))
        );
        menu.addItem(
          (entry) => entry.setTitle("\u4E0B\u79FB").setIcon("arrow-down").setDisabled(index === this.draft.contents.length - 1).onClick(() => this.moveContent(index, index + 1))
        );
        menu.addSeparator();
        menu.addItem(
          (entry) => entry.setTitle("\u5220\u9664").setIcon("trash-2").onClick(() => {
            this.draft.contents.splice(index, 1);
            this.renderContents();
            this.updateError();
          })
        );
        menu.showAtMouseEvent(event);
      });
      const editor = details.createDiv({ cls: "workspace-bookmark-content-editor" });
      new import_obsidian.Setting(editor).setName("\u6807\u9898").addText(
        (input) => input.setValue(item.title).onChange((value) => {
          item.title = value;
          titleLabel.setText(value || "\u672A\u547D\u540D\u9875\u9762");
        })
      );
      new import_obsidian.Setting(editor).setName("URL").addText(
        (input) => input.setValue(item.url).onChange((value) => {
          item.url = value.trim();
          urlLabel.setText(compactUrl(item.url));
          this.updateError();
        })
      );
    }
  }
  addTextSetting(container, name, description, value, onChange) {
    new import_obsidian.Setting(container).setName(name).setDesc(description).addText(
      (input) => input.setValue(value).onChange((next) => {
        onChange(next.trim());
        this.updateError();
      })
    );
  }
  addDropdown(container, name, value, options, onChange) {
    new import_obsidian.Setting(container).setName(name).addDropdown((dropdown) => {
      for (const key of Object.keys(options)) dropdown.addOption(key, options[key]);
      dropdown.setValue(value).onChange((next) => {
        onChange(next);
        this.updateError();
      });
    });
  }
  addLayoutSettings(container) {
    const supported = [
      "left",
      "right",
      "top",
      "bottom",
      "center",
      "frame",
      "full",
      "keep"
    ];
    const original = this.draft.layout.trim().split(/\s+/);
    let kind = supported.includes(original[0]) ? original[0] : "full";
    let values = original.slice(1).map(Number);
    const defaults = {
      left: [0.5],
      right: [0.5],
      top: [0.5],
      bottom: [0.5],
      center: [0.8, 0.8],
      frame: [0, 0, 0.8, 0.8],
      full: [],
      keep: []
    };
    const count = {
      left: 1,
      right: 1,
      top: 1,
      bottom: 1,
      center: 2,
      frame: 4,
      full: 0,
      keep: 0
    };
    const editor = container.createDiv({ cls: "workspace-bookmark-layout-editor" });
    const presets = editor.createDiv({ cls: "workspace-bookmark-layout-presets" });
    const valuesEl = editor.createDiv({ cls: "workspace-bookmark-layout-values" });
    const more = editor.createEl("details", {
      cls: "workspace-bookmark-layout-more"
    });
    more.createEl("summary", { text: "\u66F4\u591A\u5E03\u5C40" });
    const moreButtons = more.createDiv({
      cls: "workspace-bookmark-layout-presets"
    });
    const buttons = /* @__PURE__ */ new Map();
    const updateDraft = () => {
      this.draft.layout = [kind, ...values.slice(0, count[kind])].join(" ");
      this.updateError();
      this.updateLayoutPreview();
    };
    const selectKind = (next) => {
      kind = next;
      values = [...defaults[kind]];
      if (["top", "bottom", "frame", "keep"].includes(kind)) more.open = true;
      renderValues();
    };
    const addPreset = (target, value, label) => {
      const button = target.createEl("button", {
        text: label,
        cls: "workspace-bookmark-layout-preset",
        attr: { type: "button" }
      });
      button.addEventListener("click", () => selectKind(value));
      buttons.set(value, button);
    };
    addPreset(presets, "left", "\u5DE6\u4FA7");
    addPreset(presets, "right", "\u53F3\u4FA7");
    addPreset(presets, "full", "\u5168\u5C4F");
    addPreset(presets, "center", "\u5C45\u4E2D");
    addPreset(moreButtons, "top", "\u9876\u90E8");
    addPreset(moreButtons, "bottom", "\u5E95\u90E8");
    addPreset(moreButtons, "keep", "\u4FDD\u6301");
    addPreset(moreButtons, "frame", "\u81EA\u5B9A\u4E49");
    const renderValues = () => {
      valuesEl.empty();
      const desired = count[kind];
      if (values.length !== desired || values.some((value) => !Number.isFinite(value))) {
        values = [...defaults[kind]];
      }
      for (const [value, button] of buttons) {
        button.toggleClass("is-active", value === kind);
        button.setAttribute("aria-pressed", String(value === kind));
      }
      const labels = kind === "center" ? ["\u5BBD\u5EA6", "\u9AD8\u5EA6"] : kind === "frame" ? ["X", "Y", "\u5BBD\u5EA6", "\u9AD8\u5EA6"] : ["\u6BD4\u4F8B"];
      for (let index = 0; index < desired; index += 1) {
        const field = valuesEl.createDiv({
          cls: "workspace-bookmark-layout-value"
        });
        field.createEl("label", { text: labels[index] ?? `\u6570\u503C ${index + 1}` });
        if (kind !== "frame") {
          const range = field.createEl("input", { type: "range" });
          range.min = "0.1";
          range.max = "1";
          range.step = "0.05";
          range.value = String(values[index] ?? defaults[kind][index] ?? 0.5);
          const number = field.createEl("input", { type: "number" });
          number.min = "0.1";
          number.max = "1";
          number.step = "0.05";
          number.value = range.value;
          const sync = (next) => {
            values[index] = Number(next);
            range.value = next;
            number.value = next;
            updateDraft();
          };
          range.addEventListener("input", () => sync(range.value));
          number.addEventListener("input", () => sync(number.value));
        } else {
          const number = field.createEl("input", { type: "number" });
          number.min = index < 2 ? "0" : "0.01";
          number.max = "1";
          number.step = "0.05";
          number.value = String(values[index] ?? defaults[kind][index] ?? 0.5);
          number.addEventListener("input", () => {
            values[index] = Number(number.value);
            updateDraft();
          });
        }
      }
      if (desired === 0) {
        valuesEl.createEl("small", {
          text: kind === "keep" ? "\u4FDD\u7559\u7A97\u53E3\u5F53\u524D\u4F4D\u7F6E\u3002" : "\u586B\u6EE1\u5C4F\u5E55\u53EF\u7528\u533A\u57DF\u3002"
        });
      }
      updateDraft();
    };
    if (["top", "bottom", "frame", "keep"].includes(kind)) more.open = true;
    renderValues();
  }
  moveContent(from, to) {
    if (to < 0 || to >= this.draft.contents.length) return;
    const [item] = this.draft.contents.splice(from, 1);
    if (item) this.draft.contents.splice(to, 0, item);
    this.renderContents();
  }
  updateError() {
    if (!this.errorEl) return;
    const error2 = validateDraft(this.draft);
    this.errorEl.setText(error2 ?? "");
    this.errorEl.toggleClass("is-visible", Boolean(error2));
    this.saveButton?.setDisabled(Boolean(error2));
    if (this.previewIconEl) {
      this.previewIconEl.empty();
      (0, import_obsidian.setIcon)(this.previewIconEl, appIconFor([this.draft.appName, this.draft.adapter]));
    }
    this.previewNameEl?.setText(this.draft.name || "Window");
  }
  updateLayoutPreview() {
    if (!this.previewWindowEl) return;
    const frame = layoutPreviewFrame(this.draft.layout);
    this.previewWindowEl.style.left = `${frame.x * 100}%`;
    this.previewWindowEl.style.top = `${frame.y * 100}%`;
    this.previewWindowEl.style.width = `${frame.width * 100}%`;
    this.previewWindowEl.style.height = `${frame.height * 100}%`;
    this.previewWindowEl.toggleClass("is-keep", this.draft.layout === "keep");
    const heading = this.previewWindowEl.closest(".workspace-bookmark-layout-preview")?.querySelector(".workspace-bookmark-preview-heading small");
    if (heading) heading.textContent = monitorLabel(this.draft.monitor);
  }
  applyBrowserIdentity(browserId) {
    this.draft.browserId = browserId;
    if (browserId === "chrome") {
      this.draft.appName = "Google Chrome";
      this.draft.bundleId = "com.google.Chrome";
    } else {
      this.draft.appName = "Tabbit";
      this.draft.bundleId = "com.tabbit-ai.Tabbit";
    }
    this.updateError();
  }
};
function validateDraft(recipe) {
  if (!recipe.name.trim()) return "Window \u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002";
  if (!recipe.bundleId.trim()) return "Bundle ID \u4E0D\u80FD\u4E3A\u7A7A\u3002";
  if (!recipe.titleHint.trim()) return "Title hint \u4E0D\u80FD\u4E3A\u7A7A\u3002";
  if (!recipe.appName.trim()) return "\u5E94\u7528\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\u3002";
  if (recipe.adapter === "browser" && !recipe.browserId) return "\u6D4F\u89C8\u5668 Window \u5FC5\u987B\u9009\u62E9 Browser ID\u3002";
  if (!modesForAdapter(recipe.adapter).includes(recipe.openMode)) {
    return `${recipe.adapter} \u4E0D\u652F\u6301 ${recipe.openMode}\u3002`;
  }
  const layoutError = validateLayout(recipe.layout);
  if (layoutError) return layoutError;
  const restoreMode = recipe.restoreMode ?? "open-content";
  if (restoreMode === "launch-only") {
    return recipe.contents.length === 0 ? null : "\u4EC5\u542F\u52A8\u5E94\u7528\u65F6\u4E0D\u80FD\u5305\u542B\u6253\u5F00\u5185\u5BB9\u3002";
  }
  if (recipe.contents.length === 0) return "Contents \u81F3\u5C11\u9700\u8981\u4E00\u9879\u3002";
  if (recipe.contents.filter((item) => item.active).length > 1) return "\u6700\u591A\u53EA\u80FD\u6709\u4E00\u9879\u6FC0\u6D3B\u3002";
  if (recipe.contents.some((item) => !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(item.url))) {
    return "\u6BCF\u4E2A URL \u90FD\u5FC5\u987B\u5305\u542B Scheme\u3002";
  }
  return null;
}
function modesForAdapter(adapter) {
  const modes = {
    browser: ["new-window", "reuse-window", "focus-existing"],
    obsidian: ["reuse-window", "focus-existing", "app-default"],
    manual: ["app-default"]
  };
  return modes[adapter];
}
function configureModeDropdown(dropdown, recipe) {
  dropdown.selectEl.empty();
  const labels = {
    "new-window": "\u59CB\u7EC8\u65B0\u5EFA\u7A97\u53E3",
    "reuse-window": "\u4F18\u5148\u590D\u7528\u7A97\u53E3",
    "focus-existing": "\u4F18\u5148\u805A\u7126\u5DF2\u6709\u5185\u5BB9",
    "app-default": "\u4EA4\u7ED9 App \u51B3\u5B9A"
  };
  for (const mode of modesForAdapter(recipe.adapter)) dropdown.addOption(mode, labels[mode]);
  dropdown.setValue(recipe.openMode);
}
function repairChangeLabel(kind) {
  const labels = {
    "workspace-name": "Workspace \u540D\u79F0",
    "window-name": "Window \u540D\u79F0",
    "title-hint": "\u6807\u9898\u5339\u914D",
    "content-title": "\u9875\u9762\u6807\u9898",
    uri: "Obsidian URI",
    format: "Markdown \u8868\u683C",
    uuid: "Advanced URI UUID"
  };
  return labels[kind];
}
function prepareModal(modal, size) {
  modal.modalEl.addClass("workspace-bookmark-modal");
  modal.modalEl.addClass(`workspace-bookmark-modal-${size}`);
  modal.contentEl.addClass("workspace-bookmark-modal-content");
}
function createModalIntro(container, eyebrow, description, iconName, tone = "neutral") {
  const intro = container.createDiv({
    cls: `workspace-bookmark-modal-intro is-${tone}`
  });
  const icon = intro.createDiv({ cls: "workspace-bookmark-modal-intro-icon" });
  (0, import_obsidian.setIcon)(icon, iconName);
  const copy = intro.createDiv({ cls: "workspace-bookmark-modal-intro-copy" });
  copy.createEl("strong", { text: eyebrow });
  copy.createEl("p", { text: description });
  return intro;
}
function createModalFooter(container, _variant) {
  let body = container.querySelector(
    ":scope > .workspace-bookmark-modal-body"
  );
  if (!body) {
    body = document.createElement("div");
    body.className = "workspace-bookmark-modal-body";
    const existing = Array.from(container.children);
    container.appendChild(body);
    for (const child of existing) body.appendChild(child);
  }
  const footer = container.createDiv({ cls: "workspace-bookmark-modal-footer" });
  return footer;
}
function createEmptyState(container, iconName, title, description) {
  const empty = container.createDiv({ cls: "workspace-bookmark-empty-state" });
  const icon = empty.createDiv();
  (0, import_obsidian.setIcon)(icon, iconName);
  empty.createEl("strong", { text: title });
  empty.createEl("p", { text: description });
  return empty;
}
function messageFromUnknown(cause) {
  return cause instanceof Error ? cause.message : String(cause);
}
function createLibrarySection(container, title, iconName) {
  const section = container.createDiv({ cls: "workspace-bookmark-library-section" });
  const heading = section.createDiv({ cls: "workspace-bookmark-section-heading" });
  const icon = heading.createSpan();
  (0, import_obsidian.setIcon)(icon, iconName);
  heading.createEl("h3", { text: title });
  return section.createDiv({ cls: "workspace-bookmark-workspace-list" });
}
function createFormSection(container, title, description, iconName, extraClass) {
  const section = container.createDiv({
    cls: `workspace-bookmark-form-section${extraClass ? ` ${extraClass}` : ""}`
  });
  const heading = section.createDiv({ cls: "workspace-bookmark-form-section-heading" });
  const icon = heading.createSpan();
  (0, import_obsidian.setIcon)(icon, iconName);
  const copy = heading.createDiv();
  copy.createEl("h3", { text: title });
  copy.createEl("small", { text: description });
  return section;
}
function appIconFor(apps) {
  if (apps.some((app) => /chrome|tabbit|browser/i.test(app))) return "globe-2";
  if (apps.some((app) => /obsidian/i.test(app))) return "notebook-tabs";
  return "app-window";
}
function appLabel(app) {
  const labels = {
    browser: "\u6D4F\u89C8\u5668",
    chrome: "Google Chrome",
    tabbit: "Tabbit",
    obsidian: "Obsidian",
    manual: "\u5176\u4ED6 App"
  };
  return labels[app] ?? app;
}
function monitorLabel(monitor) {
  const labels = {
    current: "\u5F53\u524D\u5C4F\u5E55",
    main: "\u7CFB\u7EDF\u4E3B\u5C4F\u5E55",
    "built-in": "Mac \u5185\u7F6E\u5C4F\u5E55",
    "external-primary": "\u4E3B\u8981\u5916\u63A5\u5C4F"
  };
  return labels[monitor] ?? monitor;
}
function humanLayout(layout) {
  const [kind = "full", ...values] = layout.split(/\s+/);
  const labels = {
    left: "\u5DE6\u4FA7",
    right: "\u53F3\u4FA7",
    top: "\u4E0A\u4FA7",
    bottom: "\u4E0B\u4FA7",
    center: "\u5C45\u4E2D",
    frame: "\u81EA\u5B9A\u4E49",
    full: "\u586B\u6EE1",
    keep: "\u4FDD\u6301\u4F4D\u7F6E"
  };
  return [labels[kind] ?? kind, ...values].join(" ");
}
function compactUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname.replace(/^www\./, "");
    }
    return `${url.protocol.replace(/:$/, "")}://`;
  } catch {
    const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):/.exec(value)?.[1];
    return scheme ? `${scheme}://` : value || "\u7F3A\u5C11 URL";
  }
}
function relativeTime(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "\u672A\u77E5";
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 6e4);
  if (minutes < 1) return "\u521A\u521A";
  if (minutes < 60) return `${minutes} \u5206\u949F\u524D`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} \u5C0F\u65F6\u524D`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} \u5929\u524D`;
  return new Date(timestamp).toLocaleDateString("zh-CN");
}
function layoutPreviewFrame(layout) {
  const [kind, ...tokens] = layout.trim().split(/\s+/);
  const values = tokens.map(Number);
  switch (kind) {
    case "left":
      return { x: 0, y: 0, width: values[0] ?? 0.5, height: 1 };
    case "right": {
      const width = values[0] ?? 0.5;
      return { x: 1 - width, y: 0, width, height: 1 };
    }
    case "top":
      return { x: 0, y: 0, width: 1, height: values[0] ?? 0.5 };
    case "bottom": {
      const height = values[0] ?? 0.5;
      return { x: 0, y: 1 - height, width: 1, height };
    }
    case "center": {
      const width = values[0] ?? 0.8;
      const height = values[1] ?? 0.8;
      return {
        x: (1 - width) / 2,
        y: (1 - height) / 2,
        width,
        height
      };
    }
    case "frame":
      return {
        x: values[0] ?? 0,
        y: values[1] ?? 0,
        width: values[2] ?? 0.8,
        height: values[3] ?? 0.8
      };
    case "keep":
      return { x: 0.15, y: 0.16, width: 0.7, height: 0.68 };
    default:
      return { x: 0, y: 0, width: 1, height: 1 };
  }
}

// src/merge.ts
function captureTargetMatches(captured, existing) {
  const key = captureRecipeKey(captured);
  return existing.filter((candidate) => captureRecipeKey(candidate) === key);
}
function buildCaptureDiffs(operations, existing) {
  const byId = new Map(existing.map((recipe) => [recipe.id, recipe]));
  return operations.map((operation) => {
    if (operation.action === "add") {
      return {
        action: "add",
        windowName: operation.recipe.name,
        changes: [
          `\u65B0\u589E ${operation.recipe.contents.length} \u9879 Contents`,
          `${operation.recipe.monitor} \xB7 ${operation.recipe.layout}`
        ]
      };
    }
    const previous = byId.get(operation.targetId);
    return {
      action: "update",
      windowName: previous?.name ?? operation.recipe.name,
      changes: previous ? describeRecipeChanges(previous, operation.recipe) : ["\u76EE\u6807 Window \u5DF2\u4E0D\u5B58\u5728\uFF0C\u4FDD\u5B58\u65F6\u5C06\u505C\u6B62\u3002"]
    };
  });
}
function applyCaptureOperations(source, parsed, operations) {
  const usedHeadings = new Set(
    (parsed.workspace?.windows ?? []).map((recipe) => headingKey(recipe))
  );
  const prepared = operations.map((operation) => {
    if (operation.action === "update") {
      const previous = parsed.workspace?.windows.find(
        (recipe2) => recipe2.id === operation.targetId
      );
      if (previous) usedHeadings.delete(headingKey(previous));
    }
    const recipe = structuredClone(operation.recipe);
    const originalName = recipe.name;
    let suffix = 2;
    while (usedHeadings.has(headingKey(recipe))) {
      recipe.name = `${originalName}\uFF08${suffix}\uFF09`;
      suffix += 1;
    }
    usedHeadings.add(headingKey(recipe));
    return { ...operation, recipe };
  });
  const updateById = new Map(
    prepared.filter(
      (operation) => operation.action === "update"
    ).map((operation) => [
      operation.targetId,
      { ...operation.recipe, id: operation.targetId }
    ])
  );
  const sections = parsed.sections.filter(
    (section) => section.recipe != null && updateById.has(section.recipe.id)
  ).sort((left, right) => right.start - left.start);
  if (sections.length !== updateById.size) {
    throw new Error("\u4E00\u4E2A\u6216\u591A\u4E2A\u5F85\u66F4\u65B0 Window \u5DF2\u4E0D\u5B58\u5728\u3002");
  }
  let result = source;
  for (const section of sections) {
    result = replaceWindowSection(
      result,
      section,
      updateById.get(section.recipe.id)
    );
  }
  for (const operation of prepared) {
    if (operation.action === "add") {
      result = replaceWindowSection(result, null, operation.recipe);
    }
  }
  return result;
}
function headingKey(recipe) {
  return `${recipe.appName}\0${recipe.name}`;
}
function targetSectionsChanged(originalSource, original, currentSource, current, targetIds) {
  for (const id of targetIds) {
    const before = sectionForId(original, id);
    const after = sectionForId(current, id);
    if (!before || !after) return true;
    if (sectionText(originalSource, before) !== sectionText(currentSource, after)) {
      return true;
    }
  }
  return false;
}
function describeRecipeChanges(previous, next) {
  const changes = [];
  const fields = [
    ["\u540D\u79F0", previous.name, next.name],
    ["App", previous.appName, next.appName],
    ["\u9002\u914D\u5668", previous.adapter, next.adapter],
    ["Bundle ID", previous.bundleId, next.bundleId],
    ["Title hint", previous.titleHint, next.titleHint],
    ["Open mode", previous.openMode, next.openMode],
    ["Restore mode", previous.restoreMode ?? "open-content", next.restoreMode ?? "open-content"],
    ["Monitor", previous.monitor, next.monitor],
    ["Layout", previous.layout, next.layout]
  ];
  for (const [label, before, after] of fields) {
    if (before !== after) changes.push(`${label}\uFF1A${before} \u2192 ${after}`);
  }
  const previousUrls = previous.contents.map((item) => item.url);
  const nextUrls = next.contents.map((item) => item.url);
  for (const url of nextUrls.filter((url2) => !previousUrls.includes(url2))) {
    changes.push(`\u65B0\u589E URL\uFF1A${url}`);
  }
  for (const url of previousUrls.filter((url2) => !nextUrls.includes(url2))) {
    changes.push(`\u79FB\u9664 URL\uFF1A${url}`);
  }
  if (arraysEqual([...previousUrls].sort(), [...nextUrls].sort()) && !arraysEqual(previousUrls, nextUrls)) {
    changes.push("Contents \u987A\u5E8F\u5DF2\u53D8\u5316");
  }
  const previousActive = previous.contents.find((item) => item.active)?.url ?? "";
  const nextActive = next.contents.find((item) => item.active)?.url ?? "";
  if (previousActive !== nextActive) {
    changes.push(`\u6FC0\u6D3B\u9879\uFF1A${previousActive || "\u65E0"} \u2192 ${nextActive || "\u65E0"}`);
  }
  const previousPinned = previous.contents.filter((item) => item.pinned).map((item) => item.url).sort();
  const nextPinned = next.contents.filter((item) => item.pinned).map((item) => item.url).sort();
  if (!arraysEqual(previousPinned, nextPinned)) changes.push("\u56FA\u5B9A\u72B6\u6001\u5DF2\u53D8\u5316");
  return changes.length > 0 ? changes : ["\u6CA1\u6709\u68C0\u6D4B\u5230\u53D8\u5316"];
}
function sectionForId(parsed, id) {
  return parsed.sections.find((section) => section.recipe?.id === id);
}
function sectionText(source, section) {
  const normalized = source.replace(/\r\n/g, "\n");
  return normalized.slice(section.start, section.end);
}
function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

// src/native.ts
var import_node_child_process = require("node:child_process");
var NativeClient = class {
  constructor(executable) {
    this.executable = executable;
  }
  doctor() {
    return this.json(["doctor", "--json"]);
  }
  scan() {
    return this.json(["scan", "--onscreen-only", "--json"]);
  }
  plan(request) {
    return this.json(["plan", "--stdin"], request);
  }
  browserStatus() {
    return this.retryableJson(["browser", "status", "--json"]);
  }
  browserSnapshot() {
    return this.retryableJson(["browser", "snapshot", "--json"]);
  }
  browserRestore(request) {
    return this.json(["browser", "restore", "--stdin"], request);
  }
  arrange(request) {
    return this.json(["arrange", "--stdin"], request);
  }
  ensureApps(request) {
    return this.json(["ensure-apps", "--stdin"], request);
  }
  json(args, stdin) {
    return new Promise((resolve) => {
      const child = (0, import_node_child_process.execFile)(
        this.executable,
        args,
        {
          encoding: "utf8",
          maxBuffer: 4 * 1024 * 1024,
          timeout: 3e4
        },
        (processError, stdout, stderr) => {
          const text = stdout.trim();
          if (text) {
            try {
              resolve(localizeCommandResult(JSON.parse(text)));
              return;
            } catch {
            }
          }
          const code = processError ? "NATIVE_COMMAND_FAILED" : "NATIVE_INVALID_RESPONSE";
          resolve({
            ok: false,
            error: {
              code,
              message: friendlyNativeError(
                code,
                stderr.trim() || processError?.message || "",
                this.executable
              ),
              recoverable: true,
              details: { args, executable: this.executable }
            }
          });
        }
      );
      if (stdin !== void 0) {
        child.stdin?.end(JSON.stringify(stdin));
      }
    });
  }
  async retryableJson(args, stdin) {
    const delays = [0, 450, 1200];
    let result;
    for (const delay of delays) {
      if (delay > 0) await wait(delay);
      result = await this.json(args, stdin);
      if (result.ok || !isTransientBridgeError(result.error?.code)) return result;
    }
    return result ?? {
      ok: false,
      error: {
        code: "BRIDGE_UNAVAILABLE",
        message: bridgeUnavailableMessage(),
        recoverable: true
      }
    };
  }
};
function isTransientBridgeError(code) {
  return code === "BRIDGE_UNAVAILABLE" || code === "BRIDGE_TIMEOUT" || code === "NATIVE_COMMAND_FAILED";
}
function friendlyNativeError(code, raw, executable) {
  if (/ENOENT|No such file or directory/i.test(raw)) {
    return `\u627E\u4E0D\u5230 workspacectl\uFF08${executable}\uFF09\u3002\u8BF7\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u9009\u62E9\u7F16\u8BD1\u540E\u7684\u7EDD\u5BF9\u8DEF\u5F84\u3002`;
  }
  if (/EACCES|permission denied/i.test(raw)) {
    return `\u65E0\u6CD5\u6267\u884C workspacectl\uFF08${executable}\uFF09\u3002\u8BF7\u68C0\u67E5\u6587\u4EF6\u6743\u9650\u3002`;
  }
  if (/timed out|ETIMEDOUT/i.test(raw)) {
    return "\u539F\u751F\u63A7\u5236\u5668\u54CD\u5E94\u8D85\u65F6\u3002\u8BF7\u8FD0\u884C\u7CFB\u7EDF\u8BCA\u65AD\u540E\u91CD\u8BD5\u3002";
  }
  if (code === "NATIVE_INVALID_RESPONSE") {
    return "workspacectl \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u6570\u636E\u3002\u8BF7\u91CD\u65B0\u6784\u5EFA\u539F\u751F\u7EC4\u4EF6\u5E76\u68C0\u67E5\u7248\u672C\u3002";
  }
  return raw || "workspacectl \u672A\u80FD\u6B63\u5E38\u8FD0\u884C\u3002";
}
function bridgeUnavailableMessage() {
  return "\u6D4F\u89C8\u5668\u6865\u63A5\u672A\u8FDE\u63A5\u3002\u8BF7\u4FDD\u6301\u76EE\u6807\u6D4F\u89C8\u5668\u8FD0\u884C\uFF0C\u91CD\u65B0\u52A0\u8F7D Workspace Bookmark \u6269\u5C55\uFF0C\u7136\u540E\u91CD\u8BD5\u3002";
}
function localizeCommandResult(result) {
  if (result.ok || !result.error) return result;
  const localized = {
    BRIDGE_UNAVAILABLE: bridgeUnavailableMessage(),
    BRIDGE_TIMEOUT: "\u6D4F\u89C8\u5668\u6865\u63A5\u54CD\u5E94\u8D85\u65F6\u3002\u8BF7\u786E\u8BA4\u76EE\u6807\u6D4F\u89C8\u5668\u6B63\u5728\u8FD0\u884C\u5E76\u91CD\u65B0\u52A0\u8F7D\u6269\u5C55\u3002",
    BRIDGE_FAILED: "\u6D4F\u89C8\u5668\u6865\u63A5\u64CD\u4F5C\u5931\u8D25\u3002\u8BF7\u6253\u5F00\u7CFB\u7EDF\u8BCA\u65AD\u67E5\u770B\u5404\u6D4F\u89C8\u5668\u8FDE\u63A5\u72B6\u6001\u3002",
    PROTOCOL_VERSION_MISMATCH: "\u6D4F\u89C8\u5668\u6269\u5C55\u4E0E\u672C\u5730\u7EC4\u4EF6\u7684\u534F\u8BAE\u7248\u672C\u4E0D\u4E00\u81F4\u3002\u8BF7\u91CD\u65B0\u6784\u5EFA\u5E76\u91CD\u65B0\u52A0\u8F7D\u6D4F\u89C8\u5668\u6269\u5C55\u3002",
    BRIDGE_REQUEST_INVALID: "\u6D4F\u89C8\u5668\u6865\u63A5\u6536\u5230\u4E86\u65E0\u6548\u8BF7\u6C42\u3002\u8BF7\u91CD\u65B0\u6784\u5EFA\u6240\u6709\u7EC4\u4EF6\u540E\u91CD\u8BD5\u3002"
  };
  const message = localized[result.error.code];
  if (!message) return result;
  return {
    ...result,
    error: {
      ...result.error,
      message,
      details: {
        ...result.error.details,
        nativeMessage: result.error.message
      }
    }
  };
}
function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

// src/restore.ts
function partitionRestoreReadiness(windows, planItems, browserSources) {
  const planById = new Map(planItems.map((item) => [item.id, item]));
  const browserConnection = new Map(
    browserSources.map((source) => [source.browserId, source.connected])
  );
  const runnable = [];
  const issues = [];
  for (const window2 of windows) {
    const planned = planById.get(window2.id);
    if (!planned?.ok) {
      issues.push({
        windowId: window2.id,
        windowName: window2.name,
        message: planned?.message ?? "\u672A\u83B7\u5F97\u9884\u6267\u884C\u7ED3\u679C\u3002"
      });
      continue;
    }
    if (window2.adapter === "browser" && (window2.restoreMode ?? "open-content") === "open-content" && (!window2.browserId || browserConnection.get(window2.browserId) !== true)) {
      const alternatives = [...browserConnection.entries()].filter(
        ([browserId, connected]) => connected && browserId !== window2.browserId
      ).map(([browserId]) => browserName(browserId));
      issues.push({
        windowId: window2.id,
        windowName: window2.name,
        message: `\u6B64 Window \u6307\u5B9A\u4F7F\u7528 ${window2.appName}\uFF0C\u4F46\u5176 Browser Bridge \u672A\u8FDE\u63A5\u3002` + (alternatives.length > 0 ? ` ${alternatives.join("\u3001")} \u5728\u7EBF\u4E5F\u4E0D\u4F1A\u66FF\u4EE3 ${window2.appName}\u3002` : "")
      });
      continue;
    }
    runnable.push(window2);
  }
  return { runnable, issues };
}
function browserName(browserId) {
  return browserId === "tabbit" ? "Tabbit" : "Google Chrome";
}

// src/recent.ts
function updateRecentWorkspaces(current, workspaceId, lastOpenedAt, limit = 20) {
  return [
    { workspaceId, lastOpenedAt },
    ...current.filter((item) => item.workspaceId !== workspaceId)
  ].slice(0, limit);
}

// src/scope.ts
function isPathInManagedFolder(path, managedFolder) {
  const folder = `${managedFolder.trim().replace(/^\/+|\/+$/g, "")}/`;
  return path.endsWith(".md") && path.startsWith(folder);
}
function isStableId(value, prefix) {
  return typeof value === "string" && new RegExp(`^${prefix}[0-9A-HJKMNP-TV-Z]{26}$`).test(value);
}

// src/settings.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  managedFolder: "Workspace/",
  workspacectlPath: "workspacectl",
  trustedSchemes: [],
  recentWorkspaces: []
};
function normalizeManagedFolder(value) {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `${normalized}/` : "Workspace/";
}
var WorkspaceBookmarkSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, owner) {
    super(app, owner);
    this.owner = owner;
  }
  display() {
    this.containerEl.empty();
    this.containerEl.addClass("workspace-bookmark-settings");
    const hero = this.containerEl.createDiv({ cls: "workspace-bookmark-settings-hero" });
    const heroIcon = hero.createDiv();
    (0, import_obsidian2.setIcon)(heroIcon, "bookmark-check");
    const heroCopy = hero.createDiv();
    heroCopy.createEl("h2", { text: "Workspace Bookmark" });
    heroCopy.createEl("p", {
      text: "\u7528 Markdown \u4FDD\u5B58\u7A97\u53E3\u5185\u5BB9\uFF0C\u7528\u672C\u673A\u63A7\u5236\u5668\u6062\u590D\u5E03\u5C40\u3002\u6240\u6709\u6570\u636E\u53EA\u4FDD\u7559\u5728\u672C\u5730\u3002"
    });
    const basics = createSettingsSection(
      this.containerEl,
      "Workspace \u6570\u636E",
      "\u63A7\u5236\u54EA\u4E9B Markdown \u5C5E\u4E8E\u53EF\u6267\u884C Workspace"
    );
    new import_obsidian2.Setting(basics).setName("Workspace \u6587\u4EF6\u5939").setDesc("\u4EC5\u8BE5\u76EE\u5F55\u53CA\u5B50\u76EE\u5F55\u4E2D type: workspace \u7684 Markdown \u53EF\u6267\u884C\u3002").addText(
      (text) => text.setPlaceholder("Workspace/").setValue(this.owner.settings.managedFolder).onChange(async (value) => {
        this.owner.settings.managedFolder = normalizeManagedFolder(value);
        await this.owner.saveSettings();
      })
    );
    const runtime = createSettingsSection(
      this.containerEl,
      "\u672C\u673A\u8FD0\u884C\u73AF\u5883",
      "\u539F\u751F\u63A7\u5236\u5668\u8D1F\u8D23\u626B\u63CF\u3001\u5339\u914D\u548C\u6392\u5217 macOS \u7A97\u53E3"
    );
    new import_obsidian2.Setting(runtime).setName("workspacectl \u8DEF\u5F84").setDesc("\u53EF\u6267\u884C\u6587\u4EF6\u540D\u6216\u7EDD\u5BF9\u8DEF\u5F84\u3002\u4E0D\u4F1A\u901A\u8FC7 Shell \u6267\u884C\u3002").addText(
      (text) => text.setValue(this.owner.settings.workspacectlPath).onChange(async (value) => {
        this.owner.settings.workspacectlPath = value.trim() || "workspacectl";
        await this.owner.saveSettings();
      })
    );
    new import_obsidian2.Setting(runtime).setName("\u53EF\u4FE1 URL Scheme").setDesc("\u9017\u53F7\u5206\u9694\u3002http\u3001https\u3001obsidian \u4E0E file \u5DF2\u5185\u7F6E\uFF0C\u65E0\u9700\u586B\u5199\u3002").addText(
      (text) => text.setPlaceholder("notion, vscode").setValue(this.owner.settings.trustedSchemes.join(", ")).onChange(async (value) => {
        this.owner.settings.trustedSchemes = [
          ...new Set(
            value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean)
          )
        ];
        await this.owner.saveSettings();
      })
    );
    const diagnostics = createSettingsSection(
      this.containerEl,
      "\u8BCA\u65AD\u4E0E\u4FEE\u590D",
      "\u5982\u679C\u6355\u83B7\u6216\u6062\u590D\u6CA1\u6709\u53CD\u5E94\uFF0C\u8BF7\u5148\u8FD0\u884C\u8FD9\u91CC\u7684\u8BCA\u65AD"
    );
    const checklist = diagnostics.createDiv({ cls: "workspace-bookmark-settings-checklist" });
    for (const [icon, text] of [
      ["terminal", "workspacectl \u5DF2\u6784\u5EFA\uFF0C\u4E14\u4E0A\u65B9\u8DEF\u5F84\u6B63\u786E"],
      ["accessibility", "macOS \u5DF2\u5411 workspacectl \u6388\u4E88\u8F85\u52A9\u529F\u80FD\u6743\u9650"],
      ["chrome", "Chrome \u6269\u5C55\u5DF2\u52A0\u8F7D\uFF0C\u5E76\u663E\u793A\u7EFF\u8272\u8FDE\u63A5\u5FBD\u6807"]
    ]) {
      const row = checklist.createDiv();
      const glyph = row.createSpan();
      (0, import_obsidian2.setIcon)(glyph, icon);
      row.createSpan({ text });
    }
    new import_obsidian2.Setting(diagnostics).setName("\u7CFB\u7EDF\u8BCA\u65AD").setDesc("\u68C0\u67E5\u539F\u751F\u63A7\u5236\u5668\u3001\u8F85\u52A9\u529F\u80FD\u3001Browser Host \u548C\u5F53\u524D Workspace\u3002").addButton(
      (button) => button.setButtonText("\u8FD0\u884C\u8BCA\u65AD").onClick(() => {
        void this.owner.showSystemDiagnostics();
      })
    );
  }
};
function createSettingsSection(container, title, description) {
  const section = container.createDiv({ cls: "workspace-bookmark-settings-section" });
  section.createEl("h3", { text: title });
  section.createEl("p", { text: description });
  return section;
}

// src/workspace-repair.ts
var import_yaml2 = __toESM(require_dist(), 1);
function ensureFrontmatterUuid(source, field, createUuid) {
  const key = field.trim();
  if (!key) throw new Error("Advanced URI UUID property \u4E0D\u80FD\u4E3A\u7A7A\u3002");
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
  const frontmatter = match ? (0, import_yaml2.parse)(match[2] ?? "") : {};
  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u7B14\u8BB0 frontmatter\u3002");
  }
  const existing = frontmatter[key];
  if (typeof existing === "string" && existing.trim()) {
    return { source, uid: existing.trim(), changed: false };
  }
  const uid = createUuid();
  frontmatter[key] = uid;
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const body = (0, import_yaml2.stringify)(frontmatter).trimEnd().replaceAll("\n", eol);
  const updated = match ? `${match[1]}${body}${match[3]}${source.slice(match[0].length)}` : `---${eol}${body}${eol}---${eol}${eol}${source}`;
  return { source: updated, uid, changed: true };
}
function buildObsidianCaptureUri(input) {
  const vault = encodeURIComponent(input.vaultName);
  if (input.uid) {
    return `obsidian://adv-uri?vault=${vault}&uid=${encodeURIComponent(input.uid)}`;
  }
  return `obsidian://open?vault=${vault}&file=${encodeURIComponent(input.filePath)}`;
}
function planWorkspaceReferenceRepair(source, context) {
  const parsed = parseWorkspaceMarkdown(source, { trustedSchemes: context.trustedSchemes });
  if (!parsed.workspace || parsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const currentName = fileBasename(context.filePath);
  const currentDirectory = fileDirectory(context.filePath);
  const changes = [];
  let staleSelfName = null;
  const replacements = /* @__PURE__ */ new Map();
  for (const recipe of parsed.workspace.windows) {
    let changedRecipe = structuredClone(recipe);
    let recipeChanged = false;
    changedRecipe.contents = changedRecipe.contents.map((content) => {
      const target = parseObsidianUri(content.url);
      if (!target || target.kind !== "path" || target.vault !== context.vaultName || fileDirectory(target.filePath) !== currentDirectory) return content;
      const oldName = fileBasename(target.filePath);
      const labels = [parsed.workspace.name, recipe.name, recipe.titleHint, content.title];
      if (!labels.includes(oldName)) return content;
      staleSelfName ??= oldName;
      const nextUrl = buildObsidianCaptureUri({
        vaultName: context.vaultName,
        filePath: context.filePath,
        uid: context.uid
      });
      if (nextUrl === content.url) return content;
      recipeChanged = true;
      changes.push({ kind: "uri", from: content.url, to: nextUrl });
      return { ...content, url: nextUrl };
    });
    if (recipeChanged) replacements.set(recipe.id, changedRecipe);
  }
  const syncOldName = staleSelfName && parsed.workspace.name === staleSelfName ? staleSelfName : null;
  if (syncOldName && syncOldName !== currentName) {
    changes.push({ kind: "workspace-name", from: syncOldName, to: currentName });
    for (const recipe of parsed.workspace.windows) {
      const next = replacements.get(recipe.id) ?? structuredClone(recipe);
      let changedRecipe = replacements.has(recipe.id);
      if (next.name === syncOldName) {
        changes.push({ kind: "window-name", from: syncOldName, to: currentName });
        next.name = currentName;
        changedRecipe = true;
      }
      if (next.titleHint === syncOldName) {
        changes.push({ kind: "title-hint", from: syncOldName, to: currentName });
        next.titleHint = currentName;
        changedRecipe = true;
      }
      next.contents = next.contents.map((content) => {
        if (content.title !== syncOldName) return content;
        changes.push({ kind: "content-title", from: syncOldName, to: currentName });
        changedRecipe = true;
        return { ...content, title: currentName };
      });
      if (changedRecipe) replacements.set(recipe.id, next);
    }
  }
  let updated = replaceRecipes(source, parsed.sections, replacements);
  if (syncOldName && syncOldName !== currentName) {
    updated = replaceFrontmatterName(updated, currentName);
  }
  const reparsed = parseWorkspaceMarkdown(updated, { trustedSchemes: context.trustedSchemes });
  if (!reparsed.workspace || reparsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const formatted = formatWorkspaceMarkdown(updated, reparsed);
  if (formatted !== updated) changes.push({ kind: "format", from: "\u975E\u89C4\u8303\u8868\u683C", to: "\u89C4\u8303\u8868\u683C" });
  return { source: formatted, changed: formatted !== source, changes };
}
function rewriteObsidianUrisForRename(source, context) {
  const parsed = parseWorkspaceMarkdown(source, { trustedSchemes: context.trustedSchemes });
  if (!parsed.workspace || parsed.diagnostics.some((item) => item.severity === "error")) {
    return unchanged(source);
  }
  const changes = [];
  const replacements = /* @__PURE__ */ new Map();
  for (const recipe of parsed.workspace.windows) {
    const next = structuredClone(recipe);
    next.contents = next.contents.map((content) => {
      const rewritten = rewriteObsidianUri(content.url, context);
      if (rewritten === content.url) return content;
      changes.push({ kind: "uri", from: content.url, to: rewritten });
      return { ...content, url: rewritten };
    });
    if (next.contents.some((content, index) => content.url !== recipe.contents[index]?.url)) {
      replacements.set(recipe.id, next);
    }
  }
  const oldName = fileBasename(context.oldPath);
  const newName = fileBasename(context.newPath);
  const syncIdentity = context.syncWorkspaceIdentity === true && parsed.workspace.name === oldName && oldName !== newName;
  if (syncIdentity) {
    changes.push({ kind: "workspace-name", from: oldName, to: newName });
    for (const recipe of parsed.workspace.windows) {
      const next = replacements.get(recipe.id) ?? structuredClone(recipe);
      let recipeChanged = replacements.has(recipe.id);
      if (next.name === oldName) {
        changes.push({ kind: "window-name", from: oldName, to: newName });
        next.name = newName;
        recipeChanged = true;
      }
      if (next.titleHint === oldName) {
        changes.push({ kind: "title-hint", from: oldName, to: newName });
        next.titleHint = newName;
        recipeChanged = true;
      }
      next.contents = next.contents.map((content) => {
        if (content.title !== oldName) return content;
        changes.push({ kind: "content-title", from: oldName, to: newName });
        recipeChanged = true;
        return { ...content, title: newName };
      });
      if (recipeChanged) replacements.set(recipe.id, next);
    }
  }
  let updated = replaceRecipes(source, parsed.sections, replacements);
  if (syncIdentity) updated = replaceFrontmatterName(updated, newName);
  return { source: updated, changed: updated !== source, changes };
}
function rewriteObsidianUri(url, context) {
  const target = parseObsidianUri(url);
  if (!target || target.vault !== context.vaultName) return url;
  if (target.kind === "path" && target.filePath === context.oldPath) {
    return buildObsidianCaptureUri({
      vaultName: context.vaultName,
      filePath: context.newPath
    });
  }
  if (target.kind === "advanced" && target.filePath === context.oldPath) {
    const parsed = new URL(url);
    if (target.uid) parsed.searchParams.delete("filepath");
    else parsed.searchParams.set("filepath", context.newPath);
    return parsed.toString();
  }
  return url;
}
function parseObsidianUri(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:") return null;
    const vault = parsed.searchParams.get("vault") ?? "";
    if (parsed.hostname === "open") {
      const filePath = parsed.searchParams.get("file");
      return filePath ? { kind: "path", vault, filePath } : null;
    }
    if (parsed.hostname === "adv-uri") {
      const uid = parsed.searchParams.get("uid") ?? "";
      const filePath = parsed.searchParams.get("filepath") ?? void 0;
      return uid || filePath ? { kind: "advanced", vault, uid, ...filePath ? { filePath } : {} } : null;
    }
  } catch {
    return null;
  }
  return null;
}
function replaceRecipes(source, sections, replacements) {
  let updated = source;
  const targets = sections.filter((section) => section.recipe && replacements.has(section.recipe.id)).sort((left, right) => right.start - left.start);
  for (const section of targets) {
    updated = replaceWindowSection(updated, section, replacements.get(section.recipe.id));
  }
  return updated;
}
function replaceFrontmatterName(source, name) {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
  if (!match) return source;
  const frontmatter = (0, import_yaml2.parse)(match[2] ?? "");
  if (!frontmatter || typeof frontmatter !== "object") return source;
  frontmatter.name = name;
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const body = (0, import_yaml2.stringify)(frontmatter).trimEnd().replaceAll("\n", eol);
  return `${match[1]}${body}${match[3]}${source.slice(match[0].length)}`;
}
function fileBasename(path) {
  const name = path.split("/").at(-1) ?? path;
  return name.endsWith(".md") ? name.slice(0, -3) : name;
}
function fileDirectory(path) {
  const index = path.lastIndexOf("/");
  return index < 0 ? "" : path.slice(0, index);
}
function unchanged(source) {
  return { source, changed: false, changes: [] };
}

// src/external-launch.ts
async function openWorkspaceForViewingAndRestore(openWorkspaceNote, restoreWorkspace) {
  await openWorkspaceNote();
  return restoreWorkspace();
}
function buildWorkspaceLaunchUri(target) {
  validateTarget(target);
  const vaultName = encodeURIComponent(target.vaultName);
  return `obsidian://workspace-bookmark-open?vault=${vaultName}&targetVault=${vaultName}&id=${encodeURIComponent(target.workspaceId)}`;
}
function parseWorkspaceLaunchParams(params, currentVaultName) {
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) {
    return { ok: false, code: "missing-id", message: "\u542F\u52A8\u94FE\u63A5\u7F3A\u5C11 Workspace ID\u3002" };
  }
  if (!isStableId(id, "ws_")) {
    return {
      ok: false,
      code: "invalid-id",
      message: "Workspace ID \u5FC5\u987B\u4F7F\u7528 ws_<ULID> \u683C\u5F0F\u3002"
    };
  }
  const explicitVaultName = typeof params.targetVault === "string" ? params.targetVault : typeof params.vault === "string" ? params.vault : null;
  const vaultName = explicitVaultName ?? currentVaultName;
  if (!vaultName || containsControlCharacters(vaultName)) {
    return { ok: false, code: "invalid-vault", message: "\u76EE\u6807 Vault \u540D\u79F0\u65E0\u6548\u3002" };
  }
  if (vaultName !== currentVaultName) {
    return {
      ok: false,
      code: "vault-mismatch",
      message: `\u6B64\u94FE\u63A5\u5C5E\u4E8E Vault\u201C${vaultName}\u201D\uFF0C\u5F53\u524D Vault \u4E3A\u201C${currentVaultName}\u201D\u3002\u8BF7\u4F7F\u7528\u53EF\u9760\u51B7\u542F\u52A8\u547D\u4EE4\u3002`
    };
  }
  return { ok: true, workspaceId: id, vaultName };
}
function parseLegacyWorkspaceLaunchParams(params, currentVaultName) {
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) {
    return { ok: false, code: "missing-id", message: "\u65E7\u7248\u542F\u52A8\u94FE\u63A5\u7F3A\u5C11 Workspace ID\u3002" };
  }
  if (!isStableId(id, "ws_")) {
    return {
      ok: false,
      code: "invalid-id",
      message: "Workspace ID \u5FC5\u987B\u4F7F\u7528 ws_<ULID> \u683C\u5F0F\u3002"
    };
  }
  const requestedVault = typeof params.vault === "string" ? params.vault : "";
  if (requestedVault && requestedVault !== currentVaultName) {
    return {
      ok: false,
      code: "vault-mismatch",
      message: `\u6B64\u65E7\u94FE\u63A5\u5C5E\u4E8E Vault\u201C${requestedVault}\u201D\uFF0C\u5F53\u524D Vault \u4E3A\u201C${currentVaultName}\u201D\u3002\u8BF7\u91CD\u65B0\u590D\u5236\u65B0\u7248\u94FE\u63A5\u3002`
    };
  }
  return { ok: true, workspaceId: id, vaultName: currentVaultName };
}
function buildColdStartCommand(target) {
  validateTarget(target);
  const vaultArgument = shellQuote(target.vaultName);
  const idArgument = shellQuote(target.workspaceId);
  const noteUri = `obsidian://open?vault=${encodeURIComponent(target.vaultName)}&file=${encodeURIComponent(target.filePath)}`;
  return [
    "(",
    'workspace_bookmark_cli="$(command -v obsidian 2>/dev/null || true)"',
    'if [ -z "$workspace_bookmark_cli" ] && [ -x "/Applications/Obsidian.app/Contents/MacOS/obsidian" ]; then',
    '  workspace_bookmark_cli="/Applications/Obsidian.app/Contents/MacOS/obsidian"',
    "fi",
    'if [ -z "$workspace_bookmark_cli" ]; then',
    '  echo "Workspace Bookmark: \u627E\u4E0D\u5230 Obsidian CLI\u3002" >&2',
    "  exit 1",
    "fi",
    `/usr/bin/open ${shellQuote(noteUri)}`,
    "workspace_bookmark_ready=0",
    "workspace_bookmark_attempt=0",
    'while [ "$workspace_bookmark_attempt" -lt 60 ]; do',
    `  if "$workspace_bookmark_cli" vault=${vaultArgument} help workspace-bookmark:open >/dev/null 2>&1; then`,
    "    workspace_bookmark_ready=1",
    "    break",
    "  fi",
    "  workspace_bookmark_attempt=$((workspace_bookmark_attempt + 1))",
    "  /bin/sleep 0.25",
    "done",
    'if [ "$workspace_bookmark_ready" -ne 1 ]; then',
    '  echo "Workspace Bookmark: Obsidian \u6216\u63D2\u4EF6\u672A\u5728 15 \u79D2\u5185\u5C31\u7EEA\u3002" >&2',
    "  exit 1",
    "fi",
    `"$workspace_bookmark_cli" vault=${vaultArgument} workspace-bookmark:open id=${idArgument}`,
    ")"
  ].join("\n");
}
function validateTarget(target) {
  if (!isStableId(target.workspaceId, "ws_")) {
    throw new Error("workspaceId \u5FC5\u987B\u4F7F\u7528 ws_<ULID> \u683C\u5F0F\u3002");
  }
  if (!target.vaultName.trim() || containsControlCharacters(target.vaultName)) {
    throw new Error("vaultName \u4E0D\u80FD\u4E3A\u7A7A\u6216\u5305\u542B\u6362\u884C/NUL\u3002");
  }
  if (!target.filePath.endsWith(".md") || target.filePath.startsWith("/") || target.filePath.includes("\\") || target.filePath.split("/").some((segment) => segment === "..") || containsControlCharacters(target.filePath)) {
    throw new Error("filePath \u5FC5\u987B\u662F Vault \u5185\u90E8\u7684 Markdown \u8DEF\u5F84\u3002");
  }
}
function containsControlCharacters(value) {
  return /[\0\r\n]/.test(value);
}
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

// src/main.ts
var WorkspaceBookmarkPlugin = class extends import_obsidian3.Plugin {
  settings = DEFAULT_SETTINGS;
  native;
  decoratedViews = /* @__PURE__ */ new WeakMap();
  statusBarItem = null;
  activeOperation = null;
  async onload() {
    await this.loadSettings();
    this.native = new NativeClient(this.settings.workspacectlPath);
    this.addSettingTab(new WorkspaceBookmarkSettingTab(this.app, this));
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("workspace-bookmark-status");
    this.statusBarItem.setAttribute("aria-label", "\u6253\u5F00 Workspace Bookmark \u7CFB\u7EDF\u8BCA\u65AD");
    this.statusBarItem.addEventListener("click", () => void this.showSystemDiagnostics());
    this.renderRuntimeStatus("checking", "\u6B63\u5728\u68C0\u67E5");
    this.addRibbonIcon("bookmark-plus", "Capture current workspace", () => {
      void this.captureCurrentWorkspace();
    });
    this.addRibbonIcon("library", "Browse workspaces", () => {
      void this.browseWorkspaces();
    });
    this.registerCommands();
    this.registerExternalEntrypoints();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.decorateActiveView())
    );
    this.registerEvent(this.app.workspace.on("layout-change", () => this.decorateActiveView()));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof import_obsidian3.TFile) void this.maybeInitializeCreatedWorkspace(file);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof import_obsidian3.TFile && file.extension === "md") {
        void this.handleMarkdownRename(file, oldPath).catch((cause) => {
          new import_obsidian3.Notice(`Workspace Bookmark\uFF1A\u91CD\u547D\u540D\u5F15\u7528\u540C\u6B65\u5931\u8D25\uFF1A${messageOf2(cause)}`, 8e3);
        });
      }
    }));
    this.app.workspace.onLayoutReady(() => {
      this.decorateActiveView();
      void this.refreshRuntimeStatus();
    });
    this.registerInterval(
      window.setInterval(() => void this.refreshRuntimeStatus(), 6e4)
    );
  }
  async loadSettings() {
    const stored = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...stored ?? {},
      managedFolder: normalizeManagedFolder(stored?.managedFolder ?? DEFAULT_SETTINGS.managedFolder),
      trustedSchemes: [...new Set(stored?.trustedSchemes ?? [])],
      recentWorkspaces: Array.isArray(stored?.recentWorkspaces) ? stored.recentWorkspaces.filter(
        (item) => typeof item?.workspaceId === "string" && typeof item?.lastOpenedAt === "string"
      ) : []
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.native = new NativeClient(this.settings.workspacectlPath);
  }
  registerCommands() {
    this.addCommand({
      id: "create-workspace",
      name: "Create workspace",
      callback: () => this.createWorkspace()
    });
    this.addCommand({
      id: "initialize-current-note-as-workspace",
      name: "Initialize current note as workspace",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const available = file instanceof import_obsidian3.TFile && file.extension === "md" && isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder));
        if (!checking && available) void this.initializeWorkspaceFile(file);
        return available;
      }
    });
    this.addCommand({
      id: "capture-current-workspace",
      name: "Capture current workspace",
      checkCallback: (checking) => this.managedCommand(checking, () => this.captureCurrentWorkspace())
    });
    this.addCommand({
      id: "open-current-workspace",
      name: "Open current workspace",
      checkCallback: (checking) => this.managedCommand(checking, async () => {
        await this.openCurrentWorkspace();
      })
    });
    this.addCommand({
      id: "copy-current-workspace-launch-url",
      name: "Copy launch URL for current Workspace",
      checkCallback: (checking) => this.launchableWorkspaceCommand(checking, () => this.copyCurrentWorkspaceLaunchUrl())
    });
    this.addCommand({
      id: "copy-current-workspace-cold-start-command",
      name: "Copy reliable cold-start command",
      checkCallback: (checking) => this.launchableWorkspaceCommand(checking, () => this.copyCurrentWorkspaceColdStartCommand())
    });
    this.addCommand({
      id: "open-current-window",
      name: "Open current Window",
      editorCheckCallback: (checking, editor, context) => {
        const file = context.file;
        const available = file instanceof import_obsidian3.TFile && this.isManagedWorkspace(file);
        if (!checking && available) void this.openWindowAtLine(file, editor.getCursor().line);
        return available;
      }
    });
    this.addCommand({
      id: "edit-current-window",
      name: "Edit current Window",
      editorCheckCallback: (checking, editor, context) => {
        const file = context.file;
        const available = file instanceof import_obsidian3.TFile && this.isManagedWorkspace(file);
        if (!checking && available) void this.editWindowAtLine(file, editor.getCursor().line);
        return available;
      }
    });
    this.addCommand({
      id: "validate-format-current-workspace",
      name: "Validate/Format current workspace",
      checkCallback: (checking) => this.managedCommand(checking, () => this.validateAndFormatCurrent())
    });
    this.addCommand({
      id: "migrate-current-workspace-to-v4",
      name: "Migrate current workspace to V4",
      checkCallback: (checking) => this.managedCommand(checking, () => this.migrateCurrentWorkspaceToV4())
    });
    this.addCommand({
      id: "review-duplicate-windows",
      name: "Review duplicate Windows",
      checkCallback: (checking) => this.managedCommand(checking, () => this.reviewDuplicateWindows())
    });
    this.addCommand({
      id: "repair-current-workspace-references",
      name: "Repair current Workspace references",
      checkCallback: (checking) => this.managedCommand(checking, () => this.repairCurrentWorkspaceReferences())
    });
    this.addCommand({
      id: "browse-workspaces",
      name: "Browse workspaces",
      callback: () => this.browseWorkspaces()
    });
    this.addCommand({
      id: "system-diagnostics",
      name: "System diagnostics",
      callback: () => {
        void this.showSystemDiagnostics();
      }
    });
  }
  registerExternalEntrypoints() {
    this.registerObsidianProtocolHandler("workspace-bookmark-open", async (params) => {
      const parsed = parseWorkspaceLaunchParams(params, this.app.vault.getName());
      if (!parsed.ok) {
        new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${parsed.message}`, 8e3);
        return;
      }
      await this.openWorkspaceById(parsed.workspaceId);
    });
    this.registerObsidianProtocolHandler("workspace-bookmark-capture", async () => {
      await this.captureCurrentWorkspace();
    });
    this.registerObsidianProtocolHandler("workspace-bookmark-open-current", async () => {
      await this.openCurrentWorkspace();
    });
    this.registerObsidianProtocolHandler("workspace-bookmark", async (params) => {
      const parsed = parseLegacyWorkspaceLaunchParams(params, this.app.vault.getName());
      if (!parsed.ok) {
        new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${parsed.message} \u8BF7\u4F7F\u7528\u547D\u4EE4\u91CD\u65B0\u590D\u5236\u542F\u52A8\u94FE\u63A5\u3002`, 8e3);
        return;
      }
      new import_obsidian3.Notice("Workspace Bookmark\uFF1A\u5DF2\u517C\u5BB9\u65E7\u7248\u542F\u52A8\u94FE\u63A5\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u590D\u5236\u65B0\u7248\u94FE\u63A5\u3002", 6e3);
      await this.openWorkspaceById(parsed.workspaceId);
    });
    this.registerCliHandler(
      "workspace-bookmark:open",
      "Open a Workspace Bookmark by stable workspace ID.",
      {
        id: {
          value: "<ws_id>",
          description: "Stable ws_<ULID> identifier.",
          required: true
        }
      },
      async (params) => {
        const id = String(params.id ?? "");
        if (!isStableId(id, "ws_")) return "Invalid workspace ID.";
        return await this.openWorkspaceById(id) ? `Opened ${id}.` : `Workspace ${id} was not opened.`;
      }
    );
    this.registerCliHandler(
      "workspace-bookmark:capture",
      "Capture visible windows into the active managed Workspace.",
      null,
      async () => {
        await this.captureCurrentWorkspace();
        return "Capture dialog opened.";
      }
    );
    this.registerCliHandler(
      "workspace-bookmark:validate",
      "Validate the active managed Workspace.",
      null,
      async () => this.validateCurrentForCli()
    );
  }
  managedCommand(checking, callback) {
    const file = this.app.workspace.getActiveFile();
    const available = file instanceof import_obsidian3.TFile && this.isManagedWorkspace(file);
    if (!checking && available) void callback();
    return available;
  }
  launchableWorkspaceCommand(checking, callback) {
    const file = this.app.workspace.getActiveFile();
    const id = file instanceof import_obsidian3.TFile ? String(this.app.metadataCache.getFileCache(file)?.frontmatter?.workspace_id ?? "") : "";
    const available = file instanceof import_obsidian3.TFile && this.isManagedWorkspace(file) && isStableId(id, "ws_");
    if (!checking && available) void callback();
    return available;
  }
  async copyCurrentWorkspaceLaunchUrl() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    await this.copyWorkspaceLaunchUrl(file);
  }
  async copyCurrentWorkspaceColdStartCommand() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const launch = await this.getWorkspaceLaunchTarget(file);
    if (!launch) return;
    await this.copyTextWithFallback(
      "\u53EF\u9760\u51B7\u542F\u52A8\u547D\u4EE4",
      buildColdStartCommand(launch.target),
      `\u5DF2\u590D\u5236\u201C${launch.name}\u201D\u7684\u53EF\u9760\u51B7\u542F\u52A8\u547D\u4EE4\u3002`
    );
  }
  async copyWorkspaceLaunchUrl(file) {
    const launch = await this.getWorkspaceLaunchTarget(file);
    if (!launch) return;
    await this.copyTextWithFallback(
      "Workspace \u542F\u52A8\u94FE\u63A5",
      buildWorkspaceLaunchUri(launch.target),
      `\u5DF2\u590D\u5236\u201C${launch.name}\u201D\u7684\u542F\u52A8\u94FE\u63A5 \xB7 ${launch.target.vaultName}\u3002Obsidian \u5173\u95ED\u65F6\u8BF7\u4F7F\u7528\u53EF\u9760\u51B7\u542F\u52A8\u547D\u4EE4\u3002`
    );
  }
  async getWorkspaceLaunchTarget(file) {
    if (!this.isManagedWorkspace(file)) {
      new import_obsidian3.Notice("\u5F53\u524D\u6587\u6863\u4E0D\u662F\u53D7\u7BA1 Workspace\u3002");
      return null;
    }
    const parsed = this.parse(await this.app.vault.cachedRead(file));
    if (!parsed.managed || !parsed.workspace || !isStableId(parsed.workspace.id, "ws_")) {
      new import_obsidian3.Notice("\u5F53\u524D Workspace \u7F3A\u5C11\u5408\u6CD5\u7684 workspace_id\uFF0C\u65E0\u6CD5\u751F\u6210\u542F\u52A8\u5165\u53E3\u3002", 8e3);
      return null;
    }
    return {
      name: parsed.workspace.name.trim() || file.basename,
      target: {
        vaultName: this.app.vault.getName(),
        workspaceId: parsed.workspace.id,
        filePath: file.path
      }
    };
  }
  async copyTextWithFallback(title, text, success) {
    try {
      await navigator.clipboard.writeText(text);
      new import_obsidian3.Notice(success);
    } catch {
      new CopyableTextModal(this.app, title, text).open();
    }
  }
  decorateActiveView() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
    if (!view) return;
    let actions = this.decoratedViews.get(view);
    if (!actions) {
      actions = [
        view.addAction("play", "Open current Workspace", () => {
          if (this.isManagedWorkspace(view.file)) void this.openCurrentWorkspace();
        }),
        view.addAction("scan-search", "Capture current Workspace", () => {
          if (this.isManagedWorkspace(view.file)) void this.captureCurrentWorkspace();
        }),
        view.addAction("link-2", "Copy Workspace launch URL", () => {
          if (this.isManagedWorkspace(view.file)) void this.copyWorkspaceLaunchUrl(view.file);
        })
      ];
      this.decoratedViews.set(view, actions);
    }
    const visible = this.isManagedWorkspace(view.file);
    for (const action of actions) action.style.display = visible ? "" : "none";
  }
  createWorkspace() {
    new TextPromptModal(this.app, "Create workspace", "\u4F8B\u5982\uFF1A\u8003\u7814\u82F1\u8BED", async (name) => {
      const folder = (0, import_obsidian3.normalizePath)(this.settings.managedFolder.replace(/\/$/, ""));
      await this.ensureFolder(folder);
      const fileName = sanitizeFileName(name);
      let path = (0, import_obsidian3.normalizePath)(`${folder}/${fileName}.md`);
      let suffix = 2;
      while (await this.app.vault.adapter.exists(path)) {
        path = (0, import_obsidian3.normalizePath)(`${folder}/${fileName} ${suffix}.md`);
        suffix += 1;
      }
      const file = await this.app.vault.create(path, createWorkspaceTemplate(createWorkspaceId(), name));
      await this.app.workspace.getLeaf(false).openFile(file);
    }).open();
  }
  async maybeInitializeCreatedWorkspace(file) {
    if (file.extension !== "md" || !isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder))) return;
    await wait2(120);
    const source = await this.app.vault.read(file);
    if (!canAutoInitializeWorkspaceSource(source)) {
      if (!this.parse(source).managed) {
        new import_obsidian3.Notice("Workspace Bookmark\uFF1A\u65B0\u6587\u4EF6\u5DF2\u6709\u6B63\u6587\uFF0C\u672A\u81EA\u52A8\u6539\u5199\uFF1B\u53EF\u8FD0\u884C Initialize current note as workspace\u3002", 6e3);
      }
      return;
    }
    await this.initializeWorkspaceFile(file, true);
  }
  async initializeWorkspaceFile(file, automatic = false) {
    if (file.extension !== "md" || !isPathInManagedFolder(file.path, normalizeManagedFolder(this.settings.managedFolder))) {
      new import_obsidian3.Notice("\u5F53\u524D\u6587\u6863\u4E0D\u5728 Workspace Bookmark \u53D7\u7BA1\u76EE\u5F55\u4E2D\u3002");
      return;
    }
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (parsed.managed) {
      if (!automatic) new import_obsidian3.Notice("\u5F53\u524D\u6587\u6863\u5DF2\u7ECF\u662F Workspace\u3002");
      return;
    }
    const next = initializeWorkspaceMarkdown(source, createWorkspaceId(), file.basename);
    if (next === source) return;
    await this.app.vault.modify(file, next);
    new import_obsidian3.Notice(automatic ? "\u5DF2\u81EA\u52A8\u521D\u59CB\u5316 Workspace \u6587\u6863\u3002" : "\u5DF2\u521D\u59CB\u5316\u5F53\u524D Workspace \u6587\u6863\u3002");
  }
  async captureCurrentWorkspace() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    let source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      const migrated = await this.migrateWorkspaceWithConfirmation(file, source);
      if (!migrated) return;
      source = migrated;
      parsed = this.parse(source);
    }
    const existing = parsed.workspace?.windows ?? [];
    const snapshot = await this.runOperation(
      "\u6B63\u5728\u626B\u63CF\u7A97\u53E3",
      () => this.scanCaptureSnapshot(file, existing)
    );
    if (!snapshot) return;
    new CaptureModal(this.app, snapshot.candidates, existing, async (operations) => {
      const diffs = buildCaptureDiffs(operations, existing);
      new CaptureDiffModal(this.app, diffs, async () => {
        await this.commitCapture(file, source, parsed, operations);
      }).open();
    }, {
      scannedAt: snapshot.scannedAt,
      sourceNotices: snapshot.sourceNotices,
      onRefresh: () => this.scanCaptureSnapshot(file, existing),
      onDiagnostics: () => this.showSystemDiagnostics(),
      onReviewDuplicates: () => this.reviewDuplicateWindows(file)
    }).open();
  }
  async scanCaptureSnapshot(file, existing) {
    const [nativeResult, browserResult, obsidianCapture] = await Promise.all([
      this.native.scan(),
      this.native.browserSnapshot(),
      this.resolveObsidianCaptureUri(file)
    ]);
    if (!nativeResult.ok || !nativeResult.value) {
      throw new Error(nativeResult.error?.message ?? "\u65E0\u6CD5\u626B\u63CF macOS \u7A97\u53E3\u3002");
    }
    const browserReport = browserResult.ok && browserResult.value ? browserResult.value : { sources: [] };
    const browserWindows = browserReport.sources.flatMap((source) => source.windows);
    const candidates = this.buildCaptureCandidates(
      nativeResult.value,
      browserWindows,
      browserReport,
      file,
      obsidianCapture,
      existing
    );
    const sourceNotices = captureSourceNotices(browserReport.sources, candidates);
    if (!browserResult.ok && sourceNotices.length === 0) {
      sourceNotices.push({
        browserId: "chrome",
        browserName: "\u6D4F\u89C8\u5668",
        tone: "warning",
        message: browserResult.error?.message ?? "\u6D4F\u89C8\u5668\u6865\u63A5\u72B6\u6001\u6682\u65F6\u4E0D\u53EF\u7528\u3002"
      });
    }
    return {
      candidates,
      sourceNotices,
      scannedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async resolveObsidianCaptureUri(file) {
    const vaultName = this.app.vault.getName();
    const fallback = {
      url: buildObsidianCaptureUri({ vaultName, filePath: file.path }),
      stable: false
    };
    const idField = this.advancedUriIdField();
    if (!idField) return fallback;
    let uid = "";
    try {
      await this.app.vault.process(file, (source) => {
        const ensured = ensureFrontmatterUuid(source, idField, () => crypto.randomUUID());
        uid = ensured.uid;
        return ensured.source;
      });
    } catch {
      return fallback;
    }
    if (!uid) return fallback;
    return {
      url: buildObsidianCaptureUri({ vaultName, filePath: file.path, uid }),
      stable: true
    };
  }
  advancedUriIdField() {
    const registry = this.app.plugins;
    if (!registry?.enabledPlugins?.has("obsidian-advanced-uri")) return null;
    const plugin = registry.getPlugin?.("obsidian-advanced-uri");
    const configured = plugin?.settings?.idField;
    return typeof configured === "string" && configured.trim() ? configured.trim() : "id";
  }
  buildCaptureCandidates(nativeWindows, browserWindows, browserReport, activeFile, obsidianCapture, existing) {
    const obsidianWindows = nativeWindows.filter((window2) => window2.bundleId === "md.obsidian");
    const activeObsidianWindow = obsidianWindows.find(
      (window2) => window2.title.toLowerCase().includes(activeFile.basename.toLowerCase())
    ) ?? obsidianWindows[0];
    return nativeWindows.map((nativeWindow) => {
      const browserDescriptor = browserDescriptorForBundle(nativeWindow.bundleId);
      const browserSource = browserDescriptor ? browserReport.sources.find((source) => source.browserId === browserDescriptor.id) : void 0;
      const browserCandidates = browserDescriptor ? browserMatchCandidates(nativeWindow, browserWindows) : [];
      const browser = uniqueBrowserMatch(nativeWindow, browserWindows);
      const isActiveObsidian = nativeWindow.windowId === activeObsidianWindow?.windowId;
      const capturedTitle = browser?.tabs.find((tab) => tab.active)?.title || (isActiveObsidian ? activeFile.basename : nativeWindow.title);
      const candidate = {
        native: { ...nativeWindow, title: capturedTitle },
        browser,
        browserAlternatives: browserCandidates.length > 1 ? browserCandidates : void 0,
        browserIdHint: browserDescriptor?.id,
        browserNameHint: browserDescriptor?.name,
        browserConnected: browserSource?.connected ?? false,
        obsidianUrl: isActiveObsidian ? obsidianCapture.url : void 0,
        obsidianUriFallback: isActiveObsidian && !obsidianCapture.stable,
        selected: Boolean(browser || isActiveObsidian),
        selectedTabs: new Set(
          browser?.tabs.filter((tab) => isRestorableBrowserUrl(tab.url)).map((tab) => tab.index) ?? []
        ),
        manualUrl: "",
        restoreMode: browser || isActiveObsidian ? "open-content" : "launch-only",
        openMode: browser ? "focus-existing" : void 0,
        action: browser || isActiveObsidian ? "add" : "ignore"
      };
      const captured = candidateToRecipe(candidate);
      const targets = captured ? captureTargetMatches(captured, existing) : [];
      const target = targets.length === 1 ? targets[0] : null;
      if (target) {
        candidate.action = "update";
        candidate.targetId = target.id;
        if (candidate.browser) candidate.openMode = target.openMode;
      } else if (targets.length > 1) {
        candidate.selected = false;
        candidate.action = "ignore";
        candidate.duplicateTargetIds = targets.map((item) => item.id);
      }
      return candidate;
    });
  }
  async commitCapture(file, originalSource, originalParsed, operations) {
    let failure = "";
    let changed = false;
    const updateIds = operations.flatMap(
      (operation) => operation.action === "update" ? [operation.targetId] : []
    );
    await this.app.vault.process(file, (currentSource) => {
      const currentParsed = this.parse(currentSource);
      if (!currentParsed.managed || !currentParsed.workspace || currentParsed.diagnostics.some((item) => item.severity === "error")) {
        failure = "\u5F53\u524D Workspace \u5728 Modal \u6253\u5F00\u540E\u53D8\u4E3A\u65E0\u6548\u6587\u6863\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u5185\u5BB9\u3002";
        return currentSource;
      }
      if (targetSectionsChanged(
        originalSource,
        originalParsed,
        currentSource,
        currentParsed,
        updateIds
      )) {
        failure = "\u5F85\u66F4\u65B0 Window \u5DF2\u5728 Modal \u6253\u5F00\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6267\u884C Capture\u3002";
        return currentSource;
      }
      try {
        const updated = applyCaptureOperations(
          currentSource,
          currentParsed,
          operations
        );
        changed = updated !== currentSource;
        return updated;
      } catch (cause) {
        failure = messageOf2(cause);
        return currentSource;
      }
    });
    if (failure) {
      new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${failure}`, 8e3);
      return;
    }
    new import_obsidian3.Notice(changed ? `\u5DF2\u5B89\u5168\u5199\u5165 ${operations.length} \u4E2A Window\u3002` : "\u6CA1\u6709\u9700\u8981\u5199\u5165\u7684\u53D8\u5316\u3002");
  }
  async migrateCurrentWorkspaceToV4() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace?.schemaVersion === 4) {
      new import_obsidian3.Notice("\u5F53\u524D Workspace \u5DF2\u7ECF\u662F V4\u3002");
      return;
    }
    await this.migrateWorkspaceWithConfirmation(file, source);
  }
  async migrateWorkspaceWithConfirmation(file, source) {
    const migration = migrateWorkspaceMarkdownToLatest(source, {
      trustedSchemes: this.settings.trustedSchemes
    });
    if (!migration.ok) {
      new DiagnosticsModal(this.app, `\u65E0\u6CD5\u8FC1\u79FB\uFF1A${file.path}`, migration.diagnostics).open();
      return null;
    }
    if (migration.source === source) return source;
    const confirmed = await new Promise((resolve) => {
      new MigrationPreviewModal(this.app, migration.headingChanges, resolve).open();
    });
    if (!confirmed) return null;
    let changed = false;
    await this.app.vault.process(file, (current) => {
      if (current !== source) return current;
      changed = true;
      return migration.source;
    });
    if (!changed) {
      new import_obsidian3.Notice("Workspace \u5728\u8FC1\u79FB\u786E\u8BA4\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u672A\u5199\u5165\u3002");
      return null;
    }
    const externalReferences = await this.updateManagedHeadingLinks(
      file,
      migration.headingChanges
    );
    new import_obsidian3.Notice(
      `\u5DF2\u8FC1\u79FB\u5230 Workspace Markdown V4${externalReferences > 0 ? `\uFF1B\u53E6\u53D1\u73B0 ${externalReferences} \u4E2A\u53D7\u7BA1\u76EE\u5F55\u5916\u5F15\u7528\uFF0C\u672A\u81EA\u52A8\u4FEE\u6539` : ""}\u3002`,
      8e3
    );
    return migration.source;
  }
  async reviewDuplicateWindows(explicitFile) {
    const file = explicitFile ?? this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed) || !parsed.workspace) return;
    const groups = findDuplicateFocusExistingGroups(parsed.workspace.windows);
    if (groups.length === 0) {
      new import_obsidian3.Notice("\u5F53\u524D Workspace \u6CA1\u6709\u53EF\u5B89\u5168\u5408\u5E76\u7684\u91CD\u590D Window\u3002");
      return;
    }
    new DuplicateRepairModal(this.app, groups, async (removeIds) => {
      let failure = "";
      let removed = 0;
      await this.app.vault.process(file, (currentSource) => {
        if (currentSource !== source) {
          failure = "Workspace \u5728\u786E\u8BA4\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5\u91CD\u590D\u9879\u3002";
          return currentSource;
        }
        const currentParsed = this.parse(currentSource);
        const currentIds = new Set(
          currentParsed.workspace?.windows.map((recipe) => recipe.id) ?? []
        );
        const validIds = removeIds.filter((id) => currentIds.has(id));
        if (validIds.length !== removeIds.length) {
          failure = "\u4E00\u4E2A\u6216\u591A\u4E2A\u91CD\u590D Window \u5DF2\u4E0D\u5B58\u5728\u3002";
          return currentSource;
        }
        const updated = removeWindowSections(currentSource, currentParsed, validIds);
        const verified = this.parse(updated);
        if (verified.diagnostics.some((item) => item.severity === "error")) {
          failure = "\u79FB\u9664\u540E\u6587\u6863\u672A\u901A\u8FC7\u6821\u9A8C\uFF0C\u5DF2\u4FDD\u7559\u539F\u6587\u3002";
          return currentSource;
        }
        removed = validIds.length;
        return updated;
      });
      if (failure) {
        new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${failure}`, 8e3);
      } else {
        new import_obsidian3.Notice(`\u5DF2\u79FB\u9664 ${removed} \u4E2A\u91CD\u590D Window\uFF1B\u7B2C\u4E00\u4EFD\u53CA\u666E\u901A\u6B63\u6587\u5747\u5DF2\u4FDD\u7559\u3002`);
      }
    }).open();
  }
  async repairCurrentWorkspaceReferences() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const originalSource = await this.app.vault.read(file);
    let planningSource = originalSource;
    let uid;
    const preliminaryChanges = [];
    const idField = this.advancedUriIdField();
    if (idField) {
      try {
        const ensured = ensureFrontmatterUuid(
          planningSource,
          idField,
          () => crypto.randomUUID()
        );
        planningSource = ensured.source;
        uid = ensured.uid;
        if (ensured.changed) {
          preliminaryChanges.push({
            kind: "uuid",
            from: `\u7F3A\u5C11 ${idField}`,
            to: `${idField}: ${uid}`
          });
        }
      } catch (cause) {
        new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${messageOf2(cause)}`, 8e3);
        return;
      }
    }
    const repair = planWorkspaceReferenceRepair(planningSource, {
      filePath: file.path,
      vaultName: this.app.vault.getName(),
      uid,
      trustedSchemes: this.settings.trustedSchemes
    });
    const changes = [...preliminaryChanges, ...repair.changes];
    if (repair.source === originalSource || changes.length === 0) {
      new import_obsidian3.Notice("\u5F53\u524D Workspace \u6CA1\u6709\u53EF\u5B89\u5168\u4FEE\u590D\u7684\u5F15\u7528\u6216\u683C\u5F0F\u95EE\u9898\u3002");
      return;
    }
    const confirmed = await new Promise((resolve) => {
      new WorkspaceRepairPreviewModal(this.app, changes, resolve).open();
    });
    if (!confirmed) return;
    let applied = false;
    await this.app.vault.process(file, (currentSource) => {
      if (currentSource !== originalSource) return currentSource;
      const verified = this.parse(repair.source);
      if (!verified.workspace || verified.diagnostics.some((item) => item.severity === "error")) {
        return currentSource;
      }
      applied = true;
      return repair.source;
    });
    new import_obsidian3.Notice(
      applied ? `\u5DF2\u4FEE\u590D ${changes.length} \u9879 Workspace \u5F15\u7528\u4E0E\u683C\u5F0F\u3002` : "Workspace \u5728\u786E\u8BA4\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u672A\u5199\u5165\u3002",
      8e3
    );
  }
  async handleMarkdownRename(file, oldPath) {
    if (oldPath === file.path) return;
    const managedFolder = normalizeManagedFolder(this.settings.managedFolder);
    const candidates = this.app.vault.getMarkdownFiles().filter(
      (candidate) => isPathInManagedFolder(candidate.path, managedFolder)
    );
    for (const workspaceFile of candidates) {
      await this.app.vault.process(workspaceFile, (source) => {
        const parsed = this.parse(source);
        if (!parsed.managed || !parsed.workspace) return source;
        return rewriteObsidianUrisForRename(source, {
          vaultName: this.app.vault.getName(),
          oldPath,
          newPath: file.path,
          syncWorkspaceIdentity: workspaceFile.path === file.path,
          trustedSchemes: this.settings.trustedSchemes
        }).source;
      });
    }
  }
  async updateManagedHeadingLinks(target, changes) {
    const pathWithoutExtension = target.path.replace(/\.md$/i, "");
    let externalReferences = 0;
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (file.path === target.path) continue;
      const source = await this.app.vault.cachedRead(file);
      let updated = source;
      for (const change of changes) {
        const needles = [
          `${pathWithoutExtension}#${change.from}`,
          `${target.basename}#${change.from}`
        ];
        for (const needle of needles) {
          const occurrences = updated.split(needle).length - 1;
          if (occurrences === 0) continue;
          if (isPathInManagedFolder(file.path, this.settings.managedFolder)) {
            updated = updated.replaceAll(needle, needle.replace(change.from, change.to));
          } else {
            externalReferences += occurrences;
          }
        }
      }
      if (updated !== source) await this.app.vault.modify(file, updated);
    }
    return externalReferences;
  }
  async openCurrentWorkspace() {
    const file = this.getActiveManagedFile();
    if (!file) return false;
    return this.openWorkspaceFile(file);
  }
  async openWorkspaceById(id) {
    const item = (await this.collectWorkspaceItems()).find((candidate) => candidate.id === id);
    if (!item) {
      new import_obsidian3.Notice(`\u672A\u627E\u5230 Workspace\uFF1A${id}`);
      return false;
    }
    return openWorkspaceForViewingAndRestore(
      async () => {
        await this.app.workspace.getLeaf(false).openFile(item.file);
      },
      () => this.openWorkspaceFile(item.file)
    );
  }
  async openWorkspaceFile(file) {
    const source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    const untrusted = extractUntrustedSchemes(parsed);
    const otherErrors = parsed.diagnostics.filter(
      (item) => item.severity === "error" && item.code !== "UNTRUSTED_SCHEME"
    );
    if (untrusted.length > 0 && otherErrors.length === 0) {
      new ConfirmSchemesModal(this.app, untrusted, async () => {
        this.settings.trustedSchemes = [.../* @__PURE__ */ new Set([...this.settings.trustedSchemes, ...untrusted])];
        await this.saveSettings();
        await this.openWorkspaceFile(file);
      }).open();
      return false;
    }
    if (!this.ensureExecutable(file, parsed) || !parsed.workspace) return false;
    const summary = await this.runOperation(
      `\u6B63\u5728\u6062\u590D \xB7 ${parsed.workspace.name}`,
      () => this.restoreWorkspace(parsed.workspace, file)
    );
    if (!summary) return false;
    if (summary.successCount > 0) {
      await this.recordRecentWorkspace(parsed.workspace.id);
    }
    return summary.successCount > 0;
  }
  async restoreWorkspace(workspace, sourceFile) {
    const deduplicated = deduplicateFocusExistingRecipes(workspace.windows);
    const items = deduplicated.duplicates.map(({ recipe, kept }) => ({
      status: "skipped",
      label: `${recipe.appName} \xB7 ${recipe.name}`,
      detail: `\u4E0E\u201C${kept.name}\u201D\u5B8C\u5168\u91CD\u590D\uFF0C\u672C\u6B21\u53EA\u6267\u884C\u7B2C\u4E00\u4EFD\u3002`,
      windowId: recipe.id
    }));
    let supportedWindows = deduplicated.runnable;
    const launchOnlyWindows = supportedWindows.filter(
      (window2) => (window2.restoreMode ?? "open-content") === "launch-only"
    );
    if (launchOnlyWindows.length > 0) {
      const doctor = await this.native.doctor();
      if (!doctor.ok || !doctor.value?.capabilities?.includes("launch-only")) {
        for (const window2 of launchOnlyWindows) {
          items.push({
            status: "skipped",
            label: `${window2.appName} \xB7 ${window2.name}`,
            detail: "\u5F53\u524D workspacectl \u4E0D\u652F\u6301\u201C\u4EC5\u542F\u52A8\u5E94\u7528\u201D\uFF1B\u8BF7\u66F4\u65B0\u539F\u751F\u63A7\u5236\u5668\u540E\u91CD\u8BD5\u3002",
            windowId: window2.id
          });
        }
        supportedWindows = supportedWindows.filter(
          (window2) => (window2.restoreMode ?? "open-content") !== "launch-only"
        );
      }
    }
    if (supportedWindows.length === 0) {
      const issues2 = [{
        message: "\u5F53\u524D\u539F\u751F\u63A7\u5236\u5668\u4E0D\u652F\u6301\u6B64 Workspace \u6240\u9700\u7684\u201C\u4EC5\u542F\u52A8\u5E94\u7528\u201D\u80FD\u529B\u3002"
      }];
      new RestoreBlockedModal(this.app, workspace.name, issues2, {
        onRetry: sourceFile ? async () => {
          await this.openWorkspaceFile(sourceFile);
        } : void 0,
        onDiagnostics: () => this.showSystemDiagnostics(),
        onEditWindow: sourceFile ? (windowId) => this.editWindowById(sourceFile, windowId) : void 0
      }).open();
      return { successCount: 0, items };
    }
    const planResult = await this.native.plan({ windows: supportedWindows });
    if (!planResult.ok || !planResult.value) {
      const failedItems = [
        ...items,
        {
          status: "failed",
          label: "\u6062\u590D\u9884\u68C0\u67E5",
          detail: planResult.error?.message ?? "workspacectl \u672A\u8FD4\u56DE\u6709\u6548\u8BA1\u5212\u3002"
        }
      ];
      new RestoreResultsModal(this.app, workspace.name, failedItems, {
        onDiagnostics: () => this.showSystemDiagnostics()
      }).open();
      return { successCount: 0, items: failedItems };
    }
    const ensureResult = await this.native.ensureApps({ windows: supportedWindows });
    const appBlockedBundles = /* @__PURE__ */ new Set();
    const readyAppBundles = /* @__PURE__ */ new Set();
    if (!ensureResult.ok || !ensureResult.value) {
      items.push({
        status: "degraded",
        label: "App \u542F\u52A8",
        detail: ensureResult.error?.message ?? "\u65E0\u6CD5\u786E\u8BA4\u76EE\u6807 App \u662F\u5426\u5DF2\u542F\u52A8\u3002"
      });
    } else {
      for (const item of ensureResult.value.items) {
        items.push(restoreItemForEnsuredApp(item));
        if (!item.ok) appBlockedBundles.add(item.bundleId);
        if (item.ok) readyAppBundles.add(item.bundleId);
      }
    }
    const appReadyWindows = supportedWindows.filter(
      (window2) => !appBlockedBundles.has(window2.bundleId)
    );
    const browserStatus = await this.browserStatusAfterEnsure(appReadyWindows);
    const readiness = partitionRestoreReadiness(
      appReadyWindows,
      planResult.value.items,
      browserStatus ? browserStatus.sources : planResult.value.browserSources.map((source) => ({
        ...source,
        connected: false
      }))
    );
    const runnable = readiness.runnable;
    const issues = [...readiness.issues];
    for (const issue of readiness.issues) {
      const recipe = supportedWindows.find(
        (window2) => window2.id === issue.windowId
      );
      items.push({
        status: "skipped",
        label: recipe ? `${recipe.appName} \xB7 ${recipe.name}` : issue.windowName,
        detail: issue.message,
        windowId: issue.windowId
      });
    }
    if (!planResult.value.accessibilityTrusted && runnable.some((window2) => window2.layout !== "keep")) {
      issues.push({
        message: "Accessibility \u672A\u6388\u6743\uFF1B\u5185\u5BB9\u4ECD\u53EF\u6253\u5F00\uFF0C\u4F46\u6240\u6709\u5E03\u5C40\u64CD\u4F5C\u90FD\u4F1A\u8DF3\u8FC7\u3002"
      });
    }
    if (runnable.length === 0) {
      if (issues.length === 0) {
        issues.push({ message: "Workspace \u4E2D\u6CA1\u6709\u53EF\u6267\u884C\u7684 Window\u3002" });
      }
      new RestoreBlockedModal(this.app, workspace.name, issues, {
        onRetry: sourceFile ? async () => {
          await this.openWorkspaceFile(sourceFile);
        } : void 0,
        onDiagnostics: () => this.showSystemDiagnostics(),
        onEditWindow: sourceFile ? (windowId) => this.editWindowById(sourceFile, windowId) : void 0
      }).open();
      return { successCount: 0, items };
    }
    if (!planResult.value.accessibilityTrusted && runnable.some((window2) => window2.layout !== "keep")) {
      items.push({
        status: "degraded",
        label: "\u7A97\u53E3\u5E03\u5C40",
        detail: "Accessibility \u672A\u6388\u6743\uFF1B\u5185\u5BB9\u4F1A\u6253\u5F00\uFF0C\u4F46\u5E03\u5C40\u64CD\u4F5C\u5C06\u8DF3\u8FC7\u3002"
      });
    }
    const contentWindows = runnable.filter(
      (window2) => (window2.restoreMode ?? "open-content") === "open-content"
    );
    const obsidianWindows = contentWindows.filter((window2) => window2.adapter === "obsidian");
    const browserWindows = contentWindows.filter((window2) => window2.adapter === "browser");
    const matchHints = {};
    let successCount = runnable.filter(
      (window2) => (window2.restoreMode ?? "open-content") === "launch-only" && readyAppBundles.has(window2.bundleId)
    ).length;
    for (const recipe of obsidianWindows) {
      for (const [index, content] of [...recipe.contents].sort((a, b) => a.order - b.order).entries()) {
        try {
          await this.openObsidianUrl(content.url, recipe.openMode, index > 0);
          successCount += 1;
          items.push({ status: "success", label: `Obsidian \xB7 ${content.title}` });
        } catch (cause) {
          items.push({
            status: "failed",
            label: `Obsidian \xB7 ${content.title}`,
            detail: messageOf2(cause),
            windowId: recipe.id
          });
        }
      }
    }
    if (browserWindows.length > 0) {
      const result = await this.native.browserRestore({ windows: browserWindows });
      if (!result.ok) {
        items.push({
          status: "failed",
          label: "\u6D4F\u89C8\u5668",
          detail: result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"
        });
      } else {
        for (const receipt of result.value ?? []) {
          const recipe = browserWindows.find((window2) => window2.id === receipt.recipeId);
          const label = recipe?.name ?? receipt.recipeId;
          const browserLabel = recipe?.appName ?? receipt.browserId ?? "\u6D4F\u89C8\u5668";
          if (receipt.ok) {
            successCount += 1;
            items.push({
              status: "success",
              label: `${browserLabel} \xB7 ${label}`,
              detail: receipt.action
            });
          } else if (receipt.errors.length === 0) {
            items.push({
              status: "skipped",
              label: `${browserLabel} \xB7 ${label}`,
              windowId: recipe?.id
            });
          }
          if (receipt.frame || receipt.activeTitle) {
            matchHints[receipt.recipeId] = {
              ...receipt.frame ? { approximateFrame: receipt.frame } : {},
              ...receipt.activeTitle ? { title: receipt.activeTitle } : {}
            };
          }
          for (const skipped of receipt.skipped) {
            items.push({
              status: "skipped",
              label: `${browserLabel} \xB7 ${label}`,
              detail: `${skipped.url} \u2014 ${skipped.reason}`,
              windowId: recipe?.id
            });
          }
          for (const error2 of receipt.errors) {
            items.push({
              status: "failed",
              label: `${browserLabel} \xB7 ${label}`,
              detail: `${error2.url ? `${error2.url} \u2014 ` : ""}${error2.message}`,
              windowId: recipe?.id
            });
          }
        }
      }
    }
    const arrange = await this.native.arrange({
      windows: runnable,
      matchHints
    });
    if (!arrange.ok) {
      items.push({
        status: "degraded",
        label: "\u7A97\u53E3\u5E03\u5C40",
        detail: arrange.error?.message ?? "\u672A\u77E5\u9519\u8BEF"
      });
    } else {
      for (const arranged of arrange.value ?? []) {
        const recipe = runnable.find((window2) => window2.id === arranged.id);
        if (!arranged.ok) {
          const isLaunchOnly = (recipe?.restoreMode ?? "open-content") === "launch-only";
          items.push({
            status: "degraded",
            label: `\u5E03\u5C40 \xB7 ${recipe?.name ?? arranged.id}`,
            detail: isLaunchOnly && arranged.message === "No unambiguous matching window appeared." ? "\u5E94\u7528\u5DF2\u542F\u52A8\uFF0C\u4F46\u672A\u627E\u5230\u53EF\u5B89\u5168\u8C03\u6574\u5E03\u5C40\u7684\u5339\u914D\u7A97\u53E3\u3002" : arranged.message,
            windowId: recipe?.id
          });
        } else if (recipe?.adapter === "manual") {
          successCount += 1;
          items.push({
            status: "success",
            label: `Manual \xB7 ${recipe.name}`,
            detail: arranged.message
          });
        }
      }
    }
    new RestoreResultsModal(this.app, workspace.name, items, {
      onDiagnostics: () => this.showSystemDiagnostics(),
      onEditWindow: sourceFile ? (windowId) => this.editWindowById(sourceFile, windowId) : void 0
    }).open();
    const failed = items.filter((item) => item.status === "failed").length;
    const degraded = items.filter((item) => item.status === "degraded").length;
    new import_obsidian3.Notice(
      `Workspace Bookmark\uFF1A\u6210\u529F ${successCount}\uFF0C\u5931\u8D25 ${failed}\uFF0C\u964D\u7EA7 ${degraded}\u3002`,
      8e3
    );
    return { successCount, items };
  }
  async browserStatusAfterEnsure(windows) {
    const needed = new Set(
      windows.filter(
        (window2) => window2.adapter === "browser" && (window2.restoreMode ?? "open-content") === "open-content" && window2.browserId
      ).map((window2) => window2.browserId)
    );
    if (needed.size === 0) return null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (attempt > 0) await wait2(1e3);
      const result = await this.native.browserStatus();
      if (!result.ok || !result.value) continue;
      const connected = new Set(
        result.value.sources.filter((source) => source.connected).map((source) => source.browserId)
      );
      if ([...needed].every((browserId) => connected.has(browserId))) {
        return result.value;
      }
      if (attempt === 3) return result.value;
    }
    return null;
  }
  async openObsidianUrl(url, openMode, newTab) {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:") {
      throw new Error("\u4EC5\u652F\u6301 Obsidian URI\u3002");
    }
    if (parsed.hostname === "adv-uri") {
      window.open(url);
      return;
    }
    if (parsed.hostname !== "open") {
      throw new Error("\u4EC5\u652F\u6301 obsidian://open \u6216 obsidian://adv-uri URI\u3002");
    }
    if (openMode === "app-default") {
      window.open(url);
      return;
    }
    const vault = parsed.searchParams.get("vault");
    const path = parsed.searchParams.get("file");
    if (vault === this.app.vault.getName() && path) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian3.TFile) {
        if (openMode === "focus-existing") {
          const existing = this.app.workspace.getLeavesOfType("markdown").find((leaf) => leaf.view.file?.path === file.path);
          if (existing) {
            this.app.workspace.setActiveLeaf(existing, { focus: true });
            return;
          }
        }
        await this.app.workspace.getLeaf(newTab ? "tab" : false).openFile(file);
        return;
      }
    }
    window.open(url);
  }
  async openWindowAtLine(file, line) {
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    const section = sectionAtLine(parsed, line);
    if (!section?.recipe) {
      new DiagnosticsModal(this.app, file.path, parsed.diagnostics).open();
      return;
    }
    await this.runOperation(
      `\u6B63\u5728\u6253\u5F00 \xB7 ${section.name}`,
      () => this.restoreWorkspace({
        id: parsed.workspace?.id ?? createWorkspaceId(),
        name: section.name,
        schemaVersion: parsed.workspace?.schemaVersion ?? 4,
        tags: [],
        windows: [section.recipe]
      }, file)
    );
  }
  async editWindowAtLine(file, line) {
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    const section = sectionAtLine(parsed, line);
    if (!section?.recipe) {
      new DiagnosticsModal(this.app, file.path, parsed.diagnostics).open();
      return;
    }
    await this.editWindowById(file, section.recipe.id);
  }
  async editWindowById(file, windowId) {
    let source = await this.app.vault.read(file);
    let parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      const migrated = await this.migrateWorkspaceWithConfirmation(file, source);
      if (!migrated) return;
      source = migrated;
      parsed = this.parse(source);
    }
    const section = parsed.sections.find((candidate) => candidate.recipe?.id === windowId);
    if (!section?.recipe) {
      new import_obsidian3.Notice(`\u672A\u627E\u5230 Window\uFF1A${windowId}`);
      return;
    }
    new WindowEditorModal(this.app, section.recipe, async (recipe) => {
      let failure = "";
      let changed = false;
      await this.app.vault.process(file, (currentSource) => {
        const currentParsed = this.parse(currentSource);
        if (!currentParsed.workspace || currentParsed.diagnostics.some((item) => item.severity === "error")) {
          failure = "Workspace \u5DF2\u53D8\u4E3A\u65E0\u6548\u6587\u6863\uFF0C\u672A\u4FDD\u5B58\u7F16\u8F91\u3002";
          return currentSource;
        }
        if (targetSectionsChanged(
          source,
          parsed,
          currentSource,
          currentParsed,
          [windowId]
        )) {
          failure = "\u8BE5 Window \u5DF2\u5728\u7F16\u8F91\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u7F16\u8F91\u8868\u5355\u3002";
          return currentSource;
        }
        const currentSection = currentParsed.sections.find(
          (candidate) => candidate.recipe?.id === windowId
        );
        if (!currentSection) {
          failure = "\u76EE\u6807 Window \u5DF2\u4E0D\u5B58\u5728\u3002";
          return currentSource;
        }
        const updated = replaceWindowSection(currentSource, currentSection, recipe);
        changed = updated !== currentSource;
        return updated;
      });
      if (failure) {
        new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${failure}`, 8e3);
      } else {
        new import_obsidian3.Notice(changed ? `\u5DF2\u66F4\u65B0 Window\uFF1A${recipe.name}` : "Window \u6CA1\u6709\u53D8\u5316\u3002");
      }
    }).open();
  }
  async validateAndFormatCurrent() {
    const file = this.getActiveManagedFile();
    if (!file) return;
    const source = await this.app.vault.read(file);
    const parsed = this.parse(source);
    if (!this.ensureExecutable(file, parsed)) return;
    if (parsed.workspace && parsed.workspace.schemaVersion < 4) {
      await this.migrateWorkspaceWithConfirmation(file, source);
      return;
    }
    const formatted = formatWorkspaceMarkdown(source, parsed);
    if (formatted === source) {
      new DiagnosticsModal(this.app, `\u6821\u9A8C\uFF1A${file.path}`, parsed.diagnostics).open();
      return;
    }
    const confirmed = await new Promise((resolve) => {
      new WorkspaceRepairPreviewModal(this.app, [{
        kind: "format",
        from: "\u5F53\u524D\u53D7\u7BA1\u8868\u683C\u683C\u5F0F",
        to: "Workspace Bookmark 0.2.12 \u89C4\u8303\u683C\u5F0F"
      }], resolve).open();
    });
    if (!confirmed) return;
    let applied = false;
    await this.app.vault.process(file, (currentSource) => {
      if (currentSource !== source) return currentSource;
      applied = true;
      return formatted;
    });
    if (!applied) {
      new import_obsidian3.Notice("Workspace \u5728\u683C\u5F0F\u5316\u786E\u8BA4\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u672A\u5199\u5165\u3002");
      return;
    }
    new DiagnosticsModal(
      this.app,
      `\u6821\u9A8C\uFF1A${file.path}`,
      this.parse(formatted).diagnostics
    ).open();
  }
  async validateCurrentForCli() {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian3.TFile) || !this.isManagedWorkspace(file)) {
      return "Active file is not a managed Workspace.";
    }
    const parsed = this.parse(await this.app.vault.read(file));
    const errors = parsed.diagnostics.filter((item) => item.severity === "error");
    return errors.length === 0 ? `${file.path}: valid` : `${file.path}: ${errors.length} error(s)
${errors.map((item) => `${item.code}: ${item.message}`).join("\n")}`;
  }
  async browseWorkspaces() {
    const items = await this.collectWorkspaceItems();
    new WorkspaceBrowserModal(this.app, items, async (item) => {
      await this.openWorkspaceFile(item.file);
    }, async (item) => {
      await this.copyWorkspaceLaunchUrl(item.file);
    }).open();
  }
  async showSystemDiagnostics() {
    const [doctor, browser] = await Promise.all([
      this.native.doctor(),
      this.native.browserSnapshot()
    ]);
    const activeFile = this.app.workspace.getActiveFile();
    const managed = activeFile instanceof import_obsidian3.TFile && this.isManagedWorkspace(activeFile);
    const parsed = managed ? this.parse(await this.app.vault.cachedRead(activeFile)) : null;
    const browserSources = browser.value?.sources ?? doctor.value?.browserSources ?? [];
    const report = {
      pluginVersion: this.manifest.version,
      managedFolder: this.settings.managedFolder,
      workspacectlPath: this.settings.workspacectlPath,
      items: [
        {
          label: "workspacectl",
          ok: doctor.ok,
          value: doctor.ok ? "\u53EF\u6267\u884C\u5E76\u8FD4\u56DE\u7ED3\u6784\u5316\u7ED3\u679C\u3002" : doctor.error?.code ?? "\u4E0D\u53EF\u6267\u884C",
          help: doctor.error?.message ?? "\u68C0\u67E5\u8BBE\u7F6E\u4E2D\u7684\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u7136\u540E\u91CD\u65B0\u6784\u5EFA\u539F\u751F\u7EC4\u4EF6\u3002"
        },
        {
          label: "Accessibility",
          ok: doctor.value?.accessibilityTrusted === true,
          value: doctor.value?.accessibilityTrusted ? "\u5DF2\u6388\u6743" : "\u672A\u6388\u6743",
          help: "\u6253\u5F00 \u7CFB\u7EDF\u8BBE\u7F6E \u2192 \u9690\u79C1\u4E0E\u5B89\u5168\u6027 \u2192 \u8F85\u52A9\u529F\u80FD\uFF0C\u4E3A workspacectl \u6388\u6743\u3002"
        },
        ...browserSources.flatMap((source) => {
          const doctorSource = doctor.value?.browserSources.find(
            (candidate) => candidate.browserId === source.browserId
          );
          const windows = "windows" in source ? source.windows : [];
          const tabCount = windows.reduce(
            (total, browserWindow) => total + browserWindow.tabs.length,
            0
          );
          return [
            {
              label: `${source.browserName} Native Host`,
              ok: doctorSource?.installed === true,
              value: doctorSource?.installed ? "\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5",
              help: `\u8FD0\u884C npm run install:browser-host -- --browser=${source.browserId} --extension-id=<\u6269\u5C55 ID>\u3002`
            },
            {
              label: `${source.browserName} Browser Bridge`,
              ok: source.connected === true,
              value: source.connected ? `${windows.length} \u4E2A\u666E\u901A\u7A97\u53E3\uFF0C${tabCount} \u4E2A\u6807\u7B7E\u9875` : source.error?.code ?? "\u672A\u8FDE\u63A5",
              help: source.error?.message ?? `\u4FDD\u6301 ${source.browserName} \u8FD0\u884C\uFF0C\u5E76\u91CD\u65B0\u52A0\u8F7D Workspace Bookmark \u6269\u5C55\u3002`
            }
          ];
        }),
        {
          label: "\u5F53\u524D\u6587\u6863\u4F5C\u7528\u57DF",
          ok: managed,
          value: managed ? activeFile.path : "\u5F53\u524D\u6587\u6863\u4E0D\u5728\u53D7\u7BA1\u76EE\u5F55\u4E2D\uFF0C\u6216\u7F3A\u5C11 type: workspace\u3002"
        },
        {
          label: "\u5F53\u524D Workspace Schema",
          ok: parsed != null && !parsed.diagnostics.some((item) => item.severity === "error"),
          value: parsed ? `${parsed.diagnostics.filter((item) => item.severity === "error").length} \u4E2A\u9519\u8BEF\uFF0C${parsed.workspace?.windows.length ?? 0} \u4E2A Window` : "\u672A\u68C0\u67E5\u975E\u53D7\u7BA1\u6587\u6863"
        }
      ]
    };
    new SystemDiagnosticsModal(this.app, report, () => this.showSystemDiagnostics()).open();
    await this.refreshRuntimeStatus(doctor);
  }
  async collectWorkspaceItems() {
    const items = [];
    const recentById = new Map(
      this.settings.recentWorkspaces.map((item) => [
        item.workspaceId,
        item.lastOpenedAt
      ])
    );
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!this.isManagedWorkspace(file)) continue;
      const parsed = this.parse(await this.app.vault.cachedRead(file));
      if (!parsed.workspace) continue;
      const apps = [...new Set(parsed.workspace.windows.map((window2) => window2.appName))];
      const monitors = [...new Set(parsed.workspace.windows.map((window2) => window2.monitor))];
      const urlTitles = parsed.workspace.windows.flatMap(
        (window2) => window2.contents.map((content) => `${content.title} ${content.url}`)
      );
      items.push({
        file,
        id: parsed.workspace.id,
        name: parsed.workspace.name,
        tags: parsed.workspace.tags,
        apps,
        monitors,
        windowCount: parsed.workspace.windows.length,
        contentCount: parsed.workspace.windows.reduce(
          (total, window2) => total + window2.contents.length,
          0
        ),
        lastOpenedAt: recentById.get(parsed.workspace.id),
        searchable: [
          parsed.workspace.name,
          ...parsed.workspace.tags,
          ...apps,
          ...urlTitles
        ].join(" ").toLowerCase()
      });
    }
    return items.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }
  async recordRecentWorkspace(workspaceId) {
    this.settings.recentWorkspaces = updateRecentWorkspaces(
      this.settings.recentWorkspaces,
      workspaceId,
      (/* @__PURE__ */ new Date()).toISOString()
    );
    await this.saveSettings();
  }
  async ensureFolder(folder) {
    const segments = (0, import_obsidian3.normalizePath)(folder).split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!await this.app.vault.adapter.exists(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }
  parse(source) {
    return parseWorkspaceMarkdown(source, { trustedSchemes: this.settings.trustedSchemes });
  }
  ensureExecutable(file, parsed) {
    if (!parsed.managed || !parsed.workspace) {
      new import_obsidian3.Notice(`${file.path} \u4E0D\u662F\u53EF\u6267\u884C Workspace\u3002`);
      return false;
    }
    if (parsed.diagnostics.some((item) => item.severity === "error")) {
      new DiagnosticsModal(this.app, `\u65E0\u6CD5\u6267\u884C\uFF1A${file.path}`, parsed.diagnostics).open();
      return false;
    }
    return true;
  }
  getActiveManagedFile() {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian3.TFile) || !this.isManagedWorkspace(file)) {
      new import_obsidian3.Notice("\u5F53\u524D\u6587\u6863\u4E0D\u5728\u53D7\u7BA1\u76EE\u5F55\u4E2D\uFF0C\u6216\u7F3A\u5C11 type: workspace\u3002");
      return null;
    }
    return file;
  }
  isManagedWorkspace(file) {
    if (!(file instanceof import_obsidian3.TFile) || file.extension !== "md") return false;
    const folder = normalizeManagedFolder(this.settings.managedFolder);
    if (!isPathInManagedFolder(file.path, folder)) return false;
    return this.app.metadataCache.getFileCache(file)?.frontmatter?.type === "workspace";
  }
  async runOperation(label, task) {
    if (this.activeOperation) {
      new import_obsidian3.Notice(`Workspace Bookmark \u6B63\u5728\u6267\u884C\u201C${this.activeOperation}\u201D\uFF0C\u8BF7\u7A0D\u5019\u3002`);
      return null;
    }
    this.activeOperation = label;
    this.renderRuntimeStatus("busy", label);
    try {
      return await task();
    } catch (cause) {
      new import_obsidian3.Notice(`Workspace Bookmark\uFF1A${messageOf2(cause)}`, 8e3);
      return null;
    } finally {
      this.activeOperation = null;
      void this.refreshRuntimeStatus();
    }
  }
  async refreshRuntimeStatus(existingDoctor) {
    if (this.activeOperation) return;
    const doctor = existingDoctor ?? await this.native.doctor();
    if (!doctor.ok || !doctor.value) {
      this.renderRuntimeStatus("error", "\u63A7\u5236\u5668\u4E0D\u53EF\u7528");
      return;
    }
    const offlineBrowsers = doctor.value.browserSources.filter((source) => !source.connected).map((source) => source.browserName);
    if (!doctor.value.accessibilityTrusted || offlineBrowsers.length > 0) {
      const missing = [
        !doctor.value.accessibilityTrusted ? "\u8F85\u52A9\u529F\u80FD" : "",
        ...offlineBrowsers
      ].filter(Boolean).join(" / ");
      this.renderRuntimeStatus("warning", `${missing} \u5F85\u5904\u7406`);
      return;
    }
    this.renderRuntimeStatus("ready", "\u5DF2\u5C31\u7EEA");
  }
  renderRuntimeStatus(state, label) {
    if (!this.statusBarItem) return;
    this.statusBarItem.empty();
    this.statusBarItem.className = `status-bar-item workspace-bookmark-status is-${state}`;
    const icon = this.statusBarItem.createSpan();
    const icons = {
      checking: "loader-circle",
      busy: "loader-circle",
      ready: "circle-check",
      warning: "triangle-alert",
      error: "circle-x"
    };
    (0, import_obsidian3.setIcon)(icon, icons[state]);
    this.statusBarItem.createSpan({ text: `Workspace \xB7 ${label}` });
  }
};
function restoreItemForEnsuredApp(item) {
  const labels = {
    "already-running": "\u5DF2\u5728\u8FD0\u884C",
    launched: "\u5DF2\u542F\u52A8",
    "not-found": "\u672A\u627E\u5230 App",
    "launch-failed": "\u542F\u52A8\u5931\u8D25"
  };
  return {
    status: item.ok ? "success" : "skipped",
    label: `App \xB7 ${item.appName}`,
    detail: labels[item.status] ?? item.message,
    windowId: item.id
  };
}
function sectionAtLine(parsed, line) {
  return parsed.sections.find((section) => line >= section.headingLine && line < section.endLine) ?? null;
}
function extractUntrustedSchemes(parsed) {
  const schemes = parsed.diagnostics.filter((item) => item.code === "UNTRUSTED_SCHEME").map((item) => /“([^”]+)”/.exec(item.message)?.[1] ?? "").filter(Boolean);
  return [...new Set(schemes)];
}
function sanitizeFileName(value) {
  return value.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "Untitled Workspace";
}
function messageOf2(cause) {
  return cause instanceof Error ? cause.message : String(cause);
}
function wait2(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
function browserDescriptorForBundle(bundleId) {
  if (bundleId === "com.google.Chrome") {
    return { id: "chrome", name: "Google Chrome" };
  }
  if (bundleId === "com.tabbit-ai.Tabbit" || bundleId.startsWith("com.tabbit-ai.Tabbit.app.")) {
    return { id: "tabbit", name: "Tabbit" };
  }
  return null;
}
