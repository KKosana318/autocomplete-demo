import React, { useState, useEffect } from "react";
import useStateCallback from "../utils/useStateCallback";
import { IAutocompletedWord } from "../interfaces/interfaces";

import SuggestionDropdown from "./suggestion-dropdown";
import Highlighter from "./highlighter";

interface IMentionBoxProps {
    filteredSuggestions: string[];
    getSuggestions: (input: string) => void;
}

const MentionBox = ({ filteredSuggestions, getSuggestions }: IMentionBoxProps) => {
    // suggestion state
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);

    // input field state
    const [userInput, setUserInput] = useStateCallback("");
    const [relevantInput, setRelevantInput] = useState("");
    const [relevantInputStart, setRelevantInputStart] = useState(-1);
    const [relvantInputEnd, setRelevantInputEnd] = useState(-1);

    // caret/selection state
    const [selectionStart, setSelectionStart] = useState(-1);
    const [selectionEnd, setSelectionEnd] = useState(-1);
    const [caretLeftOffset, setCaretLeftOffset] = useState(0); // left offset

    // autcompleted words state
    const [autocompletedWords, setAutocompletedWords] = useState<IAutocompletedWord[]>([]);

    // update selection state on every click
    useEffect(() => {
        window.addEventListener("click", handleWindowClick);

        // cleanup this component
        return () => {
            window.removeEventListener("click", handleWindowClick);
        };
    }, []);

    // update position of dropdown based on caret position
    useEffect(() => {
        if (showDropdown) {
            const dropdown = document.getElementById("dropdown-container") as HTMLDivElement;

            if (dropdown) {
                dropdown.style.marginLeft = `${caretLeftOffset}px`;
            }
        }
    }, [caretLeftOffset, showDropdown]);

    // update suggestions and dropdown visility when input or caret changes
    useEffect(() => {
        if (userInput.length && selectionStart > 0) {
            const stringAfterLastMention = getStringAfterLastMention(userInput, selectionStart);

            if (stringAfterLastMention !== null) {
                getSuggestions(stringAfterLastMention.toLowerCase());
                setShowDropdown(true);
            } else {
                setShowDropdown(false);
            }
        } else {
            setShowDropdown(false);
        }
    }, [userInput, selectionStart, getSuggestions]);

    // useEffect(() => {
    //     console.log("selectionStart", selectionStart);
    //     console.log("selectionEnd", selectionEnd);
    // }, [selectionStart, selectionEnd]);

    const getStringAfterLastMention = (input: string, caretPosition: number) => {
        // find last @ and last space before caret
        const lastMentionBeforeCarat = input.substring(0, caretPosition).lastIndexOf("@");
        const lastSpaceBeforeCarat = input.substring(0, caretPosition).lastIndexOf(" ");

        // dont show suggestions if there is if there is no @ before caret or if there's a space between @ and caret
        if (lastMentionBeforeCarat === -1 || lastSpaceBeforeCarat > lastMentionBeforeCarat) {
            return null;
        }

        // get the string after the last @
        const result = input.substring(lastMentionBeforeCarat + 1, caretPosition);

        setRelevantInput(result);
        setRelevantInputStart(lastMentionBeforeCarat + 1);
        setRelevantInputEnd(caretPosition);

        return result;
    };

    const findSelectionBorders = (e: React.SyntheticEvent<HTMLDivElement, Event>) => {
        const target = e.target as HTMLInputElement;
        return [target.selectionStart, target.selectionEnd];
    };

    const findCaretPixelOffset = (e: React.SyntheticEvent<HTMLDivElement, Event>) => {
        let input = document.getElementById("mention-box-input") as HTMLInputElement;
        let span = document.getElementById("hidden-overlay") as HTMLSpanElement;

        if (input.selectionStart) {
            span.innerHTML = input.value.substring(0, input.selectionStart);

            let rect = span.getClientRects()[0];
            let left = rect.right - rect.left + 8; // add 8 to put suggestion ahead of caret

            return Math.round(left);
        }

        return null;
    };

    const calculatePixelWidth = (word: string) => {
        // remove and store all spaces
        let numSpaces = word.split(" ").length - 1;
        let remainder = word.replaceAll(" ", "");

        let span = document.getElementById("hidden-overlay") as HTMLSpanElement;
        let spaceWidth = 0;

        if (numSpaces > 0) {
            span.innerHTML = "";
            let space = document.createTextNode("\u00a0");
            span.appendChild(space);

            let rect = span.getClientRects()[0];
            spaceWidth = rect.right - rect.left;
        }

        span.innerHTML = remainder;
        let rect = span.getClientRects()[0];
        return rect.right - rect.left + spaceWidth * numSpaces;
    };

    // given input in the input field, find the pixel of the first character (either 0 or negative)
    const calculateStartPixel = (word: string) => {
        console.log("in calculateStartPixel")
        const inputElement = document.getElementById("mention-box-input") as HTMLInputElement;
        console.log(inputElement);
        console.log("")
        return -(Math.floor(inputElement.scrollLeft * 10) / 10);
    };

    const findAutocompletedWordPosition = (word: string, startPosition: number, newInput?: string) => {
        let input = newInput ? newInput : userInput;

        let start = calculatePixelWidth(input.substring(0, startPosition)) + calculateStartPixel(input);
        let width = calculatePixelWidth(word);

        return [start, start + width];
    };

    const updateCaretInformation = (e: React.SyntheticEvent<HTMLDivElement, Event>) => {
        const [currentStart, currentEnd] = findSelectionBorders(e);
        if (currentStart !== null) {
            setSelectionStart(currentStart);
        }

        if (currentEnd !== null) {
            setSelectionEnd(currentEnd);
        }

        const caretPixelOffset = findCaretPixelOffset(e);
        if (caretPixelOffset !== null) {
            setCaretLeftOffset(caretPixelOffset);
        }
    };

    // update input and selection borders
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nativeEvent = e.nativeEvent as InputEvent;
        const inputType = nativeEvent.inputType;

        if (inputType === "insertText") {
            if (autocompletedWords.length > 0) {
                e.preventDefault();
                const data = nativeEvent.data;
                const prevSelectionStart = selectionStart,
                    prevSelectionEnd = selectionEnd; // explicitly signal that selection variables are from before input
                const rawInput = userInput;
                let newInput = "";
                let newAutocompletedWords: IAutocompletedWord[] = [];
                let autocompletedWordPosition = 0;
                let inputPosition = 0;

                // add all content up to last autocompleted word ending before selectionStart
                for (let i = 0; i < autocompletedWords.length; i++) {
                    if (autocompletedWords[i].endPosition <= prevSelectionStart) {
                        newAutocompletedWords.push(autocompletedWords[i]);

                        if (i + 1 === autocompletedWords.length || autocompletedWords[i + 1].endPosition > prevSelectionStart) {
                            newInput = rawInput.substring(0, autocompletedWords[i].endPosition);
                            autocompletedWordPosition = i + 1;
                            inputPosition = autocompletedWords[i].endPosition;
                            break;
                        }
                    }
                }

                // add all non-autocompleted content between what was just added and selectionStart
                let borderBeforeStart = prevSelectionStart; // the last position before selectionStart that can be added
                if (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].startPosition < borderBeforeStart
                ) {
                    borderBeforeStart = autocompletedWords[autocompletedWordPosition].startPosition;
                }
                newInput += rawInput.substring(inputPosition, borderBeforeStart);

                // add current data
                newInput += data;

                // add all content after selectionEnd
                while (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].endPosition <= prevSelectionEnd
                ) {
                    autocompletedWordPosition++;
                }

                let borderAfterEnd = prevSelectionEnd;
                if (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].startPosition < borderAfterEnd
                ) {
                    borderAfterEnd = autocompletedWords[autocompletedWordPosition].endPosition;
                    autocompletedWordPosition++;
                }

                newInput += rawInput.substring(borderAfterEnd, rawInput.length);

                // adjust position of all autocompleted words after selectionEnd
                let numCharsRemoved = borderAfterEnd - borderBeforeStart - 1;

                for (let i = autocompletedWordPosition; i < autocompletedWords.length; i++) {
                    let word = autocompletedWords[i];

                    word.startPosition -= numCharsRemoved;
                    word.endPosition -= numCharsRemoved;

                    newAutocompletedWords.push(word);
                }

                for (let i = 0; i < newAutocompletedWords.length; i++) {
                    let word = autocompletedWords[i];
                    const pixelPosition = findAutocompletedWordPosition(word.word, word.startPosition, newInput);
                    word.startPixel = pixelPosition[0];
                    word.endPixel = pixelPosition[1];
                }

                setAutocompletedWords(newAutocompletedWords);
                setUserInput(newInput);
            } else {
                setUserInput(e.target.value);
            }
        } else if (inputType === "deleteContentBackward" || inputType === "deleteContentForward") {
            if (autocompletedWords.length > 0) {
                e.preventDefault();
                let prevSelectionStart: number, prevSelectionEnd: number;

                // adjust selection borders to account for deleted character
                if (inputType === "deleteContentBackward") {
                    prevSelectionStart = selectionStart === selectionEnd ? selectionStart - 1 : selectionStart;
                    prevSelectionEnd = selectionEnd;
                } else {
                    prevSelectionStart = selectionStart;
                    prevSelectionEnd = selectionEnd === selectionStart ? selectionEnd + 1 : selectionEnd;
                }

                const rawInput = userInput;
                let newInput = "";
                let newAutocompletedWords: IAutocompletedWord[] = [];
                let autocompletedWordPosition = 0;
                let inputPosition = 0;

                if (prevSelectionEnd === 0) {
                    return;
                }

                // add all content up to last autocompleted word ending before selectionStart
                for (let i = 0; i < autocompletedWords.length; i++) {
                    if (autocompletedWords[i].endPosition <= prevSelectionStart) {
                        newAutocompletedWords.push(autocompletedWords[i]);

                        if (i + 1 === autocompletedWords.length || autocompletedWords[i + 1].endPosition > prevSelectionStart) {
                            newInput = rawInput.substring(0, autocompletedWords[i].endPosition);
                            autocompletedWordPosition = i + 1;
                            inputPosition = autocompletedWords[i].endPosition;
                            break;
                        }
                    }
                }

                // add all non-autocompleted content between what was just added and selectionStart
                let borderBeforeStart = prevSelectionStart; // the last position before selectionStart that can be added
                if (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].startPosition < borderBeforeStart
                ) {
                    borderBeforeStart = autocompletedWords[autocompletedWordPosition].startPosition;
                }

                newInput += rawInput.substring(inputPosition, borderBeforeStart);

                // add all content after selectionEnd
                while (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].endPosition <= prevSelectionEnd
                ) {
                    autocompletedWordPosition++;
                }

                let borderAfterEnd = prevSelectionEnd;
                if (
                    autocompletedWordPosition < autocompletedWords.length &&
                    autocompletedWords[autocompletedWordPosition].startPosition < borderAfterEnd
                ) {
                    borderAfterEnd = autocompletedWords[autocompletedWordPosition].endPosition;
                    autocompletedWordPosition++;
                }

                newInput += rawInput.substring(borderAfterEnd, rawInput.length);

                // adjust position of all autocompleted words after selectionEnd
                let numCharsRemoved = Math.max(borderAfterEnd - borderBeforeStart, 1);

                for (let i = autocompletedWordPosition; i < autocompletedWords.length; i++) {
                    let word = autocompletedWords[i];

                    word.startPosition -= numCharsRemoved;
                    word.endPosition -= numCharsRemoved;

                    newAutocompletedWords.push(word);
                }

                for (let i = 0; i < newAutocompletedWords.length; i++) {
                    let word = autocompletedWords[i];
                    const pixelPosition = findAutocompletedWordPosition(word.word, word.startPosition, newInput);
                    word.startPixel = pixelPosition[0];
                    word.endPixel = pixelPosition[1];
                }

                setAutocompletedWords(newAutocompletedWords);
                setUserInput(newInput, () => e.target.setSelectionRange(prevSelectionStart, prevSelectionStart));
            } else {
                setUserInput(e.target.value);
            }
        } else {
            setUserInput(e.target.value);
        }

        updateCaretInformation(e);
    };

    // prevent tabbing out of input when dropdown is open
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showDropdown && e.key === "Tab") {
            e.preventDefault();
        }
    };

    // update suggestion dropdown status and selection borders
    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        switch (e.key) {
            case "ArrowDown":
                if (showDropdown && filteredSuggestions.length) {
                    e.preventDefault();
                    setHighlightedSuggestion((highlightedSuggestion + 1) % filteredSuggestions.length);
                }
                break;
            case "ArrowUp":
                if (showDropdown && filteredSuggestions.length) {
                    e.preventDefault();
                    setHighlightedSuggestion((highlightedSuggestion - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                }
                break;
            case "Tab":
            case "Enter":
                if (showDropdown && filteredSuggestions.length) {
                    e.preventDefault();

                    const autocompletedWord = filteredSuggestions[highlightedSuggestion];
                    const newInput = userInput.substring(0, relevantInputStart - 1) + autocompletedWord + userInput.substring(relvantInputEnd);
                    const position = findAutocompletedWordPosition(autocompletedWord, relevantInputStart - 1, newInput);

                    const word = {
                        word: autocompletedWord,
                        startPosition: relevantInputStart - 1, // relevantInputStart refers to the character after the @, but the autocompleted word replaces the @
                        endPosition: relevantInputStart - 1 + autocompletedWord.length,
                        startPixel: position[0],
                        endPixel: position[1],
                    };

                    // update autocompletedWords while maintaining sorted order
                    let prevAutocompletedWords = autocompletedWords;
                    let newAutocompletedWords: IAutocompletedWord[] = [];
                    let added = false;

                    prevAutocompletedWords.forEach((prevWord) => {
                        if (added || prevWord.endPosition < word.startPosition) {
                            newAutocompletedWords.push(prevWord);
                        } else if (!added && prevWord.endPosition === word.startPosition) {
                            newAutocompletedWords.push(prevWord);
                            newAutocompletedWords.push(word);
                            added = true;
                        } else {
                            newAutocompletedWords.push(word);
                            added = true;
                        }
                    });

                    if (!added) {
                        newAutocompletedWords.push(word);
                    }

                    setAutocompletedWords(newAutocompletedWords);

                    setUserInput(newInput, () => updateCaretInformation(e));
                    setShowDropdown(false);
                    setHighlightedSuggestion(0);
                }
                break;
            case "Escape":
                e.preventDefault();
                setShowDropdown(false);
                break;
            default:
                updateCaretInformation(e);
        }
    };

    // listen for clicks in the entire window
    // this is because if we press down inside inside the mention, and drag the mouse out and press up,
    // the mention's onClick will not trigger
    const handleWindowClick = (e: MouseEvent) => {
        const mention = document.getElementById("mention-box-input") as HTMLInputElement;

        const currentSelectionStart = mention.selectionStart;

        if (currentSelectionStart !== null) {
            setSelectionStart(currentSelectionStart);
        }

        const currentSelectionEnd = mention.selectionEnd;
        if (currentSelectionEnd !== null) {
            setSelectionEnd(currentSelectionEnd);
        }
    };

    return (
        <div className="w-[500px] min-w-[500px] h-[45px] shadow-md rounded-md bg-white">
            <input
                id="mention-box-input"
                type="text"
                name="mention-input"
                value={userInput}
                placeholder="Type @ to begin a mention."
                autoComplete="off"
                spellCheck={false}
                className="absolute w-[500px] min-w-[500px] h-[45px] p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent z-10"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onBlur={() => setShowDropdown(false)}
            />
            <span id="hidden-overlay" className="absolute h-[45px] m-2 rounded-md bg-transparent opacity-0 break-words" />
            {/* <div id="width-debugger" className="absolute h-[4px] w-[80.5234375px] bg-red-600 ml-2 mt-2" /> */}
            <Highlighter words={autocompletedWords} />
            {showDropdown && (
                <div id="dropdown-container" className={"absolute z-20"}>
                    <SuggestionDropdown
                        filteredSuggestions={filteredSuggestions}
                        matchedInput={relevantInput}
                        highlightedSuggestion={highlightedSuggestion}
                    />
                </div>
            )}
        </div>
    );
};

export default MentionBox;
