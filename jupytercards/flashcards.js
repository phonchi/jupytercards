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
    var nextBtn = document.getElementById(ths.id + '-next');
    nextBtn.style.pointerEvents = 'none';
    nextBtn.classList.add('flipped');
    if (typeof MathJax != 'undefined') {
        var version = MathJax.version;
        if (version[0] == "2") {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        } else if (version[0] == "3") {
            MathJax.typeset([ths]);
        }
    }
    setTimeout(function(){ 
         nextBtn.style.pointerEvents = 'auto';
         nextBtn.classList.remove('flipped');
    }, 600);
};

window.checkKey = function checkKey(container, event) {
    event.stopPropagation();
    if (event.key == "ArrowRight" || event.key == "j" || event.key == "Enter") {
         window.checkFlip(container.id);
    } else if (event.key == "ArrowLeft") {
         window.checkPrev(container.id);
    } else if (event.key == " ") {
         window.flipCard(container);
    }
    event.preventDefault();
};

window.checkFlip = function checkFlip(containerId) {
    slide2(containerId);
};

window.checkPrev = function checkPrev(containerId) {
    slide2Prev(containerId);
};

/* NEXT (forward) transition – using original animation classes */
function slide2(containerId) {
    var container = document.getElementById(containerId);
    var nextBtn = document.getElementById(containerId + '-next');
    var frontcard = container.children[0];
    var backcard = container.children[1];
    container.style.pointerEvents = 'none';
    nextBtn.style.pointerEvents = 'none';
    nextBtn.classList.remove('flipped');
    nextBtn.classList.add('hide');
    container.className = "flip-container slide";
    // Rearrange the two cards as in original code
    backcard.parentElement.removeChild(frontcard);
    backcard.parentElement.appendChild(frontcard);
    setTimeout(function(){
         slideback(container, frontcard, backcard, nextBtn);
    }, 600);
}

function slideback(container, frontcard, backcard, nextBtn) {
    container.className = "flip-container slideback";
    setTimeout(function(){
         cleanup(container, frontcard, backcard, nextBtn);
    }, 550);
}

function cleanup(container, frontcard, backcard, nextBtn) {
    container.removeChild(frontcard);
    backcard.className = "flipper frontcard";
    container.className = "flip-container";
    var total = parseInt(container.dataset.numCards);
    // Update current: the back card becomes visible
    var current = parseInt(container.dataset.next);
    container.dataset.current = current;
    // Compute new next index
    var next = (current + 1) % total;
    container.dataset.next = next;
    // Append new (hidden) back card using the new next index
    let cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    var newCard = createOneCard(container, false, cards, cardOrder[next], next);
    container.append(newCard);
    // Update counter display using current (visible) card
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = (current + 1) + "/" + total;
    }
    nextBtn.style.pointerEvents = 'auto';
    container.style.pointerEvents = 'auto';
    nextBtn.classList.remove('hide');
    container.addEventListener('swiped-left', function(e) {
         checkFlip(container.id);
    }, {once: true});
}

/* PREV (backward) transition – similar animation but reversed */
function slide2Prev(containerId) {
    var container = document.getElementById(containerId);
    var prevBtn = document.getElementById(containerId + '-prev');
    var frontcard = container.children[0];
    var backcard = container.children[1];
    container.style.pointerEvents = 'none';
    prevBtn.style.pointerEvents = 'none';
    prevBtn.classList.add('hide');
    container.className = "flip-container slide-prev";
    // Rearrange the two cards as in the forward transition
    backcard.parentElement.removeChild(frontcard);
    backcard.parentElement.appendChild(frontcard);
    setTimeout(function(){
         slidebackPrev(container, frontcard, backcard, prevBtn);
    }, 600);
}

function slidebackPrev(container, frontcard, backcard, prevBtn) {
    container.className = "flip-container slideback-prev";
    setTimeout(function(){
         cleanupPrev(container, frontcard, backcard, prevBtn);
    }, 550);
}

function cleanupPrev(container, frontcard, backcard, prevBtn) {
    container.removeChild(frontcard);
    backcard.className = "flipper frontcard";
    container.className = "flip-container";
    var total = parseInt(container.dataset.numCards);
    // Retrieve current visible card index
    var current = parseInt(container.dataset.current);
    // New current becomes one card earlier (cycling backward)
    var newCurrent = (current - 1 + total) % total;
    container.dataset.current = newCurrent;
    // Set next to be (newCurrent + 1) mod total
    var newNext = (newCurrent + 1) % total;
    container.dataset.next = newNext;
    // Append new back card using the new next index
    let cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    var newCard = createOneCard(container, false, cards, cardOrder[newNext], newNext);
    container.append(newCard);
    // Update counter display using new current index
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = (newCurrent + 1) + "/" + total;
    }
    prevBtn.style.pointerEvents = 'auto';
    container.style.pointerEvents = 'auto';
    // IMPORTANT: Remove the "hide" class so the Prev button remains visible.
    prevBtn.classList.remove('hide');
}

/* Create one card element */
function createOneCard(mydiv, frontCard, cards, cardnum, seq) {
    var colors = eval('frontColors' + mydiv.id);
    var backColors = eval('backColors' + mydiv.id);
    var textColors = eval('textColors' + mydiv.id);
    var flipper = document.createElement('div');
    if (frontCard){
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
         "about": { "@type": "Thing" },
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
              "acceptedAnswer": { "@type": "Answer" }
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
    mydiv.dataset.numCards = cards.length;
    mydiv.dataset.shuffleCards = shuffleCards;
    var cardOrder;
    if (shuffleCards == "True") {
         cardOrder = randomOrderArray(cards.length);
    } else {
         cardOrder = Array.from({ length: cards.length }, (_, index) => index);
    }
    mydiv.dataset.cardOrder = JSON.stringify(cardOrder);
    mydiv.addEventListener('swiped-left', function(e) {
         checkFlip(id);
    }, { once: true });
    if ((title != "") || (subject != "")) {
         createStructuredData(mydiv, cards, title, subject);
    }
    // Initialize by creating two card elements:
    var current = 0;
    var next = (cards.length > 1 ? 1 : 0);
    var flipperFront = createOneCard(mydiv, true, cards, cardOrder[current], current);
    mydiv.appendChild(flipperFront);
    var flipperBack = createOneCard(mydiv, false, cards, cardOrder[next], next);
    mydiv.appendChild(flipperBack);
    mydiv.dataset.current = current;
    mydiv.dataset.next = next;
    var nextBtn = document.getElementById(id + '-next');
    if (cards.length == 1) {
         nextBtn.style.pointerEvents = 'none';
         nextBtn.classList.add('hide');
    } else {
         nextBtn.innerHTML = "Next >";
    }
    var numberDisplay = document.getElementById(id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = (current + 1) + "/" + cards.length;
    }
    if (grabFocus == "True")
         mydiv.focus();
    return flipperBack;
}
