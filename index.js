var jsep = require('jsep');

/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 */

var binops = {
  '||':  function (a, b) { return a || b; },
  '&&':  function (a, b) { return a && b; },
  '|':   function (a, b) { return a | b; },
  '^':   function (a, b) { return a ^ b; },
  '&':   function (a, b) { return a & b; },
  '==':  function (a, b) { return a == b; }, // jshint ignore:line
  '!=':  function (a, b) { return a != b; }, // jshint ignore:line
  '===': function (a, b) { return a === b; },
  '!==': function (a, b) { return a !== b; },
  '<':   function (a, b) { return a < b; },
  '>':   function (a, b) { return a > b; },
  '<=':  function (a, b) { return a <= b; },
  '>=':  function (a, b) { return a >= b; },
  '<<':  function (a, b) { return a << b; },
  '>>':  function (a, b) { return a >> b; },
  '>>>': function (a, b) { return a >>> b; },
  '+':   function (a, b) { return a + b; },
  '-':   function (a, b) { return a - b; },
  '*':   function (a, b) { return a * b; },
  '/':   function (a, b) { return a / b; },
  '%':   function (a, b) { return a % b; }
};
var binopsCallback = null;

var unops = {
  '-' :  function (a) { return -a; },
  '+' :  function (a) { return a; },
  '~' :  function (a) { return ~a; },
  '!' :  function (a) { return !a; },
};
var unopsCallback = null;

function evaluateArray ( list, context ) {
  return list.map((v) => evaluate(v, context));
}

function evaluateMember ( node, context ) {
  const object = evaluate(node.object, context);
  if ( node.computed ) {
    return [object, object[evaluate(node.property, context)]];
  } else {
    return [object, object[node.property.name]];
  }
}

function evaluateBinop(op, left, right) {
  return binopsCallback ? binopsCallback(op, left, right) : binops[op](left, right);
}

function evaluateUnop(op, arg) {
  return unopsCallback ? unopsCallback(op, arg) : unops[op](arg);
}

function evaluate ( node, context ) {

  switch ( node.type ) {

    case 'ArrayExpression':
      return evaluateArray( node.elements, context );

    case 'BinaryExpression':
      return evaluateBinop(node.operator,  evaluate( node.left, context ), evaluate( node.right, context ) );

    case 'CallExpression':
      let caller, fn;
      if (node.callee.type === 'MemberExpression') {
        [ caller, fn ] = evaluateMember( node.callee, context );
      } else {
        fn = evaluate( node.callee, context );
      }
      if (typeof fn  !== 'function') return undefined;
      return fn.apply( caller, evaluateArray( node.arguments, context ) );

    case 'ConditionalExpression':
      return evaluate( node.test, context )
        ? evaluate( node.consequent, context )
        : evaluate( node.alternate, context );

    case 'Identifier':
      return context[node.name];

    case 'Literal':
      return node.value;

    case 'LogicalExpression':
      return evaluateBinop(node.operator, evaluate( node.left, context ), evaluate( node.right, context ) );

    case 'MemberExpression':
      return evaluateMember(node, context)[1];

    case 'ThisExpression':
      return context;

    case 'UnaryExpression':
      return evaluateUnop(node.operator, evaluate( node.argument, context ) );

    default:
      return undefined;
  }

}

function compile (expression) {
  return evaluate.bind(null, jsep(expression));
}

function setBinopsCallback(callback) {
  binopsCallback = callback;
}

function setUnopsCallback(callback) {
  unopsCallback = callback;
}

function addUnaryOp(op, fun) {
  jsep.addUnaryOp(op);
  unops[op] = fun;
}

function addBinaryOp(op, fun) {
  jsep.addBinaryOp(op);
  binops[op] = fun;
}

module.exports = {
  parse: jsep,
  eval: evaluate,
  compile: compile,
  setUnopsCallback: setUnopsCallback,
  setBinopsCallback: setBinopsCallback,
  addUnaryOp: addUnaryOp, 
  addBinaryOp: addBinaryOp
};
