/* eslint-disable no-unused-vars,indent */
import * as esprima from 'esprima';
let tableInfo = [];
var functionCode;
let globalsVars=[];
const parseCode = (codeToParse) => {
    tableInfo.clear;
    functionCode=getCodeGlobalAndFunc(codeToParse);
    let ans= esprima.parseScript(functionCode,{loc:true});
    return ans;

};

export {parseCode};
export {makeArray};
export {tableInfo,globalsVars,functionCode};


const statmentType = {
    'FunctionDeclaration': functionHeader,
    'VariableDeclaration': parseVar,
    'ExpressionStatement': parseExpression,
    'ReturnStatement': parseReturn,
    'WhileStatement': parseWhile,
    'IfStatement': parseIf,
    //'ForStatement': parseFor,
    'AssignmentExpression': parseAssignment,
    'UpdateExpression':parseUpdate,
    'BinaryExpression': parseBinaryExpression,
    'LogicalExpression':parseBinaryExpression,
    'UnaryExpression':parseUnaryExpression,
    'MemberExpression':parseMemberExpression,
    'ArrayExpression':parseArrayExpression,
    'Identifier':parseIdentifier,
    'Literal': parseLiteral
};

function parseBinaryExpression(value)
{
    return getBinaryExpVal(value);
}

function parseIdentifier(value)
{
    return value.name;
}

function parseLiteral(value)
{
    return value.raw;
}

function parseUnaryExpression(value)
{
    return value.operator+' '+getValue(value.argument);
}

function parseArrayExpression(value)
{
    let ans='[';
    for(let i=0;i<value.elements.length;i++){
        ans+=getValue(value.elements[i])+',';
    }
    return ans.substring(0,ans.length-1)+']';
}

function parseMemberExpression(value)
{
    return value.object.name+' [ '+getValue(value.property)+' ] ';
}
function getValue(value) {
    return statmentType[value.type](value);
}

function getCodeGlobalAndFunc(codeToParse)
{//save the global variables from the code and direct to
    // different function that stores the function lines
    let lines=codeToParse.split('\n');
    lines=clean(lines);
    let i=0;
    let count=0;
    globalsVars=[];
    while(i < lines.length && !(lines[i].includes('('))) {
        globalsVars[count]=lines[i];
        i++;
        count++;}
    let j=lines.length-1;
    while(j >= 0 && !lines[j].includes('}')) {
        globalsVars[count]=lines[j];
        j--;
        count++;
        }
    return getFunction(lines, i, j);
}
function getFunction(lines, start, end){
    //this function returns the lines of the function
    let result='';
    for(let row=0; row<lines.length; row++){
        if(row >= start && row <= end)
            result=result+lines[row]+'\n';
    }
    return result;
}
function clean(lines)
{
    //this function cleans the text from blank lines
    //and returns the lines without the empty lines
    for(let row=0;row<lines.length;row++){
        if(lines[row].trim()===''||lines[row].trim()=='\n')
            lines.splice(row,1);
    }
    return lines;
}
function makeArray (ParsedCode) {
    tableInfo.clear;
    tableInfo=[];
        if (ParsedCode!=null&&ParsedCode.body.length > 0) {
            if(isFunc(ParsedCode)) {
                functionHeader(ParsedCode);
                functionBlock((ParsedCode.body)[0].body.body);
            }
            else
                functionBlock((ParsedCode.body));
        }
        return tableInfo;

}
function isFunc(ParsedCode) {
    if((ParsedCode.body)[0].type=='FunctionDeclaration')
        return true;
    return false;
}

function functionHeader(data)
{//handles function's header and parameters
    let name=(data.body)[0].id.name;
    tableInfo.push({Line:data.loc.start.line, Type:'function declaration',Name:name,Condition:'',Value:''});
    for( let i=0;i<((data.body)[0].params).length;i++)
    {
        let param=(data.body)[0].params[i];
        let paramName=param.name;
        tableInfo.push({Line:data.loc.start.line, Type:'variable declaration',Name:paramName,Condition:'',Value:''});
    }
}

function functionBlock(insideBody) {
    for(let j=0;j<insideBody.length;j++)
    {
        parseItem(insideBody[j]);
    }
}

function parseVar(insideBody) {
    for(var j=0 ;j<(insideBody.declarations).length;j++)
    {
        let declaration=insideBody.declarations[j];
        let name=declaration.id.name;
        let value='null';
        if(declaration.init!=null)
            value=getValue(declaration.init);
        tableInfo.push({Line:insideBody.loc.start.line, Type:'variable declaration',
                        Name:name,Condition:'', Value:value});
    }
}

function getBinaryExpVal(binaryValue)
{
    let left=simpleBinary(binaryValue.left);
    let operator=binaryValue.operator;
    let right=simpleBinary(binaryValue.right);
    return left+' '+operator+' '+right;
}
function simpleBinary(oneSide) {
    let temp= statmentType[oneSide.type](oneSide);
    if(oneSide.type==('BinaryExpression'))
        oneSide='( '+temp+' )';
    else
        oneSide=temp;
    return oneSide;
}
// function simpleBinary(oneSide) {
//     let temp;
//     if (oneSide.type=='BinaryExpression')
//         temp= '('+getBinaryExpVal(oneSide)+')';
//     else if (oneSide.type=='Literal')
//         temp= oneSide.raw;
//     else if (oneSide.type=='Identifier')
//         temp= oneSide.name;
//     else
//         temp=moreChecks(oneSide);
//     return temp;
//     //maybe add member expression
// }
// function moreChecks(oneSide) {
//     let temp;
//     if(oneSide.type=='UnaryExpression')
//         temp= oneSide.operator+' '+oneSide.argument.value;
//     if(oneSide.type=='MemberExpression')
//         temp= parseMember(oneSide);
//     if(oneSide.type=='ArrayExpression')
//         temp= parseArray(oneSide);
//     return temp;
// }

function parseItem(item) {
    statmentType[item.type](item);
}

function parseExpression(insideBody){
    statmentType[insideBody.expression.type](insideBody.expression);
}

function parseReturn(insideBody) {
    let returnValue=getValue(insideBody.argument);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'return statement',
        Name:'',Condition:'', Value:returnValue});
}

function parseWhile(insideBody) {
    let cond=getBinaryExpVal(insideBody.test);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'while statement',
        Name:'',Condition:cond, Value:''});
    functionBlock(insideBody.body.body);

}
function parseIf(insideBody,type) {
    let cond=statmentType[insideBody.test.type](insideBody.test);
    if(type==null)
        type='if statement';
    tableInfo.push({Line:insideBody.loc.start.line, Type:type,
        Name:'',Condition:cond, Value:''});
    //handle the block of if
    let consequent=insideBody.consequent;
    if(consequent.type=='BlockStatement')
        functionBlock(consequent.body);
    else
        parseItem(consequent);
    continueParseIf(insideBody,type);
}

function continueParseIf(insideBody,type){
    if (insideBody.alternate!= null)
        parseElse(insideBody.alternate);
}
function parseElse(alternate) {
    if(alternate.type=='IfStatement')
        parseIf(alternate,'else if statement');
    else {
        let line;
        line=(tableInfo[tableInfo.length-1].Line)+1;
        tableInfo.push({
            Line: line, Type: 'else statement', Name: '', Condition: ' ', Value: ''
        });

        if (alternate.type == 'BlockStatement')
            functionBlock(alternate.body);
        else
            parseItem(alternate);
    }
}
// function parseFor(insideBody) {
//     let value=getValue(insideBody.init.declarations[0].init);
//     let cond=insideBody.init.declarations[0].id.name+'='+value;
//     cond=cond+';'+getBinaryExpVal(insideBody.test)+';'
//         +insideBody.update.argument.name
//         +insideBody.update.operator;
//     tableInfo.push({Line:insideBody.loc.start.line, Type:'for statement',
//         Name:'',Condition:cond, Value:''});
//     functionBlock(insideBody.body.body);
// }
function parseAssignment(insideBody) {
    let name=getValue(insideBody.left);
    let right=getValue(insideBody.right);
    tableInfo.push({Line:insideBody.loc.start.line, Type:'assignment expression',
        Name:name,Condition:' ', Value:right});
}
function parseUpdate(insideBody) {
    let name=insideBody.argument.name;
    let operator=insideBody.operator;
    tableInfo.push({Line:insideBody.loc.start.line, Type:'update expression',
        Name:name,Condition:' ', Value:name+''+operator});
}

