/* Parser matemático acotado: no eval, Function ni ejecución de JavaScript. */
function compileExpression(source){
  const src=String(source).toLowerCase().replace(/^\s*y\s*=/,'').replace(/π/g,'pi').replace(/,/g,'.');
  if(src.length>150)throw Error('Expresión demasiado larga.');
  const raw=src.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z]+|[+\-*/^()]/g)||[];
  if(raw.join('')!==src.replace(/\s/g,''))throw Error('Símbolo no reconocido.');
  const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,sqrt:Math.sqrt,abs:Math.abs,ln:Math.log,log:Math.log10,exp:Math.exp};
  const tokens=[];
  for(const t of raw){const p=tokens.at(-1);if(p&&(p==='x'||p==='pi'||p==='e'||p===')'||/^\d|^\./.test(p))&&(t==='x'||t==='pi'||t==='e'||t==='('||funcs[t]||/^\d|^\./.test(t)))tokens.push('*');tokens.push(t);}
  let i=0;
  function primary(){const t=tokens[i++];if(t==='('){const n=add();if(tokens[i++]!==')')throw Error('Falta cerrar un paréntesis.');return n}if(t==='x')return x=>x;if(t==='pi')return ()=>Math.PI;if(t==='e')return ()=>Math.E;if(funcs[t]){if(tokens[i++]!=='(')throw Error('Usa paréntesis en las funciones.');const n=add();if(tokens[i++]!==')')throw Error('Falta cerrar un paréntesis.');return x=>funcs[t](n(x))}if(t&&/^(\d|\.)/.test(t)){const n=Number(t);if(!Number.isFinite(n))throw Error('Número no válido.');return ()=>n}throw Error('Expresión no válida.');}
  function power(){let a=primary();if(tokens[i]==='^'){i++;const b=unary(),left=a;a=x=>Math.pow(left(x),b(x))}return a}
  function unary(){if(tokens[i]==='-'){i++;const n=unary();return x=>-n(x)}if(tokens[i]==='+'){i++;return unary()}return power()}
  function mul(){let a=unary();while(['*','/'].includes(tokens[i])){const op=tokens[i++],b=unary(),left=a;a=op==='*'?x=>left(x)*b(x):x=>left(x)/b(x)}return a}
  function add(){let a=mul();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=mul(),left=a;a=op==='+'?x=>left(x)+b(x):x=>left(x)-b(x)}return a}
  const fn=add();if(i!==tokens.length)throw Error('Revisa los paréntesis o los operadores.');return fn;
}
