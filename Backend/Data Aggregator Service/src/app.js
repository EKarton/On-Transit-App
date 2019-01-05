"use strict";

(async () => {
    await require("./raw-data-collectors/runner")();
    console.log("== Finished Raw Data Collection ==");
    await require("./pre-processing-aggregators/runner")();
    console.log("== Finished Pre Processing Data Aggregation ==");
    await require("./final-processing-aggregators/runner")();
})();