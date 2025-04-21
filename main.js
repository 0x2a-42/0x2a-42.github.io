import init_c, { generate_syntax_tree as generate_syntax_tree_c } from "./parsers/lelwel_c.js";
import init_lua, { generate_syntax_tree as generate_syntax_tree_lua } from "./parsers/lelwel_lua.js";
import init_l, { generate_syntax_tree as generate_syntax_tree_l } from "./parsers/lelwel_l.js";
import init_lelwel, { generate_syntax_tree as generate_syntax_tree_lelwel, get_location  } from "./parsers/lelwel.js";
import init_oberon0, { generate_syntax_tree as generate_syntax_tree_oberon0 } from "./parsers/lelwel_oberon0.js";
import init_json, { generate_syntax_tree as generate_syntax_tree_json } from "./parsers/lelwel_json.js";
import init_toml, { generate_syntax_tree as generate_syntax_tree_toml } from "./parsers/lelwel_toml.js";
import init_python2, { generate_syntax_tree as generate_syntax_tree_python2 } from "./parsers/lelwel_python2.js";


await init_c();
await init_lua();
await init_l();
await init_lelwel();
await init_oberon0();
await init_json();
await init_toml();
await init_python2();
const input = document.getElementById("input");
const cst_output = document.getElementById("cst_output");
const error_output = document.getElementById("error_output");
const language_selector = document.getElementById("language_selector");
const show_implementation = document.getElementById("show_implementation");
const dark_mode = document.getElementById("dark_mode");

const editor = CodeMirror.fromTextArea(input, {
    lineNumbers: true,
});

var is_dark_mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (is_dark_mode) {
    document.body.classList.toggle("dark-mode");
    error_output.classList.toggle("dark-mode");
    language_selector.classList.toggle("dark-mode");
    editor.setOption("theme", "dark");
    dark_mode.text = "[light mode]"
} else {
    document.body.classList.toggle("light-mode");
    error_output.classList.toggle("light-mode");
    language_selector.classList.toggle("light-mode");
}
function toggle_dark_mode() {
    document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode");
    error_output.classList.toggle("dark-mode");
    error_output.classList.toggle("light-mode");
    language_selector.classList.toggle("dark-mode");
    language_selector.classList.toggle("light-mode");
    if (is_dark_mode) {
      editor.setOption("theme", "default");
      dark_mode.text = "[dark mode]"
    } else {
      editor.setOption("theme", "dark");
      dark_mode.text = "[light mode]"
    }
    is_dark_mode = !is_dark_mode;
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', toggle_dark_mode);
dark_mode.addEventListener("click", toggle_dark_mode);

var buffer = {
  "c": "void f() {\n  g(1,\n  int x = 2 +\n}",
  "lua": "function f()\n  g(1,\n  local x = 2 +\nend",
  "l": "fn f() {\n  g(1,\n  let x = 2 +\n}",
  "lelwel": "token Num='<number>';\ntoken Plus='+' Minus='-' Star='*' Slash='/' Pow='^';\ntoken LPar='(' RPar=')';\ntoken Whitespace;\n\nskip Whitespace;\nright '^';\nstart calc;\n\ncalc^: expr;\nexpr:\n  expr '^' expr @binary_expr\n| ('-' | '+') expr @unary_expr\n| expr ('*' | '/') expr @binary_expr\n| expr ('+' | '-') expr @binary_expr\n| Num @literal_expr\n| '(' expr ')' @paren_expr\n;",
  "oberon0": "MODULE Example;\n  PROCEDURE f();\n    VAR x: INTEGER;\n  BEGIN\n    g(1,\n    x := 2 +\n  END f;\nEND Example.",
  "json": "{ \"a\" [1 2, 3], \"b\": \"c\", }",
  "toml": "[table1\na.b = { c = 42, d =\n\n[table2]\ne =\n\n[[1.2]]\n3.4 = 5.6",
  "python2": "def f():\n    x = 2 +\n\ndef g():\n    pass",
};

function generate_syntax_tree_by_language(language) {
    let code = buffer[language];
    let output = ["", ""];
    try {
        switch (language) {
            default:
            case "c":
                output = generate_syntax_tree_c(code);
                break;
            case "lua":
                output = generate_syntax_tree_lua(code);
                break;
            case "l":
                output = generate_syntax_tree_l(code);
                break;
            case "lelwel":
                output = generate_syntax_tree_lelwel(code);
                break;
            case "oberon0":
                output = generate_syntax_tree_oberon0(code);
                break;
            case "json":
                output = generate_syntax_tree_json(code);
                break;
            case "toml":
                output = generate_syntax_tree_toml(code);
                break;
            case "python2":
                output = generate_syntax_tree_python2(code);
                break;
        }
    } catch (error) {}

    cst_output.innerHTML = "";
    output[0].split("\n").filter(line => line.length > 0).forEach(line => {
        const num_of_spaces = line.search(/\S/);

        const div = document.createElement("div");
        div.append(" ".repeat(num_of_spaces));
        div.append(" ");

        const content = line.slice(num_of_spaces);
        let node_name = content.substring(0, content.indexOf(" "));
        if (node_name) {
          const rest = content.substring(content.indexOf(" ") + 1);
          const range = rest.split(" ").slice(-1)[0].replace("[", "").replace("]", "").split("..");
          const a = document.createElement("a");
          a.href = "#";
          a.textContent = node_name;
          a.addEventListener("click", () => {
              let loc = get_location(code, parseInt(range[0]), parseInt(range[1]));
              editor.setSelection(
                {line: loc[0] - 1, ch: loc[1] - 1},
                {line: loc[2] - 1, ch: loc[3] - 1}
              );
              editor.focus();
          });
          div.append(a);
          div.append(" ");
          div.append(rest);
        } else {
          div.append(content);
        }
        cst_output.append(div);
    });

    error_output.textContent = output[1];
}

editor.setValue(buffer["c"]);
generate_syntax_tree_by_language("c");

editor.on("change", (editor) => {
    const language = language_selector.value;
    buffer[language] = editor.getValue();
    generate_syntax_tree_by_language(language);
});

language_selector.addEventListener("input", (event) => {
    const language = event.target.value;
    editor.setValue(buffer[language]);
    if (language === "lelwel") {
        show_implementation.href = "https://github.com/0x2a-42/lelwel";
    } else {
        show_implementation.href = `https://github.com/0x2a-42/lelwel/tree/main/examples/${language}`;
    }
    generate_syntax_tree_by_language(language);
});
