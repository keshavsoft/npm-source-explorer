/**
 * ExplorationStory tracks the narrative journey of discovering
 * and downloading upstream repositories for any npm package.
 */
export class ExplorationStory {
  constructor(packageSpec, destination, onProgress) {
    this.packageSpec = packageSpec;
    this.destination = destination;
    this.onProgress = typeof onProgress === "function" ? onProgress : () => {};
    this.startedAt = Date.now();
    this.results = [];
  }

  notify(event) {
    this.onProgress({
      packageSpec: this.packageSpec,
      destination: this.destination,
      ...event
    });
  }

  startResolving() {
    this.notify({
      chapter: 1,
      stage: "resolving",
      title: "Discovering Dependency Tree",
      timestamp: new Date().toLocaleTimeString()
    });
  }

  resolvedTree(dependencies, uniqueRepositories) {
    this.notify({
      chapter: 2,
      stage: "resolved",
      title: "Identified Authentic Repositories",
      totalPackages: dependencies.length,
      uniqueCount: uniqueRepositories.length,
      durationMs: Date.now() - this.startedAt
    });
  }

  startClone(index, total, repo) {
    this.notify({
      chapter: 3,
      stage: "cloning-start",
      title: "Downloading Sibling Repository",
      index,
      total,
      name: repo.name,
      folder: repo.folder,
      repoUrl: repo.repoUrl,
      startedAt: new Date().toLocaleTimeString()
    });
  }

  finishClone(index, total, repo, outcome) {
    const record = {
      index,
      total,
      name: repo.name,
      folder: repo.folder,
      repoUrl: repo.repoUrl,
      status: outcome.status,
      durationMs: outcome.durationMs,
      isInferred: Boolean(outcome.isInferred || repo.isInferred),
      detail: outcome.detail || null,
      error: outcome.error || null
    };

    this.results.push(record);

    this.notify({
      chapter: 3,
      stage: "cloning-finish",
      ...record
    });
  }

  finish(results) {
    const totalDurationMs = Date.now() - this.startedAt;
    const clonedCount = results.filter((r) => r.status === "cloned").length;
    const skippedCount = results.filter((r) => r.status === "skipped" || r.status === "skipped-unlinked").length;
    const failedCount = results.filter((r) => r.status === "failed" || r.status === "timed-out").length;

    const summary = {
      packageSpec: this.packageSpec,
      destination: this.destination,
      totalPackages: results.length,
      uniqueRepositories: results.length,
      clonedCount,
      skippedCount,
      failedCount,
      totalDurationMs,
      results
    };

    this.notify({
      stage: "completed",
      title: "Exploration Complete",
      summary
    });

    return summary;
  }
}

