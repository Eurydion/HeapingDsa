// --- GLOBAL CONFIGURATION ---
const ANIMATION_DELAY = 500; 
let isAnimating = false;

// Canvas & Containers
const canvas = document.getElementById('heapCanvas');
const ctx = canvas.getContext('2d');
const nodeContainer = document.getElementById('heapNodesContainer');
const scrollContainer = document.getElementById('scrollContainer');

// Dimensions
const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 80;
const MIN_NODE_SPACING = 60; // Minimum horizontal space between nodes

// State
let currentHeapType = 'MaxHeap';
let currentHeap = null; // Initialized in window.onload
let positions = []; 


// --- HELPERS ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const parent = (index) => Math.floor(index / 2);
const left_child = (index) => 2 * index;
const right_child = (index) => 2 * index + 1;


// --- 1. HEAP CLASSES ---

class BaseHeap {
    constructor() {
        this.heap = [null]; // Array used for 1-based indexing
    }

    async swap(i, j) {
        // 1. Get the actual DOM elements currently at these indices
        const nodeI = document.getElementById(`node-${i}`);
        const nodeJ = document.getElementById(`node-${j}`);

        // 2. Get the target coordinates from our calculated positions
        const posI = positions[i];
        const posJ = positions[j];

        // 3. Highlight them
        if (nodeI) highlightNode(i, 'swap');
        if (nodeJ) highlightNode(j, 'swap');

        // Wait a tiny bit for highlight
        await sleep(100); 

        // 4. VISUAL SWAP: Move the HTML elements to their new destinations
        if (nodeI && nodeJ) {
            // Move Node I to Position J
            nodeI.style.left = `${posJ.x - NODE_RADIUS}px`;
            nodeI.style.top = `${posJ.y - NODE_RADIUS}px`;

            // Move Node J to Position I
            nodeJ.style.left = `${posI.x - NODE_RADIUS}px`;
            nodeJ.style.top = `${posI.y - NODE_RADIUS}px`;
        }

        // 5. Wait for CSS transition
        await sleep(ANIMATION_DELAY);

        // 6. LOGICAL SWAP: Update internal array
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];

        // 7. ID SWAP: Swap the HTML IDs so DOM matches internal array
        if (nodeI && nodeJ) {
            nodeI.id = `node-${j}`;
            nodeJ.id = `node-${i}`;
            
            // Optional: Swap titles for hover accuracy
            const tempTitle = nodeI.title;
            nodeI.title = nodeJ.title;
            nodeJ.title = tempTitle;
        }

        // 8. Update array display text
        updateArrayDisplay();

        // 9. Remove highlights
        unhighlightNode(i);
        unhighlightNode(j);
    }

    peek() { return this.heap.length > 1 ? this.heap[1] : null; }
    isEmpty() { return this.heap.length <= 1; }
}

class MaxHeap extends BaseHeap {
    async insert(value) {
        isAnimating = true;
        this.heap.push(value);
        let index = this.heap.length - 1;
        
        updateVisualization(true); 
        highlightNode(index, 'insert');
        await sleep(ANIMATION_DELAY);
        unhighlightNode(index);

        while (index > 1) {
            const parentIndex = parent(index);
            if (this.heap[parentIndex] < this.heap[index]) {
                await this.swap(parentIndex, index); 
                index = parentIndex;
            } else { break; }
        }
        isAnimating = false;
        updateVisualization(true);
    }

    async heapify(index) {
        let largest = index;
        const left = left_child(index);
        const right = right_child(index);
        const n = this.heap.length;

        if (left < n && this.heap[left] > this.heap[largest]) largest = left;
        if (right < n && this.heap[right] > this.heap[largest]) largest = right;

        if (largest !== index) {
            await this.swap(index, largest);
            await this.heapify(largest); 
        }
    }

    async extract() {
        if (this.isEmpty()) return null;
        isAnimating = true;
        const maxValue = this.heap[1];
        
        highlightNode(1, 'extract');
        await sleep(ANIMATION_DELAY * 2);

        if (this.heap.length === 2) {
            this.heap.pop();
        } else {
            this.heap[1] = this.heap.pop();
            // No animation for the replacement, we just rebuild and heapify down
            // (Ideally we'd animate the last node moving to root, but simpler to just re-render then sink)
            updateVisualization(true); 
            await this.heapify(1);
        }
        
        isAnimating = false;
        updateVisualization(true);
        return maxValue;
    }
}

class MinHeap extends BaseHeap {
    async insert(value) {
        isAnimating = true;
        this.heap.push(value);
        let index = this.heap.length - 1;

        updateVisualization(true); 
        highlightNode(index, 'insert');
        await sleep(ANIMATION_DELAY);
        unhighlightNode(index);

        while (index > 1) {
            const parentIndex = parent(index);
            if (this.heap[parentIndex] > this.heap[index]) {
                await this.swap(parentIndex, index);
                index = parentIndex;
            } else { break; }
        }
        isAnimating = false;
        updateVisualization(true);
    }

    async heapify(index) {
        let smallest = index;
        const left = left_child(index);
        const right = right_child(index);
        const n = this.heap.length;

        if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
        if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;

        if (smallest !== index) {
            await this.swap(index, smallest);
            await this.heapify(smallest);
        }
    }

    async extract() {
        if (this.isEmpty()) return null;
        isAnimating = true;
        const minValue = this.heap[1];
        
        highlightNode(1, 'extract'); 
        await sleep(ANIMATION_DELAY * 2);

        if (this.heap.length === 2) {
            this.heap.pop();
        } else {
            this.heap[1] = this.heap.pop();
            updateVisualization(true);
            await this.heapify(1);
        }
        
        isAnimating = false;
        updateVisualization(true);
        return minValue;
    }
}


// --- 2. UI & VISUALIZATION LOGIC ---

function showMessage(text, isError = false) {
    const box = document.getElementById('messageBox');
    box.textContent = text;
    box.className = 'message-box pointer-events-none opacity-100';
    box.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => {
        box.classList.remove(isError ? 'bg-red-500' : 'bg-green-500');
        box.classList.add('opacity-0');
    }, 3000);
}

function highlightNode(index, type) {
    const nodeDiv = document.getElementById(`node-${index}`);
    if (!nodeDiv) return;
    nodeDiv.classList.add(`node-highlight-${type}`);
}

function unhighlightNode(index) {
    const nodeDiv = document.getElementById(`node-${index}`);
    if (!nodeDiv) return;
    nodeDiv.classList.remove('node-highlight-insert', 'node-highlight-swap', 'node-highlight-extract');
    nodeDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'; 
}

function calculateNodePositions(width) {
    positions = [null]; 
    const heapArray = currentHeap.heap;
    const size = heapArray.length - 1;
    if (size <= 0) return;

    const center_x = width / 2;
    
    // Offset logic: start with 1/4 of width
    function traverse_v2(index, level, x, horizontal_offset) {
        if (index >= heapArray.length) return;

        const y = 50 + (level * LEVEL_HEIGHT);
        positions[index] = { x, y };

        const next_h_offset = horizontal_offset / 2;

        traverse_v2(left_child(index), level + 1, x - horizontal_offset, next_h_offset);
        traverse_v2(right_child(index), level + 1, x + horizontal_offset, next_h_offset);
    }
    
    traverse_v2(1, 0, center_x, width / 4);
}

function drawEdges() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#9ca3af'; 
    ctx.lineWidth = 2;

    for (let i = 1; i < currentHeap.heap.length; i++) {
        const p = parent(i);
        if (i > 1 && positions[i] && positions[p]) {
            ctx.beginPath();
            ctx.moveTo(positions[p].x, positions[p].y + NODE_RADIUS); 
            ctx.lineTo(positions[i].x, positions[i].y - NODE_RADIUS);
            ctx.stroke();
        }
    }
}

function updateArrayDisplay() {
    document.getElementById('heapArrayDisplay').textContent = 
        `[${currentHeap.heap.slice(1).join(', ')}]`;
}

function renderNodes() {
    const heapArray = currentHeap.heap;
    const existingNodeIds = new Set();

    for (let i = 1; i < heapArray.length; i++) {
        const pos = positions[i];
        if (!pos) continue;

        let nodeDiv = document.getElementById(`node-${i}`);
        let isNew = false;
        
        if (!nodeDiv) {
            nodeDiv = document.createElement('div');
            nodeDiv.id = `node-${i}`;
            nodeDiv.className = 'node';
            isNew = true;
        }

        nodeDiv.textContent = heapArray[i];
        // Crucial: Update position. 
        // If called during a swap animation, this might jump, 
        // but we usually call this at start/end of ops.
        nodeDiv.style.left = `${pos.x - NODE_RADIUS}px`;
        nodeDiv.style.top = `${pos.y - NODE_RADIUS}px`;
        nodeDiv.title = `Index: ${i}`;
        
        nodeDiv.style.backgroundColor = '#6366f1'; 
        if (i === 1 && heapArray.length > 1) {
            nodeDiv.classList.add('node-highlight-root'); 
        } else {
             nodeDiv.classList.remove('node-highlight-root');
        }
        
        if (isNew) {
            nodeContainer.appendChild(nodeDiv);
        }
        existingNodeIds.add(`node-${i}`);
    }

    // Cleanup old nodes
    Array.from(nodeContainer.children).forEach(node => {
        if (!existingNodeIds.has(node.id)) {
            node.remove();
        }
    });
}

// Central Visual Update Function
function updateVisualization(recalculatePositions = true) {
    updateArrayDisplay();
    
    if (recalculatePositions) {
        const size = currentHeap.heap.length - 1;
        // 1. Calculate Depth
        const depth = size > 0 ? Math.floor(Math.log2(size)) + 1 : 1;
        
        // 2. Calculate Required Width based on leaves
        const maxLeaves = Math.pow(2, depth - 1);
        
        // 3. Calculate Width needed: Leaves * Minimum Spacing
        const containerWidth = scrollContainer.offsetWidth;
        const neededWidth = Math.max(containerWidth, maxLeaves * MIN_NODE_SPACING * 1.5);
        
        // 4. Apply Width
        canvas.width = neededWidth;
        canvas.style.width = `${neededWidth}px`; 
        nodeContainer.style.width = `${neededWidth}px`;
        
        calculateNodePositions(neededWidth);
    }
    
    drawEdges();
    renderNodes();
}


// --- 3. EVENT HANDLERS ---

async function insertElement() {
    if (isAnimating) return showMessage("Wait for animation...", true);
    const input = document.getElementById('insertValue');
    let value = parseInt(input.value);
    if (isNaN(value) || value < 0 || value > 999) return showMessage("Invalid Number", true);
    
    await currentHeap.insert(value);
    showMessage(`Inserted ${value}`);
    input.value = Math.floor(Math.random() * 100) + 1;
    document.getElementById('insertBtnText').textContent = `Insert (${input.value})`;
}

async function extractElement() {
    if (isAnimating) return showMessage("Wait for animation...", true);
    if (currentHeap.isEmpty()) return showMessage("Heap is empty", true);
    const extracted = await currentHeap.extract();
    showMessage(`Extracted: ${extracted}`);
}

async function loadArrayHandler() {
    if (isAnimating) return showMessage("Wait for animation...", true);
    const arrayInput = document.getElementById('loadArray').value;
    const values = arrayInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (values.length === 0) return showMessage("Invalid Array", true);

    isAnimating = true;
    const newHeap = currentHeapType === 'MaxHeap' ? new MaxHeap() : new MinHeap();
    newHeap.heap = [null, ...values];
    currentHeap = newHeap; 
    
    updateVisualization(true);
    showMessage(`Loading ${values.length} elements...`);
    await sleep(ANIMATION_DELAY * 2);

    // Build Heap (Heapify from bottom up)
    const n = newHeap.heap.length;
    for (let i = parent(n - 1); i >= 1; i--) { 
        await newHeap.heapify(i); 
    }
    
    isAnimating = false;
    updateVisualization(true);
    showMessage(`Built ${currentHeapType} with ${values.length} elements.`);
}

async function handleTypeChange() {
     if (isAnimating) return showMessage("Wait for animation...", true);
    const newType = document.getElementById('heapType').value;
    if (newType === currentHeapType) return;
    
    isAnimating = true;
    const existingValues = currentHeap.heap.slice(1);
    currentHeapType = newType;
    
    let newHeap = currentHeapType === 'MaxHeap' ? new MaxHeap() : new MinHeap();
    newHeap.heap = [null, ...existingValues];
    currentHeap = newHeap;
    
    updateVisualization(true);
    
    const n = currentHeap.heap.length;
    for (let i = parent(n - 1); i >= 1; i--) { 
        await currentHeap.heapify(i); 
    }
    
    document.getElementById('extractBtn').textContent = `Extract ${currentHeapType === 'MaxHeap' ? 'Max' : 'Min'}`;
    isAnimating = false;
    updateVisualization(true);
    showMessage(`Switched to ${currentHeapType}`);
}

// --- 4. INITIALIZATION ---

window.onload = function() {
    // Initialize Default Heap
    currentHeap = new MaxHeap();

    // Listeners
    document.getElementById('heapType').addEventListener('change', handleTypeChange);
    
    // Set initial Insert Value Randomly
    document.getElementById('insertValue').value = Math.floor(Math.random() * 100) + 1;
    document.getElementById('insertBtnText').textContent = `Insert (${document.getElementById('insertValue').value})`;
    
    // Initial Load
    loadArrayHandler(); 
};

window.addEventListener('resize', () => {
    if (!isAnimating) updateVisualization(true);
});