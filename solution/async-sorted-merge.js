"use strict";
const Heap = require('heap');

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = async (logSources, printer) => {
  // Min-heap to order log entries chronologically
  const heap = new Heap((a, b) => a.logEntry.date - b.logEntry.date);

  // A Set to track which sources still have entries
  const activeSources = new Set();

  // Batch fetching configuration
  const MAX_HEAP_SIZE = 100000000;
  const BURST_SIZE = 100;

  // Helper function to fetch the next log entry from a source
  const fetchNextLog = async (sourceId) => {
    try {
      const logEntry = await logSources[sourceId].popAsync();
      if (logEntry && logEntry.date) { // Ensure the entry is valid and has a date
        heap.push({ logEntry, sourceId });
        activeSources.add(sourceId);
      } else {
        // If the source is drained, remove it from the active sources
        activeSources.delete(sourceId);
      }
    } catch (error) {
      console.error(`Error fetching log from source ${sourceId}:`, error);
    }
  };

  // Initialize the heap with the first log entry of each log source
  await Promise.all(logSources.map((_, sourceId) => fetchNextLog(sourceId)));

  // Process log entries in chronological order
  while (activeSources.size > 0 || !heap.empty()) {
    // Print entries in chronological order
    while (!heap.empty()) {
      const { logEntry, sourceId } = heap.pop();
      if (logEntry) {
        printer.print(logEntry);
        // Fetch the next log entry from the same source
        await fetchNextLog(sourceId);
      }
    }

    // When the heap is running low, fetch a burst of log entries concurrently
    if (heap.size() < MAX_HEAP_SIZE) {
      await Promise.all(
        Array.from(activeSources).slice(0, BURST_SIZE).map((sourceId) => fetchNextLog(sourceId))
      );
    }
  }

  printer.done();

  console.log("Async sort complete.")
};
