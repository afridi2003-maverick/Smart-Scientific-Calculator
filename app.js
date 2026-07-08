/**
 * Scientific Calculator Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Selectors ---
  const card = document.getElementById('calculator-card');
  const expressionLine = document.getElementById('expression-line');
  const resultLine = document.getElementById('result-line');
  const themeToggle = document.getElementById('theme-toggle');
  const modeBadge = document.getElementById('mode-badge');
  const scientificPanel = document.getElementById('scientific-panel');
  const scToggleBtn = document.getElementById('sc-toggle-btn');
  
  // Deg/rad button elements
  const scDegRadBtn = document.querySelector('.deg-rad-btn');
  const inlineDegRadBtn = document.querySelector('.inline-deg-rad-btn');

  // --- State Variables ---
  let expression = ''; // Raw expression displayed to the user
  let isDegree = true;  // DEG vs RAD mode
  let isScientific = false; // Scientific panel toggle
  let isCalculated = false; // Indicates if "=" was just pressed

  // --- Initial Configuration ---
  initTheme();
  updateDisplay();

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('calculator_theme') || 'dark';
    document.body.className = savedTheme;
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.className;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = newTheme;
    localStorage.setItem('calculator_theme', newTheme);
  });

  // --- Helper: Format Display Output ---
  function formatNumber(num) {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Infinity';

    const numStr = num.toString();
    if (numStr.includes('e')) {
      const parts = numStr.split('e');
      const coeff = parseFloat(parts[0]);
      const formattedCoeff = coeff.toLocaleString('en-US', { maximumFractionDigits: 6 });
      return `${formattedCoeff}e${parts[1]}`;
    }

    const parts = numStr.split('.');
    const integerPart = parseFloat(parts[0]).toLocaleString('en-US');
    if (parts.length > 1) {
      return integerPart + '.' + parts[1];
    }
    return integerPart;
  }

  // --- Helper: Tolerant Live Preview Evaluator ---
  function getLivePreview() {
    if (!expression || expression === '0') return '0';

    // Sanitize trailing operators and incomplete functions for evaluation
    let sanitized = expression;
    while (true) {
      const prevLen = sanitized.length;
      // Remove trailing operators
      sanitized = sanitized.replace(/[\+\−\×\÷\^]+$/, '');
      // Remove trailing incomplete functions
      sanitized = sanitized.replace(/(sin|cos|tan|log|ln|√)\($/, '');
      sanitized = sanitized.replace(/\($/, '');
      sanitized = sanitized.trim();
      if (sanitized.length === prevLen) break;
    }

    if (!sanitized) return '';

    // Evaluate
    const result = evaluateExpression(sanitized, isDegree);
    if (isNaN(result) || !isFinite(result)) return '';
    return formatNumber(result);
  }

  // --- Display Updates ---
  function updateDisplay() {
    // Show empty string as "0" in the expression line
    expressionLine.textContent = expression || '0';

    // Highlight active basic operators (+ - * /) if they are trailing
    updateActiveOperatorHighlight();

    // Get live preview if not already finalized
    if (isCalculated) {
      // Show final result without "=" prefix
      const result = evaluateExpression(expression, isDegree);
      resultLine.textContent = formatNumber(result);
    } else {
      const preview = getLivePreview();
      if (preview !== '' && preview !== '0' && preview !== expression) {
        resultLine.textContent = '=' + preview;
        resultLine.style.opacity = '0.6';
      } else {
        resultLine.textContent = '';
      }
    }

    // Scroll display to the right as expression grows
    expressionLine.scrollLeft = expressionLine.scrollWidth;
  }

  function updateActiveOperatorHighlight() {
    // Remove active highlight from all operator buttons
    document.querySelectorAll('.operator-btn').forEach(btn => btn.classList.remove('active'));

    if (expression && !isCalculated) {
      const lastChar = expression.trim().slice(-1);
      if (['+', '−', '×', '÷'].includes(lastChar)) {
        // Find matching button in grid
        const opButton = Array.from(document.querySelectorAll('.operator-btn')).find(btn => {
          return btn.textContent.trim() === lastChar;
        });
        if (opButton) {
          opButton.classList.add('active');
        }
      }
    }
  }

  // --- Degree / Rad Mode Controls ---
  function setDegreeMode(deg) {
    isDegree = deg;
    modeBadge.textContent = isDegree ? 'DEG' : 'RAD';
    
    // Update active indicators in scientific panel button
    if (scDegRadBtn) {
      const radLabel = scDegRadBtn.querySelector('.rad-label');
      const degLabel = scDegRadBtn.querySelector('.deg-label');
      if (isDegree) {
        radLabel.classList.remove('active');
        degLabel.classList.add('active');
      } else {
        radLabel.classList.add('active');
        degLabel.classList.remove('active');
      }
    }

    // Update inline button in main grid
    if (inlineDegRadBtn) {
      inlineDegRadBtn.textContent = isDegree ? 'deg' : 'rad';
    }

    updateDisplay();
  }

  // --- Backspace / Clear Functions ---
  function performBackspace() {
    if (isCalculated) {
      // Clear instead of backspace if result is finalized
      expression = '';
      isCalculated = false;
      updateDisplay();
      return;
    }

    if (!expression || expression === '0') return;

    // Check if expression ends with a function call
    const functions = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√('];
    for (const fn of functions) {
      if (expression.endsWith(fn)) {
        expression = expression.slice(0, -fn.length);
        updateDisplay();
        return;
      }
    }

    // Default: remove last character
    expression = expression.slice(0, -1);
    updateDisplay();
  }

  // --- Button Action Handler ---
  function handleButtonPress(char, action) {
    // Reset screen if starting new calculation after a calculation
    if (isCalculated) {
      isCalculated = false;
      if (!action && char && !['+', '−', '×', '÷', '^', '²'].includes(char)) {
        expression = '';
      }
    }

    if (action) {
      switch (action) {
        case 'toggle-sc':
          isScientific = !isScientific;
          if (isScientific) {
            card.classList.add('open');
            scToggleBtn.classList.add('active');
          } else {
            card.classList.remove('open');
            scToggleBtn.classList.remove('active');
          }
          break;

        case 'toggle-deg-rad':
          setDegreeMode(!isDegree);
          break;

        case 'clear':
          expression = '';
          updateDisplay();
          break;

        case 'backspace':
          performBackspace();
          break;

        case 'toggle-sign':
          // Prepend or toggle negative sign of the last number in the expression
          const numMatch = expression.match(/([0-9.]+)$/);
          if (numMatch) {
            const num = numMatch[1];
            const index = expression.lastIndexOf(num);
            if (index > 0 && expression[index - 1] === '−') {
              // Remove minus
              expression = expression.substring(0, index - 1) + num;
            } else {
              // Add minus
              expression = expression.substring(0, index) + '−' + num;
            }
          } else if (expression.endsWith('−')) {
            expression = expression.slice(0, -1);
          } else {
            expression += '−';
          }
          updateDisplay();
          break;

        case 'square':
          // Squares the trailing number or paren
          expression += '²';
          updateDisplay();
          break;

        case 'reciprocal':
          // Reciprocal: x^-1
          expression += '^-1';
          updateDisplay();
          break;

        case 'calculate':
          if (!expression) return;
          const result = evaluateExpression(expression, isDegree);
          if (!isNaN(result) && isFinite(result)) {
            isCalculated = true;
            resultLine.style.opacity = '1.0';
            updateDisplay();
          } else {
            resultLine.textContent = 'Error';
            resultLine.style.opacity = '1.0';
          }
          break;
      }
    } else if (char) {
      // Append characters
      const operators = ['+', '−', '×', '÷', '^', '%'];
      
      // Prevent consecutive basic operators
      if (operators.includes(char)) {
        const lastChar = expression.trim().slice(-1);
        if (operators.includes(lastChar)) {
          // Replace previous operator
          expression = expression.trim().slice(0, -1) + char;
          updateDisplay();
          return;
        }
      }

      // Format functions nicely
      if (['sin', 'cos', 'tan', 'log', 'ln'].includes(char)) {
        expression += char + '(';
      } else if (char === '√') {
        expression += '√(';
      } else {
        expression += char;
      }
      updateDisplay();
    }
  }

  // --- Bind Click Events ---
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const char = btn.getAttribute('data-char');
      const action = btn.getAttribute('data-action');
      handleButtonPress(char, action);
    });
  });

  // --- AC Button Double-Tap / Hold for Backspace ---
  // A secondary long press on AC behaves as backspace
  let acTimer = null;
  const acBtn = document.getElementById('sc-ac-btn');
  if (acBtn) {
    acBtn.addEventListener('mousedown', () => {
      acTimer = setTimeout(() => {
        performBackspace();
        acTimer = null;
      }, 500); // 500ms long press
    });
    acBtn.addEventListener('mouseup', () => {
      if (acTimer) {
        clearTimeout(acTimer);
        acTimer = null;
      }
    });
    acBtn.addEventListener('mouseleave', () => {
      if (acTimer) {
        clearTimeout(acTimer);
        acTimer = null;
      }
    });
  }

  // --- Keyboard Support ---
  window.addEventListener('keydown', (e) => {
    // Focus in display or input shouldn't trigger keybinds
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key;

    if (key >= '0' && key <= '9') {
      handleButtonPress(key, null);
    } else if (key === '.') {
      handleButtonPress('.', null);
    } else if (key === '+') {
      handleButtonPress('+', null);
    } else if (key === '-') {
      handleButtonPress('−', null);
    } else if (key === '*') {
      handleButtonPress('×', null);
    } else if (key === '/') {
      e.preventDefault(); // Prevent search shortcut in some browsers
      handleButtonPress('÷', null);
    } else if (key === '%' || key === '!') {
      handleButtonPress(key, null);
    } else if (key === '^') {
      handleButtonPress('^', null);
    } else if (key === '(' || key === ')') {
      handleButtonPress(key, null);
    } else if (key === 'Enter' || key === '=') {
      handleButtonPress(null, 'calculate');
    } else if (key === 'Backspace') {
      handleButtonPress(null, 'backspace');
    } else if (key === 'Escape') {
      handleButtonPress(null, 'clear');
    } else if (key === 'p' || key === 'P') {
      handleButtonPress('π', null);
    } else if (key === 'e' || key === 'E') {
      // If preceded by a number, EXP, else Euler constant
      handleButtonPress('e', null);
    }
  });
});
