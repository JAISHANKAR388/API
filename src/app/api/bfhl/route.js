import { NextResponse } from 'next/server';

function getCorsHeaders() {
    return {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: getCorsHeaders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
        return NextResponse.json(
            { is_success: false, message: "Invalid input" }, 
            { status: 400, headers: getCorsHeaders() }
        );
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const valid_edges = [];
    
    const seen_edges = new Set();
    const seen_children = new Set();

    data.forEach(entry => {
        if (typeof entry !== 'string') {
            invalid_entries.push(String(entry));
            return;
        }

        const trimmed = entry.trim();
        const isValid = /^[A-Z]->[A-Z]$/.test(trimmed);

        if (!isValid) {
            invalid_entries.push(entry);
            return;
        }

        if (seen_edges.has(trimmed)) {
            duplicate_edges.push(trimmed);
            return;
        }
        
        seen_edges.add(trimmed);

        const [parent, child] = trimmed.split('->');
        
        // Multi-parent case: discard subsequent parents
        if (seen_children.has(child)) {
            return; 
        }

        seen_children.add(child);
        valid_edges.push({parent, child, original: trimmed});
    });

    const adjacency = {};
    const nodes = new Set();

    valid_edges.forEach(({parent, child}) => {
        if (!adjacency[parent]) adjacency[parent] = [];
        adjacency[parent].push(child);
        nodes.add(parent);
        nodes.add(child);
    });

    const undirected_adj = {};
    nodes.forEach(n => undirected_adj[n] = []);
    valid_edges.forEach(({parent, child}) => {
        undirected_adj[parent].push(child);
        undirected_adj[child].push(parent);
    });

    const components = [];
    const visited = new Set();
    
    nodes.forEach(startNode => {
        if (!visited.has(startNode)) {
            const componentNodes = new Set();
            const queue = [startNode];
            visited.add(startNode);
            componentNodes.add(startNode);

            while (queue.length > 0) {
                const curr = queue.shift();
                undirected_adj[curr].forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        componentNodes.add(neighbor);
                        queue.push(neighbor);
                    }
                });
            }
            components.push(componentNodes);
        }
    });

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    
    let largest_tree_root = null; // Spec says string, but what if no valid trees? We can omit or keep null/empty string. 
    let max_depth = -1;

    function buildTree(root, current_path) {
        if (current_path.has(root)) {
            return { tree: {}, cycle_detected: true, depth: 0 };
        }

        current_path.add(root);
        const children = adjacency[root] || [];
        const treeObj = {};
        let cycle_detected = false;
        let p_max_depth = 1;

        for (const child of children) {
            const result = buildTree(child, current_path);
            if (result.cycle_detected) cycle_detected = true;
            treeObj[child] = result.tree;
            p_max_depth = Math.max(p_max_depth, 1 + result.depth);
        }

        current_path.delete(root);
        return { tree: treeObj, cycle_detected, depth: cycle_detected ? 0 : p_max_depth };
    }

    components.forEach(comp => {
        let potential_roots = [];
        comp.forEach(node => {
            let hasParent = false;
            for (let edge of valid_edges) {
                if (edge.child === node) {
                    hasParent = true;
                    break;
                }
            }
            if (!hasParent) potential_roots.push(node);
        });

        let root;
        if (potential_roots.length > 0) {
            if (potential_roots.length > 1) {
                 potential_roots.sort(); 
            }
            root = potential_roots[0];
        } else {
            let arr = Array.from(comp);
            arr.sort();
            root = arr[0];
        }

        const buildRes = buildTree(root, new Set());
        
        const hierarchyDetails = {
            root: root,
            tree: { [root]: buildRes.tree }
        };

        if (buildRes.cycle_detected) {
            hierarchyDetails.has_cycle = true;
            hierarchyDetails.tree = {};
            total_cycles++;
        } else {
            hierarchyDetails.depth = buildRes.depth;
            total_trees++;
            
            if (buildRes.depth > max_depth) {
                max_depth = buildRes.depth;
                largest_tree_root = root;
            } else if (buildRes.depth === max_depth) {
                if (largest_tree_root === null || root < largest_tree_root) {
                    largest_tree_root = root;
                }
            }
        }
        
        hierarchies.push(hierarchyDetails);
    });

    if (total_trees === 0) largest_tree_root = "";

    return NextResponse.json({
      user_id: "jaishankarmishra_07092004",
      email_id: "jm1879@srmist.edu.in",
      college_roll_number: "RA2311003050226",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root
      }
    }, {
        headers: getCorsHeaders()
    });

  } catch (error) {
    return NextResponse.json(
        { is_success: false, message: error.message }, 
        { status: 500, headers: getCorsHeaders() }
    );
  }
}
