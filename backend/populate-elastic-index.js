const elasticClient = require("./elastic-client");

async function populateElasticIndex() {
    await elasticClient.index({
        index: "suggestions",
        document: {
            name: "Anson Hwang",
            type: "person",
        },
    });

    // refresh to update index
    await elasticClient.indices.refresh({ index: "suggestions" });
}

populateElasticIndex();
