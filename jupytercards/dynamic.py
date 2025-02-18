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
    Display interactive flash cards with both "next" and "previous" navigation.
    ref: A file, URL, or Python list containing the flashcard JSON.
    keyControl: Enable keyboard controls (right: next, left: previous, space: flip)
    grabFocus: Whether to automatically focus the flashcard container.
    shuffle_cards: Shuffle the cards when cycling.
    front_colors, back_colors, text_colors: Optional alternate color schemes.
    title, subject: Metadata for structured data.
    topics: Filter flashcards by topic.
    '''
    
    # Specify default color schemes
    front_color_dict = [
        'var(--asparagus)',
        'var(--terra-cotta)',
        'var(--cyan-process)'
    ]
    back_color_dict = ['var(--dark-blue-gray)']
    text_color_dict = ['var(--snow)']
    
    jupytercon_front = [
        'hsla(17.65,100%,50%,1)',
        'rgb(234,196,53)',
        'hsla(200,76.74%,83.14%, 1)'
    ]
    jupytercon_back = ['hsla(208.78,66.49%,36.27%,1)']
    
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
    
    # Generate a unique ID for the card container BEFORE using it in JS.
    letters = string.ascii_letters
    div_id = ''.join(random.choice(letters) for i in range(12))
    
    # Load external CSS/JS resources
    resource_package = __name__
    package = resource_package.split('.')[0]
    
    styles = "<style>\n"
    f = importlib.resources.files(package).joinpath('styles.css')
    css = f.read_bytes()
    styles += css.decode("utf-8")
    styles += "\n</style>"
    
    script = ""
    f = importlib.resources.files(package).joinpath('swiped-events.min.js')
    js = f.read_bytes()
    script += js.decode("utf-8")
    f = importlib.resources.files(package).joinpath('flashcards.js')
    js = f.read_bytes()
    script += js.decode("utf-8")
    
    # Now add a JS function that creates the cards once the container exists.
    script += f'''
        function try_create() {{
          if(document.getElementById("{div_id}")) {{
            createCards("{div_id}", "{keyControl}", "{grabFocus}", "{shuffle_cards}", "{title}", "{subject}");
          }} else {{
             setTimeout(try_create, 200);
          }}
        }};
    '''
    
    # The container for the flashcards.
    mydiv = f'<div class="flip-container" id="{div_id}" tabindex="0" style="outline:none;"></div>'
    
    # Create spacer and navigation buttons (set default label for visibility)
    spacer = '<div style="height:40px"></div>'
    prevbutton = f"""<div class="previous" id="{div_id}-prev" onclick="window.checkFlipPrev('{div_id}')">< Previous</div> """
    nextbutton = f"""<div class="next" id="{div_id}-next" onclick="window.checkFlip('{div_id}')">Next ></div> """
    
    # Handling data based on the type of `ref`
    json_data = ""
    if isinstance(ref, list):
        all_cards = ref
        static = True
        url = ""
    elif isinstance(ref, str):
        if ref[0] == "[":
            all_cards = json.loads(ref)
            static = True
            url = ""
        elif ref.lower().startswith("http"):
            url = ref
            if sys.platform == 'emscripten':
                try: 
                    from pyodide.http import open_url
                except:
                    try:
                        from pyodide import open_url
                    except:
                        print('Error importing open_url.')
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
        raise Exception("First argument must be a list (JSON), URL, or file reference")
    
    # Filter cards based on topics if provided.
    if topics:
        if isinstance(topics, str):
            topics = [topics]
        cards = [card for card in all_cards if card.get("topic") and any(topic in card.get("topic") for topic in topics)]
    else:
        cards = all_cards
    
    # Pass flashcard data and color schemes to the JavaScript environment.
    loadData = f"\nvar cards{div_id} = {json.dumps(cards)};\n"
    
    loadData += "var frontColors{0} = [".format(div_id)
    loadData += ", ".join(f'"{color}"' for color in front_color_dict) + "];\n"
    
    loadData += "var backColors{0} = [".format(div_id)
    loadData += ", ".join(f'"{color}"' for color in back_color_dict) + "];\n"
    
    loadData += "var textColors{0} = [".format(div_id)
    loadData += ", ".join(f'"{color}"' for color in text_color_dict) + "];\n"
    
    if static:
        loadData += "try_create();"
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
    
    display(HTML(styles))
    display(HTML(spacer + mydiv + spacer + prevbutton + nextbutton + spacer))
    display(Javascript(script + loadData))


def makecard(name, front, back):
    if front and not back:
        back = front
        front = name
    elif back and not front:
        front = name
    return {'name': name, 'front': front, 'back': back}


def md2json(md, savefile=False):
    cards = []
    front = ''
    back = ''
    onback = False
    for line in md.splitlines():
        line = line.strip()
        if line:
            if line[0] == "#":
                while line[0] == "#":
                    line = line[1:]
                if front or back:
                    card = makecard(name, front, back)
                    cards.append(card)
                name = line.strip()
                front = ''
                back = ''
                onback = False
            else:
                if line.startswith('---'):
                    onback = True
                else:
                    if onback:
                        back += (' ' if back else '') + line
                    else:
                        front += (' ' if front else '') + line
        else:
            if onback and back:
                back += '<br>'
            elif front:
                front += '<br>'
    card = makecard(name, front, back)
    cards.append(card)
    if savefile:
        with open(savefile, 'w') as f:
            json.dump(cards, f)
    return json.dumps(cards, indent=4)
