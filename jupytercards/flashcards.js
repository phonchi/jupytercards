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
    slideNext(containerId);
};

window.checkPrev = function checkPrev(containerId) {
    slidePrev(containerId);
};

function slideNext(containerId) {
    var container = document.getElementById(containerId);
    var nextBtn = document.getElementById(containerId + '-next');
    container.classList.add("slide-next");
    nextBtn.style.pointerEvents = 'none';
    setTimeout(function(){
         cleanupNext(container, nextBtn);
    }, 600);
}

function cleanupNext(container, nextBtn) {
    if (container.children.length > 0) {
         container.removeChild(container.children[0]);
    }
    if (container.children.length > 0) {
         container.children[0].className = "flipper frontcard";
    }
    var total = parseInt(container.dataset.numCards);
    var current = parseInt(container.dataset.currentCard);
    current = (current + 1) % total;
    container.dataset.currentCard = current;
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = (current + 1) + "/" + total;
    }
    var nextIndex = (current + 1) % total;
    container.dataset.nextCard = nextIndex;
    var cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    var newCard = createOneCard(container, false, cards, cardOrder[nextIndex], nextIndex);
    container.appendChild(newCard);
    container.classList.remove("slide-next");
    nextBtn.style.pointerEvents = 'auto';
}

function slidePrev(containerId) {
    var container = document.getElementById(containerId);
    var prevBtn = document.getElementById(containerId + '-prev');
    container.classList.add("slide-prev");
    prevBtn.style.pointerEvents = 'none';
    setTimeout(function(){
         cleanupPrev(container, prevBtn);
    }, 600);
}

function cleanupPrev(container, prevBtn) {
    var total = parseInt(container.dataset.numCards);
    var current = parseInt(container.dataset.currentCard);
    var prevIndex = (current - 1 + total) % total;
    var cardOrder = JSON.parse(container.dataset.cardOrder);
    var cards = eval('cards' + container.id);
    var newCard = createOneCard(container, true, cards, cardOrder[prevIndex], prevIndex);
    container.insertBefore(newCard, container.firstChild);
    if (container.children.length > 2) {
         container.removeChild(container.children[container.children.length - 1]);
    }
    container.dataset.currentCard = prevIndex;
    var numberDisplay = document.getElementById(container.id + '-cardnumber');
    if (numberDisplay) {
         numberDisplay.innerHTML = (prevIndex + 1) + "/" + total;
    }
    container.dataset.nextCard = (prevIndex + 1) % total;
    container.classList.remove("slide-prev");
    prevBtn.style.pointerEvents = 'auto';
}

function createOneCard(mydiv, frontCard, cards, cardnum, seq) {
    var colors = eval('frontColors' + mydiv.id);
    var backColors = eval('backColors' + mydiv.id);
    var textColors = eval('textColors' + mydiv.id);
    var flipper = document.createElement('div');
    flipper.className = frontCard ? "flipper frontcard" : "flipper backcard";
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
    // Initialize indices and create two card elements.
    var currentCard = 0;
    var nextCard = (cards.length > 1 ? 1 : 0);
    var flipperFront = createOneCard(mydiv, true, cards, cardOrder[currentCard], currentCard);
    mydiv.appendChild(flipperFront);
    var flipperBack = createOneCard(mydiv, false, cards, cardOrder[nextCard], nextCard);
    mydiv.appendChild(flipperBack);
    mydiv.dataset.currentCard = currentCard;
    mydiv.dataset.nextCard = nextCard;
    var nextBtn = document.getElementById(id + '-next');
    if (cards.length == 1) {
         nextBtn.style.pointerEvents = 'none';
         nextBtn.classList.add('hide');
    } else {
         nextBtn.innerHTML = "Next >";
    }
    if (grabFocus == "True")
         mydiv.focus();
    return flipperBack;
}
