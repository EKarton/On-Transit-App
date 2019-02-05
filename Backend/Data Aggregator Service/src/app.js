"use strict";

(async () => {
    console.log("== Starting Raw Data Collection ==");
    await require("./raw-data-collectors/runner")();
    console.log("== Finished Raw Data Collection ==");

    console.log("== Starting Step 1 Data Processors ==");
    await require("./step-1-data-processors/runner")();
    console.log("== Finished Step 1 Data Processors ==");

    console.log("== Starting Step 2 Data Processors ==");
    await require("./step-2-data-processors/runner")();
    console.log("== Finished Step 2 Data Processors ==");

    console.log("== Starting Step 3 Data Processors ==");
    await require("./step-3-data-processors/runner")();
    console.log("== Finished Step 3 Data Processors ==");

    console.log("== Starting Step 4 Data Processors ==");
    await require("./step-4-data-processors/runner")();
    console.log("== Finished Step 4 Data Processors ==");

    // await require("./pre-processing-aggregators-v2/runner")();
    // console.log("== Finished Pre Processing Data Aggregation ==");
    // await require("./final-processing-aggregators/runner")();
})();

