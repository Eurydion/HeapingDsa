# 🏗️ The Heap Builder

**The Heap Builder** is an interactive, web-based visualization tool for learning Data Structures. It demonstrates exactly how **Max Heaps** and **Min Heaps** work by animating the construction, insertion, and extraction processes in real-time.

![Heap Visualization](https://postimg.cc/2bphzXR6)

## 🌟 Features

* **Dual Modes:** Toggle instantly between **Max Heap** (root is largest) and **Min Heap** (root is smallest).
* **Physics-Based Animations:** Nodes physically fly to their new positions during swaps, making the algorithm easy to follow.
* **Dynamic Tree Layout:** * Automatically calculates node positions based on tree depth.
  * Includes a scrollable canvas to handle large/deep trees without overlapping nodes.
* **Interactive Operations:**
  * **Insert:** Add specific numbers (0-999).
  * **Extract:** Remove the root (Max or Min) and watch the heap re-balance.
  * **Bulk Load:** Input a comma-separated list of numbers to build a heap from scratch.
* **Responsive Design:** Built with Tailwind CSS to look good on different screen sizes.

## 🛠️ Tech Stack

* **HTML5:** Semantic structure.
* **CSS3:** Custom animations and transitions combined with **Tailwind CSS** (via CDN) for layout.
* **JavaScript (ES6+):** Vanilla JS for the heap algorithms, DOM manipulation, and canvas rendering. No external frameworks (React/Vue) required.

## 📂 Project Structure

```text
/heap-builder
│
├── index.html      # Main structure and UI
├── styles.css      # Custom animations and node styling
├── script.js       # Logic for Heap class, Canvas drawing, and events
└── README.md       # Documentation
