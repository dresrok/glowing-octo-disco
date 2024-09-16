"use strict";
const Heap = require('heap')

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  // Min-heap to order log entries chronologically
  const heap = new Heap((a, b) => a.logEntry.date - b.logEntry.date)

  // Helper function to add log entry to the heap
  const addToHeap = (sourceId) => {
    const logEntry = logSources[sourceId].pop();
    if (logEntry) {
      heap.push({ logEntry, sourceId })
    }
  }

  // Initialize the heap with the first log entry of each log source
  for (let i = 0; i < logSources.length; i++) {
    addToHeap(i)
  }

  // Process log entries in chronological order
  while (!heap.empty()) {
    // Get the earliest log entry
    const { logEntry, sourceId } = heap.pop();

    // Print the log entry
    printer.print(logEntry);

    // Fetch the next log entry from the same source and add it to the heap
    addToHeap(sourceId)
  }

  printer.done();

  return console.log("Sync sort complete.");
};
