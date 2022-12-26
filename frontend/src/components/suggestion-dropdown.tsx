import React from "react";

interface ISuggestionDropdownProps {
    filteredSuggestions: string[];
    matchedInput: string;
    highlightedSuggestion: number;
}

const SuggestionDropdown = ({ filteredSuggestions, matchedInput, highlightedSuggestion }: ISuggestionDropdownProps) => {
    return (
        <ul className="absolute w-[150px] bg-white rounded-lg border-grey shadow-md">
            {filteredSuggestions.length ? (
                filteredSuggestions.map((suggestion, index) => {
                    const match = suggestion.toLowerCase().indexOf(matchedInput.toLowerCase());
                    const beforeBoldedPortion = suggestion.substring(0, match);
                    const boldedPortion = suggestion.substring(match, match + matchedInput.length);
                    const afterBoldedPortion = suggestion.substring(match + matchedInput.length);

                    return (
                        <li key={suggestion} className={`px-2 py-1 text-sm ${highlightedSuggestion === index ? "bg-gray-200" : ""}`}>
                            {beforeBoldedPortion}
                            <span className="font-bold">{boldedPortion}</span>
                            {afterBoldedPortion}
                        </li>
                    );
                })
            ) : (
                <li className="px-2 py-1 text-sm">No suggestions</li>
            )}
        </ul>
    );
};

export default SuggestionDropdown;
