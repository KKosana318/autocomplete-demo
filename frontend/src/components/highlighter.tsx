import React, { useEffect } from "react";
import { IAutocompletedWord } from "../interfaces/interfaces";

interface IHighlighterProps {
    words: IAutocompletedWord[];
}

const Highlighter = ({ words }: IHighlighterProps) => {
    useEffect(() => {
        const highlighters = document.getElementById("highlighters") as HTMLDivElement;
        highlighters.innerHTML = "";

        words.forEach(({ word, startPixel, endPixel }) => {
            let straightenRightBorder = false;
            let adjustedEndPixel = endPixel;

            if (startPixel >= 486) {
                return; // 486 is the width of the text area (hardcoded)
            }
            if (endPixel >= 486) {
                adjustedEndPixel = 486; // 486 is the width of the text area (hardcoded
                straightenRightBorder = true;
            }

            const highlighter = document.createElement("span");
            highlighter.id = `highlighter-${word}`;

            if (straightenRightBorder) {
                highlighter.className = "absolute h-[30px] bg-green-300 rounded-l-md opacity-50 break-words";
            } else {
                highlighter.className = "absolute h-[30px] bg-green-300 rounded-md opacity-50 break-words";
            }

            highlighter.style.marginLeft = `${startPixel}px`;
            highlighter.style.width = `${adjustedEndPixel - startPixel}px`;


            highlighters.appendChild(highlighter);
        });
    }, [words]);

    return (
        <div id="highlighters" className="w-full h-[45px] p-2">
            {/* <span id="highlighter" className="absolute h-[30px] w-[100px] bg-green-300 opacity-50 rounded-md break-words" /> */}
        </div>
    );
};

export default Highlighter;
