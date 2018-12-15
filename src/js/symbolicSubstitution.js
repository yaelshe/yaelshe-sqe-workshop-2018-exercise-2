import {tableInfo,globalsVars,functionCodeOnly} from './code-analyzer';
import * as esprima from 'esprima';

let argsVars=new Map();
let newLines=[];
let oldLines=[];
let newLineCounter=0;
let oldLinesCounter=0;
let tableLinesCounter=1;
let colors=new Map();

const statmentType = {
    'variable declaration': varDeclaration,
    'assignment expression': varAssignment,
    'While Statement': condition,
    'if statement': condition,
    'else if statement': condition,
    'else statement': copyAsIs,
    'return statement': returnStatement,
    'BinaryExpression': BinaryExpression,
    'LogicalExpression':BinaryExpression,
    'UnaryExpression':UnaryExpression,
    'MemberExpression':MemberExpression,
    'ArrayExpression':ArrayExpression,
    'Identifier':Identifier,
    'Literal': Literal
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
    '&&' : and
};
const handleColorExpressionType = {
    'BinaryExpression': BinaryExpressionColor,
    'LogicalExpression' : BinaryExpressionColor,
    'Identifier' : IdentifierColor,
    'Literal' : LiteralColor,
    'UnaryExpression' : UnaryExpressionColor,
    'MemberExpression' : MemberExpressionColor
};

function clean(lines)
{
    for(var x=0  ;x<lines.length;x++){
        if(lines[x].trim()===''||lines[x].trim()=='\n')
            lines.splice(x,1);
    }
    return lines;
}
function functionAfterSubs(codeToParse,input) {
    initiate();
    saveFuncArgs(input);
    saveGlobals();
    let temp=functionCodeOnly.replace(new RegExp('}', 'g'),'}\n');
    oldLines=temp.split('\n');
    oldLines=clean(oldLines);
    substitute(new Map());
}

function initiate() {
    // initialization of the global variables and the program
    argsVars=new Map();
    newLines=[];
    oldLines=[];
    newLineCounter=0;
    oldLinesCounter=0;
    tableLinesCounter=1;
    colors=new Map();
}

export {functionAfterSubs,colors};
export {newLines};

function checkIfOnlyOneInArray(var1) {
    if(var1.charAt(0)=='[' && var1.charAt(var1.length-1)==']')
        return true;
    else
        return false;
}

//extract from parseInfo all function args
function saveFuncArgs(input) {
    let temp=0;
    input=input.replace(/\s/g, '');
    let start=input.indexOf('(')+1;
    let end=input.indexOf(')');
    input=input.substring(start, end);
    let vars=input.split(',');
    for(let i=1;i<tableInfo.length;i++) {
        if(tableInfo[i].Line>1) return;
        if(vars[temp].charAt(0)=='['){//check for array
            checkIfOnlyOneInArray(vars[temp]);
            let arr=[];
            let index=0; //arr index
            index=findAllArr(temp,vars,arr,index);
            temp+=index;
            argsVars.set(tableInfo[i].Name, arr);}
        else{
            argsVars.set(tableInfo[i].Name, returnValue(vars[temp]));
            temp++;}}
}

function returnValue(varReturn) {
    if(varReturn=='true' || varReturn=='false')
        return JSON.parse(varReturn);
    else if(isString(varReturn))
        return varReturn.slice(1,-1);
    else
        return varReturn;
}

function isString(varReturn){
    return (varReturn.charAt(0)=='\'' && varReturn.charAt(varReturn.length-1)=='\'') || (varReturn.charAt(0)=='"' && varReturn.charAt(varReturn.length-1)=='"');
}

function handleCurrArr(temp, vars, arr, index) {
    while(temp<vars.length){
        if((vars[temp].charAt(0)=='[')){
            arr[index]=returnValue(vars[temp].substring(1));
            temp++;
            index++;
        } else if(vars[temp].charAt(vars[temp].length-1)==']'){
            arr[index]=returnValue(vars[temp].slice(0,-1));
            temp++;
            index++;
            return index;
        }
        else{
            arr[index]=returnValue(vars[temp]);
            temp++;
            index++;
        }
    }
    // return index;
}

function findAllArr(temp,vars,arr,index){
    //start
    if(checkIfOnlyOneInArray(vars[temp]))
        arr[index]=returnValue(vars[temp].slice(1,-1));
    else {
        index=handleCurrArr(temp,vars,arr,index);
    }
    return index;
}

function saveGlobals() {
    for(let i=0;i<globalsVars.length;i++)
    {
        let x = esprima.parseScript(globalsVars[i]+'');
        if(x.body.length>0 &&(x.body)[0].type=='VariableDeclaration'){
            let name=(x.body)[0].declarations[0].id;
            //let func = typeToHandlerMapping[(x.body)[0].declarations[0].init.type];//what king of expression
            let value= statmentType[(x.body)[0].declarations[0].init.type]((x.body)[0].declarations[0].init);
            //let value = func.call(undefined, (x.body)[0].declarations[0].init);
            argsVars.set(name.name,value);
        }
        else
            continue;
    }
}

function substituteBlock(localVars,endOfScopeLine) {
    while(oldLinesCounter<=endOfScopeLine) {
        let temp=oldLines[oldLinesCounter];
        temp=temp.replace(/\s/g, '');
        if((temp=='}') || (temp=='{') || !(temp.length)){//if line not in table
            // newLines[newLineCounter]=oldLines[oldLinesCounter];
            // newLineCounter++;
            copyAsIs(localVars);
            oldLinesCounter++;
        }
        else{
            handleTableLine(localVars);
        }
        checkIfSubstitute(endOfScopeLine,localVars);
    }
}

function checkIfSubstitute(endOfScopeLine,localVars){
    if(oldLinesCounter<=endOfScopeLine && oldLines[oldLinesCounter].includes('{'))
        substitute(localVars);
    else
        return;
}

//go throw code lines and substitute
function substitute(localVars) {
    while(oldLinesCounter<oldLines.length){
        let newlocalVars=new Map(localVars);
        let endOfScopeLine=findEndOfScopeLine();
        substituteBlock(newlocalVars,endOfScopeLine);
    }
}
//start from oldLinesCounter - find end of scope by { }
function findEndOfScopeLine() {
    let openCount=updateFirstCounter(0);
    if(openCount==0)
        return oldLinesCounter;
    for(let i=oldLinesCounter+1;i<oldLines.length;i++){
        openCount=checkSoger(i,openCount);
        if(openCount==0)
            return i;
        else
            openCount=checkPoteach(i,openCount);
    }
    return oldLines.length-1;
}

function updateFirstCounter(openCount){
    if(oldLines[oldLinesCounter].includes('{'))
        openCount++;
    if(oldLines[oldLinesCounter].includes('}') && (oldLines[oldLinesCounter].indexOf('}'))>(oldLines[oldLinesCounter].indexOf('{')))
        openCount--;
    return openCount;
}

function checkPoteach(i,openCount) {
    if(oldLines[i].includes('{'))
        openCount++;
    return openCount;
}
function checkSoger(i,openCount){
    if(oldLines[i].includes('}'))
        openCount--;
    return openCount;
}

function getTabs() {
    for(let i=0;i<oldLines[oldLinesCounter].length;i++){
        if(oldLines[oldLinesCounter].charAt(i)!='\t' && oldLines[oldLinesCounter].charAt(i)!=' '){
            return oldLines[oldLinesCounter].substring(0,i);
        }
        else
            continue;
    }
}

//given a "line" in table - check if needed to substitute/add to locals/ad as is to newLines
function handleTableLine(localVars) {
    if(tableLinesCounter==1) //function header
        copyAsIs(localVars);
    else {
        let currTableLines=getLinesFromTableInfo();
        handleLineFromTable(currTableLines,localVars);

    }
    oldLinesCounter++;
    tableLinesCounter++;
}

function handleLineFromTable(currTableLines,localVars) {
    for (let i=0;i<currTableLines.length;i++)
    {
        let value= statmentType[currTableLines[i].Type](currTableLines[i],localVars);
        if(currTableLines[i].Type!='variable declaration' && currTableLines[i].Type!='assignment expression' && value!=undefined)
        {
            newLines[newLineCounter]=value;
            newLineCounter++;
        }
    }
}

function varDeclaration(currItem,localVars) {
    let newVal = checkForLocals(currItem.Value,localVars);
    localVars.set((currItem.Name), newVal);
}

function findExplicitVal(Value) {
    let x = esprima.parseScript(Value+'');
    let ans= handleColorExpressionType[(x.body)[0].expression.type]((x.body)[0].expression);
    return ans;
}

function handleArrAssignment(x,localVars,newVal) {
    let arrName=x.object.name;
    let index=checkForLocals(x.property.name, localVars);
    index=findExplicitVal(index);
    newVal=findExplicitVal(newVal);
    if(argsVars.has(arrName)){//global array
        argsVars.get(arrName)[index]=newVal;
        newLines[newLineCounter] = getTabs() + arrName+' [ '+index+' ] ' + '=' + newVal + ';';
        newLineCounter++;
    } else {//local array
        localVars.get(arrName)[index]= newVal;}
}

function varAssignment(currItem,localVars) {
    let newVal = checkForLocals(currItem.Value, localVars);
    let x=esprima.parseScript(currItem.Name+'').body[0].expression;//left
    if(x.type=='MemberExpression'){//array
        handleArrAssignment(x,localVars,newVal);
    }
    else if (argsVars.has(currItem.Name)) {//is global
        argsVars.set(currItem.Name, newVal);
        newLines[newLineCounter] = getTabs() + currItem.Name + '=' + newVal + ';';
        newLineCounter++;
    } else {//local var
        localVars.set(currItem.Name, newVal);
    }
}

//while or if or if else
function condition(currItem,localVars) {
    let newCondition = checkForLocals(currItem.Condition,localVars);
    let oldLine=oldLines[oldLinesCounter];
    let newLine=oldLine.substring(0,oldLine.indexOf('(')+1)+newCondition+oldLine.substring(oldLine.lastIndexOf(')'),oldLine.length);
    if(currItem.Type=='if statement' || currItem.Type=='else if statement'){
        findColor(newCondition);
    }
    return newLine;
}

function returnStatement(value,localVars)
{
    return getTabs()+'return ' + checkForLocals(value.Value,localVars)+';';
}

function checkForLocals(Value,localVars) {
    if(Value=='null(or nothing)')
        return;
    else {
        let x = esprima.parseScript(Value+'');
        return statmentType[(x.body)[0].expression.type]((x.body)[0].expression,localVars);
    }
}

function BinaryExpression(expression,localVars)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSide(left,localVars);
    right=binaryOneSide(right,localVars);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    if(res==null) {
        if (expression.operator == '*' || expression.operator == '/')
            return '(' + left + ') ' + expression.operator + ' ' + right;
        else
            return left + ' ' + expression.operator + ' ' + right;
    }else
        return res;
}

//check for zeros or only numbers
function calculate(left, right, operator) {
    let leftNum=Number(left);
    let rightNum=Number(right);
    try{
        return mathOperatorType[operator](leftNum,rightNum,left,right);
    }
    catch (exception) {
        return null;
    }
}

function plus(leftNum,rightNum,left,right) {
    if(leftNum==0)
        return right;
    else if(rightNum==0)
        return left;
    else if((isNaN(leftNum) || isNaN(rightNum)))
        return null;
    else
        return leftNum+rightNum;
}
function minus(leftNum,rightNum,left,right) {
    if(rightNum==0 && right!=null)
        return left;
    else if((isNaN(leftNum) || isNaN(rightNum)))
        return null;
    else
        return leftNum-rightNum;
}
function multi(leftNum,rightNum,left,right) {
    if(!(isNaN(leftNum)) && !(isNaN(rightNum)) &&(left!=null && right!=null))
        return leftNum*rightNum;
    else
        return null;
}
function divide(leftNum,rightNum,left,right) {
    if(!(isNaN(leftNum) && isNaN(rightNum)) &&(left!=null && right!=null))
        return leftNum/rightNum;
    else
        return null;
}

function binaryOneSide(left,localVars) {
    let temp= statmentType[left.type](left,localVars);
    if(left.type==('BinaryExpression'))
        left=''+temp;
    else
        left=temp;
    return left;
}

function Identifier(value,localVars)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return value.name;
}

function Literal(value,localVars)
{
    if(localVars==null)
        return value.raw;
    else
        return value.raw;
}

function UnaryExpression(value,localVars)
{
    let newVal= statmentType[value.property.type](value.property,localVars);
    return value.operator+' '+newVal;
}

function MemberExpression(value,localVars)
{
    let indexVal= statmentType[value.property.type](value.property,localVars);
    if(indexVal=='length')
        return value.object.name+'.length';
    else if(argsVars.has(indexVal))
        indexVal=argsVars.get(indexVal);
    if(localVars.has(value.object.name))
        return localVars.get(value.object.name)[indexVal];
    else
        return value.object.name+' [ '+indexVal+' ] ';
}

function ArrayExpression(value,localVars)
{
    let ans=[];
    for(let i=0;i<value.elements.length;i++){
        ans[i]= statmentType[value.elements[i].type](value.elements[i],localVars);
    }
    return ans;
}

//copy from old to new as is (by counters)
function copyAsIs(localVars) {
    let temp=oldLines[oldLinesCounter];
    if(!temp.replace(/\s/g, '').length && localVars!=null)
        return;
    else {
        newLines[newLineCounter]=oldLines[oldLinesCounter];
        newLineCounter++;
    }

}

//returns all lines from table with "Line" value of tableLinesCounter
function getLinesFromTableInfo() {
    let ans=[];
    for(let i=0;i<tableInfo.length;i++)
    {
        if(tableInfo[i].Line>tableLinesCounter)
            return ans;
        else {
            if(tableInfo[i].Line==tableLinesCounter)
                ans.push(tableInfo[i]);}
    }
    return ans;
}

//get line and find&return color
function findColor(condition) {
    let x = esprima.parseScript(condition+'');
    let ans = handleColorExpressionType[(x.body)[0].expression.type]((x.body)[0].expression);
    colors.set(newLineCounter,ans);
}

function BinaryExpressionColor(expression) {
    let left = expression.left;
    let right = expression.right;
    left = binaryOneSideC(left);
    right = binaryOneSideC(right);
    //calculate if possible
    let res = calculate(left, right, expression.operator);
    if (res == null) {
        try {
            return logicOperatorType[expression.operator](left, right);
        }
        catch (exception) {
            return res;
        }
    }
    return res;
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
function notEqual(left,right) {
    return left!=right;
}
function or(left,right) {
    return left||right;
}
function and(left,right) {
    return left&&right;
}

function binaryOneSideC(left)
{ //finish
    //let func = typeToHandlerMappingColor[left.type];
    //let temp= func.call(undefined,left);
    let temp= handleColorExpressionType[left.type](left);
    return temp;
}

//var
function IdentifierColor(value) {
    return argsVars.get(value.name);
}

function LiteralColor(value) {
    return value.value;
}

function UnaryExpressionColor(value)
{//finish
    //let func = typeToHandlerMappingColor[value.argument.type];
    //let newVal= func.call(undefined,value.argument);
    let newVal= handleColorExpressionType[value.argument.type](value.argument);
    return calculate('0',newVal,value.operator);
}

function MemberExpressionColor(value)
{//finish
    //let func = typeToHandlerMappingColor[value.property.type];
    let indexVal=value.property.name;
    if(indexVal==undefined || !indexVal=='length')
        handleColorExpressionType[value.property.type](value.property);
        //indexVal= func.call(undefined,value.property);

    // if(argsVars.has(value.object.name)) {
    if (indexVal == 'length')
        return (argsVars.get(value.object.name)).length;
    else
        return (argsVars.get(value.object.name))[indexVal];
    // }
    // else
    //     return null;
}