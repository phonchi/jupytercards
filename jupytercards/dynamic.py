from IPython.display import display, HTML, Javascript
import string
import random
import json
import urllib.request
import importlib.resources
import sys


def display_flashcards(ref, keyControl=True, grabFocus=False,
                       shuffle_cards=False,
                       front_colors=None,
                       back_colors=None,
                       text_colors=None,
                       title='',
                       subject='',
                       topics=None):  
    '''
    Display interactive flash cards using a mix of Python and Javascript to support
    use in rendered notebooks (especially JupyterBook, but also Voila)

    Inputs:
    ref = string, reference to quiz JSON, may be:
          - file name
          - URL
          - Python list

    keyControl = boolean, whether to support keyboard: right = advance, space = flip,
                 left = previous

    grabFocus = boolean, whether to put browser focus on this slide deck

    shuffle_cards = boolean, whether to randomize card order

    front_colors, back_colors, text_colors:
          can be lists or a special string ('jupytercon')

    title   = string, title of this flashcard set
    subject = string, subject of this flashcard set
    topics  = string or list, to filter flashcards by topic

    John M. Shea
    2021-2025
    '''

    # Specify default front colors
    front_color_dict = [
        'var(--asparagus)',
        'var(--terra-cotta)',
        'var(--cyan-process)'
    ]

    # Specify default back color
    back_color_dict = [
        'var(--dark-blue-gray)'
    ]

    # Define color schemes for JupyterCon (2023)
    jupytercon_front = [
        'hsla(17.65,100%,50%,1)',
        'rgb(234,196,53)',
        'hsla(200,76.74%,83.14%, 1)'
    ]

    jupytercon_back = [
        'hsla(208.78,66.49%,36.27%,1)'
    ]

    # Specify default text color
    text_color_dict = [
        'var(--snow)'
    ]

    # Allow user to specify alternate color schemes
    if front_colors:
        if isinstance(front_colors, list):
            front_color_dict = front_colors
        elif front_colors == 'jupytercon':
            front_color_dict = jupytercon_front

    if back_colors:
        if isinstance(back_colors, list):
            back_color_dict = back_colors
        elif back_colors == 'jupytercon':
            back_color_dict = jupytercon_back

    if text_colors:
        if isinstance(text_colors, list):
            text_color_dict = text_colors

    # Load external style and JavaScript files
    resource_package = __name__
    package = resource_package.split('.')[0]

    # Loading CSS Styles
    styles = "<style>\n"
    f = importlib.resources.files(package).joinpath('styles.css')
    css = f.read_bytes()
    styles += css.decode("utf-8")
    styles += "\n</style>"

    # Load JavaScript files
    script = ''
    f = importlib.resources.files(package).joinpath('swiped-events.min.js')
    js = f.read_bytes()
    script += js.decode("utf-8")
    f = importlib.resources.files(package).joinpath('flashcards.js')
    js = f.read_bytes()
    script += js.decode("utf-8")

    # Generate a unique ID for each card set
    letters = string.ascii_letters
    div_id = ''.join(random.choice(letters) for i in range(12))

    # Define a function to be run periodically until the div is present in the DOM.
    script += f'''
        function try_create() {{
          if(document.getElementById("{div_id}")) {{
            createCards("{div_id}", "{keyControl}", "{grabFocus}", "{shuffle_cards}", "{title}", "{subject}");
          }} else {{
             setTimeout(try_create, 200);
          }}
        }};
    '''

    # This will be the container for the cards
    mydiv =  f'<div class="flip-container" id="{div_id}" tabindex="0" style="outline:none;"></div>'

    # Spacer (for vertical spacing)
    spacer = '<div style="height:40px"></div>'

    # Handling data based on the type of `ref` (list, URL, or file)
    json_data = ""
    if type(ref) == list:
        all_cards = ref
        static = True
        url = ""
    elif type(ref) == str:
        if ref[0] == "[":
            all_cards = json.loads(ref)
            static = True
            url = ""
        elif ref.lower().find("http") == 0:
            url = ref
            if sys.platform == 'emscripten':
                try: 
                    from pyodide.http import open_url
                except:
                    try:
                        from pyodide import open_url
                    except:
                        print('Importing open_url failed. Please raise an issue at')
                        print('https://github.com/jmshea/jupyterquiz/issues')
                json_data += open_url(url).read()
            else:
                file = urllib.request.urlopen(url)
                for line in file:
                    json_data += line.decode("utf-8")
            static = False
            all_cards = json.loads(json_data)
        else:
            with open(ref) as file:
                for line in file:
                    json_data += line
            static = True
            url = ""
            all_cards = json.loads(json_data)
    else:
        raise Exception("First argument must be list (JSON), URL, or file ref")

    # Filter cards based on topics (if specified)
    if topics:
        if isinstance(topics, str):
            topics = [topics]
        cards = []
        for card in all_cards:
            if card.get("topic"):
                if any(topic in card.get("topic") for topic in topics):
                    cards.append(card)
    else:
        cards = all_cards

    # Add the cards to the JavaScript 
    loadData = '\n'
    loadData += f"var cards{div_id}={json.dumps(cards)};\n"

    # Add color schemes to the JavaScript
    loadData += f"var frontColors{div_id}= ["
    for color in front_color_dict[:-1]:
        loadData += f'"{color}", '
    loadData += f'"{front_color_dict[-1]}" ];\n'

    loadData += f"var backColors{div_id}= ["
    for color in back_color_dict[:-1]:
        loadData += f'"{color}", '
    loadData += f'"{back_color_dict[-1]}" ];\n'

    loadData += f"var textColors{div_id}= ["
    for color in text_color_dict[:-1]:
        loadData += f'"{color}", '
    loadData += f'"{text_color_dict[-1]}" ];\n'

    if static:
        loadData += f'''try_create(); '''
    else:
        loadData += f'''
        {{
        const jmscontroller = new AbortController();
        const signal = jmscontroller.signal;
        setTimeout(() => jmscontroller.abort(), 5000);
        fetch("{url}", {{signal}})
        .then(response => response.json())
        .then(json => createCards("{div_id}", "{keyControl}", "{grabFocus}", "{shuffle_cards}", "{title}", "{subject}"))
        .catch(err => {{
        console.log("Fetch error or timeout");
        try_create(); 
        }});
        }}
        '''

    # Create navigation buttons now that we know the number of cards.
    prevbutton = f"""<div class="prev" id="{div_id}-prev" onclick="window.checkPrev('{div_id}')"> &lt; Prev </div>"""
    cardNumber = f"""<div class="card-number" id="{div_id}-cardnumber">1/{len(cards)}</div>"""
    nextbutton = f"""<div class="next" id="{div_id}-next" onclick="window.checkFlip('{div_id}')"> Next &gt; </div>"""

    # Display the content in the notebook
    display(HTML(styles))
    display(HTML(spacer + mydiv + spacer + prevbutton + cardNumber + nextbutton + spacer))
    display(Javascript(script+loadData))
    
    
# Functions to help make flashcard JSON files

def makecard(name, front, back):
    if front and not back:
        back = front
        front = name
    elif back and not front:
        front = name
    card = {'name': name,
            'front': front,
            'back': back}
    return card


def md2json(md, savefile=False):
    cards = []
    front = ''
    back = ''
    blank = False
    onback = False

    for line in iter(md.splitlines()):
        line = line.strip()
        if line:
            if line[0] == "#":
                while line[0] == "#":
                    line = line[1:]
                if front or back:
                    card = makecard(name, front, back)
                    cards += [card]
                name = line.strip()
                front = ''
                back = ''
                onback = False
                blank = False
            else:
                if len(line) >= 3 and line[:3] == '---':
                    onback = True
                else: 
                    if onback:
                        if back:
                            back += ' ' 
                        back += line
                    else:
                        if front:
                            front += ' '
                        front += line
        else:
            if onback and back:
                back += '<br>'
                blank = False
            elif front:
                front += '<br>'
                blank = False

    card = makecard(name, front, back)
    cards += [card]

    if savefile:
        with open(savefile, 'w') as f:
            json.dump(cards, f)

    return json.dumps(cards, indent=4)
