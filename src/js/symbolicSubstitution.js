import {tableInfo,globalsVars,functionCode} from './code-analyzer';
import * as esprima from 'esprima';

let args=new Map();
let colors=new Map();
let newLines=[];
let oldLines=[];
let newLineCounter=0;
let oldLinesCounter=0;
let tableLinesCounter=1;

export {startSubstitution,colors};
export {newLines};

const stateOrExpType = {
    'variable declaration': saveVar,
    'assignment expression': varAssignment,
    'while statement': parseCondition,
    'if statement': parseCondition,
    'else if statement': parseCondition,
    'else statement': duplicate,
    'return statement': parseReturnStatement,
    'BinaryExpression': parseBinaryExpression,
    'LogicalExpression':parseBinaryExpression,
    'UnaryExpression':parseUnaryExpression,
    'MemberExpression':parseMemberExpression,
    'ArrayExpression':parseArrayExpression,
    'Identifier':parseIdentifier,
    'Literal': parseLiteral
};

const mathOperatorType = {
    '+' :plus,
    '-' : minus,
    '*' : multi,
    '/' : divide
};

const logicOperatorType = {
    '<' :smaller,
    '>' : bigger,
    '<=' : smallerEq,
    '>=' : biggerEq,
    '==' :equal,
    '!=' : notEqual,
    '||' : or,
    '&&' : and,
    '===' :strongEqual
};
const colorExpressionType = {
    'BinaryExpression': BinaryExpressionColor,
    'LogicalExpression' : BinaryExpressionColor,
    'Identifier' : identifierColor,
    'Literal' : literalColor,
    'UnaryExpression' : unaryExpressionColor,
    'MemberExpression' : memberExpressionColor
};

function clean(lines)
{
    for(let row=0; row < lines.length; row++){
        if(lines[row].trim()==='' || lines[row].trim()=='\n')
            lines.splice(row,1);
    }
    return lines;
}
function startSubstitution(codeToParse, argsInput) {
    args=new Map();
    colors=new Map();
    newLines=[];
    oldLines=[];
    newLineCounter=0;
    oldLinesCounter=0;
    tableLinesCounter=1;
    let temp=functionCode.replace(new RegExp('}', 'g'),'}\n');
    oldLines=temp.split('\n');
    oldLines=clean(oldLines);
    getGlobals();
    getArgs(argsInput);
    substitute(new Map());
}

//This function getArgs stores the arguments for the function
// exmple:foo(1,2,3)
function getArgs(input) {
    let temp=0;
    input=input.replace(/\s/g, '');
    let start=input.indexOf('(')+1;
    let end=input.indexOf(')');
    input=input.substring(start, end);
    let vars=input.split(',');
    for(let i=1;i<tableInfo.length;i++) {
        if(tableInfo[i].Line>1) return;
        if(vars[temp].charAt(0)=='['){
            let array=[];
            let index=0;
            index=getAllArray(temp,vars,array,index);
            temp=temp+index;
            args.set(tableInfo[i].Name, array);}
        else{
            args.set(tableInfo[i].Name, returnValue(vars[temp]));
            temp++;}}
}

function singleElementArray(element) {
    if(element.charAt(0)=='[' && element.charAt(element.length-1)==']')
        return true;
    else return false;
}

function returnValue(varReturn) {
    if(varReturn === 'true' || varReturn === 'false')
        return JSON.parse(varReturn);
    else if(validString(varReturn))
        return varReturn.slice(1,-1);
    else
        return varReturn;
}

function validString(varReturn){
    return(varReturn.charAt(0)=='"' && varReturn.charAt(varReturn.length-1)=='"')||
        (varReturn.charAt(0)=='\'' && varReturn.charAt(varReturn.length-1)=='\'');
}

function getAllArray(temp,vars,array,index) {
    if(singleElementArray(vars[temp]))
        array[index]=returnValue(vars[temp].slice(1,-1));
    else {
        index=parseCurrArr(temp,vars,array,index);}
    return index;
}

function parseCurrArr(temp, vars, array, index) {
    while(temp < vars.length)
    {
        if((vars[temp].charAt(0) == '['))
        {
            array[index] = returnValue(vars[temp].substring(1));
            index++;
            temp++;}
        else if(vars[temp].charAt(vars[temp].length-1) == ']')
        {
            array[index] = returnValue(vars[temp].slice(0,-1));
            index++;
            temp++;
            return index;}
        else {
            array[index] = returnValue(vars[temp]);
            index++;
            temp++;}
    }
}

function getGlobals()
{
    for(let i=0 ;i < globalsVars.length; i++) {
        let glob = esprima.parseScript(globalsVars[i]+'');
        if(glob.body.length > 0 && (glob.body)[0].type == 'VariableDeclaration'){
            let name = (glob.body)[0].declarations[0].id;
            let value = stateOrExpType[(glob.body)[0].declarations[0].init.type]((glob.body)[0].declarations[0].init);
            args.set(name.name,value);
        }
    }
}

function parseBlock(localVars,endOfScope) {
    while (oldLinesCounter <= endOfScope) {
        let temp = oldLines[oldLinesCounter];
        temp = temp.replace(/\s/g, '');
        if (temp == '}' || (temp == '{') || !(temp.length)) {

            duplicate(localVars);
            oldLinesCounter++;
        }
        else {
            parseTableLine(localVars);
        }
        checkForSub(endOfScope, localVars);
    }
}

function checkForSub(endOfScope,localVars){
    if(oldLinesCounter <= endOfScope && oldLines[oldLinesCounter].includes('{'))
        substitute(localVars);
}

function substitute(localVars) {
    while(oldLinesCounter<oldLines.length){
        let newLocalVars=new Map(localVars);
        let endOfScope=getEndOfScope();
        parseBlock(newLocalVars,endOfScope);
    }
}

function getEndOfScope() {
    let startCount = updateStartCount(0);
    if(startCount == 0)
        return oldLinesCounter;
    for(let i = oldLinesCounter+1; i < oldLines.length; i++)
    {
        startCount=checkClosing(i,startCount);
        if(startCount==0)
            return i;
        else
            startCount=checkOpening(i,startCount);
    }
    return oldLines.length-1;
}

function updateStartCount(startCount){
    if(oldLines[oldLinesCounter].includes('{'))
        startCount++;
    if(oldLines[oldLinesCounter].includes('}') && (oldLines[oldLinesCounter].indexOf('}'))>(oldLines[oldLinesCounter].indexOf('{')))
        startCount--;
    return startCount;
}

function checkOpening(index,startCount) {
    if(oldLines[index].includes('{'))
        startCount++;
    return startCount;
}
function checkClosing(index,startCount){
    if(oldLines[index].includes('}'))
        startCount--;
    return startCount;
}

function getTabs() {
    for(let i=0;i<oldLines[oldLinesCounter].length;i++)
    {
        if(oldLines[oldLinesCounter].charAt(i)!='\t' && oldLines[oldLinesCounter].charAt(i)!=' ')
        {
            return oldLines[oldLinesCounter].substring(0,i);
        }
    }
}

function parseTableLine(localVars)
{
    if(tableLinesCounter == 1)
        duplicate(localVars);
    else {
        let currentTableLines = getLinesFromTableInfo();
        parseLine(currentTableLines,localVars);
    }
    oldLinesCounter++;
    tableLinesCounter++;
}

function parseLine(currentTableLines,localVars)
{
    for (let i=0;i<currentTableLines.length;i++)
    {
        let value= getTypeCurrentLine(currentTableLines,i,localVars);
        if(currentTableLines[i].Type!='variable declaration' && currentTableLines[i].Type!='assignment expression' && value!=undefined)
        {
            newLines[newLineCounter]=value;
            newLineCounter++;
        }
    }
}
function getTypeCurrentLine(currentTableLines, i, localVars)
{
    if(currentTableLines[i].Type=='update expression')
    {
        currentTableLines[i].Value=currentTableLines[i].Value.substring(0,currentTableLines[i].Value.length-1)+'1';
        return varAssignment(currentTableLines[i],localVars);
    }
    else{
        return stateOrExpType[currentTableLines[i].Type](currentTableLines[i],localVars);
    }
}

function saveVar(currItem,localVars)
{
    let newValue = checkLocals(currItem.Value,localVars);
    localVars.set((currItem.Name), newValue);
}

function getExplicitVal(localVars,Value)
{
    let value = esprima.parseScript(Value+'');
    return colorExpressionType[(value.body)[0].expression.type](localVars,(value.body)[0].expression);

}

function parseArrayAssignment(array,localVars,newValue)
{
    let arrayName=array.object.name;
    let index = colorExpressionType[array.property.type](localVars, array.property);
    index=checkLocals(index, localVars);
    index=getExplicitVal(localVars,index);
    newValue=getExplicitVal(localVars,newValue);
    if(args.has(arrayName))
    {
        args.get(arrayName)[index]=newValue;
        newLines[newLineCounter] = getTabs() + arrayName+' [ '+index+' ] ' + '=' + newValue + ';';
        newLineCounter++;
    }
    else {
        localVars.get(arrayName)[index]= newValue;
    }
}

function varAssignment(currItem,localVars) {
    let left = esprima.parseScript(currItem.Name+'').body[0].expression;
    let newValue = checkLocals(currItem.Value, localVars);
    if(left.type == 'MemberExpression'){
        parseArrayAssignment(left,localVars,newValue);
    }
    else if (args.has(currItem.Name))
    {
        args.set(currItem.Name, getExplicitVal(localVars,newValue));
        newLines[newLineCounter] = getTabs() + currItem.Name + '=' + newValue + ';';
        newLineCounter++;
    }
    else {
        localVars.set(currItem.Name, newValue);
    }
}


function parseCondition(condition,localVars) {
    let newCondition = checkLocals(condition.Condition,localVars);
    let oldLine=oldLines[oldLinesCounter];
    let newLine=oldLine.substring(0,oldLine.indexOf('(')+1)+newCondition+oldLine.substring(oldLine.lastIndexOf(')'),oldLine.length);
    if(condition.Type=='if statement' || condition.Type=='else if statement'){
        getColor(localVars,newCondition);
    }
    return newLine;
}

function parseReturnStatement(value,localVars)
{
    let result=getTabs()+'return ' + checkLocals(value.Value,localVars)+';';
    return result;
}

function checkLocals(value,localVars)
{
    if(value == 'null')
        return;
    else {
        let newValue = esprima.parseScript(value+'');
        return stateOrExpType[(newValue.body)[0].expression.type]((newValue.body)[0].expression,localVars);
    }
}

function parseBinaryExpression(expression,localVars)
{
    let left=simpleBinaryExp(expression.left,localVars);
    let right=simpleBinaryExp(expression.right,localVars);
    let operator= expression.operator;
    let result=solve(left,right,operator);
    if(result == null) {
        if (expression.operator == '*' || expression.operator == '/')
            return '('+left+') '+expression.operator+' '+right;
        else
            return left+' '+expression.operator+' '+right;
    }else
        return result;
}


function solve(left, right, operator)
{
    let leftValue=Number(left);
    let rightValue=Number(right);
    try{
        return mathOperatorType[operator](leftValue,rightValue,left,right);
    }
    catch (exception) {
        return null;
    }
}

function plus(leftValue, rightValue, left, right)
{
    if(leftValue == 0)
        return right;
    else if(rightValue == 0)
        return left;
    else if((isNaN(leftValue) || isNaN(rightValue)))
        return null;
    else
        return leftValue+rightValue;
}

function minus(leftValue, rightValue, left, right)
{
    if(rightValue == 0 && right != null)
        return left;
    else if((isNaN(leftValue) || isNaN(rightValue)))
        return null;
    else
        return leftValue-rightValue;
}

function multi(leftValue, rightValue, left, right)
{
    if(!(isNaN(leftValue)) && !(isNaN(rightValue)) &&(left != null && right != null))
        return leftValue*rightValue;
    else
        return null;
}
function divide(leftValue, rightNum, left, right)
{
    if(!(isNaN(leftValue) && isNaN(rightNum)) &&(left != null && right != null))
        return leftValue/rightNum;
    else
        return null;
}

function simpleBinaryExp(left,localVars)
{
    let temp= stateOrExpType[left.type](left,localVars);
    if(left.type == ('BinaryExpression'))
        left=''+temp;
    else
        left=temp;
    return left;
}

function parseUnaryExpression(value,localVars)
{
    let newValue= stateOrExpType[value.argument.type](value.argument,localVars);
    return value.operator+' '+newValue;
}

function parseMemberExpression(value,localVars)
{
    let indexValue= stateOrExpType[value.property.type](value.property,localVars);
    if(indexValue=='length')
        return value.object.name+'.length';
    else if(args.has(indexValue))
        indexValue=args.get(indexValue);
    if(localVars.has(value.object.name))
        return localVars.get(value.object.name)[indexValue];
    else
        return value.object.name+' [ '+indexValue+' ] ';
}

function parseArrayExpression(value,localVars)
{
    let result=[];
    for(let i = 0; i < value.elements.length; i++){
        result[i]= stateOrExpType[value.elements[i].type](value.elements[i],localVars);
    }
    return result;
}
function parseIdentifier(value,localVars)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return value.name;
}

function parseLiteral(value,localVars)
{
    if(localVars==null)
        return value.raw;
    return value.raw;
}


function duplicate(localVars)
{//this function duplicates lines that don't need to change
    let temp=oldLines[oldLinesCounter];
    if(!temp.replace(/\s/g, '').length && localVars != null)
        return;
    else {
        newLines[newLineCounter]=oldLines[oldLinesCounter];
        newLineCounter++;
    }

}

function getLinesFromTableInfo()
{
    let result=[];
    for(let i=0;i<tableInfo.length;i++)
    {
        if(tableInfo[i].Line > tableLinesCounter)
        {
            if(result.length==0)
                result =checkIfResultEmpty(result,i);
            return result;
        }
        else {
            if(tableInfo[i].Line == tableLinesCounter)
                result.push(tableInfo[i]);
        }
    }
    return result;
}
function checkIfResultEmpty(result,i){
    for(let j=i;j<tableInfo.length;j++)
    {
        if(tableInfo[j].Line > tableLinesCounter)
            result.push(tableInfo[j]);}
    return result;
}

function BinaryExpressionColor(localVars,binExpression)
{
    let left = simpleBinaryExpColor(localVars,binExpression.left);
    let right = simpleBinaryExpColor(localVars,binExpression.right);
    let result = solve(left, right, binExpression.operator);
    if (result == null) {
        return logicOperatorType[binExpression.operator](left, right);
    }
    return result;
}
function simpleBinaryExpColor(localVars,left)
{
    let temp= colorExpressionType[left.type](localVars,left);
    return temp;
}

function smaller(left,right) {
    return left<right;
}
function bigger(left,right) {
    return left>right;
}
function smallerEq(left,right) {
    return left<=right;
}
function biggerEq(left,right) {
    return left>=right;
}
function equal(left,right) {
    return left==right;
}
function strongEqual(left,right) {
    return left===right;
}

function notEqual(left,right) {
    return left!=right;
}
function or(left,right) {
    return left||right;
}
function and(left,right) {
    return left&&right;
}

function identifierColor(localVars,value) {
    let name=value.name;
    if(localVars.has(name))
        return localVars.get(value.name);
    else
        return args.get(value.name);
}

function literalColor(localVars,value) {
    return value.value;
}

function unaryExpressionColor(localVars,value)
{
    let newValue= colorExpressionType[value.argument.type](localVars,value.argument);
    if(value.operator=='!')
        return !newValue;
    else
        return solve('0',newValue,value.operator);
}

function memberExpressionColor(localVars,value)
{
    let indexValue = value.property.name;
    if(indexValue == undefined || !indexValue == 'length')
        indexValue=colorExpressionType[value.property.type](localVars,value.property);
    if (indexValue == 'length')
        return (args.get(value.object.name)).length;
    else
        return (args.get(value.object.name))[indexValue];
}

function getColor(localVars,condition)
{//This function get condition line and returns the matching color for
    let value = esprima.parseScript(condition+'');
    let result =colorExpressionType[(value.body)[0].expression.type](localVars,(value.body)[0].expression);
    colors.set(newLineCounter,result);

}