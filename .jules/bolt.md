## 2025-02-07 - Inefficient Tree Cloning in Protocol Layer
**Learning:** `JSON.parse(JSON.stringify(target))` was used to clone the entire UI tree for every single patch operation. For large trees or frequent updates, this causes significant GC pressure and latency.
**Action:** Replaced deep cloning with structural sharing. Now, only the path to the modified node is recreated, while the rest of the tree is reused.
