import React, { useState, useEffect } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";

import MentionBox from "./components/mention-box";

const client = new W3CWebSocket("ws://127.0.0.1:8000");

function App() {
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        client.onopen = () => {
            console.log("connection opened");
        };

        client.onmessage = (message: MessageEvent) => {
            setSuggestions(JSON.parse(message.data).values);
        };
    }, []);

    const getSuggestions = (input: string) => {
        client.send(
            JSON.stringify({
                type: "search",
                query: input,
            })
        );
    };

    return (
        <div className="p-8 flex flex-col gap-5">
            <h1 className="text-3xl font-semibold">Autocomplete Demo</h1>
            <MentionBox filteredSuggestions={suggestions} getSuggestions={getSuggestions} />
        </div>
    );
}

export default App;
