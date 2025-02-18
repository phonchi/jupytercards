function jaxify(string) {
    var mystring = string;
    var count = 0;
    var loc = mystring.search(/([^\\]|^)(\$)/);
    var count2 = 0;
    var loc2 = mystring.search(/([^\\]|^)(\$\$)/);
    while ((loc >= 0) || (loc2 >= 0)) {
        if (loc2 >= 0) {
            if (count2 % 2 == 0) {
                mystring = mystring.replace(/([^\\]|^)(\$\$)/, "$1\\[");
            } else {
                mystring = mystring.replace(/([^\\]|^)(\$\$)/, "$1\\]");
            }
            count2++;
        } else {
            if (count % 2 == 0) {
                mystring = mystring.replace(/([^\\]|^)(\$)/, "$1\\(");
            } else {
                mystring = mystring.replace(/([^\\]|^)(\$)/, "$1\\)");
            }
            count++;
        }
        loc = mystring.search(/([^\\]|^)(\$)/);
        loc2 = mystring.search(/([^\\]|^)(\$\$)/);
    }
    return mystring;
}

window.flipCard = function flipCard(ths) {
    ths.classList.toggle("flip");
    ths.focus();
    var next = document.getElementById(ths.id + '-next');
    next.style.pointerEvents = 'none';
    next.classList.add('flipped');
    if (typeof MathJax != 'undefined') {
        var version = MathJax.version;
        if (version[0] == "2") {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        } else if (version[0] == "3") {
            MathJax.typeset([ths]);
        }
    }
    setTimeout(function(){
        next.style.pointerEvents = 'auto';
        next.classList.remove('flipped');
    }, 600);
};

window.checkKey = function checkKey(container, event) {
    event.stopPropagation();
    var next = document.getElementById(container.id + '-next');
    var prev = document.getElementById(container.id + '-prev');
    if (!next.classList.contains("hide")) {
        if ((event.key == "j") || (event.key == "Enter") || (event.key == "ArrowRight")) {
            window.checkFlip(container.id);
        }
        if (event.key == "ArrowLeft") {
            window.checkFlipPrev(container.id);
        }
        if (event.key == " ") {
            window.flipCard(container);
        }
    }
    event.preventDefault();
};

window.checkFlip = function checkFlip(containerId) {
    var container = document.getElementById(containerId);
    if (container.classList.contains('flip')) {
        container.classList.remove('flip');
        setTimeout(slide2, 600, containerId);
    } else {
        slide2(containerId);
    }
};

function slide2(containerId) {
    var container = document.getElementById(containerId);
    var next = document.getElementById(containerId + '-next');
    var frontcard = container.children[0];
    var backcard = container.children[1];
    container.style.pointerEvents = 'none';
    next.style.pointerEvents = 'none';
    next.classList.remove('flipped');
    next.classList.add('hide');
    container.className = "flip-container slide";
    // For next: remove the front card and append it.
    container.removeChild(frontcard);
    container.appendChild(frontcard);
    setTimeout(slideback, 600, container, frontcard, backcard, next);
}

function slideback(container, frontcard, backcard, next) {
    container.className = "flip-container slideback";
    setTimeout(cleanup, 550, container, frontcard, backcard, next);
}

function cleanup(container, frontcard, backcard, next) {
    container.removeChild(frontcard);
    backcard.className = "flipper frontcard";
    container.className = "flip-container";
    var total = parseInt(container.dataset.numCards);
    var current = parseInt(container.dataset.currentIndex);
    var nextPointer = parseInt(container.dataset.nextPointer);
    let cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    // Create a new back card using nextPointer
    var newCard = createOneCard(container, false, cards, cardOrder[nextPointer], nextPointer);
    container.appendChild(newCard);
    // Update pointers: current becomes the card that was in back; nextPointer is advanced.
    current = nextPointer;
    nextPointer = (current + 1) % total;
    container.dataset.currentIndex = current;
    container.dataset.nextPointer = nextPointer;
    if (current == 0) {
        next.innerHTML = 'Reload <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 26"> <path d="M7,6a10,10,0,1,0,9,0" style="fill:none;stroke:black;stroke-width:2px"/> <line x1="17" y1="6.5" x2="17.5" y2="15" style="stroke:black;fill:none;stroke-width:2px"/> <line x1="16.5" y1="6.5" x2="26" y2="8" style="stroke:black;fill:none;stroke-width:2px"/> </svg> ';
    } else {
        next.innerHTML = "Next >";
    }
    if (typeof MathJax != 'undefined') {
        var version = MathJax.version;
        if (version[0] == "2") {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        } else if (version[0] == "3") {
            MathJax.typeset();
        }
    }
    next.style.pointerEvents = 'auto';
    container.style.pointerEvents = 'auto';
    next.classList.remove('hide');
    container.addEventListener('swiped-left', function(e) {
        checkFlip(container.id);
    }, {once: true});
}

/* ----- Previous Button Functions ----- */
window.checkFlipPrev = function checkFlipPrev(containerId) {
    var container = document.getElementById(containerId);
    if (container.classList.contains('flip')) {
        container.classList.remove('flip');
        setTimeout(slide2Prev, 600, containerId);
    } else {
        slide2Prev(containerId);
    }
}

function slide2Prev(containerId) {
    var container = document.getElementById(containerId);
    var prev = document.getElementById(containerId + '-prev');
    container.style.pointerEvents = 'none';
    prev.style.pointerEvents = 'none';
    prev.classList.add('flipped');
    container.className = "flip-container slide";
    // For previous: remove the current front card and store it.
    var frontcard = container.children[0];
    container.removeChild(frontcard);
    setTimeout(slidebackPrev, 600, container, prev, frontcard);
}

function slidebackPrev(container, prev, oldFront) {
    container.className = "flip-container slideback";
    setTimeout(cleanupPrev, 550, container, prev, oldFront);
}

function cleanupPrev(container, prev, oldFront) {
    var total = parseInt(container.dataset.numCards);
    var current = parseInt(container.dataset.currentIndex);
    // Compute the previous card index relative to the current visible card.
    var prevIndex = (current - 1 + total) % total;
    let cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    // Create a new front card (note: pass true so it gets the "frontcard" class)
    var newCard = createOneCard(container, true, cards, cardOrder[prevIndex], prevIndex);
    container.insertBefore(newCard, container.firstChild);
    // Append the old front card as the new back card.
    oldFront.className = "flipper backcard";
    container.appendChild(oldFront);
    // Update pointers
    container.dataset.currentIndex = prevIndex;
    container.dataset.nextPointer = (prevIndex + 1) % total;
    if (prevIndex == total - 1) {
        prev.innerHTML = "Reload";
    } else {
        prev.innerHTML = "< Previous";
    }
    prev.style.pointerEvents = 'auto';
    container.style.pointerEvents = 'auto';
    prev.classList.remove('flipped');
    container.addEventListener('swiped-right', function(e) {
        window.checkFlipPrev(container.id);
    }, {once: true});
}

function createOneCard(mydiv, frontCard, cards, cardnum, seq) {
    var colors = eval('frontColors' + mydiv.id);
    var backColors = eval('backColors' + mydiv.id);
    var textColors = eval('textColors' + mydiv.id);
    var flipper = document.createElement('div');
    if (frontCard) {
        flipper.className = "flipper frontcard";
    } else {
        flipper.className = "flipper backcard";
    }
    var front = document.createElement('div');
    front.className = 'front flashcard';
    var frontSpan = document.createElement('span');
    frontSpan.className = 'flashcardtext';
    frontSpan.innerHTML = jaxify(cards[cardnum]['front']);
    frontSpan.style.color = textColors[seq % textColors.length];
    front.style.background = colors[seq % colors.length];
    front.appendChild(frontSpan);
    flipper.appendChild(front);
    var back = document.createElement('div');
    back.className = 'back flashcard';
    back.style.background = backColors[seq % backColors.length];
    var backSpan = document.createElement('span');
    backSpan.className = 'flashcardtext';
    backSpan.innerHTML = jaxify(cards[cardnum]['back']);
    backSpan.style.color = textColors[seq % textColors.length];
    back.appendChild(backSpan);
    flipper.appendChild(back);
    return flipper;
}

function randomOrderArray(N) {
    let arr = Array.from({ length: N }, (_, index) => index);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createStructuredData(mydiv, cards, title, subject) {
    var structuredData = {
        "@context": "https://schema.org/",
        "@type": "Quiz",
        "about": {"@type": "Thing"},
        "educationalAlignment": [{
            "@type": "AlignmentObject",
            "alignmentType": "educationalSubject"
        }],
        "hasPart": []
    };
    structuredData["about"]["name"] = title;
    structuredData["educationalAlignment"][0]["targetName"] = subject;
    for (var i = 0; i < cards.length; i++) {
        var newPart = {
            "@context": "https://schema.org/",
            "@type": "Question",
            "eduQuestionType": "Flashcard",
            "acceptedAnswer": {"@type": "Answer"}
        };
        newPart["text"] = cards[i]["front"];
        newPart["acceptedAnswer"]["text"] = cards[i]["back"];
        structuredData["hasPart"].push(newPart);
    }
    var el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify(structuredData);
    mydiv.parentElement.appendChild(el);
}

function createCards(id, keyControl, grabFocus, shuffleCards, title, subject) {
    var mydiv = document.getElementById(id);
    mydiv.onclick = function() { window.flipCard(mydiv); };
    if (keyControl == "True") {
        mydiv.onkeydown = function(event) { window.checkKey(mydiv, event); };
    }
    var cards = eval('cards' + id);
    var total = cards.length;
    mydiv.dataset.numCards = total;
    // Create card order (shuffled if requested)
    var cardOrder;
    if (shuffleCards == "True") {
        cardOrder = randomOrderArray(total);
    } else {
        cardOrder = Array.from({ length: total }, (_, index) => index);
    }
    mydiv.dataset.cardOrder = JSON.stringify(cardOrder);
    // Set currentIndex and nextPointer
    mydiv.dataset.currentIndex = 0;
    mydiv.dataset.nextPointer = (0 + 1) % total;
    mydiv.addEventListener('swiped-left', function(e) {
        checkFlip(id);
    }, {once: true});
    if ((title != "") || (subject != "")) {
        createStructuredData(mydiv, cards, title, subject);
    }
    // Create the initial two cards.
    var flipperFront = createOneCard(mydiv, true, cards, cardOrder[0], 0);
    var flipperBack = createOneCard(mydiv, false, cards, cardOrder[1], 1);
    mydiv.appendChild(flipperFront);
    mydiv.appendChild(flipperBack);
    var next = document.getElementById(id + '-next');
    if (cards.length == 1) {
        next.style.pointerEvents = 'none';
        next.classList.add('hide');
    } else {
        next.innerHTML = "Next >";
    }
    if (grabFocus == "True")
        mydiv.focus();
    return flipperFront;
}
