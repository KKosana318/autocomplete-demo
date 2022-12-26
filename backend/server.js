const http = require("http");
const webSocketServer = require("websocket").server;
const elasticClient = require("./elastic-client");
const { v4: uuidv4 } = require("uuid");

// create http server
const httpServer = http.createServer();
httpServer.listen(8000);

// create websocket server
const wsServer = new webSocketServer({ httpServer: httpServer });

// store all clients
const clients = {};

wsServer.on("request", (request) => {
    var userID = uuidv4();
    console.log("Received a request from " + userID + " at " + new Date());

    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    console.log("Connected: " + userID + " in " + Object.getOwnPropertyNames(clients));

    connection.on("message", (content) => {
        if (content.type === "utf8") {
            formattedContent = JSON.parse(content.utf8Data);

            if (formattedContent.type === "search") {
                const query = formattedContent.query;
                const result = elasticClient
                    .search({
                        index: "suggestions",
                        query: {
                            query_string: { default_field: "name", query: "*" + query + "*" },
                        },
                    })
                    .then((result) => {
                        let values = [];

                        if (result.hits && result.hits.hits) {
                            values = result.hits.hits.map((hit) => hit._source.name);
                        }

                        clients[userID].sendUTF(JSON.stringify({ type: "search", values: values }));
                    });
            }
        }
    });
});
