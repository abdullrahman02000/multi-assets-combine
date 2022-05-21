
# Multi Assets Combine

Combine HTML/CSS/Javascript files into single file.

## Get Started

To install this package

`npm install --save-dev multi-assets-combine`

Create four files:

[index.html]()
```
<!doctype html>
<html>
    <head>
    </head>
    <body>
        <button>My button</button>
    </body>
</html>
```

[style.css]()
```
button {
    border: none;
    background: #1d2fbb;
    padding: 1rem 1.5rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    border-radius: 0.4em;
    color: white;
    font-weight: bold;
}

button:hover {
    transform: translateY(-0.3em);
    background: #0218bb;
    cursor: pointer;
    box-shadow: 0 0 4px 1px rgba(0,0,0,0.3);
}
```
[script.js]()
```
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content loaded")
})
```
[combine.config.json]()
```
{
    "input": "index.html",
    "output": "output.html",
    "style": "style.css",
    "script": "script.js"
}
```
Run the following command:

`npx multi-assets-combine --config=combine.config.json`

Your [output.html]()
```
<!doctype html>
<html>
    <head>
    <style>button {
    border: none;
    background: #1d2fbb;
    padding: 1rem 1.5rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    border-radius: 0.4em;
    color: white;
    font-weight: bold;
}

button:hover {
    transform: translateY(-0.3em);
    background: #0218bb;
    cursor: pointer;
    box-shadow: 0 0 4px 1px rgba(0,0,0,0.3);
}</style></head>
    <body>
        <button>My button</button>
    <script>window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content loaded")
})</script></body>
</html>
```

To watch changes on [index.html]() run:

`npx multi-assets-combine --config=combine.config.json --watch`

## Configuration (JSON file)

| Key       | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `input`   | `string` | **Required**. Specify input html file |
| `output`  | `string` | **Required**. Specify output html file.
| `style`   | `string \| object \| string[] \| object[]` | Specify style(s) to be implemeneted in output file. |
| `script`  | `string \| object \| string[] \| object[]` | Specify script(s) to be implemeneted in output file. |

### Style(s) | Script(s)

The style|script can be `string` represent css/js file path or `object` to specify more properties along with path

**Example**
```
{ ...
    "style": [
        {
            "path": "style1.css",
            "target": "body"
        },
        "style2.css"
    ]
  ... }
```

### Style | Script options

| Key       | Type     | Description   
|:----------|:---------|:--------------
| target    | `string` | Specify where to place style/script, defaults are `"body"` for script and `"head"` for style.
| path      | `string` | **Required**. It can be URL or file path. **Note**: only supports redirect 301 if target resource do redirects (Especially when http protocol was specified).
| removeLink| `string \| object \| string[] \| object[]` | Remove previous `link \| script` tag in input html (If previous tag was referring to standalone asset), Example: link tag has reference to `style.css` but since the tool will combine `style.css`, there is no need to keep link tag.

#### Example
```
{
    "style": {
        "path": "style1.css"
        "target": "head",
        "removeLink": ["style1.css", "style2.css"]
    },
    "script": {
        "path": "script.js",
        "target": "body",
        "removeLink": "script.js"
    }
}


// HTML file
<html>
<head>
  <link rel="stylesheet" href="style1.css">
  <link rel="stylesheet" href="style2.css">
  .....

// Output HTML
<html>
<head>
<style>
// Style.css content
.....
</style>
.....</head>
.....
```

Example above shows how to combine content of `style1.css`, `script.js` file and remove related links;

The tool will look for link tags with href == `source` and `script` tags with src = `source` and remove them from their container (default is script/style container)

### Remove Link(s)

Each `RemoveLink` can be `string` or `object`, table below shows keys within `RemoveLink` object

| Key       | Type     | Description   
|:----------|:---------|:--------------
| source    | `string` | **Required**. Specify value of `href` or `src` for `script` or `link` to search, to delete them from their container
| target      | `string` | **Required**. Specify selector for which element to delete link from. Default is same container for "script" or "style"

#### example
```
{
    "script": {
        "path": "script.min.js",
        "target": "head",
        "removeLink": [
            {
                "source": "chunk1.js",
                "target": "body"
            },
            "chunk2.js"
        ]
    }
}


// HTML file
<html>
<head>
    <script src="chunk2.js"></script>
</head>
<body>

    <script src="chunk1.js"></script>
</body>


// Output HTML
<html>
<head>
    <script>
        // Script from script.js
    </script>
</head>
<body></body>
```

Example above add content of script file `script.js` to `head` where `script.target == "head"`

then it removes `<script src="chunk1.js">` from `body` because `removeLink.target == "body"`

and removes `<script src="chunk2.js">` from `head` because `removeLink.target` was not specified so it uses default container for script (`head`)