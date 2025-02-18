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
    setTimeout(reenableNext, 600, ths, next);
}

window.checkKey = function checkKey(container, event) {
    event.stopPropagation();
    var next = document.getElementById(container.id + '-next');
    var prev = document.getElementById(container.id + '-prev');
    if (!next.classList.contains("hide") && !prev.classList.contains("hide")) {
        if (event.key == "ArrowRight" || event.key == "j" || event.key == "Enter") {
            window.checkFlip(container.id);
        } else if (event.key == "ArrowLeft") {
            window.checkPrev(container.id);
        } else if (event.key == " ") {
            window.flipCard(container);
        }
    }
    event.preventDefault();
}

function reenableNext(ths, next) {
    next.style.pointerEvents = 'auto';
    next.classList.remove('flipped');
}

window.checkFlip = function checkFlip(containerId) {
    var container = document.getElementById(containerId);
    if (container.classList.contains('flip')) {
        container.classList.remove('flip');
        setTimeout(slide2, 600, containerId);
    } else {
        slide2(containerId);
    }
}

window.checkPrev = function checkPrev(containerId) {
    var container = document.getElementById(containerId);
    slide2Prev(containerId);
}

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
    frontcard.parentElement.removeChild(frontcard);
    backcard.parentElement.appendChild(frontcard);
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
    // Use stored nextCard and currentCard values
    var nextCard = parseInt(container.dataset.nextCard);
    var cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);

    // The back card now becomes the visible (current) card:
    container.dataset.currentCard = nextCard;
    // Create a new back card using the next card in sequence:
    var flipper = createOneCard(container, false, cards, cardOrder[nextCard], nextCard);
    container.append(flipper);

    // Update the display to show the new current card number:
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = ((nextCard) + 1) + "/" + total;
    }
    // Advance nextCard index:
    nextCard = (nextCard + 1) % total;
    if (nextCard == 0 && container.dataset.shuffleCards == "True") {
         cardOrder = randomOrderArray(total);
         container.dataset.cardOrder = JSON.stringify(cardOrder);
    }
    container.dataset.nextCard = nextCard;

    if (nextCard != 1) {
         next.innerHTML = "Next >";
    } else {
         next.innerHTML = 'Reload <svg xmlns="http://www.w3.org/2000/svg" ...></svg>';
         if (typeof MathJax != 'undefined') {
              var version = MathJax.version;
              if (version[0] == "2") {
                  MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
              } else if (version[0] == "3") {
                  MathJax.typeset([next]);
              }
         }
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

function slide2Prev(containerId) {
    var container = document.getElementById(containerId);
    var prev = document.getElementById(containerId + '-prev');
    var frontcard = container.children[0];
    var backcard = container.children[1];
    container.style.pointerEvents = 'none';
    prev.style.pointerEvents = 'none';
    prev.classList.add('hide');
    container.className = "flip-container slide-prev";
    backcard.parentElement.removeChild(frontcard);
    backcard.parentElement.appendChild(frontcard);
    setTimeout(slidebackPrev, 600, container, frontcard, backcard, prev);
}

function slidebackPrev(container, frontcard, backcard, prev) {
    container.className = "flip-container slideback-prev";
    setTimeout(cleanupPrev, 550, container, frontcard, backcard, prev);
}

function cleanupPrev(container, frontcard, backcard, prev) {
    container.removeChild(frontcard);
    backcard.className = "flipper frontcard";
    container.className = "flip-container";
    
    var total = parseInt(container.dataset.numCards);
    var currentCard = parseInt(container.dataset.currentCard);
    var prevCard = (currentCard - 1 + total) % total;
    var cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    var flipper = createOneCard(container, false, cards, cardOrder[prevCard], prevCard);
    container.append(flipper);
    
    container.dataset.currentCard = prevCard;
    container.dataset.nextCard = (prevCard + 1) % total;
    
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = ((prevCard) + 1) + "/" + total;
    }
    prev.style.pointerEvents = 'auto';
    container.style.pointerEvents = 'auto';
}

function createOneCard(mydiv, frontCard, cards, cardnum, seq) {
    var colors = eval('frontColors' + mydiv.id);
    var backColors = eval('backColors' + mydiv.id);
    var textColors = eval('textColors' + mydiv.id);
    var flipper = document.createElement('div');
    if (frontCard){
         flipper.className = "flipper frontcard";    
    }
    else {
         flipper.className = "flipper backcard";   
    }
    var front = document.createElement('div');
    front.className = 'front flashcard';
    var frontSpan = document.createElement('span');
    frontSpan.className = 'flashcardtext';
    frontSpan.innerHTML = jaxify(cards[cardnum]['front']);
    frontSpan.style.color = textColors[seq % textColors.length];
    front.style.background = colors[seq % colors.length];
    front.append(frontSpan);
    flipper.append(front);
    var back = document.createElement('div');
    back.className = 'back flashcard';
    back.style.background = backColors[seq % backColors.length];
    var backSpan = document.createElement('span');
    backSpan.className = 'flashcardtext';
    backSpan.innerHTML = jaxify(cards[cardnum]['back']);
    backSpan.style.color = textColors[seq % textColors.length];
    back.append(backSpan);
    flipper.append(back);
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
         "about": {
              "@type": "Thing"
         },
         "educationalAlignment": [
              {
                   "@type": "AlignmentObject",
                   "alignmentType": "educationalSubject"
              }
         ],
         "hasPart": []
    };

    structuredData["about"]["name"] = title;
    structuredData["educationalAlignment"][0]["targetName"] = subject;

    for (var i = 0; i < cards.length; i++) {
         var newPart = {
              "@context": "https://schema.org/",
              "@type": "Question",
              "eduQuestionType": "Flashcard",
              "acceptedAnswer": {
                   "@type": "Answer",
              }
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
    // Initialize indices: currentCard for the visible card and nextCard for the next card.
    var currentCard = 0;
    var nextCard = (cards.length > 1 ? 1 : 0);
    var flipperFront = createOneCard(mydiv, true, cards, cardOrder[currentCard], currentCard);
    mydiv.append(flipperFront);
    var flipperBack = createOneCard(mydiv, false, cards, cardOrder[nextCard], nextCard);
    mydiv.append(flipperBack);
    mydiv.dataset.currentCard = currentCard;
    mydiv.dataset.nextCard = nextCard;
    var next = document.getElementById(id + '-next');
    if (cards.length == 1) {
         next.style.pointerEvents = 'none';
         next.classList.add('hide');
    } else {
         next.innerHTML = "Next >";
    }
    if (grabFocus == "True")
         mydiv.focus();
    return flipperBack;
}
