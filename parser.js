/**
 * Safe Scientific Calculator Expression Parser & Evaluator
 * Uses tokenization followed by a recursive-descent parser to enforce PEMDAS.
 * Supports implicit multiplication, constants (π, e), functions, postfix %, !, and exponents.
 */

class Tokenizer {
  constructor(str) {
    this.str = str || '';
    this.pos = 0;
  }

  tokenize() {
    const tokens = [];
    let i = 0;
    const s = this.str;

    while (i < s.length) {
      const char = s[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers (including decimals)
      if (/\d/.test(char) || (char === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
        let numStr = '';
        if (char === '.') {
          numStr = '0.';
          i++;
        }
        while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
          if (s[i] === '.' && numStr.includes('.')) break; // Stop at second decimal
          numStr += s[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr), raw: numStr });
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'LPAREN' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN' });
        i++;
        continue;
      }

      // Operators (normalized standard characters)
      if (char === '+' || char === '＋') {
        tokens.push({ type: 'PLUS' });
        i++;
        continue;
      }
      if (char === '−' || char === '-' || char === '－') {
        tokens.push({ type: 'MINUS' });
        i++;
        continue;
      }
      if (char === '×' || char === '*' || char === '＊') {
        tokens.push({ type: 'MUL' });
        i++;
        continue;
      }
      if (char === '÷' || char === '/' || char === '／') {
        tokens.push({ type: 'DIV' });
        i++;
        continue;
      }
      if (char === '^') {
        tokens.push({ type: 'POW' });
        i++;
        continue;
      }
      if (char === '²') {
        tokens.push({ type: 'SQR' });
        i++;
        continue;
      }
      if (char === '%') {
        tokens.push({ type: 'PERCENT' });
        i++;
        continue;
      }
      if (char === '!') {
        tokens.push({ type: 'FAC' });
        i++;
        continue;
      }

      // Constants
      if (char === 'π') {
        tokens.push({ type: 'PI' });
        i++;
        continue;
      }

      // Exponent from EXP button (displayed as 'e' or 'E' after a number)
      // Standard Euler's constant 'e' is also displayed as 'e'
      if (char === 'e' || char === 'E') {
        // Look behind to determine if it is scientific notation or constant e
        const prev = tokens[tokens.length - 1];
        const isPrevNum = prev && (prev.type === 'NUMBER' || prev.type === 'PI' || prev.type === 'E' || prev.type === 'RPAREN');
        
        if (isPrevNum) {
          // If followed by '+' or '-', skip it after pushing the EXP token
          tokens.push({ type: 'EXP_E' });
          i++;
        } else {
          tokens.push({ type: 'E' });
          i++;
        }
        continue;
      }

      // Functions: sin, cos, tan, log, ln, √
      if (s.slice(i, i + 3) === 'sin') {
        tokens.push({ type: 'SIN' });
        i += 3;
        continue;
      }
      if (s.slice(i, i + 3) === 'cos') {
        tokens.push({ type: 'COS' });
        i += 3;
        continue;
      }
      if (s.slice(i, i + 3) === 'tan') {
        tokens.push({ type: 'TAN' });
        i += 3;
        continue;
      }
      if (s.slice(i, i + 3) === 'log') {
        tokens.push({ type: 'LOG' });
        i += 3;
        continue;
      }
      if (s.slice(i, i + 2) === 'ln') {
        tokens.push({ type: 'LN' });
        i += 2;
        continue;
      }
      if (char === '√') {
        tokens.push({ type: 'SQRT' });
        i++;
        continue;
      }

      // Unknown character - skip or mark as error
      i++;
    }

    return tokens;
  }
}

class Parser {
  constructor(tokens, isDegree = true) {
    this.tokens = tokens;
    this.pos = 0;
    this.isDegree = isDegree;
  }

  peek() {
    return this.tokens[this.pos] || null;
  }

  consume(type) {
    const token = this.peek();
    if (token && token.type === type) {
      this.pos++;
      return token;
    }
    return null;
  }

  parse() {
    if (this.tokens.length === 0) return 0;
    const result = this.parseExpression();
    return result;
  }

  // Expression -> Term ( (PLUS | MINUS) Term )*
  parseExpression() {
    let val = this.parseTerm();

    while (true) {
      if (this.consume('PLUS')) {
        const right = this.parseTerm();
        val = val + right;
      } else if (this.consume('MINUS')) {
        const right = this.parseTerm();
        val = val - right;
      } else {
        break;
      }
    }
    return val;
  }

  // Term -> Power ( (MUL | DIV) Power )*
  // Also supports implicit multiplication (e.g. 2π, 2(3), 5sin(30))
  parseTerm() {
    let val = this.parsePower();

    while (true) {
      const next = this.peek();
      if (this.consume('MUL')) {
        const right = this.parsePower();
        val = val * right;
      } else if (this.consume('DIV')) {
        const right = this.parsePower();
        val = val / right;
      } else if (next && (
        next.type === 'NUMBER' ||
        next.type === 'PI' ||
        next.type === 'E' ||
        next.type === 'LPAREN' ||
        next.type === 'SIN' ||
        next.type === 'COS' ||
        next.type === 'TAN' ||
        next.type === 'LOG' ||
        next.type === 'LN' ||
        next.type === 'SQRT'
      )) {
        // Implicit multiplication
        const right = this.parsePower();
        val = val * right;
      } else {
        break;
      }
    }
    return val;
  }

  // Power -> Factorial [ POW Power | SQR ]
  parsePower() {
    let val = this.parseFactorial();

    if (this.consume('POW')) {
      const right = this.parsePower(); // Right-associative exponent
      val = Math.pow(val, right);
    } else if (this.consume('SQR')) {
      val = Math.pow(val, 2);
    }

    return val;
  }

  // Factorial -> Factor [ FAC | PERCENT ]
  parseFactorial() {
    let val = this.parseFactor();

    while (true) {
      if (this.consume('FAC')) {
        val = this.factorial(val);
      } else if (this.consume('PERCENT')) {
        val = val / 100;
      } else {
        break;
      }
    }

    return val;
  }

  factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (!Number.isInteger(n)) {
      // Approximation for gamma function of positive decimals is complex, return NaN for simplicity
      return NaN;
    }
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  // Factor -> NUMBER [ EXP_E NUMBER ] | PI | E | LPAREN Expression RPAREN | Function LPAREN Expression RPAREN | MINUS Factor | PLUS Factor
  parseFactor() {
    const token = this.peek();
    if (!token) {
      return 0; // Tolerant parsing: empty factor at end evaluates to 0
    }

    if (this.consume('NUMBER')) {
      let val = token.value;

      // Handle scientific EXP_E notation (e.g. 2e+3, 2e-3)
      if (this.consume('EXP_E')) {
        let sign = 1;
        if (this.consume('MINUS')) sign = -1;
        else this.consume('PLUS'); // Optional plus

        const expToken = this.consume('NUMBER');
        if (expToken) {
          val = val * Math.pow(10, sign * expToken.value);
        } else {
          // If user typed 2e but no exponent yet, treat as 2 * 10^0 for live preview
          val = val * 1;
        }
      }
      return val;
    }

    if (this.consume('PI')) {
      return Math.PI;
    }
    if (this.consume('E')) {
      return Math.E;
    }

    if (this.consume('LPAREN')) {
      const val = this.parseExpression();
      this.consume('RPAREN'); // Tolerant: don't force closing paren at end
      return val;
    }

    if (this.consume('MINUS')) {
      return -this.parseFactor();
    }
    if (this.consume('PLUS')) {
      return this.parseFactor();
    }

    // Functions
    if (this.consume('SIN')) {
      const arg = this.parseFuncArg();
      const angle = this.isDegree ? (arg * Math.PI) / 180 : arg;
      return Math.sin(angle);
    }
    if (this.consume('COS')) {
      const arg = this.parseFuncArg();
      const angle = this.isDegree ? (arg * Math.PI) / 180 : arg;
      return Math.cos(angle);
    }
    if (this.consume('TAN')) {
      const arg = this.parseFuncArg();
      const angle = this.isDegree ? (arg * Math.PI) / 180 : arg;
      return Math.tan(angle);
    }
    if (this.consume('LOG')) {
      const arg = this.parseFuncArg();
      return Math.log10(arg);
    }
    if (this.consume('LN')) {
      const arg = this.parseFuncArg();
      return Math.log(arg);
    }
    if (this.consume('SQRT')) {
      const arg = this.parseFuncArg();
      return Math.sqrt(arg);
    }

    // If unexpected, consume and return 0 to prevent infinite loops in parser
    this.pos++;
    return 0;
  }

  parseFuncArg() {
    const hasParen = this.consume('LPAREN');
    const val = this.parseExpression();
    if (hasParen) {
      this.consume('RPAREN');
    }
    return val;
  }
}

// Global evaluation wrapper
function evaluateExpression(exprStr, isDegree = true) {
  try {
    const tokenizer = new Tokenizer(exprStr);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens, isDegree);
    const result = parser.parse();
    return result;
  } catch (err) {
    console.error("Evaluation error:", err);
    return NaN;
  }
}

// Export for browser or Node.js environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { Tokenizer, Parser, evaluateExpression };
} else {
  window.evaluateExpression = evaluateExpression;
}
